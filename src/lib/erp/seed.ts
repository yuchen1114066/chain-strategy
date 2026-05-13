// In-memory seed data so the demo runs without Supabase.
// 對應 WorkFlow ERP iGP / 〔總表完成〕Q:\採購課\成品成本分析\2026成本評估
// 客戶 LIFE 直立車產線 FB64 系列為主，搭配跑步機 / 划船機示意。

import type {
  Alert,
  BomLine,
  Model,
  Part,
  Supplier,
  WorkOrder,
} from "./types";

export const suppliers: Supplier[] = [
  // 祺驊 BOM 中實際出現的廠商（FB11G003 BOM 截圖確認）
  // 交貨天數一律 45 天（依使用者提供）
  { id: "s1",  code: "SUP-JC",  name: "競丞",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s2",  code: "SUP-SC",  name: "雙成",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s3",  code: "SUP-CY",  name: "重邑",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s4",  code: "SUP-ZHY", name: "莊宏億",       country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s5",  code: "SUP-YN",  name: "應拿",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s6",  code: "SUP-CHV", name: "祺驊（越南）", country: "越南", city: "—", transitDays: 45, contact: "內部廠" },
  { id: "s7",  code: "SUP-JH",  name: "吉輝",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s8",  code: "SUP-TT",  name: "鈦泰",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s9",  code: "SUP-HY",  name: "寒亞",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s10", code: "SUP-ZS",  name: "這勝",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s11", code: "SUP-HC",  name: "海騁",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s12", code: "SUP-YZ",  name: "右在",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s13", code: "SUP-DTC", name: "東台祺電",     country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s14", code: "SUP-HB",  name: "海碧",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s15", code: "SUP-JL",  name: "金倫",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
];

export const parts: Part[] = [
  // FB64 直立車主要零件（demo 用 — 廠商已對應到祺驊真實供應商）
  // 全部交期統一 45 天（依使用者提供）
  { id: "p1",  code: "FB64-FRM",   name: "FB64 主車架",       category: "鋼架",   unit: "PCS", unitCost: 1450, supplierId: "s4",  leadDays: 45, stockOnHand: 60,  safetyStock: 30 }, // 莊宏億
  { id: "p2",  code: "FB64-FLY18", name: "18kg 飛輪組",       category: "飛輪",   unit: "PCS", unitCost: 950,  supplierId: "s6",  leadDays: 45, stockOnHand: 35,  safetyStock: 20 }, // 祺驊越南
  { id: "p3",  code: "FB64-RES",   name: "磁控阻力組（8段）", category: "阻力",   unit: "PCS", unitCost: 780,  supplierId: "s8",  leadDays: 45, stockOnHand: 12,  safetyStock: 25 }, // 缺 — 鈦泰
  { id: "p4",  code: "FB64-CON",   name: "FB64 控制儀錶",     category: "控制板", unit: "PCS", unitCost: 1280, supplierId: "s13", leadDays: 45, stockOnHand: 45,  safetyStock: 20 }, // 東台祺電
  { id: "p5",  code: "FB64-LCD5",  name: "5吋 LCD 顯示器",    category: "顯示器", unit: "PCS", unitCost: 540,  supplierId: "s13", leadDays: 45, stockOnHand: 90,  safetyStock: 40 }, // 東台祺電
  { id: "p6",  code: "FB64-SDL",   name: "競速座墊",          category: "座墊",   unit: "PCS", unitCost: 230,  supplierId: "s7",  leadDays: 45, stockOnHand: 75,  safetyStock: 30 }, // 吉輝
  { id: "p7",  code: "FB64-PED",   name: "鋁合金腳踏板（對）",category: "踏板",   unit: "PR",  unitCost: 180,  supplierId: "s2",  leadDays: 45, stockOnHand: 120, safetyStock: 60 }, // 雙成
  { id: "p8",  code: "FB64-BLT",   name: "3V 傳動皮帶",       category: "皮帶",   unit: "PCS", unitCost: 95,   supplierId: "s11", leadDays: 45, stockOnHand: 180, safetyStock: 80 }, // 海騁
  { id: "p9",  code: "FB64-PSU",   name: "12V 電源供應",      category: "電源",   unit: "PCS", unitCost: 320,  supplierId: "s13", leadDays: 45, stockOnHand: 8,   safetyStock: 40 }, // 嚴重缺 — 東台祺電
  { id: "p10", code: "FB64-BOX",   name: "FB64 外箱套",       category: "包材",   unit: "SET", unitCost: 240,  supplierId: "s14", leadDays: 45, stockOnHand: 200, safetyStock: 80 }, // 海碧
  // 跑步機共用零件
  { id: "p11", code: "T220-FRM",   name: "跑步機鋼架（折疊）",category: "鋼架",   unit: "PCS", unitCost: 1850, supplierId: "s4",  leadDays: 45, stockOnHand: 20,  safetyStock: 10 }, // 莊宏億
  { id: "p12", code: "T220-MOT",   name: "DC 3HP 馬達",       category: "馬達",   unit: "PCS", unitCost: 4200, supplierId: "s13", leadDays: 45, stockOnHand: 8,   safetyStock: 15 }, // 缺 — 東台祺電
  { id: "p13", code: "T220-RUN",   name: "跑步帶（橡膠）",    category: "皮帶",   unit: "PCS", unitCost: 680,  supplierId: "s11", leadDays: 45, stockOnHand: 30,  safetyStock: 20 }, // 海騁
  // 划船機共用零件
  { id: "p14", code: "R100-RAIL",  name: "划船機軌道",        category: "鋼架",   unit: "PCS", unitCost: 2100, supplierId: "s4",  leadDays: 45, stockOnHand: 10,  safetyStock: 8 },  // 莊宏億
  { id: "p15", code: "R100-ROPE",  name: "划船拉繩組",        category: "皮帶",   unit: "PCS", unitCost: 220,  supplierId: "s11", leadDays: 45, stockOnHand: 40,  safetyStock: 20 }, // 海騁
];

// 機種 FB64・直立車 之下有多個成品品號（H021-A2 商規 / H020-A1 家規）
export const models: Model[] = [
  { id: "m1", code: "FB64H021-A2", machineFamily: "FB64・直立車", name: "FB64H021-A2 商用直立車", category: "bike", description: "LIFE 客戶 OEM，商用規格 18kg 飛輪、磁控阻力", stdPrice: 24800 },
  { id: "m2", code: "FB64H020-A1", machineFamily: "FB64・直立車", name: "FB64H020-A1 家用直立車", category: "bike", description: "家用規格，輕量化座墊", stdPrice: 18500 },
  { id: "m3", code: "T-PRO-220", machineFamily: "T-PRO・跑步機", name: "Pro 跑步機 T-220", category: "treadmill", description: "商用級折疊跑步機，3HP 馬達", stdPrice: 38000 },
  { id: "m4", code: "R-MAG-100", machineFamily: "R-MAG・划船機", name: "磁控划船機 R-100", category: "rower", description: "雙軌磁控，滑順靜音", stdPrice: 28000 },
];

export const bom: BomLine[] = [
  // FB64H021-A2（商規，飛輪 + 完整儀表）
  { modelId: "m1", partId: "p1", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p2", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p4", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p6", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p7", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  // FB64H020-A1（家規，少儀表）
  { modelId: "m2", partId: "p1", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p2", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p6", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p7", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  // 跑步機
  { modelId: "m3", partId: "p11", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p12", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p13", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p4", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  // 划船機
  { modelId: "m4", partId: "p14", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p15", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
];

const TODAY = "2026-05-08";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const STAGE_DAYS: Record<string, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

function buildStages(shipDate: string): WorkOrder["stages"] {
  const order = ["material", "arrival", "iqc", "line", "test", "pack", "ship", "customer"] as const;
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
    stage, seq: i + 1, plannedDate: dates[stage], status: "pending",
  }));
}

export const workOrders: WorkOrder[] = [
  // 螢幕截圖那筆：已簽收
  {
    id: "wo1",
    woNo: "ORD-2026-001",
    source: "ERP",
    modelId: "m1",
    qty: 100,
    customer: "LIFE",
    destination: "USA",
    orderDate: "2026-03-15",
    shipDate: "2026-04-30",
    status: "done",
    statusLabel: "已簽收",
    notes: "首批量產，成功交付",
    stages: buildStages("2026-04-30").map((s) => ({
      ...s,
      status: "done" as const,
      actualDate: s.plannedDate,
    })),
  },
  // 第二筆 LIFE 訂單：生產中，但磁控缺料
  {
    id: "wo2",
    woNo: "ORD-2026-007",
    source: "ERP",
    modelId: "m1",
    qty: 200,
    customer: "LIFE",
    destination: "Los Angeles, USA",
    orderDate: "2026-04-02",
    shipDate: "2026-06-05",
    status: "active",
    statusLabel: "生產中",
    stages: buildStages("2026-06-05").map((s, i) => {
      if (i === 0) return { ...s, status: "done", actualDate: "2026-05-04" };
      if (i === 1) return { ...s, status: "in_progress" };
      return s;
    }),
  },
  // 跑步機急單，誤船高風險
  {
    id: "wo3",
    woNo: "ORD-2026-012",
    source: "ERP",
    modelId: "m3",
    qty: 50,
    customer: "FitWorld USA",
    destination: "Los Angeles, USA",
    orderDate: "2026-04-15",
    shipDate: "2026-05-25",
    status: "active",
    statusLabel: "待料",
    notes: "馬達 T220-MOT 庫存吃緊",
    stages: buildStages("2026-05-25").map((s, i) => {
      if (i === 0) return { ...s, status: "done", actualDate: "2026-04-20" };
      if (i === 1) return { ...s, status: "in_progress" };
      return s;
    }),
  },
  // 飛輪訂單：規劃中
  {
    id: "wo4",
    woNo: "ORD-2026-018",
    source: "ERP",
    modelId: "m2",
    qty: 80,
    customer: "Tokyo Gym Co.",
    destination: "Yokohama, JP",
    orderDate: "2026-04-28",
    shipDate: "2026-07-10",
    status: "planning",
    statusLabel: "規劃中",
    stages: buildStages("2026-07-10"),
  },
  // 划船機，已開始
  {
    id: "wo5",
    woNo: "ORD-2026-021",
    source: "manual",
    modelId: "m4",
    qty: 30,
    customer: "EuroFit GmbH",
    destination: "Hamburg, DE",
    orderDate: "2026-05-01",
    shipDate: "2026-07-25",
    status: "planning",
    statusLabel: "待開工",
    stages: buildStages("2026-07-25"),
  },
];

export const today = TODAY;
export const seedAlerts: Alert[] = [];

export function currentStageLabel(wo: WorkOrder): string {
  // 已簽收：客戶交付完成
  if (wo.status === "done") return "客戶交付";
  // 找第一個 in_progress；沒有就找第一個非 done 階段
  const inprog = wo.stages.find((s) => s.status === "in_progress");
  if (inprog) {
    const meta = ["算料","到廠","進貨檢驗","生產","測試","包裝","出貨","客戶交付"];
    return meta[inprog.seq - 1] ?? inprog.stage;
  }
  const next = wo.stages.find((s) => s.status !== "done");
  if (next) {
    const meta = ["算料","到廠","進貨檢驗","生產","測試","包裝","出貨","客戶交付"];
    return `待 ${meta[next.seq - 1] ?? next.stage}`;
  }
  return "客戶交付";
}
