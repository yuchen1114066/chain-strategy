// L3 專業工作台 — 第三層真正操作頁
//
// URL 結構：/os/{center}/{tool}
//   /os/supplier/portal       Supplier Portal
//   /os/supplier/asn          ASN Monitor
//   /os/supplier/risk         Supplier Risk Radar
//   /os/supplier/scorecard    Supplier Scorecard
//   /os/supplier/timeline     Supplier Timeline
//   /os/procurement/commodity Commodity War Room
//   /os/procurement/should-cost  Should Cost
//   /os/procurement/negotiation  AI Negotiation
//   /os/procurement/rfq       RFQ Intelligence
//   /os/manufacturing/work-orders   WO Tracker
//   /os/manufacturing/bottleneck    Bottleneck Radar
//   /os/manufacturing/capacity      Capacity Forecast
//   ...

import type { CenterSlug } from "./operations-centers";

export type WorkbenchSlug = string;

export type WorkbenchDef = {
  center: CenterSlug;
  slug: WorkbenchSlug;
  emoji: string;
  title: string;
  titleEn: string;
  role: string;                  // 工作台用途
  // 主要操作（4-6 個）
  primaryActions: { label: string; emoji: string; href: string; desc: string }[];
  // 連到「完整工具」的 deep link（如果有現成大頁）
  fullToolHref?: string;
  fullToolLabel?: string;
};

// ============================================================
// Supplier Operations Center 5 工作台
// ============================================================
const supplierBenches: WorkbenchDef[] = [
  {
    center: "supplier", slug: "portal",
    emoji: "🤝", title: "Supplier Portal", titleEn: "供應商協作入口",
    role: "供應商業務在這裡確認 PO、提交 ASN、更新生產進度、看品質回饋。內部採購在這裡看 4 模組總覽。",
    fullToolHref: "/erp/supplier-portal", fullToolLabel: "開啟完整供應商協作入口",
    primaryActions: [
      { label: "看 4 模組 KPI",      emoji: "📊", href: "/erp/supplier-portal",        desc: "PO/ASN/狀態/品質 4 模組 + Digital Twin" },
      { label: "供應商提交入口",     emoji: "🌐", href: "/erp/supplier-portal/vendor", desc: "外部供應商業務的 4-step lock-in flow" },
      { label: "新增 PO（採購端）",  emoji: "📋", href: "/erp/po-generator",           desc: "缺料 → 自動分組生成 PO" },
      { label: "QR 標籤生成",        emoji: "📱", href: "/erp/admin/qr-generator",     desc: "PO/箱/Lot QR 批次列印" },
    ],
  },
  {
    center: "supplier", slug: "asn",
    emoji: "🚚", title: "ASN Monitor", titleEn: "出貨通知監控",
    role: "預防性檢測：供應商是否在預定時間填 ASN，沒填 = 副總提前 48hr 知道延誤。",
    fullToolHref: "/erp/supplier-portal",
    fullToolLabel: "開啟供應商協作入口（含 ASN 模組）",
    primaryActions: [
      { label: "看缺 ASN 警示",     emoji: "🚨", href: "/erp/supplier-portal",  desc: "已逾預定出貨日仍無 ASN" },
      { label: "看 AI 預警前兆",    emoji: "🧬", href: "/erp/supplier-portal",  desc: "Twin baseline 偏離信號" },
      { label: "進決策閉環處理",     emoji: "🔁", href: "/erp/decisions",        desc: "若 ASN 已逾 → 自動建立決策" },
    ],
  },
  {
    center: "supplier", slug: "risk",
    emoji: "🛰", title: "Supplier Risk Radar", titleEn: "供應商風險雷達",
    role: "5 維加權模型（Reliability/Delivery/Quality/Cost/Risk）+ 動量偵測 + 議價立場 AI 拿話。",
    fullToolHref: "/erp/supplier-portal/audit", fullToolLabel: "開啟完整風險雷達",
    primaryActions: [
      { label: "查單一廠商",         emoji: "🔍", href: "/erp/supplier-portal/audit", desc: "輸入廠商代號 / 簡稱 / PO 號" },
      { label: "看所有 PO 履歷",     emoji: "📋", href: "/erp/supplier-portal",       desc: "完整出貨追蹤履歷" },
      { label: "鉞泰軸心 SPC",       emoji: "🎯", href: "/erp/wms/spc-shaft",          desc: "Cpk 趨勢 + 跨批比對" },
    ],
  },
  {
    center: "supplier", slug: "scorecard",
    emoji: "📋", title: "Supplier Scorecard", titleEn: "供應商評分卡",
    role: "緊急應急能力評分（A/B/C/D 級）— 哪些廠商說加急真能配合、哪些嘴上答應做不到。下次選方案 AI 自動帶入。",
    fullToolHref: "/erp/performance", fullToolLabel: "開啟決策績效 + 案例庫",
    primaryActions: [
      { label: "看供應商評分總覽",    emoji: "📊", href: "/erp/performance",            desc: "A/B/C/D 級 + 可靠度趨勢" },
      { label: "個人決策準確度",      emoji: "🎯", href: "/erp/performance",            desc: "公開化績效，誰拍板 / 結果如何" },
      { label: "供應商主檔",          emoji: "🏭", href: "/erp/suppliers",              desc: "40 家供應商 CSV" },
    ],
  },
  {
    center: "supplier", slug: "timeline",
    emoji: "🧬", title: "Supplier Timeline", titleEn: "供應商時間軸",
    role: "Digital Twin baseline — 每家廠商各階段平均耗時 + 標準差，是議價硬數據。",
    fullToolHref: "/erp/supplier-portal",
    primaryActions: [
      { label: "看 Digital Twin",     emoji: "🧬", href: "/erp/supplier-portal",   desc: "5 階段 baseline（含變異）" },
      { label: "比對歷史 Cpk 趨勢",   emoji: "📈", href: "/erp/wms/spc-shaft",      desc: "跨批趨勢 ↑ → ↓ 標記" },
      { label: "案例庫",              emoji: "🧠", href: "/erp/performance",        desc: "歷史相似情境查詢" },
    ],
  },
];

// ============================================================
// Procurement Intelligence Center 4 工作台
// ============================================================
const procurementBenches: WorkbenchDef[] = [
  {
    center: "procurement", slug: "commodity",
    emoji: "🌐", title: "Commodity War Room", titleEn: "原物料戰情室",
    role: "銅/鋁/鋼/塑料/稀土/IC 6 大原物料 SPC 管制 + AI 4 區判斷 + 採購建議推理鏈。",
    fullToolHref: "/erp/materials", fullToolLabel: "開啟完整原物料 AI 戰情室",
    primaryActions: [
      { label: "看 6 大行情 + 4 區判斷", emoji: "🌐", href: "/erp/materials",   desc: "低檔/危險/追高/囤貨/觀望" },
      { label: "全球地圖 + 5 情境模擬",  emoji: "🌍", href: "/erp/global-map", desc: "地震/紅海/匯率/限電/封城" },
    ],
  },
  {
    center: "procurement", slug: "should-cost",
    emoji: "💎", title: "Should Cost", titleEn: "成本拆解模型",
    role: "AI 漲價合理性判斷：對方喊漲 X% → 對照各成分波動 → 合理區間 + 議價會議拿話清單。",
    fullToolHref: "/erp/should-cost", fullToolLabel: "開啟 Should-Cost 拆解",
    primaryActions: [
      { label: "計算漲價合理性",        emoji: "💎", href: "/erp/should-cost",   desc: "19 種類別 × 6 成分結構" },
      { label: "AI 議價引擎",           emoji: "🤝", href: "/erp/negotiation",   desc: "6 維分析 + 議價策略" },
    ],
  },
  {
    center: "procurement", slug: "negotiation",
    emoji: "🤝", title: "AI Negotiation", titleEn: "AI 議價引擎",
    role: "歷史成交 / 國際行情 / 匯率 / 毛利估算 / 缺料熱度 / 競爭供應商 — 6 維分析 + STRONG/LOCK/NORMAL 策略。",
    fullToolHref: "/erp/negotiation",
    primaryActions: [
      { label: "看議價清單 + 策略",    emoji: "📊", href: "/erp/negotiation",  desc: "依潛在效益排序" },
      { label: "Should-Cost 對照",      emoji: "💎", href: "/erp/should-cost",  desc: "AI 漲價判斷" },
      { label: "供應商評分基準",        emoji: "📋", href: "/erp/supplier-portal/audit", desc: "議價立場拿話" },
    ],
  },
  {
    center: "procurement", slug: "rfq",
    emoji: "📤", title: "RFQ Intelligence", titleEn: "詢價情報",
    role: "新一輪詢價 / 比價 / 開標。整合 Should-Cost、行情、供應商評分，AI 自動篩出最佳 3 家廠商。",
    primaryActions: [
      { label: "建立新一輪 RFQ（規劃中）", emoji: "📤", href: "/os/procurement",   desc: "v1.1 上線 — 整合 Should-Cost + 行情" },
      { label: "供應商評分基準",            emoji: "📋", href: "/erp/supplier-portal/audit", desc: "AI 推薦投標廠商" },
      { label: "原物料 4 區判斷",          emoji: "🌐", href: "/erp/materials",    desc: "決定是否囤貨 vs 縮短週期" },
    ],
  },
];

// ============================================================
// Manufacturing Control Tower 5 工作台
// ============================================================
const manufacturingBenches: WorkbenchDef[] = [
  {
    center: "manufacturing", slug: "work-orders",
    emoji: "📋", title: "WO Tracker", titleEn: "工單追蹤",
    role: "8 階段 Gantt + Critical Path（哪個工序 delay 直接影響出貨）+ 紅黃燈統計。",
    fullToolHref: "/erp/work-orders", fullToolLabel: "開啟完整工單追蹤",
    primaryActions: [
      { label: "看 8 階段 + Critical Path", emoji: "📋", href: "/erp/work-orders",  desc: "工單列表 + 視覺化" },
      { label: "客戶交期燈號",              emoji: "🚦", href: "/erp",              desc: "戰情室紅黃綠燈" },
      { label: "ETA 預測",                  emoji: "🔮", href: "/erp/eta-forecast",  desc: "每張在途 PO 準時機率" },
    ],
  },
  {
    center: "manufacturing", slug: "bottleneck",
    emoji: "⚙️", title: "Bottleneck Radar", titleEn: "瓶頸雷達",
    role: "7 台關鍵設備稼動率（CNC #1/2/3、IQC、測試台、包裝線、烘烤爐）+ AI 14 天塞車預測。",
    fullToolHref: "/erp/work-orders",
    primaryActions: [
      { label: "看 7 台設備稼動率",         emoji: "⚙️", href: "/erp/work-orders",  desc: "≥92% AI 判定塞車風險高" },
      { label: "流程綜觀 + 瓶頸顧問",        emoji: "🌊", href: "/erp/flow",         desc: "客戶下單→出貨整鏈" },
      { label: "委外加工分流",              emoji: "🏭", href: "/erp/outsource",     desc: "電鍍/烤漆在外量 + 逾期" },
    ],
  },
  {
    center: "manufacturing", slug: "capacity",
    emoji: "📅", title: "Capacity Forecast", titleEn: "產能預測",
    role: "未來 14/30 天產能需求 vs 可用人天 → 哪天會撞牆，提前協調加班/分流/外包。",
    fullToolHref: "/erp/calendar",
    primaryActions: [
      { label: "排程日曆",                   emoji: "📅", href: "/erp/calendar",        desc: "Gantt 時間軸 + 月曆" },
      { label: "訂單衝擊模擬器",             emoji: "⚡", href: "/erp/order-impact",    desc: "新單擠進來會擠掉誰" },
      { label: "瓶頸雷達",                   emoji: "⚙️", href: "/os/manufacturing/bottleneck", desc: "目前哪台設備吃緊" },
    ],
  },
  {
    center: "manufacturing", slug: "flow",
    emoji: "🌊", title: "Flow Overview", titleEn: "流程綜觀",
    role: "客戶下需求 → 算料 → 採購 → 進貨 → 生產 → 出貨 整鏈視覺化 + AI 瓶頸顧問。",
    fullToolHref: "/erp/flow",
    primaryActions: [
      { label: "端到端流程圖",               emoji: "🌊", href: "/erp/flow",            desc: "8 階段 + 瓶頸顧問" },
      { label: "AI 卡點解方",                emoji: "🤖", href: "/erp",                 desc: "戰情室 AI Decision Queue" },
    ],
  },
  {
    center: "manufacturing", slug: "bom",
    emoji: "🏗", title: "BOM Workbench", titleEn: "BOM 工作台",
    role: "型號主檔 + 多階 BOM 樹 + 成本 rollup + BOM 對照比對。",
    fullToolHref: "/erp/models",
    primaryActions: [
      { label: "型號 + 多階 BOM",            emoji: "🏗", href: "/erp/models",         desc: "成品卡 + 樹狀展開 + 成本" },
      { label: "BOM 對照",                   emoji: "🔍", href: "/erp/bom-compare",    desc: "兩成品 BOM 並排比對" },
      { label: "零件主檔",                   emoji: "🔩", href: "/erp/parts",          desc: "119 料件 CSV" },
    ],
  },
];

// ============================================================
// Inventory & Warehouse Center 6 工作台
// ============================================================
const inventoryBenches: WorkbenchDef[] = [
  {
    center: "inventory", slug: "health",
    emoji: "💚", title: "Inventory Health", titleEn: "庫存健康度",
    role: "5 大 KPI：DOH / Turnover / Excess / Aging / Safety Stock — 即時健康度 + 異常清單。",
    fullToolHref: "/erp/wms",
    primaryActions: [
      { label: "WMS Dashboard",              emoji: "⚡", href: "/erp/wms",           desc: "CHI HUA Pulse v2 + 5 KPI" },
      { label: "ABC 分析",                   emoji: "📊", href: "/erp/analytics",     desc: "共用零件 / ABC / 集中度" },
      { label: "呆料預警",                   emoji: "🗑", href: "/erp/dead-stock",    desc: "呆滯料 + 週轉率" },
    ],
  },
  {
    center: "inventory", slug: "receiving",
    emoji: "📥", title: "Receiving Workbench", titleEn: "收貨工作台",
    role: "7 階段風控架構（必過才入庫）：掃描/外箱/重量/開箱/數量/IQC/系統判定。",
    fullToolHref: "/erp/wms/receiving",
    primaryActions: [
      { label: "進收貨 Checklist",           emoji: "📥", href: "/erp/wms/receiving",  desc: "7 階段風控、必過才入庫" },
      { label: "軸心 SPC（鉞泰）",           emoji: "🎯", href: "/erp/wms/spc-shaft",  desc: "Cpk 量測 + OOS 自動標紅" },
      { label: "QR 標籤生成",                emoji: "📱", href: "/erp/admin/qr-generator", desc: "PO/箱/Lot QR" },
    ],
  },
  {
    center: "inventory", slug: "shortage",
    emoji: "🧱", title: "Shortage Wall", titleEn: "缺料牆",
    role: "S/A/B/C 風險分級 + AI 三方案（空運/替代料/排程協調）+ 一鍵生成追料 PO。",
    fullToolHref: "/erp/shortage-wall",
    primaryActions: [
      { label: "看 S/A/B/C 缺料分級",        emoji: "🧱", href: "/erp/shortage-wall", desc: "AI 三方案 + 推薦最佳" },
      { label: "缺料模擬器",                 emoji: "🔮", href: "/erp/simulator",     desc: "「做 N 台」→ 缺料清單" },
      { label: "再下單時點",                 emoji: "📦", href: "/erp/reorder",       desc: "ROP + 四級警示" },
    ],
  },
  {
    center: "inventory", slug: "doh",
    emoji: "📏", title: "DOH Tracker", titleEn: "DOH 庫存天數追蹤",
    role: "每料件可撐天數 + 趨勢圖 + DOH < 7 即時警示。",
    fullToolHref: "/erp/wms",
    primaryActions: [
      { label: "WMS 庫存健康度",             emoji: "⚡", href: "/erp/wms",          desc: "DOH 中位數 + 風險件數" },
      { label: "再下單時點",                 emoji: "📦", href: "/erp/reorder",      desc: "ROP 計算" },
    ],
  },
  {
    center: "inventory", slug: "dead-stock",
    emoji: "🗑", title: "Dead Stock", titleEn: "呆料管理",
    role: "Aging > 180 天料件 + 庫存週轉率 + 處置建議（降價/退料/報廢）。",
    fullToolHref: "/erp/dead-stock",
    primaryActions: [
      { label: "呆料清單",                   emoji: "🗑", href: "/erp/dead-stock",    desc: "依金額排序" },
      { label: "零件分析（ABC）",            emoji: "📊", href: "/erp/analytics",     desc: "找出哪些料件呆滯" },
    ],
  },
  {
    center: "inventory", slug: "safety",
    emoji: "🛡", title: "Safety Stock", titleEn: "安全庫存",
    role: "依供應商交期 × 變異 × 服務水準計算建議安全庫存。",
    primaryActions: [
      { label: "WMS 安全庫存達成率",          emoji: "⚡", href: "/erp/wms",          desc: "Safety Stock Compliance" },
      { label: "零件主檔（安全庫存欄）",      emoji: "🔩", href: "/erp/parts",        desc: "可 CSV 匯出後批次調整" },
    ],
  },
];

// ============================================================
// Delivery Control Center 6 工作台
// ============================================================
const deliveryBenches: WorkbenchDef[] = [
  {
    center: "delivery", slug: "otd",
    emoji: "📊", title: "OTD / OTIF", titleEn: "OTD / OTIF KPI",
    role: "歷史準時率 + 預測準時率 + 客戶分析。",
    fullToolHref: "/erp",
    primaryActions: [
      { label: "戰情室 OTIF 區",              emoji: "🎯", href: "/erp",            desc: "歷史 + 預測 + 責任供應商" },
      { label: "客戶分析",                    emoji: "👥", href: "/erp/customers",   desc: "客戶 OTD / 營收 / 在製管線" },
    ],
  },
  {
    center: "delivery", slug: "eta",
    emoji: "🔮", title: "ETA Forecast", titleEn: "ETA 預測引擎",
    role: "每張在途 PO 準時到貨機率（5-99%）+ 風險原因 + AI 具體建議。",
    fullToolHref: "/erp/eta-forecast",
    primaryActions: [
      { label: "看所有 PO 預測",              emoji: "🔮", href: "/erp/eta-forecast",  desc: "機率排序 + 風險信號" },
      { label: "Critical Path 追蹤",          emoji: "🎯", href: "/erp/work-orders",   desc: "工單延誤連動 ETA" },
    ],
  },
  {
    center: "delivery", slug: "delay",
    emoji: "⏰", title: "Delay Prediction", titleEn: "延誤預測",
    role: "OTIF/OTD forecast 紅黃綠燈 + 責任歸因（供應商 / 瓶頸 / 產能 / 物料）。",
    fullToolHref: "/erp",
    primaryActions: [
      { label: "戰情室客戶交期燈號",          emoji: "🚦", href: "/erp",             desc: "AI 預測出貨日 vs 客戶要求" },
      { label: "缺料牆 S/A 級",              emoji: "🧱", href: "/erp/shortage-wall", desc: "可能造成延誤的關鍵料" },
    ],
  },
  {
    center: "delivery", slug: "critical",
    emoji: "🚨", title: "Critical Orders", titleEn: "關鍵訂單",
    role: "緊急 / 重要客戶 / 高違約金訂單 — 優先級看板。",
    primaryActions: [
      { label: "戰情室 Decision Queue",       emoji: "🤖", href: "/erp",              desc: "[Critical] / [Today] 待決策" },
      { label: "決策閉環中心",                emoji: "🔁", href: "/erp/decisions",    desc: "副總拍板 + 執行追蹤" },
    ],
  },
  {
    center: "delivery", slug: "customer-risk",
    emoji: "👥", title: "Customer Risk", titleEn: "客戶風險",
    role: "哪些客戶可能因為我們延誤而流失 / 高違約金 / 信用警示。",
    fullToolHref: "/erp/customers",
    primaryActions: [
      { label: "客戶分析",                    emoji: "👥", href: "/erp/customers",     desc: "OTD / 營收 / 在製" },
      { label: "客戶交期燈號",                emoji: "🚦", href: "/erp",               desc: "戰情室 AI 預測表" },
    ],
  },
  {
    center: "delivery", slug: "schedule",
    emoji: "📅", title: "Delivery Schedule", titleEn: "出貨排程",
    role: "未來 30 天出貨日曆 + Gantt + 倉庫排程協調。",
    fullToolHref: "/erp/calendar",
    primaryActions: [
      { label: "排程日曆",                    emoji: "📅", href: "/erp/calendar",      desc: "Gantt + 月曆視圖" },
      { label: "WMS 出貨槽位",                emoji: "⚡", href: "/erp/wms",           desc: "倉庫熱力 + 排程" },
    ],
  },
];

// ============================================================
// AI Decision Center 6 工作台（全系統大腦）
// ============================================================
const decisionBenches: WorkbenchDef[] = [
  {
    center: "decision", slug: "queue",
    emoji: "🤖", title: "AI Recommendations", titleEn: "AI 決策佇列",
    role: "AI 直接給：[Critical] / [Today] / [This Week] 各等級的具體建議 + 成本 + 影響金額。",
    fullToolHref: "/erp",
    primaryActions: [
      { label: "戰情室 Decision Queue",       emoji: "🎯", href: "/erp",              desc: "Top 5 緊急決策" },
      { label: "決策閉環中心",                emoji: "🔁", href: "/erp/decisions",    desc: "5 階段執行追蹤" },
    ],
  },
  {
    center: "decision", slug: "simulation",
    emoji: "⚡", title: "Order Impact Simulation", titleEn: "訂單衝擊模擬",
    role: "客戶緊急拉單時 30 秒推 3 方案：加急採購 / 延後低毛利 / 回客戶最早日。",
    fullToolHref: "/erp/order-impact",
    primaryActions: [
      { label: "訂單衝擊模擬器",              emoji: "⚡", href: "/erp/order-impact",  desc: "30 秒 3 方案推副總" },
      { label: "缺料模擬器",                  emoji: "🔮", href: "/erp/simulator",     desc: "「做 N 台」缺料判斷" },
    ],
  },
  {
    center: "decision", slug: "what-if",
    emoji: "🎲", title: "What-if Analysis", titleEn: "假設分析",
    role: "假如紅海危機持續 30 天 / 假如美元升 5% / 假如供應商 A 延遲 → 影響範圍立刻算出。",
    fullToolHref: "/erp/global-map",
    primaryActions: [
      { label: "全球供應鏈地圖",              emoji: "🌍", href: "/erp/global-map",   desc: "5 大情境一鍵模擬" },
      { label: "What-if 訂單衝擊",            emoji: "⚡", href: "/erp/order-impact", desc: "急單情境模擬" },
    ],
  },
  {
    center: "decision", slug: "scenario",
    emoji: "🌍", title: "Scenario Planning", titleEn: "情境規劃",
    role: "長期情境：客戶需求暴增 30% / 主供應商倒閉 / 主要原料漲價 50% — 影響評估 + 應對策略。",
    fullToolHref: "/erp/global-map",
    primaryActions: [
      { label: "5 大情境模擬",                emoji: "🌍", href: "/erp/global-map",    desc: "地震/紅海/匯率/限電/封城" },
      { label: "缺料模擬器",                  emoji: "🔮", href: "/erp/simulator",     desc: "做 N 台缺料分析" },
    ],
  },
  {
    center: "decision", slug: "risk",
    emoji: "🔮", title: "Risk Prediction", titleEn: "風險預測",
    role: "6 維預測：ETA / Delay / Cost / Demand / Capacity / Supplier Risk — 全系統大腦。",
    fullToolHref: "/erp/admin/engines",
    primaryActions: [
      { label: "4 大核心 Engine",             emoji: "🧠", href: "/erp/admin/engines",      desc: "Event / Twin / Prediction / Time" },
      { label: "Observability 五合一",        emoji: "🔭", href: "/erp/admin/observability",desc: "Trace / Explain / Lineage" },
    ],
  },
  {
    center: "decision", slug: "auto",
    emoji: "♻️", title: "Auto Resolution", titleEn: "自動處置",
    role: "5 階段閉環機制：拍板 → 派工 → 追蹤 → 績效 → 案例庫。失敗自動 escalate。",
    fullToolHref: "/erp/decisions",
    primaryActions: [
      { label: "決策閉環中心",                emoji: "🔁", href: "/erp/decisions",          desc: "5 階段機制 + 公開化 + 升級" },
      { label: "績效 + 案例庫",                emoji: "📈", href: "/erp/performance",       desc: "個人準確度 + 供應商評分" },
      { label: "Event Engine",                emoji: "⚡", href: "/erp/admin/event-engine", desc: "Fan-out 路由 + 通知策略" },
    ],
  },
];

// ============================================================
// 全部工作台
// ============================================================
export const ALL_WORKBENCHES: WorkbenchDef[] = [
  ...supplierBenches,
  ...procurementBenches,
  ...manufacturingBenches,
  ...inventoryBenches,
  ...deliveryBenches,
  ...decisionBenches,
];

export function findWorkbench(center: CenterSlug, slug: WorkbenchSlug): WorkbenchDef | null {
  return ALL_WORKBENCHES.find((w) => w.center === center && w.slug === slug) ?? null;
}

export function workbenchesOf(center: CenterSlug): WorkbenchDef[] {
  return ALL_WORKBENCHES.filter((w) => w.center === center);
}
