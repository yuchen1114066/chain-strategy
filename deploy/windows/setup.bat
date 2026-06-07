@echo off
chcp 65001 >nul
title 祺驊 CHI HUA AI 戰情中心 - 第一次安裝
color 0F

echo.
echo  ========================================================
echo    祺驊 CHI HUA AI 戰情中心 - 第一次安裝精靈
echo    Industrial Command War Room - First-time Setup
echo  ========================================================
echo.
echo  此腳本會幫你：
echo    1. 檢查 Node.js + Git 是否已安裝
echo    2. 下載/更新程式碼
echo    3. 安裝所有相依套件 ^(含 mssql 鼎新驅動^)
echo    4. 建立 .env.local 連線設定檔
echo    5. Production build
echo.
echo  預計 5-10 分鐘。請保持網路連線。
echo.
pause

REM ==========================================================
REM Step 1: 檢查 Node.js
REM ==========================================================
echo.
echo  [Step 1/5] 檢查 Node.js ...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo  X 找不到 Node.js
    echo.
    echo  請先安裝 Node.js 20 LTS：
    echo    https://nodejs.org/zh-tw/
    echo.
    echo  下載 .msi 安裝檔，雙擊一直 Next 即可。
    echo  安裝完關掉 cmd 視窗重新打開，再執行此腳本。
    echo.
    pause
    start https://nodejs.org/zh-tw/
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo  ✓ Node.js %%i
echo.

REM ==========================================================
REM Step 2: 檢查 Git
REM ==========================================================
echo  [Step 2/5] 檢查 Git ...
where git >nul 2>&1
if errorlevel 1 (
    echo.
    echo  X 找不到 Git
    echo.
    echo  請先安裝 Git for Windows：
    echo    https://git-scm.com/download/win
    echo.
    pause
    start https://git-scm.com/download/win
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do echo  ✓ %%i
echo.

REM ==========================================================
REM Step 3: 安裝相依套件
REM ==========================================================
echo  [Step 3/5] 安裝相依套件 ^(第一次約 5 分鐘^) ...
echo.
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo  X npm install 失敗
    pause
    exit /b 1
)
echo.
echo  ✓ 基本套件安裝完成
echo.

echo  [Step 3.5] 安裝 mssql 驅動 ^(連鼎新用^) ...
call npm install mssql --no-audit --no-fund
if errorlevel 1 (
    echo  X mssql 安裝失敗
    pause
    exit /b 1
)
echo  ✓ mssql 驅動安裝完成
echo.

REM ==========================================================
REM Step 4: 建立 .env.local
REM ==========================================================
echo  [Step 4/5] 建立 .env.local 連線設定檔 ...
if exist .env.local (
    echo  ! 偵測到已有 .env.local，跳過。
    echo    要重新設定請刪掉此檔再執行。
) else (
    > .env.local echo # 鼎新 ERP 連線設定 - 由 setup.bat 產生於 %DATE% %TIME%
    >> .env.local echo # 修改此檔後，請重新執行 start.bat 才會生效
    >> .env.local echo.
    >> .env.local echo TOPGP_DB_HOST=192.168.16.201
    >> .env.local echo TOPGP_DB_PORT=1433
    >> .env.local echo TOPGP_DB_NAME=CHIHUA
    >> .env.local echo TOPGP_DB_USER=^<請填 DBA 給的唯讀帳號^>
    >> .env.local echo TOPGP_DB_PASS=^<請填密碼^>
    >> .env.local echo TOPGP_DB_READONLY=true
    >> .env.local echo TOPGP_DB_ENCRYPT=false
    >> .env.local echo TOPGP_DB_TRUST_CERT=true
    >> .env.local echo.
    >> .env.local echo # 給 cron 用的 token（自動產生隨機值）
    for /f "delims=" %%i in ('powershell -NoLogo -NoProfile -Command "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"') do >> .env.local echo TOPGP_SYNC_TOKEN=%%i
    echo  ✓ .env.local 已建立
    echo.
    echo  --------------------------------------------------------
    echo  ! 重要：等下會用記事本打開 .env.local
    echo    請把 TOPGP_DB_USER 和 TOPGP_DB_PASS 填上 DBA 給你的值
    echo    填完存檔關掉記事本，繼續執行
    echo  --------------------------------------------------------
    echo.
    pause
    notepad .env.local
)
echo.

REM ==========================================================
REM Step 5: Production Build
REM ==========================================================
echo  [Step 5/5] 建立 production build ^(約 1-2 分鐘^) ...
echo.
call npm run build
if errorlevel 1 (
    echo  X Build 失敗 - 請把錯誤訊息截圖傳給工程師
    pause
    exit /b 1
)
echo.
echo  ✓ Build 完成
echo.

REM ==========================================================
REM 完成
REM ==========================================================
echo  ========================================================
echo    安裝完成！
echo  ========================================================
echo.
echo    下次啟動：直接點 start.bat
echo    更新版本：點 update.bat
echo    開瀏覽器：http://localhost:3000
echo.
echo    要分享給同事：找出本機 IP 後告訴他們
echo    執行 show-ip.bat 查本機 IP
echo.
echo  ========================================================
echo.

choice /c yn /n /m "立即啟動 server？ (Y/N) "
if errorlevel 2 goto end
if errorlevel 1 (
    echo.
    echo  正在啟動...
    call start.bat
)

:end
pause
