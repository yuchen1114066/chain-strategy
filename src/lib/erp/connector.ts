// 鼎新 ERP iGP 連線層（唯讀）
//
// 架構憲法鐵律：
//   1) 只允許 SELECT — 任何 INSERT / UPDATE / DELETE / MERGE 一律拒絕
//   2) 禁呼叫 Stored Procedure（EXEC / CALL / sp_*）
//   3) 扣帳、過帳、入庫一律回鼎新介面操作
//   4) 每次查詢都留 Audit Log
//
// 設計：driver 採延遲載入（npm i mssql 後才啟用）；無 driver 或無環境變數時走 MOCK，
//        UI 一樣可運作，方便開發 / 演示。
//
// 環境變數：
//   TOPGP_DB_HOST       鼎新 SQL Server 主機
//   TOPGP_DB_PORT       1433
//   TOPGP_DB_NAME       資料庫名稱（如 TOPGP）
//   TOPGP_DB_USER       帳號（建議建專屬 ReadOnly 角色）
//   TOPGP_DB_PASS       密碼（請存於 secret manager）
//   TOPGP_DB_READONLY   "true"（強制檢核，預設 true）
//   TOPGP_DB_ENCRYPT    "true"
//   TOPGP_DB_TRUST_CERT "true"  (內網自簽憑證時)
//   TOPGP_SYNC_TOKEN    /api/sync/erp 觸發用 token

export type ConnectorMode = "live" | "mock";

export type QueryAudit = {
  id: string;
  at: string;             // ISO datetime
  mode: ConnectorMode;
  query: string;          // 截短
  durationMs: number;
  rows: number;
  ok: boolean;
  error?: string;
};

const AUDIT_RING: QueryAudit[] = [];
const AUDIT_MAX = 200;

function pushAudit(a: QueryAudit) {
  AUDIT_RING.unshift(a);
  if (AUDIT_RING.length > AUDIT_MAX) AUDIT_RING.length = AUDIT_MAX;
}

export function getQueryAudit(): QueryAudit[] {
  return AUDIT_RING.slice();
}

// ============================================================
// SQL 安全檢查（白名單）
// ============================================================
const FORBIDDEN_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /\b(insert|update|delete|merge|truncate|drop|alter|create|grant|revoke)\b/i, reason: "禁止寫入動作（INSERT/UPDATE/DELETE/MERGE/TRUNCATE/DROP/ALTER/CREATE/GRANT/REVOKE）" },
  { re: /\b(exec|execute|call)\s+/i, reason: "禁止 EXEC / CALL（不准呼叫 Stored Procedure）" },
  { re: /\bsp_\w+/i, reason: "禁止呼叫 sp_ 開頭的 Stored Procedure" },
  { re: /\bxp_\w+/i, reason: "禁止呼叫 xp_ 擴展程序" },
  { re: /;\s*\S/, reason: "禁止多 statement（一次只允許單一 SELECT）" },
];

export class ReadOnlyViolationError extends Error {
  constructor(reason: string, query: string) {
    super(`Read-only violation: ${reason}\n--- query ---\n${query}`);
    this.name = "ReadOnlyViolationError";
  }
}

export function assertReadOnly(sql: string): void {
  const trimmed = sql.trim().replace(/^--.*$/gm, "").trim();
  if (!/^(select|with)\b/i.test(trimmed)) {
    throw new ReadOnlyViolationError("查詢必須以 SELECT 或 WITH 開頭", sql);
  }
  for (const { re, reason } of FORBIDDEN_PATTERNS) {
    if (re.test(trimmed)) throw new ReadOnlyViolationError(reason, sql);
  }
}

// ============================================================
// 環境設定 + 模式判斷
// ============================================================
export function getConnectorMode(): ConnectorMode {
  const e = process.env;
  if (e.TOPGP_DB_HOST && e.TOPGP_DB_USER && e.TOPGP_DB_PASS && e.TOPGP_DB_NAME) {
    return "live";
  }
  return "mock";
}

export type ConnectorConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  readOnly: boolean;
  encrypt: boolean;
  trustServerCertificate: boolean;
};

export function getConfig(): ConnectorConfig {
  const e = process.env;
  return {
    host: e.TOPGP_DB_HOST ?? "",
    port: Number(e.TOPGP_DB_PORT ?? 1433),
    database: e.TOPGP_DB_NAME ?? "",
    user: e.TOPGP_DB_USER ?? "",
    password: e.TOPGP_DB_PASS ?? "",
    readOnly: (e.TOPGP_DB_READONLY ?? "true") === "true",
    encrypt: (e.TOPGP_DB_ENCRYPT ?? "true") === "true",
    trustServerCertificate: (e.TOPGP_DB_TRUST_CERT ?? "true") === "true",
  };
}

export function maskedConfig(): Omit<ConnectorConfig, "password"> & { password: string } {
  const c = getConfig();
  return { ...c, password: c.password ? "••••••••" : "" };
}

// ============================================================
// 查詢（mock + live 雙模式）
// ============================================================
export type QueryRow = Record<string, unknown>;

// driver 延遲載入（避免無 mssql 套件時崩潰）
type Driver = {
  query: (cfg: ConnectorConfig, sql: string) => Promise<QueryRow[]>;
};
let cachedDriver: Driver | null | undefined;

async function loadDriver(): Promise<Driver | null> {
  if (cachedDriver !== undefined) return cachedDriver;
  try {
    const mssql = await import("mssql");
    cachedDriver = {
      async query(cfg, sql) {
        const pool = await mssql.connect({
          server: cfg.host,
          port: cfg.port,
          database: cfg.database,
          user: cfg.user,
          password: cfg.password,
          options: {
            encrypt: cfg.encrypt,
            trustServerCertificate: cfg.trustServerCertificate,
            readOnlyIntent: cfg.readOnly,
          },
        });
        const res = await pool.request().query(sql);
        return res.recordset as QueryRow[];
      },
    };
  } catch {
    cachedDriver = null;
  }
  return cachedDriver;
}

const MOCK_FIXTURES: Record<string, QueryRow[]> = {
  // table-name → seed rows，模擬「鼎新側回來的影本」
  pur_pr_header: [
    { pr_no: "PR-2026-1001", req_dept: "工程", status: "submitted", amount: 290000, created_at: "2026-05-27T06:00:00Z" },
    { pr_no: "PR-2026-1002", req_dept: "生管", status: "approval_delayed", amount: 48000, created_at: "2026-05-26T02:00:00Z" },
  ],
  pur_po_header: [
    { po_no: "PO-2026-0508", supplier: "SUP-AX", amount: 25500, status: "released", created_at: "2026-05-20T00:00:00Z" },
  ],
  mfg_wo_header: [
    { wo_no: "WO-2026-0103", model: "FB64", qty: 200, customer: "LIFE", status: "in_progress" },
    { wo_no: "WO-2026-0105", model: "FB64", qty: 150, customer: "TRUE", status: "planned" },
  ],
  inv_stock: [
    { part_code: "FB64-FRM", qty: 18, loc: "WH-01" },
    { part_code: "FB64-PSU", qty: 4,  loc: "WH-01" },
  ],
  mdm_supplier: [
    { supplier_id: "SUP-AX", name: "AX 金屬", country: "TW" },
  ],
};

export async function query(sql: string, opts?: { fixture?: keyof typeof MOCK_FIXTURES }): Promise<QueryRow[]> {
  const cfg = getConfig();
  if (cfg.readOnly) assertReadOnly(sql);

  const mode = getConnectorMode();
  const started = Date.now();
  const auditBase = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    mode,
    query: sql.length > 240 ? sql.slice(0, 240) + "…" : sql,
  };

  try {
    let rows: QueryRow[];
    if (mode === "mock") {
      rows = opts?.fixture ? (MOCK_FIXTURES[opts.fixture] ?? []) : [];
    } else {
      const drv = await loadDriver();
      if (!drv) {
        pushAudit({ ...auditBase, durationMs: 0, rows: 0, ok: false,
          error: "mssql driver 未安裝（npm i mssql）— 已環境變數但無 driver" });
        throw new Error("mssql driver 未安裝。請執行：npm i mssql");
      }
      rows = await drv.query(cfg, sql);
    }
    pushAudit({ ...auditBase, durationMs: Date.now() - started, rows: rows.length, ok: true });
    return rows;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    pushAudit({ ...auditBase, durationMs: Date.now() - started, rows: 0, ok: false, error: msg });
    throw err;
  }
}

// ============================================================
// 健康檢查
// ============================================================
export type HealthReport = {
  mode: ConnectorMode;
  driverAvailable: boolean;
  configured: boolean;
  readOnlyEnforced: boolean;
  host: string;
  database: string;
  message: string;
};

export async function health(): Promise<HealthReport> {
  const cfg = getConfig();
  const mode = getConnectorMode();
  const drv = await loadDriver();
  return {
    mode,
    driverAvailable: drv !== null,
    configured: Boolean(cfg.host && cfg.user && cfg.password && cfg.database),
    readOnlyEnforced: cfg.readOnly,
    host: cfg.host || "(未設定)",
    database: cfg.database || "(未設定)",
    message:
      mode === "live"
        ? drv ? "🟢 LIVE — 已連線至鼎新 iGP（唯讀）"
              : "🟡 環境變數已設定但 mssql driver 未安裝（npm i mssql）"
        : "🟠 MOCK — 未設定環境變數，使用內建 fixture 模擬資料",
  };
}
