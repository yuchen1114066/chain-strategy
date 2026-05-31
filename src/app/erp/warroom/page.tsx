import Link from "next/link";
import { getCeoSnapshot } from "@/lib/erp/warroom";
import { getSnapshot, setSnapshot, ageSeconds, isFresh } from "@/lib/erp/snapshot-cache";

export const revalidate = 60;
export const metadata = { title: "祺驊戰情中心 — CEO War Room" };

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e8) return `${sign}$${(abs / 1e8).toFixed(2)} 億`;
  if (abs >= 1e4) return `${sign}$${(abs / 1e4).toFixed(0)} 萬`;
  return `${sign}$${abs.toLocaleString()}`;
}

export default function WarRoomHomePage() {
  // 為 CEO 4 區塊單獨快取
  let cached = getSnapshot();
  if (!cached || !isFresh()) {
    // CEO snapshot 自帶 lazy 重算
  }
  void cached;
  const s = getCeoSnapshot();
  const cacheAge = ageSeconds();
  void setSnapshot;

  const healthColor =
    s.summary.healthScore >= 85 ? "from-emerald-500 to-emerald-600" :
    s.summary.healthScore >= 70 ? "from-amber-500 to-orange-500"    :
                                    "from-rose-500 to-rose-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800">
      <meta httpEquiv="refresh" content="60" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              祺驊戰情中心 <span className="text-slate-400 font-normal">— CEO War Room</span>
            </h1>
          </div>
          <nav className="flex items-center gap-1 text-xs">
            <span className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold">📊 總裁首頁</span>
            <Link href="/erp/warroom/flow" className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">🔄 流向監控</Link>
            <Link href="/erp/warroom/detail" className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">🔍 深度分析</Link>
            <Link href="/erp" className="px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100">← Control Tower</Link>
          </nav>
        </header>

        {/* ===================================================== */}
        {/* 區塊 1（最大）AI 總裁摘要                            */}
        {/* ===================================================== */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 relative overflow-hidden">
          {/* atmosphere */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/30 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="flex items-baseline gap-2 mb-5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">AI 總裁摘要</h2>
              <span className="text-xs text-slate-500">CEO 第一眼</span>
            </div>

            {/* 3 大數字並列 */}
            <div className="grid sm:grid-cols-3 gap-5 sm:gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">企業健康度</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className={`text-5xl sm:text-6xl font-extrabold bg-gradient-to-r ${healthColor} bg-clip-text text-transparent tabular-nums`}>{s.summary.healthScore}</div>
                  <div className="text-sm text-slate-500">/ 100</div>
                </div>
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${healthColor}`} style={{ width: `${s.summary.healthScore}%` }} />
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">預估毛利率</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-5xl sm:text-6xl font-extrabold text-slate-900 tabular-nums">{s.summary.grossMarginPct.toFixed(1)}</div>
                  <div className="text-2xl font-bold text-slate-400">%</div>
                </div>
                <div className="mt-2 text-xs text-slate-500">本期預測值（依在製工單 + BOM 成本）</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">較預算落差</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className={`text-5xl sm:text-6xl font-extrabold tabular-nums ${s.summary.marginVsBudgetPct < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {s.summary.marginVsBudgetPct > 0 ? "+" : ""}{s.summary.marginVsBudgetPct.toFixed(1)}
                  </div>
                  <div className={`text-2xl font-bold ${s.summary.marginVsBudgetPct < 0 ? "text-rose-400" : "text-emerald-400"}`}>%</div>
                </div>
                <div className={`mt-2 text-xs font-semibold ${s.summary.marginVsBudgetPct < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {s.summary.marginVsBudgetPct < 0 ? "▼ 低於預算" : "▲ 高於預算"}
                </div>
              </div>
            </div>

            {/* 主因 + AI 建議 */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid md:grid-cols-2 gap-5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">主因</div>
                <ul className="space-y-1.5">
                  {s.summary.rootCauses.map((c) => (
                    <li key={c.tag} className="flex items-baseline justify-between text-sm">
                      <span className="text-slate-800">• {c.tag}</span>
                      <span className="font-mono text-rose-600 text-xs">{c.impact}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">🧠 AI 今日重點建議</div>
                <Link href={s.summary.topAiAdvice.href ?? "#"} className="block rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 hover:bg-blue-100 transition-colors">
                  <div className="flex items-baseline gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">{s.summary.topAiAdvice.rank}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.summary.topAiAdvice.title}</span>
                  </div>
                  <div className="text-[10px] text-blue-700 mt-1.5">點擊查看細節 →</div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================== */}
        {/* 區塊 2 / 3 / 4 (3-column on desktop)                  */}
        {/* ===================================================== */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* 區塊 2 — 異常事件 */}
          <Block n={2} title="異常事件" subtitle="只顯示紅燈 + 黃燈">
            {s.alerts.length === 0 ? (
              <div className="text-sm text-emerald-600">✓ 目前無異常</div>
            ) : (
              <ul className="space-y-2">
                {s.alerts.map((a) => (
                  <li key={a.id}>
                    <Link href={a.href ?? "#"} className="flex items-start gap-2 text-sm text-slate-700 hover:text-slate-900 group">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.level === "red" ? "bg-rose-500" : "bg-amber-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium group-hover:text-blue-600 truncate">{a.title}</div>
                        <div className="text-[11px] text-slate-500">{a.context}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          {/* 區塊 3 — 待核准事項 */}
          <Block n={3} title="待 CEO 核准" subtitle="一鍵核准 / 拒絕">
            {s.approvals.length === 0 ? (
              <div className="text-sm text-slate-500">目前無待核准事項</div>
            ) : (
              <ul className="space-y-2">
                {s.approvals.map((ap) => (
                  <li key={ap.id} className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={ap.href} className="text-sm font-semibold text-slate-800 hover:text-blue-600 truncate">{ap.title}</Link>
                      <span className="text-xs font-mono text-slate-700 shrink-0">{ap.amount}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 mb-2 truncate">{ap.reason}</div>
                    <div className="flex gap-1.5">
                      <button className="flex-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-1.5 transition-colors">✓ 核准</button>
                      <button className="flex-1 text-[11px] font-bold bg-white border border-slate-300 text-slate-700 rounded-md py-1.5 hover:bg-slate-100 transition-colors">✗ 拒絕</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          {/* 區塊 4 — 獲利衝擊 */}
          <Block n={4} title="獲利衝擊" subtitle="今日損益歸因">
            <ul className="space-y-2.5">
              {s.impact.map((p) => (
                <li key={p.cause} className="rounded-lg border border-rose-100 bg-rose-50/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">{p.cause}</span>
                    <span className="text-base font-bold text-rose-600 tabular-nums shrink-0">{fmtMoney(p.amountNTD)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{p.detail}</div>
                </li>
              ))}
              <li className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-600">總衝擊</span>
                <span className="text-xl font-extrabold text-rose-700 tabular-nums">
                  {fmtMoney(s.impact.reduce((sum, p) => sum + p.amountNTD, 0))}
                </span>
              </li>
            </ul>
          </Block>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Snapshot {cacheAge < 60 ? "剛剛" : `${Math.floor(cacheAge / 60)} min ago`}
            </span>
            <span>·</span>
            <span><Link href="/erp/admin/sync" className="text-blue-600 hover:underline">鼎新 iGP 同步狀態</Link></span>
            <span>·</span>
            <span>下次 refresh 60s</span>
          </div>
          <div>祺驊 CHI HUA · /erp/warroom</div>
        </footer>
      </div>
    </div>
  );
}

function Block({ n, title, subtitle, children }: { n: number; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <header className="flex items-baseline gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">{n}</span>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{subtitle}</span>
      </header>
      {children}
    </section>
  );
}
