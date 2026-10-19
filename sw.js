// Verhoog dit nummer als je index.html vervangt, dan halen telefoons de nieuwe versie op.
const VERSIE = 'praatbord-19';
const BESTANDEN = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
const WACHT_MS = 3000; // zo lang wachten op internet, daarna de bewaarde versie

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BESTANDEN.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSIE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// De app zelf: eerst van internet (dus altijd de nieuwste versie), zonder internet de bewaarde versie.
// Pictogrammen en het manifest: eerst uit de opslag.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isPage) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSIE);
      try {
        const net = await Promise.race([
          fetch(e.request, {cache: 'no-store'}),
          new Promise((_, rej) => setTimeout(() => rej(new Error('traag')), WACHT_MS))
        ]);
        if (net && net.ok) { cache.put('./index.html', net.clone()); return net; }
        throw new Error('geen goed antwoord');
      } catch (err) {
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith(caches.open(VERSIE).then(async cache => {
    const cached = await cache.match(e.request, {ignoreSearch: true});
    if (cached) return cached;
    try { const r = await fetch(e.request); if (r && r.ok) cache.put(e.request, r.clone()); return r; }
    catch (err) { return Response.error(); }
  }));
});
