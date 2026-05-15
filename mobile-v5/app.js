/* =================================================================
   app.js — Mobile v5 story engine
   -----------------------------------------------------------------
   Single-page mobile app with two views (home / chat) and a linear
   story driven by data/priya.js. The engine mirrors demo-v5/app.js
   patterns (status lines, streaming Jarvis text, approval card,
   choice list, task-list grid with row stagger) but is trimmed to
   the mobile UI (no sidenav, no multi-pane workspace).

   Public functions hung on `window` so they can be called from inline
   handlers when needed: __runStory(prompt), __resetToHome().
   ================================================================= */
(function () {
  "use strict";

  // ---------------------------------------------------- DOM refs
  const $app          = document.getElementById("app");
  const $homeBody     = document.getElementById("homeBody");
  const $chiclets     = document.getElementById("chiclets");
  const $signoffs     = document.getElementById("signoffsList");
  const $trending     = document.getElementById("trendingList");
  const $digest       = document.getElementById("digestList");
  const $thread       = document.getElementById("thread");
  const $composer     = document.getElementById("composer");
  const $composerIn   = document.getElementById("composerInput");
  const $composerSend = document.getElementById("composerSend");
  const $appbarBack   = document.getElementById("backBtn");
  const $appbar       = document.getElementById("appbar");
  const $appbarTitle  = document.getElementById("appbarTitle");
  const $appbarSub    = document.getElementById("appbarSub");
  const $statusTime   = document.getElementById("statusBarTime");
  const $greetEyebrow = document.getElementById("greetEyebrow");
  const $greetName    = document.getElementById("greetName");
  const $greetLead    = document.getElementById("greetLead");

  // Story state — re-initialised whenever __resetToHome() is called.
  let story = null;          // active beats array
  let storyIdx = 0;          // current beat
  let runToken = 0;          // bumped on reset to cancel in-flight timers
  let storyRunning = false;  // guard against re-entry

  // ------------------------------------------------ tiny helpers
  const esc = (v) =>
    String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // Lightweight markdown — just **bold** for now (matches v5 dialogue).
  // We render newlines as <br> too so the engine can keep "\n\n" in copy.
  function md(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Cancellable wait — resolves to false if the runToken changed.
  async function waitToken(ms, token) {
    await wait(ms);
    return token === runToken;
  }

  function scrollThreadToEnd() {
    // Defer one frame so the freshly-appended node is laid out.
    requestAnimationFrame(() => {
      $thread.scrollTop = $thread.scrollHeight;
    });
  }

  // ------------------------------------------------ status bar clock
  function updateClock() {
    const d = new Date();
    let h = d.getHours();
    const m = d.getMinutes();
    h = h % 12; if (h === 0) h = 12;
    $statusTime.textContent = h + ":" + String(m).padStart(2, "0");
  }
  updateClock();
  setInterval(updateClock, 30 * 1000);

  // =================================================================
  // HOME VIEW — render greeting, chiclets, and the 3 cards
  // =================================================================
  function renderHome() {
    if (window.PERSONA) {
      const av = $appbar.querySelector(".appbar__avatar");
      if (av) av.textContent = window.PERSONA.initial || "P";
    }
    const g = window.HOME_GREETING || {};
    if ($greetEyebrow) $greetEyebrow.textContent = g.eyebrow || "Welcome,";
    if ($greetName)    $greetName.textContent    = g.name    || "Priya!";
    if ($greetLead)    $greetLead.textContent    = g.lead    || "";

    renderChiclets();
    renderSignoffs();
    renderTrending();
    renderDigest();
  }

  // Paired SVG glyphs for each chiclet — purely decorative, but they
  // make the chiclet grid feel more like an iOS home page.
  const CHICLET_ICON = {
    onboard: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5.5" r="2.6"/><path d="M2.5 13.5c.6-2.6 2.7-4.2 5.5-4.2s4.9 1.6 5.5 4.2"/><path d="M11.5 2.5v3M10 4h3"/></svg>`,
    approvals: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h10v8.2a.8.8 0 0 1-.8.8H3.8a.8.8 0 0 1-.8-.8V4.5Z"/><path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5"/><path d="m6 9.4 1.6 1.6L11 7.6"/></svg>`,
    joiners: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5.5" r="2.2"/><path d="M2 13c.6-2.2 2.2-3.5 4-3.5s3.4 1.3 4 3.5"/><circle cx="11.6" cy="6" r="1.6"/><path d="M9.6 13c.4-1.6 1.6-2.6 2.8-2.6s2 .9 2.4 2.4"/></svg>`,
    policy: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2.5h6.2l2.3 2.3v8.7a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z"/><path d="M6 7.5h5M6 10h5M6 5h2.5"/></svg>`,
  };

  function renderChiclets() {
    const list = window.HOME_CHICLETS || [];
    $chiclets.innerHTML = list.map((c) => `
      <button class="chiclet" type="button"
              role="listitem"
              data-chiclet-id="${esc(c.id)}">
        <span class="chiclet__icon" aria-hidden="true">
          ${CHICLET_ICON[c.id] || CHICLET_ICON.onboard}
        </span>
        <span class="chiclet__label">${esc(c.label)}</span>
        ${c.badge ? `<span class="chiclet__badge">${esc(c.badge)}</span>` : ""}
      </button>
    `).join("");
  }

  function renderSignoffs() {
    const list = (window.HOME_SIGNOFFS || []).slice(0, 2);
    $signoffs.innerHTML = list.map((s) => `
      <article class="signoff">
        <div class="signoff__row">
          <span class="signoff__risk signoff__risk--${esc(s.risk)}">${esc(s.risk)}</span>
          <span class="signoff__agent">${esc(s.agent)}</span>
          <span class="signoff__deadline">${esc(s.deadline)}</span>
        </div>
        <p class="signoff__action">${esc(s.action)}</p>
        <div class="signoff__actions">
          <button class="signoff__btn signoff__btn--approve" type="button" data-home-action="approve">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                 stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 8.5l3.2 3.2L13 5"/>
            </svg>
            Approve
          </button>
          <button class="signoff__btn signoff__btn--defer" type="button" data-home-action="defer">
            Defer
          </button>
        </div>
      </article>
    `).join("");
  }

  function renderTrending() {
    const list = (window.HOME_TRENDING || []).slice(0, 2);
    $trending.innerHTML = list.map((t) => `
      <article class="trend trend--${esc(t.tone)}">
        <span class="trend__dot" aria-hidden="true"></span>
        <div class="trend__body">
          <div class="trend__title">${esc(t.title)}</div>
          <div class="trend__sub">${esc(t.sub)}</div>
        </div>
      </article>
    `).join("");
  }

  // Tiny one-glyph dictionary for digest tones.
  const DIGEST_ICON = {
    schedule:   `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11"/><path d="M5.5 2v3M10.5 2v3"/></svg>`,
    compliance: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.7 13.5 4v4.4c0 3.2-2.3 5.5-5.5 6-3.2-.5-5.5-2.8-5.5-6V4L8 1.7Z"/><path d="m6 8.4 1.5 1.5L10.5 7"/></svg>`,
    report:     `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 13V3.5a1 1 0 0 1 1-1h6.7L13.5 5.7V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1Z"/><path d="M5.5 9.5h5M5.5 11.5h5M5.5 7.5h2"/></svg>`,
  };

  function renderDigest() {
    const list = (window.HOME_DIGEST || []).slice(0, 2);
    $digest.innerHTML = list.map((d) => `
      <article class="digest">
        <span class="digest__icon" aria-hidden="true">${DIGEST_ICON[d.tone] || DIGEST_ICON.schedule}</span>
        <div class="digest__body">
          <div class="digest__text">${esc(d.text)}</div>
          <div class="digest__sub">${esc(d.sub)}</div>
        </div>
      </article>
    `).join("");
  }

  // =================================================================
  // VIEW SWITCHING — slide between home and chat
  // =================================================================
  function showHome() {
    $app.setAttribute("data-view", "home");
    $appbar.classList.remove("has-back");
    $appbarTitle.textContent = "Jarvis";
    $appbarSub.textContent   = "Agentic HR Operations";
    $composerIn.placeholder  = "Ask Jarvis anything…";
    $composerIn.value = "";
    syncSendButton();
  }
  function showChat() {
    $app.setAttribute("data-view", "chat");
    $appbar.classList.add("has-back");
    $appbarTitle.textContent = "Onboarding Day";
    $appbarSub.textContent   = "Jarvis · with " + (window.PERSONA && window.PERSONA.name || "Priya");
    $composerIn.placeholder  = "Reply to Jarvis…";
  }

  // =================================================================
  // CHAT BUBBLES + STATUS LINES
  // =================================================================
  function userBubble(text) {
    const el = document.createElement("div");
    el.className = "bubble bubble--user";
    el.innerHTML = md(text);
    $thread.appendChild(el);
    scrollThreadToEnd();
    return el;
  }

  // Empty Jarvis bubble — caller fills it (typically via streamText).
  function jarvisBubble() {
    const el = document.createElement("div");
    el.className = "bubble bubble--jarvis";
    el.innerHTML = "";
    $thread.appendChild(el);
    scrollThreadToEnd();
    return el;
  }

  // Append a status line that animates from "in progress" (pulsing dot
  // + italic text) to "done" (steady green dot, normal text). Returns
  // the element so the caller can flip it later.
  function statusLine(text) {
    const el = document.createElement("div");
    el.className = "status-line";
    el.innerHTML = `
      <span class="status-line__dot" aria-hidden="true"></span>
      <span class="status-line__text"></span>
    `;
    el.querySelector(".status-line__text").textContent = text;
    $thread.appendChild(el);
    scrollThreadToEnd();
    return el;
  }
  function settleStatus(el, doneText) {
    if (!el) return;
    el.classList.add("is-done");
    el.querySelector(".status-line__text").textContent = doneText;
  }

  // Stream text into a bubble at ~55 characters per second. The bubble
  // ends with a blinking caret; once the stream completes, the caret is
  // removed. Markdown (**bold**) is preserved by re-rendering the
  // truncated source on every tick (cheap for short Jarvis bubbles).
  async function streamText(bubble, source, token) {
    const cps = 55;
    const tickMs = 1000 / cps;
    const total = source.length;
    let i = 0;
    bubble.innerHTML = `<span class="stream-body"></span><span class="bubble__caret" aria-hidden="true"></span>`;
    const body = bubble.querySelector(".stream-body");
    while (i <= total) {
      if (token !== runToken) return false;
      body.innerHTML = md(source.slice(0, i));
      scrollThreadToEnd();
      i += 2;  // 2 chars per tick keeps things lively without feeling fake
      await wait(tickMs * 2);
    }
    body.innerHTML = md(source);
    bubble.querySelector(".bubble__caret")?.remove();
    return true;
  }

  // =================================================================
  // APPROVAL CARD — special bubble with eyebrow / items / total /
  // rationale / 3 CTAs.
  // =================================================================
  function approvalCard(beat) {
    const el = document.createElement("article");
    el.className = "approval";
    el.setAttribute("data-state", "open");
    el.innerHTML = `
      <header class="approval__head">
        <span class="approval__dot" aria-hidden="true"></span>
        <span class="approval__eyebrow">${md(beat.eyebrow)}</span>
      </header>
      <h3 class="approval__title">${md(beat.title)}</h3>
      <p class="approval__summary">${md(beat.summary)}</p>
      <ul class="approval__items">
        ${beat.items.map((it) => `
          <li class="approval__item">
            <span class="approval__item-label">${md(it.label)}</span>
            <span class="approval__item-spec">${md(it.spec)}</span>
            <span class="approval__item-cost">${md(it.cost)}</span>
          </li>
        `).join("")}
      </ul>
      <div class="approval__total-row">
        <span class="approval__total-label">Total</span>
        <span class="approval__total-cost">${md(beat.total)}</span>
      </div>
      <p class="approval__rationale">${md(beat.rationale)}</p>
      <div class="approval__actions">
        ${beat.actions.map((a) => `
          <button type="button"
                  class="approval__btn approval__btn--${esc(a.kind)}"
                  data-action-id="${esc(a.id)}"
                  data-action-goto="${esc(a.goto)}"
                  data-action-label="${esc(a.label)}"
                  data-action-user="${esc(a.userText || a.label)}">
            ${md(a.label)}
          </button>
        `).join("")}
      </div>
    `;
    $thread.appendChild(el);
    scrollThreadToEnd();
    return el;
  }

  // =================================================================
  // CHOICE LIST — for the "How would you like to proceed?" follow-up.
  // =================================================================
  function choiceList(beat) {
    const el = document.createElement("div");
    el.className = "choices";
    el.innerHTML = beat.choices.map((c) => `
      <button type="button" class="choice"
              data-choice-goto="${esc(c.goto)}"
              data-choice-label="${esc(c.label)}">
        <span>${md(c.label)}</span>
        <svg class="choice__chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m5 3 4 4-4 4"/>
        </svg>
      </button>
    `).join("");
    $thread.appendChild(el);
    scrollThreadToEnd();
    return el;
  }

  // =================================================================
  // TASK LIST — orchestrator fan-out grid with row stagger and
  // per-row Queued -> final pill cross-fade.
  // =================================================================
  async function taskList(beat, token) {
    const el = document.createElement("div");
    el.className = "tasklist";
    el.innerHTML = `
      <header class="tasklist__head">
        <span class="tasklist__dot" aria-hidden="true"></span>
        <span class="tasklist__eyebrow">${md(beat.eyebrow)}</span>
      </header>
      <div class="tasklist__rows" id="tasklistRows"></div>
      <div class="tasklist__footnote" hidden>${md(beat.footnote || "")}</div>
    `;
    $thread.appendChild(el);
    const $rows = el.querySelector("#tasklistRows");
    const $foot = el.querySelector(".tasklist__footnote");
    scrollThreadToEnd();

    const stagger = beat.stagger || 220;
    const settle  = beat.settle  || 360;

    for (let i = 0; i < beat.rows.length; i++) {
      if (token !== runToken) return false;
      const r = beat.rows[i];
      const finalLabel = r.final || (
        r.status === "done"    ? "Done" :
        r.status === "ordered" ? "Ordered" :
        r.status === "pending" ? "Pending" : "Done"
      );
      const row = document.createElement("article");
      row.className = "tasklist__row";
      row.innerHTML = `
        <div>
          <div class="tasklist__row-task">${md(r.task)}</div>
          <div class="tasklist__row-agent">${md(r.agent)}</div>
          ${r.sub ? `<div class="tasklist__row-sub">${md(r.sub)}</div>` : ""}
        </div>
        <span class="tasklist__pill tasklist__pill--${esc(r.status)}" data-state="queued">
          <span class="pill-queued">Queued</span>
          <span class="pill-final">${md(finalLabel)}</span>
        </span>
      `;
      $rows.appendChild(row);
      // Mount + reveal
      requestAnimationFrame(() => row.classList.add("is-in"));
      scrollThreadToEnd();

      // After the row settles, swap the pill from Queued -> final.
      setTimeout(() => {
        const pill = row.querySelector(".tasklist__pill");
        if (pill) pill.setAttribute("data-state", "settled");
      }, settle);

      const ok = await waitToken(stagger, token);
      if (!ok) return false;
    }

    // Wait one more settle so the last pill swap is visible before
    // the footnote drops in.
    await waitToken(settle, token);
    if ($foot) {
      $foot.hidden = false;
      scrollThreadToEnd();
    }
    return true;
  }

  // =================================================================
  // STORY ENGINE — runs through STORY.beats sequentially, supporting
  // status / say / approval-card / ask / task-list / goto / end beats.
  // =================================================================
  function findBeatIndex(id) {
    if (!id || !story) return -1;
    return story.findIndex((b) => b.id === id);
  }

  async function runStory() {
    if (storyRunning) return;
    storyRunning = true;
    const myToken = runToken;

    while (storyIdx < story.length) {
      if (myToken !== runToken) { storyRunning = false; return; }
      const beat = story[storyIdx];

      if (beat.type === "end") {
        // chapter done — leave the composer live for follow-ups
        storyIdx += 1; break;
      }

      if (beat.type === "goto") {
        const next = findBeatIndex(beat.to);
        storyIdx = next >= 0 ? next : story.length;
        continue;
      }

      if (beat.type === "status") {
        const line = statusLine(beat.text);
        const ok = await waitToken(beat.duration || 1200, myToken);
        if (!ok) { storyRunning = false; return; }
        settleStatus(line, beat.doneText);
        storyIdx += 1;
        continue;
      }

      if (beat.type === "say") {
        const bubble = jarvisBubble();
        const ok = await streamText(bubble, beat.text, myToken);
        if (!ok) { storyRunning = false; return; }
        if (beat.pause) {
          const ok2 = await waitToken(beat.pause, myToken);
          if (!ok2) { storyRunning = false; return; }
        }
        storyIdx += 1;
        continue;
      }

      if (beat.type === "approval-card") {
        const card = approvalCard(beat);
        // Pause story until the user picks an action — handler below
        // resolves this promise via __approvalResolve.
        const choice = await new Promise((resolve) => {
          window.__approvalResolve = (data) => {
            window.__approvalResolve = null;
            resolve(data);
          };
        });
        if (myToken !== runToken) { storyRunning = false; return; }

        // Lock the card down so the user can't pick again.
        card.setAttribute("data-state", "answered");

        // Echo the user's choice as a user-side bubble (use action.userText
        // if provided — e.g. "Why does this exceed the budget?" for Ask).
        userBubble(choice.userText || choice.label);

        // Brief breathing room so the chat doesn't stutter.
        await wait(150);
        if (myToken !== runToken) { storyRunning = false; return; }

        const next = findBeatIndex(choice.goto);
        storyIdx = next >= 0 ? next : storyIdx + 1;
        continue;
      }

      if (beat.type === "ask") {
        const askBubble = jarvisBubble();
        const ok = await streamText(askBubble, beat.text, myToken);
        if (!ok) { storyRunning = false; return; }

        const list = choiceList(beat);
        const choice = await new Promise((resolve) => {
          window.__choiceResolve = (data) => {
            window.__choiceResolve = null;
            resolve(data);
          };
        });
        if (myToken !== runToken) { storyRunning = false; return; }
        list.classList.add("is-locked");
        userBubble(choice.label);
        await wait(150);
        if (myToken !== runToken) { storyRunning = false; return; }

        const next = findBeatIndex(choice.goto);
        storyIdx = next >= 0 ? next : storyIdx + 1;
        continue;
      }

      if (beat.type === "task-list") {
        const ok = await taskList(beat, myToken);
        if (!ok) { storyRunning = false; return; }
        storyIdx += 1;
        continue;
      }

      // Unknown beat — skip.
      storyIdx += 1;
    }

    storyRunning = false;
  }

  // ----------------------------------------------------------------
  // Click delegation for in-thread interactive elements.
  // ----------------------------------------------------------------
  $thread.addEventListener("click", (e) => {
    const approvalBtn = e.target.closest(".approval__btn");
    if (approvalBtn && window.__approvalResolve) {
      window.__approvalResolve({
        id:       approvalBtn.dataset.actionId,
        label:    approvalBtn.dataset.actionLabel,
        goto:     approvalBtn.dataset.actionGoto,
        userText: approvalBtn.dataset.actionUser,
      });
      return;
    }
    const choiceBtn = e.target.closest(".choice");
    if (choiceBtn && window.__choiceResolve) {
      window.__choiceResolve({
        label: choiceBtn.dataset.choiceLabel,
        goto:  choiceBtn.dataset.choiceGoto,
      });
      return;
    }
  });

  // =================================================================
  // KICKOFF — start the story from a chiclet tap or the composer.
  // =================================================================
  function kickStory(prompt, opts = {}) {
    runToken += 1;
    storyRunning = false;
    storyIdx = 0;
    story = (window.STORY && window.STORY.beats) ? window.STORY.beats.slice() : [];
    $thread.innerHTML = "";
    showChat();

    // First message: the user's prompt as a user-side bubble.
    userBubble(prompt);

    // Second message: the chiclet context line as Jarvis (matches
    // demo-v5's CHICLET_CONTEXT.onboard). Streamed for a beat of life.
    setTimeout(async () => {
      const myToken = runToken;
      const ctxBubble = jarvisBubble();
      const ok = await streamText(ctxBubble, window.CHICLET_CONTEXT || "On it.", myToken);
      if (!ok) return;
      await waitToken(220, myToken);
      runStory();
    }, 280);
  }

  // ----------------------------------------------------------------
  // CHICLETS — tapping fires the prompt for that chiclet.
  // ----------------------------------------------------------------
  $chiclets.addEventListener("click", (e) => {
    const btn = e.target.closest(".chiclet");
    if (!btn) return;
    const id = btn.dataset.chicletId;
    const chiclet = (window.HOME_CHICLETS || []).find((c) => c.id === id);
    if (!chiclet) return;
    kickStory(chiclet.prompt);
  });

  // "See more" / "See all" footers in the home cards reuse the
  // same chiclet jump path.
  $homeBody.addEventListener("click", (e) => {
    const more = e.target.closest("[data-chiclet-jump]");
    if (more) {
      const id = more.dataset.chicletJump;
      const chiclet = (window.HOME_CHICLETS || []).find((c) => c.id === id);
      if (chiclet) kickStory(chiclet.prompt);
    }
  });

  // ----------------------------------------------------------------
  // COMPOSER — typing + send + return to home.
  // ----------------------------------------------------------------
  function syncSendButton() {
    $composerSend.disabled = !$composerIn.value.trim();
  }
  $composerIn.addEventListener("input", syncSendButton);
  $composer.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $composerIn.value.trim();
    if (!text) return;
    $composerIn.value = "";
    syncSendButton();
    // If we're still on home, treat any send as the Onboard chiclet
    // prompt (closest match to the canonical story). If already in
    // chat, just append a user bubble — handy for follow-up chatter
    // during a demo, even though the story doesn't branch on it.
    if ($app.getAttribute("data-view") === "home") {
      kickStory(text);
    } else {
      userBubble(text);
    }
  });

  // Back to home — resets the story and slides home back in.
  $appbarBack.addEventListener("click", resetToHome);
  function resetToHome() {
    runToken += 1;
    storyRunning = false;
    storyIdx = 0;
    story = null;
    window.__approvalResolve = null;
    window.__choiceResolve = null;
    $thread.innerHTML = "";
    showHome();
  }
  window.__resetToHome = resetToHome;
  window.__runStory = (prompt) => kickStory(prompt || "Onboard Rohan Sharma, PL-13234 — he has accepted the offer letter.");

  // ----------------------------------------------------------------
  // Sign-off action buttons — give a quick visual receipt without
  // leaving home (mirrors v5's pushDirectorNote pattern but minimised
  // for mobile: row collapses with a fade-out + check-mark).
  // ----------------------------------------------------------------
  $signoffs.addEventListener("click", (e) => {
    const btn = e.target.closest(".signoff__btn");
    if (!btn) return;
    const row = btn.closest(".signoff");
    if (!row) return;
    const isApprove = btn.classList.contains("signoff__btn--approve");
    row.style.transition = "opacity .25s ease, transform .25s ease";
    row.style.opacity = ".55";
    row.style.transform = "translateX(8px)";
    btn.disabled = true;
    btn.innerHTML = isApprove ? "Approved ✓" : "Deferred";
    btn.style.borderColor = "transparent";
    setTimeout(() => { row.style.opacity = ""; row.style.transform = ""; }, 800);
  });

  // ----------------------------------------------------------------
  // INITIAL PAINT
  // ----------------------------------------------------------------
  renderHome();
  showHome();
})();
