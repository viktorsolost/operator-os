'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Generates safe installer-phase config scaffolds from the installer manifest.
 *
 * Scaffolds are safe starter files with no secrets, auth, device identity, or owner-specific doctrine.
 * Source templates are .tmpl files; content is written to final runtime config locations.
 * Placeholders are NOT resolved here — onboarding handles that.
 *
 * @param {Object} manifest - Full installer manifest with safeScaffolds array
 * @returns {Promise<Object>} Report with written, skipped, errors, scaffoldCount
 */
async function generateScaffolds(manifest) {
  const report = {
    written: [],
    skipped: [],
    errors: [],
    scaffoldCount: 0,
  };

  if (!manifest.safeScaffolds || !Array.isArray(manifest.safeScaffolds)) {
    return report;
  }

  report.scaffoldCount = manifest.safeScaffolds.length;

  for (const scaffold of manifest.safeScaffolds) {
    const { id, source, target, treatment } = scaffold;

    // Verify treatment is 'generate-fresh'
    if (treatment !== 'generate-fresh') {
      report.skipped.push({
        id,
        source,
        reason: `treatment is '${treatment}', not 'generate-fresh'`,
      });
      continue;
    }

    // Check if source template exists
    if (!fs.existsSync(source)) {
      report.skipped.push({
        id,
        source,
        reason: 'source template not found',
      });
      continue;
    }

    try {
      // Read source template content
      const content = fs.readFileSync(source, 'utf8');

      // Verify content contains no forbidden source-machine paths
      const forbiddenPaths = ['/Users/viktorsl/', '/Volumes/BackBone/'];
      const hasForbidden = forbiddenPaths.some((forbidden) =>
        content.includes(forbidden)
      );

      if (hasForbidden) {
        report.errors.push({
          id,
          target,
          error: 'scaffold content contains forbidden source-machine paths',
        });
        continue;
      }

      // Create target parent directory if needed
      const targetDir = path.dirname(target);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Write content to target path
      fs.writeFileSync(target, content, 'utf8');
      report.written.push(target);
    } catch (err) {
      report.errors.push({
        id,
        target,
        error: err.message,
      });
    }
  }

  return report;
}

module.exports = { generateScaffolds };
