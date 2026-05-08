import Link from "next/link";
import type { Alert } from "@/lib/erp/types";
import { workOrders } from "@/lib/erp/seed";

const ruleLabel: Record<string, string> = {
  shortage: "缺料",
  late: "進度延遲",
  ship_risk: "誤船風險",
  quality: "品質異常",
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
                  <span className="font-mono">{ruleLabel[a.rule]}</span>
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
                      <span className="text-slate-500">建議動作：</span>
                      {a.suggestedAction}
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
