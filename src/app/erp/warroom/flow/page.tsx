import Link from "next/link";
import { computePrAttention, prKpis, DEMAND_SIGNAL_FLOW } from "@/lib/erp/requisition";
import { partHealth, computeInventoryKpis } from "@/lib/erp/inventory-health";
import { workOrders } from "@/lib/erp/seed";

export const revalidate = 60;
export const metadata = { title: "戰情中心 — 流向監控 P2" };

export default function WarRoomFlowPage() {
  const prs = computePrAttention();
  const k = prKpis();
  const inv = computeInventoryKpis();
  const ph = partHealth();

  // 8 段流向 + 卡點數
  const stages = [
    { n: 1, label: "PR 請購",    zh: "需求觸發",  blocked: k.unassignedPr + k.approvalDelay, total: k.total, href: "/erp/requisition" },
    { n: 2, label: "Approval",   zh: "簽核流程",  blocked: k.approvalDelay,                  total: k.inFlight, href: "/erp/requisition" },
    { n: 3, label: "RFQ",        zh: "詢價中",    blocked: prs.filter((p) => p.pr.status === "in_rfq").length, total: k.inFlight, href: "/erp/negotiation" },
    { n: 4, label: "PO 發送",    zh: "採購下單",  blocked: 2,                                total: 18, href: "/erp/po-generator" },
    { n: 5, label: "ASN",        zh: "供應商承諾", blocked: 1,                                total: 18, href: "/erp/eta-forecast" },
    { n: 6, label: "Receiving",  zh: "倉庫收料",  blocked: 1,                                total: 8,  href: "/erp/mobile" },
    { n: 7, label: "WIP",        zh: "投線生產",  blocked: workOrders.filter((w) => w.status === "active").length - 8, total: workOrders.length, href: "/os/manufacturing" },
    { n: 8, label: "Delivery",   zh: "出貨交付",  blocked: 1,                                total: 12, href: "/os/delivery" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        <header className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            戰情中心 <span className="text-slate-400 font-normal">— 流向監控 P2</span>
          </h1>
          <nav className="flex items-center gap-1 text-xs">
            <Link href="/erp/warroom" className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">📊 總裁首頁</Link>
            <span className="px-3 py-1.5 rounded-md bg-slate-900 text-white font-semibold">🔄 流向監控</span>
            <Link href="/erp/warroom/detail" className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100">🔍 深度分析</Link>
            <Link href="/erp" className="px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100">← Control Tower</Link>
          </nav>
        </header>

        {/* 訂單流向 8 段 + 卡點 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-900">訂單流向 + 各段卡點</h2>
            <span className="text-xs text-slate-500">Demand Signal → Delivery</span>
          </div>

          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <div className="grid grid-cols-8 gap-2 min-w-[720px]">
              {stages.map((s) => {
                const heat = s.blocked === 0 ? "border-emerald-200 bg-emerald-50/40 text-emerald-700"
                           : s.blocked <= 2  ? "border-amber-200 bg-amber-50/40 text-amber-700"
                           :                    "border-rose-300 bg-rose-50/50 text-rose-700";
                return (
                  <Link key={s.n} href={s.href} className={`block rounded-xl border-2 ${heat} p-3 hover:shadow-md transition-shadow`}>
                    <div className="text-[9px] uppercase tracking-widest font-bold opacity-70">Stage {s.n}</div>
                    <div className="text-sm font-bold mt-0.5">{s.label}</div>
                    <div className="text-[10px] opacity-70 mb-2">{s.zh}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase opacity-70">卡點</span>
                      <span className="text-2xl font-extrabold tabular-nums">{s.blocked}</span>
                    </div>
                    <div className="text-[10px] opacity-60">/ {s.total} 總筆</div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-500">點擊各段下鑽到對應 L3 工作台</div>
        </section>

        {/* 4 個操作子模組 */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* 模組 A — 倉庫收料作業 */}
          <Module emoji="📦" title="倉庫收料作業" subtitle="今日 ASN + IQC + 入庫" href="/erp/mobile">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="今日到貨 ASN" value="3" sub="2 已收 / 1 在途" />
              <Stat label="IQC 待檢驗" value="1" sub="FB64-PSU × 150" tone="amber" />
              <Stat label="入庫排隊" value="2" sub="WMS 待上架" />
            </div>
            <ul className="text-xs space-y-1 text-slate-700">
              <li>• ASN #A-2026-0521 — SUP-AX 鋼材 500kg，預計 14:30 到</li>
              <li>• ASN #A-2026-0522 — 電源廠 PSU × 150，已 IQC 異常待 CAR</li>
              <li>• <Link href="/erp/mobile" className="text-blue-600 hover:underline">→ 開啟 QR 掃碼收料</Link></li>
            </ul>
          </Module>

          {/* 模組 B — 採購訂單發送 */}
          <Module emoji="🛒" title="採購訂單發送" subtitle="今日 PO 動態" href="/erp/po-generator">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="待發 PO" value={String(prs.filter((p) => p.pr.status === "approved").length)} sub="已核准未下單" />
              <Stat label="今日已發" value="4" sub="$ 580 萬" tone="emerald" />
              <Stat label="逾期未發" value="2" sub="超過 SLA 72hr" tone="rose" />
            </div>
            <ul className="text-xs space-y-1 text-slate-700">
              {prs.filter((p) => p.pr.status === "approved").slice(0, 3).map((p) => (
                <li key={p.pr.id}>• {p.pr.prNo} {p.pr.partName} × {p.pr.qty} — <Link href="/erp/po-generator" className="text-blue-600 hover:underline">立即下單</Link></li>
              ))}
            </ul>
          </Module>

          {/* 模組 C — 廠商交貨追蹤 */}
          <Module emoji="🚚" title="廠商交貨追蹤" subtitle="ETA + 風險" href="/erp/eta-forecast">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="在途 PO" value="18" sub="總金額 $1,820 萬" />
              <Stat label="ETA 延遲" value="3" sub="平均 +2.5 天" tone="amber" />
              <Stat label="高風險" value="1" sub="LME 銅料漲價" tone="rose" />
            </div>
            <ul className="text-xs space-y-1 text-slate-700">
              <li>• PO-2026-0508 SUP-AX — ETA 6/2，提前 1 天 ✓</li>
              <li>• PO-2026-0512 電源廠 — ETA 6/5，延 2 天 ⚠</li>
              <li>• <Link href="/erp/eta-forecast" className="text-blue-600 hover:underline">→ 查看完整 ETA 預測</Link></li>
            </ul>
          </Module>

          {/* 模組 D — 庫存週轉警示 */}
          <Module emoji="📊" title="庫存健康即時" subtitle="DOH + 安全水位" href="/erp/analytics">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="DOH 中位" value={`${Math.round(inv.dohMedian)}d`} tone={inv.dohMedian > 14 ? "emerald" : "amber"} />
              <Stat label="低於安全" value={String(inv.belowSafetyCount)} sub={`${(100 - inv.safetyCompliance).toFixed(0)}%`} tone="amber" />
              <Stat label="呆滯料件" value={String(inv.agingCount)} sub="> 180 天" />
            </div>
            <ul className="text-xs space-y-1 text-slate-700">
              {ph.filter((p) => p.isBelowSafety).slice(0, 3).map((p) => (
                <li key={p.part.id}>• {p.part.name}：庫存 {p.part.stockOnHand} / 安全 {p.part.safetyStock}（缺 {Math.max(0, p.part.safetyStock - p.part.stockOnHand)}）</li>
              ))}
              {ph.filter((p) => p.isBelowSafety).length === 0 && <li className="text-emerald-600">✓ 所有料件皆在安全水位以上</li>}
            </ul>
          </Module>
        </div>

        {/* Demand Signal Flow ref */}
        <section className="bg-white/70 rounded-2xl border border-slate-200 p-5">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">📡 完整供應鏈訊號鏈（12 段）</div>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {DEMAND_SIGNAL_FLOW.map((d) => (
              <div key={d.n} className="text-center p-2 rounded-md border border-slate-200 bg-white">
                <div className="text-base">{d.emoji}</div>
                <div className="text-[10px] font-semibold text-slate-700">{d.zh}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 pt-3 border-t border-slate-200">
          <span>祺驊 CHI HUA · /erp/warroom/flow</span>
          <span><Link href="/erp/admin/sync" className="text-blue-600 hover:underline">鼎新 iGP 同步狀態</Link></span>
        </footer>
      </div>
    </div>
  );
}

function Module({ emoji, title, subtitle, href, children }: { emoji: string; title: string; subtitle: string; href: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <header className="flex items-baseline gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <Link href={href} className="text-base font-bold text-slate-900 hover:text-blue-600">{title}</Link>
        <span className="text-xs text-slate-500">{subtitle}</span>
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" | "amber" | "rose" }) {
  const text = tone === "emerald" ? "text-emerald-700"
             : tone === "amber"   ? "text-amber-700"
             : tone === "rose"    ? "text-rose-700"
             :                       "text-slate-900";
  return (
    <div className="bg-slate-50/60 rounded-lg border border-slate-100 px-2 py-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-xl font-bold tabular-nums leading-tight ${text}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
