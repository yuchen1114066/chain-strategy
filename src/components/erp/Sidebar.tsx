"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangSwitcher from "./LangSwitcher";

// ============================================================
// CHI HUA AI · Industrial Command — Dark Sidebar
// 黑底 + 軟粉紅 active + 灰銀文字
// ============================================================

const L_NAV = [
  { href: "/erp",            label: "L1 EXECUTIVE",          zh: "AI 總裁決策中心", icon: "▤" },
  { href: "/erp/operations", label: "L2 OPERATIONS",         zh: "工單作戰中心",    icon: "▦" },
  { href: "/erp/procurement",label: "L3 PROCUREMENT",        zh: "AI 採購中心",     icon: "◈" },
  { href: "/erp/ai-engine",  label: "L4 AI ENGINE",          zh: "AI 決策中心",     icon: "✦" },
  { href: "/erp/market",     label: "L5 MARKET",             zh: "全球市場情報中心",icon: "◉" },
];

const FOOTER_NAV = [
  { href: "/erp/admin/sync",       label: "ERP SYNC",        icon: "↻" },
  { href: "/erp/governance",       label: "DATA GOVERNANCE", icon: "⚙" },
  { href: "/erp/admin",            label: "ADMIN TOOLS",     icon: "⌘" },
];

const BG       = "#1a1c1c";
const BG_HI    = "#2f3131";
const BORDER   = "#3a3838";
const TEXT     = "#f1f1f1";
const TEXT_DIM = "#a8a4a4";
const PINK     = "#f06292";
const PINK_BG  = "#ab2c5d";

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [showLegacy, setShowLegacy] = useState(false);

  if (pathname.startsWith("/erp/wms")) return null;

  return (
    <aside
      className="w-60 shrink-0 border-r min-h-screen flex flex-col"
      style={{
        background: BG,
        borderColor: BORDER,
        color: TEXT,
        fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Brand */}
      <Link href="/erp" className="px-5 py-5 border-b" style={{ borderColor: BORDER }}>
        <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: PINK, letterSpacing: "0.18em" }}>SC · WAR ROOM</div>
        <div className="text-[14px] font-semibold tracking-tight mt-1" style={{ color: TEXT }}>CHI HUA AI</div>
        <div className="text-[10px] mt-0.5" style={{ color: TEXT_DIM }}>v 2.4 · MISSION LIVE</div>
      </Link>

      {/* L1-L5 Nav */}
      <nav className="py-3">
        <div className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM, letterSpacing: "0.15em" }}>Global Command</div>
        {L_NAV.map((l) => {
          const active = l.href === "/erp" ? pathname === "/erp" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className="block px-5 py-2.5 text-xs transition-colors border-l-2"
              style={{
                background: active ? "#2a1620" : "transparent",
                borderColor: active ? PINK : "transparent",
                color: active ? PINK : TEXT,
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.05em",
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5" style={{ opacity: active ? 1 : 0.5, color: active ? PINK : TEXT_DIM }}>{l.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="uppercase">{l.label}</div>
                  <div className="text-[10px] mt-0.5 normal-case" style={{ color: active ? "#ffb1c5" : TEXT_DIM, fontWeight: 400, letterSpacing: 0 }}>{l.zh}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Initiate Triage 大按鈕（核心操作） */}
      <div className="px-4 pb-3">
        <Link
          href="/erp/requisition"
          className="block text-center text-xs font-bold uppercase tracking-widest py-3 rounded transition-colors"
          style={{ background: PINK_BG, color: "#fff", letterSpacing: "0.15em" }}
        >
          ◇ Initiate Triage
        </Link>
      </div>

      <div className="border-t mx-4" style={{ borderColor: BORDER }} />

      {/* System Footer */}
      <nav className="pb-3 pt-3">
        <div className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_DIM, letterSpacing: "0.15em" }}>System</div>
        {FOOTER_NAV.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-2 px-5 py-2 text-[11px] transition-colors border-l-2"
              style={{
                background: active ? "#2a1620" : "transparent",
                borderColor: active ? PINK : "transparent",
                color: active ? PINK : TEXT_DIM,
                letterSpacing: "0.05em",
              }}>
              <span>{l.icon}</span>
              <span className="uppercase">{l.label}</span>
            </Link>
          );
        })}

        {/* Legacy (collapsed) */}
        <button
          onClick={() => setShowLegacy((v) => !v)}
          className="w-full mt-2 px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
          style={{ color: TEXT_DIM, letterSpacing: "0.15em" }}
        >
          <span>{showLegacy ? "▾" : "▸"}</span>
          <span>Legacy</span>
        </button>
        {showLegacy && (
          <div>
            {[
              { href: "/erp/warroom",         label: "CEO War Room v1" },
              { href: "/erp/profit-defense",  label: "Profit Defense" },
              { href: "/erp/requisition",     label: "Requisition" },
              { href: "/roadmap",             label: "4 Phase Roadmap" },
              { href: "/architecture",        label: "5-Layer" },
              { href: "/os",                  label: "6 Centers" },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="block px-7 py-1 text-[10px]"
                style={{ color: pathname.startsWith(l.href) ? PINK : TEXT_DIM }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="mt-auto px-5 py-4 border-t text-[10px]" style={{ borderColor: BORDER, color: TEXT_DIM }}>
        <div className="mb-2"><LangSwitcher /></div>
        <div className="flex items-center gap-1 mb-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#35a941" }} />
          <span style={{ color: "#a0cfcf" }}>AI Confidence 92%</span>
        </div>
        <div style={{ color: TEXT_DIM }}>鼎新 iGP · 唯讀</div>
      </div>
    </aside>
  );
}
