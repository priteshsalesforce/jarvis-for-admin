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
  const $stageNewChat     = $("#stageNewChat");
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

  // -------------------------------------------------------------
  // Typewriter streaming — character-by-character reveal of Jarvis
  // text replies. The bubble's final HTML structure (markdown,
  // <strong>, lists, links) is set in the DOM up-front, then all
  // text nodes are blanked and re-filled char-by-char in document
  // order. This means broken-tag artefacts are impossible by
  // construction; the visible animation is always over text only.
  // -------------------------------------------------------------
  const STREAM = {
    charsPerSec: 55,        // ~18ms/char baseline cadence
    longThreshold: 220,     // chars before we accelerate
    longChunkSpeed: 200,    // accelerated cadence past the threshold
    scrollEvery: 5,         // scroll every N chars (avoid jitter)
    caretHTML: '<span class="stream-caret" aria-hidden="true"></span>',
  };

  // True when the OS / user prefers reduced motion — streaming
  // collapses to an instant set so a11y users aren't held hostage
  // by the animation (Rule C9).
  const prefersReducedMotion = () =>
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Stream `htmlString` into `targetEl`, revealing characters at a
  // humanly readable cadence. Returns a Promise that resolves when
  // streaming completes (or aborts if the element leaves the DOM).
  async function streamText(targetEl, htmlString, opts = {}) {
    if (!targetEl) return;
    const charsPerSec   = opts.charsPerSec   ?? STREAM.charsPerSec;
    const longThreshold = opts.longThreshold ?? STREAM.longThreshold;
    const longSpeed     = opts.longChunkSpeed ?? STREAM.longChunkSpeed;

    // Place the final markup in the DOM so any structure (bold,
    // links, lists) is laid out at its final position from frame 1.
    targetEl.innerHTML = htmlString;

    // Reduced-motion guard — reveal everything immediately, no caret.
    if (prefersReducedMotion()) {
      scrollDown();
      return;
    }

    // Collect text nodes in document order; snapshot their content
    // then clear them. We reveal by progressively re-assigning text.
    const walker = document.createTreeWalker(
      targetEl, NodeFilter.SHOW_TEXT, null
    );
    const items = [];
    let n;
    while ((n = walker.nextNode())) {
      items.push({ node: n, text: n.textContent });
      n.textContent = "";
    }

    // Empty bubble (e.g. a structured widget with no text nodes)
    // doesn't need streaming.
    if (!items.length) { scrollDown(); return; }

    // Trailing caret — sits at the END of the bubble during the
    // whole stream and gets removed when we're done.
    const caret = document.createElement("span");
    caret.className = "stream-caret";
    caret.setAttribute("aria-hidden", "true");
    targetEl.appendChild(caret);

    let typed = 0;
    let scrollCounter = 0;
    const slowMs = 1000 / charsPerSec;
    const fastMs = 1000 / longSpeed;

    try {
      for (const item of items) {
        const { node, text } = item;
        for (let i = 0; i < text.length; i++) {
          // Bail cleanly if the bubble was removed from the DOM
          // (e.g. user hit "New chat" or navigated away).
          if (!targetEl.isConnected) return;
          node.textContent = text.slice(0, i + 1);
          typed += 1;
          if (++scrollCounter >= STREAM.scrollEvery) {
            scrollCounter = 0;
            scrollDown();
          }
          const ms = typed < longThreshold ? slowMs : fastMs;
          await sleep(ms);
        }
      }
      scrollDown();
    } finally {
      if (caret.parentNode) caret.parentNode.removeChild(caret);
    }
  }

  // Create a fresh Jarvis bubble with the three-dot indicator,
  // wait briefly so the dots register, then stream `htmlString`
  // into it. Returns { bubble, done } so callers can append
  // chiclets/buttons to the same bubble and await completion.
  function streamJarvis(htmlString, opts = {}) {
    const bubble = typingBubble();
    const dotDwell = opts.dotDwell ?? 400;
    const done = (async () => {
      if (dotDwell > 0) await sleep(dotDwell);
      if (!bubble.isConnected) return;
      const target = bubble.querySelector(".bubble__text");
      await streamText(target, htmlString, opts);
    })();
    return { bubble, done };
  }

  // Stream `htmlString` into an existing, already-mounted bubble's
  // .bubble__text container. Used to swap a typingBubble()'s dots
  // for streamed text, or to stream into a bubble created earlier
  // with `jarvisBubble("")`. Returns a Promise.
  function streamInto(bubble, htmlString, opts = {}) {
    if (!bubble) return Promise.resolve();
    const target = bubble.querySelector(".bubble__text") || bubble;
    return streamText(target, htmlString, opts);
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
    await streamInto(typing, md(step.text));
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
      const { bubble, done } = streamJarvis(`<div>${md(step.text)}</div>`);
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
      // Wait for the question to finish typing in before revealing
      // the action buttons — the user shouldn't be able to commit
      // to a choice before they've seen the prompt.
      done.then(() => {
        bubble.querySelector(".bubble__body").appendChild(actions);
        scrollDown();
      });
    });
  }

  function renderChoose(step) {
    return new Promise((resolve) => {
      const { bubble, done } = streamJarvis(`<div>${md(step.text)}</div>`);
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
      // Reveal the choice card only after the question has typed in
      // so the user reads the prompt before the affordances appear.
      done.then(() => {
        bubble.querySelector(".bubble__body").appendChild(card);
        scrollDown();
      });
    });
  }

  function renderMultiChoose(step) {
    return new Promise((resolve) => {
      const { bubble, done } = streamJarvis(`
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

      // Reveal the multi-select card once the prompt has typed in.
      done.then(() => {
        bubble.querySelector(".bubble__body").appendChild(card);
        scrollDown();
        sync();
      });
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
  // Tracks the page currently mounted in the side panel. Used by the
  // Add Agent wizard so that when it ends we can restore the dock
  // chiclets only if the user is still on the page that publishes them.
  let currentPage = null;

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

    currentPage = pageKey || null;
    renderDockChiclets(pageKey);
  }

  function closeBrowser() {
    $workspace.classList.remove("workspace--split");
    $sidepanel.setAttribute("aria-hidden", "true");
    $sidepanel.setAttribute("inert", "");
    setTimeout(() => { $browserView.innerHTML = ""; }, 600);
    currentPage = null;
    clearDockChiclets();
  }

  // -------------------------------------------------------------
  // Dock chiclets — contextual quick actions above the whisper bar.
  // The rail lives in the dock (#dockChiclets) and is populated per
  // page mounted in the right panel. .suggest-chips:empty{display:none}
  // keeps the rail invisible on pages without contextual actions.
  // -------------------------------------------------------------
  const DOCK_CHICLETS = {
    // Cockpit (Tower) — agent-management shortcuts that land John
    // in the agent builder / library without leaving the cockpit.
    tower: [
      { id: "add-agent",       label: "Add Agent" },
      { id: "discover-agents", label: "Discover Agents" },
    ],
  };

  function renderDockChiclets(pageKey) {
    const host = document.getElementById("dockChiclets");
    if (!host) return;
    const set = DOCK_CHICLETS[pageKey] || [];
    if (!set.length) { host.innerHTML = ""; return; }
    // Same markup as the home chiclets (.home__chiclet) so both
    // surfaces render with the identical pill design — only the
    // routing differs (data-dock-chiclet vs data-chiclet).
    host.innerHTML = set.map((c) => `
      <button class="home__chiclet" type="button" data-dock-chiclet="${c.id}">
        <span class="home__chiclet-icon" aria-hidden="true">${HOME_SPARKLE}</span>
        <span class="home__chiclet-label">${md(c.label)}</span>
      </button>
    `).join("");
  }

  function clearDockChiclets() {
    const host = document.getElementById("dockChiclets");
    if (host) host.innerHTML = "";
  }

  function handleDockChiclet(id) {
    if (id === "add-agent") {
      // Double-click guard — the wizard already echoes the entry
      // gesture; a second click should be a no-op, not a duplicate
      // "Add Agent" user bubble.
      if (agentWizard.active) return;
      // Click "speaks" for the user — drop a user bubble first so
      // the conversation reads naturally, then start the wizard.
      // Make sure the chat panel is visible too; if John collapsed
      // the Jarvis tile, the bubble would otherwise land off-screen.
      setChatClosed(false);
      userBubble("Add Agent");
      agentWizard.start();
    } else if (id === "discover-agents") {
      userBubble("Discover Agents");
      pushDirectorNote({
        title: "Agent library",
        text:  "Opening the discovery catalogue.",
        autoDismiss: 2400,
      });
      streamJarvis(md(
        "Here's the **Agent Library** — pre-built agents across **Identity**, " +
        "**Reliability**, **Compliance**, and **Cost**. Tap one to clone and customise."
      ));
      lastPersona = "jarvis";
    }
  }

  document.getElementById("dockChiclets")?.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-dock-chiclet]");
    if (!trigger) return;
    handleDockChiclet(trigger.getAttribute("data-dock-chiclet"));
  });

  // -------------------------------------------------------------
  // Add Agent — conversational wizard
  // -------------------------------------------------------------
  // A 4-step in-chat flow that captures the minimum slots needed
  // to spawn a new agent in the Cockpit:
  //   Q1  jtbd   (free text from whisper bar)
  //   Q2  domain (chiclet pills)
  //   Q3  name   (chiclet: "Use suggestion" or free text)
  //   Q4  level  (chiclet pills, L1-L4)
  // Then a preview card with [Create] / [Cancel]. On Create we
  // dispatch `cockpit:add-agent` on $sidepanel; the cockpit
  // factory listens, unshifts the agent, re-renders the grid,
  // and the new card lands at the top with the "New" badge.
  //
  // The wizard is a single closure-scoped object. The whisper-bar
  // submit handler checks `agentWizard.pendingText` and routes
  // free-text input here when set; chip-based steps are wired
  // via a single delegated click listener on $thread.
  // -------------------------------------------------------------
  const AGENT_DOMAINS = [
    { id: "reliability", label: "Reliability" },
    { id: "cost",        label: "Cost" },
    { id: "identity",    label: "Identity" },
    { id: "compliance",  label: "Compliance" },
  ];

  const AGENT_LEVELS = [
    { id: "L1", blurb: "Watch only, page me for everything" },
    { id: "L2", blurb: "Watch and triage, ask before acting" },
    { id: "L3", blurb: "Act on low-risk, ask before high-impact" },
    { id: "L4", blurb: "Full autonomy with audit trail" },
  ];

  // Sparkle glyph for chiclet pills inside Jarvis bubbles. Mirrors
  // the home/dock chiclet treatment so the surfaces feel unified.
  const WIZ_SPARKLE = `
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
         stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 1.5l1.4 3.4 3.4 1.4-3.4 1.4L8 11.1 6.6 7.7 3.2 6.3l3.4-1.4L8 1.5z"/>
      <path d="M12.6 11.2l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z"/>
    </svg>`;

  // Tiny keyword heuristics — keep the matchers narrow so we don't
  // over-claim. If nothing hits we default to reliability and let
  // the user re-pick on Q2 (the chips make it a one-tap fix).
  function inferDomain(text) {
    const t = (text || "").toLowerCase();
    const hit = (...keys) => keys.some((k) => t.includes(k));
    if (hit("cost", "spend", "budget", "license", "idle", "aws cost", "gcp cost")) return "cost";
    if (hit("onboard", "new hire", "new user", "signup", "sign-up", "provision",
            "access", "mfa", "role", "permission", "principal", "sso", "okta")) return "identity";
    if (hit("audit", "sox", "gdpr", "hipaa", "evidence", "control", "attestation", "compliance")) return "compliance";
    if (hit("latency", "uptime", "sla", "p95", "outage", "downtime", "breach", "error rate")) return "reliability";
    return "reliability";
  }

  // Name suggestion — capitalise the most distinctive noun-y keyword
  // in the JTBD and append "Agent". Cheap, predictable, and the user
  // can always override with "Type my own".
  function suggestName(jtbd) {
    const t = (jtbd || "").toLowerCase();
    const map = [
      [/(onboard|new hire|new user|signup|sign-up|provision)/, "OnboardingAgent"],
      [/(uptime|outage|downtime|availability)/, "UptimeAgent"],
      [/(spend|cost|budget)/,                "SpendAgent"],
      [/(license|seat|idle)/,                "LicenseAgent"],
      [/(access|mfa|role|permission|sso)/,   "AccessAgent"],
      [/(audit|sox|gdpr|evidence|control)/,  "ComplianceAgent"],
      [/(patch|cve|vulnerab)/,               "PatchAgent"],
      [/(slack|teams|channel)/,              "ChannelAgent"],
      [/(rollback|release|deploy)/,          "ReleaseAgent"],
      [/(sla|breach)/,                       "SLAAgent"],
      [/(latency|p95|response time)/,        "LatencyAgent"],
    ];
    for (const [re, name] of map) if (re.test(t)) return name;
    return "CustomAgent";
  }

  // Render a single `.home__chiclet` pill inside a Jarvis bubble.
  // `selected` styles the pill as the recommended option.
  function wizChipHTML(value, label, { selected = false } = {}) {
    return `
      <button class="home__chiclet${selected ? " home__chiclet--selected" : ""}"
              type="button" data-wizard-chip="${value}">
        <span class="home__chiclet-icon" aria-hidden="true">${WIZ_SPARKLE}</span>
        <span class="home__chiclet-label">${label}</span>
      </button>
    `;
  }

  // Append a chip row to a Jarvis bubble that has finished streaming.
  // The row reuses `.home__chiclets` so it inherits the home/dock
  // chiclet treatment (gap, wrap, alignment) plus our bubble-scoped
  // overrides in styles.css.
  function appendChipRow(bubble, chipsHTML, ariaLabel) {
    if (!bubble) return;
    const target = bubble.querySelector(".bubble__text");
    if (!target) return;
    const row = document.createElement("div");
    row.className = "home__chiclets bubble__chiclets";
    row.setAttribute("role", "group");
    if (ariaLabel) row.setAttribute("aria-label", ariaLabel);
    row.innerHTML = chipsHTML;
    target.appendChild(row);
    scrollDown();
  }

  const agentWizard = {
    active:        false,
    step:          null,   // "jtbd" | "domain" | "name-pick" | "name-text" | "level" | "preview"
    pendingText:   null,   // when set, the whisper-bar submit hands input to this fn
    slots:         { jtbd: "", domain: "", name: "", level: "L2" },

    // ----- entry --------------------------------------------------
    start() {
      if (this.active) return;            // re-entry guard
      this.active = true;
      this.step   = "jtbd";
      this.slots  = { jtbd: "", domain: "", name: "", level: "L2" };
      // Hide the "Add Agent" / "Discover Agents" pills above the
      // whisper bar — the wizard is the in-flight equivalent and
      // a second "Add Agent" tap should not be offered until it
      // either commits or cancels. Restored on reset().
      clearDockChiclets();
      this.askJTBD();
    },

    // ----- Q1: JTBD -----------------------------------------------
    askJTBD() {
      this.step = "jtbd";
      this.pendingText = (text) => this.captureJTBD(text);
      streamJarvis(md(
        "Let's build you an agent. In one sentence — **what should it do**? " +
        "e.g. *\"onboard new hires in Salesforce — provision access on day one and notify their manager\"*."
      ));
      lastPersona = "jarvis";
    },

    captureJTBD(text) {
      this.pendingText = null;
      this.slots.jtbd   = text;
      this.slots.domain = inferDomain(text);
      this.slots.name   = suggestName(text);
      this.askDomain();
    },

    // ----- Q2: Domain --------------------------------------------
    askDomain() {
      this.step = "domain";
      const inferredLabel = AGENT_DOMAINS.find((d) => d.id === this.slots.domain)?.label || "Reliability";
      const chips = AGENT_DOMAINS.map((d) =>
        wizChipHTML(`domain:${d.id}`, d.label, { selected: d.id === this.slots.domain })
      ).join("");
      const prompt = `<div>Sounds like a <strong>${inferredLabel}</strong> agent. Right domain?</div>`;
      const { bubble, done } = streamJarvis(prompt);
      done.then(() => appendChipRow(bubble, chips, "Pick a domain"));
      lastPersona = "jarvis";
    },

    captureDomain(domainId) {
      this.slots.domain = domainId;
      const label = AGENT_DOMAINS.find((d) => d.id === domainId)?.label || domainId;
      userBubble(label);
      this.askName();
    },

    // ----- Q3: Name ----------------------------------------------
    askName() {
      this.step = "name-pick";
      const chips =
        wizChipHTML("name:use-suggestion", `Use \u201C${this.slots.name}\u201D`, { selected: true }) +
        wizChipHTML("name:type", "Type my own");
      const prompt = `<div>What should I call it? I suggest <strong>${this.slots.name}</strong>.</div>`;
      const { bubble, done } = streamJarvis(prompt);
      done.then(() => appendChipRow(bubble, chips, "Name choice"));
      lastPersona = "jarvis";
    },

    captureNameChip(choice) {
      if (choice === "use-suggestion") {
        userBubble(`Use “${this.slots.name}”`);
        this.askLevel();
      } else if (choice === "type") {
        userBubble("Type my own");
        this.step = "name-text";
        this.pendingText = (text) => this.captureTypedName(text);
        streamJarvis(md("Sure — **what should I call it**? Type the name in the whisper bar."));
        lastPersona = "jarvis";
      }
    },

    captureTypedName(text) {
      this.pendingText = null;
      const cleaned = text.replace(/\s+/g, "").slice(0, 40) || this.slots.name;
      this.slots.name = cleaned;
      this.askLevel();
    },

    // ----- Q4: Autonomy level ------------------------------------
    askLevel() {
      this.step = "level";
      const levelLines = AGENT_LEVELS
        .map((l) => `<li><strong>${l.id}</strong> — ${l.blurb}${l.id === "L2" ? " <em>(recommended)</em>" : ""}</li>`)
        .join("");
      const chips = AGENT_LEVELS
        .map((l) => wizChipHTML(`level:${l.id}`, l.id, { selected: l.id === "L2" }))
        .join("");
      const prompt = `
        <div>How much autonomy should it have?</div>
        <ul class="wizard__levels">${levelLines}</ul>
      `;
      const { bubble, done } = streamJarvis(prompt);
      done.then(() => appendChipRow(bubble, chips, "Pick an autonomy level"));
      lastPersona = "jarvis";
    },

    captureLevel(levelId) {
      this.slots.level = levelId;
      userBubble(levelId);
      this.preview();
    },

    // ----- Preview card ------------------------------------------
    preview() {
      this.step = "preview";
      const { name, level, domain, jtbd } = this.slots;
      const domainLabel = AGENT_DOMAINS.find((d) => d.id === domain)?.label || "Reliability";
      const prompt = `<div>Here's what I'll create — review and confirm.</div>`;
      const escape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const cardHTML = `
        <article class="wizard__preview agent" data-tone="cool" data-domain="${domain}">
          <header class="agent__head">
            <div class="agent__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                   stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17.5A4.5 4.5 0 0 1 4.2 9.3a5.5 5.5 0 0 1 10.7-1.5 4.2 4.2 0 0 1 4 4.2 4 4 0 0 1-4 4.5H7Z"/>
                <path d="M12 10.5v4M10 12.5h4"/>
              </svg>
            </div>
            <div class="agent__title">
              <span class="agent__name">${escape(name)}</span>
              <span class="agent__level">${escape(level)}</span>
            </div>
            <div class="agent__status">
              <span class="agent__badge agent__badge--new">New</span>
            </div>
          </header>
          <p class="agent__body">${escape(jtbd)}</p>
          <footer class="agent__foot">
            <span class="agent__metric">Domain <strong>${domainLabel}</strong></span>
            <span class="agent__metric agent__metric--load">Trust <strong>88%</strong></span>
          </footer>
          <div class="agent__bar" role="presentation" style="--threshold:70%">
            <span style="width:5%"></span>
          </div>
        </article>
        <div class="wizard__actions">
          <button type="button" class="wizard__btn wizard__btn--primary" data-wizard-chip="confirm:create">
            Create agent
          </button>
          <button type="button" class="wizard__btn" data-wizard-chip="confirm:cancel">
            Cancel
          </button>
        </div>
      `;
      const { bubble, done } = streamJarvis(prompt);
      done.then(() => {
        const target = bubble.querySelector(".bubble__text");
        if (!target) return;
        const host = document.createElement("div");
        host.className = "wizard__card";
        host.innerHTML = cardHTML;
        target.appendChild(host);
        scrollDown();
      });
      lastPersona = "jarvis";
    },

    // ----- Commit -------------------------------------------------
    // Two-step deploy: first we run a short series of pre-flight
    // **evals** (intent check, ontology bindings, tool scopes,
    // guardrails, audit trail, trust calibration) so the user can
    // see the agent has been validated end-to-end before it lands
    // in their cockpit. Once every check is green we hand off to
    // `_finalizeCommit()` which actually slots the agent.
    commit() {
      userBubble("Create agent");
      this._runEvalsThenFinalize();
    },

    // List of pre-deploy checks the agent must pass. Order matters
    // — earlier rows read "are we even pointing at the right thing?"
    // (intent / ontology) and later rows are the runtime guardrails
    // (tool scopes / safety / audit / trust). Each entry pairs the
    // in-flight verb ("Validating intent…") with a completion line
    // ("Intent and domain mapping validated").
    _evals: [
      { busy: "Validating intent and domain mapping",
        done: "Intent and domain mapping validated" },
      { busy: "Resolving ontology bindings for selected domain",
        done: "Ontology bindings resolved" },
      { busy: "Verifying tool scopes against autonomy level",
        done: "Tool scopes match autonomy level" },
      { busy: "Running guardrail safety simulations",
        done: "Guardrails passed safety simulation" },
      { busy: "Wiring audit trail for compliance",
        done: "Audit trail wired · compliance ready" },
      { busy: "Calibrating initial trust score",
        done: "Initial trust calibrated at 88%" },
    ],

    _runEvalsThenFinalize() {
      const evals = this._evals;
      const intro = `<div>Running pre-flight evals before deploying <strong>${
        String(this.slots.name).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      }</strong>.</div>`;
      const { bubble, done } = streamJarvis(intro);
      lastPersona = "jarvis";

      done.then(async () => {
        const target = bubble.querySelector(".bubble__text");
        if (!target) { this._finalizeCommit(); return; }

        const host = document.createElement("ul");
        host.className = "wizard__evals";
        host.setAttribute("aria-label", "Agent pre-flight checks");
        target.appendChild(host);

        const spinnerHTML = `
          <span class="status-line__icon is-busy"><span class="spinner"></span></span>
        `;
        const tickHTML = `
          <span class="status-line__icon is-ok">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
                 stroke="currentColor" stroke-width="3"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </span>
        `;

        for (const step of evals) {
          const li = document.createElement("li");
          li.className = "wizard__eval is-busy";
          li.innerHTML = `${spinnerHTML}<span class="wizard__eval-label">${step.busy}…</span>`;
          host.appendChild(li);
          scrollDown();

          await sleep(820);

          li.classList.remove("is-busy");
          li.classList.add("is-ok");
          li.innerHTML = `${tickHTML}<span class="wizard__eval-label">${step.done}</span>`;
          scrollDown();

          await sleep(220);
        }

        await sleep(380);
        this._finalizeCommit();
      });
    },

    _finalizeCommit() {
      const { name, level, domain, jtbd } = this.slots;
      const domainLabel = AGENT_DOMAINS.find((d) => d.id === domain)?.label || "Reliability";
      // Tell the cockpit page to slot the agent into its grid. If
      // the cockpit isn't currently mounted, the event is a no-op
      // and the agent simply won't appear until the next mount —
      // acceptable for a demo since the wizard is reachable from
      // both the dock chiclet AND the cockpit header (where the
      // cockpit IS mounted).
      $sidepanel.dispatchEvent(new CustomEvent("cockpit:add-agent", {
        detail: { name, level, domain, body: jtbd },
        bubbles: true,
      }));
      pushDirectorNote({
        title: "Agent created",
        text:  `${name} (${level} · ${domainLabel})`,
        autoDismiss: 2800,
      });
      streamJarvis(md(
        `All checks green. **${name}** is live in your cockpit. ` +
        "I'll keep you posted as it warms up."
      ));
      lastPersona = "jarvis";
      this.reset();
    },

    // ----- Cancel ------------------------------------------------
    cancel({ silent = false } = {}) {
      if (!silent) {
        streamJarvis(md("No problem — cancelled. Tap **Add Agent** anytime to try again."));
        lastPersona = "jarvis";
      }
      this.reset();
    },

    // ----- Shared reset ------------------------------------------
    reset() {
      this.active = false;
      this.step = null;
      this.pendingText = null;
      // Restore the dock chiclets we hid in start(), but only if the
      // user is still on a page that publishes them — otherwise we'd
      // leak Cockpit pills onto e.g. Home or an incident page.
      if (currentPage) renderDockChiclets(currentPage);
    },
  };

  // Single delegated handler for chip-based wizard steps. Lives on
  // $thread because chips are appended into dynamic Jarvis bubbles
  // that are themselves children of the thread.
  $thread.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-wizard-chip]");
    if (!chip || chip.disabled) return;
    const raw = chip.getAttribute("data-wizard-chip");
    const [kind, value] = raw.split(":");
    if (!agentWizard.active) return;
    // Visually lock the row so the user can't double-pick.
    chip.parentNode?.querySelectorAll("[data-wizard-chip]").forEach((b) => { b.disabled = true; });
    if (kind === "domain") agentWizard.captureDomain(value);
    else if (kind === "name") agentWizard.captureNameChip(value);
    else if (kind === "level") agentWizard.captureLevel(value);
    else if (kind === "confirm") {
      if (value === "create") agentWizard.commit();
      else                    agentWizard.cancel();
    }
  });

  // Public entry point — used by the Cockpit's "+ Add Agent"
  // header CTA. Lives on `window` because the cockpit factory in
  // stories/02-admin-sarah.js is outside this IIFE. Mirrors the
  // dock chiclet entry: echo a user bubble, ensure the chat tile
  // is open, then start the wizard.
  window.__startAddAgent = () => {
    if (agentWizard.active) return;
    setChatClosed(false);
    userBubble("Add Agent");
    agentWizard.start();
  };

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

  // Sub-surfaces that don't have their own sidenav slot but should
  // light up an existing one. Agent detail is reached from the
  // Cockpit so the Cockpit (Tower) item stays the active waypoint
  // while the user drills in.
  const NAV_KEY_ALIAS = {
    "agent-detail": "tower",
  };

  function setActiveNavItem(key) {
    const navKey = NAV_KEY_ALIAS[key] || key;
    [$navTower, $navInsight, $navHorizon, $navLens, $navSettings, $navProfile]
      .forEach((el) => {
        if (!el) return;
        const active = el.dataset.nav === navKey;
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
      lead: "Your control surface. Agents, signals, and sign-offs at a glance.",
      hint: "Live signals across IndiaFirst Bank services.",
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
    // ---- v4 chiclet destinations -----------------------------------
    // These mount via window.PAGES factories defined in
    // stories/02-admin-sarah.js (centralised so navigateTo() finds
    // them through the standard openBrowser flow). They don't have
    // matching sidenav items — they're reached exclusively via the
    // home chiclets and the bottom-strip footer links, which is by
    // design: they're shortcuts, not destinations in their own right.
    approvals: {
      title: "Today's approvals",
      lead: "Items awaiting your decision before the next change window.",
      hint: "Mirrors the Cockpit's sign-off lane with the full queue visible.",
    },
    incidents: {
      title: "Recent incidents",
      lead: "Last 7 days of P1–P3 events across IndiaFirst Bank services.",
      hint: "Tap a row to drill into the agent timeline.",
    },
    healthcheck: {
      title: "Health check",
      lead: "Live status across critical services. Agents stream probes in real time.",
      hint: "Same probe vocabulary the Cockpit uses, scoped to a single run.",
    },
    lens: {
      title: "Lens",
      lead: "Search across every service, asset, and incident in the ontology.",
      hint: "Design coming soon.",
    },
    // Live incident detail surface — mounted by the Phase 2 incident
    // flow. The factory in stories/02-admin-sarah.js wires itself to
    // window.__incPageSync so it re-renders as the phases progress.
    "incident-live": {
      title: "Live incident",
      lead: "P1 · live timeline with agent orchestration.",
      hint: "Auto-refreshes as agents act.",
    },
    // Agent detail surface — mounted when a cockpit agent card is
    // clicked (or when the wizard's just-shipped agent is opened
    // from the cockpit list). The factory in stories/02-admin-sarah.js
    // reads the agent from window.__activeAgentDetail.
    "agent-detail": {
      title: "Agent detail",
      lead: "Live signals, coaching, and current work for this agent.",
      hint: "Open from the Cockpit · click any agent card.",
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

  // -------------------------------------------------------------
  // HOME — v4 entry point for John (IT Manager · IndiaFirst Bank)
  // -------------------------------------------------------------
  // The v4 demo replaces the v3 Setup story with a steady-state
  // "control room" home: full-canvas chat with chiclet shortcuts
  // above the whisper bar and an IT-manager strip beneath
  // (Awaiting approval · Services to watch · Worth knowing today).
  //
  // Clicking a chiclet exits home mode, splits the workspace into
  // chat + right panel, posts a brief Jarvis context message, and
  // mounts the matching page (Cockpit, Approvals, Recent incidents,
  // Health check). Hitting the Settings nav still drops back into
  // the original Setup story if anyone wants to replay it.
  // -------------------------------------------------------------

  // Persona shown in the home greeting + posted Jarvis bubbles.
  const HOME_PERSONA = {
    name: "John",
    role: "IT Manager",
    org: "IndiaFirst Bank",
  };

  // Sparkle glyph used on every chiclet — reads as a Jarvis
  // suggestion / AI shortcut. Matches the existing welcome-CTA
  // sparkle so home feels native, not bolted on.
  const HOME_SPARKLE = `
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
         stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 1.5l1.4 3.4 3.4 1.4-3.4 1.4L8 11.1 6.6 7.7 3.2 6.3l3.4-1.4L8 1.5z"/>
      <path d="M12.6 11.2l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z"/>
    </svg>`;

  // Quick-action shortcuts. `page` is the WORKSPACE_PAGES key that
  // navigateTo() mounts when the chiclet is clicked. `badge` shows
  // a small count pill on the right (used by "Today's approvals").
  //
  // The `add-agent` chiclet routes to the Cockpit (Tower) and then
  // auto-launches the in-chat Add Agent wizard — see the special
  // case in openFromHome(). The `healthcheck` entry stays
  // registered (no chiclet rendered) so the trending-card "Run a
  // full health check" CTA below can still look up its page key
  // through the shared HOME_CHICLETS registry.
  const HOME_CHICLETS = [
    { id: "cockpit",     label: "Open Cockpit",      page: "tower" },
    { id: "approvals",   label: "Today's approvals", page: "approvals",   badge: "4" },
    { id: "incidents",   label: "Recent incidents",  page: "incidents" },
    { id: "add-agent",   label: "Add Agent",         page: "tower" },
    { id: "healthcheck", label: "Run health check",  page: "healthcheck", hidden: true },
  ];

  // Awaiting-approval rows. Same shape as the Cockpit's signoffs so
  // the bottom-strip card renders with the *exact* same .signoff
  // vocabulary — when John drills into the Cockpit he sees the same
  // items, just with more context around them. Kept aligned with
  // the Approvals page data (4 items total) so the "See more →"
  // CTA lands on a queue that matches the strip's preview.
  const HOME_SIGNOFFS = [
    {
      id: "home-sig-1", risk: "high",
      agent: "RemediationAgent", deadline: "in 12 min",
      action: "Roll back payments-gateway to v2.4.1",
    },
    {
      id: "home-sig-2", risk: "medium",
      agent: "ChangeAgent", deadline: "by 18:00 IST",
      action: "Postpone Saturday's onboarding launch — clashes with the core-banking patch",
    },
    {
      id: "home-sig-3", risk: "high",
      agent: "PatchAgent", deadline: "tonight 02:00 IST",
      action: "Emergency patch for core-banking — fix the connection-pool leak",
    },
    {
      id: "home-sig-4", risk: "low",
      agent: "AccessAgent", deadline: "by Fri",
      action: "Grant Wispr Flow access to 3 treasury-ops users",
    },
  ];

  // Services trending in the wrong direction. Each row leads with a
  // *human* headline that says what's actually wrong from a business
  // perspective ("Card payments — declines climbing fast") and then
  // a sub line with the technical metric + service name. This lets
  // John skim the strip and understand the situation without
  // decoding service names or metric/delta jargon.
  const HOME_TRENDING = [
    {
      title: "Card payments — declines climbing fast",
      sub:   "card-auth error rate up 3.4× in 24h. SLA breach likely within ~6h.",
      tone:  "high",
    },
    {
      title: "Loan applications running slower",
      sub:   "loan-origination p95 latency up 28% over 12h. Approaching the SLO ceiling.",
      tone:  "medium",
    },
    {
      title: "ATM withdrawals failing in Mumbai West",
      sub:   "atm-network failure rate at 1.2% (normally 0.4%) across 3 ATMs.",
      tone:  "medium",
    },
  ];

  // Quiet informational bullets — overnight summary, upcoming
  // windows, completed sweeps. Things John wants to know about
  // but doesn't have to act on right now.
  const HOME_DIGEST = [
    {
      tone: "schedule",
      text: "Patch window starts at 2 AM tonight",
      sub:  "4 services queued · no downtime expected",
    },
    {
      tone: "compliance",
      text: "Quarterly KYC sweep done — nothing to flag",
      sub:  "Full report saved in Lens",
    },
    {
      tone: "report",
      text: "Your weekly SLA report is ready",
      sub:  "All targets met · 1 service trending at-risk",
    },
  ];

  // Per-chiclet context line shown in the chat as soon as the home
  // exits. Kept short — the right-panel page carries the data; the
  // chat just narrates *why* it opened.
  const CHICLET_CONTEXT = {
    cockpit:     `Your **Cockpit** is open. Live signals from all 25 agents across Identity, Cost, Reliability and Compliance.`,
    approvals:   `**4 items** are waiting for your decision. Approving releases the agent's plan; deferring buys you 24 hours.`,
    incidents:   `**Recent incidents** — last 7 days. Tap any row to see what happened, who fixed it, and how long it took.`,
    "add-agent": `Let's spin up a new agent. I'll ask you a few questions \u2014 jobs-to-be-done, domain, level \u2014 and queue the eval pre-flight.`,
    healthcheck: `Running a **live health check** across your critical services. Each agent reports back as it finishes.`,
  };

  // Render the inline .signoff article used by the home strip.
  // Same HTML shape as the Cockpit (cockpit factory), kept local
  // here so the home doesn't depend on the cockpit's IIFE scope.
  const renderHomeSignoff = (s) => {
    const esc = (v) => String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    return `
      <article class="signoff" data-risk="${esc(s.risk)}" data-signoff-id="${esc(s.id)}">
        <div class="signoff__row">
          <span class="signoff__risk signoff__risk--${esc(s.risk)}">${esc(s.risk)}</span>
          <span class="signoff__agent">${esc(s.agent)}</span>
          <span class="signoff__deadline">${esc(s.deadline)}</span>
        </div>
        <p class="signoff__action">${esc(s.action)}</p>
        <div class="signoff__actions">
          <button class="signoff__btn signoff__btn--approve" type="button"
                  data-home-action="approve" data-signoff-id="${esc(s.id)}">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
                 stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
                 stroke-linejoin="round" aria-hidden="true">
              <path d="M3 8.5l3.2 3.2L13 5"/>
            </svg>
            Approve
          </button>
          <button class="signoff__btn signoff__btn--defer" type="button"
                  data-home-action="defer" data-signoff-id="${esc(s.id)}">Defer</button>
        </div>
      </article>`;
  };

  // Trending-risk row — same "named thing + severity pill + body"
  // shape the awaiting-approval rows use, but the title is now a
  // human sentence (what's wrong from the user's view) and the
  // sub line carries the technical detail (service name + metric).
  //
  // High-tone rows are the active "this is about to bite you"
  // signals — the Card payments row maps to the live P1 incident,
  // so we render it as a real button. Clicking it tears down home
  // and opens the live incident detail page (same surface the
  // earlier toast used to mount).
  const renderHomeTrend = (t) => {
    const esc = (v) => String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const sevLabel = t.tone === "high" ? "high"
                   : t.tone === "medium" ? "medium" : "low";
    // Every Services-to-watch row is interactive — they all route
    // to the live incident page so a supervisor can drill in. The
    // CTA copy adapts to severity ("Open incident" for the active
    // P1, "Investigate" for the at-risk rows below).
    const cta = t.tone === "high" ? "Open incident" : "Investigate";
    return `
      <li class="home-trends__row home-trends__row--clickable" data-tone="${esc(t.tone)}"
          role="button" tabindex="0" data-home-trend="incident"
          aria-label="${esc(cta)}: ${esc(t.title)}">
        <div class="home-trends__top">
          <span class="home-trends__title">${esc(t.title)}</span>
          <span class="signoff__risk signoff__risk--${esc(sevLabel)}">${esc(sevLabel)}</span>
        </div>
        <p class="home-trends__sub">${esc(t.sub)}</p>
        <span class="home-trends__cta" aria-hidden="true">
          ${esc(cta)}
          <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor">
            <path d="M4.6 1.6 3.5 2.7 6.8 6l-3.3 3.3 1.1 1.1L9 6 4.6 1.6Z"/>
          </svg>
        </span>
      </li>`;
  };

  // Footer CTA for each strip card. Label can include an overflow
  // hint ("+2 more in queue") or just an action verb ("Open health
  // check") — caller decides. The button carries the same
  // `data-chiclet` + `data-page` attributes the chiclets above use,
  // so it flows through the existing openFromHome handler with no
  // separate plumbing.
  const renderHomeMore = (chicletId, label) => {
    const page = HOME_CHICLETS.find((c) => c.id === chicletId)?.page || "";
    const esc = (v) => String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    return `
      <button class="home-card__more" type="button"
              data-chiclet="${esc(chicletId)}" data-page="${esc(page)}">
        <span>${esc(label)}</span>
        <svg class="home-card__more-arrow" viewBox="0 0 12 12"
             width="11" height="11" fill="currentColor" aria-hidden="true">
          <path d="M4.6 1.6 3.5 2.7 6.8 6l-3.3 3.3 1.1 1.1L9 6 4.6 1.6Z"/>
        </svg>
      </button>`;
  };

  // Digest row — small tone-coloured dot + tight two-line text.
  // Sub-line stays small and muted so the eye skims the top line.
  const renderHomeDigest = (d) => {
    const esc = (v) => String(v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    return `
      <li class="home-digest" data-tone="${esc(d.tone)}">
        <span class="home-digest__dot" aria-hidden="true"></span>
        <div class="home-digest__body">
          <div class="home-digest__text">${esc(d.text)}</div>
          ${d.sub ? `<div class="home-digest__sub">${esc(d.sub)}</div>` : ""}
        </div>
      </li>`;
  };

  // Build the home hero (greet + chiclets + composer + bottom strip)
  // and mount it into stage main. Returns the root element so callers
  // can run a leave animation before removing it.
  function renderHome() {
    const greeting = "Welcome,";
    const titleLead = "Start with";
    const titleTail = "Agentic IT Service";
    const placeholder = "Ask anything";

    // Remove any leftover chapter-welcome from a prior session.
    $stageMain.querySelectorAll(".chapter-welcome, .home").forEach((n) => n.remove());
    $workspace.classList.add("workspace--welcome");

    const home = document.createElement("div");
    home.className = "home";
    home.id = "home";

    home.innerHTML = `
      <div class="home__inner">
        <!-- Greet + brand-gradient title -->
        <div class="home__greet">
          ${md(greeting)} <span class="home__name">${md(HOME_PERSONA.name)}!</span>
        </div>
        <h1 class="home__title">
          <span class="home__title-lead">${md(titleLead)}</span>
          <span class="home__title-tail">${md(titleTail)}</span>
        </h1>

        <!-- Quick-action chiclets — each opens the right panel.
             Entries marked hidden:true stay registered in
             HOME_CHICLETS (so renderHomeMore can still resolve
             their page key) but don't render in the chiclet row. -->
        <div class="home__chiclets" role="group" aria-label="Quick actions">
          ${HOME_CHICLETS.filter((c) => !c.hidden).map((c) => `
            <button class="home__chiclet" type="button"
                    data-chiclet="${c.id}" data-page="${c.page}">
              <span class="home__chiclet-icon" aria-hidden="true">${HOME_SPARKLE}</span>
              <span class="home__chiclet-label">${md(c.label)}</span>
              ${c.badge ? `<span class="home__chiclet-badge">${md(c.badge)}</span>` : ""}
            </button>
          `).join("")}
        </div>

        <!-- Whisper composer (single source of input on the home) -->
        <div class="home__composer">
          <div class="whisper" role="group" aria-label="${md(placeholder)}">
            <div class="whisper__row whisper__row--input">
              <input class="whisper__input"
                     id="homeWhisperInput"
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
                <button class="whisper__send" id="homeWhisperSend" type="button"
                        title="Send" aria-label="Send">
                  <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                          d="M1.5655 12.9808L2.75011 8.59229H7.7578C7.89242 8.59229 8.02704 8.45767 8.02704 8.32306V7.7846C8.02704 7.64998 7.89242 7.51537 7.7578 7.51537H2.75011L1.59242 3.20767C1.5655 3.15383 1.53857 3.07306 1.53857 2.99229C1.53857 2.80383 1.72704 2.61537 1.94242 2.64229C1.99627 2.64229 2.02319 2.66921 2.07704 2.66921L14.1924 7.64998C14.354 7.70383 14.4617 7.86537 14.4617 8.0269C14.4617 8.18844 14.354 8.32306 14.2193 8.3769L2.07704 13.4923C2.02319 13.5192 1.96934 13.5192 1.9155 13.5192C1.70011 13.4923 1.53857 13.3308 1.53857 13.1154C1.53857 13.0615 1.53857 13.0346 1.5655 12.9808Z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- IT-manager strip — each card previews up to 2 items, then
             a "See more →" CTA that opens the dedicated page. The
             preview limit keeps the home glanceable; the CTA owns
             the overflow so John never feels the strip is hiding
             work from him. The CTA reuses the same data-chiclet
             handler the chiclets above use, so navigation is one
             code path. -->
        <div class="home__strip" role="region" aria-label="Today at a glance">
          <!-- Awaiting approval — preview of the full queue -->
          <section class="home-card home-card--approvals">
            <header class="home-card__head">
              <span class="home-card__eyebrow">Awaiting your approval</span>
            </header>
            <div class="home-card__body">
              ${HOME_SIGNOFFS.slice(0, 2).map(renderHomeSignoff).join("")}
            </div>
            ${HOME_SIGNOFFS.length > 2
              ? renderHomeMore("approvals", `See all ${HOME_SIGNOFFS.length} approvals`)
              : ""}
          </section>

          <!-- Services to watch — preview of the at-risk service list -->
          <section class="home-card home-card--trending">
            <header class="home-card__head">
              <span class="home-card__eyebrow">Services to watch</span>
            </header>
            <ul class="home-card__body home-trends">
              ${HOME_TRENDING.slice(0, 2).map(renderHomeTrend).join("")}
            </ul>
            ${renderHomeMore("healthcheck", "Run a full health check")}
          </section>

          <!-- Worth knowing today — preview of overnight + scheduled items -->
          <section class="home-card home-card--digest">
            <header class="home-card__head">
              <span class="home-card__eyebrow">Worth knowing today</span>
              <time class="home-card__time">8m ago</time>
            </header>
            <ul class="home-card__body home-card__list">
              ${HOME_DIGEST.slice(0, 2).map(renderHomeDigest).join("")}
            </ul>
            ${renderHomeMore("incidents", "Open the activity log")}
          </section>
        </div>
      </div>
    `;

    $stageMain.appendChild(home);
    requestAnimationFrame(() => home.classList.add("home--in"));

    // Chiclet & footer-link delegation — every element carrying
    // `data-chiclet` opens the corresponding right-panel page;
    // `data-home-trend="incident"` shortcut opens the live P1
    // incident page directly (replaces the auto-firing toast we
    // used to schedule in startHome).
    home.addEventListener("click", (e) => {
      const trend = e.target.closest("[data-home-trend='incident']");
      if (trend) {
        e.preventDefault();
        if (typeof window.__openIncidentFromHome === "function") {
          window.__openIncidentFromHome();
        }
        return;
      }
      const trigger = e.target.closest("[data-chiclet]");
      if (trigger) {
        e.preventDefault();
        openFromHome(trigger.getAttribute("data-chiclet"));
        return;
      }
      const approval = e.target.closest("[data-home-action]");
      if (approval) {
        const action = approval.getAttribute("data-home-action");
        const label = approval.closest(".signoff")?.querySelector(".signoff__action")?.textContent?.trim() || "sign-off";
        pushDirectorNote({
          title: action === "approve" ? "Approved" : "Deferred",
          text: label,
          autoDismiss: 2400,
        });
        approval.closest(".signoff")?.setAttribute("data-state", action);
      }
    });

    // Keyboard parity for the role="button" trending row — space /
    // enter should fire the same incident open as a mouse click.
    home.addEventListener("keydown", (e) => {
      const trend = e.target.closest("[data-home-trend='incident']");
      if (!trend) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (typeof window.__openIncidentFromHome === "function") {
          window.__openIncidentFromHome();
        }
      }
    });

    // Send chat from the home composer — promotes the user into
    // chat mode (mirrors the chapter-welcome behaviour).
    const submit = () => {
      const $input = home.querySelector("#homeWhisperInput");
      const text = ($input?.value || "").trim();
      if (!text) return;
      $input.value = "";
      home.classList.add("home--leaving");
      setTimeout(() => {
        if (home.parentNode) home.remove();
        $workspace.classList.remove("workspace--welcome");
        mode = "chat";
        $thread.innerHTML = "";
        lastPersona = null;
        userBubble(text);
        renderFallback();
      }, 280);
    };
    home.querySelector("#homeWhisperSend").addEventListener("click", submit);
    home.querySelector("#homeWhisperInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    return home;
  }

  // Chiclet → right-panel page. Tears down the home view, splits
  // the workspace, posts a Jarvis context bubble in the chat
  // thread, and mounts the requested page.
  function openFromHome(chicletId) {
    const chiclet = HOME_CHICLETS.find((c) => c.id === chicletId);
    if (!chiclet) return;

    const home = document.getElementById("home");
    if (home) {
      home.classList.add("home--leaving");
      setTimeout(() => home.parentNode && home.remove(), 320);
    }

    $workspace.classList.remove("workspace--welcome");
    mode = "page";
    $thread.innerHTML = "";
    lastPersona = null;

    // The chat panel must be visible when a chiclet opens a right
    // panel — the user expects the split (chat on the left, page on
    // the right). If a previous session collapsed the Jarvis tile
    // the workspace would otherwise mount the page full-canvas with
    // no chat surface for the context bubble to land in.
    setChatClosed(false);

    // Context bubble — narrates *why* the right panel opened.
    const contextText = CHICLET_CONTEXT[chicletId] || "Opening…";
    streamJarvis(md(contextText));
    lastPersona = "jarvis";

    // Mount the destination page in the right panel.
    navigateTo(chiclet.page);

    // Special case — the Add Agent chiclet drops the user on the
    // Cockpit AND immediately kicks off the in-chat wizard. We
    // wait a beat for the context bubble + page mount to settle
    // so the wizard's first question lands cleanly underneath.
    if (chicletId === "add-agent") {
      setTimeout(() => {
        if (agentWizard.active) return;       // double-tap guard
        userBubble("Add Agent");
        agentWizard.start();
      }, 700);
    }
  }

  function startHome() {
    runToken += 1;
    mode = "home";
    activeChapter = null;
    CURRENT_PERSONA = null;

    // v4 skips the install gating: the persona is a steady-state
    // IT manager who has long since finished onboarding, so all
    // workspace pages are reachable from boot.
    setupComplete = true;
    applySidenavGating();

    // Tear down any running incident: clears the bar, cancels the
    // pending timer, wipes the timeline. Called both on initial
    // boot (no-op the first time) and when "New chat" resets the
    // session — the latter shouldn't leave incident chrome behind.
    if (typeof resetIncidentState === "function") resetIncidentState();
    // Clear any prior toasts so a fresh session starts clean.
    clearDirectorStack();

    $thread.innerHTML = "";
    lastPersona = null;
    closeBrowser();
    clearDockChiclets();
    // Tear down any in-flight Add Agent wizard — its bubbles were
    // just wiped from the thread, no point keeping the state alive.
    if (agentWizard.active) agentWizard.reset();
    setChatClosed(false, { instant: true });
    // Re-open the chat-history drawer state if it was open.
    $stage?.removeAttribute("data-history");
    $stageHistory?.setAttribute("aria-pressed", "false");

    // No sidenav item is selected on home — the Jarvis tile in the
    // rail is the implicit "you are here" (chat is visible).
    setActiveNavItem(null);

    renderHome();

    // Phase 2 (v4 change): the P1 incident no longer pops up
    // automatically as a toast — instead, the user opens it by
    // clicking the "Card payments — declines climbing fast" row
    // in the Services to watch card. Manual re-trigger is still
    // available via window.__playIncident for testing.
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
  // INCIDENT FLOW (Phase 2)
  // -------------------------------------------------------------
  // Story:
  //   ~8s after John lands on home, a P1 toast slides in: card-auth
  //   error rate has just tripped the SLA hard threshold. Clicking
  //   the toast opens the live Incident page in the right panel,
  //   posts a narrating Jarvis bubble in the chat thread, and surfaces
  //   an incident-mode chiclet bar above the dock.
  //
  //   The incident then advances through 7 phases on a timer. One
  //   beat (phase `ready`) is a human-in-the-loop gate — John must
  //   click "Approve mitigation" for the rollback to execute. The
  //   rest auto-advances so the demo flows without babysitting.
  //
  //   On resolution, a summary doc card appears on the incident
  //   page with View / Download (.md file) / Share-to-Slack actions.
  //
  // Surfaces:
  //   - Right panel: Incident detail page (timeline + agent graph
  //     + status banner + summary slot). Page factory lives in
  //     stories/02-admin-sarah.js as window.PAGES["incident-live"].
  //   - Chat thread:  Jarvis bubbles narrate the major beats.
  //   - Chiclet bar:  Adaptive actions above the dock, phase-aware.
  //   - Toast:        Critical alert variant of pushDirectorNote.
  //
  // Re-trigger for re-demos: call window.__playIncident() from the
  // console. The flow is idempotent and self-cleans on resolution.
  // -------------------------------------------------------------

  // Static incident definition — single P1 per session. Service is
  // card-auth so the trending-risk warning in the home strip pays off
  // ("we warned you, now it's tripped").
  const INCIDENT = {
    id: "INC-2026-0514-001",
    service: "Card Authorization",
    sev: "P1",
    title: "Card payments — declines crossing SLA threshold",
    sub: "Error rate has just spiked to 8.7% (SLA limit 5%). Agents are taking it.",
    affected: "~340 merchants · ~12,000 active cardholders",
    region: "India (all regions)",
    startedAt: null,           // set when scheduleIncident() fires
    rootCause:
      "Build v3.7.1 (deployed 09:02 IST) introduced a 3DS timeout regression. " +
      "Visa flows fail when the issuer responds in 2–3s — well within spec, " +
      "but the new code aborts at 1.8s.",
    mitigation: "Rollback to v3.7.0 (last known-good build, 2 days in production).",
    deploymentLink: "card-auth · build v3.7.1 (Pritesh Sharma · 09:02 IST)",
  };

  // Agent roster — colour + role on this incident. The page renders
  // a compact "Agents on this incident" chip cloud using this map.
  const INC_AGENTS = {
    MonitoringAgent:    { tone: "#ef4444", role: "Detection"      },
    DiagnosticsAgent:   { tone: "#f59e0b", role: "Triage"         },
    ObservabilityAgent: { tone: "#3b82f6", role: "Investigation"  },
    RemediationAgent:   { tone: "#22c55e", role: "Mitigation"     },
    ChangeAgent:        { tone: "#8b5cf6", role: "Change record"  },
    ComplianceAgent:    { tone: "#06b6d4", role: "Post-incident"  },
  };

  // Linear phase pipeline. Each phase has:
  //   - label:       Shown on the status banner and progress dots.
  //   - caption:     One-liner shown under the banner ("what's happening").
  //   - auto:        Auto-advance after N ms. `null` = manual gate.
  //   - entries:     Timeline rows that get appended when this phase starts.
  //                  Each row: { at: "+12s", agent: "…", text: "…" }
  //   - narration:   Optional Jarvis bubble posted in the chat thread.
  //   - chicletSet:  Key into INC_CHICLETS — which actions show in the bar.
  const INC_PHASES = [
    {
      id: "detected",
      label: "Detected",
      caption: "MonitoringAgent caught the spike and raised the incident.",
      auto: 4500,
      entries: [
        { at: "+0s", agent: "MonitoringAgent",
          text: "Threshold crossed — card-auth error rate at 8.7% (SLA limit 5%)." },
        { at: "+2s", agent: "MonitoringAgent",
          text: "Raised incident INC-2026-0514-001 · paged the on-call rota." },
      ],
      narration:
        "**P1 on card-auth.** Error rate just crossed the SLA hard threshold (8.7%). " +
        "I've routed the incident to DiagnosticsAgent and ObservabilityAgent — " +
        "they're starting triage now. I'll keep you posted here.",
      chicletSet: "investigating",
      // Live activity: what the user should see is HAPPENING right now,
      // shown as a pulsing trailing row in the timeline + a header pill.
      activity: { agent: "MonitoringAgent", verb: "Detecting",
        text: "Tracking the spike across regions", state: "working" },
    },
    {
      id: "triaged",
      label: "Triaged",
      caption: "DiagnosticsAgent has handed off to ObservabilityAgent for trace correlation.",
      auto: 6000,
      entries: [
        { at: "+5s", agent: "DiagnosticsAgent",
          text: "Classified as P1 — customer-facing, SLA breach in <6h if untreated." },
        { at: "+8s", agent: "DiagnosticsAgent",
          text: "Handing off to ObservabilityAgent for trace correlation." },
      ],
      narration:
        "DiagnosticsAgent confirms **P1 customer impact**. Routing trace correlation to ObservabilityAgent.",
      chicletSet: "investigating",
      activity: { agent: "DiagnosticsAgent", verb: "Triaging",
        text: "Classifying severity and customer impact", state: "working" },
    },
    {
      id: "investigating",
      label: "Investigating",
      caption: "ObservabilityAgent is correlating failed-auth traces with the recent deploy.",
      auto: 7500,
      entries: [
        { at: "+12s", agent: "ObservabilityAgent",
          text: "Correlated 2,340 failed-auth traces — 98% from card-auth pods on build v3.7.1." },
        { at: "+14s", agent: "ObservabilityAgent",
          text: "Pulled deploy timeline: v3.7.1 went live 09:02 IST (4h 12m ago)." },
        { at: "+16s", agent: "DiagnosticsAgent",
          text: "No infra change inside the window — pointing at a code regression." },
      ],
      narration:
        "ObservabilityAgent has narrowed the blast radius — **98% of failures are on build v3.7.1** which " +
        "went live 4h ago. No infra change in the window, so we're looking at a regression.",
      chicletSet: "investigating",
      activity: { agent: "ObservabilityAgent", verb: "Correlating",
        text: "Joining failed-auth traces with the recent deploy", state: "working" },
    },
    {
      id: "rootcause",
      label: "Root cause",
      caption: "DiagnosticsAgent identified the regression. RemediationAgent has a rollback plan ready.",
      auto: 5500,
      entries: [
        { at: "+20s", agent: "DiagnosticsAgent",
          text: "Root cause: v3.7.1 lowered the 3DS issuer timeout from 3s → 1.8s. Visa flows where the issuer takes 2–3s now fail." },
        { at: "+23s", agent: "RemediationAgent",
          text: "Plan ready: roll back card-auth to v3.7.0 (last known-good, 2 days in prod, zero regressions)." },
        { at: "+25s", agent: "RemediationAgent",
          text: "Awaiting human approval — rollback affects 340 merchants · 12,000 cardholders." },
      ],
      narration:
        "**Root cause confirmed.** v3.7.1 tightened the 3DS issuer timeout to 1.8s — Visa flows where the issuer takes 2–3s now fail. " +
        "RemediationAgent has a rollback plan ready (revert to v3.7.0). " +
        "I'll post the **approval below** the moment the plan is fully drafted — your call from there.",
      chicletSet: "ready",
      activity: { agent: "DiagnosticsAgent", verb: "Pinpointing",
        text: "Bisecting the regression in v3.7.1", state: "working" },
      // Once all entries have posted but the phase is gated on a human
      // decision, the live row swaps to this calmer "waiting" state.
      gateActivity: { agent: "RemediationAgent", verb: "Awaiting approval",
        text: "Roll back card-auth to v3.7.0 — needs your call", state: "waiting" },
    },
    {
      id: "mitigating",
      label: "Mitigating",
      caption: "Rollback in progress. ObservabilityAgent is watching the error rate live.",
      auto: 7000,
      entries: [
        { at: "+27s", agent: "RemediationAgent",
          text: "Rollback approved by John — starting deploy of v3.7.0." },
        { at: "+29s", agent: "ChangeAgent",
          text: "Created change record CHG-44102 · linked to incident · audit trail captured." },
        { at: "+32s", agent: "RemediationAgent",
          text: "Rollout 50% … 100%. v3.7.0 is live across all card-auth pods." },
      ],
      narration:
        "Approved — RemediationAgent is rolling back to v3.7.0. ChangeAgent has logged **CHG-44102** for the audit trail.",
      chicletSet: "mitigating",
      activity: { agent: "RemediationAgent", verb: "Rolling back",
        text: "Deploying v3.7.0 across card-auth pods", state: "working" },
    },
    {
      id: "resolved",
      label: "Resolved",
      caption: "Metrics back to baseline. ComplianceAgent has generated the post-incident summary.",
      auto: null,
      entries: [
        { at: "+36s", agent: "ObservabilityAgent",
          text: "Error rate dropping: 8.7% → 0.4% (back to baseline)." },
        { at: "+40s", agent: "ObservabilityAgent",
          text: "Verified stable for 60s — closing the incident." },
        { at: "+42s", agent: "ComplianceAgent",
          text: "Generated post-incident summary · saved to Lens · ready to share." },
      ],
      narration:
        "Rollback is live and the error rate is dropping. **ObservabilityAgent** is " +
        "verifying it holds at baseline — I'll surface the wrap-up once the post-incident " +
        "summary is ready.",
      // 'verifying' (not 'resolved') is shown while the resolved-phase
      // entries stagger; finishPhaseEntries swaps to 'resolved' once
      // ComplianceAgent has actually generated the summary.
      chicletSet: "verifying",
      activity: { agent: "ObservabilityAgent", verb: "Verifying",
        text: "Watching error rate hold at baseline", state: "working" },
    },
  ];

  // Chiclet sets shown in the in-stage incident bar. Each set is an
  // array of { id, label, tone?, primary? } objects. The bar
  // re-renders each time advancePhase() updates incState.chicletSet.
  const INC_CHICLETS = {
    investigating: [
      { id: "acknowledge", label: "Acknowledge" },
      { id: "page-oncall", label: "Page on-call" },
      { id: "runbook",     label: "Open runbook" },
      { id: "warroom",     label: "Open war room" },
    ],
    ready: [
      { id: "approve-mitigation", label: "Approve mitigation", primary: true },
      { id: "defer-30",           label: "Defer 30 min" },
      { id: "more-info",          label: "Request more info" },
    ],
    mitigating: [
      { id: "watching", label: "Rollback in progress…", disabled: true, spinning: true },
    ],
    // Shown DURING the resolved-phase staggered entries (rollback is
    // done, agents are confirming the system stays at baseline).
    // The wrap-up actions don't appear until verification finishes,
    // so the user never sees "View summary" before there is one.
    verifying: [
      { id: "watching-resolved", label: "Verifying baseline…", disabled: true, spinning: true },
    ],
    resolved: [
      { id: "view-summary",     label: "View summary",     primary: true },
      { id: "download-summary", label: "Download (.md)" },
      { id: "share-slack",      label: "Share to Slack" },
      { id: "close-incident",   label: "Close incident" },
    ],
  };

  // Mutable session state — single live incident at a time.
  const incState = {
    phaseIdx: -1,           // -1 = not started, otherwise INC_PHASES index
    timer:    null,         // pending setTimeout for auto-advance
    entryTimer: null,       // pending setTimeout for the next staggered entry
    pendingEntries: [],     // entries of the current phase still to post (for flush on early advance)
    elapsedTimer: null,     // setInterval for the elapsed counter
    timeline: [],           // entries appended so far (for summary)
    activeAgents: new Set(),// agents that have spoken at least once
    activity: null,         // { agent, verb, text, state } — what's happening NOW
    barEl:    null,         // chiclet bar DOM ref
    pageOpen: false,        // is the incident page mounted in the right panel?
    // True once the resolved-phase entries have finished posting:
    // drives the frozen "Resolved · …" elapsed pill, the green
    // pill styling, the wrap-up chiclets, and the in-page summary
    // card. Intentionally NOT set the moment the resolved phase
    // begins — the page should never read "resolved" while the
    // timeline is still narrating the resolution.
    resolved: false,
    approvalCardEl: null,   // chat-thread approval bubble DOM ref (rootcause gate)
    summaryCardEl:  null,   // chat-thread post-incident summary bubble DOM ref
  };

  // ---- Toast: critical incident alert -----------------------
  // Uses the existing director-note infra, then dresses it up
  // for a P1: red "INCIDENT" text label, an alert-triangle icon
  // with a radiating-ring pulse, and a copy pass that reads like
  // a colleague flagging the issue (no jargon, no service-name as
  // a heading, plain English with the metric in context).
  function showIncidentToast() {
    const card = pushDirectorNote({
      title: "Card payments are failing right now",
      text:  "card-auth error rate just spiked to **8.7%** — past the **5% SLA limit**. Agents have already started triaging.",
      actions: [
        { label: "Open incident", primary: true,
          onClick: () => openIncident({ fromToast: true }) },
        { label: "Snooze 10 min", onClick: () => {} },
      ],
    });
    if (!card) return null;

    card.classList.add("director-note--critical");

    // Swap the badge label ("System" → "INCIDENT").
    const badge = card.querySelector(".director-note__badge");
    if (badge) badge.textContent = "INCIDENT";

    // Swap the default gear glyph for an alert-triangle. The
    // critical CSS variant gives the surrounding chip a red
    // background + radiating ring animation.
    const icon = card.querySelector(".director-note__icon");
    if (icon) {
      icon.innerHTML = `
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M8 1.8 14.7 13.3a.6.6 0 0 1-.52.9H1.82a.6.6 0 0 1-.52-.9L8 1.8Z"/>
          <path d="M8 6.4v3.6"/>
          <path d="M8 12.3v.3"/>
        </svg>
      `;
    }

    return card;
  }

  // ---- Open / mount the incident page + chat narration + bar -----
  function openIncident({ fromToast = false } = {}) {
    // Make sure the chat is visible — John might have closed it.
    if ($workspace.classList.contains("workspace--chat-closed")) {
      setChatClosed(false);
    }

    // Tear down the home view if it's still on screen.
    const home = document.getElementById("home");
    if (home) {
      home.classList.add("home--leaving");
      setTimeout(() => home.parentNode && home.remove(), 320);
      $workspace.classList.remove("workspace--welcome");
      $thread.innerHTML = "";
      lastPersona = null;
    }

    mode = "page";

    // Mount the incident page in the right panel.
    navigateTo("incident-live");
    incState.pageOpen = true;

    // Reveal the chiclet bar in the stage (above the dock).
    ensureIncidentBar();

    // Start the elapsed counter if not already running.
    if (!incState.elapsedTimer) {
      INCIDENT.startedAt = INCIDENT.startedAt || Date.now();
      incState.elapsedTimer = setInterval(updateIncidentElapsed, 1000);
      updateIncidentElapsed();
    }

    // First phase narration (only if we haven't started yet).
    if (incState.phaseIdx === -1) {
      advanceToPhase(0, { silent: false });
    } else {
      // Re-opening — refresh the page from current state.
      refreshIncidentPage();
    }
  }

  // ---- Engine: advance to a specific phase -------------------
  // Each phase posts its timeline entries STAGGERED across the
  // phase.auto window (rather than dumping them in a single tick).
  // While entries are posting we keep `incState.activity` populated so
  // the page can render a live "X is doing Y…" row at the bottom of
  // the timeline. Between phases we briefly swap activity to a
  // "Handing off to <NextAgent>" beat; on the gating root-cause phase
  // we swap to gateActivity ("Awaiting approval"). Both signals are
  // what give the user evidence that something is actually happening.
  function advanceToPhase(idx, { silent = false } = {}) {
    if (idx < 0 || idx >= INC_PHASES.length) return;

    // Cancel any in-flight stagger / advance timers from the prior
    // phase before we paint the new one. If we're cutting a phase
    // short (e.g. the user approves mitigation while root-cause
    // entries are still trickling), flush whatever remains so the
    // summary stays complete and the timeline doesn't develop holes.
    if (incState.timer)      { clearTimeout(incState.timer);      incState.timer = null; }
    if (incState.entryTimer) { clearTimeout(incState.entryTimer); incState.entryTimer = null; }
    if (incState.pendingEntries.length) {
      incState.pendingEntries.forEach((e) => {
        incState.timeline.push(e);
        incState.activeAgents.add(e.agent);
      });
      incState.pendingEntries = [];
    }

    const phase = INC_PHASES[idx];
    incState.phaseIdx = idx;

    // Show the phase's live activity IMMEDIATELY so the user sees
    // "<agent> · <verb>…" before the first row pops in.
    incState.activity = phase.activity ? { ...phase.activity } : null;

    // Update the live page if it's open.
    refreshIncidentPage();

    // Post a Jarvis narration bubble (if we have one).
    if (!silent && phase.narration) {
      streamJarvis(md(phase.narration));
      lastPersona = "jarvis";
    }

    // Re-render the chiclet bar for this phase. For the resolved
    // phase this swaps to 'verifying' (a calm spinner), NOT to the
    // wrap-up actions; the actions are revealed by finishPhaseEntries
    // once ComplianceAgent has actually generated the summary, so the
    // user never sees "View summary" before there is a summary.
    renderIncidentChiclets(phase.chicletSet);

    // Stagger the phase's entries across the auto window so rows
    // visibly tick in. The trailing slot doubles as a handoff beat
    // before the next phase. For gating / final phases that have no
    // auto-advance we fall back to a fixed cadence. We hold the queue
    // on incState.pendingEntries so an early advance can flush it.
    incState.pendingEntries = phase.entries.slice();
    const entryCount = incState.pendingEntries.length;
    const totalMs = phase.auto || 1400 * Math.max(1, entryCount);
    const stagger = Math.max(700, Math.floor(totalMs / (entryCount + 1)));

    function postNextEntry() {
      incState.entryTimer = null;
      if (!incState.pendingEntries.length) {
        finishPhaseEntries();
        return;
      }
      const e = incState.pendingEntries.shift();
      incState.timeline.push(e);
      incState.activeAgents.add(e.agent);
      refreshIncidentPage();
      incState.entryTimer = setTimeout(postNextEntry, stagger);
    }

    function finishPhaseEntries() {
      // Resolved or final phase — wind the live row down. For the
      // resolved phase specifically, NOW is the single moment where
      // every "incident has wrapped up" signal flips together: the
      // resolved flag, the frozen elapsed pill, the green pill
      // styling (via data-phase), the wrap-up chiclets, the green
      // summary card, and the toast. Doing this in one place keeps
      // the surfaces from disagreeing with each other (which was
      // the bug: chiclets jumped to "View summary" while the timeline
      // was still narrating the resolution and the elapsed pill
      // still read "Live · …").
      if (phase.id === "resolved" || idx === INC_PHASES.length - 1) {
        incState.activity = null;
        if (phase.id === "resolved" && !incState.resolved) {
          incState.resolved = true;
          if (incState.elapsedTimer) {
            clearInterval(incState.elapsedTimer);
            incState.elapsedTimer = null;
          }
          updateIncidentElapsed();
          renderIncidentChiclets("resolved");
          // The post-incident summary should land in TWO places at the
          // same beat: the right-panel page (greens up via applySummary)
          // AND the chat thread, so a user who's been driving from the
          // chat panel sees the wrap-up land naturally as a Jarvis
          // message instead of having to glance over to the side card.
          postSummaryCard();
          pushDirectorNote({
            title: "Incident resolved",
            text: `${INCIDENT.service} · ${INCIDENT.id}`,
            sub: "Summary doc is ready to view, download, or share.",
            actions: [
              { label: "View summary", primary: true,
                onClick: () => { openIncident({}); openSummaryDrawer(); } },
            ],
            autoDismiss: 6000,
          });
        }
        refreshIncidentPage();
        return;
      }
      // Manual gate (rootcause): swap to the calmer "awaiting" state
      // and surface a prominent approval card in the chat thread.
      // The chiclet bar is a quick-action surface; the chat card is
      // the primary "decision needed from you" affordance — without
      // it the awaiting-approval state is too easy to miss.
      if (phase.gateActivity) {
        incState.activity = { ...phase.gateActivity };
        refreshIncidentPage();
        postApprovalCard(phase);
        return;
      }
      // Auto-advancing phase: show a brief handoff beat to the next
      // agent before the next phase kicks in.
      const next = INC_PHASES[idx + 1];
      const nextAgent = (next && next.activity && next.activity.agent)
        || (next && next.entries && next.entries[0] && next.entries[0].agent)
        || null;
      if (nextAgent) {
        incState.activity = {
          agent: nextAgent,
          verb:  "Handing off",
          text:  `Handing off to ${nextAgent}`,
          state: "handoff",
        };
        refreshIncidentPage();
      }
      incState.timer = setTimeout(() => {
        incState.timer = null;
        advanceToPhase(idx + 1);
      }, stagger);
    }

    // Kick off the first entry after a brief delay so the activity
    // row gets a moment to be seen before any rows post under it.
    incState.entryTimer = setTimeout(postNextEntry, Math.min(stagger, 700));
  }

  // Manually advance from the gate (called when John approves).
  // The chat-bubble pair (user's choice + Jarvis's reply) is posted
  // by the calling action handler via acknowledgeApproval(); this
  // function only does the engine-side work of moving forward.
  function approveMitigation() {
    const current = INC_PHASES[incState.phaseIdx];
    if (!current || current.id !== "rootcause") return;
    advanceToPhase(incState.phaseIdx + 1);
  }

  // ---- Chat approval card -------------------------------------
  // When the rootcause phase finishes posting and we're sitting on
  // a human-decision gate, we surface the approval as a prominent
  // chat bubble. The chat is the primary "talk to Jarvis" surface
  // — putting the approval here makes the awaiting state impossible
  // to miss. The chiclet bar still shows the same actions for users
  // who happen to be looking at the bar.
  function postApprovalCard(phase) {
    // Bring the chat back into view if the user collapsed it —
    // a rollback decision is too important to be silent under a
    // closed panel.
    if ($workspace && $workspace.classList.contains("workspace--chat-closed")) {
      setChatClosed(false);
    }
    if (incState.approvalCardEl && incState.approvalCardEl.isConnected) {
      // Already posted (e.g. user re-opened the page) — don't double up.
      return;
    }
    const bubble = jarvisBubble("");
    bubble.classList.add("bubble--approval");
    const text = bubble.querySelector(".bubble__text");
    if (!text) return;
    text.innerHTML = `
      <div class="approval-card" data-approval="open">
        <div class="approval-card__head">
          <span class="approval-card__icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 1.8 14.7 13.3a.6.6 0 0 1-.52.9H1.82a.6.6 0 0 1-.52-.9L8 1.8Z"/>
              <path d="M8 6.4v3.6"/>
              <path d="M8 12.3v.3"/>
            </svg>
          </span>
          <div class="approval-card__head-text">
            <div class="approval-card__eyebrow">Approval needed · RemediationAgent</div>
            <div class="approval-card__title">Roll back card-auth to v3.7.0?</div>
          </div>
        </div>
        <div class="approval-card__body">
          <p class="approval-card__lead">
            Last known-good build (2 days in prod, zero regressions). Will affect
            <strong>340 merchants</strong> and <strong>~12,000 cardholders</strong>
            mid-rollout — error rate should return to baseline within ~60s.
          </p>
          <ul class="approval-card__meta">
            <li><span>Plan</span><strong>Revert v3.7.1 → v3.7.0 across all card-auth pods</strong></li>
            <li><span>Audit</span><strong>Change record CHG-44102 will be linked</strong></li>
            <li><span>Reversibility</span><strong>Rollback is reversible for 30 days</strong></li>
          </ul>
        </div>
        <div class="approval-card__actions">
          <button type="button" class="approval-card__btn approval-card__btn--primary"
                  data-inc-action="approve-mitigation">
            Approve mitigation
          </button>
          <button type="button" class="approval-card__btn"
                  data-inc-action="defer-30">
            Defer 30 min
          </button>
          <button type="button" class="approval-card__btn"
                  data-inc-action="more-info">
            Request more info
          </button>
        </div>
      </div>
    `;
    // Buttons in the card just dispatch the action — the action
    // handler (handleIncidentAction → acknowledgeApproval) does the
    // disable / user-bubble / Jarvis-reply work, so click flows from
    // the chat card and the chiclet bar are identical.
    bubble.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-inc-action]");
      if (!btn) return;
      handleIncidentAction(btn.getAttribute("data-inc-action"));
    });
    incState.approvalCardEl = bubble;
  }

  // ---- Chat post-incident summary card ------------------------
  // Mirror of the right-panel #incSummaryCard that lands in the
  // chat thread the moment ComplianceAgent finishes its RCA. Same
  // beat, same content, same actions — wired through the same
  // handleIncidentAction switch so View / Download / Share-Slack
  // behave identically whether triggered from the page or the chat.
  // Lives as a Jarvis bubble (bubble--summary) with rich card
  // markup, followed by a quiet handoff sentence so the chat
  // closes the loop conversationally instead of just dropping a
  // card and going silent.
  function postSummaryCard() {
    if ($workspace && $workspace.classList.contains("workspace--chat-closed")) {
      setChatClosed(false);
    }
    if (incState.summaryCardEl && incState.summaryCardEl.isConnected) {
      // Already posted (e.g. user re-triggered the demo) — don't
      // double up the card in the same conversation.
      return;
    }
    const bubble = jarvisBubble("");
    bubble.classList.add("bubble--summary");
    const text = bubble.querySelector(".bubble__text");
    if (!text) return;
    const mttr = computeMTTR();
    text.innerHTML = `
      <div class="summary-card" data-summary="ready">
        <div class="summary-card__head">
          <span class="summary-card__check" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M3.5 8.4 6.6 11.5l6-6.5"/>
            </svg>
          </span>
          <div class="summary-card__head-text">
            <div class="summary-card__eyebrow">Post-incident summary · ComplianceAgent</div>
            <div class="summary-card__title">Post-incident summary is ready</div>
          </div>
        </div>
        <div class="summary-card__body">
          <p class="summary-card__lead">
            ComplianceAgent drafted a full RCA with timeline, root cause, and follow-up actions.
          </p>
          <ul class="summary-card__meta">
            <li><span>Incident</span><strong>${INCIDENT.id} · ${INCIDENT.service}</strong></li>
            <li><span>Severity</span><strong>${INCIDENT.sev} · Resolved</strong></li>
            <li><span>MTTR</span><strong>${mttr}</strong></li>
          </ul>
        </div>
        <div class="summary-card__actions">
          <button type="button" class="summary-card__btn summary-card__btn--primary"
                  data-inc-action="view-summary">
            View summary
          </button>
          <button type="button" class="summary-card__btn"
                  data-inc-action="download-summary">
            Download (.md)
          </button>
          <button type="button" class="summary-card__btn"
                  data-inc-action="share-slack">
            Share to Slack
          </button>
        </div>
      </div>
    `;
    bubble.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-inc-action]");
      if (!btn) return;
      handleIncidentAction(btn.getAttribute("data-inc-action"));
    });
    incState.summaryCardEl = bubble;
  }

  // Disable the still-open approval card (so it stops looking like a
  // pending question) and post the conversational pair: the user's
  // choice as a user-side bubble, then Jarvis's reply on the left.
  // This mirrors the renderAsk pattern from the Install ITSM flow,
  // where every user decision shows up as a real chat exchange
  // rather than a card transforming in place.
  function acknowledgeApproval(label, jarvisMd) {
    const bubble = incState.approvalCardEl;
    if (bubble && bubble.isConnected) {
      const card = bubble.querySelector(".approval-card");
      if (card) card.setAttribute("data-approval", "answered");
      bubble.querySelectorAll("[data-inc-action]").forEach((b) => {
        b.disabled = true;
      });
      // The card has done its job; let go of the ref so a later
      // gate (if any) can post a fresh card.
      incState.approvalCardEl = null;
    }
    // Bring the chat back if the user collapsed it after the card
    // was posted — the reply is the receipt for their action.
    if ($workspace && $workspace.classList.contains("workspace--chat-closed")) {
      setChatClosed(false);
    }
    userBubble(label);
    if (jarvisMd) {
      streamJarvis(md(jarvisMd));
      lastPersona = "jarvis";
    }
  }

  // ---- Incident chiclet bar (above the dock) ------------------
  // The bar (P1 summary + chiclets above the dock) was removed from the
  // stage; the incident page in the side panel is now the single surface
  // for incident state. Kept as a no-op so callers (advanceToPhase,
  // renderIncidentChiclets, etc.) and the elapsed counter / chiclet
  // renderers continue to function without a host element.
  function ensureIncidentBar() {
    return null;
  }

  function removeIncidentBar() {
    if (incState.barEl && incState.barEl.parentNode) {
      incState.barEl.parentNode.removeChild(incState.barEl);
    }
    incState.barEl = null;
  }

  function renderIncidentChiclets(setKey) {
    ensureIncidentBar();
    const setDef = INC_CHICLETS[setKey] || [];
    const host = document.getElementById("incBarChiclets");
    if (!host) return;
    host.innerHTML = setDef.map((c) => `
      <button class="inc-chiclet${c.primary ? " inc-chiclet--primary" : ""}${c.disabled ? " inc-chiclet--disabled" : ""}"
              type="button"
              data-inc-action="${c.id}"
              ${c.disabled ? "aria-disabled=\"true\"" : ""}>
        ${c.spinning ? `<span class="inc-chiclet__spin" aria-hidden="true"></span>` : ""}
        <span>${md(c.label)}</span>
      </button>
    `).join("");
  }

  function handleIncidentAction(id) {
    switch (id) {
      case "open-page":
        openIncident({});
        break;
      case "acknowledge":
        pushDirectorNote({ title: "Acknowledged", text: "On-call team notified you're watching.", autoDismiss: 2400 });
        break;
      case "page-oncall":
        pushDirectorNote({ title: "Paged on-call", text: "Sec-ops and payments lead paged.", autoDismiss: 2400 });
        break;
      case "runbook":
        pushDirectorNote({ title: "Runbook · card-auth", text: "Opening runbook in Lens (Phase 3).", autoDismiss: 2400 });
        break;
      case "warroom":
        pushDirectorNote({ title: "War room", text: "Slack #card-auth-incident-2026-0514 created.", autoDismiss: 2400 });
        break;
      case "approve-mitigation":
        acknowledgeApproval(
          "Approve mitigation",
          "On it. **RemediationAgent** is rolling back to **v3.7.0** now — " +
          "**ChangeAgent** will log **CHG-44102** for the audit trail. " +
          "I'll keep you posted as the rollout completes."
        );
        approveMitigation();
        break;
      case "defer-30":
        acknowledgeApproval(
          "Defer 30 min",
          "Paused. I'll re-prompt you at **13:15 IST** — error rate is still at 8.7%, " +
          "so SLA breach window is shrinking. Ping me sooner if you want to act early."
        );
        break;
      case "more-info":
        acknowledgeApproval(
          "Request more info",
          "**DiagnosticsAgent** will draft a deeper RCA in ~5 min — I'll post it here " +
          "with the affected merchant breakdown and the v3.7.0 → v3.7.1 diff."
        );
        break;
      case "view-summary":
        openSummaryDrawer();
        break;
      case "download-summary":
        downloadSummary();
        break;
      case "share-slack":
        pushDirectorNote({ title: "Shared to #payments-ops", text: "Summary posted to Slack with timeline.", autoDismiss: 2600 });
        break;
      case "close-incident":
        closeIncidentFlow();
        break;
    }
  }

  function closeIncidentFlow() {
    pushDirectorNote({
      title: "Incident closed",
      text: `${INCIDENT.id} · MTTR ${computeMTTR()}`,
      sub: "Removed from active queue. Full record archived in Lens.",
      autoDismiss: 3000,
    });
    removeIncidentBar();
    if (incState.elapsedTimer) {
      clearInterval(incState.elapsedTimer);
      incState.elapsedTimer = null;
    }
    incState.pageOpen = false;
  }

  // ---- Elapsed counter ---------------------------------------
  function updateIncidentElapsed() {
    if (!INCIDENT.startedAt) return;
    const sec = Math.max(0, Math.floor((Date.now() - INCIDENT.startedAt) / 1000));
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    const label = (incState.resolved ? "Resolved · " : "Live · ") + `${mm}:${ss}`;
    const barEl = document.getElementById("incBarElapsed");
    if (barEl) barEl.textContent = label;
    const pageEl = document.getElementById("incPageElapsed");
    if (pageEl) pageEl.textContent = label;
  }
  function computeMTTR() {
    if (!INCIDENT.startedAt) return "—";
    const sec = Math.floor((Date.now() - INCIDENT.startedAt) / 1000);
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }

  // ---- Page refresh (called when the page is mounted/updated) -----
  function refreshIncidentPage() {
    // The page reads from incState via these hooks. If the page
    // isn't mounted (user navigated away), this is a no-op.
    if (typeof window.__incPageSync === "function") {
      window.__incPageSync(getIncidentSnapshot());
    }
  }

  function getIncidentSnapshot() {
    return {
      incident:   INCIDENT,
      phases:     INC_PHASES,
      phaseIdx:   incState.phaseIdx,
      timeline:   incState.timeline.slice(),
      agents:     INC_AGENTS,
      activeAgents: Array.from(incState.activeAgents),
      // What's happening RIGHT NOW (or null if the incident is idle /
      // resolved). The page renders this as the live activity row.
      activity:   incState.activity ? { ...incState.activity } : null,
      // True only AFTER the resolved-phase entries have finished
      // posting — gates everything that says "incident is wrapped up"
      // (frozen elapsed pill, green styling, summary card, etc).
      resolved:   incState.resolved,
    };
  }

  // ---- Summary doc -------------------------------------------
  function buildSummaryMarkdown() {
    const lines = [];
    lines.push(`# Post-incident summary · ${INCIDENT.id}`);
    lines.push("");
    lines.push(`**Service**: ${INCIDENT.service}`);
    lines.push(`**Severity**: ${INCIDENT.sev}`);
    lines.push(`**Title**: ${INCIDENT.title}`);
    lines.push(`**Affected**: ${INCIDENT.affected}`);
    lines.push(`**Region**: ${INCIDENT.region}`);
    lines.push(`**MTTR**: ${computeMTTR()}`);
    lines.push("");
    lines.push("## Root cause");
    lines.push(INCIDENT.rootCause);
    lines.push("");
    lines.push("## Mitigation");
    lines.push(INCIDENT.mitigation);
    lines.push("");
    lines.push("## Timeline");
    incState.timeline.forEach((e) => {
      lines.push(`- \`${e.at}\` **${e.agent}** — ${e.text}`);
    });
    lines.push("");
    lines.push("## Follow-up actions");
    lines.push("- [ ] Add a regression test for 3DS issuer timeouts > 1.8s (DiagnosticsAgent · 2 days).");
    lines.push("- [ ] Block deploys that lower timeouts without a paired SLO review (ChangeAgent · this week).");
    lines.push("- [ ] Brief payments-ops on the rollback at the Friday standup.");
    lines.push("");
    lines.push("_Generated by ComplianceAgent · Jarvis ITSM._");
    return lines.join("\n");
  }

  function openSummaryDrawer() {
    // Reuse the existing chat-history slide-over pattern by mounting
    // a fresh drawer (separate ID so it doesn't collide). Click-out
    // and Esc both dismiss.
    const existing = document.getElementById("incSummaryDrawer");
    if (existing) existing.remove();

    const drawer = document.createElement("aside");
    drawer.className = "inc-summary-drawer";
    drawer.id = "incSummaryDrawer";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Post-incident summary");
    drawer.innerHTML = `
      <div class="inc-summary-drawer__scrim" data-inc-summary-action="close"></div>
      <div class="inc-summary-drawer__panel">
        <header class="inc-summary-drawer__head">
          <div>
            <div class="inc-summary-drawer__eyebrow">Post-incident summary</div>
            <h2 class="inc-summary-drawer__title">${md(INCIDENT.title)}</h2>
            <div class="inc-summary-drawer__meta">
              ${INCIDENT.id} · ${INCIDENT.service} · MTTR ${computeMTTR()}
            </div>
          </div>
          <button class="inc-summary-drawer__close" type="button"
                  aria-label="Close summary" data-inc-summary-action="close">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none"
                 stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8"/>
            </svg>
          </button>
        </header>
        <div class="inc-summary-drawer__body">
          <section class="inc-summary-block">
            <h3>Root cause</h3>
            <p>${md(INCIDENT.rootCause)}</p>
          </section>
          <section class="inc-summary-block">
            <h3>Mitigation</h3>
            <p>${md(INCIDENT.mitigation)}</p>
          </section>
          <section class="inc-summary-block">
            <h3>Timeline</h3>
            <ol class="inc-summary-timeline">
              ${incState.timeline.map((e) => `
                <li>
                  <span class="inc-summary-timeline__at">${md(e.at)}</span>
                  <span class="inc-summary-timeline__agent">${md(e.agent)}</span>
                  <span class="inc-summary-timeline__text">${md(e.text)}</span>
                </li>
              `).join("")}
            </ol>
          </section>
          <section class="inc-summary-block">
            <h3>Follow-up actions</h3>
            <ul class="inc-summary-followup">
              <li>Add a regression test for 3DS issuer timeouts > 1.8s (DiagnosticsAgent · 2 days).</li>
              <li>Block deploys that lower timeouts without a paired SLO review (ChangeAgent · this week).</li>
              <li>Brief payments-ops on the rollback at the Friday standup.</li>
            </ul>
          </section>
        </div>
        <footer class="inc-summary-drawer__foot">
          <button class="inc-summary-drawer__btn" type="button"
                  data-inc-summary-action="download">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none"
                 stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <path d="M8 2v8M4.5 7 8 10.5 11.5 7M3 13h10"/>
            </svg>
            Download .md
          </button>
          <button class="inc-summary-drawer__btn" type="button"
                  data-inc-summary-action="slack">
            Share to Slack
          </button>
          <button class="inc-summary-drawer__btn inc-summary-drawer__btn--primary"
                  type="button" data-inc-summary-action="close">
            Done
          </button>
        </footer>
      </div>
    `;
    document.body.appendChild(drawer);
    requestAnimationFrame(() => drawer.classList.add("inc-summary-drawer--in"));

    drawer.addEventListener("click", (e) => {
      const t = e.target.closest("[data-inc-summary-action]");
      if (!t) return;
      const action = t.getAttribute("data-inc-summary-action");
      if (action === "close") {
        drawer.classList.remove("inc-summary-drawer--in");
        setTimeout(() => drawer.remove(), 240);
      } else if (action === "download") {
        downloadSummary();
      } else if (action === "slack") {
        pushDirectorNote({ title: "Shared to #payments-ops", text: "Summary posted to Slack with timeline.", autoDismiss: 2600 });
      }
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key !== "Escape") return;
      const d = document.getElementById("incSummaryDrawer");
      if (!d) { document.removeEventListener("keydown", onKey); return; }
      d.classList.remove("inc-summary-drawer--in");
      setTimeout(() => d.remove(), 240);
      document.removeEventListener("keydown", onKey);
    });
  }

  function downloadSummary() {
    const md = buildSummaryMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${INCIDENT.id}-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    pushDirectorNote({
      title: "Summary downloaded",
      text: `${INCIDENT.id}-summary.md`,
      autoDismiss: 2400,
    });
  }

  // ---- Scheduler: fire the incident after a short delay -------
  function scheduleIncident({ delay = 8000 } = {}) {
    // Cancel any prior scheduled run.
    if (window.__incScheduledTimer) {
      clearTimeout(window.__incScheduledTimer);
      window.__incScheduledTimer = null;
    }
    window.__incScheduledTimer = setTimeout(() => {
      window.__incScheduledTimer = null;
      // Only fire if we're still on home (don't surprise the user
      // mid-flow on another page).
      if (mode !== "home" && mode !== "page" && mode !== "chat") return;
      INCIDENT.startedAt = Date.now();
      showIncidentToast();
    }, delay);
  }

  // Page-side hooks: the incident-live page (stories/02-admin-sarah.js)
  // reads the snapshot on first paint and dispatches summary-card
  // clicks through the same handler the chiclet bar uses.
  window.__incGetSnapshot = () =>
    (incState.phaseIdx >= 0 ? getIncidentSnapshot() : null);
  window.__incHandleAction = handleIncidentAction;

  // Home → Incident shortcut. The "Card payments — declines climbing
  // fast" row in the Services to watch card invokes this in place of
  // the old auto-firing toast: it boots a clean incident state (so
  // re-entries replay the timeline) and mounts the live page.
  window.__openIncidentFromHome = () => {
    if (incState.phaseIdx >= 0) {
      resetIncidentState();
    }
    INCIDENT.startedAt = Date.now();
    openIncident({});
  };

  // Cockpit → Agent detail shortcut. The cockpit factory in
  // stories/02-admin-sarah.js wires each agent card's click +
  // keyboard activation to this helper. We stash the agent on
  // window so the agent-detail page factory (also in the same
  // story file) can read it after navigateTo() remounts the
  // panel — navigateTo() itself doesn't carry custom payloads.
  // Falls back to a director-note on missing data so the click
  // never silently no-ops.
  window.__openAgentDetail = (agent) => {
    if (!agent || !agent.name) {
      pushDirectorNote({ title: "Agent detail", text: "No agent selected.",
        autoDismiss: 1800 });
      return;
    }
    window.__activeAgentDetail = agent;
    navigateTo("agent-detail");
  };

  // Back-link from the agent-detail page to the Cockpit. Kept on
  // window because the page factory lives outside this IIFE.
  window.__navigateToCockpit = () => {
    window.__activeAgentDetail = null;
    navigateTo("tower");
  };

  // Tear down all incident state — phase, timers, timeline, bar, page
  // sync hook. Called when the user starts a fresh chat session and
  // when __playIncident() re-fires the demo.
  function resetIncidentState() {
    incState.phaseIdx = -1;
    if (incState.timer)        { clearTimeout(incState.timer);        incState.timer = null; }
    if (incState.entryTimer)   { clearTimeout(incState.entryTimer);   incState.entryTimer = null; }
    if (incState.elapsedTimer) { clearInterval(incState.elapsedTimer); incState.elapsedTimer = null; }
    if (window.__incScheduledTimer) {
      clearTimeout(window.__incScheduledTimer);
      window.__incScheduledTimer = null;
    }
    incState.timeline = [];
    incState.activeAgents = new Set();
    incState.pendingEntries = [];
    incState.activity = null;
    incState.resolved = false;
    incState.approvalCardEl = null;
    incState.summaryCardEl = null;
    incState.pageOpen = false;
    INCIDENT.startedAt = null;
    removeIncidentBar();
  }

  // Manual re-trigger for re-demos and testing.
  window.__playIncident = () => {
    resetIncidentState();
    INCIDENT.startedAt = Date.now();
    showIncidentToast();
  };

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
    await streamInto(typing, html);
  }

  async function renderFallback() {
    const typing = typingBubble();
    await sleep(450);
    const html = md(
      "I'm here to help with setup, configuration, and anything Jarvis can do for IT. " +
      "Ask me about the install, the CMDB, integrations, or how to roll back changes."
    );
    await streamInto(typing, html);
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

    // Wizard interception — when the Add Agent wizard is awaiting a
    // free-text answer (JTBD or a custom name), route the input to
    // it instead of treating it as a normal chat message. Typing
    // "cancel" at any free-text step exits the wizard cleanly.
    if (agentWizard.active && typeof agentWizard.pendingText === "function") {
      if (/^cancel$/i.test(text)) {
        userBubble(text);
        agentWizard.cancel();
        return;
      }
      const handler = agentWizard.pendingText;
      userBubble(text);
      handler(text);
      return;
    }

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

  // "New chat" — Slack-style compose-message glyph that resets the
  // whole session: tears down any running incident, clears the
  // thread + director-note stack, closes the right panel, and
  // re-renders the home/welcome view. This is the one-tap escape
  // hatch back to a clean slate.
  $stageNewChat?.addEventListener("click", () => {
    startHome();
    pushDirectorNote({
      title: "New chat",
      text:  "Started a fresh session. You're back on home.",
      autoDismiss: 2000,
    });
  });

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
      // Skip the home view — jump straight to the requested
      // workspace surface. The chat panel is closed so the page
      // gets the full canvas (matches the design comp).
      setupComplete = true;
      applySidenavGating();
      setChatClosed(true, { instant: true });
      $workspace.classList.remove("workspace--welcome");
      navigateTo(deepLinkPage);
    } else if (location.hash.toLowerCase() === "#setup") {
      // Explicit escape hatch — the original v3 Setup story is
      // still reachable for anyone who wants to replay it. Lives
      // at the Settings nav item too (see $navSettings handler).
      setChatClosed(false, { instant: true });
      applySidenavGating();
      startSetup();
    } else {
      // v4 default — drop John straight onto the steady-state
      // home (full-canvas chat + chiclets + IT-manager strip).
      startHome();
    }
  })();
})();
