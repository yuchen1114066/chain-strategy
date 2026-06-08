"use client";

import { useState } from "react";
import Link from "next/link";

// ============================================================
// L2 OPERATIONS · AI Lead Time Validation Engine
// 業務問「10 週交期合理嗎？」→ 系統直接拆 BOM、查商品、推合理交期、回信
//
// 原本流程：業務 → 生管 → 採購 → 供應商 → 回信給業務（鏈很長、答案會落很久）
// 世界級做法：AI Supply Chain OS 直接以系統回覆
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

// 受審視的料號（mock from email）
const TARGET = {
  partNo: "SEP6C727",
  customer: "海外 OEM 客戶 X",
  vendorClaimWeeks: 10,        // 廠商需 10 週交貨
  vendorClaimDays: 70,
};

// Step 1 — 從 ERP 找到的元件 / BOM 結構（簡略視圖）
const BOM_ROW = [
  { k: "電源板",       pct: 18, leadDays: 42, hot: true,  source: "外殼 + IC 整合" },
  { k: "PCB",          pct: 24, leadDays: 32, hot: false, source: "雙面板 4 層" },
  { k: "開關 / 按鍵",  pct: 14, leadDays: 14, hot: false, source: "塑膠 + 金屬簧片" },
  { k: "連接器",       pct:  7, leadDays: 28, hot: true,  source: "USB-C × 2" },
  { k: "線材",         pct:  5, leadDays:  6, hot: false, source: "+插頭組" },
  { k: "風扇 / USB 模組", pct: 12, leadDays: 18, hot: false, source: "靜音風扇" },
  { k: "包裝 / 組裝 / 出貨", pct: 20, leadDays: 5, hot: false, source: "末段加工" },
];

// Step 2 — Lead time 分段（這是看清楚 70 天到底花在哪）
const SEGMENTS = [
  { stage: "電源板（含外殼）", days: 42, tone: BR.red,    note: "元件交期最長段" },
  { stage: "連接器件",           days: 28, tone: BR.amber,  note: "USB-C 缺貨潮" },
  { stage: "PCB 製版",           days: 32, tone: BR.amber,  note: "可與電源板並行" },
  { stage: "包裝 / 組裝 / 出貨", days:  5, tone: BR.greenDeep, note: "最末段" },
];

// Step 3 — 供應商說 7 週 vs AI 推估
const VENDOR_BREAKDOWN = {
  total: 70,
  parts: [
    { k: "原料準備",   days: 28, color: BR.red,    note: "銅 / IC / PCB 等" },
    { k: "生產 / 製造", days: 21, color: BR.amber,  note: "SMT + 組裝" },
    { k: "QC / 包裝",   days:  7, color: BR.blue,   note: "出貨前檢驗" },
    { k: "海運 / 物流", days: 14, color: BR.greenDeep, note: "上海 → 高雄港" },
  ],
};

// Step 4 — AI 推估合理交期 = 各段並行後的關鍵路徑
function computeAILeadTime() {
  // 關鍵路徑 = 最長段（電源板 42 天）+ 末段 5 天 = 47 天
  // 並行情況下 PCB / 連接器 / 風扇可同時進行
  const critical = Math.max(...BOM_ROW.map((b) => b.leadDays));      // 42
  const tail = BOM_ROW.find((b) => b.k.startsWith("包裝"))?.leadDays ?? 5;
  const aiLow = critical + tail - 3;      // 44 天
  const aiHigh = critical + tail + 3;     // 50 天
  return {
    aiLow,
    aiHigh,
    midpoint: Math.round((aiLow + aiHigh) / 2),  // 47
  };
}

// Supplier Score（進一步可換供應商嗎？）
const SUPPLIER_SCORES = [
  { name: "AGI #1（現任）",     onTime: 56, defects: 1.0, leadAvg: 70, capacity: 80, overall: 71 },
  { name: "AGI #2",              onTime: 78, defects: 0.5, leadAvg: 58, capacity: 65, overall: 83 },
  { name: "Hua Cheng",           onTime: 88, defects: 0.3, leadAvg: 52, capacity: 50, overall: 89 },
  { name: "新竹昌晟",            onTime: 80, defects: 0.6, leadAvg: 55, capacity: 75, overall: 84 },
];

export default function LeadTimeValidationPage() {
  const ai = computeAILeadTime();
  const excessDays = TARGET.vendorClaimDays - ai.midpoint;            // 70 - 47 = 23
  const reasonableLow = ai.aiLow;
  const reasonableHigh = ai.aiHigh;
  const status = TARGET.vendorClaimDays > reasonableHigh * 1.2
    ? { tone: BR.red, label: "🚨 嚴重超出 · 需強硬議交期" }
    : TARGET.vendorClaimDays > reasonableHigh
    ? { tone: BR.amber, label: "⚠ 偏長 · 要求重新評估" }
    : { tone: BR.greenDeep, label: "✓ 合理 · 可接受" };

  const [activeTab, setActiveTab] = useState<"pipeline" | "score" | "arch">("pipeline");
  const [chatQuery, setChatQuery] = useState("");
  const [chatAnswer, setChatAnswer] = useState<ChatAnswer | null>(null);
  const [chatThinking, setChatThinking] = useState(false);

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

        {/* Header */}
        <header>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              color: "#fff", background: BR.greenInk, padding: "4px 10px", borderRadius: 5,
            }}>
              L2 OPERATIONS
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint, letterSpacing: "0.06em" }}>
              erp / lead-time-validation
            </span>
          </div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
            <span style={{ color: BR.green, marginRight: 8 }}>⏱</span>
            AI Lead Time Validation Engine
          </h1>
          <p style={{ fontSize: 14, color: BR.inkSoft, marginTop: 6 }}>
            業務一封 email 問「10 週交期合不合理？」<b style={{ color: BR.ink }}>不該再走</b>
            業務 → 生管 → 採購 → 供應商 → 回信。
            <b style={{ color: BR.purple }}> AI Supply Chain OS 直接以系統回覆。</b>
          </p>
        </header>

        {/* AI 對話框 — 業務輸入問題，AI 給最佳解答 */}
        <AIChatBox
          query={chatQuery}
          setQuery={setChatQuery}
          answer={chatAnswer}
          setAnswer={setChatAnswer}
          thinking={chatThinking}
          setThinking={setChatThinking}
          target={TARGET}
          ai={ai}
          excessDays={excessDays}
        />

        {/* 原始信件 + 痛點 vs 世界級做法（前情提要） */}
        <div className="grid lg:grid-cols-[1fr,1fr] gap-4">
          <Card>
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>
                收到的 email · {TARGET.partNo}
              </span>
              <Pill text="待回覆" tone="amber" />
            </div>
            <div className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}`, fontSize: 12, lineHeight: 1.65, color: BR.ink }}>
              <div style={{ marginBottom: 8 }}>Dear 生管 &amp; 採購,</div>
              <div style={{ marginBottom: 8 }}>
                溢交金額佔訂單金額 <b>10%</b>（10% 以內可直接執行訂單），
                <mark style={{ background: "#fff3a0", padding: "0 3px" }}>請執行訂單。</mark>
              </div>
              <div style={{ marginBottom: 8 }}>
                請採購說明 <b style={{ fontFamily: FONT_MONO, color: BR.purple }}>{TARGET.partNo}</b>　廠商需
                <b style={{ color: BR.red }}> 10 週交貨</b>，
                生產跟運輸各別是多少時間，請檢視其合理性，可有更早交進的機會？並提出未來應對方法。
              </div>
              <div style={{ color: BR.inkSoft, fontSize: 11, marginTop: 12 }}>
                祺驊股份有限公司 · CHI HUA FITNESS CO., LTD.<br />
                營業中心 徐慧玲 Monica Hsu
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>
                痛點 vs 世界級做法
              </span>
            </div>

            <div className="rounded-[10px] p-3 mb-3" style={{ background: BR.redSoft, border: `1px solid ${BR.red}30` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BR.red, marginBottom: 6 }}>傳統做法（答案會落很久）</div>
              <div className="flex flex-wrap items-center gap-1 text-xs" style={{ color: BR.ink }}>
                {["業務", "PM (工管中心)", "生管 (生原科)", "採購 (供應商確認)", "工管/門市", "回覆業務"].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-1">
                    <span style={{ background: "#fff", border: `1px solid ${BR.red}40`, padding: "3px 8px", borderRadius: 5, fontWeight: 600 }}>{s}</span>
                    {i < arr.length - 1 && <span style={{ color: BR.red }}>→</span>}
                  </span>
                ))}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: BR.red, marginTop: 8 }}>
                耗時：3–5 個工作天
              </div>
            </div>

            <div className="rounded-[10px] p-3" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BR.greenInk, marginBottom: 6 }}>世界級做法 · AI Lead Time Validation Engine</div>
              <div style={{ fontSize: 12, color: BR.greenDeep, lineHeight: 1.65 }}>
                收到 email → <b>OS 自動拆 BOM</b> → 抓各元件交期 → 推合理交期區間 →
                <b style={{ color: BR.greenInk }}> 系統直接回信，5 分鐘內</b>。
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: BR.greenInk, marginTop: 8 }}>
                耗時：&lt; 5 分鐘
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b" style={{ borderColor: BR.border }}>
          {[
            { k: "pipeline", label: "4-Step Pipeline · 推算流程" },
            { k: "score",    label: "Supplier Score · 是否能換供應商" },
            { k: "arch",     label: "System Architecture · 整體配置" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setActiveTab(t.k as "pipeline" | "score" | "arch")}
              style={{
                padding: "10px 16px", fontSize: 13, fontWeight: activeTab === t.k ? 700 : 500,
                color: activeTab === t.k ? BR.greenInk : BR.inkSoft,
                borderBottom: `3px solid ${activeTab === t.k ? BR.green : "transparent"}`,
                background: "transparent", cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "pipeline" && (
          <>
            {/* STEP 1 */}
            <StepHeader badge="STEP 1" title="自動抓取" en="ERP auto-lookup · BOM / 件數 / 結構" desc={`找到 ${TARGET.partNo} 的 BOM 並抽出全部元件`} />
            <Card>
              <div className="grid lg:grid-cols-[280px,1fr] gap-5">
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ① ERP 查料
                  </div>
                  <div className="rounded-[10px] p-3 mb-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                    <div style={{ fontSize: 10, color: BR.inkFaint }}>料號</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 800, color: BR.greenDeep }}>
                      {TARGET.partNo}
                    </div>
                    <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 2 }}>客戶 · {TARGET.customer}</div>
                  </div>

                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>
                    ② AI 抓到三件資料
                  </div>
                  {[
                    { k: "BOM",             note: "v2.4 · 7 元件" },
                    { k: "件數結構",        note: "電源板 / PCB / 連接器 ..." },
                    { k: "Lead Time Index", note: "各元件平均交期" },
                  ].map((x) => (
                    <div key={x.k} className="rounded-[8px] p-2.5 mb-2 flex items-baseline gap-2" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: BR.greenDeep, minWidth: 120 }}>{x.k}</span>
                      <span style={{ fontSize: 11, color: BR.greenDeep }}>{x.note}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ③ {TARGET.partNo} 的 BOM · 7 元件 + 平均交期
                  </div>
                  <div className="space-y-2">
                    {BOM_ROW.map((b) => (
                      <div key={b.k} className="flex items-center gap-3 rounded-[10px] p-3" style={{
                        background: b.hot ? "#fff7f5" : "#fbfcfa",
                        border: `1px solid ${b.hot ? "#f3c4bd" : BR.border}`,
                      }}>
                        <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: BR.ink, width: 130 }}>{b.k}</span>
                        <div className="flex-1" style={{ height: 8, background: "#eef0ea", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${b.pct * 4}%`, background: b.hot ? BR.red : BR.greenDeep, opacity: 0.85 }} />
                        </div>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: b.hot ? BR.red : BR.greenDeep, width: 38, textAlign: "right" }}>
                          {b.pct}%
                        </span>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: b.leadDays >= 30 ? BR.red : b.leadDays >= 14 ? BR.amber : BR.greenDeep, width: 56, textAlign: "right" }}>
                          {b.leadDays} 天
                        </span>
                        {b.hot && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: "#fff", background: BR.red, padding: "2px 6px", borderRadius: 4 }}>▲ 關鍵路徑</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* STEP 2 */}
            <StepHeader badge="STEP 2" title="BOM 展開" en="Decompose lead time by segment" desc="這 70 天到底花在哪？" />
            <Card>
              <div className="grid lg:grid-cols-2 gap-5">
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ① 主要交期段（含並行考量）
                  </div>
                  <div className="space-y-2">
                    {SEGMENTS.map((s) => (
                      <div key={s.stage} className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                        <div className="flex items-baseline justify-between">
                          <span style={{ fontSize: 13, fontWeight: 700, color: BR.ink }}>{s.stage}</span>
                          <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800, color: s.tone }}>
                            {s.days} 天
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 3 }}>{s.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ② 關鍵路徑視覺化
                  </div>
                  <div className="rounded-[10px] p-4" style={{ background: BR.greenInk, color: "#fff" }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", marginBottom: 10, letterSpacing: "0.08em" }}>
                      CRITICAL PATH（最長段決定整體交期）
                    </div>
                    {SEGMENTS.map((s) => (
                      <div key={s.stage} className="mb-2">
                        <div className="flex items-baseline justify-between" style={{ fontSize: 11 }}>
                          <span style={{ color: "#dfe5d8" }}>{s.stage}</span>
                          <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: s.tone === BR.red ? "#ff8a7a" : "#fff" }}>{s.days}d</span>
                        </div>
                        <div style={{ height: 7, background: "rgba(255,255,255,.1)", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
                          <div style={{ height: "100%", width: `${(s.days / 50) * 100}%`, background: s.tone, opacity: 0.9 }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,.15)" }}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span style={{ color: "#9aa78d" }}>關鍵路徑長度</span>
                        <span style={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: 22, color: BR.green }}>
                          47 天
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "#9aa78d", marginTop: 4 }}>
                        = 電源板 42 天 + 末段 5 天（其餘可並行）
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* STEP 3 */}
            <StepHeader badge="STEP 3" title="比對供應商說的" en="Vendor's 70 days vs AI's breakdown" desc="供應商說 10 週 — 但內含什麼？" />
            <Card>
              <div className="grid lg:grid-cols-2 gap-5">
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ① 供應商版（簡化）
                  </div>
                  <div className="rounded-[10px] p-4 mb-3" style={{ background: BR.redSoft, border: `1px solid ${BR.red}40` }}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span style={{ fontSize: 13, color: BR.inkSoft }}>廠商需求總交期</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 800, color: BR.red }}>
                        70 天
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: BR.inkSoft }}>= {TARGET.vendorClaimWeeks} 週</div>
                  </div>

                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>
                    ② AI 反推這 70 天的組成
                  </div>
                  <div className="space-y-1.5">
                    {VENDOR_BREAKDOWN.parts.map((p) => (
                      <div key={p.k} className="flex items-center gap-3 text-sm">
                        <span style={{ width: 80, color: BR.inkSoft }}>{p.k}</span>
                        <div className="flex-1" style={{ height: 7, background: "#eef0ea", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(p.days / 35) * 100}%`, background: p.color, opacity: 0.9 }} />
                        </div>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: p.color, width: 50, textAlign: "right" }}>
                          {p.days} 天
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2" style={{ fontSize: 11, color: BR.inkSoft }}>
                    AI 觀察：原料準備 28 天 + 生產 21 天 + QC 7 天 + 海運 14 天，但若提前備料則可省 14 天。
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
                    ③ AI 版（依 BOM 並行重算）
                  </div>
                  <div className="rounded-[10px] p-4 mb-3" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span style={{ fontSize: 13, color: BR.greenDeep }}>AI 合理交期區間</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 800, color: BR.greenInk }}>
                        {reasonableLow}–{reasonableHigh} 天
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: BR.greenDeep }}>≈ 6.3–7.1 週（並行 + 提前備料）</div>
                  </div>

                  <div className="rounded-[10px] p-4" style={{ border: `2px solid ${status.tone}`, background: `${status.tone}08` }}>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700, color: status.tone, marginBottom: 8 }}>
                      {status.label}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span style={{ color: BR.inkSoft }}>合理上限</span>
                        <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>{reasonableHigh} 天</span></div>
                      <div className="flex justify-between"><span style={{ color: BR.inkSoft }}>廠商要求</span>
                        <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>{TARGET.vendorClaimDays} 天</span></div>
                      <div className="flex justify-between pt-2 border-t" style={{ borderColor: `${status.tone}30` }}>
                        <span style={{ color: BR.inkSoft }}>超出</span>
                        <span style={{ fontFamily: FONT_MONO, fontWeight: 800, color: status.tone, fontSize: 16 }}>
                          +{excessDays} 天（≈ {(excessDays / 7).toFixed(1)} 週）
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* STEP 4 — 自動產出結論 + 系統直接回信 */}
            <StepHeader badge="STEP 4" title="自動產出結論 · 系統直接回覆" en="Auto-respond email (system reply)" desc="不再經 5 個人手 — OS 直接回信 5 分鐘內" tone={BR.purple} />
            <Card style={{ background: "#fbfcfa", borderColor: BR.greenLine, borderWidth: 2 }}>
              <div className="flex items-baseline gap-3 flex-wrap mb-3">
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                  color: "#fff", background: BR.purple, padding: "4px 9px", borderRadius: 5,
                }}>AUTO-REPLY</span>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700 }}>系統自動產出的回信內容</h3>
                <span className="flex-1" />
                <button style={{
                  background: BR.green, color: "#fff", border: "none", borderRadius: 8,
                  padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>📨 直接寄出</button>
              </div>

              <div className="rounded-[10px] p-5" style={{
                background: "#fff",
                border: `1px solid ${BR.border}`,
                fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
                fontSize: 13,
                lineHeight: 1.75,
                color: BR.ink,
              }}>
                <div style={{ marginBottom: 12 }}>Dear 生管 &amp; 採購（cc: Monica 業務中心）,</div>

                <div style={{ marginBottom: 10 }}>
                  關於 <b style={{ fontFamily: FONT_MONO, color: BR.purple }}>{TARGET.partNo}</b> 廠商需求交期
                  <b> {TARGET.vendorClaimWeeks} 週（{TARGET.vendorClaimDays} 天）</b>，
                  系統檢視該交期 / BOM 展開推算內合理交期分布如下：
                </div>

                <ul style={{ paddingLeft: 24, marginBottom: 14 }}>
                  <li>電源板（含外殼）：<b>42 天</b>（關鍵路徑）</li>
                  <li>PCB 製版：<b>32 天</b>（可與電源板並行）</li>
                  <li>連接器：<b>28 天</b>（USB-C 缺貨潮，可考慮替代型號）</li>
                  <li>包裝 / 組裝 / 出貨：<b>5 天</b></li>
                </ul>

                <div style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <b style={{ color: BR.greenInk }}>AI 算出合理交期：{reasonableLow}–{reasonableHigh} 天</b>
                  <span style={{ marginLeft: 8, color: BR.greenDeep }}>（並行作業 + 提前備料）</span><br />
                  廠商交期 {TARGET.vendorClaimDays} 天 − 合理上限 {reasonableHigh} 天 =
                  <b style={{ color: BR.red, marginLeft: 4 }}>多出 {excessDays} 天（≈ {(excessDays / 7).toFixed(1)} 週）</b>
                </div>

                <div style={{ marginBottom: 8, fontWeight: 700 }}>建議重點請求（縮短交期）：</div>
                <ol style={{ paddingLeft: 24, marginBottom: 14 }}>
                  <li>啟用備案供應商（Hua Cheng 平均 52 天）</li>
                  <li>拆單交貨（先交一半、後段補出）</li>
                  <li>包裝 / 組裝可同時併行（節省 3–5 天）</li>
                  <li>緊急生產線安排（廠商加開 1 條 SMT 線）</li>
                </ol>

                <div style={{ marginBottom: 14 }}>
                  <b>未來應對方法：</b>緊急情況請追蹤 — 對此料號要求供應商
                  <b style={{ color: BR.purple }}> 提前 50 天以上下單</b>，以避免高週期被動受迫。
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: BR.inkSoft }}>給供應商建議遵循率歷史：</span>
                  <b style={{ color: BR.greenDeep }}> 88%</b>
                </div>

                <div style={{ borderTop: `1px solid ${BR.border}`, paddingTop: 12, marginTop: 18, fontSize: 11, color: BR.inkSoft, fontFamily: FONT }}>
                  此為 CHI HUA AI Supply Chain OS · L2 Lead Time Validation Engine 自動產出。<br />
                  AI 信心 89% · 資料來源：ERP BOM v2.4 · 供應商 Lead Time Index · LME 銅、IC 缺貨指數。
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {["📑 附上 BOM 拆解 PDF", "👥 同步通知 PM", "🔁 啟動備案供應商評估", "⚠ 建立緊急訂單"].map((b) => (
                  <button key={b} style={{
                    background: "#fff", color: BR.greenDeep,
                    border: `1px solid ${BR.greenLine}`, borderRadius: 8,
                    padding: "9px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                  }}>
                    {b}
                  </button>
                ))}
              </div>
            </Card>

            {/* Analyze 總結 */}
            <Card style={{ background: BR.greenInk, color: "#fff" }}>
              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#fff", background: BR.green, padding: "4px 9px", borderRadius: 5 }}>
                  ANALYZE
                </span>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700 }}>整體結論</h3>
                <span className="flex-1" />
                <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 800, color: BR.green }}>
                  超出 {excessDays} 天 ≈ {(excessDays / 7).toFixed(1)} 週
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { k: "關鍵路徑", v: "電源板（42 天）", note: "佔總交期 90%" },
                  { k: "可省區間", v: `${excessDays} 天`,   note: "並行 + 替代料 + 加單" },
                  { k: "AI 信心",  v: "89%",                note: "依過去交期實績推估" },
                ].map((x) => (
                  <div key={x.k} style={{ background: "rgba(255,255,255,.06)", border: `1px solid rgba(255,255,255,.12)`, borderRadius: 11, padding: "14px 16px" }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", letterSpacing: "0.1em" }}>{x.k}</div>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: BR.green, marginTop: 6 }}>{x.v}</div>
                    <div style={{ fontSize: 11, color: "#aebba0", marginTop: 4 }}>{x.note}</div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {activeTab === "score" && (
          <>
            <StepHeader badge="進一步" title="供應商可換嗎？ · Supplier Score" en="Vendor Scoring Engine" desc="依交期準確率、良率、出口、產能算總分" />
            <Card>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>Supplier Score · {TARGET.partNo} 適配供應商</h3>
                <span className="flex-1" />
                <Pill text="多目標評分" tone="green" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
                      {["供應商", "交期準確率", "不良率", "平均交期", "產能利用率", "綜合評分", "建議"].map((h, i) => (
                        <th key={h} style={{
                          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                          color: BR.inkFaint, textAlign: i === 0 || i === 6 ? "left" : "right",
                          padding: "10px 8px",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SUPPLIER_SCORES.map((s, i) => {
                      const recommend = s.overall >= 85 ? { label: "✓ 啟用備案", tone: BR.greenDeep }
                                       : s.overall >= 80 ? { label: "可評估", tone: BR.amber }
                                                         : { label: "現任 · 觀察", tone: BR.red };
                      return (
                        <tr key={s.name} style={{ borderBottom: `1px solid #f3f5ef`, background: i === 0 ? BR.redSoft : "transparent" }}>
                          <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                            {s.name}
                            {i === 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 9, marginLeft: 6, color: "#fff", background: BR.red, padding: "1px 5px", borderRadius: 3 }}>NOW</span>}
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: s.onTime >= 80 ? BR.greenDeep : s.onTime >= 70 ? BR.amber : BR.red }}>
                            {s.onTime}%
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: s.defects <= 0.5 ? BR.greenDeep : BR.amber }}>
                            {s.defects.toFixed(1)}%
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: s.leadAvg <= 55 ? BR.greenDeep : s.leadAvg <= 65 ? BR.amber : BR.red }}>
                            {s.leadAvg} 天
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.inkSoft }}>
                            {s.capacity}%
                          </td>
                          <td style={{ padding: "12px 8px", textAlign: "right" }}>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 800, color: s.overall >= 85 ? BR.greenDeep : s.overall >= 80 ? BR.amber : BR.red }}>
                              {s.overall}
                            </span>
                            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint }}> / 100</span>
                          </td>
                          <td style={{ padding: "12px 8px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: recommend.tone, padding: "3px 8px", borderRadius: 5, background: `${recommend.tone}15` }}>
                              {recommend.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-[10px] p-3 text-xs" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, color: "#3c4a2e" }}>
                <b style={{ color: BR.greenInk }}>✦ AI 觀察</b> · 現任 AGI #1 綜合 71 分（交期準確率 56% 是最大短板）。
                <b style={{ color: BR.greenDeep }}> Hua Cheng（89）與新竹昌晟（84）為最佳替代候選</b>，
                可平均把 70 天交期壓至 52–55 天區間。
              </div>
            </Card>
          </>
        )}

        {activeTab === "arch" && (
          <>
            <StepHeader badge="ARCH" title="這個 Engine 在系統中的位置" en="Where this engine sits inside the OS" desc="L2 是 Lead Time，L3 是 Price — 同一個 Should-Cost 思路，兩個切面" />
            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { layer: "L2 OPERATIONS", title: "AI Lead Time Validation", desc: "本頁 — 業務 / 生管 / 採購 收到交期問題時 OS 直接回信", tone: BR.green, here: true, href: "/erp/lead-time-validation" },
                { layer: "L3 PROCUREMENT", title: "AI Quotation Analyzer", desc: "收到漲價報價時 OS 直接拆 Should-Cost + 算議價空間", tone: BR.greenDeep, href: "/erp/quotation-analyzer" },
                { layer: "L4 AI ENGINE",  title: "Delivery Prediction Engine", desc: "預測未來各供應商各料號交期波動（規劃中）", tone: BR.amber },
              ].map((m) => (
                <div key={m.title} className="rounded-[14px]" style={{
                  background: BR.card, border: `2px solid ${m.here ? m.tone : BR.border}`,
                  padding: "18px 20px",
                }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: m.tone, letterSpacing: "0.12em" }}>
                    {m.layer}
                  </div>
                  <h3 style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700, marginTop: 4, color: BR.ink }}>
                    {m.title}
                    {m.here && <span style={{ fontFamily: FONT_MONO, fontSize: 9, marginLeft: 6, color: "#fff", background: m.tone, padding: "2px 6px", borderRadius: 4 }}>YOU ARE HERE</span>}
                  </h3>
                  <p style={{ fontSize: 12, color: BR.inkSoft, marginTop: 6, lineHeight: 1.6 }}>{m.desc}</p>
                  {m.href && !m.here && (
                    <Link href={m.href} style={{ fontSize: 12, color: BR.greenDeep, fontWeight: 700, marginTop: 8, display: "inline-block" }}>
                      → 進入該模組
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <Card>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 12 }}>
                這套 OS 還能接什麼來提升答客戶問的能力
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { k: "物料管", v: "MRP / 庫存接 ERP" },
                  { k: "全網系統", v: "客戶端 EDI / 訂單流" },
                  { k: "物流 / 海關", v: "BL / Shipping Track" },
                  { k: "出貨網", v: "成品 → 客戶端" },
                ].map((b) => (
                  <div key={b.k} className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: BR.ink }}>{b.k}</div>
                    <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 2 }}>{b.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t" style={{ borderColor: BR.border }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 10 }}>
                  下一步可加 3 個（規劃中）
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { rk: "01", k: "AI 給供應商評分", v: "本頁 Supplier Score 升級為可調權重的多目標模型" },
                    { rk: "02", k: "包裝 / 業務協同", v: "業務確認交期同時自動拉 PM / 物流" },
                    { rk: "03", k: "AI 預測通報",      v: "事前推送交期風險，不等業務問才知道" },
                  ].map((b) => (
                    <div key={b.rk} className="rounded-[10px] p-3" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}` }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: BR.greenDeep }}>{b.rk}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: BR.greenInk, marginTop: 4 }}>{b.k}</div>
                      <div style={{ fontSize: 11, color: BR.greenDeep, marginTop: 4, lineHeight: 1.5 }}>{b.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}

        <footer className="flex items-center gap-5 flex-wrap pt-4" style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint,
        }}>
          <span style={{ color: BR.greenDeep, fontWeight: 600 }}>● AI Confidence 89%</span>
          <Link href="/erp/quotation-analyzer" style={{ color: BR.greenDeep, textDecoration: "underline" }}>姊妹模組 → AI Quotation Analyzer (L3)</Link>
          <Link href="/erp/operations" style={{ color: BR.greenDeep, textDecoration: "underline" }}>← 回 L2 工單作戰中心</Link>
          <span className="flex-1" />
          <span>CHI HUA AI · L2 · AI Lead Time Validation Engine · /erp/lead-time-validation</span>
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
      }}>{badge}</span>
      <h2 style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700 }}>{title}</h2>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>{en}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: BR.inkSoft }}>{desc}</span>
    </div>
  );
}

// ============================================================
// AI 對話框 — 依問題類型給不同最佳解答
// ============================================================

type ChatAnswer = {
  intent: string;
  tone: "green" | "amber" | "red" | "purple" | "blue";
  headline: string;
  bullets: { k: string; v: string }[];
  conclusion: string;
  confidence: number;
};

const PRESET_QUESTIONS = [
  "10 週交期合不合理？",
  "可以更早交貨嗎？",
  "要不要換供應商？",
  "風險在哪裡？",
  "未來怎麼避免再發生？",
];

function answerEngine(q: string, ctx: {
  partNo: string;
  vendorClaimDays: number;
  aiLow: number; aiHigh: number; midpoint: number;
  excessDays: number;
}): ChatAnswer {
  const s = q.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => s.includes(k.toLowerCase()));

  // Intent 1: 交期合理性
  if (has("合不合理", "合理", "10 週", "10週", "10周", "幾週", "幾天", "幾天", "幾日", "多久")) {
    return {
      intent: "交期合理性",
      tone: "amber",
      headline: `廠商報 ${ctx.vendorClaimDays} 天 vs AI 推估合理區間 ${ctx.aiLow}–${ctx.aiHigh} 天 — 偏長 ${ctx.excessDays} 天`,
      bullets: [
        { k: "關鍵路徑", v: "電源板 42 天 + 末段組裝 5 天 = 47 天" },
        { k: "可並行段", v: "PCB / 連接器 / 風扇可與電源板同時製造" },
        { k: "廠商虛報段", v: `溢出 ${ctx.excessDays} 天，多在「原料準備」段` },
        { k: "建議交期", v: `${ctx.aiLow}–${ctx.aiHigh} 天（中位 ${ctx.midpoint}）` },
      ],
      conclusion: `回覆業務：交期偏長，建議要求廠商重新評估到 ${ctx.aiHigh} 天內。`,
      confidence: 92,
    };
  }

  // Intent 2: 更早交貨 / 加速
  if (has("更早", "加速", "更快", "縮短", "提前", "趕")) {
    return {
      intent: "縮短交期",
      tone: "green",
      headline: `透過 3 招可從 ${ctx.vendorClaimDays} 天縮短到約 ${ctx.aiLow} 天（省 ${ctx.vendorClaimDays - ctx.aiLow} 天）`,
      bullets: [
        { k: "招 1 · 並行作業", v: "PCB + 連接器 + 電源板 同時備料（省 14 天）" },
        { k: "招 2 · 安全庫存", v: "USB-C / IC 拉高安全庫存，避免缺貨潮（省 7 天）" },
        { k: "招 3 · 改空運", v: "海運 14 天 → 空運 3 天（省 11 天，成本 +5%）" },
        { k: "代價評估", v: "招 1+2 免加成本；招 3 需加 5% 物流費" },
      ],
      conclusion: `可行：建議優先採用「並行作業 + 安全庫存」，可達到 ${ctx.aiLow} 天且不加成本。`,
      confidence: 88,
    };
  }

  // Intent 3: 換供應商
  if (has("換供應商", "供應商", "別家", "其他廠商", "備援", "二供")) {
    return {
      intent: "供應商評估",
      tone: "purple",
      headline: "Hua Cheng (89 分) 與 新竹昌晟 (84 分) 均優於現任 AGI #1 (71 分)",
      bullets: [
        { k: "現任 AGI #1", v: "OTD 56% · 不良 1.0% · 平均 70 天 · 總分 71" },
        { k: "Hua Cheng", v: "OTD 88% · 不良 0.3% · 平均 52 天 · 總分 89 ★ 推薦" },
        { k: "新竹昌晟", v: "OTD 80% · 不良 0.6% · 平均 55 天 · 總分 84" },
        { k: "切換成本", v: "需 3 個月驗證 + 首批小量試產（建議雙軌進行）" },
      ],
      conclusion: "建議：保留 AGI #1 為現役、Hua Cheng 啟動驗證流程作為主力替代。",
      confidence: 85,
    };
  }

  // Intent 4: 風險
  if (has("風險", "缺貨", "斷料", "問題", "issue", "風險點")) {
    return {
      intent: "風險評估",
      tone: "red",
      headline: "3 大風險點：原料波動 / 單一供應商 / 物流瓶頸",
      bullets: [
        { k: "原料風險", v: "USB-C / 電源 IC 全球缺貨潮持續，預估再持續 6 個月" },
        { k: "供應商集中度", v: "AGI #1 承擔 78% 量，無 backup → 出事就全停" },
        { k: "海運壅塞", v: "上海港高峰季可能再多 7–14 天" },
        { k: "客戶交期罰款", v: "若超交 10% 以上將觸發 OEM 客戶罰款條款" },
      ],
      conclusion: "急迫：本週啟動「二供導入」+ 「USB-C 安全庫存提升」雙路並行。",
      confidence: 90,
    };
  }

  // Intent 5: 未來應對 / SOP
  if (has("未來", "應對", "避免", "sop", "標準", "預防", "下次")) {
    return {
      intent: "未來應對方法",
      tone: "blue",
      headline: "建立「Lead Time Validation」流程，業務 email 5 分鐘內自動回覆",
      bullets: [
        { k: "前置 1 · BOM 主檔", v: "所有料號的 BOM 與元件交期上鏈到 MDM 主檔" },
        { k: "前置 2 · 元件 LT 指數", v: "每月更新各元件平均交期（API 抓供應商資料）" },
        { k: "流程 · AI 自動回信", v: "email 觸發 → OS 拆 BOM → 5 分鐘內回覆業務" },
        { k: "監控 · 預警通報", v: "AI 偵測交期異常自動 push 給採購、生管、業務" },
      ],
      conclusion: "建議：3 個月內導入此 SOP，回覆時間從 3-5 天 → 5 分鐘。",
      confidence: 87,
    };
  }

  // 預設：fallback
  return {
    intent: "AI 綜合分析",
    tone: "green",
    headline: `針對 ${ctx.partNo} 的綜合判斷`,
    bullets: [
      { k: "交期評估", v: `廠商 ${ctx.vendorClaimDays} 天 vs AI 建議 ${ctx.aiLow}–${ctx.aiHigh} 天` },
      { k: "可優化空間", v: `${ctx.excessDays} 天（並行 + 安全庫存可解）` },
      { k: "供應商建議", v: "Hua Cheng 評分最高，可啟動驗證" },
      { k: "風險提醒", v: "USB-C 缺貨潮 + 單一供應商集中度過高" },
    ],
    conclusion: "更具體的問題請點上方建議問題，或描述業務情境。",
    confidence: 80,
  };
}

function AIChatBox({
  query, setQuery, answer, setAnswer, thinking, setThinking, target, ai, excessDays,
}: {
  query: string; setQuery: (s: string) => void;
  answer: ChatAnswer | null; setAnswer: (a: ChatAnswer | null) => void;
  thinking: boolean; setThinking: (b: boolean) => void;
  target: { partNo: string; vendorClaimDays: number };
  ai: { aiLow: number; aiHigh: number; midpoint: number };
  excessDays: number;
}) {
  function submit(q: string) {
    if (!q.trim()) return;
    setThinking(true);
    setAnswer(null);
    setTimeout(() => {
      const a = answerEngine(q, {
        partNo: target.partNo,
        vendorClaimDays: target.vendorClaimDays,
        aiLow: ai.aiLow, aiHigh: ai.aiHigh, midpoint: ai.midpoint,
        excessDays,
      });
      setAnswer(a);
      setThinking(false);
    }, 600);
  }

  const toneMap: Record<ChatAnswer["tone"], { bg: string; border: string; head: string; text: string }> = {
    green:  { bg: BR.greenSoft, border: BR.greenLine, head: BR.greenInk, text: BR.greenDeep },
    amber:  { bg: BR.amberSoft, border: "#f3e1b8",    head: BR.amber,    text: BR.amber },
    red:    { bg: BR.redSoft,   border: "#f5c2c0",    head: BR.red,      text: BR.red },
    purple: { bg: "#fdf4ff",    border: "#f5d0fe",    head: BR.purple,   text: BR.purple },
    blue:   { bg: "#eff6fc",    border: "#cfe0ee",    head: BR.blue,     text: BR.blue },
  };
  const T = answer ? toneMap[answer.tone] : toneMap.green;

  return (
    <Card>
      <div className="flex items-baseline gap-2 mb-3 flex-wrap">
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: "#fff", background: BR.purple, padding: "4px 9px", borderRadius: 5,
        }}>
          AI · ASK ANYTHING
        </span>
        <span style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700 }}>
          💬 直接問 AI — 不同問題給不同最佳解答
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint }}>
          5 種預設情境 · 業務／生管／採購／工管／高層通用
        </span>
      </div>

      {/* 輸入框 */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(query); }}
          placeholder={`針對 ${target.partNo}，問 AI 任何問題（如：10 週合理嗎？能更快嗎？要換供應商嗎？）`}
          style={{
            flex: 1, padding: "11px 14px", fontSize: 13, fontFamily: FONT,
            border: `1.5px solid ${BR.borderHi}`, borderRadius: 10,
            background: "#fff", color: BR.ink, outline: "none",
          }}
        />
        <button
          onClick={() => submit(query)}
          disabled={thinking || !query.trim()}
          style={{
            padding: "11px 22px", fontSize: 13, fontWeight: 700, fontFamily: FONT,
            color: "#fff", background: thinking || !query.trim() ? BR.inkFaint : BR.greenInk,
            border: "none", borderRadius: 10, cursor: thinking || !query.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {thinking ? "AI 思考中…" : "問 AI →"}
        </button>
      </div>

      {/* 建議問題（chip 列） */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => { setQuery(q); submit(q); }}
            disabled={thinking}
            style={{
              padding: "6px 12px", fontSize: 11.5, fontFamily: FONT, fontWeight: 600,
              color: BR.greenDeep, background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
              borderRadius: 99, cursor: thinking ? "not-allowed" : "pointer",
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* AI 回答 */}
      {thinking && (
        <div className="rounded-[10px] p-4" style={{
          background: "#fbfcfa", border: `1px dashed ${BR.borderHi}`, color: BR.inkSoft, fontSize: 12,
        }}>
          <span style={{ fontFamily: FONT_MONO }}>● ● ● </span>
          AI 正在拆 BOM、查元件、推交期、比對供應商評分中…
        </div>
      )}

      {answer && !thinking && (
        <div className="rounded-[12px] p-4" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#fff", background: T.head, padding: "3px 9px", borderRadius: 5,
            }}>
              {answer.intent}
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: T.text }}>
              AI Confidence {answer.confidence}%
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.head, marginBottom: 10, lineHeight: 1.5 }}>
            {answer.headline}
          </div>
          <div className="space-y-2 mb-3">
            {answer.bullets.map((b) => (
              <div key={b.k} className="flex items-baseline gap-3" style={{ fontSize: 12, lineHeight: 1.55 }}>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, color: T.text,
                  minWidth: 110, letterSpacing: "0.03em",
                }}>
                  {b.k}
                </span>
                <span style={{ color: BR.ink, flex: 1 }}>{b.v}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 mt-2 border-t" style={{ borderColor: T.border }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: T.text, letterSpacing: "0.06em", marginBottom: 4 }}>
              建議行動
            </div>
            <div style={{ fontSize: 12.5, color: BR.ink, fontWeight: 600, lineHeight: 1.55 }}>
              {answer.conclusion}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function Pill({ text, tone }: { text: string; tone: "green" | "amber" | "purple" | "ink" }) {
  const bg = tone === "green" ? BR.greenSoft : tone === "amber" ? BR.amberSoft : tone === "purple" ? "#fdf4ff" : BR.greenInk;
  const fg = tone === "green" ? BR.greenDeep : tone === "amber" ? BR.amber : tone === "purple" ? BR.purple : "#fff";
  const br = tone === "green" ? BR.greenLine : tone === "amber" ? "#f3e1b8" : tone === "purple" ? "#f5d0fe" : BR.greenInk;
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      color: fg, background: bg, border: `1px solid ${br}`,
      padding: "4px 9px", borderRadius: 7, whiteSpace: "nowrap",
    }}>{text}</span>
  );
}
