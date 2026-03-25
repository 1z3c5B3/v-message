# 📱 V-Message для Android

Приложение для Android с тем же дизайном и функционалом что и веб-версия.

## 📦 Форматы сборок

- **.apk** — для прямой установки
- **.aab** — для Google Play Store

## 🚀 Быстрый старт

### 1. Установите Android Studio
Скачайте с https://developer.android.com/studio

### 2. Установите SDK
- Android SDK 24+
- Android Build Tools 34.0.0
- Android Emulator (опционально)

### 3. Установите зависимости
```bash
cd apps/android
npm install
```

### 4. Запустите разработку
```bash
npm run dev
```

### 5. Соберите APK
```bash
npm run build:apk
```

## 📁 Выходные файлы

После сборки в папке `apps/android/target/`:

```
target/
├── aarch64/release/
│   ├── app.apk
│   └── app.aab
├── armv7/release/
│   └── app.apk
└── x86_64/release/
    └── app.apk
```

## 🎨 Иконки

Создайте папку `icons/` и добавьте:

1. **icon.png** — основная иконка
   - Размер: 512x512 пикселей
   - Формат: PNG

2. **icon_foreground.png** — передний план (Adaptive Icon)
   - Размер: 512x512 пикселей
   - Формат: PNG

3. **icon_background.png** — фон (Adaptive Icon)
   - Размер: 512x512 пикселей
   - Формат: PNG

### Как создать адаптивные иконки:

Используйте Android Asset Studio:
https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

## 🔐 Подпись APK

### Отладочная подпись (автоматически)
Не требует настройки, используется debug keystore.

### Релизная подпись (для публикации)

1. **Создайте keystore:**
```bash
keytool -genkey -v -keystore vmessage.keystore -alias vmessage -keyalg RSA -keysize 2048 -validity 10000
```

2. **Заполните данные:**
- Имя и фамилия
- Название организации
- Город
- Область
- Код страны (RU для России)

3. **Положите файл** `vmessage.keystore` в папку `apps/android/`

4. **Обновите** `tauri.conf.json`:
```json
"signing": {
  "release": {
    "storePassword": "ваш_пароль",
    "keyPassword": "ваш_пароль",
    "keyAlias": "vmessage",
    "storeFile": "../vmessage.keystore"
  }
}
```

## 📋 Разрешения

В `tauri.conf.json` уже настроены:

| Разрешение | Назначение |
|------------|------------|
| `RECORD_AUDIO` | Голосовые сообщения и звонки |
| `CAMERA` | Видеозвонки |
| `INTERNET` | Доступ к интернету |
| `ACCESS_NETWORK_STATE` | Проверка подключения |
| `MODIFY_AUDIO_SETTINGS` | Управление звуком |
| `BLUETOOTH_CONNECT` | Bluetooth гарнитуры |
| `POST_NOTIFICATIONS` | Push-уведомления |
| `READ_EXTERNAL_STORAGE` | Чтение файлов |
| `WRITE_EXTERNAL_STORAGE` | Сохранение файлов |

## 📊 Требования

| Компонент | Версия |
|-----------|--------|
| Android | 7.0+ (API 24) |
| Target SDK | Android 14 (API 34) |
| Node.js | 20.19+ или 22.12+ |
| JDK | 17+ |
| Android Studio | Hedgehog+ |

## 📦 Размер приложения

- APK (arm64): ~15-25 MB
- APK (universal): ~30-40 MB
- AAB: ~10-15 MB

## 🎯 Особенности Android версии

- ✅ Адаптивный дизайн
- ✅ Поддержка тёмной темы
- ✅ Push-уведомления
- ✅ Работа в фоне
- ✅ Оптимизация батареи
- ✅ Adaptive Icon

## 📱 Скриншоты для Google Play

Рекомендуемые размеры:
- **Скриншоты телефона:** 1080x1920 px (минимум 2)
- **Скриншоты планшета:** 1920x1080 px (опционально)
- **Иконка:** 512x512 px
- **Промо:** 180x120 px

## 🧪 Тестирование на устройстве

1. Включите "Режим разработчика" на телефоне
2. Включите "Отладка по USB"
3. Подключите телефон к ПК
4. Запустите:
```bash
npm run dev
```

## 🧪 Тестирование на эмуляторе

1. Создайте эмулятор в Android Studio
2. Выберите образ с Google Play
3. Запустите:
```bash
npm run dev
```

## 🚀 Публикация в Google Play

1. Соберите AAB:
```bash
npm run build:aab
```

2. Подпишите приложение (см. выше)

3. Загрузите в Google Play Console

4. Заполните информацию:
   - Название: V-Message
   - Описание: (см. корневой README)
   - Категория: Общение
   - Возраст: 12+

## 🛠️ Решение проблем

### "SDK not found"
Установите переменную окружения:
```
ANDROID_HOME = C:\Users\<user>\AppData\Local\Android\Sdk
```

### "Java not found"
Установите переменную окружения:
```
JAVA_HOME = C:\Program Files\Java\jdk-17
```

### "Gradle build failed"
Очистите кэш:
```bash
cd apps/android
rm -rf target
npm run build:apk
```

### "Port already in use"
Измените порт в `vite.config.ts` или остановите другие процессы.

## 📞 Поддержка

Email: support@vmsg.app
