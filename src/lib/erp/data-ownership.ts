// Data Ownership — 缺口 3 修正：每個 Entity 必須有「擁有者」
//
// MDM 解決「誰是 Source of Truth」（系統來源）
// Data Ownership 解決「誰負責這份資料」（人類負責部門）
// → 資料異常時知道找誰
// → 變更時知道誰要簽核
// → 績效評估時知道誰要扛責

import { MDM_REGISTRY } from "./mdm";

export type OwnerDepartment =
  | "Procurement" | "Warehouse" | "Engineering" | "QA"
  | "Finance" | "Sales" | "PMC" | "IT" | "Operations";

export const OWNER_META: Record<OwnerDepartment, { emoji: string; label: string; color: string }> = {
  Procurement: { emoji: "🛒", label: "採購部", color: "#0891b2" },
  Warehouse:   { emoji: "📦", label: "倉管",   color: "#10b981" },
  Engineering: { emoji: "⚙️", label: "工程部", color: "#7c3aed" },
  QA:          { emoji: "🔬", label: "品保",   color: "#f59e0b" },
  Finance:     { emoji: "💰", label: "財務部", color: "#059669" },
  Sales:       { emoji: "💼", label: "業務部", color: "#dc2626" },
  PMC:         { emoji: "📋", label: "生管",   color: "#3b82f6" },
  IT:          { emoji: "💻", label: "資訊部", color: "#64748b" },
  Operations:  { emoji: "🏭", label: "營運",   color: "#475569" },
};

export type EntityOwnership = {
  entity: string;
  zhName: string;
  primary: OwnerDepartment;
  secondary?: OwnerDepartment[];
  responsibility: string;
  escalation: string;
};

export const OWNERSHIP_REGISTRY: EntityOwnership[] = [
  { entity: "Supplier",       zhName: "供應商主檔", primary: "Procurement",
    responsibility: "建檔、評核、議價、合約管理", escalation: "採購主管 → 副總" },
  { entity: "Inventory",      zhName: "庫存量",     primary: "Warehouse",
    responsibility: "進出貨記錄、盤點、料況管理", escalation: "倉管主管 → 營運長" },
  { entity: "PO",             zhName: "採購單",     primary: "Procurement",
    responsibility: "建單、確認、追蹤、結案",     escalation: "採購主管 → 副總" },
  { entity: "ASN",            zhName: "出貨通知",   primary: "Procurement", secondary: ["Warehouse"],
    responsibility: "確保供應商提交、銜接收貨",   escalation: "採購 + 倉管雙線" },
  { entity: "Cost",           zhName: "成本拆解",   primary: "Finance",     secondary: ["Procurement"],
    responsibility: "Should-Cost 維護、漲價分析、年降目標", escalation: "財務 + 採購雙簽" },
  { entity: "BOM",            zhName: "BOM 結構",   primary: "Engineering",
    responsibility: "新成品 BOM 建立、變更管理 (ECN)", escalation: "工程主管 → 研發長" },
  { entity: "Part Master",    zhName: "料件主檔",   primary: "Engineering", secondary: ["Procurement"],
    responsibility: "規格、安全庫存、交期維護",   escalation: "工程 + 採購共同" },
  { entity: "Work Order",     zhName: "製令 / 工單", primary: "PMC",
    responsibility: "排程、追蹤、瓶頸排除",       escalation: "生管主管 → 廠長" },
  { entity: "Quality Report", zhName: "進料品檢",   primary: "QA",
    responsibility: "IQC 檢驗、SPC、品質記錄卡、CAR", escalation: "品保主管 → 副總" },
  { entity: "Equipment",      zhName: "設備稼動率", primary: "Operations",  secondary: ["PMC"],
    responsibility: "設備維護、稼動率回報",       escalation: "廠務主管" },
  { entity: "FX / Commodity", zhName: "匯率/原物料",primary: "Finance",     secondary: ["Procurement"],
    responsibility: "匯率更新、原物料行情監控",   escalation: "財務 + 採購" },
  { entity: "Customer",       zhName: "客戶主檔",   primary: "Sales",
    responsibility: "客戶建檔、合約、OTD 承諾",   escalation: "業務主管 → 副總" },
  { entity: "User / Role",    zhName: "使用者/角色",primary: "IT",
    responsibility: "帳號、權限、SSO、Audit log", escalation: "IT 主管" },
];

export function combinedRegistry() {
  return OWNERSHIP_REGISTRY.map((own) => {
    const mdm = MDM_REGISTRY.find((m) => m.entity === own.entity);
    return { ...own, mdm };
  });
}

export function ownerStats() {
  const owners = OWNERSHIP_REGISTRY.map((o) => o.primary);
  const distinct = new Set(owners).size;
  const byDept = new Map<OwnerDepartment, number>();
  for (const o of owners) byDept.set(o, (byDept.get(o) ?? 0) + 1);
  return { totalEntities: OWNERSHIP_REGISTRY.length, distinctOwners: distinct, byDept: [...byDept.entries()] };
}
