# 鼎新 iGP / SmartERP → CHI HUA AI 戰情中心 · 欄位對應

> 把鼎新標準表 mapping 到戰情中心的 Mirror DB / 直查 SQL。
> 全部都是 SELECT，**禁所有寫入動作**（assertReadOnly 已強制）。
> 從 ERPFullTextUtils 截圖確認你們是跑 iGP10 + 標準 AC/MOC/PUR 模組。

---

## 📚 鼎新標準命名慣例（背景知識）

| 字頭 | 模組中文 | 用途 |
|---|---|---|
| **AC** | 應收/應付 帳款 (Accounts) | AR / AP |
| **CMS** | 銷售管理 (Customer/Sales) | 訂單、報價 |
| **PUR** | 採購管理 (Purchasing) | PR、PO、供應商 |
| **MOC** | 製令/工單 (Manufacturing Order Control) | WO、製令 |
| **INV** | 庫存管理 (Inventory) | 庫存、異動 |
| **BOM** | 物料清單 | 模組 |
| **MA** 字尾 | Master 主檔 | 不變動的核心資料 |
| **TH** 字尾 | Transaction Header 異動單據主檔 | 每筆交易頭 |
| **TG / TD / TB** 字尾 | Detail 明細 | 一筆交易多明細 |

---

## 🎯 戰情中心 6 大資料源 SQL 對照

### 1️⃣ 採購單（PO）→ Profit Defense / L3 Procurement

```sql
-- PURTH = 採購單主檔  ·  PURTG = 採購單明細
SELECT 
  th.TH001 AS po_no,             -- 採購單號
  th.TH004 AS supplier_id,       -- 廠商代號
  ms.MA002 AS supplier_name,     -- 廠商名稱
  th.TH003 AS po_date,           -- 採購日期
  th.TH011 AS status,            -- 單據狀態（Y=已過帳, N=未過帳）
  tg.TG004 AS part_code,         -- 料號
  tg.TG005 AS part_name,         -- 品名規格
  tg.TG007 AS qty,               -- 數量
  tg.TG013 AS unit_price,        -- 單價
  tg.TG025 AS expected_date,     -- 預計交貨日
  tg.TG010 AS received_qty,      -- 已交數量
  (tg.TG007 - ISNULL(tg.TG010,0)) AS pending_qty  -- 未交數量
FROM PURTH AS th
JOIN PURTG AS tg ON th.TH001 = tg.TG001
LEFT JOIN PURMA AS ms ON th.TH004 = ms.MA001
WHERE th.TH003 >= CONVERT(VARCHAR, DATEADD(day, -90, GETDATE()), 112)
  AND th.TH011 = 'Y';
```

> ⚠ 表名 / 欄位代碼以你們公司鼎新版本為準（iGP10 大致如此，可能有差異 10~20%）

---

### 2️⃣ 請購單（PR）→ Requisition Center / L2 Operations

```sql
-- PURMS = 請購單主檔  ·  PURMG = 請購單明細  ·  PURFLW = 簽核流程
SELECT
  ms.MS001 AS pr_no,             -- 請購單號
  ms.MS002 AS pr_date,           -- 請購日期
  ms.MS004 AS requester,         -- 請購人
  ms.MS006 AS req_dept,          -- 請購部門
  ms.MS012 AS status,            -- 狀態（B=核准, A=待核准）
  mg.MG004 AS part_code,
  mg.MG006 AS qty,
  mg.MG008 AS est_unit_cost,
  mg.MG010 AS required_date,     -- 需要日
  -- 簽核流程
  (SELECT COUNT(*) FROM PURFLW WHERE FLW001 = ms.MS001 AND FLW005 = 'Y') AS approved_level,
  (SELECT COUNT(*) FROM PURFLW WHERE FLW001 = ms.MS001) AS required_level
FROM PURMS AS ms
JOIN PURMG AS mg ON ms.MS001 = mg.MG001
WHERE ms.MS002 >= CONVERT(VARCHAR, DATEADD(day, -30, GETDATE()), 112);
```

---

### 3️⃣ 工單（WO/MO）→ L2 工單作戰中心 / End-To-End Tracker

```sql
-- MOCTA = 工單主檔  ·  MOCTB = 工單用料  ·  MOCTC = 工單實際工序
SELECT
  ta.TA001 AS wo_no,             -- 工單號
  ta.TA004 AS model_code,        -- 產品代號
  ta.TA005 AS product_name,      -- 品名
  ta.TA006 AS plan_qty,          -- 計劃數量
  ta.TA007 AS actual_qty,        -- 實際完工數
  ta.TA011 AS start_date,        -- 開工日
  ta.TA012 AS end_date,          -- 完工日
  ta.TA014 AS status,            -- 狀態
  -- 缺料判斷（用料表 vs 實領）
  (SELECT SUM(TB008 - ISNULL(TB011,0)) FROM MOCTB WHERE TB001 = ta.TA001) AS shortage_qty
FROM MOCTA AS ta
WHERE ta.TA014 IN ('Y', 'P')     -- 在製 / 部分完成
  AND ta.TA011 >= CONVERT(VARCHAR, DATEADD(day, -60, GETDATE()), 112);
```

---

### 4️⃣ 庫存 → L4 Inventory Risk / L5 庫存可撐天數

```sql
-- INVMB = 庫存交易檔  ·  INVMC = 即時庫存
SELECT
  mc.MC001 AS part_code,         -- 料號
  mc.MC002 AS warehouse,         -- 倉庫代號
  mc.MC005 AS qty_on_hand,       -- 現有庫存
  mc.MC006 AS safety_stock,      -- 安全庫存
  mc.MC008 AS unit_cost,         -- 標準成本
  (mc.MC005 * mc.MC008) AS inventory_value,
  -- 最後異動日
  (SELECT MAX(MB003) FROM INVMB WHERE MB004 = mc.MC001 AND MB005 = mc.MC002) AS last_txn_date
FROM INVMC AS mc
WHERE mc.MC005 > 0
ORDER BY mc.MC005 * mc.MC008 DESC;
```

---

### 5️⃣ 應收帳款 ACRTA（你截圖看到的）→ L1 預估毛利 / Profit Impact

```sql
-- ACRTA = 應收憑單主檔  ·  ACRTB = 沖帳明細
-- 對應你截圖：ACRTA TA004,TA007,TA008,TA015,TA022,TA069,TA106
SELECT
  TA001 AS ar_no,               -- 應收單號
  TA003 AS ar_date,             -- 立帳日
  TA004 AS customer_id,         -- 客戶代號
  TA007 AS due_date,            -- 票期/到期日
  TA008 AS amount,              -- 金額
  TA015 AS currency,            -- 幣別
  TA022 AS status,              -- 狀態
  TA069 AS sales_no,            -- 對應銷貨單
  TA106 AS settle_date          -- 沖帳日（NULL=未沖）
FROM ACRTA
WHERE TA003 >= CONVERT(VARCHAR, DATEADD(month, -3, GETDATE()), 112)
ORDER BY TA003 DESC;
```

---

### 6️⃣ 應付帳款 ACPTA（你截圖看到的）→ Profit Defense / 原料成本

```sql
-- ACPTA = 應付憑單主檔  ·  ACPTB = 沖帳明細
-- 對應你截圖：ACPTA TA001,TA002,TA014 / TA006,TA014,TA021,TA092
SELECT
  TA001 AS ap_no,               -- 應付單號
  TA002 AS ap_date,             -- 立帳日
  TA006 AS supplier_id,         -- 廠商
  TA014 AS amount,              -- 金額
  TA021 AS currency,            -- 幣別
  TA092 AS po_no                -- 對應採購單
FROM ACPTA
WHERE TA002 >= CONVERT(VARCHAR, DATEADD(month, -3, GETDATE()), 112);
```

---

## 🗂 主檔對照表（戰情中心 → 鼎新）

| 戰情中心顯示 | 鼎新表 | 主要欄位 |
|---|---|---|
| 客戶主檔 | **COPMS** | MS001(客戶ID), MS002(客戶名), MS010(信用額度) |
| 供應商主檔 | **PURMA** | MA001(廠商ID), MA002(廠商名), MA009(付款條件) |
| 料件主檔 | **INVMB** | MB001(料號), MB002(品名), MB003(規格), MB008(單位) |
| BOM 主檔 | **BOMMA** | MA001(成品料號), MA002(版本) |
| BOM 明細 | **BOMMB** | MB001(成品), MB002(版本), MB003(用料), MB004(用量) |
| 工單 | **MOCTA** | TA001(工單號), TA004(產品), TA006(數量) |
| 採購單 | **PURTH** | TH001(PO號), TH004(廠商), TH003(日期) |
| 請購單 | **PURMS** | MS001(PR號), MS006(部門) |
| 銷貨單 | **COPTH** | TH001(銷貨號), TH004(客戶) |

---

## 🔌 連線參數（從你截圖確認）

```
Server   : 192.168.16.201
Port     : 1433
Database : CHIHUA
Schema   : dbo（鼎新預設）
Encoding : 通常 CP950 / Big5（注意中文）
```

Node.js mssql connection string：

```ts
{
  server: "192.168.16.201",
  port: 1433,
  database: "CHIHUA",
  user: process.env.TOPGP_DB_USER,
  password: process.env.TOPGP_DB_PASS,
  options: {
    encrypt: false,                  // 內網不用 SSL
    trustServerCertificate: true,
    readOnlyIntent: true,            // SQL Server Always-On 唯讀提示
  }
}
```

---

## ⚙ 同步策略建議

```
頻率    內容                          影響
─────────────────────────────────────────────────
每 5 min  即時庫存 INVMC                小（即時看缺料）
每 15 min 工單狀態 MOCTA                小（OEE 監控）
每 30 min 採購單 PURTH                  小
每 1 hr   請購流程 PURMS                小
每 4 hr   AR/AP（ACRTA/ACPTA）          中（避免月底結帳影響）
每天 02:00 主檔全量 (INVMB/PURMA/COPMS) 大（離峰跑）
```

---

## 🚨 鎖定的禁區（絕對不碰）

```
❌ SYSDBA、財務帳期關閉表
❌ 任何 sp_xxx Stored Procedure
❌ 鼎新 IGP 系統設定表 SYSXX
❌ 使用者權限表 SYSUR
❌ 任何 INSERT/UPDATE/DELETE
```

程式碼層已強制：`assertReadOnly()` 攔截非 SELECT 動作 + EXEC/sp_*/xp_*。

---

## 📞 跟 DBA 第一次連線時要 double-check

1. **表名實際是 `PURTH` 還是 `dbo.PURTH`？** （schema 前綴）
2. **公司別欄位**：iGP 通常每張表第一欄是公司別代碼，要先 `WHERE COMPANY = 'CHIHUA'` 過濾
3. **狀態碼**：`Y/N/P/A/B/C` 對應什麼，請 DBA 給 enum 對照
4. **日期格式**：通常 `VARCHAR(8) YYYYMMDD`，要小心轉型
5. **數值欄位**：是否有 `DECIMAL(15,4)` 之類精度，避免溢位

---

## 🛠 下一步

1. **拿到 DBA 確認的真實表名 + 欄位代碼**（每家鼎新版本略有差異）
2. **我新增** `src/lib/erp/dingxin-queries.ts` — 把上述 6 個 SQL 包裝成函數
3. **掛到** `src/lib/erp/sync-state.ts` 的 SYNC_JOBS 取代 mock SQL
4. **執行** `npm run dev` 在內網 PC 上跑 → 看 `/erp/admin/sync` 真的拉出資料
5. **戰情中心各頁** 自動秀真實數字（因為 Aggregator 模式，零商業邏輯）

---

## 📚 參考

- 鼎新 iGP 標準資料字典（請跟原廠顧問索取）
- SQL Server 文件 https://learn.microsoft.com/en-us/sql/
- `src/lib/erp/connector.ts` — 我們的唯讀連線層
- `src/lib/erp/sync-state.ts` — 同步排程定義
