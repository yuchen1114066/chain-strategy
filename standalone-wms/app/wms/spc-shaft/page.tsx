import Link from "next/link";
import {
  SHAFT_SPECS, SHAFT_LOTS,
  summarizeLot, cpkTrends, supplierSpcSummary,
  computeLotItem,
  type ShaftSpec,
} from "@/lib/erp/shaft-spc";

// 鉞泰軸心 SPC + SPEC — Statistical Process Control
//   圖號 P03SG007-0　·　品名：軸心　·　材質 S45C　·　廠商 鉞泰
//   20 項規格 × 3 批 × 8 件抽驗

export default function ShaftSpcPage() {
  const lotSummaries = SHAFT_LOTS.map(summarizeLot);
  const trends = cpkTrends();
  const summary = supplierSpcSummary();
  const latest = lotSummaries[lotSummaries.length - 1];

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎯 軸心 SPC + SPEC — 鉞泰進料統計製程管制</h1>
          <p className="text-sm text-slate-500 mt-1">
            圖號 <b className="font-mono">P03SG007-0</b>　·　材質 <b>S45C</b>　·　硬度 <b>HRc 58-63</b>　·　廠商 <b>鉞泰</b>
          </p>
        </div>
        <Link href="/wms/receiving" className="text-cyan-700 hover:underline text-sm">→ 進收貨 Checklist 處理新批</Link>
      </header>

      {/* 廠商總覽 KPI */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">Supplier Quality Control · 鉞泰</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="進料批數" value={`${summary.totalLots}`} sub={`抽驗 ${summary.totalInspected} 件`} tone="cyan" />
          <KpiCard label="整批合格率" value={`${summary.passRate.toFixed(0)}%`} sub={`OOS 總計 ${summary.totalOOS} 點`} tone={summary.passRate >= 95 ? "emerald" : summary.passRate >= 80 ? "amber" : "rose"} />
          <KpiCard label="關鍵尺寸 Cpk 平均" value={summary.avgCpkCritical.toFixed(2)} sub="≥1.33 達標" tone={summary.avgCpkCritical >= 1.33 ? "emerald" : summary.avgCpkCritical >= 1.0 ? "amber" : "rose"} />
          <KpiCard label="最差項目 Cpk" value={summary.worstSpecAvgCpk.avgCpk.toFixed(2)} sub={`${summary.worstSpecAvgCpk.specId} ${summary.worstSpecAvgCpk.feature.slice(0, 12)}`} tone={summary.worstSpecAvgCpk.avgCpk >= 1.33 ? "emerald" : summary.worstSpecAvgCpk.avgCpk >= 1.0 ? "amber" : "rose"} />
          <KpiCard label="最新批 OOS" value={`${latest.totalOOS}`} sub={`${latest.lot.receiptDate} · ${latest.pass ? "✓ 通過" : "✗ 失敗"}`} tone={latest.totalOOS === 0 ? "emerald" : "rose"} />
        </div>
      </section>

      {/* 20 項規格 Cpk 一覽 + 趨勢 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📋 20 項規格 + 跨批 Cpk 趨勢</h2>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-2 py-2 w-8">#</th>
              <th className="text-left px-2 py-2">項目 + 規格</th>
              <th className="text-left px-2 py-2">檢查方法</th>
              <th className="text-right px-2 py-2">USL / LSL</th>
              {SHAFT_LOTS.map((l) => <th key={l.lotNo} className="text-center px-2 py-2">{l.receiptDate.slice(5)}</th>)}
              <th className="text-center px-2 py-2">趨勢</th>
              <th className="text-center px-2 py-2">關鍵</th>
            </tr>
          </thead>
          <tbody>
            {SHAFT_SPECS.map((sp) => {
              const t = trends.find((x) => x.specId === sp.id)!;
              return (
                <tr key={sp.id} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 font-mono font-bold text-slate-700">{sp.id}</td>
                  <td className="px-2 py-1.5">{sp.feature}</td>
                  <td className="px-2 py-1.5 text-slate-600">{sp.method}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-600 text-[10px]">
                    {sp.usl != null ? sp.usl : "—"} / {sp.lsl != null ? sp.lsl : "—"}
                  </td>
                  {t.history.map((h) => (
                    <td key={h.lotNo} className="text-center px-2 py-1.5">
                      {h.cpk == null ? (
                        h.oos === 0 ? <span className="text-emerald-600">✓</span> : <span className="text-rose-600">✗{h.oos}</span>
                      ) : (
                        <span className={`font-bold tabular-nums ${
                          h.oos > 0 ? "text-rose-600" :
                          h.cpk >= 1.67 ? "text-emerald-600" :
                          h.cpk >= 1.33 ? "text-cyan-600" :
                          h.cpk >= 1.0 ? "text-amber-600" : "text-rose-600"
                        }`}>{h.cpk.toFixed(2)}{h.oos > 0 ? `(✗${h.oos})` : ""}</span>
                      )}
                    </td>
                  ))}
                  <td className="text-center px-2 py-1.5">
                    {t.trend === "improving" ? <span className="text-emerald-600 font-bold">↑ 改善</span>
                      : t.trend === "degrading" ? <span className="text-rose-600 font-bold">↓ 衰退</span>
                      : <span className="text-slate-500">→ 持平</span>}
                  </td>
                  <td className="text-center px-2 py-1.5">{sp.critical ? "⭐" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-[10px] text-slate-500 mt-2">
          Cpk 解讀：≥1.67 優異 · ≥1.33 達標 · ≥1.0 邊界 · &lt;1.0 製程能力不足。⭐ = 關鍵尺寸（影響配合）。
        </div>
      </section>

      {/* 關鍵尺寸 X-bar 管制圖 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📈 關鍵尺寸 X-bar 管制圖（按時間軸）</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SHAFT_SPECS.filter((sp) => sp.critical && sp.kind === "numeric").map((sp) => (
            <SpcChart key={sp.id} spec={sp} />
          ))}
        </div>
      </section>

      {/* 各批詳細 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">🗂 各批詳細統計</h2>
        <div className="space-y-3">
          {lotSummaries.map((ls) => (
            <details key={ls.lot.lotNo} className="rounded-lg border border-slate-200 bg-slate-50/40">
              <summary className="cursor-pointer px-4 py-3 hover:bg-slate-100 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono text-sm font-bold text-cyan-700">{ls.lot.lotNo}</span>
                  <span className="text-sm text-slate-600 ml-2">{ls.lot.receiptDate}　·　批量 {ls.lot.batchQty}　·　抽 {ls.lot.inspectedQty} 件</span>
                </div>
                <div className="text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${ls.pass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {ls.pass ? "✓ 整批通過" : `✗ ${ls.failCount} 項失敗`}
                  </span>
                  <span className="ml-2 text-slate-500">OOS {ls.totalOOS} 點</span>
                  {ls.worstItem && ls.worstItem.cpk != null && (
                    <span className="ml-2 text-slate-500">最差 Cpk = <b>{ls.worstItem.cpk.toFixed(2)}</b>（{ls.worstItem.specId}）</span>
                  )}
                </div>
              </summary>
              <div className="px-4 pb-4">
                <table className="w-full text-[11px] mt-2">
                  <thead className="bg-white text-slate-600">
                    <tr>
                      <th className="text-left px-2 py-1.5">#</th>
                      <th className="text-left px-2 py-1.5">項目</th>
                      <th className="text-right px-2 py-1.5">Mean</th>
                      <th className="text-right px-2 py-1.5">σ</th>
                      <th className="text-right px-2 py-1.5">Min / Max</th>
                      <th className="text-right px-2 py-1.5">Cp</th>
                      <th className="text-right px-2 py-1.5">Cpk</th>
                      <th className="text-center px-2 py-1.5">能力</th>
                      <th className="text-center px-2 py-1.5">OOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ls.itemStats.map((st) => (
                      <tr key={st.specId} className="border-t border-slate-100">
                        <td className="px-2 py-1 font-mono font-bold">{st.specId}</td>
                        <td className="px-2 py-1">{st.spec.feature.slice(0, 22)}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{st.n > 0 ? st.mean.toFixed(3) : "—"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{st.n > 0 ? st.sigma.toFixed(4) : "—"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{st.n > 0 ? `${st.min} / ${st.max}` : "—"}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{st.cp != null ? st.cp.toFixed(2) : "—"}</td>
                        <td className={`px-2 py-1 text-right tabular-nums font-bold ${
                          st.cpk == null ? "text-slate-400" :
                          st.cpk >= 1.33 ? "text-emerald-600" :
                          st.cpk >= 1.0 ? "text-amber-600" : "text-rose-600"
                        }`}>{st.cpk != null ? st.cpk.toFixed(2) : "—"}</td>
                        <td className="px-2 py-1 text-center text-[10px]">
                          {st.capability === "excellent" ? "🟢 優異" :
                            st.capability === "good" ? "🟢 達標" :
                            st.capability === "marginal" ? "🟡 邊界" :
                            st.capability === "poor" ? "🔴 不足" : "—"}
                        </td>
                        <td className={`px-2 py-1 text-center font-bold ${st.outOfSpecCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {st.outOfSpecCount > 0 ? `✗ ${st.outOfSpecCount}` : "✓"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 整合說明 */}
      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 整合</b>　收貨 Checklist「數量抽驗完成」這一項會自動執行此 SPC：
        若任何量測值超出 USL/LSL → 抽驗自動標記失敗 → 不可入庫 + 計入鉞泰 Risk Radar Quality 維度。
        <b>趨勢監控</b>：跨批 Cpk 衰退 ≥ 0.2 → AI 預警前兆，push 採購 + 品保。
        <b>正式版</b>：3D 量測儀 / SmartGo 等量測設備 API 直接寫入，不靠人手填表。
      </p>
    </div>
  );
}

// ============================================================
// 單項 X-bar 管制圖
// ============================================================
function SpcChart({ spec }: { spec: ShaftSpec }) {
  // 把 3 批的 8 件量測串成連續序列
  const allPoints: { value: number; lotIdx: number; pieceIdx: number; lotNo: string }[] = [];
  SHAFT_LOTS.forEach((lot, li) => {
    const raw = lot.measurements[spec.id] ?? [];
    raw.forEach((v, pi) => {
      if (typeof v === "number") allPoints.push({ value: v, lotIdx: li, pieceIdx: pi, lotNo: lot.lotNo });
    });
  });
  // 計算 control limits（用全體 mean ± 3σ）
  const vals = allPoints.map((p) => p.value);
  const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
  const sigma = Math.sqrt(vals.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, vals.length - 1));
  const ucl = mean + 3 * sigma;
  const lcl = mean - 3 * sigma;
  const usl = spec.usl ?? ucl;
  const lsl = spec.lsl ?? lcl;
  const yMin = Math.min(lsl, lcl) - sigma;
  const yMax = Math.max(usl, ucl) + sigma;

  const W = 480, H = 200, padL = 50, padR = 12, padT = 12, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i: number) => padL + (i / (allPoints.length - 1 || 1)) * plotW;
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  // 取此 spec 最新批的 Cpk
  const latestStat = computeLotItem(SHAFT_LOTS[SHAFT_LOTS.length - 1], spec);

  return (
    <div className="bg-slate-50/60 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2 text-xs flex-wrap gap-1">
        <div className="font-bold">
          <span className="font-mono text-cyan-700 mr-1">{spec.id}</span>{spec.feature}
        </div>
        <div className="tabular-nums">
          <span className="text-slate-500">Mean </span><b>{mean.toFixed(3)}</b>
          <span className="text-slate-500 ml-2">σ </span><b>{sigma.toFixed(4)}</b>
          <span className="text-slate-500 ml-2">Cpk </span>
          <b className={
            latestStat.cpk == null ? "text-slate-400" :
            latestStat.cpk >= 1.33 ? "text-emerald-600" :
            latestStat.cpk >= 1.0 ? "text-amber-600" : "text-rose-600"
          }>{latestStat.cpk != null ? latestStat.cpk.toFixed(2) : "—"}</b>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* 規格帶（綠色 = 合格區）*/}
        <rect x={padL} y={y(usl)} width={plotW} height={y(lsl) - y(usl)} fill="#f0fdf4" />
        {/* USL/LSL 紅線 */}
        <line x1={padL} x2={W - padR} y1={y(usl)} y2={y(usl)} stroke="#dc2626" strokeWidth="1.2" />
        <line x1={padL} x2={W - padR} y1={y(lsl)} y2={y(lsl)} stroke="#dc2626" strokeWidth="1.2" />
        <text x={padL - 4} y={y(usl) + 3} textAnchor="end" className="fill-rose-600 text-[9px]">USL {usl}</text>
        <text x={padL - 4} y={y(lsl) + 3} textAnchor="end" className="fill-rose-600 text-[9px]">LSL {lsl}</text>
        {/* Mean 藍線 */}
        <line x1={padL} x2={W - padR} y1={y(mean)} y2={y(mean)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" />
        <text x={padL - 4} y={y(mean) + 3} textAnchor="end" className="fill-blue-600 text-[9px]">μ {mean.toFixed(3)}</text>
        {/* UCL/LCL 灰線 */}
        <line x1={padL} x2={W - padR} y1={y(ucl)} y2={y(ucl)} stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3 3" />
        <line x1={padL} x2={W - padR} y1={y(lcl)} y2={y(lcl)} stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3 3" />
        {/* 折線 */}
        <path d={allPoints.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ")}
          fill="none" stroke="#0891b2" strokeWidth="1.4" />
        {/* 點 */}
        {allPoints.map((p, i) => {
          const oos = p.value > usl || p.value < lsl;
          return (
            <circle key={i} cx={x(i)} cy={y(p.value)} r={oos ? 4 : 2.2}
              fill={oos ? "#dc2626" : "#0891b2"} stroke={oos ? "#fff" : "none"} strokeWidth={oos ? 1.5 : 0}>
              <title>{p.lotNo} pcs#{p.pieceIdx + 1}: {p.value}{oos ? " (OOS)" : ""}</title>
            </circle>
          );
        })}
        {/* 批號分隔線 */}
        {SHAFT_LOTS.slice(0, -1).map((_, li) => {
          // 找該 lot 結尾的 index
          const lastIdx = allPoints.findIndex((p, idx) =>
            p.lotIdx > li || (idx === allPoints.length - 1 && p.lotIdx === li)
          );
          if (lastIdx <= 0) return null;
          const xs = x(lastIdx - 0.5);
          return (
            <g key={li}>
              <line x1={xs} x2={xs} y1={padT} y2={H - padB} stroke="#e2e8f0" strokeWidth="1" />
            </g>
          );
        })}
        {/* 批號標籤 */}
        {SHAFT_LOTS.map((l, li) => {
          const firstIdx = allPoints.findIndex((p) => p.lotIdx === li);
          const lastIdxL = allPoints.length - 1 - [...allPoints].reverse().findIndex((p) => p.lotIdx === li);
          const xMid = (x(firstIdx) + x(lastIdxL)) / 2;
          return (
            <text key={l.lotNo} x={xMid} y={H - 8} textAnchor="middle" className="fill-slate-500 text-[9px]">
              {l.receiptDate.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "emerald" | "amber" | "rose" | "cyan" }) {
  const c = { emerald: "text-emerald-400", amber: "text-amber-400", rose: "text-rose-400", cyan: "text-cyan-400" }[tone];
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
