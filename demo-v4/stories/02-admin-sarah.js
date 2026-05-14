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
      // `let` (not `const`) so the Add Agent wizard can `unshift` a new
      // agent into the list when the user confirms creation.
      let agents = [
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
              ${ICON_CHECK}<span class="signoff__btn-label">Approve</span>
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
                <div class="cockpit__section-actions">
                  <button class="cockpit__add" type="button"
                          data-cockpit-action="add-agent"
                          aria-label="Add a new agent">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M8 3v10M3 8h10"/>
                    </svg>
                    <span>Add Agent</span>
                  </button>
                  <button class="cockpit__see" type="button"
                          data-cockpit-action="see-all-agents">See all</button>
                </div>
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

      // Section header CTAs ("See all" links + "Add Agent")
      panel.querySelectorAll("[data-cockpit-action]").forEach((el) => {
        // Skip ones already wired (signoff actions, more buttons)
        if (el.dataset.wired === "1") return;
        const action = el.getAttribute("data-cockpit-action");
        if (!["see-all-agents", "see-all-team", "add-agent"].includes(action)) return;
        el.dataset.wired = "1";
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          if (action === "add-agent") {
            // Kicks off the conversational Add Agent wizard in the
            // chat panel. `__startAddAgent` is exposed by app.js;
            // it's the same entry point as the dock chiclet.
            if (typeof window.__startAddAgent === "function") {
              window.__startAddAgent();
            } else {
              note("Add a new agent — opening the agent builder.");
            }
            return;
          }
          const msg = {
            "see-all-agents": "Showing all 25 agents across the 4 ITXM domains.",
            "see-all-team":   "Opening the full rotation — 4 on shift, 3 active.",
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

      // Targeted update for the "AI Agents" KPI value — used when the
      // Add Agent wizard adds a new agent. Locates the KPI card by
      // its label, parses the current number, applies delta. Live
      // count stays in sync with the actual `agents.length`.
      const bumpAgentKpi = (delta) => {
        const labels = panel.querySelectorAll(".kpi__label");
        for (const lbl of labels) {
          if ((lbl.textContent || "").trim() === "AI Agents") {
            const val = lbl.parentElement?.querySelector(".kpi__value");
            if (!val) return;
            const cur = parseInt((val.textContent || "0").replace(/[^\d-]/g, ""), 10) || 0;
            val.textContent = String(cur + delta);
            return;
          }
        }
      };

      // Subscribe to the Add Agent wizard's commit event. The chat
      // side dispatches this on the sidepanel after the user clicks
      // "Create agent" in the preview card. We unshift the new agent
      // so it lands at the top with the existing "New" badge, and
      // reset the domain filter so the user sees it regardless of
      // what they had selected.
      const sidepanel = panel.closest(".sidepanel") || panel.parentNode;
      const onAddAgent = (e) => {
        const a = (e && e.detail) || null;
        if (!a || !a.name) return;
        agents.unshift({
          name:  a.name,
          level: a.level || "L2",
          instances: 1,
          domain: a.domain || "reliability",
          body:  a.body  || "New agent — warming up.",
          trust: 88, trend: "flat", load: 0.05, barRisk: 5,
          tone:  "cool", status: "new",
        });
        activeDomain = "all";
        rerenderChips();
        rerenderAgents();
        bumpAgentKpi(+1);
      };
      sidepanel.addEventListener("cockpit:add-agent", onAddAgent);

      // "Updated X ago" auto-tick. Self-cleans when the panel is unmounted.
      const tickUpdated = () => {
        const rel = panel.querySelector("[data-cockpit-updated-rel]");
        if (rel) rel.textContent = relTime(lastUpdated);
      };
      const updatedTimer = setInterval(() => {
        if (!panel.querySelector("[data-cockpit-updated-rel]")) {
          clearInterval(updatedTimer);
          // Cockpit is gone — release the sidepanel listener so
          // re-mounting the cockpit doesn't pile up stale handlers.
          sidepanel.removeEventListener("cockpit:add-agent", onAddAgent);
          return;
        }
        tickUpdated();
      }, 15000);
    }
  };
  // -----------------------------------------------------------------
  // v4 chiclet destinations
  // -----------------------------------------------------------------
  // Light right-panel pages mounted when John taps a home chiclet:
  //   • approvals   — full queue of items awaiting his decision
  //   • incidents   — last 7 days, scoped to IndiaFirst Bank services
  //   • healthcheck — live status across the critical service set
  //
  // Each one is intentionally self-contained (own escape helper, own
  // data array, own render fns) so it stays readable next to the
  // much bigger cockpit factory above.
  // -----------------------------------------------------------------
  const escV4 = (s) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  pages.approvals = (panel) => {
    // Approvals queue — the home strip showed 3 of these; this page
    // is the full list with one extra deferred item for context.
    const APPROVALS = [
      {
        id: "appr-1", risk: "high",
        agent: "RemediationAgent",  deadline: "in 12 min",
        action: "Roll back payments-gateway to v2.4.1",
        rationale: "Latency p95 climbed to 1.4s after the v2.4.3 deploy. Rolling back restores known-good performance and unblocks the end-of-day batch.",
        impact: "~340 merchants affected · 12 active checkouts will retry once.",
      },
      {
        id: "appr-2", risk: "medium",
        agent: "ChangeAgent", deadline: "by 18:00 IST",
        action: "Postpone Saturday's onboarding launch — clashes with the core-banking patch",
        rationale: "Saturday's onboarding flow touches core-banking, which is in a maintenance window 04:00–06:00 IST that morning.",
        impact: "Reschedules 1,200 onboarding invites by 24 hours.",
      },
      {
        id: "appr-3", risk: "high",
        agent: "PatchAgent", deadline: "tonight 02:00 IST",
        action: "Emergency patch for core-banking — fix the connection-pool leak",
        rationale: "ComplianceAgent caught a memory leak in build 8.4.1 that breaches the 99.95% SLO under load.",
        impact: "10-minute brownout during apply. Affects net-banking and ATM.",
      },
      {
        id: "appr-4", risk: "low",
        agent: "AccessAgent", deadline: "by Fri",
        action: "Grant Wispr Flow access to 3 treasury-ops users",
        rationale: "Three treasury analysts requested Wispr; their manager pre-approved. ComplianceAgent confirmed no separation-of-duty conflict.",
        impact: "License headroom: 47 of 60 seats still available.",
      },
    ];

    panel.innerHTML = `
      <div class="page v4-page v4-page--approvals">
        <header class="v4-page__head">
          <div>
            <div class="v4-page__eyebrow">Today's queue</div>
            <h2 class="v4-page__title">Approvals waiting on you</h2>
            <p class="v4-page__lead">
              ${APPROVALS.length} items, sorted by deadline. Approve to release the agent's
              plan, defer to buy 24 hours, or reject to send it back.
            </p>
          </div>
          <div class="v4-page__head-actions">
            <button class="v4-btn v4-btn--ghost" type="button" data-v4-action="filter">Filter</button>
          </div>
        </header>
        <ul class="v4-approvals-list">
          ${APPROVALS.map((a) => `
            <li class="v4-approval signoff" data-risk="${escV4(a.risk)}" data-signoff-id="${escV4(a.id)}">
              <div class="signoff__row">
                <span class="signoff__risk signoff__risk--${escV4(a.risk)}">${escV4(a.risk)}</span>
                <span class="signoff__agent">${escV4(a.agent)}</span>
                <span class="signoff__deadline">${escV4(a.deadline)}</span>
              </div>
              <p class="signoff__action">${escV4(a.action)}</p>
              <div class="v4-approval__meta">
                <div class="v4-approval__rationale">
                  <strong>Why:</strong> ${escV4(a.rationale)}
                </div>
                <div class="v4-approval__impact">
                  <strong>Impact:</strong> ${escV4(a.impact)}
                </div>
              </div>
              <div class="signoff__actions">
                <button class="signoff__btn signoff__btn--approve" type="button"
                        data-v4-action="approve" data-id="${escV4(a.id)}">Approve</button>
                <button class="signoff__btn signoff__btn--defer" type="button"
                        data-v4-action="defer" data-id="${escV4(a.id)}">Defer 24h</button>
                <button class="signoff__btn signoff__btn--reject" type="button"
                        data-v4-action="reject" data-id="${escV4(a.id)}">Reject</button>
              </div>
            </li>
          `).join("")}
        </ul>
      </div>
    `;

    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-v4-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-v4-action");
      if (action === "filter") {
        window.directorNote?.({ title: "Filters", text: "Filter UI lands in Phase 2." });
        return;
      }
      const card = btn.closest(".v4-approval");
      if (!card) return;
      const label = card.querySelector(".signoff__action")?.textContent?.trim() || "Sign-off";
      card.setAttribute("data-state", action);
      window.directorNote?.({
        title:
          action === "approve" ? "Approved" :
          action === "defer"   ? "Deferred 24h"  :
                                 "Rejected",
        text: label,
        autoDismiss: 2400,
      });
    });
  };

  pages.incidents = (panel) => {
    // 7-day incident log scoped to IndiaFirst Bank services. Each row
    // can drill into a detailed agent timeline (Phase 2 feature —
    // for now clicking the row pings a director note).
    const INCIDENTS = [
      { date: "Today 09:14", service: "payments-gateway",   sev: "P1", title: "Payments slowing down during the end-of-day batch", status: "open",      mttr: "—"        },
      { date: "May 13",      service: "payments-gateway",   sev: "P2", title: "Throughput dipped during peak hours",               status: "resolved",  mttr: "18m"      },
      { date: "May 12",      service: "card-auth",          sev: "P3", title: "Intermittent card declines (~0.4% of transactions)", status: "resolved",  mttr: "42m"      },
      { date: "May 11",      service: "loan-origination",   sev: "P2", title: "Connection pool ran out under load",                status: "resolved",  mttr: "1h 12m"   },
      { date: "May 9",       service: "atm-network",        sev: "P3", title: "3 ATMs in Mumbai West failed withdrawals",          status: "resolved",  mttr: "28m"      },
      { date: "May 8",       service: "net-banking-portal", sev: "P2", title: "Session store flapped during the failover drill",  status: "resolved",  mttr: "1h 04m"   },
      { date: "May 7",       service: "fraud-detection",    sev: "P3", title: "Too many false positives on UPI payments over ₹50k", status: "resolved",  mttr: "2h 18m"   },
    ];

    const STATUS_LABEL = { open: "Open", resolved: "Resolved" };
    const sevToneFor = (s) => s === "P1" ? "high" : s === "P2" ? "medium" : "low";

    panel.innerHTML = `
      <div class="page v4-page v4-page--incidents">
        <header class="v4-page__head">
          <div>
            <div class="v4-page__eyebrow">Last 7 days</div>
            <h2 class="v4-page__title">Recent incidents</h2>
            <p class="v4-page__lead">
              ${INCIDENTS.length} events across your critical services. Tap any row to see
              what happened, who fixed it, and how long it took.
            </p>
          </div>
          <div class="v4-page__head-actions">
            <button class="v4-btn v4-btn--ghost" type="button" data-v4-action="filter">Filter</button>
          </div>
        </header>
        <div class="v4-incidents">
          <div class="v4-incidents__head" role="row">
            <span>When</span>
            <span>Service</span>
            <span>Sev</span>
            <span>Title</span>
            <span>Status</span>
            <span>MTTR</span>
          </div>
          ${INCIDENTS.map((i) => `
            <button class="v4-incidents__row" type="button" role="row" data-v4-action="open-incident">
              <span class="v4-incidents__when">${escV4(i.date)}</span>
              <span class="v4-incidents__svc">${escV4(i.service)}</span>
              <span class="v4-incidents__sev">
                <span class="signoff__risk signoff__risk--${sevToneFor(i.sev)}">${escV4(i.sev)}</span>
              </span>
              <span class="v4-incidents__title">${escV4(i.title)}</span>
              <span class="v4-incidents__status" data-state="${escV4(i.status)}">${escV4(STATUS_LABEL[i.status] || i.status)}</span>
              <span class="v4-incidents__mttr">${escV4(i.mttr)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    panel.addEventListener("click", (e) => {
      const row = e.target.closest("[data-v4-action='open-incident']");
      if (!row) return;
      const title = row.querySelector(".v4-incidents__title")?.textContent?.trim() || "Incident";
      window.directorNote?.({
        title: "Drilldown",
        text: title,
        sub: "Per-incident timeline ships in Phase 2.",
        autoDismiss: 2600,
      });
    });
  };

  pages.healthcheck = (panel) => {
    // Live-status grid across the critical service set. Three states:
    //   healthy   · within SLO
    //   watch     · drifting toward SLO breach but not yet over
    //   degraded  · actively breaching or close to it
    // SLA % and load are static for the demo, but the "Re-run scan"
    // button cycles a couple of values so the page doesn't feel
    // frozen mid-demo.
    const SERVICES = [
      { name: "payments-gateway",   state: "healthy",  sla: "99.97%", load: 0.43, note: "All agents are reporting green." },
      { name: "card-auth",          state: "watch",    sla: "99.94%", load: 0.31, note: "Error rate has been climbing for 24h. DiagnosticsAgent is digging in." },
      { name: "core-banking",       state: "degraded", sla: "99.81%", load: 0.78, note: "Connection-pool exhaustion. PatchAgent has an emergency fix waiting on your approval." },
      { name: "loan-origination",   state: "healthy",  sla: "99.92%", load: 0.52, note: "Slightly slow but still inside the SLO." },
      { name: "net-banking-portal", state: "healthy",  sla: "99.99%", load: 0.28, note: "Steady. Last failover drill came back green." },
      { name: "fraud-detection",    state: "healthy",  sla: "99.96%", load: 0.36, note: "Model retrained last night. False positives are down 14%." },
      { name: "atm-network",        state: "watch",    sla: "99.88%", load: 0.55, note: "A handful of withdrawal failures on 3 Mumbai-West ATMs." },
    ];

    const STATE_LABEL = { healthy: "Healthy", watch: "Watch", degraded: "Degraded" };

    panel.innerHTML = `
      <div class="page v4-page v4-page--healthcheck">
        <header class="v4-page__head">
          <div>
            <div class="v4-page__eyebrow">Live scan · just now</div>
            <h2 class="v4-page__title">Health check</h2>
            <p class="v4-page__lead">
              Live status across your critical services. Hit Re-run scan to ask each
              agent for a fresh probe.
            </p>
          </div>
          <div class="v4-page__head-actions">
            <button class="v4-btn v4-btn--primary" type="button" data-v4-action="rescan">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
                   stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M13.5 7.5A5.5 5.5 0 1 0 8 13"/>
                <path d="M10.5 4.5 13.5 7.5 10.5 10.5"/>
              </svg>
              Re-run scan
            </button>
          </div>
        </header>
        <div class="v4-health-grid">
          ${SERVICES.map((s) => `
            <article class="v4-health-card" data-state="${escV4(s.state)}">
              <div class="v4-health-card__top">
                <span class="v4-health-card__dot" aria-hidden="true"></span>
                <span class="v4-health-card__name">${escV4(s.name)}</span>
                <span class="v4-health-card__state">${escV4(STATE_LABEL[s.state])}</span>
              </div>
              <div class="v4-health-card__metrics">
                <div class="v4-health-card__metric">
                  <div class="v4-health-card__metric-label">SLA</div>
                  <div class="v4-health-card__metric-value">${escV4(s.sla)}</div>
                </div>
                <div class="v4-health-card__metric">
                  <div class="v4-health-card__metric-label">Load</div>
                  <div class="v4-health-card__metric-value">
                    <div class="v4-health-card__bar" style="--bar:${(s.load * 100).toFixed(0)}%">
                      <span class="v4-health-card__bar-fill"></span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="v4-health-card__note">${escV4(s.note)}</p>
            </article>
          `).join("")}
        </div>
      </div>
    `;

    panel.querySelector("[data-v4-action='rescan']")?.addEventListener("click", () => {
      const eyebrow = panel.querySelector(".v4-page__eyebrow");
      if (eyebrow) eyebrow.textContent = "Live scan · re-running…";
      setTimeout(() => {
        if (eyebrow) eyebrow.textContent = "Live scan · just now";
        window.directorNote?.({
          title: "Health check",
          text: "Probes complete · 1 service watch, 1 degraded.",
          autoDismiss: 2600,
        });
      }, 1400);
    });
  };

  // -------------------------------------------------------------
  // INCIDENT-LIVE (Phase 2) — live incident detail page.
  //
  // Receives a snapshot from app.js via window.__incPageSync()
  // every time the orchestration engine advances a phase or
  // appends timeline entries. The page is self-contained: it
  // re-renders sub-regions in place rather than blowing away the
  // whole panel so that scroll position survives updates.
  //
  // Layout (single column on narrow widths, two on wider):
  //   • Header: sev pill + INC id + title + sub + elapsed counter
  //   • Status banner: phase pipeline (Detected → Resolved)
  //   • Body, two columns:
  //       Left:  Agent timeline (chronological, agents colour-coded)
  //       Right: Agents on this incident (chip cloud, with handoff lines)
  //   • Summary card: visible only once resolved
  // -------------------------------------------------------------
  pages["incident-live"] = (panel) => {
    panel.innerHTML = `
      <div class="page v4-page inc-page" id="incPage" data-phase="">
        <header class="inc-page__head">
          <div class="inc-page__head-lead">
            <span class="inc-page__sev" data-sev="P1">P1</span>
            <div class="inc-page__head-text">
              <div class="inc-page__eyebrow" id="incPageEyebrow">—</div>
              <h2 class="inc-page__title" id="incPageTitle">Live incident</h2>
              <p class="inc-page__sub" id="incPageSub"></p>
            </div>
          </div>
          <div class="inc-page__head-actions">
            <div class="inc-page__elapsed" id="incPageElapsed" aria-live="polite">Live · 00:00</div>
          </div>
        </header>

        <section class="inc-status" id="incStatusSection" aria-label="Incident progress">
          <ol class="inc-status__phases" id="incStatusPhases" role="list"></ol>
          <p class="inc-status__caption" id="incStatusCaption">—</p>
        </section>

        <div class="inc-body">
          <div class="inc-body__col inc-body__col--left">
            <aside class="inc-graph" aria-labelledby="incGraphHd">
              <header class="inc-section__head">
                <h3 id="incGraphHd" class="inc-section__title">Agents on this incident</h3>
              </header>
              <ul class="inc-graph__list" id="incGraphList" role="list"></ul>
              <div class="inc-graph__caption">
                Highlighted agents have acted on this incident. Lines show recent handoffs.
              </div>
            </aside>

            <section class="inc-summary-card inc-summary-card--stacked" id="incSummaryCard" hidden>
              <header class="inc-summary-card__head">
                <span class="inc-summary-card__check" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
                       stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m3.5 8.5 3 3 6-7"/>
                  </svg>
                </span>
                <div>
                  <h3 class="inc-summary-card__title">Post-incident summary is ready</h3>
                  <p class="inc-summary-card__sub">
                    ComplianceAgent drafted a full RCA with timeline, root cause, and follow-up actions.
                  </p>
                </div>
              </header>
              <div class="inc-summary-card__actions">
                <button class="v4-btn v4-btn--primary" type="button" data-inc-action="view-summary">
                  View summary
                </button>
                <button class="v4-btn v4-btn--ghost" type="button" data-inc-action="download-summary">
                  Download (.md)
                </button>
                <button class="v4-btn v4-btn--ghost" type="button" data-inc-action="share-slack">
                  Share to Slack
                </button>
              </div>
            </section>
          </div>

          <section class="inc-timeline" aria-labelledby="incTimelineHd">
            <header class="inc-section__head">
              <h3 id="incTimelineHd" class="inc-section__title">Agent timeline</h3>
              <div class="inc-section__head-meta">
                <span class="inc-section__live" id="incTimelineLive" hidden></span>
                <span class="inc-section__count" id="incTimelineCount">0 entries</span>
              </div>
            </header>
            <ol class="inc-timeline__list" id="incTimelineList" role="list"></ol>
          </section>
        </div>
      </div>
    `;

    // Render hooks ------------------------------------------------
    const escI = (v) => String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

    // Timeline timestamp helpers ----------------------------------
    // Phase entries record their offset from the incident detection
    // ("+0s", "+2s", "+1m" …). The agent timeline shows real wall-
    // clock times instead, anchored to a fixed demo base time so the
    // sequence is reproducible across sessions and reads like an
    // actual incident log (13:14:01 IST · 13:14:03 IST · …) rather
    // than a stopwatch.
    //
    // 13:14:01 IST is chosen because the narration claims build
    // v3.7.1 went live at 09:02 IST and the SLA breach was caught
    // 4h 12m later — so detection lands at ~13:14.
    const incBaseTimeMs = (() => {
      const d = new Date();
      d.setHours(13, 14, 1, 0);
      return d.getTime();
    })();
    const formatIncAt = (rel) => {
      // Accepts "+0s", "+12s", "+1m", "+1m30s" — resilient to authors
      // mixing m and s in the same offset. Falls back to the raw
      // string if the pattern doesn't match (e.g. legacy "Now").
      const m = String(rel || "").match(/^\+(?:(\d+)m)?(?:(\d+)s)?$/);
      if (!m) return String(rel || "");
      const secs = (parseInt(m[1] || "0", 10) * 60) + parseInt(m[2] || "0", 10);
      const t = new Date(incBaseTimeMs + secs * 1000);
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      const ss = String(t.getSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    };

    function renderPhases(snap) {
      const host = panel.querySelector("#incStatusPhases");
      if (!host) return;
      // --progress drives the purple overlay width via CSS. We clamp
      // to [0, 1] so the bar never overshoots on edge phases.
      // --phase-count drives the track inset so the line trims
      // exactly at the first and last dot rather than leaking past.
      const total = Math.max(1, snap.phases.length - 1);
      const idx   = Math.max(0, Math.min(snap.phaseIdx, total));
      const progress = idx / total;
      host.style.setProperty("--progress", String(progress));
      host.style.setProperty("--phase-count", String(snap.phases.length));
      host.innerHTML = snap.phases.map((p, i) => {
        const state = i <  snap.phaseIdx ? "done"
                    : i === snap.phaseIdx ? "active"
                    : "pending";
        return `
          <li class="inc-status__phase" data-state="${state}">
            <span class="inc-status__phase-dot" aria-hidden="true"></span>
            <span class="inc-status__phase-label">${escI(p.label)}</span>
          </li>
        `;
      }).join("");
    }

    function renderTimeline(snap) {
      const list = panel.querySelector("#incTimelineList");
      const count = panel.querySelector("#incTimelineCount");
      const livePill = panel.querySelector("#incTimelineLive");
      if (!list) return;

      // Use the entry count (not children count) to decide on
      // scroll-into-view, so activity-only updates don't yank scroll.
      const previousEntries = parseInt(list.dataset.entryCount || "0", 10);
      list.dataset.entryCount = String(snap.timeline.length);

      const showLive = !!snap.activity && !snap.resolved;
      const liveAgent = showLive
        ? (snap.agents[snap.activity.agent] || { tone: "#8b94b3", role: "" })
        : null;

      // Newest-first ordering: with reverse chronological order the
      // most recent activity is always at the top of the panel and
      // older context streams downward. snap.timeline is kept in
      // chronological order (other surfaces — graph, summary —
      // depend on that), so we reverse a copy at render time.
      const orderedTimeline = snap.timeline.slice().reverse();

      const entriesHtml = orderedTimeline.map((e, idx) => {
        const agent = snap.agents[e.agent] || { tone: "#8b94b3", role: "" };
        // The "latest" pulse is for when nothing further is happening.
        // While the live activity row is visible, IT carries the pulse,
        // so the most recent entry should read as settled. With the
        // reversed list, the most recent entry is at idx 0.
        const isLatest = !showLive && idx === 0;
        return `
          <li class="inc-timeline__entry${isLatest ? " is-latest" : ""}"
              style="--agent-tone:${agent.tone}">
            <span class="inc-timeline__at">${escI(formatIncAt(e.at))}</span>
            <span class="inc-timeline__dot" aria-hidden="true"></span>
            <div class="inc-timeline__body">
              <div class="inc-timeline__agent">${escI(e.agent)}</div>
              <div class="inc-timeline__text">${escI(e.text)}</div>
            </div>
          </li>
        `;
      }).join("");

      // Live activity row — what an agent is doing RIGHT NOW.
      // With the reversed list, "Now" is the newest beat and goes
      // at the TOP of the timeline (above the most recent settled
      // entry). For "waiting" / "handoff" states the typing dots
      // are suppressed (see CSS) so the row reads as paused vs.
      // actively working.
      const liveHtml = showLive ? `
        <li class="inc-timeline__live inc-timeline__live--${escI(snap.activity.state || "working")}"
            role="status" aria-live="polite"
            style="--agent-tone:${liveAgent.tone}">
          <span class="inc-timeline__at inc-timeline__at--live">Now</span>
          <span class="inc-timeline__dot inc-timeline__dot--live" aria-hidden="true"></span>
          <div class="inc-timeline__body">
            <div class="inc-timeline__agent">${escI(snap.activity.agent)}</div>
            <div class="inc-timeline__live-line">
              <span class="inc-timeline__verb">${escI(snap.activity.verb)}</span>
              <span class="inc-timeline__live-text">${escI(snap.activity.text)}</span>
              <span class="inc-timeline__typing" aria-hidden="true">
                <i></i><i></i><i></i>
              </span>
            </div>
          </div>
        </li>
      ` : "";

      list.innerHTML = liveHtml + entriesHtml;

      if (count) {
        count.textContent = `${snap.timeline.length} entr${snap.timeline.length === 1 ? "y" : "ies"}`;
      }

      if (livePill) {
        if (showLive) {
          livePill.hidden = false;
          livePill.dataset.state = snap.activity.state || "working";
          livePill.style.setProperty("--agent-tone", liveAgent.tone);
          livePill.innerHTML = `
            <span class="inc-section__live-dot" aria-hidden="true"></span>
            <span class="inc-section__live-text">${escI(snap.activity.agent)}</span>
            <span class="inc-section__live-verb">${escI(snap.activity.verb)}</span>
          `;
        } else {
          livePill.hidden = true;
          livePill.removeAttribute("data-state");
          livePill.innerHTML = "";
        }
      }

      // Scroll to the newest item only when a new entry actually
      // appended (not on activity refreshes), so the live row stays
      // in view without fighting the user's scroll position. With
      // newest-first ordering, the freshest beat is the first
      // child (the live "Now" row when present, otherwise the
      // top settled entry).
      if (snap.timeline.length > previousEntries) {
        const firstEl = list.firstElementChild;
        if (firstEl && typeof firstEl.scrollIntoView === "function") {
          firstEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }

    function renderGraph(snap) {
      const host = panel.querySelector("#incGraphList");
      if (!host) return;
      const order = Object.keys(snap.agents);
      // Determine the most recent two agents that acted (for the handoff line).
      const recent = snap.timeline.slice(-3).map((e) => e.agent);
      const currentAgent = recent[recent.length - 1] || null;

      // If the live activity is on this agent, surface its verb so the
      // chip reads "Working: Correlating…" instead of just a quiet pulse.
      const liveOn = (snap.activity && !snap.resolved) ? snap.activity : null;

      host.innerHTML = order.map((name) => {
        const meta = snap.agents[name];
        const active = snap.activeAgents.includes(name);
        const isCurrent = name === currentAgent && !snap.resolved;
        const isLive = !!liveOn && liveOn.agent === name;
        const liveBadge = isLive
          ? `<span class="inc-graph__node-verb" data-state="${escI(liveOn.state || "working")}">${escI(liveOn.verb)}</span>`
          : "";
        return `
          <li class="inc-graph__node${active ? " is-active" : ""}${isCurrent ? " is-current" : ""}${isLive ? " is-live" : ""}"
              style="--agent-tone:${meta.tone}">
            <span class="inc-graph__node-dot" aria-hidden="true"></span>
            <div class="inc-graph__node-text">
              <div class="inc-graph__node-name">${escI(name)}</div>
              <div class="inc-graph__node-role">${escI(meta.role)}</div>
              ${liveBadge}
            </div>
            ${active ? `<span class="inc-graph__node-check" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
                   stroke="currentColor" stroke-width="2.4"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="m3.5 8.5 3 3 6-7"/>
              </svg>
            </span>` : ""}
          </li>
        `;
      }).join("");
    }

    function applyHeader(snap) {
      const phase = snap.phases[Math.max(0, snap.phaseIdx)];
      const eyebrow = panel.querySelector("#incPageEyebrow");
      const title = panel.querySelector("#incPageTitle");
      const sub = panel.querySelector("#incPageSub");
      const caption = panel.querySelector("#incStatusCaption");
      const root = panel.querySelector("#incPage");
      if (eyebrow) eyebrow.textContent = `${snap.incident.id} · ${snap.incident.service} · ${snap.incident.region}`;
      if (title) title.textContent = snap.incident.title;
      if (sub) sub.textContent = `${snap.incident.sub} ${snap.incident.affected}.`;
      if (caption && phase) caption.textContent = phase.caption;
      // The "resolved" data-phase value greens the elapsed pill via
      // CSS — only apply it once the engine has actually flagged the
      // incident as resolved (i.e. after the resolved-phase entries
      // have finished posting). While we're inside the resolved phase
      // but still verifying, fall back to a transitional 'resolving'
      // value so the pill keeps reading "Live · …" without flashing
      // green prematurely.
      const phaseId = phase ? phase.id : "";
      const dataPhase = (phaseId === "resolved" && !snap.resolved) ? "resolving" : phaseId;
      if (root) root.setAttribute("data-phase", dataPhase);
    }

    function applySummary(snap) {
      const card = panel.querySelector("#incSummaryCard");
      if (!card) return;
      // `snap.resolved` is now ONLY true once the resolved-phase
      // entries have all posted (see finishPhaseEntries), so the
      // summary card and the wrap-up chiclets reveal in lock-step.
      if (snap.resolved) card.removeAttribute("hidden");
      else card.setAttribute("hidden", "");
    }

    // Public hook the engine calls every time state advances.
    window.__incPageSync = (snap) => {
      try {
        applyHeader(snap);
        renderPhases(snap);
        renderTimeline(snap);
        renderGraph(snap);
        applySummary(snap);
      } catch (err) {
        console.warn("incident page sync failed", err);
      }
    };

    // First paint — pull current state if the engine has already started.
    if (typeof window.__incGetSnapshot === "function") {
      const snap = window.__incGetSnapshot();
      if (snap) window.__incPageSync(snap);
    }

    // Click delegation for the summary card actions.
    panel.addEventListener("click", (e) => {
      const t = e.target.closest("[data-inc-action]");
      if (!t) return;
      const action = t.getAttribute("data-inc-action");
      // Defer to the global handler in app.js so all incident
      // chiclet semantics live in one place.
      if (typeof window.__incHandleAction === "function") {
        window.__incHandleAction(action);
      }
    });
  };

  Object.assign(window.PAGES = window.PAGES || {}, pages);
  // Tower is the active nav item that opens the Cockpit. Aliasing it
  // here means the workspace placeholder in app.js stays untouched
  // while John lands on his control surface the moment he taps
  // Tower in the sidenav.
  window.PAGES.tower = window.PAGES.cockpit;

  // ----- Chapter registration -----------------------------------
  const chapter = {
    id: "admin-sarah",
    title: "The Setup",
    blurb: "Sarah installs IT Services in 8 minutes. By 1 PM, every employee has met Jarvis.",
    persona: {
      name: "Sarah",
      role: "IT Admin",
      avatarText: "S",
      accent: "var(--persona-admin)"
    },
    intentKeywords: ["admin", "sarah", "setup", "install", "itsm", "cmdb", "splunk", "cockpit"],
    endline: "ITSM is live. Sarah's Cockpit is ready — her day-1 control surface is one click away.",

    suggestedQuestions: [
      "Why install CMDB first?",
      "What if my CMDB has dirty data?",
      "Can I roll this back?",
      "What changes for employees today?"
    ],

    faqs: [
      {
        match: /cmdb.*first|why.*cmdb/i,
        answer:
          "CMDB is the **graph** Jarvis reasons over. Without it, every recommendation is a guess. We install it first because it lights up topology, change-impact, and incident correlation — these power every later chapter (the burnout flag, the breach causal map, the Wall Board)."
      },
      {
        match: /dirty data|messy|stale|bad data|wrong/i,
        answer:
          "Jarvis assumes your CMDB is partially stale. The discovery agent reconciles three sources (asset DB, Mule Agent Fabric runtime relationships, SSO group memberships) and only writes back **HIGH-confidence** matches. Conflicts go to a review queue with diff cards.",
        source: "CMDB integration with Mule Agent Fabric — see Amarendra's deck."
      },
      {
        match: /roll ?back|undo|reverse|uninstall/i,
        answer:
          "**Yes — every action.** All writes are reversible for **30 days** by default; the audit log shows the diff and a one-click revert. Domain packs can be uninstalled cleanly without dropping CMDB nodes."
      },
      {
        match: /employees|notice|change|disruption|impact/i,
        answer:
          "On Day 1, employees notice **one thing**: a Slack DM from Jarvis introducing itself, plus instant access for any \"need access to X\" request. No password resets, no portals, no ticket forms unless they want one."
      },
      {
        match: /slack reveal|broadcast|announce|company-wide|reveal/i,
        answer:
          "When Sarah approves, Jarvis posts a personalized DM to every employee in the org. The message acknowledges them by name, mentions one tangible thing it already noticed about their setup (e.g., \"your laptop battery is degrading — replacement on the way\"), and offers itself as a Slack-first IT partner."
      },
      {
        match: /splunk|datadog|observability/i,
        answer:
          "The Splunk path is fully wired in this demo. Datadog works the same way (different SSO endpoint, different log schema). You can wire both — Jarvis dedupes incidents across providers."
      }
    ],

    // Cinematic welcome shown when the chapter loads — replaces the
    // legacy "Hi Sarah… Begin setup?" intro. Clicking "Install ITSM"
    // jumps straight into the existing setup beat ("begin").
    welcome: {
      greeting: "Welcome,",
      name: "Sarah!",
      titleLead: "Start with",
      titleTail: "Agentic IT Service",
      cta: "Get Started",
      placeholder: "Ask anything",
      goto: "begin"
    },

    story: [
      { type: "welcome", goto: "begin" },

      // Establish vocabulary up-front so the "Install ITSM" CTA Sarah
      // just clicked maps cleanly to the "CMDB" install we're about
      // to propose. Without this line, the jump from "ITSM" to "CMDB"
      // reads as two unrelated products.
      { id: "begin", type: "say",
        text: "Starting setup. **ITSM** ships in three parts — and the **CMDB** is the foundation everything else reasons over. Let's start there.",
        pause: 250 },

      // ---- Context Q&A FIRST. We right-size BEFORE proposing the
      //      install — committing Sarah to a CMDB install before we
      //      know the shape of her org would be backwards.
      //      Industry question removed: Acme **Health** already implies
      //      HLS, and the answer was never used downstream.
      { type: "say",
        text: "**Two quick questions** before I propose the install.",
        pause: 200 },

      { type: "choose",
        text: "Roughly how many employees does Acme Health have?",
        options: [
          { label: "Under 1,000",       value: "small",      logo: "S",
            color: "linear-gradient(135deg,#9aa6c8,#c2cae3)",
            sub: "Single region · lean ops" },
          { label: "1,000 – 10,000",    value: "mid",        logo: "M",
            color: "linear-gradient(135deg,#6f5fff,#a25cff)",
            sub: "Multi-site · several BUs" },
          { label: "10,000+",           value: "enterprise", logo: "L",
            color: "linear-gradient(135deg,#2f5cff,#6a4dff)",
            sub: "Global · 24/7 follow-the-sun" }
        ]
      },

      { type: "multi-choose",
        text: "Which of these tools should I plug into right now?",
        sub: "Pick what's already in your stack — you can add more later.",
        headline: "Identity & observability",
        confirmLabel: "Continue setup",
        options: [
          { label: "Okta",            value: "okta",
            logo: "Okta",            color: "#007DC1",
            sub: "Workforce identity & SSO" },
          { label: "Microsoft Intune", value: "intune",
            logo: "MS",              color: "#0078D4",
            sub: "Endpoint management" },
          { label: "AWS",             value: "aws",
            logo: "AWS",             color: "linear-gradient(135deg,#FF9900,#FF6A00)",
            sub: "Cloud infra & telemetry" },
          { label: "Splunk",          value: "splunk",
            logo: "assets/Splunk.png",
            sub: "Logs · SIEM · observability" }
        ]
      },

      // Licence check belongs HERE — now that we know what to license.
      // (Previously it ran before the user had picked anything, which
      // made it feel like ceremonial filler.)
      { type: "status", text: "Checking licences for selected integrations",
                        duration: 2000, doneText: "Licences validated" },

      // Echo the choices back so the context Q&A feels earned and
      // Jarvis's reasoning is visible (Rule C3 — transparency).
      { type: "say",
        text: "Locked in — sizing for **mid-size healthcare**, plugging into **Okta, Intune, AWS, Splunk**.",
        pause: 250 },

      // Single primary install CTA. Surfaces the rollback affordance
      // up-front so Sarah can commit with confidence. The old "Skip
      // CMDB" branch was a dead-end (later steps still opened the
      // CMDB dashboard regardless), so it's been retired.
      { type: "ask",
        text: "I'll install the **CMDB** package first — it's the graph everything else reasons over. Every action is **reversible for 30 days**.",
        choices: [
          { label: "Install CMDB", value: "yes", primary: true }
        ]
      },

      // ---- Splunk auth FIRST so the bootstrap can honestly claim it
      //      ingests live telemetry. Old order ran "materializing
      //      service graph from telemetry" before Splunk was authed —
      //      reverse causality that any observability admin would clock.
      { type: "say",
        text: "Authenticating **Splunk** so the bootstrap can ingest from your live telemetry.",
        pause: 250 },
      { type: "browser", url: "https://login.splunk.com/sso", page: "splunk-auth", title: "Splunk · Single Sign-On" },

      { type: "wait-for", event: "splunk-login", text: "Waiting for you to authenticate…" },

      { type: "status", text: "Exchanging tokens",
                        duration: 1800, doneText: "Splunk authenticated" },

      { type: "browser-close" },

      // ---- Bootstrap reveal — telemetry is now live, so the phases
      //      below are truthful rather than aspirational.
      { type: "say",
        text: "Telemetry online. **Watch the right pane** — your IT landscape is about to come alive.",
        pause: 350 },

      { type: "browser",
        url:  "https://itsm.salesforce.com/cmdb/bootstrap",
        page: "itsm-bootstrap",
        title: "ITSM bootstrap · Acme Health",
        pause: 600
      },

      { type: "progress",
        text: "Activating specialized AI agents",
        duration: 2400,
        doneText: "**50+** specialized AI agents online",
        panelEvent: "bs:phase:agents" },

      { type: "progress",
        text: "Materializing service graph from live Splunk + AWS telemetry",
        duration: 2400,
        doneText: "Service graph materialized · **142** services",
        panelEvent: "bs:phase:services" },

      { type: "progress",
        text: "Populating dynamic CMDB",
        duration: 2600,
        doneText: "CMDB populated · **12,847** CIs without manual entry",
        panelEvent: "bs:phase:cmdb" },

      { type: "progress",
        text: "Loading intelligence layers",
        duration: 2200,
        doneText: "User · Identity · Agent graphs ready",
        panelEvent: "bs:phase:layers" },

      { type: "progress",
        text: "Importing domain knowledge",
        duration: 2200,
        doneText: "**500+** failure patterns + resolution playbooks loaded",
        panelEvent: "bs:phase:knowledge" },

      // The "aha" reveal — the entire IT landscape, mapped in real time.
      { type: "say",
        text: "**There it is, Sarah.** Your entire IT landscape — servers, apps, agents, dependencies — mapped in real time. **More accurate than a year of manual CMDB work.**",
        pause: 450,
        panelEvent: "bs:phase:reveal" },

      // ---- Final wiring — pipelines & routing depend on the bootstrap
      //      graph being materialised, so they sit after the reveal.
      { type: "progress", text: "Provisioning data pipelines",
                          duration: 2200, doneText: "Pipelines provisioned" },
      { type: "progress", text: "Configuring incident routing",
                          duration: 2000, doneText: "Routing live" },

      // Setup closer — keeps the bootstrap reveal panel on screen as
      // the visual confirmation. (We deliberately don't switch the
      // right pane to a separate CMDB dashboard here — the live
      // landscape graph IS the evidence the install worked.)
      { type: "say",
        text: "All set — **ITSM is live**. Your IT landscape stays on the right.",
        pause: 300 },

      // Cockpit handoff — give Sarah an explicit, in-flow doorway to
      // her control surface. The card is a single-click swap for the
      // right pane (bootstrap reveal → Cockpit) so she can choose
      // when to leave the install confirmation.
      { type: "say",
        text: "Whenever you're ready, here's your **control surface** — open it when you want to see what I'm watching, what's pending your sign-off, and where the org stands today.",
        pause: 250 },

      { type: "link-card",
        title: "The Cockpit",
        sub: "Your day-1 control surface · agents, signals & sign-offs",
        icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
        url:  "https://itsm.salesforce.com/cockpit",
        page: "cockpit",
        pause: 200 },

      // End the chapter on the Cockpit handoff. The earlier Slack
      // company-wide reveal beat used to live here; it's been pulled
      // so install confirmation → control-surface handoff is the
      // entire arc.
      { type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
