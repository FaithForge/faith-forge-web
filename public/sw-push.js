// Background Web Push Notification Handler for Iglekids PWA

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Iglekids';
    const options = {
      body: data.body || 'Tu niño ha sido registrado.',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.data || { url: '/kid-guardian' },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Failed to parse push notification payload:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
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
