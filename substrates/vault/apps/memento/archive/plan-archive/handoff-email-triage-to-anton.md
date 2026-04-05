# Operator Handoff

## From / To
- From: Lev (strategic review)
- To: Anton (technical architecture)

## Reason for handoff
Technical architecture decisions needed before implementation can begin. Lev has annotated the strategic layer. Anton owns the system design calls.

## Task statement
Review the email triage loop plan at `plan/claudia-email-triage-loop.md` and make binding architectural decisions on the five open questions. Lev's annotations provide positions on each. Accept, modify, or override them with reasoning.

## Current status
Plan drafted by Lev, Claudia input integrated, Lev strategic annotations complete. No implementation yet. Viktor has approved moving to technical review.

## Relevant context already loaded
- `memory.md`: gws CLI usage rules, Memento design principles, data integrity rules
- `recent-context.md`: Memento Phase 5 restart status, pipeline state
- `plan/claudia-email-triage-loop.md`: the full plan with annotations

## Decisions already made
- Direction approved: Claudia triage loop via cron, Telegram inline buttons, Memento context layer
- Five triage categories confirmed (urgent, needs response, needs Viktor's voice, informational, noise)
- Default-conservative rule: uncertain drafts go to "needs Viktor's voice"
- Sequencing: single account (gws-ca) first, prove end-to-end, then expand
- Draft files must store structured data, not executable commands (Lev position, needs Anton confirmation)

## Open questions / unresolved risks
1. **Draft storage location.** `Memento/relay/email-drafts/` vs VIK OS runtime dir vs elsewhere. Lev position: relay artifacts are transient infrastructure, not durable state. Anton decides.
2. **Draft lifecycle.** 48h auto-archive, 30-day retention, then delete. Lev position stated. Anton confirms or adjusts.
3. **Command construction pattern.** Lev says structured data only, executor constructs at runtime. Anton validates this is sufficient and designs the executor interface.
4. **Failure handling.** Log, wait for next cycle, alert after two consecutive failures per account. Anton validates or adjusts retry/alert logic.
5. **Callback routing reliability.** Unknown until tested. Anton should define the test plan and fallback architecture if callbacks don't queue.

Additional: Claudia proposed reading Memento registry and derived context for project awareness. This is architecturally correct. Anton should confirm the contract surface (which files, read-only, no writes from triage loop).

## Expected output from receiver
A response document or annotations on the plan covering:
- Binding decision on each of the five questions
- Executor interface design (structured data in, validated gws command out)
- Contract for triage loop's read access to Memento state
- Test plan for the "not yet proven" items
- Any architectural risks Lev missed

## Approval status
- Viktor approval required: yes (before implementation begins)
- Viktor approval received: yes (to proceed with review, not yet for implementation)
- Notes: Anton reviews, then Viktor approves the combined plan before Jonah implements

## Constraints / non-goals
- Triage loop must not write to Memento state (read-only consumer of registry, facts, threads)
- Journal entries for sent replies are a separate pipeline concern, not the triage loop's job
- No new infrastructure beyond cron + relay directory + gws CLI
- Phase 5 work is not blocked by this, they proceed in parallel
