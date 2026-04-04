'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * Run the first pipeline sync after account connection.
 *
 * In real mode, this would invoke actual pipeline sync steps.
 * In dry test / mock mode, it accepts pre-built sync results.
 *
 * @param {object} options
 * @param {object} options.pipelineConfig - from pipeline_configurator
 * @param {string} options.targetWorkspaceRoot
 * @param {object} [options.mockSyncResults] - pre-built results for testing
 * @returns {object} Sync result
 */
function runFirstSync({ pipelineConfig, targetWorkspaceRoot, mockSyncResults }) {
  // If no sync engines enabled, skip
  const engines = pipelineConfig.sync_engines || {};
  const anyEnabled = Object.values(engines).some(v => v === true);

  if (!anyEnabled) {
    return {
      success: true,
      skipped: true,
      reason: 'No sync engines enabled',
      summary: { sources: 0, captures: 0 },
    };
  }

  // Mock path for dry testing — must stay unchanged
  if (mockSyncResults) {
    return applyMockSyncResults(mockSyncResults, targetWorkspaceRoot);
  }

  // Use planner-driven sync if connector state is available
  if (pipelineConfig.connectors && Array.isArray(pipelineConfig.connectors.enabled) && pipelineConfig.connectors.enabled.length > 0) {
    return runPlannerSync(pipelineConfig, targetWorkspaceRoot);
  }

  // Legacy fallback for configs without connector state
  return runLiveSync(pipelineConfig, targetWorkspaceRoot);
}

/**
 * Apply mock sync results to the target workspace.
 * Creates capture dirs, sync logs, and derived files to simulate a real sync.
 */
function applyMockSyncResults(mockResults, targetWorkspaceRoot) {
  const stateDir = path.join(targetWorkspaceRoot, 'state');
  const capturesDir = path.join(stateDir, 'captures');
  const derivedDir = path.join(stateDir, 'derived');
  const syncLogDir = path.join(stateDir, 'sync_log');

  // Ensure directories exist
  for (const dir of [capturesDir, derivedDir, syncLogDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  let totalCaptures = 0;
  const sourcesProcessed = [];

  // Write mock captures per source
  for (const [source, captures] of Object.entries(mockResults.captures || {})) {
    const sourceDir = path.join(capturesDir, source);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }

    for (const capture of captures) {
      const captureDir = path.join(sourceDir, capture.id);
      if (!fs.existsSync(captureDir)) {
        fs.mkdirSync(captureDir, { recursive: true });
      }
      const capturePath = path.join(captureDir, `${new Date().toISOString().replace(/:/g, '-')}.json`);
      fs.writeFileSync(capturePath, JSON.stringify(capture.data, null, 2) + '\n', 'utf8');
      totalCaptures++;
    }

    sourcesProcessed.push(source);
  }

  // Write mock sync logs
  for (const [source, logData] of Object.entries(mockResults.syncLogs || {})) {
    const logPath = path.join(syncLogDir, `${source}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2) + '\n', 'utf8');
  }

  // Write mock derived files
  for (const [filename, content] of Object.entries(mockResults.derived || {})) {
    const derivedPath = path.join(derivedDir, filename);
    const derivedFileDir = path.dirname(derivedPath);
    if (!fs.existsSync(derivedFileDir)) {
      fs.mkdirSync(derivedFileDir, { recursive: true });
    }
    if (typeof content === 'string') {
      fs.writeFileSync(derivedPath, content, 'utf8');
    } else {
      fs.writeFileSync(derivedPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    }
  }

  return {
    success: true,
    skipped: false,
    summary: {
      sources: sourcesProcessed.length,
      captures: totalCaptures,
      sourcesProcessed,
    },
  };
}

/**
 * Planner-driven sync: uses the connector planner (buildExecutionPlan + executeStages)
 * to drive source sync. Supplemental and derivation steps not yet modelled as connectors
 * are run in the legacy way after the planner completes.
 */
function runPlannerSync(pipelineConfig, targetWorkspaceRoot) {
  const { buildExecutionPlan, executeStages } = require('../connectors/planner');
  const { loadRegistry } = require('../connectors/registry');
  const { getEnabledConnectorManifests } = require('./pipeline_configurator');

  const ADAPTERS_DIR = path.resolve(__dirname, '..', 'connectors', 'adapters');
  const registry = loadRegistry(ADAPTERS_DIR);
  const enabledManifests = getEnabledConnectorManifests(pipelineConfig, registry);

  // If no connectors resolved, fall back to legacy
  if (enabledManifests.length === 0) {
    return runLiveSync(pipelineConfig, targetWorkspaceRoot);
  }

  const plan = buildExecutionPlan(enabledManifests);
  if (!plan.valid) {
    // Invalid plan — fall back to legacy with warning
    console.log('Warning: execution plan invalid, falling back to legacy sync');
    return runLiveSync(pipelineConfig, targetWorkspaceRoot);
  }

  const nodeBin = process.execPath;
  const cliPath = path.join(targetWorkspaceRoot, 'pipeline', 'cli', 'run.js');

  if (!fs.existsSync(cliPath)) {
    return {
      success: false,
      skipped: false,
      reason: `Missing pipeline CLI at ${cliPath}`,
      summary: { sources: 0, captures: 0 },
      plannerDriven: true,
    };
  }

  const executorFn = (connector, stage) => {
    let stepName;
    if (stage === 'source_sync') {
      stepName = `${connector.id}_sync`;
    } else if (stage === 'derivation') {
      stepName = connector.id;
    } else {
      // preflight, post_sync — no CLI step currently
      return { success: true };
    }

    const run = spawnSync(nodeBin, [cliPath, stepName], {
      cwd: targetWorkspaceRoot,
      encoding: 'utf8',
      env: process.env,
    });

    if (run.status !== 0) {
      return { success: false, error: `Step ${stepName} failed (exit ${run.status})` };
    }
    return { success: true };
  };

  const plannerResult = executeStages(plan.plan, executorFn);

  // After planner-driven source_sync, run supplemental steps not yet in connectors
  // (calendar, drive, sheets are implied by gmail, not separate connectors yet)
  const supplementalSteps = [];
  if (pipelineConfig.sync_engines.calendar) supplementalSteps.push('calendar_sync');
  if (pipelineConfig.sync_engines.drive) supplementalSteps.push('drive_sync');
  if (pipelineConfig.sync_engines.sheets) supplementalSteps.push('sheets_sync');

  const supplementalResults = [];
  for (const step of supplementalSteps) {
    const run = spawnSync(nodeBin, [cliPath, step], {
      cwd: targetWorkspaceRoot,
      encoding: 'utf8',
      env: process.env,
    });
    supplementalResults.push({ step, status: run.status, success: run.status === 0 });
  }

  // Run derivation steps if at least one source succeeded.
  // store_enrich and derive_all are not yet connector-modelled, so run them here.
  const derivationSteps = ['store_enrich', 'derive_all'];
  const derivationResults = [];

  const sourceSyncStage = plannerResult.stages.find(s => s.stage === 'source_sync');
  const anySourceSuccess =
    (sourceSyncStage && sourceSyncStage.results.some(r => r.success)) ||
    supplementalResults.some(r => r.success);

  if (anySourceSuccess) {
    for (const step of derivationSteps) {
      const run = spawnSync(nodeBin, [cliPath, step], {
        cwd: targetWorkspaceRoot,
        encoding: 'utf8',
        env: process.env,
      });
      derivationResults.push({ step, status: run.status, success: run.status === 0 });
    }
  }

  const allSteps = [
    ...plannerResult.stages.flatMap(s => s.results.map(r => `${r.connector_id}_sync`)),
    ...supplementalSteps,
    ...derivationSteps,
  ];

  return {
    success: plannerResult.success,
    skipped: false,
    plannerDriven: true,
    plannerResult,
    supplemental: supplementalResults,
    derivation: derivationResults,
    summary: {
      sources: (sourceSyncStage ? sourceSyncStage.results.filter(r => r.success).length : 0) +
        supplementalResults.filter(r => r.success).length,
      captures: 0,
      steps: allSteps,
    },
  };
}

/**
 * Legacy sync: hardcoded step list. Used as fallback when no connector state is present.
 * @legacy
 */
function runLiveSync(pipelineConfig, targetWorkspaceRoot) {
  const nodeBin = process.execPath;
  const cliPath = path.join(targetWorkspaceRoot, 'pipeline', 'cli', 'run.js');
  const results = [];

  const steps = [];
  if (pipelineConfig.sync_engines.basecamp) steps.push('basecamp_sync');
  if (pipelineConfig.sync_engines.gmail) steps.push('gmail_sync');
  if (pipelineConfig.sync_engines.calendar) steps.push('calendar_sync');
  if (pipelineConfig.sync_engines.drive) steps.push('drive_sync');
  if (pipelineConfig.sync_engines.sheets) steps.push('sheets_sync');
  steps.push('store_enrich', 'derive_all');

  if (!fs.existsSync(cliPath)) {
    return {
      success: false,
      skipped: false,
      reason: `Missing pipeline CLI at ${cliPath}`,
      summary: { sources: 0, captures: 0, steps },
      steps: [],
    };
  }

  for (const step of steps) {
    const run = spawnSync(nodeBin, [cliPath, step], {
      cwd: targetWorkspaceRoot,
      encoding: 'utf8',
      env: process.env,
    });

    results.push({
      step,
      status: run.status,
      stdout: run.stdout,
      stderr: run.stderr,
    });

    if (run.status !== 0) {
      return {
        success: false,
        skipped: false,
        reason: `Pipeline step failed: ${step}`,
        summary: { sources: steps.length, captures: 0, steps },
        steps: results,
      };
    }
  }

  return {
    success: true,
    skipped: false,
    summary: {
      sources: steps.filter((step) => !['store_enrich', 'derive_all'].includes(step)).length,
      captures: 0,
      steps,
    },
    steps: results,
  };
}

module.exports = { runFirstSync };
