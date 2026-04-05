/**
 * Thread derivation module.
 *
 * Derives open and closed threads from journal entries by scanning
 * thread_signals[] arrays. Read-only — never writes to journals.
 *
 * Contract: docs/contracts/thread-derivation.md
 */

const { readJournal } = require('./journal_io');

// The only 8 signal types that may participate. Hardcoded per contract.
const OPENING_SIGNALS = new Set([
  'awaiting_reply',
  'awaiting_external_action',
  'followup_required',
  'manual_thread_opened',
]);

const CLOSING_SIGNALS = new Set([
  'reply_received',
  'external_action_completed',
  'followup_completed',
  'manual_thread_closed',
]);

const ALLOWED_SIGNALS = new Set([...OPENING_SIGNALS, ...CLOSING_SIGNALS]);

/**
 * Derive open and closed threads for a project from its journal.
 *
 * @param {string} projectId
 * @returns {object} { project_id, derived_at, open_threads, closed_threads }
 */
function deriveThreads(projectId) {
  const journal = readJournal(projectId);
  if (!journal) {
    throw new Error(`No journal found for project: ${projectId}`);
  }

  // Collect all signals from all entries, attaching entry context
  const allSignals = [];

  for (const entry of journal.entries) {
    if (!entry.thread_signals || !Array.isArray(entry.thread_signals)) continue;

    for (const signal of entry.thread_signals) {
      if (!ALLOWED_SIGNALS.has(signal.signal_type)) {
        console.warn(
          `[derive_threads] WARNING: unknown signal_type "${signal.signal_type}" ` +
          `in entry "${entry.entry_id}" — skipping`
        );
        continue;
      }

      allSignals.push({
        signal_type: signal.signal_type,
        thread_key: signal.thread_key,
        counterparty: signal.counterparty,
        basis: signal.basis,
        entry_id: entry.entry_id,
        timestamp: entry.timestamp,
        source: entry.source,
      });
    }
  }

  // Group signals by thread_key
  const byKey = {};
  for (const sig of allSignals) {
    if (!byKey[sig.thread_key]) byKey[sig.thread_key] = [];
    byKey[sig.thread_key].push(sig);
  }

  // Sort each group by timestamp ascending
  for (const key of Object.keys(byKey)) {
    byKey[key].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  const openThreads = [];
  const closedThreads = [];
  const now = new Date();

  for (const [threadKey, signals] of Object.entries(byKey)) {
    const result = resolveThread(threadKey, signals, now);
    if (result === null) continue;
    if (result.status === 'open') {
      openThreads.push(result);
    } else {
      closedThreads.push(result);
    }
  }

  return {
    project_id: projectId,
    derived_at: now.toISOString(),
    open_threads: openThreads,
    closed_threads: closedThreads,
  };
}

/**
 * Resolve the state of a single thread from its sorted signals.
 *
 * Resolution rules (from contract):
 * 1. Walk signals in chronological order, tracking open/close state.
 * 2. manual_thread_closed has absolute precedence — closes regardless.
 * 3. manual_thread_opened has absolute precedence over automated closing.
 * 4. New opening evidence after a manual close reopens the thread.
 * 5. Most recent signal determines current state.
 *
 * Implementation: walk signals, apply state transitions, track opener.
 */
function resolveThread(threadKey, signals, now) {
  let isOpen = false;
  let openingSignal = null;   // first signal that opened the thread
  let lastSignal = null;      // most recent signal processed
  let closeSignal = null;     // signal that closed the thread (if closed)

  for (const sig of signals) {
    const isOpening = OPENING_SIGNALS.has(sig.signal_type);
    const isClosing = CLOSING_SIGNALS.has(sig.signal_type);

    if (isOpening) {
      if (!isOpen) {
        // Opens the thread
        isOpen = true;
        openingSignal = sig;
        closeSignal = null;
      }
      // If already open: update last_signal but don't change opener
    } else if (isClosing) {
      if (sig.signal_type === 'manual_thread_closed') {
        // Absolute precedence — closes regardless of current state
        isOpen = false;
        closeSignal = sig;
        // Don't clear openingSignal — we need provenance if it reopens
      } else {
        // Automated close — closes whether or not we saw the open in this journal.
        // The open signal may predate the journal window or live in another entry.
        isOpen = false;
        closeSignal = sig;
      }
    }

    lastSignal = sig;
  }

  // If neither open nor a close signal was recorded, skip this thread key.
  // This can happen if a thread_key appears only in signal-less or skipped entries.
  if (!isOpen && !closeSignal) {
    return null;
  }

  if (isOpen) {
    // Build open thread record
    const openedAt = new Date(openingSignal.timestamp);
    const ageDays = Math.floor((now - openedAt) / (1000 * 60 * 60 * 24));

    return {
      thread_key: threadKey,
      status: 'open',
      signal_type: openingSignal.signal_type,
      counterparty: openingSignal.counterparty,
      opened_by: {
        entry_id: openingSignal.entry_id,
        timestamp: openingSignal.timestamp,
        source: openingSignal.source,
        basis: openingSignal.basis,
      },
      last_signal: {
        entry_id: lastSignal.entry_id,
        timestamp: lastSignal.timestamp,
        signal_type: lastSignal.signal_type,
        basis: lastSignal.basis,
      },
      age_days: ageDays,
    };
  } else {
    // Build closed thread record
    return {
      thread_key: threadKey,
      status: 'closed',
      closed_by: {
        entry_id: closeSignal.entry_id,
        timestamp: closeSignal.timestamp,
        signal_type: closeSignal.signal_type,
        basis: closeSignal.basis,
      },
    };
  }
}

module.exports = { deriveThreads };
