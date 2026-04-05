# Operator Handoff

Use this artifact when primary ownership moves from one operator lane to another.
This is for handoff, not lightweight review.

## From / To
- From: Claudia (COO)
- To: Jonah (VP Engineering)

## Reason for handoff
Phase 5 Steps 7 and 8 investigation is complete. Claudia produced both deliverables (unlinked observation and RAPT recommendation). The findings reveal concrete linking gaps that need engineering implementation. This is bounded execution work against known problems, which is Jonah's lane.

## Task statement
Fix project linking gaps and register new project sources. Three implementation tasks, one registry update, one new project registration.

### Task 1 — Recursive Drive folder matching

**Problem:** The linker (`pipeline/lib/project_linking/linker.js`) does exact `folder_id` equality only. 78 Drive captures sit 1-2 levels below registered root folders and don't link.

**Root cause:** `checkDirectIdMatch` (Tier 1, line 108-112) checks `payload.folder_id || payload._parent_folder_id` against `drive_folder_ids`. `checkRefMatch` (Tier 2, line 144-148) checks `_parent_folder_id` against `drive_folder_ids`. Neither walks up the folder ancestry tree.

**Fix shape:** Add recursive folder ancestry traversal. When a capture's folder_id doesn't match directly, walk up through parent folders (using Drive captures already in `state/captures/drive/` as a local folder tree) until either a registered folder_id is found or the root is reached.

**Additional finding:** The observation notes that direct-child folder records (LUCAS_ZANOTTO_PRODUCTION and PUNKS_PRODUCTION) have `_parent_folder_id` set to the registered root but still don't match Tier 2. Investigate whether there's a field-mapping inconsistency for `folder_metadata` captures vs `file_metadata` captures — `_parent_folder_id` might not be populated consistently.

**Acceptance criteria:**
- All 78 currently unlinked Drive files link to their correct project
- The 2 direct-child production folders link via Tier 2
- No regression on the 27 already-linked captures
- Linker does not make external API calls — uses local capture data only

**Data:**
- Linker: `pipeline/lib/project_linking/linker.js`
- Drive captures: `state/captures/drive/`
- Observation with examples: `state/derived/unlinked_observation.json` (Drive categories)
- PUNKS root folder: `1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW`
- LZ root folder: `1lk0NpoiJFIeIxsyrOqYMvyG0FQrqa0Fw`

### Task 2 — Gmail thread prefix expansion

**Problem:** The linker's Tier 2 `gmail_thread_prefix` check misses several known project email patterns.

**Fix:** Add the following to `registry.json` source_refs for each project:

For `punks-2026`, add to `gmail_thread_prefixes`:
- `EE_PJ_2026_EXBH_PUNKS_PT` (Basecamp project code format used in email subjects)
- `invite to exhibit in Lisbon` (artist outreach subject line)
- `Exhibition in Lisbon` (artist outreach variant)
- `Eterno x` (artist meeting confirmation pattern — NOTE: this is broad and may match LZ meetings too. Consider whether this should be an alias instead.)

For `lucas-zanotto-2026`, add to `gmail_thread_prefixes`:
- `EE_PJ_2026_EXBH_LUCAS_ZANOTTO_PT` (Basecamp project code format)

**Acceptance criteria:**
- The 13 PUNKS artist outreach emails link to punks-2026
- The 7 Basecamp project code emails link to correct projects
- No false positives on the `Eterno x` pattern (verify against LZ meetings before adding)
- Run store_enrich and verify linking numbers improve

**Data:**
- Registry: `state/registry.json`
- Observation with example IDs: `state/derived/unlinked_observation.json` (Gmail categories)

### Task 3 — Suppress calendar invitation emails from Gmail ingestion

**Problem:** 52 Gmail captures are Google Calendar invitation notification emails (subjects starting with "Invitation:", "Updated invitation:", "Accepted:", "Declined:", "Proposed new time:"). The corresponding calendar events are already captured by the calendar pipeline. These are pure duplicates.

**Fix shape:** Add a pre-filter in the Gmail sync step (`pipeline/steps/gmail_sync.js`) that skips emails matching calendar invitation subject patterns. Alternatively, filter at the store_enrich stage. The simpler approach that prevents unnecessary capture writes is preferred.

**Acceptance criteria:**
- Calendar invitation emails are no longer written as new captures
- Existing calendar invitation captures are not deleted (data integrity rule — no deletes without Viktor's approval)
- Calendar pipeline continues to capture the events themselves normally

**Data:**
- Gmail sync: `pipeline/steps/gmail_sync.js`
- Store enrich: `pipeline/steps/store_enrich.js`
- Observation: `state/derived/unlinked_observation.json` ("Calendar invitation emails" category, 52 captures)

### Task 4 — Register Mystery Box as a project

**Problem:** 55 email captures about "Mystery Box — High-Ticket Allocation Results" and Vhils Layers Collection customer threads are unlinked because no project exists for Mystery Box.

**Fix:** Add a new project entry to `registry.json`:

```json
{
  "project_id": "mystery-box-vhils",
  "name": "Mystery Box — Vhils Layers Collection",
  "type": "exhibition",
  "status": "active",
  "aliases": ["Mystery Box", "Vhils Layers", "VHILS"],
  "source_refs": {
    "basecamp_ids": [],
    "basecamp_project_codes": [],
    "calendar_ids": [],
    "drive_folder_ids": [],
    "gmail_thread_prefixes": ["Mystery Box"],
    "primavera_code": null
  }
}
```

**NOTE for Jonah:** Viktor clarified that "Vhils" is a category (a parent grouping that may contain multiple projects), not a single project. Mystery Box is one project under Vhils. Do NOT create a catch-all "Vhils" project. The registry entry should be scoped to Mystery Box specifically. Future Vhils projects get their own entries.

**Acceptance criteria:**
- Mystery Box captures link to mystery-box-vhils
- No other unrelated captures get pulled in by the aliases

### Task 5 — Register SOP document as a Drive source

**Problem:** The canonical exhibition SOP (`Eterno_EXB_SOP`, last edited 2026-03-26) lives in Viktor's personal Google Drive, not in the registered project folders. The pipeline doesn't capture it.

**Fix:** The SOP is a cross-project resource (it applies to all exhibitions), not owned by one project. Options:
1. Add the personal Drive "Eterno" folder (`17EqnW1XhjnYUQcF8RDsLbXYR5L1MIApv`) as a shared/global Drive source — requires a mechanism for non-project Drive sources
2. Add the SOP document ID (`1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI`) to both projects' drive_folder_ids (it's a doc not a folder, so this may need linker support)
3. Add the Eterno folder ID to both projects' drive_folder_ids

**Decision needed from Anton:** The registry and drive_sync currently only scope to project-level folder_ids. A cross-project document doesn't fit cleanly. Anton should decide whether to:
- Add a `shared_sources` field to registry.json for cross-project resources
- Or duplicate the folder reference across both projects
- Or another approach

**SOP details:**
- File: `Eterno_EXB_SOP` (Google Doc)
- ID: `1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI`
- Parent folder: `Eterno` (`17EqnW1XhjnYUQcF8RDsLbXYR5L1MIApv`)
- Account: gws-personal (viktor.so.lost@gmail.com)
- Last modified: 2026-03-26

## Current status
- Phase 5 Steps 1-6: complete and validated
- Step 7 (unlinked observation): complete, output at `state/derived/unlinked_observation.json`
- Step 8 (RAPT recommendation): complete, output at `plan/rapt-recommendation.md`
- RAPT fix: separate from this handoff. Requires Viktor to re-auth gws accounts and/or get Workspace admin access. Not Jonah's scope.

## Relevant context already loaded
- `memory.md`: data integrity rules (never delete, never full-replace), engineering process (Jonah delegates to Sonnet subagents)
- `recent-context.md`: Phase 5 validation complete, pipeline operational
- Other files:
  - `state/derived/unlinked_observation.json` — full categorized observation with example capture IDs
  - `plan/rapt-recommendation.md` — RAPT recommendation (not in scope for Jonah)
  - `pipeline/lib/project_linking/linker.js` — the linker code
  - `pipeline/steps/gmail_sync.js` — Gmail sync step
  - `pipeline/steps/store_enrich.js` — store enrichment step
  - `state/registry.json` — project registry
  - `docs/contracts/project-linking.md` — project linking contract

## Decisions already made
- Mystery Box is a project, gets its own registry entry
- Vhils is a category/parent grouping, NOT a project — do not create a Vhils catch-all
- 0009.eth is an exhibition project (not in this handoff scope — can be registered later when it has more sources)
- The canonical SOP is `Eterno_EXB_SOP` (ID: 1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI), not the older `Eterno_SOP` or the .docx export
- 218 captures are genuinely irrelevant — no action needed on them
- 93 ambiguous captures (e-commerce, contact forms, general ops) are not in scope for this handoff

## Open questions / unresolved risks
- The `Eterno x` gmail prefix is broad — could match both PUNKS and LZ artist meetings. Jonah should verify before adding.
- The `_parent_folder_id` field mapping may be inconsistent between folder_metadata and file_metadata captures — Task 1 should investigate this.
- Task 5 (SOP registration) needs Anton's input on cross-project resource architecture. Jonah should not invent a new registry schema without Anton's sign-off.

## Anton's Technical Review (2026-03-29)

### Verdict: Approved with notes. All 5 tasks are correctly scoped.

### Sequencing (binding)
Jonah must execute in this order:
1. **Task 1 first.** The Tier 2 `_parent_folder_id` bug investigation may reveal a field-mapping inconsistency that affects how other tiers interact with Drive captures. Do not parallelize Tasks 2-4 until Task 1 is understood and fixed.
2. **Tasks 2, 3, 4** can run in parallel after Task 1 is done.
3. **Task 5 last.** Requires Anton's architecture decision (see below).

### Task 1 — Drive recursive matching
Approved. The real first step is investigating why Tier 2 (linker.js line 144-148) fails on direct-child folders (LUCAS_ZANOTTO_PRODUCTION and PUNKS_PRODUCTION) where `_parent_folder_id` IS the registered root folder ID. If Tier 2 is already broken for direct children, the recursive ancestor fix needs to understand why before building on top of it. Investigate the field-mapping inconsistency between `folder_metadata` and `file_metadata` captures first.

### Task 2 — Gmail thread prefix expansion
Approved with caution. The Basecamp project codes (`EE_PJ_2026_EXBH_PUNKS_PT`, `EE_PJ_2026_EXBH_LUCAS_ZANOTTO_PT`) and artist outreach patterns (`invite to exhibit in Lisbon`, `Exhibition in Lisbon`) are safe to add as `gmail_thread_prefixes`. Do NOT add `Eterno x` as a prefix — it is too broad and would match across both projects. If Jonah wants to link `Eterno x [Artist]` emails, use Tier 3 alias matching with artist-specific aliases instead.

### Task 3 — Calendar invite suppression
Approved. Filter at `gmail_sync.js` before writing captures, not at store_enrich. This prevents writing noise rather than cleaning it up after the fact. Existing calendar invitation captures stay (data integrity rule — no deletes).

### Task 4 — Mystery Box registration
Approved as scoped. Vhils is a category/parent grouping, NOT a project. Mystery Box gets its own registry entry. Do not create a Vhils catch-all.

### Task 5 — SOP cross-project resource
Correctly routed to Anton. The registry currently has no concept of shared/cross-project resources. Duplicating the folder ID across both projects is the wrong move because it lies about ownership. Anton's preliminary direction: add a `shared_sources` field to registry.json for cross-project resources. Anton will write the schema addendum when Jonah is ready for Task 5. Jonah should not invent a registry schema change without that addendum.

## Next-step routing
- Task 1: Jonah executes first (investigate Tier 2 bug, then implement recursive matching)
- Tasks 2-4: Jonah executes in parallel after Task 1 is validated
- Task 5: Jonah writes a proposal, routes to Anton for architecture decision, then implements
- After implementation: run pipeline, re-derive unlinked observation, verify numbers improve
- Report back to Claudia with results

## Expected output from receiver
1. Tasks 1-4 implemented, tested, committed
2. Pipeline re-run with updated linking
3. Updated unlinked count (should drop from 480 to roughly 300-350)
4. Task 5 proposal sent to Anton
5. Brief report back with results and any issues found

## Approval status
- Viktor approval required: no (for Tasks 1-4, these are approved implementation of reviewed findings)
- Viktor approval received: yes (Viktor reviewed the observation and confirmed Mystery Box as project, Vhils as category)
- Notes: Task 5 needs Anton approval on architecture, not Viktor

## Constraints / non-goals
- Do not delete any existing captures (data integrity rule)
- Do not modify contracts
- Do not start Phase 4 (dashboard) work
- Do not implement RAPT fix (separate workstream, requires Viktor's admin access)
- Do not register 0009.eth as a project yet (out of scope)
- Do not create a Vhils catch-all project
- Do not touch the 218 irrelevant or 93 ambiguous captures
