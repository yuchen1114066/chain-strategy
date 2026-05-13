// 祺驊 BOM Excel 解析器
// 對應欄位（已從 FB11G003 / FB44H013 / FB44H035-A3 / FH63H007 / FB93B003 截圖確認）：
//   A 主件品號  B 階次  C 元件品號  D 品名  E 規格  F 單位
//   G 屬性     H 標準批量  I 標準用量  J 材料單價(目前+未來)  K 標準成本  L 廠商
//   M 材料單價(2023.01)  N 售成本  O 備註
//
// 階次符號：0（主件本身）/ .1 / ..2 / ...3 / ....4 / .....5
// 屬性：自製件 / 採購件 / 虛設品號 / Feature件 / 託外加工件

import type { PartKind } from "./types";

export type RawBomRow = {
  rowNumber: number;
  masterCode: string;        // A
  level: number;             // 從 B 的點數推導
  componentCode: string;     // C
  name: string;              // D
  spec: string;              // E
  unit: string;              // F
  kind: PartKind;            // G 屬性 → 映射
  batchQty: number;          // H 標準批量
  qtyPerUnit: number;        // I 標準用量
  unitCostNow: number;       // J 材料單價(目前+未來)
  stdCost: number;           // K 標準成本
  supplierName: string;      // L 廠商
  unitCost2023: number;      // M 材料單價(2023.01)
  saleCost: number;          // N 售成本
  notes: string;             // O 備註
};

export type ParsedBom = {
  masterCode: string;        // FB11G003
  masterName: string;        // 雙向多相式發電機（從階 0 的 D 欄）
  masterSpec: string;        // ψ250×35-...（從階 0 的 E 欄）
  masterStdCost: number;     // 階 0 的 K
  rows: RawBomRow[];         // 不含階 0 的所有子件
  // 副產品：解析時看到的所有獨特廠商
  suppliersFound: string[];
  // 解析過程的警告
  warnings: string[];
};

// 階次符號 ".1" → 1，"..2" → 2，"0" → 0
export function parseLevel(s: string | number | null | undefined): number {
  if (s == null) return -1;
  const str = String(s).trim();
  if (str === "" || str === "—") return -1;
  if (str === "0") return 0;
  // 數點：".1" / "..2" / "....4"
  const dotMatch = str.match(/^\.+(\d+)$/);
  if (dotMatch) return parseInt(dotMatch[1], 10);
  const digit = parseInt(str, 10);
  if (!isNaN(digit)) return digit;
  return -1;
}

// 屬性中文 → PartKind
export function parseKind(s: string | null | undefined): PartKind {
  if (!s) return "purchase";
  const str = String(s).trim();
  if (str.includes("自製")) return "self";
  if (str.includes("採購")) return "purchase";
  if (str.includes("虛設")) return "dummy";
  if (str.includes("Feature")) return "feature";
  if (str.includes("Option")) return "option";
  if (str.includes("託外") || str.includes("外加工")) return "outsource";
  return "purchase";
}

// 從一個 AOA（array of arrays，xlsx.utils.sheet_to_json with header:1）解析
export function parseBomAoa(aoa: (string | number | null | undefined)[][]): ParsedBom {
  const warnings: string[] = [];
  const rows: RawBomRow[] = [];
  let masterCode = "";
  let masterName = "";
  let masterSpec = "";
  let masterStdCost = 0;
  const suppliersFound = new Set<string>();

  // 找標題列（含「主件品號」「階次」「元件品號」等關鍵字）
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const cells = (aoa[i] ?? []).map((c) => String(c ?? "").trim());
    if (cells.some((c) => c.includes("主件品號") || c.includes("主件"))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx < 0) {
    warnings.push("找不到標題列（預期含「主件品號」等字樣），假定從第 1 列開始解析");
    headerRowIdx = -1;
  }

  // 從標題列下一行開始
  const startRow = headerRowIdx + 1;
  for (let i = startRow; i < aoa.length; i++) {
    const row = aoa[i] ?? [];
    if (row.length === 0) continue;
    const cellA = String(row[0] ?? "").trim();
    if (!cellA) continue;

    const level = parseLevel(row[1]);
    const componentCode = String(row[2] ?? "").trim();
    const name = String(row[3] ?? "").trim();
    const spec = String(row[4] ?? "").trim();
    const unit = String(row[5] ?? "").trim() || "PCS";
    const kindRaw = String(row[6] ?? "").trim();
    const kind = parseKind(kindRaw);
    const batchQty = num(row[7], 1);
    const qtyPerUnit = num(row[8], 0);
    const unitCostNow = num(row[9], 0);
    const stdCost = num(row[10], 0);
    const supplierName = String(row[11] ?? "").trim();
    const unitCost2023 = num(row[12], 0);
    const saleCost = num(row[13], 0);
    const notes = String(row[14] ?? "").trim();

    if (level === 0) {
      // 主件本身
      masterCode = cellA;
      masterName = name;
      masterSpec = spec;
      masterStdCost = stdCost;
      continue;
    }
    if (level < 0) {
      warnings.push(`R${i + 1}: 階次無法判讀「${row[1]}」, 跳過`);
      continue;
    }
    if (!componentCode) {
      warnings.push(`R${i + 1}: 元件品號為空，跳過`);
      continue;
    }
    if (supplierName) suppliersFound.add(supplierName);
    rows.push({
      rowNumber: i + 1,
      masterCode: cellA,
      level,
      componentCode,
      name,
      spec,
      unit,
      kind,
      batchQty,
      qtyPerUnit,
      unitCostNow,
      stdCost,
      supplierName,
      unitCost2023,
      saleCost,
      notes,
    });
  }

  return {
    masterCode,
    masterName,
    masterSpec,
    masterStdCost,
    rows,
    suppliersFound: [...suppliersFound],
    warnings,
  };
}

function num(v: unknown, def: number): number {
  if (v == null || v === "") return def;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? def : n;
}
