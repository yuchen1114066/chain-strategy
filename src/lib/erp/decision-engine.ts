// Decision Engine — 從 Dashboard 升級到世界級決策引擎
//
// Dashboard 告訴你：發生什麼事。
// Decision Engine 直接告訴你：
//   ① 現在該怎麼做（Action）
//   ② 成本影響多少（Cost Impact）
//   ③ 哪個方案最好（Best Plan）
//   ④ 風險多少（Risk Level）
//
// 這才是世界級。

import { workOrders, models, parts, bom, suppliers, today } from "./seed";
import { forecastAll } from "./otif";
import { computeShortageWall } from "./shortage-ai";
import { equipmentUtilization, criticalPathsAll } from "./critical-path";
import { computeInventoryKpis, partHealth } from "./inventory-health";

export type DecisionAction = {
  id: string;
  category: "shipping" | "shortage" | "capacity" | "inventory" | "supplier";
  urgency: "now" | "today" | "this_week";
  // ① 該怎麼做
  whatToDoNow: string;
  // ② 成本影響
  costImpact: number;        // 增加成本（負面）
  revenueAtRisk: number;     // 守住營收（正面）
  // ③ 最佳方案
  bestPlanCode: "A" | "B" | "C";
  bestPlanTitle: string;
  alternativePlans: { code: "A" | "B" | "C"; title: string; tradeoff: string }[];
  // ④ 風險
  risk: "low" | "med" | "high";
  riskNote: string;
  // 來源
  sourceLabel: string;       // 哪張單 / 哪個料 / 哪台設備
  sourceLink?: string;
  contextLine: string;       // 一句話描述發生什麼
};

// ============================================================
// 主入口：彙整全系統信號 → 產出 Top Decisions
// ============================================================
export function topDecisions(): DecisionAction[] {
  const out: DecisionAction[] = [];

  // ---- 1) 紅燈工單 → 立即決策 ----
  const forecasts = forecastAll();
  for (const f of forecasts.filter((x) => x.light === "red")) {
    const m = models.find((mm) => mm.id === f.wo.modelId);
    const rev = (m?.stdPrice ?? 0) * f.wo.qty;
    const supplierBlamed = f.responsibleSuppliers[0]?.name;
    out.push({
      id: `red-${f.wo.id}`,
      category: "shipping",
      urgency: "now",
      whatToDoNow: f.reason === "supplier_delay" || f.reason === "material_short"
        ? `空運加急 ${f.responsibleSuppliers[0]?.parts[0] ?? "關鍵料"} → 把預測出貨日從 ${f.predictedShipDate} 拉回 ${f.customerRequestDate}`
        : f.reason === "bottleneck"
        ? `${f.bottleneckStage} 工序加班 / 分流 → 釋放 ${-f.slackDays} 天`
        : `延後低毛利訂單，讓本單優先`,
      costImpact: Math.round(rev * 0.05),
      revenueAtRisk: rev,
      bestPlanCode: f.reason === "supplier_delay" || f.reason === "material_short" ? "A" : f.reason === "bottleneck" ? "A" : "B",
      bestPlanTitle: f.reason === "supplier_delay" || f.reason === "material_short" ? "空運加急" : f.reason === "bottleneck" ? "工序分流 / 加班" : "延後低毛利單",
      alternativePlans: [
        { code: "B", title: "延後低毛利訂單", tradeoff: "客戶 OTD 受損" },
        { code: "C", title: `回客戶新交期 ${f.predictedShipDate}`, tradeoff: "客戶可能改下對手" },
      ],
      risk: f.slackDays < -7 ? "high" : "med",
      riskNote: supplierBlamed ? `${supplierBlamed} 拖累 ${-f.slackDays} 天` : `延 ${-f.slackDays} 天`,
      sourceLabel: f.wo.woNo,
      sourceLink: `/erp/work-orders/${f.wo.id}`,
      contextLine: `${f.wo.customer} × ${f.wo.qty} 台　·　預測 ${f.predictedShipDate} 出貨（要求 ${f.customerRequestDate}，延 ${-f.slackDays} 天）`,
    });
  }

  // ---- 2) S/A 級缺料 → 立即決策 ----
  const wall = computeShortageWall();
  for (const r of wall.filter((x) => x.grade === "S" || x.grade === "A")) {
    const rec = r.plans.find((p) => p.recommended) ?? r.plans[0];
    const alt = r.plans.filter((p) => p.code !== rec.code);
    out.push({
      id: `short-${r.part.id}`,
      category: "shortage",
      urgency: r.grade === "S" ? "now" : "today",
      whatToDoNow: rec.title,
      costImpact: rec.costDelta,
      revenueAtRisk: rec.avoidLoss,
      bestPlanCode: rec.code,
      bestPlanTitle: rec.title,
      alternativePlans: alt.map((p) => ({ code: p.code, title: p.title, tradeoff: p.riskNote ?? "" })),
      risk: rec.risk,
      riskNote: `${r.grade} 級缺料　·　停線倒數 ${r.stockoutDays ?? "—"}d`,
      sourceLabel: r.part.code,
      sourceLink: `/erp/shortage-wall`,
      contextLine: `${r.part.name}　·　缺 ${r.shortage} ${r.part.unit}　·　影響 ${r.affectedWos.length} 張單`,
    });
  }

  // ---- 3) 瓶頸設備（92%+） ----
  const equip = equipmentUtilization();
  for (const e of equip.filter((x) => x.riskLevel === "critical")) {
    out.push({
      id: `equip-${e.id}`,
      category: "capacity",
      urgency: "this_week",
      whatToDoNow: `${e.name} 加班 / 分流至其它線　·　評估擴產（${e.stage} 階段）`,
      costImpact: 200_000,
      revenueAtRisk: 5_000_000,
      bestPlanCode: "A",
      bestPlanTitle: "加班 / 分流",
      alternativePlans: [
        { code: "B", title: "延後低毛利單，讓出產能", tradeoff: "客戶不滿" },
        { code: "C", title: "外包該工序", tradeoff: "品質風險、單價上升" },
      ],
      risk: "med",
      riskNote: `${e.name} ${e.utilizationPct}% — ${e.aiVerdict}`,
      sourceLabel: e.name,
      sourceLink: `/erp/work-orders`,
      contextLine: `${e.stage}　·　稼動率 ${e.utilizationPct}%（紅線 92%）`,
    });
  }

  // ---- 4) 庫存健康異常（DOH < 7 / Aging > 180） ----
  const kpis = computeInventoryKpis();
  if (kpis.dohRiskCount > 0) {
    const ph = partHealth().filter((x) => x.doh < 7).sort((a, b) => a.doh - b.doh)[0];
    if (ph) {
      out.push({
        id: `doh-${ph.part.id}`,
        category: "inventory",
        urgency: "today",
        whatToDoNow: `提前下單 ${ph.part.code} ${Math.ceil(ph.part.safetyStock * 2)} ${ph.part.unit} → 把 DOH 拉到 14 天以上`,
        costImpact: Math.round(ph.part.safetyStock * 2 * ph.part.unitCost),
        revenueAtRisk: ph.dailyDemand * 30 * 1000,
        bestPlanCode: "A",
        bestPlanTitle: "提前補貨",
        alternativePlans: [
          { code: "B", title: "找替代料", tradeoff: "需 IQC 驗證" },
          { code: "C", title: "降低生產節奏", tradeoff: "客戶 OTD 受損" },
        ],
        risk: ph.doh < 3 ? "high" : "med",
        riskNote: `DOH ${ph.doh.toFixed(1)} 天 < 安全 7 天`,
        sourceLabel: ph.part.code,
        sourceLink: `/erp/wms`,
        contextLine: `${ph.part.name}　·　可撐 ${ph.doh.toFixed(1)} 天　·　每日需求 ${ph.dailyDemand.toFixed(1)}`,
      });
    }
  }

  // ---- 排序：urgency now > today > week，再按 revenueAtRisk 降冪 ----
  const urgencyRank: Record<DecisionAction["urgency"], number> = { now: 0, today: 1, this_week: 2 };
  out.sort((a, b) => {
    if (urgencyRank[a.urgency] !== urgencyRank[b.urgency]) return urgencyRank[a.urgency] - urgencyRank[b.urgency];
    return b.revenueAtRisk - a.revenueAtRisk;
  });

  return out;
}

// ============================================================
// 全系統 KPI（給戰情室頂部用 — 但都是「告訴你該做什麼」型）
// ============================================================
export type EngineKpi = {
  label: string;
  value: string;
  sub: string;
  actionNow: string;        // 「該做」一句話
  link?: string;
};

export function engineKpis(): EngineKpi[] {
  const forecasts = forecastAll();
  const red = forecasts.filter((f) => f.light === "red").length;
  const wall = computeShortageWall();
  const sCount = wall.filter((x) => x.grade === "S").length;
  const equip = equipmentUtilization();
  const critEquip = equip.filter((x) => x.riskLevel === "critical").length;
  const kpis = computeInventoryKpis();

  return [
    {
      label: "🔴 必延誤工單",
      value: `${red} 張`,
      sub: red > 0 ? "今天必須出決策" : "全綠燈",
      actionNow: red > 0 ? "進「決策閉環中心」拍板方案" : "—",
      link: red > 0 ? "/erp" : undefined,
    },
    {
      label: "🚨 S 級缺料",
      value: `${sCount} 件`,
      sub: sCount > 0 ? "48hr 內停線" : "無 S 級",
      actionNow: sCount > 0 ? "立即下空運 PO 或改替代料" : "—",
      link: "/erp/shortage-wall",
    },
    {
      label: "⚙️ 瓶頸設備",
      value: `${critEquip} 台`,
      sub: critEquip > 0 ? "≥ 92% 塞車風險高" : "稼動率健康",
      actionNow: critEquip > 0 ? "加班 / 分流 / 評估擴產" : "—",
      link: "/erp/work-orders",
    },
    {
      label: "📦 DOH < 7d 料件",
      value: `${kpis.dohRiskCount} 件`,
      sub: kpis.dohRiskCount > 0 ? "庫存撐不過一週" : "庫存充足",
      actionNow: kpis.dohRiskCount > 0 ? "提前下單補貨" : "—",
      link: "/erp/wms",
    },
  ];
}

// keep refs to silence unused warnings if any
void parts; void bom; void suppliers; void today; void criticalPathsAll; void workOrders;
