/* =============================================================
   00-lobby.js — Lobby meta-FAQ + suggestion chips
   -------------------------------------------------------------
   This file does NOT push a chapter onto window.CHAPTERS.
   It only configures what Jarvis says and suggests when the
   CEO hasn't picked a chapter yet — i.e. the persistent chat
   in the lobby. The "intent keywords" inside each registered
   chapter (in the per-chapter files) are what powers free-text
   routing like "show me the executive view".
   ============================================================= */

window.LOBBY = {
  suggestedQuestions: [
    "What is this demo?",
    "Which chapter shows ROI?",
    "Who is this built for?",
    "Why Salesforce for ITSM?"
  ],
  faqs: [
    {
      match: /what.*(this|demo|about)|about this|tl;?dr/i,
      answer:
        "This is **A day in the life of Jarvis** — a five-chapter cinematic that shows what an AI-native, agentic ITSM platform feels like across an entire org, from the boardroom buy to the breakroom calm. Each chapter is a 60-second film told from one persona's POV: **CTO, IT Admin, Employee, Manager, Executive**.",
      source: "Narrative spec — see `Proactive ITSM War Room Concept Specification.md` and `memory.MD`."
    },
    {
      match: /roi|value|saving|cost|payback|business case/i,
      answer:
        "The clearest ROI shot is in **Chapter 5 — The Wall Board** (Executive Marc): you'll see live counters for tickets auto-resolved, MTTR reduction, and cost saved. **Chapter 1 — The Sale** (CTO Vikram) opens with the same number: $3.24M of invisible waste exposed by the opening neural scan.",
      source: "Wall Board metrics are illustrative; real numbers depend on customer baselines from the Setup-phase scan."
    },
    {
      match: /who.*(built for|audience)|target|persona|user/i,
      answer:
        "Three primary personas: **Executive** (board-level visibility), **LOB VP / Manager** (team health + proactive ops), **Supervisor / IT Admin** (setup and orchestration). The CTO and Employee chapters are added context — the buying moment, and the felt experience for everyone in the company.",
      source: "Project rules (Cursor user rules — Rule C2 Persona-Centricity)."
    },
    {
      match: /how long|time|minutes|duration|length/i,
      answer:
        "About **6 minutes total** if you Play All. Each chapter is roughly 60–90 seconds; you can also jump to any chapter from the lobby and ask Jarvis questions during a chapter without breaking the story."
    },
    {
      match: /salesforce|why.*platform|why.*here|lightning/i,
      answer:
        "Three reasons we believe this belongs on Salesforce: **Data gravity** (CMDB + ticket history are already in or near Service Cloud), **Trust fabric** (Einstein Trust Layer, Hyperforce, BYOK), and **Surface coverage** (Lightning UI for explorers, Slack for conversational ops, Mule Agent Fabric for runtime agent relationships).",
      source: "Channel summary in `memory.MD` (Mule Agent Fabric + CMDB integration)."
    },
    {
      match: /agent|autonomous|agentic|jarvis|how.*work/i,
      answer:
        "Jarvis is an **agentic ITSM partner** — it observes (CMDB + Splunk), proposes (with confidence + source), and acts only after a human Approve / Modify / Reject step. Every action is reversible and logged. The Manager and Admin chapters show this loop end-to-end."
    },
    {
      match: /security|trust|privacy|risk|data|access/i,
      answer:
        "Day-1 access is **read-only** by design — SSO group memberships, CMDB metadata, and ticket history. Action permissions are granted later, scoped by domain pack, audited per call, and gated by Approve / Modify / Reject. SOC 2 Type II, customer-managed keys, no data egress outside your tenant.",
      source: "Trust principle — Rule C3 (Trust & Transparency) in project rules."
    },
    {
      match: /vignette\s*4|orchestrat|complex scenario/i,
      answer:
        "Vignette 4 — **agent orchestration for complex scenarios** — is intentionally *not* in this demo yet. Per Ramprasadh's clarification, that scope is still being defined; it's a future Chapter 6 once we lock the multi-agent storyline.",
      source: "`memory.MD` — Vignette 4 note from 2026-05-08."
    },
    {
      match: /play all|all chapters|whole demo|tour/i,
      answer:
        "Click **Play all five chapters** at the top, or just type **\"play all\"** in the chat. I'll auto-advance you through CTO → Admin → Employee → Manager → Executive."
    }
  ]
};
