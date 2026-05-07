"use client";

import { useState, useMemo } from "react";
import { Search, AlertTriangle, AlertCircle, Info, Shield, ChevronDown, ChevronUp, X } from "lucide-react";
import { herbDrugInteractions } from "@/lib/data";
import Link from "next/link";

type InteractionLevel = "嚴重" | "中度" | "輕微" | "全部";

const levelConfig = {
  "嚴重": {
    color: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    dot: "bg-red-500",
    label: "嚴重交互",
  },
  "中度": {
    color: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: AlertCircle,
    iconColor: "text-amber-500",
    dot: "bg-amber-500",
    label: "中度交互",
  },
  "輕微": {
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Info,
    iconColor: "text-blue-500",
    dot: "bg-blue-500",
    label: "輕微交互",
  },
};

export default function HerbCheckerPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<InteractionLevel>("全部");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return herbDrugInteractions.filter((item) => {
      const matchSearch =
        !search ||
        item.herb.includes(search) ||
        item.drug.includes(search) ||
        item.description.includes(search);
      const matchLevel = levelFilter === "全部" || item.interaction === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [search, levelFilter]);

  const counts = useMemo(() => ({
    total: herbDrugInteractions.length,
    嚴重: herbDrugInteractions.filter((i) => i.interaction === "嚴重").length,
    中度: herbDrugInteractions.filter((i) => i.interaction === "中度").length,
    輕微: herbDrugInteractions.filter((i) => i.interaction === "輕微").length,
  }), []);

  // Get unique herbs and drugs for suggestions
  const herbs = [...new Set(herbDrugInteractions.map((i) => i.herb))];
  const drugs = [...new Set(herbDrugInteractions.map((i) => i.drug))];
  const suggestions = [...herbs, ...drugs].filter((s) => search && s.includes(search) && s !== search).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#fdfaf5]">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-800 to-green-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3 text-green-300 text-sm">
            <Link href="/" className="hover:text-white transition-colors">首頁</Link>
            <span>/</span>
            <span>中西藥交互查詢</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">中西藥交互查詢</h1>
              <p className="text-green-300 text-sm mt-1">Herb-Drug Interaction Checker</p>
            </div>
          </div>
          <p className="text-stone-300 text-base max-w-2xl leading-relaxed">
            查詢常見中藥材與西藥的交互作用，了解潛在風險，安全使用中西藥。本資料庫收錄 {counts.total} 組常見的中西藥交互對。
          </p>

          {/* Warning Banner */}
          <div className="mt-6 bg-red-900/40 border border-red-500/30 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 leading-relaxed">
              <strong>重要警告：</strong>本查詢工具僅供一般參考，不構成醫療建議。服用任何中藥或西藥前，請務必諮詢您的醫師或藥師，切勿自行決定用藥組合。
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(["嚴重", "中度", "輕微"] as const).map((level) => {
            const config = levelConfig[level];
            return (
              <button
                key={level}
                onClick={() => setLevelFilter(levelFilter === level ? "全部" : level)}
                className={`${config.color} border rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  levelFilter === level ? "ring-2 ring-offset-1 ring-current" : ""
                }`}
              >
                <div className="text-3xl font-bold text-stone-800 mb-1">{counts[level]}</div>
                <div className={`text-xs font-semibold ${config.badge.split(" ").slice(1).join(" ")} inline-flex items-center gap-1 px-2 py-0.5 rounded-full border`}>
                  <config.icon className="w-3 h-3" />
                  {config.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
          <h2 className="font-bold text-stone-800 mb-4">搜尋中藥材或西藥名稱</h2>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="輸入中藥材名稱（如：當歸、黃芪）或西藥名稱（如：華法林、阿斯匹靈）..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 border border-stone-200 rounded-xl text-stone-700 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className="text-xs text-stone-400">建議：</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSearch(s)}
                  className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded-full border border-amber-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Quick search examples */}
          {!search && (
            <div className="mt-4">
              <p className="text-xs text-stone-400 mb-2">常見搜尋：</p>
              <div className="flex flex-wrap gap-2">
                {["當歸", "甘草", "銀杏", "人參", "華法林", "阿斯匹靈", "降壓藥"].map((example) => (
                  <button
                    key={example}
                    onClick={() => setSearch(example)}
                    className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-stone-500 font-medium">篩選：</span>
          <div className="flex gap-2">
            {(["全部", "嚴重", "中度", "輕微"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  levelFilter === level
                    ? "bg-stone-800 text-white"
                    : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                {level}
                {level !== "全部" && (
                  <span className="ml-1 opacity-70">
                    ({filtered.filter((i) => i.interaction === level).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm text-stone-400">
            共 <strong className="text-stone-700">{filtered.length}</strong> 筆結果
          </span>
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((item) => {
              const config = levelConfig[item.interaction];
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className={`${config.color} border rounded-xl overflow-hidden transition-all`}
                >
                  <button
                    className="w-full p-5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-start gap-4">
                      <config.icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-bold text-stone-800 text-lg">{item.herb}</span>
                          <span className="text-stone-400">×</span>
                          <span className="font-semibold text-stone-700">{item.drug}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
                            {item.interaction}交互
                          </span>
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-current/10 ml-9 space-y-3">
                      <div className="bg-white/70 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">建議措施</h4>
                        <p className="text-sm text-stone-700 leading-relaxed">{item.recommendation}</p>
                      </div>
                      {item.mechanism && (
                        <div className="bg-white/50 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">交互機制</h4>
                          <p className="text-sm text-stone-600 leading-relaxed">{item.mechanism}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>如有疑問，請立即諮詢您的醫師或藥師</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">找不到相關結果</h3>
            <p className="text-stone-500 mb-4">
              嘗試搜尋其他關鍵字，或清除篩選條件
            </p>
            <p className="text-sm text-stone-400 max-w-md mx-auto">
              若您擔心特定中西藥的交互作用，建議直接諮詢您的醫師或藥師以獲得最準確的資訊。
            </p>
            <button
              onClick={() => { setSearch(""); setLevelFilter("全部"); }}
              className="mt-6 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-colors font-medium"
            >
              清除搜尋
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 bg-stone-100 border border-stone-200 rounded-2xl p-6">
          <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-stone-600" />
            使用說明與免責聲明
          </h3>
          <div className="text-sm text-stone-500 space-y-2 leading-relaxed">
            <p>本資料庫收錄之中西藥交互作用資訊係基於現有醫學文獻與研究，僅供一般健康教育參考。</p>
            <p>交互作用的嚴重程度因個人體質、用藥劑量、使用時長等因素而異，實際風險可能有所不同。</p>
            <p><strong className="text-stone-700">請務必在使用任何中藥製品前，告知您的醫師或藥師您正在服用的所有藥物，包括中草藥、保健品及維他命補充劑。</strong></p>
            <p>如發現任何不適症狀，請立即就醫。緊急情況請撥打 119。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
