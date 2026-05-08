import Link from "next/link";

// ── 美顏食材百科 ──────────────────────────────────────────────────────────────
const ingredients = [
  {
    name: "茯苓",
    emoji: "🌑",
    nature: "性平",
    natureColor: "bg-green-100 text-green-800",
    channel: "歸心、肺、脾、腎經",
    beauty: "利水滲濕・健脾和胃",
    beautyDetail: "改善臉部浮腫、眼袋、下半身水腫",
    tcm: "脾虛水停者的首選。水液代謝靠脾，茯苓讓脾更有力氣「搬走」體內廢水。",
    plain: "就像身體裡的「除濕機」，把黏著在臉上、腿上的多餘水分排出去。",
    cautions: ["頻尿、腎虛者減量", "無水濕症狀者不宜長期大量"],
    pairs: ["薏仁（加強利水）", "山藥（防止過度傷陰）", "紅棗（補氣緩和）"],
  },
  {
    name: "薏仁",
    emoji: "🌾",
    nature: "性微寒",
    natureColor: "bg-blue-100 text-blue-800",
    channel: "歸脾、胃、肺經",
    beauty: "健脾利濕・美白祛斑",
    beautyDetail: "淡化色斑、改善膚色暗沉、細緻毛孔",
    tcm: "薏仁含薏苡素，現代研究顯示有抑制黑色素生成的作用，是中醫「美白聖藥」。",
    plain: "中藥界的「美白精華液」，從內部阻止黑色素沉澱，讓膚色逐漸均勻透亮。",
    cautions: ["孕婦禁用（促子宮收縮）", "消化功能弱者搭配山藥同食", "不可生吃、必須煮熟"],
    pairs: ["茯苓（利水加倍）", "百合（滋陰平衡寒性）"],
  },
  {
    name: "山藥",
    emoji: "🥔",
    nature: "性平",
    natureColor: "bg-green-100 text-green-800",
    channel: "歸脾、肺、腎經",
    beauty: "補脾益胃・滋養肌膚",
    beautyDetail: "防止皮膚暗沉、提升彈性、改善氣色",
    tcm: "山藥補脾而不燥、滋腎而不膩，是極罕見的「平和補益」藥材，老少皆宜。",
    plain: "身體的「保濕乳霜」，從裡面補水補氣，臉不油不乾、氣色自然好看。",
    cautions: ["大便燥結者搭配蜂蜜", "與甘遂相剋（不同時使用）"],
    pairs: ["枸杞（補腎明目）", "茯苓（健脾利濕）", "紅棗（補血）"],
  },
  {
    name: "紅豆",
    emoji: "🫘",
    nature: "性平",
    natureColor: "bg-green-100 text-green-800",
    channel: "歸心、小腸經",
    beauty: "利水消腫・清熱解毒",
    beautyDetail: "消除早起眼皮浮腫、下肢水腫、面部虛胖",
    tcm: "紅豆利水而不傷正氣，入心經，能改善心氣不足引起的面色晦暗。",
    plain: "最家常的「消腫食材」，早起臉腫、久坐腿腫，都靠它代謝出去。",
    cautions: ["頻尿者少量", "陰虛火旺、體瘦乾燥者慎用（過於利水）"],
    pairs: ["陳皮（加強行氣利水）", "薏仁（雙管齊下利濕）", "冬瓜（清熱消腫）"],
  },
  {
    name: "陳皮",
    emoji: "🍊",
    nature: "性溫",
    natureColor: "bg-orange-100 text-orange-800",
    channel: "歸脾、肺經",
    beauty: "理氣健脾・燥濕化痰",
    beautyDetail: "促進腸胃蠕動、改善面色萎黃、消除氣滯型浮腫",
    tcm: "陳皮為「行氣之首」，氣行則水行。很多人的水腫是氣不動導致的，陳皮解決根本問題。",
    plain: "像「身體的風扇」，讓體內的氣流動起來，水分和廢物就能順暢排出，不再積聚成腫。",
    cautions: ["氣虛、燥咳、陰虛火旺者慎用", "選用正宗新會陳皮效果最佳"],
    pairs: ["紅豆（利水加倍）", "茯苓（健脾相輔）", "生薑（溫化寒濕）"],
  },
];

// ── 主打食療三部曲 ────────────────────────────────────────────────────────────
const heroRecipes = [
  {
    id: "main",
    badge: "主打食譜",
    badgeColor: "bg-rose-500",
    emoji: "🍲",
    bgColor: "from-[#fdf7f2] to-[#fce8ef]",
    borderColor: "border-rose-200",
    title: "茯苓薏仁山藥排骨湯",
    subtitle: "「平民版燕窩」・三步驟完成",
    tagline: "專攻利水補氣，讓氣色從內而外透出來",
    time: "50 分鐘",
    difficulty: "簡單",
    servings: "2–3 人份",
    ingredients: [
      { item: "排骨", amount: "300g", note: "汆燙去血水" },
      { item: "山藥", amount: "200g", note: "去皮切塊，最後10分鐘放" },
      { item: "茯苓", amount: "15g" },
      { item: "生薏仁", amount: "30g", note: "提前泡水1小時" },
      { item: "紅棗", amount: "3顆", note: "去核" },
      { item: "薑片", amount: "3片" },
      { item: "鹽", amount: "少許" },
    ],
    steps: [
      "排骨冷水下鍋汆燙，水滾後撈起，沖冷水備用。",
      "將汆燙後的排骨、茯苓、薏仁、紅棗、薑片放入鍋中，加水覆蓋食材，大火燒開後轉小火燉 40 分鐘。",
      "最後 10 分鐘放入山藥，加少許鹽調味即可。",
    ],
    benefits: ["利水消腫", "健脾補氣", "改善膚色暗沉", "緩解疲勞"],
    doctorNote: "山藥最後放是關鍵！早放會黏糊失去口感。茯苓和薏仁搭配，利水效果比單獨使用強 2 倍以上。氣虛明顯者可加黃耆 15g 一同燉煮。",
    safetyAlert: "⚠️ 孕婦不宜多食薏仁（可能促進子宮收縮）。正在服用利尿劑的患者請先諮詢醫師，避免電解質失衡。",
    supermarket: "超市版替換：茯苓找不到？用白木耳代替，同樣有助利水滋潤。",
  },
  {
    id: "tea",
    badge: "每日茶飲",
    badgeColor: "bg-[#c4607a]",
    emoji: "🍵",
    bgColor: "from-rose-50 to-orange-50",
    borderColor: "border-rose-200",
    title: "紅豆陳皮消腫茶",
    subtitle: "辦公桌上的「代謝加速器」",
    tagline: "飯後30分鐘一杯，整天擊退浮腫",
    time: "10 分鐘",
    difficulty: "超簡單",
    servings: "1 人份",
    ingredients: [
      { item: "紅豆", amount: "30g", note: "前一晚泡水，可回沖" },
      { item: "陳皮", amount: "5g" },
      { item: "薏仁", amount: "10g", note: "可省略加快速度" },
      { item: "冰糖", amount: "少許", note: "依喜好" },
    ],
    steps: [
      "紅豆前一晚泡水（省時版：直接用熱水泡 30 分鐘）。",
      "所有材料放入小鍋，加水 500ml，煮滾後轉小火煮 8 分鐘。",
      "濾渣取汁，加冰糖調味，可回沖 2 次。",
    ],
    benefits: ["消水腫", "理氣行水", "健脾助消化"],
    doctorNote: "最有效的喝法：早上空腹一杯（啟動代謝）＋下午茶一杯（消解久坐水腫）。連喝 7 天，早起臉腫的問題通常會明顯改善。",
    safetyAlert: "⚠️ 頻尿者、腎功能不佳者減少用量。陰虛體質（口乾、手心熱）者加枸杞 10 粒平衡。",
    supermarket: "超市版：買市售紅豆茶包 + 陳皮茶包分別沖泡，混合飲用，效果雖不如自煮，但方便快速。",
  },
  {
    id: "beauty",
    badge: "美顏飲",
    badgeColor: "bg-pink-500",
    emoji: "🌹",
    bgColor: "from-pink-50 to-rose-50",
    borderColor: "border-pink-200",
    title: "玫瑰薄荷抗蠟黃飲",
    subtitle: "「超商食材也能做」的透亮飲品",
    tagline: "無精豆漿 + 粉紅玫瑰茶包，5分鐘完成",
    time: "5 分鐘",
    difficulty: "零難度",
    servings: "1 人份",
    ingredients: [
      { item: "無糖豆漿", amount: "200ml", note: "超商即可購得" },
      { item: "玫瑰花茶包", amount: "1包", note: "超商/便利店可買" },
      { item: "薄荷葉", amount: "3–4片", note: "新鮮或乾燥均可" },
      { item: "蜂蜜", amount: "1小匙", note: "待溫度降至60°C以下再加" },
    ],
    steps: [
      "豆漿加熱至 70°C（不要滾沸），放入玫瑰茶包和薄荷葉。",
      "浸泡 3 分鐘，取出茶包和薄荷葉。",
      "待稍涼至 60°C 以下，加蜂蜜調味，即可飲用。",
    ],
    benefits: ["疏肝理氣", "改善面色暗沉", "抗氧化美白", "紓壓助眠"],
    doctorNote: "豆漿富含大豆異黃酮，與玫瑰疏肝理氣的功效結合，對於「壓力型蠟黃」（肝鬱氣滯導致的氣色差）特別有效。每天下午3–5點飲用，對應中醫「申時養膀胱、疏通水道」的最佳時機。",
    safetyAlert: "⚠️ 對大豆過敏者改用杏仁奶。月經期間玫瑰花量減半（活血作用較強）。",
    supermarket: "這道食譜的食材全部在超商都能買到！是專為外食族設計的零門檻美顏飲。",
  },
];

// ── 7天代謝週計劃 ────────────────────────────────────────────────────────────
const sevenDayPlan = [
  { day: "Day 1", label: "啟動日", icon: "🌅", morning: "溫薑水一杯（空腹）", noon: "紅豆陳皮茶", evening: "茯苓薏仁山藥排骨湯", tip: "今天重點是喝足水，幫助茯苓薏仁發揮利水效果。" },
  { day: "Day 2", label: "排毒日", icon: "🍃", morning: "玫瑰薄荷抗蠟黃飲", noon: "紅豆陳皮茶", evening: "薏仁蓮子粥（清淡一天）", tip: "排毒日飲食盡量清淡，讓脾胃喘口氣。" },
  { day: "Day 3", label: "補氣日", icon: "💪", morning: "溫薑水 + 紅棗兩顆", noon: "玫瑰薄荷抗蠟黃飲", evening: "黃耆枸杞雞湯（補氣加強版）", tip: "第3天加入黃耆補氣，讓代謝引擎升溫。" },
  { day: "Day 4", label: "觀察日", icon: "🔍", morning: "照鏡子看看臉的變化", noon: "紅豆陳皮茶", evening: "茯苓薏仁山藥排骨湯", tip: "多數人在第4天開始感覺早起臉不那麼腫了。" },
  { day: "Day 5", label: "深化日", icon: "✨", morning: "玫瑰薄荷抗蠟黃飲", noon: "山楂陳皮消脂茶", evening: "紅豆薏仁甜湯（消腫甜品版）", tip: "加入山楂促進消化，幫助代謝廢物更順暢。" },
  { day: "Day 6", label: "鞏固日", icon: "🛡️", morning: "溫薑水一杯", noon: "玫瑰薄荷抗蠟黃飲", evening: "茯苓薏仁山藥排骨湯", tip: "重複主打湯品鞏固效果，可以感受到氣色的明顯變化。" },
  { day: "Day 7", label: "收穫日", icon: "🌸", morning: "自選最喜歡的一款茶飲", noon: "紅豆陳皮茶", evening: "銀耳百合滋潤湯（進階美顏）", tip: "7天後維持每週2–3次的習慣，美顏效果可以持續累積。" },
];

// ── 藥性互斥安全警示 ─────────────────────────────────────────────────────────
const safetyAlerts = [
  {
    condition: "🚫 正在服用利尿劑（如 Furosemide）",
    risk: "高",
    riskColor: "bg-red-100 border-red-300 text-red-800",
    detail: "紅豆、薏仁、茯苓均有利水作用，與利尿劑合用可能造成低鉀血症、電解質失衡。",
    action: "請先諮詢醫師後再使用本系列食療。",
  },
  {
    condition: "⚠️ 孕婦",
    risk: "中",
    riskColor: "bg-rose-100 border-rose-200 text-[#5c3a4a]",
    detail: "薏仁有促進子宮收縮的作用，孕期（尤其早期）不宜大量食用。玫瑰花活血，也應減量。",
    action: "可飲用山藥湯（去除薏仁），或諮詢婦產科醫師。",
  },
  {
    condition: "⚠️ 陰虛火旺體質（口乾、手心熱、盜汗）",
    risk: "中",
    riskColor: "bg-rose-100 border-rose-200 text-[#5c3a4a]",
    detail: "薏仁性微寒，大量使用可能加重陰虛症狀。陳皮性溫燥，陰虛者也不宜過量。",
    action: "薏仁減量至 15g，加入百合 20g 或枸杞 15 粒平衡。",
  },
  {
    condition: "ℹ️ 頻尿、腎功能不佳者",
    risk: "低",
    riskColor: "bg-blue-100 border-blue-300 text-blue-800",
    detail: "紅豆、茯苓利水效果較強，頻尿者或腎功能異常者需減量使用。",
    action: "茯苓每次不超過 10g，紅豆每次不超過 20g，並觀察排尿狀況。",
  },
];

export default function BeautyPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-rose-900 via-amber-800 to-rose-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex items-center gap-2 mb-4 text-rose-300 text-sm">
            <Link href="/" className="hover:text-white transition-colors">首頁</Link>
            <span>/</span>
            <span>美顏系列</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <span>✨</span>
            <span>第一波主打系列・限定內容</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            代謝美學系列<br />
            <span className="text-rose-300">消水腫 × 抗蠟黃</span>
          </h1>
          <p className="text-lg text-rose-100 max-w-2xl leading-relaxed mb-6">
            水腫與蠟黃，其實是同一個問題的兩面：<strong className="text-white">脾虛濕重，代謝引擎熄火。</strong>一套食療三管齊下，7天感受氣色從內而外的改變。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {[["🍲", "主打食譜 3 道"], ["📚", "美顏食材百科 5 種"], ["📅", "7天代謝週計劃"], ["🛡️", "藥性安全警示"]].map(([icon, label]) => (
              <div key={label} className="bg-white/15 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-rose-100">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Water+Yellow Together */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-7">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">🔍 為什麼你會又水腫又蠟黃？（白話科普）</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-[#5c3a4a] mb-2">中醫說：脾虛濕重</h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-3">
                「脾主運化」——脾胃是身體的「代謝引擎」。當引擎動力不足（脾虛），水分和廢物就無法順暢代謝，於是：
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex gap-2"><span className="text-rose-500 font-bold flex-shrink-0">→</span>水分積聚 = 臉腫、腿腫、眼袋</li>
                <li className="flex gap-2"><span className="text-amber-500 font-bold flex-shrink-0">→</span>氣血循環差 = 臉色暗黃、沒有光澤</li>
                <li className="flex gap-2"><span className="text-stone-500 font-bold flex-shrink-0">→</span>兩者相伴出現，是同一個根源</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-green-700 mb-2">現代說：代謝循環不良</h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-3">
                久坐、熬夜、外食高鈉、壓力大——這些都讓身體的「廢水處理系統」超載：
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex gap-2"><span className="text-blue-500 font-bold flex-shrink-0">→</span>淋巴循環慢 = 組織液積聚成腫</li>
                <li className="flex gap-2"><span className="text-yellow-600 font-bold flex-shrink-0">→</span>肝臟解毒負擔重 = 膚色暗黃</li>
                <li className="flex gap-2"><span className="text-green-600 font-bold flex-shrink-0">→</span>食療策略：利水 + 補氣 + 疏肝</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 bg-rose-50 border border-rose-100 rounded-xl p-4">
            <p className="text-sm text-[#5c3a4a]"><strong>💡 三層食療策略：</strong>①利水層（茯苓、薏仁、紅豆）→ 排出廢水｜②補氣層（山藥、大棗）→ 強健代謝引擎｜③疏肝層（玫瑰、陳皮）→ 讓氣血動起來</p>
          </div>
        </div>
      </section>

      {/* Hero Recipes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">🍽️ 主打食療三部曲</h2>
        <div className="space-y-8">
          {heroRecipes.map((recipe) => (
            <div key={recipe.id} className={`bg-gradient-to-br ${recipe.bgColor} border-2 ${recipe.borderColor} rounded-2xl overflow-hidden shadow-sm`}>
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <span className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full mb-2 ${recipe.badgeColor}`}>
                      {recipe.badge}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{recipe.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-stone-800">{recipe.title}</h3>
                        <p className="text-sm text-stone-500">{recipe.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 mt-2 italic">「{recipe.tagline}」</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[["⏱", recipe.time], ["📊", recipe.difficulty], ["👥", recipe.servings]].map(([icon, val]) => (
                      <span key={val} className="bg-white/70 text-stone-700 text-xs px-3 py-1.5 rounded-full border border-stone-200">
                        {icon} {val}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Ingredients */}
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-bold text-stone-700 mb-3 text-sm">📋 食材清單</h4>
                    <ul className="space-y-1.5">
                      {recipe.ingredients.map((ing) => (
                        <li key={ing.item} className="flex items-baseline gap-2 text-sm">
                          <span className="w-1.5 h-1.5 bg-rose-400 rounded-full flex-shrink-0 mt-1.5" />
                          <span className="font-medium text-stone-700">{ing.item}</span>
                          <span className="text-stone-500">{ing.amount}</span>
                          {ing.note && <span className="text-stone-400 text-xs">（{ing.note}）</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Steps */}
                  <div className="bg-white/60 rounded-xl p-4">
                    <h4 className="font-bold text-stone-700 mb-3 text-sm">👨‍🍳 三步驟做法</h4>
                    <ol className="space-y-2">
                      {recipe.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-stone-700">
                          <span className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {recipe.benefits.map((b) => (
                        <span key={b} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-100">
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Doctor Note */}
                <div className="mt-4 bg-white/70 border border-rose-200 rounded-xl p-4">
                  <p className="text-sm text-[#5c3a4a]">
                    <strong>👨‍⚕️ 中醫師小叮嚀：</strong>{recipe.doctorNote}
                  </p>
                </div>

                {/* Supermarket Hack */}
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm text-blue-700">
                    <strong>🏪 外食族版：</strong>{recipe.supermarket}
                  </p>
                </div>

                {/* Safety Alert */}
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-700">{recipe.safetyAlert}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ingredient Encyclopedia */}
      <section className="bg-stone-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-stone-800 mb-2">📚 代謝美顏食材百科</h2>
            <p className="text-stone-500 text-sm">點擊查看每種食材的性質、美顏功效、白話解說與食用禁忌</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ingredients.map((ing) => (
              <div key={ing.name} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl">{ing.emoji}</span>
                  <div>
                    <h3 className="text-lg font-bold text-stone-800">{ing.name}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ing.natureColor}`}>{ing.nature}</span>
                      <span className="text-xs text-stone-500">{ing.channel}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-stone-100">
                  <p className="text-xs font-bold text-rose-600 mb-1">✨ 美顏功效</p>
                  <p className="text-sm font-semibold text-stone-700">{ing.beauty}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{ing.beautyDetail}</p>
                </div>

                <div className="mb-3 pb-3 border-b border-stone-100">
                  <p className="text-xs font-bold text-[#c4607a] mb-1">🏷️ 白話說明</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{ing.plain}</p>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-bold text-stone-500 mb-1">⚠️ 食用注意</p>
                  <ul className="space-y-1">
                    {ing.cautions.map((c) => (
                      <li key={c} className="text-xs text-stone-500 flex gap-1">
                        <span className="text-red-400">•</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-bold text-green-600 mb-1">🤝 最佳搭配</p>
                  <div className="flex flex-wrap gap-1">
                    {ing.pairs.map((p) => (
                      <span key={p} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7-Day Plan */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">📅 七天代謝美顏週計劃</h2>
          <p className="text-stone-500 text-sm">每天只需10–50分鐘，7天後早起照鏡子，感受氣色的變化</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sevenDayPlan.map((day) => (
            <div key={day.day} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{day.icon}</span>
                <div>
                  <div className="text-xs text-stone-400 font-medium">{day.day}</div>
                  <div className="font-bold text-stone-800 text-sm">{day.label}</div>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                {[["🌅 早", day.morning], ["☀️ 午", day.noon], ["🌙 晚", day.evening]].map(([label, content]) => (
                  <div key={label} className="text-xs">
                    <span className="font-medium text-stone-500">{label}：</span>
                    <span className="text-stone-700">{content}</span>
                  </div>
                ))}
              </div>
              <div className="bg-rose-50 rounded-lg p-2">
                <p className="text-xs text-[#c4607a]">{day.tip}</p>
              </div>
            </div>
          ))}
          {/* 8th card: after 7 days */}
          <div className="bg-gradient-to-br from-[#fdf7f2] to-[#fce8ef] rounded-2xl border-2 border-rose-200 p-4 flex flex-col justify-center items-center text-center">
            <div className="text-4xl mb-2">🌷</div>
            <div className="font-bold text-rose-700 mb-1">7天後</div>
            <p className="text-xs text-stone-600 mb-3">每週 2–3 次維持，效果持續累積</p>
            <Link href="/quiz" className="text-xs text-white px-3 py-1.5 rounded-full transition-colors" style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}>
              測我的體質調整方案 →
            </Link>
          </div>
        </div>
      </section>

      {/* Safety Alerts */}
      <section className="bg-stone-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-2">🛡️ 藥性互斥・安全使用指引</h2>
            <p className="text-stone-500 text-sm">以下族群在使用本系列食療前，請特別注意</p>
          </div>
          <div className="space-y-3">
            {safetyAlerts.map((alert) => (
              <div key={alert.condition} className={`border rounded-xl p-4 ${alert.riskColor}`}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <div className="font-bold mb-1 text-sm">{alert.condition}</div>
                    <p className="text-sm leading-relaxed opacity-90">{alert.detail}</p>
                  </div>
                  <div className="sm:w-64 bg-white/50 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">建議做法</p>
                    <p className="text-xs leading-relaxed">{alert.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white border border-stone-200 rounded-2xl p-5 text-xs text-stone-500 leading-relaxed">
            <strong className="text-stone-700">⚠️ 完整免責聲明：</strong>
            本頁所有食療食譜、食材百科及計劃內容，<strong className="text-stone-600">僅供一般健康教育與生活參考用途，不構成任何醫療診斷、治療建議或醫療行為</strong>。
            所有內容均不得取代專業醫師、中醫師、藥師之診察與建議。如您有健康疑慮、正在服用任何藥物、懷孕、哺乳或患有慢性疾病，請務必先諮詢合格醫療專業人員，再決定是否採用本頁之建議。
            <Link href="/herb-checker" className="text-[#5c3a4a] underline ml-1">→ 使用中西藥安全查詢工具</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-rose-700 to-amber-700 rounded-3xl p-8 text-white text-center">
          <div className="text-5xl mb-4">🌸</div>
          <h2 className="text-2xl font-bold mb-2">讓食療更精準，先了解你的體質</h2>
          <p className="text-rose-200 mb-6 max-w-md mx-auto text-sm leading-relaxed">
            每個人的水腫蠟黃成因不同。做完體質測評，得到專屬的代謝美顏調整建議。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/quiz"
              className="bg-white text-rose-700 font-bold px-8 py-3 rounded-full hover:bg-rose-50 transition-colors shadow-sm"
            >
              🧬 免費測我的體質
            </Link>
            <Link
              href="/recipes"
              className="bg-white/20 hover:bg-white/30 text-white font-medium px-8 py-3 rounded-full border border-white/30 transition-colors"
            >
              🍲 看更多食療食譜
            </Link>
            <Link
              href="/herb-checker"
              className="bg-white/20 hover:bg-white/30 text-white font-medium px-8 py-3 rounded-full border border-white/30 transition-colors"
            >
              💊 查詢藥物安全
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
