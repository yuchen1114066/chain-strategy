@echo off
chcp 65001 >nul
title 祺驊 CHI HUA AI 戰情中心 - 運行中
color 0F

echo.
echo  ========================================================
echo    祺驊 CHI HUA AI · 戰情中心
echo    Industrial Command War Room - LIVE
echo  ========================================================
echo.
echo   啟動中... 請稍候 5-15 秒
echo.
echo  ========================================================
echo   本機開啟：http://localhost:3000
echo   同事開啟：http://%COMPUTERNAME%:3000
echo   或執行 show-ip.bat 看完整 IP
echo  ========================================================
echo.
echo   ! 不要關掉這個視窗（會停止服務）
echo   ! 按 Ctrl + C 可以停止
echo.

call npm start

REM 若 npm start 異常退出
echo.
echo  ========================================================
echo   ! Server 已停止
echo  ========================================================
echo.
pause
