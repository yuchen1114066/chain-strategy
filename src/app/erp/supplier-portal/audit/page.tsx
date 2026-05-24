import AuditClient from "./AuditClient";
import { digitalPOs } from "@/lib/erp/supplier-portal";
import { suppliers } from "@/lib/erp/seed";

export default function AuditPage() {
  // 預先把可查資料的索引傳給 client（讓 quick-pick chips 有資料）
  const samples = {
    poNos: digitalPOs.slice(0, 6).map((p) => p.poNo),
    suppliers: suppliers
      .filter((s) => digitalPOs.some((p) => p.supplierId === s.id))
      .map((s) => ({ code: s.code, name: s.name })),
  };
  return <AuditClient samples={samples} />;
}
