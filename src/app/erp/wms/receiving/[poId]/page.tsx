import { incomingPOs } from "@/lib/erp/receiving-checklist";
import ReceivingChecklistClient from "./ReceivingChecklistClient";
import Link from "next/link";

export default async function ReceivingChecklistPage({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  const po = incomingPOs().find((p) => p.poId === poId);
  if (!po) {
    return (
      <div className="p-6">
        <Link href="/erp/wms/receiving" className="text-cyan-700 hover:underline text-sm">← 回收貨清單</Link>
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          找不到 PO {poId}（可能已入庫或不在待收貨範圍內）
        </div>
      </div>
    );
  }
  return <ReceivingChecklistClient po={po} />;
}
