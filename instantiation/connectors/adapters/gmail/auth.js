'use strict';

// ---------------------------------------------------------------------------
// Gmail Auth Adapter
// Wraps the gws CLI auth flow to implement the auth adapter contract.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const { createAuthResult } = require('../../auth_adapter');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/') || p === '~') {
    return path.join(process.env.HOME || process.env.USERPROFILE || '', p.slice(1));
  }
  return p;
}

function verifyGwsAuth(configDir) {
  try {
    execSync('gws gmail users getProfile --params \'{"userId":"me"}\'', {
      env: { ...process.env, GOOGLE_WORKSPACE_CLI_CONFIG_DIR: configDir },
      stdio: 'pipe',
    });
    return true;
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth adapter implementation
// ---------------------------------------------------------------------------

/**
 * Secrets this adapter requires.
 * The gws config directory acts as the credential store location.
 */
const required_secrets = ['gws_config_dir'];

/**
 * Run `gws auth login` interactively.
 * config must include: config_dir, label (optional).
 */
function start_auth({ config_dir, label } = {}) {
  try {
    if (!config_dir) {
      return createAuthResult({ connected: false, error: 'config_dir is required' });
    }
    const expandedDir = expandHome(config_dir);
    if (!fs.existsSync(expandedDir)) {
      fs.mkdirSync(expandedDir, { recursive: true });
    }
    if (label) {
      console.log(`Authenticating ${label}...`);
    }
    const result = spawnSync('gws', ['auth', 'login'], {
      env: { ...process.env, GOOGLE_WORKSPACE_CLI_CONFIG_DIR: expandedDir },
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      return createAuthResult({ connected: false, error: 'gws auth login failed' });
    }
    const verified = verifyGwsAuth(expandedDir);
    if (!verified) {
      return createAuthResult({ connected: false, error: 'gws auth verification failed after login' });
    }
    return createAuthResult({ connected: true });
  } catch (e) {
    return createAuthResult({ connected: false, error: e.message || String(e) });
  }
}

/**
 * Verify that gws auth is working by calling getProfile.
 * config must include: config_dir.
 */
function finish_auth({ config_dir } = {}) {
  try {
    if (!config_dir) {
      return createAuthResult({ connected: false, error: 'config_dir is required' });
    }
    const expandedDir = expandHome(config_dir);
    const verified = verifyGwsAuth(expandedDir);
    if (!verified) {
      return createAuthResult({ connected: false, error: 'gws auth verification failed' });
    }
    return createAuthResult({ connected: true });
  } catch (e) {
    return createAuthResult({ connected: false, error: e.message || String(e) });
  }
}

/**
 * No-op — gws manages its own token refresh internally.
 */
function refresh() {
  return createAuthResult({ connected: true });
}

/**
 * Revocation is manual for gws — we cannot programmatically revoke without
 * deleting the credentials, which is destructive and may affect other tooling.
 */
function revoke() {
  return createAuthResult({
    connected: false,
    metadata: { note: 'manual revocation required' },
  });
}

/**
 * Check current auth status by calling getProfile.
 * config must include: config_dir.
 */
function status({ config_dir } = {}) {
  try {
    if (!config_dir) {
      return createAuthResult({ connected: false, error: 'config_dir is required' });
    }
    const expandedDir = expandHome(config_dir);
    const verified = verifyGwsAuth(expandedDir);
    return createAuthResult({ connected: verified });
  } catch (e) {
    return createAuthResult({ connected: false, error: e.message || String(e) });
  }
}

module.exports = {
  required_secrets,
  start_auth,
  finish_auth,
  refresh,
  revoke,
  status,
};
