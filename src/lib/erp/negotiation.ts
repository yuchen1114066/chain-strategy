// AI 議價引擎 — 世界級採購核心
// 對應使用者提供的 negotiation_strategy 邏輯 + 6 項 AI 分析
//   歷史成交價 / 國際行情(LME) / 匯率 / 供應商毛利估算 / 市場缺料 / 競爭供應商

import { parts, suppliers } from "./seed";
import { computePartDemand } from "./alerts";
import { commodities, spc } from "./commodities";
import type { Part, Supplier } from "./types";

export type NegotiationStrategy =
  | "STRONG NEGOTIATION"   // 強力議價（報價明顯偏高）
  | "LOCK SUPPLY"          // 鎖定供應（需求高，優先保供）
  | "NORMAL NEGOTIATION";  // 常規議價

export type DemandLevel = "HIGH" | "MEDIUM" | "LOW";

export type NegotiationRow = {
  part: Part;
  supplier?: Supplier;
  supplierPrice: number;     // 供應商報價（= 現行單價）
  marketPrice: number;       // 市場參考價（國際行情 + 毛利推算）
  gapPct: number;            // (報價 − 市場價)/市場價 × 100 = 可議空間
  demandLevel: DemandLevel;
  estMargin: number;         // 供應商毛利估算 %（AI 估算）
  commodity?: string;        // 連動國際原物料
  commodityDevPct: number;   // 該原物料現價偏離均價 %
  shortageHeat: number;      // 市場缺料熱度 0~100
  altSuppliers: number;      // 競爭供應商數（同分類）
  strategy: NegotiationStrategy;
  potentialSaving: number;   // 議到市場價可省（在庫 + 本期需求量計）
};

// 分類 → 連動國際原物料
const CATEGORY_COMMODITY: Record<string, string> = {
  鋼架: "STEEL", 框架: "STEEL", 軸件: "STEEL", 鐵心: "IRON",
  飛輪: "AL", 鋁件: "AL", 踏板: "AL", 套件: "AL",
  線圈: "CU", 電線: "CU", 馬達: "CU", 電氣: "CU", 磁件: "IRON",
};

// 確定性「供應商毛利估算」%（依品號 hash，10~28%）
function estimateMargin(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % 1000;
  return 10 + (h % 19); // 10~28%
}

const NORMAL_MARGIN = 15; // 視為合理毛利水位

export function computeNegotiation(): NegotiationRow[] {
  const demand = computePartDemand();
  const demandMap = new Map(demand.map((d) => [d.part.id, d]));

  // 各原物料現價偏離均價
  const commodityDev = new Map<string, number>();
  for (const c of commodities) {
    const s = spc(c);
    commodityDev.set(c.code, ((s.latest - s.mean) / s.mean) * 100);
  }

  // 分類 → 供應該分類的不同供應商數（競爭供應商代理指標）
  const catSuppliers = new Map<string, Set<string>>();
  for (const p of parts) {
    if (!p.supplierId) continue;
    const set = catSuppliers.get(p.category) ?? new Set<string>();
    set.add(p.supplierId);
    catSuppliers.set(p.category, set);
  }

  const rows: NegotiationRow[] = [];
  for (const p of parts) {
    if (p.kind === "self" || p.kind === "dummy" || p.kind === "feature") continue; // 只議採購件
    const sup = suppliers.find((s) => s.id === p.supplierId);
    const supplierPrice = p.unitCost;
    if (supplierPrice <= 0) continue;

    const d = demandMap.get(p.id);
    const required = d?.totalRequired ?? 0;
    const shortage = d?.shortage ?? 0;
    const demandLevel: DemandLevel =
      shortage > 0 || required > 200 ? "HIGH" : required > 0 ? "MEDIUM" : "LOW";

    const estMargin = estimateMargin(p.code);
    const commodityCode = CATEGORY_COMMODITY[p.category];
    const cDev = commodityCode ? (commodityDev.get(commodityCode) ?? 0) : 0;

    // 可議空間 = 毛利超出合理水位 + 原物料降幅（行情跌但報價沒跌 → 可砍）
    const marginExcess = Math.max(0, estMargin - NORMAL_MARGIN);
    const commodityRoom = cDev < 0 ? -cDev * 0.5 : 0; // 行情下跌的一半反映進議價空間
    const gapPct = Math.round((marginExcess + commodityRoom) * 10) / 10;
    const marketPrice = Math.round(supplierPrice * (1 - gapPct / 100) * 100) / 100;

    const shortageHeat = required > 0 ? Math.min(100, Math.round((shortage / required) * 100)) : 0;
    const altSuppliers = Math.max(0, (catSuppliers.get(p.category)?.size ?? 1) - 1);

    // negotiation_strategy（依使用者提供邏輯，gap 改用百分比）
    let strategy: NegotiationStrategy;
    if (gapPct > 5) strategy = "STRONG NEGOTIATION";
    else if (demandLevel === "HIGH") strategy = "LOCK SUPPLY";
    else strategy = "NORMAL NEGOTIATION";

    const volume = p.stockOnHand + required;
    const potentialSaving = Math.round((supplierPrice - marketPrice) * volume);

    rows.push({
      part: p, supplier: sup, supplierPrice, marketPrice, gapPct,
      demandLevel, estMargin, commodity: commodityCode, commodityDevPct: Math.round(cDev * 10) / 10,
      shortageHeat, altSuppliers, strategy, potentialSaving,
    });
  }
  // 排序：可省金額大者優先
  return rows.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

// ============================================================
// Should-Cost 拆解模型（世界級議價引擎核心）
//
// AI 不是接受對方說「我們漲 18%」就算了，而是拆解出每一塊應該佔多少：
//   原料 / 加工 / 表處 / 包裝 / 運費 / 利潤
// 拿成本拆解 vs 對方喊價 → 直接判斷漲價是否合理。
// ============================================================
export type CostBreakdown = {
  raw: number;        // 原料 %
  process: number;    // 加工 %
  surface: number;    // 表處 %
  packaging: number;  // 包裝 %
  freight: number;    // 運費 %
  margin: number;     // 利潤 %
};

// 不同類別零件的成本結構（業界經驗值）
const COST_PROFILE: Record<string, CostBreakdown> = {
  "鋁件":   { raw: 42, process: 31, surface: 12, packaging: 3, freight: 7, margin: 5 },
  "鋼架":   { raw: 38, process: 28, surface: 15, packaging: 4, freight: 9, margin: 6 },
  "框架":   { raw: 40, process: 28, surface: 13, packaging: 4, freight: 8, margin: 7 },
  "軸件":   { raw: 35, process: 38, surface: 8,  packaging: 3, freight: 8, margin: 8 },
  "飛輪":   { raw: 55, process: 22, surface: 8,  packaging: 3, freight: 6, margin: 6 },
  "踏板":   { raw: 45, process: 25, surface: 12, packaging: 3, freight: 7, margin: 8 },
  "套件":   { raw: 50, process: 22, surface: 10, packaging: 4, freight: 7, margin: 7 },
  "鐵心":   { raw: 60, process: 18, surface: 5,  packaging: 3, freight: 6, margin: 8 },
  "磁件":   { raw: 65, process: 15, surface: 5,  packaging: 3, freight: 5, margin: 7 },
  "線圈":   { raw: 58, process: 22, surface: 4,  packaging: 3, freight: 5, margin: 8 },
  "電線":   { raw: 62, process: 20, surface: 3,  packaging: 3, freight: 5, margin: 7 },
  "馬達":   { raw: 48, process: 26, surface: 6,  packaging: 4, freight: 7, margin: 9 },
  "電氣":   { raw: 40, process: 30, surface: 6,  packaging: 5, freight: 9, margin: 10 },
  "塑膠件": { raw: 50, process: 28, surface: 6,  packaging: 4, freight: 7, margin: 5 },
  "包裝":   { raw: 45, process: 20, surface: 3,  packaging: 18, freight: 9, margin: 5 },
  "外殼":   { raw: 47, process: 25, surface: 12, packaging: 4, freight: 8, margin: 4 },
  "控制板": { raw: 55, process: 25, surface: 4,  packaging: 4, freight: 4, margin: 8 },
  "顯示器": { raw: 60, process: 20, surface: 5,  packaging: 4, freight: 4, margin: 7 },
  "感測器": { raw: 50, process: 28, surface: 4,  packaging: 4, freight: 6, margin: 8 },
};
const COST_DEFAULT: CostBreakdown = { raw: 45, process: 28, surface: 8, packaging: 4, freight: 8, margin: 7 };

export function costBreakdownFor(category: string): CostBreakdown {
  return COST_PROFILE[category] ?? COST_DEFAULT;
}

// ============================================================
// AI 漲價合理性判斷
//   輸入：供應商說漲 X%
//   計算：依成本拆解 + 各成分當前波動（原料/工資/匯率/運費）
//   輸出：合理漲幅區間 / 超出多少 / AI 建議
// ============================================================
export type PriceHikeAnalysis = {
  partCode: string;
  category: string;
  breakdown: CostBreakdown;
  components: {
    label: string;
    weight: number;        // 佔成本 %
    deltaPct: number;       // 該成分當前漲幅 %（從外部數據算）
    contribution: number;    // weight × deltaPct / 100 = 對總價貢獻 %
    source: string;
  }[];
  proposedHikePct: number;       // 供應商喊漲
  reasonableLowPct: number;       // 合理下限
  reasonableHighPct: number;      // 合理上限
  excessPct: number;              // 超出合理上限 = proposedHike - reasonableHigh
  verdict: "fair" | "high" | "extreme";
  aiRecommendation: string;
  talkingPoints: string[];
};

// 模擬目前各成分外部波動（demo；正式版串國際數據）
function currentComponentDeltas() {
  const cu = spc(commodities.find((c) => c.code === "CU")!);
  const al = spc(commodities.find((c) => c.code === "AL")!);
  const steel = spc(commodities.find((c) => c.code === "STEEL")!);
  const plastic = spc(commodities.find((c) => c.code === "PLASTIC")!);
  const cuDev = ((cu.latest - cu.mean) / cu.mean) * 100;
  const alDev = ((al.latest - al.mean) / al.mean) * 100;
  const stDev = ((steel.latest - steel.mean) / steel.mean) * 100;
  const plDev = ((plastic.latest - plastic.mean) / plastic.mean) * 100;
  // 工資漲幅 demo（年化）+ 匯率變動 + 運費
  return {
    rawByCategory: (cat: string): { pct: number; source: string } => {
      if (["線圈", "電線", "馬達", "電氣"].includes(cat))
        return { pct: cuDev, source: "LME Copper" };
      if (["鋁件", "飛輪", "框架", "踏板"].includes(cat))
        return { pct: alDev, source: "LME Aluminium" };
      if (["鋼架", "軸件", "鐵心", "磁件"].includes(cat))
        return { pct: stDev, source: "中鋼 HRC" };
      if (["塑膠件", "包裝", "外殼"].includes(cat))
        return { pct: plDev, source: "Brent Oil-linked" };
      return { pct: 4, source: "市場綜合" };
    },
    process: { pct: 2.0, source: "台灣製造業最低工資 2% 調整" },
    surface: { pct: 3.5, source: "電力/化學品上漲" },
    packaging: { pct: plDev * 0.6, source: "塑料間接" },
    freight: { pct: 5.0, source: "BDI / 紅海繞行加成" },
    fx: { pct: 1.5, source: "新台幣 vs 美元 30 日變動" },
  };
}

export function analyzePriceHike(category: string, proposedHikePct: number): PriceHikeAnalysis {
  const bd = costBreakdownFor(category);
  const deltas = currentComponentDeltas();
  const rawDelta = deltas.rawByCategory(category);

  const components = [
    { label: "原料",  weight: bd.raw,       deltaPct: rawDelta.pct,   contribution: 0, source: rawDelta.source },
    { label: "加工",  weight: bd.process,   deltaPct: deltas.process.pct,   contribution: 0, source: deltas.process.source },
    { label: "表處",  weight: bd.surface,   deltaPct: deltas.surface.pct,   contribution: 0, source: deltas.surface.source },
    { label: "包裝",  weight: bd.packaging, deltaPct: deltas.packaging.pct, contribution: 0, source: deltas.packaging.source },
    { label: "運費",  weight: bd.freight,   deltaPct: deltas.freight.pct,   contribution: 0, source: deltas.freight.source },
    { label: "匯率",  weight: 100,           deltaPct: deltas.fx.pct,        contribution: 0, source: deltas.fx.source },
  ];
  // 對總價貢獻（weight × delta / 100）— 匯率對全部 100% 計
  components.forEach((c) => {
    if (c.label === "匯率") c.contribution = (deltas.fx.pct * 1.0);  // 假設買賣同幣別 → 全額影響
    else c.contribution = (c.weight * c.deltaPct) / 100;
    c.contribution = Math.round(c.contribution * 100) / 100;
  });

  // 合理漲幅 = sum(正向 contribution)；給上下緣 ±30%
  const positive = components.filter((c) => c.contribution > 0);
  const reasonable = positive.reduce((s, c) => s + c.contribution, 0);
  const reasonableLow = Math.max(0, reasonable * 0.7);
  const reasonableHigh = reasonable * 1.3;
  const excess = Math.max(0, proposedHikePct - reasonableHigh);
  const verdict: PriceHikeAnalysis["verdict"] =
    excess <= 0 ? "fair" : excess <= reasonableHigh * 0.5 ? "high" : "extreme";

  let recommendation: string;
  if (verdict === "fair") {
    recommendation = `合理範圍內（${reasonableLow.toFixed(1)}% ~ ${reasonableHigh.toFixed(1)}%）— 可接受，但建議要求說明`;
  } else if (verdict === "high") {
    recommendation = `超出合理上限 ${excess.toFixed(1)}% — 要求重新議價，目標壓回 ${reasonableHigh.toFixed(1)}%`;
  } else {
    recommendation = `🚨 超出合理上限 ${excess.toFixed(1)}% — 強力議價、引述成本拆解、並準備備援供應商`;
  }

  const talkingPoints: string[] = [
    `依您類別「${category}」的成本結構，原料只佔 ${bd.raw}%`,
    ...positive.slice(0, 3).map((c) =>
      `${c.label}（佔 ${c.weight}%）目前變動 ${c.deltaPct >= 0 ? "+" : ""}${c.deltaPct.toFixed(1)}%，對總價貢獻 ${c.contribution >= 0 ? "+" : ""}${c.contribution.toFixed(1)}%（來源：${c.source}）`),
    `加總得合理漲幅 ${reasonableLow.toFixed(1)}% ~ ${reasonableHigh.toFixed(1)}%`,
    proposedHikePct > reasonableHigh
      ? `您喊漲 ${proposedHikePct}% 超出 ${excess.toFixed(1)}% — 請說明這部分的理由`
      : `您喊漲 ${proposedHikePct}% 在合理範圍`,
  ];

  return {
    partCode: "",
    category,
    breakdown: bd,
    components,
    proposedHikePct,
    reasonableLowPct: Math.round(reasonableLow * 10) / 10,
    reasonableHighPct: Math.round(reasonableHigh * 10) / 10,
    excessPct: Math.round(excess * 10) / 10,
    verdict,
    aiRecommendation: recommendation,
    talkingPoints,
  };
}
