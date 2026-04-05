# Summary

This initiative tracks the design of operator ingress, routing, cross-operator handoffs, multi-model operator assignment, and how non-project strategic/system discussions should be stored in VIK OS.

## Why this exists

A session in OpenClaw started from the local workspace instead of the VIK OS vault, which exposed an ingress inconsistency. The internal VIK OS routing spine exists and is fairly strong, but not every runtime reliably enters through it.

A second design question emerged from that: how operator-to-operator collaboration should work when Viktor speaks naturally to one front door but the work belongs to another operator lane.

A third question emerged around memory: where high-level system conversations should live so they remain recoverable without clogging hot routing surfaces.

## Current position

- The core weakness is ingress inconsistency across runtimes, more precisely a bootstrap-governance problem, not lack of internal architecture inside VIK OS.
- The system should support multiple operators with distinct lanes and possibly distinct default models.
- One operator should own a response lane at a time, but other operators should be able to review or challenge from their own lane.
- High-level internal system discussions should be stored as bounded workstreams, not dumped into one flat architecture folder and not mixed into `recent-context.md`.
- A new top-level category like `initiatives/` is the current preferred structure for system-level work with continuity.
- Any routing/boot improvements must preserve operator identity and lane boundaries unless Viktor explicitly chooses to redesign them.

## Scope

This initiative covers:
- canonical boot/routing entrypoint design
- runtime shims for OpenClaw / Claude / Codex-like environments
- startup self-check / missing-context fail-safe
- operator activation and cross-operator handoff rules
- multi-model operator assignment policy
- storage pattern for high-level system conversations

This initiative does not directly change project folders, production runtime state, or active project operations.

## Current execution posture

Anton's implementation direction is approved in principle.

Jonah execution is intentionally deferred until the boot/routing/model-policy layer is stable enough that Jonah can operate in his intended lane and model posture without mixing runtime defects into delivery work.
