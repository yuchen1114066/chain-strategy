// /api/ai/recompute — 觸發 4 個 AI 引擎重算 → 寫入 War Room snapshot 快取
//
// 用法：
//   GET  /api/ai/recompute            → 看目前快取狀態
//   POST /api/ai/recompute            → 立即重算（Bearer TOPGP_SYNC_TOKEN 驗證）
//
// 排程：建議 cron */15 一次，與 /api/sync/erp 錯開避免互相搶資源
//   */15 * * * *  curl -X POST -H "Authorization: Bearer $TOPGP_SYNC_TOKEN" .../api/ai/recompute?by=cron

import { NextResponse } from "next/server";
import { getWarRoomSnapshot } from "@/lib/erp/warroom";
import { setSnapshot, getSnapshot, ageSeconds, isFresh } from "@/lib/erp/snapshot-cache";
import { getConnectorMode } from "@/lib/erp/connector";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const required = process.env.TOPGP_SYNC_TOKEN;
  if (!required) return getConnectorMode() === "mock";
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${required}`;
}

export async function GET() {
  const c = getSnapshot();
  return NextResponse.json({
    ok: true,
    cached: c !== null,
    fresh: isFresh(),
    ageSeconds: ageSeconds(),
    computedAt: c?.computedAt ?? null,
    triggeredBy: c?.triggeredBy ?? null,
    syncRunId: c?.syncRunId ?? null,
    ttlSeconds: c?.ttlSeconds ?? null,
  });
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const triggeredBy = url.searchParams.get("by") === "cron" ? "cron" : url.searchParams.get("by") === "sync" ? "sync" : "manual";
  const syncRunId = url.searchParams.get("run") ?? undefined;

  const t0 = Date.now();
  const snap = getWarRoomSnapshot();
  setSnapshot(snap, { triggeredBy, syncRunId, ttlSeconds: 600 });

  return NextResponse.json({
    ok: true,
    computedMs: Date.now() - t0,
    triggeredBy,
    syncRunId,
    headline: snap.header.aiHeadline,
    healthScore: snap.header.healthScore,
  });
}
