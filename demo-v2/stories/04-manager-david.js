/* =============================================================
   04-manager-david.js — Chapter 4: "The Proactive Save"
   -------------------------------------------------------------
   Persona: David, Manager / LOB VP at Acme Health.
   Beat: David sees Team Health → Jarvis flags burnout for one
   teammate → a Splunk threshold breach fires → Jarvis already
   logged the incident, ran a Causal Analysis, and proposes a
   one-click remediation → David approves → RCA broadcast.
   Side panel: registers `team-health` (incident dashboard).
   ============================================================= */

(function () {
  const pages = {
    "team-health": (panel, ctx) => {
      panel.innerHTML = `
        <div class="team-health" id="thRoot">
          <div class="team-health__head">
            <span class="dot"></span>
            <h3>Team Health · Platform Squad</h3>
          </div>

          <!-- People list -->
          <div class="team-health__people">
            ${[
              ["Alex Chen",   "UX Designer",    [3,4,4,3,4,3,3], false],
              ["Priya Rao",   "Backend Eng",    [2,3,3,2,1,1,1], true],   // burnout flag
              ["Jordan Park", "Frontend Eng",   [3,3,4,4,4,3,4], false],
              ["Sam Patel",   "SRE",            [3,4,3,4,4,3,2], false],
              ["Kira Adel",   "Product Mgr",    [4,3,4,3,4,4,4], false],
            ].map(([name, role, heat, flagged]) => `
              <div class="th-row ${flagged ? "is-flagged" : ""}">
                <div class="th-row__avatar">${name.split(" ").map(s => s[0]).join("").slice(0,2)}</div>
                <div>
                  <div class="th-row__name">${name}</div>
                  <div class="th-row__role">${role}</div>
                </div>
                <div class="th-row__heat">
                  ${heat.map(h => `<span class="is-h${h}"></span>`).join("")}
                </div>
                ${flagged ? `<div class="th-flag">Burnout risk</div>` : `<div></div>`}
              </div>
            `).join("")}
          </div>

          <!-- Incident card (initially hidden, fades in via story) -->
          <div class="th-incident" id="thIncident" hidden>
            <div class="th-incident__head">
              <span class="th-incident__pill">SEV-2 · Active</span>
              <div class="th-incident__title">Checkout API · 5xx rate breach</div>
              <span class="th-incident__time">14:42 IST</span>
            </div>

            <div class="th-incident__causal" id="thCausal">
              <div class="th-incident__step">
                <strong>Splunk threshold breached</strong> · 5xx rate hit 3.4% (SLO: 1%) at 14:38
              </div>
              <div class="th-incident__step">
                <strong>Causal:</strong> upstream third-party (Stripe-EU) returning 502s for 12 mins
              </div>
              <div class="th-incident__step">
                <strong>Blast radius:</strong> 4,127 EU customers · est. revenue exposure $84K
              </div>
              <div class="th-incident__step">
                <strong>Remediation:</strong> failover to Stripe-US replica + circuit-breaker on EU
              </div>
              <div class="th-incident__step">
                <strong>Confidence:</strong> HIGH (matches incident #INC-3018 from 2026-03-14)
              </div>
            </div>

            <div class="th-incident__actions">
              <button class="th-btn th-btn--primary" id="thApprove">Approve remediation</button>
              <button class="th-btn" id="thModify">Modify…</button>
              <button class="th-btn th-btn--ghost" id="thReject">Reject</button>
            </div>
          </div>
        </div>
      `;

      // The incident card reveals itself a beat after the page opens —
      // this keeps the story script free of imperative DOM calls.
      const revealEl = panel.querySelector("#thIncident");
      setTimeout(() => {
        if (!revealEl) return;
        revealEl.hidden = false;
        revealEl.style.opacity = 0;
        revealEl.style.transform = "translateY(8px)";
        requestAnimationFrame(() => {
          revealEl.style.transition = "opacity .4s ease, transform .4s ease";
          revealEl.style.opacity = 1;
          revealEl.style.transform = "translateY(0)";
        });
      }, 3200);

      panel.querySelector("#thApprove")?.addEventListener("click", () => {
        const btn = panel.querySelector("#thApprove");
        btn.disabled = true;
        btn.textContent = "Executing remediation…";
        btn.style.cursor = "progress";
        setTimeout(() => ctx.dispatch("th-approve"), 1200);
      });
      panel.querySelector("#thReject")?.addEventListener("click", () => ctx.dispatch("th-reject"));
    }
  };
  Object.assign(window.PAGES = window.PAGES || {}, pages);

  // ----- Chapter registration -----------------------------------
  const chapter = {
    id: "manager-david",
    title: "The Proactive Save",
    blurb: "David wakes up to a burnout flag — and an SLA breach Jarvis already fixed before his coffee.",
    persona: {
      name: "David",
      role: "Engineering Manager",
      avatarText: "D",
      accent: "var(--persona-manager)"
    },
    intentKeywords: ["manager", "david", "proactive", "incident", "splunk", "team health", "burnout"],
    endline: "David coached Priya, approved a fix, and sent the RCA in 90 seconds — without a single fire drill.",

    suggestedQuestions: [
      "How does Jarvis detect burnout?",
      "Can I override the remediation?",
      "Where does the causal analysis come from?",
      "Who gets the RCA notification?"
    ],

    faqs: [
      {
        match: /burnout|wellbeing|sentiment|how.*detect/i,
        answer:
          "I look at **patterns, never message contents** — response-time drift, after-hours commit volume, ticket-resolution latency, and PTO frequency. The flag fires when **three or more** signals trend negative for 14 days. Manager-only by default; never shared with HR without consent.",
        source: "Sentiment Intelligence — only metadata, no message text. Auditable in the trust ledger."
      },
      {
        match: /override|reject|wrong|modify|veto/i,
        answer:
          "**Always.** Every recommendation is **Approve / Modify / Reject**. Reject is one click and never costs you trust — I learn from the rejection and adjust the confidence model on similar incidents."
      },
      {
        match: /causal|analysis|where.*come|root cause/i,
        answer:
          "I run a **dependency walk** on the CMDB graph: Checkout API → upstream Stripe-EU → DNS health → BGP changes. Each hop carries a confidence score. I match against historical incidents (here: INC-3018, 96% topology match) before proposing a fix.",
        source: "Causal walks are deterministic; the model only ranks candidate root causes."
      },
      {
        match: /rca|notification|broadcast|stakeholders|who get/i,
        answer:
          "Three audiences, three formats: a **Slack RCA** for the team (technical), a **5-line summary** for the LOB VP (impact + cost), and a **status-page update** if customer-facing. All three publish on Approve."
      },
      {
        match: /wrong|hallucination|mistake|false positive/i,
        answer:
          "If I'm wrong, **nothing executes** — every action requires your approval first. Post-incident, the trust ledger shows what I proposed vs. what you chose; I retrain my confidence model on rejections every week."
      }
    ],

    story: [
      { type: "say", text: "Good morning, **David**. I have **two things** for you before your stand-up.", pause: 200 },

      { type: "browser", url: "https://itsm.salesforce.com/team-health/platform", page: "team-health" },

      { type: "say", text: "**First**, I'm flagging a **burnout risk** for **Priya Rao**. Her response times have slowed 38% over 14 days, after-hours commits up 60%, and she hasn't taken a Friday off in 11 weeks.", pause: 200 },
      { type: "say", text: "She's not in trouble — but she's about to break something. **Want me to draft a coaching note** you can review and send?" },

      { type: "ask",
        text: "Draft the note?",
        choices: [
          { label: "Draft it", value: "draft", primary: true, goto: "draft-note" },
          { label: "I'll handle it", value: "skip", goto: "skip-note" }
        ]
      },

      { id: "draft-note", type: "progress",
        text: "Drafting Slack DM (tone: warm, non-judgemental, 3 sentences)",
        duration: 1800, doneText: "Draft ready for your review" },
      { type: "slack-thread",
        channel: "DM draft · for review",
        meta: "Pending your approval",
        messages: [
          {
            from: "Jarvis (draft)", bot: true, fromColor: "var(--persona-cto)",
            text:
              "Hey Priya — quick check-in, not work. I noticed you've been carrying a lot the last couple of weeks and haven't taken any time off. I really appreciate it, and I'd hate for you to burn out.\n\n" +
              "How about you take **Fri + Mon** off? I'll cover the on-call swap. Let me know.",
            actions: [
              { label: "Edit draft" },
              { label: "Send as-is", primary: true }
            ]
          }
        ]
      },
      { type: "goto", to: "incident" },

      { id: "skip-note", type: "say", text: "Got it. I'll keep watching the signal." },

      { id: "incident", type: "say", text: "**Second thing.** Your **Checkout API** breached its 5xx SLO 4 minutes ago. I've already done the work — see the right panel.", pause: 200 },

      { type: "say",
        text: "**SEV-2 active.** Causal analysis: upstream **Stripe-EU** is returning 502s — same shape as **INC-3018** from March. Blast radius **4,127 EU customers**, ~$84K revenue exposure.",
        pause: 600 },
      { type: "say",
        text: "**Recommended fix:** failover to Stripe-US replica, circuit-breaker on EU. Confidence **HIGH**. Click **Approve remediation** in the panel when you're ready." },

      { type: "wait-for", event: "th-approve",
        text: "Waiting for your approval…",
        doneText: "Remediation approved" },

      { type: "progress", text: "Failing over to Stripe-US replica",
                          duration: 2000, doneText: "Traffic on Stripe-US · 0 errors" },
      { type: "progress", text: "Engaging circuit-breaker on EU",
                          duration: 1600, doneText: "EU isolated until Stripe recovers" },

      { type: "metric-board",
        title: "Incident closed in 4m 12s",
        metrics: [
          { label: "5xx rate now", value: "0.4%", delta: "↓ from 3.4%" },
          { label: "Customers impacted", value: 0, delta: "from 4,127", hint: "Recovered before checkout retry" },
          { label: "Revenue saved",  value: 84000, delta: "$ recovered" },
          { label: "Time to repair", value: "4m 12s", delta: "↓ 87% vs. INC-3018", hint: "Old MTTR: 32m" }
        ]
      },

      { type: "ask",
        text: "Send the **RCA broadcast**? I'll post a technical thread to **#platform-eng**, a 5-line impact summary to your VP, and a status-page update.",
        choices: [
          { label: "Send all three", value: "send", primary: true, goto: "send-rca" },
          { label: "Just the team", value: "team", goto: "team-only" },
          { label: "Skip", value: "skip", goto: "skip-rca" }
        ]
      },

      { id: "send-rca", type: "progress", text: "Publishing RCA · 3 surfaces",
                                          duration: 1800, doneText: "Posted to #platform-eng, VP digest, status.acme-health.com" },
      { type: "say", text: "You averted the incident, coached your engineer, and your VP got a calm 5-line summary instead of a fire drill." },
      { type: "note",
        title: "90 seconds, end-to-end",
        text: "A burnout flag drafted, a SEV-2 averted, and an RCA broadcast to three audiences — **all between sips of coffee.**" },
      { type: "goto", to: "wrap" },

      { id: "team-only", type: "progress", text: "Posting to #platform-eng",
                                            duration: 1400, doneText: "Posted" },
      { type: "goto", to: "wrap" },

      { id: "skip-rca", type: "say", text: "No problem — I'll keep this in the trust ledger only. You can publish later from the incident view." },

      { id: "wrap", type: "say", text: "**That's the new rhythm.** You didn't put out a fire today. You **prevented one**, and the team trusts you a little more for it." },
      { type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
