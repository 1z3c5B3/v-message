# 🚀 V-Message Desktop & Mobile Apps

## 📁 Структура проекта

```
v-msg-final/
├── apps/
│   ├── windows/          # Приложение для Windows (.exe, .msi)
│   │   ├── tauri.conf.json
│   │   ├── package.json
│   │   ├── icons/
│   │   └── README.md
│   └── android/          # Приложение для Android (.apk, .aab)
│       ├── tauri.conf.json
│       ├── package.json
│       ├── icons/
│       └── README.md
├── src/                  # Исходный код (общий для всех платформ)
├── dist/                 # Сборка (общая для всех платформ)
└── package.json          # Корневой package.json
```

---

## 🖥️ Windows приложение

### Требования
- Windows 10/11 (64-bit)
- Node.js 20.19+ или 22.12+
- Rust (установить с https://rustup.rs/)
- Visual Studio Build Tools 2022

### Установка зависимостей
```bash
cd apps/windows
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка .exe установщика
```bash
npm run build
```

### Файлы после сборки
- `apps/windows/target/release/msi/V-Message_2.4.0_x64.msi`
- `apps/windows/target/release/nsis/V-Message_2.4.0_x64-setup.exe`

---

## 📱 Android приложение

### Требования
- Android Studio Hedgehog или новее
- Android SDK 24+
- JDK 17+
- Node.js 20.19+ или 22.12+

### Установка зависимостей
```bash
cd apps/android
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка .apk
```bash
npm run build:apk
```

### Сборка .aab (для Google Play)
```bash
npm run build:aab
```

### Файлы после сборки
- `apps/android/target/aarch64/release/app.apk`
- `apps/android/target/aarch64/release/app.aab`

---

## 🎨 Иконки

### Для Windows
Создайте папку `apps/windows/icons/` и добавьте:
- `icon.ico` (256x256)
- `icon.png` (256x256)

### Для Android
Создайте папку `apps/android/icons/` и добавьте:
- `icon.png` (512x512)
- `icon_foreground.png` (512x512)
- `icon_background.png` (512x512)

---

## 🔐 Подпись APK (для релиза)

1. Создайте keystore:
```bash
keytool -genkey -v -keystore vmessage.keystore -alias vmessage -keyalg RSA -keysize 2048 -validity 10000
```

2. Положите `vmessage.keystore` в `apps/android/`

3. Обновите `tauri.conf.json`:
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

---

## 📦 Разрешения Android

В `apps/android/tauri.conf.json` уже настроены:
- `RECORD_AUDIO` — голосовые сообщения и звонки
- `CAMERA` — видеозвонки
- `INTERNET` — доступ к сети
- `POST_NOTIFICATIONS` — уведомления
- `READ/WRITE_EXTERNAL_STORAGE` — файлы

---

## 🛠️ Решение проблем

### Ошибка: "Rust not found"
Установите Rust: https://rustup.rs/

### Ошибка: "Android SDK not found"
Установите переменные окружения:
- `ANDROID_HOME` = путь к SDK
- `JAVA_HOME` = путь к JDK

### Ошибка: "Port 3001 already in use"
Остановите другие процессы или измените порт в `vite.config.ts`

---

## 📞 Поддержка

Email: support@vmsg.app
