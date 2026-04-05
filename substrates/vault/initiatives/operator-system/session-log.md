# Operator System Session Log

## 2026-04-04 — Boot enforcement and Claude settings scaffold

What changed:
- added global UserPromptSubmit hook to Viktor's ~/.claude/settings.json that fires on every prompt and injects boot sequence reminder
- strengthened global ~/.claude/CLAUDE.md with "FIRST INSTRUCTION" block that makes boot non-skippable
- created Claude settings.json template at instantiation/templates/runtime-configs/claude/settings.json.tmpl with boot hook baked in for new users
- updated path_resolver.js to include settings key for Claude alongside bridge and root
- added config_claude_settings entry to file-treatment-manifest.json (generate-fresh, onboarding phase, runtime-gated)
- updated CLAUDE.md bridge template with the same hardened boot language
- manifest canonical total updated from 281 to 282

Why this changed:
- boot sequence was being skipped on session start even with explicit operator invocation
- the CLAUDE.md instruction alone was not strong enough to prevent it
- needed a mechanical backstop (hook) that fires before any response, not just a file instruction
- new users need this enforcement from day one, so the installer must produce it during onboarding

Outcome:
- Viktor's live system now has both layers of boot enforcement (hook + strengthened CLAUDE.md)
- new user installs will get ~/.claude/settings.json with the boot hook via the onboarding flow
- Claude runtime now has parity with Gemini for settings scaffold generation

## 2026-04-03

Decision locked: explicit invocation is now the hard startup rule across the operator system.

What changed:
- canonical boot and routing docs were tightened so explicit invocation wins
- Atlas and Helena were limited to explicit-invocation activation only
- global bridge files were updated across Codex, Claude, Gemini, and OpenClaw
- repo-local brand contracts in Memento were downgraded to reference-only shims so live authority stays global
- deep team archive was created here under `initiatives/operator-system/`

Why this changed:
- previous behavior allowed overlapping inference between top-level lane routing and brand-wrapper routing
- that produced ambiguous substrate paths, including Helena activating on top of a top-level lane inferred from the same prompt
- Viktor explicitly wanted full control by naming the operator he wants to start with

Outcome:
- `Hi X` now means X owns the session start
- Atlas and Helena remain global post-boot wrappers, not top-level lanes
- task-shape inference remains available only when no operator was named

## 2026-04-03 — Structure placement review

Decision:
- `initiatives/operator-system/` is the right place for deep operator-system context
- this folder should remain a deep archive and working design area, not part of the always-loaded boot chain

Why:
- it keeps boot files thin
- it preserves rich team-model context without bloating `BOOT.md`, `ROUTING.md`, `memory.md`, or operator role files
- it gives the system one clean place for deep notes about routing, team structure, bridge behavior, and validation history

Boundary:
- canonical startup authority stays in `BOOT.md` and `ROUTING.md`
- durable cross-session truths stay in `memory.md`
- short-horizon shipped context stays in `recent-context.md`
- lane identity stays in `operator/*.md`
- deep operator-system setup, team map, bridge notes, and evaluation notes live here

Audit input kept from this review:
- global memory is still carrying some project-specific truths that should move down into project folders
- Claudia memory is still carrying some project-specific technical details that should move into project context or shared runtime reference
- project templates are behind real project usage, especially missing `session-log.md`
- top-level structure needs clearer folder-by-folder definitions, but not destructive cleanup
- runtime registry should stay operational in Memento, while the vault should hold reasoning maps and system doctrine

Operating rule from this review:
- save deep system-design notes here
- save only distilled truths upward into canonical boot, routing, memory, or operator files


### Atlas and Helena bootstrap history absorbed from the retired project folder

Bootstrap details retained:
- first vault-native brand pack was built using Eterno as the seed brand
- created `brands/eterno/README.md`
- created `brands/eterno/registry.md`
- created doctrine scaffolds under `brands/eterno/doctrine/`
- created X source captures under `brands/eterno/sources/x/`
- created Instagram extraction notes under `brands/eterno/sources/instagram/`
- created corpus comparison notes under `brands/eterno/corpus/`

Technical confirmations retained:
- installed the correct bird package after finding a wrong `bird` binary on PATH
- confirmed live fetch of `@EternoGallery` profile tweets with Eterno auth
- confirmed bird provides per-post likes, retweets, replies, quotes, bookmarks, and views
- normalized X to the same Mar 3 to Apr 1, 2026 window as the Instagram screenshots

Strategic correction retained:
- Viktor pushed back that the session was drifting into too much manual Eterno analysis
- judgment: correct pushback
- line drawn: enough seed material exists, further manual brand analysis should stop unless a blocker appears

## 2026-04-03 — Project identity cleanup + closeout routing

Decision locked:
- the canonical project identity rule was applied to the live system for the confirmed mismatch
- operator closeout behavior is now explicit in a dedicated global rule file

What changed:
- renamed vault project folder `projects/0009.eth-2026/` to `projects/0009eth-2026/`
- updated the project-local `project_id` in the vault summary to `0009eth-2026`
- confirmed `vhils-x-ledger` and `mystery-box-vhils` are separate real projects and must never be merged or aliased
- created `operator/closeout-rules.md` as the canonical completion logging policy
- updated `BOOT.md` to load the closeout rules in the canonical boot sequence
- updated operator working style and memory so closeout logging is treated as part of approved execution

Why this changed:
- fresh operator sessions were missing completed work because closeout routing was implicit instead of mandatory
- Anton could not see the finished identity cleanup from startup context alone

Outcome:
- the real 0009 identity mismatch is resolved
- the Vhils boundary is now explicit and durable
- future completed work has one clear rule for where the result should be logged

## 2026-04-03 — Recent context compressed to startup-first

Decision locked:
- `recent-context.md` should hold only context a fresh operator still needs quickly
- older history stays in project logs, initiative logs, or memory, not in the startup layer

What changed:
- rewrote `recent-context.md` to newest-first order
- added a persistent current-system-state block at the top
- removed older diary-style entries that were already preserved in deeper canonical files
- kept only current startup-relevant items, live open items, and live blockers

Why this changed:
- fresh operators were anchoring on stale history because the startup layer behaved like a timeline archive
- the system needed a front page, not a diary

Outcome:
- startup context is now faster to load
- Anton and other operators should see current system state before older operational history
- older detail remains preserved in project and initiative logs
- 2026-04-03 context relocation note: Removed project-style open items and blockers from `recent-context.md` so startup context stays routing-first. Kept only cross-runtime RAPT friction and the internal context-file restructure item at the routing layer.

## 2026-04-03 — Installer-target replication contract

Decision locked:
- installer-target replication doctrine now has one canonical vault location at `initiatives/operator-system/installer-target-replication-contract.md`

What changed:
- defined one installer-facing replication truth set for the live VIK OS system
- classified the install surface across canonical vault doctrine, generated bridge files, generated or prompted runtime configs, reference-only repo files, and excluded machine-local runtime residue
- defined fresh-install pass or fail validation for Codex, Claude, Gemini, and OpenClaw
- completed a hidden-assumption sweep for username-specific paths, BackBone residue, auth files, device state, trusted-folder lists, and seasoned runtime artifacts

Why this changed:
- live-system health was strong enough for daily use, but installer work still lacked one canonical replication contract
- runtime configs and local state still carried too much Viktor-machine specificity to be treated as portable payload

Outcome:
- installer implementation can now begin against an explicit contract instead of live-machine habit
- the installer boundary is now explicit about what to copy, generate, point, prompt for, validate only, and exclude
- blind replication of runtime home folders is now clearly out of bounds

## 2026-04-03 — Instantiation vocabulary replaces replication-first framing

Decision locked:
- `instantiation` is now the top-level term for the new-user product goal
- `replication` is now a narrow technical sub-layer inside instantiation

What changed:
- created `initiatives/operator-system/system-instantiation-vocabulary.md` as the canonical naming and boundary file for installer-adjacent work
- defined the canonical split across reusable core, template-and-rewrite layer, and user-generated layer
- locked the rule that Memento belongs in the deployment substrate, while user identity, memory, auth, and context must be generated for the new owner instead of copied from Viktor

Why this changed:
- replication-first language was aiming the work at cloning VIK OS as-is
- Viktor clarified that the real goal is new-user system creation with preserved agent dynamics and replaced user identity

Outcome:
- the workstream is now framed around new-user instantiation rather than Viktor-system copying
- future installer and onboarding work can target Pauline-style deployment instead of VIK-only replication

## 2026-04-03 — New-user instantiation contract defined

Decision locked:
- the installer-adjacent target is now defined as a new-user instantiation contract, not a Viktor-system clone contract

What changed:
- created `initiatives/operator-system/system-instantiation-contract.md` as the canonical file-level contract for reusable core, template-and-rewrite, and user-generated layers
- locked Memento as included substrate rather than identity source
- defined onboarding as the generator of the owner-specific layer and validation as the check that no Viktor-specific residue survives into the new instance

Why this changed:
- Viktor clarified that the actual goal is Pauline-style system creation with preserved operator dynamics and replaced owner identity
- vocabulary alone was not enough, the system needed a concrete deployment contract

Outcome:
- future installer and onboarding work can now target a real new-user instance instead of a clean copy of Viktor's machine
- the core rule is now explicit: preserve behavior, replace identity, regenerate personal context

## 2026-04-03 — Instantiation onboarding schema defined

Decision locked:
- onboarding now has a canonical schema that defines the minimum required fields, optional shaping fields, runtime-specific questions, generated outputs, and success criteria for a new-user system instance

What changed:
- created `initiatives/operator-system/system-instantiation-onboarding-schema.md`
- defined the onboarding phases across identity, system fit, runtime setup, and fresh-start context generation
- mapped each question group to concrete generated outputs and validation rules
- locked the rule that onboarding generates owner context fresh and never copies Viktor memory, auth, or runtime residue

Why this changed:
- the instantiation contract needed a practical question and output model before installer or onboarding implementation can stay truthful
- Viktor asked for the actual onboarding layer, not only vocabulary and high-level boundaries

Outcome:
- installer and onboarding implementation now have a canonical schema for what to ask, what to generate, what to defer, and what to forbid
- the first-run target is now explicit: a clean working instance for the new owner without Viktor-specific carryover

## 2026-04-03 — Instantiation generated-file matrix defined

Decision locked:
- the onboarding and instantiation work now has a canonical file-output matrix that maps every major file surface to copy-core, rewrite-template, generate-fresh, prompt-later, or exclude treatment

What changed:
- created `initiatives/operator-system/system-instantiation-generated-file-matrix.md`
- mapped reusable core files, template-generated bridge files, fresh owner-context files, deferred auth files, and excluded Viktor-only residue
- linked each generated surface back to onboarding inputs so future implementation can stay deterministic and auditable

Why this changed:
- the onboarding schema defined what to ask, but installer and onboarding implementation still needed a file-by-file output map
- Viktor asked for the practical generated-file layer, not just question categories

Outcome:
- future implementation can now know exactly which files to copy, rewrite, generate fresh, defer, or forbid
- the new-user first-run target is now concrete at the file-output level

## 2026-04-03 — Instantiation doctrine tightening pass

Decision locked:
- `system-instantiation-contract.md` is now the top authority for the workstream
- `installer-target-replication-contract.md` is now an infrastructure sublayer only and loses on conflict

What changed:
- removed the replication-contract contradiction that treated `memory.md` and `recent-context.md` as copied canonical doctrine instead of fresh-generated owner context
- locked `operator/identity.md` as the canonical generated owner-identity file
- reclassified `operator/agent-role.md` and `STRUCTURE.md` from provisional copy-core into template-rewrite treatment until their identity wording is made owner-neutral
- split reusable brand-wrapper mechanics from seed brand content so `brands/eterno/` is no longer implicitly reusable core

Why this changed:
- Anton review correctly flagged the remaining contradictions and provisional boundaries as unsafe for implementation

Outcome:
- the instantiation doctrine is now materially tighter at the file-authority level
- installer and onboarding implementation have a cleaner source-of-truth split between reusable core, rewrite-template, fresh-generated, deferred, and excluded surfaces

## 2026-04-03 — Instantiation freeze-safety tightening pass

Decision locked:
- installer now owns reusable core placement, template sources, and safe scaffolds only
- onboarding is now the sole generator of Layer B and Layer C outputs from user answers

What changed:
- removed the remaining installer versus onboarding overlap so installer-phase validation now checks scaffolds and handoff readiness, while final owner-output validation stays with the broader instantiation contract
- tightened Memento from broad substrate language into file-level buckets across owner-neutral code and contracts, template-rewrite path-bearing files, fresh local slots, and excluded Viktor runtime residue
- re-bucketed required owner-bound files beyond `operator/agent-role.md`, including active operator role files plus `operator/working-style.md`, `operator/decision-principles.md`, `operator/context-loading-rules.md`, and `operator/closeout-rules.md`
- removed duplicate runtime-selection authority so `selected_runtimes` is the single runtime enablement source and runtime-specific onboarding fields now capture detail only
- resolved the remaining `STRUCTURE.md` contradiction and aligned the top contract, replication contract, generated-file matrix, and onboarding schema

Why this changed:
- Viktor asked for one surgical pass to make the instantiation layer freeze-safe without expanding doctrine
- the prior audit still found implementation-risk ambiguity around ownership, operator-file classification, and substrate boundaries

Outcome:
- every required surface now has one explicit bucket or conditional bucket rule
- no required file is still labeled reusable core if its current wording can carry Viktor residue
- installer and onboarding now have a clean file and config split that implementation can follow without inference

## 2026-04-03 — Instantiation implementation brief defined

Decision locked:
- implementation now has one execution packet that preserves the frozen installer versus onboarding boundary

What changed:
- created `plan/vik-os-instantiation-implementation-brief-2026-04-03.md` in Memento as the repo-local execution packet for implementation
- mapped installer ownership to reusable-core placement, template-source placement, bridge-template placement, safe scaffold generation, and installer-phase validation only
- mapped onboarding ownership to user answers, template rendering, Layer B generation, Layer C generation, and post-onboarding validation only
- defined the concrete module map, target inputs and outputs, template source buckets, validation checkpoints, and first delivery slices in build order
- locked the first coding slice as installer scaffold pass only, with zero owner-specific generation

Why this changed:
- doctrine was frozen enough to implement against, but implementation still lacked a build-ready packet for module boundaries and sequencing
- coding without that packet would have forced the first worker to re-invent ownership seams and risk reintroducing installer versus onboarding overlap

Outcome:
- implementation can now begin from a bounded execution packet without reopening classification theory
- the first safe coding slice is explicit and ready to assign

## 2026-04-04 — Installer v1 manifest audit (3-agent consensus + verification)

Three independent audit agents ran the 5-check audit prompt against `installer-v1-manifest.json`. Results were cross-compared for consensus, then independently verified.

### Check 4 (locked decisions): PASS — all 3 agents agree, verified correct.

### Check 1 (manifest completeness): FAIL — verified

- 2 real files have no manifest coverage: `apps/memento/archive/proposals/memento_brainstorm.html` and `initiatives/operator-system/installer-v1-session-brief.md` (both confirmed to exist on disk)
- 8 manifest rows use glob/wildcard patterns, violating the spec rule "one row per real file, no wildcard buckets"
- ~98 real files are only covered by those illegal glob rows, not by explicit per-file entries
- Actual files on disk: 281. Manifest header claims 321. Manifest has 189 explicit file rows.

### Check 2 (schema compliance): FAIL — verified

- All 189 path rows contain all 8 required fields — PASS
- All enum values are from allowed sets — PASS
- exclusion_type blank/non-blank rule is consistent — PASS
- 8 glob rows violate the spec's path rule (same 8 as Check 1)

### Check 3 (classification accuracy): FAIL — verified with corrections

Verified: 12 copy-core files contain "Viktor" references and must be reclassified to rewrite-template:
1. BOOT.md (lines 15, 16, 17, 32)
2. ROUTING.md (lines 25, 51, 70, 71, 74, 97)
3. operator/context-loading-rules.md (lines 37, 71)
4. operator/context-placement-rules.md (line 27)
5. operator/closeout-rules.md (line 23)
6. operator/delegation-contract.md (line 24)
7. operator/model-policy.md (line 18)
8. operator/clarification-protocol.md (lines 3, 13)
9. domains/CLAUDE.md (line 3)
10. brands/session-wrapper.md (lines 12, 13, 16, 35, 58, 140, 145)
11. projects/CLAUDE.md (line 28)
12. intake/CLAUDE.md (line 51)

Agent corrections after verification:
- `runtime-bridges.md` — agent 2 flagged as 13th misclassified file. **Verified: no Viktor refs. Agent 2 was wrong.** No reclassification needed.
- `STRUCTURE.md` — classified rewrite-template, agents 1 & 2 said no owner refs. **Verified: zero Viktor refs. Should be copy-core.**
- `templates/new-repo-technical-checklist.md` — agents 2 & 3 said no owner refs. **Verified: zero Viktor refs. Should be copy-core.**
- `templates/active-project/CLAUDE.md` — agent 1 said should be copy-core. **Verified: contains "Viktor" on line 16 ("Viktor approves; Claude proposes"). Rewrite-template is correct.** Agent 1 had the direction backwards.

All 6 generate-fresh files pass — all 3 agents agree, verified correct.

### Check 5 (consistency between artifacts): FAIL — verified

- JSON header counts do not match actual manifest row counts:
  - copy_core: header 38 vs actual 41
  - rewrite_template: header 22 vs actual 15
  - generate_fresh: header 8 vs actual 6
  - exclude: header 247 vs actual 127 explicit rows
  - total_files: header 321 vs actual 281 on disk
- Comparison doc still shows PENDING for 6 authority files where manifest decisions are locked
- Comparison doc shows rewrite for `templates/intake-project/CLAUDE.md`, manifest says copy-core
- `handoff-rules.md` and `routing-model.md` still ambiguous in comparison doc but resolved as exclude in manifest
- Unchecked by agents: the exclude count gap (header 247 vs 127 rows) should be ~120 files covered by the 8 glob patterns. This math was not verified during audit and should be checked during remediation.

### Verified remediation plan for next session

Priority order:

1. **Reclassify 12 copy-core → rewrite-template** in manifest.json (the 12 files listed above with verified Viktor refs)
2. **Reclassify 2 rewrite-template → copy-core** (`STRUCTURE.md`, `templates/new-repo-technical-checklist.md` — verified zero owner refs)
3. **Expand the 8 glob rows** into individual per-file rows to comply with spec. While expanding, verify that glob-covered file count + explicit exclude rows = header exclude count (currently unverified).
4. **Add 2 missing files** to manifest (`apps/memento/archive/proposals/memento_brainstorm.html`, `initiatives/operator-system/installer-v1-session-brief.md`)
5. **Fix header counts** to match actual row counts after all reclassifications and glob expansion
6. **Update comparison doc** to resolve 6 stale PENDING entries, the `templates/intake-project/CLAUDE.md` disagreement, and the `handoff-rules.md` / `routing-model.md` ambiguity
7. **Re-run the 5-check audit** after fixes to confirm all checks pass

## 2026-04-03 — Instantiation Slice 1 coding packet defined

Decision locked:
- Slice 1 now has an implementation-ready coding packet for installer scaffold work only

What changed:
- created `plan/vik-os-instantiation-slice-1-coding-packet-2026-04-03.md` in Memento
- defined exact responsibilities, inputs, outputs, invariants, prohibited behavior, acceptance criteria, and validation method for the shared truth modules and installer Slice 1 modules
- locked the cross-module rules for selected runtime authority, path resolution authority, file-treatment authority, installer no-owner-generation, and installer-phase validation scope
- defined fixed build order, validation checkpoints, worker ownership boundaries, and done definition for the installer scaffold slice

Why this changed:
- Viktor approved turning the execution brief into a worker-ready packet for the first coding slice
- implementation needed exact module contracts before assigning workers so Slice 1 can start without reintroducing installer versus onboarding overlap

Outcome:
- Slice 1 is now ready for worker assignment
- the first coding pass is constrained to scaffold-ready installer output only, with zero owner-specific generation

## 2026-04-04 — Slice 1 remediation and Slice 2 scoping

### Slice 1 code review and remediation

Slice 1 was code-reviewed after Jonah reported completion. Three critical issues found:
- implementation manifest had 7 treatment misclassifications vs canonical manifest (BOOT.md as copy-core instead of rewrite-template, etc.)
- surface coverage gap: 48 surfaces vs 281 in canonical manifest
- validator checkpoint D only warned, never failed on rendered owner files

Root cause: the coding packet's authority order pointed at the generated-file matrix (stale) instead of the canonical manifest. Jonah built correctly from stale inputs. Anton's failure — directions should have pointed at the right source.

Remediation completed: all 10 fixes applied, 35 tests pass, canonical manifest comparison test confirms 0 mismatches.

Corrective actions:
- authority orders updated in coding packet and implementation brief to start with canonical manifest
- deferral headers added to generated-file matrix, instantiation contract, and replication contract
- audit rule added to manifest spec: all re-audits must compare against current on-disk files only
- memory.md updated: Anton must clean all docs before handoff, must review every Jonah completion

### Authority drift cleanup

20 contradictions found across 6 files, all tracing to the same root cause: manifest remediated 2026-04-04, design docs written 2026-04-03 and never updated. Fixed by adding manifest deferrals to all stale docs.

### Slice 2 scoped: onboarding and template rendering

Decision locked:
- hybrid rendering approach: purpose-built templates for complex surfaces (17), source-file rendering for simple Viktor→owner swaps (25)
- generated starter files must offer value out of the box (operational content in memory, identity, claudia-memory — not stubs)
- dry test with fake user Pauline verifies 11 checkpoints including boot chain, functional content, and zero Viktor residue
- voice profile (operator/voice.md) added to onboarding schema as optional post-Phase-3 generated output, used by Claudia and Helena

Coding packet: `plan/vik-os-instantiation-slice-2-coding-packet-2026-04-04.md`

### Slice 2 completed and verified

- All 6 onboarding modules built and spec-compliant
- 6 templates (3 rewrites, 3 new) with functional content
- Dry test 41/41 with Pauline (Claude + Gemini)
- Code review found 0 critical issues, 3 important robustness items
- Robustness fixes applied: manifest cross-check in fresh_generator, shared template_utils, tilde paths in validator
- identity.md template updated to include missing "Current Work Areas" section (strict spec compliance)
- All tests pass: dry test 41/41, Slice 1 tests 35/35

### Slice 3 scoped: guided account connection, first sync, voice profiler

Decision locked:
- Pipeline has Viktor-specific hardcoding (4 Gmail accounts, Basecamp account ID, source identities) that blocks new users
- New artifact `state/runtime/pipeline_config.json` becomes the single source of pipeline identity
- Pipeline source files patched to read from config — backward compatible (Viktor's pipeline still works if config missing)
- 6 new modules: account_connector, pipeline_configurator, registry_bootstrapper, first_sync, voice_profiler, slice3_validator
- Voice profiler added to canonical manifest as generate-fresh (operator/voice.md)
- Dry test with mock data covers 10 checkpoints including backward compatibility and "later" path

Coding packet: `plan/vik-os-instantiation-slice-3-coding-packet-2026-04-04.md`

### Installer README drafted

- Created `Coding/Operator-Installer/README.md` with product-facing system overview covering VIK OS, Memento, pipeline, runtime bridges, operator map, routing, usage, examples, and onboarding.
- Framed README around what the new owner gets and how to use the system, with only minimal boundary language about fresh owner-specific context.
- README updated to add explicit truth-layer model section and expand onboarding into concrete provisioning flow for owner identity, runtimes, connectors, accounts, paths, and starter context.
