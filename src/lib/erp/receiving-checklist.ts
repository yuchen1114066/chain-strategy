// WMS 收貨風險控管總架構 — 7 階段（依使用者藍圖）
//
// 供應商出貨後 ASN（pre-arrival）：PO / 箱數 / 出貨重量 / 箱號清單 / QR/Barcode
//
// 到貨後 Receiving Dock：
//   Step 1 掃描收貨   — 掃 PO / 箱號 / Lot / 自動比對 ASN
//   Step 2 外箱檢驗   — 外箱攝像 / 封箱完整性 / Label 一致性 / 落地紀錄
//   Step 3 重量驗證   — 電子秤量 / 標準重量比對 / 容許 ±X% / AI 異常警示
//   Step 4 開箱驗證   — AI 視覺檢測 / 格位數 / 空格檢查 / 混裝物檢查 / 拆封方向
//   Step 5 數量驗證   — 全數 / 抽驗計數 / 失重比對
//   Step 6 IQC 品質驗證 — 外觀 / 尺寸 / 關鍵規格 / 包裝損傷
//   Step 7 系統風險判定 — PASS → 入庫；FAIL → HOLD（自動通知採購/SQE、異常單、鎖定、禁止扣帳）

import { digitalPOs } from "./supplier-portal";
import { suppliers, parts } from "./seed";

export type ReceivingStepKey = "scan" | "outer" | "weight" | "open" | "qty" | "iqc" | "verdict";
export type SubCheckStatus = "pending" | "pass" | "fail";
export type StepStatus = "locked" | "in_progress" | "pass" | "fail";

export type SubCheckDef = { key: string; label: string; hint?: string };

export type StepDef = {
  key: ReceivingStepKey;
  num: number;
  label: string;
  icon: string;
  desc: string;
  subChecks: SubCheckDef[];
  automatic?: boolean;       // Step 7 系統自動判定
};

export const RECEIVING_STEPS: StepDef[] = [
  {
    key: "scan", num: 1, label: "掃描收貨", icon: "📱",
    desc: "用掃描槍 / QR 機讀取 PO、箱號、Lot 編號，系統自動比對 ASN 預到資料",
    subChecks: [
      { key: "scan_po",    label: "掃 PO 條碼",         hint: "對應 ASN 中的 PO 號" },
      { key: "scan_box",   label: "掃所有箱號",         hint: "需與 ASN 的箱號清單一致" },
      { key: "scan_lot",   label: "掃 Lot 批號",         hint: "供應商批號（追溯用）" },
      { key: "match_asn",  label: "自動比對 ASN",        hint: "PO/箱數/Lot 必須全對應，缺一不可" },
    ],
  },
  {
    key: "outer", num: 2, label: "外箱檢驗", icon: "📦",
    desc: "外箱是否完整、封條是否被動過、Label 是否一致、運送中有無摔落",
    subChecks: [
      { key: "photo",        label: "外箱攝像存證", hint: "每箱拍 4 面 + 上頂" },
      { key: "seal",         label: "封箱完整性",    hint: "膠帶 / 鋼帶 / 封條未斷" },
      { key: "label",        label: "Label 一致性",  hint: "料號 / 品名 / 數量 / 廠商章與 ASN 對照" },
      { key: "drop_record",  label: "落地紀錄",       hint: "ShockWatch / TiltWatch 指示器" },
    ],
  },
  {
    key: "weight", num: 3, label: "重量驗證", icon: "⚖️",
    desc: "電子秤上秤，與 ASN 出貨重量比對，超出容許 → AI 警示",
    subChecks: [
      { key: "weigh",        label: "電子秤量",          hint: "整批上秤、單箱抽秤" },
      { key: "compare",      label: "標準重量比對",      hint: "與 ASN 申報重量比對" },
      { key: "tolerance",    label: "容許 ±2%",          hint: "超出範圍直接 FAIL" },
      { key: "ai_alert",     label: "AI 異常警示",        hint: "歷史 baseline 偵測異常" },
    ],
  },
  {
    key: "open", num: 4, label: "開箱驗證", icon: "📂",
    desc: "拆封拍照、AI 視覺檢測格位 / 空格 / 混裝 / 拆封方向",
    subChecks: [
      { key: "ai_vision",      label: "AI 視覺檢測",       hint: "對照 ASN 中標準擺位照" },
      { key: "compartments",   label: "格位數正確",        hint: "如分隔板數 / 內襯 PE 袋數" },
      { key: "empty_check",    label: "無空格 / 缺件",     hint: "每格皆有料" },
      { key: "mix_check",      label: "無混裝異物",         hint: "無他料 / 紙屑 / 螺絲外露" },
      { key: "open_direction", label: "拆封方向正確",      hint: "依箭頭方向、無倒置" },
    ],
  },
  {
    key: "qty", num: 5, label: "數量驗證", icon: "🔢",
    desc: "全數清點 + 抽驗計數 + 失重比對（三重保險）",
    subChecks: [
      { key: "full_count",    label: "全數清點",       hint: "與 PO 訂購數量一致" },
      { key: "sample_count",  label: "抽驗計數（AQL）", hint: "依 AQL 表抽樣" },
      { key: "weight_diff",   label: "失重比對",        hint: "實秤重 vs 件數×單重" },
    ],
  },
  {
    key: "iqc", num: 6, label: "IQC 品質驗證", icon: "🔬",
    desc: "外觀 / 尺寸（連動 SPC）/ 關鍵規格 / 包裝損傷",
    subChecks: [
      { key: "appearance",         label: "外觀",            hint: "刮痕 / 鏽 / 色差 / 變形" },
      { key: "dimension",          label: "尺寸（連 SPC）",   hint: "軸心類自動連動 P03SG007 SPEC" },
      { key: "critical_spec",      label: "關鍵規格",        hint: "硬度 / 公差 / 螺牙" },
      { key: "packaging_damage",   label: "內包裝損傷",       hint: "PE 袋 / 防潮包破損" },
    ],
  },
  {
    key: "verdict", num: 7, label: "系統風險判定", icon: "🎯",
    desc: "系統依前 6 步自動判定 PASS → 入庫；任一 FAIL → HOLD 連鎖動作",
    automatic: true,
    subChecks: [],
  },
];

export type AsnPreArrival = {
  poNo: string;
  boxCount: number;          // ASN 申報箱數
  shipWeight: number;         // ASN 申報重量 (kg)
  boxNos: string[];           // ASN 箱號清單
  qrCodes: string[];          // QR/Barcode 清單
};

export type SubCheckState = { status: SubCheckStatus; note?: string };

export type StepState = {
  status: StepStatus;
  subChecks: Record<string, SubCheckState>;
  startedAt?: string;
  completedAt?: string;
};

export type ReceivingRecord = {
  poId: string;
  poNo: string;
  inspector: string;
  asnPreArrival: AsnPreArrival;
  steps: Record<ReceivingStepKey, StepState>;
  // 量測數據
  measuredWeight?: number;
  measuredQty?: number;
  // 最終判定
  verdict: "pending" | "PASS" | "FAIL_HOLD";
  failedActions: string[];
  putawayAt?: string;
  putawayLocation?: string;
};

// ============================================================
// Pre-arrival ASN 預設值（依該 PO 的 ASN）
// ============================================================
export function asnPreArrivalFor(poId: string): AsnPreArrival {
  const po = digitalPOs.find((p) => p.id === poId);
  if (!po) return { poNo: "", boxCount: 0, shipWeight: 0, boxNos: [], qrCodes: [] };
  // 依 PO 數量與料件單重估算（demo）
  const part = parts.find((x) => x.id === po.partId);
  const boxCount = Math.max(1, Math.ceil(po.qty / 50));
  const unitWeight = part?.category.includes("鋁") || part?.category.includes("塑") ? 0.5 : 1.2;
  const shipWeight = Math.round(po.qty * unitWeight * 100) / 100;
  const boxNos = Array.from({ length: boxCount }, (_, i) => `${po.poNo}-BOX${String(i + 1).padStart(3, "0")}`);
  const qrCodes = boxNos.map((b) => `QR-${b}`);
  return { poNo: po.poNo, boxCount, shipWeight, boxNos, qrCodes };
}

// ============================================================
// 建立空白 record
// ============================================================
export function emptyReceiving(poId: string, poNo: string): ReceivingRecord {
  const steps = {} as Record<ReceivingStepKey, StepState>;
  RECEIVING_STEPS.forEach((s, idx) => {
    const subs: Record<string, SubCheckState> = {};
    s.subChecks.forEach((sc) => { subs[sc.key] = { status: "pending" }; });
    steps[s.key] = {
      status: idx === 0 ? "in_progress" : "locked",
      subChecks: subs,
    };
  });
  return {
    poId, poNo, inspector: "",
    asnPreArrival: asnPreArrivalFor(poId),
    steps,
    verdict: "pending",
    failedActions: [],
  };
}

// ============================================================
// 狀態推進規則
//   每步驟 sub-check 全 pass → 該步驟 pass、解鎖下一步
//   任一 sub-check fail → 該步驟 fail、自動鎖住後續 + verdict 變 FAIL_HOLD
// ============================================================
export function recalc(rec: ReceivingRecord): ReceivingRecord {
  const newSteps = { ...rec.steps };
  let blocked = false;
  let nextStepIdx = -1;
  const failedActions: string[] = [];

  for (let i = 0; i < RECEIVING_STEPS.length; i++) {
    const def = RECEIVING_STEPS[i];
    const st = { ...newSteps[def.key], subChecks: { ...newSteps[def.key].subChecks } };

    if (def.automatic) {
      // Step 7：依前 6 步綜合判定
      const allPass = RECEIVING_STEPS.slice(0, 6).every((s) => newSteps[s.key].status === "pass");
      const anyFail = RECEIVING_STEPS.slice(0, 6).some((s) => newSteps[s.key].status === "fail");
      if (anyFail) {
        st.status = "fail";
      } else if (allPass) {
        st.status = "pass";
      } else {
        st.status = "locked";
      }
      newSteps[def.key] = st;
      continue;
    }

    if (blocked) {
      st.status = "locked";
      newSteps[def.key] = st;
      continue;
    }

    const subs = Object.values(st.subChecks);
    const allPass = subs.length > 0 && subs.every((s) => s.status === "pass");
    const anyFail = subs.some((s) => s.status === "fail");
    const anyTouched = subs.some((s) => s.status !== "pending");

    if (anyFail) {
      st.status = "fail";
      blocked = true;
    } else if (allPass) {
      st.status = "pass";
      st.completedAt = st.completedAt ?? new Date().toISOString();
      if (i + 1 < RECEIVING_STEPS.length) nextStepIdx = i + 1;
    } else if (anyTouched) {
      st.status = "in_progress";
      st.startedAt = st.startedAt ?? new Date().toISOString();
    } else if (i === 0 || newSteps[RECEIVING_STEPS[i - 1].key].status === "pass") {
      st.status = "in_progress";
    } else {
      st.status = "locked";
    }
    newSteps[def.key] = st;
  }

  // 解鎖 nextStep
  if (nextStepIdx >= 0 && nextStepIdx < RECEIVING_STEPS.length) {
    const def = RECEIVING_STEPS[nextStepIdx];
    if (newSteps[def.key].status === "locked") {
      newSteps[def.key] = { ...newSteps[def.key], status: "in_progress" };
    }
  }

  // 最終判定 + 失敗連鎖動作
  let verdict: ReceivingRecord["verdict"] = "pending";
  const sevenStatus = newSteps.verdict.status;
  if (sevenStatus === "pass") verdict = "PASS";
  if (sevenStatus === "fail") {
    verdict = "FAIL_HOLD";
    const failedStep = RECEIVING_STEPS.slice(0, 6).find((s) => newSteps[s.key].status === "fail");
    failedActions.push(`🚨 Step ${failedStep?.num} ${failedStep?.label} 失敗 → 進入 HOLD 狀態`);
    failedActions.push("📧 自動 Email 通知採購人員");
    failedActions.push("📧 自動 Email 通知 SQE（Supplier Quality Engineer）");
    failedActions.push("📋 自動生成異常單（連動採購閉環中心）");
    failedActions.push("🔒 鎖定本批庫存：不可入庫、不可上架、不可消耗");
    failedActions.push("⛔ 禁止鼎新扣帳：在 ERP 端鎖定該 PO");
    failedActions.push("📊 計入鉞泰 / 供應商風險雷達 Quality + Reliability 維度扣分");
  }

  return { ...rec, steps: newSteps, verdict, failedActions };
}

// ============================================================
// 候選收貨 PO（沿用之前的）
// ============================================================
export type IncomingPO = {
  poId: string;
  poNo: string;
  supplierName: string;
  supplierCode: string;
  partCode: string;
  partName: string;
  qty: number;
  unit: string;
  unitCost: number;
  expectedArrival: string;
  asnTrackingNo?: string;
  carrier?: string;
  alreadyArrived: boolean;
};

export function incomingPOs(): IncomingPO[] {
  return digitalPOs
    .filter((p) => p.status === "shipped" || (p.asn && !p.productionLog.find((l) => l.stage === "arrived")))
    .map((p) => {
      const sup = suppliers.find((s) => s.id === p.supplierId);
      const part = parts.find((x) => x.id === p.partId);
      return {
        poId: p.id, poNo: p.poNo,
        supplierName: sup?.name ?? p.supplierId,
        supplierCode: sup?.code ?? p.supplierId,
        partCode: part?.code ?? "",
        partName: part?.name ?? p.partId,
        qty: p.qty, unit: part?.unit ?? "PCS", unitCost: p.unitCost,
        expectedArrival: p.expectedArrival,
        asnTrackingNo: p.asn?.trackingNo,
        carrier: p.asn?.carrier,
        alreadyArrived: !!p.productionLog.find((l) => l.stage === "arrived"),
      };
    })
    .sort((a, b) => a.expectedArrival.localeCompare(b.expectedArrival));
}

export function canPutaway(rec: ReceivingRecord): boolean {
  return rec.verdict === "PASS" && !!rec.inspector.trim() && !rec.putawayAt;
}
