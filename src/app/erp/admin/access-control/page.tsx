import Link from "next/link";
import { ROLE_PERMS, ABAC_RULES, RBAC_VS_ABAC, ACCESS_MATRIX, type Role } from "@/lib/erp/rbac-abac";

// RBAC + ABAC 權限控制架構 — 致命缺口 3 補上
//   供應商不能看到彼此資料、CEO 拍板需公開化、業務只看自家客戶...

export default function AccessControlPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🔐 權限控制架構 — RBAC + ABAC</h1>
          <p className="text-sm text-slate-500 mt-1">
            大型企業系統最核心的底層之一　·　供應商不能看到彼此資料
          </p>
        </div>
        <Link href="/erp/admin" className="text-cyan-700 hover:underline text-sm">← 回管理後台</Link>
      </header>

      {/* 為什麼需要 */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4">
        <div className="font-bold text-amber-900 mb-1">⚠ 致命缺口 3：沒有 RBAC + ABAC = 供應商可能看到競爭對手資料</div>
        <p className="text-sm text-slate-700 leading-relaxed">
          您正在做的是「供應商平台 + AI 決策系統」。只要有 <b>供應商 / 採購 / 價格 / 品質 / 庫存 / 客戶</b>，
          就必須有完整權限架構。<b>RBAC（角色）+ ABAC（條件）兩層搭配才能勝任</b>。
        </p>
      </section>

      {/* RBAC vs ABAC 對照 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-cyan-50 border-2 border-cyan-300 rounded-xl p-4">
          <div className="font-bold text-cyan-900 mb-1">🎭 RBAC — Role-Based Access Control</div>
          <div className="text-xs text-slate-600 mb-2">「依角色決定權限」— 第一層、靜態、簡單</div>
          <div className="text-sm text-slate-700">
            例：採購可看所有 PO；供應商只能看自家 PO；倉管只能進收貨頁。
            <br />適合：固定組織分工、權限變動少的場景。
          </div>
        </div>
        <div className="bg-violet-50 border-2 border-violet-300 rounded-xl p-4">
          <div className="font-bold text-violet-900 mb-1">⚙️ ABAC — Attribute-Based Access Control</div>
          <div className="text-xs text-slate-600 mb-2">「根據情境動態控權」— 第二層、動態、彈性高</div>
          <div className="text-sm text-slate-700">
            例：供應商 A + 該 PO supplier_id == A → 可看；夜間倉管試圖入庫 → 禁；CEO 拍板必須記名。
            <br />適合：條件複雜、多租戶、大型 AI 平台。
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">📊 RBAC vs ABAC 差異對照</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs">
            <tr>
              <th className="text-left px-3 py-2">比較項</th>
              <th className="text-left px-3 py-2">RBAC</th>
              <th className="text-left px-3 py-2">ABAC</th>
            </tr>
          </thead>
          <tbody>
            {RBAC_VS_ABAC.map((r) => (
              <tr key={r.aspect} className="border-t border-slate-100">
                <td className="px-3 py-2 font-bold text-slate-700">{r.aspect}</td>
                <td className="px-3 py-2 text-cyan-700 font-mono text-xs">{r.rbac}</td>
                <td className="px-3 py-2 text-violet-700 font-mono text-xs">{r.abac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 10 個角色 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">👥 10 個角色（RBAC 第一層）</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(ROLE_PERMS) as Role[]).map((k) => {
            const r = ROLE_PERMS[k];
            return (
              <div key={k} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <div className="font-bold text-sm">{r.label}</div>
                    <code className="text-[10px] font-mono text-slate-500">{k}</code>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{r.description}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.scopes.map((s) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-600 font-mono">{s}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ABAC 規則 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">⚙️ 8 條 ABAC 動態規則（第二層）</h2>
        <div className="space-y-2">
          {ABAC_RULES.map((r) => (
            <div key={r.id} className={`rounded-lg border-2 p-3 ${
              r.effect === "allow" ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
            }`}>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[10px] text-slate-500">{r.id}</code>
                  <span className="font-bold text-sm">{r.name}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold ${
                  r.effect === "allow" ? "bg-emerald-600" : "bg-rose-600"
                }`}>{r.effect.toUpperCase()}</span>
              </div>
              <div className="text-xs text-slate-700 mb-1">{r.description}</div>
              <div className="text-[11px] text-slate-500">
                <span className="font-bold">When：</span>
                {r.whenRole.map((rl) => (
                  <code key={rl} className="font-mono ml-1 px-1.5 py-0.5 rounded bg-white border border-slate-200">{rl}</code>
                ))}
                <span className="ml-3 font-bold">Condition：</span>
                <code className="font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-100">{r.condition}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 模組 × 角色 權限矩陣 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">🗂 模組 × 角色 權限矩陣</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-2 py-2 sticky left-0 bg-slate-50">模組</th>
                {(Object.keys(ROLE_PERMS) as Role[]).map((r) => (
                  <th key={r} className="text-center px-1 py-2" title={ROLE_PERMS[r].label}>
                    {ROLE_PERMS[r].emoji}
                    <div className="text-[9px] font-normal text-slate-400">{r}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACCESS_MATRIX.map((m) => (
                <tr key={m.module} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-1.5 sticky left-0 bg-white">
                    <Link href={m.href} className="text-cyan-700 hover:underline font-semibold">{m.module}</Link>
                  </td>
                  {(Object.keys(ROLE_PERMS) as Role[]).map((r) => {
                    const p = m.permissions[r];
                    return (
                      <td key={r} className="text-center px-1 py-1.5">
                        {p === "RW" ? <span className="text-emerald-600 font-bold">RW</span>
                          : p === "R" ? <span className="text-cyan-600 font-bold">R</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          <b className="text-emerald-600">RW</b> = 讀+寫　·　<b className="text-cyan-600">R</b> = 唯讀　·　— = 無權限
        </div>
      </section>

      <section className="bg-slate-900 text-white rounded-xl p-5 border border-slate-700">
        <div className="text-xs font-bold tracking-widest uppercase text-cyan-400 mb-2">部署建議</div>
        <ul className="text-sm space-y-1">
          <li>· <b>第一階段（v1.0）</b>：先做 RBAC 10 角色（內網 SSO + Active Directory）</li>
          <li>· <b>第二階段（v1.1）</b>：加 ABAC 條件規則引擎（OPA / CASL.js）</li>
          <li>· <b>第三階段（v1.2）</b>：審計日誌 + 異常存取偵測 + 異地登入告警</li>
          <li>· <b>對接</b>：可整合公司 Active Directory / Azure AD / Google Workspace SSO</li>
          <li>· <b>供應商外部使用者</b>：用 Magic Link Email 登入 + ABAC 鎖定 supplier_id</li>
        </ul>
      </section>
    </div>
  );
}
