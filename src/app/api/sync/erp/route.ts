// /api/sync/erp — 鼎新 ERP 同步 API（唯讀拉取）
//
// 用法：
//   GET  /api/sync/erp           → 回傳 health + 最近 run 摘要
//   POST /api/sync/erp           → 觸發同步（需 Bearer token = TOPGP_SYNC_TOKEN）
//
// cron 範例（每 10 min）：
//   * /10 * * * *  curl -X POST -H "Authorization: Bearer $TOPGP_SYNC_TOKEN" https://.../api/sync/erp
//
// 鐵律：本 API 只做 SELECT，且每查詢都過 assertReadOnly。

import { NextResponse } from "next/server";
import { getConnectorMode, health, query } from "@/lib/erp/connector";
import {
  SYNC_JOBS,
  recordRun,
  lastRun,
  listRuns,
  type SyncJobResult,
  type SyncRun,
} from "@/lib/erp/sync-state";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const required = process.env.TOPGP_SYNC_TOKEN;
  // 未設定 token → MOCK 模式允許（方便開發）；設定後嚴格驗證
  if (!required) return getConnectorMode() === "mock";
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${required}`;
}

export async function GET() {
  const h = await health();
  return NextResponse.json({
    ok: true,
    health: h,
    last: lastRun() ?? null,
    history: listRuns().slice(0, 10),
  });
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const triggeredBy = (new URL(req.url).searchParams.get("by") === "cron") ? "cron" : "manual";
  const mode = getConnectorMode();
  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  const jobs: SyncJobResult[] = [];
  let totalRows = 0;

  for (const job of SYNC_JOBS) {
    const jt0 = Date.now();
    try {
      const rows = await query(job.selectSql, { fixture: job.fixture as never });
      jobs.push({
        name: job.name, label: job.label, ok: true,
        rows: rows.length, durationMs: Date.now() - jt0,
      });
      totalRows += rows.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      jobs.push({
        name: job.name, label: job.label, ok: false,
        rows: 0, durationMs: Date.now() - jt0, error: msg,
      });
    }
  }

  const okCount = jobs.filter((j) => j.ok).length;
  const status: SyncRun["status"] =
    okCount === jobs.length ? "success" :
    okCount === 0           ? "failed"  : "partial";

  const run: SyncRun = {
    id: runId, startedAt, finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    status, totalRows, jobs, triggeredBy, mode,
  };
  recordRun(run);

  // 鏈式觸發：sync 成功 → AI recompute → War Room snapshot 更新
  let recomputed = false;
  if (status !== "failed") {
    try {
      const { getWarRoomSnapshot } = await import("@/lib/erp/warroom");
      const { setSnapshot } = await import("@/lib/erp/snapshot-cache");
      const snap = getWarRoomSnapshot();
      setSnapshot(snap, { triggeredBy: "sync", syncRunId: runId, ttlSeconds: 600 });
      recomputed = true;
    } catch {
      recomputed = false;
    }
  }

  return NextResponse.json({ ok: status !== "failed", run, recomputed });
}
