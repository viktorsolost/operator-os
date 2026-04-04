'use strict';

// ---------------------------------------------------------------------------
// Sync Adapter Contract
// Defines the interface that sync adapter modules must implement.
// ---------------------------------------------------------------------------

/**
 * Map of method names to whether they are required (true) or optional (false).
 * Required methods MUST be functions on the adapter.
 * Optional methods, if present, MUST be functions.
 */
const SYNC_METHODS = {
  discover: false,
  validate_config: true,
  initial_sync: true,
  incremental_sync: true,
  healthcheck: true,
  normalize: true,
};

/**
 * Validate that a sync adapter implements the required contract.
 * Returns { valid: boolean, errors: string[] }.
 */
function validateSyncAdapter(adapter) {
  const errors = [];

  if (!adapter || typeof adapter !== 'object') {
    return { valid: false, errors: ['sync adapter must be an object'] };
  }

  for (const [method, required] of Object.entries(SYNC_METHODS)) {
    const present = method in adapter;
    if (required && !present) {
      errors.push(`'${method}' is required but missing`);
    } else if (present && typeof adapter[method] !== 'function') {
      errors.push(`'${method}' must be a function`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory for standardized sync results.
 * Returns a frozen object with shape: { success, data, errors, metadata }.
 */
function createSyncResult({ success, data, errors, metadata } = {}) {
  if (typeof success !== 'boolean') {
    throw new TypeError("createSyncResult: 'success' must be a boolean");
  }
  return Object.freeze({
    success,
    data: data !== undefined ? data : null,
    errors: errors !== undefined ? errors : [],
    metadata: metadata !== undefined ? metadata : null,
  });
}

module.exports = {
  SYNC_METHODS,
  validateSyncAdapter,
  createSyncResult,
};
