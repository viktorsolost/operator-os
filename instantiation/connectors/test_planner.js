'use strict';

// ---------------------------------------------------------------------------
// Test suite for instantiation/connectors/planner.js
// Run: node instantiation/connectors/test_planner.js
// ---------------------------------------------------------------------------

const { buildExecutionPlan, executeStages, validateDependencyGraph } = require('./planner');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    console.error(`        expected: ${e}`);
    console.error(`        actual:   ${a}`);
    failed++;
  }
}

function makeConnector(overrides) {
  return Object.assign({
    id: 'test_connector',
    display_name: 'Test Connector',
    category: 'other',
    stage: 'source_sync',
    status: 'production',
    priority: 10,
    capabilities: ['read'],
  }, overrides);
}

// ---------------------------------------------------------------------------
// Test 1: Valid plan with two connectors in same stage
// ---------------------------------------------------------------------------
console.log('\nTest 1: Valid plan with two connectors in same stage');
{
  const gmail = makeConnector({ id: 'gmail', stage: 'source_sync', priority: 10 });
  const basecamp = makeConnector({ id: 'basecamp', stage: 'source_sync', priority: 20 });

  const result = buildExecutionPlan([gmail, basecamp]);

  assert(result.valid === true, 'plan is valid');
  assert(result.errors.length === 0, 'no errors');
  assertEqual(result.plan.map(s => s.stage), ['preflight', 'source_sync', 'derivation', 'post_sync'], 'all 4 stages present');

  const sourceSyncStage = result.plan.find(s => s.stage === 'source_sync');
  assert(sourceSyncStage !== undefined, 'source_sync stage exists');
  assertEqual(sourceSyncStage.connectors.map(c => c.id), ['gmail', 'basecamp'], 'gmail before basecamp (lower priority first)');

  const preflightStage = result.plan.find(s => s.stage === 'preflight');
  assert(preflightStage.connectors.length === 0, 'preflight is empty');
}

// ---------------------------------------------------------------------------
// Test 2: After constraint ordering
// ---------------------------------------------------------------------------
console.log('\nTest 2: After constraint ordering');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10 });
  const B = makeConnector({ id: 'B', stage: 'source_sync', priority: 10, after: ['A'] });

  const result = buildExecutionPlan([B, A]); // B given first to ensure ordering is not input-order

  assert(result.valid === true, 'plan is valid');
  const sourceSyncStage = result.plan.find(s => s.stage === 'source_sync');
  assertEqual(sourceSyncStage.connectors.map(c => c.id), ['A', 'B'], 'A before B due to after constraint');
}

// ---------------------------------------------------------------------------
// Test 3: Cycle detection
// ---------------------------------------------------------------------------
console.log('\nTest 3: Cycle detection');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10, after: ['B'] });
  const B = makeConnector({ id: 'B', stage: 'source_sync', priority: 10, after: ['A'] });

  const result = buildExecutionPlan([A, B]);

  assert(result.valid === false, 'plan is invalid due to cycle');
  assert(result.errors.length > 0, 'errors reported');
  assert(result.plan.length === 0, 'plan is empty');
  assert(result.errors.some(e => e.toLowerCase().includes('cycle')), 'cycle mentioned in errors');
}

// ---------------------------------------------------------------------------
// Test 4: Cross-stage dependency rejection
// ---------------------------------------------------------------------------
console.log('\nTest 4: Cross-stage dependency rejection');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10, after: ['B'] });
  const B = makeConnector({ id: 'B', stage: 'preflight', priority: 10 });

  const result = buildExecutionPlan([A, B]);

  assert(result.valid === false, 'plan is invalid due to cross-stage dep');
  assert(result.errors.some(e => e.includes('cross-stage')), 'cross-stage mentioned in errors');
}

// ---------------------------------------------------------------------------
// Test 5: Missing dependency rejection
// ---------------------------------------------------------------------------
console.log('\nTest 5: Missing dependency rejection');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10, after: ['nonexistent'] });

  const result = buildExecutionPlan([A]);

  assert(result.valid === false, 'plan is invalid due to missing dep');
  assert(result.errors.some(e => e.includes('nonexistent')), 'missing dep ID mentioned in errors');
}

// ---------------------------------------------------------------------------
// Test 6: Self-reference rejection
// ---------------------------------------------------------------------------
console.log('\nTest 6: Self-reference rejection');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10, after: ['A'] });

  const result = buildExecutionPlan([A]);

  assert(result.valid === false, 'plan is invalid due to self-reference');
  assert(result.errors.some(e => e.includes("'A'") && e.toLowerCase().includes('itself')), 'self-reference mentioned in errors');
}

// ---------------------------------------------------------------------------
// Test 7: Empty plan
// ---------------------------------------------------------------------------
console.log('\nTest 7: Empty plan — no enabled connectors');
{
  const result = buildExecutionPlan([]);

  assert(result.valid === true, 'empty plan is valid');
  assert(result.errors.length === 0, 'no errors');
  assertEqual(result.plan.map(s => s.stage), ['preflight', 'source_sync', 'derivation', 'post_sync'], 'all 4 stages present');
  assert(result.plan.every(s => s.connectors.length === 0), 'all stages are empty');
}

// ---------------------------------------------------------------------------
// Test 8: executeStages happy path
// ---------------------------------------------------------------------------
console.log('\nTest 8: executeStages happy path');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10 });
  const { plan } = buildExecutionPlan([A]);

  const executorFn = (connector, stage) => ({ success: true, data: { synced: true } });
  const summary = executeStages(plan, executorFn);

  assert(summary.success === true, 'overall success is true');
  assert(typeof summary.total_ms === 'number', 'total_ms is a number');
  assert(summary.stages.length === 4, '4 stage results');

  const ssResult = summary.stages.find(s => s.stage === 'source_sync');
  assert(ssResult !== undefined, 'source_sync result exists');
  assert(ssResult.results.length === 1, '1 connector result in source_sync');
  assert(ssResult.results[0].success === true, 'connector A succeeded');
  assert(typeof ssResult.results[0].duration_ms === 'number', 'duration_ms is a number');
}

// ---------------------------------------------------------------------------
// Test 9: executeStages partial failure
// ---------------------------------------------------------------------------
console.log('\nTest 9: executeStages partial failure');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10 });
  const B = makeConnector({ id: 'B', stage: 'source_sync', priority: 20 });
  const { plan } = buildExecutionPlan([A, B]);

  const executorFn = (connector, stage) => {
    if (connector.id === 'B') return { success: false, error: 'B failed' };
    return { success: true };
  };
  const summary = executeStages(plan, executorFn);

  assert(summary.success === true, 'overall success is true (partial is OK)');
  const ssResult = summary.stages.find(s => s.stage === 'source_sync');
  const bResult = ssResult.results.find(r => r.connector_id === 'B');
  assert(bResult.success === false, 'B is marked failed');
  assert(bResult.error === 'B failed', 'B error message present');
}

// ---------------------------------------------------------------------------
// Test 10: executeStages total failure — derivation skipped
// ---------------------------------------------------------------------------
console.log('\nTest 10: executeStages total failure — derivation skipped');
{
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10 });
  const D = makeConnector({ id: 'D', stage: 'derivation', priority: 10 });
  const { plan } = buildExecutionPlan([A, D]);

  const executorFn = (connector, stage) => ({ success: false, error: 'all failed' });
  const summary = executeStages(plan, executorFn);

  assert(summary.success === false, 'overall success is false');
  const derivationResult = summary.stages.find(s => s.stage === 'derivation');
  assert(derivationResult !== undefined, 'derivation stage present in results');
  assert(derivationResult.results.length === 0, 'derivation was skipped (no results)');
}

// ---------------------------------------------------------------------------
// Test 11: Deterministic ordering
// ---------------------------------------------------------------------------
console.log('\nTest 11: Deterministic ordering');
{
  const connectors = [
    makeConnector({ id: 'Z', stage: 'source_sync', priority: 5 }),
    makeConnector({ id: 'A', stage: 'source_sync', priority: 10 }),
    makeConnector({ id: 'M', stage: 'preflight', priority: 1 }),
    makeConnector({ id: 'B', stage: 'source_sync', priority: 5, after: ['Z'] }),
  ];

  const result1 = buildExecutionPlan(connectors);
  const result2 = buildExecutionPlan(connectors);

  assertEqual(JSON.parse(JSON.stringify(result1)), JSON.parse(JSON.stringify(result2)), 'two calls produce identical plans');
}

// ---------------------------------------------------------------------------
// Test 12: Priority + after + alphabetical tiebreaking
// ---------------------------------------------------------------------------
console.log('\nTest 12: Priority + after + alphabetical tiebreaking');
{
  // Three connectors: C (priority 10), A (priority 10), B (priority 10, after: ['A'])
  // Expected order: A, C, B
  //   - A and C have no deps, alphabetical -> A first, C second
  //   - B depends on A, so B comes after A; C has no deps and sorts before B alphabetically
  const A = makeConnector({ id: 'A', stage: 'source_sync', priority: 10 });
  const B = makeConnector({ id: 'B', stage: 'source_sync', priority: 10, after: ['A'] });
  const C = makeConnector({ id: 'C', stage: 'source_sync', priority: 10 });

  const result = buildExecutionPlan([C, B, A]); // Scrambled input order

  assert(result.valid === true, 'plan is valid');
  const sourceSyncStage = result.plan.find(s => s.stage === 'source_sync');
  assertEqual(sourceSyncStage.connectors.map(c => c.id), ['A', 'C', 'B'], 'order is A, C, B');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}
