#!/usr/bin/env node

/**
 * Memento pipeline CLI entrypoint.
 *
 * Usage: node pipeline/cli/run.js [step]
 *
 * Steps: basecamp_sync, gmail_sync, calendar_sync, drive_sync,
 *        meeting_extract, store_enrich, morning_digest, all,
 *        sync, full,
 *        derive_facts [project_id], derive_threads [project_id],
 *        derive_activity [project_id], derive_contacts,
 *        derive_calendar, derive_all
 */

const fs = require('fs');
const path = require('path');
const { appendRun, getLastRun } = require('../lib/run_history');

const REGISTRY_PATH = path.resolve(__dirname, '../../state/registry.json');
const STATE_DIR = path.resolve(__dirname, '../../state');
const DERIVED_DIR = path.join(STATE_DIR, 'derived');

const STEPS = {
  basecamp_sync: () => require('../steps/basecamp_sync'),
  gmail_sync: () => require('../steps/gmail_sync'),
  calendar_sync: () => require('../steps/calendar_sync'),
  drive_sync: () => require('../steps/drive_sync'),
  sheets_sync: () => require('../steps/sheets_sync'),
  meeting_extract: () => require('../steps/meeting_extract'),
  store_enrich: () => require('../steps/store_enrich'),
  morning_digest: () => require('../steps/morning_digest'),
};

const ALL_ORDER = [
  'basecamp_sync', 'gmail_sync', 'calendar_sync', 'drive_sync', 'sheets_sync',
  'meeting_extract', 'store_enrich', 'morning_digest',
];

const SYNC_RUN_ORDER = [
  'basecamp_sync', 'gmail_sync', 'calendar_sync', 'drive_sync', 'sheets_sync', 'store_enrich', 'derive_all',
];

const FULL_RUN_ORDER = [
  ...SYNC_RUN_ORDER,
  'morning_digest',
];

const DERIVE_COMMANDS = new Set([
  'derive_facts', 'derive_threads', 'derive_activity', 'derive_contacts',
  'derive_calendar', 'derive_editorial', 'export_html', 'derive_all',
]);

const PIPELINE_RUN_COMMANDS = new Set(['sync', 'full']);
const META_COMMANDS = new Set(['status']);

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

function ensureDerivedDirs() {
  fs.mkdirSync(path.join(DERIVED_DIR, 'facts'), { recursive: true });
  fs.mkdirSync(path.join(DERIVED_DIR, 'threads'), { recursive: true });
  fs.mkdirSync(path.join(DERIVED_DIR, 'activity'), { recursive: true });
}

function activeProjects(registry) {
  return registry.projects.filter(p => p.status === 'active');
}

function formatStatusLine(label, value) {
  return `${label}: ${value}`;
}

function printStatus() {
  const lastRun = getLastRun();

  if (!lastRun) {
    console.log('No pipeline runs recorded yet.');
    return 0;
  }

  const lines = [];
  lines.push(formatStatusLine('Timestamp', lastRun.timestamp));
  lines.push(formatStatusLine('Type', `${lastRun.type} (${lastRun.command})`));
  lines.push(formatStatusLine('Triggered by', lastRun.triggered_by));
  lines.push(formatStatusLine('Duration', `${lastRun.duration_seconds || 0}s`));

  for (const source of ['gmail', 'basecamp', 'calendar', 'drive', 'sheets']) {
    const result = lastRun.results?.[source] || { captures: 0, new: 0, errors: 0 };
    lines.push(formatStatusLine(source, `captures ${result.captures || 0}, new ${result.new || 0}, errors ${result.errors || 0}`));
  }

  const enrich = lastRun.results?.store_enrich || { entries_created: 0, skipped: 0 };
  lines.push(formatStatusLine('store_enrich', `entries ${enrich.entries_created || 0}, skipped ${enrich.skipped || 0}`));
  lines.push(formatStatusLine('derivations', lastRun.results?.derivations || 'skipped'));
  lines.push(formatStatusLine('morning_digest', lastRun.results?.morning_digest || 'skipped'));

  if ((lastRun.auth_failures || []).length > 0) {
    lines.push('auth_failures:');
    for (const failure of lastRun.auth_failures) {
      lines.push(`  - ${failure.source}/${failure.account}: ${failure.error}`);
    }
  } else {
    lines.push('auth_failures: none');
  }

  console.log(lines.join('\n'));
  return 0;
}

async function runStep(stepName, registry) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[pipeline] Running: ${stepName}`);
  console.log('='.repeat(60));

  const startedAt = Date.now();

  if (stepName === 'derive_all') {
    const result = await runDeriveAll(registry);
    const elapsedSeconds = Number(((Date.now() - startedAt) / 1000).toFixed(1));

    console.log(`[pipeline] ${stepName} completed in ${elapsedSeconds}s`);
    console.log('[pipeline] Result:', JSON.stringify(result, null, 2));

    return {
      step: stepName,
      result,
      elapsedSeconds,
      hasErrors: false,
    };
  }

  const step = STEPS[stepName]();
  const result = await step.run(registry);
  const elapsedSeconds = Number(((Date.now() - startedAt) / 1000).toFixed(1));

  console.log(`[pipeline] ${stepName} completed in ${elapsedSeconds}s`);
  console.log('[pipeline] Result:', JSON.stringify(result, null, 2));

  return {
    step: stepName,
    result,
    elapsedSeconds,
    hasErrors: (result.errors?.length || 0) > 0,
  };
}

async function runDeriveFacts(registry, projectId) {
  const { deriveFacts } = require('../lib/derive_facts');
  ensureDerivedDirs();

  const projects = projectId
    ? [{ id: projectId }]
    : activeProjects(registry);

  for (const project of projects) {
    const id = project.id || project.project_id;
    console.log(`[derive_facts] Deriving facts for project: ${id}`);
    const result = deriveFacts(id);
    const outPath = path.join(DERIVED_DIR, 'facts', `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`[derive_facts] Written: ${outPath}`);
  }

  return { status: 'ok', projects_processed: projects.length };
}

async function runDeriveThreads(registry, projectId) {
  const { deriveThreads } = require('../lib/derive_threads');
  ensureDerivedDirs();

  const projects = projectId
    ? [{ id: projectId }]
    : activeProjects(registry);

  for (const project of projects) {
    const id = project.id || project.project_id;
    console.log(`[derive_threads] Deriving threads for project: ${id}`);
    const result = deriveThreads(id);
    const outPath = path.join(DERIVED_DIR, 'threads', `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`[derive_threads] Written: ${outPath}`);
  }

  return { status: 'ok', projects_processed: projects.length };
}

async function runDeriveActivity(registry, projectId) {
  const { deriveActivity } = require('../lib/derive_activity');
  ensureDerivedDirs();

  const projects = projectId
    ? [{ id: projectId }]
    : activeProjects(registry);

  for (const project of projects) {
    const id = project.id || project.project_id;
    console.log(`[derive_activity] Deriving activity for project: ${id}`);
    const result = deriveActivity(id);
    const outPath = path.join(DERIVED_DIR, 'activity', `${id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`[derive_activity] Written: ${outPath}`);
  }

  return { status: 'ok', projects_processed: projects.length };
}

async function runDeriveContacts(registry) {
  const { deriveContacts } = require('../lib/derive_contacts');
  ensureDerivedDirs();

  console.log('[derive_contacts] Deriving cross-project contacts');
  const result = deriveContacts(registry);
  const outPath = path.join(DERIVED_DIR, 'contacts.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`[derive_contacts] Written: ${outPath}`);

  return {
    status: 'ok',
    contacts_written: Array.isArray(result.contacts) ? result.contacts.length : 0,
  };
}

async function runDeriveCalendar() {
  const { deriveCalendarEvents } = require('../lib/derive_calendar');

  console.log('[derive_calendar] Deriving calendar events from captures');
  const result = deriveCalendarEvents({ windowDays: 14 });
  const outPath = path.join(DERIVED_DIR, 'calendar_events.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`[derive_calendar] Written: ${outPath} (${result.events_count} events)`);

  return { status: 'ok', events_written: result.events_count };
}

async function runDeriveEditorial(registry) {
  const { deriveEditorial } = require('../lib/derive_editorial');

  console.log('[derive_editorial] Deriving editorial deadlines');
  const result = await deriveEditorial(registry);
  const outPath = path.join(DERIVED_DIR, 'editorial.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`[derive_editorial] Written: ${outPath}`);

  return {
    status: 'ok',
    overdue: result.overdue_deadlines.length,
    upcoming: result.upcoming_deadlines.length,
    resolved_threads: result.resolved_threads.length,
  };
}

async function runExportHtml(registry) {
  const { exportHtml } = require('../lib/export_html');

  console.log('[export_html] Exporting today.html');
  const result = exportHtml(registry);
  console.log(`[export_html] Done: ${result.path}`);

  return result;
}

async function runDeriveAll(registry) {
  console.log('[derive_all] Running all derivations for all active projects');
  await runDeriveFacts(registry, null);
  await runDeriveThreads(registry, null);
  await runDeriveActivity(registry, null);
  await runDeriveContacts(registry);
  await runDeriveCalendar();
  await runDeriveEditorial(registry);
  await runExportHtml(registry);
  console.log('[derive_all] All derivations complete');

  return { status: 'ok' };
}

async function runDeriveCommand(step, registry, projectId) {
  if (step === 'derive_facts') return runDeriveFacts(registry, projectId);
  if (step === 'derive_threads') return runDeriveThreads(registry, projectId);
  if (step === 'derive_activity') return runDeriveActivity(registry, projectId);
  if (step === 'derive_contacts') return runDeriveContacts(registry);
  if (step === 'derive_calendar') return runDeriveCalendar();
  if (step === 'derive_editorial') return runDeriveEditorial(registry);
  if (step === 'export_html') return runExportHtml(registry);
  if (step === 'derive_all') return runDeriveAll(registry);
  throw new Error(`Unknown derive command: ${step}`);
}

function buildEmptyRunRecord({ timestamp, type, triggeredBy, command }) {
  return {
    timestamp,
    type,
    triggered_by: triggeredBy,
    command,
    duration_seconds: 0,
    results: {
      gmail: { captures: 0, new: 0, errors: 0 },
      basecamp: { captures: 0, new: 0, errors: 0 },
      calendar: { captures: 0, new: 0, errors: 0 },
      drive: { captures: 0, new: 0, errors: 0 },
      sheets: { captures: 0, new: 0, errors: 0 },
      store_enrich: { entries_created: 0, skipped: 0 },
      derivations: 'skipped',
      morning_digest: 'skipped',
    },
    auth_failures: [],
  };
}

function normalizeStepError(stepName, err) {
  return {
    source: stepName,
    account: err.account || err.bcId || err.calendarId || err.calendar_id || err.folderId || err.projectId || 'unknown',
    error: err.error || err.message || String(err),
  };
}

function applyStepResultToRunRecord(runRecord, execution) {
  const { step, result, error, hasErrors } = execution;

  if (error) {
    if (step === 'morning_digest') runRecord.results.morning_digest = 'error';
    else if (step.startsWith('derive_')) runRecord.results.derivations = 'error';

    runRecord.auth_failures.push({
      source: step,
      account: 'unknown',
      error,
    });
    return;
  }

  if (step === 'gmail_sync') {
    runRecord.results.gmail = {
      captures: result?.fetched || 0,
      new: result?.written || 0,
      errors: result?.errors?.length || 0,
    };
  } else if (step === 'basecamp_sync') {
    runRecord.results.basecamp = {
      captures: result?.fetched || 0,
      new: result?.written || 0,
      errors: result?.errors?.length || 0,
    };
  } else if (step === 'calendar_sync') {
    runRecord.results.calendar = {
      captures: result?.fetched || 0,
      new: result?.written || 0,
      errors: result?.errors?.length || 0,
    };
  } else if (step === 'drive_sync') {
    runRecord.results.drive = {
      captures: result?.fetched || 0,
      new: result?.written || 0,
      errors: result?.errors?.length || 0,
    };
  } else if (step === 'sheets_sync') {
    runRecord.results.sheets = {
      captures: result?.fetched || 0,
      new: result?.written || 0,
      errors: result?.errors?.length || 0,
    };
  } else if (step === 'store_enrich') {
    runRecord.results.store_enrich = {
      entries_created: result?.entries_created || 0,
      skipped:
        (result?.skipped || 0) +
        (result?.skipped_already_ingested || 0) +
        (result?.skipped_not_material || 0) +
        (result?.skipped_unlinked || 0),
    };
  } else if (step === 'morning_digest') {
    runRecord.results.morning_digest = hasErrors ? 'error' : 'ok';
  } else if (step.startsWith('derive_')) {
    runRecord.results.derivations = hasErrors ? 'error' : 'ok';
  }

  for (const err of result?.errors || []) {
    runRecord.auth_failures.push(normalizeStepError(step, err));
  }
}

function appendRunHistory({ type, triggeredBy, command, startedAt, results, hadErrors }) {
  const finishedAt = new Date();
  const runRecord = buildEmptyRunRecord({
    timestamp: startedAt.toISOString(),
    type,
    triggeredBy,
    command,
  });

  runRecord.duration_seconds = Number(((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1));

  for (const execution of results) {
    applyStepResultToRunRecord(runRecord, execution);
  }

  if (hadErrors && runRecord.results.derivations === 'skipped' && command.startsWith('derive_')) {
    runRecord.results.derivations = 'error';
  }

  appendRun(runRecord);
}

async function runPipelineSequence(stepNames, registry) {
  const results = [];
  let hadErrors = false;

  for (const s of stepNames) {
    try {
      const res = await runStep(s, registry);
      results.push(res);
      if (res.hasErrors) hadErrors = true;
    } catch (err) {
      console.error(`[pipeline] ${s} FATAL: ${err.message}`);
      console.error(err.stack);
      results.push({ step: s, result: null, error: err.message, hasErrors: true });
      hadErrors = true;
    }
  }

  return { results, hadErrors };
}

async function main() {
  const step = process.argv[2];
  const projectId = process.argv[3] || null;
  const triggeredBy = process.env.MEMENTO_TRIGGERED_BY || 'manual';

  const allCommands = [...Object.keys(STEPS), 'all', ...PIPELINE_RUN_COMMANDS, ...META_COMMANDS, ...DERIVE_COMMANDS].join(', ');

  if (!step) {
    console.error('Usage: node pipeline/cli/run.js [step] [project_id]');
    console.error(`Steps: ${allCommands}`);
    process.exit(2);
  }

  if (step !== 'all' && !STEPS[step] && !DERIVE_COMMANDS.has(step) && !PIPELINE_RUN_COMMANDS.has(step) && !META_COMMANDS.has(step)) {
    console.error(`Unknown step: ${step}`);
    console.error(`Available: ${allCommands}`);
    process.exit(2);
  }

  if (step === 'status') {
    process.exit(printStatus());
  }

  let registry;
  try {
    registry = loadRegistry();
    console.log(`[pipeline] Registry loaded: ${registry.projects.length} projects`);
  } catch (err) {
    console.error(`[pipeline] Failed to load registry: ${err.message}`);
    process.exit(2);
  }

  if (DERIVE_COMMANDS.has(step)) {
    const startedAt = new Date();
    try {
      const deriveResult = await runDeriveCommand(step, registry, projectId);
      const elapsed = Number(((Date.now() - startedAt.getTime()) / 1000).toFixed(1));
      console.log(`\n[pipeline] ${step} completed in ${elapsed}s`);

      appendRunHistory({
        type: 'manual_step',
        triggeredBy,
        command: step,
        startedAt,
        results: [{ step, result: deriveResult, elapsedSeconds: elapsed, hasErrors: false }],
        hadErrors: false,
      });
    } catch (err) {
      console.error(`[pipeline] ${step} FATAL: ${err.message}`);
      console.error(err.stack);

      appendRunHistory({
        type: 'manual_step',
        triggeredBy,
        command: step,
        startedAt,
        results: [{ step, result: null, error: err.message, hasErrors: true }],
        hadErrors: true,
      });
      process.exit(1);
    }
    process.exit(0);
  }

  let stepsToRun;
  let runType;

  if (step === 'all') {
    stepsToRun = ALL_ORDER;
    runType = 'manual_step';
  } else if (step === 'sync') {
    stepsToRun = SYNC_RUN_ORDER;
    runType = 'sync';
  } else if (step === 'full') {
    stepsToRun = FULL_RUN_ORDER;
    runType = 'full';
  } else {
    stepsToRun = [step];
    runType = 'manual_step';
  }

  const startedAt = new Date();
  const { results, hadErrors } = await runPipelineSequence(stepsToRun, registry);

  appendRunHistory({
    type: runType,
    triggeredBy,
    command: step,
    startedAt,
    results,
    hadErrors,
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log('[pipeline] Run complete');
  console.log('='.repeat(60));
  for (const r of results) {
    const status = r.error ? 'FATAL' : r.hasErrors ? 'ERRORS' : 'OK';
    console.log(`  ${r.step}: ${status} (${r.elapsedSeconds ?? '-'}s)`);
  }

  process.exit(hadErrors ? 1 : 0);
}

main().catch(err => {
  console.error(`[pipeline] Unhandled error: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
