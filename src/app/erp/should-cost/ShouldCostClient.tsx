"use client";

import { useMemo, useState } from "react";
import { costBreakdownFor, analyzePriceHike } from "@/lib/erp/negotiation";

type Snap = { code: string; name: string; latest: number; mean: number; devPct: number };

export default function ShouldCostClient({ categories, commoditySnapshot }: { categories: string[]; commoditySnapshot: Snap[] }) {
  const [category, setCategory] = useState(categories[0] ?? "鋁件");
  const [hike, setHike] = useState(18);

  const bd = useMemo(() => costBreakdownFor(category), [category]);
  const analysis = useMemo(() => analyzePriceHike(category, hike), [category, hike]);

  const verdictTone =
    analysis.verdict === "fair" ? { bg: "border-emerald-400 bg-emerald-50", text: "text-emerald-700", chip: "bg-emerald-600", label: "✓ 合理" }
    : analysis.verdict === "high" ? { bg: "border-amber-400 bg-amber-50", text: "text-amber-700", chip: "bg-amber-500", label: "⚠ 偏高，要求重議" }
    : { bg: "border-rose-500 bg-rose-50", text: "text-rose-700", chip: "bg-rose-600", label: "🚨 嚴重超出，強力議價" };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">💎 Should-Cost 成本拆解模型 — AI 漲價合理性判斷</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI 不是接受對方說「我們漲 18%」就算了 — 拆解成本結構 + 對照當前各成分波動 → 判斷漲價是否合理
        </p>
      </header>

      {/* 輸入區 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-sm mb-3">輸入：供應商喊漲幅 + 料件類別</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="block">
            <span className="text-xs text-slate-500">料件類別</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-sm">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">供應商喊漲 %</span>
            <input type="number" min={0} step={0.5} value={hike}
              onChange={(e) => setHike(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-sm tabular-nums font-bold text-rose-600" />
          </label>
          <div className="text-xs text-slate-500 leading-tight">
            <div>例：</div>
            <div>· 供應商漲 18%</div>
            <div>· 原料只漲 4% / 工資漲 2% / 匯率變動 1.5%</div>
            <div>· 合理 5~7% → 超出 11% → AI 建議要求重新議價</div>
          </div>
        </div>
      </section>

      {/* AI 判斷結論 */}
      <section className={`rounded-xl border-2 p-5 ${verdictTone.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${verdictTone.chip}`}>AI 判定</span>
              <span className="font-mono text-xs text-slate-500">{category}</span>
            </div>
            <div className={`text-xl font-extrabold ${verdictTone.text}`}>
              {verdictTone.label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500">合理漲幅 vs 對方喊漲</div>
            <div className="text-sm font-bold text-slate-600 tabular-nums">
              <span className="text-emerald-600">{analysis.reasonableLowPct}% ~ {analysis.reasonableHighPct}%</span>
              <span className="text-slate-400 mx-2">vs</span>
              <span className="text-rose-600">{analysis.proposedHikePct}%</span>
            </div>
            {analysis.excessPct > 0 && (
              <div className="text-rose-600 font-bold text-base mt-1">超出 {analysis.excessPct}%</div>
            )}
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-800 leading-relaxed">
          <b>AI 建議</b>：{analysis.aiRecommendation}
        </div>
      </section>

      {/* Should-Cost 拆解（甜甜圈 + 表格） */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📊 Should-Cost 拆解：{category} 類別的成本結構（業界經驗）</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
          <DonutChart bd={bd} />
          <div className="space-y-2">
            <BdBar label="原料"   pct={bd.raw}       color="#0891b2" />
            <BdBar label="加工"   pct={bd.process}   color="#3b82f6" />
            <BdBar label="表處"   pct={bd.surface}   color="#8b5cf6" />
            <BdBar label="包裝"   pct={bd.packaging} color="#f59e0b" />
            <BdBar label="運費"   pct={bd.freight}   color="#10b981" />
            <BdBar label="利潤"   pct={bd.margin}    color="#ef4444" />
          </div>
        </div>
      </section>

      {/* 各成分當前波動 + 對總價貢獻 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">🌊 各成分當前波動 → 對總價的貢獻</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">成分</th>
              <th className="text-right px-3 py-2">佔成本</th>
              <th className="text-right px-3 py-2">當前變動</th>
              <th className="text-right px-3 py-2">對總價貢獻</th>
              <th className="text-left px-3 py-2">資料來源</th>
            </tr>
          </thead>
          <tbody>
            {analysis.components.map((c) => (
              <tr key={c.label} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{c.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.weight}%</td>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${c.deltaPct > 5 ? "text-rose-600" : c.deltaPct > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {c.deltaPct >= 0 ? "+" : ""}{c.deltaPct.toFixed(1)}%
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${c.contribution > 1 ? "text-rose-600" : c.contribution > 0 ? "text-amber-600" : "text-slate-500"}`}>
                  {c.contribution >= 0 ? "+" : ""}{c.contribution.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">{c.source}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-50/50">
              <td className="px-3 py-2 font-bold" colSpan={3}>合理漲幅區間</td>
              <td className="px-3 py-2 text-right tabular-nums font-extrabold text-emerald-600">
                {analysis.reasonableLowPct}% ~ {analysis.reasonableHighPct}%
              </td>
              <td className="px-3 py-2 text-xs text-slate-500">總和 ± 30% 緩衝</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-bold" colSpan={3}>供應商喊漲</td>
              <td className="px-3 py-2 text-right tabular-nums font-extrabold text-rose-600">{analysis.proposedHikePct}%</td>
              <td className="px-3 py-2 text-xs text-rose-700">{analysis.excessPct > 0 ? `超出 ${analysis.excessPct}%` : "在合理區間內"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 對方拿話清單（議價會議用） */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <h2 className="font-bold text-lg mb-3">💬 議價會議拿話清單（直接在會議念出）</h2>
        <ol className="space-y-2">
          {analysis.talkingPoints.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{i + 1}</div>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 原物料當前快照（佐證資料來源） */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-sm mb-2">📌 原物料當前快照（佐證來源）</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {commoditySnapshot.map((c) => (
            <div key={c.code} className="bg-slate-50 rounded p-2">
              <div className="font-bold text-slate-700">{c.name}</div>
              <div className="text-[10px] text-slate-500">當前 {c.latest.toLocaleString()} · 均 {c.mean.toFixed(0)}</div>
              <div className={`text-xs font-bold tabular-nums ${c.devPct > 5 ? "text-rose-600" : c.devPct > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {c.devPct >= 0 ? "+" : ""}{c.devPct.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>Should-Cost 模型</b> = 業界經驗值的成本結構（原料/加工/表處/包裝/運費/利潤）。
        <b>合理漲幅</b> = 各成分當前波動 × 該成分佔成本權重，加總得整體合理漲幅。
        <b>正式版</b>：成本結構接 ERP 標準成本卡；原料波動接 LME / Brent / 中鋼 API；工資/匯率接 BoT。
      </p>
    </div>
  );
}

// ============================================================
// 甜甜圈圖（SVG）
// ============================================================
function DonutChart({ bd }: { bd: { raw: number; process: number; surface: number; packaging: number; freight: number; margin: number } }) {
  const items = [
    { label: "原料",   value: bd.raw,       color: "#0891b2" },
    { label: "加工",   value: bd.process,   color: "#3b82f6" },
    { label: "表處",   value: bd.surface,   color: "#8b5cf6" },
    { label: "包裝",   value: bd.packaging, color: "#f59e0b" },
    { label: "運費",   value: bd.freight,   color: "#10b981" },
    { label: "利潤",   value: bd.margin,    color: "#ef4444" },
  ];
  const total = items.reduce((s, i) => s + i.value, 0);
  const R = 76, cx = 110, cy = 110, sw = 28;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const arcs = items.map((i) => {
    const len = (i.value / total) * circ;
    const seg = { ...i, len, off: offset };
    offset += len;
    return seg;
  });
  return (
    <div className="mx-auto" style={{ width: 240 }}>
      <svg viewBox="0 0 220 220" width="100%">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={a.color} strokeWidth={sw}
            strokeDasharray={`${a.len} ${circ - a.len}`} strokeDashoffset={-a.off}
            transform={`rotate(-90 ${cx} ${cy})`} />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" className="fill-slate-700" style={{ fontSize: 14, fontWeight: 700 }}>Should-Cost</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10 }}>業界經驗值</text>
      </svg>
    </div>
  );
}

function BdBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-sm font-semibold text-slate-700">{label}</div>
      <div className="flex-1 h-5 rounded bg-slate-100 overflow-hidden">
        <div className="h-full flex items-center px-2" style={{ width: `${pct}%`, background: color }}>
          <span className="text-[10px] text-white font-bold">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
