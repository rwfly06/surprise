/* Orkestrasi: konfigurasi, loading screen, navigasi, musik, fullscreen, inisialisasi section. */
(function () {
  "use strict";
  const MB = window.MB;
  const { $, $$, h, getPath, wait, scrollToId } = MB;
  const cfg = window.BIRTHDAY_CONFIG || {};
  const Q = MB.quality;

  /* Menjalankan setiap modul secara terisolasi agar satu error tidak merusak semuanya */
  function safe(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`[${name}] gagal diinisialisasi:`, err);
    }
  }

  function applyConfig() {
    if (cfg.pageTitle) document.title = cfg.pageTitle;
    const map = { pink: "--pink", peach: "--peach", cream: "--cream", lavender: "--lavender", lilac: "--lilac", rose: "--rose", white: "--white", gold: "--gold" };
    for (const [k, v] of Object.entries(cfg.theme || {})) if (map[k] && v) document.documentElement.style.setProperty(map[k], v);
    $$("[data-text]").forEach((el) => {
      const v = getPath(cfg, el.dataset.text);
      if (typeof v === "string" && v) el.textContent = v;
    });
  }

  /* ===== Loading screen ===== */
  async function runLoader() {
    const loader = $("#loader");
    const bar = $("#loaderBar");
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(90, p + (90 - p) * 0.12);
      bar.style.transform = `scaleX(${p / 100})`;
    }, 80);
    const loaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    await Promise.all([Promise.race([Promise.all([loaded, fonts]), wait(4000)]), wait(Q.reducedMotion ? 200 : 900)]);
    clearInterval(iv);
    bar.style.transform = "scaleX(1)";
    await wait(250);
    loader.classList.add("is-hidden");
    document.body.classList.add("is-loaded");
    setTimeout(() => loader.remove(), 900);
  }

  /* ===== Navigasi ===== */
  function initNav() {
    const sections = $$("main .section[data-label]");
    const menuList = $("#menuList");
    const dotNav = $("#dotNav");
    const menuBtn = $("#menuBtn");
    const menu = $("#menuPanel");
    const links = [];

    sections.forEach((s) => {
      const go = (e) => {
        e.preventDefault();
        closeMenu();
        MB.audio.sfx("click");
        scrollToId(s.id);
      };
      const a = h("a", { href: "#" + s.id, class: "menu__link", onClick: go }, s.dataset.label);
      const d = h("a", { href: "#" + s.id, class: "dots__link", "aria-label": s.dataset.label, onClick: go }, h("span", { class: "dots__tip", text: s.dataset.label }));
      menuList.appendChild(h("li", null, a));
      dotNav.appendChild(h("li", null, d));
      links.push({ id: s.id, a, d });
    });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((l) => {
            const on = l.id === e.target.id;
            l.a.toggleAttribute("aria-current", on);
            l.d.toggleAttribute("aria-current", on);
          });
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));

    function closeMenu() {
      menu.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      closePanels();
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      MB.audio.sfx("click");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.isConnected) return;
      if (!e.target.closest(".menu, #menuBtn, .music")) closePanels();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanels();
    });

    $$("[data-scroll]").forEach((b) =>
      b.addEventListener("click", () => {
        MB.audio.sfx("click");
        scrollToId(b.dataset.scroll);
      })
    );

    // Progress & tombol kembali ke atas
    const bar = $("#progressBar");
    const toTop = $("#toTop");
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      toTop.classList.toggle("is-visible", scrollY > innerHeight * 0.8);
      $("#topbar").classList.toggle("is-scrolled", scrollY > 20);
    };
    addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
    toTop.addEventListener("click", () => {
      MB.audio.sfx("click");
      window.scrollTo({ top: 0, behavior: Q.reducedMotion ? "auto" : "smooth" });
    });
  }

  function closePanels() {
    $("#menuPanel").hidden = true;
    $("#menuBtn").setAttribute("aria-expanded", "false");
    $("#musicPanel").hidden = true;
    $("#musicMore").setAttribute("aria-expanded", "false");
  }

  /* ===== Kontrol musik ===== */
  function initMusicUI() {
    const btn = $("#musicBtn");
    const more = $("#musicMore");
    const panel = $("#musicPanel");
    const vol = $("#volume");
    const tracksEl = $("#musicTracks");
    const title = $("#musicTitle");

    btn.addEventListener("click", () => MB.audio.toggle());
    more.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = panel.hidden;
      closePanels();
      panel.hidden = !open;
      more.setAttribute("aria-expanded", String(open));
    });
    vol.addEventListener("input", () => MB.audio.setVolume(vol.value / 100));

    let lastTracks = "";
    MB.audio.onChange((s) => {
      btn.classList.toggle("is-playing", s.playing);
      btn.setAttribute("aria-pressed", String(s.playing));
      btn.setAttribute("aria-label", s.playing ? "Jeda musik" : "Putar musik");
      vol.value = Math.round(s.volume * 100);
      const current = s.tracks.find((t) => t.id === s.track);
      title.textContent = current ? current.title : "";
      const sig = s.tracks.map((t) => t.id).join(",") + "|" + s.track;
      if (sig === lastTracks) return;
      lastTracks = sig;
      tracksEl.textContent = "";
      s.tracks.forEach((t) =>
        tracksEl.appendChild(
          h("button", {
            type: "button",
            role: "radio",
            class: "music__track",
            "aria-checked": String(t.id === s.track),
            text: t.title,
            onClick: () => {
              MB.audio.setTrack(t.id);
              if (!MB.audio.state.playing) MB.audio.play();
            },
          })
        )
      );
    });
  }

  /* ===== Fullscreen ===== */
  function initFullscreen() {
    const btn = $("#fullscreenBtn");
    const docEl = document.documentElement;
    const enabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (!enabled) return;
    btn.hidden = false;
    const isFs = () => document.fullscreenElement || document.webkitFullscreenElement;
    btn.addEventListener("click", () => {
      MB.audio.sfx("click");
      if (isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {
        const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
        Promise.resolve(req.call(docEl)).catch((err) => console.warn("Fullscreen ditolak:", err));
      }
    });
    const sync = () => {
      btn.classList.toggle("is-active", !!isFs());
      btn.setAttribute("aria-label", isFs() ? "Keluar layar penuh" : "Layar penuh");
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
  }

  /* Feedback visual: efek riak pada setiap tombol */
  function initRipple() {
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest(".btn, .icon-btn");
      if (!btn || Q.reducedMotion) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const ripple = h("span", {
        class: "ripple",
        style: { width: size + "px", height: size + "px", left: e.clientX - r.left - size / 2 + "px", top: e.clientY - r.top - size / 2 + "px" },
      });
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  }

  function onEntered() {
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-entered");
    window.scrollTo({ top: 0, behavior: "auto" });
    MB.parallax.refresh();
    $("#home").focus({ preventScroll: true });
  }

  function init() {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    applyConfig();
    safe("fx", () => {
      MB.fx.init();
      MB.fx.setAmbient(true);
    });
    safe("parallax", () => MB.parallax.init());
    safe("opening", () => MB.sections.opening.init(cfg, onEntered));
    safe("hero", () => MB.sections.initHero(cfg));
    safe("gallery", () => MB.gallery.init(cfg));
    safe("cake", () => MB.cake.init(cfg));
    safe("garden", () => MB.sections.initGarden(cfg));
    safe("letter", () => MB.sections.initLetter(cfg));
    safe("blessings", () => MB.sections.initBlessings(cfg));
    safe("gifts", () => MB.sections.initGifts(cfg));
    safe("finale", () => MB.sections.initFinale(cfg));
    safe("nav", initNav);
    safe("music", initMusicUI);
    safe("fullscreen", initFullscreen);
    safe("ripple", initRipple);
    MB.parallax.add();
    MB.initReveal();
    $("#home").tabIndex = -1;
    runLoader();

    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js").catch((err) => console.warn("Service worker gagal:", err));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
