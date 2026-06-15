import Link from "next/link";
import { SC, Card, MiniLabel, FONT, StatusDot } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "Data Governance Center · 資料治理中心" };

export default function GovernancePage() {
  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>System · Admin</div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">Data Governance Center</h1>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>資料治理中心 · Master Data + ERP Sync + Data Quality</p>
        </header>

        {/* Master Data */}
        <Card accent={SC.primary}>
          <h2 className="text-base font-semibold mb-3">Master Data · 主資料</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "料號主檔",    count: "5,832 件", href: "/erp/parts" },
              { label: "供應商主檔",  count: "127 家",   href: "/erp/suppliers" },
              { label: "產品主檔",    count: "48 型號",  href: "/erp/models" },
              { label: "客戶主檔",    count: "63 家",    href: "/erp/customers" },
              { label: "BOM 版本主檔",count: "182 版",   href: "/erp/models" },
            ].map((m) => (
              <Link key={m.label} href={m.href} className="rounded-md border p-3 hover:shadow-sm transition-shadow" style={{ borderColor: SC.border, background: SC.surfaceDim }}>
                <MiniLabel>{m.label}</MiniLabel>
                <div className="text-lg font-bold mt-1" style={{ color: SC.text }}>{m.count}</div>
              </Link>
            ))}
          </div>
        </Card>

        {/* ERP Sync */}
        <Card accent={SC.blue}>
          <h2 className="text-base font-semibold mb-3">ERP Sync · 系統同步狀態</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "ERP（鼎新 iGP）", status: "good" as const, last: "3 min ago", note: "唯讀 · 6 jobs OK" },
              { label: "MES",             status: "warn" as const, last: "15 min ago", note: "1 job 延遲" },
              { label: "WMS",             status: "good" as const, last: "5 min ago", note: "正常" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border p-3" style={{ borderColor: SC.border }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold"><StatusDot tone={s.status} />{s.label}</span>
                  <span className="text-[10px] font-mono" style={{ color: SC.textSub }}>{s.last}</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: SC.textSub }}>{s.note}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/erp/admin/sync" className="text-[11px] font-semibold" style={{ color: SC.blue }}>→ 完整同步儀表板</Link>
          </div>
        </Card>

        {/* Data Quality */}
        <Card accent={SC.amber}>
          <h2 className="text-base font-semibold mb-3">Data Quality · 資料品質</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "重覆資料", count: 18, tone: SC.amber, sample: "供應商 12 / 料號 6" },
              { label: "缺漏資料", count: 35, tone: SC.red,   sample: "BOM 未指定 32 / 規格缺 3" },
              { label: "異常資料", count: 7,  tone: SC.red,   sample: "單價負值 / 數量 = 0" },
            ].map((q) => (
              <div key={q.label} className="rounded-md border p-3" style={{ borderColor: SC.border, borderLeft: `4px solid ${q.tone}` }}>
                <MiniLabel>{q.label}</MiniLabel>
                <div className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: q.tone }}>{q.count}</div>
                <div className="text-[10px] mt-1" style={{ color: SC.textSub }}>{q.sample}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 已完成頁面（admin 入口） */}
        <Card accent={SC.outline}>
          <h2 className="text-base font-semibold mb-3">已完成頁面（admin 入口）</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              ["🪖 CEO War Room v1", "/erp/warroom"],
              ["🛡 Profit Defense",  "/erp/profit-defense"],
              ["📡 Requisition",     "/erp/requisition"],
              ["🔄 ERP Sync",        "/erp/admin/sync"],
              ["🛣 Roadmap",         "/roadmap"],
              ["🏛 Architecture",    "/architecture"],
              ["📋 6 Centers",       "/os"],
              ["🧠 4 Engines",       "/erp/admin/engines"],
              ["🔭 Observability",   "/erp/admin/observability"],
              ["⚡ Event Engine",     "/erp/admin/event-engine"],
              ["📚 MDM",             "/erp/admin/mdm"],
              ["🔐 RBAC",            "/erp/admin/access-control"],
              ["🤝 Negotiation",     "/erp/negotiation"],
              ["💎 Should-Cost",     "/erp/should-cost"],
              ["📅 Calendar",        "/erp/calendar"],
              ["🔮 Simulator",       "/erp/simulator"],
              ["📊 Analytics",       "/erp/analytics"],
              ["📦 Reorder",         "/erp/reorder"],
              ["🗑️ Dead Stock",      "/erp/dead-stock"],
              ["🏭 Outsource",       "/erp/outsource"],
              ["🛒 PO Generator",    "/erp/po-generator"],
              ["📥 Import",          "/erp/import"],
              ["📱 Mobile QR",       "/erp/mobile"],
              ["🔍 BOM Compare",     "/erp/bom-compare"],
            ].map(([label, href]) => (
              <Link key={href} href={href!} className="block px-3 py-2 rounded-md border hover:shadow-sm transition-shadow"
                style={{ borderColor: SC.border, background: SC.surface, color: SC.text }}>
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · System · /erp/governance</span>
          <Link href="/erp" style={{ color: SC.blue }} className="hover:underline">← L1 Executive</Link>
        </footer>
      </div>
    </div>
  );
}
