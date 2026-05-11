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
            <div class="bs-agents-grid" id="bsAgentsGrid"></div>
            <div class="bs-card__caption">Incident, change, asset, identity, knowledge — and 45 more.</div>
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

          <!-- Shared tooltip + Inspector drawer. Single instance,
               every phase's interactive nodes feed into them. -->
          <div class="bs-tooltip" id="bsTooltip" role="tooltip" aria-hidden="true"></div>

          <aside class="bs-inspector" id="bsInspector" aria-hidden="true" tabindex="-1"
                 aria-labelledby="bsInspectorTitle">
            <header class="bs-inspector__head">
              <div class="bs-inspector__eyebrow" id="bsInspectorEyebrow">Detail</div>
              <h3 class="bs-inspector__title" id="bsInspectorTitle">Select a node</h3>
              <button type="button" class="bs-inspector__close" id="bsInspectorClose"
                      aria-label="Close detail panel">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 3l10 10M13 3 3 13"/>
                </svg>
              </button>
            </header>
            <div class="bs-inspector__body" id="bsInspectorBody"></div>
          </aside>
        </div>
      `;

      // -------------------------------------------------------------
      // Tooltip + Inspector — single shared instances. The tooltip
      // follows the cursor / focused element with a one-liner; the
      // Inspector drawer slides up from the bottom on click for the
      // full record. Keeping them shared (rather than per-phase)
      // means consistent behavior + only one set of listeners.
      // -------------------------------------------------------------
      const bsRoot       = panel.querySelector(".bootstrap");
      const tooltipEl    = panel.querySelector("#bsTooltip");
      const inspectorEl  = panel.querySelector("#bsInspector");
      const inspBodyEl   = panel.querySelector("#bsInspectorBody");
      const inspTitleEl  = panel.querySelector("#bsInspectorTitle");
      const inspEyebEl   = panel.querySelector("#bsInspectorEyebrow");
      const inspCloseBtn = panel.querySelector("#bsInspectorClose");
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
        // Move focus into the drawer for keyboard users.
        requestAnimationFrame(() => inspectorEl.focus());
        hideTooltip();
      }
      function closeInspector() {
        inspectorEl.dataset.show = "0";
        inspectorEl.setAttribute("aria-hidden", "true");
        if (lastFocus && typeof lastFocus.focus === "function") {
          requestAnimationFrame(() => lastFocus.focus());
        }
      }
      inspCloseBtn.addEventListener("click", closeInspector);
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

      // ---- Build the agent grid (52 specialized agents, lit on phase 1) ----
      const agentsGrid = panel.querySelector("#bsAgentsGrid");
      AGENT_ROLES.forEach((role, i) => {
        const profile = getAgentProfile(role);
        const dot = document.createElement("div");
        dot.className = "bs-agent";
        dot.style.setProperty("--i", i);
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
        agentsGrid.appendChild(dot);
      });

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
    }
  };
  Object.assign(window.PAGES = window.PAGES || {}, pages);

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
    intentKeywords: ["admin", "sarah", "setup", "install", "itsm", "cmdb", "splunk"],
    endline: "Day 1 is over. The org is calmer — every employee just met Jarvis in Slack.",

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
      titleLead: "Build by describing",
      titleTail: "your vision...",
      cta: "Install ITSM",
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

      // ----- Day-1 Slack reveal — sample-first, single linear path.
      //       Old flow offered "Send" as the primary CTA before Sarah
      //       had even seen the message; for a 12,403-person blast,
      //       always-show-sample-first is the safer default.
      { type: "say",
        text: "**One last thing, Sarah.** Let me introduce myself to the company in Slack. Here's the sample I'll personalise per employee:",
        pause: 250 },

      { type: "slack-thread",
        channel: "DM · jarvis",
        meta: "Personalized · just now",
        messages: [
          {
            from: "Jarvis", bot: true, fromColor: "var(--persona-cto)",
            text:
              "Hi Alex 👋 — I'm Jarvis, your new IT partner.\n" +
              "I noticed your **laptop battery has dropped to 64% capacity** — I've ordered a replacement and shipped it to you in Bengaluru. Should arrive Wed.\n" +
              "Need anything? Just message me here. No tickets, no forms."
          }
        ]
      },

      { type: "ask",
        text: "Send to all **12,403 employees**?",
        choices: [
          { label: "Send the reveal", value: "send", primary: true, goto: "do-reveal" },
          { label: "Hold off", value: "hold", goto: "hold-reveal" }
        ]
      },

      { id: "hold-reveal", type: "say",
        text: "Holding the reveal. You can trigger it any time from **Control Tower → Communications**. Day 1 ends quietly — I'll keep watching for anomalies in the background." },
      { type: "goto", to: "wrap" },

      { id: "do-reveal", type: "progress",
        text: "Personalising 12,403 messages with employee context",
        duration: 2600, doneText: "Reveal sent" },

      // Closing assurance lives at the END now (was previously buried
      // mid-flow before the Slack reveal, which felt like Jarvis was
      // closing down and then re-opening the conversation).
      { type: "say",
        text: "**Done.** Every employee just met me. I'll keep watching for anomalies in the background — go grab a coffee, Sarah." },

      { id: "wrap", type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
