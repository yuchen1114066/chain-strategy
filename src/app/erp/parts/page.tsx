import { parts, suppliers } from "@/lib/erp/seed";
import { computePartDemand } from "@/lib/erp/alerts";

export default function PartsPage() {
  const demand = computePartDemand();
  const map = new Map(demand.map((d) => [d.part.id, d]));

  return (
    <div className="p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">零件主檔</h1>
        <p className="text-sm text-slate-500 mt-1">
          需求量 = 所有進行中 / 規劃中工單透過 BOM 展開的總用料
        </p>
      </header>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">料號</th>
              <th className="text-left px-4 py-2.5 font-semibold">名稱</th>
              <th className="text-left px-4 py-2.5 font-semibold">分類</th>
              <th className="text-right px-4 py-2.5 font-semibold">單價</th>
              <th className="text-right px-4 py-2.5 font-semibold">交期</th>
              <th className="text-right px-4 py-2.5 font-semibold">庫存</th>
              <th className="text-right px-4 py-2.5 font-semibold">需求</th>
              <th className="text-right px-4 py-2.5 font-semibold">淨缺</th>
              <th className="text-left px-4 py-2.5 font-semibold">供應商</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => {
              const d = map.get(p.id);
              const supp = suppliers.find((s) => s.id === p.supplierId);
              const lowStock = p.stockOnHand < p.safetyStock;
              const shortage = d && d.shortage > 0;
              return (
                <tr key={p.id} className={`border-t border-slate-100 ${shortage ? "bg-rose-50" : ""}`}>
                  <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-slate-600 text-xs">{p.category}</td>
                  <td className="px-4 py-2 text-right tabular-nums">${p.unitCost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{p.leadDays}d</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${lowStock ? "text-rose-600 font-bold" : ""}`}>
                    {p.stockOnHand}{lowStock && " ⚠"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{d?.totalRequired ?? 0}</td>
                  <td className={`px-4 py-2 text-right tabular-nums font-bold ${shortage ? "text-rose-600" : "text-emerald-600"}`}>
                    {d ? (d.netBalance >= 0 ? `+${d.netBalance}` : d.netBalance) : "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600">{supp?.name}<br /><span className="text-[10px] text-slate-400">{supp?.country} · {supp?.transitDays}d 運送</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
