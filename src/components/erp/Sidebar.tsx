"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitcher from "./LangSwitcher";

// ============================================================
// CHI HUA AI DECISION CENTER — Clean 5-Level Navigation
// ============================================================

const L_NAV = [
  { href: "/erp",            label: "L1 Executive",          zh: "AI 總裁決策中心", icon: "▤" },
  { href: "/erp/operations", label: "L2 Operations",         zh: "工單作戰中心",    icon: "▦" },
  { href: "/erp/procurement",label: "L3 Procurement",        zh: "AI 採購中心",     icon: "◈" },
  { href: "/erp/ai-engine",  label: "L4 AI Engine",          zh: "AI 決策中心",     icon: "✦" },
  { href: "/erp/market",     label: "L5 Market Intelligence",zh: "全球市場情報中心",icon: "◉" },
];

const FOOTER_NAV = [
  { href: "/erp/admin/sync",       label: "ERP Sync",       icon: "↻" },
  { href: "/erp/governance",       label: "Data Governance",icon: "⚙" },
  { href: "/erp/admin",            label: "Admin Tools",    icon: "⌘" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [showLegacy, setShowLegacy] = useState(false);

  if (pathname.startsWith("/erp/wms")) return null;

  return (
    <aside
      className="w-60 shrink-0 border-r min-h-screen flex flex-col"
      style={{ background: "#ffffff", borderColor: "#e5e2e1", color: "#1c1b1b", fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Brand */}
      <Link href="/erp" className="px-5 py-5 border-b" style={{ borderColor: "#e5e2e1" }}>
        <div className="text-[15px] font-bold tracking-tight" style={{ color: "#005245" }}>CHI HUA AI</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#4B5563", letterSpacing: "0.12em" }}>Decision Center</div>
        <div className="text-[9px] mt-1" style={{ color: "#6f7975" }}>Health · Manufacturing · Intelligence</div>
      </Link>

      {/* L1-L5 Nav */}
      <nav className="py-3">
        {L_NAV.map((l) => {
          const active = l.href === "/erp" ? pathname === "/erp" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className="block px-5 py-2.5 text-sm transition-colors border-l-2"
              style={{
                background: active ? "#f0eded" : "transparent",
                borderColor: active ? "#005245" : "transparent",
                color: active ? "#005245" : "#1c1b1b",
                fontWeight: active ? 600 : 500,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base" style={{ opacity: 0.7 }}>{l.icon}</span>
                <div className="flex-1 min-w-0">
                  <div>{l.label}</div>
                  <div className="text-[10px]" style={{ color: active ? "#1f6b5c" : "#6f7975" }}>{l.zh}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t my-2" style={{ borderColor: "#e5e2e1" }} />

      {/* Admin / System Footer */}
      <nav className="pb-3">
        <div className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6f7975" }}>System</div>
        {FOOTER_NAV.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-2 px-5 py-2 text-xs transition-colors border-l-2"
              style={{
                background: active ? "#f0eded" : "transparent",
                borderColor: active ? "#005cba" : "transparent",
                color: active ? "#005cba" : "#4B5563",
              }}>
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}

        {/* Legacy / Advanced (collapsed) */}
        <button
          onClick={() => setShowLegacy((v) => !v)}
          className="w-full mt-2 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:text-slate-700 flex items-center gap-1"
          style={{ color: "#6f7975" }}
        >
          <span>{showLegacy ? "▾" : "▸"}</span>
          <span>Legacy Pages</span>
        </button>
        {showLegacy && (
          <div>
            {[
              { href: "/erp/warroom",         label: "🪖 CEO War Room (v1)" },
              { href: "/erp/profit-defense",  label: "🛡 Profit Defense" },
              { href: "/erp/requisition",     label: "📡 Requisition Center" },
              { href: "/roadmap",             label: "🛣 4 Phase Roadmap" },
              { href: "/architecture",        label: "🏛 5-Layer Architecture" },
              { href: "/os",                  label: "📋 6 Operations Centers" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="block px-7 py-1.5 text-[11px]"
                style={{ color: pathname.startsWith(l.href) ? "#005cba" : "#6f7975" }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto px-5 py-4 border-t text-[10px]" style={{ borderColor: "#e5e2e1", color: "#6f7975" }}>
        <div className="mb-2"><LangSwitcher /></div>
        <div className="flex items-center gap-1 mb-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#059669" }} />
          <span style={{ color: "#059669" }}>AI Confidence 92%</span>
        </div>
        <div style={{ color: "#6f7975" }}>同步鼎新 iGP · 唯讀</div>
      </div>
    </aside>
  );
}
