-- 養生道 YangSheng Dao — Supabase Database Schema
-- Run this in Supabase Dashboard → SQL Editor

-- =============================================
-- TABLE 1: 體質測評結果
-- =============================================
CREATE TABLE IF NOT EXISTS constitution_assessments (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    UUID        NOT NULL,
  primary_constitution TEXT NOT NULL,
  scores        JSONB       NOT NULL,  -- e.g. {"氣虛質": 18, "陽虛質": 12, ...}
  answers       JSONB       NOT NULL,  -- e.g. [2, 0, 3, 1, ...]  (answer index per question)
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_session
  ON constitution_assessments (session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_constitution
  ON constitution_assessments (primary_constitution);
CREATE INDEX IF NOT EXISTS idx_assessments_created
  ON constitution_assessments (created_at);

-- =============================================
-- TABLE 2: 七天食療打卡
-- =============================================
CREATE TABLE IF NOT EXISTS daily_checkins (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id       UUID    NOT NULL,
  constitution     TEXT,                               -- 使用者體質（來自測評）
  plan_day         INTEGER NOT NULL CHECK (plan_day BETWEEN 1 AND 7),
  swelling_level   INTEGER CHECK (swelling_level BETWEEN 1 AND 5),  -- 1=嚴重水腫 5=完全消腫
  skin_tone        INTEGER CHECK (skin_tone BETWEEN 1 AND 5),        -- 1=蠟黃暗沉 5=紅潤有光
  energy_level     INTEGER CHECK (energy_level BETWEEN 1 AND 5),     -- 1=非常疲憊 5=精神飽滿
  notes            TEXT,
  checkin_date     DATE    DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_session
  ON daily_checkins (session_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date
  ON daily_checkins (checkin_date);

-- =============================================
-- ROW LEVEL SECURITY (allow anonymous access)
-- =============================================
ALTER TABLE constitution_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_assessments"
  ON constitution_assessments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_assessments"
  ON constitution_assessments FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_checkins"
  ON daily_checkins FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_checkins"
  ON daily_checkins FOR SELECT TO anon USING (true);
