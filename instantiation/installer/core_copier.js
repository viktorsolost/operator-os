'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Recursively copy a directory from src to dest, preserving structure and contents.
 *
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 */
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Determine if a source path is a directory.
 * Checks if the path ends with '/' or if the filesystem indicates it's a directory.
 *
 * @param {string} sourcePath - Source path
 * @returns {boolean}
 */
function isSourceDirectory(sourcePath) {
  // If path ends with '/', treat as directory
  if (sourcePath.endsWith('/')) {
    return true;
  }

  // Check filesystem if it exists
  try {
    const stats = fs.statSync(sourcePath);
    return stats.isDirectory();
  } catch {
    // Source doesn't exist yet, assume not a directory
    return false;
  }
}

/**
 * Copy reusable-core files from source to target based on installer manifest.
 *
 * @param {object} manifest - Full installer manifest object from buildInstallerManifest
 * @returns {Promise<object>} Report object with written, skipped, and errors arrays
 */
async function copyCore(manifest) {
  const written = [];
  const skipped = [];
  const errors = [];

  // Validate that manifest has copyCore property
  if (!manifest.copyCore) {
    throw new Error('copyCore: manifest does not have a copyCore property');
  }

  // Pre-flight: validate all sources exist before copying anything
  for (const item of manifest.copyCore) {
    if (item.treatment !== 'copy-core') {
      throw new Error(
        `copyCore: item "${item.id}" has treatment "${item.treatment}", expected "copy-core"`
      );
    }
    if (!fs.existsSync(item.source)) {
      throw new Error(
        `copyCore: source file does not exist for item "${item.id}": ${item.source}`
      );
    }
  }

  for (const item of manifest.copyCore) {
    try {
      const { source, target } = item;

      // Create target parent directory
      const targetDir = path.dirname(target);
      fs.mkdirSync(targetDir, { recursive: true });

      // Determine if source is a directory and copy accordingly
      if (isSourceDirectory(source)) {
        // Copy directory recursively
        copyDirRecursive(source, target);
      } else {
        // Copy single file
        fs.copyFileSync(source, target);
      }

      written.push(target);
    } catch (err) {
      errors.push({
        id: item.id,
        source: item.source,
        error: err.message,
      });
    }
  }

  return Object.freeze({
    written: Object.freeze(written),
    skipped: Object.freeze(skipped),
    errors: Object.freeze(errors),
  });
}

module.exports = { copyCore };
