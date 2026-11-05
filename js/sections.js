/* Section-section interaktif: Opening, Hero, Garden, Letter, Blessings, Gifts, Finale. */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});
  const { $, $$, h, tilt, onVisible, wait } = MB;
  const Q = MB.quality;
  const T = (ms) => (Q.reducedMotion ? Math.min(ms, 300) : ms);

  /* ===== 1. Opening — Magical Entrance ===== */
  const opening = (() => {
    let root, btn, gift, opened = false, finished = false, timers = [], onDone = () => {};

    function later(fn, ms) {
      timers.push(setTimeout(fn, T(ms)));
    }

    function init(cfg, done) {
      onDone = done;
      root = $("#opening");
      btn = $("#openSurprise");
      MB.decor.flowerRow($(".opening__garden--far", root), { count: 18, seed: 3, minH: 60, maxH: 110 });
      MB.decor.flowerRow($(".opening__garden--near", root), { count: 9, seed: 9, minH: 130, maxH: 210 });
      MB.decor.butterflies($(".opening__butterflies", root), 5);
      gift = MB.decor.giftBox({ color: "#F7C9D9", ribbon: "#E8D4A5", className: "gift3d--hero is-idle" });
      $("#introGift").appendChild(gift);

      btn.addEventListener("click", open);
      gift.parentElement.addEventListener("click", open);
      root.addEventListener("click", (e) => {
        if (root.classList.contains("can-skip") && !e.target.closest("button")) finish();
      });
      document.addEventListener("keydown", (e) => {
        if (!root.hidden && root.classList.contains("can-skip") && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
          e.preventDefault();
          finish();
        }
      });
    }

    function open() {
      if (opened) return;
      opened = true;
      const music = (window.BIRTHDAY_CONFIG.music || {}).startOnOpen !== false;
      MB.audio.unlock();
      MB.audio.sfx("giftOpen");
      if (music && !MB.audio.state.playing) setTimeout(() => MB.audio.play(), 600);

      root.classList.add("is-opening");
      gift.classList.remove("is-idle");
      gift.classList.add("is-open");
      btn.disabled = true;
      MB.fx.burstAt(gift, { count: 80, types: ["spark", "petal", "heart", "petal"], power: 10 });

      later(() => root.classList.add("is-zooming"), 1400);
      later(() => {
        root.classList.add("show-line", "can-skip");
        MB.fx.burstAt(root, { count: 30, types: ["petal"], power: 6 });
      }, 2400);
      later(() => {
        root.classList.add("show-title");
        MB.fx.confetti({ count: 140 });
        MB.audio.sfx("bell");
      }, 4200);
      later(finish, 7800);
    }

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      timers = [];
      root.classList.add("show-title", "is-leaving");
      setTimeout(() => {
        root.hidden = true;
        onDone();
      }, T(1100));
    }

    function replay() {
      timers.forEach(clearTimeout);
      timers = [];
      window.scrollTo({ top: 0, behavior: "auto" });
      opened = finished = false;
      root.className = "opening";
      root.hidden = false;
      gift.classList.remove("is-open");
      gift.classList.add("is-idle");
      btn.disabled = false;
      document.body.classList.add("is-locked");
      document.body.classList.remove("is-entered");
      requestAnimationFrame(() => btn.focus({ preventScroll: true }));
    }

    return { init, replay };
  })();

  /* ===== 2. Hero ===== */
  function decorateOrnaments(root = document) {
    $$("[data-orn]", root).forEach((el, i) => {
      if (!el.innerHTML) el.innerHTML = MB.decor.flowerSVG(el.dataset.orn, i, i + 5);
    });
  }

  function initHero(cfg) {
    const photo = (cfg.hero && cfg.hero.photo) || {};
    $("#heroPhoto").appendChild(MB.gallery.photoImg(photo, 0, { eager: true, label: "Foto Mama" }));
    decorateOrnaments($("#home"));
    MB.decor.balloons($(".hero__balloons"), { count: 6, seed: 5 });
    MB.decor.butterflies($(".hero__butterflies"), 3);
    tilt($("#heroFrame"), { max: 12, scale: 1.02 });
  }

  /* ===== 3. Garden (termasuk taman interaktif & kuncup bunga dari versi lama) ===== */
  function initGarden(cfg) {
    const g = cfg.garden || {};
    const section = $("#garden");
    MB.decor.flowerRow($(".garden__layer--far", section), { count: 20, seed: 21, minH: 60, maxH: 110 });
    MB.decor.flowerRow($(".garden__layer--mid", section), { count: 13, seed: 31, minH: 110, maxH: 170 });
    MB.decor.flowerRow($(".garden__layer--near", section), { count: 8, seed: 41, minH: 170, maxH: 250 });
    MB.decor.floatingHearts($(".garden__hearts", section), { count: 12, seed: 4 });
    MB.decor.butterflies($(".garden__butterflies", section), 4);
    onVisible(section, () => section.classList.add("is-bloomed"), { threshold: 0.15 });

    const garden = $("#bloomGarden");
    const hint = $("#gardenHint");
    garden.addEventListener("click", () => {
      const bloomed = !garden.classList.contains("bloomed");
      garden.classList.toggle("bloomed", bloomed);
      garden.setAttribute("aria-pressed", String(bloomed));
      hint.textContent = bloomed ? g.bloomedHint || "" : g.hint || "";
      if (bloomed) {
        MB.audio.sfx("sparkle");
        MB.fx.burstAt(garden, { count: 60, types: ["petal", "petal", "spark", "heart"], power: 7 });
      } else MB.audio.sfx("click");
    });
  }

  /* ===== 4. Letter ===== */
  function initLetter(cfg) {
    const L = cfg.letter || {};
    const envelope = $("#envelope");
    const paper = $("#letterPaper");
    const textEl = $("#letterText");
    const sign = $("#letterSign");
    const skipBtn = $("#letterSkip");
    const closeBtn = $("#letterClose");
    const full = L.text || "";
    let timer = null;
    let i = 0;
    let busy = false;

    function finishTyping() {
      clearTimeout(timer);
      textEl.textContent = full;
      textEl.classList.remove("is-typing");
      sign.hidden = false;
      skipBtn.hidden = true;
      closeBtn.hidden = false;
    }

    /* Efek mengetik (fitur lama, kini dengan jeda alami pada tanda baca) */
    function type() {
      if (Q.reducedMotion) return finishTyping();
      textEl.classList.add("is-typing");
      const speed = L.typingSpeed || 24;
      (function tick() {
        if (i >= full.length) return finishTyping();
        const ch = full[i++];
        textEl.textContent = full.slice(0, i);
        let delay = speed;
        if (ch === "\n" && full[i] === "\n") delay = speed * 14;
        else if (".!?".includes(ch)) delay = speed * 9;
        else if (ch === ",") delay = speed * 4;
        timer = setTimeout(tick, delay);
      })();
    }

    async function open() {
      if (busy || envelope.classList.contains("is-opening")) return;
      busy = true;
      envelope.setAttribute("aria-expanded", "true");
      MB.audio.sfx("click");
      envelope.classList.add("is-opening");
      MB.fx.hearts(...center($(".envelope__seal", envelope)), 16);
      await wait(T(600));
      MB.audio.sfx("bell");
      await wait(T(1100));
      envelope.classList.add("is-done");
      await wait(T(400));
      paper.hidden = false;
      void paper.offsetWidth;
      paper.classList.add("is-open");
      i = 0;
      textEl.textContent = "";
      sign.hidden = true;
      skipBtn.hidden = false;
      closeBtn.hidden = true;
      await wait(T(900));
      type();
      busy = false;
    }

    function close() {
      clearTimeout(timer);
      paper.classList.remove("is-open");
      MB.audio.sfx("click");
      setTimeout(() => {
        paper.hidden = true;
        envelope.classList.remove("is-opening", "is-done");
        envelope.setAttribute("aria-expanded", "false");
        envelope.focus({ preventScroll: true });
        envelope.scrollIntoView({ behavior: Q.reducedMotion ? "auto" : "smooth", block: "center" });
      }, T(500));
    }

    envelope.addEventListener("click", open);
    skipBtn.addEventListener("click", finishTyping);
    closeBtn.addEventListener("click", close);
  }

  function center(el) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  /* ===== 5. Blessings ===== */
  function initBlessings(cfg) {
    const grid = $("#wishesGrid");
    const items = (cfg.blessings && cfg.blessings.items) || [];
    items.forEach((it, i) => {
      const card = h(
        "li",
        { class: "wish-card", style: { "--i": i } },
        h("div", { class: "wish-card__inner" },
          h("span", { class: "wish-card__icon", "aria-hidden": "true", text: it.icon || "✨" }),
          h("span", { class: "wish-card__num", "aria-hidden": "true", text: String(i + 1).padStart(2, "0") }),
          h("p", { class: "wish-card__text", text: it.text })
        )
      );
      grid.appendChild(card);
      tilt(card.firstChild, { max: 10, scale: 1.03 });
    });
    onVisible(grid, () => grid.classList.add("is-visible"), { threshold: 0.12 });
  }

  /* ===== 6. Gifts ===== */
  function initGifts(cfg) {
    const G = cfg.gifts || {};
    const items = G.items || [];
    const grid = $("#giftsGrid");
    const count = $("#giftsCount");
    const next = $("#giftsNext");
    let opened = 0;

    const updateCount = () => (count.textContent = `${opened} / ${items.length} gifts opened`);

    items.forEach((it, i) => {
      const msgId = "gift-msg-" + i;
      const box = MB.decor.giftBox({ color: it.color, ribbon: it.ribbon, className: "is-idle" });
      const msg = h("p", { class: "gift-msg glass", id: msgId, hidden: true }, h("span", { class: "gift-msg__heart", "aria-hidden": "true", text: "♥" }), it.message);
      const btn = h(
        "button",
        { class: "gift-btn", type: "button", "aria-expanded": "false", "aria-controls": msgId, style: { "--i": i } },
        h("span", { class: "gift-btn__box" }, box),
        h("span", { class: "gift-btn__label", text: it.label || `Gift ${i + 1}` })
      );
      btn.addEventListener("click", () => {
        if (btn.classList.contains("is-open")) {
          MB.fx.hearts(...center(box), 8);
          MB.audio.sfx("sparkle");
          return;
        }
        btn.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        box.classList.remove("is-idle");
        box.classList.add("is-open");
        MB.audio.sfx("giftOpen");
        MB.fx.burstAt(box, { count: 70, types: ["confetti", "spark", "heart"], power: 9 });
        setTimeout(() => {
          msg.hidden = false;
          requestAnimationFrame(() => msg.classList.add("is-visible"));
          MB.audio.sfx("confetti");
        }, T(450));
        opened++;
        updateCount();
        if (opened === items.length) {
          setTimeout(() => {
            MB.fx.confetti({ count: 200 });
            MB.audio.sfx("bell");
            next.hidden = false;
          }, T(900));
        }
      });
      grid.appendChild(h("li", { class: "gift-slot", "data-reveal": "", style: { "--i": i } }, btn, msg));
    });
    updateCount();
  }

  /* ===== 7. Finale ===== */
  function initFinale(cfg) {
    const F = cfg.finale || {};
    const section = $("#finale");
    const photo = F.photo && F.photo.src ? F.photo : (cfg.hero && cfg.hero.photo) || {};
    $("#finalePhoto").appendChild(MB.gallery.photoImg(photo, 2, { label: "Foto Mama" }));
    decorateOrnaments(section);
    MB.decor.balloons($(".finale__balloons", section), { count: 9, seed: 13, rise: true });
    MB.decor.butterflies($(".finale__butterflies", section), 6);
    MB.decor.floatingHearts($(".finale__hearts", section), { count: 16, seed: 17 });
    MB.decor.flowerRow($(".finale__flowers", section), { count: 16, seed: 51, minH: 90, maxH: 190 });
    tilt($("#finaleFrame"), { max: 12, scale: 1.02 });

    let celebrated = false;
    onVisible(
      $(".finale__content", section),
      () => {
        section.classList.add("is-active");
        if (celebrated) return;
        celebrated = true;
        setTimeout(() => {
          MB.fx.confetti({ count: 220 });
          MB.fx.burstAt($("#finaleFrame"), { count: 50, types: ["heart", "spark", "petal"], power: 8 });
          MB.audio.sfx("bell");
        }, T(1400));
      },
      { threshold: 0.3 }
    );

    $("#celebrateBtn").addEventListener("click", (e) => {
      MB.fx.confetti({ count: 200 });
      MB.fx.burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, { count: 50, types: ["heart", "spark", "confetti"], power: 9 });
      MB.audio.sfx("confetti");
      setTimeout(() => MB.audio.sfx("bell"), 250);
    });
    $("#replayBtn").addEventListener("click", () => {
      MB.audio.sfx("click");
      opening.replay();
    });
  }

  MB.sections = { opening, initHero, initGarden, initLetter, initBlessings, initGifts, initFinale };
})();
