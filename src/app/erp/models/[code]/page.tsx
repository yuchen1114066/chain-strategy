import Link from "next/link";
import { notFound } from "next/navigation";
import { models, parts, suppliers, bom, workOrders } from "@/lib/erp/seed";

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const model = models.find((m) => m.code === code);
  if (!model) notFound();

  const lines = bom.filter((b) => b.modelId === model.id && b.isActive);
  const totalCost = lines.reduce((sum, l) => {
    const p = parts.find((p) => p.id === l.partId);
    return sum + (p ? p.unitCost * l.qtyPerUnit : 0);
  }, 0);
  const wos = workOrders.filter((w) => w.modelId === model.id);
  const longestLead = lines.reduce((max, l) => {
    const p = parts.find((p) => p.id === l.partId);
    return p && p.leadDays > max ? p.leadDays : max;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <Link href="/erp/models" className="text-xs text-cyan-700 hover:underline">← 返回型號列表</Link>

      <header className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="font-mono text-xs text-slate-500">{model.code}</div>
        <h1 className="text-2xl font-bold">{model.name}</h1>
        <p className="text-sm text-slate-600 mt-1">{model.description}</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="BOM 零件數" value={String(lines.length)} />
          <Stat label="標準成本" value={`$${totalCost.toLocaleString()}`} />
          <Stat label="售價" value={`$${model.stdPrice.toLocaleString()}`} />
          <Stat label="關鍵交期" value={`${longestLead} 天`} hint="最長備料日" />
        </div>
      </header>

      {/* BOM */}
      <section className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold">BOM 用料表（v1）</h2>
          <span className="text-xs text-slate-500">每生產 1 台 {model.code}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2 font-semibold">料號</th>
              <th className="text-left px-4 py-2 font-semibold">名稱</th>
              <th className="text-left px-4 py-2 font-semibold">分類</th>
              <th className="text-right px-4 py-2 font-semibold">用量</th>
              <th className="text-right px-4 py-2 font-semibold">單價</th>
              <th className="text-right px-4 py-2 font-semibold">小計</th>
              <th className="text-left px-4 py-2 font-semibold">供應商</th>
              <th className="text-right px-4 py-2 font-semibold">交期</th>
              <th className="text-right px-4 py-2 font-semibold">庫存</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const p = parts.find((p) => p.id === l.partId);
              if (!p) return null;
              const sup = suppliers.find((s) => s.id === p.supplierId);
              const sub = p.unitCost * l.qtyPerUnit;
              const lowStock = p.stockOnHand < p.safetyStock;
              return (
                <tr key={l.partId} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-slate-600">{p.category}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{l.qtyPerUnit} {p.unit}</td>
                  <td className="px-4 py-2 text-right tabular-nums">${p.unitCost.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">${sub.toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{sup?.name}（{sup?.country}）</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{p.leadDays}d</td>
                  <td className={`px-4 py-2 text-right tabular-nums ${lowStock ? "text-rose-600 font-bold" : ""}`}>
                    {p.stockOnHand}{lowStock && " ⚠"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right font-semibold">合計成本</td>
              <td className="px-4 py-2 text-right tabular-nums font-bold">${totalCost.toLocaleString()}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Related WOs */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">使用此型號的工單</h2>
        {wos.length === 0 ? (
          <p className="text-sm text-slate-500">目前無進行中工單</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {wos.map((w) => (
              <li key={w.id}>
                <Link href={`/erp/work-orders/${w.id}`} className="font-mono text-cyan-700 hover:underline">
                  {w.woNo}
                </Link>
                <span className="text-slate-600"> × {w.qty} ── {w.customer}　·　船期 {w.shipDate}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-lg tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}
