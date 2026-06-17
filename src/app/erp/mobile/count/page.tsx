"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { parts as seedParts } from "@/lib/erp/seed";
import { initialSlips } from "@/lib/erp/warehouse";
import type { ItemMaster } from "@/lib/erp/master-data-store";

const DS = {
  primary: "#091426",
  primaryContainer: "#1E293B",
  secondary: "#0058BE",
  secondaryContainer: "#2170E4",
  surface: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  outline: "#75777D",
  outlineVariant: "#C5C6CD",
  surfaceContainerHigh: "#EAE7E9",
  onSurface: "#1B1B1D",
  onSurfaceVariant: "#45474C",
  onPrimary: "#FFFFFF",
  cat1: "#F59E0B",
  cat2: "#10B981",
  cat3: "#06B6D4",
  cat4: "#8B5CF6",
  cat5: "#059669",
  cat9: "#EF4444",
  catS: "#2563EB",
};

const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";
const SORA = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

type MergedPart = typeof seedParts[0];
type Verdict = "" | "ok" | "diff";
type CountState = { partCode: string; verdict: Verdict; actualQty: number | null; note: string };

const ERP_CATEGORY: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "1 原料類", color: DS.cat1, bg: "#FFFBEB" },
  "2": { label: "2 物料類", color: DS.cat2, bg: "#ECFDF5" },
  "3": { label: "3 在製品", color: DS.cat3, bg: "#ECFEFF" },
  "4": { label: "4 製成品", color: DS.cat4, bg: "#F5F3FF" },
  "5": { label: "5 商品類", color: DS.cat5, bg: "#ECFDF5" },
  "9": { label: "9 費用類", color: DS.cat9, bg: "#FEF2F2" },
  "S": { label: "S 半成品", color: DS.catS, bg: "#EFF6FF" },
};
const ERP_CODES = new Set(["1", "2", "3", "4", "5", "9", "S"]);

function getErpCat(p: MergedPart): string {
  const cat = (p.category ?? "").trim();
  if (ERP_CODES.has(cat)) return cat;
  if (cat.startsWith("1") || /原料/.test(cat)) return "1";
  if (cat.startsWith("2") || /物料/.test(cat)) return "2";
  if (cat.startsWith("3") || /在製/.test(cat)) return "3";
  if (cat.startsWith("4") || /製成|成品/.test(cat)) return "4";
  if (cat.startsWith("5") || /商品/.test(cat)) return "5";
  if (cat.startsWith("9") || /費用/.test(cat)) return "9";
  if (cat.toUpperCase() === "S" || /半成品/.test(cat)) return "S";

  const name = (p.name ?? "").trim();
  const code = (p.code ?? "").trim().toUpperCase();
  if (/半成品/.test(name)) return "S";
  if (/包裝|包材|外箱|紙箱|棧板/.test(name)) return "9";
  if (/治具|治工具|模具|夾具/.test(name)) return "9";
  if (code.startsWith("SP") || code.startsWith("SPM")) return "9";

  const kind = p.kind ?? "";
  if (kind === "self" || kind === "outsource") return "3";
  if (kind === "feature") return "4";
  if (kind === "dummy") return "9";
  if (kind === "option") return "5";

  return "2";
}

function inferLocation(partCode: string): string {
  for (const s of initialSlips) {
    for (const it of s.items) {
      if (it.partCode === partCode && it.location) return it.location;
    }
  }
  return "—";
}

function useMergedParts() {
  const [parts, setParts] = useState<MergedPart[]>(seedParts);

  useEffect(() => {
    (async () => {
      try {
        const { loadItems } = await import("@/lib/erp/master-data-store");
        const items: ItemMaster[] = await loadItems();
        if (items.length === 0) return;

        const seedMap = new Map(seedParts.map((p) => [p.code, p]));
        const merged: MergedPart[] = [];
        const seen = new Set<string>();

        for (const item of items) {
          seen.add(item.partNo);
          const seed = seedMap.get(item.partNo);
          merged.push({
            id: seed?.id ?? `idb-${item.partNo}`,
            code: item.partNo,
            name: item.name || seed?.name || item.partNo,
            spec: item.spec ?? seed?.spec ?? "",
            category: item.category ?? seed?.category ?? "未分類",
            unit: item.unit ?? seed?.unit ?? "PCS",
            unitCost: seed?.unitCost ?? 0,
            supplierId: seed?.supplierId ?? "",
            leadDays: seed?.leadDays ?? 0,
            stockOnHand: seed?.stockOnHand ?? 0,
            safetyStock: seed?.safetyStock ?? 0,
            kind: seed?.kind,
          } as MergedPart);
        }

        for (const sp of seedParts) {
          if (!seen.has(sp.code)) merged.push(sp);
        }

        setParts(merged);
      } catch { /* IndexedDB unavailable */ }
    })();
  }, []);

  return parts;
}

/* ─── Icons (inline SVG) ─── */
function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function SearchIcon({ color = "white", size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
function QrIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="21" y1="14" x2="21" y2="21" />
      <line x1="14" y1="21" x2="21" y2="21" />
    </svg>
  );
}
function CheckIcon({ color = "white", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ErrorIcon({ color = DS.cat9, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function MinusIcon({ color = DS.onSurface, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function PlusIcon({ color = DS.onSurface, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function ScanNavIcon({ color = DS.outline }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function CardNavIcon({ color = DS.outline }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function CountNavIcon({ color = DS.secondaryContainer }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ─── Main Component ─── */
export default function CycleCountPage() {
  const allParts = useMergedParts();
  const [category, setCategory] = useState<string>("全部");
  const [operator, setOperator] = useState<string>("");
  const [states, setStates] = useState<Map<string, CountState>>(new Map());
  const [filter, setFilter] = useState<"all" | "pending" | "ok" | "diff">("all");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    for (const p of allParts) catSet.add(getErpCat(p));
    const sorted = [...catSet].sort((a, b) => a.localeCompare(b));
    return ["全部", ...sorted];
  }, [allParts]);

  const targetParts = useMemo(() => {
    if (category === "全部") return allParts;
    return allParts.filter((p) => getErpCat(p) === category);
  }, [category, allParts]);

  const filteredParts = useMemo(() => {
    let list = targetParts;
    if (filter !== "all") {
      list = list.filter((p) => {
        const s = states.get(p.code);
        if (filter === "pending") return !s?.verdict;
        return s?.verdict === filter;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => {
        const loc = inferLocation(p.code);
        return (
          p.code.toLowerCase().includes(q) ||
          (p.name ?? "").toLowerCase().includes(q) ||
          loc.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [targetParts, states, filter, search]);

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
  const completionPct = targetParts.length > 0 ? Math.round(countedRows.length / targetParts.length * 100) : 0;

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
    const catLabel = category === "全部" ? "全部" : (ERP_CATEGORY[category]?.label ?? category);
    a.href = url; a.download = `盤點對帳-${catLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const pendingCount = targetParts.length - countedRows.length;

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: FONT, color: DS.onSurface, display: "flex", flexDirection: "column" }}>

      {/* ─── TOP BAR ─── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 48, background: DS.primary,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <HamburgerIcon />
          <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 16, color: DS.onPrimary }}>平日抽盤</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <SearchIcon />
          <AccountIcon />
        </div>
      </div>

      {/* spacer for fixed top bar */}
      <div style={{ height: 48, flexShrink: 0 }} />

      {/* ─── SCROLLABLE CONTENT ─── */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ─── KPI CARDS ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* 待盤 */}
          <div style={{
            background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
            padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 12, color: DS.outline, letterSpacing: "0.05em", marginBottom: 4 }}>待盤</div>
            <div style={{ fontFamily: SORA, fontSize: 24, fontWeight: 700, color: DS.cat1 }}>{remaining}</div>
          </div>
          {/* 一致 */}
          <div style={{
            background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
            padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 12, color: DS.outline, letterSpacing: "0.05em", marginBottom: 4 }}>一致</div>
            <div style={{ fontFamily: SORA, fontSize: 24, fontWeight: 700, color: DS.cat2 }}>{okCount}</div>
          </div>
          {/* 不符 */}
          <div style={{
            background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
            padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 12, color: DS.outline, letterSpacing: "0.05em", marginBottom: 4 }}>不符</div>
            <div style={{ fontFamily: SORA, fontSize: 24, fontWeight: 700, color: DS.cat9 }}>{diffCount}</div>
          </div>
          {/* 完成率 */}
          <div style={{
            background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
            padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 12, color: DS.outline, letterSpacing: "0.05em", marginBottom: 4 }}>完成率</div>
            <div style={{ fontFamily: SORA, fontSize: 24, fontWeight: 700, color: DS.primary }}>{completionPct}%</div>
            <div style={{
              marginTop: 8, height: 6, borderRadius: 3,
              background: DS.border, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: DS.primary,
                width: `${completionPct}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        </div>

        {/* ─── 盤點範圍 + 盤點人員 ─── */}
        <div style={{
          background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
          padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: DS.outline, marginBottom: 6 }}>盤點範圍</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10,
                  border: `1px solid ${DS.border}`, background: DS.surface, fontFamily: FONT,
                  color: DS.onSurface, outline: "none",
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "全部" ? "全部分類" : (ERP_CATEGORY[c]?.label ?? c)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: DS.outline, marginBottom: 6 }}>盤點人員</div>
              <input
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="輸入姓名"
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 10,
                  border: `1px solid ${DS.border}`, background: DS.surface, fontFamily: FONT,
                  color: DS.onSurface, outline: "none",
                }}
              />
            </div>
          </div>
          <button
            onClick={exportCsv}
            disabled={countedRows.length === 0}
            style={{
              width: "100%", marginTop: 12, padding: "12px", fontSize: 14, fontWeight: 700,
              borderRadius: 10, border: "none",
              cursor: countedRows.length === 0 ? "not-allowed" : "pointer",
              background: countedRows.length === 0 ? DS.outlineVariant : DS.secondary,
              color: DS.onPrimary, fontFamily: FONT,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: countedRows.length === 0 ? 0.6 : 1,
            }}
          >
            <ExportIcon />
            匯出對帳 CSV（{countedRows.length} 筆）
          </button>
        </div>

        {/* ─── FILTER CHIPS ─── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {([
            ["all", "全部"],
            ["pending", `待盤(${pendingCount})`],
            ["ok", `一致(${okCount})`],
            ["diff", `不符(${diffCount})`],
          ] as [typeof filter, string][]).map(([id, label]) => {
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  borderRadius: 9999, border: active ? "none" : `1px solid ${DS.border}`,
                  cursor: "pointer", whiteSpace: "nowrap",
                  background: active ? DS.primary : DS.surface,
                  color: active ? DS.onPrimary : DS.outline,
                  boxShadow: active ? "0 2px 6px rgba(9,20,38,0.15)" : "none",
                  fontFamily: FONT,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── SEARCH BAR ─── */}
        <div style={{
          background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
          display: "flex", alignItems: "center", padding: "4px 4px 4px 14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <SearchIcon color={DS.outline} size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="輸入料號或儲位..."
            style={{
              flex: 1, border: "none", outline: "none", padding: "10px 10px",
              fontSize: 14, fontFamily: FONT, background: "transparent",
              color: DS.onSurface,
            }}
          />
          <button style={{
            width: 40, height: 40, borderRadius: 10, border: "none",
            background: DS.secondary, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <QrIcon />
          </button>
        </div>

        {/* ─── INVENTORY CARDS ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredParts.length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: DS.outline, fontSize: 14 }}>
              {targetParts.length === 0 ? "此分類無料件記錄" : "無符合條件的料件"}
            </div>
          )}
          {filteredParts.map((p) => {
            const s = states.get(p.code);
            const verdict = s?.verdict ?? "";
            const actual = s?.actualQty;
            const loc = inferLocation(p.code);

            const erpCat = getErpCat(p);
            const erpInfo = ERP_CATEGORY[erpCat] ?? { label: erpCat, color: DS.outline, bg: DS.bg };

            return (
              <div key={p.id} style={{
                background: DS.surface, borderRadius: 12,
                border: `1px solid ${DS.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}>
                {/* top section */}
                <div style={{ padding: "14px 16px 12px" }}>
                  {/* badges row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: erpInfo.color,
                      background: erpInfo.bg,
                      padding: "3px 10px", borderRadius: 9999,
                    }}>
                      {erpInfo.label}
                    </span>
                    {loc !== "—" && (
                      <span style={{
                        fontSize: 11, fontFamily: MONO, fontWeight: 600,
                        color: DS.onSurfaceVariant, background: DS.bg,
                        padding: "3px 10px", borderRadius: 9999,
                      }}>
                        {loc}
                      </span>
                    )}
                  </div>
                  {/* part number */}
                  <div style={{ fontFamily: SORA, fontSize: 24, fontWeight: 700, color: DS.primary, lineHeight: 1.2 }}>
                    {p.code}
                  </div>
                  {/* description */}
                  <div style={{ fontSize: 14, color: DS.onSurfaceVariant, marginTop: 2 }}>
                    {p.name}{p.spec ? ` / ${p.spec}` : ""}
                  </div>
                </div>

                {/* gray quantity area */}
                <div style={{
                  background: DS.bg, padding: "14px 16px",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
                }}>
                  {/* system qty */}
                  <div>
                    <div style={{ fontSize: 11, color: DS.outline, marginBottom: 4 }}>系統帳面數</div>
                    <div style={{ fontFamily: SORA, fontSize: 24, fontWeight: 700, color: DS.onSurface }}>
                      {p.stockOnHand}
                    </div>
                    <div style={{ fontSize: 11, color: DS.outline }}>{p.unit}</div>
                  </div>
                  {/* actual qty with +/- */}
                  <div>
                    <div style={{ fontSize: 11, color: DS.outline, marginBottom: 4 }}>實際盤點數</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => {
                          const cur = actual ?? p.stockOnHand;
                          updateState(p.code, { actualQty: Math.max(0, cur - 1) });
                        }}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: `1px solid ${DS.border}`, background: DS.surface,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", flexShrink: 0,
                        }}
                      >
                        <MinusIcon />
                      </button>
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
                          width: "100%", minWidth: 0, padding: "6px 8px",
                          fontSize: 18, fontWeight: 700, fontFamily: SORA,
                          borderRadius: 8, border: `1px solid ${DS.border}`,
                          background: DS.surface, textAlign: "center",
                          color: DS.onSurface, outline: "none",
                        }}
                      />
                      <button
                        onClick={() => {
                          const cur = actual ?? p.stockOnHand;
                          updateState(p.code, { actualQty: cur + 1 });
                        }}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: `1px solid ${DS.border}`, background: DS.surface,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", flexShrink: 0,
                        }}
                      >
                        <PlusIcon />
                      </button>
                    </div>
                  </div>
                </div>

                {/* action buttons */}
                <div style={{ padding: "12px 16px", display: "flex", gap: 10 }}>
                  <button
                    onClick={() => updateState(p.code, { verdict: "ok", actualQty: p.stockOnHand })}
                    style={{
                      flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 700,
                      borderRadius: 10, cursor: "pointer", fontFamily: FONT,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: verdict === "ok" ? DS.cat2 : DS.cat2,
                      color: DS.onPrimary,
                      border: "none",
                      opacity: verdict === "ok" ? 1 : 0.85,
                    }}
                  >
                    <CheckIcon />
                    資料一致
                  </button>
                  <button
                    onClick={() => updateState(p.code, { verdict: "diff", actualQty: actual ?? p.stockOnHand })}
                    style={{
                      flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 700,
                      borderRadius: 10, cursor: "pointer", fontFamily: FONT,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: verdict === "diff" ? DS.cat9 : DS.surface,
                      color: verdict === "diff" ? DS.onPrimary : DS.cat9,
                      border: verdict === "diff" ? "none" : `1.5px solid ${DS.cat9}`,
                    }}
                  >
                    <ErrorIcon color={verdict === "diff" ? DS.onPrimary : DS.cat9} />
                    不符標記
                  </button>
                </div>

                {/* note (shown when diff or has note) */}
                {(verdict === "diff" || s?.note) && (
                  <div style={{ padding: "0 16px 14px" }}>
                    <input
                      placeholder="備註（選填）"
                      value={s?.note ?? ""}
                      onChange={(e) => updateState(p.code, { note: e.target.value })}
                      style={{
                        width: "100%", padding: "10px 12px", fontSize: 13, borderRadius: 10,
                        border: `1px solid ${DS.border}`, background: DS.bg, fontFamily: FONT,
                        color: DS.onSurface, outline: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM NAV ─── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        height: 72, background: DS.surface,
        borderTop: `1px solid ${DS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "0 16px",
      }}>
        <Link href="/erp/mobile/scan" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 48, height: 32, borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ScanNavIcon />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: DS.outline }}>掃描</span>
        </Link>
        <Link href="/erp/mobile/material-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 48, height: 32, borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CardNavIcon />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: DS.outline }}>物料卡</span>
        </Link>
        <Link href="/erp/mobile/count" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 48, height: 32, borderRadius: 16,
            background: `${DS.secondaryContainer}1A`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CountNavIcon />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: DS.secondaryContainer }}>盤點</span>
        </Link>
      </div>
    </div>
  );
}
