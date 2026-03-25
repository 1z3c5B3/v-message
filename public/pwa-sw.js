// PWA Service Worker для V-Message
const CACHE_NAME = 'v-message-cache-v1';
const RUNTIME_CACHE = 'v-message-runtime-v1';

// Файлы для кэширования
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[PWA SW] Установка Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[PWA SW] Кэширование файлов');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[PWA SW] Файлы закэшированы');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[PWA SW] Активация Service Worker');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[PWA SW] Удаление старого кэша:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[PWA SW] Service Worker активирован');
        return self.clients.claim();
      })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к Firebase и OneSignal
  if (event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('onesignal.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});

// Обработка уведомлений
self.addEventListener('notificationclick', (event) => {
  console.log('[PWA SW] Клик по уведомлению:', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const callId = event.notification.data?.callId;
  const type = event.notification.data?.type;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: type,
              callId: callId,
              url: urlToOpen
            });
            return client;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  console.log('[PWA SW] Фоновая синхронизация:', event.tag);
  if (event.tag === 'send-message') {
    event.waitUntil(
      // Логика отправки сообщений из фона
      Promise.resolve()
    );
  }
});

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('[PWA SW] Получен push:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'V-Message', body: event.data.text() };
    }
  }

  const title = data.title || 'V-Message';
  const options = {
    body: data.body || 'Новое сообщение',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type || 'message',
      callId: data.callId,
      chatId: data.chatId
    },
    requireInteraction: true,
    tag: data.tag || 'default',
    renotify: true,
    silent: false,
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка действий с уведомлением
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.registration.scope) && 'focus' in client) {
              client.focus();
              return client;
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Сообщения от клиента
self.addEventListener('message', (event) => {
  console.log('[PWA SW] Получено сообщение:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.4.0' });
  }
});
