/* Service worker sederhana: network-first + cache fallback.
   Konten selalu diambil terbaru saat online; saat offline memakai cache. */
const CACHE = "mama-bday-v1";
const CORE = [
  "./",
  "index.html",
  "css/style.css",
  "css/sections.css",
  "js/config.js",
  "js/utils.js",
  "js/audio.js",
  "js/particles.js",
  "js/decor.js",
  "js/gallery.js",
  "js/cake3d.js",
  "js/sections.js",
  "js/main.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith("http") || req.headers.has("range")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});
