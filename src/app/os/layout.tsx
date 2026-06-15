import type { Metadata } from "next";
import Sidebar from "@/components/erp/Sidebar";

export const metadata: Metadata = {
  title: "祺驊 CHI HUA — 6 大作戰中心 Operations Centers",
  description: "Supplier / Delivery / Manufacturing / Inventory / Procurement / AI Decision — 6 Centers",
};

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-slate-50 text-slate-900 min-h-screen print:bg-white print:min-h-0">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
