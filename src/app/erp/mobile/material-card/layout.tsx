"use client";

import { useState, useEffect, ReactNode } from "react";

const C = {
  primary: "#091426",
  primaryContainer: "#1E293B",
  secondary: "#0058BE",
  secondaryContainer: "#2170E4",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  border: "#E2E8F0",
  outline: "#75777D",
  onSurface: "#1B1B1D",
  onSurfaceVariant: "#45474C",
  onPrimary: "#FFFFFF",
  error: "#DC2626",
  errorSoft: "#FEF2F2",
} as const;
const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";

const WH_AUTH_KEY = "chihua.wh_gate";
const WH_PASSWORD = "chihua2026wh";
const SESSION_HOURS = 12;

function isSessionValid(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(WH_AUTH_KEY);
  if (!raw) return false;
  try {
    const { ts } = JSON.parse(raw);
    const elapsed = Date.now() - ts;
    return elapsed < SESSION_HOURS * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function WarehouseIcon() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 16,
      background: C.secondary,
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 20px",
    }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 20V9L12 4L22 9V20H15V14H9V20H2ZM4 18H7V14C7 13.45 7.196 12.979 7.588 12.587C7.98 12.195 8.45 12 9 12H15C15.55 12 16.021 12.195 16.413 12.587C16.805 12.979 17 13.45 17 14V18H20V10L12 6.2L4 10V18ZM9 20H15V14H9V20Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function WarehouseGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setAuthed(isSessionValid());
    setLoaded(true);
  }, []);

  function submit() {
    if (pw.trim() === WH_PASSWORD) {
      localStorage.setItem(WH_AUTH_KEY, JSON.stringify({ ts: Date.now() }));
      setAuthed(true);
      setError("");
    } else {
      setError("密碼錯誤，請重新輸入");
    }
  }

  if (!loaded) return null;
  if (authed) return <>{children}</>;

  return (
    <div style={{
      minHeight: "100dvh", background: C.primary, fontFamily: FONT,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      {/* Header text above card */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <WarehouseIcon />
        <div style={{
          fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700,
          color: C.onPrimary, marginBottom: 6,
        }}>
          倉庫系統登入
        </div>
        <div style={{
          fontSize: 13, color: "rgba(255,255,255,.5)", letterSpacing: "0.02em",
        }}>
          祺驊倉庫管理系統 — 操作終端
        </div>
      </div>

      {/* Login card */}
      <div style={{
        background: C.surface, borderRadius: 12, padding: "32px 24px",
        width: "100%", maxWidth: 360,
        boxShadow: "0 8px 32px rgba(0,0,0,.3)",
      }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant,
            display: "block", marginBottom: 8,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            倉庫授權密碼 PASSWORD
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="請輸入倉庫密碼"
              style={{
                width: "100%", padding: "14px 48px 14px 16px", fontSize: 16,
                borderRadius: 10,
                border: `1.5px solid ${error ? C.error : C.border}`,
                background: C.background, outline: "none", fontFamily: FONT,
                color: C.onSurface,
                boxSizing: "border-box",
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 20, color: C.outline, padding: 0,
                fontFamily: "'Material Symbols Outlined'",
                lineHeight: 1,
              }}
            >
              {showPw ? "visibility_off" : "visibility"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: C.error, background: C.errorSoft,
            padding: "10px 14px", borderRadius: 8, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!pw.trim()}
          style={{
            width: "100%", padding: "14px", fontSize: 16, fontWeight: 700,
            color: C.onPrimary,
            background: !pw.trim() ? C.outline : C.secondary,
            border: "none", borderRadius: 10,
            cursor: !pw.trim() ? "not-allowed" : "pointer",
            fontFamily: FONT,
            letterSpacing: "0.04em",
            transition: "background 0.2s",
          }}
        >
          授權進入系統
        </button>

        <div style={{
          marginTop: 16, textAlign: "center",
          fontSize: 11, color: C.outline, lineHeight: 1.6,
        }}>
          驗證後 {SESSION_HOURS} 小時內免重新輸入
        </div>
      </div>

      {/* Bottom status */}
      <div style={{
        marginTop: 28, display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "rgba(255,255,255,.45)",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#22C55E", display: "inline-block",
          }} />
          系統連線正常
          <span style={{ marginLeft: 4, fontFamily: "'Sora', monospace", fontSize: 11 }}>
            V.2.4.0
          </span>
        </div>
        <div style={{
          fontSize: 10, color: "rgba(255,255,255,.25)",
          letterSpacing: "0.12em", fontFamily: "'Sora', sans-serif",
          textTransform: "uppercase",
        }}>
          SECURE INDUSTRIAL ACCESS ONLY
        </div>
      </div>
    </div>
  );
}

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: C.background }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        rel="stylesheet"
      />
      <WarehouseGate>{children}</WarehouseGate>
    </div>
  );
}
