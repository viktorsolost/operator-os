/**
 * Calendar sync step.
 *
 * Fetch events from all allowed calendars, deduplicate by iCalUID,
 * normalize into captures.
 */

const { fetchAllCalendars } = require('../lib/calendar_client');
const { writeCapture, captureExists } = require('../lib/capture_io');
const { computeCaptureHash } = require('../lib/ingest_identity');
const { updateLastSync, updateLastRun, recordFailure } = require('../lib/sync_log');

function normalizeCalendarEvent(evt) {
  const isCancelled = evt.status === 'cancelled';
  // Use google_event_id (evt.id) as the instance-level identifier.
  // For recurring events, evt.id includes the date suffix (e.g.,
  // "6lu7tkanjreda44lkimopl8nfc_20260330T100000Z"), making each
  // instance unique. iCalUID is the same across all instances of a
  // series, so it cannot be used as the capture key.
  const instanceId = evt.id;
  const iCalUID = evt.iCalUID || evt.id;

  const payload = {
    event_id: instanceId,
    ical_uid: iCalUID,
    google_event_id: evt.id,
    summary: evt.summary || '(no title)',
    start: evt.start?.dateTime || evt.start?.date || null,
    end: evt.end?.dateTime || evt.end?.date || null,
    location: evt.location || null,
    description: evt.description || null,
    attendees: (evt.attendees || []).map(a => ({
      email: a.email,
      response_status: a.responseStatus,
      display_name: a.displayName || null,
    })),
    status: evt.status,
    created: evt.created,
    updated: evt.updated,
    organizer: evt.organizer ? { email: evt.organizer.email, display_name: evt.organizer.displayName || null } : null,
    calendar_id: evt._calendar_id || null,
    recurring_event_id: evt.recurringEventId || null,
  };

  const captureHash = computeCaptureHash(payload);
  // Use instance-level google_event_id for capture_id so each recurring
  // instance gets its own directory. Cross-calendar dedup happens upstream
  // in calendar_client.js via iCalUID+start.
  const captureId = `calendar_event_${sanitizeId(instanceId)}`;

  return {
    capture_id: captureId,
    source: 'calendar',
    source_ref: `calendar:${instanceId}`,
    observation_kind: isCancelled ? 'event_cancelled' : 'event',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function sanitizeId(id) {
  // Replace characters that are problematic in filenames
  return id.replace(/[@.]/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Add candidate project links based on calendar_ids and alias matching.
 */
function addCandidateLinks(capture, registry) {
  const candidates = [];
  const payload = capture.normalized_payload;
  const title = (payload.summary || '').toLowerCase();
  const description = (payload.description || '').toLowerCase();

  for (const project of registry.projects) {
    if (project.status !== 'active') continue;
    const refs = project.source_refs || {};

    // Check calendar_ids for direct match
    if (refs.calendar_ids?.includes(payload.event_id)) {
      candidates.push({
        project_id: project.project_id,
        confidence: 'direct',
        basis: [`calendar_id:${payload.event_id}`],
      });
      continue;
    }

    // Alias match on event title
    const aliases = (project.aliases || []).map(a => a.toLowerCase());
    for (const alias of aliases) {
      if (title.includes(alias) || description.includes(alias)) {
        candidates.push({
          project_id: project.project_id,
          confidence: 'inferred',
          basis: [`alias_match:${alias}`],
        });
        break;
      }
    }
  }

  capture.candidate_project_links = candidates;
}

/**
 * Run Calendar sync.
 *
 * @param {object} registry - The full registry object
 * @returns {Promise<object>} Summary
 */
async function run(registry) {
  const summary = { fetched: 0, written: 0, skipped: 0, errors: [] };
  const runTimestamp = new Date().toISOString();

  try {
    const { events, errors } = await fetchAllCalendars(7, 14);
    summary.fetched = events.length;
    summary.errors.push(...errors.map(e => ({ type: 'calendar_fetch', ...e })));
    for (const e of errors) {
      recordFailure('calendar', {
        timestamp: new Date().toISOString(),
        source: 'calendar',
        account: e.calendarId || e.calendar_id || 'unknown',
        error: e.error || String(e),
        action: 'skipped',
      });
    }

    for (const evt of events) {
      const capture = normalizeCalendarEvent(evt);
      addCandidateLinks(capture, registry);

      if (captureExists('calendar', capture.capture_id, capture.capture_hash)) {
        summary.skipped++;
        continue;
      }
      writeCapture('calendar', capture);
      summary.written++;
    }

    updateLastSync('calendar', null, new Date().toISOString());
  } catch (err) {
    console.error(`[calendar_sync] Fatal: ${err.message}`);
    summary.errors.push({ type: 'fatal', error: err.message });
    recordFailure('calendar', {
      timestamp: new Date().toISOString(),
      source: 'calendar',
      account: 'unknown',
      error: err.message,
      action: 'skipped',
    });
  }

  updateLastRun('calendar', runTimestamp);
  return summary;
}

module.exports = { run };
