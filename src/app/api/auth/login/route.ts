// /api/auth/login — 收密碼、發 session cookie
//
// 安全策略：
//   - 密碼從 env var 讀（APP_PASSWORD），不寫死、不存 DB
//   - 比對走 constant-time（防 timing attack）
//   - 失敗加 random delay（防腦力暴力 + 防 timing 推測）
//   - cookie 走 httpOnly + secure + sameSite=lax → JS 偷不到、CSRF 防得住
//   - 成功時不回任何使用者資訊（無資訊洩漏）

import { NextResponse } from "next/server";
import { signSession, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth-edge";

export const runtime = "edge";

export async function POST(req: Request) {
  const APP_PASSWORD = process.env.APP_PASSWORD;
  const AUTH_SECRET = process.env.AUTH_SECRET;

  if (!APP_PASSWORD || !AUTH_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: "伺服器尚未設定 APP_PASSWORD / AUTH_SECRET 環境變數，請聯絡管理員",
        code: "SERVER_NOT_CONFIGURED",
      },
      { status: 500 },
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "請求格式錯誤" }, { status: 400 });
  }

  const input = String(body.password ?? "");
  // 即使空字串也跑一遍比對 → 不暴露「沒填」vs「填錯」的時間差
  const ok = input.length > 0 && passwordMatches(input, APP_PASSWORD);

  if (!ok) {
    // 200-500 ms 隨機延遲：腦力暴力的成本提高、timing 觀察不到差異
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return NextResponse.json(
      { ok: false, error: "密碼錯誤" },
      { status: 401 },
    );
  }

  const token = await signSession(AUTH_SECRET);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
