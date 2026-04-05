# Active Project Context

This folder holds durable context for an active project in `VIK_OS/projects/`.

Purpose:
- accumulate decisions, observations, and reasoning as the project executes
- separate durable meaning from runtime state (task_state, action_threads, project JSON)
- give Claude persistent memory across conversations about this project

Rules:
- decisions.md is the primary write-back target for Claude (proposed/observation only)
- open-questions.md tracks unresolved questions that affect execution
- summary.md holds stable identity and framing
- references.md links to key external docs, threads, and systems
- do not copy runtime JSON into these files verbatim
- Viktor approves; Claude proposes

File roles:
- `summary.md` = stable project identity and current framing
- `open-questions.md` = unresolved questions affecting execution
- `decisions.md` = durable decisions and proposed reasoning
- `references.md` = key links, docs, and system references
