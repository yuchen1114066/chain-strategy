"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";
import { LRPR05_DATA, LRPR05_META, type LrprItem, type LrprMovement } from "@/lib/erp/lrpr05";

// ============================================================
// LRPR05 · 品號供需明細表
// 鼎新 ERP 唯讀快照 — 對應 工作代號 20260605000193
// ============================================================

const MVMT_TONE: Record<string, string> = {
  "計劃進貨": SC.emerald,
  "預計進貨": SC.emeraldLight,
  "計劃生產": SC.blue,
  "預計生產": SC.blueLight,
  "計劃領用": SC.amber,
  "預計領用": "#f59e0b",
  "計劃銷售": SC.primary,
  "預計銷售": SC.primaryLight,
};

type RiskRow = {
  item: LrprItem;
  minBal: number;
  firstNeg: string | null;
  warns: number;
  netIn: number;
  netOut: number;
};

function buildRisk(items: LrprItem[]): RiskRow[] {
  return items.map((item) => {
    let minBal = item.onhand;
    let firstNeg: string | null = null;
    let warns = 0;
    let netIn = 0, netOut = 0;
    for (const m of item.movements) {
      if (m.bal < minBal) minBal = m.bal;
      if (firstNeg === null && m.bal < 0) firstNeg = m.date;
      if (m.warn) warns += 1;
      if (m.type.includes("進貨") || m.type.includes("生產")) netIn += m.qty;
      else if (m.type.includes("領用") || m.type.includes("銷售")) netOut += m.qty;
    }
    return { item, minBal, firstNeg, warns, netIn, netOut };
  });
}

export default function Lrpr05ReportPage() {
  const allRisk = useMemo(() => buildRisk(LRPR05_DATA), []);
  const negRisk = useMemo(
    () => allRisk.filter((r) => r.minBal < 0).sort((a, b) => a.minBal - b.minBal),
    [allRisk]
  );
  const warnOnly = useMemo(
    () => allRisk.filter((r) => r.minBal >= 0 && r.warns > 0).sort((a, b) => b.warns - a.warns),
    [allRisk]
  );

  const totalItems = LRPR05_DATA.length;
  const totalMovs = LRPR05_DATA.reduce((s, i) => s + i.movements.length, 0);
  const plannedIn = LRPR05_DATA.reduce(
    (s, i) => s + i.movements.filter((m) => m.type === "計劃進貨").length, 0);
  const plannedOut = LRPR05_DATA.reduce(
    (s, i) => s + i.movements.filter((m) => m.type === "計劃領用").length, 0);

  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>(negRisk[0]?.item.code ?? LRPR05_DATA[0].code);
  const selected = LRPR05_DATA.find((x) => x.code === selectedCode) ?? LRPR05_DATA[0];

  const filteredItems = useMemo(() => {
    if (!query.trim()) return LRPR05_DATA.slice(0, 200);
    const q = query.toLowerCase();
    return LRPR05_DATA.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.spec.toLowerCase().includes(q)
    ).slice(0, 200);
  }, [query]);

  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        {/* Header — 對照鼎新「關於目前的報表」面板 */}
        <header className="space-y-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>
              ERP REPORT · {LRPR05_META.reportCode}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold mt-1">{LRPR05_META.reportName}</h1>
            <p className="text-sm mt-1" style={{ color: SC.textSub }}>
              鼎新 iGP 唯讀快照 · 依 安全存量 與 預計結存 自動標示缺料
            </p>
          </div>

          {/* 關於目前的報表 — 重現鼎新介面表頭 */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <MiniLabel>關於目前的報表</MiniLabel>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.emerald }}>
                READ-ONLY · 唯讀
              </span>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
              <Field k="使用者代號"    v={LRPR05_META.userCode} />
              <Field k="公司全名"      v={LRPR05_META.company} />
              <Field k="工作代號"      v={LRPR05_META.workCode} mono />
              <Field k="子工作代號"    v={LRPR05_META.subWorkCode} mono />
              <Field k="報表作業代號"  v={LRPR05_META.reportCode} mono />
              <Field k="報表作業名稱"  v={LRPR05_META.reportName} />
              <Field k="資料型態"      v={`欄位數固定為 ${LRPR05_META.fieldCount} 個欄位`} />
              <Field k="快照時間"      v={LRPR05_META.snapshotAt} mono />
            </div>
          </Card>
        </header>

        {/* KPI Summary */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="料號總數"        value={totalItems}    sub={`${totalMovs} 筆異動`} tone={SC.blue} />
          <KPI label="缺料料號"        value={negRisk.length} sub="預計結存將轉負" tone={SC.red} />
          <KPI label="安全存量警告"    value={warnOnly.length} sub="未轉負但低於安全" tone={SC.amber} />
          <KPI label="計劃進 / 領 單數" value={`${plannedIn} / ${plannedOut}`} sub="未來排程" tone={SC.emerald} />
        </div>

        {/* AI 缺料排序 */}
        <Card accent={SC.red}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                    style={{ background: SC.red, letterSpacing: "0.12em" }}>① CRITICAL</span>
              <h2 className="text-base font-semibold">缺料 Top — AI 依最低預計結存排序</h2>
            </div>
            <span className="text-[11px]" style={{ color: SC.textSub }}>共 {negRisk.length} 項預計轉負</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: SC.border, color: SC.textSub }}>
                  <Th>品號</Th><Th>品名</Th><Th right>現有</Th><Th right>最低預計</Th>
                  <Th>首次轉負</Th><Th right>警告筆數</Th><Th right>進 / 領</Th><Th />
                </tr>
              </thead>
              <tbody>
                {negRisk.slice(0, 15).map((r) => (
                  <tr key={r.item.code} className="border-b hover:bg-slate-50" style={{ borderColor: SC.border }}>
                    <Td mono><span style={{ color: SC.primary }}>{r.item.code}</span></Td>
                    <Td>
                      <div className="font-semibold">{r.item.name}</div>
                      <div className="text-[10px]" style={{ color: SC.textSub }}>{r.item.spec}</div>
                    </Td>
                    <Td right mono>{r.item.onhand.toLocaleString()}</Td>
                    <Td right mono><span className="font-extrabold" style={{ color: SC.red }}>{r.minBal.toLocaleString()}</span></Td>
                    <Td mono>{r.firstNeg ?? "—"}</Td>
                    <Td right>
                      {r.warns > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: SC.amber }}>
                          {r.warns}
                        </span>
                      )}
                    </Td>
                    <Td right mono>
                      <span style={{ color: SC.emerald }}>+{r.netIn.toLocaleString()}</span>
                      {" / "}
                      <span style={{ color: SC.amber }}>−{r.netOut.toLocaleString()}</span>
                    </Td>
                    <Td>
                      <button
                        onClick={() => setSelectedCode(r.item.code)}
                        className="text-[11px] font-semibold"
                        style={{ color: SC.blue }}
                      >
                        查看 →
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 互動明細：品號 → 時間軸 13 欄 */}
        <Card accent={SC.blue}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                    style={{ background: SC.blue, letterSpacing: "0.12em" }}>② DETAIL</span>
              <h2 className="text-base font-semibold">品號供需時間軸</h2>
            </div>
            <span className="text-[11px]" style={{ color: SC.textSub }}>對應 LRPR05 原報表 13 個欄位</span>
          </div>

          <div className="grid md:grid-cols-[280px,1fr] gap-4">
            {/* 左欄：品號清單 + 搜尋 */}
            <div className="space-y-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋品號 / 品名 / 規格"
                className="w-full px-3 py-2 text-xs rounded border outline-none focus:ring-2"
                style={{ borderColor: SC.border, background: SC.surface }}
              />
              <div className="text-[10px]" style={{ color: SC.textSub }}>
                {query ? `符合 ${filteredItems.length} 項` : `顯示前 200 / 共 ${totalItems} 項`}
              </div>
              <div className="max-h-[520px] overflow-y-auto border rounded" style={{ borderColor: SC.border }}>
                {filteredItems.map((it) => {
                  const risk = allRisk.find((r) => r.item.code === it.code);
                  const isNeg = risk && risk.minBal < 0;
                  const isWarn = !isNeg && risk && risk.warns > 0;
                  const active = it.code === selectedCode;
                  return (
                    <button
                      key={it.code}
                      onClick={() => setSelectedCode(it.code)}
                      className="w-full text-left px-3 py-2 border-b text-xs transition-colors"
                      style={{
                        borderColor: SC.border,
                        background: active ? "#fff5f8" : SC.surface,
                        borderLeft: active ? `3px solid ${SC.primary}` : "3px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {isNeg && <span className="w-1.5 h-1.5 rounded-full" style={{ background: SC.red }} />}
                        {isWarn && <span className="w-1.5 h-1.5 rounded-full" style={{ background: SC.amber }} />}
                        <span className="font-mono font-semibold" style={{ color: active ? SC.primary : SC.text }}>
                          {it.code}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5">{it.name}</div>
                      <div className="text-[10px] truncate" style={{ color: SC.textSub }}>{it.spec}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 右欄：選中品號明細 */}
            <div>
              <div className="rounded border p-3 mb-3" style={{ borderColor: SC.border, background: SC.surfaceDim }}>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>選定品號</div>
                    <div className="text-lg font-bold mt-0.5 font-mono">{selected.code}</div>
                    <div className="text-sm">{selected.name} <span className="text-[11px]" style={{ color: SC.textSub }}>· {selected.spec}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px]" style={{ color: SC.textSub }}>現有庫存（{selected.unit}）</div>
                    <div className="text-2xl font-extrabold tabular-nums" style={{ color: SC.blue }}>
                      {selected.onhand.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: SC.border, color: SC.textSub }}>
                      <Th>日期</Th>
                      <Th>異動別</Th>
                      <Th>庫別名稱</Th>
                      <Th right>異動數量</Th>
                      <Th right>預計結存</Th>
                      <Th>結存&lt;安全</Th>
                      <Th>備註</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.movements.map((m, i) => (
                      <Row m={m} key={i} />
                    ))}
                    {selected.movements.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center" style={{ color: SC.textSub }}>
                          此品號目前無未來異動排程。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>

        {/* 安全存量警告（未轉負） */}
        {warnOnly.length > 0 && (
          <Card accent={SC.amber}>
            <div className="flex items-baseline gap-2 mb-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                    style={{ background: SC.amber, letterSpacing: "0.12em" }}>③ WATCH</span>
              <h2 className="text-base font-semibold">安全存量警告（尚未轉負）</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {warnOnly.slice(0, 12).map((r) => (
                <button
                  key={r.item.code}
                  onClick={() => setSelectedCode(r.item.code)}
                  className="text-left rounded border p-2.5 hover:shadow-sm transition-shadow"
                  style={{ borderColor: SC.border, background: SC.surface }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-mono font-semibold" style={{ color: SC.amber }}>{r.item.code}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: SC.amber }}>{r.warns} 警告</span>
                  </div>
                  <div className="text-xs mt-1">{r.item.name}</div>
                  <div className="text-[10px] mt-0.5 flex justify-between" style={{ color: SC.textSub }}>
                    <span>現有 {r.item.onhand.toLocaleString()}</span>
                    <span>最低預計 {r.minBal.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between flex-wrap gap-2"
                style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · LRPR05 報表 · /erp/reports/lrpr05 · 對鼎新 iGP 唯讀</span>
          <Link href="/erp/requisition" style={{ color: SC.blue }} className="hover:underline">
            → 由缺料品號進入 Requisition Center
          </Link>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Field({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 border-b pb-1.5" style={{ borderColor: SC.border }}>
      <span className="w-24 shrink-0" style={{ color: SC.textSub }}>{k}</span>
      <span className={mono ? "font-mono font-semibold" : "font-semibold"}>{v}</span>
    </div>
  );
}

function KPI({ label, value, sub, tone }: { label: string; value: number | string; sub: string; tone: string }) {
  return (
    <Card accent={tone}>
      <MiniLabel>{label}</MiniLabel>
      <div className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: tone }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="text-[11px] mt-1" style={{ color: SC.textSub }}>{sub}</div>
    </Card>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={`py-2 px-2 text-[10px] font-bold uppercase tracking-widest ${right ? "text-right" : "text-left"}`}
        style={{ letterSpacing: "0.08em" }}>
      {children}
    </th>
  );
}

function Td({ children, right, mono }: { children?: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td className={`py-2 px-2 align-top ${right ? "text-right" : "text-left"} ${mono ? "font-mono" : ""}`}>
      {children}
    </td>
  );
}

function Row({ m }: { m: LrprMovement }) {
  const tone = MVMT_TONE[m.type] ?? SC.textSub;
  const isIn = m.type.includes("進貨") || m.type.includes("生產");
  return (
    <tr className="border-b" style={{ borderColor: SC.border, background: m.warn ? "#fff8e1" : "transparent" }}>
      <Td mono>{m.date}</Td>
      <Td>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap"
              style={{ background: tone }}>
          {m.type}
        </span>
      </Td>
      <Td><span className="text-[11px]">{m.wh}</span></Td>
      <Td right mono>
        <span style={{ color: isIn ? SC.emerald : SC.amber }}>
          {isIn ? "+" : "−"}{m.qty.toLocaleString()}
        </span>
      </Td>
      <Td right mono>
        <span className={m.bal < 0 ? "font-extrabold" : ""} style={{ color: m.bal < 0 ? SC.red : SC.text }}>
          {m.bal.toLocaleString()}
        </span>
      </Td>
      <Td>
        {m.warn && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: SC.amber }}>
            ⚠ 低安全
          </span>
        )}
      </Td>
      <Td><span className="text-[10px]" style={{ color: SC.textSub }}>{m.note}</span></Td>
    </tr>
  );
}
