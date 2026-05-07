"use client";

import { useState } from "react";
import { ShoppingCart, Star, Search, Filter, Tag, Truck, Shield, RefreshCw, Heart, X } from "lucide-react";
import { products, constitutions } from "@/lib/data";
import Link from "next/link";

const categories = ["全部", "補氣養生", "女性養生", "美容養顏", "祛濕保健", "抗炎保健", "活血保健", "滋補食材", "情緒養生", "季節禮盒", "訂閱服務", "專業服務"];

export default function ShopPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedConstitution, setSelectedConstitution] = useState("全部");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "rating">("default");
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);

  const filtered = products
    .filter((p) => {
      const matchSearch = !search || p.name.includes(search) || p.description.includes(search) || p.category.includes(search);
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
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 to-stone-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3 text-green-300 text-sm">
            <Link href="/" className="hover:text-white transition-colors">首頁</Link>
            <span>/</span>
            <span>養生商城</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">養生商城</h1>
              <p className="text-stone-300 text-base max-w-xl">
                嚴選台灣在地有機藥材、傳統藥膳食材包、養生茶飲，讓您在家輕鬆實踐中醫養生。
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-amber-300" />
              <div>
                <div className="text-white font-bold">{cartCount} 件商品</div>
                <div className="text-xs text-stone-400">購物車</div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { icon: Truck, text: "滿 $1500 免運費" },
              { icon: Shield, text: "SGS品質認證" },
              { icon: RefreshCw, text: "7天退換貨保障" },
              { icon: Tag, text: "正品保證溯源" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-stone-300">
                <Icon className="w-4 h-4 text-green-400" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="搜尋商品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 focus:outline-none focus:border-amber-400 transition-all"
          >
            <option value="default">預設排序</option>
            <option value="price-asc">價格由低到高</option>
            <option value="price-desc">價格由高到低</option>
            <option value="rating">評分最高</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-green-700 border-green-700 text-white"
                  : "bg-white border-stone-200 text-stone-600 hover:border-green-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Constitution Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedConstitution("全部")}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap ${
              selectedConstitution === "全部"
                ? "bg-amber-600 border-amber-600 text-white"
                : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"
            }`}
          >
            所有體質
          </button>
          {constitutions.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedConstitution(c.id)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap ${
                selectedConstitution === c.id
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-stone-500 mb-5">
          共 <strong className="text-stone-700">{filtered.length}</strong> 件商品
        </p>

        {/* Product Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-stone-100 group flex flex-col"
              >
                {/* Product Image */}
                <div className={`h-44 bg-gradient-to-br ${product.imageColor} relative flex items-center justify-center`}>
                  <span className="text-6xl filter drop-shadow-sm">
                    {product.category === "補氣養生" ? "🌿" :
                     product.category === "女性養生" ? "🌸" :
                     product.category === "美容養顏" ? "💎" :
                     product.category === "祛濕保健" ? "💧" :
                     product.category === "抗炎保健" ? "🔶" :
                     product.category === "活血保健" ? "❤️" :
                     product.category === "滋補食材" ? "🫐" :
                     product.category === "情緒養生" ? "🌹" :
                     product.category === "季節禮盒" ? "🎁" :
                     product.category === "訂閱服務" ? "📦" :
                     product.category === "專業服務" ? "👨‍⚕️" : "🌿"}
                  </span>
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {product.badge}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        特價
                      </span>
                    )}
                  </div>
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                    <Heart className="w-4 h-4 text-stone-400 hover:text-red-400 transition-colors" />
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                    {!product.inStock && (
                      <span className="text-xs bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                        暫時缺貨
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-stone-800 mb-1.5 group-hover:text-green-700 transition-colors leading-snug">
                    {product.name}
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3 flex-1">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.features.slice(0, 3).map((f) => (
                      <span key={f} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-stone-200"}`}
                      />
                    ))}
                    <span className="text-xs text-stone-500 ml-1">({product.reviews})</span>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-green-800">NT${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-stone-400 line-through ml-2">NT${product.originalPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={!product.inStock}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        addedId === product.id
                          ? "bg-green-600 text-white"
                          : product.inStock
                          ? "bg-green-700 hover:bg-green-600 text-white hover:shadow-md"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {addedId === product.id ? "已加入！" : product.inStock ? "加入購物車" : "缺貨"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">找不到相關商品</h3>
            <p className="text-stone-500 mb-6">嘗試更換搜尋條件或篩選選項</p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory("全部"); setSelectedConstitution("全部"); }}
              className="px-6 py-3 bg-green-700 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              清除所有篩選
            </button>
          </div>
        )}

        {/* Subscription Banner */}
        <div className="mt-16 bg-gradient-to-br from-green-800 to-stone-800 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-3xl mb-2">📦</div>
              <h3 className="text-2xl font-bold mb-2">節氣養生月訂盒</h3>
              <p className="text-stone-300 text-sm max-w-md leading-relaxed">
                依據二十四節氣設計，每月配送當季最適合的養生食材和茶飲，附當月養生建議書。
                NT$1,200/月，隨時可取消。
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {["每月配送", "節氣主題", "個人化建議", "可隨時取消"].map((f) => (
                  <span key={f} className="text-xs bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <button className="flex-shrink-0 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all hover:shadow-lg whitespace-nowrap">
              立即訂閱
            </button>
          </div>
        </div>

        {/* Consultation Banner */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-3xl mb-2">👨‍⚕️</div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">線上中醫師諮詢</h3>
              <p className="text-stone-500 text-sm max-w-md leading-relaxed">
                資深中醫師一對一線上視訊諮詢，30分鐘個人化體質分析，提供量身訂製的養生建議和藥膳食療方案。
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-stone-500">4.9分 · 445 則評價</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl font-bold text-purple-800 mb-1">NT$800</div>
              <div className="text-sm text-stone-500 mb-4">30分鐘 · 含書面報告</div>
              <button className="px-8 py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl transition-all hover:shadow-lg whitespace-nowrap">
                預約諮詢
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
