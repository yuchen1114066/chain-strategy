// 收貨 Checklist 電子化 — Digital Receiving Checklist
//
// 收貨不能只按「入庫完成」，必須完成 5 項檢核：
//   ☐ 外箱完整
//   ☐ 封箱完整
//   ☐ 格位數正常
//   ☐ 數量抽驗完成
//   ☐ 重量正常
//
// 任何一項未通過 → 不可入庫，自動通知採購 + 供應商 + 列入品質紀錄

import { digitalPOs } from "./supplier-portal";
import { suppliers, parts } from "./seed";

export type ChecklistItemKey = "outer_box" | "seal" | "compartments" | "qty_sample" | "weight";

export const CHECKLIST_ITEMS: { key: ChecklistItemKey; label: string; icon: string; failHandling: string }[] = [
  { key: "outer_box",    label: "外箱完整",       icon: "📦", failHandling: "拍照存證、開異常單通知供應商" },
  { key: "seal",         label: "封箱完整",       icon: "🔒", failHandling: "拍照存證、可能遭拆封 → 通知保險 + 採購" },
  { key: "compartments", label: "格位數正常",     icon: "🗂", failHandling: "比對裝箱單 → 缺件直接退貨" },
  { key: "qty_sample",   label: "數量抽驗完成",   icon: "🔢", failHandling: "全數清點、差異記入品質卡" },
  { key: "weight",       label: "重量正常",       icon: "⚖️", failHandling: "比對發票重量 ±5% → 異常通知品保介入" },
];

export type ItemStatus = "pending" | "pass" | "fail";

export type ChecklistRecord = {
  poId: string;
  poNo: string;
  startedAt?: string;
  completedAt?: string;
  inspector: string;
  items: Record<ChecklistItemKey, { status: ItemStatus; note?: string; failedAt?: string }>;
  notes: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";  // blocked = 有 fail，不可入庫
  putawayAt?: string;            // 確認入庫時間
  putawayLocation?: string;       // 入庫儲位
};

// ============================================================
// 候選收貨 PO 清單（status=shipped 且尚未 arrived 的）
// ============================================================
export type IncomingPO = {
  poId: string;
  poNo: string;
  supplierName: string;
  supplierCode: string;
  partCode: string;
  partName: string;
  qty: number;
  unit: string;
  unitCost: number;
  expectedArrival: string;
  asnTrackingNo?: string;
  carrier?: string;
  alreadyArrived: boolean;
};

export function incomingPOs(): IncomingPO[] {
  return digitalPOs
    .filter((p) => p.status === "shipped" || (p.asn && !p.productionLog.find((l) => l.stage === "arrived")))
    .map((p) => {
      const sup = suppliers.find((s) => s.id === p.supplierId);
      const part = parts.find((x) => x.id === p.partId);
      return {
        poId: p.id,
        poNo: p.poNo,
        supplierName: sup?.name ?? p.supplierId,
        supplierCode: sup?.code ?? p.supplierId,
        partCode: part?.code ?? "",
        partName: part?.name ?? p.partId,
        qty: p.qty,
        unit: part?.unit ?? "PCS",
        unitCost: p.unitCost,
        expectedArrival: p.expectedArrival,
        asnTrackingNo: p.asn?.trackingNo,
        carrier: p.asn?.carrier,
        alreadyArrived: !!p.productionLog.find((l) => l.stage === "arrived"),
      };
    })
    .sort((a, b) => a.expectedArrival.localeCompare(b.expectedArrival));
}

export function emptyChecklist(poId: string, poNo: string): ChecklistRecord {
  const items = {} as ChecklistRecord["items"];
  for (const it of CHECKLIST_ITEMS) {
    items[it.key] = { status: "pending" };
  }
  return {
    poId, poNo, inspector: "",
    items, notes: "",
    status: "not_started",
  };
}

export function computeStatus(rec: ChecklistRecord): ChecklistRecord["status"] {
  const vals = Object.values(rec.items);
  if (vals.every((v) => v.status === "pending")) return "not_started";
  if (vals.some((v) => v.status === "fail")) return "blocked";
  if (vals.every((v) => v.status === "pass")) return "completed";
  return "in_progress";
}

export function canPutaway(rec: ChecklistRecord): boolean {
  const s = computeStatus(rec);
  return s === "completed" && !!rec.inspector.trim();
}
