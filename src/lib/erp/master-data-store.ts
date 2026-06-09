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

const DB_NAME = "chain-strategy-erp-master";
const DB_VERSION = 1;
const STORE_ITEMS = "items";
const STORE_BOM = "bom";
const STORE_PURCHASES = "purchases";
const STORE_META = "meta";

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
// 清空（測試用）
// ============================================================
export async function clearAll(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_ITEMS, STORE_BOM, STORE_PURCHASES, STORE_META], "readwrite");
      tx.objectStore(STORE_ITEMS).clear();
      tx.objectStore(STORE_BOM).clear();
      tx.objectStore(STORE_PURCHASES).clear();
      tx.objectStore(STORE_META).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch {}
}
