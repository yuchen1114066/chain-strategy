import Link from "next/link";
import { getWarRoomSnapshot, type AiVerdict, type RiskLevel } from "@/lib/erp/warroom";
import { getSnapshot, setSnapshot, ageSeconds, isFresh } from "@/lib/erp/snapshot-cache";

// ISR：戰情中心每 60 秒自動 revalidate（cache 仍新時讀 cache，過期就重算）
export const revalidate = 60;

export const metadata = {
  title: "祺驊戰情中心 — CEO War Room",
  description: "Apple × Palantir 混合版・CEO 一眼看懂・資料取自鼎新 iGP（唯讀）",
};

const RISK_COLOR: Record<RiskLevel, { dot: string; chip: string; text: string }> = {
  high: { dot: "bg-rose-500",   chip: "bg-rose-50 text-rose-700 border-rose-200",     text: "高" },
  mid:  { dot: "bg-amber-500",  chip: "bg-amber-50 text-amber-700 border-amber-200",  text: "中" },
  low:  { dot: "bg-emerald-500",chip: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "低" },
};

const VERDICT: Record<AiVerdict, { chip: string; icon: string }> = {
  good:     { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✓" },
  warn:     { chip: "bg-amber-50 text-amber-700 border-amber-200",       icon: "!" },
  critical: { chip: "bg-rose-50 text-rose-700 border-rose-200",           icon: "✗" },
};

function fmtMoney(n: number): string {
  if (n >= 1e8) return `$${(n / 1e8).toFixed(2)} 億`;
  if (n >= 1e4) return `$${(n / 1e4).toFixed(0)} 萬`;
  return `$${n.toLocaleString()}`;
}

export default function WarRoomPage() {
  // 1) 優先讀 snapshot cache（cron + sync 推進來的）
  // 2) 沒 cache 就 lazy 重算（首次訪問）
  let cached = getSnapshot();
  if (!cached || !isFresh()) {
    const snap = getWarRoomSnapshot();
    setSnapshot(snap, { triggeredBy: "lazy", ttlSeconds: 600 });
    cached = getSnapshot();
  }
  const s = cached!.snapshot;
  const cacheAge = ageSeconds();
  const cacheSrc = cached!.triggeredBy;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800 print:bg-white">
      {/* 客戶端每 60 秒自動 reload，確保 CEO 大屏永遠新鮮 */}
      <meta httpEquiv="refresh" content="60" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">☰</button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              祺驊戰情中心 <span className="text-slate-400 font-normal">— Apple/Palantir 混合版</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/erp" className="text-xs text-slate-500 hover:text-slate-700">← Control Tower</Link>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full pl-3 pr-1 py-1 shadow-sm">
              <span className="text-xs font-semibold text-slate-600">Health</span>
              <span className="inline-flex items-center justify-center min-w-[36px] h-7 rounded-full text-sm font-bold text-white"
                style={{
                  background: s.header.healthScore >= 85
                    ? "linear-gradient(135deg,#10b981,#059669)"
                    : s.header.healthScore >= 70
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : "linear-gradient(135deg,#f43f5e,#e11d48)",
                }}>{s.header.healthScore}</span>
            </div>
          </div>
        </header>

        {/* ── AI Banner ───────────────────────────────────── */}
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white px-5 py-4 shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)] pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg shrink-0">🧠</div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase opacity-80">AI 智能監控</div>
              <div className="text-sm sm:text-base font-semibold leading-snug mt-0.5">{s.header.aiHeadline}</div>
            </div>
          </div>
        </div>

        {/* ── 6 Panels Grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">

          {/* ① 今日異常事件 */}
          <Panel n={1} title="今日異常事件" subtitle="CEO 第一眼">
            <div className="space-y-2 mb-3">
              <RiskRow label="獲利風險" level={s.anomalies.profitRisk.level} note={s.anomalies.profitRisk.note} />
              <RiskRow label="交期風險" level={s.anomalies.deliveryRisk.level} note={s.anomalies.deliveryRisk.note} />
              <RiskRow label="供應商風險" level={s.anomalies.supplierRisk.level} note={s.anomalies.supplierRisk.note} />
            </div>
            <ol className="space-y-1.5 text-sm leading-snug text-slate-700">
              {s.anomalies.bullets.map((b) => (
                <li key={b.rank} className="flex gap-2">
                  <span className="text-slate-400 font-mono shrink-0">{b.rank}.</span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ol>
          </Panel>

          {/* ② 工單健康度 */}
          <Panel n={2} title="工單健康度" subtitle="有沒有卡關">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-xs text-slate-500">📊 整體健康度</div>
              <div className="text-xl font-bold text-slate-900">{s.wo.overallScore}%</div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${s.wo.overallScore}%` }} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-1.5 pr-2 font-medium">工單</th>
                    <th className="py-1.5 pr-2 font-medium">客戶</th>
                    <th className="py-1.5 pr-2 font-medium">狀態</th>
                    <th className="py-1.5 font-medium">AI 判定</th>
                  </tr>
                </thead>
                <tbody>
                  {s.wo.rows.map((r) => (
                    <tr key={r.woNo} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-2 font-mono text-slate-700">{r.woNo}</td>
                      <td className="py-2 pr-2 text-slate-600">{r.customer}</td>
                      <td className="py-2 pr-2">
                        <span className={r.status === "正常" ? "text-emerald-600" : r.status === "缺料" || r.status === "延遲" ? "text-rose-600" : "text-amber-600"}>{r.status}</span>
                      </td>
                      <td className="py-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          r.verdict === "good" ? "bg-emerald-500 text-white" :
                          r.verdict === "warn" ? "bg-amber-500 text-white"  : "bg-rose-500 text-white"
                        }`}>{VERDICT[r.verdict].icon}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ③ 鈸存與庫存 */}
          <Panel n={3} title="鈸存與庫存" subtitle="會不會停線">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="庫存總金額" value={fmtMoney(s.inventory.totalValueNTD)} trend="up" />
              <Stat label="週轉天數" value={`${s.inventory.turnoverDays}天`} trend="flat" />
              <Stat label="呆滯料" value={fmtMoney(s.inventory.deadStockValueNTD)} sub={`佔比 ${s.inventory.deadStockPct}%`} trend="down" />
            </div>
            <div className="space-y-1.5 text-sm text-slate-700">
              {s.inventory.shortages.length === 0 ? (
                <div className="text-xs text-emerald-600">✓ 無低水位料件</div>
              ) : s.inventory.shortages.map((sh) => (
                <div key={sh.partName} className="flex items-baseline justify-between gap-2 text-xs">
                  <span>• {sh.partName}：缺 <b className="text-rose-600">{sh.qtyShort}pcs</b></span>
                  <span className="text-slate-400">{sh.etaDays ? `預計 ${sh.etaDays} 天到貨` : ""}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* ④ 採購與報價 */}
          <Panel n={4} title="採購與報價" subtitle="有沒有買貴">
            <div className="flex items-center justify-end gap-1 mb-2 text-xs text-rose-600">
              <span>📈 近期報價趨勢：上升 {s.quotes.trendPct}%</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-1.5 pr-2 font-medium">供應商</th>
                    <th className="py-1.5 pr-2 font-medium">報價</th>
                    <th className="py-1.5 font-medium">AI 判斷</th>
                  </tr>
                </thead>
                <tbody>
                  {s.quotes.rows.map((r) => (
                    <tr key={r.supplier} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-2 font-medium text-slate-800">{r.supplier}</td>
                      <td className="py-2 pr-2 font-mono text-slate-700">{r.quote} 元</td>
                      <td className="py-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${VERDICT[r.verdict].chip}`}>{r.note}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ⑤ 原材料與匯率 */}
          <Panel n={5} title="原材料與匯率" subtitle="未來成本風險">
            <ul className="space-y-2 text-sm">
              {s.commodity.materials.map((m) => (
                <li key={m.name} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">📍 {m.name}：<b className="font-mono">${m.current.toLocaleString()}</b>／{m.unit.replace("USD/", "")}</span>
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">預測 ${m.forecast.toLocaleString()}</span>
                    {m.verdict === "critical" && <span className="text-rose-500" title="風險">⚠</span>}
                  </span>
                </li>
              ))}
              {s.commodity.fx.map((f) => (
                <li key={f.pair} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">💱 {f.pair}：<b className="font-mono">{f.current.toFixed(2)}</b></span>
                  <span className="text-xs text-slate-500">預測 {f.forecast.toFixed(2)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between gap-2">
                <span className="text-slate-700">🚢 BDI 指數：<b className="font-mono">{s.commodity.bdi.value}</b></span>
                <span className="text-xs text-emerald-600">{s.commodity.bdi.status}</span>
              </li>
            </ul>
          </Panel>

          {/* ⑥ AI 建議事項 */}
          <Panel n={6} title="AI 建議事項" subtitle="今天要做決策">
            <ol className="space-y-2 text-sm text-slate-700">
              {s.actions.map((a, i) => (
                <li key={a.id} className="flex items-start gap-2.5 leading-snug">
                  <span className="text-slate-400 font-mono shrink-0 mt-0.5">{i + 1}.</span>
                  <Link href={a.href ?? "#"} className="flex-1 hover:text-slate-900">{a.title}</Link>
                  <input type="checkbox" className="mt-1 accent-blue-600 shrink-0" />
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${cacheAge < 300 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              AI Snapshot：{cacheAge < 60 ? "剛剛" : `${Math.floor(cacheAge / 60)} min ago`} · 來源 <span className="font-mono">{cacheSrc}</span>
            </span>
            <span>·</span>
            <span><Link href="/erp/admin/sync" className="text-blue-600 hover:underline">鼎新 iGP 同步狀態</Link></span>
            <span>·</span>
            <span>下次 refresh 60s</span>
          </div>
          <div>祺驊 CHI HUA · AI Supply Chain Flow · /erp/warroom</div>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// 子元件
// ============================================================
function Panel({ n, title, subtitle, children }: { n: number; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5">
      <header className="flex items-baseline gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">{n}</span>
        <h2 className="text-sm sm:text-base font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">({subtitle})</span>
      </header>
      {children}
    </section>
  );
}

function RiskRow({ label, level, note }: { label: string; level: RiskLevel; note: string }) {
  const c = RISK_COLOR[level];
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
      <span className="text-slate-700">{label}：</span>
      <span className={`text-[11px] px-1.5 py-0.5 rounded border ${c.chip} font-bold`}>{c.text}</span>
      <span className="text-xs text-slate-500 truncate">（{note}）</span>
    </div>
  );
}

function Stat({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "flat" }) {
  return (
    <div className="bg-slate-50/60 rounded-lg border border-slate-100 px-2 py-2">
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm sm:text-base font-bold text-slate-900 tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-slate-500">({sub})</div>}
      {trend === "up"   && <div className="text-[10px] text-rose-500 mt-0.5">↗ 上升</div>}
      {trend === "down" && <div className="text-[10px] text-emerald-600 mt-0.5">↘ 下降</div>}
      {trend === "flat" && <div className="text-[10px] text-slate-400 mt-0.5">→ 持平</div>}
    </div>
  );
}
