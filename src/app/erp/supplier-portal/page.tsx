import Link from "next/link";
import {
  unconfirmedPOs,
  missingASNs,
  supplierStageAverages,
  supplierDigitalTwins,
  earlyWarningSignals,
  qualityCards,
  portalKpis,
} from "@/lib/erp/supplier-portal";

// 供應商協作入口 — 真正的第一步
//   ① PO 數位化發送 + 確認（48hr 未確認 → 提醒）
//   ② ASN 出貨通知（預防性檢測 — 副總提前 48hr 知道延誤）
//   ③ 狀態追蹤 + 每階段平均時間（議價硬數據）
//   ④ 品質回饋閉環（議價談判硬數據）

const RESULT_LABEL = {
  pass: "✓ 合格", minor_defect: "輕微異常", major_defect: "重大異常", rejected: "退貨",
} as const;
const RESULT_TONE = {
  pass: "text-emerald-700 bg-emerald-50 border-emerald-200",
  minor_defect: "text-amber-700 bg-amber-50 border-amber-200",
  major_defect: "text-rose-700 bg-rose-50 border-rose-200",
  rejected: "text-rose-900 bg-rose-100 border-rose-400 font-bold",
} as const;

export default function SupplierPortalPage() {
  const kpis = portalKpis();
  const unconf = unconfirmedPOs();
  const missing = missingASNs();
  const stages = supplierStageAverages();
  const twins = supplierDigitalTwins();
  const signals = earlyWarningSignals();
  const cards = qualityCards();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🤝 供應商協作入口 — Supplier Digital Twin</h1>
          <p className="text-sm text-slate-500 mt-1">
            供應鏈神經系統的核心：<b>即時知道問題將發生</b>，而不是「問題發生後看報表」
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>已數位化 {kpis.totalSuppliersDigitized} 家供應商 · {kpis.totalPOs} 張 PO</div>
        </div>
      </header>

      {/* KPI 帶 — 全部 actionable */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-900/40 text-white rounded-xl p-5 border-2 border-cyan-500/40">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400">🧬 Supply Chain Nervous System</div>
            <div className="text-lg font-extrabold mt-0.5">事前知道問題將發生，不是事後看報表</div>
          </div>
          <div className="text-[11px] text-slate-300">數位分身對照當前 PO → 偵測預警前兆</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi label="🚨 預警前兆（重大）" value={`${kpis.earlySignalsCritical}`} sub="問題將爆發 — 立即介入" tone={kpis.earlySignalsCritical > 0 ? "rose" : "emerald"} actionNow="電話確認 + 啟動備援" />
          <Kpi label="⚠ 預警前兆（警示）" value={`${kpis.earlySignalsWarn}`} sub="偏離 baseline 2σ+" tone={kpis.earlySignalsWarn > 0 ? "amber" : "emerald"} actionNow="採購主動追蹤" />
          <Kpi label="PO 未回應（48hr+）" value={`${kpis.unconfirmedOverdue}`} sub={`共 ${kpis.unconfirmedCount} 張待回`} tone={kpis.unconfirmedOverdue > 0 ? "rose" : "emerald"} actionNow="採購立即催單" />
          <Kpi label="缺 ASN（已逾出貨）" value={`${kpis.missingAsnCritical}`} sub="副總提前 48hr 知道" tone={kpis.missingAsnCritical > 0 ? "amber" : "emerald"} actionNow="啟動備援方案" />
          <Kpi label="近期品質異常" value={`${kpis.qualityIssueLast90d}`} sub="進料不良 / 退貨" tone={kpis.qualityIssueLast90d > 3 ? "rose" : "amber"} actionNow="議價時拿出記錄卡" />
        </div>
      </section>

      {/* ============ 🚨 AI 預警前兆 — 供應鏈神經系統的核心 ============ */}
      <section className="bg-white rounded-xl border-2 border-rose-300 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">🚨 AI 預警前兆 — 問題還沒爆但即將爆</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              對照每家供應商的數位分身（行為基線），偵測當前 PO 是否偏離 → 在問題真正發生前提早 24-72hr 預警
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            觸發規則：當前耗時 &gt; baseline + 2σ → 警示　·　&gt; 3σ → 重大
          </div>
        </div>
        {signals.length === 0 ? (
          <div className="text-emerald-700 bg-emerald-50 rounded p-4 text-sm">
            ✅ 所有進行中 PO 都在各供應商歷史 baseline 之內 — 神經系統無預警
          </div>
        ) : (
          <div className="space-y-2">
            {signals.map((s) => {
              const tone = s.severity === "critical"
                ? { bd: "border-rose-500", bg: "bg-rose-50", chip: "bg-rose-600", label: "🚨 重大預警" }
                : s.severity === "warn"
                ? { bd: "border-amber-400", bg: "bg-amber-50", chip: "bg-amber-500", label: "⚠ 警示" }
                : { bd: "border-slate-300", bg: "bg-white", chip: "bg-slate-500", label: "👁 觀察" };
              return (
                <div key={s.poId} className={`rounded-lg border-2 ${tone.bd} ${tone.bg} p-3`}>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="shrink-0">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded text-white font-bold ${tone.chip}`}>{tone.label}</span>
                      <div className="font-mono text-xs mt-1 text-cyan-700">{s.poNo}</div>
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-[9px] tracking-widest text-slate-500 uppercase">當前階段</div>
                        <div className="text-sm font-bold">{s.stageLabel}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.supplierName} · {s.partName}</div>
                      </div>
                      <div>
                        <div className="text-[9px] tracking-widest text-slate-500 uppercase">已耗時 vs Baseline</div>
                        <div className="text-sm font-bold text-rose-700 tabular-nums">
                          {(s.hoursInStage / 24).toFixed(1)}d
                          <span className="text-slate-400 text-[10px] mx-1">vs</span>
                          {(s.baselineHours / 24).toFixed(1)}d
                        </div>
                        <div className="text-[10px] text-rose-600 mt-0.5 font-bold">偏離 {s.deviationSigma.toFixed(1)}σ</div>
                      </div>
                      <div>
                        <div className="text-[9px] tracking-widest text-slate-500 uppercase">AI 預測</div>
                        <div className="text-sm text-slate-800 leading-tight">{s.predictedImpact}</div>
                      </div>
                      <div>
                        <div className="text-[9px] tracking-widest text-slate-500 uppercase">建議動作</div>
                        <div className="text-sm font-bold text-cyan-700 leading-tight">{s.recommendedAction}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ 🧬 Supplier Digital Twin — 行為履歷數位分身 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">🧬 Supplier Digital Twin — 供應商數位分身</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              系統真正累積的資產 = 供應商行為履歷。每階段平均耗時 + 變異 = 行為基線，AI 拿來偵測前兆。
            </p>
          </div>
          <div className="text-[11px] text-slate-500">Confidence：依累積樣本量自動評等</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {twins.map((t) => (
            <div key={t.supplierId} className="rounded-xl border-2 border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-base">{t.supplierName}</div>
                  <div className="text-[10px] text-slate-500">{t.sampleSize} 張 PO 累積 · Confidence {t.confidence === "high" ? "高" : t.confidence === "med" ? "中" : "低"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">行為可靠度</div>
                  <div className={`text-2xl font-extrabold tabular-nums ${
                    t.reliability >= 80 ? "text-emerald-600" :
                    t.reliability >= 60 ? "text-cyan-600" :
                    t.reliability >= 40 ? "text-amber-600" : "text-rose-600"
                  }`}>{t.reliability.toFixed(0)}</div>
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                <TwinStage label="PO 確認" avg={t.baseline.ackHours.avg} stdev={t.baseline.ackHours.stdev} unit="hr" />
                <TwinStage label="備料"     avg={t.baseline.materialReadyDays.avg} stdev={t.baseline.materialReadyDays.stdev} unit="d" />
                <TwinStage label="生產"     avg={t.baseline.productionDays.avg} stdev={t.baseline.productionDays.stdev} unit="d" />
                <TwinStage label="包裝→出貨" avg={t.baseline.packToShipDays.avg} stdev={t.baseline.packToShipDays.stdev} unit="d" />
                <TwinStage label="運輸"     avg={t.baseline.transitDays.avg} stdev={t.baseline.transitDays.stdev} unit="d" />
              </div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 mt-3 bg-slate-50 p-2 rounded">
          ↑ 變異越小（標準差低）→ 行為越穩定、可靠度越高　·　AI 用這個 baseline 對照當前 PO 是否偏離 → 「事前知道問題將發生」
        </div>
      </section>

      {/* 四模組總覽 */}
      <section className="rounded-xl border-2 border-cyan-200 bg-cyan-50/30 p-4 text-sm">
        <div className="font-bold text-cyan-900 mb-2">🎯 4 大模組 — 數位化跟供應商的所有互動</div>
        <ul className="text-slate-700 space-y-1.5 leading-relaxed">
          <li><b>① PO 數位化發送 + 確認</b>　— 48hr 未確認自動提醒採購；列出「PO 發了未回應」高風險戶</li>
          <li><b>② ASN 出貨通知</b>　— 供應商出貨前填出貨日 / 貨運單號 / 預計到貨日；缺 ASN = 自動預警，<b>副總提前 48hr 知道</b></li>
          <li><b>③ 狀態追蹤（已備料→生產→包裝→出貨→到港）</b>　— 每階段時間自動記錄；3 個月後得出每家供應商每階段平均運行時間 = <b>議價硬數據</b></li>
          <li><b>④ 品質回饋閉環</b>　— 進料合格/異常/退貨自動回填，供應商也看得到；對方漲價時拿出「品質記錄卡」：<b>「3 個月內品質異常 6 次，靠什麼漲價？」</b></li>
        </ul>
      </section>

      {/* ============ ① PO 未確認（48hr 高風險戶）============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">① PO 未確認名單 — PO 發了未回應的高風險戶</h2>
          <div className="text-[11px] text-slate-500">
            規則：PO 發出 48hr 內未確認 → 自動 push 採購人員
          </div>
        </div>
        {unconf.length === 0 ? (
          <div className="text-emerald-700 bg-emerald-50 rounded p-3 text-sm">✅ 所有 PO 都已被供應商確認 — 無需催單</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2">PO 號</th>
                <th className="text-left px-3 py-2">供應商</th>
                <th className="text-left px-3 py-2">料件</th>
                <th className="text-right px-3 py-2">數量</th>
                <th className="text-right px-3 py-2">已發 (hr)</th>
                <th className="text-right px-3 py-2">超時 (hr)</th>
                <th className="text-left px-3 py-2">系統動作</th>
              </tr>
            </thead>
            <tbody>
              {unconf.map((u) => (
                <tr key={u.po.id} className={`border-t border-slate-100 ${u.hoursOverdue > 0 ? "bg-rose-50/40" : ""}`}>
                  <td className="px-3 py-2 font-mono text-cyan-700 font-semibold">{u.po.poNo}</td>
                  <td className="px-3 py-2 font-semibold">{u.supplierName}</td>
                  <td className="px-3 py-2 text-slate-700">{u.partName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{u.po.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">{u.hoursSinceSent.toFixed(0)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${u.hoursOverdue > 0 ? "text-rose-600" : "text-amber-600"}`}>
                    {u.hoursOverdue > 0 ? `+${u.hoursOverdue.toFixed(0)}` : `T-${(-u.hoursOverdue).toFixed(0)}`}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {u.hoursOverdue > 0 ? (
                      <span className="text-rose-700 font-bold">🚨 已 push 採購、列入高風險戶</span>
                    ) : (
                      <span className="text-slate-500">⏳ 等待 48hr 確認期</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ============ ② ASN 缺漏（預防性預警）============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">② ASN 缺漏 — 預防性檢測（副總提前 48hr 知道延誤）</h2>
          <div className="text-[11px] text-slate-500">
            規則：預定出貨前 3 天仍未填 ASN → 自動預警　·　已逾預定出貨日 → 紅燈
          </div>
        </div>
        {missing.length === 0 ? (
          <div className="text-emerald-700 bg-emerald-50 rounded p-3 text-sm">✅ 所有進行中 PO 都已填妥 ASN</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {missing.map((m) => {
              const tone = m.severity === "critical"
                ? "border-rose-400 bg-rose-50"
                : m.severity === "warn" ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white";
              const chip = m.severity === "critical" ? "bg-rose-600" : m.severity === "warn" ? "bg-amber-500" : "bg-slate-400";
              const label = m.severity === "critical" ? "🚨 已逾預定出貨" : m.severity === "warn" ? "⚠ 3 天內出貨" : "👁 觀察中";
              return (
                <div key={m.po.id} className={`rounded-lg border-2 ${tone} p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${chip}`}>{label}</span>
                    <span className="font-mono text-xs text-cyan-700">{m.po.poNo}</span>
                  </div>
                  <div className="font-bold">{m.supplierName}</div>
                  <div className="text-xs text-slate-600">{m.partName} × {m.po.qty}</div>
                  <div className="text-xs mt-2 text-slate-700">
                    預定出貨：<b>{m.po.expectedShipDate}</b>
                    <span className={`ml-2 font-bold ${m.daysUntilShipExpected < 0 ? "text-rose-600" : "text-amber-600"}`}>
                      {m.daysUntilShipExpected < 0 ? `已逾 ${m.daysSinceExpectedShip}d` : `T-${m.daysUntilShipExpected}d`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-2 bg-white/70 p-2 rounded border border-slate-200">
                    {m.severity === "critical"
                      ? <>🚨 <b>已 push 副總</b>：供應商可能整夜延遲。立即電話確認真實狀態，啟動備援方案。</>
                      : m.severity === "warn"
                      ? <>⚠ 系統提醒採購：3 天內出貨，但 ASN 還沒填。建議現在催供應商填寫。</>
                      : <>觀察中，距離預定出貨還有 {m.daysUntilShipExpected} 天。</>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ ③ 每階段平均運行時間（議價硬數據）============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">③ 每階段平均運行時間 — 議價硬數據</h2>
          <div className="text-[11px] text-slate-500">3 個月累積後即時呈現每家供應商每階段的平均時間</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">供應商</th>
              <th className="text-right px-3 py-2">PO 數</th>
              <th className="text-right px-3 py-2">PO 確認 (hr)</th>
              <th className="text-right px-3 py-2">備料 (d)</th>
              <th className="text-right px-3 py-2">生產 (d)</th>
              <th className="text-right px-3 py-2">運輸 (d)</th>
              <th className="text-right px-3 py-2">總週期 (d)</th>
              <th className="text-left px-3 py-2">綜合評</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s) => (
              <tr key={s.supplierId} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold">{s.supplierName}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.totalPOs}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${s.ackHoursAvg > 48 ? "text-rose-600 font-bold" : s.ackHoursAvg > 24 ? "text-amber-600" : "text-emerald-600"}`}>
                  {s.ackHoursAvg > 0 ? s.ackHoursAvg.toFixed(0) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{s.materialReadyDaysAvg > 0 ? s.materialReadyDaysAvg.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.productionDaysAvg > 0 ? s.productionDaysAvg.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.transitDaysAvg > 0 ? s.transitDaysAvg.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold">{s.cycleTotalDaysAvg > 0 ? s.cycleTotalDaysAvg.toFixed(1) : "—"}</td>
                <td className="px-3 py-2 text-xs">
                  {s.benchmark.map((b) => (
                    <span key={b.stage} className={`inline-block mr-1 text-[9px] px-1 py-0.5 rounded ${
                      b.verdict === "fast" ? "bg-emerald-100 text-emerald-700" :
                      b.verdict === "ok" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700"
                    }`}>
                      {b.stage}{b.verdict === "fast" ? "↑" : b.verdict === "slow" ? "↓" : ""}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded">
          ↑ 快速　·　↓ 偏慢　·　空白 = 標準。<b>下次議價時拿出來：「同類料件 A 商 18 天到貨、你要 35 天，價格還比 A 商貴 8%。」</b>
        </div>
      </section>

      {/* ============ ④ 品質記錄卡（議價談判硬數據）============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">④ 品質記錄卡 — 對方漲價時拿出來</h2>
          <div className="text-[11px] text-slate-500">每張卡可直接列印 / 截圖 → 議價會議當場拿出</div>
        </div>
        {cards.length === 0 ? (
          <div className="text-slate-400 text-sm py-8 text-center">尚無品質回饋紀錄</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((c) => (
              <article key={c.supplierId} className="rounded-xl border-2 border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-base">{c.supplierName}</div>
                    <div className="text-[10px] text-slate-500">品質記錄卡 · 共 {c.totalLots} 批進料</div>
                  </div>
                  <div className={`text-2xl font-extrabold w-12 h-12 rounded-lg flex items-center justify-center text-white ${
                    c.grade === "A" ? "bg-emerald-600" :
                    c.grade === "B" ? "bg-cyan-600" :
                    c.grade === "C" ? "bg-amber-500" : "bg-rose-600"
                  }`}>{c.grade}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-center mt-3">
                  <div className="bg-emerald-50 rounded p-1.5 border border-emerald-200">
                    <div className="text-[9px] text-slate-500">合格</div>
                    <div className="font-bold text-emerald-700">{c.passLots}</div>
                  </div>
                  <div className="bg-amber-50 rounded p-1.5 border border-amber-200">
                    <div className="text-[9px] text-slate-500">輕微異常</div>
                    <div className="font-bold text-amber-700">{c.minorDefectLots}</div>
                  </div>
                  <div className="bg-rose-50 rounded p-1.5 border border-rose-200">
                    <div className="text-[9px] text-slate-500">重大異常</div>
                    <div className="font-bold text-rose-700">{c.majorDefectLots}</div>
                  </div>
                  <div className="bg-rose-100 rounded p-1.5 border border-rose-400">
                    <div className="text-[9px] text-slate-500">退貨</div>
                    <div className="font-bold text-rose-900">{c.rejectedLots}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">合格率</div>
                    <div className={`text-lg font-extrabold tabular-nums ${
                      c.passRate >= 95 ? "text-emerald-600" :
                      c.passRate >= 85 ? "text-cyan-600" :
                      c.passRate >= 70 ? "text-amber-600" : "text-rose-600"
                    }`}>{c.passRate.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">平均不良率</div>
                    <div className="text-lg font-extrabold tabular-nums text-slate-700">{c.defectRateAvg.toFixed(1)}%</div>
                  </div>
                </div>
                {c.recentDefects.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-700 mb-1">📌 近期異常紀錄</div>
                    <ul className="space-y-1">
                      {c.recentDefects.map((d, i) => (
                        <li key={i} className={`text-[11px] px-2 py-1 rounded border ${RESULT_TONE[d.result]}`}>
                          <span className="font-mono mr-1">{d.date}</span>
                          {RESULT_LABEL[d.result]}　·　不良 {d.defectRate.toFixed(1)}%　·　{d.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-xl">
                  <div className="text-[10px] font-bold text-slate-700 mb-1">💬 議價立場（AI 建議拿話）</div>
                  <div className="text-xs text-slate-800 italic">「{c.negotiationStance}」</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>為什麼這是真正的第一步？</b>
        沒有供應商協作入口，前面所有「決策引擎 / 訂單衝擊模擬 / 全球 AI 戰情」都是空中樓閣 — 系統不知道供應商真實的回應、ETA、品質狀態。
        把跟供應商的所有互動數位化 → 系統得到真實一手數據 → 上層決策引擎才能算對。
      </p>
      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>系統定位</b>：本入口給內部採購 + 供應商業務雙向使用（供應商登入後僅能看自家 PO/ASN/品質卡）。
        對鼎新唯讀（不回寫單據），扣帳一律回 ERP 操作。
        所有狀態更新會 push 到 <Link className="text-cyan-700 underline" href="/erp">戰情室 Decision Engine</Link>，
        缺 ASN 等預防性預警會在副總拍板前 48hr 顯示。
      </p>
    </div>
  );
}

function TwinStage({ label, avg, stdev, unit }: { label: string; avg: number; stdev: number; unit: string }) {
  if (avg <= 0) return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">— 樣本不足</span>
    </div>
  );
  const cv = avg > 0 ? stdev / avg : 0;
  const stable = cv < 0.2;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="font-mono tabular-nums">
        <b>{avg.toFixed(1)}</b><span className="text-slate-400">{unit}</span>
        <span className="text-slate-400 mx-1">±</span>
        <span className={stable ? "text-emerald-600" : "text-amber-600"}>{stdev.toFixed(1)}{unit}</span>
      </span>
    </div>
  );
}

function Kpi({ label, value, sub, tone, actionNow }: { label: string; value: string; sub: string; tone: "rose" | "amber" | "emerald" | "cyan"; actionNow: string }) {
  const c = { rose: "text-rose-400", amber: "text-amber-400", emerald: "text-emerald-400", cyan: "text-cyan-400" }[tone];
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
      <div className="text-[10px] text-cyan-300 mt-1 font-semibold">→ {actionNow}</div>
    </div>
  );
}
