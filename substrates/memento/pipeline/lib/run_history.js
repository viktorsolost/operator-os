'use strict';

const fs = require('fs');
const path = require('path');

const HISTORY_DIR = path.join(__dirname, '../../state/logs');
const HISTORY_FILE = path.join(HISTORY_DIR, 'run_history.json');
const MAX_RUNS = 100;

function ensureDir() {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

/**
 * Read the run history file.
 * Returns { runs: [] } if the file does not exist yet.
 */
function readRunHistory() {
  ensureDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    return { runs: [] };
  }
  const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
  return JSON.parse(raw);
}

/**
 * Append a run record to the history.
 * Trims the list to the last MAX_RUNS entries (oldest removed first).
 */
function appendRun(record) {
  const history = readRunHistory();
  history.runs.push(record);
  if (history.runs.length > MAX_RUNS) {
    history.runs = history.runs.slice(history.runs.length - MAX_RUNS);
  }
  ensureDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

/**
 * Return the most recent run record, or null if history is empty.
 */
function getLastRun() {
  const { runs } = readRunHistory();
  if (runs.length === 0) return null;
  return runs[runs.length - 1];
}

/**
 * Return all run records with a timestamp >= the given ISO8601 string.
 */
function getRunsSince(since) {
  const { runs } = readRunHistory();
  const cutoff = new Date(since).getTime();
  return runs.filter(r => new Date(r.timestamp).getTime() >= cutoff);
}

module.exports = { readRunHistory, appendRun, getLastRun, getRunsSince };
