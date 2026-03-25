@echo off
chcp 65001 >nul
echo ============================================
echo   V-Message - Сборка для всех платформ
echo ============================================
echo.

echo [1/4] Сборка веб-версии...
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки веб-версии!
    pause
    exit /b 1
)
echo ✅ Веб-версия собрана!
echo.

echo [2/4] Сборка Windows версии...
cd apps\windows
call npm install 2>nul
if errorlevel 1 (
    echo ⚠️ Пропущено (нет зависимостей)
) else (
    call npm run build
    if errorlevel 1 (
        echo ❌ Ошибка сборки Windows!
    ) else (
        echo ✅ Windows версия собрана!
    )
)
cd ..\..
echo.

echo [3/4] Сборка Android версии...
cd apps\android
call npm install 2>nul
if errorlevel 1 (
    echo ⚠️ Пропущено (нет зависимостей)
) else (
    call npm run build:apk
    if errorlevel 1 (
        echo ❌ Ошибка сборки Android!
    ) else (
        echo ✅ Android версия собрана!
    )
)
cd ..\..
echo.

echo ============================================
echo   Сборка завершена!
echo ============================================
echo.
echo Файлы:
echo   - Веб: dist/
echo   - Windows: apps/windows/target/release/
echo   - Android: apps/android/target/
echo.
pause
