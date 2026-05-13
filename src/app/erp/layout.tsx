import type { Metadata } from "next";
import Sidebar from "@/components/erp/Sidebar";

export const metadata: Metadata = {
  title: "祺驊 CHI HUA — 業務 / 採購協調追蹤系統",
  description: "BOM 連結、八階段工單、瓶頸即時解方、異常預警一站式",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-slate-50 text-slate-900 min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
