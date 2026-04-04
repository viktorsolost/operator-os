# Connector Architecture — Anton Execution Packet

Jonah, 2026-04-04.
Implementation-ready packet for the connector extensibility refactor.

## Decision

The pipeline currently hardcodes Viktor's tool stack (Gmail via gws CLI, Basecamp OAuth). Onboarding captures user tool preferences but the runtime ignores anything beyond those two. This makes the installer a single prewired deployment, not a general-purpose OS instantiation.

The fix is manifest-driven connectors with split auth and sync adapter surfaces, registered from a registry, not sprinkled as if/else branches.

## Architecture shape

Core owns:
- Connector manifest schema
- Connector registry loader
- Instance connector resolution
- Auth dispatcher
- Sync planner
- Stage execution contract
- Normalized output contract

Adapters own:
- Platform auth implementation
- Platform sync implementation
- Platform-specific config validation
- Platform-to-canonical normalization

## Execution-order rule

The planner preserves a fixed core stage model.

Stage 1 — preflight: Load instance config, enabled connectors, auth status, capability map, validate prerequisites.

Stage 2 — source sync: Run enabled sync adapters in deterministic order within their stage. Order comes from manifest fields constrained by the core planner (priority integer + optional after constraints), not from filenames.

Stage 3 — derivation: Run derive layers only after all source sync stages complete successfully enough to satisfy minimum inputs.

Stage 4 — post-sync state: Persist checkpoints, health, and run summary.

Connector manifests may declare: stage, default integer priority within stage, and optional after constraints against other connectors in the same stage. The planner validates and rejects cycles or illegal cross-stage dependencies. No adapter may force itself after derive_all or mutate core stage boundaries.

## Required interfaces

### Connector manifest
- id
- display_name
- category
- capabilities
- auth_adapter (optional)
- sync_adapter (optional)
- config_schema (optional)
- enabled_by_default (optional)
- stage
- priority
- after (optional)
- status: production, experimental, unsupported, manual_only

### Auth adapter contract
- start_auth
- finish_auth
- refresh
- revoke
- status
- required_secrets

### Sync adapter contract
- discover (optional)
- validate_config
- initial_sync
- incremental_sync
- healthcheck
- normalize

### Planner contract
- Accept resolved enabled connectors
- Validate stage and dependency graph
- Produce deterministic execution plan
- Execute per stage
- Return run summary with connector-level outcomes

## Onboarding contract change

workflow_tools must resolve to instance connector state with three outcomes per selected tool:
- enabled and supported
- selected but unsupported
- selected but deferred or manual_only

Unsupported must be visible in generated instance config and user-facing setup output.

Schema needs three linked concepts:
1. Preferred tools (which tools the user uses)
2. Desired capabilities (what they want synced: email, chat, tasks, docs, CRM, calendar)
3. Resolved connectors (which installed adapters will actually serve those capabilities)

## Scope boundary

v1 ships the extensibility architecture plus the two live adapters already proven (Gmail + Basecamp). Do not build Slack, Notion, Airtable, or Linear into core v1. Optionally add one thin non-auth connector after the contract is stable as a proving case.

Onboarding must distinguish between selected, installed, authenticated, and syncing. If a user picks Slack and there is no installed adapter, the system must say exactly that and offer the next path.

## Invariants

- Existing Gmail and Basecamp happy path still works
- Current derived pipeline still runs after source sync completes
- No selected tool disappears silently
- Adding a new connector must not require editing pipeline core
- Adding a new auth flow must not require editing auth dispatcher core
- Execution order remains deterministic and testable
- Cross-stage ordering is core-owned, not adapter-owned

## What not to change

- Do not broaden v1 production support beyond Gmail and Basecamp in this slice
- Do not redesign downstream canonical entities unless a real adapter boundary forces it
- Do not replace current derive logic with connector-specific derive logic
- Do not build marketplace loading or remote plugin install yet

## Implementation sequence

1. Define connector manifest schema and registry loader
2. Define auth and sync adapter interfaces
3. Extract Gmail and Basecamp into adapter shape without changing behavior
4. Replace hardcoded account_connector branching with auth dispatcher
5. Build planner with fixed stages and deterministic intra-stage ordering
6. Route current Gmail and Basecamp sync through planner
7. Add onboarding resolution into instance connector config
8. Surface unsupported selections in quickstart and setup output
9. Add tests for ordering, unsupported state, and no-core-edit extensibility

## Acceptance criteria

- A fresh install with Gmail + Basecamp produces the same functional sync result as before
- A selected unsupported tool appears explicitly as unsupported in generated config and user-facing setup output
- A new local connector can be registered by adding manifest + adapter files, with no edits to pipeline core or auth dispatcher core
- Planner rejects invalid dependency graphs and preserves deterministic order for valid ones
- Derive steps run only after source sync stage completion
- End-to-end test covers at least one supported auth connector, one supported sync connector, and one unsupported selected connector

## Jonah flags

Repo boundary: The pipeline lives in Memento, the installer in operator-os. This refactor spans both. Need Anton's call on whether pipeline core moves to operator-os or stays in Memento with adapter hooks.

Iteration risk: The "no core edit for new connectors" criterion is the right target, but the interface will need at least one revision after the first non-Gmail/Basecamp adapter tests it. First pass is a candidate contract, not frozen.

## Sequencing

This slice executes after steps 3-4 of the current installer work (end-to-end test + quickstart) are complete.
