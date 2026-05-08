import Link from "next/link";
import { workOrders, models, today } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import StageBar from "@/components/erp/StageBar";

function daysUntil(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

export default function WorkOrdersPage() {
  const alerts = computeAlerts();
  const alertCountByWo = new Map<string, { red: number; yellow: number }>();
  for (const a of alerts) {
    const c = alertCountByWo.get(a.woId) ?? { red: 0, yellow: 0 };
    if (a.severity === "red") c.red += 1; else c.yellow += 1;
    alertCountByWo.set(a.woId, c);
  }

  return (
    <div className="p-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">工單追蹤</h1>
          <p className="text-sm text-slate-500 mt-1">
            業務 → 採購 → 生產 → 出貨 一張單管到底；八階段反向排程，異常即時跳警訊
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {workOrders.map((w) => {
          const m = models.find((m) => m.id === w.modelId);
          const dleft = daysUntil(w.shipDate);
          const ac = alertCountByWo.get(w.id);
          return (
            <Link
              key={w.id}
              href={`/erp/work-orders/${w.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-cyan-400 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-cyan-700">{w.woNo}</span>
                  <span className="text-sm text-slate-700">{m?.name} × {w.qty}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${
                    w.status === "active" ? "bg-cyan-100 text-cyan-700" :
                    w.status === "planning" ? "bg-slate-100 text-slate-600" :
                    w.status === "done" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>{w.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600">{w.customer} → {w.destination}</span>
                  <span className={`font-bold tabular-nums ${dleft < 7 ? "text-rose-600" : dleft < 21 ? "text-amber-600" : "text-slate-600"}`}>
                    船期 {w.shipDate}（{dleft >= 0 ? `T-${dleft}` : `已逾 ${-dleft}d`}）
                  </span>
                  {ac && (ac.red > 0 || ac.yellow > 0) && (
                    <span className="flex items-center gap-1">
                      {ac.red > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold">🔴 {ac.red}</span>}
                      {ac.yellow > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">🟡 {ac.yellow}</span>}
                    </span>
                  )}
                </div>
              </div>
              <StageBar stages={w.stages} today={today} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
