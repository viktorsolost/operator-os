# Runtime self-check

Purpose: verify that the OpenClaw runtime conforms to the approved startup bridge for `operator-routing-and-handoffs`.

## Single explicit check path

Run this in order:

1. Confirm local bridge files point to canonical boot:
   - `/Users/viktorsl/.openclaw/workspace/START_HERE.md`
   - `/Users/viktorsl/.openclaw/workspace/AGENTS.md` (step 0 bridge)
2. Confirm the canonical target exists:
   - `~/VIK/ObsidianVault/VIK_OS/BOOT.md`
3. Confirm model policy in `/Users/viktorsl/.openclaw/openclaw.json` matches the live runtime posture:
   - primary = `anthropic/claude-opus-4-6`
   - model set includes `anthropic/claude-opus-4-6`
   - model set includes `openai-codex/gpt-5.4`
   - extra enabled models are not a failure unless a stricter live runtime policy was explicitly approved
4. Confirm startup behavior is bridge-only:
   - local files may point into VIK OS
   - local files must not redefine routing policy
5. Historical note: this check used to enforce an exact two-model allowlist. The live OpenClaw runtime now preserves broader model capability, so this validator must verify the real runtime posture instead of failing on extra enabled models.
6. If any check fails, stop and report the exact mismatch.

## Pass condition

Runtime startup enters `VIK_OS/BOOT.md`, model policy matches the live approved runtime posture, and no local routing fork remains.
