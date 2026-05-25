import { makeQrSvg, QR_PREFIX_META, type QRPrefix } from "@/lib/erp/qr";
import { digitalPOs } from "@/lib/erp/supplier-portal";
import { parts } from "@/lib/erp/seed";
import { workOrders, models } from "@/lib/erp/seed";
import QrGeneratorClient from "./QrGeneratorClient";

// QR Code 生成器（伺服器端產 SVG，速度快）
//   · 單張：自訂 prefix + value
//   · 批次：選擇某張 PO 一次生 PO + 箱號 × N + Lot QR

export default function QrGeneratorPage() {
  // 預先把所有可用的 PO / 箱號 / 料件 / 工單 QR 都產好（伺服器端）
  const samplePOs = digitalPOs.slice(0, 6).map((p) => ({
    poNo: p.poNo,
    boxNos: Array.from({ length: Math.max(1, Math.ceil(p.qty / 50)) }, (_, i) => `${p.poNo}-BOX${String(i + 1).padStart(3, "0")}`),
    lotNo: `LOT-${p.poNo.replace("PO-", "")}`,
    partCode: parts.find((x) => x.id === p.partId)?.code ?? "",
    partName: parts.find((x) => x.id === p.partId)?.name ?? "",
    qty: p.qty,
  }));

  const sampleParts = parts.slice(0, 12).map((p) => ({
    code: p.code,
    name: p.name,
    spec: p.spec ?? "",
  }));

  const sampleWos = workOrders.slice(0, 5).map((w) => {
    const m = models.find((x) => x.id === w.modelId);
    return { woNo: w.woNo, customer: w.customer, modelCode: m?.code ?? "" };
  });

  const sampleLocations = ["A-12-03", "A-12-04", "B-01-01", "B-02-15", "C-05-08"];

  // 預產所有 QR SVG（避免 client 端再算）
  const poSvgs = samplePOs.map((p) => ({
    poNo: p.poNo, partCode: p.partCode, partName: p.partName, qty: p.qty, lotNo: p.lotNo, boxNos: p.boxNos,
    poSvg: makeQrSvg({ prefix: "PO" as QRPrefix, value: p.poNo }, 120),
    lotSvg: makeQrSvg({ prefix: "LOT" as QRPrefix, value: p.lotNo }, 120),
    boxSvgs: p.boxNos.map((b) => ({ no: b, svg: makeQrSvg({ prefix: "BOX" as QRPrefix, value: b }, 100) })),
  }));

  const partSvgs = sampleParts.map((p) => ({
    ...p,
    svg: makeQrSvg({ prefix: "PART" as QRPrefix, value: p.code }, 110),
  }));

  const woSvgs = sampleWos.map((w) => ({
    ...w,
    svg: makeQrSvg({ prefix: "WO" as QRPrefix, value: w.woNo }, 110),
  }));

  const locSvgs = sampleLocations.map((l) => ({
    code: l,
    svg: makeQrSvg({ prefix: "LOC" as QRPrefix, value: l }, 100),
  }));

  return (
    <QrGeneratorClient
      poSvgs={poSvgs}
      partSvgs={partSvgs}
      woSvgs={woSvgs}
      locSvgs={locSvgs}
      prefixMeta={QR_PREFIX_META}
    />
  );
}
