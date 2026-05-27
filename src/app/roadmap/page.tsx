import Link from "next/link";
import "../erp/luminous.css";
import BrainGearIcon from "@/components/erp/BrainGearIcon";

// AI Supply Chain Flow — 4 階段成熟度路線圖
// Phase 1 → 2 → 3 → 4：從「看得到」→「會決策」→「能預測」→「自治運轉」

export const metadata = {
  title: "AI Supply Chain Flow — Roadmap (4 Phases)",
  description: "Enterprise Supply Chain Control Tower → AI Decision Platform → Predictive Network → Autonomous OS",
};

type Phase = {
  n: number;
  emoji: string;
  title: string;
  titleZh: string;
  era: string;
  question: string;          // 該階段回答什麼問題
  capabilities: string[];     // 關鍵能力
  deliverables: string[];     // 具體交付
  metrics: { label: string; value: string }[];
  status: "current" | "next" | "future";
};

const PHASES: Phase[] = [
  {
    n: 1,
    emoji: "🏛",
    title: "Enterprise Supply Chain Control Tower",
    titleZh: "企業供應鏈控制塔",
    era: "Today · v1.0",
    question: "公司現在發生什麼事？哪裡快爆了？",
    capabilities: [
      "L1 軍事指揮中心 — BOSS 3 秒看完",
      "L2 六大作戰中心 — 領域 owner 指揮",
      "L3 32 個專業工作台 — 操作執行",
      "供應商協作入口 + Risk Radar",
      "WMS 收貨 7 階段風控架構",
      "鼎新 ERP 整合（唯讀）",
    ],
    deliverables: [
      "100+ 頁面、61 個引擎",
      "Event Stream + MDM + RBAC + Observability",
      "對鼎新 ERP 唯讀不回寫",
      "繁中/簡中/英文/越南 4 語系",
    ],
    metrics: [
      { label: "可見度", value: "100%" },
      { label: "回應時間", value: "3 秒" },
      { label: "整合系統", value: "鼎新 iGP" },
    ],
    status: "current",
  },
  {
    n: 2,
    emoji: "🤔",
    title: "AI Decision Platform",
    titleZh: "AI 決策平台",
    era: "Next · v2.0",
    question: "該做什麼？哪個方案最好？成本多少？",
    capabilities: [
      "Centralized AI Engines（ETA / Risk / Cost / Simulation）",
      "Decision Loop 5 階段閉環（拍板→派工→追蹤→績效→案例庫）",
      "What-if / Scenario Planning",
      "AI 推薦 + 副總拍板公開化",
      "Approval Workflow 12 種需批准動作",
      "供應商風險雷達動量偵測",
    ],
    deliverables: [
      "AI 決策中心 /os/decision",
      "案例庫累積 → AI 學習",
      "個人決策準確度公開",
      "供應商緊急應急能力評分",
    ],
    metrics: [
      { label: "決策準度", value: "→ 85%" },
      { label: "AI 採用率", value: "→ 80%" },
      { label: "閉環追蹤", value: "100%" },
    ],
    status: "next",
  },
  {
    n: 3,
    emoji: "🔮",
    title: "Predictive Supply Chain Network",
    titleZh: "預測式供應鏈網絡",
    era: "Year 2 · v3.0",
    question: "未來會發生什麼？怎麼提前準備？",
    capabilities: [
      "6 維 AI 預測（ETA / Delay / Cost / Demand / Capacity / Supplier Risk）",
      "Digital Twin Engine — 每個實體都有數位分身",
      "Timeline Graph — 不是 Table 是 Graph",
      "全球供應鏈地圖 + 5 情境模擬",
      "原物料 AI 4 區判斷（低檔/危險/追高/囤貨）",
      "客戶需求預測 + 提前備料",
    ],
    deliverables: [
      "AI ETA 預測引擎（每張 PO 87% 機率）",
      "Should-Cost 拆解 + 漲價合理性判斷",
      "全球地圖 + 地震/紅海/匯率/限電 5 情境",
      "8 個每日 ingest 流（ASN/ETA/IQC/OTD/Delay/Capacity/Cost/Commodity）",
    ],
    metrics: [
      { label: "預測準度", value: "→ 90%" },
      { label: "防停線", value: "→ 95%" },
      { label: "提前知道", value: "48-72 hr" },
    ],
    status: "future",
  },
  {
    n: 4,
    emoji: "♾",
    title: "Autonomous Supply Chain OS",
    titleZh: "自治式供應鏈作業系統",
    era: "Year 3+ · v4.0",
    question: "系統能不能自己跑？只要例外才找人？",
    capabilities: [
      "Auto-Resolution — 標準異常 AI 自動處理",
      "Event-Driven Architecture（5 條鐵律全落實）",
      "Self-Healing — 系統自我恢復",
      "Continuous Learning — 案例庫 → 模型自進化",
      "Multi-Tier Supplier Visibility（看穿到 N-3 層）",
      "Cross-Enterprise Network（跨公司供應鏈聯盟）",
    ],
    deliverables: [
      "標準決策 80% 自動執行",
      "副總只看 Exception",
      "供應商分身 AI 互相協商",
      "跨公司 Event 共享（去識別化）",
    ],
    metrics: [
      { label: "自動化率", value: "→ 80%" },
      { label: "人工介入", value: "<20%" },
      { label: "決策延遲", value: "毫秒級" },
    ],
    status: "future",
  },
];

export default function RoadmapPage() {
  return (
    <div className="luminous min-h-screen relative">
      <div className="lm-aurora lm-aurora-1"></div>
      <div className="lm-aurora lm-aurora-2"></div>
      <div className="lm-grid-bg"></div>
      <div className="lm-noise"></div>

      {/* Top meta */}
      <header className="relative z-10 border-b lm-hairline">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-10 h-12 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase" style={{ color: "var(--c-muted)" }}>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full lm-pulse-dot" style={{ background: "var(--c-primary)" }}></span>
              <span style={{ color: "var(--c-text)" }}>AI SUPPLY CHAIN FLOW</span>
            </div>
            <span className="hidden md:inline">ROADMAP · 2026-2029</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/erp" className="hover:underline" style={{ color: "var(--c-primary)" }}>← L1 Command</Link>
            <span className="lm-text-glow" style={{ color: "var(--c-primary)" }}>●</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-10 pt-10 sm:pt-20 lg:pt-24 pb-8 sm:pb-12">
        <div className="flex items-baseline gap-2 sm:gap-4 mb-6 sm:mb-8 font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase flex-wrap" style={{ color: "var(--c-muted)" }}>
          <span className="lm-text-glow" style={{ color: "var(--c-primary)" }}>▲</span>
          <span>STRATEGIC ROADMAP · 4 PHASES</span>
          <span className="flex-1 border-t lm-hairline mt-2 min-w-[40px]"></span>
          <span className="hidden md:inline">FROM VISIBILITY TO AUTONOMY</span>
        </div>

        <h1 className="font-display font-light leading-[0.88] tracking-[-0.04em]" style={{ fontSize: "clamp(40px,8vw,110px)" }}>
          AI Supply Chain<br />
          <span className="italic font-thin" style={{ color: "var(--c-muted)" }}>Flow.</span>
        </h1>

        <div className="mt-6 sm:mt-10 max-w-[760px]">
          <p className="font-display font-light leading-[1.45] text-lg sm:text-xl md:text-2xl" style={{ color: "var(--c-text)" }}>
            從「看得到」到「自治運轉」的 4 階段演進。<br />
            每個階段解一個核心問題，把企業推進到下一個成熟度。
          </p>
        </div>
      </section>

      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-10 pt-2 pb-2">
        <div className="flex items-end justify-between mb-2 font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase" style={{ color: "var(--c-muted)" }}>
          <span>§ MATURITY MODEL</span>
          <span className="hidden sm:inline">4 Phases · 3+ Years</span>
        </div>
        <div className="border-t lm-hairline"></div>
      </section>

      {/* Phase progression — 4 phases vertical */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-10 py-8 sm:py-12 lg:py-16">
        {/* Connector line (mobile only horizontal at top, desktop vertical on left) */}
        <div className="relative">
          {/* Vertical timeline line (lg+) */}
          <div className="hidden lg:block absolute left-12 top-0 bottom-0 w-px" style={{ background: "linear-gradient(to bottom, #00F0FF, #B026FF, #FFB020, #FF3366)" }}></div>

          <div className="space-y-8 sm:space-y-12 lg:space-y-16">
            {PHASES.map((p) => <PhaseCard key={p.n} phase={p} />)}
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-10 pt-2 pb-2">
        <div className="flex items-end justify-between mb-2 font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase" style={{ color: "var(--c-muted)" }}>
          <span>§ THE BIG PICTURE</span>
          <span className="hidden sm:inline">Why this order matters</span>
        </div>
        <div className="border-t lm-hairline"></div>
      </section>

      {/* The Big Picture — narrative */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-10 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-7">
            <p className="font-display font-light leading-[1.6] text-base sm:text-lg lg:text-xl" style={{ color: "var(--c-text)" }}>
              這不是功能清單，是<span className="lm-text-glow" style={{ color: "var(--c-primary)" }}>能力演進</span>。
              <br /><br />
              <b className="font-medium">Phase 1</b> 給你看見，知道供應鏈現在的真實狀況——<span style={{ color: "var(--c-muted)" }}>盲視變成全視</span>。
              <br />
              <b className="font-medium">Phase 2</b> 把看見的事變成決策——<span style={{ color: "var(--c-muted)" }}>AI 直接告訴你該做什麼</span>。
              <br />
              <b className="font-medium">Phase 3</b> 從「事後反應」升級到「事前預測」——<span style={{ color: "var(--c-muted)" }}>提前 48-72hr 知道問題將發生</span>。
              <br />
              <b className="font-medium">Phase 4</b> 系統自己跑，標準異常 AI 處理，副總只看 Exception——<span style={{ color: "var(--c-muted)" }}>從工具升級成同事</span>。
              <br /><br />
              <span className="lm-text-glow-amber" style={{ color: "var(--c-warn)" }}>每個 Phase 都是下個 Phase 的地基。跳過任何一個 = 上層虛浮、AI 不可信。</span>
            </p>
          </div>
          <div className="lg:col-span-5 lg:pl-10 lg:border-l lm-hairline">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-bold mb-3 sm:mb-4" style={{ color: "var(--c-primary)" }}>關鍵成功指標</div>
            <div className="space-y-3">
              <KsiRow label="Visibility" desc="看得到全鏈狀態" status="Phase 1" />
              <KsiRow label="Decision Quality" desc="AI 推薦 vs 副總拍板一致率" status="Phase 2" />
              <KsiRow label="Prediction Accuracy" desc="ETA / Delay / Cost 預測準度" status="Phase 3" />
              <KsiRow label="Autonomy Rate" desc="標準異常自動處理 % " status="Phase 4" />
              <KsiRow label="Event Density" desc="每天 ingest 事件數" status="持續累積" />
              <KsiRow label="AI Adoption" desc="員工真正信任並使用 AI 建議" status="持續累積" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-10 py-8 sm:py-16">
        <div className="lm-hairline rounded p-6 sm:p-10 text-center" style={{ background: "rgba(18,18,22,0.6)" }}>
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase font-bold mb-3" style={{ color: "var(--c-primary)" }}>NOW LIVE — PHASE 1</div>
          <div className="font-display font-light text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4" style={{ color: "var(--c-text)" }}>
            <span className="lm-text-glow" style={{ color: "var(--c-primary)" }}>AI Supply Chain Flow</span> v1.0 已上線
          </div>
          <p className="font-display font-light text-base sm:text-lg max-w-[560px] mx-auto mb-6 sm:mb-8" style={{ color: "var(--c-muted)" }}>
            100+ 頁面、61 個引擎、5-Layer 軍事架構、多語系、對鼎新 ERP 唯讀整合。下一站：Phase 2 AI Decision Platform。
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link href="/erp" className="font-mono text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded font-bold tracking-widest uppercase transition-transform hover:scale-105"
              style={{ background: "var(--c-primary)", color: "#000", boxShadow: "0 0 30px -6px rgba(0,240,255,0.6)" }}>
              開啟 L1 →
            </Link>
            <Link href="/os" className="font-mono text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded font-bold tracking-widest uppercase transition-transform hover:scale-105 lm-hairline"
              style={{ background: "transparent", color: "var(--c-text)" }}>
              6 Centers
            </Link>
            <Link href="/architecture" className="font-mono text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded font-bold tracking-widest uppercase transition-transform hover:scale-105 lm-hairline"
              style={{ background: "transparent", color: "var(--c-text)" }}>
              5-Layer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t lm-hairline mt-4 sm:mt-8">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--c-muted)" }}>
          <div>AI Supply Chain Flow · 祺驊 CHI HUA · 對鼎新唯讀不回寫</div>
          <div className="flex items-center gap-3">
            <Link href="/erp" className="hover:underline" style={{ color: "var(--c-primary)" }}>L1</Link>
            <Link href="/os" className="hover:underline" style={{ color: "var(--c-primary)" }}>L2</Link>
            <Link href="/architecture" className="hover:underline" style={{ color: "var(--c-primary)" }}>5-Layer</Link>
            <Link href="/architecture/constitution" className="hover:underline" style={{ color: "var(--c-primary)" }}>憲法</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  const colors = {
    current: { c: "#00F0FF", label: "NOW LIVE", glow: "rgba(0,240,255,0.5)" },
    next:    { c: "#B026FF", label: "NEXT",     glow: "rgba(176,38,255,0.5)" },
    future:  { c: "#FFB020", label: "FUTURE",   glow: "rgba(255,176,32,0.5)" },
  };
  const cc = colors[phase.status];
  return (
    <article className="relative grid grid-cols-1 lg:grid-cols-[120px_1fr] gap-4 lg:gap-8">
      {/* Left badge (mobile: inline; desktop: in left column) */}
      <div className="lg:relative">
        {/* Dot on timeline (desktop only) */}
        <div className="hidden lg:block absolute left-12 top-3 w-px h-px"></div>
        <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: cc.c }}>{cc.label}</div>
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center"
            style={{ background: `${cc.c}20`, border: `2px solid ${cc.c}`, boxShadow: `0 0 30px -6px ${cc.glow}` }}>
            <span className="font-display font-semibold text-2xl sm:text-3xl lg:text-4xl" style={{ color: cc.c }}>{phase.n}</span>
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="lm-hairline rounded-lg p-5 sm:p-6 lg:p-8" style={{ background: "rgba(18,18,22,0.5)", borderColor: `${cc.c}30`, boxShadow: `0 0 60px -20px ${cc.glow}` }}>
        <div className="flex items-baseline gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
          {phase.n === 2 ? (
            <span className="inline-flex items-center justify-center w-10 sm:w-12 lg:w-14 aspect-square" style={{ color: cc.c, filter: `drop-shadow(0 0 8px ${cc.glow})` }}>
              <BrainGearIcon className="w-full h-full" />
            </span>
          ) : (
            <span className="text-3xl sm:text-4xl lg:text-5xl">{phase.emoji}</span>
          )}
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold" style={{ color: "var(--c-muted)" }}>PHASE {phase.n}　·　{phase.era}</div>
        </div>
        <h2 className="font-display font-light leading-[1.05] tracking-tight" style={{ fontSize: "clamp(28px,5vw,52px)", color: "var(--c-text)" }}>
          {phase.title}
        </h2>
        <div className="font-display text-lg sm:text-xl mt-1 sm:mt-2" style={{ color: cc.c }}>{phase.titleZh}</div>

        {/* Question */}
        <div className="mt-4 sm:mt-6 pl-3 sm:pl-4 border-l-2" style={{ borderColor: cc.c }}>
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase mb-1" style={{ color: "var(--c-muted)" }}>解決的問題</div>
          <div className="font-display font-light text-base sm:text-lg" style={{ color: "var(--c-text)" }}>{phase.question}</div>
        </div>

        {/* Grid: Capabilities / Deliverables / Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-5 sm:mt-8">
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold mb-2" style={{ color: cc.c }}>關鍵能力</div>
            <ul className="space-y-1.5">
              {phase.capabilities.map((c) => (
                <li key={c} className="text-xs sm:text-sm leading-snug flex gap-2" style={{ color: "var(--c-text)" }}>
                  <span style={{ color: cc.c }}>·</span><span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold mb-2" style={{ color: cc.c }}>具體交付</div>
            <ul className="space-y-1.5">
              {phase.deliverables.map((d) => (
                <li key={d} className="text-xs sm:text-sm leading-snug flex gap-2" style={{ color: "var(--c-text)" }}>
                  <span style={{ color: cc.c }}>·</span><span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold mb-2" style={{ color: cc.c }}>關鍵指標</div>
            <div className="space-y-2">
              {phase.metrics.map((m) => (
                <div key={m.label} className="lm-hairline rounded p-2 sm:p-2.5" style={{ background: "rgba(0,0,0,0.4)" }}>
                  <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase" style={{ color: "var(--c-muted)" }}>{m.label}</div>
                  <div className="font-display font-medium text-base sm:text-lg tabular-nums mt-0.5" style={{ color: cc.c }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function KsiRow({ label, desc, status }: { label: string; desc: string; status: string }) {
  return (
    <div className="flex items-start justify-between gap-3 pb-2 border-b lm-hairline">
      <div className="min-w-0">
        <div className="font-display text-sm sm:text-base font-medium" style={{ color: "var(--c-text)" }}>{label}</div>
        <div className="text-[11px] sm:text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{desc}</div>
      </div>
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase shrink-0 px-2 py-0.5 rounded lm-hairline" style={{ color: "var(--c-primary)" }}>{status}</span>
    </div>
  );
}
