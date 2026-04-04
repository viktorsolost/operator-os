'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_GMAIL_FILTERS = {
  skip_categories: ['promotions', 'social', 'forums'],
  skip_calendar_invites: true,
  personal_noise_accounts: ['gws-personal'],
};

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

/**
 * Generate pipeline_config.json from onboarding inputs and account connections.
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet
 * @param {object} options.accountConnections - result from account_connector
 * @param {string} options.targetWorkspaceRoot - where Memento workspace lives
 * @returns {object} Report: { configPath, config }
 */
function generatePipelineConfig({ packet, accountConnections, targetWorkspaceRoot }) {
  ensurePipelineWorkspace(targetWorkspaceRoot);

  const gmailAccounts = (accountConnections && accountConnections.gmail) || [];
  const basecampConfig = (accountConnections && accountConnections.basecamp) || null;
  const emails = (packet.gmail_emails) || [];

  const hasGmail = gmailAccounts.length > 0;
  const hasBasecamp = basecampConfig && basecampConfig.connected;

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
        connected: true,
      })),
      basecamp: basecampConfig ? {
        account_id: basecampConfig.account_id,
        api_base: `https://3.basecampapi.com/${basecampConfig.account_id}`,
        connected: true,
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
function generateEmptyPipelineConfig({ packet, targetWorkspaceRoot }) {
  return generatePipelineConfig({
    packet,
    accountConnections: { gmail: [], basecamp: null },
    targetWorkspaceRoot,
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

function ensurePipelineWorkspace(targetWorkspaceRoot) {
  const sourcePipelineRoot = path.resolve(__dirname, '../../pipeline');
  const targetPipelineRoot = path.join(targetWorkspaceRoot, 'pipeline');

  if (!fs.existsSync(sourcePipelineRoot)) {
    return;
  }

  fs.mkdirSync(targetWorkspaceRoot, { recursive: true });
  fs.cpSync(sourcePipelineRoot, targetPipelineRoot, { recursive: true, force: true });
}

module.exports = { generatePipelineConfig, generateEmptyPipelineConfig, verifyPipelineCompatibility, DEFAULT_GMAIL_FILTERS };
