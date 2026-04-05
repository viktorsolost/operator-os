'use strict';

/**
 * runtime_selector.js
 * Normalizes and validates runtime selection for the VIK OS instantiation system.
 *
 * Allowed runtimes: Codex, Claude, Gemini, OpenClaw (case-sensitive)
 * This module does NOT read runtime-specific detail fields, resolve paths,
 * infer enablement from file presence, or write files.
 */

const ALLOWED_RUNTIMES = Object.freeze(['Codex', 'Claude', 'Gemini', 'OpenClaw']);

/**
 * Takes a raw selected_runtimes array and returns a normalized selection object.
 *
 * @param {string[]} selectedRuntimes
 * @returns {{ enabled: Object, enabledList: string[], count: number }}
 */
function normalizeRuntimeSelection(selectedRuntimes) {
  if (selectedRuntimes === null || selectedRuntimes === undefined) {
    throw new Error(
      'normalizeRuntimeSelection: selectedRuntimes must be an array, got ' +
        (selectedRuntimes === null ? 'null' : 'undefined')
    );
  }

  if (!Array.isArray(selectedRuntimes)) {
    throw new Error(
      'normalizeRuntimeSelection: selectedRuntimes must be an array, got ' + typeof selectedRuntimes
    );
  }

  // Normalize case: match against ALLOWED_RUNTIMES case-insensitively
  const canonicalMap = new Map(ALLOWED_RUNTIMES.map(r => [r.toLowerCase(), r]));
  const normalized = selectedRuntimes.map(name => {
    const canonical = canonicalMap.get(name.toLowerCase());
    if (!canonical) {
      throw new Error(
        'normalizeRuntimeSelection: unknown runtime "' +
          name +
          '". Allowed: ' +
          ALLOWED_RUNTIMES.join(', ')
      );
    }
    return canonical;
  });

  // Deduplicate while preserving canonical order from ALLOWED_RUNTIMES
  const enabledSet = new Set(normalized);
  const enabledList = ALLOWED_RUNTIMES.filter((r) => enabledSet.has(r));

  const enabled = Object.freeze(
    ALLOWED_RUNTIMES.reduce((acc, r) => {
      acc[r] = enabledSet.has(r);
      return acc;
    }, {})
  );

  return Object.freeze({
    enabled,
    enabledList: Object.freeze(enabledList),
    count: enabledList.length,
  });
}

/**
 * Returns true if the given runtime is enabled in the selection.
 *
 * @param {{ enabled: Object }} selection
 * @param {string} runtimeName
 * @returns {boolean}
 */
function isRuntimeEnabled(selection, runtimeName) {
  return selection.enabled[runtimeName] === true;
}

/**
 * Returns the ordered array of enabled runtime names.
 *
 * @param {{ enabledList: string[] }} selection
 * @returns {string[]}
 */
function getEnabledRuntimes(selection) {
  return selection.enabledList;
}

/**
 * Returns the frozen array of all allowed runtime names.
 *
 * @returns {string[]}
 */
function getAllowedRuntimes() {
  return ALLOWED_RUNTIMES;
}

module.exports = {
  ALLOWED_RUNTIMES,
  normalizeRuntimeSelection,
  isRuntimeEnabled,
  getEnabledRuntimes,
  getAllowedRuntimes,
};
