// TODO: Full identity resolution rules pending contacts contract (Phase 3 deferred item)

/**
 * Derive a cross-project contacts index from all active project journals.
 *
 * This is a read-only projection module. It never writes to any journal.
 * Primary key is email address (lowercase, trimmed).
 * If no email is resolvable, falls back to display name as key.
 *
 * Source contract: state/store/<projectId>.json (via journal_io.js)
 */

const { readJournal } = require('./journal_io');

/**
 * Parse a raw contact string into { name, email }.
 * Handles formats:
 *   - plain email: "user@example.com"
 *   - RFC2822 display: "Full Name <user@example.com>"
 *   - display with quotes: '"Full Name" <user@example.com>'
 *
 * @param {string} raw
 * @returns {{ name: string|null, email: string|null }}
 */
function parseContact(raw) {
  if (!raw || typeof raw !== 'string') return { name: null, email: null };

  const trimmed = raw.trim();

  // Match "Name <email>" or '"Name" <email>'
  const angleMatch = trimmed.match(/^"?([^"<>]+?)"?\s*<([^>]+)>$/);
  if (angleMatch) {
    return {
      name: angleMatch[1].trim() || null,
      email: angleMatch[2].trim().toLowerCase(),
    };
  }

  // Plain email address
  if (trimmed.includes('@') && !trimmed.includes(' ')) {
    return { name: null, email: trimmed.toLowerCase() };
  }

  // Fallback: treat as display name only
  return { name: trimmed || null, email: null };
}

/**
 * Derive a cross-project contacts index from all active project journals.
 *
 * @param {object} registry - The registry object (from state/registry.json)
 * @returns {object} Contacts index
 */
function deriveContacts(registry) {
  // Map of primaryKey -> contact record
  const index = new Map();

  const projects = (registry && Array.isArray(registry.projects))
    ? registry.projects.filter(p => p.status === 'active')
    : [];

  for (const project of projects) {
    const journal = readJournal(project.project_id);
    if (!journal || !Array.isArray(journal.entries)) continue;

    for (const entry of journal.entries) {
      const contacts = Array.isArray(entry.contacts) ? entry.contacts : [];
      const timestamp = entry.timestamp;

      for (const raw of contacts) {
        const { name, email } = parseContact(raw);

        // Determine primary key
        const primaryKey = email || name;
        if (!primaryKey) continue;

        if (!index.has(primaryKey)) {
          index.set(primaryKey, {
            primary_key: primaryKey,
            names: new Set(),
            emails: new Set(),
            projects: new Set(),
            timestamps: [],
            appearance_count: 0,
          });
        }

        const record = index.get(primaryKey);

        if (name) record.names.add(name);
        if (email) record.emails.add(email);
        record.projects.add(project.project_id);
        record.timestamps.push(timestamp);
        record.appearance_count += 1;
      }
    }
  }

  // Convert to output schema
  const contacts = Array.from(index.values()).map(record => {
    const validTimestamps = record.timestamps
      .map(ts => new Date(ts))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a - b);

    const first_seen = validTimestamps.length > 0
      ? validTimestamps[0].toISOString()
      : null;
    const last_seen = validTimestamps.length > 0
      ? validTimestamps[validTimestamps.length - 1].toISOString()
      : null;

    return {
      primary_key: record.primary_key,
      names: Array.from(record.names),
      emails: Array.from(record.emails),
      projects: Array.from(record.projects),
      first_seen,
      last_seen,
      appearance_count: record.appearance_count,
    };
  });

  // Sort by appearance_count descending
  contacts.sort((a, b) => b.appearance_count - a.appearance_count);

  return {
    derived_at: new Date().toISOString(),
    contacts,
  };
}

module.exports = { deriveContacts };
