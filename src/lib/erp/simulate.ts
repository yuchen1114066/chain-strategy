// 缺料模擬器引擎 — pure，可在 client 跑
import { bom, parts, suppliers, models, workOrders, today } from "./seed";

export type SimInput = { modelCode: string; qty: number };

export type SimRow = {
  partCode: string;
  partName: string;
  category: string;
  unit: string;
  unitCost: number;
  // 既有占用（其他進行中工單已吃掉的量）
  existingDemand: number;
  // 模擬新增的量
  simulatedDemand: number;
  // 加總需求
  totalDemand: number;
  stockOnHand: number;
  // 在庫 - 既有 - 模擬
  netBalance: number;
  shortage: number;
  supplierName: string;
  supplierCountry: string;
  leadDays: number;
  transitDays: number;
  // 預計到廠日（今天 + 交期）
  eta: string;
  // 此料是否會卡住「能否趕上船期」
  blocking: boolean;
};

export type SimSummary = {
  rows: SimRow[];
  totalCost: number;
  shortageCount: number;
  longestEta: string;          // 最晚的到廠日 = 開工最早可以是哪天
  longestEtaDays: number;      // 距今天幾天
  cantStartBefore: string;     // 能開工的最早日期
  // 客戶若指定船期，回推可行性
  shipFeasibility?: {
    requestedShipDate: string;
    minProductionDays: number;  // 開工後到出貨需多少天
    earliestPossibleShipDate: string;
    canMakeIt: boolean;
    daysShort: number;          // 不行時差幾天
  };
};

// 反向排程：開工後到出貨需要的最少天數（IQC 2 + 生產 5 + 測試 2 + 包裝 1 = 10 天）
const PROD_TO_SHIP_DAYS = 10;

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export function simulate(inputs: SimInput[], requestedShipDate?: string): SimSummary {
  // 既有占用：已 active / planning 的工單透過 BOM 展開
  const existing = new Map<string, number>();
  for (const wo of workOrders) {
    if (wo.status !== "active" && wo.status !== "planning") continue;
    const lines = bom.filter((b) => b.modelId === wo.modelId && b.isActive);
    for (const l of lines) {
      existing.set(l.partId, (existing.get(l.partId) ?? 0) + l.qtyPerUnit * wo.qty);
    }
  }

  // 模擬新增需求
  const sim = new Map<string, number>();
  for (const inp of inputs) {
    if (inp.qty <= 0) continue;
    const m = models.find((m) => m.code === inp.modelCode);
    if (!m) continue;
    const lines = bom.filter((b) => b.modelId === m.id && b.isActive);
    for (const l of lines) {
      sim.set(l.partId, (sim.get(l.partId) ?? 0) + l.qtyPerUnit * inp.qty);
    }
  }

  // 只列出有需求的料
  const rows: SimRow[] = [];
  let longestLead = 0;
  let totalCost = 0;
  for (const [partId, simQty] of sim.entries()) {
    const part = parts.find((p) => p.id === partId);
    if (!part) continue;
    const sup = suppliers.find((s) => s.id === part.supplierId);
    const ex = existing.get(partId) ?? 0;
    const total = ex + simQty;
    const balance = part.stockOnHand - total;
    const shortage = balance < 0 ? -balance : 0;
    // ETA：若需要追料，到廠日 = today + leadDays + transitDays。否則 = today（直接領現貨）
    const needsReorder = shortage > 0;
    const eta = needsReorder ? addDays(today, part.leadDays + (sup?.transitDays ?? 0)) : today;
    const etaDays = diffDays(today, eta);
    if (etaDays > longestLead) longestLead = etaDays;
    rows.push({
      partCode: part.code,
      partName: part.name,
      category: part.category,
      unit: part.unit,
      unitCost: part.unitCost,
      existingDemand: ex,
      simulatedDemand: simQty,
      totalDemand: total,
      stockOnHand: part.stockOnHand,
      netBalance: balance,
      shortage,
      supplierName: sup?.name ?? "—",
      supplierCountry: sup?.country ?? "—",
      leadDays: part.leadDays,
      transitDays: sup?.transitDays ?? 0,
      eta,
      blocking: needsReorder,
    });
    totalCost += part.unitCost * simQty;
  }

  // 排序：缺料 > 一般，缺料內依 ETA 由晚到近
  rows.sort((a, b) => {
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    return b.eta.localeCompare(a.eta);
  });

  const cantStartBefore = addDays(today, longestLead);
  const earliestPossibleShipDate = addDays(cantStartBefore, PROD_TO_SHIP_DAYS);

  let shipFeasibility: SimSummary["shipFeasibility"] | undefined;
  if (requestedShipDate) {
    const slack = diffDays(earliestPossibleShipDate, requestedShipDate);
    shipFeasibility = {
      requestedShipDate,
      minProductionDays: longestLead + PROD_TO_SHIP_DAYS,
      earliestPossibleShipDate,
      canMakeIt: slack >= 0,
      daysShort: slack < 0 ? -slack : 0,
    };
  }

  return {
    rows,
    totalCost,
    shortageCount: rows.filter((r) => r.shortage > 0).length,
    longestEta: cantStartBefore,
    longestEtaDays: longestLead,
    cantStartBefore,
    shipFeasibility,
  };
}

// 對外暴露 model list（簡版，client 用）
export const modelOptions = models.map((m) => ({
  code: m.code,
  name: m.name,
  family: m.machineFamily,
  price: m.stdPrice,
}));
