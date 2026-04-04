'use strict';

// ---------------------------------------------------------------------------
// Connector Extensibility Acceptance Tests
// Tests EX-1 through EX-6 from the connector architecture packet.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const os = require('os');

const { loadRegistry, resolveAdapter, getConnectorsByStage } = require('./registry');
const { validateDependencyGraph, buildExecutionPlan, executeStages } = require('./planner');
const { dispatchAuth } = require('./auth_dispatcher');
const { validateAuthAdapter, createAuthResult } = require('./auth_adapter');
const { buildConnectorsSection } = require('../onboarding/pipeline_configurator');

const ADAPTERS_DIR = path.resolve(__dirname, 'adapters');

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

// ---------------------------------------------------------------------------
// Temp dir management
// ---------------------------------------------------------------------------

function createTempAdaptersDir() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'connector-test-'));

  // Copy gmail/ and basecamp/ into tmp dir
  for (const adapterName of ['gmail', 'basecamp']) {
    const src = path.join(ADAPTERS_DIR, adapterName);
    const dest = path.join(tmpDir, adapterName);
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
    }
  }

  // Create test-slack/ directory
  const slackDir = path.join(tmpDir, 'test-slack');
  fs.mkdirSync(slackDir, { recursive: true });

  // Write test-slack manifest.json
  const slackManifest = {
    id: 'test-slack',
    display_name: 'Test Slack',
    category: 'chat',
    capabilities: ['chat', 'messages'],
    auth_adapter: 'auth.js',
    stage: 'source_sync',
    priority: 15,
    status: 'experimental',
  };
  fs.writeFileSync(
    path.join(slackDir, 'manifest.json'),
    JSON.stringify(slackManifest, null, 2) + '\n',
    'utf8'
  );

  // Write test-slack auth.js — minimal adapter implementing the contract
  const slackAuthJs = `'use strict';

const { createAuthResult } = require(${JSON.stringify(path.resolve(__dirname, 'auth_adapter'))});

const required_secrets = ['api_token'];

function start_auth() { return createAuthResult({ connected: false }); }
function finish_auth() { return createAuthResult({ connected: false }); }
function refresh() { return createAuthResult({ connected: false }); }
function revoke() { return createAuthResult({ connected: false }); }
function status() { return createAuthResult({ connected: false }); }

module.exports = { required_secrets, start_auth, finish_auth, refresh, revoke, status };
`;
  fs.writeFileSync(path.join(slackDir, 'auth.js'), slackAuthJs, 'utf8');

  return tmpDir;
}

function removeTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {
    // best effort
  }
}

// ---------------------------------------------------------------------------
// EX-1: No-core-edit extensibility
// ---------------------------------------------------------------------------

section('EX-1: No-core-edit extensibility');

const tmpAdaptersDir = createTempAdaptersDir();
let ex1Registry;

try {
  ex1Registry = loadRegistry(tmpAdaptersDir);

  assert(ex1Registry.errors.length === 0, 'Registry loads with no errors');
  assert(ex1Registry.connectors.has('test-slack'), 'test-slack appears in registry');
  assert(ex1Registry.connectors.has('gmail'), 'gmail still present in registry');
  assert(ex1Registry.connectors.has('basecamp'), 'basecamp still present in registry');
  assert(ex1Registry.connectors.size === 3, 'Registry has exactly 3 connectors');

  // resolveAdapter returns the test-slack auth module
  const slackAdapter = resolveAdapter(ex1Registry, 'test-slack', 'auth');
  assert(slackAdapter !== null, 'resolveAdapter returns test-slack auth module');
  assert(typeof slackAdapter.start_auth === 'function', 'test-slack auth.start_auth is a function');
  assert(Array.isArray(slackAdapter.required_secrets), 'test-slack auth.required_secrets is an array');
  assert(
    slackAdapter.required_secrets.includes('api_token'),
    "test-slack auth.required_secrets includes 'api_token'"
  );

  // Validate the test-slack adapter against the contract
  const { valid: adapterValid, errors: adapterErrors } = validateAuthAdapter(slackAdapter);
  assert(adapterValid, `test-slack auth adapter passes contract validation (errors: ${adapterErrors.join('; ')})`);

  // getConnectorsByStage returns all 3 in source_sync, ordered gmail(10), test-slack(15), basecamp(20)
  const sourceSyncConnectors = getConnectorsByStage(ex1Registry, 'source_sync');
  assert(sourceSyncConnectors.length === 3, 'getConnectorsByStage returns 3 source_sync connectors');
  assert(sourceSyncConnectors[0].id === 'gmail', 'First connector is gmail (priority 10)');
  assert(sourceSyncConnectors[1].id === 'test-slack', 'Second connector is test-slack (priority 15)');
  assert(sourceSyncConnectors[2].id === 'basecamp', 'Third connector is basecamp (priority 20)');

  // dispatchAuth works for test-slack (returns a valid auth result shape)
  const dispatchResult = dispatchAuth({
    registry: ex1Registry,
    connectorId: 'test-slack',
    action: 'status',
    config: {},
  });
  assert(dispatchResult.connector_id === 'test-slack', 'dispatchAuth result has correct connector_id');
  assert(typeof dispatchResult.result.connected === 'boolean', 'dispatchAuth result.connected is a boolean');

  // Verify no source files were modified by checking mtimes of core files
  const coreFiles = [
    path.resolve(__dirname, 'registry.js'),
    path.resolve(__dirname, 'planner.js'),
    path.resolve(__dirname, 'auth_dispatcher.js'),
    path.resolve(__dirname, 'manifest_schema.js'),
    path.resolve(__dirname, 'auth_adapter.js'),
  ];
  const now = Date.now();
  const recentlyModified = coreFiles.filter(f => {
    try {
      const stat = fs.statSync(f);
      // Consider "recently modified" = within this test run (< 5 seconds ago)
      return (now - stat.mtimeMs) < 5000;
    } catch (_) {
      return false;
    }
  });
  assert(recentlyModified.length === 0, `No core pipeline files were modified (checked ${coreFiles.length} files)`);

} finally {
  removeTempDir(tmpAdaptersDir);
}

// ---------------------------------------------------------------------------
// EX-2: Planner rejects invalid dependency graphs
// ---------------------------------------------------------------------------

section('EX-2: Planner rejects invalid dependency graphs');

{
  // Cycle: A after B, B after A
  const cyclicConnectors = [
    { id: 'A', stage: 'source_sync', priority: 10, after: ['B'] },
    { id: 'B', stage: 'source_sync', priority: 10, after: ['A'] },
  ];
  const cycleResult = validateDependencyGraph(cyclicConnectors);
  assert(cycleResult.valid === false, 'Cycle A->B->A is rejected as invalid');
  assert(Array.isArray(cycleResult.errors) && cycleResult.errors.length > 0, 'Cycle produces descriptive errors');
  assert(
    cycleResult.errors.some(e => e.toLowerCase().includes('cycle')),
    'Cycle error message contains "cycle"'
  );
}

{
  // Cross-stage: A in source_sync after B in preflight
  const crossStageConnectors = [
    { id: 'A', stage: 'source_sync', priority: 10, after: ['B'] },
    { id: 'B', stage: 'preflight', priority: 10 },
  ];
  const crossStageResult = validateDependencyGraph(crossStageConnectors);
  assert(crossStageResult.valid === false, 'Cross-stage dependency is rejected as invalid');
  assert(
    crossStageResult.errors.some(e => e.toLowerCase().includes('cross-stage') || e.toLowerCase().includes('stage')),
    'Cross-stage error message mentions stage'
  );
}

{
  // Self-reference: A after A
  const selfRefConnectors = [
    { id: 'A', stage: 'source_sync', priority: 10, after: ['A'] },
  ];
  const selfRefResult = validateDependencyGraph(selfRefConnectors);
  assert(selfRefResult.valid === false, 'Self-reference A after A is rejected as invalid');
  assert(
    selfRefResult.errors.some(e => e.toLowerCase().includes('itself') || e.toLowerCase().includes('self')),
    'Self-reference error message is descriptive'
  );
}

{
  // Missing dep: A after nonexistent
  const missingDepConnectors = [
    { id: 'A', stage: 'source_sync', priority: 10, after: ['nonexistent'] },
  ];
  const missingDepResult = validateDependencyGraph(missingDepConnectors);
  assert(missingDepResult.valid === false, 'Missing dependency is rejected as invalid');
  assert(
    missingDepResult.errors.some(e => e.includes('nonexistent') || e.toLowerCase().includes('non-existent')),
    'Missing dep error message names the missing connector'
  );
}

// ---------------------------------------------------------------------------
// EX-3: Deterministic execution order
// ---------------------------------------------------------------------------

section('EX-3: Deterministic execution order');

{
  const threeConnectors = [
    { id: 'gmail', stage: 'source_sync', priority: 10 },
    { id: 'basecamp', stage: 'source_sync', priority: 20, after: ['gmail'] },
    { id: 'test-slack', stage: 'source_sync', priority: 15 },
  ];

  const plan1 = buildExecutionPlan(threeConnectors);
  const plan2 = buildExecutionPlan(threeConnectors);

  assert(plan1.valid === true, 'First buildExecutionPlan call is valid');
  assert(plan2.valid === true, 'Second buildExecutionPlan call is valid');
  assert(
    JSON.stringify(plan1.plan) === JSON.stringify(plan2.plan),
    'Both runs produce identical plans (deterministic)'
  );

  const sourceSyncPlan = plan1.plan.find(s => s.stage === 'source_sync');
  assert(sourceSyncPlan !== undefined, 'source_sync stage present in plan');
  assert(sourceSyncPlan.connectors.length === 3, 'source_sync has 3 connectors in plan');
  assert(sourceSyncPlan.connectors[0].id === 'gmail', 'Plan order: gmail first');
  assert(sourceSyncPlan.connectors[1].id === 'test-slack', 'Plan order: test-slack second');
  assert(sourceSyncPlan.connectors[2].id === 'basecamp', 'Plan order: basecamp third');
}

// ---------------------------------------------------------------------------
// EX-4: Derive steps only after source sync
// ---------------------------------------------------------------------------

section('EX-4: Derivation connectors only run after source_sync completes');

{
  const executionLog = [];

  const mixedConnectors = [
    { id: 'gmail', stage: 'source_sync', priority: 10 },
    { id: 'enrich', stage: 'derivation', priority: 10 },
  ];

  const planResult = buildExecutionPlan(mixedConnectors);
  assert(planResult.valid === true, 'Plan with source_sync + derivation is valid');

  const mockExecutor = (connector, stage) => {
    executionLog.push({ id: connector.id, stage });
    return { success: true };
  };

  executeStages(planResult.plan, mockExecutor);

  // Find indices of the last source_sync connector and the first derivation connector
  const lastSourceSyncIdx = executionLog.reduce((last, entry, idx) =>
    entry.stage === 'source_sync' ? idx : last, -1);
  const firstDerivationIdx = executionLog.findIndex(e => e.stage === 'derivation');

  assert(lastSourceSyncIdx >= 0, 'At least one source_sync connector executed');
  assert(firstDerivationIdx >= 0, 'At least one derivation connector executed');
  assert(
    firstDerivationIdx > lastSourceSyncIdx,
    `Derivation (idx ${firstDerivationIdx}) only runs after all source_sync connectors (last at idx ${lastSourceSyncIdx})`
  );
}

// ---------------------------------------------------------------------------
// EX-5: Selected unsupported tool visible in config
// ---------------------------------------------------------------------------

section('EX-5: Unsupported tool surfaces in connectors.unsupported');

{
  const realRegistry = loadRegistry(ADAPTERS_DIR);

  const workflowTools = {
    resolved: {
      gmail: { status: 'supported', connector_id: 'gmail' },
      jira: { status: 'unsupported', reason: 'No Jira adapter installed' },
      notion: { status: 'unsupported', reason: 'No Notion adapter installed' },
    },
  };

  const connectorsSection = buildConnectorsSection(workflowTools, realRegistry);

  assert(
    Array.isArray(connectorsSection.unsupported),
    'connectors.unsupported is an array'
  );

  const jiraEntry = connectorsSection.unsupported.find(u => u.tool_name === 'jira');
  const notionEntry = connectorsSection.unsupported.find(u => u.tool_name === 'notion');

  assert(jiraEntry !== undefined, 'jira appears in connectors.unsupported');
  assert(typeof jiraEntry.reason === 'string' && jiraEntry.reason.length > 0, 'jira unsupported entry has a reason string');

  assert(notionEntry !== undefined, 'notion appears in connectors.unsupported');
  assert(typeof notionEntry.reason === 'string' && notionEntry.reason.length > 0, 'notion unsupported entry has a reason string');

  // Supported tool should be in enabled, not unsupported
  const gmailUnsupported = connectorsSection.unsupported.find(u => u.tool_name === 'gmail');
  assert(gmailUnsupported === undefined, 'gmail (supported) does not appear in unsupported');
  assert(
    connectorsSection.enabled.some(e => e.connector_id === 'gmail'),
    'gmail appears in connectors.enabled'
  );
}

// ---------------------------------------------------------------------------
// EX-6: Gmail + Basecamp happy path unchanged
// ---------------------------------------------------------------------------

section('EX-6: Gmail + Basecamp happy path unchanged');

{
  const realRegistry = loadRegistry(ADAPTERS_DIR);

  assert(realRegistry.errors.length === 0, 'Real registry loads with no errors');
  assert(realRegistry.connectors.has('gmail'), 'gmail loads successfully from real adapters dir');
  assert(realRegistry.connectors.has('basecamp'), 'basecamp loads successfully from real adapters dir');

  // Both auth adapters validate
  const gmailAdapter = resolveAdapter(realRegistry, 'gmail', 'auth');
  const basecampAdapter = resolveAdapter(realRegistry, 'basecamp', 'auth');

  assert(gmailAdapter !== null, 'gmail auth adapter resolves');
  assert(basecampAdapter !== null, 'basecamp auth adapter resolves');

  const { valid: gmailValid, errors: gmailErrors } = validateAuthAdapter(gmailAdapter);
  assert(gmailValid, `gmail auth adapter validates (errors: ${(gmailErrors || []).join('; ')})`);

  const { valid: basecampValid, errors: basecampErrors } = validateAuthAdapter(basecampAdapter);
  assert(basecampValid, `basecamp auth adapter validates (errors: ${(basecampErrors || []).join('; ')})`);

  // Both appear in source_sync stage, gmail first
  const sourceSyncConnectors = getConnectorsByStage(realRegistry, 'source_sync');
  assert(sourceSyncConnectors.length >= 2, 'At least 2 connectors in source_sync stage');
  assert(sourceSyncConnectors[0].id === 'gmail', 'gmail is first in source_sync (lowest priority)');
  const basecampInStage = sourceSyncConnectors.find(c => c.id === 'basecamp');
  assert(basecampInStage !== undefined, 'basecamp present in source_sync stage');

  // buildExecutionPlan is valid for both
  const manifests = [
    realRegistry.connectors.get('gmail'),
    realRegistry.connectors.get('basecamp'),
  ];
  const planResult = buildExecutionPlan(manifests);
  assert(planResult.valid === true, 'buildExecutionPlan is valid for gmail + basecamp');
  assert(planResult.errors.length === 0, 'No plan errors for gmail + basecamp');

  const sourceSyncPlanStage = planResult.plan.find(s => s.stage === 'source_sync');
  assert(sourceSyncPlanStage !== undefined, 'source_sync stage present in execution plan');
  assert(sourceSyncPlanStage.connectors.length === 2, 'source_sync has 2 connectors in plan');
  assert(sourceSyncPlanStage.connectors[0].id === 'gmail', 'gmail runs first in execution plan');
  assert(sourceSyncPlanStage.connectors[1].id === 'basecamp', 'basecamp runs second in execution plan');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n===========================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.error('\nFailed assertions:');
  for (const f of failures) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log('All acceptance tests passed.');
  process.exit(0);
}
