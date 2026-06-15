-- ============================================================
-- Equipment ERP Schema (健身機台製造管理)
-- 與養生道完全獨立，所有 table 以 erp_ 為前綴
-- 對應系統：WorkFlow ERP iGP（外部來源透過 Excel 匯入）
-- ============================================================

-- 1. 供應商主檔
CREATE TABLE IF NOT EXISTS erp_suppliers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  country       TEXT,
  city          TEXT,
  factory_lat   NUMERIC,
  factory_lng   NUMERIC,
  transit_days  INTEGER NOT NULL DEFAULT 7,   -- 平均運送天數（含通關）
  contact       TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. 零件主檔
CREATE TABLE IF NOT EXISTS erp_parts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT,                          -- 馬達/控制板/鋼架/皮帶...
  unit          TEXT DEFAULT 'PCS',
  unit_cost     NUMERIC(12,2) DEFAULT 0,
  supplier_id   UUID REFERENCES erp_suppliers(id),
  lead_days     INTEGER DEFAULT 14,            -- 備料 + 運送總天數
  stock_on_hand INTEGER DEFAULT 0,
  safety_stock  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. 設備型號主檔
CREATE TABLE IF NOT EXISTS erp_models (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT,                          -- 跑步機/飛輪/划船機/橢圓機
  std_cost      NUMERIC(12,2) DEFAULT 0,       -- 標準成本（用 BOM 算出來）
  std_price     NUMERIC(12,2) DEFAULT 0,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. BOM —— 關鍵連結表（這就是兩張 Excel 缺的橋）
CREATE TABLE IF NOT EXISTS erp_bom (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id      UUID NOT NULL REFERENCES erp_models(id) ON DELETE CASCADE,
  part_id       UUID NOT NULL REFERENCES erp_parts(id),
  qty_per_unit  NUMERIC(12,4) NOT NULL DEFAULT 1,
  version       INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN DEFAULT true,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (model_id, part_id, version)
);
CREATE INDEX IF NOT EXISTS idx_bom_model ON erp_bom (model_id);
CREATE INDEX IF NOT EXISTS idx_bom_part  ON erp_bom (part_id);

-- 5. 工單（生產 + 出貨 一張單管到底）
CREATE TABLE IF NOT EXISTS erp_work_orders (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wo_no         TEXT UNIQUE NOT NULL,          -- WO-2026-0001
  model_id      UUID NOT NULL REFERENCES erp_models(id),
  qty           INTEGER NOT NULL,
  customer      TEXT,
  destination   TEXT,                          -- 收貨地（影響船期）
  ship_date     DATE NOT NULL,                 -- 客戶要求船期（反向排程錨點）
  status        TEXT NOT NULL DEFAULT 'planning', -- planning/active/done/cancelled
  bom_snapshot  JSONB,                         -- 開單當下 BOM 快照（不被未來改動影響）
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 6. 八階段狀態
CREATE TABLE IF NOT EXISTS erp_wo_stages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wo_id         UUID NOT NULL REFERENCES erp_work_orders(id) ON DELETE CASCADE,
  stage         TEXT NOT NULL,                 -- material/arrival/iqc/line/test/pack/ship/customer
  seq           INTEGER NOT NULL,              -- 1..8
  planned_date  DATE,                          -- 反向排程算出來
  actual_date   DATE,
  status        TEXT DEFAULT 'pending',        -- pending/in_progress/done/blocked
  pass_qty      INTEGER,
  fail_qty      INTEGER,
  notes         TEXT,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (wo_id, stage)
);
CREATE INDEX IF NOT EXISTS idx_stages_wo ON erp_wo_stages (wo_id);

-- 7. 異常警訊
CREATE TABLE IF NOT EXISTS erp_alerts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wo_id         UUID REFERENCES erp_work_orders(id) ON DELETE CASCADE,
  severity      TEXT NOT NULL,                 -- red/yellow
  rule          TEXT NOT NULL,                 -- shortage/late/ship_risk/quality
  title         TEXT NOT NULL,
  detail        TEXT,
  suggested_action TEXT,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_wo ON erp_alerts (wo_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON erp_alerts (resolved_at) WHERE resolved_at IS NULL;

-- ============================================================
-- 缺料計算 view（給定一組工單，算出總需求 vs 庫存）
-- ============================================================
CREATE OR REPLACE VIEW erp_v_part_demand AS
SELECT
  p.id          AS part_id,
  p.code        AS part_code,
  p.name        AS part_name,
  p.stock_on_hand,
  p.safety_stock,
  p.lead_days,
  COALESCE(SUM(b.qty_per_unit * w.qty), 0) AS total_required,
  p.stock_on_hand - COALESCE(SUM(b.qty_per_unit * w.qty), 0) AS net_balance
FROM erp_parts p
LEFT JOIN erp_bom b          ON b.part_id  = p.id AND b.is_active
LEFT JOIN erp_work_orders w  ON w.model_id = b.model_id AND w.status IN ('planning','active')
GROUP BY p.id;

-- ============================================================
-- RLS（依組織需求調整，預設關閉以利內部使用）
-- ============================================================
-- ALTER TABLE erp_models      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_parts       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_bom         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_work_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_wo_stages   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_alerts      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE erp_suppliers   ENABLE ROW LEVEL SECURITY;
