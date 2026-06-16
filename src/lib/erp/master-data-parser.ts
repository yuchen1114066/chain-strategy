// 鼎新 ERP 匯出檔解析（CSV / XLSX / XLS 通吃）
//
// 為什麼需要智慧欄位偵測？
//   鼎新 TOPGP 同樣是「料件主檔」匯出，採購人員選的視角不同會拿到不同欄位名：
//     - 系統內部代碼：MB001, MB002, MB003...
//     - 中文標題：品號、品名、規格、大類碼、單位...
//     - 自訂視角：料號、PN、Part No、料件編號...
//   不能逼客戶改 Excel 欄位名 → 解析器自己認識所有變體
//
// 鼎新匯出 CSV 兩個常見坑（內建處理）：
//   1) BOM mark / Big5 編碼 — xlsx 套件會自動偵測
//   2) 數字欄位塞了千分位逗號、$、空白 — 解析後 normalize

import * as XLSX from "xlsx";
import type { ItemMaster, BomEntry, PurchaseRecord } from "./master-data-store";

// ============================================================
// 欄位別名表（中 / 英 / 鼎新內部代碼，全部小寫比對）
// ============================================================
const ALIAS = {
  // 共用
  partNo:   ["料號", "品號", "產品編號", "料件編號", "品項編號", "料件品號", "partno", "part_no", "part no", "partnumber", "part number", "item_code", "itemcode", "item code", "pn", "p/n", "mb001", "md003", "tg004"],
  name:     ["品名", "名稱", "料件名稱", "品項名稱", "中文品名", "子件品名", "用料品名", "name", "description", "desc", "說明", "item_name", "mb002"],
  spec:     ["規格", "型號", "spec", "specification", "model", "mb003"],
  category: ["商品分類", "大類", "大類碼", "中類", "類別", "商品別", "category", "commodity", "class", "group", "mb004", "mb005"],
  unit:     ["單位", "庫存單位", "計量單位", "用料單位", "uom", "unit", "mb007"],
  // BOM — 大量擴充鼎新 BOMR05 / BOMI01 / BOM210 常見變體
  parentPartNo: [
    "成品料號", "成品品號", "成品",
    "父品號", "父料號", "父件品號", "父件料號", "父件",
    "母件料號", "母件品號", "母件",
    "上階料號", "上階品號", "上階品名", "上階",
    "主件品號", "主件料號",
    "parent", "parent_partno", "parent partno", "parent part",
    "mb001", "ma001",
  ],
  childPartNo: [
    "子料號", "子品號", "子件品號", "子件料號", "子件",
    "下階料號", "下階品號", "下階",
    "用料料號", "用料品號", "用料",
    "成份料號", "成份品號",
    "child", "child_partno", "component", "component partno", "component_partno",
    "md003", "ma003",
  ],
  qty: [
    "用量", "數量",
    "期間用量", "本階用量", "BOM用量", "標準用量", "單位用量", "階用量",
    "用料量", "用料數", "用料用量",
    "qty", "quantity", "use_qty", "consumption", "每組用量",
    "md006", "ma006",
  ],
  level: [
    "階層", "階別", "階數", "層次", "BOM階別", "展階",
    "level", "lv", "階", "層",
  ],
  // 採購
  poNo:      ["採購單號", "單號", "採購單", "po", "po_no", "po no", "pono", "purchase_order", "th002"],
  supplier:  ["供應商", "供應商名稱", "供應商代號", "廠商", "廠商名稱", "廠商代號", "供應廠商", "supplier", "vendor", "vendor_name", "th004"],
  unitPrice: ["單價", "進價", "採購單價", "本幣單價", "原幣單價", "price", "unit_price", "unit price", "unitprice", "tg015"],
  currency:  ["幣別", "幣別代碼", "原幣", "currency", "curr", "th013"],
  date:      ["日期", "單據日期", "採購日期", "進貨日期", "立帳日期", "date", "po_date", "podate", "trans_date", "th003"],
};

type FieldKey = keyof typeof ALIAS;

// 把欄位名 normalize：去空白 / 去全形 / 小寫 / 移除冒號分隔
function normalizeHeader(h: string): string {
  return String(h ?? "")
    .replace(/[\s　:：()（）\[\]]/g, "")
    .toLowerCase();
}

function buildAliasIndex(): Map<string, FieldKey> {
  const m = new Map<string, FieldKey>();
  for (const [k, aliases] of Object.entries(ALIAS) as [FieldKey, string[]][]) {
    for (const a of aliases) m.set(normalizeHeader(a), k);
  }
  return m;
}
const ALIAS_INDEX = buildAliasIndex();

export type ColumnMapping = Partial<Record<FieldKey, string>>; // field → 原 CSV 欄位名

// 第一輪：自動偵測 — 看到認識的欄位名就 mapping
export function detectColumns(headers: string[], fileName?: string): ColumnMapping {
  const mapping: ColumnMapping = {};

  // 別名表 mapping
  for (const h of headers) {
    const norm = normalizeHeader(h);
    const field = ALIAS_INDEX.get(norm);
    if (field && !mapping[field]) {
      mapping[field] = h;
    }
  }

  // 報表代碼 profile mapping（補別名表沒抓到的）
  if (fileName) {
    const profile = matchReportProfile(fileName);
    if (profile) {
      for (const [field, candidates] of Object.entries(profile.hints) as [FieldKey, string[]][]) {
        if (mapping[field]) continue; // 已有就不蓋
        for (const candidate of candidates) {
          const exact = headers.find((h) => normalizeHeader(h) === normalizeHeader(candidate));
          if (exact) { mapping[field] = exact; break; }
          // 用包含關係 fallback
          const fuzzy = headers.find((h) => normalizeHeader(h).includes(normalizeHeader(candidate)));
          if (fuzzy) { mapping[field] = fuzzy; break; }
        }
      }
    }
  }

  return mapping;
}

// ============================================================
// 鼎新報表 profile — 用檔名前綴判斷是哪支報表，套用該報表特有的欄位名提示
//
// 為什麼還需要 profile？別名表已經夠用嗎？
//   別名表是「萬用」匹配（任何檔都會跑）。Profile 是「精準補強」：
//   - BOMR05 / BOMR0520260608.xlsx → 99% 是 BOM 多階正展 → 直接套用該報表
//     已知的非標準欄位名（例如「期間用量」、特殊的「上階品號」變體）
//   - 別名表會被「上階」誤匹配到 parentPartNo，但 BOMR05 同時有「上階品號」
//     跟「子件品號」，profile 強制用全名比對更準
// ============================================================
type ReportProfile = {
  code: string;            // 鼎新報表代碼
  type: "items" | "bom" | "purchases";
  description: string;
  hints: Partial<Record<FieldKey, string[]>>; // 該報表特有的欄位名候選
};

const REPORT_PROFILES: ReportProfile[] = [
  {
    code: "BOMR05",
    type: "bom",
    description: "BOM 多階正展列表",
    hints: {
      parentPartNo: ["上階品號", "上階料號", "父件品號", "母件品號"],
      childPartNo: ["子件品號", "子料品號", "用料品號"],
      qty: ["期間用量", "本階用量", "用料量"],
      level: ["階別", "階數"],
      unit: ["用料單位", "庫存單位"],
    },
  },
  {
    code: "BOMI01",
    type: "bom",
    description: "用料清單維護（單階）",
    hints: {
      parentPartNo: ["母件品號", "父件品號"],
      childPartNo: ["用料品號", "子件品號"],
      qty: ["用量", "標準用量"],
    },
  },
  {
    code: "BOM210",
    type: "bom",
    description: "BOM 多階正展列表（紙本掃描版式）",
    hints: {
      parentPartNo: ["父件品號", "父件料號"],
      childPartNo: ["子件品號"],
      qty: ["期間用量"],
      level: ["階別", "階數"],
    },
  },
  {
    code: "INVI03",
    type: "items",
    description: "料件基本資料維護",
    hints: {
      partNo: ["品號", "料件品號"],
      name: ["品名"],
      spec: ["規格"],
      category: ["大類碼", "中類"],
      unit: ["庫存單位"],
    },
  },
  {
    code: "INVR101",
    type: "items",
    description: "料件主檔清單",
    hints: {
      partNo: ["品號"],
      name: ["品名"],
      spec: ["規格"],
      category: ["大類", "中類"],
      unit: ["庫存單位"],
    },
  },
  {
    code: "INV101",
    type: "items",
    description: "品號查詢報表",
    hints: {
      partNo: ["品號"],
      name: ["品名"],
      spec: ["規格"],
    },
  },
  {
    code: "PURR06",
    type: "purchases",
    description: "採購單身查詢",
    hints: {
      poNo: ["採購單號", "單號"],
      partNo: ["品號"],
      supplier: ["廠商", "廠商名稱"],
      unitPrice: ["單價", "本幣單價"],
      currency: ["幣別"],
      qty: ["採購數量", "數量"],
      date: ["單據日期", "採購日期"],
    },
  },
  {
    code: "PURR05",
    type: "purchases",
    description: "採購單明細列印",
    hints: {
      poNo: ["採購單號"],
      partNo: ["品號"],
      supplier: ["廠商"],
      unitPrice: ["單價"],
      currency: ["幣別"],
      qty: ["數量"],
      date: ["單據日期"],
    },
  },
  {
    code: "PURR01",
    type: "purchases",
    description: "採購單明細查詢",
    hints: {
      poNo: ["單號"],
      partNo: ["品號"],
      supplier: ["廠商"],
      unitPrice: ["單價"],
      qty: ["數量"],
      date: ["日期"],
    },
  },
];

// 從檔名抽出鼎新報表代碼（檔名前綴 = 報表代碼）
// 例：BOMR0520260608.xlsx → BOMR05
//    INVI03_列印20260615.xlsx → INVI03
//    PURR06-2026Q2.xlsx → PURR06
export function matchReportProfile(fileName: string): ReportProfile | null {
  const base = fileName.replace(/\.(xlsx?|csv)$/i, "").toUpperCase();
  for (const profile of REPORT_PROFILES) {
    if (base.startsWith(profile.code.toUpperCase())) return profile;
  }
  return null;
}

export function listReportProfiles(): ReportProfile[] {
  return REPORT_PROFILES;
}

// ============================================================
// 檔案讀取 → header + 原始 row
// ============================================================
export type ParsedFile = {
  headers: string[];
  rows: Record<string, unknown>[];
};

export async function readFile(file: File): Promise<ParsedFile> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { headers: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

// ============================================================
// 數值正規化（鼎新匯出常見：千分位逗號 / $ / 空白 / 全形數字）
// ============================================================
function toNumber(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null || v === "") return 0;
  const s = String(v)
    .replace(/[,$\s　NT$NTD元USDＲＭＢ]/gi, "")
    .replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function toStr(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function toDateISO(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = toStr(v);
  if (!s) return "";
  // 鼎新常見：2026/05/27, 2026-05-27, 1150527 (民國年), 20260527
  const m1 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m1) return `${m1[1]}-${m1[2].padStart(2, "0")}-${m1[3].padStart(2, "0")}`;
  const m2 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  // 民國年（1150527 → 2026-05-27）
  const m3 = s.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (m3) {
    const y = parseInt(m3[1], 10) + 1911;
    return `${y}-${m3[2]}-${m3[3]}`;
  }
  return s;
}

// ============================================================
// 三種主檔的 row → typed 轉換
// ============================================================
export type ParseReport<T> = {
  rows: T[];
  skipped: number;     // 缺主鍵被跳過的列數
  warnings: string[];  // 給使用者看的提示
};

export function parseItems(parsed: ParsedFile, mapping: ColumnMapping): ParseReport<ItemMaster> {
  const out: ItemMaster[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  let dupes = 0;
  for (const r of parsed.rows) {
    const partNo = toStr(r[mapping.partNo ?? ""]);
    if (!partNo) { skipped++; continue; }
    if (seen.has(partNo)) { dupes++; continue; }
    seen.add(partNo);
    out.push({
      partNo,
      name: toStr(r[mapping.name ?? ""]),
      spec: mapping.spec ? toStr(r[mapping.spec]) || undefined : undefined,
      category: mapping.category ? toStr(r[mapping.category]) || undefined : undefined,
      unit: mapping.unit ? toStr(r[mapping.unit]) || undefined : undefined,
    });
  }
  const warnings: string[] = [];
  if (skipped > 0) warnings.push(`${skipped} 列因缺料號被跳過`);
  if (dupes > 0) warnings.push(`${dupes} 列料號重複（保留第一筆）`);
  if (!mapping.name) warnings.push("未偵測到「品名」欄位 — 後續分析無法顯示料件名稱");
  if (!mapping.category) warnings.push("未偵測到「商品分類」欄位 — STEP 3 無法 mapping LME / 指數價");
  return { rows: out, skipped, warnings };
}

export function parseBom(parsed: ParsedFile, mapping: ColumnMapping): ParseReport<BomEntry> {
  const out: BomEntry[] = [];
  let skipped = 0;
  for (const r of parsed.rows) {
    const parentPartNo = toStr(r[mapping.parentPartNo ?? ""]);
    const childPartNo = toStr(r[mapping.childPartNo ?? ""]);
    if (!parentPartNo || !childPartNo) { skipped++; continue; }
    const qty = toNumber(r[mapping.qty ?? ""]);
    out.push({
      parentPartNo,
      childPartNo,
      qty: qty > 0 ? qty : 1,
      unit: mapping.unit ? toStr(r[mapping.unit]) || undefined : undefined,
      level: mapping.level ? toNumber(r[mapping.level]) || undefined : undefined,
    });
  }
  const warnings: string[] = [];
  if (skipped > 0) warnings.push(`${skipped} 列因缺父料號或子料號被跳過`);
  if (!mapping.qty) warnings.push("未偵測到「用量」欄位 — 全部以 1 計算");
  return { rows: out, skipped, warnings };
}

export function parsePurchases(parsed: ParsedFile, mapping: ColumnMapping): ParseReport<PurchaseRecord> {
  const out: PurchaseRecord[] = [];
  let skipped = 0;
  for (const r of parsed.rows) {
    const partNo = toStr(r[mapping.partNo ?? ""]);
    const supplier = toStr(r[mapping.supplier ?? ""]);
    const unitPrice = toNumber(r[mapping.unitPrice ?? ""]);
    if (!partNo || !supplier || unitPrice <= 0) { skipped++; continue; }
    out.push({
      poNo: toStr(r[mapping.poNo ?? ""]),
      partNo,
      supplier,
      unitPrice,
      currency: mapping.currency ? toStr(r[mapping.currency]) || "TWD" : "TWD",
      qty: toNumber(r[mapping.qty ?? ""]),
      date: toDateISO(r[mapping.date ?? ""]),
    });
  }
  const warnings: string[] = [];
  if (skipped > 0) warnings.push(`${skipped} 列因缺料號 / 供應商 / 單價被跳過`);
  if (!mapping.date) warnings.push("未偵測到「日期」欄位 — 無法畫歷年漲價曲線");
  return { rows: out, skipped, warnings };
}
