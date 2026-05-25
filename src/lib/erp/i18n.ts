// 多語系核心 — 繁中 / 簡中 / English / Tiếng Việt
// 系統名稱：供應鏈作戰系統 — Supply Chain War Room System

export type Lang = "zh-TW" | "zh-CN" | "en" | "vi";

export const LANGS: { code: Lang; label: string; emoji: string }[] = [
  { code: "zh-TW", label: "繁體中文",  emoji: "🇹🇼" },
  { code: "zh-CN", label: "简体中文",  emoji: "🇨🇳" },
  { code: "en",    label: "English",   emoji: "🇺🇸" },
  { code: "vi",    label: "Tiếng Việt", emoji: "🇻🇳" },
];

export type Dict = {
  // 系統品牌
  system_name: string;
  system_name_en: string;
  brand_short: string;
  brand_full: string;
  // L1 軍事指揮
  l1_title: string;
  l1_subtitle: string;
  l1_q1: string;  // 哪裡快爆了？
  l1_q2: string;  // 該先救哪裡？
  hot_zones: string;
  triage: string;
  situation_report: string;
  burning_now: string;
  // 6 Centers
  center_supplier: string;
  center_delivery: string;
  center_manufacturing: string;
  center_inventory: string;
  center_procurement: string;
  center_decision: string;
  // 5 Layers
  layer_1: string;
  layer_2: string;
  layer_3: string;
  layer_4: string;
  layer_5: string;
  layer_1_name: string;
  layer_2_name: string;
  layer_3_name: string;
  layer_4_name: string;
  layer_5_name: string;
  // 通用
  back: string;
  next: string;
  submit: string;
  cancel: string;
  confirm: string;
  loading: string;
  search: string;
  filter: string;
  export: string;
  print: string;
  pass: string;
  fail: string;
  pending: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  safe: string;
  warn: string;
  danger: string;
  // KPI 標籤
  kpi_otd: string;
  kpi_otif: string;
  kpi_eta: string;
  kpi_delay: string;
  kpi_doh: string;
  kpi_turnover: string;
  kpi_excess: string;
  kpi_aging: string;
  kpi_safety: string;
  // 風險類別
  risk_shortage: string;
  risk_delivery: string;
  risk_material: string;
  risk_quality: string;
  risk_supplier: string;
  // 動作
  view_details: string;
  open_full: string;
  start_workflow: string;
  acknowledge: string;
  resolve: string;
  escalate: string;
};

const ZH_TW: Dict = {
  system_name: "供應鏈作戰系統",
  system_name_en: "Supply Chain War Room System",
  brand_short: "祺驊 CHI HUA",
  brand_full: "祺驊 CHI HUA · 供應鏈作戰系統",
  l1_title: "🎯 軍事作戰指揮中心",
  l1_subtitle: "BOSS 視角：3 秒看公司現在是否安全",
  l1_q1: "哪裡快爆了？",
  l1_q2: "該先救哪裡？",
  hot_zones: "熱區（風險爆發點）",
  triage: "救援優先序",
  situation_report: "戰情快報 Sit Rep",
  burning_now: "正在燃燒",
  center_supplier: "供應商作戰",
  center_delivery: "交付指揮",
  center_manufacturing: "生產指揮塔",
  center_inventory: "庫存倉儲",
  center_procurement: "採購情報",
  center_decision: "AI 決策中心",
  layer_1: "Layer 1",
  layer_2: "Layer 2",
  layer_3: "Layer 3",
  layer_4: "Layer 4",
  layer_5: "Layer 5",
  layer_1_name: "Global Command Center（首頁）",
  layer_2_name: "Operational Centers（六大作戰中心）",
  layer_3_name: "Expert Workbench（專業工作台）",
  layer_4_name: "AI Engine Layer",
  layer_5_name: "Data / Event / Governance Layer",
  back: "返回", next: "下一步", submit: "送出", cancel: "取消", confirm: "確認",
  loading: "載入中…", search: "搜尋", filter: "篩選", export: "匯出", print: "列印",
  pass: "通過", fail: "失敗", pending: "處理中",
  critical: "緊急", high: "高", medium: "中", low: "低",
  safe: "安全", warn: "警示", danger: "危險",
  kpi_otd: "OTD 準交率", kpi_otif: "OTIF 準時+足量", kpi_eta: "ETA 預測",
  kpi_delay: "延誤工單", kpi_doh: "DOH 庫存可撐天數", kpi_turnover: "週轉率",
  kpi_excess: "過剩庫存", kpi_aging: "呆滯", kpi_safety: "安全庫存",
  risk_shortage: "缺料風險", risk_delivery: "準交風險", risk_material: "原料暴漲",
  risk_quality: "品質異常", risk_supplier: "供應商失控",
  view_details: "看詳細", open_full: "開啟完整工具",
  start_workflow: "啟動流程", acknowledge: "已知悉", resolve: "處理完成", escalate: "升級",
};

const ZH_CN: Dict = {
  ...ZH_TW,
  system_name: "供应链作战系统",
  brand_full: "祺骅 CHI HUA · 供应链作战系统",
  l1_title: "🎯 军事作战指挥中心",
  l1_subtitle: "BOSS 视角：3 秒看公司现在是否安全",
  l1_q1: "哪里快爆了？",
  l1_q2: "该先救哪里？",
  hot_zones: "热区（风险爆发点）",
  triage: "救援优先序",
  situation_report: "战情快报 Sit Rep",
  burning_now: "正在燃烧",
  center_supplier: "供应商作战",
  center_delivery: "交付指挥",
  center_manufacturing: "生产指挥塔",
  center_inventory: "库存仓储",
  center_procurement: "采购情报",
  center_decision: "AI 决策中心",
  layer_1_name: "Global Command Center（首页）",
  layer_2_name: "Operational Centers（六大作战中心）",
  layer_3_name: "Expert Workbench（专业工作台）",
  layer_4_name: "AI Engine Layer",
  layer_5_name: "Data / Event / Governance Layer",
  back: "返回", next: "下一步", submit: "送出", cancel: "取消", confirm: "确认",
  loading: "载入中…", search: "搜寻", filter: "筛选", export: "汇出", print: "列印",
  pass: "通过", fail: "失败", pending: "处理中",
  critical: "紧急", high: "高", medium: "中", low: "低",
  safe: "安全", warn: "警示", danger: "危险",
  kpi_otd: "OTD 准交率", kpi_otif: "OTIF 准时+足量", kpi_eta: "ETA 预测",
  kpi_delay: "延误工单", kpi_doh: "DOH 库存可撑天数", kpi_turnover: "周转率",
  kpi_excess: "过剩库存", kpi_aging: "呆滞", kpi_safety: "安全库存",
  risk_shortage: "缺料风险", risk_delivery: "准交风险", risk_material: "原料暴涨",
  risk_quality: "品质异常", risk_supplier: "供应商失控",
  view_details: "看详细", open_full: "开启完整工具",
  start_workflow: "启动流程", acknowledge: "已知悉", resolve: "处理完成", escalate: "升级",
};

const EN: Dict = {
  system_name: "Supply Chain War Room System",
  system_name_en: "Supply Chain War Room System",
  brand_short: "CHI HUA",
  brand_full: "CHI HUA · Supply Chain War Room System",
  l1_title: "🎯 Military Command Center",
  l1_subtitle: "BOSS view: see in 3 seconds whether the company is safe right now",
  l1_q1: "Where is burning?",
  l1_q2: "What should we save first?",
  hot_zones: "Hot Zones (where risks burst)",
  triage: "Triage Priority",
  situation_report: "Sit Rep — Situation Report",
  burning_now: "Burning Now",
  center_supplier: "Supplier Ops",
  center_delivery: "Delivery Control",
  center_manufacturing: "Manufacturing",
  center_inventory: "Inventory",
  center_procurement: "Procurement Intel",
  center_decision: "AI Decision",
  layer_1: "Layer 1", layer_2: "Layer 2", layer_3: "Layer 3", layer_4: "Layer 4", layer_5: "Layer 5",
  layer_1_name: "Global Command Center (Home)",
  layer_2_name: "Operational Centers (6 Centers)",
  layer_3_name: "Expert Workbench (32 tools)",
  layer_4_name: "AI Engine Layer",
  layer_5_name: "Data / Event / Governance Layer",
  back: "Back", next: "Next", submit: "Submit", cancel: "Cancel", confirm: "Confirm",
  loading: "Loading…", search: "Search", filter: "Filter", export: "Export", print: "Print",
  pass: "Pass", fail: "Fail", pending: "Pending",
  critical: "Critical", high: "High", medium: "Medium", low: "Low",
  safe: "Safe", warn: "Warning", danger: "Danger",
  kpi_otd: "OTD", kpi_otif: "OTIF (On Time In Full)", kpi_eta: "ETA Forecast",
  kpi_delay: "Delayed WOs", kpi_doh: "DOH (Days On Hand)", kpi_turnover: "Turnover",
  kpi_excess: "Excess Inventory", kpi_aging: "Aging", kpi_safety: "Safety Stock",
  risk_shortage: "Shortage Risk", risk_delivery: "Delivery Risk", risk_material: "Commodity Surge",
  risk_quality: "Quality Issues", risk_supplier: "Supplier Out of Control",
  view_details: "View Details", open_full: "Open Full Tool",
  start_workflow: "Start Workflow", acknowledge: "Acknowledge", resolve: "Resolve", escalate: "Escalate",
};

const VI: Dict = {
  system_name: "Hệ thống chỉ huy chuỗi cung ứng",
  system_name_en: "Supply Chain War Room System",
  brand_short: "CHI HUA",
  brand_full: "CHI HUA · Hệ thống chỉ huy chuỗi cung ứng",
  l1_title: "🎯 Trung tâm chỉ huy quân sự",
  l1_subtitle: "Góc nhìn BOSS: 3 giây để biết công ty có an toàn không",
  l1_q1: "Đâu đang cháy?",
  l1_q2: "Cứu cái nào trước?",
  hot_zones: "Vùng nóng (nơi rủi ro bùng phát)",
  triage: "Ưu tiên xử lý",
  situation_report: "Báo cáo tình hình Sit Rep",
  burning_now: "Đang cháy",
  center_supplier: "Tác chiến nhà cung cấp",
  center_delivery: "Điều phối giao hàng",
  center_manufacturing: "Tháp chỉ huy sản xuất",
  center_inventory: "Kho & Tồn kho",
  center_procurement: "Tình báo mua hàng",
  center_decision: "Trung tâm quyết định AI",
  layer_1: "Tầng 1", layer_2: "Tầng 2", layer_3: "Tầng 3", layer_4: "Tầng 4", layer_5: "Tầng 5",
  layer_1_name: "Trung tâm chỉ huy toàn cục (Trang chủ)",
  layer_2_name: "Các trung tâm tác chiến (6 trung tâm)",
  layer_3_name: "Bàn làm việc chuyên gia (32 công cụ)",
  layer_4_name: "Tầng AI Engine",
  layer_5_name: "Tầng Dữ liệu / Sự kiện / Quản trị",
  back: "Quay lại", next: "Tiếp", submit: "Gửi", cancel: "Hủy", confirm: "Xác nhận",
  loading: "Đang tải…", search: "Tìm kiếm", filter: "Lọc", export: "Xuất", print: "In",
  pass: "Đạt", fail: "Không đạt", pending: "Đang xử lý",
  critical: "Cực kỳ", high: "Cao", medium: "Trung bình", low: "Thấp",
  safe: "An toàn", warn: "Cảnh báo", danger: "Nguy hiểm",
  kpi_otd: "OTD Tỷ lệ giao đúng hẹn", kpi_otif: "OTIF Đúng hẹn + đủ lượng", kpi_eta: "Dự đoán ETA",
  kpi_delay: "Đơn trễ", kpi_doh: "DOH Số ngày tồn", kpi_turnover: "Vòng quay",
  kpi_excess: "Tồn dư", kpi_aging: "Tồn cũ", kpi_safety: "Tồn an toàn",
  risk_shortage: "Rủi ro thiếu hàng", risk_delivery: "Rủi ro giao trễ", risk_material: "Nguyên liệu tăng giá",
  risk_quality: "Sự cố chất lượng", risk_supplier: "Nhà cung mất kiểm soát",
  view_details: "Xem chi tiết", open_full: "Mở công cụ đầy đủ",
  start_workflow: "Bắt đầu", acknowledge: "Đã biết", resolve: "Xong", escalate: "Leo thang",
};

export const DICTS: Record<Lang, Dict> = {
  "zh-TW": ZH_TW,
  "zh-CN": ZH_CN,
  "en": EN,
  "vi": VI,
};

export function t(lang: Lang | undefined, key: keyof Dict): string {
  return DICTS[lang ?? "zh-TW"][key] ?? DICTS["zh-TW"][key];
}
