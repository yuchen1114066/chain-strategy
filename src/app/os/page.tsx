import Link from "next/link";
import { allCenters } from "@/lib/erp/operations-centers";

// /os 入口頁：6 大作戰中心索引

export default function OsIndexPage() {
  const centers = allCenters();
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🎯 6 大作戰中心 — Operations Centers</h1>
        <p className="text-sm text-slate-500 mt-1">
          第二層真正核心：不是「細節頁面」而是「作戰領域」
        </p>
      </header>

      <section className="rounded-xl border-2 border-cyan-200 bg-cyan-50/40 p-4 text-sm">
        <div className="font-bold text-cyan-900 mb-1">📐 設計理念</div>
        <p className="text-slate-700 leading-relaxed">
          首頁 <Link href="/erp" className="text-cyan-700 underline">Control Tower</Link> 給 CEO/VP 3 秒看公司是否安全。
          第二層的 6 大作戰中心給該領域 owner 進入細節：採購進「Supplier」、業務進「Delivery」、廠長進「Manufacturing」、倉管進「Inventory」、議價進「Procurement」、副總進「AI Decision」。
          每個 Center 都是一個獨立指揮中心，含 KPI / 待處理事項 / 該領域工具。
        </p>
      </section>

      {/* 6 大作戰中心卡片 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {centers.map((c, idx) => (
          <Link key={c.slug} href={`/os/${c.slug}`}
            className={`block rounded-xl text-white p-5 transition-transform hover:scale-[1.02] bg-gradient-to-br ${c.bgGradient} shadow-md`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-5xl">{c.emoji}</span>
              <div className="text-right">
                <span className="text-[10px] tracking-widest uppercase opacity-80 font-bold block">Center {idx + 1}</span>
                <code className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded mt-1 inline-block">/os/{c.slug}</code>
              </div>
            </div>
            <div className="text-xl font-extrabold">{c.title}</div>
            <div className="text-base font-bold opacity-90 mt-0.5">{c.titleEn}</div>
            <p className="text-xs opacity-85 mt-2 leading-relaxed line-clamp-3">{c.role}</p>
            <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-3 gap-2">
              <div>
                <div className="text-[9px] opacity-70">KPIs</div>
                <div className="font-bold">{c.kpis.length}</div>
              </div>
              <div>
                <div className="text-[9px] opacity-70">待處理</div>
                <div className="font-bold">{c.alerts.length}</div>
              </div>
              <div>
                <div className="text-[9px] opacity-70">工具</div>
                <div className="font-bold">{c.links.length}</div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 三層架構</b>
        <br />
        <b>L1 戰情室 /erp</b> — CEO/VP 3 秒看公司是否安全（8 大區塊：Risk Radar / Event Stream / AI Decision Queue / Health × 2 / Density / KPI / 定位）
        <br />
        <b>L2 6 大作戰中心 /os/*</b> — 各領域 owner 的指揮中心（這層）
        <br />
        <b>L3 工具與分頁</b> — 個別功能頁（從 L2 進入）
      </p>
    </div>
  );
}
