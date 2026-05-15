## Demo Title: The Agentic IT Architect (v4)

**Persona:** Sarah, an IT Admin at Acme Health (mid-size healthcare org · multi-site · several BUs · stack runs on Okta + Microsoft Intune + AWS + Splunk).

**Welcome screen:** *"Welcome, Sarah! · Start with **Agentic IT Service** · Get Started"* with a whisper composer for free-text questions. Suggested questions sitting under the composer:

- "Why install CMDB first?"
- "What if my CMDB has dirty data?"
- "Can I roll this back?"
- "What changes for employees today?"

Hitting **Get Started** drops Sarah into Act 1.

---

### Act 1: Right-Sizing the Install (Context Q&A)

Setup Agent: Starting setup. **ITSM** ships in three parts — and the **CMDB** is the foundation everything else reasons over. Let's start there.

Setup Agent: **Two quick questions** before I propose the install.

Setup Agent: Roughly how many employees does Acme Health have?

Sarah picks one of: *Under 1,000 · Single region, lean ops* / **1,000 – 10,000 · Multi-site, several BUs** / *10,000+ · Global, 24/7 follow-the-sun*.

Setup Agent: Which of these tools should I plug into right now? Pick what's already in your stack — you can add more later.

Sarah multi-selects from: **Okta** (Workforce identity & SSO) · **Microsoft Intune** (Endpoint management) · **AWS** (Cloud infra & telemetry) · **Splunk** (Logs · SIEM · observability).

Action: *Status line — "Checking licences for selected integrations" → "Licences validated".*

Setup Agent: Locked in — sizing for **mid-size healthcare**, plugging into **Okta, Intune, AWS, Splunk**.

---

### Act 2: The Install Decision

Setup Agent: I'll install the **CMDB** package first — it's the graph everything else reasons over. Every action is **reversible for 30 days**.

Sarah: Install CMDB.

---

### Act 3: Splunk SSO

Setup Agent: Authenticating **Splunk** so the bootstrap can ingest from your live telemetry.

Action: *The right pane opens to **`https://login.splunk.com/sso`** — a Splunk Single Sign-On screen requesting access on Jarvis's behalf. Sarah signs in.*

Action: *Status line — "Exchanging tokens" → "Splunk authenticated". The Splunk pane closes.*

---

### Act 4: The Bootstrap Reveal — "Watch the right pane"

Setup Agent: Telemetry online. **Watch the right pane** — your IT landscape is about to come alive.

Action: *Right pane swaps to **ITSM bootstrap · Acme Health**. As the chat fires each progress step, the bootstrap page lights up the corresponding card.*

Setup Agent runs five progress beats, each tied to a panel reveal:

1. *"Activating specialized AI agents"* → **50+ specialized AI agents online** *(panel: agents card lights up · 5 featured ITIL agents shown up front, 47 collapsed in a "See all" group, every chip hover-/click-able for the full agent profile)*
2. *"Materializing service graph from live Splunk + AWS telemetry"* → **Service graph materialized · 142 services** *(panel: SVG service graph draws nodes + edges in real time; hover any node for the team, RPS, and health)*
3. *"Populating dynamic CMDB"* → **CMDB populated · 12,847 CIs without manual entry** *(panel: 4 CMDB tiles count up — Servers 4,128 · Endpoints 5,902 · Apps 1,847 · Network 970)*
4. *"Loading intelligence layers"* → **User · Identity · Agent graphs ready** *(panel: 3 layer tiles flip to ready)*
5. *"Importing domain knowledge"* → **500+ failure patterns + resolution playbooks loaded** *(panel: chip cloud of failure patterns — M365 outage, VPN tunnel collapse, DNS resolver flap, cert expiry cascade, etc.)*

The "Aha" Moment:

Setup Agent: **There it is, Sarah.** Your entire IT landscape — servers, apps, agents, dependencies — mapped in real time. **More accurate than a year of manual CMDB work.**

Action: *Right pane reveals the full landscape graph — services, apps, infra, and a halo of AI agents — every node clickable for the Inspector drawer.*

---

### Act 5: Final Wiring

- *"Provisioning data pipelines"* → **Pipelines provisioned**.
- *"Configuring incident routing"* → **Routing live**.

Setup Agent: All set — **ITSM is live**. Your IT landscape stays on the right.

---

### The Finale (Cockpit Handoff)

Setup Agent: Whenever you're ready, here's your **control surface** — open it when you want to see what I'm watching, what's pending your sign-off, and where the org stands today.

Action: *A link-card lands in chat — "**The Cockpit** · Your day-1 control surface · agents, signals & sign-offs". One click swaps the right pane from the bootstrap reveal to the Cockpit.*

---

### Companion Mini-Story: The Add-Agent Wizard (v4 home shell)

After Setup is complete, Sarah's app boots into a **post-setup Home shell** branded for **John, IT Manager at IndiaFirst Bank** (greeting + four chiclet shortcuts above the whisper composer):

- **Open Cockpit** — opens Tower
- **Today's approvals (4)** — pulls the sign-off queue card
- **Recent incidents** — opens the incidents page
- **Add Agent** — kicks off the in-chat agent-builder wizard

Tapping **Add Agent** runs a 4-question conversational wizard, then auto-validates the agent before slotting it in the Cockpit.

**Q1 · JTBD**

Jarvis: Let's build you an agent. In one sentence — **what should it do**? *(e.g. "onboard new hires in Salesforce — provision access on day one and notify their manager")*

User types the JTBD in the whisper bar.

**Q2 · Domain**

Jarvis: Sounds like a **&lt;inferred&gt;** agent. Right domain?

Chips: Reliability · Cost · Access · Compliance · *(suggestion pre-selected based on JTBD)*

**Q3 · Name**

Jarvis: What should I call it? I suggest **&lt;suggestedName&gt;**.

Chips: *Use "&lt;suggestedName&gt;"* / *Type my own*. Picking "Type my own" hands the whisper bar back to the wizard for a free-text name.

**Q4 · Autonomy**

Jarvis: How much autonomy should it have?

Chips: **L1** / **L2** *(recommended)* / **L3** / **L4** — each with a one-line blurb.

**Preview & Confirm**

Jarvis: Here's what I'll create — review and confirm.

Action: *Renders a preview agent card — name + level chip, JTBD body, "Domain · &lt;X&gt;", "Trust 88%", new-status badge — with two CTAs: **Create agent** / **Cancel**.*

User: Create agent.

The "Aha" Moment:

Action: *6 pre-flight evals stream in the chat, each with a busy spinner that resolves to a green tick:*

1. Validating intent and domain mapping → **Intent and domain mapping validated**
2. Resolving ontology bindings for selected domain → **Ontology bindings resolved**
3. Verifying tool scopes against autonomy level → **Tool scopes match autonomy level**
4. Running guardrail safety simulations → **Guardrails passed safety simulation**
5. Wiring audit trail for compliance → **Audit trail wired · compliance ready**
6. Calibrating initial trust score → **Initial trust calibrated at 88%**

The Finale: *The new agent slides into the Cockpit grid as a fresh tile (with a "New" badge), and a director's-note toast confirms "Agent deployed · &lt;name&gt; is live."*

---

### Companion Mini-Story #2: Open Incident — P1 on Card Payments (v4 home shell)

**Persona:** John, IT Manager · IndiaFirst Bank.

**Entry points:** *Two ways to land here, both wired to the same flow:*

- **(Primary) Services to watch row** — On the v4 home, the *Services to watch* card lists "**Card payments — declines climbing fast**" *(sub: card-auth error rate up 3.4× in 24h. SLA breach likely within ~6h.)* with a red "high" pill. The whole row is a button — its CTA reads **Open incident**.
- **(Alternate) Critical toast** — A bottom-right director's note can fire *"Card payments are failing right now — card-auth error rate just spiked to **8.7%** — past the **5% SLA limit**. Agents have already started triaging."* with two actions: **Open incident** (primary) and *Snooze 10 min*.

John clicks **Open incident**.

Action: *Home tears down. The workspace splits — chat panel on the left, the **Live incident** page mounts in the right pane. A live elapsed counter starts ticking ("Live · 00:00") in both the in-stage chiclet bar and the page header. The incident header reads:*

> **INC-2026-0514-001 · P1 · Card Authorization** — *Card payments — declines crossing SLA threshold*. Affected: ~340 merchants · ~12,000 active cardholders · India (all regions).

*A status banner shows the current phase ("Detected"), and below it an empty timeline with the live "**MonitoringAgent · Detecting** — Tracking the spike across regions" row pulsing at the bottom.*

---

#### Phase 1 — Detected *(auto-advances ~4.5s)*

Jarvis: **P1 on card-auth.** Error rate just crossed the SLA hard threshold (8.7%). I've routed the incident to **DiagnosticsAgent** and **ObservabilityAgent** — they're starting triage now. I'll keep you posted here.

*Timeline rows tick in:*
- `+0s` **MonitoringAgent** — Threshold crossed — card-auth error rate at 8.7% (SLA limit 5%).
- `+2s` **MonitoringAgent** — Raised incident INC-2026-0514-001 · paged the on-call rota.

*Chiclet bar (above the dock) shows quick actions:* **Acknowledge** · **Page on-call** · **Open runbook** · **Open war room**.

---

#### Phase 2 — Triaged *(auto-advances ~6s)*

Jarvis: DiagnosticsAgent confirms **P1 customer impact**. Routing trace correlation to ObservabilityAgent.

Live activity: *"DiagnosticsAgent · Triaging — Classifying severity and customer impact"*.

- `+5s` **DiagnosticsAgent** — Classified as P1 — customer-facing, SLA breach in &lt;6h if untreated.
- `+8s` **DiagnosticsAgent** — Handing off to ObservabilityAgent for trace correlation.

*Brief handoff beat:* "ObservabilityAgent · Handing off…" then phase 3 starts.

---

#### Phase 3 — Investigating *(auto-advances ~7.5s)*

Jarvis: ObservabilityAgent has narrowed the blast radius — **98% of failures are on build v3.7.1** which went live 4h ago. No infra change in the window, so we're looking at a regression.

Live activity: *"ObservabilityAgent · Correlating — Joining failed-auth traces with the recent deploy"*.

- `+12s` **ObservabilityAgent** — Correlated 2,340 failed-auth traces — 98% from card-auth pods on build v3.7.1.
- `+14s` **ObservabilityAgent** — Pulled deploy timeline: v3.7.1 went live 09:02 IST (4h 12m ago).
- `+16s` **DiagnosticsAgent** — No infra change inside the window — pointing at a code regression.

---

#### Phase 4 — Root cause *(human-decision gate)*

Jarvis: **Root cause confirmed.** v3.7.1 tightened the 3DS issuer timeout to 1.8s — Visa flows where the issuer takes 2–3s now fail. **RemediationAgent** has a rollback plan ready (revert to v3.7.0). I'll post the **approval below** the moment the plan is fully drafted — your call from there.

Live activity: *"DiagnosticsAgent · Pinpointing — Bisecting the regression in v3.7.1"*.

- `+20s` **DiagnosticsAgent** — Root cause: v3.7.1 lowered the 3DS issuer timeout from 3s → 1.8s. Visa flows where the issuer takes 2–3s now fail.
- `+23s` **RemediationAgent** — Plan ready: roll back card-auth to v3.7.0 (last known-good, 2 days in prod, zero regressions).
- `+25s` **RemediationAgent** — Awaiting human approval — rollback affects 340 merchants · 12,000 cardholders.

The "Aha" Moment:

Action: *The live row settles into a calmer "**RemediationAgent · Awaiting approval** — Roll back card-auth to v3.7.0 — needs your call". An **Approval card** lands prominently in the chat thread:*

> **Approval needed · RemediationAgent**
> **Roll back card-auth to v3.7.0?**
>
> *Last known-good build (2 days in prod, zero regressions). Will affect **340 merchants** and **~12,000 cardholders** mid-rollout — error rate should return to baseline within ~60s.*
>
> | | |
> |---|---|
> | **Plan** | Revert v3.7.1 → v3.7.0 across all card-auth pods |
> | **Audit** | Change record CHG-44102 will be linked |
> | **Reversibility** | Rollback is reversible for 30 days |
>
> CTAs: **Approve mitigation** *(primary)* / *Defer 30 min* / *Request more info*

*The chiclet bar mirrors the same actions:* **Approve mitigation** · *Defer 30 min* · *Request more info*.

John's three branches:

**(a) Approve mitigation →** John (user bubble): *Approve mitigation*.
Jarvis: On it. **RemediationAgent** is rolling back to **v3.7.0** now — **ChangeAgent** will log **CHG-44102** for the audit trail. I'll keep you posted as the rollout completes. *(Phase advances.)*

**(b) Defer 30 min →** John (user bubble): *Defer 30 min*.
Jarvis: Paused. I'll re-prompt you at **13:15 IST** — error rate is still at 8.7%, so SLA breach window is shrinking. Ping me sooner if you want to act early.

**(c) Request more info →** John (user bubble): *Request more info*.
Jarvis: **DiagnosticsAgent** will draft a deeper RCA in ~5 min — I'll post it here with the affected merchant breakdown and the v3.7.0 → v3.7.1 diff.

---

#### Phase 5 — Mitigating *(auto-advances ~7s, only if Approved)*

Jarvis: Approved — RemediationAgent is rolling back to v3.7.0. ChangeAgent has logged **CHG-44102** for the audit trail.

Live activity: *"RemediationAgent · Rolling back — Deploying v3.7.0 across card-auth pods"*.

*Chiclet bar swaps to a single, disabled spinning chip:* **Rollback in progress…**.

- `+27s` **RemediationAgent** — Rollback approved by John — starting deploy of v3.7.0.
- `+29s` **ChangeAgent** — Created change record CHG-44102 · linked to incident · audit trail captured.
- `+32s` **RemediationAgent** — Rollout 50% … 100%. v3.7.0 is live across all card-auth pods.

---

#### Phase 6 — Resolved (Verifying → Wrap-up)

Jarvis: Rollback is live and the error rate is dropping. **ObservabilityAgent** is verifying it holds at baseline — I'll surface the wrap-up once the post-incident summary is ready.

Live activity: *"ObservabilityAgent · Verifying — Watching error rate hold at baseline"*. *Chiclet bar shows a calm spinning chip:* **Verifying baseline…**.

- `+36s` **ObservabilityAgent** — Error rate dropping: 8.7% → 0.4% (back to baseline).
- `+40s` **ObservabilityAgent** — Verified stable for 60s — closing the incident.
- `+42s` **ComplianceAgent** — Generated post-incident summary · saved to Lens · ready to share.

The Finale (the moment everything flips together):

Action: *In a single beat, the surfaces sync — the elapsed pill freezes and turns green ("**Resolved · 00:42**"), the page header banner re-styles to resolved, and the wrap-up chiclet bar replaces the spinner with four real actions:* **View summary** *(primary)* · *Download (.md)* · *Share to Slack* · *Close incident*.

Action: *Two synchronised confirmations land — a green **post-incident summary card** lands in chat AND in the right panel:*

> ✓ **Post-incident summary · ComplianceAgent**
> **Post-incident summary is ready**
>
> *ComplianceAgent drafted a full RCA with timeline, root cause, and follow-up actions.*
>
> | | |
> |---|---|
> | **Incident** | INC-2026-0514-001 · Card Authorization |
> | **Severity** | P1 · Resolved |
> | **MTTR** | &lt;computed from elapsed&gt; |
>
> CTAs: **View summary** *(primary)* / *Download (.md)* / *Share to Slack*

Action: *Bottom-right director's note: "**Incident resolved** · Card Authorization · INC-2026-0514-001 — Summary doc is ready to view, download, or share."*

---

#### After the Resolution — John's Wrap-up Actions

The wrap-up CTAs (chiclet bar + summary card) all do real things:

**(a) View summary →** *A right-side drawer slides in over the workspace with the full post-incident report:*

> **Post-incident summary** — *Card payments — declines crossing SLA threshold* · INC-2026-0514-001 · Card Authorization · MTTR &lt;X&gt;
>
> **Root cause** — Build v3.7.1 (deployed 09:02 IST) introduced a 3DS timeout regression. Visa flows fail when the issuer responds in 2–3s — well within spec, but the new code aborts at 1.8s.
>
> **Mitigation** — Rollback to v3.7.0 (last known-good build, 2 days in production).
>
> **Timeline** — every `+Xs · Agent — text` row from the incident, in order.
>
> **Follow-up actions**
> - Add a regression test for 3DS issuer timeouts &gt; 1.8s *(DiagnosticsAgent · 2 days)*
> - Block deploys that lower timeouts without a paired SLO review *(ChangeAgent · this week)*
> - Brief payments-ops on the rollback at the Friday standup
>
> *Footer: Download .md · Share to Slack · Done.*

**(b) Download (.md) →** *A real `INC-2026-0514-001-summary.md` markdown file downloads to John's machine — generated client-side from the live incident state. Toast: "Summary downloaded · INC-2026-0514-001-summary.md".*

**(c) Share to Slack →** *Toast: "Shared to #payments-ops · Summary posted to Slack with timeline."*

**(d) Close incident →** *Toast: "Incident closed · INC-2026-0514-001 · MTTR &lt;X&gt; — Removed from active queue. Full record archived in Lens." The chiclet bar dismisses; the elapsed counter stops; John is back to the steady-state Cockpit/home view.*

---

#### Story Beats At a Glance (for the deck slide)

| # | Phase | Who's working | What John sees |
|---|---|---|---|
| 1 | Detected | MonitoringAgent | P1 toast / "high" row → Open incident |
| 2 | Triaged | DiagnosticsAgent | "Customer-facing P1, SLA breach in &lt;6h" |
| 3 | Investigating | ObservabilityAgent | "98% of failures on build v3.7.1" |
| 4 | **Root cause** | DiagnosticsAgent → RemediationAgent | **Approval card** — Roll back v3.7.1 → v3.7.0? |
| 5 | Mitigating | RemediationAgent + ChangeAgent | Rollback rolling out · CHG-44102 logged |
| 6 | Resolved | ObservabilityAgent + ComplianceAgent | Error rate back to 0.4% · summary doc ready |

The whole arc — toast → live timeline → human gate → mitigation → wrap-up — runs in ~45 seconds and shows John (a) **what's happening right now** (live activity row + chiclets), (b) **the audit trail being built as it happens** (timeline rows with `+Xs · Agent — text`), and (c) **his decision moment** (approval card with explicit blast-radius numbers).

---
---

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

---
---

## Demo Title: The Lens (v6)

**Persona:** John Mathew, an IT Manager at IndiaFirst Bank. John runs a fleet of digital agents that handle the bank's day-to-day IT work — incidents, customer cases, customer-facing workflows (loan applications, KYC re-runs), and change-management freezes.

**Boot:** v6 boots directly into **The Lens** in full-canvas right-pane mode (chat collapsed to the Jarvis tile in the rail). No greeting, no setup story — the Lens *is* John's home.

---

### Act 1: The Lens Loads

Action: *The Lens paints — header "**The Lens** · See all your work items on this page", a tab strip (**All 2,628** · Incidents 2,098 · Cases 120 · Workflows 121 · Changes 1), and a card listing every work item the agents are handling end-to-end. John's seed feed (current state of the bank on a Thursday evening):*

| ID | Type | Title | State | Agents on it |
|---|---|---|---|---|
| INC-44318 | INC | SAP S/4HANA · ERP DB lock contention (P2 · vendor case open) | Active · Manufacturing IT engaged | DiagnosticsAgent · VendorRouterAgent |
| INC-44219 | INC | AWS NLB regional latency (P3 · vendor handed off) | Resolved · vendor handed off | MonitoringAgent · VendorRouterAgent |
| CASE-44102 | CASE | Laptop performance — Zoom plugin | Resolved · auto-closed in customer voice | EndpointAgent |
| CHG-9921 ×4 | CHG | checkout-api · feature flag rollout | Held · against Saturday freeze lane | ChangeAgent |

*The eye sweeps INC / CASE / WFLW / CHG at a glance via tinted left-edge chips.*

---

### Act 2: A New Workflow Arrives

Action: *~3.5 seconds after the page settles, a fresh **WFLW** row slides in at the top with a soft glow + a "New" pip on the left chip. A quiet director's-note toast bottom-right confirms:*

> **New work item** — Loan application from Rohan Sharma · home loan · ₹78L. Routed to the Loan Workflow agent. Open from the top of Lens.

| ID | Type | Title | State |
|---|---|---|---|
| **WF-44312** | **WFLW** | loan S/4-api · feature home loan | **New · Loan application** |

The "Aha" Moment: *the row stays in place, gently pulsing, until John clicks it — he doesn't have to hunt, the Lens brought it to him.*

---

### Act 3: The Work Item Detail

John clicks the new row.

Action: *The right pane swaps to the **Work-item Detail** page — a "← Lens" back button at the top-left, then a title row: "loan S/4-api · feature home loan · WF-44312" with a status chip showing **New · agents working**. Below, two tabs: **Resolution** (active, the live timeline) and **Details** (customer + loan facts).*

Below the timestamp ("DD MMM YYYY · HH:MM:SS"), the **agent orchestration timeline** begins playing — each step renders as a row with a vertical rail, a busy spinner that resolves into a green check, and the agent's result line.

1. **OrchestratorAgent** — *Workflow received* → Routing to specialist agents → **Routed to KYC, CIBIL, Account & Underwriting agents in parallel**
2. **KycVerificationAgent** — *KYC verification* → Validating Aadhaar + PAN with NSDL → **PAN AVQPS3421K verified · Aadhaar match · sanctions clear**
3. **CibilScoreAgent** — *CIBIL score check* → Pulling credit report from CIBIL → **Score 812 · 0 missed payments · utilisation 18%**
4. **AccountVerificationAgent** — *Account & income verification* → Checking SB balance, deposits, EPF & employer verification → **Avg balance ₹8.2L · salary ₹2.4L/mo · employer Tier-A**
5. **UnderwritingAgent** — *Underwriting & risk decision* → Computing eligibility against loan policy v2.4 → **Sanctioned ₹78,00,000 @ 8.45% floating · EMI ₹67,420/mo · LTV 78%**
6. **SanctionLetterAgent** — *Sanction letter generated* → Drafting & e-stamping the sanction letter (PDF) → **PDF ready · IFB-LN-2026-44312-SL.pdf (124 KB)**

Action: *As the final step resolves, the page status banner flips from **"New · agents working"** → **"Resolved · sanctioned by UnderwritingAgent"**, and a director's note pops bottom-right:*

> **Loan sanctioned** — Sanction letter ready for Rohan Sharma · ₹78,00,000 @ 8.45%. Email it to Rohan or download the PDF from the work item.

If John switches to the **Details** tab at any time, he sees three structured factboxes: **Customer** *(name · PAN · email · phone)*, **Loan** *(product · amount · tenure · property)*, and **Agents on this workflow** *(chips for OrchestratorAgent, KycVerificationAgent, CibilScoreAgent, AccountVerificationAgent, UnderwritingAgent, SanctionLetterAgent)*.

---

### Act 4: The Sanction Letter

The "Aha" Moment:

Action: *A **Sanction-letter card** slides in at the bottom of the timeline — eyebrow "SanctionLetterAgent · Document ready", title "**Sanction letter for Rohan Sharma**", with a one-line summary:*

> Home loan · ₹78,00,000 @ 8.45% floating · 20-year tenure · EMI ₹67,420/mo. E-stamped, signed by the Branch Credit Officer.

*Plus a PDF preview tile — "**IFB-LN-2026-44312-SL.pdf** · 124 KB · 4 pages · valid till 12 Jun 2026" — and two CTAs: **Email to Rohan** (primary) and **Download PDF** (secondary).*

John picks one (or both — the alternate stays clickable):

**(a) Email to Rohan →** *"Composing email to **rohan.sharma@gmail.com**…" → "**Sent to rohan.sharma@gmail.com · cc: branch-credit@indiafirst.com**".* Toast: *Sanction letter emailed.*

**(b) Download PDF →** *"Preparing the PDF for download…" → "**Downloaded IFB-LN-2026-44312-SL.pdf to your machine.**".* Toast: *Sanction letter downloaded.*

---

### The Finale

The page rests on the resolved work-item — **Resolved · sanctioned by UnderwritingAgent** — with the sanction letter card visible and either action confirmed. John clicks the **← Lens** button at the top-left and is back on the live feed, with **WF-44312** now sitting in the list as a sanctioned workflow alongside the other work items his digital agents are handling. The chat panel is still one Jarvis-tile-tap away if he wants to ask follow-ups.

---
---

## Cross-Demo Notes

- All three demos share the same shell (left rail · chat panel · right workspace pane) and the same Jarvis design language — only the persona, story type, and right-pane content differ.
- **v4** is the **set-up + agent-build** story (foundation install for Sarah → ongoing agent management for John, IT Manager).
- **v5** is the **operational orchestration** story (Priya kicks off a multi-agent fan-out from a single chat prompt).
- **v6** is the **observation & action** story (John watches the digital workforce in real time and intervenes when a work item needs his eye).
- All deep-link entry points: `#setup` (re-enters the chapter), `#tower` / `#cockpit` (Sarah's control surface), `#lens` (John's feed), `#workitem-detail` (John's loan workflow detail).
