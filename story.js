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
      { label: "Splunk",  value: "splunk",  logo: "S", color: "#f57c00",
        sub: "Log analytics & SIEM",        goto: "splunk-flow" },
      { label: "Datadog", value: "datadog", logo: "D", color: "#632ca6",
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
    title: "Proactive ITSM · Live Dashboard",
    sub:   "incidents · SLAs · agent activity",
    url:   "https://itsm.salesforce.com/dashboard",
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
          <div class="auth-brand__logo">S</div>
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
    panel.querySelector("#splunkLoginBtn").addEventListener("click", () => {
      panel.dispatchEvent(new CustomEvent("splunk-login", { bubbles: true }));
    });
  },

  /* Live ITSM dashboard preview */
  "itsm-dashboard": (panel) => {
    const bars = Array.from({ length: 12 }, () =>
      `<span style="height:${20 + Math.random() * 60}%"></span>`
    ).join("");
    panel.innerHTML = `
      <div class="dash">
        <h2><span class="dot"></span> Proactive ITSM · Control Tower</h2>

        <div class="tile">
          <div class="tile__label">Open incidents</div>
          <div class="tile__value">7</div>
          <div class="tile__delta">▼ 32% vs last week</div>
        </div>

        <div class="tile">
          <div class="tile__label">Avg resolution</div>
          <div class="tile__value">04:21</div>
          <div class="tile__delta">▼ 18%</div>
        </div>

        <div class="tile tile--wide">
          <div class="tile__label">Incidents · last 12h</div>
          <div class="bar">${bars}</div>
        </div>

        <div class="tile">
          <div class="tile__label">CMDB nodes</div>
          <div class="tile__value">1,248</div>
          <div class="tile__delta">+12 today</div>
        </div>

        <div class="tile">
          <div class="tile__label">Agents active</div>
          <div class="tile__value">5</div>
          <div class="tile__delta">all healthy</div>
        </div>
      </div>
    `;
  }
};
