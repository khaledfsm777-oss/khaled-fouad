@echo off
chcp 65001 > nul
title بناء ملف EXE - منظومة البنيان الرقمي للقرآن الكريم (Windows 8 / 8.1 / 10 / 11)

echo ========================================================
echo   منظومة البنيان الرقمي للقرآن الكريم - أداة استخراج EXE
echo   متوافق 100%% مع Windows 8.1 و Windows 8 و Windows 7 و 10 و 11
echo ========================================================
echo.

echo [1/3] جاري تثبيت حزم Electron 22 المخصصة حصراً لويندوز 8 القديم...
call npm install electron@22.3.27 electron-builder@24.6.4 --save-dev --save-exact
if %errorlevel% neq 0 (
    echo [خطأ] فشل في تثبيت الحزم، تأكد من اتصال الإنترنت وتثبيت Node.js
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] جاري بناء وتجميع ملفات الواجهة والبيانات القرآنية (Production Build)...
call npm run build
if %errorlevel% neq 0 (
    echo [خطأ] فشل في عملية البناء
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] جاري تجميع ملفات الـ EXE المحمولة (32-bit و 64-bit على نواة Electron 22)...
call npx electron-builder --win portable --ia32 --x64 --config.electronVersion=22.3.27
if %errorlevel% neq 0 (
    echo [خطأ] فشل في تجميع ملف الـ EXE
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo   تهانينا! تم إنشاء ملفات الـ EXE بنجاح تام وبدون أي أخطاء.
echo.
echo   ستجد الملفات التنفيذية الجاهزة داخل مجلد: release
echo.
echo   - ملف (ia32): يشتغل على كل أجهزة ويندوز 8 القديمة (سواء كانت 32-bit أو 64-bit).
echo   - ملف (x64): مخصص لأجهزة 64-bit الحديثة.
echo ========================================================
echo.
pause
