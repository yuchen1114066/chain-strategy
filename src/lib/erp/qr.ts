// QR Code 生成 — 用 qrcode-svg 套件
// 統一格式：{prefix}:{value}（如 PO:PO-2026-0506, BOX:PO-2026-0506-BOX001, LOT:RA80-26012-0021）

import QRCode from "qrcode-svg";

export type QRPrefix = "PO" | "BOX" | "LOT" | "PART" | "LOC" | "WO";

export type QRItem = {
  prefix: QRPrefix;
  value: string;
  label?: string;       // 顯示文字（可選）
  subtitle?: string;     // 副標
};

export function makeQrSvg(item: QRItem, sizePx = 120): string {
  const payload = `${item.prefix}:${item.value}`;
  const qr = new QRCode({
    content: payload,
    width: sizePx,
    height: sizePx,
    padding: 2,
    color: "#000000",
    background: "#ffffff",
    ecl: "M",
    join: true,
    container: "svg-viewbox",
  });
  return qr.svg();
}

export function parseQr(data: string): QRItem | null {
  const m = data.match(/^(PO|BOX|LOT|PART|LOC|WO):(.+)$/);
  if (!m) return null;
  return { prefix: m[1] as QRPrefix, value: m[2] };
}

export const QR_PREFIX_META: Record<QRPrefix, { label: string; color: string; icon: string }> = {
  PO:   { label: "採購單", color: "#0056B3", icon: "📋" },
  BOX:  { label: "箱號",   color: "#0891b2", icon: "📦" },
  LOT:  { label: "批號",   color: "#7c3aed", icon: "🏷" },
  PART: { label: "料號",   color: "#10b981", icon: "🔩" },
  LOC:  { label: "儲位",   color: "#f59e0b", icon: "🗂" },
  WO:   { label: "工單",   color: "#dc2626", icon: "🏭" },
};
