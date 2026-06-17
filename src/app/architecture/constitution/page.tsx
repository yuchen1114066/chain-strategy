import Link from "next/link";
import { FIVE_IRON_LAWS, DOMAINS, DOMAIN_RULE } from "@/lib/erp/architecture-constitution";

// 架構憲法 — 5 條鐵律 + Domain Boundaries

export default function ConstitutionPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "linear-gradient(135deg,#0a0e1a 0%,#1a0f1a 100%)" }}>
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <header className="border-b-2 border-rose-500/40 pb-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-rose-400 font-bold">ARCHITECTURAL CONSTITUTION · 不可違反原則</div>
          <h1 className="text-3xl font-extrabold mt-2">📜 架構憲法 — 5 條鐵律 + Domain Boundaries</h1>
          <p className="text-sm text-slate-400 mt-1">系統的不可違反原則。任何新功能 / 新模組 / 新整合必須遵守。違反 = 系統爛掉。</p>
        </header>

        {/* 5 條鐵律警示 */}
        <section className="rounded-xl border-2 border-amber-400 bg-amber-900/30 p-4">
          <div className="font-bold text-amber-200 mb-2 text-lg">⚖️ 5 條鐵律總綱</div>
          <ol className="text-sm space-y-1.5">
            {FIVE_IRON_LAWS.map((l) => (
              <li key={l.n} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center font-extrabold text-white shrink-0">{l.n}</span>
                <div className="flex-1">
                  <span className="font-bold">{l.title}</span>
                  <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-rose-700/50 text-rose-200">{l.importance}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 5 條鐵律詳細 */}
        {FIVE_IRON_LAWS.map((l) => (
          <section key={l.n} className="rounded-xl border-2 border-slate-700 bg-slate-900/60 p-5">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-14 h-14 rounded-xl bg-rose-600 flex items-center justify-center text-3xl font-black shrink-0">{l.n}</div>
              <div>
                <div className="text-[10px] tracking-[0.3em] text-rose-400 font-bold uppercase">鐵律 {l.n}</div>
                <h2 className="text-2xl font-extrabold mt-1">{l.title}</h2>
                <div className="text-xs text-amber-300 font-bold mt-1">{l.importance}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="bg-rose-950/40 border-2 border-rose-500/30 rounded p-3">
                <div className="text-[10px] tracking-widest text-rose-400 font-bold uppercase mb-2">❌ 禁止</div>
                <ul className="space-y-1">
                  {l.forbidden.map((x) => (
                    <li key={x} className="text-sm text-rose-200 flex items-start gap-2">
                      <span className="text-rose-500 shrink-0">✗</span><span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-950/40 border-2 border-emerald-500/30 rounded p-3">
                <div className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase mb-2">✅ 必須</div>
                <ul className="space-y-1">
                  {l.required.map((x) => (
                    <li key={x} className="text-sm text-emerald-200 flex items-start gap-2">
                      <span className="text-emerald-500 shrink-0">✓</span><span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {l.example && (
              <div className="mt-3 bg-slate-800/60 rounded p-3 border border-slate-700">
                <div className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mb-2">範例</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-rose-400 font-bold mb-1">❌ 錯誤</div>
                    <code className="text-xs font-mono text-rose-200 bg-rose-950/40 px-2 py-1 rounded block">{l.example.wrong}</code>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold mb-1">✅ 正確</div>
                    <code className="text-xs font-mono text-emerald-200 bg-emerald-950/40 px-2 py-1 rounded block">{l.example.right}</code>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded p-3">
                <div className="text-[10px] tracking-widest text-cyan-400 font-bold uppercase mb-1">為什麼重要</div>
                <div className="text-sm text-slate-200">{l.reason}</div>
              </div>
              <div className="bg-rose-950/30 border border-rose-500/30 rounded p-3">
                <div className="text-[10px] tracking-widest text-rose-400 font-bold uppercase mb-1">違反的後果</div>
                <div className="text-sm text-slate-200">{l.consequence}</div>
              </div>
            </div>
          </section>
        ))}

        {/* === Domain Boundaries === */}
        <section className="rounded-xl border-2 border-cyan-500/40 bg-cyan-950/30 p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-cyan-300 font-bold mb-2">DOMAIN BOUNDARIES · 超重要</div>
          <h2 className="text-2xl font-extrabold mb-3">🗺 領域邊界（Domain Boundaries）</h2>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">{DOMAIN_RULE.trim().split("\n")[0]}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {DOMAINS.map((d) => (
              <div key={d.name} className="rounded-lg p-4 border-2"
                style={{ borderColor: d.color + "70", background: d.color + "15" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{d.emoji}</span>
                  <code className="text-[9px] font-mono text-slate-400 opacity-70">{d.entities.length} entities</code>
                </div>
                <h3 className="font-extrabold text-lg" style={{ color: d.color }}>{d.name}</h3>
                <div className="text-xs text-slate-300 mt-1">{d.responsibility}</div>

                <div className="mt-3 space-y-2">
                  <div>
                    <div className="text-[9px] tracking-widest text-slate-400 font-bold uppercase mb-1">擁有 Entities</div>
                    <div className="flex flex-wrap gap-1">
                      {d.entities.map((e) => (
                        <code key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300">{e}</code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-widest text-emerald-400 font-bold uppercase mb-1">📤 對外 Emit</div>
                    <div className="flex flex-wrap gap-1">
                      {d.publishesEvents.slice(0, 3).map((e) => (
                        <code key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300">{e}</code>
                      ))}
                      {d.publishesEvents.length > 3 && <span className="text-[9px] text-slate-500">+{d.publishesEvents.length - 3}</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-widest text-cyan-400 font-bold uppercase mb-1">📥 訂閱 Subscribe</div>
                    <div className="flex flex-wrap gap-1">
                      {d.subscribesTo.slice(0, 2).map((e) => (
                        <code key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300">{e}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/60 rounded-lg p-4 border-l-4 border-amber-500 mt-4">
            <pre className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">{DOMAIN_RULE.trim()}</pre>
          </div>
        </section>

        {/* 違反後果總結 */}
        <section className="rounded-xl bg-rose-900/40 border-2 border-rose-500/50 p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-rose-300 font-bold mb-2">違反憲法的後果</div>
          <h3 className="text-xl font-extrabold mb-3">❌ 違反這 5 條 = 系統崩壞</h3>
          <ul className="text-sm space-y-1 text-slate-200">
            <li>· 違反 #1（Event-Driven）→ N² 耦合，永遠改不動</li>
            <li>· 違反 #2（UI 不准業務邏輯）→ 每頁算法不同、KPI 失真</li>
            <li>· 違反 #3（AI Centralized）→ AI 互相矛盾、老闆不信任</li>
            <li>· 違反 #4（Source of Truth）→ 資料漂移、AI 開始亂掉</li>
            <li>· 違反 #5（可追溯）→ AI 變黑箱、合規過不了、出事沒人擔</li>
          </ul>
          <div className="mt-3 text-amber-200 font-bold text-sm">
            ⚠ 任何 PR / Code Review 都必須驗證這 5 條。違反就 BLOCK，不容妥協。
          </div>
        </section>

        <nav className="flex gap-3 pt-4 border-t border-slate-700">
          <Link href="/architecture" className="text-sm text-cyan-400 hover:underline">← 回 5-Layer 架構</Link>
          <Link href="/erp" className="text-sm text-cyan-400 hover:underline">→ 軍事指揮中心</Link>
        </nav>
      </div>
    </div>
  );
}
