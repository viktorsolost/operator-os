# Installer v1 — Full System Comparison

## How to Read This Document

This is a 1-to-1 visual comparison of every file in VIK_OS today
versus what a clean installed instance would contain.

### Legend

```
LOCAL (what exists today)          -->  INSTALLED (what ships to a new user)
========================================
[COPY]      = ships as-is               (green — identical copy)
[REWRITE]   = ships with owner swap     (yellow — same structure, new identity)
[FRESH]     = new file generated         (blue — blank or seeded from onboarding)
[EXCLUDE]   = does not ship              (red — cut entirely)
[DEFER]     = created post-install       (grey — onboarding or user action)
```

### Visual Key

| Icon | Meaning |
|------|---------|
| `=` | Identical in both |
| `~` | Same structure, content rewritten |
| `+` | New file, does not exist locally in this form |
| `x` | Cut — does not exist in installed instance |
| `?` | Pending decision |

---

## 1. Root Startup Files

These files define how the system boots. They are the spine.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
BOOT.md                            ~    BOOT.md
  canonical entrypoint                     REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

ROUTING.md                         ~    ROUTING.md
  lane selection + handoff rules           REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

CLAUDE.md                          =    CLAUDE.md
  compatibility shim only                  identical copy
  points to BOOT.md                        no changes needed

STRUCTURE.md                       =    STRUCTURE.md
  structure guide                          identical copy
  verified zero Viktor references          no changes needed

memory.md                          +    memory.md
  Viktor's cross-session truths            FRESH: empty starter seeded from
  Dubai timezone, Eterno, projects         onboarding (owner_name, primary_role,
  operator hierarchy references            business_context)
  NONE of this transfers                   zero Viktor history

recent-context.md                  +    recent-context.md
  live session state, blockers             FRESH: install-state-only starter
  initiative progress, dates               "system installed [date], runtimes
  NONE of this transfers                   selected: [list]"
                                           zero Viktor context
```

**Summary: 6 root files. 1 copy, 3 rewrite, 2 fresh.**

---

## 2. Operator Directory — `operator/`

The operator layer defines agent behavior. This is the core engine.

### 2a. Operator Doctrine (reusable mechanics)

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
operator/context-loading-rules.md  ~    operator/context-loading-rules.md
  load-class taxonomy                      REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

operator/context-placement-rules.md ~   operator/context-placement-rules.md
  where to write context                   REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

operator/closeout-rules.md         ~    operator/closeout-rules.md
  completion logging rules                 REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

operator/delegation-contract.md    ~    operator/delegation-contract.md
  sub-agent boundaries                     REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

operator/model-policy.md           ~    operator/model-policy.md
  model assignment by lane                 REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

operator/capabilities.md           =    operator/capabilities.md
  capability truth-telling rules           identical copy
  verified zero Viktor references          no changes needed

operator/clarification-protocol.md ~    operator/clarification-protocol.md
  operator mechanic                        REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout
```

**7 files. 6 rewrite-template, 1 copy-core (capabilities.md only).**

### 2b. Operator Doctrine (needs light rewrite)

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
operator/agent-role.md             ~    operator/agent-role.md
  proactive behavior, autonomy             REWRITE: replace "Viktor" with
  boundaries, escalation rules             {owner_name} in approval references
  minimal Viktor refs                      mechanics preserved

operator/working-style.md          ~    operator/working-style.md
  communication discipline                 REWRITE: "Viktor's voice" becomes
  voice preservation rules                 "{owner_name}'s voice"
  tone, directness, filtering              swap owner name + tone_profile from
  mentions Viktor's voice                  onboarding

operator/decision-principles.md    ~    operator/decision-principles.md
  tradeoff resolution rules                REWRITE: "Viktor's decision
  attention protection                     authority" becomes "{owner_name}'s
  minimal Viktor references                decision authority"

operator/context-loading-rules.md       (already listed above as copy-core —
                                         the agent report said NO Viktor refs)

operator/closeout-rules.md              (already listed above as copy-core)
```

**3 files. All rewrite-template. Same structure, owner name swapped.**

### 2c. Operator Role Files (agent identities)

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
operator/anton.md                  ~    operator/anton.md
  technical direction role                 REWRITE: role dynamics preserved
  NO Viktor refs in current file           swap any future owner refs
  Opus model posture                       same lane boundaries

operator/claudia.md                ~    operator/claudia.md
  COO / execution manager                 REWRITE: "Viktor's operational
  references "Viktor's" inbox              inbox" becomes "{owner_name}'s
  manages reminders for Viktor             operational inbox"
  Opus for oversight, Sonnet sub           same delegation model

operator/jonah.md                  ~    operator/jonah.md
  VP Engineering / delivery                REWRITE: "Viktor confirmed"
  one Viktor reference (approval)          becomes "{owner_name} confirmed"
  Opus primary, Sonnet sub                 same verification mandate

operator/vera.md                   ~    operator/vera.md
  Head of Design                           REWRITE: "Viktor Design
  "Viktor Design Preferences" section      Preferences" becomes "{owner_name}
  specific aesthetic taste listed           Design Preferences"
  Opus primary, Sonnet sub                 aesthetic prefs from onboarding

operator/lev.md                    ~    operator/lev.md
  CSO / strategic reasoning                REWRITE: "Viktor's judgment"
  multiple Viktor decision refs            becomes "{owner_name}'s judgment"
  counsel mode, challenge function         same reasoning methodology
```

**5 files. All rewrite-template. Role mechanics preserved, owner identity swapped.**

### 2d. Operator Context Files (Viktor-specific content)

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
operator/identity.md               +    operator/identity.md
  Viktor's role, responsibilities          FRESH: generated from onboarding
  exhibitions, Eterno, Vhils Studio        (owner_name, primary_role, timezone,
  time allocation, failure modes           tone_profile, business_context,
  NONE of this transfers                   priority_modes)

operator/reminders.md              +    operator/reminders.md
  Viktor's 3 open reminders                FRESH: empty starter
  Eterno Drive, Phase 4, Newsletter        "{owner_name} has no active
  NONE of this transfers                   reminders yet."

operator/claudia-memory.md         +    operator/claudia-memory.md
  Viktor's email voice                     FRESH: empty starter
  exhibition workflow specifics            "No operational memory accumulated
  Basecamp conventions, tools              yet."
  NONE of this transfers

operator/CLAUDE.md                 ~    operator/CLAUDE.md
  routing shim for operator/               REWRITE: if it references Viktor,
  (may be empty or minimal)                swap; if pure routing, copy
```

**4 files. 3 fresh, 1 rewrite.**

### Operator Directory Total: 19 files

| Treatment | Count |
|-----------|-------|
| Copy-core (identical) | 1 |
| Rewrite-template | 15 |
| Generate-fresh | 3 |
| Exclude | 0 |

---

## 3. Templates Directory — `templates/`

Reusable project and handoff starters. Almost entirely copy-core.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
templates/README.md                =    templates/README.md
                                           identical copy

templates/active-project/CLAUDE.md ~    templates/active-project/CLAUDE.md
  mentions "Viktor approves"               REWRITE: "{owner_name} approves"

templates/active-project/summary.md =   templates/active-project/summary.md
  pure template with placeholders          identical copy

templates/active-project/decisions.md = templates/active-project/decisions.md
                                           identical copy

templates/active-project/open-questions.md = templates/active-project/open-questions.md
                                           identical copy

templates/active-project/references.md = templates/active-project/references.md
                                           identical copy

templates/active-project/session-log.md = templates/active-project/session-log.md
                                           identical copy

templates/intake-project/CLAUDE.md =    templates/intake-project/CLAUDE.md
  verified zero Viktor references          identical copy
  no owner references found                no changes needed

templates/intake-project/summary.md =   templates/intake-project/summary.md
                                           identical copy

templates/intake-project/decisions.md = templates/intake-project/decisions.md
                                           identical copy

templates/intake-project/open-questions.md = templates/intake-project/open-questions.md
                                           identical copy

templates/intake-project/references.md = templates/intake-project/references.md
                                           identical copy

templates/intake-project/setup-status.md = templates/intake-project/setup-status.md
                                           identical copy

templates/operator-handoff.md      ~    templates/operator-handoff.md
  mentions "Viktor approval"               REWRITE: "{owner_name} approval"

templates/project-recipe.md        =    templates/project-recipe.md
                                           identical copy

templates/new-repo-technical-      =    templates/new-repo-technical-
  checklist.md                               checklist.md
  verified zero Viktor references          identical copy
  operator names are system roles          Verified zero Viktor references.

templates/new-repo-technical-      ~    templates/new-repo-technical-
  onboarding.md                              onboarding.md
  mentions operators by name               same treatment as above
```

### Templates Total: 17 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 14 |
| Rewrite-template | 3 |
| Exclude | 0 |

---

## 4. Domains Directory — `domains/`

Shared domain knowledge. Mostly reusable, one major problem file.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
domains/CLAUDE.md                  ~    domains/CLAUDE.md
  domain organization routing              REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

domains/exhibitions/CLAUDE.md      =    domains/exhibitions/CLAUDE.md
  exhibition routing logic                 identical copy
  no owner references                      no changes needed

domains/exhibitions/glossary.md    =    domains/exhibitions/glossary.md
  8 core exhibition terms                  identical copy
  no owner references                      generic vocabulary

domains/exhibitions/rules.md       x    (DOES NOT SHIP)
  41+ SOP steps                            EXCLUDE
  Viktor name, Eterno Gallery              exclusion_type: owner_specific_residue
  Google Drive IDs                         LOCKED DECISION in manifest spec
  team member names (Sara, Goncalo,        This file is cleanup debt.
    Ana Amancio, Filomena)                 Must be split before any reusable
  production calendar IDs                  exhibition doctrine ships.
  Primavera ERP details
  internal document links
```

### Domains Total: 4 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 2 |
| Rewrite-template | 1 |
| Exclude | 1 |

**Note:** `domains/exhibitions/rules.md` is the single largest contaminated file.
It contains reusable exhibition workflow patterns mixed with Viktor/Eterno
operational residue. The locked decision requires splitting it before any
reusable portion can ship.

---

## 5. Project Types Directory — `project-types/`

Reusable lifecycle doctrine. Almost entirely clean.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
project-types/CLAUDE.md            =    project-types/CLAUDE.md
  routing guidance                         identical copy

project-types/exhibition/CLAUDE.md =    project-types/exhibition/CLAUDE.md
  exhibition routing framework             identical copy

project-types/exhibition/          =    project-types/exhibition/
  approval-rules.md                          approval-rules.md
  4 approval gates                         identical copy
  no owner references                      generic gate system

project-types/exhibition/          =    project-types/exhibition/
  lifecycle.md                               lifecycle.md
  9 canonical stages                       identical copy
  no owner references                      generic lifecycle

project-types/intake-decision-     ~    project-types/intake-decision-
  tree.md                                    tree.md
  5 core asset evaluation                  REWRITE: references Viktor and
  generic framework                        Claudia in approval semantics
  BUT names Viktor and Claudia             LOCKED DECISION in manifest spec
```

### Project Types Total: 5 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 4 |
| Rewrite-template | 1 |

---

## 6. Brands Directory — `brands/`

Brand wrapper mechanics + Eterno brand pack.

### 6a. Brand System Mechanics (reusable)

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
brands/session-wrapper.md          ~    brands/session-wrapper.md
  9-step brand activation sequence         REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

brands/runtime.md                  =    brands/runtime.md
  points to session-wrapper                identical copy

brands/operators/atlas.md          =    brands/operators/atlas.md
  brand strategy operator                  identical copy
  no owner references                      generic role definition

brands/operators/helena.md         =    brands/operators/helena.md
  brand writing operator                   identical copy
  no owner references                      generic role definition

brands/registry.md                 +    brands/registry.md
  currently lists only Eterno              FRESH: empty or starter registry
  with aliases                             new user's brand(s) if any
                                           Eterno entries removed
```

### 6b. Eterno Brand Pack (Viktor's brand — does not ship by default)

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
brands/eterno/README.md            x    (DOES NOT SHIP)
brands/eterno/registry.md         x    (DOES NOT SHIP)
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  approved-pack.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  channels/instagram.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  channels/x.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  identity.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  metrics.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  open-questions.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  tensions.md
brands/eterno/doctrine/            x    (DOES NOT SHIP)
  voice.md

  Entire brands/eterno/ tree              EXCLUDE by default
  is Viktor's live brand content.          exclusion_type: owner_specific_residue
  Eterno Gallery strategy, voice,          Could optionally ship as "sample
  metrics, X handle, Instagram             content" if explicitly chosen,
  insights — all owner-specific.           but default = exclude.

brands/eterno/corpus/              x    (DOES NOT SHIP)
  3 analysis files                         EXCLUDE: live brand research
brands/eterno/sources/             x    (DOES NOT SHIP)
  x/ (tweet batches, raw JSON)             EXCLUDE: live brand source data
  instagram/ (insights screenshots)        EXCLUDE: live brand source data
  internal/ (strategy source map)          EXCLUDE: live brand research
```

### Brands Total: 19 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 3 |
| Rewrite-template | 1 |
| Generate-fresh | 1 |
| Exclude (Eterno pack) | 14 |

---

## 7. Projects Directory — `projects/`

All projects are Viktor's live work. None transfer.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
projects/CLAUDE.md                 ~    projects/CLAUDE.md
  project routing rules                    REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

projects/README.md                 =    projects/README.md
  structural governance                    identical copy

── Viktor's Live Projects ──────────    ── Empty / Starter ─────────────────

projects/0009eth-2026/             x    (DOES NOT SHIP)
  CLAUDE.md, decisions.md,                 EXCLUDE: Viktor's active project
  open-questions.md, references.md,
  session-log.md, summary.md
  (6 files)

projects/lucas-zanotto-2026/       x    (DOES NOT SHIP)
  CLAUDE.md, decisions.md,                 EXCLUDE: Viktor's active project
  open-questions.md, references.md,
  session-log.md, summary.md
  (6 files)

projects/punks-2026/               x    (DOES NOT SHIP)
  decisions.md, open-questions.md,         EXCLUDE: Viktor's active project
  references.md, session-log.md,
  summary.md, calls/ (5 call notes)
  (10 files)

projects/eterno-strategy-2026/     x    (DOES NOT SHIP)
  decisions.md, open-questions.md,         EXCLUDE: Viktor's active project
  session-log.md, summary.md,
  art-tech-platforms-research.md,
  partnerships-and-bookstore-gap-
    research-2026-04-02.md,
  upstairs-identity-proposal-v1.md,
  data/x_analytics_eterno_2025-2026.csv
  (8 files)

projects/exhibitiq-2026/           x    (DOES NOT SHIP)
  decisions.md, open-questions.md,         EXCLUDE: Viktor's active project
  references.md, session-log.md,
  summary.md
  (5 files)

projects/vhils-x-ledger/          x    (DOES NOT SHIP)
  decisions.md, open-questions.md,         EXCLUDE: Viktor's active project
  references.md, session-log.md,
  summary.md
  (5 files)

projects/nfc-boldtron/             x    (DOES NOT SHIP)
  session-log.md                           EXCLUDE: Viktor's active project
  (1 file)

── Test Projects ───────────────────    ────────────────────────────────────

projects/test-exhibition-001/      x    (DOES NOT SHIP)
projects/test-exhibition-002/      x    EXCLUDE: test residue
projects/test-proj-history/        x
projects/test-proj-idempotent/     x
projects/test-proj-mark/           x
projects/test-proj-no-template/    x
projects/test-proj-nodeletion/     x
projects/test-proj-overridden/     x
projects/test-proj-registry/       x
  (9 summary.md files total)
```

**What replaces this in a clean instance:**

```
                                         INSTALLED
                                         ─────────────────────────────────────
                                    +    projects/
                                           FRESH: empty directory
                                           or optional starter project scaffold
                                           from onboarding (project_categories)
                                           zero Viktor project content
```

### Projects Total: ~51 files + 1 CSV

| Treatment | Count |
|-----------|-------|
| Copy-core (structural) | 1 |
| Rewrite-template | 1 |
| Exclude (Viktor projects) | ~49 |
| Exclude (test residue) | 9 |
| Generate-fresh (starter scaffolds) | optional |

---

## 8. Intake Directory — `intake/`

Projects not yet in active execution. Viktor-specific.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
intake/CLAUDE.md                   ~    intake/CLAUDE.md
  routing rules for intake                 REWRITE: Viktor references found
  Viktor references present                swap {owner_name} throughout

intake/atelier-sora-milan-2026/    x    (DOES NOT SHIP)
  CLAUDE.md, decisions.md,                 EXCLUDE: Viktor's intake project
  open-questions.md, references.md,
  setup-status.md, summary.md
  (6 files)
```

### Intake Total: 7 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 0 |
| Rewrite-template | 1 |
| Exclude | 6 |

---

## 9. Handoffs Directory — `handoffs/`

Cross-operator handoff artifacts. All Viktor-specific content.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
handoffs/README.md                 =    handoffs/README.md
  structural governance                    identical copy

handoffs/anton-to-claudia-         x    (DOES NOT SHIP)
  phase5-investigation.md                  EXCLUDE: Viktor session artifact
handoffs/anton-to-jonah-           x    (DOES NOT SHIP)
  project-identity-cleanup.md              EXCLUDE: Viktor session artifact
handoffs/claudia-to-jonah-         x    (DOES NOT SHIP)
  linking-fixes.md                         EXCLUDE: Viktor session artifact
```

### Handoffs Total: 4 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 1 |
| Exclude | 3 |

---

## 10. Apps Directory — `apps/`

Product context and archives. Two sub-trees: Memento and Sera.

### 10a. Memento App Context

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
apps/README.md                     =    apps/README.md
  structural governance                    identical copy

apps/memento/editorial-pass.md     x    (DOES NOT SHIP)
  Claudia workflow, Google Sheet IDs       EXCLUDE: owner_specific_residue
  Viktor's Memento pipeline specifics      pipeline config is in Memento repo

── Memento Archive (plan-archive/) ──   ────────────────────────────────────
apps/memento/archive/plan-archive/
  anton-email-triage-decisions.md  x    EXCLUDE: historical work residue
  basecamp-sync-rewrite-anton.md   x    EXCLUDE
  handoff-email-triage-to-anton.md x    EXCLUDE
  handoff-email-triage-to-claudia.md x  EXCLUDE
  memento-technical-plan.md        x    EXCLUDE
  phase-1-handoff-jonah.md         x    EXCLUDE
  phase-2-corrections-and-phase-3-
    handoff-jonah.md               x    EXCLUDE
  phase-2-handoff-jonah.md         x    EXCLUDE
  phase-3-handoff-jonah.md         x    EXCLUDE
  phase-4-anton-data-inventory.md  x    EXCLUDE
  phase-4-claudia-editorial-step.md x   EXCLUDE
  phase-4-data-inventory.md        x    EXCLUDE
  phase-4-today-snapshot.md        x    EXCLUDE
  phase-4-vera-design-brief.md     x    EXCLUDE
  phase-5-handoff-jonah.md         x    EXCLUDE
  phase-5-restart-anton.md         x    EXCLUDE
  rapt-recommendation.md           x    EXCLUDE
  task-5-shared-sources-proposal.md x   EXCLUDE
  (18 files)

── Memento Archive (proposals/) ────    ────────────────────────────────────
apps/memento/archive/proposals/
  a.md, c.md, j.md, l.md          x    EXCLUDE: historical work residue
  brainstorm/anton_brainstorm.md   x    EXCLUDE
  brainstorm/claudia.md            x    EXCLUDE
  brainstorm/jonah.md              x    EXCLUDE
  brainstorm/lev.md                x    EXCLUDE
  (8 .md files)

── Memento Archive (HTML files) ────    ────────────────────────────────────
  brainstorm/*.html (4 files)      x    EXCLUDE
  brainstorm/synthesis/*.html (4)  x    EXCLUDE
  proposals/memento_brainstorm.html x   EXCLUDE
  (9 .html files)

── Dashboard Prototypes (HTML) ─────    ────────────────────────────────────
apps/memento/archive/
  dashboard-prototypes/
  01-newspaper-cascade.html        x    EXCLUDE
  02-dark-signal.html              x    EXCLUDE
  ... through ...
  20-broadsheet.html               x    EXCLUDE
  (20 .html files)

── UX Reference Images ────────────    ────────────────────────────────────
apps/memento/archive/
  refs-ux-designing/
  pinterest_*.jpg (16 files)       x    EXCLUDE
  pinterest_*.png (9 files)        x    EXCLUDE
  (25 image files)
```

### 10b. Sera App Context

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
apps/sera/personal-operator-       x    (DOES NOT SHIP)
  app-overview.md                          EXCLUDE: product concept doc
apps/sera/product-framing.md       x    EXCLUDE
apps/sera/setup-model.md           x    EXCLUDE
apps/sera/summary.md               x    EXCLUDE
apps/sera/decisions.md             x    EXCLUDE
apps/sera/open-questions.md        x    EXCLUDE
apps/sera/agents/anton.md          x    EXCLUDE
apps/sera/agents/claudia.md        x    EXCLUDE
apps/sera/agents/joana.md          x    EXCLUDE
apps/sera/pilot-users/             x    EXCLUDE
  alexandre.md
apps/sera/pilot-users/             x    EXCLUDE
  alexandre-interview-brief.md
  (11 files)
```

### Apps Total: ~92 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 1 |
| Exclude (plan archives) | 26 md + 9 html |
| Exclude (dashboard prototypes) | 20 html |
| Exclude (UX refs) | 25 images |
| Exclude (Sera) | 11 |
| Exclude (editorial-pass) | 1 |

---

## 11. Audits Directory — `audits/`

Historical validation material. All Viktor-specific.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
audits/README.md                   =    audits/README.md
  structural governance                    identical copy

audits/2026-03-28/
  anton-routing-audit.md           x    EXCLUDE: historical audit
  claudia-routing-audit.md         x    EXCLUDE
  global-issues.md                 x    EXCLUDE
  jonah-routing-audit.md           x    EXCLUDE
  lev-routing-audit.md             x    EXCLUDE
  resolution-plan.md               x    EXCLUDE
  resolution-plan.html             x    EXCLUDE
  vik-os-routing-reference.html    x    EXCLUDE
  (8 files)
```

### Audits Total: 9 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 1 |
| Exclude | 8 |

---

## 12. Initiatives Directory — `initiatives/`

Deep system-building context. Two sub-initiatives.

### 12a. Operator Routing and Handoffs Initiative

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
initiatives/operator-routing-and-handoffs/
  contract-spec-anton.md           x    EXCLUDE: historical initiative work
  decisions.md                     x    EXCLUDE
  open-questions.md                x    EXCLUDE
  phase-3-architecture-anton.md    x    EXCLUDE
  review-anton.md                  x    EXCLUDE
  runtime-self-check.md            x    EXCLUDE (reference-only per RC)
  runtime-smoke-tests.md           x    EXCLUDE
  session-log.md                   x    EXCLUDE
  summary.md                       x    EXCLUDE
  boot-manifest.json               x    EXCLUDE
  (10 files)
```

### 12b. Operator System Initiative

This is where the installer doctrine lives. Key question: which of these
ship in the clean instance?

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────

── Authority Documents ─────────────    ── RESOLVED DECISIONS ──────────────

initiatives/operator-system/
  system-instantiation-contract.md x    EXCLUDE: build-time design doc
    THE canonical contract for               does not ship
    creating new instances                   exclusion_type: build_time_only_
                                               internal_design_doc

  system-instantiation-generated-  x    EXCLUDE: build-time design doc
    file-matrix.md                           does not ship
    maps onboarding inputs to                exclusion_type: build_time_only_
    generated files                            internal_design_doc

  system-instantiation-onboarding- x    EXCLUDE: build-time design doc
    schema.md                                does not ship
    defines what onboarding asks             exclusion_type: build_time_only_
                                               internal_design_doc

  installer-target-replication-    x    EXCLUDE: build-time design doc
    contract.md                              does not ship
    narrow infrastructure sublayer           exclusion_type: build_time_only_
                                               internal_design_doc

  runtime-bridges.md               =    COPY-CORE: required authority
    bridge principle and current             ships in clean instance
    bridge list                              tells users how bridges work
                                             exclusion_type: required_authority
                                               ship_in_clean_instance

  installer-v1-manifest-spec.md    x    EXCLUDE: build-time design doc
    the manifest schema itself               does not ship
                                             exclusion_type: build_time_only_
                                               internal_design_doc

  installer-v1-full-comparison.md  x    EXCLUDE: build-time reference only
    (this file)                              does not ship

── Initiative Working Files ────────    ────────────────────────────────────

  summary.md                       x    EXCLUDE: initiative summary
  session-log.md                   x    EXCLUDE: Viktor's session decisions
  open-questions.md                x    EXCLUDE: initiative working state
  handoff-rules.md                 x    EXCLUDE: archive support file
    explicit handoff rules                   not needed in clean instance
    no owner references                      duplicated by ROUTING.md and
                                             operator doctrine
  routing-model.md                 x    EXCLUDE: archive support file
    boot sequence rule                       not needed in clean instance
    no owner references                      superseded by BOOT.md and
                                             ROUTING.md

  team-map.md                      x    EXCLUDE: lists Viktor's team
  validation.md                    x    EXCLUDE: smoke test results
  project-identity-rule.md         x    EXCLUDE: Viktor-specific cleanup log
  system-instantiation-vocabulary.md x  EXCLUDE: vocabulary decision doc

── Operator Sub-files ──────────────    ────────────────────────────────────
  operators/anton.md               x    EXCLUDE: initiative-level operator
  operators/atlas.md               x      detail, not runtime operator files
  operators/claudia.md             x      (the runtime versions are in
  operators/helena.md              x      operator/ at root level)
  operators/jonah.md               x
  operators/lev.md                 x
  operators/vera.md                x
  (7 files)
```

### 12c. Internal Drive Migration Initiative

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
initiatives/internal-drive-
  migration/plan.md                x    EXCLUDE: Viktor's migration plan
```

### Initiatives Total: ~28 files

| Treatment | Count |
|-----------|-------|
| Copy-core | 1 |
| Exclude | ~27 |

---

## 13. Non-Markdown Files

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
.DS_Store                          x    EXCLUDE: macOS residue
audits/.DS_Store                   x    EXCLUDE: macOS residue
projects/.DS_Store                 x    EXCLUDE: macOS residue

initiatives/operator-routing-and-
  handoffs/boot-manifest.json      x    EXCLUDE: initiative artifact

brands/eterno/sources/x/artifacts/
  *.raw.json                       x    EXCLUDE: brand source data

projects/eterno-strategy-2026/
  data/*.csv                       x    EXCLUDE: project data

apps/memento/archive/
  dashboard-prototypes/*.html      x    EXCLUDE: 20 prototype files
  proposals/brainstorm/*.html      x    EXCLUDE: 4 brainstorm files
  proposals/brainstorm/
    synthesis/*.html               x    EXCLUDE: 4 synthesis files
  proposals/*.html                 x    EXCLUDE: 1 brainstorm file
  refs-ux-designing/*.jpg          x    EXCLUDE: 16 reference images
  refs-ux-designing/*.png          x    EXCLUDE: 9 reference images

audits/2026-03-28/*.html           x    EXCLUDE: 2 audit artifacts
```

---

## 14. Runtime Bridge Files (outside VIK_OS)

These live in the user's home directory, not in VIK_OS.

```
LOCAL (Viktor's machine)                 INSTALLED (new user's machine)
─────────────────────────────────────    ─────────────────────────────────────
~/.claude/CLAUDE.md                ~    ~/.claude/CLAUDE.md
  points to Viktor's vault path          REWRITE: point to {vault_location}
  names Viktor, VIK OS                   swap {owner_name}, {system_name}

~/.codex/instructions.md           ~    ~/.codex/instructions.md
  points to Viktor's vault path          REWRITE: point to {vault_location}
  (only if Codex selected)

~/.gemini/GEMINI.md                ~    ~/.gemini/GEMINI.md
  points to Viktor's vault path          REWRITE: point to {vault_location}
  (only if Gemini selected)

~/.openclaw/workspace/             ~    ~/.openclaw/workspace/
  START_HERE.md                            START_HERE.md
  points to Viktor's vault path          REWRITE: point to {vault_location}
  (only if OpenClaw selected)

~/.openclaw/workspace/             ~    ~/.openclaw/workspace/
  AGENTS.md                                AGENTS.md
  startup instructions                   REWRITE: {owner_name}, {timezone},
  Viktor's timezone and paths              {vault_location}
  (only if OpenClaw selected)
```

### Runtime Config Files

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────
~/.codex/config.toml               +    FRESH: target-local config
  Viktor's project allowlists              {workspace_root} paths only
  absolute /Users/viktorsl/ paths          no Viktor allowlists

~/.codex/auth.json                 x    DEFER: prompt user
~/.codex/history.jsonl             x    EXCLUDE: runtime residue
~/.codex/sqlite state              x    EXCLUDE: runtime residue

~/.gemini/projects.json            +    FRESH: target-local project list
~/.gemini/trustedFolders.json      +    FRESH: target-local trusted folders
~/.gemini/settings.json            +    FRESH: safe starter settings
~/.gemini/oauth_creds.json         x    DEFER: prompt user
~/.gemini/google_accounts.json     x    DEFER: prompt user
~/.gemini/installation_id          x    EXCLUDE: machine identity
~/.gemini/state.json               x    EXCLUDE: runtime state
~/.gemini/antigravity-browser-     x    EXCLUDE: browser residue
  profile/

~/.openclaw/openclaw.json          +    FRESH: safe starter config
  Viktor's secrets, device state           no tokens, no device identity
~/.openclaw/credentials/*          x    DEFER: prompt user
~/.openclaw/identity/*             x    EXCLUDE: machine identity
~/.openclaw/devices/*              x    EXCLUDE: pairing state
~/.openclaw/telegram/*             x    EXCLUDE: channel state
~/.openclaw/logs/*                 x    EXCLUDE: runtime residue

~/.claude/ caches, backups         x    EXCLUDE: runtime residue
```

---

## 15. Memento Substrate (outside VIK_OS)

The Memento repo at `~/VIK/Coding/Memento/`.

```
LOCAL                                    INSTALLED
─────────────────────────────────────    ─────────────────────────────────────

── Owner-Neutral Code ──────────────    ────────────────────────────────────
Source code (sync engines,         =    COPY: owner-neutral substrate code
  derivation logic, pipeline               preserves system behavior
  orchestration, dashboard)

Contracts and docs that define     =    COPY: if owner-neutral and
  substrate behavior                       path-neutral

── Path-Bearing Config ─────────────    ────────────────────────────────────
Config files with                  ~    REWRITE: swap all paths to
  /Users/viktorsl/ paths                   {home_root}, {workspace_root},
  vault references                         {vault_location}
  owner-facing startup text

── Runtime State ───────────────────    ────────────────────────────────────
state/captures/*                   x    EXCLUDE: Viktor's captured data
state/derived/*                    x    EXCLUDE: Viktor's derived outputs
state/store/*                      x    EXCLUDE: Viktor's project stores
state/logs/*                       x    EXCLUDE: runtime logs
state/runtime/*                    x    EXCLUDE: runtime state
state/sync_log/*                   x    EXCLUDE: sync timestamps

plan/*                             x    EXCLUDE: implementation plans
                                           are build-time reference only
```

---

## GRAND SUMMARY

### Total File Count in VIK_OS Today

| Category | File Count |
|----------|-----------|
| Root startup files | 6 |
| Operator files | 19 |
| Templates | 17 |
| Domains | 4 |
| Project Types | 5 |
| Brands (system) | 5 |
| Brands (Eterno pack) | 14 |
| Projects (structural) | 2 |
| Projects (Viktor's live) | ~49 |
| Intake | 7 |
| Handoffs | 4 |
| Apps (Memento + Sera) | ~92 |
| Audits | 9 |
| Initiatives | ~28 |
| Non-md assets | ~60 |
| **TOTAL** | **~321 files** |

### Treatment Breakdown

```
TREATMENT                          COUNT    % OF TOTAL
─────────────────────────────────  ─────    ──────────
COPY-CORE (ships identical)          31       11%
REWRITE-TEMPLATE (same shape,        30       10%
  owner identity swapped)
  (25 vault sources + 5 runtime
   bridge files)
GENERATE-FRESH (new from             12        4%
  onboarding, no Viktor content)
  (7 vault surfaces + 5 runtime
   configs)
EXCLUDE (does not ship)             219       75%
─────────────────────────────────  ─────    ──────────
TOTAL                               292      100%
─────────────────────────────────  ─────    ──────────
```

### Visual Ratio

```
What ships                          What gets cut
(~73 files, ~25%)                   (~219 files, ~75%)
████████░░░░░░░░░░░░░░░░░░░░░░░░   ████████████████████████████████

Of what ships:
  Copy-core:         ████████████████████████ 42%
  Rewrite-template:  ████████████████████████ 41%
  Generate-fresh:    ██████████ 16%
```

### What the Clean Instance Looks Like

```
NEW_SYSTEM/
├── BOOT.md                          [REWRITE]
├── ROUTING.md                       [REWRITE]
├── CLAUDE.md                        [COPY]
├── STRUCTURE.md                     [COPY]
├── memory.md                        [FRESH]
├── recent-context.md                [FRESH]
├── operator/
│   ├── identity.md                  [FRESH — canonical owner identity]
│   ├── anton.md                     [REWRITE]
│   ├── claudia.md                   [REWRITE]
│   ├── jonah.md                     [REWRITE]
│   ├── vera.md                      [REWRITE]
│   ├── lev.md                       [REWRITE]
│   ├── agent-role.md                [REWRITE]
│   ├── working-style.md             [REWRITE]
│   ├── decision-principles.md       [REWRITE]
│   ├── context-loading-rules.md     [REWRITE]
│   ├── context-placement-rules.md   [REWRITE]
│   ├── closeout-rules.md            [REWRITE]
│   ├── delegation-contract.md       [REWRITE]
│   ├── model-policy.md              [REWRITE]
│   ├── capabilities.md              [COPY]
│   ├── clarification-protocol.md    [REWRITE]
│   ├── reminders.md                 [FRESH]
│   ├── claudia-memory.md            [FRESH]
│   └── CLAUDE.md                    [REWRITE]
├── domains/
│   ├── CLAUDE.md                    [REWRITE]
│   └── exhibitions/
│       ├── CLAUDE.md                [COPY]
│       └── glossary.md              [COPY]
│       (rules.md does NOT exist here — cleanup debt)
├── project-types/
│   ├── CLAUDE.md                    [COPY]
│   ├── intake-decision-tree.md      [REWRITE]
│   └── exhibition/
│       ├── CLAUDE.md                [COPY]
│       ├── approval-rules.md        [COPY]
│       └── lifecycle.md             [COPY]
├── templates/
│   ├── README.md                    [COPY]
│   ├── active-project/              [COPY + 1 REWRITE]
│   ├── intake-project/              [COPY only — all copy-core]
│   ├── operator-handoff.md          [REWRITE]
│   ├── project-recipe.md            [COPY]
│   ├── new-repo-technical-checklist.md [COPY]
│   ├── new-repo-technical-onboarding.md [REWRITE]
├── brands/
│   ├── session-wrapper.md           [REWRITE]
│   ├── runtime.md                   [COPY]
│   ├── registry.md                  [FRESH — empty]
│   └── operators/
│       ├── atlas.md                 [COPY]
│       └── helena.md                [COPY]
│   (no eterno/ — excluded)
├── projects/
│   ├── CLAUDE.md                    [REWRITE]
│   ├── README.md                    [COPY]
│   └── (empty — or optional starter scaffolds)
├── intake/
│   ├── CLAUDE.md                    [REWRITE]
│   └── (empty)
├── handoffs/
│   ├── README.md                    [COPY]
│   └── (empty)
├── apps/
│   ├── README.md                    [COPY]
│   └── (empty — or memento substrate pointer)
├── audits/
│   ├── README.md                    [COPY]
│   └── (empty)
└── initiatives/
    ├── operator-system/
    │   └── runtime-bridges.md       [COPY]
    └── (all other initiative files excluded)
```

### What Gets Cut — Categorized

| Cut Category | Files | Why |
|---|---|---|
| Viktor's live projects | ~49 | owner_specific_residue |
| Viktor's intake projects | 6 | owner_specific_residue |
| Eterno brand pack | 14 | owner_specific_residue |
| Memento plan archives | 26 md | historical_work_residue |
| Memento proposal archives | 8 md + 9 html | historical_work_residue |
| Dashboard prototypes | 20 html | historical_work_residue |
| UX reference images | 25 images | historical_work_residue |
| Sera product docs | 11 | historical_work_residue |
| Audit artifacts | 8 | historical_work_residue |
| Routing initiative files | 10 | historical_work_residue |
| Operator system working files | ~12 | build_time_only / historical |
| Handoff artifacts | 3 | owner_specific_residue |
| Editorial pass doc | 1 | owner_specific_residue |
| Non-md residue (DS_Store etc) | 3 | system residue |
| **TOTAL CUT** | **~219** | |

### Resolved Decisions (6 files)

All authority documents have locked `installed_instance_role` decisions:

| File | Treatment | Locked Decision |
|---|---|---|
| system-instantiation-contract.md | EXCLUDE | `build_time_only_internal_design_doc` — does not ship |
| system-instantiation-generated-file-matrix.md | EXCLUDE | `build_time_only_internal_design_doc` — does not ship |
| system-instantiation-onboarding-schema.md | EXCLUDE | `build_time_only_internal_design_doc` — does not ship |
| installer-target-replication-contract.md | EXCLUDE | `build_time_only_internal_design_doc` — does not ship |
| runtime-bridges.md | COPY-CORE | `required_authority` — ships in clean instance, tells users how bridges work |
| installer-v1-manifest-spec.md | EXCLUDE | `build_time_only_internal_design_doc` — does not ship |

---

## Cleanup Debt Before Implementation

| Item | Status | Blocks |
|---|---|---|
| Split `domains/exhibitions/rules.md` into reusable doctrine vs. owner residue | NOT STARTED | Any reusable exhibition doctrine shipping |
| Audit `templates/active-project/CLAUDE.md` for "Viktor approves" phrasing | NOT STARTED | Template copy-core promotion |
| Audit `templates/operator-handoff.md` for same | NOT STARTED | Template copy-core promotion |
| Verify `operator/CLAUDE.md` contents | NOT STARTED | Operator directory classification |

**Resolved (no longer blocking):**

| Item | Resolution |
|---|---|
| Decide authority-file installed_instance_role for 6 files | RESOLVED — 5 excluded, runtime-bridges.md copy-core |
| Audit `templates/intake-project/CLAUDE.md` for Viktor refs | RESOLVED — verified zero Viktor references, classified copy-core |
| Resolve `handoff-rules.md` / `routing-model.md` ambiguity | RESOLVED — both classified exclude (archive support files, superseded by ROUTING.md and operator doctrine) |

### Manifest Scope Note (2026-04-04)

The manifest now tracks 292 surfaces: 281 VIK_OS vault files + 5 runtime bridge files + 6 runtime config files. Runtime surfaces live outside the vault (~/.claude/, ~/.codex/, ~/.gemini/, ~/.openclaw/) but are tracked in the manifest because the installer and onboarding pipelines produce them. The grand summary table above counts only VIK_OS on-disk files (~321).
