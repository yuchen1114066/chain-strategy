"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { parseBomAoa, type ParsedBom } from "@/lib/erp/bom-parser";
import { suppliers as existingSuppliers } from "@/lib/erp/seed";

import type { PartKind } from "@/lib/erp/types";

const KIND_LABEL: Record<PartKind, string> = {
  purchase: "採購件",
  self: "自製件",
  dummy: "虛設品號",
  feature: "Feature 件",
  outsource: "託外加工件",
  option: "Option 件",
};

const KIND_TONE: Record<PartKind, string> = {
  purchase: "bg-slate-100 text-slate-700",
  self: "bg-rose-100 text-rose-700",
  dummy: "bg-amber-100 text-amber-700",
  feature: "bg-violet-100 text-violet-700",
  outsource: "bg-cyan-100 text-cyan-700",
  option: "bg-emerald-100 text-emerald-700",
};

export default function ImportPage() {
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedBom | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    setParsed(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      // 用第一個 sheet
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
        header: 1,
        defval: null,
      }) as (string | number | null | undefined)[][];
      const result = parseBomAoa(aoa);
      if (!result.masterCode) {
        setError("解析失敗：找不到階 0 主件。請確認 Excel 結構是否符合祺驊 BOM 格式（A 主件品號 / B 階次 / C 元件品號…）");
        setBusy(false);
        return;
      }
      setParsed(result);
    } catch (e: unknown) {
      setError(`讀檔失敗：${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  }

  const supplierMatches = (parsed?.suppliersFound ?? []).map((name) => {
    const match = existingSuppliers.find((s) => s.name === name || s.name.startsWith(name));
    return { name, match };
  });

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">📥 BOM Excel 匯入</h1>
        <p className="text-sm text-slate-500 mt-1">
          上傳 <b>祺驊 BOM Excel</b>（A~O 欄格式：主件品號 / 階次 / 元件品號 / 品名 / 規格 / 單位 / 屬性 / 標準批量 / 標準用量 / 材料單價 / 標準成本 / 廠商 / 售成本 / 備註）
        </p>
      </header>

      {/* 上傳區 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <label
          htmlFor="bom-file"
          className="block border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-cyan-400 hover:bg-cyan-50/30 cursor-pointer transition-colors"
        >
          <div className="text-5xl mb-3">📊</div>
          <div className="font-medium text-slate-700">
            {fileName ? `已選擇：${fileName}` : "拖曳 .xlsx 到此處，或點擊選擇檔案"}
          </div>
          <div className="text-xs text-slate-500 mt-2">支援 .xlsx / .xls 格式</div>
          <input
            id="bom-file"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
        {busy && <div className="text-sm text-slate-500 mt-3 text-center">解析中…</div>}
        {error && (
          <div className="mt-3 p-3 rounded bg-rose-50 border border-rose-200 text-sm text-rose-800">
            ⚠️ {error}
          </div>
        )}
      </section>

      {/* 解析結果 */}
      {parsed && (
        <>
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">✓ 解析結果摘要</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="主件品號" value={parsed.masterCode} />
              <Stat label="主件名稱" value={parsed.masterName || "—"} />
              <Stat label="標準成本" value={`$${parsed.masterStdCost.toLocaleString()}`} />
              <Stat label="BOM 階層" value={`${parsed.rows.length} 行 / ${maxLevel(parsed.rows)} 階`} />
            </div>
            {parsed.masterSpec && (
              <div className="mt-3 text-xs text-slate-600">
                <span className="text-slate-500">規格：</span>{parsed.masterSpec}
              </div>
            )}
            {parsed.warnings.length > 0 && (
              <details className="mt-3 text-xs">
                <summary className="text-amber-700 cursor-pointer">⚠️ {parsed.warnings.length} 條警告</summary>
                <ul className="mt-1 space-y-0.5 text-slate-600">
                  {parsed.warnings.map((w, i) => <li key={i}>· {w}</li>)}
                </ul>
              </details>
            )}
          </section>

          {/* 廠商比對 */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">廠商比對（{parsed.suppliersFound.length} 家）</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 text-xs">
              {supplierMatches.map((m) => (
                <div
                  key={m.name}
                  className={`px-2 py-1.5 rounded border flex items-center gap-2 ${
                    m.match
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <span className={m.match ? "text-emerald-600" : "text-amber-600"}>
                    {m.match ? "✓" : "+"}
                  </span>
                  <span className="truncate">{m.name}</span>
                  {!m.match && <span className="text-[10px] text-amber-700 ml-auto">新增</span>}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              ✓ 已存在於系統　·　+ 將新增到供應商主檔（預設交期 45 天）
            </p>
          </section>

          {/* BOM 樹狀預覽 */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold mb-3">BOM 預覽（階層樹）</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-2 py-1.5 w-72">階 / 料號 / 名稱</th>
                    <th className="text-left px-2 py-1.5">屬性</th>
                    <th className="text-right px-2 py-1.5">用量</th>
                    <th className="text-left px-2 py-1.5">單位</th>
                    <th className="text-right px-2 py-1.5">單價</th>
                    <th className="text-right px-2 py-1.5">小計</th>
                    <th className="text-left px-2 py-1.5">廠商</th>
                    <th className="text-left px-2 py-1.5">規格</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((r) => (
                    <tr key={`${r.rowNumber}-${r.componentCode}`} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-1.5" style={{ paddingLeft: `${r.level * 16 + 8}px` }}>
                        <span className="text-slate-400 mr-1">{".".repeat(r.level)}{r.level}</span>
                        <span className="font-mono text-cyan-700">{r.componentCode}</span>
                        <div className="text-slate-600 ml-4">{r.name}</div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_TONE[r.kind]}`}>
                          {KIND_LABEL[r.kind]}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.qtyPerUnit}</td>
                      <td className="px-2 py-1.5">{r.unit}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.unitCostNow.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{r.stdCost.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-slate-600">{r.supplierName || "—"}</td>
                      <td className="px-2 py-1.5 text-slate-500 max-w-[200px] truncate" title={r.spec}>{r.spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              ✓ 解析成功 — 目前為「預覽模式」。<b>實際寫入資料庫需 IT 部門開通 Supabase 寫入權限</b>後即可一鍵套用，
              現階段可重複上傳不同 BOM 驗證解析正確性。
            </p>
          </section>
        </>
      )}

      {/* 格式說明 */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <details>
          <summary className="font-bold cursor-pointer text-slate-900">📖 支援的 Excel 欄位格式（已對齊祺驊現有 BOM）</summary>
          <table className="mt-3 w-full">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left py-1">欄</th>
                <th className="text-left py-1">內容</th>
                <th className="text-left py-1">範例</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t"><td>A</td><td>主件品號</td><td className="font-mono">FB11G003</td></tr>
              <tr className="border-t"><td>B</td><td>階次（0 / .1 / ..2 / ....4）</td><td className="font-mono">.1</td></tr>
              <tr className="border-t"><td>C</td><td>元件品號</td><td className="font-mono">P13DA01</td></tr>
              <tr className="border-t"><td>D</td><td>品名</td><td>滾珠軸承</td></tr>
              <tr className="border-t"><td>E</td><td>規格</td><td>NBK 6001 2RS</td></tr>
              <tr className="border-t"><td>F</td><td>單位</td><td>PCS / F / g / SET</td></tr>
              <tr className="border-t"><td>G</td><td>屬性</td><td>自製件 / 採購件 / 虛設品號 / Feature件 / 託外加工件</td></tr>
              <tr className="border-t"><td>H</td><td>標準批量</td><td className="font-mono">1.00</td></tr>
              <tr className="border-t"><td>I</td><td>標準用量</td><td className="font-mono">2.00</td></tr>
              <tr className="border-t"><td>J</td><td>材料單價（目前+未來）</td><td className="font-mono">9.10</td></tr>
              <tr className="border-t"><td>K</td><td>標準成本</td><td className="font-mono">18.20</td></tr>
              <tr className="border-t"><td>L</td><td>廠商</td><td>莊宏億 / 祺驊（越南）</td></tr>
              <tr className="border-t"><td>M</td><td>材料單價（2023.01）</td><td className="font-mono">9.10</td></tr>
              <tr className="border-t"><td>N</td><td>售成本</td><td className="font-mono">18.20</td></tr>
              <tr className="border-t"><td>O</td><td>備註</td><td>—</td></tr>
            </tbody>
          </table>
        </details>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-base tabular-nums truncate" title={value}>{value}</div>
    </div>
  );
}

function maxLevel(rows: { level: number }[]): number {
  return rows.reduce((m, r) => (r.level > m ? r.level : m), 0);
}
