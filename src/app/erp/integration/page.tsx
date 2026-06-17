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
              "✨ 推薦：使用鼎新原廠工具 C:\\ConductorX64\\Tools\\SQLTOEXCEL.exe（64-bit Release，已內建在貴司鼎新環境）",
              "建立 .sql 檔（內容 = 對應 6 個 VIEW 的 SELECT 查詢）",
              "Windows Task Scheduler 排程任務（每日 06:00 / 12:00 / 18:00）→ 呼叫 SQLTOEXCEL.exe 把 SQL 結果輸出 .xlsx 到共享資料夾（例：\\\\fileserver\\dingxin_exports）",
              "本系統 file watcher（Node.js 或 Python）偵測新檔案 → 自動 POST 到本系統 /api/import 端點",
              "適合：先半自動跑、視效果再升級到方式 A；不用 DBA 動到 SQL Server",
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

      {/* 鼎新 iGP 客戶端安裝補充 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-2">💻 鼎新 iGP 客戶端 PC 安裝補充說明</h2>
        <p className="text-xs text-slate-500 mb-3">
          <b>此節不影響本系統運作</b>（我們的 GASCC 是 server-side、唯讀串接）。
          但 PM / 採購本機要使用鼎新 iGP 操作扣帳時，Windows PC 上常遇到的 UAC 攔截問題，IT 一併處理。
        </p>
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50/60 p-4 text-sm">
          <div className="font-bold text-amber-900 mb-2">🔧 解除 Windows UAC（鼎新客戶端常見需求）</div>
          <p className="text-slate-700 mb-2 text-xs leading-relaxed">
            鼎新 ERP iGP 客戶端使用 ActiveX/COM 元件，UAC 開啟時會反覆攔截元件註冊、設定檔寫入等動作，
            導致登入失敗或單據介面異常。標準排除步驟：
          </p>
          <pre className="bg-slate-900 text-slate-100 rounded p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System
EnableLUA = 1  →  改成 0
（修改後重新開機）`}
          </pre>
          <div className="text-[11px] text-rose-700 mt-2 leading-relaxed">
            <b>⚠ 安全提醒</b>　關閉 UAC 會降低 Windows 防護層級。建議僅在內網 + 已加入網域 + 有 EPP/EDR 的 PC 上執行；
            並搭配 Group Policy 限制此設定僅套用在執行鼎新客戶端的 PC，避免擴散。
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            <b>替代方案（更安全）</b>：保持 UAC 開啟，改以「相容性模式 / 系統管理員身分執行」啟動鼎新客戶端；
            或要求鼎新原廠提供新版簽章 ActiveX 元件。
          </div>
        </div>
      </section>

      {/* SQLTOEXCEL 配方 — 方式 B 推薦做法 */}
      <section className="bg-gradient-to-br from-cyan-50 to-emerald-50 rounded-xl border-2 border-cyan-300 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[10px] tracking-widest text-cyan-700 font-bold uppercase">🛠 Recommended Setup for Tier B</div>
            <h2 className="text-lg font-extrabold">使用鼎新原廠 SQLTOEXCEL 工具的最佳配方</h2>
          </div>
          <code className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-cyan-200 text-cyan-700">
            C:\ConductorX64\Tools\SQLTOEXCEL.exe
          </code>
        </div>
        <p className="text-xs text-slate-700 mb-3 leading-relaxed">
          這個工具是鼎新原廠 64-bit 版（已在貴司 ConductorX64 安裝目錄），可執行任意 SQL 查詢直接輸出 .xlsx 檔。
          搭配 Windows 工作排程器 = <b>方式 B「排程匯出資料夾」的最省工做法</b>，IT 不用寫程式、DBA 不用動到 SQL Server。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Step n="1" title="準備 6 個 .sql 檔" desc="放在 C:\dingxin_jobs\ 內：query_po.sql / query_inv.sql / query_bom.sql / query_wo.sql / query_ship.sql / query_iqc.sql（內容 = 對應 SELECT 查詢）" />
          <Step n="2" title="設 Windows Task Scheduler" desc="6 個任務、每日 06:00 / 12:00 / 18:00 觸發。命令：SQLTOEXCEL.exe -sql query_po.sql -out \\fileserver\dingxin\po_YYYYMMDD_HHMM.xlsx" />
          <Step n="3" title="本系統開 File Watcher" desc="watch \\fileserver\dingxin\ → 新 .xlsx 進入 → 自動 POST 到 /api/import → 解析器辨識報表類型 → 寫入內部資料表" />
        </div>

        <div className="bg-slate-900 text-slate-100 rounded p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`# Windows Task Scheduler 範例命令
C:\\ConductorX64\\Tools\\SQLTOEXCEL.exe ^
  -conn "Server=192.168.16.202;Database=ChiHuaERP_PROD;Trusted_Connection=True;" ^
  -sql  "C:\\dingxin_jobs\\query_po.sql" ^
  -out  "\\\\fileserver\\dingxin\\po_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%.xlsx"

# query_po.sql 內容範例（即上方 v_chihua_purchase_order VIEW 的 SELECT）：
SELECT  c.TC008 AS po_no, c.TC011 AS supplier_id, s.MA002 AS supplier_name,
        c.TC013 AS sent_date, c.TC016 AS expected_arrival,
        d.TD004 AS part_no, d.TD008 AS qty, d.TD009 AS unit_price
FROM    PURTC c
JOIN    PURTD d ON c.TC001 = d.TD001 AND c.TC002 = d.TD002
LEFT JOIN SUPPL s ON c.TC011 = s.MA001
WHERE   c.TC013 >= DATEADD(MONTH, -3, GETDATE());`}
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded p-2 border border-cyan-200">
            <div className="font-bold text-emerald-700 mb-1">✅ 優點</div>
            <ul className="space-y-0.5 text-slate-700">
              <li>· 鼎新原廠工具、已有授權</li>
              <li>· 64-bit 穩定版（2019）</li>
              <li>· DBA 不用授權 Linked Server</li>
              <li>· 直接出 .xlsx，與我們解析器相容</li>
              <li>· 1 天內可佈署完成</li>
            </ul>
          </div>
          <div className="bg-white rounded p-2 border border-amber-200">
            <div className="font-bold text-amber-700 mb-1">⚠ 注意</div>
            <ul className="space-y-0.5 text-slate-700">
              <li>· 排程間隔最短建議 1 小時（避免 SQL 負載）</li>
              <li>· SQL 查詢只 SELECT，禁用 EXEC/INSERT/UPDATE/DELETE</li>
              <li>· 共享資料夾權限：鼎新主機可寫、本系統可讀</li>
              <li>· 大批次（&gt; 65,536 列）改用 .xlsx 而非 .xls</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 鼎新作業代號 → SQL Table 對照 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-2">📂 鼎新作業代號 → SQL Table 對照表（給 DBA 精準授權）</h2>
        <p className="text-xs text-slate-500 mb-3">
          鼎新作業代號（如 <code className="font-mono bg-slate-100 px-1 rounded">ACRI07</code> 客戶廠商關係建立）的 prefix 對應到 SQL Server 表的 schema。
          DBA 授權唯讀時，依此表選擇要開的 schema 範圍即可。確認鼎新版本：
          <b>iGP / ConductorX64（64-bit）</b>，標準路徑 <code className="font-mono">C:\ConductorX64\</code>。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { mod: "PUR* / ACR*", name: "採購 + AR 應收", tables: ["PURTC（PO 主檔）", "PURTD（PO 明細）", "PURTB（託外進貨）", "ACRMA（客戶主檔）"], for: "供應商協作入口 / ETA 預測 / 議價" },
            { mod: "INV* / IMP*", name: "庫存（含進耗存）", tables: ["INVMB（料件主檔）", "INVMC（倉別）", "INVTB（庫存量）", "IMPMI（料件異動）"], for: "缺料牆 / WMS / 收貨 Checklist" },
            { mod: "BOM*", name: "BOM 結構（多階）", tables: ["BOMMA（成品）", "BOMMB（子件）"], for: "訂單衝擊模擬 / 缺料展開" },
            { mod: "MOC*", name: "製令（含工序）", tables: ["MOCTH（製令主檔）", "MOCTI（工序）", "MOCTJ（領退料）"], for: "工單追蹤 / Critical Path / 8 階段" },
            { mod: "DELI* / EPS*", name: "出貨", tables: ["DELIH（出貨單）", "DELIB（出貨明細）", "EPSTH（出貨通知）"], for: "OTIF/OTD / 客戶交期燈號" },
            { mod: "QUA* / IQC*", name: "品質（IQC/IPQC/OQC）", tables: ["QUATH（IQC 主檔）", "QUATI（IQC 明細）", "QUATJ（不合格處理）"], for: "品質卡 / SPC / 收貨第 6 步" },
            { mod: "AP* / APR*", name: "AP 應付", tables: ["APRMA（廠商主檔）", "APRTH（應付主檔）"], for: "供應商主檔 + 付款條件" },
            { mod: "CST*", name: "成本", tables: ["CSTH（標準成本）", "CSTL（成本卡）"], for: "Should-Cost 對照 / 議價" },
          ].map((row) => (
            <div key={row.mod} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <code className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold">{row.mod}</code>
                <span className="font-bold text-sm">{row.name}</span>
              </div>
              <div className="text-[11px] text-slate-600 mb-1">
                {row.tables.map((t) => <span key={t} className="inline-block mr-2 font-mono">{t}</span>)}
              </div>
              <div className="text-[10px] text-emerald-700">本系統用於：{row.for}</div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 mt-3 bg-amber-50 border border-amber-200 rounded p-2">
          💡 <b>給 DBA 的最小授權範例</b>：
          <code className="font-mono bg-white px-1 rounded mx-1">GRANT SELECT ON SCHEMA::dbo TO chihua_readonly</code>
          後，再把 INSERT/UPDATE/DELETE 一律 DENY（雙保險）。
          或更精細：對 PURTC/PURTD/INVMB/INVMC/INVTB/BOMMA/BOMMB/MOCTH/DELIH/DELIB/QUATH/QUATI 12 張表逐張 GRANT SELECT。
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

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded p-3 border border-cyan-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
        <div className="font-bold text-sm">{title}</div>
      </div>
      <div className="text-[11px] text-slate-600 leading-relaxed">{desc}</div>
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
