/* Pabrik dekorasi: bunga SVG (mawar, tulip, daisy, lavender), kupu-kupu 3D,
   balon, hati melayang, dan kotak hadiah 3D (CSS 3D). */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});
  const { h, rand, pick, seeded } = MB;
  const Q = MB.quality;

  const STEM = "#86b78f";
  const LEAF = ["#9bcfa6", "#8cc49a", "#a8d8b2"];

  const PALETTES = {
    rose: [["#F7C9D9", "#ECAAC5", "#d98aac"], ["#FFD9C7", "#f7b9a0", "#e79f86"], ["#FFF7ED", "#F7C9D9", "#ECAAC5"]],
    tulip: [["#ECAAC5", "#F7C9D9"], ["#DCCCF5", "#E9DDF7"], ["#FFD9C7", "#ffe9df"]],
    daisy: [["#FFFFFF", "#F4D58D"], ["#FFF7ED", "#E8D4A5"], ["#F7C9D9", "#F4D58D"]],
    lavender: [["#C9B6EE", "#B39DDF", "#DCCCF5"]],
  };

  function stemLeaves(seed) {
    const r = seeded(seed);
    const lean = (r() - 0.5) * 8;
    return (
      `<path d="M50 168 C${48 + lean} 130 ${53 - lean} 100 50 62" stroke="${STEM}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      `<path d="M50 128 C32 120 22 106 24 96 C38 98 48 110 50 128Z" fill="${LEAF[seed % 3]}"/>` +
      `<path d="M51 106 C68 100 78 88 78 80 C64 80 54 92 51 106Z" fill="${LEAF[(seed + 1) % 3]}"/>`
    );
  }

  const heads = {
    rose([a, b, c]) {
      let petals = "";
      for (let i = 0; i < 5; i++) petals += `<ellipse cx="0" cy="-15" rx="16" ry="19" fill="${a}" transform="rotate(${i * 72})"/>`;
      return (
        `<g transform="translate(50 44)">${petals}` +
        `<circle r="19" fill="${b}"/>` +
        `<path d="M-14 2 C-14 -14 14 -14 14 2 C14 12 -6 14 -8 4 C-9 -4 6 -6 6 1 C6 6 -1 6 -1 2" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<ellipse cx="-8" cy="-10" rx="7" ry="4" fill="#fff" opacity=".35"/></g>`
      );
    },
    tulip([a, b]) {
      return (
        `<path d="M50 66 C33 64 25 44 29 22 C38 28 46 40 50 66Z" fill="${a}"/>` +
        `<path d="M50 66 C67 64 75 44 71 22 C62 28 54 40 50 66Z" fill="${a}"/>` +
        `<path d="M50 18 C37 28 36 54 50 67 C64 54 63 28 50 18Z" fill="${b}"/>` +
        `<path d="M44 30 C42 40 43 50 47 58" stroke="#fff" stroke-width="2.4" opacity=".45" fill="none" stroke-linecap="round"/>`
      );
    },
    daisy([a, center]) {
      let petals = "";
      for (let i = 0; i < 14; i++)
        petals += `<ellipse cx="0" cy="-17" rx="5" ry="15" fill="${a}" stroke="#F7C9D9" stroke-width=".8" transform="rotate(${(i * 360) / 14})"/>`;
      return `<g transform="translate(50 44)">${petals}<circle r="9" fill="${center}"/><circle r="9" fill="#fff" opacity=".18" cx="-2" cy="-2"/></g>`;
    },
    lavender([a, b, c]) {
      let buds = "";
      for (let i = 0; i < 11; i++) {
        const y = 14 + i * 5.2;
        const x = i % 2 ? 54 : 46;
        buds += `<ellipse cx="${x}" cy="${y}" rx="${4.2 - i * 0.12}" ry="6" fill="${[a, b, c][i % 3]}" transform="rotate(${i % 2 ? 18 : -18} ${x} ${y})"/>`;
      }
      return `<path d="M50 70 L50 12" stroke="${STEM}" stroke-width="2"/>${buds}`;
    },
  };

  const TYPES = Object.keys(heads);

  /* Mengembalikan string SVG bunga (viewBox 100x170) */
  function flowerSVG(type = "rose", variant = 0, seed = 1) {
    const pal = PALETTES[type][variant % PALETTES[type].length];
    return `<svg class="flower-svg" viewBox="0 0 100 170" aria-hidden="true" focusable="false">${stemLeaves(seed)}${heads[type](pal)}</svg>`;
  }

  /* Baris bunga (dipakai di opening, taman, finale). */
  function flowerRow(container, { count = 12, seed = 7, minH = 70, maxH = 150, types = TYPES, sway = true } = {}) {
    const r = seeded(seed);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(r() * types.length)];
      const hgt = minH + r() * (maxH - minH);
      const el = h("span", {
        class: "deco-flower" + (sway ? " is-swaying" : ""),
        html: flowerSVG(type, Math.floor(r() * 3), i + seed),
        style: {
          left: ((i + r() * 0.8) / count) * 100 + "%",
          height: hgt + "px",
          "--sway-dur": (3.5 + r() * 3).toFixed(2) + "s",
          "--sway-delay": (-r() * 4).toFixed(2) + "s",
          "--bloom-delay": (i * 0.07).toFixed(2) + "s",
        },
      });
      frag.appendChild(el);
    }
    container.appendChild(frag);
  }

  /* ===== Kupu-kupu 3D ===== */
  const WING_COLORS = [
    ["#F7C9D9", "#ECAAC5"],
    ["#DCCCF5", "#C9B6EE"],
    ["#FFD9C7", "#F7C9D9"],
    ["#E9DDF7", "#F7C9D9"],
    ["#FFF7ED", "#E8D4A5"],
  ];

  function wingSVG([a, b]) {
    return (
      `<svg viewBox="0 0 50 60" aria-hidden="true">` +
      `<path d="M2 28 C8 4 38 -6 46 10 C51 22 36 30 3 30Z" fill="${a}" stroke="#fff" stroke-width="1.2"/>` +
      `<path d="M3 31 C24 30 41 38 37 52 C31 62 12 53 3 33Z" fill="${b}" stroke="#fff" stroke-width="1.2"/>` +
      `<circle cx="33" cy="14" r="4" fill="#fff" opacity=".75"/><circle cx="26" cy="44" r="3" fill="#fff" opacity=".6"/>` +
      `</svg>`
    );
  }

  const butterflies = new Set();

  function butterfly(container, { size = rand(34, 54), colors = pick(WING_COLORS) } = {}) {
    const el = h(
      "span",
      { class: "butterfly", "aria-hidden": "true", style: { "--size": size + "px", "--flap": rand(0.22, 0.34).toFixed(2) + "s" } },
      h("span", { class: "butterfly__inner" },
        h("span", { class: "wing wing--l", html: wingSVG(colors) }),
        h("span", { class: "wing wing--r", html: wingSVG(colors) }),
        h("span", { class: "butterfly__body" })
      )
    );
    container.appendChild(el);
    const b = { el, container, anim: null };
    butterflies.add(b);
    animateButterfly(b);
    return el;
  }

  function animateButterfly(b) {
    if (b.anim) b.anim.cancel();
    if (Q.reducedMotion) {
      b.el.style.transform = `translate(${rand(0.1, 0.9) * b.container.clientWidth}px, ${rand(0.1, 0.8) * b.container.clientHeight}px)`;
      return;
    }
    const W = b.container.clientWidth || innerWidth;
    const H = b.container.clientHeight || innerHeight;
    const pts = [];
    for (let i = 0; i < 6; i++) pts.push([rand(0.05, 0.92) * W, rand(0.08, 0.85) * H]);
    pts.push(pts[0]);
    const frames = pts.map(([x, y], i) => {
      const nx = pts[(i + 1) % pts.length][0];
      const tiltDeg = nx > x ? 14 : -14;
      return { transform: `translate(${x}px, ${y}px) rotate(${tiltDeg}deg)` };
    });
    b.anim = b.el.animate(frames, { duration: rand(16000, 26000), iterations: Infinity, easing: "ease-in-out", delay: -rand(0, 8000) });
  }

  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => butterflies.forEach((b) => b.el.isConnected && animateButterfly(b)), 300);
  });

  function butterflies_(container, count) {
    const total = Math.max(1, Math.round(count * (Q.level === "low" ? 0.5 : Q.level === "medium" ? 0.75 : 1)));
    for (let i = 0; i < total; i++) butterfly(container);
  }

  /* ===== Balon ===== */
  const BALLOON_COLORS = ["#F7C9D9", "#DCCCF5", "#FFD9C7", "#ECAAC5", "#E8D4A5", "#E9DDF7"];

  function balloons(container, { count = 6, seed = 3, rise = false } = {}) {
    const r = seeded(seed);
    const total = Math.max(2, Math.round(count * (Q.level === "low" ? 0.6 : 1)));
    for (let i = 0; i < total; i++) {
      const w = 34 + r() * 30;
      container.appendChild(
        h("span", {
          class: "balloon" + (rise ? " balloon--rise" : ""),
          "aria-hidden": "true",
          style: {
            "--c": BALLOON_COLORS[i % BALLOON_COLORS.length],
            "--w": w + "px",
            left: ((i + r() * 0.6) / total) * 100 + "%",
            top: rise ? "auto" : (r() * 60).toFixed(1) + "%",
            "--bob-dur": (5 + r() * 4).toFixed(2) + "s",
            "--bob-delay": (-r() * 5).toFixed(2) + "s",
            "--rise-dur": (14 + r() * 10).toFixed(2) + "s",
          },
        })
      );
    }
  }

  /* ===== Hati melayang (CSS) ===== */
  function floatingHearts(container, { count = 10, seed = 11 } = {}) {
    const r = seeded(seed);
    const total = Math.max(3, Math.round(count * Math.max(0.5, Q.scale)));
    for (let i = 0; i < total; i++) {
      container.appendChild(
        h("span", {
          class: "float-heart",
          "aria-hidden": "true",
          text: "♥",
          style: {
            left: (r() * 96).toFixed(1) + "%",
            "font-size": (12 + r() * 20).toFixed(0) + "px",
            "--dur": (9 + r() * 9).toFixed(2) + "s",
            "--delay": (-r() * 12).toFixed(2) + "s",
            color: pick(["#ECAAC5", "#F7C9D9", "#DCCCF5", "#E8D4A5"]),
          },
        })
      );
    }
  }

  /* ===== Kotak hadiah 3D (CSS 3D) ===== */
  function giftBox({ color = "#F7C9D9", ribbon = "#E8D4A5", size = 0, className = "" } = {}) {
    const faces = (names) => names.map((n) => h("span", { class: `gift3d__face gift3d__face--${n}` }));
    const style = { "--box": color, "--ribbon": ribbon };
    if (size) style["--s"] = size + "px";
    return h(
      "span",
      { class: `gift3d ${className}`, "aria-hidden": "true", style },
      h("span", { class: "gift3d__glow" }),
      h("span", { class: "gift3d__shadow" }),
      h("span", { class: "gift3d__scene" },
        h("span", { class: "gift3d__body" }, faces(["front", "back", "left", "right", "bottom", "inside"])),
        h("span", { class: "gift3d__lid" },
          faces(["front", "back", "left", "right", "top"]),
          h("span", { class: "gift3d__bow" },
            h("span", { class: "bow-loop bow-loop--l" }),
            h("span", { class: "bow-loop bow-loop--r" }),
            h("span", { class: "bow-knot" }),
            h("span", { class: "bow-tail bow-tail--l" }),
            h("span", { class: "bow-tail bow-tail--r" })
          )
        )
      )
    );
  }

  MB.decor = { flowerSVG, flowerRow, butterfly, butterflies: butterflies_, balloons, floatingHearts, giftBox, FLOWER_TYPES: TYPES };
})();
