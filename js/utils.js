/* Utilitas bersama: DOM helper, deteksi kualitas perangkat, observer, tilt & parallax. */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Membuat elemen: h("div", { class: "x", onClick: fn }, child1, "teks") */
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "style" && typeof v === "object") {
        for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
      } else if (k === "dataset") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Random deterministik agar tata letak dekorasi stabil di setiap kunjungan */
  function seeded(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  /* ===== Kualitas visual adaptif ===== */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  function detectQuality() {
    const forced = new URLSearchParams(location.search).get("quality");
    if (["low", "medium", "high"].includes(forced)) return forced;
    if (reducedMotion) return "low";
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const smallScreen = Math.min(screen.width, screen.height) < 500;
    let score = 0;
    score += mem >= 8 ? 2 : mem >= 4 ? 1 : 0;
    score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
    if (!isTouch) score += 1;
    if (smallScreen) score -= 1;
    if (navigator.connection && navigator.connection.saveData) score -= 2;
    return score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  }

  const level = detectQuality();
  MB.quality = {
    level,
    reducedMotion,
    isTouch,
    scale: { high: 1, medium: 0.6, low: 0.32 }[level],
  };
  document.documentElement.dataset.quality = level;
  if (reducedMotion) document.documentElement.classList.add("reduced-motion");

  /* ===== IntersectionObserver helper ===== */
  function onVisible(el, cb, opts = {}) {
    const { once = true, threshold = 0.2, rootMargin = "0px", onHide } = opts;
    if (!("IntersectionObserver" in window)) {
      cb(el);
      return () => {};
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            cb(e.target);
            if (once) io.unobserve(e.target);
          } else if (onHide) onHide(e.target);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }

  /* Elemen [data-reveal] muncul halus saat masuk viewport */
  function initReveal(root = document) {
    $$("[data-reveal]:not(.is-visible)", root).forEach((el) =>
      onVisible(el, (t) => t.classList.add("is-visible"), { threshold: 0.15 })
    );
  }

  /* ===== Efek 3D tilt (mouse) ===== */
  function tilt(el, { max = 10, scale = 1.02 } = {}) {
    if (isTouch || reducedMotion) return () => {};
    let raf = 0;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", (-py * max).toFixed(2) + "deg");
        el.style.setProperty("--ry", (px * max).toFixed(2) + "deg");
        el.style.setProperty("--ts", scale);
        el.style.setProperty("--gx", ((px + 0.5) * 100).toFixed(1) + "%");
        el.style.setProperty("--gy", ((py + 0.5) * 100).toFixed(1) + "%");
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--ts", 1);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }

  /* ===== Parallax (scroll + mouse) =====
     data-parallax="0.15"  → bergerak mengikuti scroll
     data-mouse="12"       → bergerak mengikuti posisi mouse (px) */
  const parallax = (() => {
    const items = new Set();
    const visible = new Set();
    let mx = 0;
    let my = 0;
    let ticking = false;
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))),
            { rootMargin: "200px" }
          )
        : null;

    function update() {
      ticking = false;
      const vh = innerHeight;
      for (const el of visible) {
        const speed = parseFloat(el.dataset.parallax || 0);
        const depth = parseFloat(el.dataset.mouse || 0);
        let y = 0;
        if (speed) {
          const r = el.getBoundingClientRect();
          y = (r.top + r.height / 2 - vh / 2) * -speed;
        }
        el.style.translate = `${(mx * depth).toFixed(1)}px ${(y + my * depth).toFixed(1)}px`;
      }
    }
    const request = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    function init() {
      if (reducedMotion) return;
      addEventListener("scroll", request, { passive: true });
      addEventListener("resize", request);
      if (!isTouch) {
        addEventListener(
          "pointermove",
          (e) => {
            mx = e.clientX / innerWidth - 0.5;
            my = e.clientY / innerHeight - 0.5;
            request();
          },
          { passive: true }
        );
      }
    }
    function add(root = document) {
      if (reducedMotion) return;
      $$("[data-parallax],[data-mouse]", root).forEach((el) => {
        if (items.has(el)) return;
        items.add(el);
        if (io) io.observe(el);
        else visible.add(el);
      });
      request();
    }
    return { init, add, refresh: request };
  })();

  /* Memuat script eksternal (dipakai untuk lazy-load Three.js) */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Gagal memuat " + src));
      document.head.appendChild(s);
    });
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  Object.assign(MB, {
    $,
    $$,
    h,
    clamp,
    lerp,
    rand,
    pick,
    wait,
    seeded,
    getPath,
    onVisible,
    initReveal,
    tilt,
    parallax,
    loadScript,
    scrollToId,
  });
})();
