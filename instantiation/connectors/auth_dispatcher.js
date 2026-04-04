'use strict';

const { resolveAdapter } = require('./registry');
const { validateAuthAdapter, createAuthResult } = require('./auth_adapter');

// ---------------------------------------------------------------------------
// Auth Dispatcher
// Routes auth calls through registered adapters without knowing which specific
// adapters exist. Adding a new auth flow means adding an adapter — not editing
// this file.
// ---------------------------------------------------------------------------

/**
 * Dispatch a single auth action to the registered adapter for a connector.
 *
 * @param {object} options
 * @param {object} options.registry - from loadRegistry()
 * @param {string} options.connectorId - e.g. 'gmail', 'basecamp'
 * @param {string} options.action - one of: start_auth, finish_auth, refresh, revoke, status
 * @param {object} options.config - adapter-specific config passed to action fn
 * @returns {{ connector_id: string, result: object }} result is a createAuthResult
 */
function dispatchAuth({ registry, connectorId, action, config }) {
  const adapter = resolveAdapter(registry, connectorId, 'auth');

  if (!adapter) {
    return {
      connector_id: connectorId,
      result: createAuthResult({
        connected: false,
        error: `No auth adapter found for connector: ${connectorId}`,
      }),
    };
  }

  const { valid, errors } = validateAuthAdapter(adapter);
  if (!valid) {
    return {
      connector_id: connectorId,
      result: createAuthResult({
        connected: false,
        error: `Auth adapter for '${connectorId}' failed validation: ${errors.join('; ')}`,
      }),
    };
  }

  if (typeof adapter[action] !== 'function') {
    return {
      connector_id: connectorId,
      result: createAuthResult({
        connected: false,
        error: `Auth adapter for '${connectorId}' does not implement action: ${action}`,
      }),
    };
  }

  try {
    const result = adapter[action](config || {});
    return { connector_id: connectorId, result };
  } catch (e) {
    return {
      connector_id: connectorId,
      result: createAuthResult({
        connected: false,
        error: e.message || String(e),
      }),
    };
  }
}

/**
 * Dispatch auth for all connectors in connectorConfigs.
 *
 * @param {object} options
 * @param {object} options.registry - from loadRegistry()
 * @param {Array<{ connector_id: string, config: object }>} options.connectorConfigs
 * @param {boolean} [options.interactive] - if true: start_auth then finish_auth; if false: status only
 * @returns {{ results: Array, summary: { connected: number, failed: number, total: number } }}
 */
function dispatchAllAuth({ registry, connectorConfigs, interactive }) {
  const results = [];

  for (const { connector_id, config } of connectorConfigs) {
    if (interactive) {
      // Interactive path: run start_auth then finish_auth
      const startResult = dispatchAuth({ registry, connectorId: connector_id, action: 'start_auth', config });
      if (!startResult.result.connected) {
        results.push(startResult);
        continue;
      }
      const finishResult = dispatchAuth({ registry, connectorId: connector_id, action: 'finish_auth', config });
      results.push(finishResult);
    } else {
      // Declared path: just check status
      const statusResult = dispatchAuth({ registry, connectorId: connector_id, action: 'status', config });
      results.push(statusResult);
    }
  }

  const connected = results.filter(r => r.result.connected).length;
  const total = results.length;
  const failed = total - connected;

  return {
    results,
    summary: { connected, failed, total },
  };
}

/**
 * Generate human-readable guidance strings for each connector config.
 * Replaces the hardcoded guidance generation in account_connector.js.
 *
 * @param {object} options
 * @param {object} options.registry - from loadRegistry()
 * @param {Array<{ connector_id: string, config: object }>} options.connectorConfigs
 * @returns {string[]} Array of guidance strings
 */
function buildGuidance({ registry, connectorConfigs }) {
  const guidance = [];

  for (const { connector_id, config } of connectorConfigs) {
    const manifest = registry.connectors.get(connector_id);
    const adapter = resolveAdapter(registry, connector_id, 'auth');
    const requiredSecrets = (adapter && Array.isArray(adapter.required_secrets))
      ? adapter.required_secrets
      : [];

    const displayName = manifest ? manifest.display_name : connector_id;
    const secretsNote = requiredSecrets.length > 0
      ? ` (requires: ${requiredSecrets.join(', ')})`
      : '';

    // Build config summary for context
    const configKeys = Object.keys(config || {});
    const configNote = configKeys.length > 0
      ? ` with ${configKeys.map(k => `${k}=${config[k]}`).join(', ')}`
      : '';

    guidance.push(`Authenticate ${displayName}${configNote}${secretsNote}.`);
  }

  return guidance;
}

module.exports = {
  dispatchAuth,
  dispatchAllAuth,
  buildGuidance,
};
