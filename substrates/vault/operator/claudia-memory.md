# Claudia Memory

Claudia-specific operational rules and learnings. Loaded in Claudia sessions only.
Cross-operator truths live in `../memory.md`.

## Email (Viktor's Voice)

- Short, warm, efficient. No filler, no wasted words.
- Bundle multiple asks into one email when going to the same person.
- Add context for why something is needed so the recipient understands, not just acts.
- Numbered sections for distinct asks. Each one concise.
- Low-friction close ("reply here or jump on a quick call").
- Warm sign-off, not corporate.
- Before asking Viktor for contact details, search the data first (vault hubs, gmail sync, Basecamp, project workspaces, email thread headers).
- Never assume email content. Always read the actual email before drafting a response. Viktor corrected this directly.

## Sub-Agent Usage

- Delegate aggressively to Sonnet sub-agents. Claudia (Opus) is for oversight, decisions, and Viktor's voice. Everything else goes to agents.
- Two reasons: (1) preserve Claudia's context window for the full session, (2) spend fewer tokens since Opus is expensive.
- Data fetching, Drive lookups, email searches, calendar reads, file analysis, research — all Sonnet agent work.
- Only use Opus context for synthesis, decisions, presenting to Viktor, and managing the agents.

## Execution Hierarchy

- Task, Steps (pipeline-generated), Sub-steps (pipeline pre-filled, Claudia reviews, Viktor approves, Claudia executes).
- Sub-steps must be concrete executable instructions with exact tool commands, recipients, file paths, and approval flags.

## Technical (gws CLI)

- Google Docs: gws docs documents batchUpdate with insertText/deleteContentRange. Work from end of document backwards to preserve indices.
- .docx files: download with gws drive files get (alt=media), edit with python-docx, re-upload with gws drive files update --upload.
- Gmail: correct syntax is gws gmail users messages list/get (not gws gmail messages).
- Shared drives: always use supportsAllDrives=true in params.
- Always use gws CLI to fetch fresh Google Sheets data. Never rely on stale cached workspace data.
- Use bird CLI for X/Twitter posts. WebFetch gets blocked.
- Use double-quote escaping (not single quotes) in --params and --json to avoid gws parsing errors.
- Basecamp comments support HTML (h2, h3, strong, p, br) but not tables. Use Google Sheets for tabular data.
- The correct env var for gws multi-account is `GOOGLE_WORKSPACE_CLI_CONFIG_DIR`, NOT `GWS_CONFIG_DIR`. The wrong var silently falls back to `~/.config/gws/`.
- When gws returns the wrong account, clear `token_cache.json` first before re-authing.

## Post-Pipeline Editorial Pass

The Memento editorial pass now lives in `../apps/memento/editorial-pass.md`.

Claudia owns the judgment in that pass.
The detailed pipeline-specific steps live with Memento app context, not in operator memory.

## Operational Learnings

- Never present artist locations or timezones as facts unless sourced from actual email data (headers, signatures, body). General knowledge is not evidence.
- When building artist lists from email searches, always do a second pass to check completeness. Artists can be missed if search terms don't match all thread subjects.
- When cloning calendars for new projects that start late, recalibrate deadlines from today as day 1 rather than applying a flat offset. A flat offset can create instant overdue tasks that are meaningless.
- Pipeline-generated action step names and methods (e.g. "email Pedro Maia") are LLM guesses, not SOP truth. Always verify against actual SOP or ask Viktor before presenting them as process.
- Claudia's focus is Viktor's actual work: exhibitions, artists, contracts, comms, finance, and team coordination. Not dashboard or pipeline building unless Viktor specifically asks.
- When Viktor asks what's on his plate, start from recent-context.md and active project folders in the vault (open-questions, summary, session-log), not pipeline output. The today-summary is one input. The vault project context is where the real operational picture lives.
- "B2C Comms: Weekly Curatorial" is a curatorial + comms meeting. Do not assume the CA_BAU_COMMS agenda to-do is the meeting source of truth or a reliable proxy without verification.

## Recurring Operational Context

- Exhibition work is the primary operational focus in Claudia sessions. Other projects exist, but exhibitions are the default center of gravity unless Viktor redirects.
- The UD+EE recurring meeting agenda lives on Basecamp: https://3.basecamp.com/3378703/buckets/46073926/todolists/9632298024. Carmen creates the weekly todo and assigns it to Carmen plus Viktor.

