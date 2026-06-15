// MDM (Master Data Management) — 致命缺口 2 補上
//
// 必須定義「誰才是唯一真實來源」(Source of Truth, SoT)：
//   Supplier  → Portal      （本系統供應商協作入口）
//   Inventory → ERP         （鼎新 iGP — INVMB/INVMC/INVTB）
//   PO        → ERP         （鼎新 iGP — PURTC/PURTD）
//   ASN       → Portal      （本系統供應商提交入口）
//   Cost      → AI Cost Engine（本系統 Should-Cost 引擎）
//   BOM       → ERP/PLM     （鼎新 BOMMA/BOMMB，未來可接 PLM）
//
// 沒有這層 = 各模組可能用不同來源的同一筆資料，造成衝突與決策錯誤。

export type SourceOfTruth = "Portal" | "ERP" | "ERP/PLM" | "AI Cost Engine" | "Manual" | "External API";

export type SyncDirection = "ERP→Portal" | "Portal→ERP" | "Two-way" | "Read-only from ERP" | "Portal-only" | "External feed";

export type MasterDataDef = {
  entity: string;
  zhName: string;
  sourceOfTruth: SourceOfTruth;
  syncDirection: SyncDirection;
  syncFrequency: string;
  conflictRule: string;
  consumers: string[];        // 哪些模組讀取
  writeAccess: string[];      // 誰可以寫
  notes: string;
};

export const MDM_REGISTRY: MasterDataDef[] = [
  {
    entity: "Supplier",
    zhName: "供應商主檔",
    sourceOfTruth: "Portal",
    syncDirection: "Portal→ERP",
    syncFrequency: "日同步（22:00）",
    conflictRule: "本系統 Portal 為主；鼎新若需新增供應商 → 採購於 Portal 建檔 → 自動 push 到鼎新 APRMA",
    consumers: ["Risk Radar", "Decision Engine", "Order Impact", "Negotiation", "Global Map", "Receiving"],
    writeAccess: ["採購主管", "系統管理員"],
    notes: "Portal 保留豐富欄位（國家、評分、Twin baseline）；ERP 只需基本資料即可",
  },
  {
    entity: "Inventory",
    zhName: "庫存量",
    sourceOfTruth: "ERP",
    syncDirection: "Read-only from ERP",
    syncFrequency: "每 30 分鐘",
    conflictRule: "鼎新 INVTB 為唯一真實；本系統純讀取，扣帳一律回鼎新操作",
    consumers: ["缺料牆", "Order Impact", "WMS Dashboard", "Reorder", "Dead Stock"],
    writeAccess: ["（不可寫入，鼎新操作員透過 ERP 介面）"],
    notes: "切勿在本系統嘗試扣帳。本系統顯示為「鏡像視圖」+ 衍生分析（DOH/Turnover/Aging）",
  },
  {
    entity: "PO",
    zhName: "採購單",
    sourceOfTruth: "ERP",
    syncDirection: "Read-only from ERP",
    syncFrequency: "每 1 小時",
    conflictRule: "鼎新 PURTC/PURTD 為唯一真實；建單一律在鼎新；本系統只讀取狀態 + 加值（Digital Twin / 預警）",
    consumers: ["供應商協作入口", "ETA Forecast", "Receiving", "Risk Radar"],
    writeAccess: ["（不可寫入；本系統只能在 PO 上掛 metadata，不改 PO 本體）"],
    notes: "若改價/改量/改交期 → 必須在鼎新操作；本系統會 30 分鐘內感知到變更並 fan-out",
  },
  {
    entity: "ASN",
    zhName: "出貨通知",
    sourceOfTruth: "Portal",
    syncDirection: "Portal→ERP",
    syncFrequency: "即時（供應商送出後立刻）",
    conflictRule: "本系統 Portal 為主；供應商在 Portal 提交 ASN → 同步寫到鼎新對應表（或附件）",
    consumers: ["Event Bus", "缺料牆", "ETA Forecast", "WMS Receiving", "AI Alert"],
    writeAccess: ["供應商（限自家 PO）", "採購（協助代填）"],
    notes: "ASN 是 Portal 獨有的新概念，鼎新沒有對應表；可考慮在鼎新新增 USR 自訂表存放",
  },
  {
    entity: "Cost",
    zhName: "成本拆解 / Should-Cost",
    sourceOfTruth: "AI Cost Engine",
    syncDirection: "Portal-only",
    syncFrequency: "依採購事件 / 漲價分析觸發",
    conflictRule: "本系統 AI Cost Engine 為主；鼎新 CST* 是「結算後成本」，本系統 Should-Cost 是「應有成本」，兩者並存不衝突",
    consumers: ["Negotiation", "Order Impact", "AI Alert"],
    writeAccess: ["採購主管（調整成本拆解 profile）"],
    notes: "成本拆解結構（原料 %/加工 %/...）是業界經驗值，可隨類別 / 廠別微調",
  },
  {
    entity: "BOM",
    zhName: "BOM 結構",
    sourceOfTruth: "ERP/PLM",
    syncDirection: "Read-only from ERP",
    syncFrequency: "每日同步（02:00）",
    conflictRule: "鼎新 BOMMA/BOMMB 為主；未來若有 PLM（Teamcenter/Windchill）→ PLM 為主、鼎新為次",
    consumers: ["缺料牆", "Order Impact", "工單追蹤", "BOM Compare", "型號頁"],
    writeAccess: ["（不可寫入）"],
    notes: "BOM 改版會回溯影響缺料牆 + 訂單衝擊模擬，IT 改完 BOM 必須通知 PM",
  },
  {
    entity: "Part Master",
    zhName: "料件主檔",
    sourceOfTruth: "ERP",
    syncDirection: "Read-only from ERP",
    syncFrequency: "每日同步（02:00）",
    conflictRule: "鼎新 INVMB 為主；單價 / 安全庫存 / 交期 全部以鼎新為準",
    consumers: ["全系統"],
    writeAccess: ["（不可寫入）"],
    notes: "本系統可加註 SPC 規格、Risk Radar 連結等延伸資料，不改 INVMB 本體",
  },
  {
    entity: "Work Order",
    zhName: "製令 / 工單",
    sourceOfTruth: "ERP",
    syncDirection: "Read-only from ERP",
    syncFrequency: "每 30 分鐘",
    conflictRule: "鼎新 MOCTH/MOCTI 為主；本系統只讀進度 + 加值（Critical Path / 8 階段視覺化）",
    consumers: ["工單追蹤", "戰情室", "Customer Analytics"],
    writeAccess: ["（不可寫入）"],
    notes: "完工回報、品檢、入庫扣帳 → 全部回鼎新操作",
  },
  {
    entity: "Quality Report",
    zhName: "進料品檢",
    sourceOfTruth: "Portal",
    syncDirection: "Portal→ERP",
    syncFrequency: "即時（檢核完成立刻）",
    conflictRule: "本系統 Portal 為主（包含 SPC 量測值）；同步寫到鼎新 QUATH/QUATI",
    consumers: ["Risk Radar", "Quality Card", "SPC 軸心", "Receiving Step 6"],
    writeAccess: ["品保人員", "倉管（收貨檢核）"],
    notes: "鼎新原有 QUATH 只記合格/不合格；本系統補上 8 件量測值 + Cpk + 趨勢",
  },
  {
    entity: "Equipment / Capacity",
    zhName: "設備稼動率",
    sourceOfTruth: "Manual",
    syncDirection: "Portal-only",
    syncFrequency: "現為計算值；未來接 MES",
    conflictRule: "目前由系統依工單推估；未來接 MES 為主",
    consumers: ["工單追蹤", "Critical Path", "AI ETA"],
    writeAccess: ["PM"],
    notes: "未來接 MES → 設備稼動率改為 Read-only from MES",
  },
  {
    entity: "FX Rate / Commodity Price",
    zhName: "匯率 / 原物料價格",
    sourceOfTruth: "External API",
    syncDirection: "External feed",
    syncFrequency: "每小時",
    conflictRule: "外部資料源（LME/BoT/Brent）為主；本系統不修改",
    consumers: ["Materials", "Should-Cost", "Negotiation", "Global Map"],
    writeAccess: ["（外部 API；管理員可手動 override）"],
    notes: "demo 為內建序列；正式版接 LME API / Fastmarkets / TradingEconomics",
  },
  {
    entity: "Customer",
    zhName: "客戶主檔",
    sourceOfTruth: "ERP",
    syncDirection: "Read-only from ERP",
    syncFrequency: "每日同步",
    conflictRule: "鼎新 ACRMA 為主",
    consumers: ["客戶分析", "OTIF/OTD", "Customer Risk"],
    writeAccess: ["（不可寫入）"],
    notes: "客戶建檔仍在鼎新；本系統補上 OTD 歷史 + 在製管線",
  },
  {
    entity: "User / Role",
    zhName: "使用者 / 角色",
    sourceOfTruth: "Portal",
    syncDirection: "Portal-only",
    syncFrequency: "—",
    conflictRule: "本系統獨立管理；不影響鼎新登入帳號",
    consumers: ["RBAC + ABAC 權限引擎"],
    writeAccess: ["系統管理員"],
    notes: "未來可整合公司 AD / SSO（Azure AD / Google Workspace）",
  },
];

// 衝突偵測：當同一筆 entity 在 Portal 與 ERP 不一致時的處理
export type ConflictEvent = {
  entity: string;
  recordId: string;
  field: string;
  portalValue: unknown;
  erpValue: unknown;
  detectedAt: string;
  resolution: "use_sot" | "manual_review" | "auto_merge";
};

export function summarizeMdm() {
  return {
    totalEntities: MDM_REGISTRY.length,
    portalAsSot: MDM_REGISTRY.filter((m) => m.sourceOfTruth === "Portal").length,
    erpAsSot: MDM_REGISTRY.filter((m) => m.sourceOfTruth.includes("ERP")).length,
    externalAsSot: MDM_REGISTRY.filter((m) => m.sourceOfTruth === "External API").length,
    aiEngineAsSot: MDM_REGISTRY.filter((m) => m.sourceOfTruth === "AI Cost Engine").length,
  };
}
