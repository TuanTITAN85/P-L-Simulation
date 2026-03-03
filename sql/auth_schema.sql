-- P&L Simulation — Auth & RBAC Schema
-- Run: psql $DATABASE_URL -f sql/auth_schema.sql

-- ─── Lines (SM organisational lines) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lines (
  id         BIGSERIAL PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Add line FK to projects ──────────────────────────────────────────────────
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS line_id BIGINT REFERENCES lines(id) ON DELETE SET NULL;

-- ─── Users (manual entry by PMO/DCL) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,        -- O365 UPN, always lowercase
  display_name TEXT NOT NULL DEFAULT '',
  role         TEXT NOT NULL CHECK (role IN ('pm', 'sm', 'pmo', 'dcl')),
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PM → Project assignments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_projects (
  user_email TEXT   NOT NULL,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (user_email, project_id)
);

-- ─── SM → Line assignments ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_lines (
  user_email TEXT   NOT NULL,
  line_id    BIGINT NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
  PRIMARY KEY (user_email, line_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_projects_email ON user_projects(user_email);
CREATE INDEX IF NOT EXISTS idx_user_projects_proj  ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_user_lines_email    ON user_lines(user_email);
CREATE INDEX IF NOT EXISTS idx_user_lines_line     ON user_lines(line_id);
CREATE INDEX IF NOT EXISTS idx_projects_line_id    ON projects(line_id);
