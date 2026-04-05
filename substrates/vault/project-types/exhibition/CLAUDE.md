# Exhibition Project Type

This folder defines reusable structure for exhibition projects.

Use this folder for:
- recurring exhibition lifecycle expectations
- approval logic that applies across exhibition projects
- routing for recurring exhibition issues

Do not put project-specific facts here.
Do not put broad domain vocabulary or broad exhibition heuristics here when they belong in `../../domains/exhibitions/`.

Routing:
- If the issue is about the overall operator style, check `../../operator/CLAUDE.md`
- If the issue is about durable cross-session truth that may shape judgment, check `../../memory.md`
- If the issue is about likely relevant nearby-session context, check `../../recent-context.md`
- If the issue is about exhibition terminology or interpretation, check `../../domains/exhibitions/glossary.md`
- If the issue is about exhibition-wide practical heuristics or risks, check `../../domains/exhibitions/rules.md`
- If the issue is about recurring exhibition lifecycle, check `lifecycle.md`
- If the issue is about recurring approval logic, check `approval-rules.md`
- If the issue is specific to a newly identified exhibition project, go to `../../intake/`
- If the issue is specific to one active exhibition project, go to `../../projects/`
