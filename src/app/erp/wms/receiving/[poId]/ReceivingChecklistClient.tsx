"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CHECKLIST_ITEMS, emptyChecklist, computeStatus, canPutaway,
  type IncomingPO, type ChecklistRecord, type ChecklistItemKey, type ItemStatus,
} from "@/lib/erp/receiving-checklist";

const KEY = (poId: string) => `gascc.receiving.${poId}`;

export default function ReceivingChecklistClient({ po }: { po: IncomingPO }) {
  const [rec, setRec] = useState<ChecklistRecord>(() => emptyChecklist(po.poId, po.poNo));
  const [location, setLocation] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // 載入
  useEffect(() => {
    const restore = () => {
      try {
        const raw = window.localStorage.getItem(KEY(po.poId));
        if (raw) {
          const r = JSON.parse(raw) as ChecklistRecord;
          setRec(r);
          if (r.putawayLocation) setLocation(r.putawayLocation);
        }
      } catch {}
      setHydrated(true);
    };
    restore();
  }, [po.poId]);

  // 自動存
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY(po.poId), JSON.stringify(rec));
  }, [rec, po.poId, hydrated]);

  const status = useMemo(() => computeStatus(rec), [rec]);
  const ready = useMemo(() => canPutaway(rec), [rec]);
  const passCount = Object.values(rec.items).filter((v) => v.status === "pass").length;
  const failCount = Object.values(rec.items).filter((v) => v.status === "fail").length;

  function update(key: ChecklistItemKey, patch: Partial<ChecklistRecord["items"][ChecklistItemKey]>) {
    setRec((prev) => ({
      ...prev,
      startedAt: prev.startedAt ?? new Date().toISOString(),
      items: { ...prev.items, [key]: { ...prev.items[key], ...patch } },
      status: computeStatus({ ...prev, items: { ...prev.items, [key]: { ...prev.items[key], ...patch } } }),
    }));
  }

  function setItem(key: ChecklistItemKey, s: ItemStatus) {
    update(key, {
      status: s,
      failedAt: s === "fail" ? new Date().toISOString() : undefined,
    });
  }

  function setNote(key: ChecklistItemKey, note: string) {
    update(key, { note });
  }

  function confirmPutaway() {
    if (!ready) return;
    if (!location.trim()) { alert("請填寫入庫儲位"); return; }
    setRec((prev) => ({
      ...prev,
      status: "completed",
      completedAt: prev.completedAt ?? new Date().toISOString(),
      putawayAt: new Date().toISOString(),
      putawayLocation: location.trim(),
    }));
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <Link href="/erp/wms/receiving" className="text-cyan-700 hover:underline text-sm">← 回收貨清單</Link>

      {/* PO 概覽 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">收貨檢核</span>
          <span className="font-mono text-sm font-bold text-cyan-700">{po.poNo}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <KV k="供應商" v={po.supplierName} sub={po.supplierCode} />
          <KV k="料件" v={po.partName} sub={po.partCode} />
          <KV k="數量" v={`${po.qty} ${po.unit}`} sub={`單價 $${po.unitCost.toLocaleString()}`} />
          <KV k="承運" v={po.carrier ?? "—"} sub={po.asnTrackingNo ?? ""} />
        </div>
      </section>

      {/* 狀態總覽 */}
      <section className={`rounded-xl border-2 p-4 ${
        status === "completed" ? "border-emerald-400 bg-emerald-50"
        : status === "blocked" ? "border-rose-500 bg-rose-50"
        : status === "in_progress" ? "border-cyan-400 bg-cyan-50"
        : "border-slate-300 bg-slate-50"
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs tracking-widest font-bold text-slate-600 uppercase">當前狀態</div>
            <div className="text-xl font-extrabold mt-0.5">
              {status === "completed" && (rec.putawayAt ? "✅ 已入庫" : "✓ 5 項全通過 — 可入庫")}
              {status === "blocked" && "🚨 有失敗項 — 禁止入庫"}
              {status === "in_progress" && `● 進行中（${passCount}/${CHECKLIST_ITEMS.length} 已通過）`}
              {status === "not_started" && "○ 尚未開始"}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="text-slate-500">通過 / 失敗 / 待檢</div>
            <div className="font-bold tabular-nums">
              <span className="text-emerald-600">{passCount}</span> /
              <span className="text-rose-600 ml-1">{failCount}</span> /
              <span className="text-slate-500 ml-1">{CHECKLIST_ITEMS.length - passCount - failCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 檢核員 */}
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block">
          <span className="text-xs text-slate-500">檢核員姓名（必填）</span>
          <input value={rec.inspector}
            onChange={(e) => setRec((p) => ({ ...p, inspector: e.target.value }))}
            placeholder="例：倉管小張"
            disabled={!!rec.putawayAt}
            className="mt-1 w-full max-w-xs px-3 py-2 border border-slate-300 rounded text-sm" />
        </label>
      </section>

      {/* 5 項檢核 */}
      <section className="space-y-3">
        {CHECKLIST_ITEMS.map((it, idx) => {
          const v = rec.items[it.key];
          return (
            <div key={it.key} className={`bg-white rounded-xl border-2 p-4 ${
              v.status === "pass" ? "border-emerald-300"
              : v.status === "fail" ? "border-rose-400"
              : "border-slate-200"
            }`}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="text-3xl">{it.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500">第 {idx + 1} 項</span>
                    {v.status === "pass" && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">✓ 通過</span>}
                    {v.status === "fail" && <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold">✗ 失敗</span>}
                  </div>
                  <div className="font-bold text-lg">{it.label}</div>
                  {v.status === "fail" && (
                    <div className="text-[11px] text-rose-700 mt-1">
                      ⚠ 失敗處理：{it.failHandling}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setItem(it.key, "pass")} disabled={!!rec.putawayAt}
                    className={`px-3 py-2 rounded font-bold text-sm ${
                      v.status === "pass" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    } disabled:opacity-50`}>
                    ✓ 通過
                  </button>
                  <button onClick={() => setItem(it.key, "fail")} disabled={!!rec.putawayAt}
                    className={`px-3 py-2 rounded font-bold text-sm ${
                      v.status === "fail" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100"
                    } disabled:opacity-50`}>
                    ✗ 失敗
                  </button>
                </div>
              </div>
              {(v.status === "fail" || v.note) && (
                <textarea value={v.note ?? ""}
                  onChange={(e) => setNote(it.key, e.target.value)}
                  placeholder={v.status === "fail" ? "請描述失敗原因（必填，會記入品質卡）..." : "備註（選填）"}
                  disabled={!!rec.putawayAt}
                  className="mt-3 w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  rows={2} />
              )}
            </div>
          );
        })}
      </section>

      {/* 整體備註 */}
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block">
          <span className="text-xs text-slate-500">整體備註（選填）</span>
          <textarea value={rec.notes}
            onChange={(e) => setRec((p) => ({ ...p, notes: e.target.value }))}
            disabled={!!rec.putawayAt}
            placeholder="例：本批整體良好，僅外箱輕微凹陷不影響內容物..."
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-sm" rows={2} />
        </label>
      </section>

      {/* 入庫動作 */}
      <section className="bg-white rounded-xl border-2 border-slate-300 p-5">
        {rec.putawayAt ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4">
            <div className="font-bold text-emerald-900 text-lg">✅ 已入庫</div>
            <div className="text-sm text-slate-700 mt-1">
              入庫時間：{new Date(rec.putawayAt).toLocaleString("zh-TW", { hour12: false })}<br />
              入庫儲位：<b>{rec.putawayLocation}</b><br />
              檢核員：{rec.inspector}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              已自動同步至 WMS 庫存 + Supplier Digital Twin（行為履歷 → arrived 階段）。
            </div>
          </div>
        ) : status === "blocked" ? (
          <div className="bg-rose-50 border-2 border-rose-400 rounded-lg p-4">
            <div className="font-bold text-rose-900 text-lg">🚨 禁止入庫</div>
            <div className="text-sm text-slate-700 mt-1">
              有 {failCount} 項檢核失敗 — 系統已自動：
            </div>
            <ul className="text-xs text-slate-700 mt-2 ml-4 list-disc space-y-0.5">
              <li>拍照存證（demo：實機需接 QR 拍照模組）</li>
              <li>push 採購人員 + 通知供應商</li>
              <li>計入該供應商品質卡（Risk Radar Quality 維度扣分）</li>
              <li>建立決策閉環 → 等待採購決定（退貨 / 折讓 / 部分接受）</li>
            </ul>
            <div className="mt-3 flex gap-2">
              <Link href="/erp/decisions" className="px-3 py-2 text-xs rounded bg-rose-600 text-white font-bold">
                → 進決策閉環處理
              </Link>
              <Link href={`/erp/supplier-portal/audit?q=${po.supplierCode}`} className="px-3 py-2 text-xs rounded border border-slate-300 text-slate-700">
                → 看該供應商風險雷達
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="font-bold text-slate-800 mb-2">📦 確認入庫</div>
            <div className="flex gap-2 items-end flex-wrap">
              <label className="block">
                <span className="text-xs text-slate-500">入庫儲位（必填）</span>
                <input value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="例：A-12-03"
                  className="mt-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono" />
              </label>
              <button onClick={confirmPutaway} disabled={!ready || !location.trim()}
                className={`px-5 py-2.5 rounded font-bold text-sm ${
                  ready && location.trim()
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}>
                ✅ 確認入庫
              </button>
              {!ready && (
                <div className="text-[11px] text-amber-700 self-center">
                  {status === "not_started" || status === "in_progress"
                    ? `5 項檢核未全部通過（${passCount}/${CHECKLIST_ITEMS.length}）`
                    : !rec.inspector.trim()
                    ? "請先填檢核員姓名"
                    : ""}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function KV({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="text-[10px] text-slate-500">{k}</div>
      <div className="text-sm font-semibold">{v}</div>
      {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
    </div>
  );
}
