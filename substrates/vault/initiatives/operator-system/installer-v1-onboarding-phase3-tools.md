# Installer v1 — Onboarding Phase 3: Workflow Tools and Truth Sources

## Purpose

This addendum extends the canonical onboarding schema
(system-instantiation-onboarding-schema.md) with a missing layer.

The original schema asks: who are you, where does the system live,
which runtimes do you use.

It does not ask: where does your work actually live.

Without this, the installer ships a pipeline that either connects to
nothing or assumes Viktor's tool stack.

## Position in onboarding sequence

```
Phase 1: Identity + install foundations       (existing)
Phase 2: System fit + behavioral shaping      (existing)
Phase 3: Workflow tools + truth sources       (THIS FILE)
Phase 4: Runtime + account setup              (existing, was Phase 3)
Phase 5: Fresh-start context generation       (existing, was Phase 4)
```

Phase 3 must come before runtime setup because tool selection determines
which sync engines are installed, which determines what runtime configs
and bridge files need to exist.

## Core Question

Where does your work actually live?

The system needs to know the user's truth sources so it can:
- install the correct sync engines
- generate the correct capture schemas
- wire the correct derivation pipelines
- configure what the morning digest pulls from
- configure what editorial pass looks at

## Required Fields

### project_management_tool

What the user uses to track projects, tasks, and todos.

Allowed values:
- basecamp
- airtable
- notion
- linear
- asana
- monday
- todoist
- other
- none

Multiple selections allowed.

Used to generate:
- Memento sync engine selection
- capture schema for project/task data
- morning digest project section source
- editorial pass project data source

### communications_tool

What the user uses for email and direct communications.

Allowed values:
- gmail
- outlook
- other
- none

If gmail:
- ask how many accounts
- ask for account labels or identifiers

Used to generate:
- Memento email sync engine selection
- capture schema for email data
- morning digest communications section source

### calendar_tool

What the user uses for scheduling.

Allowed values:
- google_calendar
- outlook_calendar
- apple_calendar
- other
- none

Used to generate:
- Memento calendar sync engine selection
- capture schema for calendar events
- morning digest schedule section source

### documents_tool

Where the user stores documents and shared files.

Allowed values:
- google_drive
- notion
- dropbox
- sharepoint
- other
- none

Used to generate:
- Memento document sync engine selection
- capture schema for document tracking

### production_data_tool

Where the user tracks structured production data
(spreadsheets, databases, trackers, calendars-as-data).

Allowed values:
- google_sheets
- airtable
- notion_databases
- excel_online
- other
- none

Used to generate:
- Memento structured data sync engine selection
- capture schema for production tracking
- editorial pass production data source

### team_comms_tool

Where the user communicates with their team in real time
(not email, not project management — chat/messaging).

Allowed values:
- slack
- teams
- discord
- telegram
- basecamp_campfire
- other
- none

Used to generate:
- Memento team comms sync engine selection (if supported)
- capture schema for team message tracking (if supported)

### source_of_truth_for_tasks

Which of the above tools is the canonical truth source for
what needs to get done.

Rule:
- must be one of the tools already selected above
- the system uses this to resolve conflicts when the same task
  appears in multiple tools

Used to generate:
- pipeline priority rules
- derivation precedence
- morning digest primary task source

## Optional Fields

### additional_tools

Free-text list of any other tools the user relies on that
don't fit the categories above.

Examples:
- Figma
- GitHub
- Jira
- Salesforce
- HubSpot
- Stripe

Used to generate:
- future sync engine roadmap awareness
- capture schema stubs if connectors exist

### tool_integration_notes

Free-text for any specific integration context.

Examples:
- "Airtable is the master — Notion is just for long-form docs"
- "We use Slack for quick stuff but Basecamp for decisions"
- "Google Sheets production calendar is the single source of truth
  for all exhibition timelines"

Used to generate:
- pipeline priority rules
- derivation precedence notes
- morning digest editorial framing

## Tool-to-Sync-Engine Mapping

This table defines which Memento sync engines get installed based on
tool selection.

| Tool Selected | Sync Engine | Capture Schema |
|---|---|---|
| basecamp | basecamp_sync | basecamp captures |
| gmail | gmail_sync | gmail captures |
| google_calendar | calendar_sync | calendar captures |
| google_drive | drive_sync | drive captures |
| google_sheets | sheets_sync | sheets captures |
| airtable | airtable_sync (new) | airtable captures (new) |
| notion | notion_sync (new) | notion captures (new) |
| linear | linear_sync (new) | linear captures (new) |
| slack | slack_sync (new) | slack captures (new) |
| outlook | outlook_sync (new) | outlook captures (new) |
| outlook_calendar | outlook_cal_sync (new) | outlook_cal captures (new) |
| other | manual_capture_only | generic captures |
| none | (no engine) | (no captures) |

Engines marked (new) do not exist yet in Memento. The installer should:
- install what exists
- flag what doesn't exist as a post-install development task
- not fail the install over missing engines

## Impact on Downstream Generation

### Morning digest
- sections are generated based on which tools have sync engines
- primary task source comes from source_of_truth_for_tasks
- if a tool has no engine yet, that section is omitted with a note

### Editorial pass
- checks data from tools that have active sync engines
- production data source is configured from production_data_tool
- if the user's production data tool has no engine, editorial pass
  skips structured data checks

### Derivation pipeline
- facts, threads, activity, contacts are derived from whatever
  sync engines are active
- contact extraction adapts to the tools that produce contact data
- calendar events derive from whichever calendar tool is active

### Store entries
- project stores are populated from whichever project management
  tool is active
- if no project management tool, stores are populated manually
  or from email/calendar inference

## Validation After Phase 3

Phase 3 succeeds when:
- at least one truth source is selected for task tracking
- the source_of_truth_for_tasks field matches one of the selected tools
- the installer knows which sync engines to install vs. flag as missing
- no tool selection was left ambiguous

Phase 3 fails when:
- no tools are selected at all (the system has nothing to sync)
- source_of_truth_for_tasks names a tool that was not selected
- the user's primary tools all require engines that don't exist yet
  and the user is not informed

## Recommended Question Order

1. Where do you track projects and tasks?
2. What do you use for email?
3. What calendar do you use?
4. Where do you keep documents?
5. Do you use spreadsheets or databases for production tracking?
6. How does your team communicate in real time?
7. Of all of these, which one is THE source of truth for what needs
   to get done?
8. Any other tools you rely on?
9. Any specific notes about how these tools relate to each other?

## Practical Experience Goal

This phase should feel like:
- "tell me about your tools and I'll wire the system to them"
- fast — most people use 3-5 tools
- honest — if we don't have a connector yet, say so

Not like:
- an enterprise software audit
- a form that asks about tools the user doesn't use
- a setup that pretends all connectors exist when they don't
