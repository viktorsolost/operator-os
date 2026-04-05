# Anton Proposal

Author: Anton
Date: 2026-03-28

## Core Thesis

Memento should be the stripped, correct version of VIK OS.

Not dashboard first.
Not team software.
Not a workspace layer for companies.

Memento should be a personal companion built on one simple contract:

**I maintain truth. Memento handles the rest.**

That is the product.

The owner should not be managing software.
The owner should be maintaining reality.
Memento should read that reality, understand it, decide what matters, and move life and work forward with near-zero input.

## Product Definition

Memento is an autonomous personal chief of staff.

It continuously reads the owner's trusted context, decides what matters, makes plans, does the work it can do safely, and asks for input only when confidence is low, permissions are required, or judgment is deeply personal.

This is not an app with AI features.
This is a context engine with an execution loop.

## What Memento Is

- A personal operator
- A context-driven system, not a prompt-driven system
- A bridge between source of truth and action
- An autonomy system designed to reduce owner input toward zero
- A trust product before it is a feature product

## What Memento Is Not

- Not a dashboard product
- Not a task manager
- Not a notes app
- Not a CRM with AI attached
- Not company collaboration software
- Not a tool that requires constant grooming to stay useful

If the owner has to keep organizing the app to make it work, the product is structurally wrong.

## The Core Loop

Memento should run one loop exceptionally well:

1. Read truth
2. Resolve context
3. Infer what matters now
4. Plan the next useful moves
5. Execute what is safe
6. Ask only when needed
7. Learn from corrections
8. Repeat

That loop is the product.

## Source of Truth Principle

The human is responsible for truth.
Memento is responsible for momentum.

Truth means the real context layer:

- calendar
- email
- messages
- notes
- documents
- tasks
- active commitments
- people and relationships
- preferences
- current projects
- obligations

Memento should not ask the owner to duplicate truth into a special internal system unless absolutely necessary.

The system should ingest, reconcile, and interpret reality where it already lives.

## Core Primitives

The whole product should reduce to five primitives:

- People
- Projects
- Commitments
- Context
- Actions

Everything else is derivative.

A meeting is a commitment.
A note is context.
A task is an action or commitment.
A document is context attached to people or projects.
An opportunity is a possible project or commitment.

This keeps the model small, understandable, and durable.

## Architecture Direction

Memento should have four layers.

### 1. Truth Layer
The connected sources where reality already exists.

### 2. Context Layer
The interpreted meaning graph.
Who matters, what is active, what is blocked, what is risky, what is waiting, what is implied.

### 3. Execution Layer
The agentic loop that drafts, sends, schedules, follows up, prepares, updates, and closes loops.

### 4. Trust Layer
The policy boundary that decides what can be done silently, what should notify passively, what needs approval, and what should never be autonomous.

Pipeline-like execution can remain underneath, but it should not define the product.
The product is the context-to-action loop.

## Design Commandments

1. No duplicate truth entry.
2. No manual project management unless unavoidable.
3. No UI surface unless conversation and automation fail.

These three rules should protect the product from collapsing back into admin software.

## Trust Model

Zero-input autonomy is only possible if trust is designed directly.

Every action should fall into one of four buckets:

- Safe to do silently
- Safe to do with passive notification
- Needs approval
- Never autonomous

This is more important than building more screens.

The owner should feel that Memento is competent, bounded, and predictable.
Without that, the system will never earn the right to act autonomously.

## Product Moat

The moat is not interface.
The moat is trusted context continuity.

If Memento becomes the system that truly knows the owner's world, priorities, commitments, relationships, style, and operating preferences, then it becomes difficult to replace.

That is real defensibility.

## Standard For Every Feature

A feature should exist only if it materially improves one of these:

- context fidelity
- decision quality
- autonomous execution
- trust

If it does not improve one of those four, it should be cut.

## Product Promise

The cleanest articulation I see is this:

**I maintain truth. Memento handles the rest.**

That is not just a slogan.
It is the product covenant.

## Follow-Up, Utopia Model And UI Reduction

### 1. If We Ignore VIK OS Completely

The clean version of Memento is not a product made of pages.
It is a loop with a thin control surface.

The system works like this:

1. Truth comes in from real sources
2. A context engine resolves meaning
3. A planning layer decides what matters now
4. An execution layer does the safe work
5. A trust layer decides when to act, notify, ask, or refuse

In that model, the UI should be very small.
Probably only:

- conversation
- what Memento is handling now
- approvals
- memory and preferences
- audit trail

Everything else should be generated contextually, not live as permanent navigation.

### Pros Of This Model

- Aligned with the real product truth
- Avoids feature sprawl
- Easier to explain
- Can become genuinely autonomous
- Avoids rebuilding bloated productivity software

### Cons And Hard Parts

- Context quality is everything
- Trust is fragile
- Personal data is messy and contradictory
- One-shot AI demos are easy, sustained correctness is hard
- Zero-input autonomy is asymptotic, not immediate

So the correct strategy is narrow, high-trust autonomy first, then expansion.

### 2. Returning To VIK OS, What UI Actually Survives

If the essence is context in, task done out, then most permanent screens are suspect by default.

What should probably survive:

- conversation as the front door
- approvals
- a compact handling-now or agenda view
- context inspect for people, projects, and commitments when needed
- audit trail, what Memento did and why
- settings, preferences, and trust controls

What is probably cuttable or heavily compressible:

- deep navigation structures
- standalone dashboards
- most status surfaces
- list-heavy admin pages
- project pages that mainly restate existing data
- milestone or status management surfaces that require manual upkeep
- navigation built to compensate for weak context resolution
- pages created for reassurance rather than action
- card, list, and table views acting as a crutch for weak agent behavior

### Survival Test For Every Screen

A screen should survive only if it materially improves one of these:

- truth
- context resolution
- execution
- trust

If removing it does not damage one of those four, it should be removed.

### Stripped Product Shell

The likely minimum viable shell is:

- Chat
- Today or Handling Now
- Approvals
- Context Inspect
- History

Everything else should be optional, generated, or removable.

### Blunt Technical View

If VIK OS needs a lot of UI to feel usable, that is evidence the context-to-action loop is still weak.

Strong systems need less interface.
Weak systems compensate with more surface area.
