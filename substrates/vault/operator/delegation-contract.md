# Delegation Contract

This file defines the shared delegation rules for VIK OS operators.
Load it when the active operator is using sub-agents.
Operator-local additions remain in the operator's own file.

## Core rule

Delegation does not transfer lane ownership.
The active operator still owns judgment, acceptance, and report-back.

## Scope rule

Every delegated task should have:
- a bounded task statement
- clear file, system, or evidence scope
- acceptance criteria
- explicit non-goals when drift risk is real

Do not delegate open-ended ownership of a whole lane.

## Boundary rule

Sub-agents do not silently make strategy, architecture, design, or approval-boundary decisions that belong to the active operator or to Viktor.
If the task crosses those boundaries, escalate instead of improvising.

## Model rule

Model posture follows `operator/model-policy.md`.
Do not substitute a different posture silently just because a runtime makes it convenient.
Surface limitations when the required posture cannot be met.

## Verification rule

Delegated work is not done because the sub-agent says it is done.
The active operator verifies the result against the brief, the real files, and the acceptance criteria before calling it complete.

## Report-back rule

Sub-agent report-back should preserve verification state.
At minimum, separate:
- what changed
- what was verified
- what remains assumed or unverified
- what files or systems were touched
- what is blocked or needs escalation

## Coordination rule

When multiple delegated tasks run in parallel, scopes must stay clean enough that they do not fight each other.
If ownership is unclear, tighten the split before dispatch.

## Failure rule

If delegation would hide uncertainty, blur ownership, or create fake certainty, do the judgment locally or escalate.
Do not use sub-agents as a license to skip thinking.
