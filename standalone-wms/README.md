# WMS 智慧倉儲模組 · Standalone

從 `chain-strategy` ERP 抽出的獨立可執行 WMS 模組。

## 包含頁面

| 路由 | 功能 |
|------|------|
| `/wms` | WMS 戰情 Dashboard — 庫存 KPI / 工單進度 / 倉區熱力圖 / 異常警訊 |
| `/wms/receiving` | 進貨待檢清單 — ASN 匹配、PO 收貨列表 |
| `/wms/receiving/[poId]` | 7 階段收貨品檢 Checklist（Scan → 外觀 → 重量 → 開箱 → 數量 → IQC → 判定） |
| `/wms/spc-shaft` | SPC 統計製程管制 + SPEC 規格表（軸心件 P03SG007-0） |

## 包含模組（lib/）

| 檔案 | 功能 |
|------|------|
| `warehouse.ts` | PDA 掃碼分類 / 單據類型 / 鼎新 SP 路由 |
| `receiving-checklist.ts` | 7 步驟狀態機 + 判定邏輯（PASS → 入庫 / FAIL → HOLD chain） |
| `seed.ts` | 主資料（工單 / 料件 / 供應商 / BOM） |
| `alerts.ts` | 異常警訊引擎 |
| `inventory-health.ts` | 庫存 KPI（DOH / 週轉率 / 呆滯 / 安全庫存） |
| `supplier-portal.ts` | 供應商入口（digitalPOs → receiving 串接） |
| `shaft-spc.ts` | SPC 資料 + Cpk 計算（自包含，無外部依賴） |
| `types.ts` | 共用型別定義 |

## 環境

- Node.js ≥ 20
- Next.js 16（App Router）
- React 19
- Tailwind v4
- TypeScript 5

## 安裝 & 啟動

```bash
npm install
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)，自動跳轉 `/wms`。

## 收貨 Checklist 測試

1. 進入 `/wms/receiving`
2. 選任一筆 PO → 進入 7 步驟 Checklist
3. 逐步完成 Scan → 外觀 → 重量 → 開箱 → 數量 → IQC → 判定
4. 步驟 6 (IQC) 尺寸項目可跳轉 `/wms/spc-shaft` 查看 SPC 管制圖
5. 全 PASS → 入庫確認（輸入儲位號 → Putaway）
6. 任一 FAIL → HOLD（顯示 chain action：鎖庫、通知 SQE、發 RMA）

進度存在 `localStorage`（key: `gascc.receiving.v2.{poId}`），重整不遺失。

## 跨模組連結

原版 `/erp/alerts`、`/erp/work-orders` 等跨模組連結在 standalone 已導回 `/wms`（hover 會顯示「standalone — 跨模組連結已停用」），需接回完整 ERP 時只要把路由改回即可。

## 與 ERP 的關係

唯讀：本 standalone 不會寫入鼎新 ERP。所有資料皆為 seed 種子或 localStorage 暫存。

---

> CHI HUA AI · WMS 智慧倉儲模組
> 版本：standalone-1.0.0
