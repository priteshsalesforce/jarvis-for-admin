/* =============================================================
   priya.js — Story data for the v5 Mobile (Onboarding Day)
   -------------------------------------------------------------
   Every string in this file is copied verbatim from the desktop
   v5 demo so the mobile port is faithful to the chapter:
     • CHICLETS, SIGNOFFS, TRENDING, DIGEST  ← demo-v5/app.js
     • CHICLET_CONTEXT (Onboard branch)      ← demo-v5/app.js
     • Chapter beats (status, say, approval, branches, fan-out,
       finale)                               ← demo-v5/stories/03-hr-priya.js
   No new copy is invented here — if you change a string, change
   it in the desktop demo too so the two stay in sync.
   ============================================================= */

// Priya's persona — drives the avatar, greeting, and accent halo.
window.PERSONA = {
  name:    "Priya",
  full:    "Priya Menon",
  role:    "HR Admin · TechCorp",
  initial: "P",
};

// Home greeting — shown above the chiclets on first paint.
window.HOME_GREETING = {
  eyebrow: "Welcome,",
  name:    "Priya!",
  lead:    "I've kept an eye on people-ops overnight — here's where to start your day.",
};

// 4 chiclets (one-tap canned prompts) above the whisper bar.
window.HOME_CHICLETS = [
  { id: "onboard",   label: "Onboard a new hire",   prompt: "Onboard Rohan Sharma, PL-13234 — he has accepted the offer letter." },
  { id: "approvals", label: "Today's approvals",    prompt: "What's waiting on my approval today?", badge: "4" },
  { id: "joiners",   label: "Joiners this week",    prompt: "Who's joining this week and what's their status?" },
  { id: "policy",    label: "Look up an HR policy", prompt: "What's our remote-work policy for new hires?" },
];

// "Awaiting your approval" — top home card. 4 sign-offs, 2 shown.
window.HOME_SIGNOFFS = [
  {
    id: "home-sig-1", risk: "high",
    agent: "OnboardingAgent", deadline: "before 6 PM today",
    action: "Approve specialist hardware for Rohan Sharma (PL-13234) — Mac Pro M3 Max + dual 4K, $4,200",
  },
  {
    id: "home-sig-2", risk: "medium",
    agent: "ComplianceAgent", deadline: "before May 22",
    action: "Counter-sign Vikram Kapoor's I-9 — work-authorisation expires May 24",
  },
  {
    id: "home-sig-3", risk: "low",
    agent: "AccessAgent", deadline: "by Fri",
    action: "Grant Workday admin access to Maya Iyer (HRBP, Platform Eng)",
  },
  {
    id: "home-sig-4", risk: "medium",
    agent: "OffboardingAgent", deadline: "by Tue",
    action: "Approve final-pay calculation for Karthik R. — last working day May 24",
  },
];

// "On your radar" — second home card. People-side trending signals.
window.HOME_TRENDING = [
  {
    title: "Background-check vendor running slow",
    sub:   "Verifast SLA at 4.2 days vs the 3-day contract. 6 cases in queue.",
    tone:  "medium",
  },
  {
    title: "Mid-month attrition risk in Platform Eng",
    sub:   "3 senior engineers tagged amber on the retention model — stay-interviews due this week.",
    tone:  "medium",
  },
  {
    title: "Two offers nearing renege risk",
    sub:   "Joiners haven't logged into the pre-boarding portal in 6+ days. Comms agent has nudged twice.",
    tone:  "low",
  },
];

// "Worth knowing today" — third home card. Quiet informational digest.
window.HOME_DIGEST = [
  {
    tone: "schedule",
    text: "3 new joiners on Monday, May 25",
    sub:  "Welcome kits dispatched · workspace assigned · day-1 invites scheduled",
  },
  {
    tone: "compliance",
    text: "Q2 performance-review templates published",
    sub:  "82 of 86 managers have opened them — nudges queued for the rest",
  },
  {
    tone: "report",
    text: "Attrition down 0.8 pts month-over-month",
    sub:  "Driven by Platform Eng (-2.1 pts). Full report saved in Lens.",
  },
];

// First Jarvis bubble after Priya taps the Onboard chiclet (or types
// the same prompt). Sets up the chapter that follows.
window.CHICLET_CONTEXT = "Kicking off **Rohan's onboarding** — fetching the position listing, reading the role's hardware needs, and routing the approval that needs your eye.";

// =====================================================================
// The chapter — verbatim from demo-v5/stories/03-hr-priya.js
// Branches: "approval" → ("execute" | "declined" | "ask-q")
//           "ask-q"    → 3 follow-up choices → ("execute" | "declined")
//           "execute"  → fan-out grid → finale
// =====================================================================
window.STORY = {
  endline:
    "11 seconds. Nine agents. One coffee. Rohan's Day-1 setup is already " +
    "waiting for him.",

  beats: [
    // 1 — Two short status lines while the orchestrator pulls the
    //     position listing and reads role requirements.
    { type: "status",
      text: "Pulling Position Listing PL-13234",
      duration: 1300,
      doneText: "Position resolved · Software Architect · Platform Engineering" },

    { type: "status",
      text: "Reading role requirements & start date",
      duration: 1100,
      doneText: "Start date · Monday, May 25 · Joining Platform Engineering" },

    // 2 — Jarvis acknowledges in plain English.
    { type: "say",
      text:
        "Got it! I've kicked off **Rohan's** onboarding for **PL-13234** — Software Architect. " +
        "His start date is **May 25**. I've identified specialised hardware requirements for " +
        "this role and routed an approval request to you. I'll keep you posted.",
      pause: 250 },

    // 3 — Approval card.
    { id: "approval", type: "approval-card",
      eyebrow: "Procurement Agent · Approval requested",
      title: "Hardware approval needed",
      summary:
        "A new Software Architect (Rohan Sharma, PL-13234) joining May 25 " +
        "requires specialised hardware:",
      items: [
        { label: "Mac Pro 14\" M3 Max",   spec: "Apple silicon",       cost: "$2,800" },
        { label: "32GB RAM upgrade",        spec: "Configure-to-order",  cost: "$200"   },
        { label: "2× external monitors",    spec: "27\" 4K, USB-C dock", cost: "$1,200" },
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
        "Understood — I've put the hardware order on hold and pinged " +
        "**Procurement** to discuss alternate specs that fit the standard " +
        "L4 budget. I'll come back with options before EOD.",
      pause: 200 },
    { type: "goto", to: "soft-end" },

    // ----- Ask-a-question branch ----------------------------------------
    { id: "ask-q", type: "say",
      text:
        "Sure — here's the math:\n\n" +
        "• **Mac Pro 14\" M3 Max** · $2,800\n" +
        "• **32GB RAM upgrade** · $200\n" +
        "• **2× external monitors** · $1,200\n\n" +
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
        "Approved. Releasing the orchestrator — **9 agents** are picking " +
        "up the work in parallel.",
      pause: 200 },

    // The structured "task · agent · status" grid.
    { type: "task-list",
      eyebrow: "Onboarding Orchestrator · 9 agents",
      rows: [
        { task: "Background check initiated",                      agent: "Compliance Agent",   status: "done" },
        { task: "I-9 & tax forms sent",                            agent: "HR Forms Agent",     status: "done" },
        { task: "Mac Pro order placed",                            agent: "Procurement Agent",  status: "ordered", final: "Ordered — ETA May 22", sub: "Ships from Singapore facility" },
        { task: "Workspace assigned — Desk 4B, Floor 2",           agent: "Facilities Agent",   status: "done" },
        { task: "Laptop enrolment in MDM",                         agent: "IT Config Agent",    status: "pending", final: "Pending", sub: "Auto-enrols on first sign-in" },
        { task: "Email ID created — rohan.sharma@techcorp.com",    agent: "Identity Agent",     status: "done" },
        { task: "GitHub Enterprise access provisioned",            agent: "Access Agent",       status: "done" },
        { task: "AWS Dev credentials configured",                  agent: "Cloud Access Agent", status: "done" },
        { task: "Slack account created & added to #platform-eng",  agent: "Comms Agent",        status: "done" },
      ],
      stagger: 220,
      settle:  360,
      footnote: "Done in **11 seconds** · 1 item pending delivery.",
    },

    // 4 — Punchline.
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
