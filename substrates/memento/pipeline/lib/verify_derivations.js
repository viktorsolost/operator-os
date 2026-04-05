'use strict';

/**
 * Derivation verification module.
 *
 * Tests that derived outputs are fully recomputable from journal entries.
 * For each project: saves current derived files, deletes them, re-derives,
 * then compares the new output against the originals.
 *
 * Usage (test utility only — not part of the live pipeline):
 *   const { verifyRecomputable, verifyAll } = require('./verify_derivations');
 */

const fs = require('fs');
const path = require('path');

const { deriveFacts } = require('./derive_facts');
const { deriveThreads } = require('./derive_threads');
const { deriveActivity } = require('./derive_activity');
const { deriveContacts } = require('./derive_contacts');

const DERIVED_DIR = path.resolve(__dirname, '../../state/derived');

function factsPath(projectId) {
  return path.join(DERIVED_DIR, 'facts', `${projectId}.json`);
}

function threadsPath(projectId) {
  return path.join(DERIVED_DIR, 'threads', `${projectId}.json`);
}

function activityPath(projectId) {
  return path.join(DERIVED_DIR, 'activity', `${projectId}.json`);
}

function contactsPath() {
  return path.join(DERIVED_DIR, 'contacts.json');
}

/**
 * Read a JSON file, returning null if it does not exist.
 *
 * @param {string} filePath
 * @returns {object|null}
 */
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Write a JSON file, creating parent directories if needed.
 *
 * @param {string} filePath
 * @param {object} data
 */
function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Delete a file if it exists.
 *
 * @param {string} filePath
 */
function deleteIfExists(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // file didn't exist — fine
  }
}

/**
 * Deep-compare two objects after stripping time-variant fields that will
 * naturally differ between two derivation runs (e.g. derived_at timestamps).
 *
 * Returns true if the objects are structurally equal (ignoring derived_at).
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function deepEqualIgnoringTimestamps(a, b) {
  const strip = obj => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(strip);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'derived_at') continue; // always regenerated
      out[k] = strip(v);
    }
    return out;
  };
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

/**
 * Verify that derived outputs for a single project are fully recomputable.
 *
 * Steps:
 *  1. Read current derived files (facts, threads, activity).
 *  2. Delete them.
 *  3. Re-derive.
 *  4. Compare new output with saved originals.
 *  5. Restore original files so state is unchanged on success.
 *
 * @param {string} projectId
 * @returns {{ passed: boolean, details: string[] }}
 */
function verifyRecomputable(projectId) {
  const details = [];
  let passed = true;

  const targets = [
    {
      name: 'facts',
      filePath: factsPath(projectId),
      derive: () => deriveFacts(projectId),
    },
    {
      name: 'threads',
      filePath: threadsPath(projectId),
      derive: () => deriveThreads(projectId),
    },
    {
      name: 'activity',
      filePath: activityPath(projectId),
      derive: () => deriveActivity(projectId),
    },
  ];

  for (const target of targets) {
    const { name, filePath, derive } = target;
    details.push(`[${projectId}/${name}] Checking recomputability`);

    // Step 1 — read original
    const original = readJson(filePath);
    if (original === null) {
      details.push(`[${projectId}/${name}] SKIP — no existing derived file at ${filePath}`);
      continue;
    }

    // Step 2 — delete
    deleteIfExists(filePath);
    details.push(`[${projectId}/${name}] Deleted existing derived file`);

    // Step 3 — re-derive
    let recomputed;
    try {
      recomputed = derive();
      writeJson(filePath, recomputed);
      details.push(`[${projectId}/${name}] Re-derived and written to ${filePath}`);
    } catch (err) {
      details.push(`[${projectId}/${name}] FAIL — re-derivation threw: ${err.message}`);
      // Restore original so state is not destroyed
      writeJson(filePath, original);
      passed = false;
      continue;
    }

    // Step 4 — compare
    if (deepEqualIgnoringTimestamps(original, recomputed)) {
      details.push(`[${projectId}/${name}] PASS — output matches original`);
    } else {
      details.push(`[${projectId}/${name}] FAIL — output differs from original`);
      // Leave the recomputed file in place for inspection; restore original alongside it
      const backupPath = filePath.replace('.json', '.original.json');
      writeJson(backupPath, original);
      details.push(`[${projectId}/${name}] Original saved to ${backupPath} for diff inspection`);
      passed = false;
    }
  }

  return { passed, details };
}

/**
 * Run verifyRecomputable for all active projects and also verify contacts.
 *
 * @param {object} registry — the parsed registry.json object
 * @returns {{ passed: boolean, details: string[] }}
 */
function verifyAll(registry) {
  const allDetails = [];
  let allPassed = true;

  const activeProjects = (registry.projects || []).filter(p => p.status === 'active');

  if (activeProjects.length === 0) {
    allDetails.push('[verifyAll] No active projects found in registry');
  }

  for (const project of activeProjects) {
    const id = project.id || project.project_id;
    const { passed, details } = verifyRecomputable(id);
    allDetails.push(...details);
    if (!passed) allPassed = false;
  }

  // Verify contacts separately
  allDetails.push('[contacts] Checking recomputability');
  const contactsFilePath = contactsPath();
  const originalContacts = readJson(contactsFilePath);

  if (originalContacts === null) {
    allDetails.push('[contacts] SKIP — no existing contacts file at ' + contactsFilePath);
  } else {
    deleteIfExists(contactsFilePath);
    allDetails.push('[contacts] Deleted existing contacts file');

    let recomputedContacts;
    try {
      recomputedContacts = deriveContacts(registry);
      writeJson(contactsFilePath, recomputedContacts);
      allDetails.push(`[contacts] Re-derived and written to ${contactsFilePath}`);
    } catch (err) {
      allDetails.push(`[contacts] FAIL — re-derivation threw: ${err.message}`);
      writeJson(contactsFilePath, originalContacts);
      allPassed = false;
    }

    if (recomputedContacts !== undefined) {
      if (deepEqualIgnoringTimestamps(originalContacts, recomputedContacts)) {
        allDetails.push('[contacts] PASS — output matches original');
      } else {
        allDetails.push('[contacts] FAIL — output differs from original');
        const backupPath = contactsFilePath.replace('.json', '.original.json');
        writeJson(backupPath, originalContacts);
        allDetails.push(`[contacts] Original saved to ${backupPath} for diff inspection`);
        allPassed = false;
      }
    }
  }

  return { passed: allPassed, details: allDetails };
}

module.exports = { verifyRecomputable, verifyAll };
