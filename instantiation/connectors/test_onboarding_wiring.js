'use strict';

// ---------------------------------------------------------------------------
// test_onboarding_wiring.js
// Tests for Task 4: onboarding connector resolution + orchestrator wiring.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  generatePipelineConfig,
  getEnabledConnectorManifests,
  buildConnectorsSection,
  DEFAULT_GMAIL_FILTERS,
} = require('../onboarding/pipeline_configurator');
const { buildExecutionPlan } = require('./planner');
const { loadRegistry } = require('./registry');
const { resolveWorkflowTools } = require('./tool_resolver');
const { runSlice3Onboarding, runOnboarding } = require('../onboarding/orchestrator');

const ADAPTERS_DIR = path.resolve(__dirname, 'adapters');
const MEMENTO_SOURCE = path.resolve(process.env.HOME, 'VIK', 'Coding', 'Memento');

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
  const aStr = JSON.stringify(actual);
  const eStr = JSON.stringify(expected);
  if (aStr === eStr) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${label}`);
    console.error(`    Expected: ${eStr}`);
    console.error(`    Actual:   ${aStr}`);
  }
}

// ---------------------------------------------------------------------------
// Shared registry
// ---------------------------------------------------------------------------
const registry = loadRegistry(ADAPTERS_DIR);

// ---------------------------------------------------------------------------
// Shared minimal packet used across multiple tests
// ---------------------------------------------------------------------------
function makePacket(workflowToolsOverride) {
  return {
    owner_name: 'TestUser',
    gmail_emails: ['test@example.com'],
    workflow_tools: workflowToolsOverride || {},
  };
}

// ---------------------------------------------------------------------------
// TW-1: DEFAULT_GMAIL_FILTERS has empty personal_noise_accounts
// ---------------------------------------------------------------------------
console.log('\n--- TW-1: DEFAULT_GMAIL_FILTERS is clean ---');
assert(
  Array.isArray(DEFAULT_GMAIL_FILTERS.personal_noise_accounts) &&
    DEFAULT_GMAIL_FILTERS.personal_noise_accounts.length === 0,
  'personal_noise_accounts is empty array (not Viktor-specific)'
);
assert(
  !DEFAULT_GMAIL_FILTERS.personal_noise_accounts.includes('gws-personal'),
  'personal_noise_accounts does not contain gws-personal'
);

// ---------------------------------------------------------------------------
// TW-2: pipeline_config.json has connectors section — gmail + basecamp enabled
// ---------------------------------------------------------------------------
console.log('\n--- TW-2: pipeline_config.json has connectors section ---');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-tw2-'));
  try {
    // Resolve gmail and basecamp as supported
    const workflowTools = resolveWorkflowTools({
      selectedTools: ['gmail', 'basecamp'],
      desiredCapabilities: ['email', 'tasks'],
      registry,
    });

    const packet = makePacket(workflowTools);
    const accountConnections = {
      gmail: [{ name: 'gws-test', config_dir: '~/.config/gws-test', label: 'Test' }],
      basecamp: { account_id: '111', connected: true },
    };

    const result = generatePipelineConfig({
      packet,
      accountConnections,
      targetWorkspaceRoot: tmpDir,
      mementoSourceRoot: null,
    });

    const config = result.config;

    assert(config.connectors !== undefined, 'config has connectors section');
    assert(typeof config.connectors.registry_version === 'number', 'connectors.registry_version is a number');
    assert(Array.isArray(config.connectors.enabled), 'connectors.enabled is an array');
    assert(Array.isArray(config.connectors.unsupported), 'connectors.unsupported is an array');
    assert(Array.isArray(config.connectors.deferred), 'connectors.deferred is an array');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// TW-3: Supported tools appear in enabled
// ---------------------------------------------------------------------------
console.log('\n--- TW-3: Supported tools appear in enabled ---');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-tw3-'));
  try {
    const workflowTools = resolveWorkflowTools({
      selectedTools: ['gmail', 'basecamp'],
      desiredCapabilities: ['email', 'tasks'],
      registry,
    });

    const packet = makePacket(workflowTools);
    const result = generatePipelineConfig({
      packet,
      accountConnections: { gmail: [], basecamp: null },
      targetWorkspaceRoot: tmpDir,
      mementoSourceRoot: null,
    });

    const enabled = result.config.connectors.enabled;
    assert(enabled.length === 2, 'Two connectors in enabled (gmail + basecamp)');

    const gmailEntry = enabled.find(e => e.connector_id === 'gmail');
    assert(gmailEntry !== undefined, 'gmail in enabled');
    assert(gmailEntry.stage === 'source_sync', 'gmail has correct stage');
    assert(gmailEntry.priority === 10, 'gmail has correct priority');
    assert(Array.isArray(gmailEntry.capabilities), 'gmail entry has capabilities');

    const basecampEntry = enabled.find(e => e.connector_id === 'basecamp');
    assert(basecampEntry !== undefined, 'basecamp in enabled');
    assert(basecampEntry.stage === 'source_sync', 'basecamp has correct stage');
    assert(basecampEntry.priority === 20, 'basecamp has correct priority');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// TW-4: Unsupported tools appear in unsupported
// ---------------------------------------------------------------------------
console.log('\n--- TW-4: Unsupported tools appear in unsupported ---');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-tw4-'));
  try {
    const workflowTools = resolveWorkflowTools({
      selectedTools: ['gmail', 'slack'],
      desiredCapabilities: ['email'],
      registry,
    });

    const packet = makePacket(workflowTools);
    const result = generatePipelineConfig({
      packet,
      accountConnections: { gmail: [], basecamp: null },
      targetWorkspaceRoot: tmpDir,
      mementoSourceRoot: null,
    });

    const unsupported = result.config.connectors.unsupported;
    assert(unsupported.length === 1, 'One unsupported tool (slack)');
    assert(unsupported[0].tool_name === 'slack', 'slack is in unsupported');
    assert(typeof unsupported[0].reason === 'string' && unsupported[0].reason.length > 0, 'slack has reason');

    const enabled = result.config.connectors.enabled;
    assert(enabled.length === 1, 'Only one enabled (gmail)');
    assert(enabled[0].connector_id === 'gmail', 'gmail is the enabled one');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// TW-5: Empty workflow_tools produces empty connectors
// ---------------------------------------------------------------------------
console.log('\n--- TW-5: Empty workflow_tools produces empty connectors ---');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-tw5-'));
  try {
    const packet = makePacket({});  // empty workflow_tools
    const result = generatePipelineConfig({
      packet,
      accountConnections: { gmail: [], basecamp: null },
      targetWorkspaceRoot: tmpDir,
      mementoSourceRoot: null,
    });

    const connectors = result.config.connectors;
    assert(connectors.enabled.length === 0, 'enabled is empty when no workflow_tools');
    assert(connectors.unsupported.length === 0, 'unsupported is empty when no workflow_tools');
    assert(connectors.deferred.length === 0, 'deferred is empty when no workflow_tools');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// TW-6: getEnabledConnectorManifests returns correct manifests
// ---------------------------------------------------------------------------
console.log('\n--- TW-6: getEnabledConnectorManifests returns correct manifests ---');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-tw6-'));
  try {
    const workflowTools = resolveWorkflowTools({
      selectedTools: ['gmail', 'basecamp'],
      desiredCapabilities: ['email', 'tasks'],
      registry,
    });

    const packet = makePacket(workflowTools);
    const result = generatePipelineConfig({
      packet,
      accountConnections: { gmail: [], basecamp: null },
      targetWorkspaceRoot: tmpDir,
      mementoSourceRoot: null,
    });

    const manifests = getEnabledConnectorManifests(result.config, registry);
    assert(manifests.length === 2, 'getEnabledConnectorManifests returns 2 manifests');
    assert(manifests.some(m => m.id === 'gmail'), 'gmail manifest returned');
    assert(manifests.some(m => m.id === 'basecamp'), 'basecamp manifest returned');
    // Each manifest is a full manifest with stage, priority, capabilities
    for (const m of manifests) {
      assert(typeof m.stage === 'string', `manifest ${m.id} has stage`);
      assert(typeof m.priority === 'number', `manifest ${m.id} has priority`);
      assert(Array.isArray(m.capabilities), `manifest ${m.id} has capabilities`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// TW-7: Execution plan validates against enabled connectors (gmail + basecamp)
// ---------------------------------------------------------------------------
console.log('\n--- TW-7: Execution plan validates against enabled connectors ---');
{
  const workflowTools = resolveWorkflowTools({
    selectedTools: ['gmail', 'basecamp'],
    desiredCapabilities: ['email', 'tasks'],
    registry,
  });

  const fakeConfig = {
    connectors: buildConnectorsSection(workflowTools, registry),
  };

  const manifests = getEnabledConnectorManifests(fakeConfig, registry);
  const plan = buildExecutionPlan(manifests);

  assert(plan.valid === true, 'Execution plan is valid for gmail + basecamp');
  assert(plan.errors.length === 0, 'No planner errors');
  assert(Array.isArray(plan.plan), 'plan.plan is an array');

  const sourceSyncStage = plan.plan.find(s => s.stage === 'source_sync');
  assert(sourceSyncStage !== undefined, 'source_sync stage present in plan');
  assert(sourceSyncStage.connectors.length === 2, 'source_sync has 2 connectors');
  // gmail (priority 10) comes before basecamp (priority 20)
  assert(sourceSyncStage.connectors[0].id === 'gmail', 'gmail is first in source_sync');
  assert(sourceSyncStage.connectors[1].id === 'basecamp', 'basecamp is second in source_sync');
}

// ---------------------------------------------------------------------------
// TW-8: Full Slice 3 end-to-end with connectors section present
// ---------------------------------------------------------------------------
console.log('\n--- TW-8: Full Slice 3 end-to-end ---');
{
  const PAULINE = {
    owner_name: 'Pauline',
    system_name: 'Pauline OS',
    primary_role: 'Creative director running a design studio',
    timezone: 'Europe/Amsterdam (UTC+1)',
    home_root: '/Users/pauline',
    vault_location: '/Users/pauline/Vault/PaulineOS',
    workspace_root: '/Users/pauline/Code/Memento',
    selected_runtimes: ['Claude'],
    tone_profile: 'warm',
    priority_modes: 'client delivery',
    business_context: 'Design studio.',
    preferred_reporting_style: 'short summaries',
    brand_categories: ['studio-brand'],
    project_categories: ['client-projects'],
    connect_accounts_now: 'now',
    gmail_accounts: [{ name: 'gws-studio', label: 'Studio email' }],
    gmail_emails: ['pauline@studio.com'],
    basecamp_account_id: '9876543',
    basecamp_person_id: '12345678',
    workflow_tools: resolveWorkflowTools({
      selectedTools: ['gmail', 'basecamp', 'slack'],
      desiredCapabilities: ['email', 'tasks'],
      registry,
    }),
  };

  const MOCK_CONNECTIONS = {
    gmail: [{ name: 'gws-studio', config_dir: '~/.config/gws-studio', label: 'Studio email' }],
    basecamp: { account_id: '9876543', api_base: 'https://3.basecampapi.com/9876543', connected: true },
    sourceIdentities: { basecamp: { owner: { person_id: '12345678' } } },
  };

  const MOCK_SYNC_RESULTS = {
    captures: {
      gmail: [{
        id: 'gmail_msg_test001',
        data: {
          capture_id: 'gmail_msg_test001',
          source: 'gmail',
          normalized_payload: {
            message_id: 'test001',
            from: 'pauline@studio.com',
            to: ['client@example.com'],
            subject: 'Test',
            snippet: 'Hi there',
            date: '2026-04-01T10:00:00Z',
            account: 'gws-studio',
          },
        },
      }],
      basecamp: [{
        id: 'bc_comment_test001',
        data: {
          capture_id: 'bc_comment_test001',
          source: 'basecamp',
          normalized_payload: { content: 'Hi team', creator_id: '12345678' },
        },
      }],
    },
    syncLogs: {
      gmail: { last_run: '2026-04-04T10:00:00Z', accounts: { 'gws-studio': '2026-04-04T10:00:00Z' } },
      basecamp: { last_run: '2026-04-04T10:00:00Z' },
    },
    derived: {
      'today.html': '<html><body><h1>Today - Pauline OS</h1></body></html>',
      'editorial.json': JSON.stringify({ entries: [] }),
      'contacts.json': JSON.stringify({ contacts: [] }),
    },
  };

  const MOCK_CAPTURED_DATA = {
    sentMessages: [{
      normalized_payload: { from: 'pauline@studio.com', snippet: 'Hi,\nJust following up.\nBest,\nPauline' },
    }],
    basecampComments: [{
      normalized_payload: { content: 'Hi everyone, heads up. Cheers, Pauline', creator_id: '12345678' },
    }],
  };

  // Set up Slice 1+2 so Slice 3 has a real vault to work with
  const { buildInstallerManifest } = require('../installer/manifest');
  const { copyCore } = require('../installer/core_copier');
  const { placeTemplates } = require('../installer/template_placer');
  const { generateScaffolds } = require('../installer/scaffold_generator');
  const { loadFileMatrix } = require('../shared/file_matrix');
  const MANIFEST_PATH = path.resolve(__dirname, '..', 'manifests', 'file-treatment-manifest.json');
  const TEMPLATE_SOURCE = path.resolve(__dirname, '..', 'templates');

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-tw8-'));
  const targetHome = path.join(tmpRoot, 'Users', 'pauline');
  const targetVault = path.join(targetHome, 'Vault', 'PaulineOS');
  const targetWorkspace = path.join(targetHome, 'Code', 'Memento');
  const sourceDoctrine = path.join(tmpRoot, 'source_doctrine');

  function createMockFile(base, relPath, content) {
    const fullPath = path.join(base, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content || `# Mock: ${relPath}\n`);
  }

  const matrix = loadFileMatrix(MANIFEST_PATH);
  for (const surface of matrix.getCopyCore()) {
    createMockFile(sourceDoctrine, surface.path, `# Core: ${surface.path}\n`);
  }
  for (const surface of matrix.getRewriteTemplate()) {
    if (surface.runtime_gated) continue;
    let content;
    if (surface.path === 'BOOT.md') {
      content = `# Boot\n\nViktor's system boot sequence.\n\n1. Read ROUTING.md\n2. Load memory.md + recent-context.md\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\n`;
    } else if (surface.path === 'ROUTING.md') {
      content = `# Routing\n\nViktor's operator routing.\n\nOperator lanes:\n- operator/anton.md\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\n`;
    } else {
      content = `# Template: ${surface.path}\nViktor manages this.\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\n`;
    }
    createMockFile(sourceDoctrine, surface.path, content);
  }

  const installerInputs = {
    selected_runtimes: ['Claude'],
    target_install_root: targetVault,
    home_root: targetHome,
    vault_location: targetVault,
    workspace_root: targetWorkspace,
    source_doctrine_root: sourceDoctrine,
    template_source_root: TEMPLATE_SOURCE,
    manifest_path: MANIFEST_PATH,
  };

  Promise.resolve().then(async () => {
    const installerManifest = buildInstallerManifest(installerInputs);
    await copyCore(installerManifest);
    await placeTemplates(installerManifest);
    await generateScaffolds(installerManifest);

    const slice2Result = runOnboarding({
      installerManifest,
      onboardingAnswers: PAULINE,
      templateSourceRoot: TEMPLATE_SOURCE,
      targetInstallRoot: targetVault,
      homeRoot: targetHome,
      manifestPath: MANIFEST_PATH,
    });

    assert(slice2Result.success === true, 'TW-8: Slice 2 completed');

    const slice3Result = runSlice3Onboarding({
      packet: slice2Result.packet,
      targetInstallRoot: targetVault,
      homeRoot: targetHome,
      targetWorkspaceRoot: targetWorkspace,
      mementoSourceRoot: MEMENTO_SOURCE,
      mockConnections: MOCK_CONNECTIONS,
      mockSyncResults: MOCK_SYNC_RESULTS,
      mockCapturedData: MOCK_CAPTURED_DATA,
    });

    assert(slice3Result.success === true, 'TW-8: Slice 3 end-to-end passes');

    // Connectors section present in config
    const config = slice3Result.pipelineConfig.config;
    assert(config.connectors !== undefined, 'TW-8: connectors section in pipeline_config');
    assert(Array.isArray(config.connectors.enabled), 'TW-8: connectors.enabled is array');

    // gmail and basecamp are enabled (from PAULINE.workflow_tools)
    const enabledIds = config.connectors.enabled.map(e => e.connector_id);
    assert(enabledIds.includes('gmail'), 'TW-8: gmail in enabled');
    assert(enabledIds.includes('basecamp'), 'TW-8: basecamp in enabled');

    // slack is unsupported
    const slackUnsupported = config.connectors.unsupported.some(u => u.tool_name === 'slack');
    assert(slackUnsupported, 'TW-8: slack in unsupported');

    // executionPlan is valid
    assert(slice3Result.executionPlan !== undefined, 'TW-8: executionPlan present in result');
    assert(slice3Result.executionPlan.valid === true, 'TW-8: executionPlan is valid');

    // No Viktor identity in config
    const configStr = JSON.stringify(config);
    assert(!configStr.includes('viktorsl'), 'TW-8: No viktorsl in pipeline_config');

    // DEFAULT_GMAIL_FILTERS in written config
    assert(config.gmail_filters.personal_noise_accounts.length === 0, 'TW-8: No gws-personal in gmail_filters');

    fs.rmSync(tmpRoot, { recursive: true, force: true });

    // ---------------------------------------------------------------------------
    // Summary
    // ---------------------------------------------------------------------------
    console.log(`\n=== ONBOARDING WIRING TEST SUMMARY ===`);
    console.log(`Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
  }).catch(err => {
    console.error('TW-8 crashed:', err);
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) {}
    process.exit(1);
  });
}
