# Installer v1 Manifest Spec

## Purpose

This file defines the canonical manifest shape for VIK OS installer v1.

The goal is to separate:

- file treatment
- build-time relevance
- installed-instance payload role

This avoids the earlier failure mode where one flattened exclude bucket
incorrectly mixed:

- files needed during implementation
- files that should ship in a clean instance
- files that must never be copied

## Core Rule

A file can be important at build time and still be correct to exclude from
the installed instance.

The manifest must classify each file across separate dimensions.

## Required Fields

Each manifest row must contain:

- path
- treatment
- build_time_role
- installed_instance_role
- phase_owner
- exclusion_type
- reason
- authority

## Field Definitions

### path

Exact relative VIK_OS file path.

Rules:

- no directory placeholders
- no wildcard buckets
- one row per real file

### treatment

Defines how the file is handled.

Allowed values:

- copy-core
- rewrite-template
- generate-fresh
- prompt-later
- exclude
- unresolved

Rule:

- treatment does not by itself decide whether the file ships in the clean
  installed instance

### build_time_role

Defines whether the file matters during classification and implementation
planning.

Allowed values:

- required_authority
- supporting_authority
- implementation_reference
- not_needed

### installed_instance_role

Defines whether the file belongs in the clean installed target.

Allowed values:

- ship_in_clean_instance
- onboarding_only
- do_not_ship

### phase_owner

Defines who owns execution of that file outcome.

Allowed values:

- installer_v1
- onboarding
- never_copy

### exclusion_type

Required only when installed_instance_role = do_not_ship.

Allowed values:

- historical_work_residue
- superseded_by_higher_authority
- build_time_only_internal_design_doc
- owner_specific_residue
- archive_support_file_not_needed_in_clean_instance
- other

Otherwise leave blank.

### reason

One short implementation-facing sentence.

Rules:

- concrete
- no philosophy
- explain why the classification exists

### authority

One or more of:

- IC
- GM
- OS
- RC
- RB
- SL
- file_contents

Use file_contents when doctrine gives the principle but the live file
content determines the actual classification.

## Authority Key

- IC = system-instantiation-contract.md
- GM = system-instantiation-generated-file-matrix.md
- OS = system-instantiation-onboarding-schema.md
- RC = installer-target-replication-contract.md
- RB = runtime-bridges.md
- SL = session-log.md entries that lock classification and freeze-safety
- file_contents = the file itself contains the evidence that determines the
  applied classification

## Locked Decisions

The following decisions are now fixed unless doctrine changes.

### domains/exhibitions/rules.md

- treatment: exclude
- build_time_role: implementation_reference
- installed_instance_role: do_not_ship
- phase_owner: never_copy
- exclusion_type: owner_specific_residue

Reason:
The file mixes reusable exhibition doctrine with Viktor/Eterno-specific
operating residue, including named people, live links, IDs, account
details, and operational workflow specifics.

Implementation note:
This file is cleanup debt and must be split before any reusable exhibition
doctrine is shipped.

### project-types/intake-decision-tree.md

- treatment: rewrite-template
- build_time_role: implementation_reference
- installed_instance_role: onboarding_only
- phase_owner: onboarding

Reason:
The structure is reusable, but the live file still directly names Viktor
and Claudia in operator and approval semantics.

### operator/clarification-protocol.md

- treatment: rewrite-template
- build_time_role: implementation_reference
- installed_instance_role: ship_in_clean_instance
- phase_owner: installer_v1

Reason:
Contains Viktor references (lines 3, 13). Reclassified per 2026-04-04 audit.

## Manifest Design Rule

Do not use exclude as a sufficient reasoning bucket.

Every row must make all three distinctions explicit:

- how the file is treated
- whether it matters at build time
- whether it belongs in the installed instance

## Authority File Decisions (locked 2026-04-04)

### initiatives/operator-system/system-instantiation-contract.md

- treatment: exclude
- build_time_role: required_authority
- installed_instance_role: do_not_ship
- phase_owner: never_copy
- exclusion_type: build_time_only_internal_design_doc

Reason:
Master blueprint for building new instances. The builder needs it during
construction. The installed user does not need it to operate the system.

### initiatives/operator-system/system-instantiation-generated-file-matrix.md

- treatment: exclude
- build_time_role: required_authority
- installed_instance_role: do_not_ship
- phase_owner: never_copy
- exclusion_type: build_time_only_internal_design_doc

Reason:
Packing list that maps onboarding inputs to generated files. Builder
tooling only. Already consumed during install.

### initiatives/operator-system/system-instantiation-onboarding-schema.md

- treatment: exclude
- build_time_role: required_authority
- installed_instance_role: do_not_ship
- phase_owner: never_copy
- exclusion_type: build_time_only_internal_design_doc

Reason:
Questionnaire template for onboarding. Already answered by the time the
user has a running instance.

### initiatives/operator-system/installer-target-replication-contract.md

- treatment: exclude
- build_time_role: required_authority
- installed_instance_role: do_not_ship
- phase_owner: never_copy
- exclusion_type: build_time_only_internal_design_doc

Reason:
Inspection checklist for validating a fresh install. The installed user
needs a system that passes it, not the checklist itself.

### initiatives/operator-system/runtime-bridges.md

- treatment: copy-core
- build_time_role: required_authority
- installed_instance_role: ship_in_clean_instance
- phase_owner: installer_v1

Reason:
Wiring diagram that explains how runtime bridges connect. The installed
user needs this to understand, debug, or extend their bridge setup.

### initiatives/operator-system/installer-v1-manifest-spec.md

- treatment: exclude
- build_time_role: required_authority
- installed_instance_role: do_not_ship
- phase_owner: never_copy
- exclusion_type: build_time_only_internal_design_doc

Reason:
The classification schema used to sort files during install. Builder
tooling only.

## Minimum Cleanup Before Installer Implementation

### Required cleanup

- Split domains/exhibitions/rules.md into:
    - reusable exhibition doctrine
    - owner-specific operational residue

### Required manifest completion

- apply the new schema to the full manifest
- classify every real file path with the full field set
- make the authority-files payload decision explicit
- remove any row that still relies on a flattened exclude

## Audit Rule

All re-audits must compare only against the current on-disk spec and manifest, never prior audit summaries.

## Implementation Readiness Rule

Installer v1 can move into implementation planning when:

- the new manifest schema is adopted
- the locked disputed-file decisions are reflected in the manifest
- domains/exhibitions/rules.md is treated as non-shipping cleanup debt
- the authority files have explicit installed-instance roles
- no row still depends on a single undifferentiated exclusion bucket
