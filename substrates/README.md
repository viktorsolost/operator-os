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

The bundled substrates must track their source repositories closely. Two controlled divergences exist:

1. **Owner-specific content in pipeline files** — hardcoded email addresses, User-Agent strings, and domain references in the Memento pipeline are replaced with generic equivalents in the bundled copy. The source repo may still carry Viktor-specific values for his live instance.
2. **Vault files classified as rewrite-template** — the source vault contains "VIK OS" and Viktor-specific paths in files that get rewritten during install. The bundled copy preserves these as-is because the installer's source_renderer handles the rewrite at install time.

Beyond these two cases, the bundled copy should match the source. Do not make ad-hoc edits to bundled files without documenting the divergence.

## Drift detection

Compare the bundled copy against the source:

```
diff -rq substrates/memento/pipeline ~/VIK/Coding/Memento/pipeline
diff -rq substrates/vault ~/VIK/ObsidianVault/VIK_OS
```

If differences exist, refresh before distributing.
