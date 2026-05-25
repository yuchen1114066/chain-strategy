import Link from "next/link";
import { today } from "@/lib/erp/seed";
import { forecastAll, computeOTD, computeForwardOTD, blamingSuppliers } from "@/lib/erp/otif";
import { topDecisions, type DecisionAction } from "@/lib/erp/decision-engine";
import { computeShortageWall } from "@/lib/erp/shortage-ai";
import { equipmentUtilization } from "@/lib/erp/critical-path";
import { commodities, priceZone } from "@/lib/erp/commodities";
import { unconfirmedPOs, missingASNs, earlyWarningSignals, digitalPOs } from "@/lib/erp/supplier-portal";
import { recentEvents, streamStats } from "@/lib/erp/event-bus";
import { DAILY_INGEST_STREAMS } from "@/lib/erp/engine-timeline";

// 首頁 — Autonomous Supply Chain Control Tower
//
// 目的：CEO / VP / 採購總監 3 秒知道公司是否安全
// 不是 ERP Platform、不是 Dashboard，是 AI Supply Chain Operating System
//
// 8 大區塊：
//   ① Global Risk Radar     — 全球風險雷達
//   ② Live Event Stream     — 即時事件流
//   ③ AI Decision Queue     — AI 決策佇列（真正核心）
//   ④ Delivery Health       — 交付健康度
//   ⑤ Supply Health         — 供應健康度
//   ⑥ Positioning           — 系統定位
//   ⑦ Event Density         — 供應鏈事件密度
//   ⑧ World-Class KPIs      — 世界級 KPI

type RiskColor = "red" | "orange" | "yellow" | "green";

function riskLevel(count: number, thresholds: [number, number, number]): RiskColor {
  // thresholds: [orangeMin, redMin, greenMax]  — higher = more risk
  if (count >= thresholds[1]) return "red";
  if (count >= thresholds[0]) return "orange";
  if (count > thresholds[2]) return "yellow";
  return "green";
}

const RISK_DOT: Record<RiskColor, { color: string; label: string; emoji: string }> = {
  red:    { color: "#dc2626", label: "嚴重",    emoji: "🔴" },
  orange: { color: "#ea580c", label: "警示",    emoji: "🟠" },
  yellow: { color: "#f59e0b", label: "注意",    emoji: "🟡" },
  green:  { color: "#10b981", label: "安全",    emoji: "🟢" },
};

export default function CockpitPage() {
  const forecasts = forecastAll();
  const otd = computeOTD();
  const fwd = computeForwardOTD(forecasts);
  const blamers = blamingSuppliers(forecasts);
  const decisions = topDecisions();
  const wall = computeShortageWall();
  const equip = equipmentUtilization();
  const unconf = unconfirmedPOs();
  const missAsn = missingASNs();
  const earlySignals = earlyWarningSignals();
  const stream = streamStats();
  const events = recentEvents();

  // 5 大風險指標
  const shortageRed = wall.filter((w) => w.grade === "S" || w.grade === "A").length;
  const deliveryRisk = forecasts.filter((f) => f.light !== "green").length;
  const materialSurge = commodities.filter((c) => priceZone(c).zone === "危險").length;
  const qualityIssues = digitalPOs.reduce((s, po) => s + po.qualityReports.filter((q) => q.result === "major_defect" || q.result === "rejected").length, 0);
  const supplierOutOfControl = earlySignals.filter((s) => s.severity === "critical").length + blamers.length;

  const risks = [
    { label: "缺料風險",   value: shortageRed,         level: riskLevel(shortageRed, [1, 3, 0]),       href: "/erp/shortage-wall" },
    { label: "準交風險",   value: deliveryRisk,        level: riskLevel(deliveryRisk, [2, 5, 0]),       href: "/erp/eta-forecast" },
    { label: "原料暴漲",   value: materialSurge,       level: riskLevel(materialSurge, [1, 2, 0]),     href: "/erp/materials" },
    { label: "品質異常",   value: qualityIssues,       level: riskLevel(qualityIssues, [1, 3, 0]),     href: "/erp/supplier-portal" },
    { label: "供應商失控", value: supplierOutOfControl, level: riskLevel(supplierOutOfControl, [1, 3, 0]), href: "/erp/supplier-portal/audit" },
  ];

  // Delivery Health
  const delayedWo = forecasts.filter((f) => f.light === "red").length;
  const riskOrders = forecasts.filter((f) => f.light !== "green").length;

  // Supply Health
  const asnDelay = missAsn.filter((m) => m.severity === "critical" || m.severity === "warn").length;
  const poUnconf = unconf.filter((u) => u.hoursOverdue > 0).length;
  const supplierRisk = blamers.length;
  const capacityAlert = equip.filter((e) => e.riskLevel === "critical").length;

  // 8 大世界級 KPI（虛擬基準值；正式版接歷史資料）
  const worldClassKpis = [
    { kpi: "ETA Accuracy",            label: "預測準度",   value: "82%",  benchmark: "≥85%", trend: "↑+3%",  tone: "warn" as const },
    { kpi: "Stockout Prevention",     label: "防停線",     value: "94%",  benchmark: "≥95%", trend: "↑+1%",  tone: "good" as const },
    { kpi: "OTD Improvement",         label: "OTD 提升",   value: `${otd.otd.toFixed(1)}%`, benchmark: "≥95%", trend: "↑+0.5%", tone: otd.otd >= 95 ? "good" : "warn" as const },
    { kpi: "Inventory Reduction",     label: "降庫存",     value: "-8%",  benchmark: "-10%", trend: "↑改善",  tone: "warn" as const },
    { kpi: "Expedite Reduction",      label: "降空運",     value: "-15%", benchmark: "-20%", trend: "↑改善",  tone: "good" as const },
    { kpi: "AI Adoption",             label: "AI 採用率",  value: "73%",  benchmark: "≥80%", trend: "↑+5%",  tone: "warn" as const },
  ];

  // 整體公司安全度（綜合）
  const totalRedRisks = risks.filter((r) => r.level === "red").length;
  const totalOrangeRisks = risks.filter((r) => r.level === "orange").length;
  const overallSafe: RiskColor = totalRedRisks > 0 ? "red" : totalOrangeRisks > 0 ? "orange" : "green";
  const overallLabel = overallSafe === "red" ? "🚨 需要立即介入" : overallSafe === "orange" ? "⚠ 需要關注" : "✅ 公司運轉正常";

  // 取最關鍵 Critical 決策
  const criticalDecisions = decisions.filter((d) => d.urgency === "now").slice(0, 4);
  const todayDecisions = decisions.filter((d) => d.urgency === "today").slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎯 Autonomous Supply Chain Control Tower</h1>
          <p className="text-sm text-slate-500 mt-1">
            CEO / VP / 採購總監　·　3 秒知道公司是否安全
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>基準 {today}　·　Event Stream 即時運轉</div>
          <div className="mt-1 flex items-center gap-1 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-semibold">系統運轉中</span>
          </div>
        </div>
      </header>

      {/* ============ 整體安全度橫幅 ============ */}
      <section className="rounded-xl text-white p-5"
        style={{
          background: overallSafe === "red"
            ? "linear-gradient(135deg, #991b1b, #dc2626)"
            : overallSafe === "orange"
            ? "linear-gradient(135deg, #9a3412, #ea580c)"
            : "linear-gradient(135deg, #065f46, #10b981)",
        }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] tracking-widest uppercase opacity-80">公司供應鏈總安全度</div>
            <div className="text-3xl font-extrabold mt-1">{overallLabel}</div>
            <div className="text-sm opacity-90 mt-1">
              {totalRedRisks > 0 ? `${totalRedRisks} 個紅燈風險、` : ""}
              {totalOrangeRisks > 0 ? `${totalOrangeRisks} 個警示風險、` : ""}
              {stream.critical > 0 ? `${stream.critical} 件 Critical 事件待處理` : "無待處理 Critical 事件"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-80">真實事件流</div>
            <div className="text-2xl font-extrabold tabular-nums">{stream.total}</div>
            <div className="text-[11px] opacity-80">{stream.uniqueGroups} 個獨立事件鏈</div>
          </div>
        </div>
      </section>

      {/* ============ ① Global Risk Radar ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold">🛰 ① Global Risk Radar — 全球風險雷達</h2>
            <p className="text-xs text-slate-500 mt-0.5">5 大風險即時狀態，3 秒看完</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {risks.map((r) => {
            const dot = RISK_DOT[r.level];
            return (
              <Link key={r.label} href={r.href} className="block rounded-lg border-2 p-4 hover:shadow-md transition-shadow"
                style={{ borderColor: dot.color + "55", background: dot.color + "0a" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold">{r.label}</div>
                  <div className="w-5 h-5 rounded-full animate-pulse" style={{ background: dot.color }} />
                </div>
                <div className="text-3xl font-extrabold tabular-nums" style={{ color: dot.color }}>{r.value}</div>
                <div className="text-[11px] font-bold mt-1" style={{ color: dot.color }}>{dot.emoji} {dot.label}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ ② Live Event Stream ============ */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400">② Live Event Stream</div>
            <h2 className="text-lg font-extrabold mt-0.5">即時事件流（最近 {events.length} 筆）</h2>
          </div>
          <Link href="/erp/admin/event-engine" className="text-[11px] text-cyan-300 hover:underline">→ Event Engine</Link>
        </div>
        <div className="space-y-2">
          {events.slice(0, 5).map((e) => {
            const color =
              e.severity === "critical" ? "#f43f5e" :
              e.severity === "high" ? "#f59e0b" :
              e.severity === "medium" ? "#06b6d4" : "#94a3b8";
            return (
              <div key={e.id} className="flex items-center gap-3 bg-slate-800/60 rounded p-2.5 border border-slate-700">
                <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
                <code className="text-[10px] font-mono text-slate-400 shrink-0">{e.type}</code>
                <div className="text-sm flex-1 min-w-0 truncate">
                  {Object.entries(e.payload).map(([k, v]) => <span key={k} className="mr-2 text-xs"><span className="text-slate-500">{k}=</span>{String(v)}</span>)}
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">
                  {new Date(e.occurredAt).toLocaleTimeString("zh-TW", { hour12: false })}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ ③ AI Decision Queue — 真正核心 ============ */}
      <section className="rounded-xl p-5 border-2"
        style={{ borderColor: criticalDecisions.length > 0 ? "#dc2626" : "#06b6d4", background: criticalDecisions.length > 0 ? "#fef2f2" : "#ecfeff" }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold">
              🤖 ③ AI Decision Queue
              {criticalDecisions.length > 0 && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold animate-pulse">
                  {criticalDecisions.length} 個 Critical
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">真正核心 — AI 直接告訴你「該做什麼 + 影響多少」</p>
          </div>
          <Link href="/erp/decisions" className="text-[11px] text-cyan-700 hover:underline">→ 決策閉環中心</Link>
        </div>
        <div className="space-y-2">
          {criticalDecisions.length === 0 && todayDecisions.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-center text-emerald-700">
              ✅ 目前無待決策事項 — 所有信號綠燈
            </div>
          ) : (
            <>
              {criticalDecisions.map((d) => <DecisionRow key={d.id} d={d} urgent />)}
              {todayDecisions.map((d) => <DecisionRow key={d.id} d={d} />)}
            </>
          )}
        </div>
      </section>

      {/* ============ ④ Delivery Health + ⑤ Supply Health ============ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">🚚 ④ Delivery Health — 交付健康度</h2>
          <div className="grid grid-cols-2 gap-3">
            <HealthRow label="OTD"        value={`${otd.otd.toFixed(1)}%`}  tone={otd.otd >= 95 ? "good" : "warn"} target="≥95%" />
            <HealthRow label="OTIF"       value={`${otd.otif.toFixed(1)}%`} tone={otd.otif >= 95 ? "good" : "warn"} target="≥95%" />
            <HealthRow label="Delay WO"   value={`${delayedWo}`}             tone={delayedWo > 5 ? "bad" : delayedWo > 0 ? "warn" : "good"} target="0" />
            <HealthRow label="Risk Orders" value={`${riskOrders}`}            tone={riskOrders > 5 ? "bad" : riskOrders > 0 ? "warn" : "good"} target="≤2" />
          </div>
          <div className="text-[10px] text-slate-500 mt-3">
            🟢 {fwd.greenPct.toFixed(0)}%　·　🟡 {fwd.yellowPct.toFixed(0)}%　·　🔴 {fwd.redPct.toFixed(0)}% 預測
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-bold mb-3">🏭 ⑤ Supply Health — 供應健康度</h2>
          <div className="grid grid-cols-2 gap-3">
            <HealthRow label="ASN Delay"      value={`${asnDelay}`}     tone={asnDelay > 3 ? "bad" : asnDelay > 0 ? "warn" : "good"} target="0" />
            <HealthRow label="PO Unconfirmed" value={`${poUnconf}`}     tone={poUnconf > 3 ? "bad" : poUnconf > 0 ? "warn" : "good"} target="0" />
            <HealthRow label="Supplier Risk"  value={`${supplierRisk}`} tone={supplierRisk > 2 ? "bad" : supplierRisk > 0 ? "warn" : "good"} target="0" />
            <HealthRow label="Capacity Alert" value={`${capacityAlert}`} tone={capacityAlert > 1 ? "bad" : capacityAlert > 0 ? "warn" : "good"} target="≤1" />
          </div>
          <div className="text-[10px] text-slate-500 mt-3">
            🧬 Supplier Digital Twin × {[...new Set(digitalPOs.map((p) => p.supplierId))].length} 家供應商
          </div>
        </div>
      </section>

      {/* ============ ⑦ 供應鏈事件密度 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">📡 ⑦ 供應鏈事件密度 — 真正世界級的關鍵</h2>
            <p className="text-xs text-slate-500 mt-0.5">資料流動 → AI 才會越強。系統每天 ingest 8 個流。</p>
          </div>
          <Link href="/erp/admin/engines" className="text-[11px] text-cyan-700 hover:underline">→ Timeline Graph</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAILY_INGEST_STREAMS.map((s) => (
            <div key={s.name} className="bg-cyan-50/40 rounded border border-cyan-200 p-2.5">
              <div className="font-bold text-sm text-cyan-700">{s.name}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
              <div className="text-[10px] text-slate-600 mt-1 leading-snug">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ⑧ 世界級 KPI（真正最重要） ============ */}
      <section className="bg-gradient-to-br from-slate-50 to-cyan-50 rounded-xl border-2 border-cyan-200 p-5">
        <div className="mb-3">
          <h2 className="font-bold text-lg">🌍 ⑧ World-Class KPIs — 不是頁數，是成果</h2>
          <p className="text-xs text-slate-500 mt-0.5">真正最重要的 KPI 不是「系統頁數」，而是「世界級基準點」</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {worldClassKpis.map((k) => (
            <div key={k.kpi} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">{k.kpi}</div>
              <div className="text-[11px] text-slate-600">{k.label}</div>
              <div className={`text-2xl font-extrabold tabular-nums mt-1 ${
                k.tone === "good" ? "text-emerald-600" : k.tone === "warn" ? "text-amber-600" : "text-rose-600"
              }`}>{k.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">目標 {k.benchmark}</div>
              <div className="text-[10px] text-emerald-700 font-bold">{k.trend}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ⑥ 真正定位 ============ */}
      <section className="bg-slate-900 text-white rounded-xl p-5 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 items-center">
          <div>
            <div className="text-[10px] tracking-widest uppercase text-slate-400 font-bold">系統真正定位（重要）</div>
            <div className="text-2xl font-extrabold mt-1">
              <span className="line-through text-slate-500 text-base mr-2">ERP Platform / Dashboard</span>
            </div>
            <div className="text-3xl font-extrabold mt-2 text-cyan-300">
              Autonomous Supply Chain Control Tower
            </div>
            <div className="text-sm text-slate-300 mt-2">
              AI Supply Chain Operating System — 不是看現在，是預測未來 + 直接推薦最佳方案。
              真正的價值不是頁面多，是<b>供應鏈事件密度</b>夠高、AI 持續學習、決策準確度持續提升。
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link href="/erp/admin/engines" className="bg-slate-800/60 rounded p-3 border border-slate-700 hover:border-cyan-500">
              <div className="text-2xl">🧠</div>
              <div className="font-bold mt-1">4 大 Engine</div>
              <div className="text-[10px] text-slate-400">Event / Twin / Predict / Time</div>
            </Link>
            <Link href="/erp/admin/observability" className="bg-slate-800/60 rounded p-3 border border-slate-700 hover:border-cyan-500">
              <div className="text-2xl">🔭</div>
              <div className="font-bold mt-1">Observability</div>
              <div className="text-[10px] text-slate-400">Trace + Explain + Lineage</div>
            </Link>
          </div>
        </div>
      </section>

      <p className="text-[11px] text-slate-500 text-center">
        對鼎新 ERP 唯讀不回寫　·　扣帳一律回 ERP 操作　·　所有預警 / 決策 / 評分由本系統自治
      </p>
    </div>
  );
}

function DecisionRow({ d, urgent }: { d: DecisionAction; urgent?: boolean }) {
  return (
    <Link href={d.sourceLink ?? "#"} className={`block rounded-lg border-2 p-3 transition-shadow hover:shadow-md ${
      urgent ? "border-rose-400 bg-white" : "border-amber-300 bg-white"
    }`}>
      <div className="flex items-start gap-3 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold shrink-0 ${
          urgent ? "bg-rose-600" : "bg-amber-500"
        }`}>{urgent ? "[Critical]" : "[Today]"}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{d.contextLine.split("·")[0].trim()}</div>
          <div className="text-xs text-slate-700 mt-1">
            <b className="text-slate-900">建議：</b>{d.whatToDoNow}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            <b>影響：</b>避免 ${(d.revenueAtRisk / 10000).toFixed(0)} 萬損失
            <span className="text-slate-400 mx-1">·</span>
            成本 ${(d.costImpact / 10000).toFixed(1)} 萬
          </div>
        </div>
        <span className="font-mono text-xs text-cyan-700 font-bold shrink-0">{d.sourceLabel}</span>
      </div>
    </Link>
  );
}

function HealthRow({ label, value, tone, target }: { label: string; value: string; tone: "good" | "warn" | "bad"; target: string }) {
  const colors = {
    good: "border-emerald-300 bg-emerald-50/30 text-emerald-700",
    warn: "border-amber-300 bg-amber-50/30 text-amber-700",
    bad:  "border-rose-400 bg-rose-50/30 text-rose-700",
  };
  return (
    <div className={`rounded-lg border-2 p-3 ${colors[tone]}`}>
      <div className="text-[10px] tracking-widest text-slate-600 font-bold uppercase">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums mt-1">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">目標 {target}</div>
    </div>
  );
}
