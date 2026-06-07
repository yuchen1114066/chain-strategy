// /api/admin/downloads/quotation-analyzer-standalone
//
// 管理員專屬：AI Quotation Analyzer · standalone 程式碼下載
//
// 驗證流程（Bearer token；尚未接真 auth 前的最小可行版）：
//   1. 讀 process.env.ADMIN_DOWNLOAD_TOKEN（部署時必設）
//   2. 比對 Authorization: Bearer <token>  或  cookie  admin_dl_token=<token>
//   3. 通過 → 串流 private/downloads/quotation-analyzer-standalone.zip
//   4. 失敗 → 401（連檔案存不存在都不洩漏）
//
// 之後若接上真實 RBAC（rbac-abac.ts 內的 admin role），
// 把 authorized() 內換成「讀 session → 確認 user.role === 'admin'」即可。

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FILE_REL  = "private/downloads/quotation-analyzer-standalone.zip";
const FILE_NAME = "quotation-analyzer-standalone.zip";

function authorized(req: Request): boolean {
  const required = process.env.ADMIN_DOWNLOAD_TOKEN;
  // 未設定 → 預設拒絕（避免 dev 沒設定就誤開放下載）
  if (!required) return false;

  const auth = req.headers.get("authorization") ?? "";
  if (auth === `Bearer ${required}`) return true;

  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)admin_dl_token=([^;]+)/);
  if (m && decodeURIComponent(m[1]) === required) return true;

  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const abs = join(process.cwd(), FILE_REL);
    const buf = await readFile(abs);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }
}
