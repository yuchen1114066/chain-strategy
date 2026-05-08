import Link from "next/link";
import { models, parts, suppliers, bom } from "@/lib/erp/seed";

export default function ModelsPage() {
  return (
    <div className="p-6">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">設備型號 + BOM</h1>
        <p className="text-sm text-slate-500 mt-1">
          每個型號展開所需零件用量，BOM 是「成品金額表」與「零件表」之間的關鍵連結。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => {
          const lines = bom.filter((b) => b.modelId === m.id && b.isActive);
          const cost = lines.reduce((sum, l) => {
            const p = parts.find((p) => p.id === l.partId);
            return sum + (p ? p.unitCost * l.qtyPerUnit : 0);
          }, 0);
          const margin = m.stdPrice - cost;
          const marginPct = m.stdPrice > 0 ? ((margin / m.stdPrice) * 100).toFixed(1) : "—";
          return (
            <Link
              key={m.id}
              href={`/erp/models/${m.code}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-cyan-400 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs text-slate-500">{m.code}</div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {m.category}
                </span>
              </div>
              <div className="mt-1 text-lg font-bold">{m.name}</div>
              <div className="text-sm text-slate-600 mt-1">{m.description}</div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-500">BOM 零件</div>
                  <div className="font-bold tabular-nums">{lines.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">標準成本</div>
                  <div className="font-bold tabular-nums">${cost.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">毛利率</div>
                  <div className={`font-bold tabular-nums ${margin > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {marginPct}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                售價 ${m.stdPrice.toLocaleString()}　·　涉及 {new Set(lines.map((l) => parts.find((p) => p.id === l.partId)?.supplierId).filter(Boolean)).size} 家供應商
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-slate-500">
        共 {models.length} 個型號 / {parts.length} 個零件 / {suppliers.length} 家供應商
      </p>
    </div>
  );
}
