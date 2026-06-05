"use client";

import { useState } from "react";
import Link from "next/link";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

// ============================================================
// CBS · Cost Breakdown System  ──  成本 DNA 引擎
// 真正的終極目的：建立 原料 → 零件 → 模組 → 產品 → 毛利 因果鏈
// ============================================================

type CBSNode = {
  id: string;
  name: string;
  pct: number;           // 在父節點的佔比
  level: "Product" | "Module" | "Part" | "Material" | "Process" | "Logistics" | "Margin";
  children?: CBSNode[];
  source?: "ERP" | "ShouldCost" | "AI";
};

const CBS_TREE: CBSNode = {
  id: "elliptical",
  name: "橢圓機",
  pct: 100,
  level: "Product",
  children: [
    {
      id: "frame", name: "Frame", pct: 35, level: "Module",
      children: [
        { id: "f-steel", name: "鋼管", pct: 55, level: "Material", source: "ShouldCost" },
        { id: "f-paint", name: "塗裝",  pct: 18, level: "Process",  source: "AI" },
        { id: "f-weld",  name: "焊接",  pct: 15, level: "Process",  source: "AI" },
        { id: "f-screw", name: "螺絲零件", pct: 8, level: "Material", source: "ERP" },
        { id: "f-margin", name: "供應商毛利", pct: 4, level: "Margin", source: "AI" },
      ],
    },
    {
      id: "drive", name: "Drive", pct: 38, level: "Module",
      children: [
        {
          id: "motor", name: "Motor", pct: 41, level: "Part",
          children: [
            { id: "m-cu",      name: "銅",   pct: 42, level: "Material", source: "ShouldCost" },
            { id: "m-steel",   name: "鋼",   pct: 18, level: "Material", source: "ShouldCost" },
            { id: "m-magnet",  name: "磁鐵", pct: 15, level: "Material", source: "AI" },
            { id: "m-machine", name: "加工", pct: 12, level: "Process",  source: "AI" },
            { id: "m-freight", name: "運費", pct: 5,  level: "Logistics",source: "ERP" },
            { id: "m-pack",    name: "包材", pct: 3,  level: "Logistics",source: "ERP" },
            { id: "m-margin",  name: "毛利", pct: 5,  level: "Margin",   source: "AI" },
          ],
        },
        { id: "wire",     name: "Wire",     pct: 25, level: "Part",
          children: [
            { id: "w-cu",     name: "銅",   pct: 78, level: "Material", source: "ShouldCost" },
            { id: "w-pvc",    name: "PVC",  pct: 12, level: "Material", source: "AI" },
            { id: "w-process",name: "押出加工", pct: 6, level: "Process", source: "AI" },
            { id: "w-margin", name: "毛利", pct: 4,  level: "Margin", source: "AI" },
          ],
        },
        { id: "flywheel", name: "Flywheel", pct: 20, level: "Part",
          children: [
            { id: "fw-iron",   name: "鑄鐵",  pct: 68, level: "Material", source: "ShouldCost" },
            { id: "fw-balance",name: "平衡加工", pct: 22, level: "Process", source: "AI" },
            { id: "fw-margin", name: "毛利",   pct: 10, level: "Margin", source: "AI" },
          ],
        },
        { id: "bearing",  name: "Bearing",  pct: 10, level: "Part",
          children: [
            { id: "b-steel", name: "軸承鋼", pct: 60, level: "Material", source: "ShouldCost" },
            { id: "b-grease",name: "潤滑油脂", pct: 8, level: "Material", source: "AI" },
            { id: "b-process",name: "精密加工", pct: 24, level: "Process", source: "AI" },
            { id: "b-margin", name: "毛利", pct: 8, level: "Margin", source: "AI" },
          ],
        },
      ],
    },
    {
      id: "console", name: "Console", pct: 15, level: "Module",
      children: [
        { id: "c-pcb",    name: "PCB",    pct: 38, level: "Part",     source: "ERP" },
        { id: "c-lcd",    name: "LCD",    pct: 28, level: "Part",     source: "ERP" },
        { id: "c-plastic",name: "塑料外殼", pct: 18, level: "Material", source: "ShouldCost" },
        { id: "c-cable",  name: "線材",   pct: 8,  level: "Material", source: "AI" },
        { id: "c-margin", name: "毛利",   pct: 8,  level: "Margin",   source: "AI" },
      ],
    },
    {
      id: "packaging", name: "Packaging", pct: 10, level: "Module",
      children: [
        { id: "p-box",    name: "彩盒",   pct: 55, level: "Material", source: "ERP" },
        { id: "p-foam",   name: "EPE 緩衝", pct: 25, level: "Material", source: "ERP" },
        { id: "p-margin", name: "毛利",   pct: 20, level: "Margin", source: "AI" },
      ],
    },
    {
      id: "other", name: "Other", pct: 10, level: "Module",
      children: [
        { id: "o-labor",  name: "組裝人工", pct: 60, level: "Process", source: "AI" },
        { id: "o-qc",     name: "出貨檢驗", pct: 20, level: "Process", source: "AI" },
        { id: "o-margin", name: "Overhead", pct: 20, level: "Margin",  source: "AI" },
      ],
    },
  ],
};

const LEVEL_LABEL: Record<CBSNode["level"], string> = {
  Product: "整機", Module: "模組", Part: "零件",
  Material: "原料", Process: "加工", Logistics: "物流", Margin: "毛利",
};

const LEVEL_TONE: Record<CBSNode["level"], string> = {
  Product:   SC.primary,
  Module:    SC.blue,
  Part:      "#7a4fbf",
  Material:  SC.amber,
  Process:   SC.emerald,
  Logistics: SC.textSub,
  Margin:    SC.red,
};

const SOURCE_TONE: Record<NonNullable<CBSNode["source"]>, { bg: string; label: string }> = {
  ERP:        { bg: SC.blue,    label: "ERP" },
  ShouldCost: { bg: SC.emerald, label: "Should Cost" },
  AI:         { bg: SC.primary, label: "AI 推估" },
};

// 在樹中找節點 + 累積路徑
function findPath(root: CBSNode, id: string, path: CBSNode[] = []): CBSNode[] | null {
  const next = [...path, root];
  if (root.id === id) return next;
  if (!root.children) return null;
  for (const c of root.children) {
    const hit = findPath(c, id, next);
    if (hit) return hit;
  }
  return null;
}

export default function CBSPage() {
  const [activeId, setActiveId] = useState<string>("elliptical");
  const path = findPath(CBS_TREE, activeId) ?? [CBS_TREE];
  const current = path[path.length - 1];

  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        {/* Header */}
        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.primary, letterSpacing: "0.12em" }}>
            CBS · Cost Breakdown System
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">成本 DNA 引擎</h1>
          <p className="text-sm mt-2" style={{ color: SC.textSub }}>
            終極目的不是做一張漂亮成本表，而是建立：
            <span className="font-semibold mx-1" style={{ color: SC.text }}>原料 → 零件 → 模組 → 產品 → 毛利</span>
            的完整因果鏈。
          </p>
        </header>

        {/* ① ERP vs CBS 對比 ──「為什麼 ERP 不夠」 */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.primary, letterSpacing: "0.12em" }}>① WHY CBS</span>
            <h2 className="text-base font-semibold">ERP 看到 vs CBS 要看到</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>每個零件的成本 DNA</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* ERP */}
            <div className="rounded-md border p-4" style={{ borderColor: SC.border, background: SC.surfaceDim }}>
              <MiniLabel>ERP 看到</MiniLabel>
              <div className="mt-3 rounded border p-3 bg-white" style={{ borderColor: SC.border }}>
                <div className="text-xs font-bold">Motor</div>
                <div className="text-xl font-extrabold mt-1 tabular-nums">NT$1,000</div>
              </div>
              <div className="text-[11px] mt-3" style={{ color: SC.textSub }}>
                只看見「一個總額」 — 銅漲 8% 你完全不知道影響多少。
              </div>
            </div>
            {/* CBS */}
            <div className="rounded-md border p-4" style={{ borderColor: SC.primary, background: "#fff5f8" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.primary, letterSpacing: "0.12em" }}>CBS 要看到</div>
              <div className="mt-3 rounded border p-3 bg-white" style={{ borderColor: SC.border }}>
                <div className="text-xs font-bold mb-2">Motor — 成本 DNA</div>
                {[
                  { k: "銅",   v: 42, tone: SC.amber },
                  { k: "鋼",   v: 18, tone: SC.amber },
                  { k: "磁鐵", v: 15, tone: SC.amber },
                  { k: "加工", v: 12, tone: SC.emerald },
                  { k: "運費", v: 5,  tone: SC.textSub },
                  { k: "包材", v: 3,  tone: SC.textSub },
                  { k: "毛利", v: 5,  tone: SC.red },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between text-xs py-0.5">
                    <span>{r.k}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full" style={{ width: r.v * 2, background: r.tone, opacity: 0.8 }} />
                      <span className="tabular-nums font-mono text-[11px] w-8 text-right">{r.v}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] mt-3 font-semibold" style={{ color: SC.primary }}>
                銅漲 8% → 自動算出 Motor 漲 3.4% → Drive 漲 1.4% → 橢圓機毛利 ↓ 0.5%
              </div>
            </div>
          </div>
        </Card>

        {/* ② 三種建立 CBS 的方法 */}
        <Card accent={SC.blue}>
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.blue, letterSpacing: "0.12em" }}>② HOW</span>
            <h2 className="text-base font-semibold">三種建立 CBS 的方法</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>供應商願意給 → 不願意給，都有解</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <MethodCard
              rank="01"
              tone={SC.blue}
              title="ERP / 報價單拆解"
              subtitle="供應商願意給 BOM 時"
              steps={[
                { label: "資料來源", value: "BOM + 報價" },
                { label: "覆蓋率",   value: "10–20%" },
                { label: "信心度",   value: "95%" },
              ]}
              note="最直接，但大多數零組件供應商不願揭露。"
            />
            <MethodCard
              rank="02"
              tone={SC.emerald}
              title="Should Cost 反推"
              subtitle="你最適合做"
              steps={[
                { label: "重量",  value: "2.5 kg" },
                { label: "銅重",  value: "0.8 kg" },
                { label: "LME",   value: "9.47 USD/kg" },
                { label: "直接反推", value: "銅成本 = 0.8 × 9.47 = 7.58 USD" },
              ]}
              note="材料佔比 60%+，反推誤差 < 5% — 規模化最快。"
              recommended
            />
            <MethodCard
              rank="03"
              tone={SC.primary}
              title="AI 推估模型"
              subtitle="如果供應商不給"
              steps={[
                { label: "馬達類",   value: "✓" },
                { label: "歷史資料", value: "✓" },
                { label: "重量 / 尺寸 / 材質", value: "✓" },
                { label: "AI 估", value: "銅佔 35–45%" },
              ]}
              note="無從拆解時的兜底方案 — 用區間表示不確定性。"
            />
          </div>
        </Card>

        {/* ③ 三階段 Rollout */}
        <Card accent={SC.amber}>
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.amber, letterSpacing: "0.12em" }}>③ ROLLOUT</span>
            <h2 className="text-base font-semibold">三階段建置策略</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>Top 20 Spend → Top 100 → 全料號</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <PhaseCard
              phase="Phase 1"
              title="Top 20 Spend"
              scope="20 個料號"
              coverage="覆蓋 ~ 65% 採購金額"
              months="0 – 3 個月"
              status="進行中"
              tone={SC.emerald}
              progress={45}
            />
            <PhaseCard
              phase="Phase 2"
              title="Top 100 Spend"
              scope="100 個料號"
              coverage="覆蓋 ~ 85% 採購金額"
              months="3 – 9 個月"
              status="排程中"
              tone={SC.amber}
              progress={0}
            />
            <PhaseCard
              phase="Phase 3"
              title="全部料號 CBS Engine"
              scope="全 SKU"
              coverage="覆蓋 100% — AI 自動補齊"
              months="9 – 18 個月"
              status="規劃中"
              tone={SC.primary}
              progress={0}
            />
          </div>
        </Card>

        {/* ④ 互動式 Drill-Down ── 網頁如何呈現 */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white" style={{ background: SC.primary, letterSpacing: "0.12em" }}>④ DRILL-DOWN</span>
            <h2 className="text-base font-semibold">CBS 互動下鑽</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>點任一節點 → 展開下一層</span>
          </div>

          {/* Breadcrumb 路徑 */}
          <div className="flex items-center flex-wrap gap-1 text-xs mb-4 pb-3 border-b" style={{ borderColor: SC.border }}>
            {path.map((n, i) => (
              <span key={n.id} className="flex items-center gap-1">
                {i > 0 && <span style={{ color: SC.textSub }}>›</span>}
                <button
                  onClick={() => setActiveId(n.id)}
                  className="px-2 py-0.5 rounded transition-colors"
                  style={{
                    background: i === path.length - 1 ? "#fff5f8" : "transparent",
                    color: i === path.length - 1 ? SC.primary : SC.text,
                    fontWeight: i === path.length - 1 ? 700 : 500,
                    border: `1px solid ${i === path.length - 1 ? SC.primary : "transparent"}`,
                  }}
                >
                  {n.name}
                </button>
                <span className="text-[10px] px-1 rounded" style={{ background: LEVEL_TONE[n.level], color: "#fff" }}>
                  {LEVEL_LABEL[n.level]}
                </span>
              </span>
            ))}
            {path.length > 1 && (
              <button
                onClick={() => setActiveId("elliptical")}
                className="ml-auto text-[11px] underline"
                style={{ color: SC.blue }}
              >
                ↺ 回頂層
              </button>
            )}
          </div>

          {/* 當前節點 children */}
          {current.children && current.children.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px]" style={{ color: SC.textSub }}>
                點選下方任一項目下鑽 ──
                <span className="font-semibold mx-1" style={{ color: SC.text }}>{current.name}</span>
                由以下成分組成：
              </div>
              {current.children.map((c) => {
                const drillable = !!(c.children && c.children.length);
                return (
                  <button
                    key={c.id}
                    onClick={() => drillable && setActiveId(c.id)}
                    disabled={!drillable}
                    className="w-full text-left rounded-md border p-3 transition-all"
                    style={{
                      borderColor: drillable ? SC.border : SC.border,
                      background: drillable ? SC.surface : SC.surfaceDim,
                      cursor: drillable ? "pointer" : "default",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: LEVEL_TONE[c.level] }}>
                        {LEVEL_LABEL[c.level]}
                      </span>
                      <span className="font-semibold text-sm">{c.name}</span>
                      {c.source && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded text-white font-mono" style={{ background: SOURCE_TONE[c.source].bg, opacity: 0.85 }}>
                          {SOURCE_TONE[c.source].label}
                        </span>
                      )}
                      <div className="flex-1 flex items-center gap-2 ml-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: SC.surfaceDim }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(c.pct, 100)}%`, background: LEVEL_TONE[c.level], opacity: 0.85 }} />
                        </div>
                        <span className="text-base font-extrabold tabular-nums w-12 text-right" style={{ color: LEVEL_TONE[c.level] }}>
                          {c.pct}%
                        </span>
                      </div>
                      {drillable && <span className="text-base shrink-0" style={{ color: SC.textSub }}>›</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md p-4 text-xs" style={{ background: SC.surfaceDim, color: SC.textSub }}>
              已是最末層（原料 / 加工 / 物流 / 毛利）— 無法再下鑽。
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px]" style={{ borderColor: SC.border, color: SC.textSub }}>
            <span className="font-bold uppercase tracking-widest">層級：</span>
            {Object.entries(LEVEL_LABEL).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: LEVEL_TONE[k as CBSNode["level"]] }} />
                {v}
              </span>
            ))}
            <span className="ml-4 font-bold uppercase tracking-widest">來源：</span>
            {Object.entries(SOURCE_TONE).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: v.bg }} />
                {v.label}
              </span>
            ))}
          </div>
        </Card>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · CBS Engine · /erp/cbs</span>
          <Link href="/erp/profit-defense" style={{ color: SC.blue }} className="hover:underline">→ 連結到 Profit Defense（看 CBS 如何防守毛利）</Link>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MethodCard({
  rank, tone, title, subtitle, steps, note, recommended,
}: {
  rank: string; tone: string; title: string; subtitle: string;
  steps: { label: string; value: string }[]; note: string; recommended?: boolean;
}) {
  return (
    <div
      className="rounded-md border p-4 relative"
      style={{
        borderColor: recommended ? tone : SC.border,
        background: recommended ? "#f5fdf6" : SC.surface,
        borderWidth: recommended ? 2 : 1,
      }}
    >
      {recommended && (
        <span className="absolute -top-2 right-3 text-[9px] font-bold px-2 py-0.5 rounded text-white" style={{ background: tone, letterSpacing: "0.1em" }}>
          推薦
        </span>
      )}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white" style={{ background: tone }}>{rank}</span>
        <div className="font-semibold text-sm">{title}</div>
      </div>
      <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>{subtitle}</div>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-baseline justify-between text-[11px] border-b pb-1 last:border-0" style={{ borderColor: SC.border }}>
            <span style={{ color: SC.textSub }}>{s.label}</span>
            <span className="font-mono font-semibold" style={{ color: SC.text }}>{s.value}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] mt-3 leading-relaxed" style={{ color: SC.textSub }}>
        {note}
      </div>
    </div>
  );
}

function PhaseCard({
  phase, title, scope, coverage, months, status, tone, progress,
}: {
  phase: string; title: string; scope: string; coverage: string;
  months: string; status: string; tone: string; progress: number;
}) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: SC.border, background: SC.surface }}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tone, letterSpacing: "0.12em" }}>{phase}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: tone }}>{status}</span>
      </div>
      <div className="text-base font-semibold mb-2">{title}</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span style={{ color: SC.textSub }}>範圍</span><span className="font-semibold">{scope}</span></div>
        <div className="flex justify-between"><span style={{ color: SC.textSub }}>覆蓋</span><span className="font-semibold">{coverage}</span></div>
        <div className="flex justify-between"><span style={{ color: SC.textSub }}>時程</span><span className="font-mono">{months}</span></div>
      </div>
      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: SC.surfaceDim }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: tone }} />
      </div>
      <div className="text-[10px] mt-1 text-right" style={{ color: SC.textSub }}>{progress}% 完成</div>
    </div>
  );
}
