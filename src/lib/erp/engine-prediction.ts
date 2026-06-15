// Engine 3 — Prediction Engine（預測引擎）
//
// 真正 Supply Chain OS 的靈魂：不是看現在，而是預測未來。
//
// 6 種預測：
//   ETA Prediction       準交         — 每張 PO 準時到貨機率
//   Delay Prediction     防停線       — 哪些工單會延誤
//   Cost Prediction      控成本       — 未來 60 天成本壓力
//   Demand Prediction    備料         — 未來 N 天料件需求
//   Capacity Prediction  排程         — 未來產能瓶頸
//   Supplier Risk        風險         — 哪家供應商風險上升中
//
// 系統不只告訴你發生什麼，而是直接推薦最佳方案。

import { forecastAll } from "./otif";
import { etaForecastAll } from "./eta-forecast";
import { computeShortageWall } from "./shortage-ai";
import { equipmentUtilization } from "./critical-path";
import { commodities, spc, priceZone } from "./commodities";
import { earlyWarningSignals } from "./supplier-portal";
import { supplierEmergencyScores } from "./decision-loop";

export type PredictionKind = "eta" | "delay" | "cost" | "demand" | "capacity" | "supplier_risk";

export type Prediction = {
  kind: PredictionKind;
  subject: string;             // 預測對象（PO 號 / WO 號 / 料件 / 供應商）
  horizon: string;              // 預測時間範圍（如 "14 天內"）
  outcome: string;              // 預測結果
  confidence: number;           // 0-100
  recommendation: string;       // 建議行動
  evidence: string[];           // 推理依據
  tone: "good" | "warn" | "bad";
};

export type PredictionPurpose = {
  kind: PredictionKind;
  emoji: string;
  label: string;
  purpose: string;
  recentCount: number;
  topRisk: number;              // 此維度當前最高風險件數
  sampleHref: string;
};

// ============================================================
// 各預測引擎的入口（聚合既有引擎，給統一介面）
// ============================================================

// ETA Prediction
function etaPredictions(): Prediction[] {
  return etaForecastAll().slice(0, 5).map((f) => ({
    kind: "eta",
    subject: f.poNo,
    horizon: f.expectedArrival,
    outcome: `準時機率 ${f.onTimeProbability}%`,
    confidence: f.onTimeProbability,
    recommendation: f.recommendation,
    evidence: f.risks.map((r) => `${r.factor}（偏 ${r.severity}, +${r.impactDays}d）`),
    tone: f.onTimeProbability >= 85 ? "good" : f.onTimeProbability >= 60 ? "warn" : "bad",
  }));
}

// Delay Prediction (基於 OTIF/OTD forecast)
function delayPredictions(): Prediction[] {
  const forecasts = forecastAll();
  return forecasts.filter((f) => f.light !== "green").slice(0, 5).map((f) => ({
    kind: "delay",
    subject: f.wo.woNo,
    horizon: f.customerRequestDate,
    outcome: f.light === "red" ? `必延誤 ${-f.slackDays} 天` : `可能延誤（緩衝 ${f.slackDays} 天）`,
    confidence: f.light === "red" ? 90 : 65,
    recommendation: f.responsibleSuppliers.length > 0
      ? `加急採購 ${f.responsibleSuppliers[0].parts[0] ?? "關鍵料"} / 找備援`
      : f.bottleneckStage ? `分流 ${f.bottleneckStage} 階段` : "啟動方案 B 延後低毛利單",
    evidence: [
      `預測出貨 ${f.predictedShipDate}`,
      `客戶要求 ${f.customerRequestDate}`,
      f.responsibleSuppliers.length > 0 ? `供應商 ${f.responsibleSuppliers.map((s) => s.name).join("/")} 拖累` : "",
      f.bottleneckStage ? `瓶頸：${f.bottleneckStage}` : "",
    ].filter(Boolean),
    tone: f.light === "red" ? "bad" : "warn",
  }));
}

// Cost Prediction
function costPredictions(): Prediction[] {
  return commodities.map((c) => {
    const s = spc(c);
    const z = priceZone(c);
    const dev = ((s.latest - s.mean) / s.mean) * 100;
    return {
      kind: "cost" as const,
      subject: c.name,
      horizon: "未來 60 天",
      outcome: `${z.zone}區　·　${z.oneLiner}`,
      confidence: 75,
      recommendation: z.action,
      evidence: [
        `當前 ${s.latest.toLocaleString()} ${c.unit}`,
        `偏離均價 ${dev >= 0 ? "+" : ""}${dev.toFixed(1)}%`,
        z.zone === "危險" ? "已超 +2σ 過熱" : z.zone === "低檔" ? "低於 baseline，適合囤貨" : "震盪中",
      ],
      tone: z.tone === "rose" ? "bad" : z.tone === "amber" ? "warn" : "good",
    };
  });
}

// Demand Prediction (基於缺料牆 + BOM)
function demandPredictions(): Prediction[] {
  const wall = computeShortageWall();
  return wall.filter((w) => w.grade === "S" || w.grade === "A").slice(0, 5).map((w) => ({
    kind: "demand",
    subject: w.part.code,
    horizon: w.stockoutDays != null && w.stockoutDays >= 0 ? `${w.stockoutDays} 天內` : "已停線",
    outcome: `需求 ${w.totalRequired} ${w.part.unit}，缺 ${w.shortage}`,
    confidence: 88,
    recommendation: w.plans.find((p) => p.recommended)?.title ?? w.plans[0].title,
    evidence: [
      `${w.affectedWos.length} 張工單依賴`,
      `${w.grade} 級風險`,
      w.canMakeIt ? "現在追單來得及" : "現在追單也趕不上 → 啟動空運",
    ],
    tone: w.grade === "S" ? "bad" : "warn",
  }));
}

// Capacity Prediction
function capacityPredictions(): Prediction[] {
  return equipmentUtilization().filter((e) => e.riskLevel !== "ok").slice(0, 5).map((e) => ({
    kind: "capacity",
    subject: e.name,
    horizon: "未來 14 天",
    outcome: e.aiVerdict,
    confidence: e.riskLevel === "critical" ? 85 : 65,
    recommendation: e.riskLevel === "critical" ? "立即分流 / 加班 / 評估擴產" : "監控、視情況分流",
    evidence: [
      `稼動率 ${e.utilizationPct}%`,
      `${e.stage} 階段`,
      `日載荷 ${e.loadedHoursPerDay}hr / ${e.capacityHoursPerDay}hr`,
    ],
    tone: e.riskLevel === "critical" ? "bad" : "warn",
  }));
}

// Supplier Risk Prediction
function supplierRiskPredictions(): Prediction[] {
  const signals = earlyWarningSignals();
  const scores = supplierEmergencyScores();
  const lowReliability = scores.filter((s) => s.reliability < 75).slice(0, 5);
  const fromSignals: Prediction[] = signals.slice(0, 3).map((sig) => ({
    kind: "supplier_risk" as const,
    subject: sig.supplierName,
    horizon: "未來 48hr",
    outcome: sig.predictedImpact,
    confidence: 80,
    recommendation: sig.recommendedAction,
    evidence: [
      sig.stageLabel,
      `偏離 baseline ${sig.deviationSigma.toFixed(1)}σ`,
      `當前已耗 ${(sig.hoursInStage / 24).toFixed(1)} 天`,
    ],
    tone: sig.severity === "critical" ? "bad" : "warn",
  }));
  const fromScores: Prediction[] = lowReliability.map((s) => ({
    kind: "supplier_risk" as const,
    subject: s.supplierName,
    horizon: "歷史累積",
    outcome: `加急可靠度 ${s.reliability.toFixed(0)}%（${s.grade} 級）`,
    confidence: 70,
    recommendation: s.grade === "D" ? "暫停加單、評估備援" : "下單時考慮備援供應商",
    evidence: [
      `${s.total} 次加急中 ${s.delivered} 次如期`,
    ],
    tone: s.grade === "D" ? "bad" : "warn",
  }));
  return [...fromSignals, ...fromScores].slice(0, 5);
}

// ============================================================
// 統一入口：取得所有預測（按 kind 分組）
// ============================================================
export function allPredictions(): { kind: PredictionKind; predictions: Prediction[] }[] {
  return [
    { kind: "eta",           predictions: etaPredictions() },
    { kind: "delay",         predictions: delayPredictions() },
    { kind: "cost",          predictions: costPredictions() },
    { kind: "demand",        predictions: demandPredictions() },
    { kind: "capacity",      predictions: capacityPredictions() },
    { kind: "supplier_risk", predictions: supplierRiskPredictions() },
  ];
}

export function predictionPurposes(): PredictionPurpose[] {
  const all = allPredictions();
  return [
    { kind: "eta",           emoji: "🔮", label: "ETA Prediction",     purpose: "準交",   recentCount: all[0].predictions.length, topRisk: all[0].predictions.filter((p) => p.tone === "bad").length, sampleHref: "/erp/eta-forecast" },
    { kind: "delay",         emoji: "⏰", label: "Delay Prediction",   purpose: "防停線", recentCount: all[1].predictions.length, topRisk: all[1].predictions.filter((p) => p.tone === "bad").length, sampleHref: "/erp/shortage-wall" },
    { kind: "cost",          emoji: "💰", label: "Cost Prediction",    purpose: "控成本", recentCount: all[2].predictions.length, topRisk: all[2].predictions.filter((p) => p.tone === "bad").length, sampleHref: "/erp/materials" },
    { kind: "demand",        emoji: "📦", label: "Demand Prediction",  purpose: "備料",   recentCount: all[3].predictions.length, topRisk: all[3].predictions.filter((p) => p.tone === "bad").length, sampleHref: "/erp/shortage-wall" },
    { kind: "capacity",      emoji: "⚙️", label: "Capacity Prediction",purpose: "排程",   recentCount: all[4].predictions.length, topRisk: all[4].predictions.filter((p) => p.tone === "bad").length, sampleHref: "/erp/work-orders" },
    { kind: "supplier_risk", emoji: "🛰", label: "Supplier Risk",      purpose: "風險",   recentCount: all[5].predictions.length, topRisk: all[5].predictions.filter((p) => p.tone === "bad").length, sampleHref: "/erp/supplier-portal/audit" },
  ];
}
