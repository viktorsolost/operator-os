'use strict';

const fs = require('fs');
const path = require('path');
const { resolvePlaceholders } = require('../shared/template_utils');

/**
 * Build the ordered replacement pairs from the onboarding packet.
 * Order matters: longest/most-specific first to avoid partial replacements.
 */
function buildReplacementMap(packet) {
  return [
    { from: '~/VIK/ObsidianVault/VIK_OS', to: packet.vault_location },
    { from: '~/VIK/Coding/Memento', to: packet.workspace_root },
    { from: '/Users/viktorsl/', to: packet.home_root + '/' },
    { from: '/Users/viktorsl', to: packet.home_root },
    { from: "Viktor's", to: packet.owner_name + "'s" },
    { from: 'VIK OS', to: packet.system_name },
    { from: 'Viktor', to: packet.owner_name },
  ];
}

/**
 * Apply all replacements to content.
 */
function applyReplacements(content, replacementMap) {
  let result = content;
  let totalReplacements = 0;
  for (const { from, to } of replacementMap) {
    // Use split/join for literal string replacement (no regex special chars issues)
    const parts = result.split(from);
    totalReplacements += parts.length - 1;
    result = parts.join(to);
  }
  return { result, totalReplacements };
}

/**
 * Check for remaining Viktor/viktorsl references in rendered content.
 */
function findViktorResidue(content) {
  const patterns = [
    /Viktor/g,
    /viktorsl/g,
    /\/Users\/viktorsl/g,
    /VIK OS/g,
  ];
  const findings = [];
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      findings.push({ pattern: pattern.source, count: matches.length });
    }
  }
  return findings;
}

/**
 * Build the {{placeholder}} map from the onboarding packet (for .tmpl-style sources).
 */
function buildPlaceholderMap(packet) {
  return {
    owner_name: packet.owner_name,
    system_name: packet.system_name,
    vault_location: packet.vault_location,
    workspace_root: packet.workspace_root,
    timezone: packet.timezone,
    home_root: packet.home_root,
  };
}

/**
 * Render all source-file rewrite-template surfaces.
 *
 * Applies two passes:
 *  1. Literal string replacements (VIK OS → system_name, Viktor → owner_name, etc.)
 *     for vault doctrine files that contain literal source-system references.
 *  2. {{placeholder}} resolution for .tmpl-style sources that use template markers.
 *
 * @param {object} installerManifest - from buildInstallerManifest (has templateSources array)
 * @param {object} packet - validated onboarding input packet
 * @returns {object} Report: { written: string[], errors: {id, error}[], replacementCounts: {id, count}[] }
 */
function renderSourceFiles(installerManifest, packet) {
  const report = { written: [], errors: [], replacementCounts: [] };

  if (!installerManifest.templateSources || !Array.isArray(installerManifest.templateSources)) {
    return report;
  }

  const replacementMap = buildReplacementMap(packet);
  const placeholderMap = buildPlaceholderMap(packet);

  for (const item of installerManifest.templateSources) {
    try {
      // Read from target (where template_placer already placed the unrendered copy)
      if (!fs.existsSync(item.target)) {
        report.errors.push({ id: item.id, error: `target file not found (not placed by installer?): ${item.target}` });
        continue;
      }

      const raw = fs.readFileSync(item.target, 'utf8');

      // Pass 1: literal string replacements (Viktor/VIK OS doctrine rewrites)
      const { result: afterLiteral, totalReplacements } = applyReplacements(raw, replacementMap);

      // Pass 2: {{placeholder}} resolution (for .tmpl-style sources)
      const rendered = resolvePlaceholders(afterLiteral, placeholderMap);

      report.replacementCounts.push({ id: item.id, count: totalReplacements });

      // Verify no Viktor residue
      const residue = findViktorResidue(rendered);
      if (residue.length > 0) {
        report.errors.push({
          id: item.id,
          error: `Viktor residue found after replacement: ${residue.map(r => `${r.pattern}(${r.count})`).join(', ')}`,
        });
        continue;
      }

      // Write rendered content back to target (in-place replacement)
      fs.writeFileSync(item.target, rendered, 'utf8');
      report.written.push(item.target);
    } catch (err) {
      report.errors.push({ id: item.id, error: err.message });
    }
  }

  return report;
}

module.exports = { renderSourceFiles, buildReplacementMap, applyReplacements, findViktorResidue };
