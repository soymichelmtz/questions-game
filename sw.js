// Service Worker simple para cache offline
const CACHE = 'qpair-cache-v10';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js?v=11',
  './manifest.json'
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Ignorar esquemas no soportados y métodos no-GET (p.ej. chrome-extension:, data:, blob:)
  if (req.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.protocol === 'chrome-extension:') return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      // Cachear solo same-origin para evitar errores con orígenes externos
      if (url.origin === self.location.origin) {
        const c = await caches.open(CACHE);
        c.put(req, resp.clone());
      }
      return resp;
    } catch (err) {
      // Para navegaciones, cae a index.html si offline
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      return new Response('Offline', { status: 504, statusText: 'offline' });
    }
  })());
});
