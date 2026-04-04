'use strict';

const fs = require('fs');
const path = require('path');

function fileExists(p) { return fs.existsSync(p); }
function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}

/**
 * Validate post-Slice-3 state.
 */
function validateSlice3({ pipelineConfig, targetWorkspaceRoot, targetVaultRoot, homeRoot, packet, accountsConnected }) {
  const checkpoints = {};

  // A: Pipeline config exists and is valid
  checkpoints.A_pipeline_config = checkPipelineConfig(targetWorkspaceRoot, accountsConnected);

  // B: Pipeline patches applied (verify gmail_client and basecamp_client read from config)
  checkpoints.B_pipeline_patches = checkPipelinePatches(targetWorkspaceRoot);

  // C: No Viktor pipeline identity
  checkpoints.C_no_viktor_identity = checkNoViktorIdentity(targetWorkspaceRoot);

  // D: Registry is fresh
  checkpoints.D_fresh_registry = checkFreshRegistry(targetWorkspaceRoot);

  // E: First sync completed (if accounts connected)
  checkpoints.E_first_sync = checkFirstSync(targetWorkspaceRoot, accountsConnected);

  // F: Today page rendered (if accounts connected)
  checkpoints.F_today_page = checkTodayPage(targetWorkspaceRoot, accountsConnected);

  // G: Voice profile (if comms connected)
  checkpoints.G_voice_profile = checkVoiceProfile(targetVaultRoot, accountsConnected);

  const allFindings = [];
  let allPassed = true;
  for (const [name, checkpoint] of Object.entries(checkpoints)) {
    checkpoint.findings.forEach(f => { f.checkpoint = name; allFindings.push(f); });
    if (!checkpoint.passed) allPassed = false;
  }

  return {
    passed: allPassed,
    checkpoints,
    findings: allFindings,
    summary: {
      checks: Object.keys(checkpoints).length,
      failures: allFindings.filter(f => f.severity === 'fail').length,
    },
  };
}

function checkPipelineConfig(workspaceRoot, accountsConnected) {
  const findings = [];
  const configPath = path.join(workspaceRoot, 'state', 'runtime', 'pipeline_config.json');
  const config = readJSON(configPath);

  if (!config) {
    findings.push({ severity: 'fail', message: 'pipeline_config.json missing or invalid' });
    return { passed: false, findings };
  }

  if (!config.owner || !config.owner.name) {
    findings.push({ severity: 'fail', message: 'pipeline_config.json missing owner.name' });
  }

  if (!config.accounts) {
    findings.push({ severity: 'fail', message: 'pipeline_config.json missing accounts section' });
  }

  if (!config.sync_engines) {
    findings.push({ severity: 'fail', message: 'pipeline_config.json missing sync_engines section' });
  }

  if (!config.gmail_filters) {
    findings.push({ severity: 'fail', message: 'pipeline_config.json missing gmail_filters section' });
  }

  if (accountsConnected && config.accounts) {
    const gmailCount = (config.accounts.gmail || []).length;
    if (gmailCount === 0 && !config.accounts.basecamp?.connected) {
      findings.push({ severity: 'fail', message: 'Accounts connected but no accounts in pipeline_config' });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

function checkPipelinePatches(workspaceRoot) {
  const findings = [];
  const required = [
    {
      path: path.join(workspaceRoot, 'pipeline', 'lib', 'gmail_client.js'),
      markers: ['getGmailAccounts', 'HARDCODED_ACCOUNTS'],
    },
    {
      path: path.join(workspaceRoot, 'pipeline', 'lib', 'basecamp_client.js'),
      markers: ['getBasecampApiBase', 'FALLBACK_BASECAMP_API_BASE'],
    },
    {
      path: path.join(workspaceRoot, 'pipeline', 'steps', 'gmail_sync.js'),
      markers: ['personal_noise_accounts'],
    },
    {
      path: path.join(workspaceRoot, 'pipeline', 'steps', 'basecamp_sync.js'),
      markers: ['basecamp?.owner?.person_id', 'basecamp?.viktor?.person_id'],
    },
  ];

  for (const check of required) {
    if (!fileExists(check.path)) {
      findings.push({ severity: 'fail', message: `Patched pipeline file missing: ${check.path}` });
      continue;
    }

    const content = fs.readFileSync(check.path, 'utf8');
    for (const marker of check.markers) {
      if (!content.includes(marker)) {
        findings.push({ severity: 'fail', message: `${path.basename(check.path)} missing marker: ${marker}` });
      }
    }
  }
  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

function checkNoViktorIdentity(workspaceRoot) {
  const findings = [];
  const viktorTerms = ['Viktor', 'viktorsl', '3378703', '48400899'];

  const configPath = path.join(workspaceRoot, 'state', 'runtime', 'pipeline_config.json');
  const config = readJSON(configPath);
  if (config) {
    const configStr = JSON.stringify(config);
    for (const term of viktorTerms) {
      if (configStr.includes(term)) {
        findings.push({ severity: 'fail', message: `Viktor identity "${term}" found in pipeline_config.json` });
      }
    }
  }

  const idPath = path.join(workspaceRoot, 'state', 'runtime', 'source_identities.json');
  const identities = readJSON(idPath);
  if (identities) {
    const idStr = JSON.stringify(identities);
    for (const term of viktorTerms) {
      if (idStr.includes(term)) {
        findings.push({ severity: 'fail', message: `Viktor identity "${term}" found in source_identities.json` });
      }
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

function checkFreshRegistry(workspaceRoot) {
  const findings = [];
  const regPath = path.join(workspaceRoot, 'state', 'registry.json');
  const registry = readJSON(regPath);

  if (!registry) {
    findings.push({ severity: 'fail', message: 'registry.json missing or invalid' });
    return { passed: false, findings };
  }

  const regStr = JSON.stringify(registry);
  const viktorIds = ['46649609', '46298394', '1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW', '3378703'];
  for (const id of viktorIds) {
    if (regStr.includes(id)) {
      findings.push({ severity: 'fail', message: `Viktor project data "${id}" found in registry.json` });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

function checkFirstSync(workspaceRoot, accountsConnected) {
  const findings = [];
  if (!accountsConnected) {
    return { passed: true, findings: [{ severity: 'info', message: 'No accounts — sync skipped' }] };
  }

  const syncLogDir = path.join(workspaceRoot, 'state', 'sync_log');
  if (!fileExists(syncLogDir)) {
    findings.push({ severity: 'fail', message: 'sync_log directory missing after first sync' });
  }

  const capturesDir = path.join(workspaceRoot, 'state', 'captures');
  if (!fileExists(capturesDir)) {
    findings.push({ severity: 'fail', message: 'captures directory missing after first sync' });
    return { passed: false, findings };
  }

  // Check at least one capture exists
  const sources = fs.readdirSync(capturesDir, { withFileTypes: true }).filter(d => d.isDirectory());
  let totalCaptures = 0;
  for (const source of sources) {
    const sourceDir = path.join(capturesDir, source.name);
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true }).filter(d => d.isDirectory());
    totalCaptures += entries.length;
  }
  if (totalCaptures === 0) {
    findings.push({ severity: 'fail', message: 'No captures found after first sync' });
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

function checkTodayPage(workspaceRoot, accountsConnected) {
  const findings = [];
  if (!accountsConnected) {
    return { passed: true, findings: [{ severity: 'info', message: 'No accounts — today page skipped' }] };
  }

  const todayPath = path.join(workspaceRoot, 'state', 'derived', 'today.html');
  if (!fileExists(todayPath)) {
    findings.push({ severity: 'fail', message: 'today.html missing after first sync' });
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

function checkVoiceProfile(vaultRoot, accountsConnected) {
  const findings = [];
  if (!accountsConnected) {
    return { passed: true, findings: [{ severity: 'info', message: 'No accounts — voice profile skipped' }] };
  }

  const voicePath = path.join(vaultRoot, 'operator', 'voice.md');
  if (!fileExists(voicePath)) {
    findings.push({ severity: 'fail', message: 'operator/voice.md missing' });
    return { passed: false, findings };
  }

  const content = fs.readFileSync(voicePath, 'utf8');
  const requiredSections = ['Greeting Patterns', 'Sign-Off Patterns', 'Sentence Structure'];
  for (const section of requiredSections) {
    if (!content.includes(section)) {
      findings.push({ severity: 'fail', message: `voice.md missing section: ${section}` });
    }
  }

  return { passed: findings.filter(f => f.severity === 'fail').length === 0, findings };
}

module.exports = { validateSlice3 };
