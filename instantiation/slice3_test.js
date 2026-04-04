'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { buildInstallerManifest } = require('./installer/manifest');
const { copyCore } = require('./installer/core_copier');
const { placeTemplates } = require('./installer/template_placer');
const { generateScaffolds } = require('./installer/scaffold_generator');
const { runOnboarding, runSlice3Onboarding } = require('./onboarding/orchestrator');
const { loadFileMatrix } = require('./shared/file_matrix');

// ---------------------------------------------------------------------------
// Fake user: Pauline (continued from Slice 2)
// ---------------------------------------------------------------------------
const PAULINE = {
  owner_name: 'Pauline',
  system_name: 'Pauline OS',
  primary_role: 'Creative director running a design studio with 4 ongoing client projects',
  timezone: 'Europe/Amsterdam (UTC+1)',
  home_root: '/Users/pauline',
  vault_location: '/Users/pauline/Vault/PaulineOS',
  workspace_root: '/Users/pauline/Code/Memento',
  selected_runtimes: ['Claude', 'Gemini'],
  tone_profile: 'warm',
  priority_modes: 'client delivery, creative work, team coordination',
  business_context: 'Design studio specializing in brand identity and digital experiences.',
  preferred_reporting_style: 'short summaries',
  brand_categories: ['studio-brand', 'client-brands'],
  project_categories: ['client-projects', 'internal-tools'],
  connect_accounts_now: 'now',
  gmail_accounts: [
    { name: 'gws-studio', label: 'Studio email' },
    { name: 'gws-personal', label: 'Personal' },
  ],
  gmail_emails: ['pauline@studio.com', 'pauline@gmail.com'],
  basecamp_account_id: '9876543',
  basecamp_person_id: '12345678',
};

// Mock connections for dry test
const MOCK_CONNECTIONS = {
  gmail: [
    { name: 'gws-studio', config_dir: '~/.config/gws-studio', label: 'Studio email' },
    { name: 'gws-personal', config_dir: '~/.config/gws-personal', label: 'Personal' },
  ],
  basecamp: {
    account_id: '9876543',
    api_base: 'https://3.basecampapi.com/9876543',
    connected: true,
  },
  sourceIdentities: {
    basecamp: {
      owner: { person_id: '12345678' },
    },
  },
};

// Mock sync results
const MOCK_SYNC_RESULTS = {
  captures: {
    gmail: [
      {
        id: 'gmail_msg_gws-studio_test001',
        data: {
          capture_id: 'gmail_msg_gws-studio_test001',
          source: 'gmail',
          normalized_payload: {
            message_id: 'test001',
            from: 'pauline@studio.com',
            to: ['client@example.com'],
            subject: 'Project update',
            snippet: 'Hi there, Just wanted to share the latest designs. Best, Pauline',
            date: '2026-04-01T10:00:00Z',
            account: 'gws-studio',
          },
        },
      },
      {
        id: 'gmail_msg_gws-studio_test002',
        data: {
          capture_id: 'gmail_msg_gws-studio_test002',
          source: 'gmail',
          normalized_payload: {
            message_id: 'test002',
            from: 'external@example.com',
            to: ['pauline@studio.com'],
            subject: 'Re: Project update',
            snippet: 'Thanks for the update!',
            date: '2026-04-01T11:00:00Z',
            account: 'gws-studio',
          },
        },
      },
    ],
    basecamp: [
      {
        id: 'bc_comment_test001',
        data: {
          capture_id: 'bc_comment_test001',
          source: 'basecamp',
          normalized_payload: {
            content: 'Hey team, Let me know if you have questions. Cheers, Pauline',
            creator_id: '12345678',
          },
        },
      },
    ],
  },
  syncLogs: {
    gmail: { last_run: '2026-04-04T10:00:00Z', accounts: { 'gws-studio': '2026-04-04T10:00:00Z' } },
    basecamp: { last_run: '2026-04-04T10:00:00Z' },
  },
  derived: {
    'today.html': '<html><body><h1>Today - Pauline OS</h1><p>First sync complete.</p></body></html>',
    'editorial.json': JSON.stringify({ entries: [] }),
    'contacts.json': JSON.stringify({ contacts: [] }),
  },
};

// Mock captured data for voice profiler
const MOCK_CAPTURED_DATA = {
  sentMessages: [
    {
      normalized_payload: {
        from: 'pauline@studio.com',
        snippet: 'Hi Sarah,\nJust following up on the brand guidelines. Let me know if you need anything else.\nBest,\nPauline',
      },
    },
    {
      normalized_payload: {
        from: 'pauline@studio.com',
        snippet: 'Hey team,\nGreat work on the presentation. Looking forward to the next round.\nCheers,\nPauline',
      },
    },
    {
      normalized_payload: {
        from: 'pauline@studio.com',
        snippet: 'Hi Marcus,\nThanks for the quick turnaround. The client loved it.\nBest,\nPauline',
      },
    },
  ],
  basecampComments: [
    {
      normalized_payload: {
        content: 'Hi everyone, Just a heads up that the deadline moved to Friday. Cheers, Pauline',
        creator_id: '12345678',
      },
    },
  ],
};

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

function createMockFile(base, relPath, content) {
  const fullPath = path.join(base, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content || `# Mock: ${relPath}\n`);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-slice3-test-'));
const TARGET_HOME = path.join(TEMP_ROOT, 'Users', 'pauline');
const TARGET_VAULT = path.join(TARGET_HOME, 'Vault', 'PaulineOS');
const TARGET_WORKSPACE = path.join(TARGET_HOME, 'Code', 'Memento');
const SOURCE_DOCTRINE = path.join(TEMP_ROOT, 'source_doctrine');
const TEMPLATE_SOURCE = path.resolve(__dirname, 'templates');
const MANIFEST_PATH = path.resolve(__dirname, 'manifests', 'file-treatment-manifest.json');

// Create mock source files
const matrix = loadFileMatrix(MANIFEST_PATH);

for (const surface of matrix.getCopyCore()) {
  createMockFile(SOURCE_DOCTRINE, surface.path, `# Reusable Core: ${surface.path}\nNo owner-specific content here.\n`);
}

for (const surface of matrix.getRewriteTemplate()) {
  if (surface.runtime_gated) continue;
  let mockContent;
  if (surface.path === 'BOOT.md') {
    mockContent = `# Boot\n\nViktor's system boot sequence.\n\n1. Read ROUTING.md\n2. Load memory.md + recent-context.md\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nVIK OS boot.\n`;
  } else if (surface.path === 'ROUTING.md') {
    mockContent = `# Routing\n\nViktor's operator routing.\n\nOperator lanes:\n- operator/anton.md\n- operator/claudia.md\n- operator/jonah.md\n- operator/vera.md\n- operator/lev.md\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nVIK OS routing.\n`;
  } else {
    mockContent = `# Template: ${surface.path}\nViktor manages this through VIK OS.\nPath: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nViktor's preferences.\n`;
  }
  createMockFile(SOURCE_DOCTRINE, surface.path, mockContent);
}

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------
async function runSlice3Test() {
  console.log('\n=== VIK OS SLICE 3 DRY TEST: Pauline (accounts connected) ===\n');

  // --- Phase 1+2: Installer + Slice 2 onboarding ---
  console.log('Phase 1+2: Installer + Onboarding');

  const installerInputs = {
    selected_runtimes: PAULINE.selected_runtimes,
    target_install_root: TARGET_VAULT,
    home_root: TARGET_HOME,
    vault_location: TARGET_VAULT,
    workspace_root: TARGET_WORKSPACE,
    source_doctrine_root: SOURCE_DOCTRINE,
    template_source_root: TEMPLATE_SOURCE,
    manifest_path: MANIFEST_PATH,
  };

  const installerManifest = buildInstallerManifest(installerInputs);
  await copyCore(installerManifest);
  await placeTemplates(installerManifest);
  await generateScaffolds(installerManifest);

  const slice2Result = runOnboarding({
    installerManifest,
    onboardingAnswers: PAULINE,
    templateSourceRoot: TEMPLATE_SOURCE,
    targetInstallRoot: TARGET_VAULT,
    homeRoot: TARGET_HOME,
    manifestPath: MANIFEST_PATH,
  });

  assert(slice2Result.success === true, 'Slice 2 onboarding completed');
  if (!slice2Result.success) {
    console.error('Slice 2 failed:', slice2Result.phase, slice2Result.errors);
    fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
    process.exit(1);
  }

  // --- Phase 3: Slice 3 onboarding ---
  console.log('\nPhase 3: Slice 3 Onboarding');

  const slice3Result = runSlice3Onboarding({
    packet: slice2Result.packet,
    targetInstallRoot: TARGET_VAULT,
    homeRoot: TARGET_HOME,
    targetWorkspaceRoot: TARGET_WORKSPACE,
    mockConnections: MOCK_CONNECTIONS,
    mockSyncResults: MOCK_SYNC_RESULTS,
    mockCapturedData: MOCK_CAPTURED_DATA,
  });

  // =========================================================================
  // ST-1: Pipeline config generated
  // =========================================================================
  console.log('\n--- ST-1: Pipeline config generated ---');
  const configPath = path.join(TARGET_WORKSPACE, 'state', 'runtime', 'pipeline_config.json');
  assert(fs.existsSync(configPath), 'pipeline_config.json exists');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert(config.owner.name === 'Pauline', 'Config has Pauline as owner');
  assert(config.accounts.gmail.length === 2, 'Config has 2 Gmail accounts');
  assert(config.accounts.basecamp.account_id === '9876543', 'Config has Basecamp account ID');
  assert(config.sync_engines.gmail === true, 'Gmail sync enabled');
  assert(config.sync_engines.basecamp === true, 'Basecamp sync enabled');

  // =========================================================================
  // ST-2: Pipeline patches applied
  // =========================================================================
  console.log('\n--- ST-2: Pipeline patches applied ---');
  // Verify config is well-formed and readable (patches in real pipeline files tested via ST-10)
  assert(config.accounts !== undefined, 'Config has accounts section');
  assert(config.gmail_filters !== undefined, 'Config has gmail_filters section');
  assert(config.gmail_filters.skip_categories.length === 3, 'Default noise filter categories present');

  // =========================================================================
  // ST-3: No Viktor pipeline identity
  // =========================================================================
  console.log('\n--- ST-3: No Viktor pipeline identity ---');
  const configStr = JSON.stringify(config);
  assert(!configStr.includes('Viktor'), 'No "Viktor" in pipeline_config');
  assert(!configStr.includes('viktorsl'), 'No "viktorsl" in pipeline_config');
  assert(!configStr.includes('3378703'), 'No Viktor Basecamp ID in pipeline_config');

  const idPath = path.join(TARGET_WORKSPACE, 'state', 'runtime', 'source_identities.json');
  assert(fs.existsSync(idPath), 'source_identities.json exists');
  const identities = JSON.parse(fs.readFileSync(idPath, 'utf8'));
  const idStr = JSON.stringify(identities);
  assert(!idStr.includes('48400899'), 'No Viktor person_id in source_identities');
  assert(idStr.includes('12345678'), 'Pauline person_id in source_identities');

  // =========================================================================
  // ST-4: Registry is fresh
  // =========================================================================
  console.log('\n--- ST-4: Registry is fresh ---');
  const regPath = path.join(TARGET_WORKSPACE, 'state', 'registry.json');
  assert(fs.existsSync(regPath), 'registry.json exists');
  const registry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const regStr = JSON.stringify(registry);
  assert(!regStr.includes('46649609'), 'No Viktor Basecamp project ID');
  assert(!regStr.includes('1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW'), 'No Viktor Drive folder ID');
  assert(Array.isArray(registry.projects), 'Registry has projects array');
  assert(Array.isArray(registry.shared_sources), 'Registry has shared_sources array');

  // =========================================================================
  // ST-5: First sync simulated
  // =========================================================================
  console.log('\n--- ST-5: First sync simulated ---');
  const capturesDir = path.join(TARGET_WORKSPACE, 'state', 'captures');
  assert(fs.existsSync(capturesDir), 'captures directory exists');
  const gmailCaptures = path.join(capturesDir, 'gmail');
  assert(fs.existsSync(gmailCaptures), 'Gmail captures directory exists');
  const bcCaptures = path.join(capturesDir, 'basecamp');
  assert(fs.existsSync(bcCaptures), 'Basecamp captures directory exists');

  // =========================================================================
  // ST-6: Derivations run
  // =========================================================================
  console.log('\n--- ST-6: Derivations run ---');
  const derivedDir = path.join(TARGET_WORKSPACE, 'state', 'derived');
  assert(fs.existsSync(derivedDir), 'derived directory exists');

  // =========================================================================
  // ST-7: Today page rendered
  // =========================================================================
  console.log('\n--- ST-7: Today page rendered ---');
  const todayPath = path.join(TARGET_WORKSPACE, 'state', 'derived', 'today.html');
  assert(fs.existsSync(todayPath), 'today.html exists');
  if (fs.existsSync(todayPath)) {
    const todayContent = fs.readFileSync(todayPath, 'utf8');
    assert(todayContent.includes('Pauline'), 'today.html references Pauline');
  }

  // =========================================================================
  // ST-8: Voice profile generated
  // =========================================================================
  console.log('\n--- ST-8: Voice profile generated ---');
  const voicePath = path.join(TARGET_VAULT, 'operator', 'voice.md');
  assert(fs.existsSync(voicePath), 'operator/voice.md exists');
  if (fs.existsSync(voicePath)) {
    const voiceContent = fs.readFileSync(voicePath, 'utf8');
    assert(voiceContent.includes('Greeting Patterns'), 'voice.md has Greeting Patterns');
    assert(voiceContent.includes('Sign-Off Patterns'), 'voice.md has Sign-Off Patterns');
    assert(voiceContent.includes('Sentence Structure'), 'voice.md has Sentence Structure');
    assert(voiceContent.includes('Pauline'), 'voice.md references Pauline');
  }

  // =========================================================================
  // ST-9: "Later" path works
  // =========================================================================
  console.log('\n--- ST-9: "Later" path works ---');
  {
    const laterRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-later-'));
    const laterHome = path.join(laterRoot, 'Users', 'pauline');
    const laterVault = path.join(laterHome, 'Vault', 'PaulineOS');
    const laterWorkspace = path.join(laterHome, 'Code', 'Memento');

    // Run Slice 1+2 for later path
    const laterInstallerInputs = {
      selected_runtimes: ['Claude'],
      target_install_root: laterVault,
      home_root: laterHome,
      vault_location: laterVault,
      workspace_root: laterWorkspace,
      source_doctrine_root: SOURCE_DOCTRINE,
      template_source_root: TEMPLATE_SOURCE,
      manifest_path: MANIFEST_PATH,
    };

    const laterManifest = buildInstallerManifest(laterInstallerInputs);
    await copyCore(laterManifest);
    await placeTemplates(laterManifest);
    await generateScaffolds(laterManifest);

    const laterPacket = { ...PAULINE, connect_accounts_now: 'later', selected_runtimes: ['Claude'] };
    const laterSlice2 = runOnboarding({
      installerManifest: laterManifest,
      onboardingAnswers: laterPacket,
      templateSourceRoot: TEMPLATE_SOURCE,
      targetInstallRoot: laterVault,
      homeRoot: laterHome,
      manifestPath: MANIFEST_PATH,
    });

    const laterSlice3 = runSlice3Onboarding({
      packet: laterSlice2.packet,
      targetInstallRoot: laterVault,
      homeRoot: laterHome,
      targetWorkspaceRoot: laterWorkspace,
    });

    const laterConfigPath = path.join(laterWorkspace, 'state', 'runtime', 'pipeline_config.json');
    assert(fs.existsSync(laterConfigPath), '"Later" path: pipeline_config.json exists');
    const laterConfig = JSON.parse(fs.readFileSync(laterConfigPath, 'utf8'));
    assert(laterConfig.accounts.gmail.length === 0, '"Later" path: no Gmail accounts');
    assert(laterConfig.accounts.basecamp.connected === false, '"Later" path: Basecamp not connected');
    assert(laterConfig.sync_engines.gmail === false, '"Later" path: Gmail sync disabled');

    // System still functional (boot chain, memory exist)
    assert(fs.existsSync(path.join(laterVault, 'BOOT.md')), '"Later" path: BOOT.md exists');
    assert(fs.existsSync(path.join(laterVault, 'memory.md')), '"Later" path: memory.md exists');

    fs.rmSync(laterRoot, { recursive: true, force: true });
  }

  // =========================================================================
  // ST-10: Backward compatibility
  // =========================================================================
  console.log('\n--- ST-10: Backward compatibility ---');
  {
    const gmailClientPath = path.join(TARGET_WORKSPACE, 'pipeline', 'lib', 'gmail_client.js');
    const gmailClientContent = fs.readFileSync(gmailClientPath, 'utf8');
    assert(gmailClientContent.includes('getGmailAccounts'), 'gmail_client.js reads from pipeline config helper');
    assert(gmailClientContent.includes('HARDCODED_ACCOUNTS') || gmailClientContent.includes('gws-ca'), 'gmail_client.js has hardcoded fallback');

    const basecampClientPath = path.join(TARGET_WORKSPACE, 'pipeline', 'lib', 'basecamp_client.js');
    const basecampClientContent = fs.readFileSync(basecampClientPath, 'utf8');
    assert(basecampClientContent.includes('getBasecampApiBase'), 'basecamp_client.js reads from pipeline config helper');
    assert(basecampClientContent.includes('FALLBACK_BASECAMP_API_BASE'), 'basecamp_client.js has hardcoded fallback (Viktor ID)');
  }

  // =========================================================================
  // Slice 3 validation result
  // =========================================================================
  console.log('\n--- Slice 3 Validation ---');
  assert(slice3Result.success === true, 'Slice 3 validation passed');
  if (!slice3Result.success && slice3Result.validation) {
    for (const f of slice3Result.validation.findings) {
      if (f.severity === 'fail') console.error(`  [${f.checkpoint}] ${f.message}`);
    }
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n=== SLICE 3 DRY TEST SUMMARY ===`);
  console.log(`Passed: ${passed}, Failed: ${failed}`);

  fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
  console.log('Temp directory cleaned up.');

  if (failed > 0) {
    process.exit(1);
  }
}

runSlice3Test().catch((err) => {
  console.error('Slice 3 test crashed:', err);
  try { fs.rmSync(TEMP_ROOT, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
});
