-- ============================================================
-- P&L Simulation Tool — Rollback 001
-- Hoàn tác toàn bộ thay đổi của migration_001.sql
--
-- Cách chạy:
--   psql $DATABASE_URL -f sql/rollback_001.sql
--
-- CẢNH BÁO:
--   - Thao tác này XÓA HOÀN TOÀN dữ liệu của tất cả các bảng
--     được tạo trong migration_001 (system_users, line_services, ...)
--   - Các cột được thêm vào projects và versions sẽ bị xóa cùng dữ liệu
--   - KHÔNG thể hoàn tác sau khi COMMIT
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Xóa INDEXES (theo thứ tự ngược — tùy chọn vì DROP TABLE tự xóa)
--    Xóa explicit để clean khi chỉ rollback indexes mà không drop table
-- ============================================================

-- actual_data indexes
DROP INDEX IF EXISTS idx_actual_data_month;
DROP INDEX IF EXISTS idx_actual_data_proj_code;

-- versions indexes (cột mới)
DROP INDEX IF EXISTS idx_versions_status;

-- projects indexes (cột cũ + mới từ migration)
DROP INDEX IF EXISTS idx_projects_created_by;
DROP INDEX IF EXISTS idx_projects_line_svc_id;
DROP INDEX IF EXISTS idx_projects_status;

-- dcl_assignments indexes
DROP INDEX IF EXISTS idx_dcl_assign_user_id;

-- pm_assignments indexes
DROP INDEX IF EXISTS idx_pm_assign_user_id;

-- line_service_managers indexes
DROP INDEX IF EXISTS idx_lsm_line_service_id;
DROP INDEX IF EXISTS idx_lsm_user_id;

-- system_users indexes
DROP INDEX IF EXISTS idx_sys_users_status;
DROP INDEX IF EXISTS idx_sys_users_email;

-- ============================================================
-- 2. Xóa bảng actual_data
--    (không có bảng nào phụ thuộc vào bảng này)
-- ============================================================
DROP TABLE IF EXISTS actual_data;

-- ============================================================
-- 3. Revert ALTER TABLE versions
--    Xóa các cột được thêm trong migration_001
-- ============================================================
ALTER TABLE versions DROP COLUMN IF EXISTS sm_skipped;
ALTER TABLE versions DROP COLUMN IF EXISTS current_rejection_comment;
ALTER TABLE versions DROP COLUMN IF EXISTS approval_history;
ALTER TABLE versions DROP COLUMN IF EXISTS submitted_at;
ALTER TABLE versions DROP COLUMN IF EXISTS status;

-- ============================================================
-- 4. Revert ALTER TABLE projects
--    Xóa các cột được thêm trong migration_001
--    (Giữ nguyên line_id từ auth_schema.sql)
-- ============================================================
ALTER TABLE projects DROP COLUMN IF EXISTS master_project_id;
ALTER TABLE projects DROP COLUMN IF EXISTS created_by_name;
ALTER TABLE projects DROP COLUMN IF EXISTS created_by_id;
ALTER TABLE projects DROP COLUMN IF EXISTS line_service_id;

-- ============================================================
-- 5. Xóa bảng master_projects
--    (projects.master_project_id FK đã được DROP ở bước 4)
-- ============================================================
DROP TABLE IF EXISTS master_projects;

-- ============================================================
-- 6. Xóa bảng dcl_assignments
--    (phụ thuộc vào system_users — phải drop trước system_users)
-- ============================================================
DROP TABLE IF EXISTS dcl_assignments;

-- ============================================================
-- 7. Xóa bảng pm_assignments
--    (phụ thuộc vào system_users — phải drop trước system_users)
-- ============================================================
DROP TABLE IF EXISTS pm_assignments;

-- ============================================================
-- 8. Xóa bảng line_service_managers
--    (phụ thuộc vào line_services và system_users)
-- ============================================================
DROP TABLE IF EXISTS line_service_managers;

-- ============================================================
-- 9. Xóa bảng line_services
--    (line_service_managers đã được DROP ở bước 8)
-- ============================================================
DROP TABLE IF EXISTS line_services;

-- ============================================================
-- 10. Xóa bảng system_users
--     (tất cả FK references đã được giải quyết ở các bước trên)
-- ============================================================
DROP TABLE IF EXISTS system_users;

-- ============================================================
-- LƯU Ý: pgcrypto extension KHÔNG bị xóa
--   - Extension có thể đang được dùng bởi các component khác
--   - Nếu cần xóa: DROP EXTENSION IF EXISTS pgcrypto;
-- ============================================================

COMMIT;
