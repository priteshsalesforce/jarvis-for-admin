# Jarvis for Admin · Proactive ITSM Demo

> Interactive demo of the **Proactive Agentic ITSM** narrative — Jarvis walks an admin through licence checks, CMDB install, observability pickup, and the live ITSM dashboard handoff.

## 🚀 Live demo

**https://priteshsalesforce.github.io/jarvis-for-admin/**

Click **"Install IT Services"** (or whisper *"install IT services"*) on the welcome screen to play the flow.

The previously separate dark (`/`) and light (`/v2/`) builds have been **merged into a single themable demo** at the root URL. The legacy `/v2/` URL has been retired — please use the root URL.

## 🌗 Light + Dark themes

A moon/sun toggle in the top-bar right swaps the entire UI between two palettes:

- **Light** — pastel SLDS-inspired surface, blue→violet brand gradient (default).
- **Dark** — deep navy/violet surface, brighter accent variants for contrast.

Implementation:
- All design tokens live at `:root` (light) and are overridden by `[data-theme="dark"]` on `<html>`.
- Component CSS uses semantic vars (`--bg-1`, `--bg-soft`, `--bg-chrome`, `--linkcard-grad`, `--whisper-ring`, `--orb-*`, …) — never hardcoded `white`/hex literals.
- The user's choice is persisted in `localStorage["jarvis-theme"]`. An inline `<head>` script applies it before paint to avoid a flash.
- The top bar uses an iOS-style frost (`backdrop-filter: saturate(180%) blur(24px)`) so the page gradient and ambient orbs bleed through.

## 🎬 What the demo covers

1. Admin lands on the welcome screen and meets Jarvis.
2. Clicks **Install IT Services** → licence check.
3. Jarvis offers to install the **CMDB package**; admin approves.
4. Jarvis asks which observability service to wire up — **Splunk** or **Datadog**.
5. Splunk SSO opens in the right-side "browser" panel; admin signs in; tokens are exchanged.
6. Pipelines provisioned, incident routing configured.
7. Right-side panel auto-opens the **CMDB discovery dashboard** (CI inventory + animated discovery progress).

## 🧱 Project layout

```
.
├── index.html        ← markup + entry point (theme toggle in top-bar right)
├── styles.css        ← themable design system (`:root` light, `[data-theme="dark"]` dark)
├── story.js          ← THE demo script — edit to change narrative beats
├── app.js            ← story engine + PAGES registry + theme + side-panel anim
└── assets/
    ├── jarvis-mark.png   (theme-agnostic Jarvis mark — favicon, hero, avatars)
    ├── Splunk.png
    └── datadog.png
```

## 🔧 Tech notes

- Vanilla HTML / CSS / JS — no build step, no dependencies.
- The whole flow lives in **`story.js`** as a `window.STORY` step array. Easy to iterate on beats.
- Engine + step types (`say`, `status`, `progress`, `ask`, `choose`, `browser`, `browser-close`, `wait-for`, `link-card`, `user`, `goto`, `end`) live in **`app.js`** and rarely need editing.
- Side-panel fake browser pages (Splunk SSO, CMDB dashboard) are registered under `window.PAGES` in `story.js`.
- The right-side panel uses a stable two-track CSS Grid (`1fr 0px` ↔ `1fr 540px`) plus an absolutely-positioned, `translateX`-animated browser card, so opening/closing slides smoothly without disturbing the chat side.

## 🛠 Run locally

```bash
# Any static server works; Python's is everywhere:
python3 -m http.server 5174
# then open http://127.0.0.1:5174/
```

Or just double-click `index.html` — there's no build step.

## 🗺️ Roadmap

Planned next iterations:

- **Vignette 2 — IT Landscape in the making**: live CMDB / service-graph view with CI discovery and node-detail drill-down.
- **Vignette 3 — Control Tower & Observability**: Splunk threshold breach → agent-logged incident → remediation agent fix → stakeholder RCA notification.
- **Vignette 4 — Agent orchestration**: multi-agent collaboration on a complex scenario (not just human-in-the-loop).
- **Datadog branch** — currently a one-line placeholder; flesh it out as a parallel install path.
- **"Vibe coding" agent creation** — admin describes the org in natural language and Jarvis assembles the agents.
