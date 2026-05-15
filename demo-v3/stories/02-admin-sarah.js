/* =============================================================
   02-admin-sarah.js — Chapter 2: "The Setup"
   -------------------------------------------------------------
   Persona: Sarah, IT Admin / Supervisor at Acme Health.
   Beat: Welcome → context Q&A → install confirm → Splunk SSO →
   ITSM bootstrap reveal → company-wide Slack reveal.
   Side panel pages: `splunk-auth`, `itsm-bootstrap`.
   The legacy `itsm-dashboard` page factory is kept registered
   (harmless) in case it's wired back in later, but is no longer
   opened by the chapter — the bootstrap reveal already serves
   as the visual confirmation that the install worked.
   ============================================================= */

(function () {
  // -----------------------------------------------------------------
  // Helpers shared by the bootstrap page — kept module-local so we can
  // synthesize a believable IT graph without bloating the page factory.
  // -----------------------------------------------------------------
  const AGENT_ROLES = [
    "Incident", "Change", "Problem", "Request", "Knowledge",
    "Asset", "Identity", "Access", "Software", "License",
    "Patch", "Vuln Scan", "Backup", "DR Drill", "Monitoring",
    "Capacity", "Perf Tune", "Audit", "Cost Watch", "Procure",
    "Vendor", "Contract", "Network", "Security", "Endpoint",
    "Mobile", "Cloud Ops", "Data Ops", "AI Ops", "Chatbot",
    "Triage", "Routing", "Approvals", "Comms", "RCA",
    "Synthetic", "Chaos", "Onboarding", "Offboarding", "Provisioning",
    "Tagging", "Inventory", "Recon", "Forensic", "Drift",
    "Compliance", "Privacy", "PII Sweep", "DLP", "Quarantine",
    "Rollback", "Health Check"
  ];

  // Lightweight node placement helpers — these aren't physics simulations,
  // they just produce stable layouts that read as "graph". The reveal
  // graph adds infra/app/ai layers around the service core for the
  // "entire IT landscape" aha moment.
  function makeServiceLayout(width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const labels = [
      "auth-svc", "payments", "checkout-fe", "orders", "billing",
      "search", "feed", "notifs", "media-cdn", "users",
      "cart-api", "promo", "ledger", "webhooks", "sessions",
      "rate-limit", "feature-flags", "audit-log"
    ];
    const nodes = labels.map((label, i) => {
      const r = 70 + ((i % 3) * 24);
      const angle = (i / labels.length) * Math.PI * 2 + (i % 2 ? 0.18 : -0.18);
      return {
        id: i,
        label,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r * 0.62,
      };
    });
    const edges = [];
    nodes.forEach((n, i) => {
      // Each node connects to 2-3 nearest neighbours for a believable mesh.
      const sorted = nodes
        .map((m, j) => ({ j, d: (n.x - m.x) ** 2 + (n.y - m.y) ** 2 }))
        .filter((s) => s.j !== i)
        .sort((a, b) => a.d - b.d);
      sorted.slice(0, 2 + (i % 2)).forEach((s) => {
        const a = Math.min(i, s.j);
        const b = Math.max(i, s.j);
        if (!edges.some((e) => e.a === a && e.b === b)) edges.push({ a, b });
      });
    });
    return { nodes, edges };
  }

  function makeRevealLayout(width, height) {
    // Layered constellation — infra at the bottom, apps in the middle,
    // services up top, with AI agents forming a halo around the whole
    // mesh. Cross-layer edges convey "dependencies".
    const layers = [
      { kind: "svc", count: 7,  yPct: 0.22, label: "service" },
      { kind: "app", count: 9,  yPct: 0.46, label: "app" },
      { kind: "inf", count: 6,  yPct: 0.72, label: "infra" }
    ];
    const nodes = [];
    layers.forEach((l) => {
      const stepX = width / (l.count + 1);
      for (let i = 0; i < l.count; i++) {
        nodes.push({
          kind: l.kind,
          x: stepX * (i + 1),
          y: height * l.yPct + ((i % 2) * 10 - 5),
        });
      }
    });
    // Halo of AI agents around the constellation
    const haloCount = 14;
    const cx = width / 2;
    const cy = height * 0.46;
    for (let i = 0; i < haloCount; i++) {
      const a = (i / haloCount) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        kind: "ai",
        x: cx + Math.cos(a) * (width * 0.46),
        y: cy + Math.sin(a) * (height * 0.42),
      });
    }
    // Edges: cross-layer + intra-layer
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 90 * 90 && (nodes[i].kind !== "ai" || nodes[j].kind !== "ai")) {
          edges.push({ a: i, b: j });
        }
      }
    }
    return { nodes, edges };
  }

  // Tween a numeric counter from 0 to `target` over `duration` ms.
  function countUp(el, target, duration = 1200, formatter = (n) => n.toLocaleString()) {
    if (!el) return;
    const start = performance.now();
    const initial = Number(el.textContent.replace(/[^\d.-]/g, "")) || 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(initial + (target - initial) * eased);
      el.textContent = formatter(v);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatter(target);
    };
    requestAnimationFrame(tick);
  }

  const pages = {
    /* ---------- Splunk SSO login (ported verbatim) ---------- */
    "splunk-auth": (panel, ctx) => {
      panel.innerHTML = `
        <div class="auth-page">
          <div class="auth-brand">
            <div class="auth-brand__logo auth-brand__logo--img">
              <img src="assets/Splunk.png" alt="Splunk" />
            </div>
            <div>
              <div class="auth-brand__name">splunk&gt;</div>
              <div class="auth-brand__sub">Single Sign-On</div>
            </div>
          </div>
          <div class="auth-card">
            <h3>Sign in to Splunk Cloud</h3>
            <p>Salesforce Jarvis is requesting access to your Splunk workspace.</p>
            <div class="field">
              <label for="splunkUser">Username</label>
              <input id="splunkUser" type="text" value="sarah@acme-health.com" />
            </div>
            <div class="field">
              <label for="splunkPass">Password</label>
              <input id="splunkPass" type="password" value="••••••••••" />
            </div>
            <button class="btn-primary" id="splunkLoginBtn">Login</button>
            <div class="auth-footer">By logging in you authorise Jarvis to read &amp; write incidents on your behalf.</div>
          </div>
        </div>
      `;
      const loginBtn = panel.querySelector("#splunkLoginBtn");
      loginBtn.addEventListener("click", () => {
        if (loginBtn.disabled) return;
        loginBtn.disabled = true;
        loginBtn.classList.add("is-loading");
        loginBtn.innerHTML = `<span class="btn-spinner"></span><span>Authenticating…</span>`;
        setTimeout(() => ctx.dispatch("splunk-login"), 1200);
      });
    },

    /* ---------- ITSM bootstrap — the "aha" moment ----------
       Driven by `bs:phase:*` events fired by the chat side as
       each progress bubble starts. Each phase animates a
       different facet of the install: AI agents, the live
       service graph, the dynamic CMDB, intelligence layers,
       domain knowledge, and the final reveal of the whole IT
       landscape.

       Every visual node is a real ontology entry — Sarah can
       hover for a one-liner, Tab to focus, or click to open
       the shared Inspector drawer with rich detail (skills,
       dependents, runbook steps, etc.). Pure DOM/SVG, no libs. */
    "itsm-bootstrap": (panel, ctx) => {
      const PHASES = [
        { id: "agents",    label: "Activating specialized AI agents" },
        { id: "services",  label: "Materializing service graph from telemetry" },
        { id: "cmdb",      label: "Populating dynamic CMDB" },
        { id: "layers",    label: "Loading intelligence layers" },
        { id: "knowledge", label: "Importing domain knowledge" },
        { id: "reveal",    label: "Your IT landscape is live" },
      ];

      const knowledgePatterns = [
        "Microsoft 365 outage", "VPN tunnel collapse", "DNS resolver flap",
        "Auth token storm", "Cert expiry cascade", "Disk pressure runaway",
        "JVM memory leak", "DB connection pool", "Kafka lag spike",
        "Cloud quota exhausted", "Saturated load balancer",
      ];

      // -------------------------------------------------------------
      // Ontology registries — every interactive node points back to
      // one of these "real" records. Keeping the data here (rather
      // than a separate module) keeps the page factory self-contained
      // and makes the bootstrap easy to fork for other tenants.
      // -------------------------------------------------------------

      // Hand-crafted agent profiles for the highest-signal roles.
      // Anything missing falls back to a sensible default below so
      // every one of the 52 tiles has real-looking content on hover.
      const AGENT_PROFILES = {
        Incident:    { team: "SRE",            trust: 0.96, summary: "Detects, classifies, and routes incidents in real time.",
                       skills: ["Splunk correlation", "PagerDuty routing", "Sev-1 war room"],
                       sample: ["Correlated 18 Splunk alerts → 1 incident", "Paged on-call SRE in 12s", "Spun up Slack #inc-447"] },
        Change:      { team: "Release Eng",    trust: 0.93, summary: "Plans and gates change windows with risk scoring.",
                       skills: ["Pre-flight risk", "Conflict detection", "Auto-rollback"],
                       sample: ["Blocked overlapping ESXi patch + DB migration", "Auto-rolled back release v4.2 on p99 regression"] },
        Problem:     { team: "SRE",            trust: 0.91, summary: "Finds the root cause behind repeat incidents.",
                       skills: ["RCA drafting", "Cluster analysis", "Causal map"],
                       sample: ["Linked 7 'auth flap' tickets to a single bad cert", "Filed problem PRB-1102 with proposed fix"] },
        Request:     { team: "IT Ops",         trust: 0.94, summary: "Handles standard employee service requests end-to-end.",
                       skills: ["Catalog routing", "Auto-approval", "Fulfilment tracking"],
                       sample: ["Granted Figma seat in 8s", "Provisioned VPN profile to new joiner"] },
        Knowledge:   { team: "IT Ops",         trust: 0.89, summary: "Builds and serves runbooks and KB articles.",
                       skills: ["Auto-draft KB", "Stale article detection", "Inline retrieval"],
                       sample: ["Drafted KB-318 from 4 resolved tickets", "Flagged 12 stale articles for review"] },
        Asset:       { team: "IT Ops",         trust: 0.92, summary: "Tracks hardware lifecycle from procurement to retirement.",
                       skills: ["Warranty tracking", "Auto-procure", "Decom scheduling"],
                       sample: ["Ordered 14 laptop replacements (battery <70%)", "Scheduled 23 servers for Q3 decom"] },
        Identity:    { team: "Security",       trust: 0.95, summary: "Manages user identities across SaaS and AD.",
                       skills: ["Onboarding provisioning", "MFA enrolment", "Quarterly access review"],
                       sample: ["Provisioned 4 joiners across 11 SaaS apps", "Caught 3 dormant admin grants"] },
        Access:      { team: "Security",       trust: 0.93, summary: "Grants and revokes access using least-privilege.",
                       skills: ["Just-in-time access", "Auto-revoke", "SoD checks"],
                       sample: ["Granted JIT prod access for 47 min", "Revoked 312 unused entitlements last week"] },
        License:     { team: "Procurement",    trust: 0.88, summary: "Watches license usage + renewal deadlines.",
                       skills: ["Reclaim unused seats", "Renewal alerts", "Usage forecast"],
                       sample: ["Reclaimed 88 unused Salesforce seats", "Flagged Splunk renewal in 38 days"] },
        Patch:       { team: "Endpoint",       trust: 0.90, summary: "Plans and orchestrates patch waves with risk-aware rings.",
                       skills: ["Ring deployment", "Reboot-window math", "Blast-radius scoring"],
                       sample: ["Patched 4,128 endpoints across 3 rings", "Held back patch on 14 critical servers"] },
        Vuln:        { team: "Security",       trust: 0.92, summary: "Continuously scans for vulnerabilities and chains exploit paths.",
                       skills: ["CVE intel", "Reachability analysis", "Patch SLA"],
                       sample: ["Surfaced 3 reachable critical CVEs", "Auto-opened tickets with patch ETA"] },
        Backup:      { team: "Storage",        trust: 0.94, summary: "Verifies backups and runs restore drills.",
                       skills: ["Snapshot integrity", "Restore drill", "Tier-aware retention"],
                       sample: ["Verified 1,247 snapshots overnight", "Ran weekly restore drill (RTO 11m)"] },
        Monitoring:  { team: "Observability",  trust: 0.96, summary: "Owns the alerting fabric — dedupes, suppresses, and enriches.",
                       skills: ["Dedup", "Suppression windows", "Context enrichment"],
                       sample: ["Suppressed 142 duplicate alerts", "Enriched 38 alerts with owner + runbook"] },
        "AI Ops":    { team: "AI Platform",    trust: 0.91, summary: "Coordinates the swarm — picks the right agent for each task.",
                       skills: ["Skill routing", "Confidence scoring", "Fallback to human"],
                       sample: ["Routed 1,802 tickets to specialists", "Escalated 27 low-confidence cases to humans"] },
        Onboarding:  { team: "People Ops",     trust: 0.93, summary: "Walks new joiners from offer to fully-equipped on Day 1.",
                       skills: ["Pre-arrival kit", "Day-1 checklist", "Buddy match"],
                       sample: ["Onboarded 4 joiners in Bengaluru", "Shipped laptops + access bundle 48h early"] },
        Offboarding: { team: "People Ops",     trust: 0.94, summary: "Closes out departing employees safely + completely.",
                       skills: ["Access revocation", "Asset return", "Knowledge handover"],
                       sample: ["Revoked all access for 7 leavers", "Tracked return of 14 devices"] },
      };
      const defaultAgentProfile = (role) => ({
        team: "Specialist Pod",
        trust: 0.85,
        summary: `${role} specialist agent — automates ${role.toLowerCase()} tasks across the org.`,
        skills: ["Pattern matching", "Auto-action", "Human review queue"],
        sample: [`Handled ${20 + (role.length % 30)} ${role.toLowerCase()} actions today`,
                 "Routed low-confidence cases to humans"]
      });
      const getAgentProfile = (role) => AGENT_PROFILES[role] || defaultAgentProfile(role);

      // Service profiles — keyed by the labels in `makeServiceLayout`.
      // Health is shown as a colored dot on hover + in the Inspector.
      const SERVICE_PROFILES = {
        "auth-svc":      { team: "Identity",   rps: "1.2k",  health: "ok",   summary: "OAuth/SSO front door for every employee + customer login." },
        "payments":      { team: "Payments",   rps: "640",   health: "warn", summary: "Card + wallet processing. p99 latency rising — flagged for review." },
        "checkout-fe":   { team: "Storefront", rps: "880",   health: "ok",   summary: "Customer checkout web front-end. Rolling deploy on Tue/Thu." },
        "orders":        { team: "Commerce",   rps: "510",   health: "ok",   summary: "Order ingestion + lifecycle service." },
        "billing":       { team: "Finance",    rps: "320",   health: "ok",   summary: "Invoicing + revenue recognition." },
        "search":        { team: "Discovery",  rps: "2.4k",  health: "ok",   summary: "Catalog search + autocomplete (ElasticSearch behind it)." },
        "feed":          { team: "Engagement", rps: "1.1k",  health: "ok",   summary: "Personalised activity feed for logged-in users." },
        "notifs":        { team: "Engagement", rps: "780",   health: "ok",   summary: "Email + push + SMS dispatch." },
        "media-cdn":     { team: "Platform",   rps: "5.6k",  health: "ok",   summary: "Static + video CDN edge layer." },
        "users":         { team: "Identity",   rps: "920",   health: "ok",   summary: "User profile service + preferences." },
        "cart-api":      { team: "Storefront", rps: "1.3k",  health: "ok",   summary: "Cart state + abandoned-cart hooks." },
        "promo":         { team: "Marketing",  rps: "240",   health: "ok",   summary: "Promotion + coupon evaluation." },
        "ledger":        { team: "Finance",    rps: "180",   health: "ok",   summary: "Double-entry ledger of record." },
        "webhooks":      { team: "Integrations", rps: "410", health: "warn", summary: "Outbound webhook fan-out. 3 partners with elevated retry rate." },
        "sessions":      { team: "Identity",   rps: "2.0k",  health: "ok",   summary: "Session + cookie store." },
        "rate-limit":    { team: "Platform",   rps: "8.2k",  health: "ok",   summary: "API rate limiter — token bucket." },
        "feature-flags": { team: "Platform",   rps: "3.1k",  health: "ok",   summary: "Runtime feature toggle service." },
        "audit-log":     { team: "Security",   rps: "150",   health: "ok",   summary: "Tamper-evident audit log of every privileged action." },
      };

      // CMDB tile drill-downs — each tile expands into a breakdown
      // by sub-category in the Inspector.
      const CMDB_PROFILES = {
        servers:   { title: "Servers",   total: 4128, summary: "Compute fleet across cloud + on-prem.",
                     breakdown: [["Linux",  2341], ["Windows", 1512], ["VMware ESXi", 275]] },
        endpoints: { title: "Endpoints", total: 5902, summary: "Employee laptops, desktops, and managed mobiles.",
                     breakdown: [["macOS laptops", 3107], ["Windows laptops", 2498], ["Mobile (iOS+Android)", 297]] },
        apps:      { title: "Apps",      total: 1847, summary: "SaaS, on-prem, and custom-built apps.",
                     breakdown: [["SaaS", 1348], ["On-prem", 287], ["Custom-built", 212]] },
        network:   { title: "Network",   total:  970, summary: "Switches, routers, firewalls, and Wi-Fi APs.",
                     breakdown: [["Switches", 412], ["Wi-Fi APs", 209], ["Routers", 184], ["Firewalls", 89], ["Load balancers", 76]] },
      };

      // Intelligence layer drill-downs.
      const LAYER_PROFILES = {
        user:     { title: "User Graph",     summary: "Who does what, who owns what, who escalates to whom.",
                    stats: [["Employees", "12,403"], ["Teams", "487"], ["Org units", "38"], ["Manager chains", "12,403"]] },
        identity: { title: "Identity Graph", summary: "Permissions, roles, and entitlements across SaaS + AD.",
                    stats: [["Access grants", "47,612"], ["SaaS apps", "89"], ["AD groups", "14,112"], ["MFA-enrolled", "99.4%"]] },
        agent:    { title: "Agent Graph",    summary: "Agent skills, trust scores, and routing rules.",
                    stats: [["Specialist agents", "52"], ["Routing rules", "230"], ["Trust profiles", "18"], ["Avg confidence", "0.91"]] },
      };

      // Failure-pattern runbooks — opened when a chip is clicked.
      const PATTERN_PROFILES = {
        "Microsoft 365 outage":      { lastSeen: "Mar 12, 2026", impact: "All knowledge workers · email + Teams",
                                       runbook: ["Confirm scope via M365 service health API", "Pin status banner to top of Slack #it-help", "Draft customer-comms note with tenant impact"] },
        "VPN tunnel collapse":       { lastSeen: "Feb 04, 2026", impact: "Remote employees · prod + corp",
                                       runbook: ["Check IPSec phase-2 SA on primary concentrator", "Fail over to secondary site if SA stuck", "Validate split-tunnel routes after recovery"] },
        "DNS resolver flap":         { lastSeen: "Jan 22, 2026", impact: "All services · intermittent",
                                       runbook: ["Compare resolver health across AZs", "Drain unhealthy resolver from anycast pool", "Bump TTL for affected zones temporarily"] },
        "Auth token storm":          { lastSeen: "Mar 30, 2026", impact: "Every service behind SSO",
                                       runbook: ["Identify token-issuance spike source", "Throttle abusive client at the API gateway", "Force token rotation if signing key suspect"] },
        "Cert expiry cascade":       { lastSeen: "Apr 02, 2026", impact: "Several internal services",
                                       runbook: ["List certs expiring in 7d via Let's Encrypt + ACM", "Auto-renew + re-deploy", "Verify chain via openssl s_client"] },
        "Disk pressure runaway":     { lastSeen: "Mar 28, 2026", impact: "Pod evictions on shared cluster",
                                       runbook: ["Identify high-IO offenders via node exporter", "Cordon node + drain workloads", "Resize PV or migrate workload to bigger node"] },
        "JVM memory leak":           { lastSeen: "Feb 18, 2026", impact: "Java services · OOM kills",
                                       runbook: ["Capture heap dump via jcmd", "Compare retained-set with last good build", "Roll back to previous artifact while RCA runs"] },
        "DB connection pool":        { lastSeen: "Mar 19, 2026", impact: "Customer-facing latency",
                                       runbook: ["Inspect pool occupancy via Datadog dashboard", "Bounce app pods to release leaked conns", "Tune pool max + connection timeout"] },
        "Kafka lag spike":           { lastSeen: "Apr 06, 2026", impact: "Downstream consumers stale",
                                       runbook: ["Identify slow consumer group", "Scale partitions or consumers horizontally", "Replay lagged offsets to compaction topic"] },
        "Cloud quota exhausted":     { lastSeen: "Mar 02, 2026", impact: "Deploys blocked",
                                       runbook: ["Identify quota dimension (ENIs / vCPU / IPs)", "Request quota increase via cloud console API", "Reclaim unused resources in the meantime"] },
        "Saturated load balancer":   { lastSeen: "Feb 28, 2026", impact: "5xx errors at peak",
                                       runbook: ["Check LB target health + connection count", "Scale out target group", "Verify keep-alive + idle-timeout settings"] },
      };

      // Reveal-graph kind labels (used in the Inspector).
      const REVEAL_KIND_LABEL = {
        svc: "Service",
        app: "Application",
        inf: "Infrastructure",
        ai:  "AI agent",
      };

      panel.innerHTML = `
        <div class="bootstrap">
          <header class="bootstrap__hero">
            <div class="bootstrap__title">
              <span class="bootstrap__pulse" aria-hidden="true"></span>
              <span>Bootstrapping <strong>Acme Health</strong></span>
            </div>
            <div class="bootstrap__phase" id="bsPhaseLabel">Preparing the install…</div>
            <div class="bootstrap__progress" aria-hidden="true">
              <div class="bootstrap__progress-bar" id="bsProgressBar"></div>
            </div>
          </header>

          <section class="bs-card" data-phase="agents" id="bsAgentsCard">
            <header class="bs-card__head">
              <span class="bs-card__num">1</span>
              <h3>Specialized AI agents</h3>
              <span class="bs-card__count">
                <span id="bsAgentNum">0</span><span class="bs-card__total">+ active</span>
              </span>
              <span class="bs-card__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </span>
            </header>
            <div class="bs-agents">
              <div class="bs-agents__featured" id="bsAgentsFeatured"></div>
              <button
                type="button"
                class="bs-agents__toggle"
                id="bsAgentsToggle"
                aria-expanded="false"
                aria-controls="bsAgentsMore"
              >
                <span class="bs-agents__toggle-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </span>
                <span class="bs-agents__toggle-label" id="bsAgentsToggleLabel">See all <strong>47</strong> more</span>
              </button>
              <div class="bs-agents__more" id="bsAgentsMore" role="region" aria-label="Additional specialized AI agents"></div>
            </div>
            <div class="bs-card__caption">ITIL core, plus 47 more — every domain has a dedicated agent on call.</div>
          </section>

          <section class="bs-card" data-phase="services" id="bsServicesCard">
            <header class="bs-card__head">
              <span class="bs-card__num">2</span>
              <h3>Service graph</h3>
              <span class="bs-card__count">
                <span id="bsSvcNum">0</span><span class="bs-card__total">/142 services</span>
              </span>
              <span class="bs-card__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </span>
            </header>
            <svg class="bs-graph" id="bsGraph" viewBox="0 0 480 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>
            <div class="bs-card__caption">Materialized from live telemetry — no manual mapping.</div>
          </section>

          <section class="bs-card" data-phase="cmdb" id="bsCmdbCard">
            <header class="bs-card__head">
              <span class="bs-card__num">3</span>
              <h3>Dynamic CMDB</h3>
              <span class="bs-card__count">
                <span id="bsCmdbNum">0</span><span class="bs-card__total">/12,847 CIs</span>
              </span>
              <span class="bs-card__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </span>
            </header>
            <div class="bs-cmdb-grid">
              <div class="bs-cmdb-tile" data-target="4128">
                <div class="bs-cmdb-tile__label">Servers</div>
                <div class="bs-cmdb-tile__value">0</div>
              </div>
              <div class="bs-cmdb-tile" data-target="5902">
                <div class="bs-cmdb-tile__label">Endpoints</div>
                <div class="bs-cmdb-tile__value">0</div>
              </div>
              <div class="bs-cmdb-tile" data-target="1847">
                <div class="bs-cmdb-tile__label">Apps</div>
                <div class="bs-cmdb-tile__value">0</div>
              </div>
              <div class="bs-cmdb-tile" data-target="970">
                <div class="bs-cmdb-tile__label">Network</div>
                <div class="bs-cmdb-tile__value">0</div>
              </div>
            </div>
            <div class="bs-card__caption">No CSVs, no manual entry — populated from live signals.</div>
          </section>

          <section class="bs-card" data-phase="layers" id="bsLayersCard">
            <header class="bs-card__head">
              <span class="bs-card__num">4</span>
              <h3>Intelligence layers</h3>
              <span class="bs-card__count"><span id="bsLayerNum">0</span><span class="bs-card__total">/3 ready</span></span>
              <span class="bs-card__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </span>
            </header>
            <div class="bs-layers">
              <div class="bs-layer" data-layer="user">
                <div class="bs-layer__icon">U</div>
                <div class="bs-layer__body">
                  <div class="bs-layer__name">User Graph</div>
                  <div class="bs-layer__sub">Who does what · ownership · escalation paths</div>
                </div>
                <span class="bs-layer__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
              </div>
              <div class="bs-layer" data-layer="identity">
                <div class="bs-layer__icon">I</div>
                <div class="bs-layer__body">
                  <div class="bs-layer__name">Identity Graph</div>
                  <div class="bs-layer__sub">Permissions · roles · entitlements across SaaS</div>
                </div>
                <span class="bs-layer__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
              </div>
              <div class="bs-layer" data-layer="agent">
                <div class="bs-layer__icon">A</div>
                <div class="bs-layer__body">
                  <div class="bs-layer__name">Agent Graph</div>
                  <div class="bs-layer__sub">Agent skills · trust scores · routing rules</div>
                </div>
                <span class="bs-layer__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
              </div>
            </div>
          </section>

          <section class="bs-card" data-phase="knowledge" id="bsKnowledgeCard">
            <header class="bs-card__head">
              <span class="bs-card__num">5</span>
              <h3>Domain knowledge</h3>
              <span class="bs-card__count">
                <span id="bsKnowNum">0</span><span class="bs-card__total">+ patterns</span>
              </span>
              <span class="bs-card__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </span>
            </header>
            <div class="bs-knowledge-chips" id="bsKnowChips">
              ${knowledgePatterns.map((p) => `<span class="bs-chip">${p}</span>`).join("")}
              <span class="bs-chip bs-chip--more">+489 more</span>
            </div>
            <div class="bs-card__caption">Each pattern ships with a runbook and approval policy.</div>
          </section>

          <section class="bs-card bs-card--reveal" data-phase="reveal" id="bsRevealCard">
            <header class="bs-card__head">
              <span class="bs-card__num">✦</span>
              <h3>Your IT landscape</h3>
              <span class="bs-pill">live</span>
            </header>
            <div class="bs-reveal">
              <svg class="bs-reveal__graph" id="bsReveal" viewBox="0 0 480 280" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your IT landscape graph — hover or focus a node for details"></svg>
              <div class="bs-reveal__legend">
                <span class="bs-legend"><span class="bs-legend__dot bs-legend__dot--svc"></span>Services</span>
                <span class="bs-legend"><span class="bs-legend__dot bs-legend__dot--app"></span>Apps</span>
                <span class="bs-legend"><span class="bs-legend__dot bs-legend__dot--inf"></span>Infra</span>
                <span class="bs-legend"><span class="bs-legend__dot bs-legend__dot--ai"></span>AI agents</span>
              </div>
            </div>
            <div class="bs-card__caption">More accurate than a year-long manual CMDB project.</div>
          </section>

          <!-- Shared tooltip + Inspector modal. Single instance,
               every phase's interactive nodes feed into them. The
               Inspector is a true centered modal: backdrop dims the
               whole bootstrap pane, dialog opens in the middle, Esc
               or backdrop-click dismisses, focus moves into the
               dialog and returns to the originating node on close. -->
          <div class="bs-tooltip" id="bsTooltip" role="tooltip" aria-hidden="true"></div>

          <div class="bs-inspector" id="bsInspector" aria-hidden="true">
            <div class="bs-inspector__backdrop" id="bsInspectorBackdrop" aria-hidden="true"></div>
            <div class="bs-inspector__dialog" role="dialog" aria-modal="true"
                 aria-labelledby="bsInspectorTitle" tabindex="-1">
              <header class="bs-inspector__head">
                <div>
                  <div class="bs-inspector__eyebrow" id="bsInspectorEyebrow">Detail</div>
                  <h3 class="bs-inspector__title" id="bsInspectorTitle">Select a node</h3>
                </div>
                <button type="button" class="bs-inspector__close" id="bsInspectorClose"
                        aria-label="Close detail panel">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
                       stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 3l10 10M13 3 3 13"/>
                  </svg>
                </button>
              </header>
              <div class="bs-inspector__body" id="bsInspectorBody"></div>
            </div>
          </div>
        </div>
      `;

      // -------------------------------------------------------------
      // Tooltip + Inspector — single shared instances. The tooltip
      // follows the cursor / focused element with a one-liner; the
      // Inspector drawer slides up from the bottom on click for the
      // full record. Keeping them shared (rather than per-phase)
      // means consistent behavior + only one set of listeners.
      // -------------------------------------------------------------
      const bsRoot         = panel.querySelector(".bootstrap");
      const tooltipEl      = panel.querySelector("#bsTooltip");
      const inspectorEl    = panel.querySelector("#bsInspector");
      const inspDialogEl   = panel.querySelector(".bs-inspector__dialog");
      const inspBackdropEl = panel.querySelector("#bsInspectorBackdrop");
      const inspBodyEl     = panel.querySelector("#bsInspectorBody");
      const inspTitleEl    = panel.querySelector("#bsInspectorTitle");
      const inspEyebEl     = panel.querySelector("#bsInspectorEyebrow");
      const inspCloseBtn   = panel.querySelector("#bsInspectorClose");
      const escape = (s) => String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      // payload registry — keyed by entity id (e.g. `agent:Incident`,
      // `service:auth-svc`, `cmdb:servers`). Set when an element is
      // bound, looked up by the delegated event handlers below.
      const payloads = new Map();

      // Build the small floating chip shown on hover/focus. Just a
      // title + a one-liner; click for the full Inspector.
      function tooltipFor(p) {
        const health = p.health
          ? `<span class="bs-tooltip__health bs-tooltip__health--${p.health}"></span>`
          : "";
        return `
          <div class="bs-tooltip__row">
            ${health}
            <strong>${escape(p.title)}</strong>
            ${p.eyebrow ? `<span class="bs-tooltip__eyebrow">${escape(p.eyebrow)}</span>` : ""}
          </div>
          ${p.tooltip ? `<div class="bs-tooltip__sub">${escape(p.tooltip)}</div>` : ""}
          <div class="bs-tooltip__hint">Click for detail</div>
        `;
      }
      function showTooltip(target, p) {
        tooltipEl.innerHTML = tooltipFor(p);
        tooltipEl.dataset.show = "1";
        tooltipEl.setAttribute("aria-hidden", "false");
        positionTooltip(target);
      }
      function hideTooltip() {
        tooltipEl.dataset.show = "0";
        tooltipEl.setAttribute("aria-hidden", "true");
      }
      function positionTooltip(target) {
        const tip = tooltipEl;
        const root = bsRoot.getBoundingClientRect();
        const tr = target.getBoundingClientRect();
        // Anchor above the target, centered, with a 10px gap. If
        // there isn't room above (top of panel), flip below.
        const tipRect = tip.getBoundingClientRect();
        let left = tr.left - root.left + (tr.width / 2) - (tipRect.width / 2);
        let top  = tr.top  - root.top  - tipRect.height - 10;
        let placement = "top";
        if (top < 8) {
          top = tr.bottom - root.top + 10;
          placement = "bottom";
        }
        // Clamp horizontally inside the bootstrap pane.
        const maxLeft = bsRoot.clientWidth - tipRect.width - 8;
        left = Math.max(8, Math.min(maxLeft, left));
        tip.style.transform = `translate(${left}px, ${top}px)`;
        tip.dataset.placement = placement;
      }

      // Inspector body builder — uses the same payload object as the
      // tooltip but pulls the richer `sections` + `actions` fields.
      function renderInspectorBody(p) {
        const sections = (p.sections || []).map((s) => `
          <section class="bs-insp-section">
            ${s.heading ? `<h4>${escape(s.heading)}</h4>` : ""}
            ${s.kvs ? `
              <dl class="bs-insp-kv">
                ${s.kvs.map(([k, v]) => `
                  <div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>
                `).join("")}
              </dl>
            ` : ""}
            ${s.list ? `
              <ul class="bs-insp-list">
                ${s.list.map((item) => `<li>${escape(item)}</li>`).join("")}
              </ul>
            ` : ""}
            ${s.text ? `<p class="bs-insp-text">${escape(s.text)}</p>` : ""}
          </section>
        `).join("");
        const actions = (p.actions || []).map((a) => `
          <button type="button" class="bs-insp-btn ${a.primary ? "bs-insp-btn--primary" : ""}">${escape(a.label)}</button>
        `).join("");
        return `
          ${p.summary ? `<p class="bs-insp-summary">${escape(p.summary)}</p>` : ""}
          ${sections}
          ${actions ? `<div class="bs-insp-actions">${actions}</div>` : ""}
        `;
      }
      let lastFocus = null;
      function openInspector(p, originEl) {
        lastFocus = originEl || document.activeElement;
        inspEyebEl.textContent = p.eyebrow || "Detail";
        inspTitleEl.textContent = p.title || "";
        inspBodyEl.innerHTML = renderInspectorBody(p);
        inspectorEl.dataset.show = "1";
        inspectorEl.setAttribute("aria-hidden", "false");
        // Modal semantics: focus moves into the dialog (the actual
        // role="dialog" surface) so SR + keyboard land inside the
        // modal rather than on the outer overlay shell.
        requestAnimationFrame(() => inspDialogEl.focus());
        hideTooltip();
      }
      function closeInspector() {
        if (inspectorEl.dataset.show !== "1") return;
        inspectorEl.dataset.show = "0";
        inspectorEl.setAttribute("aria-hidden", "true");
        if (lastFocus && typeof lastFocus.focus === "function") {
          requestAnimationFrame(() => lastFocus.focus());
        }
      }
      inspCloseBtn.addEventListener("click", closeInspector);
      // Backdrop-click dismisses the modal — but only when the
      // user clicked the dim overlay itself, not bubbled clicks
      // from inside the dialog (e.g. action buttons).
      inspBackdropEl.addEventListener("click", closeInspector);
      bsRoot.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && inspectorEl.dataset.show === "1") {
          e.stopPropagation();
          closeInspector();
        }
      });

      // Bind any element as an interactive ontology node. Adds the
      // a11y wiring (focusable, role=button, label) and registers
      // the payload — actual hover/click is handled via delegation.
      function bindInteractive(el, payload) {
        el.dataset.entityId = payload.id;
        el.dataset.interactive = "1";
        el.setAttribute("role", "button");
        el.setAttribute("aria-label", payload.ariaLabel || `${payload.title}. Click for detail.`);
        // SVG elements take `tabindex` as an attribute, not a property.
        el.setAttribute("tabindex", "0");
        payloads.set(payload.id, payload);
      }

      const findInteractive = (target) => {
        // Walk up to the nearest [data-interactive] — works for
        // both DOM elements and SVG nodes.
        let n = target;
        while (n && n !== bsRoot) {
          if (n.dataset && n.dataset.interactive === "1") return n;
          n = n.parentNode;
        }
        return null;
      };

      // Delegated listeners on the bootstrap root. Hover + focus
      // both surface the tooltip; click + Enter/Space open the
      // Inspector. CSS gates pending-phase cards from receiving
      // pointer events, so phase 1 elements aren't interactive
      // until phase 1 actually activates.
      bsRoot.addEventListener("mouseover", (e) => {
        const el = findInteractive(e.target);
        if (!el) return;
        const p = payloads.get(el.dataset.entityId);
        if (p) showTooltip(el, p);
      });
      bsRoot.addEventListener("mouseout", (e) => {
        const el = findInteractive(e.target);
        if (!el) return;
        // Only hide if leaving the interactive element entirely.
        if (!el.contains(e.relatedTarget)) hideTooltip();
      });
      bsRoot.addEventListener("focusin", (e) => {
        const el = findInteractive(e.target);
        if (!el) return;
        const p = payloads.get(el.dataset.entityId);
        if (p) showTooltip(el, p);
      });
      bsRoot.addEventListener("focusout", () => hideTooltip());
      bsRoot.addEventListener("click", (e) => {
        const el = findInteractive(e.target);
        if (!el) return;
        const p = payloads.get(el.dataset.entityId);
        if (p) openInspector(p, el);
      });
      bsRoot.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const el = findInteractive(e.target);
        if (!el) return;
        e.preventDefault();
        const p = payloads.get(el.dataset.entityId);
        if (p) openInspector(p, el);
      });
      // Repaint tooltip position when the panel scrolls or resizes.
      const repositionIfShown = () => {
        if (tooltipEl.dataset.show !== "1") return;
        const focused = bsRoot.querySelector('[data-interactive]:focus');
        const hovered = bsRoot.querySelector('[data-interactive]:hover');
        const target = focused || hovered;
        if (target) positionTooltip(target);
        else hideTooltip();
      };
      panel.addEventListener("scroll", repositionIfShown, true);
      window.addEventListener("resize", repositionIfShown);

      // ---- Build the agent chips (52 specialized agents, lit on phase 1) ----
      // The first 5 chips are "featured" — shown up front as a tidy row of
      // recognizable ITIL agents. The remaining 47 live in a collapsible
      // group revealed by a "See all" toggle, so the card stays compact.
      const FEATURED_AGENT_COUNT = 5;
      const agentsFeatured = panel.querySelector("#bsAgentsFeatured");
      const agentsMore     = panel.querySelector("#bsAgentsMore");
      const agentsToggle   = panel.querySelector("#bsAgentsToggle");
      const agentsToggleLabel = panel.querySelector("#bsAgentsToggleLabel");

      const buildAgentChip = (role, cascadeIndex) => {
        const profile = getAgentProfile(role);
        const dot = document.createElement("div");
        dot.className = "bs-agent";
        dot.style.setProperty("--i", cascadeIndex);
        dot.innerHTML = `
          <span class="bs-agent__glyph">${role.charAt(0)}</span>
          <span class="bs-agent__name">${role}</span>
        `;
        bindInteractive(dot, {
          id: `agent:${role}`,
          eyebrow: "AI agent",
          title: `${role} agent`,
          tooltip: profile.summary,
          summary: profile.summary,
          ariaLabel: `${role} agent. ${profile.summary}. Click for detail.`,
          sections: [
            { kvs: [
              ["Owning team", profile.team],
              ["Trust score", `${Math.round(profile.trust * 100)}%`],
            ]},
            { heading: "Skills", list: profile.skills },
            { heading: "Recent activity", list: profile.sample },
          ],
          actions: [
            { label: "Open agent profile", primary: true },
            { label: "View routing rules" },
          ],
        });
        return dot;
      };

      AGENT_ROLES.slice(0, FEATURED_AGENT_COUNT).forEach((role, i) => {
        agentsFeatured.appendChild(buildAgentChip(role, i));
      });

      const moreRoles = AGENT_ROLES.slice(FEATURED_AGENT_COUNT);
      const moreCount = moreRoles.length;
      let agentsMoreRendered = false;
      let agentsExpanded     = false;

      const setToggleLabel = (expanded) => {
        agentsToggleLabel.innerHTML = expanded
          ? "Show less"
          : `See all <strong>${moreCount}</strong> more`;
      };

      const expandAgents = () => {
        if (!agentsMoreRendered) {
          // Append with a "mounting" class so each chip has a stable
          // opacity:0 starting style. Without this, chips inserted while
          // the card is already in `data-state="done"` would skip their
          // fade-in transition (the browser uses the final computed style
          // as the initial one and no transition fires).
          const frag = document.createDocumentFragment();
          moreRoles.forEach((role, i) => {
            const chip = buildAgentChip(role, i);
            chip.classList.add("bs-agent--mounting");
            frag.appendChild(chip);
          });
          agentsMore.appendChild(frag);
          agentsMoreRendered = true;
          // Flush styles before clearing the mounting class so the
          // cascade transition actually plays.
          /* eslint-disable-next-line no-unused-expressions */
          agentsMore.getBoundingClientRect();
          requestAnimationFrame(() => {
            agentsMore.querySelectorAll(".bs-agent--mounting").forEach((el) => {
              el.classList.remove("bs-agent--mounting");
            });
          });
        }
        agentsExpanded = true;
        agentsMore.classList.add("is-open");
        agentsToggle.classList.add("is-open");
        agentsToggle.setAttribute("aria-expanded", "true");
        setToggleLabel(true);
      };

      const collapseAgents = () => {
        agentsExpanded = false;
        agentsMore.classList.remove("is-open");
        agentsToggle.classList.remove("is-open");
        agentsToggle.setAttribute("aria-expanded", "false");
        setToggleLabel(false);
      };

      agentsToggle.addEventListener("click", () => {
        if (agentsExpanded) collapseAgents();
        else                expandAgents();
      });

      // Sync the toggle label with the live count, in case AGENT_ROLES
      // changes (the markup ships with a fallback number).
      setToggleLabel(false);

      // ---- Build the service graph SVG (drawn once, animated on phase 2) ----
      const svg = panel.querySelector("#bsGraph");
      const svgNS = "http://www.w3.org/2000/svg";
      const layout = makeServiceLayout(480, 220);
      // Index dependents per node so the Inspector can list neighbours.
      const neighborsByNode = layout.nodes.map(() => new Set());
      layout.edges.forEach((e) => {
        neighborsByNode[e.a].add(e.b);
        neighborsByNode[e.b].add(e.a);
      });
      // Edges first so nodes render on top.
      layout.edges.forEach((e, i) => {
        const a = layout.nodes[e.a];
        const b = layout.nodes[e.b];
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
        line.setAttribute("class", "bs-graph__edge");
        line.style.setProperty("--i", i);
        const dx = a.x - b.x, dy = a.y - b.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        line.style.strokeDasharray = `${len}`;
        line.style.strokeDashoffset = `${len}`;
        svg.appendChild(line);
      });
      layout.nodes.forEach((n, i) => {
        const g = document.createElementNS(svgNS, "g");
        g.setAttribute("class", "bs-graph__node");
        g.style.setProperty("--i", i);
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", n.x); c.setAttribute("cy", n.y); c.setAttribute("r", 6);
        c.setAttribute("class", "bs-graph__dot");
        const t = document.createElementNS(svgNS, "text");
        t.setAttribute("x", n.x); t.setAttribute("y", n.y - 10);
        t.setAttribute("class", "bs-graph__label");
        t.setAttribute("text-anchor", "middle");
        t.textContent = n.label;
        g.appendChild(c); g.appendChild(t);
        svg.appendChild(g);

        const profile = SERVICE_PROFILES[n.label] || {
          team: "Platform", rps: "—", health: "ok",
          summary: `${n.label} service.`,
        };
        const neighborLabels = [...neighborsByNode[i]]
          .map((j) => layout.nodes[j].label)
          .sort();
        g.classList.add(`bs-graph__node--${profile.health}`);
        bindInteractive(g, {
          id: `service:${n.label}`,
          eyebrow: "Service",
          title: n.label,
          health: profile.health,
          tooltip: `${profile.team} · ${profile.rps} req/s · ${profile.health.toUpperCase()}`,
          summary: profile.summary,
          ariaLabel: `${n.label} service, owned by ${profile.team}, ${profile.rps} requests per second, health ${profile.health}. Click for detail.`,
          sections: [
            { kvs: [
              ["Owning team",    profile.team],
              ["Throughput",     `${profile.rps} req/s`],
              ["Health",         profile.health.toUpperCase()],
              ["Direct neighbours", String(neighborLabels.length)],
            ]},
            { heading: `Connected to (${neighborLabels.length})`, list: neighborLabels },
          ],
          actions: [
            { label: "Open service page", primary: true },
            { label: "View dependency graph" },
          ],
        });
      });

      // ---- Build the reveal constellation (drawn once, lights up on phase 6) ----
      const revealSvg = panel.querySelector("#bsReveal");
      const reveal = makeRevealLayout(480, 280);
      reveal.edges.forEach((e, i) => {
        const a = reveal.nodes[e.a];
        const b = reveal.nodes[e.b];
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
        line.setAttribute("class", "bs-reveal__edge");
        line.style.setProperty("--i", i);
        revealSvg.appendChild(line);
      });
      // Index reveal-node neighbours so the Inspector can show them.
      const revealNeighbors = reveal.nodes.map(() => new Set());
      reveal.edges.forEach((e) => {
        revealNeighbors[e.a].add(e.b);
        revealNeighbors[e.b].add(e.a);
      });
      reveal.nodes.forEach((n, i) => {
        const c = document.createElementNS(svgNS, "circle");
        c.setAttribute("cx", n.x);
        c.setAttribute("cy", n.y);
        c.setAttribute("r", n.kind === "ai" ? 3.2 : (n.kind === "svc" ? 5.5 : 4.5));
        c.setAttribute("class", `bs-reveal__node bs-reveal__node--${n.kind}`);
        c.style.setProperty("--i", i);
        revealSvg.appendChild(c);

        const kindLabel = REVEAL_KIND_LABEL[n.kind] || "Node";
        const nodeName = `${kindLabel} ${i + 1}`;
        bindInteractive(c, {
          id: `reveal:${i}`,
          eyebrow: kindLabel,
          title: nodeName,
          tooltip: `${kindLabel} · ${revealNeighbors[i].size} connection${revealNeighbors[i].size === 1 ? "" : "s"}`,
          summary: `One of ${reveal.nodes.length} nodes Jarvis is reasoning over right now.`,
          sections: [
            { kvs: [
              ["Kind", kindLabel],
              ["Connections", String(revealNeighbors[i].size)],
              ["Position", `(${Math.round(n.x)}, ${Math.round(n.y)})`],
            ]},
          ],
          actions: [{ label: "Open in Control Tower", primary: true }],
        });
      });

      // -------------------------------------------------------------
      // Bind the static phases (CMDB tiles · intelligence layers ·
      // knowledge chips). Their markup is in the page's innerHTML
      // template above, so we wire them here once the DOM is mounted.
      // -------------------------------------------------------------
      const CMDB_KEY_BY_LABEL = {
        Servers:   "servers",
        Endpoints: "endpoints",
        Apps:      "apps",
        Network:   "network",
      };
      panel.querySelectorAll(".bs-cmdb-tile").forEach((tile) => {
        const label = tile.querySelector(".bs-cmdb-tile__label").textContent.trim();
        const key   = CMDB_KEY_BY_LABEL[label];
        const profile = CMDB_PROFILES[key];
        if (!profile) return;
        bindInteractive(tile, {
          id: `cmdb:${key}`,
          eyebrow: "Configuration items",
          title: profile.title,
          tooltip: `${profile.total.toLocaleString()} items · click for breakdown`,
          summary: profile.summary,
          ariaLabel: `${profile.title}, ${profile.total.toLocaleString()} items. Click for breakdown.`,
          sections: [
            { heading: "Breakdown",
              kvs: profile.breakdown.map(([k, v]) => [k, v.toLocaleString()]) },
            { heading: "Discovery sources",
              list: ["Asset DB", "Mule Agent Fabric runtime", "SSO group memberships"] },
          ],
          actions: [
            { label: "Open in CMDB", primary: true },
            { label: "Export CSV" },
          ],
        });
      });

      panel.querySelectorAll(".bs-layer").forEach((layerEl) => {
        const key = layerEl.dataset.layer;
        const profile = LAYER_PROFILES[key];
        if (!profile) return;
        bindInteractive(layerEl, {
          id: `layer:${key}`,
          eyebrow: "Intelligence layer",
          title: profile.title,
          tooltip: profile.summary,
          summary: profile.summary,
          ariaLabel: `${profile.title}. ${profile.summary}. Click for stats.`,
          sections: [
            { heading: "Live counts", kvs: profile.stats },
          ],
          actions: [{ label: `Open ${profile.title}`, primary: true }],
        });
      });

      // Replace the static knowledge chips with interactive ones —
      // each opens its runbook stub in the Inspector.
      const chipsRoot = panel.querySelector("#bsKnowChips");
      chipsRoot.innerHTML = "";
      knowledgePatterns.forEach((p) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "bs-chip";
        chip.textContent = p;
        const profile = PATTERN_PROFILES[p] || {
          lastSeen: "—", impact: "—",
          runbook: ["Triage signal source", "Confirm scope", "Apply remediation"],
        };
        bindInteractive(chip, {
          id: `pattern:${p}`,
          eyebrow: "Failure pattern",
          title: p,
          tooltip: `Last seen ${profile.lastSeen} · ${profile.runbook.length}-step runbook`,
          summary: `One of 500+ patterns Jarvis ships with. Each carries a runbook and an approval policy.`,
          ariaLabel: `${p}. Last seen ${profile.lastSeen}. Click for runbook.`,
          sections: [
            { kvs: [
              ["Last seen", profile.lastSeen],
              ["Impact",    profile.impact],
            ]},
            { heading: "Runbook", list: profile.runbook },
          ],
          actions: [
            { label: "Run with approval", primary: true },
            { label: "Edit runbook" },
          ],
        });
        chipsRoot.appendChild(chip);
      });
      const more = document.createElement("span");
      more.className = "bs-chip bs-chip--more";
      more.textContent = "+489 more";
      chipsRoot.appendChild(more);

      // ---- Phase plumbing -------------------------------------------------
      const phaseLabelEl = panel.querySelector("#bsPhaseLabel");
      const progressBar  = panel.querySelector("#bsProgressBar");
      const cards = {
        agents:    panel.querySelector("#bsAgentsCard"),
        services:  panel.querySelector("#bsServicesCard"),
        cmdb:      panel.querySelector("#bsCmdbCard"),
        layers:    panel.querySelector("#bsLayersCard"),
        knowledge: panel.querySelector("#bsKnowledgeCard"),
        reveal:    panel.querySelector("#bsRevealCard"),
      };

      // Gate tab focus on pending cards. CSS already gates pointer
      // events, but `inert` is the only way to remove a section from
      // tab order without touching every child's tabindex.
      Object.values(cards).forEach((card) => card && (card.inert = true));

      let activeIdx = -1;
      function activatePhase(id) {
        const idx = PHASES.findIndex((p) => p.id === id);
        if (idx < 0) return;
        // Mark all earlier phases as done; this is robust to fast-forwarding.
        PHASES.forEach((p, i) => {
          const card = cards[p.id];
          if (!card) return;
          if (i < idx) {
            card.dataset.state = "done";
            card.inert = false;
          } else if (i === idx) {
            card.dataset.state = "active";
            card.inert = false;
            // Auto-scroll the active card into view inside the panel.
            requestAnimationFrame(() => {
              card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
          }
        });
        activeIdx = idx;
        phaseLabelEl.textContent = `Phase ${Math.min(idx + 1, 5)} of 5 · ${PHASES[idx].label}`;
        const pct = Math.min(100, Math.round(((idx + 1) / 5) * 100));
        progressBar.style.width = `${pct}%`;
        if (id === "reveal") {
          phaseLabelEl.textContent = PHASES[idx].label;
          bsRoot.classList.add("bootstrap--complete");
        }
        runPhaseAnim(id);
      }

      function runPhaseAnim(id) {
        if (id === "agents") {
          countUp(panel.querySelector("#bsAgentNum"), 50, 1800, (n) => `${n}`);
        }
        if (id === "services") {
          countUp(panel.querySelector("#bsSvcNum"), 142, 1800);
        }
        if (id === "cmdb") {
          panel.querySelectorAll(".bs-cmdb-tile").forEach((tile) => {
            const target = Number(tile.dataset.target) || 0;
            countUp(tile.querySelector(".bs-cmdb-tile__value"), target, 1800);
          });
          countUp(panel.querySelector("#bsCmdbNum"), 12847, 1800);
        }
        if (id === "layers") {
          const layerEls = panel.querySelectorAll(".bs-layer");
          let n = 0;
          layerEls.forEach((el, i) => {
            setTimeout(() => {
              el.classList.add("is-on");
              n += 1;
              const numEl = panel.querySelector("#bsLayerNum");
              if (numEl) numEl.textContent = String(n);
            }, 400 + i * 360);
          });
        }
        if (id === "knowledge") {
          countUp(panel.querySelector("#bsKnowNum"), 500, 1800);
        }
      }

      // Subscribe to events fired by the chat-side runner. Events are
      // dispatched on `<aside.sidepanel>` (not the viewport), so climb
      // up to the right host.
      const sidepanel = panel.closest(".sidepanel") || panel.parentNode;
      const handlers = {};
      PHASES.forEach((p) => {
        handlers[p.id] = () => activatePhase(p.id);
        sidepanel.addEventListener(`bs:phase:${p.id}`, handlers[p.id]);
      });

      // Cleanup when the page is replaced. The engine clears innerHTML
      // before the next page mounts, so we detach side-panel + window
      // listeners (the in-tree delegated ones disappear with the DOM).
      const observer = new MutationObserver(() => {
        if (!panel.contains(bsRoot)) {
          PHASES.forEach((p) =>
            sidepanel.removeEventListener(`bs:phase:${p.id}`, handlers[p.id])
          );
          window.removeEventListener("resize", repositionIfShown);
          panel.removeEventListener("scroll", repositionIfShown, true);
          observer.disconnect();
        }
      });
      observer.observe(panel, { childList: true });
    },

    /* ---------- CMDB discovery dashboard (ported verbatim) --- */
    "itsm-dashboard": (panel) => {
      const items = [
        { sn: "AH-MAC-0481", mfr: "Apple",   exp: "2027-04-18", health: "ok"   },
        { sn: "AH-WIN-1192", mfr: "Dell",    exp: "2026-06-02", health: "warn" },
        { sn: "AH-SRV-2034", mfr: "HPE",     exp: "2028-11-30", health: "ok"   },
        { sn: "AH-NET-0719", mfr: "Cisco",   exp: "2026-05-22", health: "warn" },
        { sn: "AH-MAC-0498", mfr: "Apple",   exp: "2027-09-14", health: "ok"   },
        { sn: "AH-WIN-1207", mfr: "Lenovo",  exp: "2025-12-09", health: "crit" },
        { sn: "AH-SRV-2055", mfr: "Dell",    exp: "2029-02-04", health: "ok"   },
        { sn: "AH-IOT-3301", mfr: "Aruba",   exp: "2027-08-21", health: "ok"   },
        { sn: "AH-NET-0822", mfr: "Juniper", exp: "2026-03-15", health: "warn" },
        { sn: "AH-MAC-0512", mfr: "Apple",   exp: "2028-01-07", health: "ok"   }
      ];
      const healthLabel = { ok: "Healthy", warn: "Warning", crit: "Critical" };
      const rows = items.map(i => `
        <div class="ci-row">
          <div class="ci-cell ci-cell--sn">${i.sn}</div>
          <div class="ci-cell">${i.mfr}</div>
          <div class="ci-cell">${i.exp}</div>
          <div class="ci-cell">
            <span class="ci-health ci-health--${i.health}">
              <span class="ci-health__dot"></span>${healthLabel[i.health]}
            </span>
          </div>
        </div>
      `).join("");

      panel.innerHTML = `
        <div class="dash">
          <h2><span class="dot"></span> CMDB discovery dashboard</h2>

          <div class="tile">
            <div class="tile__label">CI detected</div>
            <div class="tile__value">${items.length.toLocaleString()}</div>
            <div class="tile__delta">▲ +3 in last hour</div>
          </div>

          <div class="tile">
            <div class="tile__label">Percentage completed</div>
            <div class="tile__value" id="pctValue">0%</div>
            <div class="tile__progress">
              <div class="tile__progress__bar" id="pctBar"></div>
            </div>
          </div>

          <div class="tile tile--wide tile--ci">
            <div class="tile__label">Discovered configuration items</div>
            <div class="ci-grid">
              <div class="ci-row ci-row--head">
                <div class="ci-cell">Serial number</div>
                <div class="ci-cell">Manufacturer</div>
                <div class="ci-cell">Expiry date</div>
                <div class="ci-cell">Health</div>
              </div>
              ${rows}
            </div>
          </div>
        </div>
      `;

      const pctBar   = panel.querySelector("#pctBar");
      const pctValue = panel.querySelector("#pctValue");
      const target = 78;
      requestAnimationFrame(() => {
        pctBar.style.transition = "width 1800ms cubic-bezier(.2,.7,.2,1)";
        pctBar.style.width = target + "%";
      });
      let n = 0;
      const tick = setInterval(() => {
        n += 2;
        if (n >= target) { n = target; clearInterval(tick); }
        pctValue.textContent = n + "%";
      }, 40);
    },

    /* ---------- The Cockpit -------------------------------------
       Sarah's day-1 control surface for an IT Manager. Reading
       altitudes, top → bottom:
         0. Topbar     — title + last-updated stamp + time-range pill.
         1. Banner     — single highest-priority signal of the moment.
         2. Sign-offs  — "Awaiting your approval" lane (THE thing that
                         makes this page actionable, not informational).
         3. KPI strip  — the six numbers an IT manager scans first.
         4. AI Agents  — the digital labour on shift today, filterable
                         by domain and sortable by trust trajectory.
         5. The Team   — human-managed rotation of those agents.

       Authored as data-then-template so each section is a small
       array of objects and a single render fn. Mutating state (time
       range, active domain, sort key) lives in closure variables and
       triggers targeted re-renders rather than blowing the page away.
       ---------------------------------------------------------- */
    "cockpit": (panel) => {
      // Page-local HTML escape. The `md` helper used elsewhere in the
      // app lives inside app.js's IIFE so it's not in scope here; we
      // only need plain text escaping for the cockpit data values.
      const esc = (s) => String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      // ----- Iconography (inline SVGs, kept minimal) ---------------------
      // Only icons that earn their place at this altitude. Removed:
      // sparkline polyline (now rendered procedurally), caret affordance
      // (cards announce "Open …" via aria-label), clock pill icon
      // (the word "Updated" carries the meaning).
      const ICON_AGENT = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17.5A4.5 4.5 0 0 1 4.2 9.3a5.5 5.5 0 0 1 10.7-1.5 4.2 4.2 0 0 1 4 4.2 4 4 0 0 1-4 4.5H7Z"/><path d="M12 10.5v4M10 12.5h4"/></svg>`;
      const ICON_ARROW_DOWN = `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M6 9.3 2.2 5.5 3 4.7l3 3 3-3 .8.8L6 9.3Z"/></svg>`;
      const ICON_ARROW_UP   = `<svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true"><path d="M6 2.7 9.8 6.5 9 7.3l-3-3-3 3-.8-.8L6 2.7Z"/></svg>`;
      const ICON_CHECK = `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5"/></svg>`;

      // ----- Mutable state (closure-scoped) ------------------------------
      let activeDomain      = "all";   // all | reliability | cost | identity | compliance
      let showAllSignoffs   = false;   // collapsed → show top 2; "1 more" expands
      let lastUpdated       = new Date();

      // ----- ITXM domain chips ------------------------------------------
      // Counts dropped on purpose — at a glance the user reads four words,
      // not numbers, and clicking the chip is how they discover the count.
      const domains = [
        { id: "all",         label: "All" },
        { id: "reliability", label: "Reliability" },
        { id: "cost",        label: "Cost" },
        { id: "identity",    label: "Identity" },
        { id: "compliance",  label: "Compliance" }
      ];

      // ----- KPI strip ---------------------------------------------------
      const kpis = [
        { label: "AI Agents",            value: "34",
          metas: [
            { text: "+2 discovered",          tone: "ok"   },
            { text: "2 pending registration", tone: "warn" }
          ]
        },
        { label: "Incidents · 24h",      value: "47",
          metas: [
            { text: "1 Major",                tone: "alert" },
            { text: "44 auto-resolved",       tone: "ok"    }
          ]
        },
        { label: "Auto Resolutions",     value: "94%",
          metas: [
            { text: "+2pp from last week",    tone: "ok" }
          ]
        },
        { label: "Cases closed · 24h",   value: "128",
          metas: [
            { text: "28 in customer voice",   tone: "mute" }
          ]
        },
        { label: "CMDB · CIS Tracked",   value: "3,847",
          sub: "Coverage 97.4%",
          metas: [
            { text: "+12 new (auto-discovered)", tone: "ok" }
          ]
        },
        { label: "KYC processing · 15D", value: "94%",
          sub: "Success rate",
          metas: [
            { text: "+2pp from last week",    tone: "ok" }
          ]
        }
      ];

      // ----- Sign-offs — collapsed to a one-line headline per card -------
      // The detail view (which we don't build here) is where the manager
      // sees the full reason / impact / audit trail. The cockpit's job is
      // to surface the *decision*, not the brief.
      let signoffs = [
        { id: "remed-payments", agent: "RemediationAgent",
          action: "Roll back checkout-api → v2.4.1",
          risk: "high",   deadline: "in 12 min" },
        { id: "change-launch",  agent: "ChangeAgent",
          action: "Hold Saturday onboarding launch",
          risk: "medium", deadline: "by 18:00" },
        { id: "lic-figma",      agent: "LicenseAgent",
          action: "Reclaim 47 idle Figma seats",
          risk: "low",    deadline: "by Fri" }
      ];

      // ----- Agents ------------------------------------------------------
      // `barRisk` >= SLA_THRESHOLD shows the card as "At risk". All other
      // status badges are silenced — the bar + colour is enough.
      const agents = [
        { name: "RemediationAgent", level: "L3", instances: 3, domain: "reliability",
          body: "Watching checkout-api; deferred 1 rollback to a human.",
          trust: 90, trend: "down", load: 0.46, barRisk: 22, tone: "cool", status: "new" },
        { name: "FinOpsAgent",      level: "L3", instances: 1, domain: "cost",
          body: "AWS spend trending +14% MoM on data-warehouse · 3 right-size proposals queued.",
          trust: 91, trend: "down", load: 0.46, barRisk: 24, tone: "cool" },
        { name: "SLAAgent",         level: "L4", instances: 1, domain: "reliability",
          body: "Two enterprise SLAs at 80% breach risk on payments-gateway.",
          trust: 98, trend: "up",   load: 0.58, barRisk: 82, tone: "hot" },
        { name: "RiskAgent",        level: "L4", instances: 1, domain: "compliance",
          body: "Watching checkout-api; deferred 1 rollback to a human.",
          trust: 90, trend: "down", load: 0.51, barRisk: 38, tone: "warm" },
        { name: "LicenseAgent",     level: "L4", instances: 1, domain: "cost",
          body: "Reclaimed 47 idle Figma seats; flagged Adobe CC over-allocation by 12%.",
          trust: 93, trend: "down", load: 0.32, barRisk: 24, tone: "cool" },
        { name: "ChangeAgent",      level: "L4", instances: 1, domain: "reliability",
          body: "Holding 2 changes against Saturday's onboarding launch freeze.",
          trust: 91, trend: "down", load: 0.41, barRisk: 24, tone: "cool" },
        { name: "IdentityAgent",    level: "L3", instances: 1, domain: "identity",
          body: "12 stale service principals; auto-rotation queued for Friday window.",
          trust: 95, trend: "up",   load: 0.28, barRisk: 18, tone: "cool" },
        { name: "ComplianceAgent",  level: "L4", instances: 1, domain: "compliance",
          body: "SOX evidence pack 87% complete · 4 controls waiting on attestation.",
          trust: 92, trend: "flat", load: 0.37, barRisk: 30, tone: "warm" }
      ];

      // ----- The Team ----------------------------------------------------
      const team = [
        { name: "RemediationAgent", level: "L3", instances: 1, domain: "reliability",
          body: "Watching checkout-api; deferred 1 rollback to a human.",
          trust: 90, trend: "down", load: 0.46, barRisk: 22, tone: "cool" },
        { name: "FinOpsAgent",      level: "L3", instances: 1, domain: "cost",
          body: "AWS spend trending +14% MoM on data-warehouse · 3 right-size proposals queued.",
          trust: 91, trend: "down", load: 0.46, barRisk: 24, tone: "cool" },
        { name: "SLAAgent",         level: "L4", instances: 1, domain: "reliability",
          body: "Two enterprise SLAs at 80% breach risk on payments-gateway.",
          trust: 98, trend: "down", load: 0.58, barRisk: 82, tone: "hot" },
        { name: "RiskAgent",        level: "L4", instances: 1, domain: "compliance",
          body: "Watching checkout-api; deferred 1 rollback to a human.",
          trust: 90, trend: "down", load: 0.51, barRisk: 38, tone: "warm" }
      ];

      // ----- Risk thresholds ---------------------------------------------
      const SLA_THRESHOLD = 70;
      const TRUST_FLOOR   = 92;

      // ----- Helpers -----------------------------------------------------
      const trendLabel = (trend) =>
        trend === "up" ? "improving" : trend === "down" ? "declining" : "stable";

      const relTime = (date) => {
        const s = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
        if (s < 60)  return `${s}s ago`;
        const m = Math.round(s / 60);
        if (m < 60)  return `${m}m ago`;
        const h = Math.round(m / 60);
        return `${h}h ago`;
      };

      // ----- Render: status badge (alerting only) ------------------------
      // Routine "watch" / "stable" states render nothing. The card is calm
      // unless it actually wants attention.
      const renderStatus = (a) => {
        if (a.status === "new") {
          return `<span class="agent__badge agent__badge--new" title="Added in the last 24h">New</span>`;
        }
        if (a.trust < TRUST_FLOOR) {
          return `<span class="agent__badge agent__badge--alert" title="Trust below ${TRUST_FLOOR}% SLA floor">Below SLA</span>`;
        }
        if (a.barRisk >= SLA_THRESHOLD) {
          return `<span class="agent__badge agent__badge--warn" title="Above ${SLA_THRESHOLD}% breach-risk threshold">At risk</span>`;
        }
        return "";
      };

      // ----- Render: sign-off card (one-line headline) -------------------
      // No avatar, no reason, no impact. The risk colour-band + risk pill
      // + deadline + action + two buttons is everything a manager needs
      // to decide. Full context lives behind "View details" on hover.
      const renderSignoff = (s) => `
        <article class="signoff" data-risk="${s.risk}" data-signoff-id="${esc(s.id)}">
          <div class="signoff__row">
            <span class="signoff__risk signoff__risk--${s.risk}">${esc(s.risk)}</span>
            <span class="signoff__agent">${esc(s.agent)}</span>
            <span class="signoff__deadline">${esc(s.deadline)}</span>
          </div>
          <p class="signoff__action">${esc(s.action)}</p>
          <div class="signoff__actions">
            <button class="signoff__btn signoff__btn--approve" type="button"
                    data-signoff-action="approve" data-signoff-id="${esc(s.id)}">
              <span aria-hidden="true">${ICON_CHECK}</span> Approve
            </button>
            <button class="signoff__btn signoff__btn--defer" type="button"
                    data-signoff-action="defer" data-signoff-id="${esc(s.id)}">Defer</button>
          </div>
        </article>
      `;

      // ----- Render: KPI card --------------------------------------------
      const renderKpi = (k) => `
        <article class="kpi">
          <div class="kpi__label">${esc(k.label)}</div>
          <div class="kpi__value">${esc(k.value)}</div>
          ${k.sub ? `<div class="kpi__sub">${esc(k.sub)}</div>` : ""}
          <div class="kpi__metas">
            ${k.metas.map(m => `<span class="kpi__meta kpi__meta--${m.tone}">${esc(m.text)}</span>`).join("")}
          </div>
        </article>
      `;

      // ----- Render: domain chip (no count) ------------------------------
      const renderDomainChip = (d) => `
        <button class="cockpit__chip ${d.id === activeDomain ? "is-active" : ""}"
                type="button" role="tab"
                aria-selected="${d.id === activeDomain ? "true" : "false"}"
                data-cockpit-domain="${d.id}">${esc(d.label)}</button>
      `;

      // ----- Render: agent card (Lite) -----------------------------------
      // Strips down to the four things that matter on a glance:
      //   1. Who (icon + name + level + optional ×N instances)
      //   2. What it's doing right now (2-line body)
      //   3. Trust % + arrow direction (one symbol, one number)
      //   4. Load value (one number)
      //   5. A coloured pressure bar with an SLA threshold marker.
      // Dropped: sparkline, median baseline tick, "ABOVE SLA THRESHOLD"
      // text, hover caret, status dot. Single status badge appears only
      // when the card is actually alerting.
      const renderAgent = (a) => {
        const arrow    = a.trend === "up" ? ICON_ARROW_UP : a.trend === "down" ? ICON_ARROW_DOWN : "";
        const trendCls = a.trend === "up" ? "agent__arrow--up" : a.trend === "down" ? "agent__arrow--down" : "agent__arrow--flat";
        const trustAria = `Trust ${a.trust} percent, ${trendLabel(a.trend)}`;
        const isBreach = a.barRisk >= SLA_THRESHOLD;
        return `
          <article class="agent" data-tone="${a.tone}" data-domain="${a.domain}"
                   ${isBreach ? 'data-breach="1"' : ""}>
            <header class="agent__head">
              <div class="agent__icon" aria-hidden="true">${ICON_AGENT}</div>
              <div class="agent__title">
                <span class="agent__name">${esc(a.name)}</span>
                <span class="agent__level">${esc(a.level)}</span>
                ${a.instances > 1 ? `<span class="agent__instances" title="${a.instances} instances managed as one">×${a.instances}</span>` : ""}
              </div>
              <div class="agent__status">${renderStatus(a)}</div>
            </header>
            <p class="agent__body">${esc(a.body)}</p>
            <footer class="agent__foot">
              <span class="agent__metric" aria-label="${esc(trustAria)}">
                Trust <strong>${a.trust}%</strong>
                ${arrow ? `<span class="agent__arrow ${trendCls}">${arrow}</span>` : ""}
              </span>
              <span class="agent__metric agent__metric--load">
                Load <strong>${a.load.toFixed(2)}</strong>
              </span>
            </footer>
            <div class="agent__bar" role="presentation" style="--threshold:${SLA_THRESHOLD}%">
              <span style="width:${a.barRisk}%"></span>
            </div>
          </article>
        `;
      };

      // ----- Filtering ---------------------------------------------------
      const filtered = (list) =>
        activeDomain === "all" ? list : list.filter(a => a.domain === activeDomain);

      // ----- Sign-off list (collapsed = top 2 by risk) -------------------
      // Risk rank surfaces the most urgent two first regardless of their
      // order in the array.
      const riskRank = (r) => r === "high" ? 0 : r === "medium" ? 1 : 2;
      const visibleSignoffs = () => {
        const sorted = [...signoffs].sort((a, b) => riskRank(a.risk) - riskRank(b.risk));
        return showAllSignoffs ? sorted : sorted.slice(0, 2);
      };

      // ----- Top-level HTML ----------------------------------------------
      const renderShell = () => {
        const all = signoffs.length;
        const visible = visibleSignoffs();
        const hidden = all - visible.length;
        return `
        <div class="cockpit" role="region" aria-label="Cockpit · your control surface">
          <div class="cockpit__shell">

            <header class="cockpit__topbar">
              <h1 class="cockpit__title">Cockpit</h1>
              <span class="cockpit__updated" aria-live="polite">
                Live · Updated <span data-cockpit-updated-rel>${esc(relTime(lastUpdated))}</span>
              </span>
            </header>

            <section class="cockpit__signoffs" aria-label="Awaiting your approval">
              <header class="cockpit__signoffs-head">
                <h2 class="cockpit__section-title">Awaiting your approval</h2>
                <span class="cockpit__section-stat" data-cockpit-signoff-count>${all} queued</span>
              </header>
              <div class="cockpit__signoffs-grid" data-cockpit-signoffs>
                ${visible.map(renderSignoff).join("")}
              </div>
              ${all === 0
                ? `<div class="cockpit__signoffs-empty"><span aria-hidden="true">${ICON_CHECK}</span> You're caught up.</div>`
                : hidden > 0
                  ? `<button class="cockpit__more" type="button" data-cockpit-action="show-all-signoffs">See queue (${hidden} more)</button>`
                  : showAllSignoffs && all > 2
                    ? `<button class="cockpit__more" type="button" data-cockpit-action="collapse-signoffs">Collapse</button>`
                    : ""
              }
            </section>

            <section class="cockpit__kpis" aria-label="Key indicators">
              ${kpis.map(renderKpi).join("")}
            </section>

            <section class="cockpit__section" aria-label="AI Agents">
              <header class="cockpit__section-head">
                <div class="cockpit__section-titlegroup">
                  <h2 class="cockpit__section-title">AI Agents</h2>
                  <span class="cockpit__section-stat">25 agents · 23 active · 1 outlier</span>
                </div>
                <button class="cockpit__see" type="button"
                        data-cockpit-action="see-all-agents">See all</button>
              </header>
              <div class="cockpit__chips" role="tablist" aria-label="Filter by domain">
                ${domains.map(renderDomainChip).join("")}
              </div>
              <div class="cockpit__grid" data-cockpit-grid="agents">
                ${filtered(agents).map(renderAgent).join("")}
              </div>
            </section>

            <section class="cockpit__section" aria-label="The Team">
              <header class="cockpit__section-head">
                <div class="cockpit__section-titlegroup">
                  <h2 class="cockpit__section-title">The Team</h2>
                  <span class="cockpit__section-sub">managing your digital labour</span>
                </div>
                <button class="cockpit__see" type="button"
                        data-cockpit-action="see-all-team">See all</button>
              </header>
              <div class="cockpit__grid" data-cockpit-grid="team">
                ${team.map(renderAgent).join("")}
              </div>
            </section>

          </div>
        </div>
      `;
      };

      // Mount the page.
      panel.innerHTML = renderShell();

      // ----- Targeted re-renderers ---------------------------------------
      const $ = (sel, root = panel) => root.querySelector(sel);

      const rerenderAgents = () => {
        const grid = $('[data-cockpit-grid="agents"]');
        if (grid) grid.innerHTML = filtered(agents).map(renderAgent).join("");
        wireAgentCards();
      };

      const rerenderChips = () => {
        panel.querySelectorAll("[data-cockpit-domain]").forEach((b) => {
          const active = b.getAttribute("data-cockpit-domain") === activeDomain;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
      };

      // Re-render the entire sign-off section (grid + count + more link),
      // because the visible set / "n more" affordance depends on multiple
      // pieces of state at once.
      const rerenderSignoffs = () => {
        const section = panel.querySelector(".cockpit__signoffs");
        if (!section) return;
        const all = signoffs.length;
        const visible = visibleSignoffs();
        const hidden = all - visible.length;
        const grid = section.querySelector("[data-cockpit-signoffs]");
        if (grid) {
          grid.innerHTML = all === 0
            ? ""
            : visible.map(renderSignoff).join("");
        }
        const count = section.querySelector("[data-cockpit-signoff-count]");
        if (count) count.textContent = `${all} queued`;
        // Replace whatever "more / collapse / empty" affordance was there.
        section.querySelectorAll(".cockpit__more, .cockpit__signoffs-empty").forEach(n => n.remove());
        if (all === 0) {
          const empty = document.createElement("div");
          empty.className = "cockpit__signoffs-empty";
          empty.innerHTML = `<span aria-hidden="true">${ICON_CHECK}</span> You're caught up.`;
          section.appendChild(empty);
        } else if (hidden > 0) {
          const more = document.createElement("button");
          more.className = "cockpit__more";
          more.type = "button";
          more.setAttribute("data-cockpit-action", "show-all-signoffs");
          more.textContent = `See queue (${hidden} more)`;
          section.appendChild(more);
        } else if (showAllSignoffs && all > 2) {
          const collapse = document.createElement("button");
          collapse.className = "cockpit__more";
          collapse.type = "button";
          collapse.setAttribute("data-cockpit-action", "collapse-signoffs");
          collapse.textContent = "Collapse";
          section.appendChild(collapse);
        }
        wireSignoffActions();
        wireMoreActions();
      };

      // ----- Wiring -------------------------------------------------------
      const note = (msg) => {
        if (typeof window.directorNote === "function") window.directorNote(msg);
      };

      // Domain chips
      panel.querySelectorAll("[data-cockpit-domain]").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeDomain = btn.getAttribute("data-cockpit-domain");
          rerenderChips();
          rerenderAgents();
        });
      });

      // Sign-off Approve / Defer
      function wireSignoffActions() {
        panel.querySelectorAll("[data-signoff-action]").forEach((btn) => {
          if (btn.dataset.wired === "1") return;
          btn.dataset.wired = "1";
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            const action = btn.getAttribute("data-signoff-action");
            const id     = btn.getAttribute("data-signoff-id");
            const item   = signoffs.find(s => s.id === id);
            if (!item) return;
            signoffs = signoffs.filter(s => s.id !== id);
            rerenderSignoffs();
            const verb = action === "approve" ? "Approved" : "Deferred";
            note(`${verb}: ${item.action}.`);
          });
        });
      }
      wireSignoffActions();

      // "See queue (N more)" / "Collapse"
      function wireMoreActions() {
        panel.querySelectorAll(".cockpit__more").forEach((btn) => {
          if (btn.dataset.wired === "1") return;
          btn.dataset.wired = "1";
          btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-cockpit-action");
            if (action === "show-all-signoffs") showAllSignoffs = true;
            else if (action === "collapse-signoffs") showAllSignoffs = false;
            rerenderSignoffs();
          });
        });
      }
      wireMoreActions();

      // Section "See all" links
      panel.querySelectorAll("[data-cockpit-action]").forEach((el) => {
        // Skip ones already wired (signoff actions, more buttons)
        if (el.dataset.wired === "1") return;
        const action = el.getAttribute("data-cockpit-action");
        if (!["see-all-agents", "see-all-team"].includes(action)) return;
        el.dataset.wired = "1";
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          const msg = {
            "see-all-agents":   "Showing all 25 agents across the 4 ITXM domains.",
            "see-all-team":     "Opening the full rotation — 4 on shift, 3 active."
          }[action];
          if (msg) note(msg);
        });
      });

      // Agent card click + keyboard
      function wireAgentCards() {
        panel.querySelectorAll(".agent").forEach((card) => {
          if (card.dataset.wired === "1") return;
          card.dataset.wired = "1";
          card.setAttribute("tabindex", "0");
          card.setAttribute("role", "button");
          const name = card.querySelector(".agent__name")?.textContent || "Agent";
          card.setAttribute("aria-label", `Open ${name} detail`);
          const open = () => note(`Opening ${name} — detail view coming online.`);
          card.addEventListener("click", open);
          card.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); open(); }
          });
        });
      }
      wireAgentCards();

      // "Updated X ago" auto-tick. Self-cleans when the panel is unmounted.
      const tickUpdated = () => {
        const rel = panel.querySelector("[data-cockpit-updated-rel]");
        if (rel) rel.textContent = relTime(lastUpdated);
      };
      const updatedTimer = setInterval(() => {
        if (!panel.querySelector("[data-cockpit-updated-rel]")) {
          clearInterval(updatedTimer);
          return;
        }
        tickUpdated();
      }, 15000);
    }
  };
  Object.assign(window.PAGES = window.PAGES || {}, pages);
  // Tower is the active nav item that opens the Cockpit. Aliasing it
  // here means the workspace placeholder in app.js stays untouched
  // while the IT admin lands on the control surface the moment they
  // tap Tower in the sidenav.
  window.PAGES.tower = window.PAGES.cockpit;

  /* ===============================================================
     Alex (IT Architect) chapter — Act 1 → 5 page factories.
     ---------------------------------------------------------------
     Each factory mounts into the right-side panel and listens for
     `panelEvent` dispatches from the chat side to unlock its phases
     in step with the dialogue. They follow the shared pattern from
     the bootstrap reveal: render a static skeleton, then progressive
     enhancement on each phase event.
     =============================================================== */

  // Tiny shared escape used inside this block. Mirrors the engine's
  // markdown escape but kept local so this page block stays portable.
  const escAlex = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Stagger helper: returns a Promise that resolves after `ms`. Used
  // inside event handlers to spread visual reveals over time without
  // tying up the chat-side runner.
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Bind a panel-event handler that auto-detaches when the page is
  // replaced. Without this, every chapter replay would stack a fresh
  // listener on the sidepanel (memory leak + double-fires on reruns).
  function bindPanelEvent(panel, eventName, handler) {
    const sidepanel = panel.closest(".sidepanel") || panel.parentNode;
    sidepanel.addEventListener(eventName, handler);
    const observer = new MutationObserver(() => {
      if (!panel.isConnected || panel.childElementCount === 0) {
        sidepanel.removeEventListener(eventName, handler);
        observer.disconnect();
      }
    });
    observer.observe(panel.parentNode || panel, { childList: true });
  }

  /* ---------- Act 1 · Foundation activated ---------- */
  // Hero header + 4 status cards (ITSM modules / CMDB framework /
  // Portal & Service Catalog / Agentforce). Cards are dim until their
  // phase event fires, then they animate "live". The CMDB card stays
  // visually empty (rows but no data) — that's the whole point: the
  // framework is in place, discovery hasn't run yet.
  const ACT1_MODULES = [
    "Incident management", "Problem management",
    "Change management",   "Release management",
    "Service-Level Agreements", "Assignment rules"
  ];
  const ACT1_CMDB_GROUPS = [
    { id: "srv", label: "Servers",   ready: "Schema ready · 0 CIs" },
    { id: "end", label: "Endpoints", ready: "Schema ready · 0 CIs" },
    { id: "app", label: "Apps",      ready: "Schema ready · 0 CIs" },
    { id: "net", label: "Network",   ready: "Schema ready · 0 CIs" }
  ];
  const ACT1_PORTAL_TICKETS = [
    { id: "INC-104821", subj: "VPN drops every 30 min in Bengaluru", sla: "P2 · 02:14", chip: "Incident" },
    { id: "REQ-204117", subj: "Provision Figma seat for new joiner", sla: "Std · auto-approve", chip: "Request" },
    { id: "INC-104822", subj: "Outlook search not returning results", sla: "P3 · 03:48", chip: "Incident" },
    { id: "REQ-204118", subj: "Access to Snowflake reporting role",  sla: "Std · awaiting mgr", chip: "Request" },
    { id: "PRB-040912", subj: "Repeat printer driver crashes (NYC)", sla: "P3 · 05:11", chip: "Problem" }
  ];
  const ACT1_KB_ARTICLES = [
    "How to enrol in MFA",
    "Resetting your laptop password",
    "Requesting access to a SaaS tool",
    "Connecting to Acme VPN from a personal device"
  ];

  function act1FoundationPage(panel) {
    panel.innerHTML = `
      <div class="al-page al-foundation" data-phase="boot">
        <header class="al-page__head">
          <div class="al-page__eyebrow">
            <span class="al-page__pulse" aria-hidden="true"></span>
            <span>Foundation · Acme Global IT</span>
          </div>
          <h1 class="al-page__title">Bootstrapping your <strong>ITSM foundation</strong></h1>
          <p class="al-page__sub">No manual installs. Every block below activates the moment its phase completes — no page reloads, no waiting for a release window.</p>
        </header>

        <section class="al-card al-card--modules" data-act1-card="modules">
          <header class="al-card__head">
            <span class="al-card__num">1</span>
            <h3>ITSM modules</h3>
            <span class="al-card__count"><span data-act1-modules-count>0</span><span class="al-card__total">/${ACT1_MODULES.length} live</span></span>
            <span class="al-card__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
            </span>
          </header>
          <ul class="al-modules">
            ${ACT1_MODULES.map((m) => `
              <li class="al-mod" data-act1-mod>
                <span class="al-mod__check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
                <span class="al-mod__label">${escAlex(m)}</span>
                <span class="al-mod__hint">configured</span>
              </li>
            `).join("")}
          </ul>
          <div class="al-card__caption">Default routing rules + SLAs applied · reversible for 30 days.</div>
        </section>

        <section class="al-card al-card--cmdb" data-act1-card="cmdb">
          <header class="al-card__head">
            <span class="al-card__num">2</span>
            <h3>CMDB framework</h3>
            <span class="al-pill al-pill--muted" data-act1-cmdb-pill>Empty · ready for discovery</span>
            <span class="al-card__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
            </span>
          </header>
          <div class="al-cmdb-grid">
            ${ACT1_CMDB_GROUPS.map((g) => `
              <div class="al-cmdb-tile" data-cmdb-id="${g.id}">
                <div class="al-cmdb-tile__bar" aria-hidden="true"></div>
                <div class="al-cmdb-tile__label">${escAlex(g.label)}</div>
                <div class="al-cmdb-tile__hint">${escAlex(g.ready)}</div>
              </div>
            `).join("")}
          </div>
          <div class="al-card__caption">Schemas + relationships defined — populate via the Discovery agent next.</div>
        </section>

        <section class="al-card al-card--portal" data-act1-card="portal">
          <header class="al-card__head">
            <span class="al-card__num">3</span>
            <h3>Service Portal + Catalog</h3>
            <span class="al-pill" data-act1-portal-pill>seeded</span>
            <span class="al-card__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
            </span>
          </header>
          <div class="al-portal">
            <div class="al-portal__col al-portal__col--queue">
              <div class="al-portal__heading">Live ticket queue</div>
              <ul class="al-portal__list">
                ${ACT1_PORTAL_TICKETS.map((t) => `
                  <li class="al-ticket">
                    <span class="al-ticket__chip al-ticket__chip--${t.chip.toLowerCase()}">${escAlex(t.chip)}</span>
                    <div class="al-ticket__body">
                      <div class="al-ticket__subj">${escAlex(t.subj)}</div>
                      <div class="al-ticket__meta">${escAlex(t.id)} · ${escAlex(t.sla)}</div>
                    </div>
                  </li>
                `).join("")}
              </ul>
            </div>
            <div class="al-portal__col al-portal__col--side">
              <div class="al-portal__heading">Knowledge articles</div>
              <ul class="al-portal__kb">
                ${ACT1_KB_ARTICLES.map((k) => `<li>${escAlex(k)}</li>`).join("")}
              </ul>
              <div class="al-portal__heading al-portal__heading--spaced">Catalog items</div>
              <div class="al-portal__chips">
                <span class="al-chip">New laptop</span>
                <span class="al-chip">VPN access</span>
                <span class="al-chip">Software install</span>
                <span class="al-chip">Office equipment</span>
              </div>
            </div>
          </div>
          <div class="al-card__caption">Sample data populated · employees can self-serve from minute one.</div>
        </section>

        <section class="al-card al-card--af" data-act1-card="agentforce">
          <header class="al-card__head">
            <span class="al-card__num">4</span>
            <h3>Agentforce</h3>
            <span class="al-pill al-pill--brand" data-act1-af-pill>configured</span>
            <span class="al-card__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
            </span>
          </header>
          <div class="al-af-grid">
            <div class="al-af-tile">
              <div class="al-af-tile__label">Brand</div>
              <div class="al-af-tile__value">Acme Global</div>
              <div class="al-af-tile__sub">Logo + colours applied to every channel</div>
            </div>
            <div class="al-af-tile">
              <div class="al-af-tile__label">Business hours</div>
              <div class="al-af-tile__value">Follow-the-sun · 24/5</div>
              <div class="al-af-tile__sub">EMEA · APAC · NAMER on rotation</div>
            </div>
            <div class="al-af-tile">
              <div class="al-af-tile__label">Channels</div>
              <div class="al-af-tile__value">Slack · Teams · Email</div>
              <div class="al-af-tile__sub">Portal embed pending Go-Live</div>
            </div>
          </div>
        </section>
      </div>
    `;

    const root        = panel.querySelector(".al-foundation");
    const setPhaseDone = (key) => {
      const card = root.querySelector(`[data-act1-card="${key}"]`);
      if (card) card.classList.add("is-done");
    };

    bindPanelEvent(panel, "act1:phase:modules", async () => {
      const card = root.querySelector('[data-act1-card="modules"]');
      if (!card) return;
      card.classList.add("is-active");
      const mods = card.querySelectorAll("[data-act1-mod]");
      const counter = card.querySelector("[data-act1-modules-count]");
      for (let i = 0; i < mods.length; i++) {
        await wait(180);
        mods[i].classList.add("is-on");
        if (counter) counter.textContent = String(i + 1);
      }
      setPhaseDone("modules");
    });

    bindPanelEvent(panel, "act1:phase:cmdb", async () => {
      const card = root.querySelector('[data-act1-card="cmdb"]');
      if (!card) return;
      card.classList.add("is-active");
      const tiles = card.querySelectorAll(".al-cmdb-tile");
      for (let i = 0; i < tiles.length; i++) {
        await wait(220);
        tiles[i].classList.add("is-on");
      }
      setPhaseDone("cmdb");
    });

    bindPanelEvent(panel, "act1:phase:portal", () => {
      const card = root.querySelector('[data-act1-card="portal"]');
      if (!card) return;
      card.classList.add("is-active");
      const items = card.querySelectorAll(".al-ticket");
      items.forEach((el, i) => setTimeout(() => el.classList.add("is-on"), 120 + i * 110));
      setTimeout(() => setPhaseDone("portal"), 120 + items.length * 110);
    });

    bindPanelEvent(panel, "act1:phase:agentforce", () => {
      const card = root.querySelector('[data-act1-card="agentforce"]');
      if (!card) return;
      card.classList.add("is-active");
      setTimeout(() => setPhaseDone("agentforce"), 600);
    });
  }

  /* ---------- Act 2 · AWS credential pane ---------- */
  function act2AwsCredentialsPage(panel, ctx) {
    panel.innerHTML = `
      <div class="al-page al-creds">
        <header class="al-creds__brand">
          <div class="al-creds__logo">
            <svg viewBox="0 0 64 38" width="56" height="34" aria-hidden="true">
              <text x="0" y="22" font-family="Inter, system-ui" font-weight="800" font-size="22" fill="#ff9900">aws</text>
              <path d="M2 30 Q22 38 60 30" fill="none" stroke="#ff9900" stroke-width="2.4" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="al-creds__brand-name">Amazon Web Services</div>
            <div class="al-creds__brand-sub">Cloud Discovery · IAM credentials required</div>
          </div>
        </header>

        <div class="al-creds__card">
          <h3 class="al-creds__title">Connect your AWS account</h3>
          <p class="al-creds__note">Jarvis Discovery uses these read-only IAM credentials to enumerate <strong>EC2</strong>, <strong>S3</strong>, <strong>IAM</strong>, <strong>RDS</strong>, and <strong>Lambda</strong> resources. Nothing is written back to your account.</p>

          <div class="al-field">
            <label for="awsAccessKey">Access Key ID</label>
            <input id="awsAccessKey" type="text" autocomplete="off" value="AKIAIOSFODNN7EXAMPLE" />
          </div>
          <div class="al-field">
            <label for="awsSecret">Secret Access Key</label>
            <input id="awsSecret" type="password" autocomplete="off" value="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" />
          </div>
          <div class="al-field-row">
            <div class="al-field">
              <label for="awsRegion">Default region</label>
              <select id="awsRegion">
                <option>us-east-1 · N. Virginia</option>
                <option>us-west-2 · Oregon</option>
                <option>eu-west-1 · Ireland</option>
                <option selected>ap-south-1 · Mumbai</option>
              </select>
            </div>
            <div class="al-field">
              <label for="awsRole">Assumed role (optional)</label>
              <input id="awsRole" type="text" placeholder="arn:aws:iam::… (leave blank for direct)" />
            </div>
          </div>

          <div class="al-creds__perms">
            <div class="al-creds__perms-head">Required permissions</div>
            <ul>
              <li><span>ec2:Describe*</span><span>read</span></li>
              <li><span>s3:List*, s3:GetBucketLocation</span><span>read</span></li>
              <li><span>iam:List*, iam:Get*</span><span>read</span></li>
            </ul>
          </div>

          <button class="al-creds__connect" id="awsConnectBtn" type="button">
            <span class="al-creds__connect-glyph" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                   stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </span>
            <span>Connect AWS</span>
          </button>
          <div class="al-creds__foot">By connecting, you authorise Jarvis to perform read-only discovery on this account.</div>
        </div>
      </div>
    `;

    const btn = panel.querySelector("#awsConnectBtn");
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.innerHTML = `<span class="btn-spinner"></span><span>Authenticating…</span>`;
      setTimeout(() => {
        btn.classList.remove("is-loading");
        btn.classList.add("is-done");
        btn.innerHTML = `
          <span class="al-creds__connect-glyph" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          </span>
          <span>Connected</span>`;
        ctx.dispatch("aws-connect");
      }, 1400);
    });
  }

  /* ---------- Act 2 + 3 · Service Graph ---------- */
  // Live SVG graph that pulses dots as resources are discovered, then
  // links them to existing Salesforce records. The cert-expiry alert
  // ribbon arrives via a separate event in Act 3.
  const SVC_NODES = [
    { id: "ec2-app01",  type: "ec2", x:  90, y:  60, label: "ec2-app-01" },
    { id: "ec2-app02",  type: "ec2", x: 200, y:  40, label: "ec2-app-02" },
    { id: "ec2-app03",  type: "ec2", x: 320, y:  60, label: "ec2-web-03" },
    { id: "ec2-db01",   type: "ec2", x: 110, y: 160, label: "ec2-db-01"  },
    { id: "ec2-db02",   type: "ec2", x: 300, y: 170, label: "ec2-db-02"  },
    { id: "s3-cust",    type: "s3",  x: 410, y: 110, label: "s3-customer-data" },
    { id: "s3-logs",    type: "s3",  x: 380, y: 220, label: "s3-app-logs" },
    { id: "s3-back",    type: "s3",  x:  60, y: 240, label: "s3-backups" },
    { id: "lam-auth",   type: "lam", x: 220, y: 220, label: "λ-auth-service" },
    { id: "iam-role",   type: "iam", x: 230, y: 110, label: "iam-cross-acct" },
    { id: "sf-cust360", type: "sf",  x: 470, y:  60, label: "Salesforce · Cust360" },
    { id: "sf-billing", type: "sf",  x: 470, y: 180, label: "Salesforce · Billing" }
  ];
  const SVC_EDGES = [
    ["ec2-app01", "ec2-db01"], ["ec2-app02", "ec2-db01"],
    ["ec2-app02", "iam-role"], ["ec2-app03", "ec2-db02"],
    ["ec2-app01", "lam-auth"], ["lam-auth", "s3-logs"],
    ["ec2-db01", "s3-back"],   ["s3-cust",   "sf-cust360"],
    ["ec2-app03", "sf-cust360"], ["ec2-db02", "sf-billing"],
    ["lam-auth", "sf-cust360"], ["iam-role",  "sf-billing"]
  ];

  function act2ServiceGraphPage(panel) {
    const NODE_COUNT = SVC_NODES.length;
    const REL_COUNT  = SVC_EDGES.length;
    panel.innerHTML = `
      <div class="al-page al-graph" data-phase="scanning">
        <header class="al-page__head">
          <div class="al-page__eyebrow">
            <span class="al-page__pulse" aria-hidden="true"></span>
            <span>Cloud Discovery · AWS · ap-south-1</span>
          </div>
          <h1 class="al-page__title">Materializing your <strong>Service Graph</strong></h1>
          <p class="al-page__sub">Each node is a real configuration item — pulses while being discovered, locks once it's stitched into the graph.</p>
        </header>

        <div class="al-graph__alert" data-graph-alert hidden>
          <span class="al-graph__alert-icon" aria-hidden="true">⚠</span>
          <div>
            <div class="al-graph__alert-title">3 SSL certificates expiring in &lt; 48 hours</div>
            <div class="al-graph__alert-sub" data-graph-alert-sub>portal.acme.com · api.internal · vault.internal</div>
          </div>
          <span class="al-graph__alert-status" data-graph-alert-status>Awaiting routing</span>
        </div>

        <div class="al-graph__stats">
          <div class="al-stat">
            <div class="al-stat__value" data-graph-cis>0</div>
            <div class="al-stat__label">Configuration items</div>
          </div>
          <div class="al-stat">
            <div class="al-stat__value" data-graph-rels>0</div>
            <div class="al-stat__label">Relationships</div>
          </div>
          <div class="al-stat">
            <div class="al-stat__value"><span data-graph-linked>0</span><span class="al-stat__suffix">/4</span></div>
            <div class="al-stat__label">Salesforce records linked</div>
          </div>
        </div>

        <div class="al-graph__canvas-wrap">
          <svg class="al-graph__svg" viewBox="0 0 540 300" preserveAspectRatio="xMidYMid meet" aria-label="AWS service graph">
            <g class="al-graph__edges" data-graph-edges>
              ${SVC_EDGES.map((e, i) => {
                const a = SVC_NODES.find((n) => n.id === e[0]);
                const b = SVC_NODES.find((n) => n.id === e[1]);
                if (!a || !b) return "";
                const isSf = a.type === "sf" || b.type === "sf";
                return `<line data-edge="${i}" data-edge-sf="${isSf ? 1 : 0}"
                              x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`;
              }).join("")}
            </g>
            <g class="al-graph__nodes" data-graph-nodes>
              ${SVC_NODES.map((n) => `
                <g class="al-graph__node al-graph__node--${n.type}" data-node-id="${n.id}" transform="translate(${n.x}, ${n.y})">
                  <circle class="al-graph__node-pulse" r="14" />
                  <circle class="al-graph__node-dot"   r="6" />
                  <text class="al-graph__node-label" x="0" y="22" text-anchor="middle">${escAlex(n.label)}</text>
                </g>
              `).join("")}
            </g>
          </svg>
          <div class="al-graph__legend">
            <span class="al-graph__legend-item"><span class="al-graph__legend-dot al-graph__legend-dot--ec2"></span>EC2</span>
            <span class="al-graph__legend-item"><span class="al-graph__legend-dot al-graph__legend-dot--s3"></span>S3</span>
            <span class="al-graph__legend-item"><span class="al-graph__legend-dot al-graph__legend-dot--lam"></span>Lambda</span>
            <span class="al-graph__legend-item"><span class="al-graph__legend-dot al-graph__legend-dot--iam"></span>IAM</span>
            <span class="al-graph__legend-item"><span class="al-graph__legend-dot al-graph__legend-dot--sf"></span>Salesforce</span>
          </div>
        </div>
      </div>
    `;

    const root      = panel.querySelector(".al-graph");
    const cisEl     = root.querySelector("[data-graph-cis]");
    const relsEl    = root.querySelector("[data-graph-rels]");
    const linkedEl  = root.querySelector("[data-graph-linked]");
    const nodes     = Array.from(root.querySelectorAll(".al-graph__node"));
    const awsNodes  = nodes.filter((n) => n.dataset.nodeId.startsWith("ec2-") ||
                                          n.dataset.nodeId.startsWith("s3-")  ||
                                          n.dataset.nodeId.startsWith("lam-") ||
                                          n.dataset.nodeId.startsWith("iam-"));
    const sfNodes   = nodes.filter((n) => n.dataset.nodeId.startsWith("sf-"));
    const edges     = Array.from(root.querySelectorAll("[data-edge]"));
    const sfEdges   = edges.filter((e) => e.dataset.edgeSf === "1");
    const awsEdges  = edges.filter((e) => e.dataset.edgeSf !== "1");

    let ciNum = 0;
    let relNum = 0;

    bindPanelEvent(panel, "graph:phase:scan", async () => {
      root.dataset.phase = "scanning";
      for (let i = 0; i < awsNodes.length; i++) {
        await wait(220);
        awsNodes[i].classList.add("is-on");
        ciNum += 1;
        cisEl.textContent = String(ciNum);
      }
      // First wave of intra-AWS relationships also lights up here.
      for (let i = 0; i < awsEdges.length; i++) {
        await wait(140);
        awsEdges[i].classList.add("is-on");
        relNum += 1;
        relsEl.textContent = String(relNum);
      }
    });

    bindPanelEvent(panel, "graph:phase:link", async () => {
      root.dataset.phase = "linking";
      for (let i = 0; i < sfNodes.length; i++) {
        await wait(280);
        sfNodes[i].classList.add("is-on");
        ciNum += 1;
        cisEl.textContent = String(ciNum);
        linkedEl.textContent = String(Math.min(i + 1, 4));
      }
      for (let i = 0; i < sfEdges.length; i++) {
        await wait(180);
        sfEdges[i].classList.add("is-on", "is-sf");
        relNum += 1;
        relsEl.textContent = String(relNum);
      }
    });

    bindPanelEvent(panel, "graph:phase:complete", () => {
      root.dataset.phase = "complete";
      cisEl.textContent = "20";
      relsEl.textContent = "32";
      linkedEl.textContent = "4";
      // Reveal the cert alert as the discovery wraps up.
      const alert = root.querySelector("[data-graph-alert]");
      if (alert) {
        alert.hidden = false;
        requestAnimationFrame(() => alert.classList.add("is-on"));
      }
    });

    bindPanelEvent(panel, "graph:phase:cert-routed", () => {
      const status = root.querySelector("[data-graph-alert-status]");
      if (status) {
        status.textContent = "Routed · CertOps + Physical Security";
        status.classList.add("is-done");
      }
    });
  }

  /* ---------- Act 4 · Agent Workforce (multi-phase) ---------- */
  // Three internal phases:
  //   wf:phase:fleet         — show 50+ agents with 3 recommended highlighted
  //   wf:phase:azure-creds   — switch to Azure AD credentials + JTBD upload
  //   wf:phase:builder       — switch to Austin Access Agent builder spin-up
  //   wf:phase:builder-step  — animate the builder mapping
  const WF_RECOMMENDED = ["Software Assistance", "System & File Access Assistance", "System Password Reset Assistance"];
  const WF_FLEET = [
    "Incident Triage", "Change Approval", "Knowledge Drafting", "Asset Lifecycle",
    "License Reclaim", "Patch Wave Planner", "Vulnerability Scanner", "Backup Verification",
    "Identity Provisioning", "Access Reviewer", "Onboarding Bot", "Offboarding Bot",
    "Endpoint Posture", "VPN Health", "DNS Watcher", "Cert Renewal",
    "Quota Watcher", "Cost Sentinel", "Vendor Comms", "Contract Reminder",
    "Procurement Helper", "Print Queue Fixer", "Wifi Diagnostics", "Office Comms",
    "Travel Profile", "Expense Routing", "Meeting Room Booker", "Mobile Enrolment",
    "Policy Reminder", "Audit Pack", "DR Drill Runner", "Chaos Game-day",
    "Performance Tuner", "DB Connection Pool", "Kafka Lag Watcher", "Cluster Drainer",
    "Helm Releaser", "Argo Sync", "Feature-flag Janitor", "Secret Rotator",
    "PII Sweep", "DLP Quarantine", "Slack Triage", "Teams Triage",
    "Zoom Health", "Tenant Migrator", "Region Failover", "Compliance Briefer"
  ];

  function act4WorkforcePage(panel, ctx) {
    panel.innerHTML = `
      <div class="al-page al-wf" data-wf-phase="fleet">

        <!-- ===== Phase A: agent fleet picker ===== -->
        <section class="al-wf__phase al-wf__phase--fleet" data-wf-section="fleet">
          <header class="al-page__head">
            <div class="al-page__eyebrow">
              <span class="al-page__pulse" aria-hidden="true"></span>
              <span>Agent Fleet · ${WF_FLEET.length + WF_RECOMMENDED.length}+ available</span>
            </div>
            <h1 class="al-page__title">Pick your <strong>workforce</strong></h1>
            <p class="al-page__sub">Recommended agents are pre-selected based on your discovered network. You can edit the selection on the right.</p>
          </header>

          <div class="al-wf__rec">
            <div class="al-wf__rec-head">
              <span class="al-wf__rec-eyebrow">Recommended for Acme Global</span>
              <span class="al-wf__rec-count">3 selected</span>
            </div>
            <div class="al-wf__rec-grid">
              ${WF_RECOMMENDED.map((name, i) => `
                <article class="al-wf-card al-wf-card--rec" data-wf-rec="${i}">
                  <header class="al-wf-card__head">
                    <span class="al-wf-card__glyph" aria-hidden="true">${escAlex(name.charAt(0))}</span>
                    <span class="al-wf-card__name">${escAlex(name)}</span>
                    <span class="al-wf-card__check" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                    </span>
                  </header>
                  <div class="al-wf-card__body">${escAlex(
                    name.startsWith("Software") ? "Help users find, request and install approved software." :
                    name.startsWith("System &") ? "Grant just-in-time access to files, drives and shared systems." :
                    "Recover passwords + MFA enrolment without a ticket."
                  )}</div>
                  <footer class="al-wf-card__foot">
                    <span class="al-wf-card__chip">Trust 0.94</span>
                    <span class="al-wf-card__chip al-wf-card__chip--rec">Recommended</span>
                  </footer>
                </article>
              `).join("")}
            </div>
          </div>

          <div class="al-wf__more">
            <div class="al-wf__more-head">
              <span class="al-wf__more-eyebrow">Other available agents</span>
              <span class="al-wf__more-hint">${WF_FLEET.length} more · scroll to browse</span>
            </div>
            <div class="al-wf__more-grid">
              ${WF_FLEET.map((name) => `
                <div class="al-wf-mini">
                  <span class="al-wf-mini__glyph" aria-hidden="true">${escAlex(name.charAt(0))}</span>
                  <span class="al-wf-mini__name">${escAlex(name)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </section>

        <!-- ===== Phase B: Azure AD creds + JTBD upload ===== -->
        <section class="al-wf__phase al-wf__phase--creds" data-wf-section="creds" hidden>
          <header class="al-page__head">
            <div class="al-page__eyebrow">
              <span class="al-page__pulse" aria-hidden="true"></span>
              <span>Pre-flight · Credentials &amp; JTBD</span>
            </div>
            <h1 class="al-page__title">Two things before we activate</h1>
            <p class="al-page__sub">Password Reset needs your Azure AD bridge; the custom Austin Access agent needs the workflow it should automate.</p>
          </header>

          <div class="al-wf__creds-grid">
            <div class="al-creds__card al-creds__card--inline">
              <h3 class="al-creds__title">
                <span class="al-creds__title-logo" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="#0078D4" d="M3 5l9-2v9H3zM3 12h9v9l-9-2zM13 3l8 2v8h-8zM13 12h8v8l-8 2z"/>
                  </svg>
                </span>
                Azure Active Directory
              </h3>
              <p class="al-creds__note">Required for the <strong>Password Reset Assistance</strong> agent — service principal with <code>User.ReadWrite.All</code> + <code>Directory.AccessAsUser.All</code>.</p>
              <div class="al-field">
                <label for="azureTenant">Tenant ID</label>
                <input id="azureTenant" type="text" value="acme-global.onmicrosoft.com" />
              </div>
              <div class="al-field">
                <label for="azureClient">Client ID</label>
                <input id="azureClient" type="text" value="b14a7505-96e9-4cf5-8db8-9b1d4d5f3a1c" />
              </div>
              <div class="al-field">
                <label for="azureSecret">Client secret</label>
                <input id="azureSecret" type="password" value="••••••••••••••••••••" />
              </div>
            </div>

            <div class="al-jtbd">
              <h3 class="al-jtbd__title">Job to be Done</h3>
              <p class="al-jtbd__note">Upload the workflow your custom <strong>Austin Building Access</strong> agent should automate. Jarvis will parse it and map each step to security groups + IoT endpoints.</p>
              <label class="al-jtbd__drop" for="wfJtbdFile" data-wf-drop>
                <span class="al-jtbd__drop-glyph" aria-hidden="true">⬆</span>
                <span class="al-jtbd__drop-title" data-wf-drop-title>Drop a JTBD PDF or click to choose</span>
                <span class="al-jtbd__drop-sub"  data-wf-drop-sub>Recommended: <strong>Austin_Access_Workflow.pdf</strong></span>
                <input id="wfJtbdFile" type="file" accept="application/pdf" hidden />
              </label>
              <button type="button" class="al-jtbd__sample" data-wf-sample>Use the sample workflow</button>
            </div>
          </div>

          <div class="al-wf__creds-actions">
            <button class="al-creds__connect al-creds__connect--full" id="wfCredsContinue" type="button" disabled>
              <span class="al-creds__connect-glyph" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                     stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4"/>
                </svg>
              </span>
              <span data-wf-creds-label>Upload a JTBD file to continue</span>
            </button>
          </div>
        </section>

        <!-- ===== Phase C: Builder spin-up ===== -->
        <section class="al-wf__phase al-wf__phase--builder" data-wf-section="builder" hidden>
          <header class="al-page__head">
            <div class="al-page__eyebrow">
              <span class="al-page__pulse" aria-hidden="true"></span>
              <span>Agentforce Builder · austin-access-agent</span>
            </div>
            <h1 class="al-page__title">Spinning up <strong>Austin Access Agent</strong></h1>
            <p class="al-page__sub">Mapping your JTBD to local security groups and the Austin IoT gateway.</p>
          </header>

          <div class="al-builder">
            <ol class="al-builder__steps">
              <li class="al-builder__step" data-builder-step="parse">
                <span class="al-builder__step-num">1</span>
                <div class="al-builder__step-body">
                  <div class="al-builder__step-name">Parsing <code>Austin_Access_Workflow.pdf</code></div>
                  <div class="al-builder__step-sub">Extracted 7 job steps · 3 decision branches</div>
                </div>
                <span class="al-builder__step-status" data-builder-status>queued</span>
              </li>
              <li class="al-builder__step" data-builder-step="groups">
                <span class="al-builder__step-num">2</span>
                <div class="al-builder__step-body">
                  <div class="al-builder__step-name">Mapping to security groups</div>
                  <div class="al-builder__step-sub" data-builder-groups>—</div>
                </div>
                <span class="al-builder__step-status" data-builder-status>queued</span>
              </li>
              <li class="al-builder__step" data-builder-step="iot">
                <span class="al-builder__step-num">3</span>
                <div class="al-builder__step-body">
                  <div class="al-builder__step-name">Wiring up Austin IoT gateway</div>
                  <div class="al-builder__step-sub" data-builder-iot>—</div>
                </div>
                <span class="al-builder__step-status" data-builder-status>queued</span>
              </li>
              <li class="al-builder__step" data-builder-step="draft">
                <span class="al-builder__step-num">4</span>
                <div class="al-builder__step-body">
                  <div class="al-builder__step-name">Drafting agent skill graph</div>
                  <div class="al-builder__step-sub" data-builder-draft>—</div>
                </div>
                <span class="al-builder__step-status" data-builder-status>queued</span>
              </li>
            </ol>

            <aside class="al-builder__preview">
              <div class="al-builder__preview-head">
                <span class="al-builder__preview-mark" aria-hidden="true">A</span>
                <div>
                  <div class="al-builder__preview-name">Austin Access Agent</div>
                  <div class="al-builder__preview-sub">Custom · v0.1 draft</div>
                </div>
                <span class="al-pill al-pill--muted" data-builder-pill>drafting…</span>
              </div>
              <ul class="al-builder__preview-list">
                <li><span>Skills</span><strong data-builder-skills>0</strong></li>
                <li><span>Triggers</span><strong data-builder-triggers>0</strong></li>
                <li><span>Endpoints</span><strong data-builder-endpoints>0</strong></li>
                <li><span>Trust score</span><strong data-builder-trust>—</strong></li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
    `;

    const root = panel.querySelector(".al-wf");
    const setPhase = (key) => {
      root.dataset.wfPhase = key;
      root.querySelectorAll("[data-wf-section]").forEach((s) => {
        s.hidden = s.dataset.wfSection !== key;
      });
    };

    bindPanelEvent(panel, "wf:phase:fleet", () => setPhase("fleet"));

    bindPanelEvent(panel, "wf:phase:azure-creds", () => {
      setPhase("creds");
      // Wire JTBD upload + sample-use → enable Continue button.
      const drop      = root.querySelector("[data-wf-drop]");
      const dropTitle = root.querySelector("[data-wf-drop-title]");
      const dropSub   = root.querySelector("[data-wf-drop-sub]");
      const sample    = root.querySelector("[data-wf-sample]");
      const cont      = root.querySelector("#wfCredsContinue");
      const contLbl   = root.querySelector("[data-wf-creds-label]");
      const fileInput = root.querySelector("#wfJtbdFile");

      const markUploaded = (name) => {
        drop.classList.add("is-uploaded");
        dropTitle.textContent = `Uploaded · ${name}`;
        dropSub.innerHTML = `Parsed <strong>7 steps</strong> · <strong>3 branches</strong>`;
        cont.disabled = false;
        contLbl.textContent = "Continue · spin up the builder";
      };

      fileInput.addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) markUploaded(f.name);
      });
      sample.addEventListener("click", () => markUploaded("Austin_Access_Workflow.pdf"));
      cont.addEventListener("click", () => {
        if (cont.disabled) return;
        cont.disabled = true;
        cont.classList.add("is-loading");
        cont.innerHTML = `<span class="btn-spinner"></span><span>Verifying…</span>`;
        setTimeout(() => ctx.dispatch("wf-creds-uploaded"), 1100);
      });
    });

    bindPanelEvent(panel, "wf:phase:builder", async () => {
      setPhase("builder");
      // Animate the four builder steps in sequence with rich micro-copy.
      const steps = Array.from(root.querySelectorAll(".al-builder__step"));
      const skills    = root.querySelector("[data-builder-skills]");
      const triggers  = root.querySelector("[data-builder-triggers]");
      const endpoints = root.querySelector("[data-builder-endpoints]");
      const trust     = root.querySelector("[data-builder-trust]");
      const pill      = root.querySelector("[data-builder-pill]");
      const groupsTxt = root.querySelector("[data-builder-groups]");
      const iotTxt    = root.querySelector("[data-builder-iot]");
      const draftTxt  = root.querySelector("[data-builder-draft]");

      const setStatus = (i, label) => {
        const status = steps[i]?.querySelector("[data-builder-status]");
        if (status) {
          status.textContent = label;
          status.dataset.state = label.toLowerCase().replace(/[^a-z]/g, "");
        }
      };

      const start = (i, label) => {
        steps[i].classList.add("is-active");
        setStatus(i, label || "running…");
      };
      const done = (i) => {
        steps[i].classList.remove("is-active");
        steps[i].classList.add("is-done");
        setStatus(i, "done");
      };

      await wait(250);
      start(0);
      await wait(900); done(0);

      start(1);
      await wait(600);
      groupsTxt.textContent = "AUS-Bldg-Access · AUS-Bldg-After-Hours · AUS-Visitor-Mgmt";
      skills.textContent = "4";
      triggers.textContent = "2";
      await wait(600); done(1);

      start(2);
      await wait(700);
      iotTxt.textContent = "Gateway: aus-iot-01.acme.local · 18 readers paired";
      endpoints.textContent = "18";
      await wait(500); done(2);

      start(3);
      await wait(800);
      draftTxt.innerHTML = "Skill graph compiled · 4 skills · 2 triggers · 18 endpoints";
      trust.textContent = "0.86 (draft)";
      pill.textContent = "drafted · awaiting tests";
      pill.classList.remove("al-pill--muted");
      pill.classList.add("al-pill--brand");
      await wait(400); done(3);
    });
  }

  /* ---------- Act 5 · Go-Live (multi-phase) ---------- */
  // Internal phases:
  //   live:phase:tests       — show eval-runner UI (skeleton)
  //   live:phase:eval-gen    — generate test cases
  //   live:phase:eval-run    — run + auto-fix + re-run
  //   live:phase:mapping     — switch to user mapping view
  //   live:phase:mapping-done
  //   live:phase:dashboard   — final System Health dashboard
  //   live:phase:notification — finale toast in the dashboard
  function act5GoLivePage(panel) {
    panel.innerHTML = `
      <div class="al-page al-live" data-live-phase="tests">

        <!-- ===== Phase A: Eval runner ===== -->
        <section class="al-live__phase" data-live-section="tests">
          <header class="al-page__head">
            <div class="al-page__eyebrow">
              <span class="al-page__pulse" aria-hidden="true"></span>
              <span>Pre-activation · Automated testing</span>
            </div>
            <h1 class="al-page__title">Testing <strong>4 agents</strong> against company standards</h1>
            <p class="al-page__sub">Eval sets are auto-generated, run, and any failures are auto-refined until every guardrail passes.</p>
          </header>

          <div class="al-live__guardrails">
            <span class="al-guard">Security · OWASP top 10</span>
            <span class="al-guard">Safety · prompt-injection &amp; jailbreak</span>
            <span class="al-guard">GDPR · PII handling</span>
            <span class="al-guard">SOC 2 · audit trail</span>
          </div>

          <div class="al-eval">
            ${[
              { name: "Software Assistance",       trust: "0.94" },
              { name: "Access Assistance",         trust: "0.92" },
              { name: "Password Reset Assistance", trust: "0.95" },
              { name: "Austin Access Agent",       trust: "0.86" }
            ].map((a, i) => `
              <article class="al-eval-card" data-eval-card="${i}">
                <header class="al-eval-card__head">
                  <span class="al-eval-card__glyph">${escAlex(a.name.charAt(0))}</span>
                  <div>
                    <div class="al-eval-card__name">${escAlex(a.name)}</div>
                    <div class="al-eval-card__sub">trust ${escAlex(a.trust)} · 320 cases queued</div>
                  </div>
                  <span class="al-eval-card__status" data-eval-status>queued</span>
                </header>
                <div class="al-eval-card__bar">
                  <div class="al-eval-card__bar-fill" data-eval-fill style="width:0%"></div>
                </div>
                <ul class="al-eval-card__metrics">
                  <li><span>Pass</span><strong data-eval-pass>0</strong></li>
                  <li><span>Auto-fix</span><strong data-eval-fix>0</strong></li>
                  <li><span>Coverage</span><strong data-eval-cov>0%</strong></li>
                </ul>
              </article>
            `).join("")}
          </div>
        </section>

        <!-- ===== Phase B: User access mapping ===== -->
        <section class="al-live__phase" data-live-section="mapping" hidden>
          <header class="al-page__head">
            <div class="al-page__eyebrow">
              <span class="al-page__pulse" aria-hidden="true"></span>
              <span>Access provisioning · 5,000 users</span>
            </div>
            <h1 class="al-page__title">Mapping access for your <strong>workforce</strong></h1>
            <p class="al-page__sub">Auto-granting users in good standing; flagging users currently 'on notice' for manual manager approval.</p>
          </header>

          <div class="al-mapping">
            <div class="al-mapping__hero">
              <div class="al-mapping__total" data-map-total>0 / 5,000</div>
              <div class="al-mapping__bar" aria-hidden="true">
                <div class="al-mapping__bar-fill" data-map-fill style="width:0%"></div>
              </div>
            </div>
            <div class="al-mapping__split">
              <div class="al-split al-split--ok">
                <div class="al-split__label">Auto-granted</div>
                <div class="al-split__value" data-map-ok>0</div>
                <div class="al-split__note">Users in good standing · provisioned in real time</div>
              </div>
              <div class="al-split al-split--flag">
                <div class="al-split__label">Flagged · manager approval</div>
                <div class="al-split__value" data-map-flag>0</div>
                <div class="al-split__note">Users on performance notice or pending offboarding</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== Phase C: System Health dashboard ===== -->
        <section class="al-live__phase al-live__phase--dash" data-live-section="dashboard" hidden>
          <header class="al-page__head">
            <div class="al-page__eyebrow al-page__eyebrow--ok">
              <span class="al-page__pulse al-page__pulse--ok" aria-hidden="true"></span>
              <span>Live · System Health · Acme Global</span>
            </div>
            <h1 class="al-page__title">Your IT estate, <strong>at a glance</strong></h1>
          </header>

          <div class="al-dash">
            <div class="al-dash__kpis">
              <div class="al-kpi"><div class="al-kpi__label">Active agents</div><div class="al-kpi__value">4</div><div class="al-kpi__trend">+1 (Austin Access)</div></div>
              <div class="al-kpi"><div class="al-kpi__label">Users provisioned</div><div class="al-kpi__value">5,000</div><div class="al-kpi__trend">4,598 auto · 402 pending</div></div>
              <div class="al-kpi"><div class="al-kpi__label">CIs under management</div><div class="al-kpi__value">20</div><div class="al-kpi__trend">+ Salesforce records linked</div></div>
              <div class="al-kpi"><div class="al-kpi__label">SLA breaches today</div><div class="al-kpi__value">0</div><div class="al-kpi__trend">All on track</div></div>
            </div>

            <div class="al-dash__cols">
              <section class="al-dash__col">
                <h4 class="al-dash__heading">Agent activity (last 60 min)</h4>
                <ul class="al-dash__list">
                  <li><span class="al-dash__pill al-dash__pill--ok">SW</span><span>Software Assistance</span><span class="al-dash__count">14 actions</span></li>
                  <li><span class="al-dash__pill al-dash__pill--ok">AC</span><span>Access Assistance</span><span class="al-dash__count">9 actions</span></li>
                  <li><span class="al-dash__pill al-dash__pill--ok">PR</span><span>Password Reset</span><span class="al-dash__count">6 actions</span></li>
                  <li><span class="al-dash__pill al-dash__pill--brand">AA</span><span>Austin Access</span><span class="al-dash__count">1 action</span></li>
                </ul>
              </section>
              <section class="al-dash__col">
                <h4 class="al-dash__heading">Pending sign-offs</h4>
                <ul class="al-dash__list">
                  <li><span class="al-dash__pill al-dash__pill--warn">!</span><span>402 'on notice' user grants</span><span class="al-dash__count">manager review</span></li>
                  <li><span class="al-dash__pill al-dash__pill--ok">✓</span><span>3 SSL certs · CertOps queue</span><span class="al-dash__count">SLA 4h</span></li>
                </ul>
              </section>
            </div>

            <div class="al-dash__finale" data-live-finale hidden>
              <div class="al-dash__finale-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <div>
                <div class="al-dash__finale-title">Austin Access Agent provisioned a badge for a new hire.</div>
                <div class="al-dash__finale-sub">Password Reset Assistance is standing by · Software Assistance handled a Figma request 28s ago.</div>
              </div>
              <span class="al-pill al-pill--brand">just now</span>
            </div>
          </div>
        </section>
      </div>
    `;

    const root = panel.querySelector(".al-live");
    const setPhase = (key) => {
      root.dataset.livePhase = key;
      root.querySelectorAll("[data-live-section]").forEach((s) => {
        s.hidden = s.dataset.liveSection !== key;
      });
    };

    bindPanelEvent(panel, "live:phase:tests", () => setPhase("tests"));

    bindPanelEvent(panel, "live:phase:eval-gen", () => {
      const cards = root.querySelectorAll("[data-eval-card]");
      cards.forEach((c) => {
        c.classList.add("is-active");
        const status = c.querySelector("[data-eval-status]");
        if (status) status.textContent = "generating cases…";
      });
    });

    bindPanelEvent(panel, "live:phase:eval-run", async () => {
      const cards = Array.from(root.querySelectorAll("[data-eval-card]"));
      const targets = [
        { pass: 318, fix: 4 },
        { pass: 320, fix: 2 },
        { pass: 319, fix: 3 },
        { pass: 314, fix: 9 }
      ];
      // Fire all four card animations in parallel; each takes roughly
      // the same duration so the dashboard moment lands in sync.
      await Promise.all(cards.map((card, i) => (async () => {
        const fill   = card.querySelector("[data-eval-fill]");
        const passEl = card.querySelector("[data-eval-pass]");
        const fixEl  = card.querySelector("[data-eval-fix]");
        const covEl  = card.querySelector("[data-eval-cov]");
        const status = card.querySelector("[data-eval-status]");
        const t = targets[i];
        const steps = 24;
        for (let s = 1; s <= steps; s++) {
          await wait(80);
          const ratio = s / steps;
          fill.style.width = `${Math.round(ratio * 100)}%`;
          passEl.textContent = String(Math.round(t.pass * ratio));
          if (s > steps * 0.4 && s <= steps * 0.8) {
            fixEl.textContent = String(Math.round(t.fix * ((s - steps * 0.4) / (steps * 0.4))));
            status.textContent = "auto-fixing…";
          } else if (s > steps * 0.8) {
            fixEl.textContent = String(t.fix);
            status.textContent = "verifying fixes…";
          } else {
            status.textContent = "running…";
          }
          covEl.textContent = `${Math.round(ratio * 100)}%`;
        }
        passEl.textContent = String(t.pass);
        fixEl.textContent  = String(t.fix);
        covEl.textContent  = "100%";
        status.textContent = "all guardrails passed";
        status.dataset.state = "passed";
        card.classList.add("is-passed");
      })()));
    });

    bindPanelEvent(panel, "live:phase:mapping", () => {
      setPhase("mapping");
    });

    bindPanelEvent(panel, "live:phase:mapping-done", async () => {
      const total = root.querySelector("[data-map-total]");
      const fill  = root.querySelector("[data-map-fill]");
      const ok    = root.querySelector("[data-map-ok]");
      const flag  = root.querySelector("[data-map-flag]");
      const steps = 30;
      for (let s = 1; s <= steps; s++) {
        await wait(60);
        const ratio = s / steps;
        const okN   = Math.round(4598 * ratio);
        const flagN = Math.round(402  * ratio);
        const sum   = okN + flagN;
        total.textContent = `${sum.toLocaleString()} / 5,000`;
        fill.style.width  = `${Math.round((sum / 5000) * 100)}%`;
        ok.textContent    = okN.toLocaleString();
        flag.textContent  = flagN.toLocaleString();
      }
      total.textContent = "5,000 / 5,000";
      fill.style.width = "100%";
      ok.textContent   = "4,598";
      flag.textContent = "402";
    });

    bindPanelEvent(panel, "live:phase:dashboard", () => setPhase("dashboard"));

    bindPanelEvent(panel, "live:phase:notification", () => {
      const finale = root.querySelector("[data-live-finale]");
      if (!finale) return;
      finale.hidden = false;
      requestAnimationFrame(() => finale.classList.add("is-on"));
    });
  }

  // Register the new factories. We don't redeclare existing keys, so
  // the cockpit / itsm-bootstrap pages above keep working unchanged.
  Object.assign(window.PAGES, {
    "act1-foundation":  act1FoundationPage,
    "aws-credentials":  act2AwsCredentialsPage,
    "service-graph":    act2ServiceGraphPage,
    "agent-workforce":  act4WorkforcePage,
    "agent-go-live":    act5GoLivePage
  });

  // ----- Chapter registration -----------------------------------
  // Persona: Alex Kim, IT Architect at Acme Global — standing up a
  // fresh ITSM org for a 5,000-employee, multi-region workforce. The
  // chapter id stays `admin-sarah` so the engine's `startSetup()` and
  // any deep-link history keeps working without churn.
  const chapter = {
    id: "admin-sarah",
    title: "The Setup",
    blurb: "Alex stands up a 5,000-employee, multi-region IT org — foundation, fleet, and go-live in minutes.",
    persona: {
      name: "Alex",
      role: "IT Architect",
      avatarText: "A",
      accent: "var(--persona-admin)"
    },
    intentKeywords: ["admin", "alex", "setup", "install", "itsm", "cmdb", "discovery", "agent", "fleet", "go live"],
    endline: "Setup complete — your Tower is live with real-time System Health.",

    // The two opener prompts the welcome screen surfaces as one-tap
    // chips. Either one (or the Get-Started button, or any free-text
    // entry in the welcome composer) drops the user into Act 1.
    suggestedQuestions: [
      "I need to set up my IT service management",
      "How can you help?"
    ],

    faqs: [
      {
        match: /how can you help|what can you do|what do you do/i,
        answer:
          "I'm your **Setup Agent**. I can stand up your **ITSM foundation** (incidents, problems, changes, releases, SLAs, CMDB, Portal, Agentforce), populate your **CMDB** via cloud / network / agent / dynamic discovery, deploy your **agent fleet**, and walk every agent through **automated security, safety, and GDPR testing** before go-live."
      },
      {
        match: /set ?up|set up|itsm|service management/i,
        answer:
          "Just hit **Get Started** (or the chip above). I'll configure incident + problem + change management, SLAs, your CMDB framework, the Service Portal + Catalog, and Agentforce — then walk you through discovery, agent fleet, and go-live."
      },
      {
        match: /cmdb|configuration item|ci/i,
        answer:
          "Your CMDB is populated by the **Discovery agent**. I support **Cloud (AWS/Azure/vCenter)**, **Network**, **Agent-based**, and **Dynamic** discovery. You'll typically start with Cloud — it has zero on-host footprint."
      },
      {
        match: /aws|azure|vcenter|cloud/i,
        answer:
          "Cloud discovery uses **read-only IAM credentials** to enumerate resources via the provider APIs. We never write back. AWS surfaces EC2 / S3 / IAM / RDS / Lambda; Azure adds AAD; vCenter covers on-prem virtualization."
      },
      {
        match: /agent|workforce|fleet/i,
        answer:
          "There are **50+ out-of-the-box agents**. Based on your discovered network, I usually recommend **Software Assistance**, **Access Assistance**, and **Password Reset**. You can also describe a custom job-to-be-done and the **Agentforce Builder** will spin up a custom agent."
      },
      {
        match: /test|guardrail|gdpr|security|safety/i,
        answer:
          "Every agent is tested against your **security**, **safety**, and **GDPR** standards before activation. I auto-generate eval sets, run them, auto-fix any failures, and re-run until all guardrails pass."
      },
      {
        match: /roll ?back|undo|reverse|uninstall/i,
        answer:
          "**Yes — every action.** All writes are reversible for **30 days** by default. Domain packs can be uninstalled cleanly without dropping CMDB nodes."
      }
    ],

    // Cinematic welcome shown when the chapter loads. The two chips
    // mirror Alex's natural openers — clicking either is the same as
    // typing it and hitting send. The CTA falls back to a sensible
    // canned ask if Alex doesn't pick a chip or type anything.
    welcome: {
      greeting: "Welcome,",
      name: "Alex!",
      titleLead: "Stand up your",
      titleTail: "Agentic IT Service Management",
      cta: "Get Started",
      placeholder: "Tell me what you need to set up…",
      chips: [
        "I need to set up my IT service management",
        "How can you help?"
      ],
      defaultOpener: "I need to set up my IT service management Org, how can you help?",
      goto: "act1-intro"
    },

    story: [
      { type: "welcome", goto: "act1-intro" },

      /* ============================================================
         ACT 1 · The Foundation ("IT Service Management")
         ----------------------------------------------------------
         Alex's opener was already posted as the user bubble by the
         welcome step, so we land directly on the Setup Agent's reply.
         Right pane: act1-foundation, lit phase-by-phase.
         ============================================================ */
      { id: "act1-intro", type: "say",
        text:
          "I can handle the **foundational setup** for you. This includes configuring **incident** and **problem management**, **release management**, **SLAs**, and **assignment rules**. I'll also initialize your **CMDB**, set up your **Portal** with an integrated **Service Catalog**, and enable **Agentforce** with your company branding and business hours.",
        pause: 350 },

      { type: "ask",
        text:
          "Want me to **populate the environment with sample data** for incidents, knowledge articles, and queues — so you can see it in action?",
        choices: [
          { label: "Yes, go for it", value: "yes", primary: true }
        ] },

      { type: "say",
        text: "On it — bootstrapping the foundation now. **Watch the right pane** — every block lights up the moment its phase completes.",
        pause: 200 },

      { type: "browser",
        url:  "https://itsm.salesforce.com/foundation",
        page: "act1-foundation",
        title: "ITSM Foundation · Acme Global",
        pause: 600 },

      { type: "progress", text: "Configuring incident, problem &amp; change management",
                          duration: 2000, doneText: "ITSM modules online",
                          panelEvent: "act1:phase:modules" },

      { type: "progress", text: "Initializing CMDB framework",
                          duration: 1700, doneText: "CMDB framework ready · empty, awaiting discovery",
                          panelEvent: "act1:phase:cmdb" },

      { type: "progress", text: "Standing up Portal + Service Catalog",
                          duration: 1900, doneText: "Service Portal live · sample catalog seeded",
                          panelEvent: "act1:phase:portal" },

      { type: "progress", text: "Enabling Agentforce with your branding",
                          duration: 1600, doneText: "Agentforce configured · branding + business hours applied",
                          panelEvent: "act1:phase:agentforce" },

      { type: "say",
        text:
          "**Foundation is live** — no manual installs, no waiting on a release window. Your CMDB framework is in place but empty; the Portal is already serving sample tickets, and Agentforce is ready on Slack, Teams, and email.",
        pause: 400 },

      /* ============================================================
         ACT 2 · The Infrastructure (Discovery)
         ----------------------------------------------------------
         Discovery method picker → cloud → AWS → credential pane →
         Service Graph materializes in the right pane.
         ============================================================ */
      { type: "say",
        text:
          "Now let's **populate that CMDB**. I support four discovery methods — which would you like to configure first?",
        pause: 250 },

      { type: "choose",
        text: "Pick a discovery method.",
        options: [
          { label: "Cloud",       value: "cloud",
            logo: "☁",  color: "linear-gradient(135deg,#2f5cff,#6a4dff)",
            sub: "AWS · Azure · vCenter · API-driven" },
          { label: "Network",     value: "network",
            logo: "🌐", color: "linear-gradient(135deg,#0bb6c7,#1b8cd8)",
            sub: "Open ports per endpoint · longer setup" },
          { label: "Agent-based", value: "agent",
            logo: "⚙",  color: "linear-gradient(135deg,#ff8a4c,#ff5f5f)",
            sub: "Agents on every machine · creds required" },
          { label: "Dynamic",     value: "dynamic",
            logo: "✦",  color: "linear-gradient(135deg,#9aa6c8,#c2cae3)",
            sub: "Telemetry + log inference · zero-touch" }
        ] },

      { type: "say",
        text:
          "Good pick. **Cloud** is the lowest-touch path. I explicitly support **AWS**, **Azure**, and **vCenter** — each one needs connection credentials. Which provider are we connecting?",
        pause: 250 },

      { type: "choose",
        text: "Pick a cloud provider.",
        options: [
          { label: "AWS",     value: "aws",
            logo: "AWS", color: "linear-gradient(135deg,#FF9900,#FF6A00)",
            sub: "EC2 · S3 · Lambda · IAM" },
          { label: "Azure",   value: "azure",
            logo: "Az",  color: "linear-gradient(135deg,#0078D4,#5EC0FF)",
            sub: "Compute · Storage · AAD" },
          { label: "vCenter", value: "vcenter",
            logo: "vC",  color: "linear-gradient(135deg,#1C5BD9,#8E32E0)",
            sub: "On-prem virtualization" }
        ] },

      { type: "say",
        text: "Opening the credential pane on the right. Drop your AWS keys in and we'll connect.",
        pause: 200 },

      { type: "browser",
        url:  "https://itsm.salesforce.com/discovery/aws",
        page: "aws-credentials",
        title: "AWS · Connect" },

      { type: "wait-for", event: "aws-connect",
                          text: "Waiting for the AWS connection…",
                          doneText: "AWS connected · read-only IAM verified" },

      { type: "say",
        text:
          "Connected. **Watch the right pane** — the Service Graph is materializing in real time as I scan your account and link the resources back to existing Salesforce records.",
        pause: 250 },

      { type: "browser",
        url:  "https://itsm.salesforce.com/discovery/aws/graph",
        page: "service-graph",
        title: "Service Graph · AWS · ap-south-1",
        pause: 400 },

      { type: "progress", text: "Scanning EC2, S3, IAM &amp; Lambda via AWS APIs",
                          duration: 2500, doneText: "Cloud assets discovered",
                          panelEvent: "graph:phase:scan" },

      { type: "progress", text: "Linking discovered CIs to Salesforce records",
                          duration: 2200, doneText: "CI relationships established",
                          panelEvent: "graph:phase:link" },

      { type: "ask",
        text:
          "**AWS connected.** Want to also run **Network** or **Agent-based** discovery? Heads-up on the technical asks: Network needs ports opened on every endpoint; Agent-based needs an agent installed on every machine + credentials.",
        choices: [
          { label: "Skip — let's look at Cloud results", value: "skip", primary: true },
          { label: "Schedule Network for later",         value: "later" }
        ] },

      /* ============================================================
         ACT 3 · The Brain (Domain Intelligence)
         ----------------------------------------------------------
         Discovery summary + the SSL cert alert + routing.
         ============================================================ */
      { type: "say",
        text:
          "Discovery complete. I've found **20 Configuration Items** and established **32 relationships**. Your Service Graph is ready to view.",
        pause: 350,
        panelEvent: "graph:phase:complete" },

      { type: "ask",
        text:
          "**⚠ Alert** — I've discovered **three SSL certificates** expiring within **48 hours**: one on your customer portal, two on internal APIs. Should I assign a task to the **physical security team** for badge access + the **CertOps** team for renewal?",
        choices: [
          { label: "Yes — route immediately", value: "yes", primary: true }
        ] },

      { type: "status", text: "Routing tasks: SSL renewal → CertOps · badge access → Physical Security",
                        duration: 1600,
                        doneText: "3 tasks routed · CertOps SLA 4h · PhysSec SLA 24h",
                        panelEvent: "graph:phase:cert-routed" },

      /* ============================================================
         ACT 4 · The Workforce (Agent Fleet & Vibe Coding)
         ----------------------------------------------------------
         Right pane is a multi-phase workforce page:
            fleet → azure-creds → builder
         ============================================================ */
      { type: "say",
        text:
          "**Infrastructure is mapped.** Now let's deploy your workforce. I have **50+ out-of-the-box agents** — based on your discovered network, I recommend starting with these three:\n\n• **Software Assistance**\n• **System &amp; File Access Assistance**\n• **System Password Reset Assistance**",
        pause: 400 },

      { type: "browser",
        url:  "https://itsm.salesforce.com/agents/fleet",
        page: "agent-workforce",
        title: "Agent Fleet · Acme Global",
        pause: 400,
        panelEvent: "wf:phase:fleet" },

      { type: "ask",
        text: "Want to deploy the recommended three?",
        choices: [
          { label: "Yes — plus a custom agent for Austin building access", value: "custom", primary: true }
        ] },

      { type: "say",
        text:
          "Noted. Two requirements before I can spin those up:\n\n• Because you picked **Password Reset**, I need your **Azure AD credentials** to provision the integration.\n• For your custom **Austin building access** agent, please upload a **Job to be Done (JTBD)** file and I'll spin up the agent builder.",
        pause: 300,
        panelEvent: "wf:phase:azure-creds" },

      { type: "wait-for", event: "wf-creds-uploaded",
                          text: "Waiting for Azure AD credentials and the JTBD file…",
                          doneText: "Azure AD verified · JTBD parsed (7 steps · 3 branches)" },

      { type: "say",
        text:
          "Credentials accepted. JTBD parsed. The **Agentforce Builder** is spinning up your custom agent now — mapping each job step to security groups and the **Austin IoT gateway**.",
        pause: 250,
        panelEvent: "wf:phase:builder" },

      { type: "status", text: "Agentforce Builder · drafting Austin Access Agent",
                        duration: 4200,
                        doneText: "Austin Access Agent v0.1 drafted · 4 skills · 18 endpoints" },

      /* ============================================================
         ACT 5 · The Go-Live (Guardrails & Channels)
         ----------------------------------------------------------
         Right pane runs eval-runner → user mapping → System Health.
         ============================================================ */
      { type: "say",
        text:
          "Your agents are **drafted**. Before activation, every agent must be tested against company **security**, **safety**, and **GDPR** standards.",
        pause: 250 },

      { type: "ask",
        text: "Shall I run the **automated testing** process?",
        choices: [
          { label: "Yes, run the tests", value: "yes", primary: true }
        ] },

      { type: "browser",
        url:  "https://itsm.salesforce.com/agents/go-live",
        page: "agent-go-live",
        title: "Agent Go-Live · Acme Global",
        pause: 400,
        panelEvent: "live:phase:tests" },

      { type: "progress", text: "Generating eval sets · 320 test cases per agent",
                          duration: 2200, doneText: "Eval sets generated · 1,280 cases queued",
                          panelEvent: "live:phase:eval-gen" },

      { type: "progress", text: "Running tests · auto-fixing failures · re-running",
                          duration: 3200, doneText: "All guardrails passed · Security · Safety · GDPR · SOC 2",
                          panelEvent: "live:phase:eval-run" },

      { type: "say",
        text:
          "**Testing complete — all guardrails passed.** Now I'm mapping access to your **5,000 users** based on location and payroll data. I'm flagging users 'on notice' for manual manager approval; the rest are provisioned automatically.",
        pause: 350,
        panelEvent: "live:phase:mapping" },

      { type: "progress", text: "Mapping access for 5,000 users",
                          duration: 2400,
                          doneText: "**4,598** auto-granted · **402** flagged for manager approval",
                          panelEvent: "live:phase:mapping-done" },

      { type: "ask",
        text: "**Ready for deployment.** Shall we go live?",
        choices: [
          { label: "Go live", value: "live", primary: true }
        ] },

      { type: "say",
        text:
          "**Live.** Your agents are on duty. The right pane is your live System Health dashboard — I'll surface anything notable here.",
        pause: 400,
        panelEvent: "live:phase:dashboard" },

      { type: "say",
        text:
          "Heads up — **the Austin Access Agent just provisioned a badge for a new hire**, and **Password Reset Assistance** is standing by.",
        pause: 250,
        panelEvent: "live:phase:notification" },

      { type: "say",
        text:
          "Whenever you're ready, here's your **control surface** — open it when you want to see what I'm watching, what's pending your sign-off, and where the org stands today.",
        pause: 250 },

      { type: "link-card",
        title: "The Tower",
        sub:   "Your day-1 control surface · agents, signals &amp; sign-offs",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
        url:  "https://itsm.salesforce.com/tower",
        page: "tower",
        pause: 200 },

      { type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
