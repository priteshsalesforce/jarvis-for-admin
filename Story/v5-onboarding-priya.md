## Demo Title: Onboarding Day (v5)

**Persona:** Priya Menon, an HR Admin at TechCorp.

**Home shell:** Greeting "Welcome, **Priya!**" above four chiclets and a whisper composer. The chiclets are one-tap shortcuts to the most likely Day-1 asks; the composer accepts free text for everything else.

| Chiclet | One-tap prompt sent to Jarvis |
|---|---|
| **Onboard a new hire** | *"Onboard Rohan Sharma, PL-13234 — he has accepted the offer letter."* |
| **Today's approvals** *(badge: 4)* | *"What's waiting on my approval today?"* |
| **Joiners this week** | *"Who's joining this week and what's their status?"* |
| **Look up an HR policy** | *"What's our remote-work policy for new hires?"* |

Suggested questions Priya can also drop into the whisper bar:

- "Why did procurement need approval?"
- "What does each agent actually do?"
- "Can I see what Rohan will see on May 25?"
- "Can I roll any of this back?"

Priya taps **Onboard a new hire** *(or types it manually)*. The home view torches off, the chat opens with her message already posted, and Jarvis picks up immediately.

---

### Act 1: The Orchestrator Acknowledges

Action: *Status line — "Pulling Position Listing PL-13234" → "Position resolved · Software Architect · Platform Engineering".*

Action: *Status line — "Reading role requirements & start date" → "Start date · Monday, May 25 · Joining Platform Engineering".*

Jarvis: Got it! I've kicked off **Rohan's** onboarding for **PL-13234** — Software Architect. His start date is **May 25**. I've identified specialised hardware requirements for this role and routed an approval request to you. I'll keep you posted.

---

### Act 2: The Approval Card (Hardware Gate)

Action: *An "Approval requested" card lands in chat — eyebrow "Procurement Agent · Approval requested", title "**Hardware approval needed**", with an itemised breakdown:*

- *Mac Pro 14" M3 Max · Apple silicon · **$2,800***
- *32GB RAM upgrade · Configure-to-order · **$200***
- *2× external monitors · 27" 4K, USB-C dock · **$1,200***
- ***Total: $4,200***

*Rationale: This exceeds the standard **$3,000** L4 hardware threshold. Approving releases the order to Procurement (ETA May 22); declining holds it pending an alternate spec.*

*Three CTAs:* **Approve** / *Decline* / *Ask a question*.

Priya's three branches:

**(a) Decline →** Jarvis: Understood — I've put the hardware order on hold and pinged **Procurement** to discuss alternate specs that fit the standard L4 budget. I'll come back with options before EOD.

**(b) Ask a question →** Priya (auto-posted): "Why does this exceed the budget?"

Jarvis: Sure — here's the math:
• **Mac Pro 14" M3 Max** · $2,800
• **32GB RAM upgrade** · $200
• **2× external monitors** · $1,200
**Total $4,200**, against an L4 hardware budget of **$3,000**. The $1,200 overage is driven entirely by the dual-monitor requirement noted in the Software Architect role spec.

Jarvis: How would you like to proceed?
Choices: **Approve as-is** / **Approve, drop one monitor** / **Decline**.

**(c) Approve →** Priya: Approve.

Jarvis: Approved. Releasing the orchestrator — **9 agents** are picking up the work in parallel.

---

### Act 3: The Multi-Agent Fan-Out

The "Aha" Moment:

Action: *A structured "task · agent · status" grid renders in chat — eyebrow "Onboarding Orchestrator · 9 agents". Rows reveal progressively (~220 ms apart), each with a status pill that animates from "Queued" to its final state:*

1. Background check initiated — **Compliance Agent** — Done
2. I-9 & tax forms sent — **HR Forms Agent** — Done
3. Mac Pro order placed — **Procurement Agent** — **Ordered — ETA May 22** *(sub: Ships from Singapore facility)*
4. Workspace assigned — Desk 4B, Floor 2 — **Facilities Agent** — Done
5. Laptop enrolment in MDM — **IT Config Agent** — **Pending** *(sub: Auto-enrols on first sign-in)*
6. Email ID created — rohan.sharma@techcorp.com — **Identity Agent** — Done
7. GitHub Enterprise access provisioned — **Access Agent** — Done
8. AWS Dev credentials configured — **Cloud Access Agent** — Done
9. Slack account created & added to #platform-eng — **Comms Agent** — Done

*Footnote: **Done in 11 seconds** · 1 item pending delivery.*

---

### The Finale

Jarvis: **No tickets. No back-and-forth emails. No chasing.**

Rohan will get a personalised welcome from me on **May 25**, his laptop will be at his desk, and his Day-1 setup will already be waiting for him. I'll ping you if any of the **pending** items (MDM enrolment) need a nudge.

The chapter closes. The whisper bar stays live so Priya can ask follow-ups (e.g. "Who else is joining this week?" or "Can I roll the GitHub grant back?") and Jarvis answers from the FAQ router with the same agent.
