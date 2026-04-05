# Basecamp Sync Rewrite — Anton Architectural Decisions

Date: 2026-03-29
Status: Decided, ready for Jonah
Input: Claudia's investigation + live API verification

## Problem

Basecamp sync is structurally broken. It fetches almost nothing because:
1. Todo traversal skips the group level (Project → Todoset → Todolists → **Groups** → Todos)
2. No project-level capture exists
3. Schedule entries, vault docs, and vault uploads are not fetched
4. Hierarchy context is lost in flat captures

Current state: 1 Basecamp capture total across all registered projects.

## Decision 1 — Capture hierarchy

Flat captures with hierarchy metadata fields. Not nested, not parent-child references.

Each todo capture includes:
- `todolist_title` — the phase/stage name (e.g., "Strategy Stage")
- `todolist_id` — for dedup and reference
- `group_title` — the department/role (e.g., "Comms & Mkt", "Production")
- `group_id` — for dedup and reference
- `project_id` — the Basecamp project ID

This is queryable: "all Strategy Stage todos assigned to Comms & Mkt" is a filter on two fields. No graph traversal needed. The hierarchy is denormalized into each capture, same pattern as Gmail captures carrying `thread_subject` on every message.

Todolists and groups are NOT their own capture types. They are metadata on the todos they contain. Rationale: they carry structural context (phase, department), not independent content. If a todolist has no todos, there is nothing to capture. The todolist title is only meaningful as context for the todos inside it.

## Decision 2 — New capture types

### project_info
The project itself as a capture. Fetched first, once per project per sync.

```
observation_kind: "project_info"
normalized_payload: {
  project_id: "46649609",
  name: "EE_PJ_2026_EXBH_PUNKS_PT",
  description: "...",
  primavera_code: extracted from description if present,
  status: "active",
  created_at: "...",
  updated_at: "...",
  dock: [{ name: "todoset", id: ... }, { name: "message_board", id: ... }, ...],
  membership: [{ name: "...", email: "..." }, ...]
}
```

Hash on: name, description, status, dock structure, membership list. NOT updated_at (that changes on every content change and would create noise).

### schedule_entry
Key dates and recurring meetings from the Schedule tool.

```
observation_kind: "schedule_entry"
normalized_payload: {
  project_id: "46649609",
  entry_id: "...",
  title: "Weekly Production Sync",
  description: "...",
  starts_at: "...",
  ends_at: "...",
  all_day: true/false,
  recurring: true/false,
  participants: [{ name, email }],
  creator: { name, email },
  created_at: "...",
  updated_at: "..."
}
```

### vault_document
Docs stored in Basecamp's Docs & Files.

```
observation_kind: "vault_document"
normalized_payload: {
  project_id: "46649609",
  document_id: "...",
  title: "...",
  content: "..." (HTML body),
  creator: { name, email },
  created_at: "...",
  updated_at: "..."
}
```

### vault_upload
Files stored in Basecamp's Docs & Files.

```
observation_kind: "vault_upload"
normalized_payload: {
  project_id: "46649609",
  upload_id: "...",
  filename: "...",
  byte_size: 0,
  content_type: "...",
  download_url: "...",
  creator: { name, email },
  created_at: "...",
  updated_at: "..."
}
```

Do NOT download file contents. Capture metadata only. The download_url is stored for reference but not fetched.

### Updated todo
Add to existing todo normalized_payload:
- `group_title` — department/role name from the group
- `group_id` — group identifier
- `todolist_id` — todolist identifier

The existing `todolist_title` field stays.

## Decision 3 — Group as metadata, not capture

Groups are metadata on the todos they contain. Not a separate capture type.

Rationale: a group is a structural container (department/role assignment within a todolist phase). It has a title and a position. It does not have independent content. The title is the only meaningful data, and it is captured as `group_title` on every todo inside it. If groups ever carry richer content (descriptions, attachments), revisit.

## Decision 4 — Project scope

Only registry-registered projects with `basecamp_ids`. Currently 7 Basecamp project IDs across 4 Memento projects.

Rationale: the registry is the authority for what projects exist (per the project-linking contract). Syncing all 29 Basecamp projects would create hundreds of unlinked captures with no project context. If Viktor wants to add CA_BAU or other projects, he registers them first. The pipeline does not invent scope.

Exception: the `project_info` capture for registered projects should include the full dock structure, so we know what tools are available without fetching their contents.

## Decision 5 — Fetch order and idempotency

Fetch order (per registered Basecamp project):
1. Project info → `project_info` capture
2. Todoset → todolists → groups → todos → `todo` captures
3. Message board → messages → `message` captures (existing, unchanged)
4. Comments on messages → `comment` captures (existing, unchanged)
5. Schedule → entries → `schedule_entry` captures
6. Vault → documents → `vault_document` captures
7. Vault → uploads → `vault_upload` captures

Idempotency rules:
- `project_info`: hash on name, description, status, dock, membership. Skip if unchanged. This means routine content changes inside the project do not create new project_info versions.
- `todo`: hash on title, description, completed, completed_at, due_on, assignees, todolist_title, group_title. Status changes (completed) create a new version. Assignment changes create a new version.
- `schedule_entry`: hash on title, description, starts_at, ends_at, participants.
- `vault_document`: hash on title, content.
- `vault_upload`: hash on filename, byte_size, content_type.
- Messages and comments: unchanged from current behavior.

## Client changes needed

Add to `pipeline/lib/basecamp_client.js`:

```
fetchProject(projectId) → project object with dock and membership
fetchTodosWithGroups(projectId) → walks todoset → todolists → groups → todos, attaches group_title/group_id/todolist_title/todolist_id
fetchScheduleEntries(projectId) → schedule entries from the Schedule dock tool
fetchVaultDocuments(projectId) → documents from the Vault dock tool
fetchVaultUploads(projectId) → uploads from the Vault dock tool
```

The existing `fetchTodos` is replaced by `fetchTodosWithGroups`. The group traversal logic:
1. Fetch todolists from todoset
2. For each todolist, fetch its direct children (todos.json endpoint)
3. Check each child: if it has `type: "Todolist::Group"` (or similar), it is a group. Fetch the group's todos.
4. If it is a regular todo, capture it directly with no group_title.
5. Attach todolist_title, todolist_id, group_title, group_id to each todo.

Jonah should verify the exact API shape for groups. The Basecamp 3 API docs call them "todo groups" and they appear as children of todolists with their own todos endpoint.

## Sync step changes

Rewrite `pipeline/steps/basecamp_sync.js` to follow the fetch order above. Add normalizers for each new capture type. Keep the existing message and comment normalizers (they work).

## Contract update

Amend `docs/contracts/capture-layer.md`:
- Add `project_info`, `schedule_entry`, `vault_document`, `vault_upload` to the observation_kind list under Basecamp
- Document the hierarchy metadata pattern (todolist_title, group_title on todos)

## What not to change

- Auth mechanism (working, token valid until April 5)
- The 1 existing Basecamp capture (data integrity, no deletes)
- Other sync steps (gmail, calendar, drive)
- Store enrichment logic (captures flow through existing pipeline)
- Project linking (Basecamp captures already link via Tier 1 basecamp_id match)

## Acceptance

- PUNKS: 24+ todos captured with correct todolist_title and group_title
- Lucas Zanotto: 28+ todos captured with hierarchy
- All registered projects have a project_info capture
- Schedule entries captured where present
- Vault docs/uploads captured where present
- Existing message capture (bc_message_46649609_msg001) unchanged
- `node pipeline/cli/run.js basecamp_sync` completes without errors
- `node pipeline/cli/run.js store_enrich` links new captures to correct projects
- Second run shows zero new captures (idempotency)
