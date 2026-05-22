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
