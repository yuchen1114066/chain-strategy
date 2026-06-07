import { parts, models, suppliers, bom, workOrders } from "@/lib/erp/seed";
import { STAGES } from "@/lib/erp/types";

// 顏色盤
const PALETTE = [
  "#0891b2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#84cc16", "#f97316", "#6366f1",
  "#06b6d4", "#22c55e", "#eab308", "#dc2626", "#a855f7",
  "#db2777", "#0ea5e9", "#65a30d",
];
const colorFor = (i: number) => PALETTE[i % PALETTE.length];

export default function VizDashboardPage() {
  // ========== 預處理 ==========
  const totalStockValue = parts.reduce((s, p) => s + p.stockOnHand * p.unitCost, 0);

  // 分類分布
  const byCategory = new Map<string, { count: number; value: number }>();
  for (const p of parts) {
    const c = p.category;
    const ex = byCategory.get(c) ?? { count: 0, value: 0 };
    ex.count += 1;
    ex.value += p.stockOnHand * p.unitCost;
    byCategory.set(c, ex);
  }
  const categories = [...byCategory.entries()]
    .map(([cat, v], i) => ({ cat, ...v, color: colorFor(i) }))
    .sort((a, b) => b.value - a.value);

  // 國家分布
  const byCountry = new Map<string, { partCount: number; value: number; supCount: number }>();
  for (const sup of suppliers) {
    const ex = byCountry.get(sup.country) ?? { partCount: 0, value: 0, supCount: 0 };
    ex.supCount += 1;
    byCountry.set(sup.country, ex);
  }
  for (const p of parts) {
    const sup = suppliers.find((s) => s.id === p.supplierId);
    if (!sup) continue;
    const ex = byCountry.get(sup.country) ?? { partCount: 0, value: 0, supCount: 0 };
    ex.partCount += 1;
    ex.value += p.stockOnHand * p.unitCost;
    byCountry.set(sup.country, ex);
  }
  const countries = [...byCountry.entries()]
    .map(([country, v], i) => ({ country, ...v, color: colorFor(i + 3) }))
    .sort((a, b) => b.value - a.value);

  // 供應商 top 10 by stock value
  const bySupplier = new Map<string, { value: number; parts: number; name: string }>();
  for (const p of parts) {
    const sup = suppliers.find((s) => s.id === p.supplierId);
    if (!sup) continue;
    const ex = bySupplier.get(sup.id) ?? { value: 0, parts: 0, name: sup.name };
    ex.value += p.stockOnHand * p.unitCost;
    ex.parts += 1;
    bySupplier.set(sup.id, ex);
  }
  const topSuppliers = [...bySupplier.values()].sort((a, b) => b.value - a.value).slice(0, 10);
  const maxSupValue = Math.max(...topSuppliers.map((s) => s.value), 1);

  // 共用零件矩陣（model × top 共用零件）
  const partUsage = new Map<string, { code: string; name: string; modelCodes: Set<string>; qtyMap: Map<string, number> }>();
  for (const b of bom) {
    if (!b.isActive) continue;
    const p = parts.find((x) => x.id === b.partId);
    const m = models.find((x) => x.id === b.modelId);
    if (!p || !m) continue;
    const ex = partUsage.get(p.id) ?? { code: p.code, name: p.name, modelCodes: new Set(), qtyMap: new Map() };
    ex.modelCodes.add(m.code);
    ex.qtyMap.set(m.code, (ex.qtyMap.get(m.code) ?? 0) + b.qtyPerUnit);
    partUsage.set(p.id, ex);
  }
  const sharedTop = [...partUsage.values()]
    .filter((p) => p.modelCodes.size >= 2)
    .sort((a, b) => b.modelCodes.size - a.modelCodes.size)
    .slice(0, 12);

  const allModelCodes = models.map((m) => m.code);

  // BOM 成本組成（每個成品的 BOM 展開後成本分佈）
  const modelCosts = models.map((m) => {
    const lines = bom.filter((b) => b.modelId === m.id && b.isActive && (b.level ?? 1) === 1);
    const segments: { partCode: string; partName: string; cost: number; color: string }[] = [];
    let total = 0;
    lines.forEach((l, i) => {
      const p = parts.find((x) => x.id === l.partId);
      if (!p) return;
      const cost = p.unitCost * l.qtyPerUnit;
      total += cost;
      segments.push({ partCode: p.code, partName: p.name, cost, color: colorFor(i) });
    });
    segments.sort((a, b) => b.cost - a.cost);
    return { model: m, segments, total };
  }).filter((mc) => mc.total > 0);

  // 階段流量
  const stageFlow = STAGES.map((s, i) => {
    const seq = i + 1;
    const wos = workOrders.filter((w) => {
      const inprog = w.stages.find((s) => s.status === "in_progress");
      if (inprog) return inprog.seq === seq;
      const next = w.stages.find((s) => s.status !== "done");
      return next?.seq === seq;
    });
    const value = wos.reduce((s, w) => {
      const m = models.find((m) => m.id === w.modelId);
      return s + (m ? m.stdPrice * w.qty : 0);
    }, 0);
    return { ...s, count: wos.length, value };
  });
  const maxStageCount = Math.max(...stageFlow.map((s) => s.count), 1);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📈 可視化儀表板</h1>
        <p className="text-sm text-slate-500 mt-1">
          祺驊 ERP 資料視覺化全景 — 4 份 xlsx 真實 BOM 解析後的洞察圖
        </p>
      </header>

      {/* ============ Row 1: 庫存分類 Donut + 國家分布 Donut + Top 5 KPI ============ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DonutCard
          title="📂 庫存價值依分類"
          subtitle={`總值 $${(totalStockValue / 10000).toFixed(0)}萬`}
          slices={categories}
          totalValue={totalStockValue}
          labelKey="cat"
        />
        <DonutCard
          title="🌏 庫存價值依供應商國家"
          subtitle={`${suppliers.length} 家供應商`}
          slices={countries.map((c) => ({ cat: c.country, value: c.value, color: c.color, count: c.partCount }))}
          totalValue={totalStockValue}
          labelKey="cat"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold mb-3">🎯 全景 KPI</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border-b pb-1.5 last:border-0">
              <span className="text-slate-600">機型 / 成品</span>
              <span className="font-bold tabular-nums">{new Set(models.map((m) => m.machineFamily)).size} / {models.length}</span>
            </li>
            <li className="flex justify-between border-b pb-1.5 last:border-0">
              <span className="text-slate-600">零件總數</span>
              <span className="font-bold tabular-nums">{parts.length}</span>
            </li>
            <li className="flex justify-between border-b pb-1.5 last:border-0">
              <span className="text-slate-600">供應商</span>
              <span className="font-bold tabular-nums">{suppliers.length} 家</span>
            </li>
            <li className="flex justify-between border-b pb-1.5 last:border-0">
              <span className="text-slate-600">BOM 線總數</span>
              <span className="font-bold tabular-nums">{bom.filter((b) => b.isActive).length}</span>
            </li>
            <li className="flex justify-between border-b pb-1.5 last:border-0">
              <span className="text-slate-600">共用零件</span>
              <span className="font-bold tabular-nums">{[...partUsage.values()].filter((p) => p.modelCodes.size >= 2).length}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">最大共用度</span>
              <span className="font-bold tabular-nums">{Math.max(...[...partUsage.values()].map((p) => p.modelCodes.size), 0)} 個成品</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ============ Row 2: 供應商 Top 10 Bar Race ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold mb-3">🏭 供應商集中度 Top 10（依在庫金額）</h3>
        <div className="space-y-2">
          {topSuppliers.map((s, i) => {
            const pct = (s.value / maxSupValue) * 100;
            const pctTotal = (s.value / totalStockValue) * 100;
            return (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-24 text-xs font-semibold text-right shrink-0">
                  <span className="text-slate-400 mr-1">#{i + 1}</span>{s.name}
                </div>
                <div className="flex-1 relative h-8 bg-slate-50 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colorFor(i)} 0%, ${colorFor(i)}dd 100%)` }}
                  />
                  <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-white mix-blend-difference">
                    ${s.value.toLocaleString()} · {s.parts} 料件
                  </span>
                </div>
                <div className={`w-12 text-right text-xs tabular-nums shrink-0 ${pctTotal > 15 ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                  {pctTotal.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          % 為佔全廠總庫存金額比例 — 超過 15% 標紅（建議簽長期合約或找備援）
        </p>
      </section>

      {/* ============ Row 3: 共用零件矩陣（heatmap） ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 overflow-x-auto">
        <h3 className="font-bold mb-1">🔄 共用零件矩陣（Top 12 共用件 × 全部成品）</h3>
        <p className="text-xs text-slate-500 mb-3">
          有色 = 該零件被該成品使用；數字 = 單台用量。顏色越深表示用量越多
        </p>
        <table className="text-[11px]" style={{ borderCollapse: "separate", borderSpacing: 1 }}>
          <thead>
            <tr>
              <th className="text-left px-2 py-1 sticky left-0 bg-white"></th>
              {allModelCodes.map((mc) => (
                <th key={mc} className="px-1 py-1">
                  <div className="text-[9px] text-slate-600 font-mono" style={{ writingMode: "vertical-rl", textOrientation: "mixed", height: 80 }}>
                    {mc}
                  </div>
                </th>
              ))}
              <th className="text-center px-2 py-1 text-slate-500">共用度</th>
            </tr>
          </thead>
          <tbody>
            {sharedTop.map((sp) => {
              const maxQty = Math.max(...[...sp.qtyMap.values()]);
              return (
                <tr key={sp.code}>
                  <td className="text-right px-2 py-0.5 sticky left-0 bg-white whitespace-nowrap">
                    <span className="font-mono text-slate-500 mr-2">{sp.code}</span>
                    <span className="text-slate-700">{sp.name}</span>
                  </td>
                  {allModelCodes.map((mc) => {
                    const qty = sp.qtyMap.get(mc);
                    const intensity = qty ? Math.min(1, qty / maxQty) : 0;
                    const bg = qty ? `rgba(8, 145, 178, ${0.25 + 0.6 * intensity})` : "transparent";
                    return (
                      <td
                        key={mc}
                        title={qty ? `${sp.code} 用於 ${mc} ×${qty}` : ""}
                        className="text-center text-white font-bold tabular-nums"
                        style={{
                          background: bg,
                          width: 32, height: 22,
                          color: qty ? "#fff" : "transparent",
                          border: qty ? "" : "1px solid #f1f5f9",
                        }}
                      >
                        {qty ? (qty < 1 ? qty.toFixed(2) : qty) : ""}
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-0.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold">
                      {sp.modelCodes.size}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ============ Row 4: 庫存金額 Treemap ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold mb-1">💰 庫存金額 Treemap（前 24 大）</h3>
        <p className="text-xs text-slate-500 mb-3">
          方塊面積 = 該料件在庫金額。最大方塊 = 你最該盯的 A 類料
        </p>
        <Treemap parts={
          [...parts]
            .map((p) => ({ code: p.code, name: p.name, value: p.stockOnHand * p.unitCost }))
            .filter((p) => p.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 24)
        } />
      </section>

      {/* ============ Row 5: 成品 BOM 成本組成 stacked bar ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold mb-1">🏗️ 成品 BOM 成本組成（Level 1）</h3>
        <p className="text-xs text-slate-500 mb-3">
          每個成品最大零件 = 最關鍵的成本驅動。對主要成品來說，最大那塊往往是飛輪或軸心
        </p>
        <div className="space-y-3">
          {modelCosts.map(({ model, segments, total }) => (
            <div key={model.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div>
                  <span className="font-mono font-semibold text-cyan-700">{model.code}</span>
                  <span className="text-slate-500 ml-2">{model.machineFamily}</span>
                </div>
                <span className="tabular-nums font-bold">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex h-6 rounded overflow-hidden border border-slate-200">
                {segments.map((seg) => {
                  const pct = (seg.cost / total) * 100;
                  return (
                    <div
                      key={seg.partCode}
                      title={`${seg.partCode} ${seg.partName} $${seg.cost.toFixed(2)} (${pct.toFixed(1)}%)`}
                      style={{ width: `${pct}%`, background: seg.color }}
                      className="flex items-center justify-center text-[9px] text-white font-bold overflow-hidden whitespace-nowrap"
                    >
                      {pct > 8 ? seg.partCode : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Row 6: 階段流量 Sankey-ish ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold mb-3">🌊 階段流量視覺（在製工單分布）</h3>
        <div className="flex items-end gap-1 h-32">
          {stageFlow.map((s, i) => {
            const h = (s.count / maxStageCount) * 100;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center">
                <div className="text-[10px] font-bold tabular-nums">{s.count}</div>
                <div
                  className="w-full rounded-t transition-all"
                  style={{ height: `${h}%`, background: colorFor(i) }}
                />
                <div className="text-[10px] mt-1 text-center">{s.icon}<br /><span className="text-slate-600">{s.label}</span></div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// =================== Donut Chart ===================
function DonutCard({
  title, subtitle, slices, totalValue,
}: {
  title: string; subtitle: string;
  slices: { cat: string; value: number; color: string; count?: number }[];
  totalValue: number;
  labelKey: string;
}) {
  const R = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 24;
  const circ = 2 * Math.PI * R;
  // Pre-compute per-slice (length, offset) without mutating during render
  const arcs = slices.reduce<{ list: { cat: string; color: string; value: number; len: number; offset: number }[]; acc: number }>(
    (a, s) => {
      const len = totalValue > 0 ? (s.value / totalValue) * circ : 0;
      a.list.push({ cat: s.cat, color: s.color, value: s.value, len, offset: a.acc });
      return { list: a.list, acc: a.acc + len };
    },
    { list: [], acc: 0 }
  ).list;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-slate-500 mb-2">{subtitle}</p>
      <div className="flex items-center gap-4">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {arcs.map((a) => (
            <circle
              key={a.cat}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${a.len} ${circ - a.len}`}
              strokeDashoffset={-a.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            >
              <title>{a.cat}: ${a.value.toLocaleString()}</title>
            </circle>
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-700 text-xs font-bold">
            {slices.length}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-500 text-[10px]">
            類別
          </text>
        </svg>
        <ul className="flex-1 text-[11px] space-y-1 max-h-[160px] overflow-y-auto">
          {slices.slice(0, 10).map((s) => {
            const pct = totalValue > 0 ? (s.value / totalValue) * 100 : 0;
            return (
              <li key={s.cat} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="truncate flex-1">{s.cat}</span>
                <span className="tabular-nums text-slate-500">{pct.toFixed(1)}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// =================== Treemap（squarified-lite） ===================
function Treemap({ parts }: { parts: { code: string; name: string; value: number }[] }) {
  // 簡化版 treemap：依面積比例做 row-based layout
  const total = parts.reduce((s, p) => s + p.value, 0);
  const W = 920;
  const H = 320;
  if (total === 0) return <p className="text-xs text-slate-500">無資料</p>;

  // Greedy strip layout
  type Rect = { code: string; name: string; value: number; x: number; y: number; w: number; h: number };
  const rects: Rect[] = [];
  let y = 0;
  let rowItems: typeof parts = [];
  let rowValue = 0;
  const totalNorm = total;

  function flushRow(startIdx: number, endIdx: number) {
    const rowArea = rowValue * (W * H) / totalNorm;
    const h = rowArea / W;
    let x = 0;
    for (let i = startIdx; i < endIdx; i++) {
      const p = parts[i];
      const w = (p.value / rowValue) * W;
      rects.push({ code: p.code, name: p.name, value: p.value, x, y, w, h });
      x += w;
    }
    y += h;
  }

  // Group items into rows of ~ ceil(N/4) items each (simple)
  const rowCount = 4;
  const itemsPerRow = Math.ceil(parts.length / rowCount);
  let lastIdx = 0;
  for (let r = 0; r < rowCount; r++) {
    const endIdx = Math.min(parts.length, lastIdx + itemsPerRow);
    rowValue = 0;
    rowItems = [];
    for (let i = lastIdx; i < endIdx; i++) {
      rowValue += parts[i].value;
      rowItems.push(parts[i]);
    }
    if (rowItems.length > 0) flushRow(lastIdx, endIdx);
    lastIdx = endIdx;
  }

  return (
    <svg viewBox={`0 0 ${W} ${y}`} className="w-full" style={{ maxHeight: 320 }}>
      {rects.map((r, i) => {
        const color = colorFor(i);
        const pct = (r.value / total) * 100;
        const showLabel = r.w > 60 && r.h > 28;
        return (
          <g key={r.code}>
            <rect x={r.x} y={r.y} width={r.w - 2} height={r.h - 2} fill={color} rx={3}>
              <title>{`${r.code} ${r.name}: $${r.value.toLocaleString()} (${pct.toFixed(1)}%)`}</title>
            </rect>
            {showLabel && (
              <>
                <text x={r.x + 6} y={r.y + 14} fill="white" fontSize={11} fontFamily="monospace" fontWeight="bold">
                  {r.code}
                </text>
                <text x={r.x + 6} y={r.y + 28} fill="white" fontSize={9} opacity={0.9}>
                  ${(r.value / 1000).toFixed(1)}k · {pct.toFixed(1)}%
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
