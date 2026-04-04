'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Generate a fresh registry.json for a new user.
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet
 * @param {string} options.targetWorkspaceRoot
 * @returns {object} Report: { registryPath, registry }
 */
function bootstrapRegistry({ packet, targetWorkspaceRoot }) {
  const projects = [];

  // If project_categories provided, create skeleton entries
  if (packet.project_categories && Array.isArray(packet.project_categories)) {
    for (const category of packet.project_categories) {
      projects.push({
        project_id: `${category}-placeholder`,
        name: `${category} (define in onboarding)`,
        type: category,
        status: 'intake',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aliases: [],
        source_refs: {},
      });
    }
  }

  const registry = {
    shared_sources: [],
    projects: projects,
  };

  const registryDir = path.join(targetWorkspaceRoot, 'state');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }

  const registryPath = path.join(registryDir, 'registry.json');
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');

  return { registryPath, registry };
}

module.exports = { bootstrapRegistry };
