# Jarvis for Admin · Proactive Agentic ITSM

> Interactive demo of the **Proactive Agentic ITSM** vision — a cinematic, persona-switcher walkthrough designed to sell the future of autonomous IT to a Salesforce-style executive audience.

## Live demo

**[priteshsalesforce.github.io/jarvis-for-admin](https://priteshsalesforce.github.io/jarvis-for-admin/)**

Pick any persona card to play that 60-second chapter, or click **Play all five chapters** for the full ~6-minute film.

### Share a single persona

Each chapter has its own shareable URL — just append a hash. Pasting any of these into Slack drops the recipient straight into that chapter, skipping the lobby:

| Persona | Shareable link |
|---|---|
| **CTO Vikram** — The Sale | [`…/#cto`](https://priteshsalesforce.github.io/jarvis-for-admin/#cto) |
| **Admin Sarah** — The Setup | [`…/#admin`](https://priteshsalesforce.github.io/jarvis-for-admin/#admin) |
| **Employee Alex** — Zero-Ticket | [`…/#employee`](https://priteshsalesforce.github.io/jarvis-for-admin/#employee) |
| **Manager David** — The Proactive Save | [`…/#manager`](https://priteshsalesforce.github.io/jarvis-for-admin/#manager) |
| **Executive Marc** — The Wall Board | [`…/#exec`](https://priteshsalesforce.github.io/jarvis-for-admin/#exec) |

First-name aliases (`#sarah`, `#vikram`, `#alex`, `#david`, `#marc`) and `#it-admin` also work. The URL bar updates as you switch chapters, so you can always copy what you're currently watching to share.

## A day in the life of Jarvis — five chapters

| # | Persona | Title | Beat |
|---|---|---|---|
| 1 | **CTO Vikram** | The Sale | 60-second Phase-0 Neural Scan reveals $3.24M of invisible waste; Legacy ↔ Optimized slider; Deploy CTA. |
| 2 | **Admin Sarah** | The Setup | Install IT Services + CMDB + Splunk SSO + dashboard, then 1:00 PM personalized Slack reveal. |
| 3 | **Employee Alex** | Zero-Ticket | Slack-first: "Need Figma access for NurtureAI" → granted in 4 seconds. |
| 4 | **Manager David** | The Proactive Save | Burnout flag for a teammate, Splunk breach causal-mapped, one-click remediation, RCA broadcast. |
| 5 | **Executive Marc** | The Wall Board | Boardroom view with animated counters and Why drill-downs grounding every number. |

## Persistent Q&A (every screen)

The whisper bar lives in the lobby and at the bottom of every chapter. Each chapter ships with:

- **4–6 suggestion chips** above the whisper, tuned to CEO-pitch questions for that persona.
- A **regex-matched FAQ** so free-text questions land on a guaranteed, on-script answer.
- A **▸ Source disclosure** on every conversational reply (Rule C3 — explainability).

Asking a question never breaks the running story — bubbles just append.

## Design principles honored

- **Ontology-driven** — every chapter visualizes the same Graph (CTO sees the Constellation, Manager sees the Causal Map, Executive sees the Wall Board derived from the same nodes).
- **Persona-centricity** — five personas, five mental models; the chassis adapts (avatar, accent token, hero copy, side-panel chrome).
- **Trust & transparency** — every Jarvis-driven action carries an Approve / Modify / Reject affordance; every metric carries a Why? grounding.
- **Slack-first conversational UX** — the Employee + Manager chapters render real Block-Kit-shape elements in the side panel.
- **Light + dark themes** — moon/sun toggle in the topbar; design tokens live at `:root` and are overridden under `[data-theme="dark"]` for WCAG-AA contrast in both palettes.

## Project layout

```
.
├── demo-v2/                ← the demo (served by GitHub Pages)
│   ├── index.html          ← Lobby + Workspace shells
│   ├── styles.css          ← themable design system (light + dark tokens)
│   ├── app.js              ← chapter-aware story engine (window.JARVIS API)
│   ├── stories/
│   │   ├── 00-lobby.js     ← Lobby meta-FAQ + suggested questions
│   │   ├── 01-cto-vikram.js
│   │   ├── 02-admin-sarah.js
│   │   ├── 03-employee-alex.js
│   │   ├── 04-manager-david.js
│   │   └── 05-exec-marc.js
│   └── assets/             ← Jarvis mark, Splunk logo, Datadog logo
├── context.md              ← project bootstrap (read this first when joining)
├── memory.MD               ← war-room channel summary
├── Autonomous ITSM Concept.md
└── Proactive ITSM War Room Concept Specification.md
```

## Run locally

```bash
cd demo-v2
python3 -m http.server 5176
# open http://127.0.0.1:5176/
```

No build step — pure vanilla HTML/CSS/JS, just refresh after any change.

## Story engine — adding a chapter or beat

Each chapter is a self-registering JS file under `demo-v2/stories/`. To add one:

```js
(function () {
  const chapter = {
    id: "your-chapter-id",
    title: "Your Beat",
    blurb: "One-sentence pitch shown on the lobby card.",
    persona: { name: "Persona", role: "Role", avatarText: "P", accent: "var(--accent-1)" },
    intentKeywords: ["persona", "shortcut"],
    suggestedQuestions: ["…", "…"],
    faqs: [{ match: /…/i, answer: "…", source: "where this comes from" }],
    story: [
      { type: "say", text: "Hi…" },
      { type: "status", text: "Doing the thing", duration: 1800, doneText: "Done" },
      // …
      { type: "end" }
    ]
  };
  (window.CHAPTERS = window.CHAPTERS || []).push(chapter);
})();
```

Then add a `<script src="stories/06-your-file.js"></script>` to `demo-v2/index.html`.

Available step types (defined in `demo-v2/app.js`): `say`, `status`, `progress`, `metric-board`, `slack-thread`, `ask`, `choose`, `browser`, `browser-close`, `wait-for`, `link-card`, `user`, `goto`, `end`.

## Themes

- Default theme is **light**. Toggle via the moon/sun button in the topbar; choice persists in `localStorage["jarvis-theme"]`.
- All surface colors live as design tokens in `:root` (light) and `[data-theme="dark"]` overrides them. Component CSS uses semantic vars (`--bg-1`, `--bg-soft`, `--linkcard-grad`, `--whisper-ring`, `--orb-*`, `--persona-*`, …) — never hardcoded `white`/hex literals.
