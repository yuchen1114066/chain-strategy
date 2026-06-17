"use client";

import { useEffect, useState } from "react";
import { LANGS, type Lang } from "@/lib/erp/i18n";

// 多語系切換器 — 寫入 cookie + reload
// 簡單做：所有頁面用 cookie 讀取當前語系（SSR 友善）

export default function LangSwitcher({ compact }: { compact?: boolean }) {
  const [current, setCurrent] = useState<Lang>("zh-TW");

  useEffect(() => {
    const init = () => {
      try {
        const m = document.cookie.match(/(?:^|; )gascc_lang=([^;]+)/);
        if (m) {
          const v = decodeURIComponent(m[1]) as Lang;
          if (["zh-TW", "zh-CN", "en", "vi"].includes(v)) setCurrent(v);
        }
      } catch {}
    };
    init();
  }, []);

  function setLang(l: Lang) {
    if (typeof document !== "undefined") {
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `gascc_lang=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
    }
    setCurrent(l);
    if (typeof window !== "undefined") window.location.reload();
  }

  if (compact) {
    return (
      <div className="flex gap-1 items-center">
        {LANGS.map((l) => (
          <button key={l.code} onClick={() => setLang(l.code)}
            className={`text-[10px] px-1.5 py-0.5 rounded ${current === l.code ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"}`}
            title={l.label}>
            {l.emoji}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700">
      <div className="text-[9px] text-slate-400 mb-1 tracking-widest uppercase font-bold">Language</div>
      <div className="grid grid-cols-2 gap-1">
        {LANGS.map((l) => (
          <button key={l.code} onClick={() => setLang(l.code)}
            className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${
              current === l.code ? "bg-cyan-600 text-white font-bold" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}>
            <span>{l.emoji}</span><span className="truncate">{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
