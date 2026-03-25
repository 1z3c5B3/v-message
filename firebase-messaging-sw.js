// Firebase Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

// Инициализация Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCaUuWwsLkIDvoDJMg3qHQnzLD0HLfTAZ4",
  authDomain: "v-message-83866.firebaseapp.com",
  projectId: "v-message-83866",
  storageBucket: "v-message-83866.firebasestorage.app",
  messagingSenderId: "631499278712",
  appId: "1:631499278712:web:739c30d5c4b8dcd386608d"
});

const messaging = firebase.messaging();

// Обработка фоновых уведомлений
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Получено фоновое сообщение:", payload);
  
  const { title, body } = payload.notification || {};
  const dataType = payload.data?.type || '';
  const tag = payload.data?.tag || 'default';

  const notificationOptions = {
    body: body || "Новое сообщение",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || "/",
      type: dataType,
      chatId: payload.data?.chatId,
      callId: payload.data?.callId
    },
    requireInteraction: true,
    tag: tag,
    renotify: true,
    silent: false
  };

  console.log("[firebase-messaging-sw.js] Показываем уведомление:", title, notificationOptions);
  self.registration.showNotification(title || "V-Message", notificationOptions);
});

// Клик по уведомлению
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Клик по уведомлению:", event.notification);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Пробуем найти существующее окно
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          // Отправляем сообщение о клике на главную страницу
          client.postMessage({
            type: event.notification.data?.type,
            chatId: event.notification.data?.chatId,
            callId: event.notification.data?.callId
          });
          return client;
        }
      }
      // Открываем новое окно если нет существующего
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Обработка сообщений от основной страницы
self.addEventListener("message", (event) => {
  console.log("[firebase-messaging-sw.js] Получено сообщение:", event.data);
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
