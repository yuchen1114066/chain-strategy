"use client";

import { useState } from "react";
import { ShoppingCart, Search, Star, X, Check, Truck, Shield, RefreshCw } from "lucide-react";
import { products, constitutions } from "@/lib/data";
import Link from "next/link";

const categories = ["全部", "補氣養生", "女性養生", "美容養顏", "祛濕保健", "抗炎保健", "活血保健", "滋補食材", "情緒養生", "季節禮盒", "訂閱服務"];

const categoryEmoji: Record<string, string> = {
  "補氣養生": "🌿", "女性養生": "🌸", "美容養顏": "💎", "祛濕保健": "💧",
  "抗炎保健": "🔶", "活血保健": "❤️", "滋補食材": "🫐", "情緒養生": "🌹",
  "季節禮盒": "🎁", "訂閱服務": "📦",
};

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedConstitution, setSelectedConstitution] = useState("全部");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "rating">("default");
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  const filtered = products
    .filter((p) => {
      const matchSearch = !search || p.name.includes(search) || p.description.includes(search);
      const matchCat = selectedCategory === "全部" || p.category === selectedCategory;
      const matchConstitution = selectedConstitution === "全部" || p.constitution?.includes(selectedConstitution);
      return matchSearch && matchCat && matchConstitution;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  function handleAddToCart(productId: string) {
    setCartCount((c) => c + 1);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">

      {/* Top info bar */}
      <div className="border-b border-[#e8e8e8] bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap gap-4 justify-center text-xs text-[#666]">
          <span className="flex items-center gap-1"><Truck className="w-3 h-3" />滿 NT$1,500 免運費</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />SGS 品質認證</span>
          <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />7 天退換貨保障</span>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="text-xs text-[#999] mb-4">
          <Link href="/" className="hover:text-[#c0392b] transition-colors">首頁</Link>
          <span className="mx-2">/</span>
          <span>養生商城</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e0e0e0] pb-5">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-[#1a1a1a] mb-1">養生商城</h1>
            <p className="text-sm text-[#888]">嚴選台灣在地有機藥材・傳統藥膳食材・四季養生茶飲</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
              <input
                type="text"
                placeholder="搜尋商品..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 py-2 border border-[#ddd] text-sm text-[#333] placeholder-[#bbb] focus:outline-none focus:border-[#999] transition-colors w-48"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#666]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="py-2 px-3 border border-[#ddd] text-sm text-[#333] focus:outline-none focus:border-[#999] transition-colors"
            >
              <option value="default">預設排序</option>
              <option value="price-asc">價格低→高</option>
              <option value="price-desc">價格高→低</option>
              <option value="rating">評分最高</option>
            </select>
            {/* Cart */}
            <div className="flex items-center gap-1.5 border border-[#ddd] px-3 py-2 text-sm text-[#333]">
              <ShoppingCart className="w-4 h-4" />
              <span>{cartCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: sidebar + grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex gap-10">

          {/* Left Sidebar — desktop */}
          <aside className="hidden md:block w-44 flex-shrink-0 pt-4">
            {/* Categories */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-[#999] tracking-widest uppercase mb-3">商品分類</p>
              <ul className="space-y-0.5">
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left text-sm py-1.5 px-2 transition-colors ${
                        selectedCategory === cat
                          ? "text-[#c0392b] font-medium"
                          : "text-[#555] hover:text-[#c0392b]"
                      }`}
                    >
                      {cat === "全部" ? "すべての商品" : cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Constitution filter */}
            <div>
              <p className="text-xs font-semibold text-[#999] tracking-widest uppercase mb-3">適合體質</p>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => setSelectedConstitution("全部")}
                    className={`w-full text-left text-sm py-1.5 px-2 transition-colors ${
                      selectedConstitution === "全部" ? "text-[#c0392b] font-medium" : "text-[#555] hover:text-[#c0392b]"
                    }`}
                  >
                    所有體質
                  </button>
                </li>
                {constitutions.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedConstitution(c.id)}
                      className={`w-full text-left text-sm py-1.5 px-2 transition-colors ${
                        selectedConstitution === c.id ? "text-[#c0392b] font-medium" : "text-[#555] hover:text-[#c0392b]"
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Mobile category tabs */}
          <div className="md:hidden w-full pt-4">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 border whitespace-nowrap transition-colors flex-shrink-0 ${
                    selectedCategory === cat
                      ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                      : "border-[#ddd] text-[#555] hover:border-[#999]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <main className="flex-1 pt-4 min-w-0">
            {/* Section title */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#888]">
                {selectedCategory !== "全部" && (
                  <span className="text-[#1a1a1a] font-medium mr-2">{selectedCategory}</span>
                )}
                共 <span className="text-[#1a1a1a] font-medium">{filtered.length}</span> 件商品
              </p>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {filtered.map((product) => (
                  <div key={product.id} className="group">
                    {/* Product Image Area */}
                    <div className={`relative w-full aspect-[4/3] bg-gradient-to-br ${product.imageColor} flex items-center justify-center overflow-hidden mb-4`}>
                      <span className="text-7xl filter drop-shadow-sm">
                        {categoryEmoji[product.category] ?? "🌿"}
                      </span>
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {product.badge && (
                          <span className="bg-[#c0392b] text-white text-xs px-2 py-0.5 tracking-wide">
                            {product.badge}
                          </span>
                        )}
                        {product.originalPrice && (
                          <span className="bg-[#1a1a1a] text-white text-xs px-2 py-0.5 tracking-wide">
                            特價
                          </span>
                        )}
                        {!product.inStock && (
                          <span className="bg-[#999] text-white text-xs px-2 py-0.5 tracking-wide">
                            缺貨
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div>
                      <p className="text-xs text-[#999] mb-1">{product.category}</p>
                      <h3 className="text-sm font-medium text-[#1a1a1a] mb-1.5 leading-snug group-hover:text-[#c0392b] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#777] leading-relaxed mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Stars */}
                      <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map((i) => (
                          <Star key={i} className={`w-3 h-3 ${i <= Math.round(product.rating) ? "fill-[#c0392b] text-[#c0392b]" : "text-[#e0e0e0]"}`} />
                        ))}
                        <span className="text-xs text-[#999] ml-1">({product.reviews})</span>
                      </div>

                      {/* Price + Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-medium text-[#1a1a1a]">NT${product.price.toLocaleString()}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-[#bbb] line-through">NT${product.originalPrice.toLocaleString()}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={!product.inStock}
                          className={`flex items-center gap-1.5 text-xs px-4 py-2 border transition-colors ${
                            addedId === product.id
                              ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                              : product.inStock
                              ? "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                              : "border-[#ddd] text-[#bbb] cursor-not-allowed"
                          }`}
                        >
                          {addedId === product.id ? (
                            <><Check className="w-3 h-3" />已加入</>
                          ) : product.inStock ? (
                            <>加入購物車</>
                          ) : (
                            <>暫時缺貨</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 border border-[#eee]">
                <p className="text-[#999] text-sm mb-4">找不到相關商品</p>
                <button
                  onClick={() => { setSearch(""); setSelectedCategory("全部"); setSelectedConstitution("全部"); }}
                  className="text-xs border border-[#1a1a1a] text-[#1a1a1a] px-5 py-2 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  清除篩選
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Bottom Banner — 3 tiles like kobai.jp */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#e0e0e0]">
          {[
            {
              emoji: "📦",
              bg: "from-stone-700 to-stone-900",
              label: "節氣養生月訂盒",
              desc: "依二十四節氣設計，每月配送當季養生食材與茶飲，附養生建議書。NT$1,200/月",
            },
            {
              emoji: "🌿",
              bg: "from-green-700 to-green-900",
              label: "本草原料溯源認證",
              desc: "所有食材均通過 SGS 檢驗，產地直送，讓您安心食用每一口養生好物。",
            },
            {
              emoji: "🏪",
              bg: "from-amber-700 to-amber-900",
              label: "養生道實體門市",
              desc: "台北・台中・高雄均設有實體體驗館，歡迎預約免費體質諮詢服務。",
            },
          ].map((tile) => (
            <div
              key={tile.label}
              className={`bg-gradient-to-br ${tile.bg} text-white p-8 flex flex-col justify-end min-h-[200px] cursor-pointer group`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{tile.emoji}</div>
              <p className="text-sm font-semibold mb-1 tracking-wide">{tile.label}</p>
              <p className="text-xs text-white/70 leading-relaxed">{tile.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
