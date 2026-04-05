/**
 * Sheets sync step.
 *
 * For each active project with a production_calendar in source_refs,
 * read each registered tab, parse task rows, and write captures to
 * state/captures/sheets/.
 */

const { getValues } = require('../lib/sheets_client');
const { writeCapture, captureExists } = require('../lib/capture_io');
const { computeCaptureHash } = require('../lib/ingest_identity');
const { updateLastSync, updateLastRun, recordFailure } = require('../lib/sync_log');

/**
 * Parse a DD/MM/YYYY string or Google Sheets serial date number into ISO YYYY-MM-DD.
 * Returns null for empty/null/invalid values.
 */
function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;

  // Sheets serial date: number of days since December 30, 1899
  if (typeof value === 'number') {
    const epoch = new Date(1899, 11, 30); // Dec 30, 1899
    const ms = epoch.getTime() + value * 86400000;
    const d = new Date(ms);
    return d.toISOString().slice(0, 10);
  }

  const str = String(value).trim();
  if (!str) return null;

  // DD/MM/YYYY
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // Already ISO or other — pass through if it looks valid
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  return null;
}

/**
 * Parse a cell value as a number. Returns null for empty/invalid.
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalise a string cell value. Returns null for empty/undefined.
 */
function parseStr(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/**
 * Column layouts.
 *
 * Template (PUNKS and all new calendars):
 *   A=ID, B=SOP REF, C=AREA, D=TASK, E=DEPENDS, F=DURATION, G=START, H=END,
 *   I=DEADLINE, J=DAYS, K=STATUS, L=OWNER, M=ARTIST, N=NOTES
 *
 * Legacy (LZ, 0009.eth):
 *   A=ID, B=SUMM, C=AREA, D=TASK, E=DEPENDS, F=START, G=DURATION, H=END,
 *   I=DEADLINE, J=DAYS, K=STATUS, L=OWNER, M=NOTES, N=SOP REF
 *
 * Both share A=ID, C=AREA, D=TASK, E=DEPENDS, H=END, I=DEADLINE, J=DAYS,
 * K=STATUS, L=OWNER. The differences are B, F/G swap, M/N swap, and
 * legacy has no ARTIST column.
 */
const LAYOUT_TEMPLATE = 'template';
const LAYOUT_LEGACY   = 'legacy';

/**
 * Detect the header row and identify the column layout.
 *
 * @param {string[][]} rows
 * @returns {{ index: number, layout: string }|null}
 */
function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const colA = String(row[0] || '').trim().toUpperCase();
    const colD = String(row[3] || '').trim().toUpperCase();
    if (colA !== 'ID' || colD !== 'TASK') continue;

    // Distinguish by col B: "SOP REF" = template, "SUMM" / anything else = legacy
    const colB = String(row[1] || '').trim().toUpperCase().replace(/[.\s]/g, '');
    if (colB === 'SOPREF') return { index: i, layout: LAYOUT_TEMPLATE };
    return { index: i, layout: LAYOUT_LEGACY };
  }
  return null;
}

/**
 * Extract show metadata from rows above the header.
 * Template layout: labels in col C, values in col D.
 * Legacy layout: labels in col A, values in col F.
 *
 * @param {string[][]} metaRows - Rows above header row
 * @param {string} layout - LAYOUT_TEMPLATE or LAYOUT_LEGACY
 * @returns {{ opening_date, closing_date, show_name }}
 */
function extractMetadata(metaRows, layout) {
  let opening_date = null;
  let closing_date = null;
  let show_name = null;

  for (const row of metaRows) {
    // Template: labels in col C (idx 2), values in col D (idx 3)
    // Legacy: labels in col A (idx 0), values in col F (idx 5)
    const labelIdx = layout === LAYOUT_TEMPLATE ? 2 : 0;
    const valueIdx = layout === LAYOUT_TEMPLATE ? 3 : 5;

    const label = String(row[labelIdx] || '').trim().toUpperCase();
    const value = row[valueIdx];

    if (label === 'OPENING DATE:') opening_date = parseDate(value);
    else if (label === 'CLOSING DATE:') closing_date = parseDate(value);
    else if (label === 'SHOW NAME:') show_name = parseStr(value);
  }

  return { opening_date, closing_date, show_name };
}

/**
 * Check if a row is a section header:
 * column A has a value AND columns D–N are all empty.
 *
 * @param {string[]} row
 * @returns {boolean}
 */
function isSectionHeader(row) {
  const colA = parseStr(row[0]);
  if (!colA) return false;
  // cols D (index 3) through N (index 13)
  for (let i = 3; i <= 13; i++) {
    if (parseStr(row[i]) !== null) return false;
  }
  return true;
}

/**
 * Parse all task rows from the data rows (after the header).
 *
 * @param {string[][]} dataRows
 * @param {string} tabName
 * @param {string} layout - LAYOUT_TEMPLATE or LAYOUT_LEGACY
 * @returns {object[]}
 */
function parseTaskRows(dataRows, tabName, layout) {
  const tasks = [];
  let currentArea = null;

  for (const row of dataRows) {
    // Skip entirely empty rows
    if (row.every(cell => parseStr(cell) === null)) continue;

    // Section header
    if (isSectionHeader(row)) {
      currentArea = parseStr(row[0]);
      continue;
    }

    const task_id = parseStr(row[0]);
    if (!task_id) continue; // No task_id → skip

    // col C = AREA in both layouts
    const rowArea = parseStr(row[2]);
    const area    = rowArea !== null ? rowArea : currentArea;
    const title   = parseStr(row[3]);  // col D in both
    const depends_on = parseStr(row[4]); // col E in both

    let sop_ref, duration_days, start_date, end_date, notes, artist;

    if (layout === LAYOUT_TEMPLATE) {
      // Template: B=SOP REF, F=DURATION, G=START, H=END, M=ARTIST, N=NOTES
      sop_ref       = parseStr(row[1]);
      duration_days = parseNumber(row[5]);
      start_date    = parseDate(row[6]);
      end_date      = parseDate(row[7]);
      const artistCell = parseStr(row[12]);
      artist        = artistCell !== null ? artistCell : (tabName !== 'Production Calendar' ? tabName : null);
      notes         = parseStr(row[13]);
    } else {
      // Legacy: B=SUMM (ignored), F=START, G=DURATION, H=END, M=NOTES, N=SOP REF
      sop_ref       = parseStr(row[13]);
      start_date    = parseDate(row[5]);
      duration_days = parseNumber(row[6]);
      end_date      = parseDate(row[7]);
      artist        = null; // Legacy has no ARTIST column
      notes         = parseStr(row[12]);
    }

    // Shared positions: I=DEADLINE, J=DAYS, K=STATUS, L=OWNER
    const deadline        = parseDate(row[8]);
    const days_to_opening = parseNumber(row[9]);
    const status          = parseStr(row[10]);
    const owner           = parseStr(row[11]);

    tasks.push({
      task_id,
      sop_ref,
      area,
      title,
      depends_on,
      duration_days,
      start_date,
      end_date,
      deadline,
      days_to_opening,
      status,
      owner,
      artist,
      notes,
    });
  }

  return tasks;
}

/**
 * Build a tab slug: lowercase, spaces → underscores.
 */
function tabSlug(tabName) {
  return tabName.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Sync a single spreadsheet tab.
 *
 * @param {object} opts
 * @param {string} opts.spreadsheetId
 * @param {string} opts.tabName
 * @param {string} opts.configDir
 * @param {string} opts.projectId
 * @param {string} opts.account
 * @param {object} summary  - mutated in place
 */
async function syncTab({ spreadsheetId, tabName, configDir, projectId }, summary) {
  const range = `${tabName}!A1:N1000`;
  const result = await getValues(spreadsheetId, range, configDir);
  const rows = (result && result.values) ? result.values : [];

  if (rows.length === 0) {
    console.log(`[sheets_sync] ${projectId}/${tabName}: no data`);
    return;
  }

  const header = findHeaderRow(rows);
  if (!header) {
    console.warn(`[sheets_sync] ${projectId}/${tabName}: no header row (ID/TASK) found — skipping`);
    return;
  }

  const { index: headerIdx, layout } = header;
  console.log(`[sheets_sync] ${projectId}/${tabName}: detected ${layout} layout`);

  const metaRows  = rows.slice(0, headerIdx);
  const dataRows  = rows.slice(headerIdx + 1);
  const { opening_date, closing_date } = extractMetadata(metaRows, layout);

  const tasks = parseTaskRows(dataRows, tabName, layout);
  const slug  = tabSlug(tabName);

  console.log(`[sheets_sync] ${projectId}/${tabName}: ${tasks.length} task rows`);
  summary.fetched += tasks.length;

  for (const task of tasks) {
    const captureId = `sheets_task_${spreadsheetId}_${slug}_${task.task_id}`;

    const normalizedPayload = {
      spreadsheet_id:  spreadsheetId,
      tab_name:        tabName,
      task_id:         task.task_id,
      sop_ref:         task.sop_ref,
      area:            task.area,
      title:           task.title,
      depends_on:      task.depends_on,
      duration_days:   task.duration_days,
      start_date:      task.start_date,
      end_date:        task.end_date,
      deadline:        task.deadline,
      days_to_opening: task.days_to_opening,
      status:          task.status,
      owner:           task.owner,
      artist:          task.artist,
      notes:           task.notes,
      opening_date,
      closing_date,
      project_id:      projectId,
    };

    const captureHash = computeCaptureHash(normalizedPayload);

    if (captureExists('sheets', captureId, captureHash)) {
      summary.skipped++;
      continue;
    }

    const capture = {
      capture_id:   captureId,
      source:       'sheets',
      source_ref:   `sheets:${spreadsheetId}:${tabName}:${task.task_id}`,
      observation_kind: 'production_calendar_task',
      observed_at:  new Date().toISOString(),
      normalized_payload: normalizedPayload,
      raw_ref:      null,
      candidate_project_links: [{
        project_id: projectId,
        mode:       'direct',
        basis:      ['registry:production_calendar'],
      }],
      capture_hash: captureHash,
    };

    writeCapture('sheets', capture);
    summary.written++;
  }
}

/**
 * Run Sheets sync.
 *
 * @param {object} registry - The full registry object
 * @returns {Promise<object>} Summary { fetched, written, skipped, errors }
 */
async function run(registry) {
  const summary   = { fetched: 0, written: 0, skipped: 0, errors: [] };
  const runTimestamp = new Date().toISOString();

  const activeProjects = (registry.projects || []).filter(p => p.status === 'active');

  for (const project of activeProjects) {
    const productionCalendar = project.source_refs?.production_calendar;
    if (!productionCalendar) continue;

    const { spreadsheet_id: spreadsheetId, account, tabs } = productionCalendar;
    if (!spreadsheetId || !account || !Array.isArray(tabs) || tabs.length === 0) {
      console.warn(`[sheets_sync] ${project.project_id}: production_calendar missing spreadsheet_id, account, or tabs — skipping`);
      continue;
    }

    const configDir = `~/.config/${account}`;
    console.log(`[sheets_sync] Syncing ${project.project_id} spreadsheet ${spreadsheetId} (${tabs.length} tabs) via ${account}...`);

    for (const tabName of tabs) {
      try {
        await syncTab({
          spreadsheetId,
          tabName,
          configDir,
          projectId: project.project_id,
          account,
        }, summary);
      } catch (err) {
        console.error(`[sheets_sync] Failed ${project.project_id}/${tabName}: ${err.message}`);
        summary.errors.push({
          projectId: project.project_id,
          spreadsheetId,
          tabName,
          error: err.message,
        });
        recordFailure('sheets', {
          timestamp: new Date().toISOString(),
          source:    'sheets',
          account,
          error:     err.message,
          action:    'skipped',
        });
      }
    }
  }

  updateLastSync('sheets', null, new Date().toISOString());
  updateLastRun('sheets', runTimestamp);

  return summary;
}

module.exports = { run };
