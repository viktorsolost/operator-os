## 1. Framing

The system should not be framed as a generic dashboard or a company-wide database. It should be framed as a personal execution environment for one employee at a time. Each person runs their own app on their own machine. Each app connects to shared company systems such as Basecamp, Google Sheets, Drive, calendar data, and meeting notes.

The value proposition is simple: a person opens the app and can ask, “What do I need to do today?”, “Why does this matter?”, “How do I solve this?”, and eventually, “Can you do it for me?”. The agent answers from project context, human-readable memory, and live references when needed.

## 2. How The System Actually Works

The cleanest way to think about the architecture is in three layers. These layers are different and should stay different.

### Layer 1: External Source Truth

The real business truth lives upstream.

- Basecamp projects and todos

- Google Sheets and planning tables

- Drive folders and files

- Calendar and meeting sources

### Layer 2: Local Operational Truth

The app needs its own canonical runtime state.

- Synced JSON snapshots

- Derived project store

- Task status and execution state

- Action plans and action steps

### Layer 3: Local Meaning and Memory

The human and the agent need durable meaning, not just data.

- Project markdown notes

- Decision logs

- Reasoning summaries

- Thread history and notes

In this model, the upstream systems are the deepest truth. But inside each person's app, the local store still becomes the canonical operational truth for that app, and the markdown layer becomes the durable meaning layer. This is not contradictory. It is a deliberate layered design.

### Local App Behavior

- Syncs from shared systems on schedule and on demand.

- Builds local project views and task views for that person.

- Stores agent-readable memory per project instead of one giant company memory blob.

- Lets the agent answer from local context fast, then verify live when timing matters.

- Supports guarded write-back into shared tools when the user approves.

### What “Live Check” Means

Most questions should be answered from the local context packet for speed and stability. But when the answer could have changed recently, the agent should be required to verify against the upstream system. Examples:

- “Is this task still open in Basecamp?”

- “Did the Google Sheet change this morning?”

- “Did someone add a note on the meeting doc?”

- “Can you post the update into the live system now?”

## 3. Why This System Is Strong

### What most tools do

- Search across company knowledge

- Summarize docs or chats

- Answer questions

- Automate narrow workflows

### What this system does

- Tracks project execution state

- Stores human-readable memory and decisions

- Builds role-specific task context

- Lets an agent explain, verify, and act

The system is strong because it combines canonical operational state with durable human memory. The JSON/store layer answers “what is true in the app right now?” The markdown layer answers “what happened, why, and how should we think about it?”

## 4. What The First Internal Product Should Be

Do not try to ship a company platform first. Ship a Version 1 for one teammate . The target is not “everyone at the company.” The target is one specific person with a clear job and repeatable daily loop.

### The First User Should Be Able To Do Five Things

- Open the app and immediately see what they need to do today.

- Ask the agent why each task matters and how to solve it.

- Let the agent inspect current references when freshness matters.

- Approve or reject proposed actions with clear boundaries.

- Trust that notes, decisions, and task state will still be there tomorrow.

## 5. Competitive Context

There are real comparables in the market, but none appear to match this exact local, project-memory-driven operator model. The closest commercial products are enterprise assistants that unify search, context, and actions across many company apps.

### Public Pricing Snapshot

## 6. Challenges

### Product Challenges

- Defining what the agent should do automatically versus only with approval

- Preventing the agent from confusing cached truth with live truth

- Making the memory system useful without becoming noisy or bloated

- Keeping the interface simple enough for a non-builder teammate

### Technical Challenges

- Packaging the app so a teammate can install it reliably

- Managing connector auth and token refresh for each person

- Giving the agent tool access without making the system unsafe

- Supporting live checks without making every action slow or brittle

### Main Risks

- Trust boundary confusion: the system must distinguish source truth, local derived truth, memory, and agent interpretation.

- Setup burden: if first-time setup takes an hour and needs engineering help, adoption will be weak.

- Auth fragility: tokens, connector permissions, browser session assumptions, and local environment differences can break the experience.

- Agent overreach: action-taking must be staged through clear policy: read, propose, approve, execute.

## 7. How To Get The First Person To Use It

The first rollout should feel like solving that teammate’s day, not like asking them to test a complicated internal tool.

- Choose the right person. Pick someone with recurring work, real deadlines, and enough tolerance for a sharp but unfinished tool. Do not pick someone whose work is too chaotic or totally unlike everyone else’s.

- Define their default questions. Start from the three questions they ask every day: what do I need to do, why does it matter, what is the next action.

- Preload their world. Their projects, references, identity, role, and working style should already exist in the system when they open it.

- Keep the first action loop narrow. The agent should be able to read, explain, verify, and maybe draft updates before it is allowed to do more.

- Watch real usage. Observe where the teammate hesitates, where the agent is unclear, and where setup or trust breaks.

## 8. Installation And Setup Difficulties

### Why Setup Is Hard

- Every person has their own machine, filesystem, login state, and app permissions.

- Some connectors are company-scoped, while others are user-scoped.

- The agent needs local memory and local configuration but should still access shared company truth.

- Obsidian and the local vault layer introduce path, template, and naming assumptions.

### Likely Setup Pain Points

- Installing the desktop app or unpackaged local runtime

- Installing or configuring Obsidian

- Cloning or provisioning the correct vault structure

- Logging into Basecamp, Google, and any other connectors

- Setting local environment variables and API keys

- Making sure the app can find the vault, runtime folders, and writeable state directories

## 9. How To Package This So You Can Hand It To Someone

The target should be a distribution model that does not require the new user to understand the repo. The more the onboarding looks like “install app, sign in, confirm vault location, answer profile questions,” the better.

### Package Goal

One installable app with a first-run setup wizard.

### Local Contents

App binary, local runtime state folders, connector config, memory templates, first-run checks.

### What To Avoid

Manual repo clone, manual path edits, unclear token files, asking the user to run terminal commands.

### Recommended Packaging Path

- Ship a signed desktop build of the Electron app.

- Add a first-run onboarding flow inside the app.

- Move local configuration into a single managed settings location.

- Generate runtime folders automatically on first launch.

- Ship project/vault templates with the app.

- Embed setup diagnostics so the app can tell the user what is missing.

## 10. Obsidian Setup For The Teammate

If the markdown memory layer remains central, Obsidian should be treated as a supported part of the product, not a sidecar.

### What The User Needs To Tell The System

- Who they are

- Their role

- Which projects they own or participate in

- What kinds of decisions or tasks they care about

- How the agent should treat approvals and automation for them

### Recommended First-Run Obsidian Flow

- Prompt the user to select an existing Obsidian vault or create a new company work vault.

- Create a standard folder structure automatically.

- Write the user identity file and working-style file from onboarding answers.

- Create project-local folders only for projects relevant to that user.

- Seed template files: decisions, references, summary, notes, and captures.

### Suggested Minimum Vault Structure

VIK_OS/

- operator/identity.md

- operator/working-style.md

- operator/captures.md

- projects/{project_id}/summary.md

- projects/{project_id}/decisions.md

- projects/{project_id}/references.md

- intake/{project_id}/summary.md

- intake/{project_id}/decisions.md

## 11. API And Connector Login Requirements

The user will need guided sign-in for the systems the app relies on. This should be a setup screen, not a manual engineering task.

### User-Scoped Logins

- Google account for Sheets, Drive, Calendar, Docs

- Basecamp account if user-specific access is required

- Any company internal tools that use personal credentials

### App-Scoped Configuration

- OpenAI or model-provider credentials where needed

- Feature flags and rollout permissions

- Company connector endpoints and shared integration settings

### First-Run Setup Wizard Should Ask For

- Who are you and what is your role?

- Which projects should this app load for you?

- Where is your Obsidian vault, or should the app create one?

- Connect Google.

- Connect Basecamp.

- Connect any other company-required sources.

- Choose agent permissions: read-only, draft-first, or approved actions.

## 12. Recommended Permission Model

## 13. Practical Rollout Plan For The First Person

- Week 1: Define the user and their loop. Pick the teammate. Write their top ten recurring tasks and top five recurring questions.

- Week 2: Package and preload. Deliver an installable build, set their vault path, pre-connect project scope, and seed their profile files.

- Week 3: Read-only use. Let them use the app to ask what they need to do, why, and how. Do not rely on action-taking yet.

- Week 4: Draft-first actions. Allow the agent to draft updates or proposed changes that the user can approve or reject.

- Week 5+: Expand actions gradually. Only automate the workflows that were used repeatedly and proved safe.

## 14. What Must Be True Before Handing It To Someone

- The app installs without repo-level setup.

- The user can log in without engineering help.

- The vault path and template creation are automatic or guided.

- The agent can clearly distinguish cached state from live verification.

- Every action path has logging and approval boundaries.

- The user can recover from setup mistakes without touching code.

## 15. Bottom Line

This is feasible. The concept is strong. It is not the same as a generic enterprise assistant, and that is a good thing. The strongest version of the idea is not “a company AI portal.” It is “one smart execution environment per person, connected to shared company reality.”

The next practical milestone is not scaling to everyone. It is building a clean, installable, guided Version 1 for one teammate , with a stable local memory layer, verified connectors, readable project context, and safe action boundaries.
