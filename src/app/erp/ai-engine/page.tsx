import Link from "next/link";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "L4 AI Engine · AI 決策中心" };

export default function L4AiEnginePage() {
  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <meta httpEquiv="refresh" content="60" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L4 AI Engine</div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">AI 決策中心</h1>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>連到 AI Brain · 預測 + 規則 + Copilot</p>
        </header>

        {/* Commodity Forecast */}
        <Card accent={SC.blue}>
          <h2 className="text-base font-semibold mb-3">Commodity Forecast · 原物料預測</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { period: "30 天", price: "$ 8,580", delta: "+1.5%", tone: SC.amber },
              { period: "90 天", price: "$ 8,920", delta: "+5.6%", tone: SC.red   },
              { period: "180 天", price: "$ 9,250", delta: "+9.5%", tone: SC.red  },
            ].map((f) => (
              <div key={f.period} className="rounded-md p-3 border" style={{ background: SC.surfaceDim, borderColor: SC.border }}>
                <MiniLabel>{f.period}</MiniLabel>
                <div className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: f.tone }}>{f.price}</div>
                <div className="text-[10px] font-semibold mt-0.5" style={{ color: f.tone }}>{f.delta}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Margin Impact */}
        <Card accent={SC.red}>
          <h2 className="text-base font-semibold mb-3">Margin Impact · 毛利衝擊</h2>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-semibold" style={{ color: SC.textSub }}>毛利率 18.2</span>
            <span className="text-2xl" style={{ color: SC.red }}>↓</span>
            <span className="text-5xl font-extrabold tabular-nums" style={{ color: SC.red }}>16.8</span>
            <span className="text-2xl" style={{ color: SC.red }}>%</span>
          </div>
          <div className="text-[11px]" style={{ color: SC.textSub }}>較預算下降 1.4%（原物料 + 匯率衝擊）</div>
        </Card>

        {/* Inventory Risk */}
        <Card accent={SC.amber}>
          <h2 className="text-base font-semibold mb-3">Inventory Risk · 庫存風險</h2>
          <ul className="space-y-2">
            {[
              { label: "缺料",   count: 5,  tone: SC.red },
              { label: "停線",   count: 2,  tone: SC.red },
              { label: "呆庫料", count: 12, tone: SC.amber },
            ].map((r) => (
              <li key={r.label} className="flex items-center justify-between border-b pb-2 last:border-0" style={{ borderColor: SC.border }}>
                <span className="text-sm">{r.label}</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: r.tone }}>{r.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* AI Rule Engine */}
        <Card accent={SC.primary}>
          <h2 className="text-base font-semibold mb-3">AI Rule Engine · 規則引擎</h2>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>展示：</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: SC.border }}>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>Rule</th>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>Trigger</th>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { rule: "原料價 > μ+σ",   trigger: "銅價突破 $8,500",  action: "通知採購 + 鎖價建議" },
                { rule: "PR 未簽 > 24hr", trigger: "PR-2026-1002 延誤", action: "上呈一層 + 推薦動作" },
                { rule: "庫存 < 安全水位", trigger: "FB64-PSU 缺料",     action: "MRP 觸發急購 PR"     },
              ].map((r) => (
                <tr key={r.rule} className="border-b" style={{ borderColor: SC.border }}>
                  <td className="py-2 font-mono text-xs" style={{ color: SC.text }}>{r.rule}</td>
                  <td className="py-2 text-xs" style={{ color: SC.textSub }}>{r.trigger}</td>
                  <td className="py-2 text-xs font-semibold" style={{ color: SC.primary }}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* AI Copilot */}
        <Card accent={SC.blue}>
          <h2 className="text-base font-semibold mb-3">AI Copilot · AI 副駕</h2>
          <div className="rounded-md p-4 border" style={{ background: SC.surfaceDim, borderColor: SC.border }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.blue }}>例如</div>
            <ul className="text-sm space-y-1.5" style={{ color: SC.text }}>
              <li>· 提前採購 <b style={{ color: SC.primary }}>15%</b></li>
              <li>· 預估節省 <b className="font-mono" style={{ color: SC.emerald }}>$153,700 USD</b></li>
              <li>· 風險：銅價 30 日內預測續漲 5.6%</li>
              <li>· 信心：91.8%</li>
            </ul>
          </div>

          <button className="mt-4 px-5 py-2 rounded text-sm font-semibold text-white" style={{ background: SC.primary }}>
            建立採購策略
          </button>
        </Card>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · L4 AI Engine · /erp/ai-engine</span>
          <Link href="/erp/market" style={{ color: SC.blue }} className="hover:underline">→ L5 Market Intelligence</Link>
        </footer>
      </div>
    </div>
  );
}
