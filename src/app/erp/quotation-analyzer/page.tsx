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

// Step 3 — AI 抓的目前各成分變動
const COMMODITY_MOVES = [
  { k: "LME 銅",         delta: +5.0, source: "LME 30 日均" },
  { k: "電鍍加工指數",   delta: +12.0, source: "業界 IPCEI Q1" },
  { k: "鏡板（鎂鋁）",   delta: +8.0, source: "中鋼 + 寶武" },
  { k: "工資（製造業）", delta: +3.0, source: "台勞動部公告" },
  { k: "運費 BDI",       delta: +7.0, source: "Baltic Dry Index" },
];

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

  return (
    <div
      style={{
        background: BR.page,
        backgroundImage: `linear-gradient(to right, rgba(12,18,8,.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,18,8,.022) 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        minHeight: "100vh", fontFamily: FONT, color: BR.ink,
      }}
    >
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {COMMODITY_MOVES.map((c) => (
              <div key={c.k} className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BR.ink }}>{c.k}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: c.delta > 5 ? BR.red : c.delta > 0 ? BR.amber : BR.greenDeep, marginTop: 6 }}>
                  +{c.delta.toFixed(1)}%
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: BR.inkFaint, marginTop: 4 }}>{c.source}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Step 4 · Should Cost Engine */}
        <StepHeader badge="STEP 4" title="Should Cost Engine" en="Compute fair upper limit" desc="把 BOM 權重 × 各成分變動 → 加總得合理漲幅" />
        <Card>
          <div className="grid lg:grid-cols-[1fr,280px] gap-5">
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                ① 計算
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
                      {["成分", "BOM 權重", "當前變動", "計算式", "合理貢獻"].map((h, i) => (
                        <th key={h} style={{
                          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                          color: BR.inkFaint, textAlign: i >= 1 ? "right" : "left",
                          padding: "9px 8px",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sc.rows.map((r) => (
                      <tr key={r.k} style={{ borderBottom: `1px solid #f3f5ef` }}>
                        <td style={{ padding: "11px 8px", fontWeight: 700 }}>{r.k}</td>
                        <td style={{ padding: "11px 8px", textAlign: "right", fontFamily: FONT_MONO }}>{r.weight}%</td>
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
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: BR.greenSoft }}>
                      <td colSpan={4} style={{ padding: "12px 8px", fontWeight: 700, color: BR.greenInk }}>合理上限 (加總)</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.greenInk }}>
                        +{sc.total.toFixed(1)}%
                      </td>
                    </tr>
                    <tr style={{ background: BR.greenSoft }}>
                      <td colSpan={4} style={{ padding: "12px 8px", fontWeight: 700, color: BR.greenInk }}>緩衝後（×1.10）</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.greenInk }}>
                        +{sc.buffered.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>
                ② AI 對「{SELECTED.partNo} +{supplierClaim.toFixed(1)}%」的判定
              </div>
              <div className="rounded-[12px] overflow-hidden" style={{ border: `2px solid ${verdict.tone}`, background: verdict.bg }}>
                <div style={{ background: verdict.tone, color: "#fff", padding: "10px 14px" }}>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700 }}>{verdict.label}</span>
                </div>
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: BR.inkSoft }}>合理上限</span>
                    <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>+{sc.buffered}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: BR.inkSoft }}>供應商喊</span>
                    <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>+{supplierClaim}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2" style={{ borderColor: `${verdict.tone}30` }}>
                    <span style={{ color: BR.inkSoft }}>{overByActual > 0 ? "超出" : "差距"}</span>
                    <span style={{ fontFamily: FONT_MONO, fontWeight: 800, color: verdict.tone }}>
                      {overByActual > 0 ? "+" : ""}{overByActual.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario: 如果供應商喊 25% */}
              <div className="rounded-[10px] p-3" style={{ background: BR.redSoft, border: `1px solid ${BR.red}40` }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.red, letterSpacing: "0.08em" }}>
                  ③ 對照情境 · 若供應商喊 +{supplierExcess}%
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span style={{ color: BR.inkSoft }}>合理上限</span>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>+{sc.buffered}%</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: BR.inkSoft }}>供應商要求</span>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>+{supplierExcess}%</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t" style={{ borderColor: `${BR.red}30` }}>
                  <span style={{ fontWeight: 700, color: BR.red }}>超出</span>
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.red }}>+{overByExcess.toFixed(1)}%</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: BR.red, marginTop: 6 }}>
                  → 自動觸發「強硬議價」流程
                </div>
              </div>
            </div>
          </div>
        </Card>

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
                <button style={{
                  width: "100%", background: BR.green, color: "#fff",
                  border: "none", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  📑 產出 Should-Cost 報告 (PDF)
                </button>
                <button style={{
                  width: "100%", background: "rgba(255,255,255,.08)", color: "#fff",
                  border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  📨 發送議價會議邀請
                </button>
                <button style={{
                  width: "100%", background: "rgba(255,255,255,.08)", color: "#fff",
                  border: "1px solid rgba(255,255,255,.16)", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  📝 退單通知供應商
                </button>
              </div>
            </div>
          </div>
        </Card>

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
