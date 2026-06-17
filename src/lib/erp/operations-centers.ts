// 6 大作戰中心（Operations Centers）— 第二層真正核心
//
// 不是「細節頁面」而是「作戰領域」：
//   1. /os/supplier      Supplier Operations Center
//   2. /os/delivery      Delivery Control Center
//   3. /os/manufacturing Manufacturing Control Tower
//   4. /os/inventory     Inventory & Warehouse Center
//   5. /os/procurement   Procurement Intelligence Center
//   6. /os/decision      AI Decision Center（最重要，全系統大腦）

import { computeOTD, computeForwardOTD, forecastAll, blamingSuppliers } from "./otif";
import { computeShortageWall } from "./shortage-ai";
import { equipmentUtilization } from "./critical-path";
import { computeInventoryKpis } from "./inventory-health";
import { commodities, spc, priceZone } from "./commodities";
import { unconfirmedPOs, missingASNs, earlyWarningSignals, digitalPOs } from "./supplier-portal";
import { qualityCards } from "./supplier-portal";
import { topDecisions } from "./decision-engine";
import { etaForecastSummary } from "./eta-forecast";
import { workOrders } from "./seed";

export type CenterSlug = "supplier" | "delivery" | "manufacturing" | "inventory" | "procurement" | "decision";

export type CenterKpi = {
  label: string;
  value: string;
  sub: string;
  tone: "good" | "warn" | "bad" | "info";
};

export type CenterLink = {
  href: string;
  emoji: string;
  label: string;
  desc: string;
  badge?: string;        // e.g., "8 件待處理"
  badgeTone?: "rose" | "amber" | "cyan" | "emerald";
};

export type CenterAlert = {
  severity: "critical" | "warn" | "info";
  text: string;
  href?: string;
};

export type OperationsCenter = {
  slug: CenterSlug;
  emoji: string;
  title: string;
  titleEn: string;
  role: string;          // "這裡是..." description
  bgGradient: string;
  kpis: CenterKpi[];
  alerts: CenterAlert[];
  links: CenterLink[];
};

// ============================================================
// 1. Supplier Operations Center
// ============================================================
function supplierCenter(): OperationsCenter {
  const unconf = unconfirmedPOs();
  const missAsn = missingASNs();
  const signals = earlyWarningSignals();
  const blamers = blamingSuppliers(forecastAll());
  const cards = qualityCards();
  const issueLots = cards.reduce((s, c) => s + c.minorDefectLots + c.majorDefectLots + c.rejectedLots, 0);
  const supplierCount = new Set(digitalPOs.map((p) => p.supplierId)).size;
  const critSignals = signals.filter((s) => s.severity === "critical").length;
  const overdueAck = unconf.filter((u) => u.hoursOverdue > 0).length;
  const missingCrit = missAsn.filter((m) => m.severity === "critical").length;

  return {
    slug: "supplier", emoji: "🤝", title: "Supplier Operations Center",
    titleEn: "供應商作戰中心",
    role: "管理 PO 確認 / ASN / 進度 / 品質 / 評核 / 雙向協作 — 所有跟供應商的互動都從這裡開始",
    bgGradient: "from-cyan-600 to-blue-700",
    kpis: [
      { label: "數位化供應商",   value: `${supplierCount}`, sub: "已上平台",          tone: "info" },
      { label: "PO 未確認",      value: `${overdueAck}`,    sub: "超過 48hr",        tone: overdueAck > 3 ? "bad" : overdueAck > 0 ? "warn" : "good" },
      { label: "ASN 缺漏",       value: `${missingCrit}`,   sub: "已逾預定出貨",      tone: missingCrit > 0 ? "bad" : "good" },
      { label: "AI 預警前兆",    value: `${critSignals}`,   sub: "Twin baseline 偏離", tone: critSignals > 0 ? "bad" : "good" },
      { label: "造成停線",       value: `${blamers.length}`,sub: "供應商家數",        tone: blamers.length > 0 ? "warn" : "good" },
      { label: "品質異常累積",   value: `${issueLots}`,     sub: "近期 minor+major+退貨", tone: issueLots > 3 ? "warn" : "good" },
    ],
    alerts: [
      ...signals.filter((s) => s.severity === "critical").slice(0, 3).map((s) => ({
        severity: "critical" as const,
        text: `${s.supplierName} ${s.poNo}：${s.stageLabel} 偏離 ${s.deviationSigma.toFixed(1)}σ — ${s.recommendedAction.slice(0, 30)}`,
        href: "/erp/supplier-portal/audit",
      })),
      ...missAsn.filter((m) => m.severity === "critical").slice(0, 2).map((m) => ({
        severity: "critical" as const,
        text: `🚨 ${m.po.poNo} ${m.supplierName} 已逾預定出貨 ${m.daysSinceExpectedShip} 天且無 ASN`,
        href: "/erp/supplier-portal",
      })),
    ],
    links: [
      { href: "/erp/supplier-portal",        emoji: "🤝", label: "供應商協作入口",   desc: "4 大模組 + Digital Twin + AI 預警前兆", badge: `${digitalPOs.length} PO`, badgeTone: "cyan" },
      { href: "/erp/supplier-portal/audit",  emoji: "🛰", label: "供應商風險雷達",   desc: "5 維加權 + 動量偵測 + 議價拿話" },
      { href: "/erp/supplier-portal/vendor", emoji: "🌐", label: "供應商提交入口",   desc: "供應商 4-step lock-in PO 確認流程" },
      { href: "/erp/suppliers",              emoji: "🏭", label: "供應商主檔",       desc: `${supplierCount} 家供應商，CSV 匯出` },
      { href: "/erp/po-generator",           emoji: "🛒", label: "採購單生成",       desc: "缺料 → PO 依供應商分組 + 列印" },
      { href: "/erp/admin/qr-generator",     emoji: "📱", label: "QR 標籤生成",       desc: "PO / 箱 / Lot / 料件 QR 列印" },
    ],
  };
}

// ============================================================
// 2. Delivery Control Center
// ============================================================
function deliveryCenter(): OperationsCenter {
  const f = forecastAll();
  const otd = computeOTD();
  const fwd = computeForwardOTD(f);
  const etaSum = etaForecastSummary();
  const redWos = f.filter((x) => x.light === "red").length;
  const totalDelay = f.filter((x) => x.light !== "green").length;

  return {
    slug: "delivery", emoji: "🚚", title: "Delivery Control Center",
    titleEn: "交付指揮中心",
    role: "管理客戶交期 / OTIF / OTD / Delay / 客戶風險 — 確保我們對客戶的承諾不破",
    bgGradient: "from-emerald-600 to-teal-700",
    kpis: [
      { label: "OTD（歷史）", value: `${otd.otd.toFixed(1)}%`,  sub: `${otd.onTimeCount}/${otd.doneCount}`, tone: otd.otd >= 95 ? "good" : "warn" },
      { label: "OTIF（歷史）", value: `${otd.otif.toFixed(1)}%`, sub: "準時+足量",             tone: otd.otif >= 95 ? "good" : "warn" },
      { label: "🔴 預測必延誤", value: `${redWos}`,                sub: "張在製工單",            tone: redWos > 0 ? "bad" : "good" },
      { label: "🟡 預測可能延誤", value: `${f.filter((x) => x.light === "yellow").length}`, sub: "張在製工單", tone: "warn" },
      { label: "ETA 風險", value: `${etaSum.risk}`,            sub: "PO 準時機率<60%",      tone: etaSum.risk > 0 ? "bad" : "good" },
      { label: "預測 OTD", value: `${fwd.greenPct.toFixed(0)}%`,sub: "在製單預測準時率",      tone: fwd.greenPct >= 90 ? "good" : "warn" },
    ],
    alerts: [
      ...f.filter((x) => x.light === "red").slice(0, 3).map((x) => ({
        severity: "critical" as const,
        text: `🚨 ${x.wo.woNo} ${x.wo.customer} 預測延 ${-x.slackDays} 天，主因：${x.reason}`,
        href: "/erp/work-orders/" + x.wo.id,
      })),
    ],
    links: [
      { href: "/erp/eta-forecast",  emoji: "🔮", label: "AI ETA 預測引擎", desc: "每張在途 PO 準時機率 + 風險原因 + AI 建議", badge: `${etaSum.total} PO`, badgeTone: "cyan" },
      { href: "/erp",               emoji: "🚦", label: "客戶交期燈號",     desc: "戰情室紅黃綠燈 + 責任供應商" },
      { href: "/erp/customers",     emoji: "👥", label: "客戶分析",         desc: "客戶 OTD / 營收 / 在製管線" },
      { href: "/erp/work-orders",   emoji: "📋", label: "工單追蹤",         desc: `${totalDelay} 張風險訂單`, badge: totalDelay > 0 ? `${totalDelay} 風險` : undefined, badgeTone: "amber" },
      { href: "/erp/calendar",      emoji: "📅", label: "排程日曆",         desc: "Gantt 時間軸 + 月曆視圖" },
      { href: "/erp/order-impact",  emoji: "⚡", label: "訂單衝擊模擬器",   desc: "急單→3 方案 30 秒推副總" },
    ],
  };
}

// ============================================================
// 3. Manufacturing Control Tower
// ============================================================
function manufacturingCenter(): OperationsCenter {
  const f = forecastAll();
  const equip = equipmentUtilization();
  const critEquip = equip.filter((e) => e.riskLevel === "critical").length;
  const wipWos = workOrders.filter((w) => w.status === "active").length;
  const planningWos = workOrders.filter((w) => w.status === "planning").length;

  return {
    slug: "manufacturing", emoji: "🏭", title: "Manufacturing Control Tower",
    titleEn: "生產指揮塔",
    role: "管理工單 / Critical Path / 瓶頸 / 產能 / WIP — 工廠所有作戰指令源頭",
    bgGradient: "from-blue-600 to-indigo-700",
    kpis: [
      { label: "WIP（在製）",       value: `${wipWos}`,         sub: "張工單", tone: "info" },
      { label: "規劃中工單",         value: `${planningWos}`,    sub: "張，等待開工", tone: "info" },
      { label: "⚙️ 瓶頸設備",         value: `${critEquip}`,      sub: "≥92% 稼動率",   tone: critEquip > 0 ? "bad" : "good" },
      { label: "🟡 中度稼動",         value: `${equip.filter((e) => e.riskLevel === "warn").length}`, sub: "≥85%", tone: "warn" },
      { label: "🔴 紅燈工單",        value: `${f.filter((x) => x.light === "red").length}`, sub: "預測必延誤", tone: "bad" },
      { label: "Critical Path",     value: "計算中",            sub: "所有在製單即時", tone: "info" },
    ],
    alerts: [
      ...equip.filter((e) => e.riskLevel === "critical").slice(0, 3).map((e) => ({
        severity: "warn" as const,
        text: `⚙️ ${e.name} 稼動率 ${e.utilizationPct}% — ${e.aiVerdict}`,
        href: "/erp/work-orders",
      })),
    ],
    links: [
      { href: "/erp/work-orders",    emoji: "📋", label: "工單追蹤 + Critical Path", desc: "8 階段 Gantt + 紅黃燈 + 7 台設備稼動率" },
      { href: "/erp/flow",           emoji: "🌊", label: "流程綜觀",                 desc: "客戶下需求→出貨整鏈 + 瓶頸顧問" },
      { href: "/erp/calendar",       emoji: "📅", label: "排程日曆",                 desc: "Gantt 時間軸 + 月曆視圖" },
      { href: "/erp/outsource",      emoji: "🏭", label: "委外倉管理",               desc: "電鍍/烤漆在外量 + 逾期預警" },
      { href: "/erp/models",         emoji: "🏗", label: "型號 + 多階 BOM",          desc: "成品卡 + 樹狀展開 + 成本 rollup" },
      { href: "/erp/bom-compare",    emoji: "🔍", label: "BOM 對照",                 desc: "兩成品 BOM 並排比對" },
    ],
  };
}

// ============================================================
// 4. Inventory & Warehouse Center
// ============================================================
function inventoryCenter(): OperationsCenter {
  const kpis = computeInventoryKpis();
  const wall = computeShortageWall();
  const sGrade = wall.filter((w) => w.grade === "S").length;

  return {
    slug: "inventory", emoji: "📦", title: "Inventory & Warehouse Center",
    titleEn: "庫存倉儲中心",
    role: "管理庫存健康 / WMS / DOH / 呆料 / 收貨 / 安全庫存 — 料件流動的所有環節",
    bgGradient: "from-amber-600 to-orange-700",
    kpis: [
      { label: "DOH 中位數",      value: `${kpis.dohMedian.toFixed(0)}d`,                 sub: `${kpis.dohRiskCount} 件 <7d`, tone: kpis.dohRiskCount > 5 ? "bad" : kpis.dohRiskCount > 0 ? "warn" : "good" },
      { label: "週轉率（年）",    value: `${kpis.turnoverAvg.toFixed(1)}×`,               sub: "健康 ≥6×", tone: kpis.turnoverAvg >= 6 ? "good" : "warn" },
      { label: "過剩庫存",        value: `${kpis.excessCount}`,                            sub: `$${(kpis.excessValue / 10000).toFixed(0)}萬`, tone: kpis.excessCount > 10 ? "bad" : "warn" },
      { label: "呆滯（>180d）",   value: `${kpis.agingCount}`,                             sub: `$${(kpis.agingValue / 10000).toFixed(0)}萬`, tone: kpis.agingCount > 5 ? "bad" : "good" },
      { label: "安全庫存達成率",   value: `${kpis.safetyCompliance.toFixed(0)}%`,           sub: `${kpis.belowSafetyCount} 件低於安全`, tone: kpis.safetyCompliance >= 95 ? "good" : "warn" },
      { label: "S 級缺料",        value: `${sGrade}`,                                       sub: "48hr 內停線", tone: sGrade > 0 ? "bad" : "good" },
    ],
    alerts: wall.filter((w) => w.grade === "S" || w.grade === "A").slice(0, 3).map((w) => ({
      severity: w.grade === "S" ? "critical" as const : "warn" as const,
      text: `${w.grade} 級缺料：${w.part.code} ${w.part.name} 缺 ${w.shortage} ${w.part.unit}`,
      href: "/erp/shortage-wall",
    })),
    links: [
      { href: "/erp/wms",             emoji: "⚡", label: "WMS Dashboard",         desc: "CHI HUA Pulse v2 + 5 KPI", badge: `$${(kpis.totalInventoryValue / 10000).toFixed(0)}萬`, badgeTone: "cyan" },
      { href: "/erp/wms/receiving",   emoji: "📥", label: "收貨 Checklist",        desc: "7 階段風控架構（必過才能入庫）" },
      { href: "/erp/wms/spc-shaft",   emoji: "🎯", label: "軸心 SPC（鉞泰）",      desc: "20 項規格 × 3 批 + Cpk 趨勢" },
      { href: "/erp/shortage-wall",   emoji: "🧱", label: "缺料牆",                desc: `S/A/B/C 分級 + AI 三方案`, badge: sGrade > 0 ? `S 級 ${sGrade}` : undefined, badgeTone: "rose" },
      { href: "/erp/reorder",         emoji: "📦", label: "再下單時點",            desc: "ROP + 四級警示" },
      { href: "/erp/dead-stock",      emoji: "🗑", label: "呆料預警",              desc: "呆滯料 + 庫存週轉率" },
      { href: "/erp/analytics",       emoji: "📊", label: "零件分析",              desc: "共用零件 / ABC / 供應商集中度" },
      { href: "/erp/parts",           emoji: "🔩", label: "零件主檔",              desc: "119 料件 + CSV 匯出" },
    ],
  };
}

// ============================================================
// 5. Procurement Intelligence Center
// ============================================================
function procurementCenter(): OperationsCenter {
  const dangerCommodity = commodities.filter((c) => priceZone(c).zone === "危險").length;
  const buyCommodity = commodities.filter((c) => priceZone(c).zone === "低檔" || priceZone(c).zone === "囤貨").length;
  const surgeCommodity = commodities.filter((c) => spc(c).status === "alert").length;

  return {
    slug: "procurement", emoji: "💎", title: "Procurement Intelligence Center",
    titleEn: "採購情報中心",
    role: "管理原物料 / Should-Cost / 議價 / 成本分析 / 供應商基準 — 採購情報與決策",
    bgGradient: "from-violet-600 to-purple-700",
    kpis: [
      { label: "🔴 危險區商品", value: `${dangerCommodity}`,           sub: "過熱，暫停加單", tone: dangerCommodity > 0 ? "bad" : "good" },
      { label: "🟢 低檔/囤貨機會", value: `${buyCommodity}`,            sub: "可進場備料",     tone: buyCommodity > 0 ? "good" : "info" },
      { label: "SPC Alert",       value: `${surgeCommodity}`,           sub: "超出管制界線",   tone: surgeCommodity > 0 ? "bad" : "good" },
      { label: "監控原物料",       value: `${commodities.length}`,       sub: "全球行情",        tone: "info" },
      { label: "Should-Cost 類別", value: "19",                          sub: "業界經驗值",      tone: "info" },
      { label: "FX 監控",          value: "4 幣別",                      sub: "USD/CNY/VND/JPY", tone: "info" },
    ],
    alerts: commodities.filter((c) => priceZone(c).zone === "危險").slice(0, 3).map((c) => ({
      severity: "warn" as const,
      text: `🔴 ${c.name} 進入危險區：${priceZone(c).oneLiner}`,
      href: "/erp/materials",
    })),
    links: [
      { href: "/erp/materials",     emoji: "🌐", label: "原物料 AI 戰情室",  desc: "6 大來源 + 4 區判斷 + 採購建議推理鏈" },
      { href: "/erp/should-cost",   emoji: "💎", label: "Should-Cost 拆解",  desc: "AI 漲價合理性判斷 + 議價會議拿話" },
      { href: "/erp/negotiation",   emoji: "🤝", label: "AI 議價引擎",       desc: "6 維分析 + 議價策略" },
      { href: "/erp/global-map",    emoji: "🌍", label: "全球供應鏈地圖",    desc: "5 情境模擬：地震/紅海/匯率/限電/封城" },
      { href: "/erp/po-generator",  emoji: "🛒", label: "採購單生成",        desc: "缺料 → PO 依供應商分組" },
      { href: "/erp/supplier-portal/audit", emoji: "📊", label: "供應商基準比較", desc: "5 維加權 Risk Radar + 議價立場" },
    ],
  };
}

// ============================================================
// 6. AI Decision Center — 最重要，全系統大腦
// ============================================================
function decisionCenter(): OperationsCenter {
  const decisions = topDecisions();
  const critical = decisions.filter((d) => d.urgency === "now").length;

  return {
    slug: "decision", emoji: "🧠", title: "AI Decision Center",
    titleEn: "AI 決策中心（最重要 — 全系統大腦）",
    role: "AI 推薦 / Simulation / What-if / Scenario / Risk Prediction / Auto Resolution — 系統的中樞神經",
    bgGradient: "from-rose-600 to-pink-700",
    kpis: [
      { label: "[Critical] 待決策", value: `${critical}`,             sub: "立即處理",      tone: critical > 0 ? "bad" : "good" },
      { label: "Top Decisions",     value: `${decisions.length}`,      sub: "AI 推薦中",      tone: "info" },
      { label: "本月閉環",          value: "—",                        sub: "決策中心統計",   tone: "info" },
      { label: "AI 採用率",         value: "73%",                      sub: "目標 ≥80%",     tone: "warn" },
      { label: "案例庫",            value: "累積中",                   sub: "每張閉環自動寫入", tone: "info" },
      { label: "4 大 Engine",       value: "運轉中",                   sub: "Event / Twin / Predict / Time", tone: "good" },
    ],
    alerts: decisions.filter((d) => d.urgency === "now").slice(0, 3).map((d) => ({
      severity: "critical" as const,
      text: `[Critical] ${d.sourceLabel} ${d.contextLine.slice(0, 40)} — 建議 ${d.bestPlanTitle}`,
      href: d.sourceLink ?? "/erp/decisions",
    })),
    links: [
      { href: "/erp/decisions",          emoji: "🔁", label: "AI Recommendations",  desc: "決策閉環中心：副總拍板 → 5 階段執行", badge: critical > 0 ? `${critical} Critical` : undefined, badgeTone: "rose" },
      { href: "/erp/order-impact",       emoji: "⚡", label: "What-if / Simulation", desc: "訂單衝擊模擬器 30 秒推 3 方案" },
      { href: "/erp/simulator",          emoji: "🔮", label: "缺料模擬器",          desc: "「做 N 台」→ 缺料清單 + 船期判定" },
      { href: "/erp/global-map",         emoji: "🌍", label: "Scenario Planning",   desc: "5 大情境模擬（地震/紅海/匯率...）" },
      { href: "/erp/eta-forecast",       emoji: "🔮", label: "Risk Prediction",     desc: "每張 PO 準時機率 + 風險原因" },
      { href: "/erp/performance",        emoji: "📈", label: "決策績效 + 案例庫",   desc: "個人準確度 + 供應商評分 + 案例" },
      { href: "/erp/admin/engines",      emoji: "🧠", label: "4 大核心 Engine",     desc: "Event / Digital Twin / Prediction / Time Coordination" },
      { href: "/erp/admin/observability", emoji: "🔭", label: "Observability",      desc: "Event Trace / AI Explain / Data Lineage" },
    ],
  };
}

// ============================================================
// 統一入口
// ============================================================
export function getCenter(slug: CenterSlug): OperationsCenter {
  switch (slug) {
    case "supplier":      return supplierCenter();
    case "delivery":      return deliveryCenter();
    case "manufacturing": return manufacturingCenter();
    case "inventory":     return inventoryCenter();
    case "procurement":   return procurementCenter();
    case "decision":      return decisionCenter();
  }
}

export function allCenters(): OperationsCenter[] {
  return ["supplier", "delivery", "manufacturing", "inventory", "procurement", "decision"].map((s) => getCenter(s as CenterSlug));
}
