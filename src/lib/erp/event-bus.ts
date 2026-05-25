// Event & Workflow Engine — 致命缺口 1 補上
//
// 核心信念：一個事件發生 → 應自動 fan-out 給所有相關模組
//   例如「ASN delay」應同步觸發：
//     · 缺料牆（重新計算停線倒數）
//     · 工單風險（更新預測出貨日）
//     · ETA 預測（重新算到貨機率）
//     · 倉庫排程（重新排收貨槽位）
//     · AI 警訊（push 採購主管）
//     · 採購提醒（建立追蹤項）
//     · 客戶風險（評估是否需通知客戶延誤）
//
// 沒有這層 = 各模組各自為政、決策不一致、靠人工同步。

import { suppliers, parts } from "./seed";

export type EventType =
  | "po_unconfirmed"        // PO 發出 48hr 未確認
  | "asn_missing"           // ASN 缺漏（已逾預定出貨）
  | "asn_delayed"           // ASN 申報 ETA 比原訂晚
  | "iqc_ng"                // 進料品檢不合格
  | "iqc_minor_defect"      // 進料輕微異常
  | "eta_changed"           // ETA 變更（任何原因）
  | "raw_material_surge"    // 原物料暴漲（>2σ）
  | "raw_material_crash"    // 原物料暴跌（<-σ）
  | "supplier_score_drop"   // 供應商風險雷達分數驟降
  | "stockout_imminent"     // 缺料即將停線
  | "receiving_fail_hold";  // 收貨 FAIL 進 HOLD

export type AffectedModule =
  | "shortage_wall"      // 缺料牆
  | "work_order_risk"    // 工單風險
  | "eta_forecast"       // ETA 預測
  | "warehouse_schedule" // 倉庫排程
  | "ai_alert"           // AI 警訊
  | "buyer_reminder"     // 採購提醒
  | "customer_risk"      // 客戶風險
  | "supplier_radar"     // 供應商風險雷達
  | "decision_loop"      // 決策閉環
  | "cost_advisor"       // 採購建議
  | "iqc_quality_card";  // 品質卡

// ============================================================
// 事件 → 下游模組路由表（系統核心）
// ============================================================
export const EVENT_FANOUT: Record<EventType, {
  label: string;
  trigger: string;
  affects: { module: AffectedModule; effect: string; severity: "critical" | "high" | "med" | "low" }[];
}> = {
  po_unconfirmed: {
    label: "PO 未確認 (48hr+)",
    trigger: "PO 發出 48 小時內供應商未在系統上確認",
    affects: [
      { module: "buyer_reminder",  effect: "push 採購電話催單 + 列入高風險戶名單",      severity: "high" },
      { module: "supplier_radar",  effect: "Reliability 維度扣分（PO Ack 時效）",         severity: "med" },
      { module: "eta_forecast",    effect: "該 PO 到貨機率重算（-25%）",                   severity: "high" },
      { module: "shortage_wall",   effect: "若此 PO 對應關鍵料 → 拉高停線風險等級",         severity: "high" },
      { module: "decision_loop",   effect: "若已逾 72hr 自動建立決策（換備援/空運二供）",   severity: "critical" },
    ],
  },
  asn_missing: {
    label: "ASN 缺漏（已逾預定出貨日）",
    trigger: "預定出貨日已過、供應商仍未在系統填 ASN",
    affects: [
      { module: "shortage_wall",   effect: "對應料件停線倒數歸零 → 升 S 級",              severity: "critical" },
      { module: "work_order_risk", effect: "依賴此料的工單紅燈、預測延誤",                 severity: "critical" },
      { module: "eta_forecast",    effect: "該 PO 預測到貨日 +14 天起跳",                  severity: "high" },
      { module: "ai_alert",        effect: "副總/採購主管即時 push（手機簡訊）",             severity: "critical" },
      { module: "buyer_reminder",  effect: "建立追蹤項 24hr 內須確認真實狀態",              severity: "high" },
      { module: "customer_risk",   effect: "評估是否需提前通知客戶可能延誤",                 severity: "high" },
      { module: "supplier_radar",  effect: "Delivery + Reliability 雙維度扣分",             severity: "high" },
    ],
  },
  asn_delayed: {
    label: "ASN 申報 ETA 晚於原訂",
    trigger: "供應商填 ASN 但申報 ETA 比預定到貨晚 N 天",
    affects: [
      { module: "eta_forecast",      effect: "依新 ETA 重算下游影響",                     severity: "high" },
      { module: "work_order_risk",   effect: "受影響工單預測出貨重新計算",                 severity: "high" },
      { module: "warehouse_schedule",effect: "倉庫收貨槽位重排程",                         severity: "med" },
      { module: "shortage_wall",     effect: "若延誤 > 緩衝 → 升級風險等級",               severity: "high" },
      { module: "customer_risk",     effect: "若連動客戶交期 → 建議業務通知客戶",          severity: "high" },
      { module: "supplier_radar",    effect: "Delivery 維度扣分（承諾 vs 實際）",          severity: "med" },
    ],
  },
  iqc_ng: {
    label: "進料 IQC 不合格（重大/退貨）",
    trigger: "進料品檢結果 major_defect 或 rejected",
    affects: [
      { module: "supplier_radar",    effect: "Quality 維度大幅扣分（-15~-60）",            severity: "critical" },
      { module: "iqc_quality_card",  effect: "供應商品質卡記入近期異常",                     severity: "high" },
      { module: "shortage_wall",     effect: "退貨數量列為缺料",                            severity: "high" },
      { module: "decision_loop",     effect: "自動建立決策（退貨/折讓/換批/驗收）",          severity: "critical" },
      { module: "buyer_reminder",    effect: "通知 SQE 啟動 CAR（Corrective Action Request）",severity: "high" },
      { module: "ai_alert",          effect: "副總接到推播 + 紅燈",                          severity: "critical" },
    ],
  },
  iqc_minor_defect: {
    label: "進料 IQC 輕微異常",
    trigger: "進料品檢結果 minor_defect（仍可接受）",
    affects: [
      { module: "supplier_radar",    effect: "Quality 維度小幅扣分（-15）",                 severity: "med" },
      { module: "iqc_quality_card",  effect: "供應商品質卡記入",                              severity: "low" },
      { module: "buyer_reminder",    effect: "建立追蹤項，請供應商說明改善方案",              severity: "med" },
    ],
  },
  eta_changed: {
    label: "ETA 變更",
    trigger: "任何原因導致 PO 預計到貨日改變（早/晚）",
    affects: [
      { module: "work_order_risk",   effect: "重新計算工單預測出貨",                          severity: "med" },
      { module: "warehouse_schedule",effect: "倉庫收貨槽位重排程",                            severity: "med" },
      { module: "shortage_wall",     effect: "停線倒數重新計算",                              severity: "med" },
      { module: "eta_forecast",      effect: "ETA baseline 更新",                              severity: "low" },
    ],
  },
  raw_material_surge: {
    label: "原物料暴漲（>2σ）",
    trigger: "銅/鋁/鋼/塑料/稀土/IC 等價格超出 Mean+2σ",
    affects: [
      { module: "cost_advisor",      effect: "AI 採購建議：進入危險區、暫停加單",              severity: "high" },
      { module: "buyer_reminder",    effect: "通知採購凍結新 PO、消化在途",                    severity: "high" },
      { module: "ai_alert",          effect: "原物料 AI 戰情室紅燈",                            severity: "med" },
    ],
  },
  raw_material_crash: {
    label: "原物料暴跌（<-σ）",
    trigger: "原物料價格跌破 Mean-σ",
    affects: [
      { module: "cost_advisor",      effect: "AI 採購建議：進入低檔/囤貨區、提前備料 45 天",  severity: "med" },
      { module: "buyer_reminder",    effect: "通知採購簽長約鎖價",                              severity: "high" },
    ],
  },
  supplier_score_drop: {
    label: "供應商風險雷達分數驟降",
    trigger: "5 維加權分數本月比上月跌 ≥ 10 分",
    affects: [
      { module: "supplier_radar",    effect: "標記為 momentum=rising 風險上升",                severity: "high" },
      { module: "buyer_reminder",    effect: "通知採購主管準備替代供應商評估",                  severity: "high" },
      { module: "decision_loop",     effect: "建立決策（檢討會議 / 暫停加單 / 評估替代）",      severity: "high" },
    ],
  },
  stockout_imminent: {
    label: "缺料即將停線（S 級）",
    trigger: "缺料牆偵測到 48hr 內某料件將斷",
    affects: [
      { module: "decision_loop",     effect: "自動建立 NOW 緊急決策（3 方案推副總）",          severity: "critical" },
      { module: "ai_alert",          effect: "副總 + 採購主管手機推播",                          severity: "critical" },
      { module: "work_order_risk",   effect: "受影響工單全標紅",                                severity: "critical" },
      { module: "buyer_reminder",    effect: "啟動方案 A（空運加急）執行清單",                  severity: "critical" },
      { module: "customer_risk",     effect: "若連動客戶 → 業務預備溝通",                       severity: "high" },
    ],
  },
  receiving_fail_hold: {
    label: "收貨 FAIL → HOLD",
    trigger: "收貨 7 階段任一步驟失敗",
    affects: [
      { module: "shortage_wall",     effect: "HOLD 量視為缺料",                                 severity: "critical" },
      { module: "supplier_radar",    effect: "Quality + Reliability 雙扣分",                    severity: "high" },
      { module: "iqc_quality_card",  effect: "供應商品質卡記入",                                 severity: "high" },
      { module: "decision_loop",     effect: "建立決策（退貨/折讓/換批）",                       severity: "critical" },
      { module: "buyer_reminder",    effect: "通知採購 + SQE",                                    severity: "high" },
      { module: "ai_alert",          effect: "WMS Dashboard 顯示紅燈異常",                       severity: "high" },
    ],
  },
};

// ============================================================
// 事件 instance（demo seed）
// ============================================================
export type EventInstance = {
  id: string;
  type: EventType;
  occurredAt: string;
  payload: Record<string, unknown>;
  status: "pending" | "fanned_out" | "resolved";
  fanoutTargets: AffectedModule[];
};

export function recentEvents(): EventInstance[] {
  // demo 模擬：依當前 seed 狀態推斷會觸發哪些事件
  const events: EventInstance[] = [];
  // demo 事件範例
  events.push({
    id: "evt-001",
    type: "asn_missing",
    occurredAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    payload: { poNo: "PO-2026-0502", supplier: "莊宏億" },
    status: "fanned_out",
    fanoutTargets: EVENT_FANOUT.asn_missing.affects.map((a) => a.module),
  });
  events.push({
    id: "evt-002",
    type: "po_unconfirmed",
    occurredAt: new Date(Date.now() - 22 * 3600_000).toISOString(),
    payload: { poNo: "PO-2026-0504", supplier: "鈦泰", hoursOverdue: 22 },
    status: "fanned_out",
    fanoutTargets: EVENT_FANOUT.po_unconfirmed.affects.map((a) => a.module),
  });
  events.push({
    id: "evt-003",
    type: "iqc_ng",
    occurredAt: new Date(Date.now() - 4 * 24 * 3600_000).toISOString(),
    payload: { poNo: "PO-2026-0512", supplier: "雙成", part: "鋁合金腳踏板（對）", result: "rejected", defectRate: 14.7 },
    status: "fanned_out",
    fanoutTargets: EVENT_FANOUT.iqc_ng.affects.map((a) => a.module),
  });
  events.push({
    id: "evt-004",
    type: "asn_delayed",
    occurredAt: new Date(Date.now() - 8 * 24 * 3600_000).toISOString(),
    payload: { poNo: "PO-2026-0507", supplier: "祺驊（越南）", delayDays: 2, reason: "紅海危機" },
    status: "fanned_out",
    fanoutTargets: EVENT_FANOUT.asn_delayed.affects.map((a) => a.module),
  });
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
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

void suppliers; void parts;
