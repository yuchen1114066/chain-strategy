// 供應商查詢 + 評核引擎 — Supplier Lookup & Audit
//
// 輸入 PO 號 / 廠商代號 / 廠商簡稱 → 查出全部出貨追蹤履歷 + 4 維度自動評核

import { digitalPOs, supplierDigitalTwins, type DigitalPO } from "./supplier-portal";
import { suppliers, parts } from "./seed";

export type AuditTimelineEvent = {
  at: string;                      // ISO datetime
  stage: string;                   // 階段名稱
  category: "po" | "ack" | "production" | "asn" | "quality";
  actor: string;                    // 操作人
  detail: string;
  durationFromPrev?: string;        // 與上一事件的時間差
  vsBaseline?: { actual: number; baseline: number; deviation: number; unit: "hr" | "d" };
};

export type PoAudit = {
  po: DigitalPO;
  supplierName: string;
  supplierCode: string;
  partName: string;
  partCode: string;
  timeline: AuditTimelineEvent[];
  // 4 維度評核
  scores: {
    collaboration: { score: number; verdict: string };  // 協作配合度（PO ack 速度 + 進度更新次數 + ASN 填寫）
    onTime: { score: number; verdict: string };          // 準時度（vs baseline）
    quality: { score: number; verdict: string };          // 品質（合格率）
    commitment: { score: number; verdict: string };       // 數位化承諾 vs 實際
  };
  overall: { score: number; grade: "A" | "B" | "C" | "D"; oneLiner: string };
};

const STAGE_LABEL: Record<string, string> = {
  pending: "待備料", material_ready: "已備料", in_production: "生產中",
  packed: "已包裝", shipped: "已出貨", in_transit: "運輸中", arrived: "已到貨",
};

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}
function fmtDuration(hr: number): string {
  if (hr < 1) return `${(hr * 60).toFixed(0)} 分`;
  if (hr < 48) return `${hr.toFixed(1)} 小時`;
  return `${(hr / 24).toFixed(1)} 天`;
}

// ============================================================
// 主入口：查單張 PO 的完整評核
// ============================================================
export function auditPo(poId: string): PoAudit | null {
  const po = digitalPOs.find((p) => p.id === poId || p.poNo.toUpperCase() === poId.toUpperCase());
  if (!po) return null;
  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const part = parts.find((p) => p.id === po.partId);
  const twin = supplierDigitalTwins().find((t) => t.supplierId === po.supplierId);

  // ---- 建構時間軸 ----
  const events: AuditTimelineEvent[] = [];
  events.push({
    at: po.sentAt,
    stage: "PO 發出",
    category: "po",
    actor: "採購",
    detail: `PO ${po.poNo} 數位發送 · ${part?.name} × ${po.qty} ${part?.unit}（單價 $${po.unitCost.toLocaleString()}）`,
  });
  if (po.ackedAt) {
    const ackHours = hoursBetween(po.sentAt, po.ackedAt);
    const baseAck = twin?.baseline.ackHours;
    events.push({
      at: po.ackedAt,
      stage: "供應商確認",
      category: "ack",
      actor: po.ackedBy ?? "—",
      detail: `供應商已確認接單`,
      durationFromPrev: fmtDuration(ackHours),
      vsBaseline: baseAck && baseAck.avg > 0 ? {
        actual: ackHours,
        baseline: baseAck.avg,
        deviation: (ackHours - baseAck.avg) / (baseAck.stdev || 8),
        unit: "hr",
      } : undefined,
    });
  } else {
    events.push({
      at: po.ackDeadline,
      stage: "等待確認（已逾 48hr）",
      category: "ack",
      actor: "—",
      detail: `❌ 供應商尚未確認 PO（已逾 ${(hoursBetween(po.sentAt, new Date().toISOString())).toFixed(0)} hr）`,
    });
  }
  // 生產日誌
  let prevTime: string | undefined = po.ackedAt;
  for (const log of po.productionLog) {
    const dur = prevTime ? hoursBetween(prevTime, log.timestamp) : undefined;
    events.push({
      at: log.timestamp,
      stage: STAGE_LABEL[log.stage] ?? log.stage,
      category: "production",
      actor: log.updatedBy,
      detail: log.remark ?? `階段更新：${STAGE_LABEL[log.stage] ?? log.stage}`,
      durationFromPrev: dur != null ? fmtDuration(dur) : undefined,
    });
    prevTime = log.timestamp;
  }
  // ASN
  if (po.asn) {
    events.push({
      at: po.asn.filedAt,
      stage: "ASN 出貨通知",
      category: "asn",
      actor: po.asn.filedBy,
      detail: `出貨日 ${po.asn.shipDate} · ${po.asn.carrier} ${po.asn.trackingNo} · ETA ${po.asn.etaDate}${po.asn.remark ? ` · ${po.asn.remark}` : ""}`,
    });
  } else if (po.status !== "received" && po.status !== "sent") {
    events.push({
      at: po.expectedShipDate + "T08:00:00Z",
      stage: "❌ ASN 缺漏",
      category: "asn",
      actor: "—",
      detail: `供應商未填 ASN 出貨通知 — 預防性預警已 push 採購`,
    });
  }
  // 品質
  for (const q of po.qualityReports) {
    const resultLabel = q.result === "pass" ? "✅ 合格" :
                       q.result === "minor_defect" ? "⚠ 輕微異常" :
                       q.result === "major_defect" ? "🚨 重大異常" : "🚫 退貨";
    events.push({
      at: q.reportedAt,
      stage: `品質回饋 — ${resultLabel}`,
      category: "quality",
      actor: q.reportedBy,
      detail: q.result === "pass"
        ? `進料 IQC 通過，無不良`
        : `不良 ${q.defectQty} 件（${q.defectRate?.toFixed(1)}%）· ${q.reason ?? ""}`,
    });
  }
  events.sort((a, b) => a.at.localeCompare(b.at));

  // ---- 4 維度評核 ----
  // ① 協作配合度
  let collabScore = 100;
  const collabNotes: string[] = [];
  if (!po.ackedAt) { collabScore -= 40; collabNotes.push("未確認 PO"); }
  else {
    const ackHr = hoursBetween(po.sentAt, po.ackedAt);
    if (ackHr > 48) { collabScore -= 20; collabNotes.push(`PO 確認逾 48hr (${ackHr.toFixed(0)}hr)`); }
    else if (ackHr > 24) { collabScore -= 10; collabNotes.push(`PO 確認偏慢 (${ackHr.toFixed(0)}hr)`); }
  }
  if (!po.asn && po.status !== "sent" && po.status !== "received") {
    collabScore -= 25;
    collabNotes.push("ASN 未填");
  }
  if (po.productionLog.length === 0 && po.ackedAt) {
    collabScore -= 15;
    collabNotes.push("生產進度從未更新");
  }
  collabScore = Math.max(0, Math.min(100, collabScore));

  // ② 準時度
  let onTimeScore = 100;
  const onTimeNotes: string[] = [];
  if (po.asn) {
    const planShip = new Date(po.expectedShipDate + "T00:00:00Z").getTime();
    const actualShip = new Date(po.asn.shipDate + "T00:00:00Z").getTime();
    const shipDelay = (actualShip - planShip) / 86_400_000;
    if (shipDelay > 0) {
      const penalty = Math.min(40, shipDelay * 4);
      onTimeScore -= penalty;
      onTimeNotes.push(`實際出貨晚 ${shipDelay.toFixed(0)} 天`);
    }
    const planEta = new Date(po.expectedArrival + "T00:00:00Z").getTime();
    const actualEta = new Date(po.asn.etaDate + "T00:00:00Z").getTime();
    const etaDelay = (actualEta - planEta) / 86_400_000;
    if (etaDelay > 0) {
      onTimeScore -= Math.min(20, etaDelay * 2);
      onTimeNotes.push(`預計到貨晚 ${etaDelay.toFixed(0)} 天`);
    }
  }
  if (!po.asn && po.status !== "sent") {
    const planShip = new Date(po.expectedShipDate + "T00:00:00Z").getTime();
    const todayMs = Date.now();
    const overdue = (todayMs - planShip) / 86_400_000;
    if (overdue > 0) {
      onTimeScore -= Math.min(50, overdue * 5);
      onTimeNotes.push(`已逾預定出貨 ${overdue.toFixed(0)} 天且無 ASN`);
    }
  }
  onTimeScore = Math.max(0, Math.min(100, onTimeScore));

  // ③ 品質
  let qScore = 100;
  const qNotes: string[] = [];
  for (const q of po.qualityReports) {
    if (q.result === "minor_defect") { qScore -= 15; qNotes.push(`輕微異常：${q.reason ?? "—"}`); }
    if (q.result === "major_defect") { qScore -= 35; qNotes.push(`🚨 重大異常：${q.reason ?? "—"}`); }
    if (q.result === "rejected") { qScore -= 60; qNotes.push(`🚫 退貨：${q.reason ?? "—"}`); }
  }
  qScore = Math.max(0, Math.min(100, qScore));
  if (po.qualityReports.length === 0) qNotes.push("尚無品質回饋");

  // ④ 數位化承諾vs實際
  let commitScore = 100;
  const commitNotes: string[] = [];
  if (po.asn) {
    const arrLog = po.productionLog.find((l) => l.stage === "arrived");
    if (arrLog) {
      const promiseEta = new Date(po.asn.etaDate + "T00:00:00Z").getTime();
      const actualArr = new Date(arrLog.timestamp).getTime();
      const diff = (actualArr - promiseEta) / 86_400_000;
      if (diff > 1) {
        commitScore -= Math.min(40, diff * 8);
        commitNotes.push(`實際到貨比 ASN 承諾晚 ${diff.toFixed(1)} 天`);
      } else if (diff < -1) {
        commitNotes.push(`提早 ${(-diff).toFixed(1)} 天到貨（優於承諾）`);
      } else {
        commitNotes.push("ASN 承諾與實際到貨一致");
      }
    } else {
      commitNotes.push("尚未到貨，無法評估承諾準確度");
    }
  } else {
    commitScore -= 25;
    commitNotes.push("未填 ASN — 無承諾可比對");
  }
  commitScore = Math.max(0, Math.min(100, commitScore));

  // 綜合
  const overall = Math.round((collabScore + onTimeScore + qScore + commitScore) / 4);
  const grade: PoAudit["overall"]["grade"] =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : "D";
  const oneLiner =
    grade === "A" ? "✓ 表現優異 — 可信任、可加單"
    : grade === "B" ? "🟢 大致良好 — 持續追蹤"
    : grade === "C" ? "🟡 多項缺漏 — 議價時可援引扣分"
    : "🚨 嚴重不合格 — 建議準備備援、暫停加單";

  return {
    po,
    supplierName: supplier?.name ?? po.supplierId,
    supplierCode: supplier?.code ?? po.supplierId,
    partName: part?.name ?? po.partId,
    partCode: part?.code ?? "",
    timeline: events,
    scores: {
      collaboration: { score: collabScore, verdict: collabNotes.join("、") || "完美配合" },
      onTime: { score: onTimeScore, verdict: onTimeNotes.join("、") || "如期" },
      quality: { score: qScore, verdict: qNotes.join("；") || "—" },
      commitment: { score: commitScore, verdict: commitNotes.join("、") || "承諾兌現" },
    },
    overall: { score: overall, grade, oneLiner },
  };
}

// ============================================================
// 查單一供應商的全部 PO + 綜合評核
// ============================================================
export type SupplierAudit = {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  country: string;
  totalPOs: number;
  poAudits: PoAudit[];
  avgCollaboration: number;
  avgOnTime: number;
  avgQuality: number;
  avgCommitment: number;
  overallScore: number;
  overallGrade: "A" | "B" | "C" | "D";
  conclusion: string;
};

export function auditSupplier(input: string): SupplierAudit | null {
  const term = input.trim().toLowerCase();
  if (!term) return null;
  const supplier = suppliers.find((s) =>
    s.id.toLowerCase() === term ||
    s.code.toLowerCase() === term ||
    s.code.toLowerCase().includes(term) ||
    s.name.toLowerCase().includes(term)
  );
  if (!supplier) return null;
  const sPOs = digitalPOs.filter((p) => p.supplierId === supplier.id);
  if (sPOs.length === 0) {
    return {
      supplierId: supplier.id, supplierCode: supplier.code, supplierName: supplier.name,
      country: supplier.country, totalPOs: 0, poAudits: [],
      avgCollaboration: 0, avgOnTime: 0, avgQuality: 0, avgCommitment: 0,
      overallScore: 0, overallGrade: "D",
      conclusion: "尚無 PO 紀錄",
    };
  }
  const audits = sPOs.map((p) => auditPo(p.id)).filter((x): x is PoAudit => x != null);
  const avgC = audits.reduce((s, x) => s + x.scores.collaboration.score, 0) / audits.length;
  const avgT = audits.reduce((s, x) => s + x.scores.onTime.score, 0) / audits.length;
  const avgQ = audits.reduce((s, x) => s + x.scores.quality.score, 0) / audits.length;
  const avgM = audits.reduce((s, x) => s + x.scores.commitment.score, 0) / audits.length;
  const overall = Math.round((avgC + avgT + avgQ + avgM) / 4);
  const grade: SupplierAudit["overallGrade"] =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : "D";
  const conclusion =
    grade === "A" ? "✓ 優質供應商 — 長期合作、議價空間有限、可優先加單"
    : grade === "B" ? "🟢 合格供應商 — 持續追蹤；可協商部分條件"
    : grade === "C" ? `🟡 需改善 — 議價立場：「近期評分 ${overall}，靠什麼漲價？」`
    : `🚨 高風險供應商 — 建議準備備援、暫停新訂單，召開檢討會議`;
  return {
    supplierId: supplier.id,
    supplierCode: supplier.code,
    supplierName: supplier.name,
    country: supplier.country,
    totalPOs: sPOs.length,
    poAudits: audits,
    avgCollaboration: avgC,
    avgOnTime: avgT,
    avgQuality: avgQ,
    avgCommitment: avgM,
    overallScore: overall,
    overallGrade: grade,
    conclusion,
  };
}

// ============================================================
// 萬用搜尋（PO 號 or 廠商代號 / 簡稱）
// ============================================================
export type LookupResult =
  | { kind: "po"; data: PoAudit }
  | { kind: "supplier"; data: SupplierAudit }
  | { kind: "none"; suggestion: string[] };

export function lookup(query: string): LookupResult {
  const q = query.trim();
  if (!q) return { kind: "none", suggestion: [] };
  // 先查 PO
  const po = auditPo(q);
  if (po) return { kind: "po", data: po };
  // 再查供應商
  const sup = auditSupplier(q);
  if (sup) return { kind: "supplier", data: sup };
  // 建議
  const qLower = q.toLowerCase();
  const sugg: string[] = [];
  for (const s of suppliers) {
    if (s.code.toLowerCase().includes(qLower) || s.name.toLowerCase().includes(qLower)) {
      sugg.push(`${s.code} (${s.name})`);
    }
  }
  for (const p of digitalPOs) {
    if (p.poNo.toLowerCase().includes(qLower)) sugg.push(p.poNo);
  }
  return { kind: "none", suggestion: sugg.slice(0, 6) };
}

