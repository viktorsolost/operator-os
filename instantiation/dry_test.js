'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { buildInstallerManifest } = require('./installer/manifest');
const { copyCore } = require('./installer/core_copier');
const { placeTemplates } = require('./installer/template_placer');
const { generateScaffolds } = require('./installer/scaffold_generator');
const { runOnboarding } = require('./onboarding/orchestrator');
const { loadFileMatrix } = require('./shared/file_matrix');

// ---------------------------------------------------------------------------
// Fake user
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
  business_context: 'Design studio specializing in brand identity and digital experiences. 4 active client projects, 2 internal tools.',
  preferred_reporting_style: 'short summaries',
  brand_categories: ['studio-brand', 'client-brands'],
  project_categories: ['client-projects', 'internal-tools'],
  connect_accounts_now: 'later',
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
// Setup temp directories
// ---------------------------------------------------------------------------
const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-dry-test-'));
const TARGET_HOME = path.join(TEMP_ROOT, 'Users', 'pauline');
const TARGET_VAULT = path.join(TARGET_HOME, 'Vault', 'PaulineOS');
const TARGET_WORKSPACE = path.join(TARGET_HOME, 'Code', 'Memento');
const SOURCE_DOCTRINE = path.join(TEMP_ROOT, 'source_doctrine');
const TEMPLATE_SOURCE = path.resolve(__dirname, 'templates');
const MANIFEST_PATH = path.resolve(__dirname, 'manifests', 'file-treatment-manifest.json');

// Load matrix and create mock source files
const matrix = loadFileMatrix(MANIFEST_PATH);

// Mock copy-core sources
for (const surface of matrix.getCopyCore()) {
  createMockFile(SOURCE_DOCTRINE, surface.path, `# Reusable Core: ${surface.path}\nNo owner-specific content here.\n`);
}

// Mock rewrite-template sources with Viktor references for source_renderer to replace
for (const surface of matrix.getRewriteTemplate()) {
  if (surface.runtime_gated) continue; // bridges use .tmpl files, not source doctrine

  let mockContent;
  if (surface.path === 'BOOT.md') {
    // BOOT.md must reference ROUTING.md for boot chain verification
    mockContent = `# Boot\n\nViktor's system boot sequence.\n\n1. Read ROUTING.md\n2. Load memory.md + recent-context.md\n3. Route to operator lane\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nVIK OS boot complete.\n`;
  } else if (surface.path === 'ROUTING.md') {
    // ROUTING.md must reference operator files for boot chain verification
    mockContent = `# Routing\n\nViktor's operator routing.\n\nOperator lanes:\n- operator/anton.md\n- operator/claudia.md\n- operator/jonah.md\n- operator/vera.md\n- operator/lev.md\n\nVault: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nVIK OS routing.\n`;
  } else {
    mockContent = `# Template: ${surface.path}\nViktor manages this through VIK OS.\nPath: ~/VIK/ObsidianVault/VIK_OS\nHome: /Users/viktorsl/\nWorkspace: ~/VIK/Coding/Memento\nViktor's preferences are documented here.\n`;
  }
  createMockFile(SOURCE_DOCTRINE, surface.path, mockContent);
}

// ---------------------------------------------------------------------------
// Run full pipeline
// ---------------------------------------------------------------------------
async function runDryTest() {
  console.log('\n=== VIK OS DRY TEST: Pauline (Claude + Gemini) ===\n');

  // --- Slice 1: Installer ---
  console.log('Phase 1: Installer (Slice 1)');

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
  console.log(`  Manifest built: ${installerManifest.copyCore.length} core, ${installerManifest.templateSources.length} templates, ${installerManifest.bridgeTemplates.length} bridges, ${installerManifest.safeScaffolds.length} scaffolds`);

  await copyCore(installerManifest);
  console.log('  Core files copied.');

  await placeTemplates(installerManifest);
  console.log('  Templates placed.');

  await generateScaffolds(installerManifest);
  console.log('  Scaffolds generated.');

  // --- Slice 2: Onboarding ---
  console.log('\nPhase 2: Onboarding (Slice 2)');

  const result = runOnboarding({
    installerManifest,
    onboardingAnswers: PAULINE,
    templateSourceRoot: TEMPLATE_SOURCE,
    targetInstallRoot: TARGET_VAULT,
    homeRoot: TARGET_HOME,
    manifestPath: MANIFEST_PATH,
  });

  // ---------------------------------------------------------------------------
  // DT-1: Pipeline completes
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-1: Pipeline completes ---');
  assert(result.success === true, 'Pipeline completed successfully');
  if (!result.success) {
    console.error('Pipeline failed at phase:', result.phase);
    console.error('Errors:', JSON.stringify(result.errors, null, 2));
  }

  // ---------------------------------------------------------------------------
  // DT-2: Surface coverage
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-2: Surface coverage ---');
  const allVaultFiles = walkDir(TARGET_VAULT);
  assert(allVaultFiles.length > 0, 'Target tree has files');

  // Check all template sources exist
  let templatesMissing = 0;
  for (const item of installerManifest.templateSources) {
    if (!fs.existsSync(item.target)) templatesMissing++;
  }
  assert(templatesMissing === 0, `All ${installerManifest.templateSources.length} template source surfaces exist`);

  // Check all bridge templates exist
  let bridgesMissing = 0;
  for (const item of installerManifest.bridgeTemplates) {
    if (!fs.existsSync(item.target)) bridgesMissing++;
  }
  assert(bridgesMissing === 0, `All ${installerManifest.bridgeTemplates.length} bridge surfaces exist`);

  // Check generate-fresh vault surfaces
  const freshFiles = ['memory.md', 'recent-context.md', 'operator/identity.md', 'operator/reminders.md', 'operator/claudia-memory.md', 'brands/registry.md'];
  let freshMissing = 0;
  for (const rel of freshFiles) {
    if (!fs.existsSync(path.join(TARGET_VAULT, rel))) freshMissing++;
  }
  assert(freshMissing === 0, `All ${freshFiles.length} vault generate-fresh surfaces exist`);

  // ---------------------------------------------------------------------------
  // DT-3: Zero Viktor residue
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-3: Zero Viktor residue ---');
  // Bridge files are now in vault root — no need to scan home runtime dirs
  const allFiles = walkDir(TARGET_VAULT);
  const forbidden = ['Viktor', 'viktorsl', '/Users/viktorsl', 'VIK OS', '~/VIK/ObsidianVault/VIK_OS', '~/VIK/Coding/Memento'];
  let residueFound = [];
  for (const fp of allFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    for (const term of forbidden) {
      if (content.includes(term)) {
        residueFound.push(`${term} in ${fp}`);
      }
    }
  }
  assert(residueFound.length === 0, `Zero Viktor residue (found ${residueFound.length})`);
  if (residueFound.length > 0) {
    for (const r of residueFound.slice(0, 10)) console.error(`    ${r}`);
  }

  // ---------------------------------------------------------------------------
  // DT-4: Path integrity
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-4: Path integrity ---');
  let ownerPathsFound = false;
  let viktorPathsFound = false;
  for (const fp of allFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    if (content.includes('/Users/pauline')) ownerPathsFound = true;
    if (content.includes('/Users/viktorsl')) viktorPathsFound = true;
  }
  assert(ownerPathsFound, 'Owner paths (Pauline) found in generated files');
  assert(!viktorPathsFound, 'No Viktor paths in generated files');

  // ---------------------------------------------------------------------------
  // DT-5: Boot chain
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-5: Boot chain ---');
  const bootPath = path.join(TARGET_VAULT, 'BOOT.md');
  const routingPath = path.join(TARGET_VAULT, 'ROUTING.md');
  assert(fs.existsSync(bootPath), 'BOOT.md exists');
  const bootContent = fs.existsSync(bootPath) ? fs.readFileSync(bootPath, 'utf8') : '';
  assert(bootContent.includes('ROUTING.md'), 'BOOT.md references ROUTING.md');
  assert(fs.existsSync(routingPath), 'ROUTING.md exists');
  const operatorFiles = ['operator/anton.md', 'operator/claudia.md', 'operator/jonah.md', 'operator/vera.md', 'operator/lev.md'];
  let opMissing = 0;
  for (const op of operatorFiles) {
    if (!fs.existsSync(path.join(TARGET_VAULT, op))) opMissing++;
  }
  assert(opMissing === 0, 'All operator files in boot chain exist');

  // ---------------------------------------------------------------------------
  // DT-6: Memory content
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-6: Memory content ---');
  const memContent = fs.readFileSync(path.join(TARGET_VAULT, 'memory.md'), 'utf8');
  assert(memContent.includes('Boot Sequence'), 'memory.md has Boot Sequence');
  assert(memContent.includes('Communication Style'), 'memory.md has Communication Style');
  assert(memContent.includes('Operator Hierarchy'), 'memory.md has Operator Hierarchy');
  assert(memContent.includes('Operator Invocation Rule'), 'memory.md has Operator Invocation Rule');
  assert(memContent.includes('Conversational tone'), 'memory.md has warm tone style (from tone_profile)');
  assert(memContent.length > 500, 'memory.md has substantive content (not a stub)');

  // ---------------------------------------------------------------------------
  // DT-7: Identity content
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-7: Identity content ---');
  const idContent = fs.readFileSync(path.join(TARGET_VAULT, 'operator', 'identity.md'), 'utf8');
  assert(idContent.includes('Role'), 'identity.md has Role section');
  assert(idContent.includes('Business Context'), 'identity.md has Business Context');
  assert(idContent.includes('Day to Day'), 'identity.md has Day to Day');
  assert(idContent.includes('Weekly Success'), 'identity.md has Weekly Success');
  assert(idContent.includes('Pauline'), 'identity.md contains Pauline');
  assert(idContent.toLowerCase().includes('creative director'), 'identity.md contains creative director');
  assert(!idContent.includes('Viktor'), 'identity.md does NOT contain Viktor');

  // ---------------------------------------------------------------------------
  // DT-8: Runtime gating — bridge files are in vault root, not home dirs
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-8: Runtime gating ---');
  // Pauline selected Claude + Gemini. CLAUDE.md is handled by the claude_md
  // rewrite-template (not a bridge entry), Gemini bridge goes to vault root.
  assert(fs.existsSync(path.join(TARGET_VAULT, 'CLAUDE.md')), 'Claude bridge exists in vault root');
  assert(fs.existsSync(path.join(TARGET_VAULT, 'GEMINI.md')), 'Gemini bridge exists in vault root');
  // Codex not selected — AGENTS.md should not exist
  assert(!fs.existsSync(path.join(TARGET_VAULT, 'AGENTS.md')), 'Codex bridge (AGENTS.md) not present when Codex not selected');
  // No files should be written to home runtime dirs
  const homeDotClaude = walkDir(path.join(TARGET_HOME, '.claude'));
  assert(homeDotClaude.length === 0, `~/.claude dir has no installer-written files (found ${homeDotClaude.length})`);
  const homeDotGemini = walkDir(path.join(TARGET_HOME, '.gemini'));
  assert(homeDotGemini.length === 0, `~/.gemini dir has no installer-written files (found ${homeDotGemini.length})`);

  // ---------------------------------------------------------------------------
  // DT-9: Template cleanliness
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-9: Template cleanliness ---');
  let unresolvedFiles = [];
  for (const fp of allFiles) {
    const content = fs.readFileSync(fp, 'utf8');
    if (content.includes('{{')) {
      unresolvedFiles.push(fp);
    }
  }
  assert(unresolvedFiles.length === 0, `No unresolved {{ markers (found in ${unresolvedFiles.length} files)`);
  if (unresolvedFiles.length > 0) {
    for (const f of unresolvedFiles.slice(0, 5)) console.error(`    ${f}`);
  }

  // ---------------------------------------------------------------------------
  // DT-10: Functional Claudia
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-10: Functional Claudia ---');
  const claudiaPath = path.join(TARGET_VAULT, 'operator', 'claudia.md');
  assert(fs.existsSync(claudiaPath), 'claudia.md exists');
  if (fs.existsSync(claudiaPath)) {
    const claudiaContent = fs.readFileSync(claudiaPath, 'utf8');
    assert(claudiaContent.includes('Pauline'), 'claudia.md references Pauline');
  }
  const claudiaMemPath = path.join(TARGET_VAULT, 'operator', 'claudia-memory.md');
  assert(fs.existsSync(claudiaMemPath), 'claudia-memory.md exists');
  if (fs.existsSync(claudiaMemPath)) {
    const cmContent = fs.readFileSync(claudiaMemPath, 'utf8');
    assert(cmContent.includes('Email'), 'claudia-memory.md has Email section');
    assert(cmContent.includes('Sub-Agent'), 'claudia-memory.md has Sub-Agent section');
  }

  // ---------------------------------------------------------------------------
  // DT-11: Value out of the box
  // ---------------------------------------------------------------------------
  console.log('\n--- DT-11: Value out of the box ---');
  assert(idContent.toLowerCase().includes('creative director'), 'Operator can find owner role');
  assert(bootContent.includes('ROUTING.md'), 'Boot chain resolves');
  assert(memContent.includes('Communication Style'), 'Operator knows comm rules');
  assert(memContent.includes('Operator Hierarchy'), 'Operator knows escalation');
  const cmContent2 = fs.existsSync(claudiaMemPath) ? fs.readFileSync(claudiaMemPath, 'utf8') : '';
  assert(cmContent2.includes('Email'), 'Claudia can draft emails');
  assert(memContent.includes('Distilled Memory'), 'memory.md is structured');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n=== DRY TEST SUMMARY ===`);
  console.log(`Passed: ${passed}, Failed: ${failed}`);

  // Cleanup
  fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
  console.log('Temp directory cleaned up.');

  if (failed > 0) {
    process.exit(1);
  }
}

runDryTest().catch((err) => {
  console.error('Dry test crashed:', err);
  try { fs.rmSync(TEMP_ROOT, { recursive: true, force: true }); } catch (_) {}
  process.exit(1);
});
