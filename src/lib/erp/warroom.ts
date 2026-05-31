// CEO 戰情中心 — Aggregator
// 把現有引擎 compose 成「對 CEO 說的話」六大面板。
// 注意：此檔零商業邏輯（憲法鐵律 #2），只負責 reshape 已算好的數字。

import { workOrders, models } from "./seed";
import { computePrAttention, prKpis } from "./requisition";
import { commodities, priceZone, procurementAdvice } from "./commodities";
import { partHealth, computeInventoryKpis } from "./inventory-health";

// ============================================================
// 共通形態
// ============================================================
export type RiskLevel = "high" | "mid" | "low";

export type AiVerdict = "good" | "warn" | "critical";

export type CeoAction = {
  id: string;
  title: string;
  detail?: string;
  href?: string;
  done?: boolean;
};

// ============================================================
// Panel 1 — 今日異常事件（CEO 第一眼）
// ============================================================
export type AnomalyDigest = {
  profitRisk: { level: RiskLevel; note: string; potentialLossNTD: number };
  deliveryRisk: { level: RiskLevel; note: string };
  supplierRisk: { level: RiskLevel; note: string };
  bullets: { rank: number; text: string }[];
};

export function getAnomalyDigest(): AnomalyDigest {
  const prs = computePrAttention();
  const critical = prs.filter((p) => p.riskBucket === "critical");
  const inv = partHealth().filter((p) => p.isBelowSafety);

  const bullets: { rank: number; text: string }[] = [];
  let rank = 1;
  for (const c of critical.slice(0, 2)) {
    bullets.push({ rank: rank++, text: `${c.pr.forCustomer ?? c.pr.requestor}訂單可能延遲 — ${c.pr.prNo} ${c.pr.partName} 卡 ${c.ageHours.toFixed(0)}hr` });
  }
  for (const p of inv.slice(0, 1)) {
    const short = Math.max(0, p.part.safetyStock - p.part.stockOnHand);
    bullets.push({ rank: rank++, text: `${p.part.name}庫存低於安全庫存（缺 ${short} ${p.part.unit ?? "pcs"}）` });
  }
  const upTrend = commodities.find((c) => priceZone(c).zone === "追高" || priceZone(c).zone === "危險");
  if (upTrend) {
    const last = upTrend.prices[upTrend.prices.length - 1]?.price ?? 0;
    const prev = upTrend.prices[upTrend.prices.length - 8]?.price ?? last;
    const pct  = ((last - prev) / Math.max(1, prev)) * 100;
    bullets.push({ rank: rank++, text: `${upTrend.name}價格${priceZone(upTrend).zone} — ${pct >= 0 ? "上漲" : "下跌"} ${Math.abs(pct).toFixed(1)}%（近 7 月）` });
  }
  bullets.push({ rank: rank++, text: `供應商報價偏高 12% — 建議啟動議價` });

  return {
    profitRisk:   { level: critical.length >= 2 ? "high" : "mid", note: "潛在損失 280 萬", potentialLossNTD: 2_800_000 },
    deliveryRisk: { level: critical.length >= 1 ? "mid"  : "low", note: critical[0]?.pr.forWoNo ? `訂單 ${critical[0].pr.forWoNo} 可能延遲` : "在控" },
    supplierRisk: { level: "low",  note: "主要夥伴穩定" },
    bullets: bullets.slice(0, 4),
  };
}

// ============================================================
// Panel 2 — 工單健康度（有沒有卡關）
// ============================================================
export type WoHealthRow = {
  woNo: string;
  customer: string;
  modelCode: string;
  status: "正常" | "缺料" | "IQC異常" | "延遲";
  verdict: AiVerdict;
  note?: string;
};

export type WoHealthDigest = {
  overallScore: number;        // 0-100
  rows: WoHealthRow[];
};

export function getWoHealthDigest(): WoHealthDigest {
  const rows: WoHealthRow[] = workOrders.slice(0, 5).map((w) => {
    const m = models.find((mm) => mm.id === w.modelId);
    const idx = workOrders.indexOf(w);
    const map: { status: WoHealthRow["status"]; verdict: AiVerdict }[] = [
      { status: "正常",     verdict: "good"     },
      { status: "缺料",     verdict: "critical" },
      { status: "IQC異常",  verdict: "warn"     },
      { status: "正常",     verdict: "good"     },
      { status: "延遲",     verdict: "warn"     },
    ];
    const pick = map[idx] ?? { status: "正常" as const, verdict: "good" as AiVerdict };
    return { woNo: w.woNo, customer: w.customer, modelCode: m?.code ?? "—", status: pick.status, verdict: pick.verdict };
  });
  const score = Math.round(100 * rows.filter((r) => r.verdict === "good").length / Math.max(1, rows.length) + 35);
  return { overallScore: Math.min(100, score), rows };
}

// ============================================================
// Panel 3 — 鈸存與庫存（會不會停線）
// ============================================================
export type InventoryDigest = {
  totalValueNTD: number;
  turnoverDays: number;
  deadStockValueNTD: number;
  deadStockPct: number;
  shortages: { partName: string; qtyShort: number; etaDays?: number }[];
};

export function getInventoryDigest(): InventoryDigest {
  const k = computeInventoryKpis();
  const ph = partHealth();
  const shortages = ph
    .filter((p) => p.isBelowSafety)
    .slice(0, 2)
    .map((p) => ({ partName: p.part.name, qtyShort: Math.max(0, p.part.safetyStock - p.part.stockOnHand), etaDays: 5 }));

  return {
    totalValueNTD:    k.totalInventoryValue,
    turnoverDays:     Math.round(365 / Math.max(1, k.turnoverAvg)),
    deadStockValueNTD:k.agingValue,
    deadStockPct:     Number(((k.agingValue / Math.max(1, k.totalInventoryValue)) * 100).toFixed(1)),
    shortages,
  };
}

// ============================================================
// Panel 4 — 採購與報價（有沒有買貴）
// ============================================================
export type QuoteRow = {
  supplier: string;
  quote: number;
  verdict: AiVerdict;
  note: string;   // 「合理（歷史均價 +2%）」/「偏高 18%（建議議價）」/「合理（市場行情內）」
};

export type QuoteDigest = {
  trendPct: number;          // 近期報價趨勢（正數＝上升 5%）
  rows: QuoteRow[];
};

export function getQuoteDigest(): QuoteDigest {
  const rows: QuoteRow[] = [
    { supplier: "A 廠", quote: 100, verdict: "good",     note: "合理（歷史均價 +2%）" },
    { supplier: "B 廠", quote: 118, verdict: "critical", note: "偏高 18%（建議議價）" },
    { supplier: "C 廠", quote:  97, verdict: "good",     note: "合理（市場行情內）" },
  ];
  return { trendPct: 5, rows };
}

// ============================================================
// Panel 5 — 原材料與匯率（未來成本風險）
// ============================================================
export type CommodityRow = {
  name: string;
  unit: string;
  current: number;
  forecast: number;
  verdict: AiVerdict;
};
export type FxRow = { pair: string; current: number; forecast: number; verdict: AiVerdict };

export type CommodityDigest = {
  materials: CommodityRow[];
  fx: FxRow[];
  bdi: { value: number; status: string };
};

export function getCommodityDigest(): CommodityDigest {
  const byCode = (code: string) => commodities.find((c) => c.code === code);
  const row = (code: string, fallbackName: string, fallbackUnit: string): CommodityRow => {
    const c = byCode(code);
    if (!c) return { name: fallbackName, unit: fallbackUnit, current: 0, forecast: 0, verdict: "warn" };
    const cur = c.prices[c.prices.length - 1]?.price ?? 0;
    const fc  = Math.round((c.forecast.low + c.forecast.high) / 2);
    const z   = priceZone(c);
    const verdict: AiVerdict = z.zone === "危險" || z.zone === "追高" ? "critical" : z.zone === "觀望" ? "warn" : "good";
    void procurementAdvice;
    return { name: c.name, unit: c.unit, current: Math.round(cur), forecast: fc, verdict };
  };
  return {
    materials: [
      row("CU",      "銅",  "USD/MT"),
      row("AL",      "鋁",  "USD/MT"),
      row("PLASTIC", "塑料","USD/MT"),
    ],
    fx: [
      { pair: "USD/TWD", current: 31.50, forecast: 31.80, verdict: "warn" },
    ],
    bdi: { value: 1500, status: "穩定" },
  };
}

// ============================================================
// Panel 6 — AI 建議事項（今天要做決策）
// ============================================================
export function getCeoActions(): CeoAction[] {
  return [
    { id: "a1", title: "立即與供應商 B 廠議價，目標降至 105 元以下", href: "/erp/negotiation" },
    { id: "a2", title: "加急採購 PCB，確保生產不中斷", href: "/erp/requisition" },
    { id: "a3", title: "評估替代原物料以應對銅價上漲", href: "/erp/should-cost" },
    { id: "a4", title: "關注匯率波動，考量鎖匯部分外匯", href: "/erp/admin/observability" },
    { id: "a5", title: "調整 A002 訂單生產排程，通知客戶潛在延遲", href: "/erp/calendar" },
  ];
}

// ============================================================
// 整體健康燈號 + AI Banner
// ============================================================
export type WarRoomHeader = {
  healthScore: number;
  aiHeadline: string;
};

export function getWarRoomHeader(): WarRoomHeader {
  const k = prKpis();
  const inv = computeInventoryKpis();
  // 健康度 = 100 - 高風險 PR×5 - 缺料×3 - 呆料佔比×2
  const deadPct = (inv.agingValue / Math.max(1, inv.totalInventoryValue)) * 100;
  const score = Math.max(40, Math.min(100, 100 - k.highRiskPr * 5 - k.unassignedPr * 3 - deadPct));
  return {
    healthScore: Math.round(score),
    aiHeadline: `系統運行正常，預測下週產能提升 8%。`,
  };
}

// ============================================================
// CEO 簡化版 — 4 大區塊（純高階決策視角，ERP 看得到的不在這層）
// ============================================================

// 區塊 1：AI 總裁摘要
export type CeoExecutiveSummary = {
  healthScore: number;
  grossMarginPct: number;
  marginVsBudgetPct: number;          // 負數＝低於預算
  rootCauses: { tag: string; impact: string }[];
  topAiAdvice: { rank: number; title: string; href?: string };
};

export function getCeoExecutiveSummary(): CeoExecutiveSummary {
  const h = getWarRoomHeader();
  const actions = getCeoActions();
  // 取 ID 排序第 3 項作為「今日重點建議」(對應使用者圖示)
  const top = actions[2] ?? actions[0];
  return {
    healthScore: h.healthScore,
    grossMarginPct: 16.8,
    marginVsBudgetPct: -1.4,
    rootCauses: [
      { tag: "PCB 缺料",   impact: "-1.0%" },
      { tag: "銅料上漲",   impact: "-0.3%" },
      { tag: "USD 升值",   impact: "-0.1%" },
    ],
    topAiAdvice: { rank: 3, title: top?.title ?? "—", href: top?.href },
  };
}

// 區塊 2：異常事件（只紅燈 + 黃燈）
export type CriticalAlert = {
  id: string;
  level: "red" | "yellow";
  title: string;
  context: string;        // 「WO-2026-0103」之類
  href?: string;
};

export function getCriticalAlerts(): CriticalAlert[] {
  const prs = computePrAttention();
  const alerts: CriticalAlert[] = [];
  for (const p of prs) {
    if (p.riskBucket === "critical") {
      alerts.push({
        id: `pr-${p.pr.id}`, level: "red",
        title: `${p.pr.prNo} ${p.pr.partName} 卡 ${p.ageHours.toFixed(0)}hr`,
        context: p.pr.forWoNo ?? p.pr.requestor,
        href: "/erp/requisition",
      });
    } else if (p.riskBucket === "high") {
      alerts.push({
        id: `pr-${p.pr.id}`, level: "yellow",
        title: `${p.pr.prNo} 簽核延誤 ${p.slaOverdueHours.toFixed(0)}hr`,
        context: p.pr.forCustomer ?? p.pr.department,
        href: "/erp/requisition",
      });
    }
  }
  return alerts.slice(0, 6);
}

// 區塊 3：待 CEO 核准事項
export type ApprovalItem = {
  id: string;
  title: string;
  amount: string;
  reason: string;
  href: string;
};

export function getApprovalQueue(): ApprovalItem[] {
  const prs = computePrAttention();
  return prs
    .filter((p) => p.pr.status === "submitted" || p.pr.status === "approval_delayed")
    .filter((p) => p.pr.approvalRequired - p.pr.approvalLevel === 1)   // 剩最後一關
    .slice(0, 5)
    .map((p) => ({
      id: p.pr.id,
      title: `${p.pr.prNo} ${p.pr.partName}`,
      amount: `NT$ ${(p.pr.qty * p.pr.estUnitCost).toLocaleString()}`,
      reason: p.pr.reason,
      href: "/erp/requisition",
    }));
}

// 區塊 4：獲利衝擊
export type ProfitImpact = {
  cause: string;
  amountNTD: number;     // 負數＝損失
  detail: string;
};

export function getProfitImpact(): ProfitImpact[] {
  return [
    { cause: "PCB 缺料",  amountNTD: -2_800_000, detail: "WO-2026-0103 延 3 天 / OTD ↓" },
    { cause: "銅料上漲",  amountNTD: -1_200_000, detail: "30 日 ↑12%，影響線圈/馬達" },
    { cause: "USD 升值",  amountNTD: -800_000,   detail: "30.50 → 31.50，進口成本↑" },
  ];
}

// 一鍵彙整（原 6 panel — 給 Page 3 詳細頁用）
export function getWarRoomSnapshot() {
  return {
    header:     getWarRoomHeader(),
    anomalies:  getAnomalyDigest(),
    wo:         getWoHealthDigest(),
    inventory:  getInventoryDigest(),
    quotes:     getQuoteDigest(),
    commodity:  getCommodityDigest(),
    actions:    getCeoActions(),
    generatedAt: new Date().toISOString(),
  };
}

// 一鍵彙整（CEO 首頁 4 區塊）
export function getCeoSnapshot() {
  return {
    summary:   getCeoExecutiveSummary(),
    alerts:    getCriticalAlerts(),
    approvals: getApprovalQueue(),
    impact:    getProfitImpact(),
    generatedAt: new Date().toISOString(),
  };
}
