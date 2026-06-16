"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { IncomingPO } from "@/lib/erp/receiving-checklist";
import {
  saveIqcRecord, loadIqcRecords,
  saveRmaRecord, loadRmaRecords,
  type IqcRecord, type RmaRecord,
} from "@/lib/erp/master-data-store";

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
        <Link href="/erp/wms" className="text-cyan-700 hover:underline text-sm">← 回 WMS Dashboard</Link>
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
                      <Link href={`/erp/wms/receiving/${p.poId}`}
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

      {/* IQC + RMA 紀錄面板（PR-29 新增 · 真實 IndexedDB 儲存） */}
      <IqcRmaPanels />

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 規則</b>　收貨 PO（status = shipped 或已填 ASN 但無 arrived 紀錄）→ 進入檢核流程。
        5 項必過才能按「確認入庫」。<b>正式版</b>：失敗自動推 push 採購 + 供應商，並計入 Supplier Risk Radar 的「品質維度」與「Reliability ETA 穩定性」。
      </p>
    </div>
  );
}

// ============================================================
// IQC 進料檢驗 + RMA 退料 — 真實 IndexedDB 紀錄
//
// 收貨清單上方是 PO 列表（檢核流程入口），下方這塊是「歷史 IQC + RMA」+
// 「手動快速新增」。Scope：
//   - 顯示近 30 筆 IQC + 近 30 筆 RMA
//   - 統計：本月不良率、總批次、涉及供應商數
//   - 一個 modal 表單做 IQC 快速登錄（IQC NG 會問是否要同時開 RMA）
//   - 一個 modal 表單做 RMA 獨立登錄（盤點報廢 / 客訴回流）
// ============================================================
function IqcRmaPanels() {
  const [iqc, setIqc] = useState<IqcRecord[]>([]);
  const [rma, setRma] = useState<RmaRecord[]>([]);
  const [showIqcForm, setShowIqcForm] = useState(false);
  const [showRmaForm, setShowRmaForm] = useState(false);

  const refresh = useCallback(async () => {
    const [i, r] = await Promise.all([loadIqcRecords(30), loadRmaRecords(30)]);
    setIqc(i); setRma(r);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // 本月 IQC 統計
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthIqc = iqc.filter((x) => x.inspectedAt >= monthStart);
  const monthInspected = monthIqc.reduce((s, x) => s + x.qtyInspected, 0);
  const monthDefect = monthIqc.reduce((s, x) => s + x.qtyDefect, 0);
  const monthPpm = monthInspected > 0 ? Math.round(monthDefect / monthInspected * 1_000_000) : 0;
  const ngBatches = monthIqc.filter((x) => x.result === "NG").length;
  const ngRate = monthIqc.length > 0 ? (ngBatches / monthIqc.length * 100).toFixed(1) : "0";

  // RMA 統計
  const openRma = rma.filter((x) => x.status === "OPEN" || x.status === "SHIPPED_BACK").length;
  const monthRma = rma.filter((x) => x.createdAt >= monthStart).length;

  return (
    <>
      {/* IQC 區塊 */}
      <section className="rounded-xl border-2 border-emerald-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-emerald-900">🔬 IQC 進料檢驗紀錄</h2>
          <span className="text-xs text-slate-500 font-mono">本機 IndexedDB · 不上雲端</span>
          <span className="flex-1" />
          <button
            onClick={() => setShowIqcForm(true)}
            className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700"
          >+ 手動新增 IQC</button>
        </div>

        {/* 本月統計 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatCell label="本月檢驗批次" value={String(monthIqc.length)} sub="batches" />
          <StatCell label="本月不良率 (PPM)" value={monthPpm.toLocaleString()} sub={`${monthDefect}/${monthInspected}`} tone={monthPpm > 5000 ? "red" : monthPpm > 1000 ? "amber" : "green"} />
          <StatCell label="本月 NG 批次" value={String(ngBatches)} sub={`${ngRate}% 批次不合格`} tone={ngBatches > 0 ? "amber" : "green"} />
          <StatCell label="累計檢驗" value={String(iqc.length)} sub="all-time" />
        </div>

        {/* 近 10 筆 IQC */}
        {iqc.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded">
            還沒有 IQC 紀錄。點上方「+ 手動新增 IQC」開始，或在收料檢核完成時自動產生。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="text-left px-2 py-1.5">檢驗時間</th>
                  <th className="text-left px-2 py-1.5">PO 號</th>
                  <th className="text-left px-2 py-1.5">料號</th>
                  <th className="text-left px-2 py-1.5">供應商</th>
                  <th className="text-right px-2 py-1.5">來料</th>
                  <th className="text-right px-2 py-1.5">抽檢</th>
                  <th className="text-right px-2 py-1.5">不良</th>
                  <th className="text-right px-2 py-1.5">PPM</th>
                  <th className="text-center px-2 py-1.5">判定</th>
                  <th className="text-left px-2 py-1.5">原因</th>
                </tr>
              </thead>
              <tbody>
                {iqc.slice(0, 10).map((r) => {
                  const ppm = r.qtyInspected > 0 ? Math.round(r.qtyDefect / r.qtyInspected * 1_000_000) : 0;
                  const chipBg = r.result === "OK" ? "bg-emerald-100 text-emerald-700"
                    : r.result === "NG" ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-700";
                  return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-600 font-mono">{fmtDate(r.inspectedAt)}</td>
                      <td className="px-2 py-1.5 font-mono text-cyan-700">{r.poNo}</td>
                      <td className="px-2 py-1.5 font-mono">{r.partNo}</td>
                      <td className="px-2 py-1.5">{r.supplier}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.qtyDelivered}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.qtyInspected}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.qtyDefect}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold" style={{
                        color: ppm > 5000 ? "#d4351c" : ppm > 1000 ? "#b8860b" : "#0c1908",
                      }}>{ppm.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${chipBg}`}>{r.result}</span>
                      </td>
                      <td className="px-2 py-1.5 text-slate-600 max-w-[200px] truncate">{r.defectReason ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RMA 區塊 */}
      <section className="rounded-xl border-2 border-rose-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-rose-900">↩ RMA 退料紀錄</h2>
          <span className="text-xs text-slate-500 font-mono">IQC NG / 客訴回流 / 盤點報廢</span>
          <span className="flex-1" />
          <button
            onClick={() => setShowRmaForm(true)}
            className="px-3 py-1.5 text-xs rounded bg-rose-600 text-white font-bold hover:bg-rose-700"
          >+ 手動新增 RMA</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <StatCell label="未結案 RMA" value={String(openRma)} sub="OPEN / SHIPPED_BACK" tone={openRma > 5 ? "red" : openRma > 0 ? "amber" : "green"} />
          <StatCell label="本月新增 RMA" value={String(monthRma)} sub="this month" />
          <StatCell label="累計 RMA" value={String(rma.length)} sub="all-time" />
        </div>

        {rma.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded">
            目前沒有 RMA 紀錄。IQC 判定 NG 時可同步建立，或點上方「+ 手動新增 RMA」。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="text-left px-2 py-1.5">建立時間</th>
                  <th className="text-left px-2 py-1.5">RMA 號</th>
                  <th className="text-left px-2 py-1.5">原 PO</th>
                  <th className="text-left px-2 py-1.5">料號</th>
                  <th className="text-left px-2 py-1.5">供應商</th>
                  <th className="text-right px-2 py-1.5">退貨數</th>
                  <th className="text-left px-2 py-1.5">原因</th>
                  <th className="text-center px-2 py-1.5">狀態</th>
                </tr>
              </thead>
              <tbody>
                {rma.slice(0, 10).map((r) => {
                  const chipBg = r.status === "CLOSED" || r.status === "REPLACED" ? "bg-emerald-100 text-emerald-700"
                    : r.status === "SHIPPED_BACK" ? "bg-cyan-100 text-cyan-700"
                    : "bg-amber-100 text-amber-700";
                  return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-600 font-mono">{fmtDate(r.createdAt)}</td>
                      <td className="px-2 py-1.5 font-mono text-rose-700 font-bold">{r.rmaNo}</td>
                      <td className="px-2 py-1.5 font-mono text-cyan-700">{r.poNo}</td>
                      <td className="px-2 py-1.5 font-mono">{r.partNo}</td>
                      <td className="px-2 py-1.5">{r.supplier}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{r.qty}</td>
                      <td className="px-2 py-1.5 text-slate-600 max-w-[240px] truncate">{r.reason}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${chipBg}`}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showIqcForm && (
        <IqcForm
          onClose={() => setShowIqcForm(false)}
          onSaved={() => { setShowIqcForm(false); refresh(); }}
        />
      )}
      {showRmaForm && (
        <RmaForm
          onClose={() => setShowRmaForm(false)}
          onSaved={() => { setShowRmaForm(false); refresh(); }}
        />
      )}
    </>
  );
}

// ============================================================
// IQC 快速登錄表單（modal）
// ============================================================
function IqcForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    poNo: "", partNo: "", supplier: "",
    qtyDelivered: "", qtyInspected: "", qtyDefect: "",
    result: "OK" as "OK" | "NG" | "CONDITIONAL",
    defectReason: "", inspector: "",
  });
  const [alsoCreateRma, setAlsoCreateRma] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const qd = parseInt(form.qtyDelivered, 10);
    const qi = parseInt(form.qtyInspected, 10);
    const qf = parseInt(form.qtyDefect, 10);
    if (!form.poNo || !form.partNo || !form.supplier) {
      setError("PO 號 / 料號 / 供應商必填"); return;
    }
    if (!Number.isFinite(qd) || !Number.isFinite(qi) || !Number.isFinite(qf)) {
      setError("數量欄位必須是數字"); return;
    }
    if (qf > qi) { setError("不良數不能大於抽檢數"); return; }
    setSaving(true);
    try {
      const iqcId = await saveIqcRecord({
        inspectedAt: Date.now(),
        poNo: form.poNo, partNo: form.partNo, supplier: form.supplier,
        qtyDelivered: qd, qtyInspected: qi, qtyDefect: qf,
        result: form.result,
        defectReason: form.defectReason || undefined,
        inspector: form.inspector || undefined,
      });
      if (alsoCreateRma && (form.result === "NG" || form.result === "CONDITIONAL")) {
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        await saveRmaRecord({
          createdAt: Date.now(),
          rmaNo: `RMA-${ymd}-${rand}`,
          poNo: form.poNo, partNo: form.partNo, supplier: form.supplier,
          qty: qf,
          reason: form.defectReason || "IQC 判定 NG",
          status: "OPEN",
          iqcRecordId: iqcId,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  };

  return (
    <Modal title="🔬 新增 IQC 進料檢驗紀錄" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="PO 號 *" value={form.poNo} onChange={(v) => setForm({ ...form, poNo: v })} />
        <FormField label="料號 *" value={form.partNo} onChange={(v) => setForm({ ...form, partNo: v })} />
        <FormField label="供應商 *" value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} wide />
        <FormField label="來料數量" value={form.qtyDelivered} onChange={(v) => setForm({ ...form, qtyDelivered: v })} />
        <FormField label="抽檢數量" value={form.qtyInspected} onChange={(v) => setForm({ ...form, qtyInspected: v })} />
        <FormField label="不良數" value={form.qtyDefect} onChange={(v) => setForm({ ...form, qtyDefect: v })} />
        <FormField label="檢驗員" value={form.inspector} onChange={(v) => setForm({ ...form, inspector: v })} />
        <div className="col-span-2">
          <label className="text-xs text-slate-600 block mb-1">判定 *</label>
          <div className="flex gap-2">
            {(["OK", "NG", "CONDITIONAL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setForm({ ...form, result: r })}
                className={`px-3 py-1.5 rounded text-xs font-bold ${
                  form.result === r
                    ? r === "OK" ? "bg-emerald-600 text-white"
                    : r === "NG" ? "bg-rose-600 text-white"
                    : "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >{r === "CONDITIONAL" ? "特採" : r}</button>
            ))}
          </div>
        </div>
        <FormField label="不良原因（NG / 特採需填）" value={form.defectReason} onChange={(v) => setForm({ ...form, defectReason: v })} wide />
        {(form.result === "NG" || form.result === "CONDITIONAL") && (
          <label className="col-span-2 flex items-center gap-2 text-sm bg-rose-50 border border-rose-200 rounded p-2">
            <input
              type="checkbox"
              checked={alsoCreateRma}
              onChange={(e) => setAlsoCreateRma(e.target.checked)}
            />
            同步建立 RMA 退料單（將自動產 RMA 號，狀態為 OPEN）
          </label>
        )}
      </div>
      {error && <div className="mt-3 p-2 rounded bg-rose-50 text-rose-700 text-sm">{error}</div>}
      <div className="mt-4 flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded border border-slate-300 text-sm">取消</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
          {saving ? "儲存中…" : "✓ 儲存"}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// RMA 獨立登錄表單
// ============================================================
function RmaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const [form, setForm] = useState({
    rmaNo: `RMA-${ymd}-${rand}`,
    poNo: "", partNo: "", supplier: "",
    qty: "",
    reason: "",
    status: "OPEN" as RmaRecord["status"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const q = parseInt(form.qty, 10);
    if (!form.poNo || !form.partNo || !form.supplier || !form.reason) {
      setError("PO / 料號 / 供應商 / 原因必填"); return;
    }
    if (!Number.isFinite(q) || q <= 0) { setError("退貨數量必須 > 0"); return; }
    setSaving(true);
    try {
      await saveRmaRecord({
        createdAt: Date.now(),
        rmaNo: form.rmaNo,
        poNo: form.poNo, partNo: form.partNo, supplier: form.supplier,
        qty: q, reason: form.reason, status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setSaving(false);
    }
  };

  return (
    <Modal title="↩ 新增 RMA 退料紀錄" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="RMA 號（自動產生，可改）" value={form.rmaNo} onChange={(v) => setForm({ ...form, rmaNo: v })} wide />
        <FormField label="原 PO 號 *" value={form.poNo} onChange={(v) => setForm({ ...form, poNo: v })} />
        <FormField label="料號 *" value={form.partNo} onChange={(v) => setForm({ ...form, partNo: v })} />
        <FormField label="供應商 *" value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} wide />
        <FormField label="退貨數量 *" value={form.qty} onChange={(v) => setForm({ ...form, qty: v })} />
        <div>
          <label className="text-xs text-slate-600 block mb-1">狀態</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as RmaRecord["status"] })}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="OPEN">OPEN 待退</option>
            <option value="SHIPPED_BACK">SHIPPED_BACK 已退出</option>
            <option value="REPLACED">REPLACED 已換貨</option>
            <option value="CLOSED">CLOSED 結案</option>
          </select>
        </div>
        <FormField label="退料原因 *" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} wide />
      </div>
      {error && <div className="mt-3 p-2 rounded bg-rose-50 text-rose-700 text-sm">{error}</div>}
      <div className="mt-4 flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded border border-slate-300 text-sm">取消</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 rounded bg-rose-600 text-white text-sm font-bold disabled:opacity-50">
          {saving ? "儲存中…" : "✓ 儲存"}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// 共用 UI 小元件
// ============================================================
function StatCell({ label, value, sub, tone }: {
  label: string; value: string; sub?: string; tone?: "red" | "amber" | "green";
}) {
  const valueColor = tone === "red" ? "text-rose-700" : tone === "amber" ? "text-amber-700" : tone === "green" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="bg-slate-50 rounded p-2.5">
      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${valueColor}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function FormField({ label, value, onChange, wide }: {
  label: string; value: string; onChange: (v: string) => void; wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm font-mono"
      />
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
