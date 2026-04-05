'use strict';

/**
 * Editorial derivation module.
 *
 * Produces state/derived/editorial.json with overdue and upcoming deadlines
 * across all active projects.
 *
 * Two resolution paths per project:
 *   - Sheets-based: when project has production_calendar in source_refs
 *   - Basecamp-based: fallback, joins facts files with Basecamp todo captures
 *
 * Deduplication: if a project uses Sheets, all Basecamp deadlines for that
 * project are suppressed.
 *
 * Phase 1: Contact name resolution in resolved_threads
 * Phase 2: Single Haiku API call for activity highlights, calendar tagging,
 *           contact suggestions, and inconsistency flags
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.resolve(__dirname, '../../state');
const CAPTURES_DIR = path.join(STATE_DIR, 'captures');
const FACTS_DIR = path.join(STATE_DIR, 'derived', 'facts');
const THREADS_DIR = path.join(STATE_DIR, 'derived', 'threads');
const ACTIVITY_DIR = path.join(STATE_DIR, 'derived', 'activity');
const RUNTIME_DIR = path.join(STATE_DIR, 'runtime');
const CONTACT_NAMES_PATH = path.join(RUNTIME_DIR, 'contact_names.json');
const EDITORIAL_NOTES_PATH = path.join(RUNTIME_DIR, 'editorial_notes.json');
const EDITORIAL_PATH = path.join(STATE_DIR, 'derived', 'editorial.json');

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Parse a YYYY-MM-DD date string into a local Date at midnight.
 * Returns null for empty/null/unparseable values.
 *
 * @param {string} dateStr
 * @returns {Date|null}
 */
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  // Expect YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Return today as a Date at midnight local time.
 * @returns {Date}
 */
function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Days a date is overdue relative to today (negative = future/today).
 * An item due today returns 0 (not overdue).
 *
 * @param {Date} dueDate
 * @returns {number}
 */
function daysOverdue(dueDate) {
  const todayMs = today().getTime();
  const dueMs = dueDate.getTime();
  // Difference in whole days, floored
  return Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Assignee formatting
// ---------------------------------------------------------------------------

/**
 * Format an array of assignee objects (with .name) to a display string.
 * - Empty → "Unassigned"
 * - 1–3 → first names joined with " & "
 * - 4+  → "Name & N others"
 *
 * @param {Array<{name: string}>} assignees
 * @returns {string}
 */
function formatAssignees(assignees) {
  if (!Array.isArray(assignees) || assignees.length === 0) return 'Unassigned';

  const fullName = (person) => {
    return (person && person.name) ? String(person.name).trim() : '';
  };

  if (assignees.length <= 3) {
    return assignees.map(fullName).join(' & ');
  }

  return `${fullName(assignees[0])} & ${assignees.length - 1} others`;
}

// ---------------------------------------------------------------------------
// Capture helpers
// ---------------------------------------------------------------------------

/**
 * Read the latest file from a capture directory.
 *
 * @param {string} captureDir - Full path to the capture_id directory
 * @returns {object|null}
 */
function readLatestInDir(captureDir) {
  if (!fs.existsSync(captureDir)) return null;

  const files = fs.readdirSync(captureDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) return null;

  const raw = fs.readFileSync(path.join(captureDir, files[files.length - 1]), 'utf8');
  return JSON.parse(raw);
}

/**
 * Get the latest capture file path (not just contents) from a capture directory.
 *
 * @param {string} captureDir
 * @returns {string|null}
 */
function getLatestCapturePath(captureDir) {
  if (!fs.existsSync(captureDir)) return null;

  const files = fs.readdirSync(captureDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) return null;
  return path.join(captureDir, files[files.length - 1]);
}

// ---------------------------------------------------------------------------
// Path 1: Sheets-based resolution
// ---------------------------------------------------------------------------

/**
 * Collect all sheets captures that belong to a given project.
 *
 * @param {string} projectId
 * @returns {object[]} Array of normalized_payload objects
 */
function collectSheetsTasks(projectId) {
  const sheetsDir = path.join(CAPTURES_DIR, 'sheets');
  if (!fs.existsSync(sheetsDir)) return [];

  const tasks = [];

  const captureIds = fs.readdirSync(sheetsDir);
  for (const captureId of captureIds) {
    const captureIdDir = path.join(sheetsDir, captureId);
    if (!fs.statSync(captureIdDir).isDirectory()) continue;

    const capture = readLatestInDir(captureIdDir);
    if (!capture) continue;

    const payload = capture.normalized_payload;
    if (!payload || payload.project_id !== projectId) continue;

    tasks.push(payload);
  }

  return tasks;
}

/**
 * Derive overdue and upcoming items for a Sheets-backed project.
 *
 * @param {string} projectId
 * @returns {{ overdue: object[], upcoming: object[] }}
 */
function resolveSheets(projectId) {
  const tasks = collectSheetsTasks(projectId);
  const todayDate = today();
  const overdue = [];
  const upcoming = [];

  for (const task of tasks) {
    const status = typeof task.status === 'string' ? task.status.trim().toLowerCase() : '';
    // Skip non-actionable items
    if (status === 'done' || status === 'does not apply') continue;

    const deadline = task.deadline || task.due_date || task.due_on || '';
    if (!deadline) continue;

    const dueDate = parseDate(String(deadline));
    if (!dueDate) continue;

    const overdueDays = daysOverdue(dueDate);

    const item = {
      project_id: projectId,
      task_id: task.task_id || null,
      title: task.title || task.name || '',
      assignee: task.owner || 'Unassigned',
      due_date: String(deadline).slice(0, 10),
      days_overdue: Math.max(overdueDays, 0),
      sop_ref: task.sop_ref || null,
      area: task.area || null,
      artist: task.artist || null,
      source: 'sheets',
      note: null,
    };

    if (overdueDays > 0) {
      overdue.push(item);
    } else {
      // Today (0) and future (negative) → upcoming
      item.days_overdue = 0;
      upcoming.push(item);
    }
  }

  return { overdue, upcoming };
}

// ---------------------------------------------------------------------------
// Path 2: Basecamp-based resolution
// ---------------------------------------------------------------------------

/**
 * Load a facts JSON file for a project.
 *
 * @param {string} projectId
 * @returns {object|null} The facts object (keyed by fact_key)
 */
function loadFacts(projectId) {
  const factsPath = path.join(FACTS_DIR, `${projectId}.json`);
  if (!fs.existsSync(factsPath)) return null;

  const raw = fs.readFileSync(factsPath, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed.facts || {};
}

/**
 * Find the basecamp capture directory for a given todo ID.
 * Directory names follow the pattern: bc_todo_{bcProjectId}_{todoId}
 *
 * @param {string} todoId
 * @returns {string|null} Full path to the capture directory, or null
 */
function findBasecampTodoDir(todoId) {
  const basecampDir = path.join(CAPTURES_DIR, 'basecamp');
  if (!fs.existsSync(basecampDir)) return null;

  const entries = fs.readdirSync(basecampDir);
  const suffix = `_${todoId}`;

  for (const entry of entries) {
    if (entry.startsWith('bc_todo_') && entry.endsWith(suffix)) {
      return path.join(basecampDir, entry);
    }
  }

  return null;
}

/**
 * Derive overdue and upcoming items for a Basecamp-backed project.
 *
 * @param {string} projectId
 * @returns {{ overdue: object[], upcoming: object[] }}
 */
function resolveBasecamp(projectId) {
  const facts = loadFacts(projectId);
  if (!facts) return { overdue: [], upcoming: [] };

  // Collect todo IDs that have BOTH a due date and a status fact
  const todoIds = new Set();

  for (const key of Object.keys(facts)) {
    if (key.startsWith('todo_due_')) {
      const id = key.slice('todo_due_'.length);
      todoIds.add(id);
    }
  }

  const todayDate = today();
  const overdue = [];
  const upcoming = [];

  for (const todoId of todoIds) {
    const dueKey = `todo_due_${todoId}`;
    const statusKey = `todo_status_${todoId}`;

    // Must have both
    if (!facts[dueKey] || !facts[statusKey]) continue;

    const status = facts[statusKey].current_value;
    // Only open todos
    if (!status || String(status).toLowerCase() !== 'open') continue;

    const deadline = facts[dueKey].current_value;
    if (!deadline) continue;

    const dueDate = parseDate(String(deadline));
    if (!dueDate) continue;

    // Find and read the capture to get title and assignees
    const captureDir = findBasecampTodoDir(todoId);
    if (!captureDir) continue;

    const capture = readLatestInDir(captureDir);
    if (!capture) continue;

    const payload = capture.normalized_payload || {};

    // If the capture says completed=true, it's more recent than the fact — skip
    if (payload.completed === true) continue;

    const overdueDays = daysOverdue(dueDate);

    const item = {
      project_id: projectId,
      task_id: todoId,
      title: payload.title || '',
      assignee: formatAssignees(payload.assignees),
      due_date: String(deadline).slice(0, 10),
      days_overdue: Math.max(overdueDays, 0),
      sop_ref: null,
      area: null,
      artist: null,
      source: 'basecamp',
      note: null,
    };

    if (overdueDays > 0) {
      overdue.push(item);
    } else {
      item.days_overdue = 0;
      upcoming.push(item);
    }
  }

  return { overdue, upcoming };
}

// ---------------------------------------------------------------------------
// Phase 1: Contact name resolution
// ---------------------------------------------------------------------------

/**
 * Load contact_names.json — creates as {} if missing.
 *
 * @returns {object} email → name|null map
 */
function loadContactNames() {
  if (!fs.existsSync(CONTACT_NAMES_PATH)) {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTACT_NAMES_PATH, JSON.stringify({}, null, 2), 'utf8');
    return {};
  }
  const raw = fs.readFileSync(CONTACT_NAMES_PATH, 'utf8');
  return JSON.parse(raw);
}

/**
 * Resolve threads across all active projects, resolving counterparty emails
 * to display names where available.
 *
 * @param {object[]} projects - Active project objects from registry
 * @param {object} contactNames - email → name|null map
 * @returns {object[]} resolved_threads array
 */
function resolveThreads(projects, contactNames) {
  const resolved = [];

  for (const project of projects) {
    const projectId = project.project_id;
    const threadsPath = path.join(THREADS_DIR, `${projectId}.json`);
    if (!fs.existsSync(threadsPath)) continue;

    let threadsData;
    try {
      threadsData = JSON.parse(fs.readFileSync(threadsPath, 'utf8'));
    } catch (e) {
      continue;
    }

    const openThreads = threadsData.open_threads || [];

    for (const thread of openThreads) {
      const rawCounterparty = thread.counterparty;

      // Resolve email → name if applicable
      let counterparty = rawCounterparty;
      if (
        rawCounterparty &&
        typeof rawCounterparty === 'string' &&
        rawCounterparty.includes('@') &&
        Object.prototype.hasOwnProperty.call(contactNames, rawCounterparty) &&
        contactNames[rawCounterparty] !== null
      ) {
        counterparty = contactNames[rawCounterparty];
      }

      resolved.push({
        project_id: projectId,
        thread_key: thread.thread_key,
        signal_type: thread.signal_type,
        counterparty,
        basis: (thread.opened_by && thread.opened_by.basis) || null,
        age_days: thread.age_days || 0,
      });
    }
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// Phase 2: Haiku LLM call helpers
// ---------------------------------------------------------------------------

/**
 * Load activity entries for a project, filtered to those since a cutoff time.
 *
 * @param {string} projectId
 * @param {Date} cutoff
 * @returns {object[]}
 */
function loadActivitySinceLastRun(projectId, cutoff) {
  const activityPath = path.join(ACTIVITY_DIR, `${projectId}.json`);
  if (!fs.existsSync(activityPath)) return [];

  let data;
  try {
    data = JSON.parse(fs.readFileSync(activityPath, 'utf8'));
  } catch (e) {
    return [];
  }

  const entries = data.entries || [];
  const allowedTypes = new Set([
    'communication_received',
    'communication_sent',
    'basecamp_message',
    'basecamp_todo_change',
    'manual_note',
    'meeting_scheduled',
    'calendar_event_change',
  ]);

  return entries.filter(e => {
    if (!allowedTypes.has(e.entry_type)) return false;
    if (!e.timestamp) return false;
    return new Date(e.timestamp) >= cutoff;
  });
}

/**
 * Collect untagged calendar events in the next 14 days.
 *
 * @returns {object[]}
 */
function collectUntaggedCalendarEvents() {
  const calendarDir = path.join(CAPTURES_DIR, 'calendar');
  if (!fs.existsSync(calendarDir)) return [];

  const now = new Date();
  const cutoffFuture = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const events = [];

  const dirs = fs.readdirSync(calendarDir);
  for (const dir of dirs) {
    const captureDir = path.join(calendarDir, dir);
    if (!fs.statSync(captureDir).isDirectory()) continue;

    const capture = readLatestInDir(captureDir);
    if (!capture) continue;

    // Check candidate_project_links
    const links = capture.candidate_project_links;
    if (links && Array.isArray(links) && links.length > 0) continue;
    if (links && !Array.isArray(links) && typeof links === 'object' && Object.keys(links).length > 0) continue;

    const payload = capture.normalized_payload;
    if (!payload) continue;

    // Check if event is in next 14 days
    const startStr = payload.start;
    if (!startStr) continue;
    const startDate = new Date(startStr);
    if (isNaN(startDate.getTime())) continue;
    if (startDate < now || startDate > cutoffFuture) continue;

    events.push({
      event_id: payload.event_id || capture.capture_id || dir,
      summary: payload.summary || '',
      start: startStr,
      attendees: (payload.attendees || []).map(a => ({
        email: a.email,
        display_name: a.display_name || null,
      })),
      organizer_email: (payload.organizer && payload.organizer.email) || null,
      _capture_dir: captureDir,
    });
  }

  return events.slice(0, 20);
}

/**
 * Collect unknown counterparties (email in threads, not in contact_names).
 *
 * @param {object[]} projects
 * @param {object} contactNames
 * @returns {object[]}
 */
function collectUnknownCounterparties(projects, contactNames) {
  const emailMap = {}; // email → { projects: Set, thread_context: string }

  for (const project of projects) {
    const projectId = project.project_id;
    const threadsPath = path.join(THREADS_DIR, `${projectId}.json`);
    if (!fs.existsSync(threadsPath)) continue;

    let threadsData;
    try {
      threadsData = JSON.parse(fs.readFileSync(threadsPath, 'utf8'));
    } catch (e) {
      continue;
    }

    const openThreads = threadsData.open_threads || [];
    for (const thread of openThreads) {
      const cp = thread.counterparty;
      if (!cp || !cp.includes('@')) continue;
      if (Object.prototype.hasOwnProperty.call(contactNames, cp)) continue;

      if (!emailMap[cp]) {
        emailMap[cp] = { projects: new Set(), thread_context: '' };
      }
      emailMap[cp].projects.add(projectId);
      if (!emailMap[cp].thread_context && thread.opened_by && thread.opened_by.basis) {
        emailMap[cp].thread_context = thread.opened_by.basis;
      }
    }
  }

  return Object.entries(emailMap)
    .slice(0, 20)
    .map(([email, info]) => ({
      email,
      projects: Array.from(info.projects),
      thread_context: info.thread_context,
    }));
}

/**
 * Collect Basecamp/Sheets status mismatches.
 *
 * @param {object[]} projects
 * @param {object[]} sheetsDeadlines - Combined overdue + upcoming from Sheets
 * @returns {object[]}
 */
function collectStatusMismatches(projects, sheetsDeadlines) {
  const mismatches = [];

  for (const deadline of sheetsDeadlines) {
    if (deadline.source !== 'sheets') continue;

    const projectId = deadline.project_id;
    const facts = loadFacts(projectId);
    if (!facts) continue;

    // Look for Basecamp todos with similar title
    for (const key of Object.keys(facts)) {
      if (!key.startsWith('todo_due_')) continue;
      const todoId = key.slice('todo_due_'.length);
      const statusKey = `todo_status_${todoId}`;
      if (!facts[statusKey]) continue;

      const captureDir = findBasecampTodoDir(todoId);
      if (!captureDir) continue;

      const capture = readLatestInDir(captureDir);
      if (!capture) continue;

      const payload = capture.normalized_payload || {};
      const bcTitle = (payload.title || '').toLowerCase().trim();
      const sheetsTitle = (deadline.title || '').toLowerCase().trim();

      // Simple similarity: one contains the other or they share words
      if (!bcTitle || !sheetsTitle) continue;
      const similarity = bcTitle === sheetsTitle ||
        bcTitle.includes(sheetsTitle) ||
        sheetsTitle.includes(bcTitle);

      if (!similarity) continue;

      const bcStatus = facts[statusKey].current_value || '';
      const bcDue = facts[key].current_value || '';
      const sheetsStatus = 'open'; // sheets items are non-done
      const sheetsDue = deadline.due_date;

      // Flag if status or date disagree meaningfully
      const statusDisagrees = bcStatus.toLowerCase() !== sheetsStatus.toLowerCase();
      const dateDisagrees = bcDue && sheetsDue && bcDue.slice(0, 10) !== sheetsDue.slice(0, 10);

      if (statusDisagrees || dateDisagrees) {
        mismatches.push({
          project_id: projectId,
          task_title: deadline.title,
          sheets_status: sheetsStatus,
          sheets_due: sheetsDue,
          basecamp_status: bcStatus,
          basecamp_due: bcDue ? bcDue.slice(0, 10) : null,
        });
      }
    }
  }

  return mismatches.slice(0, 15);
}

/**
 * Collect unique artist names per project from sheets captures.
 *
 * @returns {Record<string, string[]>} project_id → sorted artist names
 */
function collectArtistsPerProject() {
  const sheetsDir = path.join(CAPTURES_DIR, 'sheets');
  if (!fs.existsSync(sheetsDir)) return {};

  const result = {}; // project_id → Set<string>

  const dirs = fs.readdirSync(sheetsDir);
  for (const dir of dirs) {
    const captureDir = path.join(sheetsDir, dir);
    if (!fs.statSync(captureDir).isDirectory()) continue;

    const capture = readLatestInDir(captureDir);
    if (!capture) continue;

    const payload = capture.normalized_payload;
    if (!payload || !payload.project_id || !payload.artist) continue;

    if (!result[payload.project_id]) result[payload.project_id] = new Set();
    result[payload.project_id].add(payload.artist);
  }

  // Convert sets to sorted arrays
  const out = {};
  for (const [pid, artists] of Object.entries(result)) {
    out[pid] = Array.from(artists).sort();
  }
  return out;
}

/**
 * Build the prompt string for the Haiku API call.
 *
 * @param {object} registry
 * @param {object[]} activityEntries
 * @param {object[]} untaggedEvents
 * @param {object[]} unknownCounterparties
 * @param {object[]} mismatches
 * @returns {string}
 */
function buildHaikuPrompt(registry, activityEntries, untaggedEvents, unknownCounterparties, mismatches) {
  const projects = (registry && Array.isArray(registry.projects)) ? registry.projects : [];

  // Build project list with artist rosters
  const artistsByProject = collectArtistsPerProject();

  const projectList = projects.map(p => {
    const aliases = (p.aliases || []).join(', ');
    let line = `- ${p.project_id}: "${p.name || p.project_id}"${aliases ? ` (aliases: ${aliases})` : ''}`;
    const artists = artistsByProject[p.project_id];
    if (artists && artists.length > 0) {
      line += `\n  Artists: ${artists.join(', ')}`;
    }
    return line;
  }).join('\n');

  // Format activity entries
  const activityStr = JSON.stringify(
    activityEntries.map(e => ({
      project_id: e.project_id,
      entry_type: e.entry_type,
      title: e.title,
      summary: e.summary,
      actors: e.actors,
    })),
    null,
    2
  );

  // Format untagged events (exclude internal _capture_dir)
  const eventsStr = JSON.stringify(
    untaggedEvents.map(e => ({
      event_id: e.event_id,
      summary: e.summary,
      start: e.start,
      attendees: e.attendees,
      organizer_email: e.organizer_email,
    })),
    null,
    2
  );

  const contactsStr = JSON.stringify(unknownCounterparties, null, 2);
  const mismatchesStr = JSON.stringify(mismatches, null, 2);

  return `You are a project operations assistant. You receive overnight data from 4 active projects and return structured editorial annotations.

## Projects

${projectList}

## Domain Context

- "Eterno" and "Eterno Gallery" refer to the gallery/venue operating all projects above. "Eterno" is NOT a project — it is the organization.
- Calendar events named "Eterno x [Name]" are artist meetings. Match the name to an artist listed above to determine the project. For example, "Eterno x Zaf" = Zafgod = punks-2026.
- Events organized from viktor@eternogallery.com or with attendees at cultural-affairs.com / under-dogs.net / eternogallery.com are internal team events — tag them to the project whose artists or context they match.

## Task 1: Activity Highlights

For each project below, write ONE sentence highlighting the most notable overnight activity. If nothing notable happened, respond with "Quiet night."

${activityStr}

Respond as JSON:
{ "activity_highlights": { "<project_id>": "<one-liner or 'Quiet night'>" } }

## Task 2: Calendar Event Tagging

Assign a project_id to each untagged calendar event based on its title, attendees, and context. Use "cross-project" if the event spans multiple projects or doesn't clearly belong to one.

${eventsStr}

Respond as JSON:
{ "calendar_tagging": [{ "event_id": "<id>", "project_id": "<project_id or 'cross-project'>", "confidence": "high" | "medium" | "low" }] }

## Task 3: Contact Name Suggestions

For each unknown email address, suggest the likely human name based on the email handle, the project context, and any thread context provided. If you cannot determine the name, respond with null.

${contactsStr}

Respond as JSON:
{ "contact_suggestions": [{ "email": "<address>", "suggested_name": "<name or null>", "confidence": "high" | "medium" | "low" }] }

## Task 4: Inconsistency Flags

Compare these Basecamp/Sheets pairs where status or dates disagree. For each, flag what's inconsistent and cite both sources.

${mismatchesStr}

Respond as JSON:
{ "inconsistency_flags": [{ "project_id": "<id>", "task_title": "<title>", "issue": "<what disagrees>", "sheets_says": "<status/date>", "basecamp_says": "<status/date>" }] }

## Response Format

Return a single JSON object combining all four task outputs:
{
  "activity_highlights": { ... },
  "calendar_tagging": [ ... ],
  "contact_suggestions": [ ... ],
  "inconsistency_flags": [ ... ]
}`;
}

/**
 * Patch a calendar capture file to add a project link.
 *
 * @param {string} captureDir
 * @param {string} projectId
 */
function patchCalendarCapture(captureDir, projectId) {
  try {
    const filePath = getLatestCapturePath(captureDir);
    if (!filePath) return;

    const capture = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(capture.candidate_project_links)) {
      capture.candidate_project_links = [];
    }

    // Avoid duplicates
    const already = capture.candidate_project_links.some(l => l.project_id === projectId);
    if (!already) {
      capture.candidate_project_links.push({
        project_id: projectId,
        mode: 'candidate',
        basis: ['editorial:haiku_auto_tag'],
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(capture, null, 2), 'utf8');
  } catch (e) {
    console.warn(`[derive_editorial] Failed to patch calendar capture ${captureDir}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// Editorial notes
// ---------------------------------------------------------------------------

/**
 * Load editorial_notes.json. This file is persistent — written by Claudia
 * in conversation, never overwritten by the pipeline.
 *
 * @returns {object[]} Array of note objects
 */
function loadEditorialNotes() {
  if (!fs.existsSync(EDITORIAL_NOTES_PATH)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(EDITORIAL_NOTES_PATH, 'utf8'));
    return Array.isArray(data.notes) ? data.notes : [];
  } catch (e) {
    return [];
  }
}

/**
 * Merge notes from editorial_notes.json onto deadline items.
 * Match by project_id + task_id. Mutates items in place.
 *
 * @param {object[]} items - overdue or upcoming deadline array
 */
function mergeEditorialNotes(items) {
  const notes = loadEditorialNotes();
  if (notes.length === 0) return;

  // Build lookup: "project_id::task_id" → note text
  const lookup = {};
  for (const n of notes) {
    if (!n.project_id || !n.task_id || !n.note) continue;
    const key = `${n.project_id}::${n.task_id}`;
    // Last note wins if duplicates exist
    lookup[key] = n.note;
  }

  for (const item of items) {
    if (!item.task_id) continue;
    const key = `${item.project_id}::${item.task_id}`;
    if (lookup[key]) {
      item.note = lookup[key];
    }
  }
}

// ---------------------------------------------------------------------------
// Main derivation
// ---------------------------------------------------------------------------

/**
 * Derive editorial deadlines across all active projects.
 *
 * @param {object} registry - The registry.json object
 * @returns {Promise<object>} Editorial output — see output schema in spec
 */
async function deriveEditorial(registry) {
  const projects = (registry && Array.isArray(registry.projects))
    ? registry.projects
    : [];

  const allOverdue = [];
  const allUpcoming = [];

  for (const project of projects) {
    const projectId = project.project_id;
    const sourceRefs = project.source_refs || {};

    // Determine resolution path: Sheets if production_calendar is set
    const hasProductionCalendar = !!sourceRefs.production_calendar;

    if (hasProductionCalendar) {
      // Path 1: Sheets-based — suppresses Basecamp for this project
      const { overdue, upcoming } = resolveSheets(projectId);
      allOverdue.push(...overdue);
      allUpcoming.push(...upcoming);
    } else {
      // Path 2: Basecamp-based
      const { overdue, upcoming } = resolveBasecamp(projectId);
      allOverdue.push(...overdue);
      allUpcoming.push(...upcoming);
    }
  }

  // Sort: overdue desc by days_overdue, upcoming asc by due_date
  allOverdue.sort((a, b) => b.days_overdue - a.days_overdue);
  allUpcoming.sort((a, b) => {
    if (a.due_date < b.due_date) return -1;
    if (a.due_date > b.due_date) return 1;
    return 0;
  });

  // -------------------------------------------------------------------------
  // Phase 1a: Merge editorial notes onto deadline items
  // -------------------------------------------------------------------------

  mergeEditorialNotes(allOverdue);
  mergeEditorialNotes(allUpcoming);

  // -------------------------------------------------------------------------
  // Phase 1b: Contact name resolution in resolved_threads
  // -------------------------------------------------------------------------

  const contactNames = loadContactNames();
  const resolvedThreads = resolveThreads(projects, contactNames);

  // -------------------------------------------------------------------------
  // Phase 2: Haiku LLM call
  // -------------------------------------------------------------------------

  let activityHighlights = {};
  let calendarTagging = [];
  let contactSuggestions = [];
  let inconsistencyFlags = [];

  try {
    // Determine cutoff from last editorial run (or 24h ago)
    let cutoff;
    try {
      if (fs.existsSync(EDITORIAL_PATH)) {
        const prevEditorial = JSON.parse(fs.readFileSync(EDITORIAL_PATH, 'utf8'));
        if (prevEditorial.derived_at) {
          cutoff = new Date(prevEditorial.derived_at);
        }
      }
    } catch (e) {
      // ignore
    }
    if (!cutoff || isNaN(cutoff.getTime())) {
      cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Assemble payloads
    const allActivityEntries = [];
    for (const project of projects) {
      const entries = loadActivitySinceLastRun(project.project_id, cutoff);
      const withProjectId = entries.map(e => ({ ...e, project_id: project.project_id }));
      allActivityEntries.push(...withProjectId);
    }
    // Sort by timestamp desc and cap at 50
    allActivityEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const activityEntries = allActivityEntries.slice(0, 50);

    const untaggedEvents = collectUntaggedCalendarEvents();
    const unknownCounterparties = collectUnknownCounterparties(projects, contactNames);
    const allDeadlines = [...allOverdue, ...allUpcoming];
    const mismatches = collectStatusMismatches(projects, allDeadlines);

    // Load config
    let editorialModel = 'claude-haiku-4-5-20251001';
    try {
      const configPath = path.resolve(__dirname, '../config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.editorial_model) editorialModel = config.editorial_model;
      }
    } catch (e) {
      // use default
    }

    // Build prompt
    const prompt = buildHaikuPrompt(registry, activityEntries, untaggedEvents, unknownCounterparties, mismatches);

    // Make CLI call — uses subscription auth, no API key required
    const { execFileSync } = require('child_process');
    const rawOutput = execFileSync(
      'claude',
      ['-p', prompt, '--model', editorialModel, '--output-format', 'json'],
      { encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
    );

    // The CLI returns a JSON envelope; the LLM response text is in the `result` field
    const envelope = JSON.parse(rawOutput);
    const resultText = envelope.result || '';

    // Parse response — extract JSON from within code fences or raw text
    let parsed;
    try {
      // First try: extract JSON object from within ```json ... ``` fences
      const fenceMatch = resultText.match(/```json\s*(\{[\s\S]*\})\s*```/);
      const candidate = fenceMatch ? fenceMatch[1].trim() : resultText.trim();
      parsed = JSON.parse(candidate);
    } catch (e) {
      console.warn(`[derive_editorial] Haiku response not valid JSON. Phase 2 skipped.`);
      parsed = null;
    }

    if (parsed) {
      // Activity highlights
      activityHighlights = parsed.activity_highlights || {};

      // Calendar tagging — high confidence → patch captures
      const rawTagging = Array.isArray(parsed.calendar_tagging) ? parsed.calendar_tagging : [];
      calendarTagging = rawTagging;

      // Build event_id → _capture_dir map from untaggedEvents
      const eventDirMap = {};
      for (const ev of untaggedEvents) {
        eventDirMap[ev.event_id] = ev._capture_dir;
      }

      for (const tag of rawTagging) {
        if (tag.confidence === 'high' && tag.project_id && tag.project_id !== 'cross-project') {
          const captureDir = eventDirMap[tag.event_id];
          if (captureDir) {
            patchCalendarCapture(captureDir, tag.project_id);
          }
        }
      }

      // Contact suggestions — high confidence → auto-add to contact_names.json
      const rawSuggestions = Array.isArray(parsed.contact_suggestions) ? parsed.contact_suggestions : [];
      contactSuggestions = rawSuggestions;

      let contactNamesUpdated = false;
      for (const suggestion of rawSuggestions) {
        if (
          suggestion.confidence === 'high' &&
          suggestion.email &&
          suggestion.suggested_name !== null &&
          suggestion.suggested_name !== undefined
        ) {
          contactNames[suggestion.email] = suggestion.suggested_name;
          contactNamesUpdated = true;
        }
      }

      if (contactNamesUpdated) {
        try {
          fs.writeFileSync(CONTACT_NAMES_PATH, JSON.stringify(contactNames, null, 2), 'utf8');
        } catch (e) {
          console.warn(`[derive_editorial] Failed to update contact_names.json: ${e.message}`);
        }
      }

      // Inconsistency flags
      inconsistencyFlags = Array.isArray(parsed.inconsistency_flags) ? parsed.inconsistency_flags : [];
    }
  } catch (e) {
    console.warn(`[derive_editorial] Claude CLI call failed: ${e.message}. Phase 2 skipped.`);
  }

  return {
    derived_at: new Date().toISOString(),
    overdue_deadlines: allOverdue,
    upcoming_deadlines: allUpcoming,
    resolved_threads: resolvedThreads,
    activity_highlights: activityHighlights,
    calendar_tagging: calendarTagging,
    contact_suggestions: contactSuggestions,
    inconsistency_flags: inconsistencyFlags,
  };
}

module.exports = { deriveEditorial };
