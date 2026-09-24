@echo off
chcp 65001 >nul
title Al-Bunyan Quranic Numerics Engine - Offline Standalone
color 0A

echo ==============================================================================
echo              AL-BUNYAN QURANIC NUMERICS ENGINE (STANDALONE)
echo            Prepared and Engineered by Scholar Khaled Fouad El-Sayed
echo ==============================================================================
echo.

set "HTML_FILE="
if exist "%~dp0index.html" set "HTML_FILE=%~dp0index.html"
if not defined HTML_FILE if exist "%~dp0AlBunyan.html" set "HTML_FILE=%~dp0AlBunyan.html"
if not defined HTML_FILE if exist "%~dp0AlBunyan-Standalone.html" set "HTML_FILE=%~dp0AlBunyan-Standalone.html"

if not defined HTML_FILE (
    echo [ERROR] Could not find index.html in the current folder!
    echo Please make sure index.html is placed next to this .bat file.
    pause
    exit /b 1
)

echo Launching Al-Bunyan in your default web browser...
start "" "%HTML_FILE%"
timeout /t 3 >nul
exit
