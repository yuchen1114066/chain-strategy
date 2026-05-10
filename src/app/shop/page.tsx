"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { products as defaultProducts } from "@/lib/data";

// Design tokens
const M = "#3a5c3c", M2 = "#5a7c5c", M3 = "#8aaa8c", M4 = "#eaf2ea";
const INK = "#1a1612", INK2 = "#4a4038", INK3 = "#8a7a68", INK4 = "#b8a890";
const OFF = "#f8f5f0", OFF2 = "#f0ebe3", BRD = "#e5ddd3", BRD2 = "#d5c8b8";
const ROSE = "#b84840", GOLD2 = "#c4a040";

const CONST_MAP: Record<string, string> = {
  "qi-xu": "氣虛質", "yin-xu": "陰虛質", "yang-xu": "陽虛質",
  "xue-yu": "血瘀質", "qi-yu": "氣鬱質", "tan-shi": "痰濕質",
  "shi-re": "濕熱質", "ping-he": "平和質", "xue-xu": "血虛質",
};
const CONST_FILTERS = ["全部", "氣虛質", "陰虛質", "陽虛質", "痰濕質", "血瘀質", "氣鬱質", "濕熱質", "平和質"];
const CATEGORIES = ["全部", "補氣養生", "女性養生", "美容養顏", "祛濕保健", "抗炎保健", "活血保健", "滋補食材", "情緒養生", "季節禮盒", "訂閱服務"];
const CAT_EMOJI: Record<string, string> = {
  "補氣養生": "🌿", "補氣滋補": "🌿", "女性養生": "🌸", "美容養顏": "💎",
  "祛濕保健": "💧", "抗炎保健": "🔶", "活血保健": "❤️",
  "滋補食材": "🫐", "情緒養生": "🌹", "季節禮盒": "🎁", "訂閱服務": "📦",
};
const CAT_GRAD: Record<string, string> = {
  "補氣養生": "from-amber-50 to-yellow-100", "補氣滋補": "from-amber-50 to-yellow-100",
  "女性養生": "from-pink-50 to-rose-100", "美容養顏": "from-sky-50 to-blue-100",
  "祛濕保健": "from-teal-50 to-cyan-100", "抗炎保健": "from-orange-50 to-amber-100",
  "活血保健": "from-red-50 to-rose-100", "滋補食材": "from-violet-50 to-purple-100",
  "情緒養生": "from-pink-100 to-rose-200", "季節禮盒": "from-orange-100 to-red-200",
  "訂閱服務": "from-stone-100 to-gray-200",
};

interface SP {
  id: string; name: string; category: string; tagline: string;
  description: string; spec: string; price: number; originalPrice?: number;
  badge?: string; badgeType: "rose" | "dark" | "gold" | "";
  constitutions: string[]; inStock: boolean; grad: string;
}

function normalize(p: typeof defaultProducts[0]): SP {
  const cs = (p.constitution || []).map(id => CONST_MAP[id] || id);
  const BADGE_TYPE: Record<string, SP["badgeType"]> = {
    "熱銷": "rose", "暢銷": "rose", "女性首選": "rose",
    "新品": "dark", "冬季限定": "dark",
    "特價": "gold", "中醫推薦": "gold",
  };
  return {
    id: p.id, name: p.name, category: p.category,
    tagline: (p as unknown as { tagline?: string }).tagline || cs.slice(0, 2).join("・"),
    description: p.description,
    spec: (p.features || []).slice(0, 2).join(" · "),
    price: p.price, originalPrice: p.originalPrice,
    badge: p.badge, badgeType: p.badge ? (BADGE_TYPE[p.badge] || "") : "",
    constitutions: cs, inStock: p.inStock,
    grad: (p as unknown as { imageColor?: string }).imageColor || CAT_GRAD[p.category] || "from-stone-50 to-stone-100",
  };
}

function fromAdmin(p: Record<string, unknown>): SP {
  const cs = Array.isArray(p.consts) ? (p.consts as string[]) : [];
  const cat = (p.cat as string) || "";
  return {
    id: String(p.id), name: String(p.name), category: cat,
    tagline: String(p.tagline || ""), description: String(p.desc || ""),
    spec: String(p.spec || ""), price: Number(p.price) || 0,
    originalPrice: p.orig ? Number(p.orig) : undefined,
    badge: (p.badge as string) || undefined, badgeType: "",
    constitutions: cs, inStock: p.status !== "off",
    grad: CAT_GRAD[cat] || "from-stone-50 to-stone-100",
  };
}

const BADGE_COLOR: Record<string, string> = {
  rose: ROSE, dark: INK, gold: GOLD2,
};

export default function ShopPage() {
  const [prods, setProds] = useState<SP[]>([]);
  const [cart, setCart] = useState(0);
  const [sel, setSel] = useState("全部");
  const [selCf, setSelCf] = useState("全部");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<SP | null>(null);
  const [toast, setToast] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wc_shop_prods");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>[];
        setProds(parsed.map(fromAdmin));
      } else {
        setProds(defaultProducts.map(normalize));
      }
    } catch {
      setProds(defaultProducts.map(normalize));
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  function addCart(p: SP, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!p.inStock) return;
    setCart(c => c + 1);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1800);
    showToast(`✓ ${p.name} 已加入購物車`);
    window.dispatchEvent(new CustomEvent("wc_cart_add", { detail: { name: p.name, price: p.price } }));
  }

  const cats = CATEGORIES.filter(c => c === "全部" || prods.some(p => p.category === c));
  const catCount = (c: string) => prods.filter(p => p.category === c).length;

  const filtered = prods
    .filter(p => {
      const ms = !search || p.name.includes(search) || p.description.includes(search);
      const mc = sel === "全部" || p.category === sel;
      const mf = selCf === "全部" || p.constitutions.some(c => c.includes(selCf));
      return ms && mc && mf && p.inStock;
    })
    .sort((a, b) => {
      if (sort === "pa") return a.price - b.price;
      if (sort === "pd") return b.price - a.price;
      return 0;
    });

  return (
    <div style={{ background: OFF, minHeight: "100vh", fontFamily: "'Noto Sans TC', sans-serif", color: INK }}>
      {/* Trust bar */}
      <div style={{ background: M, color: "#fff", fontSize: 11, letterSpacing: ".06em", padding: ".4rem 1rem", display: "flex", justifyContent: "center", gap: "clamp(1rem,3vw,2.5rem)", flexWrap: "wrap" }}>
        <span>🚚 滿 NT$1,500 免運費</span>
        <span>🏅 SGS 品質認證</span>
        <span>🔄 7 天退換貨保障</span>
        <span>🌿 台灣在地有機農場</span>
      </div>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: ".65rem 1.5rem", fontSize: 11, color: INK3, display: "flex", gap: ".4rem" }}>
        <Link href="/" style={{ color: INK3 }}>首頁</Link>
        <span>/</span><span>養生商城</span>
      </div>

      {/* Shop hero */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BRD}`, padding: "2rem 1.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 300, color: INK }}>
              養生商城
              <span style={{ display: "block", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: ".82rem", color: INK3, letterSpacing: ".1em", marginTop: ".15rem" }}>Wellness Shop</span>
            </h1>
            <p style={{ fontSize: 12, color: INK3, marginTop: ".5rem" }}>嚴選台灣在地有機藥材・傳統藥膳食材・四季養生茶飲</p>
          </div>
          <div style={{ display: "flex", gap: ".6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋商品..."
                style={{ padding: ".3rem .5rem .3rem 1.8rem", border: `1px solid ${BRD2}`, fontSize: 12, color: INK2, background: "#fff", width: 160 }} />
              <span style={{ position: "absolute", left: ".5rem", top: "50%", transform: "translateY(-50%)", fontSize: 12, color: INK3 }}>🔍</span>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: ".3rem .55rem", border: `1px solid ${BRD2}`, fontSize: 12, color: INK2, background: "#fff" }}>
              <option value="default">預設排序</option>
              <option value="pa">價格低→高</option>
              <option value="pd">價格高→低</option>
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".3rem .8rem", border: `1px solid ${BRD2}`, fontSize: 12, color: INK2, background: "#fff", cursor: "pointer" }}>
              🛒 {cart}
            </div>
          </div>
        </div>
      </div>

      {/* Constitution filter */}
      <div style={{ background: M4, borderBottom: `1px solid ${BRD}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: ".8rem 1.5rem" }}>
          <div style={{ fontSize: 9, letterSpacing: ".2em", color: M, textTransform: "uppercase", fontWeight: 500, marginBottom: ".5rem" }}>依體質篩選</div>
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
            {CONST_FILTERS.map(cf => (
              <button key={cf} onClick={() => setSelCf(cf)}
                style={{ fontSize: 12, padding: ".25rem .7rem", border: `1px solid ${selCf === cf ? M : M3}`, borderRadius: 999, background: selCf === cf ? M : "#fff", color: selCf === cf ? "#fff" : INK2, cursor: "pointer", whiteSpace: "nowrap" }}>
                {cf}
              </button>
            ))}
            {selCf !== "全部" && (
              <span style={{ marginLeft: "auto", fontSize: 11, color: M, cursor: "pointer", borderBottom: `1px solid ${M3}` }} onClick={() => setSelCf("全部")}>顯示全部</span>
            )}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "1.5rem 1.5rem 4rem", display: "grid", gridTemplateColumns: "190px 1fr", gap: "2rem" }} className="shop-layout">

        {/* Sidebar */}
        <aside className="shop-sidebar">
          <div style={{ marginBottom: "1.8rem" }}>
            <div style={{ fontSize: 9, letterSpacing: ".18em", color: INK3, textTransform: "uppercase", marginBottom: ".7rem", paddingBottom: ".45rem", borderBottom: `1px solid ${BRD}`, fontWeight: 500 }}>商品分類</div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 1 }}>
              {cats.map(c => (
                <li key={c}>
                  <button onClick={() => setSel(c)} style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: sel === c ? M : INK2, padding: ".35rem .45rem", background: sel === c ? M4 : "transparent", border: "none", cursor: "pointer" }}>
                    <span>{c === "全部" ? "全部商品" : c}</span>
                    {c !== "全部" && <span style={{ fontSize: 11, color: INK4 }}>{catCount(c)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ padding: ".9rem", background: M4, border: `1px solid ${BRD}`, textAlign: "center" }}>
            <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: 13, color: M, marginBottom: ".35rem" }}>免費體質測評</div>
            <div style={{ fontSize: 11, color: INK3, lineHeight: 1.7, marginBottom: ".6rem" }}>了解您的體質<br />找到最適合的養生商品</div>
            <Link href="/quiz" style={{ display: "block", fontSize: 11, padding: ".4rem", background: M, color: "#fff", textAlign: "center", letterSpacing: ".06em" }}>立即測評 →</Link>
          </div>
        </aside>

        {/* Product area */}
        <main>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: ".7rem", borderBottom: `1px solid ${BRD}`, marginBottom: "1.1rem", flexWrap: "wrap", gap: ".5rem" }}>
            <span style={{ fontSize: 12, color: INK3 }}>
              {sel !== "全部" && <span style={{ color: INK, fontWeight: 500, marginRight: ".4rem" }}>{sel}</span>}
              共 <strong style={{ color: INK }}>{filtered.length}</strong> 件商品
            </span>
          </div>

          {/* Mobile category scroll */}
          <div className="shop-mob-cats" style={{ display: "none", gap: ".4rem", overflowX: "auto", paddingBottom: ".6rem", marginBottom: ".8rem" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setSel(c)}
                style={{ fontSize: 11, padding: ".25rem .65rem", border: `1px solid ${sel === c ? INK : BRD2}`, background: sel === c ? INK : "#fff", color: sel === c ? "#fff" : INK2, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}>
                {c === "全部" ? "全部商品" : c}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: BRD }} className="pgrid">
              {filtered.map(p => (
                <div key={p.id} onClick={() => setDetail(p)}
                  style={{ background: "#fff", cursor: "pointer", position: "relative", transition: "background .15s" }}
                  className="pcard">
                  {p.badge && (
                    <span style={{ position: "absolute", top: ".6rem", left: ".6rem", zIndex: 2, fontSize: 9, letterSpacing: ".1em", padding: ".18rem .5rem", fontWeight: 500, textTransform: "uppercase", background: BADGE_COLOR[p.badgeType] || INK, color: "#fff" }}>
                      {p.badge}
                    </span>
                  )}
                  <div className={`bg-gradient-to-br ${p.grad}`} style={{ aspectRatio: "1", position: "relative", borderBottom: `1px solid ${BRD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 60, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.1))" }}>{CAT_EMOJI[p.category] || "🌿"}</span>
                    <button onClick={e => { e.stopPropagation(); }} title="收藏"
                      style={{ position: "absolute", bottom: ".55rem", right: ".55rem", width: 26, height: 26, background: "rgba(255,255,255,.88)", border: `1px solid ${BRD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer", opacity: 0 }} className="pwish">♡</button>
                  </div>
                  <div style={{ padding: ".9rem" }}>
                    <div style={{ fontSize: 9, letterSpacing: ".12em", color: INK3, textTransform: "uppercase", marginBottom: ".25rem" }}>{p.category}</div>
                    <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: ".9rem", color: INK, lineHeight: 1.4, marginBottom: ".25rem" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: INK3, lineHeight: 1.6, marginBottom: ".7rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".4rem" }}>
                      <div>
                        <span style={{ fontSize: 13, color: INK }}>NT${p.price.toLocaleString()}</span>
                        {p.originalPrice && <span style={{ fontSize: 10, color: INK4, textDecoration: "line-through", marginLeft: ".3rem" }}>NT${p.originalPrice.toLocaleString()}</span>}
                      </div>
                      <button onClick={e => addCart(p, e)}
                        style={{ fontSize: 11, padding: ".3rem .6rem", border: `1px solid ${addedId === p.id ? M : BRD2}`, background: addedId === p.id ? M : "transparent", color: addedId === p.id ? "#fff" : INK2, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>
                        {addedId === p.id ? "✓ 已加入" : "+ 加入"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", color: INK3, fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: "1rem" }}>🔍</div>
              <p>找不到相關商品</p>
              <button onClick={() => { setSearch(""); setSel("全部"); setSelCf("全部"); }}
                style={{ marginTop: "1rem", padding: ".4rem 1rem", border: `1px solid ${BRD2}`, fontSize: 12, color: INK2, background: "#fff", cursor: "pointer" }}>清除篩選</button>
            </div>
          )}
        </main>
      </div>

      {/* Subscription */}
      <div style={{ background: INK, color: "#fff", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ fontSize: 9, letterSpacing: ".18em", color: M3, textTransform: "uppercase", marginBottom: ".6rem" }}>SUBSCRIPTION</div>
          <h2 style={{ fontFamily: "'Noto Serif TC', serif", fontSize: "clamp(1.3rem,2.5vw,1.7rem)", fontWeight: 300, lineHeight: 1.4, marginBottom: ".7rem" }}>節氣養生月訂盒<br />跟著自然節律，照顧您的健康</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.9, marginBottom: "1.2rem", maxWidth: 480 }}>依據二十四節氣設計，每月配送當季最適合的養生食材與茶飲，附中醫師親撰養生建議書。</p>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: ".35rem", marginBottom: "1.2rem" }}>
            {["每月節氣主題養生食材 × 6–8 件", "中醫師親撰養生建議書", "專屬體質調整建議", "免運費全台配送"].map(t => (
              <li key={t} style={{ fontSize: 12, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                <span style={{ color: M3 }}>›</span>{t}
              </li>
            ))}
          </ul>
          <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: "1.2rem", marginBottom: ".9rem" }}>
            NT$1,200 <span style={{ fontSize: ".8rem", color: "rgba(255,255,255,.4)" }}>/ 月</span>
          </div>
          <button style={{ padding: ".65rem 1.8rem", background: M, color: "#fff", fontSize: 12, letterSpacing: ".1em", border: "none", cursor: "pointer" }}>立即訂閱</button>
        </div>
      </div>

      {/* Trust band */}
      <div style={{ background: "#fff", borderTop: `1px solid ${BRD}`, padding: "1.8rem 1.5rem" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.5rem", textAlign: "center" }} className="trust-grid">
          {[
            { ic: "🏅", t: "SGS 品質認證", d: "所有產品通過 SGS 第三方安全檢測" },
            { ic: "🌱", t: "台灣在地農場", d: "嚴選台灣在地有機藥材，溯源透明" },
            { ic: "🔄", t: "7 天退換保障", d: "收到商品後 7 天內無條件退換" },
            { ic: "👨‍⚕️", t: "中醫師審核", d: "所有養生建議均經合格中醫師審定" },
          ].map(i => (
            <div key={i.t}>
              <div style={{ fontSize: 20, marginBottom: ".4rem" }}>{i.ic}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: INK, marginBottom: ".2rem" }}>{i.t}</div>
              <div style={{ fontSize: 11, color: INK3, lineHeight: 1.6 }}>{i.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div onClick={() => setDetail(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,.58)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.2rem" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", maxWidth: 800, width: "100%", maxHeight: "90vh", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1.05fr", position: "relative" }} className="det-modal">
            <button onClick={() => setDetail(null)}
              style={{ position: "absolute", top: ".7rem", right: ".7rem", width: 30, height: 30, background: OFF2, border: `1px solid ${BRD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: INK2, zIndex: 2 }}>×</button>
            <div className={`bg-gradient-to-br ${detail.grad}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }}>
              <span style={{ fontSize: 100, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.1))" }}>{CAT_EMOJI[detail.category] || "🌿"}</span>
            </div>
            <div style={{ padding: "1.8rem", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 9, letterSpacing: ".15em", color: INK3, textTransform: "uppercase", marginBottom: ".4rem" }}>{detail.category}</div>
              <div style={{ fontFamily: "'Noto Serif TC', serif", fontSize: "1.2rem", fontWeight: 300, color: INK, marginBottom: ".35rem", lineHeight: 1.4 }}>{detail.name}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: ".9rem", color: INK3, marginBottom: ".9rem" }}>{detail.tagline}</div>
              <div style={{ fontSize: 13, color: INK2, lineHeight: 1.85, marginBottom: "1rem" }}>{detail.description}</div>
              {detail.constitutions.length > 0 && (
                <div style={{ background: M4, border: `1px solid ${BRD}`, padding: ".75rem .9rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: 9, letterSpacing: ".12em", color: M, textTransform: "uppercase", marginBottom: ".4rem", fontWeight: 500 }}>適合體質</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem" }}>
                    {detail.constitutions.map(c => (
                      <span key={c} style={{ fontSize: 11, padding: ".18rem .55rem", border: `1px solid ${M3}`, color: M, background: "#fff" }}>{c}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: INK3, marginTop: ".4rem" }}>
                    <Link href="/quiz" style={{ color: M, borderBottom: `1px solid ${M3}` }}>不確定自己的體質？立即測評 →</Link>
                  </div>
                </div>
              )}
              {detail.spec && (
                <div style={{ fontSize: 12, color: INK3, lineHeight: 1.8, marginBottom: "1rem", padding: ".65rem .75rem", background: OFF, borderLeft: `2px solid ${BRD2}` }}>{detail.spec}</div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", gap: ".5rem", marginBottom: ".9rem" }}>
                <span style={{ fontSize: "1.3rem", color: INK }}>NT${detail.price.toLocaleString()}</span>
                {detail.originalPrice && <span style={{ fontSize: ".95rem", color: INK4, textDecoration: "line-through" }}>NT${detail.originalPrice.toLocaleString()}</span>}
              </div>
              <button onClick={() => { addCart(detail); setDetail(null); }}
                style={{ width: "100%", padding: ".8rem", background: M, color: "#fff", border: "none", fontSize: 13, letterSpacing: ".08em", cursor: "pointer", marginBottom: ".5rem" }}>
                加入購物車
              </button>
              <button onClick={() => setDetail(null)}
                style={{ width: "100%", padding: ".6rem", background: "transparent", color: INK2, border: `1px solid ${BRD2}`, fontSize: 12, cursor: "pointer", letterSpacing: ".06em" }}>
                繼續瀏覽
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: "fixed", top: 76, right: "1.5rem", background: M, color: "#fff", padding: ".65rem 1.1rem", fontSize: 12, zIndex: 9999, letterSpacing: ".05em", opacity: toast ? 1 : 0, transform: toast ? "translateY(0)" : "translateY(-8px)", transition: "all .25s", pointerEvents: "none" }}>
        {toast}
      </div>

      <style>{`
        .shop-layout { grid-template-columns: 190px 1fr }
        @media(max-width:840px){
          .shop-layout { grid-template-columns:1fr !important }
          .shop-sidebar { display:none !important }
          .shop-mob-cats { display:flex !important }
          .pgrid { grid-template-columns:repeat(2,1fr) !important }
          .det-modal { grid-template-columns:1fr !important }
          .trust-grid { grid-template-columns:repeat(2,1fr) !important }
        }
        @media(max-width:520px){
          .pgrid { grid-template-columns:1fr !important }
          .trust-grid { grid-template-columns:1fr !important }
        }
        .pcard:hover { background:${OFF} !important }
        .pcard:hover .pwish { opacity:1 !important }
      `}</style>
    </div>
  );
}
