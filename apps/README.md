# 📱 V-Message Apps

Готовые приложения для всех платформ!

---

## 📁 Структура

```
Apps/
├── Windows app/          # Приложение для Windows
│   ├── dist/            # Веб-версия для Windows
│   ├── README.md        # Инструкция по сборке
│   └── v-message-web-2.8.0.zip  # Готовый архив
│
├── Android app/         # Приложение для Android
│   ├── dist/           # Веб-версия для Android
│   ├── README.md       # Инструкция по сборке
│   └── v-message-web-2.8.0.zip  # Готовый архив
│
└── README.md           # Этот файл
```

---

## 🚀 Быстрая сборка

### Автоматическая сборка (все платформы)

Запустите в корневой папке:
```bash
auto-build.bat
```

**Что делает:**
1. ✅ Собирает веб-версию
2. ✅ Копирует в папки платформ
3. ✅ Синхронизирует Android
4. ✅ Создаёт ZIP архивы
5. ✅ Готовит к сборке EXE/APK

---

## 🖥️ Windows

### Файлы:
- `Windows app/dist/` - Веб-версия
- `Windows app/README.md` - Инструкция

### Сборка EXE:
```bash
cd ../../src-tauri
cargo tauri build
```

**Результат:** `src-tauri/target/release/bundle/`

---

## 📱 Android

### Файлы:
- `Android app/dist/` - Веб-версия
- `Android app/README.md` - Инструкция

### Сборка APK:
```bash
cd ../../
npx cap open android
```

В Android Studio: **Build → Build APK**

**Результат:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🌐 Веб

### Файлы:
- `../dist/` - Готовая веб-версия

### Деплой:
```bash
# Firebase
firebase deploy --only hosting

# Netlify
netlify deploy --prod --dir=../dist

# Vercel
vercel --prod
```

---

## ✅ Интерфейс

**1-в-1 как в веб-версии!**

- ✅ Все 5 тем оформления
- ✅ Все функции чата
- ✅ Все звонки (видео + аудио)
- ✅ Админ-панель
- ✅ Push-уведомления
- ✅ Все 50+ функций

---

## 📊 Версии

| Платформа | Версия | Статус |
|-----------|--------|--------|
| Web | 2.8.0 | ✅ Готово |
| Windows | 2.8.0 | ✅ Готово к сборке |
| Android | 2.8.0 | ✅ Готово к сборке |

---

## 📞 Поддержка

- Email: support@v-message.app
- Telegram: @vmessage
- Website: https://v-message.app

---

**V-Message 2.8v** - Быстро. Безопасно. Кроссплатформенно. 🚀
