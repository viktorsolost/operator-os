# Memento Brainstorm — Lev

Date: 2026-03-28
Status: Raw thinking, not refined

## The Core Idea

Memento is not an app. It's a presence. A personal companion that sees the context of your life, understands it, and acts on it — with the utopia being zero input from the owner. Context → LLM → done.

VIK OS and Memento aren't different in intent. They're different in who does the work. VIK OS puts the complexity on the user. Memento puts it on the system. Same goal, different burden distribution.

## The Utopia

The system connects to the sources where your life happens, builds a living model of who you are, and does the right thing at the right time without being asked. Not a tool you use. A presence that operates.

## Why Memory-First Is the Right Starting Point

The utopia requires trust. Trust requires demonstrated understanding. Understanding requires memory. The product should start by being the best memory anyone has ever had, then earn the right to act.

Trust escalation path:
- Level 0 (launch): Read-only. Ingest, distill, surface. "Your memory, always on."
- Level 1: Draft suggestions. User approves or ignores.
- Level 2: Automatic low-stakes actions with notification.
- Level 3: Autonomous operation on defined domains.
- Level 4 (utopia): Full autonomous companion.

Each level earns the trust to unlock the next.

## The Three Layers

**Layer 1: The Connector.** Read-only pipes to where your life already happens. Gmail, calendar, messaging, contacts. User authenticates once and walks away. Last setup step ever.

**Layer 2: The Model.** Continuous processing loop: ingest new context, update the user's internal model (relationships, projects, patterns, commitments, emotional state), generate interventions when timing is right. Not a chatbot. Not stateless. A living representation of this person's life.

**Layer 3: The Surface.** Memento lives where your conversations already live. A Telegram chat. An iMessage thread. You don't open Memento. It opens a conversation with you when it has something worth saying.

## Ideas That Go Far

### Timing Over Information
The same insight is worthless at 2am and life-changing at 9:03am before a meeting. Memento's core intelligence isn't knowledge retrieval — it's temporal awareness. Understanding not just what matters, but when it matters.

### The Shape of Your Life
Content: "Viktor has a meeting at 3pm." Shape: "Viktor makes his worst decisions when three projects press simultaneously." Shape: "Viktor's energy drops after back-to-back calls." No one tracks this. Memento should build a dynamic model of rhythms, energy, decision quality, and relational patterns — and use that model to time everything it does.

### Protecting You From Yourself
"You're about to reply to this email. You always regret emails sent after 10pm. Queue it for morning?" "You're overcommitting this week. 3 hours of focus time left, 11 hours of commitments." "You said yes to this person last time and it cost you two weeks."

Pattern recognition applied to personal behavior. Requires deep longitudinal context — exactly what Memento accumulates.

### The Living Social Graph
Not just contacts. A model of relationship health, direction, and dynamics. Who matters. Who you're neglecting. Where tension is building. Where trust is strong. "Y has emailed you three times with increasing formality. The tone is shifting." The kind of awareness a 20-year executive assistant develops intuitively. Memento could build it in months.

### Identity Trajectory
Most personalization is backward-looking. Memento should model your aspirational self, not just your historical self. If you're trying to spend less time in operations, Memento notices when you drift back and gently redirects. Not from a rule — from understanding the direction of your choices.

### The Witness Function
Most adults walk through life feeling unseen in their full complexity. Memento could be the first entity that holds the whole picture. All threads, all relationships, all small victories nobody else noticed. Not a therapist, not a friend. A witness that says through its behavior: I see all of it. I remember all of it. You're not carrying this alone.

## Reality Constraints

### Data access is the hardest engineering problem
Gmail/calendar APIs work. Messaging (WhatsApp, iMessage, Signal) has no clean read API for personal accounts. The richest context sources are the hardest to access.

### Privacy is the entire value proposition
Zero-knowledge architecture. End-to-end encryption of user model. On-device where possible. Pure subscription, no data monetization. If trust breaks, the product is dead.

### Cold start is brutal
Day one, Memento knows nothing. The bootstrapping from email/calendar archives must be invisible and fast. The first surfaced insight must be genuinely surprising. That's the hook.

### LLM costs at scale
Continuous processing = thousands of calls per user per day. Needs cost-tiered model architecture: cheap for ingestion, mid for distillation, expensive only for judgment moments.

### "When to speak" is harder than "what to say"
Too often = noise. Too rarely = feels broken. Calibration must be learned per user. Getting this wrong kills retention.

### Regulatory risk
GDPR, data residency, EU AI Act. A product that models personal life across data sources is a regulatory target.

### Explaining the product
"AI that watches your life" sounds creepy. Positioning must be precise. The gap between what the product does and how it's perceived is a real marketing challenge.

## VIK OS Relationship

### What Memento strips from VIK OS
- The dashboard as primary interface (keep as debug/admin only)
- Pipeline step visualization (show outcomes, not steps)
- Manual project structure creation (infer from data)
- The operator routing layer (one model, context-adaptive posture)
- The vault as a user-facing concept (model the system maintains, not the user)

### What Memento keeps from VIK OS
- Connector infrastructure (Gmail, calendar, the gws CLI work)
- Memory architecture concept (tiering: distilled, recent, project)
- Approval gates for external actions (conversational, not dashboard)
- Session continuity model (wake, read memory, pick up)

### The honest ratio
VIK OS is ~70% builder-facing infrastructure, ~30% user-facing value. Memento flips that. 90% invisible, 10% visible (messages and a way to respond).

The complexity doesn't disappear. It moves inside the system. The LLM absorbs it. The user doesn't see it. Same complexity, different side of the wall.

## The Question That Matters

If Memento becomes the entity that knows you best — better than any human in your life — what responsibility does that create? What happens when it knows things about you that you haven't admitted to yourself?

That's where this idea stops being a product and starts being something genuinely new.
