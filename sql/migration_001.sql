-- ============================================================
-- P&L Simulation Tool — Migration 001
-- Mở rộng schema: multi-role users, line services, workflow
--   phê duyệt, master projects, actual data
--
-- Cần chạy TRƯỚC: schema.sql, auth_schema.sql, local_auth.sql
-- Cách chạy:
--   psql $DATABASE_URL -f sql/migration_001.sql
--
-- LƯU Ý:
--   - Dùng pgcrypto để hash mật khẩu seed data (bcrypt compatible)
--   - Roles KHÔNG lưu dạng cột đơn — được tổng hợp runtime
--     từ: is_pmo (flag), pm_assignments, line_service_managers,
--     dcl_assignments
-- ============================================================

BEGIN;

-- ─── Extension: pgcrypto (dùng cho bcrypt seed data) ─────────────────────────
-- gen_random_uuid() built-in từ PG 13+, không cần extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. BẢNG system_users
--    Bảng trung tâm lưu tất cả user (local lẫn SSO)
--    Thay thế dần bảng users cũ; các bảng cũ (users, user_projects,
--    user_lines) vẫn giữ nguyên để backward compat
-- ============================================================
CREATE TABLE IF NOT EXISTS system_users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  -- Email O365 dùng để đối chiếu SSO; với local account có thể là email ảo
  email         TEXT        UNIQUE NOT NULL,
  -- Chỉ dùng cho local account (nullable với SSO)
  username      TEXT        UNIQUE,
  -- Chỉ dùng cho local account; bcrypt hash
  password_hash TEXT,
  -- 'local' | 'sso'
  account_type  TEXT        NOT NULL CHECK (account_type IN ('local', 'sso')),
  -- Quyền PMO gắn trực tiếp vào user (không qua assignment table)
  is_pmo        BOOLEAN     NOT NULL DEFAULT FALSE,
  -- 'active' | 'inactive'
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG line_services
--    Đơn vị tổ chức (tương đương lines hiện tại nhưng dùng UUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS line_services (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG line_service_managers
--    SM ↔ Line Service (nhiều-nhiều)
--    1 Line Service có thể có nhiều SM; 1 SM có thể phụ trách nhiều Line
-- ============================================================
CREATE TABLE IF NOT EXISTS line_service_managers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  line_service_id UUID        NOT NULL REFERENCES line_services(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES system_users(id)  ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (line_service_id, user_id)
);

-- ============================================================
-- 4. BẢNG pm_assignments
--    Đánh dấu user có role PM (UNIQUE user_id: mỗi user chỉ có 1 entry)
-- ============================================================
CREATE TABLE IF NOT EXISTS pm_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        UNIQUE NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. BẢNG dcl_assignments
--    Đánh dấu user có role DCL hoặc Vice DCL (quyền như nhau)
-- ============================================================
CREATE TABLE IF NOT EXISTS dcl_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        UNIQUE NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  -- 'DCL' | 'Vice DCL'
  title      TEXT        NOT NULL CHECK (title IN ('DCL', 'Vice DCL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. BẢNG master_projects
--    Danh sách dự án gốc do PMO import; PM chọn từ đây khi tạo P&L
-- ============================================================
CREATE TABLE IF NOT EXISTS master_projects (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code        TEXT        UNIQUE NOT NULL,
  project_name        TEXT        NOT NULL,
  project_description TEXT,
  start_date          DATE,
  end_date            DATE,
  -- Ví dụ: 'Fixed Price', 'T&M', ...
  project_type        TEXT,
  contract_type       TEXT,
  imported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by         UUID        REFERENCES system_users(id),
  project_manager     TEXT                                   -- username FPT (tiền tố email trước @fpt.com)
);

-- project_manager cho các bản ghi cũ (nếu bảng đã tồn tại)
ALTER TABLE master_projects
  ADD COLUMN IF NOT EXISTS project_manager TEXT;

-- ============================================================
-- 7. ALTER TABLE projects — thêm các cột mới
--    (Giữ nguyên toàn bộ cột cũ)
-- ============================================================

-- Line Service mà project này thuộc về
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS line_service_id   UUID REFERENCES line_services(id);

-- User (PM) đã tạo P&L này
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS created_by_id     UUID REFERENCES system_users(id);

-- Snapshot tên PM lúc tạo (để tránh mất tên khi user bị xóa)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS created_by_name   TEXT;

-- Master project tương ứng; UNIQUE vì mỗi master project chỉ tạo 1 P&L
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS master_project_id UUID UNIQUE REFERENCES master_projects(id);

-- ============================================================
-- 8. ALTER TABLE versions — thêm workflow approval columns
--    (Giữ nguyên toàn bộ cột cũ)
-- ============================================================

-- Trạng thái workflow:
-- 'draft' | 'pending_sm' | 'pending_pmo' | 'pending_dcl'
-- | 'approved' | 'rejected'
ALTER TABLE versions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Thời điểm PM submit phê duyệt lần đầu
ALTER TABLE versions
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Lịch sử phê duyệt dạng JSONB array, mỗi phần tử có cấu trúc:
-- {
--   "step":      "SM | PMO | DCL",
--   "userId":    "uuid string",
--   "userName":  "display name",
--   "action":    "approved | rejected | skipped",
--   "comment":   "optional string",
--   "timestamp": "ISO 8601 string"
-- }
-- action = "skipped": khi bước SM bị bỏ qua do conflict of interest
-- (PM đồng thời là SM của line — ghi nhận để audit trail)
ALTER TABLE versions
  ADD COLUMN IF NOT EXISTS approval_history JSONB NOT NULL DEFAULT '[]';

-- Comment của người phê duyệt khi reject (lần reject hiện tại)
ALTER TABLE versions
  ADD COLUMN IF NOT EXISTS current_rejection_comment TEXT;

-- true khi bước SM bị bỏ qua vì PM đồng thời là SM của Line Service
ALTER TABLE versions
  ADD COLUMN IF NOT EXISTS sm_skipped BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 9. BẢNG actual_data
--    Actual data do PMO import hàng tháng cho từng dự án
--    Dùng tham chiếu mềm (project_code TEXT, không FK cứng)
--    để tránh lỗi khi project chưa có trong hệ thống
-- ============================================================
CREATE TABLE IF NOT EXISTS actual_data (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tham chiếu mềm đến projects.code (không FK để linh hoạt khi import)
  project_code TEXT        NOT NULL,
  -- Format: 'YYYY-MM', ví dụ: '2026-01'
  month        TEXT        NOT NULL,
  -- Cấu trúc chi phí tương ứng với P&L hiện tại (linh hoạt theo thời gian)
  cost_data    JSONB       NOT NULL,
  imported_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by  UUID        REFERENCES system_users(id),
  -- Mỗi project chỉ có 1 bản ghi actual data cho mỗi tháng
  UNIQUE (project_code, month)
);

-- ============================================================
-- 10. INDEXES
-- ============================================================

-- system_users
-- (email đã có implicit index từ UNIQUE constraint, nhưng tạo thêm để đặt tên)
CREATE INDEX IF NOT EXISTS idx_sys_users_email        ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_sys_users_status       ON system_users(status);

-- line_service_managers
CREATE INDEX IF NOT EXISTS idx_lsm_user_id            ON line_service_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_lsm_line_service_id    ON line_service_managers(line_service_id);

-- pm_assignments
-- (user_id đã có implicit index từ UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_pm_assign_user_id      ON pm_assignments(user_id);

-- dcl_assignments
-- (user_id đã có implicit index từ UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_dcl_assign_user_id     ON dcl_assignments(user_id);

-- projects (cột cũ + cột mới)
CREATE INDEX IF NOT EXISTS idx_projects_status        ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_line_svc_id   ON projects(line_service_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by    ON projects(created_by_id);

-- versions (cột mới)
CREATE INDEX IF NOT EXISTS idx_versions_status        ON versions(status);

-- actual_data
CREATE INDEX IF NOT EXISTS idx_actual_data_proj_code  ON actual_data(project_code);
CREATE INDEX IF NOT EXISTS idx_actual_data_month      ON actual_data(month);

-- ============================================================
-- 11. SEED DATA — Local accounts mặc định
--
--    Dùng pgcrypto crypt() để tạo bcrypt hash trực tiếp trong SQL
--    (tương thích với bcryptjs/bcrypt npm package)
--    - admin / Admin@123
--    - pmo   / Pmo@123
-- ============================================================
INSERT INTO system_users (name, email, username, password_hash, account_type, is_pmo, status)
VALUES
  (
    'Administrator',
    'admin@system.local',
    'admin',
    crypt('Admin@123', gen_salt('bf', 10)),  -- bcrypt cost factor 10
    'local',
    TRUE,   -- admin is PMO by default
    'active'
  ),
  (
    'PMO User',
    'pmo@system.local',
    'pmo',
    crypt('Pmo@123', gen_salt('bf', 10)),    -- bcrypt cost factor 10
    'local',
    TRUE,
    'active'
  )
ON CONFLICT (email) DO NOTHING;

COMMIT;
