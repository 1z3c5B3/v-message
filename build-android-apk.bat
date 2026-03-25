@echo off
chcp 65001 >nul
echo ================================
echo V-Message 2.8v - Сборка Android APK
echo ================================
echo.
echo БЕЗ Android Studio!
echo.

cd /d C:\Users\Вадим\Desktop\v-msg-final

echo [1/4] Сборка веб-версии...
call npm run build
if errorlevel 1 (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)
echo ✅ Веб-версия готова!
echo.

echo [2/4] Синхронизация Android...
call npx cap sync android
if errorlevel 1 (
    echo ❌ Ошибка синхронизации!
    pause
    exit /b 1
)
echo ✅ Android синхронизирован!
echo.

echo [3/4] Сборка APK через Gradle...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo ❌ Ошибка сборки APK!
    echo.
    echo Установите Java JDK:
    echo winget install Oracle.JavaRuntimeEnvironment
    pause
    exit /b 1
)
echo ✅ APK собран!
echo.

echo [4/4] Копирование APK...
cd ..
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    mkdir "Apps\Android app\APK"
    copy "android\app\build\outputs\apk\debug\app-debug.apk" "Apps\Android app\APK\V-Message-2.8.0-debug.apk"
    echo ✅ APK скопирован в Apps/Android app/APK/
) else (
    echo ❌ APK не найден!
)
echo.

echo ================================
echo 🎉 ГОТОВО!
echo ================================
echo.
echo 📱 APK файл:
echo Apps\Android app\APK\V-Message-2.8.0-debug.apk
echo.
echo 🚀 Установка на телефон:
echo 1. Подключите телефон по USB
echo 2. Включите отладку по USB
echo 3. adb install Apps\Android app\APK\V-Message-2.8.0-debug.apk
echo.
echo ИЛИ просто скопируйте APK на телефон и установите!
echo.
pause
