import Link from "next/link";
import { MDM_REGISTRY, summarizeMdm } from "@/lib/erp/mdm";

// MDM (Master Data Management) — 致命缺口 2 補上
//   「誰才是唯一真實來源 (Source of Truth)」

const SOT_TONE: Record<string, { bg: string; chip: string; label: string }> = {
  "Portal":         { bg: "bg-cyan-50 border-cyan-300",    chip: "bg-cyan-600 text-white",    label: "本系統 Portal" },
  "ERP":            { bg: "bg-amber-50 border-amber-300",  chip: "bg-amber-500 text-white",   label: "鼎新 ERP" },
  "ERP/PLM":        { bg: "bg-amber-50 border-amber-300",  chip: "bg-amber-500 text-white",   label: "鼎新 ERP / PLM" },
  "AI Cost Engine": { bg: "bg-violet-50 border-violet-300",chip: "bg-violet-600 text-white",  label: "本系統 AI 引擎" },
  "Manual":         { bg: "bg-slate-50 border-slate-300",  chip: "bg-slate-500 text-white",   label: "人工維護" },
  "External API":   { bg: "bg-emerald-50 border-emerald-300",chip: "bg-emerald-600 text-white",label: "外部資料源" },
};

export default function MdmPage() {
  const sum = summarizeMdm();
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">📚 MDM — Master Data Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            定義「誰才是唯一真實來源」(Source of Truth)　·　避免同一筆資料在兩個系統不一致
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      {/* 為什麼需要 */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
        <div className="font-bold text-amber-900 mb-1">⚠ 致命缺口 2：沒有 MDM = 各模組可能用不同來源的同一筆資料</div>
        <p className="text-sm text-slate-700 leading-relaxed">
          例：採購單在鼎新改價但 Portal 還顯示舊價；或供應商在 Portal 改交期但鼎新仍是舊資料。
          <b>必須明確定義每個 entity 的 Source of Truth 與同步方向</b>，否則決策永遠不可信。
        </p>
      </section>

      {/* 統計 */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">Master Data Registry</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="總 Entity 數" value={`${sum.totalEntities}`} c="text-cyan-400" />
          <Stat label="Portal 為主" value={`${sum.portalAsSot}`} c="text-cyan-400" />
          <Stat label="鼎新 ERP 為主" value={`${sum.erpAsSot}`} c="text-amber-400" />
          <Stat label="AI 引擎為主" value={`${sum.aiEngineAsSot}`} c="text-violet-400" />
          <Stat label="外部 API" value={`${sum.externalAsSot}`} c="text-emerald-400" />
        </div>
      </section>

      {/* SoT 對照表 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📋 主資料 ↔ Source of Truth 對照表</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">Entity</th>
              <th className="text-left px-3 py-2">中文名稱</th>
              <th className="text-center px-3 py-2">Source of Truth</th>
              <th className="text-left px-3 py-2">同步方向</th>
              <th className="text-left px-3 py-2">同步頻率</th>
              <th className="text-left px-3 py-2">寫入權限</th>
            </tr>
          </thead>
          <tbody>
            {MDM_REGISTRY.map((m) => {
              const t = SOT_TONE[m.sourceOfTruth];
              return (
                <tr key={m.entity} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs font-bold">{m.entity}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{m.zhName}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.chip}`}>{t.label}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700">{m.syncDirection}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{m.syncFrequency}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{m.writeAccess.join(" / ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* 各 Entity 詳細 */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">📂 各 Entity 詳細規格</h2>
        {MDM_REGISTRY.map((m) => {
          const t = SOT_TONE[m.sourceOfTruth];
          return (
            <div key={m.entity} className={`rounded-xl border-2 ${t.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <code className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-white font-bold">{m.entity}</code>
                <span className="font-bold text-base">{m.zhName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.chip}`}>SoT: {t.label}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">⚖️ 衝突解決</div>
                  <div className="text-slate-700 leading-relaxed">{m.conflictRule}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">📥 下游消費者</div>
                  <div className="flex flex-wrap gap-1">
                    {m.consumers.map((c) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
              {m.notes && (
                <div className="text-[11px] text-slate-600 mt-2 bg-white/60 p-2 rounded">
                  📝 {m.notes}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📐 設計原則</b>　每個 Entity <b>只有一個 SoT</b>。任何系統若要寫該 Entity → 必須透過 SoT 系統，禁止雙寫。
        <b>正式版</b>：建議用 Outbox Pattern + CDC（Change Data Capture）做跨系統同步；
        所有衝突自動產生 ConflictEvent → 給管理員仲裁。
      </p>
    </div>
  );
}

function Stat({ label, value, c }: { label: string; value: string; c: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${c}`}>{value}</div>
    </div>
  );
}
