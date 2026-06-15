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

// ============================================================
// Supply Chain Data Mart · 4 張 Fact 表 schema
// ============================================================
const FACT_TABLES = [
  {
    name: "fact_shortage",
    zh: "缺料事實",
    purpose: "每日缺料快照（給 L1 / L2 / L3 / L4 共用）",
    usedBy: ["L1", "L2", "L4"],
    fields: [
      { col: "date",              type: "DATE",       note: "快照日" },
      { col: "part_no",           type: "VARCHAR(20)",note: "料號" },
      { col: "part_name",         type: "VARCHAR(80)",note: "品名" },
      { col: "stock_qty",         type: "INT",        note: "現庫存" },
      { col: "safety_stock",      type: "INT",        note: "安全存量" },
      { col: "forecast_balance",  type: "INT",        note: "預計結存" },
      { col: "shortage_qty",      type: "INT",        note: "缺料數量" },
      { col: "first_shortage_dt", type: "DATE",       note: "首次缺料日" },
      { col: "critical_level",    type: "TINYINT",    note: "1=低 2=中 3=高" },
      { col: "supplier",          type: "VARCHAR(40)",note: "供應商" },
      { col: "buyer",             type: "VARCHAR(20)",note: "採購承辦" },
    ],
  },
  {
    name: "fact_inventory",
    zh: "庫存事實",
    purpose: "即時庫存快照（給 L1 / L2 共用）",
    usedBy: ["L1", "L2"],
    fields: [
      { col: "date",              type: "DATE",       note: "快照日" },
      { col: "part_no",           type: "VARCHAR(20)",note: "料號" },
      { col: "warehouse_code",    type: "VARCHAR(10)",note: "庫別" },
      { col: "on_hand",           type: "INT",        note: "現有量" },
      { col: "available",         type: "INT",        note: "可用量" },
      { col: "in_transit",        type: "INT",        note: "在途" },
      { col: "reserved",          type: "INT",        note: "已預留" },
      { col: "value_ntd",         type: "DECIMAL",    note: "庫存價值" },
    ],
  },
  {
    name: "fact_supply_plan",
    zh: "供應計劃",
    purpose: "未來進 / 領計劃（給 L2 / L3 / L4 共用）",
    usedBy: ["L2", "L3", "L4"],
    fields: [
      { col: "date",              type: "DATE",       note: "預定日" },
      { col: "part_no",           type: "VARCHAR(20)",note: "料號" },
      { col: "movement_type",     type: "VARCHAR(10)",note: "進貨/領用/生產" },
      { col: "qty",               type: "INT",        note: "數量" },
      { col: "po_no",             type: "VARCHAR(20)",note: "PO 編號" },
      { col: "supplier",          type: "VARCHAR(40)",note: "供應商" },
      { col: "lead_days",         type: "INT",        note: "前置天數" },
      { col: "risk_flag",         type: "TINYINT",    note: "風險旗標" },
    ],
  },
  {
    name: "fact_supplier_delivery",
    zh: "供應商交期",
    purpose: "供應商歷史交期表現（給 L3 / L4 / L5 共用）",
    usedBy: ["L3", "L4", "L5"],
    fields: [
      { col: "month",             type: "DATE",       note: "結算月" },
      { col: "supplier",          type: "VARCHAR(40)",note: "供應商" },
      { col: "part_no",           type: "VARCHAR(20)",note: "料號" },
      { col: "promised_lead",     type: "INT",        note: "承諾交期" },
      { col: "actual_lead",       type: "INT",        note: "實際交期" },
      { col: "otd_rate",          type: "DECIMAL",    note: "準時率" },
      { col: "defect_rate",       type: "DECIMAL",    note: "不良率" },
      { col: "risk_score",        type: "TINYINT",    note: "風險分 0-100" },
    ],
  },
];

const LAYER_USAGE = [
  { layer: "L1",  title: "Executive · 戰情",   tone: SC.primary,
    usage: ["5 分鐘看完缺料", "公司總缺料金額", "Top 3 影響毛利的料號"],
    tablesUsed: ["fact_shortage", "fact_inventory"] },
  { layer: "L2",  title: "Operations · 工單",  tone: SC.blue,
    usage: ["工單卡關紅標", "缺料件數預警", "預計轉負警報"],
    tablesUsed: ["fact_shortage", "fact_supply_plan"] },
  { layer: "L3",  title: "Procurement · 採購", tone: SC.emerald,
    usage: ["供應商選擇", "RFQ 自動發出", "缺料優先補單"],
    tablesUsed: ["fact_supply_plan", "fact_supplier_delivery"] },
  { layer: "L4",  title: "AI Engine · 決策",   tone: SC.amber,
    usage: ["LRPR05 缺料預測", "規模預測模型", "Lead Time 驗證"],
    tablesUsed: ["fact_shortage", "fact_supply_plan", "fact_supplier_delivery"] },
  { layer: "L5",  title: "Market · 全球情報",  tone: SC.red,
    usage: ["銅價 ↔ 缺料連動", "供應壓力測試", "LME / MRP 缺貨關聯"],
    tablesUsed: ["fact_supplier_delivery"] },
];

// 缺料損失分析 — 從 LRPR05 自動推算的「公司損失」
const SHORTAGE_LOSS = [
  { code: "M06BA05", name: "凡立水", spec: "TCV-225",
    shortageDays: 11, affectedProducts: ["TC1-13 系列", "A201 風扇"], customerCount: 5,
    affectedMonthlyQty: 8_300, monthlyLoss: 1_200_000,
    action: { label: "P1 · 緊急補料", tone: SC.red } },
  { code: "P52A1020022", name: "碳膜電阻", spec: "1K 1/4W 5%",
    shortageDays: 7, affectedProducts: ["FB64 PCB"], customerCount: 3,
    affectedMonthlyQty: 5_000, monthlyLoss: 420_000,
    action: { label: "P1 · 啟用備案", tone: SC.red } },
  { code: "P13AA21", name: "滾珠軸承", spec: "SKF 6003 ZZ CN",
    shortageDays: 14, affectedProducts: ["跑步機 Pro"], customerCount: 2,
    affectedMonthlyQty: 1_500, monthlyLoss: 380_000,
    action: { label: "P1 · 切換供應商", tone: SC.red } },
  { code: "P56D012", name: "二極體", spec: "1N5408",
    shortageDays: 4, affectedProducts: ["FB42 Console"], customerCount: 2,
    affectedMonthlyQty: 3_200, monthlyLoss: 180_000,
    action: { label: "P2 · 加單", tone: SC.amber } },
  { code: "P5305104F51", name: "陶瓷電容", spec: "100nF 50V",
    shortageDays: 3, affectedProducts: ["FB64 Console"], customerCount: 2,
    affectedMonthlyQty: 6_000, monthlyLoss: 150_000,
    action: { label: "P2 · 拆單", tone: SC.amber } },
];

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

        {/* ──────────────────────────────────────────────────────────────────
            真正的價值不是再加一個網頁 — 是把這份報表變成 Supply Chain Data Mart
            ────────────────────────────────────────────────────────────────── */}

        {/* ④ Supply Chain Data Mart · 資料倉儲架構 */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                  style={{ background: SC.primary, letterSpacing: "0.12em" }}>④ ARCHITECTURE</span>
            <h2 className="text-base font-semibold">Supply Chain Data Mart · 資料倉儲架構</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>
              不用再加網頁 — 把 LRPR05 變成所有 AI 模組共用的 fact 表
            </span>
          </div>

          <div className="text-xs leading-relaxed mb-4" style={{ color: SC.text }}>
            這份報表如果只「看一次」，價值就到此為止。世界級做法是把它沉澱成
            <b className="mx-1" style={{ color: SC.primary }}>Supply Chain Data Mart</b>
            的一張事實表，讓 L1–L5 五個層級全部共用同一份資料 — 不再各自跑 ETL，避免供應商
            vs 採購的對帳爭議。
          </div>

          {/* 架構圖 — ASCII flow */}
          <div className="rounded-md p-4 font-mono text-[11px] leading-relaxed"
               style={{ background: SC.surfaceDeep, color: SC.textInverse, border: `1px solid ${SC.border}` }}>
            <div style={{ color: "#a8a4a4" }}>// 資料流程</div>
            <div className="mt-1.5">
              <span style={{ color: SC.blueFixed }}>ERP</span>
              <span style={{ color: "#a8a4a4" }}> ──▶ </span>
              <span style={{ color: SC.primaryFixed }}>鼎新 iGP（read-only）</span>
              <span style={{ color: "#a8a4a4" }}> ──▶ </span>
              <span style={{ color: SC.emeraldLight }}>5 張原始報表</span>
            </div>
            <div className="pl-12 mt-1" style={{ color: "#8a7176" }}>
              ├─ <span style={{ color: "#fff" }}>LRPR05</span>　供需明細（本表）<br/>
              ├─ MRP　　　 物料需求計算<br/>
              ├─ 採購明細　PO / 進貨<br/>
              ├─ 物流追蹤　ASN / 海運狀態<br/>
              └─ 庫存盤點　即時庫存
            </div>
            <div className="mt-3">
              <span style={{ color: "#a8a4a4" }}>　　　　　　　　　　　　　　　│</span>
            </div>
            <div>
              <span style={{ color: "#a8a4a4" }}>　　　　　　　　　　　　　　　▼</span>
            </div>
            <div className="mt-1 pl-6">
              <span style={{ color: SC.primaryLight }}>SUPPLY CHAIN DATA MART</span>
              <span style={{ color: "#a8a4a4" }}>（每晚 ETL · 唯讀）</span>
            </div>
            <div className="pl-12 mt-1" style={{ color: "#8a7176" }}>
              ├─ <span style={{ color: SC.amber }}>fact_shortage</span>　　　 缺料事實<br/>
              ├─ <span style={{ color: SC.amber }}>fact_inventory</span>　　 庫存事實<br/>
              ├─ <span style={{ color: SC.amber }}>fact_supply_plan</span>　 供應計劃<br/>
              └─ <span style={{ color: SC.amber }}>fact_supplier_delivery</span>　供應商交期
            </div>
            <div className="mt-3">
              <span style={{ color: "#a8a4a4" }}>　　　　　　　　　　　　　　　│</span>
            </div>
            <div>
              <span style={{ color: "#a8a4a4" }}>　　　　　　　　　　　　　　　▼</span>
            </div>
            <div className="mt-1 pl-6">
              <span style={{ color: SC.emeraldLight }}>L1–L5 共用同一份資料</span>
            </div>
            <div className="pl-12 mt-1" style={{ color: "#a8a4a4" }}>
              L1 Executive　·　L2 Operations　·　L3 Procurement　·　L4 AI Engine　·　L5 Market
            </div>
          </div>

          <div className="mt-3 grid sm:grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-md p-3" style={{ background: SC.surfaceDim }}>
              <div className="font-bold mb-1" style={{ color: SC.red }}>❌ 沒有 Data Mart 時</div>
              <div style={{ color: SC.textSub }}>
                每個 L1–L5 各跑各的 ETL，供應商說 A 數字、採購說 B 數字、業務說 C 數字 — 開會花一半時間對帳。
              </div>
            </div>
            <div className="rounded-md p-3" style={{ background: `${SC.emerald}10` }}>
              <div className="font-bold mb-1" style={{ color: SC.emerald }}>✓ 有 Data Mart 後</div>
              <div style={{ color: SC.textSub }}>
                所有人看同一張 <span className="font-mono">fact_shortage</span>，業務 / 採購 / 生管 / CEO 數字一致，會議直接討論決策。
              </div>
            </div>
          </div>
        </Card>

        {/* ⑤ 4 張 Fact 表 Schema */}
        <Card accent={SC.amber}>
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                  style={{ background: SC.amber, letterSpacing: "0.12em" }}>⑤ DATA MART</span>
            <h2 className="text-base font-semibold">4 張 Fact 表 · 各 AI 模組直接用</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>SQL schema 已定義 — 不需開發新頁面</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {FACT_TABLES.map((t) => (
              <div key={t.name} className="rounded-md border p-3" style={{ borderColor: SC.border, background: SC.surface }}>
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>SQL</span>
                    <span className="font-mono text-sm font-bold">{t.name}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: SC.textSub }}>{t.zh}</span>
                </div>
                <div className="font-mono text-[10.5px]" style={{ color: SC.text, background: SC.surfaceDim, padding: 10, borderRadius: 6 }}>
                  <div style={{ color: SC.textSub }}>// {t.purpose}</div>
                  {t.fields.map((f) => (
                    <div key={f.col}>
                      <span style={{ color: SC.blue }}>  {f.col.padEnd(22)}</span>
                      <span style={{ color: SC.textSub }}>{f.type.padEnd(14)}</span>
                      <span style={{ color: SC.textSub }}>-- {f.note}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] flex items-baseline justify-between" style={{ color: SC.textSub }}>
                  <span>給 <b style={{ color: SC.primary }}>{t.usedBy.join(" · ")}</b> 用</span>
                  <span className="font-mono">每晚 02:00 ETL</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ⑥ 五層共用 — 每個層級從 Data Mart 取什麼 */}
        <Card accent={SC.blue}>
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                  style={{ background: SC.blue, letterSpacing: "0.12em" }}>⑥ CONSUMERS</span>
            <h2 className="text-base font-semibold">五層 AI 模組怎麼用這份 Data Mart</h2>
          </div>
          <div className="grid md:grid-cols-5 gap-2">
            {LAYER_USAGE.map((L) => (
              <div key={L.layer} className="rounded-md border p-3" style={{ borderColor: SC.border, background: SC.surface }}>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: L.tone, letterSpacing: "0.12em" }}>
                  {L.layer}
                </div>
                <div className="text-xs font-semibold mt-1">{L.title}</div>
                <ul className="text-[10px] mt-2 space-y-1" style={{ color: SC.textSub }}>
                  {L.usage.map((u, i) => <li key={i}>· {u}</li>)}
                </ul>
                <div className="mt-2 pt-2 border-t font-mono text-[9px]"
                     style={{ borderColor: SC.border, color: SC.blue }}>
                  ← {L.tablesUsed.join(" + ")}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ⑦ 缺料損失分析 — CEO 一秒看到「公司損失多少」*/}
        <Card accent={SC.red}>
          <div className="flex items-baseline gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded text-white"
                  style={{ background: SC.red, letterSpacing: "0.12em" }}>⑦ LOSS IMPACT</span>
            <h2 className="text-base font-semibold">缺料損失分析 · CEO 一秒看到</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>
              CEO 不在意缺幾顆 — CEO 在意「公司損失多少」
            </span>
            <span className="ml-auto text-[11px] font-mono font-bold" style={{ color: SC.red }}>
              月損失合計 NT$ {SHORTAGE_LOSS.reduce((s, x) => s + x.monthlyLoss, 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: SC.border, color: SC.textSub }}>
                  <Th>料號</Th>
                  <Th>品名</Th>
                  <Th right>缺料天數</Th>
                  <Th>影響產品 / 客戶</Th>
                  <Th right>影響月用量</Th>
                  <Th right>月損失</Th>
                  <Th>建議</Th>
                </tr>
              </thead>
              <tbody>
                {SHORTAGE_LOSS.map((s) => (
                  <tr key={s.code} className="border-b" style={{ borderColor: SC.border }}>
                    <Td mono><span style={{ color: SC.primary }}>{s.code}</span></Td>
                    <Td>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[10px]" style={{ color: SC.textSub }}>{s.spec}</div>
                    </Td>
                    <Td right>
                      <span className="font-mono font-bold" style={{ color: s.shortageDays >= 10 ? SC.red : s.shortageDays >= 5 ? SC.amber : SC.text }}>
                        {s.shortageDays} 天
                      </span>
                    </Td>
                    <Td>
                      <div className="text-[11px]">{s.affectedProducts.join(" · ")}</div>
                      <div className="text-[10px]" style={{ color: SC.textSub }}>{s.customerCount} 家客戶受影響</div>
                    </Td>
                    <Td right mono>{s.affectedMonthlyQty.toLocaleString()}</Td>
                    <Td right>
                      <span className="font-mono font-extrabold" style={{ color: SC.red }}>
                        NT$ {s.monthlyLoss.toLocaleString()}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded text-white"
                            style={{ background: s.action.tone }}>
                        {s.action.label}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: SC.surfaceDim }}>
                  <td className="py-2 px-2 font-bold" colSpan={5}>合計（前 5 項缺料的月損失）</td>
                  <td className="py-2 px-2 text-right font-mono font-extrabold" style={{ color: SC.red }}>
                    NT$ {SHORTAGE_LOSS.reduce((s, x) => s + x.monthlyLoss, 0).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 rounded-md p-3 text-xs" style={{ background: SC.surfaceDeep, color: SC.textInverse }}>
            <span className="font-mono text-[10px]" style={{ color: "#9aa78d", letterSpacing: "0.1em" }}>BOARD-LEVEL VERDICT</span><br/>
            <b className="text-sm">缺料正在以每月 NT$ {SHORTAGE_LOSS.reduce((s, x) => s + x.monthlyLoss, 0).toLocaleString()} 的速度燒掉公司毛利。</b><br/>
            <span style={{ color: "#cdd6c2" }} className="text-[11px]">
              這個數字直接從 <span className="font-mono" style={{ color: SC.amber }}>fact_shortage</span> ×
              <span className="font-mono" style={{ color: SC.amber }}> fact_inventory</span>
              即時算出，不再需要採購、業務、CEO 三方對帳。
            </span>
          </div>
        </Card>

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
