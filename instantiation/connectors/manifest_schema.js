'use strict';

// ---------------------------------------------------------------------------
// Connector Manifest Schema
// Defines the shape of a connector manifest and validates instances.
// ---------------------------------------------------------------------------

const VALID_STAGES = ['preflight', 'source_sync', 'derivation', 'post_sync'];
const VALID_STATUSES = ['production', 'experimental', 'unsupported', 'manual_only'];
const VALID_CATEGORIES = [
  'email', 'project_management', 'chat', 'docs', 'crm', 'calendar',
  'sheets', 'drive', 'other',
];

/**
 * Validate a connector manifest object.
 * Returns { valid: boolean, errors: string[] }.
 */
function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['manifest must be an object'] };
  }

  // --- Required string fields ---
  for (const field of ['id', 'display_name', 'category', 'stage', 'status']) {
    if (typeof manifest[field] !== 'string' || manifest[field].trim() === '') {
      errors.push(`'${field}' is required and must be a non-empty string`);
    }
  }

  // --- category must be valid ---
  if (typeof manifest.category === 'string' && !VALID_CATEGORIES.includes(manifest.category)) {
    errors.push(`'category' must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // --- capabilities: required array of strings ---
  if (!Array.isArray(manifest.capabilities)) {
    errors.push("'capabilities' is required and must be an array of strings");
  } else if (manifest.capabilities.length === 0) {
    errors.push("'capabilities' must contain at least one entry");
  } else if (!manifest.capabilities.every(c => typeof c === 'string')) {
    errors.push("'capabilities' must be an array of strings");
  }

  // --- stage must be valid ---
  if (typeof manifest.stage === 'string' && !VALID_STAGES.includes(manifest.stage)) {
    errors.push(`'stage' must be one of: ${VALID_STAGES.join(', ')}`);
  }

  // --- status must be valid ---
  if (typeof manifest.status === 'string' && !VALID_STATUSES.includes(manifest.status)) {
    errors.push(`'status' must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // --- priority: required integer ---
  if (!Number.isInteger(manifest.priority)) {
    errors.push("'priority' is required and must be an integer");
  }

  // --- Optional fields type checks ---
  if ('auth_adapter' in manifest && typeof manifest.auth_adapter !== 'string') {
    errors.push("'auth_adapter' must be a string if provided");
  }
  if ('sync_adapter' in manifest && typeof manifest.sync_adapter !== 'string') {
    errors.push("'sync_adapter' must be a string if provided");
  }
  if ('config_schema' in manifest && (typeof manifest.config_schema !== 'object' || manifest.config_schema === null || Array.isArray(manifest.config_schema))) {
    errors.push("'config_schema' must be an object if provided");
  }
  if ('enabled_by_default' in manifest && typeof manifest.enabled_by_default !== 'boolean') {
    errors.push("'enabled_by_default' must be a boolean if provided");
  }
  if ('after' in manifest) {
    if (!Array.isArray(manifest.after) || !manifest.after.every(v => typeof v === 'string')) {
      errors.push("'after' must be an array of strings if provided");
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  VALID_STAGES,
  VALID_STATUSES,
  VALID_CATEGORIES,
  validateManifest,
};
