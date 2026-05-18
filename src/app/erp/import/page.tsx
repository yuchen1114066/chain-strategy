"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  parseDingxinReport,
  REPORT_LABEL,
  type ParsedDingxin,
} from "@/lib/erp/dingxin-parser";

export default function DingxinSyncPage() {
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedDingxin | null>(null);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string>("");

  async function handleFile(file: File) {
    setBusy(true);
    setError("");
    setParsed(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      // SheetJS 同時支援 .xls (BIFF) 與 .xlsx
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(
        sheet,
        { header: 1, defval: null }
      ) as (string | number | null | undefined)[][];
      const result = parseDingxinReport(aoa);
      if (result.type === "unknown") {
        setError(
          "無法辨識報表類型。本系統支援鼎新 INVR60 品號主檔 / LRPR05 庫存報表 / BOMR05 BOM 報表 / CSTR07 製令成本。請確認匯出的是這 4 種報表之一。"
        );
        setBusy(false);
        return;
      }
      setParsed(result);
      setSyncedAt(new Date().toISOString());
    } catch (e: unknown) {
      setError(`讀檔失敗：${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
  }

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">📥 鼎新報表同步（單向讀取）</h1>
        <p className="text-sm text-slate-500 mt-1">
          上傳鼎新 ERP iGP 匯出的報表 → 系統自動辨識並解析 →
          倉庫掃 QR 即可查詢。<b className="text-emerald-700">純讀取，不回寫鼎新。</b>
        </p>
      </header>

      {/* 資料流程說明 */}
      <section className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm">
        <div className="font-bold text-cyan-900 mb-2">🔗 單向資料流程</div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded bg-white border font-semibold">鼎新 ERP iGP</span>
          <span className="text-cyan-700">→ IT 定期匯出 4 報表 →</span>
          <span className="px-3 py-1.5 rounded bg-white border font-semibold">本系統解析</span>
          <span className="text-cyan-700">→ 倉庫掃 QR →</span>
          <span className="px-3 py-1.5 rounded bg-white border font-semibold">即時查詢</span>
          <span className="text-rose-600 font-bold">（不回寫）</span>
        </div>
      </section>

      {/* 4 報表對照 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { code: "INVR60", name: "品號主檔", use: "掃 QR 對應料件（含條碼編號）" },
          { code: "LRPR05", name: "庫存報表", use: "顯示即時庫存可用量" },
          { code: "BOMR05", name: "BOM 報表", use: "多階 BOM 展開" },
          { code: "CSTR07", name: "製令成本", use: "工單 / 成本追蹤" },
        ].map((r) => (
          <div key={r.code} className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="font-mono text-xs text-cyan-700 font-bold">{r.code}</div>
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-[11px] text-slate-500 mt-1">{r.use}</div>
          </div>
        ))}
      </section>

      {/* 上傳區 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <label
          htmlFor="dx-file"
          className="block border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:border-cyan-400 hover:bg-cyan-50/30 cursor-pointer transition-colors"
        >
          <div className="text-5xl mb-3">📊</div>
          <div className="font-medium text-slate-700">
            {fileName ? `已選擇：${fileName}` : "拖曳鼎新報表 .xls / .xlsx 到此，或點擊選擇"}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            自動辨識 INVR60 / LRPR05 / BOMR05 / CSTR07
          </div>
          <input
            id="dx-file"
            type="file"
            accept=".xls,.xlsx"
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

      {parsed && parsed.type !== "unknown" && (
        <>
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="font-bold">
                ✓ 已辨識：{REPORT_LABEL[parsed.type]}
              </h2>
              <span className="text-xs text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                同步於 {syncedAt.slice(11, 19)}　·　{parsed.rows.length} 筆
              </span>
            </div>
            {parsed.type === "item_master" && <ItemMasterPreview rows={parsed.rows} />}
            {parsed.type === "stock" && <StockPreview rows={parsed.rows} />}
            {parsed.type === "stock_qty" && <StockPreview rows={parsed.rows} />}
            {parsed.type === "stock_inout" && <StockPreview rows={parsed.rows} />}
            {parsed.type === "bom" && <BomPreview rows={parsed.rows} />}
            {parsed.type === "wo_cost" && <WoCostPreview rows={parsed.rows} />}
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
            <b>📌 上線方式：</b>本頁目前為「解析驗證」模式。正式部署時 IT 設定鼎新定期匯出（每日 / 每班）
            這 4 報表到指定資料夾，系統自動讀取，倉庫掃 QR 即看到最新數字 —— 全程單向，不回寫鼎新。
          </section>
        </>
      )}

      {/* IT 部署說明 */}
      <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
        <details>
          <summary className="font-bold cursor-pointer text-slate-900">
            🛠️ 給 IT：鼎新報表匯出對照
          </summary>
          <table className="mt-3 w-full">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left py-1">鼎新報表代碼</th>
                <th className="text-left py-1">用途</th>
                <th className="text-left py-1">關鍵欄位</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t"><td>INVR60</td><td>品號主檔</td><td>品號 / 條碼編號 / 品名 / 規格 / 主要庫別 / 廠商名稱 / 品號屬性</td></tr>
              <tr className="border-t"><td>LRPR05</td><td>庫存報表</td><td>品號 / 異動別（庫存可用量）/ 預計結存 / 計劃進貨</td></tr>
              <tr className="border-t"><td>BOMR05</td><td>BOM 報表</td><td>元件品號 / 階次 / 主件品號 / 組成用量 / 屬性</td></tr>
              <tr className="border-t"><td>CSTR07</td><td>製令成本</td><td>製令編號 / 產品品號 / 已生產量 / 材料/人工/製造成本</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-slate-500">
            匯出格式 .xls 或 .xlsx 皆可。系統依標題列關鍵欄位自動判型，IT 不需手動指定報表類型。
          </p>
        </details>
      </section>
    </div>
  );
}

// ── 各報表預覽 ──
function ItemMasterPreview({ rows }: { rows: import("@/lib/erp/dingxin-parser").DxItem[] }) {
  const withBarcode = rows.filter((r) => r.barcode).length;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
        <Stat label="料件總數" value={`${rows.length}`} />
        <Stat label="有條碼" value={`${withBarcode}`} hint="可掃 QR" />
        <Stat label="庫別數" value={`${new Set(rows.map((r) => r.warehouseName).filter(Boolean)).size}`} />
        <Stat label="供應商數" value={`${new Set(rows.map((r) => r.supplier).filter(Boolean)).size}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-2 py-1.5">品號</th>
              <th className="text-left px-2 py-1.5">條碼</th>
              <th className="text-left px-2 py-1.5">品名 / 規格</th>
              <th className="text-left px-2 py-1.5">屬性</th>
              <th className="text-left px-2 py-1.5">主庫別</th>
              <th className="text-left px-2 py-1.5">廠商</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5 font-mono text-cyan-700">{r.code}</td>
                <td className="px-2 py-1.5 font-mono text-slate-500">{r.barcode || "—"}</td>
                <td className="px-2 py-1.5">{r.name}<span className="text-slate-400 ml-1">{r.spec}</span></td>
                <td className="px-2 py-1.5 text-slate-600">{r.kind}</td>
                <td className="px-2 py-1.5">{r.warehouseName || r.mainWarehouse}</td>
                <td className="px-2 py-1.5 text-slate-600">{r.supplier || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 30 && <p className="text-[11px] text-slate-400 mt-2">… 共 {rows.length} 筆，僅顯示前 30</p>}
    </>
  );
}

function StockPreview({ rows }: { rows: import("@/lib/erp/dingxin-parser").DxStock[] }) {
  const lowStock = rows.filter((r) => r.belowSafety).length;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
        <Stat label="品號數" value={`${rows.length}`} />
        <Stat label="低於安全量" value={`${lowStock}`} hint="需注意" />
        <Stat label="有計劃進貨" value={`${rows.filter((r) => r.incoming.length > 0).length}`} />
        <Stat label="可用量總計" value={rows.reduce((s, r) => s + r.available, 0).toLocaleString()} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-2 py-1.5">品號</th>
              <th className="text-left px-2 py-1.5">品名 / 規格</th>
              <th className="text-right px-2 py-1.5">庫存可用量</th>
              <th className="text-right px-2 py-1.5">計劃進貨</th>
              <th className="text-left px-2 py-1.5">最近到貨</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r, i) => {
              const nextIn = r.incoming[0];
              return (
                <tr key={i} className={`border-t border-slate-100 ${r.belowSafety ? "bg-rose-50/40" : ""}`}>
                  <td className="px-2 py-1.5 font-mono text-cyan-700">{r.code}</td>
                  <td className="px-2 py-1.5">{r.name}<span className="text-slate-400 ml-1">{r.spec}</span></td>
                  <td className={`px-2 py-1.5 text-right tabular-nums font-bold ${r.belowSafety ? "text-rose-600" : ""}`}>
                    {r.available} {r.unit}{r.belowSafety && " ⚠"}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">
                    {r.incoming.reduce((s, x) => s + x.qty, 0) || "—"}
                  </td>
                  <td className="px-2 py-1.5 text-slate-500">
                    {nextIn ? `${nextIn.date} +${nextIn.qty}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 30 && <p className="text-[11px] text-slate-400 mt-2">… 共 {rows.length} 筆，僅顯示前 30</p>}
    </>
  );
}

function BomPreview({ rows }: { rows: import("@/lib/erp/dingxin-parser").DxBomLine[] }) {
  const masters = new Set(rows.filter((r) => r.level === 0).map((r) => r.componentCode));
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
        <Stat label="BOM 行數" value={`${rows.length}`} />
        <Stat label="主件數" value={`${masters.size}`} />
        <Stat label="最深階" value={`${rows.reduce((m, r) => Math.max(m, r.level), 0)} 階`} />
        <Stat label="自製/採購" value={`${rows.filter((r) => r.kind.includes("自製")).length}/${rows.filter((r) => r.kind.includes("採購")).length}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-2 py-1.5">階</th>
              <th className="text-left px-2 py-1.5">元件品號</th>
              <th className="text-left px-2 py-1.5">主件品號</th>
              <th className="text-left px-2 py-1.5">品名</th>
              <th className="text-left px-2 py-1.5">屬性</th>
              <th className="text-right px-2 py-1.5">組成用量</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5 text-slate-400 font-mono">{".".repeat(r.level)}{r.level}</td>
                <td className="px-2 py-1.5 font-mono text-cyan-700">{r.componentCode}</td>
                <td className="px-2 py-1.5 font-mono text-slate-500">{r.masterCode || "—"}</td>
                <td className="px-2 py-1.5">{r.name}</td>
                <td className="px-2 py-1.5 text-slate-600">{r.kind}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.qtyPerUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 30 && <p className="text-[11px] text-slate-400 mt-2">… 共 {rows.length} 筆，僅顯示前 30</p>}
    </>
  );
}

function WoCostPreview({ rows }: { rows: import("@/lib/erp/dingxin-parser").DxWoCost[] }) {
  const totalMat = rows.reduce((s, r) => s + r.materialCost, 0);
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
        <Stat label="製令數（去重）" value={`${rows.length}`} />
        <Stat label="材料成本合計" value={`$${(totalMat / 10000).toFixed(0)}萬`} />
        <Stat label="已完工" value={`${rows.filter((r) => r.finishDate).length}`} />
        <Stat label="生產中" value={`${rows.filter((r) => r.startDate && !r.finishDate).length}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-2 py-1.5">製令編號</th>
              <th className="text-left px-2 py-1.5">產品品號</th>
              <th className="text-left px-2 py-1.5">品名</th>
              <th className="text-right px-2 py-1.5">已生產</th>
              <th className="text-left px-2 py-1.5">開工 / 完工</th>
              <th className="text-right px-2 py-1.5">材料成本</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5 font-mono text-cyan-700">{r.woNo}</td>
                <td className="px-2 py-1.5 font-mono">{r.productCode}</td>
                <td className="px-2 py-1.5">{r.productName}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{r.producedQty}</td>
                <td className="px-2 py-1.5 text-slate-500">{r.startDate} / {r.finishDate || "—"}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">${r.materialCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 30 && <p className="text-[11px] text-slate-400 mt-2">… 共 {rows.length} 筆，僅顯示前 30</p>}
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-base tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
    </div>
  );
}
