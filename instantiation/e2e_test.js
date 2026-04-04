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
const MEMENTO_SOURCE = path.resolve(process.env.HOME, 'VIK', 'Coding', 'Memento');
const MANIFEST_PATH = path.resolve(__dirname, 'manifests', 'file-treatment-manifest.json');
const TEMPLATE_SOURCE = path.resolve(__dirname, 'templates');

// ---------------------------------------------------------------------------
// Fake user: Marcus
// ---------------------------------------------------------------------------
const MARCUS = {
  owner_name: 'Marcus',
  system_name: 'Marcus OS',
  primary_role: 'Solo founder building a SaaS product with 2 contractors',
  timezone: 'America/New_York (UTC-5)',
  home_root: '/Users/marcus',
  vault_location: '/Users/marcus/Notes/MarcusOS',
  workspace_root: '/Users/marcus/Dev/Memento',
  selected_runtimes: ['Claude', 'Codex'],
  tone_profile: 'direct',
  priority_modes: 'product dev, contractor coordination, sales',
  business_context: 'SaaS startup building developer tools. Pre-revenue, 2 part-time contractors.',
  preferred_reporting_style: 'concise',
  brand_categories: ['product-brand'],
  project_categories: ['product-dev', 'sales'],
  connect_accounts_now: 'now',
  gmail_accounts: [
    { name: 'gws-work', label: 'Work email' },
  ],
  gmail_emails: ['marcus@devtools.io'],
  basecamp_account_id: '5551234',
  basecamp_person_id: '87654321',
};

const MARCUS_CONNECTIONS = {
  gmail: [
    { name: 'gws-work', config_dir: '~/.config/gws-work', label: 'Work email', connected: true },
  ],
  basecamp: {
    account_id: '5551234',
    api_base: 'https://3.basecampapi.com/5551234',
    connected: true,
  },
  sourceIdentities: {
    basecamp: { owner: { person_id: '87654321' } },
  },
};

const MARCUS_SYNC = {
  captures: {
    gmail: [{
      id: 'gmail_msg_gws-work_m001',
      data: {
        capture_id: 'gmail_msg_gws-work_m001',
        source: 'gmail',
        normalized_payload: {
          message_id: 'm001', from: 'marcus@devtools.io', to: ['contractor@example.com'],
          subject: 'Sprint update', snippet: 'Hey, Quick update on the API endpoints. Cheers, Marcus',
          date: '2026-04-01T14:00:00Z', account: 'gws-work',
        },
      },
    }],
    basecamp: [{
      id: 'bc_comment_m001',
      data: {
        capture_id: 'bc_comment_m001', source: 'basecamp',
        normalized_payload: { content: 'Looks good, ship it. Marcus', creator_id: '87654321' },
      },
    }],
  },
  syncLogs: {
    gmail: { last_run: '2026-04-04T14:00:00Z', accounts: { 'gws-work': '2026-04-04T14:00:00Z' } },
    basecamp: { last_run: '2026-04-04T14:00:00Z' },
  },
  derived: {
    'today.html': '<html><body><h1>Today - Marcus OS</h1><p>First sync complete.</p></body></html>',
    'editorial.json': JSON.stringify({ entries: [] }),
    'contacts.json': JSON.stringify({ contacts: [] }),
  },
};

const MARCUS_VOICE = {
  sentMessages: [{
    normalized_payload: { from: 'marcus@devtools.io', snippet: 'Hey,\nQuick update on the API endpoints.\nCheers,\nMarcus' },
  }],
  basecampComments: [{
    normalized_payload: { content: 'Looks good, ship it. Marcus', creator_id: '87654321' },
  }],
};

// ---------------------------------------------------------------------------
// Pauline partial auth data
// ---------------------------------------------------------------------------
const PAULINE_PARTIAL = {
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

const PARTIAL_CONNECTIONS = {
  gmail: [
    { name: 'gws-studio', config_dir: '~/.config/gws-studio', label: 'Studio email', connected: true },
    { name: 'gws-personal', config_dir: '~/.config/gws-personal', label: 'Personal', connected: false, error: 'gws auth login failed' },
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

const PARTIAL_SYNC = {
  captures: {
    gmail: [{
      id: 'gmail_msg_gws-studio_p001',
      data: {
        capture_id: 'gmail_msg_gws-studio_p001', source: 'gmail',
        normalized_payload: {
          message_id: 'p001', from: 'pauline@studio.com', to: ['client@example.com'],
          subject: 'Design review', snippet: 'Hi, Here are the latest mockups. Best, Pauline',
          date: '2026-04-01T10:00:00Z', account: 'gws-studio',
        },
      },
    }],
    basecamp: [{
      id: 'bc_comment_p001',
      data: {
        capture_id: 'bc_comment_p001', source: 'basecamp',
        normalized_payload: { content: 'Updated the timeline. Pauline', creator_id: '12345678' },
      },
    }],
  },
  syncLogs: {
    gmail: { last_run: '2026-04-04T10:00:00Z', accounts: { 'gws-studio': '2026-04-04T10:00:00Z' } },
    basecamp: { last_run: '2026-04-04T10:00:00Z' },
  },
  derived: {
    'today.html': '<html><body><h1>Today - Pauline OS</h1><p>Partial sync.</p></body></html>',
    'editorial.json': JSON.stringify({ entries: [] }),
    'contacts.json': JSON.stringify({ contacts: [] }),
  },
};

const PARTIAL_VOICE = {
  sentMessages: [{
    normalized_payload: { from: 'pauline@studio.com', snippet: 'Hi,\nHere are the latest mockups.\nBest,\nPauline' },
  }],
  basecampComments: [{
    normalized_payload: { content: 'Updated the timeline. Pauline', creator_id: '12345678' },
  }],
};

// ---------------------------------------------------------------------------
// Test helpers (same pattern as dry_test.js and slice3_test.js)
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

function walkDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function createMockFile(base, relPath, content) {
  const fullPath = path.join(base, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content || `# Mock: ${relPath}\nNo owner-specific content here.\n`);
}

// ---------------------------------------------------------------------------
// Shared mock source creation
// ---------------------------------------------------------------------------
function createMockSources(sourceDoctrineRoot) {
  const matrix = loadFileMatrix(MANIFEST_PATH);

  for (const surface of matrix.getCopyCore()) {
    createMockFile(sourceDoctrineRoot, surface.path, `# Reusable Core: ${surface.path}\nNo owner-specific content here.\n`);
  }

  for (const surface of matrix.getRewriteTemplate()) {
    if (surface.runtime_gated) continue;
    let mockContent;
    if (surface.path === 'BOOT.md') {
      mockContent = `# Boot\n\nViktor's system boot sequence.\n\n1. Read ROUTING.md\n2. Load memory.md + recent-context.md\n3. Route to operator lane\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nVIK OS boot complete.\n`;
    } else if (surface.path === 'ROUTING.md') {
      mockContent = `# Routing\n\nViktor's operator routing.\n\nOperator lanes:\n- operator/anton.md\n- operator/claudia.md\n- operator/jonah.md\n- operator/vera.md\n- operator/lev.md\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nVIK OS routing.\n`;
    } else {
      mockContent = `# Template: ${surface.path}\nViktor manages this through VIK OS.\nPath: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nViktor's preferences are documented here.\n`;
    }
    createMockFile(sourceDoctrineRoot, surface.path, mockContent);
  }
}

// ---------------------------------------------------------------------------
// Run full slices 1-3 for a user
// ---------------------------------------------------------------------------
async function runFullInstall({ user, connections, syncResults, capturedData, tempRoot }) {
  const targetHome = path.join(tempRoot, 'Users', user.owner_name.toLowerCase());
  const targetVault = path.join(targetHome, user.vault_location.replace(/^\/Users\/[^/]+\//, ''));
  const targetWorkspace = path.join(targetHome, user.workspace_root.replace(/^\/Users\/[^/]+\//, ''));
  const sourceDoctrineRoot = path.join(tempRoot, 'source_doctrine');

  createMockSources(sourceDoctrineRoot);

  const installerInputs = {
    selected_runtimes: user.selected_runtimes,
    target_install_root: targetVault,
    home_root: targetHome,
    vault_location: targetVault,
    workspace_root: targetWorkspace,
    source_doctrine_root: sourceDoctrineRoot,
    template_source_root: TEMPLATE_SOURCE,
    manifest_path: MANIFEST_PATH,
  };

  const installerManifest = buildInstallerManifest(installerInputs);
  await copyCore(installerManifest);
  await placeTemplates(installerManifest);
  await generateScaffolds(installerManifest);

  const slice2Result = runOnboarding({
    installerManifest,
    onboardingAnswers: user,
    templateSourceRoot: TEMPLATE_SOURCE,
    targetInstallRoot: targetVault,
    homeRoot: targetHome,
    manifestPath: MANIFEST_PATH,
  });

  const slice3Result = runSlice3Onboarding({
    packet: slice2Result.packet,
    targetInstallRoot: targetVault,
    homeRoot: targetHome,
    targetWorkspaceRoot: targetWorkspace,
    mementoSourceRoot: MEMENTO_SOURCE,
    mockConnections: connections,
    mockSyncResults: syncResults,
    mockCapturedData: capturedData,
  });

  return { installerManifest, slice2Result, slice3Result, targetHome, targetVault, targetWorkspace };
}

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------
async function runE2ETest() {
  console.log('\n=== VIK OS END-TO-END INTEGRATION TEST ===\n');

  // Temp dirs
  const MARCUS_TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-e2e-marcus-'));
  const PARTIAL_TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-e2e-partial-'));
  const RECONNECT_TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-e2e-reconnect-'));

  const allTempDirs = [MARCUS_TEMP, PARTIAL_TEMP, RECONNECT_TEMP];

  function cleanup() {
    for (const dir of allTempDirs) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  try {
    // =========================================================================
    // E2E-1: Second user profile (Marcus) — full slices 1-3
    // =========================================================================
    console.log('--- E2E-1: Second user profile (Marcus) ---');

    const marcus = await runFullInstall({
      user: MARCUS,
      connections: MARCUS_CONNECTIONS,
      syncResults: MARCUS_SYNC,
      capturedData: MARCUS_VOICE,
      tempRoot: MARCUS_TEMP,
    });

    const { slice2Result: marcusSlice2, slice3Result: marcusSlice3 } = marcus;
    const MARCUS_HOME = marcus.targetHome;
    const MARCUS_VAULT = marcus.targetVault;
    const MARCUS_WORKSPACE = marcus.targetWorkspace;

    assert(marcusSlice2.success === true, 'Marcus: Slice 2 pipeline completes');
    assert(marcusSlice3.success === true, 'Marcus: Slice 3 pipeline completes');

    // Zero Viktor residue
    const marcusAllFiles = [
      ...walkDir(MARCUS_VAULT),
      ...walkDir(path.join(MARCUS_HOME, '.claude')),
      ...walkDir(path.join(MARCUS_HOME, '.codex')),
      ...walkDir(path.join(MARCUS_HOME, '.gemini')),
      ...walkDir(path.join(MARCUS_HOME, '.openclaw')),
    ];
    const forbidden = ['Viktor', 'viktorsl', '/Users/viktorsl', 'VIK OS', '~/VIK/ObsidianVault/VIK_OS', '~/VIK/Coding/Memento'];
    let marcusResidueFound = [];
    for (const fp of marcusAllFiles) {
      const content = fs.readFileSync(fp, 'utf8');
      for (const term of forbidden) {
        if (content.includes(term)) marcusResidueFound.push(`${term} in ${path.relative(MARCUS_TEMP, fp)}`);
      }
    }
    assert(marcusResidueFound.length === 0, `Marcus: Zero Viktor residue (found ${marcusResidueFound.length})`);
    if (marcusResidueFound.length > 0) {
      for (const r of marcusResidueFound.slice(0, 5)) console.error(`    ${r}`);
    }

    // Zero Pauline residue
    let paulineResidueFound = [];
    for (const fp of marcusAllFiles) {
      const content = fs.readFileSync(fp, 'utf8');
      if (content.includes('Pauline')) paulineResidueFound.push(path.relative(MARCUS_TEMP, fp));
    }
    assert(paulineResidueFound.length === 0, `Marcus: Zero Pauline residue (found ${paulineResidueFound.length})`);

    // Marcus paths and identity appear
    let marcusPathsFound = false;
    let marcusNameFound = false;
    let marcusRoleFound = false;
    for (const fp of marcusAllFiles) {
      const content = fs.readFileSync(fp, 'utf8');
      if (content.includes('/Users/marcus')) marcusPathsFound = true;
      if (content.includes('Marcus')) marcusNameFound = true;
      if (content.toLowerCase().includes('solo founder')) marcusRoleFound = true;
    }
    assert(marcusPathsFound, 'Marcus: Marcus paths appear in generated files');
    assert(marcusNameFound, 'Marcus: Marcus name appears in generated files');
    assert(marcusRoleFound, 'Marcus: Marcus role (solo founder) appears in generated files');

    // Runtime gating: Claude and Codex YES, Gemini and OpenClaw NO
    assert(fs.existsSync(path.join(MARCUS_HOME, '.claude', 'CLAUDE.md')), 'Marcus: Claude bridge exists');
    assert(fs.existsSync(path.join(MARCUS_HOME, '.codex')), 'Marcus: Codex dir exists');
    const marcusGeminiFiles = walkDir(path.join(MARCUS_HOME, '.gemini'));
    assert(marcusGeminiFiles.length === 0, `Marcus: Gemini dir has no files (found ${marcusGeminiFiles.length})`);
    const marcusOpenclawFiles = walkDir(path.join(MARCUS_HOME, '.openclaw'));
    assert(marcusOpenclawFiles.length === 0, `Marcus: OpenClaw dir has no files (found ${marcusOpenclawFiles.length})`);

    // Boot chain resolves
    assert(fs.existsSync(path.join(MARCUS_VAULT, 'BOOT.md')), 'Marcus: BOOT.md exists');
    const marcusBootContent = fs.readFileSync(path.join(MARCUS_VAULT, 'BOOT.md'), 'utf8');
    assert(marcusBootContent.includes('ROUTING.md'), 'Marcus: BOOT.md references ROUTING.md');

    // Pipeline config has Marcus's accounts
    const marcusConfigPath = path.join(MARCUS_WORKSPACE, 'state', 'runtime', 'pipeline_config.json');
    assert(fs.existsSync(marcusConfigPath), 'Marcus: pipeline_config.json exists');
    const marcusConfig = JSON.parse(fs.readFileSync(marcusConfigPath, 'utf8'));
    assert(marcusConfig.owner.name === 'Marcus', 'Marcus: pipeline_config has Marcus as owner');
    assert(marcusConfig.accounts.gmail.length === 1, 'Marcus: pipeline_config has 1 Gmail account');
    assert(marcusConfig.accounts.gmail[0].name === 'gws-work', 'Marcus: pipeline_config has gws-work account');
    assert(marcusConfig.accounts.basecamp.account_id === '5551234', 'Marcus: pipeline_config has correct Basecamp ID');

    // Voice profile references Marcus
    const marcusVoicePath = path.join(MARCUS_VAULT, 'operator', 'voice.md');
    assert(fs.existsSync(marcusVoicePath), 'Marcus: operator/voice.md exists');
    if (fs.existsSync(marcusVoicePath)) {
      const vContent = fs.readFileSync(marcusVoicePath, 'utf8');
      assert(vContent.includes('Marcus'), 'Marcus: voice.md references Marcus');
    }

    // =========================================================================
    // E2E-2: Boot chain cross-reference resolution (using Marcus's vault)
    // =========================================================================
    console.log('\n--- E2E-2: Boot chain cross-reference resolution ---');

    const bootPath = path.join(MARCUS_VAULT, 'BOOT.md');
    const bootContent = fs.readFileSync(bootPath, 'utf8');

    // Find all .md file references in BOOT.md
    const bootMdRefs = [...bootContent.matchAll(/\b[\w/.-]+\.md\b/g)].map(m => m[0]);
    const uniqueBootRefs = [...new Set(bootMdRefs)];
    let bootRefsMissing = [];
    for (const ref of uniqueBootRefs) {
      // Resolve relative to vault root
      const refPath = path.join(MARCUS_VAULT, ref);
      if (!fs.existsSync(refPath)) bootRefsMissing.push(ref);
    }
    assert(bootRefsMissing.length === 0, `BOOT.md: All ${uniqueBootRefs.length} referenced .md files exist (missing: ${bootRefsMissing.join(', ') || 'none'})`);

    // Find all operator file references in ROUTING.md
    const routingPath = path.join(MARCUS_VAULT, 'ROUTING.md');
    assert(fs.existsSync(routingPath), 'ROUTING.md exists in Marcus vault');
    const routingContent = fs.existsSync(routingPath) ? fs.readFileSync(routingPath, 'utf8') : '';
    const routingMdRefs = [...routingContent.matchAll(/\b[\w/.-]+\.md\b/g)].map(m => m[0]);
    const uniqueRoutingRefs = [...new Set(routingMdRefs)];
    let routingRefsMissing = [];
    for (const ref of uniqueRoutingRefs) {
      const refPath = path.join(MARCUS_VAULT, ref);
      if (!fs.existsSync(refPath)) routingRefsMissing.push(ref);
    }
    assert(routingRefsMissing.length === 0, `ROUTING.md: All ${uniqueRoutingRefs.length} referenced .md files exist (missing: ${routingRefsMissing.join(', ') || 'none'})`);

    // memory.md does not reference files that don't exist
    const memoryPath = path.join(MARCUS_VAULT, 'memory.md');
    assert(fs.existsSync(memoryPath), 'memory.md exists in Marcus vault');
    const memoryContent = fs.existsSync(memoryPath) ? fs.readFileSync(memoryPath, 'utf8') : '';
    const memoryMdRefs = [...memoryContent.matchAll(/\b[\w/.-]+\.md\b/g)].map(m => m[0]);
    const uniqueMemoryRefs = [...new Set(memoryMdRefs)];
    let memoryRefsMissing = [];
    for (const ref of uniqueMemoryRefs) {
      const refPath = path.join(MARCUS_VAULT, ref);
      if (!fs.existsSync(refPath)) memoryRefsMissing.push(ref);
    }
    assert(memoryRefsMissing.length === 0, `memory.md: All ${uniqueMemoryRefs.length} referenced .md files exist (missing: ${memoryRefsMissing.join(', ') || 'none'})`);

    // =========================================================================
    // E2E-3: Partial auth path
    // =========================================================================
    console.log('\n--- E2E-3: Partial auth path ---');

    const partial = await runFullInstall({
      user: PAULINE_PARTIAL,
      connections: PARTIAL_CONNECTIONS,
      syncResults: PARTIAL_SYNC,
      capturedData: PARTIAL_VOICE,
      tempRoot: PARTIAL_TEMP,
    });

    const { slice2Result: partialSlice2, slice3Result: partialSlice3 } = partial;
    const PARTIAL_VAULT = partial.targetVault;
    const PARTIAL_WORKSPACE = partial.targetWorkspace;

    assert(partialSlice2.success === true, 'Partial auth: Slice 2 completes');
    // Slice 3 may succeed even with partial auth (at least one account connected)
    const partialConfigPath = path.join(PARTIAL_WORKSPACE, 'state', 'runtime', 'pipeline_config.json');
    assert(fs.existsSync(partialConfigPath), 'Partial auth: pipeline_config.json exists');

    const partialConfig = JSON.parse(fs.readFileSync(partialConfigPath, 'utf8'));

    // BUG FIX VERIFICATION: connected field reflects actual auth state
    assert(partialConfig.accounts.gmail.length === 2, 'Partial auth: Config has 2 Gmail accounts');
    const studioAccount = partialConfig.accounts.gmail.find(a => a.name === 'gws-studio');
    const personalAccount = partialConfig.accounts.gmail.find(a => a.name === 'gws-personal');
    assert(studioAccount !== undefined, 'Partial auth: gws-studio account present');
    assert(studioAccount && studioAccount.connected === true, 'Partial auth: gws-studio shows connected: true');
    assert(personalAccount !== undefined, 'Partial auth: gws-personal account present');
    assert(personalAccount && personalAccount.connected === false, 'Partial auth: gws-personal shows connected: false (bug fix verified)');
    assert(partialConfig.accounts.basecamp.connected === true, 'Partial auth: Basecamp shows connected: true');

    // Sync still runs (at least one account connected — connections not skipped)
    assert(partialSlice3.sync && partialSlice3.sync.skipped !== true, 'Partial auth: Sync runs (not skipped)');

    // System functional: boot chain present
    assert(fs.existsSync(path.join(PARTIAL_VAULT, 'BOOT.md')), 'Partial auth: BOOT.md exists (system functional)');
    assert(fs.existsSync(path.join(PARTIAL_VAULT, 'memory.md')), 'Partial auth: memory.md exists (system functional)');

    // Voice profile still generated (has data from connected account)
    const partialVoicePath = path.join(PARTIAL_VAULT, 'operator', 'voice.md');
    assert(fs.existsSync(partialVoicePath), 'Partial auth: voice.md generated despite partial failure');

    // =========================================================================
    // E2E-4: Reconnect readiness ("later" path)
    // =========================================================================
    console.log('\n--- E2E-4: Reconnect readiness ---');

    const RECONNECT_SOURCE = path.join(RECONNECT_TEMP, 'source_doctrine');
    createMockSources(RECONNECT_SOURCE);

    const laterUser = { ...PAULINE_PARTIAL, connect_accounts_now: 'later', selected_runtimes: ['Claude'] };
    const laterHome = path.join(RECONNECT_TEMP, 'Users', 'pauline');
    const laterVault = path.join(laterHome, 'Vault', 'PaulineOS');
    const laterWorkspace = path.join(laterHome, 'Code', 'Memento');

    const laterInstallerInputs = {
      selected_runtimes: laterUser.selected_runtimes,
      target_install_root: laterVault,
      home_root: laterHome,
      vault_location: laterVault,
      workspace_root: laterWorkspace,
      source_doctrine_root: RECONNECT_SOURCE,
      template_source_root: TEMPLATE_SOURCE,
      manifest_path: MANIFEST_PATH,
    };

    const laterManifest = buildInstallerManifest(laterInstallerInputs);
    await copyCore(laterManifest);
    await placeTemplates(laterManifest);
    await generateScaffolds(laterManifest);

    const laterSlice2 = runOnboarding({
      installerManifest: laterManifest,
      onboardingAnswers: laterUser,
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
      mementoSourceRoot: MEMENTO_SOURCE,
    });

    const laterConfigPath = path.join(laterWorkspace, 'state', 'runtime', 'pipeline_config.json');
    assert(fs.existsSync(laterConfigPath), 'Reconnect readiness: pipeline_config.json exists');
    const laterConfig = JSON.parse(fs.readFileSync(laterConfigPath, 'utf8'));
    assert(laterConfig.accounts.gmail.length === 0, 'Reconnect readiness: no Gmail accounts (empty config)');
    assert(laterConfig.accounts.basecamp.connected === false, 'Reconnect readiness: Basecamp not connected');
    assert(laterConfig.sync_engines.gmail === false, 'Reconnect readiness: Gmail sync disabled');

    // Verify config shape is suitable for reconnect.js
    assert(laterConfig.accounts !== undefined, 'Reconnect readiness: config.accounts exists');
    assert(Array.isArray(laterConfig.accounts.gmail), 'Reconnect readiness: config.accounts.gmail is array');
    assert(laterConfig.accounts.basecamp !== undefined, 'Reconnect readiness: config.accounts.basecamp exists');
    assert(laterConfig.accounts.basecamp.connected !== undefined, 'Reconnect readiness: config.accounts.basecamp.connected field present');

    // Verify reconnect.js can be required without error (guarded by require.main check)
    let reconnectRequireError = null;
    try {
      const reconnectModule = require('./onboarding/reconnect.js');
      assert(typeof reconnectModule.findPipelineConfig === 'function', 'Reconnect readiness: reconnect.js exports findPipelineConfig');
    } catch (err) {
      reconnectRequireError = err;
    }
    assert(reconnectRequireError === null, 'Reconnect readiness: reconnect.js loads without module error');

    // Verify config path state/runtime/pipeline_config.json is findable relative to workspace root
    const relConfigPath = path.join(laterWorkspace, 'state', 'runtime', 'pipeline_config.json');
    assert(fs.existsSync(relConfigPath), 'Reconnect readiness: pipeline_config.json findable at state/runtime/pipeline_config.json');

    // =========================================================================
    // E2E-5: Manifest completeness (using Marcus's generated output)
    // =========================================================================
    console.log('\n--- E2E-5: Manifest completeness ---');

    const matrix = loadFileMatrix(MANIFEST_PATH);
    const marcusManifest = marcus.installerManifest;

    // Every copy-core surface in matrix should exist in TARGET_VAULT
    const copyCores = matrix.getCopyCore();
    let copyCoreMissing = 0;
    for (const surface of copyCores) {
      const targetPath = marcusManifest.copyCore.find(item => item.id === surface.id);
      if (targetPath && !fs.existsSync(targetPath.target)) {
        copyCoreMissing++;
      }
    }
    assert(copyCoreMissing === 0, `Manifest completeness: All copy-core surfaces exist in target (missing: ${copyCoreMissing})`);

    // Every non-runtime-gated rewrite-template surface should exist in TARGET_VAULT
    const templateSurfaces = matrix.getRewriteTemplate().filter(s => !s.runtime_gated);
    let templatesMissing = 0;
    for (const surface of templateSurfaces) {
      const targetItem = marcusManifest.templateSources.find(item => item.id === surface.id);
      if (targetItem && !fs.existsSync(targetItem.target)) {
        templatesMissing++;
      }
    }
    assert(templatesMissing === 0, `Manifest completeness: All non-gated template surfaces exist (missing: ${templatesMissing})`);

    // Runtime-gated surfaces exist ONLY for selected runtimes (Claude, Codex)
    const claudeBridge = path.join(MARCUS_HOME, '.claude', 'CLAUDE.md');
    const codexDir = path.join(MARCUS_HOME, '.codex');
    const geminiBridgePath = path.join(MARCUS_HOME, '.gemini', 'GEMINI.md');
    const openclawBridgePath = path.join(MARCUS_HOME, '.openclaw', 'START_HERE.md');

    assert(fs.existsSync(claudeBridge), 'Manifest completeness: Claude bridge exists (selected runtime)');
    assert(fs.existsSync(codexDir), 'Manifest completeness: Codex dir exists (selected runtime)');
    assert(!fs.existsSync(geminiBridgePath), 'Manifest completeness: Gemini bridge does NOT exist (unselected runtime)');
    assert(!fs.existsSync(openclawBridgePath), 'Manifest completeness: OpenClaw bridge does NOT exist (unselected runtime)');

    // Count expected vs actual files (no extras, no missing from installer manifest)
    const expectedPaths = [
      ...marcusManifest.copyCore.map(i => i.target),
      ...marcusManifest.templateSources.map(i => i.target),
      ...marcusManifest.bridgeTemplates.map(i => i.target),
      ...marcusManifest.safeScaffolds.map(i => i.target),
    ];
    let manifestMissing = 0;
    for (const p of expectedPaths) {
      if (!fs.existsSync(p)) manifestMissing++;
    }
    assert(manifestMissing === 0, `Manifest completeness: All ${expectedPaths.length} manifest items exist on disk (missing: ${manifestMissing})`);

    // =========================================================================
    // Summary
    // =========================================================================
    console.log(`\n=== E2E TEST SUMMARY ===`);
    console.log(`Passed: ${passed}, Failed: ${failed}`);

  } finally {
    cleanup();
    console.log('All temp directories cleaned up.');
  }

  if (failed > 0) process.exit(1);
}

runE2ETest().catch(err => {
  console.error('E2E test crashed:', err);
  process.exit(1);
});
