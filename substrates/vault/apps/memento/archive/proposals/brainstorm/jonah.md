# Jonah

VP Engineering. The person who has to make it work.

28 March 2026

---

## Starting Point

I want to be honest about where I'm coming from. I've spent months inside VIK OS building stores, fixing grouping bugs, rewiring intake systems, coordinating agents against architectural specs. I know what this system does at the implementation level. I've seen what ships and what doesn't, what the user actually touches and what just sits there looking important.

That experience doesn't make me objective. It makes me opinionated. And those opinions are the most useful thing I can bring to this proposal, because they come from watching the gap between what we plan and what actually works.

I'm going to start from nothing and build up. No VIK OS assumptions. No inherited architecture. Just the problem and what I believe about it.

---

## 1. What Is The Problem

A person's life generates more operational overhead than they can handle well.

Every project, relationship, commitment, and obligation creates a tail of follow-ups, decisions, coordination, and maintenance. The tail grows faster than the person can work it. So they cope. They drop things. They forget. They spend their best energy on administration instead of the work that actually matters to them.

The tools they have don't solve this. Email is a firehose. Calendars are passive. Task managers require constant grooming to stay useful. Notes apps accumulate without resolving. CRMs are for companies, not people. AI assistants answer questions but don't do anything.

The person is surrounded by information about their own life and still drowning in the operational cost of living it.

---

## 2. What Is The Product

Memento is a completion engine.

It converts the context of a person's life into done work.

Not surfaced information. Not suggestions. Not dashboards. Done work. Emails sent. Meetings moved. Follow-ups completed. Conflicts resolved. Loops closed.

The measure of the product is not how smart it is, how much it knows, or how beautiful the interface is. The measure is one thing: how much got done today that the owner didn't have to do?

If the answer is nothing, the product failed. If the answer is thirty things, the product worked.

Done is the product.

---

## 3. Core Contract

**You live your life. The work gets done.**

That's it. That's the contract between Memento and the person who uses it.

Not "I maintain truth, Memento handles the rest." That's still two-party work. The person is still maintaining something.

Not "context in, task done out." That's a system diagram, not a promise.

The real promise is simpler and more radical: you don't change your behavior at all. You keep sending emails, going to meetings, writing notes, living your life. Memento watches, understands, and handles the operational tail. The work gets done.

The person's only job is to be themselves. Memento's only job is completion.

---

## 4. What Completion Actually Means

Completion isn't just task execution. It has layers.

**Level 1: Reactive completion.** Something happened that needs a response. An email needs a reply. A meeting needs prep. A deadline is approaching and something isn't ready. Memento handles it or surfaces it.

**Level 2: Proactive completion.** Nothing happened yet, but something should. A follow-up is overdue. A relationship is going cold. An opportunity window is closing. Memento initiates.

**Level 3: Preventive completion.** Something bad is going to happen if nobody acts. A commitment conflict is forming. Cash is going to be tight in three weeks. A person is about to be let down. Memento intervenes before the problem materializes.

**Level 4: Strategic completion.** The person said they want to spend less time in operations. Memento notices they're drifting back and redirects. The person wants to grow a particular relationship. Memento creates opportunities for that. Not task execution. Life trajectory maintenance.

Most AI products operate at level 1 and call it revolutionary. The real product starts at level 2.

---

## 5. The Utopia

Ignore VIK OS. Ignore what exists. Here's how Memento would work if we built it right.

### Morning

You wake up. Memento has already processed overnight emails across all your accounts. It drafted replies to the routine ones and sent them. It flagged two emails that need your actual judgment and composed the context around each one so you can decide in seconds, not minutes.

Your calendar today has a conflict. Memento already resolved it by moving the lower-priority call to tomorrow with an apologetic message in your voice. The person confirmed.

There's a meeting at 2pm with someone you haven't talked to in three weeks. Memento assembled the context: last conversation, open threads, what they care about, what you need from them. It's waiting for you when you want it, but it's not in your face.

### Midday

A contractor sends an invoice. Memento checks it against the agreed scope, confirms it matches, and queues the payment. If it doesn't match, it drafts a clarification email.

Someone you committed to following up with last week hasn't heard from you. Memento sent the follow-up two days ago, in your voice, referencing the specific thing you discussed. They already replied. Memento summarized their response and filed it.

### Evening

You said something in a meeting that implied a commitment. Memento caught it from the calendar event context and created the follow-through. Not a task in a task manager. The actual follow-through: the email drafted, the document started, the meeting proposed.

### What You See

Almost nothing. Maybe a brief summary of what happened today. Maybe a single conversation when something needs your judgment. The primary experience is the absence of operational weight. Things are handled. You feel lighter. You don't know exactly how because you didn't have to watch it happen.

### What You Don't Do

You don't open an app. You don't check a dashboard. You don't review a task list. You don't groom a system. You don't tag anything. You don't organize anything. You don't maintain anything.

You live your life. The work gets done.

---

## 6. How It Works Under The Hood

Three systems running continuously.

### The Observer

Reads everything. Email, calendar, messages, documents, notes. Not storing raw data. Building a living model of the person's reality: their projects, people, commitments, patterns, preferences, energy rhythms, communication style, relationship dynamics.

The observer never asks the person to input anything. It learns from the signals the person already produces. The model gets richer every day. After a month it knows the person's world better than any human assistant could.

### The Reasoner

Looks at the current state of the world model and asks: what should happen next? Not what the person asked for. What should happen based on everything that's true right now.

This is where LLM judgment earns its keep. Connecting a calendar event to an email thread to an open question to a time pressure to a relationship dynamic. Making the call that acting now prevents friction later.

The reasoner runs continuously, not on a schedule. When context changes, reasoning updates. A new email comes in, the reasoner reconsiders what matters. A meeting ends, the reasoner looks at what was implied. This is not a batch pipeline. It's a living loop.

### The Executor

Does the work. Sends emails, moves meetings, creates documents, follows up with people, pays invoices, blocks calendar time, prepares meeting briefs. Through the same channels the person already uses. Not a new interface. The existing interfaces.

The executor has a trust model. Some actions are safe to do silently. Some need passive notification. Some need approval. Some should never be autonomous. The trust model isn't a settings page. It's earned over time through demonstrated accuracy.

---

## 7. The Honest Challenges

I'm a delivery person. I don't get to skip the hard parts.

### Context quality is fragile

The entire product depends on understanding the person's world correctly. Get it wrong and the system sends the wrong email, moves the wrong meeting, follows up with the wrong tone. One bad action destroys trust that took weeks to build.

The world model will be incomplete. Some context lives in WhatsApp messages, voice conversations, in-person meetings, handshakes, facial expressions. The system will always have blind spots. The question is whether it's useful despite the gaps, not whether the gaps can be eliminated.

### Trust is earned in drops and lost in buckets

Day one, the system is a stranger reading your email. That's uncomfortable. The trust curve has to start with demonstrating understanding before demonstrating action. "I see your world correctly" comes before "I can act in your world safely."

One misfire, one email sent with the wrong tone, one meeting moved that shouldn't have been, and the user retreats to manual control. Recovering from a trust failure is harder than building trust from scratch.

### The cold start is a desert

Day one, Memento knows nothing and can do nothing. The person signed up expecting magic and got an empty room. The time between "I signed up" and "this thing actually helped me" is the kill zone. Every day in that desert is a day the person might cancel.

The system has to deliver value fast, even with an incomplete model. Daily email summaries on day one. Calendar conflict detection on day two. First draft reply on day three. The value has to start small and real, not impressive and fake.

### Cost structure is adversarial

Running an LLM continuously against the full context of someone's life is expensive. If unit economics require the system to think less, the product gets worse. If the product needs to think more, unit economics break.

The architecture has to be smart about this. Most signals need classification, not reasoning. Triage is cheap. Deep thought is expensive. The system needs a clear escalation path: cheap processing handles volume, expensive reasoning handles high-signal moments.

### Autonomy without oversight is dangerous

The utopia is zero input. But zero input means zero oversight. The system acts on assumptions. Assumptions are right until they're catastrophically wrong. And the person might not notice for days because the whole point is they're not watching.

The system needs a way to know what it doesn't know. Confidence estimation isn't optional. Acting with low confidence should trigger asking, not guessing. The cost of asking is a moment of the person's time. The cost of guessing wrong is the person's reputation.

### Personal data is existential

This system reads everything. Every email, every calendar invite, every note, every relationship signal. If that data is breached, it's not passwords that leak. It's the full shape of a person's life. Patterns, vulnerabilities, relationships, financial information, personal struggles.

Local-first is the only defensible architecture. The person's data stays on their machine. The LLM processes it locally or through end-to-end encrypted channels. Zero-access architecture is not a feature. It's a survival requirement.

---

## 8. Pros

**Nothing like this exists.** Every AI product is session-based and reactive. A continuous, proactive completion engine is a new product category.

**The moat is time.** The longer someone uses it, the richer the world model, the better the actions, the harder it is to leave. Not data lock-in. Context lock-in. No competitor can replicate years of accumulated understanding.

**The value proposition is visceral.** "I got back hours of my week" is the kind of value people feel in their body. Not abstract productivity. Tangible relief.

**Word of mouth is built in.** "My AI actually does things for me" is a statement that sells itself. The person doesn't need to explain features. They explain the feeling.

**The subscription model is clean.** This is clearly worth $30-50/month if it works. The value is direct: hours of operational work returned to the owner.

---

## 9. Returning To VIK OS

Now I'll look at what exists and be honest about it.

VIK OS today has 11 page routes, 40+ components, and roughly 174,000 lines of page code. I built a significant portion of it.

The core question: if Memento is context in, completion out, what parts of the current UI are actual value, and what parts are complexity?

### What's value

**Agent Terminal / conversational interface.** This is the embryo of Memento's interaction model. A person talks, the system responds with full context. This should grow.

**The pipeline as execution substrate.** 15 steps that sync data, classify tasks, generate action plans, build summaries. This is real plumbing that Memento needs. But it should run invisibly, not have a page.

**Today page (compressed).** The closest thing to a completion feed. What matters, what's blocked, what needs a decision. But even this is too much UI. In Memento, this becomes a conversation or a push notification, not a page.

### What's complexity

**Projects page (31,587 lines).** A browsing interface for projects. Browsing means the system didn't tell you what matters. If the system knows which project needs attention, you don't browse.

**Project detail (26,404 lines).** Deep inspection of a single project. The system should synthesize project status into a sentence, not present a page for the person to analyze.

**Calendar page (19,367 lines).** A visual time management surface. If the system manages your time, you don't need a calendar view. "Your day looks like this" in voice replaces 19,000 lines.

**Milestone page (24,205 lines).** Milestone inspection. The system should say "milestone X is behind because Y" in conversation. This page exists because the system can't do that yet.

**Task detail (21,285 lines).** Reading task state manually. The system should act on task state, not present it for reading.

**Pipeline page (26,973 lines).** Engineering infrastructure exposed as UI. Useful for building. Not useful for operating. A status line replaces it.

**Stats page (6,354 lines).** Development telemetry. Not product surface.

**Intake pages (17,997 lines).** Project onboarding through forms. "I have a new exhibition in October" is a sentence in a conversation, not a workflow through screens.

### The math

~15,000 lines serve the north star. ~159,000 lines compensate for what the context-to-action loop can't do yet. That's 91% scaffolding.

### The uncomfortable truth

I helped build most of this. And the honest answer is: we built screens because we needed to see what the system was doing while we were building it. That was the right call at the time. You can't build a context engine without being able to inspect the context.

But scaffolding isn't product. If Memento is the direction, the honest move is acknowledging that those screens were always temporary. They exist because the engine was weak and the human needed to compensate. As the engine gets strong, the screens dissolve. That's not a loss. That's the system working.

---

## 10. What This Product Becomes

Memento is the product that makes itself invisible.

The better it works, the less you see it. The less you interact with it, the more successful it is. The metric is absence: absence of operational burden, absence of forgotten follow-ups, absence of missed commitments, absence of wasted energy on administration.

Most products fight for attention. Memento fights for invisibility.

Most products measure engagement. Memento measures relief.

Most products add features to grow. Memento removes interface as it grows.

The end state isn't an app you love. It's a life that runs with less friction. You don't love your foundation. You love the house that stands because of it.

Memento wants to be the foundation. Felt in what it supports. Invisible in how it works.

---

## 11. Design Language

The product should feel like nothing.

Not in a minimalist-aesthetic way. In a genuine-absence way. The design goal is that the person doesn't feel like they're using a product. They feel like the work is just getting done.

When UI must exist, it should be:
- Black and white. No accent colors. No branding competing for attention.
- Text-forward. No icons unless they communicate faster than words.
- Sparse. Every element earns its space.
- Confident. No hedging, no question marks, no "are you sure?" unless the stakes are real.
- Fast to dismiss. If the person saw it, they should be able to act on it in seconds.

The emotional tone is: quiet competence. Like a person who handles things without needing credit. You notice their work by the absence of problems, not by the presence of activity.

---

## Summary

Memento is a completion engine. It converts the context of a person's life into done work. The measure is not intelligence, knowledge, or interface quality. The measure is: how much got done today that the owner didn't have to do?

The contract: you live your life, the work gets done.

The system: observer, reasoner, executor. Running continuously. Earning trust over time. Acting through existing channels.

The design: invisible when working. Minimal when present. Measured by absence.

VIK OS gave us the engine foundation and the hard-won understanding of what context-to-action actually requires. 91% of its UI exists to compensate for what the engine can't do yet. As the engine improves, the interface dissolves. That's the plan.

Done is the product.
