#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { reconnectAccounts, writeSourceIdentities } = require('./account_connector');

// Usage: node reconnect.js [pipeline-config-path]
// Defaults to finding pipeline_config.json in the standard location

const args = process.argv.slice(2);

function findPipelineConfig() {
  // Check explicit argument
  if (args[0] && fs.existsSync(args[0])) return args[0];

  // Check standard location relative to workspace
  const workspaceRoot = process.env.MEMENTO_WORKSPACE_ROOT;
  if (workspaceRoot) {
    const p = path.join(workspaceRoot, 'state', 'runtime', 'pipeline_config.json');
    if (fs.existsSync(p)) return p;
  }

  return null;
}

const configPath = findPipelineConfig();
if (!configPath) {
  console.error('Could not find pipeline_config.json.');
  console.error('Usage: node reconnect.js [path/to/pipeline_config.json]');
  console.error('Or set MEMENTO_WORKSPACE_ROOT environment variable.');
  process.exit(1);
}

console.log(`Reading pipeline config from: ${configPath}`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Show current connection status
const gmailAccounts = config.accounts?.gmail || [];
const basecamp = config.accounts?.basecamp || {};
const disconnected = [];

for (const acct of gmailAccounts) {
  const status = acct.connected ? 'connected' : 'disconnected';
  console.log(`  Gmail: ${acct.label || acct.name} — ${status}`);
  if (!acct.connected) disconnected.push({ type: 'gmail', account: acct });
}

const bcStatus = basecamp.connected ? 'connected' : 'disconnected';
console.log(`  Basecamp: ${basecamp.account_id || 'not configured'} — ${bcStatus}`);
if (basecamp.account_id && !basecamp.connected) {
  disconnected.push({ type: 'basecamp', account: basecamp });
}

if (disconnected.length === 0) {
  console.log('\nAll accounts are already connected.');
  process.exit(0);
}

console.log(`\n${disconnected.length} account(s) need reconnection.\n`);

// Run reconnect
const result = reconnectAccounts({
  pipelineConfigPath: configPath,
  homeRoot: process.env.HOME,
});

// Update source identities if Basecamp reconnected
if (result.sourceIdentities && Object.keys(result.sourceIdentities).length > 0) {
  const workspaceRoot = path.dirname(path.dirname(path.dirname(configPath)));
  writeSourceIdentities(result.sourceIdentities, workspaceRoot);
  console.log('Source identities updated.');
}

// Summary
const gmailConnected = (result.gmail || []).filter(a => a.connected).length;
const gmailTotal = (result.gmail || []).length;
const bcConnected = result.basecamp?.connected ? 'yes' : 'no';

console.log(`\nReconnection complete:`);
console.log(`  Gmail: ${gmailConnected}/${gmailTotal} connected`);
console.log(`  Basecamp: ${bcConnected}`);

if (result.partial) {
  console.log('\nSome accounts could not be connected. Run this script again to retry.');
  process.exit(1);
}
