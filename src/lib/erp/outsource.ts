// 委外加工管理 — 運動器材業常見：電鍍 / 烤漆 / 熱處理 / 外包焊接
// 對應鼎新 MOCR14 託外進貨；此處為 demo seed，正式接 MOCR14 後替換

export type OutsourceProcess = "電鍍" | "烤漆" | "熱處理" | "外包焊接" | "託外加工";

export type OutsourceOrder = {
  id: string;
  orderNo: string;       // 委外加工單號（鼎新 5910-…）
  vendor: string;        // 加工廠商
  process: OutsourceProcess;
  partCode: string;
  partName: string;
  spec: string;
  qtyOut: number;        // 送出數量（在外加工）
  qtyReturned: number;   // 已回廠數量
  qtyScrap: number;      // 委外報廢/驗退
  sentDate: string;      // 送出日 ISO
  expectedReturn: string;// 預計回廠日 ISO
  woRef?: string;        // 關聯工單
};

// 基準日對齊 seed today = 2026-05-08
export const outsourceOrders: OutsourceOrder[] = [
  {
    id: "os1", orderNo: "5910-260420003", vendor: "新宏", process: "託外加工",
    partCode: "P04HA05", partName: "繞線架", spec: "56L×58W×36.5H×6410G5(開孔)",
    qtyOut: 2000, qtyReturned: 1200, qtyScrap: 18,
    sentDate: "2026-04-20", expectedReturn: "2026-05-05", woRef: "ORD-2026-007",
  },
  {
    id: "os2", orderNo: "5910-260425001", vendor: "立信電鍍", process: "電鍍",
    partCode: "P04BA03", partName: "框架固定架", spec: "ψ48L×48W×22H×ψ12",
    qtyOut: 800, qtyReturned: 0, qtyScrap: 0,
    sentDate: "2026-04-25", expectedReturn: "2026-05-06", woRef: "ORD-2026-007",
  },
  {
    id: "os3", orderNo: "5910-260428002", vendor: "和昌烤漆", process: "烤漆",
    partCode: "FB64-FRM", partName: "FB64 主車架", spec: "折疊式",
    qtyOut: 200, qtyReturned: 120, qtyScrap: 3,
    sentDate: "2026-04-28", expectedReturn: "2026-05-10", woRef: "ORD-2026-007",
  },
  {
    id: "os4", orderNo: "5910-260430001", vendor: "鑫成熱處理", process: "熱處理",
    partCode: "P03SB155", partName: "軸心", spec: "ψ12*132*89*14*M10*P1.5*48",
    qtyOut: 600, qtyReturned: 600, qtyScrap: 5,
    sentDate: "2026-04-30", expectedReturn: "2026-05-07",
  },
  {
    id: "os5", orderNo: "5910-260502004", vendor: "立信電鍍", process: "電鍍",
    partCode: "P04FB01", partName: "前框架", spec: "ψ208.5×ψ28×黑色",
    qtyOut: 300, qtyReturned: 0, qtyScrap: 0,
    sentDate: "2026-05-02", expectedReturn: "2026-05-14", woRef: "ORD-2026-018",
  },
  {
    id: "os6", orderNo: "5910-260503001", vendor: "全泰焊接", process: "外包焊接",
    partCode: "R100-RAIL", partName: "划船機軌道", spec: "雙軌",
    qtyOut: 60, qtyReturned: 0, qtyScrap: 0,
    sentDate: "2026-05-03", expectedReturn: "2026-05-20", woRef: "ORD-2026-021",
  },
  {
    id: "os7", orderNo: "5910-260504002", vendor: "和昌烤漆", process: "烤漆",
    partCode: "P04GB01", partName: "後框架", spec: "ψ208.5×ψ28×黑色",
    qtyOut: 300, qtyReturned: 0, qtyScrap: 0,
    sentDate: "2026-05-04", expectedReturn: "2026-05-16", woRef: "ORD-2026-018",
  },
  {
    id: "os8", orderNo: "5910-260418001", vendor: "新宏", process: "託外加工",
    partCode: "P04HA05", partName: "繞線架", spec: "6410G5(開孔)",
    qtyOut: 1500, qtyReturned: 1500, qtyScrap: 12,
    sentDate: "2026-04-18", expectedReturn: "2026-05-02",
  },
];
