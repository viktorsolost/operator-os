'use strict';

const path = require('path');
const fs = require('fs');

const { loadRegistry } = require('./registry');
const { dispatchAuth, dispatchAllAuth, buildGuidance } = require('./auth_dispatcher');
const { connectAccounts } = require('../onboarding/account_connector');

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

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Got:      ${JSON.stringify(actual)}`);
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ADAPTERS_DIR = path.resolve(__dirname, 'adapters');

// ---------------------------------------------------------------------------
// Test 1: dispatchAuth with valid gmail adapter — calls status action
// ---------------------------------------------------------------------------
console.log('\n--- Test 1: dispatchAuth with real gmail adapter (status) ---');
{
  const registry = loadRegistry(ADAPTERS_DIR);
  assert(registry.connectors.has('gmail'), 'Registry has gmail connector');

  const dispatched = dispatchAuth({
    registry,
    connectorId: 'gmail',
    action: 'status',
    config: { config_dir: '/nonexistent/config/dir' },
  });

  assert(dispatched.connector_id === 'gmail', 'Result has correct connector_id');
  assert(typeof dispatched.result === 'object', 'Result has a result object');
  assert(typeof dispatched.result.connected === 'boolean', 'Result.connected is boolean');
  assert(dispatched.result.error === null || typeof dispatched.result.error === 'string', 'Result.error is null or string');
  // nonexistent config dir should produce connected: false
  assert(dispatched.result.connected === false, 'Nonexistent config dir gives connected: false');
}

// ---------------------------------------------------------------------------
// Test 2: dispatchAuth with unknown connector — returns connected: false with error
// ---------------------------------------------------------------------------
console.log('\n--- Test 2: dispatchAuth with unknown connector ---');
{
  const registry = loadRegistry(ADAPTERS_DIR);

  const dispatched = dispatchAuth({
    registry,
    connectorId: 'nonexistent_connector',
    action: 'status',
    config: {},
  });

  assert(dispatched.connector_id === 'nonexistent_connector', 'Unknown connector returns correct id');
  assert(dispatched.result.connected === false, 'Unknown connector gives connected: false');
  assert(typeof dispatched.result.error === 'string', 'Unknown connector error is a string');
  assert(dispatched.result.error.includes('nonexistent_connector'), 'Error message names the missing connector');
}

// ---------------------------------------------------------------------------
// Test 3: dispatchAllAuth with mock adapters — all connectors dispatched
// ---------------------------------------------------------------------------
console.log('\n--- Test 3: dispatchAllAuth with mock registry ---');
{
  // Build a mock registry inline
  const { createAuthResult } = require('./auth_adapter');
  const mockRegistry = {
    connectors: new Map([
      ['mock_a', { id: 'mock_a', display_name: 'Mock A', _connector_dir: __dirname, auth_adapter: null }],
      ['mock_b', { id: 'mock_b', display_name: 'Mock B', _connector_dir: __dirname, auth_adapter: null }],
    ]),
  };

  // Inject mock adapters into require cache
  const mockAdapterA = {
    required_secrets: ['secret_a'],
    start_auth: () => createAuthResult({ connected: true }),
    finish_auth: () => createAuthResult({ connected: true }),
    refresh: () => createAuthResult({ connected: true }),
    revoke: () => createAuthResult({ connected: false }),
    status: () => createAuthResult({ connected: true }),
  };
  const mockAdapterB = {
    required_secrets: ['secret_b'],
    start_auth: () => createAuthResult({ connected: false, error: 'no token' }),
    finish_auth: () => createAuthResult({ connected: false }),
    refresh: () => createAuthResult({ connected: false }),
    revoke: () => createAuthResult({ connected: false }),
    status: () => createAuthResult({ connected: false }),
  };

  // Override resolveAdapter for this test via inline dispatch
  // Since we can't easily mock the registry file loading, we test dispatchAllAuth
  // by using the real adapters dir — but we verify the shape is correct.
  // For full mock coverage, test the function logic directly:

  const connectorConfigs = [
    { connector_id: 'mock_a', config: {} },
    { connector_id: 'mock_b', config: {} },
  ];

  // Test the declared (non-interactive) path: unknown connectors return connected: false
  const { dispatchAllAuth: daa } = require('./auth_dispatcher');
  const result = daa({
    registry: mockRegistry,
    connectorConfigs,
    interactive: false,
  });

  assert(Array.isArray(result.results), 'Results is an array');
  assert(result.results.length === 2, 'All connectors dispatched (2 results)');
  assert(typeof result.summary === 'object', 'Summary object present');
  assert(result.summary.total === 2, 'Summary total = 2');
  assert(typeof result.summary.connected === 'number', 'Summary connected is a number');
  assert(typeof result.summary.failed === 'number', 'Summary failed is a number');
  assert(result.summary.connected + result.summary.failed === result.summary.total, 'Summary connected + failed = total');
  // Both connectors have null auth_adapter, so both return connected: false
  assert(result.summary.connected === 0, 'Mock connectors with no adapter all return connected: false');
  assert(result.summary.failed === 2, 'Mock connectors with no adapter all fail');
}

// ---------------------------------------------------------------------------
// Test 4: dispatchAllAuth with real adapters in declared (non-interactive) mode
// ---------------------------------------------------------------------------
console.log('\n--- Test 4: dispatchAllAuth with real adapters (non-interactive) ---');
{
  const registry = loadRegistry(ADAPTERS_DIR);
  const connectorConfigs = [
    { connector_id: 'gmail', config: { config_dir: '/nonexistent/path' } },
    { connector_id: 'basecamp', config: { home_root: '/nonexistent/home' } },
  ];

  const result = dispatchAllAuth({ registry, connectorConfigs, interactive: false });

  assert(result.results.length === 2, 'Both connectors dispatched');
  assert(result.summary.total === 2, 'Summary total correct');
  assert(result.results[0].connector_id === 'gmail', 'First result is gmail');
  assert(result.results[1].connector_id === 'basecamp', 'Second result is basecamp');
  // Nonexistent paths produce connected: false
  assert(result.summary.connected === 0, 'No connections with nonexistent paths');
}

// ---------------------------------------------------------------------------
// Test 5: buildGuidance generates human-readable strings for each connector
// ---------------------------------------------------------------------------
console.log('\n--- Test 5: buildGuidance ---');
{
  const registry = loadRegistry(ADAPTERS_DIR);
  const connectorConfigs = [
    { connector_id: 'gmail', config: { config_dir: '~/.config/gws-work', label: 'Work' } },
    { connector_id: 'basecamp', config: { account_id: '123456' } },
  ];

  const guidance = buildGuidance({ registry, connectorConfigs });

  assert(Array.isArray(guidance), 'buildGuidance returns an array');
  assert(guidance.length === 2, 'One guidance string per connector');
  assert(typeof guidance[0] === 'string', 'Guidance strings are strings');
  assert(typeof guidance[1] === 'string', 'Guidance strings are strings');
  assert(guidance[0].includes('Gmail'), 'Gmail guidance mentions Gmail');
  assert(guidance[1].includes('Basecamp'), 'Basecamp guidance mentions Basecamp');
  // Check required_secrets are mentioned
  assert(guidance[0].includes('gws_config_dir'), 'Gmail guidance mentions required secret');
  assert(guidance[1].includes('client_id'), 'Basecamp guidance mentions required secret');
}

// ---------------------------------------------------------------------------
// Test 6: buildGuidance with unknown connector — gracefully degrades
// ---------------------------------------------------------------------------
console.log('\n--- Test 6: buildGuidance with unknown connector ---');
{
  const registry = loadRegistry(ADAPTERS_DIR);
  const connectorConfigs = [
    { connector_id: 'unknown_thing', config: {} },
  ];

  const guidance = buildGuidance({ registry, connectorConfigs });
  assert(guidance.length === 1, 'Still produces one guidance string');
  assert(guidance[0].includes('unknown_thing'), 'Falls back to connector_id in guidance');
}

// ---------------------------------------------------------------------------
// Test 7: Refactored connectAccounts with mock connections — same shape as before
// ---------------------------------------------------------------------------
console.log('\n--- Test 7: connectAccounts with mockConnections (shape check) ---');
{
  const packet = {
    connect_accounts_now: 'now',
    gmail_accounts: [
      { name: 'gws-work', label: 'Work' },
      { name: 'gws-personal', label: 'Personal' },
    ],
    basecamp_account_id: '9876543',
    basecamp_person_id: '12345678',
  };

  const mockConnections = {
    gmail: [
      { name: 'gws-work', config_dir: '~/.config/gws-work', label: 'Work' },
      { name: 'gws-personal', config_dir: '~/.config/gws-personal', label: 'Personal' },
    ],
    basecamp: {
      account_id: '9876543',
      api_base: 'https://3.basecampapi.com/9876543',
      connected: true,
    },
    sourceIdentities: {
      basecamp: { owner: { person_id: '12345678' } },
    },
  };

  const result = connectAccounts({ packet, mockConnections });

  assert(Array.isArray(result.gmail), 'result.gmail is array');
  assert(result.gmail.length === 2, 'result.gmail has 2 accounts');
  assert(result.gmail[0].name === 'gws-work', 'First gmail account name correct');
  assert(result.gmail[0].config_dir === '~/.config/gws-work', 'First gmail config_dir correct');
  assert(result.gmail[0].label === 'Work', 'First gmail label correct');
  assert(result.basecamp !== null, 'result.basecamp is not null');
  assert(result.basecamp.account_id === '9876543', 'basecamp account_id correct');
  assert(result.basecamp.connected === true, 'basecamp connected is true');
  assert(result.sourceIdentities.basecamp.owner.person_id === '12345678', 'sourceIdentities shape correct');
  assert(result.mode === 'mock', 'mode is mock');
  assert(result.skipped === false, 'skipped is false');
}

// ---------------------------------------------------------------------------
// Test 8: connectAccounts with connect_accounts_now === 'later' — same empty shape
// ---------------------------------------------------------------------------
console.log('\n--- Test 8: connectAccounts with connect_accounts_now = later ---');
{
  const packet = {
    connect_accounts_now: 'later',
    gmail_accounts: [{ name: 'gws-work', label: 'Work' }],
    basecamp_account_id: '9876543',
  };

  const result = connectAccounts({ packet });

  assert(Array.isArray(result.gmail), 'result.gmail is array');
  assert(result.gmail.length === 0, 'result.gmail is empty');
  assert(result.basecamp === null, 'result.basecamp is null');
  assert(typeof result.sourceIdentities === 'object', 'sourceIdentities is object');
  assert(Object.keys(result.sourceIdentities).length === 0, 'sourceIdentities is empty');
  assert(result.skipped === true, 'skipped is true');
}

// ---------------------------------------------------------------------------
// Test 9: connectAccounts declared path — guidance generated via dispatcher
// ---------------------------------------------------------------------------
console.log('\n--- Test 9: connectAccounts declared path (no interactive, no mock) ---');
{
  const packet = {
    connect_accounts_now: 'now',
    gmail_accounts: [
      { name: 'gws-work', label: 'Work email' },
    ],
    basecamp_account_id: '1234567',
    basecamp_person_id: '9999',
  };

  const result = connectAccounts({ packet, interactive: false });

  assert(Array.isArray(result.gmail), 'result.gmail is array');
  assert(result.gmail.length === 1, 'result.gmail has 1 account');
  assert(result.gmail[0].name === 'gws-work', 'Gmail account name correct');
  assert(result.gmail[0].connected === true, 'Declared path: gmail connected = true');
  assert(result.basecamp !== null, 'result.basecamp not null');
  assert(result.basecamp.account_id === '1234567', 'basecamp account_id correct');
  assert(result.basecamp.connected === true, 'Declared path: basecamp connected = true');
  assert(result.sourceIdentities.basecamp.owner.person_id === '9999', 'sourceIdentities has person_id');
  assert(result.mode === 'declared', 'mode is declared');
  assert(Array.isArray(result.guidance), 'guidance is array');
  assert(result.guidance.length === 2, 'One guidance string per connector');
}

// ---------------------------------------------------------------------------
// Test 10: Verify no references to runGwsAuth or runBasecampAuth in account_connector.js
// ---------------------------------------------------------------------------
console.log('\n--- Test 10: No hardcoded runGwsAuth/runBasecampAuth in account_connector.js ---');
{
  const acPath = path.resolve(__dirname, '../onboarding/account_connector.js');
  const content = fs.readFileSync(acPath, 'utf8');

  assert(!content.includes('runGwsAuth'), 'No runGwsAuth in account_connector.js');
  assert(!content.includes('runBasecampAuth'), 'No runBasecampAuth in account_connector.js');
  assert(!content.includes('verifyGwsAuth'), 'No verifyGwsAuth in account_connector.js');
  assert(content.includes('dispatchAuth'), 'dispatchAuth is used in account_connector.js');
  assert(content.includes('auth_dispatcher'), 'auth_dispatcher is imported in account_connector.js');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n=== AUTH DISPATCHER TEST SUMMARY ===`);
console.log(`Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
