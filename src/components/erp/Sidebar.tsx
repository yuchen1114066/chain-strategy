"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 主功能：貨件追蹤 + 卡點 AI 解方
const primaryLinks = [
  { href: "/erp", label: "戰情室", icon: "🎯", primary: true },
  { href: "/erp/wms", label: "WMS 戰情 Dashboard", icon: "⚡" },
  { href: "/erp/flow", label: "流程綜觀", icon: "🌊" },
  { href: "/erp/viz", label: "可視化儀表板", icon: "📈" },
  { href: "/erp/alerts", label: "異常警訊 + AI 解方", icon: "🚨" },
  { href: "/erp/shortage-wall", label: "缺料牆", icon: "🧱" },
  { href: "/erp/work-orders", label: "工單追蹤", icon: "📋" },
];

// 進階工具：分析 / 規劃 / 參照（資料源仍以鼎新為準）
const advancedLinks = [
  { href: "/erp/calendar", label: "排程日曆", icon: "📅" },
  { href: "/erp/customers", label: "客戶分析", icon: "👥" },
  { href: "/erp/simulator", label: "缺料模擬器", icon: "🔮" },
  { href: "/erp/analytics", label: "零件分析", icon: "📊" },
  { href: "/erp/materials", label: "原物料 AI 戰情室", icon: "🌐" },
  { href: "/erp/reorder", label: "再下單時點", icon: "📦" },
  { href: "/erp/dead-stock", label: "呆料預警", icon: "🗑️" },
  { href: "/erp/outsource", label: "委外倉管理", icon: "🏭" },
  { href: "/erp/models", label: "型號 + BOM", icon: "🏗️" },
  { href: "/erp/bom-compare", label: "BOM 對照", icon: "🔍" },
  { href: "/erp/parts", label: "零件主檔", icon: "🔩" },
  { href: "/erp/suppliers", label: "供應商", icon: "🏭" },
  { href: "/erp/po-generator", label: "採購單生成", icon: "🛒" },
  { href: "/erp/import", label: "鼎新報表同步", icon: "📥" },
  { href: "/erp/mobile", label: "QR 查碼", icon: "📱" },
  { href: "/erp/mobile/count", label: "盤點對照", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const inAdvanced = advancedLinks.some((l) => pathname.startsWith(l.href));
  const [showAdvanced, setShowAdvanced] = useState(inAdvanced);

  // WMS Dashboard 為全螢幕暗色旗艦頁，自帶 sidebar
  if (pathname.startsWith("/erp/wms")) return null;

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
                貨件流程監控
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 主功能 */}
      <nav className="py-3">
        <div className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          ⚡ 核心功能
        </div>
        {primaryLinks.map((l) => {
          const active = l.href === "/erp" ? pathname === "/erp" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                active
                  ? "bg-slate-800/60 border-cyan-400 text-white"
                  : "border-transparent text-slate-200 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <span className="text-base">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}

        {/* 進階工具（可折疊） */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full mt-3 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          <span>{showAdvanced ? "▾" : "▸"}</span>
          <span>🛠️ 進階工具（資料以鼎新為準）</span>
        </button>
        {showAdvanced && (
          <div>
            {advancedLinks.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 px-5 py-2 text-xs transition-colors border-l-2 ${
                    active
                      ? "bg-slate-800/60 border-cyan-400 text-white"
                      : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="px-5 py-4 mt-4 text-[11px] text-slate-500 border-t border-slate-800 leading-relaxed">
        <div className="font-semibold text-slate-400 mb-1">資料來源</div>
        <div className="flex items-center gap-1 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 text-[10px]">同步鼎新 ERP iGP</span>
        </div>
        <div className="text-[10px] opacity-70">
          R:\業務&amp;採購協調追蹤<br />
          Q:\採購課\成品成本分析<br />
          祺驊_PM系統_技術建置文件
        </div>
      </div>
    </aside>
  );
}
