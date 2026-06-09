// ERP 直連測試 API
//
// 為什麼是 POST 而非 GET？
//   - 收密碼欄位 → 不能放 query string（會被 log）
//   - server side 用 mssql 套件連到使用者指定的 MSSQL，跑幾個極輕量的 read-only query
//
// 安全性界線：
//   - 收到的密碼用完即丟（不寫檔、不寫 cookie、不放 session）
//   - 只送 SELECT 三個 COUNT 和 @@VERSION，不送任何使用者資料
//   - 連線 timeout 5 秒，避免 DDoS / hanging
//   - 只回報「能不能連、表在不在、筆數對不對」，不回任何具體欄位值
//
// 為什麼需要這個？
//   - 客戶內網裝 ERP 在 192.168.16.201（從 ConductorC.INI 推得）
//   - 我們要直連 DB 跑 Should Cost 之前，必須先讓 IT 確認連線通
//   - 這頁就是給 IT / 鼎新顧問做 5 分鐘可達性驗證

import { NextRequest } from "next/server";
import sql from "mssql";

// 強制 server-side 執行（含 mssql native module）
export const runtime = "nodejs";

type TestRequest = {
  server?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
};

type TestResponse = {
  ok: boolean;
  step?: string;
  versionShort?: string;
  counts?: { items: number; bomParents: number; purchases: number };
  error?: string;
  hint?: string;
  durationMs?: number;
};

const ERROR_HINTS: Array<[RegExp, string]> = [
  [/ETIMEOUT|ETIMEDOUT|getaddrinfo/i, "連線逾時 — 主機 IP 不通。檢查：① IP 是不是內網位址（我們的伺服器看不到 192.168.*）② 防火牆 / VPN ③ MSSQL 是否真的在 1433"],
  [/ECONNREFUSED/i, "連線被拒 — IP 通但 port 沒開。檢查：① MSSQL 是否啟用 TCP/IP（鼎新預設關閉）② 1433 是不是改過 ③ Windows 防火牆"],
  [/Login failed/i, "帳號 / 密碼錯誤，或該帳號沒有資料庫存取權"],
  [/Cannot open database/i, "資料庫名稱錯了。鼎新慣用 `eproerp`，請跟 MIS 確認正式機庫名"],
  [/Invalid object name 'INVMB'|Invalid object name 'BOMMB'|Invalid object name 'PURTH'/i, "連到了但表不存在。可能：① 接到測試庫不是正式庫 ② 鼎新版本不同表名變了 ③ 帳號沒 SELECT 權限（鼎新會擋）"],
  [/SSL|TLS|certificate/i, "TLS / 憑證問題。鼎新 on-prem 通常不啟用 SSL，請改用 encrypt=false"],
];

function explainError(msg: string): string {
  for (const [re, hint] of ERROR_HINTS) {
    if (re.test(msg)) return hint;
  }
  return "未知錯誤 — 把完整 error 訊息傳給 IT / 鼎新顧問判讀";
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: TestRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "request body 不是合法 JSON" } satisfies TestResponse, { status: 400 });
  }

  const server = String(body.server ?? "").trim();
  const port = Number(body.port) || 1433;
  const database = String(body.database ?? "").trim();
  const user = String(body.user ?? "").trim();
  const password = String(body.password ?? "");

  if (!server || !database || !user || !password) {
    return Response.json({ ok: false, error: "host / db / user / password 都是必填" } satisfies TestResponse, { status: 400 });
  }

  const config: sql.config = {
    server,
    port,
    database,
    user,
    password,
    connectionTimeout: 5000,
    requestTimeout: 5000,
    options: {
      // 鼎新 on-prem MSSQL 預設不啟用 TLS，避免憑證 mismatch
      encrypt: false,
      trustServerCertificate: true,
      // 鼎新中文資料庫慣用 CP950 / Big5 → SQL Server 自己會處理 collation
      enableArithAbort: true,
    },
    pool: { max: 1, min: 0, idleTimeoutMillis: 1000 },
  };

  const t0 = Date.now();
  let pool: sql.ConnectionPool | null = null;
  let step = "connect";

  try {
    pool = new sql.ConnectionPool(config);
    await pool.connect();

    step = "version";
    const ver = await pool.request().query<{ v: string }>("SELECT @@VERSION AS v");
    const versionShort = String(ver.recordset[0]?.v ?? "")
      .split("\n")[0]
      .slice(0, 120);

    step = "counts";
    // 三張我們會用的核心表，一次拿筆數。如果任何一個失敗 → 表不存在或無權限
    const cnt = await pool.request().query<{ items: number; bomParents: number; purchases: number }>(`
      SELECT
        (SELECT COUNT(*) FROM INVMB) AS items,
        (SELECT COUNT(*) FROM BOMMB) AS bomParents,
        (SELECT COUNT(*) FROM PURTH) AS purchases
    `);

    return Response.json({
      ok: true,
      versionShort,
      counts: cnt.recordset[0],
      durationMs: Date.now() - t0,
    } satisfies TestResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({
      ok: false,
      step,
      error: msg.slice(0, 400),
      hint: explainError(msg),
      durationMs: Date.now() - t0,
    } satisfies TestResponse, { status: 200 });
    // 用 200 + ok:false 是因為前端要拿到 error/hint — 500 會被 fetch 包成 generic Error
  } finally {
    if (pool) {
      try { await pool.close(); } catch {}
    }
  }
}

// GET 給狀態檢查用（前端啟動時偵測 mssql 套件能不能載入）
export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    ready: typeof sql.ConnectionPool === "function",
    hint: "POST { server, port, database, user, password } 來實際測試連線",
  });
}
