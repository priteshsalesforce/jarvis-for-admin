/* =============================================================
   05-exec-marc.js — Chapter 5: "The Wall Board"
   -------------------------------------------------------------
   Persona: Marc, CEO / Executive (the Salesforce CEO surrogate).
   Beat: 30 days in. Marc opens the Boardroom view and watches
   the company healing in real time. Animated counters,
   AI/Human ratio, top 3 risks averted. Why drill-downs ground
   every number in a real source.
   Side panel: registers `wallboard` page.
   ============================================================= */

(function () {
  // Animated count-up on numeric tile values.
  function animateValue(el, targetText, isCurrency) {
    const target = parseFloat(String(targetText).replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(target)) { el.textContent = targetText; return; }
    const start = performance.now();
    const dur = 1200;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      el.textContent = formatValue(v, targetText, isCurrency);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = formatValue(target, targetText, isCurrency);
    };
    requestAnimationFrame(tick);
  }
  function formatValue(v, sample, isCurrency) {
    if (isCurrency) {
      if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
      if (Math.abs(v) >= 1e3) return "$" + Math.round(v / 1e3) + "K";
      return "$" + Math.round(v).toLocaleString();
    }
    if (sample.includes("%")) return v.toFixed(1) + "%";
    if (sample.includes("min")) return Math.round(v) + " min";
    return Math.round(v).toLocaleString();
  }

  const pages = {
    "wallboard": (panel, ctx) => {
      panel.innerHTML = `
        <div class="wallboard">
          <div class="wallboard__head">
            <h3><span class="dot"></span> Boardroom Wall Board · Day 30</h3>
            <div class="wallboard__time" id="wbClock"></div>
          </div>

          <div class="wallboard__grid">
            <div class="wb-tile">
              <div class="wb-tile__label">Tickets auto-resolved</div>
              <div class="wb-tile__value" data-target="4127" data-kind="num">0</div>
              <div class="wb-tile__delta">▲ 78% of total volume</div>
              <button class="wb-tile__why" title="Why?" aria-label="Why this number?">?</button>
            </div>

            <div class="wb-tile">
              <div class="wb-tile__label">MTTR · today</div>
              <div class="wb-tile__value" data-target="8" data-kind="min">0 min</div>
              <div class="wb-tile__delta wb-tile__delta--down">↓ 78% vs. baseline</div>
              <button class="wb-tile__why" title="Why?" aria-label="Why this number?">?</button>
            </div>

            <div class="wb-tile">
              <div class="wb-tile__label">Cost saved · 30 days</div>
              <div class="wb-tile__value" data-target="$3.24M" data-kind="cur">$0</div>
              <div class="wb-tile__delta">▲ tracking to $39M / year</div>
              <button class="wb-tile__why" title="Why?" aria-label="Why this number?">?</button>
            </div>

            <div class="wb-tile">
              <div class="wb-tile__label">Compliance score</div>
              <div class="wb-tile__value" data-target="98.6%" data-kind="pct">0%</div>
              <div class="wb-tile__delta">▲ from 91.2 baseline</div>
              <button class="wb-tile__why" title="Why?" aria-label="Why this number?">?</button>
            </div>

            <div class="wb-tile wb-tile--span2">
              <div class="wb-tile__label">AI / Human collaboration ratio · last 30 days</div>
              <div class="wb-tile__bar">
                <div class="wb-tile__bar-fill" id="wbBar" style="width: 0%"></div>
                <div class="wb-tile__bar-rest" style="flex: 1;"></div>
              </div>
              <div class="wb-tile__legend">
                <span><strong id="wbAi">0%</strong> AI-resolved</span>
                <span>Human-touch <strong id="wbHu">100%</strong></span>
              </div>
              <button class="wb-tile__why" title="Why?" aria-label="Why this number?">?</button>
            </div>
          </div>

          <div class="wb-risks">
            <div class="wb-risks__title">Top risks averted · last 7 days</div>
            <div class="wb-risks__row">
              <span class="wb-risks__pill">Averted</span>
              <span class="wb-risks__txt">Stripe-EU 502 storm · 4,127 EU customers protected · $84K saved</span>
              <span class="wb-risks__when">Day 23 · 14:42 IST</span>
            </div>
            <div class="wb-risks__row">
              <span class="wb-risks__pill">Averted</span>
              <span class="wb-risks__txt">Shadow-IT data exposure · Marketing's AI tool sealed before exfil</span>
              <span class="wb-risks__when">Day 19 · 09:11 IST</span>
            </div>
            <div class="wb-risks__row">
              <span class="wb-risks__pill">Averted</span>
              <span class="wb-risks__txt">SSO regression in CMK rotation · staged rollout caught it in canary</span>
              <span class="wb-risks__when">Day 14 · 02:08 IST</span>
            </div>
          </div>
        </div>
      `;

      // Live clock
      const $clock = panel.querySelector("#wbClock");
      const updateClock = () => {
        const d = new Date();
        $clock.textContent =
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
          " · live";
      };
      updateClock();
      const clockTimer = setInterval(updateClock, 30000);

      // Animate values
      panel.querySelectorAll(".wb-tile__value").forEach((el) => {
        const target = el.dataset.target;
        const kind = el.dataset.kind;
        animateValue(el, target, kind === "cur");
      });

      // AI/Human bar
      requestAnimationFrame(() => {
        panel.querySelector("#wbBar").style.width = "78%";
        const start = performance.now();
        const dur = 1200;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          panel.querySelector("#wbAi").textContent = (78 * eased).toFixed(1) + "%";
          panel.querySelector("#wbHu").textContent = (100 - 78 * eased).toFixed(1) + "%";
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      // "Why" drill-downs — open a tiny inline disclosure under the tile
      panel.querySelectorAll(".wb-tile__why").forEach((btn, i) => {
        const reasons = [
          "Tickets auto-resolved by L0/L1 agents (password resets, access requests, hardware swaps). Source: ITSM ticket ledger, last 30 days.",
          "Median time-to-repair across SEV-1/2/3 incidents. Baseline = pre-Jarvis 30-day median. Source: Splunk + Mule Agent Fabric incident timeline.",
          "Sum of: avoided incident cost ($1.4M) + recovered SaaS spend ($1.4M) + compute optimisation ($440K). Net of Jarvis license. Source: finance reconciliation.",
          "Compliance score = pass rate across 2,140 controls (SOC 2 + HIPAA + internal). Baseline from Day 0 audit. Source: trust ledger.",
          "Ratio of incidents fully resolved by an agent (no human touch) vs. those that needed Approve / Modify / Reject. Source: agent invocation log."
        ];
        btn.addEventListener("click", () => {
          const tile = btn.closest(".wb-tile");
          let existing = tile.querySelector(".source");
          if (existing) { existing.remove(); return; }
          const det = document.createElement("details");
          det.className = "source";
          det.open = true;
          det.innerHTML = `
            <summary><span>Why?</span></summary>
            <div class="source__body">${reasons[i] || "Source recorded in trust ledger."}</div>
          `;
          tile.appendChild(det);
        });
      });

      // Cleanup
      const observer = new MutationObserver(() => {
        if (!document.body.contains(panel.querySelector(".wallboard"))) {
          clearInterval(clockTimer);
          observer.disconnect();
        }
      });
      observer.observe(panel, { childList: true });
    }
  };
  Object.assign(window.PAGES = window.PAGES || {}, pages);

  // ----- Chapter registration -----------------------------------
  const chapter = {
    id: "exec-marc",
    title: "The Wall Board",
    blurb: "Day 30. Marc opens the Boardroom view and watches the company heal in real time.",
    persona: {
      name: "Marc",
      role: "CEO",
      avatarText: "M",
      accent: "var(--persona-exec)"
    },
    intentKeywords: ["exec", "executive", "marc", "ceo", "wall board", "boardroom", "roi", "metrics"],
    endline: "That's the pitch. Five chapters, one ontology, an autonomous IT future on Salesforce.",

    suggestedQuestions: [
      "Where do these numbers come from?",
      "How do we measure ROI?",
      "Who has access to this view?",
      "How is this different from a normal dashboard?"
    ],

    faqs: [
      {
        match: /where.*come|number|source|how.*calculate/i,
        answer:
          "Every tile has a **Why?** button — click it to see the formula and the data source. All numbers are grounded in **the trust ledger**: every ticket auto-resolved, every dollar saved, every compliance check pass — auditable, reproducible, exportable.",
        source: "Click any '?' on a tile to see its grounding."
      },
      {
        match: /roi|measure|payback|business case/i,
        answer:
          "ROI = (avoided incident cost + recovered SaaS spend + compute optimisation) − Jarvis license. **Day 30 net: $3.24M saved.** Tracking to **~$39M / year** at this customer's scale (12,403 employees)."
      },
      {
        match: /custom kpi|custom metric|add metric|configure/i,
        answer:
          "Yes — Wall Board tiles are user-defined. You author tiles via natural language (\"show me **escalations to legal per quarter**\") and Jarvis writes the SOQL/SQL/SAQL behind it. Every tile inherits the same Why? source pattern."
      },
      {
        match: /access|who.*see|permissions|view/i,
        answer:
          "Three default views: **Executive** (this one — board metrics), **LOB VP** (drill-down by team), **Supervisor** (operational kanban). Each view inherits the org's existing role permissions; no new auth model."
      },
      {
        match: /different|normal|tableau|salesforce dashboard|why this/i,
        answer:
          "Normal dashboards report. **The Wall Board explains.** Every number is causally connected: click MTTR → see the incidents that drove it. Click cost-saved → see the line items. The dashboard is a **graph traversal**, not a static query."
      }
    ],

    story: [
      { type: "say", text: "Welcome, **Marc**. It's been **30 days** since you signed off on Jarvis. Let me show you what changed.", pause: 200 },

      { type: "browser", url: "https://itsm.salesforce.com/boardroom", page: "wallboard" },

      { type: "say", text: "**Top-line:** **78% of all tickets** were resolved without a human touch. **MTTR is down 78%.** And we've saved **$3.24M** — exactly what I projected for Vikram on Day 0.", pause: 200 },
      { type: "say", text: "But the number that should matter to you is **the AI / Human ratio**. Look at the bar." },

      { type: "metric-board",
        title: "Day 30 — at a glance",
        metrics: [
          { label: "Auto-resolved",  value: 4127, delta: "▲ 78% of all tickets" },
          { label: "MTTR",           value: "8 min",  delta: "↓ from 36 min", hint: "Pre-Jarvis baseline" },
          { label: "Cost saved",     value: "$3.24M", delta: "▲ tracking to $39M / yr" },
          { label: "Compliance",     value: "98.6%",  delta: "▲ from 91.2", hint: "2,140 controls scored" }
        ]
      },

      { type: "ask",
        text: "Want me to drill into the **causal chain** behind the cost-saved number?",
        choices: [
          { label: "Show the chain", value: "drill", primary: true, goto: "drill" },
          { label: "Skip — I trust it", value: "trust", goto: "trust" }
        ]
      },

      { id: "drill", type: "say",
        text: "**$3.24M = $1.4M (incidents averted) + $1.4M (SaaS spend recovered) + $440K (compute optimisation).** Each line traces back to specific events in the trust ledger. Click **Why?** on the cost tile in the panel to see the breakdown." },
      { type: "goto", to: "next" },

      { id: "trust", type: "say",
        text: "Every tile carries a **Why?** affordance — your CFO can pull the entire derivation chain whenever they want." },

      { id: "next", type: "say", text: "**The Top Risks Averted** panel below the tiles tells the other story — the things that **didn't happen** because Jarvis caught them. The Stripe-EU storm. The marketing data leak. The CMK rotation regression." },

      { type: "say", text: "**That's the pitch, Marc.** An autonomous IT future you can deploy on Salesforce. **What would you like to ship first?**" },

      { type: "ask",
        text: "Pick one to drive next:",
        choices: [
          { label: "Ship the CTO Phase-0 scan to GA", value: "phase0", primary: true, goto: "ship" },
          { label: "Pilot with one LOB",              value: "pilot",  goto: "ship" },
          { label: "Both, in parallel",               value: "both",   goto: "ship" }
        ]
      },

      { id: "ship", type: "progress", text: "Lining up the GA + pilot teams",
                                      duration: 1800, doneText: "Slack channels created · #jarvis-ga + #jarvis-pilot" },

      { type: "say", text: "**Done.** Calendar holds sent to your team. Madhuri has the launch content, Tanmay has the demo script, Ramprasadh has the architecture. **Welcome to the Year of Truth, Marc.**" },

      { type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
