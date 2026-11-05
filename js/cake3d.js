/* Kue ulang tahun 3D (Three.js, dimuat malas saat mendekati section).
   Fallback: kue CSS yang tetap interaktif bila WebGL tidak tersedia. */
(function () {
  "use strict";
  const MB = (window.MB = window.MB || {});
  const { $, h, onVisible } = MB;
  const Q = MB.quality;

  const THREE_SRC = "js/vendor/three.min.js";

  let cfg;
  let lit = true;
  let scene3d = null; // controller Three.js
  let els = {};

  function supportsWebGL() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) {
      return false;
    }
  }

  /* ===== Kue CSS (fallback & poster sebelum 3D siap) ===== */
  function buildCssCake(container, candles) {
    const candleEls = [];
    for (let i = 0; i < candles; i++) {
      candleEls.push(
        h("span", { class: "css-candle", style: { "--i": i } },
          h("span", { class: "css-flame" }),
          h("span", { class: "css-smoke" })
        )
      );
    }
    container.appendChild(
      h("div", { class: "css-cake", "aria-hidden": "true" },
        h("div", { class: "css-cake__candles" }, candleEls),
        h("div", { class: "css-tier css-tier--3" }),
        h("div", { class: "css-tier css-tier--2" }),
        h("div", { class: "css-tier css-tier--1" }),
        h("div", { class: "css-plate" })
      )
    );
  }

  /* ===== Tekstur kanvas ===== */
  function canvasTexture(THREE, w, hgt, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = hgt;
    draw(c.getContext("2d"), w, hgt);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }

  const radialTex = (THREE, inner, outer = "rgba(255,255,255,0)") =>
    canvasTexture(THREE, 64, 64, (g) => {
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, inner);
      grad.addColorStop(0.35, inner.replace(/[\d.]+\)$/, "0.5)"));
      grad.addColorStop(1, outer);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    });

  /* ===== Adegan Three.js ===== */
  function createScene(container, candleCount) {
    const THREE = window.THREE;
    const high = Q.level === "high";
    const seg = high ? 72 : Q.level === "medium" ? 48 : 32;

    const renderer = new THREE.WebGLRenderer({ antialias: Q.level !== "low", alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 2 : 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = high;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "cake-canvas";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const target = new THREE.Vector3(0, 2.3, 0);

    scene.add(new THREE.HemisphereLight(0xfff3f8, 0xdcccf5, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(4, 9, 6);
    key.castShadow = high;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = key.shadow.camera.bottom = -5;
    key.shadow.camera.right = key.shadow.camera.top = 5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf7c9d9, 0.45);
    rim.position.set(-5, 4, -6);
    scene.add(rim);
    const candleLight = new THREE.PointLight(0xffb36b, 1.3, 9, 2);
    scene.add(candleLight);

    const cake = new THREE.Group();
    scene.add(cake);
    const disposables = [];
    const mat = (o) => {
      const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.55, metalness: 0 }, o));
      disposables.push(m);
      return m;
    };
    const geo = (g) => (disposables.push(g), g);

    // Piring
    const plate = new THREE.Mesh(geo(new THREE.CylinderGeometry(3.3, 3.05, 0.18, seg)), mat({ color: 0xffffff, roughness: 0.25 }));
    plate.position.y = 0.09;
    plate.receiveShadow = true;
    cake.add(plate);
    const plateRim = new THREE.Mesh(geo(new THREE.TorusGeometry(3.3, 0.05, 10, seg)), mat({ color: 0xe8d4a5, metalness: 0.6, roughness: 0.3 }));
    plateRim.rotation.x = Math.PI / 2;
    plateRim.position.y = 0.18;
    cake.add(plateRim);

    const tiers = [
      { r: 2.4, h: 1.35, color: 0xf7c9d9, frost: 0xfff7ed, pearl: 0xe8d4a5 },
      { r: 1.75, h: 1.15, color: 0xfff7ed, frost: 0xecaac5, pearl: 0xdcccf5 },
      { r: 1.15, h: 1.0, color: 0xdcccf5, frost: 0xfff7ed, pearl: 0xe8d4a5 },
    ];
    const sphereGeo = geo(new THREE.SphereGeometry(1, 14, 10));
    const dummy = new THREE.Object3D();
    let y = 0.18;
    const tierTops = [];

    tiers.forEach((t, ti) => {
      const body = new THREE.Mesh(geo(new THREE.CylinderGeometry(t.r, t.r, t.h, seg)), mat({ color: t.color }));
      body.position.y = y + t.h / 2;
      body.castShadow = body.receiveShadow = high;
      cake.add(body);
      const top = y + t.h;
      tierTops.push({ y: top, r: t.r });

      const frostMat = mat({ color: t.frost, roughness: 0.4 });
      const cap = new THREE.Mesh(geo(new THREE.CylinderGeometry(t.r + 0.03, t.r + 0.03, 0.1, seg)), frostMat);
      cap.position.y = top;
      cake.add(cap);
      const rimT = new THREE.Mesh(geo(new THREE.TorusGeometry(t.r, 0.09, 10, seg)), frostMat);
      rimT.rotation.x = Math.PI / 2;
      rimT.position.y = top + 0.02;
      cake.add(rimT);

      // Lelehan krim
      const dripCount = Math.round(t.r * 13);
      const drips = new THREE.InstancedMesh(sphereGeo, frostMat, dripCount);
      for (let k = 0; k < dripCount; k++) {
        const a = (k / dripCount) * Math.PI * 2 + Math.random() * 0.1;
        const len = 0.14 + Math.random() * 0.32;
        dummy.position.set(Math.cos(a) * (t.r - 0.01), top - len * 0.55, Math.sin(a) * (t.r - 0.01));
        dummy.scale.set(0.085, len, 0.085);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        drips.setMatrixAt(k, dummy.matrix);
      }
      cake.add(drips);

      // Mutiara di dasar tingkat
      const pearlCount = Math.round((Math.PI * 2 * t.r) / 0.19);
      const pearls = new THREE.InstancedMesh(sphereGeo, mat({ color: t.pearl, metalness: 0.35, roughness: 0.2 }), pearlCount);
      for (let k = 0; k < pearlCount; k++) {
        const a = (k / pearlCount) * Math.PI * 2;
        dummy.position.set(Math.cos(a) * (t.r + 0.03), y + 0.08, Math.sin(a) * (t.r + 0.03));
        dummy.scale.setScalar(0.075);
        dummy.updateMatrix();
        pearls.setMatrixAt(k, dummy.matrix);
      }
      cake.add(pearls);

      // Bunga kecil di sisi kue
      if (ti < 2) {
        const flowers = ti === 0 ? 7 : 5;
        for (let k = 0; k < flowers; k++) {
          const a = (k / flowers) * Math.PI * 2 + ti * 0.4;
          addFlower(
            new THREE.Vector3(Math.cos(a) * (t.r + 0.04), y + t.h * 0.5, Math.sin(a) * (t.r + 0.04)),
            new THREE.Vector3(Math.cos(a), 0, Math.sin(a)),
            [0xecaac5, 0xffffff, 0xdcccf5, 0xffd9c7][k % 4],
            0.9
          );
        }
      }
      y = top + 0.05;
    });

    function addFlower(pos, normal, color, scale = 1) {
      const g = new THREE.Group();
      const petalMat = mat({ color, roughness: 0.5 });
      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(sphereGeo, petalMat);
        const a = (p / 5) * Math.PI * 2;
        petal.position.set(Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0);
        petal.scale.set(0.1, 0.1, 0.04);
        g.add(petal);
      }
      const center = new THREE.Mesh(sphereGeo, mat({ color: 0xf4d58d, roughness: 0.4 }));
      center.scale.setScalar(0.06);
      center.position.z = 0.02;
      g.add(center);
      g.position.copy(pos);
      g.lookAt(pos.clone().add(normal));
      g.scale.setScalar(scale);
      cake.add(g);
    }

    // Bunga di atas tingkat teratas
    const topTier = tierTops[2];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      addFlower(new THREE.Vector3(Math.cos(a) * 0.95, topTier.y + 0.08, Math.sin(a) * 0.95), new THREE.Vector3(0, 1, 0), [0xecaac5, 0xfff7ed, 0xf7c9d9][k % 3], 0.8);
    }

    // Lilin
    const stripeTex = canvasTexture(THREE, 32, 128, (g, w, hh) => {
      g.fillStyle = "#fff7ed";
      g.fillRect(0, 0, w, hh);
      g.strokeStyle = "#ecaac5";
      g.lineWidth = 9;
      for (let yy = -w; yy < hh + w; yy += 26) {
        g.beginPath();
        g.moveTo(0, yy);
        g.lineTo(w, yy + w);
        g.stroke();
      }
    });
    stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
    disposables.push(stripeTex);
    const candleMat = mat({ map: stripeTex, roughness: 0.45 });
    const candleGeo = geo(new THREE.CylinderGeometry(0.075, 0.075, 0.9, 16));
    const wickGeo = geo(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6));
    const wickMat = mat({ color: 0x5b4636 });
    const glowTex = radialTex(THREE, "rgba(255,200,120,1)");
    const smokeTex = radialTex(THREE, "rgba(255,255,255,0.9)");
    const sparkTex = radialTex(THREE, "rgba(255,244,214,1)");
    disposables.push(glowTex, smokeTex, sparkTex);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfff6d5 });
    const outerMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    disposables.push(coreMat, outerMat);

    const flames = [];
    const candleTipY = topTier.y + 0.05 + 0.9;
    for (let i = 0; i < candleCount; i++) {
      const a = (i / candleCount) * Math.PI * 2;
      const rr = candleCount > 1 ? 0.5 : 0;
      const cx = Math.cos(a) * rr;
      const cz = Math.sin(a) * rr;
      const candle = new THREE.Mesh(candleGeo, candleMat);
      candle.position.set(cx, topTier.y + 0.05 + 0.45, cz);
      candle.castShadow = high;
      cake.add(candle);
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.set(cx, candleTipY + 0.05, cz);
      cake.add(wick);

      const flame = new THREE.Group();
      const core = new THREE.Mesh(sphereGeo, coreMat);
      core.scale.set(0.055, 0.13, 0.055);
      const outer = new THREE.Mesh(sphereGeo, outerMat);
      outer.scale.set(0.09, 0.2, 0.09);
      outer.position.y = 0.03;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc27a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.set(0.6, 0.6, 1);
      disposables.push(glow.material);
      flame.add(core, outer, glow);
      flame.position.set(cx, candleTipY + 0.2, cz);
      flame.userData = { level: 1, target: 1, delay: 0, phase: Math.random() * 10, glow, baseX: cx };
      cake.add(flame);
      flames.push(flame);
    }
    candleLight.position.set(0, candleTipY + 0.6, 0);

    // Glitter berjatuhan
    const glitterCount = Math.round(320 * Math.max(0.35, Q.scale));
    const gPos = new Float32Array(glitterCount * 3);
    const gCol = new Float32Array(glitterCount * 3);
    const gSpeed = new Float32Array(glitterCount);
    const palette = [new THREE.Color(0xfff1c9), new THREE.Color(0xf7c9d9), new THREE.Color(0xffffff), new THREE.Color(0xdcccf5)];
    for (let i = 0; i < glitterCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 3.6;
      gPos.set([Math.cos(a) * r, Math.random() * 7, Math.sin(a) * r], i * 3);
      const c = palette[i % palette.length];
      gCol.set([c.r, c.g, c.b], i * 3);
      gSpeed[i] = 0.004 + Math.random() * 0.01;
    }
    const glitterGeo = geo(new THREE.BufferGeometry());
    glitterGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
    glitterGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
    const glitterMat = new THREE.PointsMaterial({ size: 0.11, map: sparkTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    disposables.push(glitterMat);
    const glitter = new THREE.Points(glitterGeo, glitterMat);
    scene.add(glitter);

    // Kupu-kupu yang mengitari kue
    const wingTex = canvasTexture(THREE, 128, 128, (g) => {
      g.translate(64, 64);
      const wing = (fill, path) => {
        g.fillStyle = fill;
        g.strokeStyle = "#fff";
        g.lineWidth = 3;
        g.fill(path);
        g.stroke(path);
      };
      wing("#F7C9D9", new Path2D("M0 0 C10 -50 60 -60 60 -25 C60 -5 30 0 0 0Z"));
      wing("#ECAAC5", new Path2D("M0 2 C30 2 55 20 45 45 C30 60 5 35 0 2Z"));
      g.fillStyle = "rgba(255,255,255,.7)";
      g.beginPath();
      g.arc(38, -30, 7, 0, Math.PI * 2);
      g.fill();
    });
    disposables.push(wingTex);
    const butterflies = [];
    const bfCount = Q.level === "low" ? 1 : 2;
    const wingGeo = geo(new THREE.PlaneGeometry(0.7, 0.7));
    wingGeo.rotateX(-Math.PI / 2);
    wingGeo.translate(0.35, 0, 0);
    const wingMat = new THREE.MeshBasicMaterial({ map: wingTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.05 });
    disposables.push(wingMat);
    for (let i = 0; i < bfCount; i++) {
      const g = new THREE.Group();
      const r = new THREE.Mesh(wingGeo, wingMat);
      const l = new THREE.Mesh(wingGeo, wingMat);
      l.scale.x = -1;
      g.add(r, l);
      g.scale.setScalar(0.55);
      g.userData = { r, l, speed: 0.35 + i * 0.12, radius: 3.4 + i * 0.6, height: 3.2 + i * 1.1, phase: i * Math.PI };
      scene.add(g);
      butterflies.push(g);
    }

    // Asap & kilau saat lilin ditiup
    const smokeMat = new THREE.SpriteMaterial({ map: smokeTex, color: 0xf5eef2, transparent: true, depthWrite: false, opacity: 0 });
    disposables.push(smokeMat);
    const smoke = [];
    const sparks = [];

    function emitSmoke() {
      flames.forEach((f) => {
        for (let k = 0; k < 9; k++) {
          const s = new THREE.Sprite(smokeMat.clone());
          s.position.copy(f.position).add(new THREE.Vector3(0, 0.05, 0));
          cake.localToWorld(s.position);
          s.scale.setScalar(0.12);
          s.userData = { life: 0, max: 1.8 + Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.15, vy: 0.35 + Math.random() * 0.3, delay: k * 0.08 };
          scene.add(s);
          smoke.push(s);
        }
      });
    }

    function emitSparks(count = 70) {
      const n = Math.round(count * Math.max(0.5, Q.scale));
      const pos = new Float32Array(n * 3);
      const vel = [];
      const origin = new THREE.Vector3(0, candleTipY + 0.3, 0);
      for (let i = 0; i < n; i++) {
        pos.set([origin.x, origin.y, origin.z], i * 3);
        const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9, Math.random() - 0.5).normalize().multiplyScalar(1.5 + Math.random() * 2.5);
        vel.push(dir);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ size: 0.16, map: sparkTex, color: 0xfff1c9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const p = new THREE.Points(g, m);
      p.userData = { vel, life: 0, max: 1.6 };
      scene.add(p);
      sparks.push(p);
    }

    // ===== Interaksi drag untuk memutar kue =====
    let rotVel = 0;
    let dragging = false;
    let lastX = 0;
    let mouseX = 0;
    let mouseY = 0;
    const canvas = renderer.domElement;
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width - 0.5;
      mouseY = (e.clientY - r.top) / r.height - 0.5;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      rotVel = dx * 0.006;
      cake.rotation.y += rotVel;
    };
    const onUp = () => (dragging = false);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    // ===== Ukuran & kamera responsif =====
    function resize() {
      const w = container.clientWidth;
      const hh = container.clientHeight;
      if (!w || !hh) return;
      renderer.setSize(w, hh, false);
      camera.aspect = w / hh;
      const vf = (camera.fov * Math.PI) / 180;
      const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
      const dist = Math.max(4.2 / Math.tan(hf / 2), 3.6 / Math.tan(vf / 2)) + 1;
      const dir = new THREE.Vector3(0, 0.42, 1).normalize();
      camera.userData.base = dir.multiplyScalar(dist).add(target);
      camera.position.copy(camera.userData.base);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // ===== Loop render (hanya saat terlihat) =====
    const clock = new THREE.Clock();
    let visible = false;
    let raf = 0;
    let t = 0;

    function animate() {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, clock.getDelta());
      t += dt;

      if (!dragging) {
        rotVel *= 0.94;
        cake.rotation.y += rotVel + (Q.reducedMotion ? 0 : dt * 0.12);
      }

      const base = camera.userData.base;
      if (base) {
        camera.position.x += (base.x + mouseX * 1.2 - camera.position.x) * 0.05;
        camera.position.y += (base.y - mouseY * 0.8 - camera.position.y) * 0.05;
        camera.lookAt(target);
      }

      let lightSum = 0;
      flames.forEach((f, i) => {
        const u = f.userData;
        if (u.delay > 0) u.delay -= dt;
        else u.level += (u.target - u.level) * Math.min(1, dt * (u.target ? 6 : 9));
        const flicker = 1 + Math.sin(t * 13 + u.phase) * 0.07 + Math.sin(t * 23 + i) * 0.04;
        const s = Math.max(0.0001, u.level);
        f.scale.set(s, s * flicker, s);
        f.position.x = u.baseX + Math.sin(t * 7 + u.phase) * 0.008 * s;
        u.glow.material.opacity = 0.45 * u.level;
        lightSum += u.level;
      });
      candleLight.intensity = (lightSum / Math.max(1, flames.length)) * (1.2 + Math.sin(t * 17) * 0.12);

      const p = glitterGeo.attributes.position.array;
      for (let i = 0; i < glitterCount; i++) {
        p[i * 3 + 1] -= gSpeed[i] * (dt * 60);
        if (p[i * 3 + 1] < 0) p[i * 3 + 1] = 7;
      }
      glitterGeo.attributes.position.needsUpdate = true;
      glitterMat.opacity = 0.7 + Math.sin(t * 3) * 0.25;
      glitter.rotation.y += dt * 0.05;

      butterflies.forEach((b) => {
        const u = b.userData;
        const a = t * u.speed + u.phase;
        const pos = new THREE.Vector3(Math.cos(a) * u.radius, u.height + Math.sin(t * 1.4 + u.phase) * 0.4, Math.sin(a) * u.radius);
        const next = new THREE.Vector3(Math.cos(a + 0.05) * u.radius, pos.y, Math.sin(a + 0.05) * u.radius);
        b.position.copy(pos);
        b.lookAt(next);
        const flap = Math.sin(t * 16 + u.phase) * 0.9;
        u.r.rotation.z = flap;
        u.l.rotation.z = -flap;
      });

      for (let i = smoke.length - 1; i >= 0; i--) {
        const s = smoke[i];
        const u = s.userData;
        if (u.delay > 0) {
          u.delay -= dt;
          continue;
        }
        u.life += dt;
        const k = u.life / u.max;
        s.position.x += u.vx * dt + Math.sin(u.life * 3) * 0.002;
        s.position.y += u.vy * dt;
        s.scale.setScalar(0.12 + k * 0.9);
        s.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.45;
        if (k >= 1) {
          scene.remove(s);
          s.material.dispose();
          smoke.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        const u = sp.userData;
        u.life += dt;
        const arr = sp.geometry.attributes.position.array;
        u.vel.forEach((v, j) => {
          v.y -= dt * 1.2;
          v.multiplyScalar(0.985);
          arr[j * 3] += v.x * dt;
          arr[j * 3 + 1] += v.y * dt;
          arr[j * 3 + 2] += v.z * dt;
        });
        sp.geometry.attributes.position.needsUpdate = true;
        sp.material.opacity = Math.max(0, 1 - u.life / u.max);
        if (u.life >= u.max) {
          scene.remove(sp);
          sp.geometry.dispose();
          sp.material.dispose();
          sparks.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) {
          clock.getDelta();
          raf = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );
    io.observe(container);
    const onVis = () => {
      if (!document.hidden && visible && !raf) {
        clock.getDelta();
        raf = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return {
      canvas,
      blow() {
        flames.forEach((f, i) => {
          f.userData.target = 0;
          f.userData.delay = i * 0.08;
        });
        setTimeout(emitSmoke, 250);
        setTimeout(() => emitSparks(80), 400);
      },
      relight() {
        flames.forEach((f, i) => {
          f.userData.target = 1;
          f.userData.delay = i * 0.1;
        });
        emitSparks(40);
      },
      dispose() {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        disposables.forEach((d) => d.dispose && d.dispose());
        renderer.dispose();
        canvas.remove();
      },
    };
  }

  /* ===== Kontrol ===== */
  function blow() {
    if (!lit) return;
    lit = false;
    MB.audio.sfx("blow");
    els.stage.classList.add("is-blown");
    els.blowBtn.disabled = true;
    if (scene3d) scene3d.blow();
    setTimeout(() => {
      MB.fx.burstAt(els.stage, { count: 60, types: ["spark", "petal", "heart"], power: 8 });
      MB.fx.confetti({ count: 180 });
      MB.audio.sfx("confetti");
      setTimeout(() => MB.audio.sfx("bell"), 300);
      els.message.hidden = false;
      requestAnimationFrame(() => els.message.classList.add("is-visible"));
      els.relightBtn.hidden = false;
    }, 700);
  }

  function relight() {
    if (lit) return;
    lit = true;
    MB.audio.sfx("sparkle");
    els.stage.classList.remove("is-blown");
    els.blowBtn.disabled = false;
    els.relightBtn.hidden = true;
    els.message.classList.remove("is-visible");
    els.message.hidden = true;
    if (scene3d) scene3d.relight();
    els.blowBtn.focus({ preventScroll: true });
  }

  function fallbackToCss(reason) {
    if (reason) console.warn("[cake] Memakai kue CSS:", reason);
    if (scene3d) {
      try {
        scene3d.dispose();
      } catch (e) {
        /* abaikan */
      }
      scene3d = null;
    }
    els.stage.classList.remove("is-3d");
    els.stage.classList.add("is-fallback");
  }

  function init(config) {
    cfg = config.cake || {};
    const candles = Math.min(9, Math.max(1, cfg.candles || 5));
    els = {
      stage: $("#cakeStage"),
      blowBtn: $("#blowBtn"),
      relightBtn: $("#relightBtn"),
      message: $("#wishMessage"),
      hint: $("#cakeHint"),
    };
    buildCssCake($("#cakeFallback"), candles);
    els.blowBtn.addEventListener("click", blow);
    els.relightBtn.addEventListener("click", relight);

    if (!supportsWebGL()) return fallbackToCss("WebGL tidak didukung");

    onVisible(
      els.stage,
      () => {
        els.stage.classList.add("is-loading");
        const ready = window.THREE ? Promise.resolve() : MB.loadScript(THREE_SRC);
        ready
          .then(() => {
            scene3d = createScene($("#cake3d"), candles);
            scene3d.canvas.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              fallbackToCss("WebGL context lost");
            });
            if (!lit) scene3d.blow();
            els.stage.classList.add("is-3d");
          })
          .catch((err) => fallbackToCss(err.message))
          .finally(() => els.stage.classList.remove("is-loading"));
      },
      { threshold: 0, rootMargin: "600px 0px" }
    );
    addEventListener("pagehide", (e) => {
      if (!e.persisted && scene3d) scene3d.dispose();
    });
  }

  MB.cake = { init, blow, relight };
})();
