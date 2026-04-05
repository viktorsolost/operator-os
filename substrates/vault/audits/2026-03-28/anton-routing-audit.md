# Anton Routing Audit — 2026-03-28

Operator: Anton
Runtime: Codex (`openai-codex/gpt-5.4`)
Scope: Canonical boot sequence verification from Anton's lane, including runtime bridges, breadcrumb integrity, and technical routing contract drift

## Boot Sequence Trace

The chain I followed from Anton's lane:

1. `~/.claude/CLAUDE.md` — global runtime bootstrap for Claude-family tooling. It exists and points into `VIK_OS/CLAUDE.md`, but its routing description is partially stale.
2. `VIK_OS/CLAUDE.md` — compatibility shim. Exists and correctly redirects to `BOOT.md` + `ROUTING.md`.
3. `VIK_OS/BOOT.md` — canonical entrypoint. Exists and defines the boot sequence clearly.
4. `VIK_OS/ROUTING.md` — authoritative lane-selection policy. Exists and correctly routes architecture / technical review work to Anton.
5. Base context:
   - `memory.md`
   - `recent-context.md`
   Both exist and load cleanly.
6. Active lane file:
   - `operator/anton.md`
   Exists and is internally consistent with Anton's role.
7. Operator posture:
   - `operator/model-policy.md`
   Exists and explicitly maps Anton to `openai-codex/gpt-5.4`.
8. Shared operator breadcrumbs Anton may need while judging technical work:
   - `operator/CLAUDE.md`
   - `operator/working-style.md`
   - `operator/clarification-protocol.md`
   - `templates/operator-handoff.md`
   All exist and connect.
9. Task-specific context relevant to this audit:
   - `initiatives/operator-routing-and-handoffs/summary.md`
   - `initiatives/operator-routing-and-handoffs/contract-spec-anton.md`
   - `initiatives/operator-routing-and-handoffs/review-anton.md`
   - `initiatives/operator-routing-and-handoffs/runtime-self-check.md`
   - `initiatives/operator-routing-and-handoffs/runtime-smoke-tests.md`
   All exist and are the right Anton-side context for this task.
10. Downstream context folders referenced by the routing spine:
   - `domains/CLAUDE.md`
   - `domains/exhibitions/CLAUDE.md`
   - `project-types/CLAUDE.md`
   - `project-types/exhibition/CLAUDE.md`
   - `intake/CLAUDE.md`
   - `projects/CLAUDE.md`
   All exist and the breadcrumb chain is navigable.

## File Inventory

Verified present and connected:

| File | Status | Notes |
|------|--------|-------|
| `~/.claude/CLAUDE.md` | OK with drift | Exists, but global description is not fully current |
| `VIK_OS/CLAUDE.md` | OK | Correct compatibility shim |
| `VIK_OS/BOOT.md` | OK | Canonical entrypoint |
| `VIK_OS/ROUTING.md` | OK | Authoritative lane policy |
| `VIK_OS/memory.md` | OK | Base routing context |
| `VIK_OS/recent-context.md` | OK | Base routing context |
| `operator/CLAUDE.md` | OK | Shared operator routing map |
| `operator/anton.md` | OK | Anton lane definition |
| `operator/model-policy.md` | OK | Anton posture aligned to Codex |
| `operator/working-style.md` | OK | Shared behavior rules |
| `operator/clarification-protocol.md` | OK | Ambiguity handling |
| `templates/operator-handoff.md` | OK | Handoff contract artifact |
| `domains/CLAUDE.md` | OK | Domain routing hub |
| `domains/exhibitions/CLAUDE.md` | OK | Exhibition domain hub |
| `project-types/CLAUDE.md` | OK | Project-type routing hub |
| `project-types/exhibition/CLAUDE.md` | OK | Exhibition project-type hub |
| `intake/CLAUDE.md` | OK | Intake routing hub |
| `projects/CLAUDE.md` | OK | Active-project routing hub |
| `initiatives/operator-routing-and-handoffs/summary.md` | OK | Correct task-specific context |
| `initiatives/operator-routing-and-handoffs/contract-spec-anton.md` | OK | Anton-side technical contract |
| `initiatives/operator-routing-and-handoffs/review-anton.md` | OK | Prior Anton judgment |
| `initiatives/operator-routing-and-handoffs/runtime-self-check.md` | OK | Explicit runtime verification path |
| `initiatives/operator-routing-and-handoffs/runtime-smoke-tests.md` | OK | Smoke-test expectations |
| `/Users/viktorsl/.openclaw/workspace/START_HERE.md` | OK | Correctly bridges to `VIK_OS/BOOT.md` |
| `/Users/viktorsl/.openclaw/workspace/BOOTSTRAP.md` | FAIL | File is missing |
| `/Users/viktorsl/.openclaw/openclaw.json` | FAIL | Model config does not match approved minimal policy |
| `VIK_OS/audits/2026-03-28/claudia-routing-audit.md` | OK | Good reference shape |
| `VIK_OS/audits/2026-03-28/anton-routing-audit.md` | existed empty | Replaced by this report |

## What Connects Cleanly

- The canonical vault-side routing spine is structurally sound: `CLAUDE.md -> BOOT.md -> ROUTING.md -> base context -> operator file -> model policy -> task-specific context`.
- Anton's role definition in `operator/anton.md` is consistent with the routing policy in `ROUTING.md` and the model posture in `operator/model-policy.md`.
- The folder-level routing hubs for `domains/`, `project-types/`, `intake/`, and `projects/` all exist and point to sensible next files.
- The routing initiative has a coherent Anton-side technical artifact set. `summary.md`, `contract-spec-anton.md`, and the runtime self-check docs form a real technical breadcrumb chain rather than scattered notes.
- The OpenClaw `START_HERE.md` bridge is correctly thin and does not redefine routing locally.

## Findings

### Issue 1: OpenClaw runtime conformity is currently broken

The runtime self-check contract says the bridge path is:
- `/Users/viktorsl/.openclaw/workspace/START_HERE.md`
- `/Users/viktorsl/.openclaw/workspace/BOOTSTRAP.md`
- `/Volumes/BackBone/ObsidianVault/ObsidianVault/VIK_OS/BOOT.md`

Actual state:
- `START_HERE.md` exists and points correctly into `VIK_OS/BOOT.md`
- `BOOTSTRAP.md` is missing entirely
- `/Users/viktorsl/.openclaw/openclaw.json` sets primary model to `anthropic/claude-opus-4-6`, not `openai-codex/gpt-5.4`
- the allowlist includes `anthropic/claude-sonnet-4-20250514`, which the approved minimal policy explicitly says not to include yet

This is not a documentation nit. It means the runtime-conformity slice described by the initiative currently fails its own explicit checks.

### Issue 2: The global bridge description is stale relative to the canonical vault routing

`~/.claude/CLAUDE.md` says `VIK_OS/CLAUDE.md` "contains the full routing sequence" and names operators as "Claudia, Anton, or Jonah".

Actual state:
- `VIK_OS/CLAUDE.md` is only a shim, not the full routing sequence
- the canonical routing policy lives in `BOOT.md` and `ROUTING.md`
- `ROUTING.md` defines four lanes, not three: Claudia, Anton, Jonah, Lev

The path still gets a runtime into the right vault, but the description of what is there is technically false. For a routing system, that kind of false summary is exactly how drift starts.

### Issue 3: BOOT.md does not explicitly require runtime-conformity verification

`BOOT.md` says to apply operator model posture and lock behavior to the lane, but it does not explicitly require checking that the runtime actually satisfies the required posture.

That gap matters because the initiative docs already encode this as a real concern:
- `operator/model-policy.md` says to surface runtime limitations instead of pretending the lane is satisfied
- `runtime-self-check.md` defines explicit pass/fail checks

But the canonical boot sequence does not force the check. In practice, a runtime can complete the vault boot spine and still be on the wrong model or missing a bridge file.

### Issue 4: Anton's lane references shared working rules only implicitly

`operator/anton.md` is internally good, but unlike some of the other operator files it does not explicitly say it inherits `operator/working-style.md`.

The connection still exists through `operator/CLAUDE.md`, so this is not a dead link. It is a clarity problem. A lane file this central should make shared behavioral inheritance explicit, especially because Anton's role is supposed to police documentation accuracy.

### Issue 5: The task-specific routing initiative is stronger than the canonical boot doc

The Anton initiative files are technically sharper than the top-level boot doc:
- `contract-spec-anton.md` distinguishes deterministic vs heuristic decisions
- it defines review vs handoff precisely
- it defines acceptance / bounce-back behavior
- it specifies startup self-check as part of the flow

`BOOT.md` is intentionally shorter, which is fine, but today the technical contract is split across too many layers. The result is that the initiative docs contain operationally important routing behavior that the canonical boot entrypoint only implies.

### Issue 6: Repo-local technical routing remains partly disconnected from the vault routing spine

On the repo side, the technical codebase entrypoint in `/Volumes/BackBone/Coding/vault-pipeline-v3b/CLAUDE.md` is structurally useful, but it still points to repo-local source-of-truth ordering that drifts from reality in places.

Relevant examples from the codebase audit I ran before writing this report:
- repo docs disagree on pipeline step count and naming
- `docs/RULES.md` in the repo still describes an older pipeline shape
- agent tool policy in the dashboard code is stale relative to the actual step registry

This is not a vault routing failure, but from Anton's lane it is part of the same problem class: the routing spine is mostly clean, while downstream technical documentation and policy enforcement are less disciplined.

## Pass / Fail Against The Initiative's Runtime Checks

### Runtime self-check

1. Confirm local bridge files point to canonical boot
- `START_HERE.md`: PASS
- `BOOTSTRAP.md`: FAIL, missing

2. Confirm canonical target exists
- `VIK_OS/BOOT.md`: PASS

3. Confirm model policy in `openclaw.json` is minimal
- primary = `openai-codex/gpt-5.4`: FAIL, actual primary is `anthropic/claude-opus-4-6`
- allowlist includes `openai-codex/gpt-5.4`: PASS
- allowlist includes `anthropic/claude-opus-4-6`: PASS
- allowlist includes no other models: FAIL, Sonnet is also present

4. Confirm startup behavior is bridge-only
- `START_HERE.md`: PASS
- `BOOTSTRAP.md`: cannot verify because file is missing

Overall runtime-conformity result: FAIL

## Summary Judgment

The canonical Anton-side routing spine inside `VIK_OS` is mostly sound.

The real defects are at the bridges and contract edges:
- one runtime bridge file is missing
- one runtime model config is out of policy
- the global bridge summary is stale
- the canonical boot doc does not explicitly force the runtime-conformity check that the initiative already knows it needs

So the system is not suffering from missing routing architecture. It is suffering from incomplete enforcement of the routing architecture.

That distinction matters. The next move is not redesign. It is to make the canonical contract executable and keep the bridges honest.

## Recommended Fixes

1. Restore `/Users/viktorsl/.openclaw/workspace/BOOTSTRAP.md` so the runtime self-check path can pass end-to-end.
2. Bring `/Users/viktorsl/.openclaw/openclaw.json` back into policy:
   - set `agents.defaults.model.primary` to `openai-codex/gpt-5.4`
   - keep `anthropic/claude-opus-4-6` in the allowlist
   - remove `anthropic/claude-sonnet-4-20250514` unless there is now an explicitly approved routing reason
3. Update `~/.claude/CLAUDE.md` so it describes the vault truthfully:
   - `VIK_OS/CLAUDE.md` is a shim
   - canonical routing lives in `BOOT.md` and `ROUTING.md`
   - Lev is part of the operator family
4. Add an explicit runtime-conformity verification step to `VIK_OS/BOOT.md`, or explicitly reference `runtime-self-check.md` from the boot sequence for runtimes that need bridges.
5. Add one explicit inheritance line in `operator/anton.md` pointing to `operator/working-style.md`.
6. Keep the vault routing docs short, but promote any truly mandatory behavior from the initiative docs into the canonical boot/routing docs instead of leaving it only in the initiative folder.

## Appendix: Repo-Level Technical Drift Observed During Anton Review

These are not vault-routing failures, but they are relevant to Anton's lane because they affect whether the technical breadcrumbs remain truthful after routing succeeds:

- `/Volumes/BackBone/Coding/vault-pipeline-v3b/docs/RULES.md` is stale relative to the real pipeline registry
- `/Volumes/BackBone/Coding/vault-pipeline-v3b/docs/engineering/areas/pipeline.md` reports the wrong step count and wrong step numbering
- `/Volumes/BackBone/Coding/vault-pipeline-v3b/dashboard/app/api/_lib/agent-tool-policy.js` has stale allowed pipeline steps and omits `read_project_store`
- `/Volumes/BackBone/Coding/vault-pipeline-v3b/dashboard/app/api/claude/session/route.js` and `context/route.js` use a thinner context builder than the richer generic packet builder already present in the codebase

Those should be treated as the next technical cleanup layer after the vault-side bridge defects are fixed.

## Cross-Review

### On Claudia's audit

**What I agree with**

Claudia's core read is directionally correct: the vault-side routing spine is structurally sound, and the failures are mostly in enforcement gaps, not in the existence of the routing architecture itself.

Her three strongest findings are correct:
- BOOT.md should explicitly force a model/runtime verification step
- `working-style.md` inheritance is not consistently encoded
- repo-local technical docs have drifted from code reality

Her point that the shim pattern is clean is also correct. `VIK_OS/CLAUDE.md -> BOOT.md -> ROUTING.md` is a good separation of concerns.

**What I push back on**

I do not agree with her framing of the `projects/` test-fixture mixing as a notable routing issue. It is real directory hygiene debt, but it is not close to the same severity class as runtime-conformance failure, stale bridge truth, or missing cross-runtime handoff mechanics. In a priority stack, it belongs much lower.

I also think her original recommendation to restore `BOOTSTRAP.md` was the wrong move once Lev surfaced the OpenClaw reality. If a check references an obsolete artifact, the first question is whether the artifact should exist, not whether the filesystem should be made to satisfy the check retroactively.

**What is misprioritized**

Claudia slightly underweighted the runtime bridge layer and slightly overweighted local clarity issues. The highest-risk problems are the ones that can make an operator run in the wrong posture or never reach the right lane, not the ones that make a folder slightly less navigable.

**What the priority order should be**

1. Fix the global bridge truth in `~/.claude/CLAUDE.md`
2. Add explicit runtime/model verification to BOOT.md
3. Define cross-runtime handoff mechanics in ROUTING.md
4. Repair runtime-conformance checks so they match reality
5. Normalize shared-behavior inheritance (`working-style.md`)
6. Refactor `memory.md`
7. Only then clean up lower-signal navigation hygiene like test fixture labeling

### On Lev's audit

**What I agree with**

Lev surfaced the most important bridge defect: `~/.claude/CLAUDE.md` does not acknowledge Lev's lane. That is a real routing failure, not just a wording issue. If the first bridge file omits a lane, the downstream correctness of `ROUTING.md` does not save that runtime.

I also agree with Lev's diagnosis that `memory.md` is wearing the wrong hat. It is named and loaded as shared cross-operator context while carrying a large amount of Claudia-specific operational material. That is a structural problem, not an editorial preference.

His observation about dual startup sequences in OpenClaw is also sound. Even when both chains point to the same authority, two independent startup layers create reconciliation cost.

**What I push back on**

I do not fully agree with Lev's severity weighting on some OpenClaw-local dead references. `BOOTSTRAP.md` missing and workspace `MEMORY.md` missing are real cleanup items, but they are not system-critical unless they participate in an enforced contract. The real problem is that the self-check still references them and therefore the contract layer is stale. The missing file itself is secondary.

I also think Lev slightly understates the severity of cross-runtime handoff mechanics relative to Claude bridge truth. Missing Lev from the global bridge is severe, but a handoff model that assumes direct cross-runtime escalation when none exists is a broader systems problem because it affects multiple lanes, not one omitted lane.

Finally, Lev is right about context load size, but his lane is itself part of that problem. A 14.7KB operator file is not a neutral observer of the context-budget issue.

**What is misprioritized**

Lev's list slightly overweights workspace-local cleanup and slightly underweights the shared contract problem that Jonah highlighted: the system speaks as if inter-operator escalation is operationally available even when it crosses runtimes and becomes manual.

**What the priority order should be**

1. Fix bridge truth at the global entrypoint
2. Add runtime-conformance verification to BOOT.md
3. Add cross-runtime handoff rules to ROUTING.md
4. Split cross-operator memory from lane-specific memory
5. Reduce boot-context size and duplication with an explicit budget
6. Clean stale OpenClaw-local references that no longer belong in the active contract

### On Jonah's audit

**What I agree with**

Jonah's strongest original contribution is correct: cross-runtime operator escalation has no documented mechanism. That is the most important operational issue that the earlier reports did not sharpen enough. The handoff template exists, but the routing contract still reads as if escalation can occur directly between operators even when the runtimes are separate and Viktor is the relay.

I also agree with his read that `operator/CLAUDE.md` is incomplete as a local routing index. It is not breaking because the boot spine already selected the lane, but a local routing map that explicitly names only Claudia is not technically truthful.

His correction on `captures.md` is also right. That was not a missing file problem. It was a boundary/path declaration problem.

**What I push back on**

I do not agree with Jonah's repo-side file inventory statement that `docs/RULES.md` is effectively fine because it now points to a canonical source. From a technical-truth perspective, a stale section that still exists inside a so-called rules file is still drift. A pointer does not neutralize contradictory embedded content if the reader can still consume both.

I also think Jonah slightly underweights the bridge-truth problem in `~/.claude/CLAUDE.md`. From a delivery perspective, cross-runtime escalation is painful. From a routing-system perspective, an incomplete global bridge is even more foundational because it affects lane selection before delivery even starts.

**What is misprioritized**

Jonah's proposed ordering places `working-style.md` inheritance ahead of bridge truth and runtime-conformance repair. That is too low-level. Behavioral inheritance matters, but it is not more urgent than ensuring the runtime enters the right lane and can validate its own posture.

**What the priority order should be**

1. Fix global bridge truth (`~/.claude/CLAUDE.md`)
2. Add runtime-conformance verification to BOOT.md
3. Encode cross-runtime handoff mechanics in ROUTING.md
4. Repair or remove stale runtime-self-check expectations
5. Normalize local routing indices like `operator/CLAUDE.md`
6. Add `working-style.md` inheritance explicitly
7. Extend the initiative with a Jonah-side contract only after the routing contract itself is technically honest

### On the global issues file

**What I agree with**

The global file is now structurally coherent. The seven-issue set is the right scope for shared system risk:
- discovery
- conformance after discovery
- bridge truth drift
- shared memory pollution
- cross-runtime handoffs
- inconsistent behavioral inheritance
- context-size / reconciliation overhead

Issue 2, Issue 3, and Issue 5 are the real architectural core. The rest are consequential debt around that core.

Issue 7 is valid and important. The context-budget problem is not cosmetic. At this size, the system is paying not just token cost but reconciliation cost across overlapping behavioral documents.

**What I push back on**

I would not frame all seven issues as equal members of the same priority class. The file is correct as a catalog, but if someone reads it as a flat list they could mis-sequence the work.

I also think Issue 4 (`memory.md` content) and Issue 7 (context-size problem) are related but not identical. The danger is solving Issue 7 only with byte trimming while leaving truth-boundary confusion intact. A smaller but still mixed-scope `memory.md` would remain structurally wrong.

**What is misprioritized**

The global file does not currently make clear enough that discovery, conformance, and cross-runtime handoff mechanics are the three top-tier failures. Context budget matters, but it should not be tackled before the routing contract is technically honest.

**What the priority order should be**

1. Discovery that works across runtimes
2. Conformance verification after discovery
3. Technically honest cross-runtime handoff rules
4. Bridge truth maintenance so summaries cannot silently drift
5. Shared-memory boundary cleanup
6. Shared-behavior inheritance cleanup
7. Context-budget reduction and de-duplication

## Anton Priority Order

Across all reports, the correct technical priority order is:

1. Fix `~/.claude/CLAUDE.md` so the global bridge truthfully describes the operator set and the canonical vault routing path.
2. Add an explicit runtime/model verification step to `VIK_OS/BOOT.md`.
3. Add cross-runtime handoff and escalation mechanics to `VIK_OS/ROUTING.md`, explicitly acknowledging when Viktor is the relay.
4. Update runtime self-check and smoke-test artifacts so they validate the real active bridge, not superseded files.
5. Make shared behavioral inheritance explicit, either in BOOT.md or in every operator file.
6. Refactor `memory.md` into true cross-operator memory versus lane-specific operating material.
7. Set a boot-context budget and move non-essential files to conditional loading.
8. Clean lower-level navigation and folder hygiene issues only after the routing contract is truthful.

That is the order that improves correctness first, then coherence, then efficiency.
