import Link from "next/link";
import { EVENT_FANOUT, recentEvents, MODULE_META, SEVERITY_SLA, streamStats, type EventType, type EventSeverity } from "@/lib/erp/event-bus";

// Event & Workflow Engine — 致命缺口 1 補上
//   核心：一個事件 → 自動 fan-out 給所有相關模組
//   v2 升級：含 Priority + Dedup + Correlation + Notification

const SEV_TONE: Record<string, { bg: string; chip: string }> = {
  critical: { bg: "bg-rose-50 border-rose-300", chip: "bg-rose-600" },
  high:     { bg: "bg-amber-50 border-amber-300", chip: "bg-amber-500" },
  medium:   { bg: "bg-cyan-50 border-cyan-300", chip: "bg-cyan-600" },
  low:      { bg: "bg-slate-50 border-slate-300", chip: "bg-slate-500" },
};

export default function EventEnginePage() {
  const events = recentEvents();
  const stats = streamStats();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">⚡ Event Stream — 系統共通能力</h1>
          <p className="text-sm text-slate-500 mt-1">
            Priority + Dedup + Correlation + Notification + Audit Trace 五合一　·　大型企業系統最核心的底層
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/erp/admin/observability" className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white font-bold hover:bg-cyan-700">
            🔭 看 Observability →
          </Link>
          <Link href="/erp/admin" className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">
            ← 回管理後台
          </Link>
        </div>
      </header>

      {/* 統計 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="🚨 Critical" value={`${stats.critical}`} sub={`SLA ${SEVERITY_SLA.critical.sla}`} tone="rose" />
        <Stat label="⚠️ High" value={`${stats.high}`} sub={`SLA ${SEVERITY_SLA.high.sla}`} tone="amber" />
        <Stat label="🔗 事件鏈" value={`${stats.uniqueGroups}`} sub={`${stats.total} 事件去重後`} tone="cyan" />
        <Stat label="📲 通知量" value={`${stats.notificationsSent}`} sub="未來 24hr" tone="emerald" />
      </section>

      {/* Severity SLA Matrix */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-1">📊 Event Severity Matrix（優先序 + 通知策略）</h2>
        <p className="text-xs text-slate-500 mb-3">事件依嚴重度分 4 級，路由不同管道 + SLA</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(SEVERITY_SLA) as EventSeverity[]).map((s) => {
            const m = SEVERITY_SLA[s];
            return (
              <div key={s} className="rounded-lg border-2 p-3" style={{ borderColor: m.badgeColor + "55", background: m.badgeColor + "11" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase" style={{ background: m.badgeColor }}>{s}</span>
                  <span className="text-xs font-bold text-slate-600">{m.sla}</span>
                </div>
                <div className="text-sm font-bold mt-2">{m.channel}</div>
                <div className="text-[11px] text-slate-600 mt-1 leading-snug">{m.description}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 11 個核心事件 → fan-out 路由表 */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">📡 11 個核心事件 → Fan-out 路由表</h2>
        {(Object.keys(EVENT_FANOUT) as EventType[]).map((k) => {
          const f = EVENT_FANOUT[k];
          return (
            <div key={k} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <code className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-white font-bold">{k}</code>
                  <span className="ml-2 font-bold text-base">{f.label}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-700">
                  影響 {f.affects.length} 個模組
                </span>
              </div>
              <div className="text-xs text-slate-600 mb-3">📥 觸發條件：{f.trigger}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {f.affects.map((a) => {
                  const meta = MODULE_META[a.module];
                  const tone = SEV_TONE[a.severity];
                  return (
                    <Link key={a.module} href={meta.href} className={`block rounded-lg border-2 ${tone.bg} p-3 hover:shadow-sm transition-shadow`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{meta.emoji}</span>
                        <span className="font-bold text-sm">{meta.label}</span>
                        <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${tone.chip}`}>
                          {a.severity === "critical" ? "緊急" : a.severity === "high" ? "高" : a.severity === "medium" ? "中" : "低"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 leading-snug">{a.effect}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* 最近觸發的事件 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📋 最近事件（含 Correlation Group）</h2>
        <p className="text-xs text-slate-500 mb-3">⭐ Primary = 主因事件　·　灰色 = 同事件鏈次生（自動去重不重複通知）</p>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">時間</th>
              <th className="text-left px-3 py-2">事件</th>
              <th className="text-center px-3 py-2">嚴重度</th>
              <th className="text-center px-3 py-2">類型</th>
              <th className="text-left px-3 py-2">關聯群組</th>
              <th className="text-right px-3 py-2">通知</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className={`border-t border-slate-100 ${!e.isPrimary && e.correlationId ? "bg-slate-50/60" : ""}`}>
                <td className="px-3 py-2 text-[11px] text-slate-500 tabular-nums">
                  {new Date(e.occurredAt).toLocaleString("zh-TW", { hour12: false })}
                </td>
                <td className="px-3 py-2">
                  <code className="font-mono text-[11px]">{e.type}</code>
                  <div className="text-[10px] text-slate-500">{EVENT_FANOUT[e.type].label}</div>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase"
                    style={{ background: SEVERITY_SLA[e.severity].badgeColor }}>{e.severity}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  {e.isPrimary ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">⭐ 主因</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">次生</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-700">{e.correlationGroup ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  {e.notifiedChannels.length > 0 ? (
                    <span className="text-[10px] text-emerald-700 font-mono">{e.notifiedChannels.join("+")}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">去重未發</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "rose" | "amber" | "cyan" | "emerald" }) {
  const c = {
    rose: "border-rose-200 bg-rose-50/40 text-rose-600",
    amber: "border-amber-200 bg-amber-50/40 text-amber-600",
    cyan: "border-cyan-200 bg-cyan-50/40 text-cyan-600",
    emerald: "border-emerald-200 bg-emerald-50/40 text-emerald-600",
  }[tone];
  return (
    <div className={`rounded-xl border-2 p-3 ${c}`}>
      <div className="text-xs text-slate-600">{label}</div>
      <div className="text-3xl font-extrabold tabular-nums mt-0.5">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
