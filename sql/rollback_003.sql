-- ============================================================
-- Rollback 003 — hoàn tác migration_003
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_actual_entries_proj_code;

-- Khôi phục NOT NULL (chỉ an toàn nếu không có row nào project_id = NULL)
ALTER TABLE actual_entries
  ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE actual_entries
  DROP COLUMN IF EXISTS project_code;

COMMIT;
