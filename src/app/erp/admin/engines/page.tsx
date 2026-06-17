import Link from "next/link";
import { streamStats, EVENT_FANOUT, SEVERITY_SLA, type EventSeverity } from "@/lib/erp/event-bus";
import { twinRegistry, type TwinSummary } from "@/lib/erp/engine-digital-twin";
import { allPredictions, predictionPurposes, type Prediction } from "@/lib/erp/engine-prediction";
import { buildTimelineGraph, timelineStats, detectMismatches, nodesInWindow, DAILY_INGEST_STREAMS, type TimelineNode } from "@/lib/erp/engine-timeline";

// 4 大核心 Engine — 大型 AI Supply Chain OS 的真正架構
//   核心不是 table，而是 Graph
//   核心不是「現在」，而是 Timeline

export default function EnginesPage() {
  const stream = streamStats();
  const twins = twinRegistry();
  const purposes = predictionPurposes();
  const predictions = allPredictions();
  const graph = buildTimelineGraph();
  const gStats = timelineStats(graph);
  const mismatches = detectMismatches();
  const windowNodes = nodesInWindow(graph, 14, 30);
  // 對齊 seed 基準日（避免 SSR/CSR 時間不一致）
  const nowMs = new Date("2026-05-08T00:00:00Z").getTime();

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🧠 4 大核心 Engine — 大型 AI Supply Chain OS</h1>
          <p className="text-sm text-slate-500 mt-1">
            核心不是 table 是 Graph　·　核心不是「現在」是 Timeline　·　所有事情都是 Event
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      {/* 4 大引擎索引 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <EngineBadge n="1" icon="⚡" title="Event Intelligence" desc="所有事情都是 Event"
          metric={`${stream.total} 事件 / ${stream.uniqueGroups} 鏈`} href="#engine1" tone="rose" />
        <EngineBadge n="2" icon="🧬" title="Digital Twin" desc="每個實體都有數位分身"
          metric={`${twins.reduce((s, t) => s + t.count, 0)} 個分身`} href="#engine2" tone="violet" />
        <EngineBadge n="3" icon="🔮" title="Prediction" desc="預測未來、不只看現在"
          metric={`${purposes.reduce((s, p) => s + p.recentCount, 0)} 個活躍預測`} href="#engine3" tone="cyan" />
        <EngineBadge n="4" icon="⏳" title="Time Coordination" desc="供應鏈本質是時間錯配"
          metric={`${gStats.totalNodes} 節點 / ${gStats.totalEdges} 關係`} href="#engine4" tone="emerald" />
      </section>

      {/* ============ Engine 1: Event Intelligence ============ */}
      <section id="engine1" className="bg-white rounded-xl border-2 border-rose-200 p-5 scroll-mt-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">⚡</span>
          <div>
            <div className="text-xs tracking-widest text-rose-700 font-bold uppercase">Engine 1</div>
            <h2 className="font-bold text-xl">Event Intelligence Engine</h2>
            <div className="text-sm text-slate-600">所有事情都是 Event — 每個事件 fan-out 給相關模組、自動去重、智能通知</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          {[
            ["ASN 延遲", "缺料預測"],
            ["IQC NG",   "供應商風險"],
            ["原料暴漲", "採購策略"],
            ["ETA 變更", "客戶風險"],
            ["OTD 下降", "AI 預警"],
          ].map(([ev, react]) => (
            <div key={ev} className="bg-rose-50 rounded-lg border border-rose-200 p-3 text-center">
              <div className="text-[10px] text-slate-500">Event</div>
              <div className="font-bold text-sm">{ev}</div>
              <div className="text-xs text-rose-700 mt-1">↓</div>
              <div className="text-[10px] text-slate-500 mt-1">系統反應</div>
              <div className="text-xs font-semibold text-rose-700">{react}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-3">
          <span>📊 共 {Object.keys(EVENT_FANOUT).length} 種事件類型</span>
          <span>· 4 個嚴重度級別（{(Object.keys(SEVERITY_SLA) as EventSeverity[]).map((s) => s.toUpperCase()).join("/")}）</span>
          <Link href="/erp/admin/event-engine" className="text-rose-700 hover:underline ml-auto">→ 深入看路由表</Link>
        </div>
      </section>

      {/* ============ Engine 2: Digital Twin ============ */}
      <section id="engine2" className="bg-white rounded-xl border-2 border-violet-200 p-5 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🧬</span>
          <div>
            <div className="text-xs tracking-widest text-violet-700 font-bold uppercase">Engine 2</div>
            <h2 className="font-bold text-xl">Digital Twin Engine</h2>
            <div className="text-sm text-slate-600">每個東西都有「數位分身」— 真正 AI Supply Chain 的基礎</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {twins.map((t) => (
            <div key={t.kind} className="bg-violet-50/40 rounded-lg border border-violet-200 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold">{t.label}</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-600 text-white font-bold">{t.count}</span>
              </div>
              <div className="text-[10px] text-violet-700 font-semibold mb-1">{t.modelType}</div>
              <div className="text-[11px] text-slate-600 leading-relaxed">{t.description}</div>
              {t.examples.slice(0, 2).map((ex) => <TwinMini key={ex.id} twin={ex} />)}
            </div>
          ))}
        </div>
      </section>

      {/* ============ Engine 3: Prediction ============ */}
      <section id="engine3" className="bg-white rounded-xl border-2 border-cyan-200 p-5 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🔮</span>
          <div>
            <div className="text-xs tracking-widest text-cyan-700 font-bold uppercase">Engine 3</div>
            <h2 className="font-bold text-xl">Prediction Engine</h2>
            <div className="text-sm text-slate-600">真正 Supply Chain OS 的靈魂 — 不只看現在，預測未來 + 推薦最佳方案</div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
          {purposes.map((p) => (
            <Link key={p.kind} href={p.sampleHref} className="block bg-cyan-50/40 rounded-lg border border-cyan-200 p-3 hover:border-cyan-400">
              <div className="text-2xl">{p.emoji}</div>
              <div className="font-bold text-sm mt-1">{p.label}</div>
              <div className="text-[10px] text-cyan-700 font-semibold">{p.purpose}</div>
              <div className="text-[11px] text-slate-600 mt-1 tabular-nums">
                {p.recentCount} 預測
                {p.topRisk > 0 && <span className="text-rose-600 font-bold"> · {p.topRisk} 風險</span>}
              </div>
            </Link>
          ))}
        </div>

        {/* 顯示活躍的 critical 預測 */}
        <div className="space-y-2">
          {predictions.flatMap((g) => g.predictions).filter((p) => p.tone === "bad").slice(0, 5).map((p, i) => (
            <PredictionRow key={i} p={p} />
          ))}
        </div>
      </section>

      {/* ============ Engine 4: Time Coordination ============ */}
      <section id="engine4" className="bg-white rounded-xl border-2 border-emerald-300 p-5 scroll-mt-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">⏳</span>
          <div>
            <div className="text-xs tracking-widest text-emerald-700 font-bold uppercase">Engine 4</div>
            <h2 className="font-bold text-xl">Time Coordination Engine（Timeline Graph）</h2>
            <div className="text-sm text-slate-600">供應鏈本質 = 時間錯配。核心資料結構：Timeline Graph（不是 PO / BOM）</div>
          </div>
        </div>

        {/* 真正核心問題：時間錯配 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {mismatches.map((m) => (
            <div key={m.category} className="bg-emerald-50/40 rounded-lg border border-emerald-200 p-3">
              <div className="font-bold text-base">{m.label}</div>
              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">本質 = 時間錯配</div>
              <div className="text-[11px] text-slate-600 mt-1">{m.description}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                {m.mechanism}
              </div>
              <div className="text-xs font-bold text-rose-600 tabular-nums mt-1">{m.examples} 件</div>
            </div>
          ))}
        </div>

        {/* Timeline Graph 統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Stat label="總節點" value={`${gStats.totalNodes}`} sub={`過去 ${gStats.pastNodes} + 未來 ${gStats.futureNodes}`} tone="emerald" />
          <Stat label="總關係" value={`${gStats.totalEdges}`} sub="causes / depends_on / predicts" tone="cyan" />
          <Stat label="風險節點" value={`${gStats.riskNodes}`} sub="未來預測的延誤信號" tone={gStats.riskNodes > 0 ? "rose" : "emerald"} />
          <Stat label="窗口節點" value={`${windowNodes.length}`} sub="近 14 + 未來 30 天" tone="cyan" />
        </div>

        {/* Timeline 視覺化 SVG */}
        <div className="bg-slate-900 rounded-lg p-3 mb-3">
          <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-2">Timeline Graph（近 14 天 + 未來 30 天）</div>
          <TimelineSvg nodes={windowNodes.slice(0, 80)} nowMs={nowMs} />
        </div>

        {/* 每日 ingest 流 */}
        <div className="bg-emerald-50/30 rounded-lg p-3 border border-emerald-200">
          <div className="text-xs font-bold text-emerald-900 mb-2">📥 系統每天持續 ingest（AI 才會越來越強）</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DAILY_INGEST_STREAMS.map((s) => (
              <div key={s.name} className="bg-white rounded p-2 border border-emerald-200">
                <div className="font-bold text-xs text-emerald-700">{s.name}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
                <div className="text-[10px] text-slate-600 mt-1 leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 設計理念總結 */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">設計理念</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-bold text-base mb-2">🔄 從 Table → Graph</div>
            <p className="text-slate-300 leading-relaxed">
              傳統 ERP 用 table 思維（PO 表、BOM 表、庫存表）。世界級 AI 系統用 Graph 思維：
              節點 + 關係 + 因果鏈 + 時間軸，AI 在 Graph 上推理而非 table 查詢。
            </p>
          </div>
          <div>
            <div className="font-bold text-base mb-2">⏳ 從「現在」→ Timeline</div>
            <p className="text-slate-300 leading-relaxed">
              系統真正核心是「時間」— 缺料 / 停線 / 呆料 / 急單 / 空運，本質都是時間錯配。
              系統每天 ingest ASN/ETA/IQC/OTD/Delay/Capacity/Cost/Commodity，AI 越來越強。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function EngineBadge({ n, icon, title, desc, metric, href, tone }: {
  n: string; icon: string; title: string; desc: string; metric: string; href: string;
  tone: "rose" | "violet" | "cyan" | "emerald";
}) {
  const tones = {
    rose: "border-rose-300 hover:border-rose-500 bg-rose-50/30",
    violet: "border-violet-300 hover:border-violet-500 bg-violet-50/30",
    cyan: "border-cyan-300 hover:border-cyan-500 bg-cyan-50/30",
    emerald: "border-emerald-300 hover:border-emerald-500 bg-emerald-50/30",
  };
  return (
    <a href={href} className={`block rounded-xl border-2 p-4 transition-colors ${tones[tone]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-4xl">{icon}</span>
        <span className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">Engine {n}</span>
      </div>
      <div className="font-bold text-base mt-1">{title}</div>
      <div className="text-[11px] text-slate-600 leading-snug">{desc}</div>
      <div className="text-xs font-bold text-slate-700 mt-2 tabular-nums">{metric}</div>
    </a>
  );
}

function TwinMini({ twin }: { twin: TwinSummary }) {
  const tone = {
    excellent: "text-emerald-600",
    good: "text-cyan-600",
    warning: "text-amber-600",
    critical: "text-rose-600",
  }[twin.health];
  return (
    <div className="mt-2 bg-white rounded p-2 border border-slate-200">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold text-slate-700">{twin.label}</span>
        <span className={`font-bold tabular-nums ${tone}`}>{twin.healthScore}</span>
      </div>
      <div className="flex gap-2 flex-wrap mt-1">
        {twin.keyMetrics.slice(0, 3).map((m, i) => (
          <span key={i} className="text-[10px] text-slate-500">{m.label}: <b className="text-slate-700">{m.value}</b></span>
        ))}
      </div>
      {twin.signals.length > 0 && <div className="text-[10px] text-rose-600 mt-1">⚠ {twin.signals[0]}</div>}
    </div>
  );
}

function PredictionRow({ p }: { p: Prediction }) {
  const toneColor = p.tone === "bad" ? "border-rose-300 bg-rose-50/40" : p.tone === "warn" ? "border-amber-300 bg-amber-50/40" : "border-emerald-300 bg-emerald-50/40";
  return (
    <div className={`rounded-lg border-2 ${toneColor} p-3`}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div>
          <span className="font-mono text-xs text-cyan-700 font-bold">{p.subject}</span>
          <span className="ml-2 text-sm font-bold">{p.outcome}</span>
        </div>
        <span className="text-[10px] text-slate-500">{p.horizon} · 信心 {p.confidence}%</span>
      </div>
      <div className="text-xs text-slate-700">🤖 {p.recommendation}</div>
      <div className="text-[10px] text-slate-500 mt-1">{p.evidence.join(" · ")}</div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "rose" | "amber" | "cyan" | "emerald" }) {
  const c = { rose: "text-rose-600", amber: "text-amber-600", cyan: "text-cyan-600", emerald: "text-emerald-600" }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

// ============================================================
// Timeline SVG — 真正的 Graph 視覺化
// ============================================================
function TimelineSvg({ nodes, nowMs }: { nodes: TimelineNode[]; nowMs: number }) {
  if (nodes.length === 0) {
    return <div className="text-center text-slate-500 py-8">無資料</div>;
  }
  const W = 1000, H = 200;
  const tMin = Math.min(...nodes.map((n) => new Date(n.occurredAt).getTime()));
  const tMax = Math.max(...nodes.map((n) => new Date(n.occurredAt).getTime()));
  const tNow = nowMs;

  // 5 條 lane：po / wo / part / customer / commodity
  const lanes = ["po", "wo", "supplier", "customer", "commodity"] as const;
  const laneY: Record<string, number> = {
    po: 40, wo: 80, supplier: 120, customer: 160, commodity: 110,
  };

  function xOf(iso: string): number {
    const t = new Date(iso).getTime();
    return 40 + ((t - tMin) / (tMax - tMin + 1)) * (W - 60);
  }

  const nowX = xOf(new Date(tNow).toISOString());

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 200 }}>
      {/* 5 條 lane 水平線 */}
      {lanes.map((l) => (
        <line key={l} x1={40} y1={laneY[l]} x2={W - 20} y2={laneY[l]} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 4" />
      ))}
      {/* lane 標籤 */}
      {lanes.map((l) => (
        <text key={l} x={6} y={laneY[l] + 3} className="fill-slate-400" style={{ fontSize: 9 }}>{l.toUpperCase()}</text>
      ))}
      {/* 今天線 */}
      <line x1={nowX} y1={20} x2={nowX} y2={H - 20} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={nowX + 4} y={28} className="fill-cyan-300" style={{ fontSize: 10, fontWeight: 700 }}>NOW</text>

      {/* 事件節點 */}
      {nodes.map((n) => {
        const x = xOf(n.occurredAt);
        const y = laneY[n.entityKind] ?? 100;
        const isRisk = n.kind === "delay_signal";
        const color = isRisk ? "#f43f5e"
          : n.kind.startsWith("customer") ? "#f59e0b"
          : n.kind.startsWith("ship") || n.kind === "asn_actual_arrival" ? "#10b981"
          : n.kind.startsWith("po") ? "#0891b2"
          : n.kind.startsWith("asn") ? "#06b6d4"
          : n.kind.startsWith("line") || n.kind === "material_ready" ? "#3b82f6"
          : "#94a3b8";
        return (
          <g key={n.id}>
            <circle cx={x} cy={y} r={isRisk ? 5 : 3} fill={color}
              opacity={n.isFuture ? 0.6 : 1}
              stroke={n.isFuture ? color : "none"} strokeWidth={n.isFuture ? 1 : 0} strokeDasharray={n.isFuture ? "1 1" : "none"}>
              <title>{n.label}　·　{new Date(n.occurredAt).toLocaleString("zh-TW", { hour12: false })}{n.isFuture ? " (預測)" : ""}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
