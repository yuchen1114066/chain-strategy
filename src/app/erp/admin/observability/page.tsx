import Link from "next/link";
import {
  recentEvents, streamStats, SEVERITY_SLA, EVENT_FANOUT,
  type EventSeverity, type EventInstance,
} from "@/lib/erp/event-bus";
import { notificationStats, CHANNEL_META, type Channel } from "@/lib/erp/notification";
import { recentApprovals, APPROVAL_RULES } from "@/lib/erp/approval-workflow";

// Observability Hub — 缺口 5：Audit + Trace + Explainability
//   Event Trace 事件流向 / AI Explain 判斷原因 / Data Lineage 數據來源 / Workflow Log 誰改過 / Decision Replay 重播

export default function ObservabilityPage() {
  const events = recentEvents();
  const stats = streamStats();
  const notiStats = notificationStats(events);
  const approvals = recentApprovals();
  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  // 把事件按 correlationId 分群
  const groups = new Map<string, EventInstance[]>();
  for (const e of events) {
    const key = e.correlationId ?? e.id;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🔭 Observability — 事件流追蹤 + AI 解釋</h1>
          <p className="text-sm text-slate-500 mt-1">
            Event Trace / AI Explain / Data Lineage / Workflow Log / Decision Replay 五合一
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      {/* 設計理念 */}
      <section className="rounded-xl border-2 border-cyan-300 bg-cyan-50/40 p-4">
        <div className="font-bold text-cyan-900 mb-2">🎯 設計理念：停止新增頁面，建立系統共通能力</div>
        <p className="text-sm text-slate-700 leading-relaxed">
          核心不是頁面，是 <b>Event Stream</b>。所有模組透過 emit() 推事件 → Stream 處理優先序 / 去重 / 關聯 / 通知 / 記錄。
          此頁是查看 Stream 健康狀況的唯一入口，5 個能力統一呈現。
        </p>
      </section>

      {/* Event Stream KPI */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">Event Stream Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Kpi label="🚨 Critical" value={`${stats.critical}`} sub={`SLA ${SEVERITY_SLA.critical.sla}`} c="text-rose-400" />
          <Kpi label="⚠️ High" value={`${stats.high}`} sub={`SLA ${SEVERITY_SLA.high.sla}`} c="text-amber-400" />
          <Kpi label="📘 Medium" value={`${stats.medium}`} sub={`SLA ${SEVERITY_SLA.medium.sla}`} c="text-cyan-400" />
          <Kpi label="📰 Low" value={`${stats.low}`} sub="Daily digest" c="text-slate-400" />
          <Kpi label="🔗 事件鏈" value={`${stats.uniqueGroups}`} sub={`${stats.total} 事件去重後`} c="text-violet-400" />
          <Kpi label="📲 通知量 24hr" value={`${notiStats.last24hr}`} sub={`過去 1hr：${notiStats.last1hr}`} c={notiStats.fatigueRisk === "high" ? "text-rose-400" : "text-emerald-400"} />
        </div>
      </section>

      {/* 5 能力索引 */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { k: "trace", label: "Event Trace", desc: "事件流向", icon: "🔭" },
          { k: "explain", label: "AI Explain", desc: "AI 判斷原因", icon: "🤖" },
          { k: "lineage", label: "Data Lineage", desc: "數據來源", icon: "🧬" },
          { k: "workflow", label: "Workflow Log", desc: "誰改過", icon: "📝" },
          { k: "replay", label: "Decision Replay", desc: "重播決策", icon: "⏮" },
        ].map((c) => (
          <a key={c.k} href={`#${c.k}`} className="block bg-white border-2 border-slate-200 hover:border-cyan-400 rounded-lg p-3 transition-colors">
            <div className="text-2xl">{c.icon}</div>
            <div className="font-bold text-sm mt-1">{c.label}</div>
            <div className="text-[10px] text-slate-500">{c.desc}</div>
          </a>
        ))}
      </section>

      {/* === ① Event Trace === */}
      <section id="trace" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-4">
        <h2 className="font-bold text-lg mb-1">🔭 ① Event Trace — 事件流向（含 Priority + Dedup + Correlation）</h2>
        <p className="text-xs text-slate-500 mb-3">
          所有事件依 correlationId 自動分群，<b>{stats.total} 事件 → {stats.uniqueGroups} 個獨立事件鏈</b>（去重 {stats.total - stats.uniqueGroups} 個次生）
        </p>
        <div className="space-y-3">
          {[...groups.entries()].map(([gid, items]) => {
            const primary = items.find((i) => i.isPrimary) ?? items[0];
            const sev = SEVERITY_SLA[primary.severity];
            return (
              <div key={gid} className={`rounded-lg border-2 p-3 ${
                primary.severity === "critical" ? "border-rose-300 bg-rose-50/40" :
                primary.severity === "high" ? "border-amber-300 bg-amber-50/40" :
                primary.severity === "medium" ? "border-cyan-300 bg-cyan-50/40" : "border-slate-300 bg-slate-50/40"
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded text-white font-bold" style={{ background: sev.badgeColor }}>
                      {primary.severity.toUpperCase()} · SLA {sev.sla}
                    </span>
                    {items.length > 1 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 text-violet-700 font-bold">
                        🔗 事件鏈 {items.length} 事件
                      </span>
                    )}
                    <span className="font-bold text-sm">{primary.correlationGroup ?? EVENT_FANOUT[primary.type].label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    primary.status === "acknowledged" ? "bg-cyan-100 text-cyan-700"
                    : primary.status === "resolved" ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                  }`}>{primary.status}</span>
                </div>

                <ol className="space-y-2 ml-4 border-l-2 border-slate-200 pl-4">
                  {items.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full" style={{ background: e.isPrimary ? sev.badgeColor : "#94a3b8" }} />
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <code className="font-mono text-[10px] text-slate-500">{e.id}</code>
                        <span className="font-bold">{EVENT_FANOUT[e.type].label}</span>
                        {e.isPrimary && <span className="text-[9px] px-1 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">主因</span>}
                        {!e.isPrimary && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600">次生</span>}
                        <span className="text-[10px] text-slate-500 ml-auto font-mono">
                          {new Date(e.occurredAt).toLocaleString("zh-TW", { hour12: false })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Payload: {Object.entries(e.payload).map(([k, v]) => `${k}=${v}`).join(", ")}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        🔄 來自 <code className="font-mono">{e.sourceModule}</code>
                        {e.causedBy && <> · 父事件 <code className="font-mono">{e.causedBy}</code></>}
                        · Fan-out → {e.fanoutTargets.length} 模組
                        · 通知 {e.notifiedChannels.length > 0 ? e.notifiedChannels.join("+") : "（去重未通知）"}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* === ② AI Explain === */}
      <section id="explain" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-4">
        <h2 className="font-bold text-lg mb-1">🤖 ② AI Explain — 系統為何做出這個判斷</h2>
        <p className="text-xs text-slate-500 mb-3">每個 AI 決策都要可解釋（不能黑箱），所有判斷邏輯透明可追溯。</p>
        <div className="space-y-2">
          <ExplainItem
            decision="WO-2026-0103 預測延誤 5 天"
            module="ETA Forecast"
            inputs={["供應商 鈦泰 baseline 生產 28 天", "當前已過 30 天仍在生產", "歷史相似 PO 平均延誤 4.2 天"]}
            logic="基於 Supplier Digital Twin 的歷史 baseline + 偏離 σ + 統計平均"
            confidence="高（樣本量 ≥ 8 個歷史 PO）"
          />
          <ExplainItem
            decision="缺料 FB64-FRM 升為 S 級"
            module="Shortage AI"
            inputs={["當前庫存 60 件", "工單需求 240 件", "供應商交期 45 天", "停線倒數 2 天"]}
            logic="停線倒數 ≤ 2 天 + 供應商交期 > 倒數 → S 級（48hr 內停線）"
            confidence="高（規則明確）"
          />
          <ExplainItem
            decision="供應商 雙成 風險動量 = rising"
            module="Supplier Risk Radar"
            inputs={["近期 35% PO 的 Quality 分數 = 40", "早期 65% 的 Quality 分數 = 88", "差 = -48"]}
            logic="2 個維度（Quality + Reliability）出現惡化 → momentum = rising"
            confidence="中（樣本量 = 3 批，建議再累積）"
          />
        </div>
      </section>

      {/* === ③ Data Lineage === */}
      <section id="lineage" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-4">
        <h2 className="font-bold text-lg mb-1">🧬 ③ Data Lineage — 數據從哪來、給誰用</h2>
        <p className="text-xs text-slate-500 mb-3">追溯每筆資料的來源系統 + 流向消費模組</p>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">資料</th>
              <th className="text-left px-3 py-2">原始來源</th>
              <th className="text-center px-3 py-2">→</th>
              <th className="text-left px-3 py-2">轉換 / 計算</th>
              <th className="text-center px-3 py-2">→</th>
              <th className="text-left px-3 py-2">消費模組</th>
            </tr>
          </thead>
          <tbody>
            {LINEAGE_SAMPLES.map((l) => (
              <tr key={l.data} className="border-t border-slate-100">
                <td className="px-3 py-2 font-bold">{l.data}</td>
                <td className="px-3 py-2 text-cyan-700 font-mono text-[11px]">{l.source}</td>
                <td className="text-center text-slate-400">→</td>
                <td className="px-3 py-2 text-[11px] text-slate-700">{l.transform}</td>
                <td className="text-center text-slate-400">→</td>
                <td className="px-3 py-2 text-[11px]">{l.consumers.join("、")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* === ④ Workflow Log === */}
      <section id="workflow" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-4">
        <h2 className="font-bold text-lg mb-1">📝 ④ Workflow Log — 誰改過什麼 + Approval 流程</h2>
        <p className="text-xs text-slate-500 mb-3">所有需要核准的動作（{APPROVAL_RULES.length} 種類型）都留下記錄</p>
        {pendingApprovals.length > 0 && (
          <div className="mb-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-3">
            <div className="text-xs font-bold text-amber-900">⏳ 待批准 {pendingApprovals.length} 件</div>
          </div>
        )}
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">時間</th>
              <th className="text-left px-3 py-2">動作</th>
              <th className="text-left px-3 py-2">提請</th>
              <th className="text-left px-3 py-2">理由</th>
              <th className="text-center px-3 py-2">狀態</th>
              <th className="text-left px-3 py-2">批准者</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((a) => {
              const rule = APPROVAL_RULES.find((r) => r.action === a.action);
              return (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-[11px] font-mono text-slate-500 tabular-nums">
                    {new Date(a.requestedAt).toLocaleString("zh-TW", { hour12: false })}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="font-bold">{rule?.label ?? a.action}</div>
                    <div className="text-[10px] text-slate-500">需 {rule?.approvalLevel.join("/")} 批准</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{a.requestedBy}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-700">{a.reason}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      a.status === "approved" ? "bg-emerald-100 text-emerald-700"
                      : a.status === "rejected" ? "bg-rose-100 text-rose-700"
                      : a.status === "auto_approved" ? "bg-cyan-100 text-cyan-700"
                      : "bg-amber-100 text-amber-700"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700">
                    {a.approvedBy ?? "—"}
                    {a.rejectionReason && <div className="text-[10px] text-rose-600">{a.rejectionReason}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* === ⑤ Decision Replay === */}
      <section id="replay" className="bg-white rounded-xl border border-slate-200 p-5 scroll-mt-4">
        <h2 className="font-bold text-lg mb-1">⏮ ⑤ Decision Replay — 重播決策</h2>
        <p className="text-xs text-slate-500 mb-3">
          當決策結果不如預期 → 回到當時的時點，重新檢視所有輸入資料 + AI 建議 + 實際選擇
        </p>
        <div className="bg-slate-50 rounded p-3 text-xs">
          <div className="font-bold mb-1">📂 可重播的決策來源：</div>
          <ul className="space-y-1 text-slate-700">
            <li>· <Link href="/erp/decisions" className="text-cyan-700 hover:underline">決策閉環中心</Link> — 每張閉環決策含完整 actions + outcomes</li>
            <li>· <Link href="/erp/performance" className="text-cyan-700 hover:underline">案例庫</Link> — 歷史成功率 + AI 推薦 vs 實際選擇對比</li>
            <li>· Event Stream → 找出當時觸發決策的源頭事件 + 所有 fan-out 動作</li>
          </ul>
          <div className="mt-3 text-[11px] text-slate-500">
            <b>使用情境</b>：副總三個月後檢討「為什麼當時選方案 B 沒選 A」 → 重播可清楚看見當時的庫存、ETA、原物料行情、供應商雷達狀態。
          </div>
        </div>
      </section>

      {/* 通知策略小結 */}
      <section className="bg-gradient-to-br from-cyan-50 to-violet-50 rounded-xl border-2 border-cyan-200 p-5">
        <h2 className="font-bold text-lg mb-2">📲 通知策略小結（避免使用者疲勞）</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          {(Object.keys(SEVERITY_SLA) as EventSeverity[]).map((sev) => {
            const sla = SEVERITY_SLA[sev];
            return (
              <div key={sev} className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold uppercase" style={{ background: sla.badgeColor }}>{sev}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{sla.sla}</span>
                </div>
                <div className="text-xs font-bold">{sla.channel}</div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {sla.channels.map((c) => (
                    <span key={c} className="text-base" title={CHANNEL_META[c as Channel]?.label}>
                      {CHANNEL_META[c as Channel]?.emoji}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-600 mt-3 leading-relaxed">
          <b>疲勞風險偵測</b>：過去 1 小時通知量 = <b className={notiStats.fatigueRisk === "high" ? "text-rose-600" : "text-emerald-600"}>{notiStats.last1hr} 次</b>
          ，<b>{notiStats.deduplicatedCount}</b> 個次生事件已自動去重不發送。
          <b>否則使用者很快疲勞，重要警報被淹沒，系統失效。</b>
        </div>
      </section>
    </div>
  );
}

const LINEAGE_SAMPLES = [
  { data: "供應商可靠度分數", source: "鼎新 PURTC（PO Ack 時間）", transform: "Supplier Digital Twin baseline 計算 + 變異", consumers: ["Risk Radar", "ETA Forecast"] },
  { data: "ETA 預測機率",      source: "Twin baseline + 當前生產狀態", transform: "Bayesian 風險加總 - σ 偏離扣分", consumers: ["戰情室", "客戶風險"] },
  { data: "Cpk 趨勢",          source: "鉞泰 IQC 量測 3 批 × 8 件",   transform: "Mean / σ → Cp/Cpk 計算 + 跨批比對", consumers: ["風險雷達", "決策閉環"] },
  { data: "Should-Cost 拆解",  source: "業界經驗 + LME/Brent",         transform: "成分權重 × 當前波動 → 合理漲幅",   consumers: ["議價引擎", "Order Impact"] },
  { data: "客戶交期燈號",      source: "鼎新 MOCTH + Twin baseline",   transform: "預測出貨日 vs 客戶要求日 = slack",  consumers: ["戰情室", "客戶分析"] },
];

function Kpi({ label, value, sub, c }: { label: string; value: string; sub: string; c: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function ExplainItem({ decision, module, inputs, logic, confidence }: { decision: string; module: string; inputs: string[]; logic: string; confidence: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="font-bold text-sm">🤖 {decision}</div>
        <code className="text-[10px] font-mono text-slate-500">來自 {module}</code>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px] gap-3 text-xs">
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">📥 輸入資料</div>
          <ul className="space-y-0.5">{inputs.map((i, k) => <li key={k} className="text-slate-700">· {i}</li>)}</ul>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">⚙️ 判斷邏輯</div>
          <div className="text-slate-700">{logic}</div>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">🎯 信心度</div>
          <div className="text-slate-800 font-bold">{confidence}</div>
        </div>
      </div>
    </div>
  );
}
