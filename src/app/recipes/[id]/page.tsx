import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Users, Star, ChefHat, Leaf, Heart, Share2, ShoppingCart } from "lucide-react";
import { recipes, constitutions } from "@/lib/data";

export async function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) notFound();

  const constitutionNames = recipe.constitution.map(
    (cId) => constitutions.find((c) => c.id === cId)?.name || cId
  );

  const relatedRecipes = recipes.filter(
    (r) => r.id !== recipe.id && r.constitution.some((c) => recipe.constitution.includes(c))
  ).slice(0, 3);

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${recipe.imageColor} py-16 relative overflow-hidden`}>
        <div className="absolute inset-0 hero-pattern opacity-20" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 text-stone-700 hover:text-amber-700 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回食譜列表
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Recipe Image */}
            <div className="w-full lg:w-80 h-64 bg-white/40 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden relative">
              {recipe.image ? (
                <Image src={recipe.image} alt={recipe.title} fill className="object-cover rounded-2xl" />
              ) : (
                <span className="text-9xl filter drop-shadow-lg">
                  {recipe.category === "湯品" ? "🍲" : recipe.category === "粥品" ? "🥣" : recipe.category === "茶飲" ? "🍵" : "🍮"}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/60 backdrop-blur-sm text-xs font-medium text-stone-700 px-2 py-1 rounded-full">
                  {recipe.category}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  recipe.difficulty === "簡單" ? "bg-green-100 text-green-700" :
                  recipe.difficulty === "中等" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {recipe.difficulty}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-stone-800 mb-3">{recipe.title}</h1>
              <p className="text-stone-600 leading-relaxed mb-5">{recipe.description}</p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { icon: Clock, label: "準備時間", value: `${recipe.prepTime}分鐘` },
                  { icon: Clock, label: "烹飪時間", value: `${recipe.cookTime}分鐘` },
                  { icon: Users, label: "份量", value: `${recipe.servings}人份` },
                  { icon: ChefHat, label: "難易度", value: recipe.difficulty },
                ].map((s) => (
                  <div key={s.label} className="bg-white/50 backdrop-blur-sm rounded-xl p-3 text-center">
                    <div className="text-sm font-bold text-stone-800">{s.value}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Rating & Author */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= Math.round(recipe.rating) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                    />
                  ))}
                  <span className="font-bold text-stone-700 ml-1">{recipe.rating}</span>
                  <span className="text-stone-400">({recipe.reviews} 評分)</span>
                </div>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600">作者：{recipe.author}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Benefits */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                養生功效
              </h2>
              <div className="flex flex-wrap gap-2">
                {recipe.benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-stone-800 mb-5">食材清單</h2>
              <div className="space-y-3">
                {recipe.ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="font-medium text-stone-800">{ing.name}</span>
                      {ing.note && (
                        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                          {ing.note}
                        </span>
                      )}
                    </div>
                    <span className="text-amber-700 font-semibold text-sm">{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-stone-800 mb-5">製作步驟</h2>
              <ol className="space-y-5">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-9 h-9 bg-amber-600 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-stone-600 leading-relaxed pt-1.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Seasons */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="font-bold text-stone-800 mb-3">適合季節</h3>
              <div className="flex gap-2">
                {recipe.season.map((s) => (
                  <span key={s} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {s === "春" ? "🌸 春" : s === "夏" ? "☀️ 夏" : s === "秋" ? "🍂 秋" : s === "冬" ? "❄️ 冬" : "🌿 四季"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-bold text-stone-800 mb-4">快速資訊</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">總時間</span>
                  <span className="font-semibold text-stone-800">{totalTime} 分鐘</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">份量</span>
                  <span className="font-semibold text-stone-800">{recipe.servings} 人份</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">難易度</span>
                  <span className={`font-semibold ${
                    recipe.difficulty === "簡單" ? "text-green-600" :
                    recipe.difficulty === "中等" ? "text-amber-600" :
                    "text-red-600"
                  }`}>{recipe.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Suitable Constitution */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-600" />
                適合體質
              </h3>
              <div className="flex flex-wrap gap-2">
                {constitutionNames.map((name) => (
                  <span
                    key={name}
                    className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <Link
                href="/quiz"
                className="mt-4 block text-center text-xs text-amber-600 hover:text-amber-500 font-medium py-2 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
              >
                不知道自己的體質？立即測評
              </Link>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <h3 className="font-bold text-stone-800 mb-3">相關標籤</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg">
                <Heart className="w-4 h-4" />
                收藏食譜
              </button>
              <button className="w-full py-3 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Share2 className="w-4 h-4" />
                分享此食譜
              </button>
              <Link
                href="/shop"
                className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                購買食材包
              </Link>
            </div>
          </div>
        </div>

        {/* Related Recipes */}
        {relatedRecipes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">相關食療食譜</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedRecipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/recipes/${r.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-stone-100 group"
                >
                  <div className={`h-36 bg-gradient-to-br ${r.imageColor} flex items-center justify-center relative overflow-hidden`}>
                    {r.image ? (
                      <Image src={r.image} alt={r.title} fill className="object-cover" />
                    ) : (
                      <span className="text-5xl">
                        {r.category === "湯品" ? "🍲" : r.category === "粥品" ? "🥣" : r.category === "茶飲" ? "🍵" : "🍮"}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors text-sm">{r.title}</h3>
                    <div className="flex items-center gap-1 mt-2 text-xs text-stone-400">
                      <Clock className="w-3 h-3" />
                      <span>{r.prepTime + r.cookTime}分鐘</span>
                      <span className="mx-1">·</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-amber-600">{r.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
