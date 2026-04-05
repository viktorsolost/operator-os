# Phase 3 Boot Architecture

Initiative: operator-routing-and-handoffs
Status: proposed
Owner: Anton
Date: 2026-03-28
Purpose: convert the post-Phase-2 routing cleanup into an enforceable boot contract with explicit file classes, a measurable manifest, and a final context budget.

## Judgment

The right mechanism is explicit tiering backed by measurement.

VIK OS already has a working breadcrumb system:
- `BOOT.md` and `ROUTING.md` define the canonical spine
- operator and folder `CLAUDE.md` files already point to deeper files by topic
- operator role files already say when `identity.md`, `working-style.md`, `agent-role.md`, and `decision-principles.md` matter

So Phase 3 should not invent a second loading model.
It should formalize the one that already exists:
- boot loads only the files required to classify lane, preserve continuity, and enforce model posture
- deeper behavioral and task files load only when their topic is actually in play

## File-Class Contract

### `bridge_only`

Purpose: thin entry or discovery files that point into the canonical spine.
They may redirect. They must not redefine policy.

Members:
- `CLAUDE.md`
- `operator/CLAUDE.md`
- `projects/CLAUDE.md`
- `project-types/CLAUDE.md`
- `domains/CLAUDE.md`
- `intake/CLAUDE.md`

### `boot_required`

Purpose: files every session must load before answering.
These establish routing, shared continuity, and runtime posture.

Members:
- `BOOT.md`
- `ROUTING.md`
- `memory.md`
- `recent-context.md`
- `operator/model-policy.md`

Contract:
- these files define the minimum truthful startup state
- adding a file here raises cost for every lane and must be justified explicitly
- no lane-specific or task-specific operational detail belongs here

### `lane_required`

Purpose: files required for the active operator lane on every session in that lane.

Members by lane:
- Claudia:
  - `operator/claudia.md`
  - `operator/claudia-memory.md`
- Anton:
  - `operator/anton.md`
- Jonah:
  - `operator/jonah.md`
- Lev:
  - `operator/lev.md`

Contract:
- lane identity, mandate, boundaries, and lane-specific operating rules live here
- if a file is required every session for only one operator, it belongs here, not in `boot_required`

### `task_conditional`

Purpose: authoritative files that are loaded only when the active task actually needs their topic.

Members:
- `operator/working-style.md`
  Trigger: phrasing, structure, tone, answer shape, outward-facing draft work, or presentation risk
- `operator/identity.md`
  Trigger: who Viktor is, priorities, constraints, role framing, or judgment about what he should spend time on
- `operator/agent-role.md`
  Trigger: autonomy, approval boundaries, what the agent should do, what remains Viktor's call
- `operator/decision-principles.md`
  Trigger: ambiguity, contradiction handling, escalation logic, source-of-truth conflicts, tradeoff decisions
- `operator/captures.md`
  Trigger: capture context or Claudia capture work
- `templates/operator-handoff.md`
  Trigger: explicit cross-lane handoff
- `templates/new-repo-technical-onboarding.md`
- `templates/new-repo-technical-checklist.md`
  Trigger: Anton or Jonah new-repo onboarding
- `projects/README.md`
  Trigger: project-folder discovery or project fixture disambiguation
- domain, project-type, intake, project, initiative, app, and personal context files
  Trigger: only when the request points there

Contract:
- these files remain authoritative for their topic
- authoritative does not mean boot-required
- they are loaded through existing breadcrumbs, not by implicit always-load expansion

### `reference_only`

Purpose: files that may inform work but are never part of the mandatory boot path.

Members:
- initiative notes such as `summary.md`, `decisions.md`, `open-questions.md`, `review-*.md`, `contract-spec-*.md`, `session-log.md`
- audit reports
- `templates/README.md`
- `operator/capabilities.md`
- `operator/clarification-protocol.md`

Contract:
- useful for review, design, or recovery
- not required to route or answer by default

### `runtime_validation`

Purpose: files that verify runtime conformity but do not belong in normal conversational boot.

Members:
- `initiatives/operator-routing-and-handoffs/runtime-self-check.md`
- runtime-local bridge files such as `~/.claude/CLAUDE.md`, `/Users/viktorsl/.openclaw/workspace/AGENTS.md`, `/Users/viktorsl/.openclaw/workspace/START_HERE.md`, and `/Users/viktorsl/.openclaw/openclaw.json`

Contract:
- these are for conformity checks, debugging, and audit verification
- they must not silently become part of normal always-load context

## Boot Manifest

### Canonical startup set

Load in this order:
1. `BOOT.md`
2. `ROUTING.md`
3. `memory.md`
4. `recent-context.md`
5. classify lane
6. selected lane file(s) from `lane_required`
7. `operator/model-policy.md`
8. verify runtime model posture if the runtime declares it
9. load `task_conditional` files only when the task hits their trigger

### Important clarification

`working-style.md` remains authoritative for phrasing and presentation, but it should not stay in the always-load tier.

Reason:
- the measured post-shrink file is small enough to be cheap when needed, but not free
- keeping it always-load would push Claudia above a clean boot ceiling and leave almost no growth room
- the system already has topic breadcrumbs that can pull it in when the task touches wording, drafts, summaries, or answer shape

So the right rule is:
- `working-style.md` is always authoritative
- `working-style.md` is not always boot-loaded

That resolves the earlier contradiction between "baseline behavioral authority" and "context budget enforcement."

## Measurement Baseline

Current measured file sizes:

### Boot-required base

- `BOOT.md`: 2,093 bytes
- `ROUTING.md`: 3,207 bytes
- `memory.md`: 3,006 bytes
- `recent-context.md`: 2,171 bytes
- `operator/model-policy.md`: 2,935 bytes

Base total: 13,412 bytes

### Lane-required totals

- Claudia:
  - `operator/claudia.md`: 7,447 bytes
  - `operator/claudia-memory.md`: 3,557 bytes
  - lane total: 11,004 bytes
  - full boot total: 24,416 bytes
- Anton:
  - `operator/anton.md`: 6,548 bytes
  - lane total: 6,548 bytes
  - full boot total: 19,960 bytes
- Jonah:
  - `operator/jonah.md`: 5,422 bytes
  - lane total: 5,422 bytes
  - full boot total: 18,834 bytes
- Lev:
  - `operator/lev.md`: 6,418 bytes
  - lane total: 6,418 bytes
  - full boot total: 19,830 bytes

### Counterfactual check

If `operator/working-style.md` were put back into always-load:
- add 2,356 bytes to every lane
- Claudia would rise to 26,772 bytes
- Anton would rise to 22,316 bytes
- Jonah would rise to 21,190 bytes
- Lev would rise to 22,186 bytes

That is the measurement-based reason not to keep it in the boot tier.

## Final Budget

The earlier proposed flat 20KB cap is too low for the real post-shrink system because Claudia has a legitimate second lane-required file.

Use a two-part budget instead:

- `boot_required` hard cap: 14,000 bytes
- `lane_required` hard cap per lane: 11,250 bytes
- full boot hard cap per active lane: 25,000 bytes
- full boot target per active lane: 22,000 bytes

Why this is the right shape:
- it preserves pressure on the shared base, which is the real global tax
- it allows one operator, Claudia, to carry a legitimate lane-local operational supplement without forcing every other lane to pay for it
- it leaves some room for controlled growth while still making additions expensive enough to justify

## Enforcement Rule

Any change that adds bytes to `boot_required` or `lane_required` must pass one of these tests:
- it replaces more expensive content elsewhere
- it is required to prevent a real routing or authority failure
- it fits within the hard cap and does not break the target without explicit approval

If a file is useful but fails that test, it belongs in `task_conditional` or `reference_only`.

## Implementation Shape

Phase 3 should use:
- one machine-readable manifest describing the classes and lane membership
- one measurement script that reads the manifest and reports actual byte totals

Do not hardcode the manifest logic separately in multiple docs.
The manifest is the contract surface. Docs explain it. The script measures it.

## Decision

Approve this contract:
- `working-style.md` becomes `task_conditional`, not `boot_required`
- the canonical boot set is frozen at the measured five-file base plus active lane files
- the budget becomes 14KB base, 11.25KB lane, 25KB hard per active lane, 22KB target

This is the smallest mechanism that makes the context budget real.
