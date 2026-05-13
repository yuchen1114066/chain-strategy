// Equipment ERP — domain types

export type Supplier = {
  id: string;
  code: string;
  name: string;
  country: string;
  city: string;
  transitDays: number;
  contact: string;
};

export type PartKind = "purchase" | "self" | "dummy" | "feature" | "outsource";
// 採購件 / 自製件 / 虛設品號 / Feature件 / 託外加工件

export type Part = {
  id: string;
  code: string;
  name: string;
  spec?: string;              // 規格 e.g. "NBK 6001 2RS" / "ψ12機用"
  category: string;
  unit: string;               // PCS / F / g / SET / PR
  unitCost: number;
  supplierId?: string;        // 自製件可為空
  leadDays: number;
  stockOnHand: number;
  safetyStock: number;
  kind?: PartKind;            // 預設 "purchase"
};

export type BomLine = {
  modelId: string;
  partId: string;
  parentPartCode?: string;    // 階層父節點 part code（null = 直接掛在 model 下）
  level?: number;             // 0 = 主件本身, 1 = 直接子件, 2+ = 孫件…（預設 1）
  qtyPerUnit: number;
  batchQty?: number;          // 標準批量（多數為 1）
  version: number;
  isActive: boolean;
  notes?: string;
};

export type Model = {
  id: string;
  code: string;              // = 成品品號 e.g. "FB64H021-A2"
  finishedCode?: string;     // alias for code, semantic clarity
  machineFamily: string;     // = 機種 e.g. "FB64・直立車"
  name: string;
  category: "treadmill" | "bike" | "rower" | "elliptical" | "strength";
  description: string;
  stdPrice: number;
};

export const STAGES = [
  { key: "material", label: "算料", icon: "📦" },
  { key: "arrival", label: "到廠", icon: "🚚" },
  { key: "iqc", label: "進貨檢驗", icon: "🔍" },
  { key: "line", label: "生產", icon: "🏭" },
  { key: "test", label: "測試", icon: "⚙️" },
  { key: "pack", label: "包裝", icon: "📮" },
  { key: "ship", label: "出貨", icon: "🚢" },
  { key: "customer", label: "客戶交付", icon: "✅" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export type StageStatus = "pending" | "in_progress" | "done" | "blocked";

export type WoStage = {
  stage: StageKey;
  seq: number;
  plannedDate: string; // ISO yyyy-mm-dd
  actualDate?: string;
  status: StageStatus;
  passQty?: number;
  failQty?: number;
  notes?: string;
};

export type WorkOrder = {
  id: string;
  woNo: string;            // 訂單號 e.g. "ORD-2026-001"
  source: "ERP" | "manual"; // 來源
  modelId: string;
  qty: number;             // 數量
  customer: string;        // 客戶 e.g. "LIFE"
  destination: string;
  orderDate: string;       // 下單日 ISO
  shipDate: string;        // 客戶要求船期 ISO
  status: "planning" | "active" | "done" | "cancelled";
  statusLabel?: string;    // 中文狀態 e.g. "已簽收" / "生產中"
  notes?: string;          // 備註
  stages: WoStage[];
};

export type AlertSeverity = "red" | "yellow";
export type AlertRule =
  | "shortage"          // 已缺料
  | "shortage_forecast" // 預測缺料（依 WO 開工日 + 供應商交期）
  | "late"              // 進度已延遲
  | "late_forecast"     // 預測會延遲（依未完成階段 + 殘餘工時）
  | "ship_risk"         // 誤船風險
  | "quality";          // 品質異常

export type Alert = {
  id: string;
  woId: string;
  severity: AlertSeverity;
  rule: AlertRule;
  title: string;
  detail: string;
  suggestedAction: string;
  resolved: boolean;
  createdAt: string;
};
