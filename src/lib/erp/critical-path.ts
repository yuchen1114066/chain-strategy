// Critical Path（關鍵路徑）+ 瓶頸設備稼動率
//
// 系統要知道：哪個工序 delay 會直接影響出貨。不是所有 delay 都重要。
//   · 關鍵路徑：在 critical path 上的工序，每 delay 1 天 → 出貨 delay 1 天
//   · 非關鍵路徑：有 slack 緩衝，delay 不會立刻影響出貨
//
// 瓶頸設備稼動率：
//   超過 92% → AI 判定：未來 14 天塞車風險高
//   超過 85% → 中度警示

import { workOrders, today } from "./seed";
import type { WorkOrder, StageKey } from "./types";

// 八階段殘餘工時（天）
const STAGE_DURATION: Record<string, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export type StagePathInfo = {
  stage: StageKey;
  label: string;
  status: string;
  plannedDate: string;
  duration: number;       // 該工序計畫天數
  onCriticalPath: boolean;
  slackDays: number;      // 緩衝天數（>0 = 有緩衝；0 = 在 critical path）
};

export type WoCriticalPath = {
  woId: string;
  woNo: string;
  customer: string;
  shipDate: string;
  predictedEnd: string;
  totalSlack: number;     // 整張單的總緩衝
  stages: StagePathInfo[];
  criticalStages: StageKey[];
};

const STAGE_LABEL: Record<string, string> = {
  material: "算料", arrival: "到廠", iqc: "進貨檢驗", line: "生產",
  test: "測試", pack: "包裝", ship: "出貨", customer: "客戶交付",
};

export function computeCriticalPath(wo: WorkOrder): WoCriticalPath {
  // 從今天起算，串接所有未完工序的計畫工時，得到「預測出貨日」
  const incomplete = wo.stages.filter((s) => s.status !== "done").sort((a, b) => a.seq - b.seq);
  const totalRemaining = incomplete.reduce((s, x) => s + (STAGE_DURATION[x.stage] ?? 0), 0);
  const predictedEnd = new Date(today + "T00:00:00Z");
  predictedEnd.setUTCDate(predictedEnd.getUTCDate() + totalRemaining);
  const predictedEndIso = predictedEnd.toISOString().slice(0, 10);
  const totalSlack = daysBetween(predictedEndIso, wo.shipDate);

  // Critical Path：在「客戶要求日」前必須完成的工序。
  // 簡化規則：若 totalSlack ≤ 0（已沒緩衝），所有未完工序都在 critical path。
  // 否則，把總 slack 平均到每個工序，slack 為 0 的就是 critical path。
  // 更嚴謹：bottleneck 工序總是在 critical path。
  const stages: StagePathInfo[] = wo.stages.map((s) => {
    const duration = STAGE_DURATION[s.stage] ?? 0;
    const onCp = s.status !== "done" && (totalSlack <= 0 || duration >= 5);
    return {
      stage: s.stage,
      label: STAGE_LABEL[s.stage] ?? s.stage,
      status: s.status,
      plannedDate: s.plannedDate,
      duration,
      onCriticalPath: onCp,
      slackDays: onCp ? Math.max(0, totalSlack) : totalSlack,
    };
  });

  const criticalStages = stages.filter((s) => s.onCriticalPath).map((s) => s.stage);

  return {
    woId: wo.id,
    woNo: wo.woNo,
    customer: wo.customer,
    shipDate: wo.shipDate,
    predictedEnd: predictedEndIso,
    totalSlack,
    stages,
    criticalStages,
  };
}

export function criticalPathsAll(): WoCriticalPath[] {
  return workOrders
    .filter((w) => w.status !== "done" && w.status !== "cancelled")
    .map(computeCriticalPath);
}

// ============================================================
// 瓶頸設備稼動率（Equipment Utilization）
// ============================================================
export type EquipmentLoad = {
  id: string;
  name: string;        // CNC #3 / 加工線 A / 烘烤爐 / 包裝線 1 …
  stage: string;       // 對應八階段
  utilizationPct: number;
  capacityHoursPerDay: number;
  loadedHoursPerDay: number;
  riskLevel: "ok" | "warn" | "critical";
  aiVerdict: string;
};

// 依在製工單算 14 天負荷
function dayLoadForStage(stage: StageKey): number {
  const activeWos = workOrders.filter((w) => w.status === "active" || w.status === "planning");
  let load = 0;
  for (const w of activeWos) {
    const s = w.stages.find((x) => x.stage === stage);
    if (!s || s.status === "done") continue;
    load += w.qty * (STAGE_DURATION[stage] ?? 1) / 14;
  }
  return load;
}

export function equipmentUtilization(): EquipmentLoad[] {
  // 共 7 個關鍵設備（demo seed — 接鼎新「設備工時表」可換成實時資料）
  const cncLoad = dayLoadForStage("line");
  const iqcLoad = dayLoadForStage("iqc");
  const testLoad = dayLoadForStage("test");
  const packLoad = dayLoadForStage("pack");

  const list: Omit<EquipmentLoad, "riskLevel" | "aiVerdict">[] = [
    { id: "cnc-1",  name: "CNC #1",   stage: "生產",     utilizationPct: Math.min(95, 60 + cncLoad * 1.5),  capacityHoursPerDay: 16, loadedHoursPerDay: 0 },
    { id: "cnc-2",  name: "CNC #2",   stage: "生產",     utilizationPct: Math.min(98, 75 + cncLoad * 1.2),  capacityHoursPerDay: 16, loadedHoursPerDay: 0 },
    { id: "cnc-3",  name: "CNC #3",   stage: "生產",     utilizationPct: 96,                                capacityHoursPerDay: 16, loadedHoursPerDay: 0 }, // 已超 92%
    { id: "iqc-1",  name: "IQC 檢驗台", stage: "進貨檢驗", utilizationPct: Math.min(88, 45 + iqcLoad * 2),    capacityHoursPerDay: 8,  loadedHoursPerDay: 0 },
    { id: "test-1", name: "測試台 A",  stage: "測試",     utilizationPct: Math.min(90, 50 + testLoad * 1.8), capacityHoursPerDay: 16, loadedHoursPerDay: 0 },
    { id: "pack-1", name: "包裝線 1",  stage: "包裝",     utilizationPct: Math.min(85, 55 + packLoad * 1.3), capacityHoursPerDay: 8,  loadedHoursPerDay: 0 },
    { id: "bake-1", name: "烘烤爐",    stage: "生產",     utilizationPct: 78,                                capacityHoursPerDay: 24, loadedHoursPerDay: 0 },
  ];

  return list.map((e) => {
    const u = Math.round(e.utilizationPct);
    e.loadedHoursPerDay = Math.round(e.capacityHoursPerDay * (u / 100) * 10) / 10;
    let risk: EquipmentLoad["riskLevel"] = "ok";
    let verdict = "稼動率正常";
    if (u >= 92) {
      risk = "critical";
      verdict = "超過 92% — 未來 14 天塞車風險高";
    } else if (u >= 85) {
      risk = "warn";
      verdict = "超過 85% — 中度警示，建議分流";
    } else if (u >= 70) {
      verdict = "稼動率健康";
    } else {
      verdict = "稼動率偏低 — 可承接更多單";
    }
    return { ...e, utilizationPct: u, riskLevel: risk, aiVerdict: verdict };
  });
}
