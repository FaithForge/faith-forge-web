// Background Web Push Notification Handler for Iglekids PWA

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      try {
        data = { body: event.data.text() };
      } catch {
        data = {};
      }
    }
  }

  const title = data.title || 'Iglekids';
  const isUrgent = Boolean(data.data?.urgent || data.requireInteraction);
  const tag = data.tag || (isUrgent ? `urgent-${data.data?.kidId || Date.now()}` : `iglekids-${Date.now()}`);

  const options = {
    body: data.body || 'Tu niño ha sido registrado.',
    icon: data.icon || '/icons/notification-icon.png',
    badge: data.badge || '/icons/badge-icon.png',
    vibrate: data.vibrate || [500, 200, 500],
    requireInteraction: Boolean(data.requireInteraction),
    tag: tag,
    renotify: true,
    data: data.data || { url: '/kid-guardian' },
  };

  if (isUrgent) {
    // Alerta urgente: repetir showNotification con renotify cada 2.5s
    // forzando al canal de Android a vibrar repetidamente (estilo llamada)
    // hasta que el usuario interactúe, la descarte, o expire el tiempo del worker
    self.__currentUrgentTag = tag;

    const repeatUrgentAlert = async () => {
      for (let i = 0; i < 10; i++) {
        if (self.__currentUrgentTag !== tag) break;

        // Comprobar si el usuario ya interactuó o la descartó
        if (i > 0) {
          try {
            const existing = await self.registration.getNotifications({ tag });
            if (!existing || existing.length === 0) {
              break;
            }
          } catch {
            // Ignorar error de consulta
          }
        }

        await self.registration.showNotification(title, options);

        if (i < 9) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }
    };

    event.waitUntil(repeatUrgentAlert());
  } else {
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  self.__currentUrgentTag = null;
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/kid-guardian';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', () => {
  // Usuario descartó la notificación: cancelar repeticiones
  self.__currentUrgentTag = null;
});
