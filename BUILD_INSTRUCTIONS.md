# 🚀 V-Message — Сборка для всех платформ

## 📁 Структура проекта

```
v-msg-final/
├── apps/
│   ├── windows/          # Windows приложение (.exe, .msi)
│   │   ├── tauri.conf.json
│   │   ├── package.json
│   │   ├── README.md
│   │   └── icons/
│   ├── android/          # Android приложение (.apk, .aab)
│   │   ├── tauri.conf.json
│   │   ├── package.json
│   │   ├── README.md
│   │   └── icons/
│   └── README.md         # Общая документация
├── src/                  # Исходный код React (общий)
├── dist/                 # Сборка (общая)
├── build-all.bat         # Скрипт сборки для всех платформ
└── BUILD_INSTRUCTIONS.md # Эта инструкция
```

---

## ⚡ Быстрая сборка

### Автоматическая сборка (рекомендуется)

```bash
build-all.bat
```

Этот скрипт:
1. Соберёт веб-версию в `dist/`
2. Соберёт Windows версию в `apps/windows/target/release/`
3. Соберёт Android версию в `apps/android/target/`

---

## 🖥️ Сборка для Windows

### Требования

1. **Node.js** 20.19+ или 22.12+
   - Скачать: https://nodejs.org/

2. **Rust**
   - Скачать: https://rustup.rs/
   - Команда для проверки: `rustc --version`

3. **Visual Studio Build Tools 2022**
   - Скачать: https://visualstudio.microsoft.com/downloads/
   - Установить: "Desktop development with C++"

### Пошаговая инструкция

#### Шаг 1: Установка зависимостей

```bash
cd apps/windows
npm install
```

#### Шаг 2: Запуск разработки

```bash
npm run dev
```

Откроется окно приложения с горячей перезагрузкой.

#### Шаг 3: Сборка релизной версии

```bash
npm run build
```

#### Шаг 4: Поиск файлов

После сборки файлы будут в:

```
apps/windows/target/release/
├── msi/V-Message_2.4.0_x64.msi
├── nsis/V-Message_2.4.0_x64-setup.exe
└── V-Message.exe
```

### 📦 Форматы установщиков

| Формат | Описание |
|--------|----------|
| **.msi** | Стандартный установщик Windows |
| **.exe** | NSIS установщик (рекомендуется) |
| **.exe (portable)** | Портативная версия (без установки) |

---

## 📱 Сборка для Android

### Требования

1. **Node.js** 20.19+ или 22.12+

2. **Android Studio**
   - Скачать: https://developer.android.com/studio
   - Установить Android SDK 24+

3. **JDK 17+**
   - Обычно идёт с Android Studio

4. **Переменные окружения:**
   ```
   ANDROID_HOME = C:\Users\<user>\AppData\Local\Android\Sdk
   JAVA_HOME = C:\Program Files\Java\jdk-17
   ```

### Пошаговая инструкция

#### Шаг 1: Установка зависимостей

```bash
cd apps/android
npm install
```

#### Шаг 2: Запуск разработки

```bash
npm run dev
```

Приложение запустится на подключенном устройстве или эмуляторе.

#### Шаг 3: Сборка APK

```bash
npm run build:apk
```

#### Шаг 4: Сборка AAB (для Google Play)

```bash
npm run build:aab
```

#### Шаг 5: Поиск файлов

После сборки файлы будут в:

```
apps/android/target/
├── aarch64/release/app.apk
├── aarch64/release/app.aab
├── armv7/release/app.apk
└── x86_64/release/app.apk
```

### 📦 Форматы сборок

| Формат | Описание |
|--------|----------|
| **.apk** | Для прямой установки |
| **.aab** | Для Google Play Store |

---

## 🎨 Создание иконок

### Для Windows

1. Создайте изображение 512x512 px
2. Конвертируйте в ICO:
   - Онлайн: https://convertio.co/png-ico/
   - Или через Photoshop/GIMP

3. Положите файлы в `apps/windows/icons/`:
   - `icon.ico`
   - `icon.png`

### Для Android

1. Создайте изображение 512x512 px

2. Используйте Android Asset Studio:
   - https://romannurik.github.io/AndroidAssetStudio/

3. Положите файлы в `apps/android/icons/`:
   - `icon.png` (512x512)
   - `icon_foreground.png` (512x512)
   - `icon_background.png` (512x512)

---

## 🔐 Подпись приложения (Android)

### Для отладки
Не требуется — используется debug keystore автоматически.

### Для релиза

#### 1. Создание keystore

```bash
keytool -genkey -v -keystore vmessage.keystore -alias vmessage -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Заполните данные:
- Имя и фамилия
- Организация
- Город
- Область
- Код страны: RU

#### 3. Положите `vmessage.keystore` в `apps/android/`

#### 4. Обновите `tauri.conf.json`:

```json
"android": {
  "signing": {
    "release": {
      "storePassword": "ваш_пароль",
      "keyPassword": "ваш_пароль",
      "keyAlias": "vmessage",
      "storeFile": "../vmessage.keystore"
    }
  }
}
```

---

## 📊 Размеры файлов

| Платформа | Размер |
|-----------|--------|
| **Windows MSI** | ~3-5 MB |
| **Windows EXE** | ~3-5 MB |
| **Android APK (arm64)** | ~15-25 MB |
| **Android AAB** | ~10-15 MB |

---

## 🛠️ Решение проблем

### Ошибка: "Rust not found"

**Решение:**
1. Установите Rust: https://rustup.rs/
2. Перезапустите терминал
3. Проверьте: `rustc --version`

### Ошибка: "Android SDK not found"

**Решение:**
1. Откройте System Properties → Environment Variables
2. Добавьте:
   ```
   ANDROID_HOME = C:\Users\<user>\AppData\Local\Android\Sdk
   ```
3. Перезапустите терминал

### Ошибка: "Java not found"

**Решение:**
1. Добавьте переменную:
   ```
   JAVA_HOME = C:\Program Files\Java\jdk-17
   ```
2. Добавьте в PATH: `%JAVA_HOME%\bin`

### Ошибка: "Port 3001 already in use"

**Решение:**
1. Найдите процесс: `netstat -ano | findstr :3001`
2. Убейте процесс: `taskkill /F /PID <PID>`
3. Или измените порт в `vite.config.ts`

### Ошибка: "Gradle build failed"

**Решение:**
```bash
cd apps/android
rm -rf target
rm -rf .gradle
npm run build:apk
```

---

## 📋 Чек-лист перед публикацией

### Windows
- [ ] Собран установщик (.msi или .exe)
- [ ] Протестирована установка
- [ ] Протестирована работа
- [ ] Добавлена иконка
- [ ] Проверена работа уведомлений

### Android
- [ ] Собран APK
- [ ] Подписан ключом
- [ ] Протестирована установка
- [ ] Протестирована работа
- [ ] Добавлена иконка
- [ ] Проверены разрешения
- [ ] Сделаны скриншоты (1080x1920)

---

## 📞 Поддержка

Email: support@vmsg.app

---

## 🔗 Полезные ссылки

- Tauri документация: https://tauri.app/
- Android Studio: https://developer.android.com/studio
- Rust: https://www.rust-lang.org/
- Node.js: https://nodejs.org/
