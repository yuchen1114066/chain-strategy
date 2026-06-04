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
  { code: "CU",       label: "銅",   nameEn: "Copper" },
  { code: "STEEL",    label: "鋼",   nameEn: "Steel" },
  { code: "AL",       label: "鋁",   nameEn: "Aluminum" },
  { code: "PLASTIC",  label: "塑料", nameEn: "Plastic" },
  { code: "PIG_IRON", label: "混鐵", nameEn: "Pig Iron" },
];

const RANGES: { key: string; months: number }[] = [
  { key: "1M",            months: 1   },
  { key: "3M",            months: 3   },
  { key: "1Y",            months: 12  },
  { key: "10Y",           months: 120 },
  { key: "AI Prediction", months: 24  },
];

// 資料來源（每個商品對應的權威報價源 + URL）
const DATA_SOURCE: Record<string, { label: string; url?: string }> = {
  CU:      { label: "LME 倫敦金屬交易所 (Copper Grade A spot) · INSEE 法國國家統計局",     url: "https://www.insee.fr/en/statistiques/serie/010002052" },
  AL:      { label: "LME 倫敦金屬交易所 (Aluminum spot) · INSEE 法國國家統計局",            url: "https://www.insee.fr/en/statistiques/serie/010002052" },
  STEEL:   { label: "中鋼牌價 CSC（CR 冷軋鋼捲）· MoneyDJ 鋼鐵類股",                       url: "https://concords.moneydj.com/z/ze/zeq/zeqa_D0200110.djhtm" },
  PLASTIC:  { label: "Brent 原油現貨 · Platts 塑料報價 · ICIS 亞洲樹脂 (油價聯動)" },
  PIG_IRON: { label: "中鋼牌價 · 台灣鋼鐵公會 · Hoa Phat 越南鋼鐵（台/越混鐵均價）",
              url: "https://concords.moneydj.com/z/ze/zeq/zeqa_D0200110.djhtm" },
};

// 突兀峰值說明（對應 commodities.ts 的 spikeIdx + 真實事件）
const SPIKE_CAUSES: Record<string, { yearMonth: string; reason: string; detail: string }> = {
  CU:      { yearMonth: "2024-01", reason: "中國基建 + EV 需求回升", detail: "LME 庫存連 30 日下降 8%，銅價突破歷史 $15,800/MT 高點" },
  STEEL:   { yearMonth: "2021-05", reason: "全球疫後復甦 + 中國產能管控", detail: "碳達峰政策 + 供應鏈瓶頸，CR 冷軋鋼捲飆破 $1,800/MT" },
  AL:      { yearMonth: "2023-10", reason: "歐洲能源危機 + 中國雲南限電",   detail: "歐洲冶煉廠減產 25%，鋁價短期衝高 $4,696/MT" },
  PLASTIC:  { yearMonth: "2023-07", reason: "OPEC+ 減產 + 亞洲塑料 turnaround", detail: "Brent 原油飆至 $90+/桶，塑料聯動上漲至 $2,230/MT" },
  PIG_IRON: { yearMonth: "2021-05", reason: "鐵礦石飆漲 + 中國產能管控",         detail: "巴西淡水河谷礦災 + 中國碳達峰減產，混鐵衝高 NT$36,000/MT" },
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
      usedInProducts: ["FB64-Main", "FB64-Pro"], usedInModels: "FB64 主旗艦車型（CR 冷軋鋼）" },
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
  PIG_IRON: [
    { code: "TR-WEIGHT-20", name: "重訓鑄鐵塊 20kg",   metalPct:100, stockQty: 180, unitMetalKg: 20.0, monthlyQty: 800,
      usedInProducts: ["TR-Pro", "TR-Std"], usedInModels: "重訓器材槓鈴片（20kg）" },
    { code: "TR-WEIGHT-10", name: "重訓鑄鐵塊 10kg",   metalPct:100, stockQty: 240, unitMetalKg: 10.0, monthlyQty: 1200,
      usedInProducts: ["TR-Pro", "TR-Std", "TR-Home"], usedInModels: "重訓器材槓鈴片（10kg）" },
    { code: "FB-BASE",      name: "健身車鑄鐵底座",     metalPct: 85, stockQty: 320, unitMetalKg:  8.5, monthlyQty: 1500,
      usedInProducts: ["FB64-Main", "FB42-Std"], usedInModels: "健身車底座配重（穩定 + 防傾倒）" },
    { code: "TM-MOTOR-CASE",name: "跑步機馬達外殼",     metalPct: 75, stockQty:  85, unitMetalKg:  4.2, monthlyQty: 600,
      usedInProducts: ["TM-Pro", "TM-Std"], usedInModels: "跑步機主馬達鑄鐵外殼" },
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

                  {/* 突兀峰值標註（圖內只留小標籤，詳細說明移到圖外） */}
                  {(() => {
                    if (realPoints.length === 0) return null;
                    const maxP = Math.max(...realPoints.map((p) => p.price));
                    const idx = realPoints.findIndex((p) => p.price === maxP);
                    if (idx < 0) return null;
                    const sp = realPoints[idx];
                    const sx = scaleX(idx, allPoints.length);
                    const sy = scaleY(sp.price);
                    // 小標籤位置：點旁邊（左右擇空）
                    const onLeft = sx > (PAD_L + (W - PAD_R)) / 2;
                    const labelX = onLeft ? sx - 8 : sx + 8;
                    return (
                      <g>
                        <circle cx={sx} cy={sy} r="6" fill="#fbbf24" stroke={C.red} strokeWidth="2" />
                        <text x={labelX} y={sy - 12} textAnchor={onLeft ? "end" : "start"}
                              fontSize="11" fontWeight="700" fill="#92400e">
                          ⚠ ${Math.round(sp.price).toLocaleString()}
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

              {/* 圖外資訊：突兀點原因 + 數據來源（雙欄並排，不再蓋住折線圖） */}
              <div className="mt-3 pt-3 border-t grid sm:grid-cols-2 gap-3 text-[11px]" style={{ borderColor: C.border }}>
                {/* 左：突兀點原因 */}
                <div className="rounded-md p-3" style={{ background: "#fef3c7", border: `1px solid #f59e0b` }}>
                  <div className="font-bold mb-1" style={{ color: "#92400e" }}>
                    ⚠ 歷史突兀點 · {SPIKE_CAUSES[c.code]?.yearMonth}
                  </div>
                  <div className="text-sm font-bold" style={{ color: "#92400e" }}>{SPIKE_CAUSES[c.code]?.reason}</div>
                  <div className="mt-1" style={{ color: "#7c2d12" }}>{SPIKE_CAUSES[c.code]?.detail}</div>
                </div>
                {/* 右：數據來源 */}
                <div>
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
            </div>

            {/* 5 商品 KPI 卡（移到折線圖下方 — 同一排比較） */}
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
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

            {/* 成本敏感度分析 Cost Sensitivity Intelligence（Executive 版 — 移到漲跌幅之下） */}
            <div className="rounded-lg border bg-white p-5" style={{ borderColor: C.border, borderLeft: `4px solid ${C.primary}` }}>
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-base font-bold">成本敏感度分析</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: C.primary, color: "#fff" }}>L4·EXECUTIVE</span>
              </div>
              <div className="text-[11px] mb-4" style={{ color: C.textSub }}>Cost Sensitivity Intelligence</div>

              {/* 5 區塊以 2x3 grid 並排（橫展開，因為現在版面變寬了） */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 區塊 1 — 產品線風險排行 */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textSub, letterSpacing: "0.08em" }}>
                    ▎產品線風險排行
                  </div>
                  <ul className="text-xs">
                    {[
                      { line: "橢圓機", par: -320, risk: "高", riskColor: C.red },
                      { line: "飛輪車", par: -120, risk: "中", riskColor: "#d97706" },
                      { line: "重訓",   par:  -95, risk: "中", riskColor: "#d97706" },
                      { line: "跑步機", par:  +80, risk: "低", riskColor: "#059669" },
                    ].map((p) => (
                      <li key={p.line} className="flex items-baseline justify-between border-b py-1.5 last:border-0" style={{ borderColor: C.border }}>
                        <span className="font-semibold" style={{ color: C.text }}>{p.line}</span>
                        <span className="flex items-baseline gap-3">
                          <span className="font-mono font-semibold" style={{ color: p.par < 0 ? C.red : "#059669" }}>
                            {p.par > 0 ? "+" : ""}{p.par} 萬
                          </span>
                          <span className="text-xs font-bold w-6 text-right" style={{ color: p.riskColor }}>● {p.risk}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 區塊 2 — 成本構成（圓餅圖，文字直接放色塊上） */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textSub, letterSpacing: "0.08em" }}>
                    ▎成本構成
                  </div>
                  {(() => {
                    const slices = [
                      { name: "銅材", pct: 42, tone: C.red,     fg: "#ffffff" },
                      { name: "鋼材", pct: 18, tone: "#d97706", fg: "#ffffff" },
                      { name: "IC",   pct: 12, tone: C.blue,    fg: "#ffffff" },
                      { name: "塑膠", pct:  8, tone: "#059669", fg: "#ffffff" },
                      { name: "其他", pct: 20, tone: C.outline, fg: "#ffffff" },
                    ];
                    const total = slices.reduce((s, x) => s + x.pct, 0);
                    const SZ = 240;
                    const cx = SZ / 2, cy = SZ / 2;
                    const R = 110, ir = 58;
                    const labelR = (R + ir) / 2; // 文字錨點在環中線
                    let angle = -Math.PI / 2;
                    const arcs = slices.map((s) => {
                      const sweep = (s.pct / total) * Math.PI * 2;
                      const a0 = angle;
                      const a1 = angle + sweep;
                      angle = a1;
                      const largeArc = sweep > Math.PI ? 1 : 0;
                      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
                      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
                      const xi1 = cx + ir * Math.cos(a1), yi1 = cy + ir * Math.sin(a1);
                      const xi0 = cx + ir * Math.cos(a0), yi0 = cy + ir * Math.sin(a0);
                      const d = `M ${x0} ${y0} A ${R} ${R} 0 ${largeArc} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${largeArc} 0 ${xi0} ${yi0} Z`;
                      const mid = (a0 + a1) / 2;
                      const lx = cx + labelR * Math.cos(mid);
                      const ly = cy + labelR * Math.sin(mid);
                      // 小片（< 5%）只顯示百分比，更小片不顯示
                      const showName = s.pct >= 10;
                      const showPct  = s.pct >= 5;
                      return { ...s, d, lx, ly, showName, showPct };
                    });
                    return (
                      <div className="flex justify-center">
                        <svg viewBox={`0 0 ${SZ} ${SZ}`} width="100%" height="auto" style={{ maxWidth: SZ }}>
                          {arcs.map((a) => (
                            <g key={a.name}>
                              <path d={a.d} fill={a.tone} stroke="#fff" strokeWidth="2" />
                              {a.showName && (
                                <text x={a.lx} y={a.ly - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill={a.fg}>
                                  {a.name}
                                </text>
                              )}
                              {a.showPct && (
                                <text
                                  x={a.lx}
                                  y={a.showName ? a.ly + 10 : a.ly + 4}
                                  textAnchor="middle"
                                  fontSize={a.showName ? "12" : "11"}
                                  fontWeight="600"
                                  fill={a.fg}
                                  fontFamily="monospace"
                                >
                                  {a.pct}%
                                </text>
                              )}
                            </g>
                          ))}
                          {/* 中央文字 */}
                          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill={C.textSub}>合計</text>
                          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fontWeight="800" fill={C.text}>100%</text>
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* 區塊 3 — 成本敏感度 */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textSub, letterSpacing: "0.08em" }}>
                    ▎成本敏感度
                  </div>
                  <ul className="space-y-2 text-xs">
                    {[
                      { metal: "銅材", up: "+5%", margin: "-2.1%", tone: C.red },
                      { metal: "鋁材", up: "+5%", margin: "-0.9%", tone: "#d97706" },
                      { metal: "鋼材", up: "+3%", margin: "-0.4%", tone: "#d97706" },
                    ].map((s) => (
                      <li key={s.metal} className="flex items-baseline justify-between border-b py-1.5 last:border-0" style={{ borderColor: C.border }}>
                        <span className="flex items-baseline gap-2">
                          <span className="font-semibold" style={{ color: C.text }}>{s.metal}</span>
                          <span className="font-mono" style={{ color: s.tone }}>{s.up}</span>
                        </span>
                        <span className="flex items-baseline gap-1">
                          <span style={{ color: C.textSub }}>毛利</span>
                          <span className="font-mono font-bold" style={{ color: s.tone }}>{s.margin}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 區塊 4 — AI 預測 */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textSub, letterSpacing: "0.08em" }}>
                    ▎AI 預測
                  </div>
                  <div className="rounded-md p-3" style={{ background: C.surfaceDim }}>
                    <div className="text-[10px]" style={{ color: C.textSub }}>未來 30 天</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-semibold" style={{ color: C.text }}>銅材</span>
                      <span className="text-base font-bold" style={{ color: C.red }}>↑</span>
                    </div>
                    <div className="mt-1.5 text-[11px]" style={{ color: C.textSub }}>
                      相關毛利 <span className="font-mono" style={{ color: C.textSub }}>13.2%</span>
                      <span className="mx-1" style={{ color: C.red }}>↓</span>
                      <span className="font-mono font-bold" style={{ color: C.red }}>11.8%</span>
                    </div>
                  </div>
                </div>

                {/* 區塊 5 — AI 建議（橫跨兩格） */}
                <div className="md:col-span-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.textSub, letterSpacing: "0.08em" }}>
                    ▎AI 建議
                  </div>
                  <ul className="space-y-2 text-xs">
                    {[
                      { title: "提前採購銅",       saving: "+95 萬" },
                      { title: "啟動替代規格",     saving: "+60 萬" },
                      { title: "議價／避險方案",   saving: "+25 萬" },
                    ].map((a) => (
                      <li key={a.title} className="flex items-baseline justify-between border-b py-1.5 last:border-0" style={{ borderColor: C.border }}>
                        <span className="flex items-baseline gap-1.5" style={{ color: C.text }}>
                          <span style={{ color: C.primary }}>✓</span>
                          <span className="font-semibold">{a.title}</span>
                        </span>
                        <span className="text-[10px]" style={{ color: C.textSub }}>
                          可省 <span className="font-mono font-bold" style={{ color: C.primary }}>{a.saving}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* AI 判斷 — 4 步框架：Current / Why / Prediction / Action */}
            <div className="rounded-lg border p-4" style={{ borderColor: C.border, background: `${C.blueLight}10` }}>
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg">✨</span>
                  <h3 className="text-sm font-bold">AI 四步分析框架</h3>
                  <span className="text-[10px]" style={{ color: C.textSub }}>{c.name} ({c.nameEn})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: C.primary, color: "#fff" }}>信心 {adv.confidence}</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. 現在發生什麼 Current */}
                <div className="rounded-md p-3 border" style={{ background: "#ffffff", borderColor: C.border, borderTop: `3px solid ${C.blue}` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: C.blue, letterSpacing: "0.1em" }}>
                    ① CURRENT
                  </div>
                  <div className="text-[10px] mb-1" style={{ color: C.textSub }}>現在發生什麼</div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>{c.name}價格進入「{zone.zone}」區</div>
                  <div className="text-[10px] mt-1" style={{ color: C.textSub }}>{zone.oneLiner}</div>
                  <div className="mt-1.5 font-mono text-xs font-semibold" style={{ color: C.text }}>
                    當前 ${Math.round(lastPrice).toLocaleString()}/{c.unit.split("/")[1] ?? "MT"}
                  </div>
                </div>

                {/* 2. 為什麼發生 Why */}
                <div className="rounded-md p-3 border" style={{ background: "#ffffff", borderColor: C.border, borderTop: `3px solid #d97706` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#d97706", letterSpacing: "0.1em" }}>
                    ② WHY
                  </div>
                  <div className="text-[10px] mb-1" style={{ color: C.textSub }}>為什麼發生</div>
                  <div className="text-[10px]" style={{ color: C.text }}>
                    <div className="font-bold mb-0.5">過去 30 日：</div>
                    {adv.facts.slice(0, 2).map((f) => <div key={f} className="leading-tight" style={{ color: C.textSub }}>· {f}</div>)}
                    <div className="font-bold mt-1.5 mb-0.5">但反向信號：</div>
                    {adv.butFactors.slice(0, 2).map((f) => <div key={f} className="leading-tight" style={{ color: C.textSub }}>· {f}</div>)}
                  </div>
                </div>

                {/* 3. 未來會怎樣 Prediction */}
                <div className="rounded-md p-3 border" style={{ background: "#ffffff", borderColor: C.border, borderTop: `3px solid ${C.red}` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: C.red, letterSpacing: "0.1em" }}>
                    ③ PREDICTION
                  </div>
                  <div className="text-[10px] mb-1" style={{ color: C.textSub }}>未來會怎樣 · AI 預測</div>
                  <div className="text-sm font-bold leading-tight" style={{ color: C.text }}>{adv.aiVerdict}</div>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                    <span style={{ color: C.textSub }}>30 天</span>
                    <span className="text-right font-mono font-bold" style={{ color: C.red }}>
                      ${Math.round(lastPrice * 1.05).toLocaleString()} <span className="text-[9px]">↑5%</span>
                    </span>
                    <span style={{ color: C.textSub }}>90 天</span>
                    <span className="text-right font-mono font-bold" style={{ color: C.red }}>
                      ${Math.round(lastPrice * 1.08).toLocaleString()} <span className="text-[9px]">↑8%</span>
                    </span>
                    <span style={{ color: C.textSub }}>180 天</span>
                    <span className="text-right font-mono font-bold" style={{ color: C.red }}>
                      ${Math.round(lastPrice * 1.12).toLocaleString()} <span className="text-[9px]">↑12%</span>
                    </span>
                  </div>
                </div>

                {/* 4. 要怎麼做 Action */}
                <div className="rounded-md p-3 border" style={{ background: "#ffffff", borderColor: C.border, borderTop: `3px solid ${C.primary}` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: C.primary, letterSpacing: "0.1em" }}>
                    ④ ACTION
                  </div>
                  <div className="text-[10px] mb-1" style={{ color: C.textSub }}>要怎麼做 · AI 建議</div>
                  <div className="text-sm font-bold leading-tight" style={{ color: C.primary }}>{adv.recommendation}</div>
                  <ul className="mt-2 space-y-1 text-[10px]" style={{ color: C.text }}>
                    <li>✓ 立即鎖價 <b className="font-mono">100 MT</b></li>
                    <li>✓ 啟動替代規格評估</li>
                    <li>✓ 預估擋損 <b className="font-mono" style={{ color: C.primary }}>+95 萬</b></li>
                  </ul>
                  <button className="w-full mt-2 py-1.5 rounded text-[10px] font-bold text-white" style={{ background: C.primary }}>
                    建立採購策略
                  </button>
                </div>
              </div>
            </div>

            {/* Commodity Cost Recovery Center · 原料成本回收中心 */}
            {(() => {
              const partsRaw = AFFECTED_PARTS[c.code] ?? [];
              if (partsRaw.length === 0) return null;
              const totalStockKg = partsRaw.reduce((s, p) => s + p.stockQty * p.unitMetalKg, 0);
              const totalMonthlyKg = partsRaw.reduce((s, p) => s + p.monthlyQty * p.unitMetalKg, 0);
              const impactPer5Pct = (kg: number) => Math.round((kg / 1000) * lastPrice * 0.05 * USD_TWD);
              const stockImpact   = impactPer5Pct(totalStockKg);
              const monthlyImpact = impactPer5Pct(totalMonthlyKg);
              const totalImpact   = stockImpact + monthlyImpact;
              // 獲利衝擊：成本增加 → 毛利下降 → 獲利減少 (假設營收基數 1500萬)
              const REVENUE = 15_000_000;
              const grossMarginBefore = 18.2;
              const profitLoss = totalImpact;                  // 成本上升 = 獲利下降
              const grossMarginAfter = grossMarginBefore - (profitLoss / REVENUE) * 100;
              // 合理漲幅 = 該金屬近 6 個月漲跌 × 此零件金屬佔比%
              const sixAgoPrice = c.prices[c.prices.length - 7]?.price ?? lastPrice;
              const metalPctChange = ((lastPrice - sixAgoPrice) / Math.max(1, sixAgoPrice)) * 100;
              // 依「影響度」排序（庫存+月用量 × 含金屬重量）
              const parts = [...partsRaw]
                .map((p) => ({ ...p, _impact: impactPer5Pct((p.stockQty + p.monthlyQty) * p.unitMetalKg) }))
                .sort((a, b) => b._impact - a._impact);
              const topPart = parts[0];
              // 庫存天數計算
              const stockDays = (p: typeof parts[0]) => Math.round(p.stockQty / Math.max(1, p.monthlyQty / 30));
              const riskOf = (days: number) => days < 15 ? { label: "高", color: C.red } : days < 30 ? { label: "中", color: "#d97706" } : { label: "低", color: "#059669" };
              return (
                <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border, borderLeft: `4px solid ${C.primary}` }}>
                  {/* Header */}
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                    <h3 className="text-base font-bold">📦 Commodity Cost Recovery Center</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: C.primary, color: "#fff" }}>L4·EXECUTIVE</span>
                  </div>
                  <div className="text-[11px] mb-3" style={{ color: C.textSub }}>
                    原料成本回收中心 · {c.name} 影響零件 + AI 回收策略　·　當前單價 ${lastPrice.toLocaleString()}/{c.unit.split("/")[1] ?? "MT"} · USD/TWD {USD_TWD}
                  </div>

                  {/* 4 KPI 摘要（加入獲利衝擊 — 主管不看成本，看獲利） */}
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
                      <div style={{ color: "#92400e" }}>±5% 成本衝擊</div>
                      <div className="text-lg font-extrabold font-mono" style={{ color: "#92400e" }}>±NT$ {totalImpact.toLocaleString()}</div>
                    </div>
                    <div className="rounded px-3 py-2" style={{ background: `${C.red}10`, borderLeft: `3px solid ${C.red}` }}>
                      <div style={{ color: C.red }}>獲利衝擊（毛利 ↓）</div>
                      <div className="text-lg font-extrabold font-mono" style={{ color: C.red }}>−NT$ {profitLoss.toLocaleString()}</div>
                      <div className="text-[9px]" style={{ color: C.red }}>毛利 {grossMarginBefore}% → {grossMarginAfter.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* 零件明細表 — 依影響度排序 + 風險等級 + 庫存天數 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[920px]">
                      <thead>
                        <tr className="text-left border-b" style={{ borderColor: C.border, color: C.textSub }}>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-center">排名</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px]">零件 / 用於成品</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">金屬佔比</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">庫存天數</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-center">風險</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">月用量</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">合理漲幅</th>
                          <th className="py-2 font-semibold uppercase tracking-widest text-[9px] text-right">±5% 衝擊</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parts.map((p, idx) => {
                          const days = stockDays(p);
                          const risk = riskOf(days);
                          const reasonablePct = (p.metalPct / 100) * metalPctChange;
                          const reasonableTone = reasonablePct > 3 ? C.red : reasonablePct > 0 ? "#d97706" : C.primary;
                          return (
                            <tr key={p.code} className="border-b align-top" style={{ borderColor: C.border, background: idx === 0 ? "#fef3c7" : undefined }}>
                              <td className="py-2 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                                      style={{ background: idx === 0 ? C.red : idx === 1 ? "#d97706" : idx === 2 ? C.blue : C.surfaceDim, color: idx <= 2 ? "#fff" : C.text }}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-2 pr-2">
                                <div className="font-semibold" style={{ color: C.text }}>{p.code}</div>
                                <div className="text-[10px] mb-1" style={{ color: C.textSub }}>{p.name}</div>
                                <div className="flex flex-wrap gap-1">
                                  {p.usedInProducts.map((pid) => (
                                    <span key={pid} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                          style={{ background: `${C.blue}15`, color: C.blue, border: `1px solid ${C.blue}30` }}>
                                      {pid}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-[9px] mt-0.5" style={{ color: C.outline }}>{p.usedInModels}</div>
                              </td>
                              <td className="py-2 text-right">
                                <span className="font-mono font-semibold" style={{ color: p.metalPct >= 70 ? C.red : p.metalPct >= 40 ? "#d97706" : C.text }}>{p.metalPct}%</span>
                              </td>
                              <td className="py-2 text-right">
                                <span className="font-mono font-bold" style={{ color: risk.color }}>{days} 天</span>
                                <div className="text-[9px]" style={{ color: C.outline }}>安全 15 天</div>
                              </td>
                              <td className="py-2 text-center">
                                <span className="text-xs font-bold" style={{ color: risk.color }}>● {risk.label}</span>
                              </td>
                              <td className="py-2 text-right font-mono" style={{ color: C.textSub }}>{p.monthlyQty.toLocaleString()}</td>
                              <td className="py-2 text-right">
                                <span className="font-mono font-bold" style={{ color: reasonableTone }}>
                                  {reasonablePct >= 0 ? "+" : ""}{reasonablePct.toFixed(2)}%
                                </span>
                                <div className="text-[9px]" style={{ color: C.outline }}>議價上限</div>
                              </td>
                              <td className="py-2 text-right font-mono font-bold" style={{ color: C.red }}>±${p._impact.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: C.surfaceDim }}>
                          <td className="py-2 text-center font-bold">—</td>
                          <td className="py-2 px-1 font-bold" style={{ color: C.text }}>總計</td>
                          <td className="py-2 text-right text-[10px]" style={{ color: C.textSub }}>—</td>
                          <td className="py-2 text-right font-mono font-bold">—</td>
                          <td className="py-2 text-center text-[10px]" style={{ color: C.textSub }}>—</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: C.textSub }}>{parts.reduce((s,p)=>s+p.monthlyQty,0).toLocaleString()}</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: metalPctChange >= 0 ? C.red : C.primary }}>
                            金屬 {metalPctChange >= 0 ? "+" : ""}{metalPctChange.toFixed(2)}%
                          </td>
                          <td className="py-2 text-right font-mono font-extrabold" style={{ color: C.red }}>±NT$ {totalImpact.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 獲利衝擊解讀 — 主管視角（不只看成本，看獲利） */}
                  <div className="mt-3 rounded-md p-3" style={{ background: `${C.red}08`, border: `1px solid ${C.red}30` }}>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.red, letterSpacing: "0.08em" }}>
                      📉 獲利衝擊推導
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: C.text }}>
                      <span style={{ color: C.red, fontWeight: 700 }}>{c.name}價上漲 5%</span>
                      <span className="mx-1" style={{ color: C.textSub }}>→</span>
                      成本 <b className="font-mono">+NT$ {totalImpact.toLocaleString()}</b>
                      <span className="mx-1" style={{ color: C.textSub }}>→</span>
                      毛利 <b className="font-mono">{grossMarginBefore}%</b> <span style={{ color: C.red }}>↓</span> <b className="font-mono" style={{ color: C.red }}>{grossMarginAfter.toFixed(1)}%</b>
                      <span className="mx-1" style={{ color: C.textSub }}>→</span>
                      <b className="font-mono" style={{ color: C.red }}>獲利減少 NT$ {profitLoss.toLocaleString()}</b>
                    </div>
                  </div>

                  {/* 🧠 AI Action — AI 建議區（核心區塊） */}
                  <div className="mt-3 rounded-md p-4" style={{ background: `${C.primary}08`, border: `1.5px solid ${C.primary}` }}>
                    <div className="flex items-baseline justify-between mb-2">
                      <h4 className="text-sm font-bold flex items-baseline gap-1.5" style={{ color: C.primary }}>
                        🧠 AI 建議 <span className="text-[10px] font-normal" style={{ color: C.textSub }}>Action</span>
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "#d97706", color: "#fff" }}>風險等級：中</span>
                    </div>
                    <ul className="space-y-2 mb-3">
                      {[
                        { act: `本月立即鎖${c.name}價`,                                  saving: 82_000, days: "今日", success: "92%" },
                        { act: `${topPart?.code ?? "FB64-WIRE"} 轉移供應商 B`,           saving: 45_000, days: "7 天", success: "80%" },
                        { act: `提前採購 60 天（${(totalMonthlyKg/1000*2).toFixed(1)} MT）`, saving: 31_000, days: "60 天", success: "70%" },
                      ].map((a, i) => (
                        <li key={i} className="flex items-baseline justify-between text-xs">
                          <span className="flex items-baseline gap-1.5">
                            <span style={{ color: C.primary }}>○</span>
                            <span className="font-semibold" style={{ color: C.text }}>{a.act}</span>
                            <span className="text-[10px]" style={{ color: C.textSub }}>{a.days} · 成功率 {a.success}</span>
                          </span>
                          <span className="text-xs font-bold font-mono" style={{ color: C.primary }}>
                            預估節省 NT$ {a.saving.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-baseline justify-between pt-2 border-t" style={{ borderColor: `${C.primary}30` }}>
                      <span className="text-sm font-bold" style={{ color: C.text }}>總可回收</span>
                      <span className="text-xl font-extrabold font-mono" style={{ color: C.primary }}>NT$ 158,000</span>
                    </div>
                    <button className="w-full mt-3 py-2 rounded text-xs font-bold text-white" style={{ background: C.primary }}>
                      🚀 啟動回收策略
                    </button>
                  </div>

                  {/* AI Recovery Scenario — 多方案比較表 */}
                  <div className="mt-3 rounded-md p-3" style={{ background: C.surfaceDim }}>
                    <div className="flex items-baseline justify-between mb-2">
                      <h4 className="text-sm font-bold" style={{ color: C.text }}>
                        🎯 AI Recovery Scenario <span className="text-[10px] font-normal" style={{ color: C.textSub }}>多方案比較 · 世界級版本</span>
                      </h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded text-white" style={{ background: C.blue }}>推薦</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left border-b" style={{ borderColor: C.border, color: C.textSub }}>
                          <th className="py-1.5 text-[9px] font-bold uppercase tracking-widest">方案</th>
                          <th className="py-1.5 text-[9px] font-bold uppercase tracking-widest text-right">回收金額</th>
                          <th className="py-1.5 text-[9px] font-bold uppercase tracking-widest text-right">動作時間</th>
                          <th className="py-1.5 text-[9px] font-bold uppercase tracking-widest text-right">成功率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: `鎖價 ${c.name}料`,      saving: 82_000, days: "1 天",  rate: 92, tone: C.primary },
                          { name: "RFP 議價",              saving: 38_000, days: "7 天",  rate: 80, tone: C.blue },
                          { name: "產品調價",              saving: 35_000, days: "30 天", rate: 65, tone: "#d97706" },
                          { name: "找新供應商",            saving: 52_000, days: "45 天", rate: 70, tone: "#d97706" },
                        ].map((s) => (
                          <tr key={s.name} className="border-b" style={{ borderColor: C.border }}>
                            <td className="py-1.5 font-semibold" style={{ color: C.text }}>{s.name}</td>
                            <td className="py-1.5 text-right font-mono font-bold" style={{ color: s.tone }}>NT$ {s.saving.toLocaleString()}</td>
                            <td className="py-1.5 text-right font-mono text-[10px]" style={{ color: C.textSub }}>{s.days}</td>
                            <td className="py-1.5 text-right font-mono" style={{ color: s.rate >= 80 ? C.primary : s.rate >= 70 ? "#d97706" : C.red }}>{s.rate}%</td>
                          </tr>
                        ))}
                        <tr style={{ background: "#fef3c7" }}>
                          <td className="py-2 font-bold" style={{ color: C.text }}>綜合最佳組合</td>
                          <td className="py-2 text-right font-mono font-extrabold" style={{ color: C.primary }}>NT$ 207,000</td>
                          <td className="py-2 text-right font-mono text-[10px]" style={{ color: C.textSub }}>60 天</td>
                          <td className="py-2 text-right font-mono font-bold" style={{ color: C.primary }}>82%</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-2 text-[10px] grid grid-cols-2 md:grid-cols-4 gap-2" style={{ color: C.text }}>
                      <div>💰 毛利提升</div>
                      <div>💵 現金流 +</div>
                      <div>📦 缺料風險 ↓</div>
                      <div>🤝 供應商 +</div>
                    </div>
                  </div>

                  {/* footer 註解 */}
                  <div className="mt-3 text-[10px] leading-relaxed" style={{ color: C.textSub }}>
                    <div>※ <b>影響度排序</b> = (庫存 + 月用量) × 每件含{c.name}量 × 當前單價 × 5% × USD/TWD {USD_TWD}　·　第 1 名 = 主管最該優先處理</div>
                    <div>※ <b>庫存天數</b> = 庫存件 ÷ 月用量 × 30　·　&lt; 15 天 = 高風險（紅）／15-30 天 = 中（琥珀）／&gt; 30 天 = 低（綠）</div>
                    <div>※ <b>合理漲幅</b> = {c.name}近 6 個月漲跌 ({metalPctChange >= 0 ? "+" : ""}{metalPctChange.toFixed(2)}%) × 此零件金屬佔比%　·　供應商超過此值即不合理</div>
                    <div>※ <b>資料來源</b>：鼎新 iGP <code className="font-mono">INVMB</code> + <code className="font-mono">BOMMA</code> + <code className="font-mono">BOMMB</code>　·　LME / INSEE 金屬報價</div>
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

          </aside>
        </div>

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
