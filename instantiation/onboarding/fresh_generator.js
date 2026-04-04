'use strict';

const fs = require('fs');
const path = require('path');
const { isRuntimeEnabled, getEnabledRuntimes } = require('../shared/runtime_selector');
const { resolvePlaceholders, findUnresolvedMarkers } = require('../shared/template_utils');
const { loadFileMatrix } = require('../shared/file_matrix');

// ---------------------------------------------------------------------------
// Tone profile → communication style block
// ---------------------------------------------------------------------------
const TONE_BLOCKS = {
  direct: '- 1-liner answers by default. No bullet breakdowns, headers, or multi-paragraph explanations unless explicitly asked. No markdown in responses. Plain prose.',
  warm: '- Conversational tone by default. Be personable but efficient. Lead with the human context, then the operational detail. Keep it concise — warmth is not verbosity.',
  formal: '- Professional tone by default. Clear structure when presenting options. Use proper headings and organized formatting.',
  concise: '- Minimal responses. Answer the question, skip the framing. Expand only when explicitly asked.',
};

function getCommunicationStyleBlock(toneProfile) {
  return TONE_BLOCKS[toneProfile] || TONE_BLOCKS.direct;
}

// ---------------------------------------------------------------------------
// Vault generate-fresh surface definitions
// ---------------------------------------------------------------------------
const VAULT_FRESH_SURFACES = [
  { id: 'memory_md', templateRel: 'user-context/memory.md.tmpl', targetRel: 'memory.md' },
  { id: 'recent_context_md', templateRel: 'user-context/recent-context.md.tmpl', targetRel: 'recent-context.md' },
  { id: 'operator_identity_md', templateRel: 'operator/identity.md.tmpl', targetRel: 'operator/identity.md' },
  { id: 'operator_reminders_md', templateRel: 'operator/reminders.md.tmpl', targetRel: 'operator/reminders.md' },
  { id: 'operator_claudia_memory_md', templateRel: 'operator/claudia-memory.md.tmpl', targetRel: 'operator/claudia-memory.md' },
  { id: 'brands_registry_md', templateRel: 'brands/registry.md.tmpl', targetRel: 'brands/registry.md' },
  { id: 'operator_voice_md', templateRel: 'operator/voice.md.tmpl', targetRel: 'operator/voice.md' },
];

// ---------------------------------------------------------------------------
// Manifest cross-check: ensure VAULT_FRESH_SURFACES stays in sync with the
// generate-fresh vault surfaces declared in file-treatment-manifest.json.
// ---------------------------------------------------------------------------
function validateSurfaceListAgainstManifest(manifestPath) {
  const matrix = loadFileMatrix(manifestPath);
  const manifestIds = matrix.getGenerateFresh()
    .filter(s => s.location === 'vault')
    .map(s => s.id)
    .sort();
  const hardcodedIds = VAULT_FRESH_SURFACES.map(s => s.id).sort();

  if (manifestIds.length !== hardcodedIds.length ||
      !manifestIds.every((id, i) => id === hardcodedIds[i])) {
    throw new Error(
      `VAULT_FRESH_SURFACES drift detected.\n` +
      `  Manifest vault generate-fresh IDs: [${manifestIds.join(', ')}]\n` +
      `  Hardcoded IDs:                     [${hardcodedIds.join(', ')}]\n` +
      `Update VAULT_FRESH_SURFACES in fresh_generator.js to match the manifest.`
    );
  }
}

// ---------------------------------------------------------------------------
// Placeholder resolution
// ---------------------------------------------------------------------------
function buildFreshPlaceholderMap(packet) {
  const enabledRuntimes = getEnabledRuntimes(packet.runtimeSelection);
  return {
    owner_name: packet.owner_name,
    system_name: packet.system_name,
    vault_location: packet.vault_location,
    workspace_root: packet.workspace_root,
    timezone: packet.timezone,
    home_root: packet.home_root,
    primary_role: packet.primary_role,
    business_context: packet.business_context,
    priority_modes: packet.priority_modes,
    preferred_reporting_style: packet.preferred_reporting_style,
    tone_profile: packet.tone_profile,
    communication_style_block: getCommunicationStyleBlock(packet.tone_profile),
    selected_runtimes_list: enabledRuntimes.join(', '),
  };
}

// ---------------------------------------------------------------------------
// Generate vault fresh surfaces
// ---------------------------------------------------------------------------
function generateVaultFreshSurfaces(packet, templateSourceRoot, targetInstallRoot) {
  const report = { written: [], errors: [] };
  const placeholderMap = buildFreshPlaceholderMap(packet);

  for (const surface of VAULT_FRESH_SURFACES) {
    try {
      const tmplPath = path.join(templateSourceRoot, surface.templateRel);
      if (!fs.existsSync(tmplPath)) {
        report.errors.push({ id: surface.id, error: `template not found: ${tmplPath}` });
        continue;
      }

      const raw = fs.readFileSync(tmplPath, 'utf8');
      const rendered = resolvePlaceholders(raw, placeholderMap);

      // Verify no unresolved markers
      const unresolved = findUnresolvedMarkers(rendered);
      if (unresolved.length > 0) {
        report.errors.push({ id: surface.id, error: `unresolved placeholders: ${unresolved.join(', ')}` });
        continue;
      }

      const targetPath = path.join(targetInstallRoot, surface.targetRel);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, rendered, 'utf8');
      report.written.push(targetPath);
    } catch (err) {
      report.errors.push({ id: surface.id, error: err.message });
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Generate runtime config surfaces (already placed by installer as unrendered)
// ---------------------------------------------------------------------------
function generateRuntimeConfigs(packet, installerManifest) {
  const report = { written: [], errors: [] };

  if (!installerManifest.safeScaffolds || !Array.isArray(installerManifest.safeScaffolds)) {
    return report;
  }

  const placeholderMap = buildFreshPlaceholderMap(packet);

  for (const scaffold of installerManifest.safeScaffolds) {
    try {
      if (!fs.existsSync(scaffold.target)) {
        report.errors.push({ id: scaffold.id, error: `scaffold target not found: ${scaffold.target}` });
        continue;
      }

      const raw = fs.readFileSync(scaffold.target, 'utf8');
      const rendered = resolvePlaceholders(raw, placeholderMap);

      // Verify no unresolved markers
      const unresolved = findUnresolvedMarkers(rendered);
      if (unresolved.length > 0) {
        report.errors.push({ id: scaffold.id, error: `unresolved placeholders: ${unresolved.join(', ')}` });
        continue;
      }

      fs.writeFileSync(scaffold.target, rendered, 'utf8');
      report.written.push(scaffold.target);
    } catch (err) {
      report.errors.push({ id: scaffold.id, error: err.message });
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
function generateFreshSurfaces(packet, installerManifest, templateSourceRoot, targetInstallRoot, { manifestPath } = {}) {
  // Cross-check hardcoded surface list against manifest if path is available
  if (manifestPath) {
    validateSurfaceListAgainstManifest(manifestPath);
  }

  const vaultReport = generateVaultFreshSurfaces(packet, templateSourceRoot, targetInstallRoot);
  const runtimeReport = generateRuntimeConfigs(packet, installerManifest);

  return {
    written: [...vaultReport.written, ...runtimeReport.written],
    errors: [...vaultReport.errors, ...runtimeReport.errors],
    vaultCount: vaultReport.written.length,
    runtimeCount: runtimeReport.written.length,
  };
}

module.exports = {
  generateFreshSurfaces,
  generateVaultFreshSurfaces,
  generateRuntimeConfigs,
  getCommunicationStyleBlock,
  VAULT_FRESH_SURFACES,
};
