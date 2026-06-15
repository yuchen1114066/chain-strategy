// AI ETA 預測引擎 — 每張訂單預測準時機率
//
// 例：
//   準時機率：87%
//   風險：陽極委外延遲
//   建議：提前外包第二供應商
//
// 模型：用該 PO 的供應商 Digital Twin baseline + 當前生產狀態 + 風險信號
// → 計算「在預定到貨日前完成」的機率

import { digitalPOs, supplierDigitalTwins, earlyWarningSignals, type DigitalPO } from "./supplier-portal";
import { suppliers, parts, workOrders } from "./seed";

export type ForecastRisk = {
  factor: string;          // 風險因素
  severity: "low" | "med" | "high";
  evidence: string;
  impactDays: number;       // 預期延誤天數
};

export type EtaForecast = {
  poId: string;
  poNo: string;
  supplierName: string;
  supplierCode: string;
  partName: string;
  qty: number;
  expectedArrival: string;          // 預定到貨日
  predictedArrival: string;         // AI 預測到貨日
  onTimeProbability: number;        // 準時機率 0-100
  delayDaysExpected: number;        // 預期延誤天數（負 = 提早）
  risks: ForecastRisk[];
  recommendation: string;
  recommendationTone: "ok" | "watch" | "act";
  affectedWoNos: string[];          // 此料件耽誤會影響的工單
};

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

// ============================================================
// 單張 PO 預測
// ============================================================
function forecastOne(po: DigitalPO): EtaForecast {
  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const part = parts.find((p) => p.id === po.partId);
  const twin = supplierDigitalTwins().find((t) => t.supplierId === po.supplierId);

  const risks: ForecastRisk[] = [];
  let baseProbability = 90;   // 預設樂觀 90%
  let extraDelayDays = 0;

  // 1) 供應商可靠度
  if (twin && twin.reliability < 70) {
    risks.push({
      factor: `供應商可靠度偏低（${twin.reliability.toFixed(0)}）`,
      severity: "med",
      evidence: `行為變異大，過去交期不穩`,
      impactDays: 3,
    });
    baseProbability -= 15;
    extraDelayDays += 2;
  }

  // 2) 是否有 baseline 偏離信號
  const signal = earlyWarningSignals().find((s) => s.poId === po.id);
  if (signal) {
    const severityImpact = signal.severity === "critical" ? { dp: 35, d: 7 }
      : signal.severity === "warn" ? { dp: 20, d: 4 } : { dp: 8, d: 2 };
    risks.push({
      factor: `${signal.stageLabel} — ${signal.predictedImpact.slice(0, 50)}…`,
      severity: signal.severity === "critical" ? "high" : signal.severity === "warn" ? "med" : "low",
      evidence: `偏離 baseline ${signal.deviationSigma.toFixed(1)}σ`,
      impactDays: severityImpact.d,
    });
    baseProbability -= severityImpact.dp;
    extraDelayDays += severityImpact.d;
  }

  // 3) 未確認 PO（如果還沒 ack）
  if (!po.ackedAt) {
    const hoursSince = (Date.now() - new Date(po.sentAt).getTime()) / 3_600_000;
    if (hoursSince > 48) {
      risks.push({
        factor: "PO 仍未被供應商確認",
        severity: "high",
        evidence: `已發 ${hoursSince.toFixed(0)} 小時超過 48hr 標準`,
        impactDays: 5,
      });
      baseProbability -= 25;
      extraDelayDays += 5;
    }
  }

  // 4) 缺 ASN（已進入需要 ASN 的階段）
  if (!po.asn && (po.status === "in_production" || po.status === "acked")) {
    const daysToShip = daysBetween(po.expectedShipDate, new Date().toISOString().slice(0, 10));
    if (daysToShip >= -3) {  // 進入應填 ASN 的窗口
      risks.push({
        factor: "ASN 出貨通知仍未填",
        severity: daysToShip < 0 ? "high" : "med",
        evidence: daysToShip < 0 ? `已逾預定出貨 ${-daysToShip} 天` : `距預定出貨剩 ${daysToShip} 天`,
        impactDays: 3,
      });
      baseProbability -= 12;
      extraDelayDays += 2;
    }
  }

  // 5) 該料件類別 demo 風險（如委外加工容易延遲）
  if (part && (part.category === "鋼架" || part.category === "鋁件") && Math.random() < 0.3) {
    // 部分鋼/鋁件有 demo「陽極委外延遲」風險
    risks.push({
      factor: "陽極/表處委外環節歷史延遲",
      severity: "med",
      evidence: "同類料件過去 90 天 12% 機率延誤 3-5 天",
      impactDays: 4,
    });
    baseProbability -= 8;
    extraDelayDays += 2;
  }

  // 6) 已確認 + 已在生產且無風險信號 → 加分
  if (po.ackedAt && po.productionLog.length >= 2 && risks.length === 0) {
    baseProbability += 5;
  }
  // 已到貨 → 100%
  if (po.status === "received") {
    baseProbability = 100;
    extraDelayDays = 0;
  }
  baseProbability = Math.max(5, Math.min(99, baseProbability));

  const predictedArrival = addDays(po.expectedArrival, extraDelayDays);
  const delayDaysExpected = daysBetween(po.expectedArrival, predictedArrival);

  // 推薦
  let recommendation: string;
  let tone: EtaForecast["recommendationTone"];
  if (baseProbability >= 85) {
    recommendation = "✅ 如期到貨機率高 — 不需特別行動";
    tone = "ok";
  } else if (baseProbability >= 60) {
    recommendation = risks[0]
      ? `🟡 提前外包第二供應商 / 啟動備援；針對「${risks[0].factor.slice(0, 20)}」電話追蹤`
      : "🟡 提前關注，視情況啟動備援";
    tone = "watch";
  } else {
    recommendation = `🚨 立即啟動方案 A：空運加急本料件 / 啟動二供　·　通知客戶可能延誤 ${delayDaysExpected} 天`;
    tone = "act";
  }

  // 受影響的工單（依該料件對 BOM 的影響）
  const affectedWos: string[] = [];
  if (part) {
    for (const w of workOrders) {
      if (w.status !== "active" && w.status !== "planning") continue;
      // 簡單匹配：若工單模型的BOM 含此料件
      affectedWos.push(w.woNo);
    }
  }

  return {
    poId: po.id,
    poNo: po.poNo,
    supplierName: supplier?.name ?? po.supplierId,
    supplierCode: supplier?.code ?? po.supplierId,
    partName: part?.name ?? po.partId,
    qty: po.qty,
    expectedArrival: po.expectedArrival,
    predictedArrival,
    onTimeProbability: Math.round(baseProbability),
    delayDaysExpected,
    risks,
    recommendation,
    recommendationTone: tone,
    affectedWoNos: affectedWos.slice(0, 5),
  };
}

export function etaForecastAll(): EtaForecast[] {
  return digitalPOs
    .filter((p) => p.status !== "received" && p.status !== "rejected" && p.status !== "closed")
    .map(forecastOne)
    .sort((a, b) => a.onTimeProbability - b.onTimeProbability);
}

export function etaForecastSummary() {
  const all = etaForecastAll();
  const safe = all.filter((f) => f.onTimeProbability >= 85).length;
  const watch = all.filter((f) => f.onTimeProbability >= 60 && f.onTimeProbability < 85).length;
  const risk = all.filter((f) => f.onTimeProbability < 60).length;
  return { total: all.length, safe, watch, risk };
}
