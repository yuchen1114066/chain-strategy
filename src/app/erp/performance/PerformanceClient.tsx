"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  performanceByDecisionMaker,
  supplierEmergencyScores,
  buildCaseLibrary,
  loadDecisions,
  type DecisionMakerScore,
  type SupplierEmergencyScore,
  type CaseEntry,
} from "@/lib/erp/decision-loop";

export default function PerformanceClient() {
  const [makers, setMakers] = useState<DecisionMakerScore[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierEmergencyScore[]>([]);
  const [cases, setCases] = useState<CaseEntry[]>([]);
  const [totalDecisions, setTotalDecisions] = useState(0);

  useEffect(() => {
    function refresh() {
      setMakers(performanceByDecisionMaker());
      setSuppliers(supplierEmergencyScores());
      setCases(buildCaseLibrary());
      setTotalDecisions(loadDecisions().length);
    }
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📈 決策績效 + 案例庫 — Decision Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            第四階段（成本/績效自動回填）+ 第五階段（知識沉澱 + AI 學習）　·　長期最值錢的資產
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>總決策數 {totalDecisions}　·　已閉環 {cases.length}</div>
          <div className="text-[10px] mt-0.5">三個月後可以回頭看真相</div>
        </div>
      </header>

      {/* 前提條件：3 個 must — 否則整套變裝飾 */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-5">
        <div className="font-bold text-amber-900 mb-2">⚠️ 機制成立的 3 個前提條件（缺一不可，否則整套變裝飾）</div>
        <ul className="text-sm text-slate-800 space-y-1.5 leading-relaxed">
          <li><b>① 任務狀態必須自動串連，不靠人手動回填</b>　— PO 系統 / ERP / WMS / 品檢 必須打通。
            採購 PO 發出那刻系統就要知道。<span className="text-amber-700">這是技術投資重點。</span></li>
          <li><b>② 副總要把決策「公開化」</b>　— 系統公開記錄誰拍板、選哪個方案、結果如何。
            對主管心理上有壓力，但這正是升級成「決策引擎」的核心。<span className="text-amber-700">沒有閉環追蹤，AI 永遠學不會。</span></li>
          <li><b>③ 超時升級機制真的必須執行，不能變裝飾</b>　— 一旦員工發現超時無人管，整套通知系統就死了。
            <span className="text-amber-700">逾時 = 自動 push 給主管 + 公開化計入績效。</span></li>
        </ul>
      </section>

      {/* 副總個人決策準確度（公開化） */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-1">🎯 個人決策準確度（公開化）</h2>
        <p className="text-xs text-slate-500 mb-3">
          每位主管的累積績效。三個月後回頭看：誰的緊急方案 80% 目標時完成、15% 超支、5% 失敗。<b>這是非常重要的自我數據。</b>
        </p>
        {makers.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">尚無閉環決策。第一張閉環後即開始累積。</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {makers.map((m) => <MakerCard key={m.decisionMaker} m={m} />)}
          </div>
        )}
      </section>

      {/* 供應商緊急應急能力評分 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-1">🏭 供應商緊急應急能力評分</h2>
        <p className="text-xs text-slate-500 mb-3">
          哪些供應商說「加急」真的能配合，哪些嘴上答應實際做不到。
          <b>下次選方案時，AI 會自動把這個分數帶進來，影響「方案 A 風險評估」。</b>
        </p>
        {suppliers.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">尚無加急採購紀錄。閉環後即開始累積。</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2">等級</th>
                <th className="text-left px-3 py-2">供應商</th>
                <th className="text-right px-3 py-2">加急次數</th>
                <th className="text-right px-3 py-2">如期配合</th>
                <th className="text-right px-3 py-2">可靠度</th>
                <th className="text-left px-3 py-2">AI 評語</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.supplierId} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${
                      s.grade === "A" ? "bg-emerald-600" :
                      s.grade === "B" ? "bg-cyan-600" :
                      s.grade === "C" ? "bg-amber-500" : "bg-rose-600"
                    }`}>{s.grade}</span>
                  </td>
                  <td className="px-3 py-2 font-semibold">{s.supplierName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.total}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.delivered}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${
                    s.reliability >= 90 ? "text-emerald-600" :
                    s.reliability >= 75 ? "text-cyan-600" :
                    s.reliability >= 50 ? "text-amber-600" : "text-rose-600"
                  }`}>{s.reliability.toFixed(0)}%</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {s.reliability >= 90 ? "✅ 加急可靠，下次優先派" :
                     s.reliability >= 75 ? "🟢 多數可靠，可派加急" :
                     s.reliability >= 50 ? "🟡 配合率偏低，建議找備援" :
                     "🚨 嘴上答應做不到，AI 自動降權"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 案例庫 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-1">🧠 案例庫 — 第五階段：知識沉澱 + AI 學習</h2>
        <p className="text-xs text-slate-500 mb-3">
          每張閉環的決策自動寫入案例庫。下次副總遇到同模式情境時，<b>AI 主動帶出歷史成功率、建議調整方案</b>。
          長期累積後，AI 變策略引擎。
        </p>
        {cases.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">案例庫尚未累積。第一張閉環後即開始。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-2 py-2">案例 ID</th>
                  <th className="text-left px-2 py-2">機種</th>
                  <th className="text-right px-2 py-2">數量</th>
                  <th className="text-right px-2 py-2">交期天數</th>
                  <th className="text-right px-2 py-2">缺料件數</th>
                  <th className="text-center px-2 py-2">方案</th>
                  <th className="text-center px-2 py-2">結果</th>
                  <th className="text-center px-2 py-2">如期</th>
                  <th className="text-left px-2 py-2">客戶</th>
                  <th className="text-left px-2 py-2">閉環時點</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.decisionId} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-1.5 font-mono">
                      <Link href={`/erp/decisions/${c.decisionId}`} className="text-cyan-700 hover:underline">{c.decisionId}</Link>
                    </td>
                    <td className="px-2 py-1.5 font-mono">{c.modelCode}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{c.qty}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{c.daysToShip}d</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{c.shortageCount}</td>
                    <td className="px-2 py-1.5 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">{c.chosenPlan}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        c.outcome === "success" ? "bg-emerald-100 text-emerald-700" :
                        c.outcome === "partial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                      }`}>{c.outcome === "success" ? "成功" : c.outcome === "partial" ? "部分" : "失敗"}</span>
                    </td>
                    <td className="px-2 py-1.5 text-center">{c.onTime ? "✓" : "✕"}</td>
                    <td className="px-2 py-1.5">{c.customer ?? "—"}</td>
                    <td className="px-2 py-1.5 text-slate-500">{new Date(c.closedAt).toLocaleDateString("zh-TW")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>整套機制成立要件</b>　① 自動串連 PO/ERP/WMS/品檢　② 決策公開化　③ 超時升級真執行。
        三項缺一不可。否則整套通知系統 → 員工發現超時無人管 → 系統死。
      </p>
    </div>
  );
}

function MakerCard({ m }: { m: DecisionMakerScore }) {
  const grade = m.onTimePct >= 80 ? "A" : m.onTimePct >= 60 ? "B" : "C";
  const gColor = grade === "A" ? "bg-emerald-500" : grade === "B" ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-base">{m.decisionMaker}</div>
        <span className={`text-xs px-2 py-0.5 rounded text-white font-bold ${gColor}`}>{grade}</span>
      </div>
      <div className="text-[10px] text-slate-500">總決策 {m.total} 張　·　偏好方案 {m.topPlan}</div>
      <div className="mt-3 space-y-1.5">
        <Bar label="目標時完成" value={m.onTimePct} target={80} tone="emerald" />
        <Bar label="超支 > 10%" value={m.overrunPct} target={15} tone="amber" reverse />
        <Bar label="失敗" value={m.failedPct} target={5} tone="rose" reverse />
        <Bar label="跟 AI 推薦一致" value={m.followedAiPct} target={70} tone="cyan" />
      </div>
    </div>
  );
}

function Bar({ label, value, target, tone, reverse }: { label: string; value: number; target: number; tone: "emerald" | "amber" | "rose" | "cyan"; reverse?: boolean }) {
  const onTarget = reverse ? value <= target : value >= target;
  const color = { emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500", cyan: "bg-cyan-500" }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold tabular-nums">
          {value.toFixed(0)}%
          <span className="text-slate-400 ml-1">/ 目標 {reverse ? "≤" : "≥"} {target}%</span>
          <span className={`ml-1 ${onTarget ? "text-emerald-600" : "text-rose-600"}`}>
            {onTarget ? "✓" : "✕"}
          </span>
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
