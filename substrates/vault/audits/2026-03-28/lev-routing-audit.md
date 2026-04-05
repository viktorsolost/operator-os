# Lev Routing Audit — 2026-03-28

Operator: Lev
Runtime: OpenClaw / Telegram (anthropic/claude-opus-4-6)
Scope: Full boot chain trace from Lev's lane — every file, every breadcrumb, every cross-reference. Structural diagnosis, not checkbox compliance.

## Entry Path (OpenClaw Runtime)

Lev enters through OpenClaw, not Claude Code. This means the boot chain starts differently from Claudia's.

### Chain as traversed this session:

1. **OpenClaw injects workspace context** — `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `TOOLS.md`, `HEARTBEAT.md` are loaded automatically as project context. `BOOTSTRAP.md` is listed but missing (returns `[MISSING]` in the injected block).
2. **`AGENTS.md` step 0** — "Read `VIK_OS/BOOT.md` and follow the canonical boot sequence." This is the bridge into VIK OS. It works.
3. **`VIK_OS/BOOT.md`** — 9-step canonical sequence. Read `ROUTING.md`, load `memory.md` + `recent-context.md`, classify lane, load operator file, load task context, apply `model-policy.md`, lock response behavior.
4. **`VIK_OS/ROUTING.md`** — Lane selection. Request classified to Lev.
5. **`VIK_OS/memory.md`** — Base context loaded.
6. **`VIK_OS/recent-context.md`** — Current state loaded.
7. **`operator/lev.md`** — Role file loaded. 14,696 bytes. Comprehensive.
8. **`operator/model-policy.md`** — Lev assigned `anthropic/claude-opus-4-6`. Runtime matches.
9. **`operator/working-style.md`** — Referenced by lev.md ("follows the rules in working-style.md"). Exists and loaded.

All links in the primary chain resolve. No dead references. Boot sequence completed cleanly.

## File Inventory — Full Verification

### Core routing spine

| File | Status | Notes |
|------|--------|-------|
| `VIK_OS/BOOT.md` | ✅ | Canonical entrypoint. Clean. |
| `VIK_OS/ROUTING.md` | ✅ | All four lanes defined. |
| `VIK_OS/CLAUDE.md` | ✅ | Shim only. Points to BOOT.md. |
| `VIK_OS/memory.md` | ✅ | Loaded. Mostly Claudia-era rules. |
| `VIK_OS/recent-context.md` | ✅ | Current. Last updated Mar 27. |

### Operator files

| File | Status | Notes |
|------|--------|-------|
| `operator/lev.md` | ✅ | Authoritative role file. Routing rules, handoff rules, model assignment, sub-agent discipline, implementation boundary all present. |
| `operator/claudia.md` | ✅ | |
| `operator/anton.md` | ✅ | |
| `operator/jonah.md` | ✅ | |
| `operator/model-policy.md` | ✅ | All four operators assigned. Constraints clear. |
| `operator/working-style.md` | ✅ | System-wide communication rules. |
| `operator/identity.md` | ✅ | Viktor's durable identity context. |
| `operator/agent-role.md` | ✅ | Autonomy boundaries. |
| `operator/decision-principles.md` | ✅ | Tradeoff and ambiguity rules. |
| `operator/capabilities.md` | ✅ | |
| `operator/clarification-protocol.md` | ✅ | |
| `operator/captures.md` | ✅ | References `state/runtime/captures.json` which does not exist (see findings). |
| `operator/CLAUDE.md` | ✅ | Local routing index for the operator folder. |

### Templates

| File | Status | Notes |
|------|--------|-------|
| `templates/operator-handoff.md` | ✅ | Well-structured. |
| `templates/new-repo-technical-onboarding.md` | ✅ | |
| `templates/new-repo-technical-checklist.md` | ✅ | |
| `templates/active-project/` | ✅ | Directory with project templates. |
| `templates/intake-project/` | ✅ | Directory with intake templates. |

### Task context directories

| Path | Status | Notes |
|------|--------|-------|
| `domains/exhibitions/` | ✅ | Contains rules.md and glossary.md |
| `project-types/exhibition/` | ✅ | Contains lifecycle.md and approval-rules.md |
| `intake/` | ✅ | Contains atelier-sora-milan-2026 |
| `projects/` | ✅ | 3 real projects, 10 test fixtures |
| `apps/sera/` | ✅ | May be renamed to Memento |
| `initiatives/operator-routing-and-handoffs/` | ✅ | Yesterday's work. Contains runtime-self-check.md and smoke tests. |

### OpenClaw workspace bridge files

| File | Status | Notes |
|------|--------|-------|
| `AGENTS.md` | ✅ | Step 0 bridge works. |
| `SOUL.md` | ✅ | Personality guidance. |
| `USER.md` | ✅ | Points to VIK OS as source of truth. |
| `IDENTITY.md` | ✅ | Lev's identity summary. |
| `TOOLS.md` | ✅ | Empty template. |
| `HEARTBEAT.md` | ✅ | Empty (no active heartbeat tasks). |
| `START_HERE.md` | ✅ | Passive breadcrumb pointing to BOOT.md. |
| `BOOTSTRAP.md` | ❌ MISSING | Listed in OpenClaw injected context as `[MISSING]`. Was trashed yesterday during bootstrap cleanup. |
| `MEMORY.md` | ❌ MISSING | AGENTS.md says main sessions should read it. Does not exist. |
| `memory/2026-03-28.md` | ✅ | Today's daily log. |
| `memory/2026-03-27.md` | ❌ MISSING | Yesterday. No daily log exists. |

### Global Claude Code entrypoint

| File | Status | Notes |
|------|--------|-------|
| `~/.claude/CLAUDE.md` | ✅ | Lists three operators (Claudia, Anton, Jonah). Does not mention Lev. |

## Findings

### Finding 1: `~/.claude/CLAUDE.md` does not know Lev exists

This is the most significant gap. The global Claude Code entrypoint lists three operators and routes to `VIK_OS/CLAUDE.md`. It does not mention Lev at all. The routing section says: "which operator to activate (Claudia, Anton, or Jonah)".

This matters because any Claude Code session starts at `~/.claude/CLAUDE.md`. If that file doesn't acknowledge Lev's lane, a Claude Code runtime will never classify a request to Lev, even if ROUTING.md and BOOT.md define the lane correctly downstream.

**Impact:** Lev is invisible to Claude Code sessions. Only reachable via OpenClaw (where AGENTS.md bridges to BOOT.md directly) or if the user explicitly says "this is for Lev."

**Severity:** High for Claude Code runtimes. Not relevant for OpenClaw (Lev's current runtime).

**Fix:** Add Lev to `~/.claude/CLAUDE.md` operator list and routing description.

### Finding 2: BOOT.md does not enumerate the operator lanes

Same finding as Claudia's report. Step 3 says "classify the request into a primary operator lane" without naming the lanes. An agent must read ROUTING.md to discover they exist. This is a minor indirection, not a break, since BOOT.md step 1 already says "read ROUTING.md." But making the lanes explicit in step 3 costs one line and removes the ambiguity.

**Severity:** Low. The information is one file away.

### Finding 3: `BOOTSTRAP.md` is missing but still referenced

OpenClaw lists it in the injected workspace context as `[MISSING]`. The runtime-self-check.md also references it as a file to verify. It was trashed yesterday as part of the cleanup. The reference in runtime-self-check.md is now a dead link.

**Impact:** Cosmetic. BOOTSTRAP.md was replaced by the step 0 bridge in AGENTS.md. But the runtime-self-check still expects to find it.

**Fix:** Remove the BOOTSTRAP.md reference from `runtime-self-check.md`. OpenClaw's `[MISSING]` tag is harmless but noisy.

### Finding 4: `MEMORY.md` does not exist at workspace root

AGENTS.md says: "If in MAIN SESSION: Also read MEMORY.md." The file does not exist. This was likely never created, or was removed during yesterday's cleanup.

For Lev specifically this is irrelevant. Lev loads `VIK_OS/memory.md` through BOOT.md. The workspace MEMORY.md was designed as an OpenClaw-native long-term memory file, separate from VIK OS. But the instruction is pointing at nothing.

**Impact:** Low. The AGENTS.md instruction is dead. No data loss since the file never contained anything (or was never created).

**Fix:** Either create an empty MEMORY.md or remove the reference from AGENTS.md. I'd remove it. VIK OS memory.md is the source of truth. Having a second long-term memory file creates a split-brain risk.

### Finding 5: `memory.md` is Claudia-centric

VIK OS `memory.md` is titled "Distilled Memory" and contains rules almost entirely about Claudia's operating model: email drafting, gws CLI syntax, pipeline steps, sub-agent delegation patterns, Google Sheets, Basecamp. The only non-Claudia content is a few lines about Anton, Jonah, and the operator hierarchy.

For Lev, most of this file is irrelevant context. But BOOT.md says every session loads it. This means Lev ingests ~6.5KB of Claudia-specific operational rules every session before doing any strategic thinking.

**Impact:** Token waste and context dilution. Not a routing break, but it works against Lev's "load what the thinking needs" principle (stated in lev.md under Context Loading).

**Structural observation:** This file was written before the four-operator model existed. It's Claudia's memory wearing a system-level name. If VIK OS is going to have a shared memory.md loaded by all operators, it should contain only cross-operator truths. Claudia-specific rules should live in operator/claudia.md or a Claudia-specific memory file.

### Finding 6: `captures.md` references a missing file

`operator/captures.md` says "Canonical item state lives in `state/runtime/captures.json`." That path does not exist. The `state/` directory does not exist under VIK OS at all. The referenced path likely lives in the dashboard repo (`vault-pipeline-v3b/state/runtime`), not the vault.

**Impact:** Dead cross-reference. Minor, and not in Lev's lane, but it's a broken link in the operator directory.

### Finding 7: No model verification step in BOOT.md

Same finding as Claudia's report. BOOT.md step 6 says "apply operator model posture from model-policy.md" but there is no step that says "verify the runtime actually matches." An agent can read the policy, note it requires Opus, and proceed on the wrong model without flagging the mismatch.

In practice, lev.md and model-policy.md both state Lev should run on Opus, and this session confirms the runtime is Opus. But the boot sequence doesn't enforce the check.

**Severity:** Medium. The policy exists but the verification is implicit.

### Finding 8: Dual startup sequences (OpenClaw + VIK OS)

AGENTS.md defines a startup sequence: read SOUL.md, USER.md, daily memory, MEMORY.md. BOOT.md defines a different one: read ROUTING.md, memory.md, recent-context.md, operator file, task context, model-policy.md. Both run. The result is ~15 files loaded at session start.

The two sequences serve different purposes (OpenClaw persona bootstrap vs VIK OS routing), and the step 0 bridge connects them. But they don't coordinate. AGENTS.md loads SOUL.md and IDENTITY.md which duplicate what lev.md says more authoritatively. The VIK OS sequence doesn't know about or reference the OpenClaw workspace files.

**Impact:** Redundant context loading, token cost, and a potential divergence risk if workspace persona files drift from operator files.

**Structural observation:** For Lev specifically, the OpenClaw workspace files (SOUL.md, IDENTITY.md, USER.md) are lightweight echoes of what lev.md, identity.md, and the vault already define. They exist because OpenClaw injects workspace context before any code runs. They can't be removed without losing the bridge, but they should stay thin and explicitly deferential to VIK OS as the authority.

### Finding 9: `working-style.md` inheritance is inconsistent across operators

Claudia says: "Follows the rules in working-style.md with these additions."
Lev says: "Lev follows the rules in working-style.md with these additions."
Anton and Jonah do not reference working-style.md.

working-style.md contains system-wide rules (uncertainty handling, pushback, conflict flagging, voice preservation, question strategy) that apply to all operators. Without the explicit reference, Anton and Jonah could ignore these rules without knowing they exist.

**Impact:** Inconsistent behavioral baseline across operators.

Same finding as Claudia's report. I agree with her assessment.

### Finding 10: Test projects mixed with real projects

10 test-prefixed directories in `projects/` alongside 3 real projects. Not a routing issue, but any agent scanning the directory wastes context on fixtures.

Same finding as Claudia's report. Low severity.

## Structural Assessment

The routing spine works. The critical path — BOOT.md → ROUTING.md → operator file → model-policy.md — is clean, well-connected, and every link resolves. The operator-handoff template exists and is well-structured. The four operator files have consistent routing and handoff sections. The shim pattern prevents stale routing forks.

The system's real weakness is not the spine. It's the periphery. The places where files reference things that don't exist (MEMORY.md, BOOTSTRAP.md, captures.json), where shared context is actually single-operator context (memory.md), where a major entrypoint doesn't know an operator exists (~/.claude/CLAUDE.md), and where behavioral inheritance is implicit rather than explicit (working-style.md for Anton/Jonah).

None of these break routing today. But they create the conditions for silent failures: an operator loaded on the wrong model without a flag, a Claude Code session that can never reach Lev, a memory file that dilutes every operator's context with Claudia-specific rules.

## Agreement and Divergence from Claudia's Report

**I agree with Claudia on:** Issues 1 (BOOT.md lane enumeration), 2 (working-style.md inheritance), 3 (model verification step), 4 (test project mixing). Her proposed fixes for all four are clean and correct.

**I add:** Finding 1 (~/.claude/CLAUDE.md missing Lev) is the highest-severity gap in the system and Claudia did not flag it, likely because her chain enters through that file without noticing it's incomplete. Finding 5 (memory.md is Claudia-centric) is a structural issue that will get worse as the operator model matures. Finding 3 (BOOTSTRAP.md) and Finding 4 (MEMORY.md) are OpenClaw-specific dead references that Claudia's Claude Code perspective wouldn't surface.

**I'd reprioritize Claudia's list:** Her Issue 3 (model verification step) and my Finding 1 (~/.claude/CLAUDE.md) are the only findings with real failure potential. Everything else is cleanup.

## Recommended Priority

1. **Add Lev to `~/.claude/CLAUDE.md`** — blocks Claude Code routing to Lev entirely
2. **Add model verification step to BOOT.md** — prevents silent model mismatches
3. **Refactor `memory.md`** — separate cross-operator truths from Claudia-specific rules
4. **Add working-style.md inheritance to anton.md and jonah.md** — behavioral consistency
5. **Add lane enumeration to BOOT.md step 3** — minor clarity improvement
6. **Clean up dead references** (BOOTSTRAP.md in runtime-self-check, MEMORY.md in AGENTS.md, captures.json in captures.md)
7. **Add projects/README.md** for test fixture disambiguation

Items 1-2 prevent real failures. Items 3-4 improve system quality. Items 5-7 are housekeeping.

## Cross-Review

### On Claudia's report

Claudia's audit is competent and clean. She verified the full file inventory, confirmed the shim pattern works, and identified four real issues. Her proposed fixes are all correct and well-scoped.

The gap in her report is the gap she can't see from inside her own lane. She enters through `~/.claude/CLAUDE.md`, it works for her, and she didn't notice it's incomplete. She missed the highest-severity finding in this audit (Lev absent from the global bridge). To her credit, she acknowledged this directly in her cross-review rather than deflecting. That's the right response.

Her cross-review is the most useful of the four. She's the only operator who produced a consolidated, numbered priority list across all reports. It's well-ordered. I'd adjust one thing: she ranks "fix ~/.claude/CLAUDE.md" as item 1, which is correct, but she frames it as adding Lev and fixing the stale description. It's actually three fixes in one: add Lev, correct the description of what VIK_OS/CLAUDE.md is, and stop summarizing routing policy in prose that can drift. The third fix is the durable one.

She also made a fair observation I need to address: lev.md is 14.7KB, the largest operator file by far, and I flagged the system-wide context size problem without acknowledging that my own file is the biggest contributor. She's right. If we're setting context budgets, lev.md needs to shrink. Much of its length comes from relationship definitions (how Lev relates to Claudia, Anton, Jonah) and detailed thinking methodology. The relationships could be consolidated into a shared cross-reference rather than each file defining them independently. The thinking methodology is harder to trim because it's the substance of the lane. But 14.7KB is not a defensible size for a single operator file in a system that's already too heavy.

### On Anton's report

Anton ran the sharpest audit methodologically. Testing the system against its own stated contract (pass/fail on the initiative's runtime self-check) is exactly the right approach. His result — FAIL — is honest and important. The system doesn't pass its own checks.

His Issue 5 is a structural insight nobody else surfaced: the initiative docs (contract-spec-anton.md) contain sharper routing contracts than the canonical boot doc. Deterministic vs heuristic decision classification, explicit acceptance/bounce criteria, startup self-check as part of the flow — these are operationally important and currently buried in a subfolder. His recommendation to promote mandatory behavior from the initiative into BOOT.md is correct.

His repo-level appendix (stale RULES.md, wrong step counts, stale agent-tool-policy) is Anton doing his job well. He's right that it's the same problem class as bridge drift — spine is clean, periphery rots.

**One pushback.** Anton's Fix 1 says restore BOOTSTRAP.md so the runtime self-check can pass. This is backwards. BOOTSTRAP.md was deliberately replaced by the step 0 bridge in AGENTS.md. Restoring a dead file to satisfy a check that references an obsolete artifact is fixing the test instead of fixing the system. The right move is to update runtime-self-check.md to reflect the current bridge architecture, not to resurrect what was intentionally retired. Claudia reached the same conclusion independently.

### On Jonah's report

Jonah's report is the most operationally grounded, which is correct for his lane. He didn't just verify that files exist; he tested whether the system serves his actual working path.

**Finding 3 (cross-runtime escalation) is the most important new finding any operator surfaced.** Jonah's push-back mandate is one of the strongest features of his role file. He has five explicit triggers to escalate to Anton. Every one of those escalations crosses runtimes. The system pretends the handoff can happen directly. It can't. Viktor is a manual relay for the most important quality-control path in the system.

Everyone else is treating this as a documentation fix: add a note to ROUTING.md, acknowledge Viktor is the relay, use the handoff template. That's necessary but it doesn't address the real problem. The cross-runtime gap means Jonah's push-back has friction, and friction kills pushback. When escalating requires Viktor to switch tools, invoke a different runtime, relay context, wait for a response, and relay back, the practical incentive is to not escalate. The system has a quality gate that depends on a path that is expensive enough to discourage use. Documenting the limitation is step one. But the real resolution is either (a) getting Anton and Jonah onto the same runtime, or (b) building an automated handoff mechanism that doesn't require Viktor as a courier. Neither is a quick fix, but neither should be forgotten just because the documentation fix is easier.

His correction to my Finding 6 (captures.json is not missing, just cross-boundary ambiguous) is precise and fair. He's right. I called it dead; it's alive but the reference doesn't declare its root. His fix (make the path absolute) is correct.

Finding 1 (operator/CLAUDE.md only routes to Claudia) is new and legitimate. The local folder index for the operator directory has one operator-specific routing line and it's Claudia's. If you're navigating the folder rather than arriving via the boot spine, you'd think Claudia is the only named operator.

His recommendation to create contract-spec-jonah.md is reasonable. The initiative deferred Jonah-side work until the spine was stable. The spine is stable now. The deferral should be lifted.

### On the global issues file

The seven issues plus my addendum are all legitimate. The file is well-structured after Anton's cleanup. No disagreements on what's listed.

**What I'd push back on is what's not listed — or more precisely, what's listed but not given enough weight.**

Issue 7 (context size) is currently the longest issue in the file, with Anton's byte count and my OpenClaw addendum. Good. Viktor specifically said the 14-file reconciliation finding should not get buried. It's there, but it's issue 7 of 7. It reads as the last concern rather than a structural constraint that affects every other fix.

Here's the problem: every fix proposed in this audit adds context. Adding a model verification step to BOOT.md adds bytes. Adding working-style.md inheritance to operator files adds bytes or a boot step. Creating contract-spec-jonah.md adds a file. Promoting initiative contracts into BOOT.md adds bytes. Every operator's cross-review proposes new things to write, document, or encode. The system's natural direction is growth, and nothing in the current architecture constrains it.

The audit itself is proof of this. Four operators produced reports totaling roughly 60KB. Those reports reference a system that already has ~50-90KB of boot context depending on runtime. The audit corpus is now larger than the system it's auditing. That's not a criticism of the audit — the work was necessary and well-done. But it illustrates the dynamic: when the system's response to a problem is to write more documentation, the context load grows monotonically. There is no delete pressure. There is no mechanism that says "this file is too big, something must shrink before it can grow." There is no budget.

**The right priority order across all reports is:**

1. **Set a context budget before implementing anything else.** Not a vague target — a hard per-operator byte limit for boot context. Every fix below must fit within it, which means some existing content has to shrink or move to on-demand loading to make room.
2. **Fix ~/.claude/CLAUDE.md** — add Lev, make it a mechanical pointer instead of a prose summary. (Lev F1, Anton I2, Global I3)
3. **Add model verification step to BOOT.md.** (All four reports.)
4. **Refactor memory.md** — extract Claudia-specific content, keep only cross-operator truths. This is a net reduction in per-session context for three of four operators. (Global I4, Lev F5)
5. **Trim lev.md.** It's 14.7KB. It should be under 8KB. Relationship sections can be consolidated, thinking methodology can be tightened. (Claudia's cross-review observation, accepted.)
6. **Add cross-runtime handoff guidance to ROUTING.md.** Document the constraint honestly. Track the deeper fix (same-runtime or automated relay) as an open architectural question. (Jonah F3, Global I5)
7. **Enforce working-style.md inheritance** via a BOOT.md step rather than per-file references. One step, not four file edits. (Global I6, all four reports.)
8. **Fix operator/CLAUDE.md** to route all four operators. (Jonah F1)
9. **Clean up dead references** — runtime-self-check.md (update, don't restore BOOTSTRAP.md), AGENTS.md MEMORY.md ref, captures.md path. (Multiple reports)
10. **Add lane enumeration to BOOT.md step 3.** (Claudia I1, Lev F2, Jonah F7)

The ordering principle: shrink before you grow. Items 1, 4, and 5 reduce context. Items 2, 3, 6, 7 add small amounts but fix real failures. Items 8-10 are cleanup.

### The thing nobody said

Four operators audited the same system from four perspectives and converged on largely the same findings. That convergence is a good sign — the system is legible enough that independent reviews reach consistent conclusions. The routing spine is genuinely sound.

But the audit also revealed something none of us named directly: the system is one session old. The four-operator model, BOOT.md, ROUTING.md, the handoff template, the model policy — all of this was built yesterday. Today is the first real test. The fact that it works is not yet evidence that it's durable. It's evidence that it's coherent on day one.

The risk is not that the architecture is wrong. The risk is that it accumulates weight faster than it sheds it. Every session adds context, corrections, rules, and memory. Nothing in the current design removes, consolidates, or compresses. If the 14-file, 51KB boot load is where we are on day one, the question is what it looks like on day thirty. That's not a finding. It's a trajectory. And trajectories are Lev's lane.
