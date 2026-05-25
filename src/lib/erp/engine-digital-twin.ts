// Engine 2 — Digital Twin Engine（數位分身引擎）
//
// 每個實體都有「數位分身」：
//   供應商 → 能力/風險模型
//   工單   → 即時狀態
//   倉庫   → 庫存流
//   原料   → 價格模型
//   生產線 → 稼動模型
//   客戶   → 需求模型
//
// 統一介面：每個 twin 可被 query 當前健康 / 預測未來 / 取歷史

import { suppliers, parts, workOrders, models, today } from "./seed";
import { digitalPOs, supplierDigitalTwins } from "./supplier-portal";
import { commodities, spc } from "./commodities";
import { computePartDemand } from "./alerts";
import { computeInventoryKpis, partHealth } from "./inventory-health";

export type TwinKind = "supplier" | "work_order" | "warehouse" | "material" | "production_line" | "customer";

export type TwinHealth = "excellent" | "good" | "warning" | "critical";

export type TwinSummary = {
  kind: TwinKind;
  id: string;
  label: string;
  health: TwinHealth;
  healthScore: number;       // 0-100
  keyMetrics: { label: string; value: string; tone?: "good" | "warn" | "bad" }[];
  signals: string[];          // 當前異常信號
  href?: string;              // 對應分頁
};

export type TwinRegistry = {
  kind: TwinKind;
  label: string;
  modelType: string;           // 能力/風險模型 / 即時狀態 / 庫存流...
  description: string;
  count: number;
  examples: TwinSummary[];
};

// ============================================================
// ① 供應商分身（能力/風險模型）
// ============================================================
function supplierTwinSummary(supplierId: string): TwinSummary {
  const sup = suppliers.find((s) => s.id === supplierId);
  const t = supplierDigitalTwins().find((x) => x.supplierId === supplierId);
  const myPOs = digitalPOs.filter((p) => p.supplierId === supplierId);
  const reliability = t?.reliability ?? 0;
  const health: TwinHealth = reliability >= 85 ? "excellent" : reliability >= 70 ? "good" : reliability >= 50 ? "warning" : "critical";
  const signals: string[] = [];
  if (t?.confidence === "low") signals.push("樣本數不足，信心度低");
  if (reliability < 70) signals.push(`可靠度偏低 ${reliability.toFixed(0)}`);
  return {
    kind: "supplier", id: supplierId, label: sup?.name ?? supplierId,
    health, healthScore: Math.round(reliability),
    keyMetrics: [
      { label: "PO 數", value: String(myPOs.length) },
      { label: "可靠度", value: reliability.toFixed(0), tone: reliability >= 80 ? "good" : reliability >= 60 ? "warn" : "bad" },
      { label: "Confidence", value: t?.confidence ?? "—" },
    ],
    signals,
    href: `/erp/supplier-portal/audit?q=${supplierId}`,
  };
}

// ============================================================
// ② 工單分身（即時狀態）
// ============================================================
function workOrderTwinSummary(woId: string): TwinSummary {
  const w = workOrders.find((x) => x.id === woId);
  if (!w) return { kind: "work_order", id: woId, label: woId, health: "warning", healthScore: 50, keyMetrics: [], signals: [], href: `/erp/work-orders/${woId}` };
  const m = models.find((mm) => mm.id === w.modelId);
  const doneStages = w.stages.filter((s) => s.status === "done").length;
  const progress = (doneStages / 8) * 100;
  const dToShip = Math.round((new Date(w.shipDate + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / 86_400_000);
  const health: TwinHealth = w.status === "done" ? "excellent" : dToShip < 0 ? "critical" : dToShip < 7 ? "warning" : "good";
  const signals: string[] = [];
  if (dToShip < 0) signals.push(`已逾船期 ${-dToShip} 天`);
  else if (dToShip < 7) signals.push(`船期剩 ${dToShip} 天`);
  return {
    kind: "work_order", id: woId, label: w.woNo,
    health, healthScore: Math.round(progress),
    keyMetrics: [
      { label: "客戶", value: w.customer },
      { label: "進度", value: `${progress.toFixed(0)}%` },
      { label: "船期", value: w.shipDate, tone: dToShip < 0 ? "bad" : dToShip < 7 ? "warn" : "good" },
      { label: "機種", value: m?.code ?? "—" },
    ],
    signals,
    href: `/erp/work-orders/${woId}`,
  };
}

// ============================================================
// ③ 倉庫分身（庫存流）— 整廠一個分身
// ============================================================
function warehouseTwinSummary(): TwinSummary {
  const kpis = computeInventoryKpis();
  const health: TwinHealth = kpis.dohRiskCount > 5 ? "critical" : kpis.dohRiskCount > 2 ? "warning" : kpis.dohRiskCount > 0 ? "good" : "excellent";
  const signals: string[] = [];
  if (kpis.dohRiskCount > 0) signals.push(`${kpis.dohRiskCount} 件料件 DOH < 7 天`);
  if (kpis.agingCount > 5) signals.push(`${kpis.agingCount} 件呆滯 > 180 天`);
  if (kpis.safetyCompliance < 95) signals.push(`安全庫存達成率 ${kpis.safetyCompliance.toFixed(0)}%`);
  return {
    kind: "warehouse", id: "wh-main", label: "主廠倉庫",
    health, healthScore: Math.round(kpis.safetyCompliance),
    keyMetrics: [
      { label: "料件數", value: String(kpis.totalParts) },
      { label: "DOH 中位數", value: `${kpis.dohMedian.toFixed(0)}d`, tone: kpis.dohMedian >= 14 ? "good" : "warn" },
      { label: "週轉率", value: `${kpis.turnoverAvg.toFixed(1)}×` },
      { label: "庫存價值", value: `$${(kpis.totalInventoryValue / 10000).toFixed(0)}萬` },
    ],
    signals,
    href: "/erp/wms",
  };
}

// ============================================================
// ④ 原料分身（價格模型）
// ============================================================
function materialTwinSummary(code: string): TwinSummary {
  const c = commodities.find((x) => x.code === code);
  if (!c) return { kind: "material", id: code, label: code, health: "good", healthScore: 80, keyMetrics: [], signals: [] };
  const s = spc(c);
  const dev = ((s.latest - s.mean) / s.mean) * 100;
  const health: TwinHealth = s.status === "alert" ? "critical" : s.status === "warn" ? "warning" : "good";
  const signals: string[] = [];
  if (Math.abs(dev) > 10) signals.push(`偏離均價 ${dev >= 0 ? "+" : ""}${dev.toFixed(1)}%`);
  if (s.status === "alert") signals.push("超出管制界線（SPC alert）");
  return {
    kind: "material", id: code, label: c.name,
    health, healthScore: Math.max(0, Math.round(100 - Math.abs(dev) * 2)),
    keyMetrics: [
      { label: "當前", value: `${s.latest.toLocaleString()} ${c.unit}` },
      { label: "均價", value: s.mean.toFixed(0) },
      { label: "偏離", value: `${dev >= 0 ? "+" : ""}${dev.toFixed(1)}%`, tone: Math.abs(dev) > 10 ? "bad" : "good" },
    ],
    signals,
    href: "/erp/materials",
  };
}

// ============================================================
// ⑤ 生產線分身（稼動模型）— demo
// ============================================================
function productionLineTwinSummary(id: string, name: string, util: number): TwinSummary {
  const health: TwinHealth = util >= 92 ? "critical" : util >= 85 ? "warning" : util >= 70 ? "good" : "excellent";
  const signals: string[] = [];
  if (util >= 92) signals.push("稼動率 ≥ 92%，未來 14 天塞車風險高");
  else if (util >= 85) signals.push("稼動率偏高");
  return {
    kind: "production_line", id, label: name,
    health, healthScore: util < 70 ? 95 : Math.max(0, 100 - util),
    keyMetrics: [
      { label: "稼動率", value: `${util}%`, tone: util >= 92 ? "bad" : util >= 85 ? "warn" : "good" },
    ],
    signals,
    href: "/erp/work-orders",
  };
}

// ============================================================
// ⑥ 客戶分身（需求模型）
// ============================================================
function customerTwinSummary(customer: string): TwinSummary {
  const myWos = workOrders.filter((w) => w.customer === customer);
  const active = myWos.filter((w) => w.status === "active" || w.status === "planning");
  const totalQty = active.reduce((s, w) => s + w.qty, 0);
  const signals: string[] = [];
  if (active.length > 5) signals.push(`在製單量大（${active.length} 張）`);
  return {
    kind: "customer", id: customer, label: customer,
    health: "good", healthScore: 80,
    keyMetrics: [
      { label: "在製", value: `${active.length} 張` },
      { label: "在製數量", value: `${totalQty} 台` },
      { label: "總單", value: String(myWos.length) },
    ],
    signals,
    href: "/erp/customers",
  };
}

// ============================================================
// 取得所有 Twin 註冊表
// ============================================================
export function twinRegistry(): TwinRegistry[] {
  const supplierIds = [...new Set(digitalPOs.map((p) => p.supplierId))];
  const woActive = workOrders.filter((w) => w.status !== "done" && w.status !== "cancelled");
  const customers = [...new Set(workOrders.map((w) => w.customer))];

  return [
    {
      kind: "supplier", label: "供應商分身", modelType: "能力 / 風險模型",
      description: "依歷史 PO 累積：PO Ack baseline / 各階段平均耗時 / 標準差 / 行為可靠度",
      count: supplierIds.length,
      examples: supplierIds.slice(0, 6).map(supplierTwinSummary),
    },
    {
      kind: "work_order", label: "工單分身", modelType: "即時狀態模型",
      description: "8 階段進度 + Critical Path + 預測出貨日 + 風險信號",
      count: woActive.length,
      examples: woActive.slice(0, 5).map((w) => workOrderTwinSummary(w.id)),
    },
    {
      kind: "warehouse", label: "倉庫分身", modelType: "庫存流模型",
      description: "DOH + 週轉率 + Aging + Excess + Safety Stock — 5 KPI 連動",
      count: 1,
      examples: [warehouseTwinSummary()],
    },
    {
      kind: "material", label: "原料分身", modelType: "價格模型",
      description: "SPC 管制界線 + 4 區判斷 + 採購建議推理鏈",
      count: commodities.length,
      examples: commodities.map((c) => materialTwinSummary(c.code)),
    },
    {
      kind: "production_line", label: "生產線分身", modelType: "稼動模型",
      description: "CNC / 烘烤爐 / 包裝線 / IQC 站等的稼動率 + 14 天塞車預測",
      count: 7,
      examples: [
        productionLineTwinSummary("cnc-3", "CNC #3", 96),
        productionLineTwinSummary("cnc-2", "CNC #2", 88),
        productionLineTwinSummary("cnc-1", "CNC #1", 72),
        productionLineTwinSummary("test-1", "測試台 A", 80),
        productionLineTwinSummary("pack-1", "包裝線 1", 65),
      ],
    },
    {
      kind: "customer", label: "客戶分身", modelType: "需求模型",
      description: "在製管線 + OTD 歷史 + 客戶 ETA 承諾履行率",
      count: customers.length,
      examples: customers.slice(0, 5).map(customerTwinSummary),
    },
  ];
}

void parts; void partHealth; void computePartDemand;
