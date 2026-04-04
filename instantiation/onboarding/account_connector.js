'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { loadRegistry } = require('../connectors/registry');
const { dispatchAuth, dispatchAllAuth, buildGuidance } = require('../connectors/auth_dispatcher');

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Expand ~ to the user's home directory.
 */
function expandHome(p) {
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

// Path to the adapters directory (relative to this file's location)
const ADAPTERS_DIR = path.resolve(__dirname, '../connectors/adapters');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the connector configs array from a packet's gmail_accounts.
 * Each entry is ready to pass into dispatchAllAuth / dispatchAuth.
 */
function buildGmailConnectorConfigs(packet) {
  if (!Array.isArray(packet.gmail_accounts)) return [];
  return packet.gmail_accounts
    .filter(a => a.name)
    .map(a => ({
      connector_id: 'gmail',
      config: {
        config_dir: a.config_dir || `~/.config/${a.name}`,
        label: a.label || a.name,
      },
      // Preserve original account metadata for return shape mapping
      _meta: {
        name: a.name,
        config_dir: a.config_dir || `~/.config/${a.name}`,
        label: a.label || a.name,
      },
    }));
}

/**
 * Build the connector config for Basecamp (single account).
 * Returns null if no basecamp_account_id in packet.
 */
function buildBasecampConnectorConfig(packet) {
  if (!packet.basecamp_account_id) return null;
  return {
    connector_id: 'basecamp',
    config: {
      account_id: String(packet.basecamp_account_id),
      home_root: packet.home_root || '~',
    },
  };
}

/**
 * Map an auth result + original account metadata back to the legacy gmail account shape:
 * { name, config_dir, label, connected, error? }
 */
function mapGmailResult(meta, authResult) {
  const obj = {
    name: meta.name,
    config_dir: meta.config_dir,
    label: meta.label,
    connected: authResult.connected,
  };
  if (authResult.error) obj.error = authResult.error;
  return obj;
}

/**
 * Map an auth result back to the legacy basecamp shape:
 * { account_id, api_base, connected, person_id?, error? }
 */
function mapBasecampResult(accountId, authResult) {
  const obj = {
    account_id: String(accountId),
    api_base: `https://3.basecampapi.com/${accountId}`,
    connected: authResult.connected,
  };
  if (authResult.metadata && authResult.metadata.person_id) {
    obj.person_id = String(authResult.metadata.person_id);
  }
  if (authResult.error) obj.error = authResult.error;
  return obj;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Live interactive auth flow — runs real auth via dispatched adapters.
 * Used internally; exported for backward compatibility.
 */
function connectAccountsLive({ packet }) {
  const registry = loadRegistry(ADAPTERS_DIR);

  // Build gmail connector configs (one per account, preserving metadata)
  const rawGmailConfigs = buildGmailConnectorConfigs(packet);

  // Dispatch gmail accounts one by one so we can map results back with metadata
  const gmail = rawGmailConfigs.map(({ connector_id, config, _meta }) => {
    // start_auth, then finish_auth
    const startDispatched = dispatchAuth({ registry, connectorId: connector_id, action: 'start_auth', config });
    if (!startDispatched.result.connected) {
      return mapGmailResult(_meta, startDispatched.result);
    }
    const finishDispatched = dispatchAuth({ registry, connectorId: connector_id, action: 'finish_auth', config });
    return mapGmailResult(_meta, finishDispatched.result);
  });

  // Dispatch basecamp
  let basecampResult = null;
  const basecampConnConfig = buildBasecampConnectorConfig(packet);
  if (basecampConnConfig) {
    const startDispatched = dispatchAuth({
      registry,
      connectorId: 'basecamp',
      action: 'start_auth',
      config: basecampConnConfig.config,
    });
    if (startDispatched.result.connected) {
      const finishDispatched = dispatchAuth({
        registry,
        connectorId: 'basecamp',
        action: 'finish_auth',
        config: basecampConnConfig.config,
      });
      basecampResult = mapBasecampResult(packet.basecamp_account_id, finishDispatched.result);
    } else {
      basecampResult = mapBasecampResult(packet.basecamp_account_id, startDispatched.result);
    }
  }

  const sourceIdentities =
    basecampResult && basecampResult.connected && basecampResult.person_id
      ? { basecamp: { owner: { person_id: basecampResult.person_id } } }
      : {};

  const gmailConnected = gmail.filter(a => a.connected).length;
  const gmailTotal = gmail.length;
  const basecampStatus = basecampResult
    ? basecampResult.connected ? 'connected' : 'failed'
    : 'n/a';

  console.log(`Connected ${gmailConnected}/${gmailTotal} Gmail accounts, Basecamp: ${basecampStatus}`);

  const someConnected = gmailConnected > 0 || (basecampResult && basecampResult.connected);
  const someFailed =
    gmailConnected < gmailTotal ||
    (basecampResult !== null && !basecampResult.connected);

  return {
    gmail,
    basecamp: basecampResult,
    sourceIdentities,
    mode: 'live',
    skipped: false,
    partial: someConnected && someFailed,
  };
}

/**
 * Connect accounts based on onboarding inputs.
 * In dry test / non-interactive mode, accepts pre-built connection data.
 * In interactive mode, runs live OAuth flows via the auth dispatcher.
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet
 * @param {object} [options.mockConnections] - pre-built connections for testing
 * @param {boolean} [options.interactive] - if true, run live auth via adapters
 * @returns {object} { gmail: [], basecamp: {}, sourceIdentities: {}, mode, skipped, partial? }
 */
function connectAccounts({ packet, mockConnections, interactive }) {
  // If connect_accounts_now is "later", return empty connections
  if (packet.connect_accounts_now === 'later') {
    return {
      gmail: [],
      basecamp: null,
      sourceIdentities: {},
      skipped: true,
    };
  }

  // Use mock connections if provided (dry test path)
  if (mockConnections) {
    return {
      gmail: mockConnections.gmail || [],
      basecamp: mockConnections.basecamp || null,
      sourceIdentities: mockConnections.sourceIdentities || {},
      guidance: [],
      mode: 'mock',
      skipped: false,
    };
  }

  // Live interactive path — dispatch through adapters
  if (interactive) {
    return connectAccountsLive({ packet });
  }

  // Declared path — return guidance strings, no actual auth
  const registry = loadRegistry(ADAPTERS_DIR);

  const gmail = Array.isArray(packet.gmail_accounts)
    ? packet.gmail_accounts
      .filter(a => a.name)
      .map(a => ({
        name: a.name,
        config_dir: a.config_dir || `~/.config/${a.name}`,
        label: a.label || a.name,
        connected: true,
      }))
    : [];

  const basecamp = packet.basecamp_account_id
    ? {
        account_id: String(packet.basecamp_account_id),
        api_base: `https://3.basecampapi.com/${packet.basecamp_account_id}`,
        connected: true,
      }
    : null;

  // Build connector configs for guidance generation
  const connectorConfigs = [
    ...gmail.map(a => ({
      connector_id: 'gmail',
      config: { config_dir: a.config_dir, label: a.label },
    })),
    ...(basecamp
      ? [{ connector_id: 'basecamp', config: { account_id: basecamp.account_id } }]
      : []),
  ];

  const guidance = buildGuidance({ registry, connectorConfigs });

  return {
    gmail,
    basecamp,
    sourceIdentities: basecamp && packet.basecamp_person_id
      ? { basecamp: { owner: { person_id: String(packet.basecamp_person_id) } } }
      : {},
    guidance,
    mode: 'declared',
    skipped: gmail.length === 0 && !basecamp,
  };
}

/**
 * Reconnect accounts that are marked as disconnected in an existing pipeline_config.json.
 * Uses the auth dispatcher instead of hardcoded auth functions.
 *
 * @param {object} options
 * @param {string} options.pipelineConfigPath - absolute path to pipeline_config.json
 * @param {string} [options.homeRoot] - home root for Basecamp env files (default: ~)
 * @returns {object} Updated connections
 */
function reconnectAccounts({ pipelineConfigPath, homeRoot }) {
  const config = JSON.parse(fs.readFileSync(pipelineConfigPath, 'utf8'));
  const accounts = config.accounts || {};
  const registry = loadRegistry(ADAPTERS_DIR);

  // Reconnect disconnected Gmail accounts
  const updatedGmail = Array.isArray(accounts.gmail)
    ? accounts.gmail.map(account => {
        if (account.connected === false) {
          const dispatched = dispatchAuth({
            registry,
            connectorId: 'gmail',
            action: 'start_auth',
            config: { config_dir: account.config_dir, label: account.label },
          });
          return mapGmailResult(
            { name: account.name, config_dir: account.config_dir, label: account.label },
            dispatched.result,
          );
        }
        return account;
      })
    : [];

  // Reconnect disconnected Basecamp
  let updatedBasecamp = accounts.basecamp || null;
  if (updatedBasecamp && updatedBasecamp.connected === false && updatedBasecamp.account_id) {
    const dispatched = dispatchAuth({
      registry,
      connectorId: 'basecamp',
      action: 'start_auth',
      config: {
        account_id: updatedBasecamp.account_id,
        home_root: homeRoot || '~',
      },
    });
    updatedBasecamp = mapBasecampResult(updatedBasecamp.account_id, dispatched.result);
  }

  // Build source identities from Basecamp result
  const sourceIdentities =
    updatedBasecamp && updatedBasecamp.connected && updatedBasecamp.person_id
      ? { basecamp: { owner: { person_id: updatedBasecamp.person_id } } }
      : {};

  // Update config and write back
  config.accounts = { ...accounts, gmail: updatedGmail, basecamp: updatedBasecamp };
  fs.writeFileSync(pipelineConfigPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

  const gmailConnected = updatedGmail.filter(a => a.connected).length;
  const someConnected = gmailConnected > 0 || (updatedBasecamp && updatedBasecamp.connected);
  const someFailed =
    gmailConnected < updatedGmail.length ||
    (updatedBasecamp !== null && !updatedBasecamp.connected);

  return {
    gmail: updatedGmail,
    basecamp: updatedBasecamp,
    sourceIdentities,
    partial: someConnected && someFailed,
  };
}

/**
 * Write source_identities.json to the target workspace.
 *
 * @param {object} sourceIdentities - e.g. { basecamp: { owner: { person_id: "123" } } }
 * @param {string} targetWorkspaceRoot
 */
function writeSourceIdentities(sourceIdentities, targetWorkspaceRoot) {
  const idPath = path.join(targetWorkspaceRoot, 'state', 'runtime', 'source_identities.json');
  const dir = path.dirname(idPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(idPath, JSON.stringify(sourceIdentities, null, 2) + '\n', 'utf8');
  return idPath;
}

module.exports = { connectAccounts, connectAccountsLive, reconnectAccounts, writeSourceIdentities };
