// 架構憲法 — 5 條鐵律 + Domain Boundaries
//
// 這是系統的不可違反原則（Architectural Constitution）。
// 任何新功能 / 新模組 / 新整合都必須遵守。
//
// 違反 = 系統爛掉、無法 scale、AI 互相矛盾、信任崩塌。

export type ArchLaw = {
  n: string;
  title: string;
  importance: string;
  forbidden: string[];          // 禁止
  required: string[];           // 必須
  example?: { wrong: string; right: string };
  reason: string;               // 為什麼重要
  consequence: string;          // 違反的後果
};

export const FIVE_IRON_LAWS: ArchLaw[] = [
  {
    n: "1",
    title: "所有功能都必須 Event-Driven",
    importance: "極為重要",
    forbidden: [
      "頁面直接呼叫",
      "Page A 直接改 Page B 的資料",
      "繞過 Event Stream 直接修改狀態",
    ],
    required: [
      "Event → Workflow → Decision → Action",
      "所有狀態變化 emit 事件",
      "下游模組訂閱 Event Stream 接收",
    ],
    example: {
      wrong: "ASN page → 直接更新 WO page",
      right: "ASN_delayed event → workflow engine → WO risk recalculated",
    },
    reason: "Event Architecture 才能 scale — 否則 N 個頁面需要 N² 個耦合，永遠改不動",
    consequence: "改一個地方、別處還是舊資料 → 決策不一致、靠人工同步 → 出包",
  },
  {
    n: "2",
    title: "UI 不准有 Business Logic",
    importance: "超重要",
    forbidden: [
      "React page 寫算法",
      "頁面 component 內做 if/else 業務判斷",
      "前端複寫 Engine 已有的計算",
    ],
    required: [
      "AI Engine 統一計算",
      "UI 只能 Surface（呈現）",
      "所有業務規則收斂在 lib/erp/engine-*.ts",
    ],
    example: {
      wrong: "在 page.tsx 內計算 OTD = onTime / total",
      right: "lib/erp/otif.ts computeOTD() → page 只呼叫",
    },
    reason: "面對：每頁算法不同 / AI 不一致 / KPI 失真 → 最後全錯",
    consequence: "UI 改版一次、業務規則就掉一塊 → 永遠 debug",
  },
  {
    n: "3",
    title: "所有 AI 必須 Centralized",
    importance: "該章節要重要",
    forbidden: [
      "每個部門自己做 AI",
      "採購做一套 ETA、業務做一套 ETA",
      "10 個頁面 10 套預測模型",
    ],
    required: [
      "AI Core Layer 統一",
      "eta-engine（單一 ETA 來源）",
      "risk-engine（單一風險評分）",
      "cost-engine（單一成本拆解）",
      "simulation-engine（單一情境模擬）",
    ],
    example: {
      wrong: "supplier-portal 算一個 ETA，eta-forecast 算另一個 ETA",
      right: "兩頁都呼叫 lib/erp/eta-forecast.ts 的同一個函式",
    },
    reason: "AI 會互相矛盾 → 老闆看到兩套不同數字 → 不再信任系統",
    consequence: "AI 訊號變雜訊 → 重要警報被忽略 → 系統失效",
  },
  {
    n: "4",
    title: "所有資料都必須有 Source of Truth",
    importance: "絕不能模糊化",
    forbidden: [
      "同一筆 ETA 存兩個地方",
      "Portal 一份、ERP 一份，誰真誰假不知道",
      "本系統重複造一份鼎新已有的資料",
    ],
    required: [
      "Single Source of Truth（SSoT）每個 Entity 只有一個",
      "PO → ERP（鼎新唯讀）",
      "ASN → Portal（本系統）",
      "ETA → ETA Engine（本系統計算）",
      "Risk Score → Risk Engine（本系統計算）",
      "Inventory → ERP（唯讀，扣帳回 ERP）",
    ],
    example: {
      wrong: "同一個 ETA 在 supplier-portal、eta-forecast、戰情室各存一份",
      right: "ETA 只在 eta-engine 計算，其他模組透過 API 取",
    },
    reason: "不然 AI 會開始亂掉 — 用哪份資料算的？答案不一樣",
    consequence: "資料漂移、衝突、人工協調成本爆炸",
  },
  {
    n: "5",
    title: "所有 Action 必須可追溯",
    importance: "信任的基礎",
    forbidden: [
      "AI 黑箱判定（不知道為什麼）",
      "人工偷偷修改數據（無 audit）",
      "Workflow 跑了沒人知道",
    ],
    required: [
      "Audit Trail 全程記錄",
      "AI 訊號 → 必須可解釋（Inputs / Logic / Confidence）",
      "人工修改 → 必須記名 + 原因 + 時間",
      "Workflow → 必須有 trace",
      "ETA 變更 → 必須留前後對照",
      "Cost 變更 → 必須留審批人",
    ],
    example: {
      wrong: "AI 突然把供應商 A 降到 D 級，沒人知道為什麼",
      right: "Audit log 顯示：基於 X/Y/Z 3 個事件 + risk-engine v2 規則 → 自動降級，可重放",
    },
    reason: "企業永遠不能 fully trust AI（除非可追溯）",
    consequence: "AI 變黑箱、合規檢查過不了、出事沒人擔",
  },
];

// ============================================================
// Domain Boundaries — 領域邊界
// ============================================================
export type Domain = {
  name: string;
  emoji: string;
  responsibility: string;       // 負責什麼
  entities: string[];            // 該 domain 擁有的 entities
  publishesEvents: string[];     // 該 domain 對外發送的事件
  subscribesTo: string[];        // 該 domain 訂閱的事件
  color: string;
};

export const DOMAINS: Domain[] = [
  {
    name: "Supplier Domain",
    emoji: "🤝",
    responsibility: "供應商互動 / PO / ASN",
    entities: ["Supplier", "PO", "ASN", "Quality Report"],
    publishesEvents: ["po_unconfirmed", "asn_missing", "asn_delayed", "iqc_ng"],
    subscribesTo: ["raw_material_surge（影響採購決策）"],
    color: "#0891b2",
  },
  {
    name: "Manufacturing Domain",
    emoji: "🏭",
    responsibility: "工單 / 生產排程 / 設備",
    entities: ["Work Order", "Equipment", "BOM"],
    publishesEvents: ["eta_changed", "stockout_imminent", "delay_signal"],
    subscribesTo: ["asn_missing（影響料件供應）", "iqc_ng（影響投料）"],
    color: "#3b82f6",
  },
  {
    name: "Inventory Domain",
    emoji: "📦",
    responsibility: "庫存 / 倉儲 / 收貨",
    entities: ["Stock", "Storage", "Receiving"],
    publishesEvents: ["receiving_fail_hold", "stockout_imminent"],
    subscribesTo: ["asn_delayed（影響到貨）", "po_unconfirmed（影響庫存規劃）"],
    color: "#f59e0b",
  },
  {
    name: "AI Domain",
    emoji: "🧠",
    responsibility: "預測 / 推薦 / 模擬",
    entities: ["Prediction (ETA/Delay/Cost/Demand/Capacity/Risk)", "Digital Twin", "Decision Recommendation"],
    publishesEvents: ["supplier_score_drop", "raw_material_surge", "raw_material_crash"],
    subscribesTo: ["ALL events（AI 是全域訂閱者）"],
    color: "#7c3aed",
  },
  {
    name: "Governance Domain",
    emoji: "🔐",
    responsibility: "權限 / 主檔 / 審計 / 通知",
    entities: ["User", "Role", "MDM Registry", "Audit Log", "Notification Policy"],
    publishesEvents: ["（不發業務事件，只記錄）"],
    subscribesTo: ["ALL events（用於 audit / lineage）"],
    color: "#dc2626",
  },
];

export const DOMAIN_RULE = `
🎯 Domain 之間：只能透過 Event 溝通

不允許：
  · Domain A 的程式碼直接讀 Domain B 的資料庫
  · Domain A 的 UI 直接呼叫 Domain B 的內部 function
  · Domain 之間共用 mutable state

必須：
  · A 完成事情 → emit event
  · B 訂閱 event → 自己處理
  · 任何跨 domain 通訊 = 一條清楚的事件路徑（可 trace）

為什麼：
  · 各 domain 可獨立部署、獨立測試、獨立 scale
  · 改一個 domain 不會炸到別人
  · Audit Trail 自動成形
`;
