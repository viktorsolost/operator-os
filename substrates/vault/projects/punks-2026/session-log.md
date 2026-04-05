# PUNKS Session Log

## 2026-04-02 — New Artist Replies + Drafts

### New artist confirmations

**Rainer Hosch** — Confirmed. Replied Apr 1 to Julia's outreach (sent Mar 30): "I would love to be part of it!" Based in New York. Contact: rainerhosch@mac.com, +1 646 207 4010. Website: rainerhosch.com.

**Amber Vittoria** — Strong interest. Replied Apr 1 to Julia's outreach (sent Apr 1): "This sounds amazing, as a new mother these themes have started to creep into my work itself as well." Asked about transport for physical works. Contact: amber.vittoria@gmail.com. Website: ambervittoria.com.

### Draft replies prepared (from viktor@eternogallery.com)

**Amber reply:** Answered transport question (we handle all shipping inbound + return), attached T&C overview, asked for timezone and availability for a call next week.

**Rainer reply:** Welcome aboard, attached T&C overview, asked for timezone and availability for a call next week.

### T&C document

Updated `Eterno_TC_Overview_v2.pdf` with delivery deadline changed from April 5-20 to **April 20-30, 2026**. Saved at `~/Downloads/Eterno_TC_Overview_v2.pdf`. This version to be used for all new PUNKS artist onboarding going forward.

### Artist status (as of 2026-04-02)

| Artist | Status | Notes |
|--------|--------|-------|
| Claire Silver | Confirmed | Via manager Pamela. Call rescheduled to Apr 7, 7pm Dubai |
| Coldie | Confirmed | Had intro call Mar 31. Proposing Jack Dorsey magnetic portrait. Next call Apr 10 |
| Zafgod | Confirmed | Call done |
| PIV | Confirmed | Call scheduled |
| Pindar Van Arman | Confirmed | Call scheduled |
| Darko | Confirmed | Call scheduled |
| Justin Aversano | No reply | Viktor pushed again, still no response |
| Rainer Hosch | NEW Confirmed | Apr 1 reply. New York based. Draft reply ready |
| Amber Vittoria | NEW Interested | Apr 1 reply. Asking about transport. Draft reply ready |
| OSF | No reply | Since Mar 13 |
| DeeKay | On hold | Pending collector at $100k+ |
| Ryan (ThankYouX) | Outreach sent | Mar 30, no reply |

### References

- Rainer thread: gws-eterno, thread 19d3f1b56dd167ba
- Amber thread: gws-eterno, thread 19d4a0c236da78c3
- Coldie T&C email (template reference): gws-eterno, message 19c8fcff7b92587f
- Julia's outreach template: consistent across all artists, sent from julia.staudach@gmail.com, cc pauline@cultural-affairs.com + viktor@eternogallery.com
- T&C PDF (updated): ~/Downloads/Eterno_TC_Overview_v2.pdf
- T&C PDF (original): ~/Downloads/Eterno_TC_Overview.pdf (April 5-20 dates)
- Contract template (Google Doc): https://docs.google.com/document/d/1uCGOTG-5hVT6JPcIAf5rEkit54svDJF2W3Tx5ThYwAM/edit
- RFI form: https://drive.google.com/file/d/1GSl2HfYQeLm52Te1pc5hrfR1JAPULzrS/view
- RFI instructions: https://drive.google.com/file/d/1fv7S-pOdolss6_giwgk7LK_vmVuGajCj/view

## 2026-03-27 — Project Intake + Artist Outreach

### What was done

1. **Morning digest** — pulled fresh data from all sources. Clean day, no meetings, no urgent emails.

2. **Production calendar template** — created an improved exhibition production calendar template in Google Drive.
   - Cloned from Lucas Zanotto calendar, shifted dates to June 5 opening / August 1 closing (42-day offset)
   - New column structure: hidden A-B (ID, SOP REF), visible C onwards (AREA, TASK, DEPENDS ON, DURATION, START DATE, END DATE, DEADLINE, DAYS TO OPENING, STATUS, OWNER, ARTIST, NOTES)
   - All formulas working: START DATE = END DATE - DURATION, END DATE = DEADLINE - 1, DAYS TO OPENING = opening date cell - DEADLINE
   - Fixed broken M05a2 row (had hardcoded values in LZ)
   - Reordered tasks chronologically within each section group
   - Color-coded section headers with tinted data rows per section
   - Conditional formatting: past start dates orange-red text, future green, past deadlines dark red background
   - Status and owner dropdowns with data validation
   - Added SHOW CLOSING row on August 1
   - Template sheet: https://docs.google.com/spreadsheets/d/1k0kTZP77haGHckEeYlmUG9OD4Nquv-NV9Tr7OGj9LNo/edit
   - Viktor renamed the file to "template" after review

3. **Project intake** — created intake record following Anton's canonical-first rules.
   - `state/runtime/project_intake/punks-2026.json` created with full asset assessments, approval state, promotion state
   - Immediate promotion: strategy, setup, and activation all approved by Viktor
   - Classification: exhibition, high confidence
   - Assets: milestone structure found (reuse LZ), SOP found (same), production calendar found (template created), drive setup missing, contract setup missing

4. **Project store** — created active project store entry.
   - `state/runtime/project_store/punks-2026.json` with 10 milestones, 110 tasks
   - 27 artist-tracked tasks tagged with `task_scope: "shared_with_artist_tracking"`, `tracking_mode: "per_artist_checklist"`, `artist_progress: []`
   - All tasks start as `state: "unsurfaced"`, no fake execution state
   - Dashboard API confirmed PUNKS visible as third active project

5. **Navigation bug fix** — Anton identified that milestone/task links were dropping `?project=` query parameter.
   - Fixed 6 locations across `projects/[projectId]/page.js`, `projects/page.js`, `components/SurfacedTasks.js`, `api/_lib/store-views.js`, `api/store/route.js`
   - Milestone IDs like `project_setup` are reused across exhibition projects, so without project context the wrong project would load

6. **Drive folder structure** — created 47 folders in Google Drive.
   - Root: `EE_EX_2026 06_PUNKS` inside `EE_PO_EXHIBITIONS_2026`
   - `PUNKS_PRODUCTION` with Budget, Comms, Design, Models mock-ups & colour samples
   - `Artists` folder with 10 placeholder sub-folders (Artist_01 through Artist_10), each with Contract, Artwork Checklist, Invoices
   - Root folder: https://drive.google.com/drive/folders/1eo7Dlk8sKa0ixv5Wxp11ho0jbqQXuzNW

7. **Artist list** — pulled from Eterno email (viktor@eternogallery.com).
   - Show title: "Unpermissioned Self - Proof of Being"
   - 7 confirmed: Justin Aversano (NYC), PIV (unknown TZ), Pindar Van Arman (US Central, manager Ezra), Coldie (Bay Area), Claire Silver (manager Pamela in CET), Zafgod (Romania), Darko (CET)
   - 2 declined: Ilan Derech, Alien Queen (both objected to consignment/sales terms)
   - 1 no response: OSF (invited Mar 13)
   - 1 on hold: DeeKay Kwon (pricing blocker, minimum $100k, Viktor looking for collector)
   - Julia Staudach assisting with outreach, mentioned Gordon Berger as potential addition

8. **Meeting request emails** — sent to all 7 confirmed artists for Tuesday next week, 30-min slots.
   - 4:00pm Dubai: Zafgod
   - 4:30pm Dubai: Darko
   - 5:00pm Dubai: Claire (via Pamela)
   - 5:30pm Dubai: Justin (also answered his "who else is in the show" question)
   - 6:00pm Dubai: Pindar (cc'd Ezra)
   - 6:30pm Dubai: Coldie
   - PIV: asked for timezone and general Tuesday availability

### Key context from email threads
- Darko had a call promised week of Mar 16 that never got booked, acknowledged in the email
- Justin asked who else is in the show on Mar 22, answered in the meeting request
- Coldie's contract signing pending since early March
- Claire unavailable until early April (Basel HK), delivery window April 5-20 is tight
- Pindar won't travel to Lisbon, proposed Cloudpainter participatory activation

### Continued — afternoon session

9. **Artist tabs in production calendar** — created 7 individual artist tabs in the production calendar, one per confirmed artist. Each has the 26 artist-specific tasks, same formula structure, conditional formatting, dropdowns, and section color coding.

10. **Deadline recalibration** — rebuilt all deadlines in the main tab and artist tabs to fit a compressed 70-day timeline (today to June 5 opening). Key logic: calls this week, contracts and RFIs go out immediately after each call, push every 2 days, parallel tracks where no blockers. No task starts with an overdue deadline.

11. **Status updates across calendar and store** — marked done: M02, M03, M04, M03B, C01, C02, C03, C03B. Marked in progress: C04, M06. Synced all statuses between production calendar and project store.

12. **Project tracker registration** — added PUNKS to the EE tab in the Project Tracker Google Sheet (EP.EE.EX.018.26).

13. **Production calendar copy** — copied template as active PUNKS calendar into PUNKS_PRODUCTION Drive folder. Updated project store key_links with the new calendar URL and Drive folder URL.

14. **Pamela reply** — Claire Silver's manager asked to move from Tuesday to Friday. Viktor checking availability before confirming.

15. **Full consistency audit** — verified store, intake, calendar, Drive, Basecamp, and project tracker are all in sync. Fixed: M03B/M06 status mismatch in store, intake setup actions updated (drive_setup and calendar_setup marked complete), SOP URL added to key_links, cleaned None values.

### Lessons from this session

- Darko kept getting missed in artist searches. The search agent found him on the third attempt. When building artist lists, always do a second pass to check completeness.
- Sub-agent delegation: Viktor corrected that Claudia should delegate aggressively to Sonnet agents. Data fetching, Drive lookups, email searches, calendar reads are all Sonnet work. Opus context is for synthesis, decisions, and presenting to Viktor.
- Never assume email content. When Pamela replied, Claudia assumed it was a confirmation. It was actually a request to move to Friday. Always read the actual email before drafting a response.
- Production calendar dates were initially copied with a flat 42-day offset, but the project started much later than LZ so all early tasks were instantly overdue. Better approach: recalibrate from today as day 1 with compressed timelines.
- Do not present artist locations or timezones as facts unless sourced from the actual email data (headers, body, signatures). General knowledge is not evidence.

## 2026-03-28 — Artist Call Confirmations + Calendar Invites

### What was done

1. **Email review** — checked all PUNKS artist threads across Eterno Gmail for replies to Tuesday call proposals sent Mar 27.

2. **Artist confirmations received:**
   - **Zafgod** — confirmed Tuesday works ("That would be great! Looking forward.")
   - **PIV** — confirmed Tuesday works, timezone is CET ("Available throughout the day")
   - **Pindar** — can't do Tuesday (doctor's appointment), suggested Wed/Thu. Booked Wednesday.
   - **Coldie** — countered with 8:30pm Dubai instead of 6:30pm. Viktor confirmed.
   - **Claire Silver / Pamela** — confirmed Friday (traveling Tue-Thu). Viktor confirmed.
   - **Darko** — Viktor sent scheduling email proposing Tuesday 6pm Dubai. Darko confirmed ("Sounds perfect! Send me the invite when possible.")
   - **Justin** — no reply yet to Tuesday 5:30pm Dubai proposal.

3. **Calendar invites sent** — all on Eterno calendar (viktor@eternogallery.com):
   - **Mon Mar 31, 16:00** — Eterno x Zaf (Zafgod accepted)
   - **Mon Mar 31, 17:00** — Eterno x Piv (sent, not yet accepted)
   - **Mon Mar 31, 18:00** — Eterno x Darko (sent, confirmed via email)
   - **Mon Mar 31, 20:30** — Eterno x Coldie (sent, not yet accepted)
   - **Tue Apr 1, 17:30** — Eterno x Pindar (Pindar + Pauline accepted)
   - **Fri Apr 4, 17:00** — Externo x Claire (sent, not yet accepted — title has "Externo" typo)

4. **DeeKay** — still on hold, last touch Mar 16. Waiting for collector at $100k+.
5. **Justin** — still awaiting reply. Follow up if no response by Monday.

### Open items
- Fix "Externo" typo on Claire's calendar event → "Eterno"
- Justin follow-up if no reply by Monday
- gws-info account (info@ephemeralethernal.com) needs re-authentication (RAPT token expired)
- sara@cultural-affairs.com bouncing — clean from CC lists

## 2026-03-30 — Calendar Rescheduling

### What was done
1. **PIV rescheduled** — moved from 17:00 to 17:30 Dubai (15:30 CET). Calendar invite updated.
2. **Darko rescheduled** — moved from 16:30 to 18:00 Dubai (16:00 CET). Calendar invite updated.

### Final Tuesday schedule (confirmed)
- 16:00 Dubai — Zafgod (accepted)
- 17:30 Dubai — PIV (accepted)
- 18:00 Dubai — Darko (accepted)
- 20:30 Dubai — Coldie (accepted)

## 2026-03-31 — Pre-Call Updates + HTML Prep

### What was done
1. **Pipeline sync** — full sync run. 21 emails fetched, 5 new calendar events, 8 new store entries created.
2. **PIV email** — PIV accepted the updated calendar invite and shared a [Google Doc with reference photos](https://docs.google.com/document/d/1nbfDmgVFwwi8C2BV5n_lqVqSNASOefY6gI2uR6hI2ig/edit) to prepare for the call.
3. **Artist Calls Prep HTML updated:**
   - Fixed day name: "Mon" → "Tue" across all artist call times
   - Fixed Jessica's role: "production team" → "head of sales" in all 4 intro scripts
   - Added PIV's Google Doc reference to his email thread recap and questions section
   - Added location confirmation question to all 4 artists (Zaf, PIV, Darko, Coldie)
   - Added shipping/logistics questions tied to artwork medium and format for each artist, with artist-specific context (EU/non-EU customs, transit time, crating needs)

### Key corrections
- Jessica is Head of Sales, not production team
- March 31 2026 is a Tuesday, not Monday

### Artist Call — Zafgod (16:00)
- Based in Bucharest, confirmed
- Planning 3 digital works: 2 unique + 1 edition
- Interested in live painting at the opening — potential activation
- Boom-era sales ~$20k, current pricing a few hundred euros per piece
- Never sold physicals; collector base was mostly speculators
- Travel to Lisbon feasible given Romania proximity (budget TBD)
- Full notes: `calls/zafgod-2026-03-31.md`

### Artist Call — Darko (18:00)
- Based in Macedonia, spends time in Lisbon — Viktor has met him before at Eterno Gallery
- Planning physical + digital artworks
- Considering a light box — needs to confirm size by April 14 for feasibility check (price vs production costs)
- Digital works priced EUR 500–1,000
- Will produce a text to accompany the artworks
- Largest pieces 50x70 cm
- One concept: wooden box with a window, spinning characters inside
- Full notes: `calls/darko-2026-03-31.md`

### Artist Call — PIV / Francis (17:30)
- Based in Belgium
- Planning interactive screen artworks: 3 touch screens on an electronic board (20x20 cm each), images change on touch, needs power
- Not 100% sure screens will be ready — worried about durability over two months
- Backup/complement: paintings based on last image from his shared Google Drive
- Ideal setup: 3 paintings + 1 screen artwork displayed, 2 spare screen artworks at gallery as backups, all in catalog
- Paintings ~EUR 800 (smaller ones, these are bigger), screen artworks EUR 1,000–1,200 TBC
- Follow-up call ~April 10 to confirm screen progress, ship everything together if possible, paintings first if screens not ready
- Full notes: `calls/piv-2026-03-31.md`
- 2026-04-03 context relocation note: Removed the 2026-04-02 artist-replies recap, the Coldie contract reminder, and the Justin Aversano blocker from `recent-context.md`. Canonical project home remains this session log and related open questions.
