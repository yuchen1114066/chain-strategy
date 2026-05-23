"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { simulateOrderImpact, type ImpactResult, type Plan } from "@/lib/erp/order-impact";
import { createDecision, saveDecision } from "@/lib/erp/decision-loop";

type ModelOption = { code: string; name: string; price: number };

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function OrderImpactClient({ modelOptions, today }: { modelOptions: ModelOption[]; today: string }) {
  const router = useRouter();
  const [modelCode, setModelCode] = useState(modelOptions[0]?.code ?? "");
  const [qty, setQty] = useState(50);
  const [newShipDate, setNewShipDate] = useState(addDays(today, 21));
  const [customer, setCustomer] = useState("");
  const [decisionMaker, setDecisionMaker] = useState("副總");
  const [isRush, setIsRush] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  function commitDecision(planCode: "A" | "B" | "C") {
    const d = createDecision({ modelCode, qty, newShipDate, customer, isRush }, planCode, decisionMaker);
    saveDecision(d);
    router.push(`/erp/decisions/${d.id}`);
  }

  const result: ImpactResult | null = useMemo(() => {
    if (!submitted || !modelCode || qty <= 0 || !newShipDate) return null;
    try {
      return simulateOrderImpact({ modelCode, qty, newShipDate, customer, isRush });
    } catch {
      return null;
    }
  }, [submitted, modelCode, qty, newShipDate, customer, isRush]);

  const selected = modelOptions.find((m) => m.code === modelCode);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">⚡ 訂單衝擊模擬器 — Order Impact Simulator</h1>
          <p className="text-sm text-slate-500 mt-1">
            客戶緊急拉單 / 改單 → AI 30 秒算出影響 → 三方案推副總決策（不再憑感覺）
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>基準日 {today}　·　決策時間從幾小時壓縮到 30 秒</div>
        </div>
      </header>

      {/* 痛點說明 */}
      <section className="rounded-xl border-2 border-cyan-200 bg-cyan-50/40 p-4 text-sm">
        <div className="font-bold text-cyan-900 mb-1">🎯 解決的痛點</div>
        <p className="text-slate-700 leading-relaxed">
          客戶端需求波動，在傳到生產和採購之前 <b>沒有緩衝機制</b>。訂單一波動，系統立即自動計算：
          <b>① 物料能撐到新交期嗎</b>　·　<b>② 產能擠不擠得下、會擠掉誰</b>　·
          <b>③ 三個方案推副總</b>（加急採購 / 延後低毛利 / 告訴客戶最早能交日）。
          副總看著算好的方案做決定，<b>30 秒下決策、有數據支撐</b>。
        </p>
      </section>

      {/* 輸入區 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">📝 客戶新需求（拉單 / 改單）</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="block">
            <span className="text-xs text-slate-500">機種 / 成品品號</span>
            <select value={modelCode} onChange={(e) => { setModelCode(e.target.value); setSubmitted(false); }}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-slate-300 rounded font-mono">
              {modelOptions.map((m) => (
                <option key={m.code} value={m.code}>{m.code}（${m.price.toLocaleString()}）</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">數量</span>
            <input type="number" min={1} value={qty}
              onChange={(e) => { setQty(parseInt(e.target.value) || 0); setSubmitted(false); }}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-slate-300 rounded tabular-nums" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">客戶要求新交期</span>
            <input type="date" value={newShipDate}
              onChange={(e) => { setNewShipDate(e.target.value); setSubmitted(false); }}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">客戶（選填）</span>
            <input type="text" value={customer} placeholder="LIFE / TRUE / …"
              onChange={(e) => { setCustomer(e.target.value); setSubmitted(false); }}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
          </label>
          <label className="flex items-end gap-2 pb-1">
            <input type="checkbox" checked={isRush} onChange={(e) => { setIsRush(e.target.checked); setSubmitted(false); }} />
            <span className="text-xs text-slate-600">急件（會優先排）</span>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-slate-500">🔓 拍板人（公開記錄，閉環後納入個人決策準確度）</span>
            <input type="text" value={decisionMaker}
              onChange={(e) => setDecisionMaker(e.target.value)}
              className="mt-1 w-full px-2 py-1.5 text-sm border border-slate-300 rounded" />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => setSubmitted(true)}
            className="px-5 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow">
            🚀 立即衝擊模擬（30 秒下決策）
          </button>
          {selected && (
            <span className="text-xs text-slate-500">
              本單預估營收：<b className="text-cyan-700">${(selected.price * qty).toLocaleString()}</b>
            </span>
          )}
        </div>
      </section>

      {!result && submitted && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          請選擇有效的機種與數量、且日期需在今天之後。
        </div>
      )}

      {result && (
        <>
          {/* 副總一句話結論 */}
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-1">Executive Summary（給副總的一句話）</div>
            <div className="text-2xl font-extrabold leading-tight">{result.executiveSummary}</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Big label="新交期" value={result.input.newShipDate} sub={`距今 ${result.daysToNewShip} 天`} />
              <Big label="本單營收" value={`$${((modelOptions.find((m) => m.code === result.input.modelCode)?.price ?? 0) * result.input.qty / 10000).toFixed(0)}萬`} sub={`${result.input.qty} 台`} />
              <Big label="物料可行性" value={feasibilityLabel(result.feasibilityFromMaterial)} sub={`${result.materialShortageCount} 項短缺`} tone={feasibilityTone(result.feasibilityFromMaterial)} />
              <Big label="產能可行性" value={feasibilityLabel(result.feasibilityFromCapacity)} sub={result.capacityBottleneck ? `瓶頸：${result.capacityBottleneck}` : "充足"} tone={feasibilityTone(result.feasibilityFromCapacity)} />
            </div>
          </section>

          {/* 物料分析 */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold text-lg mb-3">① 物料分析 — 現有庫存 + 已下單未到 vs 新交期需求</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-2 py-2">料號</th>
                    <th className="text-left px-2 py-2">品名</th>
                    <th className="text-right px-2 py-2">需求</th>
                    <th className="text-right px-2 py-2">現有庫存</th>
                    <th className="text-right px-2 py-2">已下單未到</th>
                    <th className="text-right px-2 py-2">淨可用</th>
                    <th className="text-right px-2 py-2">缺料</th>
                    <th className="text-left px-2 py-2">供應商</th>
                    <th className="text-right px-2 py-2">交期</th>
                    <th className="text-center px-2 py-2">空運可補</th>
                  </tr>
                </thead>
                <tbody>
                  {result.materials.map((l) => (
                    <tr key={l.part.id} className={`border-t border-slate-100 ${l.shortage > 0 ? "bg-rose-50/40" : ""}`}>
                      <td className="px-2 py-1.5 font-mono">{l.part.code}</td>
                      <td className="px-2 py-1.5">{l.part.name}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{l.needQty}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{l.stockOnHand}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-cyan-700">{l.openPoArriving > 0 ? `+${l.openPoArriving}` : "—"}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{l.netAvailable}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${l.shortage > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {l.shortage > 0 ? `-${l.shortage}` : "✓"}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">{l.supplier ?? "—"}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{l.leadDays}d</td>
                      <td className="px-2 py-1.5 text-center">
                        {l.shortage > 0 ? (l.canAirFreight ? "✓" : "🚨") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              <b>淨可用</b> = 現有庫存 + 在 {result.input.newShipDate} 之前能到的 PO。<b>空運可補</b>：剩餘天數 ≥ 3 天可空運加急。
            </div>
          </section>

          {/* 產能分析 */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold text-lg mb-3">② 產能分析 — 現有工單排程下，這張新單塞進去會擠掉誰</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              {result.capacity.map((c) => (
                <div key={c.stage} className={`rounded-lg border-2 p-3 ${
                  c.isOverloaded ? "border-rose-300 bg-rose-50/60" :
                  c.utilizationAfter > 85 ? "border-amber-300 bg-amber-50/60" :
                  "border-emerald-200 bg-emerald-50/30"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">{c.label}</div>
                    {c.isOverloaded && <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">超載</span>}
                  </div>
                  <div className={`text-3xl font-extrabold tabular-nums ${
                    c.isOverloaded ? "text-rose-600" : c.utilizationAfter > 85 ? "text-amber-600" : "text-emerald-600"
                  }`}>{c.utilizationAfter}%</div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    現有 {c.currentLoadDays}d　+　新單 {c.newOrderDemandDays}d
                  </div>
                  <div className="text-[10px] text-slate-500">可用 {c.capacityDays}d</div>
                </div>
              ))}
            </div>

            {result.squeezed.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2">🔁 排擠候選（依毛利率排序，低者優先延後）</div>
                <div className="space-y-2">
                  {result.squeezed.map((s) => (
                    <div key={s.wo.id} className="bg-amber-50/40 border border-amber-200 rounded-lg p-3 text-xs flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-bold">{s.wo.woNo} <span className="text-slate-500 font-normal">{s.wo.customer} · {s.modelCode}</span></div>
                        <div className="text-slate-600">{s.reasonToSqueeze}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500">船期 {s.shipDate}</div>
                        <div className="text-amber-700 font-bold">建議延後 {s.suggestedDeferDays} 天</div>
                        <div className="text-[10px] text-slate-500">影響營收 ${(s.revenueAtRisk / 10000).toFixed(0)}萬</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 三方案 */}
          <section>
            <h2 className="font-bold text-lg mb-3">③ AI 三方案 — 推副總拍板（30 秒下決策）</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {result.plans.map((p) => <PlanCard key={p.code} plan={p} onCommit={() => commitDecision(p.code)} />)}
            </div>
            <p className="text-xs text-slate-500 mt-3 bg-cyan-50 border border-cyan-200 rounded p-3">
              <b>🔁 閉環機制</b> — 副總點「✅ 拍板執行」後，系統自動展開該方案的 4-6 個 Actions（採購 / 業務 / PM / 倉管），
              進入「決策閉環中心」追蹤進度、自動偵測風險、自動回報結果。不再丟著就忘。
            </p>
          </section>

          <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
            <b>📐 模型說明</b>　物料：BOM 展開 → 比對庫存 + 已下單未到的料（鼎新 IPSR02）。
            產能：每階段在新交期前的人天負荷 vs 可用人天。
            排擠：船期 ±7 天內的低毛利單為候選。AI 推薦規則：可接 + 成本 &lt; 20% 營收 → 推 A；
            排擠對象毛利低 70% 本單 → 推 B；否則 → 推 C。
          </p>
        </>
      )}
    </div>
  );
}

function feasibilityLabel(f: "feasible" | "tight" | "infeasible"): string {
  return f === "feasible" ? "✓ 可行" : f === "tight" ? "⚠ 偏緊" : "🚨 不可行";
}
function feasibilityTone(f: "feasible" | "tight" | "infeasible"): "emerald" | "amber" | "rose" {
  return f === "feasible" ? "emerald" : f === "tight" ? "amber" : "rose";
}

function Big({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "emerald" | "amber" | "rose" }) {
  const accent = tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber-400" : tone === "rose" ? "text-rose-400" : "text-cyan-300";
  return (
    <div className="bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-lg font-extrabold tabular-nums mt-0.5 ${accent}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}

function PlanCard({ plan, onCommit }: { plan: Plan; onCommit: () => void }) {
  const riskColor =
    plan.risk === "low" ? "border-emerald-300 bg-emerald-50/40" :
    plan.risk === "med" ? "border-amber-300 bg-amber-50/40" :
    "border-rose-300 bg-rose-50/40";
  const riskLabel = plan.risk === "low" ? "風險低" : plan.risk === "med" ? "中風險" : "高風險";
  return (
    <div className={`rounded-xl border-2 p-4 ${plan.recommended ? "border-cyan-500 ring-2 ring-cyan-200 bg-white" : riskColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold tracking-widest text-cyan-700">方案 {plan.code}</div>
        {plan.recommended && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600 text-white font-bold">⭐ AI 推薦</span>
        )}
      </div>
      <div className="font-extrabold text-base leading-tight">{plan.title}</div>
      <div className="text-xs text-slate-600 mt-0.5">{plan.oneLiner}</div>
      <ul className="mt-3 space-y-1">
        {plan.bullets.map((b, i) => (
          <li key={i} className="text-xs text-slate-700">· {b}</li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-slate-500">增加成本</div>
          <div className="font-bold text-rose-600 tabular-nums">+${(plan.addedCost / 10000).toFixed(1)}萬</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">{plan.code === "C" ? "延誤天數" : "守住營收"}</div>
          <div className="font-bold text-emerald-600 tabular-nums">
            {plan.code === "C" && plan.promiseDate
              ? plan.promiseDate
              : `$${(plan.savedLoss / 10000).toFixed(0)}萬`}
          </div>
        </div>
      </div>
      <div className={`mt-2 text-[10px] inline-block px-2 py-0.5 rounded border ${
        plan.risk === "low" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
        plan.risk === "med" ? "border-amber-300 text-amber-700 bg-amber-50" :
        "border-rose-300 text-rose-700 bg-rose-50"
      }`}>
        {riskLabel} · {plan.riskNote}
      </div>
      <button
        onClick={onCommit}
        className={`mt-3 w-full px-3 py-2 rounded-md text-sm font-bold transition-colors ${
          plan.recommended
            ? "bg-cyan-600 text-white hover:bg-cyan-700"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
        }`}>
        ✅ 副總拍板 — 進入閉環
      </button>
    </div>
  );
}
