# 祺驊 CHI HUA ERP — 系統總覽

> **業務 / 採購協調追蹤系統**
> 路徑：`/erp`
> 對應外部來源：WorkFlow ERP iGP / `R:\業務&採購協調追蹤` / `Q:\採購課\成品成本分析\2026成本評估`

---

## 一、為什麼有這套系統

祺驊現有兩張關鍵 Excel：
1. **成品成本分析表**（Q:\採購課\成品成本分析）— 列出每個成品成本
2. **業務 / 採購協調追蹤表**（R:\業務&採購協調追蹤）— 列出零件採購狀態

**缺的橋**：兩張表之間沒有 **BOM 連結**，導致：
- 業務接單後，採購不知道要追哪些料、什麼時候要
- 採購進度延誤，業務也不知道哪張單會誤船
- 異常都是事後發現，沒有事前預警

本系統就是補這座橋，並做到：
- 一份 BOM 自動算出整單缺料 / 成本 / 毛利
- 八階段反向排程 + 即時預警
- 共用零件分析 — 看出哪些料是「關鍵共用件」
- 瓶頸自動診斷 + 建議解方

---

## 二、12 個功能頁面

| # | 頁面 | 路徑 | 一句話定位 |
|---|---|---|---|
| 1 | 戰情室 | `/erp` | 進入後第一眼看到的全景 KPI |
| 2 | 流程綜觀 | `/erp/flow` | 客戶下需求 → 出貨整鏈 + 瓶頸即時解方 |
| 3 | 可視化儀表板 | `/erp/viz` | Donut / Heatmap / Treemap 圖表式洞察 |
| 4 | 零件分析 | `/erp/analytics` | 共用件 / 種類 / ABC / 風險料件 |
| 5 | 缺料模擬器 | `/erp/simulator` | 「我要做 N 台」→ 缺料清單 + 船期可行性 |
| 6 | 工單追蹤 | `/erp/work-orders` | 與 iGP 欄位 1:1 對齊 + 八階段 Gantt |
| 7 | 排程日曆 | `/erp/calendar` | Gantt 時間軸 + 月曆網格 |
| 8 | 型號 + BOM | `/erp/models` | 多階 BOM 樹狀展開 + 成本 rollup |
| 9 | 零件主檔 | `/erp/parts` | 119 個料件 + CSV 匯出 |
| 10 | 供應商 | `/erp/suppliers` | 40 家祺驊真實供應商 + CSV 匯出 |
| 11 | 異常警訊 | `/erp/alerts` | 紅 / 黃燈分級 + 動作建議按鈕 |
| 12 | BOM 匯入 | `/erp/import` | 拖 .xlsx 進去自動解析 + 樹狀預覽 |
| + | QR 查碼 | `/erp/mobile` | 手機掃 QR 看實際庫存（不寫 ERP） |

---

## 三、資料結構

### Models（成品 / 半成品）
- `code` 成品品號 e.g. `FB42HA01`
- `machineFamily` 機種 e.g. `FB42・單向高扭渦流式煞車`
- `name` / `description` / `stdPrice`

### Parts（零件）
- `code` / `name` / `spec` 規格 / `unit` 單位（PCS/F/g/SET/PR）
- `unitCost` 單價 / `supplierId` 供應商
- `leadDays` 交期 / `stockOnHand` 在庫 / `safetyStock` 安全庫存
- `kind` 屬性：
  - `purchase` 採購件
  - `self` 自製件
  - `dummy` 虛設品號（如包裝組合節點）
  - `feature` Feature 件
  - `outsource` 託外加工件
  - `option` Option 件

### BOM Lines（多階）
- `modelId` 主件 / `partId` 元件
- `parentPartCode` 階層父節點代碼（null = 直接掛 model 下）
- `level` 階次（1 / 2 / 3 / 4 / 5）
- `qtyPerUnit` 標準用量 / `batchQty` 標準批量

### Suppliers（40 家祺驊真實供應商）
- 台灣為主 + 越南祺驊內部廠 + 瑞典 SKF
- 全部統一 45 天交期（依使用者提供）

### Work Orders（工單）
- `woNo` 訂單號 e.g. `ORD-2026-001`
- `source` 來源（ERP / manual）
- `customer` / `qty` / `orderDate` / `shipDate` / `destination`
- `status` + `statusLabel`（已簽收 / 生產中 / 待料 / 規劃中 ...）
- `stages` 八階段：算料 → 到廠 → 進貨檢驗 → 生產 → 測試 → 包裝 → 出貨 → 客戶交付

### Alert Rules（規則引擎）
事後型 🔴：
- `shortage` 已缺料
- `late` 進度已延遲
- `ship_risk` 船期倒數 ≤ 7 天
- `quality` 不良率 > 3%

預測型 🟡：
- `shortage_forecast` 預測缺料（依開工日 vs 供應商交期）
- `late_forecast` 預測誤船（依殘餘階段工時）

---

## 四、種子資料（demo）

依使用者上傳的 4 份真實 BOM Excel 解析建檔：

| 成品品號 | 機種 | 標準成本 |
|---|---|---|
| FB13G009 | FB13・內磁式磁控 | $450 |
| FB42HA01 | FB42・單向高扭渦流式煞車 | $1,246 |
| FB42K001 | FB42・單向高扭渦流式煞車（特殊）| $1,771 |
| FB62H032 | FB62・單向高扭混合發電機 | $1,580 |
| S43A001 | S43・煞車線圈半成品（4 階深）| $136 |

+ 3 個 demo 成品（FB64H021-A2 LIFE OEM / T-PRO-220 / R-MAG-100）

**零件**：119 個（含真實採購件 + 自製半成品 + 託外加工件 + 包裝虛設品號）
**供應商**：40 家
**BOM 線**：250+（含 4 階深度）

---

## 五、關鍵設計決策

### 1. 手機只查不寫
依使用者決策：手機 QR 查碼**僅顯示**真實庫存，**不做扣帳**。
扣帳一律回 iGP ERP 操作，避免雙寫不同步。

### 2. 鼎新 SP 規範
若未來要回寫 INVMC，必須走：
- `sp_axmt450_inv_in`（收料入庫）
- `sp_axmt450_inv_out`（領料出庫）
- `sp_axmt450_inv_adj`（盤點調整）

直接 INSERT 會把鼎新庫存連動弄壞 — 系統內已標紅警告。

### 3. 託外加工件展開
託外加工件（如 P04HA05 繞線架）不是「直接買進來」，而是「送原料給代工」。
系統正確記錄送出的塑膠粒 + 漆包線消耗，避免採購清單漏算。

### 4. 共用零件視覺化
共用零件矩陣（`/erp/viz`）一眼看出：
- S43A001 煞車線圈 → FB42HA01 + FB62H032 共用
- 含浸劑（稀薄劑 / 凡立水）→ 3 個成品都用
- SKF 6202 軸承 → 多個成品共用

→ 採購可重點管理高共用件、找備援供應商。

---

## 六、技術堆疊

- **Next.js 16** App Router + Turbopack
- **TypeScript** + **React 19**
- **Tailwind v4** + 純 SVG 圖表（零外部 chart 套件）
- **xlsx (SheetJS)** — BOM Excel 解析器
- **Server Components** 為主 + 必要處用 Client Components
- **無狀態** 端到端（資料源為 in-memory seed，未來換 Supabase / 鼎新 SP）

---

## 七、部署選項

### 方案 A：自助上線（不需 MIS）
- 在一台 PC 跑 `npm run dev`
- 採購手動把 Excel 內容匯入
- 部門同事連 IP 訪問
- 紅燈警訊變成跨部門共同語言

### 方案 B：正式上線（需 MIS 配合）
詳見 `docs/IT-CHECKLIST.md`（如已建立）

關鍵需要：
- DBA 開 3 支鼎新 SP 呼叫權限
- 網管部署機器 + DNS + HTTPS
- BOM 主檔正式入庫（取代 seed）

---

## 八、未來擴展方向

依使用價值排序：

1. **BOM 變更歷史追蹤** — 工程改 BOM 後，所有 in-flight WO 自動偵測影響
2. **iGP 雙向 ETL** — 自動同步工單 / 庫存 / 收貨
3. **PO 自動生成** — 從缺料分析直接產出採購單
4. **多廠區生產分配** — 自動建議哪些工單適合越南廠
5. **客戶報價產生器** — 給機種 + 數量 → 自動報價單
6. **品質追溯** — 序號 → 用了哪批料 → 哪些供應商

---

## 九、Commits 歷程（截至本文件）

| # | Commit | 摘要 |
|---|---|---|
| 1 | `4daefb5` | ERP 初版（戰情室 / 工單 / BOM 編輯 / 警訊）|
| 2 | `40b3f0b` | iGP 欄位對齊 + 缺料模擬器 + 預測警訊 |
| 3 | `04310c3` | 早期行動倉儲（後被取代）|
| 4 | `c150a2f` | 流程綜觀 + 手機降級為純查詢 |
| 5 | `bd3cb3b` | 瓶頸即時解方顧問 + iGP 即時連線指示 |
| 6 | `824ae49` | 品牌換成「祺驊 CHI HUA」 |
| 7 | `eb02737` | 真實 15 家供應商 + 45 天交期 |
| 8 | `c799949` | BOM Excel 解析器 + 36 家供應商 |
| 9 | `f6d9a98` | 零件分析儀表板（ABC / 共用 / 風險）|
| 10 | `0192625` | FB13G009 雙向內磁式磁控 BOM |
| 11 | `c32a375` | S43A001 煞車線圈 4 階 BOM + 託外加工 |
| 12 | `cd8a670` | 4 份 xlsx 解析 → 67 料件 + 3 成品 |
| 13 | `d8fb965` | 可視化儀表板（8 個 SVG 圖表）|
| 14 | `d293dd9` | 多階 BOM 樹狀展開 + 成本 rollup |
| 15 | `eb0b221` | CSV 匯出（零件 / 供應商 / 工單）|
| 16 | `2ea39c6` | 生產排程日曆（Gantt + 月曆）|
| 17 | (本) | docs/ERP-OVERVIEW.md |

---

## 十、聯絡

任何問題參考：
- 對話歷程中已詳細逐步建構
- patches 都備份在 `/tmp/erp-*.patch`（13 個）
- 任何 BOM 更新請走 `/erp/import` 拖檔上傳
