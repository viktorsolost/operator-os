'use strict';

const { validateOnboardingInputs } = require('./questionnaire');
const { renderBridgeTemplates } = require('./template_renderer');
const { renderSourceFiles } = require('./source_renderer');
const { generateFreshSurfaces } = require('./fresh_generator');
const { validateOnboardingOutput } = require('./validator');
const { connectAccounts, reconnectAccounts, writeSourceIdentities } = require('./account_connector');
const { generatePipelineConfig, generateEmptyPipelineConfig, getEnabledConnectorManifests } = require('./pipeline_configurator');
const { buildExecutionPlan } = require('../connectors/planner');
const { loadRegistry } = require('../connectors/registry');

const ADAPTERS_DIR = require('path').resolve(__dirname, '..', 'connectors', 'adapters');
const { bootstrapRegistry } = require('./registry_bootstrapper');
const { runFirstSync } = require('./first_sync');
const { runVoiceProfiler } = require('./voice_profiler');
const { validateSlice3 } = require('./slice3_validator');

/**
 * Run the complete onboarding pipeline.
 *
 * @param {object} options
 * @param {object} options.installerManifest - from buildInstallerManifest (Slice 1)
 * @param {object} options.onboardingAnswers - raw answers (validated by questionnaire)
 * @param {string} options.templateSourceRoot - path to instantiation/templates/
 * @param {string} options.targetInstallRoot - root of generated instance (vault location)
 * @param {string} options.homeRoot - target user's home directory
 * @returns {object} Combined result with pipeline reports and validation
 */
function runOnboarding({ installerManifest, onboardingAnswers, templateSourceRoot, targetInstallRoot, homeRoot, manifestPath }) {
  // 1. Validate onboarding inputs
  const packet = validateOnboardingInputs(onboardingAnswers);

  // 2. Render runtime bridge templates (only for selected runtimes)
  const bridgeReport = renderBridgeTemplates(installerManifest, packet);
  if (bridgeReport.errors.length > 0) {
    return {
      success: false,
      phase: 'bridge_rendering',
      errors: bridgeReport.errors,
      packet,
    };
  }

  // 3. Render source files (Viktor → owner swaps on vault doctrine files)
  const sourceReport = renderSourceFiles(installerManifest, packet);
  if (sourceReport.errors.length > 0) {
    return {
      success: false,
      phase: 'source_rendering',
      errors: sourceReport.errors,
      packet,
    };
  }

  // 4. Generate fresh surfaces (identity, memory, etc.)
  const freshReport = generateFreshSurfaces(packet, installerManifest, templateSourceRoot, targetInstallRoot, { manifestPath });
  if (freshReport.errors.length > 0) {
    return {
      success: false,
      phase: 'fresh_generation',
      errors: freshReport.errors,
      packet,
    };
  }

  // 5. Validate the complete instance
  const validation = validateOnboardingOutput(installerManifest, packet, targetInstallRoot, homeRoot);

  return {
    success: validation.passed,
    phase: 'complete',
    packet,
    reports: {
      bridges: bridgeReport,
      sources: sourceReport,
      fresh: freshReport,
    },
    validation,
  };
}

/**
 * Run Slice 3 onboarding (accounts, pipeline config, first sync, voice).
 * This runs AFTER Slice 2 onboarding (runOnboarding) has completed.
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet (from runOnboarding)
 * @param {string} options.targetInstallRoot - vault root
 * @param {string} options.homeRoot
 * @param {string} options.targetWorkspaceRoot
 * @param {object} [options.mockConnections] - for dry testing
 * @param {object} [options.mockSyncResults] - for dry testing
 * @param {object} [options.mockCapturedData] - for dry testing (voice profiler)
 * @returns {object}
 */
function runSlice3Onboarding({ packet, targetInstallRoot, homeRoot, targetWorkspaceRoot, mementoSourceRoot, mockConnections, mockSyncResults, mockCapturedData, interactive }) {
  // 1. Connect accounts
  const connections = connectAccounts({ packet, mockConnections, interactive });

  // 2. Write source identities
  if (connections.sourceIdentities && Object.keys(connections.sourceIdentities).length > 0) {
    writeSourceIdentities(connections.sourceIdentities, targetWorkspaceRoot);
  } else {
    // Write empty source identities
    writeSourceIdentities({}, targetWorkspaceRoot);
  }

  // 3. Generate pipeline config
  const pipelineResult = connections.skipped
    ? generateEmptyPipelineConfig({ packet, targetWorkspaceRoot, mementoSourceRoot })
    : generatePipelineConfig({ packet, accountConnections: connections, targetWorkspaceRoot, mementoSourceRoot });

  // 3a. Validate execution plan against enabled connectors
  const connectorRegistry = loadRegistry(ADAPTERS_DIR);
  const enabledManifests = getEnabledConnectorManifests(pipelineResult.config, connectorRegistry);
  const executionPlan = buildExecutionPlan(enabledManifests);

  // 4. Bootstrap registry
  const registryResult = bootstrapRegistry({ packet, targetWorkspaceRoot });

  // 5. First sync (if accounts connected)
  let syncResult = { success: true, skipped: true, reason: 'No accounts connected' };
  if (!connections.skipped) {
    syncResult = runFirstSync({
      pipelineConfig: pipelineResult.config,
      targetWorkspaceRoot,
      mockSyncResults,
    });
  }

  // 6. Voice profiler (if comms connected and sync completed)
  let voiceResult = { success: true, skipped: true, reason: 'Prerequisites not met' };
  if (!connections.skipped && !syncResult.skipped) {
    voiceResult = runVoiceProfiler({
      pipelineConfig: pipelineResult.config,
      sourceIdentities: connections.sourceIdentities,
      targetWorkspaceRoot,
      targetVaultRoot: targetInstallRoot,
      mockCapturedData,
    });
  }

  // 7. Validate
  const validation = validateSlice3({
    pipelineConfig: pipelineResult.config,
    targetWorkspaceRoot,
    targetVaultRoot: targetInstallRoot,
    homeRoot,
    packet,
    accountsConnected: !connections.skipped && (
      (connections.gmail || []).some(a => a.connected) ||
      (connections.basecamp && connections.basecamp.connected)
    ),
  });

  return {
    success: validation.passed,
    phase: 'slice3_complete',
    connections,
    pipelineConfig: pipelineResult,
    executionPlan,
    registry: registryResult,
    sync: syncResult,
    voice: voiceResult,
    validation,
  };
}

module.exports = { runOnboarding, runSlice3Onboarding, reconnectAccounts };
