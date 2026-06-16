"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  loadMeta,
  saveItems,
  saveBom,
  savePurchases,
  upsertItems,
  replaceBomForParent,
  appendPurchases,
  logUpload,
  loadRecentLogs,
  clearAll,
  type MasterDataMeta,
  type UploadLog,
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
  // 鼎新 Workflow / iGP 標準報表代碼（給使用者明確知道要從哪一支出 Excel）
  reportCodes: { code: string; name: string; preferred?: boolean }[];
}> = {
  items: {
    icon: "📦",
    title: "料件主檔",
    en: "Item Master",
    desc: "料號 + 品名 + 商品分類 — 報價單上傳後系統用此表查到完整品名與分類",
    hint: "鼎新匯出路徑：庫存管理 → 料件基本資料 → 匯出 Excel（建議勾選：品號 / 品名 / 規格 / 大類碼 / 庫存單位）",
    requiredFields: ["料號（partNo）", "品名（name）"],
    reportCodes: [
      { code: "INVI03", name: "料件基本資料維護（進階查詢 → 匯出）", preferred: true },
      { code: "INVR101", name: "料件主檔清單" },
      { code: "INV101", name: "品號查詢報表" },
    ],
  },
  bom: {
    icon: "🔗",
    title: "BOM 結構",
    en: "Bill of Materials",
    desc: "成品 → 子料的用量結構 — Should-Cost 推導用此表加權每個成本成分",
    hint: "鼎新匯出路徑：BOM 管理 → 單階 BOM 表 → 匯出 Excel（建議勾選：母件品號 / 用料品號 / 用量）",
    requiredFields: ["父料號（parentPartNo）", "子料號（childPartNo）", "用量（qty）"],
    reportCodes: [
      { code: "BOMR05", name: "BOM 多階正展列表（推薦）", preferred: true },
      { code: "BOMI01", name: "用料清單維護（單階）" },
      { code: "BOM210", name: "BOM 多階正展列表（紙本掃描可走 OCR）" },
    ],
  },
  purchases: {
    icon: "💰",
    title: "採購歷史",
    en: "Purchase History",
    desc: "過去 3-6 年實際採購單價 — 用來畫歷年漲價曲線、找替代供應商、判斷是否被供應商獅子大開口",
    hint: "鼎新匯出路徑：採購管理 → 採購單明細查詢 → 設日期範圍 → 匯出 Excel（建議勾選：單號 / 品號 / 廠商 / 單價 / 數量 / 日期）",
    requiredFields: ["料號（partNo）", "供應商（supplier）", "單價（unitPrice）", "日期（date）"],
    reportCodes: [
      { code: "PURR06", name: "採購單身查詢（推薦 · 含廠商 + 單價）", preferred: true },
      { code: "PURR05", name: "採購單明細列印" },
      { code: "PURR01", name: "採購單明細查詢" },
    ],
  },
};

export default function MasterDataPage() {
  const [meta, setMeta] = useState<MasterDataMeta>({
    itemCount: 0,
    bomCount: 0,
    purchaseCount: 0,
  });
  const [toast, setToast] = useState<string>("");
  const [logs, setLogs] = useState<UploadLog[]>([]);

  const refresh = useCallback(async () => {
    const [m, l] = await Promise.all([loadMeta(), loadRecentLogs(20)]);
    setMeta(m);
    setLogs(l);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

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

        {/* 資料的消費者頁面 — 讓使用者看見上傳 → 哪些頁面立刻變強，閉環關係 */}
        <DataConsumersPanel meta={meta} />

        {/* 上傳紀錄 — 一眼看出剛剛丟的有沒有進來 */}
        <RecentUploadsPanel logs={logs} onRefresh={refresh} />

        {/* 鼎新報表 OCR — PR-4 */}
        <ReportOcrSection
          onSaved={async (msg) => {
            await refresh();
            showToast(msg);
          }}
        />

        {/* 三個上傳區塊 */}
        <UploadSection
          section="items"
          onSave={async (rows, { fileName }) => {
            await saveItems(rows as ItemMaster[]);
            await logUpload({ ts: Date.now(), type: "items", source: "csv", count: rows.length, fileName });
            await refresh();
            showToast(`✓ 已儲存 ${rows.length} 筆料件主檔`);
          }}
        />
        <UploadSection
          section="bom"
          onSave={async (rows, { fileName }) => {
            await saveBom(rows as BomEntry[]);
            await logUpload({ ts: Date.now(), type: "bom", source: "csv", count: rows.length, fileName });
            await refresh();
            showToast(`✓ 已儲存 ${rows.length} 筆 BOM 結構`);
          }}
        />
        <UploadSection
          section="purchases"
          onSave={async (rows, { fileName }) => {
            await savePurchases(rows as PurchaseRecord[]);
            await logUpload({ ts: Date.now(), type: "purchases", source: "csv", count: rows.length, fileName });
            await refresh();
            showToast(`✓ 已儲存 ${rows.length} 筆採購歷史`);
          }}
        />

        {/* 危險區：清空 */}
        <DangerZone onClear={async () => {
          await clearAll();
          await refresh();
          showToast("✓ 已清空所有主檔");
        }} />

        {/* 進階：直連 ERP 測試 */}
        <ErpDirectConnectPanel />

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
// 最近上傳紀錄 — 一眼看出「我剛剛丟的」有沒有真的進來
//
// 每次 CSV / OCR 寫入後都會 logUpload，這裡顯示最近 N 筆。
// 沒有任何上傳時 → 改顯示 hint「還沒有任何上傳紀錄」。
// ============================================================
function RecentUploadsPanel({ logs, onRefresh }: { logs: UploadLog[]; onRefresh: () => void | Promise<void> }) {
  const [open, setOpen] = useState(true);

  if (logs.length === 0) {
    return (
      <div className="rounded-[10px] p-3 flex items-center gap-3 flex-wrap" style={{
        background: "#fbfcfa", border: `1px dashed ${BR.border}`,
        fontFamily: FONT_MONO, fontSize: 11.5, color: BR.inkFaint, lineHeight: 1.55,
      }}>
        <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, color: BR.ink, fontSize: 13 }}>📜 上傳紀錄</span>
        <span>還沒有任何上傳紀錄。上傳完成後這裡會顯示時間 / 類型 / 筆數 / 來源 / 父件，方便驗證是否已套用最新版。</span>
      </div>
    );
  }

  return (
    <div className="rounded-[12px]" style={{
      background: BR.card, border: `1px solid ${BR.border}`, padding: "14px 18px",
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 18 }}>{open ? "▾" : "▸"}</span>
        <div className="flex-1 flex items-baseline gap-2 flex-wrap">
          <span style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 800, color: BR.ink }}>
            📜 最近上傳紀錄
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>
            最近 {logs.length} 筆 · 最新：{relativeTime(logs[0].ts)}
          </span>
        </div>
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onRefresh(); }}
          style={{
            fontFamily: FONT_MONO, fontSize: 11, color: BR.greenDeep,
            border: `1px solid ${BR.greenLine}`, padding: "3px 8px", borderRadius: 4,
            background: BR.greenSoft, cursor: "pointer",
          }}
        >↻ 重新整理</span>
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-[8px]" style={{ border: `1px solid ${BR.border}` }}>
          <div className="grid grid-cols-[120px_80px_70px_70px_1fr_110px]" style={{
            background: BR.greenInk, color: "#fff",
            padding: "6px 10px",
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          }}>
            <div>時間</div>
            <div>類型</div>
            <div className="text-right">筆數</div>
            <div>來源</div>
            <div>詳細（檔名 / 父件 / 報表）</div>
            <div>絕對時間</div>
          </div>
          {logs.map((log) => (
            <UploadLogRow key={log.id} log={log} isDuplicate={detectDuplicate(log, logs)} />
          ))}
        </div>
      )}
    </div>
  );
}

const TYPE_LABEL: Record<UploadLog["type"], { label: string; tone: string }> = {
  items: { label: "料件", tone: "#76b900" },
  bom: { label: "BOM", tone: "#3a6ea5" },
  purchases: { label: "採購", tone: "#b8860b" },
};

function UploadLogRow({ log, isDuplicate }: { log: UploadLog; isDuplicate: boolean }) {
  const t = TYPE_LABEL[log.type];
  const detailParts = [
    log.parentPartNo ? `父件 ${log.parentPartNo}` : null,
    log.fileName,
    log.removed ? `替換舊 ${log.removed} 筆` : null,
    log.detail,
  ].filter(Boolean) as string[];
  const detail = detailParts.join(" · ");
  return (
    <div
      className="grid grid-cols-[120px_80px_70px_70px_1fr_110px] items-center"
      title={isDuplicate ? "與最近一小時內的另一筆完全相同（同類型 + 同筆數 + 同檔名）— 可能重複上傳" : undefined}
      style={{
        padding: "6px 10px",
        borderTop: `1px solid ${BR.border}`,
        fontFamily: FONT_MONO, fontSize: 11.5, color: BR.ink,
        background: isDuplicate ? "#fffaf0" : "transparent",
      }}
    >
      <div style={{ color: BR.greenDeep, fontWeight: 700 }}>{relativeTime(log.ts)}</div>
      <div>
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: "#fff", background: t.tone,
          padding: "2px 8px", borderRadius: 3,
        }}>{t.label}</span>
      </div>
      <div className="text-right" style={{ fontWeight: 700 }}>
        +{log.count.toLocaleString()}
      </div>
      <div style={{
        fontSize: 10.5, color: log.source === "ocr" ? BR.greenDeep : BR.inkSoft,
        fontWeight: log.source === "ocr" ? 700 : 400,
      }}>
        {log.source === "ocr" ? "📄 OCR" : log.source === "csv" ? "📊 CSV" : log.source}
      </div>
      <div className="flex items-center gap-2" style={{
        color: BR.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {isDuplicate && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: "#fff", background: BR.amber,
            padding: "1px 6px", borderRadius: 3, flexShrink: 0,
          }}>↻ 可能重複</span>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {detail || <span style={{ color: BR.inkFaint }}>—（早期版本上傳，未記檔名）</span>}
        </span>
      </div>
      <div style={{ color: BR.inkFaint, fontSize: 10.5 }}>{fmtFullTs(log.ts)}</div>
    </div>
  );
}

// 判斷：最近 1 小時內存不存在同類型 + 同筆數 + 同檔名 + 同父件的另一筆
// 完全相同 → 多半是使用者連點兩下、或網路慢按 N 次
function detectDuplicate(log: UploadLog, all: UploadLog[]): boolean {
  const ONE_HOUR = 60 * 60 * 1000;
  const idx = all.findIndex((l) => l.id === log.id);
  if (idx < 0) return false;
  for (let i = idx + 1; i < all.length; i++) {
    const earlier = all[i];
    if (log.ts - earlier.ts > ONE_HOUR) break; // 已經超過 1 小時，不再往前找
    if (
      earlier.type === log.type &&
      earlier.count === log.count &&
      (earlier.fileName || "") === (log.fileName || "") &&
      (earlier.parentPartNo || "") === (log.parentPartNo || "")
    ) {
      return true;
    }
  }
  return false;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "剛剛";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} 分鐘前`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))} 小時前`;
  if (diff < 7 * 24 * 60 * 60_000) return `${Math.floor(diff / (24 * 60 * 60_000))} 天前`;
  return new Date(ts).toLocaleDateString("zh-TW");
}

function fmtFullTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
// 資料消費者 — 上傳→消費 是閉環，這頁不該只是「資料倉庫」
// 讓使用者看見：上傳完，這些頁面立刻變強（而不是不知道資料跑去哪）
//
// 「needs」用來判斷某個消費者頁面在當前主檔狀態下能不能跑：
//   - 全到位 → 綠色「就緒」
//   - 缺料 → 黃色「需要 XXX」
// ============================================================
type Consumer = {
  href: string;
  icon: string;
  title: string;
  en: string;
  desc: string;          // 一句話：這頁拿這份資料做什麼
  needs: ("items" | "bom" | "purchases")[]; // 必要的主檔
};

const DATA_CONSUMERS: Consumer[] = [
  {
    href: "/erp/lead-time-validation",
    icon: "💬",
    title: "跨部門 AI Inbox",
    en: "Cross-Dept AI Inbox",
    desc: "業務 / 採購收到 email 問成本+交期 → AI 自動用這份資料答出真實數字 + 寫好 reply 草稿",
    needs: ["items", "bom", "purchases"],
  },
  {
    href: "/erp/quotation-analyzer",
    icon: "✦",
    title: "AI Quotation Analyzer",
    en: "STEP 2-3 真實 BOM + 採購歷史",
    desc: "供應商報價單 OCR 後，自動展開 BOM、抓近 12 月採購均價、推議價空間",
    needs: ["items", "bom", "purchases"],
  },
];

function DataConsumersPanel({ meta }: { meta: MasterDataMeta }) {
  const has = {
    items: meta.itemCount > 0,
    bom: meta.bomCount > 0,
    purchases: meta.purchaseCount > 0,
  };
  return (
    <div className="rounded-[12px]" style={{
      background: BR.card, border: `1px solid ${BR.border}`, padding: "14px 18px",
    }}>
      <div className="flex items-baseline gap-3 mb-3 flex-wrap">
        <span style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 800, color: BR.ink }}>
          ✦ 這份主檔被誰用到
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>
          上傳越完整、這些頁面答得越準
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DATA_CONSUMERS.map((c) => {
          const missing = c.needs.filter((n) => !has[n]);
          const ready = missing.length === 0;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="block rounded-[10px] p-3 transition-shadow"
              style={{
                background: ready ? BR.greenSoft : "#fbfcfa",
                border: `1.5px solid ${ready ? BR.green : BR.borderHi}`,
                textDecoration: "none",
              }}
            >
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <span style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 800, color: BR.ink }}>
                  {c.title}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint }}>
                  {c.en}
                </span>
                <span className="flex-1" />
                {ready ? (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                    color: "#fff", background: BR.green,
                    padding: "2px 8px", borderRadius: 3,
                  }}>✓ 就緒</span>
                ) : (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
                    color: BR.amber, background: BR.amberSoft,
                    padding: "2px 8px", borderRadius: 3, border: `1px solid ${BR.amber}`,
                  }}>需要 {missing.map((m) => m === "items" ? "料件" : m === "bom" ? "BOM" : "採購").join(" · ")}</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: BR.inkSoft, lineHeight: 1.55, margin: 0 }}>
                {c.desc}
              </p>
              <div className="mt-2" style={{
                fontFamily: FONT_MONO, fontSize: 11, color: BR.greenDeep,
              }}>
                → 進入這頁
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
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
  onSave: (rows: unknown[], meta: { fileName: string }) => Promise<void>;
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

          {/* 鼎新報表代碼 — 一眼看出要從哪支出 Excel */}
          <div className="mt-2 p-2 rounded-[6px]" style={{
            background: "#fbfcfa", border: `1px solid ${BR.borderHi}`,
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.06em", marginBottom: 5 }}>
              📑 接受的鼎新報表代碼
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {info.reportCodes.map((rc) => (
                <div key={rc.code} className="flex items-center gap-1.5">
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 800,
                    color: "#fff", background: rc.preferred ? BR.green : BR.inkSoft,
                    padding: "2px 8px", borderRadius: 4, letterSpacing: "0.04em",
                  }}>{rc.code}</span>
                  <span style={{ fontSize: 11, color: BR.inkSoft }}>
                    {rc.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

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
            await onSave(state.report.rows, { fileName: state.fileName });
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
// 鼎新報表 OCR — PR-4
//
// CSV 上傳搞定一般情境，但客戶手上的資料常常不是 CSV：
//   - BOM 是影印機掃描的 PDF（像 FB61H003_bom.pdf）
//   - BOR213 是螢幕截圖嵌在 Word
//   - 採購單可能是 PDF 印出再簽核掃描
//   - 採購員在外面手機拍鼎新畫面回傳
//
// 這個區塊把這些「不乾淨」的格式接住：
//   檔案 → Gemini Vision → 自動辨識報表類型 → 抽 rows → 預覽 → 寫進對應 store
// ============================================================
type ReportType = "bom" | "items" | "purchases" | "unknown";

type ReportRow = {
  partNo?: string | null; name?: string | null; spec?: string | null;
  qty?: number | null; unit?: string | null;
  level?: number | null; isAlternative?: boolean | null;
  category?: string | null;
  poNo?: string | null; supplier?: string | null;
  unitPrice?: number | null; currency?: string | null; date?: string | null;
};

type ReportOcrResult = {
  reportType: ReportType;
  reportLabel?: string | null;
  parentPartNo?: string | null;
  parentName?: string | null;
  printDate?: string | null;
  rows: ReportRow[];
};

const REPORT_TYPE_LABELS: Record<ReportType, { icon: string; title: string; tone: string }> = {
  bom: { icon: "🔗", title: "BOM 結構", tone: "#3a6ea5" },
  items: { icon: "📦", title: "料件主檔", tone: "#76b900" },
  purchases: { icon: "💰", title: "採購歷史", tone: "#b8860b" },
  unknown: { icon: "❓", title: "未辨識", tone: "#9aa291" },
};

function ReportOcrSection({ onSaved }: { onSaved: (msg: string) => void | Promise<void> }) {
  const [state, setState] = useState<
    | { kind: "empty" }
    | { kind: "uploading"; fileName: string }
    | { kind: "ready"; fileName: string; result: ReportOcrResult }
    | { kind: "saving" }
    | { kind: "error"; message: string }
  >({ kind: "empty" });
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      setState({ kind: "error", message: "檔案太大（>15MB）。建議降低 PDF 解析度或分頁上傳" });
      return;
    }
    setState({ kind: "uploading", fileName: file.name });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/erp/report-import", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) {
        setState({ kind: "error", message: json.error || json.message || "OCR 失敗" });
        return;
      }
      setState({ kind: "ready", fileName: file.name, result: json.data as ReportOcrResult });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "上傳失敗" });
    }
  };

  const onConfirm = async () => {
    if (state.kind !== "ready") return;
    setState({ kind: "saving" });
    try {
      const r = state.result;
      let msg = "";
      const fileName = state.kind === "ready" ? state.fileName : undefined;
      if (r.reportType === "bom") {
        const parent = r.parentPartNo;
        if (!parent) {
          setState({ kind: "error", message: "AI 沒抓到父件品號 — 請手動到 BOM 上傳區放 CSV" });
          return;
        }
        const bomEntries = r.rows
          .filter((row) => row.partNo)
          .map((row) => ({
            parentPartNo: parent,
            childPartNo: String(row.partNo),
            qty: Number(row.qty) > 0 ? Number(row.qty) : 1,
            unit: row.unit || undefined,
            level: row.level != null ? Number(row.level) : undefined,
          }));
        const result = await replaceBomForParent(parent, bomEntries);
        await logUpload({
          ts: Date.now(), type: "bom", source: "ocr",
          count: result.inserted, removed: result.removed,
          parentPartNo: parent, fileName,
          detail: r.reportLabel ?? undefined,
        });
        msg = `✓ ${parent}: 寫入 ${result.inserted} 筆 BOM 子料（替換舊有 ${result.removed} 筆）`;
      } else if (r.reportType === "items") {
        const items = r.rows
          .filter((row) => row.partNo)
          .map((row) => ({
            partNo: String(row.partNo),
            name: row.name || "",
            spec: row.spec || undefined,
            category: row.category || undefined,
            unit: row.unit || undefined,
          }));
        const result = await upsertItems(items);
        await logUpload({
          ts: Date.now(), type: "items", source: "ocr",
          count: result.inserted, fileName,
          detail: r.reportLabel ?? undefined,
        });
        msg = `✓ 新增/更新 ${result.inserted} 筆料件主檔（依料號 upsert）`;
      } else if (r.reportType === "purchases") {
        const purchases = r.rows
          .filter((row) => row.partNo && row.supplier && Number(row.unitPrice) > 0)
          .map((row) => ({
            poNo: row.poNo || "",
            partNo: String(row.partNo),
            supplier: String(row.supplier),
            unitPrice: Number(row.unitPrice),
            currency: row.currency || "TWD",
            qty: Number(row.qty) || 0,
            date: normalizeDate(row.date || ""),
          }));
        const result = await appendPurchases(purchases);
        await logUpload({
          ts: Date.now(), type: "purchases", source: "ocr",
          count: result.inserted, fileName,
          detail: r.reportLabel ?? undefined,
        });
        msg = `✓ 新增 ${result.inserted} 筆採購紀錄（不刪除既有資料）`;
      } else {
        setState({ kind: "error", message: "AI 無法辨識報表類型 — 請改用下方 CSV 上傳區" });
        return;
      }
      setState({ kind: "empty" });
      await onSaved(msg);
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "儲存失敗" });
    }
  };

  return (
    <div className="rounded-[14px]" style={{
      background: BR.card,
      border: `2px solid ${BR.green}`,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "20px 22px",
    }}>
      <div className="flex items-start gap-4 mb-3">
        <div style={{ fontSize: 32, lineHeight: 1 }}>📄</div>
        <div className="flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
              color: "#fff", background: BR.green,
              padding: "2px 8px", borderRadius: 4, letterSpacing: "0.08em",
            }}>
              NEW · AI OCR
            </span>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 800, color: BR.ink, margin: 0 }}>
              鼎新報表 OCR · 一鍵辨識
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: BR.inkSoft, lineHeight: 1.55, marginTop: 4 }}>
            把鼎新印出來的報表丟進來（PDF 掃描、Word 截圖、手機翻拍都行）。
            AI 會自動判斷是 BOM / 料件主檔 / 採購歷史，抽出結構化資料、預覽、確認後寫進對應的 IndexedDB。
          </p>
          {/* OCR 認得的鼎新報表代碼 */}
          <div className="mt-2 p-2 rounded-[6px]" style={{
            background: "#fbfcfa", border: `1px solid ${BR.borderHi}`,
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.06em", marginBottom: 5 }}>
              📑 AI 認得的鼎新報表代碼（自動辨識類型 → 寫進對應 store）
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { code: "BOM210 / BOMR05", desc: "BOM 多階正展 → 寫入 BOM 結構", tone: BR.blue },
                { code: "INVI03 / INVR101", desc: "料件主檔 → 寫入料件主檔", tone: BR.green },
                { code: "PURR05 / PURR06", desc: "採購單明細 → 寫入採購歷史", tone: BR.amber },
                { code: "BOR213", desc: "製程操作畫面（規劃中）", tone: BR.inkFaint },
              ]).map((rc) => (
                <div key={rc.code} className="flex items-center gap-1.5">
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800,
                    color: "#fff", background: rc.tone,
                    padding: "2px 8px", borderRadius: 4, letterSpacing: "0.04em",
                  }}>{rc.code}</span>
                  <span style={{ fontSize: 11, color: BR.inkSoft }}>
                    {rc.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 p-2 rounded-[6px]" style={{
            background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
            fontFamily: FONT_MONO, fontSize: 11, color: BR.greenInk, lineHeight: 1.5,
          }}>
            💡 適合的場景：① BOM 多階正展（影印機掃描）② 鼎新畫面截圖 ③ 採購單 PDF ④ 採購員手機拍鼎新畫面
          </div>
        </div>
      </div>

      {state.kind === "empty" || state.kind === "error" ? (
        <div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            className="block cursor-pointer rounded-[10px] text-center"
            style={{
              border: `2px dashed ${dragOver ? BR.green : BR.borderHi}`,
              background: dragOver ? BR.greenSoft : "#fbfcfa",
              padding: "28px 20px",
            }}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
              className="hidden"
            />
            <div style={{ fontSize: 13, color: BR.ink, fontWeight: 600 }}>
              拖檔到這裡，或<span style={{ color: BR.greenDeep, textDecoration: "underline" }}>點選檔案</span>
            </div>
            <div style={{ fontSize: 11, color: BR.inkFaint, marginTop: 4, fontFamily: FONT_MONO }}>
              支援 .pdf · .png · .jpg · .webp（≤ 15MB）
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
      ) : state.kind === "uploading" ? (
        <div className="rounded-[10px] p-5 text-center" style={{
          background: "#fbfcfa", border: `1px solid ${BR.border}`,
          fontSize: 13, color: BR.inkSoft,
        }}>
          Gemini Vision 解析中：{state.fileName} …<br />
          <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: BR.inkFaint }}>
            掃描檔通常 5-20 秒（看頁數）
          </span>
        </div>
      ) : state.kind === "saving" ? (
        <div className="rounded-[10px] p-5 text-center" style={{
          background: BR.greenSoft, border: `1px solid ${BR.green}`,
          fontSize: 13, color: BR.greenInk,
        }}>
          寫入 IndexedDB 中…
        </div>
      ) : (
        <ReportOcrPreview
          fileName={state.fileName}
          result={state.result}
          onConfirm={onConfirm}
          onCancel={() => setState({ kind: "empty" })}
        />
      )}
    </div>
  );
}

function ReportOcrPreview({ fileName, result, onConfirm, onCancel }: {
  fileName: string; result: ReportOcrResult;
  onConfirm: () => void; onCancel: () => void;
}) {
  const type = REPORT_TYPE_LABELS[result.reportType];
  const validRows = result.rows.filter((r) => r.partNo);
  const previewRows = validRows.slice(0, 8);

  return (
    <div className="space-y-3">
      {/* 辨識結果 */}
      <div className="flex items-center gap-3 flex-wrap rounded-[10px] p-3" style={{
        background: result.reportType === "unknown" ? BR.amberSoft : BR.greenSoft,
        border: `1.5px solid ${result.reportType === "unknown" ? BR.amber : BR.green}`,
      }}>
        <span style={{ fontSize: 28 }}>{type.icon}</span>
        <div className="flex-1">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: BR.inkFaint }}>
            AI 判定報表類型
          </div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 800, color: type.tone }}>
            {type.title}
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkSoft, marginLeft: 8, fontWeight: 500 }}>
              {result.reportLabel || ""}
            </span>
          </div>
        </div>
        <div className="text-right" style={{ fontSize: 11, color: BR.inkSoft, fontFamily: FONT_MONO }}>
          📎 {fileName}<br />
          抽出 <b style={{ color: BR.ink }}>{validRows.length}</b> 筆有效列
          {result.rows.length !== validRows.length && (
            <span>（{result.rows.length - validRows.length} 筆無 partNo 已跳過）</span>
          )}
        </div>
      </div>

      {/* BOM 顯示父件 */}
      {result.reportType === "bom" && (
        <div className="rounded-[8px] p-3 flex items-center gap-3 flex-wrap" style={{
          background: "#fff", border: `1px solid ${BR.border}`,
        }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.06em" }}>
            父件
          </span>
          {result.parentPartNo ? (
            <>
              <span style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 800, color: BR.blue }}>
                {result.parentPartNo}
              </span>
              {result.parentName && (
                <span style={{ fontSize: 13, color: BR.ink }}>{result.parentName}</span>
              )}
            </>
          ) : (
            <span style={{ fontSize: 12, color: BR.red }}>
              ⚠ AI 沒抓到父件品號 — 請改用下方 CSV 路徑（BOM 一定要知道父件才能存）
            </span>
          )}
          {result.printDate && (
            <>
              <span className="flex-1" />
              <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
                報表日期 {result.printDate}
              </span>
            </>
          )}
        </div>
      )}

      {/* unknown 提示 */}
      {result.reportType === "unknown" && (
        <div className="rounded-[8px] p-3" style={{
          background: BR.amberSoft, border: `1px solid ${BR.amber}`,
          fontSize: 12.5, color: BR.amber, lineHeight: 1.55,
        }}>
          ⚠ AI 看不出這是哪種鼎新報表。如果你確定它是 BOM / 料件 / 採購其中一種，
          可以截圖更清楚再丟一次，或改用下方 CSV 上傳路徑。
        </div>
      )}

      {/* 預覽前 8 筆 */}
      {previewRows.length > 0 && (
        <div className="rounded-[8px] overflow-hidden" style={{ border: `1px solid ${BR.border}` }}>
          <div style={{
            background: BR.greenInk, color: "#fff", padding: "6px 10px",
            fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
          }}>
            預覽前 8 筆 {validRows.length > 8 && `（共 ${validRows.length} 筆）`}
          </div>
          <PreviewTable type={result.reportType} rows={previewRows} />
        </div>
      )}

      {/* 動作列 */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onConfirm}
          disabled={validRows.length === 0 || (result.reportType === "bom" && !result.parentPartNo) || result.reportType === "unknown"}
          className="px-4 py-2 rounded-[8px] font-bold"
          style={{
            background: BR.green, color: "#fff", fontSize: 13,
            opacity: (validRows.length === 0 || (result.reportType === "bom" && !result.parentPartNo) || result.reportType === "unknown") ? 0.4 : 1,
            cursor: "pointer",
          }}
        >
          ✓ 寫入 {validRows.length.toLocaleString()} 筆到「{type.title}」
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
        <span className="flex-1" />
        <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
          {result.reportType === "bom" && "BOM：替換同父件舊資料"}
          {result.reportType === "items" && "料件：依料號 upsert"}
          {result.reportType === "purchases" && "採購：純新增不覆寫"}
        </span>
      </div>
    </div>
  );
}

function PreviewTable({ type, rows }: { type: ReportType; rows: ReportRow[] }) {
  if (type === "bom") {
    return (
      <PreviewGrid headers={["階", "子料號", "品名", "規格", "用量", "單位", "替代"]}>
        {rows.map((r, i) => (
          <PreviewRowCells key={i} cells={[
            r.level != null ? String(r.level) : "—",
            r.partNo ?? "—",
            r.name ?? "",
            r.spec ?? "",
            r.qty != null ? String(r.qty) : "",
            r.unit ?? "",
            r.isAlternative ? "Y" : "",
          ]} />
        ))}
      </PreviewGrid>
    );
  }
  if (type === "items") {
    return (
      <PreviewGrid headers={["料號", "品名", "規格", "分類", "單位"]}>
        {rows.map((r, i) => (
          <PreviewRowCells key={i} cells={[
            r.partNo ?? "—",
            r.name ?? "",
            r.spec ?? "",
            r.category ?? "",
            r.unit ?? "",
          ]} />
        ))}
      </PreviewGrid>
    );
  }
  if (type === "purchases") {
    return (
      <PreviewGrid headers={["單號", "料號", "供應商", "單價", "幣", "數量", "日期"]}>
        {rows.map((r, i) => (
          <PreviewRowCells key={i} cells={[
            r.poNo ?? "",
            r.partNo ?? "—",
            r.supplier ?? "",
            r.unitPrice != null ? String(r.unitPrice) : "",
            r.currency ?? "",
            r.qty != null ? String(r.qty) : "",
            r.date ?? "",
          ]} />
        ))}
      </PreviewGrid>
    );
  }
  return (
    <PreviewGrid headers={["欄位 1", "欄位 2", "欄位 3"]}>
      {rows.map((r, i) => (
        <PreviewRowCells key={i} cells={[
          r.partNo ?? "",
          r.name ?? r.supplier ?? "",
          r.spec ?? "",
        ]} />
      ))}
    </PreviewGrid>
  );
}

function PreviewGrid({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table style={{ width: "100%", fontFamily: FONT_MONO, fontSize: 11, borderCollapse: "collapse" }}>
        <thead style={{ background: "#f6f8f2" }}>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                padding: "6px 10px", textAlign: "left",
                color: BR.ink, fontWeight: 700,
                borderBottom: `1px solid ${BR.border}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function PreviewRowCells({ cells }: { cells: string[] }) {
  return (
    <tr>
      {cells.map((c, i) => (
        <td key={i} style={{
          padding: "5px 10px", color: BR.inkSoft,
          borderBottom: `1px solid ${BR.border}`,
          whiteSpace: "nowrap",
          maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {c}
        </td>
      ))}
    </tr>
  );
}

// 民國年 / YYYYMMDD / YYYY/MM/DD 統一轉成 ISO YYYY-MM-DD
function normalizeDate(s: string): string {
  if (!s) return "";
  const t = s.trim();
  const m1 = t.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
  const m2 = t.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  const m3 = t.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (m3) return `${parseInt(m3[1], 10) + 1911}-${m3[2]}-${m3[3]}`;
  return t;
}

// ============================================================
// ERP 直連測試面板（進階 · 給 IT / 鼎新顧問用）
//
// 場景：CSV 上傳是日常用，但理想終態是把這個 web app 部署到客戶內網的
// BI 主機，直接連 192.168.16.201 上的 eproerp 資料庫。
// 這個面板給 IT / 鼎新顧問做 5 分鐘可達性驗證 — 不寫資料、只 SELECT 三個 COUNT。
//
// 預設值來自 ConductorC.INI（客戶端設定檔）解出的真實連線資訊。
// ============================================================
function ErpDirectConnectPanel() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    server: "192.168.16.201",
    port: "1433",
    database: "eproerp",
    user: "",
    password: "",
  });
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "testing" }
    | { kind: "ok"; versionShort: string; counts: { items: number; bomParents: number; purchases: number }; durationMs: number }
    | { kind: "fail"; error: string; hint?: string; step?: string; durationMs?: number }
  >({ kind: "idle" });

  // 判斷這頁是不是從「能看到 ERP 內網」的伺服器載入的。
  // 規則：localhost / 私有 IP 段 (10.* / 192.168.* / 172.16-31.*) → 可能能連
  //       其他（chistrategy.com / Vercel / 任何公網域名）→ 一定 timeout
  // 用 useEffect 在 mount 後判斷，避免 SSR / hydration mismatch
  const [hostMode, setHostMode] = useState<"unknown" | "internal" | "external">("unknown");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hostname;
    const isInternal =
      h === "localhost" ||
      h === "127.0.0.1" ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h);
    setHostMode(isInternal ? "internal" : "external");
  }, []);

  const onTest = async () => {
    setState({ kind: "testing" });
    try {
      const res = await fetch("/api/erp/test-connection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          port: form.port ? Number(form.port) : 1433,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setState({ kind: "ok", versionShort: json.versionShort, counts: json.counts, durationMs: json.durationMs });
      } else {
        setState({ kind: "fail", error: json.error ?? "未知錯誤", hint: json.hint, step: json.step, durationMs: json.durationMs });
      }
    } catch (err) {
      setState({ kind: "fail", error: err instanceof Error ? err.message : "fetch 失敗", hint: "前端到自己伺服器的 fetch 都通不過 → 檢查網路 / Next.js 伺服器" });
    }
  };

  return (
    <div className="rounded-[14px]" style={{
      background: BR.card, border: `1px solid ${BR.border}`, padding: "16px 20px",
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{open ? "▾" : "▸"}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, color: BR.greenDeep, letterSpacing: "0.08em" }}>
              進階 · ADVANCED
            </span>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 800, color: BR.ink, margin: 0 }}>
              ERP 直連測試（給 IT / 鼎新顧問）
            </h2>
          </div>
          <p style={{ fontSize: 12, color: BR.inkSoft, marginTop: 2, lineHeight: 1.5 }}>
            如果這個 web app 部署在公司內網（例如 BI 主機），可以直接連到 ERP MSSQL，免去 CSV 匯出。
            這頁只測「連線通不通」，不寫任何資料。
          </p>
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {/* 預設值出處說明 */}
          <div className="p-2.5 rounded-[6px]" style={{
            background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
            fontFamily: FONT_MONO, fontSize: 11, color: BR.greenInk, lineHeight: 1.55,
          }}>
            💡 預設值來自 <b>ConductorC.INI</b>（鼎新 client 設定檔）+ <b>BOR213 截圖</b>（DB 名稱）。
            如果跟你公司 IT 實際配置不同，請改下方欄位再測試。
          </div>

          {/* 表單 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="MSSQL 主機 IP" value={form.server} onChange={(v) => setForm({ ...form, server: v })} placeholder="192.168.16.201" />
            <Field label="Port" value={form.port} onChange={(v) => setForm({ ...form, port: v })} placeholder="1433" />
            <Field label="資料庫名" value={form.database} onChange={(v) => setForm({ ...form, database: v })} placeholder="eproerp" />
            <Field label="使用者帳號（建議唯讀帳號）" value={form.user} onChange={(v) => setForm({ ...form, user: v })} placeholder="chistrategy_readonly" />
            <Field label="密碼" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="" type="password" wide />
          </div>

          {/* 部署位置警告 — 從公網按下去一定 timeout */}
          {hostMode === "external" && (
            <div className="rounded-[8px] p-2.5" style={{
              background: BR.amberSoft, border: `1.5px solid ${BR.amber}`,
              fontSize: 12, color: BR.amber, lineHeight: 1.55,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                ⚠ 從目前這個網址按下去一定會 timeout
              </div>
              <div style={{ color: BR.ink, fontSize: 11.5 }}>
                這頁載入自 <b style={{ fontFamily: FONT_MONO }}>
                {typeof window !== "undefined" ? window.location.hostname : "外部網域"}
                </b>（公網），看不到你公司內網的 <b style={{ fontFamily: FONT_MONO }}>192.168.16.201</b>。
                <br />
                要真的連通，需要把這個 app 部署到你公司內網（建議部署到 BI 主機），或在公司桌機跑 <b style={{ fontFamily: FONT_MONO }}>localhost:3000</b>。
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onTest}
              disabled={state.kind === "testing" || !form.user || !form.password}
              className="px-4 py-2 rounded-[8px] font-bold"
              style={{
                background: BR.green, color: "#fff", fontSize: 13,
                opacity: (state.kind === "testing" || !form.user || !form.password) ? 0.4 : 1,
                cursor: state.kind === "testing" ? "wait" : "pointer",
              }}
            >
              {state.kind === "testing" ? "測試中…" : "▶ 測試連線"}
            </button>
            {(!form.user || !form.password) && (
              <span style={{ fontSize: 11, color: BR.red, fontFamily: FONT_MONO }}>
                ← 帳號 + 密碼都填完才會亮起來
              </span>
            )}
            <span className="flex-1" />
            <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
              ⓘ 密碼僅用於這次測試 · 不儲存 · 不寫任何資料到 ERP
            </span>
          </div>

          {/* 「怎麼看是不是連線成功」說明 */}
          <details className="rounded-[8px]" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
            <summary className="cursor-pointer px-3 py-2" style={{
              fontFamily: FONT_MONO, fontSize: 11.5, color: BR.greenDeep, fontWeight: 700,
            }}>
              ❓ 我怎麼看是否已連線？
            </summary>
            <div className="px-3 pb-3" style={{ fontSize: 12, color: BR.inkSoft, lineHeight: 1.65 }}>
              按下「測試連線」會 POST 給後端 API，後端用你輸入的帳密試著連 MSSQL。結果有三種：
              <ul className="mt-2 space-y-1.5 pl-4" style={{ listStyle: "disc" }}>
                <li>
                  <b style={{ color: BR.green }}>✓ 綠色框：連線成功</b> — 會顯示 SQL Server 版本 + 三張核心表（INVMB / BOMMB / PURTH）筆數。代表帳號可以讀，可以進下一步（直連同步）。
                </li>
                <li>
                  <b style={{ color: BR.red }}>✗ 紅色框：連線失敗</b> — 會顯示卡在哪步（connect / version / counts）+ 判讀提示。常見：
                  <div className="mt-1 ml-2 grid gap-1" style={{ fontFamily: FONT_MONO, fontSize: 11 }}>
                    <span><b>connect 步驟 timeout</b> → IP / 防火牆 / VPN 問題（最常見）</span>
                    <span><b>connect 步驟 ECONNREFUSED</b> → MSSQL 沒開 TCP/IP（鼎新預設關閉，要 IT 開）</span>
                    <span><b>connect 步驟 Login failed</b> → 帳密錯</span>
                    <span><b>counts 步驟 Invalid object name</b> → 接到了但表不存在 / 帳號沒 SELECT 權限</span>
                  </div>
                </li>
                <li>
                  <b style={{ color: BR.inkFaint }}>都沒框出現</b> — 表示按鈕還灰著（帳密沒填完）或網路出問題（按下去 1 秒內沒反應）。
                </li>
              </ul>
            </div>
          </details>

          {/* 結果 */}
          {state.kind === "ok" && (
            <div className="rounded-[8px] p-3" style={{
              background: BR.greenSoft, border: `1px solid ${BR.green}`,
              fontSize: 12.5, color: BR.greenInk, lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>✓ 連線成功（{state.durationMs} ms）</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11 }}>{state.versionShort}</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <CountCell label="INVMB 料件" v={state.counts.items} />
                <CountCell label="BOMMB BOM 母件" v={state.counts.bomParents} />
                <CountCell label="PURTH 採購單頭" v={state.counts.purchases} />
              </div>
              <div className="mt-2" style={{ fontSize: 11.5 }}>
                ✦ 三張核心表都查到了，路線 A（直連 DB）可走。下一步：把 CSV 上傳改成 DB 同步任務（PR-X 計劃中）。
              </div>
            </div>
          )}

          {state.kind === "fail" && (
            <div className="rounded-[8px] p-3" style={{
              background: BR.redSoft, border: `1px solid ${BR.red}`,
              fontSize: 12.5, color: BR.red, lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>
                ✗ 連線失敗{state.step ? `（卡在「${state.step}」步驟）` : ""}
                {state.durationMs ? ` · ${state.durationMs} ms` : ""}
              </div>
              {state.hint && (
                <div className="rounded-[6px] p-2 mt-1" style={{ background: "#fff", color: BR.ink, fontSize: 12 }}>
                  💡 {state.hint}
                </div>
              )}
              <div className="mt-2" style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkSoft, wordBreak: "break-all" }}>
                {state.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", wide = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <div style={{ fontSize: 11, color: BR.inkSoft, marginBottom: 4, fontFamily: FONT_MONO }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[6px] px-2 py-1.5"
        style={{
          fontFamily: FONT_MONO, fontSize: 12,
          border: `1px solid ${BR.border}`, background: "#fff", color: BR.ink,
        }}
      />
    </label>
  );
}

function CountCell({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-[6px] p-2" style={{ background: "#fff", border: `1px solid ${BR.greenLine}` }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: BR.greenDeep }}>
        {v.toLocaleString()}
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
