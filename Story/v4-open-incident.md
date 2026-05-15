## Companion Mini-Story #2: Open Incident — P1 on Card Payments (v4 home shell)

**Persona:** John, IT Manager · IndiaFirst Bank.

**Entry points:** *Two ways to land here, both wired to the same flow:*

- **(Primary) Services to watch row** — On the v4 home, the *Services to watch* card lists "**Card payments — declines climbing fast**" *(sub: card-auth error rate up 3.4× in 24h. SLA breach likely within ~6h.)* with a red "high" pill. The whole row is a button — its CTA reads **Open incident**.
- **(Alternate) Critical toast** — A bottom-right director's note can fire *"Card payments are failing right now — card-auth error rate just spiked to **8.7%** — past the **5% SLA limit**. Agents have already started triaging."* with two actions: **Open incident** (primary) and *Snooze 10 min*.

John clicks **Open incident**.

Action: *Home tears down. The workspace splits — chat panel on the left, the **Live incident** page mounts in the right pane. A live elapsed counter starts ticking ("Live · 00:00") in both the in-stage chiclet bar and the page header. The incident header reads:*

> **INC-2026-0514-001 · P1 · Card Authorization** — *Card payments — declines crossing SLA threshold*. Affected: ~340 merchants · ~12,000 active cardholders · India (all regions).

*A status banner shows the current phase ("Detected"), and below it an empty timeline with the live "**MonitoringAgent · Detecting** — Tracking the spike across regions" row pulsing at the bottom.*

---

### Phase 1 — Detected *(auto-advances ~4.5s)*

Jarvis: **P1 on card-auth.** Error rate just crossed the SLA hard threshold (8.7%). I've routed the incident to **DiagnosticsAgent** and **ObservabilityAgent** — they're starting triage now. I'll keep you posted here.

*Timeline rows tick in:*
- `+0s` **MonitoringAgent** — Threshold crossed — card-auth error rate at 8.7% (SLA limit 5%).
- `+2s` **MonitoringAgent** — Raised incident INC-2026-0514-001 · paged the on-call rota.

*Chiclet bar (above the dock) shows quick actions:* **Acknowledge** · **Page on-call** · **Open runbook** · **Open war room**.

---

### Phase 2 — Triaged *(auto-advances ~6s)*

Jarvis: DiagnosticsAgent confirms **P1 customer impact**. Routing trace correlation to ObservabilityAgent.

Live activity: *"DiagnosticsAgent · Triaging — Classifying severity and customer impact"*.

- `+5s` **DiagnosticsAgent** — Classified as P1 — customer-facing, SLA breach in &lt;6h if untreated.
- `+8s` **DiagnosticsAgent** — Handing off to ObservabilityAgent for trace correlation.

*Brief handoff beat:* "ObservabilityAgent · Handing off…" then phase 3 starts.

---

### Phase 3 — Investigating *(auto-advances ~7.5s)*

Jarvis: ObservabilityAgent has narrowed the blast radius — **98% of failures are on build v3.7.1** which went live 4h ago. No infra change in the window, so we're looking at a regression.

Live activity: *"ObservabilityAgent · Correlating — Joining failed-auth traces with the recent deploy"*.

- `+12s` **ObservabilityAgent** — Correlated 2,340 failed-auth traces — 98% from card-auth pods on build v3.7.1.
- `+14s` **ObservabilityAgent** — Pulled deploy timeline: v3.7.1 went live 09:02 IST (4h 12m ago).
- `+16s` **DiagnosticsAgent** — No infra change inside the window — pointing at a code regression.

---

### Phase 4 — Root cause *(human-decision gate)*

Jarvis: **Root cause confirmed.** v3.7.1 tightened the 3DS issuer timeout to 1.8s — Visa flows where the issuer takes 2–3s now fail. **RemediationAgent** has a rollback plan ready (revert to v3.7.0). I'll post the **approval below** the moment the plan is fully drafted — your call from there.

Live activity: *"DiagnosticsAgent · Pinpointing — Bisecting the regression in v3.7.1"*.

- `+20s` **DiagnosticsAgent** — Root cause: v3.7.1 lowered the 3DS issuer timeout from 3s → 1.8s. Visa flows where the issuer takes 2–3s now fail.
- `+23s` **RemediationAgent** — Plan ready: roll back card-auth to v3.7.0 (last known-good, 2 days in prod, zero regressions).
- `+25s` **RemediationAgent** — Awaiting human approval — rollback affects 340 merchants · 12,000 cardholders.

The "Aha" Moment:

Action: *The live row settles into a calmer "**RemediationAgent · Awaiting approval** — Roll back card-auth to v3.7.0 — needs your call". An **Approval card** lands prominently in the chat thread:*

> **Approval needed · RemediationAgent**
> **Roll back card-auth to v3.7.0?**
>
> *Last known-good build (2 days in prod, zero regressions). Will affect **340 merchants** and **~12,000 cardholders** mid-rollout — error rate should return to baseline within ~60s.*
>
> | | |
> |---|---|
> | **Plan** | Revert v3.7.1 → v3.7.0 across all card-auth pods |
> | **Audit** | Change record CHG-44102 will be linked |
> | **Reversibility** | Rollback is reversible for 30 days |
>
> CTAs: **Approve mitigation** *(primary)* / *Defer 30 min* / *Request more info*

*The chiclet bar mirrors the same actions:* **Approve mitigation** · *Defer 30 min* · *Request more info*.

John's three branches:

**(a) Approve mitigation →** John (user bubble): *Approve mitigation*.
Jarvis: On it. **RemediationAgent** is rolling back to **v3.7.0** now — **ChangeAgent** will log **CHG-44102** for the audit trail. I'll keep you posted as the rollout completes. *(Phase advances.)*

**(b) Defer 30 min →** John (user bubble): *Defer 30 min*.
Jarvis: Paused. I'll re-prompt you at **13:15 IST** — error rate is still at 8.7%, so SLA breach window is shrinking. Ping me sooner if you want to act early.

**(c) Request more info →** John (user bubble): *Request more info*.
Jarvis: **DiagnosticsAgent** will draft a deeper RCA in ~5 min — I'll post it here with the affected merchant breakdown and the v3.7.0 → v3.7.1 diff.

---

### Phase 5 — Mitigating *(auto-advances ~7s, only if Approved)*

Jarvis: Approved — RemediationAgent is rolling back to v3.7.0. ChangeAgent has logged **CHG-44102** for the audit trail.

Live activity: *"RemediationAgent · Rolling back — Deploying v3.7.0 across card-auth pods"*.

*Chiclet bar swaps to a single, disabled spinning chip:* **Rollback in progress…**.

- `+27s` **RemediationAgent** — Rollback approved by John — starting deploy of v3.7.0.
- `+29s` **ChangeAgent** — Created change record CHG-44102 · linked to incident · audit trail captured.
- `+32s` **RemediationAgent** — Rollout 50% … 100%. v3.7.0 is live across all card-auth pods.

---

### Phase 6 — Resolved (Verifying → Wrap-up)

Jarvis: Rollback is live and the error rate is dropping. **ObservabilityAgent** is verifying it holds at baseline — I'll surface the wrap-up once the post-incident summary is ready.

Live activity: *"ObservabilityAgent · Verifying — Watching error rate hold at baseline"*. *Chiclet bar shows a calm spinning chip:* **Verifying baseline…**.

- `+36s` **ObservabilityAgent** — Error rate dropping: 8.7% → 0.4% (back to baseline).
- `+40s` **ObservabilityAgent** — Verified stable for 60s — closing the incident.
- `+42s` **ComplianceAgent** — Generated post-incident summary · saved to Lens · ready to share.

The Finale (the moment everything flips together):

Action: *In a single beat, the surfaces sync — the elapsed pill freezes and turns green ("**Resolved · 00:42**"), the page header banner re-styles to resolved, and the wrap-up chiclet bar replaces the spinner with four real actions:* **View summary** *(primary)* · *Download (.md)* · *Share to Slack* · *Close incident*.

Action: *Two synchronised confirmations land — a green **post-incident summary card** lands in chat AND in the right panel:*

> ✓ **Post-incident summary · ComplianceAgent**
> **Post-incident summary is ready**
>
> *ComplianceAgent drafted a full RCA with timeline, root cause, and follow-up actions.*
>
> | | |
> |---|---|
> | **Incident** | INC-2026-0514-001 · Card Authorization |
> | **Severity** | P1 · Resolved |
> | **MTTR** | &lt;computed from elapsed&gt; |
>
> CTAs: **View summary** *(primary)* / *Download (.md)* / *Share to Slack*

Action: *Bottom-right director's note: "**Incident resolved** · Card Authorization · INC-2026-0514-001 — Summary doc is ready to view, download, or share."*

---

### After the Resolution — John's Wrap-up Actions

The wrap-up CTAs (chiclet bar + summary card) all do real things:

**(a) View summary →** *A right-side drawer slides in over the workspace with the full post-incident report:*

> **Post-incident summary** — *Card payments — declines crossing SLA threshold* · INC-2026-0514-001 · Card Authorization · MTTR &lt;X&gt;
>
> **Root cause** — Build v3.7.1 (deployed 09:02 IST) introduced a 3DS timeout regression. Visa flows fail when the issuer responds in 2–3s — well within spec, but the new code aborts at 1.8s.
>
> **Mitigation** — Rollback to v3.7.0 (last known-good build, 2 days in production).
>
> **Timeline** — every `+Xs · Agent — text` row from the incident, in order.
>
> **Follow-up actions**
> - Add a regression test for 3DS issuer timeouts &gt; 1.8s *(DiagnosticsAgent · 2 days)*
> - Block deploys that lower timeouts without a paired SLO review *(ChangeAgent · this week)*
> - Brief payments-ops on the rollback at the Friday standup
>
> *Footer: Download .md · Share to Slack · Done.*

**(b) Download (.md) →** *A real `INC-2026-0514-001-summary.md` markdown file downloads to John's machine — generated client-side from the live incident state. Toast: "Summary downloaded · INC-2026-0514-001-summary.md".*

**(c) Share to Slack →** *Toast: "Shared to #payments-ops · Summary posted to Slack with timeline."*

**(d) Close incident →** *Toast: "Incident closed · INC-2026-0514-001 · MTTR &lt;X&gt; — Removed from active queue. Full record archived in Lens." The chiclet bar dismisses; the elapsed counter stops; John is back to the steady-state Cockpit/home view.*

---

### Story Beats At a Glance (for the deck slide)

| # | Phase | Who's working | What John sees |
|---|---|---|---|
| 1 | Detected | MonitoringAgent | P1 toast / "high" row → Open incident |
| 2 | Triaged | DiagnosticsAgent | "Customer-facing P1, SLA breach in &lt;6h" |
| 3 | Investigating | ObservabilityAgent | "98% of failures on build v3.7.1" |
| 4 | **Root cause** | DiagnosticsAgent → RemediationAgent | **Approval card** — Roll back v3.7.1 → v3.7.0? |
| 5 | Mitigating | RemediationAgent + ChangeAgent | Rollback rolling out · CHG-44102 logged |
| 6 | Resolved | ObservabilityAgent + ComplianceAgent | Error rate back to 0.4% · summary doc ready |

The whole arc — toast → live timeline → human gate → mitigation → wrap-up — runs in ~45 seconds and shows John (a) **what's happening right now** (live activity row + chiclets), (b) **the audit trail being built as it happens** (timeline rows with `+Xs · Agent — text`), and (c) **his decision moment** (approval card with explicit blast-radius numbers).
