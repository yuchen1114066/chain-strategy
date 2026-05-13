// In-memory seed data so the demo runs without Supabase.
// 對應 WorkFlow ERP iGP / 〔總表完成〕Q:\採購課\成品成本分析\2026成本評估
// 客戶 LIFE 直立車產線 FB64 系列為主，搭配跑步機 / 划船機示意。

import type {
  Alert,
  BomLine,
  Model,
  Part,
  Supplier,
  WorkOrder,
} from "./types";

export const suppliers: Supplier[] = [
  // 祺驊真實供應商（從 FB11G003 / FB44H013 / FB44H035 / FH63H007 / FB93B003 BOM 截圖認到）
  // 交貨天數一律 45 天（依使用者提供）
  { id: "s1",  code: "SUP-JC",   name: "競丞",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s2",  code: "SUP-SC",   name: "雙成",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s3",  code: "SUP-CY",   name: "重邑",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s4",  code: "SUP-ZHY",  name: "莊宏億",       country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s5",  code: "SUP-YN",   name: "應拿",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s6",  code: "SUP-CHV",  name: "祺驊（越南）", country: "越南", city: "—", transitDays: 45, contact: "內部廠" },
  { id: "s7",  code: "SUP-JH",   name: "吉輝",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s8",  code: "SUP-TT",   name: "鈦泰",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s9",  code: "SUP-HY",   name: "寒亞",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s10", code: "SUP-ZS",   name: "這勝",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s11", code: "SUP-HC",   name: "海騁",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s12", code: "SUP-YZ",   name: "右在",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s13", code: "SUP-DTC",  name: "東台祺電",     country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s14", code: "SUP-HB",   name: "海碧",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s15", code: "SUP-JL",   name: "金倫",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  // 新增（從 FB44H013 等 BOM 截圖認到）
  { id: "s16", code: "SUP-LD",   name: "荔得",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s17", code: "SUP-MS",   name: "銘昇",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s18", code: "SUP-LL",   name: "荔龍",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s19", code: "SUP-QL",   name: "企龍",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s20", code: "SUP-FZ",   name: "福展",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s21", code: "SUP-FS",   name: "逢勝",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s22", code: "SUP-NM",   name: "南盟",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s23", code: "SUP-SKF",  name: "斯凱孚 SKF",   country: "瑞典", city: "—", transitDays: 45, contact: "—" },
  { id: "s24", code: "SUP-XC",   name: "弦成",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s25", code: "SUP-CF",   name: "成富",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s26", code: "SUP-YJ",   name: "永峻",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s27", code: "SUP-XH",   name: "新宏",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s28", code: "SUP-XY",   name: "協祐",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s29", code: "SUP-TPY",  name: "太平洋電線",   country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s30", code: "SUP-DTJH", name: "大同精化",     country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s31", code: "SUP-AHX",  name: "安和興業",     country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s32", code: "SUP-XJ",   name: "興勁",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s33", code: "SUP-RJV",  name: "銳建（越南）", country: "越南", city: "—", transitDays: 45, contact: "—" },
  { id: "s34", code: "SUP-YH",   name: "永潓",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s35", code: "SUP-TY",   name: "台一",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s36", code: "SUP-QY",   name: "企縣",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  // 從 FB13G009 BOM 新增的廠商
  { id: "s37", code: "SUP-YS",   name: "允升",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s38", code: "SUP-WC",   name: "五傳",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
  { id: "s39", code: "SUP-LX",   name: "龍星",         country: "台灣", city: "—", transitDays: 45, contact: "—" },
];

export const parts: Part[] = [
  // FB64 直立車主要零件（demo 用 — 廠商已對應到祺驊真實供應商）
  // 全部交期統一 45 天（依使用者提供）
  { id: "p1",  code: "FB64-FRM",   name: "FB64 主車架",       category: "鋼架",   unit: "PCS", unitCost: 1450, supplierId: "s4",  leadDays: 45, stockOnHand: 60,  safetyStock: 30 }, // 莊宏億
  { id: "p2",  code: "FB64-FLY18", name: "18kg 飛輪組",       category: "飛輪",   unit: "PCS", unitCost: 950,  supplierId: "s6",  leadDays: 45, stockOnHand: 35,  safetyStock: 20 }, // 祺驊越南
  { id: "p3",  code: "FB64-RES",   name: "磁控阻力組（8段）", category: "阻力",   unit: "PCS", unitCost: 780,  supplierId: "s8",  leadDays: 45, stockOnHand: 12,  safetyStock: 25 }, // 缺 — 鈦泰
  { id: "p4",  code: "FB64-CON",   name: "FB64 控制儀錶",     category: "控制板", unit: "PCS", unitCost: 1280, supplierId: "s13", leadDays: 45, stockOnHand: 45,  safetyStock: 20 }, // 東台祺電
  { id: "p5",  code: "FB64-LCD5",  name: "5吋 LCD 顯示器",    category: "顯示器", unit: "PCS", unitCost: 540,  supplierId: "s13", leadDays: 45, stockOnHand: 90,  safetyStock: 40 }, // 東台祺電
  { id: "p6",  code: "FB64-SDL",   name: "競速座墊",          category: "座墊",   unit: "PCS", unitCost: 230,  supplierId: "s7",  leadDays: 45, stockOnHand: 75,  safetyStock: 30 }, // 吉輝
  { id: "p7",  code: "FB64-PED",   name: "鋁合金腳踏板（對）",category: "踏板",   unit: "PR",  unitCost: 180,  supplierId: "s2",  leadDays: 45, stockOnHand: 120, safetyStock: 60 }, // 雙成
  { id: "p8",  code: "FB64-BLT",   name: "3V 傳動皮帶",       category: "皮帶",   unit: "PCS", unitCost: 95,   supplierId: "s11", leadDays: 45, stockOnHand: 180, safetyStock: 80 }, // 海騁
  { id: "p9",  code: "FB64-PSU",   name: "12V 電源供應",      category: "電源",   unit: "PCS", unitCost: 320,  supplierId: "s13", leadDays: 45, stockOnHand: 8,   safetyStock: 40 }, // 嚴重缺 — 東台祺電
  { id: "p10", code: "FB64-BOX",   name: "FB64 外箱套",       category: "包材",   unit: "SET", unitCost: 240,  supplierId: "s14", leadDays: 45, stockOnHand: 200, safetyStock: 80 }, // 海碧
  // 跑步機共用零件
  { id: "p11", code: "T220-FRM",   name: "跑步機鋼架（折疊）",category: "鋼架",   unit: "PCS", unitCost: 1850, supplierId: "s4",  leadDays: 45, stockOnHand: 20,  safetyStock: 10 }, // 莊宏億
  { id: "p12", code: "T220-MOT",   name: "DC 3HP 馬達",       category: "馬達",   unit: "PCS", unitCost: 4200, supplierId: "s13", leadDays: 45, stockOnHand: 8,   safetyStock: 15 }, // 缺 — 東台祺電
  { id: "p13", code: "T220-RUN",   name: "跑步帶（橡膠）",    category: "皮帶",   unit: "PCS", unitCost: 680,  supplierId: "s11", leadDays: 45, stockOnHand: 30,  safetyStock: 20 }, // 海騁
  // 划船機共用零件
  { id: "p14", code: "R100-RAIL",  name: "划船機軌道",        category: "鋼架",   unit: "PCS", unitCost: 2100, supplierId: "s4",  leadDays: 45, stockOnHand: 10,  safetyStock: 8 },  // 莊宏億
  { id: "p15", code: "R100-ROPE",  name: "划船拉繩組",        category: "皮帶",   unit: "PCS", unitCost: 220,  supplierId: "s11", leadDays: 45, stockOnHand: 40,  safetyStock: 20 }, // 海騁

  // ==================================================================
  // 祺驊真實 BOM — FB13G009 雙向內磁式磁控 ψ250*132*6片開-M10*P1.5
  // 共 28 個料件（含半成品 + 包裝多階）
  // ==================================================================
  // 包裝相關（Feature 件 + 虛設品號 + 採購件三層）
  { id: "p100", code: "FB13G009-P", name: "包裝",        category: "包裝",   unit: "PCS", unitCost: 0,      leadDays: 45, stockOnHand: 0,    safetyStock: 0,   kind: "feature" },
  { id: "p101", code: "SPMD002",    name: "包裝組合",    category: "包裝",   spec: "樓板/4入 (250)",        unit: "PCS", unitCost: 0,      leadDays: 45, stockOnHand: 0,    safetyStock: 0,   kind: "dummy" },
  { id: "p102", code: "M05A012",    name: "紙箱",        category: "包材",   spec: "540L*310W*320H(250 4入)",       unit: "PCS", unitCost: 50.40,  supplierId: "s37", leadDays: 45, stockOnHand: 500,  safetyStock: 200, kind: "purchase" }, // 允升
  { id: "p103", code: "M05J008",    name: "棧板",        category: "包材",   spec: "1320L*950W*144H(mm)",           unit: "PCS", unitCost: 546.00, supplierId: "s38", leadDays: 45, stockOnHand: 80,   safetyStock: 30,  kind: "purchase" }, // 五傳
  { id: "p104", code: "M05K003",    name: "保麗龍",      category: "包材",   spec: "磁控用4入(A)",                  unit: "PCS", unitCost: 23.30,  supplierId: "s39", leadDays: 45, stockOnHand: 200,  safetyStock: 80,  kind: "purchase" }, // 龍星
  { id: "p105", code: "M05K004",    name: "保麗龍",      category: "包材",   spec: "磁控用4入(B)",                  unit: "PCS", unitCost: 23.30,  supplierId: "s39", leadDays: 45, stockOnHand: 200,  safetyStock: 80,  kind: "purchase" }, // 龍星
  // 主體採購件
  { id: "p106", code: "M09A12",     name: "扣環",        category: "扣件",   spec: "ψ12軸用",                        unit: "PCS", unitCost: 0.27,   supplierId: "s1",  leadDays: 45, stockOnHand: 1500, safetyStock: 500, kind: "purchase" }, // 競丞
  { id: "p107", code: "M14AA044",   name: "螺絲",        category: "扣件",   spec: "圓頭十字M5×11+2@",              unit: "PCS", unitCost: 0.29,   supplierId: "s2",  leadDays: 45, stockOnHand: 3000, safetyStock: 1000,kind: "purchase" }, // 雙成
  { id: "p108", code: "P03SB155",   name: "軸心",        category: "軸件",   spec: "ψ12*132*89*14*M10*P1.5*48",     unit: "PCS", unitCost: 23.75,  supplierId: "s3",  leadDays: 45, stockOnHand: 80,   safetyStock: 30,  kind: "purchase" }, // 重邑
  { id: "p109", code: "P13DA01",    name: "滾珠軸承",    category: "軸承",   spec: "NBK 6001 2RS CN",               unit: "PCS", unitCost: 9.10,   supplierId: "s4",  leadDays: 45, stockOnHand: 600,  safetyStock: 200, kind: "purchase" }, // 莊宏億
  { id: "p110", code: "S01BD03C",   name: "飛輪半成品",  category: "半成品", spec: "ψ250/ψ37-J8+鋁板",              unit: "PCS", unitCost: 265.32, supplierId: "s6",  leadDays: 45, stockOnHand: 60,   safetyStock: 25,  kind: "purchase" }, // 祺驊越南（內部廠視為採購）
  // 半成品節點（自製，往下還有子件）
  { id: "p111", code: "S04B002",    name: "框架固定架半成品", category: "半成品", spec: "ψ12*22H+止付",                unit: "PCS", unitCost: 0,      leadDays: 45, stockOnHand: 80,   safetyStock: 30,  kind: "self" },
  { id: "p112", code: "M14CA003",   name: "止付螺絲",    category: "扣件",   spec: "M6×8L+耐落",                    unit: "PCS", unitCost: 0.60,   supplierId: "s2",  leadDays: 45, stockOnHand: 2000, safetyStock: 800, kind: "purchase" }, // 雙成
  { id: "p113", code: "P04BA03",    name: "框架固定架",  category: "框架",   spec: "ψ48L*48W*22H*ψ12",              unit: "PCS", unitCost: 13.20,  supplierId: "s7",  leadDays: 45, stockOnHand: 90,   safetyStock: 30,  kind: "purchase" }, // 吉輝
  { id: "p114", code: "S40A206",    name: "框架半成品",  category: "半成品", spec: "6片開、橘澄塊",                 unit: "PCS", unitCost: 0,      leadDays: 45, stockOnHand: 70,   safetyStock: 25,  kind: "self" },
  { id: "p115", code: "M06AC01",    name: "A、B膠(紅)", category: "膠材",   spec: "紅膠",                          unit: "g",   unitCost: 0.34,   supplierId: "s9",  leadDays: 45, stockOnHand: 5000, safetyStock: 1500,kind: "purchase" }, // 寒亞
  { id: "p116", code: "M06AC02",    name: "A、B膠(綠)", category: "膠材",   spec: "綠膠",                          unit: "g",   unitCost: 0.34,   supplierId: "s9",  leadDays: 45, stockOnHand: 5000, safetyStock: 1500,kind: "purchase" }, // 寒亞
  { id: "p117", code: "M14AC001",   name: "圓頭十字自攻螺絲", category: "扣件", spec: "3×28L@",                      unit: "PCS", unitCost: 0.17,   supplierId: "s3",  leadDays: 45, stockOnHand: 4000, safetyStock: 1500,kind: "purchase" }, // 重邑
  { id: "p118", code: "P02C02",     name: "磁極片",      category: "磁件",   spec: "R96.5*150*26*W*3t(一般)",       unit: "PCS", unitCost: 7.50,   supplierId: "s21", leadDays: 45, stockOnHand: 300,  safetyStock: 120, kind: "purchase" }, // 逢勝
  { id: "p119", code: "P04FB01",    name: "前框架",      category: "框架",   spec: "ψ208.5×ψ28×黑色",               unit: "PCS", unitCost: 12.00,  supplierId: "s11", leadDays: 45, stockOnHand: 110,  safetyStock: 40,  kind: "purchase" }, // 海騁
  { id: "p120", code: "P04GB01",    name: "後框架",      category: "框架",   spec: "ψ208.5×ψ28×黑色",               unit: "PCS", unitCost: 12.00,  supplierId: "s11", leadDays: 45, stockOnHand: 110,  safetyStock: 40,  kind: "purchase" }, // 海騁
  { id: "p121", code: "P07A01B",    name: "磁石",        category: "磁件",   spec: "8t×26W(著磁四強) 一般內磁控用", unit: "PCS", unitCost: 4.80,   supplierId: "s12", leadDays: 45, stockOnHand: 900,  safetyStock: 300, kind: "purchase" }, // 右在
  { id: "p122", code: "P10D015",    name: "拉索",        category: "索線",   spec: "36L*ψ1.2",                       unit: "PCS", unitCost: 1.68,   supplierId: "s13", leadDays: 45, stockOnHand: 300,  safetyStock: 120, kind: "purchase" }, // 東台祺電
  { id: "p123", code: "P11A01",     name: "襯套",        category: "套件",   spec: "ψ8×ψ6×4L",                       unit: "PCS", unitCost: 0.33,   supplierId: "s2",  leadDays: 45, stockOnHand: 800,  safetyStock: 300, kind: "purchase" }, // 雙成
  { id: "p124", code: "P11B01",     name: "滑套",        category: "套件",   spec: "ψ7×ψ3×10.5L",                    unit: "PCS", unitCost: 0.37,   supplierId: "s2",  leadDays: 45, stockOnHand: 400,  safetyStock: 150, kind: "purchase" }, // 雙成
  { id: "p125", code: "P11D02",     name: "滑塊",        category: "套件",   spec: "橘色",                          unit: "PCS", unitCost: 1.35,   supplierId: "s14", leadDays: 45, stockOnHand: 200,  safetyStock: 80,  kind: "purchase" }, // 海碧
  { id: "p126", code: "P15A001",    name: "復位彈簧",    category: "彈簧",   spec: "ψ1.0×10.5×37L",                  unit: "PCS", unitCost: 0.63,   supplierId: "s15", leadDays: 45, stockOnHand: 400,  safetyStock: 150, kind: "purchase" }, // 金倫

  // ==================================================================
  // 祺驊真實 BOM — S43A001 煞車線圈半成品（4 階深 + 託外加工結構）
  // ==================================================================
  { id: "p150", code: "S42J001",    name: "煞車線繞半成品", category: "半成品", spec: "0.55×1000t/100L",     unit: "PCS", unitCost: 0,      leadDays: 45, stockOnHand: 50,    safetyStock: 20,  kind: "self" },
  { id: "p151", code: "S42R006",    name: "煞車線繞半成品", category: "半成品", spec: "0.55X1000t",          unit: "PCS", unitCost: 0,      leadDays: 45, stockOnHand: 50,    safetyStock: 20,  kind: "self" },
  { id: "p152", code: "M03A020",    name: "絕緣紙",        category: "絕緣材", spec: "0.13*33*350",        unit: "PCS", unitCost: 0.50,   supplierId: "s24", leadDays: 45, stockOnHand: 2000,  safetyStock: 800, kind: "purchase" }, // 弦成
  { id: "p153", code: "M15F008",    name: "玻璃纖維矽套管",category: "絕緣材", spec: "ψ3×32mm",            unit: "PCS", unitCost: 0.101,  supplierId: "s25", leadDays: 45, stockOnHand: 4000,  safetyStock: 1500,kind: "purchase" }, // 成富
  { id: "p154", code: "P20CB02-A1", name: "煞車引出線",    category: "電線",   spec: "P2-D60309/130L",     unit: "PCS", unitCost: 6.50,   supplierId: "s26", leadDays: 45, stockOnHand: 600,   safetyStock: 200, kind: "purchase" }, // 永峻
  { id: "p155", code: "P04HA05",    name: "繞線架",        category: "塑件",   spec: "56L×58W×36.5H×6410G5(開孔)", unit: "PCS", unitCost: 1.60, supplierId: "s27", leadDays: 45, stockOnHand: 800,   safetyStock: 300, kind: "outsource" }, // 新宏 託外加工
  { id: "p156", code: "P48AB02",    name: "工程塑膠粒",    category: "原料",   spec: "6410G5 AWT",         unit: "g",   unitCost: 0.308,  supplierId: "s28", leadDays: 45, stockOnHand: 80000, safetyStock: 30000, kind: "purchase" }, // 協祐
  { id: "p157", code: "P21D055",    name: "漆包線",        category: "電線",   spec: "2EIW-ψ0.55",         unit: "g",   unitCost: 0.369,  supplierId: "s35", leadDays: 45, stockOnHand: 100000,safetyStock: 40000, kind: "purchase" }, // 台一
  { id: "p158", code: "M06BB04",    name: "稀薄劑",        category: "化工",   spec: "RTH-031A",           unit: "g",   unitCost: 0.082,  supplierId: "s30", leadDays: 45, stockOnHand: 50000, safetyStock: 15000, kind: "purchase" }, // 大同精化
  { id: "p159", code: "M06BA05",    name: "凡立水",        category: "化工",   spec: "TCV-225",            unit: "g",   unitCost: 0.147,  supplierId: "s30", leadDays: 45, stockOnHand: 30000, safetyStock: 10000, kind: "purchase" }, // 大同精化
];

// 機種 FB64・直立車 之下有多個成品品號（H021-A2 商規 / H020-A1 家規）
export const models: Model[] = [
  { id: "m1", code: "FB64H021-A2", machineFamily: "FB64・直立車", name: "FB64H021-A2 商用直立車", category: "bike", description: "LIFE 客戶 OEM，商用規格 18kg 飛輪、磁控阻力", stdPrice: 24800 },
  { id: "m2", code: "FB64H020-A1", machineFamily: "FB64・直立車", name: "FB64H020-A1 家用直立車", category: "bike", description: "家用規格，輕量化座墊", stdPrice: 18500 },
  { id: "m3", code: "T-PRO-220", machineFamily: "T-PRO・跑步機", name: "Pro 跑步機 T-220", category: "treadmill", description: "商用級折疊跑步機，3HP 馬達", stdPrice: 38000 },
  { id: "m4", code: "R-MAG-100", machineFamily: "R-MAG・划船機", name: "磁控划船機 R-100", category: "rower", description: "雙軌磁控，滑順靜音", stdPrice: 28000 },
  // 祺驊真實成品 — 內磁式磁控模組
  { id: "m100", code: "FB13G009", machineFamily: "FB13・內磁式磁控", name: "FB13G009 雙向內磁式磁控", category: "strength", description: "ψ250*132*6片開-M10*P1.5，搭配 ψ250 飛輪、6 片磁極，標準成本 $450", stdPrice: 1500 },
  // 半成品（有自己的 BOM）— 將會作為其他成品的零件
  { id: "m101", code: "S43A001", machineFamily: "S43・煞車線圈", name: "S43A001 煞車線圈半成品", category: "strength", description: "1000t/100L(含浸)，含繞線+塑膠繞線架託外加工+漆包線+含浸劑，標準成本 $136.07", stdPrice: 200 },
];

// FB13G009 多階 BOM（依使用者提供的真實 BOM 截圖建檔）
const FB13G009_BOM: BomLine[] = [
  // ── Level 1 — FB13G009 主件直接子件 ─────────────────
  { modelId: "m100", partId: "p100", qtyPerUnit: 1, level: 1, version: 1, isActive: true },  // FB13G009-P 包裝 (Feature)
  { modelId: "m100", partId: "p106", qtyPerUnit: 2, level: 1, version: 1, isActive: true },  // M09A12 扣環
  { modelId: "m100", partId: "p107", qtyPerUnit: 4, level: 1, version: 1, isActive: true },  // M14AA044 螺絲
  { modelId: "m100", partId: "p108", qtyPerUnit: 1, level: 1, version: 1, isActive: true },  // P03SB155 軸心
  { modelId: "m100", partId: "p109", qtyPerUnit: 2, level: 1, version: 1, isActive: true },  // P13DA01 滾珠軸承
  { modelId: "m100", partId: "p110", qtyPerUnit: 1, level: 1, version: 1, isActive: true },  // S01BD03C 飛輪半成品（祺驊越南）
  { modelId: "m100", partId: "p111", qtyPerUnit: 1, level: 1, version: 1, isActive: true },  // S04B002 框架固定架半成品
  { modelId: "m100", partId: "p114", qtyPerUnit: 1, level: 1, version: 1, isActive: true },  // S40A206 框架半成品

  // ── Level 2 — FB13G009-P 包裝 下展開 ─────────────────
  { modelId: "m100", partId: "p101", parentPartCode: "FB13G009-P", qtyPerUnit: 1, level: 2, version: 1, isActive: true }, // SPMD002 包裝組合

  // ── Level 3 — SPMD002 下展開（紙箱 / 棧板 / 保麗龍）──
  { modelId: "m100", partId: "p102", parentPartCode: "SPMD002", qtyPerUnit: 0.25, level: 3, version: 1, isActive: true }, // M05A012 紙箱
  { modelId: "m100", partId: "p103", parentPartCode: "SPMD002", qtyPerUnit: 0.01, level: 3, version: 1, isActive: true }, // M05J008 棧板
  { modelId: "m100", partId: "p104", parentPartCode: "SPMD002", qtyPerUnit: 0.25, level: 3, version: 1, isActive: true }, // M05K003 保麗龍 A
  { modelId: "m100", partId: "p105", parentPartCode: "SPMD002", qtyPerUnit: 0.25, level: 3, version: 1, isActive: true }, // M05K004 保麗龍 B

  // ── Level 2 — S04B002 框架固定架半成品 下展開 ──────
  { modelId: "m100", partId: "p112", parentPartCode: "S04B002", qtyPerUnit: 2, level: 2, version: 1, isActive: true }, // M14CA003 止付螺絲
  { modelId: "m100", partId: "p113", parentPartCode: "S04B002", qtyPerUnit: 1, level: 2, version: 1, isActive: true }, // P04BA03 框架固定架

  // ── Level 2 — S40A206 框架半成品 下展開（12 個小料）─
  { modelId: "m100", partId: "p115", parentPartCode: "S40A206", qtyPerUnit: 1.5, level: 2, version: 1, isActive: true }, // M06AC01 紅膠
  { modelId: "m100", partId: "p116", parentPartCode: "S40A206", qtyPerUnit: 1.5, level: 2, version: 1, isActive: true }, // M06AC02 綠膠
  { modelId: "m100", partId: "p117", parentPartCode: "S40A206", qtyPerUnit: 4,   level: 2, version: 1, isActive: true }, // M14AC001 自攻螺絲
  { modelId: "m100", partId: "p118", parentPartCode: "S40A206", qtyPerUnit: 2,   level: 2, version: 1, isActive: true }, // P02C02 磁極片
  { modelId: "m100", partId: "p119", parentPartCode: "S40A206", qtyPerUnit: 1,   level: 2, version: 1, isActive: true }, // P04FB01 前框架
  { modelId: "m100", partId: "p120", parentPartCode: "S40A206", qtyPerUnit: 1,   level: 2, version: 1, isActive: true }, // P04GB01 後框架
  { modelId: "m100", partId: "p121", parentPartCode: "S40A206", qtyPerUnit: 6,   level: 2, version: 1, isActive: true }, // P07A01B 磁石
  { modelId: "m100", partId: "p122", parentPartCode: "S40A206", qtyPerUnit: 2,   level: 2, version: 1, isActive: true }, // P10D015 拉索
  { modelId: "m100", partId: "p123", parentPartCode: "S40A206", qtyPerUnit: 4,   level: 2, version: 1, isActive: true }, // P11A01 襯套
  { modelId: "m100", partId: "p124", parentPartCode: "S40A206", qtyPerUnit: 2,   level: 2, version: 1, isActive: true }, // P11B01 滑套
  { modelId: "m100", partId: "p125", parentPartCode: "S40A206", qtyPerUnit: 1,   level: 2, version: 1, isActive: true }, // P11D02 滑塊
  { modelId: "m100", partId: "p126", parentPartCode: "S40A206", qtyPerUnit: 2,   level: 2, version: 1, isActive: true }, // P15A001 復位彈簧
];

// S43A001 煞車線圈 4 階 BOM（依使用者提供截圖）
const S43A001_BOM: BomLine[] = [
  // ── Level 1：S43A001 直接子件（線繞半成品 + 含浸劑）─────
  { modelId: "m101", partId: "p150", qtyPerUnit: 1, level: 1, version: 1, isActive: true }, // S42J001 煞車線繞半成品
  { modelId: "m101", partId: "p158", qtyPerUnit: 9, level: 1, version: 1, isActive: true }, // M06BB04 稀薄劑 9g
  { modelId: "m101", partId: "p159", qtyPerUnit: 3, level: 1, version: 1, isActive: true }, // M06BA05 凡立水 3g

  // ── Level 2：S42J001 下展開 ─────────────────────────────
  { modelId: "m101", partId: "p152", parentPartCode: "S42J001", qtyPerUnit: 1, level: 2, version: 1, isActive: true }, // M03A020 絕緣紙
  { modelId: "m101", partId: "p153", parentPartCode: "S42J001", qtyPerUnit: 2, level: 2, version: 1, isActive: true }, // M15F008 玻璃纖維矽套管
  { modelId: "m101", partId: "p154", parentPartCode: "S42J001", qtyPerUnit: 1, level: 2, version: 1, isActive: true }, // P20CB02-A1 煞車引出線
  { modelId: "m101", partId: "p151", parentPartCode: "S42J001", qtyPerUnit: 1, level: 2, version: 1, isActive: true }, // S42R006 煞車線繞半成品

  // ── Level 3：S42R006 下展開（託外加工繞線架）────────────
  { modelId: "m101", partId: "p155", parentPartCode: "S42R006", qtyPerUnit: 1, level: 3, version: 1, isActive: true }, // P04HA05 繞線架（託外加工）

  // ── Level 4：P04HA05 託外加工的料 ──────────────────────
  { modelId: "m101", partId: "p156", parentPartCode: "P04HA05", qtyPerUnit: 26,  level: 4, version: 1, isActive: true }, // P48AB02 工程塑膠粒 26g
  { modelId: "m101", partId: "p157", parentPartCode: "P04HA05", qtyPerUnit: 320, level: 4, version: 1, isActive: true }, // P21D055 漆包線 320g
];

export const bom: BomLine[] = [
  // FB64H021-A2（商規，飛輪 + 完整儀表）
  { modelId: "m1", partId: "p1", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p2", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p4", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p6", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p7", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m1", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  // FB64H020-A1（家規，少儀表）
  { modelId: "m2", partId: "p1", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p2", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p6", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p7", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p8", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m2", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  // 跑步機
  { modelId: "m3", partId: "p11", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p12", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p13", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p4", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m3", partId: "p10", qtyPerUnit: 1, version: 1, isActive: true },
  // 划船機
  { modelId: "m4", partId: "p14", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p15", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p3", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p5", qtyPerUnit: 1, version: 1, isActive: true },
  { modelId: "m4", partId: "p9", qtyPerUnit: 1, version: 1, isActive: true },
  // FB13G009 完整多階 BOM（祺驊真實資料）
  ...FB13G009_BOM,
  // S43A001 煞車線圈半成品 4 階 BOM
  ...S43A001_BOM,
];

const TODAY = "2026-05-08";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const STAGE_DAYS: Record<string, number> = {
  material: 30, arrival: 0, iqc: 2, line: 5, test: 2, pack: 1, ship: 14, customer: 0,
};

function buildStages(shipDate: string): WorkOrder["stages"] {
  const order = ["material", "arrival", "iqc", "line", "test", "pack", "ship", "customer"] as const;
  const ship = shipDate;
  const pack = addDays(ship, -STAGE_DAYS.pack);
  const test = addDays(pack, -STAGE_DAYS.test);
  const line = addDays(test, -STAGE_DAYS.line);
  const iqc = addDays(line, -STAGE_DAYS.iqc);
  const arrival = iqc;
  const material = addDays(arrival, -STAGE_DAYS.material);
  const customer = addDays(ship, STAGE_DAYS.ship);
  const dates: Record<string, string> = { material, arrival, iqc, line, test, pack, ship, customer };
  return order.map((stage, i) => ({
    stage, seq: i + 1, plannedDate: dates[stage], status: "pending",
  }));
}

export const workOrders: WorkOrder[] = [
  // 螢幕截圖那筆：已簽收
  {
    id: "wo1",
    woNo: "ORD-2026-001",
    source: "ERP",
    modelId: "m1",
    qty: 100,
    customer: "LIFE",
    destination: "USA",
    orderDate: "2026-03-15",
    shipDate: "2026-04-30",
    status: "done",
    statusLabel: "已簽收",
    notes: "首批量產，成功交付",
    stages: buildStages("2026-04-30").map((s) => ({
      ...s,
      status: "done" as const,
      actualDate: s.plannedDate,
    })),
  },
  // 第二筆 LIFE 訂單：生產中，但磁控缺料
  {
    id: "wo2",
    woNo: "ORD-2026-007",
    source: "ERP",
    modelId: "m1",
    qty: 200,
    customer: "LIFE",
    destination: "Los Angeles, USA",
    orderDate: "2026-04-02",
    shipDate: "2026-06-05",
    status: "active",
    statusLabel: "生產中",
    stages: buildStages("2026-06-05").map((s, i) => {
      if (i === 0) return { ...s, status: "done", actualDate: "2026-05-04" };
      if (i === 1) return { ...s, status: "in_progress" };
      return s;
    }),
  },
  // 跑步機急單，誤船高風險
  {
    id: "wo3",
    woNo: "ORD-2026-012",
    source: "ERP",
    modelId: "m3",
    qty: 50,
    customer: "FitWorld USA",
    destination: "Los Angeles, USA",
    orderDate: "2026-04-15",
    shipDate: "2026-05-25",
    status: "active",
    statusLabel: "待料",
    notes: "馬達 T220-MOT 庫存吃緊",
    stages: buildStages("2026-05-25").map((s, i) => {
      if (i === 0) return { ...s, status: "done", actualDate: "2026-04-20" };
      if (i === 1) return { ...s, status: "in_progress" };
      return s;
    }),
  },
  // 飛輪訂單：規劃中
  {
    id: "wo4",
    woNo: "ORD-2026-018",
    source: "ERP",
    modelId: "m2",
    qty: 80,
    customer: "Tokyo Gym Co.",
    destination: "Yokohama, JP",
    orderDate: "2026-04-28",
    shipDate: "2026-07-10",
    status: "planning",
    statusLabel: "規劃中",
    stages: buildStages("2026-07-10"),
  },
  // 划船機，已開始
  {
    id: "wo5",
    woNo: "ORD-2026-021",
    source: "manual",
    modelId: "m4",
    qty: 30,
    customer: "EuroFit GmbH",
    destination: "Hamburg, DE",
    orderDate: "2026-05-01",
    shipDate: "2026-07-25",
    status: "planning",
    statusLabel: "待開工",
    stages: buildStages("2026-07-25"),
  },
];

export const today = TODAY;
export const seedAlerts: Alert[] = [];

export function currentStageLabel(wo: WorkOrder): string {
  // 已簽收：客戶交付完成
  if (wo.status === "done") return "客戶交付";
  // 找第一個 in_progress；沒有就找第一個非 done 階段
  const inprog = wo.stages.find((s) => s.status === "in_progress");
  if (inprog) {
    const meta = ["算料","到廠","進貨檢驗","生產","測試","包裝","出貨","客戶交付"];
    return meta[inprog.seq - 1] ?? inprog.stage;
  }
  const next = wo.stages.find((s) => s.status !== "done");
  if (next) {
    const meta = ["算料","到廠","進貨檢驗","生產","測試","包裝","出貨","客戶交付"];
    return `待 ${meta[next.seq - 1] ?? next.stage}`;
  }
  return "客戶交付";
}
