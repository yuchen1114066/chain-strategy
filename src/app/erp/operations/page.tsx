import Link from "next/link";
import { workOrders } from "@/lib/erp/seed";
import { computePrAttention } from "@/lib/erp/requisition";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "L2 Operations · 工單作戰中心" };

export default function L2OperationsPage() {
  const wos = workOrders;
  const normal  = Math.round(wos.length * 0.65);
  const abnormal = Math.round(wos.length * 0.20);
  const delayed = wos.length - normal - abnormal;
  const otd = 97.2;
  const prCritical = computePrAttention().filter((p) => p.riskBucket === "critical")[0];

  const stages = [
    { code: "PR",         label: "PR 請購",   count: 12, tone: SC.amber },
    { code: "PO",         label: "PO 採購",   count: 18, tone: SC.emerald },
    { code: "IQC",        label: "IQC 驗收",  count: 5,  tone: SC.amber },
    { code: "Production", label: "投線生產",  count: 8,  tone: SC.emerald },
    { code: "OQC",        label: "OQC 出檢",  count: 3,  tone: SC.emerald },
    { code: "Shipment",   label: "出貨交付",  count: 6,  tone: SC.blue },
  ];

  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L2 Operations</div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">工單作戰中心</h1>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>留卡片 · 工單健康 + 端到端追蹤 + AI 卡點分析</p>
        </header>

        {/* Order Health */}
        <Card accent={SC.primary}>
          <h2 className="text-base font-semibold mb-3">Order Health · 工單健康</h2>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="正常" value={normal}    tone={SC.emerald} />
            <Stat label="異常" value={abnormal}  tone={SC.amber} />
            <Stat label="延遲" value={delayed}   tone={SC.red} />
          </div>
        </Card>

        {/* End-To-End Tracker */}
        <Card accent={SC.blue}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold">End-To-End Tracker · 端到端</h2>
            <span className="text-[10px]" style={{ color: SC.textSub }}>各階段在製數</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {stages.map((s, i) => (
              <div key={s.code} className="text-center rounded-md border p-3" style={{ borderColor: SC.border, background: SC.surfaceDim }}>
                <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>{`Stage ${i + 1}`}</div>
                <div className="text-2xl font-extrabold tabular-nums mt-1" style={{ color: s.tone }}>{s.count}</div>
                <div className="text-[10px] mt-0.5" style={{ color: SC.text }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottleneck AI + OTD */}
        <div className="grid md:grid-cols-[1fr,260px] gap-5">
          <Card accent={SC.red}>
            <h2 className="text-base font-semibold mb-3">Bottleneck AI · AI 卡點分析</h2>
            <div className="rounded-md p-4" style={{ background: SC.surfaceDim }}>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.red }}>CRITICAL</span>
                <span className="text-sm font-bold">工單 A002 · {prCritical?.pr.partName ?? "FB64-PSU"}</span>
              </div>
              <ul className="text-xs space-y-1" style={{ color: SC.text }}>
                <li>· 狀態：<span style={{ color: SC.red }}>缺料</span></li>
                <li>· 影響：<span className="font-bold" style={{ color: SC.red }}>280 萬</span>（OTD ↓）</li>
                <li>· AI 建議：<span style={{ color: SC.primary }}>替代料</span> FB64-PSU-V2（庫存 245 件）</li>
              </ul>
              <Link href="/erp/requisition" className="inline-block mt-3 text-[11px] font-semibold" style={{ color: SC.blue }}>查看 PR 細節 →</Link>
            </div>
          </Card>

          <Card accent={SC.emerald}>
            <h2 className="text-base font-semibold mb-3">OTD</h2>
            <div className="text-5xl font-extrabold tabular-nums" style={{ color: SC.emerald }}>{otd.toFixed(1)}<span className="text-2xl">%</span></div>
            <div className="text-[10px] mt-1" style={{ color: SC.textSub }}>On-Time Delivery（過去 30 天）</div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: SC.surfaceDim }}>
              <div className="h-full rounded-full" style={{ width: `${otd}%`, background: SC.emerald }} />
            </div>
          </Card>
        </div>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · L2 Operations · /erp/operations</span>
          <Link href="/erp/requisition" style={{ color: SC.blue }} className="hover:underline">→ 進入 Requisition Center</Link>
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md p-4" style={{ background: SC.surfaceDim }}>
      <MiniLabel>{label}</MiniLabel>
      <div className="text-4xl font-extrabold tabular-nums mt-1" style={{ color: tone }}>{value}</div>
    </div>
  );
}
