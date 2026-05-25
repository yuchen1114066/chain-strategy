import Link from "next/link";
import { today } from "@/lib/erp/seed";
import { forecastAll, computeOTD, blamingSuppliers } from "@/lib/erp/otif";
import { topDecisions, type DecisionAction } from "@/lib/erp/decision-engine";
import { computeShortageWall } from "@/lib/erp/shortage-ai";
import { equipmentUtilization } from "@/lib/erp/critical-path";
import { commodities, priceZone } from "@/lib/erp/commodities";
import { unconfirmedPOs, missingASNs, earlyWarningSignals, digitalPOs } from "@/lib/erp/supplier-portal";
import { streamStats, recentEvents } from "@/lib/erp/event-bus";
import { getDict } from "@/lib/erp/i18n-server";

// L1 軍事作戰指揮中心 — Military Command Center
//
// BOSS 視角，只回答 2 個問題：
//   ① 哪裡快爆了？ (Where is burning?)
//   ② 該先救哪裡？ (What should we save first?)

type Severity = "critical" | "high" | "medium" | "low" | "safe";

const SEV_COLOR: Record<Severity, string> = {
  critical: "#dc2626", high: "#ea580c", medium: "#f59e0b", low: "#06b6d4", safe: "#10b981",
};

export default async function CockpitPage() {
  const T = await getDict();
  const forecasts = forecastAll();
  const otd = computeOTD();
  const wall = computeShortageWall();
  const equip = equipmentUtilization();
  const unconf = unconfirmedPOs();
  const missAsn = missingASNs();
  const signals = earlyWarningSignals();
  const blamers = blamingSuppliers(forecasts);
  const decisions = topDecisions();
  const stream = streamStats();
  const events = recentEvents();

  // === 5 大熱區（Where is burning?） ===
  const hotZones: { name: string; count: number; severity: Severity; href: string; icon: string; desc: string }[] = [
    {
      name: T.risk_shortage, icon: "🧱",
      count: wall.filter((w) => w.grade === "S").length,
      severity: wall.filter((w) => w.grade === "S").length > 0 ? "critical" : wall.filter((w) => w.grade === "A").length > 0 ? "high" : "safe",
      href: "/erp/shortage-wall",
      desc: `S 級 ${wall.filter((w) => w.grade === "S").length}　·　A 級 ${wall.filter((w) => w.grade === "A").length}`,
    },
    {
      name: T.risk_delivery, icon: "🚚",
      count: forecasts.filter((f) => f.light === "red").length,
      severity: forecasts.filter((f) => f.light === "red").length > 0 ? "critical" : forecasts.filter((f) => f.light === "yellow").length > 2 ? "high" : "safe",
      href: "/erp/eta-forecast",
      desc: `紅燈 ${forecasts.filter((f) => f.light === "red").length}　·　黃燈 ${forecasts.filter((f) => f.light === "yellow").length}`,
    },
    {
      name: T.risk_material, icon: "🌐",
      count: commodities.filter((c) => priceZone(c).zone === "危險").length,
      severity: commodities.filter((c) => priceZone(c).zone === "危險").length >= 2 ? "critical" : commodities.filter((c) => priceZone(c).zone === "危險").length === 1 ? "high" : "safe",
      href: "/erp/materials",
      desc: `${commodities.filter((c) => priceZone(c).zone === "危險").length} 項過熱`,
    },
    {
      name: T.risk_quality, icon: "🔬",
      count: digitalPOs.reduce((s, po) => s + po.qualityReports.filter((q) => q.result === "major_defect" || q.result === "rejected").length, 0),
      severity: "high",
      href: "/erp/supplier-portal",
      desc: `近期不良 / 退貨累積`,
    },
    {
      name: T.risk_supplier, icon: "🏭",
      count: signals.filter((s) => s.severity === "critical").length + blamers.length,
      severity: signals.filter((s) => s.severity === "critical").length > 0 ? "critical" : "medium",
      href: "/erp/supplier-portal/audit",
      desc: `預警前兆 ${signals.filter((s) => s.severity === "critical").length} · 拖累 ${blamers.length}`,
    },
  ];

  // === Triage 優先序（What should we save first?） ===
  const criticalDecisions = decisions.filter((d) => d.urgency === "now").slice(0, 4);
  const todayDecisions = decisions.filter((d) => d.urgency === "today").slice(0, 3);

  // 整體危險度
  const burningCount = hotZones.filter((h) => h.severity === "critical").length;
  const warningCount = hotZones.filter((h) => h.severity === "high").length;
  const overallSafe = burningCount === 0 && warningCount === 0;

  return (
    <div className="min-h-screen text-slate-100" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 50%,#1a0a0a 100%)" }}>
      <div className="p-6 space-y-6 max-w-[1500px] mx-auto">

        {/* === Header — 軍事風 === */}
        <header className="flex items-end justify-between flex-wrap gap-3 border-b border-rose-500/30 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-[0.3em] uppercase text-rose-400 font-bold">CHI HUA · {T.system_name_en}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold animate-pulse">LIVE</span>
            </div>
            <h1 className="text-3xl font-extrabold">{T.l1_title}</h1>
            <p className="text-sm text-slate-400 mt-1">{T.l1_subtitle}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div className="font-mono">基準 {today}　·　{T.situation_report}</div>
            <div className="mt-1 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-semibold tracking-widest text-[10px]">SYSTEM OPERATIONAL</span>
            </div>
          </div>
        </header>

        {/* === BOSS 大字結論 === */}
        <section className="rounded-xl p-6 border-2"
          style={{
            background: burningCount > 0 ? "linear-gradient(135deg,#7f1d1d,#dc2626)" : warningCount > 0 ? "linear-gradient(135deg,#7c2d12,#ea580c)" : "linear-gradient(135deg,#064e3b,#10b981)",
            borderColor: burningCount > 0 ? "#fca5a5" : warningCount > 0 ? "#fdba74" : "#6ee7b7",
          }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[11px] tracking-[0.3em] uppercase opacity-80 font-bold">BOSS QUESTION #1</div>
              <div className="text-2xl font-bold mt-1">{T.l1_q1}</div>
              <div className="text-5xl font-black mt-2 tracking-tight">
                {overallSafe
                  ? "✅ NOTHING BURNING"
                  : burningCount > 0
                  ? `🔥 ${burningCount} ZONES BURNING`
                  : `⚠ ${warningCount} ZONES WARNING`}
              </div>
              <div className="text-sm opacity-90 mt-2">
                {stream.critical > 0 && <>{stream.critical} Critical 事件待處理　·　</>}
                {decisions.length} 個 AI 待決策
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] opacity-80">事件流</div>
              <div className="text-4xl font-extrabold tabular-nums">{stream.total}</div>
              <div className="text-[11px] opacity-80">{stream.uniqueGroups} 個獨立事件鏈</div>
            </div>
          </div>
        </section>

        {/* === Hot Zones 5 個火警燈 === */}
        <section>
          <div className="text-[11px] tracking-[0.3em] uppercase text-rose-400 font-bold mb-3">
            🔥 {T.hot_zones}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {hotZones.map((h) => (
              <Link key={h.name} href={h.href} className="block rounded-lg p-4 border-2 transition-transform hover:scale-[1.02]"
                style={{
                  background: SEV_COLOR[h.severity] + "20",
                  borderColor: SEV_COLOR[h.severity] + "70",
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{h.icon}</span>
                  <div className={`w-6 h-6 rounded-full ${h.severity === "safe" ? "" : "animate-pulse"}`} style={{ background: SEV_COLOR[h.severity] }} />
                </div>
                <div className="text-[10px] tracking-widest text-slate-300 font-bold uppercase">{h.name}</div>
                <div className="text-4xl font-black tabular-nums mt-1" style={{ color: SEV_COLOR[h.severity] }}>{h.count}</div>
                <div className="text-[10px] text-slate-400 mt-1">{h.desc}</div>
                <div className="text-[10px] font-bold mt-1" style={{ color: SEV_COLOR[h.severity] }}>
                  {h.severity === "critical" ? "🔥 BURNING" :
                   h.severity === "high" ? "⚠ WARNING" :
                   h.severity === "medium" ? "👁 WATCH" : "✅ CLEAR"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* === Triage — 救援優先序 === */}
        <section className="rounded-xl p-5 border-2 border-rose-500/50 bg-slate-900/60">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <div className="text-[11px] tracking-[0.3em] uppercase text-amber-400 font-bold">BOSS QUESTION #2</div>
              <h2 className="text-xl font-extrabold">{T.l1_q2}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{T.triage} — AI 推薦救援順序</p>
            </div>
            <Link href="/erp/decisions" className="text-[11px] text-cyan-300 hover:underline font-bold">→ 決策閉環中心</Link>
          </div>

          {criticalDecisions.length === 0 && todayDecisions.length === 0 ? (
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-4 text-center text-emerald-300">
              ✅ 目前無待救援事項 — 全線清空
            </div>
          ) : (
            <div className="space-y-2">
              {criticalDecisions.map((d, i) => <TriageRow key={d.id} d={d} rank={i + 1} urgent />)}
              {todayDecisions.map((d, i) => <TriageRow key={d.id} d={d} rank={criticalDecisions.length + i + 1} />)}
            </div>
          )}
        </section>

        {/* === 即時事件流 (Sit Rep) === */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
            <div className="text-[11px] tracking-[0.3em] uppercase text-cyan-400 font-bold mb-3">📡 LIVE EVENT FEED</div>
            <div className="space-y-2">
              {events.slice(0, 6).map((e) => {
                const color = e.severity === "critical" ? "#f43f5e" : e.severity === "high" ? "#f59e0b" : e.severity === "medium" ? "#06b6d4" : "#94a3b8";
                return (
                  <div key={e.id} className="flex items-center gap-3 bg-slate-800/60 rounded p-2.5 border border-slate-700">
                    <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
                    <code className="text-[10px] font-mono text-slate-400 shrink-0">{e.type}</code>
                    <div className="text-sm flex-1 min-w-0 truncate">
                      {Object.entries(e.payload).map(([k, v]) => <span key={k} className="mr-2 text-xs"><span className="text-slate-500">{k}=</span>{String(v)}</span>)}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 tabular-nums font-mono">
                      {new Date(e.occurredAt).toLocaleTimeString("zh-TW", { hour12: false })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health Snapshot */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
            <div className="text-[11px] tracking-[0.3em] uppercase text-emerald-400 font-bold mb-3">📊 HEALTH SNAPSHOT</div>
            <div className="space-y-2">
              <HealthRow label={T.kpi_otd} value={`${otd.otd.toFixed(1)}%`} target="≥95" good={otd.otd >= 95} />
              <HealthRow label={T.kpi_otif} value={`${otd.otif.toFixed(1)}%`} target="≥95" good={otd.otif >= 95} />
              <HealthRow label="ASN Delay" value={`${missAsn.filter((m) => m.severity === "critical").length}`} target="0" good={missAsn.filter((m) => m.severity === "critical").length === 0} />
              <HealthRow label="PO Unconfirmed" value={`${unconf.filter((u) => u.hoursOverdue > 0).length}`} target="0" good={unconf.filter((u) => u.hoursOverdue > 0).length === 0} />
              <HealthRow label="Equipment ≥92%" value={`${equip.filter((e) => e.riskLevel === "critical").length}`} target="0" good={equip.filter((e) => e.riskLevel === "critical").length === 0} />
            </div>
          </div>
        </section>

        {/* === 6 Centers 快速進入 === */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { slug: "supplier",      label: T.center_supplier,      emoji: "🤝", grad: "from-cyan-600 to-blue-700" },
            { slug: "delivery",      label: T.center_delivery,      emoji: "🚚", grad: "from-emerald-600 to-teal-700" },
            { slug: "manufacturing", label: T.center_manufacturing, emoji: "🏭", grad: "from-blue-600 to-indigo-700" },
            { slug: "inventory",     label: T.center_inventory,     emoji: "📦", grad: "from-amber-600 to-orange-700" },
            { slug: "procurement",   label: T.center_procurement,   emoji: "💎", grad: "from-violet-600 to-purple-700" },
            { slug: "decision",      label: T.center_decision,      emoji: "🧠", grad: "from-rose-600 to-pink-700" },
          ].map((c) => (
            <Link key={c.slug} href={`/os/${c.slug}`} className={`block rounded-lg p-3 bg-gradient-to-br ${c.grad} hover:scale-105 transition-transform`}>
              <div className="text-2xl">{c.emoji}</div>
              <div className="text-xs font-bold mt-1">{c.label}</div>
              <code className="text-[9px] font-mono opacity-70">/os/{c.slug}</code>
            </Link>
          ))}
        </section>

        {/* === 5-Layer 架構入口 === */}
        <section className="rounded-xl bg-slate-900/60 border border-slate-700 p-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-300">
            <span className="text-[10px] tracking-widest text-cyan-400 font-bold uppercase">System Architecture</span>
            <br />
            5-Layer 軍事架構：Command Center → Operational Centers → Expert Workbench → AI Engine → Data/Event/Governance
          </div>
          <Link href="/architecture" className="px-4 py-2 text-sm rounded bg-cyan-600 text-white font-bold hover:bg-cyan-700">
            🏛 看完整 5-Layer 架構 →
          </Link>
        </section>

        <p className="text-[10px] text-slate-500 text-center">
          {T.brand_full}　·　對鼎新 ERP 唯讀不回寫　·　扣帳一律回 ERP 操作
        </p>
      </div>
    </div>
  );
}

function TriageRow({ d, rank, urgent }: { d: DecisionAction; rank: number; urgent?: boolean }) {
  return (
    <Link href={d.sourceLink ?? "#"} className="block rounded-lg p-3 transition-shadow hover:shadow-lg"
      style={{
        background: urgent ? "rgba(220,38,38,0.15)" : "rgba(245,158,11,0.10)",
        borderLeft: `4px solid ${urgent ? "#dc2626" : "#f59e0b"}`,
      }}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-white shrink-0"
          style={{ background: urgent ? "#dc2626" : "#f59e0b" }}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded text-white font-bold"
              style={{ background: urgent ? "#dc2626" : "#f59e0b" }}>
              {urgent ? "🔥 CRITICAL" : "⚠ TODAY"}
            </span>
            <code className="text-xs font-mono text-cyan-300 font-bold">{d.sourceLabel}</code>
          </div>
          <div className="font-bold text-base mt-1">{d.whatToDoNow}</div>
          <div className="text-xs text-slate-300 mt-1">
            <b>救援影響：</b>避免 ${(d.revenueAtRisk / 10000).toFixed(0)} 萬損失
            <span className="text-slate-500 mx-1">·</span>
            成本 ${(d.costImpact / 10000).toFixed(1)} 萬
            <span className="text-slate-500 mx-1">·</span>
            {d.contextLine}
          </div>
        </div>
      </div>
    </Link>
  );
}

function HealthRow({ label, value, target, good }: { label: string; value: string; target: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded"
      style={{ background: good ? "rgba(16,185,129,0.15)" : "rgba(220,38,38,0.15)" }}>
      <span className="text-slate-300">{label}</span>
      <span className="font-bold tabular-nums">
        <span className={good ? "text-emerald-300" : "text-rose-300"}>{value}</span>
        <span className="text-slate-500 ml-1">/ {target}</span>
        <span className={`ml-1 ${good ? "text-emerald-400" : "text-rose-400"}`}>{good ? "✓" : "✗"}</span>
      </span>
    </div>
  );
}
