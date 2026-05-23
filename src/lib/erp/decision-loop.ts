// 決策閉環引擎 — Decision Loop Engine
//
// 副總在訂單衝擊模擬器選好方案後，系統必須：
//   ① 自動展開：方案 → 具體 Actions（採購單 / 通知客戶 / 延後工單 / 鎖定承諾日）
//   ② 自動執行：每個 Action 進入「待辦 → 執行中 → 完成」狀態機
//   ③ 自動追蹤：偵測進度落後 / 風險升級
//   ④ 自動回報：閉環結束時 push 結果（守住營收 / 損失 / 客戶反應）
//
// 對鼎新唯讀，所有 Action 都是「指示給人/外部系統」的工作項，不直接回寫鼎新。

import { models, parts, suppliers, workOrders } from "./seed";
import { simulateOrderImpact, type SimInput, type ImpactResult } from "./order-impact";

export type DecisionStatus = "in_progress" | "done" | "at_risk" | "failed";
export type ActionStatus = "pending" | "in_progress" | "done" | "failed" | "escalated";
export type LoopPhase = "phase1_lock" | "phase2_dispatch" | "phase3_track" | "phase4_settle";

export type LoopPhaseKey = LoopPhase | "phase5_learn";
export const LOOP_PHASES: { key: LoopPhaseKey; label: string; window: string; desc: string }[] = [
  { key: "phase1_lock",     label: "① 方案鎖定 + 任務拆解",   window: "30 秒內",      desc: "副總拍板瞬間 → 系統把方案展開成 4-6 個 Actions（owner / 截止）" },
  { key: "phase2_dispatch", label: "② 自動派工 + 通知",       window: "同步發生",      desc: "Actions 同時派發給採購 / 業務 / PM / 倉管，逾時自動升級給主管" },
  { key: "phase3_track",    label: "③ 即時進度追蹤",          window: "整個執行週期",  desc: "每張 Action 狀態自動推進，超 1.5× 截止 → at_risk 升級" },
  { key: "phase4_settle",   label: "④ 成本/績效自動回填",     window: "閉環結束",      desc: "守住營收 / 額外成本 / 客戶反應 / 寫入副總準確度 + 供應商評分" },
  { key: "phase5_learn",    label: "⑤ 知識沉澱 + AI 學習",    window: "長期最值錢",    desc: "案例庫累積 → 下次遇到同模式情境，AI 主動帶出歷史成功率、建議調整方案" },
];

export function currentPhase(d: Decision): LoopPhase {
  if (d.status === "done" || d.status === "failed") return "phase4_settle";
  const anyInProgressOrDone = d.actions.some((a) => a.status === "in_progress" || a.status === "done");
  if (!anyInProgressOrDone) return "phase2_dispatch";
  return "phase3_track";
}
export type ActionKind =
  | "place_air_po"          // 下空運加急 PO
  | "track_po_eta"           // 追蹤 PO ETA
  | "defer_wo"               // 延後低毛利工單
  | "notify_squeezed"        // 通知被排擠客戶
  | "send_promise_letter"    // 發新承諾日通知信給客戶
  | "track_customer_reply"   // 追蹤客戶回應
  | "iqc_check"              // 加急料件到廠後的 IQC
  | "release_to_line"        // 投線
  | "verify_otd";            // 驗收 OTD 是否守住

export type ActionItem = {
  id: string;
  kind: ActionKind;
  title: string;
  detail: string;
  owner: string;          // 採購 / 業務 / PM / 倉管
  escalateTo?: string;    // 逾時升級對象（例：採購主管 / 副總）
  dueOffsetHours: number; // 從決策時點起算幾小時內要做
  status: ActionStatus;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  escalatedAt?: string;
  supplierId?: string;    // 若是空運 PO，記錄供應商 → 用於評分
};

export type DecisionOutcome = {
  closedAt: string;
  result: "success" | "partial" | "failed";
  revenueSaved: number;
  extraCost: number;
  budgetOverrunPct: number;   // 額外成本 vs 預估的超支 %
  onTime: boolean;            // 是否在目標日達成
  customerReaction?: string;
  note: string;
  // 供應商評分（每張加急 PO 的回饋）
  supplierScorecard?: { supplierId: string; promised: boolean; delivered: boolean }[];
};

export type Decision = {
  id: string;
  createdAt: string;        // ISO
  // 原始模擬輸入 + 結果快照
  input: SimInput;
  chosenPlanCode: "A" | "B" | "C";
  chosenPlanTitle: string;
  modelCode: string;
  modelName: string;
  qty: number;
  customer?: string;
  newShipDate: string;
  estRevenue: number;
  // 公開化（前提條件 2）— 誰拍板？對所有人可見
  decisionMaker: string;    // 副總名字 / 部門主管名字
  aiRecommended: "A" | "B" | "C";   // AI 當下推薦哪個 → 用來比對副總是否覆蓋 AI 建議
  // 閉環
  status: DecisionStatus;
  actions: ActionItem[];
  outcome?: DecisionOutcome;
};

// ============================================================
// 方案 → Actions 展開
// ============================================================
function planAActions(impact: ImpactResult): ActionItem[] {
  const shortParts = impact.materials.filter((m) => m.shortage > 0);
  const actions: ActionItem[] = [];
  shortParts.forEach((m, idx) => {
    actions.push({
      id: `a-po-${idx}`,
      kind: "place_air_po",
      title: `下空運 PO：${m.part.code} × ${m.shortage} ${m.part.unit}`,
      detail: `供應商 ${m.supplier ?? "—"}　·　空運交期 ~3 天　·　成本 +30% ≈ NT$ ${Math.round(m.shortage * m.part.unitCost * 0.30).toLocaleString()}`,
      owner: "採購",
      escalateTo: "採購主管",
      dueOffsetHours: 2,
      status: "pending",
      supplierId: m.part.supplierId,
    });
  });
  if (shortParts.length > 0) {
    actions.push({
      id: "a-track",
      kind: "track_po_eta",
      title: `追蹤 ${shortParts.length} 張 PO 的 ETA / 海關 / 倉到`,
      detail: "每 12hr 更新 ETA；若落後 → 自動升級到 PM",
      owner: "採購",
      escalateTo: "採購主管",
      dueOffsetHours: 72,
      status: "pending",
    });
    actions.push({
      id: "a-iqc",
      kind: "iqc_check",
      title: "料件到廠 IQC 快速驗收（加急）",
      detail: "預留 IQC 加急通道，避免在進貨檢驗卡關",
      owner: "倉管 / 品保",
      dueOffsetHours: 96,
      status: "pending",
    });
  }
  actions.push({
    id: "a-release",
    kind: "release_to_line",
    title: "全料到齊 → 投線生產",
    detail: "排定產線時段、通知產線主管",
    owner: "PM",
    dueOffsetHours: shortParts.length > 0 ? 120 : 24,
    status: "pending",
  });
  actions.push({
    id: "a-verify",
    kind: "verify_otd",
    title: `驗證 OTD：${impact.input.newShipDate} 是否如期出貨`,
    detail: "若延後 → 自動觸發二次決策（降到方案 C）",
    owner: "PM",
    dueOffsetHours: 24 * Math.max(1, impact.daysToNewShip),
    status: "pending",
  });
  return actions;
}

function planBActions(impact: ImpactResult): ActionItem[] {
  const sq = impact.squeezed[0];
  const actions: ActionItem[] = [];
  if (sq) {
    actions.push({
      id: "b-defer",
      kind: "defer_wo",
      title: `延後工單 ${sq.wo.woNo}（${sq.modelCode}）${sq.suggestedDeferDays} 天`,
      detail: `${sq.wo.customer}　·　單價 $${sq.margin.toLocaleString()}　·　影響營收 $${(sq.revenueAtRisk / 10000).toFixed(0)} 萬（暫緩非取消）`,
      owner: "PM",
      dueOffsetHours: 4,
      status: "pending",
    });
    actions.push({
      id: "b-notify",
      kind: "notify_squeezed",
      title: `通知客戶 ${sq.wo.customer} 延後 ${sq.suggestedDeferDays} 天`,
      detail: "業務寄出延後通知信（草稿系統已備）+ 電話確認",
      owner: "業務",
      dueOffsetHours: 8,
      status: "pending",
    });
    actions.push({
      id: "b-reply",
      kind: "track_customer_reply",
      title: `追蹤 ${sq.wo.customer} 是否接受延後`,
      detail: "若拒絕 → 自動升級：改方案 A 或 C；觸發二次決策",
      owner: "業務",
      dueOffsetHours: 48,
      status: "pending",
    });
  }
  actions.push({
    id: "b-release",
    kind: "release_to_line",
    title: "本單投線生產（搶用釋放的產能/料件）",
    detail: "排定產線時段",
    owner: "PM",
    dueOffsetHours: 24,
    status: "pending",
  });
  actions.push({
    id: "b-verify",
    kind: "verify_otd",
    title: `驗證 OTD：${impact.input.newShipDate} 是否如期出貨`,
    detail: "同步驗證被排擠單是否真的延後（避免雙重失敗）",
    owner: "PM",
    dueOffsetHours: 24 * Math.max(1, impact.daysToNewShip),
    status: "pending",
  });
  return actions;
}

function planCActions(impact: ImpactResult, promiseDate?: string): ActionItem[] {
  const actions: ActionItem[] = [];
  actions.push({
    id: "c-letter",
    kind: "send_promise_letter",
    title: `發新承諾日通知信給 ${impact.input.customer ?? "客戶"}`,
    detail: `新承諾交期：${promiseDate ?? impact.input.newShipDate}（系統已備中英雙語草稿）`,
    owner: "業務",
    dueOffsetHours: 4,
    status: "pending",
  });
  actions.push({
    id: "c-reply",
    kind: "track_customer_reply",
    title: "追蹤客戶是否接受 / 還是改下對手",
    detail: "若拒絕且改下對手 → 自動產出損失報告；若接受 → 鎖定新交期",
    owner: "業務",
    dueOffsetHours: 24,
    status: "pending",
  });
  actions.push({
    id: "c-release",
    kind: "release_to_line",
    title: "客戶接受後 → 投線生產",
    detail: "依新承諾日重新排程",
    owner: "PM",
    dueOffsetHours: 48,
    status: "pending",
  });
  actions.push({
    id: "c-verify",
    kind: "verify_otd",
    title: `驗證 OTD：是否在 ${promiseDate ?? "新承諾日"} 前完成`,
    detail: "二次失敗 → 升級到副總",
    owner: "PM",
    dueOffsetHours: 24 * Math.max(1, impact.daysToNewShip),
    status: "pending",
  });
  return actions;
}

// ============================================================
// 建立決策（副總拍板的入口）
// ============================================================
export function createDecision(input: SimInput, planCode: "A" | "B" | "C", decisionMaker: string = "副總"): Decision {
  const impact = simulateOrderImpact(input);
  const plan = impact.plans.find((p) => p.code === planCode)!;
  const aiRecommended = impact.plans.find((p) => p.recommended)?.code ?? "A";
  const m = models.find((x) => x.code === input.modelCode)!;

  let actions: ActionItem[];
  if (planCode === "A") actions = planAActions(impact);
  else if (planCode === "B") actions = planBActions(impact);
  else actions = planCActions(impact, plan.promiseDate);

  return {
    id: `D-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    input,
    chosenPlanCode: planCode,
    chosenPlanTitle: plan.title,
    modelCode: m.code,
    modelName: m.name,
    qty: input.qty,
    customer: input.customer,
    newShipDate: input.newShipDate,
    estRevenue: m.stdPrice * input.qty,
    decisionMaker,
    aiRecommended,
    status: "in_progress",
    actions,
  };
}

// ============================================================
// 狀態推進：基於時間自動推進 actions（demo 用，正式版會接事件）
// ============================================================
export function advanceDecision(d: Decision, nowIso: string = new Date().toISOString()): Decision {
  const createdMs = new Date(d.createdAt).getTime();
  const nowMs = new Date(nowIso).getTime();
  const elapsedHours = (nowMs - createdMs) / 3_600_000;

  const updated = d.actions.map((a) => {
    if (a.status === "done" || a.status === "failed") return a;
    // 啟動：到了 dueOffset 的 30% 開始
    const startAt = a.dueOffsetHours * 0.3;
    const completeAt = a.dueOffsetHours * 0.95;
    const escalateAt = a.dueOffsetHours * 1.5;
    if (elapsedHours >= completeAt) {
      return {
        ...a,
        status: "done" as ActionStatus,
        startedAt: a.startedAt ?? new Date(createdMs + startAt * 3_600_000).toISOString(),
        completedAt: new Date(createdMs + completeAt * 3_600_000).toISOString(),
        result: simulatedResult(a),
      };
    }
    if (elapsedHours >= escalateAt && a.status !== "escalated") {
      return {
        ...a,
        status: "escalated" as ActionStatus,
        escalatedAt: new Date(createdMs + escalateAt * 3_600_000).toISOString(),
        startedAt: a.startedAt ?? new Date(createdMs + startAt * 3_600_000).toISOString(),
      };
    }
    if (elapsedHours >= startAt) {
      return {
        ...a,
        status: "in_progress" as ActionStatus,
        startedAt: a.startedAt ?? new Date(createdMs + startAt * 3_600_000).toISOString(),
      };
    }
    return a;
  });

  const allDone = updated.every((a) => a.status === "done");
  const anyFailed = updated.some((a) => a.status === "failed");
  // 風險偵測：若有 action 超過 dueOffsetHours × 1.5 還沒完成 → at_risk
  const atRisk = updated.some((a) =>
    a.status !== "done" && a.status !== "failed" && elapsedHours > a.dueOffsetHours * 1.5
  );

  const newStatus: DecisionStatus = anyFailed ? "failed"
    : allDone ? "done"
    : atRisk ? "at_risk"
    : "in_progress";

  let outcome = d.outcome;
  if (newStatus === "done" && !outcome) {
    outcome = simulateOutcome(d);
  }

  return { ...d, actions: updated, status: newStatus, outcome };
}

function simulatedResult(a: ActionItem): string {
  switch (a.kind) {
    case "place_air_po": return "PO 已下、供應商已確認、ETA 3 天內";
    case "track_po_eta": return "全部 PO 如期到貨";
    case "iqc_check": return "IQC 通過，無不良";
    case "defer_wo": return "工單已延後排程，新排程已通知產線";
    case "notify_squeezed": return "客戶已收到延後通知";
    case "send_promise_letter": return "承諾日通知信已寄出";
    case "track_customer_reply": return "客戶回覆：接受新交期";
    case "release_to_line": return "已投線、產線確認排程";
    case "verify_otd": return "OTD 達成，如期出貨";
    default: return "完成";
  }
}

function simulateOutcome(d: Decision): DecisionOutcome {
  const planCode = d.chosenPlanCode;
  const revenue = d.estRevenue;
  const supplierScorecard = d.actions
    .filter((a) => a.kind === "place_air_po" && a.supplierId)
    .map((a) => ({
      supplierId: a.supplierId!,
      promised: true,
      delivered: a.status === "done",
    }));
  if (planCode === "A") {
    const expectedExtra = Math.round(revenue * 0.05);
    const overrun = Math.random() < 0.15 ? 0.18 : 0.02; // 15% 機率超支
    const extraCost = Math.round(expectedExtra * (1 + overrun));
    return {
      closedAt: new Date().toISOString(),
      result: "success",
      revenueSaved: revenue,
      extraCost,
      budgetOverrunPct: overrun * 100,
      onTime: true,
      customerReaction: "客戶滿意，如期收貨",
      note: `加急採購完成，OTD 達成；額外成本 NT$ ${extraCost.toLocaleString()} vs 守住營收 NT$ ${revenue.toLocaleString()} → ROI 正向`,
      supplierScorecard,
    };
  }
  if (planCode === "B") {
    return {
      closedAt: new Date().toISOString(),
      result: "success",
      revenueSaved: revenue,
      extraCost: 0,
      budgetOverrunPct: 0,
      onTime: true,
      customerReaction: "本單客戶滿意；被排擠客戶接受延後",
      note: "本單 OTD 守住、被排擠單延後 7 天但客戶接受；無額外成本",
      supplierScorecard,
    };
  }
  return {
    closedAt: new Date().toISOString(),
    result: "partial",
    revenueSaved: revenue,
    extraCost: 0,
    budgetOverrunPct: 0,
    onTime: false,
    customerReaction: "客戶接受新承諾日",
    note: "依新承諾日交付；客戶 OTD 受影響但訂單守住",
    supplierScorecard,
  };
}

// ============================================================
// LocalStorage 持久化（demo；正式版接 erp_decisions table）
// ============================================================
const STORAGE_KEY = "gascc.decisions";

export function loadDecisions(): Decision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Decision[];
    return list.map((d) => advanceDecision(d));
  } catch {
    return [];
  }
}

export function saveDecision(d: Decision): void {
  if (typeof window === "undefined") return;
  const list = loadDecisions().filter((x) => x.id !== d.id);
  list.unshift(d);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteDecision(id: string): void {
  if (typeof window === "undefined") return;
  const list = loadDecisions().filter((x) => x.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function findDecision(id: string): Decision | null {
  return loadDecisions().find((d) => d.id === id) ?? null;
}

// ============================================================
// 第四階段：績效自動回填 — 副總個人決策準確度（公開化）
// ============================================================
export type DecisionMakerScore = {
  decisionMaker: string;
  total: number;
  onTimePct: number;      // 目標日完成
  overrunPct: number;     // 超支 > 10%
  failedPct: number;      // 失敗
  followedAiPct: number;  // 跟 AI 推薦一致的比例（公開化評估）
  topPlan: "A" | "B" | "C";
  cases: Decision[];
};

export function performanceByDecisionMaker(): DecisionMakerScore[] {
  const all = loadDecisions();
  const closed = all.filter((d) => d.status === "done" || d.status === "failed");
  const groups = new Map<string, Decision[]>();
  for (const d of closed) {
    const k = d.decisionMaker ?? "副總";
    const arr = groups.get(k) ?? [];
    arr.push(d);
    groups.set(k, arr);
  }
  return [...groups.entries()].map(([decisionMaker, cases]) => {
    const onTime = cases.filter((c) => c.outcome?.onTime).length;
    const overrun = cases.filter((c) => (c.outcome?.budgetOverrunPct ?? 0) > 10).length;
    const failed = cases.filter((c) => c.status === "failed" || c.outcome?.result === "failed").length;
    const followed = cases.filter((c) => c.chosenPlanCode === c.aiRecommended).length;
    const planCounts = { A: 0, B: 0, C: 0 } as Record<"A" | "B" | "C", number>;
    cases.forEach((c) => { planCounts[c.chosenPlanCode] += 1; });
    const topPlan = (Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A") as "A" | "B" | "C";
    return {
      decisionMaker,
      total: cases.length,
      onTimePct: cases.length ? (onTime / cases.length) * 100 : 0,
      overrunPct: cases.length ? (overrun / cases.length) * 100 : 0,
      failedPct: cases.length ? (failed / cases.length) * 100 : 0,
      followedAiPct: cases.length ? (followed / cases.length) * 100 : 0,
      topPlan,
      cases,
    };
  }).sort((a, b) => b.onTimePct - a.onTimePct);
}

// ============================================================
// 供應商緊急應急能力評分 — 哪些供應商說加急真的能配合
// ============================================================
export type SupplierEmergencyScore = {
  supplierId: string;
  supplierName: string;
  total: number;          // 被指派加急的次數
  delivered: number;       // 真的如期配合
  reliability: number;     // 配合率 %
  grade: "A" | "B" | "C" | "D";
  recentCases: { decisionId: string; delivered: boolean; date: string }[];
};

export function supplierEmergencyScores(): SupplierEmergencyScore[] {
  const all = loadDecisions();
  const map = new Map<string, { total: number; delivered: number; cases: SupplierEmergencyScore["recentCases"] }>();
  for (const d of all) {
    const sc = d.outcome?.supplierScorecard ?? [];
    for (const row of sc) {
      const ex = map.get(row.supplierId) ?? { total: 0, delivered: 0, cases: [] };
      ex.total += 1;
      if (row.delivered) ex.delivered += 1;
      ex.cases.push({ decisionId: d.id, delivered: row.delivered, date: d.outcome?.closedAt ?? d.createdAt });
      map.set(row.supplierId, ex);
    }
  }
  return [...map.entries()].map(([supplierId, v]) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const reliability = v.total > 0 ? (v.delivered / v.total) * 100 : 0;
    const grade: SupplierEmergencyScore["grade"] =
      reliability >= 90 ? "A" : reliability >= 75 ? "B" : reliability >= 50 ? "C" : "D";
    return {
      supplierId,
      supplierName: supplier?.name ?? supplierId,
      total: v.total,
      delivered: v.delivered,
      reliability,
      grade,
      recentCases: v.cases.slice(0, 10),
    };
  }).sort((a, b) => b.reliability - a.reliability);
}

// ============================================================
// 第五階段：知識沉澱 + AI 學習 — 案例庫
// ============================================================
export type CaseEntry = {
  decisionId: string;
  modelCode: string;
  qty: number;
  daysToShip: number;
  shortageCount: number;
  chosenPlan: "A" | "B" | "C";
  outcome: "success" | "partial" | "failed";
  onTime: boolean;
  customer?: string;
  closedAt: string;
};

export function buildCaseLibrary(): CaseEntry[] {
  return loadDecisions()
    .filter((d) => d.outcome)
    .map((d) => {
      const impact = simulateOrderImpact(d.input);
      return {
        decisionId: d.id,
        modelCode: d.modelCode,
        qty: d.qty,
        daysToShip: impact.daysToNewShip,
        shortageCount: impact.materialShortageCount,
        chosenPlan: d.chosenPlanCode,
        outcome: d.outcome!.result,
        onTime: d.outcome!.onTime,
        customer: d.customer,
        closedAt: d.outcome!.closedAt,
      };
    });
}

// AI 從案例庫學習：給定情境，回傳「歷史上類似情境的成功率」
export type CaseInsight = {
  similarCount: number;
  successRate: number;
  bestPlan: "A" | "B" | "C";
  bestPlanSuccessRate: number;
  warning?: string;
};

export function searchCases(input: SimInput): CaseInsight {
  const lib = buildCaseLibrary();
  const impact = simulateOrderImpact(input);
  // 相似 = 同機種 ± 50% 數量 + 缺料件數 ±2
  const similar = lib.filter((c) =>
    c.modelCode === input.modelCode &&
    Math.abs(c.qty - input.qty) <= input.qty * 0.5 &&
    Math.abs(c.shortageCount - impact.materialShortageCount) <= 2
  );
  if (similar.length === 0) {
    return { similarCount: 0, successRate: 0, bestPlan: "A", bestPlanSuccessRate: 0 };
  }
  const success = similar.filter((c) => c.outcome === "success").length;
  const planStats = { A: { total: 0, success: 0 }, B: { total: 0, success: 0 }, C: { total: 0, success: 0 } };
  similar.forEach((c) => {
    planStats[c.chosenPlan].total += 1;
    if (c.outcome === "success") planStats[c.chosenPlan].success += 1;
  });
  let bestPlan: "A" | "B" | "C" = "A";
  let bestRate = 0;
  (["A", "B", "C"] as const).forEach((k) => {
    if (planStats[k].total === 0) return;
    const r = planStats[k].success / planStats[k].total;
    if (r > bestRate) { bestRate = r; bestPlan = k; }
  });
  return {
    similarCount: similar.length,
    successRate: (success / similar.length) * 100,
    bestPlan,
    bestPlanSuccessRate: bestRate * 100,
    warning: success / similar.length < 0.6 ? "歷史上此情境成功率偏低 — 建議副總親自介入" : undefined,
  };
}

// 排除未使用引入（保留型別供未來擴充）
void parts; void workOrders;
