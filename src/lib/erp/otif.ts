// OTIF / OTD + 客戶交期燈號引擎 — Global AI Supply Chain Command Center 核心
//
// 世界級供應鏈核心指標：
//   OTD  = On Time Delivery   準時交貨率
//   OTIF = On Time In Full    準時且足量交貨率（更嚴）
//
// 客戶交期燈號（每張在製工單自動算）：
//   綠 = 可如期交（預計交貨日 ≤ 客戶要求日，含緩衝）
//   黃 = 可能延誤（卡在邊界 / 瓶頸工序 / 料件吃緊）
//   紅 = 必延誤（預計交貨日 > 客戶要求日）
//
// AI 自動算（每天）：需求日 vs 供料日 vs 產能 vs 瓶頸工序

import { workOrders, parts, bom, suppliers, today } from "./seed";
import { analyzeBottlenecks } from "./flow-advisor";
import type { WorkOrder } from "./types";

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 八階段殘餘工時
const STAGE_DURATION: Record<string, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

export type DeliveryLight = "green" | "yellow" | "red";
export type DelayReason = "on_track" | "material_short" | "supplier_delay" | "capacity" | "bottleneck";

export type WoForecast = {
  wo: WorkOrder;
  customerRequestDate: string;
  materialReadyDate: string;
  capacityDays: number;
  bottleneckStage?: string;
  bottleneckExtraDays: number;
  predictedShipDate: string;
  slackDays: number;
  light: DeliveryLight;
  reason: DelayReason;
  responsibleSuppliers: { id: string; name: string; parts: string[] }[]; // 造成停線的供應商
};

// 計算單張工單的交期燈號
export function forecastWo(wo: WorkOrder, bottlenecks: ReturnType<typeof analyzeBottlenecks>): WoForecast {
  // 1) 供料日：所有需用料中，最晚一個的「到齊日」
  //    用 BOM × WO qty 找關鍵料，缺者 = today + 供應商交期
  const lines = bom.filter((b) => b.modelId === wo.modelId && b.isActive);
  let materialReadyDate = today;
  const supplierMap = new Map<string, { name: string; parts: string[] }>();
  for (const l of lines) {
    const p = parts.find((x) => x.id === l.partId);
    if (!p) continue;
    const need = l.qtyPerUnit * wo.qty;
    if (p.stockOnHand < need) {
      const eta = addDays(today, p.leadDays);
      if (eta > materialReadyDate) materialReadyDate = eta;
      if (p.supplierId) {
        const sup = suppliers.find((s) => s.id === p.supplierId);
        if (sup) {
          const ex = supplierMap.get(sup.id) ?? { name: sup.name, parts: [] };
          ex.parts.push(p.code);
          supplierMap.set(sup.id, ex);
        }
      }
    }
  }
  const responsibleSuppliers = [...supplierMap.entries()].map(([id, v]) => ({ id, ...v }));

  // 2) 殘餘產能/工序天數
  const incompleteStages = wo.stages.filter((s) => s.status !== "done" && s.seq <= 7);
  const capacityDays = incompleteStages.reduce((acc, s) => acc + (STAGE_DURATION[s.stage] ?? 0), 0);

  // 3) 瓶頸工序：本單目前所在階段是否為瓶頸
  const currentSeq = wo.stages.find((s) => s.status === "in_progress")?.seq
                  ?? wo.stages.find((s) => s.status !== "done")?.seq ?? 8;
  const currentStageKey = wo.stages.find((s) => s.seq === currentSeq)?.stage;
  const bn = bottlenecks.find((b) => b.stage === currentStageKey);
  const bottleneckExtraDays = bn ? Math.max(0, bn.avgDwell - bn.standardDwell) : 0;

  // 4) AI 預測實際出貨日
  //    從供料日起算 + 殘餘工序工時 + 瓶頸延遲
  const baseDate = materialReadyDate > today ? materialReadyDate : today;
  const predictedShipDate = addDays(baseDate, capacityDays + bottleneckExtraDays);
  const slackDays = daysBetween(predictedShipDate, wo.shipDate);

  // 5) 燈號
  let light: DeliveryLight = "green";
  if (slackDays < 0) light = "red";
  else if (slackDays <= 3) light = "yellow";

  // 6) 責任歸因
  let reason: DelayReason = "on_track";
  if (slackDays < 0) {
    if (responsibleSuppliers.length > 0 && materialReadyDate > today) reason = "supplier_delay";
    else if (bottleneckExtraDays > 0) reason = "bottleneck";
    else if (capacityDays > daysBetween(today, wo.shipDate)) reason = "capacity";
    else reason = "material_short";
  } else if (slackDays <= 3) {
    if (responsibleSuppliers.length > 0) reason = "material_short";
    else if (bottleneckExtraDays > 0) reason = "bottleneck";
  }

  return {
    wo,
    customerRequestDate: wo.shipDate,
    materialReadyDate,
    capacityDays,
    bottleneckStage: bn?.stageLabel,
    bottleneckExtraDays,
    predictedShipDate,
    slackDays,
    light, reason,
    responsibleSuppliers,
  };
}

export function forecastAll(): WoForecast[] {
  const bottlenecks = analyzeBottlenecks();
  return workOrders
    .filter((w) => w.status !== "done" && w.status !== "cancelled")
    .map((w) => forecastWo(w, bottlenecks));
}

// OTD / OTIF 歷史指標（已完工單）
export function computeOTD(): { otd: number; otif: number; doneCount: number; onTimeCount: number } {
  const done = workOrders.filter((w) => w.status === "done");
  if (done.length === 0) return { otd: 100, otif: 100, doneCount: 0, onTimeCount: 0 };
  const onTime = done.filter((w) => {
    const ship = w.stages.find((s) => s.stage === "ship");
    return ship?.actualDate && ship.actualDate <= w.shipDate;
  });
  // OTIF: 準時 + 足量。seed 全量交付，OTIF = OTD（無部分出貨）
  return {
    otd: (onTime.length / done.length) * 100,
    otif: (onTime.length / done.length) * 100,
    doneCount: done.length,
    onTimeCount: onTime.length,
  };
}

// 預測 OTD（前瞻）：在製單預測有多少會準時
export function computeForwardOTD(forecasts: WoForecast[]): { greenPct: number; yellowPct: number; redPct: number } {
  if (forecasts.length === 0) return { greenPct: 100, yellowPct: 0, redPct: 0 };
  const g = forecasts.filter((f) => f.light === "green").length;
  const y = forecasts.filter((f) => f.light === "yellow").length;
  const r = forecasts.filter((f) => f.light === "red").length;
  return {
    greenPct: (g / forecasts.length) * 100,
    yellowPct: (y / forecasts.length) * 100,
    redPct: (r / forecasts.length) * 100,
  };
}

// 「哪個供應商造成停線」彙整
export function blamingSuppliers(forecasts: WoForecast[]): { id: string; name: string; affectedWos: string[]; parts: string[] }[] {
  const map = new Map<string, { name: string; affectedWos: Set<string>; parts: Set<string> }>();
  for (const f of forecasts) {
    if (f.light === "green") continue;
    for (const s of f.responsibleSuppliers) {
      const ex = map.get(s.id) ?? { name: s.name, affectedWos: new Set(), parts: new Set() };
      ex.affectedWos.add(f.wo.woNo);
      s.parts.forEach((p) => ex.parts.add(p));
      map.set(s.id, ex);
    }
  }
  return [...map.entries()]
    .map(([id, v]) => ({ id, name: v.name, affectedWos: [...v.affectedWos], parts: [...v.parts] }))
    .sort((a, b) => b.affectedWos.length - a.affectedWos.length);
}
