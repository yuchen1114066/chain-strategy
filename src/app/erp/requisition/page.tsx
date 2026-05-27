import "../luminous.css";
import Link from "next/link";
import {
  computePrAttention,
  prEventStream,
  prKpis,
  PR_SLA,
  DEMAND_SIGNAL_FLOW,
  type PrAttention,
} from "@/lib/erp/requisition";

export const metadata = {
  title: "Requisition Control Center · Supply Chain Earliest Warning Layer",
};

const BUCKET_COLORS: Record<PrAttention["riskBucket"], { ring: string; chip: string; glow: string; label: string }> = {
  critical: { ring: "border-rose-400/60",   chip: "lm-chip-danger", glow: "lm-glow-danger", label: "CRITICAL" },
  high:     { ring: "border-amber-400/60",  chip: "lm-chip-amber",  glow: "lm-glow-amber",  label: "HIGH" },
  medium:   { ring: "border-cyan-400/40",   chip: "lm-chip-purple", glow: "",               label: "MEDIUM" },
  low:      { ring: "border-slate-700/40",  chip: "",               glow: "",               label: "LOW" },
};

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  submitted: "已送出",
  approval_pending: "簽核中",
  approval_delayed: "簽核延誤 🚨",
  approved: "已核准",
  unassigned: "未指派",
  blocked: "卡關",
  in_rfq: "詢價中",
  converted_po: "已轉 PO",
  cancelled: "取消",
};

const PRIORITY_LABEL: Record<string, string> = {
  P1_critical: "P1 急件",
  P2_high: "P2 高",
  P3_normal: "P3 一般",
  P4_low: "P4 低",
};

export default function RequisitionControlCenterPage() {
  const atts = computePrAttention();
  const events = prEventStream();
  const k = prKpis();

  return (
    <div className="luminous min-h-screen text-slate-100 relative overflow-hidden">
      <div className="lm-grid-bg" />
      <div className="lm-noise" />
      <div className="lm-aurora lm-aurora-1" />
      <div className="lm-aurora lm-aurora-2" />

      <div className="relative z-10 px-4 sm:px-8 py-8 max-w-[1500px] mx-auto space-y-10">
        {/* Hero */}
        <header className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-[0.25em] font-bold text-cyan-300/80">
            <Link href="/erp" className="hover:text-cyan-200">← Control Tower</Link>
            <span className="opacity-40">/</span>
            <span>Requisition Control Center</span>
            <span className="opacity-40">/</span>
            <span className="text-amber-300">Earliest Warning Layer</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-light leading-[1.05] tracking-tight">
            <span className="lm-text-glow">Requisition</span>{" "}
            <span className="text-cyan-300/70">Control Center.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300/90 max-w-3xl leading-relaxed">
            供應鏈真正起點不是 PO，而是 <b className="text-cyan-300">Demand Signal → Requisition</b>。
            這裡是企業最前端訊號層 — PR 卡住會引爆下游所有缺料停線。
            AI 持續監控 SLA、預測影響、自動催辦。
          </p>
        </header>

        {/* Procurement Risk Widget — KPIs */}
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display text-xl font-semibold">⚠ Procurement Risk Widget</h2>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">live · refreshed now</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Total PR",        v: k.total,         tone: "cyan" },
              { label: "In-Flight",       v: k.inFlight,      tone: "cyan" },
              { label: "Aging PR (>7d)",  v: k.agingPr,       tone: "amber" },
              { label: "PR > 72hr",       v: k.pr72hr,        tone: "amber" },
              { label: "High Risk",       v: k.highRiskPr,    tone: "danger" },
              { label: "Approval Delay",  v: k.approvalDelay, tone: "danger" },
              { label: "Unassigned",      v: k.unassignedPr,  tone: "amber" },
              { label: "Done → PO",       v: k.doneToday,     tone: "cyan" },
            ].map((kpi) => {
              const ring = kpi.tone === "danger" ? "border-rose-400/40 lm-glow-danger"
                         : kpi.tone === "amber"  ? "border-amber-400/40 lm-glow-amber"
                         : "border-cyan-400/30 lm-glow-soft";
              const text = kpi.tone === "danger" ? "text-rose-300 lm-text-glow-danger"
                         : kpi.tone === "amber"  ? "text-amber-300 lm-text-glow-amber"
                         : "text-cyan-200 lm-text-glow";
              return (
                <div key={kpi.label} className={`lm-glass rounded-xl border ${ring} p-3`}>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400 font-bold">{kpi.label}</div>
                  <div className={`text-3xl font-display font-light tabular-nums mt-1 ${text}`}>{kpi.v}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SLA Engine */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">⏱ Procurement SLA Engine</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PR_SLA).map(([key, sla], i) => (
              <div key={key} className="lm-glass rounded-xl border border-cyan-400/20 p-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-300/70 font-bold">Phase {i + 1}</div>
                  <div className="font-mono text-2xl font-semibold text-cyan-200 lm-text-glow tabular-nums">{sla.hours}<span className="text-xs text-slate-400 ml-1">hr</span></div>
                </div>
                <div className="mt-2 text-sm font-semibold">{sla.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{key}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise Demand Signal Flow */}
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display text-xl font-semibold">📡 Enterprise Demand Signal Flow</h2>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">12-step waterfall · Demand → AI</div>
          </div>
          <div className="lm-glass rounded-2xl border border-cyan-400/15 p-4 sm:p-6 overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 min-w-[560px]">
              {DEMAND_SIGNAL_FLOW.map((step) => {
                const isPr = step.n === 2 || step.n === 3 || step.n === 4;
                const ringClass = isPr ? "border-amber-400/40 lm-glow-amber" : "border-cyan-400/20";
                return (
                  <div key={step.n} className={`relative rounded-xl border p-3 ${ringClass} bg-slate-950/40`}>
                    <div className="flex items-center justify-between">
                      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Step {step.n}</div>
                      <div className="text-xl">{step.emoji}</div>
                    </div>
                    <div className="mt-1 font-semibold text-sm text-white">{step.label}</div>
                    <div className="text-[11px] text-cyan-300/70">{step.zh}</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-snug">{step.desc}</div>
                    {isPr && (
                      <div className="absolute -top-2 -right-2 lm-chip lm-chip-amber text-[8px] px-1.5 py-0.5">
                        Earliest Warning
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Two-column: PR Attention + Event Stream */}
        <section className="grid lg:grid-cols-[1fr,360px] gap-6">
          {/* PR Attention List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-xl font-semibold">🎯 PR Attention Queue</h2>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">sorted by AI risk score</div>
            </div>
            <div className="space-y-3">
              {atts.map((a) => {
                const color = BUCKET_COLORS[a.riskBucket];
                return (
                  <article key={a.pr.id} className={`lm-glass rounded-xl border ${color.ring} ${color.glow} p-4 space-y-2`}>
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-cyan-200">{a.pr.prNo}</span>
                        <span className={`lm-chip ${color.chip} text-[9px] px-2 py-0.5`}>{color.label} · {a.riskScore}</span>
                        <span className="lm-chip text-[9px] px-2 py-0.5">{PRIORITY_LABEL[a.pr.priority]}</span>
                        <span className="lm-chip text-[9px] px-2 py-0.5">{STATUS_LABEL[a.pr.status]}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        age <span className="text-amber-300">{a.ageHours.toFixed(0)}hr</span>
                        {a.slaPhase !== "n/a" && a.slaPhase !== "done" && (
                          <> · SLA <span className="text-cyan-300">{PR_SLA[a.slaPhase].hours}hr</span>
                            {a.slaOverdueHours > 0 && <span className="text-rose-300"> · 超時 {a.slaOverdueHours.toFixed(0)}hr</span>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 tracking-widest">Part</div>
                        <div className="font-semibold text-slate-100">{a.pr.partName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{a.pr.partCode} · {a.pr.qty} {a.pr.unit} · est ${a.pr.estUnitCost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 tracking-widest">For</div>
                        <div className="text-sm text-slate-100">
                          {a.pr.forWoNo ? <span className="text-cyan-300 font-mono">{a.pr.forWoNo}</span> : <span className="text-slate-500">—</span>}
                          {a.pr.forCustomer && <span className="text-slate-400"> · {a.pr.forCustomer}</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">需要日 {a.pr.requiredDate}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 tracking-widest">Approval</div>
                        <div className="text-sm font-mono text-slate-100">{a.pr.approvalLevel}/{a.pr.approvalRequired}</div>
                        <div className="text-[10px] text-slate-500">
                          {a.pr.approvers.map((ap) => (
                            <span key={ap.name} className={ap.status === "approved" ? "text-emerald-400" : "text-amber-300"}>
                              {ap.status === "approved" ? "✓" : "○"} {ap.name}{" "}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {a.aiPrediction && (
                      <div className="rounded-lg bg-rose-500/10 border border-rose-400/30 px-3 py-2">
                        <div className="text-[9px] uppercase tracking-widest text-rose-300 font-bold mb-0.5">🧠 AI Prediction</div>
                        <div className="text-xs text-rose-100 leading-relaxed">{a.aiPrediction}</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
                      <div className="text-xs text-slate-300">
                        <span className="text-[10px] uppercase tracking-widest text-cyan-300/70 font-bold mr-2">Recommended</span>
                        {a.recommendedAction}
                      </div>
                      <div className="flex gap-2">
                        <button className="lm-chip lm-chip-purple text-[10px] px-2 py-1">指派採購</button>
                        <button className="lm-chip text-[10px] px-2 py-1">催簽</button>
                        <button className="lm-chip lm-chip-amber text-[10px] px-2 py-1">轉 PO</button>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      {a.pr.requestor} · {a.pr.department} · {a.pr.reason}
                      {a.pr.assignedBuyer && <> · 採購 <span className="text-cyan-300">{a.pr.assignedBuyer}</span></>}
                      {a.pr.convertedPoNo && <> · → <span className="text-emerald-300">{a.pr.convertedPoNo}</span></>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* PR Event Stream */}
          <aside className="space-y-3">
            <h2 className="font-display text-xl font-semibold">⚡ PR Event Stream</h2>
            <div className="lm-glass rounded-xl border border-cyan-400/15 p-3 max-h-[1200px] overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-xs text-slate-500 p-3">No active PR events.</div>
              ) : (
                <ol className="space-y-2">
                  {events.map((e) => {
                    const sev = e.severity === "critical" ? "border-rose-400/60 lm-glow-danger"
                              : e.severity === "high"     ? "border-amber-400/50 lm-glow-amber"
                              : e.severity === "medium"   ? "border-cyan-400/30"
                              : "border-slate-700/40";
                    const sevText = e.severity === "critical" ? "text-rose-300"
                                  : e.severity === "high"     ? "text-amber-300"
                                  : e.severity === "medium"   ? "text-cyan-300"
                                  : "text-slate-400";
                    return (
                      <li key={e.id} className={`rounded-lg border ${sev} bg-slate-950/40 p-3`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] uppercase tracking-widest font-bold ${sevText}`}>{e.type.replace(/_/g, " ")}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{e.severity}</span>
                        </div>
                        <div className="text-xs text-slate-200 mt-1 leading-relaxed">{e.detail}</div>
                        {e.affectedOtd && (
                          <div className="text-[10px] text-rose-300 mt-1 leading-snug">↳ {e.affectedOtd}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="lm-glass rounded-xl border border-cyan-400/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-cyan-300/70 font-bold mb-2">PR 卡關常見因</div>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li>• 工程請購 → 沒簽核 → 採購不知道</li>
                <li>• 已核准 → 沒指派採購 → 沒人接</li>
                <li>• 規格未確定 → 廠商待選 → 卡關</li>
                <li>• 急件 → 簽核流程沒上呈</li>
              </ul>
            </div>
          </aside>
        </section>

        <footer className="text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800/60">
          AI Supply Chain Flow · Requisition Control Center · Supply Chain Earliest Warning Layer · /erp/requisition
        </footer>
      </div>
    </div>
  );
}
