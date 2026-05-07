"use client";

import { useState } from "react";
import { Heart, MessageSquare, Eye, Search, PenSquare, TrendingUp, Clock, Users } from "lucide-react";
import { communityPosts, constitutions } from "@/lib/data";
import Link from "next/link";

const categories = ["全部", "駐站醫師專欄", "育兒養生", "中老年養生", "體質諮詢", "季節養生", "女性養生", "體重管理", "慢性病管理", "外食族養生", "養生討論"];

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "trending">("popular");

  const featuredPosts = communityPosts.filter((p) => p.featured);

  const filtered = communityPosts
    .filter((p) => !p.featured)
    .filter((post) => {
      const matchSearch =
        !search ||
        post.title.includes(search) ||
        post.content.includes(search) ||
        post.tags.some((t) => t.includes(search));
      const matchCat = selectedCategory === "全部" || post.category === selectedCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.likes - a.likes;
      if (sortBy === "trending") return b.views - a.views;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const topPosts = [...communityPosts].sort((a, b) => b.likes - a.likes).slice(0, 5);
  const activeUsers = [
    { avatar: "陳", name: "藥膳達人陳醫師", posts: 42, badge: "中醫師" },
    { avatar: "王", name: "退休教師王伯伯", posts: 38, badge: "養生達人" },
    { avatar: "李", name: "銀髮族志工李奶奶", posts: 31, badge: "資深用戶" },
    { avatar: "芳", name: "健康媽媽小芳", posts: 27, badge: "熱心用戶" },
    { avatar: "偉", name: "外食族設計師大偉", posts: 19, badge: "新興用戶" },
  ];

  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-800 to-stone-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3 text-rose-300 text-sm">
            <Link href="/" className="hover:text-white transition-colors">首頁</Link>
            <span>/</span>
            <span>養生社群</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">養生社群</h1>
              <p className="text-stone-300 text-base max-w-xl">
                與超過五萬名養生愛好者分享心得、交流經驗，共同探索中醫養生的智慧。
              </p>
              <div className="flex gap-6 mt-4">
                {[
                  { value: "50,000+", label: "社群成員" },
                  { value: "12,000+", label: "討論文章" },
                  { value: "98%", label: "滿意度" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-xl font-bold text-rose-300">{s.value}</div>
                    <div className="text-xs text-stone-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-full transition-all hover:shadow-lg whitespace-nowrap" style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}>
              <PenSquare className="w-5 h-5" />
              發表新文章
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search & Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="搜尋文章..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { key: "popular", label: "最受歡迎", icon: Heart },
                  { key: "trending", label: "最多瀏覽", icon: TrendingUp },
                  { key: "latest", label: "最新發表", icon: Clock },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key as typeof sortBy)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      sortBy === key
                        ? "bg-[#c4607a] border-[#c4607a] text-white"
                        : "bg-white border-stone-200 text-stone-600 hover:border-rose-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-[#c4607a] border-[#c4607a] text-white"
                      : "bg-white border-stone-200 text-stone-600 hover:border-rose-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured Doctor Posts */}
            {(selectedCategory === "全部" || selectedCategory === "駐站醫師專欄") && !search && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🏥</span>
                  <h2 className="font-bold text-stone-800">駐站中醫師精選文章</h2>
                  <span className="ml-2 text-xs bg-rose-100 text-[#c4607a] px-2 py-0.5 rounded-full">中老年人必看</span>
                </div>
                <div className="space-y-4">
                  {featuredPosts.map((post) => (
                    <article key={post.id} className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl border-2 border-rose-200 shadow-sm p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}>
                          {post.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <span className="font-bold text-[#5c3a4a] text-sm">{post.author}</span>
                              {post.authorRole && <span className="text-[#c4607a] text-xs ml-2">{post.authorRole}</span>}
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}>駐站醫師</span>
                              <span className="text-xs bg-rose-100 text-[#c4607a] px-2 py-0.5 rounded-full">{post.createdAt}</span>
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-stone-800 mb-2 leading-snug hover:text-[#c4607a] cursor-pointer transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed mb-3">
                            {post.content.slice(0, 200)}…
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.tags.map((tag) => (
                              <span key={tag} className="text-xs text-[#c4607a] bg-white px-2 py-0.5 rounded-full border border-rose-200">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-5 text-xs text-stone-400">
                            <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                              <Heart className="w-4 h-4" /><span className="font-medium">{post.likes.toLocaleString()}</span>
                            </button>
                            <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{post.replies} 則留言</span>
                            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.views.toLocaleString()} 次瀏覽</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-4 border-t border-stone-200 pt-4 flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-700">社群討論文章</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
              </div>
            )}

            {/* Posts */}
            <div className="space-y-4">
              {filtered.map((post) => {
                const constitution = post.constitution
                  ? constitutions.find((c) => c.id === post.constitution)
                  : null;

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all p-5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}>
                        {post.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-semibold text-stone-800 text-sm">{post.author}</span>
                            <span className="text-stone-400 text-xs ml-2">{post.createdAt}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs bg-rose-100 text-[#c4607a] px-2 py-0.5 rounded-full">
                              {post.category}
                            </span>
                            {constitution && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {constitution.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-stone-800 mb-2 hover:text-[#c4607a] cursor-pointer transition-colors leading-snug">
                          {post.title}
                        </h3>

                        <p className="text-sm text-stone-500 line-clamp-3 leading-relaxed mb-3">
                          {post.content}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-[#c4607a] bg-rose-50 px-2 py-0.5 rounded-full hover:bg-rose-100 cursor-pointer transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Engagement */}
                        <div className="flex items-center gap-5 text-xs text-stone-400">
                          <button className="flex items-center gap-1 hover:text-red-400 transition-colors group">
                            <Heart className="w-4 h-4 group-hover:fill-current" />
                            <span className="font-medium">{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.replies} 則回覆</span>
                          </button>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-stone-700 mb-2">沒有找到相關文章</h3>
                  <p className="text-stone-500">嘗試更換搜尋條件</p>
                </div>
              )}
            </div>

            {/* Load More */}
            {filtered.length > 0 && (
              <div className="text-center mt-8">
                <button className="px-8 py-3 bg-white border-2 border-rose-200 text-[#c4607a] font-semibold rounded-full hover:bg-rose-50 hover:border-rose-300 transition-all">
                  載入更多文章
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Hot Posts */}
            <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-5">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                本週熱門文章
              </h3>
              <div className="space-y-3">
                {topPosts.slice(0, 5).map((post, i) => (
                  <div key={post.id} className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-red-500 text-white" :
                      i === 1 ? "bg-orange-500 text-white" :
                      i === 2 ? "bg-amber-500 text-white" :
                      "bg-stone-200 text-stone-600"
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm text-stone-700 font-medium leading-snug hover:text-[#c4607a] cursor-pointer transition-colors line-clamp-2">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                        <Heart className="w-3 h-3" />
                        <span>{post.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-5">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c4607a]" />
                活躍用戶
              </h3>
              <div className="space-y-3">
                {activeUsers.map((user) => (
                  <div key={user.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}>
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-800 truncate">{user.name}</div>
                      <div className="text-xs text-stone-400">{user.posts} 篇文章</div>
                    </div>
                    <span className="text-xs bg-rose-100 text-[#c4607a] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {user.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Constitution Quiz CTA */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <div className="text-2xl mb-2">🌿</div>
              <h3 className="font-bold text-stone-800 mb-2">了解您的體質</h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-4">
                透過10道題目，快速了解您屬於哪種中醫體質，獲得個人化養生建議。
              </p>
              <Link
                href="/quiz"
                className="block w-full text-center py-2.5 text-white text-sm font-semibold rounded-full transition-colors hover:opacity-90"
                style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}
              >
                立即測評
              </Link>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-5">
              <h3 className="font-bold text-stone-800 mb-4">熱門標籤</h3>
              <div className="flex flex-wrap gap-2">
                {["氣虛體質", "冬季進補", "陰虛體質", "痰濕體質", "養顏美容", "睡眠改善", "慢性病", "外食族", "春季養生", "減重"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="text-xs bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-[#c4607a] px-2.5 py-1 rounded-full transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
