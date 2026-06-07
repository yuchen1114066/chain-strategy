import Link from "next/link";
import type { Alert, AlertRule } from "@/lib/erp/types";
import { workOrders } from "@/lib/erp/seed";

const ruleLabel: Record<AlertRule, string> = {
  shortage: "已缺料",
  shortage_forecast: "預測缺料",
  late: "進度延遲",
  late_forecast: "預測誤船",
  ship_risk: "船期倒數",
  quality: "品質異常",
};

const ruleIcon: Record<AlertRule, string> = {
  shortage: "📦",
  shortage_forecast: "🔮",
  late: "⏰",
  late_forecast: "📉",
  ship_risk: "🚢",
  quality: "🔧",
};

// 動作建議分級 — 把每條警訊對應到 1-2 個具體動作按鈕
type Action = { label: string; tone: "primary" | "warning" | "danger" | "neutral" };
function actionsFor(a: Alert): Action[] {
  switch (a.rule) {
    case "shortage":
      return [
        { label: "📞 催供應商追單", tone: "danger" },
        { label: "🔄 換備援供應商", tone: "warning" },
      ];
    case "shortage_forecast":
      return [
        { label: "📞 立刻下追料 PO", tone: "primary" },
        { label: "📅 延後開工日", tone: "neutral" },
      ];
    case "late":
      return [
        { label: "🔄 重排殘餘階段", tone: "warning" },
        { label: "📨 通知客戶順延", tone: "neutral" },
      ];
    case "late_forecast":
      return [
        { label: "🌙 加開夜班", tone: "primary" },
        { label: "✂️ 拆單分批出貨", tone: "warning" },
        { label: "📨 主動通報客戶", tone: "neutral" },
      ];
    case "ship_risk":
      return [
        { label: "📞 確認船公司艙位", tone: "danger" },
        { label: "📨 客戶調整接收", tone: "neutral" },
      ];
    case "quality":
      return [
        { label: "🛑 停線檢查", tone: "danger" },
        { label: "👷 升級主管處理", tone: "warning" },
      ];
  }
}

const toneClass: Record<Action["tone"], string> = {
  primary: "bg-cyan-600 text-white hover:bg-cyan-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  neutral: "bg-slate-200 text-slate-800 hover:bg-slate-300",
};

export default function AlertList({ alerts, compact = false }: { alerts: Alert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-800">
        ✅ 目前沒有未處理的異常
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {alerts.map((a) => {
        const wo = workOrders.find((w) => w.id === a.woId);
        const tone =
          a.severity === "red"
            ? "border-rose-300 bg-rose-50"
            : "border-amber-300 bg-amber-50";
        const dot = a.severity === "red" ? "bg-rose-500" : "bg-amber-500";
        return (
          <li key={a.id} className={`rounded-lg border ${tone} px-4 py-3`}>
            <div className="flex items-start gap-3">
              <span className={`mt-1 inline-block w-2 h-2 rounded-full ${dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-mono">{ruleIcon[a.rule]} {ruleLabel[a.rule]}</span>
                  {wo && (
                    <Link href={`/erp/work-orders/${wo.id}`} className="font-mono text-cyan-700 hover:underline">
                      {wo.woNo}
                    </Link>
                  )}
                </div>
                <div className="font-semibold text-slate-900 mt-0.5">{a.title}</div>
                {!compact && (
                  <>
                    <div className="text-sm text-slate-700 mt-1">{a.detail}</div>
                    <div className="text-sm text-slate-900 mt-1">
                      <span className="text-slate-500">建議：</span>
                      {a.suggestedAction}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {actionsFor(a).map((act) => (
                        <button
                          key={act.label}
                          className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${toneClass[act.tone]}`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
