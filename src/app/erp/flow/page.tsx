import Link from "next/link";
import { workOrders, models, today, currentStageLabel } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import { analyzeBottlenecks } from "@/lib/erp/flow-advisor";
import { STAGES } from "@/lib/erp/types";
import BottleneckAdvisor from "@/components/erp/BottleneckAdvisor";

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

// 計算每張單的「目前在哪一個階段」（first non-done 或 in_progress）
function currentStageSeq(wo: typeof workOrders[number]): number {
  const inprog = wo.stages.find((s) => s.status === "in_progress");
  if (inprog) return inprog.seq;
  const next = wo.stages.find((s) => s.status !== "done");
  if (next) return next.seq;
  return 8; // 全部完成
}

export default function FlowDashboardPage() {
  // ── 1. 八階段瓶頸統計 ──
  const stageStats = STAGES.map((meta, idx) => {
    const seq = idx + 1;
    const wos = workOrders.filter((w) => w.status !== "cancelled" && currentStageSeq(w) === seq);
    const value = wos.reduce((s, w) => {
      const m = models.find((m) => m.id === w.modelId);
      return s + (m ? m.stdPrice * w.qty : 0);
    }, 0);
    // 平均停留天數：今天 - 前一階段實際完成日
    const dwellSamples: number[] = [];
    for (const w of wos) {
      const prev = w.stages.find((s) => s.seq === seq - 1);
      if (prev?.actualDate) dwellSamples.push(Math.max(0, daysBetween(prev.actualDate, today)));
    }
    const avgDwell = dwellSamples.length
      ? Math.round(dwellSamples.reduce((a, b) => a + b, 0) / dwellSamples.length)
      : 0;
    // 瓶頸：超過該階段標準工時 50% 視為瓶頸
    const standardDays: Record<string, number> = { material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0 };
    const std = standardDays[meta.key] || 1;
    const bottleneck = avgDwell > std * 1.5;
    return { seq, meta, count: wos.length, value, avgDwell, std, bottleneck };
  });

  // ── 2. 整體 KPI ──
  const activeWos = workOrders.filter((w) => w.status === "active" || w.status === "planning");
  const totalActiveValue = activeWos.reduce((s, w) => {
    const m = models.find((m) => m.id === w.modelId);
    return s + (m ? m.stdPrice * w.qty : 0);
  }, 0);
  const doneWos = workOrders.filter((w) => w.status === "done");
  const doneValue = doneWos.reduce((s, w) => {
    const m = models.find((m) => m.id === w.modelId);
    return s + (m ? m.stdPrice * w.qty : 0);
  }, 0);
  const onTimeWos = doneWos.filter((w) => {
    const ship = w.stages.find((s) => s.stage === "ship");
    return ship?.actualDate && ship.actualDate <= w.shipDate;
  });
  const onTimePct = doneWos.length ? Math.round((onTimeWos.length / doneWos.length) * 100) : 100;
  const avgLeadDays = doneWos.length
    ? Math.round(
        doneWos.reduce((acc, w) => {
          const ship = w.stages.find((s) => s.stage === "ship");
          if (!ship?.actualDate) return acc;
          return acc + daysBetween(w.orderDate, ship.actualDate);
        }, 0) / doneWos.length
      )
    : 0;

  // ── 3. 漏斗轉換 ──
  const totalAll = workOrders.length;
  const planning = workOrders.filter((w) => w.status === "planning").length;
  const active = workOrders.filter((w) => w.status === "active").length;
  const done = workOrders.filter((w) => w.status === "done").length;
  const cancelled = workOrders.filter((w) => w.status === "cancelled").length;

  const alerts = computeAlerts();
  const redCount = alerts.filter((a) => a.severity === "red").length;
  const yellowCount = alerts.filter((a) => a.severity === "yellow").length;

  // 瓶頸顧問：每個塞車階段即時生成根因 + 解方
  const bottlenecks = analyzeBottlenecks();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🌊 流程綜觀</h1>
          <p className="text-sm text-slate-500 mt-1">
            客戶下需求 → BOM 展開 → 採購 → 進料 → 生產 → 測試 → 包裝 → 出貨 → 簽收 一頁掌握
          </p>
        </div>
        <span className="text-xs text-slate-500">基準日 {today}</span>
      </header>

      {/* KPI 大圖 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiBig label="進行中訂單" value={`$${(totalActiveValue / 10000).toFixed(0)}萬`} sub={`${activeWos.length} 張單`} tone="cyan" />
        <KpiBig label="已交付" value={`$${(doneValue / 10000).toFixed(0)}萬`} sub={`${doneWos.length} 張單`} tone="emerald" />
        <KpiBig label="準時交貨率" value={`${onTimePct}%`} sub={`${onTimeWos.length} / ${doneWos.length}`} tone={onTimePct >= 90 ? "emerald" : "amber"} />
        <KpiBig label="平均交貨天數" value={`${avgLeadDays}d`} sub="下單 → 出貨" tone="slate" />
        <KpiBig label="未處理異常" value={`🔴${redCount} 🟡${yellowCount}`} sub={`${alerts.length} 條總計`} tone={redCount > 0 ? "rose" : "slate"} />
      </div>

      {/* ============ 流程漏斗：8 階段一字排開 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">🏭 八階段流程瓶頸熱圖</h2>
          <span className="text-xs text-slate-500">紅 = 平均停留超過標準 1.5×</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-1 min-w-[920px]">
            {stageStats.map((s, i) => {
              const isLast = i === stageStats.length - 1;
              const tone = s.bottleneck
                ? "bg-rose-50 border-rose-300"
                : s.count > 0
                ? "bg-cyan-50 border-cyan-200"
                : "bg-slate-50 border-slate-200";
              return (
                <div key={s.meta.key} className="flex items-center flex-1 min-w-0">
                  <div className={`flex-1 min-w-0 border rounded-lg p-3 ${tone}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl">{s.meta.icon}</span>
                      <span className="text-xs font-bold">{s.meta.label}</span>
                      {s.bottleneck && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-white">瓶頸</span>}
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500">在製單數</div>
                        <div className="text-xl font-bold tabular-nums">{s.count}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">平均停留</div>
                        <div className={`text-sm font-bold tabular-nums ${s.bottleneck ? "text-rose-600" : "text-slate-700"}`}>
                          {s.avgDwell}d
                        </div>
                        <div className="text-[9px] text-slate-400">標準 {s.std}d</div>
                      </div>
                    </div>
                    {s.value > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
                        ${(s.value / 10000).toFixed(0)} 萬
                      </div>
                    )}
                  </div>
                  {!isLast && <div className="px-0.5 text-slate-300 text-lg">→</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 瓶頸即時解方 ============ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              ✨ 瓶頸即時解方
              {bottlenecks.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500 text-white">{bottlenecks.length}</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              偵測到塞車階段 → 自動生成根因 + 可執行解方（依優先順序），不只說「卡了」更告訴你「怎麼救」
            </p>
          </div>
        </div>
        <BottleneckAdvisor analyses={bottlenecks} />
      </section>

      {/* ============ 漏斗轉換 ============ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-4">📊 訂單漏斗（客戶需求 → 簽收）</h2>
          <FunnelRow label="客戶下需求（全部單據）" count={totalAll} pct={100} tone="bg-slate-300" />
          <FunnelRow label="規劃中" count={planning} pct={(planning / totalAll) * 100} tone="bg-slate-400" />
          <FunnelRow label="生產中" count={active} pct={(active / totalAll) * 100} tone="bg-cyan-500" />
          <FunnelRow label="已交付簽收" count={done} pct={(done / totalAll) * 100} tone="bg-emerald-500" />
          {cancelled > 0 && (
            <FunnelRow label="取消" count={cancelled} pct={(cancelled / totalAll) * 100} tone="bg-rose-400" />
          )}
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>總接單 {totalAll} 張</span>
            <span>完成率 <b className="text-slate-900">{Math.round((done / totalAll) * 100)}%</b></span>
            <span>仍在管線 {planning + active} 張</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">🚢 即將出貨（7 日內）</h2>
          {(() => {
            const upcoming = activeWos
              .filter((w) => {
                const d = daysBetween(today, w.shipDate);
                return d >= 0 && d <= 7;
              })
              .sort((a, b) => a.shipDate.localeCompare(b.shipDate));
            if (upcoming.length === 0) {
              return <p className="text-xs text-slate-500">7 日內無排定船期</p>;
            }
            return (
              <ul className="text-xs space-y-2">
                {upcoming.map((w) => {
                  const m = models.find((m) => m.id === w.modelId);
                  const d = daysBetween(today, w.shipDate);
                  return (
                    <li key={w.id} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                      <Link href={`/erp/work-orders/${w.id}`} className="font-mono text-cyan-700 hover:underline">
                        {w.woNo}
                      </Link>
                      <div className="text-slate-700 mt-0.5">{m?.code} × {w.qty} · {w.customer}</div>
                      <div className={`text-[10px] font-bold tabular-nums mt-0.5 ${d <= 3 ? "text-rose-600" : "text-amber-600"}`}>
                        T-{d} · 船期 {w.shipDate}
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </div>
      </section>

      {/* ============ Pipeline Gantt：每張單一條 bar ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">📈 訂單管線 Gantt</h2>
          <span className="text-xs text-slate-500">每張單目前推進到第幾階段（一目了然）</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[860px]">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left px-2 py-1.5 w-44">訂單 / 客戶 / 機種</th>
                {STAGES.map((m) => (
                  <th key={m.key} className="text-center px-1 py-1.5">{m.icon}<br /><span className="text-[10px]">{m.label}</span></th>
                ))}
                <th className="text-right px-2 py-1.5">船期</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((w) => {
                const m = models.find((m) => m.id === w.modelId);
                const dleft = daysBetween(today, w.shipDate);
                return (
                  <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-2">
                      <Link href={`/erp/work-orders/${w.id}`} className="font-mono text-cyan-700 hover:underline font-semibold">
                        {w.woNo}
                      </Link>
                      <div className="text-[10px] text-slate-600 truncate">{w.customer} · {m?.code}</div>
                      <div className="text-[10px] text-slate-400">{currentStageLabel(w)}</div>
                    </td>
                    {w.stages.map((s) => {
                      const late = !s.actualDate && s.plannedDate < today && s.status !== "done";
                      const tone =
                        s.status === "done"
                          ? "bg-emerald-400"
                          : s.status === "in_progress"
                          ? "bg-cyan-500 ring-2 ring-cyan-300"
                          : s.status === "blocked"
                          ? "bg-rose-500"
                          : late
                          ? "bg-amber-400"
                          : "bg-slate-200";
                      return (
                        <td key={s.stage} className="px-1 py-2">
                          <div
                            className={`h-3 rounded ${tone}`}
                            title={`預計 ${s.plannedDate}${s.actualDate ? `\n實際 ${s.actualDate}` : ""}\n狀態 ${s.status}`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-right">
                      <div className="font-mono tabular-nums">{w.shipDate}</div>
                      <div className={`text-[10px] font-bold tabular-nums ${dleft < 0 ? "text-slate-400" : dleft < 7 ? "text-rose-600" : dleft < 21 ? "text-amber-600" : "text-slate-500"}`}>
                        {dleft >= 0 ? `T-${dleft}` : `已逾 ${-dleft}d`}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-600">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> 完成</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-500 ring-2 ring-cyan-300" /> 進行中</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> 已延遲</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500" /> 阻塞</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200" /> 待辦</span>
        </div>
      </section>
    </div>
  );
}

function KpiBig({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "cyan" | "emerald" | "amber" | "rose" | "slate" }) {
  const ring = {
    cyan: "border-cyan-200 bg-cyan-50/40",
    emerald: "border-emerald-200 bg-emerald-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    rose: "border-rose-200 bg-rose-50/40",
    slate: "border-slate-200 bg-white",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 ${ring}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function FunnelRow({ label, count, pct, tone }: { label: string; count: number; pct: number; tone: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="tabular-nums">
          <b>{count}</b> <span className="text-slate-400">張 · {pct.toFixed(0)}%</span>
        </span>
      </div>
      <div className="h-6 rounded bg-slate-100 overflow-hidden">
        <div className={`h-full ${tone} transition-all`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}
