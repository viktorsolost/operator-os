'use strict';

// ---------------------------------------------------------------------------
// Sync adapter tests — Gmail and Basecamp sync adapters
// Run: node instantiation/connectors/adapters/test_sync_adapters.js
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateSyncAdapter } = require('../sync_adapter');
const { loadRegistry, resolveAdapter } = require('../registry');

const gmailSync = require('./gmail/sync');
const basecampSync = require('./basecamp/sync');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

// Create a temp workspace with a real (mock) CLI at pipeline/cli/run.js
function makeTempWorkspace() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-adapter-test-'));
  const cliDir = path.join(tmpDir, 'pipeline', 'cli');
  fs.mkdirSync(cliDir, { recursive: true });
  const cliPath = path.join(cliDir, 'run.js');
  fs.writeFileSync(cliPath, '#!/usr/bin/env node\nprocess.exit(0);\n', 'utf8');
  fs.chmodSync(cliPath, 0o755);
  return tmpDir;
}

function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 1. Gmail sync adapter — validateSyncAdapter
// ---------------------------------------------------------------------------
console.log('\n== Gmail sync adapter: contract validation ==');

{
  const r = validateSyncAdapter(gmailSync);
  assert(r.valid === true, 'validateSyncAdapter passes on gmail sync module');
  assert(r.errors.length === 0, 'gmail sync module has no contract errors');
}

// ---------------------------------------------------------------------------
// 2. Gmail sync adapter — validate_config
// ---------------------------------------------------------------------------
console.log('\n== Gmail sync adapter: validate_config ==');

{
  const r = gmailSync.validate_config({});
  assert(r.success === false, 'validate_config fails with no workspaceRoot');
  assert(r.errors.length > 0, 'validate_config error lists reason');
}

{
  const r = gmailSync.validate_config({ workspaceRoot: '/nonexistent/path/abc123' });
  assert(r.success === false, 'validate_config fails with nonexistent workspaceRoot');
  assert(r.errors.some(e => e.includes('does not exist')), 'validate_config error mentions does not exist');
}

{
  const tmp = makeTempWorkspace();
  try {
    const r = gmailSync.validate_config({ workspaceRoot: tmp });
    assert(r.success === true, 'validate_config succeeds when workspace + CLI exist');
    assert(r.errors.length === 0, 'validate_config has no errors when valid');
  } finally {
    removeTempDir(tmp);
  }
}

// ---------------------------------------------------------------------------
// 3. Gmail sync adapter — initial_sync
// ---------------------------------------------------------------------------
console.log('\n== Gmail sync adapter: initial_sync ==');

{
  // CLI doesn't exist — validate_config fails first
  const r = gmailSync.initial_sync({ workspaceRoot: '/nonexistent/path/abc123' });
  assert(r.success === false, 'initial_sync fails when CLI does not exist');
}

{
  const tmp = makeTempWorkspace();
  try {
    const r = gmailSync.initial_sync({ workspaceRoot: tmp });
    assert(r.success === true, 'initial_sync succeeds with mock CLI');
    assert(Array.isArray(r.data && r.data.steps), 'initial_sync result has data.steps array');
    assert(r.data.steps.length >= 1, 'initial_sync data.steps has at least one entry');
    assert(r.metadata !== null, 'initial_sync result has metadata');
    assert(typeof r.metadata.steps_run === 'number', 'initial_sync metadata has steps_run');
    assert(r.metadata.steps_run >= 1, 'initial_sync metadata.steps_run is at least 1');
  } finally {
    removeTempDir(tmp);
  }
}

// ---------------------------------------------------------------------------
// 4. Gmail sync adapter — healthcheck
// ---------------------------------------------------------------------------
console.log('\n== Gmail sync adapter: healthcheck ==');

{
  const tmp = makeTempWorkspace();
  try {
    const r = gmailSync.healthcheck({ workspaceRoot: tmp });
    assert(r.success === true, 'healthcheck succeeds when CLI exists');
    assert(r.metadata && r.metadata.cli_path, 'healthcheck metadata includes cli_path');
  } finally {
    removeTempDir(tmp);
  }
}

{
  const r = gmailSync.healthcheck({ workspaceRoot: '/nonexistent/path/abc123' });
  assert(r.success === false, 'healthcheck fails when CLI does not exist');
  assert(r.errors.length > 0, 'healthcheck error list is non-empty');
}

// ---------------------------------------------------------------------------
// 5. Gmail sync adapter — normalize
// ---------------------------------------------------------------------------
console.log('\n== Gmail sync adapter: normalize ==');

{
  const payload = { foo: 'bar' };
  const r = gmailSync.normalize(payload);
  assert(r.success === true, 'normalize returns success: true');
  assert(r.data === payload, 'normalize passes data through unchanged');
}

// ---------------------------------------------------------------------------
// 6. Basecamp sync adapter — validateSyncAdapter
// ---------------------------------------------------------------------------
console.log('\n== Basecamp sync adapter: contract validation ==');

{
  const r = validateSyncAdapter(basecampSync);
  assert(r.valid === true, 'validateSyncAdapter passes on basecamp sync module');
  assert(r.errors.length === 0, 'basecamp sync module has no contract errors');
}

// ---------------------------------------------------------------------------
// 7. Basecamp sync adapter — validate_config
// ---------------------------------------------------------------------------
console.log('\n== Basecamp sync adapter: validate_config ==');

{
  const r = basecampSync.validate_config({});
  assert(r.success === false, 'basecamp validate_config fails with no workspaceRoot');
  assert(r.errors.length > 0, 'basecamp validate_config error lists reason');
}

{
  const tmp = makeTempWorkspace();
  try {
    const r = basecampSync.validate_config({ workspaceRoot: tmp });
    assert(r.success === true, 'basecamp validate_config succeeds when workspace + CLI exist');
    assert(r.errors.length === 0, 'basecamp validate_config has no errors when valid');
  } finally {
    removeTempDir(tmp);
  }
}

// ---------------------------------------------------------------------------
// 8. Basecamp sync adapter — initial_sync
// ---------------------------------------------------------------------------
console.log('\n== Basecamp sync adapter: initial_sync ==');

{
  const r = basecampSync.initial_sync({ workspaceRoot: '/nonexistent/path/abc123' });
  assert(r.success === false, 'basecamp initial_sync fails when CLI does not exist');
}

// ---------------------------------------------------------------------------
// 9. Basecamp sync adapter — healthcheck
// ---------------------------------------------------------------------------
console.log('\n== Basecamp sync adapter: healthcheck ==');

{
  // CLI missing — fails before auth file check
  const r = basecampSync.healthcheck({ workspaceRoot: '/nonexistent/path/abc123' });
  assert(r.success === false, 'basecamp healthcheck fails when CLI does not exist');
  assert(r.errors.length > 0, 'basecamp healthcheck error list is non-empty');
}

// ---------------------------------------------------------------------------
// 10. Basecamp sync adapter — normalize
// ---------------------------------------------------------------------------
console.log('\n== Basecamp sync adapter: normalize ==');

{
  const payload = { baz: 42 };
  const r = basecampSync.normalize(payload);
  assert(r.success === true, 'basecamp normalize returns success: true');
  assert(r.data === payload, 'basecamp normalize passes data through unchanged');
}

// ---------------------------------------------------------------------------
// 11. Registry integration
// ---------------------------------------------------------------------------
console.log('\n== Registry: sync_adapter in manifests ==');

const adaptersDir = __dirname;
const registry = loadRegistry(adaptersDir);

{
  const gmailManifest = registry.connectors.get('gmail');
  assert(gmailManifest !== undefined, 'gmail manifest loaded from registry');
  assert(gmailManifest.sync_adapter === 'sync.js', 'gmail manifest has sync_adapter: "sync.js"');
}

{
  const basecampManifest = registry.connectors.get('basecamp');
  assert(basecampManifest !== undefined, 'basecamp manifest loaded from registry');
  assert(basecampManifest.sync_adapter === 'sync.js', 'basecamp manifest has sync_adapter: "sync.js"');
}

{
  const resolved = resolveAdapter(registry, 'gmail', 'sync');
  assert(resolved !== null, 'resolveAdapter returns gmail sync module');
  assert(typeof resolved.validate_config === 'function', 'resolved gmail sync has validate_config');
  assert(typeof resolved.initial_sync === 'function', 'resolved gmail sync has initial_sync');
}

{
  const resolved = resolveAdapter(registry, 'basecamp', 'sync');
  assert(resolved !== null, 'resolveAdapter returns basecamp sync module');
  assert(typeof resolved.validate_config === 'function', 'resolved basecamp sync has validate_config');
  assert(typeof resolved.initial_sync === 'function', 'resolved basecamp sync has initial_sync');
}

{
  const resolvedGmail = resolveAdapter(registry, 'gmail', 'sync');
  const r = validateSyncAdapter(resolvedGmail);
  assert(r.valid === true, 'resolved gmail sync adapter passes validateSyncAdapter');
}

{
  const resolvedBasecamp = resolveAdapter(registry, 'basecamp', 'sync');
  const r = validateSyncAdapter(resolvedBasecamp);
  assert(r.valid === true, 'resolved basecamp sync adapter passes validateSyncAdapter');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n== Results: ${passed} passed, ${failed} failed ==`);
if (failed > 0) {
  process.exit(1);
}
