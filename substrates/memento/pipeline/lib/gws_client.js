/**
 * Google Workspace CLI (gws) wrapper.
 *
 * Executes gws commands via subprocess and returns parsed JSON output.
 * Account switching via GOOGLE_WORKSPACE_CLI_CONFIG_DIR env var.
 */

const { execFile } = require('child_process');
const path = require('path');

const GWS_BIN = '/opt/homebrew/bin/gws';

/**
 * Execute a gws command and return parsed JSON output.
 *
 * @param {string} service - e.g., "gmail", "calendar", "drive"
 * @param {string} resource - e.g., "users messages"
 * @param {string} method - e.g., "list", "get"
 * @param {object} params - Parameters object passed via --params
 * @param {string} configDir - Config directory for account selection
 * @returns {Promise<object>} Parsed JSON response
 */
function gws(service, resource, method, params, configDir) {
  return new Promise((resolve, reject) => {
    const args = [service, ...resource.split(' '), method];
    if (params && Object.keys(params).length > 0) {
      args.push('--params', JSON.stringify(params));
    }

    const env = { ...process.env };
    if (configDir) {
      env.GOOGLE_WORKSPACE_CLI_CONFIG_DIR = configDir.startsWith('~')
        ? path.join(process.env.HOME, configDir.slice(1))
        : configDir;
    }

    execFile(GWS_BIN, args, { env, maxBuffer: 50 * 1024 * 1024, timeout: 60000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = stderr?.trim() || err.message;
        reject(new Error(`gws ${service} ${resource} ${method} failed: ${msg}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (parseErr) {
        // Some gws commands return non-JSON. Return raw stdout.
        resolve({ _raw: stdout.trim() });
      }
    });
  });
}

/**
 * Run a function with a specific gws account config directory.
 * Sets GOOGLE_WORKSPACE_CLI_CONFIG_DIR for the duration.
 *
 * @param {string} configDir - Config directory path
 * @param {function} fn - Async function to run
 * @returns {Promise<*>} Result of fn
 */
async function withAccount(configDir, fn) {
  const prev = process.env.GOOGLE_WORKSPACE_CLI_CONFIG_DIR;
  const resolved = configDir.startsWith('~')
    ? path.join(process.env.HOME, configDir.slice(1))
    : configDir;
  process.env.GOOGLE_WORKSPACE_CLI_CONFIG_DIR = resolved;
  try {
    return await fn();
  } finally {
    if (prev === undefined) {
      delete process.env.GOOGLE_WORKSPACE_CLI_CONFIG_DIR;
    } else {
      process.env.GOOGLE_WORKSPACE_CLI_CONFIG_DIR = prev;
    }
  }
}

module.exports = { gws, withAccount };
