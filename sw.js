// Verhoog dit nummer als je index.html vervangt, dan halen telefoons de nieuwe versie op.
const VERSIE = 'praatbord-13';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BESTANDEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSIE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Eerst uit de opslag op de telefoon, daarna op de achtergrond verversen. Lettertypes worden ook bewaard.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(VERSIE).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(e.request, r.clone()); return r; }).catch(() => null);
    return cached || (await net) || cache.match('./index.html');
  }));
});
