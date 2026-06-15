// Edge-compatible HMAC sign/verify for the session cookie.
//
// 為什麼自己刻而不用 NextAuth / Clerk？
//   - 客戶要的是「一個密碼把站鎖起來」，不是多人帳號系統
//   - Vercel Edge runtime 不能用 node:crypto，必須走 Web Crypto API
//   - 整套 dependency 少 = 攻擊面小
//
// 安全性：
//   - HMAC-SHA256 簽章 + httpOnly cookie → JS 偷不到、middleware 攔得到
//   - 簽章不含密碼明文，只含「ok + 時間戳 + sig」
//   - 改動任一 byte 就驗失敗（constant-time 比對）
//   - 7 天過期，過期自動踢回 /login
//
// 沒有的功能（也不該有）：
//   - 不存 server side（Vercel 跨 region stateless）→ 沒辦法「撤銷某張 token」
//   - 想撤銷所有 session？把 AUTH_SECRET 改一輪、redeploy
//
// 環境變數：
//   APP_PASSWORD — 共用登入密碼，存在 Vercel env vars，**永遠不要 commit**
//   AUTH_SECRET  — HMAC 簽章 secret，至少 32 字元亂數，**永遠不要 commit**

const enc = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// timing-safe compare（避免 timing attack 推測 sig）
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// 簽出一張 session token：payload.ts.sig
export async function signSession(secret: string): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacHex(secret, `ok.${ts}`);
  return `ok.${ts}.${sig}`;
}

// 驗 token，過期 / 篡改 / 格式錯 → false
export async function verifySession(
  token: string | undefined,
  secret: string,
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [payload, ts, sig] = parts;
  if (payload !== "ok") return false;

  const tsNum = parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) return false;
  const age = Date.now() - tsNum;
  if (age < 0 || age > maxAgeMs) return false;

  const expected = await hmacHex(secret, `${payload}.${ts}`);
  return safeEqual(sig, expected);
}

// 給 / api / auth / login 用的密碼比對 — 也走 constant-time
export function passwordMatches(input: string, expected: string): boolean {
  if (typeof input !== "string" || typeof expected !== "string") return false;
  if (input.length !== expected.length) return false;
  return safeEqual(input, expected);
}

export const SESSION_COOKIE = "cs_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
