import Link from "next/link";
import { commodities, priceZone } from "@/lib/erp/commodities";
import { SC, Card, MiniLabel, FONT } from "@/components/erp/stitch-ui";

export const revalidate = 60;
export const metadata = { title: "L5 Market Intelligence · 全球市場情報中心" };

export default function L5MarketPage() {
  return (
    <div style={{ background: SC.pageBg, minHeight: "100vh", fontFamily: FONT, color: SC.text }}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 space-y-6">

        <header>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: SC.blue, letterSpacing: "0.12em" }}>L5 Market Intelligence</div>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-1">全球市場情報中心</h1>
          <p className="text-sm mt-1" style={{ color: SC.textSub }}>10 區塊 · 全方位市場 + AI Copilot + Why 解釋</p>
        </header>

        {/* 區塊 1 — Commodity Dashboard */}
        <Card accent={SC.primary}>
          <Header n="1" title="Commodity Dashboard · 原物料儀表" />
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
          {/* 區塊 2 — Profit Impact Center */}
          <Card accent={SC.red}>
            <Header n="2" title="Profit Impact Center · 成本衝擊排行" />
            <ul className="space-y-2 mt-2">
              {[
                { rank: 1, item: "銅",      impact: "-280 萬", note: "Cu LME +5.6%" },
                { rank: 2, item: "鋼",      impact: "-120 萬", note: "HRC ↑ 3.2%" },
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

        {/* 區塊 7 / 8 / 9 並排 */}
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
      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: SC.text }}>區塊 {n}</span>
      <h2 className="text-base font-semibold">{title}</h2>
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
