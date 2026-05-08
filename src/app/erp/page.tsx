import Link from "next/link";
import { models, parts, suppliers, workOrders, today, currentStageLabel } from "@/lib/erp/seed";
import { computeAlerts, computePartDemand } from "@/lib/erp/alerts";
import StageBar from "@/components/erp/StageBar";
import AlertList from "@/components/erp/AlertList";

function daysUntil(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

export default function ErpCockpitPage() {
  const alerts = computeAlerts();
  const demand = computePartDemand();
  const shortageCount = demand.filter((d) => d.shortage > 0).length;
  const activeWos = workOrders.filter((w) => w.status === "active" || w.status === "planning");
  const upcoming = [...activeWos].sort((a, b) => a.shipDate.localeCompare(b.shipDate)).slice(0, 5);

  const redCount = alerts.filter((a) => a.severity === "red").length;
  const yellowCount = alerts.filter((a) => a.severity === "yellow").length;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">戰情室 Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            基準日 {today}　·　業務 / 採購 / 生產 / 出貨即時概況
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/erp/simulator"
            className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-700 font-semibold flex items-center gap-1"
          >
            🔮 缺料模擬器
          </Link>
          <Link
            href="/erp/import"
            className="px-3 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
          >
            📥 匯入 iGP
          </Link>
        </div>
      </header>

      {/* Hero CTA — simulator front and center */}
      <section className="rounded-xl border-2 border-cyan-300 bg-gradient-to-r from-cyan-50 to-sky-50 p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-4xl">🔮</div>
          <div className="flex-1 min-w-[260px]">
            <div className="text-xs font-bold text-cyan-700 uppercase tracking-wider">值回票價的一頁</div>
            <div className="text-lg font-bold text-slate-900">缺料模擬器</div>
            <p className="text-sm text-slate-600">
              「我要做 50 台 FB64H021 + 30 台 FB64H020」→ 立刻吐出缺料清單、預計到廠日、能不能趕上船期
            </p>
          </div>
          <Link
            href="/erp/simulator"
            className="px-4 py-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-700 text-sm font-semibold"
          >
            進入模擬 →
          </Link>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="進行中工單" value={activeWos.length} suffix="張" />
        <Kpi label="型號 / 零件" value={`${models.length} / ${parts.length}`} />
        <Kpi label="供應商" value={suppliers.length} suffix="家" />
        <Kpi label="🔴 紅燈" value={redCount} tone={redCount > 0 ? "red" : undefined} />
        <Kpi label="🟡 黃燈" value={yellowCount} tone={yellowCount > 0 ? "yellow" : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">船期倒數（最近 5 張）</h2>
            <Link href="/erp/work-orders" className="text-xs text-cyan-700 hover:underline">查看全部 →</Link>
          </div>
          <ul className="space-y-3">
            {upcoming.map((w) => {
              const m = models.find((m) => m.id === w.modelId);
              const dleft = daysUntil(w.shipDate);
              return (
                <li key={w.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2 text-xs">
                    <Link href={`/erp/work-orders/${w.id}`} className="font-mono text-sm font-semibold text-cyan-700 hover:underline">
                      {w.woNo}
                    </Link>
                    <span className="text-slate-700">
                      <span className="font-mono">{m?.code}</span> × {w.qty} · {w.customer} · {currentStageLabel(w)}
                    </span>
                    <span className={`font-bold tabular-nums ${dleft < 7 ? "text-rose-600" : dleft < 21 ? "text-amber-600" : "text-slate-500"}`}>
                      船期 {w.shipDate}（{dleft >= 0 ? `T-${dleft}` : `已逾 ${-dleft}d`}）
                    </span>
                  </div>
                  <StageBar stages={w.stages} today={today} />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">缺料 Top 5</h2>
            <span className="text-xs text-slate-500">{shortageCount} 項缺料</span>
          </div>
          <ul className="space-y-2 text-sm">
            {demand.filter((d) => d.shortage > 0).slice(0, 5).map((d) => (
              <li key={d.part.id} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                <div>
                  <div className="font-mono text-xs text-slate-500">{d.part.code}</div>
                  <div className="font-medium">{d.part.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-600 tabular-nums">-{d.shortage}</div>
                  <div className="text-xs text-slate-500">交期 {d.part.leadDays}d</div>
                </div>
              </li>
            ))}
            {shortageCount === 0 && (
              <li className="text-emerald-700 text-sm">✅ 全料件庫存充足</li>
            )}
          </ul>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">🚨 異常警訊（含預測）</h2>
          <Link href="/erp/alerts" className="text-xs text-cyan-700 hover:underline">完整列表 →</Link>
        </div>
        <AlertList alerts={alerts.slice(0, 6)} />
      </section>
    </div>
  );
}

function Kpi({ label, value, suffix, tone }: { label: string; value: number | string; suffix?: string; tone?: "red" | "yellow" }) {
  const ring =
    tone === "red"
      ? "ring-2 ring-rose-300 bg-rose-50"
      : tone === "yellow"
      ? "ring-2 ring-amber-300 bg-amber-50"
      : "bg-white";
  return (
    <div className={`rounded-xl border border-slate-200 px-4 py-3 ${ring}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {value}
        {suffix && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
