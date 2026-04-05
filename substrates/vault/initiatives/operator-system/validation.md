# Validation

## 2026-04-03 routing fix validation

Goal: verify that explicit invocation now wins cleanly.

### Codex live `/tmp` smoke tests

#### Anton
Pass.
Returned Anton as active operator.
Boot path reported as `BOOT.md -> ROUTING.md -> memory.md + recent-context.md -> operator/anton.md`.
No brand wrapper triggered.

#### Atlas
Pass.
Returned Atlas as active identity.
Resolved Eterno.
Pack posture reported as yellow / proceed provisional.
Explicitly reported that no top-level lane was inferred.

#### Helena
Pass.
Returned Helena as active identity.
Resolved Eterno.
Pack posture reported as yellow / proceed provisional.
Explicitly reported that no top-level lane was inferred.

### Resolved bug

The earlier ambiguous path, Helena activating on top of Lev, is no longer present in the live Codex check after the explicit-invocation fix.

### Remaining runtime gaps

#### Claude
Auth-blocked for live test.

#### Gemini
Fresh auth flow blocked live test.

#### OpenClaw
Structurally wired, but not yet cleanly proven end to end in a live local smoke test.
