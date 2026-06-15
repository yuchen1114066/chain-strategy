"use client";

import { useState, useEffect, ReactNode } from "react";

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  page: "#fbfcfa", card: "#ffffff",
  border: "#e9ece3", borderHi: "#dadfd0",
  red: "#d4351c", redSoft: "#fdecea",
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
      minHeight: "100dvh", background: BR.greenInk, fontFamily: FONT,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 28px",
        width: "100%", maxWidth: 360,
        boxShadow: "0 8px 40px rgba(0,0,0,.25)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
          <div style={{
            fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.15em", color: BR.green, marginBottom: 4,
          }}>
            CHI HUA · WAREHOUSE
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: BR.greenInk }}>
            倉庫系統驗證
          </div>
          <div style={{ fontSize: 12, color: BR.inkFaint, marginTop: 6 }}>
            請輸入倉庫專用密碼進入系統
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{
            fontSize: 11, fontWeight: 700, color: BR.inkSoft,
            display: "block", marginBottom: 6,
          }}>
            倉庫密碼
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="請輸入倉庫密碼"
              style={{
                width: "100%", padding: "14px 44px 14px 16px", fontSize: 16,
                borderRadius: 12,
                border: `1.5px solid ${error ? BR.red : BR.borderHi}`,
                background: "#fff", outline: "none", fontFamily: FONT,
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 18, color: BR.inkFaint, padding: 0,
              }}
            >
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
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
          disabled={!pw.trim()}
          style={{
            width: "100%", padding: "14px", fontSize: 16, fontWeight: 700,
            color: "#fff",
            background: !pw.trim() ? BR.inkFaint : BR.greenInk,
            border: "none", borderRadius: 12,
            cursor: !pw.trim() ? "not-allowed" : "pointer",
            fontFamily: FONT,
          }}
        >
          進入倉庫系統
        </button>

        <div style={{
          marginTop: 20, textAlign: "center",
          fontSize: 11, color: BR.inkFaint, lineHeight: 1.6,
        }}>
          密碼驗證後 {SESSION_HOURS} 小時內免重新輸入<br />
          如忘記密碼請聯繫資材部主管
        </div>
      </div>

      <div style={{
        marginTop: 20, fontSize: 10, color: "rgba(255,255,255,.35)",
        textAlign: "center",
      }}>
        祺驊股份有限公司 · 資材部
      </div>
    </div>
  );
}

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#fbfcfa" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
        rel="stylesheet"
      />
      <WarehouseGate>{children}</WarehouseGate>
    </div>
  );
}
