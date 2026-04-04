'use strict';

// ---------------------------------------------------------------------------
// Auth Adapter Contract
// Defines the interface that auth adapter modules must implement.
// ---------------------------------------------------------------------------

/**
 * Required methods on an auth adapter object.
 * All entries except 'required_secrets' must be functions.
 * 'required_secrets' must be an array of strings.
 */
const AUTH_METHODS = [
  'start_auth',
  'finish_auth',
  'refresh',
  'revoke',
  'status',
  'required_secrets',
];

/**
 * Validate that an auth adapter implements the required contract.
 * Returns { valid: boolean, errors: string[] }.
 */
function validateAuthAdapter(adapter) {
  const errors = [];

  if (!adapter || typeof adapter !== 'object') {
    return { valid: false, errors: ['auth adapter must be an object'] };
  }

  for (const method of AUTH_METHODS) {
    if (method === 'required_secrets') {
      if (!Array.isArray(adapter.required_secrets)) {
        errors.push("'required_secrets' must be an array of strings");
      } else if (!adapter.required_secrets.every(s => typeof s === 'string')) {
        errors.push("'required_secrets' must contain only strings");
      }
    } else {
      if (typeof adapter[method] !== 'function') {
        errors.push(`'${method}' must be a function`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory for standardized auth results.
 * Returns a frozen object with shape: { connected, error, credentials, metadata }.
 */
function createAuthResult({ connected, error, credentials, metadata } = {}) {
  if (typeof connected !== 'boolean') {
    throw new TypeError("createAuthResult: 'connected' must be a boolean");
  }
  return Object.freeze({
    connected,
    error: error !== undefined ? error : null,
    credentials: credentials !== undefined ? credentials : null,
    metadata: metadata !== undefined ? metadata : null,
  });
}

module.exports = {
  AUTH_METHODS,
  validateAuthAdapter,
  createAuthResult,
};
