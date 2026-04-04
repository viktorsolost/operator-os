'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, execSync } = require('child_process');

/**
 * Expand ~ to the user's home directory.
 */
function expandHome(p) {
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

/**
 * Synchronous stdin prompt — reads one line from stdin.
 */
function promptSync(question) {
  process.stdout.write(question);
  let str = '';
  const buf = Buffer.alloc(1);
  while (true) {
    const bytesRead = fs.readSync(0, buf, 0, 1);
    if (bytesRead === 0) break;
    const char = buf.toString('utf8', 0, 1);
    if (char === '\n') break;
    str += char;
  }
  return str.trim();
}

/**
 * Verify that gws auth worked by calling getProfile.
 * Returns true if successful, false if not.
 */
function verifyGwsAuth(configDir) {
  try {
    execSync('gws gmail users getProfile --params \'{"userId":"me"}\'', {
      env: { ...process.env, GOOGLE_WORKSPACE_CLI_CONFIG_DIR: configDir },
    });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Run interactive gws auth for a single Gmail account.
 * Returns the account object with connected: true/false and optional error.
 */
function runGwsAuth(account) {
  try {
    const expandedDir = expandHome(account.config_dir);

    if (!fs.existsSync(expandedDir)) {
      fs.mkdirSync(expandedDir, { recursive: true });
    }

    console.log(`Authenticating ${account.label}...`);

    const result = spawnSync('gws', ['auth', 'login'], {
      env: { ...process.env, GOOGLE_WORKSPACE_CLI_CONFIG_DIR: expandedDir },
      stdio: 'inherit',
    });

    if (result.status !== 0) {
      return { ...account, connected: false, error: 'gws auth login failed' };
    }

    const verified = verifyGwsAuth(expandedDir);
    if (!verified) {
      return { ...account, connected: false, error: 'gws auth verification failed' };
    }

    return { ...account, connected: true };
  } catch (e) {
    return { ...account, connected: false, error: e.message || String(e) };
  }
}

/**
 * Run interactive Basecamp OAuth flow.
 * Writes ~/.env.basecamp and ~/.env.basecamp.tokens.
 * Returns connection object with connected: true/false.
 */
function runBasecampAuth({ accountId, homeRoot }) {
  try {
    const expandedHome = expandHome(homeRoot || '~');

    console.log('Setting up Basecamp authorization...');
    console.log('You need a Basecamp integration. Create one at https://launchpad.37signals.com/integrations');

    const clientId = promptSync('Basecamp Client ID: ');
    const clientSecret = promptSync('Basecamp Client Secret: ');
    const redirectUri = 'https://localhost';

    const authUrl = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log(`\nVisit this URL to authorize:\n${authUrl}\n`);
    try { spawnSync('open', [authUrl], { stdio: 'ignore' }); } catch (_) {}

    const code = promptSync('Paste the authorization code from the redirect URL: ');

    const tokenResponseRaw = execSync(
      `curl -s -X POST https://launchpad.37signals.com/authorization/token -d "type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}"`
    ).toString();

    const tokenResponse = JSON.parse(tokenResponseRaw);
    const accessToken = tokenResponse.access_token;
    const refreshToken = tokenResponse.refresh_token;
    const expires = Math.floor(Date.now() / 1000) + (tokenResponse.expires_in || 1209600);

    const envFile = path.join(expandedHome, '.env.basecamp');
    const tokensFile = path.join(expandedHome, '.env.basecamp.tokens');

    fs.writeFileSync(
      envFile,
      `BASECAMP_CLIENT_ID=${clientId}\nBASECAMP_CLIENT_SECRET=${clientSecret}\nBASECAMP_REDIRECT_URI=${redirectUri}\nBASECAMP_ACCOUNT_ID=${accountId}\n`,
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

    return {
      account_id: String(accountId),
      api_base: `https://3.basecampapi.com/${accountId}`,
      connected: true,
      person_id: String(personId),
    };
  } catch (e) {
    return {
      account_id: String(accountId),
      connected: false,
      error: e.message || String(e),
    };
  }
}

/**
 * Live interactive auth flow — runs real gws and Basecamp OAuth.
 */
function connectAccountsLive({ packet }) {
  const gmailAccounts = Array.isArray(packet.gmail_accounts)
    ? packet.gmail_accounts
      .filter((account) => account.name)
      .map((account) => ({
        name: account.name,
        config_dir: account.config_dir || `~/.config/${account.name}`,
        label: account.label || account.name,
      }))
    : [];

  const gmail = gmailAccounts.map((account) => runGwsAuth(account));

  let basecampResult = null;
  if (packet.basecamp_account_id) {
    basecampResult = runBasecampAuth({
      accountId: packet.basecamp_account_id,
      homeRoot: packet.home_root || '~',
    });
  }

  const sourceIdentities =
    basecampResult && basecampResult.connected && basecampResult.person_id
      ? { basecamp: { owner: { person_id: basecampResult.person_id } } }
      : {};

  const gmailConnected = gmail.filter((a) => a.connected).length;
  const gmailTotal = gmail.length;
  const basecampStatus = basecampResult
    ? basecampResult.connected ? 'connected' : 'failed'
    : 'n/a';

  console.log(`Connected ${gmailConnected}/${gmailTotal} Gmail accounts, Basecamp: ${basecampStatus}`);

  const someConnected = gmailConnected > 0 || (basecampResult && basecampResult.connected);
  const someFailed =
    gmailConnected < gmailTotal ||
    (basecampResult !== null && !basecampResult.connected);

  return {
    gmail,
    basecamp: basecampResult,
    sourceIdentities,
    mode: 'live',
    skipped: false,
    partial: someConnected && someFailed,
  };
}

/**
 * Connect accounts based on onboarding inputs.
 * In dry test / non-interactive mode, accepts pre-built connection data.
 * In interactive mode, runs live OAuth flows.
 *
 * @param {object} options
 * @param {object} options.packet - validated onboarding packet
 * @param {object} [options.mockConnections] - pre-built connections for testing
 * @param {boolean} [options.interactive] - if true, run live gws/Basecamp auth
 * @returns {object} Connection result: { gmail: [], basecamp: {}, sourceIdentities: {} }
 */
function connectAccounts({ packet, mockConnections, interactive }) {
  // If connect_accounts_now is "later", return empty connections
  if (packet.connect_accounts_now === 'later') {
    return {
      gmail: [],
      basecamp: null,
      sourceIdentities: {},
      skipped: true,
    };
  }

  // Use mock connections if provided (dry test path)
  if (mockConnections) {
    return {
      gmail: mockConnections.gmail || [],
      basecamp: mockConnections.basecamp || null,
      sourceIdentities: mockConnections.sourceIdentities || {},
      guidance: [],
      mode: 'mock',
      skipped: false,
    };
  }

  // Live interactive path
  if (interactive) {
    return connectAccountsLive({ packet });
  }

  // Declared path — return guidance strings, no actual auth
  const gmail = Array.isArray(packet.gmail_accounts)
    ? packet.gmail_accounts
      .map((account) => ({
        name: account.name,
        config_dir: account.config_dir || `~/.config/${account.name}`,
        label: account.label || account.name,
        connected: true,
      }))
      .filter((account) => account.name)
    : [];

  const basecamp = packet.basecamp_account_id
    ? {
        account_id: String(packet.basecamp_account_id),
        api_base: `https://3.basecampapi.com/${packet.basecamp_account_id}`,
        connected: true,
      }
    : null;

  const guidance = [];
  for (const account of gmail) {
    guidance.push(`Run GOOGLE_WORKSPACE_CLI_CONFIG_DIR=${account.config_dir} gws auth login for ${account.label}.`);
  }
  if (basecamp) {
    guidance.push(`Authorize Basecamp account ${basecamp.account_id} and store tokens in ~/.env.basecamp and ~/.env.basecamp.tokens.`);
  }

  return {
    gmail,
    basecamp,
    sourceIdentities: basecamp && packet.basecamp_person_id
      ? { basecamp: { owner: { person_id: String(packet.basecamp_person_id) } } }
      : {},
    guidance,
    mode: 'declared',
    skipped: gmail.length === 0 && !basecamp,
  };
}

/**
 * Reconnect accounts that are marked as disconnected in an existing pipeline_config.json.
 *
 * @param {object} options
 * @param {string} options.pipelineConfigPath - absolute path to pipeline_config.json
 * @param {string} [options.homeRoot] - home root for Basecamp env files (default: ~)
 * @returns {object} Updated connections
 */
function reconnectAccounts({ pipelineConfigPath, homeRoot }) {
  const config = JSON.parse(fs.readFileSync(pipelineConfigPath, 'utf8'));
  const accounts = config.accounts || {};

  // Reconnect disconnected Gmail accounts
  const updatedGmail = Array.isArray(accounts.gmail)
    ? accounts.gmail.map((account) => {
        if (account.connected === false) {
          return runGwsAuth(account);
        }
        return account;
      })
    : [];

  // Reconnect disconnected Basecamp
  let updatedBasecamp = accounts.basecamp || null;
  if (updatedBasecamp && updatedBasecamp.connected === false && updatedBasecamp.account_id) {
    updatedBasecamp = runBasecampAuth({
      accountId: updatedBasecamp.account_id,
      homeRoot: homeRoot || '~',
    });
  }

  // Build source identities from Basecamp result
  const sourceIdentities =
    updatedBasecamp && updatedBasecamp.connected && updatedBasecamp.person_id
      ? { basecamp: { owner: { person_id: updatedBasecamp.person_id } } }
      : {};

  // Update config and write back
  config.accounts = { ...accounts, gmail: updatedGmail, basecamp: updatedBasecamp };
  fs.writeFileSync(pipelineConfigPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

  const gmailConnected = updatedGmail.filter((a) => a.connected).length;
  const someConnected = gmailConnected > 0 || (updatedBasecamp && updatedBasecamp.connected);
  const someFailed =
    gmailConnected < updatedGmail.length ||
    (updatedBasecamp !== null && !updatedBasecamp.connected);

  return {
    gmail: updatedGmail,
    basecamp: updatedBasecamp,
    sourceIdentities,
    partial: someConnected && someFailed,
  };
}

/**
 * Write source_identities.json to the target workspace.
 *
 * @param {object} sourceIdentities - e.g. { basecamp: { owner: { person_id: "123" } } }
 * @param {string} targetWorkspaceRoot
 */
function writeSourceIdentities(sourceIdentities, targetWorkspaceRoot) {
  const idPath = path.join(targetWorkspaceRoot, 'state', 'runtime', 'source_identities.json');
  const dir = path.dirname(idPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(idPath, JSON.stringify(sourceIdentities, null, 2) + '\n', 'utf8');
  return idPath;
}

module.exports = { connectAccounts, connectAccountsLive, reconnectAccounts, writeSourceIdentities };
