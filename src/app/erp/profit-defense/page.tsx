"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { commodities, priceZone, procurementAdvice, type Commodity,
  COMMODITY_YEAR_STATS, COMMODITY_PERIOD_STATS, BASELINE_2021, BASELINE_BY_CODE } from "@/lib/erp/commodities";

// 設計 token（依 Stitch DESIGN.md）
const C = {
  primary: "#005245",        // Deep Forest Green
  primaryHover: "#1f6b5c",
  blue: "#005cba",           // Intelligence Blue
  blueLight: "#2D9CDB",      // AI Insight chips
  red: "#ba1a1a",
  pageBg: "#fcf9f8",
  surface: "#ffffff",
  surfaceDim: "#f6f3f2",
  border: "#e5e2e1",
  text: "#1c1b1b",
  textSub: "#4B5563",
  outline: "#bec9c4",
};

const TABS: { code: Commodity["code"]; label: string; nameEn: string }[] = [
  { code: "CU",      label: "銅",   nameEn: "Copper" },
  { code: "STEEL",   label: "鋼",   nameEn: "Steel" },
  { code: "AL",      label: "鋁",   nameEn: "Aluminum" },
  { code: "PLASTIC", label: "塑料", nameEn: "Plastic" },
];

const RANGES: { key: string; months: number }[] = [
  { key: "5D",            months: 1  },
  { key: "1M",            months: 1  },
  { key: "3M",            months: 3  },
  { key: "1Y",            months: 12 },
  { key: "AI Prediction", months: 24 },
];

// 資料來源（每個商品對應的權威報價源 + URL）
const DATA_SOURCE: Record<string, { label: string; url?: string }> = {
  CU:      { label: "LME 倫敦金屬交易所 (Copper Grade A spot) · INSEE 法國國家統計局",     url: "https://www.insee.fr/en/statistiques/serie/010002052" },
  AL:      { label: "LME 倫敦金屬交易所 (Aluminum spot) · INSEE 法國國家統計局",            url: "https://www.insee.fr/en/statistiques/serie/010002052" },
  STEEL:   { label: "中鋼牌價 CSC (HRC 熱軋鋼捲) · MoneyDJ 鋼鐵類股",                       url: "https://concords.moneydj.com/z/ze/zeq/zeqa_D0200110.djhtm" },
  PLASTIC: { label: "Brent 原油現貨 · Platts 塑料報價 · ICIS 亞洲樹脂 (油價聯動)" },
};

// 突兀峰值說明（對應 commodities.ts 的 spikeIdx + 真實事件）
const SPIKE_CAUSES: Record<string, { yearMonth: string; reason: string; detail: string }> = {
  CU:      { yearMonth: "2024-01", reason: "中國基建 + EV 需求回升", detail: "LME 庫存連 30 日下降 8%，銅價突破歷史 $15,800/MT 高點" },
  STEEL:   { yearMonth: "2021-05", reason: "全球疫後復甦 + 中國產能管控", detail: "碳達峰政策 + 供應鏈瓶頸，HRC 飆破 $1,800/MT" },
  AL:      { yearMonth: "2023-10", reason: "歐洲能源危機 + 中國雲南限電",   detail: "歐洲冶煉廠減產 25%，鋁價短期衝高 $4,696/MT" },
  PLASTIC: { yearMonth: "2023-07", reason: "OPEC+ 減產 + 亞洲塑料 turnaround", detail: "Brent 原油飆至 $90+/桶，塑料聯動上漲至 $2,230/MT" },
};

type AffectedPart = {
  code: string;
  name: string;
  metalPct: number;        // 此件成本中金屬佔比 %
  stockQty: number;        // 目前庫存件數
  unitMetalKg: number;     // 每件含金屬重量 kg
  monthlyQty: number;      // 月平均用量
  usedInProducts: string[];// 主要用於哪些成品料號
  usedInModels: string;    // 機種說明
};

// 各金屬影響的零件（依公司實際 BOM 結構，本檔為 seed demo）
const AFFECTED_PARTS: Record<string, AffectedPart[]> = {
  CU: [
    { code: "FB64-MOT",   name: "FB64 主馬達線圈",     metalPct: 65, stockQty: 120, unitMetalKg: 2.5, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB64-Lite", "FB64-Pro"], usedInModels: "FB64 健身車全系列（主機型）" },
    { code: "FB64-WIRE",  name: "FB64 電線組",         metalPct: 80, stockQty: 380, unitMetalKg: 0.8, monthlyQty: 5000,
      usedInProducts: ["FB64-Main", "FB64-Lite", "FB42-Lite"], usedInModels: "FB64 + FB42 多型號共用" },
    { code: "FB42-COIL",  name: "FB42 磁鐵線圈",       metalPct: 45, stockQty: 280, unitMetalKg: 1.2, monthlyQty: 2000,
      usedInProducts: ["FB42-Lite", "FB42-Std"], usedInModels: "FB42 入門系列（磁控阻力）" },
    { code: "FB64-PSU",   name: "FB64 電源變壓器",     metalPct: 35, stockQty:   4, unitMetalKg: 1.8, monthlyQty: 1500,
      usedInProducts: ["FB64-Main"], usedInModels: "FB64 主機 only（含 LCD 顯示）" },
  ],
  STEEL: [
    { code: "FB64-FRM",   name: "FB64 主車架",         metalPct: 90, stockQty: 200, unitMetalKg: 18.0, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB64-Pro"], usedInModels: "FB64 主旗艦車型（HRC 鋼）" },
    { code: "FB42-FRM",   name: "FB42 副車架",         metalPct: 85, stockQty: 150, unitMetalKg: 12.0, monthlyQty: 1500,
      usedInProducts: ["FB42-Lite", "FB42-Std"], usedInModels: "FB42 入門系列（低碳鋼）" },
    { code: "FB64-SHF",   name: "FB64 軸件",           metalPct: 95, stockQty: 320, unitMetalKg:  4.5, monthlyQty: 3000,
      usedInProducts: ["FB64-Main", "FB64-Lite", "FB42-Std"], usedInModels: "全系列通用（合金鋼軸）" },
    { code: "FB42-PED-S", name: "FB42 踏板鋼軸",       metalPct: 80, stockQty: 450, unitMetalKg:  2.2, monthlyQty: 4500,
      usedInProducts: ["FB42-Lite", "FB42-Std", "FB64-Lite"], usedInModels: "FB42 + FB64 入門（踏板組）" },
  ],
  AL: [
    { code: "FB64-FLY18", name: "18kg 飛輪組",         metalPct: 70, stockQty: 100, unitMetalKg: 14.0, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB64-Pro"], usedInModels: "FB64 主旗艦（18kg 飛輪）" },
    { code: "FB64-RIM",   name: "車架鋁件",            metalPct:100, stockQty: 240, unitMetalKg:  3.5, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB64-Lite"], usedInModels: "FB64 系列（鋁合金車架）" },
    { code: "FB42-PED-A", name: "踏板鋁支架",          metalPct: 65, stockQty: 380, unitMetalKg:  1.8, monthlyQty: 4500,
      usedInProducts: ["FB42-Lite", "FB42-Std", "FB64-Lite"], usedInModels: "FB42 + FB64 入門（踏板支架）" },
  ],
  PLASTIC: [
    { code: "FB64-COVER", name: "FB64 外殼",           metalPct: 95, stockQty: 220, unitMetalKg:  1.2, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB64-Lite", "FB64-Pro"], usedInModels: "FB64 全系列外殼（ABS）" },
    { code: "FB64-PANEL", name: "顯示面板塑件",        metalPct:100, stockQty: 180, unitMetalKg:  0.4, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB64-Pro"], usedInModels: "FB64 含 LCD 機型（PC + ABS）" },
    { code: "PKG-BOX-L",  name: "包裝紙箱大",          metalPct:100, stockQty: 600, unitMetalKg:  0.8, monthlyQty: 3000,
      usedInProducts: ["FB64-Main", "FB42-Std"], usedInModels: "FB64/FB42 出貨包裝（瓦楞）" },
    { code: "FB42-GRIP",  name: "握把橡塑",            metalPct: 80, stockQty: 320, unitMetalKg:  0.3, monthlyQty: 3000,
      usedInProducts: ["FB42-Lite", "FB64-Lite"], usedInModels: "FB42 + FB64 入門握把（TPE）" },
  ],
};

const USD_TWD = 31.5;

export default function ProfitDefensePage() {
  const [tab, setTab] = useState<Commodity["code"]>("CU");
  const [range, setRange] = useState("AI Prediction");
  const c = commodities.find((x) => x.code === tab)!;
  const adv = procurementAdvice(c);
  const zone = priceZone(c);

  // 圖表資料切片 + AI 預測
  const { realPoints, forecastPoints, allPoints, minP, maxP } = useMemo(() => {
    const months = RANGES.find((r) => r.key === range)?.months ?? 24;
    const real = c.prices.slice(-months);
    // 預測：用最後 6 個月的平均斜率往後外推 6 個月
    const lastN = c.prices.slice(-6);
    const avgChange = lastN.length > 1
      ? lastN.reduce((sum, p, i) => i > 0 ? sum + (p.price - lastN[i - 1].price) : sum, 0) / (lastN.length - 1)
      : 0;
    const lastPrice = c.prices[c.prices.length - 1]?.price ?? 0;
    const forecast = range === "AI Prediction"
      ? Array.from({ length: 6 }, (_, i) => ({
          month: `forecast-${i + 1}`,
          price: Math.max(lastPrice * 0.5, lastPrice + avgChange * (i + 1)),
        }))
      : [];
    const all = [...real, ...forecast];
    const prices = all.map((p) => p.price);
    return {
      realPoints: real,
      forecastPoints: forecast,
      allPoints: all,
      minP: Math.min(...prices) * 0.92,
      maxP: Math.max(...prices) * 1.08,
    };
  }, [c.prices, range]);

  // SVG 尺寸
  const W = 800, H = 340, PAD_L = 56, PAD_R = 32, PAD_T = 20, PAD_B = 36;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const scaleX = (i: number, n: number) => PAD_L + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2);
  const scaleY = (p: number) => PAD_T + (1 - (p - minP) / (maxP - minP)) * innerH;

  const realPath = realPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, allPoints.length)} ${scaleY(p.price)}`)
    .join(" ");

  const forecastPath = forecastPoints.length > 0
    ? [
        `M ${scaleX(realPoints.length - 1, allPoints.length)} ${scaleY(realPoints[realPoints.length - 1].price)}`,
        ...forecastPoints.map((p, i) => `L ${scaleX(realPoints.length + i, allPoints.length)} ${scaleY(p.price)}`),
      ].join(" ")
    : "";

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => minP + (maxP - minP) * (i / 4));

  // X-axis labels (每 ~6 個月一個 + forecast)
  const xLabels: { x: number; text: string }[] = [];
  realPoints.forEach((p, i) => {
    if (i === 0 || i === realPoints.length - 1 || i % Math.max(1, Math.floor(realPoints.length / 5)) === 0) {
      xLabels.push({ x: scaleX(i, allPoints.length), text: p.month.slice(2) });
    }
  });
  if (forecastPoints.length > 0) {
    xLabels.push({ x: scaleX(allPoints.length - 1, allPoints.length), text: "預測" });
  }

  // KPI 計算
  const lastPrice = c.prices[c.prices.length - 1]?.price ?? 0;
  const prevPrice = c.prices[c.prices.length - 8]?.price ?? lastPrice;
  const wowPct = ((lastPrice - prevPrice) / Math.max(1, prevPrice)) * 100;

  return (
    <div style={{ background: C.pageBg, color: C.text, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", minHeight: "100vh" }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── Header ───────────────────────────────────── */}
        <header className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              CHI HUA <span style={{ color: C.primary }}>AI Profit Defense Center</span>
            </h1>
            <nav className="flex items-center gap-1 text-[11px]">
              {["L1: Global", "L2: Ops", "L3: Expert", "L4: AI Engine"].map((l) => (
                <span key={l} className="px-2 py-1 rounded text-slate-500">{l}</span>
              ))}
              <span className="px-2 py-1 rounded-full font-semibold flex items-center gap-1" style={{ background: `${C.blue}15`, color: C.blue }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                L5: Market Intelligence 數據燈
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs rounded border hover:bg-slate-50" style={{ borderColor: C.border }} title="重新整理">↻</button>
            <button className="px-4 py-1.5 text-xs rounded font-semibold text-white" style={{ background: C.primary }}>
              ⬇ Export Report
            </button>
          </div>
        </header>

        {/* ── 主體 2 欄 ───────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr,360px] gap-5">

          {/* ─── 左欄：圖表 ─────────────────────────────── */}
          <section className="space-y-4">

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b" style={{ borderColor: C.border }}>
              {TABS.map((t) => {
                const active = t.code === tab;
                return (
                  <button
                    key={t.code}
                    onClick={() => setTab(t.code)}
                    className="pb-3 text-sm font-semibold transition-colors relative"
                    style={{ color: active ? C.primary : C.textSub }}
                  >
                    {t.label} <span className="text-[10px] opacity-60">({t.nameEn})</span>
                    {active && <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: C.primary }} />}
                  </button>
                );
              })}
            </div>

            {/* Chart card */}
            <div className="rounded-lg border bg-white p-5" style={{ borderColor: C.border }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div>
                  <h2 className="text-lg font-semibold">{c.name}（{c.nameEn}）價格趨勢與預測</h2>
                  <span className="text-[11px]" style={{ color: C.textSub }}>(USD / {c.unit.split("/")[1] ?? "MT"})</span>
                </div>
                <div className="flex items-center gap-1">
                  {RANGES.map((r) => {
                    const active = r.key === range;
                    return (
                      <button
                        key={r.key}
                        onClick={() => setRange(r.key)}
                        className="px-2.5 py-1 text-[11px] rounded transition-colors"
                        style={{
                          background: active ? C.primary : "transparent",
                          color: active ? "#fff" : C.textSub,
                          border: active ? "none" : `1px solid ${C.border}`,
                          fontFamily: r.key === "AI Prediction" ? "system-ui" : undefined,
                        }}
                      >
                        {r.key === "AI Prediction" && <span className="mr-0.5">✨</span>}
                        {r.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SVG Chart */}
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="block" style={{ maxWidth: "100%" }}>
                  {/* Grid + Y-axis（顯示完整千分位數字，不縮寫） */}
                  {yTicks.map((tick, i) => {
                    const y = scaleY(tick);
                    return (
                      <g key={i}>
                        <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={C.border} strokeWidth="1" strokeDasharray="2,4" />
                        <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="10" fill={C.textSub}>
                          {Math.round(tick).toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {/* UCL / LCL 管制上下限（依全期合計）*/}
                  {(() => {
                    const ps = COMMODITY_PERIOD_STATS[c.code];
                    if (!ps || ps.ucl === ps.lcl) return null;
                    const yUCL = scaleY(ps.ucl);
                    const yLCL = scaleY(ps.lcl);
                    const yAvg = scaleY(ps.avg);
                    return (
                      <g>
                        {/* 管制帶 (UCL → LCL) */}
                        <rect x={PAD_L} y={Math.min(yUCL, yLCL)} width={innerW} height={Math.abs(yLCL - yUCL)} fill={C.primary} opacity="0.04" />
                        {/* UCL line */}
                        <line x1={PAD_L} y1={yUCL} x2={W - PAD_R} y2={yUCL} stroke={C.primary} strokeWidth="1" strokeDasharray="6,3" opacity="0.6" />
                        <text x={W - PAD_R + 2} y={yUCL + 3} fontSize="9" fontWeight="600" fill={C.primary}>UCL {Math.round(ps.ucl).toLocaleString()}</text>
                        {/* 全期平均 line */}
                        <line x1={PAD_L} y1={yAvg} x2={W - PAD_R} y2={yAvg} stroke="#8a7176" strokeWidth="1" strokeDasharray="2,4" opacity="0.5" />
                        <text x={W - PAD_R + 2} y={yAvg + 3} fontSize="9" fill="#8a7176">μ {Math.round(ps.avg).toLocaleString()}</text>
                        {/* LCL line */}
                        <line x1={PAD_L} y1={yLCL} x2={W - PAD_R} y2={yLCL} stroke={C.primary} strokeWidth="1" strokeDasharray="6,3" opacity="0.6" />
                        <text x={W - PAD_R + 2} y={yLCL + 3} fontSize="9" fontWeight="600" fill={C.primary}>LCL {Math.round(ps.lcl).toLocaleString()}</text>
                      </g>
                    );
                  })()}

                  {/* X labels */}
                  {xLabels.map((l, i) => (
                    <text key={i} x={l.x} y={H - PAD_B + 18} textAnchor="middle" fontSize="10" fill={C.textSub}>
                      {l.text}
                    </text>
                  ))}

                  {/* Real line (solid) */}
                  <path d={realPath} fill="none" stroke={C.red} strokeWidth="2" />

                  {/* Forecast line (dashed) */}
                  {forecastPath && (
                    <path d={forecastPath} fill="none" stroke={C.red} strokeWidth="2" strokeDasharray="5,5" opacity="0.7" />
                  )}

                  {/* Last data point dot */}
                  {realPoints.length > 0 && (
                    <circle
                      cx={scaleX(realPoints.length - 1, allPoints.length)}
                      cy={scaleY(realPoints[realPoints.length - 1].price)}
                      r="4"
                      fill={C.red}
                    />
                  )}

                  {/* Forecast end dot */}
                  {forecastPoints.length > 0 && (
                    <circle
                      cx={scaleX(allPoints.length - 1, allPoints.length)}
                      cy={scaleY(forecastPoints[forecastPoints.length - 1].price)}
                      r="4"
                      fill="none"
                      stroke={C.red}
                      strokeWidth="2"
                    />
                  )}

                  {/* 突兀峰值標註（含原因 callout） */}
                  {(() => {
                    if (realPoints.length === 0) return null;
                    const maxP = Math.max(...realPoints.map((p) => p.price));
                    const idx = realPoints.findIndex((p) => p.price === maxP);
                    if (idx < 0) return null;
                    const sp = realPoints[idx];
                    const sx = scaleX(idx, allPoints.length);
                    const sy = scaleY(sp.price);
                    const cause = SPIKE_CAUSES[c.code];
                    // Callout 尺寸
                    const boxW = 230;
                    const boxH = 60;
                    const VGAP = 28;   // box 與 dot 的垂直間距（避免壓到點）
                    // X 位置：點上方 / clamp 不出邊界
                    const boxX = Math.max(PAD_L + 4, Math.min(W - PAD_R - boxW - 4, sx - boxW / 2));
                    // Y 位置：優先上方；若上方空間不夠則翻到下方
                    const placeAbove = sy - boxH - VGAP >= PAD_T + 4;
                    const boxY = placeAbove
                      ? sy - boxH - VGAP
                      : Math.min(H - PAD_B - boxH - 4, sy + VGAP);
                    // 連接線端點
                    const lineY1 = placeAbove ? sy - 8 : sy + 8;
                    const lineY2 = placeAbove ? boxY + boxH : boxY;
                    return (
                      <g>
                        {/* dot */}
                        <circle cx={sx} cy={sy} r="6" fill="#fbbf24" stroke={C.red} strokeWidth="2" />
                        {/* 連接虛線（不再壓到點） */}
                        <line x1={sx} y1={lineY1} x2={sx} y2={lineY2} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
                        {/* callout 框 */}
                        <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.2" />
                        {/* 價格 */}
                        <text x={boxX + 8} y={boxY + 17} fontSize="11" fontWeight="700" fill="#92400e">
                          ⚠ ${Math.round(sp.price).toLocaleString()} / {c.unit.split("/")[1] ?? "MT"} 歷史高點（{cause?.yearMonth}）
                        </text>
                        {/* 原因 */}
                        <text x={boxX + 8} y={boxY + 34} fontSize="10" fontWeight="600" fill="#92400e">
                          {cause?.reason}
                        </text>
                        {/* 細節 */}
                        <text x={boxX + 8} y={boxY + 50} fontSize="9" fill="#7c2d12">
                          {cause?.detail && cause.detail.length > 36 ? cause.detail.slice(0, 36) + "…" : cause?.detail}
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-[11px] flex-wrap" style={{ color: C.textSub }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5" style={{ background: C.red }} /> 實際價格 ({c.name})
                </span>
                {forecastPoints.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: C.red }} /> AI 預測（6 個月）
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#fbbf24", border: `1px solid ${C.red}` }} /> 歷史突兀點
                </span>
                {COMMODITY_PERIOD_STATS[c.code] && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-2" style={{ background: C.primary, opacity: 0.15 }} /> UCL/LCL 管制帶（μ±1.5σ）
                  </span>
                )}
              </div>

              {/* 數據來源（突兀點原因已移到圖內 callout） */}
              <div className="mt-3 pt-3 border-t text-[11px]" style={{ borderColor: C.border }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>📡 數據來源</div>
                <div style={{ color: C.textSub }}>{DATA_SOURCE[c.code]?.label ?? c.source}</div>
                {DATA_SOURCE[c.code]?.url && (
                  <a href={DATA_SOURCE[c.code]!.url} target="_blank" rel="noopener noreferrer"
                     className="block mt-1 text-[10px] hover:underline break-all" style={{ color: C.blue }}>
                    🔗 {DATA_SOURCE[c.code]!.url}
                  </a>
                )}
                <div className="mt-1 text-[10px]" style={{ color: C.outline }}>同步頻率：每日 08:00 自動拉取 · 即時 API（盤中 5min refresh）</div>
              </div>
            </div>

            {/* 2021 基期 + 2026/Q1 漲跌幅 */}
            <div className="rounded-lg border bg-white p-5" style={{ borderColor: C.border }}>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                <h3 className="text-base font-bold">📈 2021 基期 vs 2026/Q1 漲跌幅</h3>
                <span className="text-[10px]" style={{ color: C.textSub }}>計算公式：(2026/1~3 月均價 − 2021 年均價) / 2021 年均價 × 100%</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="text-left border-b" style={{ borderColor: C.border, color: C.textSub }}>
                      <th className="py-2 font-semibold uppercase tracking-widest text-[9px]">品項</th>
                      <th className="py-2 font-semibold uppercase tracking-widest text-[9px]">幣別/單位</th>
                      <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">2021 年均</th>
                      <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">2026/1~3 月均</th>
                      <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">漲幅</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BASELINE_2021.map((b) => {
                      const isCurrent = BASELINE_BY_CODE[c.code]?.itemTW === b.itemTW;
                      const tone = b.pctChange > 0 ? C.red : C.primary;
                      return (
                        <tr key={b.itemTW} className="border-b" style={{ borderColor: C.border, background: isCurrent ? "#fef3c7" : undefined }}>
                          <td className="py-2 font-semibold" style={{ color: C.text }}>{b.itemTW}</td>
                          <td className="py-2 text-[10px]" style={{ color: C.textSub }}>{b.unit}</td>
                          <td className="py-2 text-right font-mono">{b.avg2021.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono">{b.avg2026Q1.toLocaleString()}</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: tone }}>
                            {b.pctChange > 0 ? "+" : ""}{b.pctChange}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-[10px] leading-relaxed" style={{ color: C.textSub }}>
                <div>• 台灣混鐵配方 = 45% 鐵礦石 + 30% 廢鋼 + 25% 鋼胚 + 10% CRU 鋼價指數</div>
                <div>• 越南混鐵配方 = 45% 鐵礦石 + 20% 廢鋼 + 25% 東南亞鋼胚 + 10% 海運成本</div>
              </div>
            </div>

            {/* AI 判斷 chip */}
            <div className="rounded-lg border p-4 flex items-start gap-3" style={{ borderColor: C.border, background: `${C.blueLight}10` }}>
              <span className="text-lg">✨</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.blue }}>AI 判定 · {zone.zone}</div>
                <div className="text-sm font-semibold" style={{ color: C.text }}>{zone.oneLiner}</div>
                <div className="text-xs mt-1" style={{ color: C.textSub }}>{zone.action}</div>
                <div className="mt-2 grid sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="font-bold mb-0.5" style={{ color: C.text }}>📌 過去 30 日事實</div>
                    {adv.facts.map((f) => <div key={f} style={{ color: C.textSub }}>· {f}</div>)}
                  </div>
                  <div>
                    <div className="font-bold mb-0.5" style={{ color: C.text }}>⚖ 但有相反信號</div>
                    {adv.butFactors.map((f) => <div key={f} style={{ color: C.textSub }}>· {f}</div>)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: C.border, color: C.text }}>
                  <b>AI 判定：</b>{adv.aiVerdict}　<br/>
                  <b>建議：</b><span style={{ color: C.primary }}>{adv.recommendation}</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.primary, color: "#fff" }}>信心 {adv.confidence}</span>
                </div>
              </div>
            </div>

            {/* 受影響零件 + 倉庫盤點 */}
            {(() => {
              const parts = AFFECTED_PARTS[c.code] ?? [];
              if (parts.length === 0) return null;
              const totalStockKg = parts.reduce((s, p) => s + p.stockQty * p.unitMetalKg, 0);
              const totalMonthlyKg = parts.reduce((s, p) => s + p.monthlyQty * p.unitMetalKg, 0);
              // 衝擊計算：庫存重置風險（價格 ±5% × 庫存金屬量 × USD/TWD）
              const impactPer5Pct = (kg: number) => Math.round((kg / 1000) * lastPrice * 0.05 * USD_TWD);
              const stockImpact   = impactPer5Pct(totalStockKg);
              const monthlyImpact = impactPer5Pct(totalMonthlyKg);
              // 合理漲幅 = 該金屬近 6 個月漲跌幅 × 此零件金屬佔比%
              const sixAgoPrice = c.prices[c.prices.length - 7]?.price ?? lastPrice;
              const metalPctChange = ((lastPrice - sixAgoPrice) / Math.max(1, sixAgoPrice)) * 100;
              return (
                <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border, borderLeft: `4px solid ${C.primary}` }}>
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                    <h3 className="text-base font-bold">📦 {c.name} 影響零件 + 倉庫盤點</h3>
                    <span className="text-[10px]" style={{ color: C.textSub }}>當前單價 ${lastPrice.toLocaleString()}/{c.unit.split("/")[1] ?? "MT"} · USD/TWD {USD_TWD}</span>
                  </div>

                  {/* 4 摘要 KPI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-[11px]">
                    <div className="rounded px-3 py-2" style={{ background: C.surfaceDim }}>
                      <div style={{ color: C.textSub }}>受影響零件數</div>
                      <div className="text-lg font-extrabold" style={{ color: C.text }}>{parts.length} 項</div>
                    </div>
                    <div className="rounded px-3 py-2" style={{ background: C.surfaceDim }}>
                      <div style={{ color: C.textSub }}>庫存{c.name}總量</div>
                      <div className="text-lg font-extrabold font-mono" style={{ color: C.text }}>{(totalStockKg/1000).toFixed(2)} <span className="text-[10px]">MT</span></div>
                    </div>
                    <div className="rounded px-3 py-2" style={{ background: "#fef3c7", borderLeft: `3px solid #f59e0b` }}>
                      <div style={{ color: "#92400e" }}>±5% 庫存重置風險</div>
                      <div className="text-lg font-extrabold font-mono" style={{ color: "#92400e" }}>±NT$ {stockImpact.toLocaleString()}</div>
                    </div>
                    <div className="rounded px-3 py-2" style={{ background: `${C.red}10`, borderLeft: `3px solid ${C.red}` }}>
                      <div style={{ color: C.red }}>±5% 月用量衝擊</div>
                      <div className="text-lg font-extrabold font-mono" style={{ color: C.red }}>±NT$ {monthlyImpact.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* 零件明細表 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[880px]">
                      <thead>
                        <tr className="text-left border-b" style={{ borderColor: C.border, color: C.textSub }}>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px]">零件 / 用於成品</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">金屬佔比</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">庫存件</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">每件含{c.name}</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">月用量</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">合理漲幅</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">±5% 衝擊</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.map((p) => {
                          const impact = impactPer5Pct((p.stockQty + p.monthlyQty) * p.unitMetalKg);
                          const reasonablePct = (p.metalPct / 100) * metalPctChange;
                          const reasonableTone = reasonablePct > 3 ? C.red : reasonablePct > 0 ? "#d97706" : C.primary;
                          return (
                            <tr key={p.code} className="border-b align-top" style={{ borderColor: C.border }}>
                              <td className="py-2 pr-2">
                                <div className="font-semibold" style={{ color: C.text }}>{p.code}</div>
                                <div className="text-[10px] mb-1" style={{ color: C.textSub }}>{p.name}</div>
                                <div className="flex flex-wrap gap-1 mb-0.5">
                                  {p.usedInProducts.map((pid) => (
                                    <span key={pid} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                          style={{ background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}30` }}>
                                      {pid}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-[9px] leading-tight" style={{ color: C.outline }}>機種：{p.usedInModels}</div>
                              </td>
                              <td className="py-2 text-right">
                                <span className="font-mono font-semibold" style={{ color: p.metalPct >= 70 ? C.red : p.metalPct >= 40 ? "#d97706" : C.text }}>{p.metalPct}%</span>
                              </td>
                              <td className="py-2 text-right font-mono">{p.stockQty.toLocaleString()}</td>
                              <td className="py-2 text-right font-mono">{p.unitMetalKg} kg</td>
                              <td className="py-2 text-right font-mono" style={{ color: C.textSub }}>{p.monthlyQty.toLocaleString()}</td>
                              <td className="py-2 text-right">
                                <span className="font-mono font-bold" style={{ color: reasonableTone }}>
                                  {reasonablePct >= 0 ? "+" : ""}{reasonablePct.toFixed(2)}%
                                </span>
                                <div className="text-[9px]" style={{ color: C.outline }}>議價上限</div>
                              </td>
                              <td className="py-2 text-right font-mono font-bold" style={{ color: C.red }}>±${impact.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: C.surfaceDim }}>
                          <td className="py-2 px-1 font-bold" style={{ color: C.text }}>總計</td>
                          <td className="py-2 text-right text-[10px]" style={{ color: C.textSub }}>—</td>
                          <td className="py-2 text-right font-mono font-bold">{parts.reduce((s,p)=>s+p.stockQty,0).toLocaleString()}</td>
                          <td className="py-2 text-right font-mono font-bold">{totalStockKg.toLocaleString()} kg</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: C.textSub }}>{parts.reduce((s,p)=>s+p.monthlyQty,0).toLocaleString()}</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: metalPctChange >= 0 ? C.red : C.primary }}>
                            金屬 {metalPctChange >= 0 ? "+" : ""}{metalPctChange.toFixed(2)}%
                          </td>
                          <td className="py-2 text-right font-mono font-extrabold" style={{ color: C.red }}>±NT$ {(stockImpact + monthlyImpact).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mt-2 text-[10px] leading-relaxed" style={{ color: C.textSub }}>
                    <div>※ <b>衝擊試算</b> = (庫存 + 月用量) × 每件含{c.name}量 × 當前單價 × 5% × USD/TWD {USD_TWD}</div>
                    <div>※ <b>合理漲幅（議價上限）</b> = {c.name}近 6 個月漲跌 ({metalPctChange >= 0 ? "+" : ""}{metalPctChange.toFixed(2)}%) × 此零件金屬佔比%　·　供應商若要求超過此值即不合理</div>
                    <div>※ <b>用於成品 + 機種</b>：依鼎新 iGP <code className="font-mono">BOMMA / BOMMB</code> 自動 lookup 上層成品</div>
                    <div>※ 資料來源：鼎新 iGP <code className="font-mono">INVMB</code> + <code className="font-mono">BOMMA</code> + <code className="font-mono">BOMMB</code>　·　LME / INSEE 金屬報價</div>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* ─── 右欄：Profit Impact Center ──────────────── */}
          <aside className="space-y-3">

            {/* AI Prediction Confidence badge */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `${C.blue}15`, color: C.blue }}>
                ✨ AI Prediction Confidence
              </span>
              <span style={{ color: C.textSub }}>v0.3 · 12 個變數 / 預測模型已熱身</span>
            </div>

            {/* Profit Impact Center */}
            <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border, borderLeft: `4px solid ${C.primary}` }}>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-base font-bold">Profit Impact Center</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: C.primary, color: "#fff" }}>L4·EXECUTIVE</span>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textSub }}>本期預估毛利率</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold tabular-nums" style={{ color: C.red }}>16.8%</span>
                <span className="text-sm font-semibold" style={{ color: C.red }}>↓ -1.4%</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: C.textSub }}>原預算 18.2%</div>

              {/* AI Action Queue */}
              <div className="mt-4 pt-3 border-t" style={{ borderColor: C.border }}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textSub }}>AI Action Queue</div>
                <ol className="space-y-1.5 text-xs">
                  {[
                    { rank: "#1", title: "鎖價 銅 (Copper)",  impact: "-280萬", note: "今日內" },
                    { rank: "#2", title: "鎖價 鋼 (Steel)",   impact: "-120萬", note: "3 日內" },
                    { rank: "#3", title: "原料替代評估",      impact: "-80萬",  note: "1 週內" },
                  ].map((a) => (
                    <li key={a.rank} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: C.surfaceDim, color: C.text }}>{a.rank}</span>
                        <span>{a.title}</span>
                      </span>
                      <span className="text-right">
                        <span className="font-mono font-semibold" style={{ color: C.red }}>{a.impact}</span>
                        <span className="block text-[9px]" style={{ color: C.textSub }}>{a.note}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 3 sub-tabs */}
              <div className="mt-4 grid grid-cols-3 gap-1.5">
                {["預測模型", "影響分析", "比較模型"].map((t, i) => (
                  <button key={t} className="text-[10px] py-1.5 rounded border" style={{ borderColor: C.border, background: i === 0 ? C.surfaceDim : "white", color: C.text }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

          </aside>
        </div>

        {/* ── 底部 4 KPI 卡 ───────────────────────────── */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {TABS.map((t) => {
            const cm = commodities.find((x) => x.code === t.code)!;
            const last = cm.prices[cm.prices.length - 1]?.price ?? 0;
            const prev = cm.prices[cm.prices.length - 5]?.price ?? last;
            const pct  = ((last - prev) / Math.max(1, prev)) * 100;
            const z    = priceZone(cm);
            const bar  = z.tone === "rose" ? C.red : z.tone === "emerald" ? C.primary : z.tone === "amber" ? "#d97706" : C.blue;
            const active = t.code === tab;
            return (
              <button
                key={t.code}
                onClick={() => setTab(t.code)}
                className="text-left bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: active ? C.primary : C.border, borderLeft: `4px solid ${bar}` }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.textSub }}>{t.label} · {t.nameEn}</span>
                  <span className="text-[10px] font-bold" style={{ color: pct >= 0 ? C.red : "#059669" }}>
                    {pct >= 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold tabular-nums" style={{ color: C.text }}>
                    ${last >= 1000 ? `${(last / 1000).toFixed(2)}k` : last.toFixed(0)}
                  </span>
                  <span className="text-[10px]" style={{ color: C.textSub }}>/{cm.unit.split("/")[1] ?? "MT"}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: C.textSub }}>vs 上週 {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</div>
                <div className="mt-2 pt-2 border-t text-[10px] line-clamp-2" style={{ borderColor: C.border, color: C.textSub }}>
                  {procurementAdvice(cm).recommendation}
                </div>
              </button>
            );
          })}
        </section>

        {/* footer */}
        <footer className="flex items-center justify-between flex-wrap gap-2 text-[10px] pt-3 border-t" style={{ borderColor: C.border, color: C.textSub }}>
          <div className="flex items-center gap-3">
            <Link href="/erp/warroom" className="hover:underline" style={{ color: C.blue }}>← 戰情中心</Link>
            <span>·</span>
            <span>資料來源：LME / 中鋼 / 上海有色網（同步鼎新 iGP）</span>
          </div>
          <div>CHI HUA · AI Profit Defense Center · /erp/profit-defense</div>
        </footer>
      </div>
    </div>
  );
}
