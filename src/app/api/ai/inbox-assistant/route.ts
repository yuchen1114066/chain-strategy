// /api/ai/inbox-assistant — 跨部門 AI 詢問助理
//
// 場景：業務 / 生管 / 採購 / 客服收到客戶或同事一封 email（或截圖、PDF），
// 問題可能是「FB11K003 成本評估與交期？Qty 60」、「能不能更快交貨？」、
// 「有沒有替代料？」⋯⋯
//
// 流程：
//   1. 客戶端先用 regex 抽 partNo 候選，去 IndexedDB 拉 item / BOM / 採購歷史
//   2. 把問題 + 抓到的真實資料 + 任何附件丟給這個 API
//   3. Gemini 同時看訊息 + 結構化資料 + 附件圖檔
//   4. 回傳：解析後的問題、成本/交期計算、reply draft、用了哪些資料、warning
//
// 嚴禁：找不到資料就誠實說「沒資料」，不要捏造數字（reply email 給客戶看的）

import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema, type EnhancedGenerateContentResponse } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANSWER_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    parsedQuestion: {
      type: SchemaType.OBJECT,
      properties: {
        summary: { type: SchemaType.STRING, description: "一句話描述使用者要問什麼（中文）" },
        askedBy: { type: SchemaType.STRING, description: "詢問者身份（業務 / 客戶 / 同事 / PM），看得出來就填", nullable: true },
        partNos: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "訊息裡提到的所有料號（去重）",
        },
        qty: { type: SchemaType.NUMBER, description: "詢問的數量（pcs / 組 / 個）", nullable: true },
        asks: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "問的類型，可多個：cost / leadtime / supplier / stock / alternative / other",
        },
        urgency: { type: SchemaType.STRING, description: "high / med / low — 看訊息語氣判斷", nullable: true },
        attachmentSummary: { type: SchemaType.STRING, description: "如果有附件，描述附件內容；沒附件就 null", nullable: true },
      },
      required: ["summary", "partNos", "asks"],
    },
    findings: {
      type: SchemaType.OBJECT,
      properties: {
        costPerUnit: { type: SchemaType.NUMBER, description: "推估的單顆物料成本（用 context 的 BOM × 採購均價算）", nullable: true },
        costTotal: { type: SchemaType.NUMBER, description: "如有數量，總物料成本 = 單顆 × 數量", nullable: true },
        costCurrency: { type: SchemaType.STRING, description: "幣別，預設 TWD", nullable: true },
        costConfidence: { type: SchemaType.STRING, description: "high / med / low", nullable: true },
        costRationale: { type: SchemaType.STRING, description: "成本是怎麼算出來的（一句話）", nullable: true },
        leadTimeDays: { type: SchemaType.NUMBER, description: "推估交期（天）", nullable: true },
        leadTimeRationale: { type: SchemaType.STRING, description: "交期怎麼推估的", nullable: true },
        leadTimeBottleneck: { type: SchemaType.STRING, description: "瓶頸點（哪個子料最慢）", nullable: true },
        breakdown: {
          type: SchemaType.ARRAY,
          description: "成本明細表（給人看的）",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              partNo: { type: SchemaType.STRING },
              name: { type: SchemaType.STRING, nullable: true },
              qty: { type: SchemaType.NUMBER, nullable: true },
              unit: { type: SchemaType.STRING, nullable: true },
              unitPrice: { type: SchemaType.NUMBER, nullable: true },
              subtotal: { type: SchemaType.NUMBER, nullable: true },
              source: { type: SchemaType.STRING, description: "資料來源（近 12 月均價 / 上次採購 / 無資料）", nullable: true },
            },
          },
        },
        otherNotes: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "其他發現（例如「子料 P01 沒有任何採購紀錄」）",
        },
      },
    },
    replyDraft: {
      type: SchemaType.STRING,
      description: "可直接複製貼到 reply email 的繁體中文回覆。要客觀、不要過度承諾、附上計算依據。如果資料不足就直說「需要補件號 / 補 BOM 才能精算」。",
    },
    confidence: { type: SchemaType.STRING, description: "整體信心度 high / med / low" },
    dataUsed: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "用到的資料來源列表，例如「item: FB11K003」「BOM: 12 筆子料」「採購: 近 12 月 42 筆」",
    },
    warnings: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "提醒事項。最常見：partNo 不在 IndexedDB / 子料缺價 / BOM 不完整",
    },
  },
  required: ["parsedQuestion", "findings", "replyDraft", "confidence", "dataUsed", "warnings"],
};

const SYSTEM_PROMPT = `你是公司內部跨部門 AI 助理。當業務 / 生管 / 採購 / 客服收到客戶或同事的詢問訊息（可能是 email、聊天截圖、PDF），會把那段文字 +（可選）附件圖檔丟給你。

你的工作是：

1. **解析訊息**：問的是哪個料號？要的數量？問成本還是交期還是供應商還是庫存還是替代料？是不是急件？

2. **用我提供的 context 算答案**。context 裡會有：
   - items：料件主檔（partNo, name, spec, category, unit）
   - bom：BOM 結構（parent → child + qty）
   - purchases：採購歷史（partNo, supplier, unitPrice, qty, date）— 已預先依問題涉及的料號篩過

   **成本估算**：
   - 物料成本/顆 = Σ（每個子料用量 × 該子料近 12 月採購均價）
   - 若 BOM 不完整 → confidence=med 或 low，並在 warnings 標出
   - 若子料完全沒採購紀錄 → 那項標「無資料」不要捏造價格
   - 加工費 / 工資 / 管銷費用：context 沒給就不算，並在 reply 裡標明「未含」

   **交期估算**：
   - 看子料採購紀錄的歷史間距 → 推估各子料「準備時間」
   - 找出最長那條（瓶頸料）→ 那是關鍵路徑
   - 加 5-7 天標準組裝、3-5 天 QC 包裝
   - 最終交期 = 關鍵路徑 + 末段
   - 沒採購紀錄的子料用「需詢問供應商」帶過

3. **寫 replyDraft**：可以直接複製貼到 reply 的繁體中文。語氣同事友善但專業，**附上計算依據**（不是空話）。如果資料不足就直說。

【嚴禁】
- 找不到資料就標 confidence=low + warning，**不要捏造數字**
- replyDraft 不要說「以上分析僅供參考」這種廢話
- 不要把 partNo 拼錯（嚴格用使用者寫的，不要自己改）
- 「客人在線等！」這種急件語氣 → urgency=high 並在 reply 裡反映`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, demoMode: true, message: "尚未設定 GEMINI_API_KEY 環境變數。" },
      { status: 200 },
    );
  }

  const formData = await req.formData();
  const question = String(formData.get("question") ?? "").trim();
  const contextJson = String(formData.get("context") ?? "{}");
  const file = formData.get("file");

  if (!question && !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "請輸入問題文字或上傳附件" }, { status: 400 });
  }

  // 驗證 context 格式
  let context: unknown;
  try {
    context = JSON.parse(contextJson);
  } catch {
    return NextResponse.json({ ok: false, error: "context 不是合法 JSON" }, { status: 400 });
  }

  // 組 prompt 的 parts
  type TextPart = { text: string };
  type InlineDataPart = { inlineData: { mimeType: string; data: string } };
  const parts: (TextPart | InlineDataPart)[] = [];
  parts.push({
    text:
      `【使用者收到的訊息】\n${question || "（無文字訊息，僅附件）"}\n\n` +
      `【系統已從本機 IndexedDB 撈出的 context】\n` +
      `\`\`\`json\n${JSON.stringify(context, null, 2).slice(0, 60000)}\n\`\`\`\n\n` +
      `請依照 system prompt 解析、計算、寫 reply。`,
  });

  // 有附件就加進去（Gemini Vision 直接讀）
  if (file instanceof File && file.size > 0) {
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "附件太大（>15MB）" }, { status: 400 });
    }
    const mediaType = file.type || guessMediaType(file.name);
    if (mediaType.startsWith("image/") || mediaType === "application/pdf") {
      const buf = Buffer.from(await file.arrayBuffer());
      parts.push({ inlineData: { mimeType: mediaType, data: buf.toString("base64") } });
    }
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
        responseSchema: ANSWER_SCHEMA,
        temperature: 0.2,
      },
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(parts);
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
    return NextResponse.json({
      ok: false,
      error: isRetryable(lastErr) ? "Gemini 過載，1-2 分鐘後再試" : `Gemini 錯誤：${msg}`,
    }, { status: 503 });
  }

  try {
    const text = response.text();
    if (!text) return NextResponse.json({ ok: false, error: "Gemini 沒回傳內容" }, { status: 502 });
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch { return NextResponse.json({ ok: false, error: "Gemini 回傳格式無法解析", raw: text.slice(0, 500) }, { status: 502 }); }

    const usage = response.usageMetadata;
    return NextResponse.json({
      ok: true,
      data: parsed,
      model: usedModel,
      usage: usage ? { inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount } : null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    description: "POST FormData { question, context, file? } 取得 AI 解析 + reply draft",
  });
}

function guessMediaType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}
