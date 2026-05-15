/* =================================================================
   app.js — Mobile v4 story engine (IT Manager · IndiaFirst Bank)
   -----------------------------------------------------------------
   Three-pane shell:

     HOME  : hero + chiclets + inline composer + cards
     CHAT  : Jarvis thread (status checklist, bubbles, contextual
             chiclets, in-chat cards). Bottombar = composer + the
             right-panel switcher pill (pulses while Jarvis is
             generating UI for the right pane).
     RIGHT : The Cockpit canvas (KPIs, AI Agents list, The Team).
             Bottombar = small Jarvis pill on the LEFT + wider
             current-tab pill on the RIGHT.

   Stories shipped in this build:

     • Open Cockpit  — instant jump to the right pane.
     • Add Agent     — chat conversation. While Jarvis is preparing
                       UI, the switcher pulses; once ready, tapping
                       it lands you on the right pane (Cockpit) with
                       the new agent shown at the top.
     • Open Incident — chat narration runs in chat; switcher pulses
                       while right pane is being primed.
   ================================================================= */
(function () {
  "use strict";

  // ---------------------------------------------------------- DOM
  const app           = document.getElementById("app");
  const home          = document.getElementById("home");
  const thread        = document.getElementById("thread");
  const rightPane     = document.getElementById("rightPane");
  const bottombar     = document.getElementById("bottombar");
  const hamburgerBtn  = document.getElementById("hamburgerBtn");
  const drawer        = document.getElementById("drawer");
  const drawerScrim   = document.getElementById("drawerScrim");
  const drawerItems   = document.getElementById("drawerItems");
  const drawerJarvis  = document.getElementById("drawerJarvis");
  const drawerThemeBtn   = document.getElementById("drawerThemeBtn");
  const drawerSignOutBtn = document.getElementById("drawerSignOutBtn");
  const drawerName    = document.getElementById("drawerName");
  const drawerRole    = document.getElementById("drawerRole");
  const drawerEmail   = document.getElementById("drawerEmail");
  const drawerAvatar  = document.getElementById("drawerAvatar");
  const toastStack    = document.getElementById("toastStack");
  const statusTime    = document.getElementById("statusTime");

  // ---------------------------------------------------------- HELPERS
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const escapeHTML = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const md = (s) =>
    escapeHTML(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  function updateClock() {
    const d = new Date();
    statusTime.textContent =
      d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  updateClock();
  setInterval(updateClock, 30_000);

  function scrollDown() {
    requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });
  }

  // Token cancels in-flight typing across resets.
  let runToken = 0;
  // Wizard free-text bridge between composer and the wizard step.
  const wizardState = { active: false, pendingText: null,
    slots: { jtbd: "", domain: "", name: "", level: "L2" } };
  // Tracks the current right-pane tab (used by the right-view bottombar).
  let rightTab = { id: "cockpit", label: "Cockpit", icon: "doc" };

  // =================================================================
  // PERSONA + DRAWER ITEMS
  // =================================================================
  function stampPersona() {
    const p = window.PERSONA;
    drawerName.textContent  = p.full;
    drawerRole.textContent  = p.role;
    drawerEmail.textContent = p.email;
    drawerAvatar.textContent = p.initial;
  }

  const DRAWER_ICONS = {
    tower:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>`,
    insight:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v6h-6"/></svg>`,
    horizon:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/></svg>`,
    lens:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  };

  function renderDrawerItems() {
    drawerItems.innerHTML = window.DRAWER_ITEMS.map((it) => {
      const locked = it.id !== "settings";
      return `
        <button class="drawer__item ${locked ? "is-locked" : "is-active"}"
                type="button" data-drawer-item="${it.id}">
          <span class="drawer__item-icon">${DRAWER_ICONS[it.icon] || DRAWER_ICONS.tower}</span>
          <span>${escapeHTML(it.label)}</span>
          ${locked ? `
            <span class="drawer__lock" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
            </span>` : ""}
        </button>`;
    }).join("");
  }

  // =================================================================
  // DRAWER OPEN / CLOSE
  // =================================================================
  function openDrawer() {
    app.classList.add("drawer-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerScrim.setAttribute("aria-hidden", "false");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    app.classList.remove("drawer-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerScrim.setAttribute("aria-hidden", "true");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }
  hamburgerBtn.addEventListener("click", openDrawer);
  drawerScrim.addEventListener("click", closeDrawer);

  drawerItems.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-drawer-item]");
    if (!btn) return;
    const id = btn.dataset.drawerItem;
    closeDrawer();
    if (id === "settings") {
      toast({ title: "Settings", text: "Workspace preferences open here.", tone: "ok" });
    } else {
      toast({
        title: `${btn.textContent.trim()} · coming soon`,
        text: "This surface is staged for a later demo. The chat assistant covers it for now.",
        tone: "ok",
      });
    }
  });

  drawerThemeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = (cur === "dark") ? "light" : (cur === "light") ? "" : "dark";
    if (next) document.documentElement.setAttribute("data-theme", next);
    else      document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("jarvis-mobile-v4-theme", next); } catch (_) {}
    toast({ title: "Theme", text: next ? `Switched to ${next} mode.` : "Following system theme.", tone: "ok" });
  });
  drawerSignOutBtn.addEventListener("click", () => {
    closeDrawer();
    toast({ title: "Signed out", text: "Reload to come back as John.", tone: "ok" });
  });
  drawerJarvis.addEventListener("click", () => {
    closeDrawer();
    if (app.dataset.view !== "chat") showChat();
    if (!thread.children.length) {
      jarvisBubbleStream(md(
        "I'm Jarvis. From here you can **open the Cockpit**, **add a new agent**, " +
        "**open the live incident**, or just ask me anything about your operations."
      ));
    }
  });

  // =================================================================
  // VIEW SWITCHING + BOTTOMBAR RENDER
  // =================================================================
  function showHome() {
    app.dataset.view = "home";
    bottombar.dataset.state = "idle";
    renderBottombar();
    // Refocus inline composer if visible
    const inlineInput = home.querySelector("#composerInlineInput");
    if (inlineInput) inlineInput.value = "";
  }
  function showChat() {
    app.dataset.view = "chat";
    renderBottombar();
    requestAnimationFrame(() => scrollDown());
  }
  function showRight() {
    app.dataset.view = "right";
    renderBottombar();
    // Reset right-scroll to top whenever the user lands on it.
    rightPane.scrollTop = 0;
  }

  // The bottombar's contents depend on which view is active.
  // The bar itself is hidden on the home view (composer is inline up top).
  function renderBottombar() {
    if (app.dataset.view === "home") {
      bottombar.innerHTML = "";
      return;
    }
    if (app.dataset.view === "chat") {
      bottombar.innerHTML = chatBottomHTML();
      wireChatComposer();
      wireSwitcherToRight();
      return;
    }
    if (app.dataset.view === "right") {
      bottombar.innerHTML = rightBottomHTML();
      wireSwitcherToChat();
      wireRightTab();
      return;
    }
  }

  // ---- chat bottombar: composer + small right-pane switcher pill --
  function chatBottomHTML() {
    return `
      <form class="bottombar__composer" id="chatComposer" autocomplete="off" novalidate>
        <input class="bottombar__input" id="chatInput"
               type="text" inputmode="text" autocapitalize="sentences"
               placeholder="Ask anything" aria-label="Message Jarvis" />
        <button class="bottombar__icon-btn" type="button" id="chatPlusBtn"
                aria-label="Add">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <button class="bottombar__icon-btn" type="submit" id="chatMicBtn"
                aria-label="Send / Voice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="3" width="6" height="12" rx="3"/>
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
          </svg>
        </button>
      </form>
      <button class="switcher-pill" id="switchToRight" type="button"
              aria-label="Open right panel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3"/>
          <path d="M9 8h7M9 12h7M9 16h4"/>
        </svg>
      </button>`;
  }

  // ---- right bottombar: small Jarvis pill + wider current-tab pill -
  function rightBottomHTML() {
    const ICON_DOC = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6M9 13h6M9 17h6M9 9h2"/>
      </svg>`;
    return `
      <button class="switcher-jarvis" id="switchToChat" type="button"
              aria-label="Back to chat">
        <img src="assets/jarvis-mark.png" alt="" />
      </button>
      <button class="switcher-tab" id="rightTabBtn" type="button"
              aria-label="Current right-panel tab">
        <span class="switcher-tab__icon" aria-hidden="true">${ICON_DOC}</span>
        <span class="switcher-tab__label">${escapeHTML(rightTab.label)}</span>
        <span class="switcher-tab__hint">on canvas</span>
      </button>`;
  }

  function wireChatComposer() {
    const form = document.getElementById("chatComposer");
    const input = document.getElementById("chatInput");
    const plus  = document.getElementById("chatPlusBtn");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      handleChatSubmit(text);
    });
    plus.addEventListener("click", () => {
      toast({ title: "Add", text: "Attach a file, or pick from saved playbooks.", tone: "ok" });
    });
  }
  function wireSwitcherToRight() {
    const btn = document.getElementById("switchToRight");
    if (!btn) return;
    btn.addEventListener("click", () => {
      // Tapping the switcher always clears the "ready" hint state.
      bottombar.dataset.state = "idle";
      showRight();
    });
  }
  function wireSwitcherToChat() {
    const btn = document.getElementById("switchToChat");
    if (!btn) return;
    btn.addEventListener("click", () => showChat());
  }
  function wireRightTab() {
    const btn = document.getElementById("rightTabBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      toast({ title: rightTab.label, text: "Tab switcher coming soon — right pane is currently showing the Cockpit.", tone: "ok" });
    });
  }

  // Public helpers — drive the switcher pulse from the stories.
  // setGenerating(true)  → spinning gradient ring + halo (chat is
  //                        actively building UI for the right pane).
  // markRightReady()     → soft blue pulse to invite a tap.
  function setGenerating(on) {
    if (app.dataset.view === "right") return; // no-op while user is viewing it
    bottombar.dataset.state = on ? "generating" : "idle";
  }
  function markRightReady() {
    if (app.dataset.view === "right") return;
    bottombar.dataset.state = "ready";
  }

  // =================================================================
  // HOME VIEW RENDER
  // =================================================================
  function renderHome() {
    const g = window.HOME_GREETING;
    home.innerHTML = `
      <header class="hero">
        <div class="hero__hello">${escapeHTML(g.hello)} <strong>${escapeHTML(g.name)}</strong></div>
        <div class="hero__lead">${escapeHTML(g.lead)}</div>
        <h1 class="hero__title">${escapeHTML(g.title)}</h1>
      </header>
      <div class="chiclets" id="homeChiclets"></div>
      <form class="composer-inline" id="composerInline" autocomplete="off" novalidate>
        <input class="composer-inline__input" id="composerInlineInput"
               type="text" inputmode="text" autocapitalize="sentences"
               placeholder="Ask anything" aria-label="Message Jarvis" />
        <button class="composer-inline__icon-btn" type="button" id="homePlusBtn"
                aria-label="Add">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <button class="composer-inline__icon-btn" type="submit" id="homeMicBtn"
                aria-label="Send / Voice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="3" width="6" height="12" rx="3"/>
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
          </svg>
        </button>
      </form>
      <div id="cardSignoffs"></div>
      <div id="cardTrending"></div>
      <div id="cardDigest"></div>
    `;
    renderChiclets();
    renderSignoffs();
    renderTrending();
    renderDigest();
    wireHomeInputs();
  }

  // SVG glyphs
  const SPARK_SVG = `
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
         stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M8 1.5l1.4 3.4 3.4 1.4-3.4 1.4L8 11.1 6.6 7.7 3.2 6.3l3.4-1.4L8 1.5z"/>
      <path d="M12.6 11.2l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4z"/>
    </svg>`;

  function renderChiclets() {
    const host = document.getElementById("homeChiclets");
    host.innerHTML = window.HOME_CHICLETS.map((c) => `
      <button class="chiclet" type="button" data-chiclet="${c.id}">
        <span class="chiclet__spark" aria-hidden="true">${SPARK_SVG}</span>
        <span class="chiclet__label">${escapeHTML(c.label)}</span>
      </button>`).join("");
  }

  function renderSignoffs() {
    const host = document.getElementById("cardSignoffs");
    const rows = window.HOME_SIGNOFFS.slice(0, 2).map((s) => {
      const approved = s.state === "approved";
      const approveLabel = approved ? "Approved" : "Approve";
      return `
        <article class="signoff" data-signoff="${s.id}">
          <div class="signoff__row">
            <span class="signoff__risk signoff__risk--${s.risk}">${s.risk}</span>
            <span class="signoff__agent">${escapeHTML(s.agent)}</span>
            <span class="signoff__deadline">${escapeHTML(s.deadline)}</span>
          </div>
          <p class="signoff__action">${escapeHTML(s.action)}</p>
          <div class="signoff__actions">
            <button class="signoff__btn signoff__btn--approve ${approved ? "is-approved" : ""}"
                    type="button" data-signoff-action="approve" data-signoff-id="${s.id}">
              ${approved ? `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="3"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L20 7"/>
                </svg>` : ""}
              ${escapeHTML(approveLabel)}
            </button>
            <button class="signoff__btn signoff__btn--defer" type="button"
                    data-signoff-action="defer" data-signoff-id="${s.id}">Defer</button>
          </div>
        </article>`;
    }).join("");
    host.innerHTML = `
      <section class="home-card">
        <header class="home-card__head">
          <span class="home-card__eyebrow">Awaiting your approval</span>
          <span class="home-card__time">4 items</span>
        </header>
        ${rows}
        <div class="signoff-foot">
          <button class="signoff-foot__link" type="button" data-action="see-all-approvals">
            See all 4 approvals
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </section>`;
  }

  function renderTrending() {
    const host = document.getElementById("cardTrending");
    const rows = window.HOME_TRENDING.map((t) => `
      <article class="svcwatch svcwatch--${t.tone}">
        <div class="svcwatch__row">
          <span class="svcwatch__dot" aria-hidden="true"></span>
          <div class="svcwatch__body">
            <div class="svcwatch__title">${escapeHTML(t.title)}</div>
            <div class="svcwatch__sub">${escapeHTML(t.sub)}</div>
            <button class="svcwatch__cta" type="button"
                    data-svc-cta="${t.id || ''}" ${t.incident ? 'data-svc-incident="1"' : ''}>
              ${escapeHTML(t.cta)}
            </button>
          </div>
        </div>
      </article>`).join("");
    host.innerHTML = `
      <section class="home-card">
        <header class="home-card__head">
          <span class="home-card__eyebrow">Services to watch · 3</span>
          <span class="home-card__time">live</span>
        </header>
        ${rows}
      </section>`;
  }

  function renderDigest() {
    const host = document.getElementById("cardDigest");
    const ICON = {
      schedule:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
      compliance: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4 10-10"/></svg>`,
      report:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v6h6"/></svg>`,
    };
    const rows = window.HOME_DIGEST.map((d) => `
      <article class="digest">
        <span class="digest__icon" aria-hidden="true">${ICON[d.tone] || ICON.report}</span>
        <div class="digest__body">
          <div class="digest__text">${escapeHTML(d.text)}</div>
          <div class="digest__sub">${escapeHTML(d.sub)}</div>
        </div>
      </article>`).join("");
    host.innerHTML = `
      <section class="home-card">
        <header class="home-card__head">
          <span class="home-card__eyebrow">Worth knowing today</span>
          <span class="home-card__time">quiet</span>
        </header>
        ${rows}
      </section>`;
  }

  function wireHomeInputs() {
    const form  = document.getElementById("composerInline");
    const input = document.getElementById("composerInlineInput");
    const plus  = document.getElementById("homePlusBtn");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      handleChatSubmit(text);
    });
    plus.addEventListener("click", () => {
      toast({ title: "Add", text: "Attach a file, or pick from saved playbooks.", tone: "ok" });
    });
  }

  // Home delegation
  home.addEventListener("click", (e) => {
    const chiclet = e.target.closest("[data-chiclet]");
    if (chiclet) return handleChiclet(chiclet.dataset.chiclet);

    const svc = e.target.closest("[data-svc-cta]");
    if (svc) {
      if (svc.dataset.svcIncident === "1") return runIncident();
      const title = svc.closest(".svcwatch")?.querySelector(".svcwatch__title")?.textContent || "Service";
      toast({ title: `Investigating · ${title}`, text: "DiagnosticsAgent will surface findings shortly.", tone: "ok" });
      return;
    }

    const so = e.target.closest("[data-signoff-action]");
    if (so) {
      const card = so.closest(".signoff");
      if (so.dataset.signoffAction === "approve") {
        const btn = so;
        if (!btn.classList.contains("is-approved")) {
          btn.classList.add("is-approved");
          btn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="3"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7"/>
            </svg>
            Approved`;
          toast({ title: "Approved", text: "Logged to the audit trail.", tone: "ok" });
        }
      } else {
        toast({ title: "Deferred 24h", text: "I'll re-surface this tomorrow.", tone: "ok" });
        if (card) card.style.opacity = ".55";
      }
      return;
    }

    const link = e.target.closest('[data-action="see-all-approvals"]');
    if (link) {
      showChat();
      thread.innerHTML = "";
      jarvisBubbleStream(md(window.CHICLET_CONTEXT.approvals));
    }
  });

  function handleChiclet(id) {
    if (id === "cockpit") {
      // Direct hop to the right pane — that's the whole point.
      rightTab = { id: "cockpit", label: "Cockpit", icon: "doc" };
      renderCockpit();
      showRight();
      return;
    }
    if (id === "incidents")  return runIncident();
    if (id === "add-agent")  return runWizard();
    if (id === "approvals") {
      showChat();
      thread.innerHTML = "";
      jarvisBubbleStream(md(window.CHICLET_CONTEXT.approvals));
      return;
    }
  }

  // Composer / whisper bar router (used by both home + chat composer).
  function handleChatSubmit(text) {
    if (wizardState.pendingText) {
      // Wizard is waiting for a free-text answer — the chat is
      // already the active view in that case.
      if (app.dataset.view !== "chat") showChat();
      userBubble(text);
      const fn = wizardState.pendingText;
      wizardState.pendingText = null;
      fn(text);
      return;
    }

    showChat();
    userBubble(text);

    const lower = text.toLowerCase();
    if (/(p1|incident|card|payment|outage|down|breach)/.test(lower)) {
      setTimeout(runIncident, 350);
      return;
    }
    if (/(add agent|new agent|create agent|spin up|build (an?)?\s*agent)/.test(lower)) {
      setTimeout(runWizard, 350);
      return;
    }
    if (/(cockpit|dashboard|overview)/.test(lower)) {
      setTimeout(() => {
        rightTab = { id: "cockpit", label: "Cockpit", icon: "doc" };
        renderCockpit();
        markRightReady();
        jarvisBubbleStream(md("Cockpit is ready in the right pane — tap the panel button to view it."));
      }, 350);
      return;
    }
    jarvisBubbleStream(md(
      "I can help with that. Try one of these:\n" +
      "**• Open the Cockpit** — say *\"open cockpit\"*\n" +
      "**• Open the live incident** — say *\"open card payments incident\"*\n" +
      "**• Add a new agent** — say *\"add agent\"* and I'll walk you through 4 quick questions."
    ));
  }

  // =================================================================
  // CHAT BUBBLES + STATUS LINES
  // =================================================================
  function userBubble(text) {
    const el = document.createElement("div");
    el.className = "bubble bubble--user";
    el.textContent = text;
    thread.appendChild(el); scrollDown();
    return el;
  }
  function jarvisBubble() {
    const el = document.createElement("div");
    el.className = "bubble bubble--jarvis";
    el.innerHTML = `<span class="bubble__caret"></span>`;
    thread.appendChild(el); scrollDown();
    return el;
  }
  // Status checklist row — green check when settled (image 2 style).
  function statusLine(text) {
    const el = document.createElement("div");
    el.className = "status-line";
    el.innerHTML = `
      <span class="status-line__icon" aria-hidden="true">
        <span class="spinner"></span>
      </span>
      <span class="status-line__label">${escapeHTML(text)}</span>`;
    thread.appendChild(el); scrollDown();
    return el;
  }
  function settleStatus(el, doneText) {
    if (!el) return;
    el.classList.add("is-done");
    el.querySelector(".status-line__icon").innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="3"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12l5 5L20 7"/>
      </svg>`;
    el.querySelector(".status-line__label").textContent = doneText;
  }

  async function streamHTML(bubble, html, token) {
    bubble.innerHTML = "";
    const span  = document.createElement("span");
    const caret = document.createElement("span");
    caret.className = "bubble__caret";
    bubble.appendChild(span);
    bubble.appendChild(caret);

    let i = 0;
    while (i < html.length) {
      if (token !== runToken) return;
      let chunk = "";
      if (html[i] === "<") {
        const close = html.indexOf(">", i);
        if (close !== -1) { chunk = html.slice(i, close + 1); i = close + 1; }
      } else {
        chunk = html[i]; i += 1;
      }
      span.innerHTML += chunk;
      scrollDown();
      if (chunk.length === 1) await sleep(12);
    }
    if (token === runToken) caret.remove();
  }

  function jarvisBubbleStream(html) {
    const bubble = jarvisBubble();
    const token = runToken;
    const done = streamHTML(bubble, html, token);
    return { bubble, done };
  }

  function toast({ title, text, tone = "" }) {
    const el = document.createElement("div");
    el.className = `toast${tone ? ` toast--${tone}` : ""}`;
    el.innerHTML = `
      <div class="toast__title">${escapeHTML(title)}</div>
      ${text ? `<div class="toast__text">${md(text)}</div>` : ""}`;
    el.addEventListener("click", () => el.remove());
    toastStack.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }

  // =================================================================
  // RIGHT PANE — Cockpit canvas
  // =================================================================
  // `prepend` (optional) is an extra agent card to drop at the top
  // of the AI Agents list — used by the Add Agent wizard so the new
  // agent appears immediately when the user swaps to the right pane.
  function renderCockpit({ prepend = null } = {}) {
    const c = window.COCKPIT;
    const agents = prepend ? [prepend, ...c.agents] : c.agents;

    rightPane.innerHTML = `
      <header class="right-head">
        <h1 class="right-head__title">Cockpit</h1>
        <p class="right-head__sub">${escapeHTML(c.agents.length + (prepend ? 1 : 0))} agents · live across Identity, Cost, Reliability and Compliance</p>
      </header>

      <div class="kpi-row">
        ${c.stats.map(kpiHTML).join("")}
      </div>

      <section class="right-section">
        <header class="right-section__head">
          <h2 class="right-section__title">AI Agents</h2>
          <span class="right-section__sub">managing your digital labour</span>
        </header>
        ${agents.map(agentHTML).join("")}
      </section>

      <section class="right-section">
        <header class="right-section__head">
          <h2 class="right-section__title">The Team</h2>
          <span class="right-section__sub">human owners</span>
        </header>
        ${c.team.map(teamHTML).join("")}
      </section>
    `;
  }

  function kpiHTML(s) {
    return `
      <article class="kpi" data-kpi="${s.id}">
        <span class="kpi__label">${escapeHTML(s.label)}</span>
        <span class="kpi__value">${escapeHTML(s.value)}</span>
        <div class="kpi__lines">
          ${s.lines.map((l) => `<span class="kpi__line--${l.tone}">${escapeHTML(l.text)}</span>`).join("")}
        </div>
      </article>`;
  }

  function agentHTML(a) {
    const trustArrow = a.trustTrend === "up"
      ? `<svg class="agent__trend agent__trend--up" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>`
      : `<svg class="agent__trend agent__trend--down" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10l6 6 6-6"/></svg>`;
    const loadPct = Math.round((a.load || 0) * 100);
    const ICON_BOT = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="8" width="16" height="11" rx="3"/>
        <path d="M12 8V4M9 13h.01M15 13h.01M9 17h6"/>
        <path d="M2 14h2M20 14h2"/>
      </svg>`;
    return `
      <article class="agent agent--${a.accent || "blue"}" data-agent="${a.id}">
        <header class="agent__head">
          <span class="agent__icon" aria-hidden="true">${ICON_BOT}</span>
          <span>
            <span class="agent__name">${escapeHTML(a.name)}</span>
            <span class="agent__level">${escapeHTML(a.level)}</span>
          </span>
          <span class="agent__dot" aria-hidden="true"></span>
        </header>
        <p class="agent__body">${escapeHTML(a.summary)}</p>
        <div class="agent__metrics">
          <span class="agent__metric">Trust <strong>${a.trust}%</strong> ${trustArrow}</span>
          <span class="agent__metric">Load <strong>${a.load.toFixed(2)}</strong></span>
        </div>
        <div class="agent__bar"><span style="width:${loadPct}%"></span></div>
      </article>`;
  }

  function teamHTML(t) {
    const initial = (t.name || "?").trim().charAt(0).toUpperCase();
    return `
      <article class="team-row">
        <span class="team-row__avatar" aria-hidden="true">${escapeHTML(initial)}</span>
        <div class="team-row__body">
          <div class="team-row__name">
            ${escapeHTML(t.name)}${t.you ? `<span class="you-pill">YOU</span>` : ""}
          </div>
          <div class="team-row__role">${escapeHTML(t.role)}</div>
        </div>
        <div class="team-row__count">
          <strong>${escapeHTML(String(t.agents))}</strong>
          <span>agents</span>
        </div>
      </article>`;
  }

  // =================================================================
  // STORY 1 — INCIDENT (P1 on card-auth)
  // =================================================================
  function insertIncidentBanner() {
    const inc = window.INCIDENT;
    const el = document.createElement("div");
    el.className = "inc-banner";
    el.innerHTML = `
      <div class="inc-banner__row">
        <span class="inc-banner__sev">${escapeHTML(inc.sev)}</span>
        <span class="inc-banner__id">${escapeHTML(inc.id)}</span>
        <span class="inc-banner__elapsed" id="incElapsed">live</span>
      </div>
      <div class="inc-banner__title">${escapeHTML(inc.title)}</div>
      <p class="inc-banner__sub">${escapeHTML(inc.sub)}</p>
      <div class="inc-banner__meta">
        <span><strong>Service:</strong> ${escapeHTML(inc.service)}</span>
        <span><strong>Affected:</strong> ${escapeHTML(inc.affected)} · ${escapeHTML(inc.region)}</span>
      </div>`;
    thread.appendChild(el); scrollDown();
    return el.querySelector("#incElapsed");
  }

  function appendPhasePill(phase) {
    const el = document.createElement("div");
    el.className = "inc-phase";
    el.innerHTML = `
      <span class="inc-phase__pill" data-phase="${phase.id}">${escapeHTML(phase.label)}</span>
      <span class="inc-phase__caption">${md(phase.caption)}</span>`;
    thread.appendChild(el); scrollDown();
    return el;
  }

  function appendTimelineCard(phase) {
    const card = document.createElement("div");
    card.className = "inc-timeline";
    card.innerHTML = `
      <div class="inc-timeline__head">${escapeHTML(phase.label)} · agent log</div>
      <div class="inc-timeline__rows" id="incRows-${phase.id}"></div>`;
    thread.appendChild(card); scrollDown();
    return card.querySelector(`#incRows-${phase.id}`);
  }

  async function streamPhaseEntries(rowsEl, entries, token) {
    for (const entry of entries) {
      if (token !== runToken) return;
      const row = document.createElement("div");
      row.className = "inc-row";
      row.innerHTML = `
        <div class="inc-row__rail" aria-hidden="true">
          <span class="inc-row__node"></span>
        </div>
        <div class="inc-row__body">
          <div class="inc-row__head">
            <span class="inc-row__time">${escapeHTML(entry.at)}</span>
            <span class="inc-row__agent">${escapeHTML(entry.agent)}</span>
          </div>
          <div class="inc-row__text">${md(entry.text)}</div>
        </div>`;
      rowsEl.appendChild(row);
      scrollDown();
      await sleep(900);
    }
  }

  function awaitApproval(spec) {
    return new Promise((resolve) => {
      const card = document.createElement("div");
      card.className = "approval";
      card.dataset.state = "pending";

      const metaHTML = (spec.meta || []).map((m) =>
        `<li><span>${escapeHTML(m.k)}</span><strong>${escapeHTML(m.v)}</strong></li>`
      ).join("");
      const actionsHTML = (spec.actions || []).map((a) => `
        <button class="approval__btn approval__btn--${a.kind}" type="button" data-approval-action="${a.id}">
          ${escapeHTML(a.label)}
        </button>`).join("");

      card.innerHTML = `
        <header class="approval__head">
          <span class="approval__dot" aria-hidden="true"></span>
          <span class="approval__eyebrow">${escapeHTML(spec.eyebrow)}</span>
        </header>
        <div class="approval__title">${escapeHTML(spec.title)}</div>
        <p class="approval__summary">${md(spec.summary)}</p>
        <ul class="approval__meta">${metaHTML}</ul>
        <div class="approval__actions">${actionsHTML}</div>`;

      card.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-approval-action]");
        if (!btn || card.dataset.state === "answered") return;
        const id = btn.dataset.approvalAction;
        card.dataset.state = "answered";
        const labelMap = { approve: "Approve mitigation", defer: "Defer 30 min", info: "Request more info" };
        userBubble(labelMap[id] || id);
        if (spec.replies && spec.replies[id]) {
          jarvisBubbleStream(md(spec.replies[id]));
        }
        resolve(id);
      });
      thread.appendChild(card); scrollDown();
    });
  }

  function appendSummaryCard() {
    const inc = window.INCIDENT;
    const el = document.createElement("div");
    el.className = "summary";
    el.innerHTML = `
      <div class="summary__head">
        <span class="summary__check" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="3"
               stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
        </span>
        <span class="summary__eyebrow">Incident resolved</span>
      </div>
      <div class="summary__title">Card payments back to baseline</div>
      <p class="summary__lead">${md(inc.rootCause)} ${md(inc.mitigation)}</p>
      <ul class="summary__meta">
        <li><span>Time to detect</span><strong>0m 02s</strong></li>
        <li><span>Time to resolve</span><strong>0m 42s</strong></li>
        <li><span>Approved by</span><strong>${escapeHTML(window.PERSONA.full)}</strong></li>
        <li><span>Change record</span><strong>CHG-44102</strong></li>
      </ul>
      <div class="summary__actions">
        <button class="summary__btn summary__btn--primary" type="button" data-summary-action="share">
          Share post-incident summary in #ops-incidents
        </button>
        <button class="summary__btn" type="button" data-summary-action="lens">Open in Lens</button>
        <button class="summary__btn" type="button" data-summary-action="download">Download PDF</button>
      </div>`;
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-summary-action]");
      if (!btn) return;
      const id = btn.dataset.summaryAction;
      if (id === "share")   toast({ title: "Shared", text: "Summary posted to #ops-incidents.", tone: "ok" });
      if (id === "lens")    toast({ title: "Lens", text: "Opening the incident inside Lens.", tone: "ok" });
      if (id === "download")toast({ title: "Downloaded", text: "INC-2026-0514-001-summary.pdf saved.", tone: "ok" });
    });
    thread.appendChild(el); scrollDown();
  }

  async function runIncident() {
    const token = ++runToken;
    wizardState.active = false;
    wizardState.pendingText = null;
    thread.innerHTML = "";
    showChat();

    // While Jarvis is producing the live incident dashboard,
    // pulse the right-panel switcher.
    setGenerating(true);

    const elapsedEl = insertIncidentBanner();
    const start = Date.now();
    const elapsedTimer = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      elapsedEl.textContent = `live · ${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
    }, 1000);

    // Update the right-pane to a "live incident" view (we re-use the
    // Cockpit but bump the Incidents KPI Major count).
    const liveCockpit = JSON.parse(JSON.stringify(window.COCKPIT));
    const incKpi = liveCockpit.stats.find((s) => s.id === "incidents");
    if (incKpi) {
      incKpi.value = "1";
      incKpi.label = "Live · P1 incident";
      incKpi.lines = [
        { tone: "bad",  text: "card-auth · 8.7% errors" },
        { tone: "warn", text: "RemediationAgent on it" },
      ];
    }
    rightTab = { id: "incident", label: "P1 · card-auth", icon: "doc" };
    // Replace cockpit data temporarily for this run
    const _origCockpit = window.COCKPIT;
    window.COCKPIT = liveCockpit;
    renderCockpit();
    window.COCKPIT = _origCockpit;

    try {
      let approvalGiven = false;
      for (const phase of window.INC_PHASES) {
        if (token !== runToken) return;
        if (phase.requiresApproval && !approvalGiven) continue;

        appendPhasePill(phase);
        await jarvisBubbleStream(md(phase.narration)).done;

        const rowsEl = appendTimelineCard(phase);
        await streamPhaseEntries(rowsEl, phase.entries, token);

        if (phase.gate && phase.approval) {
          let choice;
          while ((choice = await awaitApproval(phase.approval)) !== "approve") {
            if (choice === "defer") { await sleep(900); continue; }
            if (choice === "info") {
              await sleep(1100);
              await jarvisBubbleStream(md(
                "Here's the deeper read: **2,340 failed-auth traces** in the last 4 hours, " +
                "**98% on v3.7.1**, **0% on v3.7.0**. Visa specifically — Mastercard is unaffected. " +
                "I'll re-prompt the approval below."
              )).done;
              continue;
            }
          }
          approvalGiven = true;
          await sleep(900);
          continue;
        }

        if (phase.final) {
          appendSummaryCard();
          clearInterval(elapsedTimer);
          elapsedEl.textContent = "resolved · 42s";
          elapsedEl.classList.add("is-resolved");
          const pills = thread.querySelectorAll(".inc-phase__pill");
          if (pills.length) pills[pills.length - 1].dataset.phase = "resolved";
        }

        await sleep(700);
      }
      // Story done — switch the right pane back to a clean Cockpit
      // and let the switcher chime once more so John can swap.
      rightTab = { id: "cockpit", label: "Cockpit", icon: "doc" };
      renderCockpit();
      markRightReady();
    } finally {
      clearInterval(elapsedTimer);
    }
  }

  // =================================================================
  // STORY 2 — ADD AGENT WIZARD
  // =================================================================
  function chipRow(chips, ariaLabel) {
    const wrap = document.createElement("div");
    wrap.className = "wiz-chips";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", ariaLabel);
    wrap.innerHTML = chips;
    thread.appendChild(wrap); scrollDown();
    return wrap;
  }

  function chipHTML(value, label, { selected = false } = {}) {
    return `
      <button class="wiz-chip${selected ? " wiz-chip--selected" : ""}"
              type="button" data-wiz-chip="${value}">
        ${escapeHTML(label)}
      </button>`;
  }

  function wizPreview(slots) {
    const domainLabel = window.AGENT_DOMAINS.find((d) => d.id === slots.domain)?.label || "Reliability";
    const card = document.createElement("article");
    card.className = "wiz-preview";
    card.dataset.state = "pending";
    card.innerHTML = `
      <header class="wiz-preview__head">
        <span class="wiz-preview__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.6"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="8" width="16" height="11" rx="3"/>
            <path d="M12 8V4M9 13h.01M15 13h.01M9 17h6"/>
          </svg>
        </span>
        <div class="wiz-preview__title">
          <span class="wiz-preview__name">${escapeHTML(slots.name)}</span>
          <span class="wiz-preview__level">${escapeHTML(slots.level)} autonomy</span>
        </div>
        <span class="wiz-preview__badge">NEW</span>
      </header>
      <p class="wiz-preview__body">${escapeHTML(slots.jtbd)}</p>
      <div class="wiz-preview__foot">
        <span>Domain <strong>${escapeHTML(domainLabel)}</strong></span>
        <span>Trust <strong>88%</strong></span>
      </div>
      <div class="wiz-preview__actions">
        <button class="wiz-preview__btn" type="button" data-wiz-confirm="cancel">Cancel</button>
        <button class="wiz-preview__btn wiz-preview__btn--primary" type="button" data-wiz-confirm="create">Create agent</button>
      </div>`;
    thread.appendChild(card); scrollDown();
    return card;
  }

  async function runEvals(name, token) {
    await jarvisBubbleStream(md(
      `Running pre-flight evals before deploying **${name}**. ` +
      `These are the same gates the desktop wizard uses — intent, ontology, scopes, guardrails, audit, trust.`
    )).done;

    const list = document.createElement("ul");
    list.className = "wiz-evals";
    thread.appendChild(list); scrollDown();

    for (const step of window.AGENT_EVALS) {
      if (token !== runToken) return;
      const li = document.createElement("li");
      li.className = "wiz-eval is-busy";
      li.innerHTML = `
        <span class="wiz-eval__icon"><span class="spinner"></span></span>
        <span class="wiz-eval__label">${escapeHTML(step.busy)}…</span>`;
      list.appendChild(li);
      scrollDown();
      await sleep(900);
      li.classList.remove("is-busy");
      li.classList.add("is-ok");
      li.querySelector(".wiz-eval__icon").innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="3"
             stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>`;
      li.querySelector(".wiz-eval__label").textContent = step.done;
    }
  }

  async function runWizard() {
    const token = ++runToken;
    wizardState.active = true;
    wizardState.slots = { jtbd: "", domain: "", name: "", level: "L2" };
    thread.innerHTML = "";
    showChat();
    // Pre-prime a Cockpit canvas behind the scenes.
    renderCockpit();
    rightTab = { id: "cockpit", label: "Cockpit", icon: "doc" };
    renderBottombar();

    const input = document.getElementById("chatInput");
    if (input) input.focus();

    // Q1 — JTBD (free text from the composer)
    await jarvisBubbleStream(md(
      "Let's build you an agent. In one sentence — **what should it do**? " +
      "e.g. *\"onboard new hires in Salesforce — provision access on day one and notify their manager\"*."
    )).done;

    const jtbd = await new Promise((resolve) => { wizardState.pendingText = resolve; });
    if (token !== runToken) return;
    wizardState.pendingText = null;
    wizardState.slots.jtbd   = jtbd;
    wizardState.slots.domain = window.inferDomain(jtbd);
    wizardState.slots.name   = window.suggestName(jtbd);

    // Q2 — Domain chips
    const inferredLabel = window.AGENT_DOMAINS.find((d) => d.id === wizardState.slots.domain)?.label || "Reliability";
    await jarvisBubbleStream(md(
      `Sounds like a **${inferredLabel}** agent. Right domain?`
    )).done;
    const domainChips = window.AGENT_DOMAINS.map((d) =>
      chipHTML(`domain:${d.id}`, d.label, { selected: d.id === wizardState.slots.domain })
    ).join("");
    const domainRow = chipRow(domainChips, "Pick a domain");
    const domainPick = await new Promise((resolve) => {
      domainRow.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-wiz-chip]");
        if (!btn || domainRow.classList.contains("is-locked")) return;
        const id = btn.dataset.wizChip.replace("domain:", "");
        domainRow.classList.add("is-locked");
        domainRow.querySelectorAll(".wiz-chip").forEach((c) => c.classList.remove("wiz-chip--selected"));
        btn.classList.add("wiz-chip--selected");
        userBubble(window.AGENT_DOMAINS.find((d) => d.id === id)?.label || id);
        resolve(id);
      });
    });
    if (token !== runToken) return;
    wizardState.slots.domain = domainPick;

    // Q3 — Name
    await jarvisBubbleStream(md(
      `What should I call it? I suggest **${wizardState.slots.name}**.`
    )).done;
    const nameChips =
      chipHTML("name:use-suggestion", `Use "${wizardState.slots.name}"`, { selected: true }) +
      chipHTML("name:type", "Type my own");
    const nameRow = chipRow(nameChips, "Name choice");
    const nameChoice = await new Promise((resolve) => {
      nameRow.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-wiz-chip]");
        if (!btn || nameRow.classList.contains("is-locked")) return;
        nameRow.classList.add("is-locked");
        const id = btn.dataset.wizChip.replace("name:", "");
        userBubble(id === "use-suggestion" ? `Use "${wizardState.slots.name}"` : "Type my own");
        resolve(id);
      });
    });
    if (token !== runToken) return;
    if (nameChoice === "type") {
      await jarvisBubbleStream(md(
        "Sure — **what should I call it**? Type the name in the whisper bar."
      )).done;
      const typed = await new Promise((resolve) => { wizardState.pendingText = resolve; });
      wizardState.pendingText = null;
      wizardState.slots.name = (typed || "").replace(/\s+/g, "").slice(0, 40) || wizardState.slots.name;
    }

    // Q4 — Level
    const levelLines = window.AGENT_LEVELS.map((l) =>
      `<li><strong>${l.id}</strong> — ${escapeHTML(l.blurb)}${l.id === "L2" ? " <em>(recommended)</em>" : ""}</li>`
    ).join("");
    await jarvisBubbleStream(`<div>How much autonomy should it have?</div><ul class="wiz-levels">${levelLines}</ul>`).done;
    const levelChips = window.AGENT_LEVELS.map((l) =>
      chipHTML(`level:${l.id}`, l.id, { selected: l.id === "L2" })
    ).join("");
    const levelRow = chipRow(levelChips, "Pick an autonomy level");
    const levelPick = await new Promise((resolve) => {
      levelRow.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-wiz-chip]");
        if (!btn || levelRow.classList.contains("is-locked")) return;
        levelRow.classList.add("is-locked");
        const id = btn.dataset.wizChip.replace("level:", "");
        levelRow.querySelectorAll(".wiz-chip").forEach((c) => c.classList.remove("wiz-chip--selected"));
        btn.classList.add("wiz-chip--selected");
        userBubble(id);
        resolve(id);
      });
    });
    if (token !== runToken) return;
    wizardState.slots.level = levelPick;

    // Preview
    await jarvisBubbleStream(md("Here's what I'll create — review and confirm.")).done;
    const card = wizPreview(wizardState.slots);
    const confirm = await new Promise((resolve) => {
      card.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-wiz-confirm]");
        if (!btn || card.dataset.state === "answered") return;
        card.dataset.state = "answered";
        const id = btn.dataset.wizConfirm;
        userBubble(id === "create" ? "Create agent" : "Cancel");
        resolve(id);
      });
    });
    if (token !== runToken) return;

    if (confirm === "cancel") {
      await jarvisBubbleStream(md(
        "Cancelled. Nothing was created — you can restart the wizard from the home screen anytime."
      )).done;
      wizardState.active = false;
      return;
    }

    // *** GENERATING UI for the right panel ***
    setGenerating(true);
    await runEvals(wizardState.slots.name, token);

    if (token !== runToken) return;

    // Drop the new agent into the Cockpit so it's visible the moment
    // the user swaps to the right pane.
    const slots = wizardState.slots;
    const newAgent = {
      id: `wizard-${Date.now()}`,
      name: slots.name,
      level: slots.level,
      summary: slots.jtbd,
      trust: 88, trustTrend: "up",
      load: 0.18, accent: "blue",
    };
    rightTab = { id: "cockpit", label: "Cockpit", icon: "doc" };
    renderCockpit({ prepend: newAgent });

    await sleep(400);
    await jarvisBubbleStream(md(
      `**${slots.name} is live**. Cockpit slot taken, audit trail wired, trust calibrated. ` +
      `Tap the right-panel button to see it in your Cockpit.`
    )).done;

    // Done generating — invite the tap.
    markRightReady();
    toast({
      title: `${slots.name} ready in Cockpit`,
      text: `Tap the right-panel button to view it.`,
      tone: "ok",
    });
    wizardState.active = false;
  }

  // =================================================================
  // INITIAL PAINT
  // =================================================================
  stampPersona();
  renderDrawerItems();
  renderHome();
  renderCockpit();      // pre-render so it's ready instantly
  showHome();
})();
