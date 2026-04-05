/**
 * Store enrichment step.
 *
 * Reads captures, runs project linking, deduplicates via ingest identity,
 * creates journal entries via journal_io. This is the ONLY step that writes
 * to state/store/.
 *
 * Source contracts:
 *   docs/contracts/ingest-identity.md
 *   docs/contracts/changed-artifact-materiality.md
 *   docs/contracts/journal-entry-schema.md
 *   docs/contracts/project-linking.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { readJournal, appendEntry, hasIngestKey, recordIngestKey } = require('../lib/journal_io');
const { computeIngestKey, computeCaptureHash } = require('../lib/ingest_identity');
const { readLatestCapture, readCaptureVersions } = require('../lib/capture_io');
const { linkCapture } = require('../lib/project_linking/linker');

const CAPTURES_DIR = path.resolve(__dirname, '../../state/captures');

const SOURCES = ['basecamp', 'gmail', 'calendar', 'drive', 'meeting_extract', 'sheets'];

const OBSERVATION_KIND_TO_ENTRY_TYPE = {
  message: { basecamp: 'basecamp_message', gmail: 'communication_received' },
  todo: { basecamp: 'basecamp_todo_change' },
  comment: { basecamp: 'basecamp_message' },
  mention: { basecamp: 'basecamp_mention' },
  event: { calendar: 'meeting_scheduled' },
  event_cancelled: { calendar: 'meeting_cancelled' },
  file_metadata: { drive: 'document_created' },
  folder_metadata: { drive: 'document_created' },
  extraction: { meeting_extract: 'extraction' },
  project_discovery: { basecamp: 'fact_recorded' },
  project_info: { basecamp: 'fact_recorded' },
  schedule_entry: { basecamp: 'meeting_scheduled' },
  vault_document: { basecamp: 'document_created' },
  vault_upload: { basecamp: 'document_created' },
  production_calendar_task: { sheets: 'calendar_task' },
};

/**
 * Scan all captures on disk, grouped by source.
 */
function scanAllCaptures() {
  const captures = [];

  for (const source of SOURCES) {
    const sourceDir = path.join(CAPTURES_DIR, source);
    if (!fs.existsSync(sourceDir)) continue;

    const captureIds = fs.readdirSync(sourceDir).filter(d => {
      return fs.statSync(path.join(sourceDir, d)).isDirectory();
    });

    for (const captureId of captureIds) {
      const latest = readLatestCapture(source, captureId);
      if (latest) captures.push(latest);
    }
  }

  return captures;
}

/**
 * Build a folder ancestry map from Drive captures.
 * Maps each folder's file_id to its parent folder_id.
 */
function buildFolderMap(captures) {
  const folderMap = {};
  for (const capture of captures) {
    if (capture.source !== 'drive') continue;
    const p = capture.normalized_payload || {};
    if (p.file_id && p.folder_id) {
      folderMap[p.file_id] = p.folder_id;
    }
  }
  return folderMap;
}

/**
 * Determine entry type from observation kind and source.
 */
function determineEntryType(capture) {
  const kindMap = OBSERVATION_KIND_TO_ENTRY_TYPE[capture.observation_kind];
  if (kindMap) {
    return kindMap[capture.source] || kindMap.default || 'fact_recorded';
  }
  return 'fact_recorded';
}

/**
 * Generate a unique entry ID from a capture.
 */
function generateEntryId(capture) {
  const hash = crypto.createHash('sha256')
    .update(capture.capture_id + capture.capture_hash)
    .digest('hex')
    .slice(0, 8);
  return `${capture.capture_id}_${hash}`;
}

/**
 * Generate title from a capture's normalized payload.
 */
function generateTitle(capture) {
  const p = capture.normalized_payload;

  switch (capture.source) {
    case 'basecamp':
      if (capture.observation_kind === 'message') {
        return p.subject || `Basecamp message from ${p.author?.name || 'unknown'}`;
      }
      if (capture.observation_kind === 'todo') {
        return p.title || `Todo: ${p.todo_id}`;
      }
      if (capture.observation_kind === 'comment') {
        return `Comment from ${p.author?.name || 'unknown'} on recording ${p.recording_id}`;
      }
      break;
    case 'gmail':
      return p.thread_subject || `Email from ${p.from}`;
    case 'calendar':
      if (capture.observation_kind === 'event_cancelled') {
        return `Cancelled: ${p.summary}`;
      }
      return p.summary || 'Calendar event';
    case 'drive':
      return `${capture.observation_kind === 'folder_metadata' ? 'Folder' : 'File'}: ${p.name}`;
    default:
      return `Capture from ${capture.source}`;
  }
  return `Capture from ${capture.source}`;
}

/**
 * Generate summary from a capture's normalized payload.
 */
function generateSummary(capture) {
  const p = capture.normalized_payload;

  switch (capture.source) {
    case 'basecamp':
      if (capture.observation_kind === 'message') {
        const body = (p.body || '').slice(0, 200).replace(/<[^>]*>/g, '');
        return `${p.author?.name || 'Unknown'} posted "${p.subject}": ${body}`;
      }
      if (capture.observation_kind === 'todo') {
        const status = p.completed ? 'completed' : 'open';
        return `Todo "${p.title}" (${status}) in "${p.todolist_title}"`;
      }
      if (capture.observation_kind === 'comment') {
        const body = (p.body || '').slice(0, 200).replace(/<[^>]*>/g, '');
        return `${p.author?.name || 'Unknown'} commented: ${body}`;
      }
      break;
    case 'gmail': {
      const snippet = p.snippet || p.message_snippet || '';
      return `From ${p.from}: ${snippet.slice(0, 200)}`;
    }
    case 'calendar':
      if (capture.observation_kind === 'event_cancelled') {
        return `Event "${p.summary}" was cancelled`;
      }
      return `${p.summary} at ${p.location || 'no location'}, ${p.start || 'no time'}`;
    case 'drive':
      return `${p.name} (${p.mime_type}) in folder ${p.folder_id || 'root'}`;
    default:
      return `Capture from ${capture.source}: ${capture.source_ref}`;
  }
  return `Capture from ${capture.source}`;
}

/**
 * Extract actors from a capture.
 */
function extractActors(capture) {
  const p = capture.normalized_payload;
  const actors = new Set();

  if (p.author?.name) actors.add(p.author.name);
  if (p.creator?.name) actors.add(p.creator.name);
  if (p.organizer?.display_name) actors.add(p.organizer.display_name);
  if (p.created_by) actors.add(p.created_by);
  if (p.modified_by) actors.add(p.modified_by);
  (p.attendees || []).forEach(a => {
    if (a.display_name) actors.add(a.display_name);
  });
  (p.assignees || []).forEach(a => {
    if (a.name) actors.add(a.name);
  });

  return [...actors];
}

/**
 * Extract contacts (email addresses) from a capture.
 */
function extractContacts(capture) {
  const p = capture.normalized_payload;
  const contacts = new Set();

  if (p.author?.email) contacts.add(p.author.email);
  if (p.creator?.email) contacts.add(p.creator.email);
  if (p.from && p.from.includes('@')) contacts.add(p.from);
  if (p.organizer?.email) contacts.add(p.organizer.email);
  if (p.created_by && p.created_by.includes('@')) contacts.add(p.created_by);
  if (p.modified_by && p.modified_by.includes('@')) contacts.add(p.modified_by);
  (p.to || []).forEach(t => { if (typeof t === 'string' && t.includes('@')) contacts.add(t); });
  (p.cc || []).forEach(t => { if (typeof t === 'string' && t.includes('@')) contacts.add(t); });
  (p.attendees || []).forEach(a => { if (a.email) contacts.add(a.email); });
  (p.assignees || []).forEach(a => { if (a.email) contacts.add(a.email); });

  return [...contacts];
}

/**
 * Extract fact claims from a capture where applicable.
 */
function extractFactClaims(capture) {
  const claims = [];
  const p = capture.normalized_payload;

  // Calendar: opening date, event date
  if (capture.source === 'calendar' && capture.observation_kind === 'event') {
    if (p.start) {
      claims.push({
        fact_key: 'event_date',
        fact_value: p.start.split('T')[0],
        confidence: 'high',
        authorship: 'synced',
      });
    }
  }

  // Basecamp todo: completion status
  if (capture.source === 'basecamp' && capture.observation_kind === 'todo') {
    claims.push({
      fact_key: `todo_status_${p.todo_id}`,
      fact_value: p.completed ? 'completed' : 'open',
      confidence: 'high',
      authorship: 'synced',
    });
    if (p.due_on) {
      claims.push({
        fact_key: `todo_due_${p.todo_id}`,
        fact_value: p.due_on,
        confidence: 'high',
        authorship: 'synced',
      });
    }
  }

  return claims;
}

/**
 * Extract thread signals from a capture where applicable.
 */
function extractThreadSignals(capture) {
  const signals = [];
  const p = capture.normalized_payload;

  // Gmail: inbound message = reply_received if it's a reply context
  // We don't have enough context to determine if this is a reply to an
  // outbound thread without checking journal state, which we avoid here.
  // Thread derivation is Phase 3.

  return signals;
}

/**
 * Generate tags from a capture.
 */
function generateTags(capture) {
  const tags = [capture.source];
  if (capture.observation_kind) tags.push(capture.observation_kind);
  return tags;
}

/**
 * Determine the event timestamp from a capture.
 */
function getEventTimestamp(capture) {
  const p = capture.normalized_payload;
  return p.created_at || p.date || p.created || p.start || capture.observed_at;
}

/**
 * Check if a changed artifact is material enough for a journal entry.
 * Source contract: docs/contracts/changed-artifact-materiality.md
 */
function isMaterialChange(capture, priorCapture) {
  const current = capture.normalized_payload;
  const prior = priorCapture.normalized_payload;

  switch (capture.source) {
    case 'basecamp':
      if (capture.observation_kind === 'message') {
        // Title or body change is material; timestamp-only is not
        return current.subject !== prior.subject || current.body !== prior.body;
      }
      if (capture.observation_kind === 'todo') {
        // Completion status, title, assignees, due_on changes are material
        return current.completed !== prior.completed ||
          current.title !== prior.title ||
          current.due_on !== prior.due_on ||
          JSON.stringify(current.assignees) !== JSON.stringify(prior.assignees);
      }
      if (capture.observation_kind === 'comment') {
        return current.body !== prior.body;
      }
      return true; // Default material for unknown kinds

    case 'gmail':
      // New messages are always material (per-message captures)
      return true;

    case 'calendar':
      // Time, location, attendee changes are material; sequence number only is not
      return current.start !== prior.start ||
        current.end !== prior.end ||
        current.location !== prior.location ||
        current.status !== prior.status ||
        JSON.stringify(current.attendees) !== JSON.stringify(prior.attendees);

    case 'drive':
      // Name, folder changes are material; size-only is not
      return current.name !== prior.name ||
        current.folder_id !== prior.folder_id ||
        current.mime_type !== prior.mime_type;

    default:
      return true;
  }
}

/**
 * Build a journal entry from a capture and linking decision.
 */
function buildJournalEntry(capture, linkResult) {
  const factClaims = extractFactClaims(capture);
  const threadSignals = extractThreadSignals(capture);

  const entry = {
    entry_id: generateEntryId(capture),
    timestamp: getEventTimestamp(capture),
    recorded_at: new Date().toISOString(),
    source: capture.source,
    source_ref: capture.source_ref,
    entry_type: determineEntryType(capture),
    title: generateTitle(capture),
    summary: generateSummary(capture),
    payload: capture.normalized_payload,
    project_link: {
      mode: linkResult.mode,
      basis: linkResult.basis,
    },
    authorship: 'synced',
    provenance: {
      capture_ids: [capture.capture_id],
      source_artifact_refs: [capture.source_ref],
      extraction_parent: null,
    },
    actors: extractActors(capture),
    contacts: extractContacts(capture),
    tags: generateTags(capture),
  };

  if (factClaims.length > 0) entry.fact_claims = factClaims;
  if (threadSignals.length > 0) entry.thread_signals = threadSignals;

  return entry;
}

/**
 * Run store enrichment.
 *
 * @param {object} registry - The full registry object
 * @returns {Promise<object>} Summary
 */
async function run(registry) {
  const summary = {
    captures_scanned: 0,
    entries_created: 0,
    skipped_already_ingested: 0,
    skipped_not_material: 0,
    skipped_unlinked: 0,
    skipped_mentions: 0,
    errors: [],
  };

  const captures = scanAllCaptures();
  summary.captures_scanned = captures.length;
  console.log(`[store_enrich] Scanned ${captures.length} captures`);

  const folderMap = buildFolderMap(captures);

  for (const capture of captures) {
    try {
      if (capture.source === 'basecamp' && capture.observation_kind === 'mention') {
        summary.skipped_mentions++;
        continue;
      }

      // Run project linking
      const linkResult = linkCapture(capture, registry, folderMap);

      // Skip unlinked captures — preserve in captures for future linking
      const projectIds = linkResult.linked_project_ids ||
        (linkResult.linked_project_id ? [linkResult.linked_project_id] : []);

      if (projectIds.length === 0) {
        summary.skipped_unlinked++;
        continue;
      }

      // Check for changed artifact (same capture_id, different hash)
      const versions = readCaptureVersions(capture.source, capture.capture_id);
      let isNotMaterial = false;
      if (versions.length > 1) {
        const priorVersion = versions[versions.length - 2];
        if (!isMaterialChange(capture, priorVersion)) {
          isNotMaterial = true;
        }
      }

      for (const projectId of projectIds) {
        // Compute ingest key per project
        const ingestKey = computeIngestKey(capture);

        // Check if already ingested in this project
        const existingDisposition = hasIngestKey(projectId, ingestKey);
        if (existingDisposition) {
          summary.skipped_already_ingested++;
          continue;
        }

        if (isNotMaterial) {
          recordIngestKey(projectId, ingestKey, 'skipped_not_material', null, capture.capture_id);
          summary.skipped_not_material++;
          continue;
        }

        // Create journal entry
        const entry = buildJournalEntry(capture, linkResult);
        appendEntry(projectId, entry);
        recordIngestKey(projectId, ingestKey, 'journaled', entry.entry_id, capture.capture_id);
        summary.entries_created++;
      }

    } catch (err) {
      console.error(`[store_enrich] Error processing ${capture.capture_id}: ${err.message}`);
      summary.errors.push({ capture_id: capture.capture_id, error: err.message });
    }
  }

  console.log(`[store_enrich] Done: ${summary.entries_created} entries created, ${summary.skipped_already_ingested} already ingested, ${summary.skipped_not_material} not material, ${summary.skipped_unlinked} unlinked`);
  return summary;
}

module.exports = { run };
