# System Instantiation Vocabulary

Status: canonical naming for the installer-adjacent workstream.

## Decision

Do not use `replication` as the top-level name for the product goal.

Use `instantiation` as the top-level name.

Reason:
- `replication` implies copying Viktor's system as-is
- the real goal is to preserve system structure, behavior, and agent dynamics while replacing Viktor-specific identity with the new user's identity
- the system should be created for a new owner, not cloned as Viktor residue

## Canonical vocabulary

### 1. Instantiation

Use `instantiation` for the full product goal.

Meaning:
- create a new version of the system for a new user
- preserve the core operator architecture and behavioral dynamics
- replace identity, memory, context, and account-specific layers with the new user's own layer

Use this term for:
- installer scope at the product level
- onboarding scope
- user-fit setup
- template boundaries
- new-user deployment work

### 2. Replication

Use `replication` only for the narrow technical layer.

Meaning:
- reproduce safe infrastructure, file structure, and canonical system mechanics
- copy or generate the reusable substrate needed for instantiation
- never imply copying Viktor-specific identity, memory, auth, or runtime residue

Replication is now a sub-layer of instantiation, not the top-level goal.

### 3. Personalization

Use `personalization` for the layer where the system is adapted to the new user.

Meaning:
- replace Viktor-specific identity text
- generate the new user's identity layer
- generate the new user's memory and recent-context starting state
- map system defaults to the new user's role, priorities, tone, timezone, and workflows

### 4. Onboarding

Use `onboarding` for the user-facing question and setup flow.

Meaning:
- collect the minimum inputs needed to instantiate the system for the new user
- choose names, paths, runtimes, preferences, and account connections
- generate user-specific files and configs from those answers

### 5. Substrate

Use `substrate` for the reusable execution and data layer that supports the operator system.

Meaning here:
- VIK OS is the operator and doctrine core
- Memento is the operational substrate, pipeline, runtime state, and derived-data system around it
- a real new-user instantiation likely needs both layers

## Canonical system split for new-user deployment

### Reusable core

Preserve as near-identical as possible:
- boot flow
- routing logic
- operator lanes
- agent role dynamics
- handoff rules
- delegation rules
- decision principles
- working style doctrine
- closeout rules
- context placement rules

### Template-and-rewrite layer

Keep structure, rewrite user-specific identity:
- user name
- system name
- vault name where appropriate
- identity framing
- home-path references
- runtime bridge target paths
- role or business framing that should belong to the new user rather than Viktor

### User-generated layer

Do not copy from Viktor.
Generate fresh from onboarding or leave for post-install setup:
- memory
- recent context
- personal identity context
- auth
- accounts
- trusted folders
- projects
- brands owned by the new user
- runtime state
- device identity

## Installer implication

The installer should be framed as an instantiation system, not a replication system.

That means the correct sequence is:
- install the reusable core
- install the Memento substrate where required
- run onboarding
- generate the new user's identity and context layer
- connect the new user's accounts
- validate the new instance

## Naming rule

Use these terms going forward:
- top-level workstream: `system instantiation`
- narrow infrastructure copy layer: `replication`
- user-fit adaptation layer: `personalization`
- question flow: `onboarding`

Do not use `replication` alone when the real goal is new-user system creation.
