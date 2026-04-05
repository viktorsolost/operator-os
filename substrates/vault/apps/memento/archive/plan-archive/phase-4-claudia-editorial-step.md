# Phase 4 — Claudia's Editorial Step

Anton, 2026-03-30. Build spec for Jonah.

The editorial step is a pipeline derivation that composes data from multiple sources into a single `state/derived/editorial.json` file. The dashboard reads this file directly. The editorial step runs as part of `derive_all` and independently via `node pipeline/cli/run.js derive_editorial`.

---

## What This Step Produces

`state/derived/editorial.json` with this shape:

```json
{
  "derived_at": "2026-03-30T08:00:00.000Z",
  "overdue_deadlines": [
    {
      "project_id": "lucas-zanotto-2026",
      "title": "Memória Descritiva",
      "assignee": "Viktor Solost",
      "due_date": "2026-03-06",
      "days_overdue": 24
    }
  ],
  "upcoming_deadlines": [
    {
      "project_id": "lucas-zanotto-2026",
      "title": "Sales Plan w/ KPIs",
      "assignee": "Jessica Louro",
      "due_date": "2026-03-30"
    }
  ]
}
```

Both arrays can be empty. Both are always present (never omitted).

---

## Resolved Basecamp Deadlines

### What the problem is

Facts files (`state/derived/facts/{project_id}.json`) contain `todo_due_*` keys with date values and `todo_status_*` keys with open/completed values. But the fact keys are opaque Basecamp numeric IDs — `todo_due_9627423011` means nothing to a human. The dashboard needs a title ("Sales Plan w/ KPIs") and an assignee ("Jessica Louro") to display these.

That data exists in `state/captures/basecamp/` — each todo capture has `normalized_payload.title`, `normalized_payload.assignees[]`, and `normalized_payload.completed`.

The editorial step joins these two sources.

### Data sources

**1. Facts (due dates and statuses):**
- Path: `state/derived/facts/{project_id}.json`
- Keys matching `todo_due_*` give the due date. The numeric suffix is the Basecamp todo ID.
- Keys matching `todo_status_*` give the open/completed status. Same numeric suffix.
- Example: `todo_due_9627423011` = "2026-03-30", `todo_status_9627423011` = "open"

**2. Captures (titles and assignees):**
- Path: `state/captures/basecamp/bc_todo_{basecamp_project_id}_{todo_id}/`
- Directory naming: `bc_todo_{basecamp_project_id}_{todo_id}`. The `{todo_id}` segment matches the numeric suffix from the fact key.
- Each directory contains one or more versioned JSON files (timestamped filenames). Read the latest (last when sorted alphabetically).
- `normalized_payload.title` — human-readable todo title (string, always populated)
- `normalized_payload.assignees` — array of `{ name, email }`. Can have 0, 1, or multiple assignees.
- `normalized_payload.completed` — boolean. `false` = still open.
- `normalized_payload.due_on` — date string, matches the fact value (can be used as a cross-check but the fact is the authority).

**3. Registry (project list):**
- Path: `state/registry.json`
- Provides the list of active project IDs to iterate over.

### Join logic

```
for each project in registry.projects:
  load facts from state/derived/facts/{project_id}.json

  collect todo IDs that have BOTH a todo_due_* AND a todo_status_* fact

  for each todo ID:
    skip if todo_status value is not "open"

    due_date = todo_due_* fact value (string, "YYYY-MM-DD")

    find capture directory matching pattern: state/captures/basecamp/bc_todo_*_{todo_id}/
      - the first segment after bc_todo_ is the Basecamp project ID, which varies
      - match on the todo_id suffix: directory name ends with _{todo_id}
      - if no matching directory found, skip this todo (no capture to resolve)

    read latest file in capture directory (sort filenames, take last)

    title = normalized_payload.title
    assignees = normalized_payload.assignees (array of {name, email})
    completed = normalized_payload.completed

    if completed is true, skip (capture is more current than fact — todo was completed after last fact derivation)

    assignee_display = first assignee's name, or "Unassigned" if array is empty
      - if multiple assignees, join names with " & " (e.g., "Carmen Bioque & David Cardoso")
      - cap at 3 names, then "Carmen Bioque & 5 others"

    compare due_date to today:
      if due_date < today → overdue
      if due_date >= today → upcoming

    days_overdue = (today - due_date) in whole days (only for overdue items)
```

### Current data (as of 2026-03-30)

4 todos have due dates, all in lucas-zanotto-2026. All are open. All have matching captures.

| Todo ID | Title | Assignee(s) | Due | Classification today |
|---------|-------|-------------|-----|---------------------|
| 9627422942 | Memória Descritiva | Viktor Solost | 2026-03-06 | Overdue (24 days) |
| 9627422930 | Mkt & Comms plan w/ KPIs | David Cardoso | 2026-03-17 | Overdue (13 days) |
| 9697829537 | EXB_CARD | Carmen Bioque & Carolina Costa & David Cardoso & 3 others | 2026-03-23 | Overdue (7 days) |
| 9627423011 | Sales Plan w/ KPIs | Jessica Louro | 2026-03-30 | Upcoming (due today) |

**Note on "due today":** An item due today is classified as `upcoming`, not `overdue`. It becomes overdue tomorrow. The IA says "Basecamp todos that are past their due date" for overdue. Due today = not yet past.

### Sort order

**`overdue_deadlines`:** sorted by `days_overdue` descending (most overdue first). The IA says "sorted by how overdue, most overdue first."

**`upcoming_deadlines`:** sorted by `due_date` ascending (soonest first).

### Output field types

```typescript
interface OverdueDeadline {
  project_id: string;     // registry project ID
  title: string;          // human-readable Basecamp todo title
  assignee: string;       // display string: "Name", "Name & Name", or "Name & N others"
  due_date: string;       // "YYYY-MM-DD"
  days_overdue: number;   // positive integer, always >= 1
}

interface UpcomingDeadline {
  project_id: string;
  title: string;
  assignee: string;
  due_date: string;       // "YYYY-MM-DD", today or future
}

interface EditorialOutput {
  derived_at: string;     // ISO timestamp
  overdue_deadlines: OverdueDeadline[];
  upcoming_deadlines: UpcomingDeadline[];
}
```

---

## Pipeline Integration

### File location
Module: `pipeline/lib/derive_editorial.js`

### CLI wiring
Add `derive_editorial` to `DERIVE_COMMANDS` in `pipeline/cli/run.js`. Add a `runDeriveEditorial()` function. Call it from `runDeriveAll()` after `runDeriveCalendar()` (editorial depends on facts being up to date).

### Execution order in derive_all
```
derive_facts        ← must run first (produces todo_due_* and todo_status_*)
derive_threads
derive_activity
derive_contacts
derive_calendar
derive_editorial    ← runs after facts are current
```

### Dependencies
Reads from: `state/registry.json`, `state/derived/facts/*.json`, `state/captures/basecamp/bc_todo_*/`.
Writes to: `state/derived/editorial.json`.

No external dependencies. Pure filesystem reads and JSON writes.

---

## Edge Cases

**Todo has a due date fact but no status fact:** Skip it. Without a status, we can't confirm it's open. This shouldn't happen in practice because the Basecamp sync produces both, but don't assume.

**Todo has a due date fact but no matching capture directory:** Skip it. Log a warning: `[derive_editorial] No capture found for todo ${todoId} in project ${projectId}`. The title can't be resolved without the capture.

**Capture says completed but fact says open:** Trust the capture. The capture is fetched directly from Basecamp's API and may be more recent than the last fact derivation. Skip the todo — it's done.

**Multiple capture versions (multiple files in directory):** Always read the last file when sorted alphabetically (filenames are ISO timestamps like `2026-03-29T14-18-09.617Z.json`). This is the most recent observation.

**Assignees array is empty:** Display as "Unassigned".

**Due date in the past but todo is completed:** Won't reach this code — the completed check filters it out first.

**No todos with due dates for any project:** Both arrays are empty. File is still written with empty arrays.

---

## Verification

After implementation, `node pipeline/cli/run.js derive_editorial` should produce a file at `state/derived/editorial.json` with:
- 3 overdue deadlines (Memória Descritiva 24d, Mkt & Comms plan 13d, EXB_CARD 7d)
- 1 upcoming deadline (Sales Plan w/ KPIs, due 2026-03-30)
- `derived_at` timestamp present

Run `derive_all` and confirm editorial runs after facts without errors.
