/**
 * Basecamp sync step.
 *
 * Top-down fetch order per project:
 *   1. Project info → project_info capture
 *   2. Todoset → todolists → groups → todos → todo captures
 *   3. Message board → messages → message captures
 *   4. Comments on messages → comment captures
 *   5. Schedule → entries → schedule_entry captures
 *   6. Vault → documents → vault_document captures
 *   7. Vault → uploads → vault_upload captures
 *   8. Account-level mentions → mention captures
 *
 * For each active project with basecamp_ids, fetches all content types.
 * Normalize into captures and write via capture_io.
 */

const fs = require('fs');
const path = require('path');

const {
  fetchProject,
  fetchMessages,
  fetchTodosWithGroups,
  fetchComments,
  fetchMentions,
  fetchScheduleEntries,
  fetchVaultDocuments,
  fetchVaultUploads,
} = require('../lib/basecamp_client');
const { writeCapture, captureExists } = require('../lib/capture_io');
const { computeCaptureHash } = require('../lib/ingest_identity');
const { updateLastSync, updateLastRun, recordFailure } = require('../lib/sync_log');

const SOURCE_IDENTITIES_PATH = path.resolve(__dirname, '../../state/runtime/source_identities.json');
const DEFAULT_MENTION_LOOKBACK_DAYS = 7;

function makeCaptureId(kind, projectId, artifactId) {
  return `bc_${kind}_${projectId}_${artifactId}`;
}

function makeMentionCaptureId(personId, mentionId) {
  return `bc_mention_${personId}_${mentionId}`;
}

function readSourceIdentities() {
  if (!fs.existsSync(SOURCE_IDENTITIES_PATH)) {
    throw new Error(`Missing source identities file: ${SOURCE_IDENTITIES_PATH}`);
  }

  const raw = fs.readFileSync(SOURCE_IDENTITIES_PATH, 'utf8');
  return JSON.parse(raw);
}

function getOwnerBasecampPersonId(sourceIdentities) {
  const personId = sourceIdentities?.basecamp?.owner?.person_id || sourceIdentities?.basecamp?.viktor?.person_id;
  if (!personId || typeof personId !== 'string') {
    throw new Error('Missing basecamp owner person_id in source identities');
  }
  return personId;
}

function parseDate(value) {
  if (!value) return null;
  const ts = new Date(value);
  return Number.isNaN(ts.getTime()) ? null : ts;
}

function withinLookback(value, days) {
  const ts = parseDate(value);
  if (!ts) return false;
  const now = Date.now();
  return ts.getTime() >= (now - days * 86400000);
}

function getReadingSectionName(reading) {
  const section = reading?.section;
  if (typeof section === 'string') return section;
  if (section && typeof section === 'object') {
    return section.name || section.slug || section.key || section.type || null;
  }
  return reading?.section_name || reading?.section_key || reading?.kind || null;
}

function getReadingMentionId(reading) {
  return reading?.id || reading?.reading_id || reading?.notification_id || reading?.mention_id || null;
}

function getReadingCreatedAt(reading) {
  return reading?.created_at || reading?.mentioned_at || reading?.read_at || reading?.updated_at || null;
}

function getReadingReadState(reading) {
  if (typeof reading?.read === 'boolean') return reading.read;
  if (typeof reading?.seen === 'boolean') return reading.seen;
  if (typeof reading?.unread === 'boolean') return !reading.unread;
  if (typeof reading?.is_unread === 'boolean') return !reading.is_unread;
  return null;
}

function getReadingTitle(reading) {
  return reading?.title || reading?.subject || reading?.name || reading?.summary || reading?.recording?.title || '';
}

function getReadingType(reading) {
  return reading?.type || reading?.notification_type || reading?.reading_type || reading?.kind || '';
}

function getReadingExcerpt(reading) {
  return reading?.excerpt || reading?.snippet || reading?.content || reading?.body || reading?.recording?.content || '';
}

function getReadingUrl(reading) {
  return reading?.url || reading?.app_url || reading?.app_link || reading?.recording?.url || reading?.recording?.app_url || '';
}

function getReadingCreator(reading) {
  const creator = reading?.creator || reading?.author || reading?.person || reading?.mentioned_by || {};
  return {
    name: creator?.name || creator?.display_name || 'Unknown',
    email: creator?.email_address || creator?.email || '',
  };
}

function extractMentionProjectId(reading) {
  return reading?.project_id ||
    reading?.bucket_id ||
    reading?.bucket?.id ||
    reading?.recording?.project_id ||
    reading?.recording?.bucket_id ||
    reading?.recording?.bucket?.id ||
    extractBasecampProjectIdFromUrl(getReadingUrl(reading)) ||
    null;
}

function extractMentionRecordingId(reading) {
  return reading?.recording_id ||
    reading?.recording?.id ||
    reading?.recording?.recording_id ||
    reading?.recordable_id ||
    extractBasecampRecordingIdFromUrl(getReadingUrl(reading)) ||
    extractBasecampRecordingIdFromTitle(getReadingTitle(reading)) ||
    null;
}

function extractMentionRecordingType(reading) {
  return reading?.recording_type ||
    reading?.recording?.recording_type ||
    reading?.recording?.type ||
    reading?.recordable_type ||
    extractBasecampRecordingTypeFromUrl(getReadingUrl(reading)) ||
    extractBasecampRecordingTypeFromTitleOrType(getReadingTitle(reading), getReadingType(reading)) ||
    null;
}

function extractBasecampProjectIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/buckets\/(\d+)\b/);
  return match ? match[1] : null;
}

function extractBasecampRecordingIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const fragmentMatch = url.match(/#__recording_(\d+)\b/);
  if (fragmentMatch) return fragmentMatch[1];
  const pathMatch = url.match(/\/recordings\/(\d+)\b/);
  if (pathMatch) return pathMatch[1];
  return null;
}

function extractBasecampRecordingIdFromTitle(title) {
  if (!title || typeof title !== 'string') return null;
  const match = title.match(/#__recording_(\d+)\b/);
  return match ? match[1] : null;
}

function extractBasecampRecordingTypeFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (/\/messages\//.test(url)) return 'message';
  if (/\/todos\//.test(url)) return 'todo';
  if (/\/comments\//.test(url)) return 'comment';
  if (/\/vaults?\//.test(url)) return 'vault';
  if (/\/schedules?\//.test(url)) return 'schedule_entry';
  return null;
}

function extractBasecampRecordingTypeFromTitleOrType(title, typeValue) {
  const type = String(typeValue || '').toLowerCase();
  if (type === 'mention') {
    const titleLower = String(title || '').toLowerCase();
    if (titleLower.includes('mentioned you in:')) {
      if (titleLower.includes('todo')) return 'todo';
      if (titleLower.includes('message')) return 'message';
      if (titleLower.includes('comment')) return 'comment';
    }
  }

  if (type === 'message' || type === 'todo' || type === 'comment') {
    return type;
  }

  return null;
}

function isMentionReading(reading) {
  const type = String(getReadingType(reading) || '').toLowerCase();
  if (type === 'mention') return true;

  const section = String(getReadingSectionName(reading) || '').toLowerCase();
  if (section === 'mentions') return true;

  const title = String(getReadingTitle(reading) || '').toLowerCase();
  if (title.includes('@mentioned you in:')) return true;

  return false;
}

function normalizeMention(mention, personId, registryProjectLinks = []) {
  const mentionIdValue = getReadingMentionId(mention);
  if (mentionIdValue === null || mentionIdValue === undefined || mentionIdValue === '') {
    throw new Error('Mention record missing an id');
  }
  const mentionId = String(mentionIdValue);
  const projectId = extractMentionProjectId(mention);
  const recordingId = extractMentionRecordingId(mention);
  const recordingType = extractMentionRecordingType(mention);
  const mentionedAt = getReadingCreatedAt(mention);
  const url = getReadingUrl(mention);
  const payload = {
    person_id: String(personId),
    mention_id: mentionId,
    project_id: projectId ? String(projectId) : null,
    recording_id: recordingId ? String(recordingId) : null,
    recording_type: recordingType || null,
    title: getReadingTitle(mention),
    excerpt: getReadingExcerpt(mention),
    url,
    mentioned_at: mentionedAt,
    read: getReadingReadState(mention),
    creator: getReadingCreator(mention),
  };

  if (mention?.recording && typeof mention.recording === 'object') {
    payload.recording = {
      title: mention.recording.title || '',
      url: mention.recording.url || mention.recording.app_url || '',
      type: recordingType || null,
    };
  }

  const captureHash = computeCaptureHash(payload);
  const captureId = makeMentionCaptureId(personId, mentionId);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:person:${personId}:mention:${mentionId}`,
    observation_kind: 'mention',
    observed_at: mentionedAt || new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: registryProjectLinks,
    capture_hash: captureHash,
  };
}

// --- Normalizers ---

function normalizeProjectInfo(project, basecampProjectId) {
  const payload = {
    project_id: String(basecampProjectId),
    name: project.name || '',
    description: project.description || '',
    primavera_code: extractPrimaveraCode(project.description || ''),
    status: project.status || 'active',
    created_at: project.created_at,
    updated_at: project.updated_at,
    dock: (project.dock || []).map(d => ({
      name: d.name,
      id: String(d.id),
      enabled: d.enabled,
    })),
    membership: (project.people || []).map(p => ({
      name: p.name || '',
      email: p.email_address || '',
    })),
  };

  // Hash excludes updated_at to avoid noise from content changes
  const hashPayload = {
    name: payload.name,
    description: payload.description,
    status: payload.status,
    dock: payload.dock,
    membership: payload.membership,
  };

  const captureHash = computeCaptureHash(hashPayload);
  const captureId = makeCaptureId('project', basecampProjectId, 'info');

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:project:info`,
    observation_kind: 'project_info',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function normalizeMessage(msg, basecampProjectId) {
  const payload = {
    project_id: String(basecampProjectId),
    message_id: String(msg.id),
    subject: msg.subject || msg.title || '',
    body: msg.content || '',
    author: {
      name: msg.creator?.name || 'Unknown',
      email: msg.creator?.email_address || '',
    },
    created_at: msg.created_at,
    updated_at: msg.updated_at,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = makeCaptureId('message', basecampProjectId, msg.id);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:message:${msg.id}`,
    observation_kind: 'message',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function normalizeTodo(todo, basecampProjectId) {
  const payload = {
    project_id: String(basecampProjectId),
    todo_id: String(todo.id),
    title: todo.title || todo.content || '',
    description: todo.description || '',
    completed: todo.completed || false,
    completed_at: todo.completed_at || null,
    due_on: todo.due_on || null,
    assignees: (todo.assignees || []).map(a => ({ name: a.name, email: a.email_address })),
    todolist_title: todo._todolist_title || '',
    todolist_id: todo._todolist_id || null,
    group_title: todo._group_title || null,
    group_id: todo._group_id || null,
    creator: {
      name: todo.creator?.name || 'Unknown',
      email: todo.creator?.email_address || '',
    },
    created_at: todo.created_at,
    updated_at: todo.updated_at,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = makeCaptureId('todo', basecampProjectId, todo.id);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:todo:${todo.id}`,
    observation_kind: 'todo',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function normalizeComment(comment, basecampProjectId, recordingId) {
  const payload = {
    project_id: String(basecampProjectId),
    comment_id: String(comment.id),
    recording_id: String(recordingId),
    body: comment.content || '',
    author: {
      name: comment.creator?.name || 'Unknown',
      email: comment.creator?.email_address || '',
    },
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = makeCaptureId('comment', basecampProjectId, comment.id);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:comment:${comment.id}`,
    observation_kind: 'comment',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function buildMentionProjectLinks(mention, projectMap) {
  const projectId = extractMentionProjectId(mention);
  if (!projectId) return [];

  const mementoProjectId = projectMap[String(projectId)];
  if (!mementoProjectId) return [];

  return [{
    project_id: mementoProjectId,
    confidence: 'direct',
    basis: [`basecamp_id:${String(projectId)}`],
  }];
}

function normalizeScheduleEntry(entry, basecampProjectId) {
  const payload = {
    project_id: String(basecampProjectId),
    entry_id: String(entry.id),
    title: entry.title || entry.summary || '',
    description: entry.description || '',
    starts_at: entry.starts_at || null,
    ends_at: entry.ends_at || null,
    all_day: entry.all_day || false,
    recurring: entry.recurring || false,
    participants: (entry.participants || []).map(p => ({
      name: p.name || '',
      email: p.email_address || '',
    })),
    creator: {
      name: entry.creator?.name || 'Unknown',
      email: entry.creator?.email_address || '',
    },
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = makeCaptureId('schedule', basecampProjectId, entry.id);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:schedule:${entry.id}`,
    observation_kind: 'schedule_entry',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function normalizeVaultDocument(doc, basecampProjectId) {
  const payload = {
    project_id: String(basecampProjectId),
    document_id: String(doc.id),
    title: doc.title || '',
    content: doc.content || '',
    creator: {
      name: doc.creator?.name || 'Unknown',
      email: doc.creator?.email_address || '',
    },
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = makeCaptureId('vault_doc', basecampProjectId, doc.id);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:vault_document:${doc.id}`,
    observation_kind: 'vault_document',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

function normalizeVaultUpload(upload, basecampProjectId) {
  const payload = {
    project_id: String(basecampProjectId),
    upload_id: String(upload.id),
    filename: upload.filename || upload.title || '',
    byte_size: upload.byte_size || 0,
    content_type: upload.content_type || '',
    download_url: upload.download_url || upload.app_download_url || '',
    creator: {
      name: upload.creator?.name || 'Unknown',
      email: upload.creator?.email_address || '',
    },
    created_at: upload.created_at,
    updated_at: upload.updated_at,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = makeCaptureId('vault_upload', basecampProjectId, upload.id);

  return {
    capture_id: captureId,
    source: 'basecamp',
    source_ref: `basecamp:${basecampProjectId}:vault_upload:${upload.id}`,
    observation_kind: 'vault_upload',
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

/**
 * Extract Primavera code from project description.
 * Pattern: EP.EE.EX.NNN.NN or similar dot-separated codes.
 */
function extractPrimaveraCode(description) {
  const match = description.match(/\b(EP\.[A-Z]{2}\.[A-Z]{2}\.\d{3}\.\d{2})\b/);
  return match ? match[1] : null;
}

/**
 * Write a capture if not already existing with same hash.
 * Returns true if written, false if skipped.
 */
function writeIfNew(capture, summary) {
  if (captureExists('basecamp', capture.capture_id, capture.capture_hash)) {
    summary.skipped++;
    return false;
  }
  writeCapture('basecamp', capture);
  summary.written++;
  return true;
}

/**
 * Run Basecamp sync.
 *
 * @param {object} registry - The full registry object
 * @returns {Promise<object>} Summary { fetched, written, skipped, fetched_mentions, written_mentions, skipped_mentions, errors }
 */
async function run(registry) {
  const summary = {
    fetched: 0,
    written: 0,
    skipped: 0,
    fetched_mentions: 0,
    written_mentions: 0,
    skipped_mentions: 0,
    errors: [],
  };
  const runTimestamp = new Date().toISOString();

  const activeProjects = registry.projects.filter(p => p.status === 'active');
  const allBasecampIds = new Set();
  const projectMap = {}; // basecampId -> projectId

  for (const project of activeProjects) {
    for (const bcId of (project.source_refs?.basecamp_ids || [])) {
      allBasecampIds.add(bcId);
      projectMap[bcId] = project.project_id;
    }
  }

  if (allBasecampIds.size === 0) {
    console.log('[basecamp_sync] No active projects with basecamp_ids');
    updateLastRun('basecamp', runTimestamp);
    return summary;
  }

  let sourceIdentities = null;
  try {
    sourceIdentities = readSourceIdentities();
  } catch (err) {
    console.error(`[basecamp_sync] Source identity load failed: ${err.message}`);
    summary.errors.push({ type: 'source_identities', error: err.message });
    recordFailure('basecamp', {
      timestamp: new Date().toISOString(),
      source: 'basecamp',
      account: 'owner',
      error: err.message,
      action: 'skipped',
    });
  }

  if (sourceIdentities) {
    try {
      const personId = getOwnerBasecampPersonId(sourceIdentities);
      const mentionWindowStart = new Date(Date.now() - DEFAULT_MENTION_LOOKBACK_DAYS * 86400000).toISOString();
      const mentions = await fetchMentions(personId, { since: mentionWindowStart });
      const mentionCandidates = mentions
        .filter(m => isMentionReading(m))
        .filter(m => withinLookback(getReadingCreatedAt(m), DEFAULT_MENTION_LOOKBACK_DAYS));

      summary.fetched_mentions += mentionCandidates.length;
      console.log(`[basecamp_sync] Owner mentions: ${mentionCandidates.length} in last ${DEFAULT_MENTION_LOOKBACK_DAYS} days`);

      for (const mention of mentionCandidates) {
        const capture = normalizeMention(
          mention,
          personId,
          buildMentionProjectLinks(mention, projectMap)
        );

        if (captureExists('basecamp', capture.capture_id, capture.capture_hash)) {
          summary.skipped++;
          summary.skipped_mentions++;
          continue;
        }

        writeCapture('basecamp', capture);
        summary.written++;
        summary.written_mentions++;
      }
    } catch (err) {
      console.error(`[basecamp_sync] Mention sync failed: ${err.message}`);
      summary.errors.push({ type: 'mentions', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: 'owner',
        error: err.message,
        action: 'skipped',
      });
    }
  }

  for (const bcId of allBasecampIds) {
    const mementoProjectId = projectMap[bcId];
    const candidateLinks = [{
      project_id: mementoProjectId,
      confidence: 'direct',
      basis: [`basecamp_id:${bcId}`],
    }];

    console.log(`[basecamp_sync] Syncing Basecamp project ${bcId} → ${mementoProjectId}`);

    // 1. Project info
    try {
      const project = await fetchProject(bcId);
      summary.fetched++;
      const capture = normalizeProjectInfo(project, bcId);
      capture.candidate_project_links = candidateLinks;
      writeIfNew(capture, summary);
    } catch (err) {
      console.error(`[basecamp_sync] Project info failed for ${bcId}: ${err.message}`);
      summary.errors.push({ bcId, type: 'project_info', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: String(bcId),
        error: err.message,
        action: 'skipped',
      });
    }

    // 2. Todos (with group traversal)
    try {
      const todos = await fetchTodosWithGroups(bcId);
      console.log(`[basecamp_sync] ${bcId}: ${todos.length} todos`);
      summary.fetched += todos.length;

      for (const todo of todos) {
        const capture = normalizeTodo(todo, bcId);
        capture.candidate_project_links = candidateLinks;
        writeIfNew(capture, summary);
      }
    } catch (err) {
      console.error(`[basecamp_sync] Todos failed for ${bcId}: ${err.message}`);
      summary.errors.push({ bcId, type: 'todos', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: String(bcId),
        error: err.message,
        action: 'skipped',
      });
    }

    // 3. Messages + 4. Comments
    try {
      const messages = await fetchMessages(bcId);
      console.log(`[basecamp_sync] ${bcId}: ${messages.length} messages`);
      summary.fetched += messages.length;

      for (const msg of messages) {
        const capture = normalizeMessage(msg, bcId);
        capture.candidate_project_links = candidateLinks;
        const isNew = writeIfNew(capture, summary);

        // Fetch comments on new messages
        if (isNew) {
          try {
            const comments = await fetchComments(msg.id, bcId);
            summary.fetched += comments.length;
            for (const comment of comments) {
              const commentCapture = normalizeComment(comment, bcId, msg.id);
              commentCapture.candidate_project_links = candidateLinks;
              writeIfNew(commentCapture, summary);
            }
          } catch (err) {
            summary.errors.push({ bcId, type: 'comments', messageId: msg.id, error: err.message });
            recordFailure('basecamp', {
              timestamp: new Date().toISOString(),
              source: 'basecamp',
              account: String(bcId),
              error: err.message,
              action: 'skipped',
            });
          }
        }
      }
    } catch (err) {
      console.error(`[basecamp_sync] Messages failed for ${bcId}: ${err.message}`);
      summary.errors.push({ bcId, type: 'messages', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: String(bcId),
        error: err.message,
        action: 'skipped',
      });
    }

    // 5. Schedule entries
    try {
      const entries = await fetchScheduleEntries(bcId);
      console.log(`[basecamp_sync] ${bcId}: ${entries.length} schedule entries`);
      summary.fetched += entries.length;

      for (const entry of entries) {
        const capture = normalizeScheduleEntry(entry, bcId);
        capture.candidate_project_links = candidateLinks;
        writeIfNew(capture, summary);
      }
    } catch (err) {
      console.error(`[basecamp_sync] Schedule failed for ${bcId}: ${err.message}`);
      summary.errors.push({ bcId, type: 'schedule', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: String(bcId),
        error: err.message,
        action: 'skipped',
      });
    }

    // 6. Vault documents
    try {
      const docs = await fetchVaultDocuments(bcId);
      console.log(`[basecamp_sync] ${bcId}: ${docs.length} vault documents`);
      summary.fetched += docs.length;

      for (const doc of docs) {
        const capture = normalizeVaultDocument(doc, bcId);
        capture.candidate_project_links = candidateLinks;
        writeIfNew(capture, summary);
      }
    } catch (err) {
      console.error(`[basecamp_sync] Vault docs failed for ${bcId}: ${err.message}`);
      summary.errors.push({ bcId, type: 'vault_documents', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: String(bcId),
        error: err.message,
        action: 'skipped',
      });
    }

    // 7. Vault uploads
    try {
      const uploads = await fetchVaultUploads(bcId);
      console.log(`[basecamp_sync] ${bcId}: ${uploads.length} vault uploads`);
      summary.fetched += uploads.length;

      for (const upload of uploads) {
        const capture = normalizeVaultUpload(upload, bcId);
        capture.candidate_project_links = candidateLinks;
        writeIfNew(capture, summary);
      }
    } catch (err) {
      console.error(`[basecamp_sync] Vault uploads failed for ${bcId}: ${err.message}`);
      summary.errors.push({ bcId, type: 'vault_uploads', error: err.message });
      recordFailure('basecamp', {
        timestamp: new Date().toISOString(),
        source: 'basecamp',
        account: String(bcId),
        error: err.message,
        action: 'skipped',
      });
    }
  }

  updateLastSync('basecamp', null, new Date().toISOString());
  updateLastRun('basecamp', runTimestamp);
  return summary;
}

module.exports = { run };
