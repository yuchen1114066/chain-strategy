import Link from "next/link";
import { workOrders, models, today } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import { analyzeBottlenecks } from "@/lib/erp/flow-advisor";
import { STAGES } from "@/lib/erp/types";
import BottleneckAdvisor from "@/components/erp/BottleneckAdvisor";
import { forecastAll, computeOTD, computeForwardOTD, blamingSuppliers, type WoForecast } from "@/lib/erp/otif";

function daysUntil(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

function currentStageSeq(wo: typeof workOrders[number]): number {
  const inprog = wo.stages.find((s) => s.status === "in_progress");
  if (inprog) return inprog.seq;
  const next = wo.stages.find((s) => s.status !== "done");
  if (next) return next.seq;
  return 8;
}

const REASON_LABEL = {
  on_track: "正常",
  material_short: "供料不足",
  supplier_delay: "供應商延遲",
  capacity: "產能不足",
  bottleneck: "瓶頸工序",
} as const;

export default function CockpitPage() {
  const activeWos = workOrders.filter((w) => w.status !== "done" && w.status !== "cancelled");
  const alerts = computeAlerts();
  const bottlenecks = analyzeBottlenecks();
  const forecasts = forecastAll();
  const otd = computeOTD();
  const fwd = computeForwardOTD(forecasts);
  const blamers = blamingSuppliers(forecasts);

  const wosByStage = new Map<number, typeof workOrders>();
  for (const w of activeWos) {
    const seq = currentStageSeq(w);
    const arr = wosByStage.get(seq) ?? [];
    arr.push(w);
    wosByStage.set(seq, arr);
  }

  const forecastMap = new Map(forecasts.map((f) => [f.wo.id, f]));
  const redLight = forecasts.filter((f) => f.light === "red");
  const yellowLight = forecasts.filter((f) => f.light === "yellow");
  const greenLight = forecasts.filter((f) => f.light === "green");

  const redCount = alerts.filter((a) => a.severity === "red").length;
  const yellowCount = alerts.filter((a) => a.severity === "yellow").length;
  const totalActiveValue = activeWos.reduce((s, w) => {
    const m = models.find((m) => m.id === w.modelId);
    return s + (m ? m.stdPrice * w.qty : 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎯 戰情室 — Supply Chain Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            訂單卡在哪 · 哪張工單會延誤 · 哪個供應商造成停線 · AI 自動給解法
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>基準日 {today}　·　AI 每日自動計算</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-semibold">已連線鼎新 ERP（資料同步）</span>
            </span>
          </div>
        </div>
      </header>

      {/* ============ 必加 KPI：OTIF / OTD（世界級供應鏈核心指標）============ */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400">World-Class Supply Chain KPI</div>
            <div className="text-lg font-bold mt-0.5">OTIF / OTD — 準時且足量交貨率</div>
          </div>
          <div className="text-[10px] text-slate-400">沒有 OTIF/OTD，戰情室只是漂亮 Dashboard</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <BigKpi label="OTD（歷史）" value={`${otd.otd.toFixed(1)}%`} sub={`${otd.onTimeCount}/${otd.doneCount} 已交付`} tone={otd.otd >= 95 ? "emerald" : otd.otd >= 85 ? "amber" : "rose"} />
          <BigKpi label="OTIF（歷史）" value={`${otd.otif.toFixed(1)}%`} sub="準時+足量" tone={otd.otif >= 95 ? "emerald" : otd.otif >= 85 ? "amber" : "rose"} />
          <BigKpi label="🟢 預測可如期" value={`${fwd.greenPct.toFixed(0)}%`} sub={`${greenLight.length} 張在製`} tone="emerald" />
          <BigKpi label="🟡 預測可能延誤" value={`${fwd.yellowPct.toFixed(0)}%`} sub={`${yellowLight.length} 張在製`} tone="amber" />
          <BigKpi label="🔴 預測必延誤" value={`${fwd.redPct.toFixed(0)}%`} sub={`${redLight.length} 張在製`} tone="rose" />
        </div>
      </section>

      {/* 整體 KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="在製訂單" value={`${activeWos.length}`} sub="張單" tone="cyan" />
        <Kpi label="在製金額" value={`$${(totalActiveValue / 10000).toFixed(0)}萬`} sub={`$${totalActiveValue.toLocaleString()}`} />
        <Kpi label="未處理異常" value={`🔴 ${redCount}　🟡 ${yellowCount}`} sub={`${alerts.length} 條`} tone={redCount > 0 ? "rose" : undefined} />
        <Kpi label="造成停線供應商" value={`${blamers.length}`} sub="家" tone={blamers.length > 0 ? "amber" : undefined} />
      </section>

      {/* ============ 哪張工單會延誤（客戶交期燈號）============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">🚦 客戶交期燈號 — 哪張工單會延誤</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI 每日自動算：需求日 vs 供料日 vs 產能 vs 瓶頸工序　·　預測實際出貨日 vs 客戶要求
            </p>
          </div>
          <div className="flex gap-2 text-[11px]">
            <Legend c="bg-emerald-500" t={`可如期 ${greenLight.length}`} />
            <Legend c="bg-amber-500" t={`可能延誤 ${yellowLight.length}`} />
            <Legend c="bg-rose-500" t={`必延誤 ${redLight.length}`} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-center px-2 py-2">燈號</th>
                <th className="text-left px-3 py-2">工單 / 客戶</th>
                <th className="text-left px-3 py-2">客戶要求日</th>
                <th className="text-left px-3 py-2">AI 預測出貨日</th>
                <th className="text-right px-3 py-2">緩衝天數</th>
                <th className="text-left px-3 py-2">主因</th>
                <th className="text-left px-3 py-2">責任供應商 / 瓶頸</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.sort((a, b) => a.slackDays - b.slackDays).map((f) => (
                <ForecastRow key={f.wo.id} f={f} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ 哪個供應商造成停線 ============ */}
      {blamers.length > 0 && (
        <section className="bg-white rounded-xl border-2 border-rose-200 p-5">
          <h2 className="font-bold text-lg mb-3">🏭 哪個供應商造成停線</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {blamers.map((s) => (
              <div key={s.id} className="bg-rose-50 rounded-lg border border-rose-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">{s.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                    拖累 {s.affectedWos.length} 張單
                  </span>
                </div>
                <div className="text-xs text-slate-700 mb-1">
                  <span className="text-slate-500">關鍵料：</span>
                  {s.parts.slice(0, 5).join(" / ")}{s.parts.length > 5 && " …"}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="text-slate-500">影響工單：</span>
                  {s.affectedWos.map((wo) => (
                    <span key={wo} className="inline-block mr-1 font-mono text-rose-700">{wo}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ 工單卡在哪一關（保留原 8 階段視覺）============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-lg">📍 訂單卡在哪一關</h2>
            <p className="text-xs text-slate-500 mt-0.5">8 階段欄位看板 · 燈號與卡片左邊框對應</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-[920px]">
            {STAGES.map((meta, i) => {
              const seq = i + 1;
              const stageWos = wosByStage.get(seq) ?? [];
              const stageBottleneck = bottlenecks.find((b) => b.stage === meta.key);
              return (
                <div key={meta.key} className={`flex-1 min-w-[110px] rounded-lg border-2 ${
                  stageBottleneck ? "border-rose-300 bg-rose-50/40"
                  : stageWos.length > 0 ? "border-cyan-200 bg-cyan-50/30"
                  : "border-slate-200 bg-slate-50"
                }`}>
                  <div className="px-2 py-2 border-b border-slate-200/60 text-center">
                    <div className="text-lg">{meta.icon}</div>
                    <div className="text-xs font-bold">{meta.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {stageWos.length > 0 ? `${stageWos.length} 張` : "—"}
                    </div>
                    {stageBottleneck && (
                      <div className="mt-1 text-[9px] px-1 py-0.5 rounded bg-rose-500 text-white font-bold inline-block">⚠ 瓶頸</div>
                    )}
                  </div>
                  <div className="p-1.5 space-y-1.5 min-h-[120px]">
                    {stageWos.map((w) => {
                      const f = forecastMap.get(w.id);
                      const m = models.find((m) => m.id === w.modelId);
                      const d = daysUntil(w.shipDate);
                      const lightBorder =
                        f?.light === "red" ? "border-l-4 border-l-rose-500" :
                        f?.light === "yellow" ? "border-l-4 border-l-amber-500" :
                        "border-l-4 border-l-emerald-500";
                      return (
                        <Link key={w.id} href={`/erp/work-orders/${w.id}`}
                          className={`block rounded border ${lightBorder} bg-white p-1.5 hover:border-cyan-400 transition-colors`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-cyan-700 truncate">{w.woNo}</span>
                          </div>
                          <div className="text-[10px] text-slate-700 truncate">{w.customer}</div>
                          <div className="text-[9px] text-slate-500 truncate">{m?.code} × {w.qty}</div>
                          <div className={`text-[9px] font-bold tabular-nums mt-0.5 ${
                            d < 0 ? "text-slate-400" : d < 7 ? "text-rose-600" : d < 21 ? "text-amber-600" : "text-slate-500"
                          }`}>
                            {d >= 0 ? `T-${d}d` : `已逾 ${-d}d`}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI 解方 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              🤖 AI 卡點解方
              {bottlenecks.length > 0 && <span className="text-xs px-2 py-0.5 rounded bg-rose-500 text-white">{bottlenecks.length} 個瓶頸</span>}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">偵測到塞車 → 自動生成根因 + 可執行解方</p>
          </div>
        </div>
        <BottleneckAdvisor analyses={bottlenecks} />
      </section>

      <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔗</span>
          <div>
            <div className="font-bold text-slate-900 mb-1">系統定位：Global AI Supply Chain Command Center</div>
            <p>
              鼎新 ERP iGP = 系統 of record（單據/庫存/BOM/採購數量以鼎新為準）。
              本系統 = <b>跨模組供應鏈戰情 + AI 解方 + 預測性</b>。對鼎新唯讀不回寫，
              扣帳一律回 ERP 操作。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ForecastRow({ f }: { f: WoForecast }) {
  const tone =
    f.light === "red" ? { bg: "bg-rose-50/50", chip: "bg-rose-600" } :
    f.light === "yellow" ? { bg: "bg-amber-50/50", chip: "bg-amber-500" } :
    { bg: "", chip: "bg-emerald-500" };
  const label = f.light === "red" ? "必延誤" : f.light === "yellow" ? "可能延誤" : "可如期";
  return (
    <tr className={`border-t border-slate-100 ${tone.bg}`}>
      <td className="px-2 py-2 text-center">
        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${tone.chip}`}>{label}</span>
      </td>
      <td className="px-3 py-2">
        <Link href={`/erp/work-orders/${f.wo.id}`} className="font-mono text-xs text-cyan-700 hover:underline font-semibold">
          {f.wo.woNo}
        </Link>
        <div className="text-[10px] text-slate-500">{f.wo.customer} × {f.wo.qty}</div>
      </td>
      <td className="px-3 py-2 text-sm">{f.customerRequestDate}</td>
      <td className={`px-3 py-2 text-sm font-bold tabular-nums ${
        f.light === "red" ? "text-rose-600" : f.light === "yellow" ? "text-amber-600" : "text-emerald-600"
      }`}>{f.predictedShipDate}</td>
      <td className={`px-3 py-2 text-right tabular-nums font-bold ${
        f.slackDays < 0 ? "text-rose-600" : f.slackDays <= 3 ? "text-amber-600" : "text-emerald-600"
      }`}>
        {f.slackDays >= 0 ? `+${f.slackDays}d` : `${f.slackDays}d`}
      </td>
      <td className="px-3 py-2 text-xs">{REASON_LABEL[f.reason]}</td>
      <td className="px-3 py-2 text-xs text-slate-600">
        {f.responsibleSuppliers.length > 0
          ? f.responsibleSuppliers.map((s) => s.name).join(" / ")
          : f.bottleneckStage ? `瓶頸：${f.bottleneckStage}` : "—"}
      </td>
    </tr>
  );
}

function BigKpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "emerald" | "amber" | "rose" }) {
  const accent = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : "text-rose-400";
  return (
    <div className="bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${accent}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "cyan" | "amber" | "rose" }) {
  const cls = {
    cyan: "border-cyan-200 bg-cyan-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    rose: "border-rose-200 bg-rose-50/40",
  }[tone ?? "cyan"] ?? "border-slate-200 bg-white";
  const c = tone ? cls : "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${c}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return <span className="inline-flex items-center gap-1"><span className={`w-3 h-3 rounded-full ${c}`} />{t}</span>;
}
