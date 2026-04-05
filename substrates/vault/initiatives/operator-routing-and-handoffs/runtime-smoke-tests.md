# Runtime Interop Smoke Test

Purpose: verify that the three active runtime entry modes wake into the same VIK OS routing spine without local routing forks.

This is a minimal interop test, not a full behavioral certification suite.
It checks ingress convergence only.

## Pass Standard

Each runtime entry path must satisfy all of these:
- points into the same canonical spine
- reaches `VIK_OS/BOOT.md`
- uses `ROUTING.md` as authoritative routing policy
- does not redefine routing policy locally
- preserves the approved runtime-specific model posture where applicable

If any runtime fails, interop fails.

## Runtime 1: Claude-native

Entry file:
- `~/.claude/CLAUDE.md`

Checks:
1. The file points to `~/VIK/ObsidianVault/VIK_OS/CLAUDE.md`.
2. It describes `VIK_OS/CLAUDE.md` as a shim or canonical boot bridge, not as the authoritative routing policy.
3. It does not define a competing local routing sequence or alternate top-level routing truth.

Expected result:
- Claude-native startup flows through `~/.claude/CLAUDE.md` -> `VIK_OS/CLAUDE.md` -> `BOOT.md` -> `ROUTING.md`

## Runtime 2: OpenClaw

Entry files:
- `/Users/viktorsl/.openclaw/workspace/START_HERE.md`
- `/Users/viktorsl/.openclaw/workspace/AGENTS.md`
- `/Users/viktorsl/.openclaw/openclaw.json`

Checks:
1. `START_HERE.md` points directly to `~/VIK/ObsidianVault/VIK_OS/BOOT.md`.
2. `AGENTS.md` step 0 points directly to `~/VIK/ObsidianVault/VIK_OS/BOOT.md`.
3. Neither local file defines a competing routing policy.
4. If Atlas or Helena is explicitly invoked, the local bridge may point to `~/VIK/ObsidianVault/VIK_OS/brands/runtime.md` or directly to `~/VIK/ObsidianVault/VIK_OS/brands/session-wrapper.md`, but it must still resolve into the canonical global wrapper with no local routing fork.
5. `openclaw.json` primary model is `anthropic/claude-opus-4-6`.
6. `openclaw.json` model set includes at least:
   - `anthropic/claude-opus-4-6`
   - `openai-codex/gpt-5.4`
7. Extra enabled models are allowed unless a stricter live runtime policy is explicitly approved.

Expected result:
- OpenClaw startup flows through local bridge files into `BOOT.md`, with no local routing fork and approved model posture.

## Runtime 3: Codex-like repo session

Entry files:
- repo-local `CLAUDE.md` when present
- `~/.claude/CLAUDE.md`

Checks:
1. If a repo-local `CLAUDE.md` exists, it points operator routing to `~/.claude/CLAUDE.md`, not to a repo-local routing policy.
2. If a repo-local `CLAUDE.md` exists, it does not define a competing local routing sequence or alternate top-level routing truth.
3. `~/.claude/CLAUDE.md` points into `~/VIK/ObsidianVault/VIK_OS/CLAUDE.md`.
4. The combined path does not introduce a second routing fork between repo context and VIK OS routing.

Expected result:
- Codex-like repo startup flows through repo `CLAUDE.md` when present, otherwise directly through `~/.claude/CLAUDE.md`, and then into `VIK_OS/CLAUDE.md` -> `BOOT.md` -> `ROUTING.md`

## Recording Format

Record one line per runtime:
- `Claude-native: PASS|FAIL - <exact mismatch if any>`
- `OpenClaw: PASS|FAIL - <exact mismatch if any>`
- `Codex-like: PASS|FAIL - <exact mismatch if any>`

Then record the final result:
- `Interop: PASS`
- or `Interop: FAIL`

## Failure Rule

Stop on exact mismatches.
Do not mark interop as passing because "the spirit is right."
One broken ingress path means the runtimes are not actually interoperable.
