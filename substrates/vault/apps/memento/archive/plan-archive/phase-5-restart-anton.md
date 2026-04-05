# Phase 5 Restart Plan — Anton

## Why this file exists

Phase 5 execution was interrupted when Jonah hit model rate limits mid-implementation.

The repo was then reviewed against `plan/phase-5-handoff-jonah.md` to separate actual delivery from optimistic "done" flags.

This file is now the execution source of truth for resuming Phase 5 cleanly.

## Verified repo reality at handoff interruption

### Done

- `pipeline/cli/scheduled_run.sh` exists and is syntactically valid
- `pipeline/cli/install_schedule.sh` exists and is syntactically valid
- Sync steps now record failures through `pipeline/lib/sync_log.js`
- `pipeline/lib/run_history.js` exists as helper scaffolding

### Partial

- Auth resilience is only partially integrated
- Failures are recorded, but sync-log structure is not yet normalized to the Phase 5 contract
- Gmail still uses ad hoc top-level per-account timestamps instead of a clean stable schema

### Not done

- `pipeline/steps/morning_digest.js` is still a stub
- `pipeline/cli/run.js` has no `status` command
- `pipeline/cli/run.js` does not append run history
- `state/logs/run_history.json` exists but is still empty
- Scheduled runs do not write coherent aggregated run-history entries
- Incremental validation runs were not done
- Unlinked observation was not done

### Unverified

- RAPT investigation has no local artifact or report-back in repo state

## Decision

Do not resume from Jonah's claimed Wave 1 completion state.

Resume from verified repo reality.

The correct status is:

- Wave 1, partially complete
- Wave 2, not started in any meaningful way
- Wave 3, not started

## Execution order

Phase 5 must resume in this order:

1. Run history integration
2. Sync-log contract cleanup
3. Morning digest implementation
4. CLI status command
5. Scheduled-run hardening
6. Incremental validation
7. Unlinked capture observation
8. RAPT recommendation write-up

This order is binding because morning digest and CLI status both depend on run history and failure tracking being real.

---

## Step 1 — Run history integration

### Goal

Make pipeline run tracking real, not scaffold-only.

### Files

- `pipeline/cli/run.js`
- `pipeline/lib/run_history.js`
- `pipeline/cli/scheduled_run.sh` if needed for explicit run context

### Required behavior

- Every CLI-triggered run appends one run record
- Every scheduled run appends one run record
- Each record includes:
  - `timestamp`
  - `type`
  - `triggered_by`
  - `duration_seconds`
  - `results.gmail`
  - `results.basecamp`
  - `results.calendar`
  - `results.drive`
  - `results.store_enrich`
  - `results.derivations`
  - `results.morning_digest`
  - `auth_failures`
- Keep only the last 100 entries
- `all` and scheduled runs must write one aggregated run record, not fragmented per-step rows

### Acceptance

- One manual run creates one populated row in `state/logs/run_history.json`
- A second run appends correctly
- History trimming still works

---

## Step 2 — Sync-log contract cleanup

### Goal

Normalize failure and sync-state persistence to the Phase 5 contract without losing current state.

### Files

- `pipeline/lib/sync_log.js`
- `pipeline/steps/gmail_sync.js`
- `pipeline/steps/calendar_sync.js`
- `pipeline/steps/drive_sync.js`
- `pipeline/steps/basecamp_sync.js`

### Required behavior

- Each source uses a stable persisted schema
- Failures accumulate in a `failures` array
- Existing incremental sync behavior is preserved
- Gmail keeps per-account progress, but in a clean structured shape
- Failures are not cleared except by successful morning digest generation

### Recommended persisted shape

- Basecamp, calendar, drive:
  - `last_run`
  - `last_sync`
  - `failures`
- Gmail:
  - `last_run`
  - `last_sync` keyed by account
  - `failures`

### Acceptance

- A single-account Gmail auth failure is recorded
- Other Gmail accounts continue
- Other sources continue
- Incremental sync still uses the right timestamps

---

## Step 3 — Morning digest implementation

### Goal

Implement the real Phase 5 digest, not a placeholder.

### Files

- `pipeline/steps/morning_digest.js`
- New helpers under `pipeline/lib/` if needed
- `pipeline/lib/run_history.js` and `pipeline/lib/sync_log.js` if read helpers are needed

### Required behavior

- Read prior digest to determine the digest window
- Read run history for all runs in the window
- Aggregate sync totals and failures
- Read journal entries within the window
- Read open threads across active projects
- Read today's calendar events in Dubai time
- Compare current facts against the prior fact snapshot
- Write `state/derived/morning_digest.json`
- Write `state/derived/morning_digest_fact_snapshot.json`
- Clear accumulated sync failures only after successful digest write

### Guardrail

Morning digest is a read artifact only.

It must not become a truth layer or mutate source-of-truth state beyond the allowed failure-clear and fact-snapshot writes.

### Acceptance

- `node pipeline/cli/run.js morning_digest` writes both digest files
- All required sections are present
- Auth failures include paste-ready re-auth commands
- First run behaves cleanly with no prior snapshot
- Second run advances the digest window correctly

---

## Step 4 — CLI status command

### Goal

Provide one-screen operational visibility into the latest run.

### Files

- `pipeline/cli/run.js`
- `pipeline/lib/run_history.js` if formatting helpers are useful

### Required behavior

- Add `status` as a valid command
- Print latest run summary:
  - timestamp
  - type
  - triggered_by
  - captures/new/errors by source
  - store enrich totals
  - derivation result
  - morning digest result
  - auth failures

### Acceptance

- `node pipeline/cli/run.js status` works on populated history
- It also fails cleanly on empty history

---

## Step 5 — Scheduled-run hardening

### Goal

Make scheduled runs operationally correct, not just command wrappers.

### Files

- `pipeline/cli/scheduled_run.sh`
- `pipeline/cli/run.js` if scheduled context should be passed explicitly

### Required behavior

- `sync` runs do sync, enrich, derive only
- `full` runs do sync, enrich, derive, digest
- Each scheduled run produces one coherent run-history row
- Log rotation remains in place
- Do not auto-install cron

### Acceptance

- Local dry runs of `scheduled_run.sh sync` and `scheduled_run.sh full` behave correctly
- `full` writes digest, `sync` does not
- Each run creates exactly one run-history record

---

## Step 6 — Incremental validation

### Goal

Prove the pipeline is idempotent in live operation.

### Required behavior

Run the pipeline manually 3 times with spacing and record:

- Gmail captures, new and total
- Calendar captures, new and total
- Drive captures, new and total
- Basecamp captures, new and total
- Journal entries created
- Unlinked count
- Auth failures

### Acceptance

- Runs 2 and 3 show near-zero new activity unless upstream changed
- No duplicate captures
- No duplicate journal entries
- No broken incremental behavior

---

## Step 7 — Unlinked capture observation

### Goal

Document the shape of the unlinked pool before any ignore-list work.

### File

- `state/derived/unlinked_observation.json`

### Required behavior

- Categorize current unlinked captures by pattern
- Include counts
- Include example capture IDs
- Include recommendation only
- Do not implement filtering

### Acceptance

- Observation file exists
- Output is useful for a later ignore-list decision

---

## Step 8 — RAPT recommendation write-up

### Goal

Produce a decision-ready recommendation, not an untracked research claim.

### Required behavior

- Explain root cause
- Rank available fixes by reliability and effort
- Separate admin-required changes from code changes
- Recommend the best path
- Do not implement the fix yet

### Acceptance

- Recommendation is written as a concrete report-back artifact
- Viktor can see exactly which changes require admin access

---

## What not to do

- Do not build dashboard work
- Do not create new contracts
- Do not expand contact identity resolution
- Do not install cron automatically
- Do not implement a RAPT fix before review

## Phase 5 completion standard

Phase 5 is complete only when:

1. Run history is real
2. Sync failures are recorded cleanly
3. Morning digest is real
4. CLI status is real
5. Scheduled full versus sync behavior is real
6. Three validation runs prove idempotency
7. Unlinked observation exists
8. RAPT recommendation is written up clearly

## Reporting rule

Do not use "done" because files exist.

Use:

- scaffolded
- partially integrated
- fully wired
- validated live

That language is mandatory for the remainder of Phase 5.
