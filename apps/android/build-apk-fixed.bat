@echo off
chcp 65001 >nul
echo ============================================
echo   V-Message Android APK Builder
echo ============================================
echo.

cd /d %~dp0

echo [1/6] Проверка зависимостей...
if not exist "src-tauri\Cargo.toml" (
    echo ❌ Ошибка: src-tauri\Cargo.toml не найден!
    goto :error
)

echo [2/6] Копирование tauri.conf.json...
copy /Y tauri.conf.json src-tauri\tauri.conf.json >nul

echo [3/6] Копирование иконок...
if not exist "src-tauri\icons" mkdir src-tauri\icons
copy icons\*.png src-tauri\icons\ >nul 2>&1

echo [4/6] Сборка веб-версии...
cd ../../
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки веб-версии!
    goto :error
)
cd apps/android

echo [5/6] Очистка кэша...
rmdir /s /q target\aarch64\release 2>nul

echo [6/6] Сборка Android APK...
echo.
echo ============================================
echo   НАЧИНАЕТСЯ СБОРКА (15-25 минут)
echo ============================================
echo.

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
    echo.
    echo Проверьте логи выше
)
echo ============================================

:error
echo.
echo ============================================
echo   СБОРКА ЗАВЕРШЕНА
echo ============================================
echo.
echo Нажмите любую клавишу чтобы закрыть...
pause >nul
