// 供應商風險雷達引擎 — Supplier Risk Radar
//
// 不做「打分數系統」（A廠 82 分 — 沒意義）。
// 做「風險雷達」— 偵測信號、給敘事：
//   「A廠：風險正在上升 / 原因：回應速度下降、ASN 延遲增加、品質開始惡化」
//
// 5 維加權模型（業界標準）：
//   ① Reliability 可靠度 30%  — PO Ack / ASN / 狀態更新 / ETA 穩定性  →  是否可信
//   ② Delivery   準交  25%   — OTD / OTIF / Delay / Partial Shipment  →  是否準時
//   ③ Quality    品質  20%   — Defect / Reject / Return / CAR           →  是否穩定
//   ④ Cost       成本  15%   — 漲價合理性、報價速度、年降              →  是否合理
//   ⑤ Risk       風險  10%   — ASN 異常、回應下降、品質惡化（動量信號）→  是否開始異常

import { digitalPOs, supplierDigitalTwins, type DigitalPO } from "./supplier-portal";
import { suppliers, parts } from "./seed";

// ============================================================
// 5 維加權模型
// ============================================================
export type RadarDimension = "reliability" | "delivery" | "quality" | "cost" | "risk";

export const RADAR_META: Record<RadarDimension, { label: string; labelEn: string; weight: number; purpose: string; signals: string }> = {
  reliability: { label: "可靠度", labelEn: "Reliability", weight: 0.30, purpose: "是否可信", signals: "PO Ack、ASN、狀態更新、ETA 穩定性" },
  delivery:    { label: "準交",   labelEn: "Delivery",    weight: 0.25, purpose: "是否準時", signals: "OTD、OTIF、Delay、Partial Shipment" },
  quality:     { label: "品質",   labelEn: "Quality",     weight: 0.20, purpose: "是否穩定", signals: "Defect、Reject、Return、CAR" },
  cost:        { label: "成本",   labelEn: "Cost",        weight: 0.15, purpose: "是否合理", signals: "漲價合理性、報價速度、年降" },
  risk:        { label: "風險",   labelEn: "Risk",        weight: 0.10, purpose: "是否開始異常", signals: "ASN 異常、回應下降、品質惡化（動量信號）" },
};

export type Trend = "rising" | "falling" | "stable";

export type DimScore = {
  score: number;             // 0-100 當前
  prevScore: number;         // 早期窗口
  delta: number;             // 近期 - 早期
  trend: Trend;              // 改善中 / 惡化中 / 穩定
  weight: number;
  signals: string[];          // 具體事證（最多 3 條）
  positives: string[];        // 改善訊號
};

export type RiskRadar = {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  country: string;
  totalPOs: number;
  dims: Record<RadarDimension, DimScore>;
  overallScore: number;
  riskMomentum: "rising" | "improving" | "stable";   // 整體風險動量
  narrative: string;               // 「A廠：風險正在上升 / 原因：…」一句話
  warningSignals: string[];        // 紅燈信號清單
  improvements: string[];          // 正向信號
  negotiationStance: string;        // 議價立場
};

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

// 把 PO 切兩半：recent 30% + earlier 70%（最少各 1 張）
function splitPOs(list: DigitalPO[]): { recent: DigitalPO[]; earlier: DigitalPO[] } {
  const sorted = [...list].sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  if (sorted.length <= 2) return { recent: sorted.slice(-1), earlier: sorted.slice(0, -1) };
  const recentN = Math.max(1, Math.round(sorted.length * 0.35));
  return { recent: sorted.slice(-recentN), earlier: sorted.slice(0, -recentN) };
}

// ============================================================
// 各維度的「窗口分數」計算
// ============================================================
function reliabilityWindow(pos: DigitalPO[]): { score: number; signals: string[]; positives: string[] } {
  if (pos.length === 0) return { score: 0, signals: [], positives: [] };
  let score = 100;
  const sig: string[] = [];
  const pos2: string[] = [];

  // PO Ack 時效
  const acked = pos.filter((p) => p.ackedAt);
  const avgAckHr = acked.length > 0
    ? acked.reduce((s, p) => s + hoursBetween(p.sentAt, p.ackedAt!), 0) / acked.length
    : 999;
  const ackedRate = acked.length / pos.length;
  if (ackedRate < 1) {
    score -= (1 - ackedRate) * 50;
    sig.push(`PO 未確認率 ${((1 - ackedRate) * 100).toFixed(0)}%`);
  }
  if (avgAckHr > 48) { score -= 15; sig.push(`PO Ack 平均 ${avgAckHr.toFixed(0)}hr（>48hr）`); }
  else if (avgAckHr <= 12) pos2.push(`PO Ack 平均 ${avgAckHr.toFixed(0)}hr，回應迅速`);

  // ASN 填寫率
  const needAsn = pos.filter((p) => p.status !== "sent" && p.status !== "rejected");
  const filed = needAsn.filter((p) => p.asn).length;
  const asnRate = needAsn.length > 0 ? filed / needAsn.length : 1;
  if (asnRate < 1) {
    score -= (1 - asnRate) * 25;
    sig.push(`ASN 填寫率僅 ${(asnRate * 100).toFixed(0)}%`);
  } else if (asnRate === 1 && needAsn.length > 0) pos2.push("ASN 100% 填妥");

  // 狀態更新次數（生產日誌密度）
  const avgLogs = pos.reduce((s, p) => s + p.productionLog.length, 0) / pos.length;
  if (avgLogs < 1.5) { score -= 10; sig.push(`狀態更新密度偏低（平均 ${avgLogs.toFixed(1)} 次/張）`); }

  return { score: Math.max(0, Math.min(100, score)), signals: sig, positives: pos2 };
}

function deliveryWindow(pos: DigitalPO[]): { score: number; signals: string[]; positives: string[] } {
  if (pos.length === 0) return { score: 0, signals: [], positives: [] };
  let score = 100;
  const sig: string[] = [];
  const pos2: string[] = [];
  // 計算 OTD：實際出貨 vs 預定出貨
  let onTime = 0, total = 0;
  const delays: number[] = [];
  for (const p of pos) {
    if (!p.asn) continue;
    total++;
    const planMs = new Date(p.expectedShipDate + "T00:00:00Z").getTime();
    const actualMs = new Date(p.asn.shipDate + "T00:00:00Z").getTime();
    const delay = (actualMs - planMs) / 86_400_000;
    if (delay <= 0) onTime++;
    else delays.push(delay);
  }
  // 缺 ASN 視為延誤
  const missingAsn = pos.filter((p) => !p.asn && p.status !== "sent" && p.status !== "rejected" && new Date(p.expectedShipDate + "T00:00:00Z").getTime() < Date.now()).length;
  total += missingAsn;
  const otd = total > 0 ? (onTime / total) * 100 : 100;
  if (otd < 95) {
    score -= (95 - otd) * 0.8;
    sig.push(`OTD ${otd.toFixed(0)}%（業界標準 ≥95%）`);
  } else if (otd >= 98) pos2.push(`OTD ${otd.toFixed(0)}%`);
  if (delays.length > 0) {
    const avgDelay = delays.reduce((s, d) => s + d, 0) / delays.length;
    sig.push(`平均延誤 ${avgDelay.toFixed(1)} 天`);
  }
  if (missingAsn > 0) sig.push(`${missingAsn} 張已逾出貨日仍無 ASN`);
  return { score: Math.max(0, Math.min(100, score)), signals: sig, positives: pos2 };
}

function qualityWindow(pos: DigitalPO[]): { score: number; signals: string[]; positives: string[] } {
  if (pos.length === 0) return { score: 0, signals: [], positives: [] };
  let score = 100;
  const sig: string[] = [];
  const pos2: string[] = [];
  let pass = 0, minor = 0, major = 0, rejected = 0;
  for (const p of pos) {
    for (const q of p.qualityReports) {
      if (q.result === "pass") pass++;
      else if (q.result === "minor_defect") minor++;
      else if (q.result === "major_defect") major++;
      else if (q.result === "rejected") rejected++;
    }
  }
  const total = pass + minor + major + rejected;
  if (total === 0) return { score: 80, signals: ["尚無品質回饋紀錄（無法評估）"], positives: [] };
  const passRate = (pass / total) * 100;
  if (passRate < 95) score -= (95 - passRate) * 1.2;
  if (minor > 0) sig.push(`輕微不良 ${minor} 批`);
  if (major > 0) { score -= major * 8; sig.push(`重大不良 ${major} 批`); }
  if (rejected > 0) { score -= rejected * 18; sig.push(`退貨 ${rejected} 批 — CAR 應啟動`); }
  if (passRate >= 98) pos2.push(`合格率 ${passRate.toFixed(0)}%`);
  return { score: Math.max(0, Math.min(100, score)), signals: sig, positives: pos2 };
}

function costWindow(pos: DigitalPO[]): { score: number; signals: string[]; positives: string[] } {
  if (pos.length === 0) return { score: 0, signals: [], positives: [] };
  // demo 模式：seed 沒記錄漲價歷史，給合理 baseline 80 並依品質扣分
  // （正式版接到 PURTC/PURTD 後可比對歷史單價計算漲幅）
  let score = 80;
  const sig: string[] = [];
  const pos2: string[] = [];
  // 用品質惡化作為間接信號（品質差通常隱含「為了壓成本偷工」）
  const rejected = pos.reduce((s, p) => s + p.qualityReports.filter((q) => q.result === "rejected").length, 0);
  if (rejected > 0) { score -= 15; sig.push("有退貨紀錄 — 漲價時可援引扣分"); }
  else pos2.push("無退貨紀錄，價格議價基礎良好");
  sig.push("（demo：漲價歷史需接 PURTC/PURTD 才可計算）");
  return { score: Math.max(0, Math.min(100, score)), signals: sig, positives: pos2 };
}

// Risk 維度 = 動量信號的綜合（其他 4 個維度的 trend）
function riskFromTrends(rel: number, del: number, qua: number, cos: number): { score: number; signals: string[]; positives: string[] } {
  // 把各維度 score 直接平均成「靜態」風險分；動量在外層合併
  const base = (rel * 0.30 + del * 0.25 + qua * 0.20 + cos * 0.15) / 0.90;
  const score = base;
  const sig: string[] = [];
  const pos2: string[] = [];
  if (base < 70) sig.push("綜合健康度偏低");
  if (base >= 85) pos2.push("整體健康度優異");
  return { score: Math.max(0, Math.min(100, score)), signals: sig, positives: pos2 };
}

// ============================================================
// 主入口：產出風險雷達
// ============================================================
export function radarFor(supplierIdOrCode: string): RiskRadar | null {
  const term = supplierIdOrCode.trim().toLowerCase();
  const supplier = suppliers.find((s) =>
    s.id.toLowerCase() === term ||
    s.code.toLowerCase() === term ||
    s.code.toLowerCase().includes(term) ||
    s.name.toLowerCase().includes(term)
  );
  if (!supplier) return null;
  const sPOs = digitalPOs.filter((p) => p.supplierId === supplier.id);
  if (sPOs.length === 0) return null;

  const { recent, earlier } = splitPOs(sPOs);

  // 每維度算 recent + earlier 兩個窗口分
  function calc(window: (pos: DigitalPO[]) => { score: number; signals: string[]; positives: string[] }, weight: number): DimScore {
    const r = window(recent);
    const e = earlier.length > 0 ? window(earlier) : { score: r.score, signals: [], positives: [] };
    const delta = r.score - e.score;
    const trend: Trend = delta < -8 ? "falling" : delta > 8 ? "rising" : "stable";
    return {
      score: Math.round(r.score),
      prevScore: Math.round(e.score),
      delta: Math.round(delta),
      trend,
      weight,
      signals: r.signals.slice(0, 3),
      positives: r.positives.slice(0, 2),
    };
  }

  const reliability = calc(reliabilityWindow, 0.30);
  const delivery    = calc(deliveryWindow,    0.25);
  const quality     = calc(qualityWindow,     0.20);
  const cost        = calc(costWindow,        0.15);
  const riskBase    = calc((p) => riskFromTrends(
    reliabilityWindow(p).score, deliveryWindow(p).score,
    qualityWindow(p).score, costWindow(p).score
  ), 0.10);

  const dims: Record<RadarDimension, DimScore> = {
    reliability, delivery, quality, cost, risk: riskBase,
  };

  // 加權綜合
  const overall = Math.round(
    reliability.score * 0.30 +
    delivery.score    * 0.25 +
    quality.score     * 0.20 +
    cost.score        * 0.15 +
    riskBase.score    * 0.10
  );

  // ---- 動量偵測：有幾個維度在惡化？ ----
  const falling = Object.values(dims).filter((d) => d.trend === "falling").length;
  const rising  = Object.values(dims).filter((d) => d.trend === "rising").length;
  let momentum: RiskRadar["riskMomentum"];
  if (falling >= 2) momentum = "rising";       // 風險上升
  else if (rising >= 2 && falling === 0) momentum = "improving";  // 改善中
  else momentum = "stable";

  // ---- 紅燈信號 / 正向信號 ----
  const warnings: string[] = [];
  if (reliability.trend === "falling") warnings.push(`回應速度下降（可靠度 ${reliability.prevScore} → ${reliability.score}）`);
  if (delivery.trend === "falling")    warnings.push(`準交惡化（${delivery.prevScore} → ${delivery.score}）`);
  if (quality.trend === "falling")     warnings.push(`品質開始惡化（${quality.prevScore} → ${quality.score}）`);
  if (cost.trend === "falling")        warnings.push(`成本壓力增加`);
  // 額外靜態信號
  reliability.signals.forEach((s) => { if (!warnings.some((w) => w.includes(s.slice(0, 6)))) warnings.push(s); });
  if (delivery.signals.length > 0) warnings.push(delivery.signals[0]);
  if (quality.signals.length > 0 && !quality.signals[0].includes("尚無")) warnings.push(quality.signals[0]);

  const improvements: string[] = [];
  Object.entries(dims).forEach(([k, d]) => {
    if (d.trend === "rising") improvements.push(`${RADAR_META[k as RadarDimension].label}改善中（+${d.delta}）`);
    d.positives.forEach((p) => improvements.push(p));
  });

  // ---- 敘事 ----
  let narrative: string;
  if (momentum === "rising") {
    const reasons = warnings.slice(0, 3).join("、");
    narrative = `${supplier.name}：⚠ 風險正在上升 — ${reasons || "多項指標下滑"}`;
  } else if (momentum === "improving") {
    narrative = `${supplier.name}：✓ 改善中 — ${improvements.slice(0, 2).join("、") || "多項指標好轉"}`;
  } else {
    narrative = `${supplier.name}：穩定 — 整體分 ${overall}`;
  }

  // ---- 議價立場 ----
  let stance: string;
  if (momentum === "rising") {
    stance = `風險上升中 — 對方漲價時可拿話：「您的可靠度從 ${reliability.prevScore} 掉到 ${reliability.score}、${warnings[0] ?? "多項信號"}，這時漲價怎麼說？」`;
  } else if (overall < 65) {
    stance = `綜合分 ${overall}（C/D 級）— 議價立場：要求改善計畫 + 扣品質保證金 5%`;
  } else if (overall >= 85) {
    stance = `優質且穩定 — 可長期合作；議價空間有限但可協商付款條件`;
  } else {
    stance = `中等表現 — 議價時可援引 ${warnings[0] ?? "個別異常"} 要求對等讓步`;
  }

  return {
    supplierId: supplier.id,
    supplierCode: supplier.code,
    supplierName: supplier.name,
    country: supplier.country,
    totalPOs: sPOs.length,
    dims,
    overallScore: overall,
    riskMomentum: momentum,
    narrative,
    warningSignals: warnings.slice(0, 5),
    improvements: improvements.slice(0, 4),
    negotiationStance: stance,
  };
}

// ============================================================
// 單張 PO 的追蹤履歷（保留給 audit page 用）
// ============================================================
export type AuditTimelineEvent = {
  at: string;
  stage: string;
  category: "po" | "ack" | "production" | "asn" | "quality";
  actor: string;
  detail: string;
  durationFromPrev?: string;
  vsBaseline?: { actual: number; baseline: number; deviation: number; unit: "hr" | "d" };
};

export type PoAudit = {
  po: DigitalPO;
  supplierName: string;
  supplierCode: string;
  partName: string;
  partCode: string;
  partUnit: string;
  timeline: AuditTimelineEvent[];
  radar: RiskRadar | null;       // 該供應商的當前風險雷達
};

const STAGE_LABEL: Record<string, string> = {
  pending: "待備料", material_ready: "已備料", in_production: "生產中",
  packed: "已包裝", shipped: "已出貨", in_transit: "運輸中", arrived: "已到貨",
};

function fmtDuration(hr: number): string {
  if (hr < 1) return `${(hr * 60).toFixed(0)} 分`;
  if (hr < 48) return `${hr.toFixed(1)} 小時`;
  return `${(hr / 24).toFixed(1)} 天`;
}

export function auditPo(poIdOrNo: string): PoAudit | null {
  const po = digitalPOs.find((p) => p.id === poIdOrNo || p.poNo.toUpperCase() === poIdOrNo.toUpperCase());
  if (!po) return null;
  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const part = parts.find((p) => p.id === po.partId);
  const twin = supplierDigitalTwins().find((t) => t.supplierId === po.supplierId);

  const events: AuditTimelineEvent[] = [];
  events.push({
    at: po.sentAt, stage: "PO 發出", category: "po", actor: "採購",
    detail: `PO ${po.poNo} 數位發送 · ${part?.name} × ${po.qty} ${part?.unit}（單價 $${po.unitCost.toLocaleString()}）`,
  });
  if (po.ackedAt) {
    const ackHr = hoursBetween(po.sentAt, po.ackedAt);
    const baseAck = twin?.baseline.ackHours;
    events.push({
      at: po.ackedAt, stage: "供應商確認", category: "ack", actor: po.ackedBy ?? "—",
      detail: "供應商已確認接單",
      durationFromPrev: fmtDuration(ackHr),
      vsBaseline: baseAck && baseAck.avg > 0 ? {
        actual: ackHr, baseline: baseAck.avg,
        deviation: (ackHr - baseAck.avg) / (baseAck.stdev || 8), unit: "hr",
      } : undefined,
    });
  } else {
    events.push({
      at: po.ackDeadline, stage: "等待確認（已逾 48hr）", category: "ack", actor: "—",
      detail: `❌ 供應商尚未確認 PO（已逾 ${hoursBetween(po.sentAt, new Date().toISOString()).toFixed(0)} hr）`,
    });
  }
  let prev: string | undefined = po.ackedAt;
  for (const log of po.productionLog) {
    const dur = prev ? hoursBetween(prev, log.timestamp) : undefined;
    events.push({
      at: log.timestamp, stage: STAGE_LABEL[log.stage] ?? log.stage,
      category: "production", actor: log.updatedBy,
      detail: log.remark ?? `階段更新：${STAGE_LABEL[log.stage] ?? log.stage}`,
      durationFromPrev: dur != null ? fmtDuration(dur) : undefined,
    });
    prev = log.timestamp;
  }
  if (po.asn) {
    events.push({
      at: po.asn.filedAt, stage: "ASN 出貨通知", category: "asn", actor: po.asn.filedBy,
      detail: `出貨日 ${po.asn.shipDate} · ${po.asn.carrier} ${po.asn.trackingNo} · ETA ${po.asn.etaDate}${po.asn.remark ? ` · ${po.asn.remark}` : ""}`,
    });
  } else if (po.status !== "received" && po.status !== "sent") {
    events.push({
      at: po.expectedShipDate + "T08:00:00Z",
      stage: "❌ ASN 缺漏", category: "asn", actor: "—",
      detail: "供應商未填 ASN 出貨通知 — 預防性預警已 push 採購",
    });
  }
  for (const q of po.qualityReports) {
    const lbl = q.result === "pass" ? "✅ 合格" : q.result === "minor_defect" ? "⚠ 輕微異常"
      : q.result === "major_defect" ? "🚨 重大異常" : "🚫 退貨";
    events.push({
      at: q.reportedAt, stage: `品質回饋 — ${lbl}`, category: "quality", actor: q.reportedBy,
      detail: q.result === "pass" ? "進料 IQC 通過，無不良"
        : `不良 ${q.defectQty} 件（${q.defectRate?.toFixed(1)}%）· ${q.reason ?? ""}`,
    });
  }
  events.sort((a, b) => a.at.localeCompare(b.at));

  return {
    po,
    supplierName: supplier?.name ?? po.supplierId,
    supplierCode: supplier?.code ?? po.supplierId,
    partName: part?.name ?? po.partId,
    partCode: part?.code ?? "",
    partUnit: part?.unit ?? "PCS",
    timeline: events,
    radar: radarFor(po.supplierId),
  };
}

// ============================================================
// 萬用查詢
// ============================================================
export type LookupResult =
  | { kind: "po"; data: PoAudit }
  | { kind: "supplier"; data: RiskRadar }
  | { kind: "none"; suggestion: string[] };

export function lookup(query: string): LookupResult {
  const q = query.trim();
  if (!q) return { kind: "none", suggestion: [] };
  const po = auditPo(q);
  if (po) return { kind: "po", data: po };
  const radar = radarFor(q);
  if (radar) return { kind: "supplier", data: radar };
  const ql = q.toLowerCase();
  const sugg: string[] = [];
  for (const s of suppliers) {
    if (s.code.toLowerCase().includes(ql) || s.name.toLowerCase().includes(ql)) sugg.push(`${s.code} (${s.name})`);
  }
  for (const p of digitalPOs) {
    if (p.poNo.toLowerCase().includes(ql)) sugg.push(p.poNo);
  }
  return { kind: "none", suggestion: sugg.slice(0, 6) };
}
