/* ═══════════════════════════════════════════════════════
   DOMINOES — Service Worker (PWA)
   Offline support for AI mode
   ═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'dominoes-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/game.html',
  '/lobby.html',
  '/join.html',
  '/styles.css',
  '/script.js',
  '/sw.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js'
];

/* ── INSTALL: Cache all assets ── */
self.addEventListener('install', function(event) {
  console.log('🟢 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('📦 Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: Clean old caches ── */
self.addEventListener('activate', function(event) {
  console.log('🟢 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── FETCH: Serve from cache or network ── */
self.addEventListener('fetch', function(event) {
  // Skip Firebase API calls
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('firebasedatabase.app') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    // Network first for Firebase, fallback to cache
    event.respondWith(
      fetch(event.request).then(function(response) {
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache first strategy for local assets
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(function() {
        // If offline and not cached, return the main page
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline - Unable to load resource', { status: 503 });
      });
    })
  );
});

/* ── MESSAGE: Handle messages from the app ── */
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_NOW') {
    // Cache additional resources on demand
    var urls = event.data.urls || [];
    caches.open(CACHE_NAME).then(function(cache) {
      cache.addAll(urls);
    });
  }
});

console.log('🟢 Service Worker: Loaded');
