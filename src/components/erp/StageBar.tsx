import { STAGES, type WoStage } from "@/lib/erp/types";

export default function StageBar({
  stages,
  today,
}: {
  stages: WoStage[];
  today: string;
}) {
  return (
    <div className="flex items-stretch gap-1 w-full overflow-x-auto">
      {STAGES.map((meta) => {
        const s = stages.find((x) => x.stage === meta.key);
        if (!s) return null;
        const late = !s.actualDate && s.plannedDate < today && s.status !== "done";
        const tone =
          s.status === "done"
            ? "bg-emerald-100 border-emerald-400 text-emerald-900"
            : s.status === "in_progress"
            ? "bg-cyan-100 border-cyan-400 text-cyan-900 ring-2 ring-cyan-300"
            : s.status === "blocked"
            ? "bg-rose-100 border-rose-400 text-rose-900"
            : late
            ? "bg-amber-100 border-amber-400 text-amber-900"
            : "bg-slate-100 border-slate-300 text-slate-600";
        return (
          <div
            key={meta.key}
            className={`flex-1 min-w-[88px] border rounded-md px-2 py-2 text-xs ${tone}`}
            title={`預計 ${s.plannedDate}${s.actualDate ? `\n實際 ${s.actualDate}` : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">{meta.icon} {meta.label}</span>
              <span className="text-[10px] opacity-70">#{s.seq}</span>
            </div>
            <div className="mt-1 text-[11px] tabular-nums">
              <div>計 {s.plannedDate.slice(5)}</div>
              {s.actualDate ? <div>實 {s.actualDate.slice(5)}</div> : late ? <div className="font-bold">⚠ 已過期</div> : <div className="opacity-50">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
