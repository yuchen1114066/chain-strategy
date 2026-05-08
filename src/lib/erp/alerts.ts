// Alert engine — pure functions over seed data.
// 升級重點：從「事後延遲」進化為「事前預測」
//   ① shortage_forecast: 比對開工日 vs 供應商交期，預測開工前是否會缺
//   ② late_forecast:     依殘餘階段工時，預測會不會誤船
//   ③ shortage / late / quality: 已發生的事實警訊（紅燈）

import type { Alert, Part } from "./types";
import { bom, parts, models, workOrders, today } from "./seed";
import { STAGES } from "./types";

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

export type PartDemand = {
  part: Part;
  totalRequired: number;
  netBalance: number;
  shortage: number;
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

  // (1) 已缺料 — 紅燈
  for (const sp of demand.filter((d) => d.shortage > 0)) {
    const woSet = new Set(sp.contributingWos.map((c) => c.woNo));
    for (const woNo of woSet) {
      const wo = workOrders.find((w) => w.woNo === woNo);
      if (!wo) continue;
      out.push({
        id: `al-short-${sp.part.id}-${wo.id}`,
        woId: wo.id,
        severity: "red",
        rule: "shortage",
        title: `${sp.part.code} 已缺 ${sp.shortage} ${sp.part.unit}`,
        detail: `${sp.part.name} 庫存 ${sp.part.stockOnHand}，總需求 ${sp.totalRequired}，淨缺 ${sp.shortage}。供應商交期 ${sp.part.leadDays} 天。`,
        suggestedAction: `立刻向 ${sp.part.code} 供應商下追單；或將 ${wo.woNo} 開工日延後 ≥ ${sp.part.leadDays} 天。`,
        resolved: false,
        createdAt: today,
      });
    }
  }

  // (2) 預測缺料 — 黃燈
  // 對每張未開工的 WO，比對「algan 階段預計日 - 今天」 vs 各零件交期
  for (const wo of workOrders) {
    if (wo.status === "done" || wo.status === "cancelled") continue;
    const matStage = wo.stages.find((s) => s.stage === "material");
    if (!matStage || matStage.status === "done") continue;
    const daysToMaterial = daysBetween(today, matStage.plannedDate);
    const lines = bom.filter((b) => b.modelId === wo.modelId && b.isActive);
    for (const line of lines) {
      const part = parts.find((p) => p.id === line.partId);
      if (!part) continue;
      const needed = line.qtyPerUnit * wo.qty;
      // 排除已經是「已缺」狀態，避免重複
      const d = demand.find((x) => x.part.id === part.id);
      if (d && d.shortage > 0) continue;
      const reorderNeeded = part.stockOnHand < needed + part.safetyStock;
      const tooLate = part.leadDays > daysToMaterial;
      if (reorderNeeded && tooLate) {
        out.push({
          id: `al-shortf-${part.id}-${wo.id}`,
          woId: wo.id,
          severity: "yellow",
          rule: "shortage_forecast",
          title: `預測 ${part.code} 將不及 ${wo.woNo} 開工`,
          detail: `本單需 ${needed} ${part.unit}，目前庫存 ${part.stockOnHand}。供應商交期 ${part.leadDays}d > 距離開工 ${daysToMaterial}d。`,
          suggestedAction: `今天就下單給 ${part.code} 供應商，否則 ${wo.woNo} 開工會卡。`,
          resolved: false,
          createdAt: today,
        });
      }
    }
  }

  // (3) 階段已延遲 — 紅燈
  for (const wo of workOrders) {
    if (wo.status === "done" || wo.status === "cancelled") continue;
    for (const s of wo.stages) {
      if (s.status === "done") continue;
      if (s.plannedDate < today && !s.actualDate) {
        out.push({
          id: `al-late-${wo.id}-${s.stage}`,
          woId: wo.id,
          severity: "red",
          rule: "late",
          title: `${wo.woNo} ${stageName(s.stage)} 已延遲 ${daysBetween(s.plannedDate, today)} 天`,
          detail: `預計 ${s.plannedDate} 完成，今天 ${today} 仍未達成。`,
          suggestedAction: `查詢卡點：通知 PM 重排後續階段，必要時與客戶協商船期。`,
          resolved: false,
          createdAt: today,
        });
      }
    }

    // (4) 預測會延遲 — 黃燈
    // 殘餘階段加總工時 vs 距離出貨
    const incompleteStages = wo.stages.filter((s) => s.status !== "done" && s.seq <= 7);
    const remainingDays = incompleteStages.reduce((acc, s) => {
      // crude estimate: pack=1, test=2, line=5, iqc=2, arrival=0, material=30, ship=14
      const dur: Record<string, number> = { material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0 };
      return acc + (dur[s.stage] ?? 1);
    }, 0);
    const buffer = daysBetween(today, wo.shipDate);
    if (incompleteStages.length > 0 && buffer >= 0 && buffer < remainingDays) {
      out.push({
        id: `al-latef-${wo.id}`,
        woId: wo.id,
        severity: buffer < 7 ? "red" : "yellow",
        rule: "late_forecast",
        title: `${wo.woNo} 預測誤船：殘餘 ${remainingDays}d > 剩餘 ${buffer}d`,
        detail: `客戶 ${wo.customer} 船期 ${wo.shipDate}，按目前進度需 ${remainingDays} 天才走得完。`,
        suggestedAction: `加開夜班 / 拆單分批出貨 / 主動與客戶通報順延。`,
        resolved: false,
        createdAt: today,
      });
    }

    // (5) 誤船倒數
    const shipStage = wo.stages.find((s) => s.stage === "ship");
    if (shipStage && shipStage.status !== "done") {
      const buf = daysBetween(today, wo.shipDate);
      if (buf >= 0 && buf <= 7) {
        out.push({
          id: `al-shiprisk-${wo.id}`,
          woId: wo.id,
          severity: "red",
          rule: "ship_risk",
          title: `${wo.woNo} 距離船期僅剩 ${buf} 天`,
          detail: `${wo.customer} 船期 ${wo.shipDate}，目前在「${stageName(shipStage.stage)}」前的階段。`,
          suggestedAction: `立刻和業務確認船公司艙位 / 客戶調整接收計畫。`,
          resolved: false,
          createdAt: today,
        });
      }
    }

    // (6) 品質
    for (const s of wo.stages) {
      if (s.passQty != null && s.failQty != null) {
        const total = s.passQty + s.failQty;
        if (total > 0 && s.failQty / total > 0.03) {
          out.push({
            id: `al-qa-${wo.id}-${s.stage}`,
            woId: wo.id,
            severity: "red",
            rule: "quality",
            title: `${wo.woNo} ${stageName(s.stage)} 不良率 ${((s.failQty / total) * 100).toFixed(1)}%`,
            detail: `合格 ${s.passQty} / 不良 ${s.failQty}（門檻 3%）`,
            suggestedAction: `停線檢查、上層升級主管、追料源根因。`,
            resolved: false,
            createdAt: today,
          });
        }
      }
    }
  }

  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));
}

function stageName(key: string): string {
  return STAGES.find((s) => s.key === key)?.label ?? key;
}
