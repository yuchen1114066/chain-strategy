"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { parts as allParts, suppliers } from "@/lib/erp/seed";
import { initialSlips } from "@/lib/erp/warehouse";

// 倉庫盤點實盤對照工具
//
// 流程：
//   1. 選擇要盤點的倉位（或全廠）
//   2. 系統列出 ERP 該區所有料件 + ERP 顯示數量
//   3. 倉管針對每筆：✓ 一致 / ⚠ 不符（輸入實際數量）
//   4. 即時統計：已盤 / 一致 / 不符 / 差異總值
//   5. 產出「需 ERP 對帳」CSV → PM 拿到鼎新調整

type Verdict = "" | "ok" | "diff";

type CountState = {
  partCode: string;
  verdict: Verdict;
  actualQty: number | null;
  note: string;
};

// 從 slip 推出每個料件最常見的倉位
function inferLocation(partCode: string): string {
  for (const s of initialSlips) {
    for (const it of s.items) {
      if (it.partCode === partCode && it.location) return it.location;
    }
  }
  return "—";
}

// 全廠倉位列表（demo）
const KNOWN_LOCATIONS = ["全廠", "A100", "A100-B2", "A100-B2-04", "A100-B3-12", "A100-B5", "IQC-A01"];

export default function CycleCountPage() {
  const [location, setLocation] = useState<string>("全廠");
  const [operator, setOperator] = useState<string>("林倉管");
  const [states, setStates] = useState<Map<string, CountState>>(new Map());

  // 依 location filter parts（只看採購件，自製/虛設不盤）
  const targetParts = useMemo(() => {
    const purchaseOnly = allParts.filter((p) => !p.kind || p.kind === "purchase" || p.kind === "outsource");
    if (location === "全廠") return purchaseOnly;
    return purchaseOnly.filter((p) => {
      const loc = inferLocation(p.code);
      return loc.startsWith(location);
    });
  }, [location]);

  function updateState(partCode: string, patch: Partial<CountState>) {
    setStates((prev) => {
      const next = new Map(prev);
      const ex = next.get(partCode) ?? { partCode, verdict: "", actualQty: null, note: "" };
      next.set(partCode, { ...ex, ...patch });
      return next;
    });
  }

  // 統計
  const countedRows = [...states.values()].filter((s) => s.verdict);
  const okCount = countedRows.filter((s) => s.verdict === "ok").length;
  const diffCount = countedRows.filter((s) => s.verdict === "diff").length;
  const remaining = targetParts.length - countedRows.length;

  // 差異總值
  const totalDiffValue = countedRows
    .filter((s) => s.verdict === "diff")
    .reduce((acc, s) => {
      const p = allParts.find((x) => x.code === s.partCode);
      if (!p || s.actualQty == null) return acc;
      return acc + (s.actualQty - p.stockOnHand) * p.unitCost;
    }, 0);

  // CSV 匯出
  function exportCsv() {
    const headers = [
      "料號", "品名", "規格", "單位", "倉位", "ERP 庫存", "實盤數量",
      "差異", "差異金額", "盤點結果", "備註", "盤點人", "盤點時間",
    ];
    const rows = countedRows.map((s) => {
      const p = allParts.find((x) => x.code === s.partCode);
      const actual = s.actualQty ?? p?.stockOnHand ?? 0;
      const diff = actual - (p?.stockOnHand ?? 0);
      const diffValue = diff * (p?.unitCost ?? 0);
      const verdict = s.verdict === "ok" ? "一致" : "不符";
      return [
        p?.code ?? s.partCode,
        p?.name ?? "",
        p?.spec ?? "",
        p?.unit ?? "",
        inferLocation(s.partCode),
        p?.stockOnHand ?? 0,
        actual,
        diff,
        diffValue.toFixed(2),
        verdict,
        s.note,
        operator,
        new Date().toISOString().slice(0, 19).replace("T", " "),
      ];
    });
    const csv = "﻿" + [headers, ...rows].map((r) =>
      r.map((c) => {
        const s = String(c ?? "");
        return s.includes(",") || s.includes("\"") || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `盤點對帳-${location}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <Link href="/erp/mobile" className="text-xs text-cyan-700 hover:underline">← 返回 QR 查碼</Link>
          <h1 className="text-2xl font-bold mt-1">📋 倉庫盤點對照</h1>
          <p className="text-sm text-slate-500 mt-1">
            掃 QR / 看 ERP 數字 → 對照實際箱數 → 不符標記 → 產出 CSV 給 PM 至鼎新調整
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-800">資料同步鼎新 ERP</span>
        </div>
      </header>

      {/* 控制列 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">盤點範圍</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {KNOWN_LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">盤點人員</label>
            <input
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={exportCsv}
              disabled={countedRows.length === 0}
              className="flex-1 px-4 py-2 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold"
            >
              📥 匯出對帳 CSV（{countedRows.length}）
            </button>
          </div>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="待盤" value={`${remaining}`} sub={`共 ${targetParts.length} 項`} />
        <Kpi label="✓ 一致" value={`${okCount}`} tone="emerald" />
        <Kpi label="⚠ 不符" value={`${diffCount}`} tone="rose" />
        <Kpi
          label="差異金額"
          value={`${totalDiffValue >= 0 ? "+" : ""}$${totalDiffValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          tone={totalDiffValue !== 0 ? "amber" : undefined}
          sub="實盤 - ERP"
        />
      </section>

      {/* 盤點清單 */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-xs text-slate-500">
          {targetParts.length === 0
            ? "此倉位無料件記錄"
            : `${targetParts.length} 個料件待盤點　·　依倉位排序　·　空白為未盤點`}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2 font-semibold w-12">序</th>
              <th className="text-left px-3 py-2 font-semibold">料號 / 名稱</th>
              <th className="text-left px-3 py-2 font-semibold">倉位</th>
              <th className="text-right px-3 py-2 font-semibold">ERP 庫存</th>
              <th className="text-right px-3 py-2 font-semibold">實盤</th>
              <th className="text-center px-3 py-2 font-semibold">結果</th>
              <th className="text-left px-3 py-2 font-semibold">備註</th>
            </tr>
          </thead>
          <tbody>
            {targetParts.map((p, i) => {
              const s = states.get(p.code);
              const verdict = s?.verdict ?? "";
              const actual = s?.actualQty;
              const diff = actual != null ? actual - p.stockOnHand : null;
              const rowTone =
                verdict === "ok" ? "bg-emerald-50/40" :
                verdict === "diff" ? "bg-rose-50/40" : "";
              const supName = suppliers.find((sp) => sp.id === p.supplierId)?.name ?? "—";
              return (
                <tr key={p.id} className={`border-t border-slate-100 ${rowTone}`}>
                  <td className="px-3 py-2 text-xs text-slate-400 text-center">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-cyan-700">{p.code}</div>
                    <div>{p.name}</div>
                    {p.spec && <div className="text-[10px] text-slate-500">{p.spec}</div>}
                    <div className="text-[10px] text-slate-400">{supName}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{inferLocation(p.code)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">
                    {p.stockOnHand} <span className="text-xs text-slate-500">{p.unit}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      placeholder={`${p.stockOnHand}`}
                      value={actual ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                          updateState(p.code, { actualQty: null });
                          return;
                        }
                        const n = parseInt(v);
                        updateState(p.code, { actualQty: isNaN(n) ? null : n });
                      }}
                      className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right tabular-nums"
                    />
                    {diff != null && diff !== 0 && (
                      <div className={`text-[10px] mt-0.5 font-bold tabular-nums ${diff > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {diff > 0 ? "+" : ""}{diff}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => updateState(p.code, { verdict: "ok", actualQty: p.stockOnHand })}
                        className={`text-xs px-2 py-1 rounded font-bold ${verdict === "ok"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-emerald-100"}`}
                      >
                        ✓ 一致
                      </button>
                      <button
                        onClick={() => updateState(p.code, { verdict: "diff", actualQty: actual ?? p.stockOnHand })}
                        className={`text-xs px-2 py-1 rounded font-bold ${verdict === "diff"
                          ? "bg-rose-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-rose-100"}`}
                      >
                        ⚠ 不符
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      placeholder="—"
                      value={s?.note ?? ""}
                      onChange={(e) => updateState(p.code, { note: e.target.value })}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
        <b>📌 提醒：</b>
        本工具不寫入 ERP。盤點完成後請按 <b>「📥 匯出對帳 CSV」</b> 把不符項目交給 PM，
        由 PM 在鼎新 ERP iGP 系統執行庫存調整（走 sp_axmt450_inv_adj 或人工調整單）。
      </section>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" | "rose" | "amber" }) {
  const cls =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border-2 px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
