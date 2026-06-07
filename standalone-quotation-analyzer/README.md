# AI Quotation Analyzer · Standalone

從 `chain-strategy` ERP（L3 採購中心）抽出的獨立可執行版。
單一頁面內含完整 4-step 流程：

1. **Step 1 · OCR** — 上傳報價單 PDF / JPG / Excel，AI 解析欄位
2. **Step 2 · BOM Mapping** — 自動對應 BOM / CBS / Commodity
3. **Step 3 · Commodity Snapshot** — 抓取當前原物料價格
4. **Step 4 · Should-Cost Engine** — 合理上限拆解 → AI 判定退單 / 同意 / 議價

加上四個 ENHANCE 模組：
- ① 供應商歷史單價曲線（兩家對照 / 同質性判斷）
- ② 替代供應商比較（或歷史購入資料 fallback）
- ③ 議價 Copilot
- ④ AI Confidence 三角追溯

報告產出（皆 `window.open()` + `window.print()` → PDF）：
- **L0 Board Decision Card** — 1 頁 · 五排架構 · 鎖版面公式（v5）
- **L1 Executive Report** — 3 頁 · 高管視角
- **Full Report** — 11 節完整版

---

## 環境

- Node.js ≥ 20
- Next.js 16（App Router · Turbopack）
- React 19
- Tailwind v4
- TypeScript 5

## 安裝 & 啟動

```bash
npm install
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)。

預設會跳出 IntakeModal，按「送出分析 →」進入分析頁。

## 上傳測試

支援格式：**PDF / JPG / PNG / Excel**

若要看 demo，IntakeModal 按關閉後會直接看到三筆 seed 資料（企龍 / Acme / 新譽）。

> 螢幕擷取檔名前綴會自動過濾（避免被誤認成廠商名）。
> 無法辨識的廠商可在表格內 inline 編輯。

## 報告產出

每筆 OCR 列右側都有三顆按鈕：
- `Board PDF` → L0 一頁版
- `L1 PDF` → 3 頁版
- `Full PDF` → 11 節完整版

PDF 透過瀏覽器列印對話框輸出，建議：
- A4 直向
- 邊距：無 / Minimum
- 勾選「Background graphics」

## 鎖定條款（L0 v5）

> **🔒 LOCKED：五排架構 + 計算公式 + 4-layer footer**
> **✓ UNLOCKED：廠名、價格、Risk Radar 注解、建議文字**
>
> 任何結構性變動需更新 LOCKED 區塊與版本號。

## 跨模組連結

原版會跳到 `/erp/l5-final`、`/erp/procurement` — 在 standalone 已停用（顯示「跨模組連結已停用」字樣）。若要整回主專案，把它們改回 `<Link>` 並補上對應路由即可。

## 與 ERP 的關係

唯讀對接：本 standalone 不會寫入鼎新 ERP。所有資料皆在前端模擬 / OCR 結果暫存在 React state 內，**不會持久化**。

---

> CHI HUA AI · L3 PROCUREMENT · AI Quotation Analyzer
> 版本：standalone-1.0.0
