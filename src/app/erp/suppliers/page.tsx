import { suppliers, parts } from "@/lib/erp/seed";
import CsvExportButton from "@/components/erp/CsvExportButton";
import SupplierScorecard from "./SupplierScorecard";

export default function SuppliersPage() {
  const csvRows = suppliers.map((s) => {
    const supplied = parts.filter((p) => p.supplierId === s.id);
    return {
      code: s.code, name: s.name, country: s.country, city: s.city,
      transitDays: s.transitDays, contact: s.contact,
      partCount: supplied.length,
      stockValue: supplied.reduce((sum, p) => sum + p.unitCost * p.stockOnHand, 0),
      supplied: supplied.map((p) => p.code).join("、"),
    };
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">供應商 · Supplier Master</h1>
          <p className="text-sm text-slate-500 mt-1">
            工廠位置 → 平均運送天數 → 影響到廠日 → 影響上線排程
          </p>
        </div>
        <CsvExportButton
          filename={`suppliers-${new Date().toISOString().slice(0,10)}.csv`}
          rows={csvRows}
          columns={[
            { key: "code", label: "代碼" },
            { key: "name", label: "供應商" },
            { key: "country", label: "國家" },
            { key: "city", label: "城市" },
            { key: "transitDays", label: "運送(天)" },
            { key: "contact", label: "聯絡" },
            { key: "partCount", label: "供應料項" },
            { key: "stockValue", label: "在庫值" },
            { key: "supplied", label: "供應料號" },
          ]}
        />
      </header>

      {/* 年度供應商考核 — 真實 IndexedDB 計算 */}
      <SupplierScorecard />

      {/* 既有：供應商主檔卡片網格（mock seed 資料） */}
      <section>
        <h2 className="text-lg font-bold mb-3 text-slate-700">📇 廠商主檔（示範資料）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => {
            const supplied = parts.filter((p) => p.supplierId === s.id);
            const totalValue = supplied.reduce((sum, p) => sum + p.unitCost * p.stockOnHand, 0);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-slate-500">{s.code}</div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {s.country}
                  </span>
                </div>
                <div className="mt-1 text-lg font-bold">{s.name}</div>
                <div className="text-sm text-slate-600 mt-0.5">{s.city}　·　{s.contact}</div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-slate-500">運送天數</div>
                    <div className="font-bold tabular-nums">{s.transitDays}d</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">供應料件</div>
                    <div className="font-bold tabular-nums">{supplied.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">在庫值</div>
                    <div className="font-bold tabular-nums">${(totalValue / 1000).toFixed(0)}k</div>
                  </div>
                </div>

                <ul className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-0.5">
                  {supplied.slice(0, 4).map((p) => (
                    <li key={p.id} className="font-mono">· {p.code} {p.name}</li>
                  ))}
                  {supplied.length > 4 && <li className="text-slate-400">… 等 {supplied.length} 項</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
