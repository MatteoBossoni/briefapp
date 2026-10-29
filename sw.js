/* Magazzino – service worker.
   Pagina e config: prima la rete (così gli aggiornamenti arrivano subito), copia salvata se offline.
   Icone e font: dalla copia salvata. */
const V = 'rf-5';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  const fresh = same && (req.mode === 'navigate' || /\.(html|js|webmanifest)$/.test(url.pathname));
  e.respondWith(caches.open(V).then(async c => {
    if (fresh) {
      try {
        const r = await fetch(req, { cache: 'no-cache' });
        if (r.ok) c.put(req.mode === 'navigate' ? './' : req, r.clone());
        return r;
      } catch (_) {
        return (await c.match(req, { ignoreSearch: true })) || c.match('./');
      }
    }
    const hit = await c.match(req);
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok || r.type === 'opaque') c.put(req, r.clone());
    return r;
  }));
});
