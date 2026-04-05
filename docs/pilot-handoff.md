# Operator OS — Pilot Handoff

## What this is

Operator OS is a multi-operator AI system that provisions a personal instance with specialist operators (Claudia, Anton, Jonah, Vera, Lev), persistent cross-session memory, and pipeline-driven situational awareness from your connected tools. It is not a chatbot wrapper — it is a structured operating layer that sits between you and any AI runtime and gives you consistent, context-aware operators regardless of which model you are running. The pipeline syncs your Gmail, Calendar, Drive, Sheets, and Basecamp data so the operators always have live context when you start a session.

## Current support boundary

- Supported sources: Gmail (email, calendar, drive, sheets) and Basecamp (project management)
- Unsupported tools are surfaced explicitly during onboarding, not silently dropped
- Adding new sources requires adapter development (not available yet for Slack, Notion, Linear, etc.)
- The system has been tested with synthetic users and real vault content but not yet with a real external user
- Auth requires the `gws` CLI for Gmail and a Basecamp integration (Client ID + Secret) for Basecamp

## Prep checklist

Before you start:

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] At least one AI runtime: Claude Code (`claude`), Codex CLI (`codex`), or Gemini CLI
- [ ] Clone this repo: `git clone https://github.com/viktorsolost/operator-os.git`
- [ ] The repo includes bundled substrates (reference vault + Memento) — no separate download needed
- [ ] If connecting Gmail: install the `gws` CLI (Google Workspace CLI)
- [ ] If connecting Basecamp: create a Basecamp integration at https://launchpad.37signals.com/integrations and have your Client ID + Secret ready

## Install command

```
cd operator-os
node install.js
```

The installer uses bundled substrates by default. Override paths only if you have a custom vault or Memento source.

The installer is interactive. It takes about 5 minutes if connecting accounts, 2 minutes if deferring.

## Expected success state

After install you should see:
- "Installation complete" with file counts and connector summary
- A vault directory at your chosen location with BOOT.md, ROUTING.md, operator files, and memory
- Bridge files in the vault root: `CLAUDE.md` (if Claude enabled), `AGENTS.md` (if Codex enabled), `GEMINI.md` (if Gemini enabled)
- A workspace directory with pipeline_config.json and registry.json
- No files written to `~/.claude/`, `~/.codex/`, or `~/.gemini/`

Test it by navigating into your vault and launching your runtime:
```
cd {vault_location}
claude     # or: codex / gemini
```
Then say: "Hi Claudia, what should I focus on today?"

If accounts are connected and first sync ran, Claudia should have real context. If accounts were deferred, she'll have the system structure but no external data yet.

## If auth fails

Gmail: Verify `gws` is on your PATH. Run `gws auth login` manually first to test. Your Google Cloud project needs Gmail, Calendar, Drive, and Sheets OAuth scopes.

Basecamp: Re-run the reconnect script: `node instantiation/onboarding/reconnect.js /path/to/workspace/state/runtime/pipeline_config.json`

General: The install still completes even if some accounts fail to connect. Partially connected accounts show as `connected: false` in pipeline_config.json. Use reconnect to fix them later.

## Feedback

Tell me:
- Did the install complete without errors?
- Could you start a conversation with an operator?
- What was confusing or unclear?
- What broke?
