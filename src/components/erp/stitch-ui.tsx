"use client";

// 共用 Stitch design tokens
export const SC = {
  primary: "#005245",
  primaryHover: "#1f6b5c",
  primaryLight: "#a8f1dd",
  blue: "#005cba",
  blueLight: "#2D9CDB",
  red: "#ba1a1a",
  amber: "#d97706",
  emerald: "#059669",
  pageBg: "#fcf9f8",
  surface: "#ffffff",
  surfaceDim: "#f6f3f2",
  surfaceHi: "#eae7e7",
  border: "#e5e2e1",
  text: "#1c1b1b",
  textSub: "#4B5563",
  outline: "#bec9c4",
};

export const FONT = "'IBM Plex Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";
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
  return <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub, letterSpacing: "0.05em" }}>{children}</div>;
}

export function StatusDot({ tone }: { tone: "good" | "warn" | "bad" | "info" }) {
  const c = tone === "good" ? SC.emerald : tone === "warn" ? SC.amber : tone === "bad" ? SC.red : SC.blue;
  return <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: c }} />;
}
