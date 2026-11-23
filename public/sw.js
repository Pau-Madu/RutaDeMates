// Service worker de Ruta de Mates: la app abre rápido y aguanta sin conexión.
// Los datos (Firestore) no pasan por aquí: Firebase tiene su propia caché.
const CACHE = "ruta-de-mates-v1";
const SHELL = ["./", "index.html", "firebase-config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const cdn = /(^|\.)gstatic\.com$|cdnjs\.cloudflare\.com$|fonts\.googleapis\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !cdn) return;
  if (url.pathname.startsWith("/__/")) return; // páginas de inicio de sesión de Firebase
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("firebase-config.js")) {
    // Red primero para tener siempre la última versión; caché si no hay conexión.
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; })));
});
