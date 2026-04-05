# Operator Handoff

## From / To
- From: Lev (strategic review)
- To: Claudia (operator review)

## Reason for handoff
Claudia is the operator who will run this loop. She needs to review the strategic annotations and confirm or adjust the operator-side rules before implementation.

## Task statement
Review Lev's annotations on `plan/claudia-email-triage-loop.md` and confirm the following operator-side decisions. Push back where the rules don't match how you'd actually triage.

## Current status
Plan drafted, Claudia's initial input already integrated, Lev's strategic annotations added. Anton reviewing technical architecture in parallel.

## Relevant context already loaded
- `operator/claudia.md`, `operator/claudia-memory.md`: Claudia's role and operating memory
- `memory.md`: communication style rules, data integrity rules
- `plan/claudia-email-triage-loop.md`: the full plan

## Decisions already made
- Five triage categories: urgent, needs response, needs Viktor's voice, informational, noise
- Default-conservative rule on drafting uncertainty
- Account priority order: CA, Eterno, Info, Personal
- Project batching (group emails by project in same cycle)
- Memento registry and derived context as the triage context layer

## Open questions for Claudia
1. **Conservative default in practice.** Lev's rule: when uncertain, default to "needs Viktor's voice." Does this match your judgment? Are there sender or subject patterns where you'd be confident enough to draft even when the relationship is high-stakes? Define the boundary clearly so the rule is operational, not just aspirational.

2. **Quiet hours behavior.** During 23:00-08:00, only urgent emails trigger a Telegram alert. Everything else waits for the next active-hours cycle. Confirm this is right, or propose a different threshold for what breaks quiet hours.

3. **Draft voice verification.** You said memory.md + claudia-memory.md is sufficient for Viktor's email voice. After the first week of live triage, you should flag any emails where the draft felt uncertain. This is a calibration period, not a permanent state. Confirm you'll track this.

4. **Batching rules.** You proposed grouping by project. What's the batch limit? If 8 PUNKS emails land in one cycle, is that one message with 8 sections or split into groups? Define the threshold.

5. **Escalation message format.** For "needs Viktor's voice" emails, you proposed: summary + why you can't draft + what Viktor needs to decide + [Reply now] [Reply later] buttons. Write the template so it's concrete before implementation.

## Expected output from receiver
- Confirmation or adjustment on each of the five points above
- Draft of the "needs Viktor's voice" escalation template
- Any triage rules Claudia wants codified that aren't in the plan yet (sender allowlists, project-specific handling, etc.)

## Approval status
- Viktor approval required: no (operator-level calibration within approved direction)
- Viktor approval received: n/a
- Notes: Claudia's refinements feed back into the plan before Jonah implements

## Constraints / non-goals
- Claudia does not implement the cron job or relay infrastructure (Jonah's lane)
- Claudia does not make architectural decisions about storage or execution (Anton's lane)
- Claudia owns the triage logic, draft quality, and operational rules
