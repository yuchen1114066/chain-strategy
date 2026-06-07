"use client";

import { useState } from "react";

type Pkg = {
  key: string;
  title: string;
  desc: string;
  api: string;
  filename: string;
  sizeHint: string;
  contents: string[];
};

const PACKAGES: Pkg[] = [
  {
    key: "wms",
    title: "WMS 智慧倉儲模組",
    desc: "Dashboard + 7 步收貨 Checklist + SPC/SPEC 軸心管制圖",
    api: "/api/admin/downloads/wms-standalone",
    filename: "wms-standalone.zip",
    sizeHint: "~ 66 KB",
    contents: [
      "/wms — 戰情 Dashboard（庫存 KPI / 工單進度 / 倉區熱力圖）",
      "/wms/receiving — 進貨待檢清單（ASN 匹配 + PO list）",
      "/wms/receiving/[poId] — 7 步品檢（Scan → 外觀 → 重量 → 開箱 → 數量 → IQC → 判定）",
      "/wms/spc-shaft — SPC 管制圖 + 20 項 SPEC（軸心件 P03SG007-0）",
      "lib/erp/ — warehouse / receiving-checklist / seed / alerts / inventory-health / supplier-portal / shaft-spc / types",
    ],
  },
  {
    key: "quotation",
    title: "AI Quotation Analyzer 模組",
    desc: "報價單上傳 → 4-step pipeline 分析 → L0/L1/Full PDF 報告",
    api: "/api/admin/downloads/quotation-analyzer-standalone",
    filename: "quotation-analyzer-standalone.zip",
    sizeHint: "~ 61 KB",
    contents: [
      "IntakeModal 上傳入口（PDF / JPG / Excel）",
      "STEP 1–4：OCR → BOM 比對 → Commodity → Should-Cost",
      "ENHANCE 1–4：Supplier History / Alternative / Negotiation Copilot / AI Confidence",
      "L0 Board Card v5（鎖版 + 動態文字）· L1 Executive 3p · Full 11-section PDF",
    ],
  },
];

export default function AdminDownloadsClient() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function handleDownload(pkg: Pkg) {
    const tk = token.trim();
    if (!tk) {
      setMsg({ tone: "err", text: "請先在上方輸入 ADMIN_DOWNLOAD_TOKEN" });
      return;
    }
    setBusy(pkg.key);
    setMsg(null);
    try {
      const res = await fetch(pkg.api, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (res.status === 401) {
        setMsg({ tone: "err", text: `❌ Token 驗證失敗 — 非管理員不可下載「${pkg.title}」` });
        return;
      }
      if (!res.ok) {
        setMsg({ tone: "err", text: `❌ 下載失敗（HTTP ${res.status}）` });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pkg.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({ tone: "ok", text: `✓ 已下載：${pkg.filename}` });
    } catch (err) {
      setMsg({
        tone: "err",
        text: `❌ 下載發生錯誤：${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Token 輸入 */}
      <section className="rounded-xl border bg-white p-4">
        <label className="block">
          <div className="text-xs font-bold text-slate-600 mb-2">
            ADMIN_DOWNLOAD_TOKEN（管理員專屬，未設定 token 一律拒絕）
          </div>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="輸入由系統管理員發給你的下載 token"
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
            style={{ borderColor: "#d4d8d0" }}
          />
        </label>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Token 不會被儲存到任何地方，僅在當前頁面用 fetch 帶到 API。
          重整頁面 → 需重新輸入。
        </p>
      </section>

      {/* 訊息 */}
      {msg && (
        <div
          className="rounded-lg p-3 text-sm font-bold"
          style={
            msg.tone === "ok"
              ? { background: "#f0f7e4", color: "#0c1908", border: "1px solid #dcebc4" }
              : { background: "#fdecea", color: "#b71c1c", border: "1px solid #f5c2c0" }
          }
        >
          {msg.text}
        </div>
      )}

      {/* 套件列表 */}
      <section className="grid gap-4">
        {PACKAGES.map((pkg) => (
          <div key={pkg.key} className="rounded-xl border bg-white p-5">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-900">📦 {pkg.title}</h2>
              <span className="text-xs font-mono text-slate-500">{pkg.sizeHint}</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{pkg.desc}</p>
            <ul className="mt-3 text-[12px] text-slate-700 space-y-1 leading-relaxed list-disc pl-5">
              {pkg.contents.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDownload(pkg)}
                disabled={busy !== null}
                className="px-4 py-2 rounded-lg text-white font-bold text-sm shadow disabled:opacity-50"
                style={{ background: busy === pkg.key ? "#9ca3af" : "#4d7c0f" }}
              >
                {busy === pkg.key ? "下載中…" : `⬇ 下載 ${pkg.filename}`}
              </button>
              <code className="text-[11px] text-slate-500 font-mono">{pkg.api}</code>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-slate-50/60 p-4 text-xs text-slate-600 leading-relaxed">
        <b>找不到檔案怎麼辦？</b>
        <ul className="mt-1 list-disc pl-5 space-y-1">
          <li>1. 確認 `.env.local` 已設定 <code>ADMIN_DOWNLOAD_TOKEN=...</code>，並重啟 dev server</li>
          <li>2. 把同樣 token 貼進上方輸入框，再點下載</li>
          <li>3. ZIP 檔實際存放在 repo 根目錄的 <code>private/downloads/</code> — 不在 <code>public/</code>，所以瀏覽器直連 URL 拿不到，必須走這頁的 API</li>
          <li>4. 若 token 沒設、API 預設回 401 — 這是刻意的，避免 dev 環境誤開放</li>
        </ul>
      </section>
    </div>
  );
}
