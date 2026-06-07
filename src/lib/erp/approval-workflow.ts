// Approval Workflow — 缺口 4：權限 ≠ 批准
//
// RBAC + ABAC 解決「能否看見/操作」
// Approval Workflow 解決「是否需要更高層簽核」
// → 改 PO → Buyer Manager 批
// → 改成本 → Director 批
// → Override IQC NG → QA Manager 批
// → 緊急放行 → VP 批

import type { Role } from "./rbac-abac";

export type ApprovalAction =
  | "edit_po"               // 改 PO（價、量、交期）
  | "edit_cost"             // 改成本拆解 / Should-Cost 模型
  | "override_iqc_ng"       // Override 進料 NG（強制放行）
  | "emergency_release"     // 緊急放行（不需完成全部 7 階段檢核）
  | "edit_bom"              // 改 BOM（ECN）
  | "edit_supplier_price"   // 改供應商單價（議價結果）
  | "override_radar"        // Override 風險雷達評等
  | "delete_master_data"    // 刪除主檔（供應商、料件、客戶）
  | "manual_putaway"        // 跳過 SPC 直接入庫
  | "skip_asn"              // 跳過 ASN 直接收貨
  | "override_credit"       // 客戶信用額度 override（業務）
  | "edit_setting";         // 改系統設定（閾值/容差）

export type ApprovalRule = {
  action: ApprovalAction;
  label: string;
  approvalLevel: Role[];          // 至少哪些角色可以批准
  requesterRoles: Role[];          // 誰可以提請求
  requireDualSign?: boolean;       // 需要雙簽
  threshold?: string;              // 觸發批准的條件
  blastRadius: string;             // 影響範圍
  auditRequired: boolean;          // 是否強制留 audit
};

export const APPROVAL_RULES: ApprovalRule[] = [
  { action: "edit_po", label: "改 PO（價/量/交期）",
    approvalLevel: ["buyer_manager"], requesterRoles: ["buyer"],
    threshold: "金額變動 > 5% 或交期延 ≥ 7 天", blastRadius: "供應商承諾 + 鼎新單據",
    auditRequired: true },

  { action: "edit_cost", label: "改 Should-Cost 拆解模型",
    approvalLevel: ["ceo"], requesterRoles: ["buyer_manager", "admin"],
    threshold: "任何結構調整", blastRadius: "全議價引擎 / 漲價合理性 AI",
    auditRequired: true },

  { action: "override_iqc_ng", label: "Override 進料 IQC NG（強制放行）",
    approvalLevel: ["qa"], requesterRoles: ["buyer_manager", "pm"], requireDualSign: true,
    threshold: "不良率 ≤ 5% 且有客戶豁免函", blastRadius: "客戶可能收到不良品",
    auditRequired: true },

  { action: "emergency_release", label: "緊急放行（跳過收貨檢核）",
    approvalLevel: ["ceo"], requesterRoles: ["pm", "buyer_manager"], requireDualSign: true,
    threshold: "停線損失 ≥ 100 萬 / 客戶違約金 ≥ 50 萬",
    blastRadius: "風險全擔（含品質+合規）",
    auditRequired: true },

  { action: "edit_bom", label: "改 BOM 結構（ECN）",
    approvalLevel: ["buyer_manager"], requesterRoles: ["pm", "admin"],
    threshold: "新 ECN 改 ≥ 2 個料件", blastRadius: "缺料牆 + 訂單衝擊 + 工單",
    auditRequired: true },

  { action: "edit_supplier_price", label: "改供應商單價",
    approvalLevel: ["buyer_manager"], requesterRoles: ["buyer"],
    threshold: "漲幅 > 3% 或降幅 > 5%", blastRadius: "成本 + 議價基準",
    auditRequired: true },

  { action: "override_radar", label: "Override 供應商風險雷達",
    approvalLevel: ["ceo"], requesterRoles: ["buyer_manager"],
    threshold: "強制升級或降級供應商等級", blastRadius: "未來議價 + 加單決策",
    auditRequired: true },

  { action: "delete_master_data", label: "刪除主檔",
    approvalLevel: ["admin"], requesterRoles: ["buyer_manager"], requireDualSign: true,
    threshold: "任何刪除", blastRadius: "歷史資料完整性",
    auditRequired: true },

  { action: "manual_putaway", label: "跳過 SPC 直接入庫",
    approvalLevel: ["qa"], requesterRoles: ["warehouse"],
    threshold: "SPC 量測異常但有 QA 工程師判定", blastRadius: "品質保證鏈",
    auditRequired: true },

  { action: "skip_asn", label: "跳過 ASN 直接收貨",
    approvalLevel: ["buyer_manager"], requesterRoles: ["warehouse"],
    threshold: "供應商系統故障", blastRadius: "Risk Radar baseline",
    auditRequired: true },

  { action: "override_credit", label: "客戶信用額度 Override",
    approvalLevel: ["ceo"], requesterRoles: ["sales"], requireDualSign: true,
    threshold: "超出信用額度任何金額", blastRadius: "應收呆帳風險",
    auditRequired: true },

  { action: "edit_setting", label: "改系統設定（閾值/容差）",
    approvalLevel: ["ceo"], requesterRoles: ["admin"],
    threshold: "任何閾值變更", blastRadius: "全系統判定邏輯（包含歷史趨勢）",
    auditRequired: true },
];

export type ApprovalRequest = {
  id: string;
  action: ApprovalAction;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "auto_approved";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
};

// Demo seed
export function recentApprovals(): ApprovalRequest[] {
  return [
    { id: "appr-001", action: "edit_po", requestedBy: "採購 小王", requestedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
      reason: "供應商鈦泰申請延期 7 天（紅海危機影響）",
      payload: { poNo: "PO-2026-0504", originalDate: "2026-06-25", newDate: "2026-07-02" },
      status: "pending" },
    { id: "appr-002", action: "override_iqc_ng", requestedBy: "PM 老陳", requestedAt: new Date(Date.now() - 12 * 3600_000).toISOString(),
      reason: "雙成腳踏板不良 14.7%，但客戶 LIFE 同意此批降規收貨",
      payload: { poNo: "PO-2026-0512", defectRate: 14.7, customerWaiver: "LIFE-2026-W023" },
      status: "rejected", approvedBy: "品保主管", approvedAt: new Date(Date.now() - 10 * 3600_000).toISOString(),
      rejectionReason: "不良率超過 10%，建議退貨" },
    { id: "appr-003", action: "emergency_release", requestedBy: "PM 老陳", requestedAt: new Date(Date.now() - 36 * 3600_000).toISOString(),
      reason: "WO-2026-0103 LIFE 客戶船期將逾期，停線損失 240 萬",
      payload: { woNo: "WO-2026-0103", estimatedLoss: 2_400_000 },
      status: "approved", approvedBy: "副總（peko）", approvedAt: new Date(Date.now() - 35 * 3600_000).toISOString() },
    { id: "appr-004", action: "edit_setting", requestedBy: "系統管理員", requestedAt: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
      reason: "重量容差從 ±2% 調整到 ±3%（鋁件包材變更）",
      payload: { setting: "WEIGHT_TOLERANCE_PCT", oldValue: "2%", newValue: "3%" },
      status: "approved", approvedBy: "副總（peko）", approvedAt: new Date(Date.now() - 6 * 24 * 3600_000).toISOString() },
  ];
}
