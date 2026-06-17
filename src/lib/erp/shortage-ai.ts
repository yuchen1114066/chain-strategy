// 缺料風險分級 + AI 自動推薦方案
//   分級   定義
//   S      48hr 內停線（最緊急，趕不上）
//   A      3 天內缺料
//   B      7 天內缺料
//   C      14 天內缺料
//
// AI 自動為每個缺料件生成 3 個方案（A/B/C），含「增加成本」「避免損失」「風險」等決策數字。

import { workOrders, parts, models, suppliers, bom, today } from "./seed";
import { computePartDemand } from "./alerts";
import type { Part, WorkOrder } from "./types";

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export type ShortageGrade = "S" | "A" | "B" | "C" | "—";

export type ShortagePlan = {
  code: "A" | "B" | "C";
  title: string;
  bullets: string[];
  costDelta: number;          // 增加成本（NTD）
  avoidLoss: number;          // 避免損失（NTD，停線損失）
  risk: "low" | "med" | "high";
  riskNote?: string;
  recommended?: boolean;
};

export type ShortageRow = {
  part: Part;
  supplier?: { id: string; name: string };
  shortage: number;
  totalRequired: number;
  affectedWos: WorkOrder[];
  affectedQty: number;
  stockoutDays: number | null;   // 距最緊迫工單算料日剩 N 天
  canMakeIt: boolean;            // 採料趕得上嗎
  grade: ShortageGrade;          // S/A/B/C
  plans: ShortagePlan[];         // AI 三方案
  recommendedCode: "A" | "B" | "C";
};

function gradeOf(stockoutDays: number | null, canMakeIt: boolean): ShortageGrade {
  if (stockoutDays == null) return "—";
  if (stockoutDays < 0 || (!canMakeIt && stockoutDays <= 2)) return "S";
  if (stockoutDays <= 3) return "A";
  if (stockoutDays <= 7) return "B";
  if (stockoutDays <= 14) return "C";
  return "—";
}

function fmtParts(n: number): string {
  return `${n.toLocaleString()}`;
}

// 為單一缺料件產生 AI 三方案
function buildPlans(
  p: Part,
  supplier: { id: string; name: string } | undefined,
  shortage: number,
  affectedWos: WorkOrder[],
  stockoutDays: number | null,
): { plans: ShortagePlan[]; recommended: "A" | "B" | "C" } {
  // 影響產值 = 缺料拖累的工單金額
  const affectedValue = affectedWos.reduce((s, w) => {
    const m = models.find((m) => m.id === w.modelId);
    return s + (m ? m.stdPrice * w.qty : 0);
  }, 0);

  // 方案 A：空運加急 — 把交期從 leadDays 壓到 ~3 天，單價多 30%
  const airFreightUplift = Math.round(p.unitCost * shortage * 0.30);
  const planA: ShortagePlan = {
    code: "A",
    title: `空運加急 ${fmtParts(shortage)} ${p.unit}`,
    bullets: [
      `供應商：${supplier?.name ?? "—"}`,
      `空運交期 ~3 天（原 ${p.leadDays} 天）`,
      `料件成本 +30% ≈ +${airFreightUplift.toLocaleString()} 元`,
    ],
    costDelta: airFreightUplift,
    avoidLoss: affectedValue,
    risk: "low",
    riskNote: "成本可控、進度可掌握",
  };

  // 方案 B：改用替代料（同類別其他料件）
  const alts = parts.filter((x) =>
    x.id !== p.id &&
    x.category === p.category &&
    x.stockOnHand >= shortage &&
    x.kind !== "dummy"
  );
  const alt = alts[0];
  const planB: ShortagePlan = alt
    ? {
        code: "B",
        title: `改用替代料 ${alt.code}`,
        bullets: [
          `料件：${alt.name}（庫存 ${alt.stockOnHand} ${alt.unit}）`,
          `成本差 ${alt.unitCost >= p.unitCost ? "+" : ""}${((alt.unitCost - p.unitCost) * shortage).toLocaleString()} 元`,
          `風險：品質 / 互換性待驗證`,
        ],
        costDelta: Math.max(0, (alt.unitCost - p.unitCost) * shortage),
        avoidLoss: affectedValue,
        risk: "high",
        riskNote: "需 IQC 驗證、客戶可能要求工程變更通知",
      }
    : {
        code: "B",
        title: "改用替代料（無同類庫存）",
        bullets: [
          `同類別 ${p.category} 無可用替代料`,
          `可考慮工程變更通知客戶 / 找新供應商試樣`,
        ],
        costDelta: 0,
        avoidLoss: affectedValue,
        risk: "high",
        riskNote: "需重新打樣 + 客戶確認，通常 ≥ 30 天",
      };

  // 方案 C：延後低毛利訂單，優先高毛利客戶
  const woWithMargin = affectedWos.map((w) => {
    const m = models.find((m) => m.id === w.modelId);
    return { wo: w, margin: m?.stdPrice ?? 0 };
  }).sort((a, b) => b.margin - a.margin);
  const top = woWithMargin[0];
  const bottom = woWithMargin[woWithMargin.length - 1];
  const planC: ShortagePlan = {
    code: "C",
    title: "延後低毛利訂單，優先高毛利客戶",
    bullets: top && bottom && top.wo.id !== bottom.wo.id ? [
      `優先：${top.wo.woNo} ${top.wo.customer}（單價 ${top.margin.toLocaleString()}）`,
      `延後：${bottom.wo.woNo} ${bottom.wo.customer}（單價 ${bottom.margin.toLocaleString()}）`,
      `先把現有料給高毛利單，低毛利改下批交`,
    ] : [
      `影響工單 ${affectedWos.length} 張，需業務與客戶協調延後`,
      `若客戶可接受延後 ≥ 7 天，本方案零成本`,
      `風險：客戶 OTD 受損 / 違約金可能`,
    ],
    costDelta: 0,
    avoidLoss: bottom ? bottom.margin * (bottom.wo.qty ?? 0) : 0,
    risk: "med",
    riskNote: "需業務+客戶協調延後（OTD 受損）",
  };

  // AI 推薦邏輯：S/A 級且影響產值高 → 空運；無替代料 → 還是空運；產值低 → 延後
  let recommended: "A" | "B" | "C" = "A";
  if (stockoutDays != null && stockoutDays <= 3 && airFreightUplift < affectedValue * 0.2) {
    recommended = "A";
  } else if (alt && airFreightUplift > affectedValue * 0.3) {
    recommended = "B";
  } else if (affectedWos.length >= 2 && stockoutDays != null && stockoutDays > 3) {
    recommended = "C";
  }
  planA.recommended = recommended === "A";
  planB.recommended = recommended === "B";
  planC.recommended = recommended === "C";

  return { plans: [planA, planB, planC], recommended };
}

export function computeShortageWall(): ShortageRow[] {
  const demand = computePartDemand();
  const rows: ShortageRow[] = [];
  for (const d of demand) {
    if (d.shortage <= 0) continue;
    const p = d.part;
    const sup = p.supplierId ? suppliers.find((s) => s.id === p.supplierId) : undefined;
    const affectedWos = workOrders.filter((w) => {
      if (w.status !== "active" && w.status !== "planning") return false;
      return bom.some((b) => b.modelId === w.modelId && b.partId === p.id && b.isActive);
    });
    const affectedQty = affectedWos.reduce((s, w) => s + w.qty, 0);
    let stockoutDays: number | null = null;
    for (const w of affectedWos) {
      const mat = w.stages.find((s) => s.stage === "material");
      const d2 = mat ? daysBetween(today, mat.plannedDate) : daysBetween(today, w.shipDate);
      if (stockoutDays == null || d2 < stockoutDays) stockoutDays = d2;
    }
    const canMakeIt = stockoutDays != null ? p.leadDays <= stockoutDays : true;
    const grade = gradeOf(stockoutDays, canMakeIt);
    const { plans, recommended } = buildPlans(p, sup ? { id: sup.id, name: sup.name } : undefined, d.shortage, affectedWos, stockoutDays);
    rows.push({
      part: p,
      supplier: sup ? { id: sup.id, name: sup.name } : undefined,
      shortage: d.shortage,
      totalRequired: d.totalRequired,
      affectedWos,
      affectedQty,
      stockoutDays,
      canMakeIt,
      grade,
      plans,
      recommendedCode: recommended,
    });
  }
  // 排序：S > A > B > C > —，同級依停線倒數升序
  const ord: Record<ShortageGrade, number> = { S: 0, A: 1, B: 2, C: 3, "—": 4 };
  rows.sort((a, b) => {
    if (ord[a.grade] !== ord[b.grade]) return ord[a.grade] - ord[b.grade];
    return (a.stockoutDays ?? 9999) - (b.stockoutDays ?? 9999);
  });
  return rows;
}

export function gradeStats(rows: ShortageRow[]): Record<ShortageGrade, number> {
  const r: Record<ShortageGrade, number> = { S: 0, A: 0, B: 0, C: 0, "—": 0 };
  for (const x of rows) r[x.grade] += 1;
  return r;
}
