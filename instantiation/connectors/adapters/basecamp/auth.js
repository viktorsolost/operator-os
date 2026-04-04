'use strict';

// ---------------------------------------------------------------------------
// Basecamp Auth Adapter
// Wraps the Basecamp OAuth 2.0 flow to implement the auth adapter contract.
// ---------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

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

/**
 * Minimal synchronous prompt utility — reads one line from stdin.
 * Kept local so the adapter has no external dependencies.
 */
function defaultPromptSync(question) {
  process.stdout.write(question);
  const buf = Buffer.alloc(1024);
  let result = '';
  let bytesRead;
  // Open stdin in blocking mode for a single read
  const fd = fs.openSync('/dev/tty', 'r');
  try {
    while (true) {
      bytesRead = fs.readSync(fd, buf, 0, 1, null);
      if (bytesRead === 0) break;
      const ch = buf.toString('utf8', 0, bytesRead);
      if (ch === '\n') break;
      result += ch;
    }
  } finally {
    fs.closeSync(fd);
  }
  return result.trimEnd();
}

function envFilePath(homeRoot) {
  return path.join(expandHome(homeRoot || '~'), '.env.basecamp');
}

function tokensFilePath(homeRoot) {
  return path.join(expandHome(homeRoot || '~'), '.env.basecamp.tokens');
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    result[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Auth adapter implementation
// ---------------------------------------------------------------------------

/**
 * Secrets this adapter requires before the OAuth flow can start.
 */
const required_secrets = ['client_id', 'client_secret'];

/**
 * Run the interactive Basecamp OAuth flow.
 * opts must include: account_id
 * opts may include: home_root (defaults to '~'), promptFn (defaults to defaultPromptSync)
 */
function start_auth({ account_id, home_root, promptFn } = {}) {
  try {
    if (!account_id) {
      return createAuthResult({ connected: false, error: 'account_id is required' });
    }
    const expandedHome = expandHome(home_root || '~');
    const prompt = typeof promptFn === 'function' ? promptFn : defaultPromptSync;
    const redirectUri = 'https://localhost';

    console.log('Setting up Basecamp authorization...');
    console.log('You need a Basecamp integration. Create one at https://launchpad.37signals.com/integrations');

    const clientId = prompt('Basecamp Client ID: ');
    const clientSecret = prompt('Basecamp Client Secret: ');

    const authUrl = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    console.log(`\nVisit this URL to authorize:\n${authUrl}\n`);
    try { spawnSync('open', [authUrl], { stdio: 'ignore' }); } catch (_) {}

    const code = prompt('Paste the authorization code from the redirect URL: ');

    const tokenResponseRaw = execSync(
      `curl -s -X POST https://launchpad.37signals.com/authorization/token` +
      ` -d "type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}"`
    ).toString();

    const tokenResponse = JSON.parse(tokenResponseRaw);
    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token;
    const expires = Math.floor(Date.now() / 1000) + (tokenResponse.expires_in || 1209600);

    const envFile = path.join(expandedHome, '.env.basecamp');
    const tokensFile = path.join(expandedHome, '.env.basecamp.tokens');

    fs.writeFileSync(
      envFile,
      `BASECAMP_CLIENT_ID=${clientId}\nBASECAMP_CLIENT_SECRET=${clientSecret}\nBASECAMP_REDIRECT_URI=${redirectUri}\nBASECAMP_ACCOUNT_ID=${account_id}\n`,
      { encoding: 'utf8', mode: 0o600 }
    );
    fs.writeFileSync(
      tokensFile,
      `BASECAMP_ACCESS_TOKEN=${accessToken}\nBASECAMP_REFRESH_TOKEN=${refreshToken}\nBASECAMP_TOKEN_EXPIRES=${expires}\n`,
      { encoding: 'utf8', mode: 0o600 }
    );

    const authInfoRaw = execSync(
      `curl -s -H "Authorization: Bearer ${accessToken}" https://launchpad.37signals.com/authorization.json`
    ).toString();
    const authInfo = JSON.parse(authInfoRaw);
    const personId = authInfo.identity && authInfo.identity.id;

    return createAuthResult({
      connected: true,
      metadata: {
        account_id: String(account_id),
        api_base: `https://3.basecampapi.com/${account_id}`,
        person_id: personId ? String(personId) : null,
      },
    });
  } catch (e) {
    return createAuthResult({ connected: false, error: e.message || String(e) });
  }
}

/**
 * Check if the credential files exist and contain an access token.
 * opts must include: home_root (optional, defaults to '~')
 */
function finish_auth({ home_root } = {}) {
  try {
    const envFile = envFilePath(home_root);
    const tokensFile = tokensFilePath(home_root);

    if (!fs.existsSync(envFile) || !fs.existsSync(tokensFile)) {
      return createAuthResult({ connected: false, error: 'credential files not found' });
    }

    const tokens = parseEnvFile(tokensFile);
    if (!tokens.BASECAMP_ACCESS_TOKEN) {
      return createAuthResult({ connected: false, error: 'access token missing from tokens file' });
    }

    return createAuthResult({ connected: true });
  } catch (e) {
    return createAuthResult({ connected: false, error: e.message || String(e) });
  }
}

/**
 * Refresh the Basecamp access token using the stored refresh token.
 * opts must include: home_root (optional), client_id, client_secret
 */
function refresh({ home_root, client_id, client_secret } = {}) {
  try {
    const envFile = envFilePath(home_root);
    const tokensFile = tokensFilePath(home_root);

    // Read client credentials from args or fall back to stored env file
    let resolvedClientId = client_id;
    let resolvedClientSecret = client_secret;
    if (!resolvedClientId || !resolvedClientSecret) {
      const stored = parseEnvFile(envFile);
      resolvedClientId = resolvedClientId || stored.BASECAMP_CLIENT_ID;
      resolvedClientSecret = resolvedClientSecret || stored.BASECAMP_CLIENT_SECRET;
    }

    if (!resolvedClientId || !resolvedClientSecret) {
      return createAuthResult({ connected: false, error: 'client_id and client_secret are required for refresh' });
    }

    const tokens = parseEnvFile(tokensFile);
    const refreshToken = tokens.BASECAMP_REFRESH_TOKEN;
    if (!refreshToken) {
      return createAuthResult({ connected: false, error: 'no refresh token found' });
    }

    const redirectUri = parseEnvFile(envFile).BASECAMP_REDIRECT_URI || 'https://localhost';

    const tokenResponseRaw = execSync(
      `curl -s -X POST https://launchpad.37signals.com/authorization/token` +
      ` -d "type=refresh&refresh_token=${refreshToken}&client_id=${resolvedClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${resolvedClientSecret}"`
    ).toString();

    const tokenResponse = JSON.parse(tokenResponseRaw);
    if (!tokenResponse.access_token) {
      return createAuthResult({ connected: false, error: 'refresh response missing access_token' });
    }

    const newAccessToken = tokenResponse.access_token;
    const newRefreshToken = tokenResponse.refresh_token || refreshToken;
    const newExpires = Math.floor(Date.now() / 1000) + (tokenResponse.expires_in || 1209600);

    fs.writeFileSync(
      tokensFile,
      `BASECAMP_ACCESS_TOKEN=${newAccessToken}\nBASECAMP_REFRESH_TOKEN=${newRefreshToken}\nBASECAMP_TOKEN_EXPIRES=${newExpires}\n`,
      { encoding: 'utf8', mode: 0o600 }
    );

    return createAuthResult({ connected: true });
  } catch (e) {
    return createAuthResult({ connected: false, error: e.message || String(e) });
  }
}

/**
 * Revocation is manual — the token files can be deleted, but we do not
 * automatically call the 37signals revocation endpoint without confirmation.
 */
function revoke() {
  return createAuthResult({
    connected: false,
    metadata: { note: 'manual revocation required' },
  });
}

/**
 * Check auth status by verifying token files exist and contain an access token.
 * opts may include: home_root (defaults to '~')
 */
function status({ home_root } = {}) {
  try {
    const tokensFile = tokensFilePath(home_root);
    if (!fs.existsSync(tokensFile)) {
      return createAuthResult({ connected: false });
    }
    const tokens = parseEnvFile(tokensFile);
    const connected = Boolean(tokens.BASECAMP_ACCESS_TOKEN);
    return createAuthResult({ connected });
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
