'use strict';

const path = require('path');

const { normalizeRuntimeSelection, isRuntimeEnabled } = require('../shared/runtime_selector');
const { resolveInstallerPaths } = require('../shared/path_resolver');
const { loadFileMatrix } = require('../shared/file_matrix');

// ---------------------------------------------------------------------------
// Template source maps — surface ID → relative path under template_source_root
// ---------------------------------------------------------------------------

// bridge_claude is excluded — CLAUDE.md at vault root is handled by the
// claude_md rewrite-template entry (rendered by source_renderer), not here.
// OpenClaw is deferred — no bridge entries for it.
const BRIDGE_TEMPLATE_MAP = Object.freeze({
  bridge_codex:  'runtime-bridges/codex/AGENTS.md.tmpl',
  bridge_gemini: 'runtime-bridges/gemini/GEMINI.md.tmpl',
});

// No global config scaffolds — all scaffold entries are now excluded.
const SCAFFOLD_TEMPLATE_MAP = Object.freeze({});

// Surface IDs that have a dedicated .tmpl file under template_source_root/
const OPERATOR_TEMPLATE_MAP = Object.freeze({
  operator_identity: 'operator/identity.md.tmpl',
  structure_md:      'system/STRUCTURE.md.tmpl',
});

// ---------------------------------------------------------------------------
// Surface ID → runtime pathMap key
// ---------------------------------------------------------------------------

const BRIDGE_PATH_KEY_MAP = Object.freeze({
  bridge_codex:  { runtime: 'Codex',  key: 'bridge' },
  bridge_gemini: { runtime: 'Gemini', key: 'bridge' },
});

// No scaffold path keys — scaffolds are excluded.
const SCAFFOLD_PATH_KEY_MAP = Object.freeze({});

// ---------------------------------------------------------------------------
// Vault surface → resolved target path
//
// Vault surfaces have a location of 'vault'. We derive the target path by
// joining pathMap.vault.root with surface.path for the general case, but use
// the specific named keys from path_resolver where they exist (to match
// exactly what the resolver builds).
// ---------------------------------------------------------------------------

// Surface IDs that map to a specific named key on pathMap.vault
const VAULT_NAMED_KEY_MAP = Object.freeze({
  boot_md:          'boot',
  routing_md:       'routing',
  structure_md:     'structure',
  templates_dir:    'templates',
  domains_dir:      'domains',
  project_types_dir:'projectTypes',
  brand_operators_dir: null, // handled below — brands/operators/
  operator_identity:'identity',
  // brand files: handled via vault.root + surface.path fallback
});

/**
 * Resolve the target path for a vault-located surface.
 *
 * @param {object} surface
 * @param {object} pathMap - frozen pathMap from resolveInstallerPaths
 * @returns {string}
 */
function resolveVaultTarget(surface, pathMap) {
  const vaultNamedKey = VAULT_NAMED_KEY_MAP[surface.id];

  // Explicit named key — use it directly
  if (vaultNamedKey !== undefined && vaultNamedKey !== null) {
    return pathMap.vault[vaultNamedKey];
  }

  // brand_operators_dir is a special case — not a named key on vault but
  // lives under brands/
  if (surface.id === 'brand_operators_dir') {
    return path.join(pathMap.vault.brands, 'operators');
  }

  // General fallback: vault.root + surface.path (strips leading ~/ if present)
  const relativePath = surface.path.replace(/^~\//, '');
  return path.join(pathMap.vault.root, relativePath);
}

// ---------------------------------------------------------------------------
// Template source resolver for vault-located template surfaces
// ---------------------------------------------------------------------------

/**
 * Return the source path for a non-bridge, non-runtime-gated rewrite-template
 * surface. Surfaces with a dedicated .tmpl file get that; all others use the
 * source doctrine file directly (source_doctrine_root + surface.path).
 *
 * @param {object} surface
 * @param {string} template_source_root
 * @param {string} source_doctrine_root
 * @returns {string}
 */
function resolveTemplateSource(surface, template_source_root, source_doctrine_root) {
  const tmplRelPath = OPERATOR_TEMPLATE_MAP[surface.id];
  if (tmplRelPath) {
    return path.join(template_source_root, tmplRelPath);
  }
  // No dedicated template — use source doctrine file as the rewrite source
  return path.join(source_doctrine_root, surface.path);
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

/**
 * Assemble the installer execution manifest.
 *
 * @param {{
 *   selected_runtimes: string[],
 *   target_install_root: string,
 *   home_root: string,
 *   vault_location: string,
 *   workspace_root: string,
 *   source_doctrine_root: string,
 *   template_source_root: string,
 *   manifest_path: string,
 * }} inputs
 * @returns {object} Frozen manifest object
 */
function buildInstallerManifest({
  selected_runtimes,
  target_install_root,
  home_root,
  vault_location,
  workspace_root,
  source_doctrine_root,
  template_source_root,
  manifest_path,
}) {
  // --- 1. Normalize runtime selection ---
  const runtimeSelection = normalizeRuntimeSelection(selected_runtimes);

  // --- 2. Resolve all target paths (path_resolver requires enabled object) ---
  const pathMap = resolveInstallerPaths({
    target_install_root,
    home_root,
    vault_location,
    workspace_root,
    runtimeSelection,
  });

  // --- 3. Load the file matrix ---
  const matrix = loadFileMatrix(manifest_path);

  // --- 4. Build copyCore items ---
  const copyCore = matrix.getInstallerCoreItems().map((surface) => {
    const source = path.join(source_doctrine_root, surface.path);
    const target = resolveVaultTarget(surface, pathMap);
    return Object.freeze({
      id: surface.id,
      source,
      target,
      treatment: 'copy-core',
      owner_phase: 'installer',
    });
  });

  // --- 5. Build templateSources items ---
  const templateSources = matrix.getInstallerTemplateItems().map((surface) => {
    const source = resolveTemplateSource(surface, template_source_root, source_doctrine_root);
    const target = resolveVaultTarget(surface, pathMap);
    return Object.freeze({
      id: surface.id,
      source,
      target,
      treatment: 'rewrite-template',
      owner_phase: 'onboarding',
    });
  });

  // --- 6. Build bridgeTemplates items (runtime-gated, only for enabled runtimes) ---
  const bridgeTemplates = matrix.getInstallerBridgeTemplates()
    .filter((surface) => isRuntimeEnabled(runtimeSelection, surface.runtime))
    .map((surface) => {
      const tmplRelPath = BRIDGE_TEMPLATE_MAP[surface.id];
      if (!tmplRelPath) {
        throw new Error(
          `buildInstallerManifest: no template source mapping for bridge surface "${surface.id}"`
        );
      }
      const source = path.join(template_source_root, tmplRelPath);

      const pathKeyEntry = BRIDGE_PATH_KEY_MAP[surface.id];
      if (!pathKeyEntry) {
        throw new Error(
          `buildInstallerManifest: no path key mapping for bridge surface "${surface.id}"`
        );
      }
      const runtimePaths = pathMap.runtimes[pathKeyEntry.runtime];
      if (!runtimePaths) {
        throw new Error(
          `buildInstallerManifest: pathMap has no entry for runtime "${pathKeyEntry.runtime}" (surface "${surface.id}")`
        );
      }
      const target = runtimePaths[pathKeyEntry.key];
      if (!target) {
        throw new Error(
          `buildInstallerManifest: pathMap.runtimes.${pathKeyEntry.runtime}.${pathKeyEntry.key} is undefined (surface "${surface.id}")`
        );
      }

      return Object.freeze({
        id: surface.id,
        source,
        target,
        treatment: 'rewrite-template',
        owner_phase: 'onboarding',
        runtime: surface.runtime,
      });
    });

  // --- 7. Build safeScaffolds items (runtime-gated, only for enabled runtimes) ---
  const safeScaffolds = matrix.getInstallerSafeScaffolds()
    .filter((surface) => isRuntimeEnabled(runtimeSelection, surface.runtime))
    .map((surface) => {
      const tmplRelPath = SCAFFOLD_TEMPLATE_MAP[surface.id];
      if (!tmplRelPath) {
        throw new Error(
          `buildInstallerManifest: no template source mapping for scaffold surface "${surface.id}"`
        );
      }
      const source = path.join(template_source_root, tmplRelPath);

      const pathKeyEntry = SCAFFOLD_PATH_KEY_MAP[surface.id];
      if (!pathKeyEntry) {
        throw new Error(
          `buildInstallerManifest: no path key mapping for scaffold surface "${surface.id}"`
        );
      }
      const runtimePaths = pathMap.runtimes[pathKeyEntry.runtime];
      if (!runtimePaths) {
        throw new Error(
          `buildInstallerManifest: pathMap has no entry for runtime "${pathKeyEntry.runtime}" (surface "${surface.id}")`
        );
      }
      const target = runtimePaths[pathKeyEntry.key];
      if (!target) {
        throw new Error(
          `buildInstallerManifest: pathMap.runtimes.${pathKeyEntry.runtime}.${pathKeyEntry.key} is undefined (surface "${surface.id}")`
        );
      }

      return Object.freeze({
        id: surface.id,
        source,
        target,
        treatment: 'generate-fresh',
        owner_phase: 'onboarding',
        runtime: surface.runtime,
      });
    });

  // --- 8. Assemble validationTargets ---
  const validationTargets = Object.freeze({
    expectedCorePaths:      Object.freeze(copyCore.map((item) => item.target)),
    expectedTemplatePaths:  Object.freeze(templateSources.map((item) => item.target)),
    expectedBridgePaths:    Object.freeze(bridgeTemplates.map((item) => item.target)),
    expectedScaffoldPaths:  Object.freeze(safeScaffolds.map((item) => item.target)),
    forbiddenStrings:       Object.freeze(['/Users/viktorsl/', '/Volumes/BackBone/']),
    forbiddenFiles:         Object.freeze([
      'auth.json',
      'oauth_creds.json',
      'google_accounts.json',
      'credentials/',
      'identity/',
      'devices/',
      'telegram/',
      '*.sqlite',
      'cache/',
      'logs/',
      'history/',
      'state.json',
    ]),
  });

  // --- 9. Assemble and freeze the manifest ---
  const manifest = Object.freeze({
    meta: Object.freeze({
      created_at: new Date().toISOString(),
      selected_runtimes: Object.freeze([...runtimeSelection.enabledList]),
      vaultRoot: vault_location,
    }),
    copyCore:         Object.freeze(copyCore),
    templateSources:  Object.freeze(templateSources),
    bridgeTemplates:  Object.freeze(bridgeTemplates),
    safeScaffolds:    Object.freeze(safeScaffolds),
    validationTargets,
  });

  return manifest;
}

module.exports = { buildInstallerManifest };
