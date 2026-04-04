'use strict';

const fs = require('fs');
const path = require('path');

const { loadRegistry } = require('../connectors/registry');

const DEFAULT_GMAIL_FILTERS = {
  skip_categories: ['promotions', 'social', 'forums'],
  skip_calendar_invites: true,
  personal_noise_accounts: [],
};

const ADAPTERS_DIR = path.resolve(__dirname, '..', 'connectors', 'adapters');

const REQUIRED_PATCHES = [
  {
    file: ['pipeline', 'lib', 'gmail_client.js'],
    mustInclude: ['getGmailAccounts', 'HARDCODED_ACCOUNTS'],
  },
  {
    file: ['pipeline', 'lib', 'basecamp_client.js'],
    mustInclude: ['getBasecampApiBase', 'FALLBACK_BASECAMP_API_BASE'],
  },
  {
    file: ['pipeline', 'steps', 'gmail_sync.js'],
    mustInclude: ['personal_noise_accounts'],
  },
  {
    file: ['pipeline', 'steps', 'basecamp_sync.js'],
    mustInclude: ['basecamp?.owner?.person_id', 'basecamp?.viktor?.person_id'],
  },
];

// ---------------------------------------------------------------------------
// buildConnectorsSection
// Build the connectors section for pipeline_config.json from workflow_tools.
// ---------------------------------------------------------------------------

/**
 * Build the connectors section from the resolved workflow_tools in the packet.
 *
 * @param {object} workflowTools - packet.workflow_tools (may be empty/undefined)
 * @param {object} registry - loaded registry from loadRegistry()
 * @returns {object} { registry_version, enabled, unsupported, deferred }
 */
function buildConnectorsSection(workflowTools, registry) {
  const enabled = [];
  const unsupported = [];
  const deferred = [];

  if (!workflowTools || !workflowTools.resolved) {
    return { registry_version: 1, enabled, unsupported, deferred };
  }

  const resolved = workflowTools.resolved;

  for (const [toolName, resolution] of Object.entries(resolved)) {
    if (resolution.status === 'unsupported') {
      unsupported.push({
        tool_name: toolName,
        reason: resolution.reason || 'No installed adapter',
      });
      continue;
    }

    if (resolution.status === 'supported') {
      const connectorId = resolution.connector_id;
      const manifest = registry.connectors.get(connectorId);

      if (!manifest) {
        unsupported.push({
          tool_name: toolName,
          reason: `Connector manifest not found for id '${connectorId}'`,
        });
        continue;
      }

      const entry = {
        connector_id: manifest.id,
        status: manifest.status,
        stage: manifest.stage,
        priority: manifest.priority,
        capabilities: manifest.capabilities,
      };

      if (manifest.status === 'manual_only') {
        deferred.push({ tool_name: toolName, reason: 'manual_only connector' });
      } else {
        enabled.push(entry);
      }
    }
  }

  return { registry_version: 1, enabled, unsupported, deferred };
}

// ---------------------------------------------------------------------------
// getEnabledConnectorManifests
// Bridge between config.connectors.enabled and the registry manifests.
// ---------------------------------------------------------------------------

/**
 * Given a pipeline config and a registry, return the array of manifests
 * for all connectors listed in config.connectors.enabled.
 *
 * @param {object} config - pipeline config object (from generatePipelineConfig)
 * @param {object} registry - loaded registry from loadRegistry()
 * @returns {object[]} array of connector manifests
 */
function getEnabledConnectorManifests(config, registry) {
  if (!config || !config.connectors || !Array.isArray(config.connectors.enabled)) {
    return [];
  }

  const manifests = [];
  for (const entry of config.connectors.enabled) {
    const manifest = registry.connectors.get(entry.connector_id);
    if (manifest) {
      manifests.push(manifest);
    }
  }
  return manifests;
}

// ---------------------------------------------------------------------------
// generatePipelineConfig
// ---------------------------------------------------------------------------

/**
 * Generate pipeline_config.json from onboarding inputs and account connections.
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet
 * @param {object} options.accountConnections - result from account_connector
 * @param {string} options.targetWorkspaceRoot - where Memento workspace lives
 * @param {string} [options.mementoSourceRoot] - source of pipeline files to copy
 * @returns {object} Report: { configPath, config, patchReport }
 */
function generatePipelineConfig({ packet, accountConnections, targetWorkspaceRoot, mementoSourceRoot }) {
  ensurePipelineWorkspace(targetWorkspaceRoot, mementoSourceRoot);

  const gmailAccounts = (accountConnections && accountConnections.gmail) || [];
  const basecampConfig = (accountConnections && accountConnections.basecamp) || null;
  const emails = (packet.gmail_emails) || [];

  const hasGmail = gmailAccounts.length > 0;
  const hasBasecamp = basecampConfig && basecampConfig.connected;

  // Load the connector registry to build the connectors section
  const registry = loadRegistry(ADAPTERS_DIR);
  const connectorsSection = buildConnectorsSection(packet.workflow_tools, registry);

  const config = {
    owner: {
      name: packet.owner_name,
      emails: emails,
    },
    accounts: {
      gmail: gmailAccounts.map(a => ({
        name: a.name,
        config_dir: a.config_dir || `~/.config/${a.name}`,
        label: a.label || a.name,
        connected: a.connected !== false,
      })),
      basecamp: basecampConfig ? {
        account_id: basecampConfig.account_id,
        api_base: `https://3.basecampapi.com/${basecampConfig.account_id}`,
        connected: !!basecampConfig.connected,
      } : {
        account_id: null,
        api_base: null,
        connected: false,
      },
      calendar: {
        enabled: hasGmail,
        account: hasGmail ? gmailAccounts[0].name : null,
        calendars: emails,
        config_dir: hasGmail ? (gmailAccounts[0].config_dir || `~/.config/${gmailAccounts[0].name}`) : null,
      },
      drive: {
        enabled: hasGmail,
        account: hasGmail ? gmailAccounts[0].name : null,
        config_dir: hasGmail ? (gmailAccounts[0].config_dir || `~/.config/${gmailAccounts[0].name}`) : null,
      },
      sheets: {
        enabled: hasGmail,
        account: hasGmail ? gmailAccounts[0].name : null,
      },
    },
    sync_engines: {
      gmail: hasGmail,
      basecamp: !!hasBasecamp,
      calendar: hasGmail,
      drive: hasGmail,
      sheets: hasGmail,
    },
    gmail_filters: DEFAULT_GMAIL_FILTERS,
    workflow_tools: packet.workflow_tools || {},
    connectors: connectorsSection,
  };

  const configDir = path.join(targetWorkspaceRoot, 'state', 'runtime');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, 'pipeline_config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

  const patchReport = verifyPipelineCompatibility(targetWorkspaceRoot);
  return { configPath, config, patchReport };
}

/**
 * Generate an empty pipeline config (for "later" flow).
 */
function generateEmptyPipelineConfig({ packet, targetWorkspaceRoot, mementoSourceRoot }) {
  return generatePipelineConfig({
    packet,
    accountConnections: { gmail: [], basecamp: null },
    targetWorkspaceRoot,
    mementoSourceRoot,
  });
}

function verifyPipelineCompatibility(targetWorkspaceRoot) {
  const report = { checked: [], missing: [], valid: true };

  for (const patch of REQUIRED_PATCHES) {
    const fullPath = path.join(targetWorkspaceRoot, ...patch.file);
    if (!fs.existsSync(fullPath)) {
      report.missing.push(fullPath);
      report.valid = false;
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const missingMarkers = patch.mustInclude.filter((marker) => !content.includes(marker));
    report.checked.push({ path: fullPath, missingMarkers });
    if (missingMarkers.length > 0) {
      report.valid = false;
    }
  }

  return report;
}

function ensurePipelineWorkspace(targetWorkspaceRoot, mementoSourceRoot) {
  const sourcePipelineRoot = mementoSourceRoot ? path.join(mementoSourceRoot, 'pipeline') : null;
  const targetPipelineRoot = path.join(targetWorkspaceRoot, 'pipeline');

  if (!sourcePipelineRoot || !fs.existsSync(sourcePipelineRoot)) {
    return;
  }

  fs.mkdirSync(targetWorkspaceRoot, { recursive: true });
  fs.cpSync(sourcePipelineRoot, targetPipelineRoot, { recursive: true, force: true });
}

module.exports = {
  generatePipelineConfig,
  generateEmptyPipelineConfig,
  verifyPipelineCompatibility,
  getEnabledConnectorManifests,
  buildConnectorsSection,
  DEFAULT_GMAIL_FILTERS,
};
