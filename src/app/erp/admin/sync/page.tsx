import "../../luminous.css";
import Link from "next/link";
import { health, getQueryAudit, maskedConfig } from "@/lib/erp/connector";
import { listRuns, lastRun, SYNC_JOBS } from "@/lib/erp/sync-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "ERP Sync · 鼎新同步儀表板" };

function fmtMs(ms?: number): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtAgo(iso?: string): string {
  if (!iso) return "從未";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  return `${Math.floor(hr / 24)} 天前`;
}

export default async function ErpSyncPage() {
  const h = await health();
  const cfg = maskedConfig();
  const runs = listRuns();
  const last = lastRun();
  const audit = getQueryAudit().slice(0, 20);

  const modeColor = h.mode === "live" ? "border-emerald-400/40 lm-glow-soft" : "border-amber-400/40 lm-glow-amber";
  const modeText  = h.mode === "live" ? "text-emerald-300" : "text-amber-300";

  return (
    <div className="luminous min-h-screen text-slate-100 relative overflow-hidden">
      <div className="lm-grid-bg" />
      <div className="lm-noise" />
      <div className="lm-aurora lm-aurora-1" />
      <div className="lm-aurora lm-aurora-2" />

      <div className="relative z-10 px-4 sm:px-8 py-8 max-w-[1400px] mx-auto space-y-8">
        {/* Hero */}
        <header className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-[0.25em] font-bold text-cyan-300/80">
            <Link href="/erp" className="hover:text-cyan-200">← Control Tower</Link>
            <span className="opacity-40">/</span>
            <Link href="/erp/admin" className="hover:text-cyan-200">Admin</Link>
            <span className="opacity-40">/</span>
            <span>ERP Sync</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
            <span className="lm-text-glow">鼎新 ERP</span>{" "}
            <span className="text-cyan-300/70">Sync Dashboard.</span>
          </h1>
          <p className="text-sm text-slate-300/80 max-w-3xl">
            唯讀拉取鼎新 iGP（SQL Server）資料快照，每筆查詢都過 <code className="font-mono text-cyan-300">assertReadOnly</code> 鐵律檢核 — 禁 INSERT/UPDATE/DELETE/EXEC/sp_*。
          </p>
        </header>

        {/* Connector Health */}
        <section className="grid lg:grid-cols-[1fr,1fr] gap-4">
          <div className={`lm-glass rounded-xl border ${modeColor} p-5 space-y-3`}>
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="font-display text-lg font-semibold">Connector Health</h2>
              <span className={`lm-chip text-[10px] px-2 py-0.5 ${modeText}`}>{h.mode.toUpperCase()}</span>
            </div>
            <div className="text-sm text-slate-200">{h.message}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-slate-500">Host</dt><dd className="font-mono text-slate-200">{cfg.host || "(未設定)"}</dd>
              <dt className="text-slate-500">Database</dt><dd className="font-mono text-slate-200">{cfg.database || "(未設定)"}</dd>
              <dt className="text-slate-500">Port</dt><dd className="font-mono text-slate-200">{cfg.port}</dd>
              <dt className="text-slate-500">User</dt><dd className="font-mono text-slate-200">{cfg.user || "(未設定)"}</dd>
              <dt className="text-slate-500">Read-only enforced</dt><dd className={h.readOnlyEnforced ? "text-emerald-300" : "text-rose-300"}>{h.readOnlyEnforced ? "✓ YES" : "✗ NO"}</dd>
              <dt className="text-slate-500">mssql driver</dt><dd className={h.driverAvailable ? "text-emerald-300" : "text-amber-300"}>{h.driverAvailable ? "✓ Installed" : "○ Not installed"}</dd>
            </dl>
            {!h.driverAvailable && h.mode === "live" && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-200">
                ⚠ 環境變數已設定，但 <code className="font-mono">mssql</code> driver 未安裝。執行：<code className="font-mono">npm i mssql</code>
              </div>
            )}
          </div>

          <div className="lm-glass rounded-xl border border-cyan-400/20 p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold">最近一次同步</h2>
            {last ? (
              <>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="font-mono text-xs text-slate-400">{last.id}</div>
                  <span className={`lm-chip text-[10px] px-2 py-0.5 ${
                    last.status === "success" ? "text-emerald-300" :
                    last.status === "partial" ? "text-amber-300"   :
                                                 "text-rose-300"
                  }`}>{last.status.toUpperCase()}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <dt className="text-slate-500">觸發</dt><dd className="text-slate-200">{last.triggeredBy === "cron" ? "🕒 cron" : "👤 manual"}</dd>
                  <dt className="text-slate-500">時間</dt><dd className="text-slate-200">{fmtAgo(last.startedAt)}</dd>
                  <dt className="text-slate-500">耗時</dt><dd className="font-mono text-slate-200">{fmtMs(last.durationMs)}</dd>
                  <dt className="text-slate-500">總筆數</dt><dd className="font-mono text-cyan-300">{last.totalRows.toLocaleString()}</dd>
                </dl>
              </>
            ) : (
              <div className="text-sm text-slate-500">尚未執行過同步。下方點「立即同步」開始。</div>
            )}
            <form action="/api/sync/erp" method="post">
              <button
                type="submit"
                className="lm-chip lm-chip-purple text-xs px-3 py-1.5 mt-2"
              >
                ▶ 立即同步（manual）
              </button>
            </form>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              cron 設定範例：<br />
              <code className="font-mono text-slate-400">*/10 * * * * curl -X POST -H &quot;Authorization: Bearer $TOPGP_SYNC_TOKEN&quot; /api/sync/erp?by=cron</code>
            </div>
          </div>
        </section>

        {/* Sync Jobs Config */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">同步任務矩陣（{SYNC_JOBS.length} jobs）</h2>
          <div className="lm-glass rounded-xl border border-cyan-400/15 overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">SQL（唯讀）</th>
                  <th className="px-3 py-2 text-right">最近 rows</th>
                  <th className="px-3 py-2 text-right">最近 ms</th>
                </tr>
              </thead>
              <tbody>
                {SYNC_JOBS.map((job) => {
                  const r = last?.jobs.find((j) => j.name === job.name);
                  return (
                    <tr key={job.name} className="border-b border-slate-800/60">
                      <td className="px-3 py-2 font-mono text-cyan-300">{job.name}</td>
                      <td className="px-3 py-2 text-slate-200">{job.label}</td>
                      <td className="px-3 py-2 font-mono text-slate-400 text-[10px] truncate max-w-[420px]">{job.selectSql}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-200">{r ? r.rows : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400">{r ? fmtMs(r.durationMs) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Run History */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">執行歷史（最近 {Math.min(runs.length, 10)} 次）</h2>
          {runs.length === 0 ? (
            <div className="lm-glass rounded-xl border border-cyan-400/15 p-6 text-sm text-slate-500">尚無歷史紀錄</div>
          ) : (
            <div className="lm-glass rounded-xl border border-cyan-400/15 overflow-x-auto">
              <table className="w-full text-xs min-w-[720px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                    <th className="px-3 py-2">Run ID</th>
                    <th className="px-3 py-2">開始時間</th>
                    <th className="px-3 py-2">觸發</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2">狀態</th>
                    <th className="px-3 py-2 text-right">Rows</th>
                    <th className="px-3 py-2 text-right">耗時</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-slate-800/60">
                      <td className="px-3 py-2 font-mono text-slate-300 text-[10px]">{r.id}</td>
                      <td className="px-3 py-2 text-slate-300">{new Date(r.startedAt).toLocaleString("zh-TW")}</td>
                      <td className="px-3 py-2">{r.triggeredBy === "cron" ? "🕒" : "👤"} {r.triggeredBy}</td>
                      <td className="px-3 py-2 font-mono">{r.mode}</td>
                      <td className={`px-3 py-2 font-bold ${
                        r.status === "success" ? "text-emerald-300" :
                        r.status === "partial" ? "text-amber-300"   :
                        r.status === "failed"  ? "text-rose-300"    : "text-slate-400"
                      }`}>{r.status}</td>
                      <td className="px-3 py-2 text-right font-mono text-cyan-300">{r.totalRows}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400">{fmtMs(r.durationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Audit Log */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">查詢 Audit Log（最近 {audit.length}）</h2>
          {audit.length === 0 ? (
            <div className="lm-glass rounded-xl border border-cyan-400/15 p-6 text-sm text-slate-500">尚無查詢紀錄</div>
          ) : (
            <div className="lm-glass rounded-xl border border-cyan-400/15 p-3 space-y-1.5 max-h-[420px] overflow-y-auto">
              {audit.map((a) => (
                <div key={a.id} className={`rounded border px-3 py-2 text-xs ${
                  a.ok ? "border-slate-800/60 bg-slate-950/40" : "border-rose-400/40 bg-rose-500/5"
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-[10px] text-slate-500">{a.id}</span>
                    <span className="font-mono text-[10px] text-slate-400">{new Date(a.at).toLocaleTimeString("zh-TW")} · {a.mode} · {fmtMs(a.durationMs)} · {a.rows} rows</span>
                  </div>
                  <pre className={`font-mono text-[10px] mt-1 whitespace-pre-wrap break-all ${a.ok ? "text-slate-300" : "text-rose-200"}`}>{a.query}</pre>
                  {a.error && <div className="text-[10px] text-rose-300 mt-1">⚠ {a.error}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Iron Laws */}
        <section className="lm-glass rounded-xl border border-amber-400/30 p-5">
          <h2 className="font-display text-lg font-semibold text-amber-200 mb-3">⚖ 鼎新整合鐵律</h2>
          <ul className="text-sm text-slate-200 space-y-1.5 leading-relaxed">
            <li>✓ 唯讀（SELECT / WITH 起首才放行）</li>
            <li>✓ 禁 INSERT / UPDATE / DELETE / MERGE / TRUNCATE / DROP / ALTER / CREATE</li>
            <li>✓ 禁 EXEC / CALL / sp_* / xp_*（不准呼叫 Stored Procedure）</li>
            <li>✓ 禁多 statement（一次只允許一段 SELECT）</li>
            <li>✓ 每筆查詢留 Audit Log（id / mode / sql / 耗時 / rows / 錯誤）</li>
            <li>✓ 扣帳、過帳、入庫一律回鼎新介面操作</li>
          </ul>
        </section>

        <footer className="text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800/60">
          AI Supply Chain Flow · ERP Sync Dashboard · /erp/admin/sync · 對鼎新 iGP 唯讀
        </footer>
      </div>
    </div>
  );
}
