# Phase 4 — Anton Brief: Dashboard Data Inventory

## Context

Memento Phase 4 is now a single page: the Today page. Three time-horizon blocks (today, tomorrow, this week). Read-only, reads composed JSON from disk. Vera will design it. You're producing her data reference.

## Your Deliverable

A single file: `plan/phase-4-data-inventory.md`

## What To Audit

Vera needs to know what data exists to populate three blocks:

### Block 1: Today
What's happening today. What needs Viktor's attention right now.
- Calendar events for today
- Open threads that are urgent or aging
- Reminders due today
- Overnight activity worth surfacing

### Block 2: Tomorrow
What to prepare for.
- Calendar events for tomorrow
- Threads or deadlines hitting tomorrow

### Block 3: This Week
What's coming. Collision patterns across projects.
- Calendar events for the next 7 days
- Thread deadlines across all active projects
- Any time-sensitive facts (exhibition dates, due dates from facts)

## For Each Data Source

Audit these files against the three blocks above:
- `state/derived/morning_digest.json`
- `state/derived/threads/{project_id}.json` (all 4 projects)
- `state/derived/activity/{project_id}.json` (all 4 projects)
- `state/derived/facts/{project_id}.json` (all 4 projects)
- `state/runtime/reminders.json`
- `state/registry.json`

For each file report:
- Which block(s) it feeds
- Relevant fields and their actual shape
- What's populated vs empty in real data
- Sample values (keep brief, one or two examples)

## Key Feasibility Questions

1. Do threads have due dates or deadlines? If not, can thread age + signal type approximate urgency?
2. Does the morning digest already segment by "today" vs "upcoming"? What's the time boundary?
3. Can calendar events be filtered by day from the existing data, or does the digest only give a flat list?
4. Are there project-level dates in facts (opening dates, deadlines) that should appear in the week view?

## Technical Shell

Brief recommendation:
- How the dashboard reads local JSON files
- Static generation vs client-side
- Refresh model (rebuild on pipeline run? file watcher?)
- Minimal dependency footprint

## Constraints

- Read actual data files, not schemas
- Be honest about gaps
- Do not propose pipeline changes. Flag what's missing, let Lev decide if it's in scope
- Keep the output scannable. Vera needs a 5-minute read, not a deep dive

## Output

Single file: `plan/phase-4-data-inventory.md`

Report back with: key findings, any gaps that would block the three-block design, and your technical shell recommendation.
