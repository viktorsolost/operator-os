# Exhibition Rules

## Purpose

Durable domain rules for exhibition work.

## Rules

- Treat the opening date as a major planning anchor when it exists.
- Installation and production windows usually matter more than abstract status labels.
- Venue constraints can invalidate otherwise standard workflows, so check them early.
- Calendar, logistics, and production dependencies should be surfaced early because they create cascading risk.
- Exhibition projects often look simple in summary and complex in execution, so prefer explicit dependencies over vague readiness claims.
- A reusable exhibition template is often a good starting point, but it should not be applied blindly when venue, geography, scale, or partner requirements differ.
- Contract, venue, calendar, and logistics questions are frequently gating dependencies, not background details.
- If a detail affects physical installation, shipping, approvals, or public-facing deadlines, treat it as operationally important.

## Practical Heuristics

- If the opening date is missing, confidence in the production calendar should stay low.
- If venue obligations are unclear, contract and setup confidence should stay lower.
- If logistics are cross-border or multi-party, surface risk earlier rather than later.
- When deciding whether to reuse or adapt structure, prefer adaptation if the baseline is good but the context meaningfully differs.

## First Contact with Artists

- First contact email includes: terms & conditions or provisional contract, RFI document, RFI instructions, floor plan, and to-do list with key deadlines.

## Contract Flow

- The "provisional contract" goes out early with a proposed artwork structure so the artist can sign and production can start. Nothing moves without that first signature.
- The artwork structure (number of pieces, UPs, editions) often isn't final at that point. It evolves during production.
- The "final contract" is the same document with the artwork structure lines updated to match the confirmed Artwork Checklist on GDrive.
- Once updated, route internally FIRST: email to Sara (direct), cc Goncalo, Ana Amancio, Filomena for internal signing chain (L03).
- Once internally signed, THEN send to artist for signature (M06C). Can bundle RFI details request if the artist asked for help (Step 8).
- Once artist returns signed contract, it's fully executed. Replace contract on GDrive + upload to Basecamp.
- SOP reference: Steps 7a/7b (doc ID: 1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI).
- When completing a contract, verify the correct entity name (e.g. "Eterno Gallery", not "Underdogs") is used consistently across the entire document, not just the section being edited.
- Numbers in contracts: digit followed by word in parentheses, e.g. 5 (five).

## Design Brief (D01a)

- Design briefing is done in the Design Basecamp project, not by email.
- Add a card to the Triage column in the card table: https://3.basecamp.com/3378703/buckets/30784759/card_tables/5686066004
- Include the EXB_CARD in the brief.

## Pricing and Artwork Data

- Artwork Checklist on GDrive is the source of truth for artwork structure, pricing, and series sizes. Never infer pricing from emails, web research, or LLM reasoning. Always fetch the checklist directly.

## Briefing Documents (EXB_CARD)

- EXB_CARD is the standard briefing document for every show. One per show, multi-team, each section has a clear owner. Created by Viktor, filled by team before the comms briefing.
- Positioning and framing are different. Positioning is internal/strategic (why we're doing this show). Framing is external/narrative (how we talk about it). Framing usually distributes naturally across the document. Positioning needs its own dedicated space.
- The correct entity name is "Eterno Gallery" (not "Eternal Gallery" or "Eterno" alone) in formal or external contexts.

## Market Research

- Always double-check market research with verification agents before presenting to Viktor. He reports on this data externally, so every claim must be sourced and verified.
- When presenting financial or market data, always include EUR equivalents alongside the original currency.
- Never fabricate prices, sales figures, or auction results. If data is not found, say so explicitly.

## SOP

- Exhibition Operations SOP (living document, do not edit without Viktor's approval): https://docs.google.com/document/d/1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI/edit?usp=drive_link
- Primavera ERP Manual (field-by-field instructions for articles, projects, compositions): https://docs.google.com/document/d/1NmhYw1Kgzs1Yr8ZFNPmGNQTZYgRQDewr/edit
- Primavera accounts guide: https://docs.google.com/presentation/d/1HTIo7JArM26bLQfKUAcKSFKOHPmUIpwi/edit

## Group Shows (Multi-Artist)

- Artist-specific tasks (contracts, RFIs, artwork checklists, shipping, payments) are tagged in the project store with `task_scope: "shared_with_artist_tracking"` and `tracking_mode: "per_artist_checklist"`. They are not multiplied to per-artist rows until the artist list is confirmed.
- Shared tasks (venue prep, comms, design, budget) stay as single rows regardless of artist count.
- 26 tasks identified as artist-specific in the standard exhibition template (10 management/legal, 4 curation, 7 production, 4 logistics, 1 finance).
- Drive folder structure uses per-artist sub-folders under Artists/ with Contract, Artwork Checklist, and Invoices per artist.
- Production calendar adds an ARTIST column but does not duplicate rows until expansion.

## Production Calendar + SOP Workflow

The SOP and production calendar are tightly connected and both are central to exhibition execution. This is the primary operational workflow.

- The **SOP** (`Eterno_EXB_SOP`, doc ID: 1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI) is the master playbook for all exhibitions. 41+ steps covering the full lifecycle from artist selection (Step 1) through post-mortem (Step 41). Each step defines who does what and how. Single document, shared across all exhibition projects.
- The **production calendar** is project-specific (one Google Sheet per project). Each row is a task with dates, status, owner, and a **SOP REF** column (format: `P{phase} S{step}`) that links back to the corresponding SOP step.
- The SOP REF is the bridge between "what's overdue" and "what to do about it." When a calendar task is late, the SOP REF tells you the exact procedure, dependencies, and people involved.
- The production calendar tells you WHAT and WHEN. The SOP tells you HOW.
- The project lifecycle: Basecamp project created → GDrive folder structure created → production calendar prepared from template → work tracked against SOP steps.

### Multi-artist exhibitions (e.g., PUNKS)

- The main "Production Calendar" tab holds project-wide tasks (Basecamp setup, Drive structure, comms briefing, design, venue prep).
- Each artist gets their own tab in the same spreadsheet (e.g., "Zafgod", "PIV", "Coldie"). Same column structure, same SOP REFs, but scoped to that artist's individual tasks and timeline.
- Artist-facing SOP steps (Steps 1-11, 21-25: contracts, RFIs, artwork lists, shipping) run per-artist on their tab. Project-wide SOP steps run once on the main tab.
- Progress must be tracked per artist tab, not just on the main calendar. An artist being behind on their contract (M01) doesn't show on the main tab.
- PUNKS production calendar ID: `1ARYy5_VDorNI_aMxrQYX8ulyljh6XIcms1_YaOfW1vI` (gws-eterno shared drive). 7 artist tabs: Justin Aversano, PIV, Pindar Van Arman, Coldie, Claire Silver, Zafgod, Darko.
- Lucas Zanotto production calendar ID: `1Q4cqHPg7FiC2kyzT5VL5vaC6cWvz66NoC_Q6-7a2Ip0` (gws-eterno shared drive).
- Production calendars always live on the Eterno shared drive (gws-eterno). Spreadsheets on Viktor's personal Drive are templates or old copies, never the active working document.

### Column layout

- Template column layout (improved 2026-03-27): A=ID (hidden), B=SOP REF (hidden), C=AREA, D=TASK, E=DEPENDS ON, F=DURATION, G=START DATE, H=END DATE, I=DEADLINE, J=DAYS TO OPENING, K=STATUS, L=OWNER, M=ARTIST, N=NOTES
- Legacy column layout: A=Task ID, B=Is Summary, C=Area, D=Task description, E=Depends On, F=Start, G=Duration, H=End, I=Deadline, J=Days to Opening, K=Status, L=Owner, M=Notes, N=SOP Ref
- Template uses single opening anchor for DAYS TO OPENING. Post-opening tasks show negative numbers.
- Formula structure: START DATE = END DATE - DURATION, END DATE = DEADLINE - 1, DAYS TO OPENING = opening date cell - DEADLINE. Only DEADLINE is manually entered per task.
- Template location: Eterno Drive templates folder
- Auth config: gws-personal (viktor.so.lost@gmail.com) for production calendars, gws-ca for master sheet
- Use `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` (not `GWS_CONFIG_DIR`) to switch accounts
- Master Sheet ID: 1NcobQ8N_eMM71AdM8hutrhE1K8Tl7Sk84WpWF5RaJ8I

## Startup-Safe Domain Rules Moved From `memory.md`

- Milestones are 10 predefined semantic exhibition phases, from `project_setup` through `project_closed`. Tasks get classified into these by area and task patterns.
- `is_summary` in Google Sheets is a row-grouping feature, not a milestone marker.
- The production calendar is the source of truth for exhibition deadlines, tasks, assignees, and milestones. Basecamp todos are downstream mirrors. When Basecamp and the production calendar disagree, the production calendar wins.
- Production calendars live on the Eterno shared drive, `gws-eterno`, never on Viktor's personal drive. Spreadsheets found on `gws-personal` are templates or old copies, not the active working documents.
- Always update the same sheet the pipeline reads from. Before writing to any Google Sheet, verify the spreadsheet ID matches what the pipeline captures use. Reading one sheet and writing to another creates a silent data split.
- Reminders need a due date to appear on the Today page. When Viktor says something is for today, always set the due date.
- The SOP is the source of truth for how to execute each step. When a production calendar task is overdue or upcoming, the SOP REF points to the exact procedure, dependencies, and people involved.
- The SOP plus production calendar workflow is the core operating loop for exhibitions. The SOP tells you how. The production calendar tells you what and when.

