# VIK OS Boot

This is the canonical entrypoint for VIK OS routing.

All runtimes should enter here before doing substantive work.
`CLAUDE.md` at this level is a compatibility shim only.

## Canonical boot sequence

1. Read `ROUTING.md`.
2. Load base routing context:
   - `memory.md`
   - `recent-context.md`
3. Select the primary operator lane.
   If Viktor explicitly names a top-level operator, that operator owns the session start.
   If Viktor explicitly names `Atlas` or `Helena`, do not infer a top-level lane from task shape. Complete canonical boot, then hand off to `brands/session-wrapper.md`.
   If Viktor does not name an operator, use ROUTING.md to infer the lane as fallback.
   Top-level lanes: Claudia, Anton, Jonah, Vera, Lev.
4. Load the selected top-level operator role file when a top-level lane was selected.
   If `Atlas` or `Helena` was explicitly named, continue to the global brand wrapper after canonical boot instead of forcing a top-level lane from inference.
5. Load the shared operator loading contract:
   - `operator/context-loading-rules.md`
6. Using that contract, load only the additional behavior and task context the request actually needs:
   - lane-specific required context such as `operator/claudia-memory.md`
   - shared conditional behavior such as `operator/working-style.md`, `operator/identity.md`, `operator/agent-role.md`, `operator/decision-principles.md`, and `operator/delegation-contract.md`
   - task-specific context from `domains/...`, `project-types/...`, `intake/...`, `projects/...`, `brands/...`, or relevant Personal context
7. Apply operator model posture from `operator/model-policy.md`.
8. Load completion behavior from `operator/closeout-rules.md`.
9. Load context placement behavior from `operator/context-placement-rules.md`.
10. Verify runtime model posture.
   If your runtime declares its model identity, compare it against `operator/model-policy.md` for the active lane.
   If there is a mismatch, surface it to Viktor before answering.
   If your runtime does not declare model identity, state that the posture check could not be fully performed and proceed with that warning.
   Deeper runtime-conformance procedures may live in initiative validation artifacts, but they are support only. They must not replace this core check or redefine routing.
11. Lock response behavior to the active operator lane before answering.
   - Do not answer in a generic runtime voice and correct later.
   - The active operator's responsibilities and non-responsibilities govern the full session until an explicit handoff or operator change.
   - If the answer shape starts drifting across lanes, stop and re-anchor before continuing.
12. If ownership changes across operators, use `templates/operator-handoff.md`.
13. If required context is missing or routing is unclear, stop and surface the failure rather than guessing.

## Source of truth

- Canonical entrypoint: `BOOT.md`
- Authoritative routing policy: `ROUTING.md`
- Authoritative loading contract: `operator/context-loading-rules.md`
- Authoritative operator model posture: `operator/model-policy.md`
- Canonical delegation contract: `operator/delegation-contract.md`
- Canonical handoff artifact: `templates/operator-handoff.md`

## Compatibility rule

Runtime-specific entrypoints may adapt mechanics, but they must not redefine routing policy locally.
They should hand off into this file and continue through the VIK OS routing spine.
