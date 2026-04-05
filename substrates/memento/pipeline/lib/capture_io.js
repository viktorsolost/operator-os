/**
 * Capture IO helpers.
 *
 * Reads and writes capture records using the versioned directory layout (Option B).
 * Layout: state/captures/{source}/{capture_id}/{observed_at}.json
 *
 * Source contract: docs/contracts/capture-layer.md
 */

const fs = require('fs');
const path = require('path');

const CAPTURES_DIR = path.resolve(__dirname, '../../state/captures');

const VALID_SOURCES = ['basecamp', 'gmail', 'calendar', 'drive', 'sheets', 'meeting_extract'];

/**
 * Sanitize an ISO8601 timestamp for use as a filename.
 * Replaces colons with hyphens: "2026-03-28T14:30:00Z" -> "2026-03-28T14-30-00Z"
 */
function sanitizeTimestamp(ts) {
  return ts.replace(/:/g, '-');
}

/**
 * Restore a sanitized filename timestamp back to ISO8601.
 * "2026-03-28T14-30-00Z.json" -> "2026-03-28T14:30:00Z"
 */
function restoreTimestamp(filename) {
  const base = filename.replace('.json', '');
  // Only restore hyphens that are within the time portion (after T)
  const tIndex = base.indexOf('T');
  if (tIndex === -1) return base;
  const datePart = base.slice(0, tIndex);
  const timePart = base.slice(tIndex);
  // In the time part, the pattern is T##-##-##Z — restore to T##:##:##Z
  const restored = timePart.replace(/(\d{2})-(\d{2})-(\d{2})/g, '$1:$2:$3');
  return datePart + restored;
}

/**
 * Get the directory path for a capture's version history.
 */
function captureDir(source, captureId) {
  return path.join(CAPTURES_DIR, source, captureId);
}

/**
 * Write a capture record to disk in the versioned directory layout.
 *
 * @param {string} source - The source type (basecamp, gmail, etc.)
 * @param {object} captureRecord - The full capture record
 * @returns {string} The file path written
 */
function writeCapture(source, captureRecord) {
  if (!VALID_SOURCES.includes(source)) {
    throw new Error(`Invalid source: ${source}. Must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  if (!captureRecord.capture_id || !captureRecord.observed_at || !captureRecord.capture_hash) {
    throw new Error('Capture record must have capture_id, observed_at, and capture_hash');
  }

  const dir = captureDir(source, captureRecord.capture_id);
  fs.mkdirSync(dir, { recursive: true });

  const filename = sanitizeTimestamp(captureRecord.observed_at) + '.json';
  const filePath = path.join(dir, filename);

  fs.writeFileSync(filePath, JSON.stringify(captureRecord, null, 2) + '\n', 'utf8');
  return filePath;
}

/**
 * Read the most recent capture version for a given capture_id.
 *
 * @param {string} source
 * @param {string} captureId
 * @returns {object|null} The capture record, or null if not found
 */
function readLatestCapture(source, captureId) {
  const dir = captureDir(source, captureId);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) return null;

  const latest = files[files.length - 1];
  const raw = fs.readFileSync(path.join(dir, latest), 'utf8');
  return JSON.parse(raw);
}

/**
 * Read all capture versions for a given capture_id, sorted chronologically.
 *
 * @param {string} source
 * @param {string} captureId
 * @returns {object[]} Array of capture records, oldest first
 */
function readCaptureVersions(source, captureId) {
  const dir = captureDir(source, captureId);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort();

  return files.map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    return JSON.parse(raw);
  });
}

/**
 * Check if a capture with the exact same hash already exists.
 *
 * @param {string} source
 * @param {string} captureId
 * @param {string} captureHash
 * @returns {boolean}
 */
function captureExists(source, captureId, captureHash) {
  const versions = readCaptureVersions(source, captureId);
  return versions.some(v => v.capture_hash === captureHash);
}

module.exports = {
  writeCapture,
  readLatestCapture,
  readCaptureVersions,
  captureExists,
  sanitizeTimestamp,
  restoreTimestamp,
};
