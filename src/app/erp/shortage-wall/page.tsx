import Link from "next/link";
import { computeShortageWall, gradeStats, type ShortageGrade, type ShortagePlan, type ShortageRow } from "@/lib/erp/shortage-ai";

// 缺料牆 — Global AI Supply Chain Command Center 超核心頁
//   ① 缺料風險分級 S / A / B / C
//   ② AI 自動推薦三方案：空運加急 / 替代料 / 排程協調
//   ③ 對應 WMS 規劃「模組2 缺料與風險」

const GRADE_META: Record<ShortageGrade, { bg: string; bd: string; chip: string; txt: string; def: string }> = {
  S: { bg: "bg-rose-50/70",  bd: "border-rose-400", chip: "bg-rose-600 text-white",   txt: "S 級", def: "48hr 內停線" },
  A: { bg: "bg-orange-50/70",bd: "border-orange-400",chip: "bg-orange-500 text-white", txt: "A 級", def: "3 天內缺料" },
  B: { bg: "bg-amber-50/60", bd: "border-amber-300", chip: "bg-amber-500 text-white",  txt: "B 級", def: "7 天內缺料" },
  C: { bg: "bg-yellow-50/60",bd: "border-yellow-300",chip: "bg-yellow-500 text-white", txt: "C 級", def: "14 天內缺料" },
  "—": { bg: "bg-white",      bd: "border-slate-200", chip: "bg-slate-400 text-white",  txt: "—",   def: "" },
};

export default function ShortageWallPage() {
  const rows = computeShortageWall();
  const stats = gradeStats(rows);
  const mostUrgent = rows.find((r) => r.stockoutDays != null);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🧱 缺料牆 — Shortage War Room</h1>
          <p className="text-sm text-slate-500 mt-1">
            缺料風險分級 S/A/B/C　·　AI 自動推薦三方案　·　即時偵測停線
          </p>
        </div>
        <Link href="/erp/po-generator" className="px-4 py-2 text-sm rounded-md bg-rose-600 text-white hover:bg-rose-700 font-semibold">
          🛒 一鍵生成追料 PO
        </Link>
      </header>

      {/* 分級說明 + KPI */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-cyan-400">Shortage Risk Grading</div>
            <div className="text-lg font-bold mt-0.5">缺料風險分級（AI 每日自動評等）</div>
          </div>
          <div className="text-[11px] text-slate-400">共 {rows.length} 件缺料</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GradeCard grade="S" count={stats.S} desc="48hr 內停線" tone="rose" />
          <GradeCard grade="A" count={stats.A} desc="3 天內缺料" tone="orange" />
          <GradeCard grade="B" count={stats.B} desc="7 天內缺料" tone="amber" />
          <GradeCard grade="C" count={stats.C} desc="14 天內缺料" tone="yellow" />
        </div>
      </section>

      {/* 最緊迫停線倒數橫幅 */}
      {mostUrgent && mostUrgent.stockoutDays != null && (
        <section className={`rounded-xl border-2 p-5 ${GRADE_META[mostUrgent.grade].bd} ${GRADE_META[mostUrgent.grade].bg}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-slate-500">最緊迫停線倒數</div>
              <div className="text-3xl font-bold tabular-nums mt-0.5">
                {mostUrgent.stockoutDays < 0
                  ? `已停線風險 ${-mostUrgent.stockoutDays} 天`
                  : `剩 ${mostUrgent.stockoutDays} 天`}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-bold mr-2 ${GRADE_META[mostUrgent.grade].chip}`}>
                  {GRADE_META[mostUrgent.grade].txt}
                </span>
                <span className="font-mono">{mostUrgent.part.code}</span> {mostUrgent.part.name}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-500">供應商交期</div>
              <div className="text-xl font-bold tabular-nums">{mostUrgent.part.leadDays} 天</div>
              <div className={`text-xs font-bold ${mostUrgent.canMakeIt ? "text-emerald-600" : "text-rose-600"}`}>
                {mostUrgent.canMakeIt ? "✓ 現在追單來得及" : "🚨 現在追單也趕不上"}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 缺料卡（含 AI 三方案） */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="font-bold text-emerald-800">目前沒有缺料 — 全料件庫存充足</div>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <ShortageCard key={r.part.id} row={r} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>🎯 風險分級</b>　S=48hr 內停線　·　A=3 天內缺料　·　B=7 天內　·　C=14 天內。
        <b>🤖 AI 三方案</b>　每筆缺料自動生出（A）空運加急、（B）替代料、（C）排程協調，
        並標示「增加成本」「避免損失」「風險」三大決策數字，AI 自動推薦最佳解。
        <b>📐 停線倒數</b>＝最緊迫工單「算料」階段計畫日 − 今天。
      </p>
    </div>
  );
}

function GradeCard({ grade, count, desc, tone }: { grade: ShortageGrade; count: number; desc: string; tone: "rose" | "orange" | "amber" | "yellow" }) {
  const accent = {
    rose: "text-rose-400",
    orange: "text-orange-400",
    amber: "text-amber-400",
    yellow: "text-yellow-400",
  }[tone];
  return (
    <div className="bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700">
      <div className="flex items-center justify-between">
        <div className={`text-[11px] font-bold tracking-widest ${accent}`}>{grade} 級</div>
        <div className="text-[10px] text-slate-500">{desc}</div>
      </div>
      <div className={`text-3xl font-extrabold tabular-nums mt-1 ${count > 0 ? accent : "text-slate-500"}`}>
        {count} <span className="text-sm text-slate-400">件</span>
      </div>
    </div>
  );
}

function ShortageCard({ row }: { row: ShortageRow }) {
  const g = GRADE_META[row.grade];
  return (
    <article className={`rounded-xl border-2 ${g.bd} ${g.bg} p-4`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
        {/* 左欄：缺料事實 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${g.chip}`}>{g.txt}</span>
                <span className="text-[10px] text-slate-500">{g.def}</span>
              </div>
              <div className="font-mono text-xs text-slate-500">{row.part.code}</div>
              <div className="font-bold">{row.part.name}</div>
              {row.part.spec && <div className="text-[10px] text-slate-500">{row.part.spec}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/70 rounded p-2 border border-slate-200">
              <div className="text-[10px] text-slate-500">缺料數量</div>
              <div className="text-xl font-bold text-rose-600 tabular-nums">-{row.shortage} <span className="text-xs text-slate-500">{row.part.unit}</span></div>
            </div>
            <div className="bg-white/70 rounded p-2 border border-slate-200">
              <div className="text-[10px] text-slate-500">停線倒數</div>
              <div className={`text-xl font-bold tabular-nums ${
                row.stockoutDays == null ? "text-slate-400" :
                row.stockoutDays < 0 ? "text-rose-600" :
                row.stockoutDays < 7 ? "text-amber-600" : "text-slate-700"
              }`}>
                {row.stockoutDays == null ? "—"
                  : row.stockoutDays < 0 ? `逾 ${-row.stockoutDays}d`
                  : `T-${row.stockoutDays}d`}
              </div>
            </div>
          </div>

          <div className="bg-white/70 rounded p-2 border border-slate-200 text-xs">
            <div className="text-[10px] text-slate-500 mb-1">
              影響 {row.affectedWos.length} 張工單 · 共 {row.affectedQty} 台
            </div>
            <div className="flex flex-wrap gap-1">
              {row.affectedWos.slice(0, 6).map((wo) => (
                <Link key={wo.id} href={`/erp/work-orders/${wo.id}`}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-cyan-700 hover:border-cyan-400">
                  {wo.woNo}
                </Link>
              ))}
              {row.affectedWos.length > 6 && <span className="text-[10px] text-slate-400">+{row.affectedWos.length - 6}</span>}
            </div>
          </div>

          <div className="bg-white/70 rounded p-2 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500">供應商 </span>
              <span className="font-semibold">{row.supplier?.name ?? "—"}</span>
              <span className="text-slate-500"> · 交期 {row.part.leadDays}d</span>
            </div>
            <span className={`font-bold text-[11px] ${row.canMakeIt ? "text-emerald-600" : "text-rose-600"}`}>
              {row.canMakeIt ? "✓ 追單來得及" : "🚨 趕不上"}
            </span>
          </div>
        </div>

        {/* 右欄：AI 三方案 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              🤖 AI 自動推薦方案
            </div>
            <div className="text-[10px] text-slate-500">已自動評估 3 種對策</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {row.plans.map((p) => (
              <PlanCard key={p.code} plan={p} />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function PlanCard({ plan }: { plan: ShortagePlan }) {
  const riskColor =
    plan.risk === "low" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
    plan.risk === "med" ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-rose-700 bg-rose-50 border-rose-200";
  const riskLabel = plan.risk === "low" ? "風險低" : plan.risk === "med" ? "中風險" : "高風險";
  return (
    <div className={`rounded-lg border-2 bg-white p-3 ${plan.recommended ? "border-cyan-400 shadow-sm" : "border-slate-200"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-bold tracking-widest text-cyan-700">方案 {plan.code}</div>
        {plan.recommended && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600 text-white font-bold">AI 推薦</span>
        )}
      </div>
      <div className="font-bold text-sm leading-tight">{plan.title}</div>
      <ul className="mt-2 space-y-0.5">
        {plan.bullets.map((b, i) => (
          <li key={i} className="text-[11px] text-slate-700">· {b}</li>
        ))}
      </ul>
      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1 text-[10px]">
        <div>
          <div className="text-slate-500">增加成本</div>
          <div className="font-bold text-rose-600 tabular-nums">+${(plan.costDelta / 10000).toFixed(1)}萬</div>
        </div>
        <div>
          <div className="text-slate-500">避免損失</div>
          <div className="font-bold text-emerald-600 tabular-nums">${(plan.avoidLoss / 10000).toFixed(0)}萬</div>
        </div>
      </div>
      <div className={`mt-2 text-[10px] px-1.5 py-0.5 rounded border inline-block ${riskColor}`}>
        {riskLabel}{plan.riskNote ? ` · ${plan.riskNote}` : ""}
      </div>
    </div>
  );
}
