# Jarvis · v5 Mobile · Onboarding Day

A mobile-shaped port of the v5 Priya HR Onboarding demo. Same vanilla HTML / CSS / JS stack as the rest of the `demo-v*` family — no install, no build, just open a file.

## Open it

### Desktop preview (recommended for stakeholder demos)

```bash
open mobile-v5/preview.html
```

You'll see the mobile app rendered inside a CSS iPhone bezel with a device-size toggle (iPhone SE / 15 Pro / 15 Pro Max) and a light/dark switch. Pixel-perfect for screenshots and deck slides.

### Raw mobile page (browser, no bezel)

```bash
open mobile-v5/index.html
```

Resize the browser window to phone-width (~390px) to see the mobile layout. Useful for quick edits.

### On your real phone

Run a tiny local server so the phone on your Wi-Fi can reach the file:

```bash
cd mobile-v5
python3 -m http.server 8080
```

Then on your phone, open `http://<your-mac-ip>:8080/index.html`. Tap **Share → "Add to Home Screen"** for an app-style icon and a full-screen launch (the `apple-mobile-web-app-capable` meta tag is already set up).

## What it covers

The full v5 chapter, faithful 1:1 to `demo-v5/`:

1. **Home** — Greeting, four chiclets (Onboard / Approvals (4) / Joiners / Policy), and three live cards: *Awaiting your approval*, *On your radar*, *Worth knowing today*.
2. **Tap "Onboard a new hire"** → slide into chat, Priya's prompt posts, two status lines run (position lookup, role requirements), Jarvis acknowledges in plain English.
3. **Hardware approval card** — Mac Pro $4,200 vs the $3,000 L4 budget, itemised, with three branches:
   - **Approve** → orchestrator releases.
   - **Decline** → Jarvis puts the order on hold and pings Procurement.
   - **Ask a question** → Jarvis explains the math, then re-asks with three follow-up choices (*Approve as-is / Approve, drop one monitor / Decline*).
4. **Multi-agent fan-out** — nine specialist agents, rows revealing ~220 ms apart, each pill cross-fading from `Queued` to its final state (Done / Ordered / Pending). Footnote: *Done in 11 seconds · 1 item pending delivery.*
5. **Finale** — *"No tickets. No back-and-forth emails. No chasing."*

The back arrow in the app bar resets the story and returns to home — replay the chapter as many times as you need during a demo.

## File map

```
mobile-v5/
  index.html        # The mobile app. Designed for 390x844, scales to SE/Pro Max.
  preview.html      # Desktop wrapper: iPhone bezel + iframe + device toggle.
  styles.css        # Design tokens (light + dark) + every component style.
  app.js            # Story engine: home, chat, approval, fan-out, finale.
  data/
    priya.js        # Story data verbatim from demo-v5/stories/03-hr-priya.js
  assets/
    jarvis-mark.png # Favicon + Add-to-Home-Screen icon.
  README.md         # This file.
```

Five hand-written files. No `package.json`, no `node_modules`, no build step.

## How it maps to `demo-v5/`

| `demo-v5/` (desktop)                                | `mobile-v5/` (mobile)                              |
|-----------------------------------------------------|----------------------------------------------------|
| `app.js` HOME_CHICLETS / SIGNOFFS / TRENDING / DIGEST | `data/priya.js` (same data, no UI rewrites)        |
| `stories/03-hr-priya.js` chapter beats              | `data/priya.js` `STORY.beats`                      |
| `app.js` streamJarvis / status lines / approval-card | `app.js` `streamText` / `statusLine` / `approvalCard` |
| `app.js` task-list with row stagger                 | `app.js` `taskList` (same 220 ms / 360 ms cadence) |
| `styles.css` `:root` tokens                         | `styles.css` same `:root` tokens, mobile spacing   |
| Sidenav + multi-pane workspace                       | Single-screen, two views, slide transition         |

If you change a Priya dialogue line in the desktop demo, mirror the same edit in `mobile-v5/data/priya.js` so the two stay in sync.

## Customizing

- **Theme** — flips on `<html data-theme="dark">`, follows `prefers-color-scheme` when no explicit theme is set. The desktop wrapper persists your choice in `localStorage`.
- **Device size** — the bezel uses CSS variables (`--phone-w`, `--phone-h`, `--bezel`, `--radius`) on `.phone[data-device="…"]`. Add new presets by adding a new `data-device` block in `styles.css`.
- **Persona accent** — change `--persona-hr` in `styles.css` (it cascades to the chiclet icons, approval card border, primary CTA, status pills, etc.).

## Known caveats

- The animated text streaming uses a simple `setTimeout` loop at ~55 cps — fine for demos, not optimised for accessibility users with reduced motion. The `@media (prefers-reduced-motion: reduce)` block in `styles.css` already short-circuits the slide transition.
- The CSS iPhone bezel is a *shape* — it doesn't ship the actual hardware curve, so on huge desktop screens the proportions may look slightly stylised. That's intentional — the goal is "clearly an iPhone" without the licensing of a real product render.
- "Add to Home Screen" works on iOS Safari only when served over HTTPS (or `localhost`). Bare `file://` opens won't show the install prompt; use the `python3 -m http.server` path above.
