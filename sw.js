const CACHE_VERSION = 'ghostwords-v1';
const CACHE_ASSETS = [
  '/GhostWord/',
  '/GhostWord/index.html',
  '/GhostWord/styles.css',
  '/GhostWord/app.js',
  '/GhostWord/manifest.json',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.12.313/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.21/mammoth.browser.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_ASSETS);
    }).catch(err => {
      console.warn('Cache install failed, continuing anyway:', err);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip same-origin calls for user files (documents)
  if (url.origin === location.origin && request.url.includes('/Documents/')) {
    return;
  }

  // Network first strategy for most requests
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Cache GET requests
        const responseToCache = response.clone();
        caches.open(CACHE_VERSION).then(cache => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache on network error
        return caches.match(request).then(response => {
          return response || new Response(
            'Offline - recurso no disponible',
            { status: 503, statusText: 'Service Unavailable' }
          );
        });
      })
  );
});
