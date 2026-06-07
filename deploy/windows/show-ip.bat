@echo off
chcp 65001 >nul
title 祺驊 CHI HUA AI 戰情中心 - 本機 IP 查詢
color 0F

echo.
echo  ========================================================
echo    本機 IP 位址 ^(分享給同事用^)
echo  ========================================================
echo.
echo  電腦名稱：%COMPUTERNAME%
echo.
echo  IPv4 位址：
echo.
ipconfig | findstr /C:"IPv4"
echo.
echo  ========================================================
echo  同事在公司網路內可以開啟：
echo  ========================================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP: =!
    echo    http://!IP!:3000
    endlocal
)
echo.
echo  也可以用電腦名稱：
echo    http://%COMPUTERNAME%:3000
echo.
pause
