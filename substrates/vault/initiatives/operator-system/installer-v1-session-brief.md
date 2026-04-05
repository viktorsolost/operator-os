# Installer v1 — Session Brief

Status: SUPERSEDED. This file was the original session brief for installer v1 work. It contains stale counts, stale classifications, and stale next-steps. Retained as historical context only.

**For file-level treatment classifications, defer to `installer-v1-manifest.json`.** For current implementation status, see the session log and the coding packets in `~/VIK/Coding/Memento/plan/`.

Last updated: 2026-04-04 (deferral header added)

## What This Is

VIK OS is Viktor's personal operator system. It runs across multiple AI
runtimes (Claude, Codex, Gemini, OpenClaw) with 5 operator agents
(Claudia, Anton, Jonah, Vera, Lev) and 2 brand wrappers (Atlas, Helena).

The installer v1 project packages this system so a new user can install
their own instance. Viktor's live system stays untouched. The installer
reads his vault as source, produces a clean package, and the new user
runs onboarding to personalize it.

## Critical Rule

DO NOT EDIT Viktor's local vault files for installer purposes.

Viktor's vault at `~/VIK/ObsidianVault/VIK_OS/` is his live operating
system. All neutralization (replacing "Viktor" with owner placeholders)
happens in the build script output, not in the source files.

New installer artifacts go in:
`VIK_OS/initiatives/operator-system/`

## Artifacts Created

All live in `VIK_OS/initiatives/operator-system/`:

| File | Purpose |
|---|---|
| `installer-v1-manifest-spec.md` | Defines the 8-field manifest schema, locked file decisions, authority key |
| `installer-v1-manifest.json` | Machine-readable row-by-row manifest. Every file classified with all 8 fields. Build script input. |
| `installer-v1-full-comparison.md` | Human-readable 1-to-1 comparison of every file (local vs installed) |
| `installer-v1-full-comparison.html` | Same comparison as visual HTML with color-coded tables and tree view |
| `installer-v1-onboarding-phase3-tools.md` | Addendum to onboarding schema — adds "where does your work live?" phase for tool/truth-source selection |
| `installer-v1-session-brief.md` | This file |

## Pre-Existing Authority Documents (not edited)

These were already in the vault before installer work began. They define
the instantiation contract, file matrix, onboarding schema, replication
contract, and runtime bridges. The installer reads them as source truth.

- `system-instantiation-contract.md`
- `system-instantiation-generated-file-matrix.md`
- `system-instantiation-onboarding-schema.md`
- `installer-target-replication-contract.md`
- `runtime-bridges.md`

## Key Decisions Made

### Authority file ship/no-ship (locked 2026-04-04)

| File | Decision | Reason |
|---|---|---|
| system-instantiation-contract.md | do_not_ship | Master blueprint — builder uses it |
| system-instantiation-generated-file-matrix.md | do_not_ship | Packing list — builder uses it |
| system-instantiation-onboarding-schema.md | do_not_ship | Questionnaire — already answered |
| installer-target-replication-contract.md | do_not_ship | Inspection checklist — already passed |
| runtime-bridges.md | **ship** | Wiring diagram — owner needs this |
| installer-v1-manifest-spec.md | do_not_ship | Classification schema — builder uses it |

### Other locked decisions (in manifest spec)

- `domains/exhibitions/rules.md` → exclude (owner_specific_residue, cleanup debt)
- `project-types/intake-decision-tree.md` → rewrite-template (names Viktor/Claudia in approvals)
- `operator/clarification-protocol.md` → copy-core (clean reusable mechanic)

### Template neutralization approach

Viktor's files say "Viktor approves", "Viktor's voice", etc. These are
NOT edited in place. The build script reads them and outputs template
versions with `{{owner_name}}` placeholders. Viktor's vault stays as-is.

### Onboarding Phase 3 addition

The original onboarding schema (phases 1-4) was missing a critical
question: "where does your work live?" Phase 3 (tools + truth sources)
was added as a separate addendum file, not as an edit to the original
schema. This determines which Memento sync engines get installed.

## Numbers

- ~321 files in VIK_OS today
- ~38 copy-core (ship identical)
- ~22 rewrite-template (same structure, owner identity swapped by build script)
- ~8 generate-fresh (new from onboarding)
- ~247 exclude (77% — Viktor's projects, brands, archives, prototypes, test residue)
- 0 pending decisions

## How the Installer Works

### Build side (Viktor runs once)

Build script reads Viktor's vault + manifest.json → outputs installer package:
- `core/` — copy-core files, byte-for-byte
- `templates/` — rewrite files with {{owner_name}} etc. placeholders
- `scaffolds/` — empty/starter structures for fresh files
- Onboarding script

### Install side (new user runs)

1. Onboarding collects: name, system name, paths, timezone, role, tools, runtimes
2. Copy core files to target vault
3. Generate rewrite files from templates (replace placeholders with answers)
4. Generate fresh files from onboarding answers
5. Generate runtime bridges for selected runtimes
6. Generate runtime configs with target-local paths
7. Validation — no Viktor paths, no Viktor auth, all bridges resolve

## What's Done

- [x] Manifest spec (schema + locked decisions)
- [x] Full file-by-file comparison (md + html)
- [x] All 6 authority file decisions locked
- [x] Onboarding Phase 3 tools addendum
- [x] Machine-readable manifest (JSON, all 8 fields, every file)
- [x] Session brief (this file)

## What's Next

- [ ] Audit the manifest (prompt provided to Viktor for a separate agent to run)
- [ ] Build script that reads manifest + vault → outputs installer package
- [ ] Onboarding script that runs on the new user's machine
- [ ] Validation script that checks the installed instance
- [ ] Decision on artifact shape: git repo, CLI tool, or single script
- [ ] Optional: split domains/exhibitions/rules.md (cleanup debt, not blocking installer)

## Audit Prompt

A full audit prompt was provided to Viktor. It checks:
1. Manifest completeness (every real file has a row)
2. Schema compliance (all 8 fields, valid values)
3. Classification accuracy (copy-core files actually have no Viktor refs)
4. Locked decisions match between spec and JSON
5. Consistency between comparison doc and manifest
