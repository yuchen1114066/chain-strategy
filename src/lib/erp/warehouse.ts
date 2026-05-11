// 行動倉儲（PDA / 手機掃碼）模組
// 對應鼎新 ERP 的 INVMC 庫存異動，必經 SP 路徑（不可直接 INSERT）

export type SlipType = "receiving" | "picking" | "count" | "production";

// 鼎新 SP 對應表
export const SP_FOR_TASK: Record<SlipType, string> = {
  receiving: "sp_axmt450_inv_in",   // 收料入庫
  picking:   "sp_axmt450_inv_out",  // 領料出庫
  count:     "sp_axmt450_inv_adj",  // 盤點調整
  production:"sp_axmt450_inv_out",  // 製令領料也走 out
};

export const TASK_META: Record<SlipType, { label: string; icon: string; arrow: string }> = {
  receiving:  { label: "進收料", icon: "📦", arrow: "↓" },
  picking:    { label: "領料",   icon: "📤", arrow: "↑" },
  count:      { label: "盤點",   icon: "📋", arrow: "☰" },
  production: { label: "製令",   icon: "🏭", arrow: "→" },
};

export type SlipItem = {
  partCode: string;       // P04AA10
  partName: string;       // 線圈固定架
  qtyPlanned: number;
  qtyScanned: number;
  location: string;       // A100-B2-04
  unit?: string;
};

export type Slip = {
  no: string;              // 5410-260507001
  type: SlipType;
  workOrderRef?: string;   // 對應的工單訂單號
  status: "pending" | "in_progress" | "done" | "synced";
  items: SlipItem[];
  createdAt: string;       // ISO date
  note?: string;
};

export type ScanEvent = {
  id: string;
  ts: string;              // ISO datetime
  slipNo: string;
  partCode: string;
  partName: string;
  qty: number;
  location: string;
  operator: string;
  taskType: SlipType;
  syncStatus: "pending" | "synced" | "failed";
  spName: string;          // 鼎新 SP
};

export type SyncMode = "realtime" | "batch" | "offline";

// QR Code 自動辨識：依前綴判斷類型
export type ScanKind =
  | { kind: "slip_picking"; no: string }      // 5410-*
  | { kind: "slip_receiving"; no: string }    // 5210-*
  | { kind: "production_order"; no: string }  // 5110-*
  | { kind: "po"; no: string }                // PO-*
  | { kind: "part"; code: string }            // P*
  | { kind: "location"; code: string }        // A* / 倉位代碼
  | { kind: "unknown"; raw: string };

export function classifyBarcode(raw: string): ScanKind {
  const s = raw.trim().toUpperCase();
  if (/^5410-/.test(s)) return { kind: "slip_picking", no: s };
  if (/^5210-/.test(s)) return { kind: "slip_receiving", no: s };
  if (/^5110-/.test(s)) return { kind: "production_order", no: s };
  if (/^PO-/.test(s))   return { kind: "po", no: s };
  if (/^P[0-9A-Z]+$/.test(s)) return { kind: "part", code: s };
  if (/^A[0-9]+/.test(s))     return { kind: "location", code: s };
  return { kind: "unknown", raw };
}

// ===== Seed slips (含使用者真實單據 5410-260507001) =====

export const initialSlips: Slip[] = [
  {
    no: "5410-260507001",
    type: "picking",
    workOrderRef: "ORD-2026-007",
    status: "pending",
    createdAt: "2026-05-07",
    note: "FB64H021 量產領料",
    items: [
      { partCode: "P04AA10", partName: "線圈固定架",  qtyPlanned: 10, qtyScanned: 0, location: "A100-B2-04", unit: "PCS" },
      { partCode: "P13AA06", partName: "SKF 軸承",    qtyPlanned: 20, qtyScanned: 0, location: "A100-B3-12", unit: "PCS" },
    ],
  },
  {
    no: "5410-260507003",
    type: "picking",
    workOrderRef: "ORD-2026-012",
    status: "pending",
    createdAt: "2026-05-07",
    items: [
      { partCode: "T220-MOT", partName: "DC 3HP 馬達",    qtyPlanned: 8, qtyScanned: 0, location: "A100-B5-01", unit: "PCS" },
      { partCode: "T220-RUN", partName: "跑步帶（橡膠）", qtyPlanned: 8, qtyScanned: 0, location: "A100-B5-02", unit: "PCS" },
    ],
  },
  {
    no: "5210-260507002",
    type: "receiving",
    status: "pending",
    createdAt: "2026-05-07",
    note: "PO-2026-1021 到貨",
    items: [
      { partCode: "P04AA10", partName: "線圈固定架",  qtyPlanned: 100, qtyScanned: 0, location: "IQC-A01", unit: "PCS" },
    ],
  },
  {
    no: "5110-260128006",
    type: "production",
    workOrderRef: "ORD-2026-018",
    status: "pending",
    createdAt: "2026-05-06",
    items: [
      { partCode: "FB64-FRM",  partName: "FB64 主車架",   qtyPlanned: 80, qtyScanned: 0, location: "A100-B1-01", unit: "PCS" },
      { partCode: "FB64-FLY18", partName: "18kg 飛輪組",  qtyPlanned: 80, qtyScanned: 0, location: "A100-B1-02", unit: "PCS" },
      { partCode: "FB64-SDL",  partName: "競速座墊",      qtyPlanned: 80, qtyScanned: 0, location: "A100-B2-08", unit: "PCS" },
    ],
  },
  {
    no: "PD-2026-W19-01",
    type: "count",
    status: "pending",
    createdAt: "2026-05-08",
    note: "W19 週期盤點：A100 倉",
    items: [
      { partCode: "P04AA10", partName: "線圈固定架", qtyPlanned: 85, qtyScanned: 0, location: "A100-B2-04", unit: "PCS" },
      { partCode: "P13AA06", partName: "SKF 軸承",   qtyPlanned: 40, qtyScanned: 0, location: "A100-B3-12", unit: "PCS" },
    ],
  },
];
