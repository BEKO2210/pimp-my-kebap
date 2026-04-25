// Powered by skill: pwa
// Minimal Workbox-free service worker. Cache-first for static assets,
// network-first for HTML, custom offline fallback.

const CACHE_VERSION = 'pmk-v1';
const STATIC_PATTERNS = [/\/assets\//, /\/fonts\//, /\/images\//, /\/icons\//, /\/brand\//];
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(['/', OFFLINE_URL])).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Static assets: cache-first
  if (STATIC_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
            return res;
          }),
      ),
    );
    return;
  }

  // HTML: network-first, fallback to cached or offline page
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL).then((r) => r || new Response('Offline', { status: 503 }))),
        ),
    );
  }
});
