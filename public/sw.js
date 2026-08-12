const CACHE_NAME = 'al-bunyan-cache-v1';

// Assets to precache immediately on install
const PRECACHE_ASSETS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS, skip other schemes (e.g., chrome-extension://, ws://)
  if (!event.request.url.startsWith('http')) return;

  // Skip Vite dev server specific socket/HMR requests to prevent development errors
  if (event.request.url.includes('socket') || event.request.url.includes('vite') || event.request.url.includes('@vite')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache (Cache-First)
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Verify response is valid and cacheable
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Cache the newly fetched resource for complete offline availability
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.log('Service Worker: Fetch failed, returning offline fallback:', err);
        // For navigations, return root fallback so page reloads work offline
        if (event.request.mode === 'navigate') {
          return caches.match('./') || caches.match('./index.html');
        }
      });
    })
  );
});
