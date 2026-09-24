@echo off
chcp 65001 >nul
title بناء تطبيق أندرويد APK - منظومة البنيان الرقمي للقرآن الكريم
color 0A

echo ===============================================================================
echo       منظومة البنيان الرقمي للقرآن الكريم - معالج استخراج تطبيق أندرويد (APK)
echo ===============================================================================
echo.
echo [1/3] فحص البيئة وتحديث ملفات المشروع...
call npm run build
if %errorlevel% neq 0 (
    echo [خطأ] فشل بناء ملفات الواجهة. يرجى التحقق من تثبيت Node.js.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] مزامنة المشروع مع بيئة أندرويد (Capacitor Sync)...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [خطأ] تعذر مزامنة مجلد أندرويد.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] التحقق من بيئة بناء APK...
if exist "android\gradlew.bat" (
    echo تم العثور على محرك Gradle المباشر.
    echo جارٍ تجميع ملف APK...
    cd android
    call gradlew.bat assembleDebug
    cd ..
    if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        echo.
        echo ===============================================================================
        echo [تهانينا!] تم استخراج ملف التطبيق بنجاح:
        echo المسار: android\app\build\outputs\apk\debug\app-debug.apk
        echo ===============================================================================
        pause
        exit /b 0
    )
)

echo.
echo لم يتم العثور على حزمة Android SDK المثبتة محلياً للبناء المباشر.
echo يمكنك فتح المشروع مباشرة في برنامج Android Studio بنقرة واحدة:
echo تشغيل الأمر: npx cap open android
echo أو استخدام مجلد المشروع (android) في أي منصة بناء سحابية (GitHub Actions / VoltBuilder).
echo.
pause
