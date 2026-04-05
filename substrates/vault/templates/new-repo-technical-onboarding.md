# New Repo Technical Onboarding

Use this when Anton or Jonah is brought into a new technical project that does not yet have local repo guidance.

This template is for bootstrapping engineering context in a brand-new codebase.
It exists so Anton can be activated even when the project has no `CLAUDE.md` yet.

## Purpose

The first technical session in a new repo should produce a minimal but durable local operating map.

The goal is not to fully document the system on day one.
The goal is to create enough local structure that future sessions can start cleanly and avoid re-discovery.

## Activation Rule

If Viktor brings Anton into a new repo or code folder and there is no project-local `CLAUDE.md`, Anton should:
- inspect the repo structure first
- identify the stack and runtime shape
- find the real entry points
- propose the minimum local guidance files
- create them after approval

Jonah should then use those files as the basis for implementation delivery.

## First Session Output

A new technical repo should usually get these local files first:

- `CLAUDE.md`
- `docs/engineering/README.md`
- `docs/engineering/sessions/`
- `docs/engineering/areas/`

Optional, depending on project shape:
- `docs/engineering/areas/frontend.md`
- `docs/engineering/areas/backend.md`
- `docs/engineering/areas/runtime-state.md`
- `docs/engineering/areas/integrations.md`
- `docs/engineering/areas/deployment.md`

## What Local `CLAUDE.md` Should Do

The repo-local `CLAUDE.md` should be short and practical.
It should explain:
- what the project is
- the main stack
- the main runtime entry points
- where the source of truth lives
- what folders matter most
- where engineering session notes live
- what docs are canonical versus stale
- what commands are important for setup, build, test, and run

It should not become a giant system dump.
If it starts getting long, move durable detail into `docs/engineering/areas/` and keep `CLAUDE.md` as a routing layer.

## Engineering Docs Structure

### `docs/engineering/README.md`

This is the local engineering index.
It should include:
- a short system summary
- architecture areas
- recent major sessions
- known debt areas
- where to log new work

### `docs/engineering/sessions/`

This holds date-scoped engineering session notes.

Naming pattern:
- `YYYY-MM-DD-short-scope.md`

Use session notes for:
- what changed
- why it changed
- what was verified
- what remains
- key risks or debt created

Do not use session notes for timeless architecture truth.
That belongs in `areas/`.

### `docs/engineering/areas/`

This holds durable technical knowledge by system area.

Use it for:
- architecture shape
- source-of-truth rules
- runtime model
- integration behavior
- compatibility layers
- testing boundaries

Suggested area files:
- `frontend.md`
- `backend.md`
- `runtime-state.md`
- `integrations.md`
- `deployment.md`

## Anton/Jonah Split In A New Repo

Anton owns:
- technical direction
- architecture judgment
- source-of-truth boundaries
- documentation accuracy
- implementation shape

Jonah owns:
- delivery sequencing
- agent coordination
- implementation verification
- integration checks
- push-back when specs do not match code reality

If the repo is new and unclear, Anton should define the initial shape.
Jonah should verify it against the actual files before launching work.

## First-Pass Onboarding Checklist

1. Identify the stack
2. Identify the app entry points
3. Identify the data and runtime state locations
4. Identify the main APIs and services
5. Identify the current build and test commands
6. Identify any existing guidance files
7. Identify stale docs versus current truth
8. Create a short local `CLAUDE.md`
9. Create `docs/engineering/README.md`
10. Create the first session note for the onboarding pass

## Bootstrapping Rule

Anton does not require a pre-existing `CLAUDE.md` to be useful.

If none exists, the first session should create the minimum local operating map.
That is the bootstrap.

## Example Invocation

If Viktor says:

`Anton, switch to Duck Game and get context.`

The expected flow is:
- inspect the Duck Game repo
- determine stack and structure
- check whether any local guidance exists
- propose or create the initial local `CLAUDE.md`
- create the local engineering docs scaffold
- log the onboarding session as the first engineering session note

## Standard

A new repo is considered onboarded when:
- Anton can explain the architecture at a high level
- Jonah can sequence implementation work without guessing file ownership
- future sessions can route through local docs instead of re-discovering the repo
