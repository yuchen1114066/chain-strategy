export default function StyleDemoPage() {
  return (
    <div className="min-h-screen bg-stone-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-stone-700 mb-2">WarmCare 風格參考</h1>
        <p className="text-center text-stone-500 text-sm mb-10">以下兩種方向，選你喜歡的告訴我</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ── 方向 A ── */}
          <div className="rounded-3xl overflow-hidden shadow-lg border border-pink-100">
            {/* Header */}
            <div className="bg-[#fdf7f2] px-6 py-4 border-b border-pink-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f9c8d4] flex items-center justify-center text-sm">🌸</div>
                <span className="font-bold text-[#8b5e6d] text-base">WarmCare</span>
              </div>
              <div className="flex gap-3 text-xs text-[#b07a8a]">
                <span>食譜</span><span>體質</span><span>商城</span>
              </div>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-br from-[#fdf0f3] to-[#f5e8f8] px-6 py-8 text-center">
              <div className="text-4xl mb-3">🌸</div>
              <h2 className="text-xl font-bold text-[#7a4a5e] mb-2">今天喝什麼養生茶？</h2>
              <p className="text-sm text-[#b07a8a] mb-5">根據你的體質，推薦最適合的食療</p>
              <button className="bg-[#f2a7bc] hover:bg-[#e890a8] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm transition-all">
                開始測評 ✨
              </button>
            </div>

            {/* Cards */}
            <div className="bg-[#fdf7f2] px-6 py-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { emoji: "🍵", title: "玫瑰消腫茶", tag: "氣鬱質", color: "bg-[#fce8f0]", text: "text-[#9a5070]" },
                  { emoji: "🍲", title: "山藥排骨湯", tag: "氣虛質", color: "bg-[#e8f4f0]", text: "text-[#4a7a6a]" },
                ].map((c) => (
                  <div key={c.title} className={`${c.color} rounded-2xl p-4`}>
                    <div className="text-2xl mb-2">{c.emoji}</div>
                    <div className={`text-sm font-semibold ${c.text}`}>{c.title}</div>
                    <div className="text-xs text-stone-400 mt-1">{c.tag}</div>
                  </div>
                ))}
              </div>

              {/* Color palette */}
              <div className="mt-4 pt-4 border-t border-pink-100">
                <p className="text-xs text-stone-400 mb-2">色盤</p>
                <div className="flex gap-2">
                  {["#fdf0f3","#f9c8d4","#f2a7bc","#c8a0b4","#7a4a5e","#4a7a6a","#e8f4f0"].map((c) => (
                    <div key={c} className="flex-1 h-6 rounded-full shadow-sm" style={{background: c}} />
                  ))}
                </div>
                <p className="text-xs text-[#b07a8a] mt-3 leading-relaxed">
                  柔粉藕色 × 薄荷綠 × 奶油白<br/>
                  <span className="text-stone-400">像《輝夜姬》《我的青春戀愛物語》</span>
                </p>
              </div>
            </div>

            <div className="bg-[#f9e8ee] px-6 py-3 text-center">
              <span className="text-lg font-bold text-[#8b5e6d]">方向 A</span>
              <span className="text-sm text-[#b07a8a] ml-2">柔和粉藕・乾淨溫柔</span>
            </div>
          </div>

          {/* ── 方向 B ── */}
          <div className="rounded-3xl overflow-hidden shadow-lg border border-amber-100">
            {/* Header */}
            <div className="bg-[#fdf8f0] px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f5c87a] flex items-center justify-center text-sm">🌿</div>
                <span className="font-bold text-[#7a4f1e] text-base">WarmCare</span>
              </div>
              <div className="flex gap-3 text-xs text-[#a07040]">
                <span>食譜</span><span>體質</span><span>商城</span>
              </div>
            </div>

            {/* Hero */}
            <div className="bg-gradient-to-br from-[#fef9ee] to-[#fdf0d5] px-6 py-8 text-center">
              <div className="text-4xl mb-3">🏡</div>
              <h2 className="text-xl font-bold text-[#6b3f10] mb-2">家的味道・養生的溫度</h2>
              <p className="text-sm text-[#a07040] mb-5">用阿嬤的智慧，照顧全家的健康</p>
              <button className="bg-[#e8922a] hover:bg-[#d4811f] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm transition-all">
                開始測評 🌿
              </button>
            </div>

            {/* Cards */}
            <div className="bg-[#fdf8f0] px-6 py-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { emoji: "🍵", title: "紅棗桂圓茶", tag: "陽虛質", color: "bg-[#fef0d5]", text: "text-[#8a4f10]" },
                  { emoji: "🥣", title: "薏仁紅豆粥", tag: "痰濕質", color: "bg-[#eef5e8]", text: "text-[#4a7020]" },
                ].map((c) => (
                  <div key={c.title} className={`${c.color} rounded-2xl p-4`}>
                    <div className="text-2xl mb-2">{c.emoji}</div>
                    <div className={`text-sm font-semibold ${c.text}`}>{c.title}</div>
                    <div className="text-xs text-stone-400 mt-1">{c.tag}</div>
                  </div>
                ))}
              </div>

              {/* Color palette */}
              <div className="mt-4 pt-4 border-t border-amber-100">
                <p className="text-xs text-stone-400 mb-2">色盤</p>
                <div className="flex gap-2">
                  {["#fef9ee","#f5c87a","#e8922a","#b56820","#6b3f10","#4a7020","#eef5e8"].map((c) => (
                    <div key={c} className="flex-1 h-6 rounded-full shadow-sm" style={{background: c}} />
                  ))}
                </div>
                <p className="text-xs text-[#a07040] mt-3 leading-relaxed">
                  暖琥珀 × 草綠 × 奶油米白<br/>
                  <span className="text-stone-400">像《龍貓》《料理鼠王》《鄰居家的山田君》</span>
                </p>
              </div>
            </div>

            <div className="bg-[#fde8c0] px-6 py-3 text-center">
              <span className="text-lg font-bold text-[#7a4f1e]">方向 B</span>
              <span className="text-sm text-[#a07040] ml-2">暖琥珀・家常溫暖（目前接近此風）</span>
            </div>
          </div>

        </div>

        <p className="text-center text-stone-400 text-xs mt-8">
          告訴我選 A 或 B，或說「A 的顏色 + B 的感覺」，我幫你套用到整個 APP
        </p>
      </div>
    </div>
  );
}
