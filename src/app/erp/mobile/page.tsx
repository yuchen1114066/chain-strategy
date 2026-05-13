"use client";

import { useState } from "react";
import Link from "next/link";
import {
  initialSlips,
  classifyBarcode,
  TASK_META,
  type Slip,
  type ScanKind,
} from "@/lib/erp/warehouse";
import { parts, suppliers, models, bom, workOrders } from "@/lib/erp/seed";

// 預設可掃的 QR 列表（demo 模擬：實際手機開相機）
const DEMO_QR_PRESETS = [
  { label: "料件：線圈固定架", code: "P04AA10" },
  { label: "料件：SKF 軸承", code: "P13AA06" },
  { label: "料件：FB64 主車架", code: "FB64-FRM" },
  { label: "領料單", code: "5410-260507001" },
  { label: "收料單", code: "5210-260507002" },
  { label: "製令", code: "5110-260128006" },
  { label: "採購單", code: "PO-2026-1021" },
  { label: "倉位", code: "A100-B2-04" },
];

export default function MobileLookupPage() {
  const [code, setCode] = useState<string>("P04AA10");
  const [scanning, setScanning] = useState(false);

  const kind = classifyBarcode(code);

  function simulateScan(c: string) {
    setScanning(true);
    setTimeout(() => {
      setCode(c);
      setScanning(false);
    }, 600);
  }

  return (
    <div className="p-6 space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📱 QR 查碼工具</h1>
          <p className="text-sm text-slate-500 mt-1">
            掃 QR → 立刻顯示品名 / 廠商 / 庫存 / 倉位等資訊。<b className="text-amber-700">不做扣帳，同仁回 iGP ERP 操作</b>。
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ============ 左：手機 ============ */}
        <div className="flex justify-center">
          <PhoneShell>
            <div className="bg-slate-900 text-white text-[10px] px-4 py-1 flex justify-between">
              <span>9:41</span>
              <span>📶 LTE 🔋 87%</span>
            </div>
            <div className="bg-cyan-600 text-white px-4 py-3">
              <div className="text-[10px] opacity-80">ChainOps</div>
              <div className="text-sm font-bold">📷 QR 查碼</div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-3">
              {/* 模擬鏡頭 */}
              <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {scanning ? (
                  <>
                    <div className="absolute inset-6 border-2 border-cyan-400 rounded-lg animate-pulse" />
                    <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-cyan-400 animate-pulse" />
                    <div className="text-cyan-400 text-xs font-mono z-10">辨識中...</div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-6 border-2 border-emerald-400 rounded-lg" />
                    <div className="text-emerald-400 text-xs font-mono z-10">✓ 已辨識：{code}</div>
                  </>
                )}
                <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-slate-500">
                  正式版接 html5-qrcode / ZXing.js
                </div>
              </div>

              {/* 辨識結果 */}
              {!scanning && (
                <div className="bg-white rounded-lg border border-cyan-300 p-3 space-y-2">
                  <KindBadge kind={kind} />
                  <ScanResult kind={kind} />
                </div>
              )}

              {/* Demo：選個 QR 模擬掃描 */}
              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500 mb-2">📋 Demo：點任一個 QR 模擬掃描</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_QR_PRESETS.map((q) => (
                    <button
                      key={q.code}
                      onClick={() => simulateScan(q.code)}
                      className={`text-[10px] px-2 py-1.5 rounded border text-left ${
                        code === q.code
                          ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 hover:border-cyan-400"
                      }`}
                    >
                      <div className="font-mono">{q.code}</div>
                      <div className="text-slate-500 truncate">{q.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border-t border-amber-200 px-3 py-2 text-[10px] text-amber-900 text-center">
              ⚠ 本機僅查詢，扣帳 / 入庫請至 iGP ERP
            </div>
          </PhoneShell>
        </div>

        {/* ============ 右：QR 規範 + 使用情境 ============ */}
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold mb-2">🎯 設計原則</h3>
            <ul className="text-sm space-y-2 text-slate-700">
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span><b>查詢即用</b>：掃描 → 0.3 秒看到品名 / 廠商 / 庫存，省去翻 Excel</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span><b>對帳工具</b>：手機看到的數量 = iGP ERP 上的數量，倉管實盤對照</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span><b>不做扣帳</b>：避免兩套系統不同步，扣帳一律回 iGP 操作</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-600">✗</span>
                <span><b>不連線 ERP 寫入</b>：手機端純讀，免去 SP 權限 / 雙向同步爭議</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold mb-2">🔖 支援辨識的 QR 類型</h3>
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-1">類型</th>
                  <th className="text-left py-1">前綴</th>
                  <th className="text-left py-1">範例</th>
                  <th className="text-left py-1">顯示內容</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-t border-slate-100"><td className="py-1">料件</td><td><code>P*</code></td><td className="font-mono">P04AA10</td><td>名稱/廠商/庫存/被哪些成品用</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">領料單</td><td><code>5410-</code></td><td className="font-mono">5410-260507001</td><td>關聯工單/料件清單/倉位</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">收料單</td><td><code>5210-</code></td><td className="font-mono">5210-260507002</td><td>關聯 PO / 預期到貨</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">製令</td><td><code>5110-</code></td><td className="font-mono">5110-260128006</td><td>關聯工單/領料清單</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">採購單</td><td><code>PO-</code></td><td className="font-mono">PO-2026-1021</td><td>供應商/料件/預計到貨</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">倉位</td><td><code>A*</code></td><td className="font-mono">A100-B2-04</td><td>此倉位存放料件清單</td></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-slate-500 mt-3">
              依前綴自動辨識類型 → 跳對應顯示畫面。
            </p>
          </section>

          <section className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm">
            <b className="text-cyan-900">使用情境</b>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-cyan-900 text-xs">
              <li>倉管走到 A100-B2-04 → 掃倉位 QR → 看到「P04AA10 線圈固定架 在庫 85」</li>
              <li>實盤後數一數箱子實際 80 個 → 跟 iGP 數字不符 → 通知 PM 對帳</li>
              <li>採購收貨時掃 PO QR → 看到該收 P04AA10 × 100 → 對外箱對得上</li>
              <li>產線領料前掃 5410-260507001 → 看到要領哪兩項 → 去倉位拿 → 回 iGP 點扣帳</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[36px] p-2 shadow-2xl">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-2xl z-20" />
      <div className="w-full h-full rounded-[28px] overflow-hidden flex flex-col bg-white">
        {children}
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: ScanKind }) {
  const label =
    kind.kind === "part" ? "🔩 料件" :
    kind.kind === "slip_picking" ? "📤 領料單" :
    kind.kind === "slip_receiving" ? "📦 收料單" :
    kind.kind === "production_order" ? "🏭 製令" :
    kind.kind === "po" ? "🛒 採購單" :
    kind.kind === "location" ? "📍 倉位" :
    "❓ 未知";
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-semibold">
        {label}
      </span>
    </div>
  );
}

function ScanResult({ kind }: { kind: ScanKind }) {
  if (kind.kind === "part") return <PartResult code={kind.code} />;
  if (kind.kind === "slip_picking" || kind.kind === "slip_receiving" || kind.kind === "production_order") {
    return <SlipResult no={kind.no} />;
  }
  if (kind.kind === "po") return <PoResult no={kind.no} />;
  if (kind.kind === "location") return <LocationResult code={kind.code} />;
  return <div className="text-xs text-slate-500">無法辨識：{kind.kind === "unknown" ? kind.raw : ""}</div>;
}

function PartResult({ code }: { code: string }) {
  const p = parts.find((x) => x.code === code);
  if (!p) return <Empty msg={`找不到料件 ${code}`} />;
  const sup = suppliers.find((s) => s.id === p.supplierId);
  const usedBy = bom
    .filter((b) => b.partId === p.id && b.isActive)
    .map((b) => models.find((m) => m.id === b.modelId))
    .filter(Boolean);
  const low = p.stockOnHand < p.safetyStock;
  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{p.code}</div>
      <div className="text-sm">{p.name}</div>
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        <Field label="iGP 庫存" value={<span className={low ? "text-rose-600 font-bold" : ""}>{p.stockOnHand} {p.unit}{low && " ⚠"}</span>} />
        <Field label="安全庫存" value={`${p.safetyStock} ${p.unit}`} />
        <Field label="單價" value={`$${p.unitCost.toLocaleString()}`} />
        <Field label="分類" value={p.category} />
      </div>
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-500">供應商</div>
        <div className="text-[11px] font-semibold">{sup?.name}</div>
        <div className="text-[10px] text-slate-500">{sup?.country} · {sup?.city} · 交期 {p.leadDays}d</div>
      </div>
      {usedBy.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[10px] text-slate-500">被以下成品使用</div>
          <ul className="text-[11px] mt-0.5">
            {usedBy.slice(0, 4).map((m) => m && (
              <li key={m.id} className="font-mono">{m.code} <span className="text-slate-500">{m.machineFamily}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SlipResult({ no }: { no: string }) {
  const slip: Slip | undefined = initialSlips.find((s) => s.no === no);
  if (!slip) return <Empty msg={`找不到單據 ${no}`} />;
  const meta = TASK_META[slip.type];
  const total = slip.items.reduce((a, b) => a + b.qtyPlanned, 0);
  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{slip.no}</div>
      <div className="text-[11px]">{meta.icon} {meta.label}　·　{slip.createdAt}</div>
      {slip.note && <div className="text-[10px] text-slate-500">📝 {slip.note}</div>}
      {slip.workOrderRef && (
        <div className="text-[11px]">關聯工單 <span className="font-mono text-cyan-700">{slip.workOrderRef}</span></div>
      )}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-500 mb-1">料件清單（{slip.items.length} 項 / 共 {total}）</div>
        <ul className="space-y-1">
          {slip.items.map((it) => (
            <li key={it.partCode} className="flex justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono">{it.partCode}</div>
                <div className="text-slate-500 truncate">{it.partName}</div>
                <div className="text-[10px] text-slate-400">📍 {it.location}</div>
              </div>
              <div className="text-right shrink-0 tabular-nums font-semibold">
                {it.qtyPlanned} {it.unit ?? ""}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
        ⚠ 領料 / 入庫請至 iGP 系統執行扣帳
      </div>
    </div>
  );
}

function PoResult({ no }: { no: string }) {
  // Demo：示意性顯示
  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{no}</div>
      <div>採購單 — 預期到貨</div>
      <Field label="供應商" value="東莞睿達金屬" />
      <Field label="料件" value="P04AA10 線圈固定架 × 100" />
      <Field label="預計到貨" value="2026-05-15" />
      <div className="pt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
        ⚠ 收貨後請至 iGP 5210 收料單系統執行入庫
      </div>
    </div>
  );
}

function LocationResult({ code }: { code: string }) {
  // 模擬：列出此倉位有哪些料件（demo 用 hardcoded）
  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{code}</div>
      <div>倉位</div>
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-500 mb-1">此倉位料件</div>
        <ul className="space-y-1">
          <li className="flex justify-between">
            <span className="font-mono">P04AA10</span>
            <span className="tabular-nums">85 PCS</span>
          </li>
        </ul>
      </div>
      <div className="pt-2 text-[10px] text-cyan-700 bg-cyan-50 px-2 py-1.5 rounded">
        💡 實盤對照：拿出箱子數一數，看是否等於 iGP 上的 85
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-xs text-rose-600">{msg}</div>;
}

// (eliminate unused-import warnings)
void Link;
void workOrders;
