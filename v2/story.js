/* =============================================================
   STORY FILE — Edit me to change the demo flow
   =============================================================
   Each step is one beat in the demo. Engine plays steps in order.

   Available step `type`s:
   ─────────────────────────────────────────────────────────────
   "say"         → Jarvis says a line.
                   { text: "...", delay?: 600 }

   "status"      → A status line with spinner → ✓ when done.
                   { text: "Checking licences", duration?: 1200, doneText?: "Licences validated" }

   "progress"    → A status line with a progress bar that fills.
                   { text: "Installing CMDB…", duration?: 2400, doneText?: "CMDB installed" }

   "ask"         → Jarvis asks a question with CTA buttons.
                   { text: "Install CMDB?", choices: [
                       { label: "Yes", value: "yes", primary: true,
                         goto?: "step-id"    // optional jump
                       },
                       { label: "No",  value: "no" }
                   ]}
                   The chosen label appears as a user bubble.

   "choose"      → Card-grid choice (logos/services).
                   { text: "Pick a service", options: [
                       { label: "Splunk",  value: "splunk",
                         logo: "S", color: "#f57c00",
                         sub: "Log analytics & SIEM" },
                       { label: "Datadog", value: "datadog",
                         logo: "D", color: "#632ca6",
                         sub: "Observability platform" }
                   ], onPick: "splunk" } // optional auto-pick for demo
                   Use `goto` on each option to branch.

   "browser"     → Open the right-side browser panel.
                   { url: "https://login.splunk.com",
                     page: "splunk-auth"         // see PAGES below
                   }

   "browser-close" → Close the browser panel.

   "wait-for"    → Pause until a named event from the browser page.
                   { event: "splunk-login", text?: "Waiting for login…" }

   "link-card"   → A clickable rich-link card (e.g., dashboard link).
                   { title, sub, url, page, icon? }

   "user"        → Render a manual user line (if you want).
                   { text: "..." }

   "goto"        → Jump to a step id.   { to: "step-id" }
   "end"         → End of demo.

   Every step can optionally have:
     id:   "string"    // for goto targets
     pause: 400        // ms to wait BEFORE running this step

   ============================================================= */

window.STORY = [
  // 0 — Setup begins
  { type: "say",    text: "Starting setup…", pause: 200 },

  // 1 — Licences
  { type: "status", text: "Checking licences",
                    duration: 2600, doneText: "Licences validated" },

  // 2 — Ask: Install CMDB?
  { type: "ask",
    text: "Would you like me to install the **CMDB** package? It powers topology, change‑impact, and incident correlation.",
    choices: [
      { label: "Yes, install CMDB", value: "yes", primary: true, goto: "install-cmdb" },
      { label: "Skip for now",      value: "no",  goto: "skip-cmdb" }
    ]
  },

  // 3 — Skip branch (kept short; you can expand later)
  { id: "skip-cmdb", type: "say",
    text: "No problem — I'll continue without CMDB. You can add it any time from the Control Tower.",
    pause: 200, goto: "after-cmdb" },

  // 4 — Install CMDB branch
  { id: "install-cmdb", type: "progress",
    text: "Installing CMDB package",
    duration: 2900, doneText: "CMDB package installed" },

  { type: "say", text: "CMDB is online. Next, let's connect a monitoring source.", pause: 300 },

  // 5 — Pick a service (Splunk / Datadog)
  { id: "after-cmdb", type: "choose",
    text: "Which observability service should I wire up?",
    options: [
      { label: "Splunk",  value: "splunk",  logo: "assets/Splunk.png",
        sub: "Log analytics & SIEM",        goto: "splunk-flow" },
      { label: "Datadog", value: "datadog", logo: "assets/datadog.png",
        sub: "Metrics, traces & logs",      goto: "datadog-flow" }
    ]
  },

  // ----- Datadog branch (light placeholder so flow is editable) -----
  { id: "datadog-flow", type: "say", text: "Datadog selected. (Demo currently focuses on Splunk — flip this branch in `story.js`.)" },
  { type: "goto", to: "open-dashboard" },

  // ----- Splunk branch -----
  { id: "splunk-flow", type: "say", text: "**Splunk selected.**", pause: 200 },
  { type: "say",    text: "Authenticating Splunk — opening secure login on your right." , pause: 200 },
  { type: "browser", url: "https://login.splunk.com/sso", page: "splunk-auth" },

  // Wait for the user to click "Login" inside the browser page
  { type: "wait-for", event: "splunk-login", text: "Waiting for you to authenticate…" },

  { type: "status", text: "Exchanging tokens",
                    duration: 2400, doneText: "Splunk authenticated" },

  { type: "browser-close" },
  { type: "say", text: "Setup continues — closing the auth window.", pause: 200 },

  { type: "progress", text: "Provisioning data pipelines",
                      duration: 2700, doneText: "Pipelines provisioned" },
  { type: "progress", text: "Configuring incident routing",
                      duration: 2400, doneText: "Routing live" },

  // ----- Dashboard handoff -----
  { id: "open-dashboard", type: "say",
    text: "All set. I've prepared a live dashboard so you can watch the system breathe.",
    pause: 300 },
  { type: "link-card",
    title: "CMDB discovery dashboard",
    url:   "https://itsm.salesforce.com/cmdb",
    page:  "itsm-dashboard",
    icon:  "📊"
  },

  { type: "say",
    text: "Click the card whenever you're ready and I'll open it on the right. I'll keep watching for anomalies in the background.",
    pause: 200 },

  { type: "end" }
];

/* =============================================================
   PAGES — content rendered inside the right-side fake browser.
   To add a new page, register an HTML factory here.
   The engine passes (panel, ctx) so you can dispatch events back
   to the story (e.g., panel.dispatchEvent(new CustomEvent('splunk-login')))
   ============================================================= */
window.PAGES = {
  /* Splunk SSO login screen */
  "splunk-auth": (panel) => {
    panel.innerHTML = `
      <div class="auth-page">
        <div class="auth-brand">
          <div class="auth-brand__logo auth-brand__logo--img">
            <img src="assets/Splunk.png" alt="Splunk" />
          </div>
          <div>
            <div class="auth-brand__name">splunk&gt;</div>
            <div class="auth-brand__sub">Single Sign‑On</div>
          </div>
        </div>
        <div class="auth-card">
          <h3>Sign in to Splunk Cloud</h3>
          <p>Salesforce Jarvis is requesting access to your Splunk workspace.</p>
          <div class="field">
            <label for="splunkUser">Username</label>
            <input id="splunkUser" type="text" value="admin@salesforce.com" />
          </div>
          <div class="field">
            <label for="splunkPass">Password</label>
            <input id="splunkPass" type="password" value="••••••••••" />
          </div>
          <button class="btn-primary" id="splunkLoginBtn">Login</button>
          <div class="auth-footer">By logging in you authorise Jarvis to read & write incidents on your behalf.</div>
        </div>
      </div>
    `;
    const loginBtn = panel.querySelector("#splunkLoginBtn");
    loginBtn.addEventListener("click", () => {
      if (loginBtn.disabled) return;
      // Swap button content for a spinner + label, disable repeat clicks
      loginBtn.disabled = true;
      loginBtn.classList.add("is-loading");
      loginBtn.innerHTML = `<span class="btn-spinner"></span><span>Authenticating…</span>`;
      // Brief pause so the spinner is visible, then proceed with the flow
      setTimeout(() => {
        panel.dispatchEvent(new CustomEvent("splunk-login", { bubbles: true }));
      }, 1200);
    });
  },

  /* CMDB discovery dashboard */
  "itsm-dashboard": (panel) => {
    // A small synthetic but believable CI inventory
    const items = [
      { sn: "SF-MAC-0481",  mfr: "Apple",   exp: "2027-04-18", health: "ok"   },
      { sn: "SF-WIN-1192",  mfr: "Dell",    exp: "2026-06-02", health: "warn" },
      { sn: "SF-SRV-2034",  mfr: "HPE",     exp: "2028-11-30", health: "ok"   },
      { sn: "SF-NET-0719",  mfr: "Cisco",   exp: "2026-05-22", health: "warn" },
      { sn: "SF-MAC-0498",  mfr: "Apple",   exp: "2027-09-14", health: "ok"   },
      { sn: "SF-WIN-1207",  mfr: "Lenovo",  exp: "2025-12-09", health: "crit" },
      { sn: "SF-SRV-2055",  mfr: "Dell",    exp: "2029-02-04", health: "ok"   },
      { sn: "SF-IOT-3301",  mfr: "Aruba",   exp: "2027-08-21", health: "ok"   },
      { sn: "SF-NET-0822",  mfr: "Juniper", exp: "2026-03-15", health: "warn" },
      { sn: "SF-MAC-0512",  mfr: "Apple",   exp: "2028-01-07", health: "ok"   },
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

    // Animate the "Percentage completed" tile from 0 → 78% on open
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
