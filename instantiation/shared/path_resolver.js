'use strict';

const path = require('path');
const { isRuntimeEnabled } = require('./runtime_selector');

// ---------------------------------------------------------------------------
// Forbidden source-machine roots — inputs must never contain these
// ---------------------------------------------------------------------------
const FORBIDDEN_ROOTS = [
  '/Users/viktorsl',
  '/Volumes/BackBone',
];

// ---------------------------------------------------------------------------
// Deep-freeze helper
// ---------------------------------------------------------------------------
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.keys(obj).forEach((key) => deepFreeze(obj[key]));
  return Object.freeze(obj);
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
function assertRequired(value, name) {
  if (value === null || value === undefined) {
    throw new Error(`resolveInstallerPaths: required input "${name}" is null or undefined`);
  }
}

function assertNoForbiddenRoots(value, name) {
  for (const forbidden of FORBIDDEN_ROOTS) {
    if (typeof value === 'string' && value.includes(forbidden)) {
      throw new Error(
        `resolveInstallerPaths: input "${name}" contains forbidden source-machine root "${forbidden}" — ` +
          'all paths must be target-local'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Runtime path builders
// ---------------------------------------------------------------------------
function buildCodexPaths(home_root) {
  const root = path.join(home_root, '.codex');
  return {
    bridge: path.join(root, 'instructions.md'),
    config: path.join(root, 'config.toml'),
    root,
  };
}

function buildClaudePaths(home_root) {
  const root = path.join(home_root, '.claude');
  return {
    bridge: path.join(root, 'CLAUDE.md'),
    settings: path.join(root, 'settings.json'),
    root,
  };
}

function buildGeminiPaths(home_root) {
  const root = path.join(home_root, '.gemini');
  return {
    bridge: path.join(root, 'GEMINI.md'),
    settings: path.join(root, 'settings.json'),
    projects: path.join(root, 'projects.json'),
    trustedFolders: path.join(root, 'trustedFolders.json'),
    root,
  };
}

function buildOpenClawPaths(home_root) {
  const root = path.join(home_root, '.openclaw');
  const workspace = path.join(root, 'workspace');
  return {
    bridgeStart: path.join(workspace, 'START_HERE.md'),
    bridgeAgents: path.join(workspace, 'AGENTS.md'),
    config: path.join(root, 'openclaw.json'),
    workspace,
    root,
  };
}

const RUNTIME_BUILDERS = {
  Codex: buildCodexPaths,
  Claude: buildClaudePaths,
  Gemini: buildGeminiPaths,
  OpenClaw: buildOpenClawPaths,
};

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------
function resolveInstallerPaths({
  target_install_root,
  home_root,
  vault_location,
  workspace_root,
  runtimeSelection,
}) {
  // --- Validate required inputs ---
  assertRequired(target_install_root, 'target_install_root');
  assertRequired(home_root, 'home_root');
  assertRequired(vault_location, 'vault_location');
  assertRequired(workspace_root, 'workspace_root');
  assertRequired(runtimeSelection, 'runtimeSelection');

  // --- Reject forbidden source-machine roots ---
  const stringInputs = { target_install_root, home_root, vault_location, workspace_root };
  for (const [name, value] of Object.entries(stringInputs)) {
    assertNoForbiddenRoots(value, name);
  }

  // --- Build vault paths ---
  const vault = {
    root: vault_location,
    boot: path.join(vault_location, 'BOOT.md'),
    routing: path.join(vault_location, 'ROUTING.md'),
    structure: path.join(vault_location, 'STRUCTURE.md'),
    operator: path.join(vault_location, 'operator'),
    templates: path.join(vault_location, 'templates'),
    domains: path.join(vault_location, 'domains'),
    projectTypes: path.join(vault_location, 'project-types'),
    brands: path.join(vault_location, 'brands'),
    memory: path.join(vault_location, 'memory.md'),
    recentContext: path.join(vault_location, 'recent-context.md'),
    identity: path.join(vault_location, 'operator', 'identity.md'),
  };

  // --- Build enabled runtime paths ---
  const runtimes = {};
  for (const [runtimeName, builder] of Object.entries(RUNTIME_BUILDERS)) {
    if (isRuntimeEnabled(runtimeSelection, runtimeName)) {
      runtimes[runtimeName] = builder(home_root);
    }
  }

  // --- Assemble final map ---
  const pathMap = {
    vault,
    runtimes,
    workspace: {
      root: workspace_root,
    },
    home: home_root,
    installRoot: target_install_root,
  };

  return deepFreeze(pathMap);
}

// ---------------------------------------------------------------------------
// Helper accessor — dot-notation key lookup
// ---------------------------------------------------------------------------
function getPathFor(pathMap, key) {
  if (typeof key !== 'string') {
    throw new Error(`getPathFor: key must be a string, got ${typeof key}`);
  }
  const parts = key.split('.');
  let current = pathMap;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      throw new Error(`getPathFor: cannot traverse key "${key}" — segment "${part}" is not reachable`);
    }
    current = current[part];
  }
  if (current === undefined) {
    throw new Error(`getPathFor: key "${key}" not found in path map`);
  }
  return current;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  resolveInstallerPaths,
  getPathFor,
};
