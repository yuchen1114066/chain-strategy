// /api/ai/quotation-ocr — 用 Claude Vision 從報價單 PDF / 圖片讀出結構化資料
//
// 用法：
//   POST /api/ai/quotation-ocr        FormData { file: <PDF/PNG/JPG> }
//   回傳：{ ok: true, data: { supplier, quoteNo, quoteDate, currency, lines: [...] } }
//
// 環境變數：
//   ANTHROPIC_API_KEY  — 從 console.anthropic.com 取得。未設定時回傳 demo 模式提示。

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const QUOTATION_SCHEMA = {
  type: "object",
  properties: {
    supplier: {
      type: "string",
      description: "報價單上的廠商/供應商名稱（公司全名，如「東台祺電電子科技有限公司」或「企龍企業有限公司」）",
    },
    quoteNo: {
      type: ["string", "null"],
      description: "報價單號（例如 QD251217CH、20260203-3）。沒有則 null",
    },
    quoteDate: {
      type: ["string", "null"],
      description: "報價日期，保留原始格式（例如 2025/12/17 或 2026.2.3）。沒有則 null",
    },
    currency: {
      type: ["string", "null"],
      description: "幣別代碼（USD/TWD/NTD/CNY/EUR/JPY）。沒有寫則推斷或 null",
    },
    paymentTerms: {
      type: ["string", "null"],
      description: "付款條件（例如「月結60天兩票」）",
    },
    leadTimeText: {
      type: ["string", "null"],
      description: "交期/L/T 文字（例如「20-25days after order confirmation」）",
    },
    lines: {
      type: "array",
      description: "報價單上的每一項料件，依出現順序",
      items: {
        type: "object",
        properties: {
          seq: { type: ["integer", "null"], description: "項次 / Seq" },
          partNo: { type: "string", description: "產品編號 / P/N（例如 P10D004、P03NB001）" },
          description: { type: ["string", "null"], description: "品名 / 規格 / Description（中英文都保留）" },
          quantity: { type: ["number", "null"], description: "報價數量" },
          unit: { type: ["string", "null"], description: "單位（PCS / KG / SET）" },
          unitPrice: { type: "number", description: "本次報價單價" },
          oldPrice: { type: ["number", "null"], description: "手寫標註的舊報價（例如「原0.078」中的 0.078）。若無手寫則 null" },
          markupPercent: { type: ["number", "null"], description: "手寫標註的漲幅百分比（例如「143%」就填 143）。若無則 null" },
          remark: { type: ["string", "null"], description: "備註欄文字（材質、製程、表面處理等）" },
        },
        required: ["partNo", "unitPrice"],
        additionalProperties: false,
      },
    },
  },
  required: ["supplier", "lines"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `你是專業的報價單 OCR 助手。使用者會上傳一張供應商的報價單（PDF 或照片，可能是中文、英文或中英混合）。

請從文件中讀出：
1. 廠商/供應商名稱（注意：不是收件公司「祺驊」，而是發出報價單的賣方）
2. 報價單號、日期、幣別、付款條件、交期
3. 每一個料件項目：項次、料號、品名、數量、單位、單價

特別注意：
- 報價單上常有手寫標註（紅字、藍字、便利貼），記錄「原價」與「漲幅百分比」。請仔細看，把這些手寫資料填入 oldPrice 和 markupPercent
- 例如紙本看到「原0.078 143%」，代表 oldPrice=0.078, markupPercent=143
- 料號要原樣保留（例如 P10D004、P03NB001、M09A14），不要自己改寫格式
- 找不到的欄位請填 null，不要捏造資料`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        demoMode: true,
        message: "尚未設定 ANTHROPIC_API_KEY 環境變數，目前為示範模式。請在 Vercel Environment Variables 加入 ANTHROPIC_API_KEY 後重新部署即可啟用真正的 AI 辨識。",
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

  const client = new Anthropic({ apiKey });

  const docBlock = isPdf
    ? ({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      } as const)
    : ({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
          data: base64,
        },
      } as const);

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: QUOTATION_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            docBlock,
            { type: "text", text: "請從這份報價單抽出結構化資料。" },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { ok: false, error: "AI 沒有回傳文字內容", stopReason: response.stop_reason },
        { status: 502 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "AI 回傳格式無法解析", raw: textBlock.text.slice(0, 500) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: parsed,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { ok: false, error: `Claude API 錯誤 (${err.status})：${err.message}`, type: err.type },
        { status: err.status ?? 500 },
      );
    }
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: !!process.env.ANTHROPIC_API_KEY,
    model: "claude-opus-4-8",
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
