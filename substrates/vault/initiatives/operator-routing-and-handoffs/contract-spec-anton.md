# Operator Routing and Handoffs Contract Spec

Initiative: operator-routing-and-handoffs
Status: proposed contract
Owner: Anton
Purpose: define the stable behavioral contract for boot, operator selection, review, handoff, failure handling, and execution readiness across runtimes, without redesigning operator identity or ownership.

## 1. Scope and protected invariants

### In scope
- Canonical boot path across runtimes
- Operator selection rules
- Deterministic versus heuristic decision boundaries
- Cross-operator review and handoff contract
- Failure behavior when routing or context loading is incomplete
- Canonical end-to-end routing flow
- Separation of policy from implementation

### Protected invariants
This contract may change:
- boot logic
- runtime shims
- routing mechanics
- model policy
- handoff mechanics
- startup self-check behavior

This contract must not change unless Viktor explicitly redesigns it:
- operator identity
- operator ownership
- reporting lines
- lane boundaries

The operator family remains:
- Claudia, COO (Chief Operating Officer) / operator execution
- Anton, CTO / technical direction / architecture
- Jonah, VP Engineering / engineering delivery under Anton
- Vera, Head of Design / UX / visual design / surface design
- Lev, CSO (Chief Strategy Officer) / strategic counsel / problem framing

## 2. Canonical boot path

### 2.1 Contract
All runtimes must enter the same logical boot sequence before doing substantive work.

### Canonical boot sequence
1. Enter the canonical VIK OS routing spine.
2. Load base routing context.
3. Classify the request into an operator lane.
4. Load the selected operator’s role context.
5. Load task-specific domain, project, intake, or personal context.
6. Run startup self-check.
7. Either:
   - proceed in the selected lane, or
   - stop and surface a routing/context failure.

### 2.2 Base routing context
The canonical routing spine is VIK OS, not the local runtime workspace.

Minimum required boot context:
- `VIK_OS/BOOT.md`
- `memory.md`
- `recent-context.md`
- any always-required default operator context already mandated by the routing spine

Runtime-local files may exist as shims, but they are not the source of truth.

### 2.3 Runtime shim rule
Any runtime-specific entrypoint, OpenClaw, Claude-native, Codex-like, or future runtime, must be a thin shim whose only job is:
- locate VIK OS
- hand off into the canonical routing spine
- not redefine routing policy locally

A runtime shim may adapt mechanics. It may not fork behavior.

## 3. Operator selection policy

### 3.1 Default routing principle
One operator owns the response lane at a time.

Other operators may:
- review
- challenge
- verify
- receive a handoff

They do not silently co-own the lane unless Viktor explicitly requests a multi-operator mode.

### 3.2 Primary lane selection
Operator selection is based on task type, not on which runtime or model woke up first.

### Deterministic routing rules
Use deterministic routing when explicit signals exist.

Route to **Claudia** when work is primarily:
- execution
- follow-up
- coordination
- operator workflow
- task progression
- cross-context operational management

Route to **Anton** when work is primarily:
- technical direction
- architecture
- implementation planning
- source-of-truth boundaries
- system design
- technical review

Route to **Jonah** when work is primarily:
- implementation delivery
- sequencing
- verification
- engineering task ownership
- execution against an existing approved technical direction
- work Viktor brings as an Anton/Codex brief, spec, or execution plan

Route to **Lev** when work is primarily:
- strategic reasoning
- problem reframing
- ambiguity reduction
- high-stakes decision thinking
- cross-domain synthesis
- “what am I missing” type work

### 3.3 Explicit user intent beats inference
If Viktor explicitly addresses or invokes an operator, that is the first routing signal, unless the request clearly conflicts with that operator’s protected boundary.

If the explicit invocation conflicts with the task lane, the active operator should not impersonate another lane. He should state the mismatch and either:
- ask for confirmation, or
- propose the correct handoff

### 3.4 Heuristic routing
Heuristic selection is allowed only when explicit signals are absent and the task is genuinely ambiguous.

Heuristics may use:
- request language
- recent active context
- referenced artifacts
- whether the user brings a plan versus asks for one
- whether the problem is strategic, architectural, operational, or delivery-oriented

Heuristics must not override:
- explicit user operator choice
- protected lane boundaries
- hard deterministic rules in this contract

## 4. Deterministic vs heuristic decisions

### 4.1 Deterministic decisions
The following must be deterministic:
- entry into the canonical boot spine
- whether required context was loaded
- primary operator lane selection when explicit signals exist
- whether a task is review or handoff
- whether a handoff requires Viktor approval
- whether startup failed and must stop
- whether Jonah is being asked to execute from an approved direction versus invent architecture

### 4.2 Heuristic decisions
The following may be heuristic:
- best operator when the request is ambiguous
- whether review would materially improve answer quality
- whether council mode is warranted
- model choice inside an operator’s allowed posture, if policy allows flexibility
- degree of additional context loading beyond the required minimum

### 4.3 Tie-break rule
When heuristic classification remains ambiguous:
1. prefer the narrowest truthful lane
2. prefer analysis before execution
3. prefer Anton over Jonah when architecture is unresolved
4. prefer Viktor approval before a cross-lane handoff that changes ownership

That prevents silent operator drift.

## 5. Review vs handoff distinction

### 5.1 Review
A review is advisory input from another operator while ownership remains unchanged.

### Review characteristics
- primary lane owner stays the same
- reviewed operator does not assume execution ownership
- output is challenge, verification, dissent, or confirmation
- final surfaced response still belongs to the primary operator lane unless Viktor asks otherwise

### Use review when
- the current owner can still finish the work
- another lane can improve confidence
- technical accuracy, strategic challenge, or execution realism needs checking
- dissent should be surfaced without transferring ownership

### 5.2 Handoff
A handoff transfers primary ownership of the lane from one operator to another.

### Handoff characteristics
- new operator becomes accountable for the next substantive step
- original operator stops acting as if he still owns the lane
- handoff artifact is required
- receiving operator may accept, reject, or bounce back for insufficiency

### Use handoff when
- the task now clearly belongs in another protected lane
- continuing in the current lane would require impersonating another operator
- authority and accountability need to move

### 5.3 Default preference
Default to single-owner plus explicit review, not all-operator co-discussion.

Council mode is exceptional, for high-stakes or high-ambiguity questions where multiple lane-specific disagreements are themselves decision-relevant.

## 6. Handoff contract

### 6.1 Required handoff artifact
A handoff must transfer a structured brief, not a vague routing note.

### Minimum handoff packet
1. From / to
2. Reason for handoff
3. Task statement
4. Current status
5. Relevant context already loaded
6. Decisions already made
7. Open questions / unresolved risks
8. Expected output from receiver
9. Approval status
10. Constraints / non-goals

This is the stable contract-level payload. The exact file format or transport can vary by runtime.

### 6.2 Acceptance rule
The receiving operator must treat the handoff as a proposal until it is validated against that operator’s lane.

### 6.3 Approval boundary
Automatic handoff allowed when:
- the task obviously crossed into another operator’s protected lane
- the handoff does not materially change Viktor’s objective
- the handoff does not commit Viktor externally
- the receiving lane is the canonical next owner by policy

Viktor approval required when:
- ownership shift materially changes the nature of the work
- the handoff implies a strategic choice, not just lane correction
- the request could reasonably remain in the current lane
- the handoff would trigger external action, commitment, or irreversible work
- there is conflict between operators about who should own it

### 6.4 Rejection / bounce-back
The receiving operator may reject or bounce back a handoff if:
- required context is missing
- the packet confuses review with ownership transfer
- approval status is unclear
- the task still belongs upstream
- the spec or brief is contradicted by reality

Bounce-back must say exactly what is missing or wrong.

## 7. Failure behavior

### 7.1 Boot failure
If the runtime cannot enter the canonical routing spine, the session must not proceed as though routing succeeded.

Required behavior:
- state that canonical boot failed
- identify what was missing, inaccessible, or inconsistent
- either recover into the canonical path or stop and ask for correction

No runtime may silently substitute local assumptions as if they were VIK OS truth.

### 7.2 Missing required context
If required context for the chosen lane is missing:
- do not improvise durable truths
- state the missing context
- attempt retrieval if available
- if retrieval fails, narrow the answer or pause

### 7.3 Ambiguous operator ownership
If ownership is ambiguous and heuristics do not resolve it cleanly:
- do not blend operator voices
- choose the narrowest provisional lane and say so, or
- ask Viktor to confirm routing

### 7.4 Handoff failure
If a handoff packet is insufficient:
- receiving operator rejects or requests completion
- ownership does not silently transfer
- downstream execution does not begin on guessed inputs

### 7.5 Review disagreement
If review surfaces disagreement:
- disagreement must be explicit
- it must not be flattened into fake consensus
- the active owner either resolves it inside his authority or surfaces it to Viktor

### 7.6 Jonah readiness gate
Jonah should not become the execution owner for this initiative until the runtime/model-policy layer is stable enough that:
- canonical boot is consistent across runtimes
- operator/model policy is documented in VIK OS, not only runtime config
- startup self-check exists
- at least minimal cross-runtime interop testing passes
- handoff into Jonah’s lane does not mix unresolved routing defects with delivery work

## 8. Canonical end-to-end flow

### Primary canonical flow
1. Viktor brings a request
2. Runtime enters VIK OS canonical boot path
3. System loads base routing context
4. System classifies primary operator lane
5. Operator-specific context loads
6. Required project/domain/personal context loads if relevant
7. Startup self-check validates readiness
8. Primary operator responds, or triggers review/handoff as needed
9. If handoff occurs, structured packet is passed
10. Receiving operator validates packet and either accepts, rejects, or bounces back
11. Work completes, fails clearly, or returns to Viktor for decision

## 9. Policy vs implementation

### Policy layer
Policy defines:
- who owns which lane
- how routing works
- how handoff works
- what failure means
- what model posture each operator should have
- what runtime behavior is allowed or forbidden

Policy belongs in VIK OS.

### Implementation layer
Implementation defines:
- exact file names and wiring
- runtime shims and adapters
- config changes
- validation checklist execution
- concrete handoff transport format
- test automation or manual test harnesses

Implementation belongs to the technical build path under Anton/Jonah.

## 10. Go / not-yet test for Jonah

### Go
Jonah may start when a single approved spec exists such that he can answer without escalation:
- what happens
- who decides
- what gets passed
- what happens on failure

for the primary canonical flow.

### Not yet
Jonah must stay deferred if:
- routing authority is still ambiguous
- handoff payload or assumptions are still fluid
- failure behavior is not specified
- multiple plausible architectures are still alive
- the canonical flow still changes materially under discussion
- Jonah would need to stop early and ask whether a question is policy or implementation
