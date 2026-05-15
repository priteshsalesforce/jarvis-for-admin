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
