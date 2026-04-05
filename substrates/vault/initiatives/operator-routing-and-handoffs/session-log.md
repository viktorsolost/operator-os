# Session Log

## 2026-04-03 — Agent-system tightening pass

Trigger:
Anton handed Jonah a contract-tightening brief for the live VIK OS agent system, specifically around boot loading, shared behavior authority, Atlas and Helena wrapper behavior, delegation doctrine, helper-file drift, and runtime-conformance boundaries.

What was inspected:
- `BOOT.md`
- `ROUTING.md`
- `brands/session-wrapper.md`
- shared operator doctrine in `operator/`
- bridge and helper files under the top-level and context folders
- initiative-local runtime validation artifacts and boot manifest

Key judgment:
- The live problem was real, but narrower than a redesign.
- `identity.md`, `agent-role.md`, `decision-principles.md`, and `working-style.md` are not truthfully mandatory for every session. They remain authoritative, but conditional.
- `operator/context-loading-rules.md` is the real shared loading contract and belongs in canonical boot.
- Atlas and Helena wrapper ambiguity came from wrapper wording, not from a proven need to rewrite both wrapper and boot doctrine.
- The shared delegation rule set was real enough to justify one canonical contract, with operator-specific additions left local.
- Runtime conformance should remain initiative-local beyond the core model-posture check already required by `BOOT.md`.

What changed:
- updated `BOOT.md` so canonical boot explicitly loads `operator/context-loading-rules.md`
- clarified in `BOOT.md` that shared behavior files remain conditional and that deeper runtime conformance artifacts are support, not routing authority
- updated `operator/context-loading-rules.md` to classify boot-required, lane-required, and task-conditional context explicitly
- created `operator/delegation-contract.md` as the canonical shared sub-agent contract
- updated `operator/CLAUDE.md` so it points to canonical boot and loading authority instead of restating broader behavior precedence
- updated `brands/session-wrapper.md` so Atlas or Helena explicit invocation no longer implies forced fallback top-level lane inference before wrapper activation
- updated `initiatives/operator-routing-and-handoffs/boot-manifest.json` so the manifest matches the live core doctrine

Why this changed:
- fresh sessions could finish the top of boot without an explicit load contract for the rest of the behavior stack
- Atlas and Helena startup wording still left room for contradictory interpretation
- delegation doctrine was shared in practice but fragmented in authority
- helper files still carried more explanatory authority than they needed
- runtime validation needed a cleaner boundary between core doctrine and initiative-local verification artifacts

Outcome:
- the live boot chain now says which shared behavior layer is mandatory and which ones are conditional
- Atlas and Helena explicit invocation no longer suggests a forced inferred lane before wrapper activation
- sub-agent usage now has one canonical shared contract without flattening operator-specific nuance
- helper drift is lower because the operator folder shim points back to canonical loading doctrine
- runtime self-check doctrine stays small in core and deeper validation remains where it belongs, in the initiative layer

## 2026-03-28 — Initial diagnosis and design framing

### Trigger
Viktor asked Lev to examine the current setup, explain its strengths and weaknesses, and identify how the system should work when multiple operators with distinct lanes, model assignments, and review responsibilities are involved.

### What was established

- Lev identity was established in the OpenClaw workspace, but the session initially woke in the local workspace rather than the VIK OS vault.
- This revealed a routing mismatch between runtime entrypoint and the actual source of truth.
- After deeper inspection, VIK OS was found to already contain a substantial routing spine:
  - `VIK_OS/CLAUDE.md`
  - `operator/CLAUDE.md`
  - `projects/CLAUDE.md`
  - structured operator/domain/project-type/project folders
  - `memory.md` and `recent-context.md`
- The earlier diagnosis was refined: the primary weakness is ingress inconsistency across runtimes, not lack of internal architecture.

### Key discussion points

1. Strengths of the system
- Durable context exists outside any single chat thread.
- Operators are separated by lane.
- VIK OS acts as a context operating system rather than a loose note pile.
- BackBone holds durable project/operator context while local app runtimes provide execution surfaces.

2. Weaknesses of the system
- Agents can wake in the wrong runtime context before hitting the VIK OS spine.
- Entry behavior is not yet universally consistent across all harnesses.
- Some continuity still depends on app-managed runtime state.
- Cross-operator collaboration logic is conceptually present but not yet formalized as a workflow.

3. Proposed direction
- Fix ingress rather than redesign VIK OS.
- Create or clarify a canonical entrypoint and reduce runtime-specific files to thin shims.
- Add a startup self-check for missing context.
- Define operator handoff artifacts and approval boundaries more explicitly.
- Support multi-model operators where the role identity is stable and the model is just the engine.
- Prefer single-owner plus explicit review, with council mode only for higher-stakes questions.

4. Storage and memory design
- `recent-context.md` should remain hot routing context only.
- Durable truths should remain in distilled operator/routing docs.
- High-level system conversations should not be dumped into a flat architecture folder.
- Instead, system-level work should be stored as bounded workstreams, now proposed under `VIK_OS/initiatives/`.

### Concrete examples discussed

- If Viktor says “build this app,” the first operator should classify the request rather than impersonate all lanes.
- If the request is ambiguous or strategic, Lev stays involved first.
- If technical framing is needed, Anton should own the technical plan.
- If the plan is approved, Jonah should own delivery with sub-agents.
- Operators should be able to review one another’s outputs rather than execute blindly.

### Anton review outcome

Anton agreed with the core diagnosis, but sharpened it: the problem is bootstrap governance, not missing internal architecture.

Key points from Anton:
- `initiatives/` is a good structural move, but it needs minimal lifecycle discipline or it will become another pile.
- Minimal metadata should exist for each initiative, at least: `status`, `owner`, and `scope`.
- The minimal model fix is valid: keep Codex primary, add Anthropic Opus to the allowlist.
- Sonnet should not be added yet without a concrete routing reason.
- Allowlisting Opus is not the same thing as solving routing. It only fixes model permission.
- The real work is establishing a canonical boot contract that all runtimes must enter through.

### Constraint explicitly confirmed by Viktor

This initiative must not change the identity, ownership, or role boundaries of the operators.

Invariant:
- Lev stays Lev
- Anton stays Anton
- Jonah stays Jonah
- Claudia stays Claudia

Only the following layers may change:
- boot logic
- routing mechanics
- model assignment policy
- handoff mechanics
- startup/context-loading consistency

### Approval update

Viktor approved Anton's implementation direction in principle.

However, Jonah was initially deferred until the runtime/model-policy layer was stable enough to guarantee that Jonah could operate in his intended posture, especially around Opus preference and sub-agent delegation policy.

Working rule at that stage:
Fix the boot/routing/model-policy layer first.
Only then route execution to Jonah.

### Jonah first-slice implementation outcome

Jonah completed the first approved slice:
- created `VIK_OS/BOOT.md`
- created `VIK_OS/ROUTING.md`
- created `VIK_OS/operator/model-policy.md`
- created `VIK_OS/templates/operator-handoff.md`
- converted `VIK_OS/CLAUDE.md` into a shim to `BOOT.md`

Jonah explicitly verified that operator identity files remained untouched.

Mismatch found:
- `contract-spec-anton.md` still referenced `VIK_OS/CLAUDE.md` as required boot context after the architecture had already been frozen around `BOOT.md`

This mismatch was later cleaned so the initiative docs matched the newly landed architecture.

### Intended next step
Treat the first slice as complete. Continue by cleaning stale references, then judge the next implementation slice from the newly stabilized boot/routing/model-policy base.

### 2026-04-03 — Jonah validator and manifest drift correction

Checked the live vault boot chain, runtime bridges, validators, and repo-local runtime brief against the actual runtime files.

Corrected live-authority drift in:
- `initiatives/operator-routing-and-handoffs/runtime-self-check.md`
- `initiatives/operator-routing-and-handoffs/runtime-smoke-tests.md`
- `initiatives/operator-routing-and-handoffs/boot-manifest.json`
- `~/VIK/Coding/Memento/plan/atlas-helena-global-runtime-implementation-brief.md`

What changed:
- the OpenClaw self-check now verifies live runtime posture instead of enforcing a stale exact two-model allowlist
- the smoke test now checks ingress truth instead of stale operator-name expectations in bridge files
- the manifest now includes Vera, tracks closeout/context-placement in boot-required files, records brand-wrapper explicit-invocation files, and includes both runtime validation files
- the repo brief is explicitly marked as superseded where it still implied Atlas/Helena task-shape inference

What was intentionally not changed:
- no runtime model capability was narrowed
- no startup bridge file was tightened yet
- no test fixtures were moved
- no memory or recent-context content was relocated in this slice

### 2026-04-03 — Jonah startup-context trim, preserve-first pass

Tightened startup-context placement without deleting logic.

What moved:
- exhibition-specific operational rules moved from `memory.md` to `domains/exhibitions/rules.md`
- Viktor-specific design preferences moved from `memory.md` to `operator/vera.md`
- Claudia-only recurring operational notes moved from `memory.md` to `operator/claudia-memory.md`
- `projects/README.md` now states that humans, audits, and loaders should exclude `test-*` folders unless fixture testing is explicit

What stayed on purpose:
- cross-operator doctrine stayed in `memory.md`
- `recent-context.md` open items and blockers were left untouched in this slice because the safer destination was not yet explicit
- no test fixtures were moved or renamed
- no runtime behavior changed

### 2026-04-03 — Jonah runtime proof pass and stale brief removal

Validated live Atlas/Helena startup behavior from outside the repo where possible.

What was verified:
- Codex from `/tmp` entered through the vault boot chain and honored Atlas explicit invocation without letting repo context define identity
- OpenClaw from `/tmp` honored Atlas/Helena explicit-invocation behavior and confirmed repo context does not define brand-operator identity
- Gemini global bridge file at `~/.gemini/GEMINI.md` matches live vault doctrine

What remains unproven:
- Gemini live runtime behavior still needs one authenticated smoke test because the CLI stopped at an interactive auth prompt

Cleanup completed:
- removed stale untracked repo file `plan/atlas-helena-global-runtime-implementation-brief.md` after confirming it no longer had an active job

Result:
- Codex and OpenClaw now have direct runtime proof for the current Atlas/Helena boot pattern
- Gemini still has a single proof gap, auth-bound rather than doctrine-bound
