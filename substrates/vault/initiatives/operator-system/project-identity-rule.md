# Project Identity Rule

Status: proposed canonical rule
Owner: Anton
Date: 2026-04-03

## Purpose

Every real project should have one stable identity across the vault and Memento.

The system should not describe the same project with different names in different places unless there is a clearly defined alias rule.

## Canonical rule

Each real project gets one canonical `project_id`.

That `project_id` should be the default shared identity across:
- Memento registry key
- Memento store file name
- derived file prefixes where applicable
- vault project folder name
- vault references to the project when a machine-readable identifier is needed

## Format rule

Use lowercase kebab-case.

Allowed characters:
- `a-z`
- `0-9`
- hyphen `-`

Do not use:
- spaces
- underscores
- mixed punctuation
- alternate spellings across systems

## Naming rule

Prefer the most stable human-recognizable name, not the prettiest label.

Good shape:
- `punks-2026`
- `lucas-zanotto-2026`
- `0009eth-2026`
- `vhils-ledger-partnership`

Avoid having one form in the vault and another in Memento for the same project.

## Display-name rule

Human-facing titles can differ.

That is what `display_name` or document headings are for.

Example:
- canonical `project_id`: `0009eth-2026`
- display name: `0009.eth 2026`

The display name is allowed to be pretty.
The `project_id` must stay stable.

## Folder rule

Every real vault project folder should match the canonical `project_id` exactly.

Example:
- vault folder: `projects/punks-2026/`
- registry key: `punks-2026`
- store file: `punks-2026.json`

## Alias rule

If an old name already exists in notes, treat it as a legacy alias only.

Do not let legacy aliases become competing live identities.

If needed, record aliases in one explicit place.

## Scope rule

This rule applies to real tracked projects.

It does not automatically apply to:
- brands
- initiatives
- apps
- temporary research notes
- test fixtures

Those need their own naming rules if they become system-critical.

## Cleanup rule

When current live systems disagree, fix the mismatch carefully and explicitly.

Do not do broad renames without checking:
- registry references
- store file names
- derived references
- vault links
- project-local notes

## Immediate known mismatches to review

- `0009.eth-2026` vs `0009eth-2026`
- `vhils-x-ledger` vs `mystery-box-vhils`
- vault-only project folders that may not be real registry-backed projects yet

## Non-goal

This rule does not decide which folders are true projects.

It only defines how identity should work once something is treated as a real project.
