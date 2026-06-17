"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { parts } from "@/lib/erp/seed";

// ─── Design System colors ───
const DS = {
  primary: "#091426",
  primaryContainer: "#1E293B",
  secondary: "#0058BE",
  secondaryContainer: "#2170E4",
  surface: "#FFFFFF",
  bg: "#F8FAFC",
  surfaceContainer: "#F0EDEF",
  surfaceContainerLow: "#F5F3F4",
  border: "#E2E8F0",
  borderHi: "#CBD5E1",
  outline: "#75777D",
  outlineVariant: "#C5C6CD",
  onSurface: "#1B1B1D",
  onSurfaceVariant: "#45474C",
  onPrimary: "#FFFFFF",
  error: "#BA1A1A",
  catSBlue: "#2563EB",
} as const;

const FONT_BODY = "'Noto Sans TC', system-ui, sans-serif";
const FONT_HEADLINE = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

// ─── localStorage keys ───
const MAT_KEY = "chihua.material_master";
const TX_KEY = "chihua.material_transactions";
const HANDLER_KEY = "chihua.default_handler";

const WAREHOUSE_STAFF = [
  { id: "242", name: "賴允正" },
  { id: "233", name: "林郁展" },
  { id: "243", name: "姜湘淇" },
  { id: "235", name: "范成義" },
  { id: "320", name: "曾語梣" },
];

// ─── Types ───
type Material = {
  code: string;
  name: string;
  spec: string;
  location: string;
  unit: string;
  safetyStock: number;
  machine: string;
  initStock: number;
};

type Transaction = {
  id: number;
  code: string;
  type: "in" | "out";
  date: string;
  summary: string;
  quantity: number;
  handler: string;
  remark: string;
  createdAt: string;
};

// ─── Helpers ───
function loadMaterials(): Record<string, Material> {
  try { return JSON.parse(localStorage.getItem(MAT_KEY) || "{}"); } catch { return {}; }
}
function saveMaterials(d: Record<string, Material>) { localStorage.setItem(MAT_KEY, JSON.stringify(d)); }
function loadTransactions(): Transaction[] {
  try { return JSON.parse(localStorage.getItem(TX_KEY) || "[]"); } catch { return []; }
}
function saveTransactions(d: Transaction[]) { localStorage.setItem(TX_KEY, JSON.stringify(d)); }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function getItemStock(code: string, mats: Record<string, Material>, txs: Transaction[]) {
  const mat = mats[code];
  let stock = mat?.initStock ?? 0;
  txs.filter(t => t.code === code).forEach(t => {
    stock += t.type === "in" ? t.quantity : -t.quantity;
  });
  return stock;
}

// ─── Tab type ───
type TabId = "card" | "records" | "settings";

// ─── SVG Icons ───
function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DS.onSurfaceVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function MaterialIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? DS.secondary : DS.onSurfaceVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function CountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DS.onSurfaceVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function QrScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <rect x="7" y="7" width="4" height="4" />
      <rect x="13" y="7" width="4" height="4" />
      <rect x="7" y="13" width="4" height="4" />
      <path d="M13 13h4v4h-4z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Main page ───
function useDataMeta() {
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { loadItems, loadMeta } = await import("@/lib/erp/master-data-store");
        const items = await loadItems();
        if (items.length > 0) {
          setItemCount(items.length);
          const meta = await loadMeta();
          if (meta.itemUpdatedAt) setUpdatedAt(meta.itemUpdatedAt);
        }
      } catch { /* IndexedDB unavailable */ }
    })();
  }, []);

  return { itemCount, updatedAt };
}

export default function MaterialCardPage() {
  const [tab, setTab] = useState<TabId>("card");
  const [toast, setToast] = useState("");
  const { itemCount, updatedAt } = useDataMeta();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const tabs: [TabId, string][] = [["card", "進出登記"], ["records", "歷史記錄"], ["settings", "設定"]];

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: FONT_BODY, color: DS.onSurface, display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{
        background: DS.primary, color: DS.onPrimary, height: 48, padding: "0 16px",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <HamburgerIcon />
          <span style={{ fontFamily: FONT_HEADLINE, fontWeight: 700, fontSize: 16, color: DS.onPrimary }}>
            祺驊倉庫管理
          </span>
        </div>
        <AccountIcon />
      </div>

      {/* Tab navigation */}
      <div style={{ marginTop: 48, padding: "6px", background: DS.surfaceContainerLow }}>
        <div style={{
          display: "flex", gap: 4, padding: 4,
          background: DS.surfaceContainerLow, borderRadius: 16,
        }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                borderRadius: 12, fontFamily: FONT_BODY, transition: "all 0.2s",
                background: tab === id ? DS.surface : "transparent",
                color: tab === id ? DS.secondary : DS.onSurfaceVariant,
                boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Data status bar */}
      <div style={{
        padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
        background: DS.surface, borderBottom: `1px solid ${DS.border}`,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: itemCount ? "#10B981" : "#F59E0B",
          boxShadow: itemCount ? "0 0 6px #10B981" : "none",
        }} />
        <span style={{ fontSize: 12, color: DS.onSurfaceVariant }}>
          {itemCount
            ? `主檔已載入（${itemCount.toLocaleString()} 筆）`
            : "尚未匯入主檔資料"}
        </span>
        {updatedAt && (
          <span style={{ fontSize: 11, color: DS.outline, marginLeft: "auto" }}>
            更新：{new Date(updatedAt).toLocaleDateString("zh-TW")}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", paddingBottom: 90 }}>
        {tab === "card" && <CardTab showToast={showToast} />}
        {tab === "records" && <RecordsTab />}
        {tab === "settings" && <SettingsTab showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: DS.primaryContainer, color: DS.onPrimary, padding: "10px 24px",
          borderRadius: 12, fontSize: 14, zIndex: 300, fontFamily: FONT_BODY,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.3s ease",
        }}>
          {toast}
        </div>
      )}

      {/* Bottom navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 72,
        background: DS.surface, borderTop: `1px solid ${DS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-around",
        zIndex: 50, paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <Link href="/erp/mobile/scan" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <ScanIcon />
          <span style={{ fontSize: 11, fontWeight: 500, color: DS.onSurfaceVariant, fontFamily: FONT_BODY }}>掃描</span>
        </Link>
        <Link href="/erp/mobile/material-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <MaterialIcon active />
          <span style={{ fontSize: 11, fontWeight: 600, color: DS.secondary, fontFamily: FONT_BODY }}>物料卡</span>
        </Link>
        <Link href="/erp/mobile/count" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <CountIcon />
          <span style={{ fontSize: 11, fontWeight: 500, color: DS.onSurfaceVariant, fontFamily: FONT_BODY }}>平日抽盤</span>
        </Link>
      </div>

      {/* Footer text above bottom nav */}
      <div style={{
        position: "fixed", bottom: 72, left: 0, right: 0,
        padding: "6px 14px", fontSize: 10, color: DS.outline, textAlign: "center",
        background: DS.bg, borderTop: `1px solid ${DS.border}`,
      }}>
        祺驊股份有限公司 · 物料進出記錄（本機儲存）
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Card Tab - 物料進出登記
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CardTab({ showToast }: { showToast: (m: string) => void }) {
  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [code, setCode] = useState("");
  const [txType, setTxType] = useState<"in" | "out">("in");
  const [date, setDate] = useState(todayStr());
  const [summary, setSummary] = useState("");
  const [quantity, setQuantity] = useState("");
  const [handler, setHandler] = useState("");
  const [remark, setRemark] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    setMaterials(loadMaterials());
    setTransactions(loadTransactions());
    setHandler(localStorage.getItem(HANDLER_KEY) || "");
    return () => { mountedRef.current = false; };
  }, []);

  const mat = materials[code];
  const stock = code ? getItemStock(code, materials, transactions) : 0;
  const safetyStock = mat?.safetyStock ?? 0;
  const isLow = safetyStock > 0 && stock < safetyStock;

  const itemTxs = transactions.filter(t => t.code === code).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Search ERP parts
  const searchResults = searchQuery.trim()
    ? parts.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  function selectFromERP(p: typeof parts[0]) {
    setCode(p.code);
    const mats = loadMaterials();
    if (!mats[p.code]) {
      mats[p.code] = {
        code: p.code, name: p.name, spec: p.spec ?? "",
        location: "", unit: p.unit, safetyStock: p.safetyStock,
        machine: "", initStock: p.stockOnHand,
      };
      saveMaterials(mats);
      setMaterials(mats);
    }
    setShowSearch(false);
    setSearchQuery("");
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
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
          { fps: 10, qrbox: { width: 220, height: 150 } },
          (decodedText) => {
            const text = decodedText.trim();
            setCode(text);
            const found = parts.find(p => p.code.toUpperCase() === text.toUpperCase());
            if (found) selectFromERP(found);
            stopScanner();
            showToast(`掃描成功: ${text}`);
          },
          () => {},
        );
      } catch (err) {
        if (!mountedRef.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setScanError(msg.includes("NotAllowed") ? "相機權限被拒絕" : `無法啟動相機：${msg}`);
        setScanning(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSave() {
    if (!code.trim()) { showToast("請輸入品號"); return; }
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) { showToast("請輸入有效數量"); return; }
    if (!summary.trim()) { showToast("請輸入摘要/單號"); return; }

    const mats = loadMaterials();
    if (!mats[code]) {
      mats[code] = { code, name: "", spec: "", location: "", unit: "PCS", safetyStock: 0, machine: "", initStock: 0 };
      saveMaterials(mats);
    }

    const txs = loadTransactions();
    txs.push({
      id: Date.now(), code: code.trim(), type: txType, date,
      summary: summary.trim(), quantity: qty,
      handler: handler.trim(), remark: remark.trim(),
      createdAt: new Date().toISOString(),
    });
    saveTransactions(txs);
    setMaterials(loadMaterials());
    setTransactions(txs);
    setQuantity("");
    setSummary("");
    setRemark("");
    showToast(txType === "in" ? "入庫記錄已儲存" : "出庫記錄已儲存");
  }

  async function exportExcel() {
    if (!code) { showToast("請先選擇品號"); return; }
    const XLSX = await import("xlsx");
    const m = materials[code] || {} as Partial<Material>;
    const sorted = [...transactions.filter(t => t.code === code)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rows: (string | number)[][] = [];
    rows.push(["物料進出記錄表　Material In / Out Record", "", "", "", "", "", ""]);
    rows.push(["祺驊股份有限公司 CHI HUA FITNESS　｜　資材部", "", "", "", "", "", ""]);
    rows.push(["品　號", code, "", "品　名", m.name || "", "", ""]);
    rows.push(["規　格", m.spec || "", "", "倉　位", m.location || "", "", ""]);
    rows.push(["庫存單位", m.unit || "PCS", "", "安全庫存量", safetyStock, "← 低於此值警示", ""]);
    rows.push(["適用機種/製程", m.machine || "", "", "目前結存", stock, "狀　態", isLow ? "⚠ 低於安全庫存" : "● 正常"]);
    rows.push([]);
    rows.push(["日期", "摘要 / 單號", "入庫數量", "出庫數量", "結存", "經手人", "備註"]);

    let runningStock = m.initStock || 0;
    if (runningStock > 0) {
      rows.push([sorted.length > 0 ? fmtDate(sorted[0].date) : fmtDate(todayStr()), "期初結存", "", "", runningStock, "—", ""]);
    }
    sorted.forEach(t => {
      runningStock += t.type === "in" ? t.quantity : -t.quantity;
      rows.push([fmtDate(t.date), t.summary, t.type === "in" ? t.quantity : "", t.type === "out" ? t.quantity : "", runningStock, t.handler, t.remark || ""]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "物料進出記錄表");
    XLSX.writeFile(wb, `物料進出記錄_${code}_${todayStr()}.xlsx`);
    showToast("Excel 已匯出");
  }

  const qtyNum = parseInt(quantity) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header card */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: "20px 20px 16px", border: `1px solid ${DS.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            background: DS.secondary, color: DS.onPrimary, fontSize: 10, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20, fontFamily: FONT_HEADLINE, letterSpacing: "0.05em",
          }}>
            ERP SYSTEM
          </span>
          <span style={{ fontSize: 12, color: DS.outline, fontFamily: FONT_MONO }}>V2.4.0</span>
        </div>
        <div style={{ fontFamily: FONT_HEADLINE, fontSize: 24, fontWeight: 700, color: DS.primary, marginBottom: 4 }}>
          物料進出登記
        </div>
        <div style={{ fontSize: 13, color: DS.onSurfaceVariant }}>
          請填寫詳細物料異動資訊
        </div>
      </div>

      {/* 物料編號 with QR scan */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 8 }}>物料編號</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="品號 (如 P03NB001)"
            style={{
              flex: 1, padding: "12px 14px", fontSize: 15, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
              fontFamily: FONT_MONO, color: DS.onSurface,
            }}
          />
          <button
            onClick={() => { setScanError(""); setScanning(true); }}
            style={{
              width: 48, height: 48, borderRadius: 12, border: `1.5px solid ${DS.border}`,
              background: DS.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: DS.onSurfaceVariant,
            }}
          >
            <QrScanIcon />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: "0 16px", borderRadius: 12, border: "none",
              background: DS.secondary, color: DS.onPrimary, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: FONT_BODY, height: 48,
            }}
          >
            ERP
          </button>
        </div>

        {/* ERP search dropdown */}
        {showSearch && (
          <div style={{ marginTop: 10, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋 ERP 料號/品名..."
              autoFocus
              style={{
                width: "100%", padding: "10px 14px", fontSize: 14, border: "none",
                borderBottom: `1px solid ${DS.border}`, outline: "none", fontFamily: FONT_BODY,
                background: DS.bg,
              }}
            />
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {searchResults.map(p => (
                <button
                  key={p.code}
                  onClick={() => selectFromERP(p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 14px", fontSize: 12, textAlign: "left",
                    background: "none", border: "none", cursor: "pointer",
                    borderTop: `1px solid ${DS.border}`, fontFamily: FONT_BODY,
                  }}
                >
                  <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: DS.secondary, fontSize: 11, minWidth: 80 }}>{p.code}</span>
                  <span style={{ flex: 1, color: DS.onSurface }}>{p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.stockOnHand < p.safetyStock ? DS.error : DS.secondary }}>{p.stockOnHand} {p.unit}</span>
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: DS.outline, textAlign: "center" }}>找不到符合的料件</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Overlay */}
      {scanning && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "#000", display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "14px 16px", display: "flex", justifyContent: "space-between",
            alignItems: "center", color: "#fff", background: "rgba(0,0,0,0.8)", zIndex: 10,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: FONT_HEADLINE }}>掃描條碼 / QR Code</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>對準物料標籤即可辨識</div>
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
            <div ref={qrReaderRef} id="qr-material-reader" style={{ width: "100%", maxWidth: 400 }} />
          </div>
        </div>
      )}

      {scanError && (
        <div style={{
          padding: "10px 14px", borderRadius: 12, background: "#FEE2E2", border: `1px solid #FECACA`,
          fontSize: 12, color: DS.error, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>{scanError}</span>
          <button onClick={() => setScanError("")} style={{ background: "none", border: "none", color: DS.error, fontSize: 16, cursor: "pointer", marginLeft: "auto" }}>x</button>
        </div>
      )}

      {/* 物料資訊卡 */}
      {code && mat && (
        <div style={{
          background: DS.surface, borderRadius: 16, overflow: "hidden",
          border: `1.5px solid ${isLow ? "#FECACA" : DS.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ background: DS.primary, color: DS.onPrimary, padding: "12px 16px" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800 }}>{code}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{mat.name}</div>
            {mat.spec && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{mat.spec}</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ padding: "10px 14px", textAlign: "center", background: isLow ? "#FEE2E2" : "#EFF6FF" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: DS.outline }}>目前結存</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: isLow ? DS.error : DS.secondary, fontFamily: FONT_MONO }}>{stock}</div>
              <div style={{ fontSize: 10, color: DS.outline }}>{mat.unit}</div>
            </div>
            <div style={{ padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: DS.outline }}>安全庫存</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: DS.onSurfaceVariant, fontFamily: FONT_MONO }}>{safetyStock}</div>
              <div style={{ fontSize: 10, color: DS.outline }}>{mat.unit}</div>
            </div>
            <div style={{ padding: "10px 14px", textAlign: "center", background: "#EFF6FF" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: DS.outline }}>倉位</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: DS.secondary, fontFamily: FONT_MONO }}>{mat.location || "—"}</div>
            </div>
          </div>
          {isLow && (
            <div style={{ padding: "8px 16px", background: "#FEE2E2", fontSize: 12, fontWeight: 700, color: DS.error, textAlign: "center" }}>
              低於安全庫存（{safetyStock}），需補貨！
            </div>
          )}
        </div>
      )}

      {/* Grid: 作業類型 | 經辦人員 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{
          background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 8 }}>作業類型</div>
          <select
            value={txType}
            onChange={e => setTxType(e.target.value as "in" | "out")}
            style={{
              width: "100%", padding: "12px 10px", fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
              fontFamily: FONT_BODY, color: DS.onSurface, appearance: "auto",
            }}
          >
            <option value="in">入庫</option>
            <option value="out">出庫</option>
          </select>
        </div>
        <div style={{
          background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 8 }}>經辦人員</div>
          <select
            value={handler}
            onChange={e => setHandler(e.target.value)}
            style={{
              width: "100%", padding: "12px 10px", fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
              fontFamily: FONT_BODY, color: DS.onSurface, boxSizing: "border-box",
              appearance: "auto",
            }}
          >
            <option value="">請選擇人員</option>
            {WAREHOUSE_STAFF.map(s => (
              <option key={s.id} value={`${s.id} ${s.name}`}>{s.id} {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 異動日期 + 異動原因 */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 8 }}>異動日期</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
              fontFamily: FONT_BODY, color: DS.onSurface, boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 8 }}>異動原因</div>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="如：進貨入庫 (PO-1180)"
            rows={2}
            style={{
              width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
              fontFamily: FONT_BODY, color: DS.onSurface, resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 8 }}>備註</div>
          <input
            type="text"
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="選填"
            style={{
              width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, background: DS.bg, outline: "none",
              fontFamily: FONT_BODY, color: DS.onSurface, boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* QUANTITY card */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: 24, border: `2px solid ${DS.secondary}`,
        boxShadow: "0 2px 8px rgba(0,88,190,0.08)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: DS.secondary, letterSpacing: "0.1em", fontFamily: FONT_HEADLINE }}>
          QUANTITY
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={() => setQuantity(String(Math.max(0, qtyNum - 1)))}
            style={{
              width: 48, height: 48, borderRadius: 12, border: `1.5px solid ${DS.border}`,
              background: DS.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: DS.onSurfaceVariant,
            }}
          >
            <MinusIcon />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={quantity}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setQuantity(v);
            }}
            placeholder="0"
            style={{
              width: 120, textAlign: "center", fontSize: 40, fontWeight: 800,
              fontFamily: FONT_MONO, border: "none", outline: "none",
              background: "transparent", color: DS.primary,
            }}
          />
          <button
            onClick={() => setQuantity(String(qtyNum + 1))}
            style={{
              width: 48, height: 48, borderRadius: 12, border: `1.5px solid ${DS.secondary}`,
              background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: DS.secondary,
            }}
          >
            <PlusIcon />
          </button>
        </div>
        <div style={{ fontSize: 11, color: DS.outline }}>{mat?.unit || "PCS"}</div>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSave}
        style={{
          width: "100%", height: 64, borderRadius: 16, border: "none",
          background: DS.primary, color: DS.onPrimary, fontSize: 17, fontWeight: 700,
          cursor: "pointer", fontFamily: FONT_HEADLINE, letterSpacing: "0.02em",
          boxShadow: "0 2px 8px rgba(9,20,38,0.2)",
        }}
      >
        確認登記
      </button>

      {/* Info text */}
      <div style={{ textAlign: "center", fontSize: 11, color: DS.outline, padding: "0 8px" }}>
        資料將即時同步至雲端伺服器
      </div>

      {/* 該品號交易明細 */}
      {code && itemTxs.length > 0 && (
        <div style={{
          background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: DS.outline, letterSpacing: "0.08em", marginBottom: 8 }}>
            進出明細（{code}）
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${DS.border}` }}>
                  {["日期", "摘要", "入庫", "出庫", "結存", "經手人"].map(h => (
                    <th key={h} style={{ padding: "6px 4px", textAlign: "left", fontSize: 10, fontWeight: 700, color: DS.outline, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let running = mat?.initStock ?? 0;
                  return itemTxs.map(t => {
                    running += t.type === "in" ? t.quantity : -t.quantity;
                    const lowRow = safetyStock > 0 && running < safetyStock;
                    return (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "6px 4px", whiteSpace: "nowrap", fontSize: 11 }}>{fmtDate(t.date)}</td>
                        <td style={{ padding: "6px 4px", fontSize: 11 }}>{t.summary}</td>
                        <td style={{ padding: "6px 4px", color: DS.secondary, fontWeight: 700 }}>{t.type === "in" ? t.quantity : ""}</td>
                        <td style={{ padding: "6px 4px", color: DS.error, fontWeight: 700 }}>{t.type === "out" ? t.quantity : ""}</td>
                        <td style={{ padding: "6px 4px", fontWeight: 700, color: lowRow ? DS.error : DS.onSurface }}>{running}</td>
                        <td style={{ padding: "6px 4px", fontSize: 11, color: DS.onSurfaceVariant }}>{t.handler}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 匯出 Excel */}
      {code && (
        <button
          onClick={exportExcel}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            background: DS.surface, border: `1.5px solid ${DS.secondary}`,
            color: DS.secondary, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY,
          }}
        >
          匯出 Excel（{code}）
        </button>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Records Tab - 歷史記錄
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function RecordsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCode, setFilterCode] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

  useEffect(() => {
    setTransactions(loadTransactions());
  }, []);

  const filtered = transactions
    .filter(t => !filterCode || t.code.toLowerCase().includes(filterCode.toLowerCase()))
    .filter(t => filterType === "all" || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={filterCode}
          onChange={e => setFilterCode(e.target.value)}
          placeholder="搜尋品號..."
          style={{
            flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 12,
            border: `1.5px solid ${DS.border}`, outline: "none", fontFamily: FONT_BODY,
            background: DS.surface,
          }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as "all" | "in" | "out")}
          style={{
            padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${DS.border}`,
            fontSize: 14, fontFamily: FONT_BODY, background: DS.surface,
          }}
        >
          <option value="all">全部</option>
          <option value="in">入庫</option>
          <option value="out">出庫</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: DS.outline, fontSize: 13 }}>尚無記錄</div>
      ) : (
        <div style={{
          background: DS.surface, borderRadius: 16, border: `1px solid ${DS.border}`, overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {filtered.map((t, i) => (
            <div key={t.id} style={{
              padding: "12px 14px", borderTop: i > 0 ? `1px solid ${DS.border}` : "none",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: t.type === "in" ? "#EFF6FF" : "#FEE2E2", fontSize: 14, fontWeight: 700,
                color: t.type === "in" ? DS.secondary : DS.error,
              }}>
                {t.type === "in" ? "IN" : "OUT"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: DS.secondary }}>{t.code}</span>
                  <span style={{ fontSize: 11, color: DS.outline }}>{fmtDate(t.date)}</span>
                </div>
                <div style={{ fontSize: 12, color: DS.onSurfaceVariant, marginTop: 2 }}>{t.summary}</div>
              </div>
              <div style={{
                fontSize: 16, fontWeight: 800, minWidth: 50, textAlign: "right",
                fontFamily: FONT_MONO,
                color: t.type === "in" ? DS.secondary : DS.error,
              }}>
                {t.type === "in" ? "+" : "-"}{t.quantity}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Settings Tab - 設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SettingsTab({ showToast }: { showToast: (m: string) => void }) {
  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const [defaultHandler, setDefaultHandler] = useState("");
  const [editCode, setEditCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Edit form state
  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");
  const [fSpec, setFSpec] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fUnit, setFUnit] = useState("PCS");
  const [fSafety, setFSafety] = useState("");
  const [fMachine, setFMachine] = useState("");
  const [fInitStock, setFInitStock] = useState("");

  useEffect(() => {
    setMaterials(loadMaterials());
    setDefaultHandler(localStorage.getItem(HANDLER_KEY) || "");
  }, []);

  function openModal(code: string | null) {
    if (code) {
      const m = loadMaterials()[code];
      if (m) {
        setFCode(m.code); setFName(m.name); setFSpec(m.spec); setFLocation(m.location);
        setFUnit(m.unit); setFSafety(String(m.safetyStock || "")); setFMachine(m.machine);
        setFInitStock(String(m.initStock || ""));
      }
    } else {
      setFCode(""); setFName(""); setFSpec(""); setFLocation("");
      setFUnit("PCS"); setFSafety(""); setFMachine(""); setFInitStock("");
    }
    setEditCode(code);
    setShowModal(true);
  }

  function saveModal() {
    if (!fCode.trim()) { showToast("品號不可為空"); return; }
    const mats = loadMaterials();
    mats[fCode.trim()] = {
      code: fCode.trim(), name: fName, spec: fSpec, location: fLocation,
      unit: fUnit || "PCS", safetyStock: parseInt(fSafety) || 0,
      machine: fMachine, initStock: parseInt(fInitStock) || 0,
    };
    saveMaterials(mats);
    setMaterials(mats);
    setShowModal(false);
    showToast(`已儲存 ${fCode.trim()}`);
  }

  function deleteMat(code: string) {
    if (!confirm(`確定刪除 ${code}？`)) return;
    const mats = loadMaterials();
    delete mats[code];
    saveMaterials(mats);
    setMaterials(mats);
    showToast(`已刪除 ${code}`);
  }

  function saveHandler() {
    localStorage.setItem(HANDLER_KEY, defaultHandler);
    showToast("預設經手人已儲存");
  }

  function exportBackup() {
    const data = { materials: loadMaterials(), transactions: loadTransactions(), handler: localStorage.getItem(HANDLER_KEY) || "", exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `物料備份_${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("備份已匯出");
  }

  function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.materials) saveMaterials(data.materials);
        if (data.transactions) saveTransactions(data.transactions);
        if (data.handler) localStorage.setItem(HANDLER_KEY, data.handler);
        setMaterials(loadMaterials());
        showToast("備份匯入成功");
      } catch { showToast("匯入失敗：格式錯誤"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const codes = Object.keys(materials);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 物料主檔 */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: DS.outline, letterSpacing: "0.08em" }}>物料主檔（{codes.length}）</div>
          <button
            onClick={() => openModal(null)}
            style={{
              padding: "6px 14px", borderRadius: 10, border: "none",
              background: DS.primary, color: DS.onPrimary, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: FONT_BODY,
            }}
          >
            + 新增
          </button>
        </div>
        {codes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: DS.outline, fontSize: 12 }}>尚未建立物料主檔</div>
        ) : (
          codes.map(c => {
            const m = materials[c];
            return (
              <div key={c} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${DS.border}`, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: DS.secondary }}>{c}</div>
                  <div style={{ fontSize: 12, color: DS.onSurfaceVariant }}>{m.name}{m.spec ? ` / ${m.spec}` : ""}</div>
                </div>
                <button onClick={() => openModal(c)} style={{
                  padding: "4px 10px", borderRadius: 8, border: `1px solid ${DS.border}`,
                  background: DS.surface, fontSize: 11, cursor: "pointer", fontFamily: FONT_BODY,
                }}>編輯</button>
                <button onClick={() => deleteMat(c)} style={{
                  padding: "4px 10px", borderRadius: 8, border: "none",
                  background: "#FEE2E2", color: DS.error, fontSize: 11, cursor: "pointer", fontFamily: FONT_BODY,
                }}>刪除</button>
              </div>
            );
          })
        )}
      </div>

      {/* 預設經手人 */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: DS.outline, letterSpacing: "0.08em", marginBottom: 8 }}>預設經手人</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={defaultHandler} onChange={e => setDefaultHandler(e.target.value)}
            placeholder="姓名"
            style={{
              flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${DS.border}`, outline: "none", fontFamily: FONT_BODY,
              background: DS.bg,
            }}
          />
          <button onClick={saveHandler} style={{
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: DS.primary, color: DS.onPrimary, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: FONT_BODY,
          }}>儲存</button>
        </div>
      </div>

      {/* 資料管理 */}
      <div style={{
        background: DS.surface, borderRadius: 16, padding: 16, border: `1px solid ${DS.border}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: DS.outline, letterSpacing: "0.08em", marginBottom: 10 }}>資料管理</div>
        <button onClick={exportBackup} style={{
          width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${DS.secondary}`,
          background: DS.surface, color: DS.secondary, fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: FONT_BODY, marginBottom: 8,
        }}>
          匯出備份 (JSON)
        </button>
        <label style={{
          display: "block", width: "100%", padding: "12px", borderRadius: 12,
          border: `1.5px solid ${DS.outline}`, background: DS.surface, color: DS.onSurfaceVariant,
          fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY, textAlign: "center",
          boxSizing: "border-box",
        }}>
          匯入備份 (JSON)
          <input type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
        </label>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16,
        }}>
          <div style={{
            background: DS.surface, borderRadius: 20, padding: 20, width: "100%",
            maxWidth: 400, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, fontFamily: FONT_HEADLINE, color: DS.primary }}>
              {editCode ? "編輯物料" : "新增物料"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FieldInput label="品號 *" value={fCode} onChange={setFCode} placeholder="如 P03NB001" disabled={!!editCode} mono />
              <FieldInput label="品名" value={fName} onChange={setFName} />
              <FieldInput label="規格" value={fSpec} onChange={setFSpec} />
              <FieldInput label="倉位" value={fLocation} onChange={setFLocation} placeholder="如 A100" />
              <FieldInput label="庫存單位" value={fUnit} onChange={setFUnit} />
              <FieldInput label="安全庫存量" type="number" value={fSafety} onChange={setFSafety} />
              <FieldInput label="適用機種/製程" value={fMachine} onChange={setFMachine} />
              <FieldInput label="期初結存" type="number" value={fInitStock} onChange={setFInitStock} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${DS.border}`,
                background: DS.surface, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT_BODY,
                color: DS.onSurfaceVariant,
              }}>取消</button>
              <button onClick={saveModal} style={{
                flex: 1, padding: "12px", borderRadius: 12, border: "none",
                background: DS.primary, color: DS.onPrimary, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: FONT_BODY,
              }}>儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FieldInput({ label, value, onChange, placeholder, type, disabled, mono }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean; mono?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: DS.onSurfaceVariant, marginBottom: 4 }}>{label}</div>
      <input
        type={type || "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 12,
          border: `1.5px solid ${DS.border}`, background: disabled ? DS.surfaceContainer : DS.bg,
          outline: "none", fontFamily: mono ? FONT_MONO : FONT_BODY, color: DS.onSurface,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
