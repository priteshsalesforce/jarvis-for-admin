# Autonomous ITSM: The Self-Driving IT Service Platform

**Date**: 7th May 2026

---

## The Big Idea

**What if IT didn't need a service desk at all?**

Every IT leader we talk to describes the same reality: their teams are buried in tickets, their CMDB is stale, and their best engineers spend more time firefighting than building. Even the "AI-powered" tools on the market today are just faster ways to manage the same broken workflow — something breaks, someone notices, someone files a ticket, someone triages it, someone fixes it. That's not innovation. 

We're proposing something fundamentally different: **an IT system that operates itself** — detecting issues before users notice, resolving them autonomously, learning from every interaction, and only involving humans for judgment calls that truly require human judgment.

Think of it as the leap from horse-drawn carriages to self-driving cars. Not a faster horse.

---

## The Vision: From Service Desk to Self-Driving IT

### For an Organization with 5,000 Employees and 200 IT Fulfillers

| Today (Reactive ITSM) | Tomorrow (Autonomous ITSM) |
| :---- | :---- |
| Employee submits ticket | Issue detected and resolved before employee notices |
| L1 agent triages manually | AI agents handle 90%+ of L1 autonomously |
| CMDB updated quarterly (if ever) | Service graph builds and updates itself continuously |
| Setup takes 3-5 weeks | Up and running in minutes with IT Domain Pack |
| Siloed tools, fragmented view | Single AI Control Tower with full observability |
| Incidents escalate up a chain | Multi-agent orchestration resolves complex issues end-to-end |
| Post-mortem after outage | Predictive detection prevents outages |

---

## Demo Narrative: "Day One to Day Done"

### Act 1: Instant Setup (Minutes, Not Weeks)

Imagine you're the CIO of a 5,000-person financial services company. You just signed up for Agentforce IT Service. Instead of a 12-week implementation project with consultants, you open a setup experience that feels like talking to a colleague:

*"We're a 5,000-person financial services company. We use Okta for identity, Intune for endpoint management, Jira for engineering, ServiceNow for legacy tickets we're migrating from, Splunk for logs, and AWS for infrastructure."*

The system:

- Activates the IT Domain Pack (50+ agents, 100+ workflows, 100+ catalog items)  
- Deploys relevant connectors (from 150+ pre-built) for Okta, Intune, Splunk, AWS  
- Configures multi-agent orchestration with appropriate guardrails  
- Sets up channels (Slack, Teams, Portal, Email)  
- Begins the autonomous discovery process

**Key Innovation**: ITSM Set Up using Vibe Coding Experience — the system configures itself based on conversational intent, not admin clicks.

**Self-Expanding Agent Fleet**: Beyond the 50+ OOTB agents, the system can auto-generate new agents from natural language descriptions. An IT manager describes a need — *"I need an agent that handles building access requests for our Austin office, checks badge status in our Genetec system, and routes approvals to facility managers"* — and the system uses the Agentforce Builder API to create, test, deploy, and register the agent as a CI in the Service Graph. Minutes from description to live agent.

---

### Act 2: The Infrastructure Crawl (Self-Building Service Graph)

Here's where the magic happens. Within minutes of connecting, the system starts **autonomously discovering** the IT landscape — no one has to tell it what exists:

**Dynamic CMDB Population**

- Splunk/DataDog log ingestion identifies configuration items, services, relationships, dependencies, and infrastructure  
- Endpoint management connectors (Intune, Jamf) enumerate all devices  
- Cloud discovery maps AWS/Azure/GCP resources  
- Network discovery identifies topology and dependencies  
- **Agents themselves become CIs** — every AI agent (ours and third-party) is tracked, monitored, governed

**Service Graph Emerges**

- Relationships auto-detected: runs-on, depends-on, communicates-with  
- Health baselines established through telemetry  
- Impact analysis becomes possible immediately  
- **Salesforce Org as a CI** — decomposed into sub-components: Custom Objects, Flows, Apex Classes, deployed Agentforce Agents, Integrations — each a manageable entity  
- **Data Cloud as a CI** — data spaces, data streams, segmentation rules, and activation targets tracked as distinct nodes with their own health and lineage

**The "Aha" Moment**: The CIO watches their entire IT landscape materialize on screen in real-time — servers, applications, agents, dependencies, relationships — all appearing without a single manual entry. Within an hour, they have a more accurate and complete CMDB than most enterprises achieve in a year of dedicated projects.

---

### Act 3: Proactive Detection & Autonomous Resolution

This is where we show what "autonomous" actually means — not just deflecting tickets, but preventing them from ever being created.

#### Scenario A: Employee-Facing (Conversational Auto-Resolution)

**What happens**: An employee's VPN certificate is expiring in 3 days. In today's world, she'd lose VPN access on Thursday, call the help desk, wait 2 hours, and lose a half day of productivity. In our world:

1. **Proactive Detection**: The system identifies the expiring certificate from Okta/certificate management integration  
2. **Autonomous Action**: Without any ticket, the IT Service Employee Agent reaches out via Slack:  
     
   *"Hi Sarah, your VPN certificate expires Thursday. I can renew it now — shall I proceed?"*  
     
3. **Resolution**: One click from Sarah. Certificate renewed. No ticket, no wait, no IT staff involved.  
4. **Learning**: Pattern logged — system will proactively handle all certificate renewals going forward.

#### Scenario B: Infrastructure (Proactive Server Issue)

**What happens**: Memory pressure building on a production database server. In the old world, this becomes a P1 at 2am when the database crashes and 2,000 people can't work. In our world, it never becomes an outage:

1. **Anomaly Detection**: Splunk telemetry shows memory usage trending toward threshold  
2. **Event Correlation Engine**: Not just simple threshold alerting — the system applies time-based correlation (events within a window), topology-based correlation (related CIs in the graph), pattern matching (known failure signatures), and deduplication (same root cause, one incident). ML models distinguish a real emerging issue from transient noise.  
3. **Impact Analysis**: Service graph identifies 3 applications and 2,000 users who would be impacted  
4. **Autonomous Orchestration**: Multi-agent collaboration kicks in:  
   - **Incident Agent** creates P2 incident (pre-escalation)  
   - **CMDB Agent** identifies related CIs and blast radius  
   - **DevOps Agent** executes pre-approved runbook (memory optimization, pod scaling)  
   - **Knowledge Agent** auto-generates KB article from the resolution  
   - **Notification Agent** informs stakeholders via Slack with impact summary  
5. **Root Cause Analysis**: Posted automatically — memory leak in recent deployment identified  
6. **Change Management**: Rollback change request auto-created and queued for approval  
7. **Proactive Customer Ops**: If this was customer-facing, affected customers are proactively notified with ETA

**No human touched this until step 6's approval gate.** Total elapsed time: 4 minutes.

\<\<\<Employee onboarding flow — create an agent — show observability end-to-end\>\>\>

**Intelligent Deduplication**: If 50 alerts fire from the same root cause, the system creates ONE incident and correlates all events — no alert storms, no duplicate tickets. Decision logic: new unique issue → create incident; matches existing → update; below threshold → event only; known transient → log and suppress.

#### Scenario C: Proactive Customer Operations (Cases \+ Incidents Unified)

**What happens**: Salesforce can tell this story in the most compelling manner since we have CRM and ITSM on the same platform. 15 customers report "app is slow" within 30 minutes — same geographic region.

1. **Pattern Detection**: Case aggregation engine detects geographic \+ temporal \+ service-component correlation  
2. **Major Incident Auto-Creation**: Threshold exceeded → system creates Major Incident "API Latency \- US-East Region", links to infrastructure CI (load balancer)  
3. **Blast Radius Calculation**: Service graph identifies 150 additional customers likely affected but haven't reported yet  
4. **Proactive Customer Notification**: All 150 customers notified via portal banner and email with ETA before they call in — preventing 10x duplicate cases  
5. **Work Order & Dispatch**: If physical infrastructure involved, work order auto-generated, **nearest qualified field technician dispatched with GPS routing**  
6. **Resolution Cascade**: Once fixed, major incident closed → all 15 original cases auto-resolved → proactive notifications updated with confirmation  
7. **Prevention**: Pattern stored — next time this load balancer shows early warning signs, the system acts before any customer notices

#### Scenario D: Complex Orchestration (Human-in-the-Loop)

**What happens**: Not everything should be fully autonomous — and that's the point. The system knows when to ask. A security vulnerability (CVE) requires patching 40 servers across multiple environments.

1. **Detection**: Security feed identifies critical CVE affecting a deployed package  
2. **Impact Analysis**: Service graph shows 40 CIs affected across prod, staging, dev  
3. **Plan Generation**: System generates a safe, staged plan — patch development systems first, then pre-production, then carefully roll out to live production starting with a small test group (if those stay healthy, proceed with the rest)  
4. **Human Approval**: IT Manager reviews plan in the orchestrator, approves with modifications  
5. **Orchestrated Execution**: Agents coordinate patching in waves with automated rollback triggers  
6. **Observability**: Real-time progress dashboard shows health of each patched system  
7. **Completion**: All systems patched, compliance evidence auto-collected, audit trail complete

---

### Act 4: The AI Control Tower (Operations View)

Now let's shift to the IT Manager's experience. Today, they live in a ticket queue — reactive, overwhelmed, drowning in alerts. Tomorrow, they walk into a command center that tells them what matters:

**AI Control Tower Dashboard**

- **Agent Observability (All Agents — Not Just Ours)**:  
  - Visibility across ALL deployed AI agents in the organization — including **Agentforce agents, Microsoft Copilot, Amazon Q & Bedrock agents, Google Gemini agents, CrowdStrike Charlotte AI, custom LLM agents, and any third-party AI system**  
  - For each agent: deployment status, health score, throughput, accuracy rate, escalation rate, latency, error rate  
  - Active instances running, resource consumption, SLA compliance  
  - Efficacy metrics: resolution quality score, user satisfaction, false positive rate  
  - Agents registered as CIs in the Service Graph with dependency mapping  
  - Example view: "37 agents deployed | 34 healthy | 2 degraded (Copilot latency spike, CrowdStrike agent timeout) | 1 offline"  
- **Service Health Map**: Live topology with color-coded health (leveraging Service Graph)  
- **Autonomous Resolution Feed**: Real-time stream of issues being handled without human intervention  
- **Attention Required**: Only items needing human judgment surface here  
- **Predictive Insights**: "3 incidents likely in next 4 hours based on current deployment pattern"  
- **Cost & Value Metrics**: Tickets deflected, MTTR reduction, hours saved, cost per resolution

**Agent Observability Deep Dive** (leveraging Salesforce platform capabilities):

- Unified view of the organization's entire AI agent fleet — Salesforce-native AND third-party (Copilot, Amazon Q & Bedrock, Google Gemini, CrowdStrike Charlotte AI, custom agents)  
- Which agents are handling what, success rates, latency, instances running  
- MCP/A2A communication patterns between agents  
- Anomaly detection ON the agents themselves (agent performance degradation, drift)  
- Trust & safety metrics — guardrail activations, hallucination detection, escalation patterns  
- Agent lifecycle management — version tracking, deployment history, rollback capability  
- Cross-agent conflict detection — when multiple AI agents act on the same issue

---

### Act 5: Problem & Change Management (Autonomous ITIL)

ITIL processes don't go away — they get smarter. The system handles the paperwork so humans can focus on the thinking.

**Problem Management**:

* System correlates incidents automatically and identifies recurring patterns  
* Creates Problem records with AI-generated root cause hypothesis  
* Links all related incidents, CIs, and knowledge articles  
* Suggests structural fixes (not just incident-level patches)

**Change Management**:

* Changes triggered from problem resolution flow through automated risk assessment  
* Change conflict detection (using Service Graph for impact analysis)  
* CAB reviews are pre-summarized with AI-generated risk scores  
* Post-implementation validation is automated — system confirms change succeeded

**DevOps Integration (CI/CD Pipeline ↔ Change Management)**  
This is a critical Gartner evaluation criterion and where Service Management meets modern engineering workflows:  
                                                                                                                        

* A deployment event from a CI/CD pipeline (Jenkins, GitHub Actions, GitLab) **automatically creates a change record** in the ITSM platform — no developer has to manually file a change request                                                  
* The change record captures deployment metadata: application/service name, target environment, version/build number, deployment time, deployment status                                                                                      
* **AI-driven risk assessment** automatically categorizes the change type and determines whether it needs approval or can proceed as a standard pre-approved change                                                                               
* Changes are linked to releases, enabling full traceability from code commit to production deployment  
* If a deployment causes an incident (detected via telemetry), the system automatically correlates the incident to the change record and the specific deployment — making root cause obvious  
* Rollback actions can be triggered directly from the change record, executing the CI/CD pipeline in reverse          

                                                                                                                          
**Why this matters**: Gartner explicitly evaluates how ITSM platforms bridge the gap between DevOps teams shipping fast and IT Operations teams maintaining oversight. Traditional ITSM forces developers to slow down. Our approach: the system of record stays current automatically, governance happens through AI policy — not manual gates — and both teams get what they need without friction. 

---

## Disruptive Innovations

### Already on the 264 Roadmap (Accelerate for Prototype)

These capabilities are already in our build plan — what's new is how we weave them together into the autonomous narrative. Individually they're features; combined, they're a platform shift:

* **Dynamic CI Discovery from Telemetry** CIs are not manually entered — they're discovered from log streams (Splunk, DataDog), network traffic, API call patterns, and agent activity. The CMDB is always current because it's always listening.

* **Proactive Customer Operations (CSIM)** Bidirectional sync between IT incidents and customer cases. When infrastructure fails, affected customers are proactively notified. When customer complaints spike, infrastructure investigation is auto-triggered.

* **Vibe-Coded ITSM Setup** The entire ITSM configuration is done conversationally. Admins describe what they need; the system configures itself. Inspired by vibe coding — but for IT operations setup.

### Beyond 264 (Truly Disruptive — New for This Prototype)

These are the ideas that no one in the market is doing yet. They represent the "clear the canvas" thinking that Jujhar asked for:

### 1\. Agents as Configuration Items

Every AI agent in the ecosystem — Agentforce, Microsoft Copilot, Amazon Q & Bedrock Agents, CrowdStrike Charlotte AI, custom agents — is tracked as a CI in the CMDB with health metrics, dependencies, version history, and SLA compliance. When an agent degrades, it's detected and managed like any other infrastructure component.

### 2\. AI Control Tower

A unified operations center that provides observability not just over IT infrastructure, but over ALL AI agents in the organization (ours and third-party). Powered by Agentforce Observability \+ **MuleSoft Agent Fabric** \+ Data Cloud analytics.

### 3\. Salesforce Org as a CI

The Salesforce platform itself becomes a managed entity — org health, governor limits, API usage, deployment status — all visible in the Service Graph alongside traditional infrastructure. Decomposed into sub-CIs: Custom Objects, Flows, Apex Classes, Agentforce Agents, and Integrations. Data Cloud tracked separately with data spaces, streams, and activation targets as distinct nodes.

### 4\. Auto-Generated Agents from Intent

New agents created from natural language descriptions via Agentforce Builder API — automatically tested, deployed, registered as CIs, and added to the Control Tower. The agent fleet grows organically as the organization's needs evolve.

### 5\. Self-Learning Knowledge Base

Every resolution becomes a potential KB article. System auto-generates, categorizes, and publishes knowledge — then uses it to improve future autonomous resolution rates.

---

## Platform Leverage (Cross-Cloud Architecture)

| Salesforce Capability | Role in Autonomous ITSM |
| :---- | :---- |
| **Agentforce** | Multi-agent orchestration, 50+ SME agents, MCP/A2A |
| **Data Cloud** | Zero-copy data federation, telemetry aggregation, RAG |
| **Mulesoft** | 150+ connectors, API orchestration, event-driven integration |
| **MuleSoft Agent Fabric** | **Universal agent connectivity layer — enables any AI agent (Agentforce, Copilot, Amazon Q & Bedrock agents, third-party) to discover APIs, access enterprise data, and communicate with other agents via MCP and A2A protocols. The nervous system for multi-vendor agent interoperability.** |
| **Slack** | Primary employee engagement channel, Slackbot agent |
| **Tableau** | AI Control Tower dashboards, CMDB health visualization |
| **Einstein AI & Models** | Domain intelligence, anomaly detection, predictive insights |
| **Flow Automation** | Workflow execution engine for agent actions |
| **Trust Layer** | Guardrails, data masking, audit trails for autonomous actions |
| **Platform (UACP)** | Omnichannel UX, portal, custom apps |

---

## Competitive Landscape & Positioning

### ServiceNow (Market Leader \+ Moveworks Acquisition)

**Current State (2025-2026)**:

- Acquired **Moveworks** ($2.85B, closed early 2025\) for conversational AI / employee-facing agent  
- Acquired **Veza** (AI-native Identity Security) for IAM  
- Acquired **Armis** ($7.75B) for IoT/OT asset visibility  
- **NOW Assist**: GenAI copilot across ITSM workflows (summarization, resolution suggestions, code generation)  
- **Partnership with Anthropic** (Jan 2026\) for enhanced AI models  
- Massive installed base; deep ITIL process maturity

**Their Strengths**:

- Dominant market position; thousands of enterprise deployments  
- Most complete ITIL implementation (ITSM, ITOM, ITAM, GRC, SecOps — all native)  
- Virtual Agent \+ NOW Assist \+ Moveworks \= multi-layer AI approach  
- CMDB \+ Discovery \+ Service Mapping (20+ years of maturity)  
- AIOps with Health Log Analytics, anomaly detection, predictive alerting  
- Massive partner ecosystem and implementation community

**Their Weaknesses (Our Opportunity)**:

- **Monolithic bolt-on AI**: Moveworks is being grafted onto a 20-year-old platform; architectural constraints limit true multi-agent orchestration  
- **Setup complexity**: Average enterprise deployment still takes 6-12 months; requires dedicated admin team and consultants  
- **Expensive**: $100+ per agent/month for ITSM Pro; ITOM, CMDB, SecOps all additional SKUs  
- **Single-vendor lock-in**: Data trapped inside ServiceNow; no native CRM/customer context  
- **Agent model is conversational-only**: Moveworks does intent detection \+ ticket deflection; NOT multi-agent orchestration or autonomous resolution of infrastructure issues

---

### Freshworks FreshService (Mid-Market Challenger)

**Current State (2025-2026)**:

- **Freddy AI Agent**: Autonomous resolution for L1 tickets (password resets, FAQ deflection)  
- **Freddy Copilot**: Agent-assist with reply suggestions, summarization  
- Claims 66% ticket deflection with AI-powered self-service  
- Full CMDB \+ Discovery (agentless \+ agent-based)  
- 356% ROI claim, go-live in weeks  
- Pricing: $19-$119/agent/month

**Their Strengths**:

- Fast time-to-value (2-6 weeks typical setup)  
- Excellent UX and admin experience  
- Strong mid-market fit (500-5,000 employees)  
- Good integration ecosystem (1,000+ apps)  
- "Self-healing scripts" for endpoint remediation  
- Affordable compared to ServiceNow

**Their Weaknesses (Our Opportunity)**:

- **Shallow AI**: Freddy is a single conversational bot, not multi-agent orchestration  
- **No platform play**: Cannot extend beyond ITSM into CRM, sales, service, marketing  
- **Limited enterprise features**: Not ready for 10,000+ employee organizations with complex governance  
- **No service graph intelligence**: CMDB exists but lacks dynamic discovery from telemetry  
- **No proactive customer operations**: Cannot connect infrastructure health to customer experience  
- **No observability over AI agents themselves**: No agent-as-CI concept

---

### Atlassian Jira Service Management (Developer-Native)

**Current State (2025-2026)**:

- **Atlassian Intelligence**: AI-powered triage, summarization, knowledge gap detection  
- **Rovo Agents** (launched 2024-2025): Custom AI agents across Atlassian platform  
- **Virtual Agent**: Conversational AI for L1 in Slack/Teams  
- **Assets** (CMDB): Full asset management with cloud discovery  
- **Opsgenie** (embedded): On-call, alerting, incident response  
- 60,000+ customers; pricing from $0-$44/agent/month

**Their Strengths**:

- Developer/DevOps native — tight Jira \+ Confluence integration  
- Rovo Agents are extensible and customizable  
- Very strong incident management (Opsgenie embedded)  
- Excellent pricing for small-mid organizations  
- "Teamwork Graph" for organizational context  
- Fast setup for existing Atlassian customers

**Their Weaknesses (Our Opportunity)**:

- **Not enterprise ITSM**: Lacks mature ITIL processes (problem, change management are basic)  
- **No multi-agent orchestration**: Rovo agents are individual helpers, not coordinated fleet  
- **No proactive operations**: Reactive incident management, not predictive  
- **No CRM/customer context**: Pure IT/engineering tool  
- **CMDB is basic**: Assets is functional but lacks service graph intelligence, dynamic discovery  
- **No AI Control Tower**: No unified observability over AI agent behavior  
- **Dev-team bias**: IT operations teams often find it too developer-centric

---

### Atomicwork (AI-Native Startup)

**Current State (2025-2026)**:

- Founded \~2022; $25M raised (Khosla Ventures)  
- **Agentic-first positioning**: AI agents (Universal Agent, IGA Agent, Onboarding Agent)  
- Claims 50-65% ticket deflection from day one  
- 6-week deployments replacing legacy ITSM  
- ISO 42001 (AI management), SOC2, GDPR certified  
- Targeting ServiceNow replacement for mid-enterprise

**Their Strengths**:

- **AI-native architecture (not bolted-on to legacy)**  
- Fast deployment (6 weeks vs. months)  
- Modern UX with conversational-first design  
- "AI Skills" — natural language to workflow creation  
- **Solid enterprise security certifications**  
- Aggressive pricing vs. ServiceNow

**Their Weaknesses (Our Opportunity)**:

- **Narrow scope**: ITSM \+ basic ESM only; no broader platform  
- **No platform leverage**: Cannot connect to CRM, marketing, sales, supply chain  
- **Limited integrations**: Microsoft \+ Okta \+ Lansweeper; nothing close to 150+ connectors  
- **No CMDB intelligence**: Basic asset management, not dynamic discovery or service graph  
- **No proactive infrastructure resolution**: Employee ticket deflection only, not server/network autonomous ops  
- **No enterprise trust at scale**: Young company; limited enterprise references  
- **No multi-cloud data strategy**: No Data Cloud, no zero-copy federation

---

### Head-to-Head Comparison Matrix

| Capability | ServiceNow | FreshService | Atlassian JSM | Atomicwork | Agentforce IT Service (Autonomous) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **AI Architecture** | Bolt-on (NOW Assist \+ Moveworks) | Single AI (Freddy) | Rovo Agents (emerging) | AI-native agents | **Multi-agent orchestration on unified platform** |
| **Agent Count (OOTB)** | \~10 virtual agents | 1 (Freddy) | Virtual Agent \+ Rovo | \~5 agents | **50+ SME agents** |
| **Multi-Agent Orchestration** | No (single conversational layer) | No | No | No | **Yes (Super Agent \+ SME handoffs)** |
| **Setup Time** | 6-12 months | 2-6 weeks | 1-4 weeks | 6 weeks | **Minutes (Vibe Coding)** |
| **CMDB / Service Graph** | Mature (20+ years) | Good (Pro+) | Basic (Assets) | Basic | **Dynamic \+ self-building from telemetry** |
| **Dynamic CI Discovery** | Discovery tool (config-heavy) | Agent-based scanning | Cloud discovery | No | **Autonomous from logs (Splunk/DataDog)** |
| **Agents as CIs** | No | No | No | No | **Yes** |
| **Proactive Resolution** | Predictive AIOps (basic) | Alert management | Opsgenie alerts | No | **Full autonomous detect-resolve-learn** |
| **Customer 360 (CSIM)** | No (separate CRM needed) | No | No | No | **Yes (Cases \+ Incidents unified)** |
| **AI Control Tower** | No | No | No | No | **Yes (Agent Observability \+ Predictive)** |
| **Connectors/Integrations** | \~1,500 (IntegrationHub) | 1,000+ | 1,000+ (marketplace) | \~50 | **150+ MuleSoft \+ MCP/A2A** |
| **Data Platform** | CMDB only | CMDB only | Assets only | Basic | **Data Cloud \+ Zero-Copy \+ Federation** |
| **Channels** | Portal, Chat, Email, Teams | Portal, Slack, Teams, Email | Portal, Slack, Teams | Portal, Slack, Teams | **Slack, Teams, Portal, Voice, Email, Webchat** |
| **Trust & Security** | Enterprise-grade | Good | Good | ISO 42001, SOC2 | **Einstein Trust Layer \+ guardrails** |
| **Platform Extensibility** | ServiceNow platform only | Limited | Atlassian ecosystem | Limited | **Full Salesforce Platform (CRM, Commerce, etc.)** |
| **Pricing Model** | $100+/agent/month \+ add-ons | $19-119/agent/month | $0-44/agent/month | \~$50-80/agent | **$15 PUPM (un-metered for employees)** |

---

### Summary: Our Killer Differentiators (What Nobody Else Has)

1. **Multi-Agent Orchestration at Scale**: 50+ specialized agents coordinating through a Super Agent — not a single chatbot, but a team of AI experts  
2. **Self-Building CMDB**: Service graph that discovers and maintains itself through telemetry — always current, zero manual entry  
3. **Proactive Customer Operations (CSIM)**: Unified platform that connects IT incidents to customer cases bidirectionally — when infra breaks, customers are proactively informed  
4. **AI Control Tower**: Observability not just over infrastructure, but over the AI agents themselves — a first in the industry  
5. **Vibe-Coded Setup**: Describe your IT environment in natural language and get a fully configured ITSM system in minutes  
6. **Unified Platform Economics**: One platform for IT, CRM, marketing, commerce — no data duplication, no integration tax  
7. **$15 PUPM Un-metered**: While competitors charge per-agent per-month with consumption anxiety, we offer predictable flat-rate pricing

---

## Demo Storyboard (2-Week Prototype)

### Scene 1: "The Setup" (2 min)

- Customer lands on setup wizard  
- Describes org in natural language  
- System auto-configures in real-time  
- IT Domain Pack activates

### Scene 2: "The Discovery" (3 min)

- Service graph populates live on screen  
- CIs appear from connected systems  
- Relationships auto-detected  
- Agent fleet deploys and registers as CIs

### Scene 3: "Autonomous Resolution" (4 min)

- Employee scenario: Slack conversation, auto-resolved  
- Infrastructure scenario: Detected, diagnosed, resolved, documented — no human  
- Complex scenario: Plan generated, human approves, orchestrated execution

### Scene 4: "The Control Tower" (3 min)

- IT Manager's unified view  
- Agent observability panel  
- Predictive insights  
- Only human-required items surfaced

### Scene 5: "The Numbers" (1 min)

- Before/after metrics  
- 90%+ L1 deflection  
- MTTD: seconds (from hours)  
- MTTR: minutes (from days)  
- Setup: minutes (from weeks)

## Success Metrics for the Prototype

| Metric | Target |
| :---- | :---- |
| Time to first value (setup to first auto-resolution) | \< 15 minutes |
| L1 ticket autonomous resolution rate | \> 90% |
| Mean Time to Detect (MTTD) | \< 60 seconds |
| Mean Time to Resolve (MTTR) for autonomous cases | \< 5 minutes |
| CMDB accuracy (vs. manual baseline) | \> 95% |
| Agent fleet utilization (agents actively handling work) | \> 80% |

---

## Key Questions for Leadership

We'd like guidance on a few decisions that will shape the prototype:

1. **Scope**: Should we go wide (touch all scenarios lightly to show the breadth of the vision) or go deep (one scenario fully wired end-to-end with real integrations to show it actually works)?  
2. **Platform**: Build entirely on Salesforce platform, or include mock/simulated components for speed? Two weeks is tight — where do we accept trade-offs?  
3. **Naming**: "Autonomous ITSM" vs. "Self-Driving IT" vs. "Agentforce IT Operations" — what resonates with customers and with Marc?

---

## Next Steps

| Action | Owner | By When |
| :---- | :---- | :---- |
| Align on demo scope and storyline | PM (Virag) | May 9 |
| Prototype sprint 1  | Engineering | May 14 |
| Prototype sprint 2  | Engineering | May 18 |
| Concept review with Jujhar | All | May 21 |
| Competitive research deep dive (Serval, Atomicwork) | PM | May 12 |

---

*"We need an evolution of ITIL to cope with the speed of AI" — PAHO (customer)*

*This isn't an evolution. It's a revolution.*  
