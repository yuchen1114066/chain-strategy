"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { parts as seedParts, suppliers, bom, models } from "@/lib/erp/seed";
import type { ItemMaster } from "@/lib/erp/master-data-store";
import { initialSlips } from "@/lib/erp/warehouse";
import { digitalPOs } from "@/lib/erp/supplier-portal";
import { outsourceOrders } from "@/lib/erp/outsource";

/* ── Design System ── */
const DS = {
  primary: "#091426",
  primaryContainer: "#1E293B",
  secondary: "#0058BE",
  secondaryContainer: "#2170E4",
  surface: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  borderHi: "#CBD5E1",
  outline: "#75777D",
  outlineVariant: "#C5C6CD",
  onSurface: "#1B1B1D",
  onSurfaceVariant: "#45474C",
  onPrimary: "#FFFFFF",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  cat1: "#F59E0B",
  cat2: "#10B981",
  cat3: "#06B6D4",
  cat4: "#8B5CF6",
  cat5: "#059669",
  cat9: "#EF4444",
  catS: "#2563EB",
} as const;

const FONT_BODY = "'Noto Sans TC', system-ui, sans-serif";
const FONT_HEADLINE = "'Sora', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const KIND_LABEL: Record<string, string> = {
  purchase: "採購件", self: "自製件", dummy: "虛設品號",
  feature: "Feature", outsource: "託外加工", option: "Option",
};

const PO_STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  draft:         { text: "草稿",   color: DS.outline, bg: "#f5f5f3" },
  sent:          { text: "已發送", color: DS.cat1, bg: "#FFFBEB" },
  acked:         { text: "已確認", color: DS.cat3, bg: "#ECFEFF" },
  in_production: { text: "生產中", color: DS.cat2, bg: "#ECFDF5" },
  shipped:       { text: "已出貨", color: DS.cat4, bg: "#F5F3FF" },
  received:      { text: "已收貨", color: DS.cat5, bg: "#ECFDF5" },
  closed:        { text: "已結案", color: "#6b7280", bg: "#F9FAFB" },
  rejected:      { text: "已拒絕", color: DS.error, bg: DS.errorContainer },
};

const ERP_CATEGORY: Record<string, { label: string; short: string; color: string }> = {
  "1": { label: "1 原料類", short: "原料", color: DS.cat1 },
  "2": { label: "2 物料類", short: "物料", color: DS.cat2 },
  "3": { label: "3 在製品", short: "在製品", color: DS.cat3 },
  "4": { label: "4 製成品", short: "製成品", color: DS.cat4 },
  "5": { label: "5 商品類", short: "商品", color: DS.cat5 },
  "9": { label: "9 費用類", short: "費用", color: DS.cat9 },
  "S": { label: "S 半成品", short: "半成品", color: DS.catS },
};
const ERP_CODES = new Set(["1", "2", "3", "4", "5", "9", "S"]);

const ERP_CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  "1": { label: "1 原料類", color: DS.cat1, bg: "#FFFBEB" },
  "2": { label: "2 物料類", color: DS.cat2, bg: "#ECFDF5" },
  "3": { label: "3 在製品", color: DS.cat3, bg: "#ECFEFF" },
  "4": { label: "4 製成品", color: DS.cat4, bg: "#F5F3FF" },
  "5": { label: "5 商品類", color: DS.cat5, bg: "#ECFDF5" },
  "9": { label: "9 費用類", color: DS.cat9, bg: "#FEF2F2" },
  "S": { label: "S 半成品", color: DS.catS, bg: "#EFF6FF" },
};

const LOCATION_MAP: Record<string, string> = {};
for (const slip of initialSlips) {
  for (const item of slip.items) {
    if (item.location && item.partCode) {
      LOCATION_MAP[item.partCode] = item.location;
    }
  }
}

/* ── SVG Icons (inline) ── */
const IconMenu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconQr = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" />
    <path d="M14 14h2v2h-2z" /><path d="M20 14h2v2h-2z" /><path d="M14 20h2v2h-2z" /><path d="M20 20h2v2h-2z" /><path d="M17 17h2v2h-2z" />
  </svg>
);
const IconScan = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4h3" /><path d="M20 7V4h-3" /><path d="M4 17v3h3" /><path d="M20 17v3h-3" /><line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);
const IconCard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconClipboard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);
const IconHistory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

/* ── IndexedDB 資料串接（master-data 匯入的真實資料） ── */
type MergedPart = typeof seedParts[0];

function useMergedParts() {
  const [parts, setParts] = useState<MergedPart[]>(seedParts);
  const [dataSource, setDataSource] = useState<"seed" | "indexeddb">("seed");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { loadItems, loadMeta } = await import("@/lib/erp/master-data-store");
        const items: ItemMaster[] = await loadItems();
        if (items.length === 0) return;
        const meta = await loadMeta();
        if (meta.itemUpdatedAt) setUpdatedAt(meta.itemUpdatedAt);

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
        setDataSource("indexeddb");
      } catch { /* IndexedDB unavailable, use seed */ }
    })();
  }, []);

  return { parts, dataSource, updatedAt };
}

/* ── ERP category detection ── */
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

/* ── Auth ── */
const WAREHOUSE_STAFF = [
  { id: "242", name: "賴允正", role: "倉管員" },
  { id: "233", name: "林郁展", role: "倉管員" },
  { id: "243", name: "姜湘淇", role: "倉管員" },
  { id: "235", name: "范成義", role: "倉管員" },
  { id: "320", name: "曾語梣", role: "系統管理者" },
];
const STORAGE_KEY = "gascc.wh.login";

type LoginState = { id: string; name: string; role: string; at: string };

/* ================================================================
   Root Component
   ================================================================ */
export default function MobileScanPage() {
  const [user, setUser] = useState<LoginState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  function handleLogin(staff: typeof WAREHOUSE_STAFF[0]) {
    const state: LoginState = { ...staff, at: new Date().toISOString() };
    setUser(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (!loaded) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;
  return <ScanScreen user={user} onLogout={handleLogout} />;
}

/* ================================================================
   Login Screen
   ================================================================ */
function LoginScreen({ onLogin }: { onLogin: (s: typeof WAREHOUSE_STAFF[0]) => void }) {
  const [empId, setEmpId] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const q = empId.trim().toUpperCase();
    const found = WAREHOUSE_STAFF.find((s) => s.id === q || s.name === empId.trim());
    if (found) {
      onLogin(found);
    } else {
      setError("無權限，請聯繫系統管理者");
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", background: DS.primary, fontFamily: FONT_BODY,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: DS.surface, borderRadius: 20, padding: "40px 28px", width: "100%",
        maxWidth: 360, boxShadow: "0 8px 40px rgba(0,0,0,.35)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: DS.secondary,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div style={{
            fontFamily: FONT_HEADLINE, fontSize: 22, fontWeight: 700, color: DS.primary,
          }}>
            祺驊倉庫管理
          </div>
          <div style={{ fontSize: 13, color: DS.onSurfaceVariant, marginTop: 6 }}>
            請輸入工號登入系統
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, display: "block", marginBottom: 6 }}>
            工號
          </label>
          <input
            type="text"
            value={empId}
            onChange={(e) => { setEmpId(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="請輸入工號"
            style={{
              width: "100%", padding: "14px 16px", fontSize: 16, borderRadius: 12,
              border: `1.5px solid ${error ? DS.error : DS.border}`, background: DS.surface,
              outline: "none", fontFamily: FONT_BODY,
            }}
            autoFocus
          />
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: DS.error, background: DS.errorContainer,
            padding: "8px 12px", borderRadius: 8, marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!empId.trim()}
          style={{
            width: "100%", padding: "14px", fontSize: 16, fontWeight: 700,
            color: DS.onPrimary,
            background: !empId.trim() ? DS.outlineVariant : DS.secondary,
            border: "none", borderRadius: 12,
            cursor: !empId.trim() ? "not-allowed" : "pointer",
            fontFamily: FONT_BODY,
          }}
        >
          授權進入系統
        </button>

        <div style={{
          marginTop: 20, textAlign: "center", fontSize: 12,
          color: DS.outline, lineHeight: 1.6,
        }}>
          僅限授權人員登入
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 20, textAlign: "center" }}>
        祺驊股份有限公司 · CHI HUA FITNESS CO., LTD.
        <br />純讀取，不回寫鼎新 ERP
      </div>
    </div>
  );
}

/* ================================================================
   Scan Screen (main screen after login)
   ================================================================ */
function ScanScreen({ user, onLogout }: { user: LoginState; onLogout: () => void }) {
  const { parts, dataSource, updatedAt } = useMergedParts();
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    if (!raw) return [];

    const exact = parts.filter(
      (p) =>
        p.code.toLowerCase().includes(raw) ||
        p.name.toLowerCase().includes(raw) ||
        (p.spec ?? "").toLowerCase().includes(raw) ||
        p.category.toLowerCase().includes(raw)
    );
    if (exact.length > 0) return exact.slice(0, 20);

    const tokens = raw.split(/\s+/).filter((t) => t.length >= 2);
    if (tokens.length === 0) return [];

    const scored = parts
      .map((p) => {
        const haystack = `${p.code} ${p.name} ${p.spec ?? ""} ${p.category}`.toLowerCase();
        const hits = tokens.filter((t) => haystack.includes(t)).length;
        return { p, hits };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits);

    return scored.slice(0, 20).map((x) => x.p);
  }, [query, parts]);

  const selected = selectedCode ? parts.find((p) => p.code === selectedCode) : null;

  function handleSelect(code: string) {
    setSelectedCode(code);
    setQuery("");
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current;
        const state = s.getState();
        if (state === 2) await s.stop();
      } catch { /* ignore */ }
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  const qrReaderRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mountedRef.current) return;
        const scanner = new Html5Qrcode(node.id);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
          },
          (decodedText) => {
            const text = decodedText.trim().toUpperCase();
            const found = parts.find(
              (p) => p.code.toUpperCase() === text || text.includes(p.code.toUpperCase())
            );
            if (found) {
              setSelectedCode(found.code);
              setQuery("");
            } else {
              setQuery(decodedText.trim());
              setSelectedCode(null);
            }
            stopScanner();
          },
          () => {},
        );
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setScanError(
          msg.includes("NotAllowed") || msg.includes("Permission")
            ? "相機權限被拒絕，請在瀏覽器設定中允許相機存取"
            : msg.includes("NotFound") || msg.includes("Requested device not found")
            ? "找不到相機裝置"
            : `無法啟動相機：${msg}`
        );
        setScanning(false);
      }
    })();
  }, [parts]);

  function startScan() {
    setScanError("");
    setScanning(true);
  }

  /* ── Category grouping for home view ── */
  const categoryGroups = useMemo(() => {
    const grouped = new Map<string, MergedPart[]>();
    for (const p of parts) {
      const cat = getErpCat(p);
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(p);
    }
    return grouped;
  }, [parts]);

  const sortedCatKeys = useMemo(() => [...categoryGroups.keys()].sort((a, b) => a.localeCompare(b)), [categoryGroups]);

  return (
    <div style={{
      minHeight: "100dvh", background: DS.bg, fontFamily: FONT_BODY, color: DS.onSurface,
      paddingBottom: 80,
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        background: DS.primary, color: DS.onPrimary,
        height: 48, padding: "0 16px",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {selectedCode ? (
            <button
              onClick={() => setSelectedCode(null)}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", color: DS.onPrimary,
                padding: "6px 10px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT_BODY,
              }}
            >
              ← 返回
            </button>
          ) : (
            <IconMenu />
          )}
          <span style={{ fontFamily: FONT_HEADLINE, fontSize: 16, fontWeight: 700 }}>
            祺驊倉庫管理
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: "rgba(255,255,255,0.12)", border: "none", color: DS.onPrimary,
              width: 36, height: 36, borderRadius: 99, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <IconUser />
          </button>
          {showMenu && (
            <>
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 60 }}
              />
              <div style={{
                position: "absolute", right: 0, top: 42, zIndex: 70,
                background: DS.surface, borderRadius: 12, padding: 16, minWidth: 200,
                boxShadow: "0 4px 24px rgba(0,0,0,.15)", color: DS.onSurface,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: DS.onSurfaceVariant, marginBottom: 2 }}>
                  {user.id} · {user.role}
                </div>
                <div style={{ fontSize: 11, color: DS.outline, marginBottom: 12 }}>
                  登入於 {user.at.slice(11, 16)}
                </div>
                {dataSource === "indexeddb" && (
                  <div style={{ fontSize: 11, color: DS.cat2, fontWeight: 600, marginBottom: 8 }}>
                    已載入主檔資料（{parts.length} 筆）
                  </div>
                )}
                {updatedAt && (
                  <div style={{ fontSize: 10, color: DS.outline, marginBottom: 12 }}>
                    資料更新：{new Date(updatedAt).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })}
                    {" "}
                    {new Date(updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  style={{
                    width: "100%", padding: "10px", fontSize: 13, fontWeight: 700,
                    color: DS.error, background: DS.errorContainer, border: "none",
                    borderRadius: 8, cursor: "pointer", fontFamily: FONT_BODY,
                  }}
                >
                  登出
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Spacer for fixed top bar */}
      <div style={{ height: 48 }} />

      <div style={{ padding: "12px 16px" }}>
        {/* ── Search Section ── */}
        <div style={{
          background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: 12,
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: DS.outline, display: "flex", alignItems: "center",
              }}>
                <IconSearch />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedCode(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (filtered.length >= 1) handleSelect(filtered[0].code);
                    inputRef.current?.blur();
                  }
                }}
                placeholder="輸入料號或零件名稱..."
                style={{
                  width: "100%", padding: "12px 12px 12px 38px", fontSize: 15, borderRadius: 10,
                  border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
                  fontFamily: FONT_BODY,
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setSelectedCode(null); inputRef.current?.focus(); }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", fontSize: 18, color: DS.outline,
                    cursor: "pointer", lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={startScan}
              disabled={scanning}
              style={{
                width: 48, height: 48, borderRadius: 12, border: "none",
                background: scanning ? DS.outlineVariant : `linear-gradient(135deg, ${DS.primary}, ${DS.primaryContainer})`,
                color: DS.onPrimary, cursor: scanning ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconQr />
            </button>
          </div>
        </div>

        {/* ── QR Scanner Overlay ── */}
        {scanning && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "#000", display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "14px 16px", display: "flex", justifyContent: "space-between",
              alignItems: "center", color: "#fff", background: "rgba(0,0,0,0.8)",
              zIndex: 10,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>掃描 QR Code / 條碼</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>對準零件標籤即可辨識</div>
              </div>
              <button
                onClick={stopScanner}
                style={{
                  background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
                  padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: FONT_BODY,
                }}
              >
                關閉
              </button>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <div ref={qrReaderRef} id="qr-reader-box" style={{ width: "100%", maxWidth: 400 }} />
            </div>
            <div style={{
              padding: "16px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12,
              background: "rgba(0,0,0,0.8)",
            }}>
              將 QR Code 或條碼對準框框內即可自動辨識
            </div>
          </div>
        )}

        {/* ── Scanner Error ── */}
        {scanError && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 12,
            background: DS.errorContainer, border: `1px solid #f5c2c0`,
            fontSize: 12, color: DS.error, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ flex: 1 }}>{scanError}</span>
            <button
              onClick={() => setScanError("")}
              style={{ background: "none", border: "none", color: DS.error, fontSize: 16, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}

        {/* ── Search Results (when query typed, no part selected) ── */}
        {query && !selectedCode && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((p) => {
              const catKey = getErpCat(p);
              const cat = ERP_CATEGORY[catKey];
              const location = LOCATION_MAP[p.code] ?? "—";
              return (
                <PartResultCard
                  key={p.code}
                  part={p}
                  catKey={catKey}
                  catColor={cat?.color ?? DS.outline}
                  catLabel={cat?.short ?? catKey}
                  location={location}
                  onSelect={() => handleSelect(p.code)}
                />
              );
            })}
          </div>
        )}

        {query && !selectedCode && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "32px 16px", color: DS.outline, fontSize: 14,
          }}>
            找不到「{query}」— 試試料號或品名關鍵字
          </div>
        )}

        {/* ── Part Detail Card ── */}
        {selected && (
          <>
            <PartCard code={selected.code} parts={parts} />
            <button
              onClick={() => setSelectedCode(null)}
              style={{
                width: "100%", marginTop: 12, padding: "14px",
                background: DS.surface, border: `1.5px solid ${DS.border}`,
                borderRadius: 12, fontSize: 14, fontWeight: 700, color: DS.primary,
                cursor: "pointer", fontFamily: FONT_BODY,
              }}
            >
              ← 返回搜尋其他料件
            </button>
          </>
        )}

        {/* ── Home / Empty State (categories) ── */}
        {!query && !selectedCode && (
          <div>
            {/* Data source indicator + verification */}
            <div style={{
              background: DS.surface, borderRadius: 12, border: `1px solid ${DS.border}`,
              padding: "12px 14px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: dataSource === "indexeddb" ? DS.cat2 : DS.cat1,
                    boxShadow: dataSource === "indexeddb" ? `0 0 6px ${DS.cat2}` : "none",
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: DS.onSurface }}>
                    {dataSource === "indexeddb"
                      ? `已載入主檔資料（${parts.length.toLocaleString()} 筆）`
                      : "Demo 展示資料"}
                  </span>
                </div>
                <button
                  onClick={() => setShowVerify(!showVerify)}
                  style={{
                    background: "none", border: `1px solid ${DS.border}`, borderRadius: 8,
                    padding: "4px 10px", fontSize: 11, fontWeight: 600, color: DS.secondary,
                    cursor: "pointer", fontFamily: FONT_BODY,
                  }}
                >
                  {showVerify ? "收合" : "驗證明細"}
                </button>
              </div>
              {updatedAt && (
                <div style={{ fontSize: 11, color: DS.outline, marginTop: 4, marginLeft: 16 }}>
                  資料更新：{new Date(updatedAt).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })}
                  {" "}
                  {new Date(updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
              {!updatedAt && dataSource === "seed" && (
                <div style={{ fontSize: 11, color: DS.cat1, marginTop: 4, marginLeft: 16 }}>
                  請至 /erp/master-data 匯入 ERP 主檔報表
                </div>
              )}

              {showVerify && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: DS.outline, marginBottom: 8, letterSpacing: "0.05em" }}>
                    ERP 分類筆數摘要（可與鼎新系統核對）
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {sortedCatKeys.map((catKey) => {
                      const info = ERP_CAT_META[catKey] ?? { label: catKey, color: DS.outline, bg: DS.bg };
                      const count = categoryGroups.get(catKey)?.length ?? 0;
                      return (
                        <div key={catKey} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "6px 10px", borderRadius: 8, background: info.bg,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: FONT_MONO, color: info.color }}>
                            {count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", marginTop: 6, borderRadius: 8,
                    background: DS.primaryContainer, color: DS.onPrimary,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>合計</span>
                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: FONT_MONO }}>
                      {parts.length.toLocaleString()} 筆
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Categories header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 14,
            }}>
              <span style={{
                fontFamily: FONT_HEADLINE, fontSize: 20, fontWeight: 700, color: DS.primary,
              }}>
                零件類別
              </span>
              <span style={{ fontSize: 13, color: DS.secondary, fontWeight: 600, cursor: "pointer" }}>
                查看全部
              </span>
            </div>

            {/* 2x2 category grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {sortedCatKeys.map((catKey) => {
                const cat = ERP_CATEGORY[catKey];
                if (!cat) return null;
                const items = categoryGroups.get(catKey)!;
                return (
                  <button
                    key={catKey}
                    onClick={() => { setQuery(cat.short); }}
                    style={{
                      background: DS.surface, border: `1px solid ${DS.border}`,
                      borderRadius: 14, padding: "16px 12px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 8, fontFamily: FONT_BODY,
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 99,
                      background: cat.color + "18",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, fontWeight: 800, color: cat.color,
                      fontFamily: FONT_HEADLINE,
                    }}>
                      {catKey}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DS.onSurface }}>
                      {cat.short}
                    </div>
                    <div style={{ fontSize: 11, color: DS.outline }}>
                      {items.length} 筆
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recent parts preview */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 12,
            }}>
              <span style={{
                fontFamily: FONT_HEADLINE, fontSize: 18, fontWeight: 700, color: DS.primary,
              }}>
                最近查看
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {parts.slice(0, 4).map((p) => {
                const catKey = getErpCat(p);
                const cat = ERP_CATEGORY[catKey];
                const location = LOCATION_MAP[p.code] ?? "—";
                return (
                  <PartResultCard
                    key={p.code}
                    part={p}
                    catKey={catKey}
                    catColor={cat?.color ?? DS.outline}
                    catLabel={cat?.short ?? catKey}
                    location={location}
                    onSelect={() => handleSelect(p.code)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Nav Bar ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        height: 72, background: DS.surface,
        borderTop: `1px solid ${DS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "0 16px",
      }}>
        <NavTab href="/erp/mobile/scan" label="掃描" icon={<IconScan />} active />
        <NavTab href="/erp/mobile/material-card" label="物料卡" icon={<IconCard />} />
        <NavTab href="/erp/mobile/count" label="平日抽盤" icon={<IconClipboard />} />
      </div>

      {/* Footer info */}
      <div style={{
        padding: "8px 14px", fontSize: 10, color: DS.outline, textAlign: "center",
        marginBottom: 72,
      }}>
        {user.name} ({user.id}) · 純讀取，不回寫鼎新 ERP
      </div>
    </div>
  );
}

/* ================================================================
   Part Result Card (search results / recent list)
   ================================================================ */
function PartResultCard({ part: p, catKey, catColor, catLabel, location, onSelect }: {
  part: MergedPart; catKey: string; catColor: string; catLabel: string;
  location: string; onSelect: () => void;
}) {
  const low = p.stockOnHand < p.safetyStock;
  const onOrderQty = digitalPOs
    .filter((po) => po.partId === p.id && !["draft", "received", "closed", "rejected"].includes(po.status))
    .reduce((s, po) => s + po.qty, 0);

  return (
    <div
      onClick={onSelect}
      style={{
        background: DS.surface, borderRadius: 14, padding: "14px 16px",
        border: `1px solid ${DS.border}`, cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      {/* Top row: badge + location */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: catColor,
          background: catColor + "18",
          padding: "3px 10px", borderRadius: 99,
        }}>
          {catLabel}
        </span>
        <span style={{ fontSize: 11, color: DS.outline }}>{location}</span>
      </div>

      {/* Content row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: DS.primary,
            letterSpacing: "0.02em",
          }}>
            {p.code}
          </div>
          <div style={{ fontSize: 13, color: DS.onSurfaceVariant, marginTop: 2 }}>
            {p.name}
          </div>
          {onOrderQty > 0 && (
            <div style={{ fontSize: 11, fontWeight: 600, color: DS.cat4, marginTop: 4 }}>
              在途 {onOrderQty} {p.unit}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <div style={{
            fontFamily: FONT_HEADLINE, fontSize: 28, fontWeight: 800,
            color: low ? DS.error : DS.primary, lineHeight: 1,
          }}>
            {p.stockOnHand}
          </div>
          <div style={{ fontSize: 11, color: DS.outline, marginTop: 2 }}>{p.unit}</div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
            background: DS.primary, color: DS.onPrimary,
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY,
          }}
        >
          庫存詳情
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{
            width: 36, height: 36, borderRadius: 8, border: `1px solid ${DS.border}`,
            background: DS.surface, color: DS.onSurfaceVariant,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <IconHistory />
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   Bottom Nav Tab
   ================================================================ */
function NavTab({ href, label, icon, active }: {
  href: string; label: string; icon: React.ReactNode; active?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{
        width: active ? 56 : 40, height: 32, borderRadius: 99,
        background: active ? DS.secondary + "1A" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: active ? DS.secondary : DS.outline,
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: 11, fontWeight: active ? 700 : 500,
        color: active ? DS.secondary : DS.outline,
      }}>
        {label}
      </span>
    </Link>
  );
}

/* ================================================================
   Part Detail Card (零件卡)
   ================================================================ */
function PartCard({ code, parts }: { code: string; parts: MergedPart[] }) {
  const p = parts.find((x) => x.code === code);
  if (!p) return <div style={{ padding: 20, textAlign: "center", color: DS.outline }}>找不到 {code}</div>;

  const sup = suppliers.find((s) => s.id === p.supplierId);
  const low = p.stockOnHand < p.safetyStock;
  const pct = p.safetyStock > 0 ? Math.round((p.stockOnHand / p.safetyStock) * 100) : 999;
  const location = LOCATION_MAP[p.code] ?? "—";
  const catKey = getErpCat(p);
  const cat = ERP_CATEGORY[catKey];

  const onOrderQty = digitalPOs
    .filter((po) => po.partId === p.id && !["draft", "received", "closed", "rejected"].includes(po.status))
    .reduce((sum, po) => sum + po.qty, 0);

  const usedBy = bom
    .filter((b) => b.partId === p.id && b.isActive)
    .map((b) => models.find((m) => m.id === b.modelId))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const uniqUsedBy = [...new Map(usedBy.map((m) => [m.id, m])).values()];

  const stockColor = low ? DS.error : pct < 150 ? DS.cat1 : DS.cat2;
  const stockBg = low ? DS.errorContainer : pct < 150 ? "#FFFBEB" : "#ECFDF5";
  const stockBorder = low ? "#f5c2c0" : pct < 150 ? "#FDE68A" : "#A7F3D0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Main card */}
      <div style={{
        background: DS.surface, borderRadius: 16, overflow: "hidden",
        border: `1.5px solid ${stockBorder}`,
        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
      }}>
        <div style={{
          background: DS.primary, color: DS.onPrimary, padding: "14px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{
              fontFamily: FONT_MONO, fontSize: 20, fontWeight: 800,
              letterSpacing: "0.04em",
            }}>
              {p.code}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{p.name}</div>
            {p.spec && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{p.spec}</div>
            )}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
            background: low ? DS.error : DS.cat2, whiteSpace: "nowrap",
          }}>
            {low ? "低於安全庫存" : "庫存正常"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${DS.border}` }}>
          <NumberBlock label="在庫數量" value={p.stockOnHand.toString()} unit={p.unit} color={stockColor} bg={stockBg} large />
          <NumberBlock label="採購在途" value={onOrderQty > 0 ? onOrderQty.toString() : "—"} unit={onOrderQty > 0 ? p.unit : undefined} color={onOrderQty > 0 ? DS.cat4 : DS.outline} bg={onOrderQty > 0 ? "#F5F3FF" : DS.surface} large />
          <NumberBlock label="安全庫存" value={p.safetyStock.toString()} unit={p.unit} color={DS.onSurfaceVariant} bg={DS.surface} />
          <NumberBlock label="倉位" value={location} color={DS.cat3} bg="#ECFEFF" mono />
        </div>

        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InfoRow label="分類" value={cat?.label ?? p.category} />
            <InfoRow label="屬性" value={KIND_LABEL[p.kind ?? "purchase"] ?? p.kind ?? "採購件"} />
            <InfoRow label="廠商交貨期" value={`${p.leadDays} 天`} />
            <InfoRow label="單位" value={p.unit} />
          </div>
        </div>
      </div>

      {/* In-transit orders */}
      <InTransitSection partId={p.id} partCode={p.code} parts={parts} />

      {uniqUsedBy.length > 0 && (
        <div style={{ background: DS.surface, borderRadius: 14, padding: "14px 16px", border: `1px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: DS.outline, letterSpacing: "0.06em", marginBottom: 6 }}>
            被以下成品使用（{uniqUsedBy.length}）
          </div>
          {uniqUsedBy.slice(0, 6).map((m) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
              borderTop: `1px solid ${DS.border}`, fontSize: 12,
            }}>
              <span style={{
                fontFamily: FONT_MONO, fontWeight: 700,
                color: DS.secondary, fontSize: 11, minWidth: 100,
              }}>
                {m.code}
              </span>
              <span style={{ color: DS.onSurfaceVariant }}>{m.machineFamily}</span>
            </div>
          ))}
          {uniqUsedBy.length > 6 && (
            <div style={{ fontSize: 11, color: DS.outline, marginTop: 4 }}>... 等 {uniqUsedBy.length} 個成品</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   In-Transit Section
   ================================================================ */
function InTransitSection({ partId, partCode, parts }: { partId: string; partCode: string; parts: MergedPart[] }) {
  const activePOs = digitalPOs.filter(
    (po) => po.partId === partId && !["received", "closed", "rejected"].includes(po.status)
  );
  const activeOutsource = outsourceOrders.filter(
    (o) => o.partCode === partCode && o.qtyReturned < o.qtyOut
  );
  const totalInTransit = activePOs.reduce((sum, po) => sum + po.qty, 0);
  const totalOutsource = activeOutsource.reduce((sum, o) => sum + (o.qtyOut - o.qtyReturned), 0);

  if (activePOs.length === 0 && activeOutsource.length === 0) return null;

  return (
    <div style={{ background: DS.surface, borderRadius: 14, overflow: "hidden", border: `1.5px solid #C4B5FD` }}>
      <div style={{
        background: DS.cat4, color: DS.onPrimary, padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: "0.08em" }}>採購在途訂單</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {activePOs.length + activeOutsource.length} 筆未結
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, opacity: 0.7 }}>在途總量</div>
          <div style={{ fontFamily: FONT_HEADLINE, fontSize: 20, fontWeight: 800 }}>{totalInTransit + totalOutsource}</div>
        </div>
      </div>

      {activePOs.map((po) => {
        const sup = suppliers.find((s) => s.id === po.supplierId);
        const st = PO_STATUS_LABEL[po.status] ?? PO_STATUS_LABEL.draft;
        const isOverdue = po.expectedArrival < new Date().toISOString().slice(0, 10) && po.status !== "received";
        return (
          <div key={po.id} style={{ padding: "10px 16px", borderTop: `1px solid ${DS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: DS.cat4 }}>
                {po.poNo}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                color: st.color, background: st.bg,
              }}>
                {st.text}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
              <div style={{ color: DS.outline }}>供應商</div>
              <div style={{ fontWeight: 600, textAlign: "right" }}>{sup?.name ?? "—"}</div>
              <div style={{ color: DS.outline }}>訂購數量</div>
              <div style={{ fontWeight: 700, textAlign: "right", color: DS.cat4 }}>{po.qty} {parts.find(pt => pt.id === po.partId)?.unit ?? "PCS"}</div>
              <div style={{ color: DS.outline }}>預計到貨</div>
              <div style={{
                fontWeight: 600, textAlign: "right",
                color: isOverdue ? DS.error : DS.onSurface,
              }}>
                {po.expectedArrival}{isOverdue ? " 逾期" : ""}
              </div>
              {po.asn && (
                <>
                  <div style={{ color: DS.outline }}>物流單號</div>
                  <div style={{ fontWeight: 600, textAlign: "right", fontSize: 10, fontFamily: FONT_MONO }}>{po.asn.trackingNo}</div>
                  <div style={{ color: DS.outline }}>承運商</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{po.asn.carrier}</div>
                  {po.asn.remark && (
                    <>
                      <div style={{ color: DS.outline }}>備註</div>
                      <div style={{ fontWeight: 500, textAlign: "right", color: DS.cat1, fontSize: 10 }}>{po.asn.remark}</div>
                    </>
                  )}
                </>
              )}
            </div>
            {po.productionLog.length > 0 && (() => {
              const stageLabel: Record<string, string> = {
                pending: "未交貨", material_ready: "未交貨", in_production: "未交貨",
                packed: "未交貨", shipped: "已交貨", in_transit: "已交貨", arrived: "已交貨",
              };
              const lastStage = po.productionLog[po.productionLog.length - 1];
              const currentLabel = stageLabel[lastStage.stage] ?? lastStage.stage;
              const isDelivered = ["shipped", "in_transit", "arrived"].includes(lastStage.stage);
              return (
                <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                  <span style={{
                    fontSize: 10, padding: "3px 10px", borderRadius: 6, fontWeight: 700,
                    background: isDelivered ? DS.cat5 : DS.cat1,
                    color: "#fff",
                  }}>
                    {currentLabel}
                  </span>
                </div>
              );
            })()}
          </div>
        );
      })}

      {activeOutsource.map((o) => {
        const remaining = o.qtyOut - o.qtyReturned;
        const isOverdue = o.expectedReturn < new Date().toISOString().slice(0, 10) && remaining > 0;
        return (
          <div key={o.id} style={{ padding: "10px 16px", borderTop: `1px solid ${DS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: DS.cat1 }}>
                {o.orderNo}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                color: DS.cat1, background: "#FFFBEB",
              }}>
                託外加工
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
              <div style={{ color: DS.outline }}>加工廠</div>
              <div style={{ fontWeight: 600, textAlign: "right" }}>{o.vendor}</div>
              <div style={{ color: DS.outline }}>製程</div>
              <div style={{ fontWeight: 600, textAlign: "right" }}>{o.process}</div>
              <div style={{ color: DS.outline }}>送出 / 已回</div>
              <div style={{ fontWeight: 700, textAlign: "right" }}>{o.qtyOut} / {o.qtyReturned}</div>
              <div style={{ color: DS.outline }}>在外數量</div>
              <div style={{ fontWeight: 700, textAlign: "right", color: DS.cat1 }}>{remaining}</div>
              <div style={{ color: DS.outline }}>預計回廠</div>
              <div style={{
                fontWeight: 600, textAlign: "right",
                color: isOverdue ? DS.error : DS.onSurface,
              }}>
                {o.expectedReturn}{isOverdue ? " 逾期" : ""}
              </div>
              {o.woRef && (
                <>
                  <div style={{ color: DS.outline }}>關聯工單</div>
                  <div style={{ fontWeight: 600, textAlign: "right", fontFamily: FONT_MONO, fontSize: 10 }}>{o.woRef}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================
   Utility sub-components
   ================================================================ */
function NumberBlock({ label, value, unit, color, bg, large, mono }: {
  label: string; value: string; unit?: string; color: string; bg: string;
  large?: boolean; mono?: boolean;
}) {
  return (
    <div style={{ padding: "12px 14px", background: bg, textAlign: "center", borderRight: `1px solid ${DS.border}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: DS.outline, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: large ? 26 : 16, fontWeight: 800, color,
        fontFamily: mono ? FONT_MONO : FONT_HEADLINE,
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {unit && <div style={{ fontSize: 10, color: DS.outline, marginTop: 2 }}>{unit}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: DS.outline }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
