'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Connect accounts based on onboarding inputs.
 * In dry test / non-interactive mode, accepts pre-built connection data.
 * In interactive mode, would guide OAuth flows (future work).
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet
 * @param {object} [options.mockConnections] - pre-built connections for testing
 * @returns {object} Connection result: { gmail: [], basecamp: {}, sourceIdentities: {} }
 */
function connectAccounts({ packet, mockConnections }) {
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

  const gmail = Array.isArray(packet.gmail_accounts)
    ? packet.gmail_accounts
      .map((account) => ({
        name: account.name,
        config_dir: account.config_dir || `~/.config/${account.name}`,
        label: account.label || account.name,
        connected: true,
      }))
      .filter((account) => account.name)
    : [];

  const basecamp = packet.basecamp_account_id
    ? {
        account_id: String(packet.basecamp_account_id),
        api_base: `https://3.basecampapi.com/${packet.basecamp_account_id}`,
        connected: true,
      }
    : null;

  const guidance = [];
  for (const account of gmail) {
    guidance.push(`Run GOOGLE_WORKSPACE_CLI_CONFIG_DIR=${account.config_dir} gws auth login for ${account.label}.`);
  }
  if (basecamp) {
    guidance.push(`Authorize Basecamp account ${basecamp.account_id} and store tokens in ~/.env.basecamp and ~/.env.basecamp.tokens.`);
  }

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

module.exports = { connectAccounts, writeSourceIdentities };
