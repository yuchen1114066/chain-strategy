import Link from "next/link";
import { notFound } from "next/navigation";
import { findWorkbench, workbenchesOf, ALL_WORKBENCHES } from "@/lib/erp/workbenches";
import { getCenter, type CenterSlug } from "@/lib/erp/operations-centers";

const VALID_CENTERS: CenterSlug[] = ["supplier", "delivery", "manufacturing", "inventory", "procurement", "decision"];

export function generateStaticParams() {
  return ALL_WORKBENCHES.map((w) => ({ slug: w.center, tool: w.slug }));
}

export default async function WorkbenchPage({ params }: { params: Promise<{ slug: string; tool: string }> }) {
  const { slug, tool } = await params;
  if (!VALID_CENTERS.includes(slug as CenterSlug)) notFound();
  const wb = findWorkbench(slug as CenterSlug, tool);
  if (!wb) notFound();
  const center = getCenter(slug as CenterSlug);
  const siblings = workbenchesOf(slug as CenterSlug).filter((w) => w.slug !== tool);

  return (
    <div className="p-6 space-y-6">
      {/* 麵包屑 + 兄弟工作台切換 */}
      <nav className="flex gap-1 flex-wrap pb-3 border-b border-slate-200 items-center">
        <Link href="/erp" className="text-[11px] text-slate-500 hover:text-slate-700">Control Tower</Link>
        <span className="text-slate-300 text-xs">/</span>
        <Link href="/os" className="text-[11px] text-slate-500 hover:text-slate-700">6 Centers</Link>
        <span className="text-slate-300 text-xs">/</span>
        <Link href={`/os/${slug}`} className="text-[11px] text-cyan-700 hover:underline font-semibold">{center.titleEn}</Link>
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-[11px] text-slate-700 font-bold">{wb.titleEn}</span>
      </nav>

      {/* Hero */}
      <section className={`rounded-xl p-6 text-white bg-gradient-to-br ${center.bgGradient}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] tracking-widest uppercase opacity-80 font-bold">
              {center.titleEn} · L3 專業工作台
            </div>
            <div className="text-5xl mt-2">{wb.emoji}</div>
            <h1 className="text-3xl font-extrabold mt-2">{wb.title}</h1>
            <div className="text-lg font-bold opacity-90 mt-0.5">{wb.titleEn}</div>
            <p className="text-sm opacity-90 mt-2 leading-relaxed max-w-2xl">{wb.role}</p>
          </div>
          <code className="text-[10px] font-mono bg-white/15 px-2 py-1 rounded">/os/{wb.center}/{wb.slug}</code>
        </div>
      </section>

      {/* 主要操作 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-lg">🧰 主要操作</h2>
          {wb.fullToolHref && (
            <Link href={wb.fullToolHref}
              className="text-xs px-3 py-1.5 rounded bg-cyan-600 text-white font-bold hover:bg-cyan-700">
              {wb.fullToolLabel ?? "開啟完整工具"} →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {wb.primaryActions.map((a) => (
            <Link key={a.href} href={a.href}
              className="block rounded-lg border-2 border-slate-200 hover:border-cyan-400 p-3 bg-white transition-colors">
              <div className="text-2xl mb-1">{a.emoji}</div>
              <div className="font-bold text-sm">{a.label}</div>
              <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{a.desc}</div>
              <code className="text-[9px] font-mono text-slate-400 mt-1 block">{a.href}</code>
            </Link>
          ))}
        </div>
      </section>

      {/* 同 Center 的其他工作台 */}
      {siblings.length > 0 && (
        <section className="bg-slate-50 rounded-xl p-4">
          <div className="text-[10px] tracking-widest uppercase text-slate-500 font-bold mb-2">
            {center.titleEn} 的其他工作台
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {siblings.map((s) => (
              <Link key={s.slug} href={`/os/${s.center}/${s.slug}`}
                className="block rounded p-2 bg-white border border-slate-200 hover:border-cyan-400 transition-colors">
                <div className="text-xl">{s.emoji}</div>
                <div className="text-xs font-bold mt-1">{s.title}</div>
                <div className="text-[10px] text-slate-500">{s.titleEn}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
