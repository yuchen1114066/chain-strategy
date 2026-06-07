"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Leaf, CalendarCheck, BookOpen, Users } from "lucide-react";

const tabs = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/today", label: "今日養生", icon: Leaf },
  { href: "/tracking", label: "打卡追蹤", icon: CalendarCheck },
  { href: "/herb-checker", label: "本草查詢", icon: BookOpen },
  { href: "/community", label: "養生社群", icon: Users },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ background: "#faf6ee", borderColor: "#e0d8cc", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? "#3d5c3a" : "#9a8a7a" }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: "#c87941" }} />
                )}
              </div>
              <span className="text-xs" style={{ fontWeight: active ? 700 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
