import Link from "next/link";
import { computePrAttention, prKpis } from "@/lib/erp/requisition";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "L3 Procurement · AI 採購中心" };

export default function L3ProcurementPage() {
  const prs = computePrAttention();
  const k = prKpis();

  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <meta httpEquiv="refresh" content="60" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L3 Procurement</div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">AI 採購中心</h1>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>實時採購最有情情資面</p>
        </header>

        {/* PO Dashboard */}
        <Card accent={SC.primary}>
          <h2 className="text-base font-semibold mb-3">PO Dashboard</h2>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="待採購" value={prs.filter((p) => p.pr.status === "approved").length} tone={SC.amber} />
            <Stat label="待交貨" value={18} tone={SC.blue} />
            <Stat label="已完"   value={k.doneToday} tone={SC.emerald} />
          </div>
        </Card>

        {/* Supplier Risk — 使用 KPI Card 形式 */}
        <Card accent={SC.amber}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">Supplier Risk · 使用 KPI Card</h2>
            <span className="text-[10px]" style={{ color: SC.textSub }}>4 維度評估</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>指標：</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "交期", value: "94%", tone: SC.emerald },
              { label: "品質", value: "98%", tone: SC.emerald },
              { label: "財務", value: "B+",  tone: SC.amber   },
              { label: "環境", value: "85",  tone: SC.blue    },
            ].map((s) => (
              <div key={s.label} className="rounded-md border p-3" style={{ borderColor: SC.border, borderLeft: `4px solid ${s.tone}` }}>
                <MiniLabel>{s.label}</MiniLabel>
                <div className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: s.tone }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Price Reasonability AI */}
        <Card accent={SC.blue}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">Price Reasonability AI · 議價合理性</h2>
            <span className="text-[10px]" style={{ color: SC.textSub }}>展示：</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: SC.border }}>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>供應商</th>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>報價</th>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>合理價</th>
                <th className="py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>落差</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sup: "A 廠", quote: 100, fair: 98,  delta: "+2%",  tone: SC.emerald },
                { sup: "B 廠", quote: 118, fair: 101, delta: "+17%", tone: SC.red     },
                { sup: "C 廠", quote: 97,  fair: 98,  delta: "-1%",  tone: SC.emerald },
              ].map((r) => (
                <tr key={r.sup} className="border-b" style={{ borderColor: SC.border }}>
                  <td className="py-2 font-semibold" style={{ color: SC.text }}>{r.sup}</td>
                  <td className="py-2 font-mono" style={{ color: SC.blue }}>{r.quote}</td>
                  <td className="py-2 font-mono" style={{ color: SC.text }}>{r.fair}</td>
                  <td className="py-2 font-mono font-bold" style={{ color: r.tone }}>{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Cost Saving */}
        <Card accent={SC.emerald}>
          <h2 className="text-base font-semibold mb-3">Cost Saving</h2>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Cost Down"      value="$ 4.8M" tone={SC.emerald} />
            <Stat label="Cost Avoidance" value="$ 2.1M" tone={SC.blue} />
            <Stat label="PPV"            value="-1.2%"  tone={SC.amber} />
          </div>
          <div className="text-[10px] mt-3" style={{ color: SC.textSub }}>
            Cost Down：實際年降<br/>
            Cost Avoidance：擋住的漲價<br/>
            PPV：Purchase Price Variance
          </div>
        </Card>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · L3 Procurement · /erp/procurement</span>
          <Link href="/erp/requisition" style={{ color: SC.blue }} className="hover:underline">→ Requisition Center</Link>
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-md p-4" style={{ background: SC.surfaceDim }}>
      <MiniLabel>{label}</MiniLabel>
      <div className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: tone }}>{value}</div>
    </div>
  );
}
