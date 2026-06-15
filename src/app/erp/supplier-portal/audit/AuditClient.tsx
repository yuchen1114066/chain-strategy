"use client";

import { useMemo, useState } from "react";
import {
  lookup, RADAR_META,
  type PoAudit, type RiskRadar, type RadarDimension, type DimScore, type AuditTimelineEvent,
} from "@/lib/erp/supplier-audit";

const CAT_TONE: Record<AuditTimelineEvent["category"], { bg: string; bd: string; icon: string }> = {
  po:         { bg: "bg-slate-50",   bd: "border-slate-300",   icon: "📨" },
  ack:        { bg: "bg-cyan-50",    bd: "border-cyan-300",    icon: "✅" },
  production: { bg: "bg-blue-50",    bd: "border-blue-300",    icon: "🏭" },
  asn:        { bg: "bg-emerald-50", bd: "border-emerald-300", icon: "🚚" },
  quality:    { bg: "bg-amber-50",   bd: "border-amber-300",   icon: "🔬" },
};

type Samples = { poNos: string[]; suppliers: { code: string; name: string }[] };

export default function AuditClient({ samples }: { samples: Samples }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const result = useMemo(() => submitted ? lookup(submitted) : null, [submitted]);

  function go(q: string) { setQuery(q); setSubmitted(q); }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🛰 供應商風險雷達 — Supplier Risk Radar</h1>
        <p className="text-sm text-slate-500 mt-1">
          不做「打分數系統」（A廠 82 分沒意義），做「風險雷達」：5 維加權 + 動量偵測 + 異常敘事
        </p>
      </header>

      {/* 模型說明 */}
      <section className="rounded-xl border-2 border-cyan-200 bg-cyan-50/40 p-4 text-xs">
        <div className="font-bold text-cyan-900 mb-2">🎯 五大核心評級模型（業界標準權重）</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {(Object.keys(RADAR_META) as RadarDimension[]).map((k) => {
            const m = RADAR_META[k];
            return (
              <div key={k} className="bg-white border border-slate-200 rounded-md p-2">
                <div className="font-bold text-slate-800">{m.labelEn} {m.label}</div>
                <div className="text-cyan-700 font-mono font-bold text-sm mt-0.5">{(m.weight * 100).toFixed(0)}%</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  <div><b>核心目的</b>：{m.purpose}</div>
                  <div className="mt-0.5">{m.signals}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 搜尋區 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex gap-2 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go(query)}
            placeholder="輸入 PO 號（PO-2026-0506）或廠商代號 / 簡稱（SUP-ZHY / 莊宏億）"
            className="flex-1 min-w-[280px] px-4 py-2.5 border border-slate-300 rounded-md text-sm"
          />
          <button onClick={() => go(query)} className="px-5 py-2.5 rounded-md bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700">
            🛰 啟動雷達
          </button>
        </div>
        <div className="mt-4">
          <div className="text-[10px] text-slate-500 font-bold mb-1.5 tracking-widest uppercase">快速試查 — PO 號</div>
          <div className="flex gap-1.5 flex-wrap">
            {samples.poNos.map((p) => (
              <button key={p} onClick={() => go(p)} className="px-2 py-1 text-[11px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700">{p}</button>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-3 mb-1.5 tracking-widest uppercase">快速試查 — 廠商</div>
          <div className="flex gap-1.5 flex-wrap">
            {samples.suppliers.map((s) => (
              <button key={s.code} onClick={() => go(s.code)} className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
                <span className="font-mono mr-1">{s.code}</span><span className="text-slate-500">({s.name})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {!result && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/30 p-6 text-center text-sm text-slate-600">
          輸入 PO 號 / 廠商代號 / 簡稱開始查詢
        </div>
      )}

      {result?.kind === "none" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <div className="font-bold text-amber-900 mb-2">未找到符合「{submitted}」的紀錄</div>
          {result.suggestion.length > 0 && (
            <div className="text-sm">
              <span className="text-slate-600">您是否想查：</span>
              {result.suggestion.map((s) => (
                <button key={s} onClick={() => go(s.split(" ")[0])} className="ml-2 text-cyan-700 hover:underline font-semibold text-sm">{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.kind === "po" && <PoView audit={result.data} />}
      {result?.kind === "supplier" && <RadarView radar={result.data} onSelectPo={(p) => go(p)} />}
    </div>
  );
}

// ============================================================
// 風險雷達主畫面
// ============================================================
function RadarView({ radar }: { radar: RiskRadar; onSelectPo: (poNo: string) => void }) {
  const mom = radar.riskMomentum;
  const momTone =
    mom === "rising" ? { bg: "bg-rose-50", bd: "border-rose-400", text: "text-rose-700", icon: "⚠", label: "風險正在上升" }
    : mom === "improving" ? { bg: "bg-emerald-50", bd: "border-emerald-400", text: "text-emerald-700", icon: "✓", label: "改善中" }
    : { bg: "bg-slate-50", bd: "border-slate-300", text: "text-slate-700", icon: "○", label: "穩定" };
  return (
    <>
      {/* ★ 風險敘事（最重要 — 一句話結論）★ */}
      <section className={`rounded-xl border-2 ${momTone.bd} ${momTone.bg} p-5`}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">RISK RADAR</span>
              <span className="font-mono text-xs text-slate-500">{radar.supplierCode}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                mom === "rising" ? "bg-rose-600 text-white" :
                mom === "improving" ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"
              }`}>{momTone.icon} {momTone.label}</span>
            </div>
            <div className={`text-xl font-extrabold ${momTone.text}`}>{radar.narrative}</div>
            <div className="text-xs text-slate-500 mt-1">{radar.country}　·　共 {radar.totalPOs} 張 PO 累積</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-widest text-slate-500 uppercase">綜合分（5 維加權）</div>
            <div className={`text-5xl font-extrabold tabular-nums ${momTone.text}`}>{radar.overallScore}</div>
          </div>
        </div>

        {/* 紅燈 / 正向信號 */}
        {(radar.warningSignals.length > 0 || radar.improvements.length > 0) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {radar.warningSignals.length > 0 && (
              <div className="bg-white/70 rounded-lg p-3">
                <div className="text-[10px] tracking-widest text-rose-700 uppercase font-bold mb-2">⚠ 異常信號（風險原因）</div>
                <ul className="space-y-1">
                  {radar.warningSignals.map((s, i) => (
                    <li key={i} className="text-sm text-slate-800">· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {radar.improvements.length > 0 && (
              <div className="bg-white/70 rounded-lg p-3">
                <div className="text-[10px] tracking-widest text-emerald-700 uppercase font-bold mb-2">✓ 正向信號</div>
                <ul className="space-y-1">
                  {radar.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-slate-800">· {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-100">
          <div className="text-[10px] tracking-widest text-cyan-400 font-bold mb-1">💬 議價立場 — AI 拿話</div>
          <div className="text-sm italic">「{radar.negotiationStance}」</div>
        </div>
      </section>

      {/* 5 維雷達圖 + 維度卡 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📡 5 維風險雷達（含動量）</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
          <RadarChart radar={radar} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(RADAR_META) as RadarDimension[]).map((k) => (
              <DimCard key={k} dim={k} score={radar.dims[k]} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================
// SVG 雷達圖（五邊形）
// ============================================================
function RadarChart({ radar }: { radar: RiskRadar }) {
  const dims: RadarDimension[] = ["reliability", "delivery", "quality", "cost", "risk"];
  const cx = 150, cy = 150, R = 110;
  // 5 個頂點角度（從正上方順時針）
  function point(i: number, score: number): [number, number] {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const r = (score / 100) * R;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }
  function gridPoint(i: number, frac: number): [number, number] {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const r = frac * R;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }
  // 5 同心五邊形
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const currPolygon = dims.map((d, i) => point(i, radar.dims[d].score).join(",")).join(" ");
  const prevPolygon = dims.map((d, i) => point(i, radar.dims[d].prevScore).join(",")).join(" ");

  const fillColor = radar.riskMomentum === "rising" ? "rgba(244,63,94,0.18)"
    : radar.riskMomentum === "improving" ? "rgba(16,185,129,0.18)" : "rgba(6,182,212,0.18)";
  const strokeColor = radar.riskMomentum === "rising" ? "#f43f5e"
    : radar.riskMomentum === "improving" ? "#10b981" : "#06b6d4";

  return (
    <div className="mx-auto" style={{ width: 300 }}>
      <svg viewBox="0 0 300 300" width="100%">
        {/* 格線 */}
        {gridLevels.map((f, gi) => (
          <polygon key={gi}
            points={dims.map((_, i) => gridPoint(i, f).join(",")).join(" ")}
            fill="none" stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {/* 軸線 */}
        {dims.map((_, i) => {
          const [x, y] = gridPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
        })}
        {/* 早期窗口（虛線） */}
        <polygon points={prevPolygon} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* 近期窗口（實線+填色） */}
        <polygon points={currPolygon} fill={fillColor} stroke={strokeColor} strokeWidth="2.5" />
        {/* 維度標籤 */}
        {dims.map((d, i) => {
          const [x, y] = gridPoint(i, 1.18);
          const meta = RADAR_META[d];
          return (
            <g key={d}>
              <text x={x} y={y - 6} textAnchor="middle" className="fill-slate-700" style={{ fontSize: 11, fontWeight: 700 }}>{meta.label}</text>
              <text x={x} y={y + 6} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>{(meta.weight * 100).toFixed(0)}%</text>
            </g>
          );
        })}
        {/* 維度分數（在頂點上） */}
        {dims.map((d, i) => {
          const [x, y] = point(i, radar.dims[d].score);
          return (
            <circle key={d} cx={x} cy={y} r={3.5} fill={strokeColor} stroke="#fff" strokeWidth="1.5" />
          );
        })}
      </svg>
      <div className="text-[10px] text-slate-500 flex gap-3 justify-center mt-1">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5" style={{ background: strokeColor }} />近期窗口</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-slate-400" />早期窗口</span>
      </div>
    </div>
  );
}

// ============================================================
// 維度卡（含 trend）
// ============================================================
function DimCard({ dim, score }: { dim: RadarDimension; score: DimScore }) {
  const meta = RADAR_META[dim];
  const tone = score.score >= 85 ? "emerald" : score.score >= 70 ? "cyan" : score.score >= 55 ? "amber" : "rose";
  const trendIcon = score.trend === "rising" ? "↑" : score.trend === "falling" ? "↓" : "→";
  const trendColor = score.trend === "rising" ? "text-emerald-600"
    : score.trend === "falling" ? "text-rose-600" : "text-slate-500";
  const trendLabel = score.trend === "rising" ? "改善" : score.trend === "falling" ? "惡化" : "持平";
  return (
    <div className={`rounded-lg border-2 p-3 ${
      tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
      tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
      tone === "amber" ? "border-amber-200 bg-amber-50/40" : "border-rose-200 bg-rose-50/40"
    }`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold">{meta.labelEn.toUpperCase()}</div>
          <div className="text-sm font-bold text-slate-800">{meta.label}</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-extrabold tabular-nums ${
            tone === "emerald" ? "text-emerald-600" : tone === "cyan" ? "text-cyan-600"
            : tone === "amber" ? "text-amber-600" : "text-rose-600"
          }`}>{score.score}</div>
          <div className={`text-[10px] font-bold ${trendColor}`}>
            {trendIcon} {trendLabel}（{score.delta >= 0 ? "+" : ""}{score.delta}）
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-500">早期 {score.prevScore} → 近期 {score.score}　·　權重 {(meta.weight * 100).toFixed(0)}%</div>
      {score.signals.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {score.signals.map((s, i) => (
            <li key={i} className="text-[11px] text-slate-700">· {s}</li>
          ))}
        </ul>
      )}
      {score.positives.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {score.positives.map((s, i) => (
            <li key={i} className="text-[11px] text-emerald-700">✓ {s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// 單張 PO 的追蹤履歷頁
// ============================================================
function PoView({ audit }: { audit: PoAudit }) {
  return (
    <>
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">PO 查詢</span>
          <span className="font-mono text-sm font-bold text-cyan-700">{audit.po.poNo}</span>
          <span className="text-xs text-slate-500">· {audit.partCode}</span>
        </div>
        <div className="font-bold text-lg">{audit.partName} × {audit.po.qty} {audit.partUnit}</div>
        <div className="text-sm text-slate-600 mt-1">
          供應商：<b>{audit.supplierName}</b> <span className="font-mono text-slate-400">({audit.supplierCode})</span>
          　·　單價 ${audit.po.unitCost.toLocaleString()}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <KV k="PO 發出" v={new Date(audit.po.sentAt).toLocaleDateString("zh-TW")} />
          <KV k="預定出貨" v={audit.po.expectedShipDate} />
          <KV k="預定到貨" v={audit.po.expectedArrival} />
        </div>
      </section>

      {/* 該供應商當前風險雷達摘要 */}
      {audit.radar && (
        <section className={`rounded-xl border-2 p-4 ${
          audit.radar.riskMomentum === "rising" ? "border-rose-400 bg-rose-50/50" :
          audit.radar.riskMomentum === "improving" ? "border-emerald-400 bg-emerald-50/50" :
          "border-slate-300 bg-slate-50"
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">該供應商當前風險雷達</div>
              <div className="font-bold text-base">{audit.radar.narrative}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">綜合</div>
              <div className="text-2xl font-extrabold tabular-nums">{audit.radar.overallScore}</div>
            </div>
          </div>
        </section>
      )}

      {/* 出貨追蹤履歷時間軸 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">⏱ 出貨追蹤履歷（完整時間軸）</h2>
        <ol className="space-y-3">
          {audit.timeline.map((e, i) => {
            const tone = CAT_TONE[e.category];
            return (
              <li key={i} className="flex gap-3">
                <div className="shrink-0 flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full ${tone.bg} border-2 ${tone.bd} flex items-center justify-center text-lg`}>
                    {tone.icon}
                  </div>
                  {i < audit.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" style={{ minHeight: 20 }} />}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-sm">{e.stage}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(e.at).toLocaleString("zh-TW", { hour12: false })}
                    </span>
                    {e.durationFromPrev && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Δ {e.durationFromPrev}</span>
                    )}
                    {e.vsBaseline && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        e.vsBaseline.deviation > 2 ? "bg-rose-100 text-rose-700" :
                        e.vsBaseline.deviation > 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        vs baseline {e.vsBaseline.baseline.toFixed(1)}{e.vsBaseline.unit} · 偏 {e.vsBaseline.deviation.toFixed(1)}σ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{e.detail}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">執行人：{e.actor}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="text-[10px] text-slate-500">{k}</div>
      <div className="text-sm font-semibold tabular-nums">{v}</div>
    </div>
  );
}
