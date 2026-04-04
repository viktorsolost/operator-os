# Quickstart

## Prerequisites

- Node.js 18+
- Git
- The `gws` CLI installed and on your PATH (for Google Workspace accounts)
- A Basecamp account (optional, for Basecamp integration)
- At least one AI runtime installed: Claude Code, Codex CLI, Gemini CLI, or OpenClaw

## What you need before starting

1. This repo cloned locally
2. A reference vault — the source doctrine files that define the system (operator files, boot chain, routing rules)
3. A Memento workspace — the pipeline and state substrate

The installer takes the reference vault and Memento as source inputs and provisions a new owner-specific instance from them.

## Installation

Run the interactive installer:

```
node install.js /path/to/reference-vault /path/to/memento
```

The first argument is the path to the reference vault (source doctrine files). The second is the path to Memento (the pipeline substrate). Both default to standard locations if omitted.

The installer asks for your identity, location, runtimes, and accounts interactively, then provisions the full system. It runs in four phases:

### Phase 1: Identity and Location

Validates owner name, system name, role, timezone, and the three path fields (home root, vault location, workspace root).

### Phase 2: Runtimes and Style

You declare which AI runtimes to enable. Allowed values (case-sensitive): `Claude`, `Codex`, `Gemini`, `OpenClaw`.

You can enable multiple runtimes. Each one gets a bridge file written to the runtime-local config directory (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`). All bridges point into the same boot entrypoint in your vault. The boot sequence, routing policy, and model posture checks are identical regardless of which runtime you start from.

You also set tone and reporting style preferences (`tone_profile`, `preferred_reporting_style`).

### Phase 3: Account Connection

You can connect accounts now or defer to later (`connect_accounts_now: 'now' | 'later'`).

If you connect now:

- **Gmail**: For each account, the installer runs `gws auth login` with `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` set to the account's config directory. This opens your browser for Google OAuth. You can connect up to 4 accounts. Calendar, Drive, and Sheets access is enabled automatically once at least one Gmail account is connected.
- **Basecamp**: The installer prompts for your Client ID and Client Secret, opens the Basecamp authorization URL, waits for you to paste the authorization code, exchanges it for tokens, and writes credentials to `~/.env.basecamp` and `~/.env.basecamp.tokens`. It then calls the Basecamp authorization endpoint to resolve your person ID.

If you defer, the system installs without pipeline data. To connect accounts later:

```
node instantiation/onboarding/reconnect.js /path/to/workspace/state/runtime/pipeline_config.json
```

Or set `MEMENTO_WORKSPACE_ROOT` and run without an argument:

```
node instantiation/onboarding/reconnect.js
```

The reconnect script reads the existing pipeline config, shows current connection status, and re-runs auth only for disconnected accounts.

### Phase 4: First Run

If accounts are connected, the installer runs a first pipeline sync to populate your workspace with real data. After sync completes, it runs the voice profiler against your sent messages to generate a voice profile for your operators.

If accounts were deferred, these steps are skipped. Run a manual sync later from your Memento workspace: `node pipeline/cli/run.js sync`.

## What gets created

After installation your file tree looks like:

```
{vault_location}/           # Your vault (operator doctrine, memory, projects)
  BOOT.md                   # System boot entrypoint
  ROUTING.md                # Operator routing rules
  memory.md                 # Distilled cross-session memory
  recent-context.md         # Recent session context
  operator/
    anton.md
    claudia.md
    jonah.md
    vera.md
    lev.md
    identity.md             # Your identity (generated from onboarding)
    voice.md                # Your voice profile (generated from first sync)

{workspace_root}/           # Memento workspace
  pipeline/
  state/
    runtime/
      pipeline_config.json      # Account and sync configuration
      source_identities.json    # Source identity mappings (Basecamp person ID, etc.)
    registry.json               # Project registry
    captures/                   # Raw captured data from connected sources
    derived/                    # Derived views (today page, editorial, etc.)

~/.claude/CLAUDE.md         # Runtime bridge (if Claude enabled)
~/.codex/AGENTS.md          # Runtime bridge (if Codex enabled)
~/.gemini/GEMINI.md         # Runtime bridge (if Gemini enabled)
```

## Supported account types

| Source | Auth method | What it syncs |
|--------|-------------|---------------|
| Gmail | gws CLI OAuth | Email messages, labels |
| Basecamp | OAuth 2.0 | Todos, comments, project activity |
| Google Calendar | gws CLI (shared with Gmail) | Events, meetings |
| Google Drive | gws CLI (shared with Gmail) | Project folder contents |
| Google Sheets | gws CLI (shared with Gmail) | Production calendar data |

If you use a tool not listed here, the system will note it as unsupported during onboarding rather than silently ignoring it.

## Using the system

Start a conversation with the operator you need:

```
Hi Claudia, what should I focus on today?
Hi Anton, review this architecture before we start building.
Hi Jonah, take this plan and deliver it.
Hi Vera, redesign this dashboard layout.
Hi Lev, help me think through this decision.
```

If you do not address an operator by name, the system routes by task shape: execution to Claudia, technical direction to Anton, implementation delivery to Jonah, design to Vera, strategy to Lev.

The system reads your vault on boot, loads the active operator, and works from the context your pipeline has collected. You do not manage the internal files directly in day-to-day use.

## Troubleshooting

**gws auth fails**: Verify `gws` is on your PATH and your Google Cloud project has the required OAuth scopes for Gmail, Calendar, Drive, and Sheets.

**Basecamp token expired**: Tokens auto-refresh on pipeline runs. If the refresh token itself expires, re-run the reconnect script to re-authorize from scratch.

**Pipeline data is stale**: Run a manual sync from your Memento workspace: `node pipeline/cli/run.js sync`.

**Boot chain broken**: If an operator cannot find required vault files, verify the path in your runtime bridge file (`~/.claude/CLAUDE.md` or equivalent) matches your actual vault location.

**Unknown runtime error during install**: The runtime selector rejects unknown names. Use the exact casing: `Claude`, `Codex`, `Gemini`, `OpenClaw`.
