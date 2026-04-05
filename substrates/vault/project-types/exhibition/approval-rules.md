# Exhibition Approval Rules

If the question is about the recurring exhibition lifecycle, read `lifecycle.md`.
If the question is about operator-wide decision logic, read `../../operator/decision-principles.md`.
If the issue is about a specific exhibition project, go to that project's intake or active folder.
If the question is about recurring approval boundaries for exhibitions, stay in this file.

This file defines the recurring approval logic for exhibition projects.
It does not store approvals for any specific project.

## Core Rule

Approval is not one undifferentiated button.

For exhibitions, the system should separate:
- approval of type and structure
- approval of asset strategy
- approval of setup execution
- approval of activation

These may appear in one guided review flow in product surfaces, but they should remain distinct in meaning.

## Exhibition Approval Gates

### 1. Type And Structure Approval

This gate answers:
- is this actually an exhibition project
- is the project identity accepted closely enough to proceed
- does the known exhibition structure fit, or is a variant or exception needed

This approval is required when:
- the type is uncertain
- the structure recommendation changes downstream setup meaningfully
- the project may be a hybrid, continuation, or merge case

### 2. Asset Strategy Approval

This gate answers, for each core asset:
- should we use, adapt, create, or defer

The core assets are:
- milestone structure
- SOP
- production calendar
- Drive folder structure
- contract preparation path

This approval is required before the system treats a setup path as accepted.

### 3. Setup Execution Approval

This gate answers:
- what setup work the system is allowed to initiate or queue now
- what should be executed automatically versus only prepared

Typical approved setup work may include:
- Drive setup
- calendar creation or adaptation
- reference linking
- milestone locking
- contract preparation steps

Risky external action should not be silently executed just because setup exists.

### 4. Activation Approval

This gate answers:
- is the exhibition ready to become an active project now

Activation means:
- project identity is accepted closely enough
- setup direction is sufficiently resolved
- the project is ready to function as an execution surface

Activation does not mean every detail is complete.
It means the project has crossed from intake ambiguity into active managed work.

## When An Exhibition Should Stay In Intake

An exhibition should remain in `intake/` when:
- project identity is still materially ambiguous
- the type is still weak or disputed
- the asset strategy is unresolved
- setup direction is blocked by missing information
- the system cannot yet tell whether to reuse, adapt, create, or defer major assets
- activation would create a fake sense of readiness

## When An Exhibition Can Move To Active Projects

An exhibition can move from `intake/` to `projects/` when:
- the project identity is accepted
- the exhibition classification is strong enough
- the core setup strategy is accepted
- blockers are understood well enough that execution can start
- the project has become a real active execution surface

Promotion should be explicit, not assumed.

## Required Explanation Format

Every major exhibition recommendation should be explainable as:
- `recommendation`
- `because`
- `risk`
- `if rejected, then`

Examples:
- adapt existing production calendar
- because the project fits a known exhibition pattern but has meaningful differences
- risk if reused unchanged: sequencing drift or missed setup work
- if rejected, then create a new calendar from the exhibition template

The system should present decision-ready reasoning, not bare conclusions.

## Changes That Require Explicit Re-Approval

The system should require explicit re-approval when:
- the project type changes materially
- the recommended milestone structure changes materially
- the chosen SOP path changes from use to adapt or create
- the production calendar strategy changes materially
- the contract path changes materially
- a new risk changes whether the project should activate or stay blocked
- the project shifts across entities, stakeholder meaning, or relationship context in a way that changes the operating path

Not every operational update needs a new approval gate.
Re-approval is for changes that alter strategy, scope, risk, or governing structure.

## What Approval Must Produce

A successful exhibition approval flow should produce:
- the accepted type and structure decision
- the accepted asset strategy
- approved setup actions
- an activation decision or explicit activation blockers
- initial next actions

Approval should never end in a dead state with no operational consequence.

## What Does Not Belong Here

This file should not contain:
- live approval state
- current task status
- project-specific exceptions
- execution logs
- session history
