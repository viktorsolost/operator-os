# Project Type Context

This folder defines reusable logic for recurring classes of work.

Use this folder for:
- lifecycle expectations
- approval rules
- recurring workflow structure
- durable assumptions that apply to a project type

Do not put live project state here.
Do not duplicate operator-wide guidance here.

Routing:
- Start with the relevant project-type folder's `CLAUDE.md`
- Read `lifecycle.md` when the question is about project phases, pacing, or sequence
- Read `approval-rules.md` when the question is about approvals, checkpoints, or escalation
- If the issue is domain-wide rather than project-type-specific, check `../domains/`
- If the issue is project-specific, check `../intake/` or `../projects/`

Current project types should stay short and operational, not theoretical.
