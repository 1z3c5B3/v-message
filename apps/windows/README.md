# 🖥️ V-Message для Windows

Приложение для Windows 10/11 с тем же дизайном и функционалом что и веб-версия.

## 📦 Форматы установщиков

- **.msi** — стандартный установщик Windows
- **.exe** — NSIS установщик (рекомендуется)

## 🚀 Быстрый старт

### 1. Установите Rust
Скачайте с https://rustup.rs/ и запустите установщик.

### 2. Установите зависимости
```bash
cd apps/windows
npm install
```

### 3. Запустите разработку
```bash
npm run dev
```

### 4. Соберите приложение
```bash
npm run build
```

## 📁 Выходные файлы

После сборки в папке `apps/windows/target/release/`:

```
release/
├── msi/
│   └── V-Message_2.4.0_x64.msi
├── nsis/
│   └── V-Message_2.4.0_x64-setup.exe
└── V-Message.exe
```

## 🎨 Иконки

Создайте папку `icons/` и добавьте:

1. **icon.ico** — главный файл иконки
   - Размер: 256x256 пикселей
   - Формат: ICO

2. **icon.png** — PNG версия
   - Размер: 256x256 пикселей
   - Формат: PNG

### Как создать иконку из PNG:
```bash
# Конвертируйте ваш logo.png в icon.ico
convert logo.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## ⚙️ Настройки

### Изменение размера окна
В `tauri.conf.json`:
```json
"windows": [
  {
    "width": 1200,
    "height": 800,
    "minWidth": 360,
    "minHeight": 600
  }
]
```

### Изменение заголовка
```json
"windows": [
  {
    "title": "V-Message"
  }
]
```

## 🔧 Требования

| Компонент | Версия |
|-----------|--------|
| Windows | 10/11 (64-bit) |
| Node.js | 20.19+ или 22.12+ |
| Rust | 1.70+ |
| Visual Studio | Build Tools 2022 |

## 🛠️ Установка Visual Studio Build Tools

1. Скачайте с https://visualstudio.microsoft.com/downloads/
2. Выберите "Build Tools for Visual Studio 2022"
3. Установите компонент "Desktop development with C++"

## 📊 Размер приложения

- Установщик: ~3-5 MB
- После установки: ~15-20 MB

## 🎯 Особенности Windows версии

- ✅ Работает офлайн (после загрузки)
- ✅ Автообновления (можно настроить)
- ✅ Интеграция в системный трей
- ✅ Горячие клавиши
- ✅ Уведомления Windows

## 📞 Поддержка

Email: support@vmsg.app
