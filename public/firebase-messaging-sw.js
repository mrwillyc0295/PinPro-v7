importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Los valores se inyectarán o el SW los leerá del entorno si es necesario,
// pero usualmente Firebase requiere la config básica aquí también para el background.
firebase.initializeApp({
  apiKey: "AIzaSyDU-JR0Q-i2KUh-2c3Ui1QR3M5EsvS8z98",
  projectId: "gen-lang-client-0072495940",
  messagingSenderId: "1011268323734",
  appId: "1:1011268323734:web:cce99c04668bdb5e9b35b7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png',
    data: payload.data,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// === CAPA ADICIONAL DE MAP PREFETCHING Y SEGURIDAD CACHE-FIRST ===
const TILE_CACHE_NAME = 'pinpro-offline-tiles-v1';

function normalizeUrl(url) {
  if (url.includes('basemaps.cartocdn.com')) {
    return url.replace(/https:\/\/[a-d]\.basemaps/, 'https://a.basemaps');
  }
  return url;
}

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  const url = event.request.url;

  if (url.includes('basemaps.cartocdn.com') || url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(function(cache) {
        const normalizedUrl = normalizeUrl(url);

        return cache.match(normalizedUrl).then(function(cachedResponse) {
          if (cachedResponse) {
            // Stale While Revalidate
            fetch(event.request).then(function(networkResponse) {
              if (networkResponse.ok) {
                cache.put(normalizedUrl, networkResponse);
              }
            }).catch(function() {
              // Silencioso
            });
            return cachedResponse;
          }

          return fetch(event.request).then(function(networkResponse) {
            if (networkResponse.ok) {
              cache.put(normalizedUrl, networkResponse.clone());
            }
            return networkResponse;
          }).catch(function() {
            return new Response('Offline map tile unavailable', { status: 408 });
          });
        });
      })
    );
    return;
  }
});
