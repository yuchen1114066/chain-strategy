import Link from "next/link";
import { today } from "@/lib/erp/seed";
import { forecastAll, computeOTD, blamingSuppliers } from "@/lib/erp/otif";
import { topDecisions, type DecisionAction } from "@/lib/erp/decision-engine";
import { computeShortageWall } from "@/lib/erp/shortage-ai";
import { equipmentUtilization } from "@/lib/erp/critical-path";
import { commodities, priceZone } from "@/lib/erp/commodities";
import { unconfirmedPOs, missingASNs, earlyWarningSignals, digitalPOs } from "@/lib/erp/supplier-portal";
import { streamStats, recentEvents } from "@/lib/erp/event-bus";
import "./luminous.css";

// L1 軍事作戰指揮中心 — Luminous Command aesthetic
// 設計來源：Stitch / Palantir × Arc / Bioluminescent dark
// Mobile-first 響應式

type Severity = "critical" | "high" | "medium" | "low" | "safe";

function colorOf(s: Severity): string {
  return s === "critical" ? "#FF3366"
    : s === "high"        ? "#FFB020"
    : s === "medium"      ? "#00F0FF"
    : s === "low"         ? "#B026FF"
                          : "#10b981";
}

export default function CockpitPage() {
  const forecasts = forecastAll();
  const otd = computeOTD();
  const wall = computeShortageWall();
  const equip = equipmentUtilization();
  const unconf = unconfirmedPOs();
  const missAsn = missingASNs();
  const signals = earlyWarningSignals();
  const blamers = blamingSuppliers(forecasts);
  const decisions = topDecisions();
  const stream = streamStats();
  const events = recentEvents();

  // === 5 大 Hot Zones ===
  const hotZones = [
    {
      name: "缺料風險", icon: "🧱",
      count: wall.filter((w) => w.grade === "S").length,
      severity: (wall.filter((w) => w.grade === "S").length > 0 ? "critical" : wall.filter((w) => w.grade === "A").length > 0 ? "high" : "safe") as Severity,
      href: "/erp/shortage-wall",
      desc: `S 級 ${wall.filter((w) => w.grade === "S").length} · A 級 ${wall.filter((w) => w.grade === "A").length}`,
    },
    {
      name: "準交風險", icon: "🚚",
      count: forecasts.filter((f) => f.light === "red").length,
      severity: (forecasts.filter((f) => f.light === "red").length > 0 ? "critical" : forecasts.filter((f) => f.light === "yellow").length > 2 ? "high" : "safe") as Severity,
      href: "/erp/eta-forecast",
      desc: `紅燈 ${forecasts.filter((f) => f.light === "red").length} · 黃燈 ${forecasts.filter((f) => f.light === "yellow").length}`,
    },
    {
      name: "原料暴漲", icon: "🌐",
      count: commodities.filter((c) => priceZone(c).zone === "危險").length,
      severity: (commodities.filter((c) => priceZone(c).zone === "危險").length >= 2 ? "critical" : commodities.filter((c) => priceZone(c).zone === "危險").length === 1 ? "high" : "safe") as Severity,
      href: "/erp/materials",
      desc: `${commodities.filter((c) => priceZone(c).zone === "危險").length} 項過熱`,
    },
    {
      name: "品質異常", icon: "🔬",
      count: digitalPOs.reduce((s, po) => s + po.qualityReports.filter((q) => q.result === "major_defect" || q.result === "rejected").length, 0),
      severity: "high" as Severity,
      href: "/erp/supplier-portal",
      desc: `近期不良 / 退貨`,
    },
    {
      name: "供應商失控", icon: "🏭",
      count: signals.filter((s) => s.severity === "critical").length + blamers.length,
      severity: (signals.filter((s) => s.severity === "critical").length > 0 ? "critical" : "medium") as Severity,
      href: "/erp/supplier-portal/audit",
      desc: `預警 ${signals.filter((s) => s.severity === "critical").length} · 拖累 ${blamers.length}`,
    },
  ];

  // === Triage 優先序 ===
  const criticalDecisions = decisions.filter((d) => d.urgency === "now").slice(0, 3);
  const todayDecisions = decisions.filter((d) => d.urgency === "today").slice(0, 2);

  // 整體 Macro Score：以 hot zones 反推（0-100）
  const burningCount = hotZones.filter((h) => h.severity === "critical").length;
  const warningCount = hotZones.filter((h) => h.severity === "high").length;
  const macroScore = Math.max(0, Math.min(99, 100 - burningCount * 15 - warningCount * 5));
  const macroTone: Severity = burningCount > 0 ? "critical" : warningCount > 0 ? "high" : "safe";
  const macroColor = colorOf(macroTone);

  // Vitality Ring 計算
  const ringCircumference = 2 * Math.PI * 112;
  const ringProgress = (macroScore / 100) * ringCircumference;
  const ringOffset = ringCircumference - ringProgress;

  return (
    <div className="luminous min-h-screen relative">
      {/* Atmospheric layers */}
      <div className="lm-aurora lm-aurora-1"></div>
      <div className="lm-aurora lm-aurora-2"></div>
      <div className="lm-grid-bg"></div>
      <div className="lm-noise"></div>

      {/* ═══ TOP META BAR ═══ */}
      <header className="relative z-10 border-b lm-hairline">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 h-12 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.18em] uppercase" style={{ color: "var(--c-muted)" }}>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full lm-pulse-dot" style={{ background: "var(--c-primary)" }}></span>
              <span style={{ color: "var(--c-text)" }}>SYS // NOMINAL</span>
            </div>
            <span className="hidden md:inline">CHANNEL 0x4F · ENCRYPTED</span>
            <span className="hidden lg:inline">LAT 25.0330° N · LON 121.5654° E</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden sm:inline">LUMINOUS / v1.0</span>
            <span className="font-mono">{today}</span>
            <span className="lm-text-glow" style={{ color: "var(--c-primary)" }}>●</span>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 sm:pt-16 lg:pt-24 pb-8 sm:pb-12 lg:pb-16">
        <div className="flex items-baseline gap-2 sm:gap-4 mb-6 sm:mb-8 font-mono text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase flex-wrap" style={{ color: "var(--c-muted)" }}>
          <span className="lm-text-glow" style={{ color: "var(--c-primary)" }}>▲</span>
          <span>DOSSIER · L1 COMMAND</span>
          <span className="flex-1 border-t lm-hairline mt-2 min-w-[40px]"></span>
          <span className="hidden md:inline">CLASSIFIED · C-LEVEL EYES ONLY</span>
        </div>

        <h1 className="font-display font-light leading-[0.88] tracking-[-0.04em] text-[44px] sm:text-[72px] md:text-[96px] lg:text-[120px]">
          供應鏈<br />
          <span className="italic font-thin" style={{ color: "var(--c-muted)" }}>Command.</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 mt-8 sm:mt-12 lg:mt-16">
          <div className="lg:col-span-7">
            <p className="font-display font-light text-lg sm:text-xl md:text-2xl lg:text-[28px] leading-[1.35]" style={{ color: "var(--c-text)" }}>
              BOSS 視角的戰略指揮中心：把 5 層 AI 預測蒸餾成
              <span className="lm-text-glow" style={{ color: "var(--c-primary)" }}> 一個會呼吸的、敘事化的</span>
              情報簡報 — 為深夜、為長途飛行、為等不及的電話而設計。
            </p>
          </div>
          <div className="lg:col-span-5 lg:pl-10 lg:border-l lm-hairline">
            <div className="grid grid-cols-2 gap-y-4 sm:gap-y-5 gap-x-6 font-mono text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.15em] uppercase">
              <div>
                <div style={{ color: "var(--c-muted)" }}>視角</div>
                <div className="mt-1 normal-case tracking-normal font-display font-light text-[14px] sm:text-[15px]" style={{ color: "var(--c-text)" }}>CEO · VP · 採購總監</div>
              </div>
              <div>
                <div style={{ color: "var(--c-muted)" }}>裝置</div>
                <div className="mt-1 normal-case tracking-normal font-display font-light text-[14px] sm:text-[15px]" style={{ color: "var(--c-text)" }}>Mobile / Desktop</div>
              </div>
              <div>
                <div style={{ color: "var(--c-muted)" }}>美學</div>
                <div className="mt-1 normal-case tracking-normal font-display font-light text-[14px] sm:text-[15px]" style={{ color: "var(--c-text)" }}>Bioluminescent</div>
              </div>
              <div>
                <div style={{ color: "var(--c-muted)" }}>血脈</div>
                <div className="mt-1 normal-case tracking-normal font-display font-light text-[14px] sm:text-[15px]" style={{ color: "var(--c-text)" }}>Palantir × Arc</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionRule num="§ 01" right="2 Questions · 1 Glance" />

      {/* ═══ VITALITY RING ═══ */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left: Q1 哪裡快爆了 */}
          <div className="order-2 lg:order-1 text-left lg:text-right">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase font-bold" style={{ color: "var(--c-muted)" }}>BOSS QUESTION #1</div>
            <div className="font-display text-2xl sm:text-3xl font-light mt-2" style={{ color: "var(--c-text)" }}>哪裡快爆了？</div>
            <div className="font-display text-4xl sm:text-5xl font-bold mt-3 leading-tight" style={{ color: macroColor }}>
              {burningCount > 0 ? `${burningCount} 區燃燒` : warningCount > 0 ? `${warningCount} 區警示` : "全線清空"}
            </div>
            <div className="font-mono text-xs sm:text-sm mt-2" style={{ color: "var(--c-muted)" }}>
              {stream.critical} Critical · {decisions.length} 待決策
            </div>
          </div>

          {/* Center: Vitality Ring */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative" style={{ width: 260, height: 260, maxWidth: "80vw", maxHeight: "80vw" }}>
              <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${macroColor}30 0%, transparent 60%)`, filter: "blur(14px)" }}></div>
              <svg viewBox="0 0 260 260" className="absolute inset-0">
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="60%" stopColor="#00F0FF" />
                    <stop offset="85%" stopColor="#B026FF" />
                    <stop offset="100%" stopColor={macroColor} />
                  </linearGradient>
                  <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                {/* Tracks */}
                <circle cx="130" cy="130" r="112" stroke="#1c1c20" strokeWidth="1" fill="none" />
                <circle cx="130" cy="130" r="104" stroke="#1c1c20" strokeWidth="1" fill="none" strokeDasharray="2 4" />
                {/* Progress */}
                <g className="lm-ring-pulse">
                  <circle cx="130" cy="130" r="112" stroke="url(#ring-grad)" strokeWidth="2.5" fill="none"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 130 130)"
                    filter="url(#ring-glow)" />
                </g>
                {/* Inner thin arc */}
                <circle cx="130" cy="130" r="92" stroke="rgba(0,240,255,0.12)" strokeWidth="1" fill="none"
                  strokeDasharray="180 400" transform="rotate(-90 130 130)" />
                {/* Tick marks */}
                <g stroke="#27272A" strokeWidth="1" opacity="0.6">
                  <line x1="130" y1="18" x2="130" y2="24" />
                  <line x1="130" y1="236" x2="130" y2="242" />
                  <line x1="18" y1="130" x2="24" y2="130" />
                  <line x1="236" y1="130" x2="242" y2="130" />
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase" style={{ color: "var(--c-muted)" }}>Macro Score</div>
                <div className="font-display font-semibold text-[48px] sm:text-[56px] leading-none mt-1 text-white lm-text-glow tracking-tight">{macroScore}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span style={{ color: macroColor, fontSize: 14 }}>{burningCount > 0 ? "▼" : "▲"}</span>
                  <span className="font-mono text-[11px] lm-text-glow-amber" style={{ color: macroColor }}>
                    {burningCount > 0 ? `-${burningCount * 15}` : warningCount > 0 ? `-${warningCount * 5}` : "+0"}Δ
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--c-muted)" }}>/ NOW</span>
                </div>
                <div className="mt-3 font-mono text-[9px] tracking-[0.22em] uppercase flex items-center gap-2" style={{ color: "var(--c-muted)" }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${macroTone === "critical" ? "lm-breathe-danger" : macroTone === "high" ? "lm-breathe-amber" : "lm-breathe"}`} style={{ background: macroColor }}></span>
                  <span style={{ color: macroColor }}>
                    {macroTone === "critical" ? `Anomaly · ${burningCount}` : macroTone === "high" ? "Watch · L2" : "Stable"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Q2 該先救哪裡 */}
          <div className="order-3 text-left">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase font-bold" style={{ color: "var(--c-muted)" }}>BOSS QUESTION #2</div>
            <div className="font-display text-2xl sm:text-3xl font-light mt-2" style={{ color: "var(--c-text)" }}>該先救哪裡？</div>
            <div className="font-display text-base sm:text-lg mt-3 leading-snug" style={{ color: "var(--c-text)" }}>
              {criticalDecisions[0]?.whatToDoNow ?? "目前無待決策事項"}
            </div>
            <div className="mt-2 font-mono text-xs" style={{ color: "var(--c-warn)" }}>
              {criticalDecisions[0] && `避免 $${(criticalDecisions[0].revenueAtRisk / 10000).toFixed(0)} 萬損失`}
            </div>
          </div>
        </div>
      </section>

      <SectionRule num="§ 02" right="5 Hot Zones · Live" />

      {/* ═══ HOT ZONES ═══ */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {hotZones.map((h) => (
            <HotZoneCard key={h.name} {...h} />
          ))}
        </div>
      </section>

      <SectionRule num="§ 03" right="Triage · AI Recommended Order" />

      {/* ═══ TRIAGE QUEUE ═══ */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {criticalDecisions.length === 0 && todayDecisions.length === 0 ? (
          <div className="lm-hairline rounded p-6 sm:p-8 text-center" style={{ background: "rgba(16,185,129,0.08)" }}>
            <div className="text-3xl sm:text-4xl mb-2">✅</div>
            <div className="font-display text-lg sm:text-xl" style={{ color: "var(--c-text)" }}>目前無待救援事項 — 全線清空</div>
            <div className="font-mono text-[10px] tracking-widest uppercase mt-2" style={{ color: "var(--c-muted)" }}>NO TRIAGE NEEDED</div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {criticalDecisions.map((d, i) => <TriageRow key={d.id} d={d} rank={i + 1} urgent />)}
            {todayDecisions.map((d, i) => <TriageRow key={d.id} d={d} rank={criticalDecisions.length + i + 1} />)}
          </div>
        )}
      </section>

      <SectionRule num="§ 04" right="Live Feed + Health" />

      {/* ═══ LIVE FEED + HEALTH ═══ */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 sm:gap-6">
          {/* Live Feed */}
          <div className="lm-hairline rounded p-4 sm:p-5" style={{ background: "rgba(18,18,22,0.6)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: "var(--c-primary)" }}>📡 Live Event Feed</div>
              <Link href="/erp/admin/event-engine" className="font-mono text-[10px] hover:underline" style={{ color: "var(--c-muted)" }}>→ Engine</Link>
            </div>
            <div className="space-y-2">
              {events.slice(0, 5).map((e) => {
                const color = e.severity === "critical" ? "#FF3366" : e.severity === "high" ? "#FFB020" : e.severity === "medium" ? "#00F0FF" : "#52525B";
                return (
                  <div key={e.id} className="flex items-center gap-2 sm:gap-3 lm-hairline rounded p-2 sm:p-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0 lm-breathe" style={{ background: color }}></div>
                    <code className="font-mono text-[9px] sm:text-[10px] shrink-0" style={{ color: "var(--c-muted)" }}>{e.type}</code>
                    <div className="text-xs sm:text-sm flex-1 min-w-0 truncate" style={{ color: "var(--c-text)" }}>
                      {Object.entries(e.payload).map(([k, v]) => (
                        <span key={k} className="mr-2 text-[11px] sm:text-xs">
                          <span style={{ color: "var(--c-muted)" }}>{k}=</span>{String(v)}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] shrink-0 tabular-nums" style={{ color: "var(--c-muted)" }}>
                      {new Date(e.occurredAt).toLocaleTimeString("zh-TW", { hour12: false })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health Snapshot */}
          <div className="lm-hairline rounded p-4 sm:p-5" style={{ background: "rgba(18,18,22,0.6)" }}>
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-bold mb-3" style={{ color: "var(--c-primary)" }}>📊 Health Snapshot</div>
            <div className="space-y-2 sm:space-y-3">
              <HealthBar label="OTD"      value={otd.otd}      target={95} unit="%" />
              <HealthBar label="OTIF"     value={otd.otif}     target={95} unit="%" />
              <HealthCount label="ASN Delay" value={missAsn.filter((m) => m.severity === "critical").length} target={0} />
              <HealthCount label="PO Unconfirmed" value={unconf.filter((u) => u.hoursOverdue > 0).length} target={0} />
              <HealthCount label="Equipment ≥92%" value={equip.filter((e) => e.riskLevel === "critical").length} target={0} />
            </div>
          </div>
        </div>
      </section>

      <SectionRule num="§ 05" right="6 Centers · Drill Down" />

      {/* ═══ 6 CENTERS ═══ */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { slug: "supplier", label: "Supplier", emoji: "🤝", color: "#00F0FF" },
            { slug: "delivery", label: "Delivery", emoji: "🚚", color: "#10b981" },
            { slug: "manufacturing", label: "Manufacturing", emoji: "🏭", color: "#3b82f6" },
            { slug: "inventory", label: "Inventory", emoji: "📦", color: "#FFB020" },
            { slug: "procurement", label: "Procurement", emoji: "💎", color: "#B026FF" },
            { slug: "decision", label: "AI Decision", emoji: "🧠", color: "#FF3366" },
          ].map((c) => (
            <Link key={c.slug} href={`/os/${c.slug}`}
              className="block lm-hairline rounded p-3 sm:p-4 transition-transform hover:scale-[1.03] hover:lm-glow-soft"
              style={{ background: "rgba(18,18,22,0.6)" }}>
              <div className="text-2xl sm:text-3xl">{c.emoji}</div>
              <div className="font-display text-sm font-medium mt-2" style={{ color: "var(--c-text)" }}>{c.label}</div>
              <code className="font-mono text-[9px] mt-1 block" style={{ color: "var(--c-muted)" }}>/os/{c.slug}</code>
              <div className="mt-2 h-px" style={{ background: `linear-gradient(90deg, ${c.color}, transparent)`, opacity: 0.6 }}></div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t lm-hairline mt-8 sm:mt-16">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--c-muted)" }}>
            CHI HUA · 供應鏈作戰系統 · 對鼎新唯讀不回寫
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px]" style={{ color: "var(--c-muted)" }}>
            <Link href="/architecture" className="hover:underline" style={{ color: "var(--c-primary)" }}>🏛 5-Layer</Link>
            <Link href="/architecture/constitution" className="hover:underline" style={{ color: "var(--c-primary)" }}>📜 憲法</Link>
            <Link href="/os" className="hover:underline" style={{ color: "var(--c-primary)" }}>📋 6 Centers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────── Components ───────────────

function SectionRule({ num, right }: { num: string; right: string }) {
  return (
    <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 pt-2 pb-2">
      <div className="flex items-end justify-between mb-2 font-mono text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.22em] uppercase" style={{ color: "var(--c-muted)" }}>
        <span>{num}</span>
        <span className="hidden sm:inline">{right}</span>
      </div>
      <div className="border-t lm-hairline"></div>
    </section>
  );
}

function HotZoneCard({ name, icon, count, severity, href, desc }: {
  name: string; icon: string; count: number; severity: Severity; href: string; desc: string;
}) {
  const color = colorOf(severity);
  const label = severity === "critical" ? "BURNING" : severity === "high" ? "WARNING" : severity === "medium" ? "WATCH" : "CLEAR";
  return (
    <Link href={href} className="block lm-hairline rounded p-3 sm:p-4 transition-transform hover:scale-[1.02]"
      style={{ background: "rgba(18,18,22,0.7)", borderColor: `${color}30`, boxShadow: `0 0 24px -8px ${color}40` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl sm:text-3xl">{icon}</span>
        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${severity === "critical" ? "lm-breathe-danger" : severity === "high" ? "lm-breathe-amber" : severity === "safe" ? "" : "lm-breathe"}`}
          style={{ background: color }}></div>
      </div>
      <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase font-bold" style={{ color: "var(--c-muted)" }}>{name}</div>
      <div className="font-display font-bold text-3xl sm:text-4xl tabular-nums mt-1 leading-none" style={{ color }}>{count}</div>
      <div className="font-mono text-[9px] sm:text-[10px] mt-2" style={{ color: "var(--c-muted)" }}>{desc}</div>
      <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-bold mt-1" style={{ color }}>● {label}</div>
    </Link>
  );
}

function TriageRow({ d, rank, urgent }: { d: DecisionAction; rank: number; urgent?: boolean }) {
  const color = urgent ? "#FF3366" : "#FFB020";
  const label = urgent ? "CRITICAL" : "TODAY";
  return (
    <Link href={d.sourceLink ?? "#"} className="block lm-hairline rounded p-3 sm:p-4 transition-transform hover:scale-[1.005]"
      style={{ background: `rgba(${urgent ? "255,51,102" : "255,176,32"},0.08)`, borderLeftWidth: 4, borderLeftColor: color }}>
      <div className="flex items-start gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-display font-semibold text-lg sm:text-xl shrink-0"
          style={{ background: color, color: "#000" }}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-bold px-2 py-0.5 rounded"
              style={{ background: color, color: "#000" }}>{label}</span>
            <code className="font-mono text-xs font-bold" style={{ color: "var(--c-primary)" }}>{d.sourceLabel}</code>
          </div>
          <div className="font-display text-base sm:text-lg mt-1" style={{ color: "var(--c-text)" }}>{d.whatToDoNow}</div>
          <div className="text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1" style={{ color: "var(--c-muted)" }}>
            <span><b style={{ color: "var(--c-text)" }}>影響：</b>避免 ${(d.revenueAtRisk / 10000).toFixed(0)} 萬損失</span>
            <span><b style={{ color: "var(--c-text)" }}>成本：</b>${(d.costImpact / 10000).toFixed(1)} 萬</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HealthBar({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const good = value >= target;
  const color = good ? "#10b981" : "#FF3366";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--c-muted)" }}>{label}</span>
        <span className="font-mono font-bold tabular-nums">
          <span style={{ color }}>{value.toFixed(1)}{unit}</span>
          <span style={{ color: "var(--c-muted)" }} className="ml-2">/ ≥{target}{unit}</span>
        </span>
      </div>
      <div className="h-px relative mt-1.5" style={{ background: "var(--c-border)" }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${Math.min(100, (value / 100) * 100)}%`, background: color, opacity: 0.8 }}></div>
      </div>
    </div>
  );
}

function HealthCount({ label, value, target }: { label: string; value: number; target: number }) {
  const good = value <= target;
  const color = good ? "#10b981" : "#FF3366";
  return (
    <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded"
      style={{ background: `${color}15`, color: "var(--c-text)" }}>
      <span style={{ color: "var(--c-muted)" }}>{label}</span>
      <span className="font-mono font-bold tabular-nums">
        <span style={{ color }}>{value}</span>
        <span style={{ color: "var(--c-muted)" }} className="ml-2">/ ≤{target}</span>
        <span style={{ color }} className="ml-2">{good ? "✓" : "✗"}</span>
      </span>
    </div>
  );
}
