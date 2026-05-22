import Link from "next/link";
import { workOrders, models, today, parts } from "@/lib/erp/seed";
import { computeAlerts, computePartDemand } from "@/lib/erp/alerts";
import LiveClock from "@/components/erp/LiveClock";

// CHI HUA Pulse — 世界級製造流程戰情 Dashboard（暗色旗艦頁）

const WMS_STAGES = ["下單", "採購", "IQC", "生產", "OQC", "包裝", "船期", "交付"];

function daysUntil(iso: string): number {
  return Math.round(
    (new Date(iso + "T00:00:00Z").getTime() - new Date(today + "T00:00:00Z").getTime()) / 86_400_000
  );
}

export default function WmsDashboardPage() {
  const alerts = computeAlerts();
  const demand = computePartDemand();
  const active = workOrders.filter((w) => w.status === "active" || w.status === "planning");
  const done = workOrders.filter((w) => w.status === "done");
  const redWoIds = new Set(alerts.filter((a) => a.severity === "red").map((a) => a.woId));
  const lateWos = workOrders.filter((w) =>
    w.status !== "done" && w.stages.some((s) => !s.actualDate && s.plannedDate < today && s.status !== "done")
  );
  const onTime = done.filter((w) => {
    const ship = w.stages.find((s) => s.stage === "ship");
    return ship?.actualDate && ship.actualDate <= w.shipDate;
  });
  const onTimePct = done.length ? (onTime.length / done.length) * 100 : 92.3;
  const avgLead = done.length
    ? Math.round(done.reduce((acc, w) => {
        const ship = w.stages.find((s) => s.stage === "ship");
        return acc + (ship?.actualDate ? daysUntil(ship.actualDate) - daysUntil(w.orderDate) : 14);
      }, 0) / done.length)
    : 14;

  const redCount = alerts.filter((a) => a.severity === "red").length;
  const yellowCount = alerts.filter((a) => a.severity === "yellow").length;
  const shortageParts = demand.filter((d) => d.shortage > 0);

  // 訂單狀態分布
  const statusDist = [
    { label: "正常", n: workOrders.filter((w) => w.status !== "cancelled" && !redWoIds.has(w.id) && !lateWos.includes(w)).length, color: "#22c55e" },
    { label: "進行中", n: active.length, color: "#3b82f6" },
    { label: "延遲", n: lateWos.length, color: "#f59e0b" },
    { label: "異常", n: redWoIds.size, color: "#ef4444" },
  ];
  const statusTotal = statusDist.reduce((s, x) => s + x.n, 0) || 1;

  // 庫存健康度
  const stockHealth = [
    { label: "健康庫存", n: parts.filter((p) => p.stockOnHand >= p.safetyStock).length, color: "#22c55e" },
    { label: "低庫存", n: parts.filter((p) => p.stockOnHand < p.safetyStock && p.stockOnHand > 0).length, color: "#f59e0b" },
    { label: "缺料", n: shortageParts.length, color: "#ef4444" },
  ];
  const healthTotal = parts.length || 1;

  // 呆滯料 Top 5（用庫存值高 + 無需求 近似）
  const slowMoving = [...parts]
    .map((p) => {
      const d = demand.find((x) => x.part.id === p.id);
      return { p, required: d?.totalRequired ?? 0, value: p.stockOnHand * p.unitCost };
    })
    .filter((x) => x.required === 0 && x.p.stockOnHand > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 即將到期船期
  const upcoming = active
    .filter((w) => { const d = daysUntil(w.shipDate); return d >= -14 && d <= 14; })
    .sort((a, b) => a.shipDate.localeCompare(b.shipDate))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* ===== 左側暗色 sidebar ===== */}
      <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-white">⚡</div>
            <div>
              <div className="font-bold tracking-wide leading-tight">CHI HUA <span className="text-red-500">Pulse</span></div>
              <div className="text-[9px] text-slate-500 tracking-widest">GREEN · HEALTH · INNOVATION</div>
            </div>
          </div>
        </div>
        <nav className="py-3 text-sm flex-1">
          <NavItem label="WMS Dashboard" active />
          <NavItem label="戰情室" href="/erp" />
          <NavItem label="流程綜觀" href="/erp/flow" />
          <NavItem label="可視化儀表板" href="/erp/viz" />
          <NavItem label="異常警訊" href="/erp/alerts" />
          <NavItem label="工單追蹤" href="/erp/work-orders" />
          <NavItem label="鼎新報表同步" href="/erp/import" />
          <NavItem label="QR 查碼" href="/erp/mobile" />
        </nav>
        <div className="px-5 py-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-1">⏱ <LiveClock /></div>
          <div className="flex items-center gap-1.5 text-xs mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400">即時更新中</span>
          </div>
        </div>
      </aside>

      {/* ===== 主內容 ===== */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* 頂部 */}
        <header className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              WMS Dashboard <span className="text-sm font-normal text-slate-400 ml-2">倉儲與製造流程戰情中心</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">CHI HUA Smart Manufacturing Command Center · 基準日 {today}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-slate-800 rounded-lg px-3 py-2">🔔 {alerts.length}</span>
            <span className="bg-slate-800 rounded-lg px-3 py-2">資料更新 <LiveClock /></span>
          </div>
        </header>

        {/* 6 KPI */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          <Kpi label="今日訂單總數" value={`${workOrders.length}`} sub="↑ 全部工單" tone="cyan" />
          <Kpi label="進行中訂單" value={`${active.length}`} sub={`佔 ${Math.round(active.length / workOrders.length * 100)}%`} tone="blue" />
          <Kpi label="準時完成率" value={`${onTimePct.toFixed(1)}%`} sub="↑ 目標 95%" tone="emerald" />
          <Kpi label="異常訂單" value={`${redWoIds.size}`} sub="🔴 紅燈" tone="rose" />
          <Kpi label="延遲訂單" value={`${lateWos.length}`} sub="🟡 已逾期" tone="amber" />
          <Kpi label="平均交期(天)" value={`${avgLead}`} sub="下單→出貨" tone="slate" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* 左 2/3：End-to-End 流程追蹤 */}
          <section className="xl:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h2 className="font-bold mb-4">End-to-End 流程追蹤</h2>
            {/* 階段標題 */}
            <div className="hidden md:grid grid-cols-[140px_repeat(8,1fr)_88px] gap-1 text-[10px] text-slate-500 mb-2 px-1">
              <div />
              {WMS_STAGES.map((s, i) => <div key={s} className="text-center">{i + 1}.{s}</div>)}
              <div className="text-right">進度</div>
            </div>
            <div className="space-y-1.5">
              {workOrders.map((w) => {
                const m = models.find((m) => m.id === w.modelId);
                const dleft = daysUntil(w.shipDate);
                const wAlerts = alerts.filter((a) => a.woId === w.id);
                const hasRed = wAlerts.some((a) => a.severity === "red");
                const doneCount = w.stages.filter((s) => s.status === "done").length;
                const progress = Math.round((doneCount / 8) * 100);
                const priority = hasRed ? "Critical" : dleft < 7 ? "High" : w.status === "planning" ? "Low" : "Normal";
                const prTone = priority === "Critical" ? "bg-red-600" : priority === "High" ? "bg-amber-600" : priority === "Low" ? "bg-slate-600" : "bg-slate-700";
                return (
                  <Link
                    key={w.id}
                    href={`/erp/work-orders/${w.id}`}
                    className={`grid grid-cols-[140px_repeat(8,1fr)_88px] gap-1 items-center rounded-lg px-1 py-2 hover:bg-slate-800/60 transition-colors ${hasRed ? "bg-red-950/30" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className={`font-mono text-xs font-bold ${hasRed ? "text-red-400" : "text-cyan-400"}`}>{w.woNo}</div>
                      <div className="text-[10px] text-slate-500 truncate">{w.customer} · {m?.code}</div>
                      <div className="text-[10px] text-slate-600">× {w.qty}</div>
                    </div>
                    {w.stages.map((s, i) => {
                      const late = !s.actualDate && s.plannedDate < today && s.status !== "done";
                      const color =
                        s.status === "done" ? "bg-emerald-500 border-emerald-400" :
                        s.status === "in_progress" ? "bg-cyan-500 border-cyan-300 ring-2 ring-cyan-500/40" :
                        s.status === "blocked" ? "bg-red-500 border-red-400" :
                        late ? "bg-amber-500 border-amber-400" :
                        "bg-slate-700 border-slate-600";
                      const icon = s.status === "done" ? "✓" : s.status === "blocked" ? "✕" : s.status === "in_progress" ? "●" : late ? "!" : "";
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold text-white ${color}`}>
                            {icon}
                          </div>
                          <div className="text-[8px] text-slate-600 mt-0.5">{(s.actualDate ?? s.plannedDate).slice(5)}</div>
                        </div>
                      );
                    })}
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums">{progress}%</div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden my-0.5">
                        <div className="h-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${progress}%` }} />
                      </div>
                      <div className={`text-[9px] tabular-nums ${dleft < 0 ? "text-red-400" : dleft < 7 ? "text-amber-400" : "text-slate-500"}`}>
                        {w.shipDate.slice(5)}
                      </div>
                      <span className={`inline-block text-[8px] px-1.5 py-0.5 rounded ${prTone} text-white mt-0.5`}>{priority}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-3 text-[10px] text-slate-400">
              <Legend c="bg-emerald-500" t="完成" />
              <Legend c="bg-cyan-500" t="進行中" />
              <Legend c="bg-amber-500" t="延遲" />
              <Legend c="bg-red-500" t="阻塞" />
              <Legend c="bg-slate-700" t="未開始" />
            </div>
          </section>

          {/* 右 1/3 */}
          <section className="space-y-5">
            {/* 今日異常警訊 */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">今日異常警訊</h2>
                <Link href="/erp/alerts" className="text-[10px] text-cyan-400 hover:underline">查看全部 →</Link>
              </div>
              <ul className="space-y-2">
                {alerts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 bg-slate-800/60 rounded-xl px-3 py-2">
                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.severity === "red" ? "bg-red-500" : "bg-amber-500"}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{a.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{a.detail}</div>
                    </div>
                  </li>
                ))}
                {alerts.length === 0 && <li className="text-xs text-emerald-400">✅ 無異常</li>}
              </ul>
              <div className="mt-3 flex gap-2 text-[10px]">
                <span className="bg-red-950/50 text-red-400 rounded-lg px-2 py-1">🔴 {redCount} 紅燈</span>
                <span className="bg-amber-950/50 text-amber-400 rounded-lg px-2 py-1">🟡 {yellowCount} 黃燈</span>
              </div>
            </div>

            {/* 訂單狀態分布 */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h2 className="font-bold mb-3">訂單狀態分布</h2>
              <div className="flex items-center gap-4">
                <Donut slices={statusDist} total={statusTotal} center={`${workOrders.length}`} />
                <ul className="text-xs space-y-1.5 flex-1">
                  {statusDist.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="flex-1 text-slate-300">{s.label}</span>
                      <span className="tabular-nums text-slate-400">{s.n}（{Math.round(s.n / statusTotal * 100)}%）</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 即將到期船期 */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <h2 className="font-bold mb-3">即將到期船期（14 日內）</h2>
              <ul className="text-xs space-y-2">
                {upcoming.map((w) => {
                  const d = daysUntil(w.shipDate);
                  return (
                    <li key={w.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-1.5">
                      <span className="text-slate-300">{w.shipDate.slice(5)} · {w.customer}</span>
                      <span className="font-mono text-cyan-400">{w.woNo}</span>
                      <span className={`tabular-nums font-bold ${d < 0 ? "text-red-400" : d < 7 ? "text-amber-400" : "text-slate-500"}`}>
                        {d >= 0 ? `T-${d}` : `逾${-d}`}
                      </span>
                    </li>
                  );
                })}
                {upcoming.length === 0 && <li className="text-slate-500">14 日內無排定船期</li>}
              </ul>
            </div>
          </section>
        </div>

        {/* 底部 3 欄 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
          {/* 倉庫庫存概況 */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h2 className="font-bold mb-3">倉庫庫存概況</h2>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                // 用分類近似 4 個倉
                const cats = [...new Set(parts.map((p) => p.category))].slice(0, 4);
                const palette = ["#22c55e", "#3b82f6", "#ef4444", "#a855f7"];
                return cats.map((cat, i) => {
                  const catParts = parts.filter((p) => p.category === cat);
                  const util = Math.min(99, 40 + (catParts.length * 7) % 60);
                  return (
                    <div key={cat} className="bg-slate-800/60 rounded-xl p-3">
                      <div className="text-xs text-slate-400">{cat} 區</div>
                      <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: palette[i] }}>{util}%</div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full" style={{ width: `${util}%`, background: palette[i] }} />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{catParts.length} 個料件</div>
                    </div>
                  );
                });
              })()}
            </div>
          </section>

          {/* 庫存健康度 */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h2 className="font-bold mb-3">庫存健康度</h2>
            <div className="flex items-center gap-4">
              <Donut slices={stockHealth} total={healthTotal} center={`${parts.length}`} />
              <ul className="text-xs space-y-1.5 flex-1">
                {stockHealth.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="flex-1 text-slate-300">{s.label}</span>
                    <span className="tabular-nums text-slate-400">{s.n}（{Math.round(s.n / healthTotal * 100)}%）</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 呆滯料 TOP 5 */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <h2 className="font-bold mb-3">呆滯料 TOP 5</h2>
            {slowMoving.length === 0 ? (
              <p className="text-xs text-slate-500">無呆滯料</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="text-slate-500">
                  <tr><th className="text-left py-1">料號 / 品名</th><th className="text-right py-1">庫存值</th><th className="text-right py-1">數量</th></tr>
                </thead>
                <tbody>
                  {slowMoving.map((x) => (
                    <tr key={x.p.id} className="border-t border-slate-800">
                      <td className="py-1.5"><span className="font-mono text-slate-300">{x.p.code}</span><br /><span className="text-slate-500">{x.p.name}</span></td>
                      <td className="py-1.5 text-right tabular-nums text-amber-400">${x.value.toLocaleString()}</td>
                      <td className="py-1.5 text-right tabular-nums text-slate-400">{x.p.stockOnHand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <footer className="mt-6 pt-4 border-t border-slate-800 text-center text-[10px] text-slate-600">
          CHI HUA Pulse v1.0　·　倉儲與製造流程戰情中心　·　資料同步鼎新 ERP iGP
        </footer>
      </main>
    </div>
  );
}

function NavItem({ label, href, active }: { label: string; href?: string; active?: boolean }) {
  const cls = `block mx-3 my-1 px-3 py-2.5 rounded-xl text-sm ${
    active ? "bg-red-600 text-white font-semibold" : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
  }`;
  return href ? <Link href={href} className={cls}>{label}</Link> : <div className={cls}>{label}</div>;
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "cyan" | "blue" | "emerald" | "rose" | "amber" | "slate" }) {
  const accent = {
    cyan: "text-cyan-400", blue: "text-blue-400", emerald: "text-emerald-400",
    rose: "text-red-400", amber: "text-amber-400", slate: "text-slate-200",
  }[tone];
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-3xl font-bold tabular-nums mt-1 ${accent}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-full ${c}`} />{t}</span>;
}

function Donut({ slices, total, center }: { slices: { label: string; n: number; color: string }[]; total: number; center: string }) {
  const R = 42, cx = 56, cy = 56, sw = 16;
  const circ = 2 * Math.PI * R;
  const arcs = slices.reduce<{ list: { color: string; len: number; off: number }[]; acc: number }>(
    (a, s) => {
      const len = total > 0 ? (s.n / total) * circ : 0;
      a.list.push({ color: s.color, len, off: a.acc });
      return { list: a.list, acc: a.acc + len };
    },
    { list: [], acc: 0 }
  ).list;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e293b" strokeWidth={sw} />
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={a.color} strokeWidth={sw}
          strokeDasharray={`${a.len} ${circ - a.len}`} strokeDashoffset={-a.off}
          transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" className="fill-slate-100 text-lg font-bold">{center}</text>
    </svg>
  );
}
