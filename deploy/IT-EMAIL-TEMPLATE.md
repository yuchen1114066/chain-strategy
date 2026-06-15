# 給 IT / 鼎新顧問 / DBA 的需求文件

> 直接複製下面內容，貼到 email 或 LINE，依對象選用對應段落。

---

## 📧 對象 A：寄給「公司 IT 部門」

**主旨**：戰情中心建置 — 申請鼎新 ERP 唯讀資料介接

> Hi 各位，
>
> 我們業務/採購單位正在建置一個「AI 戰情中心」（內部代號 **CHI HUA AI**），用來把鼎新 ERP 的工單、庫存、採購、原物料資料以儀表板形式呈現給管理層即時決策。
>
> **整體架構**
> - 部署位置：公司內網一台 Win10/11 主機（型號待確認，我會自己準備）
> - 程式類型：Next.js（Node.js）網頁應用，跑在 port 3000
> - 連線目標：鼎新 SQL Server @ **192.168.16.201**
> - 對鼎新行為：**100% 唯讀**，禁 INSERT/UPDATE/DELETE/EXEC（程式層已強制攔截）
> - 同事透過內網 IP 開瀏覽器存取，**資料不出公司網路**
>
> **想麻煩 IT 協助**
> 1. **允許**這台主機（待告知 MAC/IP）對 192.168.16.201 的 1433 port 連入
> 2. **協調 DBA**（或鼎新顧問）開一個 **唯讀帳號**（細節見附件 SQL 腳本）
> 3. （可選）若想做開機自動啟動 + 排程，請協助開啟 Windows 工作排程權限
>
> 全程不會對鼎新寫入任何資料、不會呼叫 Stored Procedure、不會修改任何鼎新原系統設定。所有查詢都有 Audit Log 可稽核。
>
> 預計建置完成後 IT 可以隨時審查我們的查詢紀錄（`/erp/admin/sync` 頁面內建 Audit Log），如果發現任何不該的查詢可以直接停用帳號。
>
> 麻煩了，謝謝！

---

## 📧 對象 B：寄給「鼎新原廠顧問」或「公司 DBA」

**主旨**：申請 SmartERP iGP 唯讀帳號 — CHI HUA AI 戰情中心

> Hi {顧問/DBA 名字},
>
> 我們要建一個 BI/戰情中心，需要對鼎新 iGP/SmartERP 的 SQL Server 唯讀拉資料做分析。
>
> **連線需求**
> - SQL Server：`192.168.16.201:1433`
> - Database：`CHIHUA`（祺驊 正式區）
> - 帳號用途：純 SELECT 讀取，禁所有寫入動作
> - 應用程式：自製 Next.js Web App，跑在內網一台主機
>
> **想請你協助 2 件事**
>
> ### 1. 開唯讀帳號（SQL 腳本如下）
>
> ```sql
> -- 在鼎新 SQL Server 上以 sa 或 sysadmin 執行
>
> -- a. 建 login
> CREATE LOGIN [chihua_ai_readonly] WITH 
>   PASSWORD = '<請設強密碼>',
>   DEFAULT_DATABASE = [CHIHUA],
>   CHECK_POLICY = ON,
>   CHECK_EXPIRATION = OFF;
>
> -- b. 在 CHIHUA 資料庫建 user 並指派唯讀 role
> USE [CHIHUA];
> CREATE USER [chihua_ai_readonly] FOR LOGIN [chihua_ai_readonly];
> ALTER ROLE [db_datareader] ADD MEMBER [chihua_ai_readonly];
>
> -- c. 明確 DENY 寫入權限（雙重保險）
> DENY INSERT, UPDATE, DELETE, ALTER, REFERENCES, EXECUTE 
>   TO [chihua_ai_readonly];
>
> -- d. 驗證
> EXEC sp_helprolemember 'db_datareader';
> SELECT * FROM fn_my_permissions(NULL, 'DATABASE');
> ```
>
> 帳號名建議：`chihua_ai_readonly`（或你習慣的命名規則）
>
> ### 2. 確認以下表結構（後續 mapping 用）
>
> 我們會用到以下標準鼎新模組：
> - **MOC** — 製令/工單（MOCMA, MOCMB, MOCTA）
> - **PUR** — 採購（PURTH, PURMA, PURTC）
> - **INV** — 庫存（INVMB, INVMC, INVTB）
> - **CMS** — 業務訂單（COPMA, COPTH, COPTG）
> - **CMS** — 客戶主檔（COPMS）
> - **PUR** — 供應商主檔（PURMS）
> - **MDM** — 料件主檔（INVMB）
> - **ACT** — BOM（BOMMA, BOMMB）
>
> 如果你們在公司有 PCM / KDM / 自訂模組，麻煩告知 schema。
>
> ### 安全保證
> - ✅ 程式碼層 `assertReadOnly()` 攔截所有非 SELECT 動作
> - ✅ 禁 EXEC、CALL、sp_*、xp_*、多 statement
> - ✅ 每筆查詢留 Audit Log（時間、SQL、回傳筆數）
> - ✅ 部署在公司內網（不走外網）
> - ✅ 隨時可由你停用 SQL Login 立即斷線
>
> 麻煩了！有任何問題我可以線上 demo 給你看程式碼鐵律的實作。

---

## 📧 對象 C：跟「資安/稽核人員」溝通用

**主旨**：CHI HUA AI 戰情中心 — 資安合規說明

> 簡述：
>
> **資料分類**：本系統處理鼎新 ERP 中的營運資料（工單、庫存、採購、原物料價格），不涉及員工個資 / 客戶個資 / 信用卡資訊。
>
> **資料流**：
> ```
> 鼎新 SQL Server (內網)
>       ↓ 唯讀 SELECT (限制 SQL 帳號 db_datareader role)
> 戰情中心 Server (內網 Win10/11)
>       ↓ HTTP (port 3000，限內網 IP)
> 同事瀏覽器 (內網)
> ```
>
> 全程**不離開公司內網**，無外部雲端。
>
> **5 條鐵律（程式碼強制執行）**：
> 1. 對鼎新唯讀 — `assertReadOnly()` 程式攔截
> 2. 禁 Stored Procedure 呼叫 — regex 攔截 EXEC/CALL/sp_*/xp_*
> 3. 禁多 statement
> 4. 每筆查詢留 Audit Log
> 5. 扣帳/過帳一律回鼎新原系統操作（戰情中心無任何 POST endpoint）
>
> **可稽核項目**：
> - `/erp/admin/sync` 頁面：完整查詢歷史 + SQL 內容 + 回傳筆數 + 錯誤
> - GitHub repo：完整原始碼公開，可隨時 code review
> - SQL Login 權限：DBA 可隨時 `REVOKE`
>
> 文件位置：
> - [內網部署手冊](deploy/windows/README.md)
> - [架構憲法 5 鐵律](https://chi-hua-ai-center.vercel.app/architecture/constitution)

---

## 📞 對方可能會問的 Q&A 草稿

**Q1：為什麼不直接用鼎新原系統的報表？**  
A：鼎新報表偏交易型（單據查詢、明細列印），缺乏跨模組整合 + AI 預測 + 即時告警 + 視覺化儀表板。戰情中心是「決策層」的補強，不取代鼎新「作業層」。

**Q2：會不會影響鼎新 server 效能？**  
A：每 10 分鐘批次查詢一次（cron），每次約 6 個 SELECT 查詢（都有索引欄位），總體負載 < 1% CPU。我們也可以限制查詢時段（如只在離峰 22:00-06:00 全量同步）。

**Q3：開唯讀帳號會不會破壞鼎新原本權限管控？**  
A：不會。這是一個獨立的 SQL Login，跟鼎新前端的應用層帳號（IGPAdmin 等）完全分離。  
DBA 隨時可以 `ALTER LOGIN chihua_ai_readonly DISABLE` 立即停用。

**Q4：萬一帳號外洩怎辦？**  
A：
1. SQL Login 限制 `db_datareader` + 明確 `DENY` 寫入 → 即便外洩也只能讀
2. 帳號限制連線來源 IP（IT 可以在 firewall 設）
3. 每筆查詢都有 Audit Log，異常行為立刻可察
4. 隨時可 `REVOKE` 帳號

---

## 📂 順便確認的事項清單

請對方確認後告訴你：

- [ ] **鼎新版本**：iGP10 / iGP15 / SmartERP iSM10 / 其他？
- [ ] **SQL Server 版本**：2014 / 2016 / 2019 / 2022？
- [ ] **資料庫名**：CHIHUA（從你截圖看到）對嗎？還有其他公司別嗎？
- [ ] **Port**：預設 1433 還是有改？
- [ ] **加密**：強制 SSL 連線嗎？
- [ ] **唯讀帳號名稱**：用 `chihua_ai_readonly` 還是有公司命名規則？
- [ ] **帳號密碼**：跟你 LINE 私訊，**不要寫在 email**

---

## 🔐 拿到帳號密碼後

1. **不要貼進 ChatGPT / Slack 公開頻道 / GitHub**
2. **不要存在 LINE 對話紀錄超過 7 天**
3. **存在 Windows 戰情中心 PC 的 `.env.local` 檔（受作業系統權限保護）**
4. 改密碼週期：建議每 90 天 rotate 一次
