"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RefreshCw, AlertTriangle } from "lucide-react";

// ── Energy levels ─────────────────────────────────────────────
const energyLevels = [
  { emoji: "😴", text: "需要休息", color: "#9a8a7a", bg: "#f0ece0", track: "#c8bfb0" },
  { emoji: "😔", text: "有點疲憊", color: "#7a6a8a", bg: "#f0ecf5", track: "#c8c0d8" },
  { emoji: "😊", text: "狀態還好", color: "#5a8a5a", bg: "#ecf5ec", track: "#a8c8a8" },
  { emoji: "😄", text: "心情不錯", color: "#c87941", bg: "#f8ece0", track: "#e8b880" },
  { emoji: "🌟", text: "元氣滿滿", color: "#3d5c3a", bg: "#e8f5e6", track: "#7ab87a" },
];

// ── Daily guidance cards ───────────────────────────────────────
const cards = [
  {
    season: "穀雨",
    title: "祛濕健脾",
    content: "穀雨時節濕氣漸重，宜食薏仁、茯苓，清晨喝一杯薑棗茶，溫脾化濕，讓腸胃輕盈一整天。",
    herb: "薏苡仁",
    herbEffect: "健脾祛濕・清熱排膿",
    icon: "🌾",
    bg: "#e8f5e6",
    border: "#b8d8b8",
    textColor: "#2a4028",
  },
  {
    season: "穀雨",
    title: "疏肝養血",
    content: "春末肝氣漸盛，玫瑰花茶疏肝解鬱，搭配枸杞補血明目，是女性春季最佳保養組合。",
    herb: "玫瑰花",
    herbEffect: "疏肝解鬱・和血散瘀",
    icon: "🌹",
    bg: "#fce8ef",
    border: "#e8b8c8",
    textColor: "#4a1a28",
  },
  {
    season: "穀雨",
    title: "護眼明目",
    content: "枸杞、菊花、決明子三合一，沖泡代茶飲，春季護眼保肝，尤適久盯螢幕的現代人。",
    herb: "菊花",
    herbEffect: "清肝明目・疏散風熱",
    icon: "👁️",
    bg: "#fffbea",
    border: "#e8d898",
    textColor: "#4a3a10",
  },
  {
    season: "穀雨",
    title: "潤肺止咳",
    content: "春末易過敏，百合銀耳潤肺，冰糖燉梨止咳化痰，養肺護喉，全家老小皆宜。",
    herb: "百合",
    herbEffect: "養陰清心・潤肺止咳",
    icon: "🌸",
    bg: "#eaf4ff",
    border: "#b8d0e8",
    textColor: "#1a2a4a",
  },
];

// ── Audio wave bar ─────────────────────────────────────────────
function WaveBar({ playing, index }: { playing: boolean; index: number }) {
  const heights = [20, 40, 60, 80, 60, 40, 20, 35, 55, 75, 55, 35];
  const h = heights[index % heights.length];
  return (
    <span
      className="inline-block rounded-full"
      style={{
        width: 4,
        height: playing ? h : 8,
        background: playing ? "#c87941" : "#c8bfb0",
        transition: `height ${0.3 + index * 0.05}s ease-in-out`,
        animationDelay: `${index * 0.08}s`,
      }}
    />
  );
}

// ── Morning message component ──────────────────────────────────
function MorningMessage() {
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(180);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing && seconds > 0) {
      timerRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (seconds === 0) setPlaying(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, seconds]);

  const toggle = () => {
    if (seconds === 0) setSeconds(180);
    setPlaying((p) => !p);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "#e0d8cc" }}>
      <div className="text-xs font-semibold mb-1" style={{ color: "#7a9b7a" }}>🎧 晨間留言</div>
      <div className="font-bold mb-3" style={{ color: "#2a1f10" }}>今日養生提醒</div>

      {/* Wave bars */}
      <div className="flex items-end gap-1 h-16 mb-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <WaveBar key={i} playing={playing} index={i} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={toggle}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#e8b84a,#c87941)", color: "white" }}
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="text-2xl font-mono font-bold" style={{ color: playing ? "#c87941" : "#c8bfb0" }}>
          {mm}:{ss}
        </div>
        <button
          onClick={() => { setPlaying(false); setSeconds(180); }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#f0ece0", color: "#9a8a7a" }}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs mt-3 text-center" style={{ color: "#9a8a7a" }}>點播放鍵，聆聽今日養生提醒</p>
    </div>
  );
}

// ── Energy slider component ────────────────────────────────────
function EnergySlider() {
  const [level, setLevel] = useState(2);
  const current = energyLevels[level];

  return (
    <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "#e0d8cc" }}>
      <div className="text-xs font-semibold mb-1" style={{ color: "#7a9b7a" }}>🎚️ 能量調音鈕</div>
      <div className="font-bold mb-4" style={{ color: "#2a1f10" }}>今天狀態如何？</div>

      {/* Emoji display */}
      <div
        className="rounded-xl p-4 text-center mb-4 transition-all duration-300"
        style={{ background: current.bg }}
      >
        <div className="text-5xl mb-2 transition-all duration-300">{current.emoji}</div>
        <div className="font-bold text-lg transition-all duration-300" style={{ color: current.color }}>
          {current.text}
        </div>
      </div>

      {/* Wooden-feel slider */}
      <div className="relative px-2">
        <div className="relative h-6 flex items-center">
          {/* Track */}
          <div className="absolute inset-x-0 h-3 rounded-full" style={{ background: "#e8ddd0" }} />
          {/* Fill */}
          <div
            className="absolute h-3 rounded-full transition-all duration-200"
            style={{
              background: `linear-gradient(90deg, ${current.track}, ${current.color})`,
              width: `${(level / 4) * 100}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="relative w-full appearance-none bg-transparent cursor-pointer"
            style={{ height: 24 }}
          />
        </div>
        {/* Labels */}
        <div className="flex justify-between mt-1 text-xs" style={{ color: "#9a8a7a" }}>
          <span>需要休息</span>
          <span>元氣滿滿</span>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-3 mt-3">
        {energyLevels.map((l, i) => (
          <button
            key={i}
            onClick={() => setLevel(i)}
            className="text-xl transition-all duration-200"
            style={{ opacity: i === level ? 1 : 0.35, transform: i === level ? "scale(1.3)" : "scale(1)" }}
          >
            {l.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Daily guidance card component ─────────────────────────────
function GuidanceCard() {
  const [index, setIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState(1);

  const next = () => {
    setDirection(1);
    setSliding(true);
    setTimeout(() => {
      setIndex((i) => (i + 1) % cards.length);
      setSliding(false);
    }, 250);
  };

  const card = cards[index];

  return (
    <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "#e0d8cc" }}>
      <div className="text-xs font-semibold mb-1" style={{ color: "#7a9b7a" }}>🎴 每日指引</div>
      <div className="font-bold mb-3" style={{ color: "#2a1f10" }}>今日養生指引卡</div>

      <div
        className="rounded-xl p-4 mb-4 border transition-all duration-250"
        style={{
          background: card.bg,
          borderColor: card.border,
          opacity: sliding ? 0 : 1,
          transform: sliding ? `translateX(${direction * 30}px)` : "translateX(0)",
          transition: "opacity 0.25s, transform 0.25s",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{card.icon}</span>
          <div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,0,0,0.08)", color: card.textColor }}>
              {card.season}節氣
            </span>
            <div className="font-bold mt-0.5" style={{ color: card.textColor }}>{card.title}</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: card.textColor, opacity: 0.85 }}>
          {card.content}
        </p>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.06)" }}>
          <span className="text-lg">🌿</span>
          <div>
            <span className="font-bold text-sm" style={{ color: card.textColor }}>{card.herb}</span>
            <span className="text-xs ml-2" style={{ color: card.textColor, opacity: 0.7 }}>{card.herbEffect}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > index ? 1 : -1); setSliding(true); setTimeout(() => { setIndex(i); setSliding(false); }, 250); }}
              className="rounded-full transition-all"
              style={{ width: i === index ? 20 : 8, height: 8, background: i === index ? "#3d5c3a" : "#e0d8cc" }}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
          style={{ background: "#3d5c3a", color: "white" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          換一張指引
        </button>
      </div>
    </div>
  );
}

// ── Emergency slider component ─────────────────────────────────
function EmergencySlider() {
  const [value, setValue] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [released, setReleased] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setValue(v);
    if (v >= 85) setTriggered(true);
  };

  const handleRelease = () => {
    if (!triggered) {
      setValue(0);
    }
    setReleased(true);
  };

  const reset = () => {
    setValue(0);
    setTriggered(false);
    setReleased(false);
  };

  return (
    <div className="rounded-2xl p-5 border" style={{ background: "white", borderColor: "#e0d8cc" }}>
      <div className="text-xs font-semibold mb-1" style={{ color: "#c87941" }}>🆘 緊急求助</div>
      <div className="font-bold mb-1" style={{ color: "#2a1f10" }}>隱形緊急通報</div>
      <p className="text-xs mb-4" style={{ color: "#9a8a7a" }}>向右拖動超過85%觸發，未完成自動彈回</p>

      {triggered ? (
        <div className="rounded-xl p-5 text-center border-2 animate-pulse" style={{ background: "#fff0f0", borderColor: "#e04040" }}>
          <div className="text-4xl mb-2">🚨</div>
          <div className="font-bold text-lg mb-1" style={{ color: "#c03030" }}>已發送！</div>
          <div className="text-sm" style={{ color: "#c03030" }}>家人正趕來，請保持冷靜</div>
          <button
            onClick={reset}
            className="mt-4 px-4 py-2 rounded-full text-xs font-medium"
            style={{ background: "#f0ece0", color: "#7a6a5a" }}
          >
            取消 / 演練完成
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative h-14 rounded-2xl flex items-center px-4" style={{ background: "#f8f3e8", border: "2px solid #e0d8cc" }}>
            {/* Background text */}
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium pointer-events-none" style={{ color: value > 40 ? "#e04040" : "#c8bfb0" }}>
              {value > 40 ? "繼續拖動→" : "← 滑動通報家人"}
            </span>

            {/* Track fill */}
            <div
              className="absolute left-2 top-2 bottom-2 rounded-xl transition-all"
              style={{ width: `calc(${value}% - 8px)`, background: value >= 85 ? "rgba(224,64,64,0.15)" : "rgba(61,92,58,0.12)" }}
            />

            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={handleChange}
              onMouseUp={handleRelease}
              onTouchEnd={handleRelease}
              className="relative w-full appearance-none bg-transparent cursor-pointer z-10"
              style={{ height: 40 }}
            />
          </div>
          <div className="flex justify-end mt-1">
            <span className="text-xs" style={{ color: value >= 85 ? "#e04040" : "#c8bfb0" }}>
              {Math.round(value)}%
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#9a8a7a" }}>
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#c87941" }} />
        此功能為家人照護設計，資料定義為個人飲食日誌，不構成醫療通報。
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function TodayPage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" });

  return (
    <div style={{ background: "#f8f3e8", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
        <div className="text-xs mb-1" style={{ color: "#7a9b7a" }}>穀雨節氣 · {dateStr}</div>
        <h1 className="text-2xl font-bold" style={{ color: "#2a1f10" }}>今日養生</h1>
        <p className="text-sm mt-0.5" style={{ color: "#7a6a5a" }}>用溫暖守護，每天一點點</p>
      </div>

      {/* Cards grid — mobile single col, desktop 2 col */}
      <div className="max-w-2xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorningMessage />
          <EnergySlider />
          <GuidanceCard />
          <EmergencySlider />
        </div>

        {/* Bottom nav hint */}
        <div className="mt-6 text-center text-xs" style={{ color: "#9a8a7a" }}>
          所有互動資料僅存於本機裝置，定義為個人飲食日誌 · 不取代醫師診斷
        </div>
      </div>

      {/* Slider thumb style */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8b84a, #c87941);
          box-shadow: 0 2px 8px rgba(200,121,65,0.4);
          cursor: grab;
          border: 3px solid white;
        }
        input[type=range]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8b84a, #c87941);
          box-shadow: 0 2px 8px rgba(200,121,65,0.4);
          cursor: grab;
          border: 3px solid white;
        }
      `}</style>
    </div>
  );
}
