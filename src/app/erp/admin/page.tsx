import Link from "next/link";

// 管理後台 — Admin Backend 首頁
// 統一入口：主檔 / QR / 設定 / 監控 / 修改流程

export default function AdminHomePage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">⚙️ 管理後台 — Admin Backend</h1>
        <p className="text-sm text-slate-500 mt-1">
          系統管理員入口　·　主檔 CRUD / QR 生成 / 系統設定 / 修改流程
        </p>
      </header>

      {/* 🚨 3 大底層（致命缺口補上） */}
      <section className="rounded-xl border-2 border-rose-300 bg-rose-50/40 p-4">
        <div className="font-bold text-rose-900 mb-2">🚨 3 大底層架構 — 大型企業系統的核心</div>
        <div className="text-xs text-slate-700 mb-3">沒有這 3 層 = 上面所有功能會崩，是「致命缺口」必須補上。</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AdminCard
            href="/erp/admin/event-engine"
            icon="⚡"
            tone="rose"
            title="Event & Workflow Engine"
            desc="一事件 → 自動 fan-out 給所有相關模組（ASN delay → 7 個模組同步反應）"
            tag="致命缺口 1"
          />
          <AdminCard
            href="/erp/admin/mdm"
            icon="📚"
            tone="rose"
            title="MDM — 主資料管理"
            desc="定義「誰才是唯一真實來源」(Supplier/Inventory/PO/ASN/Cost/BOM)"
            tag="致命缺口 2"
          />
          <AdminCard
            href="/erp/admin/access-control"
            icon="🔐"
            tone="rose"
            title="RBAC + ABAC 權限"
            desc="角色 + 動態條件雙層 — 供應商不能看到彼此資料"
            tag="致命缺口 3"
          />
          <AdminCard
            href="/erp/admin/observability"
            icon="🔭"
            tone="rose"
            title="Observability 觀測能力"
            desc="Event Trace / AI Explain / Data Lineage / Workflow Log / Decision Replay 5 合 1"
            tag="共通能力"
          />
        </div>
      </section>

      {/* 一般管理區塊 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminCard
          href="/erp/admin/qr-generator"
          icon="📱"
          tone="cyan"
          title="QR Code 生成器"
          desc="生成 PO / 箱 / Lot / 料件 / 儲位 / 工單 QR，可批次列印貼到箱上"
          tag="新功能"
        />
        <AdminCard
          href="/erp/admin/settings"
          icon="🎛"
          tone="slate"
          title="系統設定"
          desc="閾值 / 容差 / FX rate / 排程 / 預警規則"
          tag="管理員"
        />
        <AdminCard
          href="/erp/admin/change-management"
          icon="🔧"
          tone="amber"
          title="修改流程說明"
          desc="新增料件 / 改規格 / 加供應商 / 改 BOM / 接新報表 — 標準作業流程"
          tag="SOP"
        />

        {/* 主檔群 */}
        <AdminCard
          href="/erp/suppliers"
          icon="🏭"
          tone="emerald"
          title="供應商主檔"
          desc="40 家供應商（含代號、國別、交期），可 CSV 匯出"
          tag="主檔"
        />
        <AdminCard
          href="/erp/parts"
          icon="🔩"
          tone="emerald"
          title="零件主檔"
          desc="119 料件（含成本、安全庫存、交期），可 CSV 匯出"
          tag="主檔"
        />
        <AdminCard
          href="/erp/models"
          icon="🏗"
          tone="emerald"
          title="型號 + 多階 BOM"
          desc="7 成品成品卡 + 樹狀 BOM + 成本 rollup"
          tag="主檔"
        />

        <AdminCard
          href="/erp/import"
          icon="📥"
          tone="cyan"
          title="鼎新報表匯入"
          desc="拖 .xls 自動辨識 17 種鼎新標準報表（含 SQLTOEXCEL 出來的檔）"
          tag="整合"
        />
        <AdminCard
          href="/erp/integration"
          icon="🔌"
          tone="cyan"
          title="鼎新整合說明"
          desc="3 層級整合 / SQL VIEW / SQLTOEXCEL 配方 / IT 部署文件"
          tag="整合"
        />
        <AdminCard
          href="/erp/performance"
          icon="📊"
          tone="amber"
          title="決策績效 + 案例庫"
          desc="主管決策準確度 / 供應商評分 / 案例庫"
          tag="監控"
        />
      </section>

      {/* 系統資訊 */}
      <section className="bg-slate-900 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-3">System Info</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-[10px] text-slate-400">系統版本</div>
            <div className="font-bold tabular-nums">GASCC v1.0</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">基準資料</div>
            <div className="font-bold">2026-05-08 (seed)</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">鼎新整合</div>
            <div className="font-bold text-amber-300">方式 C（手動上傳）</div>
            <div className="text-[10px] text-slate-500">可升級到方式 A/B</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">資料儲存</div>
            <div className="font-bold">In-memory seed + localStorage</div>
            <div className="text-[10px] text-slate-500">正式版改 PostgreSQL</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminCard({ href, icon, title, desc, tag, tone }: {
  href: string; icon: string; title: string; desc: string; tag: string;
  tone: "cyan" | "emerald" | "amber" | "rose" | "slate";
}) {
  const tones = {
    cyan: "border-cyan-200 hover:border-cyan-400 bg-cyan-50/40",
    emerald: "border-emerald-200 hover:border-emerald-400 bg-emerald-50/40",
    amber: "border-amber-200 hover:border-amber-400 bg-amber-50/40",
    rose: "border-rose-200 hover:border-rose-400 bg-rose-50/40",
    slate: "border-slate-200 hover:border-slate-400 bg-white",
  } as const;
  const tagTones = {
    cyan: "bg-cyan-100 text-cyan-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  } as const;
  return (
    <Link href={href} className={`block rounded-xl border-2 p-4 transition-colors ${tones[tone]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-3xl">{icon}</div>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${tagTones[tone]}`}>{tag}</span>
      </div>
      <div className="font-bold text-base">{title}</div>
      <div className="text-xs text-slate-600 mt-1 leading-relaxed">{desc}</div>
    </Link>
  );
}
