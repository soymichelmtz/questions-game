// Service Worker simple para cache offline
const CACHE = 'qpair-cache-v6';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js?v=8',
  './manifest.json'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(nr => {
      const copy = nr.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return nr;
    }).catch(() => caches.match('./index.html')))
  );
});
