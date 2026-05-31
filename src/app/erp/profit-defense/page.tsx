"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { commodities, priceZone, procurementAdvice, type Commodity } from "@/lib/erp/commodities";

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
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <h2 className="text-lg font-semibold">銷價格趨勢與預測</h2>
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
                  {/* Grid */}
                  {yTicks.map((tick, i) => {
                    const y = scaleY(tick);
                    return (
                      <g key={i}>
                        <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={C.border} strokeWidth="1" strokeDasharray="2,4" />
                        <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="10" fill={C.textSub}>
                          ${tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick.toFixed(0)}
                        </text>
                      </g>
                    );
                  })}

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
                </svg>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: C.textSub }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5" style={{ background: C.red }} /> 實際價格 ({c.name})
                </span>
                {forecastPoints.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: C.red }} /> AI 預測（6 個月）
                  </span>
                )}
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

            {/* AI 鎖價建議 */}
            <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-sm font-bold">AI 鎖價建議 ({c.name})</h3>
                <span className="text-[10px]" style={{ color: C.blue }}>信心 91.8% ↑1.2%</span>
              </div>

              <button className="w-full mt-2 py-2 rounded text-xs font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: C.blue }}>
                ⚡ 建立鎖價策略
              </button>

              <dl className="mt-3 space-y-1 text-[11px]">
                {[
                  ["順位",       "第一順位 (First " + (c.nameEn ?? c.code) + ")"],
                  ["數量",       "100 MT"],
                  ["預估成本",   "$1,407,000"],
                  ["鎖價金額",   "$321,750"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between">
                    <dt style={{ color: C.textSub }}>{k}</dt>
                    <dd className="font-mono font-semibold" style={{ color: C.text }}>{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 pt-2 border-t text-[10px]" style={{ borderColor: C.border, color: C.textSub }}>
                <div className="font-bold mb-1" style={{ color: C.text }}>📊 AI 信心（附建議）</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <span>預測準確度</span><span className="text-right font-mono" style={{ color: C.text }}>91.8% ↑1.2%</span>
                  <span>統計信賴</span><span className="text-right font-mono" style={{ color: C.text }}>92%</span>
                  <span>模型版本</span><span className="text-right font-mono" style={{ color: C.text }}>v0.3</span>
                  <span>預測時間</span><span className="text-right font-mono" style={{ color: C.text }}>09:21</span>
                </div>
              </div>

              <button className="w-full mt-3 py-2 rounded text-xs font-semibold text-white" style={{ background: C.primary }}>
                Review Strategic Options
              </button>
            </div>

            {/* 對沖商品配置 (Product Impact) */}
            <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
              <h3 className="text-sm font-bold mb-2">對沖商品配置 (Product Impact)</h3>
              {[
                { name: "Lite 系列",   delta: "+1.2% Cost", qty: "8,000 件", tone: "amber" as const },
                { name: "Precor 系列", delta: "+2.1% Cost", qty: "-270",     tone: "rose"  as const },
              ].map((p) => (
                <div key={p.name} className="flex items-baseline justify-between text-xs py-2 border-b last:border-0" style={{ borderColor: C.border }}>
                  <span style={{ color: C.text }}>{p.name}</span>
                  <span className="text-right">
                    <span className="font-mono font-semibold" style={{ color: p.tone === "rose" ? C.red : "#d97706" }}>{p.delta}</span>
                    <span className="block text-[10px]" style={{ color: C.textSub }}>{p.qty}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Market Volatility Index */}
            <div className="rounded-lg border bg-white p-4" style={{ borderColor: C.border }}>
              <h3 className="text-sm font-bold mb-2">Market Volatility Index</h3>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span style={{ color: C.textSub }}>Global Supply Chain Risk</span>
                <span className="font-bold" style={{ color: "#d97706" }}>● Medium-High</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span style={{ color: C.textSub }}>Freight Cost Index</span>
                <span className="font-bold" style={{ color: "#059669" }}>● Stable</span>
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
