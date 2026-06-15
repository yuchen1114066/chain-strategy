"use client";

import { useState } from "react";

// 站台登入頁
//
// 只有單一密碼欄位 — 這是小團隊內部 app，不做帳號管理。
// 想撤銷全站 session？管理員去改 AUTH_SECRET、redeploy → 所有人重登。

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  page: "#fbfcfa", card: "#ffffff",
  border: "#e9ece3",
  red: "#d4351c", redSoft: "#fdecea",
} as const;
const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";
const FONT_HEAD = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "登入失敗");
        setLoading(false);
        return;
      }
      // 成功 → 導回 next，預設 /erp
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/erp";
      // 用 href 不用 router.push — middleware 會重新驗 cookie
      window.location.href = next;
    } catch {
      setError("網路錯誤，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: BR.page, color: BR.ink, fontFamily: FONT,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%", maxWidth: 400,
          background: BR.card, border: `1px solid ${BR.border}`, borderRadius: 14,
          padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(12,18,8,.06)",
        }}
      >
        <div style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
          color: BR.greenDeep, letterSpacing: "0.12em", marginBottom: 6,
        }}>
          CHAIN STRATEGY · INTERNAL APP
        </div>
        <h1 style={{
          fontFamily: FONT_HEAD, fontSize: 24, fontWeight: 800, color: BR.ink, lineHeight: 1.2,
          marginBottom: 8,
        }}>
          🔒 站台登入
        </h1>
        <p style={{ fontSize: 13, color: BR.inkSoft, marginBottom: 22, lineHeight: 1.55 }}>
          此 app 為祺驊內部試用，請輸入由管理員提供的共用密碼。
        </p>

        <label className="block">
          <div style={{ fontSize: 12, color: BR.inkSoft, marginBottom: 6, fontFamily: FONT_MONO }}>
            密碼
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            disabled={loading}
            className="w-full rounded-[8px] px-3 py-2.5"
            style={{
              fontFamily: FONT_MONO, fontSize: 14,
              border: `1.5px solid ${error ? BR.red : BR.border}`,
              background: "#fbfcfa", color: BR.ink,
            }}
          />
        </label>

        {error && (
          <div className="mt-3 p-2.5 rounded-[6px]" style={{
            background: BR.redSoft, border: `1px solid ${BR.red}`,
            fontSize: 12.5, color: BR.red,
          }}>
            ⚠ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full mt-5 px-4 py-2.5 rounded-[8px] font-bold"
          style={{
            background: BR.green, color: "#fff", fontSize: 14,
            opacity: (loading || !password) ? 0.5 : 1,
            cursor: loading ? "wait" : "pointer",
            border: "none",
          }}
        >
          {loading ? "驗證中…" : "登入"}
        </button>

        <div className="mt-5 pt-4 border-t" style={{
          borderColor: BR.border,
          fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO, lineHeight: 1.55,
        }}>
          🔐 此 session cookie httpOnly · sameSite=lax · 7 天到期
          <br />
          🚫 此站不對外公開、不被搜尋引擎收錄
        </div>
      </form>
    </div>
  );
}

// 注意：不能在 "use client" 檔案 export metadata
// 反爬靠 middleware 設的 X-Robots-Tag header，比 meta tag 強
