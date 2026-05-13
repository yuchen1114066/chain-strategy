"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/erp", label: "戰情室", icon: "🎯" },
  { href: "/erp/flow", label: "流程綜觀", icon: "🌊" },
  { href: "/erp/viz", label: "可視化儀表板", icon: "📈", highlight: true },
  { href: "/erp/analytics", label: "零件分析", icon: "📊" },
  { href: "/erp/simulator", label: "缺料模擬器", icon: "🔮" },
  { href: "/erp/work-orders", label: "工單追蹤", icon: "📋" },
  { href: "/erp/calendar", label: "排程日曆", icon: "📅" },
  { href: "/erp/customers", label: "客戶分析", icon: "👥" },
  { href: "/erp/models", label: "型號 + BOM", icon: "🏗️" },
  { href: "/erp/bom-compare", label: "BOM 對照", icon: "🔍" },
  { href: "/erp/parts", label: "零件主檔", icon: "🔩" },
  { href: "/erp/suppliers", label: "供應商", icon: "🏭" },
  { href: "/erp/po-generator", label: "採購單生成", icon: "🛒", highlight: true },
  { href: "/erp/alerts", label: "異常警訊", icon: "🚨" },
  { href: "/erp/import", label: "BOM 匯入", icon: "📥" },
  { href: "/erp/mobile", label: "QR 查碼", icon: "📱" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 min-h-screen">
      <div className="px-5 py-5 border-b border-slate-800">
        <Link href="/erp" className="block">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              C
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-wide leading-tight">
                祺驊 CHI HUA
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                業務 / 採購協調追蹤
              </div>
            </div>
          </div>
        </Link>
      </div>
      <nav className="py-3">
        {links.map((l) => {
          const active = l.href === "/erp" ? pathname === "/erp" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                active
                  ? "bg-slate-800/60 border-cyan-400 text-white"
                  : l.highlight
                  ? "border-transparent text-cyan-300 hover:bg-slate-800/40"
                  : "border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              <span>{l.label}</span>
              {l.highlight && !active && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-cyan-500 text-white font-bold">NEW</span>}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 mt-4 text-[11px] text-slate-500 border-t border-slate-800 leading-relaxed">
        <div className="font-semibold text-slate-400 mb-1">參考來源</div>
        WorkFlow ERP iGP<br />
        R:\業務&amp;採購協調追蹤<br />
        Q:\採購課\成品成本分析<br />
        祺驊_PM系統_技術建置文件
      </div>
    </aside>
  );
}
