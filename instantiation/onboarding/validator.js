'use strict';

const fs = require('fs');
const path = require('path');
const { isRuntimeEnabled, getEnabledRuntimes, ALLOWED_RUNTIMES } = require('../shared/runtime_selector');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fileExists(p) { return fs.existsSync(p); }

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; }
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

// ---------------------------------------------------------------------------
// Checkpoint A: Completeness
// ---------------------------------------------------------------------------
function checkCompleteness(installerManifest, targetInstallRoot, packet) {
  const findings = [];

  // Check vault template sources were rendered
  for (const item of (installerManifest.templateSources || [])) {
    if (!fileExists(item.target)) {
      findings.push({ severity: 'fail', message: `Missing rendered template: ${item.target} (${item.id})` });
    }
  }

  // Check bridge templates were rendered (only for selected runtimes)
  for (const item of (installerManifest.bridgeTemplates || [])) {
    if (!fileExists(item.target)) {
      findings.push({ severity: 'fail', message: `Missing rendered bridge: ${item.target} (${item.id})` });
    }
  }

  // Check vault generate-fresh surfaces exist
  const freshPaths = [
    'memory.md', 'recent-context.md', 'operator/identity.md',
    'operator/reminders.md', 'operator/claudia-memory.md', 'brands/registry.md',
  ];
  for (const rel of freshPaths) {
    const full = path.join(targetInstallRoot, rel);
    if (!fileExists(full)) {
      findings.push({ severity: 'fail', message: `Missing generate-fresh surface: ${rel}` });
    }
  }

  // Check runtime config surfaces (only selected runtimes)
  for (const item of (installerManifest.safeScaffolds || [])) {
    if (!fileExists(item.target)) {
      findings.push({ severity: 'fail', message: `Missing runtime config: ${item.target} (${item.id})` });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Checkpoint B: No Viktor residue
// ---------------------------------------------------------------------------
function checkNoViktorResidue(targetInstallRoot, homeRoot) {
  const findings = [];
  const forbidden = ['Viktor', 'viktorsl', '/Users/viktorsl', 'VIK OS', '~/VIK/ObsidianVault/VIK_OS', '~/VIK/Coding/Memento'];
  const allFiles = [
    ...walkDir(targetInstallRoot),
    ...walkDir(path.join(homeRoot, '.claude')),
    ...walkDir(path.join(homeRoot, '.gemini')),
    ...walkDir(path.join(homeRoot, '.codex')),
    ...walkDir(path.join(homeRoot, '.openclaw')),
  ];

  for (const filePath of allFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    for (const term of forbidden) {
      if (content.includes(term)) {
        findings.push({ severity: 'fail', message: `Viktor residue "${term}" found in ${filePath}` });
      }
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Checkpoint C: Path integrity
// ---------------------------------------------------------------------------
function checkPathIntegrity(targetInstallRoot, homeRoot, packet) {
  const findings = [];
  const allFiles = [
    ...walkDir(targetInstallRoot),
    ...walkDir(path.join(homeRoot, '.claude')),
    ...walkDir(path.join(homeRoot, '.gemini')),
    ...walkDir(path.join(homeRoot, '.codex')),
    ...walkDir(path.join(homeRoot, '.openclaw')),
  ];

  let ownerPathFound = false;
  const viktorPaths = ['/Users/viktorsl/', '/Volumes/BackBone/'];

  for (const filePath of allFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    if (content.includes(packet.vault_location) || content.includes(packet.home_root)) {
      ownerPathFound = true;
    }
    for (const vp of viktorPaths) {
      if (content.includes(vp)) {
        findings.push({ severity: 'fail', message: `Source-machine path "${vp}" found in ${filePath}` });
      }
    }
  }

  if (!ownerPathFound) {
    findings.push({ severity: 'fail', message: 'No owner paths found in any generated file' });
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Checkpoint D: Boot chain integrity
// ---------------------------------------------------------------------------
function checkBootChain(targetInstallRoot) {
  const findings = [];

  const bootPath = path.join(targetInstallRoot, 'BOOT.md');
  const routingPath = path.join(targetInstallRoot, 'ROUTING.md');

  if (!fileExists(bootPath)) {
    findings.push({ severity: 'fail', message: 'BOOT.md does not exist' });
    return { passed: false, findings };
  }

  const bootContent = readFile(bootPath);
  if (!bootContent.includes('ROUTING.md')) {
    findings.push({ severity: 'fail', message: 'BOOT.md does not reference ROUTING.md' });
  }

  if (!fileExists(routingPath)) {
    findings.push({ severity: 'fail', message: 'ROUTING.md does not exist' });
    return { passed: findings.length === 0, findings };
  }

  const routingContent = readFile(routingPath);

  // Check that operator files referenced in ROUTING.md exist
  const operatorRefs = ['operator/anton.md', 'operator/claudia.md', 'operator/jonah.md', 'operator/vera.md', 'operator/lev.md'];
  for (const ref of operatorRefs) {
    const refPath = path.join(targetInstallRoot, ref);
    if (!fileExists(refPath)) {
      findings.push({ severity: 'fail', message: `Operator file referenced in boot chain missing: ${ref}` });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Checkpoint E: Functional content
// ---------------------------------------------------------------------------
function checkFunctionalContent(targetInstallRoot, packet, installerManifest) {
  const findings = [];

  // memory.md checks
  const memoryPath = path.join(targetInstallRoot, 'memory.md');
  const memoryContent = readFile(memoryPath);
  if (!memoryContent) {
    findings.push({ severity: 'fail', message: 'memory.md is missing or unreadable' });
  } else {
    const requiredSections = ['Boot Sequence', 'Communication Style', 'Operator Hierarchy', 'Operator Invocation Rule'];
    for (const section of requiredSections) {
      if (!memoryContent.includes(section)) {
        findings.push({ severity: 'fail', message: `memory.md missing required section: "${section}"` });
      }
    }
  }

  // identity.md checks
  const identityPath = path.join(targetInstallRoot, 'operator', 'identity.md');
  const identityContent = readFile(identityPath);
  if (!identityContent) {
    findings.push({ severity: 'fail', message: 'identity.md is missing or unreadable' });
  } else {
    const requiredSections = ['Role', 'Business Context', 'Day to Day', 'Weekly Success'];
    for (const section of requiredSections) {
      if (!identityContent.includes(section)) {
        findings.push({ severity: 'fail', message: `identity.md missing required section: "${section}"` });
      }
    }
    if (!identityContent.includes(packet.owner_name)) {
      findings.push({ severity: 'fail', message: 'identity.md does not contain owner name' });
    }
  }

  // At least one runtime bridge exists
  const hasBridge = (installerManifest.bridgeTemplates || []).some(b => fileExists(b.target));
  if (!hasBridge) {
    findings.push({ severity: 'fail', message: 'No runtime bridge files found' });
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Checkpoint F: Template cleanliness
// ---------------------------------------------------------------------------
function checkTemplateCleanliness(targetInstallRoot, homeRoot) {
  const findings = [];
  const allFiles = [
    ...walkDir(targetInstallRoot),
    ...walkDir(path.join(homeRoot, '.claude')),
    ...walkDir(path.join(homeRoot, '.gemini')),
    ...walkDir(path.join(homeRoot, '.codex')),
    ...walkDir(path.join(homeRoot, '.openclaw')),
  ];

  for (const filePath of allFiles) {
    const content = readFile(filePath);
    if (!content) continue;
    const markers = content.match(/\{\{[^}]+\}\}/g);
    if (markers) {
      findings.push({ severity: 'fail', message: `Unresolved template markers in ${filePath}: ${markers.join(', ')}` });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Checkpoint G: Runtime gating
// ---------------------------------------------------------------------------
function checkRuntimeGating(homeRoot, packet) {
  const findings = [];

  const runtimeDirs = {
    Codex: path.join(homeRoot, '.codex'),
    Claude: path.join(homeRoot, '.claude'),
    Gemini: path.join(homeRoot, '.gemini'),
    OpenClaw: path.join(homeRoot, '.openclaw'),
  };

  for (const [runtime, dir] of Object.entries(runtimeDirs)) {
    const enabled = isRuntimeEnabled(packet.runtimeSelection, runtime);
    const dirFiles = walkDir(dir);
    if (!enabled && dirFiles.length > 0) {
      findings.push({ severity: 'fail', message: `Disabled runtime "${runtime}" has files at ${dir}` });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

// ---------------------------------------------------------------------------
// Main validation entry point
// ---------------------------------------------------------------------------
function validateOnboardingOutput(installerManifest, packet, targetInstallRoot, homeRoot) {
  const checkpoints = {
    A_completeness: checkCompleteness(installerManifest, targetInstallRoot, packet),
    B_no_viktor_residue: checkNoViktorResidue(targetInstallRoot, homeRoot),
    C_path_integrity: checkPathIntegrity(targetInstallRoot, homeRoot, packet),
    D_boot_chain: checkBootChain(targetInstallRoot),
    E_functional_content: checkFunctionalContent(targetInstallRoot, packet, installerManifest),
    F_template_cleanliness: checkTemplateCleanliness(targetInstallRoot, homeRoot),
    G_runtime_gating: checkRuntimeGating(homeRoot, packet),
  };

  const allFindings = [];
  let allPassed = true;
  for (const [name, checkpoint] of Object.entries(checkpoints)) {
    checkpoint.findings.forEach(f => { f.checkpoint = name; allFindings.push(f); });
    if (!checkpoint.passed) allPassed = false;
  }

  return {
    passed: allPassed,
    checkpoints,
    findings: allFindings,
    summary: {
      checks: Object.keys(checkpoints).length,
      failures: allFindings.filter(f => f.severity === 'fail').length,
      warnings: allFindings.filter(f => f.severity === 'warn').length,
    },
  };
}

module.exports = { validateOnboardingOutput };
