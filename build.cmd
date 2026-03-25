@echo off
REM V-Message - Команды для сборки и развёртывания
REM Мессенджер с входом через Google и push-уведомлениями

echo ========================================
echo V-Message - Сборка и развёртывание
echo ========================================
echo.

REM Переход в папку проекта
cd /d "%~dp0"

echo [1] Сборка проекта для продакшена
echo ----------------------------------
call npm run build
echo.

echo [2] Проверка собранной версии
echo ----------------------------------
if exist "dist\index.html" (
    echo ✓ Сборка успешна! Файлы в папке dist/
) else (
    echo ✗ Ошибка: папка dist не найдена
    pause
    exit /b 1
)
echo.

echo [3] Развёртывание на Netlify
echo ----------------------------------
echo Хотите задеплоить на Netlify? (Y/N)
set /p deploy=
if /i "%deploy%"=="Y" (
    call npx netlify deploy --prod --dir=dist
)
echo.

echo [4] Запуск локального сервера разработки
echo ----------------------------------
echo Хотите запустить dev-сервер? (Y/N)
set /p dev=
if /i "%dev%"=="Y" (
    call npm run dev
)
echo.

echo ========================================
echo Готово!
echo ========================================
pause
