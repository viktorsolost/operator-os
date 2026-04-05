# Intake Decision Tree

## Purpose

This document defines how Claudia should reason through a newly discovered project during intake.

The intake process answers one question:

What setup strategy should be used to turn this new project into an active project safely?

This is reusable project-type logic, not project-specific runtime state.

## Core Principle

A new project should be evaluated asset by asset.

Do not treat intake as a single yes/no gate.

Each core asset can independently resolve to:
- `use`
- `adapt`
- `new`

These decisions then determine:
- whether strategy can be approved
- whether setup can be approved
- whether activation is blocked
- which setup actions need to be executed

## Core Assets

Current intake review checks these assets:

- Milestone Structure
- SOP
- Production Calendar
- Drive Setup
- Contract Setup

## High-Level Flow

1. New project appears
2. Determine whether the project type is known
3. If type is known, start from that project-type template family
4. Check each core asset for:
   - availability
   - fit
   - risk
5. For each asset, decide:
   - `use`
   - `adapt`
   - `new`
6. Identify blockers and missing information
7. Approve strategy when the intended setup direction is clear
8. Approve setup when execution is authorized
9. Promote to active project only after required blockers are cleared or explicitly overridden

## Type Known

`Type known` means the system can confidently classify the project into an existing project-type pattern, for example:
- exhibition
- edition
- product
- partner
- recurring meeting

If the type is known:
- use that type as the default template family for milestone structure and candidate assets

If the type is not known:
- intake should stay conservative
- default to a fresh setup path
- mark uncertainty clearly
- prefer `new` or `adapt` over blindly reusing assets from another type

## Per-Asset Decision Logic

For each asset, Claudia should ask:

1. Does this asset exist?
2. If it exists, is it a good fit?
3. If it is not a good fit, can it be adapted safely?
4. If not, should a new asset be created?

This leads to one of three decisions:

### Use

Choose `use` when:
- the asset exists
- the fit is strong
- the risk of reuse is low

Meaning:
- no structural rewrite needed
- setup can proceed from the existing asset

### Adapt

Choose `adapt` when:
- the asset exists
- the fit is partial
- adaptation is lower-risk than starting fresh

Meaning:
- the asset is a starting point, not a final answer
- setup action should explicitly mention what must change

### New

Choose `new` when:
- the asset does not exist
- the fit is poor
- reuse would create structural or operational risk

Meaning:
- setup action should create a new asset from the best available template or from scratch

## Asset Evaluation Guidance

### Milestone Structure

Use when:
- project type is known
- approved milestone template already matches the project

Adapt when:
- the template is mostly right but sequence or emphasis needs adjustment

New when:
- no valid template exists
- project structure does not fit the known type safely

### SOP

Use when:
- the SOP matches the project type and pace closely

Adapt when:
- the SOP is relevant but needs sequencing or scope changes

New when:
- no relevant SOP exists
- reuse would create process confusion

### Production Calendar

Use when:
- an existing calendar structure already fits this project

Adapt when:
- a prior calendar can be reused with clear modifications

New when:
- no valid calendar exists
- a fresh calendar is safer than adapting an old one

### Drive Setup

Use when:
- a folder structure already exists and matches the project

Adapt when:
- an existing structure can be reused with light modifications

New when:
- no structure exists
- reusing an old structure would create confusion

### Contract Setup

Use when:
- a valid contract template exists and matches the venue/partner obligations

Adapt when:
- a standard contract exists but needs venue-specific or partner-specific adjustments

New when:
- no contract basis exists
- reuse would miss critical obligations

## Blockers

A blocker is something that prevents safe activation or setup execution.

Examples:
- production calendar not created
- venue obligations not confirmed
- required contract terms still unknown
- setup execution not approved
- critical references missing

Not every missing asset blocks strategy approval.

Strategy can still be approved if the direction is clear.

Setup or activation may still remain blocked until the missing pieces are resolved.

## Approval Semantics

### Approve Strategy

This means:
- Viktor agrees with the asset decisions
- the setup direction is approved
- `use`, `adapt`, and `new` choices are locked as the intended plan

This does not mean:
- execution has started
- blockers are cleared
- the project is active

### Approve Setup

This means:
- Viktor authorizes execution of the setup actions
- setup work may begin
- the system can create or adapt the required assets

This still does not automatically mean activation is ready.

## Promotion To Active Project

A project should move from intake to active only when:

- strategy is approved
- setup is approved
- required blockers are cleared or explicitly overridden
- the project store can be safely created
- milestone structure is known
- setup actions are in a valid executable state

Promotion should:
- create the active project store
- seed milestones from the approved template
- provision the active vault project folder
- preserve intake history
- never delete the intake record

## Claudia Operating Rule

During intake review, Claudia should:
- explain what the system found
- explain what is missing
- explain the risk of each asset path
- recommend `use`, `adapt`, or `new`
- never present system guesses as confirmed truth
- never override Viktor's manual decisions

## Example

New project appears:
`Atelier Sora Milan 2026`

Type known:
- yes, likely exhibition

Asset checks:
- Milestone Structure: found, good fit
- SOP: found, partial fit
- Production Calendar: missing
- Drive Setup: missing
- Contract Setup: found, partial fit

Recommended decisions:
- Milestone Structure: `use`
- SOP: `adapt`
- Production Calendar: `new`
- Drive Setup: `new`
- Contract Setup: `adapt`

Result:
- strategy can be approved
- setup can be prepared
- activation remains blocked until required setup work is complete
