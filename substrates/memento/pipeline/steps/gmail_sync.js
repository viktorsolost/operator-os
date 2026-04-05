/**
 * Gmail sync step.
 *
 * For each Gmail account, fetch messages since last sync.
 * Normalize into per-message captures and write via capture_io.
 */

const fs = require('fs');
const { fetchMessages, getAccounts } = require('../lib/gmail_client');
const { writeCapture, captureExists } = require('../lib/capture_io');
const { computeCaptureHash } = require('../lib/ingest_identity');
const { getLastSync, updateLastSync, updateLastRun, defaultSinceDate, recordFailure } = require('../lib/sync_log');
const { getGmailFilters } = require('../lib/pipeline_config');

const PIPELINE_FILTERS = getGmailFilters();

function getHeader(msg, name) {
  const headers = msg.payload?.headers || [];
  const h = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

function normalizeGmailMessage(msg, account) {
  const subject = getHeader(msg, 'Subject');
  const from = getHeader(msg, 'From');
  const to = getHeader(msg, 'To');
  const cc = getHeader(msg, 'Cc');
  const date = getHeader(msg, 'Date');

  const payload = {
    message_id: msg.id,
    thread_id: msg.threadId,
    thread_subject: subject,
    from: from,
    to: to ? to.split(',').map(s => s.trim()) : [],
    cc: cc ? cc.split(',').map(s => s.trim()) : [],
    date: date,
    snippet: msg.snippet || '',
    labels: msg.labelIds || [],
    account: account,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = `gmail_msg_${account}_${msg.id}`;

  return {
    capture_id: captureId,
    source: 'gmail',
    source_ref: `gmail:${account}:${msg.id}`,
    observation_kind: 'message',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

const CALENDAR_INVITE_PREFIXES = [
  'invitation:',
  'updated invitation:',
  'accepted:',
  'declined:',
  'proposed new time:',
];

/**
 * Returns true if the message is a calendar invitation notification email.
 * Checks the Subject header case-insensitively against known calendar prefixes.
 *
 * @param {object} msg - Raw Gmail message object
 * @returns {boolean}
 */
function isCalendarInvitationEmail(msg) {
  if (PIPELINE_FILTERS && PIPELINE_FILTERS.skip_calendar_invites === false) return false;
  const subject = getHeader(msg, 'Subject').toLowerCase().trimStart();
  return CALENDAR_INVITE_PREFIXES.some(prefix => subject.startsWith(prefix));
}

/**
 * Noise filter for personal-noise accounts only.
 * Skips promotions, social, forums entirely.
 * Skips updates except from protected domains (school, finance, transactional).
 */
const DEFAULT_NOISE_LABELS = new Set([
  'CATEGORY_PROMOTIONS',
  'CATEGORY_SOCIAL',
  'CATEGORY_FORUMS',
]);

const PERSONAL_NOISE_LABELS = PIPELINE_FILTERS && PIPELINE_FILTERS.skip_categories
  ? new Set(PIPELINE_FILTERS.skip_categories.map(c => `CATEGORY_${c.toUpperCase()}`))
  : DEFAULT_NOISE_LABELS;
const PERSONAL_NOISE_ACCOUNTS = Array.isArray(PIPELINE_FILTERS.personal_noise_accounts)
  ? PIPELINE_FILTERS.personal_noise_accounts
  : ['gws-personal'];

const PERSONAL_UPDATES_PROTECTED_DOMAINS = [
  'schoolsbuddy.com',
  'theaquilaschool.com',
  'lebara.com',
  'supabase.com',
  'supabase.io',
  'student-finance',
  'slc.co.uk',
];

function isPersonalNoise(msg, account) {
  if (!PERSONAL_NOISE_ACCOUNTS.includes(account)) return false;
  const labels = msg.labelIds || [];
  if (labels.some(l => PERSONAL_NOISE_LABELS.has(l))) return true;
  if (labels.includes('CATEGORY_UPDATES')) {
    const from = getHeader(msg, 'From').toLowerCase();
    const isProtected = PERSONAL_UPDATES_PROTECTED_DOMAINS.some(d => from.includes(d));
    return !isProtected;
  }
  return false;
}

/**
 * Add candidate project links to a Gmail capture based on subject prefix matching.
 */
function addCandidateLinks(capture, registry) {
  const subject = capture.normalized_payload.thread_subject || '';
  const candidates = [];

  for (const project of registry.projects) {
    if (project.status !== 'active') continue;
    const prefixes = project.source_refs?.gmail_thread_prefixes || [];
    for (const prefix of prefixes) {
      if (subject.includes(prefix)) {
        candidates.push({
          project_id: project.project_id,
          confidence: 'direct',
          basis: [`gmail_thread_prefix:${prefix}`],
        });
        break;
      }
    }
  }

  capture.candidate_project_links = candidates;
}

/**
 * Run Gmail sync.
 *
 * @param {object} registry - The full registry object
 * @returns {Promise<object>} Summary
 */
async function run(registry) {
  const summary = { fetched: 0, written: 0, skipped: 0, skipped_calendar_invites: 0, skipped_personal_noise: 0, errors: [] };

  const runTimestamp = new Date().toISOString();
  const accounts = getAccounts();

  for (const account of Object.keys(accounts)) {
    const lastSync = getLastSync('gmail', account);
    const sinceDate = lastSync
      ? formatDateForQuery(lastSync)
      : defaultSinceDate('gmail');

    console.log(`[gmail_sync] Fetching from ${account} since ${sinceDate}...`);

    try {
      const messages = await fetchMessages(account, sinceDate);
      console.log(`[gmail_sync] ${account}: ${messages.length} messages`);
      summary.fetched += messages.length;

      for (const msg of messages) {
        if (isCalendarInvitationEmail(msg)) {
          summary.skipped_calendar_invites++;
          continue;
        }

        if (isPersonalNoise(msg, account)) {
          summary.skipped_personal_noise++;
          continue;
        }

        const capture = normalizeGmailMessage(msg, account);
        addCandidateLinks(capture, registry);

        if (captureExists('gmail', capture.capture_id, capture.capture_hash)) {
          summary.skipped++;
          continue;
        }
        writeCapture('gmail', capture);
        summary.written++;
      }

      updateLastSync('gmail', account, new Date().toISOString());
    } catch (err) {
      console.error(`[gmail_sync] ${account} failed: ${err.message}`);
      summary.errors.push({ account, error: err.message });
      recordFailure('gmail', {
        timestamp: new Date().toISOString(),
        source: 'gmail',
        account,
        error: err.message,
        action: 'skipped',
      });
    }
  }

  updateLastRun('gmail', runTimestamp);
  if (summary.skipped_calendar_invites > 0) {
    console.log(`[gmail_sync] Skipped ${summary.skipped_calendar_invites} calendar invitation email(s).`);
  }
  if (summary.skipped_personal_noise > 0) {
    console.log(`[gmail_sync] Skipped ${summary.skipped_personal_noise} personal noise email(s) (promotions/social/updates/forums).`);
  }
  return summary;
}

/**
 * Convert ISO8601 timestamp to YYYY/MM/DD format for Gmail query.
 */
function formatDateForQuery(isoTimestamp) {
  const d = new Date(isoTimestamp);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = { run };
