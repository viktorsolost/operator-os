/**
 * export_html.js — Renders state/derived/today.html from pipeline state files.
 *
 * Pure consumer of existing derived state. No JSX, no React, no templating engine.
 * String concatenation and template literals only.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATE_DIR = path.resolve(__dirname, '../../state');
const DERIVED_DIR = path.join(STATE_DIR, 'derived');
const HTML_PATH = path.join(DERIVED_DIR, 'today.html');
const ARCHIVE_DIR = path.join(STATE_DIR, 'archive');

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

function esc(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Date helpers (ported from page.tsx)
// ---------------------------------------------------------------------------

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateString(d) {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(d) {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatShortDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatWeekDayLabel(d) {
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = d.getDate();
  return `${weekday} ${day}`;
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function formatTime(isoOrTime) {
  const timeStr = isoOrTime.includes('T') ? isoOrTime.split('T')[1] : isoOrTime;
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const min = (minStr || '00').slice(0, 2);
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min}${period}`;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function resolveProjectName(projectId, registry) {
  const projects = registry.projects || [];
  const project = projects.find(
    (p) => p.project_id === projectId || (p.aliases || []).includes(projectId)
  );
  return project ? project.name : projectId;
}

function resolveAttendees(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a && typeof a === 'object') return a.name || a.email || '';
      return '';
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

function loadEditorial() {
  const data = readJson(path.join(DERIVED_DIR, 'editorial.json'));
  return {
    derived_at: data?.derived_at ?? '',
    overdue_deadlines: data?.overdue_deadlines ?? [],
    upcoming_deadlines: data?.upcoming_deadlines ?? [],
    resolved_threads: data?.resolved_threads ?? [],
    activity_highlights: data?.activity_highlights ?? {},
  };
}

function loadCalendarEvents(dateFrom, dateTo) {
  const data = readJson(path.join(DERIVED_DIR, 'calendar_events.json'));
  if (!data?.events) return [];
  return data.events.filter((e) => e.date >= dateFrom && e.date <= dateTo);
}

function loadReminders() {
  const data = readJson(path.join(STATE_DIR, 'runtime/reminders.json'));
  if (!data?.reminders) return [];
  const KIND_ORDER = { alert: 0, task: 1, idea: 2 };
  return data.reminders
    .filter((r) => r.status === 'open')
    .sort((a, b) => (KIND_ORDER[a.kind] ?? 99) - (KIND_ORDER[b.kind] ?? 99));
}

function loadSyncStatus() {
  const syncLogDir = path.join(STATE_DIR, 'sync_log');
  const sourceNames = ['gmail', 'basecamp', 'calendar', 'drive'];
  const sources = [];

  for (const name of sourceNames) {
    const data = readJson(path.join(syncLogDir, `${name}.json`));
    const lastRun = data?.last_run ?? data?.lastRun ?? null;
    if (lastRun) sources.push({ name, lastRun });
  }

  if (sources.length === 0) return null;

  sources.sort((a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime());
  return { lastSynced: new Date(sources[0].lastRun), sources };
}

function loadRegistry() {
  return readJson(path.join(STATE_DIR, 'registry.json')) || { projects: [] };
}

function loadOpeningNights(registry) {
  const factsDir = path.join(DERIVED_DIR, 'facts');
  if (!fs.existsSync(factsDir)) return [];

  const results = [];
  const files = fs.readdirSync(factsDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const data = readJson(path.join(factsDir, file));
    if (!data?.facts) continue;
    for (const [key, value] of Object.entries(data.facts)) {
      if (key === 'opening_date' && value) {
        results.push({ project_id: data.project_id, due_date: String(value) });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Render helpers (ported from page.tsx React components → HTML strings)
// ---------------------------------------------------------------------------

function renderOverdue(deadlines, registry) {
  if (deadlines.length === 0) return '';

  const byProject = groupBy(deadlines, (d) => d.project_id);
  let html = '';

  for (const [projectId, projectDeadlines] of Object.entries(byProject)) {
    const projectName = resolveProjectName(projectId, registry);
    const byArea = groupBy(projectDeadlines, (d) => d.area || 'General');

    html += `<div>`;
    html += `<div class="projectHeader"><span>${esc(projectName)}</span><span class="projectMeta">${projectDeadlines.length} overdue</span></div>`;

    for (const [area, items] of Object.entries(byArea)) {
      html += `<div class="areaLabel">${esc(area)} (${items.length})</div>`;
      for (const item of items) {
        html += `<div class="overdueItem">`;
        html += `<span class="overdueTitle">${esc(item.title)}</span>`;
        html += `<span class="overdueAssignee">${esc(item.assignee)}</span>`;
        html += `<span class="overdueAge">${item.days_overdue} days overdue</span>`;
        if (item.note) html += `<div class="overdueNote">${esc(item.note)}</div>`;
        html += `</div>`;
      }
    }
    html += `</div>`;
  }

  return html;
}

function renderThreads(threads, registry) {
  let html = '<div class="sectionLabel">Open Threads</div>';

  if (threads.length === 0) {
    return html + '<div class="emptyState">No open threads.</div>';
  }

  const sorted = [...threads].sort((a, b) => {
    const rank = (t) =>
      t.signal_type === 'followup_required' ? 0 : t.signal_type === 'awaiting_reply' ? 1 : 2;
    return rank(a) - rank(b);
  });

  sorted.forEach((t, i) => {
    const projectName = resolveProjectName(t.project_id, registry);
    const person = t.counterparty_name || t.counterparty || '';
    const isUrgent = t.signal_type === 'followup_required' && i === 0;
    const cls = isUrgent ? 'threadItem threadUrgent' : 'threadItem';

    html += `<div class="${cls}">`;
    html += `<div class="threadProject">${esc(projectName)}</div>`;
    html += `<div class="threadBody">${esc(t.basis || t.thread_key.replace(/_/g, ' '))}</div>`;
    html += `<div class="threadMeta">`;
    if (person) html += `<span>${esc(person)} &middot; </span>`;
    html += `<span class="threadAge">${t.age_days} day${t.age_days !== 1 ? 's' : ''} waiting</span>`;
    if (t.signal_type === 'followup_required') html += ` <span>&middot; follow up required</span>`;
    html += `</div></div>`;
  });

  return html;
}

function renderCalendar(events, emptyLabel) {
  let html = '<div class="sectionLabel">Calendar</div>';

  if (events.length === 0) {
    return html + `<div class="emptyState">${esc(emptyLabel)}</div>`;
  }

  for (const e of events) {
    const attendees = resolveAttendees(e.attendees);
    html += `<div class="calendarEvent">`;
    html += `<span class="eventTime">${esc(formatTime(e.start))}</span>`;
    html += `<span class="eventTitle">${esc(e.title)}</span>`;
    html += `<span class="eventWith">${attendees.length > 0 ? `With ${esc(attendees.join(', '))}.` : ''}</span>`;
    html += `</div>`;
  }

  return html;
}

function renderReminders(reminders, todayStr) {
  // Today block: only show reminders due today or overdue
  const filtered = reminders.filter((r) => {
    if (!r.due) return false;
    return r.due <= todayStr;
  });

  let html = '<div class="sectionLabel">Reminders</div>';

  if (filtered.length === 0) {
    return html + '<div class="emptyState">No reminders.</div>';
  }

  for (const r of filtered) {
    html += `<div class="reminderItem">`;
    html += `<span class="reminderKind">${esc(r.kind.charAt(0).toUpperCase() + r.kind.slice(1))}</span>`;
    html += `<span class="reminderText">${esc(r.title)}</span>`;
    if (r.description) html += `<div class="reminderDesc">${esc(r.description)}</div>`;
    html += `</div>`;
  }

  return html;
}

function renderRemindersBlock(reminders) {
  // Block 5: all open reminders, grouped by kind
  if (reminders.length === 0) {
    return '<div class="emptyState">No open reminders.</div>';
  }

  const byKind = groupBy(reminders, (r) => r.kind);
  let html = '';

  for (const [kind, items] of Object.entries(byKind)) {
    const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1) + 's';
    html += `<div class="sectionLabel">${esc(kindLabel)}</div>`;
    for (const r of items) {
      html += `<div class="reminderItem">`;
      html += `<span class="reminderKind">${esc(kind.charAt(0).toUpperCase() + kind.slice(1))}</span>`;
      html += `<span class="reminderText">${esc(r.title)}</span>`;
      if (r.description) html += `<div class="reminderDesc">${esc(r.description)}</div>`;
      html += `</div>`;
    }
  }

  return html;
}

function renderOvernight(highlights) {
  let html = '<div class="sectionLabel">Overnight</div>';

  const entries = Object.values(highlights).filter(Boolean);
  const allQuiet = entries.length === 0 || entries.every((v) => v.trim() === 'Quiet night.');

  if (allQuiet) {
    return html + '<div class="overnightText">Quiet night. No meaningful communications or updates.</div>';
  }

  for (const [projectId, text] of Object.entries(highlights)) {
    if (text && text !== 'Quiet night.') {
      html += `<div class="overnightText"><strong>${esc(projectId)}:</strong> ${esc(text)}</div>`;
    }
  }

  return html;
}

function renderTomorrowDeadlines(deadlines, registry) {
  let html = '<div class="sectionLabel">Deadlines</div>';

  if (deadlines.length === 0) {
    return html + '<div class="emptyState">No deadlines tomorrow.</div>';
  }

  for (const d of deadlines) {
    html += `<div class="overdueItem">`;
    html += `<span class="overdueTitle">${esc(d.title)}</span>`;
    html += `<span class="overdueAssignee">${esc(resolveProjectName(d.project_id, registry))} &middot; ${esc(d.assignee)}</span>`;
    html += `<span class="overdueAge">${esc(d.area)}</span>`;
    if (d.note) html += `<div class="overdueNote">${esc(d.note)}</div>`;
    html += `</div>`;
  }

  return html;
}

function renderWeek(today, calendarEvents, upcomingDeadlines, openingNights, registry) {
  let html = '';

  // Build 7-day range
  for (let i = 0; i < 7; i++) {
    const d = offsetDate(today, i);
    const dateStr = toDateString(d);
    const label = formatWeekDayLabel(d);

    const dayEvents = calendarEvents
      .filter((e) => e.date === dateStr)
      .map((e) => ({ time: formatTime(e.start), title: e.title }));

    const dayDeadlines = upcomingDeadlines
      .filter((dl) => dl.due_date === dateStr)
      .map((dl) => {
        const name = resolveProjectName(dl.project_id, registry);
        return { label: `${name} — ${dl.title}${dl.assignee ? ` (${dl.assignee})` : ''}`, note: dl.note || '' };
      });

    const hasContent = dayEvents.length + dayDeadlines.length > 0;

    html += `<div class="weekRow">`;
    html += `<div class="weekDay">${esc(label)}`;
    if (i === 0) {
      html += `<span class="weekCount">today</span>`;
    } else if (hasContent) {
      const parts = [];
      if (dayEvents.length > 0) parts.push(`${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`);
      if (dayDeadlines.length > 0) parts.push(`${dayDeadlines.length} deadline${dayDeadlines.length !== 1 ? 's' : ''}`);
      html += `<span class="weekCount">${esc(parts.join(', '))}</span>`;
    }
    html += `</div>`;

    html += `<div class="weekEvents">`;
    if (!hasContent) {
      html += `<span class="weekEmpty">Nothing scheduled</span>`;
    }
    for (const e of dayEvents) {
      html += `<div class="weekEventLine"><span class="eventTime">${esc(e.time)}</span><span>${esc(e.title)}</span></div>`;
    }
    for (const dl of dayDeadlines) {
      html += `<div class="weekDeadline">${esc(dl.label)}</div>`;
      if (dl.note) html += `<div class="overdueNote">${esc(dl.note)}</div>`;
    }
    html += `</div></div>`;
  }

  // Milestones
  const milestones = openingNights.map((on) => {
    const openDate = new Date(on.due_date + 'T00:00:00Z');
    const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((openDate.getTime() - todayMs) / 86400000);
    const projectName = resolveProjectName(on.project_id, registry);
    const displayDate = openDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return { project: projectName, date: displayDate, days: diffDays };
  });

  if (milestones.length > 0) {
    html += `<div class="milestones">`;
    for (const m of milestones) {
      html += `<div class="milestone">`;
      html += `<span class="msProject">${esc(m.project)}</span>`;
      html += `<span class="msDate">${esc(m.date)}</span>`;
      html += `<span class="msCount">${m.days}</span>`;
      html += `<span class="msUnit">days</span>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  return html;
}

// ---------------------------------------------------------------------------
// CSS (inlined from globals.css + page.module.css, un-hashed class names)
// ---------------------------------------------------------------------------

const INLINE_CSS = `
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html, body {
  background-color: #D0D0D0;
  color: #1A1A1A;
  font-family: 'JetBrains Mono', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.page {
  min-height: 100vh;
  background: #D0D0D0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.notebook {
  width: 100%;
  max-width: 1400px;
  min-height: 100vh;
  background: #E0E0E0;
  border: 1px solid #1A1A1A;
  margin: 24px auto;
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-rows: auto 1fr;
}
.masthead {
  grid-column: 2;
  padding: 20px 32px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: baseline;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #1A1A1A;
}
.mastheadSync {
  position: absolute;
  right: 32px;
  top: 20px;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: none;
  color: #999999;
  font-family: 'JetBrains Mono', monospace;
}
.tabs {
  grid-row: 1 / -1;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #C8C8C8;
  overflow: hidden;
  padding-top: 70px;
}
.tab {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  padding: 16px 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #6B6B6B;
  cursor: pointer;
  border-bottom: 1px solid #AAAAAA;
  border-right: none;
  border-left: none;
  position: relative;
  background: #C8C8C8;
  user-select: none;
  text-decoration: none;
}
.tab:hover { color: #1A1A1A; }
.tabActive {
  background: #E0E0E0;
  color: #1A1A1A;
  border-right: none;
  border-left: none;
  padding: 16px 10px;
}
.content {
  padding: 0;
  min-width: 0;
}
.block {
  padding: 40px 48px;
  border-bottom: 1px solid #CCCCCC;
}
.block:last-child { border-bottom: none; }
.blockHeader {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #1A1A1A;
  padding-bottom: 16px;
  border-bottom: 1px solid #1A1A1A;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.blockHeaderMeta {
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: none;
  color: #6B6B6B;
}
.sectionLabel {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #999999;
  margin-bottom: 12px;
  margin-top: 32px;
}
.sectionLabel:first-child { margin-top: 0; }
.projectHeader {
  font-size: 13px;
  font-weight: 700;
  color: #1A1A1A;
  padding: 12px 0;
  border-bottom: 1px solid #CCCCCC;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.projectMeta {
  font-size: 10px;
  font-weight: 400;
  color: #6B6B6B;
}
.areaLabel {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #999999;
  margin-top: 20px;
  margin-bottom: 8px;
}
.overdueItem {
  display: grid;
  grid-template-columns: 1fr 120px 100px;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #C8C8C8;
  font-size: 12px;
  align-items: baseline;
}
.overdueTitle { font-weight: 400; color: #1A1A1A; }
.overdueAssignee { font-weight: 400; color: #6B6B6B; text-align: right; }
.overdueAge { font-weight: 600; color: #1A1A1A; text-align: right; }
.overdueNote { grid-column: 1 / -1; font-size: 11px; font-weight: 400; color: #999999; font-style: italic; padding-bottom: 4px; }
.threadItem { padding: 12px 0; border-bottom: 1px solid #C8C8C8; }
.threadProject {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #999999;
  margin-bottom: 4px;
}
.threadBody { font-size: 14px; font-weight: 400; color: #1A1A1A; line-height: 1.4; }
.threadMeta { font-size: 10px; color: #6B6B6B; margin-top: 4px; }
.threadAge { font-weight: 700; color: #1A1A1A; }
.threadUrgent .threadBody { font-size: 18px; }
.calendarEvent {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #C8C8C8;
  font-size: 12px;
  align-items: baseline;
}
.eventTime { font-weight: 600; color: #1A1A1A; }
.eventTitle { font-weight: 400; color: #1A1A1A; }
.eventWith { font-weight: 400; color: #6B6B6B; font-size: 10px; }
.reminderItem {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  padding: 6px 0;
  font-size: 12px;
}
.reminderKind {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #999999;
}
.reminderText { font-weight: 400; color: #1A1A1A; }
.reminderDesc { font-size: 11px; font-weight: 400; color: #6B6B6B; grid-column: 2; margin-top: -2px; }
.overnightText { font-size: 12px; font-weight: 400; color: #6B6B6B; font-style: italic; }
.emptyState { font-size: 12px; font-weight: 400; color: #999999; font-style: italic; }
.weekRow {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #C8C8C8;
  align-items: start;
}
.weekDay {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6B6B6B;
}
.weekCount { display: block; font-size: 9px; font-weight: 400; color: #999999; }
.weekEvents { display: flex; flex-direction: column; gap: 4px; }
.weekEventLine { font-size: 11px; display: flex; gap: 8px; }
.weekDeadline { font-size: 11px; color: #1A1A1A; font-weight: 600; }
.weekEmpty { font-size: 11px; color: #999999; font-style: italic; }
.milestones {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #CCCCCC;
  display: flex;
  gap: 48px;
}
.milestone { display: flex; flex-direction: column; }
.msProject { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #999999; }
.msDate { font-size: 12px; color: #1A1A1A; }
.msCount { font-size: 32px; font-weight: 300; color: #1A1A1A; line-height: 1; }
.msUnit { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #999999; }
.footer {
  text-align: center;
  font-size: 9px;
  color: #999;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
}
`;

// ---------------------------------------------------------------------------
// Tab tracking JS (ported from TabTracker.tsx)
// ---------------------------------------------------------------------------

const INLINE_JS = `
(function() {
  var sections = ['overdue', 'today', 'tomorrow', 'this-week', 'reminders'];
  var intersecting = {};

  function setActive(id) {
    sections.forEach(function(sid) {
      var tab = document.querySelector('[data-section="' + sid + '"]');
      if (!tab) return;
      if (sid === id) tab.classList.add('tabActive');
      else tab.classList.remove('tabActive');
    });
  }

  function pickActive() {
    for (var i = 0; i < sections.length; i++) {
      if (intersecting[sections[i]]) { setActive(sections[i]); return; }
    }
  }

  sections.forEach(function(sid) {
    var el = document.getElementById(sid);
    if (!el) return;
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) { intersecting[sid] = entry.isIntersecting; });
      pickActive();
    }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });
    obs.observe(el);
  });

  setActive(document.getElementById('overdue') ? 'overdue' : 'today');
})();
`;

// ---------------------------------------------------------------------------
// Archive previous HTML
// ---------------------------------------------------------------------------

function archivePrevious() {
  if (!fs.existsSync(HTML_PATH)) return;

  const stat = fs.statSync(HTML_PATH);
  const mtime = stat.mtime;
  const dateStr = mtime.toISOString().slice(0, 10);
  const timeStr = mtime.toISOString().slice(11, 19).replace(/:/g, '');
  const archiveSubdir = path.join(ARCHIVE_DIR, dateStr);
  fs.mkdirSync(archiveSubdir, { recursive: true });

  const archivePath = path.join(archiveSubdir, `today-${timeStr}.html`);
  fs.renameSync(HTML_PATH, archivePath);
  console.log(`[export_html] Archived previous: ${archivePath}`);
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

function exportHtml(registry) {
  console.log('[export_html] Building today.html');

  const editorial = loadEditorial();

  // Check if we have any data at all
  if (!editorial.derived_at) {
    const minimalHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Memento</title>
<style>${INLINE_CSS}</style></head>
<body><div class="page"><div class="notebook"><div class="tabs"></div>
<div class="masthead"><span>Memento</span></div>
<div class="content"><div class="block"><div class="blockHeader"><span>No Data</span></div>
<div class="emptyState">No data yet. Run the full pipeline.</div></div></div></div></div>
<div class="footer">Generated ${new Date().toISOString()} by Memento pipeline</div>
</body></html>`;
    archivePrevious();
    fs.mkdirSync(DERIVED_DIR, { recursive: true });
    fs.writeFileSync(HTML_PATH, minimalHtml, 'utf8');
    console.log(`[export_html] Written (minimal): ${HTML_PATH}`);
    return { status: 'ok', path: HTML_PATH, minimal: true };
  }

  // Date window
  const today = new Date();
  const todayStr = toDateString(today);
  const tomorrowDate = offsetDate(today, 1);
  const tomorrowStr = toDateString(tomorrowDate);
  const weekEndDate = offsetDate(today, 6);
  const weekEndStr = toDateString(weekEndDate);

  // Load data
  const reminders = loadReminders();
  const syncStatus = loadSyncStatus();
  const todayEvents = loadCalendarEvents(todayStr, todayStr);
  const tomorrowEvents = loadCalendarEvents(tomorrowStr, tomorrowStr);
  const weekEvents = loadCalendarEvents(todayStr, weekEndStr);

  // Opening nights from facts
  const openingNights = loadOpeningNights(registry);

  // Sync label
  let syncLabel = 'Sync status unknown';
  if (syncStatus) {
    syncLabel = `Last synced ${formatRelativeTime(syncStatus.lastSynced)}`;
  }

  // Tomorrow deadlines
  const tomorrowDeadlines = editorial.upcoming_deadlines.filter((d) => d.due_date === tomorrowStr);

  // Overdue meta
  const overdueCount = editorial.overdue_deadlines.length;
  const overdueProjectCount = new Set(editorial.overdue_deadlines.map((d) => d.project_id)).size;
  const overdueBlockMeta =
    overdueCount > 0
      ? `${overdueCount} item${overdueCount !== 1 ? 's' : ''} across ${overdueProjectCount} project${overdueProjectCount !== 1 ? 's' : ''}`
      : '';

  // Build tabs
  let tabsHtml = '';
  if (overdueCount > 0) {
    tabsHtml += `<a href="#overdue" data-section="overdue" class="tab">Overdue</a>`;
  }
  tabsHtml += `<a href="#today" data-section="today" class="tab">Today</a>`;
  tabsHtml += `<a href="#tomorrow" data-section="tomorrow" class="tab">Tomorrow</a>`;
  tabsHtml += `<a href="#this-week" data-section="this-week" class="tab">This Week</a>`;
  tabsHtml += `<a href="#reminders" data-section="reminders" class="tab">Reminders</a>`;

  // Build content blocks
  let contentHtml = '';

  // Block 1: Overdue
  if (overdueCount > 0) {
    contentHtml += `<div id="overdue" class="block">`;
    contentHtml += `<div class="blockHeader"><span>Overdue</span>`;
    if (overdueBlockMeta) contentHtml += `<span class="blockHeaderMeta">${esc(overdueBlockMeta)}</span>`;
    contentHtml += `</div>`;
    contentHtml += renderOverdue(editorial.overdue_deadlines, registry);
    contentHtml += `</div>`;
  }

  // Block 2: Today
  contentHtml += `<div id="today" class="block">`;
  contentHtml += `<div class="blockHeader"><span>Today</span><span class="blockHeaderMeta">${esc(formatDisplayDate(today))}</span></div>`;
  contentHtml += renderThreads(editorial.resolved_threads, registry);
  contentHtml += renderCalendar(todayEvents, 'Nothing scheduled today.');
  contentHtml += renderReminders(reminders, todayStr);
  contentHtml += renderOvernight(editorial.activity_highlights);
  contentHtml += `</div>`;

  // Block 3: Tomorrow
  contentHtml += `<div id="tomorrow" class="block">`;
  contentHtml += `<div class="blockHeader"><span>Tomorrow</span><span class="blockHeaderMeta">${esc(formatDisplayDate(tomorrowDate))}</span></div>`;
  contentHtml += renderCalendar(tomorrowEvents, 'Nothing scheduled tomorrow.');
  contentHtml += renderTomorrowDeadlines(tomorrowDeadlines, registry);
  contentHtml += `</div>`;

  // Block 4: This Week
  contentHtml += `<div id="this-week" class="block">`;
  contentHtml += `<div class="blockHeader"><span>This Week</span><span class="blockHeaderMeta">${esc(formatShortDate(today))} – ${esc(formatShortDate(weekEndDate))}</span></div>`;
  contentHtml += renderWeek(today, weekEvents, editorial.upcoming_deadlines, openingNights, registry);
  contentHtml += `</div>`;

  // Block 5: Reminders (all open)
  contentHtml += `<div id="reminders" class="block">`;
  contentHtml += `<div class="blockHeader"><span>Reminders</span><span class="blockHeaderMeta">All open</span></div>`;
  contentHtml += renderRemindersBlock(reminders);
  contentHtml += `</div>`;

  // Assemble full document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Memento — ${esc(formatDisplayDate(today))}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
  <style>${INLINE_CSS}</style>
</head>
<body>
  <div class="page">
    <div class="notebook">
      <div class="tabs">${tabsHtml}</div>
      <div class="masthead">
        <span>Memento</span>
        <span class="mastheadSync">${esc(syncLabel)}</span>
      </div>
      <div class="content">${contentHtml}</div>
    </div>
  </div>
  <div class="footer">Generated ${new Date().toISOString()} by Memento pipeline</div>
  <script>${INLINE_JS}</script>
</body>
</html>`;

  // Archive previous, write new
  archivePrevious();
  fs.mkdirSync(DERIVED_DIR, { recursive: true });
  fs.writeFileSync(HTML_PATH, fullHtml, 'utf8');
  console.log(`[export_html] Written: ${HTML_PATH}`);

  // Open in browser unless --no-open
  if (!process.argv.includes('--no-open')) {
    try {
      execSync(`open "${HTML_PATH}"`);
      console.log('[export_html] Opened in browser');
    } catch (e) {
      console.log('[export_html] Warning: could not open browser:', e.message);
    }
  }

  return { status: 'ok', path: HTML_PATH };
}

module.exports = { exportHtml };
