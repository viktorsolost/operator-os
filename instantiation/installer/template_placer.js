'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Places unrendered template source files and runtime bridge templates from the installer manifest.
 * Templates are copied as-is with {{placeholder}} markers intact.
 *
 * @param {Object} manifest - Full installer manifest
 * @returns {Promise<Object>} Report object with written, skipped, errors, counts
 */
async function placeTemplates(manifest) {
  const written = [];
  const skipped = [];
  const errors = [];

  // Process template sources
  if (manifest.templateSources && Array.isArray(manifest.templateSources)) {
    for (const item of manifest.templateSources) {
      const result = processTemplateItem(item);
      if (result.type === 'written') {
        written.push(result.path);
      } else if (result.type === 'skipped') {
        skipped.push({
          id: item.id,
          source: item.source,
          reason: result.reason,
        });
      } else if (result.type === 'error') {
        errors.push({
          id: item.id,
          source: item.source,
          error: result.error,
        });
      }
    }
  }

  // Process bridge templates
  if (manifest.bridgeTemplates && Array.isArray(manifest.bridgeTemplates)) {
    for (const item of manifest.bridgeTemplates) {
      const result = processTemplateItem(item);
      if (result.type === 'written') {
        written.push(result.path);
      } else if (result.type === 'skipped') {
        skipped.push({
          id: item.id,
          source: item.source,
          reason: result.reason,
        });
      } else if (result.type === 'error') {
        errors.push({
          id: item.id,
          source: item.source,
          error: result.error,
        });
      }
    }
  }

  return {
    written,
    skipped,
    errors,
    templateCount: manifest.templateSources ? manifest.templateSources.length : 0,
    bridgeCount: manifest.bridgeTemplates ? manifest.bridgeTemplates.length : 0,
  };
}

/**
 * Process a single template item: validate, copy source to target unrendered
 * @param {Object} item - Template item from manifest
 * @returns {Object} Result object with type, path/reason/error
 */
function processTemplateItem(item) {
  // Validate required fields
  if (!item.id || !item.source || !item.target) {
    return {
      type: 'skipped',
      reason: 'Missing required fields (id, source, target)',
    };
  }

  // Only process items with treatment: 'rewrite-template'
  if (item.treatment !== 'rewrite-template') {
    return {
      type: 'skipped',
      reason: `Treatment is '${item.treatment}', not 'rewrite-template'`,
    };
  }

  try {
    // Check if source file exists
    if (!fs.existsSync(item.source)) {
      return {
        type: 'skipped',
        reason: `Source file not found: ${item.source}`,
      };
    }

    // Create target parent directory if needed
    const targetDir = path.dirname(item.target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy source file to target unrendered
    fs.copyFileSync(item.source, item.target);

    return {
      type: 'written',
      path: item.target,
    };
  } catch (err) {
    return {
      type: 'error',
      error: err.message,
    };
  }
}

module.exports = {
  placeTemplates,
};
