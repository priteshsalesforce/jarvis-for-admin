## Companion Mini-Story: The Add-Agent Wizard (v4 home shell)

**Persona:** John, IT Manager · IndiaFirst Bank.

After Setup is complete, Sarah's app boots into a **post-setup Home shell** branded for **John, IT Manager at IndiaFirst Bank** (greeting + four chiclet shortcuts above the whisper composer):

- **Open Cockpit** — opens Tower
- **Today's approvals (4)** — pulls the sign-off queue card
- **Recent incidents** — opens the incidents page
- **Add Agent** — kicks off the in-chat agent-builder wizard

Tapping **Add Agent** runs a 4-question conversational wizard, then auto-validates the agent before slotting it in the Cockpit.

---

### Q1 · JTBD

Jarvis: Let's build you an agent. In one sentence — **what should it do**? *(e.g. "onboard new hires in Salesforce — provision access on day one and notify their manager")*

User types the JTBD in the whisper bar.

---

### Q2 · Domain

Jarvis: Sounds like a **&lt;inferred&gt;** agent. Right domain?

Chips: Reliability · Cost · Access · Compliance · *(suggestion pre-selected based on JTBD)*

---

### Q3 · Name

Jarvis: What should I call it? I suggest **&lt;suggestedName&gt;**.

Chips: *Use "&lt;suggestedName&gt;"* / *Type my own*. Picking "Type my own" hands the whisper bar back to the wizard for a free-text name.

---

### Q4 · Autonomy

Jarvis: How much autonomy should it have?

Chips: **L1** / **L2** *(recommended)* / **L3** / **L4** — each with a one-line blurb.

---

### Preview & Confirm

Jarvis: Here's what I'll create — review and confirm.

Action: *Renders a preview agent card — name + level chip, JTBD body, "Domain · &lt;X&gt;", "Trust 88%", new-status badge — with two CTAs: **Create agent** / **Cancel**.*

User: Create agent.

---

### The "Aha" Moment

Action: *6 pre-flight evals stream in the chat, each with a busy spinner that resolves to a green tick:*

1. Validating intent and domain mapping → **Intent and domain mapping validated**
2. Resolving ontology bindings for selected domain → **Ontology bindings resolved**
3. Verifying tool scopes against autonomy level → **Tool scopes match autonomy level**
4. Running guardrail safety simulations → **Guardrails passed safety simulation**
5. Wiring audit trail for compliance → **Audit trail wired · compliance ready**
6. Calibrating initial trust score → **Initial trust calibrated at 88%**

---

### The Finale

*The new agent slides into the Cockpit grid as a fresh tile (with a "New" badge), and a director's-note toast confirms "Agent deployed · &lt;name&gt; is live."*
