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
    prices: series(9876, 1400, 36, 15832), // 2024-01 峰值
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
    source: "Fastmarkets",
    category: ["鋼架", "框架", "軸件", "鐵心"],
    prices: series(1154, 190, 4, 1842),
    forecast: { low: 900, high: 1200 },
  },
  {
    code: "IRON", name: "生鐵", nameEn: "Iron Ore", unit: "USD/MT",
    source: "SGX / TradingEconomics",
    category: ["鐵心", "磁件", "飛輪"],
    prices: series(112, 18, 4, 175),
    forecast: { low: 95, high: 125 },
  },
];

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
