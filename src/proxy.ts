// Next.js 16 Proxy（前身：middleware，Next 16 已 deprecate）— 站台級密碼閘
//
// 對所有非 /login / 非 /api/auth / 非靜態資源的 request：
//   1. 驗 cs_session cookie 的 HMAC 簽章
//   2. 無效 → API 回 401、頁面 redirect /login?next=...
//
// 為什麼這層做最乾淨？
//   - proxy 在每個 route 之前跑，所有 page + API 都被擋
//   - Edge runtime 啟動快、不算 serverless function 時間
//   - 不需要在每個 page / API 寫 auth check（容易漏寫）
//
// Next.js 16 注意：函式名必須叫 proxy（或 default export）；舊版叫 middleware

import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth-edge";

// 編譯期就把 secret 撈出來（proxy 跑很多次，每次都讀 env 太浪費）
const AUTH_SECRET = process.env.AUTH_SECRET ?? "";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = AUTH_SECRET ? await verifySession(cookie, AUTH_SECRET) : false;

  if (ok) {
    // 認證通過 → 一律加上安全 header（next.config 的 headers 不會套用到 dynamic API）
    return withSecurityHeaders(NextResponse.next());
  }

  // 未認證 → API 直接回 401（不 redirect，方便 fetch 處理）
  if (pathname.startsWith("/api/")) {
    return withSecurityHeaders(
      NextResponse.json(
        { ok: false, error: "未登入或 session 過期", code: "AUTH_REQUIRED" },
        { status: 401 },
      ),
    );
  }

  // 未認證 → 頁面 redirect 到 /login
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  // 把原本要去的路徑帶上，登入完導回
  url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
  return withSecurityHeaders(NextResponse.redirect(url));
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  // 防點擊劫持
  res.headers.set("X-Frame-Options", "DENY");
  // 防 MIME sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");
  // 隱私：跨網域不送 referer
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // 強制 HTTPS
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  // 拒絕被 Google 收錄
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  // 限制感應器權限
  res.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=()",
  );
  return res;
}

// Matcher：除了登入頁、登入 API、靜態檔、_next 內建，全部都要過 middleware
// 注意：robots.txt / favicon.ico / sitemap.xml 也擋掉（這是私密 app，不該被爬）
export const config = {
  matcher: [
    "/((?!login|api/auth/login|api/auth/logout|_next/static|_next/image|_next/data|favicon\\.ico).*)",
  ],
};
