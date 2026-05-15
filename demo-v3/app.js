/* =============================================================
   Jarvis · Setup-First Story Engine + Sidenav Router
   -------------------------------------------------------------
   This build is scoped to the IT-admin Setup chapter. The
   multi-persona lobby and supporting chapter files have been
   retired — the app boots straight into the Setup flow.

   This file owns:
     · the persistent left sidenav (collapse, gating, Jarvis toggle)
     · auto-launch of the Setup chapter on first paint
     · the story engine that plays the chapter beat-by-beat
     · the persistent Q&A router (whisper bar) so the IT admin can
       interrupt to ask Jarvis a question
     · workspace-page mounts (Tower / Insight / Horizon / Lens),
       which render into the right-side panel via window.PAGES
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
  const $stage            = $("#stage");
  const $stageMain        = $("#stageMain");
  const $thread           = $("#thread");
  const $whisperInput     = $("#whisperInput");
  const $whisperSend      = $("#whisperSend");
  const $dock             = $("#dock");
  const $stageClose       = $("#stageClose");
  const $stageHistory     = $("#stageHistory");
  const $chatHistory      = $("#chatHistory");
  const $chatHistoryBody  = $("#chatHistoryBody");

  // Side panel — pure surface, no chrome. Workspace pages mount
  // into $browserView. The panel goes full-canvas when the user
  // dismisses the chat (X in the chat header or the Jarvis tile).
  const $sidepanel         = $("#sidepanel");
  const $browserView       = $("#browserViewport");

  // Sidenav — Tower / Insight / Horizon / Lens are the post-setup
  // workspace surfaces (gated until Setup completes). Settings is
  // active during Setup; Profile sits inline below Settings; the
  // Jarvis tile is pinned to the bottom of the rail and toggles
  // the chat panel.
  const $sidenav         = $("#sidenav");
  const $navToggle       = $("#navToggle");
  const $navTower        = $("#navTower");
  const $navInsight      = $("#navInsight");
  const $navHorizon      = $("#navHorizon");
  const $navLens         = $("#navLens");
  const $navSettings     = $("#navSettings");
  const $navProfile      = $("#navProfile");
  const $navJarvis       = $("#navJarvis");

  // Director's-notes stack (bottom-right toasts — used for "Setup
  // complete · Cockpit unlocked" and similar quiet system updates).
  const $directorStack = $("#directorStack");


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

  // Chat-panel collapse (the X on the chat header — or a click on the
  // pinned Jarvis tile in the sidenav — dismisses the panel; clicking
  // the Jarvis tile again restores it). This is a demo, so we always
  // boot with the chat panel open — every reload should land on the
  // welcome stage with Jarvis fully present, regardless of where the
  // user left it last time.
  const CHAT_CLOSED_KEY = "jarvis-chat-closed";
  try { localStorage.removeItem(CHAT_CLOSED_KEY); } catch (_) {}

  // The legacy session-history sidebar (New chat + Recent chats list)
  // was retired in the v3 sidebar redesign. The chat thread is now
  // purely ephemeral — whatever's on screen IS the conversation, and
  // closing the chat panel doesn't snapshot it. We clear the old
  // localStorage entry on bootstrap so it doesn't accumulate stale
  // data after the redesign ships.
  try { localStorage.removeItem("jarvis-sessions"); } catch (_) {}

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
  function jarvisBubble(innerHTML, { sys = false } = {}) {
    const wrap = document.createElement("div");
    const isContinued = lastPersona === "jarvis";
    wrap.className =
      "bubble" +
      (sys ? " bubble--sys" : "") +
      (isContinued ? " bubble--continued" : "");
    // The entire conversation is with Jarvis, so we don't repeat the
    // avatar mark or the "Jarvis" name on every reply — the body is
    // enough to read the message as Jarvis-authored. The user bubble
    // is the only one that needs a visual indicator (its card shape).
    wrap.innerHTML = `
      <div class="bubble__body">
        <div class="bubble__text">${innerHTML}</div>
      </div>
    `;
    $thread.appendChild(wrap);
    lastPersona = "jarvis";
    scrollDown();
    return wrap;
  }

  function userBubble(text) {
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
    return wrap;
  }

  function typingBubble() {
    return jarvisBubble(
      `<span class="typing"><span></span><span></span><span></span></span>`
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

  // Expose a tiny helper for workspace pages (Cockpit, etc.) that
  // want to surface a soft toast without reaching into private
  // pushDirectorNote internals. Single string → quick note; object
  // shape mirrors pushDirectorNote.
  window.directorNote = (input) => {
    const opts = typeof input === "string"
      ? { title: "Cockpit", text: input, autoDismiss: 3200 }
      : { autoDismiss: 3200, ...input };
    return pushDirectorNote(opts);
  };

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
      const titleLead = step.titleLead || cfg.titleLead || "Start with";
      const titleTail = step.titleTail || cfg.titleTail || "Agentic IT Service";
      const cta = step.cta || cfg.cta || "Get Started";
      const placeholder = step.placeholder || cfg.placeholder || "Ask anything";
      // Suggestion chips above the whisper bar — clicking a chip is the
      // same as typing it and hitting send, but in one tap. The chapter
      // can declare them via `welcome.chips` (preferred) or fall back
      // to the existing `suggestedQuestions` so older chapters still work.
      const chips = (step.chips || cfg.chips || activeChapter?.suggestedQuestions || []).slice(0, 3);
      // Default opener that's posted as Alex's first user bubble when
      // the user hits "Get Started" without typing/clicking anything.
      // Lets the right pane look like a natural answer to a real ask
      // instead of magic-by-default.
      const defaultOpener = step.defaultOpener || cfg.defaultOpener || cta;

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
          ${chips.length ? `
            <div class="chapter-welcome__chips" role="group" aria-label="Suggested prompts">
              ${chips.map((c, i) => `
                <button type="button" class="chapter-welcome__chip"
                        data-chip-index="${i}"
                        title="Send: ${md(c)}">
                  <span class="chapter-welcome__chip-glyph" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none"
                         stroke="currentColor" stroke-width="1.6"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                  </span>
                  <span>${md(c)}</span>
                </button>
              `).join("")}
            </div>
          ` : ""}
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

      // The welcome step now resolves with `{ entryText }` — the words
      // the user actually committed to (typed prompt, clicked chip, or
      // the chapter's defaultOpener when they used the bare CTA). This
      // lets the next story step post a believable user bubble before
      // the agent's reply lands. Resolving with the empty string would
      // cause the chapter to skip the bubble entirely.
      const finish = (entryText) => {
        hero.classList.add("chapter-welcome--leaving");
        setTimeout(() => {
          if (hero.parentNode) hero.remove();
          $workspace.classList.remove("workspace--welcome");
          resolve({ entryText: (entryText || "").trim() });
        }, 320);
      };

      const inputEl = hero.querySelector("#chapterWelcomeInput");
      const submitFromInput = () => {
        const v = (inputEl && inputEl.value || "").trim();
        finish(v || defaultOpener);
      };

      hero.querySelector("#chapterWelcomeCta").addEventListener("click", () => finish(defaultOpener));
      hero.querySelector("#chapterWelcomeSend").addEventListener("click", submitFromInput);
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submitFromInput(); }
      });

      // Chip click — same as typing the chip text and hitting send.
      // We mirror the chip into the input briefly for the visual cue
      // (without waiting on it) so the user sees what was sent.
      hero.querySelectorAll(".chapter-welcome__chip").forEach((btn, i) => {
        btn.addEventListener("click", () => {
          const text = chips[i] || defaultOpener;
          if (inputEl) inputEl.value = text;
          finish(text);
        });
      });

      requestAnimationFrame(() => hero.classList.add("chapter-welcome--in"));
    });
  }

  // slack-thread — compact Slack-Block-Kit-style card inside the chat.
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
  // Side panel — pure workspace surface (no chrome bar).
  //
  // The panel always renders edge-to-edge inside its grid column;
  // when the user dismisses the chat (X in the chat header or the
  // sidenav Jarvis tile), the workspace grid hands this column the
  // entire canvas via `.workspace--chat-closed`.
  // -------------------------------------------------------------
  function openBrowser(url, pageKey) {
    $sidepanel.removeAttribute("inert");
    $sidepanel.setAttribute("aria-hidden", "false");
    $workspace.classList.add("workspace--split");

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
    $sidepanel.setAttribute("aria-hidden", "true");
    $sidepanel.setAttribute("inert", "");
    setTimeout(() => { $browserView.innerHTML = ""; }, 600);
  }

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
      case "welcome": {
        // Welcome resolves with the prompt the user committed to. We
        // post that as the first user bubble so the agent's reply that
        // follows reads as an answer to a real question, not a script.
        const result = await renderWelcomeStep(step);
        if (result && result.entryText) userBubble(result.entryText);
        break;
      }
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
        text: "Tower, Insight, Horizon, and Lens are now available in the sidebar.",
        sub: "You can come back to Settings any time.",
        actions: [
          { label: "Open Tower", primary: true,
            onClick: () => navigateTo("tower") },
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Sidenav — gating, collapse, navigation
  // -------------------------------------------------------------
  // Pre-setup we hide Tower / Insight / Horizon / Lens entirely;
  // once Setup completes they reveal in place. Using `is-locked`
  // (display: none) + the native `hidden` attribute keeps the items
  // out of both visual flow AND the keyboard tab order in lockstep.
  //
  // `options.animate` is opt-in: when true, each newly-unlocked item
  // gets a `sidenav__item--revealing` class with a staggered delay so
  // the cascade reads as a deliberate moment — never on bootstrap
  // gating, where the items are simply staying hidden.
  function applySidenavGating(options) {
    const animate = !!(options && options.animate);
    const gatedItems = [
      { el: $navTower,   key: "tower",   title: "Tower · your day-1 control surface" },
      { el: $navInsight, key: "insight", title: "Insight · trends, signals, and patterns" },
      { el: $navHorizon, key: "horizon", title: "Horizon · long-range planning" },
      { el: $navLens,    key: "lens",    title: "Lens · search across your IT graph" },
    ];
    gatedItems.forEach(({ el, title }, i) => {
      if (!el) return;
      const wasLocked = el.classList.contains("is-locked") || el.hasAttribute("hidden");
      if (setupComplete) {
        el.classList.remove("is-locked");
        el.removeAttribute("hidden");
        el.title = title;
        if (animate && wasLocked) {
          // Per-item cascade — Tower first, then Insight, Horizon,
          // and finally Lens — so the eye sweeps top → bottom.
          el.style.setProperty("--reveal-delay", `${i * 120}ms`);
          el.classList.add("sidenav__item--revealing");
          // The longest animation (glow pulse × 2) finishes around
          // 3.5s after the cascade delay. Clear the class after
          // that so hover / focus state goes back to normal.
          const clearAfterMs = 3800 + i * 120;
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
    [$navTower, $navInsight, $navHorizon, $navLens, $navSettings, $navProfile]
      .forEach((el) => {
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

  // -------------------------------------------------------------
  // Chat-panel collapse
  //
  // The X icon on the chat header — or a click on the Jarvis tile
  // pinned to the bottom of the sidenav — collapses the entire chat
  // panel and hands the workspace over to the right-side page panel
  // (Tower / Insight / Horizon / Lens). Clicking the Jarvis tile a
  // second time restores the chat panel.
  //
  // `instant === true` is used at bootstrap so we don't run the
  // panel-slide animation when restoring a persisted state on
  // refresh — the panel just appears in its current shape immediately.
  // -------------------------------------------------------------
  function setChatClosed(closed, { instant = false } = {}) {
    if (instant) {
      $workspace.style.transition = "none";
    }

    // Collapsing the chat always collapses the history drawer too —
    // otherwise reopening the chat from the Jarvis tile would land
    // mid-drawer with no obvious way out for casual demo viewers.
    if (closed && $stage?.getAttribute("data-history") === "1") {
      $stage.setAttribute("data-history", "0");
      $chatHistory?.setAttribute("aria-hidden", "true");
      $stageHistory?.setAttribute("aria-pressed", "false");
      $stageHistory?.setAttribute("aria-label", "Open chat history");
    }

    $workspace.classList.toggle("workspace--chat-closed", closed);

    // Reflect the chat-panel state on the Jarvis tile.
    //   aria-pressed=true  → chat is OPEN  (toggle would close it)
    //   aria-pressed=false → chat is CLOSED (toggle would open it)
    if ($navJarvis) {
      $navJarvis.setAttribute("aria-pressed", String(!closed));
      $navJarvis.title = closed ? "Open Jarvis" : "Hide Jarvis";
      $navJarvis.setAttribute(
        "aria-label",
        closed ? "Open Jarvis chat panel" : "Hide Jarvis chat panel"
      );
    }

    if ($stageClose) {
      $stageClose.setAttribute("aria-expanded", String(!closed));
    }

    try { localStorage.setItem(CHAT_CLOSED_KEY, closed ? "1" : "0"); } catch (_) {}

    if (instant) {
      // Force a reflow then restore the transitions on the next frame
      // so subsequent toggles animate normally.
      void $workspace.offsetHeight;
      requestAnimationFrame(() => {
        $workspace.style.transition = "";
      });
    }

    // When reopening the chat in the middle of a Setup/story run,
    // we want the input to be ready for the next interrupt — but
    // only after the slide-in finishes so focus doesn't fight the
    // animation. Wrapped in a guard so non-chat surfaces (e.g. the
    // chat is closed while a workspace page is loading) don't pull
    // focus away from the page being viewed.
    if (!closed && document.activeElement === document.body) {
      window.setTimeout(() => $whisperInput?.focus({ preventScroll: true }), 320);
    }
  }

  // Strip everything chapter-y from the workspace and present a clean
  // chat surface. Used as an internal helper when the user asks Jarvis
  // a free-text question from a workspace page (we drop them into the
  // chat thread so the answer has somewhere to land).
  function enterChatMode() {
    runToken += 1;
    mode = "chat";
    activeChapter = null;
    CURRENT_PERSONA = null;

    $workspace.classList.remove("workspace--welcome");
    $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
    $thread.innerHTML = "";
    lastPersona = null;
    closeBrowser();
    setActiveNavItem(null);
    $whisperInput.focus();
  }

  // -------------------------------------------------------------
  // Workspace pages — Tower / Insight / Horizon / Lens
  //
  // Each page mounts into the right-side panel via the shared
  // browser surface (`openBrowser` + `window.PAGES`). The chat
  // column on the left stays as-is so the user can interrupt with
  // a Jarvis question without losing the page they were looking at,
  // and clicking the Jarvis tile in the sidenav can collapse the
  // chat column to give the page the full canvas.
  // -------------------------------------------------------------
  const WORKSPACE_PAGES = {
    tower: {
      title: "Tower",
      lead: "Your day-1 control surface. Agents, signals, and sign-offs at a glance.",
      hint: "Design coming soon — this is the post-setup landing surface for Alex.",
    },
    insight: {
      title: "Insight",
      lead: "Trends, capacity, and pattern detection across your IT graph.",
      hint: "Design coming soon.",
    },
    horizon: {
      title: "Horizon",
      lead: "Long-range planning. Track upcoming change windows and forecast risk.",
      hint: "Design coming soon.",
    },
    lens: {
      title: "Lens",
      lead: "Search across every service, asset, and incident in the ontology.",
      hint: "Design coming soon.",
    },
  };

  // Register a generic placeholder factory for each workspace page so
  // `openBrowser(null, key)` can mount it. Stories register their own
  // richer factories (e.g. the Setup story's "cockpit" page) before
  // app.js runs; `Object.assign` here preserves those entries and only
  // fills in the gaps for the four nav surfaces.
  window.PAGES = window.PAGES || {};
  Object.entries(WORKSPACE_PAGES).forEach(([key, cfg]) => {
    if (window.PAGES[key]) return; // story-provided factory wins
    window.PAGES[key] = (panel) => {
      panel.innerHTML = `
        <div class="workspace-placeholder">
          <div class="workspace-placeholder__inner">
            <div class="workspace-placeholder__eyebrow">${md(cfg.title)}</div>
            <h2 class="workspace-placeholder__title">${md(cfg.lead)}</h2>
            <p class="workspace-placeholder__hint">${md(cfg.hint)}</p>
          </div>
        </div>
      `;
    };
  });

  function navigateTo(key) {
    const cfg = WORKSPACE_PAGES[key];
    if (!cfg) return;
    if (!setupComplete) return; // gated

    runToken += 1;
    mode = "page";
    activeChapter = null;
    CURRENT_PERSONA = null;

    $workspace.classList.remove("workspace--welcome");
    $stageMain.querySelectorAll(".chapter-welcome").forEach((n) => n.remove());
    setActiveNavItem(key);

    // Mount the page in the right-side panel — the workspace grid
    // moves to its split layout (chat column shrinks, page column
    // takes ~60%). If the chat is currently dismissed (Jarvis tile
    // pressed off), the workspace--chat-closed class is still
    // applied and the page expands to fill the entire canvas.
    openBrowser(null, key);
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
  }

  async function renderFallback() {
    const typing = typingBubble();
    await sleep(450);
    const html = md(
      "I'm here to help with setup, configuration, and anything Jarvis can do for IT. " +
      "Ask me about the install, the CMDB, integrations, or how to roll back changes."
    );
    typing.querySelector(".bubble__text").innerHTML = html;
  }

  // Single entry point for free-text questions from the dock whisper.
  //
  // Behavior depends on `mode`:
  //   • setup → the question is treated as an inline interrupt; the
  //     bubble + FAQ answer are appended to the running thread but
  //     the story keeps playing underneath.
  //   • chat  → ordinary back-and-forth on the chat surface.
  //   • page  → the user navigated to Tower/Insight/Horizon/Lens and
  //     then asked a question. We promote them to chat mode so the
  //     answer has a thread to land in.
  async function handleWhisper(rawText) {
    const text = (rawText || "").trim();
    if (!text) return;

    if ($whisperInput) $whisperInput.value = "";

    // Special control phrase — re-run Setup from the beginning.
    if (/^(open settings|back to setup|setup)$/i.test(text)) {
      startSetup();
      return;
    }

    // From a workspace page, the chat surface is empty — promote the
    // user to chat mode so their question has somewhere to land.
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

  // Chat-panel header X — dismiss the chat (workspace page below
  // takes the full canvas). `setChatClosed` also collapses the
  // history drawer so reopening the chat lands on the thread.
  $stageClose?.addEventListener("click", () => setChatClosed(true));

  // -----------------------------------------------------------------
  // CHAT-HISTORY DRAWER
  // -----------------------------------------------------------------
  // Dummy past-conversation entries for the demo. Each item is a
  // (title, preview) pair grouped by the human-readable date label
  // we want to display. `private: true` adds a small lock glyph next
  // to the title — mirrors how Slack flags restricted channels in
  // the reference design. In production this list would be paginated
  // from the Jarvis chat-store; today it's a hand-curated set of
  // conversations that fit Sarah's IT-admin persona.
  const CHAT_HISTORY = [
    {
      date: "Tuesday, May 12th",
      items: [
        {
          title: "Change the title from HRSM to ITSM",
          preview: "Unfortunately, this canvas is read-only for you, so I'm queuing the rename for an editor.",
        },
      ],
    },
    {
      date: "Friday, May 8th",
      items: [
        {
          title: "Summarise servicecloud-proactive-itsm-wa…",
          preview: "Got it! Let me fetch messages from after 7:54 PM today.",
          private: true,
        },
        {
          title: "You have created the core stack using the Rea…",
          preview: "Got the full context. @Kumar Ankit is asking why you chose the legacy path.",
        },
        {
          title: "I want wispr flow access — what do I do, IT appro…",
          preview: "Looks like the Techforce bot didn't have enough context. Routing to Identity.",
        },
      ],
    },
    {
      date: "Thursday, May 7th",
      items: [
        {
          title: "I want everything related to GUS that's been …",
          preview: "The first search didn't find an exact channel match. Let me widen the window.",
        },
      ],
    },
    {
      date: "Tuesday, May 5th",
      items: [
        {
          title: "Can you look through my activity threads from …",
          preview: "I'll dig through your recent activity threads right now and pull anything urgent.",
        },
        {
          title: "What is SI in ITSM",
          preview: "SI stands for Service Integration — the practice of coordinating across vendors.",
        },
      ],
    },
    {
      date: "Monday, May 4th",
      items: [
        {
          title: "Tell me more about workshop preparation ma…",
          preview: "Let me fetch more context from all three conversations and stitch them together.",
        },
        {
          title: "Can you look through my activity threads fro…",
          preview: "Now let me look at the most relevant threads from the past week.",
        },
      ],
    },
    {
      date: "Sunday, May 3rd",
      items: [
        {
          title: "Auto-rotate the service principals on payments-gateway",
          preview: "Scheduling rotation for next Friday's change window. Coordinating with Identity.",
          private: true,
        },
        {
          title: "What's the current SLA on payments-gateway?",
          preview: "99.95% uptime, measured per calendar month. Last breach was Feb 14 — 7m 18s.",
        },
      ],
    },
  ];

  // Inline-SVG lock glyph for the private-thread flag. Kept here (not
  // in CSS) so it inherits currentColor from the title row and stays
  // crisp in both themes without a second asset round-trip.
  const HISTORY_LOCK_ICON =
    `<svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor"
          stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
       <rect x="3" y="6.4" width="8" height="5.6" rx="1"/>
       <path d="M4.6 6.4V4.6a2.4 2.4 0 0 1 4.8 0v1.8"/>
     </svg>`;

  // Same pattern as the cockpit factory: local HTML-escape because
  // the page-level `md()` helper lives inside its own IIFE scope.
  const escHistory = (s) => String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Live-filter state. Bumped by the search input handler; consumed
  // by renderChatHistory so every keystroke yields a fresh DOM.
  let historyQuery = "";

  function renderChatHistory() {
    if (!$chatHistoryBody) return;
    const q = historyQuery.trim().toLowerCase();

    // Case-insensitive substring match against title + preview.
    // Groups with zero surviving items collapse so the date headers
    // never sit alone above an empty list.
    const groups = q
      ? CHAT_HISTORY
          .map((g) => ({
            ...g,
            items: g.items.filter(
              (it) =>
                it.title.toLowerCase().includes(q) ||
                it.preview.toLowerCase().includes(q)
            ),
          }))
          .filter((g) => g.items.length > 0)
      : CHAT_HISTORY;

    if (groups.length === 0) {
      $chatHistoryBody.innerHTML = `
        <div class="chat-history__empty">
          No conversations match <strong>"${escHistory(historyQuery)}"</strong>.
        </div>
      `;
      return;
    }

    $chatHistoryBody.innerHTML = groups.map((group) => `
      <section class="chat-history__group">
        <h3 class="chat-history__date">${escHistory(group.date)}</h3>
        <ul class="chat-history__list">
          ${group.items.map((item) => `
            <li class="chat-history__item" role="listitem" tabindex="0"
                data-title="${escHistory(item.title)}"
                aria-label="Open conversation: ${escHistory(item.title)}">
              <div class="chat-history__entry-title">
                <span class="chat-history__entry-name">${escHistory(item.title)}</span>
                ${item.private ? HISTORY_LOCK_ICON : ""}
              </div>
              <div class="chat-history__entry-sub">${escHistory(item.preview)}</div>
            </li>
          `).join("")}
        </ul>
      </section>
    `).join("");
  }

  function setHistoryOpen(open) {
    if (!$stage || !$chatHistory) return;
    $stage.setAttribute("data-history", open ? "1" : "0");
    $chatHistory.setAttribute("aria-hidden", String(!open));
    $stageHistory?.setAttribute("aria-pressed", String(open));
    $stageHistory?.setAttribute(
      "aria-label",
      open ? "Close chat history" : "Open chat history"
    );
    if (open) {
      renderChatHistory();
      // Drop focus into the search field — the most likely next
      // action and the canonical "command" for the drawer now that
      // the header has no other affordances.
      $chatHistory.querySelector(".chat-history__search-input")?.focus();
    } else {
      // Reset the live filter so reopening the drawer always lands
      // on the full, unfiltered list (matches the chat-thread reset
      // semantics when the chat panel is dismissed).
      historyQuery = "";
      const $input = $chatHistory.querySelector(".chat-history__search-input");
      if ($input) $input.value = "";
      $stageHistory?.focus();
    }
  }

  // History icon = toggle. Pressed-state reflects drawer visibility.
  $stageHistory?.addEventListener("click", () => {
    const isOpen = $stage?.getAttribute("data-history") === "1";
    setHistoryOpen(!isOpen);
  });

  // Live-filter — every keystroke re-renders against the dummy data.
  // The list is tiny (≤10 entries) so a full re-render is cheaper
  // than per-row classToggle gymnastics and keeps the empty-state
  // path unified with the initial render.
  $("#chatHistorySearch")?.addEventListener("input", (e) => {
    historyQuery = e.target.value;
    renderChatHistory();
  });

  // Delegated handlers for the filter button + item clicks. The
  // search field is excluded explicitly so clicks inside it don't
  // get treated as a row activation.
  $chatHistory?.addEventListener("click", (e) => {
    if (e.target.closest(".chat-history__search")) return;
    if (e.target.closest(".chat-history__filter")) {
      pushDirectorNote({
        title: "Filter history",
        text: "Filtering past conversations is coming in a future build.",
        autoDismiss: 2400,
      });
      return;
    }
    const item = e.target.closest(".chat-history__item");
    if (item) {
      const title = item.getAttribute("data-title") || "this conversation";
      setHistoryOpen(false);
      pushDirectorNote({
        title: "Restoring conversation",
        text: title,
        sub: "Demo mode — past chats aren't wired up yet.",
        autoDismiss: 2800,
      });
    }
  });

  // Keyboard parity — Esc closes the drawer (also when typing in
  // the search field), Enter/Space activates a focused item.
  $chatHistory?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setHistoryOpen(false);
      return;
    }
    const item = e.target.closest?.(".chat-history__item");
    if (item && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      item.click();
    }
  });

  // Jarvis tile in the sidenav — toggle the chat panel open/closed.
  // `aria-pressed=true` means the chat is currently open, so a click
  // should close it; `aria-pressed=false` means it's closed, so a
  // click should open it.
  $navJarvis?.addEventListener("click", () => {
    const open = $navJarvis.getAttribute("aria-pressed") === "true";
    setChatClosed(open);
  });

  $navSettings.addEventListener("click", () => startSetup());

  // Gated workspace nav — each item opens its page in the right-side
  // panel via `navigateTo`. The `disabled` guard is belt-and-braces;
  // gated items are also `hidden`, so they shouldn't normally be
  // reachable until Setup completes.
  $navTower?.addEventListener("click", (e) => {
    if ($navTower.disabled) { e.preventDefault(); return; }
    navigateTo("tower");
  });
  $navInsight?.addEventListener("click", (e) => {
    if ($navInsight.disabled) { e.preventDefault(); return; }
    navigateTo("insight");
  });
  $navHorizon?.addEventListener("click", (e) => {
    if ($navHorizon.disabled) { e.preventDefault(); return; }
    navigateTo("horizon");
  });
  $navLens?.addEventListener("click", (e) => {
    if ($navLens.disabled) { e.preventDefault(); return; }
    navigateTo("lens");
  });

  $navProfile?.addEventListener("click", () => {
    setActiveNavItem("profile");
    pushDirectorNote({
      title: "Profile",
      text: "Alex Kim · IT Architect · Acme Global.",
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
  // Bootstrap — restore sidenav state, gate items, and auto-launch
  // the Setup chapter on first paint.
  //
  // Deep links (URL hash) bypass the setup story so the Cockpit
  // (and the other workspace surfaces) can be linked to directly:
  //   #cockpit | #tower   → open the Cockpit full-canvas
  //   #insight             → open Insight
  //   #horizon             → open Horizon
  //   #lens                → open Lens
  // The deep-link path treats Setup as already complete (so the
  // nav reveals without the install cascade) and dismisses the
  // chat panel so the surface gets the entire canvas.
  // -------------------------------------------------------------
  (function bootstrap() {
    let initialCollapsed = false;
    try { initialCollapsed = localStorage.getItem(SIDENAV_KEY) === "1"; } catch (_) {}
    setCollapsed(initialCollapsed);

    const hash = (location.hash || "").replace(/^#/, "").toLowerCase();
    const deepLinkPage = {
      cockpit: "tower",      // Cockpit is the Tower nav item's page
      tower:   "tower",
      insight: "insight",
      horizon: "horizon",
      lens:    "lens",
    }[hash];

    if (deepLinkPage) {
      // Skip the setup story — jump straight to the requested
      // workspace surface. The chat panel is closed so the page
      // gets the full canvas (matches the design comp).
      setupComplete = true;
      applySidenavGating();
      setChatClosed(true, { instant: true });
      $workspace.classList.remove("workspace--welcome");
      navigateTo(deepLinkPage);
    } else {
      setChatClosed(false, { instant: true });
      applySidenavGating();
      startSetup();
    }
  })();
})();
