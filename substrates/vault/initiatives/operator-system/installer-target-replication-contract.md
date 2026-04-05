# Installer-Target Replication Contract

Status: narrow infrastructure sublayer for the broader instantiation workstream.
Location decision: keep the replication contract in one canonical vault location, `initiatives/operator-system/installer-target-replication-contract.md`.
Why here: replication remains useful as installer-facing infrastructure doctrine, but it no longer defines the top-level product goal.

Precedence rule:
- if this file conflicts with `system-instantiation-contract.md`, `system-instantiation-contract.md` wins
- replication is now a sublayer inside instantiation, not the top authority
- for file-level treatment classifications, defer to `installer-v1-manifest.json` — this file's per-file claims predate the 2026-04-04 manifest remediation

## Purpose

This file defines the clean replication target an installer may build against.
It does not implement the installer.
It does not redesign boot, routing, or operator structure.
It converts the live system into an explicit install contract so installer work can begin without tribal knowledge.

## Contract summary

Installer target:
- reusable core doctrine and substrate needed by the instantiation system
- runtime bridge files that point into the instantiated doctrine tree
- runtime-local configs generated or prompted from this contract, not blindly copied from Viktor's current machine
- fresh-install validation framed for a new machine, not for Viktor's seasoned machine

Installer must never assume:
- the username is `viktorsl`
- the source machine's auth state can be copied safely
- runtime logs, caches, backups, or workspace state are install inputs
- repo-local contract files in `~/VIK/Coding/Memento/docs/contracts/` are live runtime authority
- live-machine success proves fresh-install health

## 1. Replication truth surface

### 1.1 Canonical replication truth set

These are the installer-facing source documents.

#### Reusable core doctrine and substrate surfaces
- `BOOT.md`
- `ROUTING.md`
- owner-neutral portions of `STRUCTURE.md` only
- owner-neutral operator doctrine under `operator/` only, excluding any file whose current wording still assumes Viktor, Viktor approval, Viktor voice, or VIK OS as Viktor-owned identity and therefore must be rewritten
- reusable brand-wrapper mechanics under `brands/`, excluding seed brand-pack content such as `brands/eterno/` unless intentionally shipped as sample content
- reusable `domains/` doctrine
- reusable `project-types/` doctrine
- `templates/`
- owner-neutral Memento substrate code and contracts only

#### Deep vault doctrine that the installer must read but not elevate into startup authority
- `initiatives/operator-system/system-instantiation-contract.md`
- `initiatives/operator-system/system-instantiation-generated-file-matrix.md`
- `initiatives/operator-system/system-instantiation-onboarding-schema.md`
- `initiatives/operator-system/runtime-bridges.md`
- `initiatives/operator-system/validation.md`
- `initiatives/operator-routing-and-handoffs/runtime-self-check.md`
- this file, `initiatives/operator-system/installer-target-replication-contract.md`

#### Runtime bridge targets that must exist after install
- `~/.codex/instructions.md`
- `~/.claude/CLAUDE.md`
- `~/.gemini/GEMINI.md`
- `~/.openclaw/workspace/START_HERE.md`
- `~/.openclaw/workspace/AGENTS.md`

These files are part of the install surface, but their live copies are not the canonical truth source.
The canonical truth source is the vault doctrine they bridge into.

### 1.2 Reference-only set

These may inform implementation, but they are not installer authority.

- `~/VIK/Coding/Memento/docs/contracts/atlas-runtime.md`
- `~/VIK/Coding/Memento/docs/contracts/helena-runtime.md`
- `~/VIK/Coding/Memento/docs/contracts/brand-session-loader.md`
- repo-local plans under `~/VIK/Coding/Memento/plan/`
- audit artifacts under `VIK_OS/audits/`
- runtime logs, caches, backups, sqlite files, shell snapshots, and debug traces under runtime home folders
- runtime-specific local memory files such as `~/.openclaw/workspace/memory/`

## 2. Install-surface inventory

| Surface | Must exist after install | Treatment | Notes |
|---|---|---|---|
| reusable doctrine and substrate tree under `~/VIK/ObsidianVault/VIK_OS` | Yes | Copy plus selective rewrite | Copy reusable core only. Rewrite any required file whose current wording still carries owner-specific identity, approval framing, voice assumptions, or target paths. Do not treat the full VIK tree as blindly copyable payload. |
| `~/.codex/instructions.md` | If Codex selected | Generate | Bridge file. Point to canonical vault boot. Do not hardcode source-machine paths. |
| `~/.claude/CLAUDE.md` | If Claude selected | Generate | Bridge file. Same doctrine as live bridge, parameterized to target home. |
| `~/.gemini/GEMINI.md` | If Gemini selected | Generate | Bridge file only. Keep repo context downstream of boot. |
| `~/.openclaw/workspace/START_HERE.md` | If OpenClaw selected | Generate | Bridge file. |
| `~/.openclaw/workspace/AGENTS.md` | If OpenClaw selected | Generate | Bridge file plus workspace-local startup instructions. |
| `~/.codex/config.toml` | If Codex selected | Generate or patch | Never blind-copy. Current live file contains absolute paths and project allowlists. |
| `~/.openclaw/openclaw.json` | If OpenClaw selected | Generate from safe template plus user prompts | Never blind-copy. Current live file contains secrets, absolute workspace path, device/channel state, and runtime-specific settings. |
| `~/.gemini/settings.json` | If Gemini selected | Generate or patch | Keep runtime settings only. Do not treat auth state as canonical. |
| `~/.gemini/projects.json` | If Gemini selected | Generate | Current live file is machine-path specific. |
| `~/.gemini/trustedFolders.json` | If Gemini selected | Generate | Must point to the target machine's chosen paths. |
| `~/.gemini/google_accounts.json` | User-specific | Prompt user or leave untouched | Account identity is not portable doctrine. |
| `~/.gemini/oauth_creds.json` | User-specific | Prompt user or leave untouched | Auth secret. Never copy from source machine. |
| `~/.codex/auth.json` | User-specific | Prompt user or leave untouched | Auth secret. Never copy. |
| `~/.openclaw/credentials/*` | User-specific | Prompt user or leave untouched | Auth and channel secrets. Never copy. |
| `~/.openclaw/identity/*` | Machine-specific | Generate on target runtime | Device identity must be target-local. |
| `~/.openclaw/devices/*` | Machine-specific | Leave untouched or generate | Pairing state is not portable. |
| `~/.openclaw/telegram/*` | User-specific | Leave untouched or prompt user | Message offsets and command hashes are live state, not install payload. |
| `~/.claude` caches, backups, debug logs | No | Exclude | Runtime state only. |
| `~/.codex` logs, history, sqlite state, caches | No | Exclude | Runtime state only. |
| `~/.gemini` state, browser profile, installation IDs | No | Exclude | Runtime state only. |
| `~/.openclaw` logs, media, subagent runs, sqlite memory, update-check files | No | Exclude | Runtime state only. |
| owner-neutral Memento code and contracts | If Memento substrate selected | Copy | Copy only owner-neutral, path-neutral substrate files. |
| Memento path-bearing config and startup text | If Memento substrate selected | Generate or rewrite | Rewrite target paths and owner-facing wording. |
| Memento registries, captures, caches, local databases, and runtime residue | No | Exclude unless an empty starter slot is explicitly required | Never ship Viktor state. |

## 3. Boundary treatment rules

### 3.1 Copy
- canonical vault doctrine under `~/VIK/ObsidianVault/VIK_OS`
- owner-neutral Memento code and contracts only

Copy means preserve the canonical content itself.
Copy does not mean mirror Viktor's home directory.
Copy also does not override the generated-file matrix. If a required file is owner-bound, it is not copy-core.

### 3.2 Generate
- all runtime bridge files
- runtime config files whose live copies contain machine-local paths, workspaces, trusted-folder lists, or runtime-selected project lists
- target-local device and workspace identity where the runtime requires it
- Memento path-bearing config, install-local startup text, and any required scaffold whose slot must exist but whose content must not come from Viktor

Generate from this contract, not from live-machine runtime state.
Use `$HOME` or installer-resolved target paths, never `/Users/viktorsl/...`.

### 3.3 Symlink or point
- runtime bridges may point to the canonical vault location chosen during install
- repo-local reference docs may point back to global vault authority, but they are not required for a minimal install

The chosen canonical vault location should be one install parameter.
Once chosen, all bridges point there.

### 3.4 Prompt user
- runtime auth setup
- account selection
- external service tokens
- any channel integration such as OpenClaw Telegram
- any runtime that needs trusted-folder confirmation or account binding

### 3.5 Leave untouched
- pre-existing user auth files unless the user explicitly opts to replace them
- runtime logs, caches, histories, media, pending-device state, debug traces, and browser profiles

### 3.6 Validate only
- repo-local implementation-reference contracts
- optional runtimes the user did not choose to install
- existing user-specific config that the installer did not create
- repo-local Memento implementation notes that inform substrate behavior but are not canonical install truth

## 4. Fresh-install validation pack

This validation pack is for installer-phase readiness only.
Final owner-specific output validation belongs to the broader instantiation contract after onboarding runs.

### 4.1 Universal failure checks
- canonical doctrine tree exists at the chosen target path
- `BOOT.md`, `ROUTING.md`, `operator/model-policy.md`, `system-instantiation-contract.md`, and this replication contract exist in the expected locations
- installer-owned reusable core, bridge templates, and safe config scaffolds exist where required
- no installer template or scaffold still contains `/Users/viktorsl/` or `/Volumes/BackBone/`
- no auth or device secret was copied from the source machine as installer payload

### 4.2 Warning checks
- optional runtimes not selected for install are absent
- repo-local reference docs are not present
- richer automated smoke tests do not yet exist for every runtime
- runtime-specific user auth has not been completed yet

Warnings do not fail a fresh install if the selected install scope is otherwise healthy.

### 4.3 Runtime-specific checks

#### Codex
- Codex bridge template or generated bridge output can resolve to canonical vault boot
- `~/.codex/config.toml`, if scaffolded at installer phase, does not point to `/Users/viktorsl/.codex/instructions.md`
- project allowlists, if scaffolded, reference target-machine paths only

#### Claude
- Claude bridge template or generated bridge output can point to the canonical vault bridge chain
- Claude-specific caches or backups are absent from the install payload

#### Gemini
- Gemini bridge template or generated bridge output can point to canonical vault boot
- `projects.json` and `trustedFolders.json`, if scaffolded, point only to target-machine paths
- auth files are either user-supplied post-install or intentionally absent

#### OpenClaw
- OpenClaw bridge templates or generated bridge outputs for `START_HERE.md` and `AGENTS.md` can point into canonical boot
- `~/.openclaw/openclaw.json`, if scaffolded, uses target-machine workspace paths
- no source-machine Telegram token, gateway token, device identity, or pairing state was copied into any scaffolded config
- runtime self-check docs may remain as reference, but install validity does not depend on Viktor-specific absolute paths inside historical validation notes

### 4.4 Fresh-install pass condition
A fresh install is healthy when:
- the canonical vault doctrine is present
- selected runtime bridge templates and safe config scaffolds are present for onboarding to complete
- selected runtime configs that already exist at installer phase are target-local, not copied runtime residue
- secrets and device identity were not cloned from the source machine
- any remaining missing pieces are only onboarding-generated owner content, user-auth completion steps, or optional runtimes outside the selected install scope

## 5. Hidden-assumption sweep

| Assumption found in inspection | Classification | Required treatment |
|---|---|---|
| Username-specific absolute paths such as `/Users/viktorsl/...` appear in runtime configs and validation docs | Must become parameterized | Replace with `$HOME` or installer-resolved target paths in generated outputs. |
| Deprecated BackBone paths still appear in live Codex project allowlists | Must be excluded from replication | Do not import source-machine allowlists blindly. |
| `~/.codex/config.toml` points to `/Users/viktorsl/.codex/instructions.md` and a machine-local project list | Must become generated | Build target-local config on install. |
| `~/.openclaw/openclaw.json` contains auth profiles, Telegram token, gateway token, workspace path, and local runtime state | Must be split between generated and user-specific | Generate safe config skeleton, prompt for secrets, never copy live tokens or device state. |
| `~/.gemini/projects.json` and `trustedFolders.json` assume Viktor's repo paths already exist | Must become generated | Regenerate from chosen install paths. |
| `~/.gemini/google_accounts.json` and `oauth_creds.json` depend on user identity and auth | Must be documented as user-specific | Do not replicate. |
| OpenClaw device and pairing files assume an already seasoned machine | Must be excluded from replication | Let target runtime create them. |
| Runtime logs, sqlite state, browser profile files, media, debug traces, and caches exist because the current machine is already in use | Must be excluded from replication | Never treat runtime residue as installer payload. |
| Historical validation note `runtime-self-check.md` uses `/Users/viktorsl/...` absolute paths | Acceptable reference-only history, but not installer output | Do not use it as a generated validation artifact. Use this contract's fresh-install checks instead. |
| Repo-local `docs/contracts/*.md` files describe brand runtime shape | Acceptable reference-only default | Keep as implementation reference, not installer authority. |

## 6. Installer scope boundary

Inside installer scope:
- place reusable doctrine and substrate
- place template sources, bridge templates, and safe config scaffolds that onboarding will fill
- generate runtime bridges only when those bridges are install-time scaffolds rather than owner-context outputs
- generate or patch runtime-local configs that are safe to synthesize without owner-specific lived context
- hand off to onboarding for all Layer B and Layer C generation
- run the fresh-install validation pack above

Outside installer scope:
- auth automation beyond prompting and boundary definition
- copying live secrets, accounts, or device identity
- replicating logs, caches, histories, or seasoned runtime state
- generating owner-specific doctrine, memory, recent context, or runtime detail content from user answers without the onboarding layer
- redesigning VIK OS doctrine
- promoting repo-local implementation-reference docs into live authority

## 7. Readiness judgment

Judgment: ready for installer implementation, with contract discipline.

Reasoning:
- the missing installer-facing replication truth is now defined in one canonical vault location
- the install surface is explicitly classified by copy, generate, point, prompt, leave untouched, and validate-only treatment
- the hidden machine-local assumptions were found and normalized into installer rules instead of being left as tribal knowledge
- the remaining gaps are implementation work, user-auth completion, and optional runtime-specific automation, not unresolved doctrine

What is still not allowed:
- blind cloning of Viktor's runtime home folders
- treating runtime configs with secrets or device identity as portable install payloads
- using live-machine smoke success as the only install proof
