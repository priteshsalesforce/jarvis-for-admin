# Design Vision Showcase — Presentation Content

**Product:** HELIOS — *Proactive, Agentic ITSM* (the vision evolved from "Jarvis for Admin")
**Presenter:** Pritesh Chavan · UX · pritesh.chavan@salesforce.com
**Target release:** Winter '27 (R1 of a 3-release vision; the simulation looks ~3 releases ahead)
**Format:** Maps to the DVS 7-minute structure — **2 min context · 4 min demo · 1 min next steps**

> This document is the slide-by-slide script for filling the [TEMPLATE] Design Vision Showcase deck.
> Each section = one slide. "On slide" = what appears on the slide; "Speaker notes" = what you say.

---

## Slide 1 — Title

**On slide**
- **Title:** HELIOS — The Self-Driving IT Organization
- **Subtitle:** A Proactive, Agentic ITSM Vision
- **Eyebrow / release line:** Design Vision Showcase · Winter '27 → 3-release horizon
- **Date:** *Date of Showcase*
- **Presenter block:**
  - **Pritesh Chavan**
  - UX / Product Design
  - pritesh.chavan@salesforce.com

**Speaker notes**
> "IT runs the enterprise — but ITSM still runs like it's 2010: reactive tickets, stale CMDBs, 12-week deployments, and humans triaging at 2 a.m. HELIOS is our vision for IT that drives itself: a fleet of governed AI agents that discover, decide, and remediate proactively — with a human in the loop only where it matters. I'll spend 2 minutes on the problem and who it's for, 4 minutes in a live simulation, and 1 minute on the roadmap."

---

## Slide 2 — Context: Why Now *(repurposes the template "Let's get started" instructions slide)*

**On slide — "The IT operating model is broken at the seams"**

| Today's reality | The cost |
|---|---|
| Tickets are **reactive** — humans triage after users feel pain | MTTD measured in hours; P1s instead of P3s |
| CMDB is **stale** — populated quarterly, if ever | ~70% of orgs run on bad data; every recommendation is a guess |
| Deployment is a **project** — 6–12 month SOWs, 3 partners | Time-to-value measured in quarters |
| AI is **invisible** to ITSM — agents have no owner, no governance | Drift and risk no one can see |

**The shift:** From a *system of record* you operate → to a *system of action* that operates with you.

> **Invisible waste a first scan surfaces in 60 seconds: ~$3.24M.**

**Speaker notes**
> "Every CIO I talk to has the same three problems: they find out about incidents from their users, their source of truth is wrong, and standing up new capability takes two quarters. Meanwhile they're buying AI agents from five vendors with zero governance. HELIOS attacks all of it. In our concept scan, a single Phase-0 pass surfaces $3.24M of invisible waste in under a minute — that's the wedge."

---

## Slide 3 — Thank You + Collaborators

**On slide**

*Design & cross-functional partners*
- **UX / Design:** Pritesh Chavan (vision + prototype)
- **Content / CX:** Madhuri Mishra (Jujhar-ready content, paired in-flow)
- **Concept & strategy:** Ramprasadh Kothandaraman (concept spec, Control Tower)
- **Prototype partners:** Shantanu Singh (Control Tower), Tanmay Jyot (demo narrative)

*PM & R+I collaboration*
- **PM partnership:** Virag Shah — concept review, UX vision, story approval; committed to explore this vision for the platform roadmap.
- **Tech / Architecture:** Amarendra Kondapalli — Agent-as-CI on Mule Agent Fabric (runtime relationships) + CMDB (design-time relationships).
- **Guiding research:** ITSM benchmark pain (ServiceNow 6–12 mo deploys; FreshService 2–6 wk; CMDB accuracy <50% industry baseline) informing the JTBD set.

**Speaker notes**
> "This vision is a team sport. PM partnership with Virag gives us a committed path to explore it on the roadmap; Amarendra's Agent-Fabric + CMDB work is the technical backbone; and Madhuri is embedded so content is right the first time. Thank you to everyone who shaped this."

---

## Slide 4 — Customer Value & Job(s) To Be Done

**On slide — value framed by our three primary personas (the org chart, not just a user)**

| Persona | Top Job To Be Done | What HELIOS delivers | Proof metric |
|---|---|---|---|
| **Executive** (Marc, CTO) | "Show me where the money and risk are — grounded, not guessed." | Wall Board: live KPIs with a **"Why?"** drill-down on every number | $3.24M waste surfaced in 60s; **<20** attention items/day |
| **LOB VP / Manager** (David, John) | "Catch problems *before* they're outages and let me approve, not babysit." | Causal-mapped incidents + **Approve / Modify / Reject** on every AI action | **MTTD <60s · MTTR <5 min**; P1→P3 |
| **Supervisor / Admin** (Sarah, Priya) | "Stand it up in minutes and trust every write is reversible." | Vibe-coded setup; self-building CMDB; 30-day reversible writes | **<15 min** time-to-value; **>95%** CMDB accuracy |
| **Employee** (Alex) | "Get what I need without a ticket." | Slack-first, zero-ticket fulfillment | Access granted in **4 seconds** |

**The core value (one line):** *Replace a 12-week implementation and a queue of tickets with an 8-minute conversation and a fleet of governed agents that do the work — transparently.*

**Speaker notes**
> "We design for an *ontology*, not screens — every alert, metric and action points back to a node in the graph, so the Executive's Wall Board, the Manager's causal map, and the Admin's CMDB are the *same* graph at different altitudes. Three personas, three mental models, one source of truth. And every JTBD is anchored to a measurable signal — this isn't vibes, it's a scoreboard."

---

## Slide 5 — Vision Simulation *(the 4-minute demo)*

**On slide**
- **Embed:** 4-minute vision-simulation video (live "vibe-coded" prototype)
- **Live links** (if presenting live):
  - 5-persona showcase (lobby): `https://priteshsalesforce.github.io/jarvis-for-admin/demo-v2/`
  - The Lens (IT Manager, latest): `https://priteshsalesforce.github.io/jarvis-for-admin/demo-v6/#lens`
  - Persona deep-links: `#cto` · `#admin` · `#employee` · `#manager` · `#exec`
- **Caption:** *A day in the life of a self-driving IT org — one graph, five personas, zero tickets.*

**The 4-minute relay (storyboard the demo as a single arc):**
1. **00:00 — CTO Vikram · "The Sale"** — 60-sec Phase-0 Neural Scan reveals $3.24M waste; Legacy ↔ Optimized slider; Deploy.
2. **00:50 — Admin Sarah · "The Setup"** — 8-minute install: IT Services + CMDB + Splunk SSO; landscape self-assembles (12,847 CIs, 142 services, 50+ agents).
3. **01:40 — Employee Alex · "Zero-Ticket"** — "Need Figma access for NurtureAI" → granted in 4 seconds in Slack.
4. **02:10 — Manager David/John · "The Proactive Save"** *(the climax)* — P1 card-payments incident: agents detect → triage → root-cause (v3.7.1 3DS timeout) → draft rollback → **human Approve** → resolved in ~45s with an auto-RCA.
5. **03:30 — Executive Marc · "The Wall Board"** — boardroom view: animated counters, Top Risks Averted, a **"Why?"** on every metric.

**Speaker notes**
> "This is a live, vibe-coded prototype — not click-throughs — built to look 3+ releases ahead. Watch the Proactive Save: the agents do the detection, correlation and root-cause, but the human owns the *decision*. Every action carries Approve / Modify / Reject and every number carries a 'Why?'. That's the trust contract that makes autonomy safe to ship."

---

## Slide 6 — Next Steps *(the 1-minute close)*

**On slide — a 3-release vision horizon**

| Horizon | Release | Theme | What ships |
|---|---|---|---|
| **R1 — Foundation** | Winter '27 | *Self-building source of truth* | Vibe-coded setup; auto-discovered CMDB; Agent-as-CI registry; Wall Board v1 |
| **R2 — Proactive** | Spring '27 | *Detect before outage* | Event-correlation engine; causal incident maps; Approve/Modify/Reject everywhere; Slack-first zero-ticket |
| **R3 — Autonomous** | Summer '27 | *Governed autonomy at scale* | Multi-agent orchestration for complex change (staged + rollback); self-learning KB; CSIM (IT↔customer case sync) |

**Asks**
1. **PM commitment** to scope R1 against the platform roadmap (with Virag).
2. **Architecture spike** on Agent-as-CI / Mule Agent Fabric (with Amarendra).
3. **Design partner** (1–2 customers) for the proactive-incident loop.

**Speaker notes**
> "If you take one thing: we can replace the 12-week implementation *now*, and earn the right to autonomy release by release. R1 makes the source of truth build itself; R2 makes IT proactive; R3 is governed autonomy at scale. The asks are small — a PM scoping commitment, an architecture spike, and one design partner."

---

## Slide 7 — Appendix · Official Salesforce Corporate Template 2026 *(scaffolding — keep or drop)*

**On slide**
- Link to the Salesforce corporate template 2026 (insert if a corporate-branded version is required).
- Backup metrics scoreboard (see below) and persona deep-links.

**Backup — the scoreboard**

| Metric | Target |
|---|---|
| Time to first auto-resolution | < 15 min |
| L1 autonomous resolution rate | > 90% |
| MTTD / MTTR (autonomous) | < 60 s / < 5 min |
| CMDB accuracy | > 95% |
| Agent fleet utilisation | > 80% |
| Day-1 employee Slack engagement | > 80% |
| Daily "attention required" items | < 20 |
| New-agent lead time (intent → live) | < 1 hour |

---

## Slide 8 — Thank You

**On slide**
- **Thank you**
- Pritesh Chavan · pritesh.chavan@salesforce.com
- *HELIOS — the self-driving IT organization*
- Demo: `priteshsalesforce.github.io/jarvis-for-admin/`

**Speaker notes**
> "Thank you — happy to go deeper on the ontology, the trust model, or any persona's flow."
