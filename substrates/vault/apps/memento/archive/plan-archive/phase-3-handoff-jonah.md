# Phase 3 Handoff — Anton to Jonah

## Operator
You are Jonah, VP Engineering for VIK OS. You run implementation delivery under Anton's technical direction.

## Project
Memento — store-first project journal system. Repo: `/Volumes/BackBone/Coding/Memento`

## Context
Phase 2 is complete. The pipeline syncs from live APIs, writes captures, and enriches them into journal entries with full ingest identity and rerun safety. Phase 3 builds the deterministic read models that derive current views from journal data.

## What To Read First

1. `docs/contracts/fact-derivation.md` — precedence model, conflict handling, derivation rules
2. `docs/contracts/thread-derivation.md` — 8 allowed signal types, derivation rules, manual override, the red line
3. `docs/contracts/project-linking.md` — for contact identity context
4. `plan/memento-technical-plan.md` — Phase 3 section and Contacts Model section
5. `state/store/punks-2026.json` and `state/store/lucas-zanotto-2026.json` — real journal data from Phase 2 pipeline runs

## Critical Constraint

**The "no task engine" invariant is the single most important guardrail in this system.** Open threads are where task creep tries to sneak back in. Any thread derivation logic that cannot point to a specific open/close signal type from the allowed list in the contract is a violation. Full stop.

Read the "What Threads Must Never Become" section in the thread derivation contract before writing any thread code.

## Deliverables

### 1. Fact derivation module

**pipeline/lib/derive_facts.js:**

`deriveFacts(projectId)` — reads the journal, scans all entries with `fact_claims[]`, applies the precedence model, returns the current fact set.

Input: project journal (via journal_io.readJournal)
Output:
```json
{
  "project_id": "string",
  "derived_at": "ISO8601",
  "facts": {
    "{fact_key}": {
      "fact_key": "string",
      "current_value": "string | number | boolean",
      "current_source": {
        "entry_id": "string",
        "timestamp": "ISO8601",
        "authorship": "manual | synced | extracted",
        "confidence": "high | medium | low"
      },
      "conflicts": [
        {
          "value": "string | number | boolean",
          "entry_id": "string",
          "timestamp": "ISO8601",
          "authorship": "string",
          "confidence": "string"
        }
      ]
    }
  }
}
```

Precedence rules (from contract):
1. Manual authoritative entries (Tier 1) — always win
2. Direct trusted synced entries with high confidence (Tier 2)
3. Extracted entries with explicit provenance (Tier 3)
4. Inferred or weakly linked claims (Tier 4)

Within same tier: most recent timestamp wins. If timestamps identical, more specific provenance wins. If still tied, both appear in conflicts.

Key behavior: a stale manual entry beats a newer synced entry. This is intentional. The system surfaces the conflict so the operator can update, but it does not silently override manual authority.

### 2. Open thread derivation module

**pipeline/lib/derive_threads.js:**

`deriveThreads(projectId)` — reads the journal, scans all entries with `thread_signals[]`, applies the derivation rules, returns the current open thread set.

Input: project journal
Output:
```json
{
  "project_id": "string",
  "derived_at": "ISO8601",
  "open_threads": [
    {
      "thread_key": "string",
      "status": "open",
      "signal_type": "string — the opening signal type",
      "counterparty": "string",
      "opened_by": {
        "entry_id": "string",
        "timestamp": "ISO8601",
        "source": "string",
        "basis": "string"
      },
      "last_signal": {
        "entry_id": "string",
        "timestamp": "ISO8601",
        "signal_type": "string",
        "basis": "string"
      },
      "age_days": "number"
    }
  ],
  "closed_threads": [
    {
      "thread_key": "string",
      "status": "closed",
      "closed_by": {
        "entry_id": "string",
        "timestamp": "ISO8601",
        "signal_type": "string",
        "basis": "string"
      }
    }
  ]
}
```

Derivation rules (from contract):
1. Group signals by thread_key
2. Sort by timestamp
3. Most recent signal determines state
4. `manual_thread_closed` has absolute precedence — closes regardless of inferred status
5. `manual_thread_opened` has absolute precedence over automated closing signals
6. New evidence after a manual close reopens the thread (the new signal postdates the close)

**Only the 8 allowed signal types may participate:**
- Opening: `awaiting_reply`, `awaiting_external_action`, `followup_required`, `manual_thread_opened`
- Closing: `reply_received`, `external_action_completed`, `followup_completed`, `manual_thread_closed`

Hardcode this list. If a journal entry contains a signal_type not on this list, log a warning and skip it. Do not invent new signal types.

Closed threads are returned separately for history but not surfaced in the active view by default.

### 3. Activity feed derivation module

**pipeline/lib/derive_activity.js:**

`deriveActivity(projectId, options)` — reads the journal, returns a time-sorted activity feed.

Options:
- `since` — ISO8601, only entries after this time
- `limit` — max entries to return
- `sources` — filter by source type(s)

Input: project journal
Output:
```json
{
  "project_id": "string",
  "derived_at": "ISO8601",
  "entries": [
    {
      "entry_id": "string",
      "timestamp": "ISO8601",
      "source": "string",
      "entry_type": "string",
      "title": "string",
      "summary": "string",
      "actors": ["string"],
      "authorship": "string"
    }
  ]
}
```

This is the simplest derivation — it's a filtered, sorted projection of journal entries. No aggregation, no summarization, no interpretation. Just the feed.

### 4. Contact derivation module

**pipeline/lib/derive_contacts.js:**

`deriveContacts(registry)` — reads all journals for active projects, extracts actors and contacts, returns a cross-project contact index.

This is a Phase 3 deliverable but the full identity resolution rules are deferred to a contacts contract that will be written before Phase 3 contacts work ships. For now, implement a basic version:

**Basic merge rules (sufficient for Phase 3):**
- Primary key: email address (lowercase, trimmed)
- If no email, use display name as fallback key (will produce duplicates — acceptable for now)
- Group all journal appearances by primary key
- For each contact, collect: all names seen, all email addresses, all projects they appear in, first seen timestamp, last seen timestamp, total appearance count

Output:
```json
{
  "derived_at": "ISO8601",
  "contacts": [
    {
      "primary_key": "string — email or name",
      "names": ["string — all names seen for this identity"],
      "emails": ["string — all email addresses"],
      "projects": ["string — project_ids where this contact appears"],
      "first_seen": "ISO8601",
      "last_seen": "ISO8601",
      "appearance_count": "number"
    }
  ]
}
```

This is explicitly a basic implementation. The full contacts contract with proper identity resolution (multi-account disambiguation, organizational aliases, conflict resolution) is deferred. Flag in a comment at the top of the file: `// TODO: Full identity resolution rules pending contacts contract (Phase 3 deferred item)`.

### 5. Derivation CLI commands

Update `pipeline/cli/run.js` to support:
- `node pipeline/cli/run.js derive_facts [project_id]` — derive facts for one project, or all active projects if no ID given
- `node pipeline/cli/run.js derive_threads [project_id]` — derive threads for one project or all
- `node pipeline/cli/run.js derive_activity [project_id]` — derive activity feed for one project or all
- `node pipeline/cli/run.js derive_contacts` — derive cross-project contacts
- `node pipeline/cli/run.js derive_all` — run all four derivations

Output: write derived views to `state/derived/`:
- `state/derived/facts/{project_id}.json`
- `state/derived/threads/{project_id}.json`
- `state/derived/activity/{project_id}.json`
- `state/derived/contacts.json`

### 6. Derived view recomputation guarantee

Every derived view must be fully recomputable from registry + journal data. To prove this:

Create `pipeline/lib/verify_derivations.js`:
- `verifyRecomputable(projectId)` — delete the derived files, rerun all derivations, compare output. Must be identical.
- This is a test utility, not a production step.

## Acceptance Criteria

1. Views are fully recomputable from registry + journal entries — deleting derived files and re-deriving produces identical output
2. Derivation rules are fixture-tested — test against the seed journals from Phase 1 (punks-2026 and lucas-zanotto-2026)
3. No secondary truth store is required — derived views are disposable caches, not canonical state
4. Fact precedence works — manual entry for artist_count on PUNKS beats synced entry for the same key
5. Fact conflicts are surfaced — the Lucas Zanotto curatorial_text_status conflict (manual "pending" vs synced "received") appears in conflicts array
6. Thread derivation uses only the 8 allowed signal types — no invented signals, no "seems pending"
7. Thread manual override works — manual_thread_closed closes regardless of inferred status
8. Activity feed is time-sorted and filterable
9. Contact derivation produces cross-project index from journal actors/contacts
10. CLI commands work for individual projects and all-project runs

## What Not To Do

- Do not add due dates, assignees, subtasks, priorities, or status progression to threads
- Do not create a primary contact database — contacts remain derived
- Do not persist derived views as truth — they are disposable caches
- Do not add summarization, interpretation, or AI-generated content to any derivation
- Do not implement dashboard (Phase 4)
- Do not modify journals from derivation logic — derivation only reads
- Do not add thread signal types beyond the 8 in the contract

## Push Back If

- The seed journal data doesn't have enough variety to test all precedence tiers — flag what's missing
- The thread signals in real journal entries (from Phase 2 pipeline runs) don't match expected patterns — flag the specific mismatch
- Contact derivation needs decisions not covered by the basic merge rules — flag the edge case
- Any derivation requires reading from state other than registry + journals — flag the dependency

## Report Back

When done, report:
- What was delivered
- Fixture test results against seed data (PUNKS and Lucas Zanotto)
- Recomputation verification result
- Any pushback items or contract gaps found
- Any decisions you made that weren't specified
- Confirmation that acceptance criteria 1-10 all pass
