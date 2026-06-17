// Event Stream — 系統共通能力（不是新增頁面，是基礎建設）
//
// 整合 5 個能力進一個 stream：
//   ① Priority + SLA（事件優先序：Critical 15min / High 1hr / Medium 4hr / Low Daily）
//   ② Deduplication（指紋去重：同類同源 5 分鐘內只算一次）
//   ③ Correlation Engine（事件關聯：20 個警報背後其實同源）
//   ④ Notification Strategy（通知路由：Critical → Teams+SMS / High → Teams / Med → Email / Low → Digest）
//   ⑤ Audit Trace（每個事件含完整 provenance — 來自哪、推到哪、為何發生）
//
// 其他模組（缺料牆、ETA、Risk Radar...）都透過 emit() 推事件，stream 自動處理優先序/去重/關聯/通知/記錄。

export type EventSeverity = "critical" | "high" | "medium" | "low";

// ============================================================
// ① Priority + SLA Matrix
// ============================================================
export const SEVERITY_SLA: Record<EventSeverity, {
  sla: string;           // 必須在多久內處理
  slaMinutes: number;
  channel: string;       // 通知管道
  channels: ("teams" | "sms" | "email" | "digest" | "in_app_red" | "in_app_yellow")[];
  badgeColor: string;
  description: string;
}> = {
  critical: {
    sla: "15 min",
    slaMinutes: 15,
    channel: "Teams + SMS",
    channels: ["teams", "sms", "in_app_red"],
    badgeColor: "#dc2626",
    description: "必延誤 / 停線即將發生 / 退貨 — 主管必須立即介入",
  },
  high: {
    sla: "1 hr",
    slaMinutes: 60,
    channel: "Teams",
    channels: ["teams", "in_app_red"],
    badgeColor: "#f59e0b",
    description: "可能延誤 / 品質異常 — 採購主管 1 小時內處理",
  },
  medium: {
    sla: "4 hr",
    slaMinutes: 240,
    channel: "Email",
    channels: ["email", "in_app_yellow"],
    badgeColor: "#0891b2",
    description: "偏差信號 / 動量變化 — 同日處理即可",
  },
  low: {
    sla: "Daily digest",
    slaMinutes: 1440,
    channel: "Digest",
    channels: ["digest"],
    badgeColor: "#94a3b8",
    description: "日常觀察值 — 隔天統一摘要",
  },
};

export type EventType =
  | "po_unconfirmed" | "asn_missing" | "asn_delayed"
  | "iqc_ng" | "iqc_minor_defect"
  | "eta_changed" | "raw_material_surge" | "raw_material_crash"
  | "supplier_score_drop" | "stockout_imminent" | "receiving_fail_hold";

export type AffectedModule =
  | "shortage_wall" | "work_order_risk" | "eta_forecast"
  | "warehouse_schedule" | "ai_alert" | "buyer_reminder"
  | "customer_risk" | "supplier_radar" | "decision_loop"
  | "cost_advisor" | "iqc_quality_card";

// 各事件預設嚴重度
export const EVENT_SEVERITY: Record<EventType, EventSeverity> = {
  po_unconfirmed: "high",
  asn_missing: "critical",
  asn_delayed: "high",
  iqc_ng: "critical",
  iqc_minor_defect: "medium",
  eta_changed: "medium",
  raw_material_surge: "high",
  raw_material_crash: "low",
  supplier_score_drop: "high",
  stockout_imminent: "critical",
  receiving_fail_hold: "critical",
};

// ============================================================
// 事件指紋（去重用） — 同 fingerprint 5 分鐘內只算一次
// ============================================================
export function fingerprintOf(type: EventType, payload: Record<string, unknown>): string {
  // 主要 key：type + 主要對象（PO/supplier/part）
  const keyParts: string[] = [type];
  if (payload.poNo) keyParts.push(`po=${payload.poNo}`);
  if (payload.supplier) keyParts.push(`sup=${payload.supplier}`);
  if (payload.partCode) keyParts.push(`part=${payload.partCode}`);
  if (payload.commodity) keyParts.push(`mat=${payload.commodity}`);
  return keyParts.join("|");
}

// ============================================================
// ③ Correlation Engine — 事件關聯
//
//   例：ASN missing → 自動衍生「stockout_imminent」、「customer_risk_trigger」
//   這些次生事件不重複通知，標記為 correlationGroup
// ============================================================
export type CorrelationRule = {
  trigger: EventType;
  cascades: EventType[];      // 此事件發生會自動帶出哪些
  groupLabel: string;          // 整組關聯的人類可讀標籤
};

export const CORRELATION_RULES: CorrelationRule[] = [
  {
    trigger: "asn_missing",
    cascades: ["stockout_imminent", "eta_changed"],
    groupLabel: "ASN 延遲連鎖反應",
  },
  {
    trigger: "iqc_ng",
    cascades: ["supplier_score_drop"],
    groupLabel: "進料品質事件鏈",
  },
  {
    trigger: "receiving_fail_hold",
    cascades: ["stockout_imminent", "supplier_score_drop"],
    groupLabel: "收貨 HOLD 影響鏈",
  },
  {
    trigger: "raw_material_surge",
    cascades: ["supplier_score_drop"],
    groupLabel: "原物料暴漲衝擊鏈",
  },
];

// ============================================================
// 事件 instance（強化版）
// ============================================================
export type EventInstance = {
  id: string;
  type: EventType;
  severity: EventSeverity;
  occurredAt: string;
  payload: Record<string, unknown>;
  fingerprint: string;          // 去重 key
  correlationId?: string;        // 同事件鏈共用此 ID（去重時可看出 cluster）
  correlationGroup?: string;     // 群組標籤
  isPrimary: boolean;             // 是否為事件鏈主因
  status: "pending" | "fanned_out" | "acknowledged" | "resolved";
  fanoutTargets: AffectedModule[];
  notifiedChannels: string[];     // 已通知過哪些管道
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  // Audit / Trace
  sourceModule: string;           // 哪個模組 emit 的
  causedBy?: string;               // 父事件 ID
};

// ============================================================
// ④ Notification Strategy — 統一通知路由
// ============================================================
export function notificationChannelsFor(severity: EventSeverity): string[] {
  return SEVERITY_SLA[severity].channels;
}

export function notificationLabelFor(severity: EventSeverity): string {
  return SEVERITY_SLA[severity].channel;
}

// ============================================================
// EVENT_FANOUT — 路由表
// ============================================================
export const EVENT_FANOUT: Record<EventType, {
  label: string;
  trigger: string;
  affects: { module: AffectedModule; effect: string; severity: EventSeverity }[];
}> = {
  po_unconfirmed: {
    label: "PO 未確認 (48hr+)",
    trigger: "PO 發出 48 小時內供應商未在系統確認",
    affects: [
      { module: "buyer_reminder",  effect: "push 採購電話催單 + 列入高風險戶",    severity: "high" },
      { module: "supplier_radar",  effect: "Reliability 維度扣分",                  severity: "medium" },
      { module: "eta_forecast",    effect: "該 PO 到貨機率重算（-25%）",            severity: "high" },
      { module: "shortage_wall",   effect: "若此 PO 對應關鍵料 → 拉高停線等級",      severity: "high" },
      { module: "decision_loop",   effect: "若已逾 72hr 自動建決策（換備援/空運二供）", severity: "critical" },
    ],
  },
  asn_missing: {
    label: "ASN 缺漏（已逾預定出貨日）",
    trigger: "預定出貨日已過、供應商仍未填 ASN",
    affects: [
      { module: "shortage_wall",   effect: "對應料件停線倒數歸零 → 升 S 級",       severity: "critical" },
      { module: "work_order_risk", effect: "依賴此料的工單紅燈、預測延誤",          severity: "critical" },
      { module: "eta_forecast",    effect: "該 PO 預測到貨日 +14 天起跳",           severity: "high" },
      { module: "ai_alert",        effect: "副總/採購主管即時手機 SMS",              severity: "critical" },
      { module: "buyer_reminder",  effect: "建立追蹤項 24hr 內確認真實狀態",         severity: "high" },
      { module: "customer_risk",   effect: "評估是否需提前通知客戶可能延誤",          severity: "high" },
      { module: "supplier_radar",  effect: "Delivery + Reliability 雙扣分",          severity: "high" },
    ],
  },
  asn_delayed: {
    label: "ASN 申報 ETA 晚於原訂",
    trigger: "供應商填 ASN 但申報 ETA 比預定到貨晚 N 天",
    affects: [
      { module: "eta_forecast",      effect: "依新 ETA 重算下游影響",               severity: "high" },
      { module: "work_order_risk",   effect: "受影響工單預測出貨重新計算",           severity: "high" },
      { module: "warehouse_schedule",effect: "倉庫收貨槽位重排程",                   severity: "medium" },
      { module: "shortage_wall",     effect: "若延誤 > 緩衝 → 升級風險等級",         severity: "high" },
      { module: "customer_risk",     effect: "若連動客戶交期 → 業務通知客戶",        severity: "high" },
      { module: "supplier_radar",    effect: "Delivery 維度扣分",                    severity: "medium" },
    ],
  },
  iqc_ng: {
    label: "進料 IQC 不合格（重大/退貨）",
    trigger: "進料品檢結果 major_defect 或 rejected",
    affects: [
      { module: "supplier_radar",    effect: "Quality 維度大幅扣分（-15~-60）",      severity: "critical" },
      { module: "iqc_quality_card",  effect: "供應商品質卡記入近期異常",              severity: "high" },
      { module: "shortage_wall",     effect: "退貨數量列為缺料",                      severity: "high" },
      { module: "decision_loop",     effect: "自動建立決策（退貨/折讓/換批/驗收）",    severity: "critical" },
      { module: "buyer_reminder",    effect: "通知 SQE 啟動 CAR",                     severity: "high" },
      { module: "ai_alert",          effect: "副總接到 Teams+SMS 推播",                severity: "critical" },
    ],
  },
  iqc_minor_defect: {
    label: "進料 IQC 輕微異常",
    trigger: "進料品檢結果 minor_defect（仍可接受）",
    affects: [
      { module: "supplier_radar",    effect: "Quality 維度小幅扣分（-15）",          severity: "medium" },
      { module: "iqc_quality_card",  effect: "供應商品質卡記入",                       severity: "low" },
      { module: "buyer_reminder",    effect: "建立追蹤項，請供應商說明改善方案",        severity: "medium" },
    ],
  },
  eta_changed: {
    label: "ETA 變更",
    trigger: "任何原因導致 PO 預計到貨日改變（早/晚）",
    affects: [
      { module: "work_order_risk",   effect: "重新計算工單預測出貨",                   severity: "medium" },
      { module: "warehouse_schedule",effect: "倉庫收貨槽位重排程",                     severity: "medium" },
      { module: "shortage_wall",     effect: "停線倒數重新計算",                       severity: "medium" },
      { module: "eta_forecast",      effect: "ETA baseline 更新",                       severity: "low" },
    ],
  },
  raw_material_surge: {
    label: "原物料暴漲（>2σ）",
    trigger: "銅/鋁/鋼/塑料/稀土/IC 等價格超出 Mean+2σ",
    affects: [
      { module: "cost_advisor",      effect: "AI 採購建議：進入危險區、暫停加單",      severity: "high" },
      { module: "buyer_reminder",    effect: "通知採購凍結新 PO、消化在途",            severity: "high" },
      { module: "ai_alert",          effect: "原物料 AI 戰情室紅燈",                    severity: "medium" },
    ],
  },
  raw_material_crash: {
    label: "原物料暴跌（<-σ）",
    trigger: "原物料價格跌破 Mean-σ",
    affects: [
      { module: "cost_advisor",      effect: "AI 採購建議：低檔/囤貨區、提前備料 45 天", severity: "medium" },
      { module: "buyer_reminder",    effect: "通知採購簽長約鎖價",                       severity: "high" },
    ],
  },
  supplier_score_drop: {
    label: "供應商風險雷達分數驟降",
    trigger: "5 維加權分數本月比上月跌 ≥ 10 分",
    affects: [
      { module: "supplier_radar",    effect: "標記為 momentum=rising 風險上升",         severity: "high" },
      { module: "buyer_reminder",    effect: "通知採購主管準備替代供應商評估",            severity: "high" },
      { module: "decision_loop",     effect: "建立決策（檢討會議 / 暫停加單 / 替代評估）", severity: "high" },
    ],
  },
  stockout_imminent: {
    label: "缺料即將停線（S 級）",
    trigger: "缺料牆偵測到 48hr 內某料件將斷",
    affects: [
      { module: "decision_loop",     effect: "自動建 NOW 緊急決策（3 方案推副總）",     severity: "critical" },
      { module: "ai_alert",          effect: "副總 + 採購主管手機推播",                  severity: "critical" },
      { module: "work_order_risk",   effect: "受影響工單全標紅",                          severity: "critical" },
      { module: "buyer_reminder",    effect: "啟動方案 A（空運加急）執行清單",            severity: "critical" },
      { module: "customer_risk",     effect: "若連動客戶 → 業務預備溝通",                 severity: "high" },
    ],
  },
  receiving_fail_hold: {
    label: "收貨 FAIL → HOLD",
    trigger: "收貨 7 階段任一步驟失敗",
    affects: [
      { module: "shortage_wall",     effect: "HOLD 量視為缺料",                          severity: "critical" },
      { module: "supplier_radar",    effect: "Quality + Reliability 雙扣分",             severity: "high" },
      { module: "iqc_quality_card",  effect: "供應商品質卡記入",                          severity: "high" },
      { module: "decision_loop",     effect: "建立決策（退貨/折讓/換批）",                severity: "critical" },
      { module: "buyer_reminder",    effect: "通知採購 + SQE",                             severity: "high" },
      { module: "ai_alert",          effect: "WMS Dashboard 顯示紅燈異常",                severity: "high" },
    ],
  },
};

// ============================================================
// 事件實例（demo seed，含 priority + dedup + correlation）
// ============================================================
export function recentEvents(): EventInstance[] {
  // demo: 模擬 3 個 ASN missing 觸發的事件鏈（去重 + 關聯）
  const correlationId1 = "corr-asn-0502";
  const correlationId2 = "corr-iqc-0512";

  const events: EventInstance[] = [
    {
      id: "evt-001", type: "asn_missing",
      severity: EVENT_SEVERITY.asn_missing,
      occurredAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
      payload: { poNo: "PO-2026-0502", supplier: "莊宏億" },
      fingerprint: fingerprintOf("asn_missing", { poNo: "PO-2026-0502" }),
      correlationId: correlationId1,
      correlationGroup: "ASN 延遲連鎖反應 PO-0502",
      isPrimary: true,
      status: "fanned_out",
      fanoutTargets: EVENT_FANOUT.asn_missing.affects.map((a) => a.module),
      notifiedChannels: ["teams", "sms", "in_app_red"],
      sourceModule: "supplier-portal",
    },
    {
      id: "evt-002", type: "stockout_imminent",
      severity: EVENT_SEVERITY.stockout_imminent,
      occurredAt: new Date(Date.now() - 6 * 3600_000 + 30_000).toISOString(),
      payload: { poNo: "PO-2026-0502", partCode: "FB64-FRM", daysToStockout: 2 },
      fingerprint: fingerprintOf("stockout_imminent", { partCode: "FB64-FRM" }),
      correlationId: correlationId1,
      correlationGroup: "ASN 延遲連鎖反應 PO-0502",
      isPrimary: false,
      status: "fanned_out",
      fanoutTargets: EVENT_FANOUT.stockout_imminent.affects.map((a) => a.module),
      notifiedChannels: [],   // 已關聯到 evt-001，不重複通知
      sourceModule: "shortage-ai",
      causedBy: "evt-001",
    },
    {
      id: "evt-003", type: "po_unconfirmed",
      severity: EVENT_SEVERITY.po_unconfirmed,
      occurredAt: new Date(Date.now() - 22 * 3600_000).toISOString(),
      payload: { poNo: "PO-2026-0504", supplier: "鈦泰", hoursOverdue: 22 },
      fingerprint: fingerprintOf("po_unconfirmed", { poNo: "PO-2026-0504" }),
      isPrimary: true,
      status: "fanned_out",
      fanoutTargets: EVENT_FANOUT.po_unconfirmed.affects.map((a) => a.module),
      notifiedChannels: ["teams", "in_app_red"],
      sourceModule: "supplier-portal",
    },
    {
      id: "evt-004", type: "iqc_ng",
      severity: EVENT_SEVERITY.iqc_ng,
      occurredAt: new Date(Date.now() - 4 * 24 * 3600_000).toISOString(),
      payload: { poNo: "PO-2026-0512", supplier: "雙成", part: "鋁合金腳踏板（對）", result: "rejected", defectRate: 14.7 },
      fingerprint: fingerprintOf("iqc_ng", { poNo: "PO-2026-0512" }),
      correlationId: correlationId2,
      correlationGroup: "進料品質事件鏈 雙成-0512",
      isPrimary: true,
      status: "acknowledged",
      fanoutTargets: EVENT_FANOUT.iqc_ng.affects.map((a) => a.module),
      notifiedChannels: ["teams", "sms", "in_app_red"],
      acknowledgedBy: "副總（peko）", acknowledgedAt: new Date(Date.now() - 3.5 * 24 * 3600_000).toISOString(),
      sourceModule: "wms-receiving",
    },
    {
      id: "evt-005", type: "supplier_score_drop",
      severity: EVENT_SEVERITY.supplier_score_drop,
      occurredAt: new Date(Date.now() - 4 * 24 * 3600_000 + 60_000).toISOString(),
      payload: { supplier: "雙成", from: 82, to: 65, delta: -17 },
      fingerprint: fingerprintOf("supplier_score_drop", { supplier: "雙成" }),
      correlationId: correlationId2,
      correlationGroup: "進料品質事件鏈 雙成-0512",
      isPrimary: false,
      status: "fanned_out",
      fanoutTargets: EVENT_FANOUT.supplier_score_drop.affects.map((a) => a.module),
      notifiedChannels: [],   // 同 correlation group，不重複通知
      sourceModule: "supplier-audit",
      causedBy: "evt-004",
    },
    {
      id: "evt-006", type: "asn_delayed",
      severity: EVENT_SEVERITY.asn_delayed,
      occurredAt: new Date(Date.now() - 8 * 24 * 3600_000).toISOString(),
      payload: { poNo: "PO-2026-0507", supplier: "祺驊（越南）", delayDays: 2, reason: "紅海危機" },
      fingerprint: fingerprintOf("asn_delayed", { poNo: "PO-2026-0507" }),
      isPrimary: true,
      status: "resolved",
      fanoutTargets: EVENT_FANOUT.asn_delayed.affects.map((a) => a.module),
      notifiedChannels: ["teams", "in_app_red"],
      sourceModule: "supplier-portal",
    },
  ];

  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

// ============================================================
// 事件統計
// ============================================================
export type StreamStats = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  pending: number;
  acknowledged: number;
  uniqueGroups: number;       // 不同事件鏈數（去重後）
  notificationsSent: number;
};

export function streamStats(): StreamStats {
  const events = recentEvents();
  const groups = new Set(events.map((e) => e.correlationId ?? e.id));
  return {
    total: events.length,
    critical: events.filter((e) => e.severity === "critical").length,
    high: events.filter((e) => e.severity === "high").length,
    medium: events.filter((e) => e.severity === "medium").length,
    low: events.filter((e) => e.severity === "low").length,
    pending: events.filter((e) => e.status === "pending" || e.status === "fanned_out").length,
    acknowledged: events.filter((e) => e.status === "acknowledged" || e.status === "resolved").length,
    uniqueGroups: groups.size,
    notificationsSent: events.reduce((s, e) => s + e.notifiedChannels.length, 0),
  };
}

export const MODULE_META: Record<AffectedModule, { label: string; emoji: string; href: string }> = {
  shortage_wall:       { label: "缺料牆",        emoji: "🧱", href: "/erp/shortage-wall" },
  work_order_risk:     { label: "工單風險",      emoji: "📋", href: "/erp/work-orders" },
  eta_forecast:        { label: "ETA 預測",      emoji: "🔮", href: "/erp/eta-forecast" },
  warehouse_schedule:  { label: "倉庫排程",      emoji: "📅", href: "/erp/calendar" },
  ai_alert:            { label: "AI 警訊",       emoji: "🚨", href: "/erp/alerts" },
  buyer_reminder:      { label: "採購提醒",      emoji: "📌", href: "/erp/decisions" },
  customer_risk:       { label: "客戶風險",      emoji: "👥", href: "/erp/customers" },
  supplier_radar:      { label: "供應商風險雷達", emoji: "🛰", href: "/erp/supplier-portal/audit" },
  decision_loop:       { label: "決策閉環",      emoji: "🔁", href: "/erp/decisions" },
  cost_advisor:        { label: "採購建議",      emoji: "💎", href: "/erp/materials" },
  iqc_quality_card:    { label: "品質卡",        emoji: "🔬", href: "/erp/supplier-portal" },
};
