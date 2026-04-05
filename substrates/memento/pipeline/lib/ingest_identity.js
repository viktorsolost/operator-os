/**
 * Ingest identity helpers.
 *
 * Deterministic ingest key computation and journal deduplication checks.
 * Source contract: docs/contracts/ingest-identity.md
 */

const crypto = require('crypto');
const { readJournal } = require('./journal_io');

/**
 * Sort object keys recursively for deterministic JSON serialization.
 */
function sortKeysDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysDeep);
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeysDeep(obj[key]);
  }
  return sorted;
}

/**
 * Compute SHA-256 hash of a normalized payload with sorted keys.
 *
 * @param {object} normalizedPayload - The capture's normalized_payload
 * @returns {string} "sha256:{hex}"
 */
function computeCaptureHash(normalizedPayload) {
  const serialized = JSON.stringify(sortKeysDeep(normalizedPayload));
  const hash = crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
  return `sha256:${hash}`;
}

/**
 * Compute the deterministic ingest key from a capture record.
 *
 * ingest_key = sha256(source + source_ref + observation_kind + capture_hash)
 *
 * @param {object} capture - A capture record with source, source_ref, observation_kind, capture_hash
 * @returns {string} "sha256:{hex}"
 */
function computeIngestKey(capture) {
  if (!capture.source || !capture.source_ref || !capture.observation_kind || !capture.capture_hash) {
    throw new Error('Capture must have source, source_ref, observation_kind, and capture_hash to compute ingest key');
  }
  const input = capture.source + capture.source_ref + capture.observation_kind + capture.capture_hash;
  const hash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
  return `sha256:${hash}`;
}

/**
 * Check whether a capture has already been ingested into a project journal.
 *
 * @param {string} projectId - The project to check
 * @param {string} ingestKey - The ingest key to look up
 * @returns {object|null} The ingest record (entry_id, ingested_at, capture_id, disposition) or null
 */
function isAlreadyIngested(projectId, ingestKey) {
  const journal = readJournal(projectId);
  if (!journal) return null;
  const record = journal.ingest_index?.[ingestKey];
  return record || null;
}

module.exports = {
  computeCaptureHash,
  computeIngestKey,
  isAlreadyIngested,
  sortKeysDeep,
};
