// In-memory seed data so the demo runs without Supabase.
// Replace with real queries (against erp_* tables) when going live.

import type {
  Alert,
  BomLine,
  Model,
  Part,
  Supplier,
  WorkOrder,
} from "./types";

export const suppliers: Supplier[] = [
  { id: "s1", code: "SUP-CN-001", name: "東莞睿達金屬", country: "中國", city: "東莞", transitDays: 9, contact: "Mr. Liu" },
  { id: "s2", code: "SUP-TW-001", name: "台中精誠馬達", country: "台灣", city: "台中", transitDays: 2, contact: "陳經理" },
  { id: "s3", code: "SUP-TW-002", name: "桃園控制板廠", country: "台灣", city: "桃園", transitDays: 1, contact: "林副總" },
  { id: "s4", code: "SUP-CN-002", name: "寧波橡膠帶業", country: "中國", city: "寧波", transitDays: 11, contact: "Ms. Wang" },
  { id: "s5", code: "SUP-VN-001", name: "胡志明電源廠", country: "越南", city: "胡志明", transitDays: 14, contact: "Mr. Tran" },
];

export const parts: Part[] = [
  { id: "p1", code: "FRM-T01", name: "跑步機鋼架（折疊）", category: "鋼架", unit: "PCS", unitCost: 1850, supplierId: "s1", leadDays: 35, stockOnHand: 20, safetyStock: 10 },
  { id: "p2", code: "MOT-3HP", name: "DC 3HP 馬達", category: "馬達", unit: "PCS", unitCost: 4200, supplierId: "s2", leadDays: 21, stockOnHand: 8, safetyStock: 15 },
  { id: "p3", code: "CTL-T200", name: "跑步機控制板 T200", category: "控制板", unit: "PCS", unitCost: 1600, supplierId: "s3", leadDays: 14, stockOnHand: 25, safetyStock: 10 },
  { id: "p4", code: "BLT-RUN", name: "跑步帶（橡膠）", category: "皮帶", unit: "PCS", unitCost: 680, supplierId: "s4", leadDays: 28, stockOnHand: 30, safetyStock: 20 },
  { id: "p5", code: "PSU-12V", name: "12V 電源供應", category: "電源", unit: "PCS", unitCost: 320, supplierId: "s5", leadDays: 30, stockOnHand: 50, safetyStock: 30 },
  { id: "p6", code: "FRM-B01", name: "飛輪車架", category: "鋼架", unit: "PCS", unitCost: 1200, supplierId: "s1", leadDays: 30, stockOnHand: 15, safetyStock: 10 },
  { id: "p7", code: "FLY-18KG", name: "18kg 飛輪", category: "飛輪", unit: "PCS", unitCost: 950, supplierId: "s1", leadDays: 30, stockOnHand: 18, safetyStock: 12 },
  { id: "p8", code: "DPL-LCD5", name: "5吋 LCD 顯示器", category: "顯示器", unit: "PCS", unitCost: 540, supplierId: "s3", leadDays: 14, stockOnHand: 40, safetyStock: 20 },
  { id: "p9", code: "SDL-PRO", name: "競速座墊", category: "座墊", unit: "PCS", unitCost: 230, supplierId: "s2", leadDays: 10, stockOnHand: 35, safetyStock: 15 },
  { id: "p10", code: "FRM-R01", name: "划船機軌道", category: "鋼架", unit: "PCS", unitCost: 2100, supplierId: "s1", leadDays: 35, stockOnHand: 6, safetyStock: 8 },
  { id: "p11", code: "RES-MAG", name: "磁控阻力組", category: "阻力", unit: "PCS", unitCost: 780, supplierId: "s2", leadDays: 21, stockOnHand: 22, safetyStock: 10 },
  { id: "p12", code: "BLT-ROW", name: "划船拉繩", category: "皮帶", unit: "PCS", unitCost: 220, supplierId: "s4", leadDays: 25, stockOnHand: 40, safetyStock: 20 },
  { id: "p13", code: "PED-ALU", name: "鋁合金腳踏板", category: "踏板", unit: "PR", unitCost: 180, supplierId: "s2", leadDays: 12, stockOnHand: 60, safetyStock: 30 },
  { id: "p14", code: "BLT-3V", name: "3V傳動皮帶", category: "皮帶", unit: "PCS", unitCost: 95, supplierId: "s4", leadDays: 21, stockOnHand: 80, safetyStock: 40 },
  { id: "p15", code: "BOX-T01", name: "跑步機外箱（紙箱+珍珠棉）", category: "包材", unit: "SET", unitCost: 280, supplierId: "s2", leadDays: 7, stockOnHand: 100, safetyStock: 50 },
];

export const models: Model[] = [
  { id: "m1", code: "T-PRO-220", name: "Pro 跑步機 T-220", category: "treadmill", description: "商用級折疊跑步機，3HP 馬達", stdPrice: 38000 },
  { id: "m2", code: "B-SPIN-X3", name: "競速飛輪 X-3", category: "bike", description: "18kg 飛輪 + 磁控阻力", stdPrice: 22000 },
  { id: "m3", code: "R-MAG-100", name: "磁控划船機 R-100", category: "rower", description: "雙軌磁控，滑順靜音", stdPrice: 28000 },
];

export const bom: BomLine[] = [
  // T-PRO-220 跑步機
  { modelId: "m1", partId: "p1", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p2", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p4", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p15", qtyPerUnit: 1, version: 1, isActive: true },
  // B-SPIN-X3 飛輪
  { modelId: "m2", partId: "p6", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p7", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p13", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p14", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  // R-MAG-100 划船
  { modelId: "m3", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p11", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p12", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
];

// Today reference for deterministic dates: 2026-05-08 (project AGENTS.md)
const TODAY = "2026-05-08";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Reverse scheduling: given ship_date, allocate days to each stage backwards.
// Defaults (industry rough cuts):
// material 30d → arrival 0d → iqc 2d → line 5d → test 2d → pack 1d → ship 14d → customer 0d
const STAGE_DAYS: Record<string, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

function buildStages(shipDate: string): WorkOrder["stages"] {
  const order = ["material", "arrival", "iqc", "line", "test", "pack", "ship", "customer"] as const;
  // Walk backwards: customer plannedDate = shipDate + ship lead (already shipped). Simpler:
  // customer = shipDate + ship_transit (14 in `ship` stage)
  // ship    = shipDate
  // pack    = shipDate - 1
  // test    = pack - 2
  // line    = test - 5
  // iqc     = line - 2
  // arrival = iqc (same day)
  // material= arrival - 30 (parts ordered)
  const ship = shipDate;
  const pack = addDays(ship, -STAGE_DAYS.pack);
  const test = addDays(pack, -STAGE_DAYS.test);
  const line = addDays(test, -STAGE_DAYS.line);
  const iqc = addDays(line, -STAGE_DAYS.iqc);
  const arrival = iqc;
  const material = addDays(arrival, -STAGE_DAYS.material);
  const customer = addDays(ship, STAGE_DAYS.ship);
  const dates: Record<string, string> = { material, arrival, iqc, line, test, pack, ship, customer };

  return order.map((stage, i) => ({
    stage,
    seq: i + 1,
    plannedDate: dates[stage],
    status: "pending",
  }));
}

export const workOrders: WorkOrder[] = [
  {
    id: "wo1",
    woNo: "WO-2026-0001",
    modelId: "m1",
    qty: 50,
    customer: "FitWorld USA",
    destination: "Los Angeles, USA",
    shipDate: "2026-06-20",
    status: "active",
    stages: buildStages("2026-06-20").map((s, i) => {
      // first 4 stages have actuals
      if (i === 0) return { ...s, status: "done", actualDate: "2026-05-22" };
      if (i === 1) return { ...s, status: "done", actualDate: "2026-06-02" };
      if (i === 2) return { ...s, status: "in_progress" };
      return s;
    }),
  },
  {
    id: "wo2",
    woNo: "WO-2026-0002",
    modelId: "m2",
    qty: 80,
    customer: "Tokyo Gym Co.",
    destination: "Yokohama, JP",
    shipDate: "2026-06-05",
    status: "active",
    stages: buildStages("2026-06-05").map((s, i) => {
      if (i === 0) return { ...s, status: "done", actualDate: "2026-05-08" };
      if (i === 1) return { ...s, status: "in_progress" };
      return s;
    }),
  },
  {
    id: "wo3",
    woNo: "WO-2026-0003",
    modelId: "m3",
    qty: 30,
    customer: "EuroFit GmbH",
    destination: "Hamburg, DE",
    shipDate: "2026-07-10",
    status: "planning",
    stages: buildStages("2026-07-10"),
  },
  {
    id: "wo4",
    woNo: "WO-2026-0004",
    modelId: "m1",
    qty: 20,
    customer: "Bangkok Sports",
    destination: "Bangkok, TH",
    shipDate: "2026-05-25",
    status: "active",
    stages: buildStages("2026-05-25").map((s, i) => {
      if (i === 0) return { ...s, status: "done", actualDate: "2026-04-28" };
      if (i === 1) return { ...s, status: "done", actualDate: "2026-05-06" };
      if (i === 2) return { ...s, status: "done", actualDate: "2026-05-08" };
      if (i === 3) return { ...s, status: "in_progress" };
      return s;
    }),
  },
];

export const today = TODAY;

// Generated alerts are computed by ./alerts.ts at request time (not seeded).
export const seedAlerts: Alert[] = [];
