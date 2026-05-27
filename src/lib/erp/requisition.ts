// Requisition Control Center 引擎 — Supply Chain 最前端（Earliest Warning Layer）
//
// 真正供應鏈起點不是 PO，而是 Demand Signal → Requisition (PR)。
// 正確鏈條：Demand → PR → Approval → Procurement → PO → Supplier → ASN → Receiving → Inventory → Production → Delivery → Customer
//
// PR 卡住通常從：工程請購 → 沒簽核 → 採購不知道 → 沒下 PO → 缺料 → 停線
// 解法：把整條鏈條的最前端 PR 流程「點亮」+ AI 預測 + SLA 監控。

import { workOrders, models, today } from "./seed";

export type PrStatus =
  | "draft"             // 草稿
  | "submitted"         // 已送出待簽核
  | "approval_pending"  // 簽核中
  | "approval_delayed"  // 簽核延誤
  | "approved"          // 已核准等待採購
  | "unassigned"        // 已核准但無人指派
  | "blocked"           // 卡關（缺資訊/規格未確認/廠商待選）
  | "in_rfq"            // 進行詢價
  | "converted_po"      // 已轉 PO
  | "cancelled";        // 取消

export type PrPriority = "P1_critical" | "P2_high" | "P3_normal" | "P4_low";

export type Requisition = {
  id: string;              // PR 編號
  prNo: string;            // 顯示用
  createdAt: string;       // ISO datetime
  requestor: string;       // 請購人
  department: string;      // 工程 / 生管 / 業務 / 設備
  partCode: string;
  partName: string;
  qty: number;
  unit: string;
  estUnitCost: number;
  requiredDate: string;    // YYYY-MM-DD 需要日
  forWoNo?: string;        // 對應工單（若有）
  forCustomer?: string;    // 對應客戶
  reason: string;          // 請購原因（替換/急件/新案）
  priority: PrPriority;
  status: PrStatus;
  approvalLevel: number;     // 0-3（已過幾關）
  approvalRequired: number;  // 需幾關
  approvers: { name: string; status: "pending" | "approved" | "rejected"; at?: string }[];
  assignedBuyer?: string;    // 指派採購
  assignedAt?: string;
  convertedPoNo?: string;
  cancelledReason?: string;
};

// ============================================================
// SLA Matrix（依採購流程業界標準）
// ============================================================
export const PR_SLA = {
  pr_assign:    { hours:  4, label: "PR 指派採購" },
  approval:     { hours: 24, label: "簽核完成" },
  rfq:          { hours: 48, label: "RFQ 詢價完成" },
  po_release:   { hours: 72, label: "PO 釋出" },
};

// ============================================================
// PR Event Types
// ============================================================
export type PrEventType =
  | "pr_created"
  | "pr_submitted"
  | "pr_unassigned"
  | "pr_approval_delayed"
  | "pr_blocked"
  | "pr_in_rfq"
  | "pr_converted_po"
  | "pr_cancelled";

export type PrEvent = {
  id: string;
  prId: string;
  type: PrEventType;
  occurredAt: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
  affectedWo?: string;
  affectedOtd?: string;
};

// ============================================================
// Seed — 10 張 PR（涵蓋各種卡關場景）
// ============================================================
function isoOffsetHours(h: number): string {
  const d = new Date(today + "T08:00:00Z");
  d.setUTCHours(d.getUTCHours() + h);
  return d.toISOString();
}

export const requisitions: Requisition[] = [
  {
    id: "pr-001", prNo: "PR-2026-1001", createdAt: isoOffsetHours(-2),
    requestor: "工程 老陳", department: "工程",
    partCode: "FB64-FRM", partName: "FB64 主車架", qty: 200, unit: "PCS", estUnitCost: 1450,
    requiredDate: "2026-06-15", forWoNo: "WO-2026-0103", forCustomer: "LIFE",
    reason: "WO 急件補料", priority: "P1_critical",
    status: "submitted", approvalLevel: 0, approvalRequired: 2,
    approvers: [{ name: "工程主管", status: "pending" }, { name: "副總", status: "pending" }],
  },
  {
    id: "pr-002", prNo: "PR-2026-1002", createdAt: isoOffsetHours(-30),
    requestor: "生管 小王", department: "生管",
    partCode: "FB64-PSU", partName: "12V 電源供應", qty: 150, unit: "PCS", estUnitCost: 320,
    requiredDate: "2026-06-08", forWoNo: "WO-2026-0105",
    reason: "規劃單需料", priority: "P2_high",
    status: "approval_delayed", approvalLevel: 1, approvalRequired: 2,
    approvers: [
      { name: "生管主管", status: "approved", at: isoOffsetHours(-24) },
      { name: "副總", status: "pending" },
    ],
  },
  {
    id: "pr-003", prNo: "PR-2026-1003", createdAt: isoOffsetHours(-80),
    requestor: "設備 阿國", department: "設備",
    partCode: "EQ-CNC3-BELT", partName: "CNC#3 主軸傳動皮帶", qty: 4, unit: "PCS", estUnitCost: 4800,
    requiredDate: "2026-05-30",
    reason: "設備備品（CNC#3 已 96% 稼動，避免突發停機）", priority: "P2_high",
    status: "unassigned", approvalLevel: 2, approvalRequired: 2,
    approvers: [
      { name: "設備主管", status: "approved", at: isoOffsetHours(-72) },
      { name: "廠長", status: "approved", at: isoOffsetHours(-60) },
    ],
  },
  {
    id: "pr-004", prNo: "PR-2026-1004", createdAt: isoOffsetHours(-100),
    requestor: "工程 小李", department: "工程",
    partCode: "NEW-SENSOR-X", partName: "新型號感測器（規格待議）", qty: 10, unit: "PCS", estUnitCost: 0,
    requiredDate: "2026-07-01",
    reason: "新案 R&D 試樣", priority: "P3_normal",
    status: "blocked", approvalLevel: 1, approvalRequired: 2,
    approvers: [
      { name: "工程主管", status: "approved", at: isoOffsetHours(-90) },
      { name: "研發長", status: "pending" },
    ],
  },
  {
    id: "pr-005", prNo: "PR-2026-1005", createdAt: isoOffsetHours(-12),
    requestor: "業務 Lisa", department: "業務",
    partCode: "FB64-LCD5", partName: "5吋 LCD 顯示器", qty: 80, unit: "PCS", estUnitCost: 540,
    requiredDate: "2026-06-20", forCustomer: "TRUE Fitness",
    reason: "客戶新單", priority: "P2_high",
    status: "in_rfq", approvalLevel: 2, approvalRequired: 2,
    approvers: [
      { name: "業務主管", status: "approved", at: isoOffsetHours(-8) },
      { name: "副總", status: "approved", at: isoOffsetHours(-6) },
    ],
    assignedBuyer: "採購 小王", assignedAt: isoOffsetHours(-4),
  },
  {
    id: "pr-006", prNo: "PR-2026-1006", createdAt: isoOffsetHours(-200),
    requestor: "生管 老陳", department: "生管",
    partCode: "FB42-MAG", partName: "FB42 磁鐵", qty: 300, unit: "PCS", estUnitCost: 85,
    requiredDate: "2026-05-25",
    reason: "MRP 自動產生", priority: "P3_normal",
    status: "converted_po", approvalLevel: 2, approvalRequired: 2,
    approvers: [
      { name: "生管主管", status: "approved", at: isoOffsetHours(-190) },
      { name: "廠長", status: "approved", at: isoOffsetHours(-185) },
    ],
    assignedBuyer: "採購 小王", assignedAt: isoOffsetHours(-180),
    convertedPoNo: "PO-2026-0508",
  },
  {
    id: "pr-007", prNo: "PR-2026-1007", createdAt: isoOffsetHours(-50),
    requestor: "工程 小李", department: "工程",
    partCode: "FB64-FLY18", partName: "18kg 飛輪組", qty: 100, unit: "PCS", estUnitCost: 950,
    requiredDate: "2026-06-25", forWoNo: "WO-2026-0108",
    reason: "工單需料", priority: "P2_high",
    status: "approved", approvalLevel: 2, approvalRequired: 2,
    approvers: [
      { name: "工程主管", status: "approved", at: isoOffsetHours(-40) },
      { name: "副總", status: "approved", at: isoOffsetHours(-36) },
    ],
  },
  {
    id: "pr-008", prNo: "PR-2026-1008", createdAt: isoOffsetHours(-6),
    requestor: "生管 小王", department: "生管",
    partCode: "FB64-RES", partName: "磁控阻力組（8段）", qty: 50, unit: "PCS", estUnitCost: 780,
    requiredDate: "2026-06-30",
    reason: "MRP 觸發 — 安全庫存低於水位", priority: "P3_normal",
    status: "submitted", approvalLevel: 0, approvalRequired: 1,
    approvers: [{ name: "生管主管", status: "pending" }],
  },
  {
    id: "pr-009", prNo: "PR-2026-1009", createdAt: isoOffsetHours(-160),
    requestor: "工程 老陳", department: "工程",
    partCode: "EQ-OLD-PART", partName: "停用件試打樣", qty: 5, unit: "PCS", estUnitCost: 220,
    requiredDate: "2026-06-01",
    reason: "（已不需要）", priority: "P4_low",
    status: "cancelled", approvalLevel: 0, approvalRequired: 2,
    approvers: [{ name: "工程主管", status: "pending" }, { name: "副總", status: "pending" }],
    cancelledReason: "請購人撤回 — 需求變更",
  },
  {
    id: "pr-010", prNo: "PR-2026-1010", createdAt: isoOffsetHours(-3),
    requestor: "設備 阿國", department: "設備",
    partCode: "EQ-IQC-LIGHT", partName: "IQC 工作燈泡", qty: 20, unit: "PCS", estUnitCost: 180,
    requiredDate: "2026-06-10",
    reason: "辦公用品", priority: "P4_low",
    status: "submitted", approvalLevel: 0, approvalRequired: 1,
    approvers: [{ name: "設備主管", status: "pending" }],
  },
];

// ============================================================
// SLA 計算 + Risk Score
// ============================================================
function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

export type PrAttention = {
  pr: Requisition;
  ageHours: number;
  slaPhase: keyof typeof PR_SLA | "n/a" | "done";
  slaOverdueHours: number;       // 超 SLA 多久
  riskScore: number;             // 0-100
  riskBucket: "critical" | "high" | "medium" | "low";
  aiPrediction?: string;         // AI 預測影響
  recommendedAction: string;
};

export function computePrAttention(): PrAttention[] {
  return requisitions.map((pr) => {
    const age = hoursSince(pr.createdAt);
    let slaPhase: keyof typeof PR_SLA | "n/a" | "done" = "n/a";
    let slaTarget = 0;
    if (pr.status === "converted_po" || pr.status === "cancelled") {
      slaPhase = "done";
    } else if (pr.status === "submitted" || pr.status === "approval_pending" || pr.status === "approval_delayed") {
      slaPhase = "approval"; slaTarget = PR_SLA.approval.hours;
    } else if (pr.status === "unassigned") {
      slaPhase = "pr_assign"; slaTarget = PR_SLA.pr_assign.hours;
    } else if (pr.status === "approved") {
      slaPhase = "pr_assign"; slaTarget = PR_SLA.pr_assign.hours;
    } else if (pr.status === "in_rfq") {
      slaPhase = "rfq"; slaTarget = PR_SLA.rfq.hours;
    } else if (pr.status === "blocked") {
      slaPhase = "approval"; slaTarget = PR_SLA.approval.hours;
    }

    const slaOverdue = slaPhase !== "done" && slaPhase !== "n/a" ? Math.max(0, age - slaTarget) : 0;

    // Risk Score（綜合：priority + age + 是否連動 WO + 卡關狀態）
    let risk = 0;
    if (pr.priority === "P1_critical") risk += 40;
    else if (pr.priority === "P2_high") risk += 25;
    else if (pr.priority === "P3_normal") risk += 10;
    if (slaOverdue > 0) risk += Math.min(40, slaOverdue * 0.5);
    if (pr.forWoNo) risk += 15;
    if (pr.status === "blocked") risk += 20;
    if (pr.status === "unassigned" && age > PR_SLA.pr_assign.hours) risk += 15;
    if (pr.status === "approval_delayed") risk += 25;
    risk = Math.min(100, Math.round(risk));

    const bucket: PrAttention["riskBucket"] =
      risk >= 75 ? "critical" :
      risk >= 50 ? "high" :
      risk >= 25 ? "medium" : "low";

    // AI Prediction
    let aiPrediction: string | undefined;
    let recommendedAction: string;
    if (pr.forWoNo) {
      const wo = workOrders.find((w) => w.woNo === pr.forWoNo);
      const m = wo ? models.find((mm) => mm.id === wo.modelId) : undefined;
      const customerStr = pr.forCustomer ?? wo?.customer ?? "客戶";
      const slackHours = Math.max(1, slaTarget - age);
      if (bucket === "critical" || bucket === "high") {
        aiPrediction = `此 PR 若未於 ${Math.round(slackHours)}hr 內轉 PO 將影響：${pr.forWoNo} ${customerStr} ${m?.code ?? ""} → OTD 下降`;
      }
    }
    if (pr.status === "submitted" && pr.approvalLevel === 0) {
      recommendedAction = `📞 催 ${pr.approvers.find((a) => a.status === "pending")?.name ?? "簽核者"} 立即簽核`;
    } else if (pr.status === "approval_delayed") {
      recommendedAction = `🚨 上呈一層 — 簽核已延誤 ${slaOverdue.toFixed(0)}hr`;
    } else if (pr.status === "unassigned") {
      recommendedAction = `👉 立即指派採購 — 已過 ${age.toFixed(0)}hr 無人接手`;
    } else if (pr.status === "blocked") {
      recommendedAction = `🔧 解卡關 — 確認規格 / 找廠商 / 補資訊`;
    } else if (pr.status === "in_rfq") {
      recommendedAction = `📋 追 RFQ 進度 — 預計 ${Math.max(0, (PR_SLA.rfq.hours - age)).toFixed(0)}hr 內出 PO`;
    } else if (pr.status === "approved") {
      recommendedAction = `🛒 採購安排詢價 / 直接下 PO`;
    } else {
      recommendedAction = "—";
    }

    return {
      pr, ageHours: age, slaPhase, slaOverdueHours: slaOverdue,
      riskScore: risk, riskBucket: bucket,
      aiPrediction, recommendedAction,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

// ============================================================
// PR Event Stream — 衍生事件
// ============================================================
export function prEventStream(): PrEvent[] {
  const events: PrEvent[] = [];
  const atts = computePrAttention();
  for (const a of atts) {
    if (a.pr.status === "submitted" && a.ageHours <= 1) {
      events.push({
        id: `pre-${a.pr.id}-created`, prId: a.pr.id, type: "pr_created",
        occurredAt: a.pr.createdAt, severity: "low",
        detail: `${a.pr.requestor} 建立 ${a.pr.prNo} ${a.pr.partName} × ${a.pr.qty}`,
      });
    }
    if (a.pr.status === "approval_delayed") {
      events.push({
        id: `pre-${a.pr.id}-delay`, prId: a.pr.id, type: "pr_approval_delayed",
        occurredAt: a.pr.createdAt, severity: a.riskBucket === "critical" ? "critical" : "high",
        detail: `${a.pr.prNo} 簽核延誤 ${a.slaOverdueHours.toFixed(0)}hr — 卡在 ${a.pr.approvers.find((x) => x.status === "pending")?.name}`,
        affectedWo: a.pr.forWoNo, affectedOtd: a.aiPrediction,
      });
    }
    if (a.pr.status === "unassigned") {
      events.push({
        id: `pre-${a.pr.id}-unassigned`, prId: a.pr.id, type: "pr_unassigned",
        occurredAt: a.pr.createdAt, severity: a.riskBucket === "critical" ? "critical" : "high",
        detail: `${a.pr.prNo} 已核准但無人指派採購 — 已過 ${a.ageHours.toFixed(0)}hr`,
      });
    }
    if (a.pr.status === "blocked") {
      events.push({
        id: `pre-${a.pr.id}-blocked`, prId: a.pr.id, type: "pr_blocked",
        occurredAt: a.pr.createdAt, severity: a.riskBucket === "critical" ? "critical" : "medium",
        detail: `${a.pr.prNo} 卡關 — ${a.pr.cancelledReason ?? "規格/廠商待確認"}`,
      });
    }
    if (a.pr.status === "converted_po") {
      events.push({
        id: `pre-${a.pr.id}-po`, prId: a.pr.id, type: "pr_converted_po",
        occurredAt: a.pr.convertedPoNo ? isoOffsetHours(-180) : a.pr.createdAt,
        severity: "low",
        detail: `${a.pr.prNo} → ${a.pr.convertedPoNo}（已下單）`,
      });
    }
  }
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

// ============================================================
// Procurement Risk Widget — KPI
// ============================================================
export type PrKpis = {
  total: number;
  agingPr: number;          // > 7d 未結
  pr72hr: number;            // > 72hr 未轉 PO
  highRiskPr: number;        // riskBucket = critical
  approvalDelay: number;
  unassignedPr: number;
  inFlight: number;          // 在流程中（未結案）
  doneToday: number;         // 今日轉 PO
};

export function prKpis(): PrKpis {
  const atts = computePrAttention();
  const inFlight = atts.filter((a) => a.pr.status !== "converted_po" && a.pr.status !== "cancelled");
  return {
    total: requisitions.length,
    agingPr: atts.filter((a) => a.ageHours > 7 * 24 && a.pr.status !== "converted_po" && a.pr.status !== "cancelled").length,
    pr72hr: atts.filter((a) => a.ageHours > 72 && a.pr.status !== "converted_po" && a.pr.status !== "cancelled").length,
    highRiskPr: atts.filter((a) => a.riskBucket === "critical").length,
    approvalDelay: requisitions.filter((p) => p.status === "approval_delayed").length,
    unassignedPr: requisitions.filter((p) => p.status === "unassigned").length,
    inFlight: inFlight.length,
    doneToday: requisitions.filter((p) => p.status === "converted_po").length,
  };
}

// ============================================================
// Enterprise Demand Signal Flow（最終版鏈條）
// ============================================================
export const DEMAND_SIGNAL_FLOW = [
  { n: 1,  emoji: "📡", label: "Demand Signal",        zh: "需求訊號",      desc: "客戶下單 / MRP / 安全庫存 / 設備備品" },
  { n: 2,  emoji: "📝", label: "Requisition",          zh: "請購單建立",     desc: "請購人填單（含對應 WO/客戶）" },
  { n: 3,  emoji: "✅", label: "Approval Workflow",     zh: "簽核流程",      desc: "依金額 / 類別走簽核鏈" },
  { n: 4,  emoji: "💎", label: "Procurement",          zh: "採購承接",       desc: "指派買手、RFQ 詢價" },
  { n: 5,  emoji: "🤝", label: "Supplier Collaboration", zh: "供應商協作",   desc: "下 PO、供應商 Ack、ASN" },
  { n: 6,  emoji: "🚚", label: "ASN + Receiving",       zh: "ASN + 收貨",   desc: "ASN 預警 + 收貨 7 階段風控" },
  { n: 7,  emoji: "📦", label: "Inventory",             zh: "庫存入帳",     desc: "WMS 入庫 + DOH 健康" },
  { n: 8,  emoji: "🏭", label: "Production",            zh: "生產投線",     desc: "工單投線 + 8 階段追蹤" },
  { n: 9,  emoji: "🚀", label: "Delivery",              zh: "出貨交付",     desc: "出貨 + OTD/OTIF" },
  { n: 10, emoji: "👥", label: "Customer",              zh: "客戶簽收",     desc: "客戶 OTD 履歷" },
  { n: 11, emoji: "💰", label: "Financial Impact",      zh: "財務影響",     desc: "毛利 / 庫存週轉 / 應收" },
  { n: 12, emoji: "🧠", label: "AI Learning",           zh: "AI 學習",      desc: "案例庫 + 模型自進化" },
];
