import Link from "next/link";
import {
  Leaf, Star, ArrowRight, BookOpen, Users, Wrench, ShoppingBag,
  ChevronRight, Flame, Droplets, Wind, Sun, Clock, Heart
} from "lucide-react";
import { recipes, seasonalTips, communityPosts, constitutions } from "@/lib/data";

const audienceCards = [
  {
    icon: "👨‍👩‍👧‍👦",
    title: "家庭主婦／夫",
    subtitle: "Families",
    description: "為全家人的健康把關，輕鬆學習傳統藥膳食譜，按照體質為家人調配最適合的養生餐點。",
    features: ["兒童養生食譜", "全家體質管理", "簡單藥膳湯品", "節氣飲食指南"],
    color: "from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
    linkColor: "text-amber-700",
    href: "/recipes",
  },
  {
    icon: "👴",
    title: "中老年人",
    subtitle: "Middle-aged & Elderly",
    description: "專為銀髮族設計，針對常見慢性病提供中醫調理方案，配合季節養生，維持活力健康。",
    features: ["慢性病調理", "關節保健方案", "冬季進補指南", "中西藥交互查詢"],
    color: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
    linkColor: "text-green-700",
    href: "/quiz",
  },
  {
    icon: "💼",
    title: "外食族／保養族",
    subtitle: "Busy Professionals",
    description: "忙碌生活中的養生之道，快速便捷的養生茶飲食譜，幫助現代人在外食環境中維持健康。",
    features: ["15分鐘快速食譜", "養生茶飲配方", "外食選擇指南", "護膚美容食療"],
    color: "from-purple-50 to-violet-50",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-100",
    linkColor: "text-purple-700",
    href: "/recipes",
  },
];

const dimensionCards = [
  {
    icon: BookOpen,
    title: "內容維度",
    subtitle: "Content",
    description: "豐富的食療食譜、季節養生秘訣、體質專屬建議",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/recipes",
  },
  {
    icon: Users,
    title: "社群維度",
    subtitle: "Community",
    description: "使用者心得分享、Q&A互動、養生達人交流",
    color: "bg-green-50",
    iconColor: "text-green-600",
    href: "/community",
  },
  {
    icon: Wrench,
    title: "工具維度",
    subtitle: "Tools",
    description: "體質測評、中西藥查詢、節氣飲食計劃",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/quiz",
  },
  {
    icon: ShoppingBag,
    title: "商業維度",
    subtitle: "Commerce",
    description: "精選藥材商城、藥膳包訂閱、線上中醫師諮詢",
    color: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/shop",
  },
];

const currentSeason = seasonalTips[3]; // 冬季

export default function HomePage() {
  const featuredRecipes = recipes.slice(0, 4);
  const featuredPosts = communityPosts.slice(0, 3);
  const featuredConstitutions = constitutions.slice(0, 6);

  return (
    <div className="hero-pattern">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white" style={{background:"linear-gradient(135deg,#5c2d42 0%,#3d2030 50%,#2a4035 100%)"}}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{background:"rgba(232,160,180,0.12)"}} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" style={{background:"rgba(90,138,106,0.12)"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{background:"rgba(232,146,42,0.06)"}} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:"rgba(232,160,180,0.3)"}}>
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="text-sm font-medium tracking-wider" style={{color:"#e8a0b4"}}>WarmCare · 梣數策院</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span style={{color:"#f0c8d8"}}>溫暖</span>
              <span className="text-white">照顧</span>
              <br/>
              <span className="text-3xl md:text-4xl font-medium" style={{color:"#a8d4b8"}}>每個家的養生之道</span>
            </h1>

            <p className="text-xl md:text-2xl mb-4 leading-relaxed" style={{color:"#e0c8d0"}}>
              融合千年中醫智慧，用家的溫度守護健康
            </p>

            <p className="text-base mb-10 max-w-2xl leading-relaxed" style={{color:"#b8a0b0"}}>
              為家庭、中老年人、忙碌的現代人提供體質測評、食療食譜、七天打卡追蹤、中西藥交互查詢等全方位養生服務。
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)",color:"white",boxShadow:"0 4px 20px rgba(232,160,180,0.35)"}}
              >
                <Star className="w-5 h-5" />
                開始體質測評
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:-translate-y-0.5"
                style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"white"}}
              >
                探索食療食譜
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
              {[
                { value: "5,000+", label: "養生食譜" },
                { value: "50,000+", label: "用戶社群" },
                { value: "100+", label: "中醫師顧問" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-amber-300">{stat.value}</div>
                  <div className="text-sm text-stone-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Audience Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            為您量身打造的養生方案
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            無論您是忙碌的上班族、關心家人健康的父母，還是注重自我保養的長輩，養生道都有適合您的養生方案。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audienceCards.map((card) => (
            <div
              key={card.title}
              className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 border ${card.borderColor} hover:shadow-lg transition-all hover:-translate-y-1 group`}
            >
              <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-1">{card.title}</h3>
              <p className="text-xs text-stone-500 mb-3">{card.subtitle}</p>
              <p className="text-sm text-stone-600 leading-relaxed mb-4">{card.description}</p>
              <ul className="space-y-2 mb-5">
                {card.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={card.href}
                className={`inline-flex items-center gap-1 text-sm font-semibold ${card.linkColor} hover:gap-2 transition-all`}
              >
                開始探索 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Seasonal Tip Banner */}
      <section className={`bg-gradient-to-r ${currentSeason.color} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-6xl">❄️</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white/80 mb-1">當季養生重點</div>
              <h3 className="text-2xl font-bold mb-3">{currentSeason.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {currentSeason.tips.map((tip) => (
                  <div key={tip} className="flex items-start gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Leaf className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/recipes"
              className="flex-shrink-0 px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm font-semibold transition-colors"
            >
              查看冬季食譜
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800">精選食療食譜</h2>
            <p className="text-stone-500 mt-1">由中醫師審定，依體質推薦的養生料理</p>
          </div>
          <Link
            href="/recipes"
            className="hidden sm:flex items-center gap-1 text-amber-700 hover:text-amber-600 font-medium text-sm"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-stone-100 group"
            >
              <div className={`h-40 bg-gradient-to-br ${recipe.imageColor} relative flex items-center justify-center`}>
                <span className="text-5xl">{recipe.category === "湯品" ? "🍲" : recipe.category === "粥品" ? "🥣" : recipe.category === "茶飲" ? "🍵" : "🍮"}</span>
                <div className="absolute top-3 right-3">
                  <span className="bg-white/80 backdrop-blur-sm text-xs font-medium text-stone-700 px-2 py-1 rounded-full">
                    {recipe.category}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-stone-800 mb-1 group-hover:text-amber-700 transition-colors">{recipe.title}</h3>
                <p className="text-xs text-stone-500 line-clamp-2 mb-3">{recipe.description}</p>
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{recipe.prepTime + recipe.cookTime}分鐘</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-amber-600 font-medium">{recipe.rating}</span>
                    <span>({recipe.reviews})</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6 sm:hidden">
          <Link href="/recipes" className="inline-flex items-center gap-1 text-amber-700 font-medium text-sm">
            查看所有食譜 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Four Dimensions */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-4">四大功能維度</h2>
            <p className="text-stone-500">全方位的中醫養生服務生態系統</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dimensionCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`${card.color} rounded-xl p-6 hover:shadow-md transition-all hover:-translate-y-1 group`}
              >
                <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h3 className="font-bold text-stone-800 mb-1">{card.title}</h3>
                <p className="text-xs text-stone-500 mb-2">{card.subtitle}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TCM Constitutions Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800">了解您的中醫體質</h2>
            <p className="text-stone-500 mt-1">九種體質，找到最適合您的養生之道</p>
          </div>
          <Link
            href="/quiz"
            className="hidden sm:flex items-center gap-1 text-amber-700 hover:text-amber-600 font-medium text-sm"
          >
            立即測評 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredConstitutions.map((c) => {
            const colorMap: Record<string, string> = {
              green: "bg-green-50 border-green-200 text-green-800",
              yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
              orange: "bg-orange-50 border-orange-200 text-orange-800",
              blue: "bg-blue-50 border-blue-200 text-blue-800",
              teal: "bg-teal-50 border-teal-200 text-teal-800",
              lime: "bg-lime-50 border-lime-200 text-lime-800",
            };
            const style = colorMap[c.color] || "bg-stone-50 border-stone-200 text-stone-800";
            return (
              <Link
                key={c.id}
                href="/quiz"
                className={`${style} border rounded-xl p-4 text-center hover:shadow-md transition-all hover:-translate-y-0.5`}
              >
                <div className="text-2xl mb-2">🌿</div>
                <div className="font-bold text-sm mb-1">{c.name}</div>
                <div className="text-xs opacity-70 line-clamp-2">{c.description.slice(0, 20)}...</div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/30"
          >
            <Star className="w-5 h-5" />
            開始免費體質測評（10題）
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Community Preview */}
      <section className="bg-amber-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-800">養生社群精選</h2>
              <p className="text-stone-500 mt-1">來自真實用戶的養生心得與分享</p>
            </div>
            <Link
              href="/community"
              className="hidden sm:flex items-center gap-1 text-amber-700 hover:text-amber-600 font-medium text-sm"
            >
              進入社群 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href="/community"
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {post.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-stone-800 text-sm">{post.author}</div>
                    <div className="text-xs text-stone-400">{post.createdAt}</div>
                  </div>
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h3 className="font-bold text-stone-800 mb-2 text-sm leading-snug">{post.title}</h3>
                <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-stone-400">
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
      <section className="bg-gradient-to-br from-green-800 to-stone-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">🌿</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            開始您的養生之旅
          </h2>
          <p className="text-lg text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            加入超過五萬名養生愛好者，透過中醫智慧改善您和家人的健康狀況。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quiz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/30"
            >
              免費體質測評
            </Link>
            <Link
              href="/recipes"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all"
            >
              瀏覽食療食譜
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
