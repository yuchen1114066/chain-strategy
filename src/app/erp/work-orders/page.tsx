import Link from "next/link";
import { workOrders, models, today, currentStageLabel } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import StageBar from "@/components/erp/StageBar";

function daysUntil(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

const statusTone: Record<string, string> = {
  "已簽收": "bg-emerald-100 text-emerald-700",
  "生產中": "bg-cyan-100 text-cyan-700",
  "待料":   "bg-amber-100 text-amber-800",
  "規劃中": "bg-slate-100 text-slate-600",
  "待開工": "bg-slate-100 text-slate-600",
  "出貨中": "bg-violet-100 text-violet-700",
};

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
            來源 ERP 訂單 → BOM 自動展開零件 → 八階段追蹤 → 預測異常
          </p>
        </div>
      </header>

      {/* Compact table — exact match to screenshot columns */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold">訂單號</th>
              <th className="text-left px-3 py-2.5 font-semibold">來源</th>
              <th className="text-left px-3 py-2.5 font-semibold">客戶</th>
              <th className="text-left px-3 py-2.5 font-semibold">成品品號</th>
              <th className="text-left px-3 py-2.5 font-semibold">機種</th>
              <th className="text-right px-3 py-2.5 font-semibold">數量</th>
              <th className="text-left px-3 py-2.5 font-semibold">下單日</th>
              <th className="text-left px-3 py-2.5 font-semibold">目前站別</th>
              <th className="text-left px-3 py-2.5 font-semibold">狀態</th>
              <th className="text-left px-3 py-2.5 font-semibold">備註</th>
              <th className="text-left px-3 py-2.5 font-semibold">⚠</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w) => {
              const m = models.find((m) => m.id === w.modelId);
              const ac = alertCountByWo.get(w.id);
              const stageLabel = currentStageLabel(w);
              const sl = w.statusLabel ?? w.status;
              return (
                <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <Link href={`/erp/work-orders/${w.id}`} className="font-mono font-semibold text-cyan-700 hover:underline">
                      {w.woNo}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${w.source === "ERP" ? "bg-cyan-500" : "bg-slate-400"}`} />
                      {w.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{w.customer}</td>
                  <td className="px-3 py-2.5 font-mono">{m?.code}</td>
                  <td className="px-3 py-2.5 text-slate-700">{m?.machineFamily}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{w.qty}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600">{w.orderDate}</td>
                  <td className="px-3 py-2.5">{stageLabel}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusTone[sl] ?? "bg-slate-100 text-slate-600"}`}>
                      ● {sl}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{w.notes ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {ac ? (
                      <div className="flex gap-1 text-[10px] font-bold">
                        {ac.red > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white">🔴{ac.red}</span>}
                        {ac.yellow > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">🟡{ac.yellow}</span>}
                      </div>
                    ) : (
                      <span className="text-emerald-500 text-xs">✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Visual stage bars — for at-a-glance scanning */}
      <h2 className="text-sm font-semibold text-slate-600 mb-3">八階段視覺化</h2>
      <div className="space-y-3">
        {workOrders.filter((w) => w.status !== "done").map((w) => {
          const m = models.find((m) => m.id === w.modelId);
          const dleft = daysUntil(w.shipDate);
          return (
            <Link
              key={w.id}
              href={`/erp/work-orders/${w.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-cyan-400 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-700">{w.woNo}</span>
                  <span className="font-mono text-slate-500">{m?.code}</span>
                  <span className="text-slate-700">× {w.qty}　·　{w.customer}</span>
                </div>
                <span className={`tabular-nums font-bold ${dleft < 7 ? "text-rose-600" : dleft < 21 ? "text-amber-600" : "text-slate-500"}`}>
                  船期 {w.shipDate}（{dleft >= 0 ? `T-${dleft}` : `已逾 ${-dleft}d`}）
                </span>
              </div>
              <StageBar stages={w.stages} today={today} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
