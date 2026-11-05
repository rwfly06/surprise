/* Sistem audio: musik latar (file atau piano sintetis bebas hak cipta) + efek suara.
   Audio TIDAK pernah diputar sebelum ada interaksi pengguna. */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});
  const cfg = window.BIRTHDAY_CONFIG || {};
  const musicCfg = cfg.music || {};
  const sfxFiles = cfg.sfx || {};

  const STORE_KEY = "mama-bday-volume";
  let ctx = null;
  let master, musicBus, sfxBus, reverb, reverbSend, noiseBuffer;
  let fileAudio = null;
  let fileFailed = !musicCfg.src;
  let timer = null;
  let track = null;
  let loopStart = 0;
  let idx = 0;
  let playing = false;
  let wasPlayingBeforeHide = false;
  const listeners = new Set();

  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {
        /* mode privat: abaikan */
      }
    },
  };
  let volume = parseFloat(store.get(STORE_KEY));
  if (!Number.isFinite(volume)) volume = musicCfg.volume ?? 0.6;

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  /* ===== Lagu: "Soft Piano Lullaby" (komposisi sendiri, dibuat oleh browser) ===== */
  function buildLullaby() {
    const step = 60 / 66 / 2; // not 1/8 pada 66 BPM
    const chords = [
      { bass: 41, arp: [53, 57, 60, 64] }, // Fmaj7
      { bass: 38, arp: [50, 57, 60, 65] }, // Dm7
      { bass: 46, arp: [50, 53, 57, 62] }, // Bbmaj7
      { bass: 36, arp: [55, 60, 65, 67] }, // Csus4
      { bass: 41, arp: [53, 57, 60, 64] },
      { bass: 38, arp: [50, 57, 60, 65] },
      { bass: 46, arp: [50, 53, 57, 62] },
      { bass: 36, arp: [55, 60, 64, 67] }, // C
    ];
    const melody = [
      [[0, 77], [3, 76], [4, 72], [6, 74]],
      [[0, 72], [4, 69], [6, 72]],
      [[0, 74], [3, 72], [4, 69], [6, 70]],
      [[0, 67], [4, 72]],
      [[0, 77], [2, 79], [4, 81], [6, 79]],
      [[0, 77], [4, 74], [6, 72]],
      [[0, 74], [2, 77], [4, 74], [6, 72]],
      [[0, 72], [4, 67]],
    ];
    const pattern = [0, 1, 2, 3, 2, 3, 1, 2];
    const events = [];
    chords.forEach((c, bar) => {
      const t0 = bar * 8 * step;
      events.push({ t: t0, f: midi(c.bass), d: 4.2, v: 0.34 });
      pattern.forEach((p, s) => events.push({ t: t0 + s * step + 0.01, f: midi(c.arp[p]), d: 1.8, v: 0.16 }));
      melody[bar].forEach(([s, n]) => events.push({ t: t0 + s * step + 0.02, f: midi(n), d: 2.4, v: 0.27 }));
    });
    events.sort((a, b) => a.t - b.t);
    return { events, length: chords.length * 8 * step + 0.4 };
  }

  /* ===== Lagu: melodi "Happy Birthday" (fitur lama, domain publik) ===== */
  function buildBirthday() {
    const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, Bb4: 70, C5: 72 };
    const MELODY = [
      ["C4", 0.75], ["C4", 0.25], ["D4", 1], ["C4", 1], ["F4", 1], ["E4", 2],
      ["C4", 0.75], ["C4", 0.25], ["D4", 1], ["C4", 1], ["G4", 1], ["F4", 2],
      ["C4", 0.75], ["C4", 0.25], ["C5", 1], ["A4", 1], ["F4", 1], ["E4", 1], ["D4", 2],
      ["Bb4", 0.75], ["Bb4", 0.25], ["A4", 1], ["F4", 1], ["G4", 1], ["F4", 2.5],
    ];
    const BEAT = 0.46;
    const events = [{ t: 0, bell: true }];
    let t = 0.6;
    for (const [n, beats] of MELODY) {
      events.push({ t, f: midi(N[n] + 12), d: Math.max(0.6, beats * BEAT * 1.6), v: 0.3 });
      t += beats * BEAT;
    }
    return { events, length: t + 1.4 };
  }

  const TRACKS = {
    piano: { title: musicCfg.title || "Soft Piano Lullaby", build: buildLullaby },
    birthday: { title: "Happy Birthday Melody", build: buildBirthday },
  };
  let trackName = "piano";

  /* ===== Inisialisasi Web Audio ===== */
  function ensureCtx() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(2.4);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.32;
    reverb.connect(reverbSend).connect(master);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
    musicBus.connect(reverb);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);
    sfxBus.connect(reverb);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function makeImpulse(seconds) {
    const len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  /* Suara piano lembut dari beberapa harmonik dengan peluruhan alami */
  function pianoNote(freq, t, dur, vel, dest) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(Math.min(7000, freq * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(500, freq * 2.2), t + dur);
    lp.connect(dest);
    const partials = [[1, 1], [2, 0.42], [3, 0.16], [4, 0.08], [5, 0.035]];
    for (const [n, amp] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * n * (1 + (Math.random() - 0.5) * 0.0015);
      const end = t + dur / (1 + (n - 1) * 0.45);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vel * amp), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(g).connect(lp);
      osc.start(t);
      osc.stop(end + 0.05);
    }
  }

  function bellTone(base, t, vel = 0.12, dest = sfxBus) {
    [1, 2.76, 5.4, 8.93].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = base * ratio;
      const dur = 2.2 / (1 + i * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vel / (1 + i * 0.9), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  function noise(t, dur, { type = "bandpass", from = 800, to = 3000, vel = 0.2, q = 0.8 } = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  /* ===== Scheduler musik (lookahead) ===== */
  function tick() {
    const ahead = ctx.currentTime + 0.5;
    for (let guard = 0; guard < 200; guard++) {
      const ev = track.events[idx];
      const t = loopStart + ev.t;
      if (t > ahead) break;
      if (t >= ctx.currentTime - 0.05) {
        if (ev.bell) [1046.5, 1568, 1318.5].forEach((f, i) => bellTone(f, t + i * 0.08, 0.07, musicBus));
        else pianoNote(ev.f, t, ev.d, ev.v, musicBus);
      }
      idx++;
      if (idx >= track.events.length) {
        idx = 0;
        loopStart += track.length;
      }
    }
  }

  function startSynth() {
    track = TRACKS[trackName].build();
    idx = 0;
    loopStart = ctx.currentTime + 0.15;
    clearInterval(timer);
    timer = setInterval(tick, 120);
    tick();
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.6);
  }

  function stopSynth() {
    clearInterval(timer);
    timer = null;
    if (!ctx) return;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  }

  function useFile() {
    return !fileFailed && trackName === "file";
  }

  function getFileAudio() {
    if (fileAudio) return fileAudio;
    fileAudio = new Audio(musicCfg.src);
    fileAudio.loop = true;
    fileAudio.preload = "none";
    fileAudio.volume = volume;
    fileAudio.addEventListener("error", () => {
      console.warn("[audio] File musik tidak dapat dimuat, beralih ke piano sintetis:", musicCfg.src);
      fileFailed = true;
      if (trackName === "file") {
        trackName = "piano";
        if (playing) startSynth();
      }
      emit();
    });
    return fileAudio;
  }

  function play() {
    if (!ensureCtx()) return;
    playing = true;
    if (useFile()) {
      getFileAudio()
        .play()
        .catch((err) => {
          console.warn("[audio] Tidak bisa memutar file musik:", err.message);
          fileFailed = true;
          trackName = "piano";
          startSynth();
          emit();
        });
    } else startSynth();
    emit();
  }

  function pause() {
    playing = false;
    stopSynth();
    if (fileAudio) fileAudio.pause();
    emit();
  }

  function setTrack(name) {
    if (name === trackName) return;
    const was = playing;
    if (was) pause();
    trackName = name;
    if (was) play();
    emit();
  }

  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    store.set(STORE_KEY, String(volume));
    if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    if (fileAudio) fileAudio.volume = volume;
    emit();
  }

  /* ===== Efek suara ===== */
  const sfxSynth = {
    click() {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.connect(g).connect(sfxBus);
      osc.start(t);
      osc.stop(t + 0.16);
    },
    bell() {
      const t = ctx.currentTime;
      bellTone(1046.5, t, 0.12);
      bellTone(1568, t + 0.12, 0.08);
    },
    giftOpen() {
      const t = ctx.currentTime;
      noise(t, 0.7, { from: 400, to: 4200, vel: 0.12 });
      [72, 76, 79, 84, 88].forEach((n, i) => pianoNote(midi(n), t + 0.12 + i * 0.08, 1.6, 0.18, sfxBus));
      bellTone(2093, t + 0.55, 0.06);
    },
    confetti() {
      const t = ctx.currentTime;
      for (let i = 0; i < 6; i++) noise(t + i * 0.045 + Math.random() * 0.03, 0.09, { type: "highpass", from: 2500, to: 6000, vel: 0.12 });
      bellTone(2637, t + 0.2, 0.04);
    },
    blow() {
      const t = ctx.currentTime;
      noise(t, 0.9, { type: "lowpass", from: 1400, to: 300, vel: 0.22, q: 0.3 });
    },
    sparkle() {
      const t = ctx.currentTime;
      [1046.5, 1568, 1318.5].forEach((f, i) => bellTone(f, t + i * 0.07, 0.06));
    },
  };

  function sfx(name) {
    if (volume <= 0) return;
    if (sfxFiles[name]) {
      const a = new Audio(sfxFiles[name]);
      a.volume = volume;
      a.play().catch(() => {});
      return;
    }
    if (!ensureCtx() || !sfxSynth[name]) return;
    try {
      sfxSynth[name]();
    } catch (err) {
      console.warn("[audio] sfx error", err);
    }
  }

  /* Hemat baterai: jeda musik saat tab disembunyikan */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      wasPlayingBeforeHide = playing;
      if (playing) pause();
    } else if (wasPlayingBeforeHide) {
      wasPlayingBeforeHide = false;
      play();
    }
  });

  function emit() {
    const state = getState();
    listeners.forEach((fn) => fn(state));
  }

  function getState() {
    const tracks = Object.entries(TRACKS).map(([id, t]) => ({ id, title: t.title }));
    if (musicCfg.src && !fileFailed) tracks.unshift({ id: "file", title: musicCfg.title || "Background Music" });
    return { playing, volume, track: trackName, tracks };
  }

  if (musicCfg.src) trackName = "file";

  MB.audio = {
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    setVolume,
    setTrack,
    sfx,
    unlock: ensureCtx,
    get state() {
      return getState();
    },
    onChange(fn) {
      listeners.add(fn);
      fn(getState());
      return () => listeners.delete(fn);
    },
  };
})();
