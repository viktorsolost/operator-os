#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const { buildInstallerManifest } = require('./instantiation/installer/manifest');
const { copyCore } = require('./instantiation/installer/core_copier');
const { placeTemplates } = require('./instantiation/installer/template_placer');
const { generateScaffolds } = require('./instantiation/installer/scaffold_generator');
const { runOnboarding, runSlice3Onboarding } = require('./instantiation/onboarding/orchestrator');
const { ALLOWED_RUNTIMES } = require('./instantiation/shared/runtime_selector');
const { loadRegistry } = require('./instantiation/connectors/registry');
const { resolveWorkflowTools, formatConnectorSummary } = require('./instantiation/connectors/tool_resolver');

const MANIFEST_PATH = path.resolve(__dirname, 'instantiation', 'manifests', 'file-treatment-manifest.json');
const TEMPLATE_SOURCE = path.resolve(__dirname, 'instantiation', 'templates');

// ---------------------------------------------------------------------------
// Ctrl+C handler
// ---------------------------------------------------------------------------
process.on('SIGINT', () => {
  console.log('\n\nInstallation cancelled.');
  process.exit(0);
});

// ---------------------------------------------------------------------------
// Synchronous stdin prompt — exact implementation from account_connector.js
// ---------------------------------------------------------------------------
function promptSync(question) {
  process.stdout.write(question);
  let str = '';
  const buf = Buffer.alloc(1);
  while (true) {
    const bytesRead = fs.readSync(0, buf, 0, 1);
    if (bytesRead === 0) break;
    const char = buf.toString('utf8', 0, 1);
    if (char === '\n') break;
    str += char;
  }
  return str.trim();
}

function promptWithDefault(question, defaultVal) {
  const display = defaultVal !== '' && defaultVal !== undefined && defaultVal !== null
    ? `${question} [${defaultVal}]: `
    : `${question}: `;
  const answer = promptSync(display);
  return answer !== '' ? answer : (defaultVal !== undefined && defaultVal !== null ? defaultVal : '');
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------
function expandHome(p) {
  if (typeof p === 'string' && p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const cliSourceDoctrine = args[0] ? expandHome(args[0]) : null;
const cliMementoSource = args[1] ? expandHome(args[1]) : null;

const DEFAULT_SOURCE_DOCTRINE = path.resolve(__dirname, 'substrates', 'vault');
const DEFAULT_MEMENTO_SOURCE = path.resolve(__dirname, 'substrates', 'memento');

const sourceDoctrine = cliSourceDoctrine || DEFAULT_SOURCE_DOCTRINE;
const mementoSource = cliMementoSource || DEFAULT_MEMENTO_SOURCE;

// ---------------------------------------------------------------------------
// Validate source doctrine exists before asking any questions
// ---------------------------------------------------------------------------
if (!fs.existsSync(sourceDoctrine)) {
  console.error(`Source doctrine not found at ${sourceDoctrine}.`);
  console.error('You need a copy of the reference vault files to install.');
  console.error('Usage: node install.js /path/to/reference-vault /path/to/memento');
  process.exit(1);
}

if (!fs.existsSync(mementoSource)) {
  console.error(`Memento source not found at ${mementoSource}.`);
  console.error('You need a copy of the Memento workspace to install. Memento is core substrate, not optional.');
  console.error('Usage: node install.js /path/to/reference-vault /path/to/memento');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main interactive installer
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n=== Operator OS Installer ===\n');
  console.log(`Source doctrine: ${sourceDoctrine}`);
  console.log(`Memento source:  ${mementoSource}`);
  console.log('');

  // -------------------------------------------------------------------------
  // Phase 1: Identity and Location
  // -------------------------------------------------------------------------
  console.log('--- Phase 1: Identity and Location ---\n');

  const owner_name = promptSync('Your name: ');
  if (!owner_name) {
    console.error('Error: owner name is required.');
    process.exit(1);
  }

  const system_name = promptWithDefault('System name (e.g. "MyOS")', `${owner_name} OS`);
  const primary_role = promptSync('Your primary role (one sentence): ');
  if (!primary_role) {
    console.error('Error: primary role is required.');
    process.exit(1);
  }

  const timezone = promptSync('Your timezone (e.g. "America/New_York (UTC-5)"): ');
  if (!timezone) {
    console.error('Error: timezone is required.');
    process.exit(1);
  }

  const home_root = promptWithDefault('Home directory', process.env.HOME || os.homedir());
  const vault_location = promptWithDefault(
    'Vault location (where your OS vault will live)',
    `${home_root}/Vault/${system_name}`
  );
  const workspace_root = promptWithDefault(
    'Memento workspace location',
    `${home_root}/Code/Memento`
  );

  // -------------------------------------------------------------------------
  // Phase 2: Runtimes and Style
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 2: Runtimes and Style ---\n');

  const runtimesRaw = promptWithDefault(
    `Which runtimes? (comma-separated, from: ${ALLOWED_RUNTIMES.join(', ')})`,
    'Claude'
  );

  const selected_runtimes = runtimesRaw
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  // Validate runtimes
  for (const r of selected_runtimes) {
    if (!ALLOWED_RUNTIMES.includes(r)) {
      console.error(`Error: unknown runtime "${r}". Allowed: ${ALLOWED_RUNTIMES.join(', ')}`);
      process.exit(1);
    }
  }

  if (selected_runtimes.length === 0) {
    console.error('Error: at least one runtime is required.');
    process.exit(1);
  }

  const tone_profile = promptWithDefault('Communication tone (direct/warm/formal)', 'direct');
  const preferred_reporting_style = promptWithDefault('Reporting style (concise/detailed)', 'concise');
  const business_context = promptWithDefault('Business context (one sentence about your work)', '');

  // -------------------------------------------------------------------------
  // Phase 3: Workflow Tools
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 3: Workflow Tools ---\n');

  const adaptersDir = path.resolve(__dirname, 'instantiation', 'connectors', 'adapters');
  const registry = loadRegistry(adaptersDir);

  console.log('Which tools do you use? (comma-separated, or "none" to skip)');
  console.log('Available categories: email, project management, chat, docs, calendar');
  console.log('Example tools: Gmail, Basecamp, Slack, Notion, Linear');
  const toolsRaw = promptSync('> ');

  let workflow_tools;
  if (!toolsRaw || toolsRaw.toLowerCase() === 'none' || toolsRaw.trim() === '') {
    workflow_tools = resolveWorkflowTools({ selectedTools: [], desiredCapabilities: [], registry });
  } else {
    const selectedTools = toolsRaw.split(',').map((t) => t.trim()).filter(Boolean);

    console.log('\nWhat would you like synced? (comma-separated, or "all" for everything)');
    console.log('Options: email, tasks, messages, comments, calendar, docs');
    const capsRaw = promptSync('> ');

    let desiredCapabilities;
    if (!capsRaw || capsRaw.toLowerCase() === 'all') {
      desiredCapabilities = ['email', 'tasks', 'messages', 'comments', 'calendar', 'docs'];
    } else {
      desiredCapabilities = capsRaw.split(',').map((c) => c.trim()).filter(Boolean);
    }

    workflow_tools = resolveWorkflowTools({ selectedTools, desiredCapabilities, registry });
  }

  // -------------------------------------------------------------------------
  // Phase 4: Accounts
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 4: Accounts ---\n');

  const connect_accounts_now = promptWithDefault('Connect accounts now or later? (now/later)', 'later');

  let gmail_accounts = [];
  let gmail_emails = [];
  let basecamp_account_id = '';

  if (connect_accounts_now === 'now') {
    const gmailCountRaw = promptWithDefault('How many Gmail accounts? (0-4)', '0');
    const gmailCount = Math.min(4, Math.max(0, parseInt(gmailCountRaw, 10) || 0));

    for (let i = 0; i < gmailCount; i++) {
      console.log(`\nGmail account ${i + 1}:`);
      const name = promptSync(`  Gmail account name (e.g. "gws-work"): `);
      const label = promptSync(`  Label (e.g. "Work email"): `);
      if (name) {
        gmail_accounts.push({ name, label: label || name });
      }
    }

    if (gmailCount > 0) {
      const emailsRaw = promptSync('Gmail email addresses (comma-separated): ');
      gmail_emails = emailsRaw
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
    }

    const basecampRaw = promptSync('Basecamp account ID (from your Basecamp URL, or blank to skip): ');
    basecamp_account_id = basecampRaw || '';
  }

  // -------------------------------------------------------------------------
  // Phase 5: Run Installation
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 5: Running Installation ---\n');

  // Build the onboarding answers packet
  const onboardingAnswers = {
    owner_name,
    system_name,
    primary_role,
    timezone,
    home_root,
    vault_location,
    workspace_root,
    selected_runtimes,
    tone_profile,
    preferred_reporting_style,
    business_context,
    workflow_tools,
    connect_accounts_now,
    gmail_accounts,
    gmail_emails,
    basecamp_account_id,
  };

  // Build installer manifest inputs
  const installerInputs = {
    selected_runtimes,
    target_install_root: vault_location,
    home_root,
    vault_location,
    workspace_root,
    source_doctrine_root: sourceDoctrine,
    template_source_root: TEMPLATE_SOURCE,
    manifest_path: MANIFEST_PATH,
  };

  // --- Slice 1: Installer ---
  console.log('Running installation...');

  let installerManifest;
  try {
    installerManifest = buildInstallerManifest(installerInputs);
  } catch (err) {
    console.error(`\nInstaller manifest failed: ${err.message}`);
    process.exit(1);
  }

  try {
    await copyCore(installerManifest);
    console.log('  Core files copied.');
  } catch (err) {
    console.error(`\ncopyCore failed: ${err.message}`);
    process.exit(1);
  }

  try {
    await placeTemplates(installerManifest);
    console.log('  Templates placed.');
  } catch (err) {
    console.error(`\nplaceTemplates failed: ${err.message}`);
    process.exit(1);
  }

  try {
    await generateScaffolds(installerManifest);
    console.log('  Scaffolds generated.');
  } catch (err) {
    console.error(`\ngenerateScaffolds failed: ${err.message}`);
    process.exit(1);
  }

  // --- Slice 2: Onboarding ---
  let slice2Result;
  try {
    slice2Result = runOnboarding({
      installerManifest,
      onboardingAnswers,
      templateSourceRoot: TEMPLATE_SOURCE,
      targetInstallRoot: vault_location,
      homeRoot: home_root,
      manifestPath: MANIFEST_PATH,
    });
  } catch (err) {
    console.error(`\nOnboarding failed: ${err.message}`);
    process.exit(1);
  }

  if (!slice2Result.success) {
    console.error(`\nOnboarding failed at phase: ${slice2Result.phase}`);
    if (slice2Result.errors && slice2Result.errors.length > 0) {
      for (const e of slice2Result.errors) {
        console.error(`  ${typeof e === 'object' ? (e.id ? `[${e.id}] ${e.error || JSON.stringify(e)}` : JSON.stringify(e)) : e}`);
      }
    }
    process.exit(1);
  }
  console.log('  Onboarding complete.');

  // --- Slice 3: Accounts and pipeline config ---
  let slice3Result;
  try {
    slice3Result = runSlice3Onboarding({
      packet: slice2Result.packet,
      targetInstallRoot: vault_location,
      homeRoot: home_root,
      targetWorkspaceRoot: workspace_root,
      mementoSourceRoot: mementoSource,
      interactive: connect_accounts_now === 'now',
    });
  } catch (err) {
    console.error(`\nSlice 3 (accounts/pipeline) failed: ${err.message}`);
    process.exit(1);
  }

  if (!slice3Result.success) {
    console.error('\nSlice 3 failed.');
    if (slice3Result.validation && slice3Result.validation.findings) {
      for (const f of slice3Result.validation.findings) {
        if (f.severity === 'fail') {
          console.error(`  [${f.checkpoint}] ${f.message}`);
        }
      }
    }
    process.exit(1);
  }
  console.log('  Accounts and pipeline configured.');

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const connectedGmail = slice3Result.connections
    ? (slice3Result.connections.gmail || []).filter((a) => a.connected).length
    : 0;
  const basecampConnected =
    slice3Result.connections &&
    slice3Result.connections.basecamp &&
    slice3Result.connections.basecamp.connected;

  let accountsSummary = '';
  if (connect_accounts_now === 'now') {
    const gmailStr = `${connectedGmail} Gmail connected`;
    const basecampStr = basecampConnected ? 'Basecamp connected' : basecamp_account_id ? 'Basecamp failed' : 'Basecamp skipped';
    accountsSummary = `${gmailStr}, ${basecampStr}`;
  } else {
    accountsSummary = 'Skipped (connect later)';
  }

  const connectorSummaryLines = formatConnectorSummary(workflow_tools);
  const connectorSummaryBlock = connectorSummaryLines.length > 0
    ? connectorSummaryLines.join('\n')
    : '  Connectors: none selected';

  const coreCount = installerManifest.copyCore.length;
  const templateCount = installerManifest.templateSources.length;
  const bridgeCount = installerManifest.bridgeTemplates.length;
  const scaffoldCount = installerManifest.safeScaffolds.length;

  const reconnectLine = connect_accounts_now !== 'now'
    ? `\nTo connect accounts later:\n  node instantiation/onboarding/reconnect.js ${workspace_root}/state/runtime/pipeline_config.json\n`
    : '';

  console.log(`
Installation complete.

What was installed:
  ${coreCount} core doctrine files, ${templateCount} rendered templates, ${bridgeCount} runtime bridges, ${scaffoldCount} config scaffolds

Vault:      ${vault_location}
Workspace:  ${workspace_root}
Runtimes:   ${selected_runtimes.join(', ')}
Accounts:   ${accountsSummary}
${connectorSummaryBlock}
${reconnectLine}Start a conversation with any operator:
  "Hi Claudia, what should I focus on today?"
  "Hi Anton, review this architecture."
`);
}

main().catch((err) => {
  console.error('\nInstallation crashed:', err.message || err);
  process.exit(1);
});
