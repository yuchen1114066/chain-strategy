// /api/ai/quotation-ocr — 用 Google Gemini Vision 從報價單 PDF / 圖片讀出結構化資料
//
// 用法：
//   POST /api/ai/quotation-ocr        FormData { file: <PDF/PNG/JPG> }
//   回傳：{ ok: true, data: { supplier, quoteNo, quoteDate, currency, lines: [...] } }
//
// 環境變數：
//   GEMINI_API_KEY  — 從 https://aistudio.google.com/apikey 取得（Gmail 登入即可，免費 1500 次/天）

import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Gemini 的 responseSchema 是 OpenAPI 子集，與 JSON Schema 略有不同
const QUOTATION_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    supplier: {
      type: SchemaType.STRING,
      description: "報價單上的廠商/供應商名稱（公司全名，例如「東台祺電電子科技有限公司」或「企龍企業有限公司」）",
    },
    quoteNo: {
      type: SchemaType.STRING,
      description: "報價單號（例如 QD251217CH、20260203-3）。沒有則填空字串",
      nullable: true,
    },
    quoteDate: {
      type: SchemaType.STRING,
      description: "報價日期，保留原始格式（例如 2025/12/17）。沒有則填空字串",
      nullable: true,
    },
    currency: {
      type: SchemaType.STRING,
      description: "幣別代碼（USD/TWD/NTD/CNY/EUR/JPY）",
      nullable: true,
    },
    paymentTerms: {
      type: SchemaType.STRING,
      description: "付款條件（例如「月結60天兩票」）",
      nullable: true,
    },
    leadTimeText: {
      type: SchemaType.STRING,
      description: "交期/L/T 文字（例如「20-25days after order confirmation」）",
      nullable: true,
    },
    lines: {
      type: SchemaType.ARRAY,
      description: "報價單上的每一項料件，依出現順序",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          seq: { type: SchemaType.INTEGER, description: "項次", nullable: true },
          partNo: { type: SchemaType.STRING, description: "產品編號 / P/N（例如 P10D004、P03NB001）" },
          description: { type: SchemaType.STRING, description: "品名 / 規格", nullable: true },
          quantity: { type: SchemaType.NUMBER, description: "報價數量", nullable: true },
          unit: { type: SchemaType.STRING, description: "單位（PCS/KG/SET）", nullable: true },
          unitPrice: { type: SchemaType.NUMBER, description: "本次報價單價" },
          oldPrice: {
            type: SchemaType.NUMBER,
            description: "手寫標註的舊報價（例如「原0.078」中的 0.078）。若無手寫則 null",
            nullable: true,
          },
          markupPercent: {
            type: SchemaType.NUMBER,
            description: "手寫標註的漲幅百分比（例如「143%」就填 143）。若無則 null",
            nullable: true,
          },
          remark: { type: SchemaType.STRING, description: "備註欄文字", nullable: true },
        },
        required: ["partNo", "unitPrice"],
      },
    },
  },
  required: ["supplier", "lines"],
};

const SYSTEM_PROMPT = `你是專業的報價單 OCR 助手。使用者會上傳一張供應商的報價單（PDF 或照片，可能是中文、英文或中英混合）。

請從文件中讀出：
1. 廠商/供應商名稱（**發出報價單的賣方**，通常在最上方有 LOGO；不是收件人「客戶名稱 / TO」那一行的公司）
2. 報價單號、日期、幣別、付款條件、交期
3. 每一個料件項目：項次、料號、品名、數量、單位、單價

【料號 partNo 規則 — 重要】
- 如果文件有 P/N、料號、Part No、Item Code 欄位 → 原樣保留（例如 P10D004、P03NB001、M09A14）
- 如果是散裝原物料 / 原料報價（例如錫棒、銅線、樹脂、五金扣件），通常**沒有料號欄位** → partNo 填 null（不要捏造，也不要把品名塞進去；後端會自動用品名+規格代替）
- 不要硬把數量、日期、地址當成料號

【手寫標註 — 很重要的議價線索】
- 紙本常有手寫紅字 / 藍字 / 便利貼，記錄「原價」與「漲幅%」
- 例如看到「原0.078 143%」→ oldPrice=0.078, markupPercent=143
- 看到「↑50%」、「漲 20%」→ markupPercent 填數字部分
- 如果文件完全沒有任何手寫標註，oldPrice 和 markupPercent 都填 null（後端會標記「首次報價」）

【嚴禁】
- **找不到的欄位請填 null，不要捏造資料**
- 特別是：報價單號沒寫就填 null，料號沒有就填 null，幣別沒寫就填 null
- 不要把 "null" 當字串回傳，要用 JSON 的 null`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        demoMode: true,
        message: "尚未設定 GEMINI_API_KEY 環境變數，目前為示範模式。請到 https://aistudio.google.com/apikey 取得免費 API Key 後加入 Vercel Environment Variables。",
      },
      { status: 200 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "缺少 file 欄位" }, { status: 400 });
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
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: QUOTATION_SCHEMA,
      temperature: 0.1,
    },
  });

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: mediaType, data: base64 } },
      { text: "請從這份報價單抽出結構化資料。" },
    ]);

    const text = result.response.text();
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Gemini 沒有回傳文字內容" },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Gemini 回傳格式無法解析", raw: text.slice(0, 500) },
        { status: 502 },
      );
    }

    const usage = result.response.usageMetadata;
    return NextResponse.json({
      ok: true,
      data: parsed,
      usage: usage
        ? {
            inputTokens: usage.promptTokenCount,
            outputTokens: usage.candidatesTokenCount,
          }
        : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Gemini API 錯誤：${msg}` },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    model: "gemini-2.5-flash",
    description: "POST 一個 PDF / 圖片檔（FormData field: file）來抽出結構化報價單資料",
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
