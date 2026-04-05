# Anton — Email Triage Architectural Decisions

Date: 2026-03-29
Status: Decided, pending Viktor approval to implement
Input: `plan/claudia-email-triage-loop.md`, `plan/handoff-email-triage-to-anton.md`

## Decision 1 — Draft storage location

`~/VIK/Coding/Memento/relay/email-drafts/`

New `relay/` directory at Memento root. Not inside `state/` (pipeline domain), not in VIK OS vault (context, not transient infrastructure). Add `relay/` to `.gitignore` — drafts are not version controlled.

## Decision 2 — Draft lifecycle

48h auto-archive to `relay/email-drafts/archive/`. 30-day retention, then delete. The durable record is the journal entry created when a reply is sent, not the draft.

Addition: archive move must record final status (sent, skipped, expired) so the audit trail is meaningful.

## Decision 3 — Command construction

Structured data only. No shell commands, no executable strings in draft files.

Draft stores: `account` (key, not path), `to`, `subject`, `body`, `thread_id`, `in_reply_to`.

Executor module: `pipeline/lib/email_sender.js`

```
function sendReply({ account, to, subject, body, threadId, inReplyTo }) -> { success, messageId, error }
```

Resolves account key to config dir at runtime. Validates all fields before constructing gws command. No passthrough.

## Decision 4 — Failure handling

Log, wait for next cycle, alert after two consecutive failures per account. One Telegram alert, then silence until re-auth. Matches existing pipeline sync failure pattern.

## Decision 5 — Callback routing

Test, do not speculate. Build single-account proof first (gws-ca), test callback queueing during active sessions. If callbacks queue reliably, keep current design. If not, fallback to polling: Lev checks `relay/email-drafts/` for pending actions at each turn.

## Triage loop read access contract

Read-only access to:
- `state/registry.json` — project matching
- `state/derived/facts/{project}.json` — context
- `state/derived/threads/{project}.json` — open thread awareness
- `state/derived/contacts.json` — sender identification
- `state/runtime/reminders.json` — related reminders

The triage loop must NOT write to any of these. Journal entries for sent replies are created by pipeline gmail_sync on the next cycle, not by the triage loop.

## Architectural risk identified

Lev's draft schema stores `config_dir` as a path string. Change to account key (`gws-ca`, `gws-eterno`, etc.) resolved by the executor at runtime. Storing paths in relay artifacts is the same class of problem as storing shell commands.

## Sequencing (binding)

1. Build `pipeline/lib/email_sender.js` (executor) and test standalone
2. Build relay directory structure and draft file read/write
3. Wire up single-account triage (gws-ca) with cron
4. Test callback routing
5. Expand to remaining accounts

## Next step

Viktor approves, then Jonah implements.
