"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, Search, User, Leaf } from "lucide-react";

const navLinks = [
  { href: "/beauty", label: "代謝美顏", highlight: true },
  { href: "/recipes", label: "食療食譜" },
  { href: "/quiz", label: "體質測評" },
  { href: "/tracking", label: "打卡追蹤" },
  { href: "/herb-checker", label: "本草查詢" },
  { href: "/community", label: "養生社群" },
  { href: "/shop", label: "養生商城" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm border-b shadow-sm" style={{ background: "#faf6ee", borderColor: "#e0d8cc" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow" style={{ background: "#3d5c3a" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-wide" style={{ color: "#3d5c3a" }}>WarmCare</span>
              <span className="text-xs hidden sm:block" style={{ color: "#7a9b7a" }}>養生道・溫心家</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium rounded-full transition-colors"
                style={link.highlight
                  ? { color: "#3d5c3a", background: "#dceedd", fontWeight: 600 }
                  : { color: "#4a3a2a" }}
                onMouseEnter={e => {
                  if (!link.highlight) {
                    (e.currentTarget as HTMLElement).style.background = "#ede6d8";
                    (e.currentTarget as HTMLElement).style.color = "#3d5c3a";
                  }
                }}
                onMouseLeave={e => {
                  if (!link.highlight) {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "#4a3a2a";
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full transition-colors hidden sm:flex" style={{ color: "#7a6a5a" }}>
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full transition-colors hidden sm:flex" style={{ color: "#7a6a5a" }}>
              <User className="w-5 h-5" />
            </button>
            <Link href="/shop" className="p-2 rounded-full transition-colors hidden sm:flex" style={{ color: "#7a6a5a" }}>
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <button
              className="md:hidden p-2 rounded-full transition-colors"
              style={{ color: "#3d5c3a" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t" style={{ background: "#faf6ee", borderColor: "#e0d8cc" }}>
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-full transition-colors"
                style={{ color: "#3d5c3a" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
