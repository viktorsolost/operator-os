# VIK OS Structure Map

This file explains what each top-level folder in `VIK_OS/` is for.

This is a structure guide, not a boot file.

## Core startup files

- `BOOT.md` — canonical startup sequence
- `ROUTING.md` — routing authority for lane selection and handoffs
- `memory.md` — small durable cross-session truths
- `recent-context.md` — small short-horizon context

## Core context folders

- `operator/` — live operator identity, role rules, and behavior rules
- `domains/` — durable domain knowledge shared across multiple projects
- `project-types/` — reusable structure for recurring classes of work
- `intake/` — projects not yet fully accepted into active execution
- `projects/` — approved active or durable project context
- `templates/` — reusable folder and file starters

## Supporting system folders

- `brands/` — global post-boot brand wrapper context, brand packs, and brand operators
- `handoffs/` — explicit cross-operator handoff artifacts
- `initiatives/` — deep context for internal system-building efforts
- `apps/` — app-level product context and archives related to products built around the system
- `audits/` — audit artifacts, review outputs, and historical validation material

## Placement rules

- Do not put raw pipeline state in the vault
- Do not put project-specific detail in global files unless it is truly cross-project
- Do not put canonical startup authority in deep archive folders
- Put project history inside the project folder when possible
- Keep `memory.md` and `recent-context.md` small
- Use `operator/context-placement-rules.md` to decide where new context belongs

## Canonical split

Use the vault for reasoning, structure, context, and meaning.

Use Memento for pipeline logic, runtime state, captures, and derived machine-readable outputs.

Use external systems as the source of truth for raw operational data.
