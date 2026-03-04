-- ============================================================
-- Migration 003 — actual_entries: soft project reference
-- Mục tiêu: Cho phép import actual entries cho project tồn tại
--           trong master_projects nhưng chưa có P&L project.
--           → project_id nullable, thêm project_code TEXT
-- ============================================================

BEGIN;

-- Thêm cột project_code (tham chiếu mềm, không FK)
ALTER TABLE actual_entries
  ADD COLUMN IF NOT EXISTS project_code TEXT NOT NULL DEFAULT '';

-- Backfill project_code từ projects.code cho các row hiện có
UPDATE actual_entries ae
   SET project_code = UPPER(p.code)
  FROM projects p
 WHERE p.id = ae.project_id
   AND ae.project_code = '';

-- Bỏ NOT NULL constraint trên project_id
ALTER TABLE actual_entries
  ALTER COLUMN project_id DROP NOT NULL;

-- Index để tra cứu nhanh theo project_code
CREATE INDEX IF NOT EXISTS idx_actual_entries_proj_code
  ON actual_entries (project_code);

COMMIT;
