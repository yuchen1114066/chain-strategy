// Sync 狀態暫存（in-memory，模組級單例）
// 正式環境請接 Postgres / Supabase 持久化。

export type SyncJobName =
  | "requisitions"      // 請購單
  | "purchase_orders"   // 採購單
  | "work_orders"       // 工單
  | "parts"             // 零件主檔
  | "inventory"         // 庫存
  | "suppliers";        // 供應商主檔

export const SYNC_JOBS: { name: SyncJobName; label: string; fixture: string; selectSql: string }[] = [
  { name: "requisitions",    label: "請購單 PR",     fixture: "pur_pr_header",
    selectSql: "SELECT pr_no, req_dept, status, amount, created_at FROM PUR_PR_HEADER WHERE created_at >= DATEADD(day,-30,GETDATE())" },
  { name: "purchase_orders", label: "採購單 PO",     fixture: "pur_po_header",
    selectSql: "SELECT po_no, supplier, amount, status, created_at FROM PUR_PO_HEADER WHERE created_at >= DATEADD(day,-30,GETDATE())" },
  { name: "work_orders",     label: "工單 WO",       fixture: "mfg_wo_header",
    selectSql: "SELECT wo_no, model, qty, customer, status FROM MFG_WO_HEADER WHERE status IN ('planned','in_progress')" },
  { name: "parts",           label: "零件主檔",       fixture: "mdm_supplier",  // demo 用，正式應換 MDM_PART
    selectSql: "SELECT part_code, part_name, uom FROM MDM_PART" },
  { name: "inventory",       label: "庫存快照",       fixture: "inv_stock",
    selectSql: "SELECT part_code, qty, loc FROM INV_STOCK" },
  { name: "suppliers",       label: "供應商主檔",     fixture: "mdm_supplier",
    selectSql: "SELECT supplier_id, name, country FROM MDM_SUPPLIER" },
];

export type SyncRunStatus = "running" | "success" | "partial" | "failed";

export type SyncJobResult = {
  name: SyncJobName;
  label: string;
  ok: boolean;
  rows: number;
  durationMs: number;
  error?: string;
};

export type SyncRun = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  status: SyncRunStatus;
  totalRows: number;
  jobs: SyncJobResult[];
  triggeredBy: "manual" | "cron";
  mode: "live" | "mock";
};

const RUNS: SyncRun[] = [];
const RUN_MAX = 50;

export function recordRun(run: SyncRun) {
  RUNS.unshift(run);
  if (RUNS.length > RUN_MAX) RUNS.length = RUN_MAX;
}

export function listRuns(): SyncRun[] {
  return RUNS.slice();
}

export function lastRun(): SyncRun | undefined {
  return RUNS[0];
}

export function lastSuccessfulRun(): SyncRun | undefined {
  return RUNS.find((r) => r.status === "success" || r.status === "partial");
}
