import Link from "next/link";

// 系統設定頁 — Admin Settings
// 集中管理所有 threshold / 容差 / FX rate / 排程設定

const SETTINGS_GROUPS = [
  {
    title: "🚨 預警閾值",
    desc: "影響戰情室 Decision Engine 與 Supplier Risk Radar",
    items: [
      { k: "PO_ACK_HOURS",          label: "PO 確認時限",         value: "48 hr", note: "超過 → push 採購主管 + 列高風險戶" },
      { k: "ASN_PREARRIVAL_DAYS",    label: "預定出貨前 ASN 必填", value: "3 天",   note: "T-3 仍無 ASN → 預防性預警" },
      { k: "EARLY_SIGNAL_SIGMA",     label: "預警前兆 σ 閾值",     value: "2σ",     note: "≥2σ 警示、≥3σ 重大" },
      { k: "EQUIP_UTIL_CRIT",        label: "設備稼動率紅線",       value: "92%",   note: "≥92% AI 判塞車風險高" },
      { k: "EQUIP_UTIL_WARN",        label: "設備稼動率黃線",       value: "85%",   note: "≥85% 中度警示" },
      { k: "DOH_RISK_DAYS",          label: "DOH 風險天數",         value: "7 天",   note: "DOH<7 → 即時補貨警示" },
    ],
  },
  {
    title: "⚖️ 容差規範",
    desc: "影響收貨 Checklist 第 3 步重量驗證",
    items: [
      { k: "WEIGHT_TOLERANCE_PCT",   label: "重量容許 ±%",          value: "2%",     note: "ASN 重量 vs 實秤偏差" },
      { k: "QTY_TOLERANCE_PCT",      label: "數量容許 ±%",          value: "0%",     note: "必須完全一致" },
      { k: "CPK_GOOD_THRESHOLD",     label: "Cpk 達標下限",         value: "1.33",   note: "<1.33 黃燈、<1.0 紅燈" },
    ],
  },
  {
    title: "💵 匯率（FX Rate）",
    desc: "影響 AI 議價引擎 / Should-Cost",
    items: [
      { k: "FX_USD_TWD",  label: "USD → TWD", value: "30.85", note: "美元計價料件用" },
      { k: "FX_CNY_TWD",  label: "CNY → TWD", value: "4.50",  note: "中國採購用" },
      { k: "FX_VND_TWD",  label: "VND → TWD", value: "0.0013", note: "越南供應商" },
      { k: "FX_JPY_TWD",  label: "JPY → TWD", value: "0.21",  note: "日本料件" },
    ],
  },
  {
    title: "⏱ 排程",
    desc: "資料同步與決策推進頻率",
    items: [
      { k: "DINGXIN_IMPORT_TIMES",   label: "鼎新匯入頻率",         value: "06:00 / 12:00 / 18:00", note: "SQLTOEXCEL 排程" },
      { k: "DECISION_ADVANCE_SEC",   label: "決策狀態推進間隔",      value: "5 秒",  note: "前端 polling" },
      { k: "ESCALATION_FACTOR",      label: "升級觸發倍數",          value: "1.5×",  note: "超過截止時間 1.5× → escalated" },
      { k: "RADAR_RECENT_PCT",       label: "風險雷達近期窗口 %",    value: "35%",   note: "近期 vs 早期切分點" },
    ],
  },
  {
    title: "📐 業務規則",
    desc: "ABC 分級、ROP 計算",
    items: [
      { k: "ABC_A_VALUE_PCT",        label: "A 類料件 (價值 %)",     value: "80%",   note: "Pareto 80/20" },
      { k: "ABC_B_VALUE_PCT",        label: "B 類料件",              value: "15%",   note: "" },
      { k: "ROP_SAFETY_DAYS",        label: "ROP 安全天數",          value: "7 天",  note: "再下單時點" },
      { k: "WEIGHT_OUTSOURCE_PCT",   label: "委外加工最大占比",       value: "30%",   note: "超過 → 評估自製" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎛 系統設定 — Admin Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            預警閾值 / 容差 / 匯率 / 排程 / 業務規則　·　集中管理所有「魔法數字」
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
        <div className="font-bold text-amber-900 mb-1">⚠ 目前為唯讀模式（v1.0）</div>
        <div className="text-xs text-slate-700 leading-relaxed">
          所有設定目前內建在程式碼中（<code className="font-mono bg-white px-1 rounded">src/lib/erp/</code>）。
          <b>正式版（v1.1）</b>將提供：① 線上編輯 ② 變更歷史追蹤 ③ 角色權限（管理員 / 採購主管 / PM / 倉管 / 品保）④ 變更前後 A/B 預覽影響範圍。
          詳見 <Link href="/erp/admin/change-management" className="text-cyan-700 underline">修改流程說明</Link>。
        </div>
      </section>

      {SETTINGS_GROUPS.map((g) => (
        <section key={g.title} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-3">
            <h2 className="font-bold text-lg">{g.title}</h2>
            <div className="text-xs text-slate-500">{g.desc}</div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2 w-48">設定 Key</th>
                <th className="text-left px-3 py-2">說明</th>
                <th className="text-right px-3 py-2 w-32">目前值</th>
                <th className="text-left px-3 py-2">用途</th>
              </tr>
            </thead>
            <tbody>
              {g.items.map((it) => (
                <tr key={it.k} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs text-cyan-700">{it.k}</td>
                  <td className="px-3 py-2">{it.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold">{it.value}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{it.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>📌 改設定的標準作業流程</b>　v1.0 階段：所有設定改 commit 上 git → CI build → 部署。
        v1.1 起：管理員直接在此頁編輯，變更會經過審核 + 自動測試後生效。
        對任何「魔法數字」有疑問，請看 <Link href="/erp/admin/change-management" className="text-cyan-700 underline">修改流程說明</Link>。
      </p>
    </div>
  );
}
