## Demo Title: The Lens (v6)

**Persona:** John Mathew, an IT Manager at IndiaFirst Bank. John runs a fleet of digital agents that handle the bank's day-to-day IT work — incidents, customer cases, customer-facing workflows (loan applications, KYC re-runs), and change-management freezes.

**Boot:** v6 boots directly into **The Lens** in full-canvas right-pane mode (chat collapsed to the Jarvis tile in the rail). No greeting, no setup story — the Lens *is* John's home.

---

### Act 1: The Lens Loads

Action: *The Lens paints — header "**The Lens** · See all your work items on this page", a tab strip (**All 2,628** · Incidents 2,098 · Cases 120 · Workflows 121 · Changes 1), and a card listing every work item the agents are handling end-to-end. John's seed feed (current state of the bank on a Thursday evening):*

| ID | Type | Title | State | Agents on it |
|---|---|---|---|---|
| INC-44318 | INC | SAP S/4HANA · ERP DB lock contention (P2 · vendor case open) | Active · Manufacturing IT engaged | DiagnosticsAgent · VendorRouterAgent |
| INC-44219 | INC | AWS NLB regional latency (P3 · vendor handed off) | Resolved · vendor handed off | MonitoringAgent · VendorRouterAgent |
| CASE-44102 | CASE | Laptop performance — Zoom plugin | Resolved · auto-closed in customer voice | EndpointAgent |
| CHG-9921 ×4 | CHG | checkout-api · feature flag rollout | Held · against Saturday freeze lane | ChangeAgent |

*The eye sweeps INC / CASE / WFLW / CHG at a glance via tinted left-edge chips.*

---

### Act 2: A New Workflow Arrives

Action: *~3.5 seconds after the page settles, a fresh **WFLW** row slides in at the top with a soft glow + a "New" pip on the left chip. A quiet director's-note toast bottom-right confirms:*

> **New work item** — Loan application from Rohan Sharma · home loan · ₹78L. Routed to the Loan Workflow agent. Open from the top of Lens.

| ID | Type | Title | State |
|---|---|---|---|
| **WF-44312** | **WFLW** | loan S/4-api · feature home loan | **New · Loan application** |

The "Aha" Moment: *the row stays in place, gently pulsing, until John clicks it — he doesn't have to hunt, the Lens brought it to him.*

---

### Act 3: The Work Item Detail

John clicks the new row.

Action: *The right pane swaps to the **Work-item Detail** page — a "← Lens" back button at the top-left, then a title row: "loan S/4-api · feature home loan · WF-44312" with a status chip showing **New · agents working**. Below, two tabs: **Resolution** (active, the live timeline) and **Details** (customer + loan facts).*

Below the timestamp ("DD MMM YYYY · HH:MM:SS"), the **agent orchestration timeline** begins playing — each step renders as a row with a vertical rail, a busy spinner that resolves into a green check, and the agent's result line.

1. **OrchestratorAgent** — *Workflow received* → Routing to specialist agents → **Routed to KYC, CIBIL, Account & Underwriting agents in parallel**
2. **KycVerificationAgent** — *KYC verification* → Validating Aadhaar + PAN with NSDL → **PAN AVQPS3421K verified · Aadhaar match · sanctions clear**
3. **CibilScoreAgent** — *CIBIL score check* → Pulling credit report from CIBIL → **Score 812 · 0 missed payments · utilisation 18%**
4. **AccountVerificationAgent** — *Account & income verification* → Checking SB balance, deposits, EPF & employer verification → **Avg balance ₹8.2L · salary ₹2.4L/mo · employer Tier-A**
5. **UnderwritingAgent** — *Underwriting & risk decision* → Computing eligibility against loan policy v2.4 → **Sanctioned ₹78,00,000 @ 8.45% floating · EMI ₹67,420/mo · LTV 78%**
6. **SanctionLetterAgent** — *Sanction letter generated* → Drafting & e-stamping the sanction letter (PDF) → **PDF ready · IFB-LN-2026-44312-SL.pdf (124 KB)**

Action: *As the final step resolves, the page status banner flips from **"New · agents working"** → **"Resolved · sanctioned by UnderwritingAgent"**, and a director's note pops bottom-right:*

> **Loan sanctioned** — Sanction letter ready for Rohan Sharma · ₹78,00,000 @ 8.45%. Email it to Rohan or download the PDF from the work item.

If John switches to the **Details** tab at any time, he sees three structured factboxes: **Customer** *(name · PAN · email · phone)*, **Loan** *(product · amount · tenure · property)*, and **Agents on this workflow** *(chips for OrchestratorAgent, KycVerificationAgent, CibilScoreAgent, AccountVerificationAgent, UnderwritingAgent, SanctionLetterAgent)*.

---

### Act 4: The Sanction Letter

The "Aha" Moment:

Action: *A **Sanction-letter card** slides in at the bottom of the timeline — eyebrow "SanctionLetterAgent · Document ready", title "**Sanction letter for Rohan Sharma**", with a one-line summary:*

> Home loan · ₹78,00,000 @ 8.45% floating · 20-year tenure · EMI ₹67,420/mo. E-stamped, signed by the Branch Credit Officer.

*Plus a PDF preview tile — "**IFB-LN-2026-44312-SL.pdf** · 124 KB · 4 pages · valid till 12 Jun 2026" — and two CTAs: **Email to Rohan** (primary) and **Download PDF** (secondary).*

John picks one (or both — the alternate stays clickable):

**(a) Email to Rohan →** *"Composing email to **rohan.sharma@gmail.com**…" → "**Sent to rohan.sharma@gmail.com · cc: branch-credit@indiafirst.com**".* Toast: *Sanction letter emailed.*

**(b) Download PDF →** *"Preparing the PDF for download…" → "**Downloaded IFB-LN-2026-44312-SL.pdf to your machine.**".* Toast: *Sanction letter downloaded.*

---

### The Finale

The page rests on the resolved work-item — **Resolved · sanctioned by UnderwritingAgent** — with the sanction letter card visible and either action confirmed. John clicks the **← Lens** button at the top-left and is back on the live feed, with **WF-44312** now sitting in the list as a sanctioned workflow alongside the other work items his digital agents are handling. The chat panel is still one Jarvis-tile-tap away if he wants to ask follow-ups.
