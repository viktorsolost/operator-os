'use strict';

// ---------------------------------------------------------------------------
// Gmail Sync Adapter
// Wraps the pipeline CLI to drive Gmail, Calendar, Drive, and Sheets sync
// through a single connector. Calendar, Drive, and Sheets are capabilities
// of the same Google Workspace authentication used by Gmail.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createSyncResult } = require('../../sync_adapter');

// Sub-steps this adapter manages
const GMAIL_STEPS = ['gmail_sync'];
const SUPPLEMENTAL_STEPS = ['calendar_sync', 'drive_sync', 'sheets_sync'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveCliPath(workspaceRoot) {
  return path.join(workspaceRoot, 'pipeline', 'cli', 'run.js');
}

function runStep(cliPath, stepName, workspaceRoot) {
  const result = spawnSync(process.execPath, [cliPath, stepName], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: process.env,
  });
  const succeeded = result.status === 0 && !result.error;
  return {
    step: stepName,
    success: succeeded,
    error: succeeded
      ? undefined
      : (result.error ? result.error.message : (result.stderr || `exit code ${result.status}`)),
  };
}

function resolveSteps(config) {
  const steps = [...GMAIL_STEPS];
  const engines = (config.pipelineConfig && config.pipelineConfig.sync_engines) || {};
  if (engines.calendar) steps.push('calendar_sync');
  if (engines.drive) steps.push('drive_sync');
  if (engines.sheets) steps.push('sheets_sync');
  return steps;
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
 * Run all enabled pipeline steps. Gmail sync is always run. Supplemental
 * steps (calendar, drive, sheets) run only when enabled in pipelineConfig.
 * Partial success is acceptable — failures are collected but do not abort.
 * Returns success: true if at least gmail_sync succeeded.
 */
function initial_sync(config) {
  const validation = validate_config(config);
  if (!validation.success) return validation;

  const cliPath = resolveCliPath(config.workspaceRoot);
  const stepsToRun = resolveSteps(config);
  const results = [];
  const errors = [];

  for (const stepName of stepsToRun) {
    const r = runStep(cliPath, stepName, config.workspaceRoot);
    results.push(r);
    if (!r.success) {
      errors.push(`${stepName}: ${r.error}`);
    }
  }

  const gmailResult = results.find(r => r.step === 'gmail_sync');
  const gmailSucceeded = gmailResult ? gmailResult.success : false;
  const stepsSucceeded = results.filter(r => r.success).length;

  return createSyncResult({
    success: gmailSucceeded,
    data: { steps: results },
    errors,
    metadata: { steps_run: results.length, steps_succeeded: stepsSucceeded },
  });
}

/**
 * Incremental sync uses the same pipeline CLI steps. The pipeline handles
 * checkpoint-based incrementality internally.
 */
function incremental_sync(config) {
  return initial_sync(config);
}

/**
 * Verify the pipeline CLI exists. Auth health is managed by the auth adapter;
 * this adapter only checks that the sync tooling is in place.
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
