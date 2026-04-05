# System Instantiation Contract

Status: canonical contract for creating a new user-specific version of the system.

**File-level treatment authority:** For file-level treatment classifications (which files are copy-core, rewrite-template, generate-fresh, or exclude), defer to `installer-v1-manifest.json`. This contract defines principles, layer boundaries, and ownership rules. The manifest is the source of truth for per-file classifications.

This file defines how to instantiate the operator system for a new owner.
It is not a Viktor-system clone contract.
It preserves the engine and rewrites or regenerates the user-specific layer.

## 1. Product goal

Create a new working system for a new user that preserves:
- operator architecture
- agent dynamics
- routing behavior
- handoff behavior
- working style and decision logic
- operational substrate shape

While replacing or regenerating:
- Viktor-specific identity
- VIK and VIK OS naming where identity-specific
- personal memory and recent context
- accounts, auth, and device state
- user-specific projects, brands, and preferences

## 2. Canonical deployment model

A new-user instantiation has three layers.

### Layer A. Reusable core

Preserve as near-identical as possible.

Includes:
- `BOOT.md`
- `ROUTING.md`
- owner-neutral portions of `STRUCTURE.md`
- owner-neutral `operator/` lane doctrine and behavior rules only
- `brands/session-wrapper.md` and brand-wrapper mechanics where the wrapper model remains part of the system
- `domains/` shared domain doctrine that is truly reusable
- `project-types/` reusable lifecycle doctrine
- `templates/` reusable project and handoff templates
- Memento substrate code and contracts that are owner-neutral and path-neutral

Rule:
- this layer defines how the system works
- this layer should not contain personal residue for the owner being instantiated

### Layer B. Template-and-rewrite layer

Keep the same structural role, but rewrite the owner-specific content during instantiation.

Includes:
- system name where intended to be user-facing or identity-facing
- user name references
- home-path references
- vault-root naming where it appears as owned identity rather than neutral implementation path
- bridge-file text that names the owner or system identity
- required files whose current wording still assumes Viktor, VIK OS for Viktor, or Viktor approval and voice
- `operator/identity.md` as the canonical owner-identity file
- `STRUCTURE.md` until its identity-facing wording is fully owner-neutral
- active operator role files such as `operator/anton.md`, `operator/jonah.md`, `operator/vera.md`, `operator/lev.md`, and `operator/claudia.md` until their owner-facing wording is fully neutralized
- any operator doctrine file that still references Viktor specifically, such as `operator/agent-role.md`, `operator/working-style.md`, `operator/decision-principles.md`, `operator/context-loading-rules.md`, or `operator/closeout-rules.md`, until audited clean
- any startup text that says who the system belongs to or what the user's priorities are

Rule:
- this layer is not copied raw
- this layer is generated from templates plus onboarding answers

### Layer C. User-generated layer

Do not copy from Viktor.
Generate fresh from onboarding or leave empty for post-install setup.

Includes:
- `memory.md`
- `recent-context.md`
- auth files
- runtime account files
- trusted-folder lists
- project set
- brand set owned by the new user
- runtime state
- device identity
- logs, caches, histories, browser state, captures, media, pairing state

Rule:
- this layer belongs to the new owner only
- installer may scaffold it, but must not import Viktor's content by default

## 3. File treatment rules

### 3.1 Copy as reusable core

Copy near-identically:
- boot and routing doctrine
- operator role structure and lane boundaries
- delegation and handoff doctrine
- context-placement doctrine and any other owner-neutral operator mechanics
- reusable templates
- Memento substrate code and contracts that do not encode owner-specific identity, target paths, local registries, or runtime residue

### 3.2 Rewrite from templates

Generate owner-specific versions of:
- runtime bridge files
- `operator/identity.md`
- `STRUCTURE.md` until cleaned into reusable owner-neutral form
- active operator role files such as `operator/anton.md`, `operator/jonah.md`, `operator/vera.md`, `operator/lev.md`, and `operator/claudia.md` until cleaned into reusable owner-neutral form
- any operator doctrine file that still references Viktor as the owner, including `operator/agent-role.md`, `operator/working-style.md`, `operator/decision-principles.md`, `operator/context-loading-rules.md`, and `operator/closeout-rules.md`, until cleaned into reusable form
- path references in runtime configs
- startup text that names the system or owner
- any file that currently references Viktor or VIK OS as personal identity rather than neutral system mechanics

### 3.3 Generate fresh

Create fresh starter versions of:
- memory
- recent context
- runtime config files that should point to the new user's folders
- trusted-folder files
- project registry or starter project set if the product includes one
- brand registry or starter brand set if the product includes one

### 3.4 Prompt user

Collect before generation where required:
- owner name
- system name
- vault name if customizable
- install paths
- chosen runtimes
- timezone
- preferred tone or working style overrides if productized
- business or role context that should shape the personal layer
- accounts and auth connections

### 3.5 Never copy

Never import from Viktor by default:
- memory history
- recent-context history
- auth tokens
- account files
- device identity
- Telegram or channel tokens
- trusted folders tied to Viktor paths
- logs, caches, media, browser state, sqlite runtime state, pairing state
- existing projects and brands unless explicitly shipped as sample content

## 4. Memento inclusion rule

Memento is part of the instantiation target as substrate, but only by file-level classification.

Meaning:
- include as reusable core only owner-neutral code and contracts that define substrate behavior
- treat path-bearing config, install-local settings, and owner-facing startup text as template-rewrite
- treat registries, captures, caches, runtime databases, histories, and other local state as generate-fresh or exclude, depending on whether the slot must exist
- exclude Viktor repo residue and live runtime artifacts from shipped payload
- do not treat Memento as the owner identity source
- do not import Viktor-specific runtime state from Memento into a new-user instance

Rule:
- preserve the substrate
- regenerate the owner's data layer

## 5. Runtime bridge rule

Runtime bridges are always instantiated, never copied raw from Viktor.

For each selected runtime:
- generate the bridge file
- point it to the chosen canonical vault location for the new user
- replace owner-name and path references
- preserve the same boot and routing mechanics

Applies to:
- Codex
- Claude
- Gemini
- OpenClaw

## 6. Onboarding contract

Ownership rule:
- installer places reusable core, template sources, runtime bridge templates, and safe config scaffolds
- onboarding is the only layer that generates Layer B and Layer C from user answers
- installer must not generate owner-specific doctrine or personal context on its own beyond placing the blank or templated inputs onboarding will use

The onboarding flow exists to generate Layer B and Layer C.

Minimum onboarding packet:
- owner name
- preferred system name
- install location
- vault location
- selected runtimes
- timezone
- primary role or business context
- account connections to set up now versus later

Optional onboarding packet:
- preferred operator defaults
- tone preferences
- project categories
- brand categories
- default working cadence or reporting style

Rule:
- onboarding should ask only for information that changes generated output
- personal context should be created from onboarding, not cloned from Viktor

## 7. Validation for a successful instantiation

A new-user instance passes when:
- reusable core is installed
- installer-owned template and scaffold inputs are present
- selected runtime bridges exist and point to the new user's paths
- no generated output still contains Viktor-specific names or paths unless intentionally preserved as neutral historical reference
- no Viktor auth, runtime state, or personal memory was imported
- user-generated files exist in fresh starter form where required
- Memento substrate is installed where selected
- runtime configs point to the new user's folders, not Viktor's folders

Failure conditions:
- any bridge or generated config still points to `/Users/viktorsl/`
- any personal memory or recent-context content from Viktor is copied into the new instance
- any auth or device identity from Viktor is imported
- the system still presents itself as belonging to Viktor instead of the new owner

## 8. Naming and identity rule

Top-level goal: instantiation.

Sub-layer: replication.

Identity rule:
- preserve system behavior
- replace owner identity
- regenerate personal context

Do not use replication language when the work actually concerns new-owner creation.

## 9. Practical meaning

The end result for a new user should be:
- the same kind of operator system
- the same kinds of agents and rules
- the same pipeline substrate where included
- a clean identity and context layer that belongs to them

Not:
- Viktor's memories
- Viktor's auth
- Viktor's projects
- Viktor's live runtime residue
- a system that still thinks it is VIK OS for Viktor unless that branding is intentionally chosen by the new owner
