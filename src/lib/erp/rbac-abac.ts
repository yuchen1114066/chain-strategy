// RBAC + ABAC 權限控制架構 — 致命缺口 3 補上
//
// RBAC = Role-Based Access Control（角色決定權限，固定、簡單，一般 ERP 用）
// ABAC = Attribute-Based Access Control（情境條件動態決定權限，彈性高，大型 AI 平台用）
//
// 關鍵：供應商 A 不能看到供應商 B 的資料（這就是 ABAC：條件 = supplier_id 必須等於 user.supplier_id）

export type Role =
  | "buyer"        // 採購
  | "buyer_manager"// 採購主管
  | "supplier"     // 供應商業務（外部）
  | "warehouse"    // 倉管
  | "pmc"          // 生管 / PMC
  | "pm"           // PM
  | "qa"           // 品保 / SQE
  | "sales"        // 業務
  | "ceo"          // 副總 / 總經理
  | "admin";       // 系統管理員

export type ResourceScope =
  | "global"            // 全系統
  | "own_supplier"      // 只能看自家供應商資料
  | "asn_receiving"     // 只能看 ASN + 收貨相關
  | "wo_eta"            // 只能看工單 + ETA
  | "quality"           // 品質
  | "customers"         // 客戶
  | "negotiation"       // 議價 / 成本
  | "decisions"         // 決策閉環
  | "master_data";      // 主檔管理

export const ROLE_PERMS: Record<Role, { label: string; emoji: string; scopes: ResourceScope[]; description: string }> = {
  buyer: {
    label: "採購人員 Buyer",
    emoji: "🛒",
    scopes: ["own_supplier", "negotiation", "decisions", "asn_receiving"],
    description: "可看所有供應商的 PO / ASN / 議價資料；可建決策；可查品質卡",
  },
  buyer_manager: {
    label: "採購主管 Buyer Manager",
    emoji: "🛒⭐",
    scopes: ["own_supplier", "negotiation", "decisions", "asn_receiving", "quality"],
    description: "採購全權限 + 品質視角；接收所有 escalation push",
  },
  supplier: {
    label: "供應商業務 Supplier",
    emoji: "🏭",
    scopes: ["own_supplier"],  // 但 ABAC 條件：supplier_id == user.supplier_id
    description: "外部使用者；只能看到自家公司的 PO / ASN / 品質卡（ABAC 動態鎖定）",
  },
  warehouse: {
    label: "倉管 Warehouse",
    emoji: "📦",
    scopes: ["asn_receiving"],
    description: "可進行 7 階段收貨檢核 / QR 掃碼 / 入庫；只能看當前待收貨 PO 細節",
  },
  pmc: {
    label: "生管 PMC",
    emoji: "📋",
    scopes: ["wo_eta", "asn_receiving"],
    description: "工單追蹤 / Critical Path / ETA 預測；可看料件到貨狀態",
  },
  pm: {
    label: "PM",
    emoji: "📐",
    scopes: ["wo_eta", "asn_receiving", "decisions"],
    description: "工單管理 + 決策閉環追蹤；可建決策",
  },
  qa: {
    label: "品保 / SQE",
    emoji: "🔬",
    scopes: ["quality", "asn_receiving"],
    description: "進料品檢 / SPC 量測 / 異常處理；可寫品質報告",
  },
  sales: {
    label: "業務 Sales",
    emoji: "💼",
    scopes: ["customers", "wo_eta"],
    description: "客戶分析 + OTD 視角 + 自家負責客戶的工單進度",
  },
  ceo: {
    label: "副總 / 總經理 CEO",
    emoji: "🎯",
    scopes: ["global"],
    description: "全域唯讀（決策拍板權外）；公開化所有決策可見；不能改主檔",
  },
  admin: {
    label: "系統管理員 Admin",
    emoji: "⚙️",
    scopes: ["global", "master_data"],
    description: "全域寫權限；主檔管理 / 系統設定 / 權限管理",
  },
};

// ============================================================
// ABAC 條件：除了角色，還要看「上下文」
// ============================================================
export type AbacRule = {
  id: string;
  name: string;
  description: string;
  whenRole: Role[];
  condition: string;          // 文字描述（demo；正式版可實作為函式）
  effect: "allow" | "deny";
};

export const ABAC_RULES: AbacRule[] = [
  {
    id: "abac-1",
    name: "供應商只能看自家資料",
    description: "Supplier 角色 + 該資料的 supplier_id 必須等於使用者的 supplier_id",
    whenRole: ["supplier"],
    condition: "resource.supplier_id == user.supplier_id",
    effect: "allow",
  },
  {
    id: "abac-2",
    name: "供應商禁看其他供應商品質卡",
    description: "供應商試圖查看其他供應商品質卡 → 直接拒絕",
    whenRole: ["supplier"],
    condition: "resource.type == 'quality_card' AND resource.supplier_id != user.supplier_id",
    effect: "deny",
  },
  {
    id: "abac-3",
    name: "倉管收貨時段限制",
    description: "倉管僅在工作時段 (07:00-19:00) 可進行入庫動作；夜間入庫需主管簽核",
    whenRole: ["warehouse"],
    condition: "action == 'confirm_putaway' AND (hour(now) < 7 OR hour(now) >= 19)",
    effect: "deny",
  },
  {
    id: "abac-4",
    name: "業務只能看自己負責的客戶",
    description: "Sales 角色 + 該客戶的 account_owner 必須是該業務",
    whenRole: ["sales"],
    condition: "resource.type == 'customer' AND resource.account_owner == user.id",
    effect: "allow",
  },
  {
    id: "abac-5",
    name: "副總拍板必須留個人記錄（公開化）",
    description: "CEO 拍板任何決策必須寫入 decisionMaker 欄位",
    whenRole: ["ceo"],
    condition: "action == 'commit_decision' → must_set(decisionMaker = user.name)",
    effect: "allow",
  },
  {
    id: "abac-6",
    name: "議價會議資料僅議價成員可見",
    description: "Should-Cost 拆解 / 議價立場 → 限採購主管 + CEO 可見，採購人員需另外授權",
    whenRole: ["buyer"],
    condition: "resource.type == 'cost_breakdown' AND user.has_negotiation_clearance == false",
    effect: "deny",
  },
  {
    id: "abac-7",
    name: "PM 只能看自己負責的工單",
    description: "若公司有「責任 PM」制度 → PM 預設只看自己負責工單，全部工單需主管權限",
    whenRole: ["pm"],
    condition: "resource.type == 'work_order' AND resource.responsible_pm == user.id",
    effect: "allow",
  },
  {
    id: "abac-8",
    name: "主檔變更需審核",
    description: "管理員修改主檔（B 類變更）→ 自動產生審核任務給該模組主管",
    whenRole: ["admin"],
    condition: "action == 'update_master_data' → trigger_review_workflow",
    effect: "allow",
  },
];

// ============================================================
// RBAC vs ABAC 對照（給管理員看的）
// ============================================================
export const RBAC_VS_ABAC = [
  { aspect: "控制方式", rbac: "角色", abac: "條件" },
  { aspect: "判斷",     rbac: "固定", abac: "動態" },
  { aspect: "難度",     rbac: "簡單", abac: "高" },
  { aspect: "彈性",     rbac: "普通", abac: "非常高" },
  { aspect: "適合",     rbac: "一般 ERP", abac: "大型 AI 平台" },
  { aspect: "本系統用",  rbac: "✓ 第一層", abac: "✓ 第二層動態鎖定" },
];

// ============================================================
// 角色 × 模組 權限矩陣（給 demo / 文件用）
// ============================================================
export type AccessMatrix = {
  module: string;
  href: string;
  permissions: Partial<Record<Role, "RW" | "R" | "—">>;
};

export const ACCESS_MATRIX: AccessMatrix[] = [
  { module: "戰情室 (Decision Engine)",   href: "/erp",                         permissions: { ceo: "R", admin: "RW", buyer_manager: "R", pm: "R", buyer: "R", sales: "R" } },
  { module: "供應商協作入口",              href: "/erp/supplier-portal",         permissions: { ceo: "R", admin: "RW", buyer: "RW", buyer_manager: "RW", qa: "R" } },
  { module: "供應商提交入口（外部）",       href: "/erp/supplier-portal/vendor",  permissions: { supplier: "RW" /* ABAC: own_supplier_only */ } },
  { module: "供應商風險雷達",              href: "/erp/supplier-portal/audit",   permissions: { ceo: "R", admin: "RW", buyer_manager: "R", buyer: "R", qa: "R" } },
  { module: "訂單衝擊模擬器",              href: "/erp/order-impact",            permissions: { ceo: "RW", admin: "RW", buyer_manager: "RW", pm: "RW" } },
  { module: "決策閉環中心",                href: "/erp/decisions",               permissions: { ceo: "RW", admin: "RW", buyer_manager: "RW", pm: "RW", buyer: "R" } },
  { module: "決策績效 + 案例庫",           href: "/erp/performance",             permissions: { ceo: "R" /* 公開化 */, admin: "RW", buyer_manager: "R" } },
  { module: "缺料牆",                      href: "/erp/shortage-wall",           permissions: { ceo: "R", admin: "RW", buyer: "RW", buyer_manager: "RW", pm: "R", pmc: "R" } },
  { module: "工單追蹤 + Critical Path",    href: "/erp/work-orders",             permissions: { ceo: "R", admin: "RW", pm: "RW", pmc: "RW", sales: "R" } },
  { module: "WMS Dashboard",               href: "/erp/wms",                     permissions: { ceo: "R", admin: "RW", warehouse: "RW", pmc: "R" } },
  { module: "收貨 Checklist（7 階段）",    href: "/erp/wms/receiving",           permissions: { warehouse: "RW", qa: "RW" /* IQC 步驟 */, admin: "RW" } },
  { module: "軸心 SPC",                    href: "/erp/wms/spc-shaft",           permissions: { qa: "RW", admin: "RW", buyer_manager: "R", ceo: "R" } },
  { module: "AI 議價引擎",                  href: "/erp/negotiation",             permissions: { admin: "RW", buyer_manager: "RW", buyer: "R" /* ABAC: 需議價權限 */ } },
  { module: "Should-Cost 拆解",            href: "/erp/should-cost",             permissions: { admin: "RW", buyer_manager: "RW", buyer: "R" /* ABAC */, ceo: "R" } },
  { module: "原物料 AI 戰情室",            href: "/erp/materials",               permissions: { admin: "RW", buyer_manager: "R", buyer: "R", ceo: "R" } },
  { module: "AI ETA 預測引擎",             href: "/erp/eta-forecast",            permissions: { admin: "RW", pmc: "R", pm: "R", buyer_manager: "R", sales: "R", ceo: "R" } },
  { module: "全球供應鏈地圖",              href: "/erp/global-map",              permissions: { admin: "RW", ceo: "R", buyer_manager: "R" } },
  { module: "客戶分析",                    href: "/erp/customers",               permissions: { sales: "RW" /* ABAC: own customers */, ceo: "R", admin: "RW" } },
  { module: "主檔管理",                    href: "/erp/admin",                   permissions: { admin: "RW" } },
  { module: "系統設定",                    href: "/erp/admin/settings",          permissions: { admin: "RW", ceo: "R" } },
  { module: "QR Code 生成器",              href: "/erp/admin/qr-generator",      permissions: { admin: "RW", warehouse: "RW" /* 列印標籤用 */ } },
];

// RW = Read+Write, R = Read only, — = 無權限
