'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { buildInstallerManifest } = require('./installer/manifest');
const { copyCore } = require('./installer/core_copier');
const { placeTemplates } = require('./installer/template_placer');
const { generateScaffolds } = require('./installer/scaffold_generator');
const { validateInstallerOutput } = require('./installer/validator');
const { normalizeRuntimeSelection } = require('./shared/runtime_selector');
const { loadFileMatrix } = require('./shared/file_matrix');

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function createMockFile(base, relPath, content) {
  const fullPath = path.join(base, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content || `# Mock: ${relPath}\nThis is test content.\n`);
}

// ---------------------------------------------------------------------------
// Setup: temp directories
// ---------------------------------------------------------------------------
const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'vik-os-install-test-'));
const TARGET_HOME = path.join(TEMP_ROOT, 'home', 'testuser');
const TARGET_VAULT = path.join(TARGET_HOME, 'TestVault', 'TestOS');
const TARGET_WORKSPACE = path.join(TARGET_HOME, 'Coding', 'Memento');
const SOURCE_DOCTRINE = path.join(TEMP_ROOT, 'source_doctrine');
const TEMPLATE_SOURCE = path.resolve(__dirname, 'templates');
const MANIFEST_PATH = path.resolve(__dirname, 'manifests', 'file-treatment-manifest.json');

// Load the file matrix to discover all surfaces dynamically
const matrix = loadFileMatrix(MANIFEST_PATH);

// Create mock source files for ALL copy-core surfaces
const coreItems = matrix.getInstallerCoreItems();
for (const surface of coreItems) {
  createMockFile(SOURCE_DOCTRINE, surface.path, `# Reusable Core: ${surface.path}\nNo owner-specific content here.\n`);
}

// Create mock source files for ALL rewrite-template surfaces (non-bridge)
const templateItems = matrix.getInstallerTemplateItems();
for (const surface of templateItems) {
  createMockFile(SOURCE_DOCTRINE, surface.path, `# Template: ${surface.path}\nReferences to {{owner_name}} and {{system_name}}.\n`);
}

// ---------------------------------------------------------------------------
// TEST 1: Full pipeline happy path
// ---------------------------------------------------------------------------
console.log('\n=== TEST 1: Full pipeline (Codex + Claude + Gemini + OpenClaw) ===\n');

const inputs = {
  selected_runtimes: ['Codex', 'Claude', 'Gemini', 'OpenClaw'],
  target_install_root: TARGET_VAULT,
  home_root: TARGET_HOME,
  vault_location: TARGET_VAULT,
  workspace_root: TARGET_WORKSPACE,
  source_doctrine_root: SOURCE_DOCTRINE,
  template_source_root: TEMPLATE_SOURCE,
  manifest_path: MANIFEST_PATH,
};

let manifest;
try {
  manifest = buildInstallerManifest(inputs);
  console.log('✓ Manifest built successfully');
  console.log(`  copyCore: ${manifest.copyCore.length} items`);
  console.log(`  templateSources: ${manifest.templateSources.length} items`);
  console.log(`  bridgeTemplates: ${manifest.bridgeTemplates.length} items`);
  console.log(`  safeScaffolds: ${manifest.safeScaffolds.length} items`);
  assert(manifest.copyCore.length === 31, 'Expected 31 copy-core items');
  assert(manifest.templateSources.length === 25, 'Expected 25 template items');
  assert(manifest.bridgeTemplates.length === 5, 'Expected 5 bridge templates');
  assert(manifest.safeScaffolds.length === 6, 'Expected 6 safe scaffolds');
  assert(manifest.meta.vaultRoot === TARGET_VAULT, 'Expected vaultRoot in manifest.meta');
} catch (err) {
  console.error('✗ Manifest build failed:', err.message);
  process.exit(1);
}

async function runPipeline() {
  // --- Core copy ---
  try {
    const copyReport = await copyCore(manifest);
    console.log(`\n✓ Core copy: ${copyReport.written.length} written, ${copyReport.errors.length} errors`);
    assert(copyReport.written.length === 31, 'Expected 31 files written by core copier');
    assert(copyReport.errors.length === 0, 'Expected 0 errors from core copier');
  } catch (err) {
    console.error('✗ Core copy failed:', err.message);
    process.exit(1);
  }

  // --- Template placement ---
  try {
    const templateReport = await placeTemplates(manifest);
    console.log(`\n✓ Template placement: ${templateReport.written.length} written`);
    assert(templateReport.written.length > 0, 'Expected templates to be written');
  } catch (err) {
    console.error('✗ Template placement failed:', err.message);
    process.exit(1);
  }

  // --- Scaffold generation ---
  try {
    const scaffoldReport = await generateScaffolds(manifest);
    console.log(`\n✓ Scaffold generation: ${scaffoldReport.written.length} written`);
    assert(scaffoldReport.written.length === 6, 'Expected 6 scaffolds written');
  } catch (err) {
    console.error('✗ Scaffold generation failed:', err.message);
    process.exit(1);
  }

  // --- Validation ---
  try {
    const result = validateInstallerOutput(manifest);
    console.log(`\n=== VALIDATION RESULT ===`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failures: ${result.summary.failures}, Warnings: ${result.summary.warnings}, Checks: ${result.summary.checks}`);

    for (const [name, checkpoint] of Object.entries(result.checkpoints)) {
      const status = checkpoint.passed ? '✓' : '✗';
      const findCount = checkpoint.findings ? checkpoint.findings.length : 0;
      console.log(`  ${status} ${name} (${findCount} findings)`);
    }

    if (result.findings.length > 0) {
      console.log('\nFindings:');
      for (const f of result.findings) {
        console.log(`  [${f.severity}] ${f.checkpoint}: ${f.message}`);
      }
    }

    assert(result.passed, 'Validation should pass on happy path');
    assert(result.checkpoints.A_structural_presence.passed, 'Checkpoint A should pass');
    assert(result.checkpoints.B_forbidden_residue.passed, 'Checkpoint B should pass');
    assert(result.checkpoints.C_forbidden_artifacts.passed, 'Checkpoint C should pass');
    assert(result.checkpoints.D_no_owner_generation.passed, 'Checkpoint D should pass');
    assert(result.checkpoints.E_runtime_gating.passed, 'Checkpoint E should pass');
  } catch (err) {
    console.error('✗ Validation failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// TEST 2: Negative tests (Fix 9)
// ---------------------------------------------------------------------------
async function runNegativeTests() {
  console.log('\n=== TEST 2: Negative tests ===\n');

  // --- 2a. Unknown runtime rejection ---
  console.log('2a. Unknown runtime rejection');
  try {
    normalizeRuntimeSelection(['Codex', 'InvalidRuntime']);
    assert(false, 'Should throw on unknown runtime');
  } catch (err) {
    assert(err.message.includes('unknown runtime'), 'Error should mention unknown runtime');
    console.log('  ✓ Unknown runtime rejected');
  }

  // --- 2b. Duplicate runtime collapse ---
  console.log('2b. Duplicate runtime collapse');
  {
    const sel = normalizeRuntimeSelection(['Codex', 'Codex', 'Claude']);
    assert(sel.enabledList.length === 2, 'Duplicate runtimes should be collapsed');
    assert(sel.count === 2, 'Count should reflect deduplicated list');
    console.log('  ✓ Duplicates collapsed');
  }

  // --- 2c. Missing-core failure (core_copier) ---
  console.log('2c. Missing-core failure');
  {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'missing-core-'));
    try {
      const fakeCoreManifest = {
        copyCore: [
          { id: 'test_missing', source: path.join(tempDir, 'nonexistent.md'), target: path.join(tempDir, 'out.md'), treatment: 'copy-core' }
        ]
      };
      await copyCore(fakeCoreManifest);
      assert(false, 'Should throw on missing source');
    } catch (err) {
      assert(err.message.includes('source file does not exist'), 'Error should mention missing source');
      console.log('  ✓ Missing source throws');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  // --- 2d. Missing-template failure (template_placer) ---
  console.log('2d. Missing-template failure');
  {
    const fakeTemplateManifest = {
      templateSources: [
        { id: 'test_missing_tmpl', source: '/tmp/nonexistent_tmpl.md', target: '/tmp/out_tmpl.md', treatment: 'rewrite-template' }
      ],
      bridgeTemplates: []
    };
    const report = await placeTemplates(fakeTemplateManifest);
    assert(report.skipped.length === 1, 'Missing template source should be skipped');
    assert(report.skipped[0].reason.includes('not found'), 'Skip reason should mention not found');
    console.log('  ✓ Missing template skipped');
  }

  // --- 2e. Forbidden-path failure (validator) ---
  console.log('2e. Forbidden-path failure');
  {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forbidden-'));
    const forbiddenFile = path.join(tempDir, 'test.md');
    fs.writeFileSync(forbiddenFile, 'Contains /Users/viktorsl/ reference');
    const fakeManifest = {
      meta: { vaultRoot: tempDir },
      copyCore: [],
      templateSources: [],
      bridgeTemplates: [],
      safeScaffolds: [],
      validationTargets: {
        expectedCorePaths: [forbiddenFile],
        expectedTemplatePaths: [],
        expectedBridgePaths: [],
        expectedScaffoldPaths: [],
        forbiddenStrings: ['/Users/viktorsl/'],
        forbiddenFiles: [],
      }
    };
    const result = validateInstallerOutput(fakeManifest);
    assert(!result.passed, 'Validation should fail with forbidden string');
    assert(result.checkpoints.B_forbidden_residue.passed === false, 'Checkpoint B should fail');
    console.log('  ✓ Forbidden string detected');
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // --- 2f. Copied-auth failure (validator) ---
  console.log('2f. Copied-auth failure');
  {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-'));
    const authFile = path.join(tempDir, '.claude', 'auth.json');
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, '{}');
    const fakeManifest = {
      meta: { vaultRoot: tempDir },
      copyCore: [],
      templateSources: [],
      bridgeTemplates: [{ target: authFile, runtime: 'Claude' }],
      safeScaffolds: [],
      validationTargets: {
        expectedCorePaths: [],
        expectedTemplatePaths: [],
        expectedBridgePaths: [authFile],
        expectedScaffoldPaths: [],
        forbiddenStrings: [],
        forbiddenFiles: ['auth.json'],
      }
    };
    const result = validateInstallerOutput(fakeManifest);
    assert(!result.checkpoints.C_forbidden_artifacts.passed, 'Checkpoint C should fail on auth.json');
    console.log('  ✓ Auth artifact detected');
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // --- 2g. Runtime gating: disabled runtime produces no output ---
  console.log('2g. Runtime gating: disabled runtime produces no output');
  {
    const tempDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'gating-'));
    const inputsGated = {
      selected_runtimes: ['Claude'],
      target_install_root: path.join(tempDir2, 'vault'),
      home_root: tempDir2,
      vault_location: path.join(tempDir2, 'vault'),
      workspace_root: path.join(tempDir2, 'workspace'),
      source_doctrine_root: SOURCE_DOCTRINE,
      template_source_root: TEMPLATE_SOURCE,
      manifest_path: MANIFEST_PATH,
    };
    const gatedManifest = buildInstallerManifest(inputsGated);
    assert(gatedManifest.bridgeTemplates.length === 1, 'Only Claude bridge should be present');
    assert(gatedManifest.bridgeTemplates[0].runtime === 'Claude', 'Bridge should be Claude');
    assert(gatedManifest.safeScaffolds.length === 1, 'Claude-only produces 1 scaffold (config_claude_settings)');
    console.log('  ✓ Disabled runtimes produce no output');
    fs.rmSync(tempDir2, { recursive: true, force: true });
  }

  // --- 2h. Idempotence rerun (core_copier) ---
  console.log('2h. Idempotence rerun');
  {
    const tempDir3 = fs.mkdtempSync(path.join(os.tmpdir(), 'idempotent-'));
    const src = path.join(tempDir3, 'src', 'test.md');
    const tgt = path.join(tempDir3, 'tgt', 'test.md');
    fs.mkdirSync(path.dirname(src), { recursive: true });
    fs.writeFileSync(src, '# Test content');
    const idempotentManifest = {
      copyCore: [{ id: 'test_idem', source: src, target: tgt, treatment: 'copy-core' }]
    };
    const r1 = await copyCore(idempotentManifest);
    const r2 = await copyCore(idempotentManifest);
    assert(r1.written.length === 1 && r2.written.length === 1, 'Both runs should write 1 file');
    assert(fs.readFileSync(tgt, 'utf8') === '# Test content', 'Content should be correct after rerun');
    console.log('  ✓ Idempotent rerun succeeds');
    fs.rmSync(tempDir3, { recursive: true, force: true });
  }

  // --- 2i. Checkpoint D fails on rendered owner files ---
  console.log('2i. Checkpoint D fails on rendered owner files');
  {
    const tempDir4 = fs.mkdtempSync(path.join(os.tmpdir(), 'ownerfail-'));
    const identityPath = path.join(tempDir4, 'operator', 'identity.md');
    fs.mkdirSync(path.dirname(identityPath), { recursive: true });
    fs.writeFileSync(identityPath, '# John Doe\nThis is a rendered owner identity file with no template markers.');
    const fakeManifest = {
      meta: { vaultRoot: tempDir4 },
      copyCore: [{ target: path.join(tempDir4, 'BOOT.md') }],
      templateSources: [{ target: path.join(tempDir4, 'something.md') }],
      bridgeTemplates: [],
      safeScaffolds: [],
      validationTargets: {
        expectedCorePaths: [],
        expectedTemplatePaths: [],
        expectedBridgePaths: [],
        expectedScaffoldPaths: [],
        forbiddenStrings: [],
        forbiddenFiles: [],
      }
    };
    const result = validateInstallerOutput(fakeManifest);
    assert(!result.checkpoints.D_no_owner_generation.passed, 'Checkpoint D should FAIL on rendered owner file');
    assert(result.checkpoints.D_no_owner_generation.findings.some(f => f.severity === 'fail'), 'Should have a fail finding');
    console.log('  ✓ Checkpoint D fails on rendered owner files');
    fs.rmSync(tempDir4, { recursive: true, force: true });
  }

  // --- 2j. Read-only assertion: validator does not mutate install tree ---
  console.log('2j. Validator read-only assertion');
  {
    // Take a snapshot of all files in the install tree before validation
    function collectFiles(dir) {
      const files = {};
      if (!fs.existsSync(dir)) return files;
      const entries = fs.readdirSync(dir, { recursive: true });
      for (const entry of entries) {
        const full = path.join(dir, entry);
        try {
          const stat = fs.statSync(full);
          if (stat.isFile()) {
            files[full] = { size: stat.size, mtime: stat.mtimeMs };
          }
        } catch (_) { /* skip */ }
      }
      return files;
    }
    const beforeVault = collectFiles(TARGET_VAULT);
    const beforeHome = collectFiles(TARGET_HOME);
    validateInstallerOutput(manifest);
    const afterVault = collectFiles(TARGET_VAULT);
    const afterHome = collectFiles(TARGET_HOME);
    assert(
      JSON.stringify(beforeVault) === JSON.stringify(afterVault),
      'Vault should not be mutated by validator'
    );
    assert(
      JSON.stringify(beforeHome) === JSON.stringify(afterHome),
      'Home should not be mutated by validator'
    );
    console.log('  ✓ Validator is read-only');
  }
}

// ---------------------------------------------------------------------------
// TEST 3: Canonical manifest comparison (Fix 10)
// ---------------------------------------------------------------------------
function runCanonicalComparisonTest() {
  console.log('\n=== TEST 3: Canonical manifest comparison ===\n');

  const CANONICAL_PATH = path.resolve(
    os.homedir(),
    'VIK/ObsidianVault/VIK_OS/initiatives/operator-system/installer-v1-manifest.json'
  );

  if (!fs.existsSync(CANONICAL_PATH)) {
    console.log('  SKIP: canonical manifest not found at', CANONICAL_PATH);
    return;
  }

  const canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
  const implMatrix = loadFileMatrix(MANIFEST_PATH);

  // Extract all file entries from canonical (skip _section headers)
  const canonicalEntries = canonical.files.filter((f) => f.path && !f._section);

  console.log(`  Canonical entries: ${canonicalEntries.length}`);
  console.log(`  Implementation surfaces: ${implMatrix.surfaces.length}`);

  // Check every canonical surface has a matching entry
  const missingPaths = [];
  const treatmentMismatches = [];

  for (const entry of canonicalEntries) {
    // Find matching surface in implementation manifest by path
    const implSurface = implMatrix.surfaces.find((s) => s.path === entry.path);

    if (!implSurface) {
      missingPaths.push(entry.path);
      continue;
    }

    if (implSurface.treatment !== entry.treatment) {
      treatmentMismatches.push({
        path: entry.path,
        canonical: entry.treatment,
        implementation: implSurface.treatment,
      });
    }
  }

  if (missingPaths.length > 0) {
    console.log(`\n  Missing paths (${missingPaths.length}):`);
    for (const p of missingPaths.slice(0, 10)) {
      console.log(`    - ${p}`);
    }
    if (missingPaths.length > 10) {
      console.log(`    ... and ${missingPaths.length - 10} more`);
    }
  }

  if (treatmentMismatches.length > 0) {
    console.log(`\n  Treatment mismatches (${treatmentMismatches.length}):`);
    for (const m of treatmentMismatches) {
      console.log(`    ${m.path}: canonical=${m.canonical} impl=${m.implementation}`);
    }
  }

  assert(missingPaths.length === 0, `All canonical paths should be in implementation manifest (missing: ${missingPaths.length})`);
  assert(treatmentMismatches.length === 0, `All treatments should match canonical (mismatches: ${treatmentMismatches.length})`);

  if (missingPaths.length === 0 && treatmentMismatches.length === 0) {
    console.log('  ✓ All canonical surfaces present with matching treatments');
  }
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
runPipeline()
  .then(() => runNegativeTests())
  .then(() => {
    runCanonicalComparisonTest();

    // Final summary
    console.log(`\n=== SUMMARY ===`);
    console.log(`Passed: ${passed}, Failed: ${failed}`);

    // Cleanup
    fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
    console.log('Temp directory cleaned up.');

    if (failed > 0) {
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Pipeline failed:', err);
    fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
    process.exit(1);
  });
