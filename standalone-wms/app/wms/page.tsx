import Link from "next/link";
import { workOrders, models, today, parts } from "@/lib/erp/seed";
import { computeAlerts, computePartDemand } from "@/lib/erp/alerts";
import { computeInventoryKpis } from "@/lib/erp/inventory-health";
import LiveClock from "@/components/erp/LiveClock";

// CHI HUA Pulse — WMS 智慧倉儲戰情 Dashboard
// 套用 Stitch chi_hua_pulse_wms_v2 版型：淺色暖調 + 玻璃擬態 + 紅色 pulse 漸層

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
  const onTime = done.filter((w) => {
    const ship = w.stages.find((s) => s.stage === "ship");
    return ship?.actualDate && ship.actualDate <= w.shipDate;
  });
  const onTimePct = done.length ? (onTime.length / done.length) * 100 : 92.3;
  const totalStockValue = parts.reduce((s, p) => s + p.stockOnHand * p.unitCost, 0);
  const shortageParts = demand.filter((d) => d.shortage > 0);
  const invKpis = computeInventoryKpis();

  const stockHealth = [
    { label: "健康庫存", n: parts.filter((p) => p.stockOnHand >= p.safetyStock).length, color: "#16a34a" },
    { label: "低庫存", n: parts.filter((p) => p.stockOnHand < p.safetyStock && p.stockOnHand > 0).length, color: "#f59e0b" },
    { label: "缺料", n: shortageParts.length, color: "#dc2626" },
  ];
  const healthTotal = parts.length || 1;

  const upcoming = active
    .filter((w) => { const d = daysUntil(w.shipDate); return d >= -14 && d <= 14; })
    .sort((a, b) => a.shipDate.localeCompare(b.shipDate))
    .slice(0, 5);

  // 倉區熱力（用分類近似）
  const cats = [...new Set(parts.map((p) => p.category))].slice(0, 4);
  const zones = cats.map((cat, i) => {
    const catParts = parts.filter((p) => p.category === cat);
    const util = Math.min(96, 35 + (catParts.length * 9) % 62);
    return { name: `${cat} 區`, util, count: catParts.length, idx: i };
  });

  return (
    <div className="min-h-screen text-[#281715]" style={{ background: "#fff8f7", fontFamily: "Montserrat, system-ui, sans-serif" }}>
      {/* ===== 頂部導覽（sticky 玻璃）===== */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-10 border-b border-rose-200/40"
        style={{ background: "rgba(255,248,247,0.85)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-5">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: "#b70011" }}>CHI HUA Pulse</span>
          <div className="hidden md:flex items-center bg-white/70 border border-rose-200/50 rounded-full px-4 py-1.5">
            <span className="text-rose-300">🔍</span>
            <input className="bg-transparent border-none outline-none text-sm px-2 w-56" placeholder="搜尋訂單 / 料件 / 客戶…" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/wms" title="standalone — 跨模組連結已停用" className="text-white text-sm font-semibold px-5 py-2 rounded-full hover:scale-105 active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg,#b70011,#dc2626)" }}>
            🚨 異常中心
          </Link>
          <span className="bg-white/70 border border-rose-200/50 rounded-full px-3 py-2 text-sm">🔔 {alerts.length}</span>
          <span className="hidden lg:flex items-center gap-2 bg-white/70 border border-rose-200/50 rounded-full pl-1 pr-4 py-1 text-sm">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#dc2626" }}>祺</span>
            祺驊
          </span>
        </div>
      </header>

      <div className="flex">
        {/* ===== 左側固定 sidebar ===== */}
        <aside className="w-60 shrink-0 min-h-[calc(100vh-4rem)] bg-white/60 border-r border-rose-200/40 flex flex-col">
          <nav className="p-3 space-y-1.5">
            <SideItem icon="📊" label="WMS Dashboard" active />
            <SideItem icon="🎯" label="戰情室" href="/erp" />
            <SideItem icon="🌊" label="流程綜觀" href="/wms" title="standalone — 跨模組連結已停用" />
            <SideItem icon="📈" label="可視化儀表板" href="/wms" title="standalone — 跨模組連結已停用" />
            <SideItem icon="🏭" label="製造流程追蹤" href="/wms" title="standalone — 跨模組連結已停用" />
            <SideItem icon="🚨" label="異常警訊 + AI" href="/wms" title="standalone — 跨模組連結已停用" />
            <SideItem icon="📥" label="鼎新報表同步" href="/wms" title="standalone — 跨模組連結已停用" />
            <SideItem icon="📱" label="QR 查碼" href="/wms" title="standalone — 跨模組連結已停用" />
          </nav>
          <div className="mt-auto p-4 border-t border-rose-200/40">
            <div className="text-xs text-[#5c403c] mb-1">⏱ <LiveClock /></div>
            <div className="flex items-center gap-1.5 text-xs mt-2 font-semibold" style={{ color: "#b70011" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#b70011" }} />
              系統狀態：運作中
            </div>
          </div>
        </aside>

        {/* ===== 主內容 ===== */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1500px]">
          {/* 頁首 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#b70011" }}>Intelligent Logistics</span>
              <h1 className="text-3xl font-extrabold mt-1">WMS 智慧倉儲戰情中心</h1>
              <p className="text-[#5c403c] mt-1 text-sm">倉儲與製造流程一站式監控　·　基準日 {today}　·　資料同步鼎新 ERP</p>
            </div>
            <div className="flex gap-2">
              <Link href="/wms/receiving" className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", boxShadow: "0 8px 24px rgba(8,145,178,.25)" }}>
                📥 收貨 Checklist
              </Link>
              <Link href="/wms" title="standalone — 跨模組連結已停用" className="flex items-center gap-2 px-5 py-2.5 bg-white/80 border border-rose-200/50 rounded-xl text-sm font-semibold hover:bg-white transition-colors">
                📊 報表匯入
              </Link>
              <Link href="/wms" title="standalone — 跨模組連結已停用" className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-105 active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg,#b70011,#dc2626)", boxShadow: "0 8px 24px rgba(183,0,17,0.25)" }}>
                📋 工單追蹤
              </Link>
            </div>
          </div>

          {/* 健康卡 + 異常欄 grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
            <HealthCard icon="💰" label="總庫存價值" value={`$${(totalStockValue / 10000).toFixed(0)}萬`} tag="↑ 即時" accent="#316bf3" />
            <HealthCard icon="✅" label="準時完成率" value={`${onTimePct.toFixed(1)}%`} tag={onTimePct >= 90 ? "達標" : "待改善"} accent="#16a34a" />
            <HealthCard icon="📦" label="在製訂單" value={`${active.length}`} tag={`平均交期估算`} accent="#dc2626" />

            {/* Critical Alerts 欄（佔 2 row）*/}
            <div className="lg:row-span-2 rounded-xl p-5 flex flex-col"
              style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.4)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">⚠️ 即時異常警訊</h3>
                <span className="text-white px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#dc2626" }}>
                  {alerts.filter((a) => a.severity === "red").length} 紅燈
                </span>
              </div>
              <div className="space-y-2 flex-grow">
                {alerts.slice(0, 6).map((a) => (
                  <div key={a.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    a.severity === "red" ? "border-rose-300/40 hover:bg-rose-50" : "border-amber-300/40 hover:bg-amber-50"
                  }`} style={{ background: a.severity === "red" ? "rgba(255,218,214,0.35)" : "rgba(254,243,199,0.4)" }}>
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-[11px] text-[#5c403c] truncate">{a.detail}</p>
                  </div>
                ))}
                {alerts.length === 0 && <p className="text-sm text-emerald-700">✅ 目前無異常</p>}
              </div>
              <Link href="/wms" title="standalone — 跨模組連結已停用" className="w-full mt-3 py-2.5 text-center text-sm font-bold text-[#5c403c] hover:bg-white/60 rounded-xl transition-colors">
                查看全部異常 →
              </Link>
            </div>

            {/* 倉區熱力圖（佔 3 欄）*/}
            <div className="lg:col-span-3 rounded-xl p-5 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.4)",
                backgroundImage: "radial-gradient(circle,#e6bdb8 1px,transparent 1px)",
                backgroundSize: "20px 20px",
              }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold">倉區庫存熱力圖</h3>
                  <div className="flex gap-4 mt-2 text-[11px] text-[#5c403c]">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500" />吃緊 (85%+)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" />正常 (50-85%)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" />寬鬆 (&lt;50%)</span>
                  </div>
                </div>
                <Link href="/wms" title="standalone — 跨模組連結已停用" className="text-xs font-semibold" style={{ color: "#b70011" }}>查看分析 →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {zones.map((z) => {
                  const tone = z.util >= 85 ? { bg: "rgba(220,38,38,0.12)", bd: "rgba(220,38,38,0.4)", tx: "#dc2626" }
                    : z.util >= 50 ? { bg: "rgba(49,107,243,0.12)", bd: "rgba(49,107,243,0.35)", tx: "#316bf3" }
                    : { bg: "rgba(22,163,74,0.12)", bd: "rgba(22,163,74,0.35)", tx: "#16a34a" };
                  return (
                    <div key={z.name} className="rounded-xl p-4 transition-transform hover:scale-[1.03]"
                      style={{ background: tone.bg, border: `2px solid ${tone.bd}` }}>
                      <div className="text-sm font-bold" style={{ color: tone.tx }}>{z.name}</div>
                      <div className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: tone.tx }}>{z.util}%</div>
                      <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mt-2">
                        <div className="h-full rounded-full" style={{ width: `${z.util}%`, background: tone.tx }} />
                      </div>
                      <div className="text-[10px] text-[#5c403c] mt-1">{z.count} 個料件</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== 庫存健康 5 大指標（DOH / Turnover / Excess / Aging / Safety Stock）===== */}
          <section className="rounded-xl p-5 mb-5"
            style={{ background: "linear-gradient(135deg, #281715 0%, #3a2520 100%)", color: "#fff" }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#ffb4ab" }}>Inventory Health KPIs</div>
                <h3 className="text-lg font-extrabold mt-0.5">庫存健康度 5 大指標 — Global AI 必加</h3>
              </div>
              <div className="text-[11px] opacity-70">基準日 {today}　·　料件總數 {invKpis.totalParts}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <InvKpi
                code="DOH"
                label="庫存可撐天數"
                value={invKpis.dohMedian >= 999 ? "∞" : invKpis.dohMedian.toFixed(0) + " 天"}
                sub={`${invKpis.dohRiskCount} 件 < 7 天`}
                tone={invKpis.dohRiskCount > 5 ? "rose" : invKpis.dohRiskCount > 0 ? "amber" : "emerald"}
              />
              <InvKpi
                code="Turnover"
                label="周轉率（年）"
                value={invKpis.turnoverAvg.toFixed(1) + "×"}
                sub="健康 ≥ 6×"
                tone={invKpis.turnoverAvg >= 6 ? "emerald" : invKpis.turnoverAvg >= 3 ? "amber" : "rose"}
              />
              <InvKpi
                code="Excess"
                label="過剩庫存"
                value={`${invKpis.excessCount} 件`}
                sub={`$${(invKpis.excessValue / 10000).toFixed(0)}萬`}
                tone={invKpis.excessCount > 10 ? "rose" : invKpis.excessCount > 0 ? "amber" : "emerald"}
              />
              <InvKpi
                code="Aging"
                label="呆滯天數 > 180"
                value={`${invKpis.agingCount} 件`}
                sub={`$${(invKpis.agingValue / 10000).toFixed(0)}萬`}
                tone={invKpis.agingCount > 5 ? "rose" : invKpis.agingCount > 0 ? "amber" : "emerald"}
              />
              <InvKpi
                code="Safety Stock"
                label="安全庫存達成率"
                value={`${invKpis.safetyCompliance.toFixed(0)}%`}
                sub={`${invKpis.belowSafetyCount} 件低於安全`}
                tone={invKpis.safetyCompliance >= 95 ? "emerald" : invKpis.safetyCompliance >= 80 ? "amber" : "rose"}
              />
            </div>
            <div className="text-[10px] mt-3 opacity-70">
              🤖 AI 規則：DOH &lt; 7 天 → 缺料風險　·　Turnover &lt; 3 → 庫存積壓　·　Aging &gt; 180 天 → 呆滯料　·　Safety &lt; 95% → 缺料警示
            </div>
          </section>

          {/* End-to-End 流程追蹤 */}
          <section className="rounded-xl overflow-hidden mb-5"
            style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.4)" }}>
            <div className="p-5 border-b border-rose-200/40 flex justify-between items-center">
              <h3 className="font-extrabold text-lg">End-to-End 製造流程追蹤</h3>
              <span className="text-xs text-[#5c403c] italic">資料同步鼎新 ERP · <LiveClock /></span>
            </div>
            <div className="hidden md:grid grid-cols-[150px_repeat(8,1fr)_96px] gap-1 text-[10px] text-[#5c403c] px-5 pt-3 font-semibold">
              <div />
              {WMS_STAGES.map((s, i) => <div key={s} className="text-center">{i + 1}.{s}</div>)}
              <div className="text-right">進度</div>
            </div>
            <div className="px-3 pb-3">
              {workOrders.map((w) => {
                const m = models.find((m) => m.id === w.modelId);
                const dleft = daysUntil(w.shipDate);
                const wAlerts = alerts.filter((a) => a.woId === w.id);
                const hasRed = wAlerts.some((a) => a.severity === "red");
                const doneCount = w.stages.filter((s) => s.status === "done").length;
                const progress = Math.round((doneCount / 8) * 100);
                const priority = hasRed ? "Critical" : dleft < 7 ? "High" : w.status === "planning" ? "Low" : "Normal";
                const prTone = priority === "Critical" ? "#dc2626" : priority === "High" ? "#f59e0b" : priority === "Low" ? "#94a3b8" : "#316bf3";
                return (
                  <Link key={w.id} href="/wms" title="standalone — 跨模組連結已停用"
                    className="grid grid-cols-[150px_repeat(8,1fr)_96px] gap-1 items-center rounded-lg px-2 py-2.5 hover:bg-rose-50/60 transition-colors">
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold" style={{ color: hasRed ? "#dc2626" : "#b70011" }}>{w.woNo}</div>
                      <div className="text-[10px] text-[#5c403c] truncate">{w.customer} · {m?.code}</div>
                    </div>
                    {w.stages.map((s, i) => {
                      const late = !s.actualDate && s.plannedDate < today && s.status !== "done";
                      const bg = s.status === "done" ? "#16a34a"
                        : s.status === "in_progress" ? "#316bf3"
                        : s.status === "blocked" ? "#dc2626"
                        : late ? "#f59e0b" : "#e2d4d1";
                      const icon = s.status === "done" ? "✓" : s.status === "blocked" ? "✕"
                        : s.status === "in_progress" ? "●" : late ? "!" : "";
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: bg, boxShadow: s.status === "in_progress" ? "0 0 0 3px rgba(49,107,243,0.25)" : "none" }}>
                            {icon}
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums">{progress}%</div>
                      <div className="h-1.5 rounded-full overflow-hidden my-1" style={{ background: "#f0dcd9" }}>
                        <div className="h-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#b70011,#f97316)" }} />
                      </div>
                      <span className="inline-block text-[8px] px-1.5 py-0.5 rounded text-white font-bold" style={{ background: prTone }}>
                        {priority}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 底部：庫存健康度 + 即將到期船期 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.4)" }}>
              <h3 className="font-bold mb-3">庫存健康度</h3>
              <div className="flex items-center gap-5">
                <Donut slices={stockHealth} total={healthTotal} center={`${parts.length}`} />
                <ul className="text-sm space-y-2 flex-1">
                  {stockHealth.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                      <span className="flex-1">{s.label}</span>
                      <span className="tabular-nums text-[#5c403c]">{s.n}（{Math.round(s.n / healthTotal * 100)}%）</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.4)" }}>
              <h3 className="font-bold mb-3">即將到期船期（14 日內）</h3>
              <ul className="text-sm space-y-2">
                {upcoming.map((w) => {
                  const d = daysUntil(w.shipDate);
                  return (
                    <li key={w.id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                      <span>{w.shipDate.slice(5)} · {w.customer}</span>
                      <span className="font-mono" style={{ color: "#b70011" }}>{w.woNo}</span>
                      <span className={`tabular-nums font-bold ${d < 0 ? "text-rose-600" : d < 7 ? "text-amber-600" : "text-[#5c403c]"}`}>
                        {d >= 0 ? `T-${d}` : `逾${-d}`}
                      </span>
                    </li>
                  );
                })}
                {upcoming.length === 0 && <li className="text-[#5c403c]">14 日內無排定船期</li>}
              </ul>
            </section>
          </div>

          <footer className="mt-6 pt-4 border-t border-rose-200/40 text-center text-[11px] text-[#916f6b]">
            CHI HUA Pulse · WMS 智慧倉儲戰情中心 · v2　·　© 祺驊股份有限公司
          </footer>
        </main>
      </div>
    </div>
  );
}

function SideItem({ icon, label, href, active }: { icon: string; label: string; href?: string; active?: boolean }) {
  const cls = `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all ${
    active
      ? "font-bold text-white"
      : "text-[#5c403c] hover:bg-rose-100/60 hover:translate-x-1"
  }`;
  const style = active ? { background: "linear-gradient(135deg,#b70011,#dc2626)" } : undefined;
  return href
    ? <Link href={href} className={cls} style={style}><span>{icon}</span><span>{label}</span></Link>
    : <div className={cls} style={style}><span>{icon}</span><span>{label}</span></div>;
}

function HealthCard({ icon, label, value, tag, accent }: { icon: string; label: string; value: string; tag: string; accent: string }) {
  return (
    <div className="rounded-xl p-5 space-y-3"
      style={{
        background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.4)", borderLeft: `4px solid ${accent}`,
      }}>
      <div className="flex justify-between items-start">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] px-2 py-1 rounded font-semibold" style={{ background: `${accent}1a`, color: accent }}>{tag}</span>
      </div>
      <div>
        <p className="text-sm text-[#5c403c]">{label}</p>
        <h2 className="text-3xl font-extrabold tabular-nums mt-0.5">{value}</h2>
      </div>
    </div>
  );
}

function InvKpi({ code, label, value, sub, tone }: { code: string; label: string; value: string; sub: string; tone: "emerald" | "amber" | "rose" }) {
  const accent = tone === "emerald" ? "#34d399" : tone === "amber" ? "#fbbf24" : "#fb7185";
  return (
    <div className="rounded-lg px-3 py-3"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: accent }}>{code}</div>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>
    </div>
  );
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
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f0dcd9" strokeWidth={sw} />
      {arcs.map((a, i) => (
        <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={a.color} strokeWidth={sw}
          strokeDasharray={`${a.len} ${circ - a.len}`} strokeDashoffset={-a.off}
          transform={`rotate(-90 ${cx} ${cy})`} />
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" className="fill-[#281715] text-lg font-extrabold">{center}</text>
    </svg>
  );
}
