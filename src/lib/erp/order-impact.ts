// 訂單衝擊模擬器 — Order Impact Simulator
//
// 真正的痛點：客戶端需求波動，傳到生產/採購之前沒有緩衝機制。
// 訂單一波動，系統要立刻算出影響 → 副總 30 秒下決策，不再憑感覺。
//
// 客戶緊急拉單 / 改單時，自動計算 3 件事：
//   ① 物料：現有庫存 + 已下單未到 vs 新交期需求　→ 缺多少
//   ② 產能：現有工單排程下，這張新單塞進去會擠掉誰、均衡誰
//   ③ 三方案推副總：A 加急採購 / B 延後低毛利單 / C 告訴客戶最早能交日

import { workOrders, parts, bom, models, suppliers, today } from "./seed";
import type { Part, WorkOrder } from "./types";

const STAGE_DURATION_DAYS: Record<string, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

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

// ============================================================
// 已下單未到的料（合成）：低於安全庫存的料件 → 假設 PO 已下，半個交期後到
// 對接鼎新 IPSR02「採購進貨明細（未到部分）」可換成實時 PO。
// ============================================================
export type OpenPO = {
  partId: string;
  qty: number;
  etaDate: string;
};

export function syntheticOpenPOs(): OpenPO[] {
  const list: OpenPO[] = [];
  for (const p of parts) {
    if (p.stockOnHand < p.safetyStock && p.kind !== "dummy" && p.kind !== "self") {
      const fillQty = Math.max(p.safetyStock * 2 - p.stockOnHand, p.safetyStock);
      list.push({
        partId: p.id,
        qty: fillQty,
        etaDate: addDays(today, Math.round(p.leadDays * 0.6)),
      });
    }
  }
  return list;
}

// ============================================================
// 衝擊模擬主引擎
// ============================================================
export type SimInput = {
  modelCode: string;
  qty: number;
  newShipDate: string;
  customer?: string;
  isRush?: boolean;
};

export type MaterialImpactLine = {
  part: Part;
  needQty: number;
  stockOnHand: number;
  openPoArriving: number;     // 在 newShipDate 之前能到的 PO 量
  netAvailable: number;       // 庫存 + 能到的 PO
  shortage: number;
  supplier?: string;
  leadDays: number;
  canAirFreight: boolean;     // 空運 ~3 天能來得及嗎
};

export type CapacityImpactStage = {
  stage: string;
  label: string;
  currentLoadDays: number;     // 現有 WO 在此階段佔用人天
  newOrderDemandDays: number;  // 這張新單需要的人天
  capacityDays: number;        // 該階段在 newShipDate 之前的可用人天
  utilizationAfter: number;    // 加入新單後的稼動率 %
  isOverloaded: boolean;
};

export type SqueezedWo = {
  wo: WorkOrder;
  modelCode: string;
  modelName: string;
  margin: number;                // 標準售價（毛利代表）
  shipDate: string;
  reasonToSqueeze: string;
  suggestedDeferDays: number;
  revenueAtRisk: number;
};

export type Plan = {
  code: "A" | "B" | "C";
  title: string;
  oneLiner: string;
  bullets: string[];
  addedCost: number;            // 增加成本
  savedLoss: number;            // 避免損失 / 留住營收
  promiseDate?: string;         // 方案 C 的最早能交日
  risk: "low" | "med" | "high";
  riskNote: string;
  recommended: boolean;
};

export type ImpactResult = {
  input: SimInput;
  daysToNewShip: number;
  feasibilityFromMaterial: "feasible" | "tight" | "infeasible";
  feasibilityFromCapacity: "feasible" | "tight" | "infeasible";
  // 物料分析
  materials: MaterialImpactLine[];
  materialShortageCount: number;
  materialShortageValue: number;
  // 產能分析
  capacity: CapacityImpactStage[];
  capacityBottleneck?: string;
  // 排擠
  squeezed: SqueezedWo[];
  // 三方案
  plans: Plan[];
  // 對副總的一句話結論
  executiveSummary: string;
};

// ============================================================
// 計算單一料件可用量
// ============================================================
function netAvailable(part: Part, byDate: string, openPOs: OpenPO[]): { onHand: number; openArriving: number } {
  const arriving = openPOs
    .filter((po) => po.partId === part.id && po.etaDate <= byDate)
    .reduce((s, po) => s + po.qty, 0);
  return { onHand: part.stockOnHand, openArriving: arriving };
}

// ============================================================
// 主入口
// ============================================================
export function simulateOrderImpact(input: SimInput): ImpactResult {
  const m = models.find((x) => x.code === input.modelCode);
  if (!m) throw new Error(`Model ${input.modelCode} not found`);
  const daysToShip = daysBetween(today, input.newShipDate);
  const openPOs = syntheticOpenPOs();

  // ---- ① 物料分析 ----
  const lines = bom.filter((b) => b.modelId === m.id && b.isActive);
  const materials: MaterialImpactLine[] = lines.map((l) => {
    const p = parts.find((x) => x.id === l.partId)!;
    const need = l.qtyPerUnit * input.qty;
    const { onHand, openArriving } = netAvailable(p, input.newShipDate, openPOs);
    const net = onHand + openArriving;
    const shortage = Math.max(0, need - net);
    const sup = p.supplierId ? suppliers.find((s) => s.id === p.supplierId) : undefined;
    return {
      part: p,
      needQty: need,
      stockOnHand: onHand,
      openPoArriving: openArriving,
      netAvailable: net,
      shortage,
      supplier: sup?.name,
      leadDays: p.leadDays,
      canAirFreight: daysToShip >= 3,
    };
  }).filter((x) => x.needQty > 0)
    .sort((a, b) => b.shortage - a.shortage);

  const matShorts = materials.filter((x) => x.shortage > 0);
  const matShortageValue = matShorts.reduce((s, x) => s + x.shortage * x.part.unitCost, 0);
  const allCanAirFreight = matShorts.every((x) => x.canAirFreight);
  const feasibilityMaterial: ImpactResult["feasibilityFromMaterial"] =
    matShorts.length === 0 ? "feasible" :
    allCanAirFreight ? "tight" : "infeasible";

  // ---- ② 產能分析 ----
  const STAGES_TO_CHECK = ["line", "test", "pack", "ship"] as const;
  const capacity: CapacityImpactStage[] = STAGES_TO_CHECK.map((stage) => {
    // 現有 WO 在此階段的人天負荷（在 newShipDate 之前）
    let curLoad = 0;
    for (const w of workOrders) {
      if (w.status !== "active" && w.status !== "planning") continue;
      const s = w.stages.find((x) => x.stage === stage);
      if (!s || s.status === "done") continue;
      if (w.shipDate <= input.newShipDate) {
        curLoad += (STAGE_DURATION_DAYS[stage] ?? 0) * Math.max(1, w.qty / 50);
      }
    }
    const newDemand = (STAGE_DURATION_DAYS[stage] ?? 0) * Math.max(1, input.qty / 50);
    // 該階段可用人天 = (newShipDate - today) × 1（每天 1 工時當量）
    const capDays = Math.max(1, daysToShip - 14);  // 預留 14 天出貨運輸
    const utilAfter = ((curLoad + newDemand) / capDays) * 100;
    return {
      stage,
      label: { line: "生產", test: "測試", pack: "包裝", ship: "出貨" }[stage],
      currentLoadDays: Math.round(curLoad),
      newOrderDemandDays: Math.round(newDemand * 10) / 10,
      capacityDays: capDays,
      utilizationAfter: Math.round(utilAfter),
      isOverloaded: utilAfter > 100,
    };
  });
  const overloaded = capacity.filter((c) => c.isOverloaded);
  const feasibilityCapacity: ImpactResult["feasibilityFromCapacity"] =
    overloaded.length === 0 ? "feasible" :
    overloaded.length <= 1 ? "tight" : "infeasible";
  const capBottleneck = overloaded.sort((a, b) => b.utilizationAfter - a.utilizationAfter)[0]?.label;

  // ---- ③ 會擠掉誰 ----
  // 找在新交期附近、毛利率最低的活躍 WO（可考慮往後挪）
  const candidates = workOrders.filter((w) => {
    if (w.status !== "active" && w.status !== "planning") return false;
    const d = daysBetween(input.newShipDate, w.shipDate);
    return d >= -7 && d <= 14;
  }).map((w) => {
    const mw = models.find((x) => x.id === w.modelId);
    return { wo: w, model: mw, margin: mw?.stdPrice ?? 0 };
  }).sort((a, b) => a.margin - b.margin);  // 低毛利在前

  const squeezed: SqueezedWo[] = candidates.slice(0, 2).map((c) => ({
    wo: c.wo,
    modelCode: c.model?.code ?? "",
    modelName: c.model?.name ?? "",
    margin: c.margin,
    shipDate: c.wo.shipDate,
    reasonToSqueeze: c.margin < m.stdPrice
      ? `毛利低於本單（$${c.margin.toLocaleString()} vs $${m.stdPrice.toLocaleString()}）`
      : `船期與新單衝突，建議協調延後`,
    suggestedDeferDays: 7,
    revenueAtRisk: c.margin * c.wo.qty,
  }));

  // ---- ④ 三方案 ----
  // 方案 A：加急採購所有短缺料（空運 +30% 成本）
  const planAcost = Math.round(matShortageValue * 0.30);
  const planA: Plan = {
    code: "A",
    title: "加急採購（空運）",
    oneLiner: matShorts.length > 0
      ? `空運 ${matShorts.length} 項短缺料，可如期 ${input.newShipDate} 交`
      : "物料無短缺，可如期交付",
    bullets: matShorts.length > 0 ? [
      `空運 ${matShorts.length} 項料件（${matShorts.slice(0, 3).map((x) => x.part.code).join(" / ")}${matShorts.length > 3 ? " …" : ""}）`,
      `每項 ~3 天到貨（原 ${matShorts[0]?.leadDays} 天）`,
      `成本溢價 +30% ≈ NT$ ${planAcost.toLocaleString()}`,
      `產能：${overloaded.length === 0 ? "充足" : `${capBottleneck}稍緊（${capacity.find((c) => c.label === capBottleneck)?.utilizationAfter}%）`}`,
    ] : [
      "BOM 全料件庫存充足",
      "無需加急、依現有採購節奏即可",
    ],
    addedCost: planAcost,
    savedLoss: m.stdPrice * input.qty,  // 守住本單營收
    risk: matShorts.length > 0 ? (allCanAirFreight ? "low" : "high") : "low",
    riskNote: allCanAirFreight ? "成本可控、進度可掌握" : "部分料件即使空運也來不及，本方案無法達成",
    recommended: false,
  };

  // 方案 B：延後低毛利訂單
  const sq = squeezed[0];
  const planB: Plan = {
    code: "B",
    title: sq ? `延後低毛利訂單 ${sq.wo.woNo}` : "延後低毛利訂單（無候選）",
    oneLiner: sq
      ? `把 ${sq.wo.woNo}（${sq.modelCode}）延後 7 天，把產能/料件讓給本單`
      : "目前無合適延後對象",
    bullets: sq ? [
      `候選工單：${sq.wo.woNo} ${sq.wo.customer}`,
      `機種：${sq.modelCode}（單價 $${sq.margin.toLocaleString()}）vs 本單 $${m.stdPrice.toLocaleString()}`,
      `延後 7 天　·　影響營收 $${(sq.revenueAtRisk / 10000).toFixed(0)} 萬（暫緩非取消）`,
      `本單 ${m.stdPrice * input.qty / 10000} 萬營收可順利達成`,
    ] : [
      "無在 ±7 天內可協調的低毛利單",
      "建議改評估方案 A 或 C",
    ],
    addedCost: 0,
    savedLoss: m.stdPrice * input.qty,
    risk: "med",
    riskNote: sq ? "需業務通知客戶協調延後（OTD 受損）" : "—",
    recommended: false,
  };

  // 方案 C：告訴客戶最早能交日
  const matBlockDays = matShorts.length > 0
    ? (allCanAirFreight ? 3 : Math.max(...matShorts.map((x) => x.leadDays)))
    : 0;
  const capBlockDays = overloaded.length > 0 ? 7 : 0;
  const remainingProdDays = 5 + 2 + 1 + 14;  // line + test + pack + ship
  const earliestPromise = addDays(today, Math.max(matBlockDays, capBlockDays) + remainingProdDays);
  const delayDays = Math.max(0, daysBetween(input.newShipDate, earliestPromise));
  const planC: Plan = {
    code: "C",
    title: "回客戶最早能交日",
    oneLiner: delayDays > 0
      ? `最早 ${earliestPromise} 可交（比客戶要求晚 ${delayDays} 天）`
      : `可如期 ${input.newShipDate} 交付，無需延期`,
    bullets: [
      `最早交付日：${earliestPromise}`,
      delayDays > 0 ? `比客戶要求 ${input.newShipDate} 晚 ${delayDays} 天` : "與客戶要求一致",
      `物料延誤 ${matBlockDays} 天　·　產能延誤 ${capBlockDays} 天`,
      `零成本、零排擠，但需業務協調客戶`,
    ],
    addedCost: 0,
    savedLoss: 0,
    promiseDate: earliestPromise,
    risk: delayDays > 7 ? "high" : delayDays > 0 ? "med" : "low",
    riskNote: delayDays > 0 ? "客戶可能改下單給對手 / 違約金" : "與要求一致，幾乎無風險",
    recommended: false,
  };

  // ---- AI 推薦邏輯 ----
  // 規則：能 A 解決且成本 < 本單營收 20% → 推 A
  //       否則排擠候選有 + 毛利差大 → 推 B
  //       兩者都不行 → 推 C
  const ownRevenue = m.stdPrice * input.qty;
  let rec: "A" | "B" | "C" = "A";
  if (matShorts.length === 0 && overloaded.length === 0) {
    rec = "A";  // 直接接，無壓力
  } else if (planA.risk === "low" && planAcost < ownRevenue * 0.20) {
    rec = "A";
  } else if (sq && sq.margin < m.stdPrice * 0.7) {
    rec = "B";
  } else if (delayDays <= 7) {
    rec = "C";
  } else if (planA.risk !== "high") {
    rec = "A";
  } else {
    rec = "C";
  }
  planA.recommended = rec === "A";
  planB.recommended = rec === "B";
  planC.recommended = rec === "C";

  // ---- 副總一句話結論 ----
  const summary = matShorts.length === 0 && overloaded.length === 0
    ? `✅ 接得下。${input.modelCode} × ${input.qty} 台可如期 ${input.newShipDate} 交付，無壓力。`
    : feasibilityMaterial === "infeasible"
    ? `🚨 接不下原訂日。物料缺 ${matShorts.length} 項即使空運也來不及；建議方案 ${rec}。`
    : feasibilityCapacity === "infeasible"
    ? `🟡 產能擠不下。${capBottleneck} 已 ${overloaded[0]?.utilizationAfter}% 超載；建議方案 ${rec}。`
    : `🟡 可接但需動作：物料缺 ${matShorts.length} 項 / 產能 ${overloaded.length} 站偏緊。AI 推薦方案 ${rec}。`;

  return {
    input,
    daysToNewShip: daysToShip,
    feasibilityFromMaterial: feasibilityMaterial,
    feasibilityFromCapacity: feasibilityCapacity,
    materials,
    materialShortageCount: matShorts.length,
    materialShortageValue: matShortageValue,
    capacity,
    capacityBottleneck: capBottleneck,
    squeezed,
    plans: [planA, planB, planC],
    executiveSummary: summary,
  };
}
