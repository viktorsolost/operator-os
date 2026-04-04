'use strict';

// ---------------------------------------------------------------------------
// Basecamp Sync Adapter
// Wraps the pipeline CLI to drive Basecamp project, todo, message, and
// comment sync through a single connector step.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createSyncResult } = require('../../sync_adapter');

const BASECAMP_STEP = 'basecamp_sync';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveCliPath(workspaceRoot) {
  return path.join(workspaceRoot, 'pipeline', 'cli', 'run.js');
}

function resolveHomeRoot(config) {
  return config.homeRoot || process.env.HOME || '~';
}

// ---------------------------------------------------------------------------
// Sync adapter implementation
// ---------------------------------------------------------------------------

/**
 * Validate that the workspace root and pipeline CLI exist.
 */
function validate_config(config) {
  if (!config || !config.workspaceRoot) {
    return createSyncResult({ success: false, errors: ["'workspaceRoot' is required in config"] });
  }

  if (!fs.existsSync(config.workspaceRoot)) {
    return createSyncResult({
      success: false,
      errors: [`workspaceRoot does not exist: ${config.workspaceRoot}`],
    });
  }

  const cliPath = resolveCliPath(config.workspaceRoot);
  if (!fs.existsSync(cliPath)) {
    return createSyncResult({
      success: false,
      errors: [`pipeline CLI not found at: ${cliPath}`],
    });
  }

  return createSyncResult({ success: true });
}

/**
 * Run the basecamp_sync pipeline step.
 */
function initial_sync(config) {
  const validation = validate_config(config);
  if (!validation.success) return validation;

  const cliPath = resolveCliPath(config.workspaceRoot);
  const result = spawnSync(process.execPath, [cliPath, BASECAMP_STEP], {
    cwd: config.workspaceRoot,
    encoding: 'utf8',
    env: process.env,
  });

  const succeeded = result.status === 0 && !result.error;
  const errors = succeeded
    ? []
    : [`${BASECAMP_STEP}: ${result.error ? result.error.message : (result.stderr || `exit code ${result.status}`)}`];

  return createSyncResult({
    success: succeeded,
    data: { steps: [{ step: BASECAMP_STEP, success: succeeded }] },
    errors,
    metadata: { steps_run: 1, steps_succeeded: succeeded ? 1 : 0 },
  });
}

/**
 * Incremental sync delegates to initial_sync — the pipeline handles
 * checkpoint-based incrementality internally.
 */
function incremental_sync(config) {
  return initial_sync(config);
}

/**
 * Verify the pipeline CLI exists and Basecamp auth files are in place.
 */
function healthcheck(config) {
  if (!config || !config.workspaceRoot) {
    return createSyncResult({ success: false, errors: ["'workspaceRoot' is required in config"] });
  }

  const cliPath = resolveCliPath(config.workspaceRoot);
  if (!fs.existsSync(cliPath)) {
    return createSyncResult({
      success: false,
      errors: [`pipeline CLI not found at: ${cliPath}`],
    });
  }

  const homeRoot = resolveHomeRoot(config);
  const envFile = path.join(homeRoot, '.env.basecamp');
  const tokensFile = path.join(homeRoot, '.env.basecamp.tokens');
  const missingAuth = [];

  if (!fs.existsSync(envFile)) missingAuth.push(envFile);
  if (!fs.existsSync(tokensFile)) missingAuth.push(tokensFile);

  if (missingAuth.length > 0) {
    return createSyncResult({
      success: false,
      errors: missingAuth.map(f => `auth file not found: ${f}`),
    });
  }

  return createSyncResult({ success: true, metadata: { cli_path: cliPath } });
}

/**
 * No-op — the pipeline normalizes data internally during sync steps.
 */
function normalize(data) {
  return createSyncResult({ success: true, data });
}

module.exports = {
  validate_config,
  initial_sync,
  incremental_sync,
  healthcheck,
  normalize,
};
