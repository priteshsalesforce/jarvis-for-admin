# Story · Jarvis Demo Narratives

Each file in this folder is a self-contained demo narrative — persona, walk-through, "aha" moments, and finale — in the same structured format used across the deck. Read them stand-alone for a single demo, or in order for the full Agentic Enterprise arc.

## The Stories

| File | Demo | Persona | Story type | What it shows |
|---|---|---|---|---|
| [`v4-setup-sarah.md`](./v4-setup-sarah.md) | **v4 · Setup** | Sarah, IT Admin · Acme Health | Foundation install | The Agentic IT Architect — right-sizing the install, Splunk SSO, the bootstrap reveal, Cockpit handoff. |
| [`v4-add-agent-wizard.md`](./v4-add-agent-wizard.md) | **v4 · Home shell** | John, IT Manager · IndiaFirst Bank | Agent build | The 4-question conversational wizard (JTBD → Domain → Name → Autonomy) + 6 pre-flight evals + Cockpit drop-in. |
| [`v4-open-incident.md`](./v4-open-incident.md) | **v4 · Home shell** | John, IT Manager · IndiaFirst Bank | P1 incident response | "Card payments are failing right now" → 6-phase orchestration (Detected → Triaged → Investigating → Root cause **gate** → Mitigating → Resolved) → post-incident summary. |
| [`v5-onboarding-priya.md`](./v5-onboarding-priya.md) | **v5 · Operational** | Priya Menon, HR Admin · TechCorp | Multi-agent fan-out | One chat prompt fans out to 9 agents in parallel — "no tickets, no back-and-forth emails, no chasing." |
| [`v6-the-lens-john.md`](./v6-the-lens-john.md) | **v6 · The Lens** | John Mathew, IT Manager · IndiaFirst Bank | Observation & action | Full-canvas Lens of the digital workforce; a new loan workflow lands, agents orchestrate KYC → CIBIL → Account → Underwriting, and John emails or downloads the sanction letter. |

## Cross-Demo Notes

- All demos share the same shell (left rail · chat panel · right workspace pane) and the same Jarvis design language — only the persona, story type, and right-pane content differ.
- **v4** is the **set-up + agent-build** story (foundation install for Sarah → ongoing agent management for John, IT Manager).
- **v5** is the **operational orchestration** story (Priya kicks off a multi-agent fan-out from a single chat prompt).
- **v6** is the **observation & action** story (John watches the digital workforce in real time and intervenes when a work item needs his eye).
- Deep-link entry points: `#setup` (re-enters the chapter), `#tower` / `#cockpit` (Sarah's control surface), `#lens` (John's feed), `#workitem-detail` (John's loan workflow detail).

## Format Used in Each File

Every story follows the same skeleton, so they are interchangeable as deck inputs or storyboarding briefs:

1. **Demo Title + Persona + Stack/Context**
2. **Welcome / Boot screen** — what the user sees first, plus suggested questions or chiclets.
3. **Acts (1..N)** — chat dialogue, panel reveals, status lines, and any branching choices.
4. **The "Aha" Moment** — the one beat the demo is built around.
5. **The Finale** — the closing state and what remains live for follow-up.
