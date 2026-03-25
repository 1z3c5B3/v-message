# 🚀 Сборка через GitHub Actions

## 📱 Android APK - Сборка в облаке

### ✅ Преимущества:
- ✅ Не нужна Android Studio
- ✅ Не нужна Java на компьютере
- ✅ Нет проблем с путями (кириллица)
- ✅ Автоматическая сборка при каждом push
- ✅ APK доступен в GitHub Releases

---

## 🔧 Настройка

### 1. Создайте репозиторий на GitHub

```bash
cd C:\Users\Вадим\Desktop\v-msg-final
git init
git add .
git commit -m "V-Message 2.8v - Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/v-message.git
git push -u origin main
```

### 2. Workflow файлы уже созданы!

- `.github/workflows/android-build.yml` - Android APK
- `.github/workflows/windows-build.yml` - Windows EXE

---

## 📱 Сборка Android APK

### Автоматически:

1. **Запушьте код:**
   ```bash
   git push
   ```

2. **GitHub Actions начнёт сборку:**
   - Откройте https://github.com/ВАШ_НИК/v-message/actions
   - Ждите ~5-10 минут

3. **Скачайте APK:**
   - Откройте вкладку **Actions**
   - Выберите последний запуск
   - В разделе **Artifacts** скачайте `V-Message-Debug-APK.zip`

### Вручную (через Releases):

1. **Создайте тег:**
   ```bash
   git tag v2.8.0
   git push origin v2.8.0
   ```

2. **APK появится в Releases:**
   - https://github.com/ВАШ_НИК/v-message/releases

---

## 🖥️ Сборка Windows EXE

### Автоматически:

1. **Запушьте код:**
   ```bash
   git push
   ```

2. **GitHub Actions начнёт сборку:**
   - Откройте https://github.com/ВАШ_НИК/v-message/actions
   - Ждите ~10-15 минут

3. **Скачайте EXE:**
   - Откройте вкладку **Actions**
   - Выберите последний запуск
   - В разделе **Artifacts** скачайте `V-Message-Windows-EXE.zip`

---

## 🎯 Ручной запуск сборки

### В GitHub Actions:

1. Откройте https://github.com/ВАШ_НИК/v-message/actions
2. Выберите workflow (Android Build или Windows Build)
3. Нажмите **Run workflow**
4. Выберите ветку (main)
5. Нажмите **Run workflow**

---

## 📊 Структура workflow

### Android Build:
```yaml
name: Android APK Build
on: [push, pull_request, workflow_dispatch]
jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Node.js
      - Setup Java
      - npm install
      - npm run build
      - npx cap sync android
      - ./gradlew assembleDebug
      - Upload APK
```

### Windows Build:
```yaml
name: Windows EXE Build
on: [push, pull_request, workflow_dispatch]
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - Checkout
      - Setup Node.js
      - Setup Rust
      - npm install
      - npm run build
      - npx tauri build
      - Upload EXE/MSI
```

---

## 📥 Скачивание APK

### Из Actions:
1. Откройте https://github.com/ВАШ_НИК/v-message/actions
2. Кликните на последний успешный запуск (зелёная галочка)
3. Прокрутите вниз до **Artifacts**
4. Скачайте `V-Message-Debug-APK.zip`
5. Распакуйте и установите на телефон

### Из Releases:
1. Откройте https://github.com/ВАШ_НИК/v-message/releases
2. Скачайте APK из последнего релиза
3. Установите на телефон

---

## ⚙️ Настройка секретов (для авто-релизов)

### GitHub Token:
- Автоматически создаётся для каждого репозитория
- Не нужно настраивать

### Для публикации в Google Play:
1. Откройте **Settings** → **Secrets and variables** → **Actions**
2. Добавьте секрет:
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` - JSON от сервисного аккаунта
   - `GOOGLE_PLAY_PACKAGE_NAME` - com.vmessage.app

---

## 🎯 Команды для публикации

### Первая публикация:
```bash
cd C:\Users\Вадим\Desktop\v-msg-final
git add .
git commit -m "V-Message 2.8v - Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/v-message.git
git push -u origin main
```

### Обновление:
```bash
git add .
git commit -m "Update: описание изменений"
git push
```

### Релиз версии:
```bash
git tag v2.8.0
git push origin v2.8.0
```

---

## 📊 Время сборки

| Платформа | Время | Результат |
|-----------|-------|-----------|
| Android APK | ~5-10 мин | `app-debug.apk` |
| Windows EXE | ~10-15 мин | `V-Message.exe` |
| Windows MSI | ~10-15 мин | `*.msi` |

---

## ✅ Преимущества GitHub Actions

- ✅ **Бесплатно** - 2000 минут в месяц
- ✅ **Быстро** - сборка в облаке
- ✅ **Надёжно** - нет проблем с локальной средой
- ✅ **Автоматически** - при каждом push
- ✅ **Доступно** - APK можно скачать отовсюду

---

## 🔗 Ссылки

- GitHub Actions: https://github.com/features/actions
- Capacitor: https://capacitorjs.com/
- Tauri: https://tauri.app/

---

**Сборка через GitHub - Быстро. Надёжно. Бесплатно!** 🚀
