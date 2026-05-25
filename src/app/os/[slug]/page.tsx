import Link from "next/link";
import { notFound } from "next/navigation";
import { getCenter, allCenters, type CenterSlug } from "@/lib/erp/operations-centers";
import { workbenchesOf } from "@/lib/erp/workbenches";

const VALID_SLUGS: CenterSlug[] = ["supplier", "delivery", "manufacturing", "inventory", "procurement", "decision"];

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export default async function OperationsCenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug as CenterSlug)) notFound();
  const center = getCenter(slug as CenterSlug);
  const others = allCenters().filter((c) => c.slug !== slug);
  const benches = workbenchesOf(slug as CenterSlug);

  return (
    <div className="p-6 space-y-6">
      {/* 6 大作戰中心切換 */}
      <nav className="flex gap-1 flex-wrap pb-3 border-b border-slate-200">
        <Link href="/erp" className="px-3 py-1.5 text-xs rounded-md text-slate-600 hover:bg-slate-100">
          ← Control Tower
        </Link>
        {[center, ...others].sort((a, b) => VALID_SLUGS.indexOf(a.slug) - VALID_SLUGS.indexOf(b.slug)).map((c) => {
          const active = c.slug === center.slug;
          return (
            <Link key={c.slug} href={`/os/${c.slug}`}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold ${
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}>
              {c.emoji} {c.titleEn}
            </Link>
          );
        })}
      </nav>

      {/* Hero */}
      <section className={`rounded-xl p-6 text-white bg-gradient-to-br ${center.bgGradient}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] tracking-widest uppercase opacity-80 font-bold">Operations Center · /os/{center.slug}</div>
            <div className="text-4xl mt-2">{center.emoji}</div>
            <h1 className="text-3xl font-extrabold mt-2">{center.title}</h1>
            <div className="text-lg font-bold opacity-90 mt-0.5">{center.titleEn}</div>
            <p className="text-sm opacity-90 mt-2 leading-relaxed max-w-2xl">{center.role}</p>
          </div>
          <code className="text-[10px] font-mono bg-white/15 px-2 py-1 rounded">/os/{center.slug}</code>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {center.kpis.map((k) => {
          const tone = {
            good: "border-emerald-300 bg-emerald-50/50 text-emerald-700",
            warn: "border-amber-300 bg-amber-50/50 text-amber-700",
            bad:  "border-rose-400 bg-rose-50/50 text-rose-700",
            info: "border-slate-200 bg-white text-slate-700",
          }[k.tone];
          return (
            <div key={k.label} className={`rounded-lg border-2 p-3 ${tone}`}>
              <div className="text-[10px] tracking-widest text-slate-600 font-bold uppercase">{k.label}</div>
              <div className="text-2xl font-extrabold tabular-nums mt-1">{k.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </section>

      {/* Active Alerts */}
      {center.alerts.length > 0 && (
        <section className="bg-white rounded-xl border-2 border-rose-200 p-5">
          <h2 className="font-bold text-lg mb-3">
            ⚠ 待處理事項（{center.alerts.length}）
          </h2>
          <div className="space-y-2">
            {center.alerts.map((a, i) => (
              <Link key={i} href={a.href ?? "#"} className={`block rounded-lg border-2 p-3 transition-shadow hover:shadow-md ${
                a.severity === "critical" ? "border-rose-400 bg-rose-50/40" :
                a.severity === "warn" ? "border-amber-300 bg-amber-50/40" : "border-cyan-200 bg-cyan-50/40"
              }`}>
                <div className="text-sm">{a.text}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* L3 專業工作台（新） */}
      <section className="bg-white rounded-xl border-2 border-cyan-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-lg">🛠 L3 專業工作台 — 真正操作頁（{benches.length}）</h2>
            <p className="text-xs text-slate-500 mt-0.5">每個工作台聚焦一個工作流程，URL：/os/{center.slug}/{"{tool}"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {benches.map((b) => (
            <Link key={b.slug} href={`/os/${b.center}/${b.slug}`}
              className="block rounded-lg border-2 border-slate-200 hover:border-cyan-400 p-3 transition-colors bg-white">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-2xl">{b.emoji}</div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold">L3</span>
              </div>
              <div className="font-bold text-sm">{b.title}</div>
              <div className="text-[11px] font-bold text-cyan-700">{b.titleEn}</div>
              <div className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">{b.role}</div>
              <code className="text-[9px] font-mono text-slate-400 mt-1 block">/os/{b.center}/{b.slug}</code>
            </Link>
          ))}
        </div>
      </section>

      {/* 快速跳轉工具（保留 deep links） */}
      <section className="bg-slate-50 rounded-xl p-4">
        <div className="text-[10px] tracking-widest uppercase text-slate-500 font-bold mb-2">⚡ 快速跳轉（直接到工具）</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {center.links.map((l) => (
            <Link key={l.href} href={l.href}
              className="block rounded p-2 bg-white border border-slate-200 hover:border-cyan-400 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">{l.emoji}</span>
                <span className="font-bold text-xs">{l.label}</span>
                {l.badge && (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    l.badgeTone === "rose" ? "bg-rose-100 text-rose-700" :
                    l.badgeTone === "amber" ? "bg-amber-100 text-amber-700" :
                    l.badgeTone === "cyan" ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"
                  }`}>{l.badge}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-center navigation */}
      <section className="bg-slate-50 rounded-xl p-4">
        <div className="text-[10px] tracking-widest uppercase text-slate-500 font-bold mb-2">其他作戰中心</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {others.map((c) => (
            <Link key={c.slug} href={`/os/${c.slug}`}
              className="block rounded p-2 bg-white border border-slate-200 hover:border-cyan-400 transition-colors">
              <div className="text-xl">{c.emoji}</div>
              <div className="text-xs font-bold mt-1">{c.titleEn}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
