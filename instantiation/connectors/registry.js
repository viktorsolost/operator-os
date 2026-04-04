'use strict';

const fs = require('fs');
const path = require('path');

const { validateManifest } = require('./manifest_schema');

// ---------------------------------------------------------------------------
// Registry Loader
// Discovers and loads connector manifests from an adapters directory.
// Each subdirectory of adaptersDir should contain a manifest.json file.
// ---------------------------------------------------------------------------

/**
 * Scan adaptersDir for connector subdirectories, load and validate each
 * manifest.json. Returns { connectors: Map<id, manifest>, errors: string[] }.
 * Invalid manifests are skipped; errors describe what was wrong.
 */
function loadRegistry(adaptersDir) {
  const connectors = new Map();
  const errors = [];

  if (!fs.existsSync(adaptersDir)) {
    return { connectors, errors: [`adaptersDir does not exist: ${adaptersDir}`] };
  }

  let entries;
  try {
    entries = fs.readdirSync(adaptersDir, { withFileTypes: true });
  } catch (err) {
    return { connectors, errors: [`Failed to read adaptersDir: ${err.message}`] };
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const connectorDir = path.join(adaptersDir, entry.name);
    const manifestPath = path.join(connectorDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      errors.push(`[${entry.name}] No manifest.json found — skipping`);
      continue;
    }

    let manifest;
    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      manifest = JSON.parse(raw);
    } catch (err) {
      errors.push(`[${entry.name}] Failed to parse manifest.json: ${err.message} — skipping`);
      continue;
    }

    // Attach the resolved connector directory so resolveAdapter can use it
    manifest._connector_dir = connectorDir;

    const { valid, errors: validationErrors } = validateManifest(manifest);
    if (!valid) {
      errors.push(`[${entry.name}] Invalid manifest: ${validationErrors.join('; ')} — skipping`);
      continue;
    }

    if (connectors.has(manifest.id)) {
      errors.push(`[${entry.name}] Duplicate connector id '${manifest.id}' — skipping`);
      continue;
    }

    connectors.set(manifest.id, manifest);
  }

  return { connectors, errors };
}

/**
 * Require and return an adapter module for the given connector.
 * adapterType: 'auth' | 'sync'
 * Returns null if the adapter path is not configured or the file doesn't exist.
 */
function resolveAdapter(registry, connectorId, adapterType) {
  const manifest = registry.connectors.get(connectorId);
  if (!manifest) return null;

  const adapterKey = adapterType === 'auth' ? 'auth_adapter' : 'sync_adapter';
  const adapterRelPath = manifest[adapterKey];
  if (!adapterRelPath) return null;

  const adapterAbsPath = path.resolve(manifest._connector_dir, adapterRelPath);

  try {
    return require(adapterAbsPath);
  } catch (_) {
    return null;
  }
}

/**
 * Return manifests for a given stage, sorted by priority ascending,
 * then alphabetically by id for ties.
 */
function getConnectorsByStage(registry, stage) {
  const results = [];
  for (const manifest of registry.connectors.values()) {
    if (manifest.stage === stage) results.push(manifest);
  }
  results.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id.localeCompare(b.id);
  });
  return results;
}

/**
 * Return manifests that list the given capability string.
 */
function getConnectorsByCapability(registry, capability) {
  const results = [];
  for (const manifest of registry.connectors.values()) {
    if (Array.isArray(manifest.capabilities) && manifest.capabilities.includes(capability)) {
      results.push(manifest);
    }
  }
  return results;
}

module.exports = {
  loadRegistry,
  resolveAdapter,
  getConnectorsByStage,
  getConnectorsByCapability,
};
