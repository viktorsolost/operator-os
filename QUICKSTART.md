# Quickstart

## Prerequisites

- Node.js 18+
- Git
- At least one AI runtime installed: Claude Code (`claude`), Codex CLI (`codex`), Gemini CLI, or OpenClaw
- The `gws` CLI installed and on your PATH — only required if you plan to connect Gmail accounts
- A Basecamp integration (Client ID + Secret from https://launchpad.37signals.com/integrations) — only required if you plan to connect Basecamp

## What you need before starting

1. This repo cloned locally
2. A reference vault — the source doctrine files that define the system (operator files, boot chain, routing rules). The installer exits immediately if this path does not exist.
3. A Memento workspace (required) — the pipeline and state substrate. The installer exits immediately if this path does not exist. Memento is core to the system, not an optional add-on.

The installer takes the reference vault and Memento as source inputs and provisions a new owner-specific instance from them.

## Installation

Run the interactive installer:

```
node install.js /path/to/reference-vault /path/to/memento
```

Both arguments are required. The first is the path to the reference vault. The second is the path to Memento. Defaults: `~/VIK/ObsidianVault/VIK_OS` and `~/Code/Memento`.

The installer asks for your identity, location, runtimes, workflow tools, and accounts interactively, then provisions the full system. It runs in five phases:

### Phase 1: Identity and Location

- `owner_name` — your name (required)
- `system_name` — defaults to `{name} OS`
- `primary_role` — one sentence describing your work (required)
- `timezone` — e.g. `America/New_York (UTC-5)` (required)
- `home_root` — defaults to `$HOME`
- `vault_location` — where your OS vault will live; defaults to `{home}/Vault/{system_name}`
- `workspace_root` — Memento workspace location; defaults to `{home}/Code/Memento`

### Phase 2: Runtimes and Style

You declare which AI runtimes to enable. Enter as a comma-separated list. Allowed values (case-sensitive): `Codex`, `Claude`, `Gemini`, `OpenClaw`. Defaults to `Claude`.

Each enabled runtime gets a bridge file written to the runtime-local config directory (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`). All bridges point into the same boot entrypoint in your vault. The boot sequence, routing policy, and model posture checks are identical regardless of which runtime you start from.

You also set:
- `tone_profile` — defaults to `direct`
- `preferred_reporting_style` — defaults to `concise`
- `business_context` — optional one sentence about your work

### Phase 3: Workflow Tools

Enter the tools you use as a comma-separated list, or `none` to skip. Examples: `Gmail`, `Basecamp`, `Slack`, `Notion`, `Linear`.

The installer resolves each tool against the connector registry. Supported tools (Gmail, Basecamp) are enabled. Unsupported tools are surfaced explicitly in the config rather than silently dropped.

If you enter tools, you are also asked which capabilities you want synced: `email`, `tasks`, `messages`, `comments`, `calendar`, `docs`. Enter `all` to sync everything.

### Phase 4: Accounts

You can connect accounts now or defer to later (default: `later`).

If you connect now:

- **Gmail**: For each account, the installer runs `gws auth login` with `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` set to the account's config directory. This opens your browser for Google OAuth. You provide an account name (e.g. `gws-work`) and a label, then your email address. You can connect up to 4 accounts. Calendar, Drive, and Sheets access is enabled automatically once at least one Gmail account is connected.
- **Basecamp**: The installer prompts for your Client ID and Client Secret, opens the Basecamp authorization URL, waits for you to paste the authorization code, exchanges it for tokens, and writes credentials to `~/.env.basecamp` and `~/.env.basecamp.tokens`. It then calls the Basecamp authorization endpoint to resolve your Basecamp account ID and person ID.

If you defer, the system installs without pipeline data. To connect accounts later:

```
node instantiation/onboarding/reconnect.js /path/to/workspace/state/runtime/pipeline_config.json
```

Or set `MEMENTO_WORKSPACE_ROOT` and run without an argument:

```
node instantiation/onboarding/reconnect.js
```

The reconnect script reads the existing pipeline config, shows current connection status, and re-runs auth only for disconnected accounts.

### Phase 5: Run Installation

The installer runs three internal slices:

- **Slice 1**: Copies core doctrine files to your vault, places rendered template stubs, generates runtime config scaffolds
- **Slice 2**: Renders all templates with your identity values, rewrites source doctrine references to your paths, generates fresh surfaces (memory, recent-context, etc.), validates output
- **Slice 3**: Connects accounts via the auth dispatcher, generates pipeline config with connector state, bootstraps the registry, runs a planner-driven first sync, builds your voice profile from sent messages, validates the full install

If accounts were deferred, Slice 3 skips the auth, sync, and voice profiler steps.

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

Note: Gmail, Calendar, Drive, and Sheets are all handled through a single Gmail adapter — connecting one Gmail account enables all four capabilities. The connector architecture supports adding new sources by installing adapter directories. Slack, Notion, Linear, and similar tools are not yet supported but are explicitly surfaced during onboarding rather than silently ignored.

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

**Installer validation fails with residue errors**: This means source doctrine files contain owner-specific references that were not rewritten. Check that the reference vault argument points to the clean source template, not a previous user's live instance.
