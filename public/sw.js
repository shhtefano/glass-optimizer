const CACHE_NAME = 'vetrooptima-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event: cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clear old caches
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

// Fetch Event: handle offline pages and assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin or non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Check if it's a page navigation request
  const isPageRequest = 
    event.request.mode === 'navigate' || 
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) ||
    url.pathname === '/' ||
    !url.pathname.includes('.'); // URLs without file extensions (routing)

  if (isPageRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If online, load fresh page and update the cache
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Cache under index.html to make offline fallback robust
              cache.put('/index.html', responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, serve cached index.html or root
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Handle static assets (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Cache hit: return immediately
      }

      // Cache miss: fetch from network, then cache and return
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback if asset is missing and we are offline
        return new Response('Asset not available offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
