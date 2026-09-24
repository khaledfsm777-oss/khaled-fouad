@echo off
chcp 65001 > nul
title منظومة البنيان الرقمي للقرآن الكريم
color 0A
cls
echo ======================================================================
echo    منظومة البنيان الرقمي للقرآن الكريم - التشغيل المكتبي الفوري
echo    متوافق مع Windows 7 / 8 / 8.1 / 10 / 11 بدون أي تثبيت مسبق
echo ======================================================================
echo.
echo  [✓] جاري تشغيل المحرك الرقمي وفتح واجهة البرنامج في المتصفح تلقائياً...
echo.
echo  ملاحظة: يمكنك تصغير هذه النافذة، لكن لا تغلقها أثناء استخدام البرنامج.
echo ======================================================================
echo.

cd /d "%~dp0"

if exist "dist\index.html" (
    set "APP_DIR=dist"
) else (
    set "APP_DIR=."
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$port = 45678; $url = 'http://localhost:' + $port + '/'; Start-Process $url; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add($url); $listener.Start(); Write-Host 'البرنامج يعمل بنجاح على الرابط:' $url; while ($listener.IsListening) { try { $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response; $rel = $req.Url.LocalPath.TrimStart('/'); if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }; $target = Join-Path '%APP_DIR%' $rel; if (-not (Test-Path $target)) { $target = Join-Path '%APP_DIR%' 'index.html' }; if (Test-Path $target) { $bytes = [System.IO.File]::ReadAllBytes($target); $ext = [System.IO.Path]::GetExtension($target).ToLower(); switch ($ext) { '.html' { $res.ContentType = 'text/html; charset=utf-8' } '.js' { $res.ContentType = 'application/javascript; charset=utf-8' } '.css' { $res.ContentType = 'text/css; charset=utf-8' } '.json' { $res.ContentType = 'application/json; charset=utf-8' } '.woff2' { $res.ContentType = 'font/woff2' } '.woff' { $res.ContentType = 'font/woff' } '.svg' { $res.ContentType = 'image/svg+xml' } '.png' { $res.ContentType = 'image/png' } default { $res.ContentType = 'application/octet-stream' } }; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 }; $res.OutputStream.Close() } catch {} }"
