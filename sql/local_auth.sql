-- P&L Simulation — Local authentication support
-- Run AFTER auth_schema.sql
-- Command: psql -U postgres -d pl_sim -f sql/local_auth.sql

-- ─── Thêm cột password_hash vào bảng users ────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ─── Hướng dẫn tạo user Admin với mật khẩu ──────────────────────────────────
--
-- Bước 1: Sinh bcrypt hash (chạy trong terminal tại thư mục project):
--
--   node -e "import('bcryptjs').then(m => m.default.hash('YourPassword123', 10).then(console.log))"
--
-- Bước 2: Copy hash ($2a$10$...) và chạy lệnh INSERT bên dưới:
--
-- INSERT INTO users (email, display_name, role, password_hash)
-- VALUES ('admin', 'Admin', 'pmo', '$2a$10$REPLACE_WITH_HASH_FROM_STEP_1')
-- ON CONFLICT (email) DO UPDATE
--   SET password_hash = EXCLUDED.password_hash,
--       display_name  = EXCLUDED.display_name,
--       role          = EXCLUDED.role;
--
-- Bước 3: Đặt mật khẩu cho user O365 đã có sẵn (optional):
--
-- UPDATE users
-- SET password_hash = '$2a$10$REPLACE_WITH_HASH'
-- WHERE email = 'tuannm6l@fpt.com';
