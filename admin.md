# 🛠 Admin's Jobs to be Done — Sarah, IT Admin / Supervisor

> **Persona:** Sarah, IT Admin & Supervisor at Acme Health (5,000-person org).
> **Role in product:** The "Supervisor" — one of the three primary personas (Executive, LOB VP, **Supervisor**). Sarah is the operator who installs, configures, governs, and tunes Jarvis for the org. She is the human in the loop where one is needed, and the steward of trust between Jarvis and 12,403 employees.
>
> **What she cares about (in priority order):**
> 1. **Trust** — every action is reversible, explainable, audited.
> 2. **Speed** — minutes-not-months setup, zero-ticket employee experience.
> 3. **Coverage** — fewer blind spots in CMDB, alerting, and agent fleet.
> 4. **Calm** — fewer 2 a.m. pages, less alert-fatigue, less politics.
>
> **Source material:** `demo-v2/stories/02-admin-sarah.js` · `Autonomous ITSM Concept.md` (Acts 1, 2, 4, 5) · `context.md` (rules C1–C10) · `Proactive ITSM War Room Concept Specification.md`.

---

## 📐 How this list is organised

Each JTBD is written in classic Christensen form:

> **When** _\<situation\>_, **I want to** _\<motivation\>_, **so that** _\<expected outcome\>_.

JTBDs are grouped into **five lifecycle phases** that map 1:1 to how Sarah experiences the product:

| Phase | Horizon | Demo beat | Theme |
|---|---|---|---|
| 0. Day 0 — **Procurement → First Login** | Minutes | Vignette 1, pre-CTA | Trust & welcome |
| 1. Day 1 — **Setup & Install** | < 30 min | `02-admin-sarah.js` install flow | Vibe-coded setup |
| 2. Day 1 — **Discovery & CMDB** | < 1 hour | `itsm-dashboard` page | Self-building graph |
| 3. Day 1 — **Reveal & Adoption** | < 1 day | Slack reveal beat | Org-wide change mgmt |
| 4. Day 2+ — **Steady-State Operations** | Ongoing | Chapters 3, 4, 5 | Control Tower, governance |

Each JTBD also carries:
- **Pain today** — what Sarah lives with on legacy ITSM (ServiceNow, FreshService, JSM).
- **What Jarvis does** — how the product solves it (and which surface).
- **Success signal** — the measurable outcome.
- **Demo trace** — file/step where this is shown.

---

## Phase 0 — Day 0: Procurement → First Login

### JTBD 0.1 — Land confidently after purchase
> **When** my CIO has just signed the Agentforce IT Service contract and forwarded me a post-purchase link, **I want to** authenticate, see Jarvis greet me by name, and understand exactly what's about to happen, **so that** I trust the next 30 minutes won't blow up production.

- **Pain today:** 12-week SOW, three implementation partners, a Statement of Work I didn't write. Anxiety.
- **What Jarvis does:** A single CTA — "Setup ITSM" — opens a conversational wizard. Jarvis introduces itself, the scope, and the rollback contract upfront.
- **Success signal:** Time from link-click to first installed package < 5 min.
- **Demo trace:** Vignette 1 prelude → `01-cto-vikram.js` end-state hands off to Sarah; `02-admin-sarah.js` step `begin`.

### JTBD 0.2 — Understand the contract before I click
> **When** I'm about to let an AI install IT Services across 5,000 employees, **I want to** see plain-English answers to "what changes today?", "can I roll back?", "what if my CMDB has dirty data?", **so that** I don't have to read a 40-page runbook to feel safe.

- **Pain today:** Implementation guides hidden behind salespeople; admins discover gotchas at go-live.
- **What Jarvis does:** **Suggested-question chips** above the whisper bar at every screen, with grounded `▸ Source` answers (Rule C3 — Trust & Transparency).
- **Success signal:** Sarah pre-empts ≥ 3 of her own concerns before clicking "Begin setup".
- **Demo trace:** `chapter.suggestedQuestions` and `chapter.faqs` arrays in `02-admin-sarah.js`.

---

## Phase 1 — Day 1: Setup & Install (the "Vibe-coded ITSM Setup")

### JTBD 1.1 — Install IT Services in minutes, not months
> **When** I've decided to deploy, **I want to** activate the IT Services runtime, CMDB, and one observability connector in parallel without filing my own change-request, **so that** I can replace a 12-week implementation project with an 8-minute conversation.

- **Pain today:** ServiceNow 6–12 month deploys; FreshService 2–6 weeks; Atomicwork ≈ 6 weeks. Always with consultants.
- **What Jarvis does:** Three packages install in parallel under a single approval gate. Estimated time shown upfront ("**8 minutes**"). All actions reversible for 30 days.
- **Success signal:** Time-to-first-value < **15 min** (from `Autonomous ITSM Concept.md` § Success Metrics).
- **Demo trace:** `step id="begin"` → `Checking licences` → `Installing CMDB package` → `splunk-flow` → `open-dashboard`.

### JTBD 1.2 — Choose the right observability source for *my* stack
> **When** Jarvis asks me "Splunk or Datadog?", **I want to** pick what I actually run today and have it auto-wire SSO, pipelines, and incident routing, **so that** I never have to hand-craft connectors or webhook endpoints again.

- **Pain today:** Connector configuration is admin-week-killer #1. SAML metadata, group mappings, throttling, retry, dedupe — all manual.
- **What Jarvis does:** Logo-grid `choose` step → real SSO mock → token exchange → pipeline provisioning → routing live, all under a single progress bar.
- **Success signal:** Zero manual connector config. Splunk SSO completes in **< 30 sec** of admin click time.
- **Demo trace:** `after-cmdb` `choose` step → `splunk-flow` branch → `splunk-auth` page (`PAGES`) → `wait-for: splunk-login` → progress bars.

### JTBD 1.3 — Install CMDB *first*, with a clear "why"
> **When** I'm asked to install CMDB before anything else, **I want to** understand why it has to come first and what breaks if I skip it, **so that** I'm not guessing at sequencing.

- **Pain today:** Legacy ITSM treats CMDB as an optional add-on SKU; 70% of orgs run with stale or skipped CMDB.
- **What Jarvis does:** Inline FAQ at the install gate: *"CMDB is the **graph** Jarvis reasons over. Without it, every recommendation is a guess."* Plus a **Skip for now** branch — never coercive (Rule C3).
- **Success signal:** Admin chooses "Yes, install CMDB" without escalating to architect review.
- **Demo trace:** `Install the CMDB package?` ask step → FAQ regex `/cmdb.*first|why.*cmdb/i` in `02-admin-sarah.js`.

### JTBD 1.4 — Rollback any setup decision
> **When** I've installed something and I'm not sure I should have, **I want to** undo it within minutes via an audit log diff and a one-click revert, **so that** "Begin setup" never feels like a one-way door.

- **Pain today:** Uninstalls leave orphan CIs, broken integrations, and ghost workflows.
- **What Jarvis does:** All writes reversible for **30 days** by default. Domain packs uninstall cleanly without dropping CMDB nodes. Audit log shows the diff.
- **Success signal:** Zero orphaned CIs after a domain-pack uninstall.
- **Demo trace:** FAQ regex `/roll ?back|undo|reverse|uninstall/i`.

### JTBD 1.5 — Walk through it before I commit
> **When** I'm not yet ready to start, **I want to** ask Jarvis to "walk me through it first" and see the package list, the guardrails, and the human-approval gates, **so that** I can decide on my own timeline.

- **Pain today:** Setup wizards force a single linear path; admins hit "Cancel" rather than ask questions.
- **What Jarvis does:** The `Walk me through it first` choice triggers a 1-bubble explainer (3 packages, parallel install, Approve/Modify/Reject contract) before re-offering the CTA.
- **Success signal:** No drop-off between wizard open and `Begin setup`.
- **Demo trace:** `step id="explain"` branch in `02-admin-sarah.js`.

---

## Phase 2 — Day 1: Discovery & CMDB Bootstrapping

### JTBD 2.1 — Watch the IT landscape build itself
> **When** Jarvis says "the system is breathing in real time," **I want to** see CIs appear on a live dashboard with serial numbers, manufacturers, expiry dates, and health colours, **so that** I have visceral proof the autonomous discovery actually works.

- **Pain today:** CMDB populated quarterly (if ever); dashboards show stale data; admins lose faith in the source of truth.
- **What Jarvis does:** `itsm-dashboard` side-panel page with animated 78% completion bar, live "▲ +3 in last hour" delta, and a 10-row CI grid with health pills (Healthy / Warning / Critical).
- **Success signal:** CMDB accuracy **> 95%** vs. manual baseline (concept doc § Success Metrics).
- **Demo trace:** `PAGES["itsm-dashboard"]` factory in `02-admin-sarah.js`.

### JTBD 2.2 — Trust dirty / partial source data
> **When** I know my asset DB is a mess, **I want to** see Jarvis reconcile three sources (asset DB, Mule Agent Fabric runtime relationships, SSO group memberships) and only commit **HIGH-confidence** matches, **so that** dirty data doesn't poison the new graph.

- **Pain today:** Migration projects fail because legacy data is ingested wholesale.
- **What Jarvis does:** Confidence-scored writes; conflicts go to a review queue with diff cards. Discovery agent reconciles 3 sources before any write-back.
- **Success signal:** ≥ 95% of CIs land at HIGH confidence; conflicts visible in a single review queue.
- **Demo trace:** FAQ regex `/dirty data|messy|stale|bad data|wrong/i` with `source: "CMDB integration with Mule Agent Fabric — see Amarendra's deck."`

### JTBD 2.3 — Manage agents *as* CIs
> **When** the org runs Agentforce + Copilot + Amazon Q + CrowdStrike Charlotte AI side-by-side, **I want to** see every AI agent (ours and third-party) tracked in the CMDB with health, throughput, accuracy, and SLA, **so that** I can govern AI the same way I govern infra.

- **Pain today:** Agents are invisible to ITSM; nobody owns their lifecycle.
- **What Jarvis does:** Agent-as-CI is a first-class concept — every agent has dependencies, version history, health metrics, and rollback. Surfaced in the Wall Board and Control Tower.
- **Success signal:** "37 agents deployed | 34 healthy | 2 degraded | 1 offline" visible at a glance.
- **Demo trace:** `Autonomous ITSM Concept.md` Act 4 → `wallboard` page in `05-exec-marc.js`.

### JTBD 2.4 — See the service graph, not just a list
> **When** I'm asked "what depends on this server?", **I want to** click a node and see runs-on / depends-on / communicates-with edges, **so that** impact analysis stops being a tribal-knowledge exercise.

- **Pain today:** "Service mapping" is a six-figure ServiceNow add-on.
- **What Jarvis does:** Auto-detected relationships from telemetry; CMDB accuracy maintained continuously, not quarterly.
- **Success signal:** Impact-analysis time drops from hours to seconds.
- **Demo trace:** Vignette 2 (CMDB dashboard, planned) and `constellation` page in `01-cto-vikram.js` (Legacy ↔ Optimized slider).

---

## Phase 3 — Day 1: The Reveal & Org-Wide Adoption

### JTBD 3.1 — Introduce Jarvis to 12,403 employees, personally
> **When** the install is complete, **I want to** broadcast a personalised Slack DM to every employee that mentions one *real* thing Jarvis already noticed about their setup, **so that** Day 1 feels like a gift, not a memo.

- **Pain today:** Org-wide IT changes land as a blast email nobody reads. Adoption is a 6-month uphill battle.
- **What Jarvis does:** Personalised Slack reveal — "Hi Alex 👋 — your laptop battery dropped to 64% capacity, I ordered a replacement, ships Wed." Sample preview before send. Hold-off option.
- **Success signal:** Day-1 engagement (DM-opens, replies) > **80%**.
- **Demo trace:** `Send the company-wide reveal?` ask → `show-sample` → `slack-thread` step → `do-reveal` progress bar.

### JTBD 3.2 — Preview before I broadcast
> **When** I'm one click away from messaging the whole company, **I want to** see a live sample of the personalised DM Jarvis is about to send, **so that** I can catch tone or PII issues before they hit Slack.

- **Pain today:** Mass-comms tools show templates, not realised messages. PII leaks happen at scale.
- **What Jarvis does:** Sample DM rendered inline as a Block-Kit-style `slack-thread` step. Two ways out: `Send the reveal` or `Hold off`.
- **Success signal:** Zero send-and-regret incidents.
- **Demo trace:** `step id="show-sample"` → `slack-thread` step → second confirmation `ask`.

### JTBD 3.3 — Hold the reveal without losing it
> **When** I'm not ready to broadcast today, **I want to** schedule it from the Control Tower → Communications later, **so that** rollout sequencing is *my* decision.

- **Pain today:** "Hold" usually means "lose." Pause = restart.
- **What Jarvis does:** `Hold off` resumes the chapter cleanly. Reveal is queued, never abandoned. Trigger any time from Communications.
- **Success signal:** Hold-then-resume completes in one click.
- **Demo trace:** `step id="hold-reveal"` branch + FAQ regex `/slack reveal|broadcast|announce|company-wide|reveal/i`.

---

## Phase 4 — Day 2+: Steady-State Operations

### JTBD 4.1 — Approve, Modify, or Reject every AI write
> **When** Jarvis proposes an action that touches production (a change, a patch, a remediation), **I want to** see a card with the full diff and three buttons: Approve / Modify / Reject, **so that** the AI never "just goes ahead" without my fingerprint.

- **Pain today:** AIOps tools either block on every step (useless) or auto-execute with no audit trail (terrifying).
- **What Jarvis does:** Every AI-recommended action ships with an "in-flow" Approve / Modify / Reject (Rule C5). Audit trail per decision.
- **Success signal:** 100% of production-touching actions have a human-approval record.
- **Demo trace:** `team-health` page in `04-manager-david.js` ("SEV-2 incident card with Approve/Modify/Reject"); concept doc Act 3, Scenarios B & D.

### JTBD 4.2 — Be told what *needs* attention, not what happened
> **When** I open the Control Tower in the morning, **I want to** see a single feed of items that need *my* judgement (not 400 alerts, not 80 dashboards), **so that** I'm not drowning in noise.

- **Pain today:** Alert storms; 50 duplicate tickets per real incident; on-call burnout.
- **What Jarvis does:** Intelligent deduplication (same root cause = 1 incident); "Attention Required" is the only feed surfaced; everything else is the "Autonomous Resolution Feed" (informational).
- **Success signal:** Daily attention-required items < **20**, regardless of org size.
- **Demo trace:** `wallboard` page in `05-exec-marc.js`; concept doc Act 4 § AI Control Tower.

### JTBD 4.3 — Catch problems *before* they're outages
> **When** a database server is trending toward memory threshold, **I want to** be alerted at the trend, not the crash, with the AI already proposing a remediation, **so that** P1s become P3s.

- **Pain today:** Threshold-only alerting; humans triage at 2 a.m.
- **What Jarvis does:** Event Correlation Engine — time, topology, pattern, dedupe. ML distinguishes real emerging issues from transient noise. Multi-agent orchestration drafts a fix; admin approves.
- **Success signal:** **MTTD < 60 sec**, **MTTR < 5 min** for autonomous cases.
- **Demo trace:** Vignette 3 plan; `04-manager-david.js` "Splunk breach causal-mapped, one-click remediation" beat.

### JTBD 4.4 — Govern multi-agent orchestration on complex changes
> **When** a CVE requires patching 40 servers across prod / staging / dev, **I want to** review the staged plan (dev → pre-prod → canary prod → full prod) in one screen, approve with modifications, and watch agents execute in waves with automated rollback triggers, **so that** "complex change" doesn't mean "all-night war room."

- **Pain today:** Change Advisory Board (CAB) reviews are 90-min meetings with no AI assist; rollback is manual.
- **What Jarvis does:** AI generates safe staged plan; CAB pre-summary; orchestrated execution with rollback triggers; compliance evidence auto-collected.
- **Success signal:** End-to-end CVE patch from detection → completion in hours, not weeks.
- **Demo trace:** Vignette 4 (planned) + concept doc Act 3, Scenario D.

### JTBD 4.5 — Create a new agent from intent
> **When** the Austin office needs a "building-access request" agent that talks to Genetec and routes approvals to facility managers, **I want to** describe it in natural language and have Jarvis spin it up, test it, and register it as a CI, **so that** my agent fleet grows with the business, not behind it.

- **Pain today:** New automation requires a partner SOW or a Power Automate developer.
- **What Jarvis does:** Agentforce Builder API generates, tests, deploys, and CI-registers the agent. Minutes from description to live agent.
- **Success signal:** New-agent lead time < **1 hour**.
- **Demo trace:** "Vibe coding" agent-creation flow (planned, per `memory.MD` UX vision #1).

### JTBD 4.6 — Trust agents the way I trust junior engineers
> **When** a third-party agent (Copilot, Charlotte AI) starts drifting in accuracy, **I want to** see it on the same observability surface as my own agents, with version history and rollback, **so that** AI governance is one job, not seven.

- **Pain today:** Each AI vendor has its own console. Drift is invisible.
- **What Jarvis does:** Agent Observability — health, throughput, accuracy, escalation rate, latency, error rate, false-positive rate — for **all** agents in the org.
- **Success signal:** Single pane of glass across vendors; drift surfaced before users notice.
- **Demo trace:** Concept doc Act 4 § Agent Observability Deep Dive; `wallboard` Top Risks Averted feed.

### JTBD 4.7 — Close the loop on knowledge
> **When** Jarvis resolves an incident autonomously, **I want to** have a draft KB article auto-generated, categorised, and queued for my review, **so that** institutional knowledge grows on every fix instead of dying in chat.

- **Pain today:** KBs go stale; new hires re-discover the same issue every quarter.
- **What Jarvis does:** Self-Learning KB — every resolution is a candidate article; admin approves publication.
- **Success signal:** L1 autonomous resolution rate climbs week-over-week.
- **Demo trace:** Concept doc § Disruptive Innovations #5; Act 5 — Problem Management.

### JTBD 4.8 — Connect IT incidents to customer cases
> **When** infra fails, **I want to** see the affected customers and their open cases in the same screen, **so that** "infra incident" and "customer support storm" stop being two separate fire drills.

- **Pain today:** ITSM and CRM are different platforms with no bidirectional sync.
- **What Jarvis does:** **Proactive Customer Operations (CSIM)** — Major Incidents auto-link affected customers; cases auto-resolve when the underlying infra is fixed.
- **Success signal:** 10× reduction in duplicate cases per major incident.
- **Demo trace:** Concept doc Act 3 § Scenario C.

---

## 🎯 Cross-cutting principles (apply to every JTBD above)

These come straight from the project rules (C1–C10) and apply to **every** screen Sarah sees:

1. **Ontology-driven** (C1) — every alert, action, and metric points back to a node in the CMDB graph.
2. **Persona-centric** (C2) — Sarah's screens are *richer* than the Executive's Wall Board but *simpler* than a developer console.
3. **Trust & transparency** (C3) — `▸ Source` on every grounded answer; reversible writes; visible audit log; explicit Approve / Modify / Reject.
4. **In-flow actionability** (C5) — no "switch to a different tab to approve." Every recommendation has its action right next to it.
5. **Slack-first conciseness** (C6) — Block-Kit, not walls of text. Slack summary always offers a deep-link back to the Lightning Control Tower.
6. **WCAG 2.1 AA** (C9) — colour contrast, keyboard navigation, screen-reader labels on every interactive element.

---

## 📊 Success metrics — Sarah's scoreboard

| Metric | Target | Source |
|---|---|---|
| Time to first auto-resolution | < 15 min | Concept doc § Success Metrics |
| L1 autonomous resolution rate | > 90% | Concept doc § Success Metrics |
| MTTD | < 60 sec | Concept doc § Success Metrics |
| MTTR (autonomous cases) | < 5 min | Concept doc § Success Metrics |
| CMDB accuracy | > 95% | Concept doc § Success Metrics |
| Agent fleet utilisation | > 80% | Concept doc § Success Metrics |
| Day-1 employee Slack-DM engagement | > 80% open + interact | `02-admin-sarah.js` reveal beat |
| Daily "attention required" items | < 20 | Concept doc Act 4 |
| New-agent lead time (intent → live) | < 1 hour | Concept doc § Auto-Generated Agents |

---

## 🔗 Where each JTBD lives in the demo

| JTBD | File / step | Surface |
|---|---|---|
| 0.1, 0.2 | `stories/02-admin-sarah.js` chapter intro + `suggestedQuestions` | Whisper bar + chips |
| 1.1–1.5 | `stories/02-admin-sarah.js` `begin` → `open-dashboard` | Chat thread + ask/choose steps |
| 2.1 | `PAGES["itsm-dashboard"]` | Side panel |
| 2.2 | FAQ `/dirty data/i` | Inline chat answer with `▸ Source` |
| 2.3 | `PAGES["wallboard"]` (chapter 5) | Side panel |
| 3.1–3.3 | Reveal beat (`do-reveal`, `show-sample`, `hold-reveal`) | Chat + `slack-thread` step |
| 4.1 | `PAGES["team-health"]` (chapter 4) | Side panel |
| 4.2, 4.3, 4.6 | `PAGES["wallboard"]` (chapter 5) | Side panel |
| 4.4 | Vignette 4 (planned) | TBD |
| 4.5 | Vibe-coding agent-creation flow (planned) | TBD |
| 4.7, 4.8 | `Autonomous ITSM Concept.md` Acts 3 & 5 | Concept doc — not yet demoed |

---

## 🧭 Open admin-side gaps (TODO for the demo)

These are JTBDs that are **declared in the concept doc but not yet wired into the demo** — flagging them here so they don't fall off the radar:

- [ ] **JTBD 4.4** — Multi-agent orchestration plan view (Vignette 4 — agent orchestration for complex scenarios, per Ramprasadh's clarification).
- [ ] **JTBD 4.5** — Vibe-coded agent creation flow (UX vision #1 in `memory.MD`).
- [ ] **JTBD 4.7** — Self-learning KB approval queue.
- [ ] **JTBD 4.8** — CSIM (Customer + IT incident bidirectional sync) admin view.
- [ ] **JTBD 2.4** — Service-graph node click → CI detail view (Vignette 2).

---

*Last updated: 2026-05-11. Maintained alongside `context.md` and `memory.MD`. Update when chapter 2 changes or when a new admin-facing surface ships.*
