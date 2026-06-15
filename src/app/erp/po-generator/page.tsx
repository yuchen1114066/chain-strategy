import Link from "next/link";
import { suppliers, today } from "@/lib/erp/seed";
import { computePartDemand } from "@/lib/erp/alerts";

// PO 自動生成器：
//   1. 計算所有缺料件
//   2. 依供應商分組
//   3. 每家供應商產出一張可列印的採購單
//   4. PO 號自動產生（PO-YYYYMMDD-Snn）
//   5. 預計到貨日 = 今天 + 供應商交期

type PoLine = {
  partCode: string;
  partName: string;
  spec: string;
  unit: string;
  shortageQty: number;
  recommendQty: number; // 建議下單量 = 缺料 + 安全庫存緩衝
  unitCost: number;
  lineTotal: number;
  contributingWos: string[]; // 哪些工單需要這料
};

type SupplierPo = {
  supplier: typeof suppliers[number];
  poNo: string;
  expectedArrival: string;
  lines: PoLine[];
  total: number;
};

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function PoGeneratorPage() {
  const demand = computePartDemand();
  const shortageParts = demand.filter((d) => d.shortage > 0);

  // 依供應商分組
  const bySupplier = new Map<string, PoLine[]>();
  for (const sp of shortageParts) {
    const p = sp.part;
    if (!p.supplierId) continue; // 自製件無供應商，跳過
    const supId = p.supplierId;
    // 建議量 = 缺料 + 安全庫存（直接拉到安全水位）
    const recommendQty = sp.shortage + p.safetyStock;
    const lineTotal = recommendQty * p.unitCost;
    const line: PoLine = {
      partCode: p.code,
      partName: p.name,
      spec: p.spec ?? "",
      unit: p.unit,
      shortageQty: sp.shortage,
      recommendQty,
      unitCost: p.unitCost,
      lineTotal,
      contributingWos: [...new Set(sp.contributingWos.map((c) => c.woNo))],
    };
    const arr = bySupplier.get(supId) ?? [];
    arr.push(line);
    bySupplier.set(supId, arr);
  }

  // 產生 PO 清單
  const todayCompact = today.replace(/-/g, "");
  let supIdx = 1;
  const supplierPos: SupplierPo[] = [];
  for (const [supId, lines] of bySupplier.entries()) {
    const supplier = suppliers.find((s) => s.id === supId);
    if (!supplier) continue;
    const total = lines.reduce((s, l) => s + l.lineTotal, 0);
    supplierPos.push({
      supplier,
      poNo: `PO-${todayCompact}-${String(supIdx).padStart(3, "0")}`,
      expectedArrival: addDays(today, supplier.transitDays),
      lines: lines.sort((a, b) => b.lineTotal - a.lineTotal),
      total,
    });
    supIdx += 1;
  }
  supplierPos.sort((a, b) => b.total - a.total);

  const grandTotal = supplierPos.reduce((s, p) => s + p.total, 0);
  const grandLineCount = supplierPos.reduce((s, p) => s + p.lines.length, 0);

  // 自製件無對應供應商的料件（顯示為「需內部處理」）
  const internalShortage = shortageParts.filter((d) => !d.part.supplierId);

  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-2">
      <header className="flex items-end justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">🛒 採購單自動生成器</h1>
          <p className="text-sm text-slate-500 mt-1">
            從缺料分析自動產生 PO，依供應商分組　·　按 Ctrl+P 直接列印
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/erp/parts"
            className="px-3 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
          >
            ← 回零件主檔
          </Link>
          <PrintButton />
        </div>
      </header>

      {/* 列印標題（只在列印時顯示） */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">祺驊 CHI HUA — 採購單批次</h1>
        <p className="text-xs text-slate-600 mt-1">產出日 {today}　·　共 {supplierPos.length} 張 PO · {grandLineCount} 個料件 · 合計 ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        <hr className="my-4 border-slate-400" />
      </div>

      {/* 總覽 KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
        <Kpi label="供應商" value={`${supplierPos.length} 張 PO`} />
        <Kpi label="料件總數" value={`${grandLineCount} 種`} />
        <Kpi label="採購總金額" value={`$${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="cyan" />
        <Kpi label="自製缺料" value={`${internalShortage.length} 項`} tone={internalShortage.length > 0 ? "amber" : undefined} />
      </section>

      {supplierPos.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="font-bold text-emerald-800">目前沒有缺料 — 無需生成 PO</div>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {supplierPos.map((po) => (
            <PoCard key={po.poNo} po={po} />
          ))}
        </div>
      )}

      {/* 自製缺料提示 */}
      {internalShortage.length > 0 && (
        <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 print:hidden">
          <h2 className="font-bold text-amber-900 mb-2">⚠️ 自製件缺料（需內部處理，不發外採購）</h2>
          <p className="text-xs text-amber-800 mb-3">
            以下為缺料但屬自製 / 半成品 — 需通知產線生產或調用 BOM 子件
          </p>
          <ul className="space-y-1 text-sm">
            {internalShortage.map((d) => (
              <li key={d.part.id} className="flex justify-between bg-white px-3 py-1.5 rounded">
                <span>
                  <span className="font-mono text-amber-700">{d.part.code}</span>
                  <span className="ml-2">{d.part.name}</span>
                </span>
                <span className="font-bold text-amber-700 tabular-nums">缺 {d.shortage} {d.part.unit}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 提示 */}
      <section className="print:hidden text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
        <b>📌 流程提醒：</b>
        本頁產出的 PO 為「建議單」，正式下單請以紙本 / 鼎新 ERP 採購單為準。建議量 = 缺料 + 安全庫存（直接拉到安全水位）。
        到貨日 = 今天 + 供應商交期（不含節假日）。
      </section>
    </div>
  );
}

function PoCard({ po }: { po: SupplierPo }) {
  return (
    <article className="bg-white rounded-xl border-2 border-slate-300 p-5 print:rounded-none print:border print:break-inside-avoid">
      {/* PO Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-300 pb-3 mb-3">
        <div>
          <div className="text-xs text-slate-500">採購單 Purchase Order</div>
          <div className="font-mono text-xl font-bold">{po.poNo}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">採購方</div>
          <div className="font-bold">祺驊 CHI HUA</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <Field label="供應商">{po.supplier.name}</Field>
        <Field label="國家">{po.supplier.country}</Field>
        <Field label="預計到貨">{po.expectedArrival}</Field>
        <Field label="運送天數">{po.supplier.transitDays} 天</Field>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">料號</th>
            <th className="text-left px-3 py-2 font-semibold">品名 / 規格</th>
            <th className="text-right px-3 py-2 font-semibold">缺料</th>
            <th className="text-right px-3 py-2 font-semibold">建議下單</th>
            <th className="text-left px-3 py-2 font-semibold">單位</th>
            <th className="text-right px-3 py-2 font-semibold">單價</th>
            <th className="text-right px-3 py-2 font-semibold">小計</th>
            <th className="text-left px-3 py-2 font-semibold print:hidden">用於工單</th>
          </tr>
        </thead>
        <tbody>
          {po.lines.map((l) => (
            <tr key={l.partCode} className="border-t border-slate-100">
              <td className="px-3 py-2 font-mono text-xs">{l.partCode}</td>
              <td className="px-3 py-2">
                <div className="font-medium">{l.partName}</div>
                {l.spec && <div className="text-xs text-slate-500">{l.spec}</div>}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-rose-600 font-semibold">-{l.shortageQty}</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold text-cyan-700">{l.recommendQty}</td>
              <td className="px-3 py-2 text-slate-600">{l.unit}</td>
              <td className="px-3 py-2 text-right tabular-nums">${l.unitCost.toLocaleString()}</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold">${l.lineTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td className="px-3 py-2 text-xs text-slate-600 print:hidden">
                {l.contributingWos.slice(0, 2).join(" ")}{l.contributingWos.length > 2 && " …"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 font-bold">
          <tr>
            <td colSpan={6} className="px-3 py-2 text-right">合計</td>
            <td className="px-3 py-2 text-right tabular-nums">
              ${po.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </td>
            <td className="print:hidden" />
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 print:mt-8">
        <div>
          <div className="text-xs text-slate-500 mb-6">採購主管簽核</div>
          <div className="border-b border-slate-400 h-8"></div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-6">供應商確認</div>
          <div className="border-b border-slate-400 h-8"></div>
        </div>
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "cyan" | "amber" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

// Client component for print button
import dynamic from "next/dynamic";
const PrintButton = dynamic(() => import("@/components/erp/PrintButton"), { ssr: !!1 });
