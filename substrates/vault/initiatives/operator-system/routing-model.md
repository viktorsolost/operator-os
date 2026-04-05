# Routing Model

## Canonical startup order

1. Enter canonical VIK OS boot
2. Load `ROUTING.md`
3. Load `memory.md`
4. Load `recent-context.md`
5. Resolve explicit operator invocation if present
6. If no operator was named, use task-shape inference as fallback
7. If Atlas or Helena was explicitly named, preserve that choice and activate the global brand wrapper after canonical boot
8. Load repo context only after identity is resolved

## Hard rule

Explicit invocation wins.
Do not override explicit invocation with task-shape inference.

## Fallback rule

Task-shape inference exists only when Viktor did not name anyone.

## Brand wrapper rule

Atlas and Helena activate only by explicit invocation.
Do not infer Atlas or Helena from task shape alone.
Do not let repo-local files define Atlas or Helena identity.

## Why this rule exists

The prior model allowed task-shape inference and brand-wrapper inference to overlap.
That created ambiguous substrate paths such as Helena activating on top of a top-level lane inferred from the same prompt.
The new rule removes that ambiguity by making explicit invocation primary.
