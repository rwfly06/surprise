/* Sistem partikel kanvas tunggal: hujan kelopak (fitur lama), cahaya ambient,
   ledakan kelopak, confetti, kilau, dan hati. Jumlah partikel adaptif. */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});
  const Q = MB.quality;

  const PETAL_COLORS = ["#F7C9D9", "#ECAAC5", "#FFD9C7", "#E9DDF7", "#DCCCF5", "#FFF0F5"];
  const CONFETTI_COLORS = ["#F7C9D9", "#ECAAC5", "#FFD9C7", "#DCCCF5", "#E8D4A5", "#FFFFFF", "#C9A7EB", "#F4B6C2"];
  const SPARK_COLORS = ["#FFF4D6", "#E8D4A5", "#FFFFFF", "#F7C9D9"];

  let canvas, ctx, W = 0, H = 0, dpr = 1;
  let ambient = [];
  let fx = [];
  let running = false;
  let ambientOn = false;
  let last = 0;
  const spriteCache = new Map();
  const MAX_FX = Math.round(900 * Math.max(0.45, Q.scale));

  function glowSprite(color) {
    if (spriteCache.has(color)) return spriteCache.get(color);
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    spriteCache.set(color, c);
    return c;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, Q.level === "high" ? 2 : 1.25);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeAmbientPetal(initial) {
    return {
      kind: "petal",
      x: Math.random() * W,
      y: initial ? Math.random() * H : -20 - Math.random() * 60,
      rx: 3 + Math.random() * 3.5,
      ry: 5.5 + Math.random() * 5,
      color: MB.pick(PETAL_COLORS),
      speed: 0.35 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
      vr: -0.03 + Math.random() * 0.06,
      flip: Math.random() * Math.PI,
      vf: 0.02 + Math.random() * 0.04,
      alpha: 0.55 + Math.random() * 0.35,
    };
  }

  function makeMote() {
    return {
      kind: "mote",
      x: Math.random() * W,
      y: Math.random() * H,
      size: 6 + Math.random() * 16,
      vx: -0.15 + Math.random() * 0.3,
      vy: -0.1 - Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      color: MB.pick(SPARK_COLORS),
    };
  }

  function setAmbient(on) {
    ambientOn = on;
    if (on && !ambient.length) {
      const petals = Math.round(70 * Q.scale);
      const motes = Math.round(26 * Q.scale);
      for (let i = 0; i < petals; i++) ambient.push(makeAmbientPetal(true));
      for (let i = 0; i < motes; i++) ambient.push(makeMote());
    }
    if (!on) ambient = [];
    start();
  }

  function drawPetal(p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(Math.max(0.25, Math.abs(Math.cos(p.flip || 0))), 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-p.rx * 0.3, -p.ry * 0.3, p.rx * 0.35, p.ry * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHeart(x, y, s, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s / 16, s / 16);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-9, -2, -7, -11, 0, -6);
    ctx.bezierCurveTo(7, -11, 9, -2, 0, 5);
    ctx.fill();
    ctx.restore();
  }

  function drawSpark(p, alpha) {
    const s = p.size;
    ctx.globalAlpha = alpha;
    ctx.drawImage(glowSprite(p.color), p.x - s, p.y - s, s * 2, s * 2);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    const r = s * 0.55;
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(3, (now - (last || now)) / 16.67);
    last = now;
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    ctx.clearRect(0, 0, W, H);

    if (ambientOn) {
      for (let i = 0; i < ambient.length; i++) {
        const p = ambient[i];
        if (p.kind === "petal") {
          p.y += p.speed * dt;
          p.x += Math.sin(p.y * 0.012 + p.phase) * 0.6 * dt;
          p.rot += p.vr * dt;
          p.flip += p.vf * dt;
          if (p.y > H + 20) ambient[i] = makeAmbientPetal(false);
          drawPetal(p, p.alpha);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.phase += 0.03 * dt;
          if (p.y < -30 || p.x < -30 || p.x > W + 30) {
            Object.assign(p, makeMote(), { y: H + 20 });
          }
          ctx.globalAlpha = 0.25 + Math.sin(p.phase) * 0.2;
          ctx.drawImage(glowSprite(p.color), p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      }
    }

    let w = 0;
    for (let i = 0; i < fx.length; i++) {
      const p = fx[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vx *= Math.pow(p.drag, dt);
      p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
      p.x += p.vx * dt + (p.sway ? Math.sin((p.life + p.phase) * 0.08) * p.sway * dt : 0);
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      const a = Math.min(1, p.life / p.fade) * (p.alpha || 1);
      if (p.kind === "petal") drawPetal(p, a);
      else if (p.kind === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else if (p.kind === "spark") drawSpark(p, a);
      else if (p.kind === "heart") drawHeart(p.x, p.y, p.size, p.rot, p.color, a);
      fx[w++] = p;
    }
    fx.length = w;
    ctx.globalAlpha = 1;

    if (!ambientOn && !fx.length) {
      running = false;
      ctx.clearRect(0, 0, W, H);
      return;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !canvas) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }

  function push(p) {
    if (fx.length >= MAX_FX) fx.shift();
    fx.push(
      Object.assign(
        { vx: 0, vy: 0, g: 0, drag: 0.98, rot: 0, vr: 0, flip: 0, vf: 0, fade: 30, phase: Math.random() * 100, sway: 0 },
        p
      )
    );
  }

  const n = (count) => Math.max(4, Math.round(count * (Q.reducedMotion ? 0.3 : Math.max(0.45, Q.scale))));

  /* Ledakan dari satu titik (layar). types: petal | spark | heart | confetti */
  function burst(x, y, { count = 50, types = ["petal", "spark"], power = 7, up = 2.5, spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
    const total = n(count);
    for (let i = 0; i < total; i++) {
      const kind = types[i % types.length];
      const ang = angle + (Math.random() - 0.5) * spread;
      const v = power * (0.35 + Math.random() * 0.75);
      const base = { x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - up * Math.random(), life: 70 + Math.random() * 50, fade: 35 };
      if (kind === "petal")
        push({ ...base, kind, rx: 3 + Math.random() * 3, ry: 5 + Math.random() * 4, color: MB.pick(PETAL_COLORS), g: 0.1, vr: (Math.random() - 0.5) * 0.2, vf: 0.05 + Math.random() * 0.1 });
      else if (kind === "spark")
        push({ ...base, kind, size: 5 + Math.random() * 9, color: MB.pick(SPARK_COLORS), g: 0.02, drag: 0.95, vr: 0.05, life: 45 + Math.random() * 35, fade: 25 });
      else if (kind === "heart")
        push({ ...base, kind, size: 10 + Math.random() * 12, color: MB.pick(["#ECAAC5", "#F7C9D9", "#E58BB0", "#F4B6C2"]), g: -0.03, drag: 0.96, vr: (Math.random() - 0.5) * 0.05, life: 90 + Math.random() * 50, fade: 40 });
      else if (kind === "confetti")
        push({ ...base, kind, w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, round: Math.random() < 0.25, color: MB.pick(CONFETTI_COLORS), g: 0.14, drag: 0.97, vr: (Math.random() - 0.5) * 0.3, vf: 0.1 + Math.random() * 0.2, sway: 0.5, life: 140 + Math.random() * 60, fade: 40 });
    }
    start();
  }

  /* Confetti berjatuhan dari atas layar */
  function confetti({ count = 160 } = {}) {
    const total = n(count);
    for (let i = 0; i < total; i++) {
      push({
        kind: "confetti",
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 2.5,
        g: 0.03,
        drag: 0.99,
        w: 6 + Math.random() * 7,
        h: 3 + Math.random() * 5,
        round: Math.random() < 0.2,
        color: MB.pick(CONFETTI_COLORS),
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        vf: 0.08 + Math.random() * 0.18,
        sway: 0.9,
        life: 260 + Math.random() * 120,
        fade: 50,
      });
    }
    start();
  }

  /* Hati melayang naik dari sebuah titik */
  function hearts(x, y, count = 14) {
    burst(x, y, { count, types: ["heart"], power: 3, up: 3, spread: Math.PI * 0.9 });
  }

  function burstAt(el, opts) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  function init() {
    canvas = document.getElementById("fx");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    addEventListener("resize", resize);
  }

  MB.fx = { init, setAmbient, burst, burstAt, confetti, hearts };
})();
