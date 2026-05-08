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

export type Part = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  supplierId: string;
  leadDays: number;
  stockOnHand: number;
  safetyStock: number;
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

export type BomLine = {
  modelId: string;
  partId: string;
  qtyPerUnit: number;
  version: number;
  isActive: boolean;
  notes?: string;
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
