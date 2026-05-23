import type { Metadata } from "next";
import Sidebar from "@/components/erp/Sidebar";

export const metadata: Metadata = {
  title: "祺驊 CHI HUA — Global AI Decision Engine (not Dashboard)",
  description: "直接告訴你：現在該做什麼 / 成本影響多少 / 哪個方案最好 / 風險多少 — 這才是世界級",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-slate-50 text-slate-900 min-h-screen print:bg-white print:min-h-0">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
