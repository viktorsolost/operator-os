/**
 * Drive sync step.
 *
 * For each active project with drive_folder_ids, crawl linked folders
 * (2 levels deep). Normalize into captures.
 */

const { crawlFolder } = require('../lib/drive_client');
const { writeCapture, captureExists } = require('../lib/capture_io');
const { computeCaptureHash } = require('../lib/ingest_identity');
const { updateLastSync, updateLastRun, recordFailure } = require('../lib/sync_log');

function normalizeDriveFile(file) {
  const isFolder = file.mimeType === 'application/vnd.google-apps.folder' || file._is_folder;
  const kind = isFolder ? 'folder_metadata' : 'file_metadata';

  const payload = {
    file_id: file.id,
    name: file.name,
    mime_type: file.mimeType,
    folder_id: file._parent_folder_id || null,
    created_time: file.createdTime || null,
    modified_time: file.modifiedTime || null,
    created_by: file.owners?.[0]?.emailAddress || null,
    modified_by: file.lastModifyingUser?.emailAddress || null,
    size_bytes: file.size ? parseInt(file.size, 10) : null,
  };

  const captureHash = computeCaptureHash(payload);
  const captureId = `drive_file_${file.id}`;

  return {
    capture_id: captureId,
    source: 'drive',
    source_ref: `drive:${file.id}`,
    observation_kind: kind,
    observed_at: new Date().toISOString(),
    normalized_payload: payload,
    raw_ref: null,
    candidate_project_links: [],
    capture_hash: captureHash,
  };
}

/**
 * Run Drive sync.
 *
 * @param {object} registry - The full registry object
 * @returns {Promise<object>} Summary
 */
async function run(registry) {
  const summary = { fetched: 0, written: 0, skipped: 0, errors: [] };
  const runTimestamp = new Date().toISOString();

  const activeProjects = registry.projects.filter(p => p.status === 'active');

  for (const project of activeProjects) {
    const folderIds = project.source_refs?.drive_folder_ids || [];
    if (folderIds.length === 0) continue;

    for (const folderId of folderIds) {
      console.log(`[drive_sync] Crawling folder ${folderId} for ${project.project_id}...`);

      try {
        const files = await crawlFolder(folderId, 2);
        console.log(`[drive_sync] ${project.project_id}/${folderId}: ${files.length} files`);
        summary.fetched += files.length;

        for (const file of files) {
          const capture = normalizeDriveFile(file);
          capture.candidate_project_links = [{
            project_id: project.project_id,
            confidence: 'direct',
            basis: [`drive_folder_id:${folderId}`],
          }];

          if (captureExists('drive', capture.capture_id, capture.capture_hash)) {
            summary.skipped++;
            continue;
          }
          writeCapture('drive', capture);
          summary.written++;
        }
      } catch (err) {
        console.error(`[drive_sync] Crawl failed for ${folderId}: ${err.message}`);
        summary.errors.push({ projectId: project.project_id, folderId, error: err.message });
        recordFailure('drive', {
          timestamp: new Date().toISOString(),
          source: 'drive',
          account: folderId,
          error: err.message,
          action: 'skipped',
        });
      }
    }
  }

  // Crawl shared sources
  const sharedSources = (registry.shared_sources || []).filter(s => s.source === 'drive');
  for (const ss of sharedSources) {
    const configDir = `~/.config/${ss.account}`;
    console.log(`[drive_sync] Crawling shared source ${ss.label} (${ss.id}) via ${ss.account}...`);

    try {
      const files = await crawlFolder(ss.id, 2, true, configDir);
      console.log(`[drive_sync] shared/${ss.label}: ${files.length} files`);
      summary.fetched += files.length;

      for (const file of files) {
        const capture = normalizeDriveFile(file);
        capture.candidate_project_links = [{
          project_id: '__shared__',
          confidence: 'direct',
          basis: [`shared_source:drive:${ss.id}`],
        }];

        if (captureExists('drive', capture.capture_id, capture.capture_hash)) {
          summary.skipped++;
          continue;
        }
        writeCapture('drive', capture);
        summary.written++;
      }
    } catch (err) {
      console.error(`[drive_sync] Shared source crawl failed for ${ss.id}: ${err.message}`);
      summary.errors.push({ shared_source: ss.label, folderId: ss.id, error: err.message });
      recordFailure('drive', {
        timestamp: new Date().toISOString(),
        source: 'drive',
        account: ss.account,
        error: err.message,
        action: 'skipped',
      });
    }
  }

  updateLastSync('drive', null, new Date().toISOString());
  updateLastRun('drive', runTimestamp);
  return summary;
}

module.exports = { run };
