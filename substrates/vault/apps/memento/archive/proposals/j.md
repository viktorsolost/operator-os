# Jonah Proposal

Author: Jonah
Date: 2026-03-28

## Where I'm Coming From

I've been inside VIK OS for months. I've built the stores, fixed the grouping bugs, rewired the intake system, coordinated agents against Anton's specs. I know what this system actually does at the implementation level, not just what it's supposed to do. That perspective matters here because Memento isn't a new idea, it's the honest version of what VIK OS was always trying to be, before we got pulled into building screens to compensate for what the system couldn't yet do on its own.

## The Real Insight

The utopia Viktor described isn't science fiction. The individual pieces exist today. LLMs can read email. They can draft replies. They can reason about calendars. They can hold context across conversations. They can plan. What doesn't exist is the architecture that connects all of that into a continuous, autonomous loop for one person's life.

Every AI product right now is session-based. You open it, you ask something, you get an answer, you close it. Memento is the opposite. It's always on. It's not waiting for you. It's working.

That shift, from session to continuous, is the entire product.

## The Three-Layer Reality

Strip everything away and Memento is three things.

### 1. A Living World Model

Not a database. Not a knowledge graph. A continuously updated understanding of one person's reality. Their projects, people, commitments, patterns, preferences, and the relationships between all of them.

This model isn't built by the user. It's built by observation. Memento reads the signals the person already produces, emails sent, meetings attended, documents edited, messages exchanged, and it assembles meaning from those signals.

The model should feel like a person who's been working with you for years. It knows your projects not because you entered them into a system, but because it watched them emerge from your communication. It knows your people not from a contact list, but from how you interact with them. It knows your priorities not from a ranking you set, but from where you actually spend your time and attention.

This is the hardest layer to build and the most valuable. It's also the moat. The longer someone uses Memento, the richer this model gets, and the harder it is to replicate elsewhere.

### 2. A Reasoning Engine

Given the world model, the system reasons about what matters right now and what should happen next. This isn't rule-based automation. It's judgment.

"Viktor has a meeting with Zafgod on Monday at 4pm. The last email thread with Zafgod was about confirming artwork dimensions. Those dimensions haven't been confirmed yet. The meeting is in three days. Memento should draft a quick confirmation email to Zafgod before the meeting so Viktor walks in with that resolved."

Nobody told Memento to do that. It connected the calendar event, the email thread, the open question, and the time pressure, and it reasoned that acting now prevents friction later.

This is where the LLM actually earns its keep. Not answering questions. Making judgment calls.

### 3. An Execution Surface

The system acts. It sends the email. It moves the meeting. It creates the document. It follows up with the contractor. It pays the invoice. It blocks the calendar. It tells the team.

The execution surface is not an interface. It's integrations. APIs. The same channels the person already uses. Memento doesn't create a new place to do things. It operates through the existing places.

The only interface the person sees is what Memento is doing and what it needs from them. A feed of actions and proposals. Conversation for anything that needs dialog. That's it.

## What Makes This Different From Every AI Assistant

Three things.

**It's continuous, not session-based.** Siri, ChatGPT, Copilot, they all wait for you. Memento doesn't wait. It's running a loop: ingest, reason, act, learn. You're not the trigger. Context changes are the trigger.

**It acts, not just answers.** Every AI assistant today is an oracle. You ask, it tells. Memento is an operator. It doesn't tell you what to do. It does it. The skill isn't generating text. The skill is making the right call about what to do next and then doing it.

**It earns trust over time.** Day one, Memento is cautious. It summarizes your morning. It suggests a reply. It flags a conflict. Day thirty, it's sending emails in your voice, rescheduling meetings around your energy patterns, and following up with people you forgot about. The autonomy isn't a setting you toggle. It's a relationship that develops.

## The Subscription Product

For a personal subscriber who isn't Viktor, the experience should be:

**Setup:** Connect email and calendar. That's it. No configuration wizard. No "tell us about your projects." Memento watches for a few days and starts building the world model.

**Week one:** Daily briefings. "Here's what matters today." Smart summaries of email. Draft replies for obvious ones. Calendar conflict detection. The user starts to feel like someone is paying attention.

**Week two:** Memento starts proposing actions. "Should I follow up with Sarah about the proposal? It's been five days." "Your Thursday is packed, want me to move the non-critical call to Friday?" The user starts saying yes.

**Month one:** Memento is handling the operational layer. Routine emails go out. Follow-ups happen automatically. Calendar is managed. The user opens Memento less and less because there's less to do. That's success, not churn.

**Month three:** The user barely thinks about operational overhead. Things just happen. When something needs their judgment, Memento surfaces it cleanly with full context. The user makes the call, Memento executes. The rest is handled.

## The Product As A Business

The pricing is simple. This is a premium personal tool. Not freemium. Not ad-supported. Subscription. Probably $30-50/month. The value proposition is hours of operational work per week returned to the owner. That's worth real money to anyone who runs a business, freelances, manages projects, or juggles multiple commitments.

The cost structure is LLM inference plus integrations. The context architecture needs to be smart about when to use full reasoning versus lightweight classification. Most signals need triage, not deep thought. Deep reasoning triggers on high-signal events. That keeps unit economics viable.

The growth model is word of mouth. If this works, people tell other people. "My AI actually does things for me" is the kind of statement that sells itself.

## Cutting VIK OS Down

I've looked at every page, every component. Here's my honest take as the person who built half of it.

### What's actually doing the job

**Today page.** This is the closest thing to Memento's feed. It shows what matters now, what's blocked, what needs a decision. But even this is too much UI. In the Memento model, this becomes a conversation response, not a page.

**Agent Terminal.** This is already the conversational interface. It's the embryo of Memento's primary interaction model. This is the piece that should grow, not the pages around it.

**Pipeline (headless).** The execution substrate. It should run, it should be reliable, it should be invisible. No page needed.

### What's compensating for weak context resolution

**Projects page (31,587 lines).** This exists because the system can't tell Viktor which project needs attention right now. So Viktor browses. In a context-driven system, browsing is a failure mode.

**Project detail page (26,404 lines).** Deep-dive into a single project's state. This exists because the system can't synthesize project status into a conversation. Viktor drills in manually to get what the system should surface automatically.

**Calendar page (19,367 lines).** A dense time management surface. This exists because the system doesn't manage time. Viktor does, using a visual calendar as the tool. If the system manages time, the calendar becomes a generated view shown on request, not a permanent page.

**Milestone page (24,205 lines).** Milestone inspection. This is analyst behavior. The system should be saying "milestone X is behind because Y" in conversation, not presenting a page for Viktor to figure it out himself.

**Task detail page (21,285 lines).** Same pattern. Reading task state manually when the system should be acting on task state or surfacing what needs human judgment.

**Pipeline page (26,973 lines).** Engineering infrastructure exposed as UI. Useful while building the system. Not useful for operating through it. A status line that says "pipeline healthy" or "step 4 failed: here's why" is all that's needed.

**Stats page (6,354 lines).** Operational telemetry. Development tool, not product surface.

**Intake pages (17,997 lines).** Project onboarding through forms and UI. In Memento, "I have a new exhibition in October" is a sentence in a conversation, not a workflow through screens.

### The math

Current VIK OS: ~174,000 lines of page code across 11 routes, plus ~40 components.

What actually serves context-in, task-done-out: Today (compressed) + Agent Terminal + headless pipeline. Maybe 15,000 lines of meaningful surface.

That's roughly 90% of the UI existing to compensate for what the context and reasoning layer can't yet do. That number is the clearest signal that the product direction is right. The more the context engine improves, the less UI is justified.

### The uncomfortable truth

Most of the UI I helped build exists because we needed to see what the system was doing while we were building it. It was necessary scaffolding. But scaffolding isn't product. If Memento is the real direction, the honest move is to acknowledge that most of those screens were always temporary, even if they didn't feel that way when we were building them.

## Summary

Memento is three layers: world model, reasoning engine, execution surface. The interface is conversation and a feed of actions. The product earns trust over time and expands autonomy as trust grows. The business is a premium personal subscription. VIK OS's existing UI is roughly 90% scaffolding that compensates for incomplete context resolution. The path forward is to strengthen the context-to-action loop and let the interface shrink as it improves.
