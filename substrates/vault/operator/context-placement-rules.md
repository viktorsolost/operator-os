# Context Placement Rules

These rules decide where context should live.

The goal is not to save everything.
The goal is to save the right thing in the right layer.

## Core rule

Before writing context, classify it.

Ask:
- is this durable or temporary
- is this local or cross-system
- is this project-specific or system-wide
- is this behavior doctrine or work history

Then write it once in the smallest canonical place.

## File-by-file rules

### `memory.md`

Use for durable cross-session truths that should survive for a long time.

Good fit:
- stable corrections from Viktor
- durable boundaries
- rules that affect multiple operators
- long-lived source-of-truth constraints

Do not put here:
- project status updates
- meeting recaps
- temporary owners or due dates
- project-local IDs unless they are system-critical and cross-project

### `recent-context.md`

Use for the newest few things a fresh operator should know quickly.

Good fit:
- finished results from the last few sessions
- current system state that changes startup behavior
- short cross-project updates likely to matter immediately

Rules:
- newest items go on top
- keep it short
- point to the deeper file instead of copying it

Do not use it as a diary.

### `projects/<project_id>/...`

Use for project-specific truth.

Good fit:
- project history
- project decisions
- project open questions
- project references
- project-specific facts that matter to execution

Default destination for completed project work:
- `session-log.md`

### `intake/<project_id>/...`

Use for projects that are not yet accepted into active execution.

Keep intake lighter than active project context.
Do not promote intake work into `projects/` unless that decision is explicit.

### `initiatives/...`

Use for deep internal system work.

Good fit:
- routing work
- operator-system changes
- runtime bridge work
- audits of the system itself
- design notes for internal architecture

Write the full trail here.
Push only the distilled result upward.

### `operator/*.md`

Use for operator behavior, doctrine, and lane rules.

Good fit:
- how operators should act
- how they should communicate
- how they should load context
- how they should close out work

Do not put project facts here unless they are truly operator-specific and long-lived.

### `domains/...`

Use for durable knowledge shared across multiple projects in one domain.

Good fit:
- repeatable workflows
- domain rules
- shared terminology
- recurring source-of-truth rules

### `project-types/...`

Use for reusable structure by class of work.

Good fit:
- lifecycle rules
- approval rules
- patterns shared by many projects of one type

### `brands/...`

Use for global brand doctrine and brand-pack evidence.

Do not use brand files to hold top-level VIK OS boot or routing truth.

## Priority order

When more than one place seems possible, prefer this order:
1. project or intake local file
2. initiative log
3. recent-context.md
4. memory.md

Write upward only when the result truly matters at that wider level.

## Anti-patterns

- Do not put project recaps into `memory.md`.
- Do not put deep system design into `recent-context.md` without a short pointer to the deeper file.
- Do not put operator behavior rules inside project folders.
- Do not put raw runtime state in the vault.
- Do not duplicate the same long note across multiple layers.

## Completion rule

After finishing work, use `closeout-rules.md` to decide whether the result must be logged.
Then use this file to decide where it belongs.
