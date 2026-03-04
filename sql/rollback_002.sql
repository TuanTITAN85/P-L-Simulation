-- ============================================================
-- Rollback 002 — Khôi phục lại kiến trúc FK-based (migration_001)
-- CẢNH BÁO: Script này XÓA toàn bộ dữ liệu trong các bảng role mới
--            và khôi phục cấu trúc cũ. Chỉ dùng khi cần thiết.
-- ============================================================

BEGIN;

-- ─── 1. Khôi phục bảng assignment cũ ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS line_service_managers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_service_id UUID        NOT NULL REFERENCES line_services(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES system_users(id)  ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (line_service_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lsm_user_id        ON line_service_managers (user_id);
CREATE INDEX IF NOT EXISTS idx_lsm_line_service_id ON line_service_managers (line_service_id);

CREATE TABLE IF NOT EXISTS pm_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        UNIQUE NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pm_assign_user_id ON pm_assignments (user_id);

CREATE TABLE IF NOT EXISTS dcl_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        UNIQUE NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT 'DCL' CHECK (title IN ('DCL', 'Vice DCL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dcl_assign_user_id ON dcl_assignments (user_id);

-- ─── 2. Khôi phục audit columns (UUID FK) ────────────────────────────────────

ALTER TABLE master_projects ADD COLUMN IF NOT EXISTS imported_by UUID REFERENCES system_users(id) ON DELETE SET NULL;
ALTER TABLE actual_data     ADD COLUMN IF NOT EXISTS imported_by UUID REFERENCES system_users(id) ON DELETE SET NULL;
ALTER TABLE projects        ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES system_users(id) ON DELETE SET NULL;

-- ─── 3. Xóa bảng role mới ────────────────────────────────────────────────────

DROP TABLE IF EXISTS sm_role_assignments;
DROP TABLE IF EXISTS dcl_roles;
DROP TABLE IF EXISTS pm_roles;
DROP TABLE IF EXISTS pmo_roles;

-- ─── 4. Xóa cột email-based audit ────────────────────────────────────────────

ALTER TABLE master_projects DROP COLUMN IF EXISTS imported_by_email;
ALTER TABLE actual_data     DROP COLUMN IF EXISTS imported_by_email;
ALTER TABLE projects        DROP COLUMN IF EXISTS created_by_email;

COMMIT;
