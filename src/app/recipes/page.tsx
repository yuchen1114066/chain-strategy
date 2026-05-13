"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Clock, Star, ChefHat, Users } from "lucide-react";
import { recipes, constitutions } from "@/lib/data";

const categories = ["全部", "湯品", "粥品", "茶飲", "甜品"];
const seasons = ["全部", "春", "夏", "秋", "冬", "四季"];
const difficulties = ["全部", "簡單", "中等", "進階"];

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedSeason, setSelectedSeason] = useState("全部");
  const [selectedDifficulty, setSelectedDifficulty] = useState("全部");
  const [selectedConstitution, setSelectedConstitution] = useState("全部");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = recipes.filter((r) => {
    const matchSearch =
      !search ||
      r.title.includes(search) ||
      r.description.includes(search) ||
      r.tags.some((t) => t.includes(search));
    const matchCat = selectedCategory === "全部" || r.category === selectedCategory;
    const matchSeason =
      selectedSeason === "全部" ||
      r.season.includes(selectedSeason) ||
      r.season.includes("四季");
    const matchDiff = selectedDifficulty === "全部" || r.difficulty === selectedDifficulty;
    const matchConstitution =
      selectedConstitution === "全部" ||
      r.constitution.includes(selectedConstitution);
    return matchSearch && matchCat && matchSeason && matchDiff && matchConstitution;
  });

  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-amber-900 to-stone-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3 text-amber-300 text-sm">
            <Link href="/" className="hover:text-white transition-colors">首頁</Link>
            <span>/</span>
            <span>食療食譜</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">食療食譜</h1>
          <p className="text-stone-300 text-lg max-w-2xl">
            由中醫師審定的養生食療料理，依體質、季節、功效分類，幫助您找到最適合的食療方案。
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="搜尋食譜名稱、食材、效果..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-700 placeholder-stone-400 focus:outline-none focus:border-[#c4607a] focus:ring-2 focus:ring-rose-100 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-full border font-medium text-sm transition-all ${
              showFilters
                ? "border-transparent text-white"
                : "bg-white border-stone-200 text-stone-600 hover:border-rose-300"
            }`}
            style={showFilters ? {background: "linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
          >
            <Filter className="w-4 h-4" />
            篩選
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">分類</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        selectedCategory === cat
                          ? "border-transparent text-white"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-300"
                      }`}
                      style={selectedCategory === cat ? {background: "linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Season */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">季節</label>
                <div className="flex flex-wrap gap-1.5">
                  {seasons.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSeason(s)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        selectedSeason === s
                          ? "border-transparent text-white"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-300"
                      }`}
                      style={selectedSeason === s ? {background: "linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">難易度</label>
                <div className="flex flex-wrap gap-1.5">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        selectedDifficulty === d
                          ? "border-transparent text-white"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-300"
                      }`}
                      style={selectedDifficulty === d ? {background: "linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Constitution */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">適合體質</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedConstitution("全部")}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      selectedConstitution === "全部"
                        ? "border-transparent text-white"
                        : "bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-300"
                    }`}
                    style={selectedConstitution === "全部" ? {background: "linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
                  >
                    全部
                  </button>
                  {constitutions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConstitution(c.id)}
                      className={`px-3 py-1 text-xs rounded-full border transition-all ${
                        selectedConstitution === c.id
                          ? "border-transparent text-white"
                          : "bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-300"
                      }`}
                      style={selectedConstitution === c.id ? {background: "linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
              <span className="text-sm text-stone-500">找到 <strong className="text-stone-800">{filtered.length}</strong> 個食譜</span>
              <button
                onClick={() => {
                  setSelectedCategory("全部");
                  setSelectedSeason("全部");
                  setSelectedDifficulty("全部");
                  setSelectedConstitution("全部");
                  setSearch("");
                }}
                className="text-xs text-[#c4607a] hover:text-[#c4607a] font-medium"
              >
                清除所有篩選
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!showFilters && (
          <p className="text-sm text-stone-500 mb-5">共 <strong className="text-stone-700">{filtered.length}</strong> 個食療食譜</p>
        )}

        {/* Recipe Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-stone-100 group"
              >
                {/* Recipe Image */}
                <div className={`h-44 bg-gradient-to-br ${recipe.imageColor} relative flex items-center justify-center overflow-hidden`}>
                  {recipe.image ? (
                    <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
                  ) : (
                    <span className="text-6xl filter drop-shadow-sm">
                      {recipe.category === "湯品" ? "🍲" : recipe.category === "粥品" ? "🥣" : recipe.category === "茶飲" ? "🍵" : "🍮"}
                    </span>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/80 backdrop-blur-sm text-xs font-medium text-stone-700 px-2 py-1 rounded-full">
                      {recipe.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      recipe.difficulty === "簡單" ? "bg-green-100 text-green-700" :
                      recipe.difficulty === "中等" ? "bg-rose-100 text-[#5c3a4a]" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-stone-800 mb-1.5 group-hover:text-[#c4607a] transition-colors leading-snug">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
                    {recipe.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-rose-50 text-[#5c3a4a] px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTime + recipe.cookTime}分鐘
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {recipe.servings}人份
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#e8a0b4] text-[#e8a0b4]" />
                      <span className="font-semibold text-[#c4607a]">{recipe.rating}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-stone-400">
                    <ChefHat className="w-3 h-3" />
                    {recipe.author}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">沒有找到相關食譜</h3>
            <p className="text-stone-500 mb-6">嘗試更換搜尋條件或清除篩選</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("全部");
                setSelectedSeason("全部");
                setSelectedDifficulty("全部");
                setSelectedConstitution("全部");
              }}
              className="px-6 py-3 text-white rounded-full font-medium transition-colors"
              style={{background: "linear-gradient(135deg,#e8a0b4,#c4607a)"}}
            >
              清除所有篩選
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
