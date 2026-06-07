import Link from "next/link";
import { notFound } from "next/navigation";
import { workOrders, models, parts, suppliers, bom, today, currentStageLabel } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import StageBar from "@/components/erp/StageBar";
import AlertList from "@/components/erp/AlertList";
import { STAGES } from "@/lib/erp/types";

function daysUntil(iso: string): number {
  const ms = new Date(iso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime();
  return Math.round(ms / 86_400_000);
}

const statusTone: Record<string, string> = {
  "已簽收": "bg-emerald-100 text-emerald-700",
  "生產中": "bg-cyan-100 text-cyan-700",
  "待料":   "bg-amber-100 text-amber-800",
  "規劃中": "bg-slate-100 text-slate-600",
  "待開工": "bg-slate-100 text-slate-600",
};

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wo = workOrders.find((w) => w.id === id);
  if (!wo) notFound();
  const model = models.find((m) => m.id === wo.modelId)!;

  const lines = bom.filter((b) => b.modelId === wo.modelId && b.isActive);
  const allAlerts = computeAlerts().filter((a) => a.woId === wo.id);

  const bomNeeds = lines.map((l) => {
    const p = parts.find((p) => p.id === l.partId)!;
    const sup = suppliers.find((s) => s.id === p.supplierId);
    const need = l.qtyPerUnit * wo.qty;
    const balance = p.stockOnHand - need;
    const shortage = balance < 0 ? -balance : 0;
    return { part: p, supplier: sup, qtyPerUnit: l.qtyPerUnit, need, balance, shortage };
  });
  const totalCost = bomNeeds.reduce((s, n) => s + n.part.unitCost * n.need, 0);

  const dleft = daysUntil(wo.shipDate);
  const stageDoneCount = wo.stages.filter((s) => s.status === "done").length;
  const sl = wo.statusLabel ?? wo.status;

  return (
    <div className="p-6 space-y-6">
      <Link href="/erp/work-orders" className="text-xs text-cyan-700 hover:underline">← 返回工單列表</Link>

      {/* Header — fields aligned with iGP screen */}
      <header className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">訂單號</span>
              <span className="font-mono text-base font-bold">{wo.woNo}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                來源 ● {wo.source}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusTone[sl] ?? "bg-slate-100 text-slate-600"}`}>
                ● {sl}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-2">
              {model.machineFamily}
            </h1>
            <div className="text-sm text-slate-700">
              <span className="font-mono text-cyan-700">{model.code}</span>　·　{model.name}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              客戶 <b className="text-slate-900">{wo.customer}</b>
              　·　數量 <b className="tabular-nums">{wo.qty}</b>
              　·　下單 {wo.orderDate}
              　·　目的地 {wo.destination}
            </div>
            {wo.notes && (
              <div className="text-xs text-amber-700 mt-1">📝 備註：{wo.notes}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">客戶要求船期</div>
            <div className={`text-2xl font-bold tabular-nums ${dleft < 0 ? "text-slate-400" : dleft < 7 ? "text-rose-600" : dleft < 21 ? "text-amber-600" : "text-slate-900"}`}>
              {wo.shipDate}
            </div>
            <div className="text-xs text-slate-500">
              {dleft > 0 ? `距離出貨 ${dleft} 天` : dleft === 0 ? "今日出貨" : `已逾 ${-dleft} 天`}
            </div>
            <div className="mt-2 text-xs text-slate-500">目前站別</div>
            <div className="text-base font-semibold text-cyan-700">{currentStageLabel(wo)}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="進度" value={`${stageDoneCount} / 8 階段`} />
          <Stat label="本單成本估算" value={`$${totalCost.toLocaleString()}`} />
          <Stat label="本單預期收入" value={`$${(model.stdPrice * wo.qty).toLocaleString()}`} />
          <Stat label="毛利估算" value={`$${(model.stdPrice * wo.qty - totalCost).toLocaleString()}`} />
        </div>
      </header>

      {/* Stage bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">八階段反向排程</h2>
        <StageBar stages={wo.stages} today={today} />

        <table className="w-full mt-4 text-sm">
          <thead className="text-slate-600 text-xs">
            <tr>
              <th className="text-left py-1.5">階段</th>
              <th className="text-left py-1.5">預計</th>
              <th className="text-left py-1.5">實際</th>
              <th className="text-left py-1.5">狀態</th>
              <th className="text-left py-1.5">備註</th>
            </tr>
          </thead>
          <tbody>
            {wo.stages.map((s) => {
              const meta = STAGES.find((m) => m.key === s.stage)!;
              const late = !s.actualDate && s.plannedDate < today && s.status !== "done";
              return (
                <tr key={s.stage} className="border-t border-slate-100">
                  <td className="py-2">{meta.icon} {meta.label}</td>
                  <td className="py-2 tabular-nums">{s.plannedDate}</td>
                  <td className="py-2 tabular-nums text-slate-600">{s.actualDate ?? "—"}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      s.status === "done" ? "bg-emerald-100 text-emerald-700" :
                      s.status === "in_progress" ? "bg-cyan-100 text-cyan-700" :
                      s.status === "blocked" ? "bg-rose-100 text-rose-700" :
                      late ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {s.status === "done" ? "完成" : s.status === "in_progress" ? "進行中" : s.status === "blocked" ? "阻塞" : late ? "已延遲" : "待辦"}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-slate-500">{s.notes ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BOM × Qty — the BOM bridge made visible */}
        <section className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-bold">🔗 BOM 連結展開（{model.code} × {wo.qty}）</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              成品品號 → 透過 BOM → 自動展開所需零件 / 即時偵測缺料
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-4 py-2">料號 / 名稱</th>
                <th className="text-right px-4 py-2">單台用量</th>
                <th className="text-right px-4 py-2">本單需求</th>
                <th className="text-right px-4 py-2">在庫</th>
                <th className="text-right px-4 py-2">餘額</th>
                <th className="text-left px-4 py-2">供應商</th>
              </tr>
            </thead>
            <tbody>
              {bomNeeds.map((n) => (
                <tr key={n.part.id} className={`border-t border-slate-100 ${n.shortage > 0 ? "bg-rose-50" : ""}`}>
                  <td className="px-4 py-2">
                    <div className="font-mono text-xs text-slate-500">{n.part.code}</div>
                    <div>{n.part.name}</div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{n.qtyPerUnit}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">{n.need}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{n.part.stockOnHand}</td>
                  <td className={`px-4 py-2 text-right tabular-nums font-bold ${n.balance < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {n.balance >= 0 ? `+${n.balance}` : n.balance}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-600">
                    {n.supplier?.name}<br />
                    <span className="text-[10px] text-slate-400">{n.supplier?.country} · 交期 {n.part.leadDays}d</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Alerts for this WO */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">本單異常 + 動作建議</h2>
          <AlertList alerts={allAlerts} />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-lg tabular-nums">{value}</div>
    </div>
  );
}
