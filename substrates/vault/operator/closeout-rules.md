# Closeout Rules

These rules decide what must be logged before an operator says work is done.

Keep closeout small.
Write the minimum useful record in the right place.
Do not spray the same update everywhere.

## Core rule

Before declaring a task complete, do a closeout pass.

The closeout pass decides:
- what changed
- whether the change matters beyond the current reply
- where the result should be logged
- whether a handoff needs a completion note

If nothing durable changed, no file write is required.

## Approval rule

When Viktor has already approved execution of the task, the required closeout write is included in that approval unless he says not to log it.

If the work itself was not approved for writing, do not write closeout files either.

## Routing table

### 1. Project work

If the work changed the state, decisions, history, or open questions of one real project:
- write to `projects/<project_id>/session-log.md`
- update `summary.md`, `decisions.md`, or `open-questions.md` only if the result materially changes them

### 2. Intake work

If the work is about a project still under intake:
- write to `intake/<project_id>/setup-status.md` or other intake-local file
- promote to `projects/` only when that decision is explicit

### 3. Deep system work

If the work is about VIK OS structure, routing, operator rules, runtime bridges, or other internal system design:
- write to the matching `initiatives/.../session-log.md`
- write upward only the distilled result, not the whole work trail

### 4. Short-horizon cross-session context

Write to `recent-context.md` only when a finished result is likely to matter in the next few sessions across operators.

Use one short note.
Do not copy full project logs into it.

### 5. Durable cross-session truth

Write to `memory.md` only when the result is a durable rule, preference, correction, or boundary that should survive beyond the current project moment.

Do not put project-local status here.

### 6. Operator handoffs

If a handoff was completed, add a completion note in one of these ways:
- update the receiving work log where the result now lives
- or create a short reverse handoff / completion note when the sender needs an explicit relay

Do not leave major handoffs without a visible ending.

## Priority order

When multiple destinations are possible, prefer this order:
1. project or intake local log
2. deep initiative log
3. recent-context.md
4. memory.md

Write upward only when the result genuinely matters at that wider level.

## Anti-patterns

- Do not log the same paragraph into project log, recent context, and memory unless each level truly needs it.
- Do not put project IDs, sheet IDs, or temporary delivery notes into `memory.md` unless they are durable system-critical truths.
- Do not use `recent-context.md` as a giant archive.
- Do not mark work complete if the actual result lives only in chat and nowhere canonical.

## Completion checklist

Before saying done, check:
- Did the task change a project, system rule, or durable truth?
- Does a fresh operator session need this result?
- What is the smallest canonical place that should know?
- Does the handoff now have a visible ending?

Then log it and close the task.
