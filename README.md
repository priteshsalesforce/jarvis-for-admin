# Jarvis for Admin · Proactive ITSM Demo

> Interactive demo of the **Proactive Agentic ITSM** narrative — first walkthrough.

## 🚀 Live demos

| Version | URL | Style |
|---|---|---|
| **v1 — Proactive ITSM** (dark, Jarvis-led setup) | **https://priteshsalesforce.github.io/jarvis-for-admin/** | Sci-fi dark theme |
| **v2 — Agentic Portal Builder** (light, Vibe-coded) | **https://priteshsalesforce.github.io/jarvis-for-admin/v2/** | Pastel light theme matching SLDS reference |

In v1, click **"Install IT Services"** on the welcome screen.
In v2, type or pick a prompt and click **"Get Started"**.

## What it covers

The approved opening sequence:

1. Admin lands on the welcome screen and meets Jarvis.
2. Clicks **Install ITSM** → license check.
3. Jarvis offers to install the **CMDB package**; admin approves.
4. Jarvis asks which observability service to wire up — **Splunk** or **Datadog**.
5. Splunk SSO opens in a side-panel "browser"; admin signs in; tokens are exchanged.
6. Pipelines provisioned, incident routing configured.
7. Live **Proactive ITSM dashboard** is handed off as a clickable link card.

## Tech notes

- Vanilla HTML / CSS / JS — no build step, no dependencies.
- The whole demo flow lives in **`story.js`** as a step array. Easy to iterate on narrative beats.
- Engine + step types (`say`, `status`, `progress`, `ask`, `choose`, `browser`, `wait-for`, `link-card`, `goto`, `end`) live in **`app.js`** and rarely need editing.
- Side-panel "fake browser" pages (e.g. Splunk SSO, ITSM dashboard) are registered under `window.PAGES` in `story.js`.

## Run locally

```bash
# Any static server works; Python's is everywhere:
python3 -m http.server 5174
# then open http://127.0.0.1:5174/
```

## What's intentionally not yet here

Planned next iterations:
- Self-building service graph / live CMDB visualization
- Proactive resolution scenarios (VPN cert renewal, server memory pressure, customer-impact correlation)
- AI Control Tower with multi-vendor agent observability
- "Vibe-coded" admin describes-org-in-natural-language setup
