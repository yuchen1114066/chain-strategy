"use client";

import { useState, useMemo } from "react";
import {
  initialSlips,
  SP_FOR_TASK,
  TASK_META,
  classifyBarcode,
  type Slip,
  type SlipItem,
  type SlipType,
  type ScanEvent,
  type SyncMode,
} from "@/lib/erp/warehouse";

type View = "tasks" | "detail" | "scan";

export default function MobileWarehousePage() {
  const [slips, setSlips] = useState<Slip[]>(initialSlips);
  const [tab, setTab] = useState<SlipType>("picking");
  const [view, setView] = useState<View>("tasks");
  const [activeSlipNo, setActiveSlipNo] = useState<string | null>(null);
  const [scanItem, setScanItem] = useState<SlipItem | null>(null);
  const [qtyInput, setQtyInput] = useState<string>("");
  const [events, setEvents] = useState<ScanEvent[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode>("batch");
  const [operator] = useState("林倉管");
  const [flash, setFlash] = useState<string | null>(null);

  const activeSlip = slips.find((s) => s.no === activeSlipNo);
  const slipsOfTab = slips.filter((s) => s.type === tab);
  const pendingSyncCount = events.filter((e) => e.syncStatus === "pending").length;

  // ── 動作 ──────────────────────────────────────────
  function openSlip(no: string) {
    setActiveSlipNo(no);
    setView("detail");
    // 開單即視為 in_progress
    setSlips((prev) =>
      prev.map((s) => (s.no === no && s.status === "pending" ? { ...s, status: "in_progress" } : s))
    );
  }

  function startScan(item: SlipItem) {
    setScanItem(item);
    setQtyInput(String(item.qtyPlanned - item.qtyScanned));
    setView("scan");
  }

  function confirmScan() {
    if (!scanItem || !activeSlip) return;
    const qty = parseInt(qtyInput) || 0;
    if (qty <= 0) {
      setFlash("⚠️ 數量必須 > 0");
      setTimeout(() => setFlash(null), 1500);
      return;
    }
    // 更新單據
    setSlips((prev) =>
      prev.map((s) => {
        if (s.no !== activeSlip.no) return s;
        return {
          ...s,
          items: s.items.map((it) =>
            it.partCode === scanItem.partCode
              ? { ...it, qtyScanned: Math.min(it.qtyPlanned, it.qtyScanned + qty) }
              : it
          ),
        };
      })
    );
    // 寫入事件佇列
    const ev: ScanEvent = {
      id: `EV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toISOString(),
      slipNo: activeSlip.no,
      partCode: scanItem.partCode,
      partName: scanItem.partName,
      qty,
      location: scanItem.location,
      operator,
      taskType: activeSlip.type,
      syncStatus: syncMode === "realtime" ? "synced" : "pending",
      spName: SP_FOR_TASK[activeSlip.type],
    };
    setEvents((prev) => [ev, ...prev]);
    setFlash(`✅ ${scanItem.partCode} × ${qty} 已記錄`);
    setTimeout(() => setFlash(null), 1200);
    setView("detail");
    setScanItem(null);
  }

  function completeSlip() {
    if (!activeSlip) return;
    setSlips((prev) =>
      prev.map((s) => (s.no === activeSlip.no ? { ...s, status: "done" } : s))
    );
    setView("tasks");
    setActiveSlipNo(null);
    setFlash(`✓ ${activeSlip.no} 已完成，${syncMode === "batch" ? "待批次回寫" : "已即時回寫"}鼎新`);
    setTimeout(() => setFlash(null), 2000);
  }

  function batchSync() {
    setEvents((prev) => prev.map((e) => (e.syncStatus === "pending" ? { ...e, syncStatus: "synced" } : e)));
    setSlips((prev) => prev.map((s) => (s.status === "done" ? { ...s, status: "synced" } : s)));
    setFlash(`⇄ ${pendingSyncCount} 筆異動已回寫鼎新 INVMC`);
    setTimeout(() => setFlash(null), 2000);
  }

  // ── 介面 ──────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📱 行動倉儲</h1>
          <p className="text-sm text-slate-500 mt-1">
            PDA / 手機掃碼作業 — 4 種任務、QR 自動辨識、3 段同步模式、強制走鼎新 SP
          </p>
        </div>
        <div className="text-xs text-slate-500">
          作業人員：<b className="text-slate-900">{operator}</b>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ============ 左：手機螢幕模擬器 ============ */}
        <div className="flex justify-center">
          <PhoneShell>
            {/* 頂部狀態列（裝飾） */}
            <div className="bg-slate-900 text-white text-[10px] px-4 py-1 flex justify-between">
              <span>9:41</span>
              <span className="flex gap-1.5">📶 LTE 🔋 87%</span>
            </div>

            {/* App header */}
            <div className="bg-cyan-600 text-white px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] opacity-80">ChainOps 行動倉儲</div>
                <div className="text-sm font-bold">
                  {view === "tasks" && `${TASK_META[tab].icon} ${TASK_META[tab].label}作業`}
                  {view === "detail" && activeSlip && `📋 ${activeSlip.no}`}
                  {view === "scan" && "📷 掃描中"}
                </div>
              </div>
              {view !== "tasks" && (
                <button
                  onClick={() => (view === "scan" ? setView("detail") : setView("tasks"))}
                  className="text-[10px] bg-white/20 px-2 py-1 rounded"
                >
                  ← 返回
                </button>
              )}
            </div>

            {/* Body — 依 view 切換 */}
            <div className="flex-1 overflow-y-auto bg-slate-50 relative">
              {flash && (
                <div className="absolute top-2 inset-x-2 z-10 bg-slate-900 text-white text-xs px-3 py-2 rounded shadow-lg text-center">
                  {flash}
                </div>
              )}

              {view === "tasks" && (
                <TasksView
                  tab={tab}
                  slipsOfTab={slipsOfTab}
                  onOpen={openSlip}
                  events={events}
                  onBatchSync={batchSync}
                  pendingSyncCount={pendingSyncCount}
                />
              )}

              {view === "detail" && activeSlip && (
                <DetailView slip={activeSlip} onScan={startScan} onComplete={completeSlip} />
              )}

              {view === "scan" && scanItem && (
                <ScanView item={scanItem} qty={qtyInput} setQty={setQtyInput} onConfirm={confirmScan} />
              )}
            </div>

            {/* 底部 Tab Bar */}
            {view === "tasks" && (
              <div className="bg-white border-t border-slate-200 grid grid-cols-4">
                {(["receiving", "picking", "count", "production"] as SlipType[]).map((t) => {
                  const meta = TASK_META[t];
                  const active = tab === t;
                  const count = slips.filter((s) => s.type === t && (s.status === "pending" || s.status === "in_progress")).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`py-2 text-center transition-colors ${active ? "text-cyan-600" : "text-slate-500"}`}
                    >
                      <div className="text-lg leading-none">{meta.arrow}</div>
                      <div className="text-[10px] font-semibold mt-0.5">{meta.label}</div>
                      {count > 0 && (
                        <div className="text-[9px] mt-0.5">
                          <span className="px-1 py-0.5 rounded-full bg-rose-500 text-white">{count}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </PhoneShell>
        </div>

        {/* ============ 右：管理者後台 ============ */}
        <div className="space-y-4">
          {/* 同步模式 */}
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold mb-2">⇄ 同步模式</h3>
            <div className="grid grid-cols-3 gap-2">
              {(["realtime", "batch", "offline"] as SyncMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSyncMode(m)}
                  className={`text-xs px-2 py-2 rounded border transition-colors ${
                    syncMode === m
                      ? "bg-cyan-600 text-white border-cyan-600"
                      : "bg-white text-slate-700 border-slate-300 hover:border-cyan-400"
                  }`}
                >
                  <div className="font-bold">
                    {m === "realtime" ? "即時" : m === "batch" ? "批次" : "離線"}
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-90">
                    {m === "realtime" ? "30s 內寫" : m === "batch" ? "暫存待核可" : "IndexedDB"}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              所有 INVMC 異動<b>強制</b>走 <code className="font-mono bg-slate-100 px-1 rounded">{SP_FOR_TASK.receiving}</code>
              {" "}/{" "}<code className="font-mono bg-slate-100 px-1 rounded">{SP_FOR_TASK.picking}</code>
              {" "}/{" "}<code className="font-mono bg-slate-100 px-1 rounded">{SP_FOR_TASK.count}</code>，
              繞過 SP 直接 INSERT 會把鼎新庫存連動弄壞。
            </p>
          </section>

          {/* 待同步佇列 */}
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">📋 待同步佇列</h3>
              <button
                onClick={batchSync}
                disabled={pendingSyncCount === 0}
                className="text-xs px-3 py-1.5 rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                ⇄ 批次回寫鼎新（{pendingSyncCount}）
              </button>
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">尚無掃描紀錄 — 到左邊手機操作試試</p>
            ) : (
              <ul className="text-xs space-y-1 max-h-72 overflow-y-auto">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded border border-slate-100 hover:bg-slate-50"
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                        e.syncStatus === "synced" ? "bg-emerald-500" : e.syncStatus === "failed" ? "bg-rose-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{e.ts.slice(11, 19)}</span>
                    <span className="font-mono text-cyan-700 shrink-0">{e.slipNo}</span>
                    <span className="font-mono shrink-0">{e.partCode}</span>
                    <span className="tabular-nums font-semibold shrink-0">×{e.qty}</span>
                    <span className="text-slate-500 truncate">{e.partName}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      e.syncStatus === "synced" ? "bg-emerald-100 text-emerald-700" :
                      e.syncStatus === "failed" ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {e.syncStatus === "synced" ? "已同步" : e.syncStatus === "failed" ? "失敗" : "待同步"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* QR Code 規範速查 */}
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold mb-2">🔖 QR Code 編碼規範</h3>
            <ul className="text-xs space-y-1 text-slate-700">
              <li>· 領料單 <code className="font-mono bg-slate-100 px-1 rounded">5410-260507001</code></li>
              <li>· 收料單 <code className="font-mono bg-slate-100 px-1 rounded">5210-260507002</code></li>
              <li>· 製令 <code className="font-mono bg-slate-100 px-1 rounded">5110-260128006</code></li>
              <li>· 採購單 <code className="font-mono bg-slate-100 px-1 rounded">PO-2026-1021</code></li>
              <li>· 料件 <code className="font-mono bg-slate-100 px-1 rounded">P04AA10</code></li>
              <li>· 倉位 <code className="font-mono bg-slate-100 px-1 rounded">A100-B2-04</code></li>
            </ul>
            <p className="text-[11px] text-slate-500 mt-2">
              掃碼後依前綴自動跳對應作業頁。Demo 用模擬掃碼，正式版接 html5-qrcode / ZXing.js。
            </p>
          </section>

          {/* 提示 */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <b>試試流程：</b> 點手機底部 ↑「領料」分頁 → 點 <code className="font-mono">5410-260507001</code> →
            點任一料件「📷 掃描料件條碼」→ 確認數量 → 兩項都掃完後點「✓ 全部完成 · 回寫鼎新」。
          </section>
        </div>
      </div>
    </div>
  );
}

// =================== 手機外殼 ===================
function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[320px] h-[640px] bg-slate-900 rounded-[36px] p-2 shadow-2xl">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-2xl z-20" />
      <div className="w-full h-full rounded-[28px] overflow-hidden flex flex-col bg-white">
        {children}
      </div>
    </div>
  );
}

// =================== Tab：任務列表 ===================
function TasksView({
  tab,
  slipsOfTab,
  onOpen,
  events,
  onBatchSync,
  pendingSyncCount,
}: {
  tab: SlipType;
  slipsOfTab: Slip[];
  onOpen: (no: string) => void;
  events: ScanEvent[];
  onBatchSync: () => void;
  pendingSyncCount: number;
}) {
  // 同步 tab：直接顯示批次回寫
  if (tab === "production") {
    // production = 製令也算 picking 性質；此處先顯示製令清單
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span>共 {slipsOfTab.length} 張</span>
        {pendingSyncCount > 0 && (
          <button
            onClick={onBatchSync}
            className="text-cyan-600 font-semibold"
          >
            ⇄ 待同步 {pendingSyncCount}
          </button>
        )}
      </div>
      {slipsOfTab.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">此分頁無待辦單據</div>
      ) : (
        slipsOfTab.map((s) => {
          const total = s.items.reduce((a, b) => a + b.qtyPlanned, 0);
          const done = s.items.reduce((a, b) => a + b.qtyScanned, 0);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <button
              key={s.no}
              onClick={() => onOpen(s.no)}
              className="w-full text-left bg-white rounded-lg border border-slate-200 p-3 hover:border-cyan-400 active:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-cyan-700 font-semibold">{s.no}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {s.items.length} 項　·　{s.workOrderRef ?? s.createdAt}
                  </div>
                  {s.note && <div className="text-[10px] text-slate-500 mt-1 truncate">{s.note}</div>}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                  s.status === "synced" ? "bg-emerald-100 text-emerald-700" :
                  s.status === "done" ? "bg-cyan-100 text-cyan-700" :
                  s.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {s.status === "synced" ? "已同步" : s.status === "done" ? "完成" : s.status === "in_progress" ? "進行中" : "待辦"}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-[10px] text-slate-500 tabular-nums">{done}/{total}（{pct}%）</div>
            </button>
          );
        })
      )}

      {events.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1 px-1">今日掃描 {events.length} 筆</div>
        </div>
      )}
    </div>
  );
}

// =================== 單據明細 ===================
function DetailView({
  slip,
  onScan,
  onComplete,
}: {
  slip: Slip;
  onScan: (item: SlipItem) => void;
  onComplete: () => void;
}) {
  const allDone = slip.items.every((it) => it.qtyScanned >= it.qtyPlanned);
  return (
    <div className="p-3 space-y-2">
      <div className="bg-white rounded-lg border border-slate-200 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-cyan-700 font-bold text-sm">{slip.no}</span>
          <span className="text-slate-500">{TASK_META[slip.type].label}</span>
        </div>
        {slip.workOrderRef && (
          <div className="text-[11px] text-slate-600 mt-1">關聯工單 {slip.workOrderRef}</div>
        )}
        {slip.note && <div className="text-[11px] text-slate-500 mt-1">{slip.note}</div>}
      </div>

      {slip.items.map((it) => {
        const remain = it.qtyPlanned - it.qtyScanned;
        const done = remain <= 0;
        return (
          <div key={it.partCode} className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-mono text-xs text-slate-500">{it.partCode}</div>
                <div className="text-sm font-semibold">{it.partName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">📍 {it.location}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-500">已掃 / 應掃</div>
                <div className={`text-sm font-bold tabular-nums ${done ? "text-emerald-600" : "text-slate-900"}`}>
                  {it.qtyScanned} / {it.qtyPlanned}
                </div>
              </div>
            </div>
            {!done && (
              <button
                onClick={() => onScan(it)}
                className="mt-2 w-full py-2 rounded-md bg-cyan-600 text-white text-xs font-bold active:bg-cyan-700"
              >
                📷 掃描料件條碼（剩 {remain}）
              </button>
            )}
            {done && (
              <div className="mt-2 text-center text-[11px] text-emerald-700 font-semibold">✓ 此項完成</div>
            )}
          </div>
        );
      })}

      <button
        onClick={onComplete}
        disabled={!allDone}
        className={`w-full py-3 rounded-md text-sm font-bold mt-3 ${
          allDone
            ? "bg-emerald-600 text-white active:bg-emerald-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {allDone ? "✓ 全部完成 · 回寫鼎新" : `尚有 ${slip.items.filter((it) => it.qtyScanned < it.qtyPlanned).length} 項未掃完`}
      </button>
    </div>
  );
}

// =================== 掃描 / 數量輸入 ===================
function ScanView({
  item,
  qty,
  setQty,
  onConfirm,
}: {
  item: SlipItem;
  qty: string;
  setQty: (v: string) => void;
  onConfirm: () => void;
}) {
  const remain = item.qtyPlanned - item.qtyScanned;
  const inputQty = parseInt(qty) || 0;
  const tooMany = inputQty > remain;
  // 模擬辨識 barcode（顯示分類結果）
  const classified = useMemo(() => classifyBarcode(item.partCode), [item.partCode]);

  return (
    <div className="p-3 space-y-3">
      {/* 模擬相機畫面 */}
      <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-6 border-2 border-cyan-400 rounded-lg" />
        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-cyan-400/60 animate-pulse" />
        <div className="text-cyan-400 text-xs font-mono z-10">📷 模擬掃描中...</div>
        <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-slate-400">
          正式版接 html5-qrcode / ZXing.js
        </div>
      </div>

      {/* 辨識結果 */}
      <div className="bg-white rounded-lg border border-cyan-300 p-3 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-semibold">
            {classified.kind === "part" ? "料件" : classified.kind}
          </span>
          <span className="font-mono text-sm font-bold">{item.partCode}</span>
        </div>
        <div className="text-sm">{item.partName}</div>
        <div className="text-[11px] text-slate-500">📍 {item.location}　·　剩 {remain}</div>
      </div>

      {/* 數量輸入 */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <label className="block text-xs text-slate-600 mb-1">本次掃入數量</label>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full text-2xl font-bold tabular-nums text-center border-2 border-cyan-300 rounded-md py-2 focus:outline-none focus:border-cyan-500"
        />
        {tooMany && (
          <p className="text-[10px] text-rose-600 mt-1">超過剩餘 {remain}，已自動截斷</p>
        )}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[1, 5, 10, remain].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => (
            <button
              key={v}
              onClick={() => setQty(String(v))}
              className="text-xs py-1.5 rounded bg-slate-100 hover:bg-slate-200"
            >
              {v === remain ? `全收${v}` : v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={inputQty <= 0}
        className={`w-full py-3 rounded-md text-sm font-bold ${
          inputQty > 0
            ? "bg-cyan-600 text-white active:bg-cyan-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        ✓ 確認並記錄
      </button>
    </div>
  );
}
