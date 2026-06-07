import Link from "next/link";
import { computeNegotiation, type NegotiationStrategy } from "@/lib/erp/negotiation";
import { commodities } from "@/lib/erp/commodities";

// AI 議價引擎 — 世界級採購核心
//   negotiation_strategy(market_price, supplier_price, demand_level)
//   6 項 AI 分析：歷史成交價 / 國際行情 / 匯率 / 供應商毛利 / 市場缺料 / 競爭供應商

const COMMODITY_NAME: Record<string, string> = Object.fromEntries(
  commodities.map((c) => [c.code, c.name])
);

const STRATEGY_META: Record<NegotiationStrategy, { label: string; tone: string; badge: string }> = {
  "STRONG NEGOTIATION": { label: "強力議價", tone: "border-rose-300 bg-rose-50/50", badge: "bg-rose-600" },
  "LOCK SUPPLY": { label: "鎖定供應", tone: "border-amber-300 bg-amber-50/50", badge: "bg-amber-500" },
  "NORMAL NEGOTIATION": { label: "常規議價", tone: "border-slate-200 bg-white", badge: "bg-slate-400" },
};

export default function NegotiationPage() {
  const rows = computeNegotiation();
  const strong = rows.filter((r) => r.strategy === "STRONG NEGOTIATION");
  const lock = rows.filter((r) => r.strategy === "LOCK SUPPLY");
  const totalSaving = rows.reduce((s, r) => s + Math.max(0, r.potentialSaving), 0);
  // 匯率（demo）
  const usdTwd = 30.85;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🤝 AI 議價引擎</h1>
          <p className="text-sm text-slate-500 mt-1">
            世界級採購核心　·　歷史成交價 / 國際行情 / 匯率 / 供應商毛利 / 市場缺料 / 競爭供應商 六維分析
          </p>
        </div>
        <Link href="/erp/should-cost" className="px-4 py-2 text-sm rounded-md font-bold text-white shadow-md"
          style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}>
          💎 開啟 Should-Cost 拆解 →
        </Link>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="可議價料件" value={`${rows.length}`} sub="採購件" tone="cyan" />
        <Kpi label="🔴 強力議價" value={`${strong.length}`} sub="報價偏高 >5%" tone={strong.length > 0 ? "rose" : "emerald"} />
        <Kpi label="🟡 鎖定供應" value={`${lock.length}`} sub="高需求保供" tone="amber" />
        <Kpi label="議價總潛在效益" value={`$${(totalSaving / 10000).toFixed(0)}萬`} sub="議到市場價可省" tone="emerald" />
      </section>

      {/* 策略邏輯說明 */}
      <section className="bg-slate-900 text-slate-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">negotiation_strategy()</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="font-mono text-rose-400 font-bold">STRONG NEGOTIATION</div>
            <div className="text-xs text-slate-400 mt-1">可議空間 gap &gt; 5%　→　強力議價</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="font-mono text-amber-400 font-bold">LOCK SUPPLY</div>
            <div className="text-xs text-slate-400 mt-1">需求等級 = HIGH　→　優先鎖定供應</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="font-mono text-slate-300 font-bold">NORMAL NEGOTIATION</div>
            <div className="text-xs text-slate-400 mt-1">其餘　→　常規議價</div>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          gap = (供應商報價 − 市場參考價) / 市場參考價。市場參考價由「毛利估算超出合理水位 + 國際行情降幅」推算。
        </p>
      </section>

      {/* 議價清單 */}
      <section className="space-y-3">
        {rows.slice(0, 24).map((r) => {
          const meta = STRATEGY_META[r.strategy];
          return (
            <article key={r.part.id} className={`rounded-xl border-2 ${meta.tone} p-4`}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                {/* 料件 + 報價對比 */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{r.part.code}</span>
                    <span className="font-bold">{r.part.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${meta.badge}`}>{meta.label}</span>
                  </div>
                  <div className="flex items-end gap-4 mt-2">
                    <div>
                      <div className="text-[10px] text-slate-500">供應商報價</div>
                      <div className="text-xl font-bold tabular-nums">${r.supplierPrice.toLocaleString()}</div>
                    </div>
                    <div className="text-slate-300 text-lg">→</div>
                    <div>
                      <div className="text-[10px] text-slate-500">市場參考價</div>
                      <div className="text-xl font-bold tabular-nums text-emerald-600">${r.marketPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">可議空間</div>
                      <div className={`text-xl font-bold tabular-nums ${r.gapPct > 5 ? "text-rose-600" : "text-slate-600"}`}>
                        {r.gapPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
                {/* 潛在效益 */}
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">議到市場價可省</div>
                  <div className="text-2xl font-bold tabular-nums text-emerald-600">
                    ${r.potentialSaving.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500">供應商 {r.supplier?.name ?? "—"}</div>
                </div>
              </div>

              {/* 6 項 AI 分析 */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                <Analysis label="歷史成交價" value={`$${r.supplierPrice.toLocaleString()}`} hint="現行 PO" />
                <Analysis label="國際行情" value={r.commodity ? `${COMMODITY_NAME[r.commodity]} ${r.commodityDevPct > 0 ? "+" : ""}${r.commodityDevPct}%` : "—"} hint="LME 偏離均價" />
                <Analysis label="匯率" value={`USD/TWD ${usdTwd}`} hint="進口計價" />
                <Analysis label="供應商毛利" value={`~${r.estMargin}%`} hint="AI 估算" tone={r.estMargin > 20 ? "rose" : undefined} />
                <Analysis label="市場缺料" value={`${r.shortageHeat}°`} hint="缺料熱度" tone={r.shortageHeat > 50 ? "rose" : undefined} />
                <Analysis label="競爭供應商" value={`${r.altSuppliers} 家`} hint="同類可替代" tone={r.altSuppliers === 0 ? "rose" : undefined} />
              </div>

              {/* 建議話術 */}
              <div className="mt-2 text-xs text-slate-700 bg-white/70 rounded px-3 py-2">
                <b className="text-slate-900">💬 議價建議：</b>
                {r.strategy === "STRONG NEGOTIATION" &&
                  `報價較市場高 ${r.gapPct.toFixed(1)}%，${r.commodity && r.commodityDevPct < 0 ? `且 ${COMMODITY_NAME[r.commodity]} 行情已跌 ${Math.abs(r.commodityDevPct)}%，` : ""}` +
                  `${r.altSuppliers > 0 ? `有 ${r.altSuppliers} 家競爭供應商可比價，` : ""}建議要求降至市場價，目標省 $${r.potentialSaving.toLocaleString()}。`}
                {r.strategy === "LOCK SUPPLY" &&
                  `此料需求高${r.shortageHeat > 0 ? `（缺料熱度 ${r.shortageHeat}°）` : ""}，議價空間有限，建議優先簽長約鎖定產能與價格，避免斷料。`}
                {r.strategy === "NORMAL NEGOTIATION" &&
                  `報價接近市場合理區間，常規議價即可，可順帶爭取付款條件或交期優化。`}
              </div>
            </article>
          );
        })}
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3">
        <b>📌 資料來源</b>：歷史成交價取自現行 PO 單價；國際行情連動原物料 AI 戰情室（SPC）；
        供應商毛利為 AI 估算；匯率 demo 固定。正式版接鼎新 PO 歷史 + LME API + 供應商財報，
        並導入 XGBoost 議價勝率模型。
      </p>
    </div>
  );
}

function Analysis({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "rose" }) {
  return (
    <div className="bg-white/70 rounded-lg px-2.5 py-1.5 border border-slate-200/60">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`font-bold tabular-nums ${tone === "rose" ? "text-rose-600" : "text-slate-800"}`}>{value}</div>
      <div className="text-[9px] text-slate-400">{hint}</div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "cyan" | "rose" | "amber" | "emerald" }) {
  const cls =
    tone === "cyan" ? "border-cyan-200 bg-cyan-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    "border-slate-200 bg-white";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
