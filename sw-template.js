/* Ayl K'erp service worker — generated into dist/sw.js at build time.
 * The version and precache list below are injected by the Vite plugin (vite.config.ts). */
const VERSION = '__VERSION__';
const CACHE = `ayl-kerp-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ayl-kerp-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: serve the cached app shell (works offline), refresh in background.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) caches.open(CACHE).then((c) => c.put('/index.html', res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Static assets: cache first, fall back to network and store the result.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => new Response('Offline', { status: 503, statusText: 'Offline' })),
    ),
  );
});
