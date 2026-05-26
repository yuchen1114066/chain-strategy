import type { Metadata } from "next";
import Sidebar from "@/components/erp/Sidebar";

export const metadata: Metadata = {
  title: "祺驊 CHI HUA — AI Supply Chain Flow",
  description: "從 Control Tower → AI Decision Platform → Predictive Network → Autonomous OS 的 4 階段演進",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="flex bg-slate-50 text-slate-900 min-h-screen print:bg-white print:min-h-0">
        <div className="print:hidden">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </>
  );
}
