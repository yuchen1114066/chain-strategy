"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingCart, Search, User, Heart } from "lucide-react";

const navLinks = [
  { href: "/beauty", label: "✨ 代謝美顏", highlight: true },
  { href: "/recipes", label: "食療食譜" },
  { href: "/quiz", label: "體質測評" },
  { href: "/tracking", label: "🗓️ 打卡追蹤" },
  { href: "/herb-checker", label: "藥物查詢" },
  { href: "/community", label: "養生社群" },
  { href: "/shop", label: "養生商城" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/erp") || pathname?.startsWith("/os") || pathname?.startsWith("/roadmap") || pathname?.startsWith("/architecture") || pathname?.startsWith("/login")) return null;

  return (
    <header className="sticky top-0 z-50 bg-[#fdf7f2]/95 backdrop-blur-sm border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-300 to-[#5a8a6a] rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-[#5c3a4a] tracking-wide">WarmCare</span>
              <span className="text-xs text-rose-400 hidden sm:block">養生道</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-full transition-colors ${
                  link.highlight
                    ? "text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold"
                    : "text-[#5c3a4a] hover:text-rose-600 hover:bg-rose-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-[#9a6a7a] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors hidden sm:flex">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-[#9a6a7a] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors hidden sm:flex">
              <User className="w-5 h-5" />
            </button>
            <Link
              href="/shop"
              className="p-2 text-[#9a6a7a] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors hidden sm:flex"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <button
              className="md:hidden p-2 text-[#5c3a4a] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-rose-100 bg-[#fdf7f2]">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-[#5c3a4a] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
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
