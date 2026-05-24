// 全球供應鏈地圖 — Global Supply Chain Map
//
// 情境模擬：
//   · 台灣地震    → 哪些供應商受影響
//   · 紅海危機    → 哪些船期延誤
//   · 美元升值    → 哪些料件將漲價
//   · 中國限電    → 哪些供應商產能受限
//   · 越南封城    → 哪些製造延遲

import { suppliers, parts, bom, workOrders } from "./seed";
import { digitalPOs } from "./supplier-portal";

export type ScenarioKey = "tw_quake" | "red_sea" | "usd_up" | "cn_power" | "vn_lockdown";

export type Scenario = {
  key: ScenarioKey;
  emoji: string;
  title: string;
  titleEn: string;
  desc: string;
  affectedCountries: string[];
  impactType: "production_halt" | "shipping_delay" | "cost_increase" | "capacity_limit";
  severity: "low" | "med" | "high";
  // 量化影響
  delayDays?: number;
  costIncreasePct?: number;
  productionLossPct?: number;
};

export const SCENARIOS: Scenario[] = [
  {
    key: "tw_quake",
    emoji: "🌏",
    title: "台灣地震",
    titleEn: "Taiwan Earthquake",
    desc: "嘉義以南規模 6.2，部分工廠停工檢修 5-7 天",
    affectedCountries: ["台灣"],
    impactType: "production_halt",
    severity: "high",
    productionLossPct: 100,
    delayDays: 7,
  },
  {
    key: "red_sea",
    emoji: "🚢",
    title: "紅海危機（船運繞道）",
    titleEn: "Red Sea Crisis",
    desc: "蘇伊士運河受阻，所有歐洲航線改繞好望角，延誤 14-21 天",
    affectedCountries: ["越南", "馬來西亞", "泰國"],   // 出口至歐洲的亞洲廠
    impactType: "shipping_delay",
    severity: "high",
    delayDays: 18,
    costIncreasePct: 12,
  },
  {
    key: "usd_up",
    emoji: "💵",
    title: "美元升值 5%",
    titleEn: "USD Strengthens 5%",
    desc: "新台幣對美元貶值 5%，所有美元計價進口料件將漲價",
    affectedCountries: ["美國", "日本", "韓國"],
    impactType: "cost_increase",
    severity: "med",
    costIncreasePct: 5,
  },
  {
    key: "cn_power",
    emoji: "🔌",
    title: "中國限電",
    titleEn: "China Power Rationing",
    desc: "江浙工廠每週限電 2-3 天，產能下降 30-40%",
    affectedCountries: ["中國大陸"],
    impactType: "capacity_limit",
    severity: "med",
    productionLossPct: 35,
    delayDays: 10,
  },
  {
    key: "vn_lockdown",
    emoji: "🦠",
    title: "越南封城",
    titleEn: "Vietnam Lockdown",
    desc: "胡志明市封城 14 天，越南工廠全停",
    affectedCountries: ["越南"],
    impactType: "production_halt",
    severity: "high",
    productionLossPct: 100,
    delayDays: 14,
  },
];

export type ScenarioImpact = {
  scenario: Scenario;
  affectedSuppliers: { id: string; code: string; name: string; country: string; activePOCount: number; activePOValue: number }[];
  affectedParts: { code: string; name: string; supplier: string; impactType: string }[];
  affectedShipments: { poNo: string; supplier: string; etaDate: string; predictedDelay: number }[];
  affectedWoNos: string[];
  totalExposedValue: number;        // 受影響的在製金額
  totalAffectedSuppliers: number;
  totalAffectedPOs: number;
};

export function simulateScenario(key: ScenarioKey): ScenarioImpact {
  const scenario = SCENARIOS.find((s) => s.key === key)!;
  // 受影響供應商：國家匹配
  const affectedSuppliers = suppliers
    .filter((s) => scenario.affectedCountries.some((c) => s.country.includes(c) || c.includes(s.country)))
    .map((s) => {
      const myPOs = digitalPOs.filter((p) => p.supplierId === s.id && p.status !== "received" && p.status !== "closed");
      const poValue = myPOs.reduce((sum, p) => sum + p.qty * p.unitCost, 0);
      return {
        id: s.id, code: s.code, name: s.name, country: s.country,
        activePOCount: myPOs.length, activePOValue: poValue,
      };
    });

  // 受影響料件
  const affectedSupplierIds = new Set(affectedSuppliers.map((s) => s.id));
  const affectedParts = parts
    .filter((p) => p.supplierId && affectedSupplierIds.has(p.supplierId))
    .map((p) => {
      const sup = suppliers.find((s) => s.id === p.supplierId);
      return {
        code: p.code,
        name: p.name,
        supplier: sup?.name ?? "—",
        impactType: scenario.impactType === "shipping_delay" ? "船期延誤"
          : scenario.impactType === "production_halt" ? "生產停滯"
          : scenario.impactType === "capacity_limit" ? "產能受限"
          : "成本上升",
      };
    });

  // 受影響在途出貨
  const affectedShipments = digitalPOs
    .filter((p) => affectedSupplierIds.has(p.supplierId) && p.status !== "received" && p.status !== "closed")
    .map((p) => {
      const sup = suppliers.find((s) => s.id === p.supplierId);
      return {
        poNo: p.poNo,
        supplier: sup?.name ?? "—",
        etaDate: p.expectedArrival,
        predictedDelay: scenario.delayDays ?? 0,
      };
    });

  // 受影響工單（凡 BOM 用到此料件且工單進行中）
  const affectedPartIds = new Set(
    parts.filter((p) => p.supplierId && affectedSupplierIds.has(p.supplierId)).map((p) => p.id)
  );
  const affectedWos = new Set<string>();
  for (const wo of workOrders) {
    if (wo.status !== "active" && wo.status !== "planning") continue;
    const usesAffected = bom.some((b) => b.modelId === wo.modelId && affectedPartIds.has(b.partId) && b.isActive);
    if (usesAffected) affectedWos.add(wo.woNo);
  }

  const totalExposedValue = affectedSuppliers.reduce((s, x) => s + x.activePOValue, 0);

  return {
    scenario,
    affectedSuppliers,
    affectedParts: affectedParts.slice(0, 30),    // 顯示前 30
    affectedShipments: affectedShipments.slice(0, 30),
    affectedWoNos: [...affectedWos],
    totalExposedValue,
    totalAffectedSuppliers: affectedSuppliers.length,
    totalAffectedPOs: affectedShipments.length,
  };
}

// 各國別的供應商統計（給地圖用）
export type CountryNode = {
  country: string;
  supplierCount: number;
  totalPOs: number;
  totalActiveValue: number;
  x: number;       // 地圖座標（簡化的世界地圖）
  y: number;
};

// 地圖座標（百分比，簡化的亞洲地圖）
const COUNTRY_COORDS: Record<string, [number, number]> = {
  "台灣": [82, 55],
  "中國大陸": [70, 38],
  "越南": [70, 60],
  "馬來西亞": [62, 75],
  "泰國": [60, 60],
  "印度": [42, 55],
  "日本": [90, 35],
  "韓國": [82, 32],
  "印尼": [70, 82],
  "美國": [18, 38],
  "德國": [40, 25],
};

export function supplierCountryMap(): CountryNode[] {
  const groups = new Map<string, { supplierIds: Set<string>; poCount: number; activeValue: number }>();
  for (const sup of suppliers) {
    const key = sup.country;
    const g = groups.get(key) ?? { supplierIds: new Set(), poCount: 0, activeValue: 0 };
    g.supplierIds.add(sup.id);
    const myPOs = digitalPOs.filter((p) => p.supplierId === sup.id);
    g.poCount += myPOs.length;
    g.activeValue += myPOs.filter((p) => p.status !== "received").reduce((s, p) => s + p.qty * p.unitCost, 0);
    groups.set(key, g);
  }
  return [...groups.entries()].map(([country, g]) => {
    const [x, y] = COUNTRY_COORDS[country] ?? [50, 50];
    return {
      country,
      supplierCount: g.supplierIds.size,
      totalPOs: g.poCount,
      totalActiveValue: g.activeValue,
      x, y,
    };
  });
}
