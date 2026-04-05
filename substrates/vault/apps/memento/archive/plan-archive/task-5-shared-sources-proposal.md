# Task 5: Shared Sources — Proposal for Anton

## Problem

The canonical exhibition SOP (`Eterno_EXB_SOP`, Google Doc ID `1L5WX9Iz_LlnTt1iCbKO0YSDP3Vma_RTJowkIxddYUaI`) lives in Viktor's personal Drive folder `Eterno` (`17EqnW1XhjnYUQcF8RDsLbXYR5L1MIApv`, on gws-personal). It applies to all exhibitions, not one project. The registry and drive_sync currently only scope to project-level `drive_folder_ids`.

## Options

### Option A: `shared_sources` field in registry.json

Add a top-level `shared_sources` section to registry.json:

```json
{
  "shared_sources": {
    "drive_folder_ids": ["17EqnW1XhjnYUQcF8RDsLbXYR5L1MIApv"]
  },
  "projects": [...]
}
```

drive_sync would crawl shared_sources in addition to per-project folders. The linker would tag captures from shared sources as `shared` (no project assignment) or apply a new linking rule that matches them to all active projects of a given type.

Pros: clean separation, no ownership lie, extensible for future cross-project resources.
Cons: needs new drive_sync logic, new linker behavior for shared captures, new journal entry handling.

### Option B: `shared_sources` with explicit project scope

```json
{
  "shared_sources": [
    {
      "source": "drive",
      "id": "17EqnW1XhjnYUQcF8RDsLbXYR5L1MIApv",
      "applies_to": ["punks-2026", "lucas-zanotto-2026"],
      "label": "Eterno SOP folder"
    }
  ],
  "projects": [...]
}
```

Captures from this folder get linked to all listed projects. More explicit than Option A.

Pros: no ambiguity about which projects see the resource.
Cons: must update applies_to when new exhibition projects are added.

### Option C: Type-scoped shared sources

```json
{
  "shared_sources": [
    {
      "source": "drive",
      "id": "17EqnW1XhjnYUQcF8RDsLbXYR5L1MIApv",
      "applies_to_type": "exhibition",
      "label": "Eterno SOP folder"
    }
  ],
  "projects": [...]
}
```

Captures auto-link to all active projects of type `exhibition`. No manual project list to maintain.

Pros: zero maintenance when new exhibitions are added.
Cons: if a shared folder contains project-specific files, they'd link everywhere.

## Jonah's recommendation

Option C. The SOP is exhibition-scoped by definition. New exhibitions should automatically inherit it. The SOP folder is unlikely to contain project-specific files. If it does, we can add exclusion rules later, but that's not the current problem.

## Implementation impact

Whichever option Anton picks, the changes touch:
- `state/registry.json` (schema addition)
- `pipeline/steps/drive_sync.js` (crawl shared sources, needs gws-personal account)
- `pipeline/lib/project_linking/linker.js` (link shared captures)
- `docs/contracts/project-linking.md` (contract update for shared source tier)

Note: the SOP folder is on gws-personal, not gws-eterno. drive_sync currently hardcodes gws-eterno. This also needs a fix to support multiple Drive accounts.

## Decision needed

Anton: pick an option (or propose another), and Jonah will implement.
