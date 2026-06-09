"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  loadMeta,
  saveItems,
  saveBom,
  savePurchases,
  clearAll,
  type MasterDataMeta,
} from "@/lib/erp/master-data-store";
import {
  readFile,
  detectColumns,
  parseItems,
  parseBom,
  parsePurchases,
  type ParsedFile,
  type ColumnMapping,
  type ParseReport,
} from "@/lib/erp/master-data-parser";
import type { ItemMaster, BomEntry, PurchaseRecord } from "@/lib/erp/master-data-store";

// ============================================================
// ERP 主檔上傳（本地 IndexedDB · 不上雲端）
//
// 三張表獨立上傳：料件主檔 / BOM / 採購歷史
// 流程：拖檔 → 自動偵測欄位 → 預覽 → 確認儲存
// ============================================================

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  page: "#fbfcfa", card: "#ffffff",
  border: "#e9ece3", borderHi: "#dadfd0",
  red: "#d4351c", redSoft: "#fdecea",
  amber: "#b8860b", amberSoft: "#fffaf0",
  blue: "#3a6ea5",
} as const;
const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";
const FONT_HEAD = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

type Section = "items" | "bom" | "purchases";

const SECTION_INFO: Record<Section, {
  icon: string;
  title: string;
  en: string;
  desc: string;
  hint: string;
  requiredFields: string[];
}> = {
  items: {
    icon: "📦",
    title: "料件主檔",
    en: "Item Master",
    desc: "料號 + 品名 + 商品分類 — 報價單上傳後系統用此表查到完整品名與分類",
    hint: "鼎新匯出路徑：庫存管理 → 料件基本資料 → 匯出 Excel（建議勾選：品號 / 品名 / 規格 / 大類碼 / 庫存單位）",
    requiredFields: ["料號（partNo）", "品名（name）"],
  },
  bom: {
    icon: "🔗",
    title: "BOM 結構",
    en: "Bill of Materials",
    desc: "成品 → 子料的用量結構 — Should-Cost 推導用此表加權每個成本成分",
    hint: "鼎新匯出路徑：BOM 管理 → 單階 BOM 表 → 匯出 Excel（建議勾選：母件品號 / 用料品號 / 用量）",
    requiredFields: ["父料號（parentPartNo）", "子料號（childPartNo）", "用量（qty）"],
  },
  purchases: {
    icon: "💰",
    title: "採購歷史",
    en: "Purchase History",
    desc: "過去 3-6 年實際採購單價 — 用來畫歷年漲價曲線、找替代供應商、判斷是否被供應商獅子大開口",
    hint: "鼎新匯出路徑：採購管理 → 採購單明細查詢 → 設日期範圍 → 匯出 Excel（建議勾選：單號 / 品號 / 廠商 / 單價 / 數量 / 日期）",
    requiredFields: ["料號（partNo）", "供應商（supplier）", "單價（unitPrice）", "日期（date）"],
  },
};

export default function MasterDataPage() {
  const [meta, setMeta] = useState<MasterDataMeta>({
    itemCount: 0,
    bomCount: 0,
    purchaseCount: 0,
  });
  const [toast, setToast] = useState<string>("");

  const refreshMeta = useCallback(async () => {
    setMeta(await loadMeta());
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div style={{ background: BR.page, color: BR.ink, fontFamily: FONT, minHeight: "100vh" }}>
      <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-7">

        {/* 麵包屑 */}
        <nav style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>
          <Link href="/erp" style={{ color: BR.greenDeep }}>ERP</Link>
          <span className="px-2">/</span>
          <Link href="/erp/quotation-analyzer" style={{ color: BR.greenDeep }}>Quotation Analyzer</Link>
          <span className="px-2">/</span>
          <span style={{ color: BR.ink }}>Master Data Setup</span>
        </nav>

        {/* 標題 */}
        <header className="space-y-2">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.greenDeep, letterSpacing: "0.08em" }}>
            SETUP · ERP MASTER DATA · 本地儲存 / 不上雲端
          </div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 800, color: BR.ink, lineHeight: 1.2 }}>
            上傳 ERP 主檔 → 啟用 STEP 2-5 真實分析
          </h1>
          <p style={{ fontSize: 14, color: BR.inkSoft, lineHeight: 1.65, maxWidth: 880 }}>
            這頁讓你把鼎新 TOPGP 匯出的<b style={{ color: BR.ink }}> 料件主檔、BOM、採購歷史</b> 三張 Excel 上傳，
            存在你<b style={{ color: BR.ink }}>本機瀏覽器</b>（IndexedDB，不傳雲端）。
            上傳後，報價分析頁的 STEP 2-5 會用這份真實資料，而非寫死的示範值。
            建議每月更新一次採購歷史、每季更新一次料件與 BOM。
          </p>
        </header>

        {/* 目前狀態 */}
        <StatusOverview meta={meta} />

        {/* 三個上傳區塊 */}
        <UploadSection
          section="items"
          onSave={async (rows) => {
            await saveItems(rows as ItemMaster[]);
            await refreshMeta();
            showToast(`✓ 已儲存 ${rows.length} 筆料件主檔`);
          }}
        />
        <UploadSection
          section="bom"
          onSave={async (rows) => {
            await saveBom(rows as BomEntry[]);
            await refreshMeta();
            showToast(`✓ 已儲存 ${rows.length} 筆 BOM 結構`);
          }}
        />
        <UploadSection
          section="purchases"
          onSave={async (rows) => {
            await savePurchases(rows as PurchaseRecord[]);
            await refreshMeta();
            showToast(`✓ 已儲存 ${rows.length} 筆採購歷史`);
          }}
        />

        {/* 危險區：清空 */}
        <DangerZone onClear={async () => {
          await clearAll();
          await refreshMeta();
          showToast("✓ 已清空所有主檔");
        }} />

        <footer className="flex items-center gap-4 pt-4" style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint,
        }}>
          <Link href="/erp/quotation-analyzer" style={{ color: BR.greenDeep, textDecoration: "underline" }}>
            → 回 Quotation Analyzer
          </Link>
          <span className="flex-1" />
          <span>CHI HUA AI · ERP Master Data · /erp/master-data</span>
        </footer>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg" style={{
          background: BR.greenInk, color: "#fff", fontFamily: FONT_MONO, fontSize: 13,
          maxWidth: 420, zIndex: 50,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 目前狀態總覽
// ============================================================
function StatusOverview({ meta }: { meta: MasterDataMeta }) {
  const cells: Array<{ label: string; count: number; updatedAt?: string; tone: string }> = [
    { label: "料件主檔", count: meta.itemCount, updatedAt: meta.itemUpdatedAt, tone: BR.green },
    { label: "BOM 結構", count: meta.bomCount, updatedAt: meta.bomUpdatedAt, tone: BR.blue },
    { label: "採購歷史", count: meta.purchaseCount, updatedAt: meta.purchaseUpdatedAt, tone: BR.amber },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-[12px] p-4" style={{
          background: BR.card, border: `1px solid ${BR.border}`,
        }}>
          <div className="flex items-baseline justify-between mb-1">
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.06em" }}>
              {c.label}
            </span>
            <span style={{
              fontSize: 10, fontFamily: FONT_MONO,
              color: c.count > 0 ? "#fff" : BR.inkFaint,
              background: c.count > 0 ? c.tone : "transparent",
              border: c.count > 0 ? "none" : `1px solid ${BR.border}`,
              padding: "2px 8px", borderRadius: 4,
            }}>
              {c.count > 0 ? "● 已上傳" : "○ 尚未上傳"}
            </span>
          </div>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700,
            color: c.count > 0 ? c.tone : BR.inkFaint, lineHeight: 1.1,
          }}>
            {c.count.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: BR.inkFaint, marginTop: 2 }}>
            {c.updatedAt ? `最後更新：${fmtTs(c.updatedAt)}` : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtTs(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ============================================================
// 上傳區塊（拖檔 + 自動偵測 + 預覽 + 儲存）
// ============================================================
type StagedState =
  | { kind: "empty" }
  | { kind: "parsing"; fileName: string }
  | { kind: "ready"; fileName: string; parsed: ParsedFile; mapping: ColumnMapping; report: ParseReport<unknown> }
  | { kind: "error"; message: string };

function UploadSection({
  section,
  onSave,
}: {
  section: Section;
  onSave: (rows: unknown[]) => Promise<void>;
}) {
  const info = SECTION_INFO[section];
  const [state, setState] = useState<StagedState>({ kind: "empty" });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setState({ kind: "parsing", fileName: file.name });
    try {
      const parsed = await readFile(file);
      if (parsed.rows.length === 0) {
        setState({ kind: "error", message: "檔案沒有任何資料列（第一頁工作表是空的？）" });
        return;
      }
      const mapping = detectColumns(parsed.headers);
      const report = parseRows(section, parsed, mapping);
      setState({ kind: "ready", fileName: file.name, parsed, mapping, report });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "檔案無法解析" });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const remap = (field: string, header: string) => {
    if (state.kind !== "ready") return;
    const newMapping: ColumnMapping = { ...state.mapping, [field]: header || undefined };
    const report = parseRows(section, state.parsed, newMapping);
    setState({ ...state, mapping: newMapping, report });
  };

  return (
    <div className="rounded-[14px]" style={{
      background: BR.card, border: `1px solid ${BR.border}`,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "20px 22px",
    }}>
      {/* 標題列 */}
      <div className="flex items-start gap-4 mb-4">
        <div style={{ fontSize: 32, lineHeight: 1 }}>{info.icon}</div>
        <div className="flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 800, color: BR.ink, margin: 0 }}>
              {info.title}
            </h2>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>
              {info.en}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: BR.inkSoft, lineHeight: 1.55, marginTop: 4 }}>
            {info.desc}
          </p>
          <div className="mt-2 p-2 rounded-[6px]" style={{
            background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
            fontFamily: FONT_MONO, fontSize: 11, color: BR.greenInk, lineHeight: 1.5,
          }}>
            💡 {info.hint}
          </div>
        </div>
      </div>

      {/* 拖檔區 */}
      {state.kind === "empty" || state.kind === "error" ? (
        <div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className="block cursor-pointer rounded-[10px] text-center transition-colors"
            style={{
              border: `2px dashed ${dragOver ? BR.green : BR.borderHi}`,
              background: dragOver ? BR.greenSoft : "#fbfcfa",
              padding: "28px 20px",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onPick}
              className="hidden"
            />
            <div style={{ fontSize: 13, color: BR.ink, fontWeight: 600 }}>
              拖檔到這裡，或<span style={{ color: BR.greenDeep, textDecoration: "underline" }}>點選檔案</span>
            </div>
            <div style={{ fontSize: 11, color: BR.inkFaint, marginTop: 4, fontFamily: FONT_MONO }}>
              支援 .csv · .xlsx · .xls · 必要欄位：{info.requiredFields.join(" · ")}
            </div>
          </label>
          {state.kind === "error" && (
            <div className="mt-2 p-2 rounded-[6px]" style={{
              background: BR.redSoft, border: `1px solid ${BR.red}`,
              fontSize: 12, color: BR.red,
            }}>
              ⚠ {state.message}
            </div>
          )}
        </div>
      ) : state.kind === "parsing" ? (
        <div className="rounded-[10px] p-5 text-center" style={{
          background: "#fbfcfa", border: `1px solid ${BR.border}`,
          fontSize: 13, color: BR.inkSoft,
        }}>
          解析中：{state.fileName} ...
        </div>
      ) : (
        <PreviewPanel
          section={section}
          parsed={state.parsed}
          mapping={state.mapping}
          report={state.report}
          fileName={state.fileName}
          onRemap={remap}
          onCancel={() => setState({ kind: "empty" })}
          onConfirm={async () => {
            await onSave(state.report.rows);
            setState({ kind: "empty" });
          }}
        />
      )}
    </div>
  );
}

function parseRows(section: Section, parsed: ParsedFile, mapping: ColumnMapping): ParseReport<unknown> {
  if (section === "items") return parseItems(parsed, mapping);
  if (section === "bom") return parseBom(parsed, mapping);
  return parsePurchases(parsed, mapping);
}

// ============================================================
// 預覽面板 — 顯示欄位 mapping + 前 5 筆 + 警告
// ============================================================
const REQUIRED_FIELDS_BY_SECTION: Record<Section, { key: string; label: string; required: boolean }[]> = {
  items: [
    { key: "partNo", label: "料號 *", required: true },
    { key: "name", label: "品名", required: false },
    { key: "spec", label: "規格", required: false },
    { key: "category", label: "商品分類", required: false },
    { key: "unit", label: "單位", required: false },
  ],
  bom: [
    { key: "parentPartNo", label: "父料號 *", required: true },
    { key: "childPartNo", label: "子料號 *", required: true },
    { key: "qty", label: "用量", required: false },
    { key: "unit", label: "單位", required: false },
    { key: "level", label: "階層", required: false },
  ],
  purchases: [
    { key: "partNo", label: "料號 *", required: true },
    { key: "supplier", label: "供應商 *", required: true },
    { key: "unitPrice", label: "單價 *", required: true },
    { key: "qty", label: "數量", required: false },
    { key: "date", label: "日期", required: false },
    { key: "poNo", label: "採購單號", required: false },
    { key: "currency", label: "幣別", required: false },
  ],
};

function PreviewPanel({
  section,
  parsed,
  mapping,
  report,
  fileName,
  onRemap,
  onCancel,
  onConfirm,
}: {
  section: Section;
  parsed: ParsedFile;
  mapping: ColumnMapping;
  report: ParseReport<unknown>;
  fileName: string;
  onRemap: (field: string, header: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const fields = REQUIRED_FIELDS_BY_SECTION[section];
  const missingRequired = fields.some(f => f.required && !mapping[f.key as keyof ColumnMapping]);
  const preview = report.rows.slice(0, 5) as Record<string, unknown>[];
  const previewKeys = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <div className="space-y-3">
      {/* 檔案列 */}
      <div className="flex items-center gap-3 flex-wrap" style={{
        fontFamily: FONT_MONO, fontSize: 11, color: BR.inkSoft,
      }}>
        <span style={{
          background: BR.greenInk, color: "#fff",
          padding: "3px 8px", borderRadius: 4, fontWeight: 700,
        }}>📎 {fileName}</span>
        <span>共 {parsed.rows.length.toLocaleString()} 列 → 解析出 <b style={{ color: BR.greenDeep }}>{report.rows.length.toLocaleString()}</b> 筆有效資料</span>
      </div>

      {/* 欄位 mapping */}
      <div className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, marginBottom: 8, letterSpacing: "0.06em" }}>
          欄位對應（系統自動偵測，如有錯可手動改）
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {fields.map((f) => {
            const current = mapping[f.key as keyof ColumnMapping] ?? "";
            const isOk = !!current;
            return (
              <label key={f.key} className="block">
                <div style={{ fontSize: 11, color: f.required ? BR.ink : BR.inkSoft, marginBottom: 2 }}>
                  {f.label}
                </div>
                <select
                  value={current}
                  onChange={(e) => onRemap(f.key, e.target.value)}
                  className="w-full rounded-[6px] px-2 py-1.5"
                  style={{
                    fontFamily: FONT_MONO, fontSize: 11.5,
                    border: `1px solid ${f.required && !isOk ? BR.red : BR.border}`,
                    background: isOk ? "#fff" : (f.required ? BR.redSoft : "#fff"),
                    color: BR.ink,
                  }}
                >
                  <option value="">— 未對應 —</option>
                  {parsed.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </div>

      {/* 警告 */}
      {report.warnings.length > 0 && (
        <div className="rounded-[8px] p-3" style={{
          background: BR.amberSoft, border: `1px solid ${BR.amber}`,
          fontSize: 12, color: BR.amber, lineHeight: 1.6,
        }}>
          {report.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* 預覽前 5 筆 */}
      {preview.length > 0 && (
        <div className="rounded-[8px] overflow-hidden" style={{ border: `1px solid ${BR.border}` }}>
          <div style={{
            background: BR.greenInk, color: "#fff", padding: "6px 10px",
            fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
          }}>
            預覽前 5 筆 · 確認是不是你要的資料
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: "100%", fontFamily: FONT_MONO, fontSize: 11, borderCollapse: "collapse" }}>
              <thead style={{ background: "#f6f8f2" }}>
                <tr>
                  {previewKeys.map(k => (
                    <th key={k} style={{
                      padding: "6px 10px", textAlign: "left",
                      color: BR.ink, fontWeight: 700,
                      borderBottom: `1px solid ${BR.border}`,
                    }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fbfcfa" }}>
                    {previewKeys.map(k => (
                      <td key={k} style={{
                        padding: "6px 10px", color: BR.inkSoft,
                        borderBottom: `1px solid ${BR.border}`,
                        whiteSpace: "nowrap",
                      }}>
                        {String((row[k] ?? "") as string | number)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 動作列 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onConfirm}
          disabled={missingRequired || report.rows.length === 0}
          className="px-4 py-2 rounded-[8px] font-bold transition-opacity"
          style={{
            background: BR.green, color: "#fff",
            fontSize: 13,
            opacity: (missingRequired || report.rows.length === 0) ? 0.4 : 1,
            cursor: (missingRequired || report.rows.length === 0) ? "not-allowed" : "pointer",
          }}
        >
          ✓ 確認儲存 {report.rows.length.toLocaleString()} 筆
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-[8px]"
          style={{
            background: "transparent", color: BR.inkSoft,
            border: `1px solid ${BR.border}`, fontSize: 13,
          }}
        >
          取消
        </button>
        {missingRequired && (
          <span style={{ fontSize: 11, color: BR.red }}>
            ⚠ 必填欄位（*）未對應，請從上方下拉選單指定
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 清空全部（含確認）
// ============================================================
function DangerZone({ onClear }: { onClear: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="rounded-[10px] p-3 flex items-center gap-3 flex-wrap" style={{
      background: "#fbfcfa", border: `1px dashed ${BR.border}`,
    }}>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>
        危險區：
      </span>
      {confirming ? (
        <>
          <span style={{ fontSize: 12, color: BR.red }}>確定要清空料件 / BOM / 採購歷史三張表嗎？</span>
          <button
            onClick={() => { onClear(); setConfirming(false); }}
            className="px-3 py-1 rounded-[6px]"
            style={{ background: BR.red, color: "#fff", fontSize: 12, fontWeight: 700 }}
          >是，清空</button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1 rounded-[6px]"
            style={{ background: "transparent", color: BR.inkSoft, border: `1px solid ${BR.border}`, fontSize: 12 }}
          >取消</button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="px-3 py-1 rounded-[6px]"
          style={{ background: "transparent", color: BR.red, border: `1px solid ${BR.red}`, fontSize: 11.5 }}
        >🗑 清空全部主檔
        </button>
      )}
    </div>
  );
}
