import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { app } from "@/lib/firebase";

let messaging: Messaging | null = null;

// VAPID ключ из Firebase Console (замените на ваш реальный ключ)
const VAPID_KEY = "YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE";

export async function initMessaging(): Promise<Messaging | null> {
  if (messaging) return messaging;

  try {
    // Проверка поддержки Service Worker
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker не поддерживается");
      return null;
    }

    // Проверка поддержки уведомлений
    if (!("Notification" in window)) {
      console.warn("Notifications не поддерживаются");
      return null;
    }

    messaging = getMessaging(app);

    // Запрос разрешения
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Разрешение на уведомления не получено");
      return null;
    }

    // Регистрация Service Worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    console.log("Service Worker зарегистрирован:", registration.scope);

    return messaging;
  } catch (error) {
    console.error("Ошибка инициализации messaging:", error);
    return null;
  }
}

export async function getVAPIDToken(): Promise<string | null> {
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Ошибка получения токена:", error);
    return null;
  }
}

export function onMessageListener() {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}

export async function showNotification(title: string, options: NotificationOptions) {
  if (!("Notification" in window)) {
    console.warn("Notifications не поддерживаются");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    new Notification(title, {
      ...options,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });
  }
}

// Получить токен для отправки на сервер
export async function getMessagingToken(): Promise<string | null> {
  if (!messaging) return null;
  
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена:", error);
    return null;
  }
}
