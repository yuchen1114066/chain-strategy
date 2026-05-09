"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import "./beauty.css";

const slides = [
  { tag: "主打食療 · Featured",    title: "茯苓薏仁山藥排骨湯", desc: "「平民版燕窩」，補氣利水・三步驟完成",        btn: "食療詳情", anchor: "recommend", bg: "linear-gradient(135deg,#4a6c40 0%,#8aaa70 50%,#c8d8a0 100%)" },
  { tag: "每日茶飲 · Daily Drink", title: "紅豆陳皮消腫茶",    desc: "辦公桌上的「代謝加速器」，消腫利水日日飲",  btn: "食療詳情", anchor: "recommend", bg: "linear-gradient(135deg,#8b3a20 0%,#c87050 50%,#e8c090 100%)" },
  { tag: "美顏特調 · Glow Drink",  title: "玫瑰薄荷抗蠟黃飲", desc: "超商食材也能做的透亮飲品，疏肝理氣・抗氧化", btn: "食療詳情", anchor: "recommend", bg: "linear-gradient(135deg,#7a3050 0%,#c07090 50%,#f0c0c0 100%)" },
  { tag: "補氣養生 · Energy Soup", title: "黃耆枸杞雞湯",      desc: "補氣固表・提升免疫，容易疲倦者的最佳選擇",  btn: "7天計劃",  anchor: "plan",      bg: "linear-gradient(135deg,#6a5010 0%,#c8a040 50%,#e8d890 100%)" },
];

const recCards = [
  { badge:"主打推薦", gold:false, cat:"暖胃補脾湯品", name:"茯苓薏仁山藥排骨湯", tagline:"「平民版燕窩」・三步驟完成",    time:"⏱ 50 分鐘　難度：簡單　份量：2–3 人", pills:["利水消腫","健脾補氣","改善膚色"], desc:"排骨 300g・山藥 200g・茯苓 15g・生薏仁 30g・紅棗 3 顆。山藥最後放是關鍵，避免過爛。氣虛明顯者可加黃耆 15g。", href:"/recipes/7", bg:"linear-gradient(135deg,#c8d8b0,#90b870)" },
  { badge:"每日推薦", gold:true,  cat:"消腫利水茶飲", name:"紅豆陳皮消腫茶",    tagline:"辦公桌上的「代謝加速器」",       time:"⏱ 10 分鐘　難度：超簡單　份量：1 人", pills:["消水腫","理氣行水","健脾"],        desc:"紅豆 30g・陳皮 5g・薏仁 10g。最有效：早上空腹一杯＋下午一杯，連喝 7 天，早起臉腫明顯改善。",               href:"/recipes/8", bg:"linear-gradient(135deg,#f0d8c0,#d09050)" },
  { badge:"美顏特調", gold:true,  cat:"疏肝美顏飲品", name:"玫瑰薄荷抗蠟黃飲", tagline:"超商食材也能做的透亮飲品",       time:"⏱ 5 分鐘　難度：零難度　份量：1 人",  pills:["疏肝理氣","抗氧化","紓壓"],        desc:"無糖豆漿 200ml・玫瑰花茶包・薄荷葉・蜂蜜。下午 3–5 點飲用最佳，對應申時疏通水道。",                       href:"/recipes/3", bg:"linear-gradient(135deg,#f0c8d0,#d07090)" },
];

const catCards = [
  { en:"Energy · Immunity",     title:"補氣養生系列", desc:"黃耆・黨參・紅棗，補中益氣，增強抵抗力",       bg:"linear-gradient(135deg,#3a6030,#7aaa60)" },
  { en:"Hydrating · Nourishing",title:"滋潤養陰系列", desc:"銀耳・百合・蓮子，滋陰潤燥，讓肌膚水潤有光", bg:"linear-gradient(135deg,#405070,#80a0c0)" },
  { en:"Draining · Refreshing", title:"消腫代謝系列", desc:"紅豆・陳皮・茯苓，利水消腫，每天輕盈無負擔", bg:"linear-gradient(135deg,#505030,#909060)" },
  { en:"Beauty · Glow",         title:"養顏美白系列", desc:"菊花・枸杞・玫瑰，疏肝活血，由內透出好氣色", bg:"linear-gradient(135deg,#703050,#c07090)" },
];

const planDays = [
  { n:"01", label:"啟動日", meals:[["晨","溫薑水"],["午","紅豆陳皮茶"],["晚","茯苓薏仁山藥湯"]], note:"喝足水，幫助利水效果發揮", hl:false },
  { n:"02", label:"排毒日", meals:[["晨","玫瑰薄荷飲"],["午","紅豆陳皮茶"],["晚","薏仁蓮子粥"]], note:"飲食清淡，讓脾胃喘息", hl:false },
  { n:"03", label:"補氣日", meals:[["晨","溫薑水＋紅棗"],["午","玫瑰薄荷飲"],["晚","黃耆枸杞雞湯"]], note:"黃耆補氣，代謝引擎升溫", hl:false },
  { n:"04", label:"觀察日", meals:[["晨","照鏡看變化"],["午","紅豆陳皮茶"],["晚","茯苓薏仁山藥湯"]], note:"多數人開始感受早起臉較不腫", hl:true },
  { n:"05", label:"深化日", meals:[["晨","玫瑰薄荷飲"],["午","山楂陳皮茶"],["晚","紅豆薏仁甜湯"]], note:"山楂促進消化更順暢", hl:false },
  { n:"06", label:"鞏固日", meals:[["晨","溫薑水"],["午","玫瑰薄荷飲"],["晚","茯苓薏仁山藥湯"]], note:"重複主打湯品鞏固效果", hl:false },
  { n:"07", label:"收穫日", meals:[["晨","自選茶飲"],["午","紅豆陳皮茶"],["晚","銀耳百合湯"]], note:"維持每週 2–3 次，持續累積", hl:false },
];

const herbs = [
  { name:"🌑 茯苓", qi:"「身體的除濕機」",  nat:"性平",   meridian:"歸心肺脾腎", eff:"利水滲濕・健脾和胃・安神定志", desc:"改善臉部浮腫、眼袋與下半身水腫，兼具安神助眠之效", pairs:["薏仁","山藥","紅棗"], warn:"⚠ 頻尿・腎虛者減量" },
  { name:"🌾 薏仁", qi:"「中藥美白精華液」", nat:"性微寒", meridian:"歸脾胃肺",  eff:"健脾利濕・淡斑美白・細緻毛孔", desc:"阻止黑色素沉澱，膚色逐漸均勻透亮，改善暗沉",       pairs:["茯苓","百合","蓮子"], warn:"⚠ 孕婦禁用・必須煮熟" },
  { name:"🥔 山藥", qi:"「天然保濕乳霜」",  nat:"性平",   meridian:"歸脾肺腎",  eff:"補脾益胃・滋養肌膚・固腎益精", desc:"從體內補水補氣，皮膚不油不乾，彈性與光澤明顯改善",   pairs:["枸杞","茯苓","紅棗"], warn:"⚠ 勿與甘遂同用" },
  { name:"🫘 紅豆", qi:"「家常消腫食材」",  nat:"性平",   meridian:"歸心小腸",  eff:"利水消腫・補血活血・清熱解毒", desc:"消除早起眼皮浮腫、久坐腿腫，養血兼顧消水腫",         pairs:["陳皮","薏仁","冬瓜"], warn:"⚠ 頻尿者建議減量" },
  { name:"🍊 陳皮", qi:"「體內天然風扇」",  nat:"性溫",   meridian:"歸脾肺",    eff:"理氣健脾・燥濕化痰・促進代謝", desc:"讓體內氣機流動順暢，水分廢物有效排出，改善面色萎黃", pairs:["紅豆","茯苓","生薑"], warn:"⚠ 陰虛火旺者慎用" },
];

const safetyItems = [
  { tag:"禁忌 · Contraindication", h:"正在服用利尿劑者",   p:"茯苓、薏仁、紅豆均具有一定的利水作用，若與利尿藥物並用，可能加速電解質流失，導致低鉀血症等風險。",           rec:"食用前請告知主治醫師，取得指示後再決定是否使用。" },
  { tag:"孕婦 · Pregnancy",         h:"懷孕及備孕期間",     p:"薏仁具有促進子宮收縮的潛在作用，懷孕期間（尤其前三個月）應避免大量食用。玫瑰花活血，也建議酌量。",               rec:"可改飲山藥湯（去除薏仁），並諮詢婦產科醫師。" },
  { tag:"體質 · Constitution",      h:"陰虛火旺體質",       p:"口乾、手心發熱、盜汗者，大量食用性微寒的薏仁可能加重燥熱感。陳皮偏溫燥，陰虛者也不宜過量。",               rec:"薏仁每次減至 15g，加入百合 20g 或枸杞 15 粒調和。" },
  { tag:"其他注意 · Notes",          h:"頻尿・腎功能異常者", p:"紅豆與茯苓利水效果較為明顯，若有頻尿問題或腎功能偏弱，過量使用可能加重身體負擔。",                           rec:"茯苓每次不超過 10g，紅豆每次不超過 20g。" },
];

const journalItems = [
  { date:"2026.05.01　消腫・利水", title:"早起臉腫？中醫教你從脾胃調起",         desc:"早起浮腫不是喝太多水，而是脾虛代謝不良的信號。三種常見食材幫你消腫...", bg:"linear-gradient(135deg,#c8d8b0,#a0b880)", href:"/recipes" },
  { date:"2026.04.18　美顏・疏肝", title:"臉色蠟黃不是天生的，肝氣通則氣色亮",   desc:"玫瑰、山楂、薄荷三味藥食兩用的食材，讓鬱結的肝氣流動起來，膚色自然...", bg:"linear-gradient(135deg,#f0c0c0,#d08080)", href:"/recipes" },
  { date:"2026.04.05　滋陰・潤燥", title:"銀耳為何被稱為「平民版燕窩」？",       desc:"銀耳富含天然植物性膠質，性平味甘，滋陰潤燥效果早在《本草綱目》中便有...", bg:"linear-gradient(135deg,#d8e8f0,#90b8d0)", href:"/recipes" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function BeautyPage() {
  const [cur, setCur] = useState(0);
  const [showTop, setShowTop] = useState(false);

  const goTo = useCallback((n: number) => {
    setCur((n + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  let touchStartX = 0;
  function handleTouchStart(e: React.TouchEvent) { touchStartX = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(cur + (diff > 0 ? 1 : -1));
  }

  return (
    <div className="beauty-page" style={{ background: "#fff" }}>

      {/* TOP NOTICE */}
      <div className="bp-notice">代謝美顏 · 限定內容　—　7天美顏計劃，從今天開始</div>

      {/* IN-PAGE SUB-NAV */}
      <div style={{ borderBottom: "1px solid #e8e0d2", background: "#fff", position: "sticky", top: "64px", zIndex: 100, overflowX: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "center" }}>
          {[["recommend","推薦食療"],["concept","品牌理念"],["category","食療系列"],["plan","7天計劃"],["materia","食材百科"],["safety","安全指引"],["journal","養生日誌"]].map(([id, label]) => (
            <button key={id} onClick={() => scrollToId(id)}
              style={{ background: "none", border: "none", fontSize: 11, letterSpacing: ".1em", color: "#9a8a72", padding: ".5rem .9rem", cursor: "pointer", whiteSpace: "nowrap" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#3a5c3c")}
              onMouseLeave={e => (e.currentTarget.style.color = "#9a8a72")}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* HERO SLIDER */}
      <div className="bp-hero" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="bp-slides" style={{ transform: `translateX(-${cur * 100}%)` }}>
          {slides.map((s, i) => (
            <div key={i} className="bp-slide">
              <div style={{ background: s.bg, width: "100%", height: "100%", position: "absolute", inset: 0 }} />
              <div className="bp-slide-overlay">
                <div className="bp-slide-content">
                  <div className="bp-slide-tag">{s.tag}</div>
                  <h1 className="bp-slide-title">{s.title}</h1>
                  <p className="bp-slide-desc">{s.desc}</p>
                  <button className="bp-slide-btn" onClick={() => scrollToId(s.anchor)}>{s.btn}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="bp-arrow bp-arrow-prev" onClick={() => goTo(cur - 1)}>&#8249;</button>
        <button className="bp-arrow bp-arrow-next" onClick={() => goTo(cur + 1)}>&#8250;</button>
        <div className="bp-dots">
          {slides.map((_, i) => (
            <button key={i} className={`bp-dot${i === cur ? " active" : ""}`} onClick={() => goTo(i)} />
          ))}
        </div>
      </div>

      {/* RECOMMEND */}
      <section id="recommend">
        <div className="bp-sec-head bp-wrap">
          <span className="bp-sec-en">RECOMMEND</span>
          <h2 className="bp-sec-title">WarmCare 的主打食療</h2>
          <p className="bp-sec-sub">代謝美顏系列・消水腫 × 抗蠟黃<br />脾虛濕重，從食療根本調整</p>
        </div>
        <div className="bp-recommend">
          <div className="bp-wrap">
            <div className="bp-rec-grid">
              {recCards.map((c) => (
                <Link key={c.name} href={c.href} className="bp-rec-card" style={{ display: "block" }}>
                  <div className="bp-rec-img">
                    <div className="bp-rec-img-inner" style={{ background: c.bg, position: "absolute", inset: 0 }} />
                    <span className={`bp-rec-badge${c.gold ? " gold" : ""}`}>{c.badge}</span>
                  </div>
                  <div className="bp-rec-body">
                    <div className="bp-rec-cat">{c.cat}</div>
                    <div className="bp-rec-name">{c.name}</div>
                    <div className="bp-rec-tagline">{c.tagline}</div>
                    <div className="bp-rec-price">{c.time}</div>
                    <div className="bp-rec-pills">{c.pills.map(p => <span key={p} className="bp-rpill">{p}</span>)}</div>
                    <p className="bp-rec-desc">{c.desc}</p>
                    <div className="bp-rec-link">查看完整食譜</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONCEPT */}
      <section id="concept" className="bp-concept">
        <div className="bp-concept-inner">
          <div>
            <div className="bp-concept-label">Secret of Wellness · 養生之道</div>
            <h2 className="bp-concept-title">脾胃是身體的代謝引擎。<br />修復代謝，<br />才能真正消腫抗蠟黃。</h2>
            <p className="bp-concept-body">水腫與蠟黃，其實是同一個問題的兩面——脾虛濕重。中醫的「脾主運化」說明了脾胃就是身體的代謝引擎，引擎動力不足時，水分與廢物無法順暢排出，積聚在臉上就成了浮腫，循環差的地方就呈現暗黃。</p>
            <p className="bp-concept-body">WarmCare 養生道以《黃帝內經》與《本草綱目》為本，採用茯苓・薏仁・山藥・紅豆・陳皮五種食材的三層食療策略——利水、補氣、疏肝——從根本調整代謝，讓氣色由內而外自然改善。</p>
            <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: "1.5rem", fontStyle: "italic", fontFamily: "var(--ital)" }}>資料依據：《黃帝內經・素問》、《本草綱目》李時珍、孫思邈《備急千金要方》</p>
          </div>
          <div>
            <div className="bp-concept-img">🌿</div>
            <div className="bp-concept-caption">中醫傳統藥膳・以食為藥</div>
          </div>
        </div>
      </section>

      {/* CATEGORY */}
      <section id="category" className="bp-category">
        <div className="bp-wrap">
          <div className="bp-sec-head">
            <span className="bp-sec-en">SERIES</span>
            <h2 className="bp-sec-title">食療系列</h2>
            <p className="bp-sec-sub">每道食療各有對應的身體需求，從今天開始選擇最適合你的。</p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2rem" }}>
          <div className="bp-cat-grid">
            {catCards.map((c) => (
              <Link key={c.title} href="/recipes" className="bp-cat-card" style={{ display: "block" }}>
                <div style={{ background: c.bg, position: "absolute", inset: 0, transition: "transform .7s cubic-bezier(.4,0,.2,1)" }} />
                <div className="bp-cat-overlay">
                  <div className="bp-cat-content">
                    <div className="bp-cat-en">{c.en}</div>
                    <div className="bp-cat-title">{c.title}</div>
                    <div className="bp-cat-desc">{c.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7 DAY PLAN */}
      <section id="plan" className="bp-plan">
        <div className="bp-wrap">
          <div className="bp-sec-head">
            <span className="bp-sec-en">SEVEN DAYS</span>
            <h2 className="bp-sec-title">7天代謝美顏週計劃</h2>
            <p className="bp-sec-sub">從啟動到收穫，一週完整養生節奏</p>
          </div>
          <div className="bp-plan-days">
            {planDays.map((d) => (
              <div key={d.n} className={`bp-plan-day${d.hl ? " hl" : ""}`}>
                <div className={`bp-plan-dn${d.hl ? " moss" : ""}`}>{d.n}</div>
                <div className={`bp-plan-dl${d.hl ? " m" : ""}`}>{d.label}</div>
                {d.meals.map(([t, m]) => (
                  <div key={t} className="bp-plan-dm"><span className="bp-plan-dt">{t}</span>{m}</div>
                ))}
                <div className="bp-plan-note">{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIA */}
      <section id="materia" className="bp-materia">
        <div className="bp-wrap">
          <div className="bp-sec-head">
            <span className="bp-sec-en">MATERIA MEDICA</span>
            <h2 className="bp-sec-title">代謝美顏食材百科</h2>
            <p className="bp-sec-sub">依據《本草綱目》與《黃帝內經》，五種核心食材詳解</p>
          </div>
          <div className="bp-ing-wrap">
            <div className="bp-ing-thead"><div>食材</div><div>性味・歸經</div><div>核心功效</div><div>搭配 / 注意</div></div>
            {herbs.map((h) => (
              <div key={h.name} className="bp-ing-row">
                <div><div className="bp-ing-n">{h.name}</div><div className="bp-ing-qi">{h.qi}</div></div>
                <div><span className="bp-ing-nat">{h.nat}</span><br /><span className="bp-ing-sub">{h.meridian}</span></div>
                <div><div className="bp-ing-eff">{h.eff}</div><div className="bp-ing-desc">{h.desc}</div></div>
                <div>
                  <div className="bp-ing-pairs">{h.pairs.map(p => <span key={p} className="bp-ing-pair">{p}</span>)}</div>
                  <div className="bp-ing-warn">{h.warn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY */}
      <section id="safety" className="bp-safety">
        <div className="bp-wrap">
          <div className="bp-sec-head">
            <span className="bp-sec-en">SAFETY GUIDE</span>
            <h2 className="bp-sec-title">安全使用指引</h2>
            <p className="bp-sec-sub">食療前請確認自身狀況，部分族群需特別留意</p>
          </div>
          <div className="bp-safety-grid">
            {safetyItems.map((s) => (
              <div key={s.h} className="bp-safety-cell">
                <div className="bp-safety-tag">{s.tag}</div>
                <h3 className="bp-safety-h">{s.h}</h3>
                <p className="bp-safety-p">{s.p}</p>
                <div className="bp-safety-rec">{s.rec}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section id="journal" className="bp-journal">
        <div className="bp-wrap">
          <div className="bp-sec-head">
            <span className="bp-sec-en">JOURNAL</span>
            <h2 className="bp-sec-title">養生日誌</h2>
            <p className="bp-sec-sub">從中醫智慧到日常生活，讓養生更簡單</p>
          </div>
          <div className="bp-journal-grid">
            {journalItems.map((j) => (
              <Link key={j.title} href={j.href} className="bp-jcard" style={{ display: "block" }}>
                <div className="bp-jcard-img">
                  <div className="bp-jcard-img-inner" style={{ background: j.bg }} />
                </div>
                <div className="bp-jcard-date">{j.date}</div>
                <div className="bp-jcard-title">{j.title}</div>
                <div className="bp-jcard-desc">{j.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <div className="bp-disc">
        <div className="bp-wrap">
          <div className="bp-disc-h">健康聲明與免責說明</div>
          <p className="bp-disc-p">本頁面所刊載之食療食譜、本草食材介紹、七天養生計劃及相關說明，<strong>僅供一般大眾健康教育與日常飲食參考之用，不構成任何形式的醫療建議、疾病診斷或治療指引</strong>，亦不應被視為替代專業醫療意見之依據。個人體質、健康狀況、正在服用的藥物及潛在病症各有不同，食材的實際效果因人而異。如您有正在接受藥物治療、患有慢性疾病、處於懷孕或哺乳期、免疫功能低下、65 歲以上長者、有食物過敏或特殊飲食限制等情況，<strong>請務必在嘗試本頁食療建議之前，先行諮詢合格醫師、中醫師或藥師</strong>。WarmCare 養生道對因使用本頁資訊而產生的任何直接或間接損害，不承擔法律責任。</p>
        </div>
      </div>

      {/* CTA */}
      <section className="bp-cta">
        <div className="bp-wrap">
          <h2 className="bp-cta-title">讓食療更精準——先了解你的體質</h2>
          <p className="bp-cta-sub">每個人的水腫蠟黃成因不同，做完免費體質測評，取得專屬的代謝美顏建議。</p>
          <div className="bp-cta-btns">
            <Link href="/quiz"         className="bp-btn-fill">🧬 免費體質測評</Link>
            <Link href="/recipes"      className="bp-btn-line">🍲 瀏覽更多食療食譜</Link>
            <Link href="/herb-checker" className="bp-btn-line">🌿 本草食材查詢</Link>
          </div>
        </div>
      </section>

      {/* SCROLL TO TOP */}
      <button className={`bp-scroll-top${showTop ? " show" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
    </div>
  );
}
