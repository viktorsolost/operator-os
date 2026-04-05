# Claudia Routing Audit — 2026-03-28

Operator: Claudia
Runtime: Claude Code (anthropic/claude-opus-4-6)
Scope: Full routing chain verification — boot sequence, breadcrumbs, file integrity, cross-references

## Boot Sequence Trace

The chain I followed:

1. `~/.claude/CLAUDE.md` (global) — sets Viktor's identity, key paths, Gmail accounts, skills, and the instruction to read `VIK_OS/CLAUDE.md` first
2. `VIK_OS/CLAUDE.md` — compatibility shim, redirects to `BOOT.md` + `ROUTING.md`
3. `VIK_OS/BOOT.md` — canonical entrypoint, defines the 9-step boot sequence
4. `VIK_OS/ROUTING.md` — lane selection rules (Claudia / Anton / Jonah / Lev)
5. Base context: `memory.md` + `recent-context.md`
6. Operator role file for selected lane
7. Task-specific context from domains, project-types, projects
8. Model posture from `operator/model-policy.md`

All files exist and cross-reference correctly. The chain is complete.

## File Inventory

All verified present:

| File | Status |
|------|--------|
| `VIK_OS/CLAUDE.md` (shim) | OK |
| `VIK_OS/BOOT.md` | OK |
| `VIK_OS/ROUTING.md` | OK |
| `VIK_OS/memory.md` | OK |
| `VIK_OS/recent-context.md` | OK |
| `operator/claudia.md` | OK |
| `operator/anton.md` | OK |
| `operator/jonah.md` | OK |
| `operator/lev.md` | OK |
| `operator/model-policy.md` | OK |
| `operator/working-style.md` | OK |
| `operator/decision-principles.md` | OK |
| `operator/identity.md` | OK |
| `operator/agent-role.md` | OK |
| `operator/captures.md` | OK |
| `templates/operator-handoff.md` | OK |
| `templates/new-repo-technical-onboarding.md` | OK |
| `templates/new-repo-technical-checklist.md` | OK |
| `domains/exhibitions/rules.md` | OK |
| `domains/exhibitions/glossary.md` | OK |
| `project-types/exhibition/lifecycle.md` | OK |
| `project-types/exhibition/approval-rules.md` | OK |
| `projects/` (13 entries: 3 real, 10 test) | OK |

## What's Working Well

- The shim pattern (CLAUDE.md -> BOOT.md -> ROUTING.md) is clean and prevents stale routing rules from accumulating in multiple places
- Operator boundaries are crisp. Each file clearly defines responsibilities, non-responsibilities, handoff rules, and bounce conditions
- Cross-references between operator files are consistent (Claudia->Anton->Jonah hierarchy is clear, Lev's lateral advisory role is well-defined)
- Memory lives in the vault as instructed, not in the Claude project memory folder
- The breadcrumb chain from global CLAUDE.md through VIK OS is fully connected with no dead links

## Issues Found

### Issue 1: BOOT.md doesn't enumerate operators

Step 3 says "classify the request into a primary operator lane" but never says which lanes exist. An agent reading only BOOT.md without thoroughly reading ROUTING.md wouldn't know Lev exists or how many lanes there are.

**Proposed fix:** Add one line to step 3:

```
3. Classify the request into a primary operator lane.
   Lanes: Claudia, Anton, Jonah, Lev. See ROUTING.md for selection rules.
```

### Issue 2: anton.md and jonah.md don't link to working-style.md

Claudia says: "Follows the rules in working-style.md with these additions."
Lev says: "Lev follows the rules in working-style.md with these additions."
Anton and Jonah say nothing about it.

working-style.md contains system-wide rules that matter for all operators: uncertainty handling, conflict flagging, pushback rules, voice preservation, missing context behavior, question strategy. These are not Claudia-specific.

**Proposed fix:** Add explicit inheritance to both anton.md and jonah.md Output Style sections, matching the pattern Claudia and Lev use.

### Issue 3: No model/runtime check step in boot sequence

model-policy.md says: "If a runtime cannot support the required posture well enough for the active lane, surface the limitation instead of pretending the lane is satisfied."

But nothing in the boot sequence triggers this check. An agent can complete all 9 steps, lock into Anton's lane, and start answering on the wrong model without ever flagging it.

**Proposed fix:** Add a verification step between current steps 6 and 7:

```
7. Verify runtime model alignment. If the current runtime cannot provide the
   operator's required model, surface the mismatch to Viktor before answering.
   Do not silently operate in the wrong posture.
```

Renumber remaining steps.

### Issue 4: Test fixtures mixed with real projects in projects/

10 test directories sit alongside 3 real project directories. Not breaking, but any agent scanning the directory could waste context or misclassify test data as real project state.

**Proposed fix:** Add a projects/README.md noting that test- prefixed directories are pipeline test fixtures, not real projects.

### Issue 5 (repo-level, not routing): docs/RULES.md pipeline order is stale

The pipeline order section in the app repo's RULES.md lists 9 steps from the beta era. The real pipeline has 18 steps. This is an app-level issue, not an operator routing issue, but it came up during the breadcrumb trace from the app's CLAUDE.md. Flagging for completeness. The fix belongs in the app repo, not here.

## Summary

The routing system is structurally sound. The shim pattern, operator separation, and breadcrumb chain all work. The issues are gaps where an agent could silently do the wrong thing: missing operator enumeration in BOOT.md, inconsistent working-style inheritance, no model verification step, and test/real project mixing. All fixes are additive.

## Cross-Review

### On Anton's findings

Anton ran the most rigorous audit. His pass/fail table against the initiative's own runtime checks is the right approach — not just "does the file exist" but "does the system pass its own stated contract." Result: FAIL. That's honest and useful.

His Issue 1 (OpenClaw runtime conformity broken) is something I couldn't have surfaced from Claude Code. The model config mismatch in openclaw.json — primary set to Opus instead of Codex, Sonnet in the allowlist when the policy says not yet — is a real contract violation, not a documentation nit.

His Issue 5 (initiative docs are sharper than BOOT.md) is an interesting structural observation. The initiative's contract-spec-anton.md distinguishes deterministic vs heuristic decisions and defines acceptance/bounce criteria more precisely than the canonical boot doc. His recommendation to promote mandatory behavior from initiative docs into the canonical boot flow is correct. The sharpest routing contracts currently live in a subfolder not every operator would check.

His Appendix on repo-level technical drift (stale docs/RULES.md, wrong step count, stale agent-tool-policy) is Anton doing his job. These are outside routing audit scope but they're the same problem class: spine is clean, periphery drifts.

One pushback: Anton says restore BOOTSTRAP.md so the self-check can pass. Lev says BOOTSTRAP.md was replaced by the step 0 bridge in AGENTS.md and the reference should be removed instead. I agree with Lev. Restoring a file to satisfy a check that references an obsolete artifact is backwards. Update the check, not the system.

### On Lev's findings

Lev's report is the deepest.

Finding 1 (~/.claude/CLAUDE.md doesn't know Lev exists) is the highest-severity gap anyone surfaced. I missed it because I enter through that file and it works for me — I didn't notice it's incomplete for other operators. Any Claude Code session will never classify a request to Lev because the global bridge doesn't mention his lane. This needs to be fixed first.

Finding 5 (memory.md is Claudia-centric) is something I should have caught. It's my operating notebook wearing a system-level name. I'll own that cleanup — the Claudia-specific rules should move into my lane, not sit in the shared file consuming every operator's context budget.

Finding 8 (dual startup sequences) is OpenClaw-specific but structurally important. Two uncoordinated boot sequences loading overlapping files creates reconciliation cost. Lev's principle that OpenClaw workspace files should stay thin and explicitly deferential to VIK OS is correct.

His addendum to global Issue 7 (51KB before any work, 14 files loaded) is the sharpest framing of the context size problem. The point about cognitive overhead from reconciling overlapping guidance across files is something the byte count alone doesn't capture.

One observation: Lev's file is 14.7KB — the largest operator file by far. His report acknowledges the context size problem system-wide but doesn't address that his own role file is part of it. If we're setting context budgets, lev.md would be the first file that needs trimming.

### On Jonah's findings

Jonah's report is the most delivery-focused, which is right for his lane. He verified not just that files exist but whether they serve his operational path.

Finding 1 (operator/CLAUDE.md only routes to Claudia) is new and correct. Nobody else checked whether the local folder index routes to all operators. It only names Claudia.

Finding 3 (cross-runtime escalation to Anton has no mechanism) is the most operationally important finding in any report. Jonah's push-back mandate is one of the strongest features of his role file, but his five escalation triggers to Anton all cross runtimes with no documented path. Viktor becomes a manual relay. The system pretends this handoff can happen directly when it can't. His recommendation to add cross-runtime handoff guidance to ROUTING.md is correct and high priority.

Finding 4 (no Jonah-side contract in the initiative) is fair. The deferral was reasonable when the spine was unstable, but this audit proves the spine is stable now.

His correction to Lev's Finding 6 is precise: captures.json is not missing, it's in the repo. The path is ambiguous from the vault, not dead. Making it absolute is the right fix.

### On global issues

All 7 issues plus Lev's addendum are legitimate. My consolidated priority across all reports:

1. **Fix ~/.claude/CLAUDE.md** — add Lev, fix stale description (Lev F1, Anton I2)
2. **Add model verification step to BOOT.md** (all four reports agree)
3. **Add cross-runtime handoff guidance to ROUTING.md** (Jonah F3, Global I5)
4. **Refactor memory.md** — separate shared from Claudia-specific (Global I4, Lev F5)
5. **Add working-style.md inheritance** to anton.md and jonah.md, or as a boot step (Global I6)
6. **Tier the boot context with a budget** (Global I7)
7. **Fix operator/CLAUDE.md** to route all four operators (Jonah F1)
8. **Clean up dead references** — runtime-self-check.md, AGENTS.md MEMORY.md ref, captures.md path
9. **Add lane enumeration to BOOT.md step 3**
10. **Create contract-spec-jonah.md**

Items 1-3 fix real failures. Items 4-6 fix structural debt. Items 7-10 are cleanup and completion.
