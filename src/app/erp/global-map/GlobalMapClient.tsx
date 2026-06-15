"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { simulateScenario, type Scenario, type ScenarioKey, type CountryNode } from "@/lib/erp/global-map";

export default function GlobalMapClient({ initialCountries, scenarios }: { initialCountries: CountryNode[]; scenarios: Scenario[] }) {
  const [activeKey, setActiveKey] = useState<ScenarioKey | null>(null);
  const impact = useMemo(() => activeKey ? simulateScenario(activeKey) : null, [activeKey]);
  const affectedCountries = impact ? new Set(impact.scenario.affectedCountries) : new Set();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🌍 全球供應鏈地圖 — Global Supply Chain Map</h1>
        <p className="text-sm text-slate-500 mt-1">
          一鍵模擬重大事件 → 列出哪些供應商受影響、哪些料件將漲價、哪些船期延誤、哪些工單會卡　·　亞洲級頂級功能
        </p>
      </header>

      {/* 情境按鈕 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-sm mb-3">⚡ 情境模擬（點擊啟動）</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {scenarios.map((s) => {
            const active = activeKey === s.key;
            return (
              <button key={s.key} onClick={() => setActiveKey(active ? null : s.key)}
                className={`text-left rounded-lg p-3 border-2 transition-all ${
                  active ? "border-rose-500 bg-rose-50 shadow-md scale-[1.02]"
                  : "border-slate-200 bg-white hover:border-cyan-300"
                }`}>
                <div className="text-3xl mb-1">{s.emoji}</div>
                <div className="font-bold text-sm">{s.title}</div>
                <div className="text-[10px] text-slate-500">{s.titleEn}</div>
                <div className="text-[10px] text-slate-600 mt-1 leading-snug">{s.desc.slice(0, 30)}…</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 地圖 + 影響 */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* SVG 地圖 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400">Asia / Global Supplier Network</div>
            {impact && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                {impact.scenario.emoji} {impact.scenario.title} 中
              </span>
            )}
          </div>
          <WorldMap nodes={initialCountries} affected={affectedCountries as Set<string>} />
          <div className="mt-3 text-[10px] text-slate-400 flex flex-wrap gap-3">
            <span>● 圓圈大小 = 供應商數 / PO 量</span>
            <span>🔴 紅色 = 受當前情境影響</span>
            <span>🟢 綠色 = 未受影響</span>
          </div>
        </div>

        {/* 國別摘要 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">按國別分布</div>
          <ul className="space-y-1.5">
            {initialCountries.sort((a, b) => b.totalActiveValue - a.totalActiveValue).map((c) => {
              const isHit = (affectedCountries as Set<string>).has(c.country);
              return (
                <li key={c.country} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
                  isHit ? "bg-rose-50 border border-rose-200" : "bg-slate-50"
                }`}>
                  <div>
                    <div className="font-bold">{isHit && "🔴 "}{c.country}</div>
                    <div className="text-[10px] text-slate-500">{c.supplierCount} 家 · {c.totalPOs} 張 PO</div>
                  </div>
                  <div className="text-right text-[11px] tabular-nums font-bold">
                    ${(c.totalActiveValue / 10000).toFixed(0)}萬
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 情境影響詳細分析 */}
      {impact && (
        <>
          {/* 影響概覽 */}
          <section className="bg-rose-50 rounded-xl border-2 border-rose-300 p-5">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{impact.scenario.emoji}</div>
              <div className="flex-1">
                <div className="text-xs text-rose-700 tracking-widest font-bold uppercase">⚡ 情境模擬結果</div>
                <h2 className="text-xl font-extrabold text-rose-900 mt-0.5">{impact.scenario.title}</h2>
                <div className="text-sm text-slate-700 mt-1">{impact.scenario.desc}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="受影響供應商" value={`${impact.totalAffectedSuppliers} 家`} tone="rose" />
              <Stat label="在途 PO" value={`${impact.totalAffectedPOs} 張`} tone="rose" />
              <Stat label="受影響工單" value={`${impact.affectedWoNos.length} 張`} tone="amber" />
              <Stat label="曝險金額" value={`$${(impact.totalExposedValue / 10000).toFixed(0)}萬`} tone="rose" />
            </div>
            {impact.scenario.delayDays && (
              <div className="mt-3 text-sm text-slate-700">
                ⏱ 預期延誤：<b className="text-rose-700">{impact.scenario.delayDays} 天</b>
                {impact.scenario.costIncreasePct ? <>　·　成本上漲：<b className="text-rose-700">{impact.scenario.costIncreasePct}%</b></> : null}
                {impact.scenario.productionLossPct ? <>　·　產能損失：<b className="text-rose-700">{impact.scenario.productionLossPct}%</b></> : null}
              </div>
            )}
          </section>

          {/* 受影響供應商表 */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold mb-3">🏭 受影響供應商（依在途 PO 金額排序）</h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">代號</th>
                  <th className="text-left px-3 py-2">名稱</th>
                  <th className="text-left px-3 py-2">國家</th>
                  <th className="text-right px-3 py-2">在途 PO</th>
                  <th className="text-right px-3 py-2">曝險金額</th>
                  <th className="text-left px-3 py-2">建議行動</th>
                </tr>
              </thead>
              <tbody>
                {impact.affectedSuppliers.sort((a, b) => b.activePOValue - a.activePOValue).map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{s.code}</td>
                    <td className="px-3 py-2 font-semibold">{s.name}</td>
                    <td className="px-3 py-2 text-slate-700">{s.country}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.activePOCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-rose-600">${(s.activePOValue / 10000).toFixed(0)}萬</td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {impact.scenario.impactType === "shipping_delay" ? "改空運 / 啟動二供" :
                       impact.scenario.impactType === "production_halt" ? "立即電話確認 / 啟動備援廠" :
                       impact.scenario.impactType === "cost_increase" ? "鎖定遠期匯率 / 重新議價" :
                       "縮短訂單週期 / 分流到其他廠"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 受影響料件 + 工單 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold mb-2">🔩 受影響料件（{impact.affectedParts.length}）</h3>
              <div className="max-h-72 overflow-y-auto">
                <ul className="space-y-1">
                  {impact.affectedParts.map((p, i) => (
                    <li key={i} className="text-xs px-2 py-1.5 rounded bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-700">{p.code}</span>
                        <span className="ml-2">{p.name}</span>
                        <span className="text-slate-400 ml-1">· {p.supplier}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">{p.impactType}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold mb-2">🚚 受影響船期 / 工單</h3>
              <div className="max-h-72 overflow-y-auto">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">在途 PO 將延誤</div>
                <ul className="space-y-1 mb-3">
                  {impact.affectedShipments.slice(0, 10).map((s) => (
                    <li key={s.poNo} className="text-xs px-2 py-1.5 rounded bg-slate-50 flex items-center justify-between">
                      <span><span className="font-mono font-bold text-cyan-700">{s.poNo}</span> · {s.supplier}</span>
                      <span className="font-mono">{s.etaDate} <b className="text-rose-600">+{s.predictedDelay}d</b></span>
                    </li>
                  ))}
                </ul>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">受影響在製工單</div>
                <div className="flex flex-wrap gap-1">
                  {impact.affectedWoNos.slice(0, 30).map((w) => (
                    <span key={w} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">{w}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {!impact && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/30 p-6 text-center text-sm text-slate-600">
          點上方任一情境按鈕 → 系統即時算出哪些供應商 / 料件 / 船期 / 工單會受影響
        </div>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 模型</b>　依供應商「國家」+「料件 BOM」+「在製工單」三層級聯查影響範圍。
        <b>正式版</b>：整合 GDACS（全球災害）/ Marine Traffic（即時船期）/ FX API（匯率），自動觸發情境而非手動點擊；
        嚴重事件自動建立 <Link href="/erp/decisions" className="text-cyan-700 underline">決策閉環</Link> 推副總拍板。
      </p>
    </div>
  );
}

function WorldMap({ nodes, affected }: { nodes: CountryNode[]; affected: Set<string> }) {
  const W = 700, H = 320;
  // 簡化的「世界輪廓」— 用幾個多邊形抽象表示亞洲 / 歐美
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 280 }}>
      {/* 海洋背景 */}
      <rect width={W} height={H} fill="#0f172a" />
      {/* 抽象大陸（簡化） */}
      <g opacity="0.45" fill="#1e293b" stroke="#334155" strokeWidth="0.5">
        {/* 亞洲（右半） */}
        <path d="M 350 80 Q 470 60 580 110 L 620 200 Q 600 260 540 280 L 460 290 Q 380 270 350 200 Z" />
        {/* 日本 */}
        <path d="M 615 100 Q 640 90 650 130 L 645 175 Q 630 185 620 165 Z" />
        {/* 東南亞 */}
        <path d="M 430 230 Q 480 240 510 280 L 480 305 Q 430 300 410 270 Z" />
        {/* 印度次大陸 */}
        <path d="M 285 180 L 330 175 Q 340 240 310 270 L 285 250 Z" />
        {/* 歐洲 */}
        <path d="M 240 60 Q 320 50 340 100 L 320 140 Q 270 150 240 130 Z" />
        {/* 北美 */}
        <path d="M 50 70 Q 150 55 200 110 L 180 200 Q 100 210 50 180 Z" />
        {/* 非洲 */}
        <path d="M 250 150 Q 310 160 320 220 L 300 290 Q 260 300 235 250 Z" />
      </g>
      {/* 經緯網格 */}
      <g stroke="#1e3a5f" strokeWidth="0.5" opacity="0.4">
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line key={`h${f}`} x1={0} y1={H * f} x2={W} y2={H * f} />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((f) => (
          <line key={`v${f}`} x1={W * f} y1={0} x2={W * f} y2={H} />
        ))}
      </g>
      {/* 供應商節點 */}
      {nodes.map((n) => {
        const cx = (n.x / 100) * W;
        const cy = (n.y / 100) * H;
        const isHit = affected.has(n.country);
        const r = Math.min(28, 6 + n.supplierCount * 2);
        const fillColor = isHit ? "#f43f5e" : "#10b981";
        return (
          <g key={n.country}>
            {/* pulse ring */}
            {isHit && (
              <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="#f43f5e" strokeWidth="2" opacity="0.4">
                <animate attributeName="r" from={r} to={r + 20} dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={cx} cy={cy} r={r} fill={fillColor} fillOpacity="0.4" stroke={fillColor} strokeWidth="2" />
            <circle cx={cx} cy={cy} r="3" fill="#fff" />
            <text x={cx} y={cy - r - 6} textAnchor="middle" className="fill-white" style={{ fontSize: 11, fontWeight: 700 }}>
              {n.country}
            </text>
            <text x={cx} y={cy + r + 14} textAnchor="middle" className={isHit ? "fill-rose-300" : "fill-emerald-300"} style={{ fontSize: 10 }}>
              {n.supplierCount} 家
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "rose" | "amber" }) {
  const c = tone === "rose" ? "border-rose-300 bg-white text-rose-700" : "border-amber-300 bg-white text-amber-700";
  return (
    <div className={`rounded-lg border-2 p-3 ${c}`}>
      <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums mt-1">{value}</div>
    </div>
  );
}
