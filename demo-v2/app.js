/* =============================================================
   Jarvis · Story Engine + Lobby Router
   -------------------------------------------------------------
   This file owns:
     · the Lobby (persona switcher) wiring
     · the story engine that plays a chapter beat-by-beat
     · the persistent Q&A router (whisper bar) that lets any
       persona interrogate Jarvis without breaking the story
     · the persona-aware bubble factories
     · the side-panel "browser" mount + dispatch surface

   Each chapter file under `stories/` self-registers by pushing
   to `window.CHAPTERS` and (optionally) extending `window.PAGES`.
   The lobby's meta-FAQ lives on `window.LOBBY`.
   ============================================================= */

(() => {
  // -------------------------------------------------------------
  // DOM refs
  // -------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);

  // Topbar + chapter chrome
  const $btnBackLobby   = $("#btnBackLobby");
  const $chapterPill    = $("#chapterPill");
  const $chapterAvatar  = $("#chapterPillAvatar");
  const $chapterRole    = $("#chapterPillRole");
  const $chapterTitle   = $("#chapterPillTitle");
  // Salesforce header — profile avatar (in-simulation chrome).
  // We tint it with the active persona's accent so it reads as "this is
  // who's logged into Salesforce right now" during a chapter.
  const $sfAvatar       = $("#topbarSfAvatar");

  // Lobby
  const $lobby             = $("#lobby");
  const $personaGrid       = $("#personaGrid");
  const $lobbyChat         = $("#lobbyChat");
  const $lobbyThread       = $("#lobbyThread");
  const $lobbySuggestChips = $("#lobbySuggestChips");
  const $lobbyWhisperInput = $("#lobbyWhisperInput");
  const $lobbyWhisperSend  = $("#lobbyWhisperSend");
  const $ctaPlayAll        = $("#ctaPlayAll");

  // Workspace (chapter)
  const $workspace        = $("#workspace");
  const $stageMain        = $("#stageMain");
  const $thread           = $("#thread");
  const $whisperInput     = $("#whisperInput");
  const $whisperSend      = $("#whisperSend");

  // Side panel
  const $sidepanel       = $("#sidepanel");
  const $browserView     = $("#browserViewport");
  const $browserTitleText = $("#browserTitleText");
  const $browserClose    = $("#browserClose");
  const $browserFullscreen = $("#browserFullscreen");

  // Default title for each registered page. The browser step in a story
  // can override these by passing `title: "..."` explicitly. We keep this
  // map close to the engine so authors don't have to repeat themselves
  // in every chapter.
  const PAGE_TITLES = {
    "splunk-auth":    "Splunk · Single Sign-On",
    "itsm-dashboard": "CMDB · Discovery dashboard",
    "constellation":  "Neural Scan · Acme Health",
    "slack-page":     "Slack · #it-help",
    "team-health":    "Team Health · Platform",
    "wallboard":      "Boardroom · Wall Board",
  };

  // Director's-notes stack (bottom-right, Pritesh-facing meta callouts)
  const $directorStack = $("#directorStack");

  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  let activeChapter = null;          // null = lobby
  let CURRENT_PERSONA = null;        // { name, role, avatarText, accent }
  let runToken = 0;                  // bumped on chapter switch / back-to-lobby — old runStory loops bail when stale
  let storyIndex = 0;
  let lastPersona = null;            // "jarvis" | "user" — for consecutive grouping
  let playAllQueue = [];             // chapter ids remaining when "Play all" is active

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

  function activeThread() {
    return activeChapter ? $thread : $lobbyThread;
  }

  function activeContainer() {
    return activeChapter ? $stageMain : $lobbyChat;
  }

  function scrollDown() {
    const el = activeChapter ? $stageMain : $lobbyChat;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      // Lobby chat reveal: once it has any content, drop the data-empty flag
      // so the CSS expands the panel from collapsed to its full height.
      if ($lobbyChat && $lobbyThread.children.length > 0) {
        $lobbyChat.dataset.empty = "false";
      }
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
  function jarvisBubble(innerHTML, { sys = false } = {}) {
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
    activeThread().appendChild(wrap);
    lastPersona = "jarvis";
    scrollDown();
    return wrap;
  }

  function userBubble(text, persona = CURRENT_PERSONA) {
    const wrap = document.createElement("div");
    const isContinued = lastPersona === "user";
    wrap.className = "bubble bubble--user" + (isContinued ? " bubble--continued" : "");
    const initial = (persona && persona.avatarText) || "?";
    const accent  = (persona && persona.accent)     || "var(--accent-1)";
    const name    = (persona && persona.name)       || "You";
    wrap.innerHTML = `
      <div class="bubble__body">
        <div class="bubble__name">${md(name)}</div>
        <div class="bubble__text">${md(text)}</div>
      </div>
      <div class="bubble__avatar bubble__avatar--user"
           style="--persona-accent: ${accent}"
           aria-hidden="true">${md(initial)}</div>
    `;
    activeThread().appendChild(wrap);
    lastPersona = "user";
    scrollDown();
    return wrap;
  }

  function typingBubble() {
    return jarvisBubble(`<span class="typing"><span></span><span></span><span></span></span>`);
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
  // Director's notes — Pritesh-facing meta notifications.
  // These render OUTSIDE the Jarvis ↔ persona chat (fixed bottom-right
  // stack) so the persona's experience stays uncontaminated by demo
  // navigation and benchmark commentary.
  //
  // pushDirectorNote({ title, text, sub?, actions?, autoDismiss? })
  //   • title       — bold one-liner heading
  //   • text        — body copy (markdown subset via md())
  //   • sub         — tiny footnote (optional)
  //   • actions     — [{ label, primary?, onClick, dismiss? }]
  //   • autoDismiss — ms; 0 = persistent until manually closed
  // -------------------------------------------------------------
  function pushDirectorNote({
    title = "Demo note",
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
        <span class="director-note__badge">Director's note</span>
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

  // Story step: { type: "note", title?, text, sub?, autoDismiss? }
  async function renderNote(step) {
    pushDirectorNote({
      title: step.title || "Demo note",
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
    `);
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
    `);
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
      const bubble = jarvisBubble(`<div>${md(step.text)}</div>`);
      const actions = document.createElement("div");
      actions.className = "actions";
      step.choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.className = "action" + (c.primary ? " action--primary" : "") + (c.danger ? " action--danger" : "");
        btn.innerHTML = `${c.glyph ? `<span class="action__glyph">${c.glyph}</span>` : ""}${md(c.label)}`;
        btn.addEventListener("click", () => {
          [...actions.children].forEach((b) => (b.disabled = true));
          userBubble(c.label);
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
      const bubble = jarvisBubble(`<div>${md(step.text)}</div>`);
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
          userBubble(o.userText || `Use ${o.label}`);
          resolve(o);
        });
        grid.appendChild(b);
      });
      bubble.querySelector(".bubble__body").appendChild(card);
      scrollDown();
    });
  }

  // multi-choose — like `choose` but accepts multiple selections plus a
  // confirm CTA. Used by the admin chapter to ask Sarah which identity
  // and observability tools Jarvis should plug into during bootstrap.
  // Returns { picked: [...options], values: ["okta", ...] } so the next
  // beat can confirm the integrations Sarah selected.
  function renderMultiChoose(step) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble(`
        <div>${md(step.text)}</div>
        ${step.sub ? `<div class="bubble__hint">${md(step.sub)}</div>` : ""}
      `);
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
        userBubble(summary);
        resolve({ picked, values: picked.map((p) => p.value) });
      });

      bubble.querySelector(".bubble__body").appendChild(card);
      scrollDown();
      sync();
    });
  }

  function renderLinkCard(step) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble("");
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
      `);
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

  // metric-board — inline KPI tiles inside the chat thread.
  // { type: "metric-board", title?: "...", metrics: [{ label, value, delta?, hint? }] }
  async function renderMetricBoard(step) {
    const bubble = jarvisBubble("");
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

    // Count-up animation on numeric values.
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

  // -------------------------------------------------------------
  // Welcome hero — cinematic chapter intro that takes over the
  // workspace before the chat thread appears. Used by the admin
  // (Sarah) chapter today to show a "Build by describing your
  // vision…" stage with an Install ITSM CTA. Resolves when the
  // user clicks the CTA, presses Enter in its input, or hits Send.
  // -------------------------------------------------------------
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

      // Park the workspace in welcome mode so CSS can hide the dock
      // and let the hero center itself across the full stage.
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

      // Mount as a sibling of the thread inside stage__main so the
      // hero takes over the chat column without removing thread state.
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

      // Subtle entry — let the user notice the hero before the CTA glow.
      requestAnimationFrame(() => hero.classList.add("chapter-welcome--in"));
    });
  }

  // slack-thread — a compact Slack-Block-Kit-style card inside the chat.
  // { type: "slack-thread", channel: "#it-help", messages: [{ from, fromColor?, text, time?, bot? }] }
  async function renderSlackThread(step) {
    const bubble = jarvisBubble("");
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
  // The fullscreen toggle expands the panel to take the entire workspace,
  // collapsing the chat column to zero, for content-heavy pages like the
  // Wall Board or the Team Health view.
  // -------------------------------------------------------------
  function resolveTitle(pageKey, explicitTitle) {
    if (explicitTitle) return explicitTitle;
    if (PAGE_TITLES[pageKey]) return PAGE_TITLES[pageKey];
    // Last-resort: turn the page key into Title Case ("team-health" → "Team Health")
    if (!pageKey) return "Workspace";
    return pageKey
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function openBrowser(url, pageKey, title) {
    if (!activeChapter) return; // browser is chapter-only
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

  // Esc exits fullscreen without closing the panel — natural keyboard UX.
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

    // Optional side-channel into the open side-panel page. Any step can
    // declare `panelEvent: "name"` (and an optional `panelEventDetail`)
    // and the engine will dispatch it on the side panel before the step's
    // own renderer kicks off. Pages can subscribe to drive their own
    // animations in lockstep with the chat — used by `itsm-bootstrap`.
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
      case "user":          userBubble(step.text); break;
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
      if (myToken !== runToken) return; // chapter switched mid-flight — abandon
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
  // End-of-chapter — renders as a Director's note (bottom-right),
  // never as a Jarvis bubble. Personas don't say "End of scene";
  // that's for Pritesh, the demo viewer.
  // -------------------------------------------------------------
  function renderEndOfChapter() {
    const here = activeChapter;
    if (!here) return;
    const idx = (window.CHAPTERS || []).findIndex((c) => c.id === here.id);
    const next = (window.CHAPTERS || [])[idx + 1];

    const actions = [];
    if (next) {
      actions.push({
        label: `Next: **${next.persona.name} — ${next.title}** →`,
        primary: true,
        onClick: () => JARVIS.startChapter(next.id),
      });
    }
    actions.push({
      label: "Back to lobby",
      onClick: () => JARVIS.backToLobby(),
    });

    pushDirectorNote({
      title: `End of ${here.persona.name} — ${here.title}`,
      text: here.endline || "Ready for the next scene?",
      sub: next ? `Chapter ${idx + 2} of ${(window.CHAPTERS || []).length}` : "Final chapter",
      actions,
    });

    // Mark chapter watched in the lobby
    try {
      const watched = JSON.parse(localStorage.getItem("jarvis-watched") || "[]");
      if (!watched.includes(here.id)) watched.push(here.id);
      localStorage.setItem("jarvis-watched", JSON.stringify(watched));
    } catch (_) {}

    // Auto-advance when "Play all" is on
    if (playAllQueue.length > 0) {
      const nextId = playAllQueue.shift();
      setTimeout(() => JARVIS.startChapter(nextId), 1200);
    }
  }

  // -------------------------------------------------------------
  // Lobby grid + persona cards
  // -------------------------------------------------------------
  function renderLobbyGrid() {
    if (!$personaGrid) return;
    const watched = (() => {
      try { return JSON.parse(localStorage.getItem("jarvis-watched") || "[]"); }
      catch (_) { return []; }
    })();

    $personaGrid.innerHTML = "";
    (window.CHAPTERS || []).forEach((c, i) => {
      const isWatched = watched.includes(c.id);
      const btn = document.createElement("button");
      btn.className = "persona-card" + (isWatched ? " is-watched" : "");
      btn.dataset.chapter = c.id;
      btn.style.setProperty("--persona-accent", c.persona.accent || "var(--accent-1)");
      btn.setAttribute("aria-label", `Open chapter ${i + 1}: ${c.persona.name}, ${c.title}`);
      btn.innerHTML = `
        <div class="persona-card__head">
          <div class="persona-card__avatar">${md(c.persona.avatarText || "?")}</div>
          <div class="persona-card__chapter">Ch. ${i + 1}</div>
          ${isWatched ? `<div class="persona-card__watched" title="Watched">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                 stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </div>` : ""}
        </div>
        <div class="persona-card__role">${md(c.persona.role)} · ${md(c.persona.name)}</div>
        <div class="persona-card__title">${md(c.title)}</div>
        <p class="persona-card__blurb">${md(c.blurb || "")}</p>
        <div class="persona-card__cta">
          <span>Play chapter</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
               stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
          </svg>
        </div>
      `;
      btn.addEventListener("click", () => JARVIS.startChapter(c.id));
      $personaGrid.appendChild(btn);
    });
  }

  // -------------------------------------------------------------
  // Suggestion chips (above whisper) — lobby-only.
  // The chapter dock no longer shows static chips so the persona's
  // chat stays uninterrupted; in-bubble fallback chips still appear
  // when Jarvis can't match a free-text question.
  // -------------------------------------------------------------
  function renderSuggestChips() {
    if (!$lobbySuggestChips) return;
    if (activeChapter) {
      $lobbySuggestChips.innerHTML = "";
      return;
    }
    const ctx = window.LOBBY || {};
    const qs = ctx.suggestedQuestions || [];
    $lobbySuggestChips.innerHTML = "";
    qs.forEach((q) => {
      const chip = document.createElement("button");
      chip.className = "suggest-chip";
      chip.type = "button";
      chip.textContent = q;
      chip.addEventListener("click", () => handleWhisper(q, { fromChip: true }));
      $lobbySuggestChips.appendChild(chip);
    });
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

  // Try to spot a chapter intent from free-text in lobby mode.
  // Returns a chapter object or null.
  function matchChapterIntent(text) {
    const t = (text || "").toLowerCase();
    const chapters = window.CHAPTERS || [];
    for (const c of chapters) {
      const tokens = [
        c.id,
        c.persona.name,
        c.persona.role,
        c.title,
        ...(c.intentKeywords || []),
      ].filter(Boolean).map((s) => String(s).toLowerCase());
      if (tokens.some((tok) => t.includes(tok))) return c;
    }
    return null;
  }

  async function renderAnswer(answer, source) {
    const typing = typingBubble();
    await sleep(550);
    typing.querySelector(".bubble__text").innerHTML = md(answer) + sourceDisclosure(source);
  }

  async function renderFallback(ctx) {
    const lines = [
      `I can speak to a few things in this scene — try one of these:`,
    ];
    const typing = typingBubble();
    await sleep(450);
    typing.querySelector(".bubble__text").innerHTML = md(lines[0]);
    // Re-render chips inline beneath the bubble for a clear next step.
    const inlineChips = document.createElement("div");
    inlineChips.className = "suggest-chips suggest-chips--inline";
    (ctx.suggestedQuestions || []).slice(0, 4).forEach((q) => {
      const chip = document.createElement("button");
      chip.className = "suggest-chip";
      chip.type = "button";
      chip.textContent = q;
      chip.addEventListener("click", () => handleWhisper(q, { fromChip: true }));
      inlineChips.appendChild(chip);
    });
    typing.querySelector(".bubble__body").appendChild(inlineChips);
    scrollDown();
  }

  // Single entry point for *any* free-text question coming from
  // either whisper bar (lobby or dock) or a suggestion chip.
  async function handleWhisper(rawText, { fromChip = false } = {}) {
    const text = (rawText || "").trim();
    if (!text) return;
    const lc = text.toLowerCase();

    // Reset whisper inputs so the chat feels responsive
    if ($lobbyWhisperInput) $lobbyWhisperInput.value = "";
    if ($whisperInput)      $whisperInput.value = "";

    // Special control phrases
    if (/^(back to lobby|home|main menu|exit chapter)$/i.test(lc)) {
      JARVIS.backToLobby();
      return;
    }
    if (/^(play all|play all five|run all chapters?)$/i.test(lc)) {
      startPlayAll();
      return;
    }

    // Lobby mode: try to route directly to a chapter when intent is obvious
    if (!activeChapter) {
      const chapter = matchChapterIntent(text);
      if (chapter) {
        userBubble(text, { name: "You", avatarText: "?", accent: "var(--accent-1)" });
        await sleep(400);
        const typing = typingBubble();
        await sleep(450);
        typing.querySelector(".bubble__text").innerHTML =
          md(`Opening **${chapter.persona.name} — ${chapter.title}**…`);
        setTimeout(() => JARVIS.startChapter(chapter.id), 800);
        return;
      }
    }

    // Default: append a user bubble + look up FAQ
    const ctx = activeChapter || (window.LOBBY || {});
    const persona = activeChapter
      ? CURRENT_PERSONA
      : { name: "You", avatarText: "?", accent: "var(--accent-1)" };
    userBubble(text, persona);

    const faq = findFaq(text, ctx.faqs);
    if (faq) {
      await renderAnswer(faq.answer, faq.source);
    } else {
      await renderFallback(ctx);
    }
  }

  // -------------------------------------------------------------
  // Play-All — auto-advance through every chapter
  // -------------------------------------------------------------
  function startPlayAll() {
    const ids = (window.CHAPTERS || []).map((c) => c.id);
    if (!ids.length) return;
    playAllQueue = ids.slice(1);     // first will start now
    JARVIS.startChapter(ids[0]);
  }

  // -------------------------------------------------------------
  // Public API — JARVIS.startChapter / backToLobby
  // -------------------------------------------------------------
  window.JARVIS = {
    startChapter(chapterId) {
      const chapter = findChapter(chapterId);
      if (!chapter) {
        console.warn("Chapter not found:", chapterId);
        return;
      }
      activeChapter = chapter;
      CURRENT_PERSONA = chapter.persona;

      // Topbar chrome
      $btnBackLobby.removeAttribute("hidden");
      $chapterPill.removeAttribute("hidden");
      $chapterAvatar.textContent = chapter.persona.avatarText || "?";
      $chapterAvatar.style.setProperty("--persona-accent", chapter.persona.accent || "var(--accent-1)");
      $chapterRole.textContent  = `${chapter.persona.role} ${chapter.persona.name}`;
      $chapterTitle.textContent = chapter.title;
      document.documentElement.style.setProperty(
        "--chapter-accent", chapter.persona.accent || "var(--accent-1)"
      );
      // Reflect the active persona in the Salesforce profile avatar
      if ($sfAvatar) {
        $sfAvatar.style.background = chapter.persona.accent || "";
        $sfAvatar.setAttribute(
          "aria-label",
          `Profile · ${chapter.persona.name} (${chapter.persona.role})`
        );
        $sfAvatar.title = `${chapter.persona.name} · ${chapter.persona.role}`;
      }

      // Reveal workspace, hide lobby
      $lobby.setAttribute("hidden", "");
      $workspace.removeAttribute("hidden");

      // Reset chat state
      $thread.innerHTML = "";
      $workspace.classList.remove("workspace--welcome");
      $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
      lastPersona = null;
      closeBrowser();
      clearDirectorStack();
      renderSuggestChips();

      // Bump runToken so any prior runStory loop bails immediately
      runToken += 1;
      runStory(chapter.story || []);
    },

    backToLobby() {
      activeChapter = null;
      CURRENT_PERSONA = null;
      runToken += 1;

      $btnBackLobby.setAttribute("hidden", "");
      $chapterPill.setAttribute("hidden", "");
      if ($sfAvatar) {
        $sfAvatar.style.background = "";
        $sfAvatar.setAttribute("aria-label", "View profile");
        $sfAvatar.title = "Profile";
      }

      $workspace.setAttribute("hidden", "");
      $workspace.classList.remove("workspace--welcome");
      $lobby.removeAttribute("hidden");

      $thread.innerHTML = "";
      // Clear any lingering chapter-welcome hero so the next chapter
      // starts from a clean stage.
      $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
      closeBrowser();
      clearDirectorStack();
      renderLobbyGrid();
      renderSuggestChips();
      lastPersona = null;
      // Cancel any in-flight Play-All
      playAllQueue = [];
    },
  };

  // -------------------------------------------------------------
  // Wiring
  // -------------------------------------------------------------
  $btnBackLobby.addEventListener("click", () => JARVIS.backToLobby());

  $ctaPlayAll?.addEventListener("click", () => startPlayAll());

  // Lobby whisper
  $lobbyWhisperSend.addEventListener("click", () => handleWhisper($lobbyWhisperInput.value));
  $lobbyWhisperInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleWhisper($lobbyWhisperInput.value);
  });

  // Dock whisper
  $whisperSend.addEventListener("click", () => handleWhisper($whisperInput.value));
  $whisperInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleWhisper($whisperInput.value);
  });

  // Theme toggle (preserved verbatim from previous build)
  const $themeToggle = $("#themeToggle");
  const THEME_KEY = "jarvis-theme";
  function applyTheme(theme) {
    const isDark = theme === "dark";
    if (isDark) document.documentElement.setAttribute("data-theme", "dark");
    else        document.documentElement.removeAttribute("data-theme");
    if ($themeToggle) {
      $themeToggle.setAttribute("aria-pressed", String(isDark));
      $themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
      $themeToggle.setAttribute("aria-label", $themeToggle.title);
    }
  }
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  $themeToggle?.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  });

  // -------------------------------------------------------------
  // Bootstrap — render the lobby once all story files have loaded
  // -------------------------------------------------------------
  renderLobbyGrid();
  renderSuggestChips();
})();
