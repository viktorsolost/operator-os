# Memento Editorial Pass

This file describes the post-pipeline editorial pass Claudia may run on Memento output.

This is Memento app context, not operator memory.

## Purpose

After a pipeline run, Claudia may do a small editorial pass to keep the Today view clean, accurate, and readable.

Trigger examples:
- Viktor says "run editorial"
- Viktor says "clean up the data"
- Viktor runs the pipeline and asks Claudia to review the output

## Editorial steps

### 1. Pull legacy production calendars when needed
Read the Google Sheets directly with gws CLI, parse the legacy layout, and write the extracted shape into `state/derived/editorial.json` so it matches the pipeline output shape.

Current known legacy calendars:
- Lucas Zanotto live production calendar: `1Q4cqHPg7FiC2kyzT5VL5vaC6cWvz66NoC_Q6-7a2Ip0` on `gws-eterno`, tab `Production Calendar`
- 0009.eth live production calendar: `1c5PSyvYZ3yBMu9_WJltO0vGrTuwIpikWzbvtRDywOns` on `gws-eterno`, tab `Production Calendar`

Project-specific stale-copy warnings belong in the project references files, not here.

### 2. Tag calendar events with project links
Scan `state/captures/calendar/` and add `candidate_project_links` when the project is obvious from title or attendees.

### 3. Normalize thread counterparty names
Patch `state/derived/threads/*.json` when a known human name should replace a raw email address.

### 4. Write overnight activity highlights
Write one-line highlights for meaningful overnight activity into `state/derived/editorial.json` under `activity_highlights`.

### 5. Fill contact names
Patch `state/derived/contacts.json` when known human names are missing.

### 6. Flag inconsistencies
Cross-check production calendar data against other sources and flag mismatches for Viktor.
Production calendar wins when it exists.

## Delegation shape

- Steps 1, 2, 5: retrieval or extraction agents
- Steps 3, 4: interpretation agents
- Step 6: Claudia judgment

## Boundary

This file defines the editorial pass only.
It does not replace Memento contracts, project references, or operator closeout rules.
