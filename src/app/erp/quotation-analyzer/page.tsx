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

  // ── ① 產出 Should-Cost 報告 (PDF) — 開新分頁印成 PDF（彈窗被擋則自動改用 Blob 下載） ──
  const handleGenerateReport = () => {
    try {
      const reportHtml = buildShouldCostReportHtml({
        partNo: SELECTED.partNo,
        supplier: SELECTED.supplier,
        oldPrice: SELECTED.oldPrice,
        newPrice: SELECTED.newPrice,
        supplierClaim,
        supplierExcess,
        sc,
        bom: BOM_BREAKDOWN,
        moves: COMMODITY_MOVES,
      });
      // 優先：開新分頁 + 自動列印
      const win = window.open("", "_blank");
      if (win && win.document) {
        win.document.open();
        win.document.write(reportHtml);
        win.document.close();
        setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 700);
        showToast("✓ AI Should-Cost Decision Report（9 段式）已開啟 — 列印對話框會自動跳出，選「另存為 PDF」即可");
        return;
      }
      // Fallback：彈窗被擋 → 改用 Blob 觸發下載 .html
      const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `should-cost-${SELECTED.partNo}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("✓ 彈窗被擋 — 改用下載：should-cost-" + SELECTED.partNo + ".html（開啟後即可列印 / 另存為 PDF）");
    } catch (e) {
      showToast("⚠ 產出失敗：" + (e instanceof Error ? e.message : String(e)));
    }
  };

  // ── ② 發送議價會議邀請 — mailto link（預先組好 href） ──
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
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  style={{
                    width: "100%", background: BR.green, color: "#fff",
                    border: "none", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "block", textAlign: "center",
                  }}>
                  📑 產出 Should-Cost 報告 (PDF)
                </button>
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

  // §6 替代供應商精簡版
  const alts = ALT_SUPPLIERS.map((s) => ({
    name: s.name, quote: s.quote, leadWeeks: s.leadWeeks, quality: s.qualityScore >= 95 ? "A+" : "A",
  }));
  const bestAltSaving = Math.round((args.newPrice - alts[0].quote) * 12000 / 100); // demo: 假設月用 12,000 件

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

  <h3>本報告目錄（9 個段落）</h3>
  <div class="toc nobreak">
    ${[
      ["§1", "Executive Summary · AI Verdict",       "CEO 一頁摘要"],
      ["§2", "Price Change",                          "舊價 / 新價 / 漲幅"],
      ["§3", "Cost Breakdown",                        "BOM × CBS 成分結構"],
      ["§4", "Commodity Impact",                      "各成分當前 vs 基期（推導透明）"],
      ["§5", "Supplier Benchmark · Historical Trend", "過去 6 年漲價軌跡"],
      ["§6", "Alternative Supplier Comparison",       "備案供應商比較"],
      ["§7", "Negotiation Strategy",                  "行動 · 證據 · 拒絕 · 備案"],
      ["§8", "AI Confidence",                         "信心度拆解 · 為何 92%"],
      ["§9", "Approval Recommendation",               "留客戶 / 切換 / 重議"],
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
  <h2>§3 Cost Breakdown · BOM × CBS 成分結構</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    依 ERP 標準成本卡 + Cost Breakdown System（CBS）反推此料各成分佔比。
  </p>
  <table class="nobreak">
    <thead><tr><th>成分</th><th class="r">佔成本</th><th>對應商品 / 指數</th></tr></thead>
    <tbody>
      ${args.bom.map((b) => `<tr><td>${b.k}</td><td class="r mono">${b.pct}%</td><td>${b.mapTo}</td></tr>`).join("")}
    </tbody>
  </table>

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
  <h2>§6 Alternative Supplier Comparison · 替代供應商比較</h2>
  <p style="font-size:11.5px;color:#5b6356;margin:0 0 6px">
    <b>這一段給對方看了就知道 — 我們有備案。</b>
  </p>
  <table class="nobreak">
    <thead><tr><th>供應商</th><th class="r">報價</th><th class="r">交期</th><th class="r">品質</th><th class="r">vs 現任</th><th>AI 建議</th></tr></thead>
    <tbody>
      <tr style="background:#fdecea">
        <td><b>${args.supplier}（現任）</b> <span class="chip r">NOW</span></td>
        <td class="r mono red">${args.newPrice.toFixed(2)}</td>
        <td class="r mono">7 週</td>
        <td class="r mono">A</td>
        <td class="r mono muted">baseline</td>
        <td class="red">本次 +${args.supplierClaim.toFixed(1)}% 不合理 → 退單</td>
      </tr>
      ${alts.map((a, i) => {
        const diff = +(((a.quote - args.newPrice) / args.newPrice) * 100).toFixed(1);
        const advice = i === 0 ? "✓ 立即詢價" : i === 1 ? "✓ 切換" : "備案";
        return `
          <tr>
            <td><b>${a.name}</b></td>
            <td class="r mono green">${a.quote.toFixed(2)}</td>
            <td class="r mono">${a.leadWeeks} 週</td>
            <td class="r mono">${a.quality}</td>
            <td class="r mono green">${diff.toFixed(1)}%</td>
            <td><span class="chip g">${advice}</span></td>
          </tr>`;
      }).join("")}
    </tbody>
  </table>
  <div class="note">
    <b>AI 建議</b> · 切換 <b>${alts[0].name}</b>（${alts[0].quote.toFixed(2)} 元 / ${alts[0].leadWeeks} 週）
    vs 現任 ${args.newPrice.toFixed(2)} 元，月用量 12,000 件估算可省
    <b class="green">NT$ ${bestAltSaving.toLocaleString()}/月</b>。
  </div>

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
        <td>月省 vs 喊價 NT$ ${Math.round((args.newPrice - targetPrice) * 12000).toLocaleString()}</td>
        <td><span class="chip g">優先</span></td>
      </tr>
      <tr>
        <td><b>B. 切換 ${alts[0].name}</b></td>
        <td>${alts[0].quote.toFixed(2)} 元 / ${alts[0].leadWeeks} 週 / 品質 ${alts[0].quality}</td>
        <td>月省 vs 現任喊價 <b class="green">NT$ ${bestAltSaving.toLocaleString()}</b></td>
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
        <td>月多支 vs 合理 NT$ ${Math.round((args.newPrice - targetPrice) * 12000).toLocaleString()}</td>
        <td><span class="chip r">不建議</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    本報告由 <b>CHI HUA AI Supply Chain OS · L3 AI Quotation Analyzer</b> 自動產出。<br />
    Should-Cost 模型 = Σ(BOM 權重 × 當前商品波動) × 1.10 緩衝係數。<br />
    資料來源：ERP BOM v3.2 · LME 倫敦金屬交易所 · IPCEI 電鍍指數 · 中鋼 / 寶武牌價 · 勞動部 · Baltic Dry Index。<br />
    列印日：${today} · 報告版本 v9.0 (9-section world-class)
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
