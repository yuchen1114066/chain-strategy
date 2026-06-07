import Link from "next/link";
import { commodities, priceZone } from "@/lib/erp/commodities";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "L5 Market Intelligence · 全球市場情報中心" };

export default function L5MarketPage() {
  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text, fontSize: "16px" }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-7 text-[15px] leading-relaxed">

        <header>
          <div className="text-[13px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L5 Market Intelligence</div>
          <h1 className="text-4xl sm:text-5xl font-semibold mt-1">全球市場情報中心</h1>
          <p className="text-base mt-1" style={{ color: SC.textSub }}>以 6 個關鍵問題的角度設計 · 每個區塊都在回答其中一題</p>
        </header>

        {/* ❓ L5 應回答的 6 個關鍵問題 — 頂部導覽（點任一問題跳到對應區塊） */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-lg font-semibold">❓ L5 應回答的 6 個關鍵問題</h2>
            <span className="text-[11px]" style={{ color: SC.textSub }}>採購／CEO／供應鏈每天問的最重要問題</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { q: "市場正在發生什麼？",   anchor: "#q1", chip: "1", target: "區塊 1·10",  desc: "Commodity / Volatility", tone: SC.blue },
              { q: "未來會發生什麼？",     anchor: "#q2", chip: "2", target: "區塊 5·18",  desc: "AI Why / 12 Month Forecast", tone: SC.red },
              { q: "我該買嗎？",            anchor: "#q3-engine", chip: "3", target: "區塊 16", desc: "Buy Signal Engine",   tone: "#d97706" },
              { q: "何時買？",              anchor: "#q4", chip: "4", target: "區塊 4",     desc: "AI 鎖價時機建議",          tone: "#d97706" },
              { q: "漲價合理嗎？",          anchor: "#q5", chip: "5", target: "區塊 2·6",   desc: "Profit Impact / Product",  tone: SC.amber },
              { q: "供應商是否說謊？",      anchor: "#q6-validation", chip: "6", target: "區塊 15·17", desc: "Truth Check + Validation",     tone: SC.primary },
            ].map((x) => (
              <a key={x.q} href={x.anchor} className="block rounded-md border p-3 hover:shadow-sm transition-shadow"
                 style={{ borderColor: SC.border, background: SC.surface, borderLeft: `4px solid ${x.tone}` }}>
                <div className="flex items-baseline gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                        style={{ background: x.tone }}>{x.chip}</span>
                  <span className="text-sm font-bold" style={{ color: SC.text }}>{x.q}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-[11px]">
                  <span style={{ color: SC.textSub }}>→ {x.target}</span>
                  <span className="font-mono" style={{ color: SC.outline }}>{x.desc}</span>
                </div>
              </a>
            ))}
          </div>
        </Card>

        {/* 區塊 1 — Commodity Dashboard ❓ Q1 */}
        <div id="q1" />
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="1" title="Commodity Dashboard · 原物料儀表" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.blue }}>❓Q1 市場正在發生什麼</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {commodities.slice(0, 4).map((c) => {
              const last = c.prices[c.prices.length - 1]?.price ?? 0;
              const prev = c.prices[c.prices.length - 5]?.price ?? last;
              const pct  = ((last - prev) / Math.max(1, prev)) * 100;
              const z = priceZone(c);
              const bar = z.tone === "rose" ? SC.red : z.tone === "emerald" ? SC.primary : z.tone === "amber" ? SC.amber : SC.blue;
              return (
                <div key={c.code} className="rounded-md border p-3" style={{ borderColor: SC.border, borderLeft: `4px solid ${bar}` }}>
                  <MiniLabel>{c.name} · {c.nameEn}</MiniLabel>
                  <div className="text-xl font-extrabold tabular-nums mt-1" style={{ color: SC.text }}>
                    ${last >= 1000 ? `${(last / 1000).toFixed(2)}k` : last.toFixed(0)}
                  </div>
                  <div className="text-[10px] font-bold mt-0.5" style={{ color: pct >= 0 ? SC.red : SC.emerald }}>
                    {pct >= 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
                  </div>
                  <div className="text-[9px] mt-1" style={{ color: SC.textSub }}>{z.zone}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 區塊 2 / 3 並排 */}
        <div className="grid md:grid-cols-2 gap-5">
          <div id="q5" />
        {/* 區塊 2 — Profit Impact Center */}
          <Card accent={SC.red}>
            <Header n="2" title="Profit Impact Center · 成本衝擊排行" />
            <ul className="space-y-2 mt-2">
              {[
                { rank: 1, item: "銅",      impact: "-280 萬", note: "Cu LME +5.6%" },
                { rank: 2, item: "鋼",      impact: "-120 萬", note: "CR ↑ 3.2%" },
                { rank: 3, item: "運費 USD", impact: "-80 萬",  note: "海運回穩中" },
              ].map((r) => (
                <li key={r.rank} className="flex items-baseline justify-between border-b pb-2 last:border-0" style={{ borderColor: SC.border }}>
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: SC.red }}>#{r.rank}</span>
                    <span className="text-sm font-semibold">{r.item}</span>
                    <span className="text-[10px]" style={{ color: SC.textSub }}>{r.note}</span>
                  </span>
                  <span className="text-base font-bold tabular-nums" style={{ color: SC.red }}>{r.impact}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div id="q3" />
        {/* 區塊 3 — AI Action Queue */}
          <Card accent={SC.blue}>
            <Header n="3" title="AI Action Queue · 優先動作" />
            <ol className="space-y-2 mt-2">
              {[
                { rank: "P1", item: "銅", deadline: "48 小時內", tone: SC.red    },
                { rank: "P2", item: "鋼", deadline: "7 天內",    tone: SC.amber  },
                { rank: "P3", item: "USD",deadline: "30 天內",   tone: SC.blue   },
              ].map((a) => (
                <li key={a.rank} className="flex items-baseline justify-between border-b pb-2 last:border-0" style={{ borderColor: SC.border }}>
                  <span className="flex items-baseline gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: a.tone }}>{a.rank}</span>
                    <span className="text-sm font-semibold">{a.item}</span>
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: SC.textSub }}>{a.deadline}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div id="q4" />
        {/* 區塊 4 — AI Procurement Copilot */}
        <Card accent={SC.primary}>
          <Header n="4" title="AI Procurement Copilot · 採購副駕" />
          <div className="rounded-md p-4 mt-2" style={{ background: SC.surfaceDim }}>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <KV k="建議"     v="提前採購 15%" color={SC.primary} bold />
              <KV k="供應商"   v="第一銅業"    color={SC.text} />
              <KV k="數量"     v="350 MT"      color={SC.text} mono />
              <KV k="預估節省" v="$153,700 USD" color={SC.emerald} bold mono />
            </div>
            <button className="mt-4 px-5 py-2 rounded text-sm font-semibold text-white" style={{ background: SC.primary }}>建立採購策略</button>
          </div>
        </Card>

        <div id="q2" />
        {/* 區塊 5 — AI Why */}
        <Card accent={SC.blue}>
          <Header n="5" title="AI Why · 推理解釋" />
          <div className="rounded-md p-4 mt-2" style={{ background: SC.surfaceDim }}>
            <ul className="text-sm space-y-1.5" style={{ color: SC.text }}>
              <li>· Q3 銅價預測上漲 <b style={{ color: SC.red }}>5.2%</b></li>
              <li>· 年度需求 <b className="font-mono">850 噸</b></li>
              <li>· 目前庫存可撐 <b className="font-mono">38 天</b></li>
              <li>· 建議增加 <b style={{ color: SC.primary }}>15%</b> 採購量</li>
              <li>· 預估節省 <b className="font-mono" style={{ color: SC.emerald }}>120 萬</b></li>
            </ul>
          </div>
        </Card>

        <div id="q5" />
        {/* 區塊 6 — Product Impact */}
        <Card accent={SC.amber}>
          <Header n="6" title="Product Impact · 產品線衝擊" />
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {[
              { name: "Lite 系列",   cost: "+1.2%", qty: "8,000 件", tone: SC.amber },
              { name: "Precor 系列", cost: "+2.1%", qty: "-270 件",  tone: SC.red   },
            ].map((p) => (
              <div key={p.name} className="rounded-md border p-3" style={{ borderColor: SC.border, borderLeft: `4px solid ${p.tone}` }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span className="text-base font-bold font-mono" style={{ color: p.tone }}>{p.cost}</span>
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: SC.textSub }}>{p.qty}</div>
              </div>
            ))}
          </div>
        </Card>

<div id="q2-detail" />
        {/* 區塊 7 / 8 / 9 並排（Q2 未來會發生什麼 — 匯率/運費/能源） */}
        <div className="grid md:grid-cols-3 gap-5">
          <Card accent={SC.blue}>
            <Header n="7" title="Currency Dashboard · 匯率" />
            <ul className="space-y-2 mt-2 text-sm">
              {[
                { pair: "USD/TWD", v: "31.50", d: "+0.5%", tone: SC.amber },
                { pair: "USD/CNY", v: "7.24",  d: "-0.1%", tone: SC.emerald },
                { pair: "USD/JPY", v: "152.3", d: "+0.8%", tone: SC.amber },
              ].map((f) => (
                <li key={f.pair} className="flex items-baseline justify-between">
                  <span className="font-mono text-xs" style={{ color: SC.textSub }}>{f.pair}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono font-bold">{f.v}</span>
                    <span className="text-[10px]" style={{ color: f.tone }}>{f.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card accent={SC.blue}>
            <Header n="8" title="Freight Dashboard · 運費" />
            <ul className="space-y-2 mt-2 text-sm">
              {[
                { route: "上海→洛杉磯", v: "$1,850", d: "+12%", tone: SC.red    },
                { route: "高雄→鹿特丹", v: "$2,400", d: "+5%",  tone: SC.amber  },
                { route: "BDI 指數",    v: "1,500",  d: "穩定",  tone: SC.emerald },
              ].map((f) => (
                <li key={f.route} className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: SC.textSub }}>{f.route}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono font-bold">{f.v}</span>
                    <span className="text-[10px]" style={{ color: f.tone }}>{f.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card accent={SC.blue}>
            <Header n="9" title="Energy Dashboard · 能源" />
            <ul className="space-y-2 mt-2 text-sm">
              {[
                { item: "Brent 原油",      v: "$85/桶", d: "+3%", tone: SC.amber },
                { item: "Henry Hub 天然氣", v: "$2.4",   d: "-2%", tone: SC.emerald },
                { item: "工業電價 TW",      v: "3.85/kWh", d: "+8%", tone: SC.red },
              ].map((e) => (
                <li key={e.item} className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: SC.textSub }}>{e.item}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono font-bold">{e.v}</span>
                    <span className="text-[10px]" style={{ color: e.tone }}>{e.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div id="q1" />
        {/* 區塊 10 — Market Volatility */}
        <Card accent={SC.red}>
          <Header n="10" title="Market Volatility · 市場波動指數" />
          <div className="grid md:grid-cols-3 gap-4 mt-2">
            {[
              { label: "全球供應鏈風險", level: "Medium-High", tone: SC.amber, pct: 65 },
              { label: "地緣政治風險",   level: "High",        tone: SC.red,   pct: 80 },
              { label: "景氣循環風險",   level: "Medium",      tone: SC.amber, pct: 50 },
            ].map((v) => (
              <div key={v.label} className="rounded-md border p-3" style={{ borderColor: SC.border }}>
                <MiniLabel>{v.label}</MiniLabel>
                <div className="text-lg font-bold mt-1" style={{ color: v.tone }}>● {v.level}</div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: SC.surfaceDim }}>
                  <div className="h-full" style={{ width: `${v.pct}%`, background: v.tone }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════ */}
        {/* AI Engine Modules — 4 個世界級 AI 模組               */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="pt-4 mt-4 border-t" style={{ borderColor: SC.border }}>
          <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L5 AI ENGINE MODULES</div>
          <h2 className="text-xl font-semibold">世界級 AI 引擎模組</h2>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>從「只看到問題」進化到「自動解決問題」的 4 個關鍵模組</p>
        </div>

        {/* 區塊 11 — Knowledge Graph */}
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="11" title="Knowledge Graph · 知識圖譜" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>WORLD-CLASS</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>不只看到「FB64-WIRE 缺料」，要看到「缺料 → 影響哪個客戶哪張單多少錢」</div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#d97706" }}>❌ 現在系統只說</div>
              <div className="rounded-md p-3 text-sm font-mono" style={{ background: `${SC.red}10`, color: SC.red }}>
                FB64-WIRE<br/>但不知道：影響多少？
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.primary }}>✓ 世界級系統必須知道</div>
              <div className="rounded-md p-3 text-xs" style={{ background: `${SC.primary}10`, color: SC.text }}>
                <div className="space-y-0.5 font-mono">
                  <div>🔧 銅料</div>
                  <div className="pl-2">↓</div>
                  <div className="pl-2">📦 FB64-WIRE</div>
                  <div className="pl-2">↓</div>
                  <div className="pl-4">🔩 FB64 電線組</div>
                  <div className="pl-4">↓</div>
                  <div className="pl-6">📋 工單 WO-2026-0103</div>
                  <div className="pl-6">↓</div>
                  <div className="pl-8">🏭 產品 FB64-Pro</div>
                  <div className="pl-8">↓</div>
                  <div className="pl-10">👥 客戶 LIFE Fitness</div>
                  <div className="pl-10">↓</div>
                  <div className="pl-12">💰 訂單 $1,820,000</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t" style={{ borderColor: SC.border }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.textSub }}>你要建立的 Graph 連接 + 資料來源</div>
            <div className="flex items-center flex-wrap gap-1 text-xs">
              {[
                { node: "Supplier", src: "PUR" },
                { node: "Part",     src: "MDM" },
                { node: "BOM",      src: "BOMMA" },
                { node: "WO",       src: "MOC" },
                { node: "Product",  src: "MDM" },
                { node: "Customer", src: "CMS" },
                { node: "Revenue",  src: "ACT" },
              ].map((n, i, arr) => (
                <span key={n.node} className="flex items-center gap-1">
                  <span className="px-2 py-1 rounded font-mono font-semibold" style={{ background: SC.surfaceDim, color: SC.text }}>
                    {n.node}
                    <span className="text-[9px] ml-1" style={{ color: SC.blue }}>·{n.src}</span>
                  </span>
                  {i < arr.length - 1 && <span style={{ color: SC.textSub }}>→</span>}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[10px]" style={{ color: SC.textSub }}>
              ✓ 你目前 ERP / BOM / MRP / PO / OD 已有 — 資料已經夠了，只需要連接成圖
            </div>
          </div>

          <div className="mt-3 rounded-md p-3" style={{ background: `${SC.blue}08`, border: `1px solid ${SC.blue}30` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: SC.blue }}>互動：點任一節點 → 立即顯示</div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {["客戶", "影響毛利", "相關零件", "相關供應商", "影響工單"].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full" style={{ background: SC.surface, border: `1px solid ${SC.border}`, color: SC.text }}>{t}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* 區塊 12 — Root Cause Tree */}
        <Card accent={SC.red}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="12" title="Root Cause Tree · 根因樹" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>WORLD-CLASS</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>這個是 CEO 要看的 — 不是「毛利下降」，是「為什麼下降 + 怎麼修」</div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#d97706" }}>❌ 現在看到</div>
              <div className="rounded-md p-3 text-sm font-semibold" style={{ background: `${SC.red}10`, color: SC.red }}>
                毛利下降<br/><span className="text-[10px] font-normal">不知道原因</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.primary }}>✓ Root Cause Tree</div>
              <div className="rounded-md p-3 text-xs" style={{ background: `${SC.primary}10`, color: SC.text }}>
                <div className="space-y-0.5 font-mono">
                  <div>💸 <b>Profit Loss</b> -480 萬</div>
                  <div className="pl-2">↓</div>
                  <div className="pl-2">📈 <b>Cost Increase</b> +205 萬</div>
                  <div className="pl-2">↓</div>
                  <div className="pl-4">🔧 <b>Copper</b> 銅料漲 +5.6%</div>
                  <div className="pl-4">↓</div>
                  <div className="pl-6">📦 <b>FB64-WIRE</b> 月用 5,000 件</div>
                  <div className="pl-6">↓</div>
                  <div className="pl-8">🏭 <b>Supplier A</b> 報價偏高 18%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-md p-3" style={{ background: SC.surfaceDim }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.textSub }}>Why Tree 拖移互動</div>
            <div className="text-xs leading-relaxed" style={{ color: SC.text }}>
              CEO 點「毛利下降」→ 樹自動展開全部原因鏈　·　點任一節點下鑽 5 層細節　·　樹葉節點 = 可立即執行的 Action
            </div>
          </div>
        </Card>

        {/* 區塊 13 — One Click Action */}
        <Card accent={"#d97706"}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="13" title="One Click Action · 一鍵動作" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>WORLD-CLASS</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>AI 說「很危險」沒用 — 要 AI 直接做、人按一個鍵就執行</div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#d97706" }}>❌ AI 評估完，但需要人做</div>
              <div className="rounded-md p-3 text-xs" style={{ background: `${SC.red}10`, color: SC.text }}>
                <div>1. AI 提醒「銅價快漲了」</div>
                <div>2. 採購人員手動鎖價</div>
                <div>3. 採購人員手動建 RFQ</div>
                <div>4. 採購人員手動發 PO</div>
                <div className="mt-1 text-[10px]" style={{ color: SC.red }}>3 天後才動作 — 漲價已發生</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.primary }}>✓ 世界級：AI 直接建立草案</div>
              <div className="rounded-md p-3 text-xs" style={{ background: `${SC.primary}10`, color: SC.text }}>
                <div className="font-bold mb-1">CEO 按下「同意」一個鍵，系統自動：</div>
                <div>✓ 鎖 Cu 價</div>
                <div>✓ 鎖 Cu 倉</div>
                <div>✓ 提前備料</div>
                <div>✓ 通知供應商</div>
                <div>✓ 通知工程師</div>
                <div className="mt-1 text-[10px]" style={{ color: SC.primary }}>5 分鐘執行 — 搶在漲價前</div>
              </div>
            </div>
          </div>

          <div className="rounded-md p-3 mb-3" style={{ background: SC.surfaceDim }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.textSub }}>新增 Action Engine 端點</div>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              {[
                "/actions/lock-price",
                "/actions/create-rfq",
                "/actions/alternate-supplier",
                "/actions/expedite-shipment",
              ].map((a) => (
                <span key={a} className="px-2 py-1 rounded" style={{ background: SC.surface, border: `1px solid ${SC.border}`, color: SC.blue }}>{a}</span>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <button className="py-2.5 rounded text-sm font-bold text-white" style={{ background: SC.primary }}>
              ✓ 一鍵同意（執行 4 個動作）
            </button>
            <button className="py-2.5 rounded text-sm font-bold border" style={{ borderColor: SC.border, color: SC.text, background: SC.surface }}>
              🔍 查看草案明細
            </button>
          </div>
        </Card>

        {/* 區塊 14 — Autonomous Workflow */}
        <Card accent={SC.blue}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="14" title="Autonomous Workflow · 自動工作流" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>WORLD-CLASS</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>連 CEO 也不用按 — AI 發現問題 → 自動決策 → 自動執行 → 只在需要核准時找人</div>

          <div className="grid md:grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#d97706" }}>❌ 目前流程</div>
              <div className="rounded-md p-3 text-xs font-mono" style={{ background: `${SC.red}10`, color: SC.text }}>
                <div>AI 發現問題</div>
                <div>↓</div>
                <div>📧 寄 email 通知人</div>
                <div className="mt-1 text-[10px]" style={{ color: SC.red }}>等人看 email、等人決定、等人執行</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: SC.primary }}>✓ 世界級 Autonomous Workflow</div>
              <div className="rounded-md p-3 text-xs font-mono" style={{ background: `${SC.primary}10`, color: SC.text }}>
                <div>AI 發現問題</div>
                <div>↓ 自動決策</div>
                <div>↓ 缺料模擬</div>
                <div>↓ 通知供應商</div>
                <div>↓ 重新計算成本</div>
                <div>↓ 推薦行動方案</div>
                <div>↓ 只在需要時找人核准</div>
              </div>
            </div>
          </div>

          <div className="rounded-md p-3 mb-3" style={{ background: "#fef3c7", border: `1px solid #f59e0b` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#92400e" }}>實例：ASN Delayed（供應商延遲到貨）</div>
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-bold mb-1" style={{ color: "#92400e" }}>現在：</div>
                <div className="font-mono" style={{ color: "#7c2d12" }}>📧 email 採購人員</div>
              </div>
              <div>
                <div className="font-bold mb-1" style={{ color: SC.primary }}>未來自動 Pipeline：</div>
                <div className="font-mono text-[10px]" style={{ color: SC.text }}>
                  <code className="px-1 rounded" style={{ background: SC.surface }}>asn_delayed</code>
                  <span className="mx-1">→</span>
                  <code className="px-1 rounded" style={{ background: SC.surface }}>Workflow Engine</code>
                  <span className="mx-1">→</span>
                  <code className="px-1 rounded" style={{ background: SC.surface }}>Shortage Simulation</code>
                  <span className="mx-1">→</span>
                  <code className="px-1 rounded" style={{ background: SC.surface }}>AI Recalculate</code>
                  <span className="mx-1">→</span>
                  <code className="px-1 rounded" style={{ background: SC.surface }}>Alt Supplier Check</code>
                  <span className="mx-1">→</span>
                  <code className="px-1 rounded" style={{ background: SC.surface }}>Generate Action Plan</code>
                  <span className="mx-1">→</span>
                  <code className="px-1 rounded font-bold" style={{ background: SC.primary, color: "#fff" }}>Approval</code>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-center" style={{ color: SC.textSub }}>
            💡 4 個模組組合起來 = Knowledge Graph 看「影響什麼」+ Root Cause Tree 看「為什麼」+ One Click Action 看「怎麼做」+ Autonomous Workflow 看「自動做」
          </div>
        </Card>

        {/* ❓ Q6 區塊 15 — Supplier Truth Check 供應商透明度檢查 */}
        <div id="q6" />
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="15" title="Supplier Truth Check · 供應商透明度檢查" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>❓Q6 供應商是否說謊</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>把供應商報價跟 LME / 中鋼 / 市場合理價對比 — AI 判斷誰在講真話</div>

          {/* 供應商真話檢查表 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: SC.border, color: SC.textSub }}>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest">供應商</th>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest">料件</th>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest text-right">本期報價</th>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest text-right">市場合理價</th>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest text-right">落差</th>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest text-center">歷史誠信</th>
                  <th className="py-2 text-[10px] font-bold uppercase tracking-widest">AI 判定</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sup: "A 銅業",     part: "FB64-WIRE",  quote: 100, fair:  98, deltaPct:  +2, trust: 98, verdict: "合理（誠信佳）",   tone: SC.primary },
                  { sup: "B 線材",     part: "FB64-WIRE",  quote: 118, fair: 101, deltaPct: +17, trust: 62, verdict: "🚨 高於市場 17%，連 3 月偏高 — 建議稽核", tone: SC.red },
                  { sup: "C 線材",     part: "FB64-WIRE",  quote:  97, fair:  98, deltaPct:  -1, trust: 88, verdict: "合理（市場行情內）", tone: SC.primary },
                  { sup: "AX 金屬",    part: "FB64-FRM",   quote: 145, fair: 142, deltaPct:  +2, trust: 95, verdict: "合理（中鋼跟漲）",   tone: SC.primary },
                  { sup: "鋼鋒",       part: "FB64-FRM",   quote: 168, fair: 142, deltaPct: +18, trust: 55, verdict: "🚨 偏高 18%，與 CR 鋼價走勢背離", tone: SC.red },
                  { sup: "電源廠 D",   part: "FB64-PSU",   quote: 320, fair: 318, deltaPct:  +1, trust: 92, verdict: "合理",               tone: SC.primary },
                ].map((r) => (
                  <tr key={r.sup + r.part} className="border-b align-top" style={{ borderColor: SC.border, background: r.deltaPct > 10 ? "#fef3c7" : undefined }}>
                    <td className="py-2 font-semibold" style={{ color: SC.text }}>{r.sup}</td>
                    <td className="py-2 font-mono text-xs" style={{ color: SC.textSub }}>{r.part}</td>
                    <td className="py-2 text-right font-mono">{r.quote}</td>
                    <td className="py-2 text-right font-mono" style={{ color: SC.textSub }}>{r.fair}</td>
                    <td className="py-2 text-right font-mono font-bold" style={{ color: r.deltaPct > 10 ? SC.red : r.deltaPct > 3 ? "#d97706" : SC.primary }}>
                      {r.deltaPct >= 0 ? "+" : ""}{r.deltaPct}%
                    </td>
                    <td className="py-2 text-center">
                      <span className="font-mono font-bold" style={{ color: r.trust >= 85 ? SC.primary : r.trust >= 70 ? "#d97706" : SC.red }}>
                        {r.trust}%
                      </span>
                    </td>
                    <td className="py-2 text-xs font-semibold" style={{ color: r.tone }}>{r.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 紅旗摘要 */}
          <div className="mt-3 grid sm:grid-cols-3 gap-3">
            <div className="rounded-md p-3" style={{ background: `${SC.red}10`, border: `1px solid ${SC.red}30` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: SC.red }}>🚩 紅旗供應商</div>
              <div className="text-2xl font-extrabold" style={{ color: SC.red }}>2</div>
              <div className="text-[10px]" style={{ color: SC.textSub }}>B 線材 / 鋼鋒</div>
            </div>
            <div className="rounded-md p-3" style={{ background: "#fef3c7", border: "1px solid #f59e0b" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#92400e" }}>⚠ 觀察名單</div>
              <div className="text-2xl font-extrabold" style={{ color: "#92400e" }}>1</div>
              <div className="text-[10px]" style={{ color: SC.textSub }}>連續 2 月偏高 &gt; 5%</div>
            </div>
            <div className="rounded-md p-3" style={{ background: `${SC.primary}10`, border: `1px solid ${SC.primary}30` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: SC.primary }}>✓ 誠信良好</div>
              <div className="text-2xl font-extrabold" style={{ color: SC.primary }}>4</div>
              <div className="text-[10px]" style={{ color: SC.textSub }}>跟隨市場行情</div>
            </div>
          </div>

          {/* AI 演算法說明 */}
          <div className="mt-3 rounded-md p-3 text-[11px]" style={{ background: SC.surfaceDim, color: SC.textSub }}>
            <div className="font-bold mb-1" style={{ color: SC.text }}>📐 AI 判定演算法</div>
            <div>合理價 = LME / 中鋼 / INSEE 市場指數 × 該料件金屬佔比 × 製造加工係數（業界常數 1.2-1.5x）</div>
            <div>誠信度 = 過去 12 個月「報價跟市場走勢」相關係數（&gt;85% 良好 / 70-85 觀察 / &lt;70 紅旗）</div>
            <div>連續 3 月偏高 &gt; 10%（且金屬價無對應上漲）= 自動標 🚨</div>
          </div>
        </Card>

        {/* ❓ Q3 區塊 16 — Buy Signal Engine 採購最在乎的 */}
        <div id="q3-engine" />
        <Card accent={SC.red}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="16" title="Buy Signal Engine · 採購買進訊號引擎" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#d97706" }}>❓Q3 我該買嗎</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>採購最在乎的問題 — 直接給「該不該買」的答案，不只是預測</div>

          {/* 3 商品的買進訊號 */}
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { metal: "銅",   price: 9472,    verdict: "立即買進", stars: 5, conf: 91, alt: { wait: 30, drop: -4 },  tone: SC.primary, bg: `${SC.primary}10` },
              { metal: "鋼",   price: 1099,    verdict: "等待回檔", stars: 3, conf: 78, alt: { wait: 45, drop: -6 },  tone: "#d97706", bg: "#fef3c7" },
              { metal: "鋁",   price: 2598,    verdict: "立即買進", stars: 4, conf: 85, alt: { wait: 60, drop: -2 },  tone: SC.primary, bg: `${SC.primary}10` },
            ].map((s) => (
              <div key={s.metal} className="rounded-md border p-3" style={{ borderColor: SC.border, background: s.bg }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold" style={{ color: SC.text }}>{s.metal}價</span>
                  <span className="font-mono font-extrabold text-lg" style={{ color: SC.text }}>${s.price.toLocaleString()}</span>
                </div>
                <div className="mt-2 rounded p-2" style={{ background: "#fff", border: `1px solid ${s.tone}` }}>
                  <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: s.tone }}>🧠 AI 買進建議</div>
                  <div className="text-base font-extrabold mt-1" style={{ color: s.tone }}>{s.verdict}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#d97706" }}>{"★".repeat(s.stars)}<span style={{ color: SC.outline }}>{"☆".repeat(5 - s.stars)}</span></div>
                  <div className="text-[10px] mt-1" style={{ color: SC.textSub }}>信心度 <b className="font-mono" style={{ color: s.tone }}>{s.conf}%</b></div>
                </div>
                <div className="mt-2 text-[10px]" style={{ color: SC.textSub }}>
                  或：等待 <b className="font-mono">{s.alt.wait}</b> 天後預估 <b className="font-mono" style={{ color: SC.emerald }}>{s.alt.drop}%</b>
                </div>
              </div>
            ))}
          </div>

          {/* 直接回答區 */}
          <div className="mt-3 rounded-md p-4" style={{ background: SC.surfaceDim, border: `2px solid ${SC.primary}` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: SC.textSub }}>直接回答</div>
            <div className="text-xl font-extrabold" style={{ color: SC.primary }}>
              👉 銅、鋁今日內買進　·　鋼等待 45 天回檔
            </div>
            <div className="text-xs mt-1" style={{ color: SC.text }}>
              預估綜合節省 <b className="font-mono" style={{ color: SC.primary }}>+128 萬</b> · 風險窗口 30 天內
            </div>
          </div>
        </Card>

        {/* ❓ Q6 區塊 17 — Supplier Price Validation 供應商漲價驗證（未來最強功能） */}
        <div id="q6-validation" />
        <Card accent={SC.primary}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="17" title="Supplier Price Validation · 供應商漲價即時驗證" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.primary }}>❓Q6 供應商是否說謊</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>這是未來最強的功能 — 供應商打電話來說「銅漲我要漲」AI 立即算給你合理範圍</div>

          {/* 3 個近期供應商漲價請求 */}
          <div className="space-y-3">
            {[
              { sup: "B 線材", part: "FB64-WIRE", part_name: "電線組",  metal: "銅", metalPct: 18, metalRise: 8, askRise: 5,  fairRise: 1.4, verdict: "不合理", excess: 3.6 },
              { sup: "鋼鋒",   part: "FB64-FRM",  part_name: "車架",   metal: "鋼", metalPct: 85, metalRise: 3, askRise: 4,  fairRise: 2.55, verdict: "合理偏高", excess: 1.45 },
              { sup: "鋁友",   part: "FB64-RIM",  part_name: "車架鋁件", metal: "鋁", metalPct: 70, metalRise: 5, askRise: 3,  fairRise: 3.5, verdict: "合理（甚至低於該漲幅）", excess: -0.5 },
            ].map((c, i) => (
              <div key={i} className="rounded-md border" style={{ borderColor: SC.border, background: c.excess > 2 ? "#fef3c7" : c.excess < 0 ? `${SC.primary}10` : "#ffffff" }}>
                <div className="grid md:grid-cols-[1fr,1fr,180px] gap-3 p-3">
                  {/* 供應商說 */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: SC.textSub }}>📞 供應商說</div>
                    <div className="text-sm" style={{ color: SC.text }}>
                      <b>{c.sup}</b>（{c.part}）：「{c.metal}價漲 <b className="font-mono">{c.metalRise}%</b>，我要漲 <b className="font-mono" style={{ color: SC.red }}>{c.askRise}%</b>」
                    </div>
                  </div>
                  {/* AI 即時驗證 */}
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: SC.blue }}>🧠 AI 立即驗證</div>
                    <div className="text-xs font-mono leading-snug" style={{ color: SC.text }}>
                      {c.part_name} 含{c.metal}佔比 <b>{c.metalPct}%</b><br/>
                      合理漲幅 = {c.metalPct}% × {c.metalRise}% = <b style={{ color: SC.primary }}>{c.fairRise}%</b><br/>
                      供應商要求 <b>{c.askRise}%</b>，{c.excess > 0 ? "超出" : "低於"} <b style={{ color: c.excess > 0 ? SC.red : SC.primary }}>{Math.abs(c.excess).toFixed(1)}%</b>
                    </div>
                  </div>
                  {/* 直接揭示 */}
                  <div className="rounded-md p-3 text-center flex flex-col justify-center" style={{ background: c.excess > 2 ? SC.red : c.excess > 0 ? "#d97706" : SC.primary }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white opacity-80">AI 直接揭示</div>
                    <div className="text-base font-extrabold text-white mt-0.5">{c.verdict}</div>
                    {c.excess > 0 && <div className="text-[10px] text-white opacity-90 mt-0.5">建議反議價至 {c.fairRise}%</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 演算法 */}
          <div className="mt-3 rounded-md p-3 text-[11px]" style={{ background: SC.surfaceDim, color: SC.textSub }}>
            <div className="font-bold mb-1" style={{ color: SC.text }}>📐 AI 驗證演算法</div>
            <div>合理漲幅 = 該料件{`{金屬佔比 %}`} × {`{該金屬市場真實漲幅 %}`}　·　全部由系統自動拉 LME / 中鋼 / INSEE 即時行情驗證</div>
            <div>差距 &gt; 2% → 自動標「不合理」並推薦反議價底價</div>
          </div>
        </Card>

        {/* ❓ Q2 區塊 18 — 12 Month Forecast 年度議價預測 */}
        <div id="q2-12m" />
        <Card accent={SC.blue}>
          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
            <Header n="18" title="12 Month Forecast · 12 個月預測（年度議價必備）" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.red }}>❓Q2 未來會發生什麼</span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: SC.textSub }}>原本只看 30/90/180 天 — 世界級採購做年度議價要看 3M / 6M / 12M</div>

          {/* 3 個商品的 3M / 6M / 12M */}
          <div className="space-y-3">
            {[
              { metal: "銅",  current: 9472, forecasts: [
                { period: "3M",  delta:  +3,  conf: 88, label: "2026/Q3" },
                { period: "6M",  delta:  +8,  conf: 78, label: "2026/Q4", note: "↑ 中國基建續強" },
                { period: "12M", delta:  -8,  conf: 65, label: "2027/Q1", note: "↓ 美聯儲降息 + EV 過剩" },
              ]},
              { metal: "鋼",  current: 1099, forecasts: [
                { period: "3M",  delta:  -2,  conf: 80, label: "2026/Q3" },
                { period: "6M",  delta:  -6,  conf: 72, label: "2026/Q4", note: "↓ 中國產能過剩" },
                { period: "12M", delta: +12,  conf: 58, label: "2027/Q1", note: "↑ 全球基建週期" },
              ]},
              { metal: "鋁",  current: 2598, forecasts: [
                { period: "3M",  delta:  +1,  conf: 85, label: "2026/Q3" },
                { period: "6M",  delta:  +4,  conf: 75, label: "2026/Q4", note: "↑ 綠能需求" },
                { period: "12M", delta:  +9,  conf: 62, label: "2027/Q1", note: "↑ 電動車輕量化趨勢" },
              ]},
            ].map((m) => (
              <div key={m.metal} className="rounded-md border p-3" style={{ borderColor: SC.border }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-base font-bold" style={{ color: SC.text }}>{m.metal}價</span>
                  <span className="text-[10px]" style={{ color: SC.textSub }}>當前 <b className="font-mono">${m.current.toLocaleString()}</b></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {m.forecasts.map((f) => (
                    <div key={f.period} className="rounded-md p-3 text-center"
                         style={{ background: f.delta > 5 ? `${SC.red}10` : f.delta < -5 ? `${SC.primary}10` : SC.surfaceDim,
                                  border: `1px solid ${f.delta > 5 ? SC.red : f.delta < -5 ? SC.primary : SC.border}` }}>
                      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: SC.textSub }}>{f.period} · {f.label}</div>
                      <div className="text-2xl font-extrabold font-mono mt-1"
                           style={{ color: f.delta > 0 ? SC.red : SC.primary }}>
                        {f.delta > 0 ? "+" : ""}{f.delta}%
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: SC.textSub }}>信心 {f.conf}%</div>
                      {f.note && <div className="text-[10px] mt-1" style={{ color: SC.text }}>{f.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md p-3 text-[11px]" style={{ background: SC.surfaceDim, color: SC.textSub }}>
            <div className="font-bold mb-1" style={{ color: SC.text }}>💡 為什麼必須有 12M 預測</div>
            <div>· 年度議價（11-12 月）採購要看全年走勢，30/90/180 天不夠</div>
            <div>· 12 個月預測讓你決定：簽 1 年長約 vs 半年滾動 vs 現貨</div>
            <div>· 例：銅 6M ↑8% 12M ↓8% → 簽半年合約最划算（前 6 月鎖價，後 6 月走現貨）</div>
          </div>
        </Card>

        <footer className="text-[10px] pt-4 border-t flex items-center justify-between" style={{ borderColor: SC.border, color: SC.textSub }}>
          <span>CHI HUA AI · L5 Market Intelligence · /erp/market</span>
          <Link href="/erp/profit-defense" style={{ color: SC.blue }} className="hover:underline">→ AI Profit Defense Center</Link>
        </footer>
      </div>
    </div>
  );
}

function Header({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[12px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.text }}>區塊 {n}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function KV({ k, v, color, bold, mono }: { k: string; v: string; color?: string; bold?: boolean; mono?: boolean }) {
  return (
    <div>
      <MiniLabel>{k}</MiniLabel>
      <div className={`text-base mt-0.5 ${bold ? "font-bold" : "font-semibold"} ${mono ? "font-mono" : ""}`} style={{ color: color ?? SC.text }}>{v}</div>
    </div>
  );
}
