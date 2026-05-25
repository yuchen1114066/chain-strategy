import Link from "next/link";

// 修改流程說明 — Change Management SOP
// 給 IT / PM / 採購主管：以後要改什麼東西該走什麼流程

export default function ChangeManagementPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🔧 修改流程說明 — Change Management SOP</h1>
          <p className="text-sm text-slate-500 mt-1">
            以後要新增料件 / 改規格 / 加供應商 / 改 BOM / 接新報表 / 修閾值 — 該走什麼流程
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      {/* 變更分類 + 處理流程 */}
      <section className="space-y-4">
        <ChangeCategory
          tone="emerald"
          n="A"
          title="A 類：日常資料變更（採購 / PM / 倉管自己改）"
          examples={[
            "新增 PO（採購）",
            "更新生產進度（PM）",
            "ASN 填寫（供應商）",
            "收貨檢核（倉管）",
            "品質回填（品保）",
            "決策拍板（副總）",
          ]}
          where="使用者直接在前端操作"
          time="即時"
          who="使用者本人"
          steps={[
            "登入系統 → 進對應頁面",
            "直接操作（建立 / 編輯 / 確認）",
            "送出後系統自動記錄時間 + 操作人",
            "資料同步至 Supplier Digital Twin / Decision Loop / 戰情室",
          ]}
        />

        <ChangeCategory
          tone="cyan"
          n="B"
          title="B 類：主檔變更（管理員批准）"
          examples={[
            "新增供應商 / 改交期",
            "新增料件 / 改單價 / 改安全庫存",
            "新增成品（型號）/ 改 BOM 結構",
            "新增 Should-Cost 拆解類別",
            "新增軸心 SPEC（其他料件做 SPC）",
          ]}
          where="管理後台「主檔管理」區，或編輯 src/lib/erp/seed.ts"
          time="管理員審核 1 天內"
          who="管理員（採購主管 / 工程主管）"
          steps={[
            "提出申請（Email / 內部單）給管理員",
            "管理員在管理後台編輯主檔 — 或交 PM 改 seed.ts",
            "改完 → 觸發 CI build 驗證 → 部署",
            "通知相關人員（採購 / PM / 業務）",
          ]}
          warnings={[
            "BOM 改完 → 立刻影響缺料牆、訂單衝擊模擬、Critical Path",
            "供應商交期改完 → 影響 ETA 預測、Risk Radar baseline",
          ]}
        />

        <ChangeCategory
          tone="amber"
          n="C"
          title="C 類：系統設定變更（管理員 + 審核）"
          examples={[
            "改 PO_ACK_HOURS 預警時限（48hr → 24hr）",
            "改重量容差（±2% → ±5%）",
            "改 Cpk 達標下限（1.33 → 1.5）",
            "改設備稼動率紅線（92% → 90%）",
            "新增 / 修改匯率",
            "排程時間調整",
          ]}
          where="src/lib/erp/ 各引擎檔（v1.1 改在管理後台）"
          time="2-3 天（含 PR review）"
          who="管理員 + 1 位審核者"
          steps={[
            "提出變更需求 + 影響範圍評估",
            "工程改程式 + 寫 test case",
            "在 staging 環境驗證 1 週",
            "審核者批准 → merge → 部署",
            "改完寄通知信給所有受影響角色",
          ]}
          warnings={[
            "改完會回溯影響「歷史趨勢計算」— 建議保留變更前後的對照",
          ]}
        />

        <ChangeCategory
          tone="rose"
          n="D"
          title="D 類：架構 / 整合變更（IT 工程 + 主管批准）"
          examples={[
            "新增鼎新整合 VIEW（如新加 QUATH 品質表）",
            "從方式 C（手動）升級到方式 B（SQLTOEXCEL 排程）",
            "從方式 B 升級到方式 A（Linked Server 即時）",
            "新增鼎新報表類型（17 種以外）",
            "改 schema：增 / 刪 / 改欄位",
            "新增新模組（如 OQC、IPQC、客訴）",
          ]}
          where="src/lib/erp/dingxin-parser.ts + DBA 端"
          time="1-2 週"
          who="IT 工程 + DBA + 主管"
          steps={[
            "提出整合需求 + 業務目的",
            "DBA 建立新的唯讀 VIEW（或修改現有 VIEW）",
            "本系統工程加 parser / engine",
            "在 staging 跑通 + 業務確認",
            "正式環境部署 + 通知所有相關角色",
          ]}
          warnings={[
            "VIEW 改完一定要重新測試所有依賴此 VIEW 的頁面",
            "鼎新 schema 改了一定要回頭看本系統是否要跟進",
          ]}
        />
      </section>

      {/* 變更紀錄 / Audit Trail */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📜 變更追蹤（Audit Trail）</h2>
        <p className="text-xs text-slate-600 mb-3">
          所有變更（A/B/C/D 類）都會留下記錄，讓「為什麼這個閾值是 92%」、「上一版鼎新交期是多少」等問題隨時可查。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 rounded p-3 border border-slate-200">
            <div className="font-bold mb-1">🗂 A 類（日常資料）</div>
            <div className="text-slate-600 leading-relaxed">每筆操作系統自動記時間 + 操作人。例：決策閉環的 actions 都有 startedAt / completedAt / actor。</div>
          </div>
          <div className="bg-slate-50 rounded p-3 border border-slate-200">
            <div className="font-bold mb-1">🗃 B/C 類（主檔 / 設定）</div>
            <div className="text-slate-600 leading-relaxed">v1.1 起：每次編輯記錄「誰 / 何時 / 改什麼 / 為什麼」。v1.0：靠 git commit history。</div>
          </div>
          <div className="bg-slate-50 rounded p-3 border border-slate-200">
            <div className="font-bold mb-1">🗄 D 類（架構）</div>
            <div className="text-slate-600 leading-relaxed">Git commit + Pull Request 完整歷史，含 review 記錄。所有 commit 都連動 IT 部署文件。</div>
          </div>
        </div>
      </section>

      {/* 緊急回滾 */}
      <section className="bg-rose-50 rounded-xl border-2 border-rose-300 p-5">
        <h2 className="font-bold text-lg mb-2 text-rose-900">🚨 緊急回滾（Rollback）</h2>
        <p className="text-xs text-slate-700 mb-3">
          若部署後發現問題（系統當機、計算錯誤、影響業務）：
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span>立即在管理後台關閉受影響功能（v1.1 起支援 feature toggle）</span>
          </li>
          <li className="flex gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span><code className="font-mono bg-white px-1 rounded">git revert &lt;commit&gt;</code> 回到前一版 + 重新部署（&lt; 5 分鐘）</span>
          </li>
          <li className="flex gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span>Email 全體：「系統已回到 vX.Y，正在分析原因」</span>
          </li>
          <li className="flex gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
            <span>修正後在 staging 多測 24 hr 才能重新部署</span>
          </li>
        </ol>
      </section>

      {/* 聯絡資訊 */}
      <section className="bg-slate-900 text-white rounded-xl p-5 border border-slate-700">
        <h2 className="font-bold text-lg mb-3 text-cyan-300">📞 聯絡窗口</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">A 類資料</div>
            <div className="font-bold mt-1">使用者本人直接操作</div>
            <div className="text-[11px] text-slate-400 mt-1">遇到操作問題 → 問該模組管理員</div>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">B/C 類設定</div>
            <div className="font-bold mt-1">系統管理員（PM peko）</div>
            <div className="text-[11px] text-slate-400 mt-1">主檔 / 閾值 / 規則變更</div>
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">D 類架構</div>
            <div className="font-bold mt-1">IT 工程 + DBA</div>
            <div className="text-[11px] text-slate-400 mt-1">鼎新整合 / Schema / 新模組</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChangeCategory({ tone, n, title, examples, where, time, who, steps, warnings }: {
  tone: "emerald" | "cyan" | "amber" | "rose";
  n: string; title: string; examples: string[]; where: string; time: string; who: string;
  steps: string[]; warnings?: string[];
}) {
  const tones = {
    emerald: { bd: "border-emerald-300", bg: "bg-emerald-50/40", chip: "bg-emerald-600" },
    cyan:    { bd: "border-cyan-300",    bg: "bg-cyan-50/40",    chip: "bg-cyan-600" },
    amber:   { bd: "border-amber-400",   bg: "bg-amber-50/40",   chip: "bg-amber-500" },
    rose:    { bd: "border-rose-400",    bg: "bg-rose-50/40",    chip: "bg-rose-600" },
  } as const;
  return (
    <div className={`rounded-xl border-2 ${tones[tone].bd} ${tones[tone].bg} p-5`}>
      <div className="flex items-start gap-3 mb-3">
        <span className={`w-10 h-10 rounded-lg ${tones[tone].chip} text-white font-extrabold text-xl flex items-center justify-center shrink-0`}>{n}</span>
        <div className="flex-1">
          <div className="font-bold text-base">{title}</div>
          <div className="text-xs text-slate-600 mt-1">
            <b>誰改：</b>{who}　·　<b>在哪改：</b>{where}　·　<b>多久：</b>{time}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-4">
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">範例變更</div>
          <ul className="space-y-0.5">
            {examples.map((e) => (
              <li key={e} className="text-xs text-slate-700">· {e}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mb-1">標準流程</div>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="font-mono text-slate-400 shrink-0">{i + 1}.</span>
                <span className="text-slate-700">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {warnings && warnings.length > 0 && (
        <div className="mt-3 bg-white rounded p-2 border border-rose-200 text-[11px] text-rose-700">
          <div className="font-bold mb-1">⚠ 注意</div>
          <ul className="space-y-0.5">
            {warnings.map((w) => <li key={w}>· {w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
