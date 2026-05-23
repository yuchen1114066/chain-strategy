// 供應商協作入口（Supplier Collaboration Portal）— 真正的第一步
//
// 跟供應商之間所有互動都「數位化」。否則上面所有決策引擎都是空中樓閣。
//
// 四大模組：
//   ① PO 數位化發送 + 確認（48hr 未確認 → 自動提醒採購）
//   ② ASN 出貨通知（預定時間沒填 → 預防性預警，副總提前 48hr 知道延誤）
//   ③ 詳細狀態追蹤（每階段時間自動記錄 → 3 個月後得出每家供應商每階段平均運行時間 → 議價硬數據）
//   ④ 品質回饋閉環（每家供應商一張「品質記錄卡」→ 對方漲價時拿出來：「3 個月內品質異常 6 次，靠什麼漲價？」）
//
// 對鼎新唯讀，所有數位化動作 = 供應商直接在本系統操作。

import { parts, suppliers, today } from "./seed";

// ============================================================
// 型別
// ============================================================
export type PoStatus = "draft" | "sent" | "acked" | "in_production" | "shipped" | "received" | "closed" | "rejected";
export type ProductionStage = "pending" | "material_ready" | "in_production" | "packed" | "shipped" | "in_transit" | "arrived";
export type QualityResult = "pass" | "minor_defect" | "major_defect" | "rejected";

export type DigitalPO = {
  id: string;
  poNo: string;
  supplierId: string;
  partId: string;
  qty: number;
  unitCost: number;
  sentAt: string;            // ISO datetime
  ackDeadline: string;       // ISO — sentAt + 48hr
  ackedAt?: string;
  ackedBy?: string;           // 供應商業務名字
  expectedShipDate: string;
  expectedArrival: string;
  status: PoStatus;
  // 子物件
  asn?: AdvancedShippingNotice;
  productionLog: ProductionLogEntry[];
  qualityReports: QualityReport[];
};

export type AdvancedShippingNotice = {
  filedAt: string;
  filedBy: string;
  shipDate: string;
  trackingNo: string;
  etaDate: string;
  carrier: string;
  remark?: string;
};

export type ProductionLogEntry = {
  stage: ProductionStage;
  timestamp: string;
  updatedBy: string;
  remark?: string;
};

export type QualityReport = {
  reportedAt: string;
  reportedBy: string;          // 品保人員
  result: QualityResult;
  defectQty?: number;
  defectRate?: number;
  reason?: string;
  visibleToSupplier: boolean;  // 是否同步給供應商看
};

// ============================================================
// Seed — 12 張 PO 跨 6 家供應商，涵蓋四模組所有場景
// ============================================================
function isoOffsetHours(h: number): string {
  const d = new Date(today + "T08:00:00Z");
  d.setUTCHours(d.getUTCHours() + h);
  return d.toISOString();
}
function isoOffsetDays(d: number): string {
  return isoOffsetHours(d * 24);
}

export const digitalPOs: DigitalPO[] = [
  // ---- s4 莊宏億（鋼架）— 1 張 PO 已 ack，2 張缺 ASN ----
  {
    id: "po-1", poNo: "PO-2026-0501", supplierId: "s4", partId: "p1", qty: 200, unitCost: 1450,
    sentAt: isoOffsetHours(-120), ackDeadline: isoOffsetHours(-72),
    ackedAt: isoOffsetHours(-100), ackedBy: "莊先生",
    expectedShipDate: isoOffsetDays(20), expectedArrival: isoOffsetDays(35),
    status: "in_production",
    productionLog: [
      { stage: "material_ready", timestamp: isoOffsetHours(-72), updatedBy: "莊先生" },
      { stage: "in_production", timestamp: isoOffsetHours(-24), updatedBy: "莊先生" },
    ],
    qualityReports: [],
  },
  {
    id: "po-2", poNo: "PO-2026-0502", supplierId: "s4", partId: "p1", qty: 80, unitCost: 1450,
    sentAt: isoOffsetHours(-60), ackDeadline: isoOffsetHours(-12),
    ackedAt: isoOffsetHours(-40), ackedBy: "莊先生",
    expectedShipDate: isoOffsetDays(-2), expectedArrival: isoOffsetDays(13),  // 預定昨天出貨，但 ASN 未填
    status: "in_production",
    productionLog: [{ stage: "in_production", timestamp: isoOffsetHours(-30), updatedBy: "莊先生" }],
    qualityReports: [],
  },
  // ---- s8 鈦泰（阻力組）— PO 發了 50hr 未回應（高風險戶）----
  {
    id: "po-3", poNo: "PO-2026-0503", supplierId: "s8", partId: "p3", qty: 50, unitCost: 780,
    sentAt: isoOffsetHours(-50), ackDeadline: isoOffsetHours(-2),  // 已逾 2hr
    expectedShipDate: isoOffsetDays(40), expectedArrival: isoOffsetDays(55),
    status: "sent",
    productionLog: [],
    qualityReports: [],
  },
  {
    id: "po-4", poNo: "PO-2026-0504", supplierId: "s8", partId: "p3", qty: 30, unitCost: 780,
    sentAt: isoOffsetHours(-70), ackDeadline: isoOffsetHours(-22),  // 已逾 22hr
    expectedShipDate: isoOffsetDays(45), expectedArrival: isoOffsetDays(60),
    status: "sent",
    productionLog: [],
    qualityReports: [],
  },
  // ---- s13 東台祺電（電源 / 控制）— 一張正常閉環、一張品質有問題 ----
  {
    id: "po-5", poNo: "PO-2026-0505", supplierId: "s13", partId: "p9", qty: 100, unitCost: 320,
    sentAt: isoOffsetHours(-720),  // 30 天前
    ackDeadline: isoOffsetHours(-672),
    ackedAt: isoOffsetHours(-700), ackedBy: "陳工程師",
    expectedShipDate: isoOffsetDays(-15), expectedArrival: isoOffsetDays(0),
    status: "received",
    asn: {
      filedAt: isoOffsetHours(-360), filedBy: "陳工程師",
      shipDate: isoOffsetDays(-15), trackingNo: "TW-EXP-7782",
      etaDate: isoOffsetDays(0), carrier: "新竹貨運",
    },
    productionLog: [
      { stage: "material_ready", timestamp: isoOffsetHours(-672), updatedBy: "陳工程師" },
      { stage: "in_production", timestamp: isoOffsetHours(-500), updatedBy: "陳工程師" },
      { stage: "packed", timestamp: isoOffsetHours(-380), updatedBy: "陳工程師" },
      { stage: "shipped", timestamp: isoOffsetHours(-360), updatedBy: "陳工程師" },
      { stage: "in_transit", timestamp: isoOffsetHours(-360), updatedBy: "system" },
      { stage: "arrived", timestamp: isoOffsetHours(-12), updatedBy: "倉管小張" },
    ],
    qualityReports: [
      { reportedAt: isoOffsetHours(-10), reportedBy: "品保 K", result: "pass", visibleToSupplier: true },
    ],
  },
  {
    id: "po-6", poNo: "PO-2026-0506", supplierId: "s13", partId: "p4", qty: 60, unitCost: 1280,
    sentAt: isoOffsetHours(-360), ackDeadline: isoOffsetHours(-312),
    ackedAt: isoOffsetHours(-340), ackedBy: "陳工程師",
    expectedShipDate: isoOffsetDays(-8), expectedArrival: isoOffsetDays(0),
    status: "received",
    asn: {
      filedAt: isoOffsetHours(-200), filedBy: "陳工程師",
      shipDate: isoOffsetDays(-8), trackingNo: "TW-EXP-7790",
      etaDate: isoOffsetDays(0), carrier: "黑貓宅急便",
    },
    productionLog: [
      { stage: "material_ready", timestamp: isoOffsetHours(-312), updatedBy: "陳工程師" },
      { stage: "in_production", timestamp: isoOffsetHours(-260), updatedBy: "陳工程師" },
      { stage: "shipped", timestamp: isoOffsetHours(-200), updatedBy: "陳工程師" },
      { stage: "arrived", timestamp: isoOffsetHours(-24), updatedBy: "倉管小張" },
    ],
    qualityReports: [
      { reportedAt: isoOffsetHours(-20), reportedBy: "品保 K", result: "major_defect", defectQty: 8, defectRate: 13.3,
        reason: "電容腳位偏移 → 焊接不良", visibleToSupplier: true },
    ],
  },
  // ---- s6 祺驊越南（飛輪）— ASN 填了但 ETA 將逾期 ----
  {
    id: "po-7", poNo: "PO-2026-0507", supplierId: "s6", partId: "p2", qty: 100, unitCost: 950,
    sentAt: isoOffsetHours(-480), ackDeadline: isoOffsetHours(-432),
    ackedAt: isoOffsetHours(-460), ackedBy: "Nguyen",
    expectedShipDate: isoOffsetDays(-7), expectedArrival: isoOffsetDays(8),
    status: "shipped",
    asn: {
      filedAt: isoOffsetHours(-180), filedBy: "Nguyen",
      shipDate: isoOffsetDays(-7), trackingNo: "VN-HPH-441890",
      etaDate: isoOffsetDays(10),  // 比預期晚 2 天
      carrier: "Yang Ming Marine",
      remark: "船期延後 2 天（紅海危機影響）",
    },
    productionLog: [
      { stage: "in_production", timestamp: isoOffsetHours(-380), updatedBy: "Nguyen" },
      { stage: "packed", timestamp: isoOffsetHours(-200), updatedBy: "Nguyen" },
      { stage: "shipped", timestamp: isoOffsetHours(-180), updatedBy: "Nguyen" },
      { stage: "in_transit", timestamp: isoOffsetHours(-178), updatedBy: "system" },
    ],
    qualityReports: [],
  },
  // ---- s7 吉輝（座墊）— PO ack 了但生產進度落後 ----
  {
    id: "po-8", poNo: "PO-2026-0508", supplierId: "s7", partId: "p6", qty: 200, unitCost: 230,
    sentAt: isoOffsetHours(-200), ackDeadline: isoOffsetHours(-152),
    ackedAt: isoOffsetHours(-190), ackedBy: "吉小姐",
    expectedShipDate: isoOffsetDays(-3), expectedArrival: isoOffsetDays(12),
    status: "acked",   // 還停在 acked，沒進 in_production
    productionLog: [],  // 完全沒更新生產進度
    qualityReports: [],
  },
  // ---- s11 海騁（皮帶）— 完美閉環 ----
  {
    id: "po-9", poNo: "PO-2026-0509", supplierId: "s11", partId: "p8", qty: 500, unitCost: 95,
    sentAt: isoOffsetHours(-600), ackDeadline: isoOffsetHours(-552),
    ackedAt: isoOffsetHours(-590), ackedBy: "海騁王經理",
    expectedShipDate: isoOffsetDays(-20), expectedArrival: isoOffsetDays(-5),
    status: "received",
    asn: {
      filedAt: isoOffsetHours(-490), filedBy: "海騁王經理",
      shipDate: isoOffsetDays(-20), trackingNo: "TW-EXP-6612",
      etaDate: isoOffsetDays(-5), carrier: "新竹貨運",
    },
    productionLog: [
      { stage: "material_ready", timestamp: isoOffsetHours(-552), updatedBy: "海騁王經理" },
      { stage: "in_production", timestamp: isoOffsetHours(-520), updatedBy: "海騁王經理" },
      { stage: "packed", timestamp: isoOffsetHours(-495), updatedBy: "海騁王經理" },
      { stage: "shipped", timestamp: isoOffsetHours(-490), updatedBy: "海騁王經理" },
      { stage: "arrived", timestamp: isoOffsetHours(-120), updatedBy: "倉管小張" },
    ],
    qualityReports: [
      { reportedAt: isoOffsetHours(-100), reportedBy: "品保 K", result: "pass", visibleToSupplier: true },
    ],
  },
  // ---- s13 又一張，加強品質紀錄（讓品質卡有 3 筆樣本）----
  {
    id: "po-10", poNo: "PO-2026-0510", supplierId: "s13", partId: "p9", qty: 80, unitCost: 320,
    sentAt: isoOffsetHours(-1500), ackDeadline: isoOffsetHours(-1452),
    ackedAt: isoOffsetHours(-1488), ackedBy: "陳工程師",
    expectedShipDate: isoOffsetDays(-50), expectedArrival: isoOffsetDays(-35),
    status: "received",
    productionLog: [
      { stage: "arrived", timestamp: isoOffsetHours(-840), updatedBy: "倉管小張" },
    ],
    qualityReports: [
      { reportedAt: isoOffsetHours(-820), reportedBy: "品保 K", result: "minor_defect", defectQty: 3, defectRate: 3.75,
        reason: "插座鬆動", visibleToSupplier: true },
    ],
  },
  {
    id: "po-11", poNo: "PO-2026-0511", supplierId: "s13", partId: "p9", qty: 120, unitCost: 320,
    sentAt: isoOffsetHours(-1100), ackDeadline: isoOffsetHours(-1052),
    ackedAt: isoOffsetHours(-1080), ackedBy: "陳工程師",
    expectedShipDate: isoOffsetDays(-35), expectedArrival: isoOffsetDays(-20),
    status: "received",
    productionLog: [{ stage: "arrived", timestamp: isoOffsetHours(-480), updatedBy: "倉管小張" }],
    qualityReports: [
      { reportedAt: isoOffsetHours(-460), reportedBy: "品保 K", result: "major_defect", defectQty: 11, defectRate: 9.17,
        reason: "輸出電壓不穩 (測試批 3 件超出規格)", visibleToSupplier: true },
    ],
  },
  // ---- s2 雙成（踏板）— 也來一張品質有問題的 ----
  {
    id: "po-12", poNo: "PO-2026-0512", supplierId: "s2", partId: "p7", qty: 150, unitCost: 180,
    sentAt: isoOffsetHours(-2200), ackDeadline: isoOffsetHours(-2152),
    ackedAt: isoOffsetHours(-2180), ackedBy: "雙成業務",
    expectedShipDate: isoOffsetDays(-70), expectedArrival: isoOffsetDays(-55),
    status: "received",
    productionLog: [{ stage: "arrived", timestamp: isoOffsetHours(-1320), updatedBy: "倉管小張" }],
    qualityReports: [
      { reportedAt: isoOffsetHours(-1300), reportedBy: "品保 K", result: "rejected", defectQty: 22, defectRate: 14.7,
        reason: "鋁壓鑄表面氣孔（不良 22 / 150 件）→ 退貨", visibleToSupplier: true },
    ],
  },
];

// ============================================================
// 模組 ①：未確認 PO（高風險戶名單）
// ============================================================
export type UnconfirmedPo = {
  po: DigitalPO;
  hoursSinceSent: number;
  hoursOverdue: number;          // 超過 48hr 後多久
  supplierName: string;
  partName: string;
};

export function unconfirmedPOs(nowIso: string = new Date().toISOString()): UnconfirmedPo[] {
  const now = new Date(nowIso).getTime();
  return digitalPOs
    .filter((po) => !po.ackedAt && po.status !== "rejected")
    .map((po) => {
      const sentMs = new Date(po.sentAt).getTime();
      const deadlineMs = new Date(po.ackDeadline).getTime();
      const hoursSinceSent = (now - sentMs) / 3_600_000;
      const hoursOverdue = Math.max(0, (now - deadlineMs) / 3_600_000);
      const supplier = suppliers.find((s) => s.id === po.supplierId);
      const part = parts.find((p) => p.id === po.partId);
      return {
        po,
        hoursSinceSent,
        hoursOverdue,
        supplierName: supplier?.name ?? po.supplierId,
        partName: part?.name ?? po.partId,
      };
    })
    .sort((a, b) => b.hoursOverdue - a.hoursOverdue);
}

// ============================================================
// 模組 ②：缺 ASN 的 PO（預防性檢測 — 副總提前 48hr 知道延誤）
// ============================================================
export type MissingAsn = {
  po: DigitalPO;
  daysUntilShipExpected: number;
  daysSinceExpectedShip: number;
  supplierName: string;
  partName: string;
  severity: "critical" | "warn" | "watch";
};

export function missingASNs(nowIso: string = new Date().toISOString()): MissingAsn[] {
  const now = new Date(nowIso).getTime();
  const todayMs = new Date(today + "T00:00:00Z").getTime();
  return digitalPOs
    .filter((po) => !po.asn && (po.status === "in_production" || po.status === "acked"))
    .map((po) => {
      const shipMs = new Date(po.expectedShipDate + "T00:00:00Z").getTime();
      const daysUntilShip = Math.round((shipMs - todayMs) / 86_400_000);
      const daysSinceShip = -daysUntilShip;
      const supplier = suppliers.find((s) => s.id === po.supplierId);
      const part = parts.find((p) => p.id === po.partId);
      // 預防性規則：預定出貨前 3 天內仍無 ASN → critical
      const severity: MissingAsn["severity"] =
        daysUntilShip < 0 ? "critical" :     // 已逾預定出貨日
        daysUntilShip <= 3 ? "warn" :         // 3 天內出貨但沒填 ASN
        "watch";
      void now;
      return {
        po,
        daysUntilShipExpected: daysUntilShip,
        daysSinceExpectedShip: daysSinceShip,
        supplierName: supplier?.name ?? po.supplierId,
        partName: part?.name ?? po.partId,
        severity,
      };
    })
    .sort((a, b) => {
      const sevOrd = { critical: 0, warn: 1, watch: 2 };
      if (sevOrd[a.severity] !== sevOrd[b.severity]) return sevOrd[a.severity] - sevOrd[b.severity];
      return a.daysUntilShipExpected - b.daysUntilShipExpected;
    });
}

// ============================================================
// 模組 ③：供應商階段平均運行時間（議價硬數據）
// ============================================================
export type SupplierStageAvg = {
  supplierId: string;
  supplierName: string;
  totalPOs: number;
  ackHoursAvg: number;
  materialReadyDaysAvg: number;
  productionDaysAvg: number;
  packToShipDaysAvg: number;
  transitDaysAvg: number;
  cycleTotalDaysAvg: number;
  benchmark: { stage: string; verdict: "fast" | "ok" | "slow" }[];
};

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}
function daysBetween(a: string, b: string): number {
  return hoursBetween(a, b) / 24;
}

export function supplierStageAverages(): SupplierStageAvg[] {
  const groups = new Map<string, DigitalPO[]>();
  for (const po of digitalPOs) {
    const arr = groups.get(po.supplierId) ?? [];
    arr.push(po);
    groups.set(po.supplierId, arr);
  }
  return [...groups.entries()].map(([supplierId, list]) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const acked = list.filter((p) => p.ackedAt);
    const ackHours = acked.map((p) => hoursBetween(p.sentAt, p.ackedAt!));
    const matReady = list.flatMap((p) => p.productionLog.filter((l) => l.stage === "material_ready").map((l) => ({ ack: p.ackedAt, m: l.timestamp })))
      .filter((x): x is { ack: string; m: string } => !!x.ack);
    const matDays = matReady.map((x) => daysBetween(x.ack, x.m));
    const prodDone = list.flatMap((p) => {
      const ms = p.productionLog.find((l) => l.stage === "material_ready")?.timestamp;
      const pk = p.productionLog.find((l) => l.stage === "packed" || l.stage === "shipped")?.timestamp;
      return ms && pk ? [daysBetween(ms, pk)] : [];
    });
    const packShip = list.flatMap((p) => {
      const pk = p.productionLog.find((l) => l.stage === "packed")?.timestamp;
      const sh = p.productionLog.find((l) => l.stage === "shipped")?.timestamp;
      return pk && sh ? [daysBetween(pk, sh)] : [];
    });
    const transit = list.flatMap((p) => {
      const sh = p.productionLog.find((l) => l.stage === "shipped")?.timestamp;
      const ar = p.productionLog.find((l) => l.stage === "arrived")?.timestamp;
      return sh && ar ? [daysBetween(sh, ar)] : [];
    });
    const cycle = list.flatMap((p) => {
      const ar = p.productionLog.find((l) => l.stage === "arrived")?.timestamp;
      return ar ? [daysBetween(p.sentAt, ar)] : [];
    });
    const avg = (a: number[]) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
    const ackH = avg(ackHours);
    const matD = avg(matDays);
    const prodD = avg(prodDone);
    const packD = avg(packShip);
    const trD = avg(transit);
    const cycD = avg(cycle);
    return {
      supplierId,
      supplierName: supplier?.name ?? supplierId,
      totalPOs: list.length,
      ackHoursAvg: ackH,
      materialReadyDaysAvg: matD,
      productionDaysAvg: prodD,
      packToShipDaysAvg: packD,
      transitDaysAvg: trD,
      cycleTotalDaysAvg: cycD,
      benchmark: [
        { stage: "PO 確認", verdict: (ackH < 24 ? "fast" : ackH < 48 ? "ok" : "slow") as "fast" | "ok" | "slow" },
        { stage: "備料", verdict: (matD < 3 ? "fast" : matD < 7 ? "ok" : "slow") as "fast" | "ok" | "slow" },
        { stage: "生產", verdict: (prodD < 15 ? "fast" : prodD < 25 ? "ok" : "slow") as "fast" | "ok" | "slow" },
        { stage: "出貨運輸", verdict: (trD < 7 ? "fast" : trD < 15 ? "ok" : "slow") as "fast" | "ok" | "slow" },
      ],
    };
  }).filter((x) => x.totalPOs > 0)
    .sort((a, b) => a.cycleTotalDaysAvg - b.cycleTotalDaysAvg);
}

// ============================================================
// 模組 ④：品質記錄卡（漲價談判硬數據）
// ============================================================
export type QualityCard = {
  supplierId: string;
  supplierName: string;
  totalLots: number;            // 進料批次
  passLots: number;
  minorDefectLots: number;
  majorDefectLots: number;
  rejectedLots: number;
  passRate: number;             // %
  defectRateAvg: number;        // 平均不良率
  recentDefects: { date: string; reason: string; defectRate: number; result: QualityResult }[];
  grade: "A" | "B" | "C" | "D";
  negotiationStance: string;     // 對方漲價時的拿話
};

export function qualityCards(): QualityCard[] {
  const groups = new Map<string, QualityReport[]>();
  for (const po of digitalPOs) {
    for (const q of po.qualityReports) {
      const arr = groups.get(po.supplierId) ?? [];
      arr.push(q);
      groups.set(po.supplierId, arr);
    }
  }
  return [...groups.entries()].map(([supplierId, reports]) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const passLots = reports.filter((r) => r.result === "pass").length;
    const minor = reports.filter((r) => r.result === "minor_defect").length;
    const major = reports.filter((r) => r.result === "major_defect").length;
    const rejected = reports.filter((r) => r.result === "rejected").length;
    const total = reports.length;
    const passRate = total > 0 ? (passLots / total) * 100 : 100;
    const defects = reports.filter((r) => r.defectRate != null);
    const defectRateAvg = defects.length > 0 ? defects.reduce((s, x) => s + (x.defectRate ?? 0), 0) / defects.length : 0;
    const recent = reports
      .filter((r) => r.result !== "pass")
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
      .slice(0, 5)
      .map((r) => ({
        date: r.reportedAt.slice(0, 10),
        reason: r.reason ?? "—",
        defectRate: r.defectRate ?? 0,
        result: r.result,
      }));
    const grade: QualityCard["grade"] =
      passRate >= 95 && rejected === 0 ? "A" :
      passRate >= 85 && rejected === 0 ? "B" :
      passRate >= 70 ? "C" : "D";
    const issueCount = minor + major + rejected;
    const negotiationStance =
      grade === "A" ? "✓ 品質優異，可長期合作 / 議價空間有限"
      : grade === "B" ? `近期異常 ${issueCount} 次，建議要求改善計畫`
      : grade === "C" ? `近期異常 ${issueCount} 次，要求重新議價、扣品質保證金 5%`
      : `不良率 ${defectRateAvg.toFixed(1)}%，建議準備備援、暫停加單`;
    return {
      supplierId,
      supplierName: supplier?.name ?? supplierId,
      totalLots: total,
      passLots,
      minorDefectLots: minor,
      majorDefectLots: major,
      rejectedLots: rejected,
      passRate,
      defectRateAvg,
      recentDefects: recent,
      grade,
      negotiationStance,
    };
  }).sort((a, b) => b.passRate - a.passRate);
}

// ============================================================
// 整體 KPI（給主頁頂部用）
// ============================================================
export type PortalKpis = {
  totalPOs: number;
  unconfirmedCount: number;
  unconfirmedOverdue: number;       // 超過 48hr
  missingAsnCritical: number;       // 已逾預定出貨日
  qualityIssueLast90d: number;
  totalSuppliersDigitized: number;
};

export function portalKpis(): PortalKpis {
  const unconf = unconfirmedPOs();
  const missing = missingASNs();
  const qIssues = digitalPOs.reduce((s, po) =>
    s + po.qualityReports.filter((r) => r.result !== "pass").length, 0);
  const digitizedSuppliers = new Set(digitalPOs.map((p) => p.supplierId)).size;
  return {
    totalPOs: digitalPOs.length,
    unconfirmedCount: unconf.length,
    unconfirmedOverdue: unconf.filter((x) => x.hoursOverdue > 0).length,
    missingAsnCritical: missing.filter((x) => x.severity === "critical").length,
    qualityIssueLast90d: qIssues,
    totalSuppliersDigitized: digitizedSuppliers,
  };
}
