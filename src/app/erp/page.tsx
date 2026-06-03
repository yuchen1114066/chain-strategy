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

        {/* 第一區（最大）— Executive Summary */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-5">
            <h2 className="text-xl font-semibold">第一區 · Executive Summary</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>L1·EXECUTIVE</span>
          </div>

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

        {/* Profit Impact + AI Action Queue */}
        <div className="grid md:grid-cols-2 gap-5">
          <Card accent={SC.red}>
            <h2 className="text-base font-semibold mb-3">Profit Impact</h2>
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

          <Card accent={SC.blue}>
            <h2 className="text-base font-semibold mb-3">AI Action Queue</h2>
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
