# Phase 1 Handoff — Anton to Jonah

## Operator
You are Jonah, VP Engineering for VIK OS. You run implementation delivery under Anton's technical direction.

## Project
Memento — store-first project journal system. Repo: `/Volumes/BackBone/Coding/Memento`

## Context
Phase 0 is complete. 8 contracts are locked in `docs/contracts/`. The canonical technical plan is at `plan/memento-technical-plan.md`. These are your spec. Read them before writing any code.

## Your Task
Deliver Phase 1: Foundation Scaffold.

## What To Read First

Read these files in order before touching code:

1. `plan/memento-technical-plan.md` — the full technical plan
2. `docs/contracts/registry-ownership.md` — registry schema, single status field, creation/mutation rules
3. `docs/contracts/journal-entry-schema.md` — journal file schema, entry schema, append rules, authorship, provenance
4. `docs/contracts/capture-layer.md` — capture record schema, versioned captures (Option B), file layout, lifecycle
5. `docs/contracts/ingest-identity.md` — ingest key formula, ingest index, disposition tracking, rerun safety
6. `docs/contracts/changed-artifact-materiality.md` — materiality decision framework, source-specific rules
7. `docs/contracts/fact-derivation.md` — fact claim schema, precedence model, conflict handling
8. `docs/contracts/thread-derivation.md` — allowed signal types (8 total, exhaustive), derivation rules, manual override
9. `docs/contracts/project-linking.md` — tiered association, confidence levels, unlinked handling

## Deliverables

### 1. Repo scaffold
Create the directory structure from the plan:
```
Memento/
  dashboard/
    app/
      today/
      projects/
      contacts/
      calendar/
    components/
    lib/
    public/
  pipeline/
    cli/
    steps/
    lib/
      project_linking/
  state/
    captures/
      basecamp/
      gmail/
      calendar/
      drive/
      meeting_extract/
    store/
    registry.json
  docs/         (already exists)
    contracts/  (already exists, 8 files)
    schemas/
  plan/         (already exists)
```

### 2. Schema docs
Write the following to `docs/schemas/`:
- `registry.md` — JSON schema reference for registry.json, derived from the registry-ownership contract
- `project-journal.md` — JSON schema reference for store/{project_id}.json, derived from the journal-entry-schema contract
- `journal-entry.md` — JSON schema reference for individual journal entries, including all required fields, optional fields, fact_claims, thread_signals
- `capture-record.md` — JSON schema reference for capture records, derived from the capture-layer contract

These are reference docs for Jonah (you) and future implementers. They restate the contracts in pure schema form.

### 3. Sample registry
Create `state/registry.json` with two real project entries:
- `punks-2026` — use the example from the registry-ownership contract's "Tested Against" section
- `lucas-zanotto-2026` — use the example from the same section

Use `basecamp_ids[]` (array), not singular `basecamp_id`. Lucas Zanotto has two Basecamp projects: `46298394` (exhibition) and `46454310` (editions).

### 4. Sample capture fixtures
Create sample captures in `state/captures/` for testing:
- `state/captures/gmail/{capture_id}/{observed_at}.json` — a Zafgod artist call confirmation email (PUNKS)
- `state/captures/basecamp/{capture_id}/{observed_at}.json` — a Basecamp message from the PUNKS project
- `state/captures/calendar/{capture_id}/{observed_at}.json` — the Lucas Zanotto opening event
- `state/captures/drive/{capture_id}/{observed_at}.json` — the curatorial text file upload (Lucas Zanotto)

Each fixture must conform to the capture record schema. Use versioned directory layout (Option B): `{capture_id}/{observed_at}.json`.

### 5. Sample journal fixtures
Create sample journals in `state/store/` for testing:
- `state/store/punks-2026.json` — with 3-5 entries covering: a manual note, a synced email entry with thread_signals, a synced Basecamp entry with fact_claims. Include the ingest_index.
- `state/store/lucas-zanotto-2026.json` — with 3-5 entries covering: a manual fact entry, a synced Drive entry closing a thread, a synced calendar entry. Include the ingest_index.

Each fixture must conform to the journal and entry schemas exactly. Every entry must have full provenance. Entries with fact_claims or thread_signals must use the exact schemas from the contracts.

### 6. Append-only journal IO layer
Implement in `pipeline/lib/`:
- `journal_io.js` (or `.ts` — use JS unless the plan specifies otherwise)
  - `readJournal(projectId)` — reads `state/store/{projectId}.json`, returns the journal object
  - `appendEntry(projectId, entry)` — validates the entry against the schema, appends to entries array, updates metadata.updated_at, returns the updated journal
  - `hasIngestKey(projectId, ingestKey)` — checks the ingest index, returns the disposition if found or null
  - `recordIngestKey(projectId, ingestKey, disposition, entryId)` — adds to the ingest index
  - Enforces: no mutation of existing entries, no deletion, entry_id uniqueness, required field validation

### 7. Ingest identity helpers
Implement in `pipeline/lib/`:
- `ingest_identity.js`
  - `computeIngestKey(capture)` — takes a capture record, returns the deterministic ingest key hash
  - `computeCaptureHash(normalizedPayload)` — SHA-256 of JSON-serialized payload with sorted keys
  - `isAlreadyIngested(projectId, ingestKey)` — reads the journal's ingest index, returns disposition or null

### 8. Capture IO helpers
Implement in `pipeline/lib/`:
- `capture_io.js`
  - `writeCapture(source, captureRecord)` — writes to `state/captures/{source}/{capture_id}/{observed_at}.json`
  - `readLatestCapture(source, captureId)` — reads the most recent version
  - `readCaptureVersions(source, captureId)` — reads all versions for materiality comparison
  - `captureExists(source, captureId, captureHash)` — checks if this exact version already exists

## Acceptance Criteria

1. Journals can be created and appended safely — `appendEntry` enforces schema, immutability, and required fields.
2. Reruns do not duplicate ingested evidence — `hasIngestKey` + `recordIngestKey` prevent re-processing.
3. Manual authority rules are testable — fixture journals include manual entries that would win precedence over synced entries for the same fact key.
4. Capture versioning works — multiple versions of the same capture_id are stored and retrievable.
5. All fixtures conform exactly to the contract schemas. No shortcuts, no missing fields, no placeholder values.
6. No mutable top-level facts, thread_state, name, type, or status in any journal file.
7. No code that writes directly to state/store/ without going through the journal IO layer.

## What Not To Do

- Do not implement sync steps (Phase 2)
- Do not implement derived views — fact derivation, thread derivation, contact derivation (Phase 3)
- Do not implement dashboard (Phase 4)
- Do not implement project linking logic beyond the directory stub (Phase 2)
- Do not add task management concepts, milestone structures, or anything from the "Do not carry over" list in the plan
- Do not create a CLAUDE.md for the repo yet — that comes after scaffold is reviewed
- Do not install heavy frameworks. Keep dependencies minimal for the IO layer. Node.js standard library + crypto for hashing.

## Push Back If

- Any contract is ambiguous or contradicts another — flag it, don't guess
- A schema decision in the contracts doesn't work in practice — flag it with the specific problem
- The fixture data reveals an edge case the contracts don't cover — flag it
- You think a deliverable is missing or incomplete — say so

Silent agreement when something is wrong is a failure mode. If the spec doesn't match reality, say so.

## Report Back

When done, report:
- What was delivered
- What pushed back on (if anything)
- What decisions you made that weren't specified (if any)
- Confirmation that acceptance criteria 1-7 all pass
