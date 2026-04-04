'use strict';

// ---------------------------------------------------------------------------
// Adapter tests — Gmail and Basecamp auth adapters
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const os = require('os');

const { validateManifest } = require('../manifest_schema');
const { validateAuthAdapter, createAuthResult } = require('../auth_adapter');
const { loadRegistry, resolveAdapter, getConnectorsByStage } = require('../registry');

const gmailAuth = require('./gmail/auth');
const basecampAuth = require('./basecamp/auth');

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

// ---------------------------------------------------------------------------
// 1. Manifest validation
// ---------------------------------------------------------------------------
console.log('\n== Manifests: validateManifest ==');

{
  const gmailManifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'gmail', 'manifest.json'), 'utf8')
  );
  const r = validateManifest(gmailManifest);
  assert(r.valid === true, 'Gmail manifest is valid');
  assert(r.errors.length === 0, 'Gmail manifest has no validation errors');
  assert(gmailManifest.id === 'gmail', 'Gmail manifest id is "gmail"');
  assert(gmailManifest.category === 'email', 'Gmail manifest category is "email"');
  assert(gmailManifest.auth_adapter === 'auth.js', 'Gmail manifest auth_adapter is "auth.js"');
  assert(gmailManifest.stage === 'source_sync', 'Gmail manifest stage is source_sync');
  assert(gmailManifest.priority === 10, 'Gmail manifest priority is 10');
  assert(gmailManifest.status === 'production', 'Gmail manifest status is production');
}

{
  const basecampManifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'basecamp', 'manifest.json'), 'utf8')
  );
  const r = validateManifest(basecampManifest);
  assert(r.valid === true, 'Basecamp manifest is valid');
  assert(r.errors.length === 0, 'Basecamp manifest has no validation errors');
  assert(basecampManifest.id === 'basecamp', 'Basecamp manifest id is "basecamp"');
  assert(basecampManifest.category === 'project_management', 'Basecamp manifest category is "project_management"');
  assert(basecampManifest.auth_adapter === 'auth.js', 'Basecamp manifest auth_adapter is "auth.js"');
  assert(basecampManifest.stage === 'source_sync', 'Basecamp manifest stage is source_sync');
  assert(basecampManifest.priority === 20, 'Basecamp manifest priority is 20');
  assert(Array.isArray(basecampManifest.after) && basecampManifest.after.includes('gmail'), 'Basecamp manifest after includes gmail');
}

// ---------------------------------------------------------------------------
// 2. Auth adapter contract validation
// ---------------------------------------------------------------------------
console.log('\n== Auth adapters: validateAuthAdapter ==');

{
  const r = validateAuthAdapter(gmailAuth);
  assert(r.valid === true, 'Gmail auth adapter passes contract validation');
  assert(r.errors.length === 0, 'Gmail auth adapter has no contract errors');
}

{
  const r = validateAuthAdapter(basecampAuth);
  assert(r.valid === true, 'Basecamp auth adapter passes contract validation');
  assert(r.errors.length === 0, 'Basecamp auth adapter has no contract errors');
}

// required_secrets arrays
assert(Array.isArray(gmailAuth.required_secrets), 'Gmail required_secrets is an array');
assert(gmailAuth.required_secrets.includes('gws_config_dir'), 'Gmail required_secrets includes gws_config_dir');

assert(Array.isArray(basecampAuth.required_secrets), 'Basecamp required_secrets is an array');
assert(basecampAuth.required_secrets.includes('client_id'), 'Basecamp required_secrets includes client_id');
assert(basecampAuth.required_secrets.includes('client_secret'), 'Basecamp required_secrets includes client_secret');

// Methods are functions
for (const method of ['start_auth', 'finish_auth', 'refresh', 'revoke', 'status']) {
  assert(typeof gmailAuth[method] === 'function', `Gmail auth adapter has ${method} function`);
  assert(typeof basecampAuth[method] === 'function', `Basecamp auth adapter has ${method} function`);
}

// ---------------------------------------------------------------------------
// 3. Registry loads both adapters
// ---------------------------------------------------------------------------
console.log('\n== Registry: loadRegistry + resolveAdapter ==');

const adaptersDir = __dirname;
const registry = loadRegistry(adaptersDir);

assert(registry.connectors instanceof Map, 'loadRegistry returns a Map');
assert(registry.connectors.has('gmail'), 'Registry loaded gmail connector');
assert(registry.connectors.has('basecamp'), 'Registry loaded basecamp connector');

// resolveAdapter returns the correct auth modules
const resolvedGmailAuth = resolveAdapter(registry, 'gmail', 'auth');
assert(resolvedGmailAuth !== null, 'resolveAdapter returns gmail auth module');
assert(typeof resolvedGmailAuth.start_auth === 'function', 'Resolved gmail auth has start_auth');

const resolvedBasecampAuth = resolveAdapter(registry, 'basecamp', 'auth');
assert(resolvedBasecampAuth !== null, 'resolveAdapter returns basecamp auth module');
assert(typeof resolvedBasecampAuth.start_auth === 'function', 'Resolved basecamp auth has start_auth');

// Both have sync adapters configured
const gmailSync = resolveAdapter(registry, 'gmail', 'sync');
assert(gmailSync !== null, 'resolveAdapter returns gmail sync module');
assert(typeof gmailSync.validate_config === 'function', 'Resolved gmail sync has validate_config');

const basecampSync = resolveAdapter(registry, 'basecamp', 'sync');
assert(basecampSync !== null, 'resolveAdapter returns basecamp sync module');
assert(typeof basecampSync.validate_config === 'function', 'Resolved basecamp sync has validate_config');

// ---------------------------------------------------------------------------
// 4. Stage ordering — gmail first (priority 10 < 20)
// ---------------------------------------------------------------------------
console.log('\n== Registry: stage ordering ==');

const sourceSyncConnectors = getConnectorsByStage(registry, 'source_sync');
// Filter to just gmail and basecamp in case test_adapters dir has other stubs
const relevant = sourceSyncConnectors.filter(c => c.id === 'gmail' || c.id === 'basecamp');

assert(relevant.length === 2, 'Both gmail and basecamp are in source_sync stage');
assert(relevant[0].id === 'gmail', 'Gmail comes first (priority 10)');
assert(relevant[1].id === 'basecamp', 'Basecamp comes second (priority 20)');

// ---------------------------------------------------------------------------
// 5. No-op paths: refresh, revoke — test return shapes
// ---------------------------------------------------------------------------
console.log('\n== Auth adapters: no-op paths (refresh, revoke) ==');

// Gmail refresh — no-op, always connected
{
  const result = gmailAuth.refresh();
  assert(result.connected === true, 'Gmail refresh returns connected: true');
  assert(result.error === null, 'Gmail refresh has no error');
  assert(Object.isFrozen(result), 'Gmail refresh result is frozen');
}

// Gmail revoke — manual
{
  const result = gmailAuth.revoke();
  assert(result.connected === false, 'Gmail revoke returns connected: false');
  assert(result.metadata && result.metadata.note === 'manual revocation required', 'Gmail revoke includes manual revocation note');
  assert(Object.isFrozen(result), 'Gmail revoke result is frozen');
}

// Basecamp revoke — manual
{
  const result = basecampAuth.revoke();
  assert(result.connected === false, 'Basecamp revoke returns connected: false');
  assert(result.metadata && result.metadata.note === 'manual revocation required', 'Basecamp revoke includes manual revocation note');
  assert(Object.isFrozen(result), 'Basecamp revoke result is frozen');
}

// ---------------------------------------------------------------------------
// 6. Status paths with missing / empty args
// ---------------------------------------------------------------------------
console.log('\n== Auth adapters: status with no/empty args ==');

// Gmail status — missing config_dir
{
  const result = gmailAuth.status({});
  assert(result.connected === false, 'Gmail status without config_dir returns connected: false');
  assert(typeof result.error === 'string', 'Gmail status without config_dir returns an error string');
  assert(Object.isFrozen(result), 'Gmail status result is frozen');
}

// Gmail finish_auth — missing config_dir
{
  const result = gmailAuth.finish_auth({});
  assert(result.connected === false, 'Gmail finish_auth without config_dir returns connected: false');
  assert(Object.isFrozen(result), 'Gmail finish_auth result is frozen');
}

// Basecamp status — missing home_root defaults to ~, no token file present in test context
{
  // Use a temp dir that definitely has no token file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-status-test-'));
  const result = basecampAuth.status({ home_root: tmpDir });
  assert(result.connected === false, 'Basecamp status with no token file returns connected: false');
  assert(Object.isFrozen(result), 'Basecamp status result is frozen');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Basecamp finish_auth — missing credential files
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-finish-test-'));
  const result = basecampAuth.finish_auth({ home_root: tmpDir });
  assert(result.connected === false, 'Basecamp finish_auth with no credential files returns connected: false');
  assert(typeof result.error === 'string', 'Basecamp finish_auth returns an error string');
  assert(Object.isFrozen(result), 'Basecamp finish_auth result is frozen');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Basecamp finish_auth — files present with valid token
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-finish-ok-test-'));
  fs.writeFileSync(path.join(tmpDir, '.env.basecamp'), 'BASECAMP_ACCOUNT_ID=123\n', { mode: 0o600 });
  fs.writeFileSync(path.join(tmpDir, '.env.basecamp.tokens'), 'BASECAMP_ACCESS_TOKEN=tok\nBASECAMP_REFRESH_TOKEN=ref\n', { mode: 0o600 });
  const result = basecampAuth.finish_auth({ home_root: tmpDir });
  assert(result.connected === true, 'Basecamp finish_auth with valid token files returns connected: true');
  assert(Object.isFrozen(result), 'Basecamp finish_auth success result is frozen');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Basecamp status — files present with valid access token
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-status-ok-test-'));
  fs.writeFileSync(path.join(tmpDir, '.env.basecamp.tokens'), 'BASECAMP_ACCESS_TOKEN=tok\nBASECAMP_REFRESH_TOKEN=ref\n', { mode: 0o600 });
  const result = basecampAuth.status({ home_root: tmpDir });
  assert(result.connected === true, 'Basecamp status with valid access token returns connected: true');
  assert(Object.isFrozen(result), 'Basecamp status success result is frozen');
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// Basecamp start_auth — missing account_id
{
  const result = basecampAuth.start_auth({});
  assert(result.connected === false, 'Basecamp start_auth without account_id returns connected: false');
  assert(typeof result.error === 'string', 'Basecamp start_auth without account_id returns an error');
  assert(Object.isFrozen(result), 'Basecamp start_auth error result is frozen');
}

// Gmail start_auth — missing config_dir
{
  const result = gmailAuth.start_auth({});
  assert(result.connected === false, 'Gmail start_auth without config_dir returns connected: false');
  assert(typeof result.error === 'string', 'Gmail start_auth without config_dir returns an error');
  assert(Object.isFrozen(result), 'Gmail start_auth error result is frozen');
}

// ---------------------------------------------------------------------------
// 7. createAuthResult shapes from adapter methods are well-formed
// ---------------------------------------------------------------------------
console.log('\n== createAuthResult shape verification ==');

{
  const r = gmailAuth.refresh();
  assert('connected' in r, 'Gmail refresh result has connected field');
  assert('error' in r, 'Gmail refresh result has error field');
  assert('credentials' in r, 'Gmail refresh result has credentials field');
  assert('metadata' in r, 'Gmail refresh result has metadata field');
}

{
  const r = basecampAuth.revoke();
  assert('connected' in r, 'Basecamp revoke result has connected field');
  assert('error' in r, 'Basecamp revoke result has error field');
  assert('credentials' in r, 'Basecamp revoke result has credentials field');
  assert('metadata' in r, 'Basecamp revoke result has metadata field');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n== Results: ${passed} passed, ${failed} failed ==`);
if (failed > 0) {
  process.exit(1);
}
