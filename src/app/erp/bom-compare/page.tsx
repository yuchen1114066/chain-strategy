"use client";

import { useState, useMemo } from "react";
import { models, parts, bom } from "@/lib/erp/seed";

// BOM 對照工具：兩個成品的 BOM 並排，自動標記
//   · 共用件（兩個都有）
//   · A 獨有
//   · B 獨有
//   · 用量差異（共用件但數量不同）

type CompareRow = {
  partCode: string;
  partName: string;
  spec: string;
  unit: string;
  unitCost: number;
  category: string;
  qtyA: number;
  qtyB: number;
  diff: "shared-same" | "shared-diff" | "only-a" | "only-b";
};

export default function BomComparePage() {
  const [codeA, setCodeA] = useState(models[0]?.code ?? "");
  const [codeB, setCodeB] = useState(models[1]?.code ?? models[0]?.code ?? "");

  const result = useMemo(() => compareBoms(codeA, codeB), [codeA, codeB]);

  return (
    <div className="p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold">🔍 BOM 對照工具</h1>
        <p className="text-sm text-slate-500 mt-1">
          兩個成品的 BOM 並排，自動標記共用 / 獨有 / 用量差異
        </p>
      </header>

      {/* Selector */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">產品 A</label>
            <select
              value={codeA}
              onChange={(e) => setCodeA(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {models.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} — {m.name}（{m.machineFamily}）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">產品 B</label>
            <select
              value={codeB}
              onChange={(e) => setCodeB(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {models.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} — {m.name}（{m.machineFamily}）
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="A 獨有" value={`${result.summary.onlyA}`} hint={`料件數`} tone="amber" />
        <Kpi label="B 獨有" value={`${result.summary.onlyB}`} hint={`料件數`} tone="amber" />
        <Kpi label="共用件 (同量)" value={`${result.summary.sharedSame}`} hint={`料件數`} tone="emerald" />
        <Kpi label="共用件 (異量)" value={`${result.summary.sharedDiff}`} hint={`料件數`} tone="cyan" />
      </section>

      {/* Cost / Reusability Summary */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="A 總料件數">
            <b className="text-base">{result.summary.totalA}</b>
            <span className="text-slate-500 ml-2">${result.summary.costA.toFixed(2)}</span>
          </Field>
          <Field label="B 總料件數">
            <b className="text-base">{result.summary.totalB}</b>
            <span className="text-slate-500 ml-2">${result.summary.costB.toFixed(2)}</span>
          </Field>
          <Field label="共用率">
            <b className="text-base text-cyan-700">
              {result.summary.totalA + result.summary.totalB > 0
                ? ((result.summary.sharedSame + result.summary.sharedDiff) * 2 /
                   (result.summary.totalA + result.summary.totalB) * 100).toFixed(0)
                : 0}%
            </b>
            <span className="text-slate-500 ml-2">兩邊都有的料件比例</span>
          </Field>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold">對照清單</h2>
          <div className="flex gap-2 text-[10px]">
            <Legend color="bg-emerald-100" text="共用同量" />
            <Legend color="bg-cyan-100" text="共用異量" />
            <Legend color="bg-amber-100" text="A 獨有" />
            <Legend color="bg-rose-100" text="B 獨有" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">料號 / 名稱</th>
              <th className="text-left px-3 py-2 font-semibold">分類 / 規格</th>
              <th className="text-right px-3 py-2 font-semibold bg-amber-50">A 用量</th>
              <th className="text-right px-3 py-2 font-semibold bg-rose-50">B 用量</th>
              <th className="text-right px-3 py-2 font-semibold">差異</th>
              <th className="text-right px-3 py-2 font-semibold">單價</th>
              <th className="text-left px-3 py-2 font-semibold">註記</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => {
              const rowTone = {
                "shared-same": "bg-emerald-50/40",
                "shared-diff": "bg-cyan-50/40",
                "only-a": "bg-amber-50/40",
                "only-b": "bg-rose-50/40",
              }[r.diff];
              const diffText = {
                "shared-same": "—",
                "shared-diff": `${r.qtyA > r.qtyB ? "+" : ""}${(r.qtyA - r.qtyB).toFixed(2)}`,
                "only-a": "A only",
                "only-b": "B only",
              }[r.diff];
              const note = {
                "shared-same": "✓ 完全共用",
                "shared-diff": `規格相同但用量差 ${Math.abs(r.qtyA - r.qtyB)}`,
                "only-a": `僅 ${codeA} 使用`,
                "only-b": `僅 ${codeB} 使用`,
              }[r.diff];
              return (
                <tr key={r.partCode} className={`border-t border-slate-100 ${rowTone}`}>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-cyan-700">{r.partCode}</div>
                    <div>{r.partName}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    <div>{r.category}</div>
                    {r.spec && <div className="text-slate-400">{r.spec}</div>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">
                    {r.qtyA > 0 ? `${r.qtyA} ${r.unit}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">
                    {r.qtyB > 0 ? `${r.qtyB} ${r.unit}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold tabular-nums">
                    {diffText}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    ${r.unitCost.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {result.rows.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">沒有比較資料 — 請選擇兩個有 BOM 的成品</p>
      )}
    </div>
  );
}

function compareBoms(codeA: string, codeB: string) {
  const modelA = models.find((m) => m.code === codeA);
  const modelB = models.find((m) => m.code === codeB);
  const linesA = modelA ? bom.filter((b) => b.modelId === modelA.id && b.isActive) : [];
  const linesB = modelB ? bom.filter((b) => b.modelId === modelB.id && b.isActive) : [];

  // 聚合到 part code（多階 BOM 中同一料可能出現多次）
  const aggA = new Map<string, number>();
  for (const l of linesA) {
    const p = parts.find((x) => x.id === l.partId);
    if (!p) continue;
    aggA.set(p.code, (aggA.get(p.code) ?? 0) + l.qtyPerUnit);
  }
  const aggB = new Map<string, number>();
  for (const l of linesB) {
    const p = parts.find((x) => x.id === l.partId);
    if (!p) continue;
    aggB.set(p.code, (aggB.get(p.code) ?? 0) + l.qtyPerUnit);
  }

  const allCodes = new Set([...aggA.keys(), ...aggB.keys()]);
  const rows: CompareRow[] = [];
  let costA = 0, costB = 0;
  let sharedSame = 0, sharedDiff = 0, onlyA = 0, onlyB = 0;

  for (const code of allCodes) {
    const p = parts.find((x) => x.code === code);
    if (!p) continue;
    const qtyA = aggA.get(code) ?? 0;
    const qtyB = aggB.get(code) ?? 0;
    costA += qtyA * p.unitCost;
    costB += qtyB * p.unitCost;
    let diff: CompareRow["diff"];
    if (qtyA > 0 && qtyB > 0) {
      diff = Math.abs(qtyA - qtyB) < 0.001 ? "shared-same" : "shared-diff";
      if (diff === "shared-same") sharedSame++; else sharedDiff++;
    } else if (qtyA > 0) {
      diff = "only-a";
      onlyA++;
    } else {
      diff = "only-b";
      onlyB++;
    }
    rows.push({
      partCode: code,
      partName: p.name,
      spec: p.spec ?? "",
      unit: p.unit,
      unitCost: p.unitCost,
      category: p.category,
      qtyA, qtyB, diff,
    });
  }

  // 排序：共用件先（按 cost desc），再 A only，再 B only
  rows.sort((a, b) => {
    const order = { "shared-same": 0, "shared-diff": 1, "only-a": 2, "only-b": 3 };
    if (order[a.diff] !== order[b.diff]) return order[a.diff] - order[b.diff];
    return (b.qtyA + b.qtyB) * b.unitCost - (a.qtyA + a.qtyB) * a.unitCost;
  });

  return {
    rows,
    summary: {
      totalA: aggA.size, totalB: aggB.size,
      costA, costB,
      sharedSame, sharedDiff, onlyA, onlyB,
    },
  };
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "cyan" | "amber" | "emerald" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-700">
      <span className={`w-3 h-3 rounded ${color} border border-slate-300`} />
      {text}
    </span>
  );
}
