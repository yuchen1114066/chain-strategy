import Link from "next/link";
import { workOrders, models, today, currentStageLabel } from "@/lib/erp/seed";
import { computeAlerts } from "@/lib/erp/alerts";
import { criticalPathsAll, equipmentUtilization } from "@/lib/erp/critical-path";
import StageBar from "@/components/erp/StageBar";
import CsvExportButton from "@/components/erp/CsvExportButton";

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
  "出貨中": "bg-violet-100 text-violet-700",
};

export default function WorkOrdersPage() {
  const alerts = computeAlerts();
  const alertCountByWo = new Map<string, { red: number; yellow: number }>();
  for (const a of alerts) {
    const c = alertCountByWo.get(a.woId) ?? { red: 0, yellow: 0 };
    if (a.severity === "red") c.red += 1; else c.yellow += 1;
    alertCountByWo.set(a.woId, c);
  }
  const cpAll = criticalPathsAll();
  const cpByWo = new Map(cpAll.map((c) => [c.woId, c]));
  const equip = equipmentUtilization();
  const equipCritical = equip.filter((e) => e.riskLevel === "critical");

  const csvRows = workOrders.map((w) => {
    const m = models.find((m) => m.id === w.modelId);
    return {
      woNo: w.woNo, source: w.source, customer: w.customer,
      finishedCode: m?.code ?? "", machineFamily: m?.machineFamily ?? "",
      qty: w.qty, orderDate: w.orderDate, shipDate: w.shipDate,
      destination: w.destination, currentStage: currentStageLabel(w),
      status: w.statusLabel ?? w.status, notes: w.notes ?? "",
    };
  });

  return (
    <div className="p-6">
      <header className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">工單追蹤</h1>
          <p className="text-sm text-slate-500 mt-1">
            來源 ERP 訂單 → BOM 自動展開零件 → 八階段追蹤 → 預測異常
          </p>
        </div>
        <CsvExportButton
          filename={`work-orders-${new Date().toISOString().slice(0,10)}.csv`}
          rows={csvRows}
          columns={[
            { key: "woNo", label: "訂單號" },
            { key: "source", label: "來源" },
            { key: "customer", label: "客戶" },
            { key: "finishedCode", label: "成品品號" },
            { key: "machineFamily", label: "機種" },
            { key: "qty", label: "數量" },
            { key: "orderDate", label: "下單日" },
            { key: "shipDate", label: "船期" },
            { key: "destination", label: "目的地" },
            { key: "currentStage", label: "目前站別" },
            { key: "status", label: "狀態" },
            { key: "notes", label: "備註" },
          ]}
        />
      </header>

      {/* ===== 瓶頸設備稼動率 ===== */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700 mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400">Bottleneck Equipment Utilization</div>
            <div className="text-lg font-bold mt-0.5">瓶頸設備稼動率 — AI 14 天塞車預測</div>
          </div>
          <div className="text-[11px] text-slate-400">
            {equipCritical.length > 0 ? <span className="text-rose-400 font-bold">{equipCritical.length} 台設備超過 92% — 塞車風險高</span> : "全部設備運轉正常"}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {equip.map((e) => {
            const tone = e.riskLevel === "critical" ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
              : e.riskLevel === "warn" ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
              : "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
            return (
              <div key={e.id} className={`rounded-lg border px-3 py-2 ${tone}`}>
                <div className="text-[11px] font-bold">{e.name}</div>
                <div className="text-[9px] opacity-70">{e.stage}</div>
                <div className="text-2xl font-extrabold tabular-nums mt-1">{e.utilizationPct}%</div>
                <div className="h-1 rounded-full bg-slate-700/60 overflow-hidden mt-1">
                  <div className="h-full rounded-full"
                    style={{ width: `${e.utilizationPct}%`,
                      background: e.riskLevel === "critical" ? "#f43f5e" : e.riskLevel === "warn" ? "#f59e0b" : "#10b981" }} />
                </div>
                <div className="text-[9px] mt-1 leading-tight">AI：{e.aiVerdict}</div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-slate-500 mt-3">
          🤖 規則：稼動率 ≥ 92% → AI 判定未來 14 天塞車風險高　·　≥ 85% → 中度警示
        </div>
      </section>

      {/* Compact table — exact match to screenshot columns */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold">訂單號</th>
              <th className="text-left px-3 py-2.5 font-semibold">來源</th>
              <th className="text-left px-3 py-2.5 font-semibold">客戶</th>
              <th className="text-left px-3 py-2.5 font-semibold">成品品號</th>
              <th className="text-left px-3 py-2.5 font-semibold">機種</th>
              <th className="text-right px-3 py-2.5 font-semibold">數量</th>
              <th className="text-left px-3 py-2.5 font-semibold">下單日</th>
              <th className="text-left px-3 py-2.5 font-semibold">目前站別</th>
              <th className="text-left px-3 py-2.5 font-semibold">狀態</th>
              <th className="text-left px-3 py-2.5 font-semibold">備註</th>
              <th className="text-left px-3 py-2.5 font-semibold">⚠</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w) => {
              const m = models.find((m) => m.id === w.modelId);
              const ac = alertCountByWo.get(w.id);
              const stageLabel = currentStageLabel(w);
              const sl = w.statusLabel ?? w.status;
              return (
                <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <Link href={`/erp/work-orders/${w.id}`} className="font-mono font-semibold text-cyan-700 hover:underline">
                      {w.woNo}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${w.source === "ERP" ? "bg-cyan-500" : "bg-slate-400"}`} />
                      {w.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{w.customer}</td>
                  <td className="px-3 py-2.5 font-mono">{m?.code}</td>
                  <td className="px-3 py-2.5 text-slate-700">{m?.machineFamily}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{w.qty}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600">{w.orderDate}</td>
                  <td className="px-3 py-2.5">{stageLabel}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusTone[sl] ?? "bg-slate-100 text-slate-600"}`}>
                      ● {sl}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{w.notes ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {ac ? (
                      <div className="flex gap-1 text-[10px] font-bold">
                        {ac.red > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white">🔴{ac.red}</span>}
                        {ac.yellow > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white">🟡{ac.yellow}</span>}
                      </div>
                    ) : (
                      <span className="text-emerald-500 text-xs">✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== Critical Path（關鍵路徑）===== */}
      <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
        🎯 Critical Path — 關鍵路徑（哪個工序 delay 會直接影響出貨）
        <span className="text-[10px] text-slate-400 font-normal">紅色 = 在 critical path 上，無緩衝</span>
      </h2>
      <div className="space-y-3">
        {workOrders.filter((w) => w.status !== "done").map((w) => {
          const m = models.find((m) => m.id === w.modelId);
          const dleft = daysUntil(w.shipDate);
          const cp = cpByWo.get(w.id);
          return (
            <Link
              key={w.id}
              href={`/erp/work-orders/${w.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-cyan-400 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-700">{w.woNo}</span>
                  <span className="font-mono text-slate-500">{m?.code}</span>
                  <span className="text-slate-700">× {w.qty}　·　{w.customer}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {cp && (
                    <>
                      <span className="text-slate-500">AI 預測出貨 <b className={`${cp.totalSlack < 0 ? "text-rose-600" : cp.totalSlack <= 3 ? "text-amber-600" : "text-emerald-600"}`}>{cp.predictedEnd}</b></span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        cp.totalSlack < 0 ? "bg-rose-100 text-rose-700" :
                        cp.totalSlack <= 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        緩衝 {cp.totalSlack >= 0 ? `+${cp.totalSlack}` : cp.totalSlack}d
                      </span>
                    </>
                  )}
                  <span className={`tabular-nums font-bold ${dleft < 7 ? "text-rose-600" : dleft < 21 ? "text-amber-600" : "text-slate-500"}`}>
                    船期 {w.shipDate}（{dleft >= 0 ? `T-${dleft}` : `已逾 ${-dleft}d`}）
                  </span>
                </div>
              </div>
              <StageBar stages={w.stages} today={today} />
              {cp && (
                <div className="mt-2 flex gap-1 text-[10px]">
                  {cp.stages.map((s) => (
                    <div key={s.stage}
                      className={`flex-1 text-center py-0.5 rounded ${
                        s.status === "done" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        s.onCriticalPath ? "bg-rose-50 text-rose-700 border border-rose-300 font-bold" :
                        "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                      {s.onCriticalPath && s.status !== "done" && "🎯 "}{s.label}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 mt-4 leading-relaxed">
        <b>🎯 Critical Path</b> — 在關鍵路徑上的工序，每延 1 天 → 出貨延 1 天，必須優先處理。
        非關鍵路徑工序有 slack（緩衝），稍 delay 不會影響船期。
        <b>瓶頸設備稼動率</b> &gt; 92% → AI 判定 14 天內塞車風險高，建議分流或擴產。
      </p>
    </div>
  );
}
