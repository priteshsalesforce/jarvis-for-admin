/* =================================================================
   john.js — Story data for the v4 Mobile (IT Manager · IndiaFirst Bank)
   -----------------------------------------------------------------
   Every string is copied verbatim from demo-v4/app.js so the mobile
   port stays faithful. Two stories are wired in:

     1. Open Incident — P1 on Card Payments
        Triggered from the Services-to-watch row OR a critical toast.
        6 phases: Detected -> Triaged -> Investigating -> Root cause
        (human gate) -> Mitigating -> Resolved -> wrap-up summary card.

     2. Add Agent — 4-question conversational wizard
        Triggered from the Add Agent chiclet.
        JTBD -> Domain chips -> Name pick -> Autonomy level chips ->
        preview card -> 6 pre-flight evals -> finale toast.
   ================================================================= */

// Persona — John, IT Manager. Used by the avatar, drawer profile,
// greeting, and the in-incident "approved by John" line.
window.PERSONA = {
  name:    "John",
  full:    "John Mathew",
  role:    "IT Manager · IndiaFirst Bank",
  initial: "J",
  email:   "john.mathew@indiafirst.com",
};

// Top-of-home greeting.
// Three lines stacked: small "Welcome, John!" → small "Start with"
// → huge gradient "Agentic IT Service" headline.
window.HOME_GREETING = {
  hello: "Welcome,",
  name:  "John!",
  lead:  "Start with",
  title: "Agentic IT Service",
};

// 4 chiclets above the whisper bar. The Add Agent chiclet kicks the
// wizard in-chat; Recent incidents jumps to the live incident page.
window.HOME_CHICLETS = [
  { id: "cockpit",   label: "Open Cockpit",      prompt: "Open the Cockpit and tell me what needs my eye." },
  { id: "approvals", label: "Today's approvals", prompt: "What's waiting on my approval today?", badge: "4" },
  { id: "incidents", label: "Recent incidents",  prompt: "Show me what's broken right now." },
  { id: "add-agent", label: "Add Agent",         prompt: "Add Agent" },
];

// Awaiting-approval rows. The first row is preset to the "Approved"
// state to mirror image 1 — green check pill + secondary Defer.
window.HOME_SIGNOFFS = [
  {
    id: "home-sig-1", risk: "high",
    agent: "OnboardingAgent", deadline: "before 6 PM today",
    action: "Approve specialist hardware for Rohan Sharma (PL-13234) — Mac Pro M3 Max + dual 4K, $4,200",
    state: "approved", // preset (matches reference design)
  },
  {
    id: "home-sig-2", risk: "medium",
    agent: "ComplianceAgent", deadline: "before May 22",
    action: "Counter-sign Vikram Kapoor's I-9 — work-authorisation expires May 24",
  },
  {
    id: "home-sig-3", risk: "high",
    agent: "ChangeAgent", deadline: "before 6 PM today",
    action: "Approve emergency rollback for card-auth (v3.7.1 → v3.7.0) — 340 merchants impacted",
  },
  {
    id: "home-sig-4", risk: "medium",
    agent: "AccessAgent", deadline: "before May 22",
    action: "Grant production deploy access to Pritesh Sharma — joining payments-platform on-call rota",
  },
];

// "Services to watch" — every row is interactive. The "high" tone row
// is the live P1 incident; clicking its CTA opens the incident.
window.HOME_TRENDING = [
  {
    id:    "card-auth",
    title: "Card payments — declines climbing fast",
    sub:   "card-auth error rate up 3.4× in 24h. SLA breach likely within ~6h.",
    tone:  "high",
    cta:   "Open incident",
    incident: true,    // routes to the incident engine
  },
  {
    title: "Loan applications running slower",
    sub:   "loan-origination p95 latency up 28% over 12h. Approaching the SLO ceiling.",
    tone:  "medium",
    cta:   "Investigate",
  },
  {
    title: "ATM withdrawals failing in Mumbai West",
    sub:   "atm-network failure rate at 1.2% (normally 0.4%) across 3 ATMs.",
    tone:  "medium",
    cta:   "Investigate",
  },
];

// Quiet informational digest — bottom card on home.
window.HOME_DIGEST = [
  {
    tone: "schedule",
    text: "Patch window starts at 2 AM tonight",
    sub:  "4 services queued · no downtime expected",
  },
  {
    tone: "compliance",
    text: "Quarterly KYC sweep done — nothing to flag",
    sub:  "Full report saved in Lens",
  },
  {
    tone: "report",
    text: "Your weekly SLA report is ready",
    sub:  "All targets met · 1 service trending at-risk",
  },
];

// One-line context bubble per chiclet (first Jarvis message after tap).
window.CHICLET_CONTEXT = {
  cockpit:    "Your **Cockpit** is open. Live signals from all 25 agents across Identity, Cost, Reliability and Compliance.",
  approvals:  "**4 items** are waiting for your decision. Approving releases the agent's plan; deferring buys you 24 hours.",
  incidents:  "**Recent incidents** — last 7 days. Tap any row to see what happened, who fixed it, and how long it took.",
  "add-agent":"Let's spin up a new agent. I'll ask you a few questions — jobs-to-be-done, domain, level — and queue the eval pre-flight.",
};

// =====================================================================
// INCIDENT — P1 on card-auth (verbatim from demo-v4/app.js INCIDENT
// + INC_PHASES + INC_AGENTS + INC_CHICLETS).
// =====================================================================
window.INCIDENT = {
  id: "INC-2026-0514-001",
  service: "Card Authorization",
  sev: "P1",
  title: "Card payments — declines crossing SLA threshold",
  sub: "Error rate has just spiked to 8.7% (SLA limit 5%). Agents are taking it.",
  affected: "~340 merchants · ~12,000 active cardholders",
  region: "India (all regions)",
  rootCause:
    "Build v3.7.1 (deployed 09:02 IST) introduced a 3DS timeout regression. " +
    "Visa flows fail when the issuer responds in 2–3s — well within spec, " +
    "but the new code aborts at 1.8s.",
  mitigation: "Rollback to v3.7.0 (last known-good build, 2 days in production).",
};

// Linear phase pipeline for the live incident.
window.INC_PHASES = [
  {
    id: "detected",
    label: "Detected",
    caption: "MonitoringAgent caught the spike and raised the incident.",
    auto: 4500,
    entries: [
      { at: "+0s", agent: "MonitoringAgent",
        text: "Threshold crossed — card-auth error rate at 8.7% (SLA limit 5%)." },
      { at: "+2s", agent: "MonitoringAgent",
        text: "Raised incident INC-2026-0514-001 · paged the on-call rota." },
    ],
    narration:
      "**P1 on card-auth.** Error rate just crossed the SLA hard threshold (8.7%). " +
      "I've routed the incident to DiagnosticsAgent and ObservabilityAgent — " +
      "they're starting triage now. I'll keep you posted here.",
  },
  {
    id: "triaged",
    label: "Triaged",
    caption: "DiagnosticsAgent has handed off to ObservabilityAgent for trace correlation.",
    auto: 6000,
    entries: [
      { at: "+5s", agent: "DiagnosticsAgent",
        text: "Classified as P1 — customer-facing, SLA breach in <6h if untreated." },
      { at: "+8s", agent: "DiagnosticsAgent",
        text: "Handing off to ObservabilityAgent for trace correlation." },
    ],
    narration:
      "DiagnosticsAgent confirms **P1 customer impact**. Routing trace correlation to ObservabilityAgent.",
  },
  {
    id: "investigating",
    label: "Investigating",
    caption: "ObservabilityAgent is correlating failed-auth traces with the recent deploy.",
    auto: 7500,
    entries: [
      { at: "+12s", agent: "ObservabilityAgent",
        text: "Correlated 2,340 failed-auth traces — 98% from card-auth pods on build v3.7.1." },
      { at: "+14s", agent: "ObservabilityAgent",
        text: "Pulled deploy timeline: v3.7.1 went live 09:02 IST (4h 12m ago)." },
      { at: "+16s", agent: "DiagnosticsAgent",
        text: "No infra change inside the window — pointing at a code regression." },
    ],
    narration:
      "ObservabilityAgent has narrowed the blast radius — **98% of failures are on build v3.7.1** which " +
      "went live 4h ago. No infra change in the window, so we're looking at a regression.",
  },
  {
    id: "rootcause",
    label: "Root cause",
    caption: "DiagnosticsAgent identified the regression. RemediationAgent has a rollback plan ready.",
    auto: 5500,
    gate: true, // human-decision gate — pauses until the user picks
    entries: [
      { at: "+20s", agent: "DiagnosticsAgent",
        text: "Root cause: v3.7.1 lowered the 3DS issuer timeout from 3s → 1.8s. Visa flows where the issuer takes 2–3s now fail." },
      { at: "+23s", agent: "RemediationAgent",
        text: "Plan ready: roll back card-auth to v3.7.0 (last known-good, 2 days in prod, zero regressions)." },
      { at: "+25s", agent: "RemediationAgent",
        text: "Awaiting human approval — rollback affects 340 merchants · 12,000 cardholders." },
    ],
    narration:
      "**Root cause confirmed.** v3.7.1 tightened the 3DS issuer timeout to 1.8s — Visa flows where the issuer takes 2–3s now fail. " +
      "RemediationAgent has a rollback plan ready (revert to v3.7.0). " +
      "I'll post the **approval below** the moment the plan is fully drafted — your call from there.",
    approval: {
      eyebrow: "Approval needed · RemediationAgent",
      title:   "Roll back card-auth to v3.7.0?",
      summary:
        "Last known-good build (2 days in prod, zero regressions). Will affect " +
        "**340 merchants** and **~12,000 cardholders** mid-rollout — error rate " +
        "should return to baseline within ~60s.",
      meta: [
        { k: "Plan",          v: "Revert v3.7.1 → v3.7.0 across all card-auth pods" },
        { k: "Audit",         v: "Change record CHG-44102 will be linked" },
        { k: "Reversibility", v: "Rollback is reversible for 30 days" },
      ],
      actions: [
        { id: "approve", label: "Approve mitigation", kind: "primary" },
        { id: "defer",   label: "Defer 30 min",       kind: "secondary" },
        { id: "info",    label: "Request more info",  kind: "tertiary" },
      ],
      replies: {
        approve:
          "On it. **RemediationAgent** is rolling back to **v3.7.0** now — " +
          "**ChangeAgent** will log **CHG-44102** for the audit trail. " +
          "I'll keep you posted as the rollout completes.",
        defer:
          "Paused. I'll re-prompt you at **13:15 IST** — error rate is still at 8.7%, " +
          "so SLA breach window is shrinking. Ping me sooner if you want to act early.",
        info:
          "**DiagnosticsAgent** will draft a deeper RCA in ~5 min — I'll post it here " +
          "with the affected merchant breakdown and the v3.7.0 → v3.7.1 diff.",
      },
    },
  },
  {
    id: "mitigating",
    label: "Mitigating",
    caption: "Rollback in progress. ObservabilityAgent is watching the error rate live.",
    auto: 7000,
    requiresApproval: true, // only runs after the rootcause gate is approved
    entries: [
      { at: "+27s", agent: "RemediationAgent",
        text: "Rollback approved by John — starting deploy of v3.7.0." },
      { at: "+29s", agent: "ChangeAgent",
        text: "Created change record CHG-44102 · linked to incident · audit trail captured." },
      { at: "+32s", agent: "RemediationAgent",
        text: "Rollout 50% … 100%. v3.7.0 is live across all card-auth pods." },
    ],
    narration:
      "Approved — RemediationAgent is rolling back to v3.7.0. ChangeAgent has logged **CHG-44102** for the audit trail.",
  },
  {
    id: "resolved",
    label: "Resolved",
    caption: "Metrics back to baseline. ComplianceAgent has generated the post-incident summary.",
    auto: 5500,
    final: true,
    entries: [
      { at: "+36s", agent: "ObservabilityAgent",
        text: "Error rate dropping: 8.7% → 0.4% (back to baseline)." },
      { at: "+40s", agent: "ObservabilityAgent",
        text: "Verified stable for 60s — closing the incident." },
      { at: "+42s", agent: "ComplianceAgent",
        text: "Generated post-incident summary · saved to Lens · ready to share." },
    ],
    narration:
      "Rollback is live and the error rate is dropping. **ObservabilityAgent** is " +
      "verifying it holds at baseline — I'll surface the wrap-up once the post-incident " +
      "summary is ready.",
  },
];

// =====================================================================
// AGENT WIZARD — 4 questions + 6 pre-flight evals.
// =====================================================================
window.AGENT_DOMAINS = [
  { id: "reliability", label: "Reliability" },
  { id: "cost",        label: "Cost" },
  { id: "identity",    label: "Identity" },
  { id: "compliance",  label: "Compliance" },
];

window.AGENT_LEVELS = [
  { id: "L1", blurb: "Watch only, page me for everything" },
  { id: "L2", blurb: "Watch and triage, ask before acting" },
  { id: "L3", blurb: "Act on low-risk, ask before high-impact" },
  { id: "L4", blurb: "Full autonomy with audit trail" },
];

// Pre-flight evals — order matters (intent/ontology first, runtime
// guardrails last). Verbatim from demo-v4/app.js agentWizard._evals.
window.AGENT_EVALS = [
  { busy: "Validating intent and domain mapping",          done: "Intent and domain mapping validated" },
  { busy: "Resolving ontology bindings for selected domain", done: "Ontology bindings resolved" },
  { busy: "Verifying tool scopes against autonomy level",  done: "Tool scopes match autonomy level" },
  { busy: "Running guardrail safety simulations",          done: "Guardrails passed safety simulation" },
  { busy: "Wiring audit trail for compliance",             done: "Audit trail wired · compliance ready" },
  { busy: "Calibrating initial trust score",               done: "Initial trust calibrated at 88%" },
];

// Tiny keyword heuristics for inferring the domain + suggesting a name.
// Same regex shape as demo-v4/app.js — keep narrow, default to reliability.
window.inferDomain = function (text) {
  const t = (text || "").toLowerCase();
  const hit = (...keys) => keys.some((k) => t.includes(k));
  if (hit("cost", "spend", "budget", "license", "idle", "aws cost", "gcp cost")) return "cost";
  if (hit("onboard", "new hire", "new user", "signup", "sign-up", "provision",
          "access", "mfa", "role", "permission", "principal", "sso", "okta")) return "identity";
  if (hit("audit", "sox", "gdpr", "hipaa", "evidence", "control", "attestation", "compliance")) return "compliance";
  if (hit("latency", "uptime", "sla", "p95", "outage", "downtime", "breach", "error rate")) return "reliability";
  return "reliability";
};

window.suggestName = function (jtbd) {
  const t = (jtbd || "").toLowerCase();
  const map = [
    [/(onboard|new hire|new user|signup|sign-up|provision)/, "OnboardingAgent"],
    [/(uptime|outage|downtime|availability)/, "UptimeAgent"],
    [/(spend|cost|budget)/,                "SpendAgent"],
    [/(license|seat|idle)/,                "LicenseAgent"],
    [/(access|mfa|role|permission|sso)/,   "AccessAgent"],
    [/(audit|sox|gdpr|evidence|control)/,  "ComplianceAgent"],
    [/(patch|cve|vulnerab)/,               "PatchAgent"],
    [/(slack|teams|channel)/,              "ChannelAgent"],
    [/(rollback|release|deploy)/,          "ReleaseAgent"],
    [/(sla|breach)/,                       "SLAAgent"],
    [/(latency|p95|response time)/,        "LatencyAgent"],
  ];
  for (const [re, name] of map) if (re.test(t)) return name;
  return "CustomAgent";
};

// Drawer items — mirrors demo-v4/index.html sidenav order.
window.DRAWER_ITEMS = [
  { id: "tower",    label: "Tower",    icon: "tower" },
  { id: "insight",  label: "Insight",  icon: "insight" },
  { id: "horizon",  label: "Horizon",  icon: "horizon" },
  { id: "lens",     label: "Lens",     icon: "lens" },
  { id: "settings", label: "Settings", icon: "settings" },
];

// =====================================================================
// COCKPIT — the right panel's default canvas (matches the third
// reference image: KPI row + AI Agents list + The Team section).
//
// `accent` drives the agent card's status dot + load bar colour.
// `trustTrend` is shown as a tiny ↓ / ↑ arrow next to Trust.
// =====================================================================
window.COCKPIT = {
  stats: [
    {
      id: "ai-agents", label: "AI Agents", value: "34",
      lines: [
        { tone: "ok",   text: "+2 discovered" },
        { tone: "warn", text: "2 pending registration" },
      ],
    },
    {
      id: "incidents", label: "Incidents · 24h", value: "47",
      lines: [
        { tone: "bad", text: "1 Major" },
        { tone: "ok",  text: "44 auto-resolved" },
      ],
    },
    {
      id: "approvals", label: "Approvals", value: "4",
      lines: [
        { tone: "warn", text: "2 awaiting you" },
        { tone: "ok",   text: "2 auto-cleared" },
      ],
    },
  ],

  agents: [
    {
      id: "remediation", name: "RemediationAgent", level: "L3",
      summary: "Watching checkout-api; deferred 1 rollback to a human.",
      trust: 90, trustTrend: "down", load: 0.46, accent: "blue",
    },
    {
      id: "license", name: "LicenseAgent", level: "L4",
      summary: "Reclaimed 47 idle Figma seats; flagged Adobe CC over-allocation by 12%.",
      trust: 93, trustTrend: "down", load: 0.46, accent: "orange",
    },
    {
      id: "change", name: "ChangeAgent", level: "L3",
      summary: "Logged 12 changes today across 4 services. Zero rollback events.",
      trust: 95, trustTrend: "up", load: 0.32, accent: "blue",
    },
    {
      id: "access", name: "AccessAgent", level: "L2",
      summary: "Provisioned access for 18 new joiners; revoked 4 stale principals.",
      trust: 88, trustTrend: "up", load: 0.61, accent: "blue",
    },
    {
      id: "compliance", name: "ComplianceAgent", level: "L4",
      summary: "Quarterly KYC sweep complete — 2,847 records reviewed, nothing flagged.",
      trust: 97, trustTrend: "up", load: 0.28, accent: "green",
    },
    {
      id: "monitoring", name: "MonitoringAgent", level: "L3",
      summary: "Tracking 47 signals across the fleet; raised 3 incidents in the last 24h.",
      trust: 91, trustTrend: "down", load: 0.74, accent: "blue",
    },
  ],

  team: [
    { name: "John Mathew",   role: "IT Manager · IndiaFirst Bank", agents: 25, you: true },
    { name: "Priya Menon",   role: "HR Admin · TechCorp",          agents: 8 },
    { name: "Vikram Kapoor", role: "Engineering Lead",             agents: 12 },
    { name: "Sarah Chen",    role: "Platform Owner",               agents: 14 },
  ],
};
