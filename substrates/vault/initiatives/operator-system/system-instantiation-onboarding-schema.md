# System Instantiation Onboarding Schema

Status: canonical onboarding contract for generating a new user-specific system instance.

This file defines:
- what onboarding must ask
- which answers are required versus optional
- which generated outputs depend on each answer
- what must never be copied from Viktor during onboarding

Use this file with:
- `initiatives/operator-system/system-instantiation-contract.md`
- `initiatives/operator-system/system-instantiation-vocabulary.md`

## 1. Onboarding purpose

Onboarding exists to generate the owner-specific layer of a new system instance.

Ownership rule:
- installer places reusable core, template sources, runtime bridge templates, and safe config scaffolds
- onboarding is the only layer that turns user answers into Layer B and Layer C outputs
- installer does not independently generate owner-specific doctrine, memory, recent context, or runtime detail content beyond the blank or templated scaffolds onboarding will fill

It should:
- collect only inputs that change generated output
- preserve the reusable core
- replace owner identity cleanly
- generate fresh personal context
- connect optional runtime and account setup without copying Viktor state

It should not:
- ask decorative questions that do not change output
- copy Viktor memory, auth, or runtime residue
- force deep setup before the user can reach a working first state

## 2. Onboarding phases

### Phase 1. Identity and install foundations

Goal:
- generate the new owner identity layer
- choose install paths and system naming
- decide which runtimes to prepare

### Phase 2. System fit and behavioral shaping

Goal:
- adapt generated owner-facing context to the user's role, priorities, tone, and operating style

### Phase 3. Runtime and account setup

Goal:
- connect selected runtimes and accounts
- generate safe config files and bridge files

### Phase 4. Fresh-start context generation

Goal:
- create starter memory, recent context, and initial user context without importing Viktor content

## 3. Required onboarding fields

### 3.1 Owner identity

Field: `owner_name`
Purpose:
- replaces Viktor-specific owner references
Used to generate:
- owner-facing identity text
- bridge wording where the owner is named
- starter personal context

Field: `system_name`
Purpose:
- names the instantiated system
Used to generate:
- owner-facing system references
- install-facing labels
- optional vault naming and startup text

Field: `primary_role`
Purpose:
- describes who the user is operationally
Used to generate:
- personal identity context
- starter defaults for tone, priorities, and reporting shape

Field: `timezone`
Purpose:
- sets local-time assumptions
Used to generate:
- starter identity context
- runtime defaults where time reporting matters

### 3.2 Install locations

Field: `home_root`
Purpose:
- target user's home context
Used to generate:
- target-safe paths in configs and bridge files

Field: `vault_location`
Purpose:
- where the canonical vault doctrine lives for the new user
Used to generate:
- all runtime bridge targets
- startup text that references the vault path

Field: `workspace_root`
Purpose:
- where repo and runtime workspace material will live
Used to generate:
- trusted-folder files
- runtime configs
- Memento template-rewrite path references

### 3.3 Runtime selection

Field: `selected_runtimes`
Allowed values:
- Codex
- Claude
- Gemini
- OpenClaw
Purpose:
- decides which bridge files and configs are generated
Used to generate:
- runtime-specific bridge files
- runtime config scaffolds
- validation targets

## 4. Optional onboarding fields

Field: `vault_name_override`
Purpose:
- custom vault-root name when the user wants a different owner-facing vault label
Used to generate:
- folder names or labels where customizable

Field: `tone_profile`
Examples:
- direct
- warm
- formal
- concise
Purpose:
- shapes owner-facing generated context
Used to generate:
- starter identity context
- communication defaults if productized

Field: `priority_modes`
Examples:
- operator workflow
- creative work
- client delivery
- technical execution
- strategic thinking
Purpose:
- shapes initial emphasis in owner context
Used to generate:
- starter personal priorities
- optional initial defaults for operator emphasis

Field: `business_context`
Purpose:
- gives the system a first-pass understanding of the user's world
Used to generate:
- personal identity context
- starter examples and framing

Field: `preferred_reporting_style`
Examples:
- one-liners
- short summaries
- detailed briefings
Purpose:
- shapes generated owner-facing defaults
Used to generate:
- starter communication preferences

Field: `project_categories`
Purpose:
- defines starter structure if the system creates initial project scaffolds
Used to generate:
- optional starter project context

Field: `brand_categories`
Purpose:
- defines starter brand structure if the user uses brand wrappers or brand packs
Used to generate:
- optional starter brand context

## 5. Runtime setup fields

These are only asked when the runtime was selected.

### Codex

Field: `codex_projects`
Purpose:
- collect Codex-specific detail only after `selected_runtimes` includes Codex
Used to generate:
- `~/.codex/instructions.md`
- target-local `~/.codex/config.toml`

Never copy:
- `~/.codex/auth.json`
- logs, sqlite state, history, caches

### Claude

Purpose:
- no additional enablement field, Claude is selected only through `selected_runtimes`
Used to generate:
- `~/.claude/CLAUDE.md`

Never copy:
- Claude auth state
- backups, debug files, caches

### Gemini

Field: `gemini_trusted_folders`
Field: `gemini_project_paths`
Purpose:
- collect Gemini-specific detail only after `selected_runtimes` includes Gemini
Used to generate:
- `~/.gemini/GEMINI.md`
- `projects.json`
- `trustedFolders.json`
- safe settings scaffolds where needed

Never copy:
- `oauth_creds.json`
- `google_accounts.json`
- browser profile state
- installation IDs

### OpenClaw

Field: `openclaw_workspace`
Field: `openclaw_channels`
Purpose:
- collect OpenClaw-specific detail only after `selected_runtimes` includes OpenClaw
Used to generate:
- `~/.openclaw/workspace/START_HERE.md`
- `~/.openclaw/workspace/AGENTS.md`
- safe starter `openclaw.json`

Never copy:
- tokens
- device identity
- pairing state
- telegram state
- gateway secrets
- logs, media, sqlite memory, subagent run history

## 6. Account and auth setup fields

These should be asked late, after the system can already exist in a healthy unauthenticated state.

Field: `connect_accounts_now`
Allowed values:
- now
- later
Purpose:
- keep first-run setup lightweight when needed
Used to generate:
- account-setup task list
- post-install action prompts

Field: `account_connections`
Examples:
- Google Workspace
- Telegram
- OpenAI
- Anthropic
Purpose:
- decide which auth flows to present
Used to generate:
- runtime-specific account setup prompts

Rule:
- auth values themselves should not be stored in doctrine files
- onboarding may collect or trigger auth, but must not ship Viktor's auth into the new instance

## 7. Generated outputs by question group

### Identity outputs
Generated from:
- `owner_name`
- `system_name`
- `primary_role`
- `timezone`
- optional tone and business fields

Outputs:
- rewritten `operator/identity.md`
- starter memory seed
- starter recent-context seed
- owner-facing startup text
- rewritten owner references in template-generated files

### Path outputs
Generated from:
- `home_root`
- `vault_location`
- `workspace_root`
- optional vault-name override

Outputs:
- runtime bridge paths
- runtime config paths
- trusted-folder paths
- Memento template-rewrite path references where needed

### Runtime outputs
Generated from:
- `selected_runtimes`
- runtime-specific folder and project inputs

Outputs:
- Codex bridge and config scaffold
- Claude bridge
- Gemini bridge and path files
- OpenClaw workspace bridges and safe starter config

### Context outputs
Generated from:
- `primary_role`
- `business_context`
- `priority_modes`
- `project_categories`
- `brand_categories`

Outputs:
- starter context files for the new owner
- optional starter project or brand scaffolds

## 7b. Voice profile generation

### Purpose

After accounts are connected, Claudia scans the new owner's existing communications (sent emails, Basecamp replies, chat messages) to extract their natural voice — how they greet, how they sign off, formality level, sentence length, emoji habits, tone shifts between contexts (e.g. client-facing vs internal).

### Trigger

Runs during onboarding after Phase 3 (account connection), only when at least one communication source is available.

### Input sources

- Gmail sent folder (across connected accounts)
- Basecamp comments and replies
- Any other connected comms platform with send history

### Generated output

- `operator/voice.md` — owner voice profile

### Contents of voice.md

- greeting patterns
- sign-off patterns
- formality range (e.g. casual-internal to formal-client)
- sentence structure tendencies
- word choices and recurring phrases
- emoji and punctuation habits
- tone shifts by context (who they're writing to)

### Who uses it

- Claudia — for drafting emails, messages, and comms that sound like the owner
- Helena — for brand voice work that needs to align with the owner's natural tone

### Rules

- sample only sent/authored messages, never inbound
- do not store raw message content in the voice file — only extracted patterns
- the owner may review and edit voice.md after generation
- if no comms sources are connected, skip gracefully — voice.md becomes an optional post-install enrichment

## 8. Fresh-start starter files

Onboarding should create fresh starter files instead of importing Viktor content.

At minimum:
- new `memory.md` starter seeded with no historical Viktor entries
- new `recent-context.md` starter seeded with install-state only
- rewritten `operator/identity.md` for the new owner
- runtime bridge files for selected runtimes
- runtime config scaffolds with target-machine paths only

Optional:
- starter projects folder structure
- starter brands folder structure
- starter examples tailored to the user's business context

## 9. Validation after onboarding

Onboarding succeeds when:
- required answers exist
- generated files point to the new user's paths
- generated text names the new owner where appropriate
- no starter personal files contain Viktor memory or recent context
- selected runtime bridges and configs exist
- omitted runtimes remain absent without causing failure
- auth may still be pending if the user chose `later`

Onboarding fails when:
- generated text still frames the system as belonging to Viktor
- any generated path still points to `/Users/viktorsl/`
- any Viktor auth, device identity, or runtime residue is imported
- required identity or install fields are missing

## 10. Recommended question order

Ask in this order:
1. owner name
2. system name
3. primary role
4. timezone
5. install paths
6. selected runtimes
7. role and business shaping questions
8. runtime-specific path and folder questions
9. account setup now versus later
10. runtime-specific auth flows if the user chose now

Rule:
- get to a healthy first instance as early as possible
- defer auth and optional richness until after the system can boot cleanly

## 11. Practical first-run experience

A good first run should feel like this:
- the user names themselves and the system
- the system asks where it should live
- the user picks which runtimes to prepare
- the system asks only a few shaping questions that change outputs
- the system generates a fresh owner-specific version
- the system offers account setup now or later
- the system finishes with a working clean instance that belongs to the new owner

Not like this:
- a huge questionnaire before anything works
- copied Viktor memory
- copied auth or runtime residue
- a system that still speaks as Viktor after install
