"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="回到最上"
      title="回到最上"
      className="print:hidden fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
      style={{
        background: "#ab2c5d",
        padding: "10px 16px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.08em",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 200ms ease, transform 200ms ease, box-shadow 200ms ease",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 15l-6-6-6 6" />
      </svg>
      <span>TOP</span>
    </button>
  );
}
