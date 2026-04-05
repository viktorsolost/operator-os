# Operator Handoff

Use this artifact when primary ownership moves from one operator lane to another.
This is for handoff, not lightweight review.

## From / To
- From: Anton
- To: Jonah

## Reason for handoff
- Technical rule is now defined and the next step is careful implementation review and cleanup in the live system.

## Task statement
- Apply the canonical project identity rule carefully across the live system.
- First audit all current real project identities across the vault and Memento.
- Then propose the smallest safe cleanup plan needed to make real project identity consistent.
- Do not do broad renames blindly.
- Do not touch brands, initiatives, apps, or test fixtures unless needed for boundary clarification.

## Current status
- Safe documentation pass is underway.
- The live vault now has a structure map, context-loading rules, a project recipe, and clearer top-level folder purposes.
- The next real coherence problem is project identity mismatch across vault and Memento.

## Relevant context already loaded
- `memory.md`: global memory is still too fat; project-specific truths should move downward over time.
- `recent-context.md`: current focus is system cleanup before any installer rebuild.
- Other files:
  - `VIK_OS/STRUCTURE.md`
  - `VIK_OS/templates/project-recipe.md`
  - `VIK_OS/operator/context-loading-rules.md`
  - `VIK_OS/initiatives/operator-system/project-identity-rule.md`

## Decisions already made
- The installer is not the current focus.
- Cleanup must be slow and non-destructive.
- Project identity needs one canonical rule.
- Canonical `project_id` should be shared across vault folder, registry key, store file, and machine-readable references.

## Open questions / unresolved risks
- Which vault project folders are true registry-backed projects versus vault-only context folders?
- Which current mismatches should be renamed versus treated as legacy aliases?
- Whether some vault project folders should remain vault-only and not become pipeline projects.
- Risk of breaking links or assumptions if renames are done too early.

## Expected output from receiver
- A small audited list of current real project identity mismatches.
- A proposed minimal cleanup sequence.
- Clear identification of what is safe now versus what should wait.
- If changes are made, a precise report of each rename or alias decision.

## Approval status
- Viktor approval required: yes, for any rename or identity-changing implementation
- Viktor approval received: yes for defining the rule and preparing this handoff; no blanket approval for broad renames
- Notes: keep execution slow, explicit, and reversible.

## Constraints / non-goals
- Do not do broad folder moves.
- Do not delete reasoning content.
- Do not treat archive copies as live authority.
- Do not redesign the full registry model in this step.
- Do not expand this into installer work.
