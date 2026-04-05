# Intake Project Template

This template is the standard starter structure for a newly identified project in `VIK_OS/intake/`.

Purpose:
- create a consistent intake context shape
- separate stable summary from unresolved questions
- preserve durable decisions without mixing in runtime state
- support explicit promotion from intake to active project when ready

Rules:
- use this template when a likely real project has been identified
- do not treat the project as active by default
- keep unresolved identity or setup questions inside intake until they are resolved
- do not copy runtime JSON into these markdown files verbatim
- use the markdown files to hold durable meaning, reasoning, and references

File roles:
- `summary.md` = concise stable summary of what this project appears to be
- `open-questions.md` = unresolved identity, setup, or routing questions
- `decisions.md` = durable intake decisions and approved direction
- `references.md` = important evidence, source docs, or linked systems
- `setup-status.md` = human-readable intake setup reasoning derived from the runtime state model

Promotion rule:
Promote the project from `intake/` to `projects/` when:
- project identity is accepted
- setup direction is sufficiently resolved
- the project becomes an active execution surface
