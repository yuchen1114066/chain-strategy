"use client";

// 供應商年度考核 · Supplier Annual Scorecard
//
// 從 IndexedDB 三個來源算出每家供應商的真實分數：
//   - purchases: 採購歷史（價格競爭力 + 規模 + 採購頻次）
//   - iqcRecords: IQC 不良率（品質 PPM）
//   - rmaRecords: RMA 退料次數（退料率）
//
// 評分權重（可調，目前是業界常見配比）：
//   50% 品質  = (100 - normalized PPM) × 0.7 + (100 - normalized 退料率) × 0.3
//   30% 價格  = 同料號排名（越便宜分越高）
//   20% 規模  = 採購筆數 + 涉及料號數
//
// 給副總看「為什麼這家評 85 分、那家 62 分」— 每個分項都點得開細節。

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadPurchases, loadIqcRecords, loadRmaRecords,
  type PurchaseRecord, type IqcRecord, type RmaRecord,
} from "@/lib/erp/master-data-store";

type SupplierStats = {
  name: string;
  purchaseCount: number;
  uniquePartCount: number;
  totalSpend: number;             // 累計採購金額（TWD）
  iqcCount: number;
  iqcInspected: number;
  iqcDefect: number;
  iqcPpm: number;
  ngBatches: number;
  rmaCount: number;
  rmaQty: number;
  pricePercentile: number;        // 0-100，越低代表越便宜（給分時要反轉）
  // 分數
  qualityScore: number;
  priceScore: number;
  scaleScore: number;
  overallScore: number;
};

export default function SupplierScorecard() {
  const [stats, setStats] = useState<SupplierStats[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [yearFilter, setYearFilter] = useState<"all" | number>("all");

  const load = useCallback(async () => {
    const [purchases, iqc, rma] = await Promise.all([
      loadPurchases(), loadIqcRecords(10000), loadRmaRecords(10000),
    ]);
    setStats(computeScores(purchases, iqc, rma, yearFilter));
    setLoaded(true);
  }, [yearFilter]);

  useEffect(() => { load(); }, [load]);

  const years = useMemo(() => extractYears(stats), [stats]);

  if (!loaded) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm text-slate-500">載入考核資料中…</div>
      </section>
    );
  }

  if (stats.length === 0) {
    return (
      <section className="rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4">
        <h2 className="text-lg font-bold text-amber-900 mb-1">🏆 年度供應商考核 · Supplier Scorecard</h2>
        <p className="text-sm text-amber-900">
          沒有採購紀錄可計算。請先到 <a href="/erp/master-data" className="underline font-bold">/erp/master-data</a> 上傳採購歷史（建議搭配 IQC + RMA 才能算出完整 4 維分數）。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border-2 border-emerald-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-emerald-900">🏆 年度供應商考核 · Supplier Scorecard</h2>
        <span className="text-xs text-slate-500 font-mono">真實資料 · 採購 + IQC + RMA 加權</span>
        <span className="flex-1" />
        <label className="text-xs text-slate-600">
          年度範圍：
          <select
            value={yearFilter === "all" ? "all" : String(yearFilter)}
            onChange={(e) => setYearFilter(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))}
            className="ml-2 border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="all">全部</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {/* 權重說明 */}
      <div className="bg-slate-50 rounded p-3 text-xs text-slate-600">
        <b className="text-slate-800">評分構成：</b>{" "}
        50% 品質（PPM 70% + 退料率 30%）　·
        30% 價格（同料號報價排名）　·
        20% 規模（採購筆數 + 料號廣度）　·
        滿分 100
      </div>

      {/* 排名表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-emerald-100 text-slate-700">
            <tr>
              <th className="text-left px-2 py-2 w-12">排名</th>
              <th className="text-left px-2 py-2">供應商</th>
              <th className="text-right px-2 py-2">總分</th>
              <th className="text-right px-2 py-2">品質 (50%)</th>
              <th className="text-right px-2 py-2">價格 (30%)</th>
              <th className="text-right px-2 py-2">規模 (20%)</th>
              <th className="text-right px-2 py-2">採購筆數</th>
              <th className="text-right px-2 py-2">料號數</th>
              <th className="text-right px-2 py-2">PPM</th>
              <th className="text-right px-2 py-2">退料</th>
              <th className="text-left px-2 py-2 w-20">評等</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => {
              const grade = gradeOf(s.overallScore);
              const isGold = i === 0;
              const isBronze = i === stats.length - 1 && stats.length > 2;
              return (
                <tr key={s.name} className={`border-t border-slate-100 ${isGold ? "bg-amber-50" : isBronze ? "bg-rose-50/40" : "hover:bg-slate-50"}`}>
                  <td className="px-2 py-2 font-mono text-slate-500">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </td>
                  <td className="px-2 py-2 font-bold">{s.name}</td>
                  <td className="px-2 py-2 text-right font-bold tabular-nums text-lg" style={{
                    color: s.overallScore >= 80 ? "#15803d" : s.overallScore >= 60 ? "#b8860b" : "#d4351c",
                  }}>{s.overallScore.toFixed(1)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{s.qualityScore.toFixed(0)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{s.priceScore.toFixed(0)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{s.scaleScore.toFixed(0)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-600">{s.purchaseCount}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-600">{s.uniquePartCount}</td>
                  <td className="px-2 py-2 text-right tabular-nums" style={{
                    color: s.iqcCount === 0 ? "#94a3b8" : s.iqcPpm > 5000 ? "#d4351c" : s.iqcPpm > 1000 ? "#b8860b" : "#15803d",
                  }}>
                    {s.iqcCount === 0 ? "—" : s.iqcPpm.toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-600">
                    {s.rmaCount > 0 ? `${s.rmaCount} 次` : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${grade.bg}`}>{grade.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 注意事項 */}
      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 leading-relaxed">
        <b>📌 資料完整度說明：</b>
        {stats.some((s) => s.iqcCount === 0) && (
          <> 部分供應商沒有 IQC 紀錄（PPM 顯示 —）→ 品質分數會以「無資料 = 滿分 100」處理（避免被誤殺）。</>
        )}
        {" "}建議所有進料都走 <a href="/erp/wms/receiving" className="underline font-bold">收料 IQC 流程</a> 累積品質資料，年底考核才有真實依據。
      </div>
    </section>
  );
}

// ============================================================
// 分數計算
// ============================================================
function computeScores(
  purchases: PurchaseRecord[],
  iqc: IqcRecord[],
  rma: RmaRecord[],
  yearFilter: "all" | number,
): SupplierStats[] {
  // 1. 依年度篩
  const filteredP = yearFilter === "all" ? purchases : purchases.filter((p) => p.date && new Date(p.date).getFullYear() === yearFilter);
  const filteredI = yearFilter === "all" ? iqc : iqc.filter((x) => new Date(x.inspectedAt).getFullYear() === yearFilter);
  const filteredR = yearFilter === "all" ? rma : rma.filter((x) => new Date(x.createdAt).getFullYear() === yearFilter);

  // 2. 依供應商分組採購
  const bySupplier = new Map<string, {
    purchases: PurchaseRecord[];
    iqc: IqcRecord[];
    rma: RmaRecord[];
  }>();
  for (const p of filteredP) {
    if (!p.supplier) continue;
    if (!bySupplier.has(p.supplier)) bySupplier.set(p.supplier, { purchases: [], iqc: [], rma: [] });
    bySupplier.get(p.supplier)!.purchases.push(p);
  }
  for (const x of filteredI) {
    if (!bySupplier.has(x.supplier)) bySupplier.set(x.supplier, { purchases: [], iqc: [], rma: [] });
    bySupplier.get(x.supplier)!.iqc.push(x);
  }
  for (const x of filteredR) {
    if (!bySupplier.has(x.supplier)) bySupplier.set(x.supplier, { purchases: [], iqc: [], rma: [] });
    bySupplier.get(x.supplier)!.rma.push(x);
  }

  // 3. 對每個料號排價（每家在某料的均價排名）
  const partPriceRank = new Map<string, Map<string, number>>(); // partNo → supplier → percentile
  const byPart = new Map<string, PurchaseRecord[]>();
  for (const p of filteredP) {
    if (!byPart.has(p.partNo)) byPart.set(p.partNo, []);
    byPart.get(p.partNo)!.push(p);
  }
  for (const [partNo, recs] of byPart.entries()) {
    const avgBySup = new Map<string, number>();
    const cntBySup = new Map<string, number>();
    for (const r of recs) {
      avgBySup.set(r.supplier, (avgBySup.get(r.supplier) ?? 0) + r.unitPrice);
      cntBySup.set(r.supplier, (cntBySup.get(r.supplier) ?? 0) + 1);
    }
    const ranked = Array.from(avgBySup.entries())
      .map(([s, sum]) => ({ supplier: s, avg: sum / (cntBySup.get(s) ?? 1) }))
      .sort((a, b) => a.avg - b.avg);
    ranked.forEach((r, idx) => {
      const pct = ranked.length === 1 ? 50 : (idx / (ranked.length - 1)) * 100;
      if (!partPriceRank.has(partNo)) partPriceRank.set(partNo, new Map());
      partPriceRank.get(partNo)!.set(r.supplier, pct);
    });
  }

  // 4. 計算每家供應商的分項分數
  const allStats: SupplierStats[] = [];
  for (const [name, g] of bySupplier.entries()) {
    const purchaseCount = g.purchases.length;
    const uniquePartCount = new Set(g.purchases.map((p) => p.partNo)).size;
    const totalSpend = g.purchases.reduce((s, p) => s + p.unitPrice * (p.qty || 1), 0);
    const iqcInspected = g.iqc.reduce((s, x) => s + x.qtyInspected, 0);
    const iqcDefect = g.iqc.reduce((s, x) => s + x.qtyDefect, 0);
    const iqcPpm = iqcInspected > 0 ? Math.round(iqcDefect / iqcInspected * 1_000_000) : 0;
    const ngBatches = g.iqc.filter((x) => x.result === "NG").length;

    // 品質分數：50% 由 PPM、30% 由退料率
    const ppmScore = g.iqc.length === 0 ? 100 : Math.max(0, 100 - iqcPpm / 100);
    const rmaRate = purchaseCount > 0 ? g.rma.length / purchaseCount * 100 : 0;
    const rmaScore = g.rma.length === 0 ? 100 : Math.max(0, 100 - rmaRate * 5);
    const qualityScore = ppmScore * 0.7 + rmaScore * 0.3;

    // 價格分數：平均料號排名 → 越靠前（百分位數越小）越高
    const partPercentiles: number[] = [];
    for (const p of g.purchases) {
      const pct = partPriceRank.get(p.partNo)?.get(name);
      if (pct != null) partPercentiles.push(pct);
    }
    const avgPercentile = partPercentiles.length > 0
      ? partPercentiles.reduce((s, x) => s + x, 0) / partPercentiles.length
      : 50;
    const priceScore = Math.max(0, 100 - avgPercentile);

    // 規模分數：log(採購筆數) + log(料號數) normalize
    const scaleRaw = Math.log(1 + purchaseCount) * 8 + Math.log(1 + uniquePartCount) * 12;
    const scaleScore = Math.min(100, scaleRaw);

    const overallScore = qualityScore * 0.5 + priceScore * 0.3 + scaleScore * 0.2;

    allStats.push({
      name, purchaseCount, uniquePartCount, totalSpend,
      iqcCount: g.iqc.length, iqcInspected, iqcDefect, iqcPpm, ngBatches,
      rmaCount: g.rma.length, rmaQty: g.rma.reduce((s, x) => s + x.qty, 0),
      pricePercentile: avgPercentile,
      qualityScore, priceScore, scaleScore, overallScore,
    });
  }

  // 5. 排序：總分由高到低
  return allStats.sort((a, b) => b.overallScore - a.overallScore);
}

function extractYears(stats: SupplierStats[]): number[] {
  // 這個 helper 是 placeholder；真實年度由採購歷史 date 統計，目前先固定列當年+前 2 年
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2];
}

function gradeOf(score: number): { label: string; bg: string } {
  if (score >= 90) return { label: "A · 優", bg: "bg-emerald-200 text-emerald-900" };
  if (score >= 80) return { label: "B · 良", bg: "bg-emerald-100 text-emerald-700" };
  if (score >= 70) return { label: "C · 可", bg: "bg-amber-100 text-amber-700" };
  if (score >= 60) return { label: "D · 待改", bg: "bg-orange-200 text-orange-800" };
  return { label: "E · 不合格", bg: "bg-rose-200 text-rose-800" };
}
