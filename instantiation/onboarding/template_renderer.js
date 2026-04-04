'use strict';

const fs = require('fs');
const path = require('path');
const { resolvePlaceholders, findUnresolvedMarkers } = require('../shared/template_utils');

/**
 * Build the placeholder → value map from the onboarding packet.
 */
function buildPlaceholderMap(packet) {
  return {
    owner_name: packet.owner_name,
    system_name: packet.system_name,
    vault_location: packet.vault_location,
    workspace_root: packet.workspace_root,
    timezone: packet.timezone,
    home_root: packet.home_root,
  };
}

/**
 * Render all runtime bridge templates from the installer manifest.
 *
 * @param {object} installerManifest - from buildInstallerManifest (has bridgeTemplates array)
 * @param {object} packet - validated onboarding input packet
 * @returns {object} Report: { written: string[], errors: {id, error}[] }
 */
function renderBridgeTemplates(installerManifest, packet) {
  const report = { written: [], errors: [] };

  if (!installerManifest.bridgeTemplates || !Array.isArray(installerManifest.bridgeTemplates)) {
    return report;
  }

  const placeholderMap = buildPlaceholderMap(packet);

  for (const bridge of installerManifest.bridgeTemplates) {
    try {
      if (!fs.existsSync(bridge.source)) {
        report.errors.push({ id: bridge.id, error: `source template not found: ${bridge.source}` });
        continue;
      }

      const raw = fs.readFileSync(bridge.source, 'utf8');
      const rendered = resolvePlaceholders(raw, placeholderMap);

      // Verify no unresolved markers
      const unresolved = findUnresolvedMarkers(rendered);
      if (unresolved.length > 0) {
        report.errors.push({ id: bridge.id, error: `unresolved placeholders: ${unresolved.join(', ')}` });
        continue;
      }

      // Write rendered content
      const targetDir = path.dirname(bridge.target);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(bridge.target, rendered, 'utf8');
      report.written.push(bridge.target);
    } catch (err) {
      report.errors.push({ id: bridge.id, error: err.message });
    }
  }

  return report;
}

module.exports = { renderBridgeTemplates, resolvePlaceholders, findUnresolvedMarkers, buildPlaceholderMap };
