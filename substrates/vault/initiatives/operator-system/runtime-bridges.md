# Runtime Bridges

## Bridge principle

Every runtime must enter through its global bridge first.
The bridge points into canonical VIK OS boot.
The bridge does not invent local routing truth.

## Current bridges

### Codex
`~/.codex/instructions.md`

### Claude
`~/.claude/CLAUDE.md`
then `~/VIK/ObsidianVault/VIK_OS/CLAUDE.md`
then `BOOT.md`

### Gemini
`~/.gemini/GEMINI.md`

### OpenClaw
`~/.openclaw/workspace/START_HERE.md`
plus `~/.openclaw/workspace/AGENTS.md`

## Current behavior

All updated bridges now:
- point to canonical VIK OS boot first
- preserve explicit operator invocation
- activate Atlas or Helena only when explicitly named
- keep repo context downstream of identity resolution

## Global brand wrapper files

- `~/VIK/ObsidianVault/VIK_OS/brands/session-wrapper.md`
- `~/VIK/ObsidianVault/VIK_OS/brands/runtime.md`
- `~/VIK/ObsidianVault/VIK_OS/brands/operators/atlas.md`
- `~/VIK/ObsidianVault/VIK_OS/brands/operators/helena.md`
