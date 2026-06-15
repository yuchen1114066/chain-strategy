// BrainGearIcon — 人工智慧決策平台向量圖示
// 側臉剪影 + 腦回紋 + 中央齒輪（緩速旋轉），以 currentColor 適配 Phase 配色。

export default function BrainGearIcon({
  className = "",
  size = 64,
  spin = true,
}: {
  className?: string;
  size?: number;
  spin?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="AI Decision Platform"
      role="img"
    >
      {/* Head silhouette — side profile facing right */}
      <path
        d="M14 30
           C14 16, 26 8, 36 9
           C46 10, 53 18, 53 26
           C53 30, 51 33, 48 35
           L52 38
           C52 41, 50 43, 47 43
           L45 49
           C45 53, 42 56, 38 56
           L28 56
           C22 56, 17 52, 16 46
           C13 42, 12 36, 14 30 Z"
      />

      {/* Brain folds — 三層弧線暗示腦回 */}
      <path d="M20 22 q3 -3 6 0 q3 -3 6 0" opacity="0.75" />
      <path d="M20 42 q3 3 6 0 q3 3 6 0" opacity="0.6" />
      <path d="M44 22 q-2 2 0 4" opacity="0.6" />

      {/* Gear — 中央齒輪（緩速旋轉） */}
      <g transform="translate(34 32)">
        <g
          style={spin ? { transformOrigin: "center", animation: "ai-gear-spin 14s linear infinite" } : undefined}
        >
          <circle r="5.2" />
          <circle r="2" />
          {/* 8 teeth */}
          <line x1="0" y1="-8.4" x2="0" y2="-5.6" />
          <line x1="0" y1="5.6" x2="0" y2="8.4" />
          <line x1="-8.4" y1="0" x2="-5.6" y2="0" />
          <line x1="5.6" y1="0" x2="8.4" y2="0" />
          <line x1="-5.94" y1="-5.94" x2="-3.96" y2="-3.96" />
          <line x1="3.96" y1="3.96" x2="5.94" y2="5.94" />
          <line x1="-5.94" y1="5.94" x2="-3.96" y2="3.96" />
          <line x1="3.96" y1="-3.96" x2="5.94" y2="-5.94" />
        </g>
      </g>

      <style>{`@keyframes ai-gear-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
