"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitcher from "./LangSwitcher";

// L1 軍事指揮中心 + L2 六大作戰中心
const primaryLinks = [
  { href: "/erp", label: "🎯 軍事指揮中心（L1）", icon: "🎯", primary: true },
  { href: "/erp/warroom", label: "🪖 CEO 戰情中心", icon: "🪖" },
  { href: "/erp/profit-defense", label: "🛡 AI Profit Defense", icon: "🛡" },
  { href: "/roadmap", label: "🛣 4 Phase 路線圖", icon: "🛣" },
  { href: "/architecture", label: "🏛 5-Layer 架構", icon: "🏛" },
  { href: "/architecture/constitution", label: "📜 架構憲法 5 鐵律", icon: "📜" },
  { href: "/os", label: "📋 6 大作戰中心（L2）", icon: "📋" },
  { href: "/os/supplier", label: "1. 供應商作戰", icon: "🤝" },
  { href: "/os/delivery", label: "2. 交付指揮", icon: "🚚" },
  { href: "/os/manufacturing", label: "3. 生產指揮塔", icon: "🏭" },
  { href: "/os/inventory", label: "4. 庫存倉儲", icon: "📦" },
  { href: "/os/procurement", label: "5. 採購情報", icon: "💎" },
  { href: "/os/decision", label: "6. AI 決策中心 ⭐", icon: "🧠" },
  { href: "/erp/requisition", label: "📡 Requisition Control Center", icon: "📡" },
];

// 系統管理 + 底層架構
const systemLinks = [
  { href: "/erp/admin", label: "⚙️ 管理後台", icon: "⚙️" },
  { href: "/erp/admin/engines", label: "🧠 4 大核心 Engine", icon: "🧠" },
  { href: "/erp/admin/observability", label: "🔭 Observability", icon: "🔭" },
  { href: "/erp/admin/event-engine", label: "⚡ Event Engine", icon: "⚡" },
  { href: "/erp/admin/sync", label: "🔄 鼎新同步儀表板", icon: "🔄" },
  { href: "/erp/admin/mdm", label: "📚 MDM 主資料", icon: "📚" },
  { href: "/erp/admin/access-control", label: "🔐 RBAC + ABAC", icon: "🔐" },
  { href: "/erp/integration", label: "🔌 鼎新整合說明", icon: "🔌" },
];

// Phase 2+ 進階：分析 / 規劃 / 參照
const advancedLinks = [
  { href: "/erp/flow", label: "流程綜觀", icon: "🌊" },
  { href: "/erp/viz", label: "可視化儀表板", icon: "📈" },
  { href: "/erp/alerts", label: "異常警訊 + AI 解方", icon: "🚨" },
  { href: "/erp/negotiation", label: "AI 議價引擎", icon: "🤝" },
  { href: "/erp/should-cost", label: "Should-Cost 拆解", icon: "💎" },
  { href: "/erp/calendar", label: "排程日曆", icon: "📅" },
  { href: "/erp/customers", label: "客戶分析", icon: "👥" },
  { href: "/erp/simulator", label: "缺料模擬器", icon: "🔮" },
  { href: "/erp/analytics", label: "零件分析", icon: "📊" },
  { href: "/erp/reorder", label: "再下單時點", icon: "📦" },
  { href: "/erp/dead-stock", label: "呆料預警", icon: "🗑️" },
  { href: "/erp/outsource", label: "委外倉管理", icon: "🏭" },
  { href: "/erp/models", label: "型號 + BOM", icon: "🏗️" },
  { href: "/erp/bom-compare", label: "BOM 對照", icon: "🔍" },
  { href: "/erp/parts", label: "零件主檔", icon: "🔩" },
  { href: "/erp/suppliers", label: "供應商", icon: "🏭" },
  { href: "/erp/po-generator", label: "採購單生成", icon: "🛒" },
  { href: "/erp/import", label: "鼎新報表同步", icon: "📥" },
  { href: "/erp/integration", label: "🔌 鼎新 ERP 整合說明", icon: "🔌" },
  { href: "/erp/mobile", label: "QR 查碼", icon: "📱" },
  { href: "/erp/mobile/count", label: "盤點對照", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const inAdvanced = advancedLinks.some((l) => pathname.startsWith(l.href));
  const [showAdvanced, setShowAdvanced] = useState(inAdvanced);

  const inSystem = systemLinks.some((l) => pathname.startsWith(l.href));
  const [showSystem, setShowSystem] = useState(inSystem);

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
              <div className="text-[10px] text-cyan-300 leading-tight font-semibold">
                AI Supply Chain Flow
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">
                Control Tower → Autonomous OS
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 主功能 */}
      <nav className="py-3">
        <div className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          🎯 L1 + L2 主導覽
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

        {/* 系統架構與管理（可折疊） */}
        <button
          onClick={() => setShowSystem((v) => !v)}
          className="w-full mt-3 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          <span>{showSystem ? "▾" : "▸"}</span>
          <span>⚙️ 系統管理 + 4 大底層</span>
        </button>
        {showSystem && (
          <div>
            {systemLinks.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href}
                  className={`flex items-center gap-2 px-5 py-2 text-xs transition-colors border-l-2 ${
                    active ? "bg-slate-800/60 border-cyan-400 text-white" : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}>
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* 進階工具（可折疊） */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full mt-3 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 flex items-center gap-1"
        >
          <span>{showAdvanced ? "▾" : "▸"}</span>
          <span>🔧 L3 所有工具頁（{advancedLinks.length}）</span>
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
        <div className="mb-3"><LangSwitcher /></div>
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
