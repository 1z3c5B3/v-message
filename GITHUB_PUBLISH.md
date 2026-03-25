# 🚀 V-Message 2.8v - Публикация в GitHub

## ✅ Что готово:

- ✅ Интерфейс 1-в-1 как в веб-версии
- ✅ 50+ функций реализовано
- ✅ GitHub Actions настроены
- ✅ Android APK собирается в облаке
- ✅ Windows EXE собирается в облаке
- ✅ Папки Apps созданы

---

## 📦 Публикация по шагам

### Шаг 1: Создайте репозиторий на GitHub

1. Откройте https://github.com/new
2. Название: `v-message`
3. Описание: "Кроссплатформенный мессенджер"
4. Public ✅
5. **Create repository**

---

### Шаг 2: Запушьте код

```bash
cd C:\Users\Вадим\Desktop\v-msg-final

# Инициализация
git add .
git commit -m "V-Message 2.8v - Initial commit"
git branch -M main

# Публикация (замените ВАШ_НИК на свой GitHub username)
git remote add origin https://github.com/ВАШ_НИК/v-message.git
git push -u origin main
```

---

### Шаг 3: GitHub Actions начнёт сборку

1. Откройте https://github.com/ВАШ_НИК/v-message/actions
2. Вы увидите запущенные workflow:
   - 🤖 Android APK Build
   - 🖥️ Windows EXE Build

3. Ждите завершения (~5-15 минут)

---

### Шаг 4: Скачайте APK и EXE

#### Android APK:
1. Откройте https://github.com/ВАШ_НИК/v-message/actions
2. Кликните на последний запуск (зелёная галочка)
3. Прокрутите вниз до **Artifacts**
4. Скачайте `V-Message-Debug-APK.zip`
5. Распакуйте → `app-debug.apk`
6. Установите на телефон

#### Windows EXE:
1. Откройте https://github.com/ВАШ_НИК/v-message/actions
2. Кликните на последний запуск
3. В **Artifacts** скачайте `V-Message-Windows-EXE.zip`
4. Распакуйте → `V-Message.exe`
5. Запустите на Windows

---

## 🎯 Автоматическая сборка

### При каждом push:
```bash
# Внесите изменения
git add .
git commit -m "Описание изменений"
git push
```

GitHub Actions автоматически:
- ✅ Соберёт Android APK
- ✅ Соберёт Windows EXE
- ✅ Загрузит в Artifacts

---

## 🏷️ Публикация релиза

### Создайте тег версии:
```bash
git tag v2.8.0
git push origin v2.8.0
```

GitHub Actions:
- ✅ Соберёт APK и EXE
- ✅ Создаст релиз на GitHub
- ✅ Прикрепит файлы

Релиз: https://github.com/ВАШ_НИК/v-message/releases

---

## 📁 Структура репозитория

```
v-message/
├── 📁 .github/workflows/     # GitHub Actions
│   ├── android-build.yml    # Сборка Android APK
│   └── windows-build.yml    # Сборка Windows EXE
├── 📁 src/                   # Исходный код React
├── 📁 public/                # Статические файлы
├── 📁 Apps/                  # Готовые приложения (не коммитится)
│   ├── Windows app/
│   └── Android app/
├── 📄 package.json
├── 📄 README.md
├── 📄 GITHUB_ACTIONS.md      # Инструкция по сборке
└── 📄 DEPLOYMENT.md          # Инструкция по деплою
```

---

## ⚙️ Настройка workflow

### Изменить версию:
Откройте `.github/workflows/android-build.yml`:
```yaml
- name: Create Release
  if: startsWith(github.ref, 'refs/tags/v2')  # Измените на свою версию
```

### Изменить название приложения:
Откройте `capacitor.config.json`:
```json
{
  "appName": "V-Message"  # Измените название
}
```

---

## 🔧 Решение проблем

### Ошибка: "Repository not found"
```bash
# Проверьте что репозиторий существует
git remote -v

# Если пусто, добавьте снова:
git remote add origin https://github.com/ВАШ_НИК/v-message.git
git push -u origin main
```

### Ошибка: "Permission denied"
```bash
# Создайте Personal Access Token:
# https://github.com/settings/tokens

# Используйте токен при пуше:
git push https://ВАШ_НИК:TOKEN@github.com/ВАШ_НИК/v-message.git
```

### Workflow не запускается
1. Откройте https://github.com/ВАШ_НИК/v-message/actions
2. Нажмите **Run workflow** (справа)
3. Выберите ветку `main`
4. Нажмите **Run workflow**

---

## 📊 Лимиты GitHub Actions

| Тип | Лимит |
|-----|-------|
| Минут в месяц | 2000 (бесплатно) |
| Одновременных jobs | 20 |
| Размер Artifact | 500 MB |
| Хранение Artifact | 30 дней |

**Одной сборки хватает на ~15 минут.**  
**2000 минут = ~130 сборок в месяц!**

---

## ✅ Финальный чек-лист

- [ ] Репозиторий создан на GitHub
- [ ] Код запушен (`git push`)
- [ ] Workflow файлы в `.github/workflows/`
- [ ] Actions запущены (зелёная галочка)
- [ ] APK скачан из Artifacts
- [ ] EXE скачан из Artifacts
- [ ] Тег версии создан (`git tag v2.8.0`)

---

## 🎉 Готово!

**Ваше приложение:**
- ✅ Доступно на GitHub
- ✅ APK собирается автоматически
- ✅ EXE собирается автоматически
- ✅ Интерфейс 1-в-1 как в веб-версии

**Ссылки:**
- Репозиторий: https://github.com/ВАШ_НИК/v-message
- Actions: https://github.com/ВАШ_НИК/v-message/actions
- Releases: https://github.com/ВАШ_НИК/v-message/releases

---

**V-Message 2.8v** - Готово к публикации! 🚀
