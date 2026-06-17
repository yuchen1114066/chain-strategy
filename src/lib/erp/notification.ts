// Notification Strategy — 缺口 6：避免使用者疲勞
//
// 統一通知策略，依嚴重度路由到對應管道：
//   Critical → Teams + SMS（必看必處理，15 分鐘 SLA）
//   High     → Teams（1 小時 SLA）
//   Medium   → Email（4 小時 SLA）
//   Low      → Daily Digest（每天 8 點摘要）
//
// 否則：使用者很快疲勞 → 重要警報被淹沒 → 系統失效

import { SEVERITY_SLA, type EventSeverity, type EventInstance } from "./event-bus";

export type Channel = "teams" | "sms" | "email" | "digest" | "in_app_red" | "in_app_yellow" | "push_mobile";

export type NotificationPolicy = {
  severity: EventSeverity;
  primaryChannels: Channel[];
  fallbackChannels: Channel[];
  quietHours?: { start: string; end: string };       // 例如 22:00-06:00 不發 SMS
  rateLimitPerHour?: number;                          // 每小時上限（避免疲勞）
  digestWindow?: string;                              // Low 級的 digest 時點
  audienceByRole: string[];                           // 收件人角色
};

export const NOTIFICATION_POLICIES: NotificationPolicy[] = [
  {
    severity: "critical",
    primaryChannels: ["teams", "sms", "in_app_red", "push_mobile"],
    fallbackChannels: ["email"],
    rateLimitPerHour: 999,    // critical 無限額
    audienceByRole: ["ceo", "buyer_manager", "admin"],
  },
  {
    severity: "high",
    primaryChannels: ["teams", "in_app_red"],
    fallbackChannels: ["email"],
    rateLimitPerHour: 10,
    audienceByRole: ["buyer_manager", "pm", "qa"],
  },
  {
    severity: "medium",
    primaryChannels: ["email", "in_app_yellow"],
    fallbackChannels: [],
    rateLimitPerHour: 30,
    audienceByRole: ["buyer", "pmc", "warehouse"],
  },
  {
    severity: "low",
    primaryChannels: ["digest"],
    fallbackChannels: [],
    quietHours: { start: "22:00", end: "08:00" },
    rateLimitPerHour: 0,       // 只在 digest 時點發
    digestWindow: "每日 08:00 + 18:00",
    audienceByRole: ["buyer", "pmc"],
  },
];

export const CHANNEL_META: Record<Channel, { emoji: string; label: string; latency: string; color: string }> = {
  teams:         { emoji: "💬", label: "Microsoft Teams",  latency: "< 1 min",  color: "#5b5fc7" },
  sms:           { emoji: "📱", label: "SMS 簡訊",          latency: "< 2 min",  color: "#dc2626" },
  email:         { emoji: "📧", label: "Email",            latency: "< 5 min",  color: "#0891b2" },
  digest:        { emoji: "📰", label: "Daily Digest",     latency: "每天 8/18", color: "#94a3b8" },
  in_app_red:    { emoji: "🔴", label: "系統內紅燈",        latency: "即時",     color: "#dc2626" },
  in_app_yellow: { emoji: "🟡", label: "系統內黃燈",        latency: "即時",     color: "#f59e0b" },
  push_mobile:   { emoji: "📲", label: "Mobile Push",      latency: "< 30 sec", color: "#10b981" },
};

// ============================================================
// 統一發送決策：給定 event → 該推哪些 channel + 給誰
// ============================================================
export function decideNotifications(event: EventInstance): {
  channels: Channel[];
  audience: string[];
  reason: string;
  isCorrelated: boolean;
} {
  // 如果是 correlation cluster 的次生事件 → 不重複通知
  if (!event.isPrimary && event.correlationId) {
    return {
      channels: [],
      audience: [],
      reason: `屬於事件鏈「${event.correlationGroup}」次生事件，去重避免疲勞`,
      isCorrelated: true,
    };
  }
  const policy = NOTIFICATION_POLICIES.find((p) => p.severity === event.severity)!;
  const channels = policy.primaryChannels.slice();
  // Quiet hours 處理（demo: 不真套用，但結構備好）
  return {
    channels,
    audience: policy.audienceByRole,
    reason: `${SEVERITY_SLA[event.severity].sla} SLA，依嚴重度路由到 ${policy.primaryChannels.length} 個管道`,
    isCorrelated: false,
  };
}

// ============================================================
// 統計：避免疲勞 — 過去 1 hr / 24 hr 通知量
// ============================================================
export type NotificationStats = {
  last1hr: number;
  last24hr: number;
  deduplicatedCount: number;     // 被去重的事件數（沒實際通知）
  fatigueRisk: "low" | "med" | "high";
};

export function notificationStats(events: EventInstance[]): NotificationStats {
  const now = Date.now();
  const oneHourAgo = now - 3600_000;
  const dayAgo = now - 24 * 3600_000;
  const sent = events.filter((e) => e.notifiedChannels.length > 0);
  const last1hr = sent.filter((e) => new Date(e.occurredAt).getTime() >= oneHourAgo).length;
  const last24hr = sent.filter((e) => new Date(e.occurredAt).getTime() >= dayAgo).length;
  const dedup = events.filter((e) => !e.isPrimary && e.correlationId).length;
  const fatigueRisk: NotificationStats["fatigueRisk"] =
    last1hr > 5 ? "high" : last1hr > 2 ? "med" : "low";
  return { last1hr, last24hr, deduplicatedCount: dedup, fatigueRisk };
}
