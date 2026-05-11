/* =============================================================
   01-cto-vikram.js — Chapter 1: "The Sale"
   -------------------------------------------------------------
   Persona: Vikram, CTO of "Acme Health" (the prospect).
   Beat: 60-second Phase 0 Neural Scan that reveals invisible
   waste, then the Legacy ↔ Optimized slider, then a Deploy CTA.
   Side panel: registers `constellation` page (CSS-only globe).
   ============================================================= */

(function () {
  // ----- Page factory: Constellation (Phase 0 Neural Scan) ---------
  const pages = {
    "constellation": (panel, ctx) => {
      panel.innerHTML = `
        <div class="constellation" id="ctoMap">
          <div class="constellation__head">
            <span class="dot"></span>
            <h3>Neural scan · acme-health.com</h3>
          </div>

          <div class="constellation__map" id="ctoGlobe">
            <div class="constellation__globe" aria-hidden="true">
              <svg class="constellation__worldmap" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
                <g class="constellation__worldmap-fill">
                  <!-- North America -->
                  <path d="M138 88 L188 78 L238 82 L278 96 L308 122 L322 158 L318 198 L302 232 L282 262 L256 286 L228 292 L202 280 L182 258 L162 226 L146 192 L136 156 L132 120 Z"/>
                  <!-- Greenland -->
                  <path d="M352 72 L392 68 L412 84 L406 116 L386 134 L360 128 L344 108 L346 86 Z"/>
                  <!-- Central America -->
                  <path d="M248 274 L278 286 L290 308 L278 328 L256 332 L240 318 L236 296 Z"/>
                  <!-- Caribbean dots -->
                  <circle cx="305" cy="294" r="3"/>
                  <circle cx="318" cy="298" r="3"/>
                  <!-- South America -->
                  <path d="M296 296 L326 308 L352 326 L368 358 L372 396 L362 434 L342 462 L316 472 L296 460 L286 436 L282 406 L286 372 L292 336 Z"/>
                  <!-- UK & Ireland -->
                  <path d="M438 146 L456 142 L462 158 L450 172 L434 168 L430 156 Z"/>
                  <!-- Europe -->
                  <path d="M462 132 L504 122 L542 126 L568 142 L572 168 L560 188 L536 202 L506 206 L480 200 L466 186 L456 168 L456 148 Z"/>
                  <!-- Scandinavia -->
                  <path d="M500 88 L530 86 L546 102 L542 124 L520 126 L502 116 Z"/>
                  <!-- Russia / Northern Asia -->
                  <path d="M548 92 L620 84 L692 84 L762 90 L824 104 L854 130 L862 156 L854 178 L828 188 L796 182 L750 176 L702 174 L650 174 L600 172 L568 164 L552 144 L544 118 Z"/>
                  <!-- China / Central Asia -->
                  <path d="M640 186 L702 184 L754 196 L784 218 L794 244 L780 268 L758 286 L728 296 L700 294 L676 284 L660 264 L650 240 L644 214 Z"/>
                  <!-- Middle East / Arabia -->
                  <path d="M558 218 L596 220 L616 236 L616 262 L600 282 L574 286 L554 270 L552 240 Z"/>
                  <!-- India -->
                  <path d="M672 240 L712 240 L726 262 L724 286 L708 310 L692 322 L678 306 L672 282 Z"/>
                  <!-- SE Asia / Indonesia -->
                  <path d="M788 296 L818 296 L838 308 L846 328 L834 346 L808 350 L788 340 L778 320 Z"/>
                  <path d="M738 312 L766 310 L770 326 L754 340 L734 334 Z"/>
                  <!-- Japan -->
                  <path d="M858 200 L880 208 L884 230 L872 248 L856 244 L848 224 Z"/>
                  <!-- Philippines -->
                  <circle cx="810" cy="278" r="4"/>
                  <!-- Africa -->
                  <path d="M488 212 L536 216 L572 228 L602 248 L616 278 L614 312 L604 350 L580 386 L554 410 L520 416 L494 404 L476 380 L466 346 L470 306 L478 270 L484 240 Z"/>
                  <!-- Madagascar -->
                  <path d="M620 374 L634 380 L636 406 L626 416 L614 406 L614 386 Z"/>
                  <!-- Australia -->
                  <path d="M780 358 L830 354 L866 366 L880 386 L870 406 L838 416 L800 410 L774 396 L766 376 Z"/>
                  <!-- New Zealand -->
                  <circle cx="906" cy="420" r="4"/>
                  <circle cx="916" cy="432" r="3"/>
                </g>
                <!-- Equator + tropics, subtle reference lines -->
                <g class="constellation__worldmap-grid">
                  <line x1="0" y1="250" x2="1000" y2="250"/>
                </g>
              </svg>
            </div>

            <!-- Pulsing nodes — placed on real geographic hubs -->
            <span class="cnode cnode--ok"   style="left: 16%; top: 42%;"></span> <!-- SF -->
            <span class="cnode cnode--ok"   style="left: 28%; top: 40%;"></span> <!-- NYC -->
            <span class="cnode"             style="left: 34%; top: 70%;"></span> <!-- São Paulo -->
            <span class="cnode cnode--ok"   style="left: 48%; top: 32%;"></span> <!-- London -->
            <span class="cnode"             style="left: 53%; top: 51%;"></span> <!-- Lagos -->
            <span class="cnode cnode--crit" style="left: 70%; top: 56%;" id="ctoBlrNode"></span> <!-- Bengaluru -->
            <span class="cnode cnode--ok"   style="left: 78%; top: 62%;"></span> <!-- Singapore -->
            <span class="cnode cnode--ok"   style="left: 86%; top: 44%;"></span> <!-- Tokyo -->
            <span class="cnode"             style="left: 84%; top: 78%;"></span> <!-- Sydney -->

            <!-- Causal callout pinned near Bengaluru -->
            <div class="constellation__callout" style="left: 44%; top: 30%;">
              <div><strong>Bengaluru hub · ghost latency</strong></div>
              <div>14% of engineering losing 4 hrs/week — VPN handshake retries.</div>
              <div style="margin-top: 6px; color: var(--ink-mute); font-size: 11px;">
                <strong>$1.2M / yr</strong> productivity loss
              </div>
            </div>
          </div>

          <div class="constellation__legend">
            <span><i style="background: var(--accent-ok);"></i> Healthy</span>
            <span><i style="background: var(--accent-warn);"></i> Degraded</span>
            <span><i style="background: #ff5f5f;"></i> Critical</span>
            <span><i style="background: var(--persona-manager);"></i> Optimized</span>
          </div>

          <div class="opt-slider" id="ctoSlider">
            <div class="opt-slider__label">Mode</div>
            <div class="opt-slider__rail" role="button" aria-label="Toggle optimization">
              <div class="opt-slider__thumb" id="ctoThumb">Legacy</div>
            </div>
            <div class="opt-slider__counter" id="ctoCounter">$0 saved / yr</div>
          </div>

          <button class="constellation__cta" id="ctoDeploy">
            Deploy Jarvis Neural Partner
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                 stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
            </svg>
          </button>
        </div>
      `;

      const $map = panel.querySelector("#ctoMap");
      const $thumb = panel.querySelector("#ctoThumb");
      const $rail = panel.querySelector(".opt-slider__rail");
      const $counter = panel.querySelector("#ctoCounter");
      const $deploy = panel.querySelector("#ctoDeploy");

      let optimized = false;
      const target = 3240000; // $3.24M

      function setOptimized(next) {
        optimized = next;
        $map.classList.toggle("is-optimized", optimized);
        $thumb.textContent = optimized ? "Optimized" : "Legacy";
        // Count up / count down
        const start = performance.now();
        const from = optimized ? 0 : target;
        const to   = optimized ? target : 0;
        const dur  = 900;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          const v = Math.round(from + (to - from) * eased);
          $counter.textContent = "$" + v.toLocaleString() + " saved / yr";
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        // Notify story
        ctx.dispatch("cto-optimize", { optimized });
      }

      $rail.addEventListener("click", () => setOptimized(!optimized));

      $deploy.addEventListener("click", () => {
        if ($deploy.disabled) return;
        $deploy.disabled = true;
        $deploy.innerHTML = `<span class="btn-spinner" style="border-color: rgba(255,255,255,.4); border-top-color: #fff;"></span><span>Deploying Neural Partner…</span>`;
        setTimeout(() => ctx.dispatch("cto-deploy"), 1200);
      });
    }
  };
  Object.assign(window.PAGES = window.PAGES || {}, pages);

  // ----- Chapter registration -----------------------------------
  const chapter = {
    id: "cto-vikram",
    title: "The Sale",
    blurb: "A quick read-only scan reveals $3.24M of invisible waste. Vikram deploys Jarvis before the meeting ends.",
    persona: {
      name: "Vikram",
      role: "CTO",
      avatarText: "V",
      accent: "var(--persona-cto)"
    },
    intentKeywords: ["cto", "vikram", "sale", "scan", "phase 0", "diagnostic"],
    endline: "Vikram deployed Jarvis. Day 1 begins now.",

    suggestedQuestions: [
      "Where does the $3.24M number come from?",
      "How accurate is the scan?",
      "What data do you read on Day 1?",
      "What's the security model?"
    ],

    faqs: [
      {
        match: /\$?\s*3[,.]?2(40)?\s*(m|mn|million)?|3\.24/i,
        answer:
          "It's the sum of three line items the Causal Map exposes: **$1.2M** Bengaluru ghost-latency productivity loss, **$1.4M** redundant SaaS licenses (450 unused seats across Figma / Atlassian / DocuSign), and **$640K** in idle compute reservations. Click any node on the globe to drill in.",
        source: "Causal Map — derived from SSO + license-utilization scan."
      },
      {
        match: /accurate|confidence|wrong|trust/i,
        answer:
          "Each insight carries a **confidence band**. The ghost-latency finding is HIGH (n = 187 sessions over 14 days, p99 latency outliers correlated with VPN renegotiations). License findings are MEDIUM-HIGH (last-seen stamps from SAML logs). I never recommend an action below MEDIUM without disclosing the band.",
        source: "Confidence bands documented in the Phase 0 scan model card."
      },
      {
        match: /data|read|access|scope|what.*see|what.*ingest/i,
        answer:
          "Day 1 is **read-only**, full stop. I read SSO group memberships, ticket history, SaaS license metadata, and Mule/Splunk telemetry. I do **not** read message contents, document bodies, code, or PII. Action permissions (write) only unlock after explicit grants per domain pack.",
        source: "Trust & Transparency — Rule C3 in the project rules."
      },
      {
        match: /secur|encryp|compliance|soc|sox|hipaa|byok/i,
        answer:
          "**SOC 2 Type II**, **ISO 27001**, **HIPAA-ready**. Customer-managed keys (BYOK), zero data egress outside the customer tenant. The scan runs inside Hyperforce; nothing reaches a public-cloud LLM.",
        source: "Hyperforce + Einstein Trust Layer architecture."
      },
      {
        match: /how long|time|minutes|phase 0|10 min/i,
        answer:
          "Phase 0 (this scan) takes **about 8 minutes**. Phase 1 (the Setup chapter — Sarah) is another **8 minutes** to install IT Services + CMDB + observability. The first \"self-heal\" usually fires by **Day 1 end of business**."
      },
      {
        match: /false positive|noise|rate/i,
        answer:
          "False-positive rate on Phase 0 is **<3%** based on early-access deployments. The Causal Map is conservative — anything below MEDIUM confidence is shown as a hint, not an action."
      }
    ],

    story: [
      { type: "say", text: "Hello **Vikram**. I have **read-only access** to Acme Health. May I show you the invisible?", pause: 200 },
      { type: "say", text: "Mapping your **digital nervous system** — laptops, servers, SaaS licenses, Slack social graph, and ticket history.", pause: 300 },
      { type: "browser", url: "https://neural.jarvis.salesforce.com/scan?org=acme-health", page: "constellation" },

      { type: "status", text: "Ingesting Okta + AAD group memberships", duration: 1800, doneText: "12,403 identities mapped" },
      { type: "status", text: "Cross-referencing SaaS license utilisation", duration: 2000, doneText: "27 SaaS apps · 4,127 seats inspected" },
      { type: "status", text: "Analysing 5 yrs of ServiceNow tickets",   duration: 2200, doneText: "41,802 tickets — 6 recurring root causes" },

      { type: "say", text: "**Three findings to your attention.** Click any node on the globe to drill in.", pause: 200 },
      { type: "say", text: "I detected a **ghost latency** in your Bengaluru hub. 14% of engineering is losing four hours a week to VPN renegotiation. **Estimated impact: $1.2M / year.**" },
      { type: "say", text: "I also see **450 unused SaaS seats** across Figma, Atlassian, and DocuSign — and **$640K of idle compute** reservations in us-east-1." },

      { type: "say", text: "Slide the toggle on the right from **Legacy** to **Optimized** to see what Day 90 looks like." },
      { type: "wait-for", event: "cto-optimize", text: "Waiting for you to flip the optimizer", doneText: "Optimized projection rendered" },

      { type: "say", text: "**$3.24M / year** in recovered value. The red pulses turn calm teal. Self-healing on, predictive budget on, agentic governance on." },

      { type: "ask",
        text: "Want me to **deploy on your tenant**? Read-only stays for 7 days; you toggle to Co-Pilot when you're ready.",
        choices: [
          { label: "Deploy Jarvis Neural Partner", value: "deploy", primary: true, goto: "deploy" },
          { label: "Send me the report first",     value: "report", goto: "report-only" }
        ]
      },

      { id: "report-only", type: "say",
        text: "No problem. I'll email a sealed PDF to **vikram@acme-health.com** in 30 seconds. Nothing leaves your tenant." },
      { type: "goto", to: "wrap" },

      { id: "deploy", type: "progress",
        text: "Provisioning Jarvis on your Hyperforce tenant", duration: 2400, doneText: "Tenant ready" },
      { type: "progress",
        text: "Installing Trust Layer · BYOK · audit log", duration: 2200, doneText: "Trust posture verified" },
      { type: "say",
        text: "Welcome aboard, Vikram. **Sarah, your IT Admin, will see me on her dashboard.**" },

      { id: "wrap", type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
