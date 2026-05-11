# Memory: #servicecloud-proactive-itsm-warroom

> Living memory file for the Proactive Agentic ITSM war room. Update as new context comes in from the channel.

**Last updated:** 2026-05-08 (evening update — post Nasahn-add channel activity)

---

## 🎯 Mission
Build a **Proactive Agentic ITSM end-to-end demo**.
**Deadline:** Next Friday.

---

## 🗂️ Channel Summary

Active war room channel focused on building a Proactive Agentic ITSM end-to-end demo.

---

## 📄 Key Documents Shared

- **Concept Specification** — Shared by Ramprasadh Kothandaraman to brainstorm and align goals for the Proactive ITSM demo. [1]
- **Visual Flows PDF** — Shared to support planning. [2]
- **PM Concept Review Doc** — Shared by Virag Shah for PM team review; feedback requested. [3]

---

## 🎨 UX Vision

Virag Shah shared UX vision designs covering two concepts: [4]

1. **Vibe coding design demo** — Creating agents with prompts and IT domain packs.
2. **Control Tower design demo** — A headless command centre with agent observability & evals.

---

## 🔧 Technical Input: Agent as CI + Mule Agent Fabric

Amarendra Kondapalli weighed in on the "Agent as CI" concept: [5]

- **Mule Agent Fabric** can be leveraged for runtime agent relationships.
- **CMDB** stores design-time relationships — both are valuable to demonstrate.
- Shared decks:
  - *AITS CMDB Integration with Mule Agent Fabric*
  - *MuleSoft Agent Fabric Technical Overview* (PDF)

---

## 🧩 Demo Story Alignment (Today)

Tanmay Jyot proposed the first part of the demo story flow: [6]

1. Customer gets a link post-purchase, authenticates, and Jarvis opens on web.
2. Welcome screen with a single CTA: **"Setup ITSM"**.
3. Command runs and starts installing.
4. Prompts user for input as needed.

✅ **Virag Shah confirmed:** "The first part of the story looks good to me." [7]

🗒️ **Ramprasadh's strategic note:** "We are not starting from scratch, so let's assimilate all the existing assets (delivered, in progress and under plan), then quickly wire up the end to end without compromising on the soul of what we are trying to achieve." [8]

---

## 🎞️ Full 4-Vignette Demo Narrative (2026-05-08, evening — Tanmay's first draft)

Posted by Tanmay Jyot at 8:50 PM. [3-evening]

1. **Vignette 1 — The Setup**
   Customer gets a post-purchase link → authenticates → Jarvis opens on web → welcome screen with "Setup ITSM" CTA → installation runs → prompts user for input → Domain pack & CMDB setup completes → link generated to view CMDB dashboard.
2. **Vignette 2 — IT Landscape in the Making**
   User clicks the dashboard link → sees CIs being discovered → browses a service graph → clicks on nodes for CI details.
3. **Vignette 3 — Control Tower & Observability** (a few days later)
   Admin monitors IT infra health → Splunk threshold breach detected → Agent logs an incident → Remediation agent executes fix → Relevant stakeholders notified with RCA.
4. **Vignette 4 — Agent Orchestration for Complex Scenarios**
   Ramprasadh clarified at 8:55 PM: this is **NOT** a generic "human in the loop" story — it is about orchestrating multiple agents through a complex scenario. Scope still being defined. [4-evening]

---

## 🖥️ Control Tower Prototypes (2026-05-08)

- **Ramprasadh Kothandaraman (8:35 PM)** — Shared a mock prototype for the **Agent & Asset Health Control Tower**, for the team to brainstorm and finalise the flow on Monday. [1-evening]
- **Shantanu Singh (8:48 PM)** — Shared a second Control Tower demo prototype built with colleagues, originally prepared for a Marc review. [2-evening]
- **Monday's focus:** finalise the Control Tower flow based on these two prototypes.

---

## 🎨 Urgent CX / Content Ask (2026-05-08, 9:53 PM)

**Shantanu Singh** asked Tanmay to get **@Madhuri Mishra** working with **@Pritesh Chavan** on content as a **high priority**, ensuring it's **Jujhar-ready** as we build. He explicitly flagged that there will **not** be a separate time for CX review later. [5-evening]

---

## 🔑 TL;DR

The team is aligning on a Proactive Agentic ITSM demo for next Friday. Concept docs, visual flows, UX designs, and MuleSoft integration decks are in place. The first demo story step is approved and UX is ready to start building flows based on the agreed narrative.

**Latest (2026-05-08 evening):** After Nasahn was added to the channel, the team moved into demo-story mode — two Control Tower prototypes shared (Ramprasadh + Shantanu), a 4-vignette narrative drafted by Tanmay and refined by Ramprasadh (V4 = agent orchestration, not human-in-the-loop), and an urgent call from Shantanu to start CX/content work immediately (Madhuri + Pritesh) to be Jujhar-ready. **Monday's focus: finalise Control Tower flow from the two prototypes.**

---

## 👥 People

- **Ramprasadh Kothandaraman** — Concept spec author; strategic alignment lead; Control Tower prototype owner.
- **Virag Shah** — PM concept review; UX vision; story approver.
- **Amarendra Kondapalli** — Technical input on Agent as CI / Mule Agent Fabric.
- **Tanmay Jyot** — Demo story flow proposer (4-vignette narrative author).
- **Shantanu Singh** — Shared second Control Tower prototype (Marc review); driving CX/content urgency.
- **Madhuri Mishra** — Content partner — to pair with Pritesh on Jujhar-ready content.
- **Pritesh Chavan** — Content build partner with Madhuri.
- **Nasahn** — Recently added to the channel (2026-05-08, 7:54 PM).

---

## 📝 Notes / To Track

- [ ] Wire up end-to-end demo using existing assets (delivered, in-progress, planned).
- [ ] Continue building UX flows from approved narrative.
- [ ] Finalize remaining demo story steps beyond the first part.
- [ ] Gather PM feedback on concept review doc.
- [ ] **Monday** — Finalise Control Tower flow using Ramprasadh's + Shantanu's prototypes.
- [ ] **Vignette 2** — CMDB dashboard with CI discovery, service graph, node click → CI detail view.
- [ ] **Vignette 3** — Splunk threshold breach → agent-logged incident → remediation agent fix → stakeholder RCA notification.
- [ ] **Vignette 4** — Define + storyboard "agent orchestration for complex scenarios" (per Ramprasadh's clarification).
- [ ] **HIGH PRIORITY — CX / content** — Pair @Madhuri Mishra with @Pritesh Chavan on Jujhar-ready content as we build (no separate CX review pass later).

---

## 🔄 Updates Log

- **2026-05-08** — Initial memory file created from channel summary.
- **2026-05-08 (evening)** — Channel activity after Nasahn was added (7:54 PM):
  - **8:35 PM** — Ramprasadh shared Agent & Asset Health Control Tower mock prototype.
  - **8:48 PM** — Shantanu shared a second Control Tower prototype from a Marc review.
  - **8:50 PM** — Tanmay posted first draft of the **4-vignette demo story** (Setup → IT Landscape → Control Tower & Observability → Human-in-the-loop?).
  - **8:55 PM** — Ramprasadh clarified Vignette 4 = "agent orchestration for complex scenarios" (NOT human-in-the-loop).
  - **9:53 PM** — Shantanu raised urgent CX ask: Madhuri + Pritesh pair on content immediately to be Jujhar-ready, no separate CX review pass later.
  - **Monday's focus:** finalise Control Tower flow from the two prototypes.
