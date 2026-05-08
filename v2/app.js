/* =====================================================
   Jarvis · Agentic Portal Builder — v2 engine
   ===================================================== */
(() => {
  // ---- DOM refs ----
  const $welcome   = document.getElementById("welcome");
  const $builder   = document.getElementById("builder");
  const $thread    = document.getElementById("chatThread");
  const $promptInput = document.getElementById("promptInput");
  const $getStarted  = document.getElementById("getStartedBtn");
  const $composer  = document.getElementById("composer");
  const $composerInput = document.getElementById("composerInput");
  const $composerSend  = document.getElementById("composerSend");
  const $panel     = document.getElementById("panel");
  const $suggestions = document.querySelectorAll("[data-action='prompt']");

  // ---- State ----
  let lastPersona = null;

  // ---- utils ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const md = (s) => String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  const scrollDown = () => {
    requestAnimationFrame(() =>
      $thread.scrollTo({ top: $thread.scrollHeight, behavior: "smooth" })
    );
  };

  // ---- bubbles ----
  function jarvisBubble(innerHTML) {
    const wrap = document.createElement("div");
    const cont = lastPersona === "jarvis";
    wrap.className = "bubble" + (cont ? " bubble--continued" : "");
    wrap.innerHTML = `
      <div class="bubble__avatar"></div>
      <div class="bubble__body">${innerHTML}</div>
    `;
    $thread.appendChild(wrap);
    lastPersona = "jarvis";
    scrollDown();
    return wrap;
  }
  function userBubble(text) {
    const wrap = document.createElement("div");
    wrap.className = "bubble bubble--user";
    wrap.innerHTML = `<div class="bubble__body">${md(text)}</div>`;
    $thread.appendChild(wrap);
    lastPersona = "user";
    scrollDown();
    return wrap;
  }

  // ---- flow steps ----
  function askChoice(prompt, choices) {
    return new Promise((resolve) => {
      const bubble = jarvisBubble(`<div>${md(prompt)}</div>`);
      const row = document.createElement("div");
      row.className = "choices";
      choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.innerHTML = `
          ${c.icon ? `<span class="choice-btn__icon">${c.icon}</span>` : ""}
          <span>${md(c.label)}</span>
        `;
        btn.addEventListener("click", () => {
          [...row.children].forEach((b) => (b.disabled = true));
          userBubble(c.label);
          resolve(c);
        });
        row.appendChild(btn);
      });
      bubble.querySelector(".bubble__body").appendChild(row);
      scrollDown();
    });
  }

  function showAnalysing() {
    const bubble = jarvisBubble(`
      <div class="analysing">
        <span class="analysing__sparkle">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z"/></svg>
        </span>
        <span class="analysing__label">Analysing</span>
      </div>
      <div class="skeleton skeleton--a"></div>
      <div class="skeleton skeleton--b"></div>
    `);
    return bubble;
  }

  // ---- side panel ----
  function openPanel() {
    $panel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => $panel.classList.add("is-open"));
    animateStatCounters();
  }

  function animateStatCounters() {
    document.querySelectorAll(".stat__value").forEach((el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const dur = 1100 + Math.random() * 400;
      const start = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      function tick(now) {
        const t = Math.min(1, (now - start) / dur);
        const v = Math.round(ease(t) * target);
        el.textContent = v.toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      }
      requestAnimationFrame(tick);
    });
  }

  // ---- demo entry ----
  async function startDemo(seedPrompt) {
    // Hide welcome → show builder
    $welcome.hidden = true;
    $builder.hidden = false;

    // 1. Greeting + choice (Update Existing Site / Start from Scratch)
    await sleep(280);
    jarvisBubble(`Welcome <strong>Alice</strong>! Let us get started to set up your self service portal. Would you like to choose an existing site or create a new site?`);

    const pick = await askChoice("", [
      { label: "Update Existing Site", value: "update", icon: refreshSvg() },
      { label: "Start from Scratch",   value: "scratch", icon: editSvg() }
    ]);

    // 2. Open the Choose Site panel a beat after the first answer
    await sleep(420);
    openPanel();

    // 3. Confirmation + analysing
    jarvisBubble(`Thank you for choosing your site, I'll now start analysing your site. In order to continue you need to turn on all your permissions.`);
    await sleep(380);
    showAnalysing();

    // 4. (For the demo, freeze on Analysing — that's the screenshot's final state)
    // If you want to extend, add more steps here.
  }

  // ---- entry surfaces ----
  $getStarted.addEventListener("click", () => startDemo($promptInput.value));
  $promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startDemo($promptInput.value);
  });
  $suggestions.forEach((el) => {
    el.addEventListener("click", () => {
      $promptInput.value = el.querySelector("span:last-child").textContent.trim();
      startDemo($promptInput.value);
    });
  });

  $composerSend.addEventListener("click", () => {
    const v = ($composerInput.value || "").trim();
    if (!v) return;
    userBubble(v);
    $composerInput.value = "";
    // Echo a placeholder response so the composer feels real
    setTimeout(() => {
      jarvisBubble(`Got it — I'll fold that into the analysis.`);
    }, 600);
  });
  $composerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $composerSend.click();
    }
  });

  // ---- inline icons (small) ----
  function refreshSvg() {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`;
  }
  function editSvg() {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
  }
})();
