@echo off
chcp 65001 >nul
title 祺驊 CHI HUA AI 戰情中心 - 更新中
color 0F

echo.
echo  ========================================================
echo    更新到最新版本
echo  ========================================================
echo.
echo  此腳本會：
echo    1. 從 GitHub 抓最新程式碼
echo    2. 重新安裝相依套件 ^(如有新增^)
echo    3. 重新 build
echo.
echo  預計 2-5 分鐘。請先關掉正在跑的 server （Ctrl+C）。
echo.
pause

echo.
echo  [1/3] 抓最新程式碼 ...
git pull origin claude/add-equipment-bom-linking-dflrg
if errorlevel 1 (
    echo  X git pull 失敗 - 可能有衝突或網路問題
    pause
    exit /b 1
)
echo  ✓ 程式碼已更新
echo.

echo  [2/3] 安裝更新的相依套件 ...
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo  X npm install 失敗
    pause
    exit /b 1
)
echo  ✓ 套件 OK
echo.

echo  [3/3] 重新 build ...
call npm run build
if errorlevel 1 (
    echo  X Build 失敗
    pause
    exit /b 1
)
echo  ✓ Build 完成
echo.

echo  ========================================================
echo    更新完成！執行 start.bat 啟動。
echo  ========================================================
echo.

choice /c yn /n /m "立即重新啟動 server？ (Y/N) "
if errorlevel 2 goto end
if errorlevel 1 call start.bat

:end
pause
