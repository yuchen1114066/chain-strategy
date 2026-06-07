"use client";

import { useState, useEffect, useCallback } from "react";

const SK = "wc_shop_stats", PK = "wc_shop_prods", OK = "wc_shop_orders", CK = "wc_admin_cfg";

interface Prod { id: number; name: string; cat: string; tagline: string; desc: string; spec: string; price: number; orig: number | null; badge: string | null; status: "on" | "off"; consts: string[]; img: string; clicks: number }
interface Order { id: string; name: string; price: number; time: number }
type Stats = Record<string, number | Record<string, { pageviews: number }>>;

const DEF_PRODS: Prod[] = [
  { id: 1, name: "頂級台灣花旗參片", cat: "補氣滋補", tagline: "高山花旗參・補氣養陰", desc: "嚴選台灣高山花旗參，補氣養陰、生津止渴，適合氣虛、陰虛體質日常保健。", spec: "50g/盒 · 每日3–5片沖泡", price: 1280, orig: 1580, badge: "熱銷", status: "on", consts: ["氣虛質", "陰虛質", "平和質"], img: "", clicks: 12 },
  { id: 2, name: "四物湯藥膳包", cat: "女性養生", tagline: "傳統四物湯・養血調經", desc: "傳統四物湯配方，養血活血、調經止痛，適合女性日常保養。", spec: "6包/盒 · 每包煮1–2人份", price: 320, orig: null, badge: "女性首選", status: "on", consts: ["血虛質", "氣鬱質"], img: "", clicks: 8 },
  { id: 3, name: "黃芪黨參養生茶包", cat: "補氣滋補", tagline: "補氣固表・日常保健", desc: "精選黃芪、黨參、紅棗、枸杞等補氣食材，方便沖泡，日常補氣首選。每盒30包。", spec: "30包/盒 · 每日1–2包", price: 480, orig: 580, badge: "特價", status: "on", consts: ["氣虛質", "陽虛質"], img: "", clicks: 15 },
  { id: 4, name: "銀耳燕窩美顏飲", cat: "美容養顏", tagline: "銀耳燕窩・滋陰潤膚", desc: "融合銀耳、燕窩精華、枸杞，富含植物膠質，滋陰潤膚。", spec: "10包/盒 · 每包沖泡250ml", price: 890, orig: null, badge: "新品", status: "on", consts: ["陰虛質", "血虛質"], img: "", clicks: 5 },
  { id: 5, name: "薏仁茯苓祛濕包", cat: "祛濕保健", tagline: "薏仁茯苓・排濕輕盈", desc: "精選薏仁、茯苓、陳皮等祛濕食材，幫助排除體內多餘濕氣。", spec: "每袋50g · 建議煮水500ml", price: 380, orig: null, badge: null, status: "on", consts: ["痰濕質", "濕熱質"], img: "", clicks: 7 },
  { id: 6, name: "玫瑰疏肝理氣茶", cat: "情緒養生", tagline: "玫瑰合歡・舒緩情緒", desc: "以玫瑰花、合歡花、佛手柑為主要成分，疏肝理氣、舒緩情緒。", spec: "20包/盒 · 建議下午3–5點飲用", price: 350, orig: null, badge: "暢銷", status: "on", consts: ["氣鬱質"], img: "", clicks: 9 },
  { id: 7, name: "三七粉（雲南文山）", cat: "活血保健", tagline: "雲南文山・活血化瘀", desc: "雲南文山三七原產地採購，散瘀止血、消腫定痛，是活血化瘀的重要中藥材。", spec: "50g/罐 · 每次3g，一日2次", price: 980, orig: 1200, badge: "中醫推薦", status: "on", consts: ["血瘀質", "氣鬱質"], img: "", clicks: 6 },
  { id: 8, name: "有機枸杞（寧夏特級）", cat: "滋補食材", tagline: "寧夏原產・護眼明目", desc: "寧夏原產地特級枸杞，顆粒飽滿，色澤紅潤，富含枸杞多糖，護眼明目效果佳。", spec: "100g/袋 · 每日10–20粒", price: 420, orig: null, badge: null, status: "on", consts: ["陰虛質", "氣虛質"], img: "", clicks: 11 },
];

function getP(): Prod[] { try { const d = JSON.parse(localStorage.getItem(PK) || "null"); return d || DEF_PRODS; } catch { return DEF_PRODS; } }
function getO(): Order[] { try { return JSON.parse(localStorage.getItem(OK) || "[]"); } catch { return []; } }
function getS(): Stats { try { return JSON.parse(localStorage.getItem(SK) || "{}"); } catch { return {}; } }
function getCfg(): { user?: string; pass?: string } { try { return JSON.parse(localStorage.getItem(CK) || "{}"); } catch { return {}; } }
function saveP(d: Prod[]) { localStorage.setItem(PK, JSON.stringify(d)); }
function saveO(d: Order[]) { localStorage.setItem(OK, JSON.stringify(d)); }

type Panel = "dashboard" | "products" | "orders" | "analytics" | "settings";

const PANEL_META: Record<Panel, [string, string]> = {
  dashboard: ["數據儀表板", "商城整體表現概覽"],
  products: ["商品管理", "新增・編輯・下架商品"],
  orders: ["訂單管理", "查看所有訂單紀錄"],
  analytics: ["流量分析", "用戶行為與頁面數據"],
  settings: ["系統設定", "帳號與後台設定"],
};

const CATS = ["補氣滋補", "女性養生", "美容養顏", "祛濕保健", "情緒養生", "滋補食材", "活血保健", "抗炎保健", "季節禮盒", "訂閱服務"];

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [panel, setPanel] = useState<Panel>("dashboard");
  const [prods, setProds] = useState<Prod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [toast, setToast] = useState("");
  const [loginUser, setLoginUser] = useState("admin");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState(false);
  const [adminUser, setAdminUser] = useState("admin");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fName, setFName] = useState(""); const [fCat, setFCat] = useState(CATS[0]);
  const [fTagline, setFTagline] = useState(""); const [fDesc, setFDesc] = useState("");
  const [fSpec, setFSpec] = useState(""); const [fPrice, setFPrice] = useState("");
  const [fOrig, setFOrig] = useState(""); const [fBadge, setFBadge] = useState("");
  const [fStatus, setFStatus] = useState<"on" | "off">("on"); const [fConsts, setFConsts] = useState<string[]>([]);
  const [fConstInp, setFConstInp] = useState("");
  const [cfgUser, setCfgUser] = useState(""); const [cfgPass, setCfgPass] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(""), 2500);
  }, []);

  function doLogin() {
    const cfg = getCfg();
    const vu = cfg.user || "admin", vp = cfg.pass || "warmcare2026";
    if (loginUser === vu && loginPass === vp) {
      setLoggedIn(true); setAdminUser(loginUser); setLoginErr(false);
      const p = getP(); const o = getO(); const s = getS();
      setProds(p); setOrders(o); setStats(s);
    } else { setLoginErr(true); }
  }

  function doLogout() { setLoggedIn(false); setLoginPass(""); setLoginErr(false); }

  function openModal(id?: number) {
    if (id != null) {
      const p = prods.find(x => x.id === id); if (!p) return;
      setFName(p.name); setFCat(p.cat); setFTagline(p.tagline); setFDesc(p.desc);
      setFSpec(p.spec); setFPrice(String(p.price)); setFOrig(p.orig ? String(p.orig) : "");
      setFBadge(p.badge || ""); setFStatus(p.status); setFConsts([...p.consts]);
      setEditId(id);
    } else {
      setFName(""); setFCat(CATS[0]); setFTagline(""); setFDesc("");
      setFSpec(""); setFPrice(""); setFOrig(""); setFBadge(""); setFStatus("on"); setFConsts([]);
      setEditId(null);
    }
    setFConstInp(""); setShowModal(true);
  }

  function saveProd() {
    if (!fName.trim()) { alert("請輸入商品名稱"); return; }
    const price = parseInt(fPrice); if (!price || isNaN(price)) { alert("請輸入正確售價"); return; }
    const prod: Prod = {
      id: editId ?? Date.now(), name: fName.trim(), cat: fCat,
      tagline: fTagline, desc: fDesc, spec: fSpec, price,
      orig: parseInt(fOrig) || null, badge: fBadge || null,
      status: fStatus, consts: fConsts, img: "", clicks: 0,
    };
    const ps = [...prods];
    if (editId != null) { const i = ps.findIndex(x => x.id === editId); if (i >= 0) { prod.clicks = ps[i].clicks; ps[i] = prod; } }
    else { ps.push(prod); }
    saveP(ps); setProds(ps); setShowModal(false);
    showToast(editId != null ? "商品已更新" : "商品已新增");
  }

  function delProd(id: number) {
    if (!confirm("確定刪除此商品？")) return;
    const ps = prods.filter(p => p.id !== id); saveP(ps); setProds(ps); showToast("商品已刪除");
  }

  function toggleStatus(id: number) {
    const ps = prods.map(p => p.id === id ? { ...p, status: p.status === "on" ? "off" as const : "on" as const } : p);
    saveP(ps); setProds(ps);
    const p = ps.find(x => x.id === id);
    showToast(`已${p?.status === "on" ? "上架" : "下架"}`);
  }

  function saveSettings() {
    const cfg = getCfg();
    if (cfgUser.trim()) cfg.user = cfgUser.trim();
    if (cfgPass) cfg.pass = cfgPass;
    localStorage.setItem(CK, JSON.stringify(cfg)); showToast("設定已儲存");
  }

  function clearStats() {
    if (!confirm("確定清除所有追蹤數據？")) return;
    localStorage.removeItem(SK); setStats({}); showToast("數據已清除");
  }

  function resetAll() {
    if (!confirm("確定重置所有數據？此操作無法復原。")) return;
    localStorage.removeItem(SK); localStorage.removeItem(OK);
    saveP(DEF_PRODS); setProds(DEF_PRODS); setOrders([]); setStats({}); showToast("已重置");
  }

  function exportCSV() {
    let csv = "商品名稱,分類,售價,加購次數,狀態\n";
    prods.forEach(p => csv += `"${p.name}","${p.cat}",${p.price},${p.clicks},${p.status === "on" ? "上架" : "下架"}\n`);
    csv += "\n訂單編號,商品名稱,金額,時間\n";
    orders.forEach(o => csv += `${o.id},"${o.name}",${o.price},${new Date(o.time).toLocaleString("zh-TW")}\n`);
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
    a.download = `warmcare_data_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    showToast("CSV 已匯出");
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const os = getO(); os.push({ id: "WC" + Date.now(), name: d.name || "商品", price: d.price || 0, time: Date.now() });
      saveO(os); setOrders(os);
    };
    window.addEventListener("wc_cart_add", handler);
    return () => window.removeEventListener("wc_cart_add", handler);
  }, []);

  // Computed stats
  const views = (stats.pageviews as number) || 0;
  const sessions = (stats.sessions as number) || 0;
  const avgTime = sessions > 0 ? Math.round(((stats.total_time as number) || 0) / sessions) : 0;
  let clicks = 0;
  Object.keys(stats).forEach(k => { if (k.startsWith("click_")) clicks += (stats[k] as number) || 0; });
  const rev = orders.reduce((a, o) => a + o.price, 0);
  const byClick = [...prods].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  const maxC = Math.max(1, ...byClick.map(p => p.clicks));
  const hotProds = [...prods].sort((a, b) => b.clicks - a.clicks);

  const daily = (stats.daily || {}) as Record<string, { pageviews: number }>;
  const days: { label: string; key: string }[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, key: d.toISOString().slice(0, 10) }); }
  const vals = days.map(d => daily[d.key]?.pageviews || 0);
  const maxV = Math.max(1, ...vals);

  const s = {
    wrap: { display: "flex", minHeight: "calc(100vh - 60px)", fontFamily: "system-ui,sans-serif", fontSize: 14 } as React.CSSProperties,
    sidebar: { width: 180, flexShrink: 0, borderRight: "1px solid #e8e8e8", background: "#fafafa", display: "flex", flexDirection: "column" as const },
    sbBrand: { padding: "14px 16px", borderBottom: "1px solid #e8e8e8" },
    sbNav: { flex: 1, padding: "8px 0" },
    sbItem: (active: boolean) => ({ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, color: active ? "#111" : "#666", cursor: "pointer", background: active ? "#fff" : "transparent", borderLeft: `2px solid ${active ? "#111" : "transparent"}`, border: "none", width: "100%", textAlign: "left" as const }),
    sbSec: { fontSize: 10, letterSpacing: ".12em", color: "#aaa", padding: "12px 16px 4px", textTransform: "uppercase" as const },
    main: { flex: 1, background: "#f5f5f5", overflow: "auto" },
    topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e8e8e8" },
    panel: { padding: "16px 20px" },
    mc: { background: "#fff", borderRadius: 8, padding: 12, border: "1px solid #e8e8e8" },
    card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, marginBottom: 12, overflow: "hidden" as const },
    cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e8e8e8", fontSize: 13, fontWeight: 500 },
    th: { textAlign: "left" as const, padding: "8px 16px", fontSize: 11, fontWeight: 500, color: "#666", letterSpacing: ".06em", borderBottom: "1px solid #e8e8e8", background: "#fafafa" },
    td: { padding: "10px 16px", borderBottom: "1px solid #f0f0f0", color: "#111", verticalAlign: "middle" as const },
    btnSm: (fill?: boolean, danger?: boolean) => ({ padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: fill ? "none" : "1px solid #ddd", background: fill ? "#111" : danger ? "transparent" : "transparent", color: fill ? "#fff" : danger ? "#dc2626" : "#555", display: "flex", alignItems: "center", gap: 4 } as React.CSSProperties),
    badge: (type: "g" | "a" | "r") => ({ fontSize: 10, padding: "2px 7px", borderRadius: 999, fontWeight: 500, background: type === "g" ? "#dcfce7" : type === "a" ? "#fef3c7" : "#fee2e2", color: type === "g" ? "#16a34a" : type === "a" ? "#d97706" : "#dc2626" } as React.CSSProperties),
    iconBtn: (danger?: boolean) => ({ width: 28, height: 28, border: "1px solid #e0e0e0", borderRadius: 6, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: danger ? "#dc2626" : "#666" } as React.CSSProperties),
    field: { marginBottom: "0.75rem" } as React.CSSProperties,
    label: { display: "block", fontSize: 12, color: "#555", marginBottom: 4, fontWeight: 500 } as React.CSSProperties,
    inp: { width: "100%", padding: "7px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", color: "#111" } as React.CSSProperties,
  };

  if (!loggedIn) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 120px)", padding: "2rem", background: "#f5f5f5" }}>
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 360 }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>WarmCare 後台管理</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: "1.5rem" }}>養生商城 · 商品與數據管理</div>
          <div style={s.field}><label style={s.label}>管理員帳號</label>
            <input style={s.inp} value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="admin" /></div>
          <div style={s.field}><label style={s.label}>密碼</label>
            <input style={s.inp} type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()} placeholder="warmcare2026" /></div>
          <button onClick={doLogin} style={{ width: "100%", padding: 9, background: "#111", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>登入後台</button>
          {loginErr && <p style={{ fontSize: 12, color: "#dc2626", textAlign: "center", marginTop: 8 }}>帳號或密碼錯誤</p>}
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 12 }}>預設：admin / warmcare2026</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sbBrand}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>WarmCare 後台</div>
          <div style={{ fontSize: 11, color: "#888" }}>養生商城管理</div>
        </div>
        <div style={s.sbNav}>
          {(["dashboard", "products", "orders", "analytics", "settings"] as Panel[]).map((id, i) => {
            const labels = ["📊 數據儀表板", "📦 商品管理", "🧾 訂單管理", "📈 流量分析", "⚙️ 系統設定"];
            const secs = [true, false, false, false, false];
            return (
              <div key={id}>
                {secs[i] && <div style={s.sbSec}>總覽</div>}
                {i === 1 && <div style={s.sbSec}>內容管理</div>}
                {i === 4 && <div style={s.sbSec}>系統</div>}
                <button style={s.sbItem(panel === id)} onClick={() => setPanel(id)}>{labels[i]}</button>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e8e8e8" }}>
          <div style={{ fontSize: 11, color: "#888" }}>{adminUser}</div>
          <button onClick={doLogout} style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>登出</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{PANEL_META[panel][0]}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{PANEL_META[panel][1]}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {panel === "dashboard" && <>
              <button style={s.btnSm()} onClick={exportCSV}>⬇ 匯出 CSV</button>
              <button style={s.btnSm()} onClick={() => { setStats(getS()); showToast("數據已更新"); }}>↻ 重整</button>
            </>}
            {panel === "products" && <button style={s.btnSm(true)} onClick={() => openModal()}>＋ 新增商品</button>}
          </div>
        </div>

        <div style={s.panel}>
          {/* DASHBOARD */}
          {panel === "dashboard" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
              {[["總瀏覽次數", views.toLocaleString(), "pageviews"], ["商品加購次數", clicks.toLocaleString(), "add to cart"], ["平均停留時間", `${avgTime}s`, "每次瀏覽"], ["訂單總金額", `NT$${rev.toLocaleString()}`, `${orders.length} 筆訂單`]].map(([l, v, sub]) => (
                <div key={l} style={s.mc}><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{l}</div><div style={{ fontSize: 22, fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{sub}</div></div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={s.card}>
                <div style={s.cardHead}><span>商品點擊排行</span></div>
                <div style={{ padding: "12px 16px" }}>
                  {byClick.map(p => (
                    <div key={p.id} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginBottom: 3 }}><span>{p.name.slice(0, 12)}</span><span>{p.clicks}</span></div>
                      <div style={{ height: 6, background: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 999, background: "#111", width: `${Math.round(p.clicks / maxC * 100)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.card}>
                <div style={s.cardHead}><span>近期訂單</span></div>
                <div style={{ padding: "0 16px 8px" }}>
                  {orders.length === 0 ? <div style={{ textAlign: "center", padding: "2rem", color: "#aaa", fontSize: 13 }}>尚無訂單</div> :
                    orders.slice(-4).reverse().map(o => (
                      <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 12 }}>
                        <span style={{ color: "#111" }}>{o.name.slice(0, 12)}</span><span style={{ color: "#888" }}>NT${o.price.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div style={s.card}>
              <div style={s.cardHead}><span>熱門商品（依加入購物車次數）</span></div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["商品名稱", "分類", "售價", "加購次數", "狀態"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{hotProds.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...s.td, fontWeight: 500 }}>{p.name}</td>
                    <td style={{ ...s.td, color: "#888" }}>{p.cat}</td>
                    <td style={s.td}>NT${p.price.toLocaleString()}</td>
                    <td style={s.td}>{p.clicks} 次</td>
                    <td style={s.td}><span style={s.badge(p.status === "on" ? "g" : "r")}>{p.status === "on" ? "上架中" : "已下架"}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>}

          {/* PRODUCTS */}
          {panel === "products" && (
            <div style={s.card}>
              <div style={s.cardHead}><span>商品列表（共 {prods.length} 件）</span></div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["", "商品名稱", "分類", "體質標籤", "售價", "狀態", "操作"].map((h, i) => <th key={i} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{prods.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...s.td, width: 44 }}><div style={{ width: 36, height: 36, borderRadius: 6, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌿</div></td>
                    <td style={{ ...s.td, fontWeight: 500 }}>{p.name}{p.badge && <span style={{ ...s.badge("a"), marginLeft: 6 }}>{p.badge}</span>}</td>
                    <td style={{ ...s.td, color: "#888" }}>{p.cat}</td>
                    <td style={{ ...s.td, fontSize: 11, color: "#888" }}>{p.consts.join(" · ") || "—"}</td>
                    <td style={s.td}>NT${p.price.toLocaleString()}{p.orig && <span style={{ fontSize: 11, color: "#aaa", textDecoration: "line-through", marginLeft: 4 }}>NT${p.orig.toLocaleString()}</span>}</td>
                    <td style={s.td}><span style={s.badge(p.status === "on" ? "g" : "r")}>{p.status === "on" ? "上架中" : "已下架"}</span></td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={s.iconBtn()} title="編輯" onClick={() => openModal(p.id)}>✏️</button>
                        <button style={s.iconBtn()} title="上架/下架" onClick={() => toggleStatus(p.id)}>🔄</button>
                        <button style={s.iconBtn(true)} title="刪除" onClick={() => delProd(p.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* ORDERS */}
          {panel === "orders" && (
            <div style={s.card}>
              <div style={s.cardHead}><span>訂單列表</span><span style={{ fontSize: 12, color: "#888" }}>共 {orders.length} 筆</span></div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["訂單編號", "商品", "金額", "時間", "狀態"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{orders.length === 0 ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>尚無訂單紀錄</td></tr> :
                  [...orders].reverse().map(o => (
                    <tr key={o.id}>
                      <td style={{ ...s.td, fontSize: 11, color: "#888" }}>{o.id}</td>
                      <td style={{ ...s.td, fontWeight: 500 }}>{o.name}</td>
                      <td style={s.td}>NT${o.price.toLocaleString()}</td>
                      <td style={{ ...s.td, fontSize: 11, color: "#888" }}>{new Date(o.time).toLocaleString("zh-TW")}</td>
                      <td style={s.td}><span style={s.badge("g")}>已確認</span></td>
                    </tr>
                  ))}</tbody>
              </table>
            </div>
          )}

          {/* ANALYTICS */}
          {panel === "analytics" && <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
              {[["總瀏覽次數", views.toLocaleString()], ["總 Sessions", sessions.toLocaleString()], ["平均停留", `${avgTime}s`], ["互動次數", clicks.toLocaleString()]].map(([l, v]) => (
                <div key={l} style={s.mc}><div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{l}</div><div style={{ fontSize: 22, fontWeight: 500 }}>{v}</div></div>
              ))}
            </div>
            <div style={s.card}>
              <div style={s.cardHead}><span>每日瀏覽趨勢（近 7 天）</span></div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
                  {vals.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", background: "#111", borderRadius: "3px 3px 0 0", height: Math.max(4, Math.round(v / maxV * 80)), opacity: i === 6 ? 1 : 0.4 }} />
                      <div style={{ fontSize: 10, color: "#aaa" }}>{days[i].label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ ...s.card, marginTop: 12 }}>
              <div style={s.cardHead}>
                <span>所有追蹤事件</span>
                <button style={s.btnSm(false, true)} onClick={clearStats}>🗑 清除數據</button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>{["事件名稱", "類型", "次數"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {Object.entries(stats).filter(([k]) => !["daily", "total_time", "sessions"].includes(k) && typeof stats[k] === "number").length === 0
                    ? <tr><td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>尚無追蹤數據</td></tr>
                    : Object.entries(stats).filter(([k]) => !["daily", "total_time", "sessions"].includes(k) && typeof stats[k] === "number").sort((a, b) => (b[1] as number) - (a[1] as number)).map(([k, v]) => {
                      const type = k === "pageviews" ? "瀏覽" : k.startsWith("click_") ? "互動" : "其他";
                      return <tr key={k}><td style={{ ...s.td, fontSize: 12 }}>{k}</td><td style={s.td}><span style={s.badge(type === "瀏覽" ? "g" : "a")}>{type}</span></td><td style={{ ...s.td, fontWeight: 500 }}>{(v as number).toLocaleString()}</td></tr>;
                    })}
                </tbody>
              </table>
            </div>
          </>}

          {/* SETTINGS */}
          {panel === "settings" && <>
            <div style={s.card}>
              <div style={s.cardHead}><span>帳號設定</span></div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
                <div style={s.field}><label style={s.label}>管理員帳號</label><input style={s.inp} value={cfgUser} onChange={e => setCfgUser(e.target.value)} placeholder="admin" /></div>
                <div style={s.field}><label style={s.label}>新密碼（留空不修改）</label><input style={s.inp} type="password" value={cfgPass} onChange={e => setCfgPass(e.target.value)} placeholder="輸入新密碼" /></div>
                <button style={{ ...s.btnSm(true), width: "fit-content" }} onClick={saveSettings}>儲存設定</button>
              </div>
            </div>
            <div style={{ ...s.card, marginTop: 12 }}>
              <div style={s.cardHead}><span>商城快速連結</span></div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#888" }}>
                <div>前台商城：<a href="/shop" style={{ color: "#2563eb" }}>/shop</a></div>
                <div>首頁：<a href="/" style={{ color: "#2563eb" }}>/</a></div>
              </div>
            </div>
            <div style={{ ...s.card, marginTop: 12 }}>
              <div style={s.cardHead}><span>數據管理</span></div>
              <div style={{ padding: 16, display: "flex", gap: 8 }}>
                <button style={s.btnSm()} onClick={exportCSV}>⬇ 匯出全部數據 CSV</button>
                <button style={s.btnSm(false, true)} onClick={resetAll}>🗑 重置所有數據</button>
              </div>
            </div>
          </>}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e8e8e8" }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{editId != null ? "編輯商品" : "新增商品"}</span>
              <button onClick={() => setShowModal(false)} style={{ ...s.iconBtn(), fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div style={s.field}><label style={s.label}>商品名稱 *</label><input style={s.inp} value={fName} onChange={e => setFName(e.target.value)} placeholder="例：黃芪黨參養生茶包" /></div>
                <div style={s.field}><label style={s.label}>分類 *</label>
                  <select style={s.inp} value={fCat} onChange={e => setFCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div style={{ marginBottom: 10 }}><label style={s.label}>商品副標</label><input style={s.inp} value={fTagline} onChange={e => setFTagline(e.target.value)} placeholder="例：補氣固表・日常保健" /></div>
              <div style={{ marginBottom: 10 }}><label style={s.label}>商品說明</label><textarea style={{ ...s.inp, resize: "vertical", minHeight: 70 }} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="商品功效與特色說明..." /></div>
              <div style={{ marginBottom: 10 }}><label style={s.label}>規格說明</label><input style={s.inp} value={fSpec} onChange={e => setFSpec(e.target.value)} placeholder="例：每盒30包 · 建議每日1–2包" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={s.label}>售價 (NT$) *</label><input style={s.inp} type="number" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="480" /></div>
                <div><label style={s.label}>原價（留空不顯示）</label><input style={s.inp} type="number" value={fOrig} onChange={e => setFOrig(e.target.value)} placeholder="580" /></div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={s.label}>適合體質（輸入後按 Enter）</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "5px 8px", border: "1px solid #ddd", borderRadius: 6, minHeight: 36, alignItems: "center" }}>
                  {fConsts.map(t => (
                    <span key={t} style={{ fontSize: 11, padding: "2px 6px", background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 999, display: "flex", alignItems: "center", gap: 3 }}>
                      {t} <button onClick={() => setFConsts(fConsts.filter(x => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#888", padding: 0 }}>×</button>
                    </span>
                  ))}
                  <input value={fConstInp} onChange={e => setFConstInp(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && fConstInp.trim() && !fConsts.includes(fConstInp.trim())) { setFConsts([...fConsts, fConstInp.trim()]); setFConstInp(""); } }}
                    style={{ border: "none", outline: "none", fontSize: 12, background: "transparent", minWidth: 80 }} placeholder="輸入體質後按 Enter" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={s.label}>狀態</label>
                  <select style={s.inp} value={fStatus} onChange={e => setFStatus(e.target.value as "on" | "off")}>
                    <option value="on">上架中</option><option value="off">已下架</option>
                  </select></div>
                <div><label style={s.label}>標籤（熱銷/新品/特價）</label><input style={s.inp} value={fBadge} onChange={e => setFBadge(e.target.value)} placeholder="熱銷" /></div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: "1px solid #e8e8e8" }}>
              <button style={s.btnSm()} onClick={() => setShowModal(false)}>取消</button>
              <button style={s.btnSm(true)} onClick={saveProd}>儲存商品</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", background: "#111", color: "#fff", padding: "8px 14px", borderRadius: 6, fontSize: 13, zIndex: 9999, opacity: toast ? 1 : 0, transition: "opacity .2s", pointerEvents: "none" }}>
        {toast}
      </div>
    </div>
  );
}
