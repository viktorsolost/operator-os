'use strict';

// ---------------------------------------------------------------------------
// test_planner_sync.js
// Tests that runFirstSync correctly routes to runPlannerSync when connector
// state is available, falls back to legacy path when not, and leaves the
// mock and skip paths untouched.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const os = require('os');

const { runFirstSync } = require('../onboarding/first_sync');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.error(`  \u2717 FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n--- ${name} ---`);
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'planner-sync-test-'));
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

// pipelineConfig WITH connectors.enabled (gmail + basecamp)
const CONFIG_WITH_CONNECTORS = {
  sync_engines: {
    gmail: true,
    basecamp: true,
    calendar: true,
    drive: true,
    sheets: true,
  },
  connectors: {
    registry_version: 1,
    enabled: [
      { connector_id: 'gmail', status: 'production', stage: 'source_sync', priority: 10, capabilities: ['email'] },
      { connector_id: 'basecamp', status: 'production', stage: 'source_sync', priority: 20, capabilities: ['tasks', 'messages', 'comments'] },
    ],
    unsupported: [],
    deferred: [],
  },
};

// pipelineConfig WITHOUT connectors section (legacy path)
const CONFIG_WITHOUT_CONNECTORS = {
  sync_engines: {
    gmail: true,
    basecamp: true,
    calendar: false,
    drive: false,
    sheets: false,
  },
  // No connectors key
};

// pipelineConfig with all sync_engines disabled
const CONFIG_ALL_DISABLED = {
  sync_engines: {
    gmail: false,
    basecamp: false,
    calendar: false,
    drive: false,
    sheets: false,
  },
};

// ---------------------------------------------------------------------------
// Test 1: Planner-driven path selected when connectors present
// ---------------------------------------------------------------------------

section('Test 1: Planner path selected when connectors.enabled is populated');

{
  const tmpDir = makeTempDir();

  const result = runFirstSync({
    pipelineConfig: CONFIG_WITH_CONNECTORS,
    targetWorkspaceRoot: tmpDir,
    mockSyncResults: undefined,
  });

  // No real pipeline CLI exists in tmpDir, so the planner path should return
  // success: false with a "Missing pipeline CLI" reason and plannerDriven: true
  assert(result.plannerDriven === true, 'result.plannerDriven is true (planner path was selected)');
  assert(result.success === false, 'result.success is false (no real CLI exists)');
  assert(typeof result.reason === 'string' && result.reason.includes('Missing pipeline CLI'), 'reason references missing pipeline CLI');
  assert(result.skipped === false, 'result.skipped is false');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test 2: Legacy fallback when no connectors section
// ---------------------------------------------------------------------------

section('Test 2: Legacy fallback when pipelineConfig has no connectors section');

{
  const tmpDir = makeTempDir();

  const result = runFirstSync({
    pipelineConfig: CONFIG_WITHOUT_CONNECTORS,
    targetWorkspaceRoot: tmpDir,
    mockSyncResults: undefined,
  });

  // Legacy path also hits missing CLI, but does NOT set plannerDriven
  assert(result.plannerDriven === undefined, 'result.plannerDriven is absent (legacy path was selected)');
  assert(result.success === false, 'result.success is false (no real CLI exists)');
  assert(typeof result.reason === 'string' && result.reason.includes('Missing pipeline CLI'), 'reason references missing pipeline CLI');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test 3: Mock path still works
// ---------------------------------------------------------------------------

section('Test 3: Mock path still works (applyMockSyncResults)');

{
  const tmpDir = makeTempDir();

  const mockSyncResults = {
    captures: {
      gmail: [
        {
          id: 'gmail_msg_test001',
          data: { capture_id: 'gmail_msg_test001', source: 'gmail', normalized_payload: { message_id: 'test001', subject: 'Test' } },
        },
      ],
    },
    syncLogs: {
      gmail: { last_run: '2026-04-04T10:00:00Z' },
    },
    derived: {
      'today.html': '<html><body>Today</body></html>',
    },
  };

  const result = runFirstSync({
    pipelineConfig: CONFIG_WITH_CONNECTORS,
    targetWorkspaceRoot: tmpDir,
    mockSyncResults,
  });

  assert(result.success === true, 'Mock path: success is true');
  assert(result.skipped === false, 'Mock path: skipped is false');
  assert(result.plannerDriven === undefined, 'Mock path: plannerDriven absent (mock bypasses planner)');
  assert(result.summary.sources === 1, 'Mock path: 1 source processed (gmail)');
  assert(result.summary.captures === 1, 'Mock path: 1 capture written');

  // Verify files were actually written
  const captureDir = path.join(tmpDir, 'state', 'captures', 'gmail');
  assert(fs.existsSync(captureDir), 'Mock path: gmail captures directory created');
  const todayPath = path.join(tmpDir, 'state', 'derived', 'today.html');
  assert(fs.existsSync(todayPath), 'Mock path: today.html created');
  const gmailLogPath = path.join(tmpDir, 'state', 'sync_log', 'gmail.json');
  assert(fs.existsSync(gmailLogPath), 'Mock path: gmail sync log written');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test 4: Skip path still works
// ---------------------------------------------------------------------------

section('Test 4: Skip path works (all sync_engines disabled)');

{
  const tmpDir = makeTempDir();

  const result = runFirstSync({
    pipelineConfig: CONFIG_ALL_DISABLED,
    targetWorkspaceRoot: tmpDir,
    mockSyncResults: undefined,
  });

  assert(result.success === true, 'Skip path: success is true');
  assert(result.skipped === true, 'Skip path: skipped is true');
  assert(result.reason === 'No sync engines enabled', 'Skip path: correct reason');
  assert(result.summary.sources === 0, 'Skip path: 0 sources');
  assert(result.summary.captures === 0, 'Skip path: 0 captures');
  assert(result.plannerDriven === undefined, 'Skip path: plannerDriven absent');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Test 5: Empty connectors.enabled falls back to legacy
// ---------------------------------------------------------------------------

section('Test 5: Empty connectors.enabled falls back to legacy');

{
  const tmpDir = makeTempDir();

  const configEmptyEnabled = {
    sync_engines: { gmail: true, basecamp: false, calendar: false, drive: false, sheets: false },
    connectors: {
      registry_version: 1,
      enabled: [],
      unsupported: [{ tool_name: 'gmail', reason: 'No installed adapter' }],
      deferred: [],
    },
  };

  const result = runFirstSync({
    pipelineConfig: configEmptyEnabled,
    targetWorkspaceRoot: tmpDir,
    mockSyncResults: undefined,
  });

  // empty connectors.enabled -> condition fails -> legacy path
  assert(result.plannerDriven === undefined, 'Empty enabled: legacy path selected');
  assert(result.success === false, 'Empty enabled: fails due to missing CLI');

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n=== PLANNER SYNC TEST SUMMARY ===`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failures.length > 0) {
  console.error('Failures:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
