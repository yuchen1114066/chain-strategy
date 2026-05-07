"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Leaf, ShoppingCart, Search, User } from "lucide-react";

const navLinks = [
  { href: "/recipes", label: "食療食譜" },
  { href: "/quiz", label: "體質測評" },
  { href: "/herb-checker", label: "藥物查詢" },
  { href: "/community", label: "養生社群" },
  { href: "/shop", label: "養生商城" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-green-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-amber-800 tracking-wide">養生道</span>
              <span className="text-xs text-amber-600 hidden sm:block">YangSheng Dao</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors hidden sm:flex">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors hidden sm:flex">
              <User className="w-5 h-5" />
            </button>
            <Link
              href="/shop"
              className="p-2 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors hidden sm:flex"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <button
              className="md:hidden p-2 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-amber-100 bg-white">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
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
