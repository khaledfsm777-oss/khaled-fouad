const CACHE_NAME = 'al-bunyan-cache-v3';

// Assets to precache immediately on install
const PRECACHE_ASSETS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
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
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return;

  // Never cache development source scripts (/src/), Vite internals, or API endpoints
  if (
    event.request.url.includes('/src/') ||
    event.request.url.includes('socket') || 
    event.request.url.includes('vite') || 
    event.request.url.includes('@vite') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  // Network-First with Cache Fallback for production resilience
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./') || caches.match('./index.html');
          }
        });
      })
  );
});
