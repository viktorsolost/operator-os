'use strict';

const fs   = require('fs');
const path = require('path');

const { ALLOWED_RUNTIMES } = require('../shared/runtime_selector');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return true if a path exists on the filesystem (file or directory).
 * @param {string} p
 * @returns {boolean}
 */
function pathExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Read a file's contents as a UTF-8 string.
 * Returns null if the file cannot be read (binary, permission error, etc.).
 * @param {string} filePath
 * @returns {string|null}
 */
function readFileText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return null;
  }
}

/**
 * Recursively collect all file paths under a directory.
 * Silently skips entries that cannot be read (permission errors, broken symlinks).
 * @param {string} dir
 * @returns {string[]}
 */
function walkDir(dir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (_) {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (_) {
      continue;
    }
    if (stat.isDirectory()) {
      const sub = walkDir(full);
      for (const s of sub) results.push(s);
    } else {
      results.push(full);
    }
  }
  return results;
}

/**
 * Build a finding record.
 * @param {string} checkpoint  - e.g. 'A'
 * @param {'fail'|'warning'} severity
 * @param {string} message
 * @returns {object}
 */
function finding(checkpoint, severity, message) {
  return { checkpoint, severity, message };
}

// ---------------------------------------------------------------------------
// Checkpoint A — Structural presence
// ---------------------------------------------------------------------------

/**
 * Check that every expected path exists on disk.
 * @param {object} validationTargets
 * @returns {{ passed: boolean, findings: object[] }}
 */
function checkA_structuralPresence(validationTargets) {
  const findings = [];

  const groups = [
    { label: 'core',     paths: validationTargets.expectedCorePaths },
    { label: 'template', paths: validationTargets.expectedTemplatePaths },
    { label: 'bridge',   paths: validationTargets.expectedBridgePaths },
    { label: 'scaffold', paths: validationTargets.expectedScaffoldPaths },
  ];

  for (const { label, paths } of groups) {
    for (const p of paths) {
      if (!pathExists(p)) {
        findings.push(
          finding('A', 'fail', `Missing ${label} path: ${p}`)
        );
      }
    }
  }

  return {
    passed: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}

// ---------------------------------------------------------------------------
// Checkpoint B — Forbidden source-machine residue
// ---------------------------------------------------------------------------

/**
 * Read every installer-written file and scan for forbidden strings.
 * Only checks paths that actually exist (structural failures are A's concern).
 * @param {object} validationTargets
 * @returns {{ passed: boolean, findings: object[] }}
 */
function checkB_forbiddenResidue(validationTargets) {
  const findings = [];

  // Union of all expected paths that exist and are regular files
  const allExpectedPaths = [
    ...validationTargets.expectedCorePaths,
    ...validationTargets.expectedTemplatePaths,
    ...validationTargets.expectedBridgePaths,
    ...validationTargets.expectedScaffoldPaths,
  ];

  const filesToCheck = [];
  for (const p of allExpectedPaths) {
    if (!pathExists(p)) continue;
    let stat;
    try {
      stat = fs.statSync(p);
    } catch (_) {
      continue;
    }
    if (stat.isFile()) {
      filesToCheck.push(p);
    }
  }

  for (const filePath of filesToCheck) {
    const contents = readFileText(filePath);
    if (contents === null) continue; // skip unreadable / binary files

    for (const forbidden of validationTargets.forbiddenStrings) {
      if (contents.includes(forbidden)) {
        findings.push(
          finding(
            'B',
            'fail',
            `Forbidden string "${forbidden}" found in installer-written file: ${filePath}`
          )
        );
      }
    }
  }

  return {
    passed: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}

// ---------------------------------------------------------------------------
// Checkpoint C — Forbidden auth/device artifacts
// ---------------------------------------------------------------------------

/**
 * Walk all runtime roots (plus vault root) and detect forbidden artifact
 * names.  Matches both files named exactly and directories whose last segment
 * matches a forbidden pattern (e.g. 'credentials/').
 *
 * @param {object} manifest
 * @returns {{ passed: boolean, findings: object[] }}
 */
function checkC_forbiddenArtifacts(manifest) {
  const findings = [];
  const { validationTargets } = manifest;

  // Collect install tree roots to walk:
  // - runtime roots for all sections that carry a `runtime` field
  // - vault root derived from core/template paths (first path's ancestor that
  //   we can infer from the manifest sections)
  // We build the set by collecting every distinct runtime root from the
  // manifest sections, plus try to derive vault root from templateSources /
  // copyCore items whose target paths live under a common prefix.

  const rootsToWalk = new Set();

  // Runtime roots: iterate bridge + scaffold items (they carry runtime key
  // and we can look up roots from path_resolver structure).
  // Instead of re-importing path_resolver, we simply derive each runtime root
  // as the parent-of-parent of the target file (works for all runtime layouts):
  //   ~/.codex/instructions.md  -> ~/.codex
  //   ~/.claude/CLAUDE.md       -> ~/.claude
  //   ~/.gemini/GEMINI.md       -> ~/.gemini
  //   ~/.openclaw/workspace/START_HERE.md -> ~/.openclaw  (two levels up)
  //   ~/.openclaw/openclaw.json  -> ~/.openclaw

  for (const item of [...(manifest.bridgeTemplates || []), ...(manifest.safeScaffolds || [])]) {
    const targetDir = path.dirname(item.target);
    // Go up until we reach the hidden dir directly under home (starts with '.')
    // We know runtime roots are always exactly one level under home_root
    // (e.g. ~/.codex, ~/.claude).  Walk upward at most 2 levels.
    let candidate = targetDir;
    for (let i = 0; i < 2; i++) {
      const base = path.basename(candidate);
      if (base.startsWith('.')) {
        rootsToWalk.add(candidate);
        break;
      }
      candidate = path.dirname(candidate);
    }
  }

  // Vault root: use manifest.meta.vaultRoot if available, otherwise derive heuristically
  if (manifest.meta && manifest.meta.vaultRoot) {
    rootsToWalk.add(manifest.meta.vaultRoot);
  } else {
    const vaultCandidates = [
      ...(manifest.copyCore       || []),
      ...(manifest.templateSources || []),
    ];
    if (vaultCandidates.length > 0) {
      let candidate = path.dirname(vaultCandidates[0].target);
      while (candidate !== path.dirname(candidate)) {
        const allUnder = vaultCandidates.every((item) =>
          item.target.startsWith(candidate + path.sep) || item.target === candidate
        );
        if (allUnder) {
          rootsToWalk.add(candidate);
          break;
        }
        candidate = path.dirname(candidate);
      }
    }
  }

  if (rootsToWalk.size === 0) {
    // Nothing to walk — not a failure, but nothing to check
    return { passed: true, findings: [] };
  }

  // Normalize forbidden patterns: strip trailing slash for basename comparison
  const forbiddenNames = (validationTargets.forbiddenFiles || []).map((f) =>
    f.endsWith('/') ? f.slice(0, -1) : f
  );

  for (const root of rootsToWalk) {
    if (!pathExists(root)) continue;

    // Walk recursively — check files AND directories
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch (_) {
      continue;
    }

    // BFS walk
    const queue = [{ dir: root, dirEntries: entries }];
    while (queue.length > 0) {
      const { dir, dirEntries } = queue.shift();
      for (const entry of dirEntries) {
        const entryPath = path.join(dir, entry.name);
        if (forbiddenNames.includes(entry.name)) {
          findings.push(
            finding(
              'C',
              'fail',
              `Forbidden artifact "${entry.name}" found at: ${entryPath}`
            )
          );
        }
        if (entry.isDirectory()) {
          let subEntries;
          try {
            subEntries = fs.readdirSync(entryPath, { withFileTypes: true });
          } catch (_) {
            continue;
          }
          queue.push({ dir: entryPath, dirEntries: subEntries });
        }
      }
    }
  }

  return {
    passed: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}

// ---------------------------------------------------------------------------
// Checkpoint D — No owner-specific generation
// ---------------------------------------------------------------------------

/**
 * These onboarding-owned files must NOT exist yet, or if they exist they must
 * contain `{{` template markers (meaning they are still in template form).
 * A file that exists but has no template markers is flagged as a WARNING.
 *
 * We check:
 *   - operator/identity.md under vault root
 *   - memory.md under vault root
 *   - recent-context.md under vault root
 *
 * We derive the vault root the same way as Checkpoint C.
 *
 * @param {object} manifest
 * @returns {{ passed: boolean, findings: object[] }}
 */
function checkD_noOwnerGeneration(manifest) {
  const findings = [];

  // Use manifest.meta.vaultRoot if available, otherwise derive heuristically
  let vaultRoot;
  if (manifest.meta && manifest.meta.vaultRoot) {
    vaultRoot = manifest.meta.vaultRoot;
  } else {
    const vaultCandidates = [
      ...(manifest.copyCore        || []),
      ...(manifest.templateSources || []),
    ];
    if (vaultCandidates.length === 0) {
      return { passed: true, findings: [] };
    }
    vaultRoot = path.dirname(vaultCandidates[0].target);
    while (vaultRoot !== path.dirname(vaultRoot)) {
      const allUnder = vaultCandidates.every((item) =>
        item.target.startsWith(vaultRoot + path.sep) || item.target === vaultRoot
      );
      if (allUnder) break;
      vaultRoot = path.dirname(vaultRoot);
    }
  }

  const sensitiveFiles = [
    path.join(vaultRoot, 'operator', 'identity.md'),
    path.join(vaultRoot, 'memory.md'),
    path.join(vaultRoot, 'recent-context.md'),
  ];

  for (const filePath of sensitiveFiles) {
    if (!pathExists(filePath)) continue; // does not exist → good

    const contents = readFileText(filePath);
    if (contents === null) {
      // Can't read the file — treat as warning, cannot confirm template state
      findings.push(
        finding(
          'D',
          'warning',
          `Cannot read file to verify template state: ${filePath}`
        )
      );
      continue;
    }

    if (!contents.includes('{{')) {
      findings.push(
        finding(
          'D',
          'fail',
          `File exists without template markers — may be a rendered owner-specific file that should not exist yet: ${filePath}`
        )
      );
    }
    // If it contains '{{' it is still in template form → no finding
  }

  return {
    passed: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}

// ---------------------------------------------------------------------------
// Checkpoint E — Runtime gating
// ---------------------------------------------------------------------------

/**
 * For each enabled runtime: its bridge and scaffold paths must exist.
 * For each disabled runtime: NO bridge or scaffold paths may exist for it.
 *
 * We derive enabled/disabled state from the manifest sections:
 * - Items present in bridgeTemplates / safeScaffolds carry a `runtime` field
 *   and represent enabled runtimes (the manifest builder already filtered to
 *   enabled runtimes when building those sections).
 * - Disabled runtimes are all ALLOWED_RUNTIMES minus those represented in the
 *   manifest sections.
 *
 * For disabled runtimes we check the runtime root directories derived from
 * path_resolver conventions.
 *
 * @param {object} manifest
 * @returns {{ passed: boolean, findings: object[] }}
 */
function checkE_runtimeGating(manifest) {
  const findings = [];

  // Determine which runtimes appear in the manifest (= enabled)
  const enabledRuntimes = new Set();
  for (const item of [...(manifest.bridgeTemplates || []), ...(manifest.safeScaffolds || [])]) {
    if (item.runtime) enabledRuntimes.add(item.runtime);
  }

  // Enabled runtimes: all expected bridge + scaffold targets for that runtime must exist
  for (const runtimeName of enabledRuntimes) {
    const bridgeItems   = (manifest.bridgeTemplates || []).filter((i) => i.runtime === runtimeName);
    const scaffoldItems = (manifest.safeScaffolds    || []).filter((i) => i.runtime === runtimeName);

    for (const item of [...bridgeItems, ...scaffoldItems]) {
      if (!pathExists(item.target)) {
        findings.push(
          finding(
            'E',
            'fail',
            `Enabled runtime "${runtimeName}" is missing expected path: ${item.target}`
          )
        );
      }
    }
  }

  // Disabled runtimes: derive their roots and verify none of their outputs exist
  const disabledRuntimes = ALLOWED_RUNTIMES.filter((r) => !enabledRuntimes.has(r));

  // We need the home_root to build disabled runtime roots. Derive it from any
  // enabled runtime's target path by looking at the bridge/scaffold items.
  // If there are no enabled runtimes, we cannot derive home_root — skip.
  let homeRoot = null;
  const allRuntimeItems = [...(manifest.bridgeTemplates || []), ...(manifest.safeScaffolds || [])];
  if (allRuntimeItems.length > 0) {
    // Walk up from a known target to find the home root (the directory
    // containing the hidden runtime dir, e.g. ~/.codex -> ~)
    let candidate = path.dirname(allRuntimeItems[0].target);
    for (let i = 0; i < 3; i++) {
      const base = path.basename(candidate);
      if (base.startsWith('.')) {
        // candidate is the runtime root (e.g. ~/.codex); parent is home
        homeRoot = path.dirname(candidate);
        break;
      }
      candidate = path.dirname(candidate);
    }
  }

  if (homeRoot !== null) {
    // Runtime root conventions (mirrors path_resolver)
    const runtimeRootByName = {
      Codex:    path.join(homeRoot, '.codex'),
      Claude:   path.join(homeRoot, '.claude'),
      Gemini:   path.join(homeRoot, '.gemini'),
      OpenClaw: path.join(homeRoot, '.openclaw'),
    };

    for (const runtimeName of disabledRuntimes) {
      const runtimeRoot = runtimeRootByName[runtimeName];
      if (!runtimeRoot) continue;

      // Collect any bridge or scaffold paths that would belong to this runtime
      // by checking if they fall under the runtime root.
      // Since the manifest builder excluded disabled runtimes, such paths
      // should simply not exist. But if they do, that is a failure.
      const allExpectedPaths = [
        ...(manifest.validationTargets.expectedBridgePaths  || []),
        ...(manifest.validationTargets.expectedScaffoldPaths || []),
      ];
      for (const p of allExpectedPaths) {
        if (p.startsWith(runtimeRoot + path.sep) || p === runtimeRoot) {
          if (pathExists(p)) {
            findings.push(
              finding(
                'E',
                'fail',
                `Disabled runtime "${runtimeName}" has an installer output at: ${p}`
              )
            );
          }
        }
      }
    }
  }

  return {
    passed: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Validate that the installer produced a scaffold-ready tree.
 * This is the final gate for Slice 1.
 *
 * @param {object} manifest - Full installer manifest (contains validationTargets
 *   and all section data: copyCore, templateSources, bridgeTemplates, safeScaffolds).
 * @returns {{
 *   passed: boolean,
 *   summary: { failures: number, warnings: number, checks: number },
 *   checkpoints: {
 *     A_structural_presence: { passed: boolean, findings: object[] },
 *     B_forbidden_residue:   { passed: boolean, findings: object[] },
 *     C_forbidden_artifacts: { passed: boolean, findings: object[] },
 *     D_no_owner_generation: { passed: boolean, findings: object[] },
 *     E_runtime_gating:      { passed: boolean, findings: object[] },
 *   },
 *   findings: object[],
 * }}
 */
function validateInstallerOutput(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('validateInstallerOutput: manifest must be a non-null object');
  }
  if (!manifest.validationTargets || typeof manifest.validationTargets !== 'object') {
    throw new Error('validateInstallerOutput: manifest.validationTargets is missing or not an object');
  }

  const checkpoints = {
    A_structural_presence: checkA_structuralPresence(manifest.validationTargets),
    B_forbidden_residue:   checkB_forbiddenResidue(manifest.validationTargets),
    C_forbidden_artifacts: checkC_forbiddenArtifacts(manifest),
    D_no_owner_generation: checkD_noOwnerGeneration(manifest),
    E_runtime_gating:      checkE_runtimeGating(manifest),
  };

  // Flatten all findings into a single ordered list
  const allFindings = [
    ...checkpoints.A_structural_presence.findings,
    ...checkpoints.B_forbidden_residue.findings,
    ...checkpoints.C_forbidden_artifacts.findings,
    ...checkpoints.D_no_owner_generation.findings,
    ...checkpoints.E_runtime_gating.findings,
  ];

  const failures = allFindings.filter((f) => f.severity === 'fail').length;
  const warnings = allFindings.filter((f) => f.severity === 'warning').length;

  // Total checks = number of checkpoints
  const checks = Object.keys(checkpoints).length;

  const passed = failures === 0;

  return {
    passed,
    summary: { failures, warnings, checks },
    checkpoints,
    findings: allFindings,
  };
}

module.exports = { validateInstallerOutput };
