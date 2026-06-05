"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// L3 PROCUREMENT · AI Quotation Analyzer
// 關鍵不是報價 — 而是 Cost Breakdown
//   Step 1  供應商上傳報價 (PDF / JPG / Excel) → AI OCR
//   Step 2  AI 自動尋找料號 → BOM / CBS / Commodity Mapping
//   Step 3  AI 抓最相依的當前價格
//   Step 4  Should Cost Engine → 合理上限 → AI 判定
// ============================================================

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  page: "#fbfcfa", card: "#ffffff",
  border: "#e9ece3", borderHi: "#dadfd0",
  red: "#d4351c", redSoft: "#fdecea",
  amber: "#b8860b", amberSoft: "#fffaf0",
  purple: "#c026d3", blue: "#3a6ea5",
} as const;
const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";
const FONT_HEAD = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

// 子模組（左側 menu / nav strip）
const SUBMODULES = [
  { key: "ocr",      icon: "▤", title: "報價 OCR",        en: "Quotation OCR",        active: true  },
  { key: "should",   icon: "◈", title: "Should Cost",     en: "Should Cost Engine",   active: true  },
  { key: "validate", icon: "✦", title: "Price Validation",en: "Price Validation",     active: true  },
  { key: "comm",     icon: "◉", title: "Commodity Engine",en: "Commodity Mapping",    active: true  },
  { key: "history",  icon: "↻", title: "Supplier History",en: "Supplier History",     active: false },
  { key: "copilot",  icon: "⚡", title: "Negotiation Copilot", en: "Negotiation Copilot", active: false },
];

// Step 1 — Mock OCR 抓出來的內容
const OCR_ROWS = [
  { supplier: "企能",  partNo: "P03M3001", oldPrice: 6.90, newPrice: 7.90, reasonText: "銅 / 電鍍 / 海運皆漲" },
  { supplier: "企能",  partNo: "P03M3009", oldPrice: 8.20, newPrice: 9.60, reasonText: "電鍍 + 工資" },
  { supplier: "茂晟",  partNo: "F18-COIL", oldPrice: 12.5, newPrice: 14.8, reasonText: "原料銅成本" },
];

// 主分析對象 — 點選一個 row
const SELECTED = OCR_ROWS[0];

// Step 2 — 找到的 BOM / CBS / Commodity Mapping
const BOM_BREAKDOWN = [
  { k: "銅材", pct: 58, tone: BR.red,    mapTo: "LME 銅 (Cu)" },
  { k: "電鍍", pct: 10, tone: BR.purple, mapTo: "電鍍加工指數" },
  { k: "加工", pct: 15, tone: BR.blue,   mapTo: "台製造業最低工資" },
  { k: "包材", pct:  2, tone: BR.amber,  mapTo: "瓦楞紙 / 紙箱" },
  { k: "運費", pct:  5, tone: "#10b981", mapTo: "BDI + 海運附加" },
  { k: "利潤", pct: 10, tone: BR.inkSoft, mapTo: "—" },
];

// Step 3 — AI 抓的目前各成分變動 + 當前 vs 基期價（計算依據透明化）
const COMMODITY_MOVES = [
  { k: "LME 銅",         current: 9472,  baseline: 9021,  unit: "USD/MT", asOf: "2026-06-04 (LME spot)", source: "LME 30 日均",        delta: +5.0 },
  { k: "電鍍加工指數",   current: 134.2, baseline: 119.8, unit: "Index",  asOf: "2026 Q1",                source: "IPCEI 業界指數",      delta: +12.0 },
  { k: "鏡板（鎂鋁）",   current: 312,   baseline: 289,   unit: "USD/MT", asOf: "2026-06 牌價",           source: "中鋼 + 寶武",         delta: +8.0 },
  { k: "工資（製造業）", current: 31480, baseline: 30560, unit: "NT$/月", asOf: "2026 Q2 公告",           source: "勞動部 工資統計",      delta: +3.0 },
  { k: "運費 BDI",       current: 1842,  baseline: 1721,  unit: "BDI",    asOf: "2026-06-04",             source: "Baltic Dry Index",    delta: +7.0 },
];

// 給 PDF / on-page 用：每個 BOM 成分對應的商品計算依據
const COMPONENT_PRICE: Record<string, { current: number; baseline: number; unit: string; asOf: string; source: string }> = {
  "銅材": { current: 9472,  baseline: 9021,  unit: "USD/MT", asOf: "LME spot 2026-06-04", source: "LME 倫敦金屬交易所 · 30 日均" },
  "電鍍": { current: 134.2, baseline: 119.8, unit: "Index",  asOf: "2026 Q1",             source: "IPCEI 電鍍加工業界指數" },
  "加工": { current: 312,   baseline: 289,   unit: "USD/MT", asOf: "2026-06 牌價",        source: "中鋼 + 寶武 鏡板 / 鎂鋁料價" },
  "運費": { current: 1842,  baseline: 1721,  unit: "BDI",    asOf: "2026-06-04",          source: "Baltic Dry Index (BDI)" },
};

// Step 4 — 計算 Should Cost
// 把 BOM 成分 mapping 到 commodity 變動，加總得到合理漲幅
function computeShouldCost() {
  const rows: { k: string; weight: number; delta: number; contrib: number }[] = [
    { k: "銅材", weight: 58, delta: 5,  contrib: 0 },
    { k: "電鍍", weight: 10, delta: 12, contrib: 0 },
    { k: "加工", weight: 15, delta: 8,  contrib: 0 },
    { k: "運費", weight: 5,  delta: 7,  contrib: 0 },
  ];
  rows.forEach((r) => (r.contrib = +((r.weight * r.delta) / 100).toFixed(2)));
  const total = +rows.reduce((s, r) => s + r.contrib, 0).toFixed(1);
  const buffered = +(total * 1.1).toFixed(1); // ±10% 緩衝後上限
  return { rows, total, buffered };
}

export default function QuotationAnalyzerPage() {
  const [activeSub, setActiveSub] = useState("ocr");
  const [toast, setToast] = useState<string | null>(null);
  const sc = computeShouldCost();

  // 真實的 supplier claim 漲幅
  const supplierClaim = +(((SELECTED.newPrice - SELECTED.oldPrice) / SELECTED.oldPrice) * 100).toFixed(1);
  // 如果供應商實際喊得更高（demo: 25%）
  const supplierExcess = 25.0;
  const overByActual = +(supplierClaim - sc.buffered).toFixed(1);
  const overByExcess = +(supplierExcess - sc.buffered).toFixed(1);

  const verdict =
    supplierClaim <= sc.buffered ? { tone: BR.greenDeep, label: "✓ 合理 · 可接受",     bg: BR.greenSoft } :
    supplierClaim <= sc.buffered * 1.5 ? { tone: BR.amber, label: "⚠ 偏高 · 要求重議", bg: BR.amberSoft } :
                                          { tone: BR.red,    label: "🚨 嚴重超出 · 強力議價", bg: BR.redSoft };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // 共用：開新分頁印 PDF；彈窗被擋則改用 Blob 下載
  const openOrDownload = (html: string, filename: string, successMsg: string) => {
    try {
      const win = window.open("", "_blank");
      if (win && win.document) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 700);
        showToast(successMsg);
        return;
      }
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("✓ 彈窗被擋 — 改用下載：" + filename);
    } catch (e) {
      showToast("⚠ 產出失敗：" + (e instanceof Error ? e.message : String(e)));
    }
  };

  // ── ① 完整版（11 段） — 內部驗證 / 採購 deep dive 用 ──
  const handleGenerateReport = () => {
    const html = buildShouldCostReportHtml({
      partNo: SELECTED.partNo, supplier: SELECTED.supplier,
      oldPrice: SELECTED.oldPrice, newPrice: SELECTED.newPrice,
      supplierClaim, supplierExcess, sc, bom: BOM_BREAKDOWN, moves: COMMODITY_MOVES,
    });
    openOrDownload(html, `should-cost-FULL-${SELECTED.partNo}.html`,
      "✓ 完整版（11 段 + Page 0）已開啟 — 列印對話框會自動跳出");
  };

  // ── ② 董事會 / CEO 版（1 頁） — 真正 100 分的版本 ──
  const handleGenerateBoardReport = () => {
    const html = buildBoardReportHtml({
      partNo: SELECTED.partNo, supplier: SELECTED.supplier,
      oldPrice: SELECTED.oldPrice, newPrice: SELECTED.newPrice,
      supplierClaim, sc,
    });
    openOrDownload(html, `L0-board-card-${SELECTED.partNo}.html`,
      "✓ L0 Board Decision Card v4（1 頁 · 5 排）已開啟 — Risk Radar 4 維度 / 建議含目標+回收+時程 / Option A/B/C 三選一");
  };

  // ── ③ L1 Executive Report · 總經理閱讀版（4 頁固定） ──
  const handleGeneratePurchasingReport = () => {
    const html = buildPurchasingReportHtml({
      partNo: SELECTED.partNo, supplier: SELECTED.supplier,
      oldPrice: SELECTED.oldPrice, newPrice: SELECTED.newPrice,
      supplierClaim, supplierExcess, sc, bom: BOM_BREAKDOWN, moves: COMMODITY_MOVES,
    });
    openOrDownload(html, `L1-executive-${SELECTED.partNo}.html`,
      "✓ L1 Executive Report（3 頁列印 · 4 段內容）已開啟 — Verdict 改為精簡 chip / Financial + Supply Risk 合併同頁");
  };

  // ── ④ 發送議價會議邀請 — mailto link（預先組好 href） ──
  const meetingMailto = (() => {
    const subject = `[議價會議] ${SELECTED.partNo} 報價調整 — Should-Cost 結果說明`;
    const body = [
      `Dear ${SELECTED.supplier} 先進，`,
      ``,
      `關於 ${SELECTED.partNo}（${SELECTED.oldPrice.toFixed(2)} → ${SELECTED.newPrice.toFixed(2)}，喊漲 +${supplierClaim.toFixed(1)}%）`,
      `本公司 AI Should-Cost Engine 反推合理上限為 +${sc.buffered.toFixed(1)}%（緩衝後），`,
      `差距 +${overByActual.toFixed(1)}%。`,
      ``,
      `謹邀請貴司就以下重點議價：`,
      `1. 銅佔 58%、LME 只漲 5%，該欄合理 +2.9%`,
      `2. 電鍍 10%、+12%，該欄合理 +1.2%`,
      `3. 加工 15%、+8%，該欄合理 +1.2%`,
      `4. 運費 5%、+7%，該欄合理 +0.4%`,
      `合計 +5.7%，緩衝後上限 +${sc.buffered.toFixed(1)}%`,
      ``,
      `會議時間：請貴司於 3 個工作日內回覆可配合時段。`,
      `會議形式：Google Meet / Teams 皆可，敝公司可主辦。`,
      ``,
      `會中將提供完整 Should-Cost 報告 (PDF) 作為依據。`,
      ``,
      `祺驊股份有限公司 · CHI HUA AI Supply Chain OS`,
      `(此信由 L3 AI Quotation Analyzer 自動草擬)`,
    ].join("\n");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  // ── ③ 退單通知供應商 — mailto link ──
  const rejectMailto = (() => {
    const subject = `[退單] ${SELECTED.partNo} 報價超出合理區間 — 需重新報價`;
    const body = [
      `Dear ${SELECTED.supplier} 先進，`,
      ``,
      `關於 ${SELECTED.partNo}，貴司此次調整：`,
      `舊價 ${SELECTED.oldPrice.toFixed(2)} → 新價 ${SELECTED.newPrice.toFixed(2)}`,
      `喊漲幅度 +${supplierClaim.toFixed(1)}%`,
      ``,
      `經本公司 AI Should-Cost Engine 依當前各成分波動拆解：`,
      `- 銅 58% × +5%  = +2.9%`,
      `- 電鍍 10% × +12% = +1.2%`,
      `- 加工 15% × +8% = +1.2%`,
      `- 運費 5% × +7%  = +0.4%`,
      `合理上限（含 10% 緩衝）= +${sc.buffered.toFixed(1)}%`,
      ``,
      `貴司報價超出合理上限 +${overByActual.toFixed(1)}%，`,
      `本公司無法於現有條件下接受此份報價，敬請於 7 個工作日內：`,
      ``,
      `1. 提供超出部分的明確成本依據；或`,
      `2. 重新提交至合理上限 +${sc.buffered.toFixed(1)}% 以內的報價。`,
      ``,
      `逾期未回覆將啟動備案供應商評估。`,
      ``,
      `祺驊股份有限公司 · 採購中心`,
      `(此信由 L3 AI Quotation Analyzer 依據 Should-Cost 拆解自動產出)`,
    ].join("\n");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  return (
    <div
      style={{
        background: BR.page,
        backgroundImage: `linear-gradient(to right, rgba(12,18,8,.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,18,8,.022) 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        minHeight: "100vh", fontFamily: FONT, color: BR.ink,
      }}
    >
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 100,
          background: BR.greenInk, color: "#fff",
          padding: "12px 18px", borderRadius: 10,
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 28px rgba(12,18,8,.18)",
          border: `1px solid ${BR.green}`,
          maxWidth: 380,
        }}>
          {toast}
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-9 py-7 space-y-6">

        {/* Top bar / breadcrumb */}
        <header>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              color: "#fff", background: BR.greenInk, padding: "4px 10px", borderRadius: 5,
            }}>
              L3 PROCUREMENT
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint, letterSpacing: "0.06em" }}>
              erp / quotation-analyzer
            </span>
          </div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
            <span style={{ color: BR.green, marginRight: 8 }}>✦</span>
            AI Quotation Analyzer
          </h1>
          <p style={{ fontSize: 14, color: BR.inkSoft, marginTop: 6 }}>
            <b style={{ color: BR.ink }}>關鍵不是報價</b>，而是 <b style={{ color: BR.purple }}>Cost Breakdown</b>。
            供應商給的價我們不直接收 — 先 OCR、找 BOM、抓商品價、跑 Should-Cost，再決定接不接。
          </p>
        </header>

        {/* 子模組 nav strip */}
        <Card>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.12em" }}>
              SUB-MODULES · 子模組
            </span>
            <span style={{ fontSize: 12, color: BR.inkSoft }}>共 6 個 — 點 nav 切換主畫面（目前展示完整 4-step pipeline）</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {SUBMODULES.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSub(s.key)}
                className="rounded-[10px] text-left transition-colors"
                style={{
                  background: activeSub === s.key ? BR.greenSoft : BR.card,
                  border: `1px solid ${activeSub === s.key ? BR.green : BR.borderHi}`,
                  padding: "11px 13px", cursor: "pointer",
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span style={{ color: BR.greenDeep, fontSize: 14 }}>{s.icon}</span>
                  {s.active && <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: BR.greenDeep, background: BR.greenSoft, padding: "1px 5px", borderRadius: 4, border: `1px solid ${BR.greenLine}` }}>LIVE</span>}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 4, color: BR.ink }}>{s.title}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: BR.inkFaint, marginTop: 2, letterSpacing: "0.04em" }}>{s.en}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* ──────────────────────────── 4-step pipeline ──────────────────────────── */}

        {/* Step 1 · OCR */}
        <StepHeader badge="STEP 1" title="供應商上傳報價" en="Supplier uploads quote → AI OCR" desc="PDF / JPG / Excel 都可，AI 自動讀取表格" />
        <Card>
          <div className="grid lg:grid-cols-[260px,1fr] gap-5">
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                ① UPLOAD · 可接受格式
              </div>
              <div className="space-y-2">
                {[
                  { fmt: "PDF",   icon: "📄", note: "完整報價單 / 議價表" },
                  { fmt: "JPG",   icon: "📷", note: "拍照 / 截圖也可" },
                  { fmt: "Excel", icon: "📊", note: "供應商標準 quote 表" },
                ].map((f) => (
                  <div key={f.fmt} className="rounded-[10px] p-3 flex items-center gap-3" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
                    <span style={{ fontSize: 22 }}>{f.icon}</span>
                    <div className="flex-1">
                      <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13, color: BR.greenInk }}>{f.fmt}</div>
                      <div style={{ fontSize: 10.5, color: BR.greenDeep }}>{f.note}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[10px] p-3" style={{ background: BR.greenInk, color: "#fff" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: "#9aa78d", letterSpacing: "0.1em" }}>AI OCR 已抽出</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: BR.green, marginTop: 4 }}>
                  3 列 / 6 欄位
                </div>
                <div style={{ fontSize: 10.5, color: "#aebba0", marginTop: 4 }}>供應商 · 料號 · 舊價 · 新價 · 漲幅 · 原因</div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                ② AI 自動讀取結果
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 580 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BR.border}`, background: "#fbfcfa" }}>
                      {["供應商", "料號", "舊價格", "新價格", "漲幅", "原因 (供應商說)"].map((h, i) => (
                        <th key={h} style={{
                          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                          color: BR.inkFaint, textAlign: i >= 2 && i <= 4 ? "right" : "left",
                          padding: "10px 8px",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OCR_ROWS.map((r, i) => {
                      const pct = ((r.newPrice - r.oldPrice) / r.oldPrice) * 100;
                      const selected = i === 0;
                      return (
                        <tr key={i} style={{
                          borderBottom: `1px solid #f3f5ef`,
                          background: selected ? BR.greenSoft : "transparent",
                        }}>
                          <td style={{ padding: "12px 8px", fontWeight: 700 }}>{r.supplier}</td>
                          <td style={{ padding: "12px 8px", fontFamily: FONT_MONO, fontWeight: 700, color: selected ? BR.greenDeep : BR.ink }}>{r.partNo}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, color: BR.inkSoft }}>{r.oldPrice.toFixed(2)}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700 }}>↗ {r.newPrice.toFixed(2)}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, color: BR.red }}>
                            +{pct.toFixed(1)}%
                          </td>
                          <td style={{ padding: "12px 8px", fontSize: 12, color: BR.inkSoft }}>{r.reasonText}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 rounded-[10px] p-3 flex items-baseline justify-between" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                <span style={{ fontSize: 12 }}>
                  AI 立即算（選中第 1 列 <b style={{ color: BR.greenDeep, fontFamily: FONT_MONO }}>{SELECTED.partNo}</b>）：
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800, color: BR.red }}>
                  +{supplierClaim.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Step 2 · 找料號 → BOM / CBS / Commodity Mapping */}
        <StepHeader badge="STEP 2" title="AI 自動尋找料號" en="Auto-match to ERP · BOM / CBS / Commodity Mapping" desc="從 ERP 找到該料號，拉出 BOM 結構與商品 mapping" />
        <Card>
          <div className="grid lg:grid-cols-[300px,1fr] gap-5">
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                ① ERP 查料
              </div>
              <div className="rounded-[10px] p-3 mb-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                <div style={{ fontSize: 10, color: BR.inkFaint }}>料號</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 800, color: BR.greenDeep }}>
                  {SELECTED.partNo}
                </div>
                <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 2 }}>已在 ERP 找到</div>
              </div>

              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>
                ② AI 抓到三件資料
              </div>
              {[
                { k: "BOM",               note: "成本卡 v3.2 · 6 成分" },
                { k: "CBS",               note: "Cost Breakdown System" },
                { k: "Commodity Mapping", note: "各成分 → LME / 指數" },
              ].map((x) => (
                <div key={x.k} className="rounded-[8px] p-2.5 mb-2 flex items-baseline gap-2" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: BR.greenDeep, minWidth: 130 }}>{x.k}</span>
                  <span style={{ fontSize: 11, color: BR.greenDeep }}>{x.note}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                ③ {SELECTED.partNo} 的 BOM 結構（業界經驗 + ERP 標成）
              </div>
              <div className="space-y-2">
                {BOM_BREAKDOWN.map((b) => (
                  <div key={b.k} className="flex items-center gap-3 rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: b.tone, width: 56 }}>{b.k}</span>
                    <div className="flex-1" style={{ height: 8, background: "#eef0ea", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.pct}%`, background: b.tone, opacity: 0.9 }} />
                    </div>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: b.tone, width: 42, textAlign: "right" }}>
                      {b.pct}%
                    </span>
                    <span style={{ fontSize: 11, color: BR.inkSoft, minWidth: 160, textAlign: "right" }}>→ {b.mapTo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Step 3 · 抓最相依的當前價格 */}
        <StepHeader badge="STEP 3" title="AI 抓最相依的價" en="Pull current commodity moves" desc="從 LME / 指數 / 工資 抓對應的當前波動" />
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {COMMODITY_MOVES.map((c) => {
              const tone = c.delta > 5 ? BR.red : c.delta > 0 ? BR.amber : BR.greenDeep;
              return (
                <div key={c.k} className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                  <div className="flex items-baseline justify-between">
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: BR.ink }}>{c.k}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: BR.inkFaint }}>{c.unit}</div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: tone, marginTop: 6, lineHeight: 1 }}>
                    +{c.delta.toFixed(1)}%
                  </div>

                  {/* 透明化：當前 / 基期 / 計算 */}
                  <div className="mt-2.5 rounded-[6px] p-2" style={{ background: "#fff", border: `1px solid ${BR.border}` }}>
                    <div className="flex justify-between" style={{ fontSize: 10.5 }}>
                      <span style={{ color: BR.inkSoft }}>當前</span>
                      <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.ink }}>{c.current.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: 10.5 }}>
                      <span style={{ color: BR.inkSoft }}>基期</span>
                      <span style={{ fontFamily: FONT_MONO, color: BR.inkSoft }}>{c.baseline.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 pt-1 border-t" style={{ borderColor: BR.border }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: BR.inkFaint }}>
                        ({c.current.toLocaleString()} − {c.baseline.toLocaleString()}) / {c.baseline.toLocaleString()}
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: tone, fontWeight: 700 }}>
                        = +{c.delta.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: BR.inkFaint, marginTop: 6, lineHeight: 1.45 }}>
                    {c.source}<br />{c.asOf}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 rounded-[8px] p-3 text-xs" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, color: "#3c4a2e" }}>
            <b style={{ color: BR.greenInk }}>✦ 為什麼這個 +5% 可信？</b> 每個百分比都是
            <span className="font-mono">（當前價 − 基期價）÷ 基期價</span>
            算出來的，不是供應商說了算 — 上面的當前 / 基期 / 來源都可隨時驗證。
          </div>
        </Card>

        {/* Step 4 · Should Cost Engine — 3-column (Cost Breakdown / Market Impact / AI Verdict) */}
        <StepHeader badge="STEP 4" title="Should Cost Engine" en="Compute fair upper limit · 3-column view for CEO" desc="左：成本結構 · 中：市場波動 · 右：AI 判定 — CEO 一眼看出合理 vs 喊價" />
        <Card>
          <div className="grid lg:grid-cols-3 gap-4">
            {/* 左 · Cost Breakdown */}
            <div className="rounded-[12px] p-4" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 12 }}>
                ① COST BREAKDOWN
              </div>
              <div className="space-y-2.5">
                {[
                  { k: "銅材", pct: 58, tone: BR.red },
                  { k: "電鍍", pct: 10, tone: BR.purple },
                  { k: "加工", pct: 15, tone: BR.blue },
                  { k: "包材", pct:  2, tone: BR.amber },
                  { k: "運費", pct:  5, tone: "#10b981" },
                  { k: "利潤", pct: 10, tone: BR.inkSoft },
                ].map((b) => (
                  <div key={b.k} className="flex items-center gap-2">
                    <span style={{ width: 40, fontWeight: 700, color: BR.ink }}>{b.k}</span>
                    <div className="flex-1" style={{ height: 8, background: "#eef0ea", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.pct}%`, background: b.tone, opacity: 0.9 }} />
                    </div>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 800, color: b.tone, width: 42, textAlign: "right" }}>
                      {b.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: BR.border, fontSize: 11, color: BR.inkSoft }}>
                來源：ERP 標準成本卡 + CBS
              </div>
            </div>

            {/* 中 · Market Impact */}
            <div className="rounded-[12px] p-4" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 12 }}>
                ② MARKET IMPACT
              </div>
              <div className="space-y-2.5">
                {[
                  { k: "銅",   delta: 5,  src: "LME" },
                  { k: "電鍍", delta: 12, src: "IPCEI" },
                  { k: "加工", delta: 8,  src: "鏡板" },
                  { k: "包材", delta: 0,  src: "持平" },
                  { k: "運費", delta: 7,  src: "BDI" },
                  { k: "工資", delta: 3,  src: "勞動部" },
                ].map((m) => (
                  <div key={m.k} className="flex items-center gap-3">
                    <span style={{ width: 40, fontWeight: 700, color: BR.ink }}>{m.k}</span>
                    <span style={{ flex: 1, fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint }}>{m.src}</span>
                    <span style={{
                      fontFamily: FONT_MONO, fontSize: 14, fontWeight: 800,
                      color: m.delta >= 10 ? BR.red : m.delta >= 5 ? BR.amber : m.delta > 0 ? BR.greenDeep : BR.inkFaint,
                    }}>
                      {m.delta > 0 ? "+" : ""}{m.delta}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: BR.border, fontSize: 11, color: BR.inkSoft }}>
                來源：LME · 中鋼 · BDI · 勞動部
              </div>
            </div>

            {/* 右 · AI Verdict（CEO 一眼看出） */}
            <div className="rounded-[12px] overflow-hidden" style={{ border: `2px solid ${verdict.tone}`, background: verdict.bg }}>
              <div className="flex items-baseline justify-between" style={{ background: verdict.tone, color: "#fff", padding: "10px 14px" }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>③ AI VERDICT</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>CEO 一眼看出</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span style={{ fontSize: 12, color: BR.inkSoft }}>合理</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: BR.greenDeep }}>
                    +{sc.buffered.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span style={{ fontSize: 12, color: BR.inkSoft }}>供應商喊</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: BR.red }}>
                    +{supplierClaim.toFixed(1)}%
                  </span>
                </div>
                <div className="pt-2 border-t text-center" style={{ borderColor: `${verdict.tone}30` }}>
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700, color: verdict.tone }}>
                    {verdict.label}
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkSoft, marginTop: 4 }}>
                    超出 +{overByActual.toFixed(1)}%
                  </div>
                </div>

                {/* AI Confidence ── 補上 CEO 一定問的「你有多確定？」*/}
                <div className="rounded-[10px] p-3" style={{ background: "#fff", border: `1px solid ${BR.border}` }}>
                  <div className="flex items-baseline justify-between">
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>
                      AI CONFIDENCE
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800, color: BR.greenDeep }}>
                      92%
                    </span>
                  </div>
                  <div className="mt-2" style={{ height: 6, background: "#eef0ea", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "92%", background: BR.green }} />
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between text-xs">
                    <span style={{ color: BR.inkSoft }}>合理區間</span>
                    <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.ink }}>
                      +{(sc.buffered - 0.6).toFixed(1)}% ~ +{(sc.buffered + 0.3).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: BR.inkFaint, marginTop: 4, lineHeight: 1.5 }}>
                    依據 12 個變數、近 6 個月 LME / IPCEI 資料推估
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 計算明細 — 想看細節再展開（含「當前價 vs 基期價」推導，破除「+5% 從哪來」的疑慮）*/}
          <details className="mt-4" open>
            <summary style={{ fontSize: 12, color: BR.greenDeep, cursor: "pointer", fontWeight: 700, padding: "8px 0" }}>
              ▸ 計算明細（含當前價 / 基期價 / 推導式，每個 % 都可驗證）
            </summary>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 920 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
                    {["成分", "BOM 權重", "當前價", "基期價", "單位", "變動推導", "當前變動", "計算式", "合理貢獻"].map((h, i) => (
                      <th key={h} style={{
                        fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                        color: BR.inkFaint, textAlign: i >= 1 ? "right" : "left", padding: "9px 8px",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sc.rows.map((r) => {
                    const cp = COMPONENT_PRICE[r.k];
                    return (
                      <tr key={r.k} style={{ borderBottom: `1px solid #f3f5ef`, verticalAlign: "top" }}>
                        <td style={{ padding: "11px 8px" }}>
                          <div style={{ fontWeight: 700 }}>{r.k}</div>
                          {cp && <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: BR.inkFaint, marginTop: 2 }}>{cp.source}</div>}
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO }}>{r.weight}%</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700 }}>
                          {cp ? cp.current.toLocaleString() : "—"}
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, color: BR.inkSoft }}>
                          {cp ? cp.baseline.toLocaleString() : "—"}
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint }}>
                          {cp?.unit ?? ""}
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint }}>
                          {cp ? `(${cp.current.toLocaleString()} − ${cp.baseline.toLocaleString()}) / ${cp.baseline.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: r.delta > 5 ? BR.red : BR.amber }}>
                          +{r.delta}%
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>
                          {r.weight}% × {r.delta}%
                        </td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>
                          +{r.contrib.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: BR.greenSoft }}>
                    <td colSpan={8} style={{ padding: "12px 8px", fontWeight: 700, color: BR.greenInk }}>合理上限（加總）</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.greenInk }}>
                      +{sc.total.toFixed(1)}%
                    </td>
                  </tr>
                  <tr style={{ background: BR.greenSoft }}>
                    <td colSpan={8} style={{ padding: "12px 8px", fontWeight: 700, color: BR.greenInk }}>緩衝後（×1.10）</td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.greenInk }}>
                      +{sc.buffered.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-2 text-xs" style={{ color: BR.inkSoft, lineHeight: 1.55 }}>
              <b style={{ color: BR.ink }}>讀法</b>：例如「銅材 +5%」=（LME 銅當前 9,472 USD/MT − 30 日均基期 9,021 USD/MT）÷ 9,021 ≒ 5.0%。
              此 5% 不是供應商喊的，是用公開市場價反推出來的，<b>可逐筆驗證</b>。
            </div>
          </details>

          {/* Scenario: 如果供應商喊 25% */}
          <div className="rounded-[10px] p-3 mt-4" style={{ background: BR.redSoft, border: `1px solid ${BR.red}40` }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.red, letterSpacing: "0.08em" }}>
              ④ 對照情境 · 若供應商喊 +{supplierExcess}%
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span style={{ fontSize: 13, color: BR.inkSoft }}>合理上限 <b style={{ fontFamily: FONT_MONO, color: BR.greenDeep }}>+{sc.buffered}%</b>　·　供應商要求 <b style={{ fontFamily: FONT_MONO, color: BR.red }}>+{supplierExcess}%</b></span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800, color: BR.red }}>超出 +{overByExcess.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: BR.red, marginTop: 6 }}>
              → 自動觸發「強硬議價」流程
            </div>
          </div>
        </Card>

        {/* ▶▶▶ 補強 ① · Supplier Price History — 這家供應商歷史漲價軌跡 */}
        <StepHeader badge="ENHANCE 1" title="Supplier Price History" en="供應商歷史漲價曲線" desc="過去 6 年這家供應商對此料漲了幾次？越來越過分了嗎？" tone={BR.purple} />
        <SupplierPriceHistoryCard />

        {/* ▶▶▶ 補強 ② · Alternative Supplier Recommendation — 該換家了嗎 */}
        <StepHeader badge="ENHANCE 2" title="Alternative Supplier" en="替代供應商建議" desc="若議價失敗，AI 自動推薦可立即詢價的替代供應商" tone={BR.purple} />
        <AlternativeSupplierCard buffered={sc.buffered} />

        {/* ▶▶▶ 補強 ③ · Negotiation Copilot — AI 直接草擬議價信 */}
        <StepHeader badge="ENHANCE 3" title="Negotiation Copilot" en="AI 草擬議價信稿" desc="業務 / 採購不會寫 — AI 都做這些（不只給數字，給文字）" tone={BR.purple} />
        <NegotiationCopilotCard
          partNo={SELECTED.partNo}
          supplier={SELECTED.supplier}
          supplierClaim={supplierClaim}
          buffered={sc.buffered}
          overByActual={overByActual}
        />

        {/* 結果 · 供應商不合理 → 議價建議 */}
        <StepHeader badge="OUTPUT" title="結果 · 議價建議" en="If supplier unreasonable → Negotiation Brief" desc="自動產出可在會議念出的證據包" tone={BR.red} />
        <Card style={{ background: BR.greenInk, color: "#fff" }}>
          <div className="grid lg:grid-cols-3 gap-5">
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#9aa78d", letterSpacing: "0.08em", marginBottom: 8 }}>
                ① 我方立場
              </div>
              <ul className="space-y-2 text-sm" style={{ color: "#e7ede0" }}>
                <li>· 接受 Should-Cost 上限 <b style={{ color: BR.green, fontFamily: FONT_MONO }}>+{sc.buffered}%</b></li>
                <li>· 超出部分需供應商明確說明</li>
                <li>· 否則 <b style={{ color: "#ff8a7a" }}>退單重議</b></li>
              </ul>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#9aa78d", letterSpacing: "0.08em", marginBottom: 8 }}>
                ② 議價會議拿話清單
              </div>
              <ol className="space-y-1.5 text-sm" style={{ color: "#e7ede0" }}>
                <li>1. 銅佔 58%、銅只漲 5% → 該欄合理 +2.9%</li>
                <li>2. 電鍍佔 10%、+12% → 該欄合理 +1.2%</li>
                <li>3. 加工佔 15%、+8% → 該欄合理 +1.2%</li>
                <li>4. 運費佔 5%、+7% → 該欄合理 +0.4%</li>
                <li>5. 加總 +5.7%，緩衝後上限 <b style={{ color: BR.green, fontFamily: FONT_MONO }}>+6.3%</b></li>
                <li>6. 您喊 <b style={{ color: "#ff8a7a", fontFamily: FONT_MONO }}>+{supplierExcess}%</b> → 超出 +{overByExcess.toFixed(1)}%</li>
              </ol>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#9aa78d", letterSpacing: "0.08em", marginBottom: 8 }}>
                ③ 一鍵動作
              </div>
              <div className="space-y-2">
                {/* 三版報告 — 不同對象不同頁數 */}
                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, color: "#9aa78d",
                  letterSpacing: "0.08em", paddingBottom: 2,
                }}>
                  REPORT · 依對象選版本
                </div>
                <button
                  type="button"
                  onClick={handleGenerateBoardReport}
                  style={{
                    width: "100%", background: BR.green, color: "#fff",
                    border: "none", borderRadius: 9, padding: "11px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                    display: "block", textAlign: "left",
                  }}>
                  👔 L0 Board Decision Card　<span style={{ opacity: 0.85, fontWeight: 600 }}>· 1 頁 · 董事長 / 總經理 / CEO</span>
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePurchasingReport}
                  style={{
                    width: "100%", background: "rgba(255,255,255,.12)", color: "#fff",
                    border: "1px solid rgba(118,185,0,.4)", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "block", textAlign: "left",
                  }}>
                  🏛 L1 Executive Report　<span style={{ opacity: 0.85, fontWeight: 600 }}>· 3 頁 · 總經理閱讀</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  style={{
                    width: "100%", background: "rgba(255,255,255,.06)", color: "#dfe5d8",
                    border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "block", textAlign: "left",
                  }}>
                  📑 完整版　<span style={{ opacity: 0.7 }}>· 11 段 · 內部 deep dive</span>
                </button>

                <div style={{
                  fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, color: "#9aa78d",
                  letterSpacing: "0.08em", paddingTop: 8, paddingBottom: 2,
                }}>
                  ACTION · 議價動作
                </div>
                <a
                  href={meetingMailto}
                  onClick={() => showToast("✓ 議價會議邀請已開啟郵件草稿")}
                  style={{
                    display: "block", textDecoration: "none",
                    width: "100%", background: "rgba(255,255,255,.08)", color: "#fff",
                    border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    textAlign: "center", boxSizing: "border-box",
                  }}>
                  📨 發送議價會議邀請
                </a>
                <a
                  href={rejectMailto}
                  onClick={() => showToast("✓ 退單通知已開啟郵件草稿")}
                  style={{
                    display: "block", textDecoration: "none",
                    width: "100%", background: "rgba(255,255,255,.08)", color: "#fff",
                    border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    textAlign: "center", boxSizing: "border-box",
                  }}>
                  📝 退單通知供應商
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* ▶▶▶ 終評 · AI 採購情報中心（AI Cost Intelligence Center） · 99 分 */}
        <CostIntelligenceCenterCard />

        {/* WHY: 這就是你系統最大的賣點 */}
        <Card>
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              color: "#fff", background: BR.purple, padding: "4px 9px", borderRadius: 5,
            }}>SYSTEM VALUE</span>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>
              這就是 AI Supply Chain OS 最大的賣點
            </h3>
          </div>
          <p style={{ fontSize: 13, color: BR.inkSoft, lineHeight: 1.7, marginBottom: 12 }}>
            供應商把報價塞給你時，多數系統只能「收下、核准、入帳」。
            <b style={{ color: BR.ink }}>AI Quotation Analyzer 把流程倒過來</b> ——
            OCR 抓表 → 對齊 BOM → 拉商品價 → Should-Cost 反推 → 比對供應商說的 ——
            CEO / 採購不用懂計算，直接看到 <b style={{ color: BR.purple }}>+{overByExcess.toFixed(1)}% 議價空間</b>。
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { k: "OCR → 自動抽欄位",     v: "PDF / JPG / Excel", tone: BR.green },
              { k: "BOM Match",              v: "ERP 標成 + CBS",    tone: BR.blue },
              { k: "Commodity Engine",       v: "LME / 指數 / 工資", tone: BR.amber },
              { k: "Negotiation Copilot",    v: "Should-Cost 報告 + 拿話清單", tone: BR.purple },
            ].map((b) => (
              <div key={b.k} className="rounded-[10px] p-3" style={{ background: `${b.tone}10`, border: `1px solid ${b.tone}40` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: b.tone }}>{b.k}</div>
                <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 3 }}>{b.v}</div>
              </div>
            ))}
          </div>
        </Card>

        <footer className="flex items-center gap-5 flex-wrap pt-4" style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint,
        }}>
          <span style={{ color: BR.greenDeep, fontWeight: 600 }}>● AI Confidence 92%</span>
          <Link href="/erp/l5-final" style={{ color: BR.greenDeep, textDecoration: "underline" }}>→ 看 L5 Final · Price Validation Engine</Link>
          <Link href="/erp/procurement" style={{ color: BR.greenDeep, textDecoration: "underline" }}>← 回 L3 採購中心</Link>
          <span className="flex-1" />
          <span>CHI HUA AI · L3 · AI Quotation Analyzer · /erp/quotation-analyzer</span>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: BR.card, border: `1px solid ${BR.border}`, borderRadius: 14,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "20px 22px", ...style,
    }}>
      {children}
    </div>
  );
}

function StepHeader({ badge, title, en, desc, tone = BR.green }: {
  badge: string; title: string; en: string; desc: string; tone?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 flex-wrap" style={{ marginTop: 4 }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
        color: "#fff", background: tone, padding: "4px 10px", borderRadius: 5,
      }}>
        {badge}
      </span>
      <h2 style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700 }}>{title}</h2>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>{en}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: BR.inkSoft }}>{desc}</span>
    </div>
  );
}

// ============================================================
// 產出 AI Should-Cost Decision Report（世界級 · 9 段式）
//   §1 Executive Summary (AI Verdict) — CEO 只看這頁
//   §2 Price Change
//   §3 Cost Breakdown
//   §4 Commodity Impact（含當前 vs 基期推導）
//   §5 Supplier Benchmark · Historical Trend
//   §6 Alternative Supplier Comparison
//   §7 Negotiation Strategy（行動 / 證據 / 拒絕 / 備案）
//   §8 AI Confidence（信心拆解）
//   §9 Approval Recommendation
// ============================================================
function buildShouldCostReportHtml(args: {
  partNo: string;
  supplier: string;
  oldPrice: number;
  newPrice: number;
  supplierClaim: number;
  supplierExcess: number;
  sc: { rows: { k: string; weight: number; delta: number; contrib: number }[]; total: number; buffered: number };
  bom: { k: string; pct: number; tone: string; mapTo: string }[];
  moves: { k: string; current: number; baseline: number; unit: string; asOf: string; source: string; delta: number }[];
}): string {
  const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  const overByActual = +(args.supplierClaim - args.sc.buffered).toFixed(1);
  // 建議議價目標 = 舊價 × (1 + 合理上限)
  const targetPrice = +(args.oldPrice * (1 + args.sc.buffered / 100)).toFixed(2);
  // 合理區間：±0.6%
  const fairLow = +(args.sc.buffered - 0.6).toFixed(1);
  const fairHigh = +(args.sc.buffered + 0.3).toFixed(1);
  const verdictLabel = args.supplierClaim > args.sc.buffered * 1.5 ? "不合理"
                     : args.supplierClaim > args.sc.buffered ? "偏高"
                                                              : "合理";
  const verdictIcon = args.supplierClaim > args.sc.buffered * 1.5 ? "🚨"
                    : args.supplierClaim > args.sc.buffered ? "⚠"
                                                            : "✓";
  const verdictColor = args.supplierClaim > args.sc.buffered * 1.5 ? "#d4351c"
                     : args.supplierClaim > args.sc.buffered ? "#b8860b" : "#4d7c0f";

  // §5 歷史趨勢
  const historyAvgHike = +(SUPPLIER_HISTORY.filter((h) => h.hike !== null).slice(0, -1).reduce((s, h) => s + (h.hike ?? 0), 0) / 4).toFixed(1);
  const historyMultiple = +(args.supplierClaim / historyAvgHike).toFixed(1);

  // §8 Confidence 拆解
  const confidenceBreakdown = [
    { k: "BOM 完整性",       v: 100, note: "已從 ERP 標準成本卡確認 6 個成分" },
    { k: "市場資料完整度",   v: 95,  note: "LME / IPCEI / BDI / 勞動部 皆即時" },
    { k: "同業對比覆蓋率",   v: 90,  note: "3 家替代供應商已詢價對比" },
    { k: "歷史資料覆蓋",     v: 88,  note: "6 年 6 次調價軌跡" },
  ];
  const overallConfidence = 92;

  // §6 替代供應商精簡版（含 Risk Score + 完整績效指標）
  const altsRich = [
    { name: "現任 企能", quote: args.newPrice, leadWeeks: 7, quality: "A",  otd: 92, scale: "中", riskScore: 65, current: true },
    { name: "力豐電子",  quote: 7.10,           leadWeeks: 3, quality: "A+", otd: 95, scale: "大", riskScore: 88, current: false },
    { name: "鼎能精密",  quote: 6.90,           leadWeeks: 5, quality: "A+", otd: 97, scale: "中", riskScore: 92, current: false },
    { name: "新竹 EFG",  quote: 7.30,           leadWeeks: 4, quality: "A",  otd: 89, scale: "低", riskScore: 76, current: false },
  ];
  const alts = ALT_SUPPLIERS.map((s) => ({
    name: s.name, quote: s.quote, leadWeeks: s.leadWeeks, quality: s.qualityScore >= 95 ? "A+" : "A",
  }));

  // 月用量 17,000 件 → 年化財務衝擊
  const monthlyVolume = 17000;
  const annualVolume = monthlyVolume * 12;
  const annualImpactAcceptVsTarget = Math.round((args.newPrice - targetPrice) * annualVolume); // 接受 vs 目標
  const annualImpactAcceptVsOld    = Math.round((args.newPrice - args.oldPrice) * annualVolume); // 接受 vs 原價
  const annualImpactSwitch         = Math.round((args.newPrice - altsRich[2].quote) * annualVolume); // 切換鼎能 vs 接受
  const bestAltSaving = Math.round((args.newPrice - alts[0].quote) * 12000 / 100); // 月用 12,000 件（§6 用）

  // §11 年度毛利報告（broader：含本料對全年毛利的拖累 %）
  const annualRevenue = 9_700_000; // 此料相關年營收
  const grossMarginDropPct = 8.95;
  const grossMarginDropNTD = Math.round(annualRevenue * grossMarginDropPct / 100);  // ≒ NT$ 868,400

  // 月度毛利趨勢（mock — 顯示「接受漲價後毛利下滑」軌跡）
  const monthlyGM = [
    { month: "2026-04", gm: 21.4 },
    { month: "2026-05", gm: 21.1 },
    { month: "2026-06", gm: 20.8 },
    { month: "2026-07*", gm: 19.5 },   // * if accept
    { month: "2026-08*", gm: 18.3 },
    { month: "2026-09*", gm: 12.45 },
  ];

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8" />
<title>AI Should-Cost Decision Report · ${args.partNo}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans TC", "Sora", system-ui, sans-serif; color: #0c1208; margin: 0; padding: 20px; line-height: 1.55; }
  .mono { font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace; font-feature-settings: "tnum" 1; }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; color: #0c1908; }
  h2 { font-size: 14px; font-weight: 700; margin: 22px 0 8px; padding: 6px 10px; background: #f0f7e4; border-left: 4px solid #76b900; color: #0c1908; page-break-after: avoid; }
  h3 { font-size: 13px; font-weight: 700; margin: 12px 0 6px; color: #0c1908; }
  .sub { color: #5b6356; font-size: 12px; margin-bottom: 18px; }
  .meta { font-size: 10.5px; color: #9aa291; margin-bottom: 8px; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { padding: 7px 8px; border-bottom: 1px solid #e9ece3; font-size: 11.5px; vertical-align: top; }
  th { background: #fbfcfa; color: #5b6356; text-align: left; font-weight: 600; font-size: 10px; letter-spacing: .04em; text-transform: uppercase; }
  td.r, th.r { text-align: right; }
  .red    { color: #d4351c; font-weight: 700; }
  .green  { color: #4d7c0f; font-weight: 700; }
  .purple { color: #c026d3; font-weight: 700; }
  .amber  { color: #b8860b; font-weight: 700; }
  .muted  { color: #9aa291; }
  .pagebreak { page-break-after: always; }
  .nobreak   { page-break-inside: avoid; }

  /* §1 Executive Summary cover */
  .cover { padding: 22px 24px; border: 2px solid ${verdictColor}; border-radius: 14px; background: ${verdictColor}08; margin: 8px 0 14px; }
  .cover-tag { display: inline-block; font-family: "IBM Plex Mono"; font-size: 10px; font-weight: 700; letter-spacing: .12em; color: #fff; background: #0c1908; padding: 4px 10px; border-radius: 5px; margin-bottom: 6px; }
  .cover-h { font-size: 26px; font-weight: 800; color: ${verdictColor}; margin: 4px 0 14px; line-height: 1.1; }
  .cover-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px 18px; }
  .cover-cell { border-bottom: 1px solid #e9ece3; padding: 6px 0 8px; }
  .cover-cell .k { font-size: 10px; color: #9aa291; letter-spacing: .06em; }
  .cover-cell .v { font-family: "IBM Plex Mono"; font-size: 17px; font-weight: 800; color: #0c1208; margin-top: 3px; }
  .cover-cell .v.red    { color: #d4351c; }
  .cover-cell .v.green  { color: #4d7c0f; }
  .cover-cell .v.amber  { color: #b8860b; }
  .cover-cell .v.purple { color: #c026d3; }
  .cover-verdict { margin-top: 14px; padding: 14px; border-radius: 10px; background: ${verdictColor}; color: #fff; display: flex; align-items: baseline; justify-content: space-between; }
  .cover-verdict .lbl { font-size: 15px; font-weight: 700; }
  .cover-verdict .big { font-family: "IBM Plex Mono"; font-size: 28px; font-weight: 800; }
  .ceo-note { font-size: 11.5px; color: #5b6356; margin-top: 10px; text-align: center; font-style: italic; }

  /* §2-9 layout helpers */
  .twocol { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
  .chip   { display: inline-block; font-family: "IBM Plex Mono"; font-size: 9.5px; font-weight: 700; color: #fff; padding: 2px 7px; border-radius: 4px; letter-spacing: .04em; }
  .chip.r { background: #d4351c; } .chip.g { background: #4d7c0f; } .chip.a { background: #b8860b; } .chip.p { background: #c026d3; }
  .note { font-size: 11px; color: #5b6356; padding: 8px 12px; background: #f0f7e4; border-left: 3px solid #76b900; border-radius: 4px; margin-top: 6px; }
  .note b { color: #0c1908; }

  /* §5 sparkline */
  .spark { width: 100%; height: 80px; }
  .spark text { font-family: "IBM Plex Mono"; }

  /* §7 evidence list */
  ol.evidence { padding-left: 22px; margin: 6px 0 0; }
  ol.evidence li { margin: 4px 0; font-size: 12px; }

  /* §8 confidence bars */
  .conf-row { display: grid; grid-template-columns: 130px 1fr 50px; gap: 10px; align-items: center; padding: 4px 0; font-size: 11.5px; }
  .conf-bar { height: 7px; border-radius: 3px; background: #eef0ea; overflow: hidden; }
  .conf-bar i { display: block; height: 100%; background: #76b900; }

  /* Footer */
  .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e9ece3; font-size: 9.5px; color: #9aa291; line-height: 1.5; }

  /* TOC */
  .toc { font-size: 11.5px; color: #5b6356; }
  .toc-line { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e9ece3; }
  .toc-line b { color: #0c1908; }
  .toc-line .num { font-family: "IBM Plex Mono"; color: #9aa291; }
</style>
</head>
<body>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- PAGE 0 · BOARD DECISION CARD — 董事會一頁卡 -->
  <!-- ═════════════════════════════════════════════════════ -->
  <div style="border:3px solid ${verdictColor}; border-radius:14px; padding:28px 32px; margin:6px 0 16px; background:linear-gradient(135deg, #fbfcfa 0%, ${verdictColor}08 100%); position:relative;">
    <div style="position:absolute; top:14px; right:18px; font-family:'IBM Plex Mono'; font-size:9px; color:#9aa291; letter-spacing:.12em">PAGE 0 · FOR BOARD</div>
    <div style="font-family:'IBM Plex Mono'; font-size:10px; font-weight:700; letter-spacing:.14em; color:${verdictColor}; margin-bottom:6px">BOARD DECISION CARD</div>
    <div style="font-size:24px; font-weight:800; color:#0c1908; line-height:1.15; margin-bottom:6px">${args.partNo}　·　${args.supplier} 漲價案</div>
    <div style="font-size:12.5px; color:#5b6356; margin-bottom:18px">給董事會 5 秒看完 — 是否核准採購提案</div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px">
      <!-- 左 · AI Verdict 大字 -->
      <div style="background:${verdictColor}; color:#fff; border-radius:11px; padding:18px 22px">
        <div style="font-family:'IBM Plex Mono'; font-size:10px; letter-spacing:.12em; color:rgba(255,255,255,.7)">AI VERDICT</div>
        <div style="font-size:38px; font-weight:800; margin-top:4px; line-height:1">${verdictIcon} ${verdictLabel}</div>
        <div style="font-family:'IBM Plex Mono'; font-size:13px; margin-top:8px; color:rgba(255,255,255,.85)">
          漲幅 +${args.supplierClaim.toFixed(1)}%（${args.oldPrice.toFixed(2)} → ${args.newPrice.toFixed(2)}）<br/>
          超出合理範圍 +${overByActual.toFixed(1)}%
        </div>
      </div>

      <!-- 右 · 損失試算（CEO 最在意的數字）-->
      <div style="background:#0c1908; color:#fff; border-radius:11px; padding:18px 22px">
        <div style="font-family:'IBM Plex Mono'; font-size:10px; letter-spacing:.12em; color:#9aa78d">公司年化損失 IF ACCEPTED</div>
        <div style="font-family:'IBM Plex Mono'; font-size:34px; font-weight:800; color:#ff8a7a; margin-top:4px; line-height:1">
          −NT$ ${annualImpactAcceptVsTarget.toLocaleString()}
        </div>
        <div style="font-size:11.5px; margin-top:8px; color:#cdd6c2; line-height:1.5">
          月用 ${monthlyVolume.toLocaleString()} 件　·　差 ${(args.newPrice - targetPrice).toFixed(2)} 元/件　·　12 月累計<br/>
          毛利率將從 21.4% 跌至 <b style="color:#ff8a7a">12.45%</b>（−8.95 pp）
        </div>
      </div>
    </div>

    <!-- 三層建議 + 簽核 -->
    <div style="display:grid; grid-template-columns:1.2fr 1.2fr 1.2fr; gap:10px; margin-bottom:14px">
      <div style="background:#fff; border:2px solid #d4351c; border-radius:10px; padding:12px 14px">
        <div style="font-family:'IBM Plex Mono'; font-size:10px; color:#d4351c; font-weight:700; letter-spacing:.08em">☑ 拒絕現報價</div>
        <div style="font-size:12px; color:#0c1208; margin-top:4px; line-height:1.45">不接受 +${args.supplierClaim.toFixed(1)}%，要求回到合理上限 <b>${targetPrice.toFixed(2)}</b></div>
      </div>
      <div style="background:#fff; border:2px solid #4d7c0f; border-radius:10px; padding:12px 14px">
        <div style="font-family:'IBM Plex Mono'; font-size:10px; color:#4d7c0f; font-weight:700; letter-spacing:.08em">☑ 切換 鼎能精密</div>
        <div style="font-size:12px; color:#0c1208; margin-top:4px; line-height:1.45">${altsRich[2].quote.toFixed(2)} 元 / ${altsRich[2].leadWeeks} 週 · Risk Score <b>${altsRich[2].riskScore}/100</b></div>
      </div>
      <div style="background:#fff; border:2px dashed #9aa291; border-radius:10px; padding:12px 14px">
        <div style="font-family:'IBM Plex Mono'; font-size:10px; color:#5b6356; font-weight:700; letter-spacing:.08em">☐ 接受現喊價</div>
        <div style="font-size:12px; color:#5b6356; margin-top:4px; line-height:1.45">${args.newPrice.toFixed(2)} 元 → 年損 NT$ ${annualImpactAcceptVsTarget.toLocaleString()} <span class="muted">（不建議）</span></div>
      </div>
    </div>

    <!-- 一行結論 -->
    <div style="background:${verdictColor}; color:#fff; border-radius:8px; padding:10px 14px; font-size:13px; font-weight:600; text-align:center">
      <b>AI 一句話結論：</b> 退回供應商重新報價（目標 ${targetPrice.toFixed(2)}），同時啟動鼎能精密 RFQ 作為備案 — 兩路並行，<b>14 天內鎖定結果</b>。
    </div>

    <!-- 簽核行 -->
    <div style="display:flex; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px solid #e9ece3; font-size:10.5px; color:#5b6356">
      <span>核准 □　保留 □　退回 □</span>
      <span class="muted">簽核：____________________　日期：____________</span>
    </div>
  </div>

  <div class="pagebreak"></div>

  <div class="meta">CHI HUA AI · L3 AI Quotation Analyzer · AI Should-Cost Decision Report</div>
  <h1>議價的 AI Should-Cost Decision Report</h1>
  <div class="sub">料號 <b class="mono">${args.partNo}</b> · 供應商 <b>${args.supplier}</b> · 報告日期 ${today}</div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §1 EXECUTIVE SUMMARY (AI VERDICT) — CEO 只看這頁 -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§1 Executive Summary · AI Verdict</h2>
  <div class="cover nobreak">
    <span class="cover-tag">EXECUTIVE SUMMARY · 這一頁最重要 · CEO 只看這頁</span>
    <div class="cover-h">${verdictIcon} ${verdictLabel}　·　超出合理範圍 +${overByActual.toFixed(1)}%</div>

    <div class="cover-grid">
      <div class="cover-cell"><div class="k">供應商</div><div class="v">${args.supplier}</div></div>
      <div class="cover-cell"><div class="k">料號</div><div class="v mono">${args.partNo}</div></div>
      <div class="cover-cell"><div class="k">AI 信心度</div><div class="v green">${overallConfidence}%</div></div>

      <div class="cover-cell"><div class="k">舊價格</div><div class="v">${args.oldPrice.toFixed(2)}</div></div>
      <div class="cover-cell"><div class="k">新價格（供應商喊）</div><div class="v red">${args.newPrice.toFixed(2)}</div></div>
      <div class="cover-cell"><div class="k">漲幅</div><div class="v red">+${args.supplierClaim.toFixed(1)}%</div></div>

      <div class="cover-cell"><div class="k">AI 合理區間</div><div class="v green">+${fairLow}% ~ +${fairHigh}%</div></div>
      <div class="cover-cell"><div class="k">建議議價目標</div><div class="v purple">${targetPrice.toFixed(2)} 元</div></div>
      <div class="cover-cell"><div class="k">超出合理範圍</div><div class="v red">+${overByActual.toFixed(1)}%</div></div>
    </div>

    <div class="cover-verdict">
      <span class="lbl">AI 結論</span>
      <span class="big">${verdictIcon} ${verdictLabel}</span>
    </div>

    <div class="ceo-note">這一頁最重要 — CEO 只看這頁。其後 §2 ~ §9 為支撐證據與議價依據。</div>
  </div>

  <h3>本報告目錄（Page 0 + 11 段落）</h3>
  <div class="toc nobreak">
    ${[
      ["P0",  "Board Decision Card",                  "董事會 5 秒看完 · 一頁卡"],
      ["§1",  "Executive Summary · AI Verdict",       "CEO 一頁摘要"],
      ["§2",  "Price Change",                          "舊價 / 新價 / 漲幅"],
      ["§3",  "Cost Breakdown + CBS Drill Down",      "BOM × CBS + 子成分爆炸樹"],
      ["§4",  "Commodity Impact",                      "各成分當前 vs 基期（推導透明）"],
      ["§5",  "Supplier Benchmark · Historical Trend", "過去 6 年漲價軌跡"],
      ["§6",  "Alternative Supplier + Risk Score",    "備案供應商比較 + Supplier Risk Score"],
      ["§7",  "Negotiation Strategy",                  "行動 · 證據 · 拒絕 · 備案"],
      ["§8",  "AI Confidence",                         "信心度拆解 · 為何 92%"],
      ["§9",  "Approval Recommendation + Action",      "簽核選項 + P1/P2/P3 Action Priority"],
      ["§10", "Financial Impact",                      "公司損失多少 — CEO 真正在意"],
      ["§11", "Annual Gross Margin Report",            "整合至年度毛利 · 董事會視角"],
    ].map(([n, t, d]) => `<div class="toc-line"><span><span class="num">${n}</span>　<b>${t}</b></span><span class="muted">${d}</span></div>`).join("")}
  </div>

  <div class="pagebreak"></div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §2 PRICE CHANGE -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§2 Price Change · 價格變動</h2>
  <table class="nobreak">
    <thead><tr><th>項目</th><th class="r">數值</th></tr></thead>
    <tbody>
      <tr><td>舊單價</td><td class="r mono">${args.oldPrice.toFixed(2)}</td></tr>
      <tr><td>新單價（供應商喊）</td><td class="r mono red">${args.newPrice.toFixed(2)}</td></tr>
      <tr><td>實際漲幅</td><td class="r mono red">+${args.supplierClaim.toFixed(1)}%</td></tr>
      <tr style="background:#f0f7e4"><td><b>建議議價目標</b></td><td class="r mono"><b class="purple">${targetPrice.toFixed(2)}</b>（即合理上限 +${args.sc.buffered}%）</td></tr>
    </tbody>
  </table>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §3 COST BREAKDOWN -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§3 Cost Breakdown · BOM × CBS 成分結構（含 Drill Down）</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    依 ERP 標準成本卡 + Cost Breakdown System（CBS）反推此料各成分佔比。
    <b>展開 Cost Explosion Tree 看到子成分</b> — 不只「電鍍 10%」，而是「電鍍 10% 拆成鏡片 / 鏡頭 / 運費 / 包材」。
  </p>
  <table class="nobreak">
    <thead><tr><th>成分</th><th class="r">佔成本</th><th>對應商品 / 指數</th></tr></thead>
    <tbody>
      ${args.bom.map((b) => `<tr><td>${b.k}</td><td class="r mono">${b.pct}%</td><td>${b.mapTo}</td></tr>`).join("")}
    </tbody>
  </table>

  <h3>Cost Explosion Tree · CBS Drill Down</h3>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 8px">
    每個第一層成分都可以展開到子成分 — 真正找出「漲價來自哪一顆螺絲」。
  </p>
  <div style="font-family:'IBM Plex Mono';font-size:11.5px;line-height:1.85;background:#fbfcfa;border:1px solid #e9ece3;border-radius:8px;padding:14px 18px">
    <div><b style="color:#0c1908">▼ ${args.partNo}</b>　<span class="muted">100%</span></div>
    <div style="padding-left:20px"><b style="color:#d4351c">├─ 銅材</b>　<span style="color:#d4351c">58%</span>　<span class="muted">→ LME 銅 (+5.0%)</span></div>
    <div style="padding-left:36px"><span class="muted">├─ 漆包銅線 0.8mm　42%</span></div>
    <div style="padding-left:36px"><span class="muted">└─ 端子壓接銅　16%</span></div>
    <div style="padding-left:20px"><b style="color:#c026d3">├─ 電鍍</b>　<span style="color:#c026d3">10%</span>　<span class="muted">→ IPCEI 指數 (+12.0%)</span></div>
    <div style="padding-left:36px"><span class="muted">├─ 鏡片電鍍　4%</span>　<span class="muted">(鏡頭鍍膜)</span></div>
    <div style="padding-left:36px"><span class="muted">├─ 端子鍍金　3.5%</span>　<span class="muted">(防氧化)</span></div>
    <div style="padding-left:36px"><span class="muted">└─ 包材印刷　2.5%</span></div>
    <div style="padding-left:20px"><b style="color:#3a6ea5">├─ 加工</b>　<span style="color:#3a6ea5">15%</span>　<span class="muted">→ 工資 + 鏡板 (+8%)</span></div>
    <div style="padding-left:36px"><span class="muted">├─ SMT 貼片　6%</span></div>
    <div style="padding-left:36px"><span class="muted">├─ 組裝人工　5%</span></div>
    <div style="padding-left:36px"><span class="muted">└─ 測試 / QC　4%</span></div>
    <div style="padding-left:20px"><b style="color:#10b981">├─ 運費</b>　<span style="color:#10b981">5%</span>　<span class="muted">→ BDI (+7.0%)</span></div>
    <div style="padding-left:36px"><span class="muted">├─ 海運（上海 → 高雄）　3.5%</span></div>
    <div style="padding-left:36px"><span class="muted">└─ 內陸運輸 + 報關　1.5%</span></div>
    <div style="padding-left:20px"><b style="color:#b8860b">├─ 包材</b>　<span style="color:#b8860b">2%</span>　<span class="muted">→ 紙箱 / EPE</span></div>
    <div style="padding-left:20px"><b style="color:#5b6356">└─ 利潤</b>　<span class="muted">10%</span>　<span class="muted">→ 供應商 markup</span></div>
  </div>
  <div class="note">
    <b>價值</b> · 一般 ERP 只能告訴你「電鍍 10%」，但無法回答「電鍍裡面為何漲」。
    這顆樹展開後告訴董事會：「電鍍漲的真正原因是<b>鏡片鍍膜 4%</b>（高密度 SMT 工序）」 — 議價時直接針對這顆螺絲談，效率最高。
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §4 COMMODITY IMPACT — 含當前 vs 基期推導 -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§4 Commodity Impact · 各成分當前波動（含推導）</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    <b>每個 % 都不是供應商說了算 — 是用公開市場價反推的，可逐筆驗證。</b>
  </p>
  <table class="nobreak">
    <thead>
      <tr>
        <th>商品 / 指數</th>
        <th class="r">當前價</th>
        <th class="r">基期價</th>
        <th class="r">單位</th>
        <th class="r">變動推導</th>
        <th class="r">變動 %</th>
        <th>來源 · 時點</th>
      </tr>
    </thead>
    <tbody>
      ${args.moves.map((m) => `
        <tr>
          <td>${m.k}</td>
          <td class="r mono"><b>${m.current.toLocaleString()}</b></td>
          <td class="r mono muted">${m.baseline.toLocaleString()}</td>
          <td class="r mono muted" style="font-size:10px">${m.unit}</td>
          <td class="r mono muted" style="font-size:10px">(${m.current.toLocaleString()} − ${m.baseline.toLocaleString()}) / ${m.baseline.toLocaleString()}</td>
          <td class="r mono ${m.delta > 5 ? "red" : "amber"}">+${m.delta.toFixed(1)}%</td>
          <td style="font-size:10.5px">${m.source}<br/><span class="muted">${m.asOf}</span></td>
        </tr>`).join("")}
    </tbody>
  </table>

  <h3>成本貢獻分析（議價核心）</h3>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    只看 BOM 佔比不夠 — 必須乘上當前市場變動，才知道「合理該漲多少」。
  </p>
  <table class="nobreak">
    <thead>
      <tr>
        <th>成分</th>
        <th class="r">BOM 權重</th>
        <th class="r">當前價</th>
        <th class="r">基期價</th>
        <th class="r">市場變動</th>
        <th class="r">計算式</th>
        <th class="r">合理貢獻</th>
      </tr>
    </thead>
    <tbody>
      ${args.sc.rows.map((r) => {
        const cp = COMPONENT_PRICE[r.k];
        const cur = cp ? cp.current.toLocaleString() : "—";
        const base = cp ? cp.baseline.toLocaleString() : "—";
        return `<tr>
          <td><b>${r.k}</b>${cp ? `<div style="font-size:9.5px;color:#9aa291">${cp.source}</div>` : ""}</td>
          <td class="r mono">${r.weight}%</td>
          <td class="r mono">${cur}</td>
          <td class="r mono muted">${base}</td>
          <td class="r mono ${r.delta > 5 ? "red" : "amber"}">+${r.delta}%</td>
          <td class="r mono muted" style="font-size:10.5px">${r.weight}% × ${r.delta}%</td>
          <td class="r mono green">+${r.contrib.toFixed(2)}%</td>
        </tr>`;
      }).join("")}
      <tr style="background:#f0f7e4"><td colspan="6"><b>合理上限（加總）</b></td><td class="r mono"><b>+${args.sc.total.toFixed(1)}%</b></td></tr>
      <tr style="background:#f0f7e4"><td colspan="6"><b>緩衝後（×1.10）</b></td><td class="r mono"><b>+${args.sc.buffered.toFixed(1)}%</b></td></tr>
    </tbody>
  </table>
  <div class="note">
    <b>讀法</b>：以「銅材 +5%」為例 — <b class="mono">(9,472 − 9,021) / 9,021 ≒ 5.0%</b>。
    合計 +5.65%，緩衝後 <b>+${args.sc.buffered}%</b> 即合理上限。
    供應商喊 +${args.supplierClaim}% <b class="red">超出 +${overByActual}%</b>，沒有市場依據。
  </div>

  <div class="pagebreak"></div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §5 SUPPLIER BENCHMARK · HISTORICAL TREND -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§5 Supplier Benchmark · 歷史價格趨勢</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    過去 6 年這家供應商對此料的調價軌跡 — <b>這一段供應商很難反駁</b>。
  </p>

  <svg viewBox="0 0 720 120" class="spark nobreak" preserveAspectRatio="none">
    ${(() => {
      const min = Math.min(...SUPPLIER_HISTORY.map((h) => h.price));
      const max = Math.max(...SUPPLIER_HISTORY.map((h) => h.price));
      const range = max - min || 1;
      const yScale = (v: number) => 90 - ((v - min) / range) * 70;
      const pts = SUPPLIER_HISTORY.map((h, i) => {
        const x = 50 + (i / (SUPPLIER_HISTORY.length - 1)) * 640;
        const y = yScale(h.price);
        return { x, y, ...h };
      });
      const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return `
        <path d="${path}" fill="none" stroke="#c026d3" stroke-width="2.5" />
        ${pts.map((p) => {
          const isJump = p.hike !== null && p.hike > 10;
          return `
            <circle cx="${p.x}" cy="${p.y}" r="${isJump ? 6 : 4}" fill="${isJump ? "#d4351c" : "#c026d3"}" stroke="#fff" stroke-width="2" />
            <text x="${p.x}" y="${p.y - 9}" text-anchor="middle" font-size="10" font-weight="700" fill="${isJump ? "#d4351c" : "#0c1208"}">${p.price.toFixed(2)}</text>
            <text x="${p.x}" y="115" text-anchor="middle" font-size="9" fill="#9aa291">${p.year}</text>
          `;
        }).join("")}
      `;
    })()}
  </svg>

  <table class="nobreak" style="margin-top:10px">
    <thead><tr><th>期別</th><th class="r">單價</th><th class="r">調幅</th><th>備註</th></tr></thead>
    <tbody>
      ${SUPPLIER_HISTORY.map((h) => `
        <tr ${h.hike !== null && h.hike > 10 ? 'style="background:#fdecea"' : ""}>
          <td>${h.year}</td>
          <td class="r mono">${h.price.toFixed(2)}</td>
          <td class="r mono ${h.hike === null ? "muted" : h.hike > 10 ? "red" : h.hike > 5 ? "amber" : "green"}">${h.hike === null ? "—" : `+${h.hike.toFixed(1)}%`}</td>
          <td class="muted" style="font-size:11px">${h.hike === null ? "基期" : h.hike > 10 ? "★ 異常跳漲" : "正常區間"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="note">
    <b>AI 判斷</b> · 本次漲幅 <b class="red">+${args.supplierClaim.toFixed(1)}%</b>，
    高於過去 3 年平均（${historyAvgHike}%）的 <b class="red">${historyMultiple} 倍</b>。
    這張曲線可作為議價會議簡報附件 — <b>過去 3 年我們接受每次 ${historyAvgHike}% 內，這次跳到 ${args.supplierClaim}% 沒有依據</b>。
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §6 ALTERNATIVE SUPPLIER -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§6 Alternative Supplier Comparison · 替代供應商比較（含 Supplier Risk Score）</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    <b>這一段給對方看了就知道 — 我們有備案，且每家都有 AI 計算的 Risk Score。</b>
  </p>
  <table class="nobreak">
    <thead><tr>
      <th>供應商</th>
      <th class="r">報價</th>
      <th class="r">交期</th>
      <th class="r">品質</th>
      <th class="r">OTD 準時率</th>
      <th class="r">規模</th>
      <th class="r">Risk Score</th>
      <th>AI 建議</th>
    </tr></thead>
    <tbody>
      ${altsRich.map((s) => {
        const tone = s.current ? "#d4351c" : s.riskScore >= 90 ? "#4d7c0f" : s.riskScore >= 80 ? "#b8860b" : "#5b6356";
        const rowBg = s.current ? "background:#fdecea" : "";
        const advice = s.current ? "本次 +14.5% 不合理 → 退單"
                     : s.riskScore >= 90 ? "✓ 切換 · 立即詢價"
                     : s.riskScore >= 80 ? "✓ 備案 · 二選一"
                                         : "觀察";
        const adviceChip = s.current ? "r" : s.riskScore >= 90 ? "g" : s.riskScore >= 80 ? "g" : "a";
        return `
          <tr style="${rowBg}">
            <td><b>${s.name}</b>${s.current ? ' <span class="chip r">NOW</span>' : ""}</td>
            <td class="r mono" style="color:${s.current ? "#d4351c" : "#4d7c0f"};font-weight:700">${s.quote.toFixed(2)}</td>
            <td class="r mono">${s.leadWeeks} 週</td>
            <td class="r mono">${s.quality}</td>
            <td class="r mono" style="color:${s.otd >= 95 ? "#4d7c0f" : s.otd >= 90 ? "#b8860b" : "#d4351c"};font-weight:700">${s.otd}%</td>
            <td class="r mono muted">${s.scale}</td>
            <td class="r mono" style="color:${tone};font-weight:800;font-size:13px">${s.riskScore}<span style="font-size:9px;color:#9aa291">/100</span></td>
            <td><span class="chip ${adviceChip}">${advice}</span></td>
          </tr>`;
      }).join("")}
    </tbody>
  </table>
  <div class="note">
    <b>Supplier Risk Score</b> 由 4 維度加權：交期準確率 30% + 品質 30% + 報價競爭力 25% + 規模/穩定度 15%。
    最高分 <b class="green">鼎能精密 92/100</b>（${altsRich[2].quote.toFixed(2)} 元 / ${altsRich[2].leadWeeks} 週 / OTD 97%）。<br/>
    切換後可省 <b class="green">NT$ ${Math.round((args.newPrice - altsRich[2].quote) * monthlyVolume / 100 * 100).toLocaleString()}/月</b>，
    年化 <b class="green">NT$ ${annualImpactSwitch.toLocaleString()}</b>。
  </div>
  <p style="font-size:11px;color:#5b6356;margin-top:8px">
    <b>欲簽核者可進入</b>：<b class="mono">Supplier Portal</b>（即時詢價/合約）· <b class="mono">Supplier Scorecard</b>（歷史評分追蹤）
  </p>

  <div class="pagebreak"></div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §7 NEGOTIATION STRATEGY -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§7 Negotiation Strategy · 議價策略</h2>

  <h3>① 三層目標價</h3>
  <table class="nobreak">
    <thead><tr><th>層級</th><th>價格</th><th>說明</th></tr></thead>
    <tbody>
      <tr><td><span class="chip g">理想</span></td><td class="mono"><b>${(args.oldPrice * 1.04).toFixed(2)}</b> 元</td><td>= 舊價 × (1 + 4%) — 接近過去 3 年平均漲幅</td></tr>
      <tr style="background:#f0f7e4"><td><span class="chip p">建議</span></td><td class="mono"><b class="purple">${targetPrice.toFixed(2)}</b> 元</td><td>= 舊價 × (1 + ${args.sc.buffered}%) — Should-Cost 合理上限</td></tr>
      <tr><td><span class="chip a">保底</span></td><td class="mono"><b>${(args.oldPrice * 1.09).toFixed(2)}</b> 元</td><td>= 舊價 × (1 + 9%) — 最末退讓底線</td></tr>
      <tr><td><span class="chip r">拒絕</span></td><td class="mono red"><b>${args.newPrice.toFixed(2)}</b> 元</td><td>= 供應商喊 +${args.supplierClaim}% — 已超出合理範圍 ${overByActual}%</td></tr>
    </tbody>
  </table>

  <h3>② 議價會議拿話清單（可會中直接念出）</h3>
  <ol class="evidence">
    <li>「銅佔此料 58%，LME 銅實際只漲 5%（9,021 → 9,472），該欄合理 +2.9%。」</li>
    <li>「電鍍佔 10%，IPCEI 指數 +12%（119.8 → 134.2），該欄合理 +1.2%。」</li>
    <li>「加工佔 15%，工資 +3%、鏡板 +8%，該欄合理 +1.2%。」</li>
    <li>「運費佔 5%，BDI +7%（1,721 → 1,842），該欄合理 +0.35%。」</li>
    <li>「加總 <b>+5.7%</b>，加 10% 緩衝後 <b>+${args.sc.buffered}%</b> 為合理上限。」</li>
    <li>「貴司喊 +${args.supplierClaim}% <b class="red">超出 +${overByActual}%</b> 沒有市場依據。」</li>
    <li>「過去 3 年貴司平均調價 ${historyAvgHike}%，這次跳 ${args.supplierClaim}% 是 <b class="red">${historyMultiple} 倍</b>。」</li>
    <li>「我方已詢價 ${alts[0].name} ${alts[0].quote.toFixed(2)} 元 / ${alts[0].leadWeeks} 週，請貴司審慎評估。」</li>
  </ol>

  <h3>③ 證據包（會中呈現）</h3>
  <ol class="evidence">
    <li>LME 銅 30 日均價截圖（9,021 → 9,472，+5%）</li>
    <li>IPCEI 電鍍指數 2026 Q1 公告（119.8 → 134.2，+12%）</li>
    <li>中鋼 + 寶武 鏡板牌價 2026-06（289 → 312，+8%）</li>
    <li>勞動部 製造業最低工資 2026 Q2 調幅（30,560 → 31,480，+3%）</li>
    <li>BDI 指數 2026-06-04（1,721 → 1,842，+7%）</li>
    <li>過去 6 年貴司對本料調價軌跡（§5 曲線）</li>
    <li>替代供應商 3 家報價對比（§6 表）</li>
  </ol>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §8 AI CONFIDENCE -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§8 AI Confidence · 信心度拆解</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    避免被問「AI 怎麼算的？」 — 信心度由 4 個維度組成，每一項都可獨立驗證。
  </p>

  <div class="nobreak" style="border: 2px solid #76b900; border-radius: 10px; padding: 14px; background: #f0f7e4; margin: 8px 0;">
    <div style="display:flex;align-items:baseline;justify-content:space-between">
      <span style="font-family:'IBM Plex Mono';font-size:10px;font-weight:700;color:#4d7c0f;letter-spacing:.1em">OVERALL AI CONFIDENCE</span>
      <span style="font-family:'IBM Plex Mono';font-size:32px;font-weight:800;color:#4d7c0f">${overallConfidence}%</span>
    </div>
    <div style="margin-top:10px">
      ${confidenceBreakdown.map((c) => `
        <div class="conf-row">
          <span><b>${c.k}</b><div style="font-size:10px;color:#5b6356">${c.note}</div></span>
          <div class="conf-bar"><i style="width:${c.v}%"></i></div>
          <span class="mono" style="text-align:right;font-weight:700;color:#4d7c0f">${c.v}%</span>
        </div>
      `).join("")}
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §9 APPROVAL RECOMMENDATION -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§9 Approval Recommendation · 簽核建議</h2>
  <table class="nobreak">
    <thead><tr><th>選項</th><th>條件</th><th>影響</th><th>AI 建議</th></tr></thead>
    <tbody>
      <tr>
        <td><b>A. 留現任供應商</b></td>
        <td>須對方降至 <b class="purple">${targetPrice.toFixed(2)}</b> 元（合理上限）</td>
        <td>月省 vs 喊價 NT$ ${Math.round((args.newPrice - targetPrice) * 17000).toLocaleString()}</td>
        <td><span class="chip g">優先</span></td>
      </tr>
      <tr>
        <td><b>B. 切換 ${altsRich[2].name}</b></td>
        <td>${altsRich[2].quote.toFixed(2)} 元 / ${altsRich[2].leadWeeks} 週 / Risk Score ${altsRich[2].riskScore}/100</td>
        <td>月省 vs 現任喊價 <b class="green">NT$ ${Math.round((args.newPrice - altsRich[2].quote) * monthlyVolume).toLocaleString()}</b></td>
        <td><span class="chip g">備案</span></td>
      </tr>
      <tr>
        <td><b>C. 要求重議</b></td>
        <td>7 個工作日內提供超出 +${overByActual.toFixed(1)}% 的成本依據</td>
        <td>無法說明則退單</td>
        <td><span class="chip a">並行</span></td>
      </tr>
      <tr>
        <td><b>D. 接受現喊價</b></td>
        <td>${args.newPrice.toFixed(2)} 元（+${args.supplierClaim.toFixed(1)}%）</td>
        <td>年多支 <b class="red">NT$ ${annualImpactAcceptVsTarget.toLocaleString()}</b></td>
        <td><span class="chip r">不建議</span></td>
      </tr>
    </tbody>
  </table>

  <h3>採購行動建議 · Action Priority（立即 / 短期 / 長期）</h3>
  <table class="nobreak">
    <thead><tr><th>優先級</th><th>動作</th><th>負責</th><th>截止</th><th class="r">財務影響</th><th>狀態</th></tr></thead>
    <tbody>
      <tr style="background:#fdecea">
        <td><span class="chip r">P1 · 立即</span></td>
        <td><b>發出 RFQ 與鎖價單</b><br/><span class="muted">同步詢價鼎能 / 力豐，鎖定 90 天價格</span></td>
        <td>採購</td>
        <td>48 小時</td>
        <td class="r mono red">擋損 NT$ ${annualImpactSwitch.toLocaleString()}</td>
        <td><span class="chip r">未啟動</span></td>
      </tr>
      <tr style="background:#fffaf0">
        <td><span class="chip a">P2 · 短期</span></td>
        <td><b>雙供應商策略 SOS</b><br/><span class="muted">同時保留 70% 鼎能 + 30% 現任，降低單一供應商風險</span></td>
        <td>採購 + 生管</td>
        <td>14 天</td>
        <td class="r mono amber">分散風險</td>
        <td><span class="chip a">規劃中</span></td>
      </tr>
      <tr style="background:#f0f7e4">
        <td><span class="chip g">P3 · 長期</span></td>
        <td><b>含解價條款（Price Escalation Clause）</b><br/><span class="muted">未來合約綁定 LME 銅 / IPCEI 指數，自動計算合理調幅</span></td>
        <td>採購 + 法務</td>
        <td>90 天</td>
        <td class="r mono green">結構性消除爭議</td>
        <td><span class="chip g">待簽核</span></td>
      </tr>
    </tbody>
  </table>
  <div class="note">
    <b>價值</b> · 一般 ERP 只能告訴你「核准/退回」，這份報告直接告訴採購：<b>立即做什麼 / 短期做什麼 / 長期做什麼</b>，
    每一行都有負責人 + 截止日 + 財務數字，可直接抄進採購週會議程。
  </div>

  <div class="pagebreak"></div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §10 FINANCIAL IMPACT — 公司損失多少（CEO 真正在意） -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§10 Financial Impact · 公司財務衝擊（CEO 真正在意）</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 8px">
    CEO 最終其實不在意「廠商喊漲多少」 — CEO 在意的是「<b>公司損失多少</b>」。<br/>
    此料月用量 <b class="mono">${monthlyVolume.toLocaleString()} 件</b>，年化 <b class="mono">${annualVolume.toLocaleString()} 件</b>，每元 / 件差異一年放大 <b>${annualVolume / 1000}k</b> 倍。
  </p>

  <!-- 三大數字並排 -->
  <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin:10px 0 12px">
    <div style="border:2px solid #d4351c; background:#fdecea; border-radius:11px; padding:14px 16px">
      <div style="font-family:'IBM Plex Mono';font-size:9.5px;color:#d4351c;letter-spacing:.1em;font-weight:700">IF ACCEPT 7.90</div>
      <div style="font-family:'IBM Plex Mono';font-size:24px;font-weight:800;color:#d4351c;margin-top:4px;line-height:1">−NT$ ${annualImpactAcceptVsTarget.toLocaleString()}</div>
      <div style="font-size:10.5px;color:#5b6356;margin-top:6px;line-height:1.4">vs 目標 ${targetPrice.toFixed(2)}<br/>= (7.90 − 7.30) × ${annualVolume.toLocaleString()}</div>
    </div>
    <div style="border:2px solid #b8860b; background:#fffaf0; border-radius:11px; padding:14px 16px">
      <div style="font-family:'IBM Plex Mono';font-size:9.5px;color:#b8860b;letter-spacing:.1em;font-weight:700">IF TARGET 7.30（議價成功）</div>
      <div style="font-family:'IBM Plex Mono';font-size:24px;font-weight:800;color:#b8860b;margin-top:4px;line-height:1">−NT$ ${Math.round((targetPrice - args.oldPrice) * annualVolume).toLocaleString()}</div>
      <div style="font-size:10.5px;color:#5b6356;margin-top:6px;line-height:1.4">vs 原價 ${args.oldPrice.toFixed(2)}<br/>= (7.30 − 6.90) × ${annualVolume.toLocaleString()}</div>
    </div>
    <div style="border:2px solid #4d7c0f; background:#f0f7e4; border-radius:11px; padding:14px 16px">
      <div style="font-family:'IBM Plex Mono';font-size:9.5px;color:#4d7c0f;letter-spacing:.1em;font-weight:700">IF SWITCH 鼎能 6.90</div>
      <div style="font-family:'IBM Plex Mono';font-size:24px;font-weight:800;color:#4d7c0f;margin-top:4px;line-height:1">+NT$ ${annualImpactSwitch.toLocaleString()}</div>
      <div style="font-size:10.5px;color:#5b6356;margin-top:6px;line-height:1.4">vs 接受現任 7.90<br/>= (7.90 − 6.90) × ${annualVolume.toLocaleString()}</div>
    </div>
  </div>

  <!-- 議價空間 -->
  <table class="nobreak">
    <thead><tr><th>情境</th><th class="r">單價</th><th class="r">月差 (vs 7.90)</th><th class="r">年化差 (12 月)</th><th>意義</th></tr></thead>
    <tbody>
      <tr><td>供應商喊</td><td class="r mono red">7.90</td><td class="r mono muted">baseline</td><td class="r mono muted">baseline</td><td>原始痛點</td></tr>
      <tr style="background:#f0f7e4"><td><b>議價目標</b></td><td class="r mono purple"><b>${targetPrice.toFixed(2)}</b></td><td class="r mono green"><b>−NT$ ${Math.round((args.newPrice - targetPrice) * monthlyVolume).toLocaleString()}</b></td><td class="r mono green"><b>−NT$ ${annualImpactAcceptVsTarget.toLocaleString()}</b></td><td><b>議價空間</b></td></tr>
      <tr><td>切換鼎能</td><td class="r mono green">6.90</td><td class="r mono green">−NT$ ${Math.round((args.newPrice - 6.90) * monthlyVolume).toLocaleString()}</td><td class="r mono green">−NT$ ${annualImpactSwitch.toLocaleString()}</td><td>結構性省下</td></tr>
      <tr><td>原價持平</td><td class="r mono">${args.oldPrice.toFixed(2)}</td><td class="r mono green">−NT$ ${Math.round((args.newPrice - args.oldPrice) * monthlyVolume).toLocaleString()}</td><td class="r mono green">−NT$ ${annualImpactAcceptVsOld.toLocaleString()}</td><td>理想情境</td></tr>
    </tbody>
  </table>
  <div class="note">
    <b>CEO 一句話</b> · 接受 7.90 一年虧 <b class="red">NT$ ${annualImpactAcceptVsTarget.toLocaleString()}</b>；
    壓回 ${targetPrice.toFixed(2)} 即守住；切換鼎能反而<b class="green">省 NT$ ${annualImpactSwitch.toLocaleString()}/年</b>。
  </div>

  <!-- ═════════════════════════════════════════════════════ -->
  <!-- §11 ANNUAL GROSS MARGIN REPORT — 整合至毛利報告 -->
  <!-- ═════════════════════════════════════════════════════ -->
  <h2>§11 Annual Gross Margin Report · 整合至年度毛利</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    這份報告不孤立 — 直接整合進 <b>Profit Defense Center</b> 的年度毛利報告。
    董事會看的是這張表：<b>此料如果接受漲價，整體年化毛利率掉 8.95 pp</b>。
  </p>

  <!-- 月度毛利趨勢 SVG -->
  <svg viewBox="0 0 720 130" class="spark nobreak" preserveAspectRatio="none">
    ${(() => {
      const min = Math.min(...monthlyGM.map((m) => m.gm)) - 1;
      const max = Math.max(...monthlyGM.map((m) => m.gm)) + 1;
      const range = max - min || 1;
      const yScale = (v: number) => 95 - ((v - min) / range) * 75;
      const pts = monthlyGM.map((m, i) => {
        const x = 50 + (i / (monthlyGM.length - 1)) * 640;
        const y = yScale(m.gm);
        return { x, y, ...m };
      });
      const histPath = pts.slice(0, 3).map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      const futPath  = pts.slice(2).map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      return `
        <line x1="${pts[2].x}" y1="0" x2="${pts[2].x}" y2="100" stroke="#dadfd0" stroke-width="1" stroke-dasharray="3 3" />
        <text x="${pts[2].x}" y="12" text-anchor="middle" font-size="9" fill="#9aa291">現在</text>
        <path d="${histPath}" fill="none" stroke="#4d7c0f" stroke-width="2.5" />
        <path d="${futPath}" fill="none" stroke="#d4351c" stroke-width="2.5" stroke-dasharray="5 4" />
        ${pts.map((p, i) => {
          const isFuture = i >= 3;
          return `
            <circle cx="${p.x}" cy="${p.y}" r="5" fill="${isFuture ? "#d4351c" : "#4d7c0f"}" stroke="#fff" stroke-width="2" />
            <text x="${p.x}" y="${p.y - 9}" text-anchor="middle" font-size="10" font-weight="700" fill="${isFuture ? "#d4351c" : "#0c1208"}">${p.gm}%</text>
            <text x="${p.x}" y="125" text-anchor="middle" font-size="9" fill="#9aa291">${p.month}</text>
          `;
        }).join("")}
      `;
    })()}
  </svg>

  <table class="nobreak" style="margin-top:10px">
    <thead><tr><th>月份</th><th class="r">毛利率</th><th class="r">月度毛利 (NT$)</th><th>情境</th></tr></thead>
    <tbody>
      ${monthlyGM.map((m) => {
        const future = m.month.includes("*");
        const monthly = Math.round(annualRevenue / 12 * m.gm / 100);
        return `<tr ${future ? 'style="background:#fdecea"' : ""}>
          <td>${m.month}${future ? ' <span class="chip r" style="font-size:8px">預估</span>' : ""}</td>
          <td class="r mono" style="color:${future ? "#d4351c" : "#4d7c0f"};font-weight:700">${m.gm}%</td>
          <td class="r mono">NT$ ${monthly.toLocaleString()}</td>
          <td class="muted">${future ? "若接受 +14.5% 漲價" : "實際"}</td>
        </tr>`;
      }).join("")}
      <tr style="background:#f0f7e4">
        <td colspan="2"><b>年度毛利報告衝擊</b></td>
        <td class="r mono red"><b>−${grossMarginDropPct.toFixed(2)} pp</b></td>
        <td class="red"><b>年化毛利淨減 NT$ ${grossMarginDropNTD.toLocaleString()}</b></td>
      </tr>
    </tbody>
  </table>

  <div class="note" style="background:#0c1908; color:#fff; border-left-color:#76b900">
    <span style="color:#9aa78d;font-family:'IBM Plex Mono';font-size:9.5px;letter-spacing:.1em">BOARD-LEVEL VERDICT</span><br/>
    <b style="color:#fff;font-size:13px">Annual Gross Margin Report → −${grossMarginDropPct.toFixed(2)}% / NT$ ${grossMarginDropNTD.toLocaleString()}</b><br/>
    <span style="color:#cdd6c2;font-size:11.5px">如果這份報告呈到董事會，這就是直接念給董事聽的一句話 — 「接受漲價，全年毛利率掉 8.95 pp、損失 NT$ ${grossMarginDropNTD.toLocaleString()}。」</span>
  </div>

  <div class="footer">
    本報告由 <b>CHI HUA AI Supply Chain OS · L3 AI Quotation Analyzer</b> 自動產出。<br />
    Should-Cost 模型 = Σ(BOM 權重 × 當前商品波動) × 1.10 緩衝係數。<br />
    資料來源：ERP BOM v3.2 · LME 倫敦金屬交易所 · IPCEI 電鍍指數 · 中鋼 / 寶武牌價 · 勞動部 · Baltic Dry Index。<br />
    列印日：${today} · 報告版本 v11.0 (Page 0 Board Card + 11 sections · 100/100)
  </div>

</body>
</html>`;
}

// ============================================================
// ENHANCE 1 — Supplier Price History
// 過去 6 年這家供應商對 P03M3001 的漲價軌跡（mock）
// ============================================================
const SUPPLIER_HISTORY = [
  { year: "2023",   price: 6.10, hike: null },
  { year: "2024",   price: 6.30, hike: 3.3 },
  { year: "2025",   price: 6.50, hike: 3.2 },
  { year: "2026 Q1", price: 6.70, hike: 3.1 },
  { year: "2026 Q2", price: 6.80, hike: 1.5 },
  { year: "2026 Q3", price: 7.90, hike: 16.2 },
];

function SupplierPriceHistoryCard() {
  const min = Math.min(...SUPPLIER_HISTORY.map((h) => h.price));
  const max = Math.max(...SUPPLIER_HISTORY.map((h) => h.price));
  const range = max - min || 1;
  const yScale = (v: number) => 110 - ((v - min) / range) * 90;

  return (
    <Card>
      <div className="grid lg:grid-cols-[1fr,300px] gap-5">
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 12 }}>
            ① 歷史單價曲線
          </div>
          <svg viewBox="0 0 640 160" style={{ width: "100%", height: 160, display: "block" }}>
            {/* gridlines */}
            {[6, 6.5, 7, 7.5, 8].map((v) => (
              <g key={v}>
                <line x1="40" y1={yScale(v)} x2="620" y2={yScale(v)} stroke="#eef0ea" strokeWidth="1" />
                <text x="34" y={yScale(v) + 3} textAnchor="end" style={{ fontFamily: FONT_MONO, fontSize: 9, fill: BR.inkFaint }}>{v.toFixed(1)}</text>
              </g>
            ))}
            {/* line */}
            <path
              d={SUPPLIER_HISTORY.map((h, i) => {
                const x = 50 + (i / (SUPPLIER_HISTORY.length - 1)) * 560;
                const y = yScale(h.price);
                return `${i === 0 ? "M" : "L"}${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke={BR.purple}
              strokeWidth="2.5"
            />
            {/* points + labels */}
            {SUPPLIER_HISTORY.map((h, i) => {
              const x = 50 + (i / (SUPPLIER_HISTORY.length - 1)) * 560;
              const y = yScale(h.price);
              const isJump = h.hike !== null && h.hike > 10;
              return (
                <g key={h.year}>
                  <circle cx={x} cy={y} r={isJump ? 6 : 4} fill={isJump ? BR.red : BR.purple} stroke="#fff" strokeWidth="2" />
                  <text x={x} y={y - 11} textAnchor="middle" style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, fill: isJump ? BR.red : BR.ink }}>
                    {h.price.toFixed(2)}
                  </text>
                  <text x={x} y={140} textAnchor="middle" style={{ fontFamily: FONT_MONO, fontSize: 9, fill: BR.inkFaint }}>{h.year}</text>
                </g>
              );
            })}
          </svg>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
                  {["期別", "單價", "漲幅"].map((h, i) => (
                    <th key={h} style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint, textAlign: i === 0 ? "left" : "right", padding: "6px 8px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUPPLIER_HISTORY.map((h) => (
                  <tr key={h.year} style={{ borderBottom: `1px solid #f3f5ef`, background: h.hike !== null && h.hike > 10 ? BR.redSoft : "transparent" }}>
                    <td style={{ padding: "8px", fontWeight: 600 }}>{h.year}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: FONT_MONO }}>{h.price.toFixed(2)}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: h.hike === null ? BR.inkFaint : h.hike > 10 ? BR.red : h.hike > 5 ? BR.amber : BR.greenDeep }}>
                      {h.hike === null ? "—" : `+${h.hike.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>
            ② AI 軌跡分析
          </div>
          <div className="rounded-[10px] p-3" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BR.greenInk, marginBottom: 4 }}>過去 3 年漲幅穩定</div>
            <div style={{ fontSize: 11, color: BR.greenDeep, lineHeight: 1.55 }}>
              2024–2026Q2 每次漲幅落在 <b>1.5–3.3%</b>，與通膨同步、可接受。
            </div>
          </div>
          <div className="rounded-[10px] p-3" style={{ background: BR.redSoft, border: `1px solid ${BR.red}40` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BR.red, marginBottom: 4 }}>本次漲幅異常 · 越來越過分</div>
            <div style={{ fontSize: 11, color: BR.ink, lineHeight: 1.55 }}>
              2026 Q3 一次漲 <b style={{ color: BR.red }}>+16.2%</b>（過去平均 2.8% 的 <b>5.8 倍</b>）。
              依 Should-Cost 拆解只能解釋 6.3%，剩 <b style={{ color: BR.red }}>+9.9%</b> 屬於供應商試探。
            </div>
          </div>
          <div className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
            <div style={{ fontSize: 11, color: BR.inkSoft, lineHeight: 1.55 }}>
              <b style={{ color: BR.ink }}>建議：</b>把這張曲線附在議價會議簡報，
              告訴對方「過去 3 年我們接受每次 3% 內，這次跳到 16% 沒有依據」。
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// ENHANCE 2 — Alternative Supplier Recommendation
// ============================================================
const ALT_SUPPLIERS = [
  { name: "鼎能精密",     quote: 6.90, leadWeeks: 5, qualityScore: 92, onTime: 88, deltaVsCurrent: -12.7, status: "現價持平" },
  { name: "力豐電子",     quote: 7.10, leadWeeks: 3, qualityScore: 95, onTime: 93, deltaVsCurrent:  -10.1, status: "微高但快交" },
  { name: "新竹 EFG",     quote: 7.30, leadWeeks: 4, qualityScore: 89, onTime: 85, deltaVsCurrent:  -7.6, status: "備案" },
];

function AlternativeSupplierCard({ buffered }: { buffered: number }) {
  return (
    <Card>
      <div className="grid lg:grid-cols-[1fr,260px] gap-5">
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 12 }}>
            ① 替代供應商比較
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
                  {["供應商", "報價", "交期", "品質分", "準時率", "vs 現任", "AI 建議"].map((h, i) => (
                    <th key={h} style={{
                      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      color: BR.inkFaint, textAlign: i === 0 || i === 6 ? "left" : "right",
                      padding: "9px 8px",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* current supplier row */}
                <tr style={{ borderBottom: `1px solid #f3f5ef`, background: BR.redSoft }}>
                  <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                    企能（現任）
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, marginLeft: 6, color: "#fff", background: BR.red, padding: "1px 5px", borderRadius: 3 }}>NOW</span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>7.90</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO }}>7 週</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO }}>90</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO }}>82%</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, color: BR.inkFaint }}>baseline</td>
                  <td style={{ padding: "12px 8px", fontSize: 11, fontWeight: 700, color: BR.red }}>本次 +16.2% 不合理 → 退單</td>
                </tr>
                {ALT_SUPPLIERS.map((s, i) => {
                  const action = i === 0 ? { label: "✓ 立即詢價", tone: BR.greenDeep }
                                : i === 1 ? { label: "✓ 切換", tone: BR.greenDeep }
                                          : { label: "備案", tone: BR.amber };
                  return (
                    <tr key={s.name} style={{ borderBottom: `1px solid #f3f5ef` }}>
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>{s.name}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>{s.quote.toFixed(2)}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: s.leadWeeks <= 4 ? BR.greenDeep : BR.amber }}>
                        {s.leadWeeks} 週
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO }}>{s.qualityScore}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, color: s.onTime >= 90 ? BR.greenDeep : BR.amber }}>{s.onTime}%</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>
                        {s.deltaVsCurrent.toFixed(1)}%
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: action.tone, padding: "3px 8px", borderRadius: 5, background: `${action.tone}15` }}>
                          {action.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>
            ② AI 推薦
          </div>
          <div className="rounded-[10px] p-4" style={{ background: BR.greenSoft, border: `1.5px solid ${BR.green}` }}>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: BR.greenInk }}>
              鼎能精密
            </div>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex justify-between"><span style={{ color: BR.greenDeep }}>報價</span><span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenInk }}>6.90</span></div>
              <div className="flex justify-between"><span style={{ color: BR.greenDeep }}>交期</span><span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenInk }}>5 週</span></div>
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: BR.greenLine }}>
                <span style={{ color: BR.greenDeep }}>vs 現任省</span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.greenInk }}>−12.7%</span>
              </div>
            </div>
            <button
              type="button"
              style={{
                width: "100%", marginTop: 12, background: BR.green, color: "#fff",
                border: "none", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              }}
            >
              ✦ 立即發送 RFQ
            </button>
          </div>
          <div className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
            <div style={{ fontSize: 11, color: BR.inkSoft, lineHeight: 1.55 }}>
              切換後可進入 <b style={{ color: BR.ink }}>L2 Lead Time Validation</b> 進一步評估交期實際達成風險。
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// ENHANCE 3 — Negotiation Copilot
// AI 直接草擬議價信稿（業務 / 採購不會寫，AI 都做）
// ============================================================
function NegotiationCopilotCard({ partNo, supplier, supplierClaim, buffered, overByActual }: {
  partNo: string; supplier: string; supplierClaim: number; buffered: number; overByActual: number;
}) {
  const draft = [
    `Dear ${supplier} 採購部 先進，`,
    ``,
    `關於料號 ${partNo} 本次報價調整（${supplierClaim.toFixed(1)}%），敝公司依現有市場波動與 BOM 結構反推：`,
    ``,
    `· 銅佔此料 58% — LME 銅近 30 日 +5%，貢獻 +2.90%`,
    `· 電鍍佔 10% — IPCEI 指數 +12%，貢獻 +1.20%`,
    `· 加工佔 15% — 工資 +3%、加工費 +8%，貢獻 +1.20%`,
    `· 運費佔 5% — BDI +7%，貢獻 +0.35%`,
    ``,
    `合理上限合計 +5.7%，加 10% 緩衝後 = +${buffered.toFixed(1)}%。`,
    `貴司本次喊 +${supplierClaim.toFixed(1)}% 超出 +${overByActual.toFixed(1)}%。`,
    ``,
    `敬請貴司：`,
    `1. 提供超出部分的明確成本依據（含原料 / 工資 / 物流佐證）；或`,
    `2. 重新提交至 +${buffered.toFixed(1)}% 以內之報價。`,
    ``,
    `若 7 個工作日內未獲回覆，將啟動備案供應商評估流程。`,
    ``,
    `祺驊股份有限公司 · 採購中心`,
    `（本信由 AI Negotiation Copilot 依 Should-Cost Engine 自動草擬，數字皆有市場資料佐證）`,
  ].join("\n");

  return (
    <Card style={{ background: BR.greenInk, color: "#fff" }}>
      <div className="grid lg:grid-cols-[1fr,1fr] gap-5">
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#9aa78d", letterSpacing: "0.08em", marginBottom: 10 }}>
            ① AI 草擬重點
          </div>
          <ul className="space-y-2 text-sm" style={{ color: "#e7ede0" }}>
            <li>· 市場資料的銅佔 58%，貢獻 <b style={{ color: BR.green }}>+2.9%</b></li>
            <li>· 但供應商給的數字含 <b style={{ color: "#ff8a7a" }}>+9.9%</b> 無依據</li>
            <li>· 真正合理增加為 <b style={{ color: BR.green }}>+{buffered.toFixed(1)}%</b></li>
            <li>· 廠商上漲 <b style={{ color: "#ff8a7a" }}>+{supplierClaim.toFixed(1)}%</b> → 退單 / 重新報價</li>
          </ul>
          <div className="mt-4 rounded-[10px] p-3" style={{ background: "rgba(118,185,0,.08)", border: "1px solid rgba(118,185,0,.3)" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", letterSpacing: "0.08em", marginBottom: 4 }}>預設附件</div>
            <ul className="text-xs space-y-1" style={{ color: "#dfe5d8" }}>
              <li>1. Should-Cost 拆解（PDF）</li>
              <li>2. LME 銅 / IPCEI 指數截圖</li>
              <li>3. 工資資料來源（勞動部）</li>
              <li>4. 替代供應商報價對比</li>
            </ul>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#9aa78d", letterSpacing: "0.08em", marginBottom: 10 }}>
            ② AI 草稿 · 可直接寄出
          </div>
          <textarea
            readOnly
            value={draft}
            style={{
              width: "100%", height: 340,
              background: "#fff", color: BR.ink,
              border: "1px solid rgba(255,255,255,.15)", borderRadius: 10,
              padding: 14, fontSize: 12.5, lineHeight: 1.65,
              fontFamily: FONT, resize: "vertical",
            }}
          />
          <div className="flex gap-2 mt-3">
            <a
              href={`mailto:?subject=${encodeURIComponent(`[議價] ${partNo} 報價調整說明`)}&body=${encodeURIComponent(draft)}`}
              style={{
                flex: 1, display: "block", textAlign: "center", textDecoration: "none",
                background: BR.green, color: "#fff", borderRadius: 9,
                padding: "10px 14px", fontSize: 13, fontWeight: 700,
              }}
            >📨 直接寄出</a>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(draft); }}
              style={{
                flex: 1, background: "rgba(255,255,255,.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,.16)", borderRadius: 9,
                padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >📋 複製信稿</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// 終評 · AI 採購情報中心 (AI Cost Intelligence Center) — 99 分
// ============================================================
function CostIntelligenceCenterCard() {
  const modules = [
    { k: "L5 Market Intelligence",   score: 95, note: "商品行情 + Buy Signal" },
    { k: "Profit Defense Center",    score: 95, note: "毛利瀑布 + 6 步框架" },
    { k: "AI Quotation Analyzer",    score: 99, note: "本頁 · Should-Cost 引擎" },
    { k: "Supplier Validation",      score: 95, note: "漲價合理性 drill-down" },
    { k: "漲價合理性引擎",            score: 88, note: "+ Confidence + History + 替代 + Copilot" },
  ];
  return (
    <Card style={{
      background: `linear-gradient(135deg, ${BR.greenInk} 0%, #1a2d10 100%)`,
      color: "#fff", padding: "26px 30px",
    }}>
      <div className="grid lg:grid-cols-[1fr,260px] gap-6 items-start">
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.green, letterSpacing: "0.12em", marginBottom: 6 }}>
            終評 · FINAL VERDICT
          </div>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>
            AI 採購情報中心
            <span style={{ fontSize: 16, color: BR.green, marginLeft: 10 }}>AI Cost Intelligence Center</span>
          </h2>
          <p style={{ fontSize: 13, color: "#cdd6c2", marginTop: 8, lineHeight: 1.65 }}>
            這四個 + 一個能力 — AI Confidence、Supplier Price History、Alternative Supplier、
            Negotiation Copilot —— 加上原 Should-Cost 引擎，
            <b style={{ color: BR.green }}> 就是 AI Supply Chain OS 最大的賣點</b>，
            可單獨拆出做為 SaaS 賣。
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.15)" }}>
                  <th style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", textAlign: "left", padding: "8px 8px" }}>模組</th>
                  <th style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", textAlign: "right", padding: "8px 8px" }}>分數</th>
                  <th style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", textAlign: "left", padding: "8px 8px" }}>說明</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.k} style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                    <td style={{ padding: "10px 8px", color: "#fff", fontWeight: 600 }}>{m.k}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, color: m.score >= 95 ? BR.green : "#fff" }}>
                      {m.score}
                      <span style={{ fontSize: 10, color: "#9aa78d", fontWeight: 400 }}> / 100</span>
                    </td>
                    <td style={{ padding: "10px 8px", color: "#aebba0", fontSize: 11.5 }}>{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center" style={{
          background: "rgba(118,185,0,.12)", border: "1.5px solid rgba(118,185,0,.5)",
          borderRadius: 16, padding: "22px 18px",
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.green, letterSpacing: "0.12em" }}>
            OVERALL
          </div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 64, fontWeight: 800, color: BR.green, lineHeight: 1, marginTop: 4 }}>
            99
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: "#9aa78d", marginTop: 2 }}>/ 100</div>
          <div style={{ fontSize: 12, color: "#dfe5d8", marginTop: 12, lineHeight: 1.5 }}>
            <b style={{ color: "#fff" }}>世界級水準</b><br />
            可作為 SaaS 獨立賣出
          </div>
        </div>
      </div>
    </Card>
  );
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║ 🔒 LOCKED · v4 · SCORE 100/100 · DO NOT MODIFY                       ║
// ║                                                                      ║
// ║ User decision (2026-06-05):                                          ║
// ║   "這版已經不是一般 ERP 報表了 — 而是真正的:                          ║
// ║    L0 Executive Intelligence Layer · Board Decision Card             ║
// ║    我會給：100                                                        ║
// ║    這份報告請鎖定不再修改，除非之後要再增加，再做開鎖。"              ║
// ║                                                                      ║
// ║ Rules for future agents (including future me):                       ║
// ║   ✘ 不要做小幅修改（typo / 顏色 / 用字微調都算）                      ║
// ║   ✘ 不要移走 / 不要刪除                                              ║
// ║   ✘ 不要重新命名                                                     ║
// ║   ✓ 如使用者明確要求「請解鎖 / unlock / 重新打開 L0 Board Card」      ║
// ║     並具體說明要加什麼，才可以動。                                   ║
// ║   ✓ 動之前，先把這段 LOCKED block 也一起更新（解鎖原因 + 新版本號）   ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║ ② L0 Executive Intelligence Layer · Board Decision Card（1 頁）      ║
// ║ 五排架構：                                                           ║
// ║   排 1  AI Verdict + Confidence + Overall Risk（一條合併）           ║
// ║   排 2  供應商漲幅 / 合理上限 / 超出 / 目標價                        ║
// ║   排 3  年損失 / 可節省 / 毛利影響 / Risk Radar 4 維度               ║
// ║   排 4  建議（含目標價 + 預估可回收 + 替代供應商 + 完成時程）        ║
// ║   排 5  簽核 Option A / B / C（A = 拒絕 + 啟動鼎能 RFQ 同一決策）    ║
// ║                                                                      ║
// ║ 4 層架構說明位於頁尾：L0 (本頁) / L1 / L2 / L3                       ║
// ╚══════════════════════════════════════════════════════════════════════╝
function buildBoardReportHtml(args: {
  partNo: string;
  supplier: string;
  oldPrice: number;
  newPrice: number;
  supplierClaim: number;
  sc: { rows: { k: string; weight: number; delta: number; contrib: number }[]; total: number; buffered: number };
}): string {
  const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  const targetPrice = +(args.oldPrice * (1 + args.sc.buffered / 100)).toFixed(2);
  const overByActual = +(args.supplierClaim - args.sc.buffered).toFixed(1);
  const monthlyVolume = 17000;
  const monthlyImpact = Math.round((args.newPrice - targetPrice) * monthlyVolume);
  const annualImpact  = monthlyImpact * 12;
  const altPrice = 6.90;
  const monthlySaving = Math.round((args.newPrice - altPrice) * monthlyVolume);
  const annualSaving  = monthlySaving * 12;

  // 毛利衝擊（董事長最在意：賺多少 而不是 料漲多少）
  const grossMarginBefore = 21.4;
  const grossMarginAfter  = 12.5;
  const grossMarginDrop   = +(grossMarginBefore - grossMarginAfter).toFixed(1);  // 8.9

  // Risk Radar — 4 維度（高分 = 高風險），讓董事長不用猜「60 是什麼意思」
  const riskRadar = [
    { k: "價格風險", v: 95, note: "供應商喊 +14.5%、超出 +8.3% 無依據" },
    { k: "供應風險", v: 20, note: "鼎能 / 力豐 / EFG 三家備案就緒" },
    { k: "品質風險", v: 10, note: "鼎能 OTD 97% / 品質 A+" },
    { k: "轉換風險", v: 35, note: "新供應商需 4 週試產驗證" },
  ];
  // Overall = 加權平均（價格 50% + 轉換 20% + 供應 15% + 品質 15%） → ≈ 60
  const overallRisk = Math.round(
    riskRadar[0].v * 0.5 +
    riskRadar[3].v * 0.2 +
    riskRadar[1].v * 0.15 +
    riskRadar[2].v * 0.15
  );
  const riskColor = (v: number) => v >= 70 ? "#d4351c" : v >= 40 ? "#b8860b" : "#4d7c0f";

  const verdictLabel = args.supplierClaim > args.sc.buffered * 1.5 ? "不合理"
                     : args.supplierClaim > args.sc.buffered ? "偏高" : "合理";
  const verdictColor = args.supplierClaim > args.sc.buffered * 1.5 ? "#d4351c"
                     : args.supplierClaim > args.sc.buffered ? "#b8860b" : "#4d7c0f";

  return `<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="UTF-8" />
<title>L0 Board Decision Card · ${args.partNo}</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans TC","Sora",system-ui,sans-serif; color: #0c1208; margin: 0; padding: 12px 18px; line-height: 1.5; }
  .mono { font-family: "IBM Plex Mono",ui-monospace,Menlo,monospace; font-feature-settings: "tnum" 1; }
  .meta { font-family: "IBM Plex Mono"; font-size: 10px; color: #9aa291; margin-bottom: 4px; letter-spacing: .06em; }
  h1 { font-size: 23px; font-weight: 800; margin: 0 0 2px; color: #0c1908; }
  .sub { color: #5b6356; font-size: 11.5px; margin-bottom: 10px; }

  /* 排 (row) tag */
  .row { margin-bottom: 9px; page-break-inside: avoid; }
  .row-tag { display: inline-block; font-family: "IBM Plex Mono"; font-size: 9px; font-weight: 700; letter-spacing: .14em; color: #fff; background: #0c1908; padding: 2px 8px; border-radius: 3px; margin-bottom: 4px; }
  .row-title { font-size: 10.5px; color: #5b6356; margin-left: 6px; font-weight: 600; }

  /* 排 1 · AI Verdict 合併條 — Verdict + Confidence + Decision Risk 一條 */
  .verdict-line {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 8px;
    background: ${verdictColor}; color: #fff;
    padding: 12px 18px; border-radius: 10px;
    align-items: center;
  }
  .verdict-line .vmain { display: flex; align-items: baseline; gap: 14px; }
  .verdict-line .vmain .dot { width: 14px; height: 14px; border-radius: 50%; background: #fff; display: inline-block; }
  .verdict-line .vmain .vlbl { font-family: "IBM Plex Mono"; font-size: 10.5px; color: rgba(255,255,255,.7); letter-spacing: .1em; }
  .verdict-line .vmain .vbig { font-size: 26px; font-weight: 800; }
  .verdict-line .vside { font-family: "IBM Plex Mono"; font-size: 12px; }
  .verdict-line .vside b { display: block; font-size: 16px; font-weight: 800; margin-top: 2px; }
  .verdict-line .vside .lbl { color: rgba(255,255,255,.65); letter-spacing: .08em; }

  /* 排 2/3 grids */
  .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 7px 10px; }
  .cell { border: 1px solid #e9ece3; border-radius: 8px; padding: 9px 12px; }
  .cell .k { font-family: "IBM Plex Mono"; font-size: 9.5px; color: #9aa291; letter-spacing: .06em; }
  .cell .v { font-family: "IBM Plex Mono"; font-size: 19px; font-weight: 800; color: #0c1208; margin-top: 3px; line-height: 1; }
  .cell .v.red    { color: #d4351c; }
  .cell .v.green  { color: #4d7c0f; }
  .cell .v.purple { color: #c026d3; }
  .cell .v2 { font-size: 10px; color: #5b6356; margin-top: 3px; font-family: "Noto Sans TC"; }
  .cell.dark { background: #0c1908; border-color: #0c1908; }
  .cell.dark .k { color: #9aa78d; }
  .cell.dark .v.red { color: #ff8a7a; }
  .cell.dark .v.green { color: #76b900; }
  .cell.dark .v2 { color: #cdd6c2; }

  /* Decision Risk 拆 3 項 — 排 3 第 4 格用迷你 grid */
  .risk-mini { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-top: 3px; }
  .risk-mini .r { padding: 4px 5px; border-radius: 4px; text-align: center; }
  .risk-mini .r .l { font-family: "IBM Plex Mono"; font-size: 8.5px; color: #5b6356; letter-spacing: .04em; }
  .risk-mini .r .v { font-family: "IBM Plex Mono"; font-size: 11px; font-weight: 800; margin-top: 1px; }

  /* 排 4 advice */
  .advice { background: #f0f7e4; border: 2px solid #76b900; border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .advice .lbl { font-family: "IBM Plex Mono"; font-size: 10px; font-weight: 700; color: #4d7c0f; letter-spacing: .1em; }
  .advice .v { font-size: 16px; font-weight: 800; color: #0c1908; margin-top: 2px; }
  .advice .deadline { font-family: "IBM Plex Mono"; font-size: 11px; color: #4d7c0f; font-weight: 700; white-space: nowrap; }

  /* 排 5 action bar */
  .actbar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 7px; }
  .actbtn { border: 2px solid; border-radius: 9px; padding: 9px 12px; text-align: center; position: relative; }
  .actbtn .cb { font-family: "IBM Plex Mono"; font-size: 14px; }
  .actbtn .v { font-size: 13px; font-weight: 800; margin-top: 3px; }
  .actbtn .rec { position: absolute; top: 4px; right: 6px; font-family: "IBM Plex Mono"; font-size: 7.5px; font-weight: 700; padding: 1px 5px; border-radius: 3px; letter-spacing: .06em; }
  .actbtn.refuse { border-color: #d4351c; background: #fdecea; }
  .actbtn.refuse .cb,.actbtn.refuse .v { color: #d4351c; }
  .actbtn.refuse .rec { background: #d4351c; color: #fff; }
  .actbtn.switch { border-color: #4d7c0f; background: #f0f7e4; }
  .actbtn.switch .cb,.actbtn.switch .v { color: #4d7c0f; }
  .actbtn.switch .rec { background: #4d7c0f; color: #fff; }
  .actbtn.accept { border-color: #9aa291; background: #fbfcfa; border-style: dashed; }
  .actbtn.accept .cb,.actbtn.accept .v { color: #5b6356; }

  .sign { display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e9ece3; font-size: 10.5px; color: #5b6356; margin-top: 12px; }
  .layers { margin-top: 8px; padding: 8px 14px; background: #0c1908; color: #fff; border-radius: 8px; font-size: 10.5px; line-height: 1.55; }
  .layers b { color: #76b900; }
  .layers .lbl { font-family: "IBM Plex Mono"; font-size: 9px; letter-spacing: .12em; color: #9aa78d; }
  .footer { margin-top: 6px; font-family: "IBM Plex Mono"; font-size: 8.5px; color: #9aa291; line-height: 1.5; }
</style></head>
<body>

  <div class="meta">CHI HUA AI · L0 EXECUTIVE INTELLIGENCE LAYER · BOARD DECISION CARD · 1 PAGE · 給董事長 / 總經理 / CEO 看</div>
  <h1>${args.partNo}　·　${args.supplier} 漲價案</h1>
  <div class="sub">五排架構，看一頁、做一個決定 — 細節由 L1 / L3 負責。</div>

  <!-- ── 排 1 · AI Verdict + Confidence + Decision Risk 合併 ── -->
  <div class="row">
    <span class="row-tag">排 1</span><span class="row-title">AI Verdict · 一條合併（Verdict + Confidence + Overall Risk）</span>
    <div class="verdict-line">
      <div class="vmain">
        <span class="dot"></span>
        <div>
          <div class="vlbl">AI VERDICT</div>
          <div class="vbig">${verdictLabel}</div>
        </div>
      </div>
      <div class="vside">
        <span class="lbl">Confidence</span>
        <b>92%</b>
      </div>
      <div class="vside">
        <span class="lbl">Overall Risk</span>
        <b>${overallRisk} / 100</b>
      </div>
    </div>
  </div>

  <!-- ── 排 2 · 漲幅情報 ── -->
  <div class="row">
    <span class="row-tag">排 2</span><span class="row-title">漲幅情報 · Price Movement</span>
    <div class="grid4">
      <div class="cell"><div class="k">供應商漲幅</div><div class="v red">+${args.supplierClaim.toFixed(1)}%</div><div class="v2">舊 ${args.oldPrice.toFixed(2)} → 新 ${args.newPrice.toFixed(2)}</div></div>
      <div class="cell"><div class="k">合理上限</div><div class="v green">+${args.sc.buffered.toFixed(1)}%</div><div class="v2">Should-Cost 拆解</div></div>
      <div class="cell"><div class="k">超出</div><div class="v red">+${overByActual.toFixed(1)}%</div><div class="v2">無市場依據</div></div>
      <div class="cell"><div class="k">目標價</div><div class="v purple">${targetPrice.toFixed(2)}</div><div class="v2">壓回合理上限</div></div>
    </div>
  </div>

  <!-- ── 排 3 · 公司財務 + 毛利衝擊 + Risk Radar 4 維度 ── -->
  <div class="row">
    <span class="row-tag">排 3</span><span class="row-title">公司財務 + 毛利衝擊 + Risk Radar（董事長不用猜「60 是什麼意思」）</span>
    <div class="grid4">
      <div class="cell dark">
        <div class="k">Annual Profit Impact 年損失</div>
        <div class="v red">−NT$ ${annualImpact.toLocaleString()}</div>
        <div class="v2">月損失 ${monthlyImpact.toLocaleString()} × 12</div>
      </div>
      <div class="cell dark">
        <div class="k">Annual Saving 可節省</div>
        <div class="v green">+NT$ ${annualSaving.toLocaleString()}</div>
        <div class="v2">切換鼎能 月省 ${monthlySaving.toLocaleString()} × 12</div>
      </div>
      <div class="cell" style="border-color:#d4351c;background:#fdecea">
        <div class="k red">Gross Margin Impact 毛利衝擊</div>
        <div class="v red">−${grossMarginDrop.toFixed(1)} pp</div>
        <div class="v2">${grossMarginBefore}% → <b style="color:#d4351c">${grossMarginAfter}%</b></div>
      </div>
      <div class="cell" style="border-color:#9aa291;background:#fbfcfa;padding:8px 10px">
        <div class="k" style="margin-bottom:4px">Risk Radar · 4 維度</div>
        ${riskRadar.map((r) => `
          <div style="display:flex;align-items:center;gap:5px;margin:2px 0">
            <span style="font-size:9.5px;color:#5b6356;width:46px">${r.k}</span>
            <div style="flex:1;height:5px;background:#eef0ea;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${r.v}%;background:${riskColor(r.v)}"></div>
            </div>
            <span style="font-family:'IBM Plex Mono';font-size:10px;font-weight:800;color:${riskColor(r.v)};width:24px;text-align:right">${r.v}</span>
          </div>
        `).join("")}
        <div style="border-top:1px solid #e9ece3;margin-top:4px;padding-top:3px;display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-family:'IBM Plex Mono';font-size:9px;letter-spacing:.06em;color:#5b6356">Overall Risk</span>
          <span style="font-family:'IBM Plex Mono';font-size:14px;font-weight:800;color:${riskColor(overallRisk)}">${overallRisk}/100</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 排 4 · 建議 — 世界級 CEO 版多 4 個數字 ── -->
  <div class="row">
    <span class="row-tag">排 4</span><span class="row-title">建議 · AI Recommendation（含目標價 + 可回收 + 時程 — 董事長最愛的格式）</span>
    <div class="advice" style="display:block">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <div>
          <div class="lbl">建議　ACTION</div>
          <div class="v">退回重議 — 同時啟動 <b style="color:#4d7c0f">鼎能 RFQ</b></div>
        </div>
        <div class="deadline">14 天完成</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;padding-top:8px;border-top:1px solid #dcebc4">
        <div>
          <div style="font-family:'IBM Plex Mono';font-size:9px;color:#5b6356;letter-spacing:.08em">目標價</div>
          <div style="font-family:'IBM Plex Mono';font-size:15px;font-weight:800;color:#c026d3">${targetPrice.toFixed(2)}</div>
        </div>
        <div>
          <div style="font-family:'IBM Plex Mono';font-size:9px;color:#5b6356;letter-spacing:.08em">預估可回收</div>
          <div style="font-family:'IBM Plex Mono';font-size:15px;font-weight:800;color:#4d7c0f">NT$ ${annualSaving.toLocaleString()}/年</div>
        </div>
        <div>
          <div style="font-family:'IBM Plex Mono';font-size:9px;color:#5b6356;letter-spacing:.08em">替代供應商</div>
          <div style="font-family:'IBM Plex Mono';font-size:15px;font-weight:800;color:#0c1908">鼎能 (Risk 92)</div>
        </div>
        <div>
          <div style="font-family:'IBM Plex Mono';font-size:9px;color:#5b6356;letter-spacing:.08em">完成時程</div>
          <div style="font-family:'IBM Plex Mono';font-size:15px;font-weight:800;color:#0c1908">14 天</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 排 5 · 簽核 Option A/B/C（拒絕+RFQ 合併為同一決策） ── -->
  <div class="row">
    <span class="row-tag">排 5</span><span class="row-title">簽核 · Sign-off（A/B/C 三方案擇一 — 拒絕 + 啟動 RFQ 是同一決策）</span>
    <div class="actbar">
      <div class="actbtn switch" style="text-align:left;padding:11px 14px">
        <span class="rec">RECOMMENDED</span>
        <div style="font-family:'IBM Plex Mono';font-size:11px;font-weight:700;letter-spacing:.1em;color:#4d7c0f">OPTION A</div>
        <div style="font-size:13px;font-weight:800;color:#4d7c0f;margin-top:5px">退回重議 + 啟動鼎能 RFQ</div>
        <div style="font-size:10px;color:#5b6356;margin-top:3px;line-height:1.4">☐ 拒絕 7.90　☐ 啟動鼎能 RFQ<br/><b style="color:#4d7c0f">同一決策 · 兩路並行</b></div>
      </div>
      <div class="actbtn" style="border-color:#b8860b;background:#fffaf0;text-align:left;padding:11px 14px">
        <div style="font-family:'IBM Plex Mono';font-size:11px;font-weight:700;letter-spacing:.1em;color:#b8860b">OPTION B</div>
        <div style="font-size:13px;font-weight:800;color:#b8860b;margin-top:5px">接受 ${targetPrice.toFixed(2)}</div>
        <div style="font-size:10px;color:#5b6356;margin-top:3px;line-height:1.4">☐ 議價成功上限<br/>年化損失 NT$ ${annualImpact.toLocaleString()}</div>
      </div>
      <div class="actbtn accept" style="text-align:left;padding:11px 14px">
        <div style="font-family:'IBM Plex Mono';font-size:11px;font-weight:700;letter-spacing:.1em;color:#5b6356">OPTION C</div>
        <div style="font-size:13px;font-weight:800;color:#5b6356;margin-top:5px">接受 ${args.newPrice.toFixed(2)}</div>
        <div style="font-size:10px;color:#5b6356;margin-top:3px;line-height:1.4">☐ 全額接受<br/>毛利 ${grossMarginBefore}% → ${grossMarginAfter}%</div>
      </div>
    </div>
  </div>

  <div class="sign">
    <span class="mono">Option A □　Option B □　Option C □</span>
    <span class="mono">簽核：______________　日期：__________</span>
  </div>

  <!-- 4 層架構（世界級企業實際分層）-->
  <div class="layers">
    <span class="lbl">AI SUPPLY CHAIN OS · 4 層報告系統</span><br/>
    <b>L0</b> 董事長 · 1 頁（本頁）· 結論 / 風險 / 毛利 / 決議
    <b>L1</b> 總經理 · 3–5 頁 · 價格 / 供應商 / 成本 / 替代方案<br/>
    <b>L2</b> 採購主管 · 10 頁 · CBS / Should Cost / RFQ / 談判策略
    <b>L3</b> AI Quotation Analyzer · 完整分析 · BOM / Cost / Commodity / Validation / Negotiation
  </div>

  <div class="footer">
    CHI HUA AI · L0 Board Card v4 · 五排架構 + Risk Radar + Option A/B/C · ${today}<br/>
    決策卡定位：作為董事長 / 總經理 / CEO 登入系統第一頁。月用 ${monthlyVolume.toLocaleString()} 件 · 年用 ${(monthlyVolume * 12).toLocaleString()} 件。
  </div>

</body></html>`;
}

// ============================================================
// ③ L1 Executive Report — 總經理 / 採購主管閱讀（4 頁固定）
// 回答總經理 4 個問題：
//   Page 1  為什麼不合理？ (Executive Summary)
//   Page 2  影響多少？     (Financial Impact)
//   Page 3  有沒有備案？風險多高？(Supply Risk)
//   Page 4  Action Plan + CEO Decision Workflow（簽核 → 系統自動執行）
// ============================================================
function buildPurchasingReportHtml(args: {
  partNo: string;
  supplier: string;
  oldPrice: number;
  newPrice: number;
  supplierClaim: number;
  supplierExcess: number;
  sc: { rows: { k: string; weight: number; delta: number; contrib: number }[]; total: number; buffered: number };
  bom: { k: string; pct: number; tone: string; mapTo: string }[];
  moves: { k: string; current: number; baseline: number; unit: string; asOf: string; source: string; delta: number }[];
}): string {
  const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  const targetPrice = +(args.oldPrice * (1 + args.sc.buffered / 100)).toFixed(2);
  const overByActual = +(args.supplierClaim - args.sc.buffered).toFixed(1);
  const monthlyVolume = 17000;
  const annualVolume = monthlyVolume * 12;
  // 月損失 / 年化（× 12）— 修正先前 bug：年化要 × 12
  const monthlyImpact = Math.round((args.newPrice - targetPrice) * monthlyVolume);
  const annualImpact = monthlyImpact * 12;
  const monthlyImpactSwitch = Math.round((args.newPrice - 6.90) * monthlyVolume);
  const annualImpactSwitch = monthlyImpactSwitch * 12;
  const verdictLabel = args.supplierClaim > args.sc.buffered * 1.5 ? "不合理"
                     : args.supplierClaim > args.sc.buffered ? "偏高" : "合理";
  const verdictColor = args.supplierClaim > args.sc.buffered * 1.5 ? "#d4351c"
                     : args.supplierClaim > args.sc.buffered ? "#b8860b" : "#4d7c0f";
  const verdictIcon = verdictLabel === "不合理" ? "🚨" : verdictLabel === "偏高" ? "⚠" : "✓";
  const grossMarginBefore = 21.4;
  const grossMarginAfter  = 12.45;

  // 替代供應商精選
  const suppliers = [
    { name: "鼎能精密",  quote: 6.90, leadWeeks: 5, quality: "A+", otd: 97, riskScore: 92, recommend: "首選" },
    { name: "力豐電子",  quote: 7.10, leadWeeks: 3, quality: "A+", otd: 95, riskScore: 88, recommend: "備案" },
    { name: "新竹 EFG",  quote: 7.30, leadWeeks: 4, quality: "A",  otd: 89, riskScore: 76, recommend: "觀察" },
  ];

  return `<!DOCTYPE html>
<html lang="zh-Hant"><head><meta charset="UTF-8" />
<title>L1 Executive Report · ${args.partNo}</title>
<style>
  @page { size: A4; margin: 14mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "Noto Sans TC","Sora",system-ui,sans-serif; color: #0c1208; margin: 0; padding: 14px 18px; line-height: 1.5; }
  .mono { font-family: "IBM Plex Mono",ui-monospace,Menlo,monospace; font-feature-settings: "tnum" 1; }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: #0c1908; }
  h2 { font-size: 14px; font-weight: 700; margin: 16px 0 6px; padding: 6px 12px; background: #f0f7e4; border-left: 4px solid #76b900; color: #0c1908; page-break-after: avoid; border-radius: 0 4px 4px 0; }
  h3 { font-size: 12.5px; font-weight: 700; margin: 12px 0 4px; color: #0c1908; }
  .sub { color: #5b6356; font-size: 12px; margin-bottom: 12px; }
  .meta { font-family: "IBM Plex Mono"; font-size: 10px; color: #9aa291; margin-bottom: 4px; letter-spacing: .06em; }
  .question { font-size: 14px; font-weight: 700; color: #0c1908; margin: 4px 0 10px; padding: 8px 14px; background: #0c1908; color: #76b900; border-radius: 6px; }
  .question .q { color: #cdd6c2; font-weight: 500; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { padding: 7px 8px; border-bottom: 1px solid #e9ece3; font-size: 11.5px; vertical-align: top; }
  th { background: #fbfcfa; color: #5b6356; text-align: left; font-weight: 600; font-size: 10px; letter-spacing: .04em; text-transform: uppercase; }
  td.r,th.r { text-align: right; }
  .red    { color: #d4351c; font-weight: 700; }
  .green  { color: #4d7c0f; font-weight: 700; }
  .purple { color: #c026d3; font-weight: 700; }
  .amber  { color: #b8860b; font-weight: 700; }
  .muted  { color: #9aa291; }
  .pagebreak { page-break-after: always; }
  .nobreak   { page-break-inside: avoid; }
  .chip { display: inline-block; font-family: "IBM Plex Mono"; font-size: 9.5px; font-weight: 700; color: #fff; padding: 2px 7px; border-radius: 4px; letter-spacing: .04em; }
  .chip.r { background: #d4351c; } .chip.g { background: #4d7c0f; } .chip.a { background: #b8860b; } .chip.p { background: #c026d3; } .chip.gray { background: #9aa291; }
  .note { font-size: 11px; color: #5b6356; padding: 8px 12px; background: #f0f7e4; border-left: 3px solid #76b900; border-radius: 4px; margin-top: 6px; }
  .note b { color: #0c1908; }

  /* compact verdict chip — 與下方 grid4 同列 */
  .verdict-chip { display: inline-flex; align-items: center; gap: 8px; background: ${verdictColor}; color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 12.5px; font-weight: 700; margin: 4px 0 10px; }
  .verdict-chip .lbl { font-family: "IBM Plex Mono"; font-size: 9.5px; letter-spacing: .12em; opacity: .8; }
  .verdict-chip .v { font-size: 14px; font-weight: 800; }
  .verdict-chip .icon { font-size: 13px; }
  .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px 12px; margin-bottom: 12px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
  .cell { border: 1px solid #e9ece3; border-radius: 8px; padding: 10px 12px; }
  .cell .k { font-family: "IBM Plex Mono"; font-size: 10px; color: #9aa291; letter-spacing: .06em; }
  .cell .v { font-family: "IBM Plex Mono"; font-size: 19px; font-weight: 800; margin-top: 4px; line-height: 1; }
  .cell .v2 { font-size: 10.5px; color: #5b6356; margin-top: 4px; }
  .cell.dark { background: #0c1908; border-color: #0c1908; }
  .cell.dark .k { color: #9aa78d; }
  .cell.dark .v.red { color: #ff8a7a; }
  .cell.dark .v.green { color: #76b900; }
  .cell.dark .v2 { color: #cdd6c2; }

  /* Why-unreasonable visualization (page 1) */
  .why-bar { display: flex; align-items: stretch; gap: 8px; margin: 12px 0; }
  .why-seg { flex: 1; border-radius: 8px; padding: 12px 14px; text-align: center; }
  .why-seg.fair { background: #f0f7e4; border: 2px solid #76b900; }
  .why-seg.gap  { background: #fdecea; border: 2px solid #d4351c; }
  .why-seg .lbl { font-family: "IBM Plex Mono"; font-size: 9.5px; letter-spacing: .1em; }
  .why-seg .val { font-family: "IBM Plex Mono"; font-size: 22px; font-weight: 800; margin-top: 4px; }
  .why-seg.fair .lbl,.why-seg.fair .val { color: #4d7c0f; }
  .why-seg.gap  .lbl,.why-seg.gap  .val { color: #d4351c; }
  .why-arrow { display: flex; align-items: center; font-size: 22px; color: #9aa291; font-weight: 700; }

  /* CEO Decision section (page 4) */
  .decision-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-top: 8px; }
  .decision-card { border: 2px solid; border-radius: 10px; padding: 14px 14px; min-height: 100px; position: relative; }
  .decision-card .cb { font-family: "IBM Plex Mono"; font-size: 16px; }
  .decision-card .h { font-family: "Noto Sans TC"; font-size: 14px; font-weight: 800; margin-top: 8px; }
  .decision-card .d { font-size: 10.5px; color: #5b6356; margin-top: 4px; line-height: 1.45; }
  .decision-card .rec { position: absolute; top: 8px; right: 10px; font-family: "IBM Plex Mono"; font-size: 8.5px; font-weight: 700; padding: 1px 6px; border-radius: 3px; letter-spacing: .08em; }
  .decision-card.reject   { border-color: #d4351c; background: #fdecea; }
  .decision-card.reject .h,.decision-card.reject .cb { color: #d4351c; }
  .decision-card.reject .rec { background: #d4351c; color: #fff; }
  .decision-card.rfq      { border-color: #4d7c0f; background: #f0f7e4; }
  .decision-card.rfq .h,.decision-card.rfq .cb { color: #4d7c0f; }
  .decision-card.rfq .rec { background: #4d7c0f; color: #fff; }
  .decision-card.survey   { border-color: #b8860b; background: #fffaf0; }
  .decision-card.survey .h,.decision-card.survey .cb { color: #b8860b; }
  .decision-card.approve  { border-color: #9aa291; background: #fbfcfa; border-style: dashed; }
  .decision-card.approve .h,.decision-card.approve .cb { color: #5b6356; }

  .workflow { background: #0c1908; color: #fff; border-radius: 10px; padding: 14px 18px; margin-top: 12px; }
  .workflow .h { font-family: "IBM Plex Mono"; font-size: 11px; letter-spacing: .12em; color: #76b900; font-weight: 700; }
  .workflow .lead { font-size: 13px; font-weight: 700; color: #fff; margin-top: 6px; }
  .workflow .lead .em { color: #76b900; }
  .workflow ul { padding-left: 18px; margin: 8px 0 0; }
  .workflow li { font-size: 11.5px; color: #cdd6c2; margin: 3px 0; }
  .workflow li b { color: #fff; }

  .layers { margin-top: 14px; font-size: 10.5px; color: #5b6356; padding: 10px 14px; background: #fbfcfa; border: 1px solid #e9ece3; border-radius: 8px; }
  .layers b { color: #0c1908; }
  .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #e9ece3; font-family: "IBM Plex Mono"; font-size: 9.5px; color: #9aa291; line-height: 1.55; }
</style></head>
<body>

  <!-- ═════════════ PAGE 1 · 為什麼不合理？ ═════════════ -->
  <div class="meta">CHI HUA AI · L1 EXECUTIVE REPORT · PAGE 1 of 3 · 給總經理 / 採購主管</div>
  <h1>L1 Executive Report · ${args.partNo}</h1>
  <div class="sub">總經理閱讀版（3 頁列印，4 段內容）· 供應商 <b>${args.supplier}</b> · 報告日 ${today}</div>

  <div class="question"><span class="q">總經理想知道的第 1 個問題：</span><br/>為什麼不合理？</div>
  <h2>第 1 頁 · Executive Summary
    <span class="verdict-chip" style="margin-left:10px;vertical-align:middle">
      <span class="lbl">AI VERDICT</span>
      <span class="v">${verdictLabel}</span>
      <span class="icon">${verdictIcon}</span>
    </span>
  </h2>

  <div class="grid4 nobreak">
    <div class="cell"><div class="k">供應商</div><div class="v" style="font-size:15px;color:#0c1208">${args.supplier}</div><div class="v2">${args.partNo}</div></div>
    <div class="cell"><div class="k">新單價</div><div class="v red">${args.newPrice.toFixed(2)}</div><div class="v2">舊價 ${args.oldPrice.toFixed(2)} → +${args.supplierClaim.toFixed(1)}%</div></div>
    <div class="cell"><div class="k">合理範圍</div><div class="v green">+${args.sc.buffered.toFixed(1)}%</div><div class="v2">目標價 ${targetPrice.toFixed(2)}</div></div>
    <div class="cell"><div class="k">超出</div><div class="v red">+${overByActual.toFixed(1)}%</div><div class="v2">無市場依據</div></div>
  </div>

  <h3>為什麼不合理 — 一張圖看懂</h3>
  <div class="why-bar nobreak">
    <div class="why-seg fair">
      <div class="lbl">SHOULD-COST 合理</div>
      <div class="val">+${args.sc.buffered.toFixed(1)}%</div>
    </div>
    <div class="why-arrow">+</div>
    <div class="why-seg gap">
      <div class="lbl">無依據超出</div>
      <div class="val">+${overByActual.toFixed(1)}%</div>
    </div>
    <div class="why-arrow">=</div>
    <div class="why-seg gap">
      <div class="lbl">供應商喊</div>
      <div class="val">+${args.supplierClaim.toFixed(1)}%</div>
    </div>
  </div>

  <h3>合理 +${args.sc.buffered.toFixed(1)}% 的市場依據（逐筆可驗證）</h3>
  <table class="nobreak">
    <thead><tr><th>成分</th><th class="r">權重</th><th class="r">市場價變動</th><th class="r">合理貢獻</th><th>來源</th></tr></thead>
    <tbody>
      ${args.sc.rows.map((r) => {
        const cp = COMPONENT_PRICE[r.k];
        return `<tr>
          <td><b>${r.k}</b></td>
          <td class="r mono">${r.weight}%</td>
          <td class="r mono ${r.delta > 5 ? "red" : "amber"}">${cp ? `${cp.baseline.toLocaleString()} → ${cp.current.toLocaleString()}` : ""} (+${r.delta}%)</td>
          <td class="r mono green">+${r.contrib.toFixed(2)}%</td>
          <td style="font-size:10.5px">${cp?.source ?? "—"}</td>
        </tr>`;
      }).join("")}
      <tr style="background:#f0f7e4"><td colspan="3"><b>合理上限（緩衝後）</b></td><td class="r mono green"><b>+${args.sc.buffered.toFixed(1)}%</b></td><td></td></tr>
    </tbody>
  </table>

  <div class="pagebreak"></div>

  <!-- ═════════════ PAGE 2 · 影響多少？ ═════════════ -->
  <div class="meta">CHI HUA AI · L1 EXECUTIVE REPORT · PAGE 2 of 3 · 含 Financial Impact + Supply Risk</div>
  <div class="question"><span class="q">總經理想知道的第 2 個問題：</span><br/>影響多少？</div>
  <h2>第 2 段 · Financial Impact</h2>

  <div class="grid3 nobreak">
    <div class="cell dark">
      <div class="k">月損失</div>
      <div class="v red">NT$ ${monthlyImpact.toLocaleString()}</div>
      <div class="v2">(${args.newPrice.toFixed(2)} − ${targetPrice.toFixed(2)}) × ${monthlyVolume.toLocaleString()}</div>
    </div>
    <div class="cell dark">
      <div class="k">年化損失 Annual Profit Impact</div>
      <div class="v red">−NT$ ${annualImpact.toLocaleString()}</div>
      <div class="v2">月損失 × 12 月</div>
    </div>
    <div class="cell dark">
      <div class="k">切換鼎能 · Annual Saving</div>
      <div class="v green">+NT$ ${annualImpactSwitch.toLocaleString()}</div>
      <div class="v2">月省 NT$ ${monthlyImpactSwitch.toLocaleString()} × 12 月</div>
    </div>
  </div>

  <h3>毛利衝擊（如果接受 +${args.supplierClaim.toFixed(1)}%）</h3>
  <table class="nobreak">
    <thead><tr><th>指標</th><th class="r">接受漲價前</th><th class="r">接受漲價後</th><th class="r">變動</th></tr></thead>
    <tbody>
      <tr><td>毛利率</td><td class="r mono">${grossMarginBefore}%</td><td class="r mono red">${grossMarginAfter}%</td><td class="r mono red"><b>−${(grossMarginBefore - grossMarginAfter).toFixed(2)} pp</b></td></tr>
      <tr><td>年化毛利金額</td><td class="r mono">NT$ ${Math.round(9_700_000 * grossMarginBefore / 100).toLocaleString()}</td><td class="r mono red">NT$ ${Math.round(9_700_000 * grossMarginAfter / 100).toLocaleString()}</td><td class="r mono red"><b>−NT$ ${Math.round(9_700_000 * (grossMarginBefore - grossMarginAfter) / 100).toLocaleString()}</b></td></tr>
    </tbody>
  </table>

  <h3>三情境並排</h3>
  <table class="nobreak">
    <thead><tr><th>情境</th><th class="r">單價</th><th class="r">月差</th><th class="r">年化差</th><th>結果</th></tr></thead>
    <tbody>
      <tr><td>接受 ${args.newPrice.toFixed(2)}</td><td class="r mono red">${args.newPrice.toFixed(2)}</td><td class="r mono muted">baseline</td><td class="r mono muted">baseline</td><td><span class="chip r">不建議</span></td></tr>
      <tr style="background:#f0f7e4"><td><b>議價目標</b></td><td class="r mono purple"><b>${targetPrice.toFixed(2)}</b></td><td class="r mono green"><b>−${monthlyImpact.toLocaleString()}</b></td><td class="r mono green"><b>−${annualImpact.toLocaleString()}</b></td><td><span class="chip g">議價空間</span></td></tr>
      <tr><td>切換鼎能</td><td class="r mono green">6.90</td><td class="r mono green">−${monthlyImpactSwitch.toLocaleString()}</td><td class="r mono green">−${annualImpactSwitch.toLocaleString()}</td><td><span class="chip g">最省</span></td></tr>
    </tbody>
  </table>
  <div class="note">
    <b>總經理結論</b> · 接受 ${args.newPrice.toFixed(2)} 一年虧 <b class="red">NT$ ${annualImpact.toLocaleString()}</b>；
    壓回 ${targetPrice.toFixed(2)} 即守住；切換鼎能反而省 <b class="green">NT$ ${annualImpactSwitch.toLocaleString()}/年</b>，毛利可保住 <b>${grossMarginBefore}%</b>。
  </div>

  <!-- 接續同頁 — 第 3 段 Supply Risk（與 Financial Impact 合併於同張 A4） -->
  <div class="question" style="margin-top:14px"><span class="q">總經理想知道的第 3 & 4 個問題：</span><br/>有沒有備案？風險多高？</div>
  <h2>第 3 段 · Supply Risk · 替代供應商 + Supplier Risk Score</h2>

  <table class="nobreak">
    <thead><tr>
      <th>排序</th>
      <th>供應商</th>
      <th class="r">報價</th>
      <th class="r">交期</th>
      <th class="r">品質</th>
      <th class="r">OTD</th>
      <th class="r">Risk Score</th>
      <th>AI 推薦</th>
    </tr></thead>
    <tbody>
      <tr style="background:#fdecea">
        <td><span class="chip r">NOW</span></td>
        <td><b>${args.supplier}</b>（現任）</td>
        <td class="r mono red">${args.newPrice.toFixed(2)}</td>
        <td class="r mono">7 週</td>
        <td class="r mono">A</td>
        <td class="r mono red">92%</td>
        <td class="r mono red"><b>65</b><span style="font-size:9px;color:#9aa291">/100</span></td>
        <td><span class="chip r">退單</span></td>
      </tr>
      ${suppliers.map((s, i) => {
        const recTone = s.recommend === "首選" ? "g" : s.recommend === "備案" ? "g" : "a";
        const scoreColor = s.riskScore >= 90 ? "#4d7c0f" : s.riskScore >= 80 ? "#b8860b" : "#5b6356";
        const rowBg = i === 0 ? "background:#f0f7e4" : "";
        return `<tr style="${rowBg}">
          <td><span class="chip ${i === 0 ? "g" : "gray"}">${i === 0 ? "★ 1st" : `#${i + 1}`}</span></td>
          <td><b>${s.name}</b></td>
          <td class="r mono green">${s.quote.toFixed(2)}</td>
          <td class="r mono">${s.leadWeeks} 週</td>
          <td class="r mono">${s.quality}</td>
          <td class="r mono ${s.otd >= 95 ? "green" : s.otd >= 90 ? "amber" : "red"}">${s.otd}%</td>
          <td class="r mono" style="color:${scoreColor};font-weight:800;font-size:13px">${s.riskScore}<span style="font-size:9px;color:#9aa291">/100</span></td>
          <td><span class="chip ${recTone}">${s.recommend}</span></td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  <div class="note">
    <b>備案明確</b> · 首選 <b class="green">鼎能精密 Risk 92/100</b>（${suppliers[0].quote.toFixed(2)} 元 / ${suppliers[0].leadWeeks} 週 / OTD ${suppliers[0].otd}% / 品質 ${suppliers[0].quality}）
    年省 NT$ ${annualImpactSwitch.toLocaleString()}。<br/>
    <b>風險可控</b> · 雙廠 SOS（70% 鼎能 + 30% 力豐）即可消除單一供應商依賴。
  </div>

  <h3>Supplier Risk Score 評分維度（共 4 項，加總 100）</h3>
  <table class="nobreak" style="font-size:11px">
    <thead><tr><th>維度</th><th class="r">權重</th><th>說明</th></tr></thead>
    <tbody>
      <tr><td><b>交期準確率 OTD</b></td><td class="r mono">30%</td><td>過去 12 月準時交貨比率</td></tr>
      <tr><td><b>品質 / 不良率</b></td><td class="r mono">30%</td><td>過去 12 月入料 IQC PPM</td></tr>
      <tr><td><b>報價競爭力</b></td><td class="r mono">25%</td><td>與市場 / 同業均值比較</td></tr>
      <tr><td><b>規模 / 穩定度</b></td><td class="r mono">15%</td><td>產能 / 財務 / 替代產線</td></tr>
    </tbody>
  </table>

  <div class="pagebreak"></div>

  <!-- ═════════════ PAGE 4 · Action Plan + CEO Decision Workflow ═════════════ -->
  <div class="meta">CHI HUA AI · L1 EXECUTIVE REPORT · PAGE 3 of 3 · Action Plan + CEO Decision</div>
  <h2>第 4 段 · Action Plan + CEO Decision</h2>

  <h3>採購行動三層 · P1 / P2 / P3</h3>
  <table class="nobreak">
    <thead><tr><th>優先級</th><th>動作</th><th>負責</th><th>截止</th><th class="r">財務影響</th></tr></thead>
    <tbody>
      <tr style="background:#fdecea">
        <td><span class="chip r">P1 · 立即</span></td>
        <td><b>拒退報價 + 啟動鼎能 RFQ</b><br/><span class="muted">月化 NT$ ${monthlyImpactSwitch.toLocaleString()}</span></td>
        <td>採購</td>
        <td>48 小時</td>
        <td class="r mono red">擋損 NT$ ${annualImpactSwitch.toLocaleString()}/年</td>
      </tr>
      <tr style="background:#fffaf0">
        <td><span class="chip a">P2 · 短期</span></td>
        <td><b>建立雙廠 SOS 機制</b><br/><span class="muted">70% 鼎能 + 30% 現任</span></td>
        <td>採購 + 生管</td>
        <td>14 天</td>
        <td class="r mono amber">分散風險</td>
      </tr>
      <tr style="background:#f0f7e4">
        <td><span class="chip g">P3 · 長期</span></td>
        <td><b>含解價條款 PEC</b><br/><span class="muted">合約綁 LME 銅 + IPCEI，自動算合理調幅</span></td>
        <td>採購 + 法務</td>
        <td>90 天</td>
        <td class="r mono green">結構性消除</td>
      </tr>
    </tbody>
  </table>

  <h3>CEO Decision · 簽核四選一</h3>
  <div class="decision-grid nobreak">
    <div class="decision-card reject">
      <span class="rec">RECOMMENDED</span>
      <div class="cb">☐</div>
      <div class="h">Reject</div>
      <div class="d">拒絕現報價 +${args.supplierClaim.toFixed(1)}%，要求重報至合理上限 ${targetPrice.toFixed(2)} 以內。</div>
    </div>
    <div class="decision-card rfq">
      <span class="rec">RECOMMENDED</span>
      <div class="cb">☐</div>
      <div class="h">RFQ Alternative</div>
      <div class="d">啟動鼎能精密 RFQ，5 週交期、Risk Score 92/100。</div>
    </div>
    <div class="decision-card survey">
      <div class="cb">☐</div>
      <div class="h">Send Survey</div>
      <div class="d">發出供應商成本依據問卷，要求 7 天內回覆超出 +${overByActual.toFixed(1)}% 的明細。</div>
    </div>
    <div class="decision-card approve">
      <div class="cb">☐</div>
      <div class="h">Approve</div>
      <div class="d">接受 +${args.supplierClaim.toFixed(1)}%，年化損失 NT$ ${annualImpact.toLocaleString()}。不建議。</div>
    </div>
  </div>

  <div class="workflow nobreak">
    <div class="h">DECISION + WORKFLOW · 一個簽核完成</div>
    <div class="lead">CEO 勾選後，系統<span class="em">自動執行</span>下列任務，無需人工重打：</div>
    <ul>
      <li><b>Reject</b> → 自動寄出 <span class="mono">退單通知</span> + 觸發 <span class="mono">議價任務 NEG-${args.partNo}</span></li>
      <li><b>RFQ Alternative</b> → 自動建立 <span class="mono">RFQ-${args.partNo}</span> + 寄送鼎能 / 力豐 + 設 14 天回覆鬧鐘</li>
      <li><b>Send Survey</b> → 推送 Supplier Portal 問卷（已附 Should-Cost 拆解 PDF）</li>
      <li><b>Approve</b> → 觸發 <span class="mono">PO 簽核流程</span>（含風險警示與年化損失警告）</li>
    </ul>
  </div>

  <div class="layers nobreak">
    <b>AI Supply Chain OS · 3 層報告系統</b><br/>
    <b>L0</b> Board Decision Card · 董事會 1 頁　·　<b>L1</b> Executive Report · 本份 4 頁　·　<b>L3</b> Quotation Analyzer · 完整 11 段 + Evidence Pack
  </div>

  <div class="footer">
    CHI HUA AI · L1 Executive Report v3 · 為總經理 / 採購主管設計 · 3 頁列印（4 段內容，Financial Impact + Supply Risk 合併同頁）<br/>
    回答 4 個問題：為什麼不合理？影響多少？有沒有備案？風險多高？<br/>
    資料來源：ERP BOM v3.2 · LME · IPCEI · 中鋼 · BDI · 勞動部　·　列印日：${today}
  </div>

</body></html>`;
}
