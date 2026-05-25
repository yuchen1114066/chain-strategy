import Link from "next/link";
import { EVENT_FANOUT, recentEvents, MODULE_META, type EventType, type AffectedModule } from "@/lib/erp/event-bus";

// Event & Workflow Engine — 致命缺口 1 補上
//   核心：一個事件 → 自動 fan-out 給所有相關模組

const SEV_TONE: Record<string, { bg: string; chip: string }> = {
  critical: { bg: "bg-rose-50 border-rose-300", chip: "bg-rose-600" },
  high:     { bg: "bg-amber-50 border-amber-300", chip: "bg-amber-500" },
  med:      { bg: "bg-cyan-50 border-cyan-300", chip: "bg-cyan-600" },
  low:      { bg: "bg-slate-50 border-slate-300", chip: "bg-slate-500" },
};

export default function EventEnginePage() {
  const events = recentEvents();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">⚡ Event & Workflow Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            一個事件發生 → 系統自動 fan-out 給所有相關模組　·　大型企業系統最核心的底層之一
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      {/* 為什麼需要 */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
        <div className="font-bold text-amber-900 mb-1">⚠ 致命缺口 1：沒有 Event Engine = 各模組各自為政</div>
        <p className="text-sm text-slate-700 leading-relaxed">
          例如「ASN delay」應同步觸發：<b>缺料牆</b> / <b>工單風險</b> / <b>ETA 預測</b> / <b>倉庫排程</b> / <b>AI 警訊</b> / <b>採購提醒</b> / <b>客戶風險</b>。
          沒有這層 = 改一個地方、別的地方還是舊資料 → 決策不一致、靠人工同步 → 出包。
        </p>
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
                          {a.severity === "critical" ? "緊急" : a.severity === "high" ? "高" : a.severity === "med" ? "中" : "低"}
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
        <h2 className="font-bold text-lg mb-3">📋 最近事件（Demo Seed）</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">時間</th>
              <th className="text-left px-3 py-2">事件類型</th>
              <th className="text-left px-3 py-2">內容</th>
              <th className="text-center px-3 py-2">狀態</th>
              <th className="text-right px-3 py-2">Fan-out 模組數</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-xs text-slate-500 tabular-nums">
                  {new Date(e.occurredAt).toLocaleString("zh-TW", { hour12: false })}
                </td>
                <td className="px-3 py-2">
                  <code className="font-mono text-xs">{e.type}</code>
                  <div className="text-[10px] text-slate-500">{EVENT_FANOUT[e.type].label}</div>
                </td>
                <td className="px-3 py-2 text-xs">
                  {Object.entries(e.payload).map(([k, v]) => (
                    <span key={k} className="mr-2"><span className="text-slate-400">{k}:</span> {String(v)}</span>
                  ))}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    e.status === "fanned_out" ? "bg-emerald-100 text-emerald-700"
                    : e.status === "resolved" ? "bg-cyan-100 text-cyan-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>{e.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="text-xs font-bold tabular-nums">{e.fanoutTargets.length}</span>
                  <div className="flex gap-0.5 justify-end mt-1">
                    {e.fanoutTargets.slice(0, 6).map((m) => (
                      <span key={m} title={MODULE_META[m as AffectedModule].label}
                        className="text-xs">{MODULE_META[m as AffectedModule].emoji}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 設計理念 */}
      <section className="bg-slate-900 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">設計理念</div>
        <ul className="text-sm space-y-1">
          <li>· <b>單一事件源</b>：任何事件只 emit 一次（避免重複觸發）</li>
          <li>· <b>非同步 fan-out</b>：訂閱者各自處理、互不阻塞</li>
          <li>· <b>嚴重度分級</b>：critical / high / med / low — 影響 push 頻道與顯示優先序</li>
          <li>· <b>可重放</b>：所有事件持久化，可重新 fan-out（debug 時很重要）</li>
          <li>· <b>追溯性</b>：每個下游模組變化都可回溯到原始事件</li>
        </ul>
        <div className="text-[11px] text-slate-400 mt-3">
          📐 正式版實作：Node EventEmitter / BullMQ / Kafka 都可。目前 v1.0 是靜態路由表 + 各頁面實時計算當下狀態。
        </div>
      </section>
    </div>
  );
}
