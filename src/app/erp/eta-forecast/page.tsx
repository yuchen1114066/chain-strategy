import Link from "next/link";
import { etaForecastAll, etaForecastSummary } from "@/lib/erp/eta-forecast";

export default function EtaForecastPage() {
  const forecasts = etaForecastAll();
  const summary = etaForecastSummary();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🔮 AI ETA 預測引擎 — Order ETA Forecast</h1>
        <p className="text-sm text-slate-500 mt-1">
          每張在途訂單預測「準時到貨機率」+ 風險原因 + AI 具體建議　·　亞洲級頂級功能
        </p>
      </header>

      {/* KPI */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">AI Predictive Engine</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="🟢 安全（≥85%）" value={`${summary.safe}`} sub="如期到貨機率高" tone="emerald" />
          <Stat label="🟡 觀察（60-84%）" value={`${summary.watch}`} sub="提前外包二供" tone="amber" />
          <Stat label="🚨 風險（<60%）" value={`${summary.risk}`} sub="立即介入" tone={summary.risk > 0 ? "rose" : "emerald"} />
          <Stat label="總在途 PO" value={`${summary.total}`} sub="進行中" tone="cyan" />
        </div>
      </section>

      {/* 列表 */}
      <section className="space-y-3">
        {forecasts.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="text-3xl mb-1">✅</div>
            <div className="font-bold text-emerald-800">沒有在途 PO 需預測</div>
          </div>
        ) : (
          forecasts.map((f) => {
            const tone = f.onTimeProbability >= 85
              ? { bd: "border-emerald-300", bg: "bg-emerald-50/40", chip: "bg-emerald-600", txt: "text-emerald-700", label: "安全" }
              : f.onTimeProbability >= 60
              ? { bd: "border-amber-400", bg: "bg-amber-50/50", chip: "bg-amber-500", txt: "text-amber-700", label: "觀察" }
              : { bd: "border-rose-500", bg: "bg-rose-50/50", chip: "bg-rose-600", txt: "text-rose-700", label: "風險" };
            return (
              <article key={f.poId} className={`rounded-xl border-2 ${tone.bd} ${tone.bg} p-4`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${tone.chip}`}>{tone.label}</span>
                      <span className="font-mono text-xs text-cyan-700 font-bold">{f.poNo}</span>
                      <span className="text-[10px] text-slate-500">{f.supplierCode}</span>
                    </div>
                    <div className="font-bold text-sm">{f.partName} × {f.qty}</div>
                    <div className="text-xs text-slate-600">{f.supplierName}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] tracking-widest text-slate-500 uppercase">準時到貨機率</div>
                    <div className={`text-4xl font-extrabold tabular-nums ${tone.txt}`}>{f.onTimeProbability}%</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      預定 {f.expectedArrival}{" "}
                      {f.delayDaysExpected > 0 && (
                        <span className="text-rose-600 font-bold">→ 預測 {f.predictedArrival}（+{f.delayDaysExpected}d）</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* 風險 */}
                  <div className="bg-white/70 rounded-lg p-3">
                    <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">⚠ 風險原因</div>
                    {f.risks.length === 0 ? (
                      <div className="text-xs text-emerald-700">無已知風險信號</div>
                    ) : (
                      <ul className="space-y-1.5">
                        {f.risks.map((r, i) => (
                          <li key={i} className="text-xs">
                            <div className="font-bold text-slate-800">
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                r.severity === "high" ? "bg-rose-500" :
                                r.severity === "med" ? "bg-amber-500" : "bg-slate-400"
                              }`} />
                              {r.factor}
                            </div>
                            <div className="text-[10px] text-slate-500 ml-3">{r.evidence}　·　預期 +{r.impactDays} 天</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* 建議 */}
                  <div className={`rounded-lg p-3 ${
                    f.recommendationTone === "act" ? "bg-rose-100/80 border-2 border-rose-300" :
                    f.recommendationTone === "watch" ? "bg-amber-100/60 border-2 border-amber-300" :
                    "bg-emerald-50 border border-emerald-200"
                  }`}>
                    <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">🤖 AI 建議</div>
                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">{f.recommendation}</div>
                    {f.affectedWoNos.length > 0 && (
                      <div className="text-[10px] text-slate-500 mt-2">
                        若延誤將影響工單：
                        {f.affectedWoNos.slice(0, 3).map((w) => (
                          <span key={w} className="font-mono text-cyan-700 ml-1">{w}</span>
                        ))}
                        {f.affectedWoNos.length > 3 && <span className="text-slate-400 ml-1">+{f.affectedWoNos.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 模型</b>　以供應商 Supplier Digital Twin baseline + 當前生產狀態 + 風險信號（PO Ack、ASN、stage drift）→
        計算「預定到貨日前完成」機率。<b>未來</b>：接 XGBoost / 隨機森林訓練於歷史 OTD 資料，
        並納入紅海危機、台灣地震、美元波動等外部因子（見 <Link href="/erp/global-map" className="text-cyan-700 underline">全球供應鏈地圖</Link>）。
      </p>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "emerald" | "amber" | "rose" | "cyan" }) {
  const c = { emerald: "text-emerald-400", amber: "text-amber-400", rose: "text-rose-400", cyan: "text-cyan-400" }[tone];
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-3xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
