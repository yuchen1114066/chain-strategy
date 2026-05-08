export default function ImportPage() {
  return (
    <div className="p-6 max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">📥 Excel 匯入</h1>
        <p className="text-sm text-slate-500 mt-1">
          對接 WorkFlow ERP iGP 匯出的成本評估表 + 採購零件表
        </p>
      </header>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">來源檔對應</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">成品表</div>
            <div className="font-mono text-sm mt-1 break-all">
              Q:\採購課\成品成本分析\2026成本評估
            </div>
            <div className="mt-2 text-xs text-slate-600">
              預期欄位：型號代碼 / 型號名稱 / 售價 / 標準成本 / 分類
            </div>
            <div className="mt-2 text-xs text-cyan-700">→ erp_models</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">零件表 / 採購追蹤</div>
            <div className="font-mono text-sm mt-1 break-all">
              R:\業務&採購協調追蹤\2026成本評估
            </div>
            <div className="mt-2 text-xs text-slate-600">
              預期欄位：料號 / 名稱 / 單價 / 供應商 / 交期 / 庫存 / 安全庫存
            </div>
            <div className="mt-2 text-xs text-cyan-700">→ erp_parts + erp_suppliers</div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold mb-3">匯入流程</h2>
        <ol className="list-decimal list-inside text-sm space-y-2 text-slate-700">
          <li>點擊下方按鈕上傳 .xlsx</li>
          <li>系統解析欄位、自動模糊比對既有料號 / 型號</li>
          <li>顯示 <b>BOM 連線拉線介面</b>：左欄型號、右欄零件，拉線標註用量</li>
          <li>預覽 / 確認後寫入 erp_models / erp_parts / erp_bom</li>
          <li>自動執行缺料計算、刷新戰情室警訊</li>
        </ol>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
          <div className="text-5xl mb-3">📊</div>
          <div className="font-medium text-slate-700">拖曳 Excel 檔到此處或</div>
          <button
            disabled
            className="mt-3 px-4 py-2 rounded-md bg-slate-300 text-slate-600 cursor-not-allowed text-sm"
          >
            選擇檔案（待你提供欄位範例後啟用）
          </button>
          <div className="text-xs text-slate-500 mt-3">
            目前 demo 使用內建 seed 資料（3 個型號 / 15 個零件 / 5 家供應商 / 4 張工單）
          </div>
        </div>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <b>需要你提供：</b>把 <code className="font-mono">〔總表完成〕Q:\採購課\成品成本分析\2026成本評估</code> 的
        欄位標題列截圖或貼上來，我才能精準對應到 erp_models / erp_parts。
      </section>
    </div>
  );
}
