# Инструкция по настройке Push-уведомлений

## Что было исправлено

### 1. Структура сообщений (Chat.tsx)
- Исправлена функция `send()` - теперь корректно отправляет сообщения всех типов
- Добавлена отправка push-уведомлений через OneSignal при отправке сообщений
- Улучшена обработка типов сообщений (текст, фото, файлы, голосовые, видео)

### 2. Firebase Cloud Functions (functions/src/index.ts)
- Улучшена функция `onMessageCreated` для отправки FCM уведомлений
- Добавлена обработка ошибок и логирование
- Улучшена работа с FCM токенами получателей
- Добавлена поддержка различных типов сообщений в уведомлениях

### 3. Service Worker (public/firebase-messaging-sw.js)
- Добавлено подробное логирование для отладки
- Улучшена обработка кликов по уведомлениям
- Добавлена поддержка данных из уведомлений (chatId, callId)

### 4. Messaging модуль (src/lib/messaging.ts)
- Добавлена константа VAPID_KEY
- Улучшена проверка поддержки уведомлений
- Добавлена функция `getMessagingToken()`

---

## Настройка Firebase Cloud Functions

### Шаг 1: Получите VAPID ключ
1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `v-message-83866`
3. Перейдите в **Project Settings** → **Cloud Messaging**
4. Скопируйте **Web Push certificates** → **Key pair**
5. Вставьте ключ в файл `src/lib/messaging.ts`:
   ```typescript
   const VAPID_KEY = "ваш_ключ_из_firebase";
   ```

### Шаг 2: Разверните Cloud Functions
```bash
cd C:\Users\Вадим\Desktop\v-msg-final\functions
npm run build
firebase deploy --only functions
```

### Шаг 3: Проверьте логи функций
```bash
firebase functions:log
```

---

## Настройка OneSignal (альтернативный вариант)

### Шаг 1: Получите API ключ
1. Откройте [OneSignal Dashboard](https://onesignal.com/)
2. Выберите приложение
3. Перейдите в **Settings** → **Keys & IDs**
4. Скопируйте **REST API Key**

### Шаг 2: Обновите Netlify Function
Отредактируйте файл `netlify/functions/send-notification.js`:
- Замените `ONE_SIGNAL_API_KEY` на ваш ключ

---

## Проверка работы

### 1. Проверка Service Worker
Откройте консоль браузера и проверьте:
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('SW registered:', reg.scope);
});
```

### 2. Проверка уведомлений
1. Откройте приложение в двух разных браузерах/устройствах
2. Войдите под разными пользователями
3. Отправьте сообщение
4. Проверьте получение уведомления

### 3. Логи в консоли
- `[firebase-messaging-sw.js]` - логи service worker
- `Отправлено X/Y уведомлений` - логи Cloud Functions

---

## Возможные проблемы

### "У получателя нет FCM токенов"
**Решение:** Убедитесь, что пользователь разрешил уведомления и токен сохранён в Firestore.

### "Service Worker не поддерживается"
**Решение:** Используйте HTTPS или localhost.

### "Notification не поддерживаются"
**Решение:** Проверьте настройки браузера для уведомлений.

### Функции не развёрнуты
**Решение:** 
```bash
firebase deploy --only functions
firebase functions:log
```

---

## Структура уведомлений

### При сообщении
- **Title:** Имя отправителя
- **Body:** Текст сообщения (до 100 символов) или тип (фото, файл, голосовое)
- **Data:** `{ type: "message", chatId: "...", url: "/" }`

### При звонке
- **Title:** "Видеозвонок от {имя}" или "Звонок от {имя}"
- **Body:** "Нажмите, чтобы ответить"
- **Data:** `{ type: "call", callId: "...", from: "...", callType: "video" }`

### При завершении звонка
- **Title:** "{Имя} завершил(а) звонок"
- **Body:** "Нажмите, чтобы открыть чат"
- **Data:** `{ type: "call-ended", callId: "..." }`
