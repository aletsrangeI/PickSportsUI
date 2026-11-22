// Service Worker for PickSports PWA & Web Push Notifications
const CACHE_NAME = 'picksports-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Atender mensajes de la aplicación (e.g. forzar activación de nuevo Service Worker)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Evento PUSH: Recibir notificación en segundo plano
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {
    title: 'PickSports',
    message: 'Tienes una nueva actualización en tu quiniela.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
    data: {}
  };

  try {
    const json = event.data.json();
    payload = {
      ...payload,
      ...json,
      message: json.message || json.body || payload.message
    };
  } catch (e) {
    payload.message = event.data.text();
  }

  const options = {
    body: payload.message,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    vibrate: [150, 50, 150],
    data: {
      url: payload.url || (payload.data && payload.data.url) || '/',
      ...payload.data
    },
    actions: [
      { action: 'open', title: 'Ver en PickSports' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Evento NOTIFICATIONCLICK: Abrir la app al pulsar la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si la app ya está abierta, enfocarla y pedirle que navegue con su router.
      // No usar client.navigate(): recarga la página y puede matar un POST /auth/refresh
      // en vuelo (el servidor ya rotó el token, el cliente nunca lo guarda → logout).
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.postMessage({ type: 'NOTIFICATION_NAVIGATE', url: targetUrl });
            return client.focus();
          }
        }
      }
      // Si no está abierta, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
