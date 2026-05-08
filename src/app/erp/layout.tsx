import type { Metadata } from "next";
import Sidebar from "@/components/erp/Sidebar";

export const metadata: Metadata = {
  title: "ChainOps ERP — 健身機台製造管理",
  description: "業務 / 採購協調追蹤：BOM 連結、八階段工單、異常警訊一站式",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-slate-50 text-slate-900 min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
