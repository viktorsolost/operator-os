## What This System Is

This is a multi-operator operating system for running work, context, execution, design, strategy, and technical delivery through distinct specialist agents instead of one generic assistant.

The system is built around clear operator lanes, explicit routing, durable context, delegation contracts, model policies, and a shared operating substrate that preserves continuity across sessions, projects, and runtimes.

It is designed to help one owner run complex work with less re-briefing, less context loss, and less drift between planning, execution, design, and implementation.

During onboarding, the system is instantiated for the new owner, preserving the architecture and behavior while generating a fresh owner-specific context layer.

## Core Components

### VIK OS

VIK OS is the operator layer.

It defines the boot sequence, routing rules, operator identities, handoff model, delegation contracts, working style, decision principles, model policies, and session behavior.

Each operator runs on a specified model tier. Judgment-level operators run on the strongest available model. Execution-level sub-agents run on faster models suited to leaf work. This is enforced by the model policy, not left to runtime defaults.

Behind the operator role files sits a shared infrastructure layer: delegation contracts, decision principles, working style rules, identity definitions, context loading rules, context placement rules, closeout behavior, and a clarification protocol. These govern how every operator behaves regardless of lane.

This is the part that determines who should own a task, how that task should be handled, when work should be handed off, and how the system stays coherent over time.

### Memento

Memento is the operating substrate.

It is the context system that holds projects, facts, threads, activity, reminders, and derived views of work.

Memento is not a conventional task manager.

It is the structured context layer that helps the operators work from rich, persistent reality instead of starting from scratch every session.

The data layer is governed by formal contracts that define the shape and boundaries of each data type. These contracts keep the pipeline, state engine, and operators working against the same structures.

Conversation is the primary operating surface.

Dashboards and read models exist to support visibility and verification, not to replace the operator workflow.

### The Pipeline

The pipeline is the ingestion and sync layer.

It pulls source data from connected systems through manifest-driven connectors, then turns that material into usable context for Memento and the operators.

The product of the pipeline is not raw synced data.

The product is situational awareness.

Its job is to produce a source-agnostic operational context layer that gives the OS enough structured reality to brief, track, and assist the user without constant re-explanation.

That means answering questions like:

- what matters now
- what threads are active
- what people and projects are in motion
- what changed recently
- what needs attention
- what the operator should know without asking the user again

The connectors are just intake pipes.

Gmail, Slack, Notion, Basecamp, Airtable, and other tools are not the product. They are sources.

The product is the normalized operating picture those sources create.

The architecture should therefore be designed backward from stable outputs:

- captures
- normalized entities
- derived views
- today and context surfaces
- operator-readable state

If two different source stacks can produce the same operating picture, the system is working correctly.

That is why normalization matters. The system should not stop at "what did Gmail say exactly?" It should answer "what conversation happened, what project does it belong to, who is involved, what changed, and what matters now?"

Its job is to reduce manual re-briefing and make sure the system can work from real current context instead of depending on the user to restate everything.

The pipeline does not replace judgment.

It feeds the system with the raw material needed for judgment.

### Runtime Bridges

The system can be entered from multiple runtimes.

Runtime bridge files connect tools such as Codex, Claude, Gemini, and OpenClaw into the same canonical boot and routing chain.

Each bridge points into the same entrypoint. The boot sequence, routing policy, operator loading, and model posture checks are identical regardless of which runtime the user starts from.

That means the system can preserve one operating model across different AI runtimes instead of fragmenting into separate personalities or separate workflows.

## Truth Model

A core part of the system is its explicit truth-layer model.

The system does not treat all context as the same kind of truth.

It separates source truth, captured truth, and reasoning truth so operators can work with clearer epistemic boundaries.

### External Source Truth

External systems are the source truth for raw operational reality.

This includes systems such as email, calendar, Drive, Basecamp, Sheets, and other connected services.

These systems are where live facts originate.

If a raw fact in the reasoning layer conflicts with the source system, the source system wins.

### Memento as Captured Truth

Memento is the local captured and derived truth layer.

It ingests, structures, and maintains usable local representations of projects, facts, threads, activity, reminders, and other operational context.

This is the layer that makes source material available to the system in a form that can be worked with across time.

It is not the original truth. It is the local captured snapshot used for computation, derivation, and fast reasoning.

### The Vault as Reasoning Truth

The vault is the reasoning and context layer.

It holds operator doctrine, project reasoning, decisions, durable context, and structured knowledge that helps the system think across sessions.

It is not the source of raw operational facts.

It is the layer where meaning, interpretation, planning, and accumulated working intelligence live.

The vault also holds the full project lifecycle: intake projects, active projects, paused work, closed projects, and archived material. Projects hold their own depth. Global memory stays small. Closed projects stop polluting active reasoning by default.

### Why This Matters

This separation is one of the core disciplines of the system.

It prevents source data, captured context, and reasoning artifacts from collapsing into one blurred memory layer.

That makes the system more reliable, easier to audit, and better able to preserve clean source-of-truth boundaries as it grows.

## Meet the Operators

The system defines five top-level operators and two brand wrappers. Each operator carries a defined title, responsibility boundary, and working posture. They are not personas. They are formalized roles with documented operating procedures, delegation rules, and accountability boundaries.

### Claudia — Chief Operating Officer

Claudia is the execution and coordination operator.

She owns follow-up, operator workflow, cross-context coordination, reminders, operational continuity, team relationship management, and day-to-day movement across Basecamp, Gmail, Drive, Calendar, and production calendars.

She has defined autonomy boundaries — what she can do without asking, and what requires the owner's approval. She manages sub-agents with model selection rules matched to task complexity.

Use Claudia when the main need is to keep work moving, coordinate across threads, follow up on open items, organize operational flow, or manage execution across multiple contexts.

### Anton — Chief Technology Officer

Anton is the technical direction operator.

He owns architecture, system coherence, implementation planning, code quality standards, source-of-truth boundaries, technical tradeoff decisions, and documentation accuracy against the real codebase.

Anton decides what should be built and why. When work moves to implementation, he produces plan files with tasks, behavior specifications, gates, targets, acceptance criteria, and validation steps. He expects the receiving operator to verify specs against the actual codebase before writing code.

Use Anton when the work needs technical judgment, architectural clarity, design of implementation shape, or a decision about how the system should be built.

### Jonah — VP Engineering

Jonah is the implementation delivery operator, reporting to Anton's technical direction.

He owns engineering execution, sequencing, agent coordination, task ownership, verification, integration, and completion discipline against approved technical direction.

Jonah has a push-back mandate. He treats specs as proposals until verified against the real codebase — reading actual files, confirming field names, function signatures, and data shapes before implementation begins. This prevents agents from building against stale specs. He delegates leaf implementation to sub-agents and verifies their output.

Work is done when files are in place, behavior matches the spec, tests pass, the build works, and integration is verified.

Use Jonah when the architecture is already decided and the job is to deliver, coordinate implementation work, verify results, and get engineering outcomes across the line.

### Vera — Head of Design

Vera is the design operator.

She owns visual design, UI/UX, information architecture, interaction design, navigation design, typography direction, iconography direction, design-system consistency, and brand-surface coherence.

She works from a reference-driven methodology: classify the surface type, pull references, extract patterns, recommend direction, and show the work. She maintains a standing reference library and applies different design languages to different surface types. She delegates implementation to sub-agents and keeps design judgment for herself.

Use Vera when the work is about how something should look, feel, read, flow, or present information to a user.

### Lev — Chief Strategy Officer

Lev is the strategy operator.

He owns strategic reasoning, problem reframing, ambiguity reduction, high-stakes decision thinking, cross-domain synthesis, and the challenge function.

Lev pushes back harder than anyone in the system. He respects the owner's judgment but treats it as one input, not a conclusion. He states disagreement directly with reasoning, does not soften substance, and makes sure the counterargument is heard clearly before accepting the owner's final call.

He operates in two modes: counsel mode for structured strategic output, and thinking partner mode for collaborative reasoning. He does not implement. He strategizes.

Use Lev when the real problem is still unclear, when tradeoffs need to be reframed, or when a decision requires deeper thinking before execution begins.

### Atlas — Brand Strategy Wrapper

Atlas is the brand strategy operator.

Atlas is a post-boot brand wrapper, not a top-level routing lane. He activates only after canonical boot when explicitly invoked. He is never inferred from task shape.

He owns brand diagnosis, strategy memos, channel diagnosis, campaign and experiment recommendations, and doctrine pressure-testing.

Use Atlas for positioning, brand direction, strategic framing, and higher-level brand thinking when brand context needs to shape the session.

### Helena — Brand Writing Wrapper

Helena is the brand writing and review operator.

Helena is a post-boot brand wrapper, not a top-level routing lane. She activates only after canonical boot when explicitly invoked. She is never inferred from task shape.

She owns drafting, rewriting, copy review, voice and clarity critique, channel-specific adaptation, and rubric-based writing evaluation. She consumes strategic direction from Atlas but does not invent strategy.

Use Helena for brand writing, message refinement, communication review, and language quality inside an active brand context.

## How Routing Works

The system uses a one-owner-at-a-time routing model.

Only one operator owns the session at any given moment.

If the user explicitly names an operator, that operator starts the session.

If the user explicitly names Atlas or Helena, the normal boot sequence still runs first, then the brand wrapper activates. Atlas and Helena are never inferred from task shape — only from explicit invocation.

If no operator is named, the system routes by task shape.

- Execution and coordination route to Claudia
- Technical direction and architecture route to Anton
- Implementation delivery routes to Jonah
- Design routes to Vera
- Strategy and ambiguity reduction route to Lev

Handoffs are explicit and use a formal handoff artifact that preserves context, rationale, and decision history for the receiving operator. The receiving operator treats the handoff as a proposal until validated against their lane.

Reviews do not change ownership. Handoffs do.

When a handoff crosses runtimes, the owner is the relay. The system does not pretend operators can communicate directly across different AI runtimes. The sending operator produces a handoff artifact, the owner carries it to the receiving runtime, and the receiving operator validates it before proceeding.

If routing is unclear or required context is missing, the system stops and surfaces the failure rather than guessing or inventing context.

This keeps the system from collapsing into a generic assistant voice and preserves real responsibility boundaries between operators.

## How the Pieces Work Together

The operator layer decides who should own the work.

Memento provides the working context, project structure, derived facts, and operational memory needed to support that work.

The pipeline keeps that context populated from real external systems so the operators can work from live reality instead of stale summaries or repeated manual explanation.

The runtime bridges make sure every entrypoint follows the same boot and routing rules.

Together, these parts create a system where context, judgment, execution, and continuity reinforce each other.

## How to Use the System

The simplest way to use the system is to start by explicitly invoking the operator you want.

If you know you need execution help, start with Claudia.

If you need technical judgment, start with Anton.

If you need engineering delivery, start with Jonah.

If you need design help, start with Vera.

If you need strategic thinking, start with Lev.

If you need brand strategy, start with Atlas.

If you need brand writing or review, start with Helena.

If you do not explicitly invoke anyone, the system will infer the correct lane from the shape of the task.

In day-to-day use, conversation is the default operating surface.

You do not need to manually manage every internal file or subsystem.

The operators use the boot chain, context layer, and routing model to determine what to load, what matters, and what should happen next.

The system works best when the user treats the operators as specialists rather than one interchangeable assistant.

## Quick Examples

- `Hi Claudia, help me organize the next actions across these three active projects and tell me what needs follow-up today.`
- `Hi Anton, review this implementation plan and tell me what is structurally wrong before anyone starts coding.`
- `Hi Jonah, take Anton's approved plan and turn it into an execution sequence with validation steps.`
- `Hi Vera, redesign this dashboard so the important information is clearer and easier to scan.`
- `Hi Lev, I am not sure whether this is a strategy problem or an execution problem, help me frame it correctly.`
- `Hi Atlas, help me sharpen the strategic positioning for this brand.`
- `Hi Helena, rewrite this announcement so it sounds sharper, cleaner, and more on-brand.`

## Onboarding and Provisioning

Onboarding is the step that turns the reusable system core into a working owner-specific instance.

This is not a cosmetic personalization pass.

It is a guided provisioning flow that asks who the owner is, what tools they use, which connectors they need, which accounts to authenticate, and what IDs or source definitions are required.

The onboarding flow provisions the system across the key setup surfaces:

- owner identity and system identity
- install location, vault location, and workspace paths
- selected runtimes such as Codex, Claude, Gemini, and OpenClaw
- runtime bridge files and runtime-local configuration
- account and connector setup boundaries
- timezone and owner-specific operating defaults
- fresh starter context files that let the system begin operating as a real environment from day one

The installer asks which workflow tools the new owner uses and what sync capabilities they want. It resolves each selection against the installed connector registry. Supported tools are enabled. Unsupported tools are surfaced explicitly in the generated config and setup output so nothing disappears silently.

The connector model is designed to support different user source stacks. Different people use different tools. The architecture supports that cleanly rather than assuming a fixed set of integrations.

The installer should learn the new user's stack and workflow, then configure the pipeline so different source systems can still produce the same operational product.

This is the moment where the operator architecture stays the same, but the live instance becomes the new owner's system.

The result is the same system behavior and structure, provisioned as a clean new working environment rather than a copied personal workspace.

## Connector Architecture

The pipeline runs through a manifest-driven connector system.

Each connector is a self-contained directory under `instantiation/connectors/adapters/` containing a manifest file, an auth adapter, and a sync adapter. The manifest declares the connector's identity, category, capabilities, stage, priority, execution ordering constraints, and production status.

The system has four layers:

### Registry

The registry loader scans the adapters directory at startup, validates each manifest, and builds a map of available connectors. No connector is hardcoded into the registry or any core module. The registry is the single discovery mechanism.

### Auth and Sync Adapters

Each connector implements two adapter contracts.

The auth adapter handles authentication lifecycle: starting auth, finishing auth, refreshing tokens, revoking access, and checking status. Each method returns a standardized result object.

The sync adapter handles data ingestion: validating config, running initial sync, running incremental sync, checking health, and normalizing output. Gmail's sync adapter handles email, calendar, drive, and sheets as internal sub-steps of a single connector. Basecamp's sync adapter handles project data.

Both contracts are defined as interfaces with required and optional methods. A connector can implement auth only, sync only, or both. Adding a new connector means implementing these interfaces in a new subdirectory. No edits to core pipeline code, no edits to the auth dispatcher, no edits to the registry.

### Auth Dispatcher

The auth dispatcher routes authentication calls through the registry instead of hardcoded if/else branches. It resolves the correct adapter for each connector and dispatches the requested action. The onboarding flow, reconnection flow, and interactive installer all use the dispatcher. Adding a new auth flow requires adding an adapter, not editing the dispatcher.

### Planner

The planner enforces a fixed four-stage execution model: preflight, source sync, derivation, and post-sync.

Within each stage, connectors execute in deterministic order governed by integer priority, topological sort on declared ordering constraints, and alphabetical tiebreaking. The planner validates the full dependency graph before execution and rejects cycles, cross-stage dependencies, missing references, and self-references.

The planner drives live execution during first sync. Each connector's sync adapter is called through the planner's executor. If a connector fails during source sync, the planner continues to the next connector. Derivation runs only after source sync completes with at least one success.

### Current Connectors

Gmail and Basecamp are the two production connectors shipped in v1. Gmail covers email, calendar, drive, and sheets through a single Google Workspace authentication. Basecamp covers project management data through OAuth.

The architecture is designed so that adding Slack, Notion, Linear, Airtable, or any other source requires only a new adapter directory with a manifest and the relevant auth and sync implementations. The core pipeline, dispatcher, planner, and registry remain untouched.

## What This Means in Practice

You are getting a structured operator system, not a generic chatbot setup.

You are getting specialist operators with defined titles, responsibility boundaries, delegation contracts, verification mandates, and formalized operating procedures.

You are getting a shared routing spine, a persistent context substrate with formal data contracts, a connector-driven ingestion pipeline with manifest-based extensibility, and a runtime-agnostic boot model that works identically across Codex, Claude, Gemini, and OpenClaw.

You are getting a truth model that keeps source data, captured context, and reasoning artifacts in separate layers with explicit boundaries.

You can use it to run operations, technical work, design, strategy, brand thinking, and cross-project execution through clear ownership instead of muddled sessions.
