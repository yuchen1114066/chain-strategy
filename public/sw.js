// Service Worker for 祺驊倉庫零件查詢 PWA
const CACHE_VERSION = 'wh-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// App shell resources to pre-cache on install
const APP_SHELL = [
  '/erp/mobile/scan',
  '/manifest.json',
  '/icons/warehouse-192.svg',
  '/icons/warehouse-512.svg',
];

// Patterns that should use network-first strategy (API calls)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/erp\/.*api/,
  /\/_next\/data\//,
];

// Patterns that should use cache-first strategy (static assets)
const CACHE_FIRST_PATTERNS = [
  /\/_next\/static\//,
  /\/icons\//,
  /\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|ttf|otf|eot)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

// ---------- Install ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activate new SW immediately without waiting for old tabs to close
  self.skipWaiting();
});

// ---------- Activate ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Claim clients so the new SW takes effect on already-open tabs
  self.clients.claim();
});

// ---------- Fetch ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Determine strategy
  const url = new URL(request.url);

  // Network-first for API calls
  if (NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets
  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname) || pattern.test(url.href))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first for navigation / other requests
  event.respondWith(networkFirst(request));
});

// ---------- Strategies ----------

/**
 * Network-first: try the network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Cache a clone for offline use
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // If it's a navigation request, serve the app shell as a fallback
    if (request.mode === 'navigate') {
      return caches.match('/erp/mobile/scan');
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Cache-first: serve from cache, fetch and update cache in background.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
