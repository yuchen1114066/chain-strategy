// 鉞泰軸心 SPC + SPEC — 來自實際進料檢驗成績表
//
// 圖號 P03SG007-0 版　·　品名：軸心　·　材質：S45C　·　硬度 58-63 HRc
// 廠商：鉞泰（s8）
// 資料來源：QQP04F03A 進料檢驗報告 × 3 批（2026/1/20、2/12、5/15）
//
// 設計目標：
//   ① 把每項規格的 USL/LSL 數位化，讓系統知道「什麼叫合格」
//   ② 每批進料 8 件量測值自動算 Mean/σ/Cp/Cpk
//   ③ 任何量測值超出 USL/LSL → 自動標紅 + 通報收貨 checklist「數量抽驗」失敗
//   ④ 多批趨勢：Cpk 是否衰退 → push 採購 + 計入供應商風險雷達 Quality 維度

export type SpecKind = "numeric" | "categorical" | "one_sided_max" | "one_sided_min";

export type ShaftSpec = {
  id: string;        // A-T
  feature: string;   // 規格描述（如 "軸心外徑 φ30(0/-0.009)"）
  method: string;     // 檢查方法
  kind: SpecKind;
  target: number;     // 標稱
  usl?: number;       // 上規格界
  lsl?: number;       // 下規格界
  unit: string;
  critical: boolean;  // 是否關鍵尺寸（影響配合）
};

// === 20 項規格定義（A-T）===
export const SHAFT_SPECS: ShaftSpec[] = [
  { id: "A", feature: "軸心外徑 φ30(0/-0.009)",        method: "外徑分厘卡", kind: "numeric", target: 30,    usl: 30.000, lsl: 29.991, unit: "mm",  critical: true  },
  { id: "B", feature: "軸心外徑 φ20(+0.003/+0.011)",   method: "外徑分厘卡", kind: "numeric", target: 20,    usl: 20.011, lsl: 20.003, unit: "mm",  critical: true  },
  { id: "C", feature: "軸心外徑 φ15(+0.003/+0.011)",   method: "外徑分厘卡", kind: "numeric", target: 15,    usl: 15.011, lsl: 15.003, unit: "mm",  critical: true  },
  { id: "D", feature: "長度 10±0.1",                   method: "游標卡尺",   kind: "numeric", target: 10,    usl: 10.1,   lsl: 9.9,   unit: "mm",  critical: false },
  { id: "E", feature: "長度 9(+0.1/0)",                method: "游標卡尺",   kind: "numeric", target: 9,     usl: 9.1,    lsl: 9.0,   unit: "mm",  critical: false },
  { id: "F", feature: "寬度 1.35(+0.14/0)",            method: "游標卡尺",   kind: "numeric", target: 1.35,  usl: 1.49,   lsl: 1.35,  unit: "mm",  critical: false },
  { id: "G", feature: "長度 14.52±0.1",                method: "游標卡尺",   kind: "numeric", target: 14.52, usl: 14.62,  lsl: 14.42, unit: "mm",  critical: false },
  { id: "H", feature: "長度 21±0.1",                   method: "游標卡尺",   kind: "numeric", target: 21,    usl: 21.1,   lsl: 20.9,  unit: "mm",  critical: false },
  { id: "I", feature: "長度 9(+0.1/0)",                method: "游標卡尺",   kind: "numeric", target: 9,     usl: 9.1,    lsl: 9.0,   unit: "mm",  critical: false },
  { id: "J", feature: "長度 12±0.1",                   method: "游標卡尺",   kind: "numeric", target: 12,    usl: 12.1,   lsl: 11.9,  unit: "mm",  critical: false },
  { id: "K", feature: "長度 13(+0.1/0)",               method: "游標卡尺",   kind: "numeric", target: 13,    usl: 13.1,   lsl: 13.0,  unit: "mm",  critical: false },
  { id: "L", feature: "軸心外徑 φ15(+0.003/+0.011)",   method: "外徑分厘卡", kind: "numeric", target: 15,    usl: 15.011, lsl: 15.003, unit: "mm",  critical: true  },
  { id: "M", feature: "鍵槽深度 2.7(+0.1/+0)",         method: "游標卡尺",   kind: "numeric", target: 2.7,   usl: 2.8,    lsl: 2.7,   unit: "mm",  critical: false },
  { id: "N", feature: "軸心外徑 φ20(+0.003/+0.011)",   method: "外徑分厘卡", kind: "numeric", target: 20,    usl: 20.011, lsl: 20.003, unit: "mm",  critical: true  },
  { id: "O", feature: "全長 89.67±0.1",                method: "游標卡尺",   kind: "numeric", target: 89.67, usl: 89.77,  lsl: 89.57, unit: "mm",  critical: true  },
  { id: "P", feature: "螺牙規格 M5*P0.8",              method: "牙規",       kind: "categorical", target: 1, unit: "OK/NG", critical: true },
  { id: "Q", feature: "鍵槽長度 15(+0.2/+0.1)",        method: "游標卡尺",   kind: "numeric", target: 15.15, usl: 15.2,   lsl: 15.1,  unit: "mm",  critical: false },
  { id: "R", feature: "鍵槽寬度 5(+0.03/+0.05)",       method: "游標卡尺",   kind: "numeric", target: 5.04,  usl: 5.05,   lsl: 5.03,  unit: "mm",  critical: true  },
  { id: "S", feature: "硬度 HRc 58-63",                method: "硬度計",     kind: "numeric", target: 60.5,  usl: 63,     lsl: 58,    unit: "HRc", critical: true  },
  { id: "T", feature: "表面粗糙度 ≤Ra0.2",             method: "粗糙度計",   kind: "one_sided_max", target: 0.2, usl: 0.2,  unit: "Ra",  critical: false },
];

// === 3 批進料量測資料（pcs#1..#8）===
export type ShaftLot = {
  lotNo: string;
  receiptDate: string;        // YYYY-MM-DD
  batchQty: number;            // 整批
  inspectedQty: number;        // 抽驗
  measurements: Record<string, (number | "OK" | "NG")[]>;
};

export const SHAFT_LOTS: ShaftLot[] = [
  // ----- Lot 1: 2026-01-20（檢驗單 RA80-2601200021）-----
  {
    lotNo: "RA80-26012-0021", receiptDate: "2026-01-20", batchQty: 100, inspectedQty: 8,
    measurements: {
      A: [29.993, 29.995, 29.994, 29.995, 29.993, 29.996, 29.995, 29.994],
      B: [20.006, 20.005, 20.008, 20.007, 20.005, 20.008, 20.006, 20.005],
      C: [15.005, 15.007, 15.006, 15.005, 15.008, 15.007, 15.006, 15.005],
      D: [9.97, 9.95, 9.96, 9.95, 9.97, 9.96, 9.98, 9.95],
      E: [9.03, 9.05, 9.04, 9.05, 9.06, 9.05, 9.04, 9.04],
      F: [1.38, 1.41, 1.40, 1.39, 1.41, 1.40, 1.39, 1.38],
      G: [14.52, 14.51, 14.53, 14.52, 14.51, 14.53, 14.52, 14.51],
      H: [20.96, 20.98, 20.97, 20.96, 20.95, 20.98, 20.98, 20.97],
      I: [9.04, 9.06, 9.07, 9.05, 9.06, 9.07, 9.07, 9.06],
      J: [12.06, 12.07, 12.08, 12.06, 12.05, 12.08, 12.05, 12.07],
      K: [13.06, 13.08, 13.04, 13.07, 13.06, 13.05, 13.07, 13.07],
      L: [15.005, 15.008, 15.007, 15.006, 15.008, 15.005, 15.005, 15.007],
      M: [2.75, 2.74, 2.77, 2.76, 2.75, 2.77, 2.74, 2.75],
      N: [20.007, 20.005, 20.006, 20.008, 20.007, 20.005, 20.008, 20.007],
      O: [89.66, 89.68, 89.67, 89.66, 89.69, 89.68, 89.67, 89.67],
      P: ["OK","OK","OK","OK","OK","OK","OK","OK"],
      Q: [15.14, 15.13, 15.13, 15.12, 15.13, 15.15, 15.16, 15.14],
      R: [5.03, 5.05, 5.03, 5.04, 5.05, 5.03, 5.05, 5.04],
      // S 此批未測（硬度欄被劃掉）
      T: [0.12, 0.14, 0.13, 0.12, 0.14, 0.13, 0.12, 0.12],
    },
  },
  // ----- Lot 2: 2026-02-12（檢驗單 RA80-2602120051）-----
  {
    lotNo: "RA80-26021-0051", receiptDate: "2026-02-12", batchQty: 100, inspectedQty: 8,
    measurements: {
      A: [29.994, 29.995, 29.993, 29.995, 29.994, 29.996, 29.993, 29.996],
      B: [20.006, 20.007, 20.005, 20.008, 20.007, 20.005, 20.006, 20.006],
      C: [15.005, 15.005, 15.008, 15.007, 15.006, 15.008, 15.006, 15.008],
      D: [9.97, 9.95, 9.95, 9.97, 9.96, 9.95, 9.98, 9.98],
      E: [9.03, 9.05, 9.05, 9.04, 9.03, 9.03, 9.04, 9.06],
      F: [1.38, 1.39, 1.40, 1.41, 1.39, 1.41, 1.40, 1.39],
      G: [14.51, 14.52, 14.53, 14.52, 14.53, 14.51, 14.51, 14.52],
      H: [20.99, 20.95, 20.97, 20.96, 20.98, 20.95, 20.97, 20.96],
      I: [9.05, 9.04, 9.04, 9.06, 9.06, 9.05, 9.05, 9.04],
      J: [12.05, 12.08, 12.06, 12.06, 12.08, 12.07, 12.05, 12.06],
      K: [13.06, 13.04, 13.05, 13.07, 13.06, 13.05, 13.04, 13.08],
      L: [15.006, 15.005, 15.005, 15.007, 15.007, 15.008, 15.005, 15.008],
      M: [2.74, 2.75, 2.77, 2.76, 2.75, 2.76, 2.77, 2.74],
      N: [20.005, 20.008, 20.006, 20.007, 20.007, 20.006, 20.008, 20.006],
      O: [89.68, 89.66, 89.67, 89.66, 89.66, 89.68, 89.67, 89.66],
      P: ["OK","OK","OK","OK","OK","OK","OK","OK"],
      Q: [15.13, 15.12, 15.15, 15.16, 15.13, 15.14, 15.16, 15.15],
      R: [5.05, 5.04, 5.03, 5.04, 5.03, 5.05, 5.04, 5.04],
      S: [60, 59, 62, 61, 60, 60, 61, 59],
      T: [0.12, 0.13, 0.14, 0.14, 0.12, 0.12, 0.13, 0.16],
    },
  },
  // ----- Lot 3: 2026-05-15（檢驗單 RA80-26051501XX）-----
  {
    lotNo: "RA80-26051-501", receiptDate: "2026-05-15", batchQty: 300, inspectedQty: 8,
    measurements: {
      A: [29.994, 29.993, 29.996, 29.993, 29.995, 29.996, 29.995, 29.994],
      B: [20.007, 20.008, 20.006, 20.006, 20.005, 20.008, 20.007, 20.005],
      C: [15.005, 15.005, 15.007, 15.006, 15.008, 15.005, 15.007, 15.005],
      D: [9.95, 9.98, 9.97, 9.96, 9.95, 9.98, 9.97, 9.96],
      E: [9.03, 9.04, 9.05, 9.04, 9.03, 9.05, 9.03, 9.05],
      F: [1.40, 1.39, 1.38, 1.41, 1.40, 1.39, 1.41, 1.40],
      G: [14.52, 14.51, 14.53, 14.53, 14.52, 14.51, 14.53, 14.52],
      H: [20.97, 20.95, 20.98, 20.96, 20.99, 20.98, 20.95, 20.97],
      I: [9.04, 9.05, 9.06, 9.07, 9.05, 9.06, 9.04, 9.07],
      J: [12.07, 12.07, 12.05, 12.08, 12.06, 12.07, 12.08, 12.06],
      K: [13.05, 13.04, 13.08, 13.07, 13.06, 13.08, 13.05, 13.06],
      L: [15.005, 15.006, 15.007, 15.006, 15.008, 15.008, 15.005, 15.006],
      M: [2.74, 2.75, 2.77, 2.76, 2.75, 2.76, 2.74, 2.75],
      N: [20.006, 20.007, 20.005, 20.008, 20.006, 20.007, 20.008, 20.006],
      O: [89.66, 89.67, 89.66, 89.68, 89.69, 89.67, 89.68, 89.66],
      P: ["OK","OK","OK","OK","OK","OK","OK","OK"],
      Q: [15.14, 15.13, 15.12, 15.15, 15.16, 15.12, 15.15, 15.13],
      R: [5.04, 5.03, 5.05, 5.05, 5.04, 5.03, 5.04, 5.05],
      S: [61, 61, 63, 62, 62, 62, 63, 62],
      T: [0.12, 0.13, 0.14, 0.14, 0.12, 0.13, 0.13, 0.14],
    },
  },
];

// ============================================================
// SPC 計算
// ============================================================
export type SpcItemStat = {
  specId: string;
  spec: ShaftSpec;
  n: number;
  values: number[];               // 數值樣本（categorical 跳過）
  mean: number;
  sigma: number;                   // 樣本標準差
  min: number;
  max: number;
  cp: number | null;               // (USL-LSL)/(6σ) — 雙邊；單邊 null
  cpk: number | null;              // min((USL-μ)/3σ, (μ-LSL)/3σ)
  outOfSpecCount: number;          // 超出 USL/LSL 的點數
  outOfSpecIndices: number[];
  pass: boolean;                    // 該批此項是否通過（無 OOS）
  capability: "excellent" | "good" | "marginal" | "poor" | "n/a";
  // categorical 用
  okCount?: number;
  ngCount?: number;
};

function stats(values: number[]): { mean: number; sigma: number; min: number; max: number } {
  if (values.length === 0) return { mean: 0, sigma: 0, min: 0, max: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const v = values.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, values.length - 1);
  return { mean, sigma: Math.sqrt(v), min: Math.min(...values), max: Math.max(...values) };
}

export function computeLotItem(lot: ShaftLot, spec: ShaftSpec): SpcItemStat {
  const raw = lot.measurements[spec.id] ?? [];
  if (spec.kind === "categorical") {
    const okCount = raw.filter((v) => v === "OK").length;
    const ngCount = raw.filter((v) => v === "NG").length;
    return {
      specId: spec.id, spec, n: raw.length, values: [],
      mean: 0, sigma: 0, min: 0, max: 0,
      cp: null, cpk: null, outOfSpecCount: ngCount, outOfSpecIndices: [],
      pass: ngCount === 0,
      capability: ngCount === 0 ? "excellent" : "poor",
      okCount, ngCount,
    };
  }
  const values = raw.filter((v) => typeof v === "number") as number[];
  if (values.length === 0) {
    return {
      specId: spec.id, spec, n: 0, values: [], mean: 0, sigma: 0, min: 0, max: 0,
      cp: null, cpk: null, outOfSpecCount: 0, outOfSpecIndices: [], pass: true, capability: "n/a",
    };
  }
  const s = stats(values);
  const usl = spec.usl;
  const lsl = spec.lsl;
  // Cp / Cpk
  let cp: number | null = null;
  let cpk: number | null = null;
  if (usl != null && lsl != null && s.sigma > 0) {
    cp = (usl - lsl) / (6 * s.sigma);
    cpk = Math.min((usl - s.mean) / (3 * s.sigma), (s.mean - lsl) / (3 * s.sigma));
  } else if (usl != null && s.sigma > 0) {
    cpk = (usl - s.mean) / (3 * s.sigma);
  } else if (lsl != null && s.sigma > 0) {
    cpk = (s.mean - lsl) / (3 * s.sigma);
  }
  // OOS 偵測
  const outIdx: number[] = [];
  values.forEach((v, i) => {
    if (usl != null && v > usl) outIdx.push(i);
    else if (lsl != null && v < lsl) outIdx.push(i);
  });
  const cap: SpcItemStat["capability"] =
    cpk == null ? "n/a" :
    cpk >= 1.67 ? "excellent" :
    cpk >= 1.33 ? "good" :
    cpk >= 1.0  ? "marginal" : "poor";
  return {
    specId: spec.id, spec, n: values.length, values,
    mean: s.mean, sigma: s.sigma, min: s.min, max: s.max,
    cp, cpk, outOfSpecCount: outIdx.length, outOfSpecIndices: outIdx,
    pass: outIdx.length === 0,
    capability: cap,
  };
}

// 單批整體
export type LotSummary = {
  lot: ShaftLot;
  itemStats: SpcItemStat[];
  totalOOS: number;
  passCount: number;
  failCount: number;
  worstCpk: number | null;
  worstItem: SpcItemStat | null;
  pass: boolean;             // 整批是否通過（任一項 fail = 整批 fail）
};

export function summarizeLot(lot: ShaftLot): LotSummary {
  const itemStats = SHAFT_SPECS.map((sp) => computeLotItem(lot, sp));
  const numericStats = itemStats.filter((x) => x.cpk != null);
  const worst = numericStats.length > 0
    ? numericStats.reduce((a, b) => ((a.cpk ?? 99) < (b.cpk ?? 99) ? a : b))
    : null;
  const totalOOS = itemStats.reduce((s, x) => s + x.outOfSpecCount, 0);
  const passCount = itemStats.filter((x) => x.pass).length;
  const failCount = itemStats.filter((x) => !x.pass).length;
  return {
    lot,
    itemStats,
    totalOOS,
    passCount,
    failCount,
    worstCpk: worst?.cpk ?? null,
    worstItem: worst,
    pass: failCount === 0,
  };
}

// 跨批趨勢（每項規格的 Cpk 變化）
export type CpkTrend = {
  specId: string;
  feature: string;
  history: { lotNo: string; date: string; cpk: number | null; oos: number }[];
  trend: "improving" | "stable" | "degrading";
};

export function cpkTrends(): CpkTrend[] {
  return SHAFT_SPECS.map((sp) => {
    const history = SHAFT_LOTS.map((lot) => {
      const st = computeLotItem(lot, sp);
      return { lotNo: lot.lotNo, date: lot.receiptDate, cpk: st.cpk, oos: st.outOfSpecCount };
    });
    const cpks = history.map((h) => h.cpk).filter((x): x is number => x != null);
    let trend: CpkTrend["trend"] = "stable";
    if (cpks.length >= 2) {
      const first = cpks[0];
      const last = cpks[cpks.length - 1];
      if (last < first - 0.2) trend = "degrading";
      else if (last > first + 0.2) trend = "improving";
    }
    return { specId: sp.id, feature: sp.feature, history, trend };
  });
}

// 全廠商統計（給供應商風險雷達 Quality 維度餵料）
export type SupplierSpcSummary = {
  totalLots: number;
  totalInspected: number;
  totalOOS: number;
  passRate: number;            // 整批 pass 比率
  avgCpkCritical: number;       // 關鍵尺寸的平均 Cpk
  worstSpecAvgCpk: { specId: string; feature: string; avgCpk: number };
};

export function supplierSpcSummary(): SupplierSpcSummary {
  const summaries = SHAFT_LOTS.map(summarizeLot);
  const totalOOS = summaries.reduce((s, x) => s + x.totalOOS, 0);
  const passLots = summaries.filter((x) => x.pass).length;
  const passRate = (passLots / summaries.length) * 100;
  // 各 spec 平均 Cpk（用 numeric + critical）
  const trends = cpkTrends();
  const criticalAvgs = trends
    .filter((t) => SHAFT_SPECS.find((s) => s.id === t.specId)?.critical && SHAFT_SPECS.find((s) => s.id === t.specId)?.kind === "numeric")
    .map((t) => {
      const cpks = t.history.map((h) => h.cpk).filter((x): x is number => x != null);
      return { specId: t.specId, feature: t.feature, avg: cpks.length > 0 ? cpks.reduce((s, x) => s + x, 0) / cpks.length : 0 };
    });
  const avgCpkCritical = criticalAvgs.length > 0
    ? criticalAvgs.reduce((s, x) => s + x.avg, 0) / criticalAvgs.length
    : 0;
  const worst = criticalAvgs.length > 0
    ? criticalAvgs.reduce((a, b) => (a.avg < b.avg ? a : b))
    : { specId: "", feature: "—", avg: 0 };
  return {
    totalLots: SHAFT_LOTS.length,
    totalInspected: SHAFT_LOTS.reduce((s, l) => s + l.inspectedQty, 0),
    totalOOS,
    passRate,
    avgCpkCritical,
    worstSpecAvgCpk: { specId: worst.specId, feature: worst.feature, avgCpk: worst.avg },
  };
}
