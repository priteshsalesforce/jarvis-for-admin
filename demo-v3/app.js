/* =============================================================
   Jarvis · Setup-First Story Engine + Sidenav Router
   -------------------------------------------------------------
   This build is scoped to the IT-admin Setup chapter. The
   multi-persona lobby and supporting chapter files have been
   retired — the app boots straight into the Setup flow.

   This file owns:
     · the persistent left sidenav (collapse, gating, sessions, profile)
     · auto-launch of the Setup chapter on first paint
     · the story engine that plays the chapter beat-by-beat
     · the persistent Q&A router (whisper bar) so the IT admin can
       interrupt to ask Jarvis a question
     · session capture — every "New chat" → first question pair
       creates a session entry in the sidebar
     · the side-panel "browser" mount + dispatch surface

   The Setup chapter file under `stories/02-admin-sarah.js`
   self-registers by pushing to `window.CHAPTERS` and extending
   `window.PAGES`.
   ============================================================= */

(() => {
  // -------------------------------------------------------------
  // DOM refs
  // -------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);

  // Workspace
  const $workspace        = $("#workspace");
  const $stageMain        = $("#stageMain");
  const $thread           = $("#thread");
  const $whisperInput     = $("#whisperInput");
  const $whisperSend      = $("#whisperSend");
  const $dock             = $("#dock");

  // Side panel
  const $sidepanel         = $("#sidepanel");
  const $browserView       = $("#browserViewport");
  const $browserTitleText  = $("#browserTitleText");
  const $browserClose      = $("#browserClose");
  const $browserFullscreen = $("#browserFullscreen");

  // Sidenav
  const $sidenav         = $("#sidenav");
  const $navToggle       = $("#navToggle");
  const $navCockpit      = $("#navCockpit");
  const $navHorizon      = $("#navHorizon");
  const $navIncidents    = $("#navIncidents");
  const $navSettings     = $("#navSettings");
  const $navNewChat      = $("#navNewChat");
  const $navSessionList  = $("#navSessionList");
  const $navSessionsEmpty = $("#navSessionsEmpty");
  const $navProfile      = $("#navProfile");

  // Director's-notes stack (bottom-right toasts — used for "Setup
  // complete · Cockpit unlocked" and similar quiet system updates).
  const $directorStack = $("#directorStack");

  // Default title for each registered page. The browser step in a story
  // can override these by passing `title: "..."` explicitly.
  const PAGE_TITLES = {
    "splunk-auth":    "Splunk · Single Sign-On",
    "itsm-dashboard": "CMDB · Discovery dashboard",
    "cockpit":        "The Cockpit",
    "horizon":        "Horizon",
    "incidents":      "Incidents",
  };

  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  // mode === "setup" — the Setup story is playing (Settings highlighted)
  // mode === "chat"  — fresh chat session (from "New chat" or replay)
  // mode === "page"  — a workspace page is open (Cockpit/Horizon/Incidents)
  let mode            = "setup";
  let runToken        = 0;             // bumped on chapter switch / nav switch — old runStory loops bail when stale
  let storyIndex      = 0;
  let lastPersona     = null;          // "jarvis" | "user" — for consecutive grouping
  let activeChapter   = null;
  let CURRENT_PERSONA = null;

  // Sidenav gating — Cockpit, Horizon, Incidents are hidden until
  // the IT admin completes the Setup story.
  //
  // This is a demo: every reload should replay the install flow
  // from a pristine state, so we always boot with `setupComplete`
  // false and clear any previously persisted flag. The key is kept
  // around because `renderEndOfChapter` still writes to it once
  // setup completes within a single session.
  const SETUP_DONE_KEY = "jarvis-setup-done";
  let setupComplete = false;
  try { localStorage.removeItem(SETUP_DONE_KEY); } catch (_) {}

  // Sidebar collapse — also persisted so it survives a refresh.
  const SIDENAV_KEY = "jarvis-sidenav-collapsed";

  // Chat session model. Each session is created the moment the user
  // sends their first question after clicking "New chat".
  //   { id, title, messages: [{ kind: "user"|"jarvis", html, sys }],
  //     createdAt }
  // We persist sessions to localStorage so they survive refresh and
  // give the sidebar real continuity.
  const SESSIONS_KEY = "jarvis-sessions";
  let sessions = (() => {
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); }
    catch (_) { return []; }
  })();
  let activeSessionId   = null;        // id of the session being displayed
  let pendingNewSession = false;       // true after "New chat" → before first user msg

  function persistSessions() {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); }
    catch (_) { /* storage full / disabled — fine, fall back to memory */ }
  }
  function findSession(id) { return sessions.find((s) => s.id === id); }

  // -------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const md = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

  function scrollDown() {
    requestAnimationFrame(() => {
      $stageMain.scrollTo({ top: $stageMain.scrollHeight, behavior: "smooth" });
    });
  }

  function findStepIndex(arr, id) {
    return (arr || []).findIndex((s) => s && s.id === id);
  }

  function findChapter(id) {
    return (window.CHAPTERS || []).find((c) => c.id === id);
  }

  // -------------------------------------------------------------
  // Bubble factories — persona-aware
  // -------------------------------------------------------------
  function jarvisBubble(innerHTML, { sys = false, captureToSession = true } = {}) {
    const wrap = document.createElement("div");
    const isContinued = lastPersona === "jarvis";
    wrap.className =
      "bubble" +
      (sys ? " bubble--sys" : "") +
      (isContinued ? " bubble--continued" : "");
    wrap.innerHTML = `
      <div class="bubble__avatar bubble__avatar--jarvis"></div>
      <div class="bubble__body">
        <div class="bubble__name">Jarvis</div>
        <div class="bubble__text">${innerHTML}</div>
      </div>
    `;
    $thread.appendChild(wrap);
    lastPersona = "jarvis";
    scrollDown();
    if (captureToSession) recordMessage({ kind: "jarvis", html: innerHTML, sys });
    return wrap;
  }

  function userBubble(text, { captureToSession = true } = {}) {
    const wrap = document.createElement("div");
    const isContinued = lastPersona === "user";
    wrap.className = "bubble bubble--user" + (isContinued ? " bubble--continued" : "");
    wrap.innerHTML = `
      <div class="bubble__body">
        <div class="bubble__text">${md(text)}</div>
      </div>
    `;
    $thread.appendChild(wrap);
    lastPersona = "user";
    scrollDown();
    if (captureToSession) recordMessage({ kind: "user", text });
    return wrap;
  }

  function typingBubble() {
    // Typing indicator is ephemeral UI — never recorded into a session.
    return jarvisBubble(
      `<span class="typing"><span></span><span></span><span></span></span>`,
      { captureToSession: false }
    );
  }

  // Source disclosure that grounds a Q&A answer (Rule C3 — explainability).
  function sourceDisclosure(source) {
    if (!source) return "";
    return `
      <details class="source">
        <summary>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <span>Source</span>
        </summary>
        <div class="source__body">${md(source)}</div>
      </details>
    `;
  }

  // -------------------------------------------------------------
  // Session capture
  //
  // We only capture into sessions when we're in `chat` mode (i.e. the
  // user explicitly started a "New chat" or is continuing one). Setup
  // story content stays out of the session list — Settings owns that.
  // -------------------------------------------------------------
  function makeSessionId() {
    return `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  function shortTitle(text) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (t.length <= 40) return t || "Untitled chat";
    return t.slice(0, 38).replace(/\s+\S*$/, "") + "…";
  }

  function recordMessage(msg) {
    if (mode !== "chat") return;
    if (msg.kind === "user") {
      // First user message in a fresh chat → mint a new session.
      if (pendingNewSession || !activeSessionId) {
        const id = makeSessionId();
        const session = {
          id,
          title: shortTitle(msg.text),
          messages: [],
          createdAt: Date.now(),
        };
        sessions.unshift(session);
        activeSessionId = id;
        pendingNewSession = false;
      }
    }
    const session = findSession(activeSessionId);
    if (!session) return;
    session.messages.push(msg);
    session.updatedAt = Date.now();
    persistSessions();
    renderSessionList();
  }

  // -------------------------------------------------------------
  // Director's notes — quiet system toasts (bottom-right).
  // Used for things like "Setup complete · Cockpit unlocked".
  // -------------------------------------------------------------
  function pushDirectorNote({
    title = "System note",
    text = "",
    sub = "",
    actions = [],
    autoDismiss = 0,
  } = {}) {
    if (!$directorStack) return null;

    const card = document.createElement("div");
    card.className = "director-note";
    card.innerHTML = `
      <div class="director-note__head">
        <span class="director-note__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
               stroke="currentColor" stroke-width="2.4"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v2"/><path d="M12 20v2"/>
            <path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/>
            <path d="M2 12h2"/><path d="M20 12h2"/>
            <path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/>
            <circle cx="12" cy="12" r="3.5"/>
          </svg>
        </span>
        <span class="director-note__badge">System</span>
        <button class="director-note__close" type="button" aria-label="Dismiss note">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
      <div class="director-note__title">${md(title)}</div>
      <div class="director-note__text">${md(text)}</div>
      ${sub ? `<div class="director-note__sub">${md(sub)}</div>` : ""}
      ${actions.length ? `<div class="director-note__actions"></div>` : ""}
    `;

    const actionsEl = card.querySelector(".director-note__actions");
    if (actionsEl) {
      actions.forEach((a) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className =
          "director-note__btn" + (a.primary ? " director-note__btn--primary" : "");
        b.innerHTML = md(a.label);
        b.addEventListener("click", () => {
          if (typeof a.onClick === "function") a.onClick();
          if (a.dismiss !== false) dismissNote(card);
        });
        actionsEl.appendChild(b);
      });
    }
    card.querySelector(".director-note__close").addEventListener("click", () => {
      dismissNote(card);
    });

    $directorStack.appendChild(card);

    if (autoDismiss > 0) {
      setTimeout(() => dismissNote(card), autoDismiss);
    }
    return card;
  }

  function dismissNote(card) {
    if (!card || !card.parentNode) return;
    card.classList.add("director-note--leaving");
    setTimeout(() => card.remove(), 280);
  }

  function clearDirectorStack() {
    if (!$directorStack) return;
    $directorStack.innerHTML = "";
  }

  async function renderNote(step) {
    pushDirectorNote({
      title: step.title || "System note",
      text: step.text || "",
      sub: step.sub || "",
      autoDismiss: step.autoDismiss || 0,
    });
    if (step.pauseAfter) await sleep(step.pauseAfter);
  }

  // -------------------------------------------------------------
  // Step renderers
  // -------------------------------------------------------------
  async function renderSay(step) {
    const typing = typingBubble();
    await sleep(450);
    typing.querySelector(".bubble__text").innerHTML = md(step.text);
  }

  async function renderStatus(step) {
    const duration = step.duration ?? 1400;
    const text = step.text;
    const doneText = step.doneText || `${text} ✓`;
    const bubble = jarvisBubble(`
      <div class="status-line">
        <span class="status-line__icon is-busy"><span class="spinner"></span></span>
        <span class="status-line__label">${md(text)}…</span>
      </div>
    `, { captureToSession: false });
    await sleep(duration);
    bubble.querySelector(".status-line").innerHTML = `
      <span class="status-line__icon is-ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M5 12l5 5L20 7"/>
        </svg>
      </span>
      <span class="status-line__label">${md(doneText)}</span>
    `;
  }

  async function renderProgress(step) {
    const duration = step.duration ?? 2200;
    const bubble = jarvisBubble(`
      <div class="status-line">
        <span class="status-line__icon is-busy"><span class="spinner"></span></span>
        <span class="status-line__label" style="min-width:160px">${md(step.text)}…</span>
        <div class="progress"><div class="progress__bar"></div></div>
      </div>
    `, { captureToSession: false });
    const bar = bubble.querySelector(".progress__bar");
    requestAnimationFrame(() => {
      bar.style.transition = `inset ${duration}ms cubic-bezier(.2,.7,.2,1)`;
      bar.style.inset = "0 0 0 0";
    });
    await sleep(duration);
    bubble.querySelector(".status-line").innerHTML = `
      <span class="status-line__icon is-ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M5 12l5 5L20 7"/>
        </svg>
      </span>
      <span class="status-line__label">${md(step.doneText || step.text + " complete")}</span>
    `;
  }

  function renderAsk(step) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble(`<div>${md(step.text)}</div>`, { captureToSession: false });
      const actions = document.createElement("div");
      actions.className = "actions";
      step.choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "action" + (c.primary ? " action--primary" : "") + (c.danger ? " action--danger" : "");
        btn.innerHTML = `${c.glyph ? `<span class="action__glyph">${c.glyph}</span>` : ""}${md(c.label)}`;
        btn.addEventListener("click", () => {
          [...actions.children].forEach((b) => (b.disabled = true));
          userBubble(c.label, { captureToSession: false });
          resolve(c);
        });
        actions.appendChild(btn);
      });
      bubble.querySelector(".bubble__body").appendChild(actions);
      scrollDown();
    });
  }

  function renderChoose(step) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble(`<div>${md(step.text)}</div>`, { captureToSession: false });
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card__header"><span class="dot"></span> Pick one</div>
        <div class="card__body"><div class="choice-grid"></div></div>
      `;
      const grid = card.querySelector(".choice-grid");
      const isImagePath = (s) => typeof s === "string" && /\.(png|jpe?g|svg|gif|webp)(\?|$)/i.test(s);
      step.options.forEach((o) => {
        const b = document.createElement("button");
        b.className = "choice";
        const logoHtml = isImagePath(o.logo)
          ? `<div class="choice__logo choice__logo--img"><img src="${o.logo}" alt="${md(o.label)}" /></div>`
          : `<div class="choice__logo" style="background:${o.color || "var(--grad-jarvis)"}">${o.logo || "•"}</div>`;
        b.innerHTML = `
          ${logoHtml}
          <div class="choice__name">${md(o.label)}</div>
          <div class="choice__sub">${md(o.sub || "")}</div>
        `;
        b.addEventListener("click", () => {
          [...grid.children].forEach((c) => (c.disabled = true));
          b.classList.add("is-selected");
          userBubble(o.userText || `Use ${o.label}`, { captureToSession: false });
          resolve(o);
        });
        grid.appendChild(b);
      });
      bubble.querySelector(".bubble__body").appendChild(card);
      scrollDown();
    });
  }

  function renderMultiChoose(step) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble(`
        <div>${md(step.text)}</div>
        ${step.sub ? `<div class="bubble__hint">${md(step.sub)}</div>` : ""}
      `, { captureToSession: false });
      const card = document.createElement("div");
      card.className = "card card--multi";
      card.innerHTML = `
        <div class="card__header"><span class="dot"></span> ${md(step.headline || "Select all that apply")}</div>
        <div class="card__body">
          <div class="multi-grid"></div>
          <div class="multi-foot">
            <span class="multi-foot__hint" id="multiFootHint">Pick at least one to continue</span>
            <button type="button" class="multi-confirm" disabled>
              <span>${md(step.confirmLabel || "Continue setup")}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                   stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      const grid    = card.querySelector(".multi-grid");
      const confirm = card.querySelector(".multi-confirm");
      const hint    = card.querySelector("#multiFootHint");
      const isImagePath = (s) => typeof s === "string" && /\.(png|jpe?g|svg|gif|webp)(\?|$)/i.test(s);

      const selected = new Set();
      const allowAllOptional = step.allowAllOptional === true;

      const sync = () => {
        const n = selected.size;
        const min = allowAllOptional ? 0 : (step.minimum || 1);
        confirm.disabled = n < min;
        if (n === 0) {
          hint.textContent = allowAllOptional
            ? "None selected — that's fine, we can add later."
            : "Pick at least one to continue";
        } else {
          hint.textContent = `${n} selected · you can add more later anytime`;
        }
      };

      step.options.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "multi-tile";
        const logoHtml = isImagePath(o.logo)
          ? `<div class="multi-tile__logo multi-tile__logo--img"><img src="${o.logo}" alt="${md(o.label)}" /></div>`
          : `<div class="multi-tile__logo" style="background:${o.color || "var(--grad-jarvis)"}">${md(o.logo || o.label[0])}</div>`;
        b.innerHTML = `
          ${logoHtml}
          <div class="multi-tile__body">
            <div class="multi-tile__name">${md(o.label)}</div>
            <div class="multi-tile__sub">${md(o.sub || "")}</div>
          </div>
          <div class="multi-tile__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
                 stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </div>
        `;
        b.addEventListener("click", () => {
          if (b.classList.toggle("is-selected")) {
            selected.add(o);
          } else {
            selected.delete(o);
          }
          sync();
        });
        grid.appendChild(b);
      });

      confirm.addEventListener("click", () => {
        if (confirm.disabled) return;
        [...grid.children].forEach((c) => (c.disabled = true));
        confirm.disabled = true;
        const picked = [...selected];
        const labels = picked.map((p) => p.label);
        const summary = labels.length === 0
          ? (step.emptyEcho || "Skip integrations for now.")
          : `Plug into ${labels.join(", ")}.`;
        userBubble(summary, { captureToSession: false });
        resolve({ picked, values: picked.map((p) => p.value) });
      });

      bubble.querySelector(".bubble__body").appendChild(card);
      scrollDown();
      sync();
    });
  }

  function renderLinkCard(step) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble("", { captureToSession: false });
      const btn = document.createElement("button");
      btn.className = "linkcard";
      btn.innerHTML = `
        <div class="linkcard__icon">${step.icon || "🔗"}</div>
        <div>
          <div class="linkcard__title">${md(step.title)}</div>
          ${step.sub ? `<div class="linkcard__sub">${md(step.sub)}</div>` : ""}
        </div>
        <div class="linkcard__cta">Open ▸</div>
      `;
      btn.addEventListener("click", () => openBrowser(step.url, step.page));
      bubble.querySelector(".bubble__body").appendChild(btn);
      scrollDown();
      resolve();
    });
  }

  function renderWaitFor(step) {
    return new Promise((resolve) => {
      const text = step.text || "Waiting…";
      const bubble = jarvisBubble(`
        <div class="status-line">
          <span class="status-line__icon is-busy"><span class="spinner"></span></span>
          <span class="status-line__label">${md(text)}</span>
        </div>
      `, { captureToSession: false });
      const handler = () => {
        $sidepanel.removeEventListener(step.event, handler);
        bubble.querySelector(".status-line").innerHTML = `
          <span class="status-line__icon is-ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </span>
          <span class="status-line__label">${md(step.doneText || "Confirmed")}</span>
        `;
        resolve();
      };
      $sidepanel.addEventListener(step.event, handler);
    });
  }

  async function renderMetricBoard(step) {
    const bubble = jarvisBubble("", { captureToSession: false });
    const board = document.createElement("div");
    board.className = "metric-board";
    const title = step.title
      ? `<div class="metric-board__title">${md(step.title)}</div>`
      : "";
    board.innerHTML = `
      ${title}
      <div class="metric-board__grid">
        ${(step.metrics || []).map((m, i) => `
          <div class="metric-tile" data-i="${i}">
            <div class="metric-tile__label">${md(m.label)}</div>
            <div class="metric-tile__value" data-target="${m.value}">${typeof m.value === "number" ? "0" : md(String(m.value))}</div>
            ${m.delta ? `<div class="metric-tile__delta">${md(m.delta)}</div>` : ""}
            ${m.hint  ? `<div class="metric-tile__hint">${md(m.hint)}</div>`   : ""}
          </div>
        `).join("")}
      </div>
    `;
    bubble.querySelector(".bubble__body").appendChild(board);
    scrollDown();

    board.querySelectorAll(".metric-tile__value").forEach((el) => {
      const target = el.dataset.target;
      const num = Number(target);
      if (Number.isNaN(num)) return;
      const duration = 900;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(num * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = num.toLocaleString();
      };
      requestAnimationFrame(tick);
    });

    if (step.duration) await sleep(step.duration);
  }

  // Cinematic chapter intro that takes over the workspace before
  // the chat thread appears. Used by the Setup chapter to show a
  // "Build by describing your vision…" stage with an Install ITSM CTA.
  function renderWelcomeStep(step) {
    return new Promise((resolve) => {
      const cfg = (activeChapter && activeChapter.welcome) || {};
      const persona = CURRENT_PERSONA || {};
      const greeting = step.greeting || cfg.greeting || "Welcome,";
      const name = step.name || cfg.name || `${persona.name || "there"}!`;
      const titleLead = step.titleLead || cfg.titleLead || "Build by describing";
      const titleTail = step.titleTail || cfg.titleTail || "your vision...";
      const cta = step.cta || cfg.cta || "Install ITSM";
      const placeholder = step.placeholder || cfg.placeholder || "Ask anything";

      $workspace.classList.add("workspace--welcome");

      const hero = document.createElement("div");
      hero.className = "chapter-welcome";
      hero.innerHTML = `
        <div class="chapter-welcome__inner">
          <div class="chapter-welcome__greet">
            ${md(greeting)} <span class="chapter-welcome__name">${md(name)}</span>
          </div>
          <h1 class="chapter-welcome__title">
            <span class="chapter-welcome__title-lead">${md(titleLead)}</span>
            <span class="chapter-welcome__title-tail">${md(titleTail)}</span>
          </h1>
          <button class="chapter-welcome__cta" type="button" id="chapterWelcomeCta">
            <span class="chapter-welcome__cta-glyph" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                   stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 1.5l1.4 3.4 3.4 1.4-3.4 1.4L8 11.1 6.6 7.7 3.2 6.3l3.4-1.4L8 1.5z"/>
                <path d="M12.6 11.2l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z"/>
              </svg>
            </span>
            <span>${md(cta)}</span>
          </button>
          <div class="chapter-welcome__composer">
            <div class="whisper" role="group" aria-label="${md(placeholder)}">
              <div class="whisper__row whisper__row--input">
                <input class="whisper__input"
                       id="chapterWelcomeInput"
                       placeholder="${md(placeholder)}"
                       aria-label="${md(placeholder)}" />
              </div>
              <div class="whisper__row whisper__row--actions">
                <div class="whisper__actions whisper__actions--left">
                  <button class="whisper__icon" type="button"
                          title="Add attachment" aria-label="Add attachment" tabindex="-1">
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M9.0769 8.80767H13.5192C13.7346 8.80767 13.9231 8.61921 13.9231 8.40383V7.59614C13.9231 7.38075 13.7346 7.19229 13.5192 7.19229H9.0769C8.91537 7.19229 8.80767 7.0846 8.80767 6.92306V2.48075C8.80767 2.26537 8.61921 2.0769 8.40383 2.0769H7.59614C7.38075 2.0769 7.19229 2.26537 7.19229 2.48075V6.92306C7.19229 7.0846 7.0846 7.19229 6.92306 7.19229H2.48075C2.26537 7.19229 2.0769 7.38075 2.0769 7.59614V8.40383C2.0769 8.61921 2.26537 8.80767 2.48075 8.80767H6.92306C7.0846 8.80767 7.19229 8.91537 7.19229 9.0769V13.5192C7.19229 13.7346 7.38075 13.9231 7.59614 13.9231H8.40383C8.61921 13.9231 8.80767 13.7346 8.80767 13.5192V9.0769C8.80767 8.91537 8.91537 8.80767 9.0769 8.80767Z"/>
                    </svg>
                  </button>
                </div>
                <div class="whisper__actions whisper__actions--right">
                  <button class="whisper__icon whisper__mic" type="button"
                          title="Voice input" aria-label="Voice input" tabindex="-1">
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M11.9899 5.90001C11.8228 5.90001 11.6626 5.96639 11.5444 6.08454C11.4263 6.20268 11.3599 6.36293 11.3599 6.53001V7.58001C11.3599 9.42801 9.84788 10.94 7.99988 10.94C6.15188 10.94 4.63988 9.42801 4.63988 7.58001V6.53001C4.63988 6.17301 4.36688 5.90001 4.00988 5.90001C3.65288 5.90001 3.37988 6.17301 3.37988 6.53001V7.58001C3.3796 8.69638 3.78356 9.77508 4.51705 10.6167C5.25054 11.4583 6.26395 12.0058 7.36988 12.158V13.04H6.31988C5.96288 13.04 5.68988 13.313 5.68988 13.67C5.68988 14.027 5.96288 14.3 6.31988 14.3H9.67988C10.0369 14.3 10.3099 14.027 10.3099 13.67C10.3099 13.313 10.0369 13.04 9.67988 13.04H8.62988V12.158C9.73582 12.0058 10.7492 11.4583 11.4827 10.6167C12.2162 9.77508 12.6202 8.69638 12.6199 7.58001V6.53001C12.6199 6.36293 12.5535 6.20268 12.4354 6.08454C12.3172 5.96639 12.157 5.90001 11.9899 5.90001ZM7.99988 9.68001C8.55684 9.68001 9.09098 9.45876 9.48481 9.06494C9.87863 8.67111 10.0999 8.13697 10.0999 7.58001V3.77901C10.0999 3.22763 9.88085 2.69883 9.49096 2.30894C9.10107 1.91905 8.57227 1.70001 8.02088 1.70001H7.97888C7.4275 1.70001 6.8987 1.91905 6.50881 2.30894C6.11892 2.69883 5.89988 3.22763 5.89988 3.77901V7.58001C5.89988 8.13697 6.12113 8.67111 6.51496 9.06494C6.90879 9.45876 7.44293 9.68001 7.99988 9.68001Z"/>
                    </svg>
                  </button>
                  <button class="whisper__send" type="button"
                          title="Send" aria-label="Send" id="chapterWelcomeSend">
                    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M1.5655 12.9808L2.75011 8.59229H7.7578C7.89242 8.59229 8.02704 8.45767 8.02704 8.32306V7.7846C8.02704 7.64998 7.89242 7.51537 7.7578 7.51537H2.75011L1.59242 3.20767C1.5655 3.15383 1.53857 3.07306 1.53857 2.99229C1.53857 2.80383 1.72704 2.61537 1.94242 2.64229C1.99627 2.64229 2.02319 2.66921 2.07704 2.66921L14.1924 7.64998C14.354 7.70383 14.4617 7.86537 14.4617 8.0269C14.4617 8.18844 14.354 8.32306 14.2193 8.3769L2.07704 13.4923C2.02319 13.5192 1.96934 13.5192 1.9155 13.5192C1.70011 13.4923 1.53857 13.3308 1.53857 13.1154C1.53857 13.0615 1.53857 13.0346 1.5655 12.9808Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      $stageMain.appendChild(hero);

      const finish = () => {
        hero.classList.add("chapter-welcome--leaving");
        setTimeout(() => {
          if (hero.parentNode) hero.remove();
          $workspace.classList.remove("workspace--welcome");
          resolve();
        }, 320);
      };

      hero.querySelector("#chapterWelcomeCta").addEventListener("click", finish);
      hero.querySelector("#chapterWelcomeSend").addEventListener("click", finish);
      hero.querySelector("#chapterWelcomeInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") finish();
      });

      requestAnimationFrame(() => hero.classList.add("chapter-welcome--in"));
    });
  }

  // slack-thread — compact Slack-Block-Kit-style card inside the chat.
  async function renderSlackThread(step) {
    const bubble = jarvisBubble("", { captureToSession: false });
    const block = document.createElement("div");
    block.className = "slack-block";
    block.innerHTML = `
      <div class="slack-block__chrome">
        <span class="slack-block__hash">#</span>
        <span class="slack-block__channel">${md(step.channel || "it-help")}</span>
        <span class="slack-block__sep">·</span>
        <span class="slack-block__meta">${md(step.meta || "via Slack")}</span>
      </div>
      <div class="slack-block__body">
        ${(step.messages || []).map((m) => `
          <div class="slack-msg">
            <div class="slack-msg__avatar"
                 style="--persona-accent: ${m.fromColor || "var(--accent-1)"}">${md((m.from || "?")[0])}</div>
            <div class="slack-msg__body">
              <div class="slack-msg__head">
                <span class="slack-msg__from">${md(m.from || "User")}</span>
                ${m.bot ? `<span class="slack-msg__bot">APP</span>` : ""}
                ${m.time ? `<span class="slack-msg__time">${md(m.time)}</span>` : ""}
              </div>
              <div class="slack-msg__text">${md(m.text || "")}</div>
              ${m.actions && m.actions.length ? `
                <div class="slack-msg__actions">
                  ${m.actions.map(a => `<span class="slack-action ${a.primary ? "slack-action--primary" : ""}">${md(a.label)}</span>`).join("")}
                </div>
              ` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    `;
    bubble.querySelector(".bubble__body").appendChild(block);
    scrollDown();
    if (step.duration) await sleep(step.duration);
  }

  // -------------------------------------------------------------
  // Side panel — title-bar workspace surface (no URL chrome).
  // -------------------------------------------------------------
  function resolveTitle(pageKey, explicitTitle) {
    if (explicitTitle) return explicitTitle;
    if (PAGE_TITLES[pageKey]) return PAGE_TITLES[pageKey];
    if (!pageKey) return "Workspace";
    return pageKey
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function openBrowser(url, pageKey, title) {
    $sidepanel.removeAttribute("inert");
    $sidepanel.setAttribute("aria-hidden", "false");
    $workspace.classList.add("workspace--split");

    if ($browserTitleText) {
      $browserTitleText.textContent = resolveTitle(pageKey, title);
    }

    $browserView.innerHTML = "";
    const factory = window.PAGES?.[pageKey];
    if (factory) {
      factory($browserView, {
        dispatch: (name, detail) =>
          $sidepanel.dispatchEvent(new CustomEvent(name, { detail, bubbles: true })),
      });
    } else {
      $browserView.innerHTML = `<div class="page"><p>${pageKey || "Empty page"}</p></div>`;
    }
  }

  function closeBrowser() {
    $workspace.classList.remove("workspace--split");
    $workspace.classList.remove("workspace--panel-fullscreen");
    if ($browserFullscreen) {
      $browserFullscreen.setAttribute("aria-pressed", "false");
      $browserFullscreen.title = "Expand to full screen";
      $browserFullscreen.setAttribute("aria-label", "Expand panel to full screen");
    }
    $sidepanel.setAttribute("aria-hidden", "true");
    $sidepanel.setAttribute("inert", "");
    setTimeout(() => { $browserView.innerHTML = ""; }, 600);
  }

  function toggleFullscreen() {
    const nowFull = $workspace.classList.toggle("workspace--panel-fullscreen");
    if ($browserFullscreen) {
      $browserFullscreen.setAttribute("aria-pressed", String(nowFull));
      $browserFullscreen.title = nowFull
        ? "Collapse to side panel"
        : "Expand to full screen";
      $browserFullscreen.setAttribute(
        "aria-label",
        nowFull ? "Collapse panel to side view" : "Expand panel to full screen"
      );
    }
  }

  $browserClose.addEventListener("click", closeBrowser);
  $browserFullscreen?.addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $workspace.classList.contains("workspace--panel-fullscreen")) {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // -------------------------------------------------------------
  // Story runner
  // -------------------------------------------------------------
  async function runStep(story, step) {
    if (!step) return false;
    if (step.pause) await sleep(step.pause);

    if (step.panelEvent) {
      $sidepanel.dispatchEvent(
        new CustomEvent(step.panelEvent, {
          detail: step.panelEventDetail || {},
          bubbles: true,
        })
      );
    }

    switch (step.type) {
      case "welcome":       await renderWelcomeStep(step); break;
      case "say":           await renderSay(step); break;
      case "note":          await renderNote(step); break;
      case "status":        await renderStatus(step); break;
      case "progress":      await renderProgress(step); break;
      case "metric-board":  await renderMetricBoard(step); break;
      case "slack-thread":  await renderSlackThread(step); break;
      case "panel-event":   /* dispatched above; nothing else to do */ break;
      case "ask": {
        const picked = await renderAsk(step);
        if (picked.goto) {
          const idx = findStepIndex(story, picked.goto);
          if (idx >= 0) { storyIndex = idx; return true; }
        }
        break;
      }
      case "choose": {
        const picked = await renderChoose(step);
        if (picked.goto) {
          const idx = findStepIndex(story, picked.goto);
          if (idx >= 0) { storyIndex = idx; return true; }
        }
        break;
      }
      case "multi-choose": {
        const picked = await renderMultiChoose(step);
        if (typeof step.onPicked === "function") {
          try { step.onPicked(picked); } catch (_) { /* author error */ }
        }
        if (step.goto) {
          const idx = findStepIndex(story, step.goto);
          if (idx >= 0) { storyIndex = idx; return true; }
        }
        break;
      }
      case "browser":       openBrowser(step.url, step.page, step.title); break;
      case "browser-close": closeBrowser(); break;
      case "wait-for":      await renderWaitFor(step); break;
      case "link-card":     await renderLinkCard(step); break;
      case "user":          userBubble(step.text, { captureToSession: false }); break;
      case "goto": {
        const idx = findStepIndex(story, step.to);
        if (idx >= 0) { storyIndex = idx; return true; }
        break;
      }
      case "end":
        renderEndOfChapter();
        return false;
      default:
        console.warn("Unknown step type:", step.type, step);
    }
    return true;
  }

  function stepHadGoto(story, step) {
    const myIdx = story.indexOf(step);
    return storyIndex !== myIdx;
  }

  async function runStory(story) {
    const myToken = ++runToken;
    storyIndex = 0;
    while (storyIndex < story.length) {
      if (myToken !== runToken) return; // mode/nav switched mid-flight — abandon
      const step = story[storyIndex];
      const advanced = await runStep(story, step);
      if (myToken !== runToken) return;
      if (step?.type === "end") break;
      if (advanced === true && (step.type === "ask" || step.type === "choose" || step.type === "multi-choose" || step.type === "goto")) {
        if (!stepHadGoto(story, step)) storyIndex += 1;
      } else if (advanced === false) {
        break;
      } else {
        storyIndex += 1;
      }
    }
  }

  // -------------------------------------------------------------
  // End-of-Setup — unlock Cockpit, Horizon, Incidents and post a
  // quiet system toast that names what just changed.
  // -------------------------------------------------------------
  function renderEndOfChapter() {
    if (!setupComplete) {
      setupComplete = true;
      try { localStorage.setItem(SETUP_DONE_KEY, "1"); } catch (_) {}
      // Reveal the gated items with a staggered cascade so the
      // admin's eye is pulled to the new sidebar options before the
      // toast lands.
      applySidenavGating({ animate: true });

      pushDirectorNote({
        title: "Setup complete",
        text: "Cockpit, Horizon, and Incidents are now available in the sidebar.",
        sub: "You can come back to Settings any time.",
        actions: [
          { label: "Open Cockpit", primary: true,
            onClick: () => navigateTo("cockpit") },
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Sidenav — gating, collapse, sessions, navigation
  // -------------------------------------------------------------
  // Pre-setup we hide Cockpit / Horizon / Incidents entirely; once
  // Setup completes they reveal in place. Using `is-locked` (display:
  // none) + the native `hidden` attribute keeps the items out of
  // both visual flow AND the keyboard tab order in lockstep.
  //
  // `options.animate` is opt-in: when true, each newly-unlocked item
  // gets a `sidenav__item--revealing` class with a staggered delay so
  // the cascade reads as a deliberate moment — never on bootstrap
  // gating, where the items are simply staying hidden.
  function applySidenavGating(options) {
    const animate = !!(options && options.animate);
    const gatedItems = [
      { el: $navCockpit,   key: "cockpit",   title: "Cockpit · your day-1 control surface" },
      { el: $navHorizon,   key: "horizon",   title: "Horizon · long-range planning" },
      { el: $navIncidents, key: "incidents", title: "Incidents · live triage" },
    ];
    gatedItems.forEach(({ el, title }, i) => {
      if (!el) return;
      const wasLocked = el.classList.contains("is-locked") || el.hasAttribute("hidden");
      if (setupComplete) {
        el.classList.remove("is-locked");
        el.removeAttribute("hidden");
        el.title = title;
        if (animate && wasLocked) {
          // Per-item cascade — Cockpit first, then Horizon, then
          // Incidents — so the eye sweeps top → bottom.
          el.style.setProperty("--reveal-delay", `${i * 140}ms`);
          el.classList.add("sidenav__item--revealing");
          // The longest animation (glow pulse × 2) finishes around
          // 3.5s after the cascade delay. Clear the class after
          // that so hover / focus state goes back to normal.
          const clearAfterMs = 3800 + i * 140;
          window.setTimeout(() => {
            el.classList.remove("sidenav__item--revealing");
            el.style.removeProperty("--reveal-delay");
          }, clearAfterMs);
        }
      } else {
        el.classList.add("is-locked");
        el.setAttribute("hidden", "");
        el.removeAttribute("title");
        el.classList.remove("sidenav__item--revealing");
        el.style.removeProperty("--reveal-delay");
      }
    });
  }

  function setActiveNavItem(key) {
    [$navCockpit, $navHorizon, $navIncidents, $navSettings].forEach((el) => {
      if (!el) return;
      const active = el.dataset.nav === key;
      el.classList.toggle("is-active", active);
      if (active) el.setAttribute("aria-current", "page");
      else        el.removeAttribute("aria-current");
    });
  }

  function setCollapsed(collapsed) {
    $sidenav.dataset.collapsed = collapsed ? "true" : "false";
    $navToggle.setAttribute("aria-expanded", String(!collapsed));
    $navToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    try { localStorage.setItem(SIDENAV_KEY, collapsed ? "1" : "0"); } catch (_) {}
  }

  function renderSessionList() {
    if (!$navSessionList) return;
    $navSessionList.innerHTML = "";
    if (sessions.length === 0) {
      const li = document.createElement("li");
      li.className = "sidenav__sessions-empty";
      li.textContent = "No chats yet — ask Jarvis anything to start one.";
      $navSessionList.appendChild(li);
      return;
    }
    sessions.forEach((s) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sidenav__session" + (s.id === activeSessionId ? " is-active" : "");
      btn.textContent = s.title;
      btn.title = s.title;
      btn.addEventListener("click", () => loadSession(s.id));
      li.appendChild(btn);
      $navSessionList.appendChild(li);
    });
  }

  function loadSession(id) {
    const session = findSession(id);
    if (!session) return;
    runToken += 1;       // stop any running story
    activeSessionId = id;
    pendingNewSession = false;
    enterChatMode({ skipClearSession: true });
    setActiveNavItem(null);

    // Replay the session's messages into the thread without re-recording.
    $thread.innerHTML = "";
    lastPersona = null;
    session.messages.forEach((m) => {
      if (m.kind === "user") {
        userBubble(m.text, { captureToSession: false });
      } else {
        jarvisBubble(m.html, { sys: m.sys, captureToSession: false });
      }
    });
    renderSessionList();
  }

  // Strip everything chapter-y from the workspace and present a clean
  // chat surface. Used by "New chat" and by `loadSession`.
  function enterChatMode({ skipClearSession = false } = {}) {
    runToken += 1;
    mode = "chat";
    activeChapter = null;
    CURRENT_PERSONA = null;

    if (!skipClearSession) {
      activeSessionId = null;
      pendingNewSession = true;
    }

    $workspace.classList.remove("workspace--welcome");
    $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
    $thread.innerHTML = "";
    lastPersona = null;
    closeBrowser();
    setActiveNavItem(null);
    $whisperInput.focus();
  }

  // -------------------------------------------------------------
  // Workspace pages — Cockpit / Horizon / Incidents.
  // For now we render lightweight placeholders directly into the
  // chat column. They can be replaced with real factories later.
  // -------------------------------------------------------------
  const WORKSPACE_PAGES = {
    cockpit: {
      title: "Cockpit",
      lead: "Your day-1 control surface. Agents, signals, and sign-offs at a glance.",
      hint: "Design coming soon — this is the post-setup landing surface for Sarah.",
    },
    horizon: {
      title: "Horizon",
      lead: "Long-range planning view. Track trends, capacity, and upcoming change windows.",
      hint: "Design coming soon.",
    },
    incidents: {
      title: "Incidents",
      lead: "Live triage. Open incidents, who's on call, and the running RCA.",
      hint: "Design coming soon.",
    },
  };

  function navigateTo(key) {
    const cfg = WORKSPACE_PAGES[key];
    if (!cfg) return;
    if (!setupComplete) return; // gated

    runToken += 1;
    mode = "page";
    activeChapter = null;
    CURRENT_PERSONA = null;
    activeSessionId = null;
    pendingNewSession = false;

    $workspace.classList.remove("workspace--welcome");
    $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
    $thread.innerHTML = "";
    lastPersona = null;
    closeBrowser();
    setActiveNavItem(key);

    const placeholder = document.createElement("div");
    placeholder.className = "workspace-placeholder";
    placeholder.innerHTML = `
      <div class="workspace-placeholder__inner">
        <div class="workspace-placeholder__eyebrow">${md(cfg.title)}</div>
        <h2 class="workspace-placeholder__title">${md(cfg.lead)}</h2>
        <p class="workspace-placeholder__hint">${md(cfg.hint)}</p>
      </div>
    `;
    $thread.appendChild(placeholder);
  }

  // Re-enter Setup. Resets the story and re-runs it from the beginning.
  function startSetup() {
    const chapter = findChapter("admin-sarah");
    if (!chapter) {
      console.warn("Setup chapter not found");
      return;
    }
    runToken += 1;
    mode = "setup";
    activeChapter = chapter;
    CURRENT_PERSONA = chapter.persona;
    activeSessionId = null;
    pendingNewSession = false;

    document.documentElement.style.setProperty(
      "--chapter-accent", chapter.persona.accent || "var(--accent-1)"
    );

    $thread.innerHTML = "";
    $workspace.classList.remove("workspace--welcome");
    $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
    lastPersona = null;
    closeBrowser();
    setActiveNavItem("settings");

    runStory(chapter.story || []);
  }

  // -------------------------------------------------------------
  // FAQ router
  // -------------------------------------------------------------
  function findFaq(text, faqs) {
    if (!faqs || !faqs.length) return null;
    const t = String(text || "");
    return faqs.find((f) => {
      try {
        if (f.match instanceof RegExp) return f.match.test(t);
        if (typeof f.match === "string") return t.toLowerCase().includes(f.match.toLowerCase());
      } catch (_) { /* ignore */ }
      return false;
    });
  }

  async function renderAnswer(answer, source) {
    const typing = typingBubble();
    await sleep(550);
    const html = md(answer) + sourceDisclosure(source);
    typing.querySelector(".bubble__text").innerHTML = html;
    // Re-record this jarvis message into the active session (typing
    // bubbles aren't captured, but the resolved answer should be).
    recordMessage({ kind: "jarvis", html });
  }

  async function renderFallback() {
    const typing = typingBubble();
    await sleep(450);
    const html = md(
      "I'm here to help with setup, configuration, and anything Jarvis can do for IT. " +
      "Ask me about the install, the CMDB, integrations, or how to roll back changes."
    );
    typing.querySelector(".bubble__text").innerHTML = html;
    recordMessage({ kind: "jarvis", html });
  }

  // Single entry point for free-text questions from the dock whisper.
  //
  // Behavior depends on `mode`:
  //   • setup → the question is treated as an inline interrupt; the
  //     bubble + FAQ answer are appended to the running thread but
  //     the story keeps playing underneath. Nothing is recorded into
  //     a session (sessions are owned by the chat surface, not setup).
  //   • chat  → the question creates / extends the active session
  //     (auto-recorded by the bubble factories + renderAnswer).
  //   • page  → the user navigated to Cockpit/Horizon/Incidents and
  //     then asked a question. We treat that as starting a fresh
  //     chat (session-worthy) so the placeholder doesn't trap them.
  async function handleWhisper(rawText) {
    const text = (rawText || "").trim();
    if (!text) return;

    if ($whisperInput) $whisperInput.value = "";

    // Special control phrases — always allowed regardless of mode.
    if (/^(new chat|fresh chat|start over)$/i.test(text)) {
      enterChatMode();
      return;
    }
    if (/^(open settings|back to setup|setup)$/i.test(text)) {
      startSetup();
      return;
    }

    // From a workspace page, the chat surface is empty — promote the
    // user to chat mode so their question can become a real session.
    if (mode === "page") {
      enterChatMode();
    }

    userBubble(text);

    const faqs = (findChapter("admin-sarah")?.faqs) || [];
    const faq = findFaq(text, faqs);
    if (faq) {
      await renderAnswer(faq.answer, faq.source);
    } else {
      await renderFallback();
    }
  }

  // -------------------------------------------------------------
  // Wiring
  // -------------------------------------------------------------
  $navToggle.addEventListener("click", () => {
    const isCollapsed = $sidenav.dataset.collapsed === "true";
    setCollapsed(!isCollapsed);
  });

  $navNewChat.addEventListener("click", () => enterChatMode());
  $navSettings.addEventListener("click", () => startSetup());
  $navCockpit.addEventListener("click", (e) => {
    if ($navCockpit.disabled) { e.preventDefault(); return; }
    navigateTo("cockpit");
  });
  $navHorizon.addEventListener("click", (e) => {
    if ($navHorizon.disabled) { e.preventDefault(); return; }
    navigateTo("horizon");
  });
  $navIncidents.addEventListener("click", (e) => {
    if ($navIncidents.disabled) { e.preventDefault(); return; }
    navigateTo("incidents");
  });
  $navProfile.addEventListener("click", () => {
    pushDirectorNote({
      title: "Profile",
      text: "Sarah Chen · IT Admin · Acme Health.",
      sub: "Profile + workspace settings coming soon.",
      autoDismiss: 3200,
    });
  });

  // Dock whisper
  $whisperSend.addEventListener("click", () => handleWhisper($whisperInput.value));
  $whisperInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleWhisper($whisperInput.value);
  });

  // -------------------------------------------------------------
  // Bootstrap — restore sidenav state, gate items, render sessions,
  // and auto-launch the Setup chapter on first paint.
  // -------------------------------------------------------------
  (function bootstrap() {
    let initialCollapsed = false;
    try { initialCollapsed = localStorage.getItem(SIDENAV_KEY) === "1"; } catch (_) {}
    setCollapsed(initialCollapsed);
    applySidenavGating();
    renderSessionList();
    startSetup();
  })();
})();
