# Phase 5 Handoff — Anton to Jonah

## Interruption note, 2026-03-29

This handoff was interrupted mid-execution when Jonah hit model rate limits during Phase 5 implementation.

A repo review was done afterward to verify actual delivery against claimed Wave 1 completion.

Verified reality:

- Schedule scripts were created
- Auth-failure recording was partially integrated
- Run-history helper scaffolding was created
- Morning digest remained a stub
- CLI status was not implemented
- Run history was not wired into actual runs
- Validation and unlinked observation were not started
- RAPT investigation was not evidenced in repo state

This file remains the original handoff intent.

Execution should now resume from:

- `plan/phase-5-restart-anton.md`

That file is the current source of truth for resuming Phase 5 from verified repo reality rather than optimistic done flags.

## Operator
You are Jonah, VP Engineering for VIK OS. You run implementation delivery under Anton's technical direction.

## Project
Memento — store-first project journal system. Repo: `/Volumes/BackBone/Coding/Memento`

## Context
Phases 0-3 complete. Phase 4 (dashboard) deliberately deferred. Phase 5 makes the pipeline operational: scheduled runs, auth resilience, morning digest, and real-project validation. Claudia operates through conversation against Memento data for ~1 week before dashboard surfaces are designed.

Current state: 506 captures, 27 journal entries, 479 unlinked, 23 contacts, all sync sources live, all derivation modules passing recomputation checks.

## What To Read First

1. `plan/memento-technical-plan.md` — Fetch Scope Addendum (binding), Pipeline Steps section
2. `pipeline/cli/run.js` — current CLI entrypoint
3. `pipeline/lib/` — all IO and derivation modules
4. `state/sync_log/` — current sync timestamps

---

## Deliverables

### 1. Scheduled pipeline runs

**Schedule: 21 runs per day.** Pipeline is incremental. Unchanged upstream data produces zero new captures. API rate limits are not a concern at this volume.

**Daytime (hourly, 6:45am to midnight Dubai):**
02:45, 03:45, 04:45, 05:45, 06:45, 07:45, 08:45, 09:45, 10:45, 11:45, 12:45, 13:45, 14:45, 15:45, 16:45, 17:45, 18:45, 19:45, 20:00 UTC

**Overnight (3 runs):**
22:00, 00:00, 02:00 UTC

**Morning digest run:** 02:00 UTC (6am Dubai). This run generates the morning digest as its final step. Viktor wakes at 7am Dubai — digest must be ready before his day starts.

**All other runs:** sync + enrich + derivations only. No digest generation.

**Implementation:**

Create `pipeline/cli/scheduled_run.sh`:
```bash
#!/bin/bash
# Memento scheduled pipeline run
# Usage: scheduled_run.sh [full|sync]
# "full" = sync + enrich + derive + morning_digest (6am Dubai run only)
# "sync" = sync + enrich + derive (all other runs)

MEMENTO_DIR="/Volumes/BackBone/Coding/Memento"
LOG_DIR="$MEMENTO_DIR/state/logs"
TIMESTAMP=$(date -u +%Y-%m-%d_%H-%M)
LOG_FILE="$LOG_DIR/pipeline_${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"
cd "$MEMENTO_DIR"

RUN_TYPE="${1:-sync}"

echo "=== Memento pipeline run: $RUN_TYPE at $TIMESTAMP ===" >> "$LOG_FILE"

# Sync steps
node pipeline/cli/run.js basecamp_sync >> "$LOG_FILE" 2>&1
node pipeline/cli/run.js gmail_sync >> "$LOG_FILE" 2>&1
node pipeline/cli/run.js calendar_sync >> "$LOG_FILE" 2>&1
node pipeline/cli/run.js drive_sync >> "$LOG_FILE" 2>&1

# Enrich
node pipeline/cli/run.js store_enrich >> "$LOG_FILE" 2>&1

# Derive
node pipeline/cli/run.js derive_all >> "$LOG_FILE" 2>&1

# Morning digest (full runs only)
if [ "$RUN_TYPE" = "full" ]; then
  node pipeline/cli/run.js morning_digest >> "$LOG_FILE" 2>&1
fi

echo "=== Complete: $RUN_TYPE at $(date -u +%Y-%m-%d_%H-%M) ===" >> "$LOG_FILE"

# Clean logs older than 14 days
find "$LOG_DIR" -name "pipeline_*.log" -mtime +14 -delete 2>/dev/null
```

Create `pipeline/cli/install_schedule.sh`:
```bash
#!/bin/bash
# Install cron schedule for Memento pipeline
# 21 runs/day: hourly 6:45am-midnight Dubai + 3 overnight + 1 digest at 6am Dubai

MEMENTO_DIR="/Volumes/BackBone/Coding/Memento"
SCRIPT="$MEMENTO_DIR/pipeline/cli/scheduled_run.sh"

# Build crontab entries
CRON_ENTRIES=""

# Hourly daytime runs (sync only): 02:45-20:00 UTC
for HOUR in 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19; do
  CRON_ENTRIES="$CRON_ENTRIES\n45 $HOUR * * * $SCRIPT sync"
done
CRON_ENTRIES="$CRON_ENTRIES\n0 20 * * * $SCRIPT sync"

# Overnight runs (sync only): 22:00, 00:00 UTC
CRON_ENTRIES="$CRON_ENTRIES\n0 22 * * * $SCRIPT sync"
CRON_ENTRIES="$CRON_ENTRIES\n0 0 * * * $SCRIPT sync"

# Morning digest run (full): 02:00 UTC = 6am Dubai
CRON_ENTRIES="$CRON_ENTRIES\n0 2 * * * $SCRIPT full"

# Install (preserve existing non-Memento crontab entries)
(crontab -l 2>/dev/null | grep -v "$SCRIPT"; echo -e "$CRON_ENTRIES") | crontab -

echo "Cron schedule installed (21 runs/day). Verify with: crontab -l"
```

**Do not run install_schedule.sh automatically.** Create it and report back. Viktor installs it manually.

### 2. Auth resilience

**Required behavior per sync step:**
- Catch auth failures per account (gws exits non-zero, or returns 401/error JSON)
- Log: which account, which source, exact error message
- Skip that account's sync, continue with all other accounts and sources
- Record the failure in sync state for the morning digest to surface

**Failure tracking:**

Update sync_log files to include a `failures` array:
```json
{
  "last_run": "ISO8601",
  "last_sync": { "gws-ca": "ISO8601", ... },
  "failures": [
    {
      "timestamp": "ISO8601",
      "source": "gmail",
      "account": "gws-eterno",
      "error": "RAPT token expired — reauth related error (invalid_rapt)",
      "action": "skipped"
    }
  ]
}
```

Failures accumulate between digests. The morning digest reads and reports them, then clears the array.

**RAPT investigation:**

Research the root cause:
- Read: https://support.google.com/a/answer/9368756
- Check if Viktor's Google Workspace admin console has a session duration policy that can be extended
- Check if a service account with domain-wide delegation would bypass RAPT
- Check if different OAuth scopes or grant types produce longer-lived tokens
- Check if storing the refresh token differently (e.g., offline access scope) helps

Report findings with:
- Root cause explanation
- Available fixes (ranked by effort and reliability)
- Recommendation
- Any changes that require Viktor's admin access

Do not implement a fix without Anton reviewing the recommendation first.

### 3. Morning digest

**Pipeline step 7.** Currently a stub. Implement it.

**Trigger:** only on the 02:00 UTC (6am Dubai) run, when `scheduled_run.sh full` is called.

**Output:** `state/derived/morning_digest.json`

**Schema:**
```json
{
  "generated_at": "ISO8601",
  "digest_window": {
    "from": "ISO8601 — previous digest generated_at, or 24h ago if first run",
    "to": "ISO8601 — now"
  },
  "pipeline_health": {
    "runs_since_last_digest": 0,
    "sync_totals": {
      "gmail": { "new_captures": 0, "errors": 0 },
      "basecamp": { "new_captures": 0, "errors": 0 },
      "calendar": { "new_captures": 0, "errors": 0 },
      "drive": { "new_captures": 0, "errors": 0 }
    },
    "auth_failures": [
      {
        "timestamp": "ISO8601",
        "account": "string",
        "source": "string",
        "error": "string",
        "re_auth_command": "GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/{account}/ gws auth login"
      }
    ],
    "store_enrich_totals": {
      "entries_created": 0,
      "entries_skipped": 0,
      "unlinked_captures": 0
    }
  },
  "new_journal_entries": [
    {
      "project_id": "string",
      "entry_id": "string",
      "timestamp": "ISO8601",
      "source": "string",
      "entry_type": "string",
      "title": "string",
      "summary": "string",
      "actors": ["string"]
    }
  ],
  "open_threads": [
    {
      "project_id": "string",
      "thread_key": "string",
      "signal_type": "string",
      "counterparty": "string",
      "age_days": 0,
      "opened_by_title": "string"
    }
  ],
  "todays_calendar": [
    {
      "title": "string",
      "start": "ISO8601",
      "end": "ISO8601",
      "location": "string | null",
      "attendees": ["string"],
      "project_id": "string | null"
    }
  ],
  "fact_changes": [
    {
      "project_id": "string",
      "fact_key": "string",
      "previous_value": "string | null",
      "current_value": "string",
      "changed_by_entry_id": "string"
    }
  ]
}
```

**Section details:**

**pipeline_health** — aggregated across all runs since last digest. How many runs happened, what got captured, what failed. Auth failures include paste-ready re-auth commands. This is the first thing Claudia checks: is the pipeline healthy?

**new_journal_entries** — evidence that landed since last digest, across all projects. Sorted by timestamp descending (newest first). Claudia reads this to know "what happened overnight."

**open_threads** — all open threads across all active projects, with age in days. Sorted by age descending (oldest first — the things waiting longest surface first). Claudia reads this to know "what's waiting."

**todays_calendar** — events for today in Dubai timezone (UTC+4). Read from latest calendar captures, not from journal entries. Filter: events where start date = today (Dubai). Sort by start time. Include project_id if the event is linked. Claudia reads this to know "what's today."

**fact_changes** — facts that changed since last digest. Compare current derived facts against a snapshot saved at last digest generation. Store snapshot at `state/derived/morning_digest_fact_snapshot.json`. On first run with no prior snapshot, skip this section.

**Implementation flow:**
1. Read prior digest's `generated_at` to determine the window
2. Scan run_history.json for all runs in the window — aggregate sync totals and failures
3. Scan journals for entries with `recorded_at` within the window
4. Run thread derivation for all active projects
5. Read calendar captures for today's events
6. Compare current facts against fact snapshot
7. Write the digest
8. Write the new fact snapshot
9. Clear accumulated failures from sync_logs

### 4. Pipeline run tracking

Create `state/logs/run_history.json`:
```json
{
  "runs": [
    {
      "timestamp": "ISO8601",
      "type": "full | sync",
      "triggered_by": "scheduled | manual",
      "duration_seconds": 0,
      "results": {
        "gmail": { "captures": 0, "new": 0, "errors": 0 },
        "basecamp": { "captures": 0, "new": 0, "errors": 0 },
        "calendar": { "captures": 0, "new": 0, "errors": 0 },
        "drive": { "captures": 0, "new": 0, "errors": 0 },
        "store_enrich": { "entries_created": 0, "skipped": 0 },
        "derivations": "ok | error",
        "morning_digest": "ok | skipped | error"
      },
      "auth_failures": []
    }
  ]
}
```

Append after every pipeline run. Keep last 100 entries. The morning digest reads this for its pipeline_health section.

### 5. CLI updates

Update `pipeline/cli/run.js`:
- `node pipeline/cli/run.js morning_digest` — generate digest on demand (regardless of schedule)
- `node pipeline/cli/run.js status` — print last run summary from run_history.json: timestamp, type, captures per source, entries created, any failures. One-screen output.
- All runs append to run_history.json with `triggered_by: "manual"` for CLI runs

### 6. Incremental sync validation

Run the pipeline 3 times manually with at least 1 hour between runs. After each run, record:

| Run | Gmail captures (new/total) | Calendar (new/total) | Drive (new/total) | Basecamp (new/total) | Journal entries created | Unlinked | Auth failures |
|-----|---------------------------|---------------------|-------------------|---------------------|----------------------|----------|--------------|
| 1   |                           |                     |                   |                     |                      |          |              |
| 2   |                           |                     |                   |                     |                      |          |              |
| 3   |                           |                     |                   |                     |                      |          |              |

Expected: runs 2 and 3 should show zero new captures and zero new journal entries if nothing changed upstream. If upstream data did change between runs, new captures should appear and ingest identity should correctly evaluate them.

### 7. Unlinked capture observation

After the validation runs, scan the unlinked capture pool and categorize:

```json
{
  "observed_at": "ISO8601",
  "total_unlinked": 0,
  "categories": [
    {
      "pattern": "string — e.g. 'newsletter subscriptions', 'Google Workspace notifications'",
      "count": 0,
      "examples": ["capture_id_1", "capture_id_2"],
      "recommendation": "string — 'future ignore list candidate' | 'may link to project' | 'review individually'"
    }
  ]
}
```

Write to `state/derived/unlinked_observation.json`. This is a one-time analysis, not an automated step. It informs a future ignore list but does not implement filtering.

---

## Acceptance Criteria

1. Pipeline runs on schedule (21 runs/day) — cron scripts created, log rotation works, morning digest only on 02:00 UTC run
2. Auth failures handled gracefully — logged, skipped, surfaced in digest with paste-ready re-auth commands
3. Incremental sync correct across 3+ consecutive runs — zero duplicates, no missed data, ingest idempotency holds
4. Morning digest generated at 6am Dubai — all 5 sections present, readable by Claudia in conversation
5. PUNKS and Lucas Zanotto operable through conversation using Memento data
6. No contract violations during live operation — append-only journals, derived-only facts/threads, no task creep
7. Unlinked capture patterns documented after observation
8. CLI status command works
9. Run history tracks pipeline reliability

## What Not To Do

- Do not build dashboard or UI
- Do not implement contact identity resolution beyond email merge
- Do not create new contracts
- Do not implement email filtering or ignore lists (observe only)
- Do not install the cron schedule — create the scripts, Viktor installs manually
- Do not fix RAPT token behavior without Anton reviewing the recommendation first

## Push Back If

- Morning digest schema is missing something Claudia would need at session start — flag it
- Incremental sync reveals edge cases the contracts don't cover — flag the specific case
- RAPT investigation reveals admin changes Viktor needs to make — flag with exact steps
- 21 runs/day creates unexpected issues (file system, API rate limits, log volume) — flag immediately

## Report Back

When done, report:
- What was delivered
- RAPT investigation findings (root cause, available fixes, recommendation)
- Incremental sync validation table (3 runs)
- One real morning digest output (from a live run)
- Unlinked capture observation summary
- Pushback items or gaps found
- Decisions made that weren't specified
- Confirmation that acceptance criteria 1-9 all pass
