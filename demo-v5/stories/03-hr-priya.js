/* =============================================================
   03-hr-priya.js — Chapter 3: "Onboarding Day"
   -------------------------------------------------------------
   Persona: Priya Menon, HR Admin at TechCorp.

   Beat (chat-only — the home composer renders the welcome
   greet + Priya's typed message; this chapter picks up the
   moment Jarvis starts working):
     • Two short status lines as the orchestrator pulls the
       position listing and reads role requirements.
     • Plain-English acknowledgement from Jarvis — "Got it,
       I've kicked it off, here's what needs your eye…".
     • Approval card — itemised hardware spec, total, rationale,
       and three CTAs (Approve / Decline / Ask a question).
     • Branches: decline → soft-close · ask → breakdown + re-ask
       · approve → multi-agent fan-out grid.
     • Task-list: 9 specialist agents executing in parallel,
       progressive row reveal + status pills.
     • Punchline: 11 seconds, no tickets, no chasing.

   The chapter uses two engine extensions added in app.js for v5:
     • `approval-card`  — rich approval surface with rationale,
                          itemised cost breakdown, and three CTAs.
     • `task-list`      — multi-row outcome grid with progressive
                          row reveal and status pills.

   Side panel pages: none. The whole flow lives in the chat
   thread on top of v4's IT-manager home shell (greet +
   chiclets + composer + 3-card "today at a glance" strip).
   ============================================================= */

(function () {
  // -----------------------------------------------------------------
  // Chapter registration. v5's app.js looks up "hr-priya" via
  // findChapter() from runHrChapter() (home composer / Onboard
  // chiclet) and from startSetup() (#setup escape hatch).
  // -----------------------------------------------------------------
  const chapter = {
    id: "hr-priya",
    title: "Onboarding Day",
    blurb:
      "Priya onboards a new joiner in 11 seconds — nine specialist agents " +
      "executing in parallel, no tickets, no back-and-forth.",
    persona: {
      name: "Priya",
      role: "HR Admin · TechCorp",
      avatarText: "P",
      // HR accent — same brand purple family as the rest of the app
      // so v5 feels at-home in Jarvis, but slightly cooler so the
      // welcome glow reads as "people" rather than "infra".
      accent: "var(--persona-hr, var(--accent-2))",
    },
    intentKeywords: ["priya", "hr", "onboard", "rohan", "joiner", "techcorp"],
    endline:
      "11 seconds. Nine agents. One coffee. Rohan's Day-1 setup is already " +
      "waiting for him.",

    suggestedQuestions: [
      "Why did procurement need approval?",
      "What does each agent actually do?",
      "Can I see what Rohan will see on May 25?",
      "Can I roll any of this back?",
    ],

    faqs: [
      {
        match: /why.*approv|procurement|threshold|budget/i,
        answer:
          "The standard L4 hardware budget is **$3,000**. Rohan's role " +
          "spec calls for a Mac Pro 14\" M3 Max + 32GB RAM + dual external " +
          "monitors, which totals **$4,200**. Anything above the budget is " +
          "routed to you for sign-off — the threshold is configurable per " +
          "role-level under Settings → Procurement policies.",
      },
      {
        match: /agent.*do|what.*agent|nine.*agent|9.*agent/i,
        answer:
          "Each agent owns one outcome: **Compliance** runs the background " +
          "check, **HR Forms** sends I-9 + tax forms, **Procurement** places " +
          "the hardware order, **Facilities** assigns the desk, **IT Config** " +
          "queues the MDM enrolment, **Identity** mints the email, **Access** " +
          "provisions GitHub, **Cloud Access** issues AWS dev credentials, " +
          "and **Comms** creates the Slack handle and adds Rohan to " +
          "#platform-eng. The Onboarding Orchestrator is the conductor.",
      },
      {
        match: /day ?1|may 25|first day|see/i,
        answer:
          "On May 25, Rohan gets a personalised Slack DM from Jarvis at his " +
          "first sign-in: laptop already enrolled, Jarvis introduces itself, " +
          "his team channel is pre-joined, his calendar already shows the " +
          "first-week welcome syncs. No portal hunt, no \"submit a ticket to " +
          "get GitHub\" loop.",
      },
      {
        match: /roll ?back|undo|reverse|cancel/i,
        answer:
          "**Yes — every action.** Each agent's write is reversible for 30 " +
          "days. The audit trail is one click away (Onboarding → Rohan " +
          "Sharma → Activity), and a one-click revert undoes anything that " +
          "shouldn't have been provisioned (e.g. wrong team channel).",
      },
      {
        match: /approv|today|queue|wait/i,
        answer:
          "**4 items** are waiting for you today: Rohan's hardware (most " +
          "time-sensitive — ships from Singapore), Vikram's I-9 counter-sign " +
          "(work auth expires May 24), Maya's Workday admin grant, and " +
          "Karthik's final-pay calculation. Open the **Awaiting your " +
          "approval** card on the home to triage.",
      },
      {
        match: /joiner|joining|next week|this week/i,
        answer:
          "**3 joiners** start Monday May 25: Rohan Sharma (Software " +
          "Architect, Platform Eng), Aditi Rao (Senior Designer, Product), " +
          "and Samir Khanna (Sr. FinOps Analyst). All three have logged " +
          "into the pre-boarding portal; welcome kits dispatched; day-1 " +
          "calendar invites scheduled for 9:30 AM IST.",
      },
      {
        match: /policy|remote|hybrid|wfh/i,
        answer:
          "**Hybrid baseline** — 3 days in office in the first 90 days, " +
          "then team-led after that. India-specific clauses: ergonomic " +
          "stipend (₹15K) and a connectivity allowance (₹2K/mo) for fully " +
          "remote arrangements. Platform Eng has a role-level exception " +
          "for senior ICs hired into geo-distributed pods.",
      },
    ],

    // -----------------------------------------------------------------
    // Story — picks up *after* Priya has typed her message in the
    // home composer. The home transition has already rendered the
    // user bubble and torn down the welcome view, so this list
    // starts directly with Jarvis's first move.
    //
    // Goto IDs in use: "approval", "declined", "ask-q", "execute",
    // "soft-end". Branches converge on "soft-end" so the chapter
    // always lands on a clean closing beat regardless of path.
    // -----------------------------------------------------------------
    story: [
      // 1 — Resolve the position listing. Two short status lines so
      //     the page feels alive while the orchestrator does its work.
      { type: "status",
        text: "Pulling Position Listing PL-13234",
        duration: 1300,
        doneText: "Position resolved · Software Architect · Platform Engineering" },

      { type: "status",
        text: "Reading role requirements & start date",
        duration: 1100,
        doneText: "Start date · Monday, May 25 · Joining Platform Engineering" },

      // 2 — Jarvis acknowledges in plain English. Frames the approval
      //     card as a *gate* (not a start signal) — the orchestrator
      //     has already begun fanning out under the hood.
      { type: "say",
        text:
          "Got it! I've kicked off **Rohan's** onboarding for **PL-13234** — Software Architect. " +
          "His start date is **May 25**. I've identified specialised hardware requirements for " +
          "this role and routed an approval request to you. I'll keep you posted.",
        pause: 250 },

      // 3 — Approval card. Itemised so Priya can audit at a glance,
      //     three CTAs so she doesn't have to switch surfaces to ask
      //     a question.
      { id: "approval", type: "approval-card",
        eyebrow: "Procurement Agent · Approval requested",
        title: "Hardware approval needed",
        summary:
          "A new Software Architect (Rohan Sharma, PL-13234) joining May 25 " +
          "requires specialised hardware:",
        items: [
          { label: "Mac Pro 14\" M3 Max",   spec: "Apple silicon",        cost: "$2,800" },
          { label: "32GB RAM upgrade",        spec: "Configure-to-order",   cost: "$200"   },
          { label: "2\u00d7 external monitors", spec: "27\" 4K, USB-C dock",  cost: "$1,200" },
        ],
        total: "$4,200",
        rationale:
          "This exceeds the standard **$3,000** L4 hardware threshold. " +
          "Approving releases the order to Procurement (ETA May 22); " +
          "declining holds it pending an alternate spec.",
        actions: [
          { id: "approve", label: "Approve",        kind: "primary",   goto: "execute" },
          { id: "decline", label: "Decline",        kind: "secondary", goto: "declined" },
          { id: "ask",     label: "Ask a question", kind: "tertiary",  goto: "ask-q",
            userText: "Why does this exceed the budget?" },
        ],
      },

      // ----- Decline branch ------------------------------------------------
      { id: "declined", type: "say",
        text:
          "Understood \u2014 I've put the hardware order on hold and pinged " +
          "**Procurement** to discuss alternate specs that fit the standard " +
          "L4 budget. I'll come back with options before EOD.",
        pause: 200 },
      { type: "goto", to: "soft-end" },

      // ----- Ask-a-question branch ----------------------------------------
      // Answers the most likely "why am I being asked?" question with the
      // breakdown, then loops back to a slimmed re-ask so Priya can still
      // approve / decline / rescope without rewinding.
      { id: "ask-q", type: "say",
        text:
          "Sure \u2014 here's the math:\n\n" +
          "\u2022 **Mac Pro 14\" M3 Max** \u00b7 $2,800\n" +
          "\u2022 **32GB RAM upgrade** \u00b7 $200\n" +
          "\u2022 **2\u00d7 external monitors** \u00b7 $1,200\n\n" +
          "**Total $4,200**, against an L4 hardware budget of **$3,000**. " +
          "The $1,200 overage is driven entirely by the dual-monitor " +
          "requirement noted in the Software Architect role spec.",
        pause: 250 },

      { type: "ask",
        text: "How would you like to proceed?",
        choices: [
          { label: "Approve as-is",             value: "approve", goto: "execute"  },
          { label: "Approve, drop one monitor", value: "rescope", goto: "execute"  },
          { label: "Decline",                   value: "decline", goto: "declined" },
        ],
      },

      // ----- Execute branch — multi-agent fan-out --------------------------
      { id: "execute", type: "say",
        text:
          "Approved. Releasing the orchestrator \u2014 **9 agents** are picking " +
          "up the work in parallel.",
        pause: 200 },

      // The structured "task · agent · status" grid. Rows reveal
      // progressively (~220ms each) so the fan-out feels live. The
      // pill animates from "Queued" to its final state mid-row.
      { type: "task-list",
        eyebrow: "Onboarding Orchestrator \u00b7 9 agents",
        rows: [
          { task: "Background check initiated",                       agent: "Compliance Agent",   status: "done" },
          { task: "I-9 & tax forms sent",                              agent: "HR Forms Agent",     status: "done" },
          { task: "Mac Pro order placed",                              agent: "Procurement Agent",  status: "ordered", final: "Ordered \u2014 ETA May 22", sub: "Ships from Singapore facility" },
          { task: "Workspace assigned \u2014 Desk 4B, Floor 2",        agent: "Facilities Agent",   status: "done" },
          { task: "Laptop enrolment in MDM",                           agent: "IT Config Agent",    status: "pending", final: "Pending", sub: "Auto-enrols on first sign-in" },
          { task: "Email ID created \u2014 rohan.sharma@techcorp.com", agent: "Identity Agent",     status: "done" },
          { task: "GitHub Enterprise access provisioned",              agent: "Access Agent",       status: "done" },
          { task: "AWS Dev credentials configured",                    agent: "Cloud Access Agent", status: "done" },
          { task: "Slack account created & added to #platform-eng",   agent: "Comms Agent",        status: "done" },
        ],
        stagger: 220,
        settle:  360,
        footnote: "Done in **11 seconds** \u00b7 1 item pending delivery.",
      },

      // 4 — Punchline. Quiet, in Priya's voice ("no tickets, no chasing").
      { type: "say",
        text:
          "**No tickets. No back-and-forth emails. No chasing.**\n\n" +
          "Rohan will get a personalised welcome from me on **May 25**, his " +
          "laptop will be at his desk, and his Day-1 setup will already be " +
          "waiting for him. I'll ping you if any of the **pending** items " +
          "(MDM enrolment) need a nudge.",
        pause: 250 },

      { id: "soft-end", type: "end" },
    ],
  };

  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
