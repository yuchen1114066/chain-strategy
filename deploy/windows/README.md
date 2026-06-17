# 祺驊 CHI HUA AI 戰情中心 — Windows 內網部署手冊

> 把戰情中心跑在公司內網一台 Win10/11 電腦上，連你們的鼎新 ERP（192.168.16.201）。
> 同事用瀏覽器直接連這台電腦看，**資料完全不出公司網路**。

---

## 📦 你需要準備

| 項目 | 規格 |
|---|---|
| **電腦** | 任何能跑 Win10/11 的閒置 PC / NUC / 筆電（i5+8GB RAM 以上） |
| **網路** | 跟鼎新主機（192.168.16.x）同網段，能 ping 到 192.168.16.201 |
| **權限** | 你帳號要能裝軟體（系統管理員或請 IT 暫時開權限） |
| **DBA 給的** | 鼎新唯讀帳號 + 密碼（見 [給 IT 的 email 範本](../IT-EMAIL-TEMPLATE.md)） |

---

## 🚀 安裝步驟（10 分鐘）

### Step 1 — 先裝 2 個免費工具

#### 1.1 安裝 Node.js 20 LTS
1. 開瀏覽器 → https://nodejs.org/zh-tw/
2. 點橘色「**20.xx.x LTS — 推薦給大多數使用者**」按鈕下載 `.msi`
3. 雙擊安裝檔
4. **一直按 Next 不要改任何選項**，最後按 Install
5. 看到 "The installation was successful." → 按 Finish

> **怎麼確認裝好？**  
> 按 Windows 鍵 → 打 `cmd` → 開「命令提示字元」  
> 打 `node --version` 按 Enter  
> 看到 `v20.xx.x` 就 OK

#### 1.2 安裝 Git for Windows
1. 開瀏覽器 → https://git-scm.com/download/win
2. 自動下載 `.exe`，下載完雙擊
3. **一直按 Next 不要改任何選項**
4. 安裝完按 Finish

> **怎麼確認裝好？**  
> 開 cmd → 打 `git --version` 看到 `git version 2.xx.x` 就 OK

#### 1.3 重啟一下命令提示字元
**裝完上面 2 個後，把所有 cmd 視窗都關掉重開**，環境變數才會生效。

---

### Step 2 — 下載戰情中心程式碼

開 cmd（命令提示字元），打：

```cmd
cd C:\
git clone https://github.com/yuchen1114066/chain-strategy.git
cd chain-strategy
git checkout claude/add-equipment-bom-linking-dflrg
```

> **第一次 git clone 可能會問你 GitHub 帳號密碼**  
> 帳號：你的 GitHub username  
> 密碼：**不能用密碼，要用 Personal Access Token**  
> 沒有？開 https://github.com/settings/tokens → Generate new token (classic) → 勾 `repo` → 產生  
> 那串字（ghp_xxxxx）就當作密碼貼進去

---

### Step 3 — 執行一鍵安裝精靈

雙擊 `deploy\windows\setup.bat`

腳本會自動：

1. **檢查 Node.js + Git** ✓  
2. **安裝相依套件**（第一次約 5 分鐘，會看到很多 npm install 訊息跑過）
3. **安裝 mssql 鼎新驅動** ✓
4. **建立 `.env.local`** ← 你會看到記事本跳出來
5. **跳出記事本要你填密碼** ← 重點 ↓

#### 在記事本裡，找到這 2 行：

```
TOPGP_DB_USER=<請填 DBA 給的唯讀帳號>
TOPGP_DB_PASS=<請填密碼>
```

改成（範例）：
```
TOPGP_DB_USER=chihua_ai_readonly
TOPGP_DB_PASS=你的密碼
```

**Ctrl+S 存檔 → 關掉記事本** → 腳本會繼續跑。

6. **Production build**（約 1-2 分鐘）

看到「**安裝完成！**」就成功了。腳本會問你要不要立即啟動，按 `Y` 即可。

---

### Step 4 — 平常每天怎麼開

```
   雙擊 start.bat
```

會看到一個黑色視窗，等 5-15 秒後顯示：
```
✓ Ready in 8.2s
- Local:   http://localhost:3000
```

開瀏覽器打 `http://localhost:3000` → 看到戰情中心 🎯

> ⚠ **這個黑色視窗不要關**，關了 server 就停了。  
> 想停按 `Ctrl + C`，或執行 `stop.bat`。

---

### Step 5 — 讓同事也能看

1. 在這台 PC 雙擊 `show-ip.bat`，會顯示：
   ```
   電腦名稱：DESKTOP-XXX
   IPv4 位址：192.168.16.50
   
   同事在公司網路內可以開啟：
     http://192.168.16.50:3000
     http://DESKTOP-XXX:3000
   ```
2. 把這個 URL 用 LINE/Email 傳給同事
3. 同事在公司內網開瀏覽器 → 看到戰情中心 ✓

> **同事打不開？** 看下方 [Windows 防火牆](#-同事連不到-windows-防火牆) 那節。

---

### Step 6 — 更新版本

需要更新（我推新功能上去後）：

```
   雙擊 update.bat
```

會自動 `git pull` + `npm install` + `npm run build`。約 2-5 分鐘。
跑完問你要不要重啟，按 `Y`。

---

## 🔥 同事連不到？Windows 防火牆

Win10/11 預設擋外部連入 port 3000。

### 開放 port（系統管理員權限）

1. 按 Windows 鍵 → 打 `powershell` → 右鍵「**以系統管理員身分執行**」
2. 貼這行按 Enter：

```powershell
New-NetFirewallRule -DisplayName "CHI HUA AI War Room (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

3. 看到 `Action: Allow` 就 OK
4. 請同事重試

---

## 📌 想開機自動啟動？

### 方法：用 Windows 工作排程器

1. 按 Windows 鍵 → 打「工作排程器」開啟
2. 右側 **建立基本工作**
3. 名稱填：`CHI HUA AI War Room`
4. 觸發程序 → **電腦啟動時**
5. 動作 → **啟動程式**
6. 程式或指令碼：瀏覽到 `C:\chain-strategy\deploy\windows\start.bat`
7. **完成**

下次開機就自動跑了。

---

## 🆘 出問題時

### Q1：setup.bat 跑到一半卡住
- 大概率是網路太慢。npm install 第一次本來就要 5+ 分鐘。
- 不動超過 10 分鐘 → Ctrl+C 中斷，重跑 `setup.bat`

### Q2：開 `http://localhost:3000` 看到「無法連上」
- 確認黑色視窗還在（server 沒停）
- 確認看到 `Ready in X.Xs` 字樣
- 等 30 秒再重試（第一次 cold start 慢）

### Q3：戰情中心顯示「資料庫連線失敗」
- 確認 `.env.local` 裡 IP/帳號/密碼有填對
- cmd 打 `ping 192.168.16.201` 確認網路通
- 確認 DBA 給的帳號真的能登入鼎新 SQL Server

### Q4：build 失敗
- 把錯誤訊息**截圖**，傳給工程師
- 大部分是某個套件版本不相容，工程師看訊息就能解

### Q5：MOCK 模式怎麼判斷？
開 http://localhost:3000/erp/admin/sync 看 **Connector Health**：
- 🟢 `LIVE — 已連線至鼎新 iGP` ← 真連上了
- 🟠 `MOCK — 未設定環境變數` ← 還在 demo
- 🟡 `環境變數已設定但 mssql driver 未安裝` ← 跑 `npm install mssql`

---

## 🔒 安全性提醒

| 鐵律 | 已在程式碼中實作 |
|---|---|
| 對鼎新「**唯讀**」，禁 INSERT/UPDATE/DELETE | ✓ `assertReadOnly()` 程式層攔截 |
| 禁 EXEC / sp_* / xp_* | ✓ regex 攔截 |
| 禁多 statement | ✓ |
| 每筆查詢留 Audit | ✓ `/erp/admin/sync` 看 |
| 扣帳、過帳一律回鼎新操作 | ✓ 戰情中心無任何 POST |

`.env.local` **不要 commit 到 git**（`.gitignore` 已設好）。

---

## 📂 檔案說明

| 檔案 | 用途 |
|---|---|
| `setup.bat` | 第一次安裝精靈 |
| `start.bat` | 每天啟動 |
| `stop.bat` | 停止 server |
| `update.bat` | 更新到最新版 |
| `show-ip.bat` | 顯示本機 IP（分享給同事用） |
| `README.md` | 本檔 |

---

## 💬 出狀況怎麼回報

把以下資訊截圖傳給工程師：
1. 錯誤訊息（cmd 黑色視窗最後 30 行）
2. `setup.bat` 或 `start.bat` 跑到哪一步出錯
3. `http://localhost:3000/erp/admin/sync` 的截圖

🚀 Good luck!
