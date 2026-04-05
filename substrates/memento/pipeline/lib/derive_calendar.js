/**
 * Calendar event derivation module.
 *
 * Reads calendar captures, deduplicates by event_id, normalizes to a
 * clean shape, and filters to a rolling window (today through 14 days).
 *
 * This is a read-only derivation. It never writes to captures or journals.
 *
 * Source: state/captures/calendar/ (versioned directory layout via capture_io)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CAPTURES_DIR = path.resolve(__dirname, '../../state/captures/calendar');

/**
 * Read all calendar captures from disk. Returns the latest version of each.
 *
 * @returns {object[]} Array of raw capture records
 */
function readAllCalendarCaptures() {
  if (!fs.existsSync(CAPTURES_DIR)) return [];

  const captures = [];
  const dirs = fs.readdirSync(CAPTURES_DIR).filter(d =>
    fs.statSync(path.join(CAPTURES_DIR, d)).isDirectory()
  );

  for (const dir of dirs) {
    const dirPath = path.join(CAPTURES_DIR, dir);
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.json'))
      .sort();

    if (files.length === 0) continue;

    // Read latest version
    const latest = files[files.length - 1];
    try {
      const raw = fs.readFileSync(path.join(dirPath, latest), 'utf8');
      captures.push(JSON.parse(raw));
    } catch {
      // Skip malformed captures
    }
  }

  return captures;
}

/**
 * Resolve project_id from candidate_project_links if available.
 *
 * @param {object[]} links - candidate_project_links array from capture
 * @returns {string|null} Best project_id or null
 */
function resolveProjectId(links) {
  if (!Array.isArray(links) || links.length === 0) return null;

  // Take the first direct link if available
  const direct = links.find(l => l.mode === 'direct');
  if (direct) return direct.project_id;

  // Otherwise take the first candidate
  return links[0].project_id || null;
}

/**
 * Derive calendar events for the dashboard.
 *
 * @param {object} options
 * @param {number} [options.windowDays=14] - How many days ahead to include
 * @returns {object} Derived calendar events file
 */
function deriveCalendarEvents(options = {}) {
  const { windowDays = 14 } = options;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(todayStart.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const captures = readAllCalendarCaptures();

  // Deduplicate by google_event_id, which is instance-specific for recurring
  // events (includes the date suffix, e.g., "abc_20260330T100000Z").
  // Old captures set event_id to iCalUID (same across instances); new captures
  // set event_id to google_event_id. Using google_event_id for dedup ensures
  // old and new captures for the same instance merge correctly.
  const byEventId = new Map();
  for (const cap of captures) {
    const np = cap.normalized_payload;
    if (!np) continue;

    const eventId = np.google_event_id || np.event_id || cap.source_ref;
    if (!eventId) continue;

    // Keep latest observed version
    const existing = byEventId.get(eventId);
    if (!existing || cap.observed_at > existing.observed_at) {
      byEventId.set(eventId, cap);
    }
  }

  // Filter to window and normalize
  const events = [];

  for (const cap of byEventId.values()) {
    const np = cap.normalized_payload;
    const startStr = np.start;
    if (!startStr) continue;

    const startDate = new Date(startStr);
    if (isNaN(startDate.getTime())) continue;

    // Filter: must be within [today, today + windowDays)
    if (startDate < todayStart || startDate >= windowEnd) continue;

    // Skip cancelled events
    if (np.status === 'cancelled') continue;

    const endStr = np.end;
    const endDate = endStr ? new Date(endStr) : null;

    events.push({
      event_id: np.google_event_id || np.event_id,
      date: startDate.toISOString().slice(0, 10),
      start: startStr,
      end: endStr || null,
      title: np.summary || '(no title)',
      project_id: resolveProjectId(cap.candidate_project_links),
      source_ref: cap.source_ref || null,
      location: np.location || null,
      attendees: (np.attendees || []).map(a => ({
        email: a.email,
        name: a.display_name || null,
        status: a.response_status || null,
      })),
      organizer: np.organizer ? np.organizer.email : null,
      calendar_id: np.calendar_id || null,
    });
  }

  // Sort by start time
  events.sort((a, b) => a.start.localeCompare(b.start));

  return {
    derived_at: now.toISOString(),
    window: {
      from: todayStart.toISOString().slice(0, 10),
      to: new Date(windowEnd.getTime() - 1).toISOString().slice(0, 10),
    },
    events_count: events.length,
    events,
  };
}

module.exports = { deriveCalendarEvents };
