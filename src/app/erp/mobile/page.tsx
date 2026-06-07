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

// Demo 可掃 QR 列表
const DEMO_QR_PRESETS = [
  { label: "料件：線圈固定架", code: "P04AA10" },
  { label: "料件：SKF 6202 軸承", code: "P13AA06" },
  { label: "料件：滾針離合器 HF 2016", code: "P13ED01" },
  { label: "料件：磁石", code: "P07A01B" },
  { label: "領料單", code: "5410-260507001" },
  { label: "收料單", code: "5210-260507002" },
  { label: "製令", code: "5110-260128006" },
  { label: "採購單", code: "PO-2026-1021" },
  { label: "倉位 A100-B2-04", code: "A100-B2-04" },
];

export default function MobileLookupPage() {
  const [code, setCode] = useState<string>("P04AA10");
  const [scanning, setScanning] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string>(() => new Date().toISOString());

  const kind = classifyBarcode(code);

  function simulateScan(c: string) {
    setScanning(true);
    setTimeout(() => {
      setCode(c);
      setSyncedAt(new Date().toISOString());
      setScanning(false);
    }, 500);
  }

  function manualRefresh() {
    setScanning(true);
    setTimeout(() => {
      setSyncedAt(new Date().toISOString());
      setScanning(false);
    }, 400);
  }

  return (
    <div className="p-6 space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📱 倉庫 QR 查碼</h1>
          <p className="text-sm text-slate-500 mt-1">
            掃 QR → 即時看到鼎新 ERP 真實數量 + 完整相關資料。<b className="text-amber-700">本機僅查詢，扣帳請至 ERP</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={manualRefresh}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 hover:border-cyan-400"
          >
            🔄 重新同步
          </button>
          <Link
            href="/erp/mobile/count"
            className="text-xs px-3 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-700"
          >
            📋 盤點對照工具 →
          </Link>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800">已連線 iGP</span>
            <span className="text-emerald-700 font-mono">{syncedAt.slice(11, 19)}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ============ 左：手機畫面 ============ */}
        <div className="flex justify-center">
          <PhoneShell>
            <div className="bg-slate-900 text-white text-[10px] px-4 py-1 flex justify-between">
              <span>9:41</span>
              <span>📶 LTE 🔋 87%</span>
            </div>
            <div className="bg-cyan-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] opacity-80">祺驊 ChainOps</div>
                <div className="text-sm font-bold">📷 倉庫 QR 查碼</div>
              </div>
              <span className="text-[9px] bg-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                iGP 同步
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-3">
              <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {scanning ? (
                  <>
                    <div className="absolute inset-6 border-2 border-cyan-400 rounded-lg animate-pulse" />
                    <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-cyan-400 animate-pulse" />
                    <div className="text-cyan-400 text-xs font-mono z-10">同步 ERP...</div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-6 border-2 border-emerald-400 rounded-lg" />
                    <div className="text-emerald-400 text-xs font-mono z-10">✓ {code}</div>
                  </>
                )}
                <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-slate-500">
                  正式版接 html5-qrcode / 公司 PDA SDK
                </div>
              </div>

              {!scanning && (
                <div className="bg-white rounded-lg border border-cyan-300 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[9px] text-cyan-700 font-semibold">
                    <KindBadge kind={kind} />
                    <span>同步於 {syncedAt.slice(11, 16)}</span>
                  </div>
                  <ScanResult kind={kind} />
                </div>
              )}

              <div className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500 mb-2">📋 Demo：點 QR 模擬掃描</div>
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
              ⚠ 本機僅查詢，扣帳 / 入庫 / 異動請至鼎新 ERP
            </div>
          </PhoneShell>
        </div>

        {/* ============ 右：說明 + 使用情境 ============ */}
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold mb-2">🎯 設計原則</h3>
            <ul className="text-sm space-y-2 text-slate-700">
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span><b>即時對齊 ERP</b>：手機看到的數字 100% 同步鼎新，0.3 秒呈現</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span><b>完整相關資料</b>：品名 / 規格 / 廠商 / 在庫 / 安全庫存 / 倉位 / 被誰用到 全部展開</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span><b>實盤對照</b>：手機數字 = ERP 數字，倉管比對實際箱數</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-600">✗</span>
                <span><b>不寫入</b>：避免雙系統不同步。發現不符請至 ERP 調整</span>
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-600">💡</span>
                <span>盤點時請用 <Link href="/erp/mobile/count" className="text-cyan-700 hover:underline font-semibold">📋 盤點對照工具</Link>（產出 CSV 給 PM）</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold mb-2">🔖 支援辨識的 QR 類型</h3>
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-1">類型</th>
                  <th className="text-left py-1">範例</th>
                  <th className="text-left py-1">顯示</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-t border-slate-100"><td className="py-1">料件 P*</td><td className="font-mono">P13AA06</td><td>名稱/廠商/iGP庫存/倉位/被誰用</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">領料單 5410</td><td className="font-mono">5410-260507001</td><td>工單/料件清單/倉位</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">收料單 5210</td><td className="font-mono">5210-260507002</td><td>PO / 預期到貨</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">製令 5110</td><td className="font-mono">5110-260128006</td><td>工單/領料清單</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">採購單 PO</td><td className="font-mono">PO-2026-1021</td><td>供應商/料件/預計到貨</td></tr>
                <tr className="border-t border-slate-100"><td className="py-1">倉位 A*</td><td className="font-mono">A100-B2-04</td><td>該倉位存放料件清單</td></tr>
              </tbody>
            </table>
          </section>

          <section className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm">
            <b className="text-cyan-900">📦 倉庫實際使用情境</b>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-cyan-900 text-xs">
              <li>倉管走到 A100-B2-04 → 掃倉位 QR → 看到「P04AA10 線圈固定架 在庫 200」</li>
              <li>實盤數一數實際 195 個 → 不符 5 個 → 在「📋 盤點對照工具」勾選 ⚠ 不符</li>
              <li>產出 CSV 給 PM → PM 至鼎新 ERP 調整實際數量</li>
              <li>採購收貨時掃 PO QR → 看該收 P04AA10 × 100 → 對外箱確認</li>
              <li>產線領料前掃 5410-260507001 → 看要領哪兩項 → 去倉位拿 → 回 ERP 點扣帳</li>
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
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-semibold">
      {label}
    </span>
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
    .filter((x): x is NonNullable<typeof x> => !!x);
  const uniqUsedBy = [...new Map(usedBy.map((m) => [m.id, m])).values()];
  const low = p.stockOnHand < p.safetyStock;

  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{p.code}</div>
      <div className="text-sm">{p.name}</div>
      {p.spec && <div className="text-[10px] text-slate-500">📐 {p.spec}</div>}

      {/* iGP 即時庫存（核心數字） */}
      <div className="rounded-md bg-cyan-50 border border-cyan-200 p-2 mt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-cyan-700">🔄 鼎新 ERP 即時庫存</span>
        </div>
        <div className={`text-3xl font-bold tabular-nums ${low ? "text-rose-600" : "text-slate-900"}`}>
          {p.stockOnHand}
          <span className="text-sm text-slate-500 ml-1">{p.unit}</span>
        </div>
        {low && <div className="text-[10px] text-rose-600 mt-0.5 font-bold">⚠ 低於安全庫存（{p.safetyStock}）</div>}
        <div className="text-[10px] text-slate-500 mt-0.5">安全庫存 {p.safetyStock} {p.unit}</div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        <Field label="單價" value={`$${p.unitCost.toLocaleString()}`} />
        <Field label="分類" value={p.category} />
        <Field label="屬性" value={kindLabel(p.kind)} />
        <Field label="交期" value={`${p.leadDays} 天`} />
      </div>

      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-500">🏭 供應商</div>
        <div className="text-[11px] font-semibold">{sup?.name ?? "—"}</div>
        <div className="text-[10px] text-slate-500">
          {sup?.country} · {sup?.city} · {sup?.contact ?? "—"}
        </div>
      </div>

      {uniqUsedBy.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[10px] text-slate-500">🔗 被以下成品使用（{uniqUsedBy.length}）</div>
          <ul className="text-[11px] mt-0.5 space-y-0.5">
            {uniqUsedBy.slice(0, 5).map((m) => (
              <li key={m.id} className="font-mono">
                {m.code} <span className="text-slate-500">{m.machineFamily}</span>
              </li>
            ))}
            {uniqUsedBy.length > 5 && <li className="text-slate-400">… 等 {uniqUsedBy.length} 個</li>}
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
  const totalQty = slip.items.reduce((a, b) => a + b.qtyPlanned, 0);
  const wo = slip.workOrderRef ? workOrders.find((w) => w.woNo === slip.workOrderRef) : undefined;

  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{slip.no}</div>
      <div className="text-[11px]">{meta.icon} {meta.label}</div>
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="開單日" value={slip.createdAt} />
        <Field label="狀態" value={slip.status === "synced" ? "已同步 ERP" : slip.status === "done" ? "完成" : slip.status === "in_progress" ? "進行中" : "待辦"} />
      </div>
      {slip.note && <div className="text-[10px] text-slate-500">📝 {slip.note}</div>}
      {wo && (
        <div className="rounded bg-cyan-50 px-2 py-1.5 text-[10px]">
          <div className="text-slate-500">關聯工單</div>
          <div className="font-mono text-cyan-700 font-bold">{wo.woNo}</div>
          <div className="text-slate-600">{wo.customer} · 船期 {wo.shipDate}</div>
        </div>
      )}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-500 mb-1">料件清單（{slip.items.length} 項 / 共 {totalQty}）</div>
        <ul className="space-y-1">
          {slip.items.map((it) => {
            const p = parts.find((x) => x.code === it.partCode);
            return (
              <li key={it.partCode} className="bg-slate-50 px-2 py-1.5 rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="font-mono text-[10px]">{it.partCode}</div>
                    <div className="text-[11px]">{it.partName}</div>
                    <div className="text-[9px] text-slate-500">📍 {it.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">本單應領</div>
                    <div className="font-bold text-base tabular-nums">{it.qtyPlanned} {it.unit ?? ""}</div>
                    {p && (
                      <div className="text-[9px] text-cyan-700">
                        ERP 庫存 {p.stockOnHand}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="pt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
        ⚠ 領料 / 入庫請至鼎新 ERP 執行扣帳
      </div>
    </div>
  );
}

function PoResult({ no }: { no: string }) {
  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{no}</div>
      <div className="text-[11px]">🛒 採購單</div>
      <Field label="供應商" value="莊宏億" />
      <Field label="料件" value="P13DA01 NBK 6001 2RS × 500" />
      <Field label="預計到貨" value="2026-06-22" />
      <Field label="狀態" value="已下單，等待到貨" />
      <div className="pt-2 text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
        ⚠ 收貨後請至 ERP 5210 收料單系統執行入庫
      </div>
    </div>
  );
}

function LocationResult({ code }: { code: string }) {
  // Demo: 用包含此位置 keyword 的 slip 找對應料件
  const slipItems = initialSlips
    .flatMap((s) => s.items.map((it) => ({ ...it, slipNo: s.no })))
    .filter((it) => it.location.startsWith(code) || code.startsWith(it.location));
  const uniqByCode = [...new Map(slipItems.map((it) => [it.partCode, it])).values()];

  return (
    <div className="text-xs space-y-1.5">
      <div className="font-mono text-sm font-bold">{code}</div>
      <div className="text-[11px]">📍 倉位</div>
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] text-slate-500 mb-1">此倉位料件（依 ERP）</div>
        {uniqByCode.length === 0 ? (
          <p className="text-[10px] text-slate-400">此倉位無料件記錄</p>
        ) : (
          <ul className="space-y-1">
            {uniqByCode.map((it) => {
              const p = parts.find((x) => x.code === it.partCode);
              return (
                <li key={it.partCode} className="bg-slate-50 px-2 py-1.5 rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-mono text-[10px]">{it.partCode}</div>
                      <div className="text-[11px]">{it.partName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-500">ERP 庫存</div>
                      <div className="font-bold text-base tabular-nums">
                        {p?.stockOnHand ?? "—"} {p?.unit ?? ""}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Link
        href="/erp/mobile/count"
        className="block mt-2 py-1.5 rounded bg-cyan-600 text-white text-center font-bold text-[11px]"
      >
        📋 開始盤點此區
      </Link>
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

function kindLabel(k: string | undefined) {
  switch (k) {
    case "self": return "自製件";
    case "dummy": return "虛設品號";
    case "feature": return "Feature件";
    case "outsource": return "託外加工";
    case "option": return "Option件";
    default: return "採購件";
  }
}
