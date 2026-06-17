// ERP 主檔本地儲存（IndexedDB）
//
// 為什麼用 IndexedDB？
//   - 客戶沒 IT 資源、不接 ERP 即時連線 → 採購人員手動從鼎新匯出 CSV 上傳
//   - 料件主檔 ~ 數百到數千筆、BOM 同量級、採購歷史 3 年可能上萬筆
//     → 已超出 localStorage 5MB 上限（一筆採購記錄 ~200B × 30k = 6MB+）
//   - IndexedDB Chrome 預設 ~ GB 級配額，足夠 5-10 年歷史
//
// 為什麼不上後端 DB？
//   - 報價單 / BOM / 採購價是商業機密，老闆不一定願意丟雲端
//   - 沒後端、沒登入、沒帳號管理 → 對小公司部署阻力最低
//
// 三張表獨立儲存，分開更新（鼎新匯出時通常是三個檔案分別下載）：
//   items     料件主檔（料號 → 品名 / 分類 / 單位）
//   bom       BOM 結構（成品料號 → 子料 + 用量）
//   purchases 採購歷史（料號 + 供應商 + 單價 + 日期）

export type ItemMaster = {
  partNo: string;        // 料號（主鍵）
  name: string;          // 品名
  spec?: string;         // 規格
  category?: string;     // 商品分類（用來 mapping LME / 指數）
  unit?: string;         // 計量單位
};

export type BomEntry = {
  parentPartNo: string;  // 成品 / 半成品料號
  childPartNo: string;   // 子料號
  qty: number;           // 用量
  unit?: string;         // 計量單位
  level?: number;        // 階層（可選，鼎新一般用展階查詢）
};

export type PurchaseRecord = {
  poNo: string;          // 採購單號
  partNo: string;        // 料號
  supplier: string;      // 供應商名稱
  unitPrice: number;     // 單價
  currency?: string;     // 幣別（預設 TWD）
  qty: number;           // 採購數量
  date: string;          // 日期 ISO（YYYY-MM-DD）
};

export type MasterDataMeta = {
  itemCount: number;
  bomCount: number;
  purchaseCount: number;
  itemUpdatedAt?: string;
  bomUpdatedAt?: string;
  purchaseUpdatedAt?: string;
};

// 上傳紀錄 — 讓使用者一眼看出「我剛剛丟的那份有沒有真的進來」
export type UploadLog = {
  id?: number;
  ts: number;                                  // Date.now()
  type: "items" | "bom" | "purchases";
  source: "csv" | "ocr" | "direct";
  count: number;                               // 寫入的筆數
  removed?: number;                            // 替換式才有（BOM 同父件替換時）
  parentPartNo?: string;                       // BOM 才有
  fileName?: string;
  detail?: string;                             // 例如「FB61H003 多階正展」
};

// IQC 進料檢驗紀錄（每批進貨檢驗結果）
// 來源：/erp/wms/receiving 收料完成後的 IQC 步驟
// 用途：① 供應商品質追蹤（PPM）② 觸發 RMA ③ 年度供應商考核資料
export type IqcRecord = {
  id?: number;
  inspectedAt: number;                         // Date.now()
  poNo: string;                                // 採購單號
  partNo: string;
  supplier: string;
  qtyDelivered: number;                        // 來料數量
  qtyInspected: number;                        // 抽檢數量
  qtyDefect: number;                           // 不良數
  result: "OK" | "NG" | "CONDITIONAL";         // 判定（CONDITIONAL = 允收 / 特採）
  defectReason?: string;                       // 不良原因（NG / 特採才有）
  inspector?: string;                          // 檢驗員
  remark?: string;
};

// RMA 退料紀錄
// 來源：IQC NG → 建立退料單；或客訴回流；或盤點報廢
// 用途：① 退料追蹤 ② 供應商考核扣分 ③ 應付帳款扣除
export type RmaRecord = {
  id?: number;
  createdAt: number;
  rmaNo: string;                               // RMA 單號（自動產 RMA-YYYYMMDD-N）
  poNo: string;                                // 原採購單
  partNo: string;
  supplier: string;
  qty: number;                                 // 退貨數量
  reason: string;                              // 退料原因
  status: "OPEN" | "SHIPPED_BACK" | "REPLACED" | "CLOSED";
  iqcRecordId?: number;                        // 如果是 IQC NG 觸發，鏈回 IQC 紀錄
  remark?: string;
};

const DB_NAME = "chain-strategy-erp-master";
const DB_VERSION = 3;                          // ↑ v2→v3：新增 iqcRecords + rmaRecords
const STORE_ITEMS = "items";
const STORE_BOM = "bom";
const STORE_PURCHASES = "purchases";
const STORE_META = "meta";
const STORE_LOGS = "uploadLogs";
const STORE_IQC = "iqcRecords";
const STORE_RMA = "rmaRecords";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      // 料號是天然主鍵 → 直接當 keyPath
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        db.createObjectStore(STORE_ITEMS, { keyPath: "partNo" });
      }
      // BOM 沒有單一主鍵（parent+child 才唯一）→ 用 autoIncrement
      if (!db.objectStoreNames.contains(STORE_BOM)) {
        const s = db.createObjectStore(STORE_BOM, { autoIncrement: true });
        s.createIndex("parent", "parentPartNo", { unique: false });
        s.createIndex("child", "childPartNo", { unique: false });
      }
      // 採購歷史一筆採購單一筆紀錄 → autoIncrement + 索引
      if (!db.objectStoreNames.contains(STORE_PURCHASES)) {
        const s = db.createObjectStore(STORE_PURCHASES, { autoIncrement: true });
        s.createIndex("partNo", "partNo", { unique: false });
        s.createIndex("supplier", "supplier", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
      // v2 加入：上傳紀錄
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        const s = db.createObjectStore(STORE_LOGS, { keyPath: "id", autoIncrement: true });
        s.createIndex("ts", "ts", { unique: false });
        s.createIndex("type", "type", { unique: false });
      }
      // v3 加入：IQC + RMA
      if (!db.objectStoreNames.contains(STORE_IQC)) {
        const s = db.createObjectStore(STORE_IQC, { keyPath: "id", autoIncrement: true });
        s.createIndex("supplier", "supplier", { unique: false });
        s.createIndex("partNo", "partNo", { unique: false });
        s.createIndex("inspectedAt", "inspectedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_RMA)) {
        const s = db.createObjectStore(STORE_RMA, { keyPath: "id", autoIncrement: true });
        s.createIndex("supplier", "supplier", { unique: false });
        s.createIndex("partNo", "partNo", { unique: false });
        s.createIndex("createdAt", "createdAt", { unique: false });
        s.createIndex("status", "status", { unique: false });
      }
    };
  });
}

// ============================================================
// 寫入（覆蓋式 — 採購人員每次匯出最新整份檔，舊資料整批替換）
// ============================================================
async function replaceStore<T>(storeName: string, rows: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName, STORE_META], "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    for (const row of rows) store.put(row);
    tx.objectStore(STORE_META).put(new Date().toISOString(), `${storeName}_updatedAt`);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export const saveItems = (rows: ItemMaster[]) => replaceStore(STORE_ITEMS, rows);
export const saveBom = (rows: BomEntry[]) => replaceStore(STORE_BOM, rows);
export const savePurchases = (rows: PurchaseRecord[]) => replaceStore(STORE_PURCHASES, rows);

// ============================================================
// 寫入（增量式 — 報表 OCR 用，每次只匯入一份報表，merge 到既有資料）
// ============================================================

// 料件：用 partNo 當 key 自然 upsert（IDB 的 put 會覆寫同 key）
export async function upsertItems(rows: ItemMaster[]): Promise<{ inserted: number }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_ITEMS, STORE_META], "readwrite");
    const store = tx.objectStore(STORE_ITEMS);
    for (const row of rows) store.put(row);
    tx.objectStore(STORE_META).put(new Date().toISOString(), `${STORE_ITEMS}_updatedAt`);
    tx.oncomplete = () => { db.close(); resolve({ inserted: rows.length }); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// BOM：先刪掉同一個父件的舊資料、再寫新的（避免單一父件 BOM 累積髒）
export async function replaceBomForParent(parentPartNo: string, rows: BomEntry[]): Promise<{ removed: number; inserted: number }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_BOM, STORE_META], "readwrite");
    const store = tx.objectStore(STORE_BOM);
    const idx = store.index("parent");
    let removed = 0;
    const req = idx.openCursor(IDBKeyRange.only(parentPartNo));
    req.onsuccess = (e) => {
      const cur = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cur) {
        cur.delete();
        removed++;
        cur.continue();
      } else {
        for (const r of rows) store.put(r);
        tx.objectStore(STORE_META).put(new Date().toISOString(), `${STORE_BOM}_updatedAt`);
      }
    };
    tx.oncomplete = () => { db.close(); resolve({ removed, inserted: rows.length }); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// 採購：純 append（每筆採購單都是獨立事件，不該被「同料號」覆寫）
export async function appendPurchases(rows: PurchaseRecord[]): Promise<{ inserted: number }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PURCHASES, STORE_META], "readwrite");
    const store = tx.objectStore(STORE_PURCHASES);
    for (const row of rows) store.put(row);
    tx.objectStore(STORE_META).put(new Date().toISOString(), `${STORE_PURCHASES}_updatedAt`);
    tx.oncomplete = () => { db.close(); resolve({ inserted: rows.length }); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ============================================================
// 讀取
// ============================================================
async function readAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => { db.close(); resolve((req.result as T[]) ?? []); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return [];
  }
}

export const loadItems = () => readAll<ItemMaster>(STORE_ITEMS);
export const loadBom = () => readAll<BomEntry>(STORE_BOM);
export const loadPurchases = () => readAll<PurchaseRecord>(STORE_PURCHASES);

export async function loadMeta(): Promise<MasterDataMeta> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_ITEMS, STORE_BOM, STORE_PURCHASES, STORE_META], "readonly");
      const itemCountReq = tx.objectStore(STORE_ITEMS).count();
      const bomCountReq = tx.objectStore(STORE_BOM).count();
      const purchaseCountReq = tx.objectStore(STORE_PURCHASES).count();
      const itemTsReq = tx.objectStore(STORE_META).get(`${STORE_ITEMS}_updatedAt`);
      const bomTsReq = tx.objectStore(STORE_META).get(`${STORE_BOM}_updatedAt`);
      const purchaseTsReq = tx.objectStore(STORE_META).get(`${STORE_PURCHASES}_updatedAt`);
      tx.oncomplete = () => {
        db.close();
        resolve({
          itemCount: (itemCountReq.result as number) ?? 0,
          bomCount: (bomCountReq.result as number) ?? 0,
          purchaseCount: (purchaseCountReq.result as number) ?? 0,
          itemUpdatedAt: itemTsReq.result as string | undefined,
          bomUpdatedAt: bomTsReq.result as string | undefined,
          purchaseUpdatedAt: purchaseTsReq.result as string | undefined,
        });
      };
      tx.onerror = () => {
        db.close();
        resolve({ itemCount: 0, bomCount: 0, purchaseCount: 0 });
      };
    });
  } catch {
    return { itemCount: 0, bomCount: 0, purchaseCount: 0 };
  }
}

// ============================================================
// 查詢 helpers（供 quotation-analyzer STEP 2-5 使用）
// ============================================================
export async function findItemByPartNo(partNo: string): Promise<ItemMaster | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ITEMS, "readonly");
      const req = tx.objectStore(STORE_ITEMS).get(partNo);
      req.onsuccess = () => { db.close(); resolve((req.result as ItemMaster | undefined) ?? null); };
      req.onerror = () => { db.close(); resolve(null); };
    });
  } catch {
    return null;
  }
}

export async function findBomByParent(parentPartNo: string): Promise<BomEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_BOM, "readonly");
      const idx = tx.objectStore(STORE_BOM).index("parent");
      const req = idx.getAll(parentPartNo);
      req.onsuccess = () => { db.close(); resolve((req.result as BomEntry[]) ?? []); };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch {
    return [];
  }
}

export async function findPurchasesByPart(partNo: string): Promise<PurchaseRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PURCHASES, "readonly");
      const idx = tx.objectStore(STORE_PURCHASES).index("partNo");
      const req = idx.getAll(partNo);
      req.onsuccess = () => { db.close(); resolve((req.result as PurchaseRecord[]) ?? []); };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch {
    return [];
  }
}

// ============================================================
// 上傳紀錄（appendLog 不阻塞主流程，失敗就靜默）
// ============================================================
export async function logUpload(entry: Omit<UploadLog, "id">): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_LOGS, "readwrite");
      tx.objectStore(STORE_LOGS).add(entry);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch {}
}

export async function loadRecentLogs(limit = 20): Promise<UploadLog[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_LOGS, "readonly");
      const idx = tx.objectStore(STORE_LOGS).index("ts");
      const req = idx.openCursor(null, "prev"); // 由新到舊
      const out: UploadLog[] = [];
      req.onsuccess = (e) => {
        const c = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (c && out.length < limit) {
          out.push(c.value as UploadLog);
          c.continue();
        } else {
          db.close();
          resolve(out);
        }
      };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch {
    return [];
  }
}

// ============================================================
// IQC 進料檢驗 / RMA 退料
// ============================================================
export async function saveIqcRecord(record: Omit<IqcRecord, "id">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IQC, "readwrite");
    const req = tx.objectStore(STORE_IQC).add(record);
    req.onsuccess = () => { db.close(); resolve(req.result as number); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadIqcRecords(limit = 100): Promise<IqcRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_IQC, "readonly");
      const idx = tx.objectStore(STORE_IQC).index("inspectedAt");
      const req = idx.openCursor(null, "prev");
      const out: IqcRecord[] = [];
      req.onsuccess = (e) => {
        const c = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (c && out.length < limit) {
          out.push(c.value as IqcRecord);
          c.continue();
        } else { db.close(); resolve(out); }
      };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch { return []; }
}

export async function findIqcBySupplier(supplier: string): Promise<IqcRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_IQC, "readonly");
      const idx = tx.objectStore(STORE_IQC).index("supplier");
      const req = idx.getAll(supplier);
      req.onsuccess = () => { db.close(); resolve((req.result as IqcRecord[]) ?? []); };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch { return []; }
}

export async function saveRmaRecord(record: Omit<RmaRecord, "id">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RMA, "readwrite");
    const req = tx.objectStore(STORE_RMA).add(record);
    req.onsuccess = () => { db.close(); resolve(req.result as number); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadRmaRecords(limit = 100): Promise<RmaRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RMA, "readonly");
      const idx = tx.objectStore(STORE_RMA).index("createdAt");
      const req = idx.openCursor(null, "prev");
      const out: RmaRecord[] = [];
      req.onsuccess = (e) => {
        const c = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (c && out.length < limit) {
          out.push(c.value as RmaRecord);
          c.continue();
        } else { db.close(); resolve(out); }
      };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch { return []; }
}

export async function findRmaBySupplier(supplier: string): Promise<RmaRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_RMA, "readonly");
      const idx = tx.objectStore(STORE_RMA).index("supplier");
      const req = idx.getAll(supplier);
      req.onsuccess = () => { db.close(); resolve((req.result as RmaRecord[]) ?? []); };
      req.onerror = () => { db.close(); resolve([]); };
    });
  } catch { return []; }
}

// ============================================================
// 清空（測試用）
// ============================================================
export async function clearAll(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_ITEMS, STORE_BOM, STORE_PURCHASES, STORE_META, STORE_LOGS, STORE_IQC, STORE_RMA], "readwrite");
      tx.objectStore(STORE_ITEMS).clear();
      tx.objectStore(STORE_BOM).clear();
      tx.objectStore(STORE_PURCHASES).clear();
      tx.objectStore(STORE_META).clear();
      tx.objectStore(STORE_LOGS).clear();
      tx.objectStore(STORE_IQC).clear();
      tx.objectStore(STORE_RMA).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch {}
}
