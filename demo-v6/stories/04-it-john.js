/* =============================================================
   04-it-john.js — Chapter 4: "The Lens"
   -------------------------------------------------------------
   Persona: John Mathew, IT Manager at IndiaFirst Bank.

   John runs a fleet of digital agents that handle the bank's
   day-to-day IT work — incidents, customer cases, customer-facing
   workflows (loan applications, KYC re-runs), and change-management
   freezes. The Lens is his control surface: a single feed of
   every work item the agents are handling end-to-end.

   The chapter:
     1. Boot directly into the Lens (full canvas, chat collapsed).
     2. ~3.5s after the page paints, a new WORKFLOW row slides in
        at the top — a fresh home-loan application from Rohan
        Sharma. The row pulses gently with a "New" pip so John
        notices it without being yelled at.
     3. John clicks the row → the Work Item detail page mounts
        in the same panel (breadcrumb back to Lens).
     4. The detail page plays the agent orchestration:
          KYC Verification Agent → CIBIL Score Agent →
          Account Verification Agent → Loan Underwriting Agent →
          Sanction Letter Agent.
        Each step renders as a row in a vertical timeline with
        a busy spinner that resolves into a green check + result.
     5. Once Sanction Letter Agent completes, a Sanction Letter
        card appears with two CTAs: "Email to Rohan" and
        "Download PDF". Either one resolves into a confirmation
        state on the same card so John gets immediate feedback.

   This file registers TWO page factories on `window.PAGES` —
   the engine in app.js mounts them via openBrowser:
     · lens               — the work-items feed
     · workitem-detail    — the orchestration timeline

   The factories are intentionally self-contained: they own
   their own DOM, listeners, and animation timers, and use
   inline styles only where a one-off layout decision would be
   noise in the global stylesheet. All shared shapes (rows,
   chips, breadcrumbs, timeline) are styled in `styles.css`
   under the `.lens-*`, `.witm-*`, and `.agent-step` namespaces
   so theming + dark mode just work.
   ============================================================= */

(function () {
  // -------------------------------------------------------------
  // Tiny utilities — local helpers so the factory doesn't depend
  // on the IIFE-scoped helpers inside app.js.
  // -------------------------------------------------------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const md = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // -------------------------------------------------------------
  // Seed data — the rows John sees when Lens first paints.
  //
  // Each row carries the work-type ("kind"), the public id, the
  // human-readable title, a short sub line, the resolution text
  // shown in the right column, and the "ageing" indicator on the
  // left chip (so the eye can sweep INC / CASE / WFLW / CHG at a
  // glance). The "agents" tag tells the Lens which fleet owned
  // the work — this is the IT-Manager's signal that the work is
  // running on his digital agents (vs. a human queue).
  //
  // The list is a representative cross-section of the bank's
  // active IT graph: 1 active P2 incident, 1 vendor-handed-off
  // P3, 1 auto-closed customer case, and a row of CHG items
  // held against the Saturday change-freeze lane. This mirrors
  // what John would actually be looking at on a Thursday evening.
  // -------------------------------------------------------------
  const SEED_ROWS = [
    {
      id:    "INC-44318",
      kind:  "INC",
      title: "SAP S/4HANA \u00b7 ERP DB lock contention",
      sub:   "P2 \u00b7 vendor case open",
      res:   { state: "active", text: "Active \u00b7 Manufacturing IT engaged" },
      agents: ["DiagnosticsAgent", "VendorRouterAgent"],
    },
    {
      id:    "INC-44219",
      kind:  "INC",
      title: "AWS NLB regional latency",
      sub:   "P3 \u00b7 vendor handed off",
      res:   { state: "resolved", text: "Resolved \u00b7 vendor handed off" },
      agents: ["MonitoringAgent", "VendorRouterAgent"],
    },
    {
      id:    "CASE-44102",
      kind:  "CASE",
      title: "Laptop performance \u2014 Zoom plugin",
      sub:   "Resolved \u00b7 auto-closed",
      res:   { state: "resolved", text: "Resolved \u00b7 auto-closed in customer voice" },
      agents: ["EndpointAgent"],
    },
    {
      id:    "CHG-9921",
      kind:  "CHG",
      title: "checkout-api \u00b7 feature flag rollout",
      sub:   "Held against freeze lane",
      res:   { state: "held", text: "Held \u00b7 against Saturday freeze lane" },
      agents: ["ChangeAgent"],
    },
    {
      id:    "CHG-9921",
      kind:  "CHG",
      title: "checkout-api \u00b7 feature flag rollout",
      sub:   "Held against freeze lane",
      res:   { state: "held", text: "Held \u00b7 against Saturday freeze lane" },
      agents: ["ChangeAgent"],
    },
    {
      id:    "CHG-9921",
      kind:  "CHG",
      title: "checkout-api \u00b7 feature flag rollout",
      sub:   "Held against freeze lane",
      res:   { state: "held", text: "Held \u00b7 against Saturday freeze lane" },
      agents: ["ChangeAgent"],
    },
    {
      id:    "CHG-9921",
      kind:  "CHG",
      title: "checkout-api \u00b7 feature flag rollout",
      sub:   "Held against freeze lane",
      res:   { state: "held", text: "Held \u00b7 against Saturday freeze lane" },
      agents: ["ChangeAgent"],
    },
  ];

  // The "new arrival" — a fresh home-loan workflow for Rohan.
  // Pre-populated so the click-through can render a coherent
  // detail page; the Lens treats this as the row that just
  // landed in the feed.
  const NEW_ROW = {
    id:    "WF-44312",
    kind:  "WFLW",
    title: "loan S/4-api \u00b7 feature home loan",
    sub:   "New \u00b7 Loan application",
    res:   { state: "new", text: "New \u00b7 Loan application" },
    agents: [
      "OrchestratorAgent",
      "KycVerificationAgent",
      "CibilScoreAgent",
      "AccountVerificationAgent",
      "UnderwritingAgent",
      "SanctionLetterAgent",
    ],
    customer: {
      name: "Rohan Sharma",
      pan:  "AVQPS3421K",
      email: "rohan.sharma@gmail.com",
      phone: "+91 98201 11234",
    },
    loan: {
      product: "Home Loan \u00b7 Floating",
      amount: "\u20b9 78,00,000",
      tenure: "20 years",
      property: "Hiranandani Estate, Thane",
    },
  };

  // Tabs at the top of the Lens. The first tab ("All") doubles
  // as the implicit landing tab; counts come from the seed +
  // the new row when present, but they're cosmetic — the demo
  // doesn't filter. Two label sets are supported: technical
  // (Incidents / Cases / Workflows / Changes) which mirrors
  // the canonical work-item taxonomy John already lives in.
  const LENS_TABS = [
    { id: "all",       label: "All",         count: 2628 },
    { id: "incidents", label: "Incidents",   count: 2098 },
    { id: "cases",     label: "Cases",       count:  120 },
    { id: "workflows", label: "Workflows",   count:  121 },
    { id: "changes",   label: "Changes",     count:    1 },
  ];

  // -------------------------------------------------------------
  // Page-scoped state. Held in module scope so the lens factory
  // can survive an unmount/remount (e.g. user navigates away
  // and comes back) and the new-row arrival doesn't replay.
  // -------------------------------------------------------------
  const STATE = {
    rows: SEED_ROWS.slice(),       // current list (may have NEW_ROW prepended)
    newRowArrived: false,          // has the demo arrival fired yet?
    newRowSeen: false,             // has John clicked it yet?
    activeTab: "all",
    arrivalTimer: null,            // setTimeout handle for the arrival
    // Active panel reference — set on every mount so internal
    // navigation (lens row click → detail) can write into the
    // same node without a global re-router.
    panel: null,
  };

  // -------------------------------------------------------------
  // Kind chip — "INC" / "CASE" / "WFLW" / "CHG" pill on the left
  // of every row. Tinted by kind so the eye groups by type.
  // -------------------------------------------------------------
  function kindChipHTML(kind) {
    return `<span class="lens-kind lens-kind--${esc(kind.toLowerCase())}">${esc(kind)}</span>`;
  }

  // -------------------------------------------------------------
  // Resolution column — "Active · …" / "Resolved · …" / "Held · …".
  // The leading dot is a tiny pulse for active-state rows and a
  // muted glyph for held / resolved rows.
  // -------------------------------------------------------------
  function resolutionHTML(res) {
    const state = (res && res.state) || "resolved";
    const text  = (res && res.text)  || "";
    return `
      <span class="lens-res lens-res--${esc(state)}">
        <span class="lens-res__pip" aria-hidden="true"></span>
        <span class="lens-res__text">${esc(text)}</span>
      </span>
    `;
  }

  // -------------------------------------------------------------
  // Single row — the work-item line that's the spine of the
  // Lens table. The whole row is a button so it's keyboard +
  // assistive-tech reachable without extra plumbing. The "isNew"
  // flag adds a subtle pulse + a "NEW" pip on the left chip so
  // John doesn't miss the arrival.
  // -------------------------------------------------------------
  function rowHTML(row, { isNew = false } = {}) {
    const newClass = isNew ? " lens-row--new" : "";
    return `
      <button type="button"
              class="lens-row${newClass}"
              data-row-id="${esc(row.id)}"
              data-row-kind="${esc(row.kind)}"
              aria-label="Open work item ${esc(row.id)} \u2014 ${esc(row.title)}">
        <span class="lens-row__chip">${kindChipHTML(row.kind)}</span>
        <span class="lens-row__id">${esc(row.id)}</span>
        <span class="lens-row__main">
          <span class="lens-row__title">${esc(row.title)}</span>
          <span class="lens-row__sub">${esc(row.sub)}</span>
        </span>
        <span class="lens-row__res">${resolutionHTML(row.res)}</span>
        ${isNew ? `<span class="lens-row__newdot" aria-label="Just arrived">New</span>` : ""}
      </button>
    `;
  }

  // -------------------------------------------------------------
  // Tabs — segmented filter row above the table. The active tab
  // is purely cosmetic in the demo (we don't actually filter the
  // list) — it's the affordance pattern John recognises from
  // every other Salesforce-shaped surface.
  // -------------------------------------------------------------
  function tabsHTML() {
    return LENS_TABS.map((t) => {
      const active = STATE.activeTab === t.id ? " is-active" : "";
      return `
        <button type="button" class="lens-tab${active}" data-tab="${esc(t.id)}"
                aria-pressed="${STATE.activeTab === t.id}">
          <span class="lens-tab__label">${esc(t.label)}</span>
          <span class="lens-tab__count">${esc(t.count)}</span>
        </button>
      `;
    }).join("");
  }

  // -------------------------------------------------------------
  // Lens — top-level page factory.
  //
  // Mounts a header (eyebrow + title + sub), a tab strip, and
  // a card listing every work item. After ~3.5s a "new" workflow
  // row slides in at the top; until John clicks it, it pulses
  // gently and carries a "New" pip. Once clicked, the panel
  // swaps to the work-item detail factory.
  // -------------------------------------------------------------
  function renderLens(panel) {
    STATE.panel = panel;

    // If the new row has already arrived (e.g. user toggled away
    // and back), keep it in the list so the navigation history
    // matches what they last saw.
    const rows = STATE.newRowArrived && !STATE.rows.some((r) => r.id === NEW_ROW.id)
      ? [NEW_ROW, ...STATE.rows]
      : STATE.rows;

    panel.innerHTML = `
      <section class="lens-page" aria-label="The Lens">
        <header class="lens-head">
          <h1 class="lens-head__title">The Lens</h1>
          <p class="lens-head__sub">See all your work items on this page.</p>
        </header>

        <div class="lens-tabs" role="tablist" aria-label="Work-item filters">
          ${tabsHTML()}
        </div>

        <div class="lens-card" role="region" aria-label="Work items">
          <div class="lens-list" id="lensList">
            ${rows.map((r) => rowHTML(r, { isNew: r.id === NEW_ROW.id && !STATE.newRowSeen })).join("")}
          </div>
        </div>
      </section>
    `;

    // Tab clicks — visual-only filter. Delegated on the strip so
    // re-rendering the inner buttons (after a click) doesn't lose
    // the listener — single source of truth, no rebind dance.
    const tabsHost = panel.querySelector(".lens-tabs");
    tabsHost.addEventListener("click", (e) => {
      const btn = e.target.closest(".lens-tab");
      if (!btn) return;
      STATE.activeTab = btn.getAttribute("data-tab");
      tabsHost.innerHTML = tabsHTML();
    });

    // Row clicks — every row opens the work-item detail page.
    // For the demo, only the new workflow row routes to the rich
    // detail view (the others land on a soft "coming soon" toast);
    // this keeps the demo on rails without disabling the rest of
    // the table.
    panel.querySelector("#lensList").addEventListener("click", (e) => {
      const row = e.target.closest(".lens-row");
      if (!row) return;
      const id = row.getAttribute("data-row-id");
      if (id === NEW_ROW.id) {
        STATE.newRowSeen = true;
        renderDetail(panel, NEW_ROW);
      } else {
        // Other rows acknowledge the click without navigating.
        if (typeof window.directorNote === "function") {
          window.directorNote({
            title: "Coming soon",
            text:  `${id} \u2014 detail view for this work-item type is on the roadmap.`,
            sub:   "The Lens currently drills into the home-loan workflow only for the demo.",
            autoDismiss: 3200,
          });
        }
      }
    });

    // Schedule the new-row arrival the first time Lens mounts.
    // If the user navigates away and back before it fires, we
    // let the timer run on the previous mount (it's harmless —
    // it'll target a stale panel and bail) and skip rescheduling
    // here so the row doesn't double-arrive.
    if (!STATE.newRowArrived && !STATE.arrivalTimer) {
      STATE.arrivalTimer = setTimeout(() => {
        STATE.arrivalTimer = null;
        scheduleNewRowArrival();
      }, 3200);
    }
  }

  // -------------------------------------------------------------
  // New-row arrival — the loan workflow lands at the top of the
  // list with a soft slide-in + a glow that fades after 6s. The
  // row stays in place (with the "New" pip) until John clicks it.
  // -------------------------------------------------------------
  function scheduleNewRowArrival() {
    const panel = STATE.panel;
    if (!panel) return;
    const list = panel.querySelector("#lensList");
    if (!list) return;

    // Already added (defensive — idempotent): skip the splice but
    // still drop the toast so the demo always has the cue.
    if (!STATE.newRowArrived) {
      STATE.newRowArrived = true;
      STATE.rows = [NEW_ROW, ...STATE.rows];
      list.insertAdjacentHTML("afterbegin", rowHTML(NEW_ROW, { isNew: true }));
      const arrived = list.firstElementChild;
      if (arrived) {
        arrived.classList.add("lens-row--arriving");
        // Wash off the slide-in class after the animation settles
        // so subsequent renders don't re-trigger it.
        setTimeout(() => arrived?.classList.remove("lens-row--arriving"), 900);
      }
    }

    // Quiet director's note — John might be looking elsewhere
    // when the row lands (sidebar, profile, etc.). The note ties
    // the moment back to the visible row.
    if (typeof window.directorNote === "function") {
      window.directorNote({
        title: "New work item",
        text:  "Loan application from Rohan Sharma \u2014 home loan, \u20b9 78L.",
        sub:   "Routed to the Loan Workflow agent. Open from the top of Lens.",
        autoDismiss: 4400,
      });
    }
  }

  // -------------------------------------------------------------
  // Work-item detail page — mounts the orchestration timeline
  // for the loan application. Owns its own DOM + lifecycle
  // (cancellable when the user clicks the breadcrumb back to Lens).
  // -------------------------------------------------------------
  function renderDetail(panel, row) {
    STATE.panel = panel;

    // Run-token guards an in-flight orchestration: if the user
    // hops back to Lens mid-animation, we don't want stale step
    // resolutions to keep writing into a torn-down DOM.
    const myToken = (renderDetail._token = (renderDetail._token || 0) + 1);
    const isStale = () => myToken !== renderDetail._token;

    panel.innerHTML = `
      <section class="witm-page" aria-label="${esc(row.id)} detail">
        <header class="witm-head">
          <button type="button"
                  class="v4-btn v4-btn--ghost witm-back"
                  data-back="lens"
                  aria-label="Back to Lens">
            <span aria-hidden="true">\u2190</span> Lens
          </button>

          <div class="witm-title-row">
            <h1 class="witm-title">${esc(row.title)}</h1>
            <span class="witm-id">${esc(row.id)}</span>
            <span class="witm-status" id="witmStatus">
              <span class="witm-status__dot witm-status__dot--new" aria-hidden="true"></span>
              <span class="witm-status__label">New</span>
              <span class="witm-status__sub">\u00b7 agents working</span>
            </span>
          </div>
        </header>

        <nav class="witm-tabs" role="tablist" aria-label="Sections">
          <button type="button" class="witm-tab is-active" role="tab"
                  aria-selected="true" data-tab="resolution">Resolution</button>
          <button type="button" class="witm-tab" role="tab"
                  aria-selected="false" data-tab="details">Details</button>
        </nav>

        <div class="witm-body" id="witmBody">
          <!-- Resolution tab content lives here. The orchestration
               timeline is appended row-by-row by playOrchestration. -->
          <div class="witm-pane" id="paneResolution" role="tabpanel">
            <div class="witm-startedAt">
              ${esc(formatDateLine(new Date()))}
            </div>
            <div class="agent-timeline" id="agentTimeline" aria-live="polite"></div>
          </div>
        </div>
      </section>
    `;

    // Breadcrumb back-to-Lens click. Both the "Lens" and
    // "Workflows" crumb route back to the lens; the bank's IT
    // team treats the Workflows tab on Lens as the cohort view.
    panel.querySelectorAll("[data-back='lens']").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderDetail._token += 1;     // cancel any in-flight steps
        renderLens(panel);
      });
    });

    // Tab switching — Resolution is the live timeline, Details
    // shows the structured summary (customer + loan facts).
    panel.querySelectorAll(".witm-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabId = tab.getAttribute("data-tab");
        panel.querySelectorAll(".witm-tab").forEach((t) => {
          const active = t === tab;
          t.classList.toggle("is-active", active);
          t.setAttribute("aria-selected", String(active));
        });
        renderDetailPane(panel, row, tabId, { isStale });
      });
    });

    // Kick the orchestration off after the page has settled.
    // The opening "Order received" beat is rendered immediately
    // so the timeline isn't empty for a heartbeat.
    playOrchestration(panel, row, { isStale });
  }

  // Switches the body of the detail page between Resolution
  // and Details. Resolution is the live agent timeline (already
  // rendered when the page first mounts); Details is the
  // structured fact card.
  function renderDetailPane(panel, row, tabId, { isStale }) {
    const body = panel.querySelector("#witmBody");
    if (!body) return;

    if (tabId === "details") {
      body.innerHTML = `
        <div class="witm-pane witm-pane--details" role="tabpanel">
          <div class="witm-facts">
            <section class="witm-factbox">
              <h3 class="witm-factbox__title">Customer</h3>
              <dl class="witm-fact-list">
                <div><dt>Name</dt><dd>${esc(row.customer.name)}</dd></div>
                <div><dt>PAN</dt><dd>${esc(row.customer.pan)}</dd></div>
                <div><dt>Email</dt><dd>${esc(row.customer.email)}</dd></div>
                <div><dt>Phone</dt><dd>${esc(row.customer.phone)}</dd></div>
              </dl>
            </section>
            <section class="witm-factbox">
              <h3 class="witm-factbox__title">Loan</h3>
              <dl class="witm-fact-list">
                <div><dt>Product</dt><dd>${esc(row.loan.product)}</dd></div>
                <div><dt>Amount</dt><dd>${esc(row.loan.amount)}</dd></div>
                <div><dt>Tenure</dt><dd>${esc(row.loan.tenure)}</dd></div>
                <div><dt>Property</dt><dd>${esc(row.loan.property)}</dd></div>
              </dl>
            </section>
            <section class="witm-factbox witm-factbox--full">
              <h3 class="witm-factbox__title">Agents on this workflow</h3>
              <div class="witm-agentchips">
                ${row.agents.map((a) =>
                  `<span class="witm-agentchip">${esc(a)}</span>`
                ).join("")}
              </div>
            </section>
          </div>
        </div>
      `;
    } else {
      // Restore the resolution pane. We don't replay the timeline
      // (the steps are already done if we got back here), but
      // we mark the page as "Resolved · sanctioned" if the
      // orchestration finished — otherwise the live timer keeps
      // running on the original timeline node mounted earlier.
      // Easiest path: leave the existing pane in place. If it
      // got blown away by a previous tab switch, rebuild it.
      if (!body.querySelector("#agentTimeline")) {
        body.innerHTML = `
          <div class="witm-pane" id="paneResolution" role="tabpanel">
            <div class="witm-startedAt">
              ${esc(formatDateLine(new Date()))}
            </div>
            <div class="agent-timeline" id="agentTimeline"></div>
          </div>
        `;
        playOrchestration(panel, row, { isStale });
      }
    }
  }

  // -------------------------------------------------------------
  // Orchestration timeline — KYC → CIBIL → Account → Underwriting
  // → Sanction Letter. Each step is rendered as a row that opens
  // in a "busy" state (spinner + neutral text), then resolves
  // after `step.duration` to a green check + the result line.
  //
  // After the final step resolves, we drop a Sanction Letter
  // card with two CTAs (Email Rohan / Download PDF).
  // -------------------------------------------------------------
  const STEPS = [
    {
      id: "orchestrator",
      agent: "OrchestratorAgent",
      title: "Workflow received",
      busy:  "Routing to specialist agents",
      done:  "Routed to KYC, CIBIL, Account & Underwriting agents in parallel",
      duration: 900,
    },
    {
      id: "kyc",
      agent: "KycVerificationAgent",
      title: "KYC verification",
      busy:  "Validating Aadhaar + PAN with NSDL",
      done:  "PAN AVQPS3421K verified \u00b7 Aadhaar match \u00b7 sanctions clear",
      duration: 1700,
    },
    {
      id: "cibil",
      agent: "CibilScoreAgent",
      title: "CIBIL score check",
      busy:  "Pulling credit report from CIBIL",
      done:  "Score 812 \u00b7 0 missed payments \u00b7 utilisation 18%",
      duration: 1500,
    },
    {
      id: "account",
      agent: "AccountVerificationAgent",
      title: "Account & income verification",
      busy:  "Checking SB balance, deposits, EPF & employer verification",
      done:  "Avg balance \u20b9 8.2L \u00b7 salary \u20b9 2.4L/mo \u00b7 employer Tier-A",
      duration: 1800,
    },
    {
      id: "underwriting",
      agent: "UnderwritingAgent",
      title: "Underwriting & risk decision",
      busy:  "Computing eligibility against loan policy v2.4",
      done:  "Sanctioned \u20b9 78,00,000 @ 8.45% floating \u00b7 EMI \u20b9 67,420/mo \u00b7 LTV 78%",
      duration: 2100,
    },
    {
      id: "sanction",
      agent: "SanctionLetterAgent",
      title: "Sanction letter generated",
      busy:  "Drafting & e-stamping the sanction letter (PDF)",
      done:  "PDF ready \u00b7 IFB-LN-2026-44312-SL.pdf (124 KB)",
      duration: 1700,
      sanctionsLetter: true,
    },
  ];

  async function playOrchestration(panel, row, { isStale }) {
    const tl = panel.querySelector("#agentTimeline");
    if (!tl) return;

    for (let i = 0; i < STEPS.length; i++) {
      if (isStale()) return;
      const step = STEPS[i];
      const stepEl = renderAgentStep(step);
      tl.appendChild(stepEl);
      requestAnimationFrame(() => stepEl.classList.add("agent-step--in"));

      // Let the busy state breathe for a beat so the spinner is
      // visible — even on fast machines.
      await sleep(step.duration);
      if (isStale()) return;

      // Resolve the step into its done state.
      stepEl.classList.add("agent-step--done");
      const status = stepEl.querySelector(".agent-step__status");
      if (status) {
        status.innerHTML = `
          <span class="agent-step__check" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2.6"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 10.5l3.5 3.5L16 6"/>
            </svg>
          </span>
          <span class="agent-step__statusText">Done</span>
        `;
      }
      const text = stepEl.querySelector(".agent-step__text");
      if (text) text.textContent = step.done;

      // After the final step, swap the page status banner from
      // "New · agents working" → "Resolved · sanctioned" and
      // drop the sanction-letter card right under the timeline.
      if (step.sanctionsLetter) {
        markResolved(panel);
        const letter = renderSanctionCard(row);
        tl.appendChild(letter);
        requestAnimationFrame(() => letter.classList.add("sanction-card--in"));

        if (typeof window.directorNote === "function") {
          window.directorNote({
            title: "Loan sanctioned",
            text:  "Sanction letter ready for Rohan Sharma \u2014 \u20b9 78,00,000 @ 8.45%.",
            sub:   "Email it to Rohan or download the PDF from the work item.",
            autoDismiss: 4200,
          });
        }
      }

      // Tiny breather between steps so the eye can register the
      // resolution before the next one kicks off.
      await sleep(220);
    }
  }

  function markResolved(panel) {
    const status = panel.querySelector("#witmStatus");
    if (!status) return;
    status.classList.add("witm-status--ok");
    status.innerHTML = `
      <span class="witm-status__dot witm-status__dot--ok" aria-hidden="true"></span>
      <span class="witm-status__label">Resolved</span>
      <span class="witm-status__sub">\u00b7 sanctioned by UnderwritingAgent</span>
    `;
  }

  // -------------------------------------------------------------
  // Single timeline step — busy state. Resolves in-place to
  // the done state when the orchestration loop calls it.
  // -------------------------------------------------------------
  function renderAgentStep(step) {
    const el = document.createElement("article");
    el.className = "agent-step";
    el.setAttribute("data-step-id", step.id);
    el.innerHTML = `
      <div class="agent-step__rail" aria-hidden="true">
        <span class="agent-step__node">
          <span class="agent-step__spinner"></span>
        </span>
      </div>
      <div class="agent-step__body">
        <div class="agent-step__head">
          <span class="agent-step__agent">${esc(step.agent)}</span>
          <span class="agent-step__title">${esc(step.title)}</span>
          <span class="agent-step__status">
            <span class="agent-step__statusDot" aria-hidden="true"></span>
            <span class="agent-step__statusText">Working</span>
          </span>
        </div>
        <div class="agent-step__text">${esc(step.busy)}</div>
      </div>
    `;
    return el;
  }

  // -------------------------------------------------------------
  // Sanction letter card — appears at the end of the timeline
  // with a tiny PDF preview, the loan summary, and two CTAs.
  // Either CTA resolves the card into a confirmation state on
  // the same surface so John gets immediate feedback.
  // -------------------------------------------------------------
  function renderSanctionCard(row) {
    const card = document.createElement("article");
    card.className = "sanction-card";
    card.setAttribute("aria-label", "Sanction letter");
    card.innerHTML = `
      <div class="sanction-card__rail" aria-hidden="true">
        <span class="sanction-card__node">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
            <path d="M14 3v5h5"/>
            <path d="M9 13h6M9 17h6M9 9h2"/>
          </svg>
        </span>
      </div>
      <div class="sanction-card__body">
        <header class="sanction-card__head">
          <div class="sanction-card__eyebrow">SanctionLetterAgent \u00b7 Document ready</div>
          <h3 class="sanction-card__title">Sanction letter for Rohan Sharma</h3>
          <p class="sanction-card__sub">
            Home loan \u00b7 \u20b9 78,00,000 @ 8.45% floating \u00b7 20-year tenure \u00b7
            EMI \u20b9 67,420/mo. E-stamped, signed by the Branch Credit Officer.
          </p>
        </header>

        <div class="sanction-card__file">
          <span class="sanction-card__file-icon" aria-hidden="true">PDF</span>
          <div class="sanction-card__file-meta">
            <div class="sanction-card__file-name">IFB-LN-2026-44312-SL.pdf</div>
            <div class="sanction-card__file-sub">124 KB \u00b7 4 pages \u00b7 valid till 12 Jun 2026</div>
          </div>
        </div>

        <div class="sanction-card__actions" id="sanctionActions">
          <button type="button" class="sanction-btn sanction-btn--primary"
                  data-action="email">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 5h14v10H3z"/>
              <path d="M3 5l7 6 7-6"/>
            </svg>
            Email to Rohan
          </button>
          <button type="button" class="sanction-btn sanction-btn--secondary"
                  data-action="download">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 3v10"/>
              <path d="M5.5 9.5L10 14l4.5-4.5"/>
              <path d="M4 16h12"/>
            </svg>
            Download PDF
          </button>
        </div>

        <div class="sanction-card__confirm" id="sanctionConfirm" hidden></div>
      </div>
    `;

    // CTA wiring — one shared handler. Each action resolves the
    // card into a confirmation state (on the same surface), and
    // the action buttons are disabled to make it clear the
    // outcome has been recorded. A second action is still possible
    // if John wants both, so we leave the alternate button
    // re-enabled after a beat.
    card.querySelector("#sanctionActions").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      handleSanctionAction(card, row, action);
    });

    return card;
  }

  function handleSanctionAction(card, row, action) {
    const actionsEl = card.querySelector("#sanctionActions");
    const confirmEl = card.querySelector("#sanctionConfirm");
    actionsEl.setAttribute("data-busy", "1");
    [...actionsEl.querySelectorAll("button")].forEach((b) => (b.disabled = true));

    confirmEl.hidden = false;
    confirmEl.innerHTML = `
      <span class="sanction-confirm__spinner" aria-hidden="true"></span>
      <span>${action === "email"
        ? `Composing email to <strong>${esc(row.customer.email)}</strong>\u2026`
        : `Preparing the PDF for download\u2026`}</span>
    `;

    // Simulate the action — short, deterministic.
    setTimeout(() => {
      confirmEl.classList.add("sanction-confirm--ok");
      if (action === "email") {
        confirmEl.innerHTML = `
          <span class="sanction-confirm__check" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="13" height="13" fill="none"
                 stroke="currentColor" stroke-width="2.6"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 10.5l3.5 3.5L16 6"/>
            </svg>
          </span>
          <span>Sent to <strong>${esc(row.customer.email)}</strong> \u00b7 cc: branch-credit@indiafirst.com</span>
        `;
      } else {
        confirmEl.innerHTML = `
          <span class="sanction-confirm__check" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="13" height="13" fill="none"
                 stroke="currentColor" stroke-width="2.6"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 10.5l3.5 3.5L16 6"/>
            </svg>
          </span>
          <span>Downloaded <strong>IFB-LN-2026-44312-SL.pdf</strong> to your machine.</span>
        `;
      }
      // Re-enable the alternate button so John can also do the
      // other action without rerunning the orchestration.
      [...actionsEl.querySelectorAll("button")].forEach((b) => {
        b.disabled = b.getAttribute("data-action") === action;
      });
      actionsEl.removeAttribute("data-busy");

      if (typeof window.directorNote === "function") {
        window.directorNote({
          title: action === "email" ? "Sanction letter emailed" : "Sanction letter downloaded",
          text:  action === "email"
            ? `Sent to ${row.customer.email}.`
            : `IFB-LN-2026-44312-SL.pdf saved to your machine.`,
          autoDismiss: 2800,
        });
      }
    }, 950);
  }

  // -------------------------------------------------------------
  // Format the "started at" line on the detail page (e.g.
  // "14 May 2026 \u00b7 19:42:01"). Local time, 24-hour clock.
  // -------------------------------------------------------------
  function formatDateLine(d) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} \u00b7 ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // -------------------------------------------------------------
  // Register the page factories on window.PAGES BEFORE app.js
  // runs (this script is loaded before app.js in index.html).
  // app.js's WORKSPACE_PAGES Object.entries loop respects existing
  // entries ("story-provided factory wins"), so our richer Lens
  // and detail factories get used instead of the generic
  // workspace-placeholder fallback.
  // -------------------------------------------------------------
  window.PAGES = window.PAGES || {};
  window.PAGES.lens = (panel) => renderLens(panel);
  window.PAGES["workitem-detail"] = (panel) => {
    // Direct deep-link / nav to detail without going through Lens
    // first — render the loan workflow detail page so the deep
    // link still lands somewhere coherent.
    renderDetail(panel, NEW_ROW);
  };

  // -------------------------------------------------------------
  // No CHAPTERS push — v6 doesn't run a chat-driven story.
  // The whole interaction lives in the right-side workspace
  // panel (Lens → detail). The chat thread is dismissed by
  // default (full-canvas Lens) and remains available via the
  // Jarvis tile in the rail for free-text interrupts.
  // -------------------------------------------------------------
})();
