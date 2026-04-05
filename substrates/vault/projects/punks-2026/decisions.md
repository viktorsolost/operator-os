# PUNKS Decisions

## 2026-03-27

### Production calendar structure
- **Decision:** Single opening anchor for DAYS TO OPENING. Post-opening tasks show negative numbers. No dual-anchor system.
- **Status:** confirmed
- **Rationale:** Mixing two anchors in one column would be confusing for the team. Negative numbers are intuitive enough.

### Artist-specific task model
- **Decision:** Artist-specific tasks (26 identified) tagged with `task_scope`, `tracking_mode`, `artist_progress` fields in the project store. Not multiplied to per-artist rows yet.
- **Status:** confirmed
- **Rationale:** No artist names confirmed at time of store creation. Expansion happens after artist list is finalized. Avoids 260 fake rows.

### Template column structure
- **Decision:** Hidden columns A-B (ID, SOP REF). Visible starts at C (AREA, TASK, DEPENDS ON, DURATION, START DATE, END DATE, DEADLINE, DAYS TO OPENING, STATUS, OWNER, ARTIST, NOTES). No extra ID columns for dependencies.
- **Status:** confirmed
- **Rationale:** Keeping the sheet fully human-owned with no sync risk between duplicate ID columns. The pipeline LLM can resolve dependencies from text.

### Project naming
- **Decision:** display_name: "PUNKS", artist: "Various Artists", show_format: "group_exhibition"
- **Status:** confirmed
- **Rationale:** Anton's recommendation. display_name is project identity, artist field should be truthful for prompts and views, not a format label.

### Intake and promotion path
- **Decision:** Manual intake with immediate promotion. Intake record created first, then project store. No manual registry edit.
- **Status:** confirmed
- **Rationale:** Follows Anton's canonical-first rules. Dashboard API derives from store files.

### Per-artist calendar tabs
- **Decision:** Each confirmed artist gets their own tab in the production calendar with the 26 artist-specific tasks. Main tab stays as the master overview with single-row artist-tracked tasks.
- **Status:** confirmed
- **Rationale:** Clear per-artist progress tracking without cluttering the main calendar. New tabs added as artists confirm.

### Compressed timeline
- **Decision:** All deadlines recalibrated to a 70-day window (Mar 27 to Jun 5). No task starts overdue. Contracts and RFIs go out immediately after each artist call, not sequentially after all calls.
- **Status:** confirmed
- **Rationale:** Project started late (Mar 27 vs LZ's January). Parallel execution across artists. Push every 2 days for signatures.

### Claire Silver moved to Friday
- **Decision:** Pamela requested Friday instead of Tuesday. Pending Viktor's availability check.
- **Status:** proposed
- **Rationale:** Claire and Pamela traveling Tuesday.

## 2026-04-03

### Artist contract package boundary
- **Decision:** All PUNKS artists are in the same contract state until the real contract package is sent. The package is provisional contract, RFI document, RFI instructions, and AEV list.
- **Status:** confirmed
- **Rationale:** Coldie received terms and conditions only, which caused confusion. Do not treat him as a different contract case from the other artists.
