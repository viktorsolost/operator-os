# Open Questions

## Remaining

1. Should the interop test remain a document-level smoke test, or should it later be automated into a runnable conformity check?

2. What exact runtime-conformity process should be run after future boot-path edits:
   - manifest measurement only
   - runtime self-check only
   - both measurement and runtime self-check

3. What specific condition is sufficient to say the runtime/model-policy layer is stable enough to hand execution fully to Jonah?

## Resolved

1. VIK OS has one canonical routing spine. Runtime-specific entry files are thin shims into `BOOT.md`.

2. `VIK_OS/CLAUDE.md` is a shim. Canonical routing lives in `BOOT.md` and `ROUTING.md`.

3. The handoff artifact is a structured brief, represented by `templates/operator-handoff.md`.

4. Automatic handoff is allowed when the work clearly crossed into another protected lane without changing Viktor's objective or crossing a higher approval boundary. Otherwise the chain pauses for Viktor approval.

5. Default cross-operator review is single-owner plus explicit review. Council mode is exceptional.

6. Model assignment is encoded centrally in `operator/model-policy.md`, with runtime config required to conform rather than redefine policy.

7. `initiatives/` is a first-class top-level VIK OS category for system/design workstreams.

8. `initiatives/` mirrors the project folder pattern using `summary.md`, `decisions.md`, `open-questions.md`, and `session-log.md`.

9. The realistic startup self-check is lightweight normal boot plus explicit runtime validation artifacts outside normal conversational boot.

10. Operator identity and lane boundaries are protected by explicit invariant: boot/routing changes may modify mechanics, not operator roles, ownership, or reporting lines.

11. The minimal three-runtime interop test is defined in `initiatives/operator-routing-and-handoffs/runtime-smoke-tests.md`.
