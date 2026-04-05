# Recent Context

Routing layer only. For full session details, read the project's `session-log.md`.

## Current system state

- Explicit operator invocation is now the locked startup rule.
- Atlas and Helena bootstrap stopped at the Eterno seed pack, and the next step is runtime contracts plus brand-pack loading behavior.
- The `0009eth-2026` identity cleanup is done.
- `vhils-x-ledger` and `mystery-box-vhils` are separate real projects.
- Closeout logging is now canonical through `operator/closeout-rules.md`.
- Context placement is now canonical through `operator/context-placement-rules.md`.
- `recent-context.md` is now startup-first, newest-first, and only for context a fresh operator still needs quickly.

## 2026-04-04

- **Installer v1 complete: all 4 steps shipped** (Jonah session): Step 2: live OAuth (gws CLI auth, Basecamp OAuth, partial auth, deferred reconnect). Step 3: e2e integration test (55 tests, second user Marcus, boot chain resolution, partial auth, reconnect readiness, manifest completeness). Fixed partial auth bug in pipeline_configurator. Step 4: install.js interactive CLI + QUICKSTART.md. All 139 tests pass. Anton's connector extensibility architecture decision persisted at `docs/connector-architecture-packet.md`. Next: connector extensibility refactor (manifest-driven adapters with split auth/sync surfaces). -> `initiatives/operator-system/session-log.md`

- **Slice 3 test crash fixed, Memento source wiring corrected** (Jonah session): Fixed `config_claude_settings` missing from manifest.js scaffold maps. Replaced hardcoded `../../pipeline` path in `pipeline_configurator.js` with explicit `mementoSourceRoot` parameter threaded through orchestrator and test. All slice 3 tests pass (43/43). Onboarding system audited: structurally complete, only gap is live OAuth in `account_connector.js`. Next step: implement live OAuth flow (step 2 of 4). -> `initiatives/operator-system/session-log.md`

- **Boot enforcement added globally and to installer** (Jonah session): Added UserPromptSubmit hook to global settings.json and strengthened CLAUDE.md to mechanically enforce boot sequence before every response. Created Claude settings.json template for new user installs. Updated path resolver, manifest (now 282 surfaces), and bridge template. -> `initiatives/operator-system/session-log.md`

- **Installer code moved from Memento to Operator-Installer** (Jonah session): Moved all `instantiation/` code (44 files — installer, onboarding, templates, shared modules, manifests, tests) and stray `pipeline_config.js` from Memento into the Operator-Installer repo. Memento is clean again. Stale plan replaced with current 9-step roadmap reflecting frozen doctrine and existing implementation. Repo at `~/VIK/Coding/operator-os`, GitHub: `viktorsolost/operator-os` (private).

- **Operator-Installer repo created and pushed** (Jonah session): Audited README against live vault, expanded all operator descriptions to match actual system files (titles, delegation, verification, methodology), added truth model, model policy, cross-runtime handoff protocol, and pipeline detail. Repo initialized at `~/VIK/Coding/operator-os`, pushed to `viktorsolost/operator-os` (private).

- **Installer v1 manifest audit completed and verified** (Anton session): 3 independent agents ran the 5-check audit, results cross-compared and independently verified. Check 4 passed. Checks 1, 2, 3, 5 failed. 12 copy-core files must be reclassified to rewrite-template (Viktor refs verified with line numbers), 2 rewrite-template files must become copy-core (verified zero owner refs), 8 glob rows must be expanded to per-file rows, 2 missing files must be added, header counts must be fixed, comparison doc must be updated. Verified 7-step remediation plan logged. **Jonah's next job: execute the remediation plan at `initiatives/operator-system/session-log.md` (2026-04-04 entry).** All judgment calls are resolved, execution is mechanical.

## 2026-04-03

- **Instantiation freeze-safety tightening completed** (Jonah session): Locked installer as reusable-core plus scaffold placement only, locked onboarding as the sole generator of Layer B and Layer C, tightened Memento to file-level bucket rules, re-bucketed owner-bound operator files beyond `agent-role.md`, removed duplicate runtime enablement fields, and aligned the top contract, replication contract, matrix, and onboarding schema for freeze-safe implementation. -> `initiatives/operator-system/session-log.md`

- **Instantiation doctrine tightened after Anton review** (Jonah session): Demoted `installer-target-replication-contract.md` to a sublayer, made `system-instantiation-contract.md` the top authority, locked `operator/identity.md` as the canonical generated owner-identity file, reclassified `STRUCTURE.md` and `operator/agent-role.md`, and removed the `memory.md` / `recent-context.md` contradiction. -> `initiatives/operator-system/session-log.md`

- **Instantiation generated-file matrix defined** (Jonah session): Created `initiatives/operator-system/system-instantiation-generated-file-matrix.md` to map onboarding inputs to exact file outputs and treatment modes across core, template-rewrite, fresh generation, deferred auth, and excluded Viktor residue. -> `initiatives/operator-system/session-log.md`

- **Instantiation onboarding schema defined** (Jonah session): Created `initiatives/operator-system/system-instantiation-onboarding-schema.md` to define the exact onboarding questions, generated outputs, runtime-specific setup fields, and validation rules for a new-user instance. -> `initiatives/operator-system/session-log.md`

- **New-user instantiation contract defined** (Jonah session): Created `initiatives/operator-system/system-instantiation-contract.md` to lock the three-layer model: reusable core, template-and-rewrite, and user-generated owner context. Memento is included as substrate, while onboarding now owns identity replacement and fresh personal-context generation. -> `initiatives/operator-system/session-log.md`

- **Instantiation replaces replication-first framing** (Jonah session): Created `initiatives/operator-system/system-instantiation-vocabulary.md` and locked `instantiation` as the top-level goal for new-user deployment. `Replication` is now only the narrow infrastructure layer under a broader personalization and onboarding flow. -> `initiatives/operator-system/session-log.md`

- **Installer-target replication contract defined** (Jonah session): Created `initiatives/operator-system/installer-target-replication-contract.md` as the one canonical installer-facing replication doctrine. Classified bridge files, runtime configs, auth boundaries, fresh-install validation, and hidden machine-local assumptions so installer work can begin without relying on Viktor-specific runtime residue. -> `initiatives/operator-system/session-log.md`

- **Agent-system tightening shipped** (Jonah session): Tightened canonical boot so the loading contract is explicit, kept shared behavior truthfully task-conditional, created one canonical delegation contract for sub-agent use, and removed the Atlas/Helena wrapper ambiguity about forced fallback lane selection. Runtime conformance remains core-checked in BOOT and deeper validation stays initiative-local. -> `initiatives/operator-routing-and-handoffs/session-log.md`

- **Atlas/Helena runtime proof pass** (Jonah session): Live-tested Codex and OpenClaw from outside the repo and confirmed the current vault boot pattern plus explicit-invocation wrapper behavior. Confirmed Gemini's global bridge file matches doctrine, but its live smoke test is still pending interactive auth. Removed the stale untracked Atlas/Helena implementation brief after confirming it no longer had an active job. -> `initiatives/operator-routing-and-handoffs/session-log.md`

- **Startup-context trim, preserve-first** (Jonah session): Moved exhibition doctrine, Vera design preferences, and Claudia-only recurring notes out of `memory.md` into smaller canonical destinations. Strengthened `projects/README.md` so `test-*` folders are explicitly excluded from live project context by humans, audits, and loaders. Left `recent-context.md` open items and blockers unchanged until a safer landing zone is explicit. -> `initiatives/operator-routing-and-handoffs/session-log.md`

- **Authority-check drift correction** (Jonah session): Updated the live validator layer and structural manifest so runtime checks now match the actual boot chain and runtime posture. Added Vera to the manifest and represented Atlas/Helena as explicit-invocation wrapper files instead of silent lane drift. Left runtime capability, startup bridges, fixture paths, and startup-context relocation unchanged in this slice. -> `initiatives/operator-routing-and-handoffs/session-log.md`

- **Project identity cleanup + startup logging** (Jonah session): Loaded Anton's canonical project identity rule and completed the live cleanup handoff. Renamed vault project folder `0009.eth-2026` -> `0009eth-2026` to match the Memento registry and updated local frontmatter. Confirmed `vhils-x-ledger` and `mystery-box-vhils` are separate real projects. Added canonical closeout and context-placement rules so finished work gets logged to the right place and stored in the right layer. -> `initiatives/operator-system/session-log.md`, `memory.md`

- **Operator system routing lock** (system session): Explicit operator invocation was locked as the hard startup rule across VIK OS. Named operators now win over task-shape inference. Atlas and Helena now activate only by explicit invocation after canonical boot. -> `initiatives/operator-system/session-log.md`

- **Atlas + Helena bootstrap** (Anton session): Re-anchored the Atlas/Helena work after an Eterno seed pass. Built the first vault-native brand pack at `brands/eterno/`. Confirmed bird can fetch `@EternoGallery` X metrics. Key decision: stop manual Eterno analysis here. Next step is runtime contracts plus brand-pack loading behavior. -> `initiatives/operator-system/session-log.md`

## Open Items (for next session)

- **RAPT** — Workspace accounts on `gws-info`, `gws-ca`, and `gws-eterno` still require manual re-auth roughly every 24h. This is cross-runtime operational friction, not project-local work. Recommendation remains at `plan/rapt-recommendation.md`.
- **Context file restructure** — continue moving project-specific data out of startup layers and into project, domain, operator, or app-local context. This remains internal system work.
