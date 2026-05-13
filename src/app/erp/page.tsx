import Link from "next/link";
import { workOrders, models, today } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import { analyzeBottlenecks } from "@/lib/erp/flow-advisor";
import { STAGES } from "@/lib/erp/types";
import BottleneckAdvisor from "@/components/erp/BottleneckAdvisor";

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

export default function CockpitPage() {
  const activeWos = workOrders.filter((w) => w.status !== "done" && w.status !== "cancelled");
  const alerts = computeAlerts();
  const bottlenecks = analyzeBottlenecks();

  // 依階段分組工單
  const wosByStage = new Map<number, typeof workOrders>();
  for (const w of activeWos) {
    const seq = currentStageSeq(w);
    const arr = wosByStage.get(seq) ?? [];
    arr.push(w);
    wosByStage.set(seq, arr);
  }

  // KPI
  const redCount = alerts.filter((a) => a.severity === "red").length;
  const yellowCount = alerts.filter((a) => a.severity === "yellow").length;
  const totalActiveValue = activeWos.reduce((s, w) => {
    const m = models.find((m) => m.id === w.modelId);
    return s + (m ? m.stdPrice * w.qty : 0);
  }, 0);
  const within7Days = activeWos.filter((w) => {
    const d = daysUntil(w.shipDate);
    return d >= 0 && d <= 7;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎯 貨件流程戰情室</h1>
          <p className="text-sm text-slate-500 mt-1">
            每張單目前卡在哪一關 + 卡住自動產出解方
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>基準日 {today}</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-semibold">已連線鼎新 ERP（資料同步）</span>
            </span>
          </div>
        </div>
      </header>

      {/* KPI 4 卡 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="在製貨件" value={`${activeWos.length}`} sub="張單" tone="cyan" />
        <Kpi label="在製金額" value={`$${(totalActiveValue / 10000).toFixed(0)}萬`} sub={`$${totalActiveValue.toLocaleString()}`} />
        <Kpi label="7 日內出貨" value={`${within7Days}`} sub="張單" tone={within7Days > 0 ? "amber" : undefined} />
        <Kpi label="未處理異常" value={`🔴 ${redCount}　🟡 ${yellowCount}`} sub={`${alerts.length} 條`} tone={redCount > 0 ? "rose" : undefined} />
      </section>

      {/* ============ 核心 1：貨件流程可視化 — 每張單卡在哪一關 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">📍 每張單目前位置</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              工單卡片落在所在階段欄位 — 紅色 = 已延遲 / 黃色 = 預警 / 綠色 = 正常 / 灰色 = 未開始
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-[920px]">
            {STAGES.map((meta, i) => {
              const seq = i + 1;
              const stageWos = wosByStage.get(seq) ?? [];
              const stageBottleneck = bottlenecks.find((b) => b.stage === meta.key);
              return (
                <div
                  key={meta.key}
                  className={`flex-1 min-w-[110px] rounded-lg border-2 ${
                    stageBottleneck
                      ? "border-rose-300 bg-rose-50/40"
                      : stageWos.length > 0
                      ? "border-cyan-200 bg-cyan-50/30"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="px-2 py-2 border-b border-slate-200/60 text-center">
                    <div className="text-lg">{meta.icon}</div>
                    <div className="text-xs font-bold">{meta.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {stageWos.length > 0 ? `${stageWos.length} 張` : "—"}
                    </div>
                    {stageBottleneck && (
                      <div className="mt-1 text-[9px] px-1 py-0.5 rounded bg-rose-500 text-white font-bold inline-block">
                        ⚠ 瓶頸
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 space-y-1.5 min-h-[120px]">
                    {stageWos.map((w) => {
                      const m = models.find((m) => m.id === w.modelId);
                      const d = daysUntil(w.shipDate);
                      const wAlerts = alerts.filter((a) => a.woId === w.id);
                      const tone =
                        wAlerts.some((a) => a.severity === "red")
                          ? "border-rose-300 bg-white shadow-rose-100 shadow-sm"
                          : wAlerts.length > 0
                          ? "border-amber-300 bg-white shadow-amber-100 shadow-sm"
                          : d < 7
                          ? "border-amber-200 bg-white"
                          : "border-slate-200 bg-white";
                      return (
                        <Link
                          key={w.id}
                          href={`/erp/work-orders/${w.id}`}
                          className={`block rounded border ${tone} p-1.5 hover:border-cyan-400 transition-colors`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] font-bold text-cyan-700 truncate">{w.woNo}</span>
                            {wAlerts.length > 0 && (
                              <span className="text-[9px]">
                                {wAlerts.some((a) => a.severity === "red") ? "🔴" : "🟡"}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-700 truncate">{w.customer}</div>
                          <div className="text-[9px] text-slate-500 truncate">
                            {m?.code} × {w.qty}
                          </div>
                          <div className={`text-[9px] font-bold tabular-nums mt-0.5 ${
                            d < 0 ? "text-slate-400" :
                            d < 7 ? "text-rose-600" :
                            d < 21 ? "text-amber-600" :
                            "text-slate-500"
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

        <p className="text-[11px] text-slate-500 mt-3 text-center">
          ← 算料 / 採購 …………………… 生產 / 測試 …………………… 出貨 / 簽收 →
        </p>
      </section>

      {/* ============ 核心 2：AI 解方 — 卡住自動產出建議 ============ */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              🤖 AI 卡點解方
              {bottlenecks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500 text-white">{bottlenecks.length} 個瓶頸</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              偵測到塞車階段 → 自動生成根因 + 可執行解方（按優先順序）
            </p>
          </div>
        </div>
        <BottleneckAdvisor analyses={bottlenecks} />
      </section>

      {/* ============ 底部：對齊鼎新 ERP 提示 ============ */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔗</span>
          <div>
            <div className="font-bold text-slate-900 mb-1">本系統定位</div>
            <p>
              <b>視覺化監控 + 決策輔助</b>。所有工單 / 庫存 / BOM / 採購數量以
              <b className="text-rose-700"> 鼎新 ERP iGP </b>
              為準，本系統僅做即時同步顯示與異常分析。實際扣帳 / 異動請至 ERP 操作。
            </p>
            <p className="mt-1 text-slate-500">
              對應外部來源：WorkFlow ERP iGP　·　R:\業務&採購協調追蹤　·　Q:\採購課\成品成本分析
            </p>
          </div>
        </div>
      </section>
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
