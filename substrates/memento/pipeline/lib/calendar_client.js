/**
 * Google Calendar client using gws CLI.
 */

const { gws } = require('./gws_client');
const { getCalendarConfig, FALLBACK_CALENDAR_IDS } = require('./pipeline_config');

const ALLOWED_CALENDARS = FALLBACK_CALENDAR_IDS;

/**
 * Fetch events from a single calendar.
 *
 * @param {string} calendarId - Calendar email
 * @param {string} timeMin - ISO8601 start bound
 * @param {string} timeMax - ISO8601 end bound
 * @returns {Promise<object[]>} Array of event objects
 */
async function fetchEvents(calendarId, timeMin, timeMax) {
  const { configDir } = getCalendarConfig();
  const result = await gws('calendar', 'events', 'list', {
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  }, configDir);

  return result.items || [];
}

/**
 * Fetch events from all allowed calendars.
 *
 * @param {number} lookbackDays - Days to look back (default 7)
 * @param {number} lookaheadDays - Days to look ahead (default 14)
 * @returns {Promise<{events: object[], errors: object[]}>}
 */
async function fetchAllCalendars(lookbackDays = 7, lookaheadDays = 30) {
  const now = new Date();
  const timeMin = new Date(now.getTime() - lookbackDays * 86400000).toISOString();
  const timeMax = new Date(now.getTime() + lookaheadDays * 86400000).toISOString();

  const allEvents = [];
  const errors = [];
  const { calendarIds } = getCalendarConfig();
  // Deduplicate: same event across calendars shares iCalUID but recurring
  // instances within a calendar share iCalUID too. Use iCalUID+start to
  // keep all recurring instances but drop cross-calendar duplicates.
  const seen = new Set();

  for (const calId of calendarIds) {
    try {
      console.log(`[calendar] Fetching from ${calId}...`);
      const events = await fetchEvents(calId, timeMin, timeMax);
      let added = 0;
      for (const evt of events) {
        const start = evt.start?.dateTime || evt.start?.date || '';
        const dedupeKey = `${evt.iCalUID || evt.id}::${start}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          evt._calendar_id = calId;
          allEvents.push(evt);
          added++;
        }
      }
      console.log(`[calendar] ${calId}: ${events.length} events (${added} new after dedup)`);
    } catch (err) {
      console.error(`[calendar] ${calId} failed: ${err.message}`);
      errors.push({ calendarId: calId, error: err.message });
    }
  }

  return { events: allEvents, errors };
}

module.exports = {
  fetchEvents,
  fetchAllCalendars,
  ALLOWED_CALENDARS,
  getCalendarConfig,
};
