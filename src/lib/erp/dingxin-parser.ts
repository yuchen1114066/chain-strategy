// 鼎新 ERP iGP 報表解析器（單向讀取，不回寫）
//
// 對應祺驊實際匯出的 4 種鼎新標準報表：
//   · INVR60 品號主檔  — 含「條碼編號」，掃 QR 對應料件
//   · LRPR05 庫存報表  — 含「庫存可用量」+ 計劃進貨排程
//   · BOMR05 BOM 報表  — 多階 BOM（元件/階次/主件/組成用量）
//   · CSTR07 製令成本  — 製令編號/產品/成本/開完工
//
// 部署流程（單向）：
//   鼎新 iGP → IT 定期匯出這 4 個報表 → 丟進 /erp/import → 系統解析顯示
//   倉庫掃 QR → 讀品號主檔 + 庫存報表 → 顯示（純讀，不寫回鼎新）

export type DingxinReportType =
  | "item_master"   // INVR60 品號主檔
  | "stock"         // LRPR05 庫存報表（異動別/預計結存）
  | "stock_qty"     // INVR18 庫存數量表（品號/庫存數量）
  | "stock_inout"   // INVR19 進銷存表（期初/期末庫存量）
  | "bom"           // BOMR05 BOM 報表
  | "wo_cost"       // CSTR07 製令成本分析表
  | "wo_cost_detail"// CSTR08 製令成本明細表（含領料明細）
  | "unknown";

type Cell = string | number | null | undefined;
type Aoa = Cell[][];

function cell(v: Cell): string {
  return v == null ? "" : String(v).trim();
}
// 去掉所有空白（鼎新標題常含填充空格，如「品       號」→「品號」）
function norm(v: Cell): string {
  return cell(v).replace(/\s+/g, "");
}
function numCell(v: Cell): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}
// 小計 / 合計列判斷（鼎新報表會夾小計列：品號空 or 含「小計」「合計」）
function isSubtotalRow(firstCol: Cell, anyCell: Cell[]): boolean {
  if (norm(firstCol) !== "") return false;
  return anyCell.some((c) => {
    const s = norm(c);
    return s.includes("小計") || s.includes("合計") || s.includes("總計");
  });
}

// ── 報表類型自動偵測（看標題列關鍵欄位；用 norm 去空白）──
export function detectReportType(aoa: Aoa): DingxinReportType {
  const header = (aoa[0] ?? []).map((c) => norm(c));
  const has = (s: string) => header.some((h) => h.includes(s));

  if (has("條碼編號") && has("品號屬性")) return "item_master";
  if (has("異動別") && has("預計結存") && has("庫別名稱")) return "stock";
  if (has("期初庫存量") && has("期末庫存量")) return "stock_inout"; // INVR19
  if (has("庫存數量") && has("品號") && !has("異動別")) return "stock_qty"; // INVR18
  if (has("元件品號") && has("階次") && has("主件品號")) return "bom";
  // CSTR08 須先判（領料明細欄）— 它是 CSTR07 的超集
  if (has("製令編號") && has("領料編號") && has("材料品號")) return "wo_cost_detail";
  if (has("製令編號") && has("產品品號") && has("材料成本")) return "wo_cost";
  return "unknown";
}

// ===================================================================
// INVR60 品號主檔
// ===================================================================
export type DxItem = {
  code: string;          // 品號
  barcode: string;       // 條碼編號（QR 掃這個）
  name: string;          // 品名
  spec: string;          // 規格
  unit: string;          // 庫存單位
  category: string;      // 品號分類名稱（大類）
  kind: string;          // 品號屬性 e.g. "M:自製件"
  mainWarehouse: string; // 主要庫別
  warehouseName: string; // 庫別名稱
  supplier: string;      // 廠商名稱
  abcGrade: string;      // ABC 等級
  inspectDays: number;   // 檢驗天數
};

export function parseItemMaster(aoa: Aoa): DxItem[] {
  const h = (aoa[0] ?? []).map((c) => cell(c));
  const idx = (name: string) => h.findIndex((x) => x === name);
  const iCode = idx("品號");
  const iBarcode = idx("條碼編號");
  const iName = idx("品名");
  const iSpec = idx("規格");
  const iUnit = idx("庫存單位");
  const iKind = idx("品號屬性");
  const iMainWh = idx("主要庫別");
  const iWhName = idx("庫別名稱");
  const iSupplier = idx("廠商名稱");
  const iAbc = idx("ABC等級");
  const iInsp = idx("檢驗天數");
  // 品號分類名稱有多欄重複，取第一個非空
  const catCols = h.map((x, i) => (x === "品號分類名稱" ? i : -1)).filter((i) => i >= 0);

  const out: DxItem[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const code = cell(row[iCode]);
    if (!code) continue;
    let category = "";
    for (const ci of catCols) {
      const v = cell(row[ci]);
      if (v && !v.startsWith("--")) { category = v; break; }
    }
    out.push({
      code,
      barcode: cell(row[iBarcode]),
      name: cell(row[iName]),
      spec: cell(row[iSpec]),
      unit: cell(row[iUnit]) || "PCS",
      category,
      kind: cell(row[iKind]),
      mainWarehouse: cell(row[iMainWh]),
      warehouseName: cell(row[iWhName]),
      supplier: cell(row[iSupplier]),
      abcGrade: cell(row[iAbc]),
      inspectDays: numCell(row[iInsp]),
    });
  }
  return out;
}

// ===================================================================
// LRPR05 庫存報表 — 重點：每個品號第一筆「庫存可用量:」= 現有可用量
// ===================================================================
export type DxStock = {
  code: string;
  name: string;
  spec: string;
  unit: string;
  available: number;            // 庫存可用量（現有）
  belowSafety: boolean;         // 結存 < 安全存量
  incoming: {                   // 計劃進貨排程
    date: string;
    qty: number;
    warehouse: string;
    warehouseName: string;
    runningBalance: number;
  }[];
};

export function parseStock(aoa: Aoa): DxStock[] {
  const h = (aoa[0] ?? []).map((c) => cell(c));
  const idx = (name: string) => h.findIndex((x) => x === name);
  const iCode = idx("品號");
  const iName = idx("品名");
  const iSpec = idx("規格");
  const iUnit = idx("單位");
  const iDate = idx("日期");
  const iType = idx("異動別");
  const iWh = idx("庫別");
  const iWhName = idx("庫別名稱");
  const iQty = idx("異動數量");
  const iBalance = idx("預計結存");
  const iBelow = idx("結存<安全存量");

  const map = new Map<string, DxStock>();
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const code = cell(row[iCode]);
    if (!code) continue;
    const type = cell(row[iType]);
    let s = map.get(code);
    if (!s) {
      s = {
        code,
        name: cell(row[iName]),
        spec: cell(row[iSpec]),
        unit: cell(row[iUnit]) || "PCS",
        available: 0,
        belowSafety: false,
        incoming: [],
      };
      map.set(code, s);
    }
    if (type.includes("庫存可用量")) {
      // 這列的「預計結存」= 現有可用量
      s.available = numCell(row[iBalance]);
      s.belowSafety = cell(row[iBelow]) !== "";
    } else if (type.includes("計劃進貨") || type.includes("計劃")) {
      s.incoming.push({
        date: cell(row[iDate]),
        qty: numCell(row[iQty]),
        warehouse: cell(row[iWh]),
        warehouseName: cell(row[iWhName]),
        runningBalance: numCell(row[iBalance]),
      });
    }
  }
  return [...map.values()];
}

// ===================================================================
// INVR18 庫存數量表 → DxStock[]
// 欄位：品號 / 品名 / 單位 / 小單位 / 庫別 / 庫別名稱 / 庫存數量
// 多庫別會分列，依品號加總；跳過「小計」列
// ===================================================================
export function parseStockQty(aoa: Aoa): DxStock[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const iCode = idx("品號");
  const iName = idx("品名");
  const iUnit = idx("單位");
  const iWh = idx("庫別");
  const iWhName = idx("庫別名稱");
  const iQty = idx("庫存數量");

  const map = new Map<string, DxStock>();
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    if (isSubtotalRow(row[iCode], row)) continue;
    const code = cell(row[iCode]);
    if (!code) continue;
    const qty = numCell(row[iQty]);
    let s = map.get(code);
    if (!s) {
      s = {
        code,
        name: cell(row[iName]),
        spec: "",
        unit: cell(row[iUnit]) || "PCS",
        available: 0,
        belowSafety: false,
        incoming: [],
      };
      map.set(code, s);
    }
    s.available += qty;
    const wh = cell(row[iWh]);
    if (wh && qty !== 0) {
      s.incoming.push({
        date: "",
        qty,
        warehouse: wh,
        warehouseName: cell(row[iWhName]),
        runningBalance: s.available,
      });
    }
  }
  return [...map.values()];
}

// ===================================================================
// INVR19 進銷存表 → DxStock[]
// 欄位（去空白後）：品號 / 品名 / 規格 / 單位 / 庫別代號 / 庫別名稱
//   / 期初庫存量 / … / 期末庫存量（目前庫存）
// 多庫別分列，依品號加總期末庫存量；跳過「小計」列
// ===================================================================
export function parseStockInout(aoa: Aoa): DxStock[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const iCode = idx("品號");
  const iName = idx("品名");
  const iSpec = idx("規格");
  const iUnit = idx("單位");
  const iWh = h.findIndex((x) => x === "庫別代號" || x === "庫別");
  const iWhName = idx("庫別名稱");
  const iClosing = idx("期末庫存量"); // 目前庫存

  const map = new Map<string, DxStock>();
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    if (isSubtotalRow(row[iCode], row)) continue;
    const code = cell(row[iCode]);
    if (!code) continue;
    const qty = numCell(row[iClosing]);
    let s = map.get(code);
    if (!s) {
      s = {
        code,
        name: cell(row[iName]),
        spec: cell(row[iSpec]),
        unit: cell(row[iUnit]) || "PCS",
        available: 0,
        belowSafety: false,
        incoming: [],
      };
      map.set(code, s);
    }
    s.available += qty;
    const wh = cell(row[iWh]);
    if (wh && qty !== 0) {
      s.incoming.push({
        date: "",
        qty,
        warehouse: wh,
        warehouseName: cell(row[iWhName]),
        runningBalance: s.available,
      });
    }
  }
  return [...map.values()];
}

// ===================================================================
// BOMR05 BOM 報表（多階）
// ===================================================================
export type DxBomLine = {
  componentCode: string; // 元件品號
  level: number;         // 階次（0 / .1 / ..2 ...）
  masterCode: string;    // 主件品號
  name: string;
  spec: string;
  unit: string;
  kind: string;          // 屬性
  qtyPerUnit: number;    // 組成用量
  batchQty: number;      // 標準批量
  scrapRate: number;     // 損耗率
  note: string;
};

function parseLevel(s: string): number {
  s = s.trim();
  if (s === "0") return 0;
  const m = s.match(/^\.+(\d+)$/);
  if (m) return parseInt(m[1], 10);
  const n = parseInt(s, 10);
  return isNaN(n) ? -1 : n;
}

export function parseBomReport(aoa: Aoa): DxBomLine[] {
  const h = (aoa[0] ?? []).map((c) => cell(c));
  const idx = (name: string) => h.findIndex((x) => x === name);
  const iComp = idx("元件品號");
  const iLevel = idx("階次");
  const iMaster = idx("主件品號");
  const iName = idx("品名");
  const iSpec = idx("規格");
  const iUnit = idx("單位");
  const iKind = idx("屬性");
  const iQty = idx("組成用量");
  const iBatch = idx("標準批量");
  const iScrap = idx("損耗率");
  const iNote = idx("備註");

  const out: DxBomLine[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const comp = cell(row[iComp]);
    if (!comp) continue;
    out.push({
      componentCode: comp,
      level: parseLevel(cell(row[iLevel])),
      masterCode: cell(row[iMaster]),
      name: cell(row[iName]),
      spec: cell(row[iSpec]),
      unit: cell(row[iUnit]) || "PCS",
      kind: cell(row[iKind]),
      qtyPerUnit: numCell(row[iQty]),
      batchQty: numCell(row[iBatch]),
      scrapRate: numCell(row[iScrap]),
      note: cell(row[iNote]),
    });
  }
  return out;
}

// ===================================================================
// CSTR07 製令成本（去重 — 鼎新匯出常有重複列）
// ===================================================================
export type DxWoCost = {
  woNo: string;          // 製令編號
  productCode: string;   // 產品品號
  productName: string;
  spec: string;
  unit: string;
  startDate: string;     // 實際開工
  finishDate: string;    // 實際完工
  producedQty: number;   // 已生產量
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  processingCost: number;
};

export function parseWoCost(aoa: Aoa): DxWoCost[] {
  const h = (aoa[0] ?? []).map((c) => cell(c));
  const idx = (name: string) => h.findIndex((x) => x === name);
  const iWo = idx("製令編號");
  const iProd = idx("產品品號");
  const iName = idx("產品品名");
  const iSpec = idx("產品規格");
  const iUnit = idx("單位");
  const iStart = idx("實際開工");
  const iFinish = idx("實際完工");
  const iQty = idx("已生產量");
  const iMat = idx("材料成本");
  const iLab = idx("人工成本");
  const iOh = idx("總製造費用");
  const iProc = idx("加工費用");

  const seen = new Set<string>();
  const out: DxWoCost[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const wo = cell(row[iWo]);
    if (!wo) continue;
    const key = `${wo}|${cell(row[iProd])}`;
    if (seen.has(key)) continue;  // 去重
    seen.add(key);
    out.push({
      woNo: wo,
      productCode: cell(row[iProd]),
      productName: cell(row[iName]),
      spec: cell(row[iSpec]),
      unit: cell(row[iUnit]) || "PCS",
      startDate: cell(row[iStart]),
      finishDate: cell(row[iFinish]),
      producedQty: numCell(row[iQty]),
      materialCost: numCell(row[iMat]),
      laborCost: numCell(row[iLab]),
      overheadCost: numCell(row[iOh]),
      processingCost: numCell(row[iProc]),
    });
  }
  return out;
}

// ===================================================================
// CSTR08 製令成本明細表 → DxWoCostDetail[]
// CSTR07 超集 + 領料明細（每張製令多列：1 列 = 1 個領用材料）
// 依製令編號分組：WO 表頭取首列，materials[] 收集所有領料列
// ===================================================================
export type DxWoMaterial = {
  materialCode: string;  // 材料品號
  materialName: string;
  materialSpec: string;
  unit: string;
  issueDate: string;     // 領料日期
  issueNo: string;       // 領料編號（追溯憑證）
  actualQty: number;     // 實際用量
  unitCost: number;      // 單位材料成本
  cost: number;          // 材料成本
};
export type DxWoCostDetail = DxWoCost & {
  productionCost: number;  // 生產成本
  unitProductionCost: number;
  materials: DxWoMaterial[];
};

export function parseWoCostDetail(aoa: Aoa): DxWoCostDetail[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (name: string) => h.findIndex((x) => x === name);
  const iWo = idx("製令編號");
  const iProd = idx("產品品號");
  const iName = idx("產品品名");
  const iSpec = idx("產品規格");
  const iUnit = h.findIndex((x) => x === "單位"); // 首個「單位」= 產品單位
  const iStart = idx("實際開工");
  const iFinish = idx("實際完工");
  const iQty = idx("已生產量");
  const iMat = idx("材料成本");
  const iLab = idx("人工成本");
  const iOh = idx("總製造費用");
  const iProc = idx("加工費用");
  const iProdCost = idx("生產成本");
  const iUnitProdCost = idx("單位生產成本");
  // 領料明細欄（材料品號之後）
  const iMatCode = idx("材料品號");
  const iMatName = idx("材料品名");
  const iMatSpec = idx("材料規格");
  const iIssueDate = idx("領料日期");
  const iIssueNo = idx("領料編號");
  const iActualQty = idx("實際用量");
  // 材料區的「單位/單位材料成本/材料成本」是後段欄位（材料品號之後）
  const iMatUnit = h.findIndex((x, i) => x === "單位" && i > iMatCode);
  const iMatUnitCost = h.findIndex((x, i) => x === "單位材料成本" && i > iMatCode);
  const iMatCost = h.findIndex((x, i) => x === "材料成本" && i > iMatCode);

  const map = new Map<string, DxWoCostDetail>();
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const wo = cell(row[iWo]);
    if (!wo) continue;
    let d = map.get(wo);
    if (!d) {
      d = {
        woNo: wo,
        productCode: cell(row[iProd]),
        productName: cell(row[iName]),
        spec: cell(row[iSpec]),
        unit: cell(row[iUnit]) || "PCS",
        startDate: cell(row[iStart]),
        finishDate: cell(row[iFinish]),
        producedQty: numCell(row[iQty]),
        materialCost: numCell(row[iMat]),
        laborCost: numCell(row[iLab]),
        overheadCost: numCell(row[iOh]),
        processingCost: numCell(row[iProc]),
        productionCost: numCell(row[iProdCost]),
        unitProductionCost: numCell(row[iUnitProdCost]),
        materials: [],
      };
      map.set(wo, d);
    }
    const mCode = cell(row[iMatCode]);
    if (mCode) {
      d.materials.push({
        materialCode: mCode,
        materialName: cell(row[iMatName]),
        materialSpec: cell(row[iMatSpec]),
        unit: iMatUnit >= 0 ? cell(row[iMatUnit]) : "",
        issueDate: cell(row[iIssueDate]),
        issueNo: cell(row[iIssueNo]),
        actualQty: numCell(row[iActualQty]),
        unitCost: iMatUnitCost >= 0 ? numCell(row[iMatUnitCost]) : 0,
        cost: iMatCost >= 0 ? numCell(row[iMatCost]) : 0,
      });
    }
  }
  return [...map.values()];
}

// ── 統一入口：給 AOA 自動判型 + 解析 ──
export type ParsedDingxin =
  | { type: "item_master"; rows: DxItem[] }
  | { type: "stock"; rows: DxStock[] }
  | { type: "stock_qty"; rows: DxStock[] }
  | { type: "stock_inout"; rows: DxStock[] }
  | { type: "bom"; rows: DxBomLine[] }
  | { type: "wo_cost"; rows: DxWoCost[] }
  | { type: "wo_cost_detail"; rows: DxWoCostDetail[] }
  | { type: "unknown"; rows: never[] };

export function parseDingxinReport(aoa: Aoa): ParsedDingxin {
  const t = detectReportType(aoa);
  switch (t) {
    case "item_master":    return { type: t, rows: parseItemMaster(aoa) };
    case "stock":          return { type: t, rows: parseStock(aoa) };
    case "stock_qty":      return { type: t, rows: parseStockQty(aoa) };
    case "stock_inout":    return { type: t, rows: parseStockInout(aoa) };
    case "bom":            return { type: t, rows: parseBomReport(aoa) };
    case "wo_cost":        return { type: t, rows: parseWoCost(aoa) };
    case "wo_cost_detail": return { type: t, rows: parseWoCostDetail(aoa) };
    default:               return { type: "unknown", rows: [] };
  }
}

export const REPORT_LABEL: Record<DingxinReportType, string> = {
  item_master: "INVR60 品號主檔",
  stock: "LRPR05 庫存報表",
  stock_qty: "INVR18 庫存數量表",
  stock_inout: "INVR19 進耗存統計表",
  bom: "BOMR05 BOM 報表",
  wo_cost: "CSTR07 製令成本分析表",
  wo_cost_detail: "CSTR08 製令成本明細表（含領料）",
  unknown: "未知格式",
};
