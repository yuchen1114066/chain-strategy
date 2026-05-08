"use client";

import { useState } from "react";
import { Search, BookOpen, Droplets, Leaf, AlertTriangle, ChevronDown, ChevronUp, X, CheckCircle } from "lucide-react";

const symptomCategories = [
  {
    name: "消化腸胃",
    icon: "🫁",
    symptoms: ["脹氣", "消化不良", "便秘", "腹瀉", "胃寒", "噁心想吐", "食慾不振"],
  },
  {
    name: "睡眠神經",
    icon: "🌙",
    symptoms: ["失眠", "多夢", "難入睡", "睡眠淺", "心神不寧", "健忘"],
  },
  {
    name: "氣血循環",
    icon: "🩸",
    symptoms: ["疲倦乏力", "臉色蒼白", "頭暈目眩", "心悸", "手腳冰冷", "氣短"],
  },
  {
    name: "皮膚水分",
    icon: "✨",
    symptoms: ["皮膚乾燥", "膚色暗沉", "水腫", "濕疹", "皮膚出油", "色斑"],
  },
  {
    name: "情緒壓力",
    icon: "🧠",
    symptoms: ["煩躁易怒", "焦慮緊張", "憂鬱低落", "壓力大", "胸悶"],
  },
  {
    name: "婦女調理",
    icon: "🌸",
    symptoms: ["月經不調", "痛經", "經前症候群", "更年期不適", "白帶異常"],
  },
  {
    name: "關節骨骼",
    icon: "🦴",
    symptoms: ["關節痠痛", "腰膝無力", "筋骨僵硬", "容易扭傷"],
  },
  {
    name: "免疫呼吸",
    icon: "🫧",
    symptoms: ["容易感冒", "過敏鼻炎", "咳嗽痰多", "喉嚨不適", "體虛怕冷"],
  },
];

type Recommendation = {
  classicRef: string;
  classicSource: string;
  constitution: string;
  hydro: string;
  foodTherapy: { name: string; note: string }[];
  herbs: { name: string; effect: string }[];
  contraindications: string[];
};

const symptomData: Record<string, Recommendation> = {
  脹氣: {
    classicRef: "「陳皮辛苦溫，入脾、肺經，理氣健脾，燥濕化痰。」",
    classicSource: "《本草綱目》",
    constitution: "痰濕、氣鬱體質",
    hydro: "飯後以熱毛巾順時針敷腹 10 分鐘，促進腸胃蠕動；溫熱薑湯浸泡雙腳。",
    foodTherapy: [
      { name: "陳皮薑茶", note: "陳皮 5g + 生薑 3 片，熱水沖泡，飯後飲用" },
      { name: "山楂麥芽水", note: "消食化積，適合積食型脹氣" },
      { name: "白蘿蔔排骨湯", note: "行氣消脹，性平和" },
    ],
    herbs: [
      { name: "陳皮", effect: "理氣健脾、燥濕" },
      { name: "山楂", effect: "消食積、行氣散瘀" },
      { name: "麥芽", effect: "消食化積、疏肝" },
      { name: "神曲", effect: "健脾開胃、消食" },
    ],
    contraindications: ["胃酸過多者慎用山楂", "孕婦慎用麥芽、神曲", "氣虛體弱者不宜過量陳皮"],
  },
  消化不良: {
    classicRef: "「山楂化飲食，消肉積，散瘀血。」",
    classicSource: "《本草綱目》",
    constitution: "痰濕、氣虛體質",
    hydro: "飯後散步 15 分鐘；熱水泡腳至微出汗，有助脾胃運化。",
    foodTherapy: [
      { name: "四神湯", note: "茯苓、山藥、蓮子、芡實，健脾助消化" },
      { name: "薏仁粥", note: "健脾祛濕，適合消化差者" },
      { name: "木瓜燉銀耳", note: "助消化、潤腸" },
    ],
    herbs: [
      { name: "山楂", effect: "消食積、尤善消肉食" },
      { name: "茯苓", effect: "健脾寧心、祛濕" },
      { name: "白朮", effect: "健脾燥濕、益氣" },
      { name: "砂仁", effect: "化濕開胃、溫脾止瀉" },
    ],
    contraindications: ["脾胃虛寒者不宜生冷食物", "山楂不宜空腹大量食用"],
  },
  便秘: {
    classicRef: "「火麻仁，潤腸通便，補虛，適腸燥便秘。」",
    classicSource: "《神農本草經》",
    constitution: "陰虛、血虛體質",
    hydro: "每日早起空腹喝一杯溫開水（300ml）；腹部順時針按摩。",
    foodTherapy: [
      { name: "黑芝麻糊", note: "滋陰潤腸，適合陰虛型便秘" },
      { name: "火麻仁粥", note: "潤腸通便，藥食同源" },
      { name: "香蕉蜂蜜水", note: "潤腸，適合燥熱型便秘" },
    ],
    herbs: [
      { name: "火麻仁", effect: "潤腸通便、滋養補虛" },
      { name: "決明子", effect: "清肝明目、潤腸通便" },
      { name: "番瀉葉", effect: "瀉熱導滯（短期使用）" },
      { name: "黑芝麻", effect: "補肝腎、潤五臟" },
    ],
    contraindications: ["番瀉葉不宜長期使用", "孕婦禁用番瀉葉", "脾虛腹瀉者禁用決明子"],
  },
  失眠: {
    classicRef: "「酸棗仁，補肝寧心，斂汗，生津。主治虛煩不眠、驚悸多夢。」",
    classicSource: "《神農本草經》",
    constitution: "陰虛、心血不足體質",
    hydro: "睡前 1 小時熱水泡腳（38-40°C），加入艾葉或玫瑰花瓣；保持臥室溫度18-22°C。",
    foodTherapy: [
      { name: "酸棗仁粥", note: "炒酸棗仁 15g 煮粥，睡前 1 小時食用" },
      { name: "桂圓蓮子湯", note: "補心血、安神，適合心血不足失眠" },
      { name: "百合銀耳蓮子羹", note: "清心安神，適合虛熱失眠" },
    ],
    herbs: [
      { name: "酸棗仁", effect: "補肝寧心、斂汗安神" },
      { name: "茯神", effect: "寧心安神、健脾" },
      { name: "百合", effect: "養陰清心、安神" },
      { name: "合歡皮", effect: "解鬱安神、活血消腫" },
    ],
    contraindications: ["有實邪郁火者忌用酸棗仁", "合歡皮孕婦慎用", "服藥期間避免濃茶咖啡"],
  },
  疲倦乏力: {
    classicRef: "「黃耆，補氣升陽，固表止汗，利水消腫。」",
    classicSource: "《本草綱目》",
    constitution: "氣虛體質",
    hydro: "晨間以冷熱交替淋浴（各30秒，重複3次）提振陽氣；艾葉浸泡雙腳。",
    foodTherapy: [
      { name: "黃耆燉雞湯", note: "黃耆 30g + 紅棗 10 顆，補氣扶正" },
      { name: "人參米粥", note: "西洋參 3g 煮粥，氣陰雙補" },
      { name: "紅棗枸杞茶", note: "補血益氣，日常保養" },
    ],
    herbs: [
      { name: "黃耆", effect: "補氣升陽、固表止汗" },
      { name: "黨參", effect: "補中益氣、健脾益肺" },
      { name: "西洋參", effect: "補氣養陰、清熱生津" },
      { name: "紅棗", effect: "補中益氣、養血安神" },
    ],
    contraindications: ["感冒發燒期間不宜補氣", "陰虛火旺者慎用黃耆", "高血壓者慎用人參"],
  },
  手腳冰冷: {
    classicRef: "「當歸補血活血，調經止痛，潤燥滑腸。」",
    classicSource: "《本草綱目》",
    constitution: "陽虛、血虛體質",
    hydro: "每晚睡前熱水泡腳至小腿（42°C，20分鐘），可加入艾葉、生薑、紅花；注意保暖腰腎區域。",
    foodTherapy: [
      { name: "薑母鴨", note: "老薑、米酒、麻油，溫陽散寒" },
      { name: "當歸羊肉湯", note: "補血溫陽，冬季最佳" },
      { name: "桂圓紅棗薑茶", note: "暖宮補血，適合女性" },
    ],
    herbs: [
      { name: "當歸", effect: "補血活血、調經" },
      { name: "桂枝", effect: "溫通經脈、助陽化氣" },
      { name: "艾葉", effect: "溫經散寒、止血" },
      { name: "乾薑", effect: "溫中散寒、回陽通脈" },
    ],
    contraindications: ["孕婦禁用紅花、桂枝", "陰虛火旺者不宜大量溫熱藥材", "月經過多者慎用活血藥"],
  },
  水腫: {
    classicRef: "「薏苡仁，健脾補肺，清熱利濕，除濕痹。」",
    classicSource: "《本草綱目》",
    constitution: "痰濕、濕熱體質",
    hydro: "每日足部按摩（湧泉穴、三陰交），促進淋巴循環；減少鹽分攝入；熱水澡有助排濕。",
    foodTherapy: [
      { name: "薏仁紅豆水", note: "紅豆 30g + 薏仁 30g，健脾利水消腫" },
      { name: "冬瓜排骨湯", note: "清熱利水，適合濕熱型水腫" },
      { name: "玉米鬚茶", note: "利尿消腫，每日代茶飲" },
    ],
    herbs: [
      { name: "薏苡仁", effect: "健脾利濕、清熱排膿" },
      { name: "茯苓", effect: "利水滲濕、健脾寧心" },
      { name: "澤瀉", effect: "利水滲濕、瀉熱" },
      { name: "車前草", effect: "利尿通淋、清肝明目" },
    ],
    contraindications: ["孕婦禁用薏苡仁大量", "腎功能不全者慎用利水藥", "陰虛津虧者不宜過多利尿"],
  },
  煩躁易怒: {
    classicRef: "「柴胡疏散退熱，疏肝解鬱，升舉陽氣。」",
    classicSource: "《神農本草經》",
    constitution: "氣鬱、肝陽上亢體質",
    hydro: "冷水洗臉或冷敷太陽穴；泡玫瑰花浴或薰衣草精油浴；做深呼吸配合腹式呼吸。",
    foodTherapy: [
      { name: "玫瑰花茶", note: "疏肝解鬱，每日 1-2 杯" },
      { name: "菊花枸杞茶", note: "清肝明目，適合肝火旺" },
      { name: "蓮藕排骨湯", note: "清心降火，養血安神" },
    ],
    herbs: [
      { name: "柴胡", effect: "疏肝解鬱、升陽退熱" },
      { name: "玫瑰花", effect: "疏肝解鬱、和血散瘀" },
      { name: "夏枯草", effect: "清肝火、散鬱結" },
      { name: "龍膽草", effect: "清熱燥濕、瀉肝膽火" },
    ],
    contraindications: ["虛寒體質不宜大量夏枯草", "孕婦慎用柴胡大劑量", "龍膽草不宜長期服用"],
  },
  月經不調: {
    classicRef: "「益母草活血調經，利水消腫，清熱解毒。婦人科要藥。」",
    classicSource: "《本草綱目》",
    constitution: "血虛、氣滯血瘀體質",
    hydro: "經前一週每晚泡腳（加入艾葉、益母草）；熱敷小腹；避免寒涼飲食。",
    foodTherapy: [
      { name: "當歸烏雞湯", note: "補血調經，月經後服用" },
      { name: "益母草煮蛋", note: "活血調經，適合月經不順" },
      { name: "紅糖薑茶", note: "溫宮散寒，痛經時飲用" },
    ],
    herbs: [
      { name: "益母草", effect: "活血調經、利水消腫" },
      { name: "當歸", effect: "補血調經、活血止痛" },
      { name: "川芎", effect: "活血行氣、祛風止痛" },
      { name: "香附", effect: "疏肝解鬱、調經止痛" },
    ],
    contraindications: ["孕婦禁用益母草、川芎", "月經過多者慎用活血藥", "血熱者不宜溫熱補血"],
  },
  容易感冒: {
    classicRef: "「黃耆固表止汗，補氣升陽，托毒生肌，為補氣之要藥。」",
    classicSource: "《本草綱目》",
    constitution: "氣虛、陽虛體質",
    hydro: "晨間冷水洗臉鍛鍊免疫；艾灸足三里、大椎穴；保持室內通風適度。",
    foodTherapy: [
      { name: "玉屏風粥", note: "黃耆、白朮、防風煮粥，固表防感" },
      { name: "蔥白薑湯", note: "感冒初期驅散風寒" },
      { name: "枸杞山藥粥", note: "平日健脾補腎、提升免疫" },
    ],
    herbs: [
      { name: "黃耆", effect: "補氣固表、增強免疫" },
      { name: "防風", effect: "祛風解表、止痙" },
      { name: "白朮", effect: "健脾燥濕、固表止汗" },
      { name: "靈芝", effect: "補氣安神、止咳平喘" },
    ],
    contraindications: ["感冒發燒期間不宜大補", "實熱體質慎用黃耆", "靈芝與抗凝血藥有交互，有服藥者諮詢醫師"],
  },
};

const defaultRecommendation: Recommendation = {
  classicRef: "請從上方選擇您的症狀，系統將依據傳統典籍提供對應的本草養生建議。",
  classicSource: "",
  constitution: "",
  hydro: "",
  foodTherapy: [],
  herbs: [],
  contraindications: [],
};

export default function HerbCheckerPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>("消化腸胃");

  const toggle = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const matchedData = selected
    .filter((s) => symptomData[s])
    .map((s) => ({ symptom: s, data: symptomData[s] }));

  const allHerbs = Array.from(
    new Map(
      matchedData.flatMap((m) => m.data.herbs.map((h) => [h.name, h]))
    ).values()
  );

  const allContra = Array.from(
    new Set(matchedData.flatMap((m) => m.data.contraindications))
  );

  const filteredCategories = symptomCategories.map((cat) => ({
    ...cat,
    symptoms: cat.symptoms.filter((s) =>
      searchTerm ? s.includes(searchTerm) : true
    ),
  })).filter((cat) => cat.symptoms.length > 0);

  return (
    <div style={{ background: "#f8f3e8", minHeight: "100vh" }}>
      {/* Disclaimer Banner */}
      <div className="w-full py-2 px-4 text-center text-xs font-medium" style={{ background: "#3d5c3a", color: "#adc5a0" }}>
        ⚠️ 本平台內容為「個人飲食日誌」參考，不取代醫師診斷。症狀持續請就醫。
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#3d5c3a" }}>
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#2a1f10" }}>本草查詢</h1>
              <p className="text-sm" style={{ color: "#7a6a5a" }}>依症狀查詢典籍依據・食療・水療・本草食材與禁忌</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Symptom Selector */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#7a6a5a" }} />
              <input
                type="text"
                placeholder="搜尋症狀…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "white", borderColor: "#e0d8cc", color: "#2a1f10" }}
              />
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle(s)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#3d5c3a", color: "white" }}
                  >
                    {s} <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={() => setSelected([])}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{ background: "#ede6d8", color: "#7a6a5a" }}
                >
                  清除全部
                </button>
              </div>
            )}

            {/* Category accordions */}
            <div className="space-y-2">
              {filteredCategories.map((cat) => (
                <div key={cat.name} className="rounded-xl overflow-hidden border" style={{ borderColor: "#e0d8cc", background: "white" }}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
                    style={{ color: "#2a1f10" }}
                    onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                  >
                    <span>{cat.icon} {cat.name}</span>
                    {expandedCat === cat.name
                      ? <ChevronUp className="w-4 h-4" style={{ color: "#7a9b7a" }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: "#7a9b7a" }} />}
                  </button>
                  {expandedCat === cat.name && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2">
                      {cat.symptoms.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggle(s)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                          style={selected.includes(s)
                            ? { background: "#3d5c3a", color: "white", borderColor: "#3d5c3a" }
                            : { background: "#f5f0e0", color: "#5a4a3a", borderColor: "#e0d8cc" }}
                        >
                          {selected.includes(s) && <CheckCircle className="inline w-3 h-3 mr-1" />}
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 space-y-4">
            {selected.length === 0 ? (
              <div className="rounded-2xl p-10 text-center border" style={{ background: "white", borderColor: "#e0d8cc" }}>
                <div className="text-5xl mb-4">🌿</div>
                <p className="font-medium mb-1" style={{ color: "#3d5c3a" }}>請從左側選擇症狀</p>
                <p className="text-sm" style={{ color: "#7a6a5a" }}>可多選，系統將整合典籍依據與個人化建議</p>
              </div>
            ) : (
              <>
                {/* Per-symptom recommendations */}
                {matchedData.map(({ symptom, data }) => (
                  <div key={symptom} className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "#e0d8cc" }}>
                    <div className="px-5 py-3 flex items-center justify-between" style={{ background: "#f0ece0" }}>
                      <h3 className="font-bold" style={{ color: "#2a1f10" }}>症狀：{symptom}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#e8f5e6", color: "#3d5c3a" }}>{data.constitution}</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {/* Classic Reference */}
                      <div className="flex gap-3">
                        <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#c87941" }} />
                        <div>
                          <div className="text-xs font-semibold mb-1" style={{ color: "#c87941" }}>典籍依據 · {data.classicSource}</div>
                          <p className="text-sm italic leading-relaxed" style={{ color: "#5a4a3a" }}>「{data.classicRef}」</p>
                        </div>
                      </div>

                      {/* Hydrotherapy */}
                      <div className="flex gap-3">
                        <Droplets className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#5a8abf" }} />
                        <div>
                          <div className="text-xs font-semibold mb-1" style={{ color: "#5a8abf" }}>水療建議</div>
                          <p className="text-sm leading-relaxed" style={{ color: "#5a4a3a" }}>{data.hydro}</p>
                        </div>
                      </div>

                      {/* Food Therapy */}
                      <div className="flex gap-3">
                        <span className="text-lg flex-shrink-0">🍵</span>
                        <div className="flex-1">
                          <div className="text-xs font-semibold mb-2" style={{ color: "#3d5c3a" }}>食療建議</div>
                          <div className="space-y-2">
                            {data.foodTherapy.map((f) => (
                              <div key={f.name} className="rounded-lg px-3 py-2" style={{ background: "#f5f0e0" }}>
                                <span className="font-medium text-sm" style={{ color: "#2a1f10" }}>{f.name}</span>
                                <span className="text-xs ml-2" style={{ color: "#7a6a5a" }}>{f.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Combined Herbs */}
                {allHerbs.length > 0 && (
                  <div className="rounded-2xl border p-5" style={{ background: "white", borderColor: "#e0d8cc" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Leaf className="w-5 h-5" style={{ color: "#3d5c3a" }} />
                      <h3 className="font-bold" style={{ color: "#2a1f10" }}>建議本草食材</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {allHerbs.map((h) => (
                        <div key={h.name} className="rounded-xl p-3 text-center border" style={{ background: "#f5f0e0", borderColor: "#e0d8cc" }}>
                          <div className="font-bold text-sm mb-1" style={{ color: "#3d5c3a" }}>{h.name}</div>
                          <div className="text-xs" style={{ color: "#7a6a5a" }}>{h.effect}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contraindications */}
                {allContra.length > 0 && (
                  <div className="rounded-2xl border p-5" style={{ background: "#fffbf0", borderColor: "#e8d8a0" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5" style={{ color: "#c87941" }} />
                      <h3 className="font-bold" style={{ color: "#8a5a20" }}>注意事項與禁忌</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {allContra.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-sm" style={{ color: "#6a4a20" }}>
                          <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#c87941" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Diary prompt */}
                <div className="rounded-2xl border p-5 text-center" style={{ background: "#e8f5e6", borderColor: "#c8ddc8" }}>
                  <p className="text-sm font-medium mb-1" style={{ color: "#3d5c3a" }}>💾 將今日查詢記入飲食日誌</p>
                  <p className="text-xs mb-3" style={{ color: "#5a8a5a" }}>長期記錄可作為就醫時的客觀參考資料</p>
                  <button className="px-6 py-2 rounded-full text-sm font-semibold" style={{ background: "#3d5c3a", color: "white" }}>
                    記錄到打卡追蹤
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="border-t mt-12 py-6" style={{ borderColor: "#e0d8cc" }}>
        <div className="max-w-6xl mx-auto px-4 text-center text-xs" style={{ color: "#9a8a7a" }}>
          本平台所有內容均為「個人飲食日誌」性質，依傳統中醫典籍整理，僅供健康教育參考。<br />
          <strong style={{ color: "#c87941" }}>不取代醫師診斷、不構成醫療行為。</strong> 如有持續症狀，請諮詢合格中醫師或西醫。
        </div>
      </div>
    </div>
  );
}
