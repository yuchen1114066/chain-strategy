// Mock data for 養生道 (YangSheng Dao) TCM Wellness Platform

export type Constitution = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  characteristics: string[];
  recommendations: string[];
  avoidFoods: string[];
  beneficialFoods: string[];
  color: string;
};

export const constitutions: Constitution[] = [
  {
    id: "ping-he",
    name: "平和質",
    nameZh: "平和質",
    description: "陰陽氣血調和，以體態適中、面色紅潤、精力充沛為主要特徵。",
    characteristics: ["精力充沛", "面色紅潤", "睡眠良好", "適應力強"],
    recommendations: ["均衡飲食", "規律作息", "適量運動", "保持樂觀心態"],
    avoidFoods: ["過度辛辣", "過度生冷"],
    beneficialFoods: ["五穀雜糧", "新鮮蔬果", "適量肉類"],
    color: "green",
  },
  {
    id: "qi-xu",
    name: "氣虛質",
    nameZh: "氣虛質",
    description: "元氣不足，以疲乏、氣短、自汗等氣虛表現為主要特徵。",
    characteristics: ["容易疲倦", "說話氣短", "容易出汗", "抵抗力弱"],
    recommendations: ["補氣食物", "避免過勞", "適度休息", "緩和運動"],
    avoidFoods: ["生冷食物", "油膩食物", "辛辣刺激"],
    beneficialFoods: ["黃芪", "黨參", "山藥", "大棗", "蜂蜜"],
    color: "yellow",
  },
  {
    id: "yang-xu",
    name: "陽虛質",
    nameZh: "陽虛質",
    description: "陽氣不足，以畏寒怕冷、手足不溫等虛寒表現為主要特徵。",
    characteristics: ["怕冷", "手腳冰涼", "喜歡熱飲", "大便稀溏"],
    recommendations: ["溫補陽氣", "避免受寒", "多曬太陽", "溫和運動"],
    avoidFoods: ["生冷食物", "苦寒食物", "冷飲"],
    beneficialFoods: ["羊肉", "韭菜", "生薑", "肉桂", "核桃"],
    color: "orange",
  },
  {
    id: "yin-xu",
    name: "陰虛質",
    nameZh: "陰虛質",
    description: "陰液虧少，以口燥咽乾、手足心熱等虛熱表現為主要特徵。",
    characteristics: ["口乾咽燥", "手足心熱", "眼睛乾澀", "容易上火"],
    recommendations: ["滋陰潤燥", "避免熬夜", "少吃辛辣", "靜養調息"],
    avoidFoods: ["辛辣燥熱", "油炸食物", "咖啡濃茶"],
    beneficialFoods: ["枸杞", "百合", "玉竹", "沙參", "銀耳"],
    color: "blue",
  },
  {
    id: "tan-shi",
    name: "痰濕質",
    nameZh: "痰濕質",
    description: "痰濕凝聚，以形體肥胖、腹部肥滿、口黏苔膩等痰濕表現為主要特徵。",
    characteristics: ["體型偏胖", "腹部肥滿", "口中黏膩", "容易困倦"],
    recommendations: ["化痰除濕", "控制飲食", "加強運動", "避免潮濕環境"],
    avoidFoods: ["油膩甜食", "酒類", "冷飲", "高糖食物"],
    beneficialFoods: ["薏仁", "冬瓜", "茯苓", "陳皮", "白蘿蔔"],
    color: "teal",
  },
  {
    id: "shi-re",
    name: "濕熱質",
    nameZh: "濕熱質",
    description: "濕熱內蘊，以面垢油光、口苦、苔黃膩等濕熱表現為主要特徵。",
    characteristics: ["面部油光", "口苦口臭", "皮膚易長痘", "大便黏滯"],
    recommendations: ["清熱利濕", "清淡飲食", "避免熬夜", "保持通風"],
    avoidFoods: ["辛辣燒烤", "油炸食物", "酒類", "甜食"],
    beneficialFoods: ["綠豆", "苦瓜", "蓮藕", "茵陳", "車前草"],
    color: "lime",
  },
  {
    id: "xue-yu",
    name: "血瘀質",
    nameZh: "血瘀質",
    description: "血行不暢，以膚色晦暗、舌質紫暗等血瘀表現為主要特徵。",
    characteristics: ["面色晦暗", "皮膚粗糙", "容易痛經", "血管明顯"],
    recommendations: ["活血化瘀", "適量運動", "避免久坐", "保持情緒舒暢"],
    avoidFoods: ["生冷食物", "油膩食物", "高鹽食物"],
    beneficialFoods: ["玫瑰花", "山楂", "丹參", "桃仁", "紅花"],
    color: "red",
  },
  {
    id: "qi-yu",
    name: "氣鬱質",
    nameZh: "氣鬱質",
    description: "氣機鬱滯，以神情抑鬱、憂慮脆弱等氣鬱表現為主要特徵。",
    characteristics: ["情緒抑鬱", "容易焦慮", "胸悶不舒", "愛嘆氣"],
    recommendations: ["疏肝理氣", "保持樂觀", "多戶外活動", "社交互動"],
    avoidFoods: ["辛辣刺激", "咖啡", "濃茶"],
    beneficialFoods: ["玫瑰花", "佛手柑", "陳皮", "合歡花", "薰衣草"],
    color: "purple",
  },
  {
    id: "te-bing",
    name: "特稟質",
    nameZh: "特稟質",
    description: "先天失常，以生理缺陷、過敏反應等為主要特徵。",
    characteristics: ["容易過敏", "對環境敏感", "皮膚敏感", "特殊體質"],
    recommendations: ["避免過敏原", "增強免疫力", "飲食謹慎", "規律作息"],
    avoidFoods: ["易過敏食物", "辛辣刺激", "海鮮（視個人情況）"],
    beneficialFoods: ["黃芪", "防風", "白朮", "蜂蜜（非過敏者）"],
    color: "pink",
  },
];

export type Recipe = {
  id: string;
  title: string;
  description: string;
  constitution: string[];
  season: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: "簡單" | "中等" | "進階";
  category: string;
  tags: string[];
  ingredients: { name: string; amount: string; note?: string }[];
  steps: string[];
  benefits: string[];
  imageColor: string;
  rating: number;
  reviews: number;
  author: string;
};

export const recipes: Recipe[] = [
  {
    id: "1",
    title: "黃芪紅棗雞湯",
    description: "經典補氣養血湯品，適合氣虛體質及日常保健，溫潤滋補，老少皆宜。",
    constitution: ["qi-xu", "ping-he"],
    season: ["秋", "冬"],
    prepTime: 20,
    cookTime: 90,
    servings: 4,
    difficulty: "簡單",
    category: "湯品",
    tags: ["補氣", "養血", "滋補", "家常"],
    ingredients: [
      { name: "雞腿", amount: "2隻", note: "切塊" },
      { name: "黃芪", amount: "30g" },
      { name: "紅棗", amount: "10顆", note: "去核" },
      { name: "枸杞", amount: "15g" },
      { name: "薑片", amount: "5片" },
      { name: "鹽", amount: "適量" },
      { name: "米酒", amount: "1大匙" },
    ],
    steps: [
      "雞腿洗淨，切塊，放入滾水中汆燙去血水，撈出備用。",
      "黃芪、紅棗、枸杞分別洗淨，紅棗去核。",
      "鍋中加入適量清水，放入雞塊、黃芪、紅棗、薑片。",
      "大火煮沸後，轉小火慢燉60分鐘。",
      "加入枸杞，繼續燉20分鐘。",
      "加鹽調味，淋入米酒即可起鍋。",
    ],
    benefits: ["補中益氣", "養血安神", "增強免疫力", "改善疲勞"],
    imageColor: "from-amber-100 to-orange-200",
    rating: 4.8,
    reviews: 234,
    author: "陳美華",
  },
  {
    id: "2",
    title: "薏仁蓮子粥",
    description: "清熱利濕、健脾養心的養生粥品，特別適合夏季食用，清爽不膩。",
    constitution: ["tan-shi", "shi-re"],
    season: ["春", "夏"],
    prepTime: 10,
    cookTime: 60,
    servings: 2,
    difficulty: "簡單",
    category: "粥品",
    tags: ["清熱", "利濕", "健脾", "夏季"],
    ingredients: [
      { name: "薏仁", amount: "50g", note: "提前泡水4小時" },
      { name: "蓮子", amount: "30g", note: "去芯" },
      { name: "白米", amount: "50g" },
      { name: "冰糖", amount: "適量" },
      { name: "清水", amount: "1000ml" },
    ],
    steps: [
      "薏仁提前泡水4小時，蓮子泡水1小時，白米洗淨。",
      "鍋中加水，放入薏仁，大火煮沸後轉小火煮20分鐘。",
      "加入蓮子、白米，繼續小火慢煮30分鐘，期間需攪拌。",
      "煮至米粥黏稠，加入冰糖調味即可。",
    ],
    benefits: ["清熱利濕", "健脾止瀉", "養心安神", "美白祛斑"],
    imageColor: "from-green-100 to-emerald-200",
    rating: 4.6,
    reviews: 189,
    author: "林志玲",
  },
  {
    id: "3",
    title: "玫瑰山楂茶",
    description: "活血化瘀、疏肝理氣的花草茶，適合血瘀和氣鬱體質，同時具有美容養顏效果。",
    constitution: ["xue-yu", "qi-yu"],
    season: ["春", "秋"],
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    difficulty: "簡單",
    category: "茶飲",
    tags: ["活血", "疏肝", "美容", "花草茶"],
    ingredients: [
      { name: "玫瑰花", amount: "5朵" },
      { name: "山楂", amount: "10g" },
      { name: "陳皮", amount: "5g" },
      { name: "冰糖", amount: "適量" },
      { name: "熱水", amount: "300ml" },
    ],
    steps: [
      "將玫瑰花、山楂、陳皮分別洗淨。",
      "放入茶壺中，注入80°C熱水。",
      "浸泡5-10分鐘，加入冰糖調味。",
      "可反覆沖泡2-3次。",
    ],
    benefits: ["活血化瘀", "疏肝解鬱", "美容養顏", "助消化"],
    imageColor: "from-rose-100 to-pink-200",
    rating: 4.9,
    reviews: 312,
    author: "王小芳",
  },
  {
    id: "4",
    title: "枸杞菊花明目茶",
    description: "滋陰明目的養生茶飲，適合長時間使用電腦、眼睛疲勞的現代人，護眼效果顯著。",
    constitution: ["yin-xu"],
    season: ["四季"],
    prepTime: 5,
    cookTime: 5,
    servings: 1,
    difficulty: "簡單",
    category: "茶飲",
    tags: ["明目", "滋陰", "護眼", "上班族"],
    ingredients: [
      { name: "枸杞", amount: "15g" },
      { name: "菊花", amount: "5朵" },
      { name: "決明子", amount: "10g" },
      { name: "熱水", amount: "300ml" },
    ],
    steps: [
      "將枸杞、菊花、決明子洗淨。",
      "放入杯中或茶壺中。",
      "注入沸水，蓋蓋浸泡5分鐘。",
      "每天飲用1-2杯，效果更佳。",
    ],
    benefits: ["滋肝補腎", "明目護眼", "清熱散風", "抗氧化"],
    imageColor: "from-yellow-100 to-amber-200",
    rating: 4.7,
    reviews: 428,
    author: "張健康",
  },
  {
    id: "5",
    title: "當歸生薑羊肉湯",
    description: "溫陽補血的冬季進補聖品，能有效改善手腳冰冷、畏寒怕冷等陽虛症狀。",
    constitution: ["yang-xu"],
    season: ["冬"],
    prepTime: 30,
    cookTime: 120,
    servings: 4,
    difficulty: "中等",
    category: "湯品",
    tags: ["溫陽", "補血", "冬補", "暖身"],
    ingredients: [
      { name: "羊肉", amount: "500g" },
      { name: "當歸", amount: "15g" },
      { name: "生薑", amount: "50g", note: "切片" },
      { name: "紅棗", amount: "8顆" },
      { name: "米酒", amount: "2大匙" },
      { name: "鹽", amount: "適量" },
    ],
    steps: [
      "羊肉洗淨切塊，冷水下鍋汆燙，加入米酒去腥，撈出。",
      "當歸、紅棗洗淨，生薑切片。",
      "砂鍋中加水，放入羊肉、當歸、生薑。",
      "大火煮沸，撇去浮沫，轉小火慢燉90分鐘。",
      "加入紅棗，繼續燉30分鐘。",
      "加鹽調味，起鍋前撒上蔥花。",
    ],
    benefits: ["溫中補虛", "祛寒止痛", "補血活血", "暖胃驅寒"],
    imageColor: "from-orange-100 to-red-200",
    rating: 4.8,
    reviews: 156,
    author: "劉大廚",
  },
  {
    id: "6",
    title: "銀耳蓮子百合湯",
    description: "滋陰潤肺的養顏甜湯，富含膠質，是愛美女性的最佳養生甜品。",
    constitution: ["yin-xu", "ping-he"],
    season: ["秋", "四季"],
    prepTime: 15,
    cookTime: 60,
    servings: 3,
    difficulty: "簡單",
    category: "甜品",
    tags: ["滋陰", "潤肺", "養顏", "甜品"],
    ingredients: [
      { name: "銀耳", amount: "1朵", note: "泡發切碎" },
      { name: "蓮子", amount: "30g" },
      { name: "百合", amount: "20g" },
      { name: "枸杞", amount: "10g" },
      { name: "冰糖", amount: "適量" },
      { name: "清水", amount: "1200ml" },
    ],
    steps: [
      "銀耳提前泡發，去除黃色根部，撕成小朵。",
      "蓮子、百合、枸杞分別洗淨，蓮子去芯。",
      "砂鍋中加水，放入銀耳，大火煮沸後轉小火。",
      "加入蓮子、百合，小火燉45分鐘至銀耳軟滑。",
      "加入枸杞、冰糖，再燉10分鐘即可。",
    ],
    benefits: ["滋陰潤燥", "養顏美膚", "安神助眠", "潤肺止咳"],
    imageColor: "from-sky-100 to-blue-200",
    rating: 4.9,
    reviews: 567,
    author: "美容達人小林",
  },
  {
    id: "7",
    title: "山藥排骨湯",
    description: "健脾益胃、補腎固精的日常養生湯，適合脾胃虛弱、食慾不振的人群。",
    constitution: ["qi-xu", "yang-xu"],
    season: ["秋", "冬", "春"],
    prepTime: 20,
    cookTime: 90,
    servings: 4,
    difficulty: "簡單",
    category: "湯品",
    tags: ["健脾", "益胃", "補腎", "家常"],
    ingredients: [
      { name: "豬排骨", amount: "500g" },
      { name: "山藥", amount: "300g", note: "去皮切塊" },
      { name: "薏仁", amount: "30g" },
      { name: "薑片", amount: "3片" },
      { name: "枸杞", amount: "10g" },
      { name: "鹽", amount: "適量" },
    ],
    steps: [
      "排骨洗淨，冷水下鍋汆燙去血水。",
      "山藥去皮切滾刀塊，薏仁提前泡水2小時。",
      "鍋中加水，放入排骨、薏仁、薑片，大火煮沸。",
      "轉小火慢燉60分鐘，加入山藥塊。",
      "繼續燉20分鐘，加入枸杞，再燉5分鐘。",
      "加鹽調味即可。",
    ],
    benefits: ["健脾益胃", "補腎固精", "強筋健骨", "增強體力"],
    imageColor: "from-amber-100 to-yellow-200",
    rating: 4.5,
    reviews: 201,
    author: "養生廚師老李",
  },
  {
    id: "8",
    title: "茯苓陳皮冬瓜茶",
    description: "化痰除濕、利水消腫的夏季養生茶，幫助排除體內多餘水分，適合痰濕體質。",
    constitution: ["tan-shi", "shi-re"],
    season: ["夏", "春"],
    prepTime: 10,
    cookTime: 30,
    servings: 2,
    difficulty: "簡單",
    category: "茶飲",
    tags: ["除濕", "利水", "消腫", "夏季"],
    ingredients: [
      { name: "茯苓", amount: "20g" },
      { name: "陳皮", amount: "10g" },
      { name: "冬瓜", amount: "200g", note: "帶皮切塊" },
      { name: "薏仁", amount: "20g" },
      { name: "清水", amount: "800ml" },
    ],
    steps: [
      "茯苓、陳皮、薏仁洗淨，冬瓜帶皮洗淨切塊。",
      "所有材料放入鍋中，加入清水。",
      "大火煮沸後，轉小火煮20分鐘。",
      "過濾藥材，取汁飲用，可加少量蜂蜜調味。",
    ],
    benefits: ["健脾化痰", "利水除濕", "消腫減重", "改善消化"],
    imageColor: "from-teal-100 to-cyan-200",
    rating: 4.4,
    reviews: 143,
    author: "中醫師陳文彬",
  },
];

export type HerbDrugInteraction = {
  id: string;
  herb: string;
  drug: string;
  interaction: "嚴重" | "中度" | "輕微";
  description: string;
  recommendation: string;
  mechanism?: string;
};

export const herbDrugInteractions: HerbDrugInteraction[] = [
  {
    id: "1",
    herb: "當歸",
    drug: "華法林（Warfarin）",
    interaction: "嚴重",
    description: "當歸具有抗凝血作用，與華法林合用會顯著增加出血風險。",
    recommendation: "禁止同時服用，如需服用請先諮詢醫師。",
    mechanism: "當歸中的香豆素類化合物可增強華法林的抗凝效果。",
  },
  {
    id: "2",
    herb: "甘草",
    drug: "地高辛（Digoxin）",
    interaction: "嚴重",
    description: "甘草可導致低血鉀，增加地高辛毒性風險，可能引起心律不整。",
    recommendation: "嚴禁合用，服用地高辛的患者應避免大量食用甘草製品。",
    mechanism: "甘草的偽醛固酮作用導致低血鉀，低血鉀會增加心臟對地高辛的敏感性。",
  },
  {
    id: "3",
    herb: "銀杏",
    drug: "阿斯匹靈（Aspirin）",
    interaction: "中度",
    description: "銀杏葉萃取物有抗血小板作用，與阿斯匹靈合用增加出血風險。",
    recommendation: "謹慎合用，建議告知醫師，可能需要調整劑量。",
    mechanism: "銀杏中的銀杏內酯可抑制血小板活化因子，與阿斯匹靈協同增強抗血小板效果。",
  },
  {
    id: "4",
    herb: "聖約翰草（貫葉連翹）",
    drug: "口服避孕藥",
    interaction: "嚴重",
    description: "聖約翰草可誘導CYP3A4酶，顯著降低口服避孕藥的血藥濃度，導致避孕失敗。",
    recommendation: "禁止同時服用，服用口服避孕藥期間絕對不可使用聖約翰草。",
    mechanism: "聖約翰草誘導肝臟CYP3A4代謝酶，加速避孕藥代謝，降低其有效濃度。",
  },
  {
    id: "5",
    herb: "丹參",
    drug: "阿斯匹靈（Aspirin）",
    interaction: "中度",
    description: "丹參具有抗凝血作用，與阿斯匹靈合用可增加出血傾向。",
    recommendation: "謹慎合用，定期監測凝血功能，如有異常出血立即就醫。",
    mechanism: "丹參中的丹參酮可抑制血小板聚集，與阿斯匹靈產生協同抗凝作用。",
  },
  {
    id: "6",
    herb: "黃連",
    drug: "降糖藥（Metformin）",
    interaction: "中度",
    description: "黃連素（小檗鹼）有降血糖作用，與降糖藥合用可能導致低血糖。",
    recommendation: "需在醫師監測下使用，定期監測血糖水平。",
    mechanism: "黃連素可激活AMPK信號通路，增強胰島素敏感性，協同降血糖藥物。",
  },
  {
    id: "7",
    herb: "人參",
    drug: "MAO抑制劑",
    interaction: "嚴重",
    description: "人參與MAO抑制劑合用可能引起頭痛、躁動、失眠等嚴重副作用。",
    recommendation: "禁止合用，服用MAO抑制劑期間及停藥後2週內不得服用人參。",
  },
  {
    id: "8",
    herb: "山楂",
    drug: "降壓藥",
    interaction: "輕微",
    description: "山楂具有輕微降壓作用，與降壓藥合用可能增強降壓效果。",
    recommendation: "可謹慎合用，但需注意監測血壓，避免血壓過低。",
  },
  {
    id: "9",
    herb: "枸杞",
    drug: "華法林（Warfarin）",
    interaction: "中度",
    description: "枸杞可能增強華法林的抗凝作用，增加出血風險。",
    recommendation: "服用華法林的患者應避免大量食用枸杞，每週不超過適量。",
  },
  {
    id: "10",
    herb: "川芎",
    drug: "阿斯匹靈（Aspirin）",
    interaction: "中度",
    description: "川芎具有活血化瘀作用，與阿斯匹靈合用增加出血風險。",
    recommendation: "謹慎合用，如有手術計劃應提前2週停用川芎。",
  },
  {
    id: "11",
    herb: "紅麴",
    drug: "史他汀類降脂藥（Statins）",
    interaction: "嚴重",
    description: "紅麴含有天然史他汀成分（Monacolin K），與藥物史他汀合用可能增加肌病風險。",
    recommendation: "禁止合用，可能導致橫紋肌溶解症等嚴重副作用。",
    mechanism: "紅麴中的Monacolin K與Lovastatin化學結構相同，合用相當於雙倍劑量。",
  },
  {
    id: "12",
    herb: "甘草",
    drug: "降壓藥",
    interaction: "中度",
    description: "大量甘草具有偽醛固酮作用，可引起水鈉瀦留，對抗降壓藥效果。",
    recommendation: "服用降壓藥患者應限制甘草攝入量，每日不超過5g。",
  },
  {
    id: "13",
    herb: "黃芪",
    drug: "免疫抑制劑",
    interaction: "中度",
    description: "黃芪有增強免疫功能的作用，可能對抗免疫抑制劑的效果。",
    recommendation: "器官移植患者或使用免疫抑制劑者應避免服用黃芪。",
  },
  {
    id: "14",
    herb: "五味子",
    drug: "抗癲癇藥（Phenytoin）",
    interaction: "中度",
    description: "五味子可影響肝臟藥物代謝酶，改變苯妥英鈉的血藥濃度。",
    recommendation: "合用需密切監測藥物血濃度，必要時調整劑量。",
  },
  {
    id: "15",
    herb: "麻黃",
    drug: "降壓藥",
    interaction: "嚴重",
    description: "麻黃中的麻黃鹼有升壓作用，會直接對抗降壓藥的療效，可能引起血壓危象。",
    recommendation: "高血壓患者禁用麻黃，服用降壓藥者嚴禁使用麻黃製品。",
    mechanism: "麻黃鹼可促進去甲腎上腺素釋放，收縮血管，顯著升高血壓。",
  },
  {
    id: "16",
    herb: "貫眾",
    drug: "肝毒性藥物",
    interaction: "中度",
    description: "貫眾本身有一定肝毒性，與其他肝毒性藥物合用可能增加肝損傷風險。",
    recommendation: "有肝病史或服用肝毒性藥物者應避免使用貫眾。",
  },
  {
    id: "17",
    herb: "艾葉",
    drug: "抗凝血藥",
    interaction: "輕微",
    description: "艾葉有一定止血作用，可能輕微對抗抗凝血藥的效果。",
    recommendation: "一般食用量影響較小，但大量藥用時需告知醫師。",
  },
  {
    id: "18",
    herb: "夏枯草",
    drug: "降壓藥",
    interaction: "輕微",
    description: "夏枯草有輕微降壓作用，與降壓藥合用可能輕度增強降壓效果。",
    recommendation: "可謹慎合用，監測血壓，避免低血壓。",
  },
  {
    id: "19",
    herb: "大黃",
    drug: "腸溶藥物",
    interaction: "中度",
    description: "大黃具有瀉下作用，可加快腸道蠕動，影響腸溶藥物的吸收。",
    recommendation: "服用腸溶藥物時避免同時使用大黃，需間隔至少2小時。",
  },
  {
    id: "20",
    herb: "天麻",
    drug: "鎮靜安眠藥",
    interaction: "輕微",
    description: "天麻有鎮靜作用，與鎮靜安眠藥合用可能增強鎮靜效果。",
    recommendation: "謹慎合用，避免過度鎮靜，尤其是需要駕車或操作機械者。",
  },
];

export type QuizQuestion = {
  id: number;
  question: string;
  options: { text: string; scores: Record<string, number> }[];
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "您通常感到體力如何？",
    options: [
      { text: "精力充沛，很少感到疲倦", scores: { "ping-he": 2, "qi-xu": -1 } },
      { text: "容易感到疲倦，說話有氣無力", scores: { "qi-xu": 3 } },
      { text: "疲倦但還能應付日常活動", scores: { "qi-xu": 1, "yang-xu": 1 } },
      { text: "體力尚可，但下午容易犯困", scores: { "tan-shi": 2 } },
    ],
  },
  {
    id: 2,
    question: "您對溫度的感受如何？",
    options: [
      { text: "冷熱適應性好，不特別怕冷或怕熱", scores: { "ping-he": 2 } },
      { text: "非常怕冷，手腳冰涼，喜歡穿厚衣服", scores: { "yang-xu": 3 } },
      { text: "容易感到燥熱，手腳心常常發熱", scores: { "yin-xu": 3 } },
      { text: "怕熱，容易出汗，口渴喜冷飲", scores: { "shi-re": 2 } },
    ],
  },
  {
    id: 3,
    question: "您的睡眠狀況如何？",
    options: [
      { text: "睡眠品質好，容易入睡，醒後精神好", scores: { "ping-he": 2 } },
      { text: "容易失眠，睡眠淺，多夢", scores: { "yin-xu": 2, "qi-yu": 1 } },
      { text: "總是很容易打瞌睡，昏昏欲睡", scores: { "tan-shi": 2, "yang-xu": 1 } },
      { text: "入睡困難，思慮過多，心情焦慮影響睡眠", scores: { "qi-yu": 3 } },
    ],
  },
  {
    id: 4,
    question: "您的消化功能如何？",
    options: [
      { text: "消化正常，食慾好，大便規律", scores: { "ping-he": 2 } },
      { text: "容易腹脹、腹瀉，食慾不振", scores: { "qi-xu": 2, "yang-xu": 1 } },
      { text: "大便黏滯、不爽利，腹部肥滿感", scores: { "tan-shi": 3 } },
      { text: "容易便秘，大便乾燥", scores: { "yin-xu": 2, "shi-re": 1 } },
    ],
  },
  {
    id: 5,
    question: "您的皮膚和面色如何？",
    options: [
      { text: "面色紅潤，皮膚有光澤", scores: { "ping-he": 2 } },
      { text: "面色蒼白或萎黃，皮膚乾燥", scores: { "qi-xu": 1, "yang-xu": 2 } },
      { text: "面部油光，容易長痘痘", scores: { "shi-re": 3, "tan-shi": 1 } },
      { text: "面色晦暗，皮膚容易出現瘀斑", scores: { "xue-yu": 3 } },
    ],
  },
  {
    id: 6,
    question: "您的情緒狀態通常如何？",
    options: [
      { text: "情緒穩定，性格開朗，適應力強", scores: { "ping-he": 2 } },
      { text: "容易感到抑鬱、悶悶不樂，愛嘆氣", scores: { "qi-yu": 3 } },
      { text: "容易緊張焦慮，情緒波動大", scores: { "qi-yu": 2, "yin-xu": 1 } },
      { text: "情緒較穩定，但偶有煩躁", scores: { "shi-re": 1 } },
    ],
  },
  {
    id: 7,
    question: "您對外界環境的適應能力如何？",
    options: [
      { text: "適應力強，各種環境都能很快適應", scores: { "ping-he": 2 } },
      { text: "對寒冷環境特別不適應", scores: { "yang-xu": 2 } },
      { text: "對潮濕環境感到不適，易感疲倦", scores: { "tan-shi": 2 } },
      { text: "對花粉、食物等容易過敏", scores: { "te-bing": 3 } },
    ],
  },
  {
    id: 8,
    question: "您的口腔感受如何？",
    options: [
      { text: "口腔感受正常，無特殊不適", scores: { "ping-he": 2 } },
      { text: "口乾舌燥，喜歡喝水", scores: { "yin-xu": 3 } },
      { text: "口中黏膩，有口氣", scores: { "tan-shi": 2, "shi-re": 2 } },
      { text: "口苦，尤其是早晨起床時", scores: { "shi-re": 3, "qi-yu": 1 } },
    ],
  },
  {
    id: 9,
    question: "您的形體特徵如何？",
    options: [
      { text: "體形勻稱，不胖不瘦", scores: { "ping-he": 2 } },
      { text: "形體偏胖，腹部尤其肥滿", scores: { "tan-shi": 3 } },
      { text: "形體偏瘦，容易消瘦", scores: { "yin-xu": 2, "qi-xu": 1 } },
      { text: "體型偏胖但感覺沉重", scores: { "tan-shi": 2, "yang-xu": 1 } },
    ],
  },
  {
    id: 10,
    question: "您的疼痛感受如何？",
    options: [
      { text: "很少感到疼痛不適", scores: { "ping-he": 2 } },
      { text: "容易有刺痛感，痛處固定不移", scores: { "xue-yu": 3 } },
      { text: "頭痛、肌肉痠痛，遇冷加重", scores: { "yang-xu": 2 } },
      { text: "痛經嚴重，或經常腰酸背痛", scores: { "xue-yu": 2, "qi-xu": 1 } },
    ],
  },
];

export type CommunityPost = {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes: number;
  replies: number;
  views: number;
  createdAt: string;
  constitution?: string;
  featured?: boolean;
  authorRole?: string;
};

export const communityPosts: CommunityPost[] = [
  // ── 三篇駐站中醫師精選文章（針對中老年人）──────────────────────────────
  {
    id: "featured-dyed-herbs",
    author: "林建中醫師",
    avatar: "醫",
    authorRole: "駐站中醫師・藥材鑑定專家",
    title: "買到假藥材怎麼辦？教你 3 招在家辨識染色中藥",
    content: `【為什麼要辨識染色藥材？】
染色藥材通常使用工業染料，長期攝入可能造成重金屬累積、肝腎負擔加重。市面最常見的染色藥材：枸杞（染紅）、黃耆（漂白增白）、當歸（硫磺燻蒸）、紅花（染色增豔）。

【3 招居家辨識法——30秒學會】
🧪 水洗測試：枸杞、紅棗放白碗加少量水搓洗，水立即變深紅色→疑似染色。正品枸杞搓洗後水呈淡黃色。
📄 紙巾擦拭法：白色紙巾用力擦拭藥材，留下鮮豔顏色→問題很大。正品可能微量掉色，但不會染出人工色素色澤。
👃 聞氣味法：正品有自然草藥香（枸杞帶甜味、當歸有特殊芳香）；染色或硫磺燻蒸品有刺鼻化學味或完全無味。

【購買 3 要原則】
✅ 認明 GMP 認證品牌  ✅ 選購有溯源 QR 碼的包裝藥材  ✅ 避免散裝藥材（無法追溯來源）

⚠️ 本文僅供藥材辨識教育參考，不構成醫療診斷。購買藥材前請諮詢合格中醫師。`,
    category: "駐站醫師專欄",
    tags: ["藥材安全", "枸杞辨識", "染色藥材", "中老年人必看", "溯源認證"],
    likes: 1248,
    replies: 183,
    views: 15432,
    createdAt: "2026-05-05",
    featured: true,
  },
  {
    id: "featured-autumn-lung",
    author: "陳雅婷中醫師",
    avatar: "陳",
    authorRole: "駐站中醫師・食療專科",
    title: "秋天乾咳、皮膚癢？這 4 道食療比喝水還有效（附步驟）",
    content: `中醫說「秋主燥，燥傷肺」——秋天空氣乾燥，最先受傷的就是你的肺。

【5 個秋燥警訊，你中幾個？】
☑ 乾咳少痰  ☑ 鼻腔乾燥甚至流血  ☑ 皮膚脫屑搔癢  ☑ 口乾舌燥  ☑ 便秘（肺與大腸相表裡）

【4 道「三步驟」潤肺食療】

🍐 銀耳雪梨湯（30分鐘・最簡單）
步驟①銀耳泡發撕小朵 → ②與雪梨塊、冰糖加水 → ③小火燉30分鐘，放枸杞燜5分鐘
✅ 功效：滋陰潤燥、美膚、改善便秘

🌸 百合蓮子粥（50分鐘・助眠版）
步驟①蓮子泡水去苦心 → ②與白米、紅棗加水煮滾 → ③轉小火40分鐘後放百合再煮10分鐘
✅ 功效：養心安神＋潤肺，秋季失眠者首選

🍵 玉竹麥冬茶（5分鐘・辦公室版）
步驟①玉竹+麥冬+石斛放保溫杯 → ②沖入90℃熱水 → ③燜15分鐘，涼至60℃以下加蜂蜜
✅ 功效：對抗冷氣乾燥，可回沖2次

🍋 川貝燉水梨（頑固乾咳版）
步驟①水梨橫切挖空→填入川貝粉+冰糖→蓋上頂部 → ②電鍋外鍋加半杯水蒸30分鐘
✅ 注意：寒底者加3片薑絲一起蒸

【體質注意事項】氣虛者少大量用銀耳；陰虛火旺者避免燥熱食材。各人體質不同，建議先完成本平台體質測評再選方。

⚠️ 以上食療僅供參考，不可取代就醫。如乾咳持續2週以上，請就醫診察。`,
    category: "駐站醫師專欄",
    tags: ["秋季養生", "潤肺食療", "銀耳雪梨湯", "乾咳", "三步驟食譜"],
    likes: 2312,
    replies: 289,
    views: 31450,
    createdAt: "2026-05-03",
    featured: true,
  },
  {
    id: "featured-hypertension",
    author: "王志明主治醫師",
    avatar: "王",
    authorRole: "中西醫整合・心血管專科",
    title: "長期吃降壓藥，能用中藥調理嗎？醫師公開 5 大禁忌",
    content: `很多長輩覺得「中藥天然、沒副作用」，但這個觀念可能讓你的血壓藥失效，甚至更危險。

【迷思破解】天然 ≠ 安全
中藥有強烈藥性，與降壓西藥可能產生嚴重交互作用。

【高血壓患者使用中藥 5 大禁忌】

❌ 甘草（炙甘草）
問題：甘草酸會導致水分滯留、直接升高血壓，是降壓藥的大敵
白話說：就像在漏氣的輪胎上補氣，一邊補、一邊漏
替代方案：以蜂蜜調味；必要使用者請告知主治醫師調整降壓藥劑量

❌ 麻黃
問題：含麻黃鹼（Ephedrine），強烈興奮交感神經，升壓、加快心跳
替代方案：外感風寒可改用蘇葉、荊芥

❌ 大量人參、黃耆（補氣過強）
問題：實熱體質或血壓不穩時使用，可能造成血壓波動
替代方案：改用黨參、太子參，補氣效果溫和

❌ 含馬兜鈴酸的藥材（廣防己、關木通）
問題：強烈腎毒性，加重腎臟負擔，高血壓患者腎臟尤為脆弱
替代方案：改用漢防己（不含馬兜鈴酸）

⚠️ 丹參與阿斯匹靈同服
問題：雙重抗凝血效應，有出血風險
建議：需在心臟科＋中醫師共同評估下使用

【相對安全的輔助食療（仍需配合醫師）】
✅ 決明子茶（輔助降壓，但腸胃虛寒者少用）
✅ 天麻燉蛋（頭暈頭痛型適用）
✅ 山楂消食茶（同時管理體重）

【就診前必做：帶藥單】
把所有正在服用的西藥清單帶給中醫師看，讓醫師評估有無交互作用。千萬不要自行決定停藥或換藥。

本平台「中西藥安全查詢」工具可協助您初步確認潛在風險，但最終仍需專業醫師診斷。

⚠️ 本文為教育性資訊，不構成醫療建議。高血壓患者請務必遵循主治醫師指示用藥。`,
    category: "駐站醫師專欄",
    tags: ["高血壓", "中西藥交互", "甘草禁忌", "麻黃", "慢性病中藥安全"],
    likes: 3567,
    replies: 442,
    views: 58923,
    createdAt: "2026-05-01",
    featured: true,
  },
  // ── 一般社群貼文 ──────────────────────────────────────────────────────────
  {
    id: "1",
    author: "健康媽媽小芳",
    avatar: "芳",
    title: "氣虛體質孩子的日常調理心得分享",
    content: "我家孩子從小體質較弱，容易感冒，後來發現是典型的氣虛體質。透過調整飲食，加入黃芪、大棗燉雞湯，以及規律的生活作息，現在體質明顯改善了。分享一下我的調理心得...",
    category: "育兒養生",
    tags: ["氣虛體質", "兒童養生", "食療"],
    likes: 234,
    replies: 45,
    views: 1892,
    createdAt: "2024-01-15",
    constitution: "qi-xu",
  },
  {
    id: "2",
    author: "退休教師王伯伯",
    avatar: "王",
    title: "70歲老人的冬季進補指南，親身實踐版",
    content: "進入冬天後，很多老朋友都問我怎麼進補。根據多年學習中醫養生的經驗，我整理了一份適合中老年人的冬季進補指南。重點是要根據自己的體質來補，不能盲目跟風...",
    category: "中老年養生",
    tags: ["冬季進補", "老年養生", "體質調養"],
    likes: 456,
    replies: 89,
    views: 3241,
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    author: "上班族阿明",
    avatar: "明",
    title: "【求助】長期熬夜工作，感覺陰虛火旺怎麼辦？",
    content: "最近工作壓力大，幾乎每天凌晨才睡，早上起來口乾、眼乾，下午還容易上火長痘。有朋友說是陰虛體質，請問各位有什麼好的調理方法嗎？",
    category: "體質諮詢",
    tags: ["陰虛體質", "熬夜", "上火"],
    likes: 123,
    replies: 67,
    views: 2156,
    createdAt: "2024-01-10",
    constitution: "yin-xu",
  },
  {
    id: "4",
    author: "藥膳達人陳醫師",
    avatar: "陳",
    title: "春季養肝護肝：從飲食到生活習慣的全面指南",
    content: "中醫認為春季主肝，是養肝護肝的最佳時機。本文從飲食、作息、情緒三個方面，全面介紹春季如何養肝。關鍵在於「疏肝解鬱」，保持情緒舒暢，多吃綠色蔬菜...",
    category: "季節養生",
    tags: ["春季養生", "護肝", "疏肝"],
    likes: 678,
    replies: 112,
    views: 5432,
    createdAt: "2024-01-08",
  },
  {
    id: "5",
    author: "產後媽媽小雯",
    avatar: "雯",
    title: "產後氣血不足的調理歷程分享（6個月記錄）",
    content: "生完孩子後體虛嚴重，整個人像抽空了一樣。堅持服用藥膳、做月子餐6個月後，體力終於恢復了大半。分享我的恢復過程和心得...",
    category: "女性養生",
    tags: ["產後調理", "氣血不足", "月子"],
    likes: 389,
    replies: 78,
    views: 2987,
    createdAt: "2024-01-05",
  },
  {
    id: "6",
    author: "痰濕體質減重成功者",
    avatar: "胖",
    title: "痰濕體質減重1年：用中醫方法成功瘦15公斤！",
    content: "作為典型的痰濕體質，我試過很多減肥方法都效果不好。後來遵循中醫師建議，從根本上改變飲食，加入薏仁、茯苓等祛濕食材，配合運動，一年內成功減掉15公斤！",
    category: "體重管理",
    tags: ["痰濕體質", "減重", "祛濕"],
    likes: 892,
    replies: 156,
    views: 7823,
    createdAt: "2024-01-03",
    constitution: "tan-shi",
  },
  {
    id: "7",
    author: "銀髮族志工李奶奶",
    avatar: "李",
    title: "我的三高調理心得：中西醫結合的實踐",
    content: "有高血壓、高血脂已經10年了，一直在西醫治療。後來加入了中醫調理，特別是飲食上配合體質進行改善，三項指標都有明顯進步。但要強調：中藥要和西藥配合謹慎使用...",
    category: "慢性病管理",
    tags: ["三高", "中西醫結合", "高血壓"],
    likes: 567,
    replies: 134,
    views: 6123,
    createdAt: "2024-01-01",
  },
  {
    id: "8",
    author: "外食族設計師大偉",
    avatar: "偉",
    title: "外食族如何實踐中醫養生？上班族的實用指南",
    content: "每天外食、加班到深夜，想養生感覺很難。但其實稍微花心思就能做到！我整理了幾個簡單易行的方法：選對外食、隨身備養生茶包、利用週末做藥膳...",
    category: "外食族養生",
    tags: ["外食族", "上班族養生", "簡單養生"],
    likes: 445,
    replies: 89,
    views: 4321,
    createdAt: "2023-12-29",
  },
  {
    id: "9",
    author: "中醫粉絲小美",
    avatar: "美",
    title: "【討論】四季養生的重點不一樣？春夏秋冬各有什麼養生重點？",
    content: "最近在讀中醫養生書，發現中醫非常重視順應季節養生。春養肝、夏養心、秋養肺、冬養腎。想問問大家各個季節的具體調養方法，歡迎分享！",
    category: "養生討論",
    tags: ["四季養生", "季節調養", "討論"],
    likes: 234,
    replies: 98,
    views: 3456,
    createdAt: "2023-12-27",
  },
  {
    id: "10",
    author: "糖尿病患者老張",
    avatar: "張",
    title: "糖尿病患者的中藥飲食注意事項整理",
    content: "作為糖尿病患者，我在使用中藥和養生食療時踩過很多坑。整理了一份注意事項給同樣有需要的朋友：某些中藥會影響血糖，一定要告訴醫師！...",
    category: "慢性病管理",
    tags: ["糖尿病", "中藥注意", "飲食"],
    likes: 678,
    replies: 145,
    views: 8932,
    createdAt: "2023-12-25",
  },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  constitution?: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  imageColor: string;
  badge?: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: "頂級台灣花旗參片",
    category: "補氣養生",
    price: 1280,
    originalPrice: 1580,
    description: "嚴選台灣高山花旗參，補氣養陰、生津止渴，適合氣虛、陰虛體質日常保健。",
    features: ["台灣產地", "人工精選", "無添加", "SGS認證"],
    constitution: ["qi-xu", "yin-xu"],
    inStock: true,
    rating: 4.9,
    reviews: 234,
    imageColor: "from-yellow-100 to-amber-200",
    badge: "熱銷",
  },
  {
    id: "2",
    name: "四物湯藥膳包",
    category: "女性養生",
    price: 320,
    description: "傳統四物湯配方，養血活血、調經止痛，適合女性日常保養。每包可煮1-2人份。",
    features: ["傳統配方", "GMP認證", "無硫磺薰製", "嚴格篩選"],
    constitution: ["xue-yu", "qi-xu"],
    inStock: true,
    rating: 4.7,
    reviews: 456,
    imageColor: "from-rose-100 to-red-200",
    badge: "女性首選",
  },
  {
    id: "3",
    name: "黃芪黨參養生茶包",
    category: "補氣養生",
    price: 480,
    originalPrice: 580,
    description: "精選黃芪、黨參、紅棗、枸杞等補氣食材，方便沖泡，日常補氣首選。每盒30包。",
    features: ["方便沖泡", "獨立包裝", "無咖啡因", "低糖"],
    constitution: ["qi-xu"],
    inStock: true,
    rating: 4.6,
    reviews: 389,
    imageColor: "from-amber-100 to-orange-200",
  },
  {
    id: "4",
    name: "銀耳燕窩美顏飲",
    category: "美容養顏",
    price: 890,
    description: "融合銀耳、燕窩精華、枸杞，富含植物膠質，滋陰潤膚，是現代女性的養顏聖品。",
    features: ["真正燕窩成分", "低卡路里", "便攜包裝", "無防腐劑"],
    constitution: ["yin-xu"],
    inStock: true,
    rating: 4.8,
    reviews: 567,
    imageColor: "from-sky-100 to-blue-200",
    badge: "新品",
  },
  {
    id: "5",
    name: "薑黃養生粉",
    category: "抗炎保健",
    price: 560,
    description: "天然薑黃根磨製，含豐富薑黃素，具有抗氧化、抗炎功效，適合各種體質日常保健。",
    features: ["有機種植", "冷壓磨製", "無添加", "生物利用率高"],
    constitution: ["xue-yu", "shi-re"],
    inStock: true,
    rating: 4.5,
    reviews: 312,
    imageColor: "from-yellow-200 to-orange-300",
  },
  {
    id: "6",
    name: "冬季進補藥膳禮盒",
    category: "季節禮盒",
    price: 1680,
    originalPrice: 2100,
    description: "精選冬季進補食材，包含當歸、熟地、黃芪、枸杞等，附贈食譜手冊，送禮自用兩相宜。",
    features: ["精美禮盒裝", "食譜附贈", "多種補材", "冬季限定"],
    constitution: ["yang-xu", "qi-xu"],
    inStock: true,
    rating: 4.9,
    reviews: 189,
    imageColor: "from-orange-100 to-red-200",
    badge: "冬季限定",
  },
  {
    id: "7",
    name: "薏仁茯苓祛濕包",
    category: "祛濕保健",
    price: 380,
    description: "精選薏仁、茯苓、陳皮等祛濕食材，幫助排除體內多餘濕氣，適合痰濕體質保健。",
    features: ["食藥同源", "純天然", "即煮即飲", "家庭裝"],
    constitution: ["tan-shi"],
    inStock: true,
    rating: 4.4,
    reviews: 267,
    imageColor: "from-teal-100 to-cyan-200",
  },
  {
    id: "8",
    name: "玫瑰疏肝理氣茶",
    category: "情緒養生",
    price: 350,
    description: "以玫瑰花、合歡花、佛手柑為主要成分，疏肝理氣、舒緩情緒，適合壓力大的現代人。",
    features: ["純花草配方", "無咖啡因", "低糖", "舒壓首選"],
    constitution: ["qi-yu"],
    inStock: true,
    rating: 4.7,
    reviews: 423,
    imageColor: "from-pink-100 to-rose-200",
    badge: "暢銷",
  },
  {
    id: "9",
    name: "有機枸杞（寧夏特級）",
    category: "滋補食材",
    price: 420,
    description: "寧夏原產地特級枸杞，顆粒飽滿，色澤紅潤，富含枸杞多糖，護眼明目效果佳。",
    features: ["寧夏原產", "特級品質", "有機認證", "真空包裝"],
    constitution: ["yin-xu", "qi-xu"],
    inStock: true,
    rating: 4.8,
    reviews: 678,
    imageColor: "from-red-100 to-rose-200",
  },
  {
    id: "10",
    name: "三七粉（雲南文山）",
    category: "活血保健",
    price: 980,
    originalPrice: 1200,
    description: "雲南文山三七原產地採購，散瘀止血、消腫定痛，是活血化瘀的重要中藥材。",
    features: ["原產地直採", "無添加", "細研磨", "品質保證"],
    constitution: ["xue-yu"],
    inStock: true,
    rating: 4.6,
    reviews: 234,
    imageColor: "from-amber-200 to-yellow-300",
    badge: "中醫推薦",
  },
  {
    id: "11",
    name: "二十四節氣養生月訂盒",
    category: "訂閱服務",
    price: 1200,
    description: "依據二十四節氣設計的月訂養生盒，每月配送當季最適合的養生食材和茶飲，附當月養生建議。",
    features: ["每月配送", "節氣主題", "個人化建議", "可隨時取消"],
    inStock: true,
    rating: 4.9,
    reviews: 156,
    imageColor: "from-green-100 to-emerald-200",
    badge: "訂閱熱門",
  },
];

export const seasonalTips = [
  {
    season: "春",
    title: "春季養生重點：養肝疏鬱",
    tips: ["多食綠色蔬菜，養肝明目", "保持情緒舒暢，避免動怒", "適當增加戶外活動，迎接生機", "可飲用玫瑰花茶疏肝理氣"],
    color: "from-green-400 to-emerald-500",
  },
  {
    season: "夏",
    title: "夏季養生重點：養心清熱",
    tips: ["清淡飲食，避免辛辣油膩", "保持心情平靜，避免過度興奮", "適當消暑，不可過度貪涼", "綠豆、苦瓜是天然清熱食品"],
    color: "from-red-400 to-orange-500",
  },
  {
    season: "秋",
    title: "秋季養生重點：養肺潤燥",
    tips: ["多食滋陰潤燥食物，如梨、銀耳", "保持室內適當濕度，預防乾燥", "注意保暖，預防感冒", "可飲用百合蓮子湯滋養"],
    color: "from-amber-400 to-yellow-500",
  },
  {
    season: "冬",
    title: "冬季養生重點：養腎藏精",
    tips: ["適當進補，溫陽補腎", "早睡晚起，保護陽氣", "注意保暖，尤其是腰腎部位", "羊肉、黑芝麻是冬補佳品"],
    color: "from-blue-400 to-indigo-500",
  },
];
