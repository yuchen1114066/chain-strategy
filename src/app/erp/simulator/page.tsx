"use client";

import { useMemo, useState } from "react";
import { simulate, modelOptions, type SimInput } from "@/lib/erp/simulate";
import { today } from "@/lib/erp/seed";

export default function SimulatorPage() {
  const [inputs, setInputs] = useState<SimInput[]>([
    { modelCode: "FB64H021-A2", qty: 50 },
    { modelCode: "FB64H020-A1", qty: 30 },
  ]);
  const [shipDate, setShipDate] = useState<string>("2026-07-15");

  const result = useMemo(() => simulate(inputs, shipDate), [inputs, shipDate]);

  const updateRow = (idx: number, patch: Partial<SimInput>) => {
    setInputs((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addRow = () => setInputs((prev) => [...prev, { modelCode: modelOptions[0].code, qty: 10 }]);
  const removeRow = (idx: number) => setInputs((prev) => prev.filter((_, i) => i !== idx));

  const totalUnits = inputs.reduce((s, r) => s + (r.qty || 0), 0);
  const fb = result.shipFeasibility;

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🔮 缺料模擬器</h1>
        <p className="text-sm text-slate-500 mt-1">
          輸入想做幾台 → 即時算缺料清單、預計到廠日、是否趕得上船期。值回票價的一頁。
        </p>
      </header>

      {/* Input panel */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">情境設定</h2>
          <span className="text-xs text-slate-500">基準日 {today}</span>
        </div>

        <div className="space-y-2 mb-4">
          {inputs.map((row, idx) => {
            const m = modelOptions.find((m) => m.code === row.modelCode);
            return (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 w-12">產品 {idx + 1}</span>
                <select
                  value={row.modelCode}
                  onChange={(e) => updateRow(idx, { modelCode: e.target.value })}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[280px]"
                >
                  {modelOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.code} — {opt.name}（{opt.family}）
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-600">×</span>
                <input
                  type="number"
                  min={0}
                  value={row.qty}
                  onChange={(e) => updateRow(idx, { qty: parseInt(e.target.value) || 0 })}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-24 text-right tabular-nums"
                />
                <span className="text-sm text-slate-600">台</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {m && `售價 $${m.price.toLocaleString()} / 台`}
                </span>
                <button
                  onClick={() => removeRow(idx)}
                  className="text-xs text-rose-600 hover:underline"
                  disabled={inputs.length <= 1}
                >
                  移除
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={addRow}
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
          >
            + 加入產品
          </button>
          <span className="text-xs text-slate-400">|</span>
          <label className="text-sm flex items-center gap-2">
            客戶要求船期：
            <input
              type="date"
              value={shipDate}
              onChange={(e) => setShipDate(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm"
            />
          </label>
          <span className="text-xs text-slate-500 ml-auto">
            合計 <b className="text-slate-900 tabular-nums">{totalUnits}</b> 台
            　·　模擬成本 <b className="text-slate-900 tabular-nums">${result.totalCost.toLocaleString()}</b>
          </span>
        </div>
      </section>

      {/* Verdict — the punchline */}
      <section className={`rounded-xl border-2 p-5 ${
        fb?.canMakeIt ? "bg-emerald-50 border-emerald-300" :
        fb && !fb.canMakeIt ? "bg-rose-50 border-rose-300" :
        "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">船期可行性判定</div>
            {fb && (
              <>
                <div className="text-2xl font-bold">
                  {fb.canMakeIt ? "✅ 趕得上" : "🚨 趕不上"}
                </div>
                <div className="text-sm text-slate-700 mt-1">
                  {fb.canMakeIt
                    ? `客戶船期 ${fb.requestedShipDate}，最早可出貨 ${fb.earliestPossibleShipDate}（緩衝 ${
                        Math.round(
                          (new Date(fb.requestedShipDate + "T00:00:00Z").getTime() -
                            new Date(fb.earliestPossibleShipDate + "T00:00:00Z").getTime()) /
                            86_400_000
                        )
                      } 天）`
                    : `差 ${fb.daysShort} 天 — 客戶船期 ${fb.requestedShipDate}，但最早只能 ${fb.earliestPossibleShipDate}`}
                </div>
              </>
            )}
          </div>
          <div className="text-right text-sm">
            <div className="text-xs text-slate-500">最早可開工</div>
            <div className="text-lg font-bold tabular-nums">{result.cantStartBefore}</div>
            <div className="text-xs text-slate-500">（料齊日 = T+{result.longestEtaDays}d）</div>
            <div className="text-xs text-slate-500 mt-2">缺料項目</div>
            <div className={`text-lg font-bold tabular-nums ${result.shortageCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {result.shortageCount}
            </div>
          </div>
        </div>

        {fb && !fb.canMakeIt && (
          <div className="mt-4 pt-4 border-t border-rose-200 text-sm">
            <div className="font-semibold text-rose-800 mb-2">建議動作</div>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700">
                📞 主動和客戶協商船期延後 {fb.daysShort} 天
              </button>
              <button className="text-xs px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600">
                ✂️ 拆單分批：先出 {Math.floor(totalUnits * 0.6)} 台、其餘晚出
              </button>
              <button className="text-xs px-3 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-700">
                🔄 改用備援供應商縮短交期
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Detailed table */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold">展開的料件需求</h2>
          <span className="text-xs text-slate-500">紅底 = 需要追料的關鍵料</span>
        </div>
        {result.rows.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-500">輸入產品數量看模擬結果</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold">料號 / 名稱</th>
                <th className="text-right px-3 py-2.5 font-semibold">既有占用</th>
                <th className="text-right px-3 py-2.5 font-semibold">本次模擬</th>
                <th className="text-right px-3 py-2.5 font-semibold">總需求</th>
                <th className="text-right px-3 py-2.5 font-semibold">在庫</th>
                <th className="text-right px-3 py-2.5 font-semibold">缺額</th>
                <th className="text-left px-3 py-2.5 font-semibold">供應商</th>
                <th className="text-right px-3 py-2.5 font-semibold">交期</th>
                <th className="text-right px-3 py-2.5 font-semibold">預計到廠</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.partCode} className={`border-t border-slate-100 ${r.blocking ? "bg-rose-50" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-slate-500">{r.partCode}</div>
                    <div>{r.partName}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">{r.existingDemand}</td>
                  <td className="px-3 py-2 text-right tabular-nums">+{r.simulatedDemand}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.totalDemand}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.stockOnHand}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${r.shortage > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {r.shortage > 0 ? `-${r.shortage}` : `+${-r.netBalance + r.stockOnHand - r.totalDemand}`}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {r.supplierName}<br />
                    <span className="text-[10px] text-slate-400">{r.supplierCountry}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">
                    {r.leadDays}+{r.transitDays}d
                  </td>
                  <td className={`px-3 py-2 text-right tabular-nums text-xs font-semibold ${r.blocking ? "text-rose-700" : "text-emerald-700"}`}>
                    {r.eta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-slate-400">
        模擬器邏輯：在庫已扣掉所有 active/planning 工單的占用 → 模擬新增需求 → 缺額即觸發追料 →
        ETA = 今天 + 供應商交期 + 運送天數 → 最晚到廠日 = 最早可開工 → +10 天生產出貨 = 最早船期。
      </p>
    </div>
  );
}
