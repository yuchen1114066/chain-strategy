"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { parts as allParts } from "@/lib/erp/seed";
import { initialSlips } from "@/lib/erp/warehouse";

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  page: "#fbfcfa", card: "#ffffff",
  border: "#e9ece3", borderHi: "#dadfd0",
  red: "#d4351c", redSoft: "#fdecea",
  amber: "#b8860b", amberSoft: "#fffaf0",
  cyan: "#0891b2", cyanSoft: "#ecfeff",
} as const;
const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";

type Verdict = "" | "ok" | "diff";
type CountState = { partCode: string; verdict: Verdict; actualQty: number | null; note: string };

function inferLocation(partCode: string): string {
  for (const s of initialSlips) {
    for (const it of s.items) {
      if (it.partCode === partCode && it.location) return it.location;
    }
  }
  return "—";
}

const KNOWN_LOCATIONS = ["全廠", "A100", "A100-B2", "A100-B2-04", "A100-B3-12", "A100-B5", "IQC-A01"];

export default function CycleCountPage() {
  const [location, setLocation] = useState<string>("全廠");
  const [operator, setOperator] = useState<string>("");
  const [states, setStates] = useState<Map<string, CountState>>(new Map());
  const [filter, setFilter] = useState<"all" | "pending" | "ok" | "diff">("all");

  const targetParts = useMemo(() => {
    const purchaseOnly = allParts.filter((p) => !p.kind || p.kind === "purchase" || p.kind === "outsource");
    if (location === "全廠") return purchaseOnly;
    return purchaseOnly.filter((p) => inferLocation(p.code).startsWith(location));
  }, [location]);

  const filteredParts = useMemo(() => {
    if (filter === "all") return targetParts;
    return targetParts.filter((p) => {
      const s = states.get(p.code);
      if (filter === "pending") return !s?.verdict;
      return s?.verdict === filter;
    });
  }, [targetParts, states, filter]);

  function updateState(partCode: string, patch: Partial<CountState>) {
    setStates((prev) => {
      const next = new Map(prev);
      const ex = next.get(partCode) ?? { partCode, verdict: "", actualQty: null, note: "" };
      next.set(partCode, { ...ex, ...patch });
      return next;
    });
  }

  const countedRows = [...states.values()].filter((s) => s.verdict);
  const okCount = countedRows.filter((s) => s.verdict === "ok").length;
  const diffCount = countedRows.filter((s) => s.verdict === "diff").length;
  const remaining = targetParts.length - countedRows.length;

  function exportCsv() {
    const headers = ["料號", "品名", "規格", "單位", "倉位", "ERP 庫存", "實盤數量", "差異", "盤點結果", "備註", "盤點人", "盤點時間"];
    const rows = countedRows.map((s) => {
      const p = allParts.find((x) => x.code === s.partCode);
      const actual = s.actualQty ?? p?.stockOnHand ?? 0;
      const diff = actual - (p?.stockOnHand ?? 0);
      return [
        p?.code ?? s.partCode, p?.name ?? "", p?.spec ?? "", p?.unit ?? "",
        inferLocation(s.partCode), p?.stockOnHand ?? 0, actual, diff,
        s.verdict === "ok" ? "一致" : "不符",
        s.note, operator || "—", new Date().toISOString().slice(0, 19).replace("T", " "),
      ];
    });
    const csv = "﻿" + [headers, ...rows].map((r) =>
      r.map((c) => {
        const s = String(c ?? "");
        return s.includes(",") || s.includes("\"") || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `盤點對帳-${location}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100dvh", background: BR.page, fontFamily: FONT, color: BR.ink, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: BR.greenInk, color: "#fff", padding: "10px 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/erp/mobile/scan"
            style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            ← 掃描
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.1em", fontFamily: "'Sora', sans-serif" }}>CHI HUA · WAREHOUSE</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>倉庫盤點對照</div>
          </div>
          <Link
            href="/erp/mobile/material-card"
            style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            📋 進出卡
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* 控制列 */}
        <div style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${BR.border}`, padding: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BR.inkFaint, marginBottom: 4 }}>盤點範圍</div>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${BR.borderHi}`, background: "#fff", fontFamily: FONT }}
              >
                {KNOWN_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BR.inkFaint, marginBottom: 4 }}>盤點人員</div>
              <input
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="輸入姓名"
                style={{ width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${BR.borderHi}`, background: "#fff", fontFamily: FONT }}
              />
            </div>
          </div>
          <button
            onClick={exportCsv}
            disabled={countedRows.length === 0}
            style={{
              width: "100%", marginTop: 12, padding: "12px", fontSize: 14, fontWeight: 700,
              borderRadius: 10, border: "none", cursor: countedRows.length === 0 ? "not-allowed" : "pointer",
              background: countedRows.length === 0 ? BR.inkFaint : BR.cyan, color: "#fff", fontFamily: FONT,
            }}
          >
            📥 匯出對帳 CSV（{countedRows.length} 筆）
          </button>
        </div>

        {/* KPI 卡片 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <KpiCard label="待盤" value={`${remaining}`} sub={`共 ${targetParts.length} 項`} />
          <KpiCard label="✓ 一致" value={`${okCount}`} bg="#ecfdf5" borderColor="#a7f3d0" color="#059669" />
          <KpiCard label="⚠ 不符" value={`${diffCount}`} bg={BR.redSoft} borderColor="#fca5a5" color={BR.red} />
          <KpiCard label="完成率" value={`${targetParts.length > 0 ? Math.round(countedRows.length / targetParts.length * 100) : 0}%`} sub={`${countedRows.length} / ${targetParts.length}`} />
        </div>

        {/* 篩選列 */}
        <div style={{ display: "flex", gap: 6 }}>
          {([["all", "全部"], ["pending", "待盤"], ["ok", "一致"], ["diff", "不符"]] as [typeof filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 700, borderRadius: 8, border: "none", cursor: "pointer",
                background: filter === id ? BR.greenInk : "#fff",
                color: filter === id ? "#fff" : BR.inkSoft,
                fontFamily: FONT,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 盤點清單 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredParts.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: BR.inkFaint, fontSize: 13 }}>
              {targetParts.length === 0 ? "此倉位無料件記錄" : "無符合條件的料件"}
            </div>
          )}
          {filteredParts.map((p, i) => {
            const s = states.get(p.code);
            const verdict = s?.verdict ?? "";
            const actual = s?.actualQty;
            const diff = actual != null ? actual - p.stockOnHand : null;
            const loc = inferLocation(p.code);

            const cardBorder = verdict === "ok" ? "#a7f3d0" : verdict === "diff" ? "#fca5a5" : BR.border;
            const cardBg = verdict === "ok" ? "#f0fdf4" : verdict === "diff" ? "#fef2f2" : "#fff";

            return (
              <div key={p.id} style={{ background: cardBg, borderRadius: 14, border: `1.5px solid ${cardBorder}`, padding: 14 }}>
                {/* 料件資訊 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: BR.inkFaint }}>#{i + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: BR.cyan }}>{p.code}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    {p.spec && <div style={{ fontSize: 11, color: BR.inkSoft }}>{p.spec}</div>}
                    <div style={{ fontSize: 10, color: BR.inkFaint, marginTop: 2 }}>倉位：{loc}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: BR.inkFaint }}>ERP 庫存</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {p.stockOnHand}
                    </div>
                    <div style={{ fontSize: 10, color: BR.inkFaint }}>{p.unit}</div>
                  </div>
                </div>

                {/* 操作列 */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: BR.inkFaint, marginBottom: 3 }}>實盤數量</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={`${p.stockOnHand}`}
                      value={actual ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") { updateState(p.code, { actualQty: null }); return; }
                        const n = parseInt(v);
                        updateState(p.code, { actualQty: isNaN(n) ? null : n });
                      }}
                      style={{
                        width: "100%", padding: "10px 12px", fontSize: 16, fontWeight: 700,
                        borderRadius: 10, border: `1.5px solid ${BR.borderHi}`, background: "#fff",
                        fontFamily: "'IBM Plex Mono', monospace", textAlign: "right",
                      }}
                    />
                    {diff != null && diff !== 0 && (
                      <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3, textAlign: "right", color: diff > 0 ? "#059669" : BR.red }}>
                        差異：{diff > 0 ? "+" : ""}{diff}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 72 }}>
                    <button
                      onClick={() => updateState(p.code, { verdict: "ok", actualQty: p.stockOnHand })}
                      style={{
                        padding: "10px 0", fontSize: 12, fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer",
                        background: verdict === "ok" ? "#059669" : "#f0fdf4", color: verdict === "ok" ? "#fff" : "#059669",
                        fontFamily: FONT,
                      }}
                    >
                      ✓ 一致
                    </button>
                    <button
                      onClick={() => updateState(p.code, { verdict: "diff", actualQty: actual ?? p.stockOnHand })}
                      style={{
                        padding: "10px 0", fontSize: 12, fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer",
                        background: verdict === "diff" ? BR.red : BR.redSoft, color: verdict === "diff" ? "#fff" : BR.red,
                        fontFamily: FONT,
                      }}
                    >
                      ⚠ 不符
                    </button>
                  </div>
                </div>

                {/* 備註 */}
                {(verdict === "diff" || s?.note) && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      placeholder="備註（選填）"
                      value={s?.note ?? ""}
                      onChange={(e) => updateState(p.code, { note: e.target.value })}
                      style={{
                        width: "100%", padding: "8px 12px", fontSize: 12, borderRadius: 8,
                        border: `1.5px solid ${BR.borderHi}`, background: "#fff", fontFamily: FONT,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 提醒 */}
        <div style={{
          background: BR.amberSoft, border: `1.5px solid #fcd34d`, borderRadius: 12, padding: 14,
          fontSize: 12, color: "#92400e", lineHeight: 1.6,
        }}>
          <b>📌 提醒：</b>本工具不寫入 ERP。盤點完成後請按「📥 匯出對帳 CSV」把不符項目交給 PM，由 PM 在鼎新 ERP 系統執行庫存調整。
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, bg, borderColor, color }: {
  label: string; value: string; sub?: string;
  bg?: string; borderColor?: string; color?: string;
}) {
  return (
    <div style={{
      borderRadius: 12, border: `2px solid ${borderColor ?? "#e9ece3"}`,
      background: bg ?? "#fff", padding: "10px 14px",
    }}>
      <div style={{ fontSize: 11, color: color ?? "#9aa291" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", color: color ?? "#0c1208", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#9aa291", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}
