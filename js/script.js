/* ===== Konfigurasi ===== */
const NAMA = "Kak Santika Anastasya";
const PESAN =
  "Selamat bertambah umur, Kak Santika! 🎂 Semoga panjang umur, sehat selalu, " +
  "makin cantik, makin bahagia, dan semua cita-citanya tercapai. " +
  "Terima kasih sudah jadi kakak sepupu terbaik. 🥳";

/* ===== Intro kado ===== */
const intro = document.getElementById("intro");
const main = document.getElementById("main");
const gift = document.getElementById("gift");

gift.addEventListener("click", () => {
  intro.classList.add("fade");
  main.classList.remove("hidden");
  setTimeout(() => intro.remove(), 900);
  typeMessage();
  startConfetti();
  spawnBalloons();
  startMelody(); // izin audio sudah didapat lewat klik ini
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

/* ===== Fallback foto ===== */
const photo = document.getElementById("photo");
function showPhotoFallback() {
  photo.style.display = "none";
  document.getElementById("photoFallback").hidden = false;
}
photo.addEventListener("error", showPhotoFallback);
if (photo.complete && photo.naturalWidth === 0) showPhotoFallback();

/* ===== Konfeti ===== */
function startConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const colors = ["#ff7eb3", "#f7c873", "#8f6bd8", "#7ee8fa", "#ff9ec7", "#fff"];
  let pieces = [];

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener("resize", resize);

  for (let i = 0; i < 140; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      color: colors[(Math.random() * colors.length) | 0],
      speed: 1.5 + Math.random() * 3,
      drift: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI,
      rotSpeed: -0.08 + Math.random() * 0.16,
    });
  }

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.y += p.speed;
      p.x += p.drift;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  })();
}

/* ===== Balon ===== */
function spawnBalloons() {
  const wrap = document.getElementById("balloons");
  const emojis = ["🎈", "🎈", "🎈", "🎀", "💖", "⭐"];
  for (let i = 0; i < 12; i++) {
    const b = document.createElement("span");
    b.className = "balloon";
    b.textContent = emojis[(Math.random() * emojis.length) | 0];
    b.style.left = Math.random() * 95 + "vw";
    b.style.fontSize = 2 + Math.random() * 2.2 + "rem";
    b.style.animationDuration = 9 + Math.random() * 9 + "s";
    b.style.animationDelay = Math.random() * 8 + "s";
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

/* ===== Tiup lilin ===== */
const cake = document.getElementById("cake");
const flame = document.getElementById("flame");
const cakeHint = document.getElementById("cakeHint");
let blown = false;

cake.addEventListener("click", () => {
  if (blown) {
    // nyalakan lagi
    blown = false;
    flame.classList.remove("out");
    cakeHint.textContent = "ketuk kue untuk tiup lilin 🕯️";
    return;
  }
  blown = true;
  flame.classList.add("out");
  cakeHint.textContent = "yeay! semoga semua doanya terkabul 🌟";
  burstConfetti();
});

/* ledakan konfeti kecil saat lilin ditiup */
function burstConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const colors = ["#ff7eb3", "#f7c873", "#8f6bd8", "#7ee8fa", "#fff"];
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const parts = [];
  for (let i = 0; i < 60; i++) {
    const ang = Math.random() * Math.PI * 2;
    const v = 3 + Math.random() * 6;
    parts.push({
      x: cx, y: cy,
      vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 2,
      size: 4 + Math.random() * 5,
      color: colors[(Math.random() * colors.length) | 0],
      life: 60 + Math.random() * 30,
    });
  }
  (function anim() {
    let alive = false;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    if (alive) requestAnimationFrame(anim);
  })();
}
