# Инструкция: Push-уведомления о звонках при закрытом браузере

## Что было добавлено

### 1. PWA (Progressive Web App)
- ✅ `manifest.json` - манифест приложения
- ✅ `pwa-sw.js` - Service Worker для кэширования и фоновой работы
- ✅ Meta-теги для iOS и Android
- ✅ Установка на домашний экран

### 2. Уведомления с высоким приоритетом
- ✅ `ttl: 30000` - уведомление живёт 30 секунд
- ✅ `priority: "high"` - будит устройство
- ✅ `sound` - звуковое оповещение
- ✅ `vibrate` - вибрация

### 3. Service Workers
- ✅ `firebase-messaging-sw.js` - для FCM уведомлений
- ✅ `pwa-sw.js` - для кэширования и фоновой работы

---

## Как установить PWA на устройство

### Android (Chrome)
1. Откройте `https://v-message-83866.firebaseapp.com/` в Chrome
2. Нажмите **три точки** → **"Установить приложение"** или **"Добавить на главный экран"**
3. Подтвердите установку
4. Приложение появится на главном экране

### iOS (Safari)
1. Откройте `https://v-message-83866.firebaseapp.com/` в Safari
2. Нажмите **"Поделиться"** (квадрат со стрелкой)
3. Выберите **"На экран «Домой»"**
4. Подтвердите установку

### Desktop (Chrome/Edge)
1. Откройте сайт в браузере
2. В адресной строке появится значок **⊕** или **"Установить"**
3. Нажмите и подтвердите

---

## Настройка Firebase Cloud Functions

### 1. Разверните функции
```bash
cd C:\Users\Вадим\Desktop\v-msg-final\functions
npm run build
firebase deploy --only functions
```

### 2. Проверьте логи
```bash
firebase functions:log
```

### 3. Проверьте токен пользователя
Откройте Firestore Console → users → {userId}:
```
fcmToken: "..."
fcmTokens: { "...": true }
```

---

## Проверка работы

### 1. Установите PWA
- Установите приложение на телефон (Android/iOS)
- Откройте приложение
- Разрешите уведомления

### 2. Проверьте Service Worker
В консоли браузера (F12):
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### 3. Тест звонка
1. Откройте приложение на **двух устройствах**
2. Войдите под **разными пользователями**
3. Закройте браузер на **получателе** (свайпом или кнопкой)
4. Отправьте **звонок** с первого устройства
5. На втором устройстве должно прийти уведомление

---

## Важные требования

### Для Android
- ✅ Android 8.0+ для каналов уведомлений
- ✅ Chrome 80+ для PWA
- ✅ Разрешение на уведомления
- ✅ Включён интернет (Wi-Fi или мобильные данные)

### Для iOS
- ✅ iOS 16.4+ для PWA уведомлений
- ✅ Safari для установки
- ✅ Разрешение на уведомления

### Для Desktop
- ✅ Chrome 90+ или Edge 90+
- ✅ Браузер должен быть запущен (хотя бы в фоне)

---

## Почему уведомления могут не приходить

### 1. Браузер полностью закрыт
**Решение:** PWA должен быть запущен. На Android приложения могут работать в фоне.

### 2. Нет разрешения на уведомления
**Решение:** 
- Android: Настройки → Приложения → V-Message → Уведомления
- iOS: Настройки → Safari → Уведомления

### 3. Экономия энергии
**Решение:** Отключите экономию энергии для приложения.

### 4. FCM токен не сохранён
**Решение:** Проверьте Firestore - у пользователя должен быть `fcmToken`.

### 5. Функции не развёрнуты
**Решение:** 
```bash
firebase deploy --only functions
```

---

## Структура уведомления о звонке

```json
{
  "notification": {
    "title": "📞 Видеозвонок от Иван",
    "body": "Нажмите, чтобы ответить",
    "sound": "default"
  },
  "android": {
    "priority": "high",
    "ttl": 30000,
    "notification": {
      "channelId": "calls",
      "sound": "default",
      "icon": "notification_icon"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": { "name": "default", "volume": 1.0 },
        "contentAvailable": true,
        "mutableContent": true
      }
    }
  },
  "data": {
    "type": "call",
    "callId": "abc123",
    "from": "user123",
    "fromName": "Иван",
    "callType": "video",
    "url": "/"
  }
}
```

---

## Тестирование через Firebase Console

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. **Engage** → **Cloud Messaging** → **New campaign**
3. Выберите пользователя по `fcmToken`
4. Отправьте тестовое уведомление

---

## Мониторинг

### Логи Cloud Functions
```bash
firebase functions:log --only onCallCreated
```

### Логи в браузере
Откройте консоль (F12) → ищите:
- `[PWA]` - логи PWA
- `[FCM]` - логи Firebase Messaging
- `[firebase-messaging-sw.js]` - логи Service Worker

---

## Отладка

### Проверка Service Worker
```javascript
// В консоли браузера
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('Service Workers:', regs.length);
    regs.forEach(reg => console.log('Scope:', reg.scope));
  });
}
```

### Проверка уведомлений
```javascript
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

### Проверка токена
```javascript
// После авторизации
import { getMessaging, getToken } from 'firebase/messaging';
const messaging = getMessaging(app);
getToken(messaging, { vapidKey: '...' }).then(token => {
  console.log('FCM Token:', token);
});
```
