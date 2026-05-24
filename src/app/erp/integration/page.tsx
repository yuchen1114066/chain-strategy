import Link from "next/link";

// 鼎新 ERP 整合說明 — 給 IT 部門照做的部署文件
// 內網 ERP 位址：http://192.168.16.202/erpsetup/

export const metadata = { title: "祺驊 GASCC — 鼎新 ERP 整合說明" };

const DINGXIN_URL = "http://192.168.16.202/erpsetup/";

export default function IntegrationPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold">🔌 鼎新 ERP 整合說明 — IT 部署文件</h1>
        <p className="text-sm text-slate-500 mt-1">
          給 IT 部門照做的串接清單　·　本系統對鼎新 <b>唯讀不回寫</b>　·　扣帳一律回 ERP 操作
        </p>
      </header>

      {/* 已知目標位址 */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">Target System Identified</div>
        <div className="text-lg font-bold mb-1">貴司鼎新 ERP iGP 內網位址</div>
        <a href={DINGXIN_URL} target="_blank" rel="noopener noreferrer"
          className="inline-block font-mono text-xl bg-slate-800/60 px-4 py-2 rounded border border-cyan-500/40 text-cyan-300 hover:bg-slate-700">
          {DINGXIN_URL}
        </a>
        <div className="text-[11px] text-slate-400 mt-2">
          ⚠ 此為內網位址，外部無法存取。所有串接動作必須由 IT 部門在公司內網執行。
        </div>
      </section>

      {/* 3 層級整合策略 */}
      <section>
        <h2 className="text-lg font-bold mb-3">📋 3 層級整合策略（依複雜度遞進）</h2>
        <div className="space-y-3">
          <Tier level="C"
            title="方式 C — 手動上傳報表（馬上能用，0 IT 投資）"
            tone="emerald"
            time="今天就能跑"
            steps={[
              "在 ERP 系統匯出標準報表（.xls / .xlsx），共支援 17 種：INVR60 / LRPR05 / INVR18 / INVR19 / BOMR05 / CSTR02 / 07 / 08 / 11 / MOCR10 / 11 / 12 / 14 / 25 / 43 / EPSR13 / IPSR02",
              "進入 /erp/import 頁，拖拽 .xls 檔",
              "系統自動辨識報表類型 + 解析資料",
              "適合：先上線跑、demo、累積戰功",
            ]}
            link="/erp/import" />

          <Tier level="B"
            title="方式 B — 排程匯出資料夾（半自動，1 天 IT 工作）"
            tone="amber"
            time="1-3 天"
            steps={[
              "在鼎新 ERP 設定排程任務（每日 06:00 / 12:00 / 18:00）匯出 17 種報表到共享資料夾",
              "在共享資料夾上架 file watcher（Node.js 或 Python 腳本）",
              "新檔案進入 → 自動 POST 到本系統 /api/import 端點",
              "適合：先半自動跑，視效果再升級到方式 A",
            ]} />

          <Tier level="A"
            title="方式 A — Linked Server 唯讀（即時，2-3 天 DBA 工作）"
            tone="cyan"
            time="2-3 天"
            steps={[
              "DBA 在鼎新 SQL Server 建立唯讀帳號（SELECT 權限 only）",
              "建立 4-6 個 SQL VIEW 對應本系統需求（PURTC、PURTD、INVMB、INVMC、INVTB、BOMMA、BOMMB、MOCTH）",
              "本系統以 Linked Server 或唯讀 ODBC 連線查詢",
              "即時拉資料（< 1 秒延遲），戰情室真實時動",
              "適合：穩定運轉一陣後升級，獲得 Phase 2+ 18 頁進階功能",
            ]} />
        </div>
      </section>

      {/* 4 個必備 SQL VIEW（方式 A 用） */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">🗄 方式 A 必備 SQL VIEW（給 DBA 照建）</h2>
        <p className="text-xs text-slate-500 mb-3">以下 6 個 VIEW 是本系統的最小資料需求；都是 SELECT only，零回寫風險。</p>
        <div className="space-y-3">
          <SqlView name="v_chihua_purchase_order" purpose="採購訂單（PO 主檔 + 明細）" tables={["PURTC（PO 主檔）", "PURTD（PO 明細）", "SUPPL（廠商主檔）"]}
            sample={`SELECT  c.TC008 AS po_no, c.TC011 AS supplier_id, s.MA002 AS supplier_name,
        c.TC013 AS sent_date, c.TC016 AS expected_arrival,
        d.TD004 AS part_no, d.TD008 AS qty, d.TD009 AS unit_price,
        d.TD011 AS received_qty, d.TD026 AS status
FROM    PURTC c
JOIN    PURTD d ON c.TC001 = d.TD001 AND c.TC002 = d.TD002
LEFT JOIN SUPPL s ON c.TC011 = s.MA001
WHERE   c.TC013 >= DATEADD(MONTH, -12, GETDATE())`} />

          <SqlView name="v_chihua_inventory" purpose="即時庫存（多倉別、多儲位）"
            tables={["INVMB（料件主檔）", "INVMC（倉別）", "INVTB（庫存量）"]}
            sample={`SELECT  m.MB001 AS part_code, m.MB002 AS part_name, m.MB004 AS spec,
        m.MB008 AS unit, c.MC001 AS warehouse, t.TB006 AS qty_on_hand,
        m.MB033 AS safety_stock, m.MB047 AS lead_days
FROM    INVMB m
LEFT JOIN INVTB t ON m.MB001 = t.TB004
LEFT JOIN INVMC c ON t.TB003 = c.MC001`} />

          <SqlView name="v_chihua_bom" purpose="BOM 結構（多階）" tables={["BOMMA（成品）", "BOMMB（子件）"]}
            sample={`SELECT  a.MA001 AS finished_code, b.MB003 AS part_code,
        b.MB004 AS qty_per_unit, b.MB005 AS scrap_rate,
        b.MB006 AS valid_from, b.MB007 AS valid_to
FROM    BOMMA a JOIN BOMMB b ON a.MA001 = b.MB001
WHERE   b.MB007 IS NULL OR b.MB007 > GETDATE()`} />

          <SqlView name="v_chihua_work_order" purpose="製令進度（含 8 階段時間）"
            tables={["MOCTH（製令主檔）", "MOCTI（製令工序）"]}
            sample={`SELECT  th.TH001 + th.TH002 AS wo_no, th.TH004 AS finished_code,
        th.TH008 AS planned_qty, th.TH010 AS produced_qty,
        th.TH012 AS plan_start_date, th.TH013 AS plan_end_date,
        th.TH014 AS actual_start, th.TH015 AS actual_end,
        th.TH049 AS status
FROM    MOCTH th
WHERE   th.TH049 IN ('生產中', '規劃中', '待領料')`} />

          <SqlView name="v_chihua_shipment" purpose="出貨通知 + 託外進貨"
            tables={["DELIH（出貨單）", "DELIB（出貨明細）", "PURTB（託外進貨）"]}
            sample={`SELECT  TH001 AS ship_no, TH010 AS customer, TH011 AS ship_date,
        TB004 AS part_code, TB008 AS qty, TB011 AS tracking_no
FROM    DELIH JOIN DELIB ON TH001 = TB001 AND TH002 = TB002
WHERE   TH011 >= DATEADD(MONTH, -6, GETDATE())`} />

          <SqlView name="v_chihua_iqc_quality" purpose="進料 IQC 品質紀錄（給品質卡用）"
            tables={["QUATH（IQC 主檔）", "QUATI（IQC 明細）"]}
            sample={`SELECT  TH001 AS iqc_no, TH011 AS po_no, TH013 AS check_date,
        TI004 AS part_code, TI008 AS check_qty, TI010 AS pass_qty,
        TI011 AS defect_qty, TI015 AS reject_reason
FROM    QUATH JOIN QUATI ON TH001 = TI001 AND TH002 = TI002
WHERE   TH013 >= DATEADD(MONTH, -12, GETDATE())`} />
        </div>
        <div className="mt-3 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <b>⚠ DBA 注意事項</b>
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            <li>本系統<b>只 SELECT，零 INSERT/UPDATE/DELETE</b></li>
            <li>不呼叫任何鼎新 Stored Procedure</li>
            <li>不直接寫入鼎新 axmt450 系列表；扣帳一律回 ERP 操作介面</li>
            <li>建議建立專屬唯讀帳號 <code className="font-mono bg-white px-1 rounded">chihua_readonly</code>，僅授權上述 6 個 VIEW</li>
          </ul>
        </div>
      </section>

      {/* 連線設定範本 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">⚙️ 本系統 .env 連線設定（IT 填這個）</h2>
        <pre className="bg-slate-900 text-slate-100 rounded p-4 text-xs font-mono overflow-x-auto">
{`# === 鼎新 ERP 串接（方式 A：Linked Server / ODBC）===
DINGXIN_ERP_URL=${DINGXIN_URL}
DINGXIN_DB_HOST=192.168.16.202
DINGXIN_DB_PORT=1433
DINGXIN_DB_NAME=ChiHuaERP_PROD
DINGXIN_DB_USER=chihua_readonly
DINGXIN_DB_PASSWORD=<請 DBA 設定>
DINGXIN_DB_DRIVER=mssql

# === 鼎新 ERP 串接（方式 B：檔案監聽）===
DINGXIN_EXPORT_FOLDER=\\\\fileserver\\dingxin_exports
DINGXIN_POLL_INTERVAL=300

# === 鼎新 ERP 串接（方式 C：手動上傳）===
# 不需任何環境變數，使用者直接到 /erp/import 拖拽即可`}
        </pre>
      </section>

      {/* 部署 checklist */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">✅ 上線檢核清單</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Checklist title="技術" items={[
            "npm install + npm run build 通過",
            "Next.js 16 + Node 20 環境",
            "內網主機可訪問 192.168.16.202",
            "DNS 設 erp.chihua.local（選）",
          ]} />
          <Checklist title="資料" items={[
            "5 頁均以 seed 跑得通（demo）",
            "/erp/import 拖鼎新報表驗證",
            "INVR19 庫存報表 demo 用",
            "確認所有 .xls 65536 行限制",
          ]} />
          <Checklist title="教育" items={[
            "採購主管 1 對 1 帶 15 分鐘",
            "PM / 業務主管簡報 30 分鐘",
            "老闆 / 副總 15 分鐘 demo",
            "供應商提交入口培訓",
          ]} />
        </div>
      </section>

      <p className="text-[11px] text-slate-500 bg-slate-50 rounded p-3 leading-relaxed">
        <b>建議路徑</b>　1) 用方式 C（手動上傳）先上線跑 1-2 週累積戰功 → 2) 若 IT 有資源轉方式 B → 3) 戰功達標後找 IT 主管推方式 A（即時整合，解鎖 Phase 2+ 18 頁進階功能）。
        詳細部署文件 + 17 種報表解析器原始碼皆已 commit 在本 branch。
      </p>

      <div className="flex gap-2 flex-wrap">
        <Link href="/erp" className="px-4 py-2 text-sm rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-700">
          🎯 回戰情室
        </Link>
        <Link href="/erp/import" className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
          📥 鼎新報表匯入頁
        </Link>
        <a href={DINGXIN_URL} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 text-sm rounded-md border border-cyan-300 text-cyan-700 font-semibold hover:bg-cyan-50">
          🔗 開啟鼎新 ERP iGP 設定頁
        </a>
      </div>
    </div>
  );
}

function Tier({ level, title, tone, time, steps, link }: {
  level: string; title: string; tone: "emerald" | "amber" | "cyan"; time: string; steps: string[]; link?: string;
}) {
  const c = {
    emerald: "border-emerald-300 bg-emerald-50/40",
    amber: "border-amber-300 bg-amber-50/40",
    cyan: "border-cyan-300 bg-cyan-50/40",
  }[tone];
  const chip = {
    emerald: "bg-emerald-600",
    amber: "bg-amber-500",
    cyan: "bg-cyan-600",
  }[tone];
  return (
    <div className={`rounded-xl border-2 ${c} p-4`}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-10 h-10 rounded-lg ${chip} text-white font-extrabold text-xl flex items-center justify-center`}>
            {level}
          </span>
          <div className="font-bold text-base">{title}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold">⏱ {time}</span>
      </div>
      <ol className="space-y-1 ml-2">
        {steps.map((s, i) => (
          <li key={i} className="text-sm text-slate-700 flex gap-2">
            <span className="text-slate-400 font-mono shrink-0">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {link && (
        <Link href={link} className="inline-block mt-2 text-xs text-cyan-700 font-semibold hover:underline">
          → 開啟此功能
        </Link>
      )}
    </div>
  );
}

function SqlView({ name, purpose, tables, sample }: { name: string; purpose: string; tables: string[]; sample: string }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer px-4 py-3 hover:bg-slate-100 rounded-lg">
        <span className="font-mono text-sm font-bold text-cyan-700">{name}</span>
        <span className="text-sm text-slate-600 ml-2">— {purpose}</span>
        <div className="text-[10px] text-slate-500 mt-0.5">底層表：{tables.join("、")}</div>
      </summary>
      <pre className="bg-slate-900 text-slate-100 mx-3 mb-3 p-3 rounded text-[11px] font-mono overflow-x-auto leading-relaxed">{sample}</pre>
    </details>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="font-bold text-sm mb-1.5">{title}</div>
      <ul className="space-y-1">
        {items.map((x, i) => (
          <li key={i} className="text-xs text-slate-700 flex items-start gap-1">
            <span className="text-slate-300 shrink-0 mt-0.5">☐</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
