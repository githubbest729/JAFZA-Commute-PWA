/* Service worker - Jebel Ali & Discovery Gardens Transit Guide
 * Static assets : cache-first (+ background refresh)
 * Schedules     : network-first, cache fallback  (js/transit-data.js)
 * Navigations   : network (short timeout) -> cached app shell -> offline.html
 * Bump VERSION on every release: old caches are deleted on activate.
 */
const VERSION = 'v1.2.1';
const STATIC_CACHE = `jaf-static-${VERSION}`;
const DATA_CACHE = `jaf-data-${VERSION}`;

const PRECACHE = [
  './',
  'index.html',
  'offline.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/transit-data.js',
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'og-image.png',
  'icons/icon-72.png',
  'icons/icon-96.png',
  'icons/icon-128.png',
  'icons/icon-144.png',
  'icons/icon-152.png',
  'icons/icon-192.png',
  'icons/icon-384.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // Add individually so one missing file cannot break the whole install.
    await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, DATA_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('jaf-') && !keep.has(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function fetchWithTimeout(request, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(request, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 1) Page navigations
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetchWithTimeout(req, 3000);
        if (res && res.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put('index.html', res.clone());
        }
        return res;
      } catch (err) {
        const cached = (await caches.match('index.html')) || (await caches.match('./'));
        return cached || (await caches.match('offline.html')) || Response.error();
      }
    })());
    return;
  }

  // 2) Schedule data: network-first, fall back to cache
  if (url.pathname.endsWith('/js/transit-data.js')) {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      try {
        const res = await fetchWithTimeout(req, 4000);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return (await cache.match(req)) || (await caches.match(req)) || Response.error();
      }
    })());
    return;
  }

  // 3) Everything else: cache-first, refresh in the background
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const refresh = fetch(req).then(async (res) => {
      if (res && res.ok) { const cache = await caches.open(STATIC_CACHE); cache.put(req, res.clone()); }
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(refresh); return cached; }
    const res = await refresh;
    return res || (await caches.match('offline.html')) || Response.error();
  })());
});
