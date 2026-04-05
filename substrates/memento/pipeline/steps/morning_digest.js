/**
 * Morning digest step.
 *
 * Read artifact only. Summarizes pipeline health, new journal evidence,
 * open threads, today's calendar, and fact changes since the last digest.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { readRunHistory, getRunsSince } = require('../lib/run_history');
const { readSyncLog, getAndClearFailures } = require('../lib/sync_log');
const { readJournal } = require('../lib/journal_io');

const STATE_DIR = path.resolve(__dirname, '../../state');
const DERIVED_DIR = path.join(STATE_DIR, 'derived');
const CAPTURES_DIR = path.join(STATE_DIR, 'captures');
const DIGEST_PATH = path.join(DERIVED_DIR, 'morning_digest.json');
const FACT_SNAPSHOT_PATH = path.join(DERIVED_DIR, 'morning_digest_fact_snapshot.json');
const SOURCES = ['gmail', 'basecamp', 'calendar', 'drive'];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function getActiveProjects(registry) {
  return (registry.projects || []).filter(project => project.status === 'active');
}

function getDigestWindow(nowIso) {
  const priorDigest = readJsonIfExists(DIGEST_PATH);
  if (priorDigest?.generated_at) {
    return {
      from: priorDigest.generated_at,
      to: nowIso,
    };
  }

  return {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    to: nowIso,
  };
}

function aggregatePipelineHealth(windowFrom, registry) {
  const runs = getRunsSince(windowFrom);
  const syncTotals = {
    gmail: { new_captures: 0, errors: 0 },
    basecamp: { new_captures: 0, errors: 0 },
    calendar: { new_captures: 0, errors: 0 },
    drive: { new_captures: 0, errors: 0 },
  };

  const storeEnrichTotals = {
    entries_created: 0,
    entries_skipped: 0,
    unlinked_captures: computeCurrentUnlinkedCaptures(registry),
  };

  for (const run of runs) {
    for (const source of Object.keys(syncTotals)) {
      const result = run.results?.[source];
      if (!result) continue;
      syncTotals[source].new_captures += result.new || 0;
      syncTotals[source].errors += result.errors || 0;
    }

    const enrich = run.results?.store_enrich;
    if (enrich) {
      storeEnrichTotals.entries_created += enrich.entries_created || 0;
      storeEnrichTotals.entries_skipped += enrich.skipped || 0;
    }
  }

  const authFailures = collectAuthFailures();

  return {
    runs_since_last_digest: runs.length,
    sync_totals: syncTotals,
    auth_failures: authFailures,
    store_enrich_totals: storeEnrichTotals,
  };
}

function collectAllJournals(registry) {
  const journals = [];

  for (const project of getActiveProjects(registry)) {
    const journal = readJournal(project.project_id);
    if (journal) journals.push(journal);
  }

  return journals;
}

function collectNewJournalEntries(windowFrom, windowTo, registry) {
  const fromMs = Date.parse(windowFrom);
  const toMs = Date.parse(windowTo);
  const entries = [];

  for (const journal of collectAllJournals(registry)) {
    for (const entry of journal.entries || []) {
      const recordedAtMs = Date.parse(entry.recorded_at || entry.timestamp);
      if (Number.isNaN(recordedAtMs)) continue;
      if (recordedAtMs < fromMs || recordedAtMs > toMs) continue;

      entries.push({
        project_id: journal.project_id,
        entry_id: entry.entry_id,
        timestamp: entry.timestamp,
        source: entry.source,
        entry_type: entry.entry_type,
        title: entry.title,
        summary: entry.summary,
        actors: entry.actors || [],
      });
    }
  }

  entries.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return entries;
}

function buildEntryTitleIndex(registry) {
  const index = {};

  for (const journal of collectAllJournals(registry)) {
    index[journal.project_id] = {};
    for (const entry of journal.entries || []) {
      index[journal.project_id][entry.entry_id] = entry.title;
    }
  }

  return index;
}

function collectOpenThreads(registry) {
  const entryTitleIndex = buildEntryTitleIndex(registry);
  const threads = [];

  for (const project of getActiveProjects(registry)) {
    const threadPath = path.join(DERIVED_DIR, 'threads', `${project.project_id}.json`);
    const derived = readJsonIfExists(threadPath);
    if (!derived?.open_threads) continue;

    for (const thread of derived.open_threads) {
      threads.push({
        project_id: project.project_id,
        thread_key: thread.thread_key,
        signal_type: thread.signal_type,
        counterparty: thread.counterparty,
        age_days: thread.age_days,
        opened_by_title: entryTitleIndex[project.project_id]?.[thread.opened_by?.entry_id] || thread.opened_by?.entry_id || null,
      });
    }
  }

  threads.sort((a, b) => {
    if (b.age_days !== a.age_days) return b.age_days - a.age_days;
    return a.project_id.localeCompare(b.project_id);
  });

  return threads;
}

function readLatestCalendarCaptures() {
  const calendarDir = path.join(CAPTURES_DIR, 'calendar');
  if (!fs.existsSync(calendarDir)) return [];

  const latestCaptures = [];
  const captureIds = fs.readdirSync(calendarDir);

  for (const captureId of captureIds) {
    const captureDir = path.join(calendarDir, captureId);
    if (!fs.statSync(captureDir).isDirectory()) continue;

    const files = fs.readdirSync(captureDir).filter(name => name.endsWith('.json')).sort();
    if (files.length === 0) continue;

    const latest = files[files.length - 1];
    latestCaptures.push(JSON.parse(fs.readFileSync(path.join(captureDir, latest), 'utf8')));
  }

  return latestCaptures;
}

function formatDubaiDate(dateLike) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateLike));
}

function formatDubaiDateTime(dateLike) {
  return new Date(dateLike).toISOString();
}

function collectTodaysCalendar() {
  const todayDubai = formatDubaiDate(new Date());
  const events = [];

  for (const capture of readLatestCalendarCaptures()) {
    if (capture.observation_kind !== 'event') continue;
    const start = capture.normalized_payload?.start;
    if (!start) continue;
    if (formatDubaiDate(start) !== todayDubai) continue;

    const projectId = capture.candidate_project_links?.[0]?.project_id || null;
    const attendees = (capture.normalized_payload.attendees || []).map(attendee => attendee.email).filter(Boolean);

    events.push({
      title: capture.normalized_payload.summary || '(no title)',
      start: formatDubaiDateTime(start),
      end: capture.normalized_payload.end ? formatDubaiDateTime(capture.normalized_payload.end) : null,
      location: capture.normalized_payload.location || null,
      attendees,
      project_id: projectId,
    });
  }

  events.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  return events;
}

function buildCurrentFactSnapshot(registry) {
  const snapshot = {
    generated_at: new Date().toISOString(),
    facts: {},
  };

  for (const project of getActiveProjects(registry)) {
    const factPath = path.join(DERIVED_DIR, 'facts', `${project.project_id}.json`);
    const factView = readJsonIfExists(factPath);
    if (!factView?.facts) continue;

    snapshot.facts[project.project_id] = {};
    for (const [factKey, fact] of Object.entries(factView.facts)) {
      snapshot.facts[project.project_id][factKey] = {
        current_value: fact.current_value,
        changed_by_entry_id: fact.current_source?.entry_id || null,
      };
    }
  }

  return snapshot;
}

function collectFactChanges(currentSnapshot) {
  const previousSnapshot = readJsonIfExists(FACT_SNAPSHOT_PATH);
  if (!previousSnapshot?.facts) return [];

  const changes = [];

  for (const [projectId, facts] of Object.entries(currentSnapshot.facts || {})) {
    for (const [factKey, current] of Object.entries(facts || {})) {
      const previous = previousSnapshot.facts?.[projectId]?.[factKey];
      if (!previous) continue;
      if (String(previous.current_value) === String(current.current_value)) continue;

      changes.push({
        project_id: projectId,
        fact_key: factKey,
        previous_value: previous.current_value,
        current_value: current.current_value,
        changed_by_entry_id: current.changed_by_entry_id,
      });
    }
  }

  changes.sort((a, b) => a.project_id.localeCompare(b.project_id) || a.fact_key.localeCompare(b.fact_key));
  return changes;
}

function collectAuthFailures() {
  const failures = [];

  for (const source of SOURCES) {
    const log = readSyncLog(source);
    for (const failure of log.failures || []) {
      failures.push({
        timestamp: failure.timestamp,
        account: failure.account,
        source: failure.source || source,
        error: failure.error,
        re_auth_command: buildReauthCommand(failure.account),
      });
    }
  }

  failures.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return failures;
}

function buildReauthCommand(account) {
  if (typeof account === 'string' && account.startsWith('gws-')) {
    return `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/${account}/ gws auth login`;
  }
  return `manual investigation required for ${account}`;
}

function computeCurrentUnlinkedCaptures(registry) {
  const linkedCaptureIds = new Set();
  for (const journal of collectAllJournals(registry)) {
    for (const entry of journal.entries || []) {
      for (const captureId of entry.provenance?.capture_ids || []) {
        linkedCaptureIds.add(captureId);
      }
    }
  }

  let total = 0;
  for (const source of ['basecamp', 'gmail', 'calendar', 'drive', 'meeting_extract']) {
    const sourceDir = path.join(CAPTURES_DIR, source);
    if (!fs.existsSync(sourceDir)) continue;

    for (const captureId of fs.readdirSync(sourceDir)) {
      const captureDir = path.join(sourceDir, captureId);
      if (!fs.statSync(captureDir).isDirectory()) continue;
      if (!linkedCaptureIds.has(captureId)) total += 1;
    }
  }

  return total;
}

function clearAccumulatedFailures() {
  for (const source of SOURCES) {
    getAndClearFailures(source);
  }
}

async function run(registry) {
  const generatedAt = new Date().toISOString();
  const digestWindow = getDigestWindow(generatedAt);
  const currentSnapshot = buildCurrentFactSnapshot(registry);

  const digest = {
    generated_at: generatedAt,
    digest_window: digestWindow,
    pipeline_health: aggregatePipelineHealth(digestWindow.from, registry),
    new_journal_entries: collectNewJournalEntries(digestWindow.from, digestWindow.to, registry),
    open_threads: collectOpenThreads(registry),
    todays_calendar: collectTodaysCalendar(),
    fact_changes: collectFactChanges(currentSnapshot),
  };

  writeJson(DIGEST_PATH, digest);
  currentSnapshot.generated_at = generatedAt;
  writeJson(FACT_SNAPSHOT_PATH, currentSnapshot);
  clearAccumulatedFailures();

  return {
    fetched: digest.new_journal_entries.length + digest.open_threads.length + digest.todays_calendar.length,
    written: 2,
    skipped: 0,
    errors: [],
  };
}

module.exports = { run };
