-- ============================================================
-- Migration 002 — Email-based role tables
-- Mục tiêu: Chỉ lưu local admin trong system_users.
--           PM / SM / PMO / DCL được quản lý bằng email từ Azure AD
--           thông qua các bảng role riêng (không cần system_users row).
-- ============================================================

BEGIN;

-- ─── 1. Tạo bảng role mới (email-based, không FK sang system_users) ─────────

CREATE TABLE pmo_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pmo_roles_email ON pmo_roles (email);

CREATE TABLE pm_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pm_roles_email ON pm_roles (email);

CREATE TABLE dcl_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        UNIQUE NOT NULL,
  name       TEXT        NOT NULL,
  title      TEXT        NOT NULL DEFAULT 'DCL'
                         CHECK (title IN ('DCL', 'Vice DCL')),
  status     TEXT        NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dcl_roles_email ON dcl_roles (email);

CREATE TABLE sm_role_assignments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  line_service_id UUID        NOT NULL REFERENCES line_services(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'inactive')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, line_service_id)
);
CREATE INDEX idx_sm_role_email   ON sm_role_assignments (email);
CREATE INDEX idx_sm_role_ls_id   ON sm_role_assignments (line_service_id);

-- ─── 2. Migrate dữ liệu từ bảng cũ (chỉ SSO users) ──────────────────────────

-- PMO SSO: system_users WHERE is_pmo = TRUE AND account_type = 'sso'
INSERT INTO pmo_roles (email, name, status, created_at)
SELECT email, name, status, created_at
  FROM system_users
 WHERE is_pmo = TRUE AND account_type = 'sso'
ON CONFLICT (email) DO NOTHING;

-- PM SSO: pm_assignments JOIN system_users (SSO only)
INSERT INTO pm_roles (email, name, status, created_at)
SELECT su.email, su.name, su.status, pa.created_at
  FROM pm_assignments pa
  JOIN system_users su ON su.id = pa.user_id
 WHERE su.account_type = 'sso'
ON CONFLICT (email) DO NOTHING;

-- DCL SSO: dcl_assignments JOIN system_users (SSO only)
INSERT INTO dcl_roles (email, name, title, status, created_at)
SELECT su.email, su.name, da.title, su.status, da.created_at
  FROM dcl_assignments da
  JOIN system_users su ON su.id = da.user_id
 WHERE su.account_type = 'sso'
ON CONFLICT (email) DO NOTHING;

-- SM SSO: line_service_managers JOIN system_users (SSO only)
INSERT INTO sm_role_assignments (email, name, line_service_id, status, created_at)
SELECT su.email, su.name, lsm.line_service_id, su.status, lsm.created_at
  FROM line_service_managers lsm
  JOIN system_users su ON su.id = lsm.user_id
 WHERE su.account_type = 'sso'
ON CONFLICT (email, line_service_id) DO NOTHING;

-- ─── 3. Đổi audit columns sang TEXT (email) thay vì UUID FK ─────────────────

-- master_projects: imported_by (UUID FK) → imported_by_email (TEXT)
ALTER TABLE master_projects ADD COLUMN imported_by_email TEXT;
UPDATE master_projects mp
   SET imported_by_email = su.email
  FROM system_users su
 WHERE su.id = mp.imported_by;
ALTER TABLE master_projects DROP COLUMN imported_by;

-- actual_data: imported_by (UUID FK) → imported_by_email (TEXT)
ALTER TABLE actual_data ADD COLUMN imported_by_email TEXT;
UPDATE actual_data ad
   SET imported_by_email = su.email
  FROM system_users su
 WHERE su.id = ad.imported_by;
ALTER TABLE actual_data DROP COLUMN imported_by;

-- projects: created_by_id (UUID FK) → created_by_email (TEXT)
ALTER TABLE projects ADD COLUMN created_by_email TEXT;
UPDATE projects p
   SET created_by_email = su.email
  FROM system_users su
 WHERE su.id = p.created_by_id;
ALTER TABLE projects DROP COLUMN created_by_id;

-- ─── 4. Xóa bảng assignment cũ (FK-based) ────────────────────────────────────

DROP TABLE pm_assignments;
DROP TABLE dcl_assignments;
DROP TABLE line_service_managers;

-- ─── 5. Xóa SSO user entries khỏi system_users (giữ lại local admin) ─────────

DELETE FROM system_users WHERE account_type = 'sso';

COMMIT;
