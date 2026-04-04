'use strict';

const fs = require('fs');
const path = require('path');

const VALID_TREATMENTS = new Set([
  'copy-core',
  'rewrite-template',
  'generate-fresh',
  'prompt-later',
  'exclude',
]);

const REQUIRED_SURFACE_KEYS = ['id', 'path', 'layer', 'treatment', 'owner_phase', 'location'];

/**
 * Load and return a frozen matrix object from the given manifest path.
 *
 * @param {string} manifestPath - Absolute or relative path to file-treatment-manifest.json
 * @returns {object} Frozen matrix with filtered views and lookup helpers
 */
function loadFileMatrix(manifestPath) {
  if (!manifestPath) {
    throw new Error('loadFileMatrix: manifestPath is required');
  }

  let raw;
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
  } catch (err) {
    throw new Error(`loadFileMatrix: cannot read manifest at "${manifestPath}": ${err.message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(`loadFileMatrix: manifest is not valid JSON at "${manifestPath}": ${err.message}`);
  }

  if (!manifest || typeof manifest !== 'object') {
    throw new Error('loadFileMatrix: manifest root must be an object');
  }

  if (!Array.isArray(manifest.surfaces)) {
    throw new Error('loadFileMatrix: manifest.surfaces must be an array');
  }

  // Validate each surface has required keys and a known treatment
  manifest.surfaces.forEach((surface, index) => {
    for (const key of REQUIRED_SURFACE_KEYS) {
      if (surface[key] === undefined || surface[key] === null || surface[key] === '') {
        throw new Error(
          `loadFileMatrix: surface at index ${index} (id: "${surface.id}") is missing required key "${key}"`
        );
      }
    }
    if (!VALID_TREATMENTS.has(surface.treatment)) {
      throw new Error(
        `loadFileMatrix: surface "${surface.id}" has unknown treatment "${surface.treatment}"`
      );
    }
  });

  // Freeze a shallow copy of surfaces so callers cannot mutate
  const surfaces = Object.freeze(manifest.surfaces.map(s => Object.freeze(Object.assign({}, s))));

  // Build id → surface index for O(1) lookup
  const byId = new Map();
  surfaces.forEach(s => byId.set(s.id, s));

  // --- Filtered views by treatment ---

  function getByTreatment(treatment) {
    return surfaces.filter(s => s.treatment === treatment);
  }

  function getCopyCore() {
    return getByTreatment('copy-core');
  }

  function getRewriteTemplate() {
    return getByTreatment('rewrite-template');
  }

  function getGenerateFresh() {
    return getByTreatment('generate-fresh');
  }

  function getPromptLater() {
    return getByTreatment('prompt-later');
  }

  function getExcluded() {
    return getByTreatment('exclude');
  }

  // --- Installer-safe filtered views (Slice 1 scope) ---

  /**
   * copy-core surfaces owned by the installer phase.
   */
  function getInstallerCoreItems() {
    return surfaces.filter(
      s => s.treatment === 'copy-core' && s.owner_phase === 'installer'
    );
  }

  /**
   * rewrite-template surfaces owned by onboarding.
   * The installer PLACES these template sources; onboarding RENDERS them.
   * Excludes runtime-gated bridge files (see getInstallerBridgeTemplates).
   */
  function getInstallerTemplateItems() {
    return surfaces.filter(
      s =>
        s.treatment === 'rewrite-template' &&
        s.owner_phase === 'onboarding' &&
        !s.runtime_gated
    );
  }

  /**
   * rewrite-template surfaces that are runtime-gated bridge files.
   * These are placed by the installer but only rendered when the matching
   * runtime is selected during onboarding.
   */
  function getInstallerBridgeTemplates() {
    return surfaces.filter(
      s => s.treatment === 'rewrite-template' && s.runtime_gated === true
    );
  }

  /**
   * generate-fresh surfaces where scaffold_safe === true.
   * Safe to scaffold during install without needing live user inputs.
   */
  function getInstallerSafeScaffolds() {
    return surfaces.filter(
      s => s.treatment === 'generate-fresh' && s.scaffold_safe === true
    );
  }

  // --- Lookup helpers ---

  /**
   * Return a single surface by id, or null if not found.
   *
   * @param {string} id
   * @returns {object|null}
   */
  function getSurface(id) {
    return byId.get(id) || null;
  }

  /**
   * Return all surfaces gated to a given runtime name.
   *
   * @param {string} runtimeName - e.g. 'Claude', 'Codex', 'Gemini', 'OpenClaw'
   * @returns {object[]}
   */
  function getSurfacesByRuntime(runtimeName) {
    return surfaces.filter(s => s.runtime === runtimeName);
  }

  // --- Validation helpers ---

  /**
   * Return true if any surface id appears more than once with different treatments.
   *
   * @returns {boolean}
   */
  function hasConflicts() {
    const seen = new Map(); // id -> treatment
    for (const s of surfaces) {
      if (seen.has(s.id)) {
        if (seen.get(s.id) !== s.treatment) return true;
      } else {
        seen.set(s.id, s.treatment);
      }
    }
    return false;
  }

  /**
   * Return the subset of requiredIds that are not present in the manifest.
   *
   * @param {string[]} requiredIds
   * @returns {string[]}
   */
  function getMissingSurfaces(requiredIds) {
    if (!Array.isArray(requiredIds)) {
      throw new Error('getMissingSurfaces: requiredIds must be an array');
    }
    return requiredIds.filter(id => !byId.has(id));
  }

  const matrix = Object.freeze({
    surfaces,

    getByTreatment,
    getCopyCore,
    getRewriteTemplate,
    getGenerateFresh,
    getPromptLater,
    getExcluded,

    getInstallerCoreItems,
    getInstallerTemplateItems,
    getInstallerBridgeTemplates,
    getInstallerSafeScaffolds,

    getSurface,
    getSurfacesByRuntime,

    hasConflicts,
    getMissingSurfaces,
  });

  return matrix;
}

module.exports = { loadFileMatrix };
