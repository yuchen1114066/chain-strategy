import Link from "next/link";
import { parts, suppliers, today } from "@/lib/erp/seed";
import { computePartDemand } from "@/lib/erp/alerts";

// 再下單時點分析 (Reorder Point Analysis)
//
// 對每個料件計算：
//   · 平均日消耗 (假設用：總需求 / 30 天，因 demo 用窗口)
//   · 再下單點 (ROP) = 平均日消耗 × 交期 + 安全庫存
//   · 距離 ROP 還幾天 (= (在庫 - ROP) / 平均日消耗)
//   · 建議下單日 = 今天 + 距離 ROP 天數
//
// 分四級警示：
//   🔴 已低於 ROP（馬上下單）
//   🟡 14 天內到達 ROP（本週內下單）
//   🟢 14~45 天到達 ROP（觀察中）
//   ⚪ 庫存充足或無消耗

type ReorderRow = {
  partId: string;
  partCode: string;
  partName: string;
  spec: string;
  unit: string;
  unitCost: number;
  stockOnHand: number;
  safetyStock: number;
  leadDays: number;
  supplierName: string;
  // 平均日消耗
  avgDaily: number;
  // 再下單點
  reorderPoint: number;
  // 還能撐幾天（直到觸發 ROP）
  daysUntilROP: number;
  // 建議下單日
  recommendedOrderDate: string;
  // 建議下單量（拉到安全庫存 × 2）
  recommendedQty: number;
  status: "critical" | "soon" | "watch" | "ok";
};

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function ReorderPage() {
  const demand = computePartDemand();
  const demandMap = new Map(demand.map((d) => [d.part.id, d.totalRequired]));

  const rows: ReorderRow[] = parts
    .filter((p) => p.kind === "purchase" || !p.kind) // 自製件無需採購
    .map((p) => {
      const totalRequired = demandMap.get(p.id) ?? 0;
      // 假設目前需求要在 30 天內消耗完
      const avgDaily = totalRequired > 0 ? totalRequired / 30 : 0;
      const reorderPoint = Math.ceil(avgDaily * p.leadDays + p.safetyStock);
      const daysUntilROP = avgDaily > 0
        ? Math.floor((p.stockOnHand - reorderPoint) / avgDaily)
        : 999;
      const recommendedOrderDate = daysUntilROP < 0
        ? today
        : addDays(today, daysUntilROP);
      const recommendedQty = Math.max(reorderPoint, p.safetyStock * 2);
      let status: ReorderRow["status"];
      if (avgDaily === 0) status = "ok";
      else if (daysUntilROP < 0) status = "critical";
      else if (daysUntilROP <= 14) status = "soon";
      else if (daysUntilROP <= 45) status = "watch";
      else status = "ok";

      const sup = suppliers.find((s) => s.id === p.supplierId);
      return {
        partId: p.id, partCode: p.code, partName: p.name,
        spec: p.spec ?? "", unit: p.unit, unitCost: p.unitCost,
        stockOnHand: p.stockOnHand, safetyStock: p.safetyStock, leadDays: p.leadDays,
        supplierName: sup?.name ?? "—",
        avgDaily, reorderPoint, daysUntilROP,
        recommendedOrderDate, recommendedQty, status,
      };
    });

  const critical = rows.filter((r) => r.status === "critical");
  const soon = rows.filter((r) => r.status === "soon");
  const watch = rows.filter((r) => r.status === "watch");
  const ok = rows.filter((r) => r.status === "ok");

  // 排序：critical → soon → watch → ok（再依距離排）
  const sorted = [...rows].sort((a, b) => {
    const order = { critical: 0, soon: 1, watch: 2, ok: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.daysUntilROP - b.daysUntilROP;
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📦 再下單時點分析（ROP）</h1>
        <p className="text-sm text-slate-500 mt-1">
          自動算出每個採購件的再下單點 + 建議下單日，避免事到臨頭才追料
        </p>
      </header>

      {/* 四象限 KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard count={critical.length} label="🔴 馬上下單" hint="已低於 ROP" tone="rose" />
        <StatusCard count={soon.length} label="🟡 本週內下單" hint="14 天內到 ROP" tone="amber" />
        <StatusCard count={watch.length} label="🟢 觀察中" hint="14-45 天" tone="emerald" />
        <StatusCard count={ok.length} label="⚪ 充足" hint="> 45 天或無消耗" tone="slate" />
      </section>

      {/* 公式說明 */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <b>📐 ROP 計算公式：</b>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <b className="text-slate-900">再下單點 (ROP)</b>
            <div className="font-mono text-[11px] mt-1">= 平均日消耗 × 交期 + 安全庫存</div>
          </div>
          <div>
            <b className="text-slate-900">距離 ROP 天數</b>
            <div className="font-mono text-[11px] mt-1">= (在庫 - ROP) / 平均日消耗</div>
          </div>
          <div>
            <b className="text-slate-900">建議下單量</b>
            <div className="font-mono text-[11px] mt-1">= max(ROP, 安全庫存 × 2)</div>
          </div>
        </div>
      </section>

      {/* 主表 */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold">所有採購件 ROP（{rows.length} 個）</h2>
          <Link
            href="/erp/po-generator"
            className="text-xs px-3 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-700"
          >
            🛒 生成緊急 PO（{critical.length}）
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">狀態</th>
              <th className="text-left px-3 py-2 font-semibold">料號 / 名稱</th>
              <th className="text-right px-3 py-2 font-semibold">在庫</th>
              <th className="text-right px-3 py-2 font-semibold">日消耗</th>
              <th className="text-right px-3 py-2 font-semibold">交期</th>
              <th className="text-right px-3 py-2 font-semibold">ROP</th>
              <th className="text-right px-3 py-2 font-semibold">距離天數</th>
              <th className="text-left px-3 py-2 font-semibold">建議下單日</th>
              <th className="text-right px-3 py-2 font-semibold">建議數量</th>
              <th className="text-left px-3 py-2 font-semibold">供應商</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const bg = {
                critical: "bg-rose-50/60",
                soon: "bg-amber-50/40",
                watch: "bg-emerald-50/30",
                ok: "",
              }[r.status];
              const badge = {
                critical: "bg-rose-500 text-white",
                soon: "bg-amber-500 text-white",
                watch: "bg-emerald-500 text-white",
                ok: "bg-slate-300 text-slate-700",
              }[r.status];
              const badgeText = {
                critical: "🔴 立刻",
                soon: "🟡 一週內",
                watch: "🟢 觀察",
                ok: "⚪ 充足",
              }[r.status];
              return (
                <tr key={r.partId} className={`border-t border-slate-100 ${bg}`}>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge}`}>{badgeText}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-cyan-700">{r.partCode}</div>
                    <div>{r.partName}</div>
                    {r.spec && <div className="text-[10px] text-slate-400 mt-0.5">{r.spec}</div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.stockOnHand} {r.unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.avgDaily > 0 ? r.avgDaily.toFixed(1) : <span className="text-slate-400">無</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">{r.leadDays}d</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.reorderPoint}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${
                    r.daysUntilROP < 0 ? "text-rose-600" :
                    r.daysUntilROP < 14 ? "text-amber-600" :
                    r.daysUntilROP < 45 ? "text-emerald-600" : "text-slate-500"
                  }`}>
                    {r.avgDaily === 0 ? "—" : (r.daysUntilROP < 0 ? `已逾 ${-r.daysUntilROP}d` : `${r.daysUntilROP}d`)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.avgDaily > 0 ? (
                      <span className={r.status === "critical" ? "text-rose-700 font-bold" : "text-slate-600"}>
                        {r.recommendedOrderDate}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {r.avgDaily > 0 ? r.recommendedQty : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 truncate max-w-[100px]" title={r.supplierName}>
                    {r.supplierName}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3">
        <b>📌 假設：</b>目前需求量視為 30 天內消耗（demo 規則）。實際生產時應以「未來 30 天 WO 滾動需求」計算更精準。
        無消耗的料件不警告，但仍納入主表參考。
      </p>
    </div>
  );
}

function StatusCard({ count, label, hint, tone }: { count: number; label: string; hint: string; tone: "rose" | "amber" | "emerald" | "slate" }) {
  const cls = {
    rose: "border-rose-300 bg-rose-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    slate: "border-slate-200 bg-slate-50",
  }[tone];
  const textColor = {
    rose: "text-rose-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    slate: "text-slate-700",
  }[tone];
  return (
    <div className={`rounded-xl border-2 px-4 py-3 ${cls}`}>
      <div className={`text-3xl font-bold tabular-nums ${textColor}`}>{count}</div>
      <div className="text-sm font-semibold mt-0.5">{label}</div>
      <div className="text-xs text-slate-600 mt-0.5">{hint}</div>
    </div>
  );
}
