# Jarvis · v4 Mobile (IT Manager · IndiaFirst Bank)

A vanilla HTML / CSS / JavaScript mobile port of `demo-v4`, built so the IT manager (John) can experience the **incident response** and **add-agent** stories on a phone — and so reviewers can preview both inside an iPhone bezel on the desktop.

The chrome mirrors the desktop webapp:

- **Hamburger lives on the top-LEFT** (matches the v4 sidenav rail position)
- **Profile sits inside the panel that the hamburger opens** — name, role, email, theme switch, sign-out — same shape as the desktop sidenav profile
- Workspace items (Tower / Insight / Horizon / Lens) and Settings are stacked above the profile, with a **Jarvis pill** just above it

## How to open it

### On a desktop (with bezel)

```bash
cd "Jarvis for Admin"
python3 -m http.server 8765
```

Then open:

- <http://127.0.0.1:8765/mobile-v4/preview.html>  → wraps the app in an iPhone bezel
- <http://127.0.0.1:8765/mobile-v4/index.html>    → just the app, no bezel

### On a real phone

1. Make sure your laptop and phone are on the same Wi-Fi.
2. Find your laptop's LAN IP (`ipconfig getifaddr en0` on macOS).
3. On your phone, browse to `http://<your-laptop-ip>:8765/mobile-v4/`.
4. Tap **Share → Add to Home Screen** for a full-screen, native-feeling launch.

## Stories included

This app deliberately covers two of the v4 desktop stories — both originate from the home shell, just like in the webapp.

### 1. Open Incident — P1 on `card-auth`

How to fire it (any of these):

- Home card **Services to watch** → **Open incident** (red CTA on the top row)
- Chiclet **Recent incidents**
- Whisper bar — type *"open card payments incident"*

What you'll see (full thread, ~1 minute end-to-end):

1. **Detected** — `MonitoringAgent` raises the incident
2. **Triaged** — `DiagnosticsAgent` classifies P1, hands off to `ObservabilityAgent`
3. **Investigating** — 98% of failures correlate to deploy `v3.7.1`
4. **Root cause (HUMAN GATE)** — `RemediationAgent` proposes rollback to `v3.7.0`; an **Approval card** asks John to *Approve mitigation / Defer 30m / Request more info*
5. **Mitigating** — runs only after Approve; `ChangeAgent` logs `CHG-44102`
6. **Resolved** — error rate drops to baseline; a **post-incident summary card** offers *Share to #ops-incidents / Open in Lens / Download PDF*

The incident header banner pins to the top of the thread and the elapsed-time chip ticks live until the resolved phase freezes it.

### 2. Add Agent — 4-question wizard + 6 pre-flight evals

How to fire it (any of these):

- Chiclet **Add Agent** (top-right of the home grid)
- Whisper bar — type *"add agent"*

What you'll see:

1. **Q1 (free text)** — Jarvis asks for the JTBD; type into the whisper bar (e.g. *"rebalance our AWS spend nightly"*)
2. **Q2 (chips)** — Domain (Reliability / Cost / Identity / Compliance), pre-selected by a keyword heuristic
3. **Q3 (chips)** — Use the suggested name, or *Type my own* (a second whisper-bar prompt)
4. **Q4 (chips)** — Autonomy level L1–L4 (L2 recommended), with a short blurb under each
5. **Preview agent card** — Cancel / Create
6. **Pre-flight evals** — 6 checks stream in (intent → ontology → tool scopes → guardrails → audit → trust)
7. **Finale** — *"<AgentName> is live"* bubble + a toast confirming Cockpit slot, audit trail wired, trust 88%

## How it maps to `demo-v4`

| Mobile element                                  | Desktop counterpart in `demo-v4`                  |
| ----------------------------------------------- | -------------------------------------------------- |
| Hamburger top-left → drawer                     | `aside.sidenav` rail on the left                   |
| Drawer items (Tower / Insight / Horizon / Lens) | `.sidenav__group` workspace buttons                |
| Drawer profile block (name + role + email)      | `#navProfile` button + the profile menu            |
| Drawer Jarvis pill                              | `.sidenav__jarvis` pinned to the bottom of the rail|
| Home greeting + 4 chiclets                      | `home-shell` greeting + chiclet rail               |
| Awaiting your approval card                     | `home__signoffs` card                              |
| Services to watch card                          | `home__trending` card (with `Open incident` CTA)   |
| Worth knowing today card                        | `home__digest` card                                |
| Incident timeline + approval card               | `INC_PHASES` engine + `awaitApproval` flow         |
| Add Agent wizard                                | `agentWizard` in `demo-v4/app.js`                  |
| Pre-flight evals list                           | `agentWizard._evals` + `_runEvalsThenFinalize`     |

All copy is verbatim from `demo-v4/app.js` — if you change a string here, change it there too.

## File layout

```
mobile-v4/
├─ index.html         — the app shell (status bar / appbar / drawer / view stack / composer)
├─ preview.html       — desktop wrapper with iPhone bezel + device + theme toggles
├─ styles.css         — tokens + drawer + home + chat + incident + wizard styles
├─ app.js             — engine (drawer, view switch, chat bubbles, incident, wizard)
├─ data/
│  └─ john.js         — persona + home content + INCIDENT phases + AGENT wizard data
├─ assets/
│  └─ jarvis-mark.png — favicon + branding mark
└─ README.md          — this file
```

## Notes

- **Drawer items** other than Settings are intentionally **locked** — the chat assistant covers those surfaces in this demo (matching `is-locked` on the desktop sidenav).
- **Theme** persists via `localStorage` under `jarvis-mobile-v4-theme`, otherwise follows the system.
- **Reduced motion** is respected — slide and bubble animations collapse to instant.
- The composer has a **fast-path keyword router**: typing words like *"incident"*, *"P1"*, *"card payments"* jumps to the incident; *"add agent"* / *"new agent"* jumps to the wizard.
