"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw, Star, Leaf, ChevronRight, Save } from "lucide-react";
import { quizQuestions, constitutions } from "@/lib/data";
import { saveAssessment, getSessionId } from "@/lib/supabase";

type QuizState = "intro" | "quiz" | "result";

export default function QuizPage() {
  const [state, setState] = useState<QuizState>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [resultId, setResultId] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const totalQuestions = quizQuestions.length;
  const progress = ((currentQ) / totalQuestions) * 100;

  function startQuiz() {
    setState("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setScores({});
    setSelectedOption(null);
  }

  function handleSelect(optionIndex: number) {
    setSelectedOption(optionIndex);
  }

  function handleNext() {
    if (selectedOption === null) return;

    const question = quizQuestions[currentQ];
    const option = question.options[selectedOption];
    const newScores = { ...scores };

    for (const [constitutionId, score] of Object.entries(option.scores)) {
      newScores[constitutionId] = (newScores[constitutionId] || 0) + score;
    }

    setScores(newScores);
    setAnswers([...answers, selectedOption]);

    if (currentQ + 1 >= totalQuestions) {
      const topConstitution = Object.entries(newScores).sort(([, a], [, b]) => b - a)[0];
      const topId = topConstitution ? topConstitution[0] : "ping-he";
      setResultId(topId);
      setState("result");
      // Save to Supabase (best-effort, non-blocking)
      saveAssessment({
        session_id: getSessionId(),
        primary_constitution: topId,
        scores: newScores,
        answers: [...answers, selectedOption],
      }).catch(() => {});
      // Cache in localStorage for tracking page
      localStorage.setItem("ys_last_constitution", topId);
      setSaved(true);
    } else {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
    }
  }

  function handleBack() {
    if (currentQ === 0) {
      setState("intro");
    } else {
      const prevQuestion = quizQuestions[currentQ - 1];
      const prevAnswer = answers[currentQ - 1];
      const prevOption = prevQuestion.options[prevAnswer];
      const newScores = { ...scores };

      for (const [constitutionId, score] of Object.entries(prevOption.scores)) {
        newScores[constitutionId] = (newScores[constitutionId] || 0) - score;
      }

      setScores(newScores);
      setAnswers(answers.slice(0, -1));
      setCurrentQ(currentQ - 1);
      setSelectedOption(answers[currentQ - 1]);
    }
  }

  const resultConstitution = constitutions.find((c) => c.id === resultId);

  const constitutionColorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", badge: "bg-green-100 text-green-700" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", badge: "bg-yellow-100 text-yellow-700" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", badge: "bg-orange-100 text-orange-700" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-100 text-blue-700" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", badge: "bg-teal-100 text-teal-700" },
    lime: { bg: "bg-lime-50", border: "border-lime-200", text: "text-lime-800", badge: "bg-lime-100 text-lime-700" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", badge: "bg-red-100 text-red-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", badge: "bg-purple-100 text-purple-700" },
    pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", badge: "bg-pink-100 text-pink-700" },
  };

  if (state === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf7f2] to-[#fce8ef]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-[#5a8a6a] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-stone-800 mb-4">體質測評</h1>
            <p className="text-xl text-stone-500 mb-2">中醫九種體質自我測評</p>
            <p className="text-stone-400 text-sm">Constitution Quiz · 體質チェック</p>
          </div>

          {/* Intro Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-8 mb-8">
            <h2 className="text-xl font-bold text-stone-800 mb-4">關於此測評</h2>
            <p className="text-stone-600 leading-relaxed mb-6">
              中醫體質學說將人的體質分為九種基本類型，每種體質有其獨特的生理特徵、心理特點和對疾病的傾向性。了解自己的體質，可以幫助您選擇最適合的飲食、運動和生活方式。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: "📝", label: "10道題目" },
                { icon: "⏱️", label: "約3-5分鐘" },
                { icon: "🎯", label: "9種體質結果" },
                { icon: "🍽️", label: "個人化飲食建議" },
                { icon: "🌿", label: "調理方案" },
                { icon: "💊", label: "宜忌食物清單" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 bg-rose-50 rounded-lg px-3 py-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-stone-600">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-[#5c3a4a]">
              <strong>重要提示：</strong>此測評僅供參考，不能替代專業中醫師的診斷。如有健康疑慮，請諮詢合格的中醫師。
            </div>
          </div>

          {/* Nine Constitutions Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-8">
            <h3 className="text-lg font-bold text-stone-800 mb-4">九種中醫體質</h3>
            <div className="grid grid-cols-3 gap-2">
              {constitutions.map((c) => {
                const colors = constitutionColorMap[c.color] || constitutionColorMap["yellow"];
                return (
                  <div key={c.id} className={`${colors.bg} ${colors.border} border rounded-lg p-2 text-center`}>
                    <div className={`text-xs font-semibold ${colors.text}`}>{c.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-4 text-white font-bold text-lg rounded-full transition-all hover:shadow-lg flex items-center justify-center gap-2"
            style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}
          >
            <Star className="w-6 h-6" />
            開始測評
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  if (state === "quiz") {
    const question = quizQuestions[currentQ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fdf7f2] to-[#fce8ef]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-stone-500">
                第 {currentQ + 1} 題，共 {totalQuestions} 題
              </span>
              <span className="text-sm font-semibold text-[#c4607a]">
                {Math.round(progress)}% 完成
              </span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-[#e8a0b4] to-[#5a8a6a] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Step indicators */}
            <div className="flex gap-1 mt-2">
              {quizQuestions.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i < currentQ ? "bg-[#5a8a6a]" : i === currentQ ? "bg-[#e8a0b4]" : "bg-stone-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-[#5c3a4a] font-bold text-lg flex-shrink-0">
                {currentQ + 1}
              </div>
              <h2 className="text-xl font-bold text-stone-800 leading-snug">{question.question}</h2>
            </div>

            <div className="space-y-3">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                    selectedOption === i
                      ? "border-rose-400 bg-rose-50 text-[#5c3a4a]"
                      : "border-stone-200 bg-stone-50 hover:border-rose-300 hover:bg-rose-50/50 text-stone-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedOption === i
                          ? "border-rose-400 bg-rose-400"
                          : "border-stone-300"
                      }`}
                    >
                      {selectedOption === i && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm leading-relaxed">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-full font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentQ === 0 ? "返回介紹" : "上一題"}
            </button>
            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold transition-all ${
                selectedOption !== null
                  ? "text-white hover:shadow-lg"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
              style={selectedOption !== null ? {background:"linear-gradient(135deg,#e8a0b4,#c4607a)"} : undefined}
            >
              {currentQ + 1 === totalQuestions ? "查看結果" : "下一題"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (!resultConstitution) return null;
  const colors = constitutionColorMap[resultConstitution.color] || constitutionColorMap["yellow"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf7f2] to-[#fce8ef]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Result Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-green-600 font-medium">測評完成</span>
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">您的體質結果</h1>
          <p className="text-stone-500">根據您的回答分析，您的主要體質類型為</p>
        </div>

        {/* Constitution Card */}
        <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-8 mb-6 shadow-sm`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-5xl shadow-sm`}>
              🌿
            </div>
            <div>
              <h2 className={`text-3xl font-bold ${colors.text}`}>{resultConstitution.name}</h2>
              <p className="text-stone-500 text-sm mt-1">中醫體質類型</p>
            </div>
          </div>

          <p className={`text-sm leading-relaxed ${colors.text} opacity-90 mb-6`}>
            {resultConstitution.description}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-stone-700 mb-2 text-sm">主要特徵</h4>
              <ul className="space-y-1.5">
                {resultConstitution.characteristics.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className={`w-1.5 h-1.5 rounded-full bg-[#c4607a] flex-shrink-0`} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-stone-700 mb-2 text-sm">調養建議</h4>
              <ul className="space-y-1.5">
                {resultConstitution.recommendations.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Food Recommendations */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <span className="text-lg">✅</span> 適宜食物
            </h4>
            <ul className="space-y-1.5">
              {resultConstitution.beneficialFoods.map((f) => (
                <li key={f} className="text-sm text-green-700 flex items-center gap-1.5">
                  <Leaf className="w-3 h-3 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span> 應當避免
            </h4>
            <ul className="space-y-1.5">
              {resultConstitution.avoidFoods.map((f) => (
                <li key={f} className="text-sm text-red-700 flex items-center gap-1.5">
                  <span className="w-3 h-3 flex-shrink-0 text-center">✕</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="bg-white rounded-xl border border-stone-100 p-5 mb-6 shadow-sm">
          <h4 className="font-bold text-stone-800 mb-4">體質分析明細</h4>
          <div className="space-y-2">
            {Object.entries(scores)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([id, score]) => {
                const constitution = constitutions.find((c) => c.id === id);
                const maxScore = Math.max(...Object.values(scores));
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                if (score <= 0) return null;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="text-xs text-stone-600 w-14 text-right flex-shrink-0">
                      {constitution?.name || id}
                    </span>
                    <div className="flex-1 bg-stone-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          id === resultId ? "bg-[#c4607a]" : "bg-stone-300"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-500 w-6 flex-shrink-0">{score}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Save notice */}
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-700">
            <Save className="w-4 h-4 flex-shrink-0" />
            測評結果已儲存，可在七天打卡追蹤你的食療進度
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/tracking"
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-rose-500/30"
          >
            🗓️ 開始七天食療打卡計劃
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/recipes"
            className="w-full py-4 text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg"
            style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}
          >
            查看適合我的食療食譜
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/shop"
            className="w-full py-4 bg-[#5a8a6a] hover:bg-[#4a7a5a] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg"
          >
            購買體質調理產品
            <ChevronRight className="w-5 h-5" />
          </Link>
          <button
            onClick={() => {
              setState("intro");
              setCurrentQ(0);
              setAnswers([]);
              setScores({});
              setSelectedOption(null);
            }}
            className="w-full py-3 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重新測評
          </button>
        </div>
      </div>
    </div>
  );
}
