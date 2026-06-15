// /api/erp/report-import — 鼎新報表 PDF / 圖片 → Gemini OCR → 結構化資料
//
// 為什麼跟 quotation-ocr 分開？
//   報價單格式自由（每家供應商不同），鼎新報表格式固定（BOM210、料件主檔、採購單明細）
//   → 兩條 prompt 完全不同，分開比較好維護
//
// 目前支援的報表類型：
//   bom        — BOM 多階正展列表（BOM210）：列出父件下所有子料
//   items      — 料件主檔列表：列出多筆料號 + 品名 + 分類
//   purchases  — 採購單明細：列出多筆採購紀錄
//   unknown    — Gemini 認不出 → 回給前端讓使用者手動選

import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema, type EnhancedGenerateContentResponse } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REPORT_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    reportType: {
      type: SchemaType.STRING,
      description: "報表類型：bom（BOM 結構 / 多階正展）/ items（料件主檔列表）/ purchases（採購單明細 / 採購歷史）/ unknown（看不出來）",
    },
    reportLabel: {
      type: SchemaType.STRING,
      description: "報表正式名稱（從報表標題抓，例如「BOM 多階正展列表」「料件主檔查詢」「採購單明細查詢」），找不到就描述內容",
      nullable: true,
    },
    parentPartNo: {
      type: SchemaType.STRING,
      description: "僅對 bom 類型：父件品號（從報表 header 抓，例如「父件品號：FB61H003」）",
      nullable: true,
    },
    parentName: {
      type: SchemaType.STRING,
      description: "僅對 bom 類型：父件品名",
      nullable: true,
    },
    printDate: {
      type: SchemaType.STRING,
      description: "報表列印日期",
      nullable: true,
    },
    rows: {
      type: SchemaType.ARRAY,
      description: "報表中的每一列資料。依出現順序排列。",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          partNo: { type: SchemaType.STRING, description: "料號 / 品號 / 子料號", nullable: true },
          name: { type: SchemaType.STRING, description: "品名", nullable: true },
          spec: { type: SchemaType.STRING, description: "規格 / 型號", nullable: true },
          qty: { type: SchemaType.NUMBER, description: "用量 / 數量", nullable: true },
          unit: { type: SchemaType.STRING, description: "單位（個/公斤/公克/PCS）", nullable: true },
          // BOM 專用
          level: { type: SchemaType.INTEGER, description: "（BOM 專用）階層編號，1=直接子料、2=次階...。看到「2/1」「2/3」這種就取主數字 2", nullable: true },
          isAlternative: { type: SchemaType.BOOLEAN, description: "（BOM 專用）是否為替代料（替代欄位有 Y / 替代）", nullable: true },
          // 料件主檔專用
          category: { type: SchemaType.STRING, description: "（料件主檔專用）商品分類 / 大類 / 中類", nullable: true },
          // 採購專用
          poNo: { type: SchemaType.STRING, description: "（採購專用）採購單號", nullable: true },
          supplier: { type: SchemaType.STRING, description: "（採購專用）供應商 / 廠商名稱", nullable: true },
          unitPrice: { type: SchemaType.NUMBER, description: "（採購專用）單價 / 採購單價", nullable: true },
          currency: { type: SchemaType.STRING, description: "（採購專用）幣別", nullable: true },
          date: { type: SchemaType.STRING, description: "（採購專用）採購日期 / 單據日期，保留原始格式", nullable: true },
        },
      },
    },
  },
  required: ["reportType", "rows"],
};

const SYSTEM_PROMPT = `你是專業的鼎新 ERP 報表 OCR 助手。使用者會上傳一張鼎新（Digiwin / Workflow / iGP）的列印報表，可能是 PDF 掃描、螢幕截圖或手機翻拍。

【第一步：判斷報表類型】
看標題、欄位、整體結構，判斷以下四種之一：

1. **bom** — BOM 結構 / BOM 多階正展 / 產品結構列表
   特徵：上方寫「父件品號」「父件規格」；表中欄位有「階別」「階數」「子料品號」「用量」
   常見報表代碼：BOM210、BOM200、BOM110

2. **items** — 料件主檔列表 / 料件基本資料 / 品號列表
   特徵：每列一個料號，欄位通常有「品號」「品名」「規格」「庫存單位」「大類碼」「中類」
   常見報表代碼：INV101、INV110

3. **purchases** — 採購單明細 / 採購單據查詢 / 進貨明細 / 採購單身
   特徵：欄位有「採購單號」「品號」「廠商」「單價」「數量」「單據日期」
   常見報表代碼：PUR201、PUR301

4. **unknown** — 都不像，或是非鼎新報表

【第二步：依類型抽出 rows】

對 **bom**：
- 父件品號從 header 抓（例如「父件品號：FB61H003」），放在 parentPartNo
- rows 裡的每一列是子料，partNo 是子料號（不要把父件當子料）
- level 欄位：看「階別」或「階數」欄位的數字；看到「2/1」「2/3」這種主階號 2，就填 2；單純「1」就填 1
- isAlternative：「替代料」欄位有 Y / 是 / 替 就填 true，沒有或空白就 false

對 **items**：
- 每列一筆料件主檔
- partNo 用「品號」，name 用「品名」，spec 用「規格」，category 用「大類碼」或「商品分類」，unit 用「庫存單位」

對 **purchases**：
- 每列一筆採購紀錄
- partNo / supplier / unitPrice / date / poNo 對應抽出
- 日期保留原始格式（民國年 1150527 或 2026/05/27 都原樣，後端會自己 normalize）

【嚴禁】
- 找不到的欄位填 null，**不要捏造**
- 不要把表頭（欄位名）當成資料列
- 不要把頁尾總計、頁碼當資料列
- 多頁報表把所有頁的資料合起來，但不要把每頁的表頭重複算

【格式雜訊處理】
- 鼎新報表常有民國年（1150527 = 民國 115 年 5 月 27 日 = 2026-05-27）→ 保持原樣不要轉
- 數字有千分位逗號（1,234.56）→ 保持原樣
- 規格欄常有特殊字元（ø、×、Φ、★）→ 保留`;

type ReportType = "bom" | "items" | "purchases" | "unknown";

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        demoMode: true,
        message: "尚未設定 GEMINI_API_KEY 環境變數。請到 https://aistudio.google.com/apikey 取得免費 API Key 後加入 Vercel Environment Variables。",
      },
      { status: 200 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "缺少 file 欄位" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "檔案太大（>15MB）。建議降低 PDF 解析度或分頁上傳" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mediaType = file.type || guessMediaType(file.name);

  const isPdf = mediaType === "application/pdf";
  const isImage = mediaType.startsWith("image/");
  if (!isPdf && !isImage) {
    return NextResponse.json(
      { ok: false, error: `不支援的檔案類型：${mediaType}。請上傳 PDF 或 JPG/PNG` },
      { status: 400 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
  const isRetryable = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return /\b(429|500|502|503|504|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded)\b/i.test(msg);
  };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let lastErr: unknown = null;
  let usedModel = "";
  let response: EnhancedGenerateContentResponse | null = null;

  outer: for (const modelId of MODELS) {
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: REPORT_SCHEMA,
        temperature: 0.1,
      },
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent([
          { inlineData: { mimeType: mediaType, data: base64 } },
          { text: "請從這份鼎新報表抽出結構化資料。先判斷類型，再依類型抽 rows。" },
        ]);
        response = result.response;
        usedModel = modelId;
        break outer;
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err)) break;
        if (attempt < 2) await sleep(1000 * Math.pow(2, attempt));
      }
    }
  }

  if (!response) {
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    const friendly = isRetryable(lastErr)
      ? "Gemini 伺服器目前過載，1-2 分鐘後請再試一次"
      : `Gemini API 錯誤：${msg}`;
    return NextResponse.json({ ok: false, error: friendly, raw: msg.slice(0, 300) }, { status: 503 });
  }

  try {
    const text = response.text();
    if (!text) return NextResponse.json({ ok: false, error: "Gemini 沒有回傳文字內容" }, { status: 502 });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Gemini 回傳格式無法解析", raw: text.slice(0, 500) }, { status: 502 });
    }

    // 簡單驗證：reportType 必須是已知值
    const rt = String(parsed.reportType ?? "unknown");
    const reportType: ReportType = ["bom", "items", "purchases", "unknown"].includes(rt)
      ? (rt as ReportType)
      : "unknown";

    const usage = response.usageMetadata;
    return NextResponse.json({
      ok: true,
      data: { ...parsed, reportType },
      model: usedModel,
      usage: usage
        ? { inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount }
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `Gemini API 錯誤：${msg}` }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    description: "POST 一個 PDF / 圖片（FormData field: file）來抽鼎新報表結構化資料。會自動辨識報表類型（bom / items / purchases）。",
  });
}

function guessMediaType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}
