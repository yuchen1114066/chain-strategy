import Link from "next/link";
import { outsourceOrders, type OutsourceProcess } from "@/lib/erp/outsource";
import { today } from "@/lib/erp/seed";

// 委外倉管理 — WMS 規劃「5. 委外倉管理」
//   電鍍 / 烤漆 / 熱處理 / 外包焊接
//   在外數量即時 / 加工進度透明 / 委外良率統計 / 逾期預警系統化

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

const PROCESS_ICON: Record<OutsourceProcess, string> = {
  電鍍: "⚡", 烤漆: "🎨", 熱處理: "🔥", 外包焊接: "🔧", 託外加工: "🏭",
};

export default function OutsourcePage() {
  const rows = outsourceOrders.map((o) => {
    const inTransit = o.qtyOut - o.qtyReturned;          // 在外數量
    const completed = o.qtyReturned >= o.qtyOut;
    const overdueDays = daysBetween(o.expectedReturn, today); // >0 = 逾期
    const overdue = !completed && overdueDays > 0;
    const yieldRate = o.qtyReturned > 0
      ? ((o.qtyReturned - o.qtyScrap) / o.qtyReturned) * 100
      : 100;
    const progress = o.qtyOut > 0 ? (o.qtyReturned / o.qtyOut) * 100 : 0;
    return { o, inTransit, completed, overdue, overdueDays, yieldRate, progress };
  }).sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.overdueDays - a.overdueDays;
  });

  const active = rows.filter((r) => !r.completed);
  const overdue = rows.filter((r) => r.overdue);
  const totalInTransit = rows.reduce((s, r) => s + r.inTransit, 0);
  const totalReturned = rows.reduce((s, r) => s + r.o.qtyReturned, 0);
  const totalScrap = rows.reduce((s, r) => s + r.o.qtyScrap, 0);
  const avgYield = totalReturned > 0 ? ((totalReturned - totalScrap) / totalReturned) * 100 : 100;

  // 依製程分組
  const byProcess = new Map<OutsourceProcess, { count: number; inTransit: number; vendors: Set<string> }>();
  for (const r of rows) {
    const ex = byProcess.get(r.o.process) ?? { count: 0, inTransit: 0, vendors: new Set() };
    ex.count += 1;
    ex.inTransit += r.inTransit;
    ex.vendors.add(r.o.vendor);
    byProcess.set(r.o.process, ex);
  }

  // 依廠商統計良率
  const byVendor = new Map<string, { out: number; returned: number; scrap: number }>();
  for (const r of rows) {
    const ex = byVendor.get(r.o.vendor) ?? { out: 0, returned: 0, scrap: 0 };
    ex.out += r.o.qtyOut;
    ex.returned += r.o.qtyReturned;
    ex.scrap += r.o.qtyScrap;
    byVendor.set(r.o.vendor, ex);
  }
  const vendorStats = [...byVendor.entries()]
    .map(([name, v]) => ({
      name, ...v,
      yieldRate: v.returned > 0 ? ((v.returned - v.scrap) / v.returned) * 100 : 100,
    }))
    .sort((a, b) => a.yieldRate - b.yieldRate);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🏭 委外倉管理</h1>
        <p className="text-sm text-slate-500 mt-1">
          電鍍 / 烤漆 / 熱處理 / 外包焊接　·　在外數量 / 加工進度 / 委外良率 / 逾期預警
        </p>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="在外加工單" value={`${active.length}`} sub={`共 ${rows.length} 單`} tone="cyan" />
        <Kpi label="在外總數量" value={totalInTransit.toLocaleString()} sub="未回廠" tone="amber" />
        <Kpi label="逾期單數" value={`${overdue.length}`} sub="超過預計回廠日" tone={overdue.length > 0 ? "rose" : "emerald"} />
        <Kpi label="平均委外良率" value={`${avgYield.toFixed(1)}%`} sub={`報廢/驗退 ${totalScrap}`} tone={avgYield >= 98 ? "emerald" : "amber"} />
      </section>

      {/* 製程分組 */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...byProcess.entries()].map(([proc, v]) => (
          <div key={proc} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl">{PROCESS_ICON[proc]}</div>
            <div className="font-bold text-sm mt-1">{proc}</div>
            <div className="text-xs text-slate-500 mt-0.5">{v.count} 單 · {v.vendors.size} 家廠商</div>
            <div className="text-lg font-bold tabular-nums mt-1">{v.inTransit.toLocaleString()} <span className="text-xs text-slate-500">在外</span></div>
          </div>
        ))}
      </section>

      {/* 逾期預警 */}
      {overdue.length > 0 && (
        <section className="rounded-xl border-2 border-rose-300 bg-rose-50 p-5">
          <h2 className="font-bold text-rose-900 mb-3">🚨 委外逾期預警（{overdue.length} 單）</h2>
          <ul className="space-y-2">
            {overdue.map((r) => (
              <li key={r.o.id} className="bg-white rounded-lg p-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div>
                  <span className="font-mono text-rose-700 font-bold">{r.o.orderNo}</span>
                  <span className="ml-2">{PROCESS_ICON[r.o.process]} {r.o.process}</span>
                  <span className="ml-2 text-slate-600">{r.o.vendor}</span>
                  <span className="ml-2 font-mono text-xs text-slate-500">{r.o.partCode}</span>
                  <span className="ml-1">{r.o.partName}</span>
                </div>
                <div className="text-rose-700 font-bold">
                  逾期 {r.overdueDays} 天　·　在外 {r.inTransit} {`(預計回廠 ${r.o.expectedReturn})`}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 委外工單表 */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="font-bold">委外加工單明細</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">加工單號</th>
              <th className="text-left px-3 py-2">製程 / 廠商</th>
              <th className="text-left px-3 py-2">料件</th>
              <th className="text-right px-3 py-2">送出 / 已回</th>
              <th className="text-right px-3 py-2">在外</th>
              <th className="text-left px-3 py-2">加工進度</th>
              <th className="text-right px-3 py-2">良率</th>
              <th className="text-left px-3 py-2">預計回廠</th>
              <th className="text-left px-3 py-2">狀態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.o.id} className={`border-t border-slate-100 ${r.overdue ? "bg-rose-50/50" : ""}`}>
                <td className="px-3 py-2.5 font-mono text-xs text-cyan-700">{r.o.orderNo}</td>
                <td className="px-3 py-2.5">
                  <div>{PROCESS_ICON[r.o.process]} {r.o.process}</div>
                  <div className="text-xs text-slate-500">{r.o.vendor}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="font-mono text-xs text-slate-500">{r.o.partCode}</div>
                  <div>{r.o.partName}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.o.qtyOut} / {r.o.qtyReturned}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums font-bold ${r.inTransit > 0 ? "text-amber-700" : "text-slate-400"}`}>
                  {r.inTransit || "—"}
                </td>
                <td className="px-3 py-2.5 w-32">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-slate-500">{Math.round(r.progress)}%</span>
                  </div>
                </td>
                <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${
                  r.yieldRate >= 98 ? "text-emerald-600" : r.yieldRate >= 95 ? "text-amber-600" : "text-rose-600"
                }`}>
                  {r.o.qtyReturned > 0 ? `${r.yieldRate.toFixed(1)}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{r.o.expectedReturn}</td>
                <td className="px-3 py-2.5">
                  {r.completed ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">完成</span>
                    : r.overdue ? <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">逾期 {r.overdueDays}d</span>
                    : <span className="text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-700">加工中</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 廠商良率排行 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">委外廠商良率排行（低 → 高）</h2>
        <div className="space-y-2">
          {vendorStats.map((v) => (
            <div key={v.name} className="flex items-center gap-3">
              <div className="w-28 text-sm font-semibold text-right shrink-0">{v.name}</div>
              <div className="flex-1 h-6 bg-slate-50 rounded overflow-hidden relative">
                <div className={`h-full ${v.yieldRate >= 98 ? "bg-emerald-500" : v.yieldRate >= 95 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${v.yieldRate}%` }} />
                <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold">
                  {v.yieldRate.toFixed(1)}%　·　送 {v.out} / 回 {v.returned} / 報廢 {v.scrap}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          委外良率 = (已回 − 報廢/驗退) / 已回。低於 95% 標紅，應檢討委外廠商品質。
        </p>
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3">
        <b>📌 資料來源</b>：目前為 demo seed，正式接鼎新 <b>MOCR14 託外進貨明細表</b> 後即為即時資料。
        若委外不管理，<Link href="/erp/import" className="text-cyan-700 hover:underline">在外數量會與帳面失真</Link>。
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "cyan" | "amber" | "rose" | "emerald" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
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
