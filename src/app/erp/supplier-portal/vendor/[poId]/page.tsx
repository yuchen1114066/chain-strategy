import { digitalPOs } from "@/lib/erp/supplier-portal";
import { suppliers, parts } from "@/lib/erp/seed";
import VendorFlowClient from "./VendorFlowClient";
import Link from "next/link";

export default async function VendorPOFlowPage({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  const po = digitalPOs.find((p) => p.id === poId);
  if (!po) {
    return (
      <div style={{ background: "#F4F7FA", minHeight: "100vh", padding: 24 }}>
        <Link href="/erp/supplier-portal/vendor" className="text-cyan-700 hover:underline text-sm">← 回 PO 列表</Link>
        <div className="mt-6 bg-white rounded-xl border p-8 text-center text-slate-500">找不到 PO {poId}</div>
      </div>
    );
  }
  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const part = parts.find((p) => p.id === po.partId);
  return <VendorFlowClient
    po={{
      id: po.id, poNo: po.poNo, qty: po.qty, unitCost: po.unitCost,
      sentAt: po.sentAt, ackDeadline: po.ackDeadline, ackedAt: po.ackedAt,
      expectedShipDate: po.expectedShipDate, expectedArrival: po.expectedArrival,
      status: po.status,
      asnAlreadyFiled: !!po.asn,
      lastProductionStage: po.productionLog[po.productionLog.length - 1]?.stage ?? null,
    }}
    supplierName={supplier?.name ?? po.supplierId}
    partName={part?.name ?? po.partId}
    partCode={part?.code ?? ""}
    partUnit={part?.unit ?? "PCS"}
  />;
}
