"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  RECEIVING_STEPS, emptyReceiving, recalc, canPutaway,
  type IncomingPO, type ReceivingRecord, type ReceivingStepKey, type SubCheckStatus,
} from "@/lib/erp/receiving-checklist";

const KEY = (poId: string) => `gascc.receiving.v2.${poId}`;

const STEP_TONES: Record<string, { bd: string; bg: string; chip: string; ring: string }> = {
  pass:        { bd: "border-emerald-400", bg: "bg-emerald-50",  chip: "bg-emerald-600", ring: "ring-emerald-300" },
  fail:        { bd: "border-rose-500",    bg: "bg-rose-50",     chip: "bg-rose-600",    ring: "ring-rose-300" },
  in_progress: { bd: "border-cyan-400",    bg: "bg-cyan-50",     chip: "bg-cyan-600",    ring: "ring-cyan-300" },
  locked:      { bd: "border-slate-200",   bg: "bg-slate-50/60", chip: "bg-slate-300",   ring: "" },
};

export default function ReceivingChecklistClient({ po }: { po: IncomingPO }) {
  const [rec, setRec] = useState<ReceivingRecord>(() => emptyReceiving(po.poId, po.poNo));
  const [location, setLocation] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [activeStep, setActiveStep] = useState<ReceivingStepKey>("scan");

  // 載入
  useEffect(() => {
    const restore = () => {
      try {
        const raw = window.localStorage.getItem(KEY(po.poId));
        if (raw) {
          const r = recalc(JSON.parse(raw) as ReceivingRecord);
          setRec(r);
          if (r.putawayLocation) setLocation(r.putawayLocation);
          // 跳到第一個進行中或失敗的 step
          const cur = RECEIVING_STEPS.find((s) => r.steps[s.key].status === "in_progress" || r.steps[s.key].status === "fail");
          if (cur) setActiveStep(cur.key);
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

  function setSubCheck(stepKey: ReceivingStepKey, subKey: string, status: SubCheckStatus, note?: string) {
    setRec((prev) => {
      const draft = {
        ...prev,
        steps: {
          ...prev.steps,
          [stepKey]: {
            ...prev.steps[stepKey],
            subChecks: {
              ...prev.steps[stepKey].subChecks,
              [subKey]: { status, note: note ?? prev.steps[stepKey].subChecks[subKey]?.note },
            },
          },
        },
      };
      return recalc(draft);
    });
  }

  function setNote(stepKey: ReceivingStepKey, subKey: string, note: string) {
    setRec((prev) => {
      const draft = {
        ...prev,
        steps: {
          ...prev.steps,
          [stepKey]: {
            ...prev.steps[stepKey],
            subChecks: {
              ...prev.steps[stepKey].subChecks,
              [subKey]: { ...prev.steps[stepKey].subChecks[subKey], note },
            },
          },
        },
      };
      return draft;
    });
  }

  function confirmPutaway() {
    if (!canPutaway(rec)) return;
    if (!location.trim()) { alert("請填寫入庫儲位"); return; }
    setRec((prev) => ({
      ...prev,
      putawayAt: new Date().toISOString(),
      putawayLocation: location.trim(),
    }));
  }

  const overallProgress = useMemo(() => {
    const passed = RECEIVING_STEPS.filter((s) => rec.steps[s.key].status === "pass").length;
    return (passed / RECEIVING_STEPS.length) * 100;
  }, [rec]);

  const currentStepDef = useMemo(() => RECEIVING_STEPS.find((s) => s.key === activeStep)!, [activeStep]);
  const currentStepState = rec.steps[activeStep];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <Link href="/erp/wms/receiving" className="text-cyan-700 hover:underline text-sm">← 回收貨清單</Link>

      {/* PO 概覽 + ASN pre-arrival */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-white font-bold">收貨風險控管（7 階段）</span>
            <span className="font-mono text-sm font-bold text-cyan-700">{po.poNo}</span>
          </div>
          <div className="text-xs text-slate-600">
            進度 <b className="text-cyan-700 tabular-nums">{overallProgress.toFixed(0)}%</b>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <KV k="供應商" v={po.supplierName} sub={po.supplierCode} />
          <KV k="料件" v={po.partName} sub={po.partCode} />
          <KV k="數量" v={`${po.qty} ${po.unit}`} sub={`單價 $${po.unitCost.toLocaleString()}`} />
          <KV k="承運" v={po.carrier ?? "—"} sub={po.asnTrackingNo ?? ""} />
        </div>
      </section>

      {/* ASN Pre-arrival 資料（系統自動比對用） */}
      <section className="rounded-xl border-2 border-cyan-300 bg-cyan-50/50 p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <div className="font-bold text-cyan-900">📋 ASN 預到資料（Pre-arrival — 供應商出貨後上傳）</div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-700 text-white">系統自動比對</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <KV k="PO" v={rec.asnPreArrival.poNo} />
          <KV k="箱數" v={`${rec.asnPreArrival.boxCount} 箱`} />
          <KV k="出貨重量" v={`${rec.asnPreArrival.shipWeight} kg`} />
          <KV k="QR/Barcode" v={`${rec.asnPreArrival.qrCodes.length} 組`} />
        </div>
        <div className="mt-2 text-[10px] text-slate-600">
          箱號清單：<span className="font-mono">{rec.asnPreArrival.boxNos.slice(0, 3).join(", ")}{rec.asnPreArrival.boxNos.length > 3 ? `, ...+${rec.asnPreArrival.boxNos.length - 3}` : ""}</span>
        </div>
      </section>

      {/* 進度條 */}
      <section>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full transition-all ${rec.verdict === "FAIL_HOLD" ? "bg-rose-500" : rec.verdict === "PASS" ? "bg-emerald-500" : "bg-cyan-500"}`}
            style={{ width: `${overallProgress}%` }} />
        </div>
      </section>

      {/* 7 步驟標籤 */}
      <section className="flex gap-1 flex-wrap">
        {RECEIVING_STEPS.map((s) => {
          const st = rec.steps[s.key];
          const tone = STEP_TONES[st.status];
          const isActive = activeStep === s.key;
          return (
            <button key={s.key} onClick={() => setActiveStep(s.key)}
              disabled={st.status === "locked"}
              className={`flex-1 min-w-[120px] rounded-lg border-2 p-2 text-left transition-all ${tone.bd} ${tone.bg} ${
                isActive ? `ring-2 ${tone.ring}` : ""
              } disabled:opacity-50 disabled:cursor-not-allowed`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${tone.chip}`}>Step {s.num}</span>
                <span className="text-lg">{s.icon}</span>
              </div>
              <div className="text-xs font-bold mt-1">{s.label}</div>
              <div className="text-[10px] mt-0.5 font-semibold">
                {st.status === "pass" && <span className="text-emerald-700">✓ 通過</span>}
                {st.status === "fail" && <span className="text-rose-700">✗ 失敗</span>}
                {st.status === "in_progress" && <span className="text-cyan-700">● 進行中</span>}
                {st.status === "locked" && <span className="text-slate-400">🔒 鎖定</span>}
              </div>
            </button>
          );
        })}
      </section>

      {/* 當前步驟 */}
      <section className={`rounded-xl border-2 p-5 ${STEP_TONES[currentStepState.status].bd} ${STEP_TONES[currentStepState.status].bg}`}>
        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
          <div>
            <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">STEP {currentStepDef.num} / 7</div>
            <h2 className="text-xl font-extrabold">{currentStepDef.icon} {currentStepDef.label}</h2>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${STEP_TONES[currentStepState.status].chip}`}>
            {currentStepState.status === "pass" ? "✓ 通過" :
             currentStepState.status === "fail" ? "✗ 失敗" :
             currentStepState.status === "in_progress" ? "● 進行中" : "🔒 鎖定"}
          </span>
        </div>
        <div className="text-sm text-slate-600 mb-3">{currentStepDef.desc}</div>

        {/* Step 7 自動判定 */}
        {currentStepDef.automatic ? (
          <VerdictPanel rec={rec} location={location} setLocation={setLocation} onPutaway={confirmPutaway} />
        ) : (
          <>
            {currentStepState.status === "locked" && (
              <div className="rounded bg-slate-100 p-3 text-sm text-slate-500">
                請先完成前一步驟才能解鎖此步驟。
              </div>
            )}
            <div className="space-y-2">
              {currentStepDef.subChecks.map((sc, idx) => {
                const cv = currentStepState.subChecks[sc.key];
                const disabled = currentStepState.status === "locked" || !!rec.putawayAt;
                return (
                  <div key={sc.key} className={`rounded-lg border bg-white p-3 ${
                    cv?.status === "fail" ? "border-rose-400" : cv?.status === "pass" ? "border-emerald-300" : "border-slate-200"
                  }`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                          {cv?.status === "pass" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">✓</span>}
                          {cv?.status === "fail" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold">✗</span>}
                        </div>
                        <div className="font-bold text-sm">{sc.label}</div>
                        {sc.hint && <div className="text-[11px] text-slate-500 mt-0.5">{sc.hint}</div>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setSubCheck(currentStepDef.key, sc.key, "pass")} disabled={disabled}
                          className={`px-3 py-1.5 rounded text-xs font-bold ${
                            cv?.status === "pass" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                          } disabled:opacity-50`}>✓ PASS</button>
                        <button onClick={() => setSubCheck(currentStepDef.key, sc.key, "fail")} disabled={disabled}
                          className={`px-3 py-1.5 rounded text-xs font-bold ${
                            cv?.status === "fail" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100"
                          } disabled:opacity-50`}>✗ FAIL</button>
                      </div>
                    </div>
                    {(cv?.status === "fail" || cv?.note) && (
                      <textarea value={cv?.note ?? ""}
                        onChange={(e) => setNote(currentStepDef.key, sc.key, e.target.value)}
                        placeholder={cv?.status === "fail" ? "請描述失敗原因（必填，會記入異常單）..." : "備註（選填）"}
                        disabled={disabled}
                        className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded text-sm" rows={2} />
                    )}
                    {/* Step 6 IQC 尺寸子項 — 連結到 SPC */}
                    {currentStepDef.key === "iqc" && sc.key === "dimension" && (
                      <Link href="/erp/wms/spc-shaft" className="inline-block mt-2 text-xs text-cyan-700 hover:underline">
                        🎯 軸心類零件 → 開啟 SPEC + SPC 量測（自動連動 P03SG007）
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: 檢核員 */}
            {currentStepDef.key === "scan" && !rec.inspector.trim() && (
              <div className="mt-3 bg-white rounded-lg border border-amber-300 p-3">
                <label className="block">
                  <span className="text-xs text-slate-500 font-bold">⚠ 請先填檢核員姓名（必填）</span>
                  <input value={rec.inspector}
                    onChange={(e) => setRec((p) => ({ ...p, inspector: e.target.value }))}
                    placeholder="例：倉管小張"
                    className="mt-1 w-full max-w-xs px-3 py-2 border border-slate-300 rounded text-sm" />
                </label>
              </div>
            )}

            {/* Step 3: 量測重量輸入 */}
            {currentStepDef.key === "weight" && (
              <div className="mt-3 bg-white rounded-lg border border-slate-200 p-3 flex items-end gap-2 flex-wrap">
                <label className="block">
                  <span className="text-xs text-slate-500">實秤重量 (kg)</span>
                  <input type="number" step="0.01" value={rec.measuredWeight ?? ""}
                    onChange={(e) => setRec((p) => ({ ...p, measuredWeight: parseFloat(e.target.value) || undefined }))}
                    disabled={!!rec.putawayAt}
                    className="mt-1 px-3 py-1.5 border border-slate-300 rounded text-sm tabular-nums font-bold" />
                </label>
                <div className="text-xs">
                  <div className="text-slate-500">ASN 申報 {rec.asnPreArrival.shipWeight} kg</div>
                  {rec.measuredWeight != null && rec.asnPreArrival.shipWeight > 0 && (() => {
                    const diff = ((rec.measuredWeight - rec.asnPreArrival.shipWeight) / rec.asnPreArrival.shipWeight) * 100;
                    const ok = Math.abs(diff) <= 2;
                    return (
                      <div className={`font-bold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                        差異 {diff >= 0 ? "+" : ""}{diff.toFixed(2)}%　{ok ? "✓ 在 ±2% 內" : "✗ 超出容差"}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Step 5: 量測數量輸入 */}
            {currentStepDef.key === "qty" && (
              <div className="mt-3 bg-white rounded-lg border border-slate-200 p-3 flex items-end gap-2 flex-wrap">
                <label className="block">
                  <span className="text-xs text-slate-500">實點數量</span>
                  <input type="number" value={rec.measuredQty ?? ""}
                    onChange={(e) => setRec((p) => ({ ...p, measuredQty: parseInt(e.target.value) || undefined }))}
                    disabled={!!rec.putawayAt}
                    className="mt-1 px-3 py-1.5 border border-slate-300 rounded text-sm tabular-nums font-bold" />
                </label>
                <div className="text-xs">
                  <div className="text-slate-500">PO 數量 {po.qty} {po.unit}</div>
                  {rec.measuredQty != null && (() => {
                    const ok = rec.measuredQty === po.qty;
                    return (
                      <div className={`font-bold ${ok ? "text-emerald-600" : "text-rose-600"}`}>
                        {ok ? `✓ 與 PO 一致` : `✗ 差異 ${rec.measuredQty - po.qty}`}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* 失敗連鎖動作（持續顯示） */}
      {rec.verdict === "FAIL_HOLD" && (
        <section className="rounded-xl border-2 border-rose-500 bg-rose-50 p-5">
          <div className="font-bold text-rose-900 text-lg mb-2">🚨 系統判定 FAIL → HOLD：以下動作已自動觸發</div>
          <ul className="space-y-1">
            {rec.failedActions.map((a, i) => (
              <li key={i} className="text-sm text-slate-800">{a}</li>
            ))}
          </ul>
          <div className="mt-3 text-[11px] text-slate-600">
            本批料件已鎖定，不可入庫、不可上架、不可消耗、不可在鼎新扣帳。請進
            <Link href="/erp/decisions" className="text-cyan-700 underline mx-1">決策閉環中心</Link>
            處理（退貨 / 折讓 / 部分接受 / 換批）。
          </div>
        </section>
      )}
    </div>
  );
}

function VerdictPanel({ rec, location, setLocation, onPutaway }: { rec: ReceivingRecord; location: string; setLocation: (v: string) => void; onPutaway: () => void }) {
  if (rec.verdict === "PASS") {
    if (rec.putawayAt) {
      return (
        <div className="bg-emerald-50 border border-emerald-400 rounded-lg p-4">
          <div className="font-bold text-emerald-900 text-lg">✅ 已入庫</div>
          <div className="text-sm text-slate-700 mt-1">
            時間：{new Date(rec.putawayAt).toLocaleString("zh-TW", { hour12: false })}<br />
            儲位：<b>{rec.putawayLocation}</b><br />
            檢核員：{rec.inspector}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            ✓ 已自動同步至 WMS 庫存 / Supplier Digital Twin（arrived 階段）/ 鼎新可扣帳。
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white border-2 border-emerald-400 rounded-lg p-4">
        <div className="font-bold text-emerald-900 text-lg mb-3">🟢 系統判定 PASS — 可入庫</div>
        <div className="flex gap-2 items-end flex-wrap">
          <label className="block">
            <span className="text-xs text-slate-500">入庫儲位（必填）</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例：A-12-03"
              className="mt-1 px-3 py-2 border border-slate-300 rounded text-sm font-mono" />
          </label>
          <button onClick={onPutaway} disabled={!location.trim()}
            className={`px-5 py-2.5 rounded font-bold text-sm ${
              location.trim() ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}>
            ✅ 確認入庫
          </button>
        </div>
      </div>
    );
  }
  if (rec.verdict === "FAIL_HOLD") {
    return (
      <div className="bg-rose-50 border-2 border-rose-500 rounded-lg p-4">
        <div className="font-bold text-rose-900 text-lg mb-2">🔴 系統判定 FAIL → 全面 HOLD</div>
        <div className="text-sm text-slate-700">
          至少有一個步驟失敗，依風險控管規則本批一律進入 HOLD 狀態。
          請看下方「失敗連鎖動作」清單。
        </div>
      </div>
    );
  }
  return (
    <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 text-center">
      <div className="text-slate-500 text-sm">前 6 步全部通過後，系統會自動判定</div>
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
