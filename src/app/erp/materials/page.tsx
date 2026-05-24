import { commodities, spc, priceZone, procurementAdvice, type Commodity, type SpcStat } from "@/lib/erp/commodities";
import { parts } from "@/lib/erp/seed";

// 全球原物料 AI 採購戰情室
// 對應「Global AI Procurement Command Center」藍圖
//   · 6 大原物料即時市場資料（銅/鋁/鋼/塑料/稀土/IC）
//   · AI 4 區判斷（低檔 / 危險 / 追高 / 囤貨 / 觀望）
//   · 採購建議模型（事實 → 但有 → AI 判定 → 具體建議）

export default function MaterialsRadarPage() {
  const data = commodities.map((c) => ({ c, s: spc(c), z: priceZone(c), a: procurementAdvice(c) }));
  const alertCount = data.filter((d) => d.s.status === "alert").length;
  const dangerZone = data.filter((d) => d.z.zone === "危險").length;
  const buyZone = data.filter((d) => d.z.zone === "低檔" || d.z.zone === "囤貨").length;

  // 90 天成本衝擊估算：最新價 vs 平均價的偏離 × 影響料件數
  const costImpact = data.reduce((acc, d) => {
    const dev = (d.s.latest - d.s.mean) / d.s.mean;
    const affectedParts = parts.filter((p) => d.c.category.includes(p.category));
    const affectedValue = affectedParts.reduce((s, p) => s + p.unitCost * p.stockOnHand, 0);
    return acc + dev * affectedValue;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🌐 全球原物料 AI 採購戰情室</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI 不只看漲跌 — 直接判斷現在進入哪一區（低檔/危險/追高/囤貨），給具體採購建議
        </p>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="監控原物料" value={`${commodities.length}`} sub="銅/鋁/鋼/塑料/稀土/IC" tone="cyan" />
        <Kpi label="🟢 低檔 / 囤貨機會" value={`${buyZone}`} sub="可進場備料" tone={buyZone > 0 ? "emerald" : undefined} />
        <Kpi label="🔴 危險區" value={`${dangerZone}`} sub="暫停加單" tone={dangerZone > 0 ? "rose" : "emerald"} />
        <Kpi label="預估成本衝擊（90 天）" value={`${costImpact >= 0 ? "+" : ""}$${(costImpact / 10000).toFixed(0)}萬`} sub={`SPC alert ${alertCount} 項`} tone={costImpact > 0 ? "rose" : "emerald"} />
      </section>

      {/* AI 4 區判斷 + 即時市場資料 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">🎯 AI 4 區判斷 — 現在進入哪一區</h2>
          <div className="flex gap-2 text-[10px] flex-wrap">
            <ZoneChip tone="emerald" label="低檔 — 適合囤貨" />
            <ZoneChip tone="cyan" label="囤貨 — 即將反彈" />
            <ZoneChip tone="amber" label="追高 — 風險中" />
            <ZoneChip tone="rose" label="危險 — 過熱" />
            <ZoneChip tone="slate" label="觀望" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map(({ c, s, z }) => (
            <ZoneCard key={c.code} c={c} s={s} z={z} />
          ))}
        </div>
      </section>

      {/* 採購建議模型（AI 推理鏈） */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">🤖 採購建議模型 — AI 推理鏈</h2>
        <div className="space-y-3">
          {data.map(({ c, a }) => (
            <AdviceCard key={c.code} c={c} a={a} />
          ))}
        </div>
      </section>

      {/* 6 大 SPC 管制圖 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.map(({ c, s }) => (
          <SpcChart key={c.code} c={c} s={s} />
        ))}
      </section>

      {/* 成本衝擊明細 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">📉 原物料 → 零件成本衝擊</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">原物料</th>
              <th className="text-right px-3 py-2">現價</th>
              <th className="text-right px-3 py-2">均價偏離</th>
              <th className="text-left px-3 py-2">影響零件分類</th>
              <th className="text-right px-3 py-2">影響料件數</th>
              <th className="text-right px-3 py-2">在庫值衝擊</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ c, s }) => {
              const dev = (s.latest - s.mean) / s.mean;
              const affectedParts = parts.filter((p) => c.category.includes(p.category));
              const affectedValue = affectedParts.reduce((sum, p) => sum + p.unitCost * p.stockOnHand, 0);
              const impact = dev * affectedValue;
              return (
                <tr key={c.code} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold">{c.name}<span className="text-xs text-slate-400 ml-1">{c.nameEn}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">${s.latest.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${dev > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {dev > 0 ? "+" : ""}{(dev * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{c.category.join(" / ")}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{affectedParts.length}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-semibold ${impact > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {impact >= 0 ? "+" : ""}${impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3">
        <b>📐 SPC 管制</b>：中心線 = 月均價 Mean；上下管制線 UCL/LCL = Mean ± 3σ。
        超出管制界線即「異常波動」(AI 風險線)。
        <b> 資料源</b>：demo 為模擬序列；正式版接 LME API / Fastmarkets / SGX。
        <b> AI 預測</b>：藍圖規劃 Prophet（中期）/ LSTM（長期）/ XGBoost（異常）/ NLP（新聞情緒），
        本頁先實作 SPC 統計管制與成本衝擊。
      </p>
    </div>
  );
}

// ── SPC 折線管制圖（純 SVG）──
function SpcChart({ c, s }: { c: Commodity; s: SpcStat }) {
  const W = 560, H = 240, padL = 56, padR = 16, padT = 28, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const vals = c.prices.map((p) => p.price);
  const yMax = Math.max(s.ucl, ...vals) * 1.05;
  const yMin = Math.min(s.lcl, ...vals) * 0.95;
  const x = (i: number) => padL + (i / (c.prices.length - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  const linePath = c.prices.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(" ");

  const statusTone =
    s.status === "alert" ? { bd: "border-rose-300", chip: "bg-rose-600", txt: "異常超界" } :
    s.status === "warn" ? { bd: "border-amber-300", chip: "bg-amber-500", txt: "逼近管制線" } :
    { bd: "border-slate-200", chip: "bg-emerald-600", txt: "正常" };

  return (
    <div className={`bg-white rounded-xl border-2 ${statusTone.bd} p-4`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="font-bold">{c.name} <span className="text-xs text-slate-400">{c.nameEn}</span></div>
          <div className="text-[10px] text-slate-500">{c.unit}　·　來源 {c.source}</div>
        </div>
        <div className="text-right">
          <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${statusTone.chip}`}>{statusTone.txt}</span>
          <div className="text-lg font-bold tabular-nums mt-1">${s.latest.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">{s.latestMonth}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* 管制帶 */}
        <rect x={padL} y={y(s.ucl)} width={plotW} height={y(s.lcl) - y(s.ucl)} fill="#f0fdf4" />
        {/* UCL / Mean / LCL 線 */}
        <line x1={padL} x2={W - padR} y1={y(s.ucl)} y2={y(s.ucl)} stroke="#dc2626" strokeWidth="1" strokeDasharray="5 3" />
        <line x1={padL} x2={W - padR} y1={y(s.mean)} y2={y(s.mean)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 3" />
        <line x1={padL} x2={W - padR} y1={y(s.lcl)} y2={y(s.lcl)} stroke="#16a34a" strokeWidth="1" strokeDasharray="5 3" />
        <text x={padL - 4} y={y(s.ucl) + 3} textAnchor="end" className="fill-rose-600 text-[9px]">UCL {Math.round(s.ucl).toLocaleString()}</text>
        <text x={padL - 4} y={y(s.mean) + 3} textAnchor="end" className="fill-blue-600 text-[9px]">{Math.round(s.mean).toLocaleString()}</text>
        <text x={padL - 4} y={y(s.lcl) + 3} textAnchor="end" className="fill-emerald-600 text-[9px]">LCL {Math.round(s.lcl).toLocaleString()}</text>
        {/* 價格折線 */}
        <path d={linePath} fill="none" stroke="#0891b2" strokeWidth="1.6" />
        {/* 資料點 + 異常標記 */}
        {c.prices.map((p, i) => {
          const anom = p.price > s.ucl || p.price < s.lcl;
          return (
            <circle key={i} cx={x(i)} cy={y(p.price)} r={anom ? 4 : 1.6}
              fill={anom ? "#dc2626" : "#0891b2"} stroke={anom ? "#fff" : "none"} strokeWidth={anom ? 1.5 : 0}>
              {anom && <title>{p.month}: {p.price.toLocaleString()}（異常超界）</title>}
            </circle>
          );
        })}
        {/* X 軸年標 */}
        {c.prices.map((p, i) => p.month.endsWith("-01") ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">{p.month.slice(0, 4)}</text>
        ) : null)}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>異常點 {s.anomalies.length} 個</span>
        <span>未來 12 月預測：${c.forecast.low.toLocaleString()} ~ ${c.forecast.high.toLocaleString()}</span>
      </div>
    </div>
  );
}

function ZoneChip({ tone, label }: { tone: "emerald" | "cyan" | "amber" | "rose" | "slate"; label: string }) {
  const map = {
    emerald: "bg-emerald-100 text-emerald-700",
    cyan: "bg-cyan-100 text-cyan-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  } as const;
  return <span className={`px-2 py-0.5 rounded font-semibold ${map[tone]}`}>{label}</span>;
}

function ZoneCard({ c, s, z }: { c: Commodity; s: SpcStat; z: { zone: string; tone: "emerald" | "cyan" | "amber" | "rose" | "slate"; oneLiner: string; action: string } }) {
  const toneMap = {
    emerald: "border-emerald-400 bg-emerald-50/50",
    cyan: "border-cyan-400 bg-cyan-50/50",
    amber: "border-amber-400 bg-amber-50/50",
    rose: "border-rose-400 bg-rose-50/50",
    slate: "border-slate-300 bg-slate-50",
  } as const;
  const chipMap = {
    emerald: "bg-emerald-600 text-white",
    cyan: "bg-cyan-600 text-white",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-600 text-white",
    slate: "bg-slate-500 text-white",
  } as const;
  return (
    <div className={`rounded-xl border-2 p-4 ${toneMap[z.tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${chipMap[z.tone]}`}>{z.zone}區</span>
            <span className="font-mono text-[10px] text-slate-500">{c.code}</span>
          </div>
          <div className="font-bold text-base">{c.name}</div>
          <div className="text-[10px] text-slate-500">{c.nameEn} · {c.source}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500">當前</div>
          <div className="text-xl font-extrabold tabular-nums">{s.latest.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">{c.unit}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-700">{z.oneLiner}</div>
      <div className="mt-2 text-[11px] bg-white/70 rounded p-2 border border-slate-200">
        <span className="font-bold text-slate-700">建議：</span>{z.action}
      </div>
      <div className="mt-2 text-[10px] text-slate-500">
        Mean {s.mean.toFixed(0)} ± σ {s.sigma.toFixed(0)}　·　最新 {s.latestMonth}
      </div>
    </div>
  );
}

function AdviceCard({ c, a }: { c: Commodity; a: { facts: string[]; butFactors: string[]; aiVerdict: string; recommendation: string; confidence: "high" | "med" | "low" } }) {
  const confLabel = a.confidence === "high" ? "高信心" : a.confidence === "med" ? "中等" : "低信心";
  const confTone = a.confidence === "high" ? "bg-cyan-600" : a.confidence === "med" ? "bg-slate-500" : "bg-slate-400";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">{c.name}（{c.code}）採購建議</div>
        <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${confTone}`}>{confLabel}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr_1.5fr] gap-3 text-xs">
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">📊 事實</div>
          <ul className="space-y-0.5">{a.facts.map((f, i) => <li key={i} className="text-slate-700">· {f}</li>)}</ul>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-amber-700 font-bold uppercase mb-1">⚠ 但有相反信號</div>
          <ul className="space-y-0.5">{a.butFactors.map((f, i) => <li key={i} className="text-slate-700">· {f}</li>)}</ul>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-cyan-700 font-bold uppercase mb-1">🤖 AI 判定</div>
          <div className="text-slate-800 font-semibold">{a.aiVerdict}</div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-emerald-700 font-bold uppercase mb-1">✅ 具體建議</div>
          <div className="text-slate-900 font-bold">{a.recommendation}</div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "cyan" | "rose" | "amber" | "emerald" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
