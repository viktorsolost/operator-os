# Phase 4 — Dashboard Data Inventory

Produced by Anton, 2026-03-29. Reference for Vera's surface design work.

**Audit basis:** All counts and field names are from actual data files as of 2026-03-29T14:39Z. No schemas or assumptions — only what is populated in real state.

Dashboard is a single Today page. Three time-horizon blocks: Today, Tomorrow, This Week. All paths relative to `~/VIK/Coding/Memento/`.

---

## 1. Data Sources Mapped to Blocks

### Morning Digest — `state/derived/morning_digest.json`

**Feeds:** Today block (primary data source)

**Structure:**
- `generated_at` — ISO timestamp of last pipeline run
- `digest_window` — `{ from, to }` timestamps of the digest period
- `pipeline_health` — sync totals per source (new_captures, errors), auth_failures[], store_enrich_totals
- `new_journal_entries[]` — 671 entries in current data. Each has: project_id, entry_id, timestamp, source, entry_type, title, summary, actors[]
- `open_threads[]` — 2 entries. Each has: project_id, thread_key, signal_type, counterparty, age_days, opened_by_title
- `todays_calendar[]` — currently empty (0 events)
- `fact_changes[]` — currently empty (0 changes)

**What's populated:**
- `new_journal_entries` is large but dominated by `document_created` (433/671). Communications and todo changes are the signal. Currently no time segmentation — it's a flat list covering the digest window.
- `open_threads` works well: compact, has everything needed for display (project, counterparty, signal type, age, human-readable title).
- `todays_calendar` is empty. This is a real gap — calendar events exist in captures (see below) but the digest isn't populating this field.
- `fact_changes` is empty. Either no facts changed or the derivation isn't detecting changes.

**Sample open thread from digest:**
```json
{
  "project_id": "punks-2026",
  "thread_key": "awaiting_reply_justin_artist_call",
  "signal_type": "awaiting_reply",
  "counterparty": "justin@justinaversano.com",
  "age_days": 1,
  "opened_by_title": "Artist call invitation sent to Justin Aversano"
}
```

---

### Calendar Events — `state/derived/calendar_events.json`

**Feeds:** Today, Tomorrow, This Week

**Source:** Derived from `state/captures/calendar/` by `pipeline/lib/derive_calendar.js`. Runs as part of `derive_all` and independently via `node pipeline/cli/run.js derive_calendar`. Re-composed on each pipeline run. Rolling 14-day window from today.

**Current state:** 10 events in window (2026-03-29 through 2026-04-11). Deduplicated by event_id.

**Top-level shape:**
```json
{
  "derived_at": "2026-03-29T17:00:11.764Z",
  "window": { "from": "2026-03-29", "to": "2026-04-11" },
  "events_count": 10,
  "events": [ ... ]
}
```

**Event shape:**
- `event_id` (string) — Google Calendar event ID, stable across re-derives
- `date` (string, "YYYY-MM-DD") — date of event, filterable for Today/Tomorrow/Week blocks
- `start` (string, ISO with timezone) — e.g. "2026-03-31T16:00:00+04:00"
- `end` (string, ISO with timezone, nullable)
- `title` (string, always set) — event summary
- `project_id` (string, nullable) — linked project or null for cross-project events
- `source_ref` (string) — calendar capture reference
- `location` (string, nullable)
- `attendees[]` — array of `{ email, name, status }`. Populated on most events.
- `organizer` (string, nullable) — organizer email
- `calendar_id` (string) — which calendar it came from

**Events by date:**
| Date | Count | Examples |
|------|-------|---------|
| 2026-03-29 (today) | 0 | — |
| 2026-03-30 (Sun) | 1 | Eterno products |
| 2026-03-31 (Mon) | 7 | Eterno Strategy, Eterno x Zaf, Eterno x Piv, Eterno x Darko, Eterno x Coldie, EE B2C Comms |
| 2026-04-01 (Tue) | 2 | B2C Comms: Weekly Curatorial, Eterno x Pindar |
| 2026-04-03 (Thu) | 1 | Eterno x Claire |

**Project linking:** 2/10 events have a project_id (both lucas-zanotto-2026). The rest are null. Most artist call events ("Eterno x Zaf", "Eterno x Pindar") clearly belong to PUNKS but the linker doesn't match them — the capture's `candidate_project_links` is empty for these. Vera should design for both project-badged and unbadged events.

**Filtering for blocks:** Dashboard filters the flat `events` array by `date` field:
- Today: `date === "2026-03-29"`
- Tomorrow: `date === "2026-03-30"`
- This Week: `date >= today && date <= today + 6`

---

### Open Threads — `state/derived/threads/{project_id}.json`

**Feeds:** Today block (open threads needing attention), potentially Tomorrow/Week if threads had deadlines.

**Current counts:**
| Project | Open | Closed |
|---------|------|--------|
| punks-2026 | 1 | 1 |
| lucas-zanotto-2026 | 1 | 1 |
| 0009eth-2026 | 0 | 0 |
| mystery-box-vhils | 0 | 0 |

**Open thread shape:**
- `thread_key` (string)
- `status` ("open")
- `signal_type` ("awaiting_reply" | "followup_required")
- `counterparty` (email or name — inconsistent: "justin@justinaversano.com" vs "Jessica")
- `age_days` (integer)
- `opened_by` — { entry_id, timestamp, source, basis }
- `last_signal` — { entry_id, timestamp, signal_type, basis }

**No due_date or deadline field.** Threads only track age.

**Actual open threads right now:**
1. PUNKS: awaiting reply from justin@justinaversano.com, 1 day old
2. LZ: followup required with Jessica (sales plan), 4 days old

---

### Activity — `state/derived/activity/{project_id}.json`

**Feeds:** Today block (overnight activity)

**Entry shape:** entry_id, timestamp, source, entry_type, title, summary, actors[], authorship

**Total entries per project (all-time in activity files, not just today):**
| Project | Total entries | Source breakdown |
|---------|--------------|-----------------|
| punks-2026 | 80 | drive(35), basecamp(27), gmail(16), operator(1), conversation(1) |
| lucas-zanotto-2026 | 162 | drive(82), basecamp(51), gmail(24), calendar(3) |
| 0009eth-2026 | 386 | drive(319), gmail(21), basecamp(44), calendar(2) |
| mystery-box-vhils | 78 | gmail(78) |

**Today's entries (2026-03-29) are all document_created** — the large Drive initial sync ran today. Today's breakdown across all projects is purely `document_created` from Drive. Normal operating days will have a healthier mix of communications and todo changes.

**Problem:** Today's entries are 100% `document_created` from the initial Drive sync. No communications, no todo changes, no manual notes from today. On a normal operating day after the initial sync flood settles, the mix would be more varied. But right now the activity feed is pure noise for the Today block.

**Design note:** The activity feed needs filtering by entry_type to surface signal. Communications and todo changes matter for "what happened overnight." Document_created entries are bulk noise from Drive sync.

---

### Facts — `state/derived/facts/{project_id}.json`

**Feeds:** This Week block (project dates and deadlines)

**Date-type facts found:**
| Project | Fact | Value | Source |
|---------|------|-------|--------|
| punks-2026 | opening_date | 2026-06-05 | manual |
| lucas-zanotto-2026 | opening_date | 2026-04-24 | synced |
| lucas-zanotto-2026 | event_date | 2026-03-25 | synced (1 conflict) |
| lucas-zanotto-2026 | todo_due_9627423011 | 2026-03-30 | synced |
| lucas-zanotto-2026 | todo_due_9697829537 | 2026-03-23 | synced |
| lucas-zanotto-2026 | todo_due_9627422942 | 2026-03-06 | synced |
| lucas-zanotto-2026 | todo_due_9627422930 | 2026-03-17 | synced |
| 0009eth-2026 | event_date | 2026-03-26 | synced (1 conflict) |

**Usable for week view:** `opening_date` facts are displayable (known key, clear meaning). `todo_due_*` facts are keyed by opaque Basecamp IDs — not displayable without resolving the ID to a todo title. `event_date` facts are past dates, not upcoming.

**LZ opening_date 2026-04-24** is the most relevant — it's 26 days away and should appear in a week/upcoming view. But it's beyond 7 days, so only relevant if the "This Week" block extends its horizon for milestones.

---

### Reminders — `state/runtime/reminders.json`

**Feeds:** Today block

**Current state:** 2 reminders, both open, neither has a due date or project link.

| Field | rem_001 | rem_002 |
|-------|---------|---------|
| title | Create templates/reference section in Eterno's shared Drive folder | Bring Lev in for Phase 4 surface design |
| kind | task | idea |
| due | null | null |
| project_id | null | null |
| status | open | open |

**Shape per reminder:** id, title, description, kind ("task"|"idea"|"alert"), source, status, due (nullable ISO date), project_id (nullable), promoted_to, created_at, updated_at.

**Gap:** No due dates set, no project links. Both reminders are cross-cutting operational items. Design for an inbox-style list, not a calendar-bound view.

---

### Registry — `state/registry.json`

**Feeds:** All blocks (project identity for labeling)

4 projects. Shape per project: project_id, name, type ("exhibition"|"product"), status ("active" on all), aliases[], source_refs, created_at, updated_at.

Used for: project name display, type badges, status indicators. Not directly time-horizon data.

---

### Sync Log — `state/sync_log/{source}.json`

**Feeds:** Today block (freshness indicator)

4 files: gmail.json, basecamp.json, calendar.json, drive.json. Each has `last_run`, `last_sync`, `failures[]`.

Last sync across all sources: 2026-03-29 ~14:39 UTC. No failures.

Gmail has per-account last_sync (4 accounts). Others have a single timestamp.

Useful for: "Last synced 3 hours ago" indicator. Simple, reliable.

---

## 2. Feasibility Questions

### Q1: Do threads have due dates? Can age + signal approximate urgency?

**No due dates.** Thread schema has: thread_key, status, signal_type, counterparty, age_days, opened_by, last_signal. No due_date, no deadline.

**Age + signal works as a proxy.** Two meaningful urgency signals exist:
- `signal_type`: "awaiting_reply" (waiting on someone else) vs "followup_required" (Viktor needs to act). Followup_required is higher urgency.
- `age_days`: higher = more urgent. The 4-day-old Jessica followup is clearly more urgent than the 1-day-old Justin await.

**Vera can sort by age descending and badge by signal_type.** This gives a usable urgency ranking without needing due dates. Not perfect, but sufficient for 0-5 threads.

### Q2: Does the morning digest segment by "today" vs "upcoming"?

**No.** The digest has:
- `digest_window` with from/to — defines what period was scanned
- `new_journal_entries[]` — flat list, no time segmentation
- `todays_calendar[]` — exists but currently empty
- `fact_changes[]` — exists but currently empty

The digest is a single-window dump, not segmented by today/tomorrow/week. For time-horizon blocks, the dashboard needs to filter by timestamp itself.

### Q3: Can calendar events be filtered by day from existing data?

**Yes.** `state/derived/calendar_events.json` is a derived file produced by `pipeline/lib/derive_calendar.js`. Each event has a `date` field ("YYYY-MM-DD") that can be directly compared for Today/Tomorrow/Week filtering. 10 events in the current 14-day window. The dashboard reads this single file, not raw captures.

### Q4: Are there project-level dates in facts that should appear in the week view?

**Yes, but limited:**
- `opening_date`: PUNKS 2026-06-05 (67 days out), LZ 2026-04-24 (26 days out). Beyond 7-day window but worth showing as a milestone horizon marker.
- `todo_due_*`: LZ has 4 todo due dates, but keyed by opaque Basecamp IDs. One (todo_due_9627423011 = 2026-03-30) is tomorrow. Not displayable without resolving the Basecamp todo title from the journal entry payload.
- `event_date`: past dates, not useful for upcoming view.

**Displayable now:** opening_date facts per project. These are human-readable, clearly named, and carry date values.

**Not displayable without work:** todo_due_* facts need a title lookup. The human-readable title exists in `state/captures/basecamp/` — each capture has `normalized_payload.title` (e.g., "Sales Plan w/ KPIs"). The join key is the todo ID embedded in the fact key (`todo_due_9627423011` → `bc_todo_46298394_9627423011_*`). The dashboard could do this join at read time, or the pipeline could enrich the fact key with a title. This is a Jonah implementation task, not a Vera design question.

---

## 3. Data Density — What's Real for Each Block

### Today Block
| Data type | Available | Quality |
|-----------|-----------|---------|
| Calendar events today | 0 today (it's a Saturday, but data exists for other days — Mon has 7 events) | Derived file ready |
| Open threads | 2 across all projects | Clean, displayable |
| Reminders | 2, no due dates | Thin but usable |
| Overnight activity | 436 entries today — all document_created noise | Needs entry_type filtering |
| Pipeline health | Populated, no failures | Good for status line |
| Sync freshness | All 4 sources, timestamps available | Good for "last synced" |

### Tomorrow Block
| Data type | Available | Quality |
|-----------|-----------|---------|
| Calendar events tomorrow | 1 event (Eterno products, Sun Mar 30) | Derived file ready |
| Thread deadlines | None (no due dates on threads) | N/A |
| Todo deadlines | LZ has 1 todo due 2026-03-30 but no displayable title | Blocked |

### This Week Block
| Data type | Available | Quality |
|-----------|-----------|---------|
| Calendar events 7 days | 10 events in 14-day window (Mon-Thu have events, strong Mon with 7) | Derived file ready |
| Thread deadlines | None | N/A |
| Project milestones | LZ opening 2026-04-24 (26 days), PUNKS opening 2026-06-05 (67 days) | Beyond 7 days |
| Todo deadlines | LZ has todo due dates but no titles | Blocked |

---

## 4. Gaps That Would Block Vera

### ~~Gap 1: Calendar events not in a derived file~~ — RESOLVED
`state/derived/calendar_events.json` now exists. Produced by `pipeline/lib/derive_calendar.js`, wired into `derive_all` and available standalone via `node pipeline/cli/run.js derive_calendar`. 14-day rolling window, deduplicated, clean shape. Dashboard reads this file, not raw captures.

### Gap 2: Todo due dates have no human-readable titles (LOW for v1)
LZ has 4 todo_due_* facts with date values, but the fact keys are Basecamp numeric IDs. The dashboard can't show "Jessica sales plan due Mar 30" — only "todo_due_9627423011: 2026-03-30". This matters for Tomorrow and This Week blocks.

**Not a Vera blocker.** She can design the slot. The data enrichment is a pipeline improvement for Jonah.

### Gap 3: Overnight activity is unfiltered noise (LOW)
436 entries today, all document_created from Drive initial sync. No entry_type filtering in the derived activity files. On steady-state days after the sync flood, the mix will be more useful (communications, todo changes, messages).

**Not a Vera blocker.** Dashboard filters by entry_type at render time. Vera should design with a filter/group model, not raw list. Suggested priority: communication_received > basecamp_todo_change > basecamp_message > communication_sent > manual_note > meeting_scheduled. Document_created is a collapsed "N files synced" indicator, not individual items.

### Gap 4: Thread counterparty format is inconsistent (LOW)
"justin@justinaversano.com" vs "Jessica". Some are emails, some are first names. Not a blocker — Vera designs for a text string — but the inconsistency is visible.

### No blockers for Vera's design work. She can design all three blocks with data that exists today. Gaps affect data richness, not design feasibility.

---

## 5. Sort and Display Rules (from Claudia's IA adjustments)

These are Vera's spec for how items sort within each component. Documented here so she builds against the right ordering.

### Thread sort order
Primary sort: `signal_type` urgency (followup_required > awaiting_external_action > awaiting_reply). Secondary sort: `age_days` descending (oldest first).

**Fallback:** If `signal_type` is missing or unrecognized, sort by `age_days` only. This handles threads that may have been created with a custom or future signal type. Never crash or omit a thread because its signal_type doesn't match the priority list.

### Reminder sort order
Sort by `kind`: alerts first, then tasks, then ideas. Within the same kind, sort by `created_at` descending (newest first).

This means an alert always appears above a task, and a task always appears above an idea, regardless of creation date. The assumption is that alerts are time-sensitive, tasks are actionable, and ideas are ambient.

### Activity entry priority (for overnight feed)
Display priority by `entry_type`: communication_received > basecamp_todo_change > basecamp_message > communication_sent > manual_note > meeting_scheduled. `document_created` entries collapse to a single "N files synced" indicator, not individual items. This prevents Drive sync floods from drowning out signal.

---

## 6. Technical Shell Recommendation

### Runtime: Electron
The dashboard runs as a native Mac app via Electron, not in a browser. Viktor opens it from the dock like any other app. No localhost URL, no terminal. Electron shell patterns exist in the v3b codebase for reference.

### Data reads
The Electron main process (Node) reads JSON files directly from `state/` via `fs.readFile`. The renderer (React) receives data via IPC or preload script. State directory path is resolved relative to the repo root.

Wrap reads in a `dashboard/lib/data.ts` module exposing: `getCalendarEvents(from, to)` (reads `state/derived/calendar_events.json`, filters by date), `getOpenThreads()`, `getDigest()`, `getReminders()`, `getRegistry()`, `getSyncStatus()`. All reads are single JSON file reads, no directory traversal needed.

### Page model
Single page with three time-horizon blocks. No routing needed. React renders the page, reads data on load and on window focus (so bringing the app to the foreground shows fresh data if the pipeline ran in the background).

### Refresh model
Automatic on window focus. When Viktor Cmd+Tabs to the app, it re-reads state files and updates the view. No manual reload button needed. The pipeline writes files on its schedule, the app picks them up when foregrounded.

Optional future upgrade: file-watcher for live updates while the window is visible. Not Phase 4 scope.

### Dependencies
Minimum: `electron`, `react`, `react-dom`, `typescript`, `@types/react`, `@types/node`. CSS approach is Vera's call — plain CSS modules or Tailwind both work. No Next.js needed — Electron with React is simpler since there's no server rendering requirement (all data is local fs reads).

### Build and launch
`electron .` from the dashboard directory, or a package.json script. Optionally package as a `.app` bundle via `electron-builder` so Viktor can double-click it from Finder or pin it to the dock.

### Vera's viewport
Design for a fixed desktop window. Recommended default: 1200x800, resizable. Not responsive to mobile — this is a desktop-only app. Vera can assume a minimum width of ~1000px.
