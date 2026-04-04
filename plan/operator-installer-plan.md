# Operator OS — Product Plan

Status: active
Date: 2026-04-04
Owner: Anton

## Where We Are

The live VIK OS system has been audited, tightened, and stabilized.

The instantiation doctrine is frozen. The manifest is locked. The authority order is explicit.

Implementation of the installer and onboarding flow has begun inside Memento at `~/VIK/Coding/Memento/instantiation/`. Slices 1-2 (core placement, template scaffolding, onboarding schema, question flow, template rendering) are built and tested. Slice 3 (account setup, pipeline config, first sync, voice profiler) is spec'd and ready for implementation.

This repo is the product home for the installer. All implementation code has been migrated from Memento's instantiation directory into this repo. The full installer, onboarding, shared modules, templates, manifests, and tests now live here.

## Product Boundary

Memento is the pipeline and local state engine.

The product is the full agent operating system.

That includes the vault structure, the operator system, the runtime bridges, the templates, the loading and writing rules, the onboarding flow, the connector model, and the pipeline substrate.

Memento belongs inside the substrate layer. It does not define the whole system.

The installer is a top-level product and lives in its own repo, parallel to Memento inside `~/VIK/Coding`.

## Authority Order

All doctrinal decisions are frozen in the VIK OS vault at `~/VIK/ObsidianVault/VIK_OS/initiatives/operator-system/`.

The authority order for file-level treatment and implementation decisions is:

1. `installer-v1-manifest.json` — source of truth for per-file treatment classification
2. `installer-v1-manifest-spec.md` — manifest schema definition
3. `system-instantiation-contract.md` — top-level product goal and three-layer model (defer to manifest for file-level treatment)
4. `installer-target-replication-contract.md` — infrastructure sublayer (narrow scope, not top-level product framing)
5. `system-instantiation-generated-file-matrix.md` — input-to-output dependency mapping only (STALE for file-level treatment, superseded by manifest)
6. `system-instantiation-onboarding-schema.md` — onboarding question definitions, required vs optional fields, phase sequence
7. `installer-v1-onboarding-phase3-tools.md` — workflow tools layer addendum to onboarding schema
8. `system-instantiation-vocabulary.md` — naming decisions (instantiation is the product goal, replication is the narrow infrastructure layer)

None of these authority files ship to the new user. The installer reads them during generation. They are build-time design docs.

## Three-Layer Model

The instantiation contract defines three layers:

### Layer A — Reusable Core

Boot, routing, owner-neutral operator doctrine, templates, Memento substrate.

These are copied near-identical. Treatment: `copy-core`.

### Layer B — Template and Rewrite

Identity, operator role files, bridge files, path references.

These are generated from templates plus onboarding answers. Treatment: `rewrite-template`.

### Layer C — User-Generated

Memory, recent context, auth, projects, brands, runtime state.

These are generated fresh or left empty for the new owner to populate. Treatment: `generate-fresh`.

### Excluded

Build-time authority docs, Viktor-specific residue, audit artifacts, session logs.

These never ship. Treatment: `exclude`.

## Product Split

The installer and onboarding are separate concerns with a non-overlap rule.

### Installer (Phase A)

Place reusable core, templates, bridge templates, safe scaffolds. Verify readiness.

The installer places blank templates. It does not generate owner-specific output.

### Onboarding (Phase B)

Collect answers, render Layer B, generate Layer C, verify instance.

Onboarding fills the templates. It owns all owner-specific generation.

## Implementation Roadmap

### Step 1 — Repo Structure

Set up the Operator-Installer repo with the product directory layout.

```
README.md
plan/
templates/
onboarding/
validator/
runtime-bridges/
sample-config/
src/
```

`templates/` holds the source templates that onboarding renders. `onboarding/` holds the question flow and rendering logic. `validator/` holds the post-install validation suite. `runtime-bridges/` holds bridge file generators. `sample-config/` holds example configurations for reference. `src/` holds shared modules and the installer entry point.

This step also decides what migrates from `Memento/instantiation/` and what stays there.

### Step 2 — Onboarding Packet Definition

Define the onboarding flow in product terms, not implementation terms.

What the installer asks. What each answer generates. What is required vs optional. What can be deferred until later.

This is a product document, not a schema file. It describes the user experience of going through setup.

Source authority: `system-instantiation-onboarding-schema.md` and `installer-v1-onboarding-phase3-tools.md`.

The onboarding packet must cover:

- Owner identity (name, system name, timezone, primary role)
- System paths (home root, vault location, workspace root)
- Workflow tools (project management, comms, calendar, docs, production data, team comms)
- Runtime selection (which runtimes to enable, which to skip)
- Account connections (which accounts to connect now vs defer)
- Required vs optional fields
- Deferred setup (what can be skipped and revisited later without breaking the install)

### Step 3 — Template Inventory

Classify every file the installer handles using installer-facing language.

Which files are copy-core (placed unchanged). Which are rewrite-template (rendered with onboarding answers). Which are generate-fresh (created empty or with starter content). Which are excluded (never shipped).

This is the installer's view of the manifest. It points back to `installer-v1-manifest.json` as authority but presents the classification in terms the installer code can consume directly.

This step must happen before building the onboarding flow because the flow needs to know which files it writes, which it renders, and which it skips.

### Step 4 — Build the Onboarding Flow

Build the runnable onboarding sequence that provisions a new instance.

1. Collect owner identity
2. Collect system paths
3. Collect workflow tools and map to sync engines
4. Select runtimes
5. Select connectors and accounts (now vs deferred)
6. Write generated files (Layer B rendered from templates, Layer C generated fresh)
7. Run post-generation validation

Source authority: onboarding schema, generated-file-matrix (for input-to-output dependencies), manifest (for treatment classification).

Unsupported sync engines (Notion, Linear, Slack, Outlook, Airtable) must be flagged as development tasks during onboarding, not treated as install failures.

### Step 5 — Runtime Bridge Generation

Build the logic that takes selected runtimes and produces correct bridge files pointing at the new owner's vault.

Each bridge must:

- Point to the new owner's VIK OS vault entrypoint
- Follow the canonical boot sequence
- Preserve explicit operator invocation rules
- Activate Atlas/Helena only on explicit invocation
- Keep repo context downstream of identity resolution

Supported runtimes: Codex, Claude, Gemini, OpenClaw.

Each runtime has its own bridge file location and format. The generator must handle the differences.

Claude additionally receives a global settings.json scaffold at ~/.claude/settings.json containing a UserPromptSubmit hook that mechanically enforces the boot sequence before every response. This is generated from a template during onboarding alongside the bridge file.

### Step 6 — Auth and Connector Setup

Build the guided authentication flow for connecting external accounts.

This is the hardest UX moment in the whole install. It must handle:

- gws CLI profile creation and auth for each Gmail/Calendar/Drive account
- Basecamp OAuth and person_id fetch
- Partial auth (some accounts connected, others deferred)
- Deferred auth (skip now, connect later without re-running the full installer)
- RAPT re-auth friction (workspace accounts expire roughly every 24h)

The auth flow must never copy Viktor's tokens, profiles, or account state. Every credential is generated fresh for the new owner.

Source authority: Slice 3 coding packet for pipeline-specific auth requirements.

### Step 7 — Memento Substrate Scaffolding

Set up Memento as the pipeline and state substrate for the new instance.

This includes:

- Cloning or placing the Memento repo
- Scaffolding the state directories (`state/captures/`, `state/store/`, `state/derived/`, `state/runtime/`, `state/sync_log/`, `state/logs/`)
- Generating `state/runtime/pipeline_config.json` from onboarding answers
- Patching pipeline source files to read from config instead of hardcoded values
- Generating a fresh `state/store/registry.json` (no Viktor projects or source refs)
- Wiring Memento to the new owner's vault path

The pipeline must maintain backward compatibility: if `pipeline_config.json` is missing, fall back to hardcoded behavior so Viktor's existing instance keeps working.

Source authority: Slice 3 coding packet.

### Step 8 — Validation Story

Define and build what a healthy fresh install must prove.

Universal checks:

- Doctrine tree exists and is complete
- Boot files exist and are reachable
- No Viktor paths in any template or generated file
- No Viktor auth, tokens, or account state imported
- No owner residue from the source installation

Runtime-specific checks:

- Selected runtime bridges exist and point to the correct vault
- Unselected runtimes have no bridge files or scaffold
- Codex bridge can resolve
- Claude caches are absent
- Gemini paths are target-local
- OpenClaw tokens are not copied

Post-onboarding checks:

- Required onboarding answers are present
- Generated files contain the new owner's identity, not Viktor's
- Layer B files are rendered (not blank templates)
- Layer C files exist (fresh or empty, not copied)

Source authority: replication contract section 4 (fresh-install validation pack).

### Step 9 — Quickstart

Write the real user-facing quickstart that covers the full path from zero to working system.

1. Install (clone repo, run installer)
2. Run onboarding (answer questions, configure system)
3. Connect accounts (auth with external services)
4. Run first sync (pull data from connected sources)
5. Start using the system (`Hi Claudia, what needs my attention today?`)

This is the last thing written because it must reflect the real flow, not an aspirational one.

## What Exists Already

Implementation work lives in this repo under `instantiation/`:

- `installer/` — core_copier.js, template_placer.js, scaffold_generator.js, validator.js, manifest.js
- `onboarding/` — questionnaire.js, template_renderer.js, source_renderer.js, fresh_generator.js, account_connector.js, pipeline_configurator.js, registry_bootstrapper.js, first_sync.js, voice_profiler.js, orchestrator.js, slice3_validator.js, validator.js
- `shared/` — template_utils.js, path_resolver.js, file_matrix.js, runtime_selector.js
- `templates/` — source templates for user-context, runtime-configs, runtime-bridges, system, operator
- `manifests/` — file-treatment-manifest.json (derived from vault canonical manifest)
- `dry_test.js`, `test_installer.js`, `slice3_test.js`

This code was built against the frozen doctrine. Migration into this repo is a future step once the implementation stabilizes.

## Vocabulary

- **Instantiation** is the top-level product goal: create a new working instance for a new owner
- **Replication** is the narrow infrastructure copy layer underneath instantiation
- **Onboarding** is the user-facing question flow
- **Personalization** is the adaptation layer where the system is customized to the new owner
- **Substrate** is the reusable execution layer (VIK OS + Memento)

Source: `system-instantiation-vocabulary.md`.

## Working Rules

Do not replicate until the source system is clean. (Done.)

Do not automate around ambiguity. (Doctrine frozen.)

Do not ship a starter package that is weaker than the live system it represents.

Do not let Memento become the accidental home of the whole system. (This repo exists to prevent that.)

Do not generate owner-specific output from the installer. That is onboarding's job.

Do not treat authority docs as shipped product. They are build-time inputs.

If the manifest says one thing and another doc says something different about file-level treatment, the manifest wins.
