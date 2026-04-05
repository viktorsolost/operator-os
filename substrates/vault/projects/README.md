# Projects

Directories prefixed with `test-` are pipeline test fixtures, not real projects.

Humans, audits, and loader logic should exclude `test-*` directories from active project context unless the task is explicitly about fixture testing.

Do not treat a `test-*` folder as a live project just because it sits under `projects/`.
