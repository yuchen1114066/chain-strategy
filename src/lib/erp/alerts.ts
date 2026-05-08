// Alert engine — pure functions over seed data.
// In production these become SQL views / cron jobs.

import type { Alert, Part } from "./types";
import { bom, parts, models, workOrders, today } from "./seed";

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

export type PartDemand = {
  part: Part;
  totalRequired: number;
  netBalance: number;     // stockOnHand - totalRequired
  shortage: number;       // max(0, -netBalance)
  contributingWos: { woNo: string; need: number }[];
};

export function computePartDemand(): PartDemand[] {
  const map = new Map<string, PartDemand>();
  for (const p of parts) {
    map.set(p.id, {
      part: p,
      totalRequired: 0,
      netBalance: p.stockOnHand,
      shortage: 0,
      contributingWos: [],
    });
  }
  for (const wo of workOrders) {
    if (wo.status !== "planning" && wo.status !== "active") continue;
    const lines = bom.filter((b) => b.modelId === wo.modelId && b.isActive);
    for (const line of lines) {
      const need = line.qtyPerUnit * wo.qty;
      const d = map.get(line.partId);
      if (!d) continue;
      d.totalRequired += need;
      d.netBalance -= need;
      d.contributingWos.push({ woNo: wo.woNo, need });
    }
  }
  for (const d of map.values()) {
    d.shortage = d.netBalance < 0 ? -d.netBalance : 0;
  }
  return [...map.values()].sort((a, b) => b.shortage - a.shortage);
}

// Simulate "what if I add this hypothetical demand" — used by /erp/import or planning UI.
export function simulateDemand(adds: { modelCode: string; qty: number }[]): PartDemand[] {
  const base = computePartDemand();
  for (const a of adds) {
    const m = models.find((m) => m.code === a.modelCode);
    if (!m) continue;
    const lines = bom.filter((b) => b.modelId === m.id && b.isActive);
    for (const line of lines) {
      const idx = base.findIndex((d) => d.part.id === line.partId);
      if (idx < 0) continue;
      const need = line.qtyPerUnit * a.qty;
      base[idx].totalRequired += need;
      base[idx].netBalance -= need;
      base[idx].shortage = base[idx].netBalance < 0 ? -base[idx].netBalance : 0;
      base[idx].contributingWos.push({ woNo: `(模擬)${a.modelCode}×${a.qty}`, need });
    }
  }
  return base.sort((a, b) => b.shortage - a.shortage);
}

export function computeAlerts(): Alert[] {
  const out: Alert[] = [];
  const demand = computePartDemand();

  // Shortage alerts (per WO that pulls shortage parts)
  const shortageParts = demand.filter((d) => d.shortage > 0);
  for (const sp of shortageParts) {
    const woSet = new Set(sp.contributingWos.map((c) => c.woNo));
    for (const woNo of woSet) {
      const wo = workOrders.find((w) => w.woNo === woNo);
      if (!wo) continue;
      out.push({
        id: `al-short-${sp.part.id}-${wo.id}`,
        woId: wo.id,
        severity: "red",
        rule: "shortage",
        title: `${sp.part.code} 缺料 ${sp.shortage} ${sp.part.unit}`,
        detail: `${sp.part.name} 庫存 ${sp.part.stockOnHand}，需求 ${sp.totalRequired}，淨缺 ${sp.shortage}。供應商交期 ${sp.part.leadDays} 天。`,
        suggestedAction: `立刻向 ${sp.part.code} 供應商下追單；或調整 ${wo.woNo} 開工日 ≥ ${sp.part.leadDays} 天後。`,
        resolved: false,
        createdAt: today,
      });
    }
  }

  // Stage delay & ship-risk
  for (const wo of workOrders) {
    if (wo.status === "done" || wo.status === "cancelled") continue;
    for (const s of wo.stages) {
      if (s.status === "done") continue;
      // Late: planned date passed but no actual yet
      if (s.plannedDate < today && !s.actualDate) {
        out.push({
          id: `al-late-${wo.id}-${s.stage}`,
          woId: wo.id,
          severity: "yellow",
          rule: "late",
          title: `${wo.woNo} ${s.stage} 階段已延遲 ${daysBetween(s.plannedDate, today)} 天`,
          detail: `預計 ${s.plannedDate} 完成，今天 ${today} 仍未達成。`,
          suggestedAction: `查詢卡點：通知 PM 重排後續階段，必要時與客戶協商船期。`,
          resolved: false,
          createdAt: today,
        });
      }
    }

    // Ship risk: today + remaining lead > shipDate
    const shipStage = wo.stages.find((s) => s.stage === "ship");
    if (shipStage && shipStage.status !== "done") {
      const remaining = wo.stages
        .filter((s) => s.status !== "done" && s.seq <= shipStage.seq)
        .reduce((acc) => acc + 1, 0); // simplistic: 1 day per remaining stage as floor
      const buffer = daysBetween(today, wo.shipDate);
      if (buffer < remaining * 2) {
        out.push({
          id: `al-shiprisk-${wo.id}`,
          woId: wo.id,
          severity: buffer < 3 ? "red" : "yellow",
          rule: "ship_risk",
          title: `${wo.woNo} 誤船風險：剩 ${buffer} 天`,
          detail: `客戶 ${wo.customer} 船期 ${wo.shipDate}，尚有 ${remaining} 個階段未完成。`,
          suggestedAction: `加開夜班 / 拆單分批出貨 / 主動與客戶通報。`,
          resolved: false,
          createdAt: today,
        });
      }
    }

    // Quality: any FQC fail rate > 3%
    for (const s of wo.stages) {
      if (s.passQty != null && s.failQty != null) {
        const total = s.passQty + s.failQty;
        if (total > 0 && s.failQty / total > 0.03) {
          out.push({
            id: `al-qa-${wo.id}-${s.stage}`,
            woId: wo.id,
            severity: "red",
            rule: "quality",
            title: `${wo.woNo} ${s.stage} 不良率 ${((s.failQty / total) * 100).toFixed(1)}%`,
            detail: `合格 ${s.passQty} / 不良 ${s.failQty}（門檻 3%）`,
            suggestedAction: `停線檢查、上層升級主管、追料源根因。`,
            resolved: false,
            createdAt: today,
          });
        }
      }
    }
  }

  // Sort: red first, then yellow
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));
}
