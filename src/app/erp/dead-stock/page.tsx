import { parts, suppliers } from "@/lib/erp/seed";
import { computePartDemand } from "@/lib/erp/alerts";

// 呆料預警 + 庫存週轉率 — 對應 WMS 規劃「模組1：庫存管理」
//   · 呆料預警：無需求歸零料 / 低週轉慢呆料
//   · 庫存週轉率（年化估算）
//   · 安全庫存警示：低於安全 / 庫存過高 / 長交期料異常

export default function DeadStockPage() {
  const demand = computePartDemand();
  const demandMap = new Map(demand.map((d) => [d.part.id, d.totalRequired]));

  const rows = parts.map((p) => {
    const required = demandMap.get(p.id) ?? 0;
    const stockValue = p.stockOnHand * p.unitCost;
    // 週轉率（年化近似）：假設目前需求 = 30 天消耗 → 年化 ×12
    const annualDemand = required * 12;
    const turnover = p.stockOnHand > 0 ? annualDemand / p.stockOnHand : 0;
    // 庫存可用天數
    const dailyUse = required / 30;
    const daysOfStock = dailyUse > 0 ? Math.round(p.stockOnHand / dailyUse) : Infinity;
    // 呆料分級
    let grade: "dead" | "slow" | "healthy";
    if (required === 0 && p.stockOnHand > 0) grade = "dead";          // 無需求歸零料
    else if (turnover > 0 && turnover < 4) grade = "slow";            // 低週轉慢呆（年週轉<4）
    else grade = "healthy";
    return { p, required, stockValue, turnover, daysOfStock, grade };
  });

  const dead = rows.filter((r) => r.grade === "dead");
  const slow = rows.filter((r) => r.grade === "slow");
  const stagnant = [...dead, ...slow];
  const totalStockValue = rows.reduce((s, r) => s + r.stockValue, 0);
  const deadValue = stagnant.reduce((s, r) => s + r.stockValue, 0);
  const deadRatePct = totalStockValue > 0 ? (deadValue / totalStockValue) * 100 : 0;
  const turnovers = rows.filter((r) => r.turnover > 0).map((r) => r.turnover);
  const avgTurnover = turnovers.length ? turnovers.reduce((s, v) => s + v, 0) / turnovers.length : 0;

  // 安全庫存警示
  const belowSafety = rows.filter((r) => r.p.stockOnHand < r.p.safetyStock);
  const overStock = rows.filter((r) => r.p.stockOnHand > r.p.safetyStock * 3 && r.required === 0);
  const longLeadRisk = rows.filter((r) => r.p.leadDays >= 30 && r.p.stockOnHand < r.p.safetyStock);

  // 呆滯料排行（金額）
  const deadRank = [...stagnant].sort((a, b) => b.stockValue - a.stockValue);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🗑️ 呆料預警 + 庫存週轉</h1>
        <p className="text-sm text-slate-500 mt-1">
          無需求歸零料 / 低週轉慢呆料 / 庫存週轉率 / 安全庫存警示　·　WMS 模組1 庫存管理
        </p>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="呆滯料件數" value={`${stagnant.length}`} sub={`歸零 ${dead.length} · 慢呆 ${slow.length}`} tone={stagnant.length > 0 ? "amber" : "emerald"} />
        <Kpi label="呆滯料金額" value={`$${(deadValue / 10000).toFixed(0)}萬`} sub={`$${deadValue.toLocaleString()}`} tone="rose" />
        <Kpi label="呆料率" value={`${deadRatePct.toFixed(1)}%`} sub="目標 < 2%" tone={deadRatePct < 2 ? "emerald" : deadRatePct < 8 ? "amber" : "rose"} />
        <Kpi label="平均庫存週轉率" value={`${avgTurnover.toFixed(1)}×`} sub="年化 · 目標 > 8×" tone={avgTurnover >= 8 ? "emerald" : "amber"} />
      </section>

      {/* 安全庫存三警示 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AlertBox title="低於安全庫存" count={belowSafety.length} tone="rose"
          items={belowSafety.slice(0, 5).map((r) => `${r.p.code} ${r.p.name}（${r.p.stockOnHand}/${r.p.safetyStock}）`)} />
        <AlertBox title="庫存過高（>3× 安全且無需求）" count={overStock.length} tone="amber"
          items={overStock.slice(0, 5).map((r) => `${r.p.code} ${r.p.name}（在庫 ${r.p.stockOnHand}）`)} />
        <AlertBox title="長交期料庫存不足" count={longLeadRisk.length} tone="rose"
          items={longLeadRisk.slice(0, 5).map((r) => `${r.p.code} ${r.p.name}（交期 ${r.p.leadDays}d）`)} />
      </section>

      {/* 呆滯料清單 */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h2 className="font-bold">呆滯料清單（依金額排序）</h2>
        </div>
        {deadRank.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-emerald-700">✅ 無呆滯料</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2">分級</th>
                <th className="text-left px-3 py-2">料號 / 品名</th>
                <th className="text-left px-3 py-2">分類</th>
                <th className="text-right px-3 py-2">在庫</th>
                <th className="text-right px-3 py-2">本期需求</th>
                <th className="text-right px-3 py-2">週轉率</th>
                <th className="text-right px-3 py-2">可用天數</th>
                <th className="text-right px-3 py-2">呆料金額</th>
                <th className="text-left px-3 py-2">供應商</th>
              </tr>
            </thead>
            <tbody>
              {deadRank.map((r) => {
                const sup = suppliers.find((s) => s.id === r.p.supplierId);
                return (
                  <tr key={r.p.id} className={`border-t border-slate-100 ${r.grade === "dead" ? "bg-rose-50/40" : "bg-amber-50/30"}`}>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        r.grade === "dead" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                      }`}>{r.grade === "dead" ? "歸零呆料" : "低週轉"}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs text-slate-500">{r.p.code}</div>
                      <div>{r.p.name}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{r.p.category}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.p.stockOnHand} {r.p.unit}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.required}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.turnover > 0 ? `${r.turnover.toFixed(1)}×` : "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.daysOfStock === Infinity ? "∞" : `${r.daysOfStock}d`}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-rose-600">${r.stockValue.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{sup?.name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* 週轉率排行 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">庫存週轉率排行（高 → 低，前 12）</h2>
        <div className="space-y-2">
          {[...rows].filter((r) => r.p.stockOnHand > 0).sort((a, b) => b.turnover - a.turnover).slice(0, 12).map((r) => {
            const max = Math.max(...rows.map((x) => x.turnover), 1);
            const pct = (r.turnover / max) * 100;
            return (
              <div key={r.p.id} className="flex items-center gap-3">
                <div className="w-40 text-xs text-right shrink-0">
                  <span className="font-mono text-slate-500">{r.p.code}</span> <span className="text-slate-700">{r.p.name}</span>
                </div>
                <div className="flex-1 h-5 bg-slate-50 rounded overflow-hidden">
                  <div className={`h-full ${r.turnover >= 8 ? "bg-emerald-500" : r.turnover >= 4 ? "bg-amber-500" : "bg-rose-400"}`}
                    style={{ width: `${Math.max(2, pct)}%` }} />
                </div>
                <div className="w-14 text-right text-xs tabular-nums font-bold">{r.turnover.toFixed(1)}×</div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3">
        <b>📐 定義</b>：歸零呆料 = 無任何工單需求且有庫存；低週轉慢呆 = 年週轉率 &lt; 4×。
        週轉率（年化）= 本期需求 ×12 / 在庫。庫存可用天數 = 在庫 / 日消耗。
        正式接鼎新可改用「最後異動日」精算 90/180 天未動，並納入 ECN 停用料 / Forecast 歸零料。
      </p>
    </div>
  );
}

function AlertBox({ title, count, tone, items }: { title: string; count: number; tone: "rose" | "amber"; items: string[] }) {
  const cls = tone === "rose" ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50";
  const badge = tone === "rose" ? "bg-rose-600" : "bg-amber-500";
  return (
    <div className={`rounded-xl border-2 ${cls} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded text-white font-bold ${badge}`}>{count}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">✓ 無</p>
      ) : (
        <ul className="text-[11px] text-slate-700 space-y-0.5">
          {items.map((it, i) => <li key={i} className="truncate">· {it}</li>)}
          {count > items.length && <li className="text-slate-400">… 等 {count} 項</li>}
        </ul>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "rose" | "amber" | "emerald" }) {
  const cls =
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
