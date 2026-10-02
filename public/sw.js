// PinPro Service Worker para Notificaciones y Cache
const TILE_CACHE_NAME = 'pinpro-offline-tiles-v1';

// Normalización de subdominios para maximizar la densidad de caché (reducción de 4x en espacio)
function normalizeUrl(url) {
  if (url.includes('basemaps.cartocdn.com')) {
    return url.replace(/https:\/\/[a-d]\.basemaps/, 'https://a.basemaps');
  }
  return url;
}

self.addEventListener('install', function(event) {
  // Activa inmediatamente sin esperar a que el usuario refresque la página
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Interceptor de llamadas de red de alta fidelidad para Tiles de mapas (Resistente a cortes de internet)
self.addEventListener('fetch', function(event) {
  const url = event.request.url;

  // Interceptar exclusivamente recursos de mapas para Cache-First ciberseguro
  if (url.includes('basemaps.cartocdn.com') || url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(function(cache) {
        const normalizedUrl = normalizeUrl(url);

        return cache.match(normalizedUrl).then(function(cachedResponse) {
          if (cachedResponse) {
            // Estrategia Stale-While-Revalidate: Sirve de inmediato del caché físico,
            // pero refresca silenciosamente de internet para mantener los mapas actualizados
            fetch(event.request).then(function(networkResponse) {
              if (networkResponse.ok) {
                cache.put(normalizedUrl, networkResponse);
              }
            }).catch(function() {
              // Falla silenciosa si no hay conexión, sin romper la renderización
            });
            return cachedResponse;
          }

          // Si no está cacheado, ir a buscar a internet, persistir en caché y retornar
          return fetch(event.request).then(function(networkResponse) {
            if (networkResponse.ok) {
              cache.put(normalizedUrl, networkResponse.clone());
            }
            return networkResponse;
          }).catch(function() {
            // Retorna un código de estado de timeout seguro en lugar de romper la promesa
            return new Response('Offline map tile unavailable', { status: 408 });
          });
        });
      })
    );
    return;
  }
});

// Manejo de Notificaciones Push FCM originales
self.addEventListener('push', function(event) {
  let data = { title: 'PinPro', body: 'Nueva actualización', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Push data error", e);
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1063/1063376.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1063/1063376.png',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver en PinPro' },
      { action: 'close', title: 'Ignorar' }
    ],
    tag: 'comunicacion-realtime',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
