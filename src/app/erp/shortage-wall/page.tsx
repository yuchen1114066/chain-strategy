import Link from "next/link";
import { workOrders, models, suppliers, bom, today } from "@/lib/erp/seed";
import { computePartDemand } from "@/lib/erp/alerts";

// 缺料牆 — 對應 WMS 規劃「模組2 缺料與風險」
//   · 缺料料號 / 影響工單 / 影響產量 / 缺料天數 / 責任單位
//   · 停線倒數（距離受影響工單開工日剩幾天）

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export default function ShortageWallPage() {
  const demand = computePartDemand();
  const shortageParts = demand.filter((d) => d.shortage > 0);

  // 對每個缺料件算：影響工單、影響產量、停線倒數、責任單位
  const wall = shortageParts.map((d) => {
    const p = d.part;
    const sup = suppliers.find((s) => s.id === p.supplierId);
    // 影響的工單（透過 BOM 用到此料 + 進行中/規劃中）
    const affectedWos = workOrders.filter((w) => {
      if (w.status !== "active" && w.status !== "planning") return false;
      return bom.some((b) => b.modelId === w.modelId && b.partId === p.id && b.isActive);
    });
    const affectedQty = affectedWos.reduce((s, w) => s + w.qty, 0);
    // 停線倒數 = 最緊迫受影響工單的「算料」階段計畫日 - 今天
    let soonestStockoutDays = 9999;
    let soonestWo: typeof workOrders[number] | undefined;
    for (const w of affectedWos) {
      const matStage = w.stages.find((s) => s.stage === "material");
      const d2 = matStage ? daysBetween(today, matStage.plannedDate) : daysBetween(today, w.shipDate);
      if (d2 < soonestStockoutDays) { soonestStockoutDays = d2; soonestWo = w; }
    }
    // 採料是否來得及：供應商交期 vs 停線倒數
    const canMakeIt = p.leadDays <= soonestStockoutDays;
    const severity: "critical" | "high" | "warn" =
      soonestStockoutDays < 0 || (!canMakeIt && soonestStockoutDays < 7) ? "critical"
      : !canMakeIt ? "high" : "warn";
    return {
      part: p, supplier: sup, shortage: d.shortage,
      totalRequired: d.totalRequired,
      affectedWos, affectedQty,
      stockoutDays: soonestStockoutDays === 9999 ? null : soonestStockoutDays,
      soonestWo, canMakeIt, severity,
    };
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, warn: 2 };
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return (a.stockoutDays ?? 9999) - (b.stockoutDays ?? 9999);
  });

  const critical = wall.filter((w) => w.severity === "critical");
  const totalAffectedValue = wall.reduce((acc, w) => {
    return acc + w.affectedWos.reduce((s, wo) => {
      const m = models.find((m) => m.id === wo.modelId);
      return s + (m ? m.stdPrice * wo.qty : 0);
    }, 0);
  }, 0);
  const mostUrgent = wall.find((w) => w.stockoutDays != null);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🧱 缺料牆</h1>
          <p className="text-sm text-slate-500 mt-1">
            缺料料號 → 影響工單 / 影響產量 / 停線倒數 / 責任單位　·　即時偵測
          </p>
        </div>
        <Link href="/erp/po-generator" className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700 font-semibold">
          🛒 一鍵生成追料 PO
        </Link>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="缺料件數" value={`${wall.length}`} tone={wall.length > 0 ? "rose" : "emerald"} />
        <Kpi label="🔴 危急（趕不上）" value={`${critical.length}`} tone={critical.length > 0 ? "rose" : undefined} />
        <Kpi label="影響工單" value={`${new Set(wall.flatMap((w) => w.affectedWos.map((x) => x.id))).size}`} tone="amber" />
        <Kpi label="影響產值" value={`$${(totalAffectedValue / 10000).toFixed(0)}萬`} tone="amber" />
      </section>

      {/* 最緊迫停線倒數橫幅 */}
      {mostUrgent && mostUrgent.stockoutDays != null && (
        <section className={`rounded-xl border-2 p-5 ${
          mostUrgent.stockoutDays < 0 ? "border-rose-400 bg-rose-50" :
          mostUrgent.stockoutDays < 7 ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-slate-500">最緊迫停線倒數</div>
              <div className="text-3xl font-bold tabular-nums mt-0.5">
                {mostUrgent.stockoutDays < 0
                  ? `已停線風險 ${-mostUrgent.stockoutDays} 天`
                  : `剩 ${mostUrgent.stockoutDays} 天`}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                <span className="font-mono">{mostUrgent.part.code}</span> {mostUrgent.part.name}
                {mostUrgent.soonestWo && <> → 拖累 <span className="font-mono text-cyan-700">{mostUrgent.soonestWo.woNo}</span></>}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-500">供應商交期</div>
              <div className="text-xl font-bold tabular-nums">{mostUrgent.part.leadDays} 天</div>
              <div className={`text-xs font-bold ${mostUrgent.canMakeIt ? "text-emerald-600" : "text-rose-600"}`}>
                {mostUrgent.canMakeIt ? "✓ 現在追單來得及" : "🚨 現在追單也趕不上"}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 缺料牆 grid */}
      {wall.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="font-bold text-emerald-800">目前沒有缺料 — 全料件庫存充足</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wall.map((w) => {
            const tone = w.severity === "critical"
              ? { bd: "border-rose-300", bg: "bg-rose-50/60", badge: "bg-rose-600", txt: "危急" }
              : w.severity === "high"
              ? { bd: "border-amber-300", bg: "bg-amber-50/60", badge: "bg-amber-500", txt: "高風險" }
              : { bd: "border-slate-200", bg: "bg-white", badge: "bg-slate-400", txt: "注意" };
            return (
              <article key={w.part.id} className={`rounded-xl border-2 ${tone.bd} ${tone.bg} p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-slate-500">{w.part.code}</div>
                    <div className="font-bold">{w.part.name}</div>
                    {w.part.spec && <div className="text-[10px] text-slate-500">{w.part.spec}</div>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold shrink-0 ${tone.badge}`}>
                    {tone.txt}
                  </span>
                </div>

                {/* 缺料數量 */}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500">缺料數量</div>
                    <div className="text-2xl font-bold text-rose-600 tabular-nums">-{w.shortage} <span className="text-sm text-slate-500">{w.part.unit}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">停線倒數</div>
                    <div className={`text-xl font-bold tabular-nums ${
                      w.stockoutDays == null ? "text-slate-400" :
                      w.stockoutDays < 0 ? "text-rose-600" :
                      w.stockoutDays < 7 ? "text-amber-600" : "text-slate-700"
                    }`}>
                      {w.stockoutDays == null ? "—"
                        : w.stockoutDays < 0 ? `逾 ${-w.stockoutDays}d`
                        : `T-${w.stockoutDays}d`}
                    </div>
                  </div>
                </div>

                {/* 影響工單 */}
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <div className="text-[10px] text-slate-500 mb-1">
                    影響 {w.affectedWos.length} 張工單 · 共 {w.affectedQty} 台
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {w.affectedWos.slice(0, 4).map((wo) => (
                      <Link key={wo.id} href={`/erp/work-orders/${wo.id}`}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-cyan-700 hover:border-cyan-400">
                        {wo.woNo}
                      </Link>
                    ))}
                    {w.affectedWos.length > 4 && <span className="text-[10px] text-slate-400">+{w.affectedWos.length - 4}</span>}
                  </div>
                </div>

                {/* 供應商 + 動作 */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">供應商 </span>
                    <span className="font-semibold">{w.supplier?.name ?? "—"}</span>
                    <span className="text-slate-500"> · 交期 {w.part.leadDays}d</span>
                  </div>
                  <span className={`font-bold ${w.canMakeIt ? "text-emerald-600" : "text-rose-600"}`}>
                    {w.canMakeIt ? "✓ 追單來得及" : "🚨 趕不上"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3">
        <b>📐 停線倒數</b>＝ 受影響工單「算料」階段計畫日 − 今天。
        <b>追單來得及</b>＝ 供應商交期 ≤ 停線倒數。
        危急 = 趕不上且 7 天內停線。建議立即點「🛒 一鍵生成追料 PO」。
      </p>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "rose" | "amber" | "emerald" }) {
  const cls =
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
