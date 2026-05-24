"use client";

import { useMemo, useState } from "react";
import { lookup, type PoAudit, type SupplierAudit, type AuditTimelineEvent } from "@/lib/erp/supplier-audit";

const CAT_TONE: Record<AuditTimelineEvent["category"], { bg: string; bd: string; icon: string }> = {
  po:         { bg: "bg-slate-50",   bd: "border-slate-300",   icon: "📨" },
  ack:        { bg: "bg-cyan-50",    bd: "border-cyan-300",    icon: "✅" },
  production: { bg: "bg-blue-50",    bd: "border-blue-300",    icon: "🏭" },
  asn:        { bg: "bg-emerald-50", bd: "border-emerald-300", icon: "🚚" },
  quality:    { bg: "bg-amber-50",   bd: "border-amber-300",   icon: "🔬" },
};

const GRADE_TONE = {
  A: { bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-500", label: "優質" },
  B: { bg: "bg-cyan-600",    text: "text-cyan-600",    border: "border-cyan-500",    label: "合格" },
  C: { bg: "bg-amber-500",   text: "text-amber-600",   border: "border-amber-500",   label: "需改善" },
  D: { bg: "bg-rose-600",    text: "text-rose-600",    border: "border-rose-500",    label: "高風險" },
} as const;

type Samples = { poNos: string[]; suppliers: { code: string; name: string }[] };

export default function AuditClient({ samples }: { samples: Samples }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const result = useMemo(() => submitted ? lookup(submitted) : null, [submitted]);

  function go(q: string) {
    setQuery(q);
    setSubmitted(q);
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">🔍 供應商查詢 + 評核 — Supplier Lookup & Audit</h1>
        <p className="text-sm text-slate-500 mt-1">
          輸入 <b>PO 號</b> 或 <b>廠商代號 / 簡稱</b> → 自動查出出貨進度與後續追蹤狀況 → 一鍵生成 4 維度供應商評核
        </p>
      </header>

      {/* 搜尋區 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex gap-2 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go(query)}
            placeholder="輸入 PO 號（如 PO-2026-0506）或廠商代號 / 簡稱（如 SUP-ZHY 或 莊宏億）"
            className="flex-1 min-w-[280px] px-4 py-2.5 border border-slate-300 rounded-md text-sm"
          />
          <button onClick={() => go(query)}
            className="px-5 py-2.5 rounded-md bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700">
            🔍 查詢評核
          </button>
        </div>
        {/* Quick-pick */}
        <div className="mt-4">
          <div className="text-[10px] text-slate-500 font-bold mb-1.5 tracking-widest uppercase">快速試查 — PO 號</div>
          <div className="flex gap-1.5 flex-wrap">
            {samples.poNos.map((p) => (
              <button key={p} onClick={() => go(p)} className="px-2 py-1 text-[11px] font-mono rounded bg-slate-100 hover:bg-slate-200 text-slate-700">
                {p}
              </button>
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

      {/* 結果 */}
      {!result && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/30 p-6 text-center text-sm text-slate-600">
          請輸入 PO 號或廠商代號 / 簡稱開始查詢
        </div>
      )}

      {result?.kind === "none" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <div className="font-bold text-amber-900 mb-2">未找到符合「{submitted}」的紀錄</div>
          {result.suggestion.length > 0 && (
            <div className="text-sm">
              <span className="text-slate-600">您是否想查：</span>
              {result.suggestion.map((s) => (
                <button key={s} onClick={() => go(s.split(" ")[0])} className="ml-2 text-cyan-700 hover:underline font-semibold text-sm">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.kind === "po" && <PoAuditView audit={result.data} />}
      {result?.kind === "supplier" && <SupplierAuditView audit={result.data} onSelectPo={(poNo) => go(poNo)} />}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>評核 4 維度</b>　① 協作配合度（PO ack 速度 + 進度更新 + ASN 填寫）　② 準時度（實際 vs 預定）
        ③ 品質（合格率 / 不良 / 退貨）　④ 數位化承諾兌現（ASN ETA vs 實際到貨）。
        綜合分 ≥85=A 優質　·　70-84=B 合格　·　55-69=C 需改善　·　&lt;55=D 高風險。
      </p>
    </div>
  );
}

// ============================================================
// 單張 PO 評核
// ============================================================
function PoAuditView({ audit }: { audit: PoAudit }) {
  const g = GRADE_TONE[audit.overall.grade];
  return (
    <>
      {/* PO 摘要 + 評核總分 */}
      <section className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">PO 查詢</span>
            <span className="font-mono text-sm font-bold text-cyan-700">{audit.po.poNo}</span>
            <span className="text-xs text-slate-500">· {audit.partCode}</span>
          </div>
          <div className="font-bold text-lg">{audit.partName} × {audit.po.qty} {/* unit */}</div>
          <div className="text-sm text-slate-600 mt-1">
            供應商：<b>{audit.supplierName}</b> <span className="font-mono text-slate-400">({audit.supplierCode})</span>
            　·　單價 ${audit.po.unitCost.toLocaleString()}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <KV k="PO 發出" v={new Date(audit.po.sentAt).toLocaleDateString("zh-TW")} />
            <KV k="預定出貨" v={audit.po.expectedShipDate} />
            <KV k="預定到貨" v={audit.po.expectedArrival} />
          </div>
        </div>
        <div className={`rounded-xl border-2 ${g.border} bg-white p-5 text-center`}>
          <div className="text-[10px] tracking-widest text-slate-500 uppercase">綜合評等</div>
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-white text-5xl font-extrabold my-2 ${g.bg}`}>
            {audit.overall.grade}
          </div>
          <div className={`text-3xl font-extrabold tabular-nums ${g.text}`}>{audit.overall.score}</div>
          <div className="text-xs text-slate-600 mt-1">{g.label}</div>
          <div className="text-[11px] text-slate-700 mt-2 leading-tight">{audit.overall.oneLiner}</div>
        </div>
      </section>

      {/* 4 維度 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📊 4 維度評核</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DimCard label="協作配合度" score={audit.scores.collaboration.score} note={audit.scores.collaboration.verdict} />
          <DimCard label="準時度"     score={audit.scores.onTime.score}        note={audit.scores.onTime.verdict} />
          <DimCard label="品質"       score={audit.scores.quality.score}       note={audit.scores.quality.verdict} />
          <DimCard label="承諾兌現"   score={audit.scores.commitment.score}    note={audit.scores.commitment.verdict} />
        </div>
      </section>

      {/* 完整追蹤履歷時間軸 */}
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Δ {e.durationFromPrev}
                      </span>
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

// ============================================================
// 供應商評核總覽
// ============================================================
function SupplierAuditView({ audit, onSelectPo }: { audit: SupplierAudit; onSelectPo: (poNo: string) => void }) {
  const g = GRADE_TONE[audit.overallGrade];
  return (
    <>
      <section className={`bg-white rounded-xl border-2 ${g.border} p-5`}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">廠商查詢</span>
              <span className="font-mono text-sm font-bold text-cyan-700">{audit.supplierCode}</span>
            </div>
            <h2 className="text-2xl font-extrabold">{audit.supplierName}</h2>
            <div className="text-sm text-slate-600 mt-1">{audit.country}　·　共 {audit.totalPOs} 張 PO 累積評核</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] tracking-widest text-slate-500 uppercase">綜合評等</div>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-5xl font-extrabold my-1 ${g.bg}`}>
              {audit.overallGrade}
            </div>
            <div className={`text-3xl font-extrabold tabular-nums ${g.text}`}>{audit.overallScore}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <DimCard label="協作配合度" score={Math.round(audit.avgCollaboration)} />
          <DimCard label="準時度"     score={Math.round(audit.avgOnTime)} />
          <DimCard label="品質"       score={Math.round(audit.avgQuality)} />
          <DimCard label="承諾兌現"   score={Math.round(audit.avgCommitment)} />
        </div>

        <div className={`mt-4 p-3 rounded-lg border-l-4 ${g.border} bg-slate-50`}>
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">議價立場 — AI 建議拿話</div>
          <div className="text-sm font-semibold italic">「{audit.conclusion}」</div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📋 此廠商全部 PO 評核明細</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">PO 號</th>
              <th className="text-left px-3 py-2">料件</th>
              <th className="text-right px-3 py-2">數量</th>
              <th className="text-center px-3 py-2">協作</th>
              <th className="text-center px-3 py-2">準時</th>
              <th className="text-center px-3 py-2">品質</th>
              <th className="text-center px-3 py-2">承諾</th>
              <th className="text-center px-3 py-2">綜合</th>
              <th className="text-left px-3 py-2">關鍵注記</th>
            </tr>
          </thead>
          <tbody>
            {audit.poAudits.map((p) => (
              <tr key={p.po.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <button onClick={() => onSelectPo(p.po.poNo)} className="font-mono text-cyan-700 hover:underline font-semibold">
                    {p.po.poNo}
                  </button>
                </td>
                <td className="px-3 py-2 text-xs">{p.partName}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.po.qty}</td>
                <td className="px-3 py-2 text-center"><ScoreChip score={p.scores.collaboration.score} /></td>
                <td className="px-3 py-2 text-center"><ScoreChip score={p.scores.onTime.score} /></td>
                <td className="px-3 py-2 text-center"><ScoreChip score={p.scores.quality.score} /></td>
                <td className="px-3 py-2 text-center"><ScoreChip score={p.scores.commitment.score} /></td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block w-7 h-7 rounded text-white text-xs font-bold flex items-center justify-center mx-auto ${GRADE_TONE[p.overall.grade].bg}`}>
                    {p.overall.grade}
                  </span>
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-600 max-w-xs">
                  {[
                    p.scores.collaboration.score < 80 ? p.scores.collaboration.verdict : null,
                    p.scores.quality.score < 80 ? p.scores.quality.verdict : null,
                  ].filter(Boolean).join("； ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-slate-500 mt-3">點 PO 號可看完整出貨追蹤履歷</div>
      </section>
    </>
  );
}

// ============================================================
// 共用元件
// ============================================================
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="text-[10px] text-slate-500">{k}</div>
      <div className="text-sm font-semibold tabular-nums">{v}</div>
    </div>
  );
}

function DimCard({ label, score, note }: { label: string; score: number; note?: string }) {
  const tone = score >= 85 ? "emerald" : score >= 70 ? "cyan" : score >= 55 ? "amber" : "rose";
  const colorMap = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
    cyan:    "text-cyan-600 bg-cyan-50 border-cyan-200",
    amber:   "text-amber-600 bg-amber-50 border-amber-200",
    rose:    "text-rose-600 bg-rose-50 border-rose-200",
  } as const;
  return (
    <div className={`rounded-lg border-2 p-3 ${colorMap[tone]}`}>
      <div className="text-[10px] text-slate-700 font-bold tracking-wider">{label}</div>
      <div className="text-3xl font-extrabold tabular-nums mt-1">{score}</div>
      <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mt-1">
        <div className={`h-full ${tone === "emerald" ? "bg-emerald-500" : tone === "cyan" ? "bg-cyan-500" : tone === "amber" ? "bg-amber-500" : "bg-rose-500"}`}
          style={{ width: `${score}%` }} />
      </div>
      {note && <div className="text-[10px] text-slate-600 mt-2 leading-snug">{note}</div>}
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const tone = score >= 85 ? "bg-emerald-100 text-emerald-700"
    : score >= 70 ? "bg-cyan-100 text-cyan-700"
    : score >= 55 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tabular-nums ${tone}`}>{score}</span>;
}
