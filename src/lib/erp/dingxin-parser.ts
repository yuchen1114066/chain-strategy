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
  | "product_usage" // CSTR11 製令用料分析（依產品彙總）
  | "shipment"      // EPSR13 出貨通知明細
  | "purchase"      // IPSR02 採購進貨明細
  | "wo_progress"   // MOCR10 製令明細表（製令進度/狀態）
  | "mat_issue"     // MOCR11 領料明細表
  | "mat_return"    // MOCR12 退料明細表
  | "outsource"     // MOCR14 託外進貨單明細表
  | "wo_hours"      // CSTR02 製令工時表
  | "wo_demand"     // MOCR25 製令需求檢視表
  | "wo_unissued"   // MOCR43 製令未領料明細表
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
  if (has("出貨通知單號") && has("出貨數量")) return "shipment";       // EPSR13
  if (has("採購單號") && has("採購數量") && has("進貨數量")) return "purchase"; // IPSR02
  // MOC 系列
  if (has("託外進貨單號") && has("驗收數量")) return "outsource";      // MOCR14
  if (has("製令編號") && has("狀態碼") && has("預計產量")) return "wo_progress"; // MOCR10
  if (has("領料單號") && has("領料數量") && has("製令單號")) return "mat_issue"; // MOCR11
  if (has("退料單號") && has("退料數量")) return "mat_return";         // MOCR12
  if (has("製令單號") && has("使用人時") && has("使用機時")) return "wo_hours"; // CSTR02
  if (has("料件品號") && has("庫存結餘") && has("預計領用日")) return "wo_demand"; // MOCR25
  if (has("製令單號") && has("應領料量") && has("未領料量")) return "wo_unissued"; // MOCR43
  // CSTR08 須先判（領料明細欄）— 它是 CSTR07 的超集
  if (has("製令編號") && has("領料編號") && has("材料品號")) return "wo_cost_detail";
  if (has("製令編號") && has("產品品號") && has("材料成本")) return "wo_cost";
  // CSTR11：產品彙總用料（無製令編號，有生產數量+單位用量）
  if (has("產品品號") && has("生產數量") && has("單位用量")) return "product_usage";
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

// ===================================================================
// EPSR13 出貨通知明細 → DxShipment[]
// 真實出貨資料（客戶/裝船日/ETD/ETA/出貨數量）
// ===================================================================
export type DxShipment = {
  noticeNo: string;       // 出貨通知單號
  noticeDate: string;     // 通知日期
  customsDate: string;    // 結關日
  shipDate: string;       // 裝船日
  customerCode: string;
  customerName: string;
  salesPerson: string;    // 業務員名稱
  currency: string;       // 交易幣別
  eta: string;            // E.T.A
  etd: string;            // E.T.D
  saleNo: string;         // 銷貨單號
  saleDate: string;       // 銷貨日期
  itemCode: string;       // 品號
  itemName: string;
  spec: string;
  unit: string;
  shipQty: number;        // 出貨數量
  unitPrice: number;
  amount: number;
  orderNo: string;        // 訂單單號
};

export function parseShipment(aoa: Aoa): DxShipment[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    noticeNo: idx("出貨通知單號"), noticeDate: idx("通知日期"),
    customsDate: idx("結關日"), shipDate: idx("裝船日"),
    custCode: idx("客戶代號"), custName: idx("客戶名稱"),
    sales: idx("業務員名稱"), currency: idx("交易幣別"),
    eta: idx("E.T.A"), etd: idx("E.T.D"),
    saleNo: idx("銷貨單號"), saleDate: idx("銷貨日期"),
    itemCode: idx("品號"), itemName: idx("品名"), spec: idx("規格"),
    unit: idx("單位"), shipQty: idx("出貨數量"),
    price: idx("單價"), amount: idx("金額"), orderNo: idx("訂單單號"),
  };
  const out: DxShipment[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    if (isSubtotalRow(row[i.noticeNo], row)) continue;
    const noticeNo = cell(row[i.noticeNo]);
    const itemCode = cell(row[i.itemCode]);
    if (!noticeNo && !itemCode) continue;
    out.push({
      noticeNo, noticeDate: cell(row[i.noticeDate]),
      customsDate: cell(row[i.customsDate]), shipDate: cell(row[i.shipDate]),
      customerCode: cell(row[i.custCode]), customerName: cell(row[i.custName]),
      salesPerson: cell(row[i.sales]), currency: cell(row[i.currency]),
      eta: cell(row[i.eta]), etd: cell(row[i.etd]),
      saleNo: cell(row[i.saleNo]), saleDate: cell(row[i.saleDate]),
      itemCode, itemName: cell(row[i.itemName]), spec: cell(row[i.spec]),
      unit: cell(row[i.unit]) || "PCS", shipQty: numCell(row[i.shipQty]),
      unitPrice: numCell(row[i.price]), amount: numCell(row[i.amount]),
      orderNo: cell(row[i.orderNo]),
    });
  }
  return out;
}

// ===================================================================
// IPSR02 採購進貨明細 → DxPurchase[]
// 採購單 + 進貨（採購量 vs 進貨量 / 預交日）→ 缺料預測、計劃進貨
// ===================================================================
export type DxPurchase = {
  poDate: string;         // 採購日期
  poNo: string;           // 採購單號
  supplierCode: string;
  supplierName: string;   // 簡稱
  expectedDate: string;   // 預交日期
  itemCode: string;
  itemName: string;
  spec: string;
  orderedQty: number;     // 採購數量
  receivedQty: number;    // 進貨數量
  openQty: number;        // 未交量 = 採購 - 進貨
  customsDate: string;    // 報關日期
  inspectDate: string;    // 驗收日期
  receiptNo: string;      // 進貨單號
};

export function parsePurchase(aoa: Aoa): DxPurchase[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    poDate: idx("採購日期"), poNo: idx("採購單號"),
    supCode: idx("廠商代號"), supName: idx("簡稱"),
    expected: idx("預交日期"),
    itemCode: idx("品號"), itemName: idx("品名"), spec: idx("規格"),
    ordered: idx("採購數量"), received: idx("進貨數量"),
    customs: idx("報關日期"), inspect: idx("驗收日期"),
    receiptNo: idx("進貨單號"),
  };
  const out: DxPurchase[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    if (isSubtotalRow(row[i.poNo], row)) continue;
    const poNo = cell(row[i.poNo]);
    const itemCode = cell(row[i.itemCode]);
    if (!poNo && !itemCode) continue;
    const ordered = numCell(row[i.ordered]);
    const received = numCell(row[i.received]);
    out.push({
      poDate: cell(row[i.poDate]), poNo,
      supplierCode: cell(row[i.supCode]), supplierName: cell(row[i.supName]),
      expectedDate: cell(row[i.expected]),
      itemCode, itemName: cell(row[i.itemName]), spec: cell(row[i.spec]),
      orderedQty: ordered, receivedQty: received,
      openQty: Math.max(0, ordered - received),
      customsDate: cell(row[i.customs]), inspectDate: cell(row[i.inspect]),
      receiptNo: cell(row[i.receiptNo]),
    });
  }
  return out;
}

// ===================================================================
// CSTR11 製令用料分析 → DxProductUsage[]
// 每個產品實際用料彙總（依產品分組，含單位用量 → 對比標準 BOM）
// ===================================================================
export type DxProductUsage = {
  productCode: string;
  productName: string;
  spec: string;
  unit: string;
  productionQty: number;  // 生產數量
  materials: {
    materialCode: string;
    materialName: string;
    spec: string;
    unit: string;
    unitPrice: number;
    qty: number;          // 數量（總用量）
    unitUsage: number;    // 單位用量
    amount: number;
  }[];
};

export function parseProductUsage(aoa: Aoa): DxProductUsage[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  // 重複欄名：[單位][品名][規格] 出現兩次（產品 / 材料）
  const firstIdx = (n: string) => h.findIndex((x) => x === n);
  const secondIdx = (n: string, after: number) => h.findIndex((x, k) => x === n && k > after);
  const iProd = firstIdx("產品品號");
  const iProdUnit = firstIdx("單位");
  const iProdName = firstIdx("品名");
  const iProdSpec = firstIdx("規格");
  const iProdQty = firstIdx("生產數量");
  const iMatCode = firstIdx("材料品號");
  const iMatUnit = secondIdx("單位", iMatCode);
  const iMatName = secondIdx("品名", iMatCode);
  const iMatSpec = secondIdx("規格", iMatCode);
  const iPrice = firstIdx("單價");
  const iQty = firstIdx("數量");
  const iUnitUsage = firstIdx("單位用量");
  const iAmount = firstIdx("金額");

  const map = new Map<string, DxProductUsage>();
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const prod = cell(row[iProd]);
    if (!prod) continue;
    let p = map.get(prod);
    if (!p) {
      p = {
        productCode: prod,
        productName: cell(row[iProdName]),
        spec: cell(row[iProdSpec]),
        unit: cell(row[iProdUnit]) || "PCS",
        productionQty: numCell(row[iProdQty]),
        materials: [],
      };
      map.set(prod, p);
    }
    const mCode = cell(row[iMatCode]);
    if (mCode) {
      p.materials.push({
        materialCode: mCode,
        materialName: iMatName >= 0 ? cell(row[iMatName]) : "",
        spec: iMatSpec >= 0 ? cell(row[iMatSpec]) : "",
        unit: iMatUnit >= 0 ? cell(row[iMatUnit]) : "",
        unitPrice: numCell(row[iPrice]),
        qty: numCell(row[iQty]),
        unitUsage: numCell(row[iUnitUsage]),
        amount: numCell(row[iAmount]),
      });
    }
  }
  return [...map.values()];
}

// ===================================================================
// MOCR10 製令明細表 → DxWoProgress[]
// 製令狀態 / 預計vs已生產 / 預計開完工 / 急料 → 戰情室八階段追蹤
// ===================================================================
export type DxWoProgress = {
  woNo: string;           // 製令編號
  confirmDate: string;    // 確認日期
  confirmCode: string;    // 確認碼
  statusCode: string;     // 狀態碼（已完工/生產中…）
  productCode: string;
  productName: string;
  spec: string;
  unit: string;
  plannedQty: number;     // 預計產量
  producedQty: number;    // 已生產量
  issuedSets: number;     // 已領套數
  unproducedQty: number;  // 未生產量
  orderDate: string;      // 開單日期
  plannedStart: string;   // 預計開工
  plannedFinish: string;  // 預計完工
  urgent: string;         // 急料
  processor: string;      // 加工廠商名稱（託外）
  warehouseName: string;
};

export function parseWoProgress(aoa: Aoa): DxWoProgress[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    wo: idx("製令編號"), cfDate: idx("確認日期"), cfCode: idx("確認碼"),
    status: idx("狀態碼"), prod: idx("產品品號"), unit: idx("單位"),
    name: idx("品名"), spec: idx("規格"),
    planned: idx("預計產量"), produced: idx("已生產量"),
    sets: idx("已領套數"), unprod: idx("未生產量"),
    orderDate: idx("開單日期"), pStart: idx("預計開工"), pFinish: idx("預計完工"),
    urgent: idx("急料"), processor: idx("廠商名稱"), whName: idx("庫別名稱"),
  };
  const out: DxWoProgress[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const wo = cell(row[i.wo]);
    if (!wo) continue;
    out.push({
      woNo: wo, confirmDate: cell(row[i.cfDate]), confirmCode: cell(row[i.cfCode]),
      statusCode: cell(row[i.status]),
      productCode: cell(row[i.prod]), productName: cell(row[i.name]),
      spec: cell(row[i.spec]), unit: cell(row[i.unit]) || "PCS",
      plannedQty: numCell(row[i.planned]), producedQty: numCell(row[i.produced]),
      issuedSets: numCell(row[i.sets]), unproducedQty: numCell(row[i.unprod]),
      orderDate: cell(row[i.orderDate]), plannedStart: cell(row[i.pStart]),
      plannedFinish: cell(row[i.pFinish]), urgent: cell(row[i.urgent]),
      processor: cell(row[i.processor]), warehouseName: cell(row[i.whName]),
    });
  }
  return out;
}

// ===================================================================
// MOCR11 領料明細表 / MOCR12 退料明細表 → DxMaterialMove[]
// 含批號 + 儲存位置 → 批號追溯
// ===================================================================
export type DxMaterialMove = {
  direction: "issue" | "return"; // 領料 / 退料
  date: string;
  docNo: string;          // 領料單號 / 退料單號
  materialCode: string;
  materialName: string;
  spec: string;
  qty: number;            // 領料數量 / 退料數量
  unit: string;
  process: string;        // 製程
  woNo: string;           // 製令單號
  warehouseName: string;
  location: string;       // 儲存位置
  batchNo: string;        // 批號
};

function parseMaterialMove(aoa: Aoa, dir: "issue" | "return"): DxMaterialMove[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const iDate = dir === "issue" ? idx("領料日期") : idx("退料日期");
  const iDoc = dir === "issue" ? idx("領料單號") : idx("退料單號");
  const iQty = dir === "issue" ? idx("領料數量") : idx("退料數量");
  const iMat = idx("材料品號");
  const iName = idx("品名");
  const iSpec = idx("規格");
  const iUnit = idx("單位");
  const iProc = idx("製程");
  const iWo = idx("製令單號");
  const iWh = idx("庫別名稱");
  const iLoc = idx("儲存位置");
  const iBatch = idx("批號");
  const out: DxMaterialMove[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const mat = cell(row[iMat]);
    if (!mat) continue;
    out.push({
      direction: dir,
      date: cell(row[iDate]), docNo: cell(row[iDoc]),
      materialCode: mat, materialName: cell(row[iName]), spec: cell(row[iSpec]),
      qty: numCell(row[iQty]), unit: cell(row[iUnit]) || "PCS",
      process: cell(row[iProc]), woNo: cell(row[iWo]),
      warehouseName: cell(row[iWh]), location: cell(row[iLoc]),
      batchNo: cell(row[iBatch]),
    });
  }
  return out;
}
export const parseMaterialIssue = (aoa: Aoa) => parseMaterialMove(aoa, "issue");
export const parseMaterialReturn = (aoa: Aoa) => parseMaterialMove(aoa, "return");

// ===================================================================
// MOCR14 託外進貨單明細表 → DxOutsourceReceipt[]
// 委外倉管理：加工廠商/進貨/驗收/逾期/檢驗狀態/驗退
// ===================================================================
export type DxOutsourceReceipt = {
  receiptDate: string;    // 進貨日期
  receiptNo: string;      // 託外進貨單號
  processorCode: string;  // 加工廠商代號
  processorName: string;  // 加工廠商簡稱
  itemCode: string;
  itemName: string;
  spec: string;
  process: string;        // 製程名稱
  inspectDate: string;    // 驗收日期
  receivedQty: number;    // 進貨數量
  inspectedQty: number;   // 驗收數量
  scrapQty: number;       // 報廢數量
  rejectedQty: number;    // 驗退數量
  overdue: string;        // 逾期
  inspectStatus: string;  // 檢驗狀態
  woNo: string;           // 製令單號
  batchNo: string;        // 批號
  urgent: string;         // 急料
};

export function parseOutsourceReceipt(aoa: Aoa): DxOutsourceReceipt[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    date: idx("進貨日期"), no: idx("託外進貨單號"),
    pCode: idx("加工廠商代號"), pName: idx("加工廠商簡稱"),
    itemCode: idx("品號"), itemName: idx("品名"), spec: idx("規格"),
    proc: idx("製程名稱"), inspectDate: idx("驗收日期"),
    received: idx("進貨數量"), inspected: idx("驗收數量"),
    scrap: idx("報廢數量"), rejected: idx("驗退數量"),
    overdue: idx("逾期"), inspectStatus: idx("檢驗狀態"),
    wo: idx("製令單號"), batch: idx("批號"), urgent: idx("急料"),
  };
  const out: DxOutsourceReceipt[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const itemCode = cell(row[i.itemCode]);
    const no = cell(row[i.no]);
    if (!itemCode && !no) continue;
    out.push({
      receiptDate: cell(row[i.date]), receiptNo: no,
      processorCode: cell(row[i.pCode]), processorName: cell(row[i.pName]),
      itemCode, itemName: cell(row[i.itemName]), spec: cell(row[i.spec]),
      process: cell(row[i.proc]), inspectDate: cell(row[i.inspectDate]),
      receivedQty: numCell(row[i.received]), inspectedQty: numCell(row[i.inspected]),
      scrapQty: numCell(row[i.scrap]), rejectedQty: numCell(row[i.rejected]),
      overdue: cell(row[i.overdue]), inspectStatus: cell(row[i.inspectStatus]),
      woNo: cell(row[i.wo]), batchNo: cell(row[i.batch]), urgent: cell(row[i.urgent]),
    });
  }
  return out;
}

// ===================================================================
// CSTR02 製令工時表 → DxWoHours[]
// 製令 / 線別 / 人時 / 機時 → 產能、工時分析
// ===================================================================
export type DxWoHours = {
  woNo: string;
  productCode: string;
  productName: string;
  spec: string;
  lineCode: string;
  lineName: string;
  date: string;
  laborHours: number;     // 使用人時
  machineHours: number;   // 使用機時
};

export function parseWoHours(aoa: Aoa): DxWoHours[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    wo: idx("製令單號"), prod: idx("產品品號"), name: idx("品名"),
    spec: idx("規格"), lineCode: idx("線別代號"), lineName: idx("線別名稱"),
    date: idx("日期"), labor: idx("使用人時"), machine: idx("使用機時"),
  };
  const out: DxWoHours[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const wo = cell(row[i.wo]);
    if (!wo) continue;
    out.push({
      woNo: wo, productCode: cell(row[i.prod]), productName: cell(row[i.name]),
      spec: cell(row[i.spec]), lineCode: cell(row[i.lineCode]),
      lineName: cell(row[i.lineName]), date: cell(row[i.date]),
      laborHours: numCell(row[i.labor]), machineHours: numCell(row[i.machine]),
    });
  }
  return out;
}

// ===================================================================
// MOCR25 製令需求檢視表 → DxWoDemand[]
// 料件需求 vs 庫存結餘（負 = 缺料）→ 缺料牆
// ===================================================================
export type DxWoDemand = {
  materialCode: string;
  materialName: string;
  spec: string;
  unit: string;
  onHand: number;         // 現有庫存
  plannedIn: number;      // 預計入庫
  expectedUseDate: string;// 預計領用日
  expectedQty: number;    // 預計用量
  accumQty: number;       // 累計用量
  stockBalance: number;   // 庫存結餘（負=缺料）
  woNo: string;           // 製令編號
  productCode: string;
  urgent: string;
  orderNo: string;
  warehouseName: string;
};

export function parseWoDemand(aoa: Aoa): DxWoDemand[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    mat: idx("料件品號"), unit: idx("單位"), name: idx("品名"), spec: idx("規格"),
    onHand: idx("現有庫存"), plannedIn: idx("預計入庫"),
    useDate: idx("預計領用日"), expQty: idx("預計用量"), accumQty: idx("累計用量"),
    balance: idx("庫存結餘"), wo: idx("製令編號"), prod: idx("產品品號"),
    urgent: idx("急料"), order: idx("訂單單號"), whName: idx("庫別名稱"),
  };
  const out: DxWoDemand[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const mat = cell(row[i.mat]);
    if (!mat) continue;
    out.push({
      materialCode: mat, materialName: cell(row[i.name]), spec: cell(row[i.spec]),
      unit: cell(row[i.unit]) || "PCS",
      onHand: numCell(row[i.onHand]), plannedIn: numCell(row[i.plannedIn]),
      expectedUseDate: cell(row[i.useDate]), expectedQty: numCell(row[i.expQty]),
      accumQty: numCell(row[i.accumQty]), stockBalance: numCell(row[i.balance]),
      woNo: cell(row[i.wo]), productCode: cell(row[i.prod]),
      urgent: cell(row[i.urgent]), orderNo: cell(row[i.order]),
      warehouseName: cell(row[i.whName]),
    });
  }
  return out;
}

// ===================================================================
// MOCR43 製令未領料明細表 → DxWoUnissued[]
// 應領 vs 未領料量 + 庫存數量 → 欠料牆
// ===================================================================
export type DxWoUnissued = {
  itemCode: string;
  itemName: string;
  spec: string;
  unit: string;
  woNo: string;           // 製令單號
  urgent: string;
  needQty: number;        // 應領料量
  unissuedQty: number;    // 未領料量
  process: string;        // 製程代號
  warehouse: string;
  location: string;       // 儲存位置
  materialType: string;   // 材料型態
  stockQty: number;       // 庫存數量
};

export function parseWoUnissued(aoa: Aoa): DxWoUnissued[] {
  const h = (aoa[0] ?? []).map((c) => norm(c));
  const idx = (n: string) => h.findIndex((x) => x === n);
  const i = {
    item: idx("品號"), unit: idx("單位"), name: idx("品名"), spec: idx("規格"),
    wo: idx("製令單號"), urgent: idx("急料"),
    need: idx("應領料量"), unissued: idx("未領料量"),
    proc: idx("製程代號"), wh: idx("庫別"), loc: idx("儲存位置"),
    matType: idx("材料型態"), stock: idx("庫存數量"),
  };
  const out: DxWoUnissued[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] ?? [];
    const item = cell(row[i.item]);
    if (!item) continue;
    out.push({
      itemCode: item, itemName: cell(row[i.name]), spec: cell(row[i.spec]),
      unit: cell(row[i.unit]) || "PCS",
      woNo: cell(row[i.wo]), urgent: cell(row[i.urgent]),
      needQty: numCell(row[i.need]), unissuedQty: numCell(row[i.unissued]),
      process: cell(row[i.proc]), warehouse: cell(row[i.wh]),
      location: cell(row[i.loc]), materialType: cell(row[i.matType]),
      stockQty: numCell(row[i.stock]),
    });
  }
  return out;
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
  | { type: "product_usage"; rows: DxProductUsage[] }
  | { type: "shipment"; rows: DxShipment[] }
  | { type: "purchase"; rows: DxPurchase[] }
  | { type: "wo_progress"; rows: DxWoProgress[] }
  | { type: "mat_issue"; rows: DxMaterialMove[] }
  | { type: "mat_return"; rows: DxMaterialMove[] }
  | { type: "outsource"; rows: DxOutsourceReceipt[] }
  | { type: "wo_hours"; rows: DxWoHours[] }
  | { type: "wo_demand"; rows: DxWoDemand[] }
  | { type: "wo_unissued"; rows: DxWoUnissued[] }
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
    case "product_usage":  return { type: t, rows: parseProductUsage(aoa) };
    case "shipment":       return { type: t, rows: parseShipment(aoa) };
    case "purchase":       return { type: t, rows: parsePurchase(aoa) };
    case "wo_progress":    return { type: t, rows: parseWoProgress(aoa) };
    case "mat_issue":      return { type: t, rows: parseMaterialIssue(aoa) };
    case "mat_return":     return { type: t, rows: parseMaterialReturn(aoa) };
    case "outsource":      return { type: t, rows: parseOutsourceReceipt(aoa) };
    case "wo_hours":       return { type: t, rows: parseWoHours(aoa) };
    case "wo_demand":      return { type: t, rows: parseWoDemand(aoa) };
    case "wo_unissued":    return { type: t, rows: parseWoUnissued(aoa) };
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
  product_usage: "CSTR11 製令用料分析",
  shipment: "EPSR13 出貨通知明細",
  purchase: "IPSR02 採購進貨明細",
  wo_progress: "MOCR10 製令明細表（進度）",
  mat_issue: "MOCR11 領料明細表",
  mat_return: "MOCR12 退料明細表",
  outsource: "MOCR14 託外進貨明細表",
  wo_hours: "CSTR02 製令工時表",
  wo_demand: "MOCR25 製令需求檢視表",
  wo_unissued: "MOCR43 製令未領料明細表",
  unknown: "未知格式",
};
