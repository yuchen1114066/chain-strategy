import Link from "next/link";
import {
  Leaf, Star, ArrowRight, BookOpen, Users, Wrench, ShoppingBag,
  ChevronRight, Clock, Heart
} from "lucide-react";
import { recipes, seasonalTips, communityPosts, constitutions } from "@/lib/data";

const audienceCards = [
  {
    icon: "👨‍👩‍👧‍👦",
    title: "家庭主婦／夫",
    subtitle: "Families",
    description: "為全家人的健康把關，輕鬆學習傳統藥膳食譜，按照體質為家人調配最適合的養生餐點。",
    features: ["兒童養生食譜", "全家體質管理", "簡單藥膳湯品", "節氣飲食指南"],
    borderColor: "#c8ddc8",
    iconBg: "#e8f5e6",
    href: "/recipes",
  },
  {
    icon: "👴",
    title: "中老年人",
    subtitle: "Middle-aged & Elderly",
    description: "專為銀髮族設計，針對常見慢性病提供中醫調理方案，配合季節養生，維持活力健康。",
    features: ["慢性病調理", "關節保健方案", "冬季進補指南", "中西藥交互查詢"],
    borderColor: "#d0dcc8",
    iconBg: "#eef5e8",
    href: "/quiz",
  },
  {
    icon: "💼",
    title: "外食族／保養族",
    subtitle: "Busy Professionals",
    description: "忙碌生活中的養生之道，快速便捷的養生茶飲食譜，幫助現代人在外食環境中維持健康。",
    features: ["15分鐘快速食譜", "養生茶飲配方", "外食選擇指南", "護膚美容食療"],
    borderColor: "#ddd8c8",
    iconBg: "#f5f0e0",
    href: "/recipes",
  },
];

const dimensionCards = [
  {
    icon: BookOpen,
    title: "內容維度",
    subtitle: "Content",
    description: "豐富的食療食譜、季節養生秘訣、體質專屬建議",
    iconColor: "#3d5c3a",
    href: "/recipes",
  },
  {
    icon: Users,
    title: "社群維度",
    subtitle: "Community",
    description: "使用者心得分享、Q&A互動、養生達人交流",
    iconColor: "#5a8a5a",
    href: "/community",
  },
  {
    icon: Wrench,
    title: "工具維度",
    subtitle: "Tools",
    description: "體質測評、中西藥查詢、節氣飲食計劃",
    iconColor: "#c87941",
    href: "/quiz",
  },
  {
    icon: ShoppingBag,
    title: "商業維度",
    subtitle: "Commerce",
    description: "精選藥材商城、藥膳包訂閱、線上中醫師諮詢",
    iconColor: "#8a6a3a",
    href: "/shop",
  },
];

const currentSeason = seasonalTips[3];

export default function HomePage() {
  const featuredRecipes = recipes.slice(0, 4);
  const featuredPosts = communityPosts.slice(0, 3);
  const featuredConstitutions = constitutions.slice(0, 6);

  return (
    <div style={{ background: "#f8f3e8" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#2a3d28 0%,#3d5c3a 50%,#4a6e46 100%)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(173,197,160,0.12)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(200,121,65,0.10)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(173,197,160,0.3)" }}>
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium tracking-wider" style={{ color: "#adc5a0" }}>WarmCare · 梣數策院</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span style={{ color: "#d8ecd6" }}>溫暖</span>
              <span className="text-white">照顧</span>
              <br />
              <span className="text-3xl md:text-4xl font-medium" style={{ color: "#adc5a0" }}>每個家的養生之道</span>
            </h1>

            <p className="text-xl md:text-2xl mb-4 leading-relaxed" style={{ color: "#c8e0c8" }}>
              融合千年中醫智慧，用家的溫度守護健康
            </p>

            <p className="text-base mb-10 max-w-2xl leading-relaxed" style={{ color: "#9ab89a" }}>
              為家庭、中老年人、忙碌的現代人提供體質測評、食療食譜、七天打卡追蹤、中西藥交互查詢等全方位養生服務。
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: "#3d5c3a", color: "white", border: "2px solid #adc5a0", boxShadow: "0 4px 20px rgba(61,92,58,0.4)" }}
              >
                <Star className="w-5 h-5" />
                開始體質測評
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }}
              >
                探索食療食譜
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
              {[
                { value: "5,000+", label: "養生食譜" },
                { value: "50,000+", label: "用戶社群" },
                { value: "100+", label: "中醫師顧問" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold" style={{ color: "#c87941" }}>{stat.value}</div>
                  <div className="text-sm mt-1" style={{ color: "#7a9b7a" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audience Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#2a1f10" }}>
            為您量身打造的養生方案
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#7a6a5a" }}>
            無論您是忙碌的上班族、關心家人健康的父母，還是注重自我保養的長輩，養生道都有適合您的養生方案。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audienceCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-all hover:-translate-y-1 group"
              style={{ borderColor: card.borderColor }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform" style={{ background: card.iconBg }}>
                {card.icon}
              </div>
              <h3 className="text-xl font-bold mb-1" style={{ color: "#2a1f10" }}>{card.title}</h3>
              <p className="text-xs mb-3" style={{ color: "#7a9b7a" }}>{card.subtitle}</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#5a4a3a" }}>{card.description}</p>
              <ul className="space-y-2 mb-5">
                {card.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#5a4a3a" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#3d5c3a" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={card.href}
                className="inline-flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
                style={{ color: "#3d5c3a" }}
              >
                開始探索 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Seasonal Banner */}
      <section style={{ background: "linear-gradient(135deg,#3d5c3a,#2a4030)" }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-6xl">🍃</div>
            <div className="flex-1">
              <div className="text-sm font-medium mb-1" style={{ color: "#adc5a0" }}>當季養生重點</div>
              <h3 className="text-2xl font-bold mb-3">{currentSeason.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {currentSeason.tips.map((tip) => (
                  <div key={tip} className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(173,197,160,0.15)" }}>
                    <Leaf className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#adc5a0" }} />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/recipes"
              className="flex-shrink-0 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              查看當季食譜
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#2a1f10" }}>精選食療食譜</h2>
            <p className="mt-1" style={{ color: "#7a6a5a" }}>由中醫師審定，依體質推薦的養生料理</p>
          </div>
          <Link href="/recipes" className="hidden sm:flex items-center gap-1 font-medium text-sm" style={{ color: "#3d5c3a" }}>
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border group"
              style={{ borderColor: "#e8ddd0" }}
            >
              <div className={`h-40 bg-gradient-to-br ${recipe.imageColor} relative flex items-center justify-center`}>
                <span className="text-5xl">{recipe.category === "湯品" ? "🍲" : recipe.category === "粥品" ? "🥣" : recipe.category === "茶飲" ? "🍵" : "🍮"}</span>
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.85)", color: "#3d5c3a" }}>
                    {recipe.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-1 transition-colors" style={{ color: "#2a1f10" }}>{recipe.title}</h3>
                <p className="text-xs line-clamp-2 mb-3" style={{ color: "#7a6a5a" }}>{recipe.description}</p>
                <div className="flex items-center justify-between text-xs" style={{ color: "#9a8a7a" }}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{recipe.prepTime + recipe.cookTime}分鐘</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium" style={{ color: "#c87941" }}>{recipe.rating}</span>
                    <span>({recipe.reviews})</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Four Dimensions */}
      <section className="py-16" style={{ background: "#f0ece0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "#2a1f10" }}>四大功能維度</h2>
            <p style={{ color: "#7a6a5a" }}>全方位的中醫養生服務生態系統</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dimensionCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="bg-white rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-1 group border"
                style={{ borderColor: "#e8ddd0" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform" style={{ background: "#f5f0e0" }}>
                  <card.icon className="w-6 h-6" style={{ color: card.iconColor }} />
                </div>
                <h3 className="font-bold mb-1" style={{ color: "#2a1f10" }}>{card.title}</h3>
                <p className="text-xs mb-2" style={{ color: "#7a9b7a" }}>{card.subtitle}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#5a4a3a" }}>{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TCM Constitutions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#2a1f10" }}>了解您的中醫體質</h2>
            <p className="mt-1" style={{ color: "#7a6a5a" }}>九種體質，找到最適合您的養生之道</p>
          </div>
          <Link href="/quiz" className="hidden sm:flex items-center gap-1 font-medium text-sm" style={{ color: "#3d5c3a" }}>
            立即測評 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredConstitutions.map((c) => (
            <Link
              key={c.id}
              href="/quiz"
              className="rounded-2xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5 border bg-white"
              style={{ borderColor: "#d8e8d0" }}
            >
              <div className="text-2xl mb-2">🌿</div>
              <div className="font-bold text-sm mb-1" style={{ color: "#3d5c3a" }}>{c.name}</div>
              <div className="text-xs line-clamp-2" style={{ color: "#7a6a5a" }}>{c.description.slice(0, 20)}...</div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: "#3d5c3a", color: "white", boxShadow: "0 4px 20px rgba(61,92,58,0.3)" }}
          >
            <Star className="w-5 h-5" />
            開始免費體質測評（10題）
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Community Preview */}
      <section className="py-16" style={{ background: "#f0ece0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#2a1f10" }}>養生社群精選</h2>
              <p className="mt-1" style={{ color: "#7a6a5a" }}>來自真實用戶的養生心得與分享</p>
            </div>
            <Link href="/community" className="hidden sm:flex items-center gap-1 font-medium text-sm" style={{ color: "#3d5c3a" }}>
              進入社群 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href="/community"
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border"
                style={{ borderColor: "#e8ddd0" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#3d5c3a,#7a9b7a)" }}>
                    {post.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: "#2a1f10" }}>{post.author}</div>
                    <div className="text-xs" style={{ color: "#9a8a7a" }}>{post.createdAt}</div>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#e8f5e6", color: "#3d5c3a" }}>
                    {post.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm leading-snug mb-2" style={{ color: "#2a1f10" }}>{post.title}</h3>
                <p className="text-xs line-clamp-3 leading-relaxed" style={{ color: "#7a6a5a" }}>{post.content}</p>
                <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "#9a8a7a" }}>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {post.likes}
                  </span>
                  <span>{post.replies} 則回覆</span>
                  <span>{post.views} 次瀏覽</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-white py-20" style={{ background: "linear-gradient(135deg,#2a3d28,#3d5c3a)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">🌿</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">開始您的養生之旅</h2>
          <p className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "#9ab89a" }}>
            加入超過五萬名養生愛好者，透過中醫智慧改善您和家人的健康狀況。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "#c87941", color: "white" }}
            >
              免費體質測評
            </Link>
            <Link
              href="/recipes"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
            >
              瀏覽食療食譜
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
