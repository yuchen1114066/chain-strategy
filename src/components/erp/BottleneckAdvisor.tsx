import Link from "next/link";
import type { BottleneckAnalysis, Action } from "@/lib/erp/flow-advisor";

const toneClass: Record<Action["tone"], string> = {
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  primary: "bg-cyan-600 text-white hover:bg-cyan-700",
  neutral: "bg-slate-200 text-slate-800 hover:bg-slate-300",
};

const effortBadge: Record<Action["effort"], string> = {
  "立即": "bg-rose-100 text-rose-700",
  "1日": "bg-amber-100 text-amber-700",
  "1週": "bg-slate-100 text-slate-700",
};

const likelihoodLabel = {
  high: { text: "高度可能", tone: "text-rose-700 bg-rose-100" },
  medium: { text: "可能", tone: "text-amber-700 bg-amber-100" },
  low: { text: "需排查", tone: "text-slate-600 bg-slate-100" },
} as const;

export default function BottleneckAdvisor({ analyses }: { analyses: BottleneckAnalysis[] }) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
        <div className="text-3xl mb-1">✅</div>
        <div className="font-bold text-emerald-800">整條鏈順暢，沒有偵測到瓶頸</div>
        <p className="text-xs text-emerald-700 mt-1">所有階段平均停留時間都在標準工時 1.5 倍以內</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {analyses.map((a) => (
        <article
          key={a.stage}
          className={`rounded-xl border-2 overflow-hidden ${
            a.severity === "critical" ? "border-rose-300 bg-rose-50/30" : "border-amber-300 bg-amber-50/30"
          }`}
        >
          {/* Header */}
          <header className={`px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${
            a.severity === "critical" ? "border-rose-200 bg-rose-100/60" : "border-amber-200 bg-amber-100/60"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{a.stageIcon}</span>
              <div>
                <div className="text-xs text-slate-600">
                  瓶頸階段 · {a.severity === "critical" ? "🔴 嚴重" : "🟡 警示"}
                </div>
                <div className="font-bold text-base text-slate-900">
                  {a.stageLabel} 卡關
                </div>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-600">影響</div>
              <div className="font-bold tabular-nums">
                {a.stuckCount} 張單 · ${(a.stuckValue / 10000).toFixed(0)} 萬
              </div>
              <div className="text-slate-500">
                停留 <b className={a.severity === "critical" ? "text-rose-700" : "text-amber-700"}>{a.avgDwell}d</b>
                <span className="text-slate-400"> / 標準 {a.standardDwell}d</span>
              </div>
            </div>
          </header>

          {/* Headline */}
          <div className="px-5 py-3 bg-white/40 text-sm font-semibold text-slate-800">
            💡 {a.headline}
          </div>

          {/* Body: causes + actions */}
          <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Root causes */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                可能根因
              </h4>
              <ul className="space-y-1.5">
                {a.causes.map((c, i) => {
                  const lbl = likelihoodLabel[c.likelihood];
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${lbl.tone}`}>
                        {lbl.text}
                      </span>
                      <span className="text-slate-700">{c.description}</span>
                    </li>
                  );
                })}
              </ul>

              {a.stuckWos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    受影響的工單
                  </h4>
                  <ul className="space-y-1 text-xs">
                    {a.stuckWos.slice(0, 4).map((w) => (
                      <li key={w.id}>
                        <Link
                          href={`/erp/work-orders/${w.id}`}
                          className="font-mono text-cyan-700 hover:underline"
                        >
                          {w.woNo}
                        </Link>
                        <span className="text-slate-600"> · {w.customer} · 船期 {w.shipDate}</span>
                      </li>
                    ))}
                    {a.stuckWos.length > 4 && (
                      <li className="text-slate-400">… 還有 {a.stuckWos.length - 4} 張</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Suggested actions */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                ✨ 即時解方（依優先順序）
              </h4>
              <ul className="space-y-2">
                {a.actions.map((act, i) => (
                  <li key={i} className="bg-white rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <button
                        className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${toneClass[act.tone]}`}
                      >
                        {act.label}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${effortBadge[act.effort]}`}>
                          {act.effort}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">{act.detail}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      📈 預期：<span className="font-semibold text-emerald-700">{act.estimatedImpact}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
