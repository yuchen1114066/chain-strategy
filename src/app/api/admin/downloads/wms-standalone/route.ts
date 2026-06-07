// /api/admin/downloads/wms-standalone
// 管理員專屬：WMS 智慧倉儲模組 standalone 程式碼下載
// 驗證方式同 quotation-analyzer-standalone（Bearer token / cookie）

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FILE_REL  = "private/downloads/wms-standalone.zip";
const FILE_NAME = "wms-standalone.zip";

function authorized(req: Request): boolean {
  const required = process.env.ADMIN_DOWNLOAD_TOKEN;
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
