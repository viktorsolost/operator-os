# Phase 2 Corrections + Phase 3 Handoff — Anton to Jonah

## Operator
You are Jonah, VP Engineering for VIK OS. You run implementation delivery under Anton's technical direction.

## Project
Memento — store-first project journal system. Repo: `/Volumes/BackBone/Coding/Memento`

## Context
Phase 2 is delivered. Claudia reviewed the live pipeline results and found two corrections. You must apply these fixes and rerun the pipeline before starting Phase 3.

This is one handoff with two parts: corrections first, then Phase 3 delivery.

---

# PART 1: Phase 2 Corrections

## What To Read First
- `plan/memento-technical-plan.md` — new "Fetch Scope Addendum" section (binding)
- `state/registry.json` — already updated with real Drive folder IDs and corrected field names

## Correction 1: Drive sync account

**Problem:** drive_client.js uses gws-personal to access Drive. The Eterno shared drive with all exhibition project folders is on the gws-eterno account.

**Fix:**
- Change drive_client.js to use `~/.config/gws-eterno/` as the config directory (via GOOGLE_WORKSPACE_CLI_CONFIG_DIR)
- The root folder for exhibitions is `1p3CeKNq2J-Iw5kNn9tFijhmkfwtU4bFR` ("EE_PROGRAMS / OPERATIONS DEPARTMENT")
- Structure: root > EE_PO_2026 > EE_PO_EXHIBITIONS_2026 > per-project folders
- But drive_sync should NOT crawl from the root. It should walk each registered project's `drive_folder_ids` from the registry recursively. The root is context only.
- Registry already has real folder IDs:
  - PUNKS: `1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW`
  - Lucas Zanotto: `1lk0NpoiJFIeIxsyrOqYMvyG0FQrqa0Fw`

## Correction 2: Calendar lookahead

**Problem:** calendar_sync uses 14-day lookahead. Exhibition projects plan events weeks ahead. Schedule changes need capturing before they're imminent.

**Fix:**
- Change calendar lookahead from 14 days to 30 days
- Lookback stays at 7 days
- This is now binding in the fetch scope addendum in the plan

## Correction 3: Registry schema alignment

**Already done by Anton.** The registry file has been updated:
- `basecamp_project_code` → `basecamp_project_codes` (array)
- PUNKS drive_folder_ids: placeholder → `1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW`
- Lucas Zanotto drive_folder_ids: `1S-GYPOUxQFyuMOuHhqiOeJ_ODfTwtdsP` → `1lk0NpoiJFIeIxsyrOqYMvyG0FQrqa0Fw`

**Action for you:** If any pipeline code reads `basecamp_project_code` (singular string) from the registry, update it to read `basecamp_project_codes` (array). Check basecamp_sync.js and linker.js.

## After Corrections: Full Pipeline Rerun

Run `node pipeline/cli/run.js all` and report:
- Total captures per source (Gmail, Basecamp, Calendar, Drive)
- How many captures are new vs already on disk
- Journal entries created by store_enrich
- Unlinked capture count
- Any auth failures
- Drive sync results specifically — we expect real files now with the corrected account and folder IDs

This rerun validates the corrections. Do not start Phase 3 until the rerun is clean.

---

# PART 2: Phase 3 — Deterministic Read Models

Read the full Phase 3 spec at `plan/phase-3-handoff-jonah.md` before starting this part. Everything below is a summary. The full spec has the detailed schemas, rules, and acceptance criteria.

## What Phase 3 Delivers

Four derived read models that compute current views from journal data. All are disposable caches, fully recomputable from registry + journals.

### 1. Fact derivation (`pipeline/lib/derive_facts.js`)
- `deriveFacts(projectId)` — scans journal entries with `fact_claims[]`, applies 4-tier precedence model, returns current facts with conflict surfacing
- Manual authority wins. Stale manual entry beats newer synced entry. Conflicts are surfaced, not silently resolved.

### 2. Thread derivation (`pipeline/lib/derive_threads.js`)
- `deriveThreads(projectId)` — scans journal entries with `thread_signals[]`, returns open and closed threads
- **Only the 8 allowed signal types.** Hardcoded. Any other signal type is a violation.
- Manual override has absolute precedence. New evidence after manual close reopens.
- **Red line: threads must never accumulate due dates, assignees, subtasks, priorities, or status beyond open/closed. If they do, the system has reintroduced a task engine.**

### 3. Activity feed (`pipeline/lib/derive_activity.js`)
- `deriveActivity(projectId, options)` — time-sorted projection of journal entries with filtering by time/source/limit
- Simplest derivation. No aggregation, no summarization, no interpretation.

### 4. Contact derivation (`pipeline/lib/derive_contacts.js`)
- `deriveContacts(registry)` — cross-project contact index from journal actors/contacts
- Basic merge by email address (lowercase). Full identity resolution deferred to contacts contract.
- Flag with TODO comment at top of file.

### 5. CLI commands
Update `pipeline/cli/run.js`:
- `derive_facts [project_id]`
- `derive_threads [project_id]`
- `derive_activity [project_id]`
- `derive_contacts`
- `derive_all`

Output to `state/derived/facts/`, `state/derived/threads/`, `state/derived/activity/`, `state/derived/contacts.json`.

### 6. Recomputation verifier (`pipeline/lib/verify_derivations.js`)
- `verifyRecomputable(projectId)` — delete derived files, rerun, compare. Must be identical.

## Phase 3 Acceptance Criteria

1. Views fully recomputable — delete and re-derive produces identical output
2. Fixture-tested against seed journals (punks-2026, lucas-zanotto-2026)
3. No secondary truth store — derived views are disposable
4. Fact precedence works — manual beats synced for same key
5. Fact conflicts surfaced — LZ curatorial_text_status shows manual "pending" vs synced "received"
6. Thread derivation uses only 8 allowed signal types
7. Thread manual override works
8. Activity feed is time-sorted and filterable
9. Contact derivation produces cross-project index
10. CLI commands work for individual and all-project runs

## What Not To Do

- Do not add task properties to threads (due dates, assignees, subtasks, priorities, status beyond open/closed)
- Do not persist derived views as truth
- Do not modify journals from derivation logic
- Do not add thread signal types beyond the 8 in the contract
- Do not implement dashboard (Phase 4)

## Report Back

When done, report in two sections:

**Part 1 — Corrections rerun:**
- Captures per source after corrections
- Drive sync results with real folder IDs
- Any remaining auth issues
- Confirmation pipeline is clean

**Part 2 — Phase 3 delivery:**
- What was delivered
- Fixture test results
- Recomputation verification result
- Pushback items or contract gaps
- Decisions made that weren't specified
- Confirmation that acceptance criteria 1-10 pass
