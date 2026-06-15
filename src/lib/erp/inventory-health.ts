// WMS 庫存健康度指標 — Global AI Supply Chain Command Center 必加 KPI
//
//   DOH (Days On Hand)      庫存可撐天數     = stockOnHand / dailyDemand
//   Inventory Turnover      週轉率           = 年需求 / 平均庫存
//   Excess Inventory        過剩庫存（件 / $）= stockOnHand > safetyStock × 3
//   Aging                   呆滯天數（估算）  = 365 / max(turnover, 0.1)
//   Safety Stock Compliance 安全庫存達成     = stockOnHand >= safetyStock 比例

import { parts, bom, workOrders } from "./seed";
import type { Part } from "./types";

export type PartHealth = {
  part: Part;
  dailyDemand: number;     // 每日預估需求（依在製工單）
  doh: number;             // Days On Hand
  turnover: number;        // Inventory Turnover（年）
  agingDays: number;       // 呆滯估算天數
  isExcess: boolean;       // 過剩
  isBelowSafety: boolean;  // 低於安全庫存
  excessValue: number;     // 過剩金額
  inventoryValue: number;
};

function dailyDemandFor(p: Part): number {
  // 用「未來 60 天」在製工單對該料的需求總量做近似
  let total = 0;
  for (const wo of workOrders) {
    if (wo.status !== "active" && wo.status !== "planning") continue;
    const lines = bom.filter((b) => b.modelId === wo.modelId && b.partId === p.id && b.isActive);
    for (const l of lines) total += l.qtyPerUnit * wo.qty;
  }
  // 平攤到 60 天
  return total / 60;
}

export function partHealth(): PartHealth[] {
  return parts.map((p) => {
    const daily = dailyDemandFor(p);
    const doh = daily > 0 ? p.stockOnHand / daily : 999;
    const annual = daily * 365;
    const turnover = p.stockOnHand > 0 ? annual / p.stockOnHand : 0;
    const aging = turnover > 0 ? 365 / turnover : 999;
    const isExcess = p.stockOnHand > p.safetyStock * 3 && daily * 30 < p.stockOnHand;
    const isBelow = p.stockOnHand < p.safetyStock;
    const excessQty = isExcess ? p.stockOnHand - p.safetyStock * 3 : 0;
    return {
      part: p,
      dailyDemand: daily,
      doh: Math.min(doh, 999),
      turnover,
      agingDays: Math.min(aging, 999),
      isExcess,
      isBelowSafety: isBelow,
      excessValue: excessQty * p.unitCost,
      inventoryValue: p.stockOnHand * p.unitCost,
    };
  });
}

export type InventoryKpis = {
  // DOH：以料件 DOH 中位數代表
  dohMedian: number;
  dohRiskCount: number;     // DOH < 7 天的料件數
  // 週轉率：總出貨量 / 平均庫存
  turnoverAvg: number;
  // 過剩
  excessCount: number;
  excessValue: number;
  // 呆滯
  agingCount: number;       // > 180 天視為呆滯
  agingValue: number;
  // 安全庫存達成率
  safetyCompliance: number; // %
  belowSafetyCount: number;
  totalParts: number;
  totalInventoryValue: number;
};

export function computeInventoryKpis(): InventoryKpis {
  const h = partHealth();
  if (h.length === 0) {
    return {
      dohMedian: 0, dohRiskCount: 0, turnoverAvg: 0,
      excessCount: 0, excessValue: 0, agingCount: 0, agingValue: 0,
      safetyCompliance: 100, belowSafetyCount: 0, totalParts: 0, totalInventoryValue: 0,
    };
  }
  const sorted = [...h].sort((a, b) => a.doh - b.doh);
  const dohMedian = sorted[Math.floor(sorted.length / 2)].doh;
  const dohRiskCount = h.filter((x) => x.doh < 7).length;
  const turnoverAvg = h.reduce((s, x) => s + x.turnover, 0) / h.length;
  const excess = h.filter((x) => x.isExcess);
  const aging = h.filter((x) => x.agingDays > 180);
  const below = h.filter((x) => x.isBelowSafety);
  const totalInventoryValue = h.reduce((s, x) => s + x.inventoryValue, 0);
  return {
    dohMedian: Math.min(dohMedian, 999),
    dohRiskCount,
    turnoverAvg,
    excessCount: excess.length,
    excessValue: excess.reduce((s, x) => s + x.excessValue, 0),
    agingCount: aging.length,
    agingValue: aging.reduce((s, x) => s + x.inventoryValue, 0),
    safetyCompliance: ((h.length - below.length) / h.length) * 100,
    belowSafetyCount: below.length,
    totalParts: h.length,
    totalInventoryValue,
  };
}
