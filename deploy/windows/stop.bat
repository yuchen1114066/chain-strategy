@echo off
chcp 65001 >nul
title 祺驊 CHI HUA AI 戰情中心 - 停止
color 0F

echo.
echo  ========================================================
echo    停止戰情中心 server
echo  ========================================================
echo.
echo  正在停止占用 port 3000 的程序 ...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo  終止 PID %%a ...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  ✓ 已停止
echo.
pause
