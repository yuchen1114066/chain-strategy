// 瓶頸顧問 — 對每個塞車階段，產生根因分析 + 具體解方
// 設計原則：解方要「具體到能立刻按按鈕做事」，不是泛泛的「加班」

import { workOrders, models, parts, suppliers, bom, today } from "./seed";
import type { WorkOrder, StageKey } from "./types";
import { STAGES } from "./types";

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

function currentStageSeq(wo: WorkOrder): number {
  const inprog = wo.stages.find((s) => s.status === "in_progress");
  if (inprog) return inprog.seq;
  const next = wo.stages.find((s) => s.status !== "done");
  if (next) return next.seq;
  return 8;
}

const STANDARD_DAYS: Record<StageKey, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

export type Cause = {
  description: string;
  likelihood: "high" | "medium" | "low";
};

export type Action = {
  label: string;
  detail: string;
  tone: "danger" | "warning" | "primary" | "neutral";
  effort: "立即" | "1日" | "1週";
  estimatedImpact: string;
};

export type BottleneckAnalysis = {
  stage: StageKey;
  stageLabel: string;
  stageIcon: string;
  stuckWos: WorkOrder[];
  stuckCount: number;
  stuckValue: number;
  avgDwell: number;
  standardDwell: number;
  severity: "warning" | "critical";
  causes: Cause[];
  actions: Action[];
  // 一句話總結（給管理者看的）
  headline: string;
};

export function analyzeBottlenecks(): BottleneckAnalysis[] {
  const result: BottleneckAnalysis[] = [];

  for (const meta of STAGES) {
    const seq = STAGES.findIndex((s) => s.key === meta.key) + 1;
    const wos = workOrders.filter(
      (w) => w.status !== "cancelled" && w.status !== "done" && currentStageSeq(w) === seq
    );
    if (wos.length === 0) continue;

    const dwellSamples: number[] = [];
    for (const w of wos) {
      const prev = w.stages.find((s) => s.seq === seq - 1);
      if (prev?.actualDate) dwellSamples.push(Math.max(0, daysBetween(prev.actualDate, today)));
    }
    const avgDwell = dwellSamples.length
      ? Math.round(dwellSamples.reduce((a, b) => a + b, 0) / dwellSamples.length)
      : 0;
    const std = STANDARD_DAYS[meta.key];
    if (std === 0) continue; // 收尾階段不算瓶頸
    if (avgDwell <= std * 1.5) continue; // 沒超過 1.5×，不算瓶頸

    const severity: "warning" | "critical" = avgDwell > std * 2 ? "critical" : "warning";
    const stuckValue = wos.reduce((s, w) => {
      const m = models.find((m) => m.id === w.modelId);
      return s + (m ? m.stdPrice * w.qty : 0);
    }, 0);

    const { causes, actions, headline } = diagnoseStage(meta.key, wos, avgDwell, std);

    result.push({
      stage: meta.key,
      stageLabel: meta.label,
      stageIcon: meta.icon,
      stuckWos: wos,
      stuckCount: wos.length,
      stuckValue,
      avgDwell,
      standardDwell: std,
      severity,
      causes,
      actions,
      headline,
    });
  }

  return result.sort((a, b) => b.stuckValue - a.stuckValue);
}

// ──────────────────────────────────────────
// 各階段的診斷邏輯（data-aware，看實際資料生成具體建議）
// ──────────────────────────────────────────

function diagnoseStage(
  stage: StageKey,
  wos: WorkOrder[],
  avgDwell: number,
  std: number
): { causes: Cause[]; actions: Action[]; headline: string } {
  switch (stage) {
    case "material":
      return diagnoseMaterial(wos, avgDwell, std);
    case "arrival":
      return diagnoseArrival(wos, avgDwell, std);
    case "iqc":
      return diagnoseIqc(wos, avgDwell, std);
    case "line":
      return diagnoseLine(wos, avgDwell, std);
    case "test":
      return diagnoseTest(wos, avgDwell, std);
    case "pack":
      return diagnosePack(wos, avgDwell, std);
    case "ship":
      return diagnoseShip(wos, avgDwell, std);
    default:
      return { causes: [], actions: [], headline: "" };
  }
}

type Diagnosis = { causes: Cause[]; actions: Action[]; headline: string };

function diagnoseMaterial(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  // 找出涉及的料件中哪些缺料 / 交期長
  const shortageParts = new Map<string, { code: string; name: string; supplier: string; lead: number; need: number; stock: number }>();
  for (const w of wos) {
    const lines = bom.filter((b) => b.modelId === w.modelId && b.isActive);
    for (const l of lines) {
      const p = parts.find((p) => p.id === l.partId);
      if (!p) continue;
      const need = l.qtyPerUnit * w.qty;
      if (p.stockOnHand < need) {
        const sup = suppliers.find((s) => s.id === p.supplierId);
        const ex = shortageParts.get(p.code);
        shortageParts.set(p.code, {
          code: p.code,
          name: p.name,
          supplier: sup?.name ?? "未指定",
          lead: p.leadDays,
          need: (ex?.need ?? 0) + need,
          stock: p.stockOnHand,
        });
      }
    }
  }
  const topShort = [...shortageParts.values()].sort((a, b) => b.lead - a.lead).slice(0, 3);
  const longestLead = topShort[0]?.lead ?? 0;

  const causes: Cause[] = [
    {
      description: `${topShort.length} 種關鍵料件缺料：${topShort.map((p) => p.code).join("、")}`,
      likelihood: "high",
    },
    {
      description: `最長交期 ${longestLead} 天（${topShort[0]?.supplier ?? "—"}），備料節奏跟不上排程`,
      likelihood: "high",
    },
    {
      description: "可能存在尚未下 PO 的料件 — 需採購對單",
      likelihood: "medium",
    },
  ];

  const actions: Action[] = [];
  // 對前 3 個缺料件各生一個追單動作
  for (const sp of topShort.slice(0, 2)) {
    actions.push({
      label: `📞 追單 ${sp.code}`,
      detail: `${sp.name}（缺 ${sp.need - sp.stock}）→ ${sp.supplier}，交期 ${sp.lead} 天`,
      tone: "danger",
      effort: "立即",
      estimatedImpact: `解卡 ${wos.filter((w) => bom.some((b) => b.modelId === w.modelId && parts.find((p) => p.id === b.partId)?.code === sp.code)).length} 張單`,
    });
  }
  actions.push({
    label: "🔄 啟用備援供應商",
    detail: `針對最長交期的 ${topShort[0]?.code ?? "關鍵料"} 詢備援廠家，可能省 30%~50% 交期`,
    tone: "warning",
    effort: "1日",
    estimatedImpact: `預估縮短 ${Math.round(longestLead * 0.4)} 天`,
  });
  actions.push({
    label: "✂️ 拆單分批",
    detail: "先做不缺料的部分組裝 / 半成品，缺料件晚批裝配",
    tone: "primary",
    effort: "立即",
    estimatedImpact: `${Math.round(wos.length * 0.6)} 張單可先動工`,
  });
  actions.push({
    label: "📨 通知業務協商船期",
    detail: `主動對客戶說明，請求延後出貨 ${Math.max(7, longestLead - std)} 天`,
    tone: "neutral",
    effort: "立即",
    estimatedImpact: "避免事後客訴",
  });

  return {
    headline: `${shortageParts.size} 種料缺、最長交期 ${longestLead} 天，平均比標準慢 ${avgDwell - std} 天`,
    causes,
    actions,
  };
}

function diagnoseArrival(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  void std;
  // 算到廠涉及的供應商 + 運送天數
  const suppliersInvolved = new Set<string>();
  let maxTransit = 0;
  for (const w of wos) {
    const lines = bom.filter((b) => b.modelId === w.modelId && b.isActive);
    for (const l of lines) {
      const p = parts.find((p) => p.id === l.partId);
      const sup = suppliers.find((s) => s.id === p?.supplierId);
      if (sup) {
        suppliersInvolved.add(sup.name);
        if (sup.transitDays > maxTransit) maxTransit = sup.transitDays;
      }
    }
  }

  return {
    headline: `海運 / 報關段比預期慢 ${avgDwell} 天`,
    causes: [
      { description: "海運船期延誤（旺季 / 港口塞港）", likelihood: "high" },
      { description: "報關文件不齊 / HS Code 卡關", likelihood: "medium" },
      { description: `供應商出貨延誤（最長 ${maxTransit} 天運輸）`, likelihood: "medium" },
    ],
    actions: [
      { label: "✈️ 急件改空運", detail: "對關鍵料件評估空運成本 vs 誤船損失", tone: "danger", effort: "立即", estimatedImpact: "節省 7~10 天" },
      { label: "📞 催報關代理", detail: "確認文件齊全、HS Code 正確", tone: "warning", effort: "立即", estimatedImpact: "省 1~3 天" },
      { label: "📞 確認船公司艙位", detail: `涉及 ${suppliersInvolved.size} 家海外廠`, tone: "primary", effort: "立即", estimatedImpact: "預知後續延誤" },
    ],
  };
}

function diagnoseIqc(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  return {
    headline: `IQC 比標準慢 ${avgDwell - std} 天 — 可能是來料不良或人力不足`,
    causes: [
      { description: "來料不良率高 / 需大量退貨重發", likelihood: "high" },
      { description: "IQC 人力不足 / 設備排隊", likelihood: "medium" },
      { description: "新供應商首批料件需更嚴格抽檢", likelihood: "low" },
    ],
    actions: [
      { label: "👷 加派 IQC 人力", detail: "從其他班別調 2 人支援 3 天", tone: "primary", effort: "立即", estimatedImpact: "省 50% 等候" },
      { label: "📞 通知供應商品質問題", detail: "若不良率 > 3% 要求重新出貨", tone: "danger", effort: "1日", estimatedImpact: "預防重複發生" },
      { label: "📋 改 AQL 抽檢層級", detail: "可信供應商可放寬抽樣，加速放行", tone: "neutral", effort: "1日", estimatedImpact: "省 1~2 天" },
    ],
  };
}

function diagnoseLine(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  return {
    headline: `產線進度比標準慢 ${avgDwell - std} 天`,
    causes: [
      { description: "產線人力不足或請假", likelihood: "high" },
      { description: "機台故障 / 維修中", likelihood: "medium" },
      { description: "工序卡點 / 上下游節拍不平衡", likelihood: "medium" },
    ],
    actions: [
      { label: "🌙 加開夜班", detail: `${wos.length} 張單加班 3 天，預估清掉積壓`, tone: "danger", effort: "立即", estimatedImpact: `回到正常 ${std}d` },
      { label: "🔧 機台維修排程", detail: "確認所有機台維保狀態，必要時調用備機", tone: "warning", effort: "1日", estimatedImpact: "防再卡關" },
      { label: "📊 工序時間研究", detail: "找出最慢工序、考慮製程改善 / 治具升級", tone: "neutral", effort: "1週", estimatedImpact: "長期 10%~20% 改善" },
    ],
  };
}

function diagnoseTest(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  return {
    headline: `測試段比預期慢 ${avgDwell - std} 天`,
    causes: [
      { description: "不良率高 → 重工 / 重測循環", likelihood: "high" },
      { description: "測試夾具 / 設備不足", likelihood: "medium" },
      { description: "EOL（出廠檢驗）規範變嚴", likelihood: "low" },
    ],
    actions: [
      { label: "🛑 停線根因分析", detail: "若不良率連 2 天 > 3%，立刻停線追原因", tone: "danger", effort: "立即", estimatedImpact: "止血" },
      { label: "🔧 增測試夾具", detail: "找供應商加開夾具，提升並行測試數", tone: "warning", effort: "1週", estimatedImpact: "產能 +50%" },
      { label: "👷 加派 QC 人力", detail: "從其他班別調人，3 班輪替", tone: "primary", effort: "立即", estimatedImpact: "省 30% 等候" },
    ],
  };
}

function diagnosePack(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  // 找出涉及的包材是否缺
  const packMaterials = new Set<string>();
  for (const w of wos) {
    const lines = bom.filter((b) => b.modelId === w.modelId && b.isActive);
    for (const l of lines) {
      const p = parts.find((p) => p.id === l.partId);
      if (p?.category === "包材" && p.stockOnHand < l.qtyPerUnit * w.qty) {
        packMaterials.add(p.code);
      }
    }
  }
  return {
    headline: `包裝段比標準慢 ${avgDwell - std} 天${packMaterials.size > 0 ? ` — 包材短缺 ${[...packMaterials].join("、")}` : ""}`,
    causes: [
      ...(packMaterials.size > 0 ? [{ description: `包材缺料：${[...packMaterials].join("、")}`, likelihood: "high" as const }] : []),
      { description: "包裝工站人力不足", likelihood: "medium" as const },
      { description: "客戶有特殊包裝需求 / 標籤要重印", likelihood: "low" as const },
    ],
    actions: [
      ...(packMaterials.size > 0
        ? [{ label: "📞 追加包材", detail: `補單 ${[...packMaterials].join("、")}`, tone: "danger" as const, effort: "立即" as const, estimatedImpact: "1 週內解卡" }]
        : []),
      { label: "👷 加派包裝人力", detail: "短期調工讀生 / 借調其他線", tone: "primary", effort: "立即", estimatedImpact: "產出 +30%" },
      { label: "📋 簡化包裝 SOP", detail: "與客戶確認可否略過部分客製化標籤", tone: "neutral", effort: "1日", estimatedImpact: "省 20% 工時" },
    ],
  };
}

function diagnoseShip(wos: WorkOrder[], avgDwell: number, std: number): Diagnosis {
  // 列出涉及的目的地
  const destinations = [...new Set(wos.map((w) => w.destination))];
  return {
    headline: `出貨 / 船期比標準慢 ${avgDwell - std} 天 — ${destinations.length} 個目的地`,
    causes: [
      { description: `船公司艙位緊張（${destinations.slice(0, 2).join("、")} 路線）`, likelihood: "high" },
      { description: "報關 / 出口文件處理延遲", likelihood: "medium" },
      { description: "客戶端要求改港 / 改提單", likelihood: "low" },
    ],
    actions: [
      { label: "🚢 確認船公司艙位", detail: `${destinations.length} 條路線都要 double-check`, tone: "danger", effort: "立即", estimatedImpact: "預知後續延誤" },
      { label: "✂️ 拆單分批", detail: "急件先少量空運、大宗後續海運", tone: "warning", effort: "1日", estimatedImpact: "至少救前 30%" },
      { label: "📨 主動通報客戶", detail: "把預期延誤天數告訴客戶，避免客訴", tone: "neutral", effort: "立即", estimatedImpact: "保關係" },
    ],
  };
}
