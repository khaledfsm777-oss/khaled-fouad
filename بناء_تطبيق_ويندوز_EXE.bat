@echo off
chcp 65001 >nul
title تحويل تطبيق البنيان لملف تنفيذي ويندوز EXE
color 0E

echo ===============================================================================
echo     منظومة البنيان الرقمي للقرآن الكريم - معالج بناء الملف التنفيذي (.EXE)
echo ===============================================================================
echo.
echo [1/2] بناء الحزمة الكاملة ومحرك الحسابات...
call npm run build
if %errorlevel% neq 0 (
    echo [خطأ] فشل البناء. يرجى التحقق من Node.js.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/2] توليد الملف التنفيذي المحمول Portable EXE عبر Electron Builder...
call npx electron-builder --win portable --x64
if %errorlevel% neq 0 (
    echo.
    echo ملاحظة: إذا كنت في بيئة سريعة لا تحتوي على حزم electron-builder الكاملة،
    echo يمكنك تشغيل التطبيق كبرنامج مكتبي مباشر بالأمر:
    echo     npm run electron:dev
    echo أو استخدام ملف HTML المستقل المدمج بنقرة واحدة.
    pause
    exit /b %errorlevel%
)

echo.
echo ===============================================================================
echo [تم بنجاح!] تم استخراج الملف التنفيذي داخل مجلد (release):
echo   release\البنيان_الرقمي_محمول_Portable.exe
echo ===============================================================================
pause
