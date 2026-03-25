// OneSignal Service Worker
importScripts("https://cdn.onesignal.com/sdks/web/v1/OneSignalSDK.sw.js");

// Обработка клика по уведомлению
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});
