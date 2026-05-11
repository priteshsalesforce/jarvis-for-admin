/* =============================================================
   03-employee-alex.js — Chapter 3: "Zero-Ticket"
   -------------------------------------------------------------
   Persona: Alex, UX Designer at Acme Health.
   Beat: Alex pings Jarvis in Slack ("I need access to the
   Figma files for Marc’s Dream product"). Jarvis verifies identity, checks
   project roster, grants access in 4 seconds.
   Side panel: registers `slack-page` (full Slack-Block-Kit page).
   ============================================================= */

(function () {
  const pages = {
    "slack-page": (panel, ctx) => {
      panel.innerHTML = `
        <div class="slack-page">
          <div class="slack-page__head">
            <div class="slack-page__hash">#</div>
            <div>
              <div class="slack-page__channel">it-help</div>
              <div class="slack-page__sub">A direct line to Jarvis. No tickets, no forms.</div>
            </div>
          </div>

          <div class="slack-page__body" id="slackBody">
            <!-- Initial Alex message -->
            <div class="slack-page__msg slack-msg">
              <div class="slack-msg__avatar" style="--persona-accent: var(--persona-employee);">A</div>
              <div class="slack-msg__body">
                <div class="slack-msg__head">
                  <span class="slack-msg__from">Alex Chen</span>
                  <span class="slack-msg__time">just now</span>
                </div>
                <div class="slack-msg__text">Hey Jarvis — I need access to the **Figma files for Marc’s Dream product**. I'm joining that pod today.</div>
              </div>
            </div>
          </div>
        </div>
      `;

      const $body = panel.querySelector("#slackBody");

      function append(html) {
        const wrap = document.createElement("div");
        wrap.innerHTML = html.trim();
        const el = wrap.firstElementChild;
        $body.appendChild(el);
        $body.scrollTop = $body.scrollHeight;
        return el;
      }
      function jarvisTypingMsg() {
        return append(`
          <div class="slack-page__msg slack-msg">
            <div class="slack-msg__avatar" style="--persona-accent: var(--persona-cto);">J</div>
            <div class="slack-msg__body">
              <div class="slack-msg__head">
                <span class="slack-msg__from">Jarvis</span>
                <span class="slack-msg__bot">APP</span>
                <span class="slack-msg__time">just now</span>
              </div>
              <div class="slack-msg__text">
                <span class="typing"><span></span><span></span><span></span></span>
              </div>
            </div>
          </div>
        `);
      }
      function setLastJarvisText(html) {
        const all = $body.querySelectorAll(".slack-page__msg");
        const last = all[all.length - 1];
        if (last) {
          last.querySelector(".slack-msg__text").innerHTML = html;
          $body.scrollTop = $body.scrollHeight;
        }
      }
      function addAttachToLast(html) {
        const all = $body.querySelectorAll(".slack-page__msg");
        const last = all[all.length - 1];
        if (last) {
          const div = document.createElement("div");
          div.innerHTML = html.trim();
          last.querySelector(".slack-msg__body").appendChild(div.firstElementChild);
          $body.scrollTop = $body.scrollHeight;
        }
      }

      // Auto-play the conversation on its own timeline so the story script
      // stays declarative. The Slack panel feels alive next to the chat.
      const timeline = [
        { at: 1500, fn: () => jarvisTypingMsg() },
        { at: 2700, fn: () => setLastJarvisText(
            "Hi Alex — I see you're on the <strong>Marc’s Dream product</strong> pod (added by Maya earlier today). Verifying access…"
          )
        },
        { at: 4500, fn: () => addAttachToLast(`
            <div class="slack-page__attach">
              <div class="slack-page__attach-title">✓ Editor access · Marc’s Dream product Figma</div>
              <div class="slack-page__attach-meta">Also granted: Confluence space · Linear project · Slack channel</div>
              <div class="slack-page__attach-actions">
                <span class="slack-action">View audit log</span>
                <span class="slack-action slack-action--primary">Open Figma →</span>
              </div>
            </div>
          `)
        },
        { at: 6200, fn: () => append(`
            <div class="slack-page__msg slack-msg">
              <div class="slack-msg__avatar" style="--persona-accent: var(--persona-cto);">J</div>
              <div class="slack-msg__body">
                <div class="slack-msg__head">
                  <span class="slack-msg__from">Jarvis</span>
                  <span class="slack-msg__bot">APP</span>
                  <span class="slack-msg__time">just now</span>
                </div>
                <div class="slack-msg__text">Total time: <strong>4 seconds</strong>. Need anything else? Just message me here.</div>
              </div>
            </div>
          `)
        }
      ];
      const timers = timeline.map(t => setTimeout(t.fn, t.at));
      // Clean up timers if panel is replaced before timeline finishes
      const observer = new MutationObserver(() => {
        if (!document.body.contains(panel.querySelector("#slackBody"))) {
          timers.forEach(clearTimeout);
          observer.disconnect();
        }
      });
      observer.observe(panel, { childList: true });
    }
  };
  Object.assign(window.PAGES = window.PAGES || {}, pages);

  // ----- Chapter registration -----------------------------------
  const chapter = {
    id: "employee-alex",
    title: "Zero-Ticket",
    blurb: "Alex pings Jarvis in Slack and gets Figma access in 4 seconds. No portals, no forms, no waiting.",
    persona: {
      name: "Alex",
      role: "UX Designer",
      avatarText: "A",
      accent: "var(--persona-employee)"
    },
    intentKeywords: ["alex", "employee", "zero ticket", "slack", "figma", "access"],
    endline: "Alex got back to designing in 4 seconds. Multiply this by **12,403 employees** — that's the felt experience for everyone in the company on Day 1.",

    suggestedQuestions: [
      "How does Jarvis verify identity?",
      "Is my Slack data private?",
      "What if Jarvis can't grant access?",
      "Why Slack-first?"
    ],

    faqs: [
      {
        match: /verify|identity|who|how do you know|sso/i,
        answer:
          "I cross-check three signals: **SSO group membership** (Okta), **active project roster** in CMDB, and **manager attestation** (silent — I look up the reporting line). All three must align, or I escalate."
      },
      {
        match: /privacy|data|read.*slack|slack.*data|message contents/i,
        answer:
          "I read the **single message** the user sends to me — never channel history, never DMs between humans, never document bodies. Slack workspace admins can audit every byte I read in the trust ledger.",
        source: "Slack-First UX — Rule C6 in project rules; Einstein Trust Layer scope."
      },
      {
        match: /can'?t|fail|deny|escalate|edge case/i,
        answer:
          "If any of the three identity signals disagree, I show Alex a card with the disagreement and offer to **page the manager** (with one click) for an attestation. The manager sees a Slack DM with Approve / Modify / Reject — same pattern everywhere."
      },
      {
        match: /why slack|slack first|why not portal/i,
        answer:
          "Because **employees already live in Slack**. A portal is a context switch and a context switch is a ticket. Slack-first means zero-friction asks and zero-friction follow-ups, and it composes naturally with our Block Kit elements (buttons, modals, attestations)."
      },
      {
        match: /ticket|portal|servicenow|form/i,
        answer:
          "Yes — the classic ServiceNow/Jira ticket form is still available for compliance-sensitive flows, and I auto-file a ticket on Alex's behalf for audit anyway. Alex never sees it unless something fails."
      }
    ],

    story: [
      { type: "say", text: "Hey **Alex**. You just got pinged by your design lead — you're on the **Marc’s Dream product** pod starting today.", pause: 200 },
      { type: "say", text: "Need anything to get set up? Just **ask me in Slack**." },

      { type: "note",
        title: "Watch the old vs. new shape",
        text: "In the old world this is a **4-hour ticket** — portal, form, wait, email back-and-forth. Watch how Jarvis collapses it to a single Slack message.",
        sub: "Side panel on the right shows what Alex sees in Slack." },

      { type: "browser", url: "slack://acme-health/dm/jarvis", page: "slack-page", pause: 200 },

      { type: "status", text: "Verifying Alex's identity (Okta + CMDB)", duration: 1600, doneText: "Identity confirmed · 3 / 3 signals" },
      { type: "status", text: "Checking Marc’s Dream product project roster",       duration: 1400, doneText: "Alex is on the pod (added by Maya)" },
      { type: "status", text: "Granting Figma editor seat",               duration: 1400, doneText: "Granted · audit logged" },

      { type: "say",
        text: "Done — **editor access to Marc’s Dream product Figma + the Confluence space + Linear project.** Audit-logged. Need anything else?",
        pause: 200 },

      { type: "note",
        title: "4 seconds, end-to-end",
        text: "From Alex's first Slack message to a granted Figma seat across three tools — **4 seconds**." },

      { type: "ask",
        text: "Anything else? — say, a **Figma plugin** the team's been waiting on?",
        choices: [
          { label: "Yes — show the plugin flow", value: "more", primary: true, goto: "more" },
          { label: "No, I'm set", value: "skip", goto: "wrap" }
        ]
      },

      { id: "more", type: "say", text: "Plugins are a different shape — they need a security review. Here goes.", pause: 200 },
      { type: "slack-thread",
        channel: "DM · jarvis",
        meta: "moments later",
        messages: [
          {
            from: "Alex Chen", fromColor: "var(--persona-employee)",
            text: "Also, can you whitelist the **Figma → Webflow plugin** for the team?"
          },
          {
            from: "Jarvis", bot: true, fromColor: "var(--persona-cto)",
            text:
              "I can. The plugin clears our security baseline (no PII export, signed by Webflow Inc).\n" +
              "It needs a one-tap **manager attestation** because it writes outside the design tool.\n" +
              "I've pinged Maya for you.",
            actions: [
              { label: "View security report", primary: false },
              { label: "Notify when approved", primary: true }
            ]
          },
          {
            from: "Maya Lin (Manager)", fromColor: "var(--persona-manager)",
            text: "Approved — go for it 👍"
          },
          {
            from: "Jarvis", bot: true, fromColor: "var(--persona-cto)",
            text: "Whitelisted across the design org. Restart Figma to pick it up — should take ~10 seconds."
          }
        ]
      },

      { type: "note",
        title: "End-to-end: 47 seconds",
        text: "Including a **real human approval** in the loop. Try doing that with a portal." },

      { id: "wrap", type: "end" }
    ]
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
