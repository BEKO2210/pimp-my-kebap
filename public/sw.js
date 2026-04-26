// Powered by skill: pwa
// Versioned service worker. Build step replaces __APP_VERSION__.

const APP_VERSION = '__APP_VERSION__';
const CACHE_NAME = `pmk-${APP_VERSION}`;
const SCOPE = new URL('./', self.location).pathname.replace(/\/$/, '');
const VERSION_URL = `${SCOPE}/__VERSION_JSON_URL__`;
const HTML_TIMEOUT_MS = 3000;

const STATIC_PATTERNS = [/\/assets\//, /\/fonts\//, /\/images\//, /\/icons\//, /\/brand\//, /\.(css|js|mjs|png|jpe?g|webp|avif|svg|woff2?)$/i];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('pmk-') && k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
    startVersionPolling();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => {
      clearTimeout(id);
      resolve(v);
    }).catch((e) => {
      clearTimeout(id);
      reject(e);
    });
  });
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((res) => {
    if (res.ok) void cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  if (cached) {
    void networkPromise;
    return cached;
  }
  const res = await networkPromise;
  return res || Response.error();
}

async function networkFirstHtml(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await withTimeout(fetch(request), HTML_TIMEOUT_MS);
    if (res?.ok) await cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(`${SCOPE}/offline.html`);
    return offline || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const accept = req.headers.get('accept') || '';
  const isHtml = req.mode === 'navigate' || accept.includes('text/html');
  if (isHtml) {
    event.respondWith(networkFirstHtml(req));
    return;
  }
  if (STATIC_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

function startVersionPolling() {
  setInterval(async () => {
    try {
      const res = await fetch(VERSION_URL, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.version && data.version !== APP_VERSION) {
        await notifyClients({ type: 'PMK_UPDATE_AVAILABLE', version: data.version });
        self.skipWaiting();
      }
    } catch {
      // ignore transient connectivity errors
    }
  }, 60000);
}
