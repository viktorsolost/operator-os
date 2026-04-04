'use strict';

// ---------------------------------------------------------------------------
// Tool Resolver — pure logic for resolving user workflow tool selections
// against the connector registry. No stdin, no side effects.
// ---------------------------------------------------------------------------

/**
 * Resolve user workflow tool selections against the connector registry.
 *
 * @param {object} opts
 * @param {string[]} opts.selectedTools     - Raw tool names from user input (e.g. ['gmail', 'slack'])
 * @param {string[]} opts.desiredCapabilities - Capabilities user wants synced (e.g. ['email', 'tasks'])
 * @param {object}  opts.registry           - Registry object from loadRegistry()
 * @returns {object} workflow_tools packet
 */
function resolveWorkflowTools({ selectedTools, desiredCapabilities, registry }) {
  const selected_tools = (selectedTools || []).map((t) => t.toLowerCase().trim()).filter(Boolean);
  const desired_capabilities = (desiredCapabilities || []).map((c) => c.toLowerCase().trim()).filter(Boolean);
  const resolved = {};

  for (const tool of selected_tools) {
    // Try exact id match first, then display_name match (case-insensitive)
    let manifest = registry.connectors.get(tool);

    if (!manifest) {
      // Search by display_name
      for (const m of registry.connectors.values()) {
        if (m.display_name && m.display_name.toLowerCase().includes(tool)) {
          manifest = m;
          break;
        }
      }
    }

    if (manifest) {
      resolved[tool] = {
        status: 'supported',
        connector_id: manifest.id,
        display_name: manifest.display_name,
        connector_status: manifest.status || 'unknown',
      };
    } else {
      resolved[tool] = {
        status: 'unsupported',
        reason: `No installed adapter for ${tool}`,
      };
    }
  }

  return {
    selected_tools,
    desired_capabilities,
    resolved,
  };
}

/**
 * Format the connector resolution summary as an array of human-readable lines.
 *
 * @param {object} workflowTools - workflow_tools packet from resolveWorkflowTools()
 * @returns {string[]} lines to print (empty array if no tools selected)
 */
function formatConnectorSummary(workflowTools) {
  if (!workflowTools || !workflowTools.selected_tools || workflowTools.selected_tools.length === 0) {
    return [];
  }

  const lines = ['Connectors:'];

  for (const tool of workflowTools.selected_tools) {
    const resolution = workflowTools.resolved[tool];
    if (!resolution) continue;

    if (resolution.status === 'supported') {
      const displayName = resolution.display_name || tool;
      const connStatus = resolution.connector_status || 'unknown';
      lines.push(`  \u2713 ${displayName} \u2014 supported (${connStatus})`);
    } else {
      const displayName = tool.charAt(0).toUpperCase() + tool.slice(1);
      lines.push(`  \u2717 ${displayName} \u2014 unsupported (no adapter installed)`);
    }
  }

  lines.push('');
  lines.push('To add support for unsupported tools, install their adapter in:');
  lines.push('  instantiation/connectors/adapters/');

  return lines;
}

module.exports = { resolveWorkflowTools, formatConnectorSummary };
