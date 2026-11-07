/* Coffee Lab service worker — GENERATED at build time from src/platform/sw/sw.template.js by the
 * `coffee-lab:service-worker` plugin in vite.config.ts. Production builds only (never in `npm run dev`).
 *
 * Strategy (no third-party code, no network calls of its own beyond fetching this app's files):
 *  - install:   precache the app shell (index.html), every JS/CSS chunk that does NOT contain Babylon.js,
 *               the manifest and icons → lessons, kitchen mode, journal, atlas, settings work offline
 *               after the first successful load.
 *  - navigate:  requests for the app root / index.html get the precached shell (cache-first). Hash routing
 *               means every in-app route is the same document, so this covers all pages.
 *  - assets:    same-origin GETs inside the scope are cache-first. Hashed files under assets/ that were not
 *               precached (the lazy Babylon/XR 3D chunks, ~2 MB) are runtime-cached the first time /xr loads
 *               them online; offline before that, the XR route shows its built-in "3D could not start" fallback.
 *  - cross-origin requests and non-GET requests are never intercepted or cached.
 *  - activate:  every older Coffee Lab cache for this scope is deleted (versioned cleanup), then clients are claimed.
 *  - updates:   a new worker WAITS until the page sends {type:'SKIP_WAITING'} (src/platform/pwa.ts applyUpdate),
 *               so nobody gets a surprise reload in the middle of a brew.
 */
/* eslint-disable no-restricted-globals */
const VERSION = __CL_VERSION__;
const PRECACHE_PATHS = __CL_PRECACHE__;
const RUNTIME_PREFIXES = __CL_RUNTIME_PREFIXES__;

const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `coffee-lab:${SCOPE.pathname}:`;
const PRECACHE = `${CACHE_PREFIX}precache:${VERSION}`;
const RUNTIME = `${CACHE_PREFIX}runtime:${VERSION}`;
const INDEX_URL = new URL('index.html', SCOPE).href;

function inScopePath(url) {
  return url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname) ? url.pathname.slice(SCOPE.pathname.length) : null;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) =>
      // cache: 'reload' bypasses the HTTP cache so we never precache a stale file.
      cache.addAll(PRECACHE_PATHS.map((p) => new Request(new URL(p, SCOPE).href, { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== PRECACHE && k !== RUNTIME).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function appShell(request) {
  const cached = await caches.match(INDEX_URL, { cacheName: PRECACHE, ignoreVary: true });
  return cached || fetch(request);
}

async function cacheFirst(event, rel) {
  const request = event.request;
  // ignoreVary: servers often send `Vary: Origin`/`Accept-Encoding`; precache requests (no Origin header) must still
  // match the page's crossorigin module/CSS requests. Safe because every cached URL is content-hashed or versioned.
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request); // offline + not cached → rejects exactly like the network would
  const url = new URL(request.url);
  if (
    response.ok &&
    response.type === 'basic' &&
    !url.search &&
    !rel.endsWith('.map') &&
    RUNTIME_PREFIXES.some((p) => rel.startsWith(p))
  ) {
    const copy = response.clone();
    event.waitUntil(caches.open(RUNTIME).then((cache) => cache.put(request, copy)));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const rel = inScopePath(url);
  if (rel === null) return; // cross-origin or outside our scope: browser default, never cached
  if (request.mode === 'navigate') {
    if (rel === '' || rel === 'index.html') event.respondWith(appShell(request));
    return;
  }
  if (request.headers.has('range')) return; // partial content: leave to the network
  event.respondWith(cacheFirst(event, rel));
});
