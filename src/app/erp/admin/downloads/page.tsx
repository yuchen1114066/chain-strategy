import Link from "next/link";
import AdminDownloadsClient from "./AdminDownloadsClient";

export const metadata = { title: "Admin · 模組程式碼下載" };

export default function AdminDownloadsPage() {
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <header>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          ADMIN BACKEND · INTERNAL ONLY
        </div>
        <h1 className="text-2xl font-bold mt-1">📦 模組程式碼下載</h1>
        <p className="text-sm text-slate-500 mt-1">
          僅管理員可下載 standalone 模組原始碼 ZIP。
          回 <Link href="/erp/admin" className="underline text-emerald-700">管理後台首頁</Link>。
        </p>
      </header>

      <AdminDownloadsClient />
    </div>
  );
}
