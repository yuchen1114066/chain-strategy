"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findDecision, saveDecision, currentPhase, LOOP_PHASES, searchCases, type Decision, type ActionItem } from "@/lib/erp/decision-loop";

export default function DecisionDetailClient({ id }: { id: string }) {
  const [d, setD] = useState<Decision | null>(null);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      setD(findDecision(id));
      setNow(Date.now());
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [id]);

  if (!d) {
    return (
      <div className="p-6">
        <Link href="/erp/decisions" className="text-cyan-700 hover:underline text-sm">← 回決策中心</Link>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          找不到決策 {id}（可能已被清除）
        </div>
      </div>
    );
  }

  function forceDone(a: ActionItem) {
    if (!d) return;
    const updated: Decision = {
      ...d,
      actions: d.actions.map((x) => x.id === a.id ? {
        ...x, status: "done", completedAt: new Date().toISOString(),
        result: "手動標記完成（副總干預）",
      } : x),
    };
    saveDecision(updated);
    setD(updated);
  }

  function forceFail(a: ActionItem) {
    if (!d) return;
    const updated: Decision = {
      ...d,
      actions: d.actions.map((x) => x.id === a.id ? {
        ...x, status: "failed", result: "手動標記失敗 — 觸發二次決策",
      } : x),
      status: "failed",
    };
    saveDecision(updated);
    setD(updated);
  }

  const created = new Date(d.createdAt);
  const elapsedH = now > 0 ? (now - created.getTime()) / 3_600_000 : 0;
  const phase = currentPhase(d);
  const escalatedActions = d.actions.filter((a) => a.status === "escalated");
  const insight = searchCases(d.input);

  return (
    <div className="p-6 space-y-5">
      <Link href="/erp/decisions" className="text-cyan-700 hover:underline text-sm">← 回決策中心</Link>

      <header className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700 font-mono">{d.id}</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-600 font-bold">方案 {d.chosenPlanCode}</span>
          {d.aiRecommended && d.aiRecommended !== d.chosenPlanCode && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500 font-bold">⚠ 副總覆蓋 AI（AI 推薦 {d.aiRecommended}）</span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
            d.status === "done" ? "bg-emerald-600" :
            d.status === "at_risk" ? "bg-amber-500" :
            d.status === "failed" ? "bg-rose-600" : "bg-cyan-600"
          }`}>
            {d.status === "done" ? "✓ 閉環完成" :
             d.status === "at_risk" ? "🟡 風險升級" :
             d.status === "failed" ? "✕ 失敗" : "● 進行中"}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold">{d.chosenPlanTitle}</h1>
        <div className="text-sm text-slate-300 mt-1">
          <span className="font-mono">{d.modelCode}</span> {d.modelName} × {d.qty}　·
          客戶 {d.customer ?? "—"}　·
          新交期 {d.newShipDate}　·
          營收 ${(d.estRevenue / 10000).toFixed(0)}萬
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center gap-3 flex-wrap">
          <span>🔓 拍板人：<b className="text-cyan-300">{d.decisionMaker}</b>（公開記錄）</span>
          <span>·</span>
          <span>{created.toLocaleString("zh-TW", { hour12: false })}</span>
          <span>·</span>
          <span>已 {elapsedH.toFixed(1)} 小時</span>
        </div>
      </header>

      {/* 五階段視覺化 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-sm mb-3">🔁 閉環 5 階段</h2>
        <div className="grid grid-cols-5 gap-2">
          {LOOP_PHASES.map((p, i) => {
            const phaseIndex = LOOP_PHASES.findIndex((x) => x.key === phase);
            const isCurrent = p.key === phase;
            const isPast = i < phaseIndex;
            return (
              <div key={p.key} className={`rounded-lg p-2 border-2 ${
                isCurrent ? "border-cyan-500 bg-cyan-50" :
                isPast ? "border-emerald-300 bg-emerald-50/40" :
                "border-slate-200 bg-slate-50"
              }`}>
                <div className={`text-[10px] font-bold ${
                  isCurrent ? "text-cyan-700" : isPast ? "text-emerald-700" : "text-slate-400"
                }`}>{p.label}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{p.window}</div>
                {isCurrent && <div className="text-[9px] text-cyan-600 mt-1 font-bold">● 進行中</div>}
                {isPast && <div className="text-[9px] text-emerald-600 mt-1 font-bold">✓ 完成</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* AI 案例庫洞察（第五階段） */}
      {insight.similarCount > 0 && (
        <section className="bg-cyan-50 border-2 border-cyan-300 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs font-bold text-cyan-700 mb-1">🧠 案例庫 AI 洞察 — 第五階段</div>
              <div className="text-sm text-slate-800">
                歷史上類似情境 <b>{insight.similarCount}</b> 件，成功率 <b className={insight.successRate >= 80 ? "text-emerald-700" : "text-amber-700"}>{insight.successRate.toFixed(0)}%</b>。
                最佳方案：<b className="text-cyan-700">方案 {insight.bestPlan}</b>（成功率 {insight.bestPlanSuccessRate.toFixed(0)}%）。
              </div>
            </div>
            {insight.warning && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-300 rounded px-2 py-1 font-bold">
                ⚠ {insight.warning}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 升級警示（前提條件 ③ 必須真執行，不是裝飾） */}
      {escalatedActions.length > 0 && (
        <section className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 animate-pulse">
          <div className="font-bold text-rose-900 mb-1">🚨 超時自動升級 — 主管必須介入</div>
          <div className="text-sm text-slate-800">
            {escalatedActions.length} 張 Action 超過截止時間 1.5×，已自動 push 給：
            <b className="text-rose-700"> {[...new Set(escalatedActions.map((a) => a.escalateTo ?? "主管"))].join(" / ")}</b>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            <b>前提條件 ③</b>：超時升級機制必須真執行，不能變裝飾。一旦員工發現超時無人管，整套系統就死了。
          </div>
        </section>
      )}

      {/* Actions 時間軸 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📋 Actions 自動執行時間軸</h2>
        <div className="space-y-3">
          {d.actions.map((a, i) => (
            <div key={a.id} className="flex gap-3">
              {/* 左側狀態點 */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  a.status === "done" ? "bg-emerald-500" :
                  a.status === "escalated" ? "bg-rose-500 animate-pulse ring-4 ring-rose-200" :
                  a.status === "in_progress" ? "bg-cyan-500 animate-pulse" :
                  a.status === "failed" ? "bg-rose-700" : "bg-slate-300"
                }`}>
                  {a.status === "done" ? "✓" : a.status === "failed" ? "✕" : a.status === "escalated" ? "!" : i + 1}
                </div>
                {i < d.actions.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-1 ${a.status === "done" ? "bg-emerald-300" : "bg-slate-200"}`} style={{ minHeight: 24 }} />
                )}
              </div>
              {/* 右側內容 */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{a.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{a.detail}</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 shrink-0">
                    <div>負責：<b>{a.owner}</b></div>
                    <div>截止：{a.dueOffsetHours} 小時內</div>
                    {a.escalateTo && <div className="text-rose-600">逾時 → 升級給 {a.escalateTo}</div>}
                  </div>
                </div>
                {a.startedAt && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    啟動 {new Date(a.startedAt).toLocaleString("zh-TW", { hour12: false })}
                    {a.completedAt && <>　·　完成 {new Date(a.completedAt).toLocaleString("zh-TW", { hour12: false })}</>}
                  </div>
                )}
                {a.escalatedAt && (
                  <div className="text-[10px] text-rose-700 mt-1 font-bold bg-rose-50 border border-rose-200 px-2 py-1 rounded">
                    🚨 超時自動升級 @ {new Date(a.escalatedAt).toLocaleString("zh-TW", { hour12: false })} → push 給 {a.escalateTo}
                  </div>
                )}
                {a.result && (
                  <div className={`text-xs mt-1 px-2 py-1 rounded inline-block ${
                    a.status === "done" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    📤 結果：{a.result}
                  </div>
                )}
                {(a.status === "pending" || a.status === "in_progress") && (
                  <div className="mt-2 flex gap-2 text-[10px]">
                    <button onClick={() => forceDone(a)} className="px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">
                      ✓ 標記完成
                    </button>
                    <button onClick={() => forceFail(a)} className="px-2 py-0.5 rounded border border-rose-300 text-rose-600 hover:bg-rose-50">
                      ✕ 標記失敗（升級）
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 閉環回報 */}
      {d.outcome && (
        <section className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5">
          <h2 className="font-bold text-lg mb-2 text-emerald-900">📤 閉環回報 — Outcome</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Stat label="結果" value={d.outcome.result === "success" ? "✅ 成功" : d.outcome.result === "partial" ? "🟡 部分" : "🚨 失敗"} />
            <Stat label="守住營收" value={`$${(d.outcome.revenueSaved / 10000).toFixed(0)}萬`} />
            <Stat label="額外成本" value={`$${(d.outcome.extraCost / 10000).toFixed(1)}萬`} />
            <Stat label="ROI" value={d.outcome.extraCost > 0
              ? `${(d.outcome.revenueSaved / d.outcome.extraCost).toFixed(1)}×`
              : "∞"} />
          </div>
          <div className="text-sm text-slate-700">{d.outcome.note}</div>
          {d.outcome.customerReaction && <div className="text-xs text-slate-600 mt-1">客戶反應：{d.outcome.customerReaction}</div>}
          <div className="text-[10px] text-slate-500 mt-2">
            閉環時點：{new Date(d.outcome.closedAt).toLocaleString("zh-TW", { hour12: false })}
          </div>
        </section>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>狀態機</b>：pending → in_progress → done（系統依時間自動推進 / 副總可手動干預）。
        失敗 → 自動觸發二次決策。風險偵測：超過截止時間 1.5× 仍未完成 → at_risk 升級給副總。
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg px-3 py-2 border border-emerald-200">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-lg font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
