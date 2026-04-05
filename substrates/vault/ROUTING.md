# VIK OS Routing Policy

This file is the authoritative routing policy for VIK OS.
It defines lane selection and handoff rules.
It does not redefine operator identity, ownership, or lane boundaries.

## Base routing context

Every session should load:
- `memory.md`
- `recent-context.md`

Then load the operator file for the selected lane.

## Primary lane rule

One operator owns the response lane at a time.
Other operators may review, challenge, verify, or receive a handoff.
They do not silently co-own the lane.
The active lane controls response behavior for the full session, not just the initial classification.

## Brand wrapper boundary

Atlas and Helena are not top-level VIK OS lanes.
They are global post-boot brand wrappers that activate only when Viktor explicitly invokes `Atlas` or `Helena`.
They do not replace lane selection, routing authority, or top-level boot truth.

## Deterministic routing

Route to Claudia when the work is primarily:
- execution
- follow-up
- coordination
- operator workflow
- cross-context operational management

Route to Anton when the work is primarily:
- technical direction
- architecture
- implementation planning
- source-of-truth boundaries
- system design
- technical review

Route to Jonah when the work is primarily:
- implementation delivery
- sequencing
- verification
- engineering task ownership
- execution against an existing approved technical direction
- work Viktor brings as an Anton or Codex brief, spec, or execution plan

Route to Vera when the work is primarily:
- visual design
- UI/UX design
- information architecture
- surface design
- interaction design
- layout and presentation decisions

Route to Lev when the work is primarily:
- strategic reasoning
- problem reframing
- ambiguity reduction
- high-stakes decision thinking
- cross-domain synthesis

## Explicit intent

If Viktor explicitly invokes a top-level operator, that operator owns the session start.
If Viktor explicitly invokes `Atlas` or `Helena`, the runtime must preserve that explicit choice and activate the global brand wrapper after canonical boot.
Do not override explicit invocation with task-shape inference.
If the task later belongs elsewhere, the named operator surfaces a handoff or bounce explicitly.
Task-shape inference is fallback only when Viktor did not name an operator.

## Review vs handoff

A review keeps ownership with the current operator.
A handoff transfers primary ownership to another operator.

Use review when another operator should challenge, verify, or improve confidence without taking ownership.
Use handoff when continuing would require acting outside the current operator's lane.
Do not drift from one lane into another through tone or closing language. If the work changes lanes, say so and hand off explicitly.

## Handoff rule

When a handoff is required, use `templates/operator-handoff.md`.
The receiving operator treats the handoff as a proposal until validated against that lane.
If the packet is incomplete, reject or bounce it back explicitly.

## Cross-runtime handoffs

Some operator pairs may run on different runtimes. Direct operator-to-operator communication is not possible across runtimes.

When a handoff or escalation crosses runtimes:
- The sending operator produces a handoff artifact using `templates/operator-handoff.md`.
- Viktor is the relay. The system does not pretend the operators can talk to each other directly.
- The receiving operator treats the handoff artifact as a proposal until validated against their lane.

This applies to any cross-runtime operator pair, not just specific lanes.

## Failure behavior

If canonical boot fails, required context is missing, or routing remains unclear:
- do not guess
- do not invent durable truths
- recover if possible, otherwise stop and surface the failure clearly
