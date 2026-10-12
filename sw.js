// Service Worker for Elite Ride Dominica (PWA - iOS & Android)
// Full Offline Caching, Active Ride Status Persistence, & App Shell

const CACHE_NAME = 'elite-ride-dominica-v2';
const RIDE_CACHE_NAME = 'elite-ride-active-data-v2';
const ESTIMATION_CACHE_NAME = 'elite-ride-estimation-cache-v1';
const OFFLINE_ESTIMATION_URL = '/api/offline-estimation-cache';

const DEFAULT_OFFLINE_ESTIMATION = {
  pickupKey: 'roseau',
  pickupName: 'Roseau Center / Cruise Ship Berth',
  destinationKey: 'airport',
  destinationName: 'Melville Hall Airport (DOM)',
  destinationFullName: 'Melville Hall Airport (DOM) - 45 min',
  district: 'St. Andrew',
  vehicleCategory: 'standard',
  estimatedFare: 'EC$ 120.00',
  finalPrice: 'EC$ 120.00',
  fareAmount: 120,
  travelTime: '45 mins',
  etaMinutes: 45,
  distance: '24.5 miles',
  corridor: 'Imperial Road / Trans-Insular Corridor',
  offlineMode: true,
  source: 'service-worker-cache',
  terrainNote: 'Cached for remote mountain terrain (no cell service)'
};

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
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Pre-caching core app shell for iOS & Android');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Non-critical precache fetch skipped:', err);
        });
      }),
      caches.open(ESTIMATION_CACHE_NAME).then(async (cache) => {
        const existing = await cache.match(OFFLINE_ESTIMATION_URL);
        if (!existing) {
          await cache.put(
            OFFLINE_ESTIMATION_URL,
            new Response(JSON.stringify({ ...DEFAULT_OFFLINE_ESTIMATION, cachedAt: new Date().toISOString() }), {
              headers: { 'Content-Type': 'application/json', 'X-Elite-Offline-Cache': 'true' }
            })
          );
        }
      })
    ]).then(() => self.skipWaiting())
  );
});

// Service Worker Activation & Cache Cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RIDE_CACHE_NAME &&
            cacheName !== ESTIMATION_CACHE_NAME
          ) {
            console.log('[SW] Deleting legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception Strategy: Offline Ride Estimation Cache + Stale-While-Revalidate for app assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle POST/PUT to store last successful ride estimation in SW Cache
  if (
    (request.method === 'POST' || request.method === 'PUT') &&
    (url.pathname.includes('/api/offline-estimation-cache') || url.pathname.includes('/api/last-ride-estimation'))
  ) {
    event.respondWith(
      request.clone().json().then(async (body) => {
        const payload = {
          ...DEFAULT_OFFLINE_ESTIMATION,
          ...(body || {}),
          offlineMode: true,
          source: 'service-worker-cache',
          cachedAt: new Date().toISOString()
        };
        const cache = await caches.open(ESTIMATION_CACHE_NAME);
        const responseToCache = new Response(JSON.stringify(payload), {
          headers: { 'Content-Type': 'application/json', 'X-Elite-Offline-Cache': 'true' }
        });
        await cache.put(OFFLINE_ESTIMATION_URL, responseToCache.clone());
        return new Response(JSON.stringify({ ok: true, cached: true, estimation: payload }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }).catch(() => {
        return new Response(JSON.stringify({ ok: false, error: 'Invalid estimation payload' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Skip non-GET requests for general asset caching
  if (request.method !== 'GET') {
    return;
  }

  // Serve cached last successful ride estimation for offline mountain terrain navigation
  if (
    url.pathname.includes('/api/offline-estimation-cache') ||
    url.pathname.includes('/api/last-ride-estimation')
  ) {
    event.respondWith(
      caches.open(ESTIMATION_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(OFFLINE_ESTIMATION_URL);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response(JSON.stringify({ ...DEFAULT_OFFLINE_ESTIMATION, cachedAt: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json', 'X-Elite-Offline-Cache': 'fallback' }
        });
      })
    );
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
          return caches.open(ESTIMATION_CACHE_NAME).then(async (cache) => {
            const estResp = await cache.match(OFFLINE_ESTIMATION_URL);
            if (estResp) return estResp;
            return new Response(JSON.stringify({ offline: true, message: 'App is running in offline mountain mode', estimation: DEFAULT_OFFLINE_ESTIMATION }), {
              headers: { 'Content-Type': 'application/json' },
            });
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

// Message listener for active ride & ride estimation state syncing from main thread
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, rideData, estimationData } = event.data;

  if (type === 'CACHE_RIDE_ESTIMATION') {
    const payload = {
      ...DEFAULT_OFFLINE_ESTIMATION,
      ...(estimationData || rideData || {}),
      offlineMode: true,
      source: 'service-worker-cache',
      cachedAt: new Date().toISOString()
    };
    event.waitUntil(
      caches.open(ESTIMATION_CACHE_NAME).then(async (cache) => {
        const response = new Response(JSON.stringify(payload), {
          headers: { 'Content-Type': 'application/json', 'X-Elite-Offline-Cache': 'true' }
        });
        await cache.put(OFFLINE_ESTIMATION_URL, response.clone());
        await cache.put('/api/offline-ride-cache', response.clone());
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: 'RIDE_ESTIMATION_CACHED', estimationData: payload });
        }
        const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        clientsList.forEach((client) => {
          client.postMessage({ type: 'RIDE_ESTIMATION_CACHED', estimationData: payload });
        });
      })
    );
  } else if (type === 'GET_CACHED_RIDE_ESTIMATION') {
    event.waitUntil(
      caches.open(ESTIMATION_CACHE_NAME).then(async (cache) => {
        const cachedResp = await cache.match(OFFLINE_ESTIMATION_URL);
        let data = DEFAULT_OFFLINE_ESTIMATION;
        if (cachedResp) {
          try {
            data = await cachedResp.json();
          } catch (e) {}
        }
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ type: 'CACHED_RIDE_ESTIMATION_DATA', estimationData: data });
        }
        if (event.source && typeof event.source.postMessage === 'function') {
          event.source.postMessage({ type: 'CACHED_RIDE_ESTIMATION_DATA', estimationData: data });
        }
      })
    );
  } else if (type === 'CACHE_ACTIVE_RIDE') {
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
