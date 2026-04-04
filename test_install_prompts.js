'use strict';

// ---------------------------------------------------------------------------
// test_install_prompts.js
// Tests for tool_resolver.js — pure resolution logic, no stdin required.
// Run with: node test_install_prompts.js
// ---------------------------------------------------------------------------

const path = require('path');
const { resolveWorkflowTools, formatConnectorSummary } = require('./instantiation/connectors/tool_resolver');
const { loadRegistry } = require('./instantiation/connectors/registry');

const ADAPTERS_DIR = path.resolve(__dirname, 'instantiation', 'connectors', 'adapters');

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${label}`);
  } else {
    failed++;
    console.error(`  \u2717 FAIL: ${label}`);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// Load real registry
// ---------------------------------------------------------------------------
const registry = loadRegistry(ADAPTERS_DIR);
assert(registry.connectors.size >= 2, 'Registry loaded at least 2 connectors (gmail, basecamp)');
assert(registry.connectors.has('gmail'), 'gmail connector present in registry');
assert(registry.connectors.has('basecamp'), 'basecamp connector present in registry');

// ---------------------------------------------------------------------------
// Test 1: gmail + basecamp both in registry → both supported
// ---------------------------------------------------------------------------
console.log('\nTest 1: gmail + basecamp → both supported');
{
  const result = resolveWorkflowTools({
    selectedTools: ['gmail', 'basecamp'],
    desiredCapabilities: ['email', 'tasks'],
    registry,
  });

  assert(deepEqual(result.selected_tools, ['gmail', 'basecamp']), 'selected_tools preserved');
  assert(deepEqual(result.desired_capabilities, ['email', 'tasks']), 'desired_capabilities preserved');
  assert(result.resolved.gmail.status === 'supported', 'gmail resolved as supported');
  assert(result.resolved.gmail.connector_id === 'gmail', 'gmail connector_id correct');
  assert(result.resolved.basecamp.status === 'supported', 'basecamp resolved as supported');
  assert(result.resolved.basecamp.connector_id === 'basecamp', 'basecamp connector_id correct');
}

// ---------------------------------------------------------------------------
// Test 2: slack not in registry → unsupported
// ---------------------------------------------------------------------------
console.log('\nTest 2: slack not in registry → unsupported');
{
  const result = resolveWorkflowTools({
    selectedTools: ['slack'],
    desiredCapabilities: ['messages'],
    registry,
  });

  assert(result.resolved.slack.status === 'unsupported', 'slack resolved as unsupported');
  assert(typeof result.resolved.slack.reason === 'string', 'slack has a reason string');
  assert(result.resolved.slack.reason.includes('slack'), 'slack reason mentions the tool name');
}

// ---------------------------------------------------------------------------
// Test 3: no tools selected → empty resolved
// ---------------------------------------------------------------------------
console.log('\nTest 3: no tools selected → empty resolved');
{
  const result = resolveWorkflowTools({
    selectedTools: [],
    desiredCapabilities: [],
    registry,
  });

  assert(deepEqual(result.selected_tools, []), 'selected_tools is empty array');
  assert(deepEqual(result.desired_capabilities, []), 'desired_capabilities is empty array');
  assert(deepEqual(result.resolved, {}), 'resolved is empty object');
}

// ---------------------------------------------------------------------------
// Test 4: case-insensitive matching — "Gmail" and "BASECAMP" should resolve
// ---------------------------------------------------------------------------
console.log('\nTest 4: case-insensitive matching');
{
  const result = resolveWorkflowTools({
    selectedTools: ['Gmail', 'BASECAMP'],
    desiredCapabilities: ['Email'],
    registry,
  });

  assert(result.resolved.gmail.status === 'supported', '"Gmail" normalized and resolved as supported');
  assert(result.resolved.basecamp.status === 'supported', '"BASECAMP" normalized and resolved as supported');
  assert(result.desired_capabilities[0] === 'email', 'desired_capabilities normalized to lowercase');
}

// ---------------------------------------------------------------------------
// Test 5: desired_capabilities recorded correctly (filtering is caller's job)
// ---------------------------------------------------------------------------
console.log('\nTest 5: desired_capabilities stored verbatim (normalized)');
{
  const result = resolveWorkflowTools({
    selectedTools: ['gmail'],
    desiredCapabilities: ['email', 'calendar', 'docs'],
    registry,
  });

  assert(result.desired_capabilities.length === 3, 'three capabilities stored');
  assert(result.desired_capabilities.includes('email'), 'email included');
  assert(result.desired_capabilities.includes('calendar'), 'calendar included');
  assert(result.desired_capabilities.includes('docs'), 'docs included');
}

// ---------------------------------------------------------------------------
// Test 6: formatConnectorSummary — mix of supported/unsupported → correct lines
// ---------------------------------------------------------------------------
console.log('\nTest 6: formatConnectorSummary with supported + unsupported mix');
{
  const workflowTools = {
    selected_tools: ['gmail', 'slack'],
    desired_capabilities: ['email', 'messages'],
    resolved: {
      gmail: {
        status: 'supported',
        connector_id: 'gmail',
        display_name: 'Gmail (via gws CLI)',
        connector_status: 'production',
      },
      slack: {
        status: 'unsupported',
        reason: 'No installed adapter for slack',
      },
    },
  };

  const lines = formatConnectorSummary(workflowTools);

  assert(lines.length > 0, 'summary lines produced');
  assert(lines[0] === 'Connectors:', 'first line is "Connectors:"');
  const gmailLine = lines.find((l) => l.includes('Gmail'));
  const slackLine = lines.find((l) => l.includes('Slack'));
  assert(gmailLine !== undefined, 'gmail line present');
  assert(gmailLine.includes('\u2713'), 'gmail line has checkmark');
  assert(gmailLine.includes('supported'), 'gmail line says supported');
  assert(gmailLine.includes('production'), 'gmail line mentions production status');
  assert(slackLine !== undefined, 'slack line present');
  assert(slackLine.includes('\u2717'), 'slack line has cross');
  assert(slackLine.includes('unsupported'), 'slack line says unsupported');
}

// ---------------------------------------------------------------------------
// Test 7: formatConnectorSummary with empty workflow_tools → no lines
// ---------------------------------------------------------------------------
console.log('\nTest 7: formatConnectorSummary with empty workflow_tools');
{
  const empty = { selected_tools: [], desired_capabilities: [], resolved: {} };
  const lines = formatConnectorSummary(empty);
  assert(lines.length === 0, 'empty workflow_tools returns no summary lines');

  const nullLines = formatConnectorSummary(null);
  assert(nullLines.length === 0, 'null workflow_tools returns no summary lines');
}

// ---------------------------------------------------------------------------
// Test 8: mixed input — some supported, some not, plus whitespace in input
// ---------------------------------------------------------------------------
console.log('\nTest 8: mixed tools with whitespace in input');
{
  const result = resolveWorkflowTools({
    selectedTools: ['  gmail  ', 'notion', '  basecamp  '],
    desiredCapabilities: ['  tasks  ', 'docs'],
    registry,
  });

  assert(result.resolved.gmail.status === 'supported', 'gmail (whitespace trimmed) resolves');
  assert(result.resolved.notion.status === 'unsupported', 'notion is unsupported');
  assert(result.resolved.basecamp.status === 'supported', 'basecamp (whitespace trimmed) resolves');
  assert(result.desired_capabilities[0] === 'tasks', 'capability whitespace trimmed');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
