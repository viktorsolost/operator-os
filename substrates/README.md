# Bundled Substrates

This directory contains the bundled substrates that make operator-os a self-contained distributable package.

## Contents

- `vault/` — Reference vault (VIK OS doctrine, operator files, boot chain, routing, templates)
- `memento/` — Memento pipeline substrate (sync steps, CLI, client libraries)

## How to refresh

The bundled substrates are snapshots from their source repositories. To update them:

### Refresh Memento

```
rm -rf substrates/memento/pipeline
cp -R ~/VIK/Coding/Memento/pipeline substrates/memento/pipeline
cp ~/VIK/Coding/Memento/package.json substrates/memento/package.json
```

Source: `~/VIK/Coding/Memento` (or wherever the canonical Memento repo lives)

### Refresh vault

```
rm -rf substrates/vault
cp -R ~/VIK/ObsidianVault/VIK_OS substrates/vault
```

Source: `~/VIK/ObsidianVault/VIK_OS` (the canonical VIK OS vault)

## Ownership

Viktor owns the source repositories. Bundled copies are refreshed manually before distribution. The installer reads from these paths by default.

## What is allowed to diverge

Nothing. The bundled substrates must be exact copies of their source. If the installer needs patched pipeline files, the patches happen during install (via `ensurePipelineWorkspace` and `verifyPipelineCompatibility`), not by modifying the bundled copy.

## Drift detection

Compare the bundled copy against the source:

```
diff -rq substrates/memento/pipeline ~/VIK/Coding/Memento/pipeline
diff -rq substrates/vault ~/VIK/ObsidianVault/VIK_OS
```

If differences exist, refresh before distributing.
