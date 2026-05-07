"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Circle, TrendingUp, Droplets, Sun, Zap, ChevronLeft, Save, BarChart2 } from "lucide-react";
import { saveCheckin, getMyCheckins, getSessionId, type DailyCheckin } from "@/lib/supabase";

const DAY_LABELS = [
  { day: 1, label: "啟動日", icon: "🌅", focus: "喝足水，減鹽開始" },
  { day: 2, label: "利水日", icon: "💧", focus: "紅豆陳皮消腫茶 × 2" },
  { day: 3, label: "補氣日", icon: "🌿", focus: "茯苓薏仁山藥排骨湯" },
  { day: 4, label: "中期評估", icon: "📊", focus: "觀察臉部輪廓變化" },
  { day: 5, label: "疏肝日", icon: "🌹", focus: "玫瑰薄荷抗蠟黃飲" },
  { day: 6, label: "鞏固日", icon: "🏆", focus: "三款食療輪流搭配" },
  { day: 7, label: "成果日", icon: "✨", focus: "對比第一天，記錄變化" },
];

const METRICS = [
  { key: "swelling_level" as const, label: "消腫程度", icon: Droplets, color: "blue",
    scale: ["嚴重水腫", "明顯水腫", "輕微水腫", "幾乎消腫", "完全消腫"] },
  { key: "skin_tone" as const, label: "膚色亮度", icon: Sun, color: "amber",
    scale: ["蠟黃暗沉", "略顯暗淡", "普通", "略有光澤", "紅潤有光"] },
  { key: "energy_level" as const, label: "精神狀態", icon: Zap, color: "green",
    scale: ["非常疲憊", "略感疲倦", "普通", "精神不錯", "精神飽滿"] },
];

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", fill: "bg-blue-500", light: "bg-blue-100" },
  amber: { bg: "bg-rose-50", border: "border-rose-200", text: "text-[#c4607a]", fill: "bg-[#c4607a]", light: "bg-rose-100" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", fill: "bg-green-500", light: "bg-green-100" },
};

type CheckinForm = { swelling_level: number; skin_tone: number; energy_level: number; notes: string };

export default function TrackingPage() {
  const [activeDay, setActiveDay] = useState(1);
  const [form, setForm] = useState<CheckinForm>({ swelling_level: 3, skin_tone: 3, energy_level: 3, notes: "" });
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [constitution, setConstitution] = useState("");
  const [view, setView] = useState<"log" | "chart">("log");

  useEffect(() => {
    const saved = localStorage.getItem("ys_last_constitution");
    if (saved) setConstitution(saved);
    loadCheckins();
  }, []);

  async function loadCheckins() {
    const { data } = await getMyCheckins();
    if (data) setCheckins(data as DailyCheckin[]);
  }

  const completedDays = new Set(checkins.map((c) => c.plan_day));
  const todayCheckin = checkins.find((c) => c.plan_day === activeDay);

  async function handleSubmit() {
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    const { error } = await saveCheckin({
      session_id: getSessionId(),
      constitution,
      plan_day: activeDay,
      swelling_level: form.swelling_level,
      skin_tone: form.skin_tone,
      energy_level: form.energy_level,
      notes: form.notes,
      checkin_date: today,
    });
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      await loadCheckins();
      setTimeout(() => setSubmitted(false), 3000);
    }
  }

  const avgByDay = DAY_LABELS.map(({ day }) => {
    const c = checkins.find((ch) => ch.plan_day === day);
    return {
      day,
      swelling: c?.swelling_level ?? null,
      skin: c?.skin_tone ?? null,
      energy: c?.energy_level ?? null,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf7f2] to-[#fce8ef]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/quiz" className="p-2 bg-white rounded-lg border border-stone-200 text-stone-500 hover:text-[#c4607a] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-stone-800">七天食療打卡</h1>
            <p className="text-sm text-stone-500">
              {constitution ? `體質：${constitution}` : "完成體質測評後可看個人化建議"}
            </p>
          </div>
          <div className="flex gap-1 bg-white rounded-lg border border-stone-200 p-1">
            <button
              onClick={() => setView("log")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === "log" ? "bg-rose-100 text-[#c4607a]" : "text-stone-500"}`}
            >打卡</button>
            <button
              onClick={() => setView("chart")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${view === "chart" ? "bg-rose-100 text-[#c4607a]" : "text-stone-500"}`}
            ><BarChart2 className="w-3.5 h-3.5" />趨勢</button>
          </div>
        </div>

        {/* Day Progress */}
        <div className="grid grid-cols-7 gap-1.5 mb-8">
          {DAY_LABELS.map(({ day, label, icon }) => {
            const done = completedDays.has(day);
            const active = activeDay === day;
            return (
              <button
                key={day}
                onClick={() => { setActiveDay(day); setSubmitted(false); }}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                  active ? "border-rose-400 bg-rose-50" : done ? "border-green-300 bg-green-50" : "border-stone-200 bg-white hover:border-rose-300"
                }`}
              >
                <span className="text-base">{icon}</span>
                <span className={`text-xs font-bold ${active ? "text-rose-600" : done ? "text-green-600" : "text-stone-500"}`}>
                  D{day}
                </span>
                {done ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Circle className="w-3.5 h-3.5 text-stone-300" />}
              </button>
            );
          })}
        </div>

        {view === "log" && (
          <>
            {/* Day info */}
            <div className="bg-white rounded-2xl border border-rose-100 p-5 mb-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{DAY_LABELS[activeDay - 1].icon}</span>
                <div>
                  <h2 className="font-bold text-stone-800">Day {activeDay}・{DAY_LABELS[activeDay - 1].label}</h2>
                  <p className="text-sm text-stone-500">{DAY_LABELS[activeDay - 1].focus}</p>
                </div>
              </div>
            </div>

            {/* Already logged */}
            {todayCheckin ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Day {activeDay} 已打卡完成</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {METRICS.map((m) => {
                    const val = todayCheckin[m.key] as number;
                    const c = colorMap[m.color as keyof typeof colorMap];
                    return (
                      <div key={m.key} className={`${c.bg} ${c.border} border rounded-xl p-3 text-center`}>
                        <m.icon className={`w-4 h-4 ${c.text} mx-auto mb-1`} />
                        <div className="text-xs text-stone-500 mb-1">{m.label}</div>
                        <div className={`text-lg font-bold ${c.text}`}>{val}/5</div>
                        <div className="text-xs text-stone-400">{m.scale[val - 1]}</div>
                      </div>
                    );
                  })}
                </div>
                {todayCheckin.notes && (
                  <p className="mt-3 text-sm text-stone-600 bg-white rounded-lg p-3 border border-stone-100">
                    📝 {todayCheckin.notes}
                  </p>
                )}
              </div>
            ) : (
              /* Check-in form */
              <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm mb-5">
                <h3 className="font-bold text-stone-800 mb-5">記錄今日狀況</h3>

                <div className="space-y-6">
                  {METRICS.map((m) => {
                    const val = form[m.key];
                    const c = colorMap[m.color as keyof typeof colorMap];
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <m.icon className={`w-4 h-4 ${c.text}`} />
                            <span className="font-medium text-stone-700 text-sm">{m.label}</span>
                          </div>
                          <span className={`text-sm font-semibold ${c.text}`}>{val}/5・{m.scale[val - 1]}</span>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              onClick={() => setForm({ ...form, [m.key]: v })}
                              className={`flex-1 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
                                val === v ? `${c.fill} border-transparent text-white` : `${c.light} ${c.border} ${c.text} hover:opacity-80`
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">今日備註（選填）</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="例如：早上臉比昨天消了一點，喝了兩杯紅豆茶…"
                      rows={3}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none"
                    />
                  </div>
                </div>

                {submitted ? (
                  <div className="mt-4 flex items-center justify-center gap-2 py-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    打卡成功！數據已儲存
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-5 w-full py-4 disabled:bg-stone-300 text-white font-bold rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:opacity-90"
                    style={{background:"linear-gradient(135deg,#e8a0b4,#c4607a)"}}
                  >
                    <Save className="w-5 h-5" />
                    {submitting ? "儲存中…" : `Day ${activeDay} 打卡完成`}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {view === "chart" && (
          <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-[#c4607a]" />
              <h3 className="font-bold text-stone-800">七天變化趨勢</h3>
              <span className="ml-auto text-xs text-stone-400">{completedDays.size}/7 天完成</span>
            </div>

            {completedDays.size === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>還沒有打卡記錄</p>
                <p className="text-sm mt-1">完成第一天打卡後，趨勢圖將顯示在這裡</p>
              </div>
            ) : (
              <div className="space-y-6">
                {METRICS.map((m) => {
                  const c = colorMap[m.color as keyof typeof colorMap];
                  return (
                    <div key={m.key}>
                      <div className="flex items-center gap-2 mb-3">
                        <m.icon className={`w-4 h-4 ${c.text}`} />
                        <span className="text-sm font-semibold text-stone-700">{m.label}</span>
                      </div>
                      <div className="flex items-end gap-2 h-24">
                        {avgByDay.map(({ day, ...vals }) => {
                          const val = vals[m.key.replace("_level", "") as "swelling" | "skin" | "energy"];
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-1">
                              {val !== null ? (
                                <>
                                  <span className={`text-xs font-bold ${c.text}`}>{val}</span>
                                  <div className="w-full flex flex-col justify-end" style={{ height: "64px" }}>
                                    <div
                                      className={`w-full rounded-t-md ${c.fill} opacity-80 transition-all`}
                                      style={{ height: `${(val / 5) * 64}px` }}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-xs text-stone-300">—</span>
                                  <div style={{ height: "64px" }} className="w-full bg-stone-100 rounded-t-md" />
                                </>
                              )}
                              <span className="text-xs text-stone-400">D{day}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-stone-400 mt-1">
                        <span>{m.scale[0]}</span>
                        <span>{m.scale[4]}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Summary */}
                {completedDays.size >= 2 && (() => {
                  const first = checkins.find((c) => c.plan_day === Math.min(...Array.from(completedDays)));
                  const last = checkins.find((c) => c.plan_day === Math.max(...Array.from(completedDays)));
                  if (!first || !last || first.plan_day === last.plan_day) return null;
                  const swDiff = (last.swelling_level ?? 0) - (first.swelling_level ?? 0);
                  const skinDiff = (last.skin_tone ?? 0) - (first.skin_tone ?? 0);
                  const energyDiff = (last.energy_level ?? 0) - (first.energy_level ?? 0);
                  const avg = (swDiff + skinDiff + energyDiff) / 3;
                  return (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-2">
                      <p className="text-sm font-semibold text-[#5c3a4a] mb-2">📈 整體進步摘要</p>
                      <p className="text-sm text-[#c4607a]">
                        從 Day {first.plan_day} 到 Day {last.plan_day}，
                        消腫 {swDiff >= 0 ? "+" : ""}{swDiff}，
                        膚色 {skinDiff >= 0 ? "+" : ""}{skinDiff}，
                        精神 {energyDiff >= 0 ? "+" : ""}{energyDiff}。
                        {avg > 0 ? " 持續加油！食療效果正在累積🌿" : " 試著調整飲食配比，或諮詢中醫師。"}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Bottom disclaimer */}
        <p className="text-center text-xs text-stone-400 mt-6 leading-relaxed">
          本追蹤工具僅供個人記錄參考，不能替代醫師診斷。<br />
          若症狀無改善，請諮詢合格中醫師。
        </p>
      </div>
    </div>
  );
}
