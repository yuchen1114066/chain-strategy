import Link from "next/link";
import CostIntelligenceCenterCard from "@/components/erp/CostIntelligenceCenterCard";

export const metadata = { title: "AI 採購情報中心 · 管理後台" };

export default function AdminCostIntelligencePage() {
  return (
    <div className="p-6 space-y-5">
      <header>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          ADMIN BACKEND · INTERNAL ONLY
        </div>
        <h1 className="text-2xl font-bold mt-1">📊 AI 採購情報中心 · 終評</h1>
        <p className="text-sm text-slate-500 mt-1">
          SaaS 賣點視角；不對外開放，亦不在 <Link href="/erp/quotation-analyzer" className="underline text-emerald-700">/erp/quotation-analyzer</Link> 公開頁顯示。
        </p>
      </header>

      <CostIntelligenceCenterCard />

      <section className="rounded-xl border bg-slate-50/60 p-4 text-xs text-slate-600 leading-relaxed">
        <b>為什麼搬到管理後台？</b>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          <li>內部評分（OVERALL 99 / 100、各模組分數）屬商業策略訊息，不適合給供應商或一般採購員看到。</li>
          <li>採購人員只需看到分析結果（Should-Cost、退單 / 議價建議），不需要看「我家系統值多少分」。</li>
          <li>放在 admin/cost-intelligence 後續可疊權限：之後 RBAC 上線僅 role === &apos;admin&apos; 可進。</li>
        </ul>
      </section>
    </div>
  );
}
