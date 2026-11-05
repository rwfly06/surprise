/* Galeri kenangan Mama: Polaroid melayang, Carousel 3D, Memory Cards,
   Cinematic Showcase (lightbox), dan Memory Timeline. */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});
  const { $, $$, h, clamp, tilt, onVisible } = MB;
  const Q = MB.quality;

  /* ===== Foto & placeholder ===== */
  const PH_PALETTES = [
    ["#F7C9D9", "#E9DDF7"],
    ["#FFD9C7", "#F7C9D9"],
    ["#DCCCF5", "#FFF7ED"],
    ["#FFF7ED", "#ECAAC5"],
    ["#E9DDF7", "#FFD9C7"],
    ["#ECAAC5", "#FFF7ED"],
  ];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* Placeholder ilustrasi bunga — jelas bukan foto asli Mama */
  function placeholder(i, label, sub = "assets/photos/") {
    const [a, b] = PH_PALETTES[i % PH_PALETTES.length];
    const petals = Array.from({ length: 6 }, (_, k) => `<ellipse cx="0" cy="-34" rx="22" ry="34" fill="#fff" opacity=".75" transform="rotate(${k * 60})"/>`).join("");
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
      `<rect width="600" height="750" fill="url(#g)"/>` +
      `<circle cx="110" cy="130" r="70" fill="#fff" opacity=".25"/><circle cx="500" cy="220" r="40" fill="#fff" opacity=".3"/><circle cx="470" cy="620" r="90" fill="#fff" opacity=".18"/>` +
      `<g transform="translate(300 300)">${petals}<circle r="22" fill="#E8D4A5"/></g>` +
      `<text x="300" y="480" font-family="Georgia, serif" font-size="40" fill="#8a5a72" text-anchor="middle" font-style="italic">${esc(label)}</text>` +
      `<text x="300" y="530" font-family="Arial, sans-serif" font-size="20" fill="#8a5a72" text-anchor="middle" opacity=".8">Tambahkan foto Mama di</text>` +
      `<text x="300" y="560" font-family="monospace" font-size="20" fill="#8a5a72" text-anchor="middle" opacity=".8">${esc(sub)}</text>` +
      `</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* Membuat <img> dengan lazy-load, fokus crop, dan fallback placeholder */
  function photoImg(photo, i, { eager = false, cls = "", label } = {}) {
    const ph = placeholder(i, label || photo.title || "Foto Mama");
    const img = h("img", {
      class: cls,
      src: photo.src || ph,
      alt: photo.src ? photo.alt || photo.title || "Foto Mama" : "Placeholder foto — " + (photo.title || "Foto Mama"),
      loading: eager ? "eager" : "lazy",
      decoding: "async",
      draggable: "false",
      style: { "object-position": photo.focus || "50% 50%" },
    });
    if (!photo.src) img.dataset.placeholder = "true";
    img.addEventListener(
      "error",
      () => {
        console.warn("[gallery] Foto tidak ditemukan:", photo.src);
        img.src = ph;
        img.dataset.placeholder = "true";
      },
      { once: true }
    );
    return img;
  }

  /* ===== Lightbox / Cinematic Photo Showcase ===== */
  const lightbox = (() => {
    let photos = [];
    let index = 0;
    let lastFocus = null;
    let root, bgImg, img, title, date, caption, counter;
    let touchX = null;

    function init(list) {
      photos = list;
      root = $("#lightbox");
      bgImg = $(".lightbox__bg img", root);
      img = $(".lightbox__img", root);
      title = $(".lightbox__title", root);
      date = $(".lightbox__date", root);
      caption = $(".lightbox__caption", root);
      counter = $(".lightbox__counter", root);
      $(".lightbox__close", root).addEventListener("click", close);
      $(".lightbox__prev", root).addEventListener("click", () => go(-1));
      $(".lightbox__next", root).addEventListener("click", () => go(1));
      root.addEventListener("click", (e) => {
        if (e.target === root || e.target.classList.contains("lightbox__stage")) close();
      });
      root.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") go(-1);
        else if (e.key === "ArrowRight") go(1);
        else if (e.key === "Tab") trapFocus(e);
      });
      root.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
      root.addEventListener("touchend", (e) => {
        if (touchX == null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      });
    }

    function trapFocus(e) {
      const f = $$("button", root);
      const first = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    }

    function render() {
      const p = photos[index];
      const src = p.src || placeholder(index, p.title || "Foto Mama");
      img.classList.remove("is-in");
      img.classList.add("is-out");
      setTimeout(() => {
        const done = () => {
          img.classList.remove("is-out");
          void img.offsetWidth;
          img.classList.add("is-in");
        };
        img.onload = done;
        img.onerror = () => {
          img.onerror = null;
          img.src = placeholder(index, p.title || "Foto Mama");
        };
        img.src = src;
        img.alt = p.alt || p.title || "Foto Mama";
        bgImg.src = src;
        if (img.complete && img.naturalWidth) done();
      }, Q.reducedMotion ? 0 : 220);
      title.textContent = p.title || "";
      date.textContent = p.date || "";
      date.hidden = !p.date;
      caption.textContent = [p.caption, p.description].filter(Boolean).join(" — ");
      counter.textContent = `${index + 1} / ${photos.length}`;
    }

    function open(i) {
      index = clamp(i, 0, photos.length - 1);
      lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add("no-scroll");
      requestAnimationFrame(() => root.classList.add("is-open"));
      render();
      MB.audio.sfx("click");
      $(".lightbox__close", root).focus({ preventScroll: true });
    }

    function close() {
      if (root.hidden) return;
      root.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      setTimeout(() => (root.hidden = true), Q.reducedMotion ? 0 : 350);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    function go(d) {
      index = (index + d + photos.length) % photos.length;
      render();
      MB.audio.sfx("click");
    }

    return { init, open, close };
  })();

  /* ===== A. Floating Polaroid ===== */
  function buildPolaroids(photos, wrap) {
    const rots = [-5, 3.5, -2.5, 4.5, -3.5, 2.5, -4, 3];
    photos.forEach((p, i) => {
      const card = h(
        "button",
        {
          class: "polaroid",
          type: "button",
          "aria-label": `Buka foto: ${p.title || "Foto " + (i + 1)}`,
          style: { "--rot": rots[i % rots.length] + "deg", "--float-delay": (-i * 1.3).toFixed(1) + "s" },
          onClick: () => lightbox.open(i),
        },
        h("span", { class: "polaroid__inner" },
          h("span", { class: "polaroid__tape" }),
          h("span", { class: "polaroid__photo" }, photoImg(p, i)),
          h("span", { class: "polaroid__caption", text: p.title || "" })
        )
      );
      wrap.appendChild(card);
      tilt(card.firstChild, { max: 14, scale: 1.04 });
    });
  }

  /* ===== B. 3D Carousel ===== */
  function buildCarousel(photos, root) {
    const ring = $(".carousel__ring", root);
    const N = photos.length;
    const step = 360 / N;
    let angle = 0;
    let radius = 300;
    let dragging = false;
    let startX = 0;
    let startAngle = 0;
    let moved = 0;

    const items = photos.map((p, i) => {
      const item = h(
        "button",
        { class: "carousel__item", type: "button", "aria-label": `Foto ${i + 1}: ${p.title || ""}` },
        photoImg(p, i),
        h("span", { class: "carousel__label", text: p.title || "" })
      );
      item.addEventListener("click", (e) => {
        if (moved > 6) {
          e.preventDefault();
          return;
        }
        if (activeIndex() === i) lightbox.open(i);
        else rotateTo(i);
      });
      ring.appendChild(item);
      return item;
    });

    const dots = $(".carousel__dots", root);
    const dotEls = photos.map((p, i) => {
      const d = h("button", { class: "carousel__dot", type: "button", "aria-label": `Ke foto ${i + 1}`, onClick: () => rotateTo(i) });
      dots.appendChild(d);
      return d;
    });

    function layout() {
      const w = root.clientWidth;
      const itemW = clamp(w * 0.46, 150, 270);
      root.style.setProperty("--item-w", itemW + "px");
      radius = N > 2 ? Math.round(itemW / 2 / Math.tan(Math.PI / N) + 24) : itemW;
      items.forEach((it, i) => (it.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`));
      apply(false);
    }

    function activeIndex() {
      return ((Math.round(-angle / step) % N) + N) % N;
    }

    function apply(animate = true) {
      ring.style.transition = animate && !Q.reducedMotion ? "" : "none";
      ring.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
      const act = activeIndex();
      items.forEach((it, i) => {
        let d = (((i * step + angle) % 360) + 540) % 360 - 180;
        d = Math.abs(d);
        const blur = Math.min(6, (d / 180) * 9);
        it.style.filter = d < step / 2 ? "none" : `blur(${blur.toFixed(1)}px) saturate(.85)`;
        it.style.opacity = (1 - Math.min(0.55, (d / 180) * 0.8)).toFixed(2);
        it.classList.toggle("is-active", i === act);
        it.tabIndex = i === act ? 0 : -1;
      });
      dotEls.forEach((d, i) => d.setAttribute("aria-current", i === act ? "true" : "false"));
    }

    function rotateTo(i) {
      // putar lewat jalur terpendek
      const target = -i * step;
      let diff = ((target - angle) % 360 + 540) % 360 - 180;
      angle += diff;
      apply();
      MB.audio.sfx("click");
    }

    const go = (d) => rotateTo((activeIndex() + d + N) % N);
    $(".carousel__prev", root).addEventListener("click", () => go(-1));
    $(".carousel__next", root).addEventListener("click", () => go(1));
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    });

    const stage = $(".carousel__stage", root);
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startAngle = angle;
    });
    addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) {
        angle = startAngle + dx * 0.35;
        apply(false);
      }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (moved > 6) {
        angle = Math.round(angle / step) * step;
        apply();
      }
    };
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);

    let rt;
    addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(layout, 150);
    });
    return { layout };
  }

  /* ===== C. Memory Cards ===== */
  function buildCards(photos, wrap) {
    photos.forEach((p, i) => {
      const card = h(
        "button",
        { class: "memory-card", type: "button", "aria-label": `Buka foto: ${p.title || ""}`, onClick: () => lightbox.open(i) },
        h("span", { class: "memory-card__photo" }, photoImg(p, i)),
        h("span", { class: "memory-card__body" },
          p.date ? h("span", { class: "chip", text: p.date }) : null,
          h("span", { class: "memory-card__title", text: p.title || "" }),
          h("span", { class: "memory-card__caption", text: p.caption || "" })
        )
      );
      wrap.appendChild(card);
    });
  }

  /* ===== E. Memory Timeline ===== */
  function buildTimeline(photos, wrap) {
    photos.forEach((p, i) => {
      const item = h(
        "li",
        { class: "timeline__item", "data-reveal": "" },
        h("span", { class: "timeline__dot", "aria-hidden": "true" }),
        h("article", { class: "timeline__card" },
          h("button", { class: "timeline__photo", type: "button", "aria-label": `Buka foto: ${p.title || ""}`, onClick: () => lightbox.open(i) }, photoImg(p, i)),
          h("div", { class: "timeline__text" },
            h("span", { class: "chip", text: p.date || `Kenangan ${i + 1}` }),
            h("h3", { class: "timeline__title", text: p.title || "" }),
            p.caption ? h("p", { class: "timeline__caption", text: p.caption }) : null,
            p.description ? h("p", { class: "timeline__desc", text: p.description }) : null
          )
        )
      );
      wrap.appendChild(item);
    });

    // garis timeline tumbuh mengikuti scroll
    const line = $(".timeline__line");
    const list = wrap;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = list.getBoundingClientRect();
      const p = clamp((innerHeight * 0.7 - r.top) / r.height, 0, 1);
      line.style.setProperty("--progress", p.toFixed(3));
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
  }

  /* ===== Tabs mode galeri ===== */
  function initTabs(carousel) {
    const tabs = $$(".gallery-tabs [role=tab]");
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        panel.hidden = !on;
        if (on) {
          panel.classList.remove("is-shown");
          void panel.offsetWidth;
          panel.classList.add("is-shown");
        }
      });
      if (tab.getAttribute("aria-controls") === "panel-carousel") carousel.layout();
      if (focus) tab.focus();
      MB.audio.sfx("click");
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
          select(next, true);
        }
      });
    });
  }

  function init(config) {
    const photos = (config.photos || []).filter(Boolean);
    if (!photos.length) photos.push({ title: "Foto Mama" });
    lightbox.init(photos);
    buildPolaroids(photos, $("#polaroidWall"));
    const carousel = buildCarousel(photos, $("#carousel"));
    buildCards(photos, $("#memoryCards"));
    buildTimeline(photos, $("#timelineList"));
    initTabs(carousel);
    onVisible($("#carousel"), () => carousel.layout(), { threshold: 0 });
  }

  MB.gallery = { init, photoImg, placeholder, lightbox };
})();
