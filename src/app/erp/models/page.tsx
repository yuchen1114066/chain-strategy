import Link from "next/link";
import { models, parts, suppliers, bom } from "@/lib/erp/seed";

export default function ModelsPage() {
  return (
    <div className="p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold">設備型號 + BOM 連結</h1>
        <p className="text-sm text-slate-500 mt-1">
          這頁就是「成品成本表」與「採購零件表」之間缺失的橋。每個成品品號展開所需零件用量。
        </p>
      </header>

      {/* The bridge concept made explicit */}
      <section className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4">
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="px-3 py-1 rounded bg-white border border-slate-200 font-mono text-xs">
            成品成本分析表
          </span>
          <span className="text-cyan-700 font-bold text-base">→ BOM →</span>
          <span className="px-3 py-1 rounded bg-white border border-slate-200 font-mono text-xs">
            採購零件追蹤表
          </span>
          <span className="text-xs text-slate-500 ml-auto">
            點任一型號 → 看完整零件清單 + 供應商 + 即時庫存
          </span>
        </div>
      </section>

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
                <div className="font-mono text-xs text-slate-500">成品品號</div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {m.machineFamily}
                </span>
              </div>
              <div className="font-mono text-base font-bold text-cyan-700 mt-0.5">{m.code}</div>
              <div className="text-sm font-semibold mt-1">{m.name}</div>
              <div className="text-xs text-slate-600 mt-1 line-clamp-2">{m.description}</div>

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

      <p className="text-xs text-slate-500">
        共 {models.length} 個型號 / {parts.length} 個零件 / {suppliers.length} 家供應商
      </p>
    </div>
  );
}
