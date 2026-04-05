# Domain Context

This folder holds durable domain-level context that is broader than a single project and narrower than Viktor-wide operator context.

Use this folder for:
- domain vocabulary
- recurring domain rules
- interpretation patterns
- durable heuristics shared across multiple project types

Do not put live runtime state here.
Do not put project-specific facts here unless they became durable domain knowledge.

Routing:
- If the issue is about general operator behavior, go to `../operator/`
- If the issue is about recurring structure for a class of projects, go to `../project-types/`
- If the issue is specific to an intake project, go to `../intake/`
- If the issue is specific to an active project, go to `../projects/`

If a relevant domain folder exists, read that folder's `CLAUDE.md` first, then only the specific supporting files you need.
