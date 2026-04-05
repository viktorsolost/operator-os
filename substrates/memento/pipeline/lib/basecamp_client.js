/**
 * Basecamp 3 API client.
 *
 * OAuth token management with auto-refresh.
 * Rate-limited (0.2s between requests).
 */

const fs = require('fs');
const path = require('path');
const { getBasecampApiBase, FALLBACK_BASECAMP_API_BASE } = require('./pipeline_config');

const CREDS_PATH = path.join(process.env.HOME, '.env.basecamp');
const TOKENS_PATH = path.join(process.env.HOME, '.env.basecamp.tokens');
function loadApiBase() {
  return getBasecampApiBase();
}

const API_BASE = loadApiBase();
const TOKEN_REFRESH_URL = 'https://launchpad.37signals.com/authorization/token';
const REFRESH_BUFFER_S = 3600;
const REQUEST_PAUSE_MS = 200;

let _lastRequestTime = 0;

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return vars;
}

function loadCreds() {
  return loadEnvFile(CREDS_PATH);
}

function loadTokens() {
  return loadEnvFile(TOKENS_PATH);
}

function saveTokens(accessToken, refreshToken, expiresEpoch) {
  const lines = [
    `BASECAMP_ACCESS_TOKEN=${accessToken}`,
    `BASECAMP_REFRESH_TOKEN=${refreshToken}`,
    `BASECAMP_TOKEN_EXPIRES=${expiresEpoch}`,
  ];
  fs.writeFileSync(TOKENS_PATH, lines.join('\n') + '\n', 'utf8');
}

async function refreshTokenIfNeeded() {
  const tokens = loadTokens();
  const creds = loadCreds();
  const expiresAt = parseInt(tokens.BASECAMP_TOKEN_EXPIRES, 10);
  const now = Math.floor(Date.now() / 1000);

  if (now < expiresAt - REFRESH_BUFFER_S) {
    return tokens.BASECAMP_ACCESS_TOKEN;
  }

  console.log('[basecamp] Refreshing expired token...');
  const res = await fetch(TOKEN_REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      type: 'refresh',
      refresh_token: tokens.BASECAMP_REFRESH_TOKEN,
      client_id: creds.BASECAMP_CLIENT_ID,
      client_secret: creds.BASECAMP_CLIENT_SECRET,
      redirect_uri: creds.BASECAMP_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const newExpires = Math.floor(Date.now() / 1000) + data.expires_in;
  saveTokens(data.access_token, data.refresh_token, newExpires);
  console.log('[basecamp] Token refreshed successfully');
  return data.access_token;
}

async function rateLimitedPause() {
  const now = Date.now();
  const elapsed = now - _lastRequestTime;
  if (elapsed < REQUEST_PAUSE_MS) {
    await new Promise(r => setTimeout(r, REQUEST_PAUSE_MS - elapsed));
  }
  _lastRequestTime = Date.now();
}

/**
 * Make an authenticated Basecamp API request with pagination support.
 */
async function basecampFetch(urlPath, token) {
  await rateLimitedPause();
  const url = urlPath.startsWith('http') ? urlPath : `${API_BASE}${urlPath}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Memento Pipeline (viktor@cultural-affairs.com)',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Basecamp API ${res.status}: ${url} — ${await res.text()}`);
  }

  const data = await res.json();
  return { data, linkHeader: res.headers.get('Link') };
}

/**
 * Fetch all pages from a paginated Basecamp endpoint.
 */
async function fetchAllPages(urlPath, token) {
  let all = [];
  let nextUrl = urlPath;

  while (nextUrl) {
    const { data, linkHeader } = await basecampFetch(nextUrl, token);
    all = all.concat(Array.isArray(data) ? data : [data]);
    nextUrl = null;
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) nextUrl = match[1];
    }
  }

  return all;
}

/**
 * Flatten readings from a Basecamp notifications page.
 *
 * The notifications feed returns grouped objects rather than a plain array.
 * We normalize each page into individual reading records before pagination
 * continues, so callers can work with a flat list.
 */
function flattenNotificationPage(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const readings = [];
  const preferredKeys = ['unreads', 'reads', 'memories', 'mentions', 'notifications', 'items', 'readings'];

  for (const key of preferredKeys) {
    const value = data[key];
    if (Array.isArray(value)) {
      readings.push(...value);
    }
  }

  if (readings.length > 0) return readings;

  // Fallback: collect any direct array-valued properties to avoid silently
  // dropping data if Basecamp changes the grouping names.
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) readings.push(...value);
  }

  return readings;
}

/**
 * Fetch all pages from Basecamp's notifications feed and flatten the grouped
 * response into a list of individual readings.
 */
async function fetchNotificationFeed(urlPath, token) {
  let all = [];
  let nextUrl = urlPath;

  while (nextUrl) {
    const { data, linkHeader } = await basecampFetch(nextUrl, token);
    all = all.concat(flattenNotificationPage(data));
    nextUrl = null;
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) nextUrl = match[1];
    }
  }

  return all;
}

/**
 * List all active Basecamp projects.
 */
async function listProjects() {
  const token = await refreshTokenIfNeeded();
  return fetchAllPages('/projects.json', token);
}

/**
 * Fetch messages from a Basecamp project's message board.
 */
async function fetchMessages(projectId) {
  const token = await refreshTokenIfNeeded();
  const { data: projectInfo } = await basecampFetch(`/projects/${projectId}.json`, token);
  const board = projectInfo.dock?.find(d => d.name === 'message_board');
  if (!board) return [];
  return fetchAllPages(`/buckets/${projectId}/message_boards/${board.id}/messages.json`, token);
}

/**
 * Fetch todos from a Basecamp project, walking through groups.
 * Traversal: project → todoset → todolists → groups (via groups_url) → todos
 * Also fetches direct (ungrouped) todos from each todolist.
 * Attaches hierarchy metadata: todolist_title, todolist_id, group_title, group_id.
 */
async function fetchTodosWithGroups(projectId) {
  const token = await refreshTokenIfNeeded();
  const { data: projectInfo } = await basecampFetch(`/projects/${projectId}.json`, token);
  const todoset = projectInfo.dock?.find(d => d.name === 'todoset');
  if (!todoset) return [];

  const todolists = await fetchAllPages(`/buckets/${projectId}/todosets/${todoset.id}/todolists.json`, token);
  let allTodos = [];

  for (const list of todolists) {
    // Fetch groups via the dedicated groups_url endpoint
    if (list.groups_url) {
      const groups = await fetchAllPages(list.groups_url, token);
      for (const group of groups) {
        if (group.todos_url) {
          const groupTodos = await fetchAllPages(group.todos_url, token);
          for (const todo of groupTodos) {
            allTodos.push({
              ...todo,
              _todolist_title: list.title,
              _todolist_id: String(list.id),
              _group_title: group.title || group.name || '',
              _group_id: String(group.id),
            });
          }
        }
      }
    }

    // Fetch direct (ungrouped) todos from the todolist
    const directTodos = await fetchAllPages(`/buckets/${projectId}/todolists/${list.id}/todos.json`, token);
    for (const todo of directTodos) {
      allTodos.push({
        ...todo,
        _todolist_title: list.title,
        _todolist_id: String(list.id),
        _group_title: null,
        _group_id: null,
      });
    }
  }

  return allTodos;
}

/**
 * Fetch comments on a Basecamp recording.
 */
async function fetchComments(recordingId, projectId) {
  const token = await refreshTokenIfNeeded();
  return fetchAllPages(`/buckets/${projectId}/recordings/${recordingId}/comments.json`, token);
}

/**
 * Fetch current-user mention notifications from Basecamp.
 *
 * Mentions are exposed through the current-user readings feed. The sync step
 * filters the result set to section === 'mentions' and applies the rolling
 * lookback window.
 */
async function fetchMentions(personId, options = {}) {
  const token = await refreshTokenIfNeeded();
  return fetchNotificationFeed('/my/readings.json', token);
}

/**
 * Fetch project info including dock structure and membership.
 */
async function fetchProject(projectId) {
  const token = await refreshTokenIfNeeded();
  const { data } = await basecampFetch(`/projects/${projectId}.json`, token);
  return data;
}

/**
 * Fetch schedule entries from a project's Schedule tool.
 */
async function fetchScheduleEntries(projectId) {
  const token = await refreshTokenIfNeeded();
  const { data: projectInfo } = await basecampFetch(`/projects/${projectId}.json`, token);
  const schedule = projectInfo.dock?.find(d => d.name === 'schedule');
  if (!schedule) return [];
  return fetchAllPages(`/buckets/${projectId}/schedules/${schedule.id}/entries.json`, token);
}

/**
 * Fetch vault (Docs & Files) documents from a project.
 */
async function fetchVaultDocuments(projectId) {
  const token = await refreshTokenIfNeeded();
  const { data: projectInfo } = await basecampFetch(`/projects/${projectId}.json`, token);
  const vault = projectInfo.dock?.find(d => d.name === 'vault');
  if (!vault) return [];
  return fetchAllPages(`/buckets/${projectId}/vaults/${vault.id}/documents.json`, token);
}

/**
 * Fetch vault (Docs & Files) uploads from a project.
 */
async function fetchVaultUploads(projectId) {
  const token = await refreshTokenIfNeeded();
  const { data: projectInfo } = await basecampFetch(`/projects/${projectId}.json`, token);
  const vault = projectInfo.dock?.find(d => d.name === 'vault');
  if (!vault) return [];
  return fetchAllPages(`/buckets/${projectId}/vaults/${vault.id}/uploads.json`, token);
}

module.exports = {
  loadApiBase,
  FALLBACK_BASECAMP_API_BASE,
  listProjects,
  fetchProject,
  fetchMessages,
  fetchTodosWithGroups,
  fetchComments,
  fetchMentions,
  fetchScheduleEntries,
  fetchVaultDocuments,
  fetchVaultUploads,
  refreshTokenIfNeeded,
};
