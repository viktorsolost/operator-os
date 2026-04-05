# Memento Technical Plan

## Purpose

Build Memento as a store-first project journal system for recurring projects, with the AI operator as the primary operating surface and the dashboard as a read-optimized context viewer.

This system replaces the current projection-heavy dashboard model with a simpler architecture built around:
- append-only journals
- explicit truth boundaries
- deterministic derived views
- conservative enrichment
- manual authority
- conversational operation instead of task management machinery

## Product Decision

Memento is not a task manager.

It will not implement intake triage, milestone trees, surfaced tasks, action plans, production calendars, execution threads, or any renamed equivalent.

The system must not reintroduce a hidden task engine through thread logic, fact derivation, contact views, dashboard summaries, or persisted read models.

## Truth Boundary, Locked Before Implementation

These contracts must be locked before any broad scaffolding or integration work begins.

### 1. Registry ownership contract

`state/registry.json` is the sole canonical owner of:
- `project_id`
- `name`
- `type`
- `status`
- primary source references
- project aliases
- creation metadata

`status` is the single canonical lifecycle field. It covers both business state and sync relevance. There is no second lifecycle field.

Allowed values: `active`, `paused`, `archived`, `closed` (or equivalent — exact values locked in the registry ownership contract doc).

Pipeline reads `status` to decide whether to sync. Dashboard reads `status` for display. No separate activation or surface_state field exists.

Decision: Option A, decided 2026-03-29. A two-field split was considered and rejected because overlapping lifecycle fields drift. One field, clear values, one source of truth.

Rules:
- journals do not duplicate `status` as canonical top-level state
- `status` changes are written in registry and may be observed historically in journal entries as evidence

### 2. Journal entry schema contract

`state/store/{project_id}.json` is the canonical owner of project history and evidence.

The journal stores append-only entries only.

It does not maintain mutable top-level `facts` state.
It does not maintain a sidecar `thread_state` table.
It does not duplicate mutable project identity or lifecycle state.

Current facts and open threads are derived views over journal entries plus explicit manual override entries where needed.

### 3. Capture layer contract

`state/captures/` is the mandatory pre-enrichment boundary for source observations.

Purpose:
- replay
- debugging
- migration safety
- rerun safety
- auditability
- changed-artifact evaluation before journal mutation

No sync step writes directly into journals.

### 4. Idempotent ingest identity contract

Every upstream observation must have a stable ingest identity.

Recommended contract:
- `source`
- `source_ref`
- `observation_kind`
- `capture_hash`

Rules:
- repeated observation of the exact same upstream item does not create a new journal entry
- materially changed upstream payload may produce a new capture record
- ingest identity is decided before store enrichment, not during UI logic
- rerunning sync or enrich must be safe

### 5. Changed-artifact ingest rule

This must be explicit across all sources.

When an upstream artifact changes:

A. Create a new capture only when:
- the upstream payload changed in a way that matters for source replay or audit
- but the change does not create new project evidence
- examples: formatting-only email body normalization changes, non-semantic metadata refresh, duplicate fetch with richer transport metadata but no new business meaning

B. Create a new capture and a new journal evidence entry when:
- the changed artifact introduces new business-relevant evidence
- examples: calendar event time changed, attendee set changed, Basecamp message edited with new substantive content, Gmail thread gained a new message, Drive file modified with new relevant timestamp or linked artifact state

C. Create no new journal evidence entry on rerun when:
- the capture represents an already-ingested observation with no business-meaningful change under source-specific rules

This contract must define source-specific materiality rules for at least Gmail, Basecamp, Calendar, and Drive.

### 6. Fact and thread derivation contract

Facts and open threads must be deterministic read models.

Facts are derived from fact-bearing entries with:
- provenance
- timestamp
- source type
- manual or synced authorship
- precedence rules

Open threads are derived from explicit open and close predicates per source type, plus manual override entries that win when present.

No fuzzy implicit task model is allowed.

## Canonical Storage Model

The canonical truth is:
- `state/registry.json` for project identity and lifecycle metadata
- `state/store/{project_id}.json` for append-only project journal entries
- `state/captures/` for raw and normalized source captures before enrichment

Everything else is derived.

## Repo Shape

```text
Memento/
├── dashboard/
│   ├── app/
│   │   ├── today/
│   │   ├── projects/
│   │   ├── contacts/
│   │   └── calendar/
│   ├── components/
│   ├── lib/
│   └── public/
├── pipeline/
│   ├── cli/
│   ├── steps/
│   └── lib/
├── state/
│   ├── captures/
│   ├── store/
│   └── registry.json
├── docs/
│   ├── contracts/
│   └── schemas/
├── plan/
└── CLAUDE.md
```

## Registry Schema

Purpose: project lookup, lifecycle ownership, and source linkage.

Required fields:
- `project_id`
- `name`
- `type`
- `status`
- `created_at`
- `updated_at`
- `aliases[]`
- `source_refs`
  - `basecamp_ids[]`
  - `calendar_ids?`
  - `drive_folder_ids?`
  - other known upstream refs

Rules:
- projects are added via conversation, not source discovery
- sync may enrich refs for already-registered projects
- unknown discovered work is stored as unlinked capture activity, not auto-promoted into registry
- registry is the only canonical current owner of project identity and lifecycle metadata

## Journal Schema

Purpose: append-only project evidence log.

Recommended top-level shape:
- `project_id`
- `entries[]`
- `metadata`
  - `schema_version`
  - `created_at`
  - `updated_at`

No canonical mutable `facts` object.
No canonical mutable `thread_state` object.
No duplicated mutable `name`, `type`, or `status` fields.

## Journal Entry Schema

Every entry must include:
- `entry_id`
- `timestamp`
- `recorded_at`
- `source`
  - `basecamp | gmail | calendar | drive | conversation | operator | system`
- `source_ref`
- `entry_type`
- `title`
- `summary`
- `payload`
- `project_link`
  - `mode: direct | inferred | unlinked`
  - `basis: string[]`
- `authorship`
  - `manual | synced | extracted`
- `provenance`
  - capture ids, source artifact refs, extraction parents
- `actors[]`
- `contacts[]`
- `tags[]`

Optional fields by entry type:
- `fact_claims[]`
- `thread_signals[]`
- `link_refs[]`
- `raw_ref`

Rules:
- entries are immutable after append except by explicit migration tooling
- extracted entries must link back to parent source artifacts
- summaries are for read clarity, not loss of evidence
- manual entries remain authoritative where precedence rules say they win

## Capture Layer

A separate capture layer is required on disk before enrichment.

Recommended shape:
- `state/captures/basecamp/`
- `state/captures/gmail/`
- `state/captures/calendar/`
- `state/captures/drive/`
- `state/captures/meeting_extract/`

Each capture record should include:
- `capture_id`
- `source`
- `source_ref`
- `observation_kind`
- `observed_at`
- `normalized_payload`
- `raw_ref` or raw payload pointer
- `candidate_project_links[]`
- `capture_hash`

Rule:
store enrichment reads from captures and appends journal entries only when ingest identity and materiality rules say the observation is new evidence.

## Idempotency Model

Append-only does not mean duplicate everything forever.

We need two layers of idempotency:

### Capture idempotency
Same upstream observation with same normalized payload should resolve to the same capture identity or be recognized as already seen.

### Journal idempotency
A capture already represented in a project journal should not create another equivalent journal entry on rerun.

Recommended mechanism:
- stable `capture_id`
- stable derived `ingest_key`
- explicit source-specific materiality evaluation
- journal metadata or index proving prior ingestion of that key

Hard rule:
rerunning sync or enrich must be safe.

## Source-Specific Materiality Rules

These must be defined in docs before implementation.

Minimum required interpretations:

### Gmail
New message in thread = new journal evidence entry.
Label changes or fetch metadata changes alone = capture-only unless promoted by explicit rule.

### Basecamp
New message, substantive message edit, new todo state that matters to project evidence = new journal evidence entry.
Transport-only refresh = capture-only.

### Calendar
Time change, date change, attendees change, title change with business meaning, cancellation, or new notes/extraction basis = new journal evidence entry.
Pure sync refresh without semantic event change = capture-only.

### Drive
New relevant file, renamed linked file with business meaning, modified timestamp tied to relevant artifact change = new journal evidence entry.
Non-relevant metadata refresh = capture-only.

## Facts Derivation Model

Current project facts are a read model, not mutable store state.

Fact sources:
- explicit manual fact entries
- extracted fact entries with provenance
- direct synced fact entries from trusted sources

Each fact claim should carry:
- fact key
- fact value
- provenance
- timestamp
- confidence or trust class
- authorship

Precedence model:
1. manual authoritative entries
2. direct trusted synced entries
3. extracted entries with explicit provenance
4. inferred or weakly linked claims

If facts conflict, the derived view should expose both the winning current value and the conflicting evidence when needed.

## Open Threads Derivation Model

Open threads are a read model.

They are derived from exact predicates, not fuzzy operator intuition.

### Allowed thread-related entry signal types
- `awaiting_reply`
- `reply_received`
- `awaiting_external_action`
- `external_action_completed`
- `followup_required`
- `followup_completed`
- `manual_thread_opened`
- `manual_thread_closed`

### Source-specific predicates must be defined
At minimum for:
- Gmail threads
- Basecamp conversations
- Calendar follow-ups extracted from notes
- Manual/operator entries

Examples of acceptable precision:
- outbound email marked awaiting response opens thread
- inbound reply from awaited counterparty closes that thread unless a newer pending follow-up exists
- manual thread closed entry closes matching derived thread regardless of inferred status

Unacceptable shape:
- “seems pending”
- “meeting-created follow-up without closure signal” without a formal extraction contract

## Contacts Model

Contacts remains a derived cross-project index.

Canonical truth stays in registry plus journal entries.

Implementation shape:
- derive contacts from journal actors and contacts
- merge by explicit identity resolution rules (not hand-waved "normalized identity")
- expose contact pages as read models only

Do not create a primary contact database in v1.

Identity resolution is a real problem: 4 Gmail accounts, Basecamp display names, calendar attendee strings, varying aliases for the same person. The contacts contract must define explicit merge rules covering at minimum:
- email-based identity matching across accounts
- display name disambiguation
- organizational alias handling
- conflict resolution when signals disagree

This contract is deferred to Phase 3. Merge rules must be locked before Jonah builds the derivation, not after. Decided 2026-03-29.

## Project Linking Strategy

Project association needs a dedicated shared library under `pipeline/lib/project_linking/`.

Association order:
1. direct registered id match
2. direct known URL, folder, calendar, or thread ref match
3. alias plus participant match with strong confidence
4. weak inference, marked `inferred`
5. unresolved, marked `unlinked`

Rules:
- inferred links must record basis
- unlinked captures are preserved
- unknown projects are not created from discovery
- dashboard must be able to exclude or surface unlinked material intentionally

## Read Model Boundaries

These surfaces are derived-only and must not create persisted secondary truth:
- Today
- Project detail current facts view
- open threads view
- Contacts
- Calendar composition layer

If caching is introduced later, it must be explicitly disposable and fully recomputable from canonical sources.

## Pipeline Steps

The pipeline remains seven steps, but now against an explicit capture boundary.

### 1. `basecamp_sync`
Fetch project-linked and potentially linked Basecamp artifacts for registered projects.
Write normalized captures to `state/captures/basecamp/`.

### 2. `gmail_sync`
Fetch Gmail threads across configured accounts.
Write normalized captures to `state/captures/gmail/`.

### 3. `calendar_sync`
Fetch Google Calendar events and related metadata.
Write normalized captures to `state/captures/calendar/`.

### 4. `drive_sync`
Fetch linked Drive file references and metadata.
Write normalized captures to `state/captures/drive/`.

### 5. `meeting_extract`
Read eligible capture artifacts and append extraction captures to `state/captures/meeting_extract/`.

Hard rule:
extraction creates derived captures with provenance, not direct journal mutation.

### 6. `store_enrich`
Read captures, apply project linking, ingest identity, and materiality rules, then append new journal evidence entries into `state/store/`.

Hard rules:
- append-only journal writes
- no deletion
- no manual overwrite
- rerun-safe enrichment
- explicit provenance on every appended entry

### 7. `morning_digest`
Generate a read artifact summarizing overnight changes across journals and live calendar context.

This is not a truth layer.

## Fetch Scope Addendum — Binding

Added 2026-03-29. Defines what each sync step fetches from upstream. Phase 0 contracts define what happens after observations arrive. This section defines what gets fetched.

### Gmail fetch scope
- Accounts: all 4 (gws-ca, gws-eterno, gws-info, gws-personal)
- First run (no prior captures): last 7 days
- Subsequent runs: since last fetch timestamp per account (from sync_log)
- No content-based filtering in v1. All messages fetched, dedup at capture layer.
- Post-Phase 2: build ignore list from observed unlinked capture patterns (future refinement, not blocking)

### Basecamp fetch scope
- Scope: all activity on registered projects matched by basecamp_ids in registry
- All messages, todos, comments from all participants, not just Viktor's threads
- First run: full available project history
- Subsequent runs: since last fetch timestamp
- Empty upstream boards are real state, not a bug. The sync is working correctly.

### Calendar fetch scope
- Accounts: gws-personal (accesses all 3 allowed calendars)
- Allowed calendars: viktor.so.lost@gmail.com, viktor@cultural-affairs.com, viktor@eternogallery.com
- Time window: lookback 7 days, lookahead 30 days
- Lookahead 30 days because exhibition projects plan events weeks ahead. Schedule changes need capturing before they're imminent.
- Dedup by iCalUID across calendars
- First run: full window
- Subsequent runs: full window (calendar events change, so re-fetching the window is correct)

### Drive fetch scope
- Account: gws-eterno (NOT gws-personal — the Eterno shared drive is on the Eterno account)
- Root: `1p3CeKNq2J-Iw5kNn9tFijhmkfwtU4bFR` ("EE_PROGRAMS / OPERATIONS DEPARTMENT")
- Structure: root > EE_PO_2026 > EE_PO_EXHIBITIONS_2026 > per-project folders
- Sync scope: walk each registered project's drive_folder_ids recursively. Everything above the per-project exhibition folder is noise.
- First run: all files in registered project folders
- Subsequent runs: new or modified since last fetch
- Real folder IDs (discovered 2026-03-29):
  - PUNKS: `1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW`
  - Lucas Zanotto: `1lk0NpoiJFIeIxsyrOqYMvyG0FQrqa0Fw`

### Auth resilience
- gws-info, gws-ca, gws-eterno tokens expire approximately every 24h (RAPT token expiry)
- Pipeline must handle expired tokens gracefully: log the failure, skip that account/source, continue with remaining sources
- This is an operational constraint, not a pipeline bug. Root cause investigation is useful but not blocking for Phase 2.

## Dashboard Surfaces

### Today
Contains:
- today’s meetings
- overnight activity feed
- open threads across active projects
- operator terminal

Hard rule:
no synthetic task plan assembly.

### Projects
Cards show composed read data from registry plus derived journal views.

### Project Detail
Composes:
- registry identity
- derived current facts
- canonical links
- activity journal
- open threads
- operator terminal

### Contacts
Derived person views across journals.

### Calendar
Actual Google Calendar visibility with project-aware association.

## Carryover from `vault-pipeline-v3b`

Reuse:
- design system DNA and CSS variables
- Electron shell setup
- gws CLI integration patterns
- Basecamp OAuth patterns
- append-only and manual-authority rules
- agent terminal shape where still structurally clean

Do not carry over:
- SOP coupling
- production calendar sheets logic
- intake triage
- task surfacing
- action plans and action steps
- derive_project_view
- milestone structures
- projection-heavy telemetry pages

## Delivery Phases

### Phase 0. Truth-boundary lock

Deliver 8 contract docs in 3 review batches:

**Batch 1 — storage foundation:**
- `registry-ownership.md` (includes lifecycle semantics — single `status` field)
- `journal-entry-schema.md`
- `capture-layer.md`

**Batch 2 — ingestion rules:**
- `ingest-identity.md`
- `changed-artifact-materiality.md`

**Batch 3 — derivation layer:**
- `fact-derivation.md`
- `thread-derivation.md`
- `project-linking.md`

Read-model boundaries are folded into each relevant contract as constraints, not a standalone doc.

Contacts contract is deferred to Phase 3. Merge rules must be locked before implementation. Decided 2026-03-29.

Source-specific materiality rules: the contract shape is locked in Phase 0. Per-source rules (Gmail, Basecamp, Calendar, Drive) are flagged as living definitions that refine during Phase 2 real sync runs without requiring a full contract re-review. The structure they refine within does not change.

Acceptance:
- no duplicated mutable project truth remains in the design
- single lifecycle field, no split semantics
- facts and threads are clearly derived, not sidecar state
- replay and rerun boundaries are explicit
- source-specific materiality contract shape exists before implementation
- every contract doc includes a "tested against" section validated with PUNKS and Lucas Zanotto as real project cases
- three review rounds, not eight — batched as above

### Phase 1. Foundation scaffold
Deliver:
- repo scaffold
- schema docs
- capture storage layout
- append-only journal IO layer
- ingest identity helpers
- sample registry
- sample capture fixtures
- sample journal fixtures

Acceptance:
- journals can be created and appended safely
- reruns do not duplicate ingested evidence
- manual authority rules are testable

### Phase 2. Pipeline skeleton
Deliver:
- CLI entrypoints for 7 steps
- shared clients in `pipeline/lib`
- project linking library
- capture writers
- enrich pipeline skeleton

Acceptance:
- each step runs independently
- capture outputs are inspectable
- unlinked captures are preserved

### Phase 3. Deterministic read models
Deliver:
- fact derivation
- activity feed derivation
- open thread derivation
- contact derivation

Acceptance:
- views are fully recomputable from registry plus journal evidence
- derivation rules are fixture-tested
- no secondary truth store is required

### Phase 4. Dashboard shell

This phase is a placeholder. Surface design is deferred until we have operated against real derived views from real projects in Phases 1-3. Phases 0-3 are surface-agnostic by design. The dashboard shape will be informed by what conversation-first operation actually needs, not guessed in advance.

Deliver:
- Next.js app routes
- reusable feed components
- open thread components
- project cards
- project detail page
- terminal placement

Acceptance:
- dashboard reads composed data only
- no legacy task constructs appear

### Phase 5. Source integrations and cutover
Deliver:
- live source integrations completed
- meeting extraction flow completed
- real-project validation
- cutover plan from v3b concepts to Memento usage

Acceptance:
- active projects are operable through conversation plus context views
- provenance remains intact
- old projection-heavy surfaces are not needed for daily operation

## Minimum Phase 0 Contract Set

Before Jonah should touch implementation, `docs/contracts/` must contain:
- `registry-ownership.md` (Batch 1)
- `journal-entry-schema.md` (Batch 1)
- `capture-layer.md` (Batch 1)
- `ingest-identity.md` (Batch 2)
- `changed-artifact-materiality.md` (Batch 2)
- `fact-derivation.md` (Batch 3)
- `thread-derivation.md` (Batch 3)
- `project-linking.md` (Batch 3)

Contacts contract is written in Phase 3 before contacts derivation implementation.

## File Targets

Immediate design and implementation targets:
- `docs/architecture.md`
- `docs/contracts/registry-ownership.md`
- `docs/contracts/journal-entry-schema.md`
- `docs/contracts/capture-layer.md`
- `docs/contracts/ingest-identity.md`
- `docs/contracts/changed-artifact-materiality.md`
- `docs/contracts/fact-derivation.md`
- `docs/contracts/thread-derivation.md`
- `docs/contracts/project-linking.md`
- `docs/schemas/registry.md`
- `docs/schemas/project-journal.md`
- `docs/schemas/journal-entry.md`
- `pipeline/cli/`
- `pipeline/lib/`
- `pipeline/steps/`
- `dashboard/app/today/`
- `dashboard/app/projects/`
- `dashboard/app/contacts/`
- `dashboard/app/calendar/`
- `dashboard/components/`
- `state/registry.json`
- `state/captures/`
- `state/store/`

## Invariants

These must hold through implementation:
- registry is the sole canonical owner of project identity and lifecycle metadata
- journals are append-only evidence logs
- captures exist before enrichment
- facts are derived, not mutable top-level truth
- threads are derived, not a hidden task table
- manual entries are authoritative where specified
- all derived views are recomputable
- no renamed task engine reappears
- project linking confidence is explicit
- raw provenance is never lost
- UI remains a context surface, not a management maze

## Risks

1. Duplicated project truth between registry and journals
   - Mitigation: registry-only identity ownership

2. Mutable facts reappearing as top-level state
   - Mitigation: fact claims only, derived current facts

3. Open threads becoming a task system
   - Mitigation: exact predicates and manual override entries only
   - Red line: any thread derivation logic that cannot point to a specific open/close signal type from the allowed list is a violation, not a review item

4. Reruns duplicating evidence or source changes being handled inconsistently
   - Mitigation: locked ingest identity plus source-specific materiality rules

5. Over-reuse from v3b dragging old abstractions back in
   - Mitigation: reuse primitives only, not old concepts

6. Conversation-as-primary-surface depends on VIK OS session quality
   - This is an external dependency outside Memento's repo scope
   - If VIK OS boot speed, context loading, or operator routing degrades, Memento's product thesis breaks regardless of store layer quality
   - Owner: Claudia. She owns the VIK OS session quality track — boot speed, context loading, operator routing continuity. She flags regressions and owns fixes or routes them. Anton consults on technical shape if needed. Decided 2026-03-29.

## Validation

Before calling v1 structurally sound, validate:
- registry and journal truth boundaries on fixtures
- capture replay and rerun safety
- ingest idempotency across repeated syncs
- source-specific materiality decisions across repeated changed-artifact cases
- fact derivation precedence
- thread derivation open and close predicates per source type
- manual override precedence
- dashboard absence of legacy task concepts
- operator terminal usability on Today and Project pages

## Recommended Immediate Next Step

Do not start broad implementation yet.

Start with Phase 0 only:
- lock the minimum contract set in `docs/contracts/`
- every contract must be tested against PUNKS and Lucas Zanotto — if a contract can't describe what happens when a PUNKS artist email lands, it's too abstract
- only then scaffold the repo and storage helpers

That becomes the actual implementation baseline.

## CTO Review Record — Anton, 2026-03-29

**Plan status:** Canonical. This is the only authoritative technical plan for Memento. Previous versions (v1, v2) are archived.

**Structural judgment:** Architecturally sound. Ready for Phase 0 contract docs. Not ready for broad implementation until contracts are locked and validated against real projects.

**Decisions locked:**
- Single `status` lifecycle field, Option A. No split. Decided 2026-03-29.
- Changed-artifact ingest rule with source-specific materiality (included in plan).
- Phase 0 contracts delivered in 3 review batches, not 8 serial reviews. Decided 2026-03-29.
- Source-specific materiality: contract shape locked in Phase 0, per-source rules are living definitions that refine during Phase 2 without full re-review. Decided 2026-03-29.
- Contacts contract deferred to Phase 3. Explicit merge rules required before implementation. Decided 2026-03-29.
- VIK OS session quality track owned by Claudia as parallel concern. Decided 2026-03-29.

**Confirmed as correct:**
- Journal schema cleanup (no top-level facts, thread_state, name, type, status).
- Mandatory capture layer before enrichment.
- Thread derivation via exact predicates only, vague logic banned.
- Delivery phase sequencing with Phase 0 as real starting point.
- Facts derivation precedence model.
- Linking strategy confidence ordering.
- Pipeline step boundaries.
- Carryover and exclusion lists from v3b.

**Red lines for implementation:**
- No renamed task engine. Open threads are where it will try to sneak back in.
- Any thread derivation logic that cannot point to a specific open/close signal from the allowed list is a violation, full stop.
- Contracts that cannot describe real PUNKS or Lucas Zanotto scenarios are not done.

**Operator review (Claudia, 2026-03-29):**
- Batched review rounds accepted to prevent bottleneck.
- Source materiality rules flagged as needing real-sync refinement — living definitions within locked contract shape.
- VIK OS session quality accepted as parallel track under Claudia's ownership.
- Contacts identity resolution flagged as underspecified — deferred to Phase 3 with mandatory merge rules before build.
- Operator stress-test rationale: Claudia operates the system daily. Contract gaps found now are cheaper than gaps found during live PUNKS sessions.
