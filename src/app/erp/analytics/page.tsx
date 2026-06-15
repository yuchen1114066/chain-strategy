import Link from "next/link";
import { parts, models, suppliers, bom } from "@/lib/erp/seed";

// 共用零件分析：每個零件被多少個 model 用 + 總用量
type SharedPartStat = {
  partId: string;
  partCode: string;
  partName: string;
  category: string;
  unit: string;
  supplierName: string;
  stockOnHand: number;
  unitCost: number;
  stockValue: number;
  modelsUsingCount: number;
  modelsUsing: { code: string; name: string; qtyPer: number }[];
  totalQtyPerUnit: number; // 加總所有 model 的單台用量（不論機型）
};

export default function AnalyticsPage() {
  // ====== 計算 ======
  const partUsage = new Map<string, SharedPartStat>();
  for (const p of parts) {
    const sup = suppliers.find((s) => s.id === p.supplierId);
    partUsage.set(p.id, {
      partId: p.id,
      partCode: p.code,
      partName: p.name,
      category: p.category,
      unit: p.unit,
      supplierName: sup?.name ?? "—",
      stockOnHand: p.stockOnHand,
      unitCost: p.unitCost,
      stockValue: p.stockOnHand * p.unitCost,
      modelsUsingCount: 0,
      modelsUsing: [],
      totalQtyPerUnit: 0,
    });
  }
  for (const b of bom) {
    if (!b.isActive) continue;
    const stat = partUsage.get(b.partId);
    const model = models.find((m) => m.id === b.modelId);
    if (!stat || !model) continue;
    stat.modelsUsing.push({ code: model.code, name: model.name, qtyPer: b.qtyPerUnit });
    stat.modelsUsingCount += 1;
    stat.totalQtyPerUnit += b.qtyPerUnit;
  }
  const partStats = [...partUsage.values()];

  // KPI 總覽
  const totalModels = models.length;
  const totalParts = parts.length;
  const totalSuppliers = suppliers.length;
  const totalStockUnits = parts.reduce((s, p) => s + p.stockOnHand, 0);
  const totalStockValue = parts.reduce((s, p) => s + p.stockOnHand * p.unitCost, 0);
  const totalCategories = new Set(parts.map((p) => p.category)).size;
  const totalMachineFamilies = new Set(models.map((m) => m.machineFamily)).size;

  // 共用 vs 獨用
  const sharedParts = partStats.filter((s) => s.modelsUsingCount >= 2);
  const exclusiveParts = partStats.filter((s) => s.modelsUsingCount === 1);
  const unusedParts = partStats.filter((s) => s.modelsUsingCount === 0);
  const topShared = [...partStats]
    .filter((s) => s.modelsUsingCount > 0)
    .sort((a, b) => b.modelsUsingCount - a.modelsUsingCount)
    .slice(0, 10);

  // 分類統計
  const byCategory = new Map<string, { count: number; stockValue: number; stockUnits: number }>();
  for (const p of parts) {
    const c = p.category;
    const ex = byCategory.get(c) ?? { count: 0, stockValue: 0, stockUnits: 0 };
    ex.count += 1;
    ex.stockValue += p.stockOnHand * p.unitCost;
    ex.stockUnits += p.stockOnHand;
    byCategory.set(c, ex);
  }
  const categoryList = [...byCategory.entries()]
    .map(([cat, v]) => ({ cat, ...v }))
    .sort((a, b) => b.stockValue - a.stockValue);

  // 機型統計
  const byFamily = new Map<string, { count: number; modelCodes: string[] }>();
  for (const m of models) {
    const f = m.machineFamily;
    const ex = byFamily.get(f) ?? { count: 0, modelCodes: [] };
    ex.count += 1;
    ex.modelCodes.push(m.code);
    byFamily.set(f, ex);
  }
  const familyList = [...byFamily.entries()].map(([fam, v]) => ({ fam, ...v }));

  // 供應商統計
  const bySupplier = new Map<string, { partCount: number; stockValue: number }>();
  for (const p of parts) {
    const sup = suppliers.find((s) => s.id === p.supplierId);
    const name = sup?.name ?? "—";
    const ex = bySupplier.get(name) ?? { partCount: 0, stockValue: 0 };
    ex.partCount += 1;
    ex.stockValue += p.stockOnHand * p.unitCost;
    bySupplier.set(name, ex);
  }
  const supplierList = [...bySupplier.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.stockValue - a.stockValue);

  // Pareto: 庫存金額 ABC 分析
  const byValue = [...partStats].sort((a, b) => b.stockValue - a.stockValue);
  const pareto = byValue.reduce<{ list: (SharedPartStat & { cumPct: number })[]; cum: number }>(
    (acc, s) => {
      const cum = acc.cum + s.stockValue;
      acc.list.push({ ...s, cumPct: totalStockValue > 0 ? (cum / totalStockValue) * 100 : 0 });
      return { list: acc.list, cum };
    },
    { list: [], cum: 0 }
  ).list;
  const classA = pareto.filter((p) => p.cumPct <= 80);
  const classB = pareto.filter((p) => p.cumPct > 80 && p.cumPct <= 95);
  const classC = pareto.filter((p) => p.cumPct > 95);

  // 風險零件：只被 1 個成品用 + 庫存 < 安全庫存
  const riskParts = exclusiveParts.filter((s) => {
    const p = parts.find((x) => x.id === s.partId);
    return p && p.stockOnHand < p.safetyStock;
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📊 零件分析</h1>
        <p className="text-sm text-slate-500 mt-1">
          共用零件 / 種類分布 / 機型統計 / 庫存價值 / 風險料件一站式洞察
        </p>
      </header>

      {/* ============ 總覽 KPI ============ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="機型" value={totalMachineFamilies.toString()} sub="種類" />
        <Kpi label="成品品號" value={totalModels.toString()} sub="個" tone="cyan" />
        <Kpi label="零件種類" value={totalCategories.toString()} sub={`${totalParts} 個料件`} tone="cyan" />
        <Kpi label="供應商" value={totalSuppliers.toString()} sub="家" />
        <Kpi label="總庫存件數" value={totalStockUnits.toLocaleString()} sub="件" />
        <Kpi label="總庫存價值" value={`$${(totalStockValue / 10000).toFixed(0)}萬`} sub={`$${totalStockValue.toLocaleString()}`} tone="emerald" />
      </section>

      {/* ============ 共用 vs 獨用 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold">🔄 零件共用程度</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              共用件越多 → 庫存槓桿越好 / 單一斷貨影響面也越大
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <SplitCard label="共用零件" value={sharedParts.length} pct={Math.round((sharedParts.length / totalParts) * 100)} total={totalParts} tone="cyan" hint="被 ≥ 2 個成品使用" />
          <SplitCard label="獨用零件" value={exclusiveParts.length} pct={Math.round((exclusiveParts.length / totalParts) * 100)} total={totalParts} tone="amber" hint="只被 1 個成品使用" />
          <SplitCard label="未使用零件" value={unusedParts.length} pct={Math.round((unusedParts.length / totalParts) * 100)} total={totalParts} tone="slate" hint="尚未掛 BOM" />
        </div>

        <h3 className="font-bold text-sm mb-2">🏆 共用程度 Top 10</h3>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">料號 / 名稱</th>
              <th className="text-left px-3 py-2">分類</th>
              <th className="text-right px-3 py-2">被幾個成品用</th>
              <th className="text-left px-3 py-2">使用此料的成品</th>
              <th className="text-right px-3 py-2">在庫</th>
              <th className="text-right px-3 py-2">在庫值</th>
            </tr>
          </thead>
          <tbody>
            {topShared.map((s) => (
              <tr key={s.partId} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <div className="font-mono text-xs text-slate-500">{s.partCode}</div>
                  <div>{s.partName}</div>
                </td>
                <td className="px-3 py-2 text-slate-600">{s.category}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    s.modelsUsingCount >= 4 ? "bg-cyan-500 text-white" :
                    s.modelsUsingCount >= 2 ? "bg-cyan-100 text-cyan-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{s.modelsUsingCount}</span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600 max-w-[280px]">
                  {s.modelsUsing.slice(0, 3).map((m) => m.code).join(" / ")}
                  {s.modelsUsing.length > 3 && <span className="text-slate-400"> +{s.modelsUsing.length - 3}</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{s.stockOnHand} {s.unit}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">${s.stockValue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ============ 分類 + 機型 ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分類分布 */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">📂 零件種類分布</h2>
          <div className="space-y-2">
            {categoryList.map((c) => {
              const pct = totalStockValue > 0 ? (c.stockValue / totalStockValue) * 100 : 0;
              return (
                <div key={c.cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold">{c.cat}</span>
                    <span className="text-slate-500 tabular-nums">
                      {c.count} 項 · {c.stockUnits.toLocaleString()} 件 · <b className="text-slate-900">${c.stockValue.toLocaleString()}</b>
                    </span>
                  </div>
                  <div className="h-4 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 機型統計 */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">🏗️ 機型 / 系列</h2>
          {familyList.length === 0 ? (
            <p className="text-xs text-slate-500">尚無資料</p>
          ) : (
            <ul className="space-y-2">
              {familyList.map((f) => (
                <li key={f.fam} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{f.fam}</span>
                    <span className="text-xs text-slate-500">{f.count} 個品號</span>
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-1">
                    {f.modelCodes.slice(0, 5).join(" · ")}
                    {f.modelCodes.length > 5 && <span className="text-slate-400"> +{f.modelCodes.length - 5}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ============ Pareto 庫存金額 ABC ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">💰 庫存金額 Pareto（ABC 分析）</h2>
        <p className="text-xs text-slate-500 mb-4">
          A 類佔金額 80% 但只是少數料件 — 應重點管理；C 類料件多但金額小，可粗管。
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Kpi
            label="A 類（佔 80%）"
            value={`${classA.length} 項`}
            sub={`$${classA.reduce((s, x) => s + x.stockValue, 0).toLocaleString()}`}
            tone="rose"
          />
          <Kpi
            label="B 類（80~95%）"
            value={`${classB.length} 項`}
            sub={`$${classB.reduce((s, x) => s + x.stockValue, 0).toLocaleString()}`}
            tone="amber"
          />
          <Kpi
            label="C 類（95~100%）"
            value={`${classC.length} 項`}
            sub={`$${classC.reduce((s, x) => s + x.stockValue, 0).toLocaleString()}`}
            tone="slate"
          />
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">類</th>
              <th className="text-left px-3 py-2">料號 / 名稱</th>
              <th className="text-right px-3 py-2">在庫</th>
              <th className="text-right px-3 py-2">單價</th>
              <th className="text-right px-3 py-2">在庫值</th>
              <th className="text-right px-3 py-2">累積 %</th>
            </tr>
          </thead>
          <tbody>
            {pareto.slice(0, 15).map((p) => {
              const cls = p.cumPct <= 80 ? "A" : p.cumPct <= 95 ? "B" : "C";
              return (
                <tr key={p.partId} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      cls === "A" ? "bg-rose-100 text-rose-700" :
                      cls === "B" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{cls}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-slate-500">{p.partCode}</div>
                    <div>{p.partName}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.stockOnHand}</td>
                  <td className="px-3 py-2 text-right tabular-nums">${p.unitCost.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">${p.stockValue.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">{p.cumPct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pareto.length > 15 && (
          <p className="text-[11px] text-slate-400 mt-2">… 後續 {pareto.length - 15} 項省略</p>
        )}
      </section>

      {/* ============ 供應商集中度 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">🏭 供應商集中度（按庫存價值）</h2>
        <p className="text-xs text-slate-500 mb-3">
          集中度高的供應商：斷供影響金額大，應簽 SLA / 找備援
        </p>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">供應商</th>
              <th className="text-right px-3 py-2">供應料項</th>
              <th className="text-right px-3 py-2">庫存值</th>
              <th className="text-right px-3 py-2">% 總庫存</th>
            </tr>
          </thead>
          <tbody>
            {supplierList.slice(0, 10).map((s) => {
              const pct = totalStockValue > 0 ? (s.stockValue / totalStockValue) * 100 : 0;
              return (
                <tr key={s.name} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-semibold">{s.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.partCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">${s.stockValue.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className={pct > 20 ? "text-rose-600 font-bold" : ""}>{pct.toFixed(1)}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ============ 風險料件 ============ */}
      {riskParts.length > 0 && (
        <section className="bg-rose-50 rounded-xl border-2 border-rose-200 p-5">
          <h2 className="font-bold text-rose-900 mb-3">
            ⚠️ 高風險料件（獨用 + 庫存不足）
          </h2>
          <p className="text-xs text-rose-800 mb-3">
            只被 1 個成品使用 + 庫存低於安全庫存 → 此料一斷直接拖累該成品。優先處理。
          </p>
          <ul className="space-y-1.5">
            {riskParts.map((s) => (
              <li key={s.partId} className="bg-white rounded p-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-rose-700 font-bold">{s.partCode}</span>
                    <span className="ml-2">{s.partName}</span>
                    <span className="ml-2 text-slate-500">→ 唯獨用於 <Link href={`/erp/models/${s.modelsUsing[0]?.code}`} className="font-mono text-cyan-700 hover:underline">{s.modelsUsing[0]?.code}</Link></span>
                  </div>
                  <span className="text-rose-600 font-bold tabular-nums">
                    庫存 {s.stockOnHand} / 安全 {parts.find((p) => p.id === s.partId)?.safetyStock}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "cyan" | "emerald" | "amber" | "rose" | "slate" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={sub}>{sub}</div>
    </div>
  );
}

function SplitCard({ label, value, pct, total, tone, hint }: { label: string; value: number; pct: number; total: number; tone: "cyan" | "amber" | "slate"; hint: string }) {
  const bg =
    tone === "cyan" ? "bg-cyan-500" :
    tone === "amber" ? "bg-amber-500" :
    "bg-slate-400";
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-2xl font-bold tabular-nums">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-1">
        <div className={`h-full ${bg}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span>{hint}</span>
        <span>{pct}% / {total}</span>
      </div>
    </div>
  );
}
