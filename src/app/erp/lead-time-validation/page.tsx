"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  findItemByPartNo,
  findBomByParent,
  findPurchasesByPart,
  loadMeta,
  type ItemMaster,
  type BomEntry,
  type PurchaseRecord,
  type MasterDataMeta,
} from "@/lib/erp/master-data-store";

// ============================================================
// L2 OPERATIONS · AI Cross-Department Inbox（前身：Lead Time Validation）
//
// 業務 / 生管 / 採購 / 客服收到客戶或同事的詢問訊息（任何主題：成本、交期、
// 替代料、庫存、規格⋯⋯）→ 貼進來或附上截圖 → AI 自動：
//   1. 解析訊息（料號、數量、急件度、問什麼）
//   2. 跨主檔串接（料件 + BOM + 採購）→ 拼出真實答案
//   3. 寫出可直接複製的繁中 reply email 草稿
//
// URL 保留 /erp/lead-time-validation（Sidebar 還連著），但功能已超出交期。
// ============================================================

const BR = {
  green: "#76b900", greenDeep: "#4d7c0f", greenInk: "#0c1908",
  greenSoft: "#f0f7e4", greenLine: "#dcebc4",
  ink: "#0c1208", inkSoft: "#5b6356", inkFaint: "#9aa291",
  page: "#fbfcfa", card: "#ffffff",
  border: "#e9ece3", borderHi: "#dadfd0",
  red: "#d4351c", redSoft: "#fdecea",
  amber: "#b8860b", amberSoft: "#fffaf0",
  purple: "#c026d3", blue: "#3a6ea5",
} as const;
const FONT = "'Noto Sans TC', 'Sora', system-ui, sans-serif";
const FONT_HEAD = "'Sora', 'Noto Sans TC', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

// 鼎新 / 祺驊料號常見格式（從 FB61H003 / P21FX05 / M06CA02 / S42K001 推出來）
// 嚴格一點不抓到一般英文字
const PART_NO_REGEX = /\b[A-Z]{1,2}\d{2,}[A-Z0-9-]{2,}\b/g;

// 範例問題（給使用者一鍵填入）
const EXAMPLES: Array<{ label: string; text: string }> = [
  {
    label: "業務問成本+交期（急件）",
    text: "Hi 採購，再請提供 FB11K003 成本評估與交期 ~ 客人在線等! Qty: 60 pcs. 謝謝。",
  },
  {
    label: "生管問替代料",
    text: "Hi 採購，FB61H003 的子料 P21FX05 鋼絲現在供應緊張，有沒有替代供應商可以提案？",
  },
  {
    label: "客戶問交期合不合理",
    text: "Dear 採購，廠商說 SEP6C727 要 10 週交貨，請評估是否合理？有無加速空間？",
  },
];

// AI 回覆的型別（對應 API schema）
type Findings = {
  costPerUnit?: number | null;
  costTotal?: number | null;
  costCurrency?: string | null;
  costConfidence?: string | null;
  costRationale?: string | null;
  leadTimeDays?: number | null;
  leadTimeRationale?: string | null;
  leadTimeBottleneck?: string | null;
  breakdown?: Array<{
    partNo?: string; name?: string | null; qty?: number | null;
    unit?: string | null; unitPrice?: number | null; subtotal?: number | null;
    source?: string | null;
  }>;
  otherNotes?: string[];
};

type AiAnswer = {
  parsedQuestion: {
    summary: string;
    askedBy?: string | null;
    partNos: string[];
    qty?: number | null;
    asks: string[];
    urgency?: string | null;
    attachmentSummary?: string | null;
  };
  findings: Findings;
  replyDraft: string;
  confidence: string;
  dataUsed: string[];
  warnings: string[];
};

export default function CrossDeptInboxPage() {
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "thinking"; stage: string }
    | { kind: "answered"; answer: AiAnswer; usedContext: ContextPack }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [meta, setMeta] = useState<MasterDataMeta>({ itemCount: 0, bomCount: 0, purchaseCount: 0 });

  useEffect(() => {
    loadMeta().then(setMeta);
  }, []);

  // 從文字裡抽料號候選
  const detectedPartNos = useMemo(() => {
    const m = question.match(PART_NO_REGEX);
    if (!m) return [];
    return Array.from(new Set(m));
  }, [question]);

  const onAsk = async () => {
    if (!question.trim() && !file) {
      setState({ kind: "error", message: "請輸入問題文字或上傳附件" });
      return;
    }

    try {
      // 階段 1：從本機 IndexedDB 撈相關資料（給 Gemini 當 context）
      setState({ kind: "thinking", stage: "從 ERP 主檔（IndexedDB）撈相關資料…" });
      const context = await gatherContext(detectedPartNos);

      // 階段 2：呼 AI
      setState({ kind: "thinking", stage: "Gemini 分析 + 寫回覆草稿…" });
      const fd = new FormData();
      fd.append("question", question);
      fd.append("context", JSON.stringify(context));
      if (file) fd.append("file", file);

      const res = await fetch("/api/ai/inbox-assistant", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) {
        setState({ kind: "error", message: json.error || json.message || "AI 失敗" });
        return;
      }
      setState({ kind: "answered", answer: json.data as AiAnswer, usedContext: context });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "未知錯誤" });
    }
  };

  return (
    <div
      style={{
        background: BR.page,
        backgroundImage: `linear-gradient(to right, rgba(12,18,8,.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(12,18,8,.022) 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
        minHeight: "100vh", fontFamily: FONT, color: BR.ink,
      }}
    >
      <div className="max-w-[1280px] mx-auto px-9 py-7 space-y-6">

        {/* Header */}
        <header>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              color: "#fff", background: BR.greenInk, padding: "4px 10px", borderRadius: 5,
            }}>L2 OPERATIONS</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: BR.inkFaint, letterSpacing: "0.06em" }}>
              erp / lead-time-validation
            </span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
              color: "#fff", background: BR.green,
              padding: "2px 8px", borderRadius: 4, marginLeft: 6,
            }}>UPGRADED · AI INBOX</span>
          </div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>
            <span style={{ color: BR.green, marginRight: 8 }}>💬</span>
            AI 跨部門詢問助理
            <span style={{ fontSize: 16, color: BR.inkFaint, fontFamily: FONT_MONO, marginLeft: 12, fontWeight: 500 }}>
              Cross-Dept AI Inbox
            </span>
          </h1>
          <p style={{ fontSize: 14, color: BR.inkSoft, marginTop: 6, lineHeight: 1.65, maxWidth: 880 }}>
            業務 / 生管 / 採購 / 客服收到任何客戶或同事的詢問訊息（成本評估、交期、替代料、庫存、規格⋯⋯），
            直接貼進來或附上截圖 / PDF / 圖片，
            <b style={{ color: BR.purple }}>AI 從你已上傳的料件 / BOM / 採購主檔串接</b>找出真實數據，
            並寫好可直接複製的繁中回覆草稿 — 不用再走業務 → 生管 → 採購 → 供應商 → 回信的 3-5 天鏈條。
          </p>
        </header>

        {/* 主檔狀態提示 */}
        <MasterDataReady meta={meta} />

        {/* 詢問 intake */}
        <Card>
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#fff", background: BR.green, padding: "3px 10px", borderRadius: 4,
            }}>📥 INTAKE</span>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 800, color: BR.ink, margin: 0 }}>
              貼上 email / 訊息 / 上傳附件
            </h2>
            <span className="flex-1" />
            <span style={{ fontSize: 11, fontFamily: FONT_MONO, color: BR.inkFaint }}>
              中英混雜都可 · 截圖支援
            </span>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`貼整封 email 或訊息全文，例如：\n\nHi 採購，再請提供 FB11K003 成本評估與交期 ~ 客人在線等! Qty: 60 pcs. 謝謝。`}
            rows={6}
            className="w-full rounded-[10px] p-3"
            style={{
              fontFamily: FONT_MONO, fontSize: 12.5, lineHeight: 1.6,
              border: `1.5px solid ${BR.border}`, background: "#fbfcfa", color: BR.ink,
              resize: "vertical",
            }}
          />

          {/* 偵測到的料號 */}
          {detectedPartNos.length > 0 && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
                自動偵測料號：
              </span>
              {detectedPartNos.map((p) => (
                <span key={p} style={{
                  fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
                  color: BR.greenInk, background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
                  padding: "2px 8px", borderRadius: 4,
                }}>{p}</span>
              ))}
            </div>
          )}

          {/* 範例（一鍵填） */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
              範例：
            </span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setQuestion(ex.text)}
                className="px-2.5 py-1 rounded-[6px]"
                style={{
                  fontSize: 11, color: BR.greenDeep, background: BR.greenSoft,
                  border: `1px solid ${BR.greenLine}`, fontFamily: FONT_MONO,
                  cursor: "pointer",
                }}
              >{ex.label}</button>
            ))}
          </div>

          {/* 附件 */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <label
              className="px-3 py-1.5 rounded-[6px] cursor-pointer"
              style={{
                fontSize: 12, color: BR.greenDeep, background: "#fff",
                border: `1px dashed ${BR.greenDeep}`, fontFamily: FONT_MONO,
              }}
            >
              📎 上傳附件（PDF / PNG / JPG）
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {file && (
              <span style={{ fontSize: 11, color: BR.inkSoft, fontFamily: FONT_MONO }}>
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
                <button
                  onClick={() => setFile(null)}
                  style={{ marginLeft: 8, color: BR.red, background: "transparent", border: "none", cursor: "pointer" }}
                >移除</button>
              </span>
            )}
          </div>

          {/* 動作 */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={onAsk}
              disabled={state.kind === "thinking" || (!question.trim() && !file)}
              className="px-5 py-2.5 rounded-[8px] font-bold"
              style={{
                background: BR.green, color: "#fff", fontSize: 14,
                opacity: state.kind === "thinking" || (!question.trim() && !file) ? 0.4 : 1,
                cursor: state.kind === "thinking" ? "wait" : "pointer",
              }}
            >
              {state.kind === "thinking" ? "AI 分析中…" : "▶ 跑 AI 分析"}
            </button>
            <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
              ⓘ 本地 IndexedDB 不上雲端 · Gemini 只看你提供的 context + 訊息
            </span>
          </div>

          {state.kind === "thinking" && (
            <div className="mt-3 p-3 rounded-[8px] flex items-center gap-3" style={{
              background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
              fontSize: 12.5, color: BR.greenInk, fontFamily: FONT_MONO,
            }}>
              <Spinner /> {state.stage}
            </div>
          )}

          {state.kind === "error" && (
            <div className="mt-3 p-3 rounded-[8px]" style={{
              background: BR.redSoft, border: `1px solid ${BR.red}`,
              fontSize: 12.5, color: BR.red,
            }}>⚠ {state.message}</div>
          )}
        </Card>

        {/* AI 回覆 panel */}
        {state.kind === "answered" && (
          <AiAnswerPanel answer={state.answer} context={state.usedContext} />
        )}

        {/* 傳統做法 vs 世界級做法（保留視覺對比） */}
        <div style={{ display: state.kind === "answered" ? "none" : "block" }}>
          <CompareTraditional />
        </div>

        <footer className="flex items-center gap-5 flex-wrap pt-4" style={{
          fontFamily: FONT_MONO, fontSize: 10.5, color: BR.inkFaint,
        }}>
          <Link href="/erp/master-data" style={{ color: BR.greenDeep, textDecoration: "underline" }}>
            ← ERP 主檔上傳
          </Link>
          <Link href="/erp/quotation-analyzer" style={{ color: BR.greenDeep, textDecoration: "underline" }}>
            姊妹模組 → AI Quotation Analyzer (L3)
          </Link>
          <Link href="/erp/operations" style={{ color: BR.greenDeep, textDecoration: "underline" }}>
            回 L2 工單作戰中心
          </Link>
          <span className="flex-1" />
          <span>CHI HUA AI · L2 · Cross-Dept AI Inbox · /erp/lead-time-validation</span>
        </footer>
      </div>
    </div>
  );
}

// ============================================================
// IndexedDB 撈 context — 依使用者問題裡偵測到的 partNo
// ============================================================
type ContextPack = {
  items: ItemMaster[];
  bom: BomEntry[];
  purchases: PurchaseRecord[];
  notes: string[];
};

async function gatherContext(partNos: string[]): Promise<ContextPack> {
  const items: ItemMaster[] = [];
  const bom: BomEntry[] = [];
  const purchases: PurchaseRecord[] = [];
  const notes: string[] = [];
  const seenItems = new Set<string>();
  const seenPurchases = new Set<string>();

  for (const p of partNos) {
    const item = await findItemByPartNo(p);
    if (item && !seenItems.has(item.partNo)) {
      items.push(item);
      seenItems.add(item.partNo);
    } else if (!item) {
      notes.push(`料號 ${p} 不在 IndexedDB 料件主檔中`);
    }

    const directBom = await findBomByParent(p);
    bom.push(...directBom);

    // 子料的 item + 採購歷史也撈進來
    for (const b of directBom) {
      if (!seenItems.has(b.childPartNo)) {
        const child = await findItemByPartNo(b.childPartNo);
        if (child) {
          items.push(child);
          seenItems.add(child.partNo);
        }
      }
      // 子料的採購（只取近 12 月）
      const childPurchases = await findPurchasesByPart(b.childPartNo);
      const recent = filterRecent(childPurchases, 365);
      for (const r of recent) {
        const key = `${r.poNo}|${r.partNo}|${r.date}|${r.unitPrice}`;
        if (!seenPurchases.has(key)) {
          purchases.push(r);
          seenPurchases.add(key);
        }
      }
    }

    // 父件本身的採購（給成品本身查最近售價 / 採購均價）
    const ownPurchases = filterRecent(await findPurchasesByPart(p), 365);
    for (const r of ownPurchases) {
      const key = `${r.poNo}|${r.partNo}|${r.date}|${r.unitPrice}`;
      if (!seenPurchases.has(key)) {
        purchases.push(r);
        seenPurchases.add(key);
      }
    }
  }

  // 截斷避免 prompt 太大（Gemini context window 還夠，但 prompt 越大越慢/越貴）
  const truncated = {
    items: items.slice(0, 80),
    bom: bom.slice(0, 200),
    purchases: purchases.slice(0, 300),
    notes,
  };
  if (items.length > 80) truncated.notes.push(`items 截斷：原 ${items.length} 筆只送 80 筆`);
  if (bom.length > 200) truncated.notes.push(`bom 截斷：原 ${bom.length} 筆只送 200 筆`);
  if (purchases.length > 300) truncated.notes.push(`purchases 截斷：原 ${purchases.length} 筆只送 300 筆`);
  return truncated;
}

function filterRecent(rows: PurchaseRecord[], days: number): PurchaseRecord[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter((r) => {
    if (!r.date) return false;
    const t = new Date(r.date).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

// ============================================================
// 上方狀態 banner — 主檔有沒有先上傳？
// ============================================================
function MasterDataReady({ meta }: { meta: MasterDataMeta }) {
  const ready = meta.itemCount > 0 && meta.bomCount > 0;
  if (ready) {
    return (
      <div className="rounded-[10px] p-3 flex items-center gap-3 flex-wrap" style={{
        background: BR.greenSoft, border: `1px solid ${BR.greenLine}`,
        fontFamily: FONT_MONO, fontSize: 11.5, color: BR.greenInk, lineHeight: 1.55,
      }}>
        <span>✓ 主檔已就緒</span>
        <span>·</span>
        <span>料件 {meta.itemCount.toLocaleString()}</span>
        <span>·</span>
        <span>BOM {meta.bomCount.toLocaleString()}</span>
        <span>·</span>
        <span>採購 {meta.purchaseCount.toLocaleString()}</span>
        <span className="flex-1" />
        <Link href="/erp/master-data" style={{ color: BR.greenDeep, textDecoration: "underline" }}>
          補充 / 更新主檔 →
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-[10px] p-3 flex items-center gap-3 flex-wrap" style={{
      background: BR.amberSoft, border: `1px solid ${BR.amber}`,
      fontSize: 12, color: BR.amber, lineHeight: 1.55,
    }}>
      <span>⚠ 主檔還沒上傳完 — AI 沒有 BOM / 採購歷史可參考，回答會偏 generic</span>
      <span className="flex-1" />
      <Link href="/erp/master-data" style={{
        color: "#fff", background: BR.amber, padding: "4px 10px", borderRadius: 4,
        fontWeight: 700, textDecoration: "none",
      }}>→ 去上傳主檔</Link>
    </div>
  );
}

// ============================================================
// AI 回覆面板
// ============================================================
function AiAnswerPanel({ answer, context }: { answer: AiAnswer; context: ContextPack }) {
  const q = answer.parsedQuestion;
  const f = answer.findings;
  const confTone = answer.confidence === "high" ? BR.green : answer.confidence === "med" ? BR.amber : BR.red;

  return (
    <div className="space-y-4">
      {/* 解析結果 */}
      <div className="rounded-[12px] p-4" style={{
        background: BR.card, border: `2px solid ${confTone}`,
      }}>
        <div className="flex items-baseline gap-3 mb-2 flex-wrap">
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: "#fff", background: confTone, padding: "3px 10px", borderRadius: 4,
          }}>AI 解析 · confidence={answer.confidence.toUpperCase()}</span>
          {q.urgency === "high" && (
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
              color: "#fff", background: BR.red, padding: "3px 10px", borderRadius: 4,
            }}>🚨 急件</span>
          )}
        </div>
        <p style={{ fontSize: 14, color: BR.ink, lineHeight: 1.55 }}>
          {q.summary}
        </p>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {q.askedBy && <MetaCell label="詢問者" value={q.askedBy} />}
          {q.partNos.length > 0 && <MetaCell label="料號" value={q.partNos.join(", ")} />}
          {q.qty != null && <MetaCell label="數量" value={String(q.qty)} />}
          <MetaCell label="問什麼" value={q.asks.join(" / ")} />
        </div>
        {q.attachmentSummary && (
          <div className="mt-2 p-2 rounded-[6px]" style={{
            background: "#fbfcfa", border: `1px solid ${BR.border}`,
            fontSize: 11.5, color: BR.inkSoft,
          }}>
            📎 附件內容：{q.attachmentSummary}
          </div>
        )}
      </div>

      {/* 成本分析 */}
      {(f.costPerUnit != null || (f.breakdown && f.breakdown.length > 0)) && (
        <div className="rounded-[12px] p-4" style={{ background: BR.card, border: `1px solid ${BR.border}` }}>
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#fff", background: BR.greenDeep, padding: "3px 10px", borderRadius: 4,
            }}>💰 COST</span>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 800, color: BR.ink, margin: 0 }}>
              成本評估
            </h3>
            {f.costConfidence && (
              <span style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>
                confidence: {f.costConfidence}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {f.costPerUnit != null && (
              <BigStat label="單顆物料成本" value={`${f.costCurrency || "TWD"} ${f.costPerUnit.toFixed(2)}`} tone={BR.greenDeep} />
            )}
            {f.costTotal != null && (
              <BigStat label="總物料成本" value={`${f.costCurrency || "TWD"} ${Math.round(f.costTotal).toLocaleString()}`} tone={BR.green} />
            )}
          </div>
          {f.costRationale && (
            <p style={{ fontSize: 12, color: BR.inkSoft, marginBottom: 10 }}>
              {f.costRationale}
            </p>
          )}
          {f.breakdown && f.breakdown.length > 0 && (
            <BreakdownTable rows={f.breakdown} />
          )}
        </div>
      )}

      {/* 交期分析 */}
      {f.leadTimeDays != null && (
        <div className="rounded-[12px] p-4" style={{ background: BR.card, border: `1px solid ${BR.border}` }}>
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              color: "#fff", background: BR.blue, padding: "3px 10px", borderRadius: 4,
            }}>⏱ LEAD TIME</span>
            <h3 style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 800, color: BR.ink, margin: 0 }}>
              交期評估
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <BigStat label="預估交期" value={`${f.leadTimeDays} 天 (~${Math.round(f.leadTimeDays / 7)} 週)`} tone={BR.blue} />
            {f.leadTimeBottleneck && <BigStat label="瓶頸料" value={f.leadTimeBottleneck} tone={BR.amber} small />}
          </div>
          {f.leadTimeRationale && (
            <p style={{ fontSize: 12, color: BR.inkSoft }}>{f.leadTimeRationale}</p>
          )}
        </div>
      )}

      {/* 其他發現 */}
      {f.otherNotes && f.otherNotes.length > 0 && (
        <div className="rounded-[12px] p-4" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 8 }}>
            🔍 其他發現
          </div>
          <ul className="space-y-1.5 list-disc pl-5" style={{ fontSize: 12.5, color: BR.ink, lineHeight: 1.55 }}>
            {f.otherNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {/* Reply draft */}
      <div className="rounded-[12px] p-4" style={{
        background: BR.greenSoft, border: `2px solid ${BR.green}`,
      }}>
        <div className="flex items-baseline gap-3 mb-3 flex-wrap">
          <span style={{
            fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            color: "#fff", background: BR.green, padding: "3px 10px", borderRadius: 4,
          }}>📨 REPLY DRAFT</span>
          <h3 style={{ fontFamily: FONT_HEAD, fontSize: 16, fontWeight: 800, color: BR.greenInk, margin: 0 }}>
            建議回覆草稿（可直接複製）
          </h3>
          <span className="flex-1" />
          <CopyButton text={answer.replyDraft} />
        </div>
        <pre style={{
          background: "#fff", padding: 14, borderRadius: 8,
          border: `1px solid ${BR.greenLine}`,
          fontFamily: FONT, fontSize: 13.5, color: BR.ink, lineHeight: 1.7,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          margin: 0,
        }}>{answer.replyDraft}</pre>
      </div>

      {/* 用了哪些資料 + 警告 */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 6 }}>
            📊 用了哪些資料
          </div>
          <ul className="space-y-1" style={{ fontSize: 11.5, color: BR.inkSoft, fontFamily: FONT_MONO }}>
            {answer.dataUsed.map((d, i) => <li key={i}>• {d}</li>)}
            <li style={{ color: BR.inkFaint, marginTop: 4 }}>
              ─ context 送出：items {context.items.length} / bom {context.bom.length} / purchases {context.purchases.length}
            </li>
          </ul>
        </div>
        {answer.warnings.length > 0 && (
          <div className="rounded-[10px] p-3" style={{
            background: BR.amberSoft, border: `1px solid ${BR.amber}`,
          }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.amber, letterSpacing: "0.08em", marginBottom: 6 }}>
              ⚠ 警告事項
            </div>
            <ul className="space-y-1" style={{ fontSize: 11.5, color: BR.amber, lineHeight: 1.55 }}>
              {answer.warnings.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 子元件
// ============================================================
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: BR.card, border: `1px solid ${BR.border}`, borderRadius: 14,
      boxShadow: "0 1px 2px rgba(12,18,8,.03), 0 4px 16px rgba(12,18,8,.04)",
      padding: "20px 22px", ...style,
    }}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: `2px solid ${BR.greenLine}`, borderTopColor: BR.greenDeep,
      borderRadius: "50%", animation: "spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] px-2 py-1.5" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
      <div style={{ fontSize: 10, color: BR.inkFaint, fontFamily: FONT_MONO }}>{label}</div>
      <div style={{ fontSize: 12, color: BR.ink, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function BigStat({ label, value, tone, small }: { label: string; value: string; tone: string; small?: boolean }) {
  return (
    <div className="rounded-[10px] p-3" style={{ background: "#fbfcfa", border: `1px solid ${BR.border}` }}>
      <div style={{ fontSize: 11, color: BR.inkFaint, fontFamily: FONT_MONO }}>{label}</div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: small ? 16 : 22, fontWeight: 800,
        color: tone, marginTop: 2, lineHeight: 1.15,
      }}>{value}</div>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: NonNullable<Findings["breakdown"]> }) {
  return (
    <div className="rounded-[8px] overflow-hidden" style={{ border: `1px solid ${BR.border}` }}>
      <div className="grid grid-cols-[110px_1fr_70px_60px_90px_90px_120px]" style={{
        background: BR.greenInk, color: "#fff",
        padding: "5px 8px", fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
      }}>
        <div>料號</div><div>品名</div><div className="text-right">用量</div>
        <div>單位</div><div className="text-right">單價</div><div className="text-right">小計</div>
        <div>來源</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[110px_1fr_70px_60px_90px_90px_120px] items-center" style={{
          padding: "5px 8px", fontFamily: FONT_MONO, fontSize: 11,
          borderTop: `1px solid ${BR.border}`,
          background: i % 2 === 0 ? "#fff" : "#fbfcfa",
        }}>
          <div style={{ color: BR.greenDeep, fontWeight: 700 }}>{r.partNo || "—"}</div>
          <div style={{ color: BR.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.name || ""}
          </div>
          <div className="text-right" style={{ color: BR.ink }}>{r.qty != null ? r.qty.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}</div>
          <div style={{ color: BR.inkSoft, fontSize: 10.5 }}>{r.unit || ""}</div>
          <div className="text-right" style={{ color: BR.ink }}>{r.unitPrice != null ? r.unitPrice.toFixed(2) : "—"}</div>
          <div className="text-right" style={{ color: BR.ink, fontWeight: 700 }}>{r.subtotal != null ? r.subtotal.toFixed(2) : "—"}</div>
          <div style={{ color: BR.inkFaint, fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.source || ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      onClick={onCopy}
      className="px-3 py-1.5 rounded-[6px]"
      style={{
        background: copied ? BR.greenDeep : "#fff",
        color: copied ? "#fff" : BR.greenDeep,
        border: `1px solid ${BR.greenDeep}`,
        fontSize: 12, fontFamily: FONT_MONO, fontWeight: 700, cursor: "pointer",
      }}
    >
      {copied ? "✓ 已複製" : "📋 複製"}
    </button>
  );
}

function CompareTraditional() {
  return (
    <Card>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: BR.inkFaint, letterSpacing: "0.08em", marginBottom: 10 }}>
        🆚 為什麼這頁有用 · 痛點 vs 世界級做法
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-[10px] p-3" style={{ background: BR.redSoft, border: `1px solid ${BR.red}` }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 14, fontWeight: 800, color: BR.red, marginBottom: 6 }}>
            傳統做法（答案要 3-5 天）
          </div>
          <div className="flex items-center gap-1 flex-wrap" style={{ fontSize: 11.5, color: BR.ink }}>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>業務收到問題</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>轉 PM</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>查生管</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>找採購</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>問供應商</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>等回信</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.border}` }}>回覆客戶</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: BR.red, fontFamily: FONT_MONO }}>
            耗時：3-5 個工作天 · 客戶早已不耐
          </div>
        </div>
        <div className="rounded-[10px] p-3" style={{ background: BR.greenSoft, border: `1px solid ${BR.green}` }}>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 14, fontWeight: 800, color: BR.greenInk, marginBottom: 6 }}>
            這頁的做法（30 秒）
          </div>
          <div className="flex items-center gap-1 flex-wrap" style={{ fontSize: 11.5, color: BR.ink }}>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.greenLine}` }}>貼 email / 截圖</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: BR.green, color: "#fff", borderRadius: 4 }}>AI 跨主檔串接</span>
            <span>→</span>
            <span style={{ padding: "3px 7px", background: "#fff", borderRadius: 4, border: `1px solid ${BR.greenLine}` }}>抓 reply 直接寄</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: BR.greenDeep, fontFamily: FONT_MONO }}>
            耗時：30 秒 · 答案附計算依據
          </div>
        </div>
      </div>
    </Card>
  );
}
