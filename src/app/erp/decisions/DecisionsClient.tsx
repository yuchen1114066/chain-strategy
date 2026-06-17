"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadDecisions, deleteDecision, type Decision, type DecisionStatus } from "@/lib/erp/decision-loop";

const STATUS_TONE: Record<DecisionStatus, { bg: string; bd: string; chip: string; label: string }> = {
  in_progress: { bg: "bg-cyan-50/40", bd: "border-cyan-300", chip: "bg-cyan-600 text-white", label: "進行中" },
  at_risk:     { bg: "bg-amber-50/60",bd: "border-amber-400", chip: "bg-amber-500 text-white",label: "風險升級" },
  done:        { bg: "bg-emerald-50/40",bd: "border-emerald-300",chip: "bg-emerald-600 text-white",label: "閉環完成" },
  failed:      { bg: "bg-rose-50/60", bd: "border-rose-400",  chip: "bg-rose-600 text-white", label: "失敗" },
};

export default function DecisionsClient() {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    const tick = () => setDecisions(loadDecisions());
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, []);

  const inProgress = decisions.filter((d) => d.status === "in_progress" || d.status === "at_risk");
  const done = decisions.filter((d) => d.status === "done");
  const atRisk = decisions.filter((d) => d.status === "at_risk");

  const totalSaved = done.reduce((s, d) => s + (d.outcome?.revenueSaved ?? 0), 0);
  const totalExtraCost = done.reduce((s, d) => s + (d.outcome?.extraCost ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🔁 決策閉環中心 — Decision Loop</h1>
          <p className="text-sm text-slate-500 mt-1">
            副總拍板後 → 系統自動展開 Actions → 追蹤進度 → 回報結果（不再丟著就忘）
          </p>
        </div>
        <Link href="/erp/order-impact" className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-700 font-semibold">
          ⚡ 新增訂單衝擊模擬
        </Link>
      </header>

      {/* KPI 帶 */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="進行中決策" value={`${inProgress.length}`} sub="閉環追蹤中" accent="cyan" />
          <Kpi label="🟡 風險升級" value={`${atRisk.length}`} sub="需副總注意" accent={atRisk.length > 0 ? "amber" : "slate"} />
          <Kpi label="✅ 閉環完成" value={`${done.length}`} sub="本月" accent="emerald" />
          <Kpi label="守住營收" value={`$${(totalSaved / 10000).toFixed(0)}萬`} sub={`額外成本 $${(totalExtraCost / 10000).toFixed(1)}萬`} accent="emerald" />
        </div>
      </section>

      {/* 機制成立的 3 個前提條件（永遠擺第一行提醒） */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4 text-xs">
        <div className="font-bold text-amber-900 mb-1.5">⚠️ 這套機制要成立 — 3 個前提條件（缺一不可）</div>
        <ul className="space-y-1 text-slate-800 leading-relaxed">
          <li><b>① 自動串連</b>：PO/ERP/WMS/品檢 必須打通，不靠人手動回填狀態（技術投資重點）</li>
          <li><b>② 公開化</b>：誰拍板 / 選什麼方案 / 結果如何 — 系統公開記錄（沒閉環追蹤，AI 永遠學不會）</li>
          <li><b>③ 升級真執行</b>：逾時 = 自動 push 給主管 + 計入績效（一旦員工發現超時無人管，整套通知系統就死了）</li>
        </ul>
      </section>

      {decisions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          <div className="text-3xl mb-1">📭</div>
          <div>目前沒有進行中的決策。請到「⚡ 訂單衝擊模擬器」建立第一張。</div>
        </div>
      ) : (
        <section className="space-y-3">
          {decisions.map((d) => (
            <DecisionRow key={d.id} d={d} onDelete={() => { deleteDecision(d.id); setDecisions(loadDecisions()); }} />
          ))}
        </section>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>閉環機制</b> — 每張決策展開為 4-6 個具體 Actions（owner / 截止時間 / 結果）。
        系統自動推進狀態（pending → in_progress → done）、自動偵測風險（落後 1.5× 截止時間 → at_risk）、
        自動回報結果（守住營收 / 額外成本 / 客戶反應）。
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: "cyan" | "amber" | "emerald" | "slate" }) {
  const c = { cyan: "text-cyan-400", amber: "text-amber-400", emerald: "text-emerald-400", slate: "text-slate-400" }[accent];
  return (
    <div className="bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function DecisionRow({ d, onDelete }: { d: Decision; onDelete: () => void }) {
  const tone = STATUS_TONE[d.status];
  const doneCount = d.actions.filter((a) => a.status === "done").length;
  const pct = Math.round((doneCount / d.actions.length) * 100);
  const created = new Date(d.createdAt);
  return (
    <article className={`rounded-xl border-2 ${tone.bd} ${tone.bg} p-4`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tone.chip}`}>{tone.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">方案 {d.chosenPlanCode}</span>
            <span className="font-mono text-xs text-slate-500">{d.id}</span>
            <span className="text-[10px] text-slate-500">{created.toLocaleString("zh-TW", { hour12: false })}</span>
          </div>
          <div className="font-bold text-base">{d.chosenPlanTitle}</div>
          <div className="text-xs text-slate-600 mt-0.5">
            <span className="font-mono">{d.modelCode}</span> × {d.qty}　·
            客戶 <b>{d.customer ?? "—"}</b>　·
            新交期 <b>{d.newShipDate}</b>　·
            營收 <b>${(d.estRevenue / 10000).toFixed(0)}萬</b>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            🔓 拍板人：<b className="text-cyan-700">{d.decisionMaker}</b>
            {d.aiRecommended && d.aiRecommended !== d.chosenPlanCode && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">⚠ 覆蓋 AI 推薦（{d.aiRecommended}）</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500">進度</div>
          <div className="text-2xl font-extrabold tabular-nums">{pct}%</div>
          <div className="text-[10px] text-slate-500">{doneCount} / {d.actions.length} actions</div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mt-3">
        <div className={`h-full ${d.status === "failed" ? "bg-rose-500" : d.status === "at_risk" ? "bg-amber-500" : d.status === "done" ? "bg-emerald-500" : "bg-cyan-500"}`}
          style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5">
        {d.actions.map((a) => (
          <div key={a.id} className={`text-[10px] px-2 py-1 rounded border ${
            a.status === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
            a.status === "in_progress" ? "border-cyan-200 bg-cyan-50 text-cyan-700" :
            a.status === "failed" ? "border-rose-200 bg-rose-50 text-rose-700" :
            "border-slate-200 bg-white text-slate-500"
          }`}>
            <div className="font-bold truncate">
              {a.status === "done" ? "✓" : a.status === "in_progress" ? "●" : a.status === "failed" ? "✕" : "○"} {a.title.slice(0, 22)}{a.title.length > 22 ? "…" : ""}
            </div>
            <div className="opacity-70">{a.owner}</div>
          </div>
        ))}
      </div>

      {d.outcome && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
          <div className="font-bold text-emerald-700">📤 閉環回報</div>
          <div className="text-slate-700">{d.outcome.note}</div>
          {d.outcome.customerReaction && <div className="text-slate-500 mt-0.5">客戶反應：{d.outcome.customerReaction}</div>}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs">
        <Link href={`/erp/decisions/${d.id}`} className="text-cyan-700 font-semibold hover:underline">
          🔍 看完整 actions 時間軸 →
        </Link>
        <button onClick={onDelete} className="text-[10px] text-slate-400 hover:text-rose-600">
          移除
        </button>
      </div>
    </article>
  );
}
