/**
 * Project linking library.
 *
 * 5-tier evaluation from the project-linking contract:
 *   Tier 1: Direct registered ID match (source_refs)
 *   Tier 2: Direct known URL/folder/calendar/thread ref match
 *   Tier 3: Alias + participant match
 *   Tier 4: Weak inference (keyword in title/body)
 *   Tier 5: Unresolved (unlinked)
 *
 * Source contract: docs/contracts/project-linking.md
 */

/**
 * Link a capture to a project using registry data.
 *
 * @param {object} capture - A capture record
 * @param {object} registry - The full registry object
 * @param {object} folderMap - Map of folder_id -> parent_folder_id from Drive captures
 * @returns {object} { linked_project_id, linked_project_ids, mode, basis, candidates_considered, flagged_for_review }
 */
function linkCapture(capture, registry, folderMap = {}) {
  const candidates = [];
  const sharedSources = registry.shared_sources || [];

  for (const project of registry.projects) {
    if (project.status !== 'active') continue;
    const result = evaluateProject(capture, project, folderMap, sharedSources);
    if (result.tier < 5) {
      candidates.push({ project_id: project.project_id, ...result });
    }
  }

  // Sort by tier (lower = better), then by basis count (more = better)
  candidates.sort((a, b) => a.tier - b.tier || b.basis.length - a.basis.length);

  if (candidates.length === 0) {
    return {
      linked_project_id: null,
      linked_project_ids: [],
      mode: 'unlinked',
      basis: [],
      candidates_considered: 0,
      flagged_for_review: false,
    };
  }

  const best = candidates[0];
  const flagged = best.tier >= 4 || (candidates.length > 1 && candidates[1].tier === best.tier);

  // Collect all candidates at the best tier for multi-project linking
  const bestTierCandidates = candidates.filter(c => c.tier === best.tier);

  return {
    linked_project_id: best.project_id,
    linked_project_ids: bestTierCandidates.map(c => c.project_id),
    mode: best.tier <= 2 ? 'direct' : 'inferred',
    basis: best.basis,
    candidates_considered: candidates.length,
    flagged_for_review: flagged,
  };
}

/**
 * Evaluate a capture against a single project.
 * Returns { tier, basis }.
 */
function evaluateProject(capture, project, folderMap, sharedSources) {
  const refs = project.source_refs || {};
  const basis = [];

  // Tier 1: Direct registered ID match
  const tier1 = checkDirectIdMatch(capture, refs, folderMap, project.type, sharedSources);
  if (tier1.length > 0) {
    return { tier: 1, basis: tier1 };
  }

  // Tier 2: Known URL/folder/thread ref match
  const tier2 = checkRefMatch(capture, refs);
  if (tier2.length > 0) {
    return { tier: 2, basis: tier2 };
  }

  // Tier 3: Alias + participant/context match
  const tier3 = checkAliasMatch(capture, project);
  if (tier3.length > 0) {
    return { tier: 3, basis: tier3 };
  }

  // Tier 4: Weak inference
  const tier4 = checkWeakInference(capture, project);
  if (tier4.length > 0) {
    return { tier: 4, basis: tier4 };
  }

  return { tier: 5, basis: [] };
}

/**
 * Tier 1: Check if capture's source-specific IDs match registry source_refs.
 */
function checkDirectIdMatch(capture, refs, folderMap, projectType, sharedSources) {
  const basis = [];
  const payload = capture.normalized_payload || {};

  // Basecamp: project ID in source_ref or payload
  if (capture.source === 'basecamp') {
    const bcProjectId = payload.project_id || extractBasecampProjectId(capture.source_ref);
    if (bcProjectId && refs.basecamp_ids?.includes(bcProjectId)) {
      basis.push(`basecamp_id:${bcProjectId}`);
    }
  }

  // Drive: folder ID match (with ancestry traversal)
  if (capture.source === 'drive') {
    const folderId = payload.folder_id;
    const matchedAncestor = walkFolderAncestry(folderId, refs.drive_folder_ids || [], folderMap);
    if (matchedAncestor) {
      basis.push(`drive_folder_id:${matchedAncestor}`);
    }

    // Shared source: check if folder ancestry matches a shared Drive source
    if (basis.length === 0 && sharedSources) {
      const driveSharedSources = sharedSources.filter(
        s => s.source === 'drive' && s.applies_to_type === projectType
      );
      for (const ss of driveSharedSources) {
        const sharedIds = [ss.id];
        const matchedShared = walkFolderAncestry(folderId, sharedIds, folderMap);
        if (matchedShared) {
          basis.push(`shared_source:drive:${ss.id}`);
          break;
        }
      }
    }
  }

  // Calendar: calendar_ids match (direct event ID linkage)
  if (capture.source === 'calendar') {
    const eventId = payload.event_id || payload.id;
    if (eventId && refs.calendar_ids?.includes(eventId)) {
      basis.push(`calendar_id:${eventId}`);
    }
  }

  return basis;
}

/**
 * Tier 2: Check thread/folder/URL ref matches.
 */
function checkRefMatch(capture, refs) {
  const basis = [];
  const payload = capture.normalized_payload || {};

  // Gmail: thread prefix match
  if (capture.source === 'gmail') {
    const subject = payload.thread_subject || payload.subject || getHeader(payload, 'Subject') || '';
    for (const prefix of (refs.gmail_thread_prefixes || [])) {
      if (subject.includes(prefix)) {
        basis.push(`gmail_thread_prefix:${prefix}`);
      }
    }
  }

  return basis;
}

/**
 * Tier 3: Alias + participant match.
 */
function checkAliasMatch(capture, project) {
  const basis = [];
  const payload = capture.normalized_payload || {};
  const aliases = (project.aliases || []).map(a => a.toLowerCase());

  // Check event title / message subject for alias
  const textFields = [
    payload.summary, payload.subject, payload.thread_subject,
    getHeader(payload, 'Subject'),
  ].filter(Boolean);

  for (const text of textFields) {
    const lower = text.toLowerCase();
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        basis.push(`alias_match:${alias}`);
        break;
      }
    }
    if (basis.length > 0) break;
  }

  // Also check attendees/participants for known contacts
  const attendees = payload.attendees || [];
  const from = payload.from || getHeader(payload, 'From') || '';
  const to = Array.isArray(payload.to) ? payload.to : [payload.to].filter(Boolean);

  // If we found an alias match, that's enough for tier 3
  if (basis.length > 0) return basis;

  return basis;
}

/**
 * Tier 4: Weak inference — keyword match in body/title.
 */
function checkWeakInference(capture, project) {
  const basis = [];
  const payload = capture.normalized_payload || {};
  const aliases = (project.aliases || []).map(a => a.toLowerCase());
  const projectName = (project.name || '').toLowerCase();

  const bodyFields = [
    payload.body, payload.snippet, payload.description,
    payload.message_snippet,
  ].filter(Boolean);

  for (const text of bodyFields) {
    const lower = text.toLowerCase();
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        basis.push(`weak_body_match:${alias}`);
        return basis;
      }
    }
    if (lower.includes(projectName) && projectName.length > 5) {
      basis.push(`weak_body_match:${projectName}`);
      return basis;
    }
  }

  return basis;
}

/**
 * Walk up the folder ancestry chain using local capture data.
 * Returns the first folder ID that matches a registered ID, or null.
 *
 * @param {string} startFolderId - Starting folder ID
 * @param {string[]} registeredIds - Registered folder IDs to match against
 * @param {object} folderMap - Map of folder_id -> parent_folder_id from captures
 * @param {number} maxDepth - Maximum levels to walk (default 10, safety limit)
 * @returns {string|null} The matching registered folder ID, or null
 */
function walkFolderAncestry(startFolderId, registeredIds, folderMap, maxDepth = 10) {
  let current = startFolderId;
  let depth = 0;
  const visited = new Set();

  while (current && depth < maxDepth) {
    if (visited.has(current)) return null; // cycle detection
    visited.add(current);

    if (registeredIds.includes(current)) return current;

    current = folderMap[current] || null;
    depth++;
  }

  return null;
}

/**
 * Extract Basecamp project ID from a source_ref like "basecamp:46649609:message:msg001".
 */
function extractBasecampProjectId(sourceRef) {
  if (!sourceRef?.startsWith('basecamp:')) return null;
  const parts = sourceRef.split(':');
  return parts[1] || null;
}

/**
 * Get a header value from Gmail payload headers array.
 */
function getHeader(payload, name) {
  const headers = payload.headers || payload.payload?.headers || [];
  const header = headers.find(h => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || null;
}

module.exports = { linkCapture };
