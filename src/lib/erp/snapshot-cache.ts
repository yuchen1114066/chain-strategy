// War Room Snapshot 快取（模組級單例）
// 流程：cron → sync → recompute → 寫入此快取 → 戰情中心讀此快取
// 正式環境請改成 Postgres / Redis 持久化。

import type { getWarRoomSnapshot } from "./warroom";

export type WarRoomSnapshot = ReturnType<typeof getWarRoomSnapshot>;

export type CachedSnapshot = {
  snapshot: WarRoomSnapshot;
  computedAt: string;
  ttlSeconds: number;
  triggeredBy: "manual" | "cron" | "sync" | "lazy";
  syncRunId?: string;
};

let CACHED: CachedSnapshot | null = null;

export function setSnapshot(snap: WarRoomSnapshot, opts: { ttlSeconds?: number; triggeredBy?: CachedSnapshot["triggeredBy"]; syncRunId?: string } = {}) {
  CACHED = {
    snapshot: snap,
    computedAt: new Date().toISOString(),
    ttlSeconds: opts.ttlSeconds ?? 600,
    triggeredBy: opts.triggeredBy ?? "manual",
    syncRunId: opts.syncRunId,
  };
}

export function getSnapshot(): CachedSnapshot | null {
  return CACHED;
}

export function isFresh(): boolean {
  if (!CACHED) return false;
  const age = (Date.now() - new Date(CACHED.computedAt).getTime()) / 1000;
  return age < CACHED.ttlSeconds;
}

export function ageSeconds(): number {
  if (!CACHED) return Infinity;
  return Math.round((Date.now() - new Date(CACHED.computedAt).getTime()) / 1000);
}

export function clearSnapshot() {
  CACHED = null;
}
