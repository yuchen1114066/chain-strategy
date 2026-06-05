import Link from "next/link";

export const metadata = { title: "Should-Cost · 已整合至 L5 Price Validation Engine" };

export default function ShouldCostPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="rounded-2xl border-2 border-dashed p-8 bg-white" style={{ borderColor: "#dcebc4" }}>
        <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded mb-3 text-xs font-bold text-white" style={{ background: "#c026d3", letterSpacing: "0.1em" }}>
          MOVED · 已整合
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Should-Cost 不再是獨立分頁
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          此功能（成本拆解 + 漲價合理性判斷）已重新定位為
          <b className="text-slate-900 mx-1">AI Supplier Price Validation Engine</b>
          的 Drill-Down 詳細分析頁，整合進 L5 Profit Defense 最終版。原因：
        </p>
        <ul className="text-sm text-slate-700 space-y-1.5 mb-5 pl-5 list-disc">
          <li>它是<b>分析引擎</b>，不是獨立決策中心</li>
          <li>系統已能完整跑：市場情報 → 商品影響 → 供應商曝險 → 漲價合理性 → AI 同步方案</li>
          <li>避免左側 Menu 出現重複的功能模組</li>
        </ul>

        <div className="rounded-xl p-4 mb-5" style={{ background: "#f0f7e4", border: "1px solid #dcebc4" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#4d7c0f", letterSpacing: "0.12em" }}>
            新的路徑
          </div>
          <div className="text-sm text-slate-800">
            <Link href="/erp/l5-final" className="font-bold underline" style={{ color: "#4d7c0f" }}>
              /erp/l5-final
            </Link>
            <span className="mx-1">→</span>
            STAGE 07 · Price Validation
            <span className="mx-1">→</span>
            <span className="font-bold">點任一料號展開 Should-Cost Breakdown</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/erp/l5-final"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold text-sm"
            style={{ background: "#76b900" }}
          >
            → 前往 L5 Final · Price Validation
          </Link>
          <Link
            href="/erp/profit-defense"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border"
            style={{ borderColor: "#dadfd0", color: "#5b6356" }}
          >
            或回 Profit Defense
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
        Should-Cost 模型仍由 src/lib/erp/negotiation.ts 提供（其他頁面引用），僅 UI 入口已遷移。
      </p>
    </div>
  );
}
