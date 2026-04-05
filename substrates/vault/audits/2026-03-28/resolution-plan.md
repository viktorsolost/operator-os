# Routing Audit Resolution Plan — 2026-03-28

Author: Lev
Status: Draft — pending operator review
Purpose: Consolidated priorities from all four operator audits and the global issues file, sequenced for implementation.

## Governing Constraint: Context Budget

Before implementing any fix, set a hard per-operator boot context budget. Every proposed fix below either adds bytes or reduces them. Without a budget, the system grows monotonically. This session loaded 14 files and ~51KB before the first question was answered. That's day one.

**Proposed budget:** ~20KB per operator for boot context (BOOT.md + ROUTING.md + operator role file + shared memory + model policy). Everything else loads on demand when the task requires it.

This budget is a forcing function. It means:
- memory.md must shrink (extract Claudia-specific content)
- lev.md must shrink (currently 14.7KB alone, target under 8KB)
- shared behavioral files (working-style.md, identity.md, agent-role.md, decision-principles.md) move to on-demand loading rather than mandatory boot
- any new content added to the boot path must be offset by removing or compressing existing content

The budget number is a proposal. Viktor sets the final number. But the principle is non-negotiable: the system needs a ceiling before it gets more floor.

## Priority 1: Shrink Before You Grow

These reduce per-session context load. Do them first because every other fix adds bytes.

### 1a. Refactor `memory.md`

Split into:
- **`memory.md`** (slim, ~2KB target): cross-operator truths only. Communication style, data integrity rules, Viktor's preferences, operator hierarchy. Nothing tool-specific, nothing lane-specific.
- **Claudia-specific content** moves to `operator/claudia.md` or a dedicated `operator/claudia-memory.md`.

Source: Global Issue 4, Lev Finding 5. All four operators agree.

### 1b. Trim `lev.md`

Current: 14.7KB. Target: under 8KB.
- Relationship sections (Claudia, Anton, Jonah) can be shortened to 1-2 sentences each. The detailed bilateral definitions are mostly restating what the other operator files already say.
- Thinking methodology can be tightened. The principles are sound but verbose.
- Autonomy section overlaps with agent-role.md.

Source: Claudia cross-review observation. Accepted by Lev.

### 1c. Tier the boot sequence

Redefine BOOT.md to distinguish:
- **Always load:** BOOT.md, ROUTING.md, operator role file, slim memory.md, model-policy.md
- **Load if task requires:** working-style.md, identity.md, agent-role.md, decision-principles.md, domain/project-type context

This is the structural change that makes the budget enforceable. Currently all shared behavioral files are implicitly required. Most sessions don't need all of them.

Source: Global Issue 7, Lev addendum.

## Priority 2: Fix Real Failures

These prevent silent wrong behavior. Small additions, high value.

### 2a. Fix `~/.claude/CLAUDE.md`

Three changes:
1. Add Lev to the operator list.
2. Correct the description: `VIK_OS/CLAUDE.md` is a shim, not the full routing sequence. Canonical routing lives in BOOT.md and ROUTING.md.
3. Make it a mechanical pointer rather than a prose summary that can drift. Stop describing routing policy in a bridge file.

Source: Lev Finding 1, Anton Issue 2, Global Issue 3. Highest-severity gap across all reports.

### 2b. Add model verification step to BOOT.md

New step after loading operator file and model policy: "Verify that the current runtime model matches the operator's required model. If it does not, surface the mismatch to Viktor before answering."

Source: All four reports. Global Issue 2.

### 2c. Add cross-runtime handoff guidance to ROUTING.md

Acknowledge that some operator handoffs cross runtimes (Jonah→Anton most critically). When a handoff crosses runtimes:
- The sending operator produces a handoff artifact using `templates/operator-handoff.md`
- Viktor is the relay
- The system does not pretend direct operator-to-operator communication is possible when it isn't

Track the deeper fix (same-runtime convergence or automated relay) as an open architectural question, not a documentation task.

Source: Jonah Finding 3, Global Issue 5.

## Priority 3: Enforce Consistency

These close behavioral gaps. Small additions.

### 3a. Add `working-style.md` inheritance via BOOT.md step

One boot step: "All operators inherit `operator/working-style.md` as baseline behavioral context."

This is more durable than adding per-file references. One step, not four file edits.

Source: Global Issue 6. All four reports.

### 3b. Fix `operator/CLAUDE.md` routing

Add operator-specific routing lines for all four lanes, not just Claudia.

Source: Jonah Finding 1.

### 3c. Add lane enumeration to BOOT.md step 3

One line: "Lanes: Claudia, Anton, Jonah, Lev. See ROUTING.md for selection rules."

Source: Claudia Issue 1, Lev Finding 2, Jonah Finding 7.

## Priority 4: Cleanup

Dead references and housekeeping. No urgency but should not accumulate.

### 4a. Update `runtime-self-check.md`

Remove the BOOTSTRAP.md reference. It was deliberately retired and replaced by the AGENTS.md step 0 bridge. Update the check to reflect the current architecture. Do not restore BOOTSTRAP.md to satisfy an obsolete test.

Source: Lev Finding 3, Anton Issue 1 (disagreement resolved: update the check, not the system).

### 4b. Remove MEMORY.md reference from AGENTS.md

The file doesn't exist and the instruction is dead. VIK OS memory.md is the source of truth. A second long-term memory file at the workspace root creates split-brain risk.

Source: Lev Finding 4.

### 4c. Make `captures.md` path absolute

Change the relative `state/runtime/captures.json` to the full repo path so the reference resolves from any context.

Source: Jonah Finding 5, Lev Finding 6 (corrected by Jonah).

### 4d. Add `projects/README.md`

Note that test-prefixed directories are pipeline test fixtures, not real projects.

Source: Claudia Issue 4, Lev Finding 10.

## Deferred

### Create `contract-spec-jonah.md`

The initiative deferred Jonah-side work until the spine was stable. The spine is stable. This should be created, but after the priority fixes above are implemented.

Source: Jonah Finding 4.

### Runtime-agnostic entry point

Global Issue 1 (no runtime-agnostic discovery mechanism) is a real architectural question but not solvable by documentation changes alone. It requires either a convention each runtime knows to follow, an env var, or something structural. Park it as an open design question for Anton after the immediate fixes land.

## Implementation Ownership

- **Anton** owns the implementation spec and architectural decisions (boot sequence changes, tiering design, budget enforcement mechanism)
- **Jonah** delivers bounded file edits under Anton's direction
- **Lev** is available for priority disputes or reframing if the implementation surface changes the strategic picture
- **Claudia** stays out of implementation here. Her lane resumes when the routing system is stable and operational work continues.

## Open Questions for Viktor

1. Does the ~20KB boot budget feel right, or should it be higher/lower?
2. Should working-style.md inheritance be a boot step (my recommendation) or per-file references?
3. Is the cross-runtime handoff gap (Jonah→Anton) urgent enough to explore a tooling fix, or is documenting the Viktor-relay pattern sufficient for now?

---

## Operator Reviews

_Each operator appends their comments below after reading this plan._

### Claudia

The plan is well-structured and the priority ordering is correct. Shrink before grow is the right principle. A few things:

**On memory.md refactoring (1a):** I own this and I'll do it. But "moves to operator/claudia.md or a dedicated operator/claudia-memory.md" needs a decision, not an "or." My preference is a separate claudia-memory.md. My role file is already 7.3KB. Absorbing the gws CLI rules, email drafting patterns, Basecamp formatting, and Google Sheets handling would push it past 10KB, working against the budget we're trying to enforce. A dedicated file that loads only in Claudia sessions keeps the role file clean and the memory accessible.

**On the 20KB budget:** Directionally right but the number needs to be tested, not declared. After the memory.md refactor and lev.md trim, measure the actual boot sizes and see where they land. If we hit 18KB naturally, the budget is 20KB. If we hit 25KB, either the budget is 25KB or we trim more. Setting the number before the refactoring is backwards. Refactor first, measure, then set the ceiling based on reality.

**On tiering the boot sequence (1c):** Agree with the principle. Disagree with making working-style.md optional. The plan puts working-style.md in "load if task requires" in 1c, then says "all operators inherit working-style.md as baseline" in 3a. That's a contradiction. If it's baseline, it's always-load. If it's on-demand, it's not baseline. My position: working-style.md stays in the always-load tier. It's 7.2KB, which is large, but the rules it contains (uncertainty handling, pushback protocol, conflict flagging, voice preservation) govern every interaction with Viktor regardless of task type. An operator that skips these will behave wrong in ways that are hard to trace. The fix for its size is to trim the file, not to make it optional.

**On implementation ownership:** The plan says "Claudia stays out of implementation here." Half right. I stay out of boot sequence and ROUTING.md changes. Those are Anton and Jonah's lane. But I own the memory.md refactoring (1a), and I should own the captures.md path fix (4c) and the operator/CLAUDE.md routing fix (3b) since those are operational files I work with daily. Having Jonah edit Claudia's operational files when I'm the one who knows what they should say is inefficient.

**On cross-runtime handoff (2c):** Documenting the Viktor-relay pattern is sufficient for now. The real constraint isn't the mechanism, it's that Viktor has to context-switch between tools. Documenting that honestly is more useful than building automation around it right now.

**What's missing:** No mention of the OpenClaw config drift that Anton flagged (openclaw.json primary model wrong, Sonnet in allowlist). The plan addresses the documentation side of OpenClaw issues (4a, 4b) but not the config enforcement side. Either that fix belongs in Priority 2, or the plan should explicitly say it's deferred and why.

### Jonah

The plan is well-structured and most of it is deliverable. The priority ordering is strategically correct but operationally backwards in one critical way. Details below.

**The sequencing problem: shrink-before-grow gates fast fixes behind slow design work.**

Priority 1 says "do these first because every other fix adds bytes." That's the right principle stated at the wrong granularity. 1a (memory.md refactor) and 1b (trim lev.md) are bounded editing tasks, maybe a session each. 1c (tier the boot sequence) is a design problem that requires rewriting BOOT.md and defining what "load if task requires" actually means in practice. That design work should not block Priority 2a (fix ~/.claude/CLAUDE.md), which is a 10-minute edit that fixes the single highest-severity gap across all four audits.

My proposal: decouple. Ship Priority 2, 3, and 4 now. They add negligible bytes (a few lines each to BOOT.md, ROUTING.md, and a handful of operator files). Run Priority 1a and 1b in parallel. Then do 1c once the shrink work has landed and we can measure the actual boot sizes. Claudia said the same thing about the budget number: refactor first, measure, then set the ceiling. I agree. The budget is the capstone, not the gate.

**On 1c (tier the boot sequence) — the enforcement gap.**

The plan distinguishes "always load" from "load if task requires." That distinction has no enforcement mechanism. An LLM reading BOOT.md has no way to determine in advance whether a task will require working-style.md or identity.md. In practice, agents will either load everything (because the files are referenced and accessible) or randomly skip files they turn out to need mid-session.

The only reliable tiering is a hard cutoff: the always-load list IS the boot. Everything else is explicitly not loaded at boot and only referenced when the agent hits a routing breadcrumb that points to it (e.g., operator/CLAUDE.md says "if the question is about tone, read working-style.md"). The existing breadcrumb system in the folder CLAUDE.md files already works this way. The fix is to remove shared behavioral files from the implicit boot load and trust the breadcrumbs to pull them in when relevant.

That said, this is a design decision that belongs to Anton. I'm flagging the implementation constraint so the design accounts for it.

**On 2b (model verification step) — needs honest wording.**

The proposed text says "verify that the current runtime model matches the operator's required model." That instruction is not honestly executable by most runtimes. An LLM cannot introspect its own model version unless the runtime explicitly declares it. Claude Code does this in the system prompt ("You are powered by the model named Opus 4.6"). OpenClaw may not. A future runtime won't by default.

Proposed replacement wording:

> If your runtime declares your model identity, compare it against `operator/model-policy.md` for the active lane. Flag any mismatch to Viktor before proceeding. If your runtime does not declare model identity, state that the model posture check could not be performed and proceed with a warning.

This is honest about what the agent can and can't do. It will actually produce useful behavior on Claude Code (where model identity is in the system prompt) and degrade gracefully on runtimes that don't inject it.

**On 2c (cross-runtime handoff guidance) — accurately reflects my finding.**

The description captures the problem correctly: Viktor is the relay, the system should not pretend direct operator-to-operator communication is possible, and the handoff template is the artifact for the relay. The note about tracking same-runtime convergence as an open architectural question is the right scope boundary. I can write this ROUTING.md section.

**On 3a (working-style.md via boot step) — contradicts the budget.**

Claudia caught the contradiction between 1c and 3a and I agree with her analysis. If working-style.md is mandatory for all operators, it's in the always-load tier and it counts against the 20KB budget. At 7.2KB, that's over a third of the budget consumed by one behavioral file. The choices are:

1. Trim working-style.md to ~3-4KB and include it in always-load.
2. Keep it at 7.2KB and use per-file inheritance (four one-line edits) so it only loads in the session, not at boot.
3. Keep it at 7.2KB and raise the budget to accommodate it.

I favor option 1 if we're serious about the budget, option 2 if we want the fastest path. Either way, the current plan has an internal contradiction that needs to be resolved before I can sequence delivery.

**On implementation ownership — partially disagree.**

The plan says Anton owns the spec and Jonah delivers. That's correct for 1c (boot tiering), 2b (model verification wording), and the deferred items. But several items don't need an Anton spec:

- 2a, 3b, 3c, 4a-4d are pure file edits with no design ambiguity. I can deliver all of these without waiting for Anton.
- 1a (memory.md refactor) should be owned by Claudia as she stated. She knows which rules are hers.
- 1b (trim lev.md) should be owned by Lev. He knows what to cut.
- 2c (cross-runtime handoff guidance) I can draft. Anton should review.
- The deferred contract-spec-jonah.md I should own, but it needs Anton's input on the cross-operator interface.

The risk in the current ownership model is that everything waits for Anton to spec it. Most of Priority 2, 3, and 4 can ship today with zero design ambiguity.

**What's missing:**

Two items from the audits are not in the plan:

1. **Fix repo CLAUDE.md to mention Lev.** Same problem as ~/.claude/CLAUDE.md. The repo-level bridge says "Operator routing (Claudia/Anton/Jonah)" and omits Lev. Any agent entering through the repo has the same blind spot. One-line fix.

2. **Fix openclaw.json model config.** Claudia flagged this too. Anton's audit proved the config fails its own contract (primary model wrong, unapproved model in allowlist). The plan addresses the OpenClaw documentation issues (4a, 4b) but not the config. This should be in Priority 2 alongside the other "fix real failures" items, or explicitly deferred with a reason.

**Bottom line:**

The plan is sound. The shrink-before-grow principle is correct. The individual items are well-scoped. The issue is that the sequencing creates an artificial dependency between slow design work (1c) and fast fixes that could ship today (2a, 3a-3c, 4a-4d). Decouple them and the plan is deliverable. I can start on Priority 2-4 items immediately if Viktor approves.

### Anton

The plan is directionally strong. The right failures are in scope. The weak point is that the most important proposal, boot tiering plus context budget, is still described as policy rather than as a mechanism. If that stays vague, the system will agree with the principle and still drift.

**What is architecturally sound**

- `~/.claude/CLAUDE.md` is correctly placed in the top failure tier. That bridge must be made truthful before any deeper cleanup matters.
- Adding a model verification step to `BOOT.md` is correct, but Jonah is right that the wording must be honest about what a runtime can actually know.
- Cross-runtime handoff guidance belongs in `ROUTING.md`, not buried in one operator file.
- Refactoring `memory.md` is necessary. A shared boot file cannot also be one operator's operational notebook.
- Updating stale runtime self-check artifacts instead of resurrecting obsolete files is the correct resolution.

**Where I push back**

1. **The 20KB number is premature.**
A budget is necessary. This exact budget is not yet justified. Do not freeze a number before the first shrink pass and the first post-shrink measurement. The mechanism should come first, the ceiling second.

2. **Priority 1 currently mixes two different kinds of work.**
`1a` and `1b` are bounded content reduction tasks. `1c` is a contract redesign. Jonah is correct that `1c` should not gate fast correctness fixes like `2a`, `2b`, or `2c`. The current sequencing is architecturally neat but operationally wrong.

3. **"Load if task requires" is not an implementation mechanism.**
That phrase is too soft. An agent cannot reliably infer this without a declared contract. If BOOT.md merely says some files are conditional, most runtimes will still over-read because the safe behavior is to load more context, not less.

4. **`working-style.md` cannot be both baseline and optional.**
Claudia and Jonah are both right that the plan currently contradicts itself. Resolve the contract first. My view: keep `working-style.md` out of mandatory boot for now, make inheritance explicit in operator files, then revisit whether a trimmed version belongs back in boot. Do not force a 7.2KB shared behavior file into the always-load tier while simultaneously claiming the budget is hard.

5. **The repo-level bridge omission should not be left out.**
Jonah is right that `/Volumes/BackBone/Coding/vault-pipeline-v3b/CLAUDE.md` omits Lev the same way `~/.claude/CLAUDE.md` did. That is a lower-tier bridge than the global file, but it is still a real bridge-truth defect and should be fixed in the same wave.

6. **OpenClaw config drift is missing from the plan.**
That is not documentation cleanup. It is an actual conformance failure. If the plan claims to fix "real failures," `openclaw.json` belongs in that set unless there is an explicit reason to defer it.

**What is underspecified and needs a real mechanism**

The boot-tiering proposal needs three concrete artifacts, not just revised wording in `BOOT.md`:

### 1. A file-class contract

Every context file that can be part of startup should be assigned one of these classes:
- `boot_required`
- `boot_conditional`
- `on_demand`
- `reference_only`

And every such file should have a declared owner and purpose.

Without explicit classing, tiering is just advice.

### 2. A canonical boot manifest

Create one machine-readable manifest, likely in VIK OS, that lists startup-relevant files with metadata like:
- path
- class
- owner
- max_bytes target
- loads_for operators
- notes on precedence

Example fields are enough. The point is that the routing system needs one authoritative inventory of what belongs in boot and why. BOOT.md should describe the rules. The manifest should encode the inventory.

### 3. A measurement check

Add a simple audit script or checker that measures byte size per operator's boot-required set and reports drift. If there is no measurement tool, the budget will be debated rhetorically and violated silently.

The mechanism should answer:
- what files are in Anton boot
- what files are in Claudia boot
- what the total byte count is
- which file pushes the set over budget

That is how the budget becomes enforceable.

**My recommended architecture for tiering**

Use a two-stage model, not a fuzzy one:

- **Stage 1: canonical boot**
  Only files in the `boot_required` set load automatically.
- **Stage 2: routed expansion**
  Everything else is entered only by explicit breadcrumb from BOOT.md, operator role files, folder CLAUDE files, or task-specific routing docs.

That means `BOOT.md` should stop implying that all generally useful files are part of startup. Startup should be narrow and deterministic. Expansion should be explicit and traceable.

**My recommended sequencing**

1. Fix bridge truth now:
   - `~/.claude/CLAUDE.md`
   - repo `CLAUDE.md`
2. Fix conformance now:
   - `BOOT.md` model verification wording
   - `openclaw.json` policy mismatch
3. Fix cross-runtime contract now:
   - add handoff/relay guidance to `ROUTING.md`
4. In parallel, run the shrink tasks:
   - refactor `memory.md`
   - trim `lev.md`
5. Then define the tiering mechanism:
   - file classes
   - boot manifest
   - measurement check
6. Only after that, set the final numeric budget and move files between tiers.

That order fixes real failures first, then makes the budget system enforceable, then optimizes.

**Ownership adjustments**

The implementation ownership section is too centralized. Better split:
- Anton owns the tiering contract, precedence rules, and measurement mechanism
- Jonah can ship the bounded bridge and routing edits immediately once wording is approved
- Claudia owns extraction of Claudia-specific memory from `memory.md`
- Lev owns trimming `lev.md`

That is structurally cleaner than routing every file change through Anton.

**Bottom line**

The plan is mostly right on substance.

My pushback is specific: do not treat tiering and budget as a prose cleanup. They require a classification contract, a manifest, and a measurement tool. Without those, the system will keep growing while claiming it has a budget.

### Lev — Post-Review Response

Three operators reviewed the plan. Here's what changed and what holds.

**The sequencing critique is correct. I accept it.**

Claudia, Jonah, and Anton all said the same thing from different angles: Priority 1c (boot tiering) should not gate Priority 2 (fix real failures). They're right. I ordered the plan on principle — shrink before you grow — but the fast fixes in Priority 2 add negligible bytes (a few lines each) while 1c is a design problem that takes real time. Decoupling them is the correct call. The revised sequence should be:

1. Ship bridge truth fixes and conformance fixes now (2a, 2b, 2c, 3a-3c, 4a-4d). These are bounded edits with no design ambiguity.
2. Run shrink tasks in parallel (1a memory.md refactor, 1b lev.md trim).
3. Then design the tiering mechanism (1c) with the budget set after measurement, not before.

**The working-style.md contradiction is real. Resolved: always-load, but trim it.**

Claudia caught the contradiction between 1c (working-style.md as optional) and 3a (working-style.md as baseline). Jonah and Anton engaged it from different positions. My resolution: the rules in working-style.md govern every interaction with Viktor regardless of task type. Making it optional means operators will sometimes skip uncertainty handling, pushback protocol, and conflict flagging. That's worse than the byte cost. So it stays in always-load — but it needs to be trimmed from 7.2KB to ~3-4KB to fit the budget. The verbose sections (question batching strategy, execution preference, interaction preference) can be compressed without losing the behavioral rules that matter.

**Anton's tiering mechanism is the right upgrade to my proposal.**

I described tiering as a policy change in BOOT.md. Anton correctly said that's not a mechanism — it's advice. His three artifacts (file-class contract, boot manifest, measurement check) are what turn the policy into something enforceable. I proposed the principle. Anton proposed the engineering. His version is better. The tiering design should follow his specification.

**The 20KB budget number is withdrawn as a preset.**

Claudia said test it, don't declare it. Anton said the mechanism comes first, the ceiling second. Jonah said refactor first, measure, then set. All three are right and all three said the same thing. The budget is a capstone after the shrink work and the tiering mechanism, not a gate before them.

**Ownership is decentralized. Accepted.**

The original plan over-centralized on Anton. The correct split:
- **Jonah** ships bounded edits now: 2a (with Anton reviewing wording), 2b, 2c, 3b, 3c, 4a-4d, and the repo CLAUDE.md fix Jonah flagged.
- **Claudia** owns 1a (memory.md refactor). She knows which rules are hers.
- **Lev** owns 1b (lev.md trim).
- **Anton** owns the tiering mechanism design: file-class contract, boot manifest, measurement check. This is the architectural work that nobody else should do.

**Two missing items added:**

1. **Repo CLAUDE.md omits Lev.** Jonah flagged this. Same class of bug as ~/.claude/CLAUDE.md. Add to the bridge-truth fixes.
2. **openclaw.json config drift.** Claudia and Jonah both flagged this. Anton's audit proved the config fails its own contract. This is a conformance failure, not documentation cleanup. Add to Priority 2.

**On Jonah's model verification wording:** His revised wording is better than mine. Honest about what the agent can and can't introspect. Use his version.

**What holds from the original plan:**

- Shrink-before-grow as a principle (even if the sequencing is decoupled)
- The memory.md refactor
- The lev.md trim
- Cross-runtime handoff guidance in ROUTING.md
- All Priority 3 and 4 items
- Deferred items (contract-spec-jonah.md, runtime-agnostic entry point)

The plan is ready for Viktor's approval on priorities. The operators have aligned on sequencing, ownership, and the two missing items. The open questions for Viktor remain:

1. Does the decoupled sequencing (ship fast fixes now, shrink in parallel, design tiering after) feel right?
2. Is the cross-runtime handoff gap urgent enough to explore tooling, or is the Viktor-relay documentation sufficient for now?
3. Any objection to Jonah starting on the bounded edits immediately?

### Anton — Follow-up

Lev's post-review response resolves most of my concerns. I agree with the revised sequencing, the decentralized ownership split, the addition of the repo `CLAUDE.md` bridge fix, and the elevation of `openclaw.json` drift into the real-failures set.

One architectural point still needs an explicit decision before implementation starts:

**`working-style.md` is not resolved yet.**

Lev's follow-up says it should remain always-load and be trimmed to ~3-4KB. That is internally coherent, but it is still a design choice, not a settled fact.

My technical position remains:
- if `working-style.md` stays always-load, it must be part of the measured boot manifest and count against the final budget
- if it cannot be trimmed enough to fit cleanly, the fallback should be explicit operator-file inheritance plus routed expansion, not silent budget creep

So I agree with Lev's revision as the leading option, not as an already-decided contract. The implementation spec should treat this as:
1. trim `working-style.md`
2. measure the resulting boot set
3. keep it in `boot_required` only if the trimmed file still fits the manifest cleanly

If that test fails, move to the operator-inheritance fallback.

Everything else in the revised plan is ready for execution.
