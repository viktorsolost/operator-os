/**
 * Reminders API — local-only HTTP endpoints.
 *
 * GET  /api/reminders          — list (optional ?status=, ?kind=, ?project_id=)
 * POST /api/reminders          — create
 * PATCH /api/reminders/:id     — update
 *
 * Persistence: state/runtime/reminders.json (read on startup, flushed on every write).
 * Contract: docs/contracts/reminders.md
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../../state/runtime/reminders.json');
const VALID_KINDS = new Set(['task', 'idea', 'alert']);
const VALID_SOURCES = new Set(['conversation', 'pipeline', 'manual']);
const VALID_STATUSES = new Set(['open', 'done', 'promoted']);
const PATCHABLE_FIELDS = new Set(['title', 'description', 'kind', 'status', 'due', 'project_id', 'promoted_to']);

// --- persistence ---

function loadReminders() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { reminders: [] };
  }
}

function flushReminders(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
}

// --- ID generation ---

function nextId(reminders) {
  let max = 0;
  for (const r of reminders) {
    const match = r.id && r.id.match(/^rem_(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return `rem_${String(max + 1).padStart(3, '0')}`;
}

// --- request helpers ---

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function respond(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2) + '\n');
}

// --- route handlers ---

function handleGet(req, res) {
  const data = loadReminders();
  const url = new URL(req.url, `http://${req.headers.host}`);
  let result = data.reminders;

  const status = url.searchParams.get('status');
  if (status) result = result.filter(r => r.status === status);

  const kind = url.searchParams.get('kind');
  if (kind) result = result.filter(r => r.kind === kind);

  const projectId = url.searchParams.get('project_id');
  if (projectId) result = result.filter(r => r.project_id === projectId);

  respond(res, 200, { reminders: result });
}

function handlePost(req, res) {
  return parseBody(req).then(body => {
    if (!body.title || typeof body.title !== 'string') {
      return respond(res, 400, { error: 'title is required' });
    }
    if (!body.kind || !VALID_KINDS.has(body.kind)) {
      return respond(res, 400, { error: `kind must be one of: ${[...VALID_KINDS].join(', ')}` });
    }
    if (body.source && !VALID_SOURCES.has(body.source)) {
      return respond(res, 400, { error: `source must be one of: ${[...VALID_SOURCES].join(', ')}` });
    }

    const data = loadReminders();
    const now = new Date().toISOString();

    const reminder = {
      id: nextId(data.reminders),
      title: body.title,
      description: body.description || null,
      kind: body.kind,
      source: body.source || 'conversation',
      status: 'open',
      due: body.due || null,
      project_id: body.project_id || null,
      promoted_to: null,
      created_at: now,
      updated_at: now,
    };

    data.reminders.push(reminder);
    flushReminders(data);

    respond(res, 201, { reminder });
  }).catch(() => {
    respond(res, 400, { error: 'Invalid JSON body' });
  });
}

function handlePatch(req, res, id) {
  return parseBody(req).then(body => {
    const data = loadReminders();
    const reminder = data.reminders.find(r => r.id === id);
    if (!reminder) {
      return respond(res, 404, { error: `Reminder ${id} not found` });
    }

    if (body.status === 'promoted' && !body.promoted_to) {
      return respond(res, 400, { error: 'promoted_to is required when status is promoted' });
    }
    if (body.kind && !VALID_KINDS.has(body.kind)) {
      return respond(res, 400, { error: `kind must be one of: ${[...VALID_KINDS].join(', ')}` });
    }
    if (body.status && !VALID_STATUSES.has(body.status)) {
      return respond(res, 400, { error: `status must be one of: ${[...VALID_STATUSES].join(', ')}` });
    }

    for (const field of Object.keys(body)) {
      if (PATCHABLE_FIELDS.has(field)) {
        reminder[field] = body[field];
      }
    }

    reminder.updated_at = new Date().toISOString();
    flushReminders(data);

    respond(res, 200, { reminder });
  }).catch(() => {
    respond(res, 400, { error: 'Invalid JSON body' });
  });
}

// --- router ---

function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // GET /api/reminders
  if (req.method === 'GET' && pathname === '/api/reminders') {
    return handleGet(req, res);
  }

  // POST /api/reminders
  if (req.method === 'POST' && pathname === '/api/reminders') {
    return handlePost(req, res);
  }

  // PATCH /api/reminders/:id
  const patchMatch = pathname.match(/^\/api\/reminders\/([a-z0-9_]+)$/);
  if (req.method === 'PATCH' && patchMatch) {
    return handlePatch(req, res, patchMatch[1]);
  }

  // DELETE explicitly rejected
  if (req.method === 'DELETE' && pathname.startsWith('/api/reminders')) {
    return respond(res, 405, { error: 'Reminders cannot be deleted. Use status: "done" instead.' });
  }

  respond(res, 404, { error: 'Not found' });
}

module.exports = { route, loadReminders, flushReminders };
