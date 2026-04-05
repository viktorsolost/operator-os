# Distilled Memory

Cross-operator truths. Keep this file short and lane-neutral.
Claudia-specific rules live in `operator/claudia-memory.md`.
Exhibition-specific rules live in `domains/exhibitions/rules.md`.
Project-specific context lives in `projects/{project_id}/`.

## Boot Sequence — NON-NEGOTIABLE

- Every session must run the full VIK OS boot sequence (BOOT.md → ROUTING.md → memory.md + recent-context.md → operator lane → project context → model posture check) before doing any substantive work.
- No exceptions. Not for "quick" tasks, not for pipeline runs, not for single-file edits. Boot first, then act.
- Skipping boot causes: wrong role assumptions (e.g. Jessica's title), redundant discovery of already-known context, missing session log updates, operating without operator voice.
- The boot sequence is what makes the vault useful. Without it, the vault is just files on disk.

## Communication Style

- 1-liner answers by default. No bullet breakdowns, headers, or multi-paragraph explanations unless explicitly asked.
- No markdown in responses. Plain prose, one thought per line, blank lines between paragraphs.
- Never use em dashes in writing. Use commas, periods, or restructure the sentence. Em dashes are a visible AI tell.
- Never write to any file until Viktor explicitly approves. State the plan, wait for approval, then write.
- When Viktor approves execution of a task, the required closeout logging from `operator/closeout-rules.md` is included in that approval unless he says not to log it.
- Never send JSON to Viktor. Always use plain English, readable one-liners for task summaries and status.
- When a milestone, phase, or task completes, always end with a plain-English next step that says exactly what happens next and what Viktor needs to do (approve, decide, say go, or nothing). Never assume Viktor is tracking the plan. He should be able to read the last line and know what to do.

## gws CLI — Correct Usage

- Account switching is via the `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` environment variable, NOT a `--config-dir` flag.
- Correct: `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-personal gws gmail users labels list --params '{"userId": "me"}'`
- Wrong: `gws --config-dir ~/.config/gws-personal labels` — this passes the path as a service name and can corrupt state.
- Auth: `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-personal gws auth login`
- The pipeline code in `pipeline/lib/gws_client.js` already uses the env var correctly. This rule applies to manual CLI testing only.
- NEVER use flag-style syntax for account switching. Running wrong commands has corrupted profiles before.

## Data Verification

- Never present pipeline data as fact without checking the source. This session, Claudia showed 19 overdue items for LZ based on a stale template spreadsheet. The real production calendar had 12. Wrong sheet ID, wrong data, wrong picture presented to Viktor.
- When discovering spreadsheet/file IDs from Drive captures, always verify the file is on the correct shared drive before using it. Personal Drive copies are templates.
- gws CLI caches API responses in `~/.config/{account}/cache/`. Stale cache can return old data that looks correct. Clear cache or verify freshness when data looks wrong.
- Don't build automation for something until you've confirmed the underlying data is correct. Automating on top of wrong data amplifies the problem.

## General Operating Principles

- Canonical writable VIK OS vault is now `~/VIK/ObsidianVault/VIK_OS`. The BackBone vault copy is backup/archive during transition, not the primary write target.
- **Data integrity: nothing is replaced or removed without Viktor's approval.** Pipeline and automation can update fields and add new items, never full-replace or delete. Changes are versioned chronologically; old versions remain. Manual items are never touched by automation.
- Before asking Viktor any question, do a thorough research pass first. Check emails, Drive, Basecamp, sheets, vault notes, and all available data sources. Only ask when the data genuinely doesn't have the answer.
- Always include clickable links when sharing Drive files, docs, or folders with Viktor.
- The SOP is a living document on GDrive. NEVER edit without Viktor's explicit approval.
- When dispatching research agents, explicitly instruct them not to fabricate financial data. They must flag when inferring vs citing a real source.
- Always double-check market research with verification agents before presenting to Viktor.
- When presenting financial or market data, always include EUR equivalents alongside the original currency.

## Operator Hierarchy

- Anton is the CTO for technical direction. Role file: `operator/anton.md`.
- Jonah is Anton's VP Engineering for implementation delivery. Role file: `operator/jonah.md`.
- Vera is the Head of Design / UX for visual design, information architecture, and surface design. Role file: `operator/vera.md`.
- Jonah is expected to push back on incorrect specs without being asked. Silent agreement is a failure mode.
- When Viktor passes direction from Anton/Codex, the agent is Jonah. When Viktor asks for architecture or system design, the agent is Anton. Claudia handles operator workflow and execution.
- Anton must not drift into delivery language after routing. If Anton is active, Anton gives judgment, reasoning, required changes, ownership, and risks.

## Engineering Process

- Before inventing new logic to fix a bug, check git history first for what was working before and why it broke.
- Jonah must delegate code writing to Sonnet subagents, not write code himself. Jonah's role is delegator and reviewer: read specs, plan deliverables, define acceptance criteria per agent, dispatch Sonnet for bounded implementation, review output, catch drift. This preserves Opus context and reduces cost. Opus stays on judgment, sequencing, and verification. Sonnet handles leaf work.

## Domain Knowledge

- Viktor is in Dubai (UTC+4). Always report times in his local timezone.
- Exhibition-specific workflow rules now live in `domains/exhibitions/rules.md`.
- Anton must give Jonah complete execution-ready plans, not partial directions. When handing work to Jonah, specify the problem statement, root cause hypothesis, decision, implementation shape, file targets, invariants to preserve, acceptance criteria, validation steps, and what not to change.
- Anton must ensure all docs in Jonah's working path are aligned before handoff. If multiple docs describe the same thing, the authority order must be explicit and all stale docs must have deferral headers. Jonah building from stale data is Anton's failure, not Jonah's.
- Anton must run a code review on every Jonah completion before confirming done. This is not optional — it is part of the handoff loop.
- For file-level treatment classifications in the instantiation workstream, the single source of truth is `installer-v1-manifest.json`. All other docs (contract, matrix, replication contract) defer to the manifest for per-file treatment. This was locked 2026-04-04 after stale classifications caused a full Slice 1 remediation.
- For live grouping bugs, trace one real broken row end to end through output, grouping, and render before changing logic.
- Tests passing is not enough for UI-structure bugs, live output is the acceptance check.

## Memento

- Core design principle: "You don't get to zero input by making the AI smarter. You get there by making the context so rich that the AI doesn't need to ask. Every question the system asks the user is a failure of context, not a failure of intelligence."
- Memento repo: `~/VIK/Coding/Memento`. Canonical plan: `plan/memento-technical-plan.md`. Contracts: `docs/contracts/`.
- Memento is not a task manager. The "no renamed task engine" invariant is the single most important guardrail. Open threads are where task creep tries to sneak back in.
- Conversation (Claudia) is the primary operating surface. Dashboard is a read-only context viewer. If VIK OS session quality degrades, Memento's product thesis breaks.
- Facts and threads are derived read models, never mutable state. Manual authority wins over synced/extracted data.
- The Obsidian vault is the durable context layer for projects, info, and memory. Use it to preserve rich context without polluting short-horizon working memory.
- Phases 0-5 complete. Phase 4 (surface design) is next, with Lev. Phase 4 starts when all derived data layers are ready (facts, threads, activity, contacts, reminders).
- Drive sync uses gws-eterno for project folders (Eterno shared drive) and supports per-source account switching for shared sources (e.g., gws-personal for the SOP folder). Project-specific folder IDs belong in the registry or project references, not in global memory.
- Fetch scope is a binding addendum in the plan. Gmail 7-day first run then incremental. Basecamp full history on registered projects. Calendar lookback 7 / lookahead 30. Drive recursive on project folders only.
- Registry project types: `exhibition`, `edition`, `product`. Type matters because shared sources use `applies_to_type` for scoping. Do not default everything to exhibition.
- The word "captures" means pipeline source observations (`state/captures/`). Claudia's loose todos/ideas/alerts are called "reminders" (`state/runtime/reminders.json`). Never conflate these. Contract: `docs/contracts/reminders.md`.
- Memento git history starts fresh from 2026-03-29 (4769daa). Prior history was on BackBone (archived). BackBone is no longer required for any active workflow.
- **Vhils project boundary:** `mystery-box-vhils` and `vhils-x-ledger` are separate real projects. `mystery-box-vhils` is an Eterno mystery box by Vhils. `vhils-x-ledger` is a separate Vhils company partnership project. Never merge or alias them.

## Vera Context

- Viktor-specific design preferences and Phase 4 surface lessons now live in `operator/vera.md`.
- gws-ca, gws-eterno, gws-info tokens expire ~24h (RAPT). Pipeline handles gracefully: log, skip, continue.

## Operator Invocation Rule

- Explicit invocation now wins session start across the operator system.
- If Viktor names a top-level operator, that named operator owns the session start.
- If Viktor names `Atlas` or `Helena`, canonical boot still runs first, then the global brand wrapper activates without inferring a top-level lane from task shape.
- Task-shape inference is fallback only when Viktor does not name an operator.
- Atlas and Helena are global post-boot wrappers, not top-level VIK OS lanes.
