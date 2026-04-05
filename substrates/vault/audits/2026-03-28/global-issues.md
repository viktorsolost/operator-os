# Global Routing Issues — 2026-03-28

Issues that affect the entire operator system, not specific to any one lane.

## Issue 1: No runtime-agnostic entry point

The boot sequence in BOOT.md is solid once an agent is inside it. The problem is getting there.

The current discovery chain:
1. `~/.claude/CLAUDE.md` says "read VIK_OS/CLAUDE.md first"
2. `VIK_OS/CLAUDE.md` says "read BOOT.md"
3. BOOT.md runs the sequence

This chain depends on:
- The runtime automatically loading `~/.claude/CLAUDE.md`
- The agent being launched in a context where that global file exists
- The agent actually following the instruction before doing anything else

If any operator is launched on a different runtime, a different directory, or a new tool entirely, there is no guarantee they find the boot sequence at all. They would need to be explicitly told the vault path and told to read BOOT.md.

This means the routing system currently only works reliably inside runtimes that already know how to discover the global bridge. Every other launch requires Viktor to manually paste the entry point path.

**Impact:** Every operator. Every runtime. This is the single biggest fragility in the system.

**To resolve:** Needs a discovery mechanism that works regardless of runtime, whether that is a per-runtime entry shim, a standard env var, a convention each runtime adapter knows to look for, or something else.

## Issue 2: No enforced runtime-conformance gate after discovery

Discovery is not enough. Even when a runtime finds `VIK_OS/BOOT.md`, there is no canonical step that forces the runtime to prove it actually conforms to the required operator posture.

Current state:
- `operator/model-policy.md` says runtimes must surface posture mismatch instead of pretending the lane is satisfied
- `initiatives/operator-routing-and-handoffs/runtime-self-check.md` defines explicit pass/fail checks for bridge files and model policy
- `BOOT.md` does not explicitly require that check as part of the canonical boot sequence

That means a runtime can successfully discover the vault, load the routing spine, classify into a lane, and still proceed while:
- missing required bridge files
- running on the wrong primary model for the active operator
- carrying a local config that no longer matches approved routing policy

This is a system-level issue because it affects whether any operator can trust the environment they were activated in.

**Impact:** Every operator. Every runtime adapter. Discovery alone is not enough if conformity is optional.

**To resolve:** Add an explicit runtime-conformance verification step to the canonical boot flow, or make BOOT.md require a runtime self-check whenever startup depends on local bridge files or local model policy.

## Issue 3: Bridge documentation can drift from canonical routing truth

The routing system depends on multiple bridge surfaces summarizing the canonical vault behavior:
- `~/.claude/CLAUDE.md`
- runtime bridge files like `/Users/viktorsl/.openclaw/workspace/START_HERE.md`
- compatibility shims like `VIK_OS/CLAUDE.md`

The problem is that these bridge files are allowed to summarize the canonical routing layer in prose, and those summaries can become stale even when they still point to the right place.

Concrete examples observed:
- `~/.claude/CLAUDE.md` says `VIK_OS/CLAUDE.md` contains the full routing sequence, but `VIK_OS/CLAUDE.md` is now only a shim
- `~/.claude/CLAUDE.md` names only three operators in the routing description, while `ROUTING.md` defines four lanes: Claudia, Anton, Jonah, Lev

This is not the same problem as discovery failure. It is a truth-maintenance problem in the bridge layer. A runtime can be pointed to the correct vault and still carry a stale mental model of what it is entering.

**Impact:** Every operator, because bridge text shapes first-pass routing behavior before deeper files are read.

**To resolve:** Keep bridge files mechanical and minimal. They should prefer pointer language over descriptive summaries, and any bridge file that does summarize operator families or routing behavior should be treated as policy-sensitive and audited against `BOOT.md` and `ROUTING.md`.

## Issue 4: `memory.md` is a system-level file with single-operator content

All operators load `memory.md` through BOOT.md step 2. The file is titled "Distilled Memory" and positioned as cross-domain truths. In practice, much of its content is Claudia-specific: email drafting rules, gws CLI syntax, pipeline step conventions, Google Sheets handling, Basecamp HTML formatting, and Claudia-style delegation patterns.

Every operator session ingests a large amount of Claudia operational rules before doing any work. For Lev, Anton, and Jonah, that is context dilution. It also creates an ownership ambiguity: `memory.md` looks system-level but reads partly like one operator's notebook.

This will get worse as more operator-specific rules accumulate. If each operator starts adding lane-specific rules to `memory.md` because it is the cross-session file, it becomes a grab-bag that serves no one well.

**Impact:** All operators. Token waste, context dilution, unclear ownership.

**To resolve:** Refactor `memory.md` into two tiers:
- a slim cross-operator `memory.md` containing only rules that genuinely govern all lanes
- operator-specific memory absorbed into the respective operator files or dedicated operator-specific supporting files

## Issue 5: Cross-runtime operator handoffs have no documented mechanism

The routing system defines escalation and handoff paths between operators. Several of these paths cross runtimes:
- Jonah (Claude Code, Opus) escalating to Anton (Codex, gpt-5.4)
- Any handoff from a Claude Code operator to an OpenClaw operator, or vice versa

The handoff template (`templates/operator-handoff.md`) exists and could serve as a written relay artifact. But nothing in ROUTING.md, BOOT.md, or the operator files acknowledges that some handoffs require Viktor to manually switch tools and relay context. The escalation sections in operator files read as if direct operator-to-operator communication is possible, which it is not when the operators run on different runtimes.

This matters most for Jonah's push-back mandate. `jonah.md` defines five escalation triggers to Anton, but the system provides no mechanism for that escalation to happen without Viktor as a manual relay.

**Impact:** Any cross-runtime operator pair. Most acutely Jonah-to-Anton, since that is the most frequent escalation path.

**To resolve:** Add cross-runtime handoff guidance to `ROUTING.md`. When a handoff crosses runtimes, the sending operator should produce a handoff artifact using the template, and the system should acknowledge that Viktor is the relay. This is not a tooling fix — it is a documentation and contract fix so the routing system accurately describes what is possible.

## Issue 6: `working-style.md` inheritance is not consistently enforced

`working-style.md` contains system-wide behavioral rules: uncertainty handling, pushback protocol, conflict flagging, voice preservation, question strategy, and missing-context behavior. These are not Claudia-specific. They govern how any operator should interact with Viktor.

Today the inheritance is inconsistent:
- some operator files reference it explicitly
- others do not
- BOOT.md does not explicitly say all operators load it as baseline behavioral context

That leaves the behavioral baseline partly implicit. An operator can comply with the lane file and still miss shared working-style rules because nothing in the canonical boot flow made that inheritance explicit.

**Impact:** All operators, especially lanes whose role files do not explicitly mention `working-style.md`.

**To resolve:** Either:
- add a boot step that makes `working-style.md` part of the baseline operator load, or
- add explicit inheritance to every operator file

The boot-level fix is more durable.

## Issue 7: Boot context is too large and complex

Measured byte sizes for the files an operator loads during a full boot:

```
Global bridge:      ~/.claude/CLAUDE.md                    5,589 bytes
Repo CLAUDE.md:     vault-pipeline-v3b/CLAUDE.md           7,666 bytes
Dashboard CLAUDE.md:                                       4,421 bytes
VIK OS spine:       BOOT.md + ROUTING.md                   4,262 bytes
Base context:       memory.md + recent-context.md          8,996 bytes
Model policy:       model-policy.md                        2,935 bytes
Shared behavior:    working-style.md                       7,230 bytes
                    identity.md                            5,627 bytes
                    agent-role.md                          5,486 bytes
                    decision-principles.md                 3,389 bytes
Operator files:     claudia.md                             7,295 bytes
                    anton.md                               6,479 bytes
                    jonah.md                               5,353 bytes
                    lev.md                                14,696 bytes
                                                    ─────────────────
Total (all files):                                        89,424 bytes
```

That is ~89KB before the agent reads a single task-specific file, domain folder, project folder, or initiative. Roughly 22,000 tokens of system context just to boot.

Problems this creates:

1. **Token cost per session.** Every operator session burns ~22K tokens on boot context before doing any work. For Opus that is expensive. For shorter tasks, boot context can outweigh the actual work.

2. **Context dilution.** An operator loading all shared files (identity.md, agent-role.md, decision-principles.md, working-style.md) plus their own role file plus memory.md is ingesting 6-8 files of behavioral guidance. Much of this overlaps or restates the same principles in slightly different words. The signal-to-noise ratio degrades as the pile grows.

3. **Operator-irrelevant content.** Every operator loads the full memory.md (6.8KB), most of which is Claudia-specific operational rules. Every operator loads identity.md, agent-role.md, and decision-principles.md even when the task doesn't require re-reading Viktor's full identity context. Lev's file alone is 14.7KB — larger than some of the other operators' entire boot chain.

4. **No tiering.** The boot sequence treats all files as equally required. There is no distinction between "always load" (BOOT.md, ROUTING.md, operator role file) and "load if relevant" (identity.md, domain context, project-type rules). An agent doing a quick technical review loads the same context as one running a full-day operational session.

5. **Redundancy across files.** The pushback rule appears in working-style.md, agent-role.md, decision-principles.md, and in individual operator files. The uncertainty rule appears in at least three places. The data integrity rule appears in memory.md, the repo CLAUDE.md, and dashboard CLAUDE.md. Each restating adds bytes without adding clarity.

**Impact:** Every operator. Every session. This is a cost, quality, and speed issue. Too much context can degrade judgment just as much as missing context — the agent has to reconcile overlapping guidance instead of focusing on the work.

**To resolve:** Tier the boot context:
- **Always load** (~15KB target): BOOT.md, ROUTING.md, operator role file, slim cross-operator memory
- **Load if relevant** (on demand): identity.md, working-style.md, decision-principles.md, agent-role.md, domain/project-type context
- **Deduplicate:** Consolidate rules that appear in 3+ files into one authoritative location and reference it
- **Budget:** Set a target boot context size per operator and track it. If a file grows, something else should shrink or move to on-demand loading

### Addendum: OpenClaw runtime context overhead (Lev)

Anton's byte count above is measured from the Claude Code entrypoint. OpenClaw adds a separate layer on top.

Before any agent code runs, OpenClaw auto-injects these workspace files as system context:

```
AGENTS.md          ~4,800 bytes
SOUL.md              ~800 bytes
USER.md              ~600 bytes
IDENTITY.md          ~350 bytes
TOOLS.md             ~700 bytes
HEARTBEAT.md         ~200 bytes
START_HERE.md        ~800 bytes
                 ───────────────
OpenClaw overhead:  ~8,250 bytes
```

These are injected, not read by the agent. They cannot be deferred or tiered. They are in the context window before the agent's first tool call.

Then AGENTS.md step 0 triggers the full VIK OS boot chain. For Lev's lane, the files actually read this session:

```
VIK OS BOOT.md + ROUTING.md           4,262 bytes
memory.md                              6,504 bytes
recent-context.md                      1,311 bytes
operator/lev.md                       14,696 bytes
operator/model-policy.md               2,935 bytes
operator/working-style.md              7,230 bytes
memory/2026-03-28.md                   6,258 bytes
                                  ───────────────
VIK OS boot reads:                    43,196 bytes
```

Total before doing any work: **~51KB** (~13,000 tokens on Opus). And that's without loading identity.md, agent-role.md, decision-principles.md, or any project/domain context.

The OpenClaw overhead is smaller than Claude Code's (no repo CLAUDE.md, no dashboard CLAUDE.md), but it's also non-deferrable. Claude Code agents could theoretically be taught to lazy-load. OpenClaw workspace files are always present.

The deeper problem is not just size but **file count and reconciliation cost**. This session loaded 14 files before answering Viktor's first question. Each file contains behavioral guidance. Some of it overlaps (SOUL.md and lev.md both define personality, IDENTITY.md and lev.md both define role, AGENTS.md and lev.md both define startup sequences). The agent isn't just reading — it's reconciling, deduplicating, and establishing precedence across all of them on every turn. That's cognitive overhead that doesn't appear in a byte count.
