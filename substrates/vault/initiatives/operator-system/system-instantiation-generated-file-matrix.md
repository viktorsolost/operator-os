# System Instantiation Generated File Matrix

Status: input-to-output dependency mapping for new-user system instantiation.

**File-level treatment authority:** For file-level treatment classifications (copy-core, rewrite-template, generate-fresh, exclude), defer to `installer-v1-manifest.json`. This file's treatment assignments predate the 2026-04-04 manifest remediation and contain known stale classifications. This file is retained for its input-to-output dependency mapping (which onboarding inputs produce which generated files), not as a treatment authority.

This file maps:
- onboarding inputs
- generated or rewritten files
- file treatment mode (STALE — see note above)
- whether the file is reusable core, template-and-rewrite, or user-generated

Use with:
- `initiatives/operator-system/installer-v1-manifest.json` (canonical treatment authority)
- `initiatives/operator-system/system-instantiation-contract.md`
- `initiatives/operator-system/system-instantiation-onboarding-schema.md`

## 1. Treatment modes

- `copy-core` = copy near-identically as reusable system core
- `rewrite-template` = generate from a template using onboarding inputs
- `generate-fresh` = create new owner-specific starter content
- `prompt-later` = do not create from Viktor, defer to user setup
- `exclude` = never ship from Viktor into the new instance

## 2. Core file matrix

| File or surface | Layer | Treatment | Main inputs | Notes |
|---|---|---|---|---|
| `BOOT.md` | reusable core | copy-core | none | Preserve mechanics. |
| `ROUTING.md` | reusable core | copy-core | none | Preserve lane logic. |
| `STRUCTURE.md` | template-and-rewrite | rewrite-template | system_name | Required structure guide, but rewrite owner-facing system naming where identity-specific. |
| `operator/anton.md` | template-and-rewrite | rewrite-template | owner_name, system_name | Preserve role dynamics, but current role file still references Viktor and VIK OS directly. |
| `operator/jonah.md` | template-and-rewrite | rewrite-template | owner_name, system_name | Preserve role dynamics, but current role file still references Viktor and VIK OS directly. |
| `operator/vera.md` | template-and-rewrite | rewrite-template | owner_name, system_name | Preserve role dynamics, but current role file still references Viktor and VIK OS directly. |
| `operator/lev.md` | template-and-rewrite | rewrite-template | owner_name, system_name | Preserve role dynamics, but current role file still references Viktor and VIK OS directly. |
| `operator/claudia.md` | template-and-rewrite | rewrite-template | owner_name, system_name | Preserve role dynamics, but current role file still references Viktor and VIK OS directly. |
| `operator/working-style.md` | template-and-rewrite | rewrite-template | owner_name, system_name, preferred_reporting_style, tone_profile | Required behavior file, but current wording assumes Viktor and Viktor's voice. |
| `operator/decision-principles.md` | template-and-rewrite | rewrite-template | owner_name, system_name | Required behavior file, but current wording assumes Viktor-specific decision protection and escalation framing. |
| `operator/agent-role.md` | template-and-rewrite | rewrite-template | owner_name | The live file currently names Viktor directly. Rewrite until a reusable owner-neutral version exists. |
| `operator/closeout-rules.md` | template-and-rewrite | rewrite-template | owner_name | Required mechanics file, but current approval wording is still keyed to Viktor. |
| `operator/context-placement-rules.md` | reusable core | copy-core | none | Preserve mechanics. |
| `operator/context-loading-rules.md` | template-and-rewrite | rewrite-template | owner_name | Required mechanics file, but current identity-loading wording still names Viktor substrate and priorities. |
| `operator/delegation-contract.md` | reusable core | copy-core | none | Preserve mechanics. |
| `templates/` | reusable core | copy-core | none | Preserve reusable project and handoff structure. |
| owner-neutral Memento code and contracts | reusable core substrate | copy-core | none | Copy only code and contracts that are owner-neutral and path-neutral. |

## 3. Template-and-rewrite file matrix

| File or surface | Layer | Treatment | Main inputs | Generated changes |
|---|---|---|---|---|
| `~/.codex/instructions.md` | template-and-rewrite | rewrite-template | owner_name, system_name, vault_location | Rewrite owner/system naming and canonical boot path. |
| `~/.claude/CLAUDE.md` | template-and-rewrite | rewrite-template | owner_name, system_name, vault_location | Rewrite owner/system naming and canonical boot path. |
| `~/.gemini/GEMINI.md` | template-and-rewrite | rewrite-template | owner_name, system_name, vault_location | Rewrite owner/system naming and canonical boot path. |
| `~/.openclaw/workspace/START_HERE.md` | template-and-rewrite | rewrite-template | owner_name, system_name, vault_location | Rewrite owner/system naming and canonical boot path. |
| `~/.openclaw/workspace/AGENTS.md` | template-and-rewrite | rewrite-template | owner_name, system_name, vault_location, timezone | Rewrite startup wording for the new owner and target paths. |
| `operator/identity.md` | template-and-rewrite | rewrite-template | owner_name, system_name, primary_role, timezone, tone_profile, business_context, priority_modes, preferred_reporting_style | Canonical generated owner-identity file. |
| startup labels and owner-facing install text | template-and-rewrite | rewrite-template | owner_name, system_name | Replaces Viktor and VIK OS naming where identity-specific. |
| reusable brand-wrapper mechanics under `brands/session-wrapper.md`, `brands/runtime.md`, and `brands/operators/` | reusable core | copy-core | none | Preserve wrapper mechanics only. Do not treat brand-pack content as reusable core by default. |
| path-bearing runtime config scaffolds | template-and-rewrite | rewrite-template | home_root, vault_location, workspace_root, selected_runtimes | Installer places these as templates or safe scaffolds only. Replace all source-machine paths with target-machine paths. |
| Memento path-bearing config, install scripts, and owner-facing startup text | template-and-rewrite | rewrite-template | home_root, workspace_root, vault_location, selected_runtimes, system_name | Rewrite target paths and owner-facing wording. Do not treat path-bound substrate files as copy-core. |

## 4. User-generated file matrix

| File or surface | Layer | Treatment | Main inputs | Generated changes |
|---|---|---|---|---|
| `memory.md` | user-generated | generate-fresh | owner_name, primary_role, business_context, priority_modes | Create fresh starter memory with no Viktor history. |
| `recent-context.md` | user-generated | generate-fresh | owner_name, system_name, selected_runtimes, install state | Create fresh install-state starter context only. |
| starter project registry or starter project scaffolds | user-generated | generate-fresh | project_categories, business_context | Optional starter projects for the new owner. |
| starter brand registry or brand scaffolds | user-generated | generate-fresh | brand_categories, business_context | Optional starter brand context for the new owner. Do not import `brands/eterno/` as live owner content by default. |
| `~/.codex/config.toml` | user-generated runtime config | generate-fresh | home_root, workspace_root, vault_location, codex_projects | Create target-local config, never import Viktor's allowlists or paths. |
| `~/.gemini/projects.json` | user-generated runtime config | generate-fresh | gemini_project_paths | Create target-local project list. |
| `~/.gemini/trustedFolders.json` | user-generated runtime config | generate-fresh | gemini_trusted_folders | Create target-local trusted folders. |
| `~/.gemini/settings.json` safe scaffold | user-generated runtime config | generate-fresh or rewrite-template | selected_runtimes | Generate safe starter settings without Viktor auth state. |
| `~/.openclaw/openclaw.json` safe scaffold | user-generated runtime config | generate-fresh | openclaw_workspace, openclaw_channels, selected_runtimes | Create safe starter config with no tokens, no device identity, no Viktor state. |
| runtime-specific starter folders | user-generated | generate-fresh | selected_runtimes, workspace_root | Create empty runtime-local structure where needed. |
| Memento registries, local databases, captures, caches, histories, and other runtime state | user-generated or excluded runtime state | generate-fresh only when the slot must exist | workspace_root, selected_runtimes | Never import Viktor state. Create only empty starter slots that the product explicitly requires. |

## 5. Prompt-later matrix

| File or surface | Treatment | Main inputs | Reason |
|---|---|---|---|
| `~/.codex/auth.json` | prompt-later | connect_accounts_now, account_connections | User auth only. |
| Claude auth state | prompt-later | connect_accounts_now, account_connections | User auth only. |
| `~/.gemini/oauth_creds.json` | prompt-later | connect_accounts_now, account_connections | User auth only. |
| `~/.gemini/google_accounts.json` | prompt-later | connect_accounts_now, account_connections | User account identity only. |
| `~/.openclaw/credentials/*` | prompt-later | connect_accounts_now, account_connections, openclaw_channels | User secret material only. |
| `~/.openclaw/identity/*` | prompt-later or runtime-generated | selected_runtimes | Must be created for the new machine, never copied. |
| `~/.openclaw/devices/*` | prompt-later or runtime-generated | selected_runtimes | Pairing state is machine-local. |

## 6. Exclude matrix

| File or surface | Treatment | Why excluded |
|---|---|---|
| Viktor `memory.md` history | exclude | Personal context must not transfer. |
| Viktor `recent-context.md` history | exclude | Personal context must not transfer. |
| `~/.codex/auth.json` from source machine | exclude | Secret and user-specific. |
| `~/.codex/history.jsonl`, sqlite state, logs, caches | exclude | Runtime residue only. |
| Claude backups, debug files, caches | exclude | Runtime residue only. |
| `~/.gemini/oauth_creds.json` from source machine | exclude | Secret and user-specific. |
| `~/.gemini/google_accounts.json` from source machine | exclude | User identity only. |
| `~/.gemini/antigravity-browser-profile/*` | exclude | Browser residue only. |
| `~/.gemini/installation_id`, `state.json` from source machine | exclude | Machine-local runtime residue. |
| `~/.openclaw/openclaw.json` from source machine | exclude as raw source | Use only as classification input, never as shipped payload. |
| `~/.openclaw/credentials/*` from source machine | exclude | Secrets. |
| `~/.openclaw/identity/*` from source machine | exclude | Machine identity. |
| `~/.openclaw/devices/*` from source machine | exclude | Pairing state. |
| `~/.openclaw/telegram/*` from source machine | exclude | Live channel state. |
| `~/.openclaw/logs/*`, media, sqlite memory, subagent history | exclude | Runtime residue only. |
| Viktor projects and brands as live user data | exclude by default | Only include if explicitly shipped as sample content. |
| `brands/eterno/*` as live owner brand content | exclude by default | Seed brand pack, not reusable core by default. |
| Memento captures, caches, runtime databases, lockfiles, generated registries, and repo-local residue from Viktor's instance | exclude by default | Local state and seasoned machine residue must not ship from Viktor. |

## 7. Input-to-output dependency matrix

### Identity inputs

`owner_name`, `system_name`, `primary_role`, `timezone`
Generate or rewrite:
- `operator/identity.md`
- fresh `memory.md`
- fresh `recent-context.md`
- all bridge files
- owner-facing startup wording
- owner-bound operator doctrine files that are still template-rewrite

### Path inputs

`home_root`, `vault_location`, `workspace_root`
Generate or rewrite:
- all runtime bridges
- runtime config scaffolds
- trusted-folder files
- workspace-local runtime paths
- Memento path-bearing substrate files where needed

### Runtime-selection inputs

`selected_runtimes`
Generate or rewrite:
- runtime bridges only for chosen runtimes
- runtime configs only for chosen runtimes
- validation checklist for chosen runtimes

### Personalization inputs

`tone_profile`, `priority_modes`, `business_context`, `preferred_reporting_style`
Generate or rewrite:
- owner identity file
- starter memory seed
- starter context framing
- optional operator-emphasis defaults if productized

### Structure inputs

`project_categories`, `brand_categories`
Generate or rewrite:
- optional starter project scaffolds
- optional starter brand scaffolds

### Runtime-detail inputs

`codex_projects`, `gemini_trusted_folders`, `gemini_project_paths`, `openclaw_workspace`, `openclaw_channels`
Generate or rewrite:
- runtime-specific target-local config files

## 8. Minimum generated first-run set

A minimal healthy instance should generate at least:
- reusable core files
- rewritten `operator/identity.md`
- fresh `memory.md`
- fresh `recent-context.md`
- bridge files for all selected runtimes
- target-local runtime config scaffolds for all selected runtimes

## 9. Validation rule

The generated-file matrix is satisfied only if:
- each selected runtime has its required generated files
- no excluded Viktor-specific file is imported
- every rewritten file uses target-owner names and target paths
- every fresh file starts clean without Viktor history
- every copied core file remains behaviorally intact
