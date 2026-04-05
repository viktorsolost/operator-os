# Phase 4 — Vera Brief: Today Page

## Context

Memento is a project journal system with an AI operator (Claudia) as the primary interface. The dashboard is a read-only context viewer. Viktor's direction: one page, minimal, no metrics, no project detail views, no calendar page. Just the Today page.

## What You're Designing

One page. Three blocks. That's the entire scope.

### Block 1: Today
What's happening today. What needs Viktor's attention right now.
- Today's calendar events across projects
- Open threads that need attention (waiting on replies, overdue follow-ups)
- Reminders due today
- Overnight activity worth knowing about (brief, not a full feed)

### Block 2: Tomorrow
What to prepare for.
- Tomorrow's calendar events
- Anything hitting tomorrow that needs prep today

### Block 3: This Week
What's coming. Collision patterns across projects.
- Calendar events and deadlines across all active projects for the next 7 days
- Shows when things stack up (3 calls Monday, deadline Wednesday, opening in 10 weeks)

## Design Mandate

**Minimal.** Viktor's words: "the most minimal way possible." This is not a dashboard with widgets and panels. It's closer to a daily briefing note rendered as a clean page. Think newspaper front page, not control panel.

Specific constraints:
- No metrics, counters, charts, or stats
- No source attribution or provenance metadata on screen (Claudia handles that in conversation)
- No project detail views. If Viktor wants project depth, he asks Claudia
- No edit flows, no checkboxes, no status toggles. Read-only
- No task management UI of any kind. Open threads show what's waiting. They are not actionable items
- Items should show which project they belong to, but project is a label, not a link to another page

## Data Source

Anton will deliver `plan/phase-4-data-inventory.md` describing every data file you can read, field shapes, and gaps. Design against that inventory.

The dashboard reads pre-composed JSON from `state/derived/` and `state/runtime/`. No external API calls. Pipeline owns freshness, dashboard owns presentation.

## Design Process

### Step 1: Information Architecture
Written spec only. For the one page:
- What each block contains, in what order
- Content hierarchy within each block (what's prominent, what's secondary)
- How items are grouped (by project? by time? by urgency?)
- What it looks like with rich data (PUNKS) vs thin data (Mystery Box)
- What it looks like when there's nothing for a block (empty Tuesday, quiet week)

Deliver as: `plan/phase-4-information-architecture.md`

**Viktor reviews this before you proceed to code.**

### Step 2: Working Prototype
Build it in `dashboard/` using Next.js (app router). Reads real JSON from `state/derived/`. Must be runnable locally. Minimal dependencies.

Polish is not the goal. Clean structure and real data rendering are. Viktor needs to see it with actual project data to react to it.

## Design North Star

This page replaces the first 5 minutes of Viktor's daily conversation with Claudia. Before opening any chat, he glances at this and knows the shape of the day. If the page does that in 10 seconds of scanning, it's working. If it takes longer, there's too much on it.

## Source Files

- Data inventory: `plan/phase-4-data-inventory.md` (wait for Anton's deliverable)
- Technical plan: `plan/memento-technical-plan.md` (Dashboard Surfaces + Invariants sections)
- Morning digest: `state/derived/morning_digest.json` (this is Claudia's editorial output — respect its structure)

## Output

1. `plan/phase-4-information-architecture.md` — structural spec
2. Working prototype in `dashboard/` (after Viktor approves IA)

Report back after the IA with your key structural decisions and any questions.
