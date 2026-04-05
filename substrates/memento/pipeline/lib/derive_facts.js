/**
 * Fact derivation module.
 *
 * Derives current project facts from journal entries by scanning
 * all entries carrying fact_claims[] and applying the precedence model.
 *
 * Source contract: docs/contracts/fact-derivation.md
 *
 * Rules:
 *   - Reads journals only, never writes
 *   - No secondary truth store
 *   - Fully recomputable from journal entries at any time
 *
 * Precedence tiers (highest to lowest):
 *   Tier 1 — authorship: "manual"
 *   Tier 2 — authorship: "synced", confidence: "high"
 *   Tier 3 — authorship: "extracted"
 *   Tier 4 — confidence: "low" | "medium" (weakest)
 *
 * Within same tier: most recent timestamp wins.
 * If timestamps are tied: more specific provenance wins.
 * If still tied: both surfaced as conflicting.
 */

'use strict';

const { readJournal } = require('./journal_io');

/**
 * Determine the precedence tier for a claim.
 * Lower number = higher precedence.
 *
 * @param {object} claim - A fact claim with authorship and confidence fields
 * @returns {number} Tier 1–4
 */
function getTier(claim) {
  const { authorship, confidence } = claim;

  if (authorship === 'manual') return 1;
  if (authorship === 'synced' && confidence === 'high') return 2;
  if (authorship === 'extracted') return 3;
  // Tier 4: everything else (synced low/medium, weak inferred claims)
  return 4;
}

/**
 * Score provenance specificity for tie-breaking within a tier.
 * Higher score = more specific provenance.
 *
 * @param {object} entry - Full journal entry
 * @returns {number}
 */
function provenanceScore(entry) {
  const prov = entry.provenance || {};
  let score = 0;
  if (prov.extraction_parent) score += 2;
  if (Array.isArray(prov.source_artifact_refs) && prov.source_artifact_refs.length > 0) score += 1;
  if (Array.isArray(prov.capture_ids) && prov.capture_ids.length > 0) score += 1;
  if (entry.project_link && entry.project_link.mode === 'direct') score += 1;
  return score;
}

/**
 * Parse a timestamp string to a comparable value (ms since epoch).
 * Returns 0 for unparseable values so they lose any tie-break.
 *
 * @param {string} ts
 * @returns {number}
 */
function parseTimestamp(ts) {
  if (!ts) return 0;
  const ms = Date.parse(ts);
  return isNaN(ms) ? 0 : ms;
}

/**
 * Derive current facts for a project by scanning journal entries.
 *
 * @param {string} projectId
 * @returns {object} Derived fact view — see output schema in task spec
 */
function deriveFacts(projectId) {
  const journal = readJournal(projectId);
  if (!journal) {
    throw new Error(`Journal not found for project: ${projectId}`);
  }

  // Collect all candidate claims, annotated with their entry context.
  // Structure: { fact_key -> [ candidate, ... ] }
  const candidates = {};

  for (const entry of journal.entries) {
    if (!Array.isArray(entry.fact_claims) || entry.fact_claims.length === 0) {
      continue;
    }

    for (const claim of entry.fact_claims) {
      // Guard: skip malformed claims (missing required fields)
      if (!claim.fact_key || claim.fact_value === undefined || !claim.confidence || !claim.authorship) {
        continue;
      }

      const key = claim.fact_key;
      if (!candidates[key]) candidates[key] = [];

      candidates[key].push({
        fact_key: key,
        value: claim.fact_value,
        // Use claim-level authorship/confidence; fall back to entry-level if needed
        authorship: claim.authorship,
        confidence: claim.confidence,
        entry_id: entry.entry_id,
        timestamp: entry.timestamp,
        entry: entry, // keep reference for tie-breaking
      });
    }
  }

  // Resolve each fact key to a winner + conflicts.
  const facts = {};

  for (const [key, claimList] of Object.entries(candidates)) {
    // Sort by: tier ASC, timestamp DESC, provenance score DESC
    const sorted = [...claimList].sort((a, b) => {
      const tierA = getTier(a);
      const tierB = getTier(b);
      if (tierA !== tierB) return tierA - tierB; // lower tier number wins

      const tsA = parseTimestamp(a.timestamp);
      const tsB = parseTimestamp(b.timestamp);
      if (tsA !== tsB) return tsB - tsA; // newer wins

      const psA = provenanceScore(a.entry);
      const psB = provenanceScore(b.entry);
      return psB - psA; // more specific provenance wins
    });

    const winner = sorted[0];
    const rest = sorted.slice(1);

    // Build conflicts: all losers that carry a DIFFERENT value from the winner.
    // (Same-value duplicates are silently dropped — they agree, not conflict.)
    const conflicts = rest
      .filter(c => String(c.value) !== String(winner.value))
      .map(c => ({
        value: c.value,
        entry_id: c.entry_id,
        timestamp: c.timestamp,
        authorship: c.authorship,
        confidence: c.confidence,
      }));

    facts[key] = {
      fact_key: key,
      current_value: winner.value,
      current_source: {
        entry_id: winner.entry_id,
        timestamp: winner.timestamp,
        authorship: winner.authorship,
        confidence: winner.confidence,
      },
      conflicts,
    };
  }

  return {
    project_id: projectId,
    derived_at: new Date().toISOString(),
    facts,
  };
}

module.exports = { deriveFacts };
