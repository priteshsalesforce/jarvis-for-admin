/* =============================================================
   ENGINE — runs window.STORY one step at a time.
   You normally don't edit this file. Edit story.js instead.
   ============================================================= */

(() => {
  // ---- DOM refs ----
  const $hero        = document.getElementById("hero");
  const $thread      = document.getElementById("thread");
  const $stage       = document.getElementById("stage");
  const $stageMain   = document.getElementById("stageMain");
  const $dock        = document.getElementById("dock");
  const $whisper     = document.getElementById("whisper");
  const $workspace   = document.getElementById("workspace");
  const $sidepanel   = document.getElementById("sidepanel");
  const $browserView = document.getElementById("browserViewport");
  const $browserUrl  = document.getElementById("browserUrl");
  const $browserClose= document.getElementById("browserClose");

  const $whisperInput = document.getElementById("whisperInput");
  const $whisperSend  = document.getElementById("whisperSend");
  const $suggestions  = document.getElementById("suggestions");

  // Composer was removed in the new layout — stub so legacy refs don't crash.
  const $composer = { hidden: true };

  // ---- State ----
  let stepIndex = 0;
  let pendingResolve = null; // for "ask" / "choose" / "wait-for" / link-card
  let lastPersona  = null;   // "jarvis" | "user" — for consecutive grouping

  // ---- Utilities ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const md = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");

  const scrollDown = () => {
    requestAnimationFrame(() =>
      $stageMain.scrollTo({ top: $stageMain.scrollHeight, behavior: "smooth" })
    );
  };

  const findStepIndex = (id) =>
    window.STORY.findIndex((s) => s && s.id === id);

  // ---- Bubble factories ----
  function jarvisBubble(innerHTML, { sys = false } = {}) {
    const wrap = document.createElement("div");
    const isContinued = lastPersona === "jarvis";
    wrap.className = "bubble"
      + (sys ? " bubble--sys" : "")
      + (isContinued ? " bubble--continued" : "");
    wrap.innerHTML = `
      <div class="bubble__avatar"></div>
      <div class="bubble__body">
        <div class="bubble__name">Jarvis</div>
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
    wrap.className = "bubble bubble--user"
      + (isContinued ? " bubble--continued" : "");
    wrap.innerHTML = `
      <div class="bubble__avatar"></div>
      <div class="bubble__body">
        <div class="bubble__name">Admin</div>
        <div class="bubble__text">${md(text)}</div>
      </div>
    `;
    $thread.appendChild(wrap);
    lastPersona = "user";
    scrollDown();
    return wrap;
  }

  function typingBubble() {
    return jarvisBubble(`<span class="typing"><span></span><span></span><span></span></span>`);
  }

  // ---- Step renderers ----
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
    // Animate inset
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
        btn.className = "action" + (c.primary ? " action--primary" : "");
        btn.innerHTML = `${c.glyph ? `<span class="action__glyph">${c.glyph}</span>` : ""}${md(c.label)}`;
        btn.addEventListener("click", () => {
          // disable siblings
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
          userBubble(`Use ${o.label}`);
          resolve(o);
        });
        grid.appendChild(b);
      });
      bubble.querySelector(".bubble__body").appendChild(card);
      scrollDown();
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
      btn.addEventListener("click", () => {
        openBrowser(step.url, step.page);
      });
      bubble.querySelector(".bubble__body").appendChild(btn);
      scrollDown();
      // Resolve immediately so the story can proceed; opening the link
      // is a passive action by the admin.
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
        // Mark this status as ✓
        bubble.querySelector(".status-line").innerHTML = `
          <span class="status-line__icon is-ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </span>
          <span class="status-line__label">Confirmed</span>
        `;
        resolve();
      };
      $sidepanel.addEventListener(step.event, handler);
    });
  }

  // ---- Side panel browser ----
  function openBrowser(url, pageKey) {
    $workspace.classList.add("workspace--split");
    $sidepanel.setAttribute("aria-hidden", "false");
    $browserUrl.textContent = url || "about:blank";
    $browserView.innerHTML = "";
    const factory = window.PAGES?.[pageKey];
    if (factory) factory($browserView, { dispatch: (name) => $sidepanel.dispatchEvent(new CustomEvent(name)) });
    else $browserView.innerHTML = `<div class="page"><p>${pageKey || "Empty page"}</p></div>`;
  }

  function closeBrowser() {
    $workspace.classList.remove("workspace--split");
    $sidepanel.setAttribute("aria-hidden", "true");
    setTimeout(() => { $browserView.innerHTML = ""; }, 500);
  }

  $browserClose.addEventListener("click", closeBrowser);

  // ---- Main runner ----
  async function runStep(step) {
    if (!step) return false;
    if (step.pause) await sleep(step.pause);

    switch (step.type) {
      case "say":          await renderSay(step); break;
      case "status":       await renderStatus(step); break;
      case "progress":     await renderProgress(step); break;
      case "ask": {
        const picked = await renderAsk(step);
        if (picked.goto) {
          const idx = findStepIndex(picked.goto);
          if (idx >= 0) { stepIndex = idx; return true; }
        }
        break;
      }
      case "choose": {
        const picked = await renderChoose(step);
        if (picked.goto) {
          const idx = findStepIndex(picked.goto);
          if (idx >= 0) { stepIndex = idx; return true; }
        }
        break;
      }
      case "browser":      openBrowser(step.url, step.page); break;
      case "browser-close":closeBrowser(); break;
      case "wait-for":     await renderWaitFor(step); break;
      case "link-card":    await renderLinkCard(step); break;
      case "user":         userBubble(step.text); break;
      case "goto": {
        const idx = findStepIndex(step.to);
        if (idx >= 0) { stepIndex = idx; return true; }
        break;
      }
      case "end":
        $composer.hidden = false;
        return false;
      default:
        console.warn("Unknown step type:", step.type, step);
    }
    return true;
  }

  async function runStory() {
    while (stepIndex < window.STORY.length) {
      const step = window.STORY[stepIndex];
      const advanced = await runStep(step);
      if (step?.type === "end") break;
      // If step changed stepIndex (goto), don't auto-advance.
      if (advanced === true && (step.type === "ask" || step.type === "choose" || step.type === "goto")) {
        // For ask/choose without goto, just advance
        if (!stepHadGoto(step)) stepIndex += 1;
      } else if (advanced === false) {
        break;
      } else {
        stepIndex += 1;
      }
    }
    $composer.hidden = false;
  }

  function stepHadGoto(step) {
    // Only true if we actually jumped — runStep updates stepIndex on jump.
    // Easiest check: compare current stepIndex to the step's index in array.
    const myIdx = window.STORY.indexOf(step);
    return stepIndex !== myIdx; // we moved away
  }

  // ---- FLIP: smoothly relocate the whisper from hero → dock ----
  function flipWhisperToDock() {
    if ($whisper.parentElement === $dock) return;       // already docked
    const first = $whisper.getBoundingClientRect();      // measure BEFORE
    $dock.appendChild($whisper);                         // move in DOM
    const last = $whisper.getBoundingClientRect();       // measure AFTER

    const dx = first.left - last.left;
    const dy = first.top  - last.top;
    const sx = first.width  / last.width;
    const sy = first.height / last.height;

    // INVERT — start at the old position/size, no transition
    $whisper.style.transition = "none";
    $whisper.style.transformOrigin = "top left";
    $whisper.style.transform =
      `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

    // PLAY — next frame, transition back to identity
    requestAnimationFrame(() => {
      $whisper.style.transition =
        "transform .7s cubic-bezier(.2,.7,.2,1)";
      $whisper.style.transform = "";
    });

    // Cleanup so subsequent CSS hover/transitions aren't stomped
    $whisper.addEventListener("transitionend", function clean(e) {
      if (e.propertyName !== "transform") return;
      $whisper.style.transition = "";
      $whisper.style.transformOrigin = "";
      $whisper.removeEventListener("transitionend", clean);
    });
  }

  // ---- Entry: how the demo starts ----
  function startDemo() {
    flipWhisperToDock();              // 1. fly the whisper down to the dock
    $hero.classList.add("hero--collapsed");
    stepIndex = 0;
    lastPersona = null;
    $thread.innerHTML = "";
    closeBrowser();
    runStory();
  }

  // ---- Wire up entry surfaces ----
  // Direct listener on every [data-action] element — robust against
  // event-target oddities and DOM changes inside the button.
  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.action === "install-itsm") startDemo();
    });
  });

  $whisperSend.addEventListener("click", handleWhisper);
  $whisperInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleWhisper();
  });

  function handleWhisper() {
    const v = ($whisperInput.value || "").trim().toLowerCase();
    if (!v) return;
    const wantsInstall = v.includes("install") &&
      (v.includes("itsm") || v.includes("it service") || v.includes("it services"));
    if (wantsInstall) startDemo();
    else {
      flipWhisperToDock();
      $hero.classList.add("hero--collapsed");
      $thread.innerHTML = "";
      lastPersona = null;
      userBubble($whisperInput.value);
      jarvisBubble(`I heard "<em>${md($whisperInput.value)}</em>". For this demo, click <strong>Install IT Services</strong> or whisper "install IT services".`);
    }
  }

})();
