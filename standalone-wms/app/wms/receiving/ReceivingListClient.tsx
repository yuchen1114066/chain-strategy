"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { IncomingPO } from "@/lib/erp/receiving-checklist";

type ChecklistMeta = { verdict?: string; inspector: string; putawayAt?: string; passSteps?: number };

export default function ReceivingListClient({ incoming }: { incoming: IncomingPO[] }) {
  const [meta, setMeta] = useState<Record<string, ChecklistMeta>>({});

  useEffect(() => {
    const load = () => {
      const out: Record<string, ChecklistMeta> = {};
      for (const p of incoming) {
        try {
          const raw = window.localStorage.getItem(`gascc.receiving.v2.${p.poId}`);
          if (raw) {
            const r = JSON.parse(raw);
            const passSteps = r.steps ? Object.values(r.steps).filter((s: unknown) => (s as { status: string }).status === "pass").length : 0;
            out[p.poId] = { verdict: r.verdict, inspector: r.inspector, putawayAt: r.putawayAt, passSteps };
          }
        } catch {}
      }
      setMeta(out);
    };
    load();
  }, [incoming]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📥 收貨 Checklist — 電子化檢核</h1>
          <p className="text-sm text-slate-500 mt-1">
            收貨不能只按「入庫完成」 — 必須完成 <b>5 項檢核</b>才能入庫
          </p>
        </div>
        <Link href="/wms" className="text-cyan-700 hover:underline text-sm">← 回 WMS Dashboard</Link>
      </header>

      {/* 7 階段風控架構說明 */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
        <div className="font-bold text-amber-900 mb-2">⚠ 7 階段風險控管（前 6 步必過，第 7 步系統自動判定）</div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-xs">
          {[
            { n: 1, t: "📱 掃描收貨" },
            { n: 2, t: "📦 外箱檢驗" },
            { n: 3, t: "⚖️ 重量驗證" },
            { n: 4, t: "📂 開箱驗證" },
            { n: 5, t: "🔢 數量驗證" },
            { n: 6, t: "🔬 IQC 品質" },
            { n: 7, t: "🎯 系統判定" },
          ].map((x) => (
            <div key={x.n} className="bg-white border border-amber-200 rounded p-2 text-center">
              <div className="text-[9px] text-slate-500 font-bold">Step {x.n}</div>
              <div className="text-[11px] font-semibold">{x.t}</div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-amber-800 mt-2 leading-relaxed">
          任一步驟 ✗ → 系統自動 FAIL → HOLD 連鎖：📧 通知採購 + SQE　·　📋 異常單　·　🔒 鎖定本批庫存　·　⛔ 禁止鼎新扣帳　·　📊 計入供應商風險雷達扣分
        </div>
      </section>

      {/* PO 收貨清單 */}
      {incoming.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="font-bold text-emerald-800">目前無待收貨 PO</div>
        </div>
      ) : (
        <section>
          <table className="w-full text-sm bg-white rounded-xl border border-slate-200 overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2">PO 號</th>
                <th className="text-left px-3 py-2">供應商</th>
                <th className="text-left px-3 py-2">料件</th>
                <th className="text-right px-3 py-2">數量</th>
                <th className="text-left px-3 py-2">預計到貨</th>
                <th className="text-left px-3 py-2">承運</th>
                <th className="text-center px-3 py-2">檢核狀態</th>
                <th className="text-center px-3 py-2">動作</th>
              </tr>
            </thead>
            <tbody>
              {incoming.map((p) => {
                const m = meta[p.poId];
                const verdict = m?.verdict ?? "pending";
                const stepsPassed = m?.passSteps ?? 0;
                const chip =
                  m?.putawayAt           ? { bg: "bg-emerald-100 text-emerald-700", label: "✅ 已入庫" }
                  : verdict === "PASS"   ? { bg: "bg-emerald-100 text-emerald-700", label: "✓ 7 步全通過" }
                  : verdict === "FAIL_HOLD" ? { bg: "bg-rose-100 text-rose-700",    label: "🚨 HOLD" }
                  : stepsPassed > 0      ? { bg: "bg-cyan-100 text-cyan-700",        label: `● ${stepsPassed}/7 進行中` }
                  : { bg: "bg-slate-100 text-slate-500", label: "○ 未開始" };
                return (
                  <tr key={p.poId} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-cyan-700 font-bold">{p.poNo}</td>
                    <td className="px-3 py-2">{p.supplierName}<div className="text-[10px] text-slate-400 font-mono">{p.supplierCode}</div></td>
                    <td className="px-3 py-2"><div className="font-semibold">{p.partName}</div><div className="text-[10px] text-slate-500 font-mono">{p.partCode}</div></td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.qty} {p.unit}</td>
                    <td className="px-3 py-2 text-slate-600">{p.expectedArrival}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{p.carrier ?? "—"}<div className="text-[10px] font-mono text-slate-400">{p.asnTrackingNo ?? ""}</div></td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${chip.bg}`}>{chip.label}</span>
                      {m?.inspector && <div className="text-[10px] text-slate-500 mt-0.5">檢核員 {m.inspector}</div>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Link href={`/wms/receiving/${p.poId}`}
                        className="px-3 py-1 text-xs rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-700">
                        {verdict === "PASS" || verdict === "FAIL_HOLD" ? "檢視" : "開始檢核 →"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 規則</b>　收貨 PO（status = shipped 或已填 ASN 但無 arrived 紀錄）→ 進入檢核流程。
        5 項必過才能按「確認入庫」。<b>正式版</b>：失敗自動推 push 採購 + 供應商，並計入 Supplier Risk Radar 的「品質維度」與「Reliability ETA 穩定性」。
      </p>
    </div>
  );
}
