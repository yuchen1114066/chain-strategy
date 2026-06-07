import Link from "next/link";
import { workOrders, models, today } from "@/lib/erp/seed";

// 客戶分析：從工單彙整每個客戶的關鍵指標
//   · 累計訂單 + 金額
//   · 在製管線（金額 + 張數）
//   · 準時交貨率
//   · 平均交貨天數（下單 → 出貨）
//   · 最近船期

type CustomerStat = {
  name: string;
  totalOrders: number;
  totalQty: number;
  totalRevenue: number;
  done: number;
  doneRevenue: number;
  active: number;
  activeRevenue: number;
  planning: number;
  onTimeDone: number;
  avgLeadDays: number;
  destinations: Set<string>;
  modelCodes: Set<string>;
  nextShipDate?: string;
  nextShipWoNo?: string;
};

function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export default function CustomersPage() {
  const stats = new Map<string, CustomerStat>();
  for (const w of workOrders) {
    const m = models.find((m) => m.id === w.modelId);
    const value = m ? m.stdPrice * w.qty : 0;
    const ex = stats.get(w.customer) ?? {
      name: w.customer,
      totalOrders: 0, totalQty: 0, totalRevenue: 0,
      done: 0, doneRevenue: 0, active: 0, activeRevenue: 0, planning: 0,
      onTimeDone: 0, avgLeadDays: 0,
      destinations: new Set<string>(), modelCodes: new Set<string>(),
    };
    ex.totalOrders += 1;
    ex.totalQty += w.qty;
    ex.totalRevenue += value;
    ex.destinations.add(w.destination);
    if (m) ex.modelCodes.add(m.code);
    if (w.status === "done") {
      ex.done += 1;
      ex.doneRevenue += value;
      const ship = w.stages.find((s) => s.stage === "ship");
      if (ship?.actualDate && ship.actualDate <= w.shipDate) ex.onTimeDone += 1;
    } else if (w.status === "active") {
      ex.active += 1;
      ex.activeRevenue += value;
    } else if (w.status === "planning") {
      ex.planning += 1;
      ex.activeRevenue += value;
    }
    stats.set(w.customer, ex);
  }

  // 平均交貨天數 + 最近船期
  for (const [cust, s] of stats.entries()) {
    const custWos = workOrders.filter((w) => w.customer === cust);
    const doneWos = custWos.filter((w) => w.status === "done");
    const leadSamples = doneWos.map((w) => {
      const ship = w.stages.find((s) => s.stage === "ship");
      if (ship?.actualDate) return diffDays(w.orderDate, ship.actualDate);
      return null;
    }).filter((n): n is number => n != null);
    s.avgLeadDays = leadSamples.length
      ? Math.round(leadSamples.reduce((a, b) => a + b, 0) / leadSamples.length)
      : 0;
    const upcoming = custWos
      .filter((w) => w.status === "active" || w.status === "planning")
      .sort((a, b) => a.shipDate.localeCompare(b.shipDate))[0];
    if (upcoming) {
      s.nextShipDate = upcoming.shipDate;
      s.nextShipWoNo = upcoming.woNo;
    }
  }

  const customers = [...stats.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const totalRevenue = customers.reduce((s, c) => s + c.totalRevenue, 0);
  const totalActive = customers.reduce((s, c) => s + c.activeRevenue, 0);
  const overallOnTime = customers.reduce((acc, c) => ({
    done: acc.done + c.done,
    onTime: acc.onTime + c.onTimeDone,
  }), { done: 0, onTime: 0 });
  const onTimePct = overallOnTime.done > 0 ? Math.round((overallOnTime.onTime / overallOnTime.done) * 100) : 100;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">👥 客戶分析</h1>
        <p className="text-sm text-slate-500 mt-1">
          每個客戶的累計營收 / 在製管線 / 準時交貨率 / 平均交貨天數
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="客戶數" value={`${customers.length}`} />
        <Kpi label="累計營收" value={`$${(totalRevenue / 10000).toFixed(0)}萬`} sub={`$${totalRevenue.toLocaleString()}`} tone="cyan" />
        <Kpi label="在製管線" value={`$${(totalActive / 10000).toFixed(0)}萬`} tone="amber" />
        <Kpi label="整體準時率" value={`${onTimePct}%`} tone={onTimePct >= 90 ? "emerald" : "amber"} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">客戶</th>
              <th className="text-right px-4 py-2.5 font-semibold">總訂單</th>
              <th className="text-right px-4 py-2.5 font-semibold">累計營收</th>
              <th className="text-center px-4 py-2.5 font-semibold">狀態分布</th>
              <th className="text-right px-4 py-2.5 font-semibold">準時率</th>
              <th className="text-right px-4 py-2.5 font-semibold">平均交期</th>
              <th className="text-left px-4 py-2.5 font-semibold">下次船期</th>
              <th className="text-left px-4 py-2.5 font-semibold">機種 / 目的地</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const onTimePct = c.done > 0 ? Math.round((c.onTimeDone / c.done) * 100) : 100;
              const daysToShip = c.nextShipDate ? diffDays(today, c.nextShipDate) : null;
              return (
                <tr key={c.name} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold">{c.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    <div className="font-semibold">{c.totalOrders}</div>
                    <div className="text-[10px] text-slate-500">{c.totalQty} 台</div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold">
                    ${c.totalRevenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex h-4 rounded overflow-hidden border border-slate-200 min-w-[120px]" title={`完成 ${c.done} / 在製 ${c.active} / 規劃 ${c.planning}`}>
                      {c.done > 0 && <div className="bg-emerald-500" style={{ flex: c.done }} />}
                      {c.active > 0 && <div className="bg-cyan-500" style={{ flex: c.active }} />}
                      {c.planning > 0 && <div className="bg-slate-400" style={{ flex: c.planning }} />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 text-center">
                      ✓{c.done} · 製{c.active} · 規{c.planning}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {c.done > 0 ? (
                      <span className={`font-bold ${onTimePct >= 90 ? "text-emerald-600" : onTimePct >= 70 ? "text-amber-600" : "text-rose-600"}`}>
                        {onTimePct}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {c.avgLeadDays > 0 ? `${c.avgLeadDays}d` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {c.nextShipDate ? (
                      <div>
                        <div className="font-mono">{c.nextShipDate}</div>
                        <div className={`text-[10px] ${daysToShip !== null && daysToShip < 7 ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                          {daysToShip !== null && (daysToShip >= 0 ? `T-${daysToShip}` : `已逾 ${-daysToShip}d`)}
                          {c.nextShipWoNo && ` · ${c.nextShipWoNo}`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">無排定</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    <div>{[...c.modelCodes].slice(0, 2).join(" / ")}</div>
                    <div className="text-slate-400">{[...c.destinations].slice(0, 2).join(" / ")}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold mb-3">🏆 營收 Top 客戶（累計）</h3>
          {customers.slice(0, 6).map((c, i) => {
            const pct = totalRevenue > 0 ? (c.totalRevenue / totalRevenue) * 100 : 0;
            return (
              <div key={c.name} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span><span className="text-slate-400 mr-1">#{i + 1}</span><b>{c.name}</b></span>
                  <span className="tabular-nums">${c.totalRevenue.toLocaleString()} · {pct.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded bg-slate-100 overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold mb-3">⏳ 近期船期 Top 5</h3>
          {(() => {
            const upcoming = customers
              .filter((c) => c.nextShipDate)
              .sort((a, b) => (a.nextShipDate ?? "").localeCompare(b.nextShipDate ?? ""))
              .slice(0, 5);
            if (upcoming.length === 0) return <p className="text-xs text-slate-500">無排定船期</p>;
            return (
              <ul className="space-y-2 text-sm">
                {upcoming.map((c) => {
                  const daysToShip = c.nextShipDate ? diffDays(today, c.nextShipDate) : 0;
                  return (
                    <li key={c.name} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-semibold">{c.name}</span>
                        <span className={`text-xs tabular-nums ${daysToShip < 7 ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                          T-{daysToShip} · {c.nextShipDate}
                        </span>
                      </div>
                      {c.nextShipWoNo && (
                        <Link href={`/erp/work-orders`} className="text-xs font-mono text-cyan-700 hover:underline">
                          {c.nextShipWoNo}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-600">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> 完成（已交付）</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-500" /> 在製</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-400" /> 規劃</span>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "cyan" | "amber" | "emerald" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
