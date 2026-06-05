"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";

// ============================================================
// CHI HUA AI · L5 FINAL — Profit Defense Center
// 7 階段管線：Commodity Intelligence → Cost Breakdown → Impact Explosion
//   → Profit Simulation → Recovery Optimization → Supplier Validation
//   → Action Recommendation
// 配色：Bright theme（NVIDIA-green keynote style）
// ============================================================

const BR = {
  green:      "#76b900",
  greenDeep:  "#4d7c0f",
  greenInk:   "#0c1908",
  greenSoft:  "#f0f7e4",
  greenLine:  "#dcebc4",
  ink:        "#0c1208",
  inkSoft:    "#5b6356",
  inkFaint:   "#9aa291",
  page:       "#fbfcfa",
  card:       "#ffffff",
  border:     "#e9ece3",
  borderHi:   "#dadfd0",
  red:        "#d4351c",
  redSoft:    "#fdecea",
  amber:      "#b8860b",
  amberSoft:  "#fffaf0",
  purple:     "#c026d3",
} as const;

const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";
const FONT_HEAD = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

// ─── Pipeline stages（最終版 · 11 階段） ───
const STAGES = [
  { i: "01", k: "Commodity Radar",        zh: "商品雷達"     },
  { i: "02", k: "Market Benchmark",       zh: "市場對標"     },
  { i: "03", k: "Product Exposure",       zh: "產品曝險"     },
  { i: "04", k: "Cost Explosion Tree",    zh: "成本爆炸樹"   },
  { i: "05", k: "Impact Explosion Tree",  zh: "影響爆炸樹"   },
  { i: "06", k: "Supplier Exposure",      zh: "供應商曝險"   },
  { i: "07", k: "Price Validation",       zh: "漲價合理性"   },
  { i: "08", k: "Profit Waterfall",       zh: "毛利瀑布"     },
  { i: "09", k: "AI Recovery",            zh: "AI 救援"       },
  { i: "10", k: "Buy Signal",             zh: "買賣訊號"     },
  { i: "11", k: "Executive Brief",        zh: "高層摘要"     },
];

// ─── Commodity strip ───
const METRICS = [
  { name: "銅",   en: "COPPER",    price: "$9.47k", unit: "/MT", chg: "+7.6%", up: true,  fill: 90, status: "提前備料 45 天", statusLabel: "150%", statusTone: BR.greenDeep },
  { name: "鋼",   en: "STEEL",     price: "$1.10k", unit: "/MT", chg: "−0.8%", up: false, fill: 100, status: "安全庫存",       statusLabel: "正常", statusTone: BR.greenDeep },
  { name: "鋁",   en: "ALUMINUM",  price: "$2.60k", unit: "/MT", chg: "−7.5%", up: false, fill: 95, status: "庫存備料",       statusLabel: "充足", statusTone: BR.greenDeep },
  { name: "塑料", en: "PLASTIC",   price: "$1.39k", unit: "/MT", chg: "+8.1%", up: true,  fill: 32, status: "需求鎖定上升",   statusLabel: "低水位", statusTone: BR.red },
  { name: "生鐵", en: "PIG IRON",  price: "$26.8k", unit: "/MT", chg: "+7.7%", up: true,  fill: 70, status: "庫存水平",       statusLabel: "弱化中", statusTone: BR.amber },
];

// ─── Profit cascade (CEO 只想知道一件事) ───
const CASCADE = [
  { label: "預估營收影響", value: "NT$ 12 億",  tone: BR.ink,        desc: "原物料波動波及之專案營收" },
  { op: "−" },
  { label: "預估毛利影響", value: "−455 萬",     tone: BR.red,        desc: "成本上升直接侵蝕毛利" },
  { op: "+" },
  { label: "AI 可救回",     value: "+158 萬",     tone: BR.greenDeep,  desc: "Copilot 三策略合計回收" },
  { op: "=" },
  { label: "最終淨衝擊",   value: "−297 萬",     tone: BR.red,        desc: "執行 AI 建議後的真實淨損", final: true },
];

// ─── Product Cost Digital Twin ───
type TreeN = { name: string; cost: string; pct: number; hot?: boolean; mat?: "cu" | "fe" | "none"; children?: TreeN[] };
type Product = {
  key: string; label: string; en: string; margin: string; total: string; tag: string; neg: boolean;
  aiNote: string; tree: TreeN[];
};
const PRODUCTS: Product[] = [
  {
    key: "elliptical", label: "橢圓機", en: "Elliptical", margin: "13.2%", total: "2,430 萬", tag: "−320 萬", neg: true,
    aiNote: "橢圓機毛利 13.2% 為產品線最低。成本集中於 Drive Assy（58%），其中銅線圈單項佔整機 48%。銅 +5% 經 Motor 節點放大 → 整機 +0.31%、毛利掉至 12.4%。",
    tree: [
      { name: "Frame 機架", cost: "35 萬", pct: 14, mat: "fe", children: [
        { name: "Steel 鋼板", cost: "28 萬", pct: 11, mat: "fe" },
        { name: "Wiring 線材", cost: "7 萬",  pct: 3, mat: "cu", hot: true },
      ]},
      { name: "Drive Assy 驅動模組", cost: "142 萬", pct: 58, hot: true, children: [
        { name: "Motor 馬達", cost: "138 萬", pct: 56, hot: true, children: [
          { name: "Copper 銅線圈", cost: "118 萬", pct: 48, mat: "cu", hot: true },
          { name: "Magnet 磁鐵", cost: "20 萬", pct: 8, mat: "none" },
        ]},
        { name: "Bearing 軸承", cost: "4 萬", pct: 2, mat: "none" },
      ]},
      { name: "Console 控制台", cost: "48 萬", pct: 20, children: [
        { name: "IC 控制板", cost: "34 萬", pct: 14, mat: "none" },
        { name: "LCD 顯示",  cost: "14 萬", pct: 6, mat: "none" },
      ]},
      { name: "Packaging 包裝", cost: "18 萬", pct: 8, mat: "none" },
    ],
  },
  {
    key: "flywheel", label: "飛輪車", en: "Flywheel", margin: "18.4%", total: "1,980 萬", tag: "−120 萬", neg: true,
    aiNote: "飛輪車毛利 18.4%。飛輪 + 磁阻線圈為銅集中區，建議與橢圓機合併採購銅料以爭取量價。",
    tree: [
      { name: "Flywheel 飛輪", cost: "96 萬", pct: 48, hot: true, children: [
        { name: "Aluminum 鋁體", cost: "58 萬", pct: 29, mat: "none", hot: true },
        { name: "Steel 鋼軸", cost: "38 萬", pct: 19, mat: "fe" },
      ]},
      { name: "Magnet Coil 磁阻線圈", cost: "42 萬", pct: 21, mat: "cu", hot: true },
      { name: "Console 控制", cost: "34 萬", pct: 17, mat: "none" },
      { name: "Packaging 包裝", cost: "28 萬", pct: 14, mat: "none" },
    ],
  },
  {
    key: "strength", label: "重訓", en: "Strength", margin: "16.7%", total: "3,120 萬", tag: "−95 萬", neg: true,
    aiNote: "重訓主要為混鐵與鋼結構件，鐵礦石價格為主要曝險。",
    tree: [
      { name: "鑄鐵塊 20kg", cost: "118 萬", pct: 38, hot: true, children: [
        { name: "Pig Iron 生鐵", cost: "82 萬", pct: 26, mat: "fe", hot: true },
        { name: "鑄造加工", cost: "36 萬", pct: 12, mat: "none" },
      ]},
      { name: "Frame 框架", cost: "104 萬", pct: 33, mat: "fe" },
      { name: "Cable 鋼索", cost: "56 萬", pct: 18, mat: "fe" },
      { name: "Packaging 包裝", cost: "34 萬", pct: 11, mat: "none" },
    ],
  },
  {
    key: "treadmill", label: "跑步機", en: "Treadmill", margin: "22.1%", total: "4,260 萬", tag: "+80 萬", neg: false,
    aiNote: "跑步機毛利 22.1% 為產品線最高且正貢獻。馬達含銅但佔比低，整體成本結構健康。",
    tree: [
      { name: "Motor 驅動馬達", cost: "62 萬", pct: 30, hot: true, children: [
        { name: "Copper 線圈", cost: "34 萬", pct: 16, mat: "cu", hot: true },
        { name: "Magnet 磁鐵", cost: "28 萬", pct: 14, mat: "none" },
      ]},
      { name: "Frame 鋼架", cost: "74 萬", pct: 36, mat: "fe" },
      { name: "Belt 跑帶", cost: "42 萬", pct: 20, mat: "none" },
      { name: "Console 控制", cost: "29 萬", pct: 14, mat: "none" },
    ],
  },
];

// ─── 4-step framework ───
const STEPS = [
  { k: "CURRENT",    c: BR.inkSoft,   lead: "銅價進入「囤貨」區",     body: "低於 6-月均值即訊號。當前 $9,472/MT。" },
  { k: "WHY",        c: BR.amber,     lead: "中國需求回升預期上升",   body: "過去 30 天 −3.2%。Mean 10,258 ±1,122。" },
  { k: "PREDICTION", c: BR.red,       lead: "60 天反彈機率 92%",        body: "30D $9,945（+5%） / 90D $10,220（+8%） / 180D $10,600（+12%）。" },
  { k: "ACTION",     c: BR.greenDeep, lead: "提前備料 45 天 → 150% 庫存", body: "下單 500 MT、啟動替代供應商、預估擋損 +95 萬。" },
];

// ─── Recovery optimization rows ───
const RECOVERY = [
  { rk: 1, code: "FB64-WIRE", model: "FB64-Main · FB64-Lite", pct: 80, days: 2, riskTone: BR.red,    monthly: 5000, supplierClaim: 5.0, aiFair: 2.1, impactNTD: 64286 },
  { rk: 2, code: "FB64-MOT",  model: "FB64-Pro",              pct: 65, days: 2, riskTone: BR.red,    monthly: 1500, supplierClaim: 8.0, aiFair: 4.3, impactNTD: 60416 },
  { rk: 3, code: "FB42-COIL", model: "FB42 全系列",            pct: 45, days: 4, riskTone: BR.amber,  monthly: 2000, supplierClaim: 6.5, aiFair: 2.9, impactNTD: 40815 },
  { rk: 4, code: "FB64-PSU",  model: "FB64-Main",             pct: 35, days: 1, riskTone: BR.red,    monthly: 1500, supplierClaim: 4.2, aiFair: 2.3, impactNTD: 22050 },
];

// ─── Action recommendation (AI Copilot) ───
const PLANS = [
  { rk: "A", best: true,  title: "提前採購 500 MT",     save: 82, successRate: 92, leadDays: 7  },
  { rk: "B", best: true,  title: "切換供應商 B（折讓 4.2%）", save: 45, successRate: 80, leadDays: 14 },
  { rk: "C", best: false, title: "導入替代料",          save: 31, successRate: 65, leadDays: 30 },
];

const DOCUMENTS = [
  { kind: "RFQ 詢價單",  no: "RFQ-20260605-018" },
  { kind: "議價任務",     no: "NEG-20260605-007" },
  { kind: "採購單 PO",    no: "PO-20260605-042" },
];

export default function L5FinalPage() {
  const [activeProduct, setActiveProduct] = useState("elliptical");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({
    "drive-assy": true, "motor": true, "flywheel": true,
  });
  const [generated, setGenerated] = useState<string[]>([]);
  const [tab, setTab] = useState("Command Center");

  const product = useMemo(
    () => PRODUCTS.find((p) => p.key === activeProduct) ?? PRODUCTS[0],
    [activeProduct]
  );

  // flatten + select detail
  const flat = useMemo(() => flattenTree(product.tree), [product]);
  const selected: FlatNode | null = selectedNode ? (flat.find((n) => n.id === selectedNode) ?? null) : null;
  const selectedAiNote = selectedNode ? aiNoteForNode(product, selectedNode) : null;

  const generate = (kind: string, no: string) => {
    if (generated.includes(no)) return;
    setGenerated((arr) => [...arr, no]);
  };
  const executeAll = () => {
    DOCUMENTS.forEach((d, i) => setTimeout(() => generate(d.kind, d.no), i * 280));
  };

  return (
    <div
      style={{
        background: BR.page,
        backgroundImage: `linear-gradient(to right, rgba(12,18,8,.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,18,8,.022) 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        minHeight: "100vh",
        fontFamily: FONT,
        color: BR.ink,
      }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 backdrop-blur"
        style={{ background: "rgba(251,252,250,0.85)", borderBottom: `1px solid ${BR.border}` }}
      >
        <div className="max-w-[1440px] mx-auto px-9 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex flex-col">
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, lineHeight: 1.05 }}>
              AI Profit Defense Center
            </h2>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint, letterSpacing: "0.08em", marginTop: 3 }}>
              erp / l5-final · 最終版 L5
            </span>
          </div>
          <div className="flex gap-5 ml-1.5 flex-wrap">
            {["Command Center", "Forecasts", "Recovery", "Analysis", "Reporting"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="text-sm pb-1 transition-colors"
                style={{
                  color: tab === t ? BR.greenInk : BR.inkSoft,
                  borderBottom: `2px solid ${tab === t ? BR.green : "transparent"}`,
                  fontWeight: tab === t ? 700 : 500,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.greenDeep, fontWeight: 600 }}>
            ● AI Confidence 92%
          </span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-9 py-7 space-y-6">

        {/* AI Executive Brief — 五行重點，CEO 一分鐘看完 */}
        <ExecutiveBrief />

        {/* Pipeline indicator — 11 stages */}
        <Section>
          <PipelineIndicator />
        </Section>

        {/* 01 Commodity Radar */}
        <Stage badge="01" zh="商品雷達" en="Commodity Radar" desc="5 大原料即時行情 — 一眼看市場" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {METRICS.map((m) => <MetricCard key={m.name} m={m} />)}
        </div>

        {/* 02 Market Benchmark */}
        <Stage badge="02" zh="市場對標" en="Market Benchmark" desc="現價 vs 2021 基期 / 6 月均值 / 同業均值 — 看相對位置" />
        <MarketBenchmark />

        {/* 03 Product Exposure */}
        <Stage badge="03" zh="產品曝險" en="Product Exposure" desc="哪些產品被原料波動波及最深 — 點切換產品" />
        <ProductExposureCard activeProduct={activeProduct} onSelect={(k) => { setActiveProduct(k); setSelectedNode(null); }} />

        {/* 04 Cost Explosion Tree (drill-down, 一次一層) */}
        <Stage badge="04" zh="成本爆炸樹" en="Cost Explosion Tree" desc="點選下鑽：橢圓機 → Drive Assy → Motor → 銅 — 不一次塞滿" />
        <CostExplosionTreeL5 product={product} />

        {/* 05 Impact Explosion Tree */}
        <Stage badge="05" zh="影響爆炸樹" en="Impact Explosion Tree" desc="原料 → 供應商 → 料件 → 零件 → 整機 → 客戶 → 毛利 → 損失" />
        <ImpactExplosionTreeL5 />

        {/* 06 Supplier Exposure */}
        <Stage badge="06" zh="供應商曝險" en="Supplier Exposure" desc="CEO 最後一定問：是哪一家供應商？" />
        <SupplierExposureCard />

        {/* 07 Price Validation */}
        <Stage badge="07" zh="漲價合理性 · Price Validation" en="Supplier Price Validation" desc="供應商說 vs AI 合理值 — 立刻揭露議價空間" />
        <PriceValidationCard />

        {/* 08 Profit Waterfall */}
        <Stage badge="08" zh="毛利瀑布 · Profit Waterfall" en="Profit Waterfall" desc="誰殺掉毛利？一眼看出 — 加上獲利瀑布 KPI" />
        <ProfitCascadeCard />
        <ProfitWaterfall />

        {/* 09 AI Recovery — 回收 + Copilot 一站 */}
        <Stage badge="09" zh="AI 救援 · AI Recovery" en="AI Recovery" desc="回收中心 + AI Copilot 三步自主決策" />
        <RecoveryOptimizationCard />
        <AICopilotBanner generated={generated} generate={generate} executeAll={executeAll} />

        {/* 10 Buy Signal — 該不該買 + AI 四步分析支撐 */}
        <Stage badge="10" zh="買賣訊號 · Buy Signal" en="Buy Signal" desc="不只看價格 — 直接告訴你動作（含 AI 四步分析支撐）" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <Card key={s.k} style={{ borderTop: `3px solid ${s.c}` }}>
              <div className="flex items-center gap-2" style={{
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: s.c, marginBottom: 11,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6, background: `${s.c}20`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10,
                }}>●</span>
                {s.k}
              </div>
              <div className="text-sm font-bold mb-2">{s.lead}</div>
              <p style={{ fontSize: 11.5, lineHeight: 1.7, color: BR.inkSoft }}>{s.body}</p>
            </Card>
          ))}
        </div>
        <BuySignal />

        {/* 11 Executive Brief — 已置於頁面最上方（CEO 一分鐘看完） */}
        <Stage badge="11" zh="高層摘要 · Executive Brief" en="Executive Brief" desc="✦ 整個管線的最終輸出 — 已置於頁面最上方供 CEO 一分鐘看完" />
        <div className="rounded-[14px] p-4 text-xs"
             style={{ background: BR.greenSoft, border: `1px dashed ${BR.greenLine}`, color: BR.greenInk }}>
          上方 <b>AI Executive Brief</b> 五行重點，正是 STAGE 01–10 全管線運算後的最終輸出 ↑↑↑
        </div>


        <footer className="flex items-center gap-5 flex-wrap pt-4" style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint,
        }}>
          <span style={{ color: BR.greenDeep, fontWeight: 600 }}>● AI Prediction Confidence 92%</span>
          <span>v0.3.12</span>
          <span>報盤更新：5 分鐘前</span>
          <span>資料來源：LME · 中國 · 上海有色金屬 [iGP]</span>
          <Link href="/erp/profit-defense" style={{ color: BR.greenDeep, textDecoration: "underline" }}>← 回 Profit Defense</Link>
          <span className="flex-1" />
          <span>CHI HUA AI · L5 最終版 · /erp/l5-final</span>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Section({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: BR.card, border: `1px solid ${BR.border}`, borderRadius: 14,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "20px 22px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function Stage({ badge, zh, en, desc }: { badge: string; zh: string; en: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3 flex-wrap" style={{ marginTop: 4 }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
        color: "#fff", background: BR.green, padding: "4px 10px", borderRadius: 5,
      }}>
        STAGE {badge}
      </span>
      <h2 style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700 }}>{zh}</h2>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint }}>{en}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: BR.inkSoft }}>{desc}</span>
    </div>
  );
}

function PipelineIndicator() {
  return (
    <div className="rounded-[14px]" style={{ background: BR.card, border: `1px solid ${BR.border}`, padding: "18px 22px" }}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: "#fff", background: BR.greenInk, padding: "4px 9px", borderRadius: 5,
        }}>L5 FINAL PIPELINE</span>
        <span style={{ fontSize: 12, color: BR.inkSoft }}>
          11 階段管線 — Commodity Radar → Market Benchmark → Product Exposure → Cost / Impact Explosion → Supplier → Validation → Waterfall → Recovery → Buy Signal → Executive Brief
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-1.5">
        {STAGES.map((s) => (
          <div key={s.i} className="rounded-[10px]" style={{
            background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, padding: "9px 10px",
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700, color: BR.greenDeep, letterSpacing: "0.08em" }}>
              {s.i}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: BR.greenInk, marginTop: 2, lineHeight: 1.25 }}>
              {s.k}
            </div>
            <div style={{ fontSize: 10, color: BR.greenDeep, marginTop: 1 }}>{s.zh}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ m }: { m: typeof METRICS[number] }) {
  return (
    <Card style={{ padding: 16 }}>
      <div className="flex items-start justify-between">
        <div style={{ fontSize: 11, color: BR.inkSoft, lineHeight: 1.3 }}>
          {m.name}
          <b style={{
            display: "block", fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.05em",
            color: BR.inkFaint, fontWeight: 600, marginTop: 1,
          }}>{m.en}</b>
        </div>
        <span style={{
          fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 700,
          color: m.up ? BR.red : BR.greenDeep, whiteSpace: "nowrap",
        }}>
          {m.up ? "↗ " : "↘ "}{m.chg}
        </span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 25, fontWeight: 700, marginTop: 13, letterSpacing: "-0.02em" }}>
        {m.price}<span style={{ fontSize: 11, color: BR.inkFaint, fontWeight: 500 }}>{m.unit}</span>
      </div>
      <div style={{ fontSize: 10.5, color: BR.inkFaint, marginTop: 4 }}>vs 上週 {m.chg}</div>
      <div style={{ height: 3, borderRadius: 2, background: "#eef0ea", margin: "12px 0 8px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${m.fill}%`,
          background: m.statusTone === BR.greenDeep ? BR.green : m.statusTone === BR.red ? BR.red : BR.amber,
          borderRadius: 2,
        }} />
      </div>
      <div className="flex justify-between" style={{ fontSize: 10.5, color: BR.inkSoft }}>
        <span>{m.status}</span>
        <b style={{ color: m.statusTone }}>{m.statusLabel}</b>
      </div>
    </Card>
  );
}

function Pill({ text, tone }: { text: string; tone: "green" | "ink" | "purple" }) {
  const bg = tone === "green" ? BR.greenSoft : tone === "purple" ? "#fdf4ff" : BR.greenInk;
  const fg = tone === "green" ? BR.greenDeep : tone === "purple" ? BR.purple : "#fff";
  const br = tone === "green" ? BR.greenLine : tone === "purple" ? "#f5d0fe" : BR.greenInk;
  return (
    <span style={{
      fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      color: fg, background: bg, border: `1px solid ${br}`,
      padding: "4px 9px", borderRadius: 7, whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

// ─── Tree types & helpers ───
type FlatNode = {
  id: string;
  name: string;
  cost: string;
  pct: number;
  depth: number;
  parentId: string | null;
  hot: boolean;
  mat: "cu" | "fe" | "none";
  hasChildren: boolean;
};

function flattenTree(nodes: TreeN[]): FlatNode[] {
  const out: FlatNode[] = [];
  function walk(arr: TreeN[], depth: number, parentId: string | null, prefix: string) {
    arr.forEach((n, i) => {
      const id = `${prefix}${i}`;
      out.push({
        id, name: n.name, cost: n.cost, pct: n.pct, depth, parentId,
        hot: !!n.hot, mat: n.mat ?? "none",
        hasChildren: !!(n.children && n.children.length),
      });
      if (n.children) walk(n.children, depth + 1, id, `${id}-`);
    });
  }
  walk(nodes, 0, null, "");
  return out;
}

function aiNoteForNode(product: Product, id: string): string | null {
  // Walk tree, build node-id list, find matching path's leaf
  let result: string | null = null;
  function walk(arr: TreeN[], prefix: string) {
    arr.forEach((n, i) => {
      const nid = `${prefix}${i}`;
      if (nid === id) {
        // craft a small note based on hot/mat
        if (n.hot && n.mat === "cu") result = `${n.name} 為熱點路徑（銅佔比 ${n.pct}%）。銅 +5% → 直接影響本料 +${(n.pct * 0.05).toFixed(2)} 萬/批。建議鎖價並評估替代供應商。`;
        else if (n.hot) result = `${n.name} 為熱點路徑（佔整機 ${n.pct}%）。優先處理。`;
        else if (n.mat === "cu") result = `${n.name} 含銅，受 LME 銅價影響。佔整機 ${n.pct}%。`;
        else result = `${n.name} 佔整機 ${n.pct}%，當前情境影響有限。`;
      }
      if (n.children) walk(n.children, `${nid}-`);
    });
  }
  walk(product.tree, "");
  return result;
}

function isVisible(n: FlatNode, all: FlatNode[], openMap: Record<string, boolean>): boolean {
  if (n.parentId === null) return true;
  const parent = all.find((x) => x.id === n.parentId);
  if (!parent) return true;
  if (!(openMap[parent.id] ?? false)) return false;
  return isVisible(parent, all, openMap);
}

function TreeRow({ n, open, selected, onClick }: { n: FlatNode; open: boolean; selected: boolean; onClick: () => void }) {
  const bg = selected && n.hot ? "#ffe9e5"
           : selected           ? BR.greenSoft
           : n.hot              ? "#fff7f5"
                                : "transparent";
  const ring = selected && n.hot ? "inset 0 0 0 1px #f3c4bd"
             : selected           ? `inset 0 0 0 1px ${BR.greenLine}`
                                  : undefined;
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2 rounded-[8px]"
      style={{
        padding: `8px 8px 8px ${8 + n.depth * 20}px`,
        background: bg, boxShadow: ring, cursor: "pointer", transition: "background .13s",
      }}
    >
      <span style={{
        width: 14, height: 14, color: BR.inkFaint, fontSize: 13,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transform: open ? "rotate(90deg)" : "none", transition: "transform .2s",
        visibility: n.hasChildren ? "visible" : "hidden",
      }}>›</span>
      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {n.name.split(" ").slice(-1)[0]}
        {n.name.includes(" ") && (
          <span style={{ fontFamily: FONT_MONO, fontWeight: 400, color: BR.inkFaint, fontSize: 11 }}>
            {n.name.split(" ").slice(0, -1).join(" ")}
          </span>
        )}
        {n.mat === "cu" && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#fdeeea", color: BR.red }}>Cu 銅</span>}
        {n.mat === "fe" && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#eef1f4", color: "#3a6ea5" }}>Fe 鋼</span>}
        {n.hot && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: "#fff", background: BR.red, padding: "2px 6px", borderRadius: 4 }}>▲ +5%</span>}
      </span>
      <div style={{ width: 64, height: 5, borderRadius: 3, background: "#eef0ea", overflow: "hidden", flexShrink: 0 }}>
        <div style={{
          height: "100%", width: `${Math.min(n.pct, 100)}%`,
          background: n.hot ? BR.red : BR.green,
        }} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint, width: 34, textAlign: "right" }}>
        {n.pct}%
      </span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
        {n.cost}
      </span>
    </button>
  );
}

function DetailCard({ title, meta, sub }: { title: string; meta: string; sub: string }) {
  return (
    <div style={{ border: `1px solid ${BR.border}`, borderRadius: 11, padding: "14px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        {title}
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint, fontWeight: 400 }}>{meta}</span>
      </div>
      <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function RatioCard({ product, selected }: { product: Product; selected: FlatNode | null }) {
  const rows = (selected ? [selected] : flattenTree(product.tree).filter((n) => n.depth === 0));
  return (
    <div style={{ border: `1px solid ${BR.border}`, borderRadius: 11, padding: "14px 16px" }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.1em", color: BR.inkFaint,
        textTransform: "uppercase", marginBottom: 8, display: "block",
      }}>
        成本比例 Cost Ratio
      </span>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2.5 py-1 text-xs">
          <span style={{ flex: 1, color: BR.inkSoft }}>{r.name.split(" ").slice(-1)[0]}</span>
          <div style={{ width: 90, height: 6, borderRadius: 3, background: "#eef0ea", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.min(r.pct * 1.6, 100)}%`,
              background: r.hot ? BR.red : BR.green,
            }} />
          </div>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 600, width: 56, textAlign: "right" }}>
            {r.cost}
          </span>
        </div>
      ))}
    </div>
  );
}

function SourceCard({ mat }: { mat: "cu" | "fe" | "none" }) {
  const rows = mat === "cu" ? [
    ["原料",    "銅 Cu-CATH 99.99%"],
    ["來源",    "智利 / LME 倫敦金屬交易所"],
    ["主供應商", "供應商 A 62% · 供應商 B 38%"],
    ["前置期",   "45 天"],
  ] : mat === "fe" ? [
    ["原料",    "冷軋鋼板 SPCC"],
    ["來源",    "中鋼 / 寶武"],
    ["主供應商", "供應商 C 100%"],
    ["前置期",   "30 天"],
  ] : [
    ["類別",    "加工 / 組裝件"],
    ["來源",    "自製 + 外包"],
    ["主供應商", "廠內 70% · 外包 30%"],
    ["前置期",   "15 天"],
  ];
  return (
    <div style={{ border: `1px solid ${BR.border}`, borderRadius: 11, padding: "14px 16px" }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 9.5, letterSpacing: "0.1em", color: BR.inkFaint,
        textTransform: "uppercase", marginBottom: 8, display: "block",
      }}>
        原料 / 供應商來源 Source
      </span>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between text-xs py-1.5" style={{ borderBottom: `1px solid #f3f5ef` }}>
          <span style={{ color: BR.inkSoft }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function AINote({ text }: { text: string }) {
  return (
    <div style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, borderRadius: 10, padding: "13px 14px" }}>
      <div className="flex items-center gap-2" style={{
        fontSize: 11.5, fontWeight: 700, color: BR.greenDeep, marginBottom: 7,
      }}>
        ✦ AI 觀察
      </div>
      <p style={{ fontSize: 12, lineHeight: 1.7, color: "#3c4a2e" }}>{text}</p>
    </div>
  );
}

function RcStat({ l, v, sub, tone }: { l: string; v: string; sub?: string; tone?: "warn" | "loss" }) {
  const bg = tone === "warn" ? "#fffdf5" : tone === "loss" ? BR.redSoft : "#fff";
  const fg = tone === "warn" ? BR.amber : tone === "loss" ? BR.red : BR.ink;
  return (
    <div style={{ background: bg, padding: "16px 18px" }}>
      <div style={{ fontSize: 10.5, color: BR.inkFaint, marginBottom: 7 }}>{l}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 21, fontWeight: 700, color: fg }}>{v}</div>
      {sub && <div style={{ fontSize: 10, color: "#b3564a", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function CopilotStep({ no, label, body, children }: { no: string; label: string; body?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,.05)", border: `1px solid rgba(255,255,255,.1)`,
      borderRadius: 11, padding: "14px 16px",
    }}>
      <div className="flex items-center gap-2" style={{
        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: BR.green, marginBottom: 9,
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: 6,
          background: "rgba(118,185,0,.18)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: BR.green,
        }}>{no}</span>
        {label}
      </div>
      {body && <p style={{ fontSize: 12, lineHeight: 1.65, color: "#cdd6c2" }}>{body}</p>}
      {children}
    </div>
  );
}

function CopilotArrow() {
  return <span style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,.3)", fontSize: 18 }}>→</span>;
}

// ============================================================
// AI Executive Brief — 五行重點，CEO 一分鐘看完
// ============================================================
const BRIEF_LINES = [
  { tone: BR.red,       icon: "▲", text: "銅價未來 60 天上漲機率 87%（信心 92%）" },
  { tone: BR.red,       icon: "▼", text: "橢圓機毛利再降 100 萬，主要來自 Drive Assy" },
  { tone: BR.purple,    icon: "!",  text: "Supplier A 漲價要求超出 AI 合理值 3.2%（議價空間 NT$ 187k）" },
  { tone: BR.greenDeep, icon: "✦", text: "AI 已找到 78 萬可回收空間（A+B 方案組合）" },
  { tone: BR.greenDeep, icon: "→", text: "建議本週完成鎖價採購（500 MT，扣案窗口 7 天）" },
];

function ExecutiveBrief() {
  return (
    <div className="rounded-[14px] overflow-hidden" style={{
      background: BR.card, border: `1px solid ${BR.border}`,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
    }}>
      <div className="flex items-center gap-3 flex-wrap px-6 py-4" style={{
        background: BR.greenInk, borderBottom: `1px solid ${BR.greenInk}`,
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8, background: "rgba(118,185,0,.18)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: BR.green, fontWeight: 700,
        }}>✦</span>
        <div>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: "#fff" }}>
            AI Executive Brief · 今日重點
          </h2>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9aa78d", letterSpacing: "0.08em" }}>
            5 lines · 1 minute · CEO ready
          </span>
        </div>
        <span className="flex-1" />
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.green,
          background: "rgba(118,185,0,.16)", border: `1px solid rgba(118,185,0,.4)`,
          padding: "5px 10px", borderRadius: 7, letterSpacing: "0.08em",
        }}>
          只看這 5 行就夠
        </span>
      </div>
      <div className="px-6 py-4">
        {BRIEF_LINES.map((l, i) => (
          <div key={i} className="flex items-baseline gap-3 py-2" style={{
            borderBottom: i < BRIEF_LINES.length - 1 ? `1px solid #f3f5ef` : "none",
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
              color: l.tone, width: 28, textAlign: "center",
              background: `${l.tone}12`, borderRadius: 5, padding: "2px 0",
            }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ color: l.tone, fontSize: 14, lineHeight: 1, width: 16 }}>{l.icon}</span>
            <span style={{ flex: 1, fontSize: 14, color: BR.ink, lineHeight: 1.5 }}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Buy Signal — 該不該買，一眼看到
// ============================================================
type BuyRow = {
  metal: string; en: string; price: string;
  signal: "BUY" | "WAIT" | "HOLD";
  stars: number;
  action: string;
  confidence: number;
  detail: string;
};
const BUY_ROWS: BuyRow[] = [
  { metal: "銅",   en: "COPPER",   price: "$9,472/MT",
    signal: "BUY",  stars: 5, confidence: 92, action: "立即鎖價 500 MT",     detail: "60 天反彈機率 87%，價格已低於 6 月均值 8%" },
  { metal: "鋼",   en: "STEEL",    price: "$1,103/MT",
    signal: "HOLD", stars: 3, confidence: 71, action: "維持現有合約",         detail: "中鋼牌價下週公告，短期觀望" },
  { metal: "鋁",   en: "ALUMINUM", price: "$2,604/MT",
    signal: "WAIT", stars: 4, confidence: 84, action: "預估 45 天後下降 4%", detail: "歐洲電價回穩 + 中國雲南復產，AI 預期續跌" },
  { metal: "塑料", en: "PLASTIC",  price: "$1,393/MT",
    signal: "BUY",  stars: 4, confidence: 80, action: "提前備料 2 個月",      detail: "Brent 原油破 90，PE/PU 聯動漲 8%" },
  { metal: "生鐵", en: "PIG IRON", price: "$26,800/MT",
    signal: "WAIT", stars: 3, confidence: 68, action: "等待 30 天",            detail: "越南鋼廠價回穩中" },
];
const SIGNAL_TONE: Record<BuyRow["signal"], { fg: string; bg: string; line: string; label: string }> = {
  BUY:  { fg: BR.green,    bg: BR.greenSoft, line: BR.greenLine, label: "BUY · 該買" },
  WAIT: { fg: BR.amber,    bg: BR.amberSoft, line: "#f3e1b8",    label: "WAIT · 該等" },
  HOLD: { fg: BR.inkSoft,  bg: "#f4f6f0",    line: BR.border,    label: "HOLD · 觀望" },
};

function BuySignal() {
  return (
    <div className="rounded-[14px]" style={{
      background: BR.card, border: `1px solid ${BR.border}`,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "20px 22px",
    }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span style={{
          width: 30, height: 30, borderRadius: 8, background: BR.greenSoft,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: BR.greenDeep, fontWeight: 700,
        }}>$</span>
        <div>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>
            Buy Signal · 該不該買
          </h3>
          <span style={{ fontSize: 11, color: BR.inkSoft }}>Market Intelligence — 不是只看價格，是直接告訴你動作</span>
        </div>
        <span className="flex-1" />
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.greenDeep,
          background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
          padding: "4px 9px", borderRadius: 7, letterSpacing: "0.06em",
        }}>
          DECISION-READY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {BUY_ROWS.map((b) => {
          const t = SIGNAL_TONE[b.signal];
          return (
            <div key={b.metal} className="rounded-[11px]" style={{
              background: t.bg, border: `1px solid ${t.line}`, padding: "14px 16px",
            }}>
              <div className="flex items-baseline justify-between">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BR.ink }}>{b.metal}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: BR.inkFaint, letterSpacing: "0.05em" }}>
                    {b.en} · {b.price}
                  </div>
                </div>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#fff",
                  background: t.fg, padding: "4px 8px", borderRadius: 5, letterSpacing: "0.06em",
                }}>
                  {b.signal}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1" style={{ color: t.fg, fontSize: 16 }}>
                {"★".repeat(b.stars)}
                <span style={{ color: BR.inkFaint }}>{"★".repeat(5 - b.stars)}</span>
              </div>

              <div className="mt-2" style={{ fontSize: 13, fontWeight: 700, color: t.fg }}>
                {t.label}
              </div>
              <div className="mt-1" style={{ fontSize: 12, color: BR.ink, lineHeight: 1.45 }}>
                {b.action}
              </div>
              <div className="mt-2 pt-2 flex items-center justify-between" style={{
                borderTop: `1px solid ${t.line}`,
                fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkSoft,
              }}>
                <span>{b.detail}</span>
              </div>
              <div className="mt-2 flex items-center justify-between" style={{ fontSize: 10, color: BR.inkFaint }}>
                <span>AI 信心</span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: t.fg }}>{b.confidence}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[10px] p-3.5 text-xs leading-relaxed" style={{
        background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, color: "#3c4a2e",
      }}>
        <b style={{ color: BR.greenInk }}>✦ Market Intelligence</b> · 5 項原料中
        <b style={{ color: BR.green }}> 2 BUY</b>，<b style={{ color: BR.amber }}>2 WAIT</b>，<b style={{ color: BR.inkSoft }}>1 HOLD</b> —
        本週重點：銅<b>立即鎖價</b>、鋁<b>再等 45 天</b>。
      </div>
    </div>
  );
}

// ============================================================
// Profit Waterfall — 誰殺掉毛利？
// ============================================================
type WfStep = { label: string; delta: number; tone: string; sub?: string };
const WATERFALL: { start: number; steps: WfStep[]; endLabel: string } = {
  start: 18.2,
  steps: [
    { label: "銅價 +5%",            delta: -1.1, tone: BR.red,    sub: "Drive Assy / Motor" },
    { label: "鋼價 +3%",            delta: -0.4, tone: BR.red,    sub: "Frame Assy" },
    { label: "運費 +18%",           delta: -0.2, tone: BR.amber,  sub: "海運 + 燃油附加" },
    { label: "供應商漲價",          delta: -0.5, tone: BR.purple, sub: "Supplier A 喊 +5% / AI 合理 +2.1%" },
    { label: "AI 鎖價回收",         delta: +0.4, tone: BR.green,  sub: "提前 45 天 500 MT" },
    { label: "AI 替代供應商",       delta: +0.3, tone: BR.green,  sub: "切換 Supplier B 折讓 4.2%" },
  ],
  endLabel: "目前毛利",
};

function ProfitWaterfall() {
  const start = WATERFALL.start;
  const end = +(start + WATERFALL.steps.reduce((s, x) => s + x.delta, 0)).toFixed(1);
  const allValues = [start, end, ...WATERFALL.steps.map((_, i, arr) =>
    start + arr.slice(0, i + 1).reduce((s, x) => s + x.delta, 0)
  )];
  const maxV = Math.max(...allValues, start);
  const minV = Math.min(...allValues, 0);
  const range = maxV - minV;
  const yScale = (v: number) => 220 - ((v - minV) / range) * 200;

  // running balance for waterfall bars
  let running = start;
  const bars: { x: number; y: number; h: number; tone: string }[] = [];
  WATERFALL.steps.forEach((s, i) => {
    const before = running;
    const after = running + s.delta;
    const top = Math.max(before, after);
    const bot = Math.min(before, after);
    bars.push({
      x: 80 + (i + 1) * 130,
      y: yScale(top),
      h: yScale(bot) - yScale(top),
      tone: s.tone,
    });
    running = after;
  });

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span style={{
          width: 30, height: 30, borderRadius: 8, background: BR.redSoft,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: BR.red, fontWeight: 700,
        }}>▼</span>
        <div>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>
            Profit Waterfall · 誰殺掉毛利？
          </h3>
          <span style={{ fontSize: 11, color: BR.inkSoft }}>原始毛利 {start}% → 各因子拆解 → 目前毛利 {end}%</span>
        </div>
        <span className="flex-1" />
        <Pill text={`Δ ${(end - start).toFixed(1)}%`} tone="ink" />
      </div>

      {/* Waterfall chart */}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 1080 280" style={{ width: "100%", minWidth: 900, height: 280, display: "block" }}>
          {/* baseline grid */}
          {[18, 17, 16].map((v) => (
            <g key={v}>
              <line x1="60" y1={yScale(v)} x2="1060" y2={yScale(v)} stroke="#eef0ea" strokeWidth="1" />
              <text x="50" y={yScale(v) + 4} textAnchor="end"
                    style={{ fontFamily: FONT_MONO, fontSize: 10, fill: BR.inkFaint }}>
                {v}%
              </text>
            </g>
          ))}

          {/* start bar — 原始毛利 */}
          <rect x={80} y={yScale(start)} width={70} height={220 - yScale(start)}
                fill={BR.greenInk} rx="3" />
          <text x={80 + 35} y={yScale(start) - 10} textAnchor="middle"
                style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, fill: BR.greenInk }}>
            {start}%
          </text>
          <text x={80 + 35} y={250} textAnchor="middle"
                style={{ fontSize: 11, fontWeight: 700, fill: BR.ink }}>
            原始毛利
          </text>

          {/* dashed connectors */}
          {WATERFALL.steps.map((s, i) => {
            const before = start + WATERFALL.steps.slice(0, i).reduce((sum, x) => sum + x.delta, 0);
            const after = before + s.delta;
            const top = Math.max(before, after);
            const xPrev = 80 + (i === 0 ? 70 : (i) * 130 + 70);
            const xCurr = 80 + (i + 1) * 130;
            return (
              <line key={i} x1={xPrev} y1={yScale(before)} x2={xCurr} y2={yScale(before)}
                    stroke={BR.inkFaint} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            );
          })}

          {/* step bars */}
          {bars.map((b, i) => {
            const s = WATERFALL.steps[i];
            return (
              <g key={i}>
                <rect x={b.x} y={b.y} width={70} height={Math.max(b.h, 2)} fill={b.tone} rx="3" opacity="0.92" />
                <text x={b.x + 35} y={b.y - 10} textAnchor="middle"
                      style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, fill: b.tone }}>
                  {s.delta > 0 ? "+" : ""}{s.delta.toFixed(1)}%
                </text>
                <text x={b.x + 35} y={250} textAnchor="middle"
                      style={{ fontSize: 10.5, fontWeight: 700, fill: BR.ink }}>
                  {s.label}
                </text>
                {s.sub && (
                  <text x={b.x + 35} y={264} textAnchor="middle"
                        style={{ fontFamily: FONT_MONO, fontSize: 9, fill: BR.inkFaint }}>
                    {s.sub}
                  </text>
                )}
              </g>
            );
          })}

          {/* end bar — 目前毛利 */}
          {(() => {
            const x = 80 + (WATERFALL.steps.length + 1) * 130;
            return (
              <g>
                <rect x={x} y={yScale(end)} width={70} height={220 - yScale(end)}
                      fill={end >= start ? BR.green : BR.red} rx="3" />
                <text x={x + 35} y={yScale(end) - 10} textAnchor="middle"
                      style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, fill: end >= start ? BR.greenDeep : BR.red }}>
                  {end}%
                </text>
                <text x={x + 35} y={250} textAnchor="middle"
                      style={{ fontSize: 11, fontWeight: 700, fill: BR.ink }}>
                  {WATERFALL.endLabel}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Verdict */}
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          {
            label: "最大殺手",
            value: "銅價 +5%",
            sub: "−1.1% · 來自 Drive Assy / Motor 線圈",
            tone: BR.red,
          },
          {
            label: "意外殺手",
            value: "供應商漲價",
            sub: "−0.5% · Supplier A 喊 +5% 但 AI 合理 +2.1%",
            tone: BR.purple,
          },
          {
            label: "AI 救回",
            value: "+0.7%",
            sub: "鎖價 +0.4% · 替代供應商 +0.3%",
            tone: BR.greenDeep,
          },
        ].map((v) => (
          <div key={v.label} className="rounded-[10px]" style={{
            border: `1px solid ${v.tone}30`, background: `${v.tone}08`, padding: "12px 14px",
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint, letterSpacing: "0.08em" }}>
              {v.label}
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: v.tone, marginTop: 4 }}>
              {v.value}
            </div>
            <div style={{ fontSize: 11, color: BR.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
              {v.sub}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// 02 Market Benchmark
// ============================================================
const BENCHMARK_ROWS = [
  { metal: "銅",   curr: 9472,  base2021: 9143,   mean6m: 10258, industry: 9620, unit: "$/MT" },
  { metal: "鋼",   curr: 1103,  base2021: 1234,   mean6m: 1156,  industry: 1180, unit: "$/MT" },
  { metal: "鋁",   curr: 2604,  base2021: 2545,   mean6m: 2710,  industry: 2680, unit: "$/MT" },
  { metal: "塑料", curr: 1393,  base2021: 1102,   mean6m: 1290,  industry: 1340, unit: "$/MT" },
  { metal: "生鐵", curr: 26800, base2021: 22150,  mean6m: 25400, industry: 26100, unit: "$/MT" },
];
function MarketBenchmark() {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>Market Benchmark · 市場對標</h3>
        <span className="flex-1" />
        <Pill text="vs 2021 基期 / 6 月均值 / 同業均值" tone="green" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
              {["原料","現價","2021 基期","Δ 基期","6 月均值","Δ 均值","同業均值","相對位置"].map((h, i) => (
                <th key={h} style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                  color: BR.inkFaint, textAlign: i === 0 ? "left" : "right", padding: "0 8px 11px",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BENCHMARK_ROWS.map((r) => {
              const dB = ((r.curr - r.base2021) / r.base2021) * 100;
              const dM = ((r.curr - r.mean6m) / r.mean6m) * 100;
              const pos = r.curr < r.mean6m * 0.97 ? { label: "低於均值（買點）", tone: BR.green }
                       : r.curr > r.mean6m * 1.03 ? { label: "高於均值（避買）", tone: BR.red }
                                                  : { label: "均值附近",          tone: BR.amber };
              return (
                <tr key={r.metal} style={{ borderBottom: `1px solid #f3f5ef` }}>
                  <td style={{ padding: "12px 8px", fontWeight: 700 }}>{r.metal}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700 }}>
                    {r.curr.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, color: BR.inkSoft }}>
                    {r.base2021.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: dB > 0 ? BR.red : BR.greenDeep }}>
                    {dB > 0 ? "+" : ""}{dB.toFixed(1)}%
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, color: BR.inkSoft }}>
                    {r.mean6m.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: dM > 0 ? BR.red : BR.greenDeep }}>
                    {dM > 0 ? "+" : ""}{dM.toFixed(1)}%
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, color: BR.inkSoft }}>
                    {r.industry.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: pos.tone,
                      padding: "3px 8px", borderRadius: 5, background: `${pos.tone}15`,
                    }}>{pos.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================
// 03 Product Exposure
// ============================================================
function ProductExposureCard({ activeProduct, onSelect }: { activeProduct: string; onSelect: (k: string) => void }) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>Product Exposure · 產品曝險排行</h3>
        <span className="flex-1" />
        <Pill text="點切換產品 → 影響後續所有階段" tone="green" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PRODUCTS.map((p) => {
          const active = activeProduct === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onSelect(p.key)}
              className="text-left rounded-[11px]"
              style={{
                background: active ? BR.greenSoft : BR.card,
                border: `1.5px solid ${active ? BR.green : BR.borderHi}`,
                padding: "14px 16px",
                cursor: "pointer",
              }}
            >
              <div className="flex items-baseline justify-between">
                <span style={{ fontSize: 14, fontWeight: 700 }}>{p.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: p.neg ? BR.red : BR.greenDeep }}>
                  {p.tag}
                </span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint, marginTop: 3, letterSpacing: "0.05em" }}>
                {p.en}
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <span style={{ color: BR.inkSoft }}>毛利</span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.ink }}>{p.margin}</span>
              </div>
              <div className="flex items-baseline justify-between text-xs mt-1">
                <span style={{ color: BR.inkSoft }}>總成本</span>
                <span style={{ fontFamily: FONT_MONO, color: BR.inkSoft }}>{p.total}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================
// 04 Cost Explosion Tree — 一次只展開一層（per附件二）
// ============================================================
function CostExplosionTreeL5({ product }: { product: Product }) {
  const [path, setPath] = useState<string[]>([]);

  let current: TreeN = { name: product.label, cost: product.total, pct: 100, children: product.tree };
  const crumbs: TreeN[] = [current];
  for (const seg of path) {
    const next = current.children?.find((c) => c.name === seg);
    if (!next) break;
    current = next;
    crumbs.push(next);
  }

  const LAYER_LABEL = ["Product 整機", "Module 模組", "Component 零件", "Commodity 原料"];
  const LAYER_TONE  = [BR.greenInk, BR.green, BR.purple, BR.amber];

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>Cost Explosion Tree</h3>
        <span style={{ fontSize: 11, color: BR.inkSoft }}>點任一項 → 下鑽下一層（一次一層，不擠在一起）</span>
        <span className="flex-1" />
        {path.length > 0 && (
          <button onClick={() => setPath([])} style={{
            fontSize: 11, color: BR.greenDeep, background: BR.greenSoft,
            border: `1px solid ${BR.greenLine}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer",
          }}>
            ↺ 回頂層
          </button>
        )}
      </div>

      {/* breadcrumb */}
      <div className="flex flex-wrap items-baseline gap-1.5 mb-4 text-xs">
        {crumbs.map((n, i) => (
          <span key={i} className="flex items-baseline gap-1">
            {i > 0 && <span style={{ color: BR.inkFaint }}>›</span>}
            <button
              onClick={() => setPath(path.slice(0, i))}
              className="hover:underline font-semibold"
              style={{ color: i === crumbs.length - 1 ? BR.red : BR.greenDeep }}
            >
              {n.name}
            </button>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 9, color: "#fff",
              background: LAYER_TONE[i] ?? BR.inkFaint, padding: "2px 6px", borderRadius: 4,
            }}>
              {LAYER_LABEL[i] ?? `Lv${i + 1}`}
            </span>
          </span>
        ))}
      </div>

      {/* current node header */}
      <div className="rounded-[10px] p-3 mb-3" style={{
        background: "#fbfcfa", border: `1px solid ${BR.border}`,
      }}>
        <div className="flex items-baseline justify-between">
          <span style={{
            fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 700,
            color: LAYER_TONE[crumbs.length - 1] ?? BR.ink,
          }}>
            ▎{current.name}
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: BR.inkSoft }}>
            {current.cost}
          </span>
        </div>
      </div>

      {/* children list */}
      <div className="space-y-2">
        {(current.children ?? []).map((c) => {
          const drillable = !!(c.children && c.children.length);
          const tone = LAYER_TONE[Math.min(crumbs.length, LAYER_TONE.length - 1)];
          return (
            <button
              key={c.name}
              onClick={() => drillable && setPath([...path, c.name])}
              disabled={!drillable}
              className="w-full text-left rounded-[10px] transition-colors"
              style={{
                background: c.hot ? "#fff7f5" : "#fff",
                border: `1px solid ${c.hot ? "#f3c4bd" : BR.border}`,
                padding: "12px 14px",
                cursor: drillable ? "pointer" : "default",
              }}
            >
              <div className="flex items-center gap-3">
                {c.mat === "cu" && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#fdeeea", color: BR.red }}>Cu 銅</span>}
                {c.mat === "fe" && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#eef1f4", color: "#3a6ea5" }}>Fe 鋼</span>}
                <span style={{ fontSize: 13, fontWeight: 700, color: BR.ink }}>{c.name}</span>
                {c.hot && <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: "#fff", background: BR.red, padding: "2px 6px", borderRadius: 4 }}>▲ 熱點</span>}
                <span className="flex-1" />
                <div style={{ width: 120, height: 6, borderRadius: 3, background: "#eef0ea", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(c.pct, 100)}%`, background: c.hot ? BR.red : tone, opacity: 0.85 }} />
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: c.hot ? BR.red : tone, width: 44, textAlign: "right" }}>
                  {c.pct}%
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: BR.inkSoft, width: 56, textAlign: "right" }}>
                  {c.cost}
                </span>
                {drillable ? <span style={{ color: BR.inkFaint, fontSize: 16 }}>›</span>
                           : <span style={{ fontSize: 9, color: BR.inkFaint, padding: "2px 6px", borderRadius: 4, background: "#f3f5ef" }}>leaf</span>}
              </div>
            </button>
          );
        })}
        {(!current.children || current.children.length === 0) && (
          <div className="text-center py-4" style={{ fontSize: 11, color: BR.inkFaint }}>
            已到最末層（{LAYER_LABEL[crumbs.length - 1]}）— 無法再下鑽
          </div>
        )}
      </div>

      {/* layer legend */}
      <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-x-3 gap-y-1"
           style={{ borderColor: BR.border, fontSize: 10, color: BR.inkSoft }}>
        <span style={{ fontWeight: 700 }}>層級：</span>
        {LAYER_LABEL.map((l, i) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: LAYER_TONE[i] }} />
            {l}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// 05 Impact Explosion Tree — 原料 → 供應商 → 料件 → 零件 → 整機 → 客戶 → 毛利
// ============================================================
const IMPACT_SCENARIOS = [
  { metal: "銅",   pct: 5, tone: BR.red,
    supplier: "Supplier A · 漆包銅線",
    parts:    "FB64-WIRE 電線組（+3.8%）",
    component:"Motor 馬達（+2.25%）",
    system:   "Drive Assy 傳動（+1.18%）",
    product:  "橢圓機（+0.82%）",
    customer: "客戶 A · 北美健身房連鎖",
    marginBefore: 18.2, marginAfter: 17.4, lossMan: 320,
  },
  { metal: "鋼",   pct: 5, tone: BR.amber,
    supplier: "Supplier D · 鋼板裁切",
    parts:    "鋼板 CR-1.5T（+4.2%）",
    component:"Frame Assy 車架（+3.4%）",
    system:   "結構系統（+1.65%）",
    product:  "橢圓機（+0.65%）",
    customer: "客戶 B · 北美零售品牌",
    marginBefore: 18.2, marginAfter: 17.55, lossMan: 250,
  },
  { metal: "鋁",   pct: 5, tone: "#3a6ea5",
    supplier: "Supplier G · 鋁錠供料",
    parts:    "鋁錠 6061-T6（+3.5%）",
    component:"Flywheel 18kg（+2.1%）",
    system:   "Drive Assy（+0.95%）",
    product:  "飛輪車（+0.54%）",
    customer: "客戶 C · 歐洲品牌",
    marginBefore: 18.4, marginAfter: 17.9, lossMan: 120,
  },
];
function ImpactExplosionTreeL5() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const s = IMPACT_SCENARIOS[scenarioIdx];
  const steps = [
    { layer: "原料",   name: `${s.metal}價 +${s.pct}%`,        tone: s.tone,   bg: `${s.tone}18` },
    { layer: "供應商", name: s.supplier,                       tone: BR.purple, bg: "#fdf4ff", dashed: true },
    { layer: "料件",   name: s.parts,                          tone: BR.ink,   bg: "#fff" },
    { layer: "零件",   name: s.component,                      tone: BR.ink,   bg: "#fff" },
    { layer: "系統",   name: s.system,                         tone: BR.ink,   bg: "#fff" },
    { layer: "整機",   name: s.product,                        tone: BR.ink,   bg: "#fff" },
    { layer: "客戶",   name: s.customer,                       tone: BR.greenDeep, bg: "#eff6ff", dashed: true },
  ];
  return (
    <Card>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>Impact Explosion Tree</h3>
        <span style={{ fontSize: 11, color: BR.inkSoft }}>原料 → 供應商 → 料件 → 零件 → 系統 → 整機 → 客戶 → 毛利 → 損失</span>
        <span className="flex-1" />
        <div className="flex gap-1.5">
          {IMPACT_SCENARIOS.map((sc, i) => (
            <button
              key={sc.metal}
              onClick={() => setScenarioIdx(i)}
              style={{
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
                color: scenarioIdx === i ? "#fff" : BR.ink,
                background: scenarioIdx === i ? sc.tone : "#fff",
                border: `1px solid ${scenarioIdx === i ? sc.tone : BR.borderHi}`,
                padding: "5px 10px", borderRadius: 6, cursor: "pointer",
              }}
            >
              {sc.metal} +{sc.pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="font-mono text-sm">
        {steps.map((st, i) => (
          <div key={i}>
            <div className="rounded-[8px] px-3 py-2.5 mb-1.5 flex items-baseline justify-between"
                 style={{ background: st.bg, border: `1px ${st.dashed ? "dashed" : "solid"} ${st.tone}40` }}>
              <span>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#fff",
                  background: st.tone, padding: "2px 8px", borderRadius: 4, marginRight: 8,
                }}>
                  {st.layer}
                </span>
                <span style={{ fontWeight: 700, color: BR.ink, fontFamily: FONT }}>{st.name}</span>
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="text-center" style={{ color: BR.inkFaint, fontSize: 14, lineHeight: 1, paddingLeft: 12 }}>↓</div>
            )}
          </div>
        ))}

        {/* margin + loss */}
        <div className="text-center" style={{ color: BR.inkFaint, fontSize: 14, lineHeight: 1, paddingLeft: 12 }}>↓</div>
        <div className="rounded-[8px] px-3 py-2.5 mb-1.5 flex items-baseline justify-between"
             style={{ background: "#fff8e1", border: `1px solid #f59e0b` }}>
          <span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#fff",
                           background: "#92400e", padding: "2px 8px", borderRadius: 4, marginRight: 8 }}>毛利率</span>
            <span style={{ fontWeight: 700, color: "#92400e", fontFamily: FONT }}>
              {s.marginBefore}% <span style={{ color: BR.red, margin: "0 4px" }}>↓</span>
              <span style={{ color: BR.red }}>{s.marginAfter}%</span>
            </span>
          </span>
        </div>
        <div className="text-center" style={{ color: BR.inkFaint, fontSize: 14, lineHeight: 1, paddingLeft: 12 }}>↓</div>
        <div className="rounded-[8px] px-3 py-3 flex items-baseline justify-between"
             style={{ background: `${BR.red}15`, border: `1.5px solid ${BR.red}` }}>
          <span style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 700, color: BR.red }}>💸 損失</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800, color: BR.red }}>−{s.lossMan} 萬</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// 06 Supplier Exposure
// ============================================================
const SUPPLIER_EXPOSURE_L5 = [
  { code: "S-A", name: "Supplier A · 漆包銅線",    metal: "銅",   amountMan: 120, products: ["橢圓機", "飛輪車"],   risk: "高" },
  { code: "S-B", name: "Supplier B · 馬達線圈",    metal: "銅",   amountMan:  80, products: ["飛輪車"],             risk: "中" },
  { code: "S-D", name: "Supplier D · 鋼板裁切",    metal: "鋼",   amountMan: 110, products: ["橢圓機", "重訓"],     risk: "高" },
  { code: "S-G", name: "Supplier G · 鋁錠供料",    metal: "鋁",   amountMan:  60, products: ["飛輪車", "橢圓機"],   risk: "中" },
  { code: "S-K", name: "Supplier K · 鑄鐵塊",      metal: "混鐵", amountMan:  55, products: ["重訓"],               risk: "高" },
];
function SupplierExposureCard() {
  const total = SUPPLIER_EXPOSURE_L5.reduce((s, r) => s + r.amountMan, 0);
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>
          Supplier Exposure · <span style={{ color: BR.purple }}>供應商曝險</span>
        </h3>
        <Pill text="CEO 最後一定問：是哪一家供應商？" tone="purple" />
        <span className="flex-1" />
        <Pill text={`總曝險 NT$ ${total} 萬`} tone="green" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
              {["供應商","原料","影響產品","曝險金額","風險","Bar"].map((h, i) => (
                <th key={h} style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                  color: BR.inkFaint, textAlign: i === 3 ? "right" : "left", padding: "0 8px 11px",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPPLIER_EXPOSURE_L5.map((r) => {
              const riskTone = r.risk === "高" ? BR.red : r.risk === "中" ? BR.amber : BR.greenDeep;
              return (
                <tr key={r.code} style={{ borderBottom: `1px solid #f3f5ef` }}>
                  <td style={{ padding: "12px 8px", fontWeight: 700, fontSize: 13 }}>{r.name}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f3f5ef", color: BR.inkSoft }}>{r.metal}</span>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: 12 }}>{r.products.join(" · ")}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, color: BR.purple }}>
                    NT$ {r.amountMan} 萬
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: riskTone, padding: "3px 8px", borderRadius: 5, background: `${riskTone}15` }}>
                      ● {r.risk}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ height: 6, width: 140, borderRadius: 3, background: "#eef0ea", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(r.amountMan / 120) * 100}%`, background: BR.purple, opacity: 0.85 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-[10px] p-3 text-xs" style={{ background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, color: "#3c4a2e" }}>
        <b style={{ color: BR.greenInk }}>立刻能變成 Supplier Intelligence</b> — 看單一供應商的歷史報價、議價空間、可替代性。
      </div>
    </Card>
  );
}

// ============================================================
// 07 Price Validation Card
// ============================================================
// ============================================================
// 07 AI Supplier Price Validation Engine
//    副標題：Should Cost Breakdown
//    （吸收原 /erp/should-cost 內容 — 點開料號展開 Should-Cost 拆解）
// ============================================================

// 每料號的 should-cost 拆解（業界經驗值）+ 漲價來源
const SHOULD_COST: Record<string, {
  category: string;
  breakdown: { raw: number; process: number; surface: number; packaging: number; freight: number; margin: number };
  sources: { component: "原料" | "加工" | "表處" | "包裝" | "運費"; delta: number; reason: string }[];
}> = {
  "FB64-WIRE": {
    category: "電線組（銅含量 80%）",
    breakdown: { raw: 45, process: 28, surface: 8, packaging: 4, freight: 8, margin: 7 },
    sources: [
      { component: "原料", delta: +4.0, reason: "LME 銅 +4% / 6 月區間內" },
      { component: "加工", delta: +2.0, reason: "台灣製造業最低工資 2% 調整" },
      { component: "運費", delta: +5.0, reason: "BDI + 紅海繞航加成" },
    ],
  },
  "FB64-MOT": {
    category: "馬達（銅 65% + 矽鋼）",
    breakdown: { raw: 52, process: 24, surface: 6, packaging: 3, freight: 7, margin: 8 },
    sources: [
      { component: "原料", delta: +4.0, reason: "LME 銅 +4%、矽鋼板 +2%" },
      { component: "加工", delta: +2.0, reason: "工資 + 加工費調整" },
      { component: "運費", delta: +5.0, reason: "海運 + 燃油附加" },
    ],
  },
  "FB42-COIL": {
    category: "磁鐵線圈（銅 45%）",
    breakdown: { raw: 38, process: 32, surface: 10, packaging: 4, freight: 9, margin: 7 },
    sources: [
      { component: "原料", delta: +3.5, reason: "銅 +4%、磁鐵 +3%" },
      { component: "加工", delta: +2.5, reason: "繞線人工 +2.5%" },
      { component: "運費", delta: +5.0, reason: "海運" },
    ],
  },
  "FB64-PSU": {
    category: "電源變壓器（銅 35%）",
    breakdown: { raw: 35, process: 30, surface: 9, packaging: 5, freight: 10, margin: 11 },
    sources: [
      { component: "原料", delta: +3.0, reason: "銅 +4%、塑料 +2%" },
      { component: "加工", delta: +2.0, reason: "工資調整" },
      { component: "運費", delta: +5.0, reason: "海運加成" },
    ],
  },
};

function computeFairBand(b: typeof SHOULD_COST[string]) {
  // 加總得 weighted average，再 ±30% 緩衝 = 合理區間
  const weighted = b.sources.reduce((s, src) => {
    const w = (b.breakdown as any)[
      src.component === "原料" ? "raw" :
      src.component === "加工" ? "process" :
      src.component === "表處" ? "surface" :
      src.component === "包裝" ? "packaging" :
      "freight"
    ] / 100;
    return s + src.delta * w;
  }, 0);
  return { low: +(weighted * 0.85).toFixed(1), mid: +weighted.toFixed(1), high: +(weighted * 1.15).toFixed(1) };
}

function PriceValidationCard() {
  const [openCode, setOpenCode] = useState<string | null>("FB64-WIRE");
  const totalRoom = RECOVERY.reduce((s, r) => s + Math.round((r.impactNTD * (r.supplierClaim - r.aiFair)) / 5), 0);

  return (
    <Card>
      <div className="flex items-baseline gap-3 mb-1 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700 }}>
          <span style={{ color: BR.purple, marginRight: 6 }}>✦</span>
          AI Supplier Price Validation Engine
          <span style={{ fontSize: 14, fontWeight: 500, color: BR.inkSoft, marginLeft: 8 }}>· 漲價合理性引擎</span>
        </h3>
      </div>
      <div className="flex items-baseline gap-3 mb-4 flex-wrap">
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.purple, letterSpacing: "0.05em" }}>
          副標 · Should Cost Breakdown
        </span>
        <span style={{ fontSize: 11, color: BR.inkSoft }}>
          供應商說 vs Should-Cost 拆解反推的 AI 合理值 — 點料號展開 Should-Cost 細節
        </span>
        <span className="flex-1" />
        <Pill text="原 /erp/should-cost 已整合於此" tone="purple" />
        <Pill text={`已驗證 ${RECOVERY.length} 項`} tone="green" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
              {["", "料號", "用於", "供應商漲價", "AI 合理值", "差距", "議價空間 (估)", "建議動作"].map((h, i) => (
                <th key={i} style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                  color: BR.inkFaint, textAlign: i >= 3 && i <= 6 ? "right" : "left", padding: "0 6px 11px",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECOVERY.map((r) => {
              const gap = r.supplierClaim - r.aiFair;
              const roomNTD = Math.round((r.impactNTD * gap) / 5);
              const action = gap >= 3 ? { label: "退回 + 重新議價", tone: BR.red }
                           : gap >= 1 ? { label: "壓 AI 合理值",     tone: BR.amber }
                                      : { label: "可接受",             tone: BR.greenDeep };
              const open = openCode === r.code;
              const sc = SHOULD_COST[r.code];
              return (
                <Fragment key={r.code}>
                  <tr
                    onClick={() => setOpenCode(open ? null : r.code)}
                    style={{
                      borderBottom: open ? "none" : `1px solid #f3f5ef`,
                      background: open ? BR.greenSoft : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <td style={{ padding: "12px 6px", width: 22 }}>
                      <span style={{
                        display: "inline-block", width: 16, height: 16, lineHeight: "16px", textAlign: "center",
                        color: BR.greenDeep, fontWeight: 700,
                        transform: open ? "rotate(90deg)" : "none", transition: "transform .2s",
                      }}>›</span>
                    </td>
                    <td style={{ padding: "12px 6px", fontWeight: 700, fontFamily: FONT_MONO }}>{r.code}</td>
                    <td style={{ padding: "12px 6px", fontSize: 11.5, color: BR.inkSoft }}>{r.model}</td>
                    <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>
                      +{r.supplierClaim.toFixed(1)}%
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>
                      +{r.aiFair.toFixed(1)}%
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, color: BR.purple }}>
                      −{gap.toFixed(1)}%
                    </td>
                    <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.purple }}>
                      NT$ {roomNTD.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 6px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: action.tone, padding: "4px 9px", borderRadius: 6, background: `${action.tone}15` }}>
                        {action.label}
                      </span>
                    </td>
                  </tr>
                  {open && sc && (
                    <tr style={{ borderBottom: `1px solid #f3f5ef` }}>
                      <td colSpan={8} style={{ padding: "4px 6px 18px", background: BR.greenSoft }}>
                        <ShouldCostBreakdownPanel code={r.code} model={r.model} supplierClaim={r.supplierClaim} sc={sc} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: BR.greenSoft }}>
              <td />
              <td colSpan={5} style={{ padding: "12px 6px", fontWeight: 700, color: BR.greenInk }}>合計議價空間</td>
              <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 800, fontSize: 16, color: BR.purple }}>
                NT$ {totalRoom.toLocaleString()}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ─── Should-Cost Breakdown drill-down panel ───
function ShouldCostBreakdownPanel({ code, model, supplierClaim, sc }: {
  code: string;
  model: string;
  supplierClaim: number;
  sc: typeof SHOULD_COST[string];
}) {
  const band = computeFairBand(sc);
  const verdict = supplierClaim > band.high * 1.5 ? { tone: BR.red,    label: "🚨 嚴重超出 · 強力議價" }
                : supplierClaim > band.high       ? { tone: BR.amber,  label: "⚠ 偏高 · 要求重議" }
                                                  : { tone: BR.greenDeep, label: "✓ 合理 · 可接受" };
  const excess = +(supplierClaim - band.high).toFixed(1);

  return (
    <div className="rounded-[12px]" style={{
      background: "#fff", border: `1.5px solid ${BR.purple}30`, padding: "16px 18px",
    }}>
      <div className="flex items-baseline gap-2 mb-3 flex-wrap">
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: "#fff", background: BR.purple, padding: "3px 8px", borderRadius: 5, letterSpacing: "0.08em" }}>
          SHOULD-COST DRILL-DOWN
        </span>
        <span style={{ fontFamily: FONT_HEAD, fontSize: 14, fontWeight: 700 }}>{code}</span>
        <span style={{ fontSize: 12, color: BR.inkSoft }}>{sc.category} · {model}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* ① Should Cost Breakdown */}
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
            ① SHOULD COST BREAKDOWN
          </div>
          <div className="space-y-1.5">
            {[
              { k: "原料", v: sc.breakdown.raw,       tone: "#0891b2" },
              { k: "加工", v: sc.breakdown.process,   tone: "#3b82f6" },
              { k: "表處", v: sc.breakdown.surface,   tone: "#8b5cf6" },
              { k: "包裝", v: sc.breakdown.packaging, tone: "#f59e0b" },
              { k: "運費", v: sc.breakdown.freight,   tone: "#10b981" },
              { k: "利潤", v: sc.breakdown.margin,    tone: BR.red },
            ].map((row) => (
              <div key={row.k} className="flex items-center gap-2 text-xs">
                <span style={{ width: 32, color: BR.inkSoft, fontWeight: 600 }}>{row.k}</span>
                <div style={{ flex: 1, height: 7, background: "#eef0ea", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${row.v}%`, background: row.tone, opacity: 0.9 }} />
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, width: 36, textAlign: "right", color: row.tone }}>
                  {row.v}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: BR.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
            業界經驗值，正式版接 ERP 標準成本卡
          </div>
        </div>

        {/* ② 漲價來源 */}
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
            ② 漲價來源 PRICE DRIVERS
          </div>
          <div className="space-y-2">
            {sc.sources.map((src) => (
              <div key={src.component} className="rounded-[8px] px-2.5 py-2" style={{ border: `1px solid ${BR.border}`, background: "#fbfcfa" }}>
                <div className="flex items-baseline justify-between">
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{src.component}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: src.delta > 0 ? BR.red : BR.greenDeep }}>
                    {src.delta > 0 ? "+" : ""}{src.delta.toFixed(1)}%
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: BR.inkSoft, marginTop: 2 }}>{src.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ③ AI 結論 */}
        <div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
            ③ AI 結論 VERDICT
          </div>
          <div className="rounded-[10px] overflow-hidden" style={{ border: `1.5px solid ${verdict.tone}`, background: `${verdict.tone}08` }}>
            <div className="px-3 py-2 flex items-baseline justify-between" style={{ background: verdict.tone, color: "#fff" }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{verdict.label}</span>
            </div>
            <div className="px-3 py-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span style={{ color: BR.inkSoft }}>合理區間</span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.greenDeep }}>
                  {band.low}% ~ {band.high}%
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: BR.inkSoft }}>供應商要求</span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>
                  +{supplierClaim.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5" style={{ borderColor: `${verdict.tone}30` }}>
                <span style={{ color: BR.inkSoft }}>超出</span>
                <span style={{ fontFamily: FONT_MONO, fontWeight: 800, color: verdict.tone }}>
                  {excess > 0 ? "+" : ""}{excess.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs" style={{ color: BR.inkSoft, lineHeight: 1.5 }}>
            合理區間 = 各成分當前波動 × 佔成本權重，加總 ±15% 緩衝
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 08 Profit Cascade Card (KPI four-step)
// ============================================================
function ProfitCascadeCard() {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: "#fff", background: BR.greenInk, padding: "4px 9px", borderRadius: 5,
        }}>EXECUTIVE KPI</span>
        <span style={{ fontSize: 12, color: BR.inkSoft }}>四步公式：營收影響 − 毛利影響 + AI 可救回 = 最終淨衝擊</span>
      </div>
      <div className="flex items-stretch gap-2 flex-wrap">
        {CASCADE.map((c, i) => c.op ? (
          <div key={i} className="flex items-center" style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: BR.inkFaint }}>
            {c.op}
          </div>
        ) : (
          <div key={i} className="flex-1 min-w-[170px] rounded-[11px]" style={{
            background: c.final ? BR.greenInk : "#fbfcfa",
            border: `1px solid ${c.final ? BR.greenInk : BR.border}`,
            padding: "14px 16px", color: c.final ? "#fff" : undefined,
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: c.final ? "#c7d2b8" : BR.inkFaint, marginBottom: 9 }}>
              {c.label}
            </div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: c.final ? 28 : 24, fontWeight: 700,
              letterSpacing: "-0.02em", lineHeight: 1,
              color: c.final ? "#ff8a7a" : c.tone,
            }}>
              {c.value}
            </div>
            <div style={{ fontSize: 10.5, color: c.final ? "#9aa78d" : BR.inkSoft, marginTop: 9, lineHeight: 1.4 }}>
              {c.desc}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// 09 Recovery Optimization Card
// ============================================================
function RecoveryOptimizationCard() {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700 }}>Commodity Cost Recovery Center</h3>
        <span className="flex-1" />
        <Pill text="L4 EXECUTIVE" tone="ink" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-[12px] overflow-hidden mb-5"
           style={{ background: BR.border, border: `1px solid ${BR.border}` }}>
        <RcStat l="受影響零件數" v="4 項" />
        <RcStat l="庫存耗減量"   v="0.95 MT" />
        <RcStat l="±5% 成本衝擊" v="±NT$ 205,822" tone="warn" />
        <RcStat l="獲利影響"      v="−NT$ 205,822" sub="毛利 18.2% → 18.1%" tone="loss" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BR.border}` }}>
              {["#","零件 / 用料編碼","含量占比","庫存狀態","月用量","±5% 衝擊"].map((h, i) => (
                <th key={h} style={{
                  fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                  color: BR.inkFaint, textAlign: i >= 4 ? "right" : "left", padding: "0 6px 11px",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECOVERY.map((r) => (
              <tr key={r.code} style={{ borderBottom: `1px solid #f3f5ef` }}>
                <td style={{ padding: "12px 6px" }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: "50%", background: "#f3f5ef",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: BR.inkSoft,
                  }}>{r.rk}</span>
                </td>
                <td style={{ padding: "12px 6px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{r.code}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: BR.inkFaint, marginTop: 1 }}>{r.model}</div>
                </td>
                <td style={{ padding: "12px 6px", fontFamily: FONT_MONO, fontSize: 13 }}>{r.pct}%</td>
                <td style={{ padding: "12px 6px" }}>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 600,
                    padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4,
                    background: r.riskTone === BR.red ? BR.redSoft : BR.amberSoft, color: r.riskTone,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: r.riskTone }} />
                    {r.days} 天
                  </span>
                </td>
                <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 600 }}>
                  {r.monthly.toLocaleString()}
                </td>
                <td style={{ padding: "12px 6px", textAlign: "right", fontFamily: FONT_MONO, fontWeight: 700, color: BR.red }}>
                  +NT$ {r.impactNTD.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ============================================================
// 09 AI Copilot Banner (dark)
// ============================================================
function AICopilotBanner({ generated, generate, executeAll }: {
  generated: string[];
  generate: (kind: string, no: string) => void;
  executeAll: () => void;
}) {
  return (
    <div className="rounded-[16px] relative overflow-hidden" style={{ background: BR.greenInk, color: "#fff", padding: "26px 30px" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(118,185,0,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(118,185,0,.07) 1px, transparent 1px)`,
        backgroundSize: "30px 30px", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: -60, top: -60, width: 300, height: 300,
        background: "radial-gradient(circle, rgba(118,185,0,.22), transparent 65%)", pointerEvents: "none",
      }} />

      <div className="relative z-10 flex items-start justify-between mb-5 flex-wrap gap-3">
        <h3 className="flex items-center gap-2.5" style={{ fontFamily: FONT_HEAD, fontSize: 21, fontWeight: 700 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8, background: "rgba(118,185,0,.18)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", color: BR.green,
          }}>✦</span>
          AI Copilot
          <span style={{
            fontSize: 10.5, fontWeight: 500, color: "#9aa78d",
            background: "rgba(118,185,0,.12)", padding: "4px 10px", borderRadius: 20, marginLeft: 4,
          }}>
            由 Rule-Based 升級為自主決策代理
          </span>
        </h3>
        <div className="text-right">
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.1em", color: "#8a9580" }}>最佳組合 A+B · 總可救回</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 30, fontWeight: 700, color: BR.green, letterSpacing: "-0.01em" }}>
            NT$ 127,000
          </div>
        </div>
      </div>

      <div className="relative z-10 grid lg:grid-cols-[1fr,auto,1fr,auto,2fr] items-stretch gap-2.5 mb-5">
        <CopilotStep no="01" label="預測 PREDICT" body={<>銅價未來 <b>60 天</b>反彈，機率 <b>92%</b>，預估突破 $10,600/MT。</>} />
        <CopilotArrow />
        <CopilotStep no="02" label="影響 IMPACT" body={<>波及 <b>FB64-WIRE</b> / <b>FB64-MOT</b>，預估毛利下降 <b style={{ color: "#ff8a7a" }}>−205 萬</b>。</>} />
        <CopilotArrow />
        <CopilotStep no="03" label="建議 RECOMMEND · 3 方案">
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {PLANS.map((p) => (
              <div key={p.rk} style={{
                background: p.best ? "rgba(118,185,0,.10)" : "rgba(0,0,0,.18)",
                border: `1px solid ${p.best ? "rgba(118,185,0,.5)" : "rgba(255,255,255,.1)"}`,
                borderRadius: 9, padding: 10,
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  方案 {p.rk}
                  {p.best && <span style={{ fontFamily: FONT_MONO, fontSize: 8, background: BR.green, color: "#fff", padding: "1px 5px", borderRadius: 4 }}>最佳</span>}
                </div>
                <div style={{ fontSize: 10.5, color: "#aebba0", margin: "5px 0 7px" }}>{p.title}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: BR.green }}>+{p.save} 萬</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#cdd6c2", background: "rgba(118,185,0,.08)", borderRadius: 8, padding: "9px 12px" }}>
            ✦ AI 建議組合 <b style={{ color: BR.green }}>A + B</b> · 總回收 <b style={{ color: BR.green }}>127 萬</b> · 執行成功率 <b style={{ color: BR.green }}>87%</b>
          </div>
        </CopilotStep>
      </div>

      <div className="relative z-10 pt-4" style={{ borderTop: `1px solid rgba(255,255,255,.1)` }}>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2" style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: BR.green }}>
            <span style={{
              width: 20, height: 20, borderRadius: 6, background: "rgba(118,185,0,.18)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: BR.green,
            }}>04</span>
            執行 EXECUTE
          </div>
          <span style={{ fontSize: 11, color: "#9aa78d" }}>一鍵直接生成下游單據，無需人工重打</span>
        </div>
        <div className="flex gap-2.5 flex-wrap items-center">
          {DOCUMENTS.map((d) => {
            const done = generated.includes(d.no);
            return (
              <button
                key={d.no}
                onClick={() => generate(d.kind, d.no)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: done ? "rgba(118,185,0,.16)" : "rgba(255,255,255,.06)",
                  color: done ? "#fff" : "#e7ede0",
                  border: `1px solid ${done ? BR.green : "rgba(255,255,255,.16)"}`,
                  borderRadius: 9, padding: "11px 16px", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {done ? "✓" : "＋"} 產生 {d.kind}
              </button>
            );
          })}
          <button
            onClick={executeAll}
            style={{
              background: BR.green, color: "#fff", border: "none", borderRadius: 11,
              padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 9,
              boxShadow: "0 8px 24px rgba(118,185,0,.35)",
            }}
          >
            ⚡ 一鍵執行 A+B
          </button>
        </div>

        {generated.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {generated.map((no) => {
              const d = DOCUMENTS.find((x) => x.no === no)!;
              return (
                <div key={no} style={{
                  display: "flex", alignItems: "center", gap: 11,
                  background: "rgba(255,255,255,.06)",
                  border: `1px solid rgba(118,185,0,.3)`, borderLeft: `3px solid ${BR.green}`,
                  borderRadius: 9, padding: "11px 14px",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, background: "rgba(118,185,0,.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: BR.green, fontWeight: 700,
                  }}>✓</div>
                  <div className="flex-1">
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.kind} 已生成</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: "#9aa78d", marginTop: 2 }}>
                      {no} · 由 AI Copilot 自動帶入 BOM 與供應商
                    </div>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.green }}>● 待簽核</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
