/* ===== Konfigurasi ===== */
const NAMA = "Bibi Iche Andriyani";
const PESAN =
  "Selamat ulang tahun, Bibi Iche! 🌷 Semoga panjang umur, sehat selalu, dan " +
  "hari-harinya senantiasa mekar penuh kebahagiaan seperti bunga di musim semi. " +
  "Semoga setiap doa dan harapan Bibi tahun ini bermekaran indah. " +
  "Terima kasih sudah menjadi bibi yang penuh kasih sayang. 💐";

document.getElementById("name").textContent = NAMA + " 🌸";

/* ===== Intro bunga kuncup ===== */
const intro = document.getElementById("intro");
const main = document.getElementById("main");
const bud = document.getElementById("bud");
let opened = false;

bud.addEventListener("click", () => {
  if (opened) return;
  opened = true;
  bud.classList.add("bloom");
  setTimeout(() => {
    intro.classList.add("fade");
    main.classList.remove("hidden");
    setTimeout(() => intro.remove(), 900);
    typeMessage();
    startPetals();
    spawnFloats();
    startMelody(); // izin audio sudah didapat lewat klik ini
  }, 1100);
});

/* ===== Pesan efek ketik ===== */
function typeMessage() {
  const el = document.getElementById("message");
  let i = 0;
  (function tick() {
    if (i <= PESAN.length) {
      el.textContent = PESAN.slice(0, i++);
      setTimeout(tick, 28);
    }
  })();
}

/* ===== Fallback foto (per foto galeri) ===== */
document.querySelectorAll(".gallery-photo").forEach((img) => {
  const show = () => {
    img.style.display = "none";
    img.nextElementSibling.hidden = false;
  };
  img.addEventListener("error", show);
  if (img.complete && img.naturalWidth === 0) show();
});

/* ===== Hujan kelopak bunga ===== */
const PETAL_COLORS = ["#ffb7c5", "#ff8fab", "#ffd1dc", "#f9bec7", "#e8b7e5", "#fff0f5"];
let petalCtx = null;

function startPetals() {
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  petalCtx = ctx;
  let petals = [];

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener("resize", resize);

  for (let i = 0; i < 90; i++) {
    petals.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      rx: 3.5 + Math.random() * 3.5,   // jari-jari kelopak
      ry: 6 + Math.random() * 5,
      color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      speed: 0.9 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI,
      rotSpeed: -0.04 + Math.random() * 0.08,
    });
  }

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of petals) {
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.012 + p.phase) * 0.9;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      drawPetal(ctx, p.x, p.y, p.rx, p.ry, p.rot, p.color, 0.9);
    }
    drawBurst(ctx);
    requestAnimationFrame(draw);
  })();
}

function drawPetal(ctx, x, y, rx, ry, rot, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ===== Bunga & kupu-kupu melayang ===== */
function spawnFloats() {
  const wrap = document.getElementById("floats");
  const emojis = ["🦋", "🌸", "🌷", "🌹", "💐", "🌼", "🦋", "🌸"];
  for (let i = 0; i < 12; i++) {
    const b = document.createElement("span");
    b.className = "float-item";
    b.textContent = emojis[(Math.random() * emojis.length) | 0];
    b.style.left = Math.random() * 95 + "vw";
    b.style.fontSize = 1.6 + Math.random() * 2 + "rem";
    b.style.animationDuration = 10 + Math.random() * 10 + "s";
    b.style.animationDelay = Math.random() * 9 + "s";
    wrap.appendChild(b);
  }
}

/* ===== Melodi "Selamat Ulang Tahun" (Web Audio API) ===== */
let audioCtx = null;
let melodyTimer = null;
let playing = false;
const musicBtn = document.getElementById("musicBtn");

/* nada: [frekuensi Hz, durasi ketukan] — Happy Birthday in C */
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
  A4: 440.0, Bb4: 466.16, B4: 493.88, C5: 523.25,
};
const MELODY = [
  [N.C4, 0.75], [N.C4, 0.25], [N.D4, 1], [N.C4, 1], [N.F4, 1], [N.E4, 2],
  [N.C4, 0.75], [N.C4, 0.25], [N.D4, 1], [N.C4, 1], [N.G4, 1], [N.F4, 2],
  [N.C4, 0.75], [N.C4, 0.25], [N.C5, 1], [N.A4, 1], [N.F4, 1], [N.E4, 1], [N.D4, 2],
  [N.Bb4, 0.75], [N.Bb4, 0.25], [N.A4, 1], [N.F4, 1], [N.G4, 1], [N.F4, 2.5],
];
const BEAT = 0.42; // detik per ketukan

function playNote(freq, start, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.28, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.95);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

/* lonceng kecil sebagai hiasan */
function playSparkle(start) {
  const freqs = [N.C5 * 2, N.G4 * 2, N.E4 * 2];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, start + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.12, start + i * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.07 + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start + i * 0.07);
    osc.stop(start + i * 0.07 + 0.55);
  });
}

function scheduleMelody() {
  let t = audioCtx.currentTime + 0.15;
  playSparkle(t);
  t += 0.6;
  for (const [freq, beats] of MELODY) {
    playNote(freq, t, beats * BEAT);
    t += beats * BEAT;
  }
  const total = (t - audioCtx.currentTime + 1.2) * 1000;
  melodyTimer = setTimeout(scheduleMelody, total); // ulangi terus
}

function startMelody() {
  if (playing) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  playing = true;
  musicBtn.textContent = "🔊 Melodi Menyala";
  scheduleMelody();
}

function stopMelody() {
  playing = false;
  clearTimeout(melodyTimer);
  if (audioCtx) audioCtx.suspend();
  musicBtn.textContent = "🔇 Putar Melodi";
}

musicBtn.addEventListener("click", () => {
  if (playing) stopMelody();
  else {
    if (audioCtx) audioCtx.resume();
    startMelody();
  }
});

/* ===== Taman bunga: mekar saat diketuk ===== */
const garden = document.getElementById("garden");
const gardenHint = document.getElementById("gardenHint");
let bloomed = false;

garden.addEventListener("click", () => {
  if (bloomed) {
    bloomed = false;
    garden.classList.remove("bloomed");
    gardenHint.textContent = "ketuk taman untuk memekarkan bunga 🌷";
    return;
  }
  bloomed = true;
  garden.classList.add("bloomed");
  gardenHint.textContent = "semoga doa Bibi ikut bermekaran 🌸";
  burstPetals();
});

/* ledakan kelopak saat taman mekar */
let burstParts = [];

function burstPetals() {
  const canvas = document.getElementById("petals");
  const rect = garden.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 50; i++) {
    const ang = Math.random() * Math.PI * 2;
    const v = 2.5 + Math.random() * 5;
    burstParts.push({
      x: cx, y: cy,
      vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 2.5,
      rx: 3 + Math.random() * 3,
      ry: 5 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      rotSpeed: -0.1 + Math.random() * 0.2,
      color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      life: 70 + Math.random() * 40,
      maxLife: 110,
    });
  }
  if (!petalCtx && canvas) {
    // taman diketuk sebelum kanvas jalan (tidak mungkin lewat alur normal, tapi aman)
    startPetals();
  }
}

function drawBurst(ctx) {
  burstParts = burstParts.filter((p) => p.life > 0);
  for (const p of burstParts) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.rot += p.rotSpeed;
    p.life--;
    drawPetal(ctx, p.x, p.y, p.rx, p.ry, p.rot, p.color, Math.min(1, p.life / 40));
  }
}
