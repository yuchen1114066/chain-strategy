import { parts, suppliers } from "@/lib/erp/seed";
import { computePartDemand } from "@/lib/erp/alerts";
import CsvExportButton from "@/components/erp/CsvExportButton";

export default function PartsPage() {
  const demand = computePartDemand();
  const map = new Map(demand.map((d) => [d.part.id, d]));

  const csvRows = parts.map((p) => {
    const d = map.get(p.id);
    const supp = suppliers.find((s) => s.id === p.supplierId);
    return {
      code: p.code, name: p.name, spec: p.spec ?? "", category: p.category,
      unit: p.unit, unitCost: p.unitCost, leadDays: p.leadDays,
      stockOnHand: p.stockOnHand, safetyStock: p.safetyStock,
      kind: p.kind ?? "purchase",
      required: d?.totalRequired ?? 0,
      netBalance: d?.netBalance ?? p.stockOnHand,
      shortage: d?.shortage ?? 0,
      supplier: supp?.name ?? "—",
      supplierCountry: supp?.country ?? "—",
    };
  });

  return (
    <div className="p-6">
      <header className="mb-5 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">零件主檔</h1>
          <p className="text-sm text-slate-500 mt-1">
            需求量 = 所有進行中 / 規劃中工單透過 BOM 展開的總用料
          </p>
        </div>
        <CsvExportButton
          filename={`parts-${new Date().toISOString().slice(0,10)}.csv`}
          rows={csvRows}
          columns={[
            { key: "code", label: "料號" },
            { key: "name", label: "品名" },
            { key: "spec", label: "規格" },
            { key: "category", label: "分類" },
            { key: "unit", label: "單位" },
            { key: "unitCost", label: "單價" },
            { key: "leadDays", label: "交期(天)" },
            { key: "stockOnHand", label: "在庫" },
            { key: "safetyStock", label: "安全庫存" },
            { key: "kind", label: "屬性" },
            { key: "required", label: "本期需求" },
            { key: "netBalance", label: "餘額" },
            { key: "shortage", label: "缺額" },
            { key: "supplier", label: "供應商" },
            { key: "supplierCountry", label: "國家" },
          ]}
        />
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
