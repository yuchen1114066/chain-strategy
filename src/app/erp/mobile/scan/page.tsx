"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { parts, suppliers, bom, models } from "@/lib/erp/seed";
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

const KIND_LABEL: Record<string, string> = {
  purchase: "採購件", self: "自製件", dummy: "虛設品號",
  feature: "Feature", outsource: "託外加工", option: "Option",
};

const LOCATION_MAP: Record<string, string> = {};
for (const slip of initialSlips) {
  for (const item of slip.items) {
    if (item.location && item.partCode) {
      LOCATION_MAP[item.partCode] = item.location;
    }
  }
}

const WAREHOUSE_STAFF = [
  { id: "242", name: "賴允正", role: "倉管員" },
  { id: "233", name: "林郁展", role: "倉管員" },
  { id: "243", name: "姜湘淇", role: "倉管員" },
  { id: "235", name: "范成義", role: "倉管員" },
];
const STORAGE_KEY = "gascc.wh.login";

type LoginState = { id: string; name: string; role: string; at: string };

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

// ============================================================
// Login Screen
// ============================================================

function LoginScreen({ onLogin }: { onLogin: (s: typeof WAREHOUSE_STAFF[0]) => void }) {
  const [empId, setEmpId] = useState("");
  const [error, setError] = useState("");

  function submit() {
    const q = empId.trim().toUpperCase();
    const found = WAREHOUSE_STAFF.find((s) => s.id === q || s.name === empId.trim());
    if (found) {
      onLogin(found);
    } else {
      setError("找不到此工號或姓名，請確認後重試");
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", background: BR.greenInk, fontFamily: FONT,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 28px", width: "100%",
        maxWidth: 360, boxShadow: "0 8px 40px rgba(0,0,0,.25)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div style={{
            fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.15em", color: BR.green, marginBottom: 4,
          }}>
            CHI HUA · WAREHOUSE
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: BR.greenInk }}>
            倉庫零件查詢系統
          </div>
          <div style={{ fontSize: 12, color: BR.inkFaint, marginTop: 4 }}>
            請輸入工號或姓名登入
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: BR.inkSoft, display: "block", marginBottom: 6 }}>
            工號 / 姓名
          </label>
          <input
            type="text"
            value={empId}
            onChange={(e) => { setEmpId(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="例：242 或 賴允正"
            style={{
              width: "100%", padding: "14px 16px", fontSize: 16, borderRadius: 12,
              border: `1.5px solid ${error ? BR.red : BR.borderHi}`, background: "#fff",
              outline: "none", fontFamily: FONT,
            }}
            autoFocus
          />
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: BR.red, background: BR.redSoft,
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
            color: "#fff", background: !empId.trim() ? BR.inkFaint : BR.greenInk,
            border: "none", borderRadius: 12, cursor: !empId.trim() ? "not-allowed" : "pointer",
            fontFamily: FONT,
          }}
        >
          登入
        </button>

        <div style={{ marginTop: 20, borderTop: `1px solid ${BR.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, marginBottom: 8, letterSpacing: "0.06em" }}>
            倉庫人員（點擊快速登入）
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {WAREHOUSE_STAFF.map((s) => (
              <button
                key={s.id}
                onClick={() => onLogin(s)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  background: BR.greenSoft, border: `1px solid ${BR.greenLine}`, borderRadius: 10,
                  cursor: "pointer", fontFamily: FONT, textAlign: "left",
                }}
              >
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700,
                  color: BR.greenDeep, minWidth: 50,
                }}>
                  {s.id}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: BR.greenInk }}>
                  {s.name}
                </span>
                <span style={{ fontSize: 11, color: BR.inkFaint, flex: 1, textAlign: "right" }}>
                  {s.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 20, textAlign: "center" }}>
        祺驊股份有限公司 · CHI HUA FITNESS CO., LTD.
        <br />純讀取，不回寫鼎新 ERP
      </div>
    </div>
  );
}

// ============================================================
// Scan Screen（登入後的主畫面）
// ============================================================

function ScanScreen({ user, onLogout }: { user: LoginState; onLogout: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return parts.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.spec ?? "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query]);

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
  }, []);

  function startScan() {
    setScanError("");
    setScanning(true);
  }

  return (
    <div style={{
      minHeight: "100dvh", background: BR.page, fontFamily: FONT, color: BR.ink,
    }}>
      {/* Top Bar */}
      <div style={{
        background: BR.greenInk, color: "#fff", padding: "10px 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selectedCode && (
            <button
              onClick={() => setSelectedCode(null)}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
                padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ← 返回
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.1em", fontFamily: "'Sora', sans-serif" }}>
              CHI HUA · WAREHOUSE
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>倉庫零件查詢</div>
          </div>

          {/* 用戶頭像按鈕 */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                background: BR.green, border: "none", color: "#fff",
                width: 36, height: 36, borderRadius: 99, fontSize: 14, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {user.name.slice(0, 1)}
            </button>
            {showMenu && (
              <>
                <div
                  onClick={() => setShowMenu(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 60 }}
                />
                <div style={{
                  position: "absolute", right: 0, top: 42, zIndex: 70,
                  background: "#fff", borderRadius: 12, padding: 12, minWidth: 180,
                  boxShadow: "0 4px 20px rgba(0,0,0,.15)", color: BR.ink,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: BR.inkFaint, marginBottom: 2 }}>
                    {user.id} · {user.role}
                  </div>
                  <div style={{ fontSize: 10, color: BR.inkFaint, marginBottom: 10 }}>
                    登入於 {user.at.slice(11, 16)}
                  </div>
                  <button
                    onClick={onLogout}
                    style={{
                      width: "100%", padding: "10px", fontSize: 13, fontWeight: 700,
                      color: BR.red, background: BR.redSoft, border: `1px solid #f5c2c0`,
                      borderRadius: 8, cursor: "pointer", fontFamily: FONT,
                    }}
                  >
                    登出
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 14px" }}>
        {/* Search + Scan */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedCode(null); }}
              placeholder="搜尋料號 / 品名 / 規格…"
              style={{
                width: "100%", padding: "12px 14px", fontSize: 15, borderRadius: 12,
                border: `1.5px solid ${BR.borderHi}`, background: "#fff", outline: "none",
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setSelectedCode(null); inputRef.current?.focus(); }}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", fontSize: 18, color: BR.inkFaint,
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
              padding: "12px 16px", borderRadius: 12, border: "none",
              background: scanning ? BR.inkFaint : BR.greenInk, color: "#fff",
              fontSize: 22, cursor: scanning ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 52,
            }}
          >
            {scanning ? "…" : "📷"}
          </button>
        </div>

        {/* QR Scanner Overlay */}
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
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ✕ 關閉
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

        {/* Scanner Error */}
        {scanError && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 12,
            background: BR.redSoft, border: `1px solid #f5c2c0`,
            fontSize: 12, color: BR.red, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{scanError}</span>
            <button
              onClick={() => setScanError("")}
              style={{ background: "none", border: "none", color: BR.red, fontSize: 16, cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Search Results */}
        {query && !selectedCode && filtered.length > 0 && (
          <div style={{
            background: "#fff", borderRadius: 12, border: `1px solid ${BR.border}`,
            marginBottom: 12, overflow: "hidden",
          }}>
            {filtered.map((p, i) => (
              <button
                key={p.code}
                onClick={() => handleSelect(p.code)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 14px", fontSize: 13, textAlign: "left",
                  background: "none", border: "none", cursor: "pointer",
                  borderTop: i > 0 ? `1px solid ${BR.border}` : "none",
                  fontFamily: "inherit", color: BR.ink,
                }}
              >
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                  color: BR.greenDeep, fontSize: 12, minWidth: 80,
                }}>
                  {p.code}
                </span>
                <span style={{ flex: 1 }}>{p.name}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: p.stockOnHand < p.safetyStock ? BR.red : BR.greenDeep,
                }}>
                  {p.stockOnHand}
                </span>
              </button>
            ))}
          </div>
        )}

        {query && !selectedCode && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "24px 16px", color: BR.inkFaint, fontSize: 13,
          }}>
            找不到「{query}」— 試試料號或品名關鍵字
          </div>
        )}

        {/* Parts Card — 零件卡 */}
        {selected && (
          <>
            <PartCard code={selected.code} />
            <button
              onClick={() => setSelectedCode(null)}
              style={{
                width: "100%", marginTop: 12, padding: "14px",
                background: "#fff", border: `1.5px solid ${BR.borderHi}`,
                borderRadius: 12, fontSize: 14, fontWeight: 700, color: BR.greenInk,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ← 返回搜尋其他料件
            </button>
          </>
        )}

        {/* Empty State */}
        {!query && !selectedCode && (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>掃 QR 或搜尋料號</div>
            <div style={{ fontSize: 12, color: BR.inkFaint, lineHeight: 1.6 }}>
              輸入料號 / 品名 / 規格，或按 📷 掃描
              <br />即可看到零件卡（庫存 · 品名 · 倉位 · 規格）
            </div>

            {/* 常用料件快捷 */}
            <div style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BR.inkFaint, marginBottom: 8, letterSpacing: "0.06em" }}>
                常用料件（點擊查看零件卡）
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {parts.slice(0, 8).map((p) => (
                  <button
                    key={p.code}
                    onClick={() => handleSelect(p.code)}
                    style={{
                      padding: "10px 12px", borderRadius: 10, textAlign: "left",
                      background: "#fff", border: `1px solid ${BR.border}`,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                      fontWeight: 700, color: BR.greenDeep,
                    }}>
                      {p.code}
                    </div>
                    <div style={{ fontSize: 12, color: BR.ink, marginTop: 2 }}>
                      {p.name}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginTop: 2,
                      color: p.stockOnHand < p.safetyStock ? BR.red : BR.inkSoft,
                    }}>
                      庫存 {p.stockOnHand} {p.unit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 14px", fontSize: 10, color: BR.inkFaint, textAlign: "center",
        borderTop: `1px solid ${BR.border}`, marginTop: 16,
      }}>
        {user.name} ({user.id}) · 純讀取，不回寫鼎新 ERP
      </div>
    </div>
  );
}

// ============================================================
// 零件卡
// ============================================================

function PartCard({ code }: { code: string }) {
  const p = parts.find((x) => x.code === code);
  if (!p) return <div style={{ padding: 20, textAlign: "center", color: "#999" }}>找不到 {code}</div>;

  const sup = suppliers.find((s) => s.id === p.supplierId);
  const low = p.stockOnHand < p.safetyStock;
  const pct = p.safetyStock > 0 ? Math.round((p.stockOnHand / p.safetyStock) * 100) : 999;
  const location = LOCATION_MAP[p.code] ?? "—";

  const usedBy = bom
    .filter((b) => b.partId === p.id && b.isActive)
    .map((b) => models.find((m) => m.id === b.modelId))
    .filter((x): x is NonNullable<typeof x> => !!x);
  const uniqUsedBy = [...new Map(usedBy.map((m) => [m.id, m])).values()];

  const stockColor = low ? BR.red : pct < 150 ? BR.amber : BR.greenDeep;
  const stockBg = low ? BR.redSoft : pct < 150 ? BR.amberSoft : BR.greenSoft;
  const stockBorder = low ? "#f5c2c0" : pct < 150 ? "#f3e1b8" : BR.greenLine;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* === 主卡 === */}
      <div style={{
        background: "#fff", borderRadius: 16, overflow: "hidden",
        border: `1.5px solid ${stockBorder}`,
        boxShadow: "0 2px 8px rgba(12,18,8,.06)",
      }}>
        <div style={{
          background: BR.greenInk, color: "#fff", padding: "14px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 800,
              letterSpacing: "0.04em",
            }}>
              {p.code}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{p.name}</div>
            {p.spec && (
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>📐 {p.spec}</div>
            )}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
            background: low ? BR.red : BR.green, whiteSpace: "nowrap",
          }}>
            {low ? "⚠ 低於安全庫存" : "✓ 庫存正常"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${BR.border}` }}>
          <NumberBlock label="在庫數量" value={p.stockOnHand.toString()} unit={p.unit} color={stockColor} bg={stockBg} large />
          <NumberBlock label="安全庫存" value={p.safetyStock.toString()} unit={p.unit} color={BR.inkSoft} bg="#fff" />
          <NumberBlock label="倉位" value={location} color={BR.cyan} bg={BR.cyanSoft} mono />
        </div>

        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BR.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: BR.inkFaint, marginBottom: 4 }}>
            <span>庫存水位</span>
            <span style={{ color: stockColor, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "#f0f0ec", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, width: `${Math.min(pct, 100)}%`,
              background: stockColor, transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: BR.inkFaint, marginTop: 3 }}>
            <span>0</span>
            <span style={{ color: BR.amber }}>安全線 {p.safetyStock}</span>
            <span>{Math.max(p.stockOnHand, p.safetyStock * 2)}</span>
          </div>
        </div>

        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InfoRow label="分類" value={p.category} />
            <InfoRow label="屬性" value={KIND_LABEL[p.kind ?? "purchase"] ?? p.kind ?? "採購件"} />
            <InfoRow label="單價" value={`$${p.unitCost.toLocaleString()}`} />
            <InfoRow label="交期" value={`${p.leadDays} 天`} />
            <InfoRow label="單位" value={p.unit} />
            <InfoRow label="庫存金額" value={`$${(p.stockOnHand * p.unitCost).toLocaleString()}`} />
          </div>
        </div>
      </div>

      {sup && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: `1px solid ${BR.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>供應商</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>🏭 {sup.name}</div>
          <div style={{ fontSize: 12, color: BR.inkSoft, marginTop: 2 }}>{sup.country} · {sup.city}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
            <InfoRow label="代號" value={sup.code} />
            <InfoRow label="運輸天數" value={`${sup.transitDays} 天`} />
          </div>
        </div>
      )}

      {uniqUsedBy.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: `1px solid ${BR.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>
            被以下成品使用（{uniqUsedBy.length}）
          </div>
          {uniqUsedBy.slice(0, 6).map((m) => (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
              borderTop: `1px solid ${BR.border}`, fontSize: 12,
            }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                color: BR.greenDeep, fontSize: 11, minWidth: 100,
              }}>
                {m.code}
              </span>
              <span style={{ color: BR.inkSoft }}>{m.machineFamily}</span>
            </div>
          ))}
          {uniqUsedBy.length > 6 && (
            <div style={{ fontSize: 11, color: BR.inkFaint, marginTop: 4 }}>… 等 {uniqUsedBy.length} 個成品</div>
          )}
        </div>
      )}
    </div>
  );
}

function NumberBlock({ label, value, unit, color, bg, large, mono }: {
  label: string; value: string; unit?: string; color: string; bg: string;
  large?: boolean; mono?: boolean;
}) {
  return (
    <div style={{ padding: "12px 14px", background: bg, textAlign: "center", borderRight: `1px solid #e9ece3` }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#9aa291", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: large ? 26 : 16, fontWeight: 800, color,
        fontFamily: mono ? "'IBM Plex Mono', monospace" : "'Sora', sans-serif",
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {unit && <div style={{ fontSize: 10, color: "#9aa291", marginTop: 2 }}>{unit}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: BR.inkFaint }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
