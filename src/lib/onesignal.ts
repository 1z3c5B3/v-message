// OneSignal конфигурация
export const ONE_SIGNAL_CONFIG = {
  appId: "e3edb60b-2480-4bf5-8268-826cfb3799c7",
  allowLocalhostAsSecureOrigin: true,
  serviceWorkerPath: "/OneSignalSDKWorker.js",
  serviceWorkerParam: { scope: "/" },
};

// Инициализация OneSignal
export async function initOneSignal() {
  if (typeof window === "undefined") return;

  // Загружаем скрипт OneSignal
  if (!(window as any).OneSignal) {
    await new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v1/OneSignalSDK.js";
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  // Инициализируем
  (window as any).OneSignal = (window as any).OneSignal || [];
  (window as any).OneSignal.push(function () {
    (window as any).OneSignal.init({
      appId: "e3edb60b-2480-4bf5-8268-826cfb3799c7",
      allowLocalhostAsSecureOrigin: true,
    });

    // Слушаем клики по уведомлениям
    (window as any).OneSignal.Notifications.addEventListener('click', (notification: any) => {
      if (notification.data?.type === 'call') {
        // Открыть звонок
        console.log('Клик по уведомлению о звонке');
      }
    });
  });

  console.log("OneSignal инициализирован");
}

// Запрос разрешения на уведомления
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !(window as any).OneSignal) {
    return "default";
  }

  try {
    const permission = await (window as any).OneSignal.Notifications.requestPermission();
    console.log("Разрешение на уведомления:", permission);
    return permission;
  } catch (error) {
    console.error("Ошибка запроса разрешения:", error);
    return "denied";
  }
}

// Отправить уведомление о звонке через Netlify Function
export async function sendCallNotification(userId: string, callerName: string, callType: string, callId: string) {
  try {
    const response = await fetch('/.netlify/functions/send-call-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        callerName,
        callType,
        callId
      })
    });

    const result = await response.json();
    console.log('Уведомление о звонке отправлено:', result);
    return result;
  } catch (error) {
    console.error('Ошибка отправки уведомления о звонке:', error);
    return null;
  }
}

// Отправить обычное уведомление через Netlify Function
export async function sendNotification(userId: string, title: string, message: string, type: string = 'message') {
  try {
    const response = await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        message,
        type
      })
    });

    const result = await response.json();
    console.log('Уведомление отправлено:', result);
    return result;
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    return null;
  }
}

// Получить состояние подписки
export async function getSubscriptionState() {
  if (typeof window === "undefined" || !(window as any).OneSignal) {
    return { subscribed: false };
  }

  const subscribed = await (window as any).OneSignal.Notifications.getSubscriptionState();
  return subscribed;
}

// Получить OneSignal User ID
export async function getOneSignalUserId() {
  if (typeof window === "undefined" || !(window as any).OneSignal) {
    return null;
  }

  try {
    const userId = await (window as any).OneSignal.User.getOneSignalId();
    return userId;
  } catch (error) {
    console.error('Ошибка получения OneSignal ID:', error);
    return null;
  }
}
