# Phase 2 Handoff — Anton to Jonah

## Operator
You are Jonah, VP Engineering for VIK OS. You run implementation delivery under Anton's technical direction.

## Project
Memento — store-first project journal system. Repo: `/Volumes/BackBone/Coding/Memento`

## Context
Phase 1 is complete and reviewed. The foundation scaffold, IO layers, and seed data are in place. Phase 2 builds the pipeline skeleton: CLI entrypoints, shared clients, sync steps that talk to real APIs, the project linking library, capture writers, and the store enrichment step.

## What To Read First

1. `plan/memento-technical-plan.md` — Pipeline Steps section (lines ~414-453)
2. All 8 contracts in `docs/contracts/` — you already know these from Phase 1
3. `pipeline/lib/journal_io.js`, `pipeline/lib/ingest_identity.js`, `pipeline/lib/capture_io.js` — your Phase 1 code that Phase 2 builds on
4. `state/registry.json` — the sample registry with PUNKS and Lucas Zanotto

## Reference Material From v3b

v3b has working sync code in Python. Memento is in JavaScript (Node.js, no frameworks). Reuse the patterns, not the code.

### Auth Patterns

**Basecamp OAuth:**
- Credentials: `~/.env.basecamp` (BASECAMP_CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
- Tokens: `~/.env.basecamp.tokens` (ACCESS_TOKEN, REFRESH_TOKEN, TOKEN_EXPIRES as epoch seconds)
- Token refresh: POST `https://launchpad.37signals.com/authorization/token` with type=refresh
- Refresh buffer: 3600s before expiry
- API base: `https://3.basecampapi.com/3378703`
- Auth header: `Authorization: Bearer {token}`
- Person ID: 48400899
- Request pause: 0.2s between requests

**Gmail, Calendar, Drive — gws CLI:**
- CLI tool: `gws` (Google Workspace CLI)
- Invoked via subprocess with JSON params
- Account configs in `~/.config/gws-{profile}/`
- Switch account: set env `GOOGLE_WORKSPACE_CLI_CONFIG_DIR`
- 4 Gmail accounts: gws-ca, gws-eterno, gws-info, gws-personal
- Calendar uses: gws-personal
- Drive uses: gws-personal
- Full CLI reference: `/Volumes/BackBone/Coding/vault-pipeline-v3b/docs/gws-cli-reference.md`

### Key API Patterns From v3b

**Basecamp endpoints:**
- `GET /projects.json` — list projects
- `GET /buckets/{project_id}/message_boards/{board_id}/messages.json` — messages
- `GET /buckets/{project_id}/todosets/{todoset_id}/todolists.json` — todolists
- `GET /buckets/{project_id}/todolists/{list_id}/todos.json` — todos
- `GET /buckets/{project_id}/recordings/{recording_id}/comments.json` — comments
- Pagination via Link header (`_fetch_all_pages` pattern)

**Gmail via gws:**
- `gws gmail users messages list --params '{"userId":"me","maxResults":100,"q":"after:YYYY/MM/DD in:inbox"}'`
- `gws gmail users messages get --params '{"userId":"me","id":"msg_id","format":"full"}'`

**Calendar via gws:**
- `gws calendar events list --params '{"calendarId":"...","timeMin":"...","timeMax":"...","singleEvents":true,"orderBy":"startTime","maxResults":250}'`
- Allowed calendar IDs: viktor.so.lost@gmail.com, viktor@cultural-affairs.com, viktor@eternogallery.com

**Drive via gws:**
- `gws drive files list --params '{"q":"'\''folder_id'\'' in parents","fields":"files(id,name,mimeType,modifiedTime,createdTime)","pageSize":100}'`
- For shared drives: add `corpora: "allDrives"`, `includeItemsFromAllDrives: true`, `supportsAllDrives: true`
- Exhibition roots 2026: `1YeKG4ry1N6jH42nLFzlFTOlgXDPiJ-4s`, 2025: `1yDOVMtLeWLLtcleAYQo1iRbgMn1bZAE6`

## Deliverables

### 1. Package setup
Create `package.json` in repo root. Node.js, no heavy frameworks. Only add dependencies you actually need (e.g., `node-fetch` if Node version doesn't have global fetch, `dotenv` for env loading). Prefer standard library.

### 2. Shared clients in `pipeline/lib/`

**basecamp_client.js:**
- Load credentials from `~/.env.basecamp` and `~/.env.basecamp.tokens`
- Auto-refresh expired tokens
- `listProjects()` — fetch all active projects
- `fetchMessages(projectId)` — fetch messages from a project's message board
- `fetchTodos(projectId)` — fetch todos from a project's todolists
- `fetchComments(recordingId, projectId)` — fetch comments on a recording
- Handle pagination (Link header)
- Request pause between calls (0.2s default)
- Return raw API responses — normalization happens in the sync step

**gws_client.js:**
- Wrapper for gws CLI subprocess calls
- `gws(service, resource, method, params, configDir)` — execute a gws command, parse JSON output
- `withAccount(configDir, fn)` — set GOOGLE_WORKSPACE_CLI_CONFIG_DIR, run fn, restore
- Error handling: check exit code, parse stderr

**gmail_client.js:**
- Uses gws_client
- `fetchMessages(account, sinceDate, maxResults)` — list + get messages for one account
- `fetchAllAccounts(sinceDate)` — fetch from all 4 accounts
- Per-message fetch (not thread-level, per capture layer contract)
- Return raw message data for normalization in sync step

**calendar_client.js:**
- Uses gws_client
- `fetchEvents(calendarId, timeMin, timeMax)` — list events
- `fetchAllCalendars(lookbackDays, lookaheadDays)` — fetch from all 3 allowed calendars
- Return raw event data

**drive_client.js:**
- Uses gws_client
- `listFiles(folderId, shared)` — list files in a folder
- `crawlFolder(folderId, depth)` — recursive folder crawl (max 2 levels)
- Return raw file metadata

### 3. Project linking library in `pipeline/lib/project_linking/`

**linker.js:**
- `linkCapture(capture, registry)` — takes a capture record and the registry, returns a linking decision
- Implements the 5-tier evaluation from the project-linking contract:
  1. Direct registered ID match (source_refs)
  2. Direct known URL/folder/calendar/thread ref match
  3. Alias + participant match
  4. Weak inference
  5. Unresolved (unlinked)
- Returns: `{ linked_project_id, mode, basis, candidates_considered, flagged_for_review }`
- Reads registry for project_ids, source_refs, aliases
- Does not read journals (linking is based on capture + registry only)

### 4. Sync steps in `pipeline/steps/`

Each sync step follows this pattern:
- Read registry to know which projects are active and what source_refs to look for
- Fetch from upstream API via shared client
- Normalize each artifact into a capture record (per capture-record schema)
- Write captures via `capture_io.writeCapture()`
- Return a result summary (items fetched, captures written, errors)

**basecamp_sync.js:**
- For each active project in registry with `basecamp_ids`, fetch messages, todos, comments
- Normalize each artifact into a capture record with:
  - `source: "basecamp"`
  - `observation_kind`: `message`, `todo`, `comment`, `project_discovery`
  - `capture_id`: deterministic from source + artifact ID + kind
  - `capture_hash`: from normalized payload
  - `candidate_project_links`: direct match via basecamp_ids
- Write to `state/captures/basecamp/`

**gmail_sync.js:**
- For each Gmail account, fetch messages since last sync
- Maintain a sync log at `state/sync_log/gmail.json` tracking last sync time per account
- Normalize each message (not thread) into a capture record with:
  - `source: "gmail"`
  - `observation_kind: "message"`
  - `capture_id`: deterministic from account + message_id
  - `candidate_project_links`: match via gmail_thread_prefixes from registry
- Write to `state/captures/gmail/`

**calendar_sync.js:**
- Fetch events from all 3 allowed calendars, lookback 7 days, lookahead 14 days
- Deduplicate by iCalUID (same event on multiple calendars)
- Normalize each event into a capture record with:
  - `source: "calendar"`
  - `observation_kind: "event"` or `"event_cancelled"`
  - `capture_id`: deterministic from iCalUID or event_id
  - `candidate_project_links`: match via calendar_ids or alias matching on event title
- Write to `state/captures/calendar/`

**drive_sync.js:**
- For each active project with `drive_folder_ids`, crawl linked folders (2 levels deep)
- Normalize each file into a capture record with:
  - `source: "drive"`
  - `observation_kind: "file_metadata"` or `"folder_metadata"`
  - `capture_id`: deterministic from file_id
  - `candidate_project_links`: direct match via drive_folder_ids
- Write to `state/captures/drive/`

**meeting_extract.js:**
- STUB ONLY for Phase 2. Create the file with a run function that logs "meeting_extract: not implemented, requires extraction logic" and returns empty result.
- Hard rule: extraction creates derived captures, not direct journal mutation. The stub must not write to state/store/.

### 5. Store enrichment step in `pipeline/steps/`

**store_enrich.js:**
This is the critical step that reads captures and writes journal entries. It must follow the ingest-identity and changed-artifact-materiality contracts exactly.

For each active project in registry:
1. Scan `state/captures/` for captures linked to this project (via candidate_project_links)
2. For each capture:
   a. Run project linking (`linker.linkCapture`) to confirm/upgrade the link
   b. Compute ingest key (`ingest_identity.computeIngestKey`)
   c. Check if already ingested (`journal_io.hasIngestKey`)
   d. If already ingested — skip
   e. If new capture — create journal entry, append via `journal_io.appendEntry`, record ingest key
   f. If changed capture (same source+ref+kind, different hash) — evaluate materiality:
      - Read prior capture version via `capture_io.readCaptureVersions`
      - Compare normalized payloads
      - Apply source-specific materiality rules from the contract
      - If journal-worthy: create entry, append, record with disposition `journaled`
      - If capture-only: record with disposition `skipped_not_material`
3. Handle unlinked captures: skip journal append, leave in captures for future linking

Entry creation must:
- Generate unique entry_id
- Set recorded_at to current wall-clock time
- Set timestamp to the capture's observed_at or the upstream event time
- Include full provenance linking to capture_ids
- Include project_link from the linking decision
- Set authorship to "synced"
- Generate appropriate entry_type from observation_kind
- Generate title and summary from normalized payload
- Extract fact_claims where applicable (dates, counts, statuses from structured payloads)
- Extract thread_signals where applicable (only the 8 allowed types)

### 6. Morning digest step

**morning_digest.js:**
- STUB for Phase 2. Create the file with a run function that logs "morning_digest: not implemented" and returns empty result.
- This is a read artifact, not a truth layer. Implementation deferred.

### 7. CLI entrypoint

**pipeline/cli/run.js:**
- CLI interface for running pipeline steps
- `node pipeline/cli/run.js [step]` where step is: basecamp_sync, gmail_sync, calendar_sync, drive_sync, meeting_extract, store_enrich, morning_digest, all
- `all` runs steps 1-7 in order
- Each step: load registry, run step, log result summary
- Exit codes: 0 success, 1 errors occurred but step completed, 2 fatal failure

### 8. Sync state tracking

**state/sync_log/:**
- `gmail.json` — last sync timestamp per account (`{ "gws-ca": "ISO8601", "gws-eterno": "ISO8601", ... }`)
- `basecamp.json` — last sync timestamp
- `calendar.json` — last sync timestamp
- `drive.json` — last sync timestamp

Sync steps read these to know what's "new since last run." First run with no log file fetches a reasonable default window (30 days for Basecamp/Gmail, 7+14 for Calendar, full crawl for Drive).

## Acceptance Criteria

1. Each sync step runs independently — `node pipeline/cli/run.js basecamp_sync` works on its own
2. Capture outputs are inspectable — real captures on disk in versioned layout after a live run
3. Unlinked captures are preserved — captures that don't match any project stay in state/captures/
4. Store enrichment is rerun-safe — running `store_enrich` twice with no upstream changes produces zero new journal entries
5. Project linking uses the shared library, not ad hoc per-step logic
6. No sync step writes directly to state/store/ — only store_enrich does, via journal_io
7. Capture records conform to the capture-record schema
8. Journal entries created by store_enrich conform to the journal-entry schema contract
9. Ingest index is populated correctly — both `journaled` and `skipped_not_material` dispositions
10. CLI entrypoint works for individual steps and full pipeline run

## What Not To Do

- Do not implement meeting_extract logic (stub only)
- Do not implement morning_digest logic (stub only)
- Do not implement derived views (Phase 3)
- Do not implement dashboard (Phase 4)
- Do not build thread or fact derivation logic — store_enrich extracts signals and claims into entry fields, but the derivation read models are Phase 3
- Do not hardcode project IDs in sync steps — read from registry
- Do not carry over v3b's workspace envelope format — use Memento's capture schema
- Do not carry over v3b's Python patterns literally — translate the API interaction patterns to JavaScript, use Memento's own IO layers

## Auth Dependencies

Before running live sync steps, these must be working:
- `~/.env.basecamp` and `~/.env.basecamp.tokens` — for Basecamp API
- `~/.config/gws-ca/` — Gmail account (viktor@cultural-affairs.com)
- `~/.config/gws-eterno/` — Gmail account (viktor@eternogallery.com)
- `~/.config/gws-info/` — Gmail account (info@ephemeralethernal.com) — NOTE: may need re-auth (RAPT token expired per recent-context)
- `~/.config/gws-personal/` — Gmail, Calendar, Drive account (viktor.so.lost@gmail.com)

If any auth is broken, the sync step for that source should log the error and continue (not crash the whole pipeline).

## Push Back If

- An API pattern from v3b doesn't translate cleanly to the capture model — flag it
- The materiality rules from the contract don't cover a real edge case you hit — flag the specific case
- A sync step's capture normalization requires decisions not covered by the contracts — flag it
- Auth is broken for a source and you can't test — flag which source and continue with others

## Report Back

When done, report:
- What was delivered
- Which sync steps were tested against live APIs
- Which auth issues were encountered (if any)
- Any pushback items or contract gaps found
- Any decisions you made that weren't specified
- Confirmation that acceptance criteria 1-10 all pass
