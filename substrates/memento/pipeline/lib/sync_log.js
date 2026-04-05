/**
 * Sync log helpers.
 *
 * Tracks last sync timestamps per source so sync steps know
 * what's "new since last run."
 */

const fs = require('fs');
const path = require('path');

const SYNC_LOG_DIR = path.resolve(__dirname, '../../state/sync_log');
const STRUCTURED_SOURCES = new Set(['gmail', 'basecamp', 'calendar', 'drive', 'sheets']);
const RESERVED_KEYS = new Set(['last_run', 'last_sync', 'failures']);

function logPath(source) {
  return path.join(SYNC_LOG_DIR, `${source}.json`);
}

function latestTimestamp(values) {
  const timestamps = values
    .filter(Boolean)
    .map(value => new Date(value).getTime())
    .filter(value => !Number.isNaN(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function normalizeSyncLog(source, rawLog) {
  const log = rawLog && typeof rawLog === 'object' ? { ...rawLog } : {};

  if (!STRUCTURED_SOURCES.has(source)) {
    return log;
  }

  const failures = Array.isArray(log.failures) ? log.failures : [];

  if (source === 'gmail') {
    let accountSync = {};

    if (log.last_sync && typeof log.last_sync === 'object' && !Array.isArray(log.last_sync)) {
      accountSync = { ...log.last_sync };
    }

    for (const [key, value] of Object.entries(log)) {
      if (RESERVED_KEYS.has(key)) continue;
      if (typeof value === 'string') accountSync[key] = value;
    }

    return {
      last_run: log.last_run || latestTimestamp(Object.values(accountSync)) || null,
      last_sync: accountSync,
      failures,
    };
  }

  return {
    last_run: log.last_run || log.last_sync || null,
    last_sync: typeof log.last_sync === 'string' ? log.last_sync : null,
    failures,
  };
}

/**
 * Read the sync log for a source.
 * Returns the normalized log object, or empty object if no log exists.
 */
function readSyncLog(source) {
  const p = logPath(source);
  if (!fs.existsSync(p)) return normalizeSyncLog(source, {});
  return normalizeSyncLog(source, JSON.parse(fs.readFileSync(p, 'utf8')));
}

/**
 * Write the sync log for a source.
 */
function writeSyncLog(source, log) {
  fs.mkdirSync(SYNC_LOG_DIR, { recursive: true });
  const normalized = normalizeSyncLog(source, log);
  fs.writeFileSync(logPath(source), JSON.stringify(normalized, null, 2) + '\n', 'utf8');
}

/**
 * Get the last sync timestamp for a source (or a sub-key like account name).
 *
 * @param {string} source - Source name (gmail, basecamp, etc.)
 * @param {string} [key] - Optional sub-key (e.g., account name)
 * @returns {string|null} ISO8601 timestamp or null
 */
function getLastSync(source, key) {
  const log = readSyncLog(source);
  if (source === 'gmail') {
    if (!key) return null;
    return log.last_sync?.[key] || null;
  }
  if (key) return null;
  return log.last_sync || null;
}

function getLastRun(source) {
  const log = readSyncLog(source);
  return log.last_run || null;
}

/**
 * Update the last sync timestamp.
 *
 * @param {string} source
 * @param {string|null} key - Sub-key (e.g., account name) or null for top-level
 * @param {string} timestamp - ISO8601 timestamp
 */
function updateLastSync(source, key, timestamp) {
  const log = readSyncLog(source);
  log.last_run = timestamp;

  if (source === 'gmail') {
    if (!log.last_sync || typeof log.last_sync !== 'object' || Array.isArray(log.last_sync)) {
      log.last_sync = {};
    }
    if (key) {
      log.last_sync[key] = timestamp;
    }
  } else {
    log.last_sync = timestamp;
  }

  writeSyncLog(source, log);
}

function updateLastRun(source, timestamp) {
  const log = readSyncLog(source);
  log.last_run = timestamp;
  writeSyncLog(source, log);
}

/**
 * Record an auth/API failure for a source.
 *
 * @param {string} source - Source name (gmail, basecamp, calendar, drive)
 * @param {object} failure - { timestamp, source, account, error, action }
 */
function recordFailure(source, failure) {
  const log = readSyncLog(source);
  if (!log.failures) log.failures = [];
  log.failures.push(failure);
  if (!log.last_run && failure?.timestamp) log.last_run = failure.timestamp;
  writeSyncLog(source, log);
}

/**
 * Get and clear all recorded failures for a source.
 *
 * @param {string} source
 * @returns {Array} Array of failure objects
 */
function getAndClearFailures(source) {
  const log = readSyncLog(source);
  const failures = log.failures || [];
  log.failures = [];
  writeSyncLog(source, log);
  return failures;
}

/**
 * Get a default "since" date for first-run scenarios.
 *
 * @param {string} source
 * @returns {string} YYYY/MM/DD formatted date string
 */
function defaultSinceDate(source) {
  const now = new Date();
  let daysBack;
  switch (source) {
    case 'basecamp':
    case 'gmail':
      daysBack = 30;
      break;
    case 'calendar':
      daysBack = 7;
      break;
    case 'drive':
      daysBack = 0; // Full crawl
      break;
    default:
      daysBack = 30;
  }
  const since = new Date(now.getTime() - daysBack * 86400000);
  return `${since.getFullYear()}/${String(since.getMonth() + 1).padStart(2, '0')}/${String(since.getDate()).padStart(2, '0')}`;
}

module.exports = {
  readSyncLog,
  writeSyncLog,
  getLastSync,
  getLastRun,
  updateLastSync,
  updateLastRun,
  defaultSinceDate,
  recordFailure,
  getAndClearFailures,
};
