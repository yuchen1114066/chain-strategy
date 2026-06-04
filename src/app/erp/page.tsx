import Link from "next/link";
import { getCeoSnapshot } from "@/lib/erp/warroom";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "L1 Executive · AI 戰情中心" };

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "+";
  if (abs >= 1e8) return `${sign}$${(abs / 1e8).toFixed(2)} 億`;
  if (abs >= 1e4) return `${sign}$${(abs / 1e4).toFixed(0)} 萬`;
  return `${sign}$${abs.toLocaleString()}`;
}

export default function L1ExecutivePage() {
  const s = getCeoSnapshot();
  const totalImpact = s.impact.reduce((sum, p) => sum + p.amountNTD, 0);

  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-8">

        {/* Header */}
        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L1 Executive</div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1" style={{ color: SC.text }}>AI 戰情中心</h1>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>實時 KPI Card 視角 · 健康度 + 毛利 + 衝擊 + AI 建議</p>
        </header>

        {/* 第一區（最大）— Executive Summary · ① CURRENT */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.blue, letterSpacing: "0.12em" }}>① CURRENT</span>
              <h2 className="text-xl font-semibold">Executive Summary</h2>
              <span className="text-[11px]" style={{ color: SC.textSub }}>現在發生什麼</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>L1·EXECUTIVE</span>
          </div>
          <div className="text-[11px] mb-4" style={{ color: SC.textSub }}>三大核心指標（健康度 + AI 信心 + 預估毛利）</div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <MiniLabel>企業健康度</MiniLabel>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-6xl font-extrabold tabular-nums" style={{ color: SC.primary }}>{s.summary.healthScore}</span>
                <span className="text-base" style={{ color: SC.textSub }}>/ 100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: SC.surfaceDim }}>
                <div className="h-full rounded-full" style={{ width: `${s.summary.healthScore}%`, background: SC.primary }} />
              </div>
            </div>
            <div>
              <MiniLabel>AI Confidence</MiniLabel>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-6xl font-extrabold tabular-nums" style={{ color: SC.blue }}>92</span>
                <span className="text-base" style={{ color: SC.textSub }}>%</span>
              </div>
              <div className="text-[10px] mt-1" style={{ color: SC.textSub }}>模型 v0.3 · 12 變數 · 統計信賴 91.8%</div>
            </div>
            <div>
              <MiniLabel>預估毛利</MiniLabel>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold" style={{ color: SC.textSub, textDecoration: "line-through" }}>18.2%</span>
                <span className="text-lg" style={{ color: SC.red }}>↓</span>
                <span className="text-5xl font-extrabold tabular-nums" style={{ color: SC.red }}>{s.summary.grossMarginPct}<span className="text-2xl">%</span></span>
              </div>
              <div className="text-[11px] font-semibold mt-1" style={{ color: SC.red }}>較預算下降 {Math.abs(s.summary.marginVsBudgetPct)}%</div>
            </div>
          </div>
        </Card>

        {/* ② WHY + ③ PREDICTION + ④ ACTION 三卡並排（完整 4 步框架） */}
        <div className="grid md:grid-cols-3 gap-5">
          <Card accent={SC.red}>
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: "#d97706", letterSpacing: "0.12em" }}>② WHY</span>
              <h2 className="text-base font-semibold">Profit Impact</h2>
            </div>
            <div className="text-[11px] mb-2" style={{ color: SC.textSub }}>為什麼毛利下降</div>
            <ul className="space-y-2.5">
              {s.impact.map((p) => (
                <li key={p.cause} className="flex items-baseline justify-between border-b pb-2 last:border-0" style={{ borderColor: SC.border }}>
                  <span>
                    <span className="text-sm font-semibold">{p.cause}</span>
                    <span className="block text-[10px]" style={{ color: SC.textSub }}>{p.detail}</span>
                  </span>
                  <span className="text-lg font-bold tabular-nums" style={{ color: SC.red }}>{fmtMoney(p.amountNTD)}</span>
                </li>
              ))}
              <li className="pt-1 flex items-baseline justify-between">
                <span className="text-xs font-bold" style={{ color: SC.textSub }}>總衝擊</span>
                <span className="text-2xl font-extrabold tabular-nums" style={{ color: SC.red }}>{fmtMoney(totalImpact)}</span>
              </li>
            </ul>
          </Card>

          {/* ③ PREDICTION — AI 預測 */}
          <Card accent={"#d97706"}>
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.red, letterSpacing: "0.12em" }}>③ PREDICTION</span>
              <h2 className="text-base font-semibold">AI 預測</h2>
            </div>
            <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>未來會怎樣（30/60/90 天）</div>
            <ul className="space-y-2.5">
              {[
                { period: "30 天", title: "銅料續漲 +5%",          impact: "毛利再 ↓ 0.8%",  tone: SC.red },
                { period: "60 天", title: "鋼料趨穩",                impact: "影響有限",       tone: "#d97706" },
                { period: "90 天", title: "USD/TWD 升破 32",         impact: "進口成本 +2%",   tone: SC.red },
              ].map((p) => (
                <li key={p.period} className="border-b pb-2 last:border-0" style={{ borderColor: SC.border }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold" style={{ color: SC.textSub }}>{p.period}</span>
                    <span className="text-[10px] font-mono" style={{ color: p.tone }}>{p.impact}</span>
                  </div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: SC.text }}>{p.title}</div>
                </li>
              ))}
              <li className="pt-1 flex items-baseline justify-between">
                <span className="text-xs font-bold" style={{ color: SC.textSub }}>AI 信心</span>
                <span className="text-base font-extrabold" style={{ color: SC.blue }}>91.8%</span>
              </li>
            </ul>
          </Card>

          {/* ④ ACTION — AI Action Queue */}
          <Card accent={SC.blue}>
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.primary, letterSpacing: "0.12em" }}>④ ACTION</span>
              <h2 className="text-base font-semibold">AI Action Queue</h2>
            </div>
            <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>要怎麼做（依優先級）</div>
            <ol className="space-y-2">
              {[
                { rank: "P1", title: "鎖價 銅 (Copper)", deadline: "48 小時內", impact: "預估擋損 280 萬", tone: SC.red },
                { rank: "P2", title: "鎖價 鋼 (Steel)",  deadline: "7 天內",    impact: "預估擋損 120 萬", tone: SC.amber },
                { rank: "P3", title: "原料替代評估",      deadline: "30 天內",   impact: "預估擋損 80 萬",  tone: SC.blue },
              ].map((a) => (
                <li key={a.rank} className="flex items-baseline gap-3 border-b pb-2 last:border-0" style={{ borderColor: SC.border }}>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white shrink-0" style={{ background: a.tone }}>{a.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-[10px]" style={{ color: SC.textSub }}>{a.impact}</div>
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: SC.textSub }}>{a.deadline}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Quick Nav 5 L levels */}
        <Card>
          <MiniLabel>下鑽到各層級</MiniLabel>
          <div className="grid sm:grid-cols-4 gap-2 mt-3">
            {[
              { href: "/erp/operations",  label: "L2 Operations",  zh: "工單作戰" },
              { href: "/erp/procurement", label: "L3 Procurement", zh: "AI 採購" },
              { href: "/erp/ai-engine",   label: "L4 AI Engine",   zh: "AI 決策" },
              { href: "/erp/market",      label: "L5 Market",      zh: "全球情報" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="block rounded-md border px-3 py-2.5 hover:shadow-sm transition-shadow"
                style={{ borderColor: SC.border, background: SC.surfaceDim }}>
                <div className="text-xs font-semibold" style={{ color: SC.primary }}>{l.label}</div>
                <div className="text-[10px]" style={{ color: SC.textSub }}>{l.zh}</div>
              </Link>
            ))}
          </div>
        </Card>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between flex-wrap gap-1" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · L1 Executive · /erp</span>
          <span><Link href="/erp/admin/sync" style={{ color: SC.blue }} className="hover:underline">鼎新 iGP 同步狀態 →</Link></span>
        </footer>
      </div>
    </div>
  );
}
