# Internal Drive Migration Plan

## Goal

Make the internal SSD the primary home for active work.

Use the external drive as backup and archive, not as the day to day source of truth.

Keep GitHub as code and version backup, not as the only backup and not as the home for live auth state.

## Recommended internal home

Primary root:

`~/VIK`

Recommended structure:

- `~/VIK/ObsidianVault/`
- `~/VIK/Coding/`
- `~/VIK/Coding/Memento`

This gives the system one stable internal root and removes dependency on `/Volumes/BackBone` for normal operation.

## Current size snapshot, 2026-03-29

- Obsidian vault: about 56 MB
- Memento repo: about 3.1 MB
- Memento `state/`: about 2.2 MB
- Memento `node_modules/`: about 112 KB
- gws auth folders combined: about 6.5 MB
- `.codex`: about 237 MB

Conclusion: storage size is not the constraint. Path dependency is the real migration risk.

## Architecture decision

### Primary

Internal SSD becomes the source of truth for:

- active Obsidian vault
- active coding repos
- active runtime and operator workflows

### Secondary

External drive becomes:

- mirror backup target
- archive location for inactive repos and bulky assets
- optional Time Machine or clone destination

### Tertiary

GitHub remains:

- code backup
- version history
- collaboration and rollback layer

GitHub is not the sole backup layer.

## Path dependency audit

### Memento

Files containing `/Volumes/BackBone`:

- `pipeline/cli/install_schedule.sh`
- `pipeline/cli/scheduled_run.sh`
- historical plan files under `plan/`
- `proposals/memento_brainstorm.html`

Live blockers if Memento moves:

- `pipeline/cli/install_schedule.sh`
- `pipeline/cli/scheduled_run.sh`

### VIK OS vault

Files containing `/Volumes/BackBone` include:

- `VIK_OS/memory.md`
- `VIK_OS/recent-context.md`
- `VIK_OS/initiatives/operator-routing-and-handoffs/boot-manifest.json`
- additional notes and audit artifacts

Live blockers if the vault moves:

- boot and routing files that reference exact external paths
- any runtime config expecting the vault under `/Volumes/BackBone/ObsidianVault/...`

## Main risks

1. Hardcoded absolute paths break boot, routing, or scheduled runs.
2. External drive is currently part of the runtime assumption, not just backup.
3. A partial move would create split-brain state if some systems still write to BackBone while others write internal.
4. GitHub cannot replace machine backup or local operational auth storage.

## Recommended migration strategy

Do this as a controlled cutover, not a drag and drop move.

### Phase 1, establish internal root

Create:

- `~/VIK/`
- `~/VIK/ObsidianVault/`
- `~/VIK/Coding/`

Do not change production paths yet.

### Phase 2, copy active systems to internal

Copy active working sets to internal:

- current Obsidian vault
- Memento
- any other active repos under `/Volumes/BackBone/Coding/` that are used daily

Do not delete the external originals.

### Phase 3, update path-critical references

Update the live blockers first.

#### VIK OS

Review and update:

- boot-critical manifests
- memory references that should point to the new primary location
- recent-context references that must reflect the new primary repo path

#### Memento

Update:

- `pipeline/cli/install_schedule.sh`
- `pipeline/cli/scheduled_run.sh`

Anything operational should point to the internal repo path before cutover.

### Phase 4, introduce one stable root variable where possible

Reduce future migration pain by centralizing path roots.

Preferred direction:

- one root variable for VIK paths
- derive vault and repo paths from that root

Avoid continuing to spread hardcoded absolute paths.

### Phase 5, cut over daily work

After path updates are complete:

- open and operate the vault from internal storage
- run Memento from internal storage
- make internal the day to day source of truth

BackBone should become backup and archive only.

### Phase 6, backup automation

Set up at least one of these:

- Time Machine to external drive
- Carbon Copy Cloner mirror of `~/VIK`
- ChronoSync mirror of `~/VIK`

Minimum acceptable outcome:

- automated backup from internal to external
- GitHub push discipline for code repos

## Validation checklist before unplugging the drive

1. Boot chain loads from the internal vault path.
2. Memento CLI runs from the internal repo path.
3. Scheduled run scripts reference internal paths only.
4. No active workflow writes to the old external repo path.
5. Git remotes are intact.
6. Backup job to external drive is configured.
7. Laptop works normally with BackBone unplugged.

## What should stay off GitHub

Do not treat GitHub as the storage home for:

- live auth tokens
- local gws config folders
- sensitive local operational secrets
- machine-specific cache and runtime state unless explicitly intended

## Recommended tools

### Backup

- Time Machine for low friction machine backup
- Carbon Copy Cloner for explicit mirrored backups
- ChronoSync for controlled folder sync workflows

### Code

- Git + GitHub for repos and version history

### Optional refinement

If the internal-root migration succeeds, the next technical improvement is to replace remaining absolute path assumptions with a single configurable root.

## Recommended cutover order

1. Create `~/VIK`
2. Copy vault to `~/VIK/ObsidianVault`
3. Copy Memento to `~/VIK/Coding/Memento`
4. Update VIK OS boot-critical path references
5. Update Memento schedule scripts
6. Validate boot and Memento locally from internal
7. Set external backup job
8. Only then stop using BackBone as the active home

## Technical judgment

This migration is worth doing.

Your active footprint is small.

The only meaningful complexity is path cleanup and avoiding split-brain writes during transition.

If done in the order above, the move is low risk and structurally cleaner than staying mounted to an external drive all day.
