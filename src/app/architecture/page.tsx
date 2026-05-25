import Link from "next/link";
import { getDict } from "@/lib/erp/i18n-server";
import { allCenters } from "@/lib/erp/operations-centers";
import { ALL_WORKBENCHES } from "@/lib/erp/workbenches";

// 5-Layer 系統架構頁
//   Layer 1: Global Command Center
//   Layer 2: Operational Centers (6)
//   Layer 3: Expert Workbench (32)
//   Layer 4: AI Engine Layer (4)
//   Layer 5: Data / Event / Governance Layer

export default async function ArchitecturePage() {
  const T = await getDict();
  const centers = allCenters();
  const workbenchCount = ALL_WORKBENCHES.length;

  return (
    <div className="min-h-screen text-slate-100" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#111827 100%)" }}>
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">

        <header className="border-b border-cyan-500/30 pb-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-cyan-400 font-bold">SYSTEM ARCHITECTURE · 5-LAYER MILITARY DESIGN</div>
          <h1 className="text-3xl font-extrabold mt-1">🏛 {T.system_name} — 5-Layer 架構</h1>
          <p className="text-sm text-slate-400 mt-1">{T.brand_full}　·　世界級供應鏈作戰系統</p>
        </header>

        <div className="text-xs text-slate-400 bg-slate-900/40 rounded p-3 border border-slate-700">
          設計理念：從 BOSS 視角（L1）→ 領域指揮（L2）→ 操作執行（L3）→ AI 大腦（L4）→ 底層資料/事件/治理（L5）。
          每層服務不同角色、不同關注點，但共用同一套資料底層（Event Stream + MDM）。
        </div>

        {/* === Layer 1 === */}
        <LayerCard
          n="1" emoji="🎯" tone="rose"
          title="Global Command Center" subtitle={T.layer_1_name}
          role="BOSS 視角（CEO/VP/採購總監）— 3 秒看公司現在是否安全"
          principle="只回答 2 個問題：哪裡快爆了？該先救哪裡？"
          modules={[
            { name: "Hot Zones × 5", desc: "缺料/準交/原料/品質/供應商 5 大火警燈" },
            { name: "Triage Queue", desc: "AI 推薦救援優先序" },
            { name: "Sit Rep Event Feed", desc: "即時事件流" },
            { name: "Health Snapshot", desc: "OTD/OTIF/ASN/PO/設備 健康度" },
          ]}
          href="/erp" linkLabel="進入 Command Center"
        />

        {/* === Layer 2 === */}
        <LayerCard
          n="2" emoji="🎖" tone="cyan"
          title="Operational Centers" subtitle={T.layer_2_name}
          role="領域 owner 視角（採購 / 業務 / 廠長 / 倉管 / 議價 / 副總）— 6 大作戰中心各自指揮"
          principle="每個 Center 是獨立指揮所，含該領域 KPI / 待處理事項 / 工具入口"
          modules={centers.map((c) => ({
            name: `${c.emoji} ${c.title}`,
            desc: c.role.slice(0, 40) + "…",
          }))}
          href="/os" linkLabel="進入 6 大作戰中心"
        />

        {/* === Layer 3 === */}
        <LayerCard
          n="3" emoji="🛠" tone="emerald"
          title="Expert Workbench" subtitle={T.layer_3_name}
          role="操作執行者視角（採購人員 / 倉管 / 品保 / PM）— 聚焦單一工作流的專業工作台"
          principle={`${workbenchCount} 個工作台，每個聚焦 3-5 個主要操作 + 連接完整工具`}
          modules={[
            { name: "Supplier × 5", desc: "Portal / ASN / Risk / Scorecard / Timeline" },
            { name: "Procurement × 4", desc: "Commodity / Should-Cost / Negotiation / RFQ" },
            { name: "Manufacturing × 5", desc: "WO / Bottleneck / Capacity / Flow / BOM" },
            { name: "Inventory × 6", desc: "Health / Receiving / Shortage / DOH / Dead / Safety" },
            { name: "Delivery × 6", desc: "OTD / ETA / Delay / Critical / Customer / Schedule" },
            { name: "Decision × 6", desc: "Queue / Simulation / What-if / Scenario / Risk / Auto" },
          ]}
          href="/os" linkLabel="進入工作台列表"
        />

        {/* === Layer 4 === */}
        <LayerCard
          n="4" emoji="🧠" tone="violet"
          title="AI Engine Layer" subtitle={T.layer_4_name}
          role="系統大腦 — 4 大 Engine 提供所有頁面的 AI 推理能力"
          principle="核心不是 Table，是 Graph + Timeline"
          modules={[
            { name: "Event Intelligence", desc: "所有事情都是 Event，自動 Priority+Dedup+Correlation+Notification" },
            { name: "Digital Twin Engine", desc: "每個實體都有數位分身（供應商/工單/倉庫/原料/生產線/客戶）" },
            { name: "Prediction Engine", desc: "ETA/Delay/Cost/Demand/Capacity/Supplier Risk 6 維預測" },
            { name: "Time Coordination", desc: "供應鏈本質 = 時間錯配；Timeline Graph 是真正資料結構" },
          ]}
          href="/erp/admin/engines" linkLabel="看 4 大 Engine 詳細"
        />

        {/* === Layer 5 === */}
        <LayerCard
          n="5" emoji="📚" tone="amber"
          title="Data / Event / Governance Layer" subtitle={T.layer_5_name}
          role="底層基礎建設 — 資料治理、事件流、權限、稽核"
          principle="沒有這層 = 上面所有 AI 都是空中樓閣"
          modules={[
            { name: "Event Stream", desc: "11 種事件 × 4 嚴重度 × 4 通知管道 + Dedup + Correlation" },
            { name: "MDM (Master Data Mgmt)", desc: "13 個 Entity 的 Source of Truth + 同步方向" },
            { name: "Data Ownership", desc: "每個 Entity 的人類擁有者部門 + 升級鏈" },
            { name: "RBAC + ABAC", desc: "10 角色 × 8 ABAC 規則（含供應商隔離）" },
            { name: "Approval Workflow", desc: "12 種需批准動作（改 PO/改成本/Override IQC/緊急放行...）" },
            { name: "Observability", desc: "Event Trace / AI Explain / Data Lineage / Workflow Log / Decision Replay" },
            { name: "Audit Trail", desc: "所有變更可追溯、可重放" },
          ]}
          href="/erp/admin" linkLabel="看完整管理後台"
        />

        {/* 跨層整合說明 */}
        <section className="bg-slate-900/60 rounded-xl border border-cyan-500/30 p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-cyan-400 font-bold mb-2">🔗 跨層整合</div>
          <h3 className="font-bold text-lg mb-2">如何協作（World-Class Pattern）</h3>
          <ol className="text-sm text-slate-300 space-y-2 leading-relaxed">
            <li><b className="text-rose-400">L5 ingest</b> 每天從鼎新 ERP 拉 ASN/ETA/IQC/OTD/Delay/Capacity/Cost/Commodity → Event Stream</li>
            <li><b className="text-violet-400">L4 處理</b> 4 大 Engine 從 Event Stream 取資料，建構 Twin、Prediction、Timeline Graph</li>
            <li><b className="text-emerald-400">L3 操作</b> 工作台從 Engine 取得即時資料，操作人員執行任務</li>
            <li><b className="text-cyan-400">L2 統籌</b> 6 大作戰中心聚合該領域 KPI + 待處理</li>
            <li><b className="text-rose-400">L1 視覺化</b> Command Center 給 BOSS 3 秒看完，並推 AI 救援優先序</li>
          </ol>
        </section>

        {/* 系統定位 */}
        <section className="bg-gradient-to-br from-rose-900/40 to-slate-900 rounded-xl border-2 border-rose-500/40 p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-rose-400 font-bold mb-2">SYSTEM POSITIONING</div>
          <div className="text-3xl font-extrabold">
            <span className="line-through text-slate-500">ERP Platform / Dashboard</span>
          </div>
          <div className="text-4xl font-black mt-2 text-cyan-300">{T.system_name}</div>
          <div className="text-2xl font-bold mt-1 text-slate-300">{T.system_name_en}</div>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed max-w-2xl">
            不是看現在，是預測未來 + 直接推薦最佳方案。
            真正的價值不是頁面多，是<b className="text-amber-300">供應鏈事件密度</b>夠高、AI 持續學習、決策準確度持續提升。
          </p>
        </section>
      </div>
    </div>
  );
}

function LayerCard({ n, emoji, tone, title, subtitle, role, principle, modules, href, linkLabel }: {
  n: string; emoji: string; tone: "rose" | "cyan" | "emerald" | "violet" | "amber";
  title: string; subtitle: string; role: string; principle: string;
  modules: { name: string; desc: string }[];
  href: string; linkLabel: string;
}) {
  const colors = {
    rose:    { bg: "from-rose-900/40 to-rose-800/20",     border: "border-rose-500/40",    text: "text-rose-300",    accent: "bg-rose-500" },
    cyan:    { bg: "from-cyan-900/40 to-cyan-800/20",     border: "border-cyan-500/40",    text: "text-cyan-300",    accent: "bg-cyan-500" },
    emerald: { bg: "from-emerald-900/40 to-emerald-800/20", border: "border-emerald-500/40", text: "text-emerald-300", accent: "bg-emerald-500" },
    violet:  { bg: "from-violet-900/40 to-violet-800/20", border: "border-violet-500/40",  text: "text-violet-300",  accent: "bg-violet-500" },
    amber:   { bg: "from-amber-900/40 to-amber-800/20",   border: "border-amber-500/40",   text: "text-amber-300",   accent: "bg-amber-500" },
  };
  const c = colors[tone];
  return (
    <section className={`bg-gradient-to-br ${c.bg} rounded-xl border-2 ${c.border} p-5`}>
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <div className={`w-14 h-14 rounded-xl ${c.accent} flex items-center justify-center text-3xl shrink-0`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] tracking-[0.3em] uppercase ${c.text} font-bold`}>Layer {n}</div>
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <div className="text-sm text-slate-400">{subtitle}</div>
        </div>
        <Link href={href} className={`text-xs px-3 py-2 rounded ${c.accent} text-white font-bold hover:opacity-90 shrink-0`}>
          {linkLabel} →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="bg-slate-900/40 rounded p-3 border border-slate-700">
          <div className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mb-1">角色</div>
          <div className="text-sm text-slate-200">{role}</div>
        </div>
        <div className="bg-slate-900/40 rounded p-3 border border-slate-700">
          <div className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mb-1">設計理念</div>
          <div className="text-sm text-slate-200">{principle}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {modules.map((m) => (
          <div key={m.name} className="bg-slate-900/40 rounded p-2 border border-slate-700">
            <div className={`text-xs font-bold ${c.text}`}>{m.name}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{m.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
