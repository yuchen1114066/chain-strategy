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
  code: string;
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
  { key: "iqc", label: "進廠檢驗", icon: "🔍" },
  { key: "line", label: "上產線", icon: "🏭" },
  { key: "test", label: "測試", icon: "⚙️" },
  { key: "pack", label: "包裝", icon: "📮" },
  { key: "ship", label: "出貨/船期", icon: "🚢" },
  { key: "customer", label: "客戶簽收", icon: "✅" },
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
  woNo: string;
  modelId: string;
  qty: number;
  customer: string;
  destination: string;
  shipDate: string; // ISO
  status: "planning" | "active" | "done" | "cancelled";
  stages: WoStage[];
};

export type AlertSeverity = "red" | "yellow";
export type AlertRule = "shortage" | "late" | "ship_risk" | "quality";

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
