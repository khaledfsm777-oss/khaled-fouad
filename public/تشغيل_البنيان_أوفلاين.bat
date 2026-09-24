@echo off
chcp 65001 >nul
title منظومة البنيان الرقمي للقرآن الكريم - نسخة أوفلاين المستقلة
color 0A

echo ==============================================================================
echo                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
echo              مَنْظُومَةُ البُنْيَانِ الرَّقَمِيِّ لِلْقُرْآنِ الكَرِيمِ
echo            المحرك الشامل للتحليل العددي والاستقصاء النوراني الموزون
echo        إعداد وابتكار: الباحث خالد فؤاد السيد - الإصدار المكتبي المستقل
echo ==============================================================================
echo.
echo  [*] يتم الآن فحص ملفات التطبيق المستقلة...
echo.

set "HTML_FILE="
if exist "%~dp0index.html" set "HTML_FILE=%~dp0index.html"
if not defined HTML_FILE if exist "%~dp0AlBunyan.html" set "HTML_FILE=%~dp0AlBunyan.html"
if not defined HTML_FILE if exist "%~dp0AlBunyan-Standalone.html" set "HTML_FILE=%~dp0AlBunyan-Standalone.html"
if not defined HTML_FILE if exist "%~dp0البنيان_الرقمي_المستقل.html" set "HTML_FILE=%~dp0البنيان_الرقمي_المستقل.html"

if not defined HTML_FILE (
    echo [خطأ] لم يتم العثور على ملف HTML المستقل بجانب ملف التشغيل!
    echo الرجاء التأكد من وجود ملف index.html في نفس المجلد مع هذا الملف.
    echo.
    pause
    exit /b 1
)

echo  [OK] تم العثور على ملف المنظومة المستقل:
echo       %HTML_FILE%
echo.
echo  [*] جاري إطلاق منظومة البنيان في متصفحك الافتراضي (أوفلاين بدون إنترنت)...
echo.

start "" "%HTML_FILE%"

echo  ----------------------------------------------------------------------------
echo  تم فتح البرنامج بنجاح. يمكنك إغلاق هذه النافذة أو ستغلق تلقائياً خلال ثوانٍ.
echo  ----------------------------------------------------------------------------
timeout /t 5 >nul
exit
