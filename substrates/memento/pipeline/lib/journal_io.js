/**
 * Append-only journal IO layer.
 *
 * All journal writes go through this module. No code should write
 * directly to state/store/ without using these functions.
 *
 * Source contracts:
 *   docs/contracts/journal-entry-schema.md
 *   docs/contracts/ingest-identity.md
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.resolve(__dirname, '../../state/store');

const VALID_SOURCES = ['basecamp', 'gmail', 'calendar', 'drive', 'conversation', 'operator', 'system'];
const VALID_AUTHORSHIP = ['manual', 'synced', 'extracted'];
const VALID_LINK_MODES = ['direct', 'inferred', 'unlinked'];
const VALID_DISPOSITIONS = ['journaled', 'skipped_not_material'];

const REQUIRED_ENTRY_FIELDS = [
  'entry_id', 'timestamp', 'recorded_at', 'source', 'source_ref',
  'entry_type', 'title', 'summary', 'payload', 'project_link',
  'authorship', 'provenance', 'actors', 'contacts', 'tags',
];

const VALID_SIGNAL_TYPES = [
  'awaiting_reply', 'reply_received',
  'awaiting_external_action', 'external_action_completed',
  'followup_required', 'followup_completed',
  'manual_thread_opened', 'manual_thread_closed',
];

/**
 * Get the file path for a project journal.
 */
function journalPath(projectId) {
  return path.join(STATE_DIR, `${projectId}.json`);
}

/**
 * Read a project journal from disk.
 *
 * @param {string} projectId
 * @returns {object|null} The journal object, or null if it doesn't exist
 */
function readJournal(projectId) {
  const filePath = journalPath(projectId);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Write a journal to disk. Internal only — external callers use appendEntry.
 */
function writeJournal(projectId, journal) {
  const filePath = journalPath(projectId);
  fs.writeFileSync(filePath, JSON.stringify(journal, null, 2) + '\n', 'utf8');
}

/**
 * Create a new empty journal for a project.
 *
 * @param {string} projectId
 * @returns {object} The new journal
 */
function createJournal(projectId) {
  const now = new Date().toISOString();
  const journal = {
    project_id: projectId,
    metadata: {
      schema_version: '1.0.0',
      created_at: now,
      updated_at: now,
    },
    entries: [],
    ingest_index: {},
  };
  writeJournal(projectId, journal);
  return journal;
}

/**
 * Validate a journal entry against the schema contract.
 * Throws on validation failure.
 */
function validateEntry(entry) {
  for (const field of REQUIRED_ENTRY_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      throw new Error(`Entry missing required field: ${field}`);
    }
  }

  if (!VALID_SOURCES.includes(entry.source)) {
    throw new Error(`Invalid source: ${entry.source}. Must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  if (!VALID_AUTHORSHIP.includes(entry.authorship)) {
    throw new Error(`Invalid authorship: ${entry.authorship}. Must be one of: ${VALID_AUTHORSHIP.join(', ')}`);
  }

  if (!entry.project_link.mode || !VALID_LINK_MODES.includes(entry.project_link.mode)) {
    throw new Error(`Invalid project_link.mode: ${entry.project_link.mode}`);
  }

  if (!Array.isArray(entry.project_link.basis)) {
    throw new Error('project_link.basis must be an array');
  }

  // Provenance validation
  if (!entry.provenance || !Array.isArray(entry.provenance.capture_ids) || !Array.isArray(entry.provenance.source_artifact_refs)) {
    throw new Error('provenance must include capture_ids[] and source_artifact_refs[]');
  }

  if (entry.authorship === 'extracted' && !entry.provenance.extraction_parent) {
    throw new Error('Extracted entries must have provenance.extraction_parent');
  }

  // Validate thread_signals if present
  if (entry.thread_signals) {
    if (!Array.isArray(entry.thread_signals)) {
      throw new Error('thread_signals must be an array');
    }
    for (const signal of entry.thread_signals) {
      if (!VALID_SIGNAL_TYPES.includes(signal.signal_type)) {
        throw new Error(`Invalid thread signal_type: ${signal.signal_type}. Allowed: ${VALID_SIGNAL_TYPES.join(', ')}`);
      }
      if (!signal.thread_key || !signal.counterparty || !signal.basis) {
        throw new Error('Thread signals must have thread_key, counterparty, and basis');
      }
    }
  }

  // Validate fact_claims if present
  if (entry.fact_claims) {
    if (!Array.isArray(entry.fact_claims)) {
      throw new Error('fact_claims must be an array');
    }
    for (const claim of entry.fact_claims) {
      if (!claim.fact_key || claim.fact_value === undefined || !claim.confidence || !claim.authorship) {
        throw new Error('Fact claims must have fact_key, fact_value, confidence, and authorship');
      }
      if (!VALID_AUTHORSHIP.includes(claim.authorship)) {
        throw new Error(`Invalid fact_claim authorship: ${claim.authorship}`);
      }
    }
  }

  if (!Array.isArray(entry.actors)) throw new Error('actors must be an array');
  if (!Array.isArray(entry.contacts)) throw new Error('contacts must be an array');
  if (!Array.isArray(entry.tags)) throw new Error('tags must be an array');
}

/**
 * Append a validated entry to a project journal.
 *
 * Enforces: schema validation, entry_id uniqueness, append-only immutability.
 * Does NOT handle ingest deduplication — that is the caller's responsibility
 * (via ingest_identity.js).
 *
 * @param {string} projectId
 * @param {object} entry - The journal entry to append
 * @returns {object} The updated journal
 */
function appendEntry(projectId, entry) {
  validateEntry(entry);

  let journal = readJournal(projectId);
  if (!journal) {
    journal = createJournal(projectId);
  }

  // Enforce entry_id uniqueness
  const existingIds = new Set(journal.entries.map(e => e.entry_id));
  if (existingIds.has(entry.entry_id)) {
    throw new Error(`Duplicate entry_id: ${entry.entry_id}`);
  }

  // Append (no mutation of existing entries)
  journal.entries.push(entry);
  journal.metadata.updated_at = entry.recorded_at;

  writeJournal(projectId, journal);
  return journal;
}

/**
 * Check if an ingest key exists in a project journal's ingest index.
 *
 * @param {string} projectId
 * @param {string} ingestKey
 * @returns {string|null} The disposition if found, or null
 */
function hasIngestKey(projectId, ingestKey) {
  const journal = readJournal(projectId);
  if (!journal) return null;
  const record = journal.ingest_index?.[ingestKey];
  return record?.disposition || null;
}

/**
 * Record an ingest key in a project journal's ingest index.
 *
 * @param {string} projectId
 * @param {string} ingestKey
 * @param {string} disposition - "journaled" | "skipped_not_material"
 * @param {string} entryId - The entry that was created (or null if skipped)
 * @param {string} captureId - The capture this came from
 * @returns {object} The updated journal
 */
function recordIngestKey(projectId, ingestKey, disposition, entryId, captureId) {
  if (!VALID_DISPOSITIONS.includes(disposition)) {
    throw new Error(`Invalid disposition: ${disposition}. Must be one of: ${VALID_DISPOSITIONS.join(', ')}`);
  }

  let journal = readJournal(projectId);
  if (!journal) {
    journal = createJournal(projectId);
  }

  if (journal.ingest_index[ingestKey]) {
    throw new Error(`Ingest key already recorded: ${ingestKey}`);
  }

  journal.ingest_index[ingestKey] = {
    entry_id: entryId,
    ingested_at: new Date().toISOString(),
    capture_id: captureId,
    disposition: disposition,
  };

  writeJournal(projectId, journal);
  return journal;
}

module.exports = {
  readJournal,
  appendEntry,
  hasIngestKey,
  recordIngestKey,
  createJournal,
  validateEntry,
  journalPath,
};
