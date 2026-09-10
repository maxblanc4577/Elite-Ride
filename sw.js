// Service Worker for Elite Ride Dominica (PWA - iOS & Android)
// Full Offline Caching, Active Ride Status Persistence, & App Shell

const CACHE_NAME = 'elite-ride-dominica-v2';
const RIDE_CACHE_NAME = 'elite-ride-active-data-v2';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core app shell for iOS & Android');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical precache fetch skipped:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation & Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RIDE_CACHE_NAME) {
            console.log('[SW] Deleting legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception Strategy: Stale-While-Revalidate for app assets, with Offline Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome-extension / non-http requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle active ride status request endpoint if called
  if (url.pathname.includes('/api/offline-ride-cache')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).catch(() => {
          return new Response(JSON.stringify({ offline: true, message: 'App is running in offline island mode' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        });
      })
    );
    return;
  }

  // General fetch: Network first, falling back to cache if offline
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache successful static responses
        if (
          networkResponse.status === 200 &&
          (request.destination === 'document' ||
           request.destination === 'script' ||
           request.destination === 'style' ||
           request.destination === 'image' ||
           request.destination === 'font')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Return cached version if network fails
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return index.html for document requests (SPA navigation)
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('Network unavailable and resource not cached.', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// Message listener for active ride state syncing from React main thread
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, rideData } = event.data;

  if (type === 'CACHE_ACTIVE_RIDE') {
    caches.open(RIDE_CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify(rideData), {
        headers: { 'Content-Type': 'application/json' },
      });
      cache.put('/api/active-ride-status', response);
      console.log('[SW] Active ride status cached offline successfully:', rideData?.id);
    });
  } else if (type === 'CLEAR_ACTIVE_RIDE') {
    caches.open(RIDE_CACHE_NAME).then((cache) => {
      cache.delete('/api/active-ride-status');
      console.log('[SW] Active ride status cleared from offline cache.');
    });
  }
});
