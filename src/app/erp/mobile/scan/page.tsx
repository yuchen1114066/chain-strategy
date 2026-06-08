"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
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

export default function MobileScanPage() {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function simulateScan() {
    setScanning(true);
    setTimeout(() => {
      const sample = parts[Math.floor(Math.random() * Math.min(30, parts.length))];
      setSelectedCode(sample.code);
      setQuery("");
      setScanning(false);
    }, 800);
  }

  return (
    <div style={{
      minHeight: "100dvh", background: BR.page,
      fontFamily: "'Noto Sans TC', 'Sora', system-ui, sans-serif",
      color: BR.ink,
    }}>
      {/* Top Bar */}
      <div style={{
        background: BR.greenInk, color: "#fff", padding: "12px 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selectedCode ? (
            <button
              onClick={() => setSelectedCode(null)}
              style={{
                background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
                padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                fontFamily: "inherit",
              }}
            >
              ← 返回搜尋
            </button>
          ) : (
            <Link
              href="/erp"
              style={{
                background: "rgba(255,255,255,0.12)", color: "#fff",
                padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              ← 主選單
            </Link>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: "0.1em", fontFamily: "'Sora', sans-serif" }}>
              CHI HUA · WAREHOUSE
            </div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>倉庫零件查詢</div>
          </div>
          <div style={{
            fontSize: 9, background: BR.green, padding: "3px 8px", borderRadius: 99,
            fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            {parts.length} 料件
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
            onClick={simulateScan}
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
        ⚠ 本機僅查詢，扣帳 / 入庫 / 異動請至鼎新 ERP · 純讀取不回寫
      </div>
    </div>
  );
}

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
      {/* === 主卡 — 零件卡 === */}
      <div style={{
        background: "#fff", borderRadius: 16, overflow: "hidden",
        border: `1.5px solid ${stockBorder}`,
        boxShadow: "0 2px 8px rgba(12,18,8,.06)",
      }}>
        {/* Card Header */}
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

        {/* 三大數字 — 一目了然 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${BR.border}` }}>
          <NumberBlock
            label="在庫數量"
            value={p.stockOnHand.toString()}
            unit={p.unit}
            color={stockColor}
            bg={stockBg}
            large
          />
          <NumberBlock
            label="安全庫存"
            value={p.safetyStock.toString()}
            unit={p.unit}
            color={BR.inkSoft}
            bg="#fff"
          />
          <NumberBlock
            label="倉位"
            value={location}
            color={BR.cyan}
            bg={BR.cyanSoft}
            mono
          />
        </div>

        {/* 庫存 bar */}
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BR.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: BR.inkFaint, marginBottom: 4 }}>
            <span>庫存水位</span>
            <span style={{ color: stockColor, fontWeight: 700 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "#f0f0ec", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${Math.min(pct, 100)}%`,
              background: stockColor,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: BR.inkFaint, marginTop: 3 }}>
            <span>0</span>
            <span style={{ color: BR.amber }}>安全線 {p.safetyStock}</span>
            <span>{Math.max(p.stockOnHand, p.safetyStock * 2)}</span>
          </div>
        </div>

        {/* 詳細資料 */}
        <div style={{ padding: "12px 16px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          }}>
            <InfoRow label="分類" value={p.category} />
            <InfoRow label="屬性" value={KIND_LABEL[p.kind ?? "purchase"] ?? p.kind ?? "採購件"} />
            <InfoRow label="單價" value={`$${p.unitCost.toLocaleString()}`} />
            <InfoRow label="交期" value={`${p.leadDays} 天`} />
            <InfoRow label="單位" value={p.unit} />
            <InfoRow label="庫存金額" value={`$${(p.stockOnHand * p.unitCost).toLocaleString()}`} />
          </div>
        </div>
      </div>

      {/* === 供應商卡 === */}
      {sup && (
        <div style={{
          background: "#fff", borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${BR.border}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>
            供應商
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>🏭 {sup.name}</div>
          <div style={{ fontSize: 12, color: BR.inkSoft, marginTop: 2 }}>
            {sup.country} · {sup.city}
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8,
          }}>
            <InfoRow label="代號" value={sup.code} />
            <InfoRow label="運輸天數" value={`${sup.transitDays} 天`} />
          </div>
        </div>
      )}

      {/* === BOM 使用卡 === */}
      {uniqUsedBy.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${BR.border}`,
        }}>
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
            <div style={{ fontSize: 11, color: BR.inkFaint, marginTop: 4 }}>
              … 等 {uniqUsedBy.length} 個成品
            </div>
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
    <div style={{
      padding: "12px 14px", background: bg, textAlign: "center",
      borderRight: `1px solid #e9ece3`,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#9aa291", letterSpacing: "0.06em", marginBottom: 4 }}>
        {label}
      </div>
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
