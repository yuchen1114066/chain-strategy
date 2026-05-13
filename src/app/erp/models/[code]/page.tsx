import Link from "next/link";
import { notFound } from "next/navigation";
import { models, parts, suppliers, bom, workOrders } from "@/lib/erp/seed";
import { buildBomTree, rolledUpCostFor, type BomNode } from "@/lib/erp/bom-tree";
import type { PartKind } from "@/lib/erp/types";

const KIND_LABEL: Record<PartKind, string> = {
  purchase: "採購", self: "自製", dummy: "虛設", feature: "Feature", outsource: "託外", option: "Option",
};
const KIND_TONE: Record<PartKind, string> = {
  purchase: "bg-slate-100 text-slate-700",
  self: "bg-rose-100 text-rose-700",
  dummy: "bg-amber-100 text-amber-700",
  feature: "bg-violet-100 text-violet-700",
  outsource: "bg-cyan-100 text-cyan-700",
  option: "bg-emerald-100 text-emerald-700",
};

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const model = models.find((m) => m.code === code);
  if (!model) notFound();

  const lines = bom.filter((b) => b.modelId === model.id && b.isActive);
  const tree = buildBomTree(model.id);
  const rolledUpTotal = rolledUpCostFor(model.id);
  const flatMaterialCost = lines.reduce((sum, l) => {
    const p = parts.find((p) => p.id === l.partId);
    return sum + (p ? p.unitCost * l.qtyPerUnit : 0);
  }, 0);
  const wos = workOrders.filter((w) => w.modelId === model.id);
  const longestLead = lines.reduce((max, l) => {
    const p = parts.find((p) => p.id === l.partId);
    return p && p.leadDays > max ? p.leadDays : max;
  }, 0);
  const distinctSuppliers = new Set(
    lines.map((l) => parts.find((p) => p.id === l.partId)?.supplierId).filter(Boolean)
  ).size;

  return (
    <div className="p-6 space-y-6">
      <Link href="/erp/models" className="text-xs text-cyan-700 hover:underline">← 返回型號列表</Link>

      <header className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-slate-500">成品品號</div>
            <div className="font-mono text-2xl font-bold text-cyan-700">{model.code}</div>
            <div className="text-xs text-slate-500 mt-2">機種</div>
            <div className="text-base font-semibold">{model.machineFamily}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">商品說明</div>
            <div className="font-medium">{model.name}</div>
            <p className="text-sm text-slate-600 mt-1 max-w-md">{model.description}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <Stat label="BOM 線數" value={String(lines.length)} hint={`${tree.length} 個 Level 1`} />
          <Stat label="rollup 成本" value={`$${rolledUpTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="含半成品內部成本" />
          <Stat label="售價" value={`$${model.stdPrice.toLocaleString()}`} />
          <Stat label="關鍵交期" value={`${longestLead} 天`} hint="最長備料日" />
          <Stat label="供應商數" value={`${distinctSuppliers} 家`} />
        </div>
      </header>

      {/* BOM bridge banner */}
      <section className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 text-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs px-2 py-1 rounded bg-white border">{model.code}</span>
          <span className="text-cyan-700 font-bold">→ 透過 BOM 多階展開 →</span>
          <span className="font-mono text-xs px-2 py-1 rounded bg-white border">{lines.length} 條 BOM 線</span>
          <span className="text-cyan-700 font-bold">→ 對應 →</span>
          <span className="font-mono text-xs px-2 py-1 rounded bg-white border">{distinctSuppliers} 家供應商</span>
        </div>
      </section>

      {/* BOM 樹狀展開（多階） */}
      <section className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold">🌲 BOM 樹狀展開（多階）</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              縮排顯示父子關係　·　rollup 成本含半成品內部展開　·　顏色標屬性
            </p>
          </div>
          <span className="text-xs text-slate-500">
            扁平成本 ${flatMaterialCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} → rollup 成本 <b className="text-slate-900">${rolledUpTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-semibold min-w-[320px]">階 · 料號 · 名稱</th>
                <th className="text-left px-2 py-2 font-semibold">屬性</th>
                <th className="text-right px-3 py-2 font-semibold">用量</th>
                <th className="text-left px-2 py-2 font-semibold">單位</th>
                <th className="text-right px-3 py-2 font-semibold">單價</th>
                <th className="text-right px-3 py-2 font-semibold">本層小計</th>
                <th className="text-right px-3 py-2 font-semibold">Rollup</th>
                <th className="text-left px-3 py-2 font-semibold">供應商</th>
                <th className="text-right px-3 py-2 font-semibold">在庫</th>
              </tr>
            </thead>
            <tbody>
              {tree.flatMap((n) => renderRows(n, 0))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={6} className="px-4 py-2 text-right font-semibold">合計（rollup 含半成品內部）</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">
                  ${rolledUpTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
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

// 遞迴渲染 BOM 樹節點
function renderRows(node: BomNode, depth: number): React.ReactElement[] {
  const p = node.part;
  const sup = suppliers.find((s) => s.id === p.supplierId);
  const lowStock = p.stockOnHand < p.safetyStock && p.kind === "purchase";
  const isContainer = node.children.length > 0;
  const rows: React.ReactElement[] = [
    <tr key={`${p.id}-${depth}-${node.bomLine.parentPartCode ?? "root"}`} className={`border-t border-slate-100 ${isContainer ? "bg-slate-50/50 font-medium" : ""}`}>
      <td className="px-4 py-2" style={{ paddingLeft: `${depth * 20 + 16}px` }}>
        <span className="text-slate-400 mr-1.5 font-mono text-[10px]">
          {isContainer ? "▾" : "·"} {".".repeat(depth)}{depth + 1}
        </span>
        <span className="font-mono text-xs text-cyan-700">{p.code}</span>
        <span className="ml-2 text-slate-700">{p.name}</span>
        {p.spec && <div className="text-[10px] text-slate-500 ml-9 mt-0.5">{p.spec}</div>}
      </td>
      <td className="px-2 py-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_TONE[p.kind ?? "purchase"]}`}>
          {KIND_LABEL[p.kind ?? "purchase"]}
        </span>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{formatQty(node.bomLine.qtyPerUnit)}</td>
      <td className="px-2 py-2 text-xs text-slate-600">{p.unit}</td>
      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
        {p.unitCost > 0 ? `$${p.unitCost.toLocaleString()}` : "—"}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        {node.ownCost > 0 ? `$${node.ownCost.toFixed(2)}` : "—"}
      </td>
      <td className="px-3 py-2 text-right tabular-nums font-semibold">
        ${node.rolledUpCost.toFixed(2)}
      </td>
      <td className="px-3 py-2 text-xs text-slate-600">
        {sup?.name ?? (p.kind === "self" || p.kind === "dummy" ? <span className="text-slate-400">內部</span> : "—")}
      </td>
      <td className={`px-3 py-2 text-right tabular-nums text-xs ${lowStock ? "text-rose-600 font-bold" : "text-slate-600"}`}>
        {p.stockOnHand > 0 ? `${p.stockOnHand}` : "—"}{lowStock && " ⚠"}
      </td>
    </tr>,
  ];
  for (const child of node.children) {
    rows.push(...renderRows(child, depth + 1));
  }
  return rows;
}

function formatQty(q: number): string {
  if (q >= 1) return q % 1 === 0 ? q.toString() : q.toFixed(2);
  return q.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
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
