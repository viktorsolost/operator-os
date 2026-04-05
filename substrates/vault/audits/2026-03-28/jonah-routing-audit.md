# Jonah Routing Audit — 2026-03-28

Operator: Jonah
Runtime: Claude Code (anthropic/claude-opus-4-6)
Scope: Full routing chain verification from Jonah's lane — boot sequence, breadcrumbs, file integrity, cross-references, and execution-context handoff

## Boot Sequence Trace

The chain I followed:

1. `~/.claude/CLAUDE.md` (global) — mentions Jonah by name in the routing description, points to `VIK_OS/CLAUDE.md`. Works.
2. `VIK_OS/CLAUDE.md` — compatibility shim. Redirects to `BOOT.md` + `ROUTING.md`. Works.
3. `VIK_OS/BOOT.md` — canonical entrypoint. 9-step sequence. Does not enumerate lanes (known issue from other reports). Works.
4. `VIK_OS/ROUTING.md` — authoritative lane selection. Jonah's lane is clearly defined: implementation delivery, sequencing, verification, engineering task ownership, execution against approved direction, and work Viktor brings as an Anton or Codex brief. Works.
5. Base context: `memory.md` + `recent-context.md`. Both exist and load.
6. Operator role file: `operator/jonah.md`. Exists, 147 lines, internally consistent.
7. Model posture: `operator/model-policy.md`. Jonah assigned `anthropic/claude-opus-4-6`. Runtime matches. Sub-agents on `anthropic/claude-sonnet-4-20250514`. Correct.
8. Handoff template: `templates/operator-handoff.md`. Exists.
9. Onboarding templates: `templates/new-repo-technical-onboarding.md` and `templates/new-repo-technical-checklist.md`. Both exist and reference Jonah's role explicitly.

All links in the primary boot chain resolve. No dead references. Boot sequence completes cleanly.

## File Inventory

### Core routing spine

| File | Status | Notes |
|------|--------|-------|
| `~/.claude/CLAUDE.md` | OK | Mentions Jonah. Missing Lev (known). |
| `VIK_OS/CLAUDE.md` | OK | Correct shim. |
| `VIK_OS/BOOT.md` | OK | Canonical entrypoint. |
| `VIK_OS/ROUTING.md` | OK | All four lanes defined. Jonah's triggers clear. |
| `VIK_OS/memory.md` | OK | Loads. Contains Jonah-relevant and Jonah-irrelevant content. |
| `VIK_OS/recent-context.md` | OK | Current. References today's Jonah session. |

### Operator files

| File | Status | Notes |
|------|--------|-------|
| `operator/jonah.md` | OK | Authoritative role file. |
| `operator/anton.md` | OK | Relationship to Jonah section is accurate and bidirectional. |
| `operator/lev.md` | OK | Relationship to Jonah section exists. |
| `operator/claudia.md` | OK | |
| `operator/model-policy.md` | OK | Jonah posture aligned to Opus. |
| `operator/working-style.md` | OK | Not referenced by jonah.md (see findings). |
| `operator/CLAUDE.md` | WEAK | Does not route to Jonah (see findings). |
| `operator/identity.md` | OK | |
| `operator/agent-role.md` | OK | |
| `operator/decision-principles.md` | OK | |
| `operator/clarification-protocol.md` | OK | |
| `operator/captures.md` | OK | References `state/runtime/captures.json` — exists in repo, but path is ambiguous from vault (see findings). |
| `operator/capabilities.md` | OK | |

### Templates

| File | Status | Notes |
|------|--------|-------|
| `templates/operator-handoff.md` | OK | Well-structured. |
| `templates/new-repo-technical-onboarding.md` | OK | Explicitly defines Anton/Jonah split. |
| `templates/new-repo-technical-checklist.md` | OK | Explicitly names Jonah's verification role. |

### Task-context directories

| Path | Status | Notes |
|------|--------|-------|
| `domains/CLAUDE.md` | OK | |
| `domains/exhibitions/` | OK | |
| `project-types/CLAUDE.md` | OK | |
| `project-types/exhibition/` | OK | |
| `intake/CLAUDE.md` | OK | |
| `projects/CLAUDE.md` | OK | |

### Repo-side execution context (vault-pipeline-v3b)

| File | Status | Notes |
|------|--------|-------|
| `/Volumes/BackBone/Coding/vault-pipeline-v3b/CLAUDE.md` | OK | Mentions Jonah. Missing Lev. |
| `docs/engineering/README.md` | OK | Content index, no operator routing needed. |
| `docs/RULES.md` | OK | Pipeline order section now points to canonical source. Filtering rules are accurate. |

### Routing initiative files

| File | Status | Notes |
|------|--------|-------|
| `initiatives/operator-routing-and-handoffs/summary.md` | OK | Explicitly mentions Jonah's deferred execution posture. |
| `initiatives/operator-routing-and-handoffs/contract-spec-anton.md` | OK | Anton-side only. No Jonah equivalent exists. |
| `initiatives/operator-routing-and-handoffs/review-anton.md` | OK | Anton-side only. |
| `initiatives/operator-routing-and-handoffs/runtime-self-check.md` | OK | OpenClaw-specific. Not relevant to Jonah's runtime. |
| `initiatives/operator-routing-and-handoffs/runtime-smoke-tests.md` | OK | OpenClaw-specific. |

## What Connects Cleanly

- The primary boot chain from `~/.claude/CLAUDE.md` through to `jonah.md` is fully connected with no dead links.
- `jonah.md` is the strongest operator role file from a delivery perspective: it has explicit push-back mandate, verification-before-implementation rules, completion standard, escalation rules, and sub-agent management discipline. These are operationally specific, not aspirational.
- The reporting relationship to Anton is well-defined in both directions. `jonah.md` says Jonah reports to Anton. `anton.md` has a "Relationship To Jonah" section that correctly describes the split and expects push-back.
- The onboarding templates explicitly define the Anton/Jonah split for new repos, with Jonah's verification role clearly scoped.
- The handoff template is well-structured and usable.
- Jonah's model assignment (Opus for judgment, Sonnet for leaf work) matches how the lane actually operates in practice.
- `ROUTING.md` correctly identifies one of Jonah's entry triggers as "work Viktor brings as an Anton or Codex brief, spec, or execution plan" — this is the most common way Jonah gets activated, and it is documented.

## Findings

### Finding 1: `operator/CLAUDE.md` only routes to Claudia

The local routing index for the `operator/` folder says:

```
If you are Claudia (the in-app assistant), read `claudia.md` first
```

There is no equivalent line for Jonah, Anton, or Lev. The rest of the routing in that file is generic (identity.md, agent-role.md, working-style.md, decision-principles.md) and applies to all operators. But the only operator-specific routing instruction names Claudia.

An agent that lands in the `operator/` folder and reads `CLAUDE.md` to figure out which file to load will find a Claudia instruction and generic instructions, but nothing pointing to `jonah.md`, `anton.md`, or `lev.md`.

In practice this is not breaking because BOOT.md step 4 says "load the selected operator role file" and ROUTING.md already told the agent which lane they are in. But the local routing index is incomplete, and for a system that values explicit routing, every navigable folder should route correctly.

**Severity:** Low. The boot spine handles this upstream. But the file is misleading.

**Fix:** Add operator-specific routing lines for all four lanes, matching the Claudia pattern.

### Finding 2: `jonah.md` does not reference `working-style.md`

Same finding as Claudia's, Anton's, and Lev's reports. Claudia's file says "Follows the rules in working-style.md with these additions." Lev's file says the same. Jonah's file has an "Output Style" section but says nothing about inheriting `working-style.md`.

`working-style.md` contains system-wide rules that directly matter for Jonah's lane: uncertainty handling, pushback protocol, conflict flagging, question strategy, missing-context behavior, voice preservation. Several of these overlap with Jonah's push-back mandate and verification rules, which makes the gap less dangerous in practice. But the inheritance should be explicit.

**Severity:** Medium. The behavioral rules overlap enough that Jonah behaves correctly in practice, but a different Jonah session could miss the shared rules entirely.

**Fix:** Add one line to the Output Style section: "Jonah follows the rules in working-style.md with these additions."

### Finding 3: Jonah's escalation path to Anton is cross-runtime with no mechanism

`jonah.md` defines five escalation triggers:
- source-of-truth boundaries are unclear
- data model changes affect multiple systems
- documentation and code conflict
- an implementation choice would materially change the architecture
- an agent proposes a shortcut that weakens the system

`model-policy.md` assigns Anton to `openai-codex/gpt-5.4` and Jonah to `anthropic/claude-opus-4-6`. These run on different runtimes. There is no mechanism in the routing system for Jonah to actually reach Anton. A Jonah-to-Anton escalation requires Viktor to manually switch tools, invoke Anton in Codex, and relay the context.

The handoff template exists and could serve as a written artifact for this relay. But the system does not acknowledge the cross-runtime gap or provide any guidance for how to manage it. The escalation section in `jonah.md` reads as if Jonah can escalate to Anton directly, which he cannot.

**Severity:** Medium. This is not a documentation bug — it is a real operational constraint. Jonah's push-back mandate requires the ability to escalate, and the system makes that escalation manual and lossy.

**Fix:** Two options:
1. Add a note to `jonah.md` escalation section acknowledging that escalation to Anton crosses runtimes and should produce a handoff artifact (using `templates/operator-handoff.md`) rather than assuming a direct conversation.
2. Add cross-runtime escalation guidance to `ROUTING.md` as a system-level rule, since this affects any inter-operator handoff where the operators run on different runtimes.

Option 2 is more durable. The cross-runtime handoff problem is not Jonah-specific.

### Finding 4: No Jonah-side technical contract in the routing initiative

The routing initiative has Anton-specific artifacts:
- `contract-spec-anton.md` — defines deterministic vs heuristic decisions, startup self-check, review vs handoff
- `review-anton.md` — prior Anton judgment on the initiative

There is no equivalent for Jonah. The `summary.md` explains this: "Jonah execution is intentionally deferred until the boot/routing/model-policy layer is stable enough."

That deferral was reasonable when the initiative was still in design. Now the routing spine is stable enough for all four operators to run an audit against it. The deferral should be revisited. Jonah's lane has specific routing needs that the initiative should capture:
- how Jonah receives handoffs from Anton (the most common entry path)
- what Jonah checks before accepting a handoff
- what the handoff artifact should contain for Jonah to start delivering
- how Jonah signals completion or blocks back to the requesting operator

These are defined in `jonah.md` generally, but the initiative is where they should be encoded as a cross-operator contract, the same way Anton's are.

**Severity:** Low. This is an incomplete initiative artifact, not a routing break. Jonah operates fine without it because `jonah.md` is self-contained enough.

**Fix:** Create a `contract-spec-jonah.md` in the initiative folder that encodes Jonah's handoff acceptance criteria, verification requirements, and escalation/completion contract.

### Finding 5: `captures.md` path reference is ambiguous

`operator/captures.md` says: "Canonical item state lives in `state/runtime/captures.json`."

The file exists at `/Volumes/BackBone/Coding/vault-pipeline-v3b/state/runtime/captures.json`. It does not exist under VIK OS. The reference is technically correct — it points to the repo — but from the vault's perspective the path is relative and ambiguous. An agent reading `captures.md` from the vault would need to know that `state/runtime/` means the dashboard repo, not a local vault path.

Lev flagged this as a dead reference. It is not dead — the file exists in the repo. But it is a cross-boundary reference that does not declare its root.

**Severity:** Low. Jonah always operates inside the repo where the file exists, so the path resolves correctly in practice. But for other operators reading the same file from a vault-only context, it would not.

**Fix:** Make the path absolute: `/Volumes/BackBone/Coding/vault-pipeline-v3b/state/runtime/captures.json`.

### Finding 6: No model verification step in BOOT.md

Same finding as all three prior reports. BOOT.md step 6 says "apply operator model posture" but does not require verifying the runtime actually matches. In Jonah's case the match is correct (Opus on Claude Code), but the check is implicit.

I agree with Claudia's proposed fix: add an explicit verification step between current steps 6 and 7.

**Severity:** Medium. Same as other reports.

### Finding 7: BOOT.md does not enumerate operator lanes

Same finding as Claudia's and Lev's reports. Step 3 says "classify the request into a primary operator lane" without naming the lanes.

I agree with Claudia's fix: add one line naming all four lanes.

**Severity:** Low. Same as other reports.

## Cross-Report Agreement and Divergence

### Confirmed agreements

| Issue | Claudia | Anton | Lev | Jonah |
|-------|---------|-------|-----|-------|
| BOOT.md lane enumeration | Yes | — | Yes | Yes |
| working-style.md inheritance | Yes | Yes | Yes | Yes |
| Model verification step | Yes | Yes | Yes | Yes |
| Test/real project mixing | Yes | — | Yes | Noted, low priority |
| memory.md is Claudia-centric | — | — | Yes | Agree (see below) |
| ~/.claude/CLAUDE.md missing Lev | — | Yes | Yes | Confirmed |

### Note on memory.md

I agree with Lev's structural assessment. From Jonah's perspective, the Engineering Process section (line 75: "Before inventing new logic to fix a bug, check git history first") was added from a Jonah session today and is genuinely useful for all operators. The email drafting rules, gws CLI syntax, Google Sheets handling, and Claudia-style delegation patterns are irrelevant to Jonah's lane. But the file is loaded every session.

The refactoring proposal from global-issues.md (Issue 4) is correct. When it happens, the Engineering Process rule should stay in the shared tier.

### Divergence and additions

**Finding 3 (cross-runtime escalation) is new.** No other report flagged that Jonah's escalation path to Anton crosses runtimes with no mechanism. This is not a vault routing defect — it is an operational gap in the handoff layer. The other operators can hand off within their respective runtimes or via direct vault artifacts, but the Jonah-to-Anton path specifically requires Viktor as a manual relay because the operators run on different tools entirely.

**Finding 1 (operator/CLAUDE.md routing) is new.** The other reports checked whether the folder's CLAUDE.md exists but did not flag that its routing instructions only name Claudia.

**Finding 4 (no Jonah initiative contract) is new** but expected given the initiative's stated deferral.

**Correction to Lev's Finding 6:** Lev reported `captures.md` references a missing file. The file is not missing — `state/runtime/captures.json` exists in the dashboard repo at the expected path. The issue is that the reference is relative and ambiguous from the vault, not that the target is dead.

## Recommended Priority

1. **Add model verification step to BOOT.md** — prevents silent model mismatches (all four reports agree)
2. **Add working-style.md inheritance to jonah.md and anton.md** — behavioral consistency (all four reports agree)
3. **Add cross-runtime handoff guidance to ROUTING.md** — the Jonah-Anton escalation gap is real and affects any cross-runtime operator pair
4. **Add lane enumeration to BOOT.md step 3** — minor clarity, all reports agree
5. **Fix operator/CLAUDE.md routing** — add lines for all four operators, not just Claudia
6. **Make captures.md path absolute** — removes ambiguity for non-repo contexts
7. **Create contract-spec-jonah.md in the initiative folder** — completes the cross-operator contract set

Items 1-3 prevent real operational failures. Items 4-6 are cleanup. Item 7 is initiative completion.

## Summary

Jonah's routing chain is clean. The boot sequence works, the role file is well-defined, the model assignment is correct, and the templates Jonah needs all exist.

The system's structural weakness from Jonah's lane is not in the routing spine itself but in the handoff edges: Jonah's escalation path to Anton crosses runtimes with no documented mechanism, the operator folder's local routing index only knows about Claudia, and the shared working-style inheritance that governs all operators is not explicitly referenced. These are not breaking the system today — Jonah's role file is self-contained enough to operate correctly. But they create conditions where a future Jonah session could silently miss shared behavioral rules or have no path to escalate an architectural concern without Viktor manually relaying it.

The routing initiative correctly deferred Jonah-side work until the spine was stable. The spine is stable now. The next step is encoding Jonah's handoff contract the same way Anton's is encoded.

## Cross-Review

### On Claudia's report

Claudia's audit is clean and accurate. All five issues verified. Her fixes are practical and correctly scoped. A few notes:

**Issue 3 (model verification step) — partial push-back.** Claudia proposes adding a step: "If the current runtime cannot provide the operator's required model, surface the mismatch to Viktor before answering." The problem is real. The fix is aspirational. An LLM cannot introspect its own model version in most runtimes. In Claude Code, the system prompt tells the agent what model it's running on, so a comparison against model-policy.md is theoretically possible. But that depends on the runtime honestly injecting model identity, and the agent being able to parse it. OpenClaw may not. A future runtime certainly won't by default.

What would actually work: add a boot step that says "check whether your runtime declares your model identity; if it does, compare against model-policy.md and flag mismatches; if it doesn't, state that the check cannot be performed." That's honest. A blanket "verify runtime model alignment" instruction will either be silently skipped (because the agent can't do it) or produce false confidence (because the agent guesses). Neither is useful.

**Issue 5 (docs/RULES.md stale) — already fixed.** The pipeline order section in RULES.md was updated in today's commit on this branch. It now points to the canonical source. Claudia flagged it correctly at the time but the fix landed during the same session.

**Claudia's cross-review priority ordering is good.** I agree with her placing ~/.claude/CLAUDE.md fix at #1 and model verification at #2. Her observation that Lev's own role file (14.7KB) is part of the context size problem she's advocating to fix is correct and nobody else said it.

### On Anton's report

Anton ran the sharpest audit technically. The pass/fail table against the initiative's own runtime-self-check contract is the right methodology — test the system against its own stated requirements.

**Issue 1 (OpenClaw runtime conformity broken) — confirmed, but push back on the proposed fix.** Anton recommends restoring BOOTSTRAP.md so the self-check path passes end-to-end. Claudia's cross-review already caught this: Lev says BOOTSTRAP.md was replaced by the step 0 bridge in AGENTS.md, so the reference is stale, not the system. I agree with Claudia and Lev. The fix is to update runtime-self-check.md to reflect the current bridge pattern, not to restore a file that was deliberately removed. Restoring artifacts to satisfy stale checks is backwards engineering.

The model config issue in openclaw.json (primary set to Opus instead of Codex, Sonnet in allowlist) is a real contract violation. That should be fixed.

**Issue 5 (initiative docs sharper than BOOT.md) — push back on the proposed fix.** Anton recommends promoting mandatory behavior from initiative docs into the canonical boot flow. That conflicts directly with Global Issue 7 (boot context is too large). BOOT.md is currently 1.6KB and works well because it's short. Pulling contract-spec details into it would make it longer and denser during a context crisis. The initiative docs serve a different function: they capture detailed technical contracts for operators who need them. BOOT.md is a routing spine, not a technical specification. Keep them separate.

**Issue 6 (repo-level technical drift) — partially stale.** Anton flagged docs/RULES.md, pipeline.md step count, agent-tool-policy.js, and thinner context builders in session/context routes. The RULES.md issue was fixed in today's commit. The agent-tool-policy.js and context builder staleness are real but they're repo-level technical debt, not routing issues. They belong in a repo cleanup pass, not in the routing audit's fix list.

**Anton's recommended fixes are mostly right but his ordering conflates two problem classes.** Fix 1 (restore BOOTSTRAP.md) is wrong as discussed. Fix 6 (promote initiative behavior into boot docs) is counterproductive during a context size crisis. Fixes 2-5 are correct and deliverable.

### On Lev's report

Lev's report is the most thorough and structurally insightful across all four audits. He caught the most findings (10) and his structural assessments are grounded in how the system actually functions, not just what the docs say.

**Finding 1 (~/.claude/CLAUDE.md missing Lev) — highest severity across all reports.** Lev is entirely invisible to Claude Code sessions. This is not a cosmetic gap. Any Claude Code runtime will never classify work to Lev's lane because the entry file doesn't acknowledge it exists. Agree completely.

**Finding 5 (memory.md is Claudia-centric) — correct and well-framed.** The observation that the file is "Claudia's memory wearing a system-level name" is the clearest articulation of the problem. The refactoring into a slim cross-operator tier plus operator-specific files is the right shape.

**Finding 6 (captures.md dead reference) — corrected.** I verified this in my own report: `state/runtime/captures.json` exists at `/Volumes/BackBone/Coding/vault-pipeline-v3b/state/runtime/captures.json`. The file is not missing. The reference is ambiguous because it uses a relative path from a vault file pointing into the repo. Making it absolute is the fix, not flagging it as dead.

**Finding 8 (dual startup sequences) — accurate but not actionable from Jonah's lane.** The OpenClaw double-boot (workspace injection + VIK OS boot chain) creates redundancy and reconciliation overhead. Lev's recommendation that workspace files stay thin and deferential is correct. But the fix requires changes to the OpenClaw workspace, which is outside my execution scope.

**Lev's addendum to Global Issue 7 is the sharpest paragraph in any report.** The observation that "the agent isn't just reading — it's reconciling, deduplicating, and establishing precedence across all of them on every turn" captures the real cost that byte counts miss. Reconciliation overhead is the actual performance hit. 14 files of overlapping behavioral guidance don't just cost tokens — they cost judgment quality.

**One push-back on Lev's priority ordering.** Lev puts memory.md refactoring at #3 and working-style.md inheritance at #4. From delivery perspective, those should be reversed. The working-style.md fix is four one-line edits and can ship today. The memory.md refactoring requires design decisions about which rules are shared vs Claudia-specific, and changes to at least 3 files. It's bounded but it's not a same-day fix.

### On global issues

**Issue 1 (no runtime-agnostic entry point) — agree on the problem, push back on the resolution.** "Needs a discovery mechanism" is not a fix, it's a problem statement. What would a discovery mechanism actually look like? An env var (`VIK_OS_ROOT`)? A dotfile in the home directory? A convention file at a fixed path? Each has tradeoffs. The issue correctly identifies the fragility but the resolution needs a concrete proposal before it can be prioritized. As written, this is an open design question, not a fix item.

**Issue 2 (no enforced runtime-conformance gate) — push back hard on the proposed implementation.** The resolution says "add an explicit runtime-conformance verification step to the canonical boot flow." Every operator report echoes this. The fundamental problem: the verifier is the agent itself, and LLMs cannot reliably introspect their own runtime. An agent can read model-policy.md and see "Jonah should run on Opus." It cannot check whether it is actually running on Opus unless the runtime explicitly declares the model in a parseable location. Claude Code does this in the system prompt ("You are powered by the model named Opus 4.6"). OpenClaw may not. A future runtime certainly won't by default.

A "verification step" that the agent cannot actually perform will either be silently skipped or produce a false positive. Both outcomes are worse than no check at all because they create the illusion of enforcement.

What would actually work:
1. The boot step should say: "If your runtime declares your model identity, compare it against `operator/model-policy.md` for the active lane. Flag any mismatch. If your runtime does not declare model identity, state that the check cannot be performed and proceed with a warning."
2. Each runtime bridge should be responsible for injecting model identity in a known format.
3. The boot sequence should not pretend enforcement is universal when it depends on runtime cooperation.

This is a more honest design and it's actually implementable.

**Issue 3 (bridge documentation drift) — agree.** The fix (keep bridges mechanical and minimal, avoid prose summaries, treat operator family descriptions as policy-sensitive) is correct and implementable. The ~/.claude/CLAUDE.md fix is the highest priority item across all reports.

**Issue 4 (memory.md single-operator content) — agree.** The two-tier refactoring is the right shape. Concrete implementation: go through memory.md line by line, tag each rule as "all operators" or "Claudia-specific", move the Claudia-specific rules into claudia.md or a new operator/claudia-memory.md, keep only cross-operator rules in memory.md. This is a bounded task, maybe 30 minutes of careful work.

**Issue 5 (cross-runtime handoffs) — I wrote this. Stand by it.**

**Issue 6 (working-style.md inheritance) — agree on the problem, push back on the proposed fix path.** The issue says the boot-level fix (add working-style.md to BOOT.md base context load) is more durable than per-file inheritance. I disagree. Adding working-style.md (7.2KB) to the mandatory boot load makes Global Issue 7 worse. It adds 7.2KB to every session, including sessions where the operator already gets the same rules through their own role file (Claudia and Lev both already inherit it). The per-file fix is four one-line edits, adds zero bytes to the boot sequence, and solves the same problem. Ship the per-file fix.

**Issue 7 (boot context too large) — agree on the diagnosis, push back on the resolution scope.** The resolution proposes tiering, deduplication, budgets, and tracking. That's correct in shape but it's a project, not a fix. It requires:
- Design decisions per rule about which single file owns it
- Splitting memory.md (Issue 4)
- Potentially trimming lev.md (14.7KB, largest operator file)
- Defining what "always load" vs "load if relevant" means concretely
- Deciding who tracks the budget and when

This should be treated as an initiative with its own folder, not as a line item in a fix list. The diagnosis is the output of this audit. The resolution is the input to the next phase of work.

### Consolidated priority from Jonah's delivery perspective

The question I'm asking: what can actually ship, and what needs design first?

**Tier 1 — Ship today, no design decisions needed:**
1. Fix `~/.claude/CLAUDE.md`: add Lev, fix stale shim description, fix operator count. One file.
2. Fix repo `CLAUDE.md`: add Lev to operator list. One line.
3. Add working-style.md inheritance to `jonah.md` and `anton.md`. Two one-line edits.
4. Add lane enumeration to `BOOT.md` step 3. One line.
5. Fix `operator/CLAUDE.md` routing for all four operators. A few lines.
6. Make `captures.md` path absolute. One line.
7. Clean up dead references: BOOTSTRAP.md in runtime-self-check.md, MEMORY.md in AGENTS.md. Two edits.
8. Fix openclaw.json model config to match policy. One file.

All of these are single-file edits with no design ambiguity. Total effort: under an hour.

**Tier 2 — Ship this week, bounded design needed:**
9. Refactor `memory.md` into shared vs Claudia-specific tiers. Requires line-by-line tagging.
10. Add cross-runtime handoff guidance to `ROUTING.md`. Requires writing a new section.
11. Add model posture awareness to `BOOT.md` — but as described above (honest check, not false enforcement).
12. Create `contract-spec-jonah.md` in the initiative folder.

**Tier 3 — Needs initiative-level planning before execution:**
13. Boot context tiering, deduplication, and budgets (Global Issue 7). This is a restructuring of 10+ files.
14. Runtime-agnostic discovery mechanism (Global Issue 1). Open design question.
15. Runtime conformance gate (Global Issue 2). Depends on runtime capabilities that don't uniformly exist.

Tier 1 items should ship now. They have no dependencies on each other and no design ambiguity. Tier 2 items are bounded work that can happen in a focused session. Tier 3 items need Anton to define the technical direction before Jonah can sequence delivery against them.
