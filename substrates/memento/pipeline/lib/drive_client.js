/**
 * Google Drive client using gws CLI.
 */

const { gws } = require('./gws_client');
const { getDriveConfigDir, FALLBACK_DRIVE_CONFIG_DIR } = require('./pipeline_config');

const CONFIG_DIR = FALLBACK_DRIVE_CONFIG_DIR;

/**
 * List files in a Drive folder.
 *
 * @param {string} folderId - Google Drive folder ID
 * @param {boolean} shared - Whether to include shared drives
 * @returns {Promise<object[]>} Array of file metadata objects
 */
async function listFiles(folderId, shared = true, configDir = CONFIG_DIR) {
  const resolvedConfigDir = configDir || getDriveConfigDir();
  const params = {
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,modifiedTime,createdTime,size,owners,lastModifyingUser)',
    pageSize: 100,
  };

  if (shared) {
    params.corpora = 'allDrives';
    params.includeItemsFromAllDrives = true;
    params.supportsAllDrives = true;
  }

  const result = await gws('drive', 'files', 'list', params, resolvedConfigDir);
  return result.files || [];
}

/**
 * Recursively crawl a folder up to a depth limit.
 *
 * @param {string} folderId - Root folder ID
 * @param {number} depth - Max depth (default 2)
 * @param {boolean} shared - Shared drive support
 * @returns {Promise<object[]>} All files found at all depths
 */
async function crawlFolder(folderId, depth = 2, shared = true, configDir = CONFIG_DIR) {
  if (depth < 0) return [];

  const files = await listFiles(folderId, shared, configDir || getDriveConfigDir());
  let allFiles = [];

  for (const file of files) {
    file._parent_folder_id = folderId;
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      file._is_folder = true;
      allFiles.push(file);
      if (depth > 0) {
        const children = await crawlFolder(file.id, depth - 1, shared, configDir);
        allFiles = allFiles.concat(children);
      }
    } else {
      allFiles.push(file);
    }
  }

  return allFiles;
}

module.exports = {
  listFiles,
  crawlFolder,
};
