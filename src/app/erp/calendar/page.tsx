import Link from "next/link";
import { workOrders, models, today } from "@/lib/erp/seed";
import { STAGES } from "@/lib/erp/types";

// 生產排程日曆 — 以日曆/時間軸方式顯示所有工單的關鍵日期
//   · 算料起點 / 到廠 / 上線 / 出貨 / 客戶交付
//   · 用顏色標示工單，hover 看詳情

function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}
function diffDays(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000);
}

const STAGE_COLOR: Record<string, string> = {
  material: "#94a3b8", arrival: "#3b82f6", iqc: "#06b6d4",
  line: "#10b981", test: "#22c55e", pack: "#84cc16",
  ship: "#f59e0b", customer: "#a855f7",
};

const WO_COLOR_POOL = ["#0891b2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16"];

export default function CalendarPage() {
  // 排程窗口：找出所有工單最早與最晚日期
  const allDates = workOrders.flatMap((w) =>
    w.stages.map((s) => s.actualDate ?? s.plannedDate).filter(Boolean)
  ) as string[];
  const minDate = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : today;
  const maxDate = allDates.length ? allDates.reduce((a, b) => (a > b ? a : b)) : today;

  // 對齊到月份起始
  const monthStart = minDate.slice(0, 7) + "-01";
  const totalDays = Math.max(60, diffDays(monthStart, maxDate) + 14);

  // 依日期填工單事件
  const dayEvents = new Map<string, { woNo: string; woId: string; stage: string; stageLabel: string; actual: boolean; color: string; customer: string; modelCode: string }[]>();
  workOrders.forEach((w, idx) => {
    const m = models.find((m) => m.id === w.modelId);
    const color = WO_COLOR_POOL[idx % WO_COLOR_POOL.length];
    for (const s of w.stages) {
      const meta = STAGES.find((x) => x.key === s.stage);
      const date = s.actualDate ?? s.plannedDate;
      if (!date) continue;
      const ex = dayEvents.get(date) ?? [];
      ex.push({
        woNo: w.woNo, woId: w.id, stage: s.stage, stageLabel: meta?.label ?? s.stage,
        actual: !!s.actualDate, color, customer: w.customer, modelCode: m?.code ?? "",
      });
      dayEvents.set(date, ex);
    }
  });

  // 月份分組
  const days: string[] = [];
  for (let i = 0; i < totalDays; i++) days.push(addDays(monthStart, i));
  const byMonth = new Map<string, string[]>();
  for (const d of days) {
    const m = d.slice(0, 7);
    const arr = byMonth.get(m) ?? [];
    arr.push(d);
    byMonth.set(m, arr);
  }

  // 圖例：工單顏色
  const woLegend = workOrders.map((w, idx) => ({
    woNo: w.woNo,
    customer: w.customer,
    color: WO_COLOR_POOL[idx % WO_COLOR_POOL.length],
  }));

  // 月份視圖排序
  const months = [...byMonth.keys()].sort();

  // Gantt 視圖：每張工單一條，從算料到客戶簽收
  const gantt = workOrders.map((w, idx) => {
    const m = models.find((m) => m.id === w.modelId);
    const matStage = w.stages.find((s) => s.stage === "material");
    const custStage = w.stages.find((s) => s.stage === "customer");
    const start = matStage?.actualDate ?? matStage?.plannedDate ?? w.orderDate;
    const end = custStage?.actualDate ?? custStage?.plannedDate ?? w.shipDate;
    return {
      wo: w, model: m, color: WO_COLOR_POOL[idx % WO_COLOR_POOL.length],
      start, end,
      startOffset: Math.max(0, diffDays(monthStart, start)),
      span: diffDays(start, end) + 1,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📅 生產排程日曆</h1>
        <p className="text-sm text-slate-500 mt-1">
          所有工單八階段日期 + 船期視覺化　·　基準日 {today}
        </p>
      </header>

      {/* 工單圖例 */}
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          {woLegend.map((l) => (
            <span key={l.woNo} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-slate-50 border">
              <span className="w-3 h-3 rounded" style={{ background: l.color }} />
              <span className="font-mono">{l.woNo}</span>
              <span className="text-slate-500">{l.customer}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ============ Gantt 視圖 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">📊 Gantt 工單時間軸</h2>
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${totalDays * 12}px`, position: "relative" }}>
            {/* 月份標尺 */}
            <div className="flex border-b border-slate-200 mb-2 sticky top-0 bg-white z-10">
              {months.map((m) => {
                const daysInMonth = byMonth.get(m)?.length ?? 0;
                return (
                  <div key={m} className="text-xs font-semibold text-slate-700 border-r border-slate-200 py-1 text-center"
                       style={{ width: `${daysInMonth * 12}px` }}>
                    {m}
                  </div>
                );
              })}
            </div>
            {/* 今天的垂直線 */}
            <div className="absolute top-0 bottom-0 w-px bg-rose-500 z-20"
                 style={{ left: `${diffDays(monthStart, today) * 12}px` }}
                 title={`今天 ${today}`} />

            {/* Gantt rows */}
            <div className="space-y-1.5">
              {gantt.map((g) => {
                const woStages = g.wo.stages;
                return (
                  <div key={g.wo.id} className="flex items-center gap-2">
                    <Link
                      href={`/erp/work-orders/${g.wo.id}`}
                      className="font-mono text-xs text-cyan-700 hover:underline w-32 shrink-0 truncate"
                      title={`${g.wo.customer} · ${g.model?.code}`}
                    >
                      {g.wo.woNo}
                    </Link>
                    <div className="flex-1 relative h-7" style={{ marginLeft: 0 }}>
                      {/* 主 bar */}
                      <div
                        className="absolute h-7 rounded opacity-70"
                        style={{
                          left: `${g.startOffset * 12}px`,
                          width: `${Math.max(8, g.span * 12)}px`,
                          background: g.color,
                        }}
                        title={`${g.start} → ${g.end}`}
                      />
                      {/* 階段事件點 */}
                      {woStages.map((s) => {
                        const date = s.actualDate ?? s.plannedDate;
                        if (!date) return null;
                        const offset = diffDays(monthStart, date);
                        if (offset < 0 || offset > totalDays) return null;
                        const stageColor = STAGE_COLOR[s.stage] ?? "#888";
                        return (
                          <div
                            key={s.stage}
                            className="absolute top-1.5 w-4 h-4 rounded-full border-2 border-white shadow z-10"
                            style={{ left: `${offset * 12 - 6}px`, background: stageColor }}
                            title={`${date} ${STAGES.find((x) => x.key === s.stage)?.label}${s.actualDate ? " ✓" : ""}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Stage legend */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] text-slate-600">
          {STAGES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: STAGE_COLOR[s.key] }} />
              {s.icon} {s.label}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1">
            <span className="w-px h-3 bg-rose-500" /> 今天
          </span>
        </div>
      </section>

      {/* ============ 月曆視圖 ============ */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">🗓️ 月曆事件視圖</h2>
        <div className="space-y-6">
          {months.map((m) => (
            <MonthGrid key={m} month={m} dates={byMonth.get(m) ?? []} dayEvents={dayEvents} today={today} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MonthGrid({
  month, dates, dayEvents, today,
}: {
  month: string;
  dates: string[];
  dayEvents: Map<string, { woNo: string; woId: string; stage: string; stageLabel: string; actual: boolean; color: string; customer: string; modelCode: string }[]>;
  today: string;
}) {
  // 取月份的第一天判斷星期幾
  const firstDay = new Date(month + "-01T00:00:00Z");
  const startWeekday = firstDay.getUTCDay(); // 0=Sun
  // 補空格到星期一開頭（用 0=Sun 直接，順序：日一二三四五六）
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (const d of dates) cells.push(d);

  return (
    <div>
      <h3 className="font-bold text-base text-slate-800 mb-2">{month}</h3>
      <div className="grid grid-cols-7 gap-1">
        {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
          <div key={w} className="text-center text-[10px] text-slate-500 font-semibold py-1">{w}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const events = dayEvents.get(d) ?? [];
          const isToday = d === today;
          return (
            <div key={d} className={`min-h-[72px] border rounded p-1 ${isToday ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/40" : "border-slate-200"}`}>
              <div className={`text-[10px] tabular-nums mb-0.5 ${isToday ? "font-bold text-rose-700" : "text-slate-500"}`}>
                {parseInt(d.slice(8, 10))}
              </div>
              <div className="space-y-0.5">
                {events.slice(0, 3).map((e, ei) => (
                  <Link
                    key={ei}
                    href={`/erp/work-orders/${e.woId}`}
                    className="block text-[9px] px-1 py-0.5 rounded truncate text-white"
                    style={{ background: e.color, opacity: e.actual ? 1 : 0.6 }}
                    title={`${e.woNo} ${e.stageLabel}${e.actual ? " ✓" : ""}`}
                  >
                    {e.actual ? "✓" : "·"} {e.woNo.slice(-4)} {e.stageLabel.slice(0, 4)}
                  </Link>
                ))}
                {events.length > 3 && (
                  <div className="text-[9px] text-slate-500">+{events.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
