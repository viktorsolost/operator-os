/**
 * Derive activity feed for a project from its journal.
 *
 * This is a read-only projection module. It never writes to the journal.
 * No aggregation, summarization, or interpretation — filtered projection only.
 *
 * Source contract: state/store/<projectId>.json (via journal_io.js)
 */

const { readJournal } = require('./journal_io');

/**
 * Parse a timestamp string to a Date object.
 * Handles both ISO8601 and RFC2822 formats that appear in journal entries.
 *
 * @param {string} ts
 * @returns {Date}
 */
function parseTimestamp(ts) {
  return new Date(ts);
}

/**
 * Derive a time-sorted activity feed for a project.
 *
 * @param {string} projectId - The project to read the journal for
 * @param {object} options
 * @param {string} [options.since] - ISO8601 — only entries after this time
 * @param {number} [options.limit] - Max entries to return
 * @param {string[]} [options.sources] - Filter to these source types only
 * @returns {object} Activity feed object
 */
function deriveActivity(projectId, options = {}) {
  const { since, limit, sources } = options;

  const journal = readJournal(projectId);
  if (!journal) {
    return {
      project_id: projectId,
      derived_at: new Date().toISOString(),
      entries: [],
    };
  }

  const sinceDate = since ? new Date(since) : null;

  let entries = journal.entries
    .filter(entry => {
      // Filter by source if specified
      if (sources && sources.length > 0) {
        if (!sources.includes(entry.source)) return false;
      }

      // Filter by since if specified
      if (sinceDate) {
        const entryDate = parseTimestamp(entry.timestamp);
        if (isNaN(entryDate.getTime()) || entryDate <= sinceDate) return false;
      }

      return true;
    })
    .map(entry => ({
      entry_id: entry.entry_id,
      timestamp: entry.timestamp,
      source: entry.source,
      entry_type: entry.entry_type,
      title: entry.title,
      summary: entry.summary,
      actors: Array.isArray(entry.actors) ? entry.actors : [],
      authorship: entry.authorship,
    }))
    .sort((a, b) => {
      const dateA = parseTimestamp(a.timestamp);
      const dateB = parseTimestamp(b.timestamp);
      // Most recent first; push unparseable timestamps to end
      if (isNaN(dateB.getTime()) && isNaN(dateA.getTime())) return 0;
      if (isNaN(dateB.getTime())) return -1;
      if (isNaN(dateA.getTime())) return 1;
      return dateB - dateA;
    });

  // Apply limit after sort
  if (limit != null && limit > 0) {
    entries = entries.slice(0, limit);
  }

  return {
    project_id: projectId,
    derived_at: new Date().toISOString(),
    entries,
  };
}

module.exports = { deriveActivity };
