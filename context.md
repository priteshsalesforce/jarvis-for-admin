# 🧠 Session Context — Jarvis for Admin

> **How to use this file in a new Claude Code session:**
> Paste the prompt below (or run `Read /Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/context.md`) at the very start of the session. Claude will rehydrate the full working context — project layout, story engine, SOT, and where we left off — without re-discovering anything.

---

## 🚀 Bootstrap Prompt (copy–paste this into a fresh session)

```
You are continuing work on "Jarvis for Admin" — a Proactive Agentic ITSM end-to-end demo.

Before doing anything else:
1. Read /Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/context.md  (this file — full project context)
2. Read /Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/memory.MD  (Source of Truth — channel summary, mission, deadlines)
3. Read /Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/demo/story.js  (current demo flow — this is what I edit most)
4. Skim /Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/demo/app.js  (story engine — usually do NOT edit)

After reading, give me a 5-line status: mission, deadline, current demo coverage, open todos, and what file I most likely want to edit next. Then wait for my instruction.
```

---

## 📍 Ground Truth — Project Layout

```
/Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/
├── context.md                                          ← THIS FILE (session bootstrap)
├── memory.MD                                           ← SOT (channel summary, mission, people, todos)
├── Autonomous ITSM Concept.md                          (31 KB — concept doc)
├── Proactive ITSM War Room Concept Specification.md    (1.2 MB — full spec)
└── demo-v2/                                            ← THE single demo (light + dark themable)
    ├── index.html        ← markup + entry point (theme-toggle in topbar right)
    ├── styles.css        ← themable design system (`:root` light, `[data-theme="dark"]` overrides)
    ├── story.js          ← THE DEMO SCRIPT — edit this to change beats
    ├── app.js            ← story engine + PAGES registry + theme-toggle wiring
    └── assets/
        ├── jarvis-mark.png         (theme-agnostic Jarvis mark — favicon, hero orb, chat avatars)
        ├── Splunk.png
        └── datadog.png
```

> **Note:** The earlier dark-only `demo/` folder was removed on 2026-05-09 when the two versions were merged. Only `demo-v2/` exists now; renaming it back to `demo/` is a pending cleanup.

### ⚠️ Stack correction
Earlier session context described the project as "single-file React (`web/src/App.jsx`), Vite, Tailwind, Lucide". **That is wrong.** Actual stack:

- **Vanilla HTML + CSS + JS** — no React, no Vite, no Tailwind, no build step.
- Open `demo/index.html` directly in a browser, or serve with any static server (e.g. `python3 -m http.server 5174` from `demo/`).
- No `package.json`, no `node_modules`, no `web/` directory.

---

## 🎯 Mission (from `memory.MD`)

- **Goal:** Proactive Agentic ITSM end-to-end demo
- **Deadline:** Friday after 2026-05-08 (≈ 1 week out)
- **Approved demo beat #1:** post-purchase link → auth → Jarvis on web → "Setup ITSM" CTA → install → prompt for input
- **Two UX concepts in flight:**
  1. *Vibe coding* — agent creation via prompts + IT domain packs
  2. *Control Tower* — headless command centre with agent observability & evals
- **Tech threads:** Mule Agent Fabric (runtime relationships) + CMDB (design-time relationships)

### 🎞️ Full 4-Vignette Demo Narrative (Tanmay's first draft, 2026-05-08)

1. **Vignette 1 — The Setup**
   Customer gets a post-purchase link → authenticates → Jarvis opens on web → welcome screen with "Setup ITSM" CTA → installation runs → prompts user for input → Domain pack & CMDB setup completes → link generated to view CMDB dashboard.
   *(This is what `demo/story.js` currently covers, partially.)*
2. **Vignette 2 — IT Landscape in the Making**
   User clicks the dashboard link → sees CIs being discovered → browses a service graph → clicks on nodes for CI details.
3. **Vignette 3 — Control Tower & Observability** (a few days later)
   Admin monitors IT infra health → Splunk threshold breach detected → Agent logs an incident → Remediation agent executes fix → Relevant stakeholders notified with RCA.
4. **Vignette 4 — Agent Orchestration for Complex Scenarios**
   *(Ramprasadh clarified: this is NOT a generic "human in the loop" story — it's about orchestrating multiple agents through a complex scenario. Scope still being defined.)*

### 🖥️ Control Tower Prototypes (shared 2026-05-08)

- **Ramprasadh's mock prototype** for the Agent & Asset Health Control Tower — to be brainstormed and finalised on Monday.
- **Shantanu's prototype** built with colleagues, originally prepared for a Marc review.
- **Monday's focus:** finalise the Control Tower flow based on these two prototypes.

### People
| Name | Role |
|---|---|
| Ramprasadh Kothandaraman | Concept spec author; strategic alignment; Control Tower prototype owner |
| Virag Shah | PM concept review; UX vision; story approver |
| Amarendra Kondapalli | Tech input — Agent as CI / Mule Agent Fabric |
| Tanmay Jyot | Demo story flow proposer (4-vignette narrative author) |
| Shantanu Singh | Shared second Control Tower prototype (Marc review); driving CX/content urgency |
| Madhuri Mishra | Content partner — to pair with Pritesh on Jujhar-ready content |
| Nasahn | Recently added to the channel (2026-05-08, 7:54 PM) |

---

## 🎬 Current Demo Coverage (`demo/story.js`)

The demo currently plays this flow when the user clicks **"Install ITSM"** or whispers `install itsm`:

1. *Starting setup…*
2. **Status:** Checking licences ✓
3. **Ask:** Install CMDB? → `Yes` (install branch) | `Skip for now` (skip branch)
4. **Progress:** Installing CMDB package
5. **Choose:** Splunk vs Datadog observability service
   - **Splunk branch (full):** opens fake SSO page in side panel → waits for login click → exchanges tokens → closes panel → provisions pipelines → configures routing
   - **Datadog branch (placeholder):** one line, then jumps to dashboard
6. **Link card:** Proactive ITSM Live Dashboard (opens fake dashboard in side panel)
7. End

### Side panel (fake browser) pages registered in `window.PAGES` (`app.js`):
- `splunk-auth` — fake Splunk SSO; "Login" button dispatches `splunk-login` event
- `itsm-dashboard` — fake Control Tower with tiles + sparkline-style bars

---

## 🧩 Story Engine API — Cheat Sheet

`window.STORY` is an array of step objects. Engine reads them in order. Available `type` values:

| type | Purpose | Key fields |
|---|---|---|
| `say` | Jarvis text bubble | `text`, `pause?` |
| `status` | Spinner → ✓ | `text`, `duration?`, `doneText?` |
| `progress` | Progress bar fills | `text`, `duration?`, `doneText?` |
| `ask` | Inline CTA buttons | `text`, `choices: [{label, value, primary?, glyph?, goto?}]` |
| `choose` | Card-grid logo picker | `text`, `options: [{label, value, logo, color, sub, goto?}]` |
| `browser` | Open right-side fake browser | `url`, `page` (key in `window.PAGES`) |
| `browser-close` | Close side panel | — |
| `wait-for` | Block until DOM event from a page | `event`, `text?` |
| `link-card` | Rich clickable card that opens a page | `title`, `sub?`, `url`, `page`, `icon?` |
| `user` | Manual user bubble | `text` |
| `goto` | Jump to a step `id` | `to` |
| `end` | Terminate, show restart button | — |

Every step may also carry: `id` (for `goto` targets) and `pause` (ms before running).

To add a new fake browser page: register a factory under `window.PAGES["my-key"] = (panel, ctx) => { panel.innerHTML = "..."; }`. To advance the story from inside that page, call `panel.dispatchEvent(new CustomEvent("my-event"))` and pair it with a `{ type: "wait-for", event: "my-event" }` step.

---

## 📝 Open Todos (from `memory.MD` + observed gaps)

- [ ] Wire end-to-end demo using existing assets (delivered, in-progress, planned)
- [ ] Build out demo beats **beyond beat #1** (we have install/CMDB/Splunk/dashboard; need post-install proactive incident scenario, agent observability moments, etc.)
- [ ] Flesh out **Datadog branch** (currently a 1-line placeholder)
- [ ] Add **Control Tower** deeper view (current dashboard is static tiles) — finalise on Monday using Ramprasadh's + Shantanu's prototypes
- [ ] Add **"Vibe coding" agent creation** flow
- [ ] Gather PM feedback on concept review doc
- [ ] **Vignette 2** — CMDB dashboard with CI discovery, service graph, node click → CI detail view
- [ ] **Vignette 3** — Splunk threshold breach → agent-logged incident → remediation agent fix → stakeholder RCA notification
- [ ] **Vignette 4** — define + storyboard "agent orchestration for complex scenarios" (per Ramprasadh's clarification — NOT just human-in-the-loop)
- [ ] **CX / content (HIGH PRIORITY)** — pair with @Madhuri Mishra on Jujhar-ready content as we build (Shantanu flagged: no separate CX review pass later)

---

## 🛠 How to Run Locally

```bash
cd "/Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/demo-v2"
python3 -m http.server 5174
# then open http://127.0.0.1:5174/
```

Or just double-click `demo-v2/index.html` — works because there's no build step.

### 🌗 Theming (light + dark)
- Default theme = **light**. A moon/sun toggle lives in the top-bar right (next to the "Jarvis online" pill).
- Implementation: design tokens are declared once at `:root` (light) and overridden under `[data-theme="dark"]` on `<html>`. Surface-y CSS uses semantic vars (`--bg-1`, `--bg-soft`, `--bg-chrome`, `--linkcard-grad`, `--whisper-ring`, `--orb-a-color`, `--orb-b-color`, …) so most of the stylesheet is theme-agnostic.
- User's choice is persisted in `localStorage` under the key `jarvis-theme`. An inline `<head>` script applies the saved theme before paint to avoid a flash.
- To tweak a theme's look, edit only the matching token inside `:root` / `[data-theme="dark"]` — never reintroduce hardcoded `white` or `#fff`.

---

## 🧭 Editing Conventions

- **Change demo flow** → edit `demo-v2/story.js` only (steps array + `PAGES`)
- **Change visual design / theme** → edit `demo-v2/styles.css`. To re-tone a theme, only edit the token blocks (`:root` for light, `[data-theme="dark"]` for dark). Don't reintroduce raw `white` / hex values inside component rules — use the semantic vars.
- **Change engine semantics** (new step types, navigation) → edit `demo-v2/app.js`
- **Update mission/people/decisions** → edit `memory.MD`
- **Update this bootstrap context** → edit `context.md` (this file) whenever stack, layout, or major flow changes

---

## 💬 Chat UI Conventions

- **Two personas:** `Jarvis` (left, with mark avatar) and `Admin` (right, with "Adm" avatar tile).
- **Consecutive grouping:** when the same persona speaks twice in a row, the avatar and name label are hidden on the continuation bubbles (CSS class `bubble--continued`, applied automatically by `app.js` via the `lastPersona` tracker). Reset whenever the thread is cleared (`startDemo`, `resetDemo`, suggestion/whisper stubs).

---

## 🎬 Lobby + 5 Persona Chapters (the CEO pitch — added 2026-05-11)

The demo is now a **persona-switcher lobby + five cinematic chapters** designed to sell the future of Agentic ITSM to the Salesforce CEO. The chassis (Jarvis orb, chat thread, side-panel "browser", dock, light/dark theme) is unchanged — only the entry point and the story library expanded.

### New layout
```
demo-v2/
├── index.html            ← Lobby + Workspace shells
├── styles.css            ← Existing tokens + new lobby/chapter styles (appended)
├── app.js                ← Chapter-aware engine (window.JARVIS API)
├── story.js              ← LEGACY (kept on disk; no longer loaded)
└── stories/
    ├── 00-lobby.js       ← Lobby meta-FAQ + suggested questions
    ├── 01-cto-vikram.js  ← "The Sale" + constellation page
    ├── 02-admin-sarah.js ← "The Setup" (ports old story.js) + 1 PM Slack reveal
    ├── 03-employee-alex.js ← "Zero-Ticket" + slack-page side panel
    ├── 04-manager-david.js ← "The Proactive Save" + team-health page
    └── 05-exec-marc.js   ← "The Wall Board" + wallboard page
```

### Run on port 5176 (5174 stays as the legacy fallback)
```bash
cd "/Users/pritesh.chavan/Documents/Cloude/Jarvis for Admin/demo-v2"
python3 -m http.server 5176
# open http://127.0.0.1:5176/
```

### The 5 chapters
| # | Persona | Title | Beat |
|---|---|---|---|
| 1 | CTO Vikram | The Sale | 60-second Phase-0 Neural Scan reveals $3.24M of waste; Legacy ↔ Optimized slider; Deploy CTA |
| 2 | Admin Sarah | The Setup | Install IT Services + CMDB + Splunk SSO + dashboard, then 1:00 PM personalized Slack reveal |
| 3 | Employee Alex | Zero-Ticket | Slack-first: "Need Figma access for NurtureAI" → granted in 4 seconds |
| 4 | Manager David | The Proactive Save | Burnout flag for Priya, Splunk breach causal-mapped, one-click remediation, RCA broadcast |
| 5 | Executive Marc | The Wall Board | Boardroom view with animated counters + Why drill-downs grounding every number |

### New engine APIs (`app.js`)
- `window.JARVIS.startChapter(chapterId)` — swaps persona, hero, and story; clears thread; runs.
- `window.JARVIS.backToLobby()` — closes panel, hides workspace, shows lobby.
- `window.CHAPTERS` — registry pushed to by each `stories/*.js` file. Lobby reads it to render persona cards.
- `window.LOBBY` — meta-FAQ + suggested questions for the lobby's persistent chat.
- New step types: `metric-board` (animated KPI tiles inline) and `slack-thread` (compact Block-Kit messages inline).
- Persona-aware `userBubble(text, persona)` — each chapter's user bubbles get an avatar tile coloured by its accent token (`--persona-cto`, `--persona-admin`, `--persona-employee`, `--persona-manager`, `--persona-exec`).
- `runToken` guards against stale story loops when the user rapidly switches chapters.

### Persistent Q&A (whisper bar on every screen)
- Whisper bar lives in **both** the lobby (centered) and the dock (bottom of stage). Same handler.
- Each chapter declares `suggestedQuestions` (4–6 chips above the whisper) and `faqs` (regex → answer + optional `source`).
- Free-text routing precedence: special phrases ("back to lobby", "play all", "install itsm") → chapter-intent match (lobby only) → FAQ regex match → polite fallback that re-renders the chips inline.
- Every Q&A answer can include a `source:` string that renders a `▸ Source` disclosure on the bubble (Rule C3 — explainability).

### New side-panel pages registered on `window.PAGES`
| Key | Chapter | What it shows |
|---|---|---|
| `constellation` | CTO | CSS-only globe with pulsing red→teal nodes + Legacy↔Optimized slider |
| `splunk-auth`   | Admin | (existing) Splunk SSO mock with Login → dispatches `splunk-login` |
| `itsm-dashboard`| Admin | (existing) CMDB discovery dashboard with animated 78% bar |
| `slack-page`    | Employee | Auto-playing Slack thread with attachment + actions |
| `team-health`   | Manager | Sentiment heatmap + SEV-2 incident card with Approve/Modify/Reject |
| `wallboard`     | Executive | Animated KPI tiles + Why drill-downs + Top Risks Averted feed |

### Key conventions
- Each chapter file is self-registering — pushes to `window.CHAPTERS` + (optionally) extends `window.PAGES`.
- Persona accents are tokens (`--persona-cto` etc.), declared in `:root` and overridden in `[data-theme="dark"]` for WCAG-AA contrast.
- The `.choice` button (Splunk/Datadog picker) was redesigned to a horizontal grid layout: logo on the left, name + sub stacked on the right (CSS Grid, no JS markup change).
- The legacy install flow is preserved as a special whisper phrase (`install itsm` → routes to `JARVIS.startChapter("admin-sarah")`).

## 🔄 Context File Updates Log

- **2026-05-08** — Initial `context.md` created. Corrected stack (vanilla JS, not React/Vite/Tailwind). Captured story engine API and current demo coverage.
- **2026-05-08** — New Jarvis logo (gradient headphone outline, no face) in `demo/assets/jarvis-mark.svg` + `jarvis-wordmark.svg`. Renamed user persona "You" → "Admin" and added consecutive-bubble grouping (hides avatar/name on same-persona continuations).
- **2026-05-08 (evening)** — Channel activity after Nasahn was added: Ramprasadh shared Agent & Asset Health Control Tower mock prototype (8:35 PM); Shantanu shared a second Control Tower prototype from a Marc review (8:48 PM); Tanmay posted first draft of the **4-vignette demo story** (8:50 PM); Ramprasadh clarified Vignette 4 = "agent orchestration for complex scenarios", not human-in-the-loop (8:55 PM); Shantanu flagged urgent CX ask — Madhuri + Pritesh pair on content immediately to be Jujhar-ready, no separate CX review pass later (9:53 PM). **Monday's focus:** finalise Control Tower flow from the two prototypes.
- **2026-05-09** — Merged the dark and light demo folders. Deleted the old dark-only `demo/`. The light pastel `demo-v2/` is now the single demo and is **themable**: a moon/sun toggle in the top-bar right swaps `<html data-theme="dark">`. All hardcoded surface colors in `styles.css` were promoted to semantic tokens (`--bg-1`, `--bg-soft`, `--bg-chrome`, `--linkcard-grad`, `--whisper-ring`, `--orb-*`, …); `[data-theme="dark"]` overrides them. Theme choice persists in `localStorage` under `jarvis-theme`; an inline `<head>` script applies it pre-paint to avoid a flash.
- **2026-05-11** — Major expansion: persona-switcher **Lobby** + five **chapters** (CTO, Admin, Employee, Manager, Executive) for the Salesforce CEO pitch. New `stories/` directory with self-registering chapter files. Persistent Q&A whisper bar with per-chapter FAQ + suggested-question chips + `▸ Source` grounding. Persona-aware user bubbles. New step types (`metric-board`, `slack-thread`) and new side-panel pages (`constellation`, `slack-page`, `team-health`, `wallboard`). Now served on **port 5176** (5174 still works against the same files for parity). Old `story.js` left on disk but no longer loaded.
