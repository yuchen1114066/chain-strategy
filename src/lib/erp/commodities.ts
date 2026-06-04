// 全球原物料 AI 採購戰情室 — 資料層
// 對應「Global AI Procurement Command Center」藍圖
// 銅/鋁/鋼/生鐵 月均價 2021-01 ~ 2025-05 + SPC 管制（Mean ± 3σ）
//
// demo 為內建模擬序列（錨定真實量級 + 已知峰值）。
// 正式版接 LME API / Fastmarkets / SGX / TradingEconomics。

export type CommodityPoint = { month: string; price: number };

export type Commodity = {
  code: string;
  name: string;
  nameEn: string;
  unit: string;
  source: string;
  category: string[];   // 影響的零件分類（成本衝擊用）
  prices: CommodityPoint[];
  forecast: { low: number; high: number };
};

// 產生 2021-01 ~ 2025-05 月份序列
function months(): string[] {
  const out: string[] = [];
  for (let y = 2021; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2025 && m > 5) break;
      out.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

// 確定性序列：錨定 base，含波動 + 一個峰值
function series(base: number, amp: number, spikeIdx: number, spikeVal: number): CommodityPoint[] {
  const ms = months();
  return ms.map((month, i) => {
    if (i === spikeIdx) return { month, price: spikeVal };
    // 確定性偽隨機波動
    const wave = Math.sin(i * 0.55) * amp * 0.6 + Math.cos(i * 0.23) * amp * 0.4;
    const drift = Math.sin(i * 0.08) * amp * 0.5;
    const price = Math.round((base + wave + drift) * 100) / 100;
    return { month, price: Math.max(base * 0.55, price) };
  });
}

export const commodities: Commodity[] = [
  {
    code: "CU", name: "銅", nameEn: "LME Copper", unit: "USD/MT",
    source: "LME API",
    category: ["線圈", "電線", "馬達", "電氣"],
    prices: series(9876, 1400, 36, 15832),
    forecast: { low: 10800, high: 13800 },
  },
  {
    code: "AL", name: "鋁", nameEn: "LME Aluminium", unit: "USD/MT",
    source: "LME API",
    category: ["鋁件", "飛輪", "框架", "踏板"],
    prices: series(2708, 380, 33, 4696),
    forecast: { low: 3000, high: 4200 },
  },
  {
    code: "STEEL", name: "鋼", nameEn: "熱軋鋼 HRC", unit: "USD/MT",
    source: "中鋼牌價 / Fastmarkets 國際熱軋",
    category: ["鋼架", "框架", "軸件", "鐵心"],
    prices: series(1154, 190, 4, 1842),
    forecast: { low: 900, high: 1200 },
  },
  {
    code: "PLASTIC", name: "塑料", nameEn: "Plastic (Oil-linked)", unit: "USD/MT",
    source: "Brent 原油聯動 (Oil linkage)",
    category: ["塑膠件", "包裝", "外殼"],
    prices: series(1450, 220, 30, 2230),
    forecast: { low: 1300, high: 1900 },
  },
  {
    code: "REE", name: "稀土", nameEn: "Rare Earth (NdPr)", unit: "USD/kg",
    source: "中國北方稀土 / 上海有色網",
    category: ["磁鐵", "馬達", "發電機"],
    prices: series(82, 18, 22, 145),
    forecast: { low: 70, high: 110 },
  },
  {
    code: "IC", name: "IC 半導體", nameEn: "IC Lead Time (weeks)", unit: "週",
    source: "DigiKey / Mouser leadtime",
    category: ["控制板", "顯示器", "感測器"],
    prices: series(18, 4, 30, 38),       // 2023-07 短缺峰值 38 週
    forecast: { low: 12, high: 24 },
  },
  {
    code: "PIG_IRON", name: "混鐵", nameEn: "Pig Iron", unit: "NTD/MT",
    source: "中鋼 + 台灣鋼鐵公會 + Hoa Phat 越南鋼鐵",
    category: ["鑄件", "重訓鑄鐵塊", "底座配重", "馬達外殼"],
    prices: series(28000, 4000, 4, 36000),   // 2021-05 鐵礦石飆漲尖峰
    forecast: { low: 26000, high: 33000 },
  },
];

// ============================================================
// 真實年度統計（依公司 Excel 計算，UCL/LCL = 年平均 ± 1.5σ）
// 來源：銅/鋁 LME，鋼 中鋼 HRC 國際熱軋
// ============================================================
export type YearStats = {
  year: number;
  yearTW: string;
  months: number;
  min: number;
  avg: number;
  max: number;
  sigma: number;
  ucl: number;
  lcl: number;
  unit: string;
};

export const COMMODITY_YEAR_STATS: Record<string, YearStats[]> = {
  CU: [
    { year: 2022, yearTW: "111年", months: 12, min: 7528.38,  avg: 8812.95,  max: 10235.80, sigma: 1054.02, ucl: 10393.98, lcl: 7231.91, unit: "USD/MT" },
    { year: 2023, yearTW: "112年", months: 12, min: 7938.82,  avg: 8482.13,  max: 8998.76,  sigma:  337.94, ucl:  8989.04, lcl: 7975.22, unit: "USD/MT" },
    { year: 2024, yearTW: "113年", months: 12, min: 8309.36,  avg: 9142.88,  max: 10127.76, sigma:  539.68, ucl:  9952.40, lcl: 8333.36, unit: "USD/MT" },
    { year: 2025, yearTW: "114年", months: 12, min: 8976.86,  avg: 9938.03,  max: 11801.79, sigma:  796.41, ucl: 11132.65, lcl: 8743.42, unit: "USD/MT" },
    { year: 2026, yearTW: "115年", months:  5, min: 12966.48, avg: 13026.89, max: 13087.29, sigma:   85.43, ucl: 13155.02, lcl: 12898.75,unit: "USD/MT" },
  ],
  AL: [
    { year: 2022, yearTW: "111年", months: 12, min: 2229.11,  avg: 2696.60,  max: 3536.72,  sigma:  462.32, ucl:  3390.08, lcl: 2003.11, unit: "USD/MT" },
    { year: 2023, yearTW: "112年", months: 12, min: 2133.41,  avg: 2250.85,  max: 2488.17,  sigma:  112.55, ucl:  2419.67, lcl: 2082.02, unit: "USD/MT" },
    { year: 2024, yearTW: "113年", months: 12, min: 2181.90,  avg: 2418.02,  max: 2597.46,  sigma:  154.62, ucl:  2649.95, lcl: 2186.10, unit: "USD/MT" },
    { year: 2025, yearTW: "114年", months: 12, min: 2380.55,  avg: 2629.37,  max: 2874.81,  sigma:  147.33, ucl:  2850.36, lcl: 2408.38, unit: "USD/MT" },
    { year: 2026, yearTW: "115年", months:  2, min: 3064.53,  avg: 3106.04,  max: 3147.55,  sigma:   58.70, ucl:  3194.10, lcl: 3017.98, unit: "USD/MT" },
  ],
  STEEL: [
    { year: 2022, yearTW: "111年", months: 12, min: 24147,    avg: 26843,    max: 29700,    sigma:    0,    ucl: 26843,    lcl: 26843,   unit: "NTD/MT" },
    { year: 2023, yearTW: "112年", months: 12, min: 26800,    avg: 28575,    max: 31800,    sigma:    0,    ucl: 28575,    lcl: 28575,   unit: "NTD/MT" },
    { year: 2024, yearTW: "113年", months: 12, min: 20200,    avg: 22233.33, max: 28300,    sigma:    0,    ucl: 22233.33, lcl: 22233.33,unit: "NTD/MT" },
    { year: 2025, yearTW: "114年", months:  7, min: 19100,    avg: 20650,    max: 22300,    sigma:    0,    ucl: 20650,    lcl: 20650,   unit: "NTD/MT" },
    { year: 2026, yearTW: "115年", months:  4, min: 16500,    avg: 17808.33, max: 20000,    sigma:    0,    ucl: 17808.33, lcl: 17808.33,unit: "NTD/MT" },
  ],
};

// 全期合計 stats
export const COMMODITY_PERIOD_STATS: Record<string, YearStats> = {
  CU:    { year: 0, yearTW: "全期合計", months: 50, min: 7528.38, avg: 9251.31,  max: 13087.29, sigma: 1172.65, ucl: 11010.29, lcl: 7492.34, unit: "USD/MT" },
  AL:    { year: 0, yearTW: "全期合計", months: 50, min: 2133.41, avg: 2523.00,  max: 3536.72,  sigma:  325.58, ucl:  3011.37, lcl: 2034.64, unit: "USD/MT" },
  STEEL: { year: 0, yearTW: "全期合計", months: 11, min: 16500,   avg: 23221.93, max: 31800,    sigma:    0,    ucl: 23221.93, lcl: 23221.93,unit: "NTD/MT" },
};

// 2021 年度基期 + 2026/Q1 漲跌幅
export type BaselineRow = {
  itemTW: string;
  itemEn: string;
  unit: string;
  avg2021: number;
  avg2026Q1: number;
  pctChange: number;
};

export const BASELINE_2021: BaselineRow[] = [
  { itemTW: "銅 (LME)",      itemEn: "Copper",     unit: "USD/T", avg2021:  9143.4, avg2026Q1: 12851.2, pctChange:  41 },
  { itemTW: "鋁 (LME)",      itemEn: "Aluminum",   unit: "USD/T", avg2021:  2239.8, avg2026Q1:  3244.4, pctChange:  45 },
  { itemTW: "鋼 (中鋼)",     itemEn: "Steel (CSC)",unit: "NTD/T", avg2021: 26843.3, avg2026Q1: 18366.7, pctChange: -32 },
  { itemTW: "鐵 (台灣混鐵)", itemEn: "TW Pig Iron",unit: "NTD/kg",avg2021:    29.7, avg2026Q1:    32.6, pctChange:  10 },
  { itemTW: "鐵 (越南混鐵)", itemEn: "VN Pig Iron",unit: "NTD/kg",avg2021:    22.6, avg2026Q1:    29.4, pctChange:  30 },
];

// 對應 commodity code → BaselineRow
export const BASELINE_BY_CODE: Record<string, BaselineRow | undefined> = {
  CU:    BASELINE_2021[0],
  AL:    BASELINE_2021[1],
  STEEL: BASELINE_2021[2],
};

// ============================================================
// 4 區判斷（AI 不是只看漲跌，而是判斷現在進入哪一區）
//   · 低檔區：價格 < Mean - σ → 適合囤貨
//   · 危險區：價格 > Mean + 2σ → 已過熱，避免追高
//   · 追高區：價格在 Mean+σ ~ Mean+2σ 之間 + 趨勢向上
//   · 囤貨區：價格 < Mean 且 + 趨勢向上（即將反彈）
//   · 觀望：其他
// ============================================================
export type PriceZone = "低檔" | "危險" | "追高" | "囤貨" | "觀望";

export type ZoneVerdict = {
  zone: PriceZone;
  tone: "emerald" | "rose" | "amber" | "cyan" | "slate";
  oneLiner: string;
  action: string;
};

export function priceZone(c: Commodity): ZoneVerdict {
  const s = spc(c);
  const recent = c.prices.slice(-3).map((p) => p.price);
  const earlier = c.prices.slice(-9, -3).map((p) => p.price);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length);
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / Math.max(1, earlier.length);
  const trend = recentAvg - earlierAvg;   // > 0 漲，< 0 跌
  const trendUp = trend > s.sigma * 0.2;
  const trendDown = trend < -s.sigma * 0.2;

  if (s.latest > s.mean + 2 * s.sigma) {
    return {
      zone: "危險",
      tone: "rose",
      oneLiner: `已超出 +2σ（過熱）`,
      action: "暫停加單、消化在途；漲價要求一律拒絕",
    };
  }
  if (s.latest < s.mean - s.sigma) {
    return {
      zone: "低檔",
      tone: "emerald",
      oneLiner: `低於 baseline ${((1 - s.latest / s.mean) * 100).toFixed(0)}%`,
      action: "適合囤貨、簽長約、鎖定年降",
    };
  }
  if (s.latest > s.mean + s.sigma && trendUp) {
    return {
      zone: "追高",
      tone: "amber",
      oneLiner: `已過均線且趨勢向上 — 風險中`,
      action: "縮短訂單週期、減少囤貨、等回檔",
    };
  }
  if (s.latest < s.mean && trendUp) {
    return {
      zone: "囤貨",
      tone: "cyan",
      oneLiner: `低於均線但即將反彈`,
      action: "趁回檔提前備料 30-60 天",
    };
  }
  void trendDown;
  return {
    zone: "觀望",
    tone: "slate",
    oneLiner: "在合理區間內波動",
    action: "依生產實際需求採購、不囤不縮",
  };
}

// ============================================================
// 採購建議模型（AI 推理鏈）
//   例：銅價過去 30 日下跌 12%
//      但：中國需求開始回升、LME 庫存下降 8%
//      AI 判定：未來 60 天反彈機率高
//      建議：提前備料 45 天
// ============================================================
export type ProcurementAdvice = {
  commodity: string;
  facts: string[];          // 過去 30 日事實
  butFactors: string[];      // 但有相反信號
  aiVerdict: string;         // AI 判斷
  recommendation: string;    // 具體建議（含天數）
  confidence: "high" | "med" | "low";
};

export function procurementAdvice(c: Commodity): ProcurementAdvice {
  const s = spc(c);
  const last3 = c.prices.slice(-3).map((p) => p.price);
  const prev3 = c.prices.slice(-6, -3).map((p) => p.price);
  const recentAvg = last3.reduce((a, b) => a + b, 0) / 3;
  const prevAvg = prev3.reduce((a, b) => a + b, 0) / 3;
  const pct30 = ((recentAvg - prevAvg) / prevAvg) * 100;
  const direction = pct30 > 0 ? "上漲" : "下跌";

  const facts = [
    `過去 30 日${direction} ${Math.abs(pct30).toFixed(1)}%`,
    `當前 ${s.latest} ${c.unit}　·　Mean ${s.mean.toFixed(0)} ± σ ${s.sigma.toFixed(0)}`,
  ];

  // butFactors 模擬 demo 邏輯（正式版串國際新聞 + 庫存 + 需求數據）
  const butFactors: string[] = [];
  if (c.code === "CU") {
    butFactors.push("中國基建/電動車需求回升");
    butFactors.push("LME 倉庫庫存 30 日下降 8%");
  } else if (c.code === "AL") {
    butFactors.push("歐洲冶煉廠減產（能源成本高）");
    butFactors.push("印度產量未能補位");
  } else if (c.code === "STEEL") {
    butFactors.push("中國地產復甦預期");
    butFactors.push("中鋼年底牌價傳將調漲");
  } else if (c.code === "PLASTIC") {
    butFactors.push("Brent 原油站穩 $80+");
    butFactors.push("OPEC+ 維持減產立場");
  } else if (c.code === "REE") {
    butFactors.push("中國出口管制升級");
    butFactors.push("綠能 / 馬達需求結構性增長");
  } else if (c.code === "IC") {
    butFactors.push("AI / 車用 IC 需求強");
    butFactors.push("台積電 / 三星先進製程吃緊");
  }

  const zone = priceZone(c);
  let verdict: string;
  let recommendation: string;
  let confidence: ProcurementAdvice["confidence"];

  if (zone.zone === "低檔" || zone.zone === "囤貨") {
    verdict = pct30 < 0
      ? "未來 60 天反彈機率高（已跌深 + 基本面回穩）"
      : "處於低檔即將反彈";
    recommendation = `提前備料 45 天　·　簽 6 個月長約鎖價　·　目標庫存提升至安全 ${zone.zone === "低檔" ? "180%" : "150%"}`;
    confidence = "high";
  } else if (zone.zone === "危險") {
    verdict = "已過熱、回檔風險高 — 不宜追高";
    recommendation = `凍結加單　·　消化在途　·　等回到 Mean ${s.mean.toFixed(0)} 以下再進場`;
    confidence = "high";
  } else if (zone.zone === "追高") {
    verdict = "趨勢向上但已偏高 — 風險中";
    recommendation = `縮短訂單週期到 30 天　·　暫不囤貨　·　密切觀察 30 日內動向`;
    confidence = "med";
  } else {
    verdict = "走勢震盪、未明顯方向";
    recommendation = `依生產實際需求採購　·　不囤不縮　·　維持安全庫存`;
    confidence = "med";
  }

  return {
    commodity: c.name,
    facts,
    butFactors,
    aiVerdict: verdict,
    recommendation,
    confidence,
  };
}

// ── SPC 管制計算（Mean / σ / UCL=Mean+3σ / LCL=Mean-3σ）──
export type SpcStat = {
  mean: number;
  sigma: number;
  ucl: number;
  lcl: number;
  latest: number;
  latestMonth: string;
  anomalies: CommodityPoint[];  // 超出管制界線的點
  status: "normal" | "warn" | "alert"; // 最新值狀態
};

export function spc(c: Commodity): SpcStat {
  const vals = c.prices.map((p) => p.price);
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const sigma = Math.sqrt(variance);
  const ucl = mean + 3 * sigma;
  const lcl = mean - 3 * sigma;
  const last = c.prices[c.prices.length - 1];
  const anomalies = c.prices.filter((p) => p.price > ucl || p.price < lcl);
  // 最新值狀態：超界=alert / 超 2σ=warn / 正常
  let status: SpcStat["status"] = "normal";
  if (last.price > ucl || last.price < lcl) status = "alert";
  else if (last.price > mean + 2 * sigma || last.price < mean - 2 * sigma) status = "warn";
  return { mean, sigma, ucl, lcl, latest: last.price, latestMonth: last.month, anomalies, status };
}
