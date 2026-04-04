# Canonical System First, Operator Installer Later

Status: active
Date: 2026-04-03
Owner: Anton

## Core Decision

We are not improving the current installer.

We are discarding it as the active path.

We are also removing installer work from Memento.

The installer is not a Memento feature.

The installer is a top-level system product and should live in its own repo, parallel to Memento inside `~/VIK/Coding`.

Right now, the priority is to make Viktor's live system the true canonical version.

Only after the local system is structurally correct, fully explicit, and cleanly compartmentalized should we package it for anyone else.

## Why

The current installer is not a trustworthy source for replication.

It does not fully match the live vault.

It still carries Viktor-specific assumptions.

It is too checklist-driven and not enough guided provisioning.

It copies a partial system instead of installing a clean one.

It also lives in the wrong place.

If we keep building on top of it now, we risk mass-producing the wrong shape and tying the whole system too tightly to Memento.

## Product Boundary

Memento is not the product.

Memento is the pipeline and local state engine.

The real product is the full agent operating system.

That larger system includes:
- the vault structure
- the operator system
- the runtime bridges
- the templates
- the loading and writing rules
- the onboarding flow
- the connector model
- the pipeline substrate

Memento belongs inside the substrate layer.

It does not define the whole system.

## New Goal

Make Viktor's local VIK OS + Memento system top-notch first.

That means:
- the vault structure is deliberate, not accidental
- the layer boundaries are explicit
- the project lifecycle is clear
- the agent rules are clear
- the templates are complete
- the context-loading rules are clean
- the connectors and onboarding model are designed correctly

Then, and only then, rebuild the installer from zero in its own repo.

## Truth Model

There are three system layers and each has a different truth boundary.

### Layer 1 — External source truth

These are the real operational systems.

- Gmail is truth for email
- Calendar is truth for events
- Google Sheets is truth for sheet data
- Airtable is truth for CRM data
- any other live system is truth for its own raw records

### Layer 2 — Local captured truth

The pipeline pulls the outside systems into local machine-readable state.

This layer is not the original truth.

It is the local captured snapshot used for computation, derivation, and fast reasoning.

Examples:
- `state/captures/`
- `state/store/`
- `state/derived/`
- `state/runtime/`

### Layer 3 — Reasoning truth

The vault holds meaning, structure, interpretation, and long-horizon memory.

This is where the agents keep:
- durable memory
- recent context
- project context
- decisions
- summaries
- references
- handoffs
- doctrine

If a raw fact in the vault conflicts with the source system, the source system wins.

The vault is truth for reasoning, not for overriding live source data.

## Immediate Direction

We will audit and refine the live system first.

We will not treat the current starter package as the product.

We will treat it as disposable scaffolding.

We will remove installer artifacts from Memento so Memento stays clean.

We will not package around current rough edges.

We will remove rough edges first.

## What Must Be Fixed In The Live System First

### 1. Canonical vault skeleton

We need one deliberate top-level structure for the vault.

Every major folder must have a clear reason to exist.

No folder should exist only because it appeared during growth.

### 2. Project compartmentalization

Projects must hold their own depth.

Global memory must stay small.

Recent context must stay small.

Project history must stay inside project folders.

Closed projects must stop polluting active reasoning by default.

### 3. Project lifecycle

The states must be clearer:
- intake
- active
- paused
- closed
- archived

The folder and template model should reflect this cleanly.

### 4. Agent operating doctrine

Agents need one explicit rule set for:
- what to load
- what not to load
- where to write
- where not to write
- how to treat truth boundaries
- how to treat project boundaries
- how to use the vault as a brain

### 5. Templates

Templates must be complete enough that agents create consistent structures automatically.

Templates should cover:
- active projects
- intake projects
- optional sub-context
- handoffs
- recurring context patterns

### 6. Connector model

The system must explicitly support different user source stacks.

Different people use different tools.

The architecture must support that cleanly before any installer exists.

### 7. Onboarding model

The future installer should be based on guided provisioning.

It should ask:
- who the person is
- what tools they use
- which connectors they need
- which accounts to authenticate
- what IDs or source definitions are required

But this onboarding model should be designed after the system shape is stable, not before.

## What We Keep

We keep:
- the boot spine
- routing
- operator architecture
- the truth-layer model
- the goal of reusable setup
- the idea of profile-based installs later

We do not keep the current installer implementation as the foundation.

We do not keep installer work inside Memento.

## Working Rule

Do not replicate until the source system is clean.

Do not automate around ambiguity.

Do not ship a starter package that is weaker than the live system it is supposed to represent.

Do not let Memento become the accidental home of the whole system.

## Active Plan

### Phase 1 — Audit Viktor's live system

Review the vault, templates, doctrine, folder structure, and context boundaries.

Mark what is:
- correct
- messy
- duplicated
- missing
- accidental

### Phase 2 — Define the canonical brain

Lock:
- top-level vault structure
- folder purposes
- truth boundaries
- project lifecycle
- loading rules
- write rules
- template set

### Phase 3 — Clean the live system

Refactor the live vault so it matches the canonical model.

Do this before any packaging work.

### Phase 4 — Define top-level installer architecture

Design the installer as its own repo beside Memento.

Define:
- repo boundary
- relationship to Memento
- relationship to the vault
- runtime bridge packaging
- connector provisioning model
- profile model

### Phase 5 — Rebuild installer from zero

Only after the above is done, build a new installer that:
- installs the canonical system
- asks setup questions
- configures the right connectors
- guides auth
- validates the setup
- provisions a clean local brain

## Current Instruction To Ourselves

Stop thinking about improving the current installer.

Think about making the real system clean enough that rebuilding the installer becomes obvious.
