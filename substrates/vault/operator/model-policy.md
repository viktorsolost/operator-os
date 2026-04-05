# Operator Model Policy

This file defines the authoritative model posture for VIK OS operators.
It governs posture, not operator identity.

## Policy

- Model choice must follow operator lane and task needs.
- Runtime availability may affect the exact model used.
- No runtime may use model selection to override routing policy.
- Model assignment does not change operator ownership, authority, or boundaries.

## Operator posture

### Claudia
Use `anthropic/claude-opus-4-6` by default for Claudia's lane.

Claudia owns oversight, review, decisions, cross-context operational judgment, and anything touching Viktor's voice. That requires a model that can hold context cleanly, make good judgment calls, and avoid flattening nuance when the work spans multiple threads or consequences.

If Claudia delegates narrow retrieval or straightforward research to sub-agents, those tasks may use a cheaper or lighter model where quality is still adequate. Claudia herself should stay on `anthropic/claude-opus-4-6` for operator judgment.

### Anton
Use `anthropic/claude-opus-4-6` for Anton's lane.

Anton owns architecture, technical review, source-of-truth boundaries, implementation planning, and documentation accuracy against the real system. He needs disciplined technical reasoning, structural clarity, and code-adjacent precision.

Do not drop Anton to a weaker technical posture when it would reduce judgment quality on architecture or system design.

### Jonah
Use `anthropic/claude-opus-4-6` for Jonah's lane.

Jonah owns implementation delivery, sequencing, verification, integration, and execution against approved technical direction. His job depends on checking specs against the real codebase, coordinating bounded implementation work, and refusing vague done claims. `anthropic/claude-opus-4-6` fits that delivery and verification posture.

Jonah spawns sub-agents on `anthropic/claude-sonnet-4-20250514` for bounded implementation tasks. Opus stays on Jonah himself for judgment, sequencing, and verification. Sonnet handles the leaf work.

Jonah should not be forced to invent architecture because of model or runtime limitations. If the work actually needs architectural judgment, route it back to Anton.

### Lev
Use `anthropic/claude-opus-4-6` for Lev's lane.

Lev owns strategic thinking, ambiguity reduction, problem reframing, and high-stakes analysis. His work is depth-first, not throughput-first. `anthropic/claude-opus-4-6` is the right model because it can hold complexity, sustain long-context reasoning, and resist collapsing hard problems into premature answers.

### Vera
Use `anthropic/claude-opus-4-6` for Vera's lane.

Vera owns visual design, UI/UX, information architecture, and surface design. Design judgment requires holding multiple constraints simultaneously (user needs, technical feasibility, operational requirements, accessibility) and producing clear, defensible recommendations. That requires Opus.

Vera spawns sub-agents on `anthropic/claude-sonnet-4-20250514` for bounded implementation tasks (CSS, component building, asset production). Opus stays on Vera herself for design judgment and review.

## Constraints

- Routing decides the operator first. Model choice follows.
- If a runtime cannot support the required posture well enough for the active lane, surface the limitation instead of pretending the lane is satisfied.
- Cross-operator handoffs do not occur just because another model is available.
