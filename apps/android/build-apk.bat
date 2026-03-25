@echo off
chcp 65001 >nul
echo ============================================
echo   V-Message Android APK Builder
echo ============================================
echo.

cd /d %~dp0

echo [1/5] Проверка зависимостей...
if not exist "src-tauri\Cargo.toml" (
    echo ❌ Ошибка: src-tauri\Cargo.toml не найден!
    pause
    exit /b 1
)

echo [2/5] Копирование tauri.conf.json...
copy /Y tauri.conf.json src-tauri\tauri.conf.json >nul

echo [3/5] Копирование иконок...
if not exist "src-tauri\icons" mkdir src-tauri\icons
copy icons\*.png src-tauri\icons\ >nul 2>&1

echo [4/5] Сборка веб-версии...
cd ../../
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки веб-версии!
    pause
    exit /b 1
)
cd apps/android

echo [5/5] Сборка Android APK...
call npm run build:apk

echo.
echo ============================================
if exist "target\aarch64\release\app.apk" (
    echo ✅ APK ГОТОВ!
    echo.
    echo Путь к файлу:
    echo %CD%\target\aarch64\release\app.apk
    echo.
    echo Можно устанавливать на телефон!
) else (
    echo ❌ Ошибка сборки APK
    echo Проверьте логи выше
)
echo ============================================
echo.
pause
