"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { makeQrSvg, type QRPrefix } from "@/lib/erp/qr";

type PoSvg = {
  poNo: string; partCode: string; partName: string; qty: number; lotNo: string; boxNos: string[];
  poSvg: string; lotSvg: string; boxSvgs: { no: string; svg: string }[];
};
type PartSvg = { code: string; name: string; spec: string; svg: string };
type WoSvg = { woNo: string; customer: string; modelCode: string; svg: string };
type LocSvg = { code: string; svg: string };

type PrefixMeta = Record<QRPrefix, { label: string; color: string; icon: string }>;

export default function QrGeneratorClient({ poSvgs, partSvgs, woSvgs, locSvgs, prefixMeta }: {
  poSvgs: PoSvg[]; partSvgs: PartSvg[]; woSvgs: WoSvg[]; locSvgs: LocSvg[];
  prefixMeta: PrefixMeta;
}) {
  const [tab, setTab] = useState<"po" | "part" | "wo" | "loc" | "custom">("po");
  const [selectedPo, setSelectedPo] = useState(poSvgs[0]?.poNo ?? "");
  const [customPrefix, setCustomPrefix] = useState<QRPrefix>("PART");
  const [customValue, setCustomValue] = useState("");

  const customSvg = useMemo(() => {
    if (!customValue.trim()) return "";
    return makeQrSvg({ prefix: customPrefix, value: customValue.trim() }, 200);
  }, [customPrefix, customValue]);

  const selectedPoData = poSvgs.find((p) => p.poNo === selectedPo);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">📱 QR Code 生成器</h1>
          <p className="text-sm text-slate-500 mt-1">
            生成 PO / 箱 / Lot / 料件 / 儲位 / 工單 QR — 用手機 / 掃描槍即可整合到 WMS 掃碼流程
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white font-bold shadow-md hover:bg-cyan-700">
            🖨 列印當前頁
          </button>
          <Link href="/erp/admin" className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">
            ← 回管理後台
          </Link>
        </div>
      </header>

      {/* 編碼規則說明 */}
      <section className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 print:hidden">
        <div className="font-bold text-cyan-900 mb-2">📋 QR 編碼規則（統一格式 `prefix:value`）</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {(Object.keys(prefixMeta) as QRPrefix[]).map((k) => {
            const m = prefixMeta[k];
            return (
              <div key={k} className="bg-white rounded p-2 border border-slate-200">
                <div className="text-lg">{m.icon}</div>
                <div className="font-mono font-bold text-sm" style={{ color: m.color }}>{k}:</div>
                <div className="text-[10px] text-slate-600">{m.label}</div>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-600 mt-2">
          例：<code className="font-mono bg-white px-1 rounded">PO:PO-2026-0506</code>　·
          <code className="font-mono bg-white px-1 rounded">BOX:PO-2026-0506-BOX001</code>　·
          <code className="font-mono bg-white px-1 rounded">LOT:RA80-26012-0021</code>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 print:hidden">
        {[
          { k: "po" as const, label: "📋 PO + 箱 + Lot（批次）" },
          { k: "part" as const, label: "🔩 料件" },
          { k: "wo" as const, label: "🏭 工單" },
          { k: "loc" as const, label: "🗂 儲位" },
          { k: "custom" as const, label: "✏ 自訂" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              tab === t.k ? "border-cyan-500 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* PO 批次 — 給該 PO 生 PO + 所有箱 + Lot QR */}
      {tab === "po" && (
        <>
          <section className="bg-white rounded-xl border border-slate-200 p-4 print:hidden">
            <label className="block">
              <span className="text-xs text-slate-500">選擇 PO（生成該 PO + 所有箱號 + Lot QR）</span>
              <select value={selectedPo} onChange={(e) => setSelectedPo(e.target.value)}
                className="mt-1 w-full max-w-md px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                {poSvgs.map((p) => (
                  <option key={p.poNo} value={p.poNo}>{p.poNo} · {p.partCode} × {p.qty}</option>
                ))}
              </select>
            </label>
          </section>

          {selectedPoData && (
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="mb-4 pb-3 border-b border-slate-200">
                <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">QR 批次列印</div>
                <div className="text-lg font-bold mt-0.5">
                  <span className="font-mono">{selectedPoData.poNo}</span>
                  　·　{selectedPoData.partName}
                  　·　{selectedPoData.qty} 件
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  共 {1 + selectedPoData.boxNos.length + 1} 張 QR（PO × 1 + 箱 × {selectedPoData.boxNos.length} + Lot × 1）
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* PO QR */}
                <QrCell label="PO 採購單" code={selectedPoData.poNo} svg={selectedPoData.poSvg} colorTone="blue" />
                {/* Lot QR */}
                <QrCell label="Lot 批號" code={selectedPoData.lotNo} svg={selectedPoData.lotSvg} colorTone="violet" />
                {/* Box QRs */}
                {selectedPoData.boxSvgs.map((b) => (
                  <QrCell key={b.no} label={`箱號 ${b.no.split("-").pop()}`} code={b.no} svg={b.svg} colorTone="cyan" />
                ))}
              </div>

              <div className="text-[11px] text-slate-500 mt-4 bg-amber-50 border border-amber-200 rounded p-2 print:hidden">
                💡 列印建議：A4 紙 4×6 = 24 張標籤，每張 50×30mm；
                可用 Avery L7159 / TTR 熱轉印機 / 一般 LBP 都行。
                收貨時用手機掃碼 → 系統自動進收貨 Checklist Step 1。
              </div>
            </section>
          )}
        </>
      )}

      {/* 料件 */}
      {tab === "part" && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-3">料件 QR（貼在儲位 / 料盒）</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {partSvgs.map((p) => (
              <QrCell key={p.code} label={p.code} code={p.name} subtitle={p.spec} svg={p.svg} colorTone="green" />
            ))}
          </div>
        </section>
      )}

      {/* 工單 */}
      {tab === "wo" && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-3">工單 QR（貼在製令單 / 投線單）</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {woSvgs.map((w) => (
              <QrCell key={w.woNo} label={w.woNo} code={w.customer} subtitle={w.modelCode} svg={w.svg} colorTone="rose" />
            ))}
          </div>
        </section>
      )}

      {/* 儲位 */}
      {tab === "loc" && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-3">儲位 QR（貼在儲架）</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {locSvgs.map((l) => (
              <QrCell key={l.code} label={l.code} code="儲位" svg={l.svg} colorTone="amber" />
            ))}
          </div>
        </section>
      )}

      {/* 自訂 */}
      {tab === "custom" && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-5">
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">Prefix</span>
                <select value={customPrefix} onChange={(e) => setCustomPrefix(e.target.value as QRPrefix)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono">
                  {(Object.keys(prefixMeta) as QRPrefix[]).map((k) => (
                    <option key={k} value={k}>{k} ({prefixMeta[k].label})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500 font-bold">Value</span>
                <input value={customValue} onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="例：P03SG007-LOT2026-A"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono" />
              </label>
              <div className="text-[11px] text-slate-500 bg-slate-50 rounded p-2">
                <div className="font-bold">完整 QR 內容：</div>
                <code className="font-mono break-all">{customValue.trim() ? `${customPrefix}:${customValue.trim()}` : "—"}</code>
              </div>
            </div>
            <div className="flex items-center justify-center bg-slate-50 rounded-lg p-6">
              {customSvg ? (
                <div className="text-center">
                  <div dangerouslySetInnerHTML={{ __html: customSvg }} className="inline-block bg-white p-3 rounded border border-slate-300" />
                  <div className="mt-2 font-mono text-sm font-bold" style={{ color: prefixMeta[customPrefix].color }}>
                    {prefixMeta[customPrefix].icon} {customPrefix}: {customValue}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">輸入 Value 後即時產生 QR</div>
              )}
            </div>
          </div>
        </section>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed print:hidden">
        <b>📐 整合</b>　所有 QR 用統一 prefix 格式（如 <code className="font-mono">PO:</code>、<code className="font-mono">BOX:</code>），
        掃描後系統自動依 prefix 路由到對應流程（PO → 收貨 Checklist、BOX → 第 1 步比對 ASN、PART → 庫存查詢、WO → 工單追蹤）。
        <b>正式版</b>：與鼎新 INVR60「條碼編號」欄位同步；可選 Code 128 或 QR；列印用 TTR 熱轉印機。
      </p>

      {/* 列印樣式 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { background: white; }
          header, nav, aside, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function QrCell({ label, code, subtitle, svg, colorTone }: {
  label: string; code: string; subtitle?: string; svg: string;
  colorTone: "blue" | "cyan" | "violet" | "green" | "amber" | "rose";
}) {
  const colors = {
    blue: "#0056B3", cyan: "#0891b2", violet: "#7c3aed",
    green: "#10b981", amber: "#f59e0b", rose: "#dc2626",
  };
  return (
    <div className="bg-white rounded-lg border border-slate-300 p-3 text-center print:border-slate-400 print:break-inside-avoid">
      <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: colors[colorTone] }}>{label}</div>
      <div dangerouslySetInnerHTML={{ __html: svg }} className="inline-block" />
      <div className="text-[10px] font-mono font-bold text-slate-800 mt-1 break-all leading-tight">{code}</div>
      {subtitle && <div className="text-[9px] text-slate-500 mt-0.5 break-all">{subtitle}</div>}
    </div>
  );
}
