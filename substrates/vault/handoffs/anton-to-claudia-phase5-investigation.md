# Operator Handoff

Use this artifact when primary ownership moves from one operator lane to another.
This is for handoff, not lightweight review.

## From / To
- From: Anton (CTO)
- To: Claudia (COO)

## Reason for handoff
Phase 5 pipeline validation is complete (Steps 1-6 done). The two remaining steps (7 and 8) are investigation and documentation deliverables, not technical architecture. Claudia is better positioned to drive these because they require data analysis and research, not system design decisions.

## Task statement
Complete Memento Phase 5 Steps 7 and 8, then report back findings for Viktor's review.

### Step 7 — Unlinked Capture Observation

480 of 507 total captures are not linked to any project. The job is to categorize them and produce a recommendation.

Required output: `~/VIK/Coding/Memento/state/derived/unlinked_observation.json`

Required content:
- Categorize unlinked captures by source and pattern (what kind of emails, calendar events, drive files are not linking?)
- Include counts per category
- Include 2-3 example capture IDs per category
- Include a recommendation on what to ignore vs what indicates a linking gap
- Do NOT implement any filtering or ignore-list. Observation only.

Data locations:
- All captures: `state/captures/{basecamp,calendar,drive,gmail}/`
- Project registry: `state/registry.json` (2 active projects: punks-2026, lucas-zanotto-2026)
- Store enrich logic: `pipeline/steps/store_enrich.js` (this is where linking happens)
- Project linking: `pipeline/lib/project_linking/linker.js`

Capture counts by source:
- Gmail: 403 (largest pool of unlinked)
- Drive: 80
- Calendar: 23
- Basecamp: 1
- Total: 507, of which 27 are linked and ingested, 480 unlinked

### Step 8 — RAPT Recommendation

All 4 gws accounts (gws-personal, gws-ca, gws-eterno, gws-info) experience token expiry every ~24 hours. This breaks overnight pipeline runs. The task is to research root cause and produce a decision-ready recommendation.

Required output: a markdown file at `~/VIK/Coding/Memento/plan/rapt-recommendation.md`

Required content:
- Root cause explanation (RAPT = Re-authentication Policy for Tokens, Google Workspace session control)
- Available fixes ranked by reliability and effort:
  - Service account with domain-wide delegation
  - Offline access scope
  - Google Workspace admin session policy change
  - Refresh token with extended lifetime
  - Any other viable approach
- For each fix: clearly state whether it requires Viktor's Google Workspace admin access or is code-only
- Recommend the best path
- Do NOT implement any fix. Recommendation only.

Context:
- gws CLI binary: `/opt/homebrew/bin/gws`
- gws client wrapper: `pipeline/lib/gws_client.js`
- Account switching: `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` env var (NOT --config-dir flag)
- Current auth method: OAuth2 with refresh tokens stored in `~/.config/gws-{account}/`
- The pipeline already handles auth failures gracefully (records them, continues with other sources)

## Current status
- Phase 5 Steps 1-6: validated live. Pipeline is fully operational.
- Two clean full runs completed back-to-back on 2026-03-29 with zero errors, zero new captures, zero auth failures. Idempotency confirmed.
- Step 7: not started
- Step 8: not started

## Relevant context already loaded
- `memory.md`: gws CLI correct usage (env var, not flag), data integrity rules, engineering process
- `recent-context.md`: Phase 5 restart approved, Steps 2-5 real, Step 6 validation now complete
- Other files:
  - `plan/phase-5-restart-anton.md` — authoritative Phase 5 execution plan
  - `plan/memento-technical-plan.md` — overall Memento architecture
  - `docs/contracts/` — 8 contract definitions

## Decisions already made
- Phase 5 Steps 1-6 are complete. Not reopening.
- Steps 7 and 8 are documentation deliverables, not code changes.
- No filtering or ignore-list implementation until after observation review.
- No RAPT fix implementation until after recommendation review.
- Dashboard (Phase 4) remains deferred.

## Open questions / unresolved risks
- The 480 unlinked captures may include a mix of genuinely irrelevant data (personal emails, unrelated calendar events) and captures that should be linking but are not. The observation needs to distinguish these.
- RAPT behavior may differ across the 4 accounts (personal Gmail vs Workspace accounts). Investigation should note any differences.

## Expected output from receiver
1. `state/derived/unlinked_observation.json` — categorized observation with recommendation
2. `plan/rapt-recommendation.md` — decision-ready recommendation with admin vs code-only classification
3. Brief report back to Viktor with findings and proposed next steps

## Approval status
- Viktor approval required: yes (for acting on either recommendation)
- Viktor approval received: no (this handoff is for investigation, not action)
- Notes: Viktor requested this handoff explicitly

## Next-step routing
Once Claudia delivers both artifacts and Viktor reviews:
- Any implementation work (ignore-list, RAPT fix, pipeline changes) routes to Jonah as a bounded execution task.
- Anton reviews the technical shape before Jonah starts if the fix touches auth architecture or linking logic.
- Claudia does not implement. She investigates, writes the recommendation, and hands off.

## Constraints / non-goals
- Do not implement filtering, ignore-lists, or RAPT fixes
- Do not modify pipeline code
- Do not modify contracts or registry
- Do not start Phase 4 (dashboard) work
- Do not expand contact identity resolution
