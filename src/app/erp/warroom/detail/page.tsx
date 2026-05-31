import Link from "next/link";
import { getWarRoomSnapshot } from "@/lib/erp/warroom";

export const revalidate = 60;
export const metadata = { title: "戰情中心 — 深度分析 P3" };

const VERDICT_CHIP: Record<string, string> = {
  good:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn:     "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

function fmtMoney(n: number): string {
  if (n >= 1e8) return `$${(n / 1e8).toFixed(2)} 億`;
  if (n >= 1e4) return `$${(n / 1e4).toFixed(0)} 萬`;
  return `$${n.toLocaleString()}`;
}

export default function WarRoomDetailPage() {
  const s = getWarRoomSnapshot();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800">
      <meta httpEquiv="refresh" content="60" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            戰情中心 <span className="text-slate-400 font-normal">— 深度分析 P3</span>
          </h1>
          <nav className="flex items-center gap-1 text-xs">
            <Link href="/erp/warroom" className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">📊 總裁首頁</Link>
            <Link href="/erp/warroom/flow" className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">🔄 流向監控</Link>
            <span className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold">🔍 深度分析</span>
            <Link href="/erp" className="px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100">← Control Tower</Link>
          </nav>
        </header>

        <div className="text-sm text-slate-600">
          這層提供 ERP 同步資料 + AI 衍生指標的細部 deep-dive。點各區塊標題可下鑽至 L3 工作台。
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* 工單健康細節 */}
          <Section title="工單健康度" subtitle="WO + AI 判定" href="/os/manufacturing">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">整體</span>
              <span className="text-2xl font-bold text-slate-900">{s.wo.overallScore}%</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {s.wo.rows.map((r) => (
                <li key={r.woNo} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-1.5">
                  <span className="font-mono text-slate-600">{r.woNo}</span>
                  <span className="text-slate-700 truncate flex-1 ml-2">{r.customer}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${VERDICT_CHIP[r.verdict]}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 庫存細節 */}
          <Section title="鈸存與庫存" subtitle="DOH + 週轉 + 呆滯" href="/erp/analytics">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Mini label="總金額" value={fmtMoney(s.inventory.totalValueNTD)} />
              <Mini label="週轉天" value={`${s.inventory.turnoverDays}d`} />
              <Mini label="呆滯%" value={`${s.inventory.deadStockPct}%`} tone="rose" />
            </div>
            <ul className="text-xs space-y-1.5 text-slate-700">
              {s.inventory.shortages.length === 0 ? (
                <li className="text-emerald-600">✓ 無低水位料件</li>
              ) : s.inventory.shortages.map((sh) => (
                <li key={sh.partName} className="flex justify-between">
                  <span>• {sh.partName}：缺 <b className="text-rose-600">{sh.qtyShort}</b></span>
                  <span className="text-slate-400">ETA {sh.etaDays}d</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 採購報價 */}
          <Section title="採購與報價" subtitle="AI 合理性" href="/erp/negotiation">
            <div className="text-right text-[10px] text-rose-600 mb-2">📈 趨勢：上升 {s.quotes.trendPct}%</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-1.5 font-medium">廠商</th>
                  <th className="py-1.5 font-medium">報價</th>
                  <th className="py-1.5 font-medium">AI 判斷</th>
                </tr>
              </thead>
              <tbody>
                {s.quotes.rows.map((r) => (
                  <tr key={r.supplier} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium">{r.supplier}</td>
                    <td className="py-2 font-mono">{r.quote}</td>
                    <td className="py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${VERDICT_CHIP[r.verdict]}`}>{r.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* 原物料 */}
          <Section title="原材料與匯率" subtitle="未來成本風險" href="/erp/should-cost">
            <ul className="space-y-2 text-sm">
              {s.commodity.materials.map((m) => (
                <li key={m.name} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">📍 {m.name}：<b className="font-mono">${m.current.toLocaleString()}</b></span>
                  <span className="text-xs text-slate-500">→ ${m.forecast.toLocaleString()} {m.verdict === "critical" && "⚠"}</span>
                </li>
              ))}
              {s.commodity.fx.map((f) => (
                <li key={f.pair} className="flex items-center justify-between">
                  <span className="text-slate-700">💱 {f.pair}：<b className="font-mono">{f.current.toFixed(2)}</b></span>
                  <span className="text-xs text-slate-500">→ {f.forecast.toFixed(2)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between">
                <span className="text-slate-700">🚢 BDI：<b className="font-mono">{s.commodity.bdi.value}</b></span>
                <span className="text-xs text-emerald-600">{s.commodity.bdi.status}</span>
              </li>
            </ul>
          </Section>

          {/* AI 建議完整 */}
          <Section title="AI 建議事項（完整）" subtitle="今日決策清單" href="/os/decision">
            <ol className="space-y-1.5 text-xs text-slate-700">
              {s.actions.map((a, i) => (
                <li key={a.id} className="flex gap-2">
                  <span className="text-slate-400 font-mono shrink-0">{i + 1}.</span>
                  <Link href={a.href ?? "#"} className="flex-1 hover:text-blue-600">{a.title}</Link>
                </li>
              ))}
            </ol>
          </Section>

          {/* 異常事件 */}
          <Section title="今日異常事件" subtitle="風險分類" href="/erp/alerts">
            <div className="space-y-2 mb-3">
              <RiskRow label="獲利" level={s.anomalies.profitRisk.level} note={s.anomalies.profitRisk.note} />
              <RiskRow label="交期" level={s.anomalies.deliveryRisk.level} note={s.anomalies.deliveryRisk.note} />
              <RiskRow label="供應商" level={s.anomalies.supplierRisk.level} note={s.anomalies.supplierRisk.note} />
            </div>
            <ol className="text-xs space-y-1 text-slate-600">
              {s.anomalies.bullets.map((b) => <li key={b.rank}>{b.rank}. {b.text}</li>)}
            </ol>
          </Section>
        </div>

        {/* 完整工作台連結 */}
        <section className="bg-white/70 rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-3">🔧 L3 全部工作台快速入口</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            {[
              ["📈 可視化儀表板", "/erp/viz"],
              ["🚨 異常警訊 + AI 解方", "/erp/alerts"],
              ["🤝 AI 議價引擎", "/erp/negotiation"],
              ["💎 Should-Cost 拆解", "/erp/should-cost"],
              ["📅 排程日曆", "/erp/calendar"],
              ["👥 客戶分析", "/erp/customers"],
              ["🔮 缺料模擬器", "/erp/simulator"],
              ["📊 零件分析", "/erp/analytics"],
              ["📦 再下單時點", "/erp/reorder"],
              ["🗑️ 呆料預警", "/erp/dead-stock"],
              ["🏭 委外倉管理", "/erp/outsource"],
              ["🏗️ 型號 + BOM", "/erp/models"],
              ["🔍 BOM 對照", "/erp/bom-compare"],
              ["🔩 零件主檔", "/erp/parts"],
              ["🏭 供應商", "/erp/suppliers"],
              ["🛒 採購單生成", "/erp/po-generator"],
              ["📥 鼎新報表同步", "/erp/import"],
              ["📱 QR 查碼", "/erp/mobile"],
              ["📋 盤點對照", "/erp/mobile/count"],
              ["🔄 鼎新同步狀態", "/erp/admin/sync"],
            ].map(([label, href]) => (
              <Link key={href} href={href!} className="block px-3 py-2 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-700">
                {label}
              </Link>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-200">
          <span>祺驊 CHI HUA · /erp/warroom/detail</span>
          <span><Link href="/erp/admin/sync" className="text-blue-600 hover:underline">鼎新 iGP 同步狀態</Link></span>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, subtitle, href, children }: { title: string; subtitle: string; href: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <header className="flex items-baseline gap-2 mb-3">
        <Link href={href} className="text-base font-bold text-slate-900 hover:text-blue-600">{title}</Link>
        <span className="text-xs text-slate-500">{subtitle}</span>
      </header>
      {children}
    </section>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "rose" | "emerald" }) {
  const text = tone === "rose" ? "text-rose-700" : tone === "emerald" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="bg-slate-50/60 rounded-lg border border-slate-100 px-2 py-1.5">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-base font-bold tabular-nums ${text}`}>{value}</div>
    </div>
  );
}

function RiskRow({ label, level, note }: { label: string; level: "high" | "mid" | "low"; note: string }) {
  const dot = level === "high" ? "bg-rose-500" : level === "mid" ? "bg-amber-500" : "bg-emerald-500";
  const chip = level === "high" ? "text-rose-700" : level === "mid" ? "text-amber-700" : "text-emerald-700";
  const text = level === "high" ? "高" : level === "mid" ? "中" : "低";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
      <span className="text-slate-700">{label}：</span>
      <span className={`text-[10px] font-bold ${chip}`}>{text}</span>
      <span className="text-slate-500 text-[10px] truncate">（{note}）</span>
    </div>
  );
}
