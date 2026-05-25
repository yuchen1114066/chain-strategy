import type { Metadata } from "next";
import Sidebar from "@/components/erp/Sidebar";

export const metadata: Metadata = {
  title: "祺驊 CHI HUA — 供應鏈作戰系統 Supply Chain War Room",
  description: "5-Layer 軍事架構：Command Center / Operational Centers / Expert Workbench / AI Engine / Data Layer",
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
