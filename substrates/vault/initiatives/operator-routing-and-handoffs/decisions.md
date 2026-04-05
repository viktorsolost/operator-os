# Decisions

## Approved

### 2026-03-28 — Approve bounded initiative folders for system-level work
Status: approved

Rationale:
A single flat architecture folder would become a junk drawer. High-level system conversations should live in bounded workstreams with continuity, similar to project folders.

Approved structure:
- `VIK_OS/initiatives/<initiative-id>/summary.md`
- `VIK_OS/initiatives/<initiative-id>/decisions.md`
- `VIK_OS/initiatives/<initiative-id>/open-questions.md`
- `VIK_OS/initiatives/<initiative-id>/session-log.md`

### 2026-03-28 — Diagnose the real weakness as ingress inconsistency, not missing internal architecture
Status: approved

Rationale:
VIK OS already has a meaningful routing spine in `VIK_OS/CLAUDE.md`, `BOOT.md`, `ROUTING.md`, and the operator/domain/project-type structure. The observed failure was entrypoint mismatch, not absence of internal routing logic.

### 2026-03-28 — Prefer single-owner plus explicit review over all-operator discussion by default
Status: approved

Rationale:
One operator owns the response lane at a time. Other operators may review, challenge, verify, or receive a handoff. Multi-operator council mode remains exceptional.

### 2026-03-28 — Protect operator identity while changing boot/routing
Status: approved

Rationale:
This initiative may change startup, routing, model assignment, handoff mechanics, and measurement. It must not redefine operator identity, ownership, reporting lines, or lane boundaries unless Viktor explicitly redesigns them.

### 2026-03-28 — Approve Anton's implementation direction in principle, defer Jonah until runtime/policy is ready
Status: approved

Rationale:
Anton's implementation plan is accepted as the correct direction. Execution should not begin with Jonah yet because the runtime/model-policy layer was not stable enough for Jonah to reliably operate in his intended lane and model posture. Fix the boot/routing/model-policy layer first, then hand execution to Jonah.

### 2026-03-28 — Approve the Phase 3 file-class contract
Status: approved

Rationale:
The post-Phase-2 system now has a measurable boot contract. Files are classified as `bridge_only`, `boot_required`, `lane_required`, `task_conditional`, `reference_only`, or `runtime_validation`. This makes the budget enforceable instead of rhetorical.

Approved artifact:
- `initiatives/operator-routing-and-handoffs/boot-manifest.json`

### 2026-03-28 — Keep `working-style.md` authoritative but not always boot-loaded
Status: approved

Rationale:
`operator/working-style.md` governs phrasing, structure, tone, and answer shape, but it should load only when the active task touches those concerns. It remains authoritative. It does not remain in the always-load boot tier.

Approved class:
- `task_conditional`

### 2026-03-28 — Approve the final boot budget
Status: approved

Rationale:
The flat 20KB proposal no longer matches the measured post-shrink system, especially because Claudia has a legitimate second lane-required file. The approved budget separates shared base cost from lane-local cost.

Approved budget:
- `boot_required` hard cap: 14,000 bytes
- `lane_required` hard cap per lane: 11,250 bytes
- session boot target per active lane: 22,000 bytes
- session boot hard max per active lane: 25,000 bytes

### 2026-03-28 — Freeze the canonical boot set at the measured five-file base plus active lane files
Status: approved

Rationale:
The minimal truthful startup set is now explicit and measured:
- `BOOT.md`
- `ROUTING.md`
- `memory.md`
- `recent-context.md`
- `operator/model-policy.md`
- active lane file(s) from the manifest

Everything else loads only through explicit task triggers or reference use.

## Proposed

None currently.
