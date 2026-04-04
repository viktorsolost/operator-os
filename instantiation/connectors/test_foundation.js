'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateManifest, VALID_STAGES, VALID_STATUSES, VALID_CATEGORIES } = require('./manifest_schema');
const { loadRegistry, resolveAdapter, getConnectorsByStage, getConnectorsByCapability } = require('./registry');
const { AUTH_METHODS, validateAuthAdapter, createAuthResult } = require('./auth_adapter');
const { SYNC_METHODS, validateSyncAdapter, createSyncResult } = require('./sync_adapter');

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

function assertDeepEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, label);
  if (!ok) {
    console.error('    actual:  ', JSON.stringify(actual));
    console.error('    expected:', JSON.stringify(expected));
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_MANIFEST = {
  id: 'gmail',
  display_name: 'Gmail',
  category: 'email',
  capabilities: ['email', 'contacts'],
  auth_adapter: 'auth.js',
  sync_adapter: 'sync.js',
  stage: 'source_sync',
  priority: 10,
  status: 'production',
  enabled_by_default: false,
};

// ---------------------------------------------------------------------------
// 1. manifest_schema — validateManifest
// ---------------------------------------------------------------------------
console.log('\n== manifest_schema: validateManifest ==');

{
  const r = validateManifest(VALID_MANIFEST);
  assert(r.valid === true, 'accepts a fully valid manifest');
  assert(r.errors.length === 0, 'no errors on valid manifest');
}

{
  // Build a manifest without any optional fields (omit them entirely)
  const minimal = {
    id: 'minimal',
    display_name: 'Minimal',
    category: 'other',
    capabilities: ['check'],
    stage: 'source_sync',
    priority: 1,
    status: 'production',
  };
  const r = validateManifest(minimal);
  assert(r.valid === true, 'accepts manifest without optional fields');
}

{
  const r = validateManifest(null);
  assert(r.valid === false, 'rejects null');
  assert(r.errors.length > 0, 'has errors for null');
}

{
  const r = validateManifest({});
  assert(r.valid === false, 'rejects empty object');
  assert(r.errors.some(e => e.includes("'id'")), 'error mentions id');
  assert(r.errors.some(e => e.includes("'capabilities'")), 'error mentions capabilities');
  assert(r.errors.some(e => e.includes("'priority'")), 'error mentions priority');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, id: '' });
  assert(r.valid === false, 'rejects empty id string');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, stage: 'bad_stage' });
  assert(r.valid === false, 'rejects invalid stage');
  assert(r.errors.some(e => e.includes("'stage'")), 'error mentions stage');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, status: 'retired' });
  assert(r.valid === false, 'rejects invalid status');
  assert(r.errors.some(e => e.includes("'status'")), 'error mentions status');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, priority: '10' });
  assert(r.valid === false, 'rejects string priority');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, priority: 10.5 });
  assert(r.valid === false, 'rejects float priority');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, capabilities: [] });
  assert(r.valid === false, 'rejects empty capabilities array');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, capabilities: ['email', 42] });
  assert(r.valid === false, 'rejects capabilities with non-string entries');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, category: 'unknown_category' });
  assert(r.valid === false, 'rejects unknown category');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, enabled_by_default: 'yes' });
  assert(r.valid === false, 'rejects non-boolean enabled_by_default');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, after: ['other_connector'] });
  assert(r.valid === true, 'accepts valid after array');
}

{
  const r = validateManifest({ ...VALID_MANIFEST, after: 'other_connector' });
  assert(r.valid === false, 'rejects after as string');
}

// VALID_STAGES and VALID_STATUSES exports
assert(Array.isArray(VALID_STAGES), 'VALID_STAGES is an array');
assert(VALID_STAGES.includes('source_sync'), 'VALID_STAGES includes source_sync');
assert(Array.isArray(VALID_STATUSES), 'VALID_STATUSES is an array');
assert(VALID_STATUSES.includes('production'), 'VALID_STATUSES includes production');
assert(Array.isArray(VALID_CATEGORIES), 'VALID_CATEGORIES is an array');
assert(VALID_CATEGORIES.includes('email'), 'VALID_CATEGORIES includes email');

// ---------------------------------------------------------------------------
// 2. registry — loadRegistry
// ---------------------------------------------------------------------------
console.log('\n== registry: loadRegistry ==');

// Create a temp adapters directory for testing
const TEMP_ADAPTERS = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-connectors-test-'));

function writeManifest(dir, name, content) {
  const connectorDir = path.join(dir, name);
  fs.mkdirSync(connectorDir, { recursive: true });
  fs.writeFileSync(path.join(connectorDir, 'manifest.json'), JSON.stringify(content));
}

// Write two valid manifests
writeManifest(TEMP_ADAPTERS, 'gmail', {
  id: 'gmail',
  display_name: 'Gmail',
  category: 'email',
  capabilities: ['email'],
  stage: 'source_sync',
  priority: 10,
  status: 'production',
});
writeManifest(TEMP_ADAPTERS, 'basecamp', {
  id: 'basecamp',
  display_name: 'Basecamp',
  category: 'project_management',
  capabilities: ['tasks', 'messages'],
  stage: 'source_sync',
  priority: 20,
  status: 'production',
});
// Write an invalid manifest (missing required fields)
writeManifest(TEMP_ADAPTERS, 'broken', {
  display_name: 'Broken',
  // missing id, capabilities, stage, priority, status, category
});
// Write a connector dir without manifest.json
fs.mkdirSync(path.join(TEMP_ADAPTERS, 'no_manifest'), { recursive: true });
// Write a connector dir with bad JSON
{
  const d = path.join(TEMP_ADAPTERS, 'bad_json');
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'manifest.json'), '{ bad json }');
}

const reg = loadRegistry(TEMP_ADAPTERS);

assert(reg.connectors instanceof Map, 'loadRegistry returns a Map of connectors');
assert(reg.connectors.has('gmail'), 'gmail connector loaded');
assert(reg.connectors.has('basecamp'), 'basecamp connector loaded');
assert(!reg.connectors.has('broken'), 'broken connector skipped');
assert(Array.isArray(reg.errors), 'errors is an array');
assert(reg.errors.some(e => e.includes('broken')), 'errors mention broken connector');
assert(reg.errors.some(e => e.includes('no_manifest')), 'errors mention no_manifest connector');
assert(reg.errors.some(e => e.includes('bad_json')), 'errors mention bad_json connector');

// Non-existent dir
{
  const r = loadRegistry('/tmp/__does_not_exist_vik__');
  assert(r.connectors.size === 0, 'non-existent adaptersDir returns empty connectors');
  assert(r.errors.length > 0, 'non-existent adaptersDir returns error');
}

// ---------------------------------------------------------------------------
// 3. registry — getConnectorsByStage
// ---------------------------------------------------------------------------
console.log('\n== registry: getConnectorsByStage ==');

// Add a preflight connector to test ordering
writeManifest(TEMP_ADAPTERS, 'preflight_a', {
  id: 'preflight_a',
  display_name: 'Preflight A',
  category: 'other',
  capabilities: ['check'],
  stage: 'preflight',
  priority: 5,
  status: 'production',
});
writeManifest(TEMP_ADAPTERS, 'preflight_b', {
  id: 'preflight_b',
  display_name: 'Preflight B',
  category: 'other',
  capabilities: ['check'],
  stage: 'preflight',
  priority: 5,
  status: 'production',
});

const reg2 = loadRegistry(TEMP_ADAPTERS);

const sourceSync = getConnectorsByStage(reg2, 'source_sync');
assert(sourceSync.length === 2, 'getConnectorsByStage returns correct count for source_sync');
assert(sourceSync[0].id === 'gmail', 'lower priority comes first (gmail=10, basecamp=20)');
assert(sourceSync[1].id === 'basecamp', 'higher priority comes second');

const preflight = getConnectorsByStage(reg2, 'preflight');
assert(preflight.length === 2, 'getConnectorsByStage returns both preflight connectors');
assert(preflight[0].id === 'preflight_a', 'ties sorted alphabetically — a before b');
assert(preflight[1].id === 'preflight_b', 'ties sorted alphabetically — b after a');

const derivation = getConnectorsByStage(reg2, 'derivation');
assert(derivation.length === 0, 'getConnectorsByStage returns empty for unused stage');

// ---------------------------------------------------------------------------
// 4. registry — getConnectorsByCapability
// ---------------------------------------------------------------------------
console.log('\n== registry: getConnectorsByCapability ==');

const emailConnectors = getConnectorsByCapability(reg2, 'email');
assert(emailConnectors.length === 1, 'getConnectorsByCapability finds email connectors');
assert(emailConnectors[0].id === 'gmail', 'email connector is gmail');

const tasksConnectors = getConnectorsByCapability(reg2, 'tasks');
assert(tasksConnectors.length === 1, 'getConnectorsByCapability finds tasks connectors');
assert(tasksConnectors[0].id === 'basecamp', 'tasks connector is basecamp');

const noneConnectors = getConnectorsByCapability(reg2, 'video_calls');
assert(noneConnectors.length === 0, 'getConnectorsByCapability returns empty for unknown capability');

// ---------------------------------------------------------------------------
// 5. registry — resolveAdapter
// ---------------------------------------------------------------------------
console.log('\n== registry: resolveAdapter ==');

// Create a real adapter file to test require
const gmailDir = path.join(TEMP_ADAPTERS, 'gmail');
fs.writeFileSync(path.join(gmailDir, 'auth.js'), `'use strict'; module.exports = { test: true };`);

// Update gmail manifest to include auth_adapter
writeManifest(TEMP_ADAPTERS, 'gmail', {
  id: 'gmail',
  display_name: 'Gmail',
  category: 'email',
  capabilities: ['email'],
  stage: 'source_sync',
  priority: 10,
  status: 'production',
  auth_adapter: 'auth.js',
});

const reg3 = loadRegistry(TEMP_ADAPTERS);
const authAdapter = resolveAdapter(reg3, 'gmail', 'auth');
assert(authAdapter !== null, 'resolveAdapter finds auth adapter');
assert(authAdapter.test === true, 'resolveAdapter returns correct module');

const syncAdapter = resolveAdapter(reg3, 'gmail', 'sync');
assert(syncAdapter === null, 'resolveAdapter returns null when sync_adapter not configured');

const missing = resolveAdapter(reg3, 'nonexistent', 'auth');
assert(missing === null, 'resolveAdapter returns null for unknown connector id');

// ---------------------------------------------------------------------------
// 6. auth_adapter — AUTH_METHODS and validateAuthAdapter
// ---------------------------------------------------------------------------
console.log('\n== auth_adapter: validateAuthAdapter ==');

assert(Array.isArray(AUTH_METHODS), 'AUTH_METHODS is an array');
assert(AUTH_METHODS.includes('start_auth'), 'AUTH_METHODS includes start_auth');
assert(AUTH_METHODS.includes('required_secrets'), 'AUTH_METHODS includes required_secrets');

const validAuth = {
  start_auth: () => {},
  finish_auth: () => {},
  refresh: () => {},
  revoke: () => {},
  status: () => {},
  required_secrets: ['CLIENT_ID', 'CLIENT_SECRET'],
};

{
  const r = validateAuthAdapter(validAuth);
  assert(r.valid === true, 'accepts valid auth adapter');
  assert(r.errors.length === 0, 'no errors on valid auth adapter');
}

{
  const r = validateAuthAdapter(null);
  assert(r.valid === false, 'rejects null auth adapter');
}

{
  const incomplete = { ...validAuth, start_auth: 'not_a_function' };
  const r = validateAuthAdapter(incomplete);
  assert(r.valid === false, 'rejects auth adapter with non-function method');
  assert(r.errors.some(e => e.includes("'start_auth'")), 'error mentions start_auth');
}

{
  const incomplete = { ...validAuth, required_secrets: 'CLIENT_ID' };
  const r = validateAuthAdapter(incomplete);
  assert(r.valid === false, 'rejects auth adapter with non-array required_secrets');
}

{
  const incomplete = { ...validAuth, required_secrets: [123] };
  const r = validateAuthAdapter(incomplete);
  assert(r.valid === false, 'rejects required_secrets with non-string entries');
}

{
  // Missing a method entirely
  const { revoke, ...noRevoke } = validAuth;
  const r = validateAuthAdapter(noRevoke);
  assert(r.valid === false, 'rejects auth adapter missing revoke');
  assert(r.errors.some(e => e.includes("'revoke'")), 'error mentions revoke');
}

// ---------------------------------------------------------------------------
// 7. auth_adapter — createAuthResult
// ---------------------------------------------------------------------------
console.log('\n== auth_adapter: createAuthResult ==');

{
  const r = createAuthResult({ connected: true });
  assert(r.connected === true, 'createAuthResult sets connected');
  assert(r.error === null, 'createAuthResult defaults error to null');
  assert(r.credentials === null, 'createAuthResult defaults credentials to null');
  assert(r.metadata === null, 'createAuthResult defaults metadata to null');
  assert(Object.isFrozen(r), 'createAuthResult returns frozen object');
}

{
  const r = createAuthResult({ connected: false, error: 'auth_failed', metadata: { person_id: '42' } });
  assert(r.connected === false, 'createAuthResult sets connected false');
  assert(r.error === 'auth_failed', 'createAuthResult sets error string');
  assert(r.metadata.person_id === '42', 'createAuthResult sets metadata');
  assert(Object.isFrozen(r), 'createAuthResult (failure) returns frozen object');
}

{
  let threw = false;
  try { createAuthResult({ connected: 'yes' }); } catch (e) { threw = true; }
  assert(threw, 'createAuthResult throws on non-boolean connected');
}

// ---------------------------------------------------------------------------
// 8. sync_adapter — SYNC_METHODS and validateSyncAdapter
// ---------------------------------------------------------------------------
console.log('\n== sync_adapter: validateSyncAdapter ==');

assert(typeof SYNC_METHODS === 'object', 'SYNC_METHODS is an object');
assert('initial_sync' in SYNC_METHODS, 'SYNC_METHODS has initial_sync');
assert(SYNC_METHODS.initial_sync === true, 'initial_sync is required (true)');
assert(SYNC_METHODS.discover === false, 'discover is optional (false)');

const validSync = {
  validate_config: () => {},
  initial_sync: () => {},
  incremental_sync: () => {},
  healthcheck: () => {},
  normalize: () => {},
  // discover is optional — omitted
};

{
  const r = validateSyncAdapter(validSync);
  assert(r.valid === true, 'accepts valid sync adapter (without optional discover)');
  assert(r.errors.length === 0, 'no errors on valid sync adapter');
}

{
  const withDiscover = { ...validSync, discover: () => {} };
  const r = validateSyncAdapter(withDiscover);
  assert(r.valid === true, 'accepts sync adapter with optional discover present');
}

{
  const r = validateSyncAdapter(null);
  assert(r.valid === false, 'rejects null sync adapter');
}

{
  const { initial_sync, ...missingRequired } = validSync;
  const r = validateSyncAdapter(missingRequired);
  assert(r.valid === false, 'rejects sync adapter missing required method');
  assert(r.errors.some(e => e.includes("'initial_sync'")), 'error mentions initial_sync');
}

{
  const badOptional = { ...validSync, discover: 'not_a_function' };
  const r = validateSyncAdapter(badOptional);
  assert(r.valid === false, 'rejects sync adapter with non-function optional method');
  assert(r.errors.some(e => e.includes("'discover'")), 'error mentions discover');
}

{
  const badRequired = { ...validSync, healthcheck: 123 };
  const r = validateSyncAdapter(badRequired);
  assert(r.valid === false, 'rejects sync adapter with non-function required method');
}

// ---------------------------------------------------------------------------
// 9. sync_adapter — createSyncResult
// ---------------------------------------------------------------------------
console.log('\n== sync_adapter: createSyncResult ==');

{
  const r = createSyncResult({ success: true });
  assert(r.success === true, 'createSyncResult sets success');
  assert(r.data === null, 'createSyncResult defaults data to null');
  assertDeepEqual(r.errors, [], 'createSyncResult defaults errors to []');
  assert(r.metadata === null, 'createSyncResult defaults metadata to null');
  assert(Object.isFrozen(r), 'createSyncResult returns frozen object');
}

{
  const r = createSyncResult({ success: false, errors: ['timeout'], metadata: { source: 'gmail' } });
  assert(r.success === false, 'createSyncResult sets success false');
  assertDeepEqual(r.errors, ['timeout'], 'createSyncResult sets errors array');
  assert(r.metadata.source === 'gmail', 'createSyncResult sets metadata');
  assert(Object.isFrozen(r), 'createSyncResult (failure) returns frozen object');
}

{
  let threw = false;
  try { createSyncResult({ success: 'yes' }); } catch (e) { threw = true; }
  assert(threw, 'createSyncResult throws on non-boolean success');
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
fs.rmSync(TEMP_ADAPTERS, { recursive: true, force: true });

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n== Results: ${passed} passed, ${failed} failed ==`);
if (failed > 0) {
  process.exit(1);
}
