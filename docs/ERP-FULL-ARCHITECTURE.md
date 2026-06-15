# 祺驊 CHI HUA ERP — 完整架構文件

> **更新日**：2026-06-15
> **盤點範圍**：`src/app/erp/*` 所有頁面 + `src/app/api/*` 所有 API + `src/lib/erp/*` 所有資料層
> **取代**：先前的 `ERP-OVERVIEW.md` / `祺驊ERP功能彙整表.txt`（已過時，僅描述前 24 頁）
> **此次盤點規模**：56 個頁面路由 · 12 個 API endpoint · 47 個 lib 模組

---

## 一、TL;DR · 一頁看懂

```
                ┌────────────────────────────────────────────┐
                │  CHI HUA AI Supply Chain OS                │
                │  跑在 Next.js 16 / Vercel / IndexedDB      │
                └────────────────────────────────────────────┘
                            ↓ 唯讀同步
                ┌────────────────────────────────────────────┐
                │  鼎新 Workflow iGP 1.0.10.22 (192.168.16.201) │
                │  · MSSQL Server 2019 · DB: eproerp           │
                │  · INVMB / BOMMB / PURTH / COPMB / BOR series │
                └────────────────────────────────────────────┘
```

- **鼎新** = system of record（工單 / 庫存 / BOM / 採購數量以鼎新為準）
- **本系統** = 視覺化戰情 + 異常預警 + AI 決策輔助
- **資料策略**：對鼎新唯讀、不回寫（扣帳一律回鼎新操作）
- **儲存**：使用者上傳的主檔 / 報價檔暫存於本機 **IndexedDB**（不上雲端，敏感資料零洩漏）
- **AI**：Google Gemini 2.5 Flash → 2.0 Flash 自動 fallback（OCR + 跨部門問答 + 報表辨識）
- **私有化**：站台級 HMAC session cookie + 共用密碼閘 + noindex / X-Frame DENY

---

## 二、系統分層（5 層 + 3 個輔助）

| 層 | 名稱 | 對應「誰看」| 目前頁數 |
|---|---|---|---|
| **L1 EXECUTIVE** | AI 戰情中心 | 連副總 / 董事長 | 4 |
| **L2 OPERATIONS** | 工單作戰中心 | 業務 / 生管 / PM | 8 |
| **L3 PROCUREMENT** | AI 採購中心 | 採購主管 / 採購員 | 12 |
| **L4 AI ENGINE** | AI 決策中心 | MIS / 顧問 / 進階用戶 | 5 |
| **L5 MARKET** | 全球市場情報中心 | 高階主管 / 經營層 | 2 |
| **SYSTEM / Admin** | 系統管理 | MIS / 管理員 | 12 |
| **WMS** | 倉儲管理 | 倉管 / 品管 | 3 |
| **Mobile** | 行動端 | 現場 / 倉管 | 3 |
| **Misc** | 其他 / 主檔 / 報表 | 全員 | 7 |

---

## 三、頁面清單（依分層 · 56 頁）

### L1 EXECUTIVE · AI 戰情中心

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| CEO War Room v1 | `/erp/warroom` | 連副總一頁式戰情 + 紅黃燈異常 | mock |
| War Room 詳情 | `/erp/warroom/detail` | 點異常進詳細卡 | mock |
| War Room 流程圖 | `/erp/warroom/flow` | 整鏈視覺化 + 瓶頸顧問 | mock |
| L5 終評 | `/erp/l5-final` | Profit Defense 終極視圖 | mock |
| 毛利防衛 | `/erp/profit-defense` | 負毛利警示牆 | mock |

### L2 OPERATIONS · 工單作戰中心

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| 工單作戰中心 | `/erp/operations` | 八階段反向排程入口 | mock |
| 工單列表 | `/erp/work-orders` | 工單列表 + 八階段 Gantt | mock |
| 工單詳情 | `/erp/work-orders/[id]` | 單張工單 BOM 展開 + 異常 | mock |
| **跨部門 AI Inbox** ⭐ | `/erp/lead-time-validation` | **業務貼 email → AI 用主檔答題 + reply 草稿** | **real** |
| 缺料牆 | `/erp/shortage-wall` | 缺料 / 影響工單 / 停線倒數 | mock |
| ETA 預測 | `/erp/eta-forecast` | AI 預測各工單交期 | mock |
| 生產日曆 | `/erp/calendar` | 月曆視圖 | mock |
| 異常警訊 | `/erp/alerts` | 紅黃燈分級 + 動作按鈕 | mock |

### L3 PROCUREMENT · AI 採購中心

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| **AI 報價分析引擎** ⭐ | `/erp/quotation-analyzer` | **STEP 1 OCR ↔ STEP 2 BOM ↔ STEP 3 採購歷史 ↔ STEP 4 應該成本 ↔ STEP 5 議價** | **STEP 1-3 real / STEP 4-5 mock** |
| **ERP 主檔上傳** ⭐ | `/erp/master-data` | **CSV / OCR 上傳料件 / BOM / 採購到 IndexedDB** | **real** |
| 採購總覽 | `/erp/procurement` | 採購單列表 | mock |
| PO 自動產出 | `/erp/po-generator` | 從 MRP 結果產 PO | mock |
| 請購單 | `/erp/requisition` | 部門請購流程 | mock |
| 再訂購點 | `/erp/reorder` | 安全庫存觸發提醒 | mock |
| 議價 Hub | `/erp/negotiation` | 議價策略 + 信稿產生 | mock |
| Should Cost 引擎 | `/erp/should-cost` | （待整合，目前在 quotation-analyzer 內）| placeholder |
| 供應商主檔 | `/erp/suppliers` | 供應商評分 + 風險分數 | mock |
| 供應商入口 | `/erp/supplier-portal` | 廠商自助登入回報 | mock |
| Supplier Audit | `/erp/supplier-portal/audit` | 供應商評鑑工作流 | mock |
| 廠商視角 | `/erp/supplier-portal/vendor` | 廠商看自己的 PO | mock |
| PO 詳情（廠商）| `/erp/supplier-portal/vendor/[poId]` | 廠商簽收 / ASN | mock |
| 滯銷品 | `/erp/dead-stock` | 出 6 個月沒動的庫存 | mock |
| 委外管理 | `/erp/outsource` | 委外加工進度 | mock |

### L4 AI ENGINE · AI 決策中心

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| AI 決策引擎 | `/erp/ai-engine` | 模型清單 / 推論狀態 | mock |
| 決策事件 | `/erp/decisions` | AI 給的決策建議列表 | mock |
| 決策詳情 | `/erp/decisions/[id]` | 單一決策的推論過程 | mock |
| 訂單影響模擬 | `/erp/order-impact` | 改一張訂單，全鏈影響預測 | mock |
| What-If 模擬器 | `/erp/simulator` | 多參數模擬 | mock |

### L5 MARKET · 全球市場情報

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| 全球市場 | `/erp/market` | LME / 商品 / 匯率即時 | mock |
| 全球地圖 | `/erp/global-map` | 供應商 / 客戶 / 工廠地理視圖 | mock |

### SYSTEM · 系統管理（Admin）

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| 管理入口 | `/erp/admin` | Admin index | mock |
| 權限控制 | `/erp/admin/access-control` | RBAC / ABAC 規則 | mock |
| 變更管理 | `/erp/admin/change-management` | Schema / 流程變更追蹤 | mock |
| 採購情報中心 | `/erp/admin/cost-intelligence` | SaaS 賣點視角（內部）| mock |
| 下載 standalone | `/erp/admin/downloads` | 程式包下載（需 token）| real |
| AI 引擎管理 | `/erp/admin/engines` | 模型部署狀態 | mock |
| 事件引擎 | `/erp/admin/event-engine` | EventBus 配置 | mock |
| 主檔治理 MDM | `/erp/admin/mdm` | Master Data Governance | mock |
| Observability | `/erp/admin/observability` | 監控 / Trace / Log | mock |
| QR 產生器 | `/erp/admin/qr-generator` | 倉儲 QR 列印 | mock |
| 系統設定 | `/erp/admin/settings` | 全域開關 | mock |
| ERP 同步 | `/erp/admin/sync` | 鼎新同步狀態 | mock |
| 系統治理 | `/erp/governance` | 政策 / 流程憲法 | mock |
| 整合 | `/erp/integration` | 對外整合配置 | mock |
| 匯入 | `/erp/import` | 一次性匯入（過時，已被 master-data 取代）| legacy |

### WMS · 倉儲

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| WMS 戰情 | `/erp/wms` | CHI HUA Pulse 暖色旗艦頁 + 8 階段 + 熱力圖 | mock |
| 收料 | `/erp/wms/receiving` | 收料 checklist | mock |
| 收料 PO | `/erp/wms/receiving/[poId]` | 對單收料 | mock |
| SPC 軸件 | `/erp/wms/spc-shaft` | 軸件統計製程管制 | mock |

### Mobile · 行動端

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| Mobile Hub | `/erp/mobile` | 手機端入口 | mock |
| 盤點 | `/erp/mobile/count` | 倉庫 QR 掃 + 鼎新對照 | partial |
| 物料卡 | `/erp/mobile/material-card` | 掃 QR 跳料件詳細 | partial |
| QR 掃描 | `/erp/mobile/scan` | 一般掃碼 | partial |

### Misc · 主檔 / 報表 / 視覺化

| 頁面 | 路徑 | 功能 | 狀態 |
|---|---|---|---|
| 流程綜觀 | `/erp/flow` | 客戶下需求 → 出貨整鏈 + 瓶頸 | mock |
| 物料管理 | `/erp/materials` | 物料庫存視圖 | mock |
| 料件 | `/erp/parts` | 料件主檔 UI（將與 master-data 合併）| mock |
| BOM 比較 | `/erp/bom-compare` | 兩個 BOM 差異 | mock |
| CBS 成本 DNA | `/erp/cbs` | Cost Breakdown System | mock |
| 客戶 | `/erp/customers` | 客戶主檔 | mock |
| 模型 | `/erp/models` | 機械模型列表 | mock |
| 模型詳情 | `/erp/models/[code]` | 單一機型 | mock |
| 表現 | `/erp/performance` | KPI 牆 | mock |
| 分析 | `/erp/analytics` | 統計報表 | mock |
| 可視化 | `/erp/viz` | 8 大 SVG 圖表 | mock |
| LRPR05 報表 | `/erp/reports/lrpr05` | 鼎新標準報表 | mock |

⭐ = 目前真實運作、有真資料、客戶能直接用

---

## 四、API Endpoint 清單（12）

### `/api/ai/*` · AI 服務

| Endpoint | 方法 | 功能 | 用在哪 |
|---|---|---|---|
| `/api/ai/quotation-ocr` | POST | 報價單 OCR（Gemini Vision）| `/erp/quotation-analyzer` STEP 1 |
| `/api/ai/inbox-assistant` | POST | 跨部門問答 + reply 草稿 | `/erp/lead-time-validation` |
| `/api/ai/recompute` | POST | 重算 AI 推論 | 內部 |

### `/api/erp/*` · ERP 整合

| Endpoint | 方法 | 功能 | 用在哪 |
|---|---|---|---|
| `/api/erp/report-import` | POST | 鼎新報表 OCR（PDF / 圖片 → BOM / 料件 / 採購）| `/erp/master-data` |
| `/api/erp/test-connection` | POST/GET | 測試直連 MSSQL `eproerp` | `/erp/master-data` 進階區 |

### `/api/auth/*` · 認證

| Endpoint | 方法 | 功能 |
|---|---|---|
| `/api/auth/login` | POST | 密碼驗證 + 發 session cookie |
| `/api/auth/logout` | POST/GET | 清 cookie |

### `/api/sync/*` · 同步

| Endpoint | 方法 | 功能 |
|---|---|---|
| `/api/sync/erp` | POST | 鼎新增量同步（規劃中）|

### `/api/admin/*` · 管理員

| Endpoint | 方法 | 功能 |
|---|---|---|
| `/api/admin/downloads/quotation-analyzer-standalone` | GET | 下載 standalone 程式碼（需 token）|
| `/api/admin/downloads/wms-standalone` | GET | 下載 WMS standalone（需 token）|

---

## 五、資料表結構

### A. IndexedDB（本機儲存）

由 `src/lib/erp/master-data-store.ts` 管理。DB 名 `chain-strategy-erp-master`，目前 version 2。

| Store | 主鍵 | 索引 | 用途 | 寫入方式 |
|---|---|---|---|---|
| `items` | `partNo` | — | 料件主檔 | CSV 整批替換 / OCR upsert |
| `bom` | autoIncrement | `parent`, `child` | BOM 結構 | CSV 整批替換 / OCR 同父件 replace |
| `purchases` | autoIncrement | `partNo`, `supplier` | 採購歷史 | CSV 整批替換 / OCR append |
| `meta` | (key/value) | — | 各 store 最後更新時間 | 自動 |
| `uploadLogs` | `id` (auto) | `ts`, `type` | 上傳審計 | 每次寫入自動記錄 |

另外 `src/lib/quotation-file-store.ts` 管理另一個 DB（`chain-strategy-quotations`），存報價單原始 blob（PDF / JPG），key 是上傳時間戳。

### B. 鼎新 MSSQL（system of record · 唯讀同步目標）

連線資訊（從 `ConductorC.INI` + `BOR213.docx` 截圖反推）：

```
Server   : 192.168.16.201
Port     : 1433（待確認）
Database : eproerp
User     : 待 IT 開唯讀帳號
Product  : Workflow iGP 1.0.10.22 (x64)
CodePage : 950 (Big5)
```

本系統會用到的核心表（鼎新標準 schema）：

| 鼎新表名 | 中文 | 我們用來 |
|---|---|---|
| `INVMB` | 料件主檔 | 料號 → 品名 / 規格 / 分類 / 單位 |
| `BOMMB` / `BOMMD` | BOM 母件 / 用料 | 父件 → 子料 + 用量 |
| `PURTH` / `PURTG` | 採購單頭 / 單身 | 採購單號 / 廠商 / 單價 / 日期 / 數量 |
| `CSTMB` | 成本主檔 | STEP 4 應該成本對比基準 |
| `COPMB` / `COPTG` | 訂單頭 / 單身 | 客戶訂單 → 負毛利偵測 |
| `BOR101` 系列 | 製程資料 | 標準工時 / 機器時間（STEP 4 工時成本）|
| `BOR213` | 產品操作製程 | 工序 + 工作單位 + 標準工時 |
| `IMSMB` | 庫存主檔 | 現有量 / 安全量 |

完整鼎新 schema 文件由原廠提供（公開）— 想要的話跟鼎新顧問索取「TOPGP 資料字典」即可。

---

## 六、`src/lib/erp/*` 模組（47）

按功能分類：

### 資料層

| 檔案 | 用途 |
|---|---|
| `master-data-store.ts` | IndexedDB CRUD（items / bom / purchases / meta / logs）|
| `master-data-parser.ts` | CSV / XLSX 解析 + 鼎新欄位別名 mapping + 民國年日期轉換 |
| `bom-parser.ts` | BOM 結構解析 |
| `bom-tree.ts` | 多階 BOM 樹遞迴 |
| `dingxin-parser.ts` | 鼎新原始格式解析（保留給直連用）|

### 業務引擎

| 檔案 | 用途 |
|---|---|
| `decision-engine.ts` | 決策推論主引擎 |
| `decision-loop.ts` | 決策迴圈（事件 → 推論 → 動作）|
| `engine-digital-twin.ts` | 數位孿生 |
| `engine-prediction.ts` | 預測模型 |
| `engine-timeline.ts` | 時間軸推導 |
| `eta-forecast.ts` | ETA 預測 |
| `should-cost`（quotation-analyzer 內）| 應該成本（規劃移至 lib）|
| `critical-path.ts` | 關鍵路徑分析 |
| `simulate.ts` | What-If 模擬 |

### 流程 / 監控

| 檔案 | 用途 |
|---|---|
| `event-bus.ts` | 事件匯流排 |
| `flow-advisor.ts` | 流程顧問（瓶頸建議）|
| `alerts.ts` | 警示規則 + 紅黃燈 |
| `otif.ts` | OTIF (On-Time-In-Full) 指標 |
| `inventory-health.ts` | 庫存健康度 |
| `shortage-ai.ts` | 缺料 AI |

### 採購 / 供應商

| 檔案 | 用途 |
|---|---|
| `negotiation.ts` | 議價策略 / 信稿產生 |
| `supplier-audit.ts` | 供應商評鑑 |
| `supplier-portal.ts` | 廠商入口 |
| `commodities.ts` | LME / 指數 mapping |
| `outsource.ts` | 委外管理 |

### 倉儲

| 檔案 | 用途 |
|---|---|
| `warehouse.ts` | 倉庫主邏輯 |
| `receiving-checklist.ts` | 收料 SOP |
| `shaft-spc.ts` | 軸件 SPC |
| `qr.ts` | QR 編碼產生 |

### 訂單 / 流程

| 檔案 | 用途 |
|---|---|
| `order-impact.ts` | 訂單影響分析 |
| `requisition.ts` | 請購流程 |
| `approval-workflow.ts` | 簽核流 |
| `operations-centers.ts` | 工單作戰中心邏輯 |
| `workbenches.ts` | 工作台配置 |

### 系統 / 平台

| 檔案 | 用途 |
|---|---|
| `architecture-constitution.ts` | 架構憲法（不可變約定）|
| `data-ownership.ts` | 資料權屬定義 |
| `mdm.ts` | Master Data Management |
| `rbac-abac.ts` | RBAC + ABAC 權限模型 |
| `connector.ts` | 對外 connector framework |
| `notification.ts` | 通知系統 |
| `snapshot-cache.ts` | 快照 cache |
| `sync-state.ts` | 同步狀態管理 |

### 報表 / 視覺化

| 檔案 | 用途 |
|---|---|
| `lrpr05.ts` | LRPR05 報表 |
| `warroom.ts` | War Room 資料聚合 |
| `global-map.ts` | 全球地圖資料 |

### 國際化 / 工具

| 檔案 | 用途 |
|---|---|
| `i18n.ts` | 中英文切換 |
| `i18n-server.ts` | server 端 i18n |
| `types.ts` | 共用 TypeScript 型別 |
| `seed.ts` | demo 資料種子 |

### 其他

| 檔案 | 用途 |
|---|---|
| `src/lib/auth-edge.ts` | HMAC session（Edge runtime）|
| `src/lib/data.ts` | 全域常數 |
| `src/lib/supabase.ts` | Supabase client（保留，目前未啟用）|
| `src/lib/quotation-file-store.ts` | 報價單 blob 儲存（IndexedDB 第二個 DB）|

---

## 七、目前真正能用 vs 還是 mock 對照

### ⭐ 已是真實運作（資料 → 邏輯 → UI 全通）

1. **`/erp/master-data`**
   - CSV / OCR 上傳料件 / BOM / 採購 → IndexedDB
   - 上傳審計 log（誰、何時、什麼檔、幾筆、是否重複）
   - 直連 MSSQL 測試面板（架構就緒、等部署到內網即可生效）
   - 資料消費者面板（顯示哪些頁面會用到）

2. **`/erp/quotation-analyzer`**（STEP 1-3 真資料）
   - STEP 1 OCR：Gemini Vision 抽報價單 → 結構化 row
   - STEP 2 BOM 比對：用 PR-1 上傳的真實料件 + BOM 展開
   - STEP 3 採購歷史：用 PR-1 上傳的真實採購算近 12 月均價 / 議價空間 / 替代供應商
   - 月度 KPI banner（本月處理報價數 / 漲價偵測 / 潛在負毛利）

3. **`/erp/lead-time-validation`**（跨部門 AI Inbox）
   - 貼整封 email / 附檔 → Gemini 解析 → 跨主檔串接 → reply 草稿
   - 三種範例：業務問成本+交期 / 生管問替代料 / 客戶問交期合理性

4. **認證系統**
   - 密碼閘 + HMAC session cookie
   - 安全 headers（X-Frame-Options / nosniff / X-Robots-Tag noindex）

### 🚧 半成品（部分真實 / 部分 mock）

- **`/erp/quotation-analyzer` STEP 4-5**：應該成本推導 + 議價信稿 — 還用寫死的示範資料
- **`/erp/mobile/*`**：QR 掃描架構在，但對接鼎新還沒打通
- **`/erp/admin/sync`**：UI 在，背後 sync 邏輯沒接

### 📦 純 mock（demo 用）

其他 40+ 頁基本都是 demo — 視覺呈現 OK、資料是寫死的、可以給連副總看「未來會長這樣」，但點細節資料不是真的。

---

## 八、安全 / 隱私

| 項目 | 設計 |
|---|---|
| **認證** | 站台級單一密碼（`APP_PASSWORD`）+ HMAC-SHA256 簽章 cookie |
| **Session** | httpOnly + secure + sameSite=lax · 7 天到期 |
| **緊急踢人** | 換 `AUTH_SECRET` redeploy → 所有 session 立刻失效 |
| **資料外洩** | IndexedDB 全程本機，AI 只看你傳的 context，不存任何使用者資料 |
| **HTTP headers** | X-Frame DENY · nosniff · HSTS 2y · noindex / nofollow / noarchive / nosnippet · Permissions-Policy 鎖感應器 |
| **AI quota 保護** | 所有 `/api/ai/*` 都被閘擋下，未登入打 401 |
| **密碼比對** | constant-time + 200-500ms 隨機 jitter 防 brute force / timing attack |
| **Vercel `poweredByHeader`** | 關閉，不露 Next.js 版本 |

---

## 九、技術棧

| 層 | 技術 |
|---|---|
| Framework | Next.js 16 (App Router · Turbopack) |
| Runtime | Node.js 20 + Edge runtime（auth / proxy）|
| UI | React 19 + Tailwind 4 + 純 inline style |
| AI | Google Gemini 2.5 Flash / 2.0 Flash（Vision）|
| 本機儲存 | IndexedDB（兩個 DB：erp-master + quotations）|
| 檔案解析 | xlsx (CSV/Excel) + pdftoppm (PDF render) + Gemini Vision (OCR) |
| ERP 連線 | mssql 套件（架構就緒、等部署）|
| 部署 | Vercel（Hobby plan）+ chain-strategy-437l.vercel.app |
| 程式碼 | GitHub yuchen1114066/chain-strategy |
| Auth | 自製 HMAC session（無 NextAuth / Clerk 依賴）|

---

## 十、待辦路線圖（依優先級）

### 高（給副總 demo 直接加分）

1. **STEP 4 真實應該成本推導** — BOM × 採購均價 → 合理上限 vs 供應商開價
2. **KPI 第一格接客戶訂單** — 「已避免負毛利訂單」從 `—` 變成真數字（需上傳 COPMB / 客戶訂單表）

### 中（系統能力擴展）

3. **直連 MSSQL 同步任務** — 目前面板可測試，但實際同步邏輯未做（等內網部署）
4. **多階 BOM 遞迴展開** — `findBomByParent` 目前只展一層
5. **歷年漲價 SVG 曲線圖** — STEP 3 採購歷史下方加圖

### 低（清整）

6. **mock 頁面標記**：在每個 mock 頁面加「示範模式」標籤，避免使用者誤以為是真資料
7. **i18n 全站對齊** — quotation-analyzer 已做（PR-27），其他頁面用同 pattern
8. **舊頁面整併**：`/erp/parts` 與 `/erp/master-data`、`/erp/should-cost` 與 STEP 4 整合

---

*文件結束 · 共 56 頁 · 12 API · 47 lib 模組 · 2026-06-15 盤點*
