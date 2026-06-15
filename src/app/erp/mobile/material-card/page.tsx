"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { parts } from "@/lib/erp/seed";

// ─── Brand colors (matching scan page) ───
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

// ─── localStorage keys ───
const MAT_KEY = "chihua.material_master";
const TX_KEY = "chihua.material_transactions";
const HANDLER_KEY = "chihua.default_handler";

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

// ─── Main page ───
export default function MaterialCardPage() {
  const [tab, setTab] = useState<TabId>("card");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
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
            <div style={{ fontSize: 16, fontWeight: 700 }}>物料進出卡</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `1.5px solid ${BR.border}`, background: "#fff" }}>
        {([["card", "📋 進出登記"], ["records", "📊 歷史記錄"], ["settings", "⚙ 設定"]] as [TabId, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: tab === id ? BR.greenSoft : "#fff",
              color: tab === id ? BR.greenDeep : BR.inkFaint,
              borderBottom: tab === id ? `2.5px solid ${BR.green}` : "2.5px solid transparent",
              fontFamily: FONT,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", paddingBottom: 80 }}>
        {tab === "card" && <CardTab showToast={showToast} />}
        {tab === "records" && <RecordsTab />}
        {tab === "settings" && <SettingsTab showToast={showToast} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "#323232", color: "#fff", padding: "10px 24px", borderRadius: 8, fontSize: 14, zIndex: 300,
          animation: "fadeIn 0.3s ease",
        }}>
          {toast}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "6px 14px", fontSize: 10, color: BR.inkFaint, textAlign: "center",
        borderTop: `1px solid ${BR.border}`, background: "#fff",
        position: "sticky", bottom: 0,
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
    // Auto-fill material master if not exists
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
            // try to find in ERP
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
    showToast(txType === "in" ? "✓ 入庫記錄已儲存" : "✓ 出庫記錄已儲存");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 品號選擇區 */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${BR.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>選擇品號</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="品號 (如 P03NB001)"
            style={{
              flex: 1, padding: "12px 14px", fontSize: 15, borderRadius: 10,
              border: `1.5px solid ${BR.borderHi}`, background: "#fff", outline: "none", fontFamily: "'IBM Plex Mono', monospace",
            }}
          />
          <button
            onClick={() => { setScanError(""); setScanning(true); }}
            style={{
              padding: "12px 16px", borderRadius: 10, border: "none",
              background: BR.greenInk, color: "#fff", fontSize: 20, cursor: "pointer", minWidth: 50,
            }}
          >
            📷
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              padding: "12px 16px", borderRadius: 10, border: "none",
              background: BR.cyan, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            ERP
          </button>
        </div>

        {/* ERP search dropdown */}
        {showSearch && (
          <div style={{ marginTop: 8, border: `1px solid ${BR.border}`, borderRadius: 10, overflow: "hidden" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜尋 ERP 料號/品名..."
              autoFocus
              style={{
                width: "100%", padding: "10px 14px", fontSize: 14, border: "none",
                borderBottom: `1px solid ${BR.border}`, outline: "none", fontFamily: FONT,
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
                    borderTop: `1px solid ${BR.border}`, fontFamily: FONT,
                  }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: BR.greenDeep, fontSize: 11, minWidth: 80 }}>{p.code}</span>
                  <span style={{ flex: 1, color: BR.ink }}>{p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.stockOnHand < p.safetyStock ? BR.red : BR.greenDeep }}>{p.stockOnHand} {p.unit}</span>
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div style={{ padding: "12px 14px", fontSize: 12, color: BR.inkFaint, textAlign: "center" }}>找不到符合的料件</div>
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
              <div style={{ fontSize: 15, fontWeight: 700 }}>掃描條碼 / QR Code</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>對準物料標籤即可辨識</div>
            </div>
            <button
              onClick={stopScanner}
              style={{
                background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
                padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
              }}
            >
              ✕ 關閉
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <div ref={qrReaderRef} id="qr-material-reader" style={{ width: "100%", maxWidth: 400 }} />
          </div>
        </div>
      )}

      {scanError && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, background: BR.redSoft, border: `1px solid #f5c2c0`,
          fontSize: 12, color: BR.red, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>⚠️ {scanError}</span>
          <button onClick={() => setScanError("")} style={{ background: "none", border: "none", color: BR.red, fontSize: 16, cursor: "pointer", marginLeft: "auto" }}>×</button>
        </div>
      )}

      {/* 物料資訊卡 */}
      {code && mat && (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: `1.5px solid ${isLow ? "#f5c2c0" : BR.greenLine}` }}>
          <div style={{ background: BR.greenInk, color: "#fff", padding: "12px 16px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 800 }}>{code}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{mat.name}</div>
            {mat.spec && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>📐 {mat.spec}</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${BR.border}` }}>
            <div style={{ padding: "10px 14px", textAlign: "center", background: isLow ? BR.redSoft : BR.greenSoft }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: BR.inkFaint }}>目前結存</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: isLow ? BR.red : BR.greenDeep }}>{stock}</div>
              <div style={{ fontSize: 10, color: BR.inkFaint }}>{mat.unit}</div>
            </div>
            <div style={{ padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: BR.inkFaint }}>安全庫存</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: BR.inkSoft }}>{safetyStock}</div>
              <div style={{ fontSize: 10, color: BR.inkFaint }}>{mat.unit}</div>
            </div>
            <div style={{ padding: "10px 14px", textAlign: "center", background: BR.cyanSoft }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: BR.inkFaint }}>倉位</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: BR.cyan, fontFamily: "'IBM Plex Mono', monospace" }}>{mat.location || "—"}</div>
            </div>
          </div>
          {isLow && (
            <div style={{ padding: "8px 16px", background: BR.redSoft, fontSize: 12, fontWeight: 700, color: BR.red, textAlign: "center" }}>
              ⚠ 低於安全庫存（{safetyStock}），需補貨！
            </div>
          )}
        </div>
      )}

      {/* 進出登記表單 */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${BR.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 10 }}>進出登記</div>

        {/* 入庫/出庫切換 */}
        <div style={{ display: "flex", gap: 0, borderRadius: 10, overflow: "hidden", border: `2px solid ${txType === "out" ? BR.red : BR.green}`, marginBottom: 12 }}>
          <button
            onClick={() => setTxType("in")}
            style={{
              flex: 1, padding: "10px", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
              background: txType === "in" ? BR.green : "#fff",
              color: txType === "in" ? "#fff" : BR.green,
            }}
          >
            📥 入庫
          </button>
          <button
            onClick={() => setTxType("out")}
            style={{
              flex: 1, padding: "10px", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
              background: txType === "out" ? BR.red : "#fff",
              color: txType === "out" ? "#fff" : BR.red,
            }}
          >
            📤 出庫
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <InputField label="日期" type="date" value={date} onChange={setDate} />
          <InputField label="摘要 / 單號" value={summary} onChange={setSummary} placeholder="如：進貨入庫 (PO-1180)" />
          <InputField label={txType === "in" ? "入庫數量" : "出庫數量"} type="number" value={quantity} onChange={setQuantity} placeholder="0" />
          <InputField label="經手人" value={handler} onChange={setHandler} placeholder="經手人姓名" />
          <InputField label="備註" value={remark} onChange={setRemark} placeholder="選填" />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: "100%", marginTop: 14, padding: "14px", borderRadius: 10, border: "none",
            background: txType === "out" ? BR.red : BR.greenInk,
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
          }}
        >
          {txType === "in" ? "📥 儲存入庫記錄" : "📤 儲存出庫記錄"}
        </button>
      </div>

      {/* 該品號交易明細 */}
      {code && itemTxs.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${BR.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
            進出明細（{code}）
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${BR.border}` }}>
                  {["日期", "摘要", "入庫", "出庫", "結存", "經手人"].map(h => (
                    <th key={h} style={{ padding: "6px 4px", textAlign: "left", fontSize: 10, fontWeight: 700, color: BR.inkFaint, whiteSpace: "nowrap" }}>{h}</th>
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
                      <tr key={t.id} style={{ borderBottom: `1px solid ${BR.border}` }}>
                        <td style={{ padding: "6px 4px", whiteSpace: "nowrap", fontSize: 11 }}>{fmtDate(t.date)}</td>
                        <td style={{ padding: "6px 4px", fontSize: 11 }}>{t.summary}</td>
                        <td style={{ padding: "6px 4px", color: BR.greenDeep, fontWeight: 700 }}>{t.type === "in" ? t.quantity : ""}</td>
                        <td style={{ padding: "6px 4px", color: BR.red, fontWeight: 700 }}>{t.type === "out" ? t.quantity : ""}</td>
                        <td style={{ padding: "6px 4px", fontWeight: 700, color: lowRow ? BR.red : BR.ink }}>{running}</td>
                        <td style={{ padding: "6px 4px", fontSize: 11, color: BR.inkSoft }}>{t.handler}</td>
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
            width: "100%", padding: "14px", borderRadius: 10,
            background: "#fff", border: `1.5px solid ${BR.green}`,
            color: BR.greenDeep, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
          }}
        >
          📊 匯出 Excel（{code}）
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
            flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 10,
            border: `1.5px solid ${BR.borderHi}`, outline: "none", fontFamily: FONT,
          }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as "all" | "in" | "out")}
          style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${BR.borderHi}`, fontSize: 14, fontFamily: FONT }}
        >
          <option value="all">全部</option>
          <option value="in">入庫</option>
          <option value="out">出庫</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, color: BR.inkFaint, fontSize: 13 }}>尚無記錄</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${BR.border}`, overflow: "hidden" }}>
          {filtered.map((t, i) => (
            <div key={t.id} style={{
              padding: "10px 14px", borderTop: i > 0 ? `1px solid ${BR.border}` : "none",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                background: t.type === "in" ? BR.greenSoft : BR.redSoft, fontSize: 16,
              }}>
                {t.type === "in" ? "📥" : "📤"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color: BR.greenDeep }}>{t.code}</span>
                  <span style={{ fontSize: 11, color: BR.inkFaint }}>{fmtDate(t.date)}</span>
                </div>
                <div style={{ fontSize: 12, color: BR.inkSoft, marginTop: 2 }}>{t.summary}</div>
              </div>
              <div style={{
                fontSize: 16, fontWeight: 800, minWidth: 50, textAlign: "right",
                color: t.type === "in" ? BR.greenDeep : BR.red,
              }}>
                {t.type === "in" ? "+" : "−"}{t.quantity}
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
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${BR.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em" }}>物料主檔（{codes.length}）</div>
          <button
            onClick={() => openModal(null)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: BR.greenInk, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}
          >
            + 新增
          </button>
        </div>
        {codes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: BR.inkFaint, fontSize: 12 }}>尚未建立物料主檔</div>
        ) : (
          codes.map(c => {
            const m = materials[c];
            return (
              <div key={c} style={{ display: "flex", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${BR.border}`, gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color: BR.greenDeep }}>{c}</div>
                  <div style={{ fontSize: 12, color: BR.inkSoft }}>{m.name}{m.spec ? ` / ${m.spec}` : ""}</div>
                </div>
                <button onClick={() => openModal(c)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${BR.border}`, background: "#fff", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>編輯</button>
                <button onClick={() => deleteMat(c)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: BR.redSoft, color: BR.red, fontSize: 11, cursor: "pointer", fontFamily: FONT }}>刪除</button>
              </div>
            );
          })
        )}
      </div>

      {/* 預設經手人 */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${BR.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>預設經手人</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text" value={defaultHandler} onChange={e => setDefaultHandler(e.target.value)}
            placeholder="姓名"
            style={{ flex: 1, padding: "10px 14px", fontSize: 14, borderRadius: 10, border: `1.5px solid ${BR.borderHi}`, outline: "none", fontFamily: FONT }}
          />
          <button onClick={saveHandler} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: BR.greenInk, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>儲存</button>
        </div>
      </div>

      {/* 資料管理 */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: `1px solid ${BR.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 10 }}>資料管理</div>
        <button onClick={exportBackup} style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1.5px solid ${BR.green}`, background: "#fff", color: BR.greenDeep, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginBottom: 8 }}>
          📦 匯出備份 (JSON)
        </button>
        <label style={{ display: "block", width: "100%", padding: "10px", borderRadius: 8, border: `1.5px solid ${BR.cyan}`, background: "#fff", color: BR.cyan, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, textAlign: "center" }}>
          📥 匯入備份 (JSON)
          <input type="file" accept=".json" onChange={importBackup} style={{ display: "none" }} />
        </label>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{editCode ? "編輯物料" : "新增物料"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InputField label="品號 *" value={fCode} onChange={setFCode} placeholder="如 P03NB001" disabled={!!editCode} />
              <InputField label="品名" value={fName} onChange={setFName} />
              <InputField label="規格" value={fSpec} onChange={setFSpec} />
              <InputField label="倉位" value={fLocation} onChange={setFLocation} placeholder="如 A100" />
              <InputField label="庫存單位" value={fUnit} onChange={setFUnit} />
              <InputField label="安全庫存量" type="number" value={fSafety} onChange={setFSafety} />
              <InputField label="適用機種/製程" value={fMachine} onChange={setFMachine} />
              <InputField label="期初結存" type="number" value={fInitStock} onChange={setFInitStock} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${BR.borderHi}`, background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>取消</button>
              <button onClick={saveModal} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: BR.greenInk, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>儲存</button>
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

function InputField({ label, value, onChange, placeholder, type, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: BR.inkSoft, marginBottom: 4 }}>{label}</div>
      <input
        type={type || "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 10,
          border: `1.5px solid ${BR.borderHi}`, background: disabled ? "#f5f5f5" : "#fff",
          outline: "none", fontFamily: FONT, color: BR.ink,
        }}
      />
    </div>
  );
}
