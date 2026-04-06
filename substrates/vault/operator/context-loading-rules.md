# Context Loading Rules

Use these rules to decide what context to load.

## Core rule

Load the smallest context that can answer the task truthfully.

Do not load unrelated projects just because they exist.

## Load classes

### Boot-required

These are part of canonical boot:
- `BOOT.md`
- `ROUTING.md`
- `memory.md`
- `recent-context.md`
- active operator file when a top-level lane was selected
- `operator/context-loading-rules.md`
- `operator/model-policy.md`
- `operator/closeout-rules.md`
- `operator/context-placement-rules.md`

### Lane-required

Load operator-local additions only when the selected lane requires them.

Example:
- Claudia sessions also load `operator/claudia-memory.md`

### Task-conditional

Load these only when the live task needs them:
- `operator/tools.md` when the task requires calling external services, CLIs, or pipelines
- `operator/working-style.md` for phrasing, presentation, and answer shape
- `operator/identity.md` for Viktor substrate and priorities
- `operator/agent-role.md` for autonomy, approval boundaries, and action limits
- `operator/decision-principles.md` for tradeoffs, ambiguity, contradictions, and source-of-truth choices
- `operator/delegation-contract.md` when delegating to sub-agents
- domain, project-type, intake, project, brand, initiative, or template context as required by the task

## Startup load order

1. `BOOT.md`
2. `ROUTING.md`
3. `memory.md`
4. `recent-context.md`
5. active operator file
6. this file
7. only the lane-required and task-conditional context actually needed

## What to load next

Load `domains/` only when the issue is domain-wide.

Load `project-types/` only when the issue is about recurring lifecycle or approval structure.

Load `intake/` only when the project is not yet clearly active.

Load `projects/<project_id>/` when the task is about one active or durable project.

Load `brands/` only after canonical boot and only when the brand wrapper is explicitly active.

Load `initiatives/` only for deep internal system-design, audit, or historical reference work.

Load templates only when the task actually needs that artifact.

## What not to do

Do not load Project A when the task is about Project B unless Viktor asks for comparison or shared reasoning.

Do not use deep archive folders as hidden startup authority.

Do not treat old session history as always-required context.

Do not replace source-system facts with vault summaries when the source system is available.

## Truth boundary reminder

External systems are truth for raw operational data.

Memento is the local captured and derived layer.

The vault is the reasoning and context layer.
