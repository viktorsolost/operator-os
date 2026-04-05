# Operator System

Purpose: deep archive for the full VIK OS team model.

This folder is not part of the always-loaded boot chain.
It exists to hold the full operator system context, relationships, routing logic, runtime bridge behavior, validation history, and per-operator deep notes without bloating boot files.

## What lives here

- whole-team structure
- operator ownership boundaries
- explicit invocation rules
- handoff model
- runtime bridge behavior
- validation history
- per-operator deep notes

## What does not live here

- canonical boot authority
- top-level routing authority
- durable one-line truths that belong in `memory.md`
- recent shipped notes that belong in `recent-context.md`

## Canonical split

- `BOOT.md` and `ROUTING.md` stay thin and authoritative
- `memory.md` stores durable cross-session truths
- `recent-context.md` stores short-horizon shipped context
- this folder stores the deep system archive

## Current state, 2026-04-03

Explicit invocation is now the hard startup rule.
If Viktor says `Hi X`, X owns the session start.
This applies to top-level operators and to the global brand operators Atlas and Helena.

Task-shape inference is fallback only when Viktor does not explicitly name an operator.

Atlas and Helena are global post-boot wrappers, not top-level VIK OS lanes.
They activate only by explicit invocation.


## Brand-pack bootstrap context

The first seed brand pack exists for Eterno under `brands/eterno/`.
That pack includes internal strategy references, X ingestion, Instagram extraction, doctrine scaffolds, and a first X vs Instagram comparison.

Key judgment:
continuing manual Eterno analysis past this point would drift into doing Atlas's future work by hand.
The correct move was to stop extending manual brand analysis unless a blocker appeared, and move the work into runtime contracts and operator-system structure.
