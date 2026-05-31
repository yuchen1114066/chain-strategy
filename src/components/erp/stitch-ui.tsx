"use client";

// 共用設計 tokens — Industrial Command（依 DESIGN.md 第二版）
// 深色側欄 + 淺灰內容 + 軟粉紅 + 薄荷藍
export const SC = {
  // Brand
  primary: "#ab2c5d",          // Soft Pink (deep)
  primaryHover: "#8b0e45",
  primaryLight: "#f06292",     // primary-container
  primaryFixed: "#ffd9e1",
  onPrimary: "#ffffff",

  // Secondary (Teal)
  blue: "#386666",             // Muted Teal — 取代 blue 命名以相容既有 code
  blueLight: "#5e8c8c",
  blueFixed: "#bbeceb",

  // Tertiary (Green) — status success
  emerald: "#006e1c",
  emeraldLight: "#35a941",

  // Status
  amber: "#d97706",
  red: "#ba1a1a",

  // Surfaces (Industrial light)
  pageBg: "#f9f9f9",
  surface: "#ffffff",
  surfaceDim: "#f4f3f3",
  surfaceHi: "#e8e8e8",
  surfaceDeep: "#1a1c1c",      // dark sidebar
  surfaceDeepHi: "#2f3131",

  // Text
  text: "#1a1c1c",
  textSub: "#574146",
  textInverse: "#f1f1f1",
  textMuted: "#8a7176",

  // Border
  border: "#e2e2e2",
  outline: "#8a7176",
  outlineSoft: "#ddbfc5",
};

export const FONT = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";
export const FONT_MONO = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

export function Card({ children, accent, className = "" }: { children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div
      className={`bg-white rounded-lg border p-5 ${className}`}
      style={{ borderColor: SC.border, borderLeft: accent ? `4px solid ${accent}` : undefined }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold" style={{ color: SC.text }}>{children}</h2>
      {sub && <div className="text-[11px]" style={{ color: SC.textSub }}>{sub}</div>}
    </div>
  );
}

export function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: SC.textSub, letterSpacing: "0.08em", fontFamily: FONT }}>
      {children}
    </div>
  );
}

export function StatusDot({ tone }: { tone: "good" | "warn" | "bad" | "info" }) {
  const c = tone === "good" ? SC.emerald : tone === "warn" ? SC.amber : tone === "bad" ? SC.red : SC.blue;
  return <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: c }} />;
}
